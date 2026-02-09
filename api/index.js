// api/index.js - ULTRA SIMPLE
module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    success: true,
    message: "🎉 API FINALLY WORKING!",
    time: new Date().toISOString(),
    path: req.url,
    method: req.method
  }));
};
