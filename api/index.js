// api/index.js - TEST SIMPLE API
export default async function handler(req, res) {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
  
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  
  if (req.method === "GET") {
    return res.json({
      success: true,
      message: "✅ API IS WORKING!",
      timestamp: new Date().toISOString(),
      yourRequest: {
        method: req.method,
        url: req.url,
        query: req.query
      }
    });
  }
  
  if (req.method === "POST") {
    const { prompt } = req.body;
    return res.json({
      success: true,
      message: "✅ POST RECEIVED!",
      yourPrompt: prompt || "No prompt provided",
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}
