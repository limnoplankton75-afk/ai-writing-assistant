// api/index.js - Vercel Serverless Entry Point
// File ini adalah wrapper untuk backend/server.js agar bisa jalan di Vercel

const app = require('../backend/server');

// Export app sebagai serverless function untuk Vercel
module.exports = app;