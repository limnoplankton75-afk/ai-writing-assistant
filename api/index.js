// api/index.js - SIMPLE WORKING VERSION
module.exports = (req, res) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.url}\`);
  
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  if (req.method === "GET") {
    return res.json({
      success: true,
      message: "🎉 AI Writing Assistant API",
      status: "ONLINE",
      timestamp: new Date().toISOString(),
      endpoints: {
        "GET /": "This info",
        "POST /": "Send JSON {prompt: 'your message'}"
      }
    });
  }
  
  if (req.method === "POST") {
    // SIMPLE RESPONSE FIRST
    return res.json({
      success: true,
      message: "✅ POST received!",
      note: "API is working. Add Groq integration next.",
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
};
