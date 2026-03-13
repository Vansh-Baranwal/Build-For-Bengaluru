const axios = require('axios');
const config = require('../config/env');
const logger = require('../config/logger');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-70b-versatile';

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
 * System prompt for AI complaint analysis
 */
const SYSTEM_PROMPT = `You are an AI assistant that analyzes civic infrastructure complaints and extracts structured information.

Your task is to analyze complaint descriptions and return a JSON object with the following fields:
- category: one of [pothole, garbage, flooding, water leak, streetlight failure, traffic signal issue, drainage]
- severity: one of [low, medium, high]
- department: the responsible government department (e.g., "Roads and Infrastructure", "Waste Management", "Water Supply")

Guidelines:
- Choose the most appropriate category based on the complaint description
- Assess severity based on urgency, safety impact, and scale
- Identify the department most likely responsible for addressing the issue
- Return ONLY valid JSON, no additional text

Example output:
{
  "category": "pothole",
  "severity": "high",
  "department": "Roads and Infrastructure"
}`;

/**
 * Analyze a complaint description using Groq API
 * @param {string} description - The complaint description text
 * @returns {Promise<Object>} Structured complaint data { category, severity, department }
 * @throws {Error} If AI processing fails
 */
async function analyzeComplaint(description) {
  if (!description || typeof description !== 'string') {
    throw new Error('Invalid complaint description');
  }

  try {
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
            content: `Analyze this complaint and return JSON with category, severity, and department:\n\n"${description}"`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
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
      // Try to extract JSON from the response (in case there's extra text)
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
    // Handle different error types
    if (error.response) {
      // Groq API returned an error response
      logger.error({ 
        status: error.response.status, 
        data: error.response.data 
      }, 'Groq API error');
      throw new Error(`AI processing failure: ${error.response.data.error?.message || 'Unknown error'}`);
    } else if (error.request) {
      // Request was made but no response received
      logger.error('Groq API timeout or network error');
      throw new Error('AI service unavailable - network error');
    } else if (error.message.includes('Invalid JSON')) {
      // JSON parsing error
      throw new Error('AI processing failure: Invalid response format');
    } else {
      // Other errors
      logger.error({ error }, 'AI service error');
      throw new Error(`AI processing failure: ${error.message}`);
    }
  }
}

module.exports = {
  analyzeComplaint,
  VALID_CATEGORIES,
  VALID_SEVERITIES
};
