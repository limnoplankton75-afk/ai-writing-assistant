// api/index.js - SIMPLE WORKING API
const Groq = require("groq-sdk");

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  
  if (req.method === "GET") {
    return res.json({
      success: true,
      message: "🎉 AI API IS WORKING!",
      timestamp: new Date().toISOString(),
      endpoints: {
        "GET /": "This info",
        "POST /": "Send {prompt: 'message'}"
      }
    });
  }
  
  if (req.method === "POST") {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt required" });
      }
      
      // Call Groq
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-70b-8192",
        temperature: 0.7
      });
      
      return res.json({
        success: true,
        response: completion.choices[0]?.message?.content || "",
        model: completion.model
      });
      
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: "Method not allowed" });
};
