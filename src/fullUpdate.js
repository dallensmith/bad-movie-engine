// src/fullUpdate.js
import fetchPosts from './lib/fetchWordPressPosts.js';
import normalizePosts from './lib/normalizeWordPressData.js';
import extractMovies from './lib/extractMovieInfo.js';

export default async function fullUpdate() {
  console.log('🚀 Running fullUpdate...');

  const posts = await fetchPosts();
  const normalized = normalizePosts(posts);

  const enriched = normalized.map(post => ({
    ...post,
    movies: extractMovies(post.rawHtml || ''),
  }));

  console.log(JSON.stringify(enriched, null, 2));

  return enriched;
}
/**
 * This function performs a full update of the movie data by fetching posts from a WordPress API,
 * normalizing the data, and extracting movie information from the HTML content.
 * 
 * @returns {Promise<Array>} - A promise that resolves to an array of enriched post objects
 * 
 * Example:
 * fullUpdate().then(data => console.log(data));
 */