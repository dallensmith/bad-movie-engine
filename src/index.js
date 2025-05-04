/**
 * File: ~/bad-movie-engine/src/index.js
 * Main entry point for the Bad Movie Engine
 * This application scrapes movie data from WordPress posts, 
 * enriches it with TMDb data, and syncs to NocoDB.
 */
import dotenv from 'dotenv';
import { fetchAllPosts } from './wordpressFetcher.js';
import { extractMoviesFromPost } from './movieExtractor.js';
import { enrichMovieWithTMDb } from './tmdbEnricher.js';
import { syncWithNocoDB } from './nocodbSync.js';
import { extractExperimentNumber } from './utils.js';

// Load environment variables
dotenv.config();

// Check environment variables
console.log('Environment check:');
console.log('WORDPRESS_URL:', process.env.WORDPRESS_URL ? 'Set' : 'Not set');
console.log("TMDB API Key length:", process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.length : "Not set");
console.log('NOCODB_API_TOKEN:', process.env.NOCODB_API_TOKEN ? 'Set' : 'Not set');

/**
 * Main function that orchestrates the entire process
 */
async function main() {
  try {
    console.log('Bad Movie Engine starting...');
    
    // 1. Fetch all posts from WordPress
    console.log('Fetching all posts from WordPress...');
    const posts = await fetchAllPosts();
    console.log(`Fetched ${posts.length} posts from WordPress`);
    
    if (posts.length === 0) {
      console.warn('No posts found to process. Exiting...');
      return;
    }
    
    // Process each post
    for (const post of posts) {
      console.log(`\n📼 Processing: ${post.title}`);
      
      const experimentNumber = extractExperimentNumber(post.title);
      if (!experimentNumber) {
        console.warn(`No experiment number found in post: ${post.title}. Skipping...`);
        continue;
      }
      
      console.log(`📊 Experiment #${experimentNumber}`);
      
      // 2. Extract movies from post content
      const movies = extractMoviesFromPost(post.content);
      
      if (movies.length === 0) {
        console.warn(`No movies found in post: ${post.title}`);
        continue;
      }
      
      console.log(`Found ${movies.length} movies in post`);
      
      // 3. Process each movie
      for (const movie of movies) {
        // Add post data to movie
        const movieWithPostData = {
          ...movie,
          experiment: experimentNumber,
          post_url: post.link,
          date: post.date,
          image: post.image,
          host: post.host
        };
        
        // 4. Enrich with TMDb data
        const yearString = movie.year ? `(${movie.year})` : '';
        console.log(`🔍 Enriching "${movie.title}" ${yearString}`);
        
        const enriched = await enrichMovieWithTMDb(
          movie.title, 
          movie.year, 
          movie.tmdbId
        );
        
        if (!enriched) {
          console.warn(`Could not find TMDb data for "${movie.title}"`);
          continue;
        }
        
        // Merge the original movie data with the enriched data
        const finalMovie = {
          ...movieWithPostData,
          ...enriched
        };
        
        // 5. Sync with NocoDB
        console.log(`🔄 Syncing to NocoDB: ${finalMovie.title}`);
        const result = await syncWithNocoDB(finalMovie);
        
        if (result && result.success) {
          console.log(`✅ Synced: ${finalMovie.title}`);
        } else {
          console.error(`❌ Failed to sync: ${finalMovie.title}`);
        }
        
        // Pause between movies to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('Bad Movie Engine completed successfully!');
  } catch (error) {
    console.error(`Bad Movie Engine failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();