/**
 * File: ~/bad-movie-engine/src/tmdbEnricher.js
 * Module for enriching movie data with information from TMDb API
 */
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
console.log("Using TMDb API key (first 4 chars):", TMDB_API_KEY ? TMDB_API_KEY.substring(0, 4) + "..." : "Not set");

/**
 * Enriches a movie with data from TMDb
 * @param {string} title - Movie title
 * @param {string|number} year - Release year
 * @param {string} tmdbId - Optional TMDb ID if already known
 * @returns {Promise<Object|null>} Enriched movie data or null if not found
 */
export async function enrichMovieWithTMDb(title, year = null, tmdbId = null) {
  try {
    console.log(`Enriching movie: "${title}" ${year ? `(${year})` : ''} ${tmdbId ? `[TMDb ID: ${tmdbId}]` : ''}`);
    
    // If TMDb ID is provided, fetch directly
    if (tmdbId) {
      return await fetchMovieById(tmdbId);
    } 
    // Otherwise search by title and year
    else {
      return await searchMovieByTitle(title, year);
    }
  } catch (error) {
    console.error(`Error enriching movie "${title}": ${error.message}`);
    return null;
  }
}

/**
 * Fetches movie data by TMDb ID
 * @param {string|number} tmdbId - TMDb ID
 * @returns {Promise<Object|null>} Movie data or null if not found
 */
async function fetchMovieById(tmdbId) {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    console.log(`Fetching TMDb movie details for ID: ${tmdbId}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract director(s)
    let director = '';
    if (data.credits && data.credits.crew) {
      const directors = data.credits.crew
        .filter(person => person.job === 'Director')
        .map(person => person.name);
      
      director = directors.join(', ');
    }
    
    // Extract top cast
    let actors = '';
    if (data.credits && data.credits.cast) {
      const cast = data.credits.cast
        .slice(0, 5) // Top 5 cast members
        .map(person => person.name);
      
      actors = cast.join(', ');
    }
    
    // Create full poster URL if poster_path exists
    const poster = data.poster_path 
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
      : '';
    
    // Get full language name
    let language = 'Unknown';
    if (data.original_language) {
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
      
      language = languageMap[data.original_language] || data.original_language;
    }
    
    // Return structured movie data
    return {
      title: data.title,
      original_title: data.original_title,
      year: data.release_date ? data.release_date.substring(0, 4) : null,
      release_date: data.release_date,
      runtime: data.runtime,
      overview: data.overview,
      poster: poster,
      vote_average: data.vote_average,
      genres: data.genres ? data.genres.map(g => g.name) : [],
      director: director,
      actors: actors,
      studio: data.production_companies ? data.production_companies.map(c => c.name).join(', ') : '',
      country: data.production_countries ? data.production_countries.map(c => c.name).join(', ') : '',
      language: language,
      original_language: data.original_language || '',
      tmdb_id: data.id,
      imdb_id: data.imdb_id,
      tmdb_url: `https://www.themoviedb.org/movie/${data.id}`
    };
  } catch (error) {
    console.error(`Error fetching movie by ID ${tmdbId}: ${error.message}`);
    return null;
  }
}

/**
 * Searches for a movie by title and optional year
 * @param {string} title - Movie title
 * @param {string|number} year - Optional release year
 * @returns {Promise<Object|null>} Most relevant movie match or null
 */
async function searchMovieByTitle(title, year = null) {
  try {
    const query = encodeURIComponent(title.replace(/['""]/g, "'"));
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`;
    
    // Add year if provided
    if (year) {
      url += `&year=${year}`;
    }
    
    console.log(`Searching for movie: "${title}" ${year ? `(${year})` : ''}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDb search error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    // If we have a year, try to find an exact match
    if (year) {
      const exactMatch = data.results.find(movie => 
        movie.release_date && movie.release_date.substring(0, 4) === year.toString()
      );
      
      if (exactMatch) {
        return await fetchMovieById(exactMatch.id);
      }
    }
    
    // Otherwise get details for the first (most relevant) result
    return await fetchMovieById(data.results[0].id);
  } catch (error) {
    console.error(`Error searching for movie "${title}": ${error.message}`);
    return null;
  }
}