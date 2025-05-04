/**
 * File: ~/bad-movie-engine/cronSync.js
 * Cron-friendly script for scheduled syncing
 * Supports two modes:
 * - Full: Syncs all posts
 * - Delta: Only syncs posts since the last run
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fetchAllPosts, fetchPostsSince } from './src/wordpressFetcher.js';
import { extractMoviesFromPost } from './src/movieExtractor.js';
import { enrichMovieWithTMDb } from './src/tmdbEnricher.js';
import { syncWithNocoDB } from './src/nocodbSync.js';
import { extractExperimentNumber } from './src/utils.js';

// Load environment variables
dotenv.config();

// Path to store the last sync time
const LAST_SYNC_FILE = path.join(process.cwd(), 'last_sync.json');

/**
 * Reads the last sync time from the file
 */
function getLastSyncTime() {
  try {
    if (fs.existsSync(LAST_SYNC_FILE)) {
      const data = fs.readFileSync(LAST_SYNC_FILE, 'utf8');
      const parsedData = JSON.parse(data);
      return parsedData.lastSync;
    }
  } catch (error) {
    console.error(`Error reading last sync time: ${error.message}`);
  }
  
  // Default to 1 day ago if no file exists
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return oneDayAgo.toISOString();
}

/**
 * Updates the last sync time in the file
 */
function updateLastSyncTime() {
  try {
    const data = JSON.stringify({
      lastSync: new Date().toISOString()
    });
    fs.writeFileSync(LAST_SYNC_FILE, data, 'utf8');
    console.log('Updated last sync time');
  } catch (error) {
    console.error(`Error updating last sync time: ${error.message}`);
  }
}

/**
 * Processes a list of posts, extracting movies and syncing to NocoDB
 */
async function processPosts(posts) {
  if (posts.length === 0) {
    console.log('No posts to process.');
    return;
  }
  
  console.log(`Processing ${posts.length} posts...`);
  
  let movieCount = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (const post of posts) {
    console.log(`\n📼 Processing: ${post.title}`);
    
    const experimentNumber = extractExperimentNumber(post.title);
    if (!experimentNumber) {
      console.warn(`No experiment number found in post: ${post.title}. Skipping...`);
      continue;
    }
    
    console.log(`📊 Experiment #${experimentNumber}`);
    
    // Extract movies from post content
    const movies = extractMoviesFromPost(post.content);
    
    if (movies.length === 0) {
      console.warn(`No movies found in post: ${post.title}`);
      continue;
    }
    
    console.log(`Found ${movies.length} movies in post`);
    
    // Process each movie
    for (const movie of movies) {
      movieCount++;
      
      // Add post data to movie
      const movieWithPostData = {
        ...movie,
        experiment: experimentNumber,
        post_url: post.link,
        date: post.date,
        image: post.image,
        host: post.host
      };
      
      // Enrich with TMDb data
      const yearString = movie.year ? `(${movie.year})` : '';
      console.log(`🔍 Enriching "${movie.title}" ${yearString}`);
      
      const enriched = await enrichMovieWithTMDb(
        movie.title, 
        movie.year, 
        movie.tmdbId
      );
      
      if (!enriched) {
        console.warn(`Could not find TMDb data for "${movie.title}"`);
        errorCount++;
        continue;
      }
      
      // Merge the original movie data with the enriched data
      const finalMovie = {
        ...movieWithPostData,
        ...enriched
      };
      
      // Sync with NocoDB
      console.log(`🔄 Syncing to NocoDB: ${finalMovie.title}`);
      const result = await syncWithNocoDB(finalMovie);
      
      if (result && result.success) {
        console.log(`✅ Synced: ${finalMovie.title}`);
        successCount++;
      } else {
        console.error(`❌ Failed to sync: ${finalMovie.title}`);
        errorCount++;
      }
      
      // Pause between movies to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n🏁 Processing complete:
  - Posts processed: ${posts.length}
  - Movies found: ${movieCount}
  - Successfully synced: ${successCount}
  - Errors: ${errorCount}
  `);
}

/**
 * Performs a full sync of all posts
 */
async function fullSync() {
  console.log('Starting FULL sync...');
  const posts = await fetchAllPosts();
  await processPosts(posts);
  updateLastSyncTime();
  console.log('Full sync completed.');
}

/**
 * Performs a delta sync, only processing posts since the last run
 */
async function deltaSync() {
  const lastSync = getLastSyncTime();
  console.log(`Starting DELTA sync for posts since ${lastSync}...`);
  const posts = await fetchPostsSince(lastSync);
  await processPosts(posts);
  updateLastSyncTime();
  console.log('Delta sync completed.');
}

/**
 * Main function
 */
async function main() {
  // Get sync mode from command line arguments
  const mode = process.argv[2]?.toLowerCase();
  
  try {
    if (mode === 'full') {
      await fullSync();
    } else if (mode === 'delta') {
      await deltaSync();
    } else {
      console.error('Invalid sync mode. Please use "full" or "delta".');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Sync failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();