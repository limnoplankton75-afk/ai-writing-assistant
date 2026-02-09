// api/index.js - Handle semua request
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
  // Handle semua path
  const path = req.url;
  
  // Jika bukan /api, redirect ke /api
  if (path !== '/api' && !path.startsWith('/api/')) {
    return res.writeHead(302, { Location: '/api' }).end();
  }
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    return res.json({
      message: '🤖 AI Writing Assistant API',
      status: 'online',
      endpoints: {
        'POST /api': 'Send JSON {prompt: "your message"}'
      }
    });
  }
  
  if (req.method === 'POST') {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt required' });
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-70b-8192",
        temperature: 0.7
      });
      
      return res.json({
        success: true,
        response: completion.choices[0]?.message?.content || ""
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};