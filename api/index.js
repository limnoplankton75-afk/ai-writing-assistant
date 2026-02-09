// api/index.js - FINAL VERSION
const Groq = require("groq-sdk");

// Initialize Groq - menggunakan environment variable dari Vercel
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy-key-for-test"
});

module.exports = async (req, res) => {
  // LOG semua request untuk debugging
  console.log('=== API REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Time:', new Date().toISOString());
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle GET - API info
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: '🚀 AI Writing Assistant API',
      status: 'ONLINE',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        'GET /': 'This info page',
        'POST /': 'Send JSON {prompt: "your message"}',
        'GET /api': 'Same as GET /',
        'POST /api': 'Same as POST /'
      },
      example: {
        curl: "curl -X POST https://ai-writing-assistant.vercel.app/api -H 'Content-Type: application/json' -d '{\"prompt\":\"Hello AI!\"}'"
      }
    });
  }
  
  // Handle POST - Process AI request
  if (req.method === 'POST') {
    try {
      // Parse JSON body
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      
      req.on('end', async () => {
        try {
          const data = JSON.parse(body || '{}');
          const { prompt, model = "llama3-70b-8192" } = data;
          
          // Validate input
          if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return res.status(400).json({
              success: false,
              error: 'Prompt is required and must be a non-empty string'
            });
          }
          
          console.log('Processing prompt:', prompt.substring(0, 50) + '...');
          
          // Call Groq API
          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt.trim() }],
            model: model,
            temperature: 0.7,
            max_tokens: 500
          });
          
          const responseText = completion.choices[0]?.message?.content || "";
          
          console.log('Response generated:', responseText.substring(0, 50) + '...');
          
          // Success response
          return res.status(200).json({
            success: true,
            response: responseText,
            model: completion.model,
            usage: completion.usage || null,
            timestamp: new Date().toISOString()
          });
          
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          return res.status(400).json({
            success: false,
            error: 'Invalid JSON format in request body'
          });
        }
      });
      
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        note: 'Check if GROQ_API_KEY is set in Vercel environment variables'
      });
    }
  }
  
  // Method not allowed
  return res.status(405).json({
    success: false,
    error: 'Method not allowed. Use GET or POST.'
  });
};