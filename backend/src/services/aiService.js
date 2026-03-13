const axios = require('axios');
const config = require('../config/env');
const logger = require('../config/logger');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'llama-3.3-70b-versatile'; 
const WHISPER_MODEL = 'whisper-large-v3';

// Valid departmental groups for government routing
const VALID_DEPARTMENTS = [
  'BBMP',
  'Traffic Police',
  'Cleaning Work',
  'Others'
];

// Valid issue types for internal prioritization
const VALID_ISSUE_TYPES = [
  'Emergency',
  'Recurring',
  'Regular Problem',
  'Trends'
];

// Valid severity levels
const VALID_SEVERITIES = ['low', 'medium', 'high'];

/**
 * System prompt for AI complaint analysis (Vision enabled)
 */
const SYSTEM_PROMPT = `You are an AI assistant that analyzes civic infrastructure complaints and extracts structured information for government officials.
You will be provided with a description and optionally an image of the issue.

Your task is to analyze the evidence and return a JSON object with the following fields:
- category: The specific type of issue (e.g., "pothole", "garbage dump", "broken signal")
- severity: one of [low, medium, high]
- department_group: one of [BBMP, Traffic Police, Cleaning Work, Others]
- issue_type: one of [Emergency, Recurring, Regular Problem, Trends]

Classification Logic:
1. BBMP: Roads, structural issues, construction, illegal buildings, water/drainage.
2. Traffic Police: Anything related to vehicle movement, signals, parking, or accidents.
3. Cleaning Work: Garbage collection, sewage overflow, animal carcasses, public toilets.
4. Others: Any civic issue not fitting above.

Issue Type Logic:
- Emergency: Life-threatening or major infrastructure collapse (floods, live wires, deep potholes on main roads).
- Recurring: Issues that sound like they happen often (e.g., "this signal is broken again", "garbage always piles up here").
- Trends: Widespread issues mentioned as affecting many people or a whole area.
- Regular Problem: Standard single occurrences.

Extremely Important Guidelines:
1. If an image is provided, PRIORITIZE visual evidence for severity. 
2. Return ONLY valid JSON, no additional text.

Example output:
{
  "category": "pothole",
  "severity": "high",
  "department_group": "BBMP",
  "issue_type": "Emergency"
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
      logger.error({ 
        aiContent, 
        parseError: parseError.message,
        errorExcerpt: aiContent.substring(0, 100)
      }, 'Failed to parse AI response');
      throw new Error(`Invalid JSON response from AI service: ${parseError.message}`);
    }

    // Validate the response structure
    if (!parsedData.department_group || !parsedData.severity || !parsedData.issue_type) {
      throw new Error('AI response missing required fields');
    }

    // Validate department_group
    if (!VALID_DEPARTMENTS.includes(parsedData.department_group)) {
      logger.warn({ department_group: parsedData.department_group }, 'Invalid department_group from AI, using default');
      parsedData.department_group = 'Others';
    }

    // Validate issue_type
    if (!VALID_ISSUE_TYPES.includes(parsedData.issue_type)) {
      logger.warn({ issue_type: parsedData.issue_type }, 'Invalid issue_type from AI, using default');
      parsedData.issue_type = 'Regular Problem';
    }

    // Validate severity
    if (!VALID_SEVERITIES.includes(parsedData.severity)) {
      logger.warn({ severity: parsedData.severity }, 'Invalid severity from AI, using default');
      parsedData.severity = 'medium'; // Default fallback
    }

    return {
      category: parsedData.category || 'general',
      severity: parsedData.severity,
      department_group: parsedData.department_group,
      issue_type: parsedData.issue_type
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
  VALID_DEPARTMENTS,
  VALID_ISSUE_TYPES,
  VALID_SEVERITIES
};
