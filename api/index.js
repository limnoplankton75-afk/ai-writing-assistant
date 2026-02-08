// api/index.js - Vercel Serverless Function Handler
// AI Writing Assistant API dengan Groq SDK

const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins, bisa dibatasi nanti
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// ============================================
// ENDPOINTS
// ============================================

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'AI Writing Assistant API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: {
        method: 'GET',
        path: '/api/health',
        description: 'Health check endpoint'
      },
      generate: {
        method: 'POST',
        path: '/api/generate',
        description: 'Generate content using AI',
        params: {
          prompt: 'string (required)',
          contentType: 'string (optional)',
          tone: 'string (optional)',
          length: 'string (optional)'
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isApiKeyConfigured = !!process.env.GROQ_API_KEY;
  
  res.json({
    status: 'OK',
    message: 'AI Writing Assistant API is running',
    apiKeyConfigured: isApiKeyConfigured,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Main generate endpoint - POST only
app.post('/api/generate', async (req, res) => {
  try {
    // Validate API key
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'GROQ_API_KEY environment variable is missing'
      });
    }

    // Extract request body
    const { prompt, contentType, tone, length } = req.body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Field "prompt" is required and must be a non-empty string',
        received: { prompt, contentType, tone, length }
      });
    }

    // Build system message based on parameters
    let systemMessage = 'Anda adalah asisten AI profesional untuk menulis konten dalam bahasa Indonesia. ' +
                       'Tulis konten yang berkualitas, engaging, dan sesuai dengan permintaan pengguna.';

    // Add content type specification
    if (contentType) {
      const contentTypes = {
        'artikel': 'artikel informatif dan mendalam',
        'caption': 'caption media sosial yang menarik',
        'iklan': 'copywriting iklan yang persuasif',
        'email': 'email profesional yang sopan',
        'blog': 'blog post yang engaging dan SEO-friendly'
      };
      systemMessage += ` Tulis ${contentTypes[contentType] || contentType}.`;
    }

    // Add tone specification
    if (tone) {
      const tones = {
        'formal': 'tone formal dan profesional',
        'casual': 'tone santai dan ramah',
        'friendly': 'tone bersahabat dan hangat',
        'professional': 'tone profesional dan to-the-point',
        'persuasive': 'tone persuasif dan meyakinkan'
      };
      systemMessage += ` Gunakan ${tones[tone] || tone}.`;
    }

    // Add length specification
    if (length) {
      const lengths = {
        'short': 'singkat (1-2 paragraf)',
        'medium': 'sedang (3-5 paragraf)',
        'long': 'panjang (6+ paragraf)'
      };
      systemMessage += ` Panjang konten: ${lengths[length] || length}.`;
    }

    console.log('Generating content with:', { 
      promptLength: prompt.length, 
      contentType, 
      tone, 
      length 
    });

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile', // Model terbaik Groq
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      stream: false
    });

    // Extract generated content
    const generatedContent = completion.choices[0]?.message?.content || '';

    if (!generatedContent) {
      throw new Error('No content generated from API');
    }

    // Send successful response
    res.json({
      success: true,
      content: generatedContent,
      metadata: {
        model: completion.model,
        tokens: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        },
        finishReason: completion.choices[0]?.finish_reason || 'unknown',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error generating content:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    // Handle specific Groq API errors
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid GROQ API key. Please check your credentials.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Failed to generate content',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: {
      root: '/',
      health: '/api/health',
      generate: '/api/generate'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Export app for Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}