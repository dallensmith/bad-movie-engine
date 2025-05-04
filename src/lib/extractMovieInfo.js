// src/lib/extractMovieInfo.js
import * as cheerio from 'cheerio';

/**
 * Extracts movie URL, title, and year from post HTML.
 * - Uses the <a title="…"> attribute for the movie name
 * - Reads the year from the parent element’s text (e.g. “(1985)”)
 */
export default function extractMovieInfo(html) {
  if (!html || typeof html !== 'string') return [];

  const $ = cheerio.load(html);
  const movies = [];

  // Only look at links that have both href and title
  $('a[title][href]').each((_, el) => {
    const url = $(el).attr('href').trim();
    const title = $(el).attr('title').trim();

    // Parent element’s full text will include the year, e.g. "American Commandos (1985)"
    const parentText = $(el).parent().text();
    const yearMatch = parentText.match(/\((\d{4})\)/);

    if (url && title && yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      // Only accept reasonable movie years
      if (year >= 1900 && year <= 2099) {
        movies.push({ url, title, year });
      }
    }
  });

  return movies;
}
