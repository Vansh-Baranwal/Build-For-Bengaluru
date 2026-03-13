const axios = require('axios');
const logger = require('../config/logger');

const GNEWS_API_URL = 'https://gnews.io/api/v4/search';
const API_KEY = process.env.GNEWS_API_KEY;

/**
 * Fetch civic infrastructure news for Bengaluru from GNews
 * @returns {Promise<Array>} Array of news articles
 */
async function fetchCityNews() {
  if (!API_KEY) {
    logger.warn('GNEWS_API_KEY is not configured. News feature will be disabled.');
    return [];
  }

  try {
    // Search query focusing on Bengaluru civic issues
    const query = 'Bengaluru (potholes OR flooding OR garbage OR infrastructure OR traffic OR "civic issues")';
    
    logger.debug({ query }, 'Fetching city news from GNews');
    
    const response = await axios.get(GNEWS_API_URL, {
      params: {
        q: query,
        lang: 'en',
        country: 'in',
        max: 10,
        apikey: API_KEY,
        sortby: 'publishedAt'
      }
    });

    if (response.data && response.data.articles) {
      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        image: article.image,
        publishedAt: article.publishedAt,
        source: article.source ? article.source.name : 'Unknown source'
      }));
    }

    return [];
  } catch (error) {
    logger.error({ 
      error: error.message, 
      response: error.response ? error.response.data : null 
    }, 'Error fetching news from GNews');
    
    // Return empty array instead of throwing to prevent crashing the dashboard
    return [];
  }
}

module.exports = {
  fetchCityNews
};
