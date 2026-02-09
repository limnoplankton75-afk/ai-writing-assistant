// api/index.js - UPDATED SERVERLESS FUNCTION
const Groq = require("groq-sdk");

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "your-api-key-here" // Fallback for local dev
});

// Cache untuk menyimpan history percakapan (opsional, sederhana)
const chatHistory = new Map();
const MAX_HISTORY_LENGTH = 10;

module.exports = async (req, res) => {
  // Handle CORS - IMPROVED VERSION
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, PATCH, DELETE, POST, PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    'Access-Control-Max-Age': '86400', // 24 jam cache untuk preflight
  };

  // Apply CORS headers to all responses
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    // Untuk GET request, berikan info API
    if (req.method === 'GET') {
      return res.status(200).json({
        message: 'Groq API Proxy Server',
        status: 'active',
        endpoints: {
          '/': 'POST request dengan body {prompt, model, temperature, max_tokens}',
          'models': 'GET /models untuk list model yang tersedia'
        },
        example: {
          method: 'POST',
          body: {
            prompt: 'Apa itu AI?',
            model: 'llama3-70b-8192',
            temperature: 0.7,
            max_tokens: 1024
          }
        }
      });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse JSON body
    let body;
    try {
      body = req.body;
      // Jika body masih buffer/string, parse JSON
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString());
      }
    } catch (parseError) {
      return res.status(400).json({ 
        error: 'Invalid JSON body', 
        details: parseError.message 
      });
    }

    const { 
      prompt, 
      model = "llama3-70b-8192", 
      temperature = 0.7, 
      max_tokens = 1024,
      stream = false,
      session_id,
      system_prompt
    } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt is required and must be a non-empty string' 
      });
    }

    // Validate and sanitize parameters
    const sanitizedTemperature = Math.min(Math.max(parseFloat(temperature), 0.1), 2.0);
    const sanitizedMaxTokens = Math.min(parseInt(max_tokens) || 1024, 8192);

    // Handle chat history jika ada session_id
    let messages = [];
    
    if (system_prompt) {
      messages.push({
        role: "system",
        content: system_prompt
      });
    }

    if (session_id && chatHistory.has(session_id)) {
      // Tambahkan history percakapan sebelumnya
      messages = [...chatHistory.get(session_id), ...messages];
    }

    // Tambahkan prompt user saat ini
    messages.push({
      role: "user",
      content: prompt.trim()
    });

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: model,
      temperature: sanitizedTemperature,
      max_tokens: sanitizedMaxTokens,
      stream: stream
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Update chat history jika ada session_id
    if (session_id) {
      const currentHistory = chatHistory.get(session_id) || [];
      // Tambahkan user message dan assistant response
      currentHistory.push(
        { role: "user", content: prompt.trim() },
        { role: "assistant", content: responseText }
      );
      // Batasi history length
      if (currentHistory.length > MAX_HISTORY_LENGTH * 2) {
        currentHistory.splice(0, currentHistory.length - MAX_HISTORY_LENGTH * 2);
      }
      chatHistory.set(session_id, currentHistory);
    }

    // Response object yang lebih informatif
    const responseData = {
      success: true,
      response: responseText,
      model: completion.model,
      usage: completion.usage || null,
      session_id: session_id || null,
      history_length: session_id ? (chatHistory.get(session_id)?.length || 0) / 2 : 0
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Groq API Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Error handling yang lebih spesifik
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message?.includes('API key')) {
      statusCode = 401;
      errorMessage = 'Invalid or missing API key';
    } else if (error.message?.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.message?.includes('model')) {
      statusCode = 400;
      errorMessage = 'Invalid model specified';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code || 'INTERNAL_ERROR'
    });
  }
};