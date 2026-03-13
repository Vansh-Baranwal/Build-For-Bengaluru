const axios = require('axios');
const config = require('../config/env');
const logger = require('../config/logger');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'llama-3.2-11b-vision-preview'; 
const WHISPER_MODEL = 'whisper-large-v3';

// Valid categories for complaint classification
const VALID_CATEGORIES = [
  'pothole',
  'garbage',
  'flooding',
  'water leak',
  'streetlight failure',
  'traffic signal issue',
  'drainage'
];

// Valid severity levels
const VALID_SEVERITIES = ['low', 'medium', 'high'];

/**
 * System prompt for AI complaint analysis (Vision enabled)
 */
const SYSTEM_PROMPT = `You are an AI assistant that analyzes civic infrastructure complaints and extracts structured information.
You will be provided with a description and optionally an image of the issue.

Your task is to analyze the evidence and return a JSON object with the following fields:
- category: one of [pothole, garbage, flooding, water leak, streetlight failure, traffic signal issue, drainage]
- severity: one of [low, medium, high]
- department: the responsible government department (e.g., "Roads and Infrastructure", "Waste Management", "Water Supply")

Extremely Important Guidelines:
1. If an image is provided, PRIORITIZE visual evidence for severity. 
   - A massive pothole or high-level flooding is "high" severity.
   - A small garbage pile is "low", a massive dump is "medium" or "high".
2. Choose the most appropriate category.
3. Return ONLY valid JSON, no additional text.

Example output:
{
  "category": "pothole",
  "severity": "high",
  "department": "Roads and Infrastructure"
}`;

/**
 * Analyze a complaint description (and optional image) using Groq Vision API
 * @param {string} description - The complaint description text
 * @param {string} [imageUrl] - Optional public URL of the complaint image
 * @returns {Promise<Object>} Structured complaint data { category, severity, department }
 * @throws {Error} If AI processing fails
 */
async function analyzeComplaint(description, imageUrl = null) {
  if (!description || typeof description !== 'string') {
    throw new Error('Invalid complaint description');
  }

  try {
    const userContent = [
      {
        type: "text",
        text: `Analyze this complaint and return JSON with category, severity, and department:\n\n"${description}"`
      }
    ];

    if (imageUrl) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.1, // Lower temperature for even more precision
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Increased timeout for vision
      }
    );

    // Extract and parse the AI response
    const aiContent = response.data.choices[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('Empty response from Groq API');
    }

    // Parse JSON response
    let parsedData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(aiContent);
      }
    } catch (parseError) {
      logger.error({ aiContent, parseError }, 'Failed to parse AI response');
      throw new Error('Invalid JSON response from AI service');
    }

    // Validate the response structure
    if (!parsedData.category || !parsedData.severity || !parsedData.department) {
      throw new Error('AI response missing required fields');
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(parsedData.category)) {
      logger.warn({ category: parsedData.category }, 'Invalid category from AI, using default');
      parsedData.category = 'garbage'; // Default fallback
    }

    // Validate severity
    if (!VALID_SEVERITIES.includes(parsedData.severity)) {
      logger.warn({ severity: parsedData.severity }, 'Invalid severity from AI, using default');
      parsedData.severity = 'medium'; // Default fallback
    }

    return {
      category: parsedData.category,
      severity: parsedData.severity,
      department: parsedData.department
    };

  } catch (error) {
    if (error.response) {
      logger.error({ 
        status: error.response.status, 
        data: error.response.data 
      }, 'Groq API error');
      throw new Error(`AI processing failure: ${error.response.data.error?.message || 'Unknown error'}`);
    } else {
      logger.error({ error }, 'AI service error');
      throw new Error(`AI processing failure: ${error.message}`);
    }
  }
}

/**
 * Transcribe audio buffer using Groq Whisper API
 * @param {Buffer} audioBuffer - The audio file buffer
 * @param {string} filename - The original filename
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioBuffer, filename) {
  const FormData = require('form-data');
  const formData = new FormData();
  
  formData.append('file', audioBuffer, {
    filename: filename || 'recording.webm',
    contentType: 'audio/webm' // Default to webm as it's common for browser recording
  });
  formData.append('model', WHISPER_MODEL);

  try {
    const response = await axios.post(
      GROQ_AUDIO_URL,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${config.groq.apiKey}`
        }
      }
    );

    return response.data.text;
  } catch (error) {
    logger.error({ 
      error: error.message,
      data: error.response?.data
    }, 'Groq Audio transcription error');
    throw new Error('Failed to transcribe audio complaint');
  }
}

module.exports = {
  analyzeComplaint,
  transcribeAudio,
  VALID_CATEGORIES,
  VALID_SEVERITIES
};
