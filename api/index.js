// api/index.js - Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI Writing Assistant API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      generate: '/api/generate (POST)'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    apiKeyConfigured: !!process.env.GROQ_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Generate content
app.post('/api/generate', async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: 'API key not configured'
      });
    }

    const { prompt, contentType, tone, length } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required field: prompt'
      });
    }

    let systemMessage = 'Anda adalah asisten AI untuk menulis konten dalam bahasa Indonesia.';
    
    if (contentType) systemMessage += ` Tulis ${contentType}.`;
    if (tone) systemMessage += ` Gunakan tone ${tone}.`;
    if (length) systemMessage += ` Panjang: ${length}.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = completion.choices[0]?.message?.content || '';

    res.json({
      success: true,
      content: content,
      metadata: {
        model: completion.model,
        tokens: completion.usage
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Failed to generate content',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: ['/', '/api/health', '/api/generate']
  });
});

// Export for Vercel
module.exports = app;