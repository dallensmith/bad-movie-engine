/**
 * File: ~/bad-movie-engine/src/utils.js
 * Utility functions for the Bad Movie Engine
 */

/**
 * Extracts the experiment number from a title string
 * @param {string} title - The title containing an experiment number
 * @returns {string|null} The extracted experiment number or null
 */
export function extractExperimentNumber(title) {
    if (!title) return null;
    
    const match = title.match(/Experiment\s*#?(\d+)/i);
    return match ? match[1] : null;
  }
  
  /**
   * Extracts the date part from an ISO date string
   * @param {string} isoDateString - ISO date string
   * @returns {string|null} Date in YYYY-MM-DD format or null
   */
  export function extractPostDate(isoDateString) {
    return isoDateString?.split('T')[0] || null;
  }
  
  /**
   * Extracts TMDb links from HTML content
   * @param {string} html - HTML content to parse
   * @returns {Array<string>} Array of TMDb URLs
   */
  export function extractTMDBLinks(html) {
    if (!html) return [];
    
    const links = [];
    const regex = /https?:\/\/(?:www\.)?themoviedb\.org\/movie\/\d+(?:-[^"'\s]+)?/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      links.push(match[0]);
    }
    
    return links;
  }
  
  /**
   * Sleep for a specified number of milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }