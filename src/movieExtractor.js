/**
 * File: ~/bad-movie-engine/src/movieExtractor.js
 * Module for extracting movie information from post content
 */
import * as cheerio from 'cheerio';

/**
 * Extracts movie information from a post's HTML content
 * @param {string} html - The HTML content of the post
 * @returns {Array} Array of movie objects with basic information
 */
export function extractMoviesFromPost(html) {
  if (!html) {
    console.warn('Empty HTML content provided to extractMoviesFromPost');
    return [];
  }

  const $ = cheerio.load(html);
  const movies = [];

  // Extract TMDB links
  $('a[href*="themoviedb.org/movie/"]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();

    if (href && text) {
      // Extract TMDB ID and slug from the URL
      const match = href.match(/themoviedb\.org\/movie\/(\d+)(?:-([\w-]+))?/);
      if (match) {
        const tmdbId = match[1];
        const slug = match[2] ? match[2].replace(/-/g, ' ') : '';

        // Try to extract title and year from the link text
        const titleMatch = text.match(/^(.*?)(?:\s*\((\d{4})\))?$/);
        const title = titleMatch ? titleMatch[1].trim() : text;
        const year = titleMatch && titleMatch[2] ? parseInt(titleMatch[2]) : null;

        movies.push({
          title,
          year,
          tmdbId,
          tmdb_url: href,
          raw_link: href,
          source: 'tmdb'
        });
      }
    }
  });

  // Extract IMDB links as fallback
  $('a[href*="imdb.com/title/"]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();

    // Skip if we already have this movie from TMDB
    if (text && movies.some(m => m.title.toLowerCase() === text.toLowerCase())) {
      return;
    }

    if (href && text) {
      // Extract IMDB ID from the URL
      const match = href.match(/imdb\.com\/title\/(tt\d+)/);
      if (match) {
        const imdbId = match[1];

        // Try to extract title and year from the link text
        const titleMatch = text.match(/^(.*?)(?:\s*\((\d{4})\))?$/);
        const title = titleMatch ? titleMatch[1].trim() : text;
        const year = titleMatch && titleMatch[2] ? parseInt(titleMatch[2]) : null;

        movies.push({
          title,
          year,
          imdbId,
          imdb_url: href,
          raw_link: href,
          source: 'imdb'
        });
      }
    }
  });

  console.log(`Extracted ${movies.length} movies from post content`);
  return movies;
}