// api/index.js - FINAL FIXED VERSION
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy-key"
});

module.exports = async (req, res) => {
  console.log(`📨 Request: ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle semua path (/api, /, dll) sama saja
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: '🤖 AI Writing Assistant API',
      status: 'ONLINE',
      endpoints: {
        'GET /': 'API info',
        'POST /': 'Send {prompt: "your message"}',
        'GET /api': 'Same as GET /',
        'POST /api': 'Same as POST /'
      },
      example: {
        curl: 'curl -X POST https://ai-writing-assistant.vercel.app/api -H "Content-Type: application/json" -d \'{"prompt":"Hello"}\''
      }
    });
  }
  
  if (req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      
      req.on('end', async () => {
        try {
          const data = JSON.parse(body || '{}');
          const { prompt } = data;
          
          if (!prompt) {
            return res.status(400).json({
              success: false,
              error: 'Prompt is required'
            });
          }
          
          console.log(`Processing: "${prompt.substring(0, 30)}..."`);
          
          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192",
            temperature: 0.7,
            max_tokens: 500
          });
          
          const response = completion.choices[0]?.message?.content || "";
          
          return res.status(200).json({
            success: true,
            response: response,
            model: completion.model,
            usage: completion.usage
          });
          
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid JSON'
          });
        }
      });
      
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    return; // Important!
  }
  
  res.status(405).json({ error: 'Method not allowed' });
};