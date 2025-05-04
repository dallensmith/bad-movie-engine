/**
 * File: ~/bad-movie-engine/src/nocodbSync.js
 * Module for syncing data with NocoDB
 */
import fetch from 'node-fetch';

// NocoDB configuration
const NOCODB_URL = process.env.NOCODB_URL || 'https://portal.dasco.services';
const PROJECT_ID = process.env.NOCODB_PROJECT_ID || 'ppucstzqjsxvf2y';
const TABLE_ID = process.env.NOCODB_TABLE_ID || 'm1mabuzifrwzg1h';
const API_TOKEN = process.env.NOCODB_API_TOKEN;

// Construct base URL
const BASE_URL = `${NOCODB_URL}/api/v1/db/data/v1/${PROJECT_ID}/${TABLE_ID}`;

/**
 * Syncs a movie entry with NocoDB (create or update)
 * @param {Object} movie - Movie object to sync
 * @returns {Promise<Object>} Result object
 */
export async function syncWithNocoDB(movie) {
  try {
    if (!movie || !movie.experiment) {
      throw new Error('Movie must have an experiment number');
    }
    
    // Clean experiment number
    const experimentNumber = cleanExperimentNumber(movie.experiment);
    
    // Prepare payload for NocoDB
    const payload = prepareMoviePayload(movie, experimentNumber);
    
    // Check if record already exists
    const existing = await findExistingRecord(experimentNumber, movie.title);
    
    // Update or create record
    if (existing) {
      return await updateRecord(existing.Id, payload);
    } else {
      return await createRecord(payload);
    }
  } catch (error) {
    console.error(`Failed to sync with NocoDB: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Clean experiment number to just digits
 * @param {string|number} experiment - Experiment number
 * @returns {string} Cleaned experiment number
 */
function cleanExperimentNumber(experiment) {
  if (!experiment) return '';
  return experiment.toString().replace(/[^\d]/g, '');
}

/**
 * Finds an existing record in NocoDB
 * @param {string} experiment - Experiment number
 * @param {string} title - Movie title
 * @returns {Promise<Object|null>} Existing record or null
 */
async function findExistingRecord(experiment, title) {
  try {
    if (!API_TOKEN) {
      throw new Error('API token is not set');
    }
    
    const encodedTitle = encodeURIComponent(title);
    const url = `${BASE_URL}?where=(experiment,eq,${experiment})~and(title,like,${encodedTitle})`;
    
    const response = await fetch(url, {
      headers: {
        'xc-token': API_TOKEN
      }
    });
    
    if (!response.ok) {
      throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.list && data.list.length > 0 ? data.list[0] : null;
  } catch (error) {
    console.error(`Error finding existing record: ${error.message}`);
    return null;
  }
}

/**
 * Updates an existing record in NocoDB
 * @param {string} recordId - Record ID to update
 * @param {Object} payload - Data payload
 * @returns {Promise<Object>} Result object
 */
async function updateRecord(recordId, payload) {
  try {
    if (!API_TOKEN) {
      throw new Error('API token is not set');
    }
    
    const url = `${BASE_URL}/${recordId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': API_TOKEN
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update record: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`Updated record ${recordId} in NocoDB`);
    
    return {
      success: true,
      operation: 'update',
      id: recordId,
      data
    };
  } catch (error) {
    console.error(`Error updating record: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a new record in NocoDB
 * @param {Object} payload - Data payload
 * @returns {Promise<Object>} Result object
 */
async function createRecord(payload) {
  try {
    if (!API_TOKEN) {
      throw new Error('API token is not set');
    }
    
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': API_TOKEN
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create record: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`Created new record in NocoDB with ID ${data.Id}`);
    
    return {
      success: true,
      operation: 'create',
      id: data.Id,
      data
    };
  } catch (error) {
    console.error(`Error creating record: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Prepares a movie payload for NocoDB
 * @param {Object} movie - Movie object
 * @param {string} experimentNumber - Cleaned experiment number
 * @returns {Object} Formatted payload
 */
function prepareMoviePayload(movie, experimentNumber) {
  // Convert language code to full name if needed
  let language = movie.language || '';
  
  // If language looks like a 2-letter code, try to convert it
  if (language && language.length === 2) {
    const languageMap = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'tr': 'Turkish',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'pl': 'Polish',
      'hu': 'Hungarian',
      'cs': 'Czech',
      'th': 'Thai'
    };
    
    language = languageMap[language] || language;
  }
  
  return {
    experiment: experimentNumber,
    title: movie.title || '',
    link: movie.post_url || movie.link || '',
    date: movie.date || null,
    image: movie.image || '',
    host: movie.host || movie.author || '',
    year: movie.year || '',
    poster: movie.poster || '',
    synopsis: movie.overview || '',
    average_rating: movie.vote_average || movie.average_rating || '',
    director: movie.director || '',
    actors: movie.actors || '',
    studio: movie.studio || movie.production_companies || '',
    country: movie.country || movie.production_countries || '',
    genres: Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || '',
    runtime: movie.runtime || '',
    language: language,
    imdb: movie.imdb_id || '',
    tmdb: movie.tmdb_id || ''
  };
}