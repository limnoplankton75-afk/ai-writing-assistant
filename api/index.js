// api/index.js - CORRECT SERVERLESS FUNCTION
const Groq = require("groq-sdk");

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model = "llama3-70b-8192" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 1024
    });

    const responseText = completion.choices[0]?.message?.content || "";

    res.status(200).json({
      success: true,
      response: responseText
    });

  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};