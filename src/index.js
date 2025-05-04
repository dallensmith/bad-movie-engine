// src/index.js
import 'dotenv/config';
import { fetchWordPressPosts } from './lib/fetchWordPressPosts.js';
import normalizePosts           from './lib/normalizeWordPressData.js';
import extractMoviesFromPost    from './lib/extractMovieInfo.js';
import enrichMovieWithTMDb      from './lib/tmdbEnricher.js';
import upsertToNocoDB           from './lib/upsertToNocoDB.js';

async function main() {
  console.log('📦 Environment loaded. Starting fullUpdate pipeline…');

  // 1) Fetch raw posts
  console.log('🌐 Fetching posts from WordPress…');
  const raw = await fetchWordPressPosts();

  // 2) Normalize shape (title, date, author, featuredImage, categories, tags, rawHtml…)
  console.log(`🔄 Normalizing ${raw.length} posts…`);
  const posts = normalizePosts(raw);

  // 3) For each post, extract, enrich, and upsert each movie
  for (const post of posts) {
    console.log(`\n📼 Post: ${post.title} (${post.date}) by ${post.author}`);
    console.log(`   ▸ Featured Image: ${post.featuredImage}`);
    console.log(`   ▸ Categories: ${post.categories.join(', ')}`);
    console.log(`   ▸ Tags: ${post.tags.join(', ')}`);

    const movies = extractMoviesFromPost(post.rawHtml);
    for (const m of movies) {
      console.log(`   🎬 Found: ${m.title} (${m.year})`);
      const tmdb = await enrichMovieWithTMDb(m.title, m.year, m.tmdbId);
      const record = { ...post, ...m, ...(tmdb || {}) };
      await upsertToNocoDB(record);
      console.log(`     ✅ Synced "${m.title}" to NocoDB`);
    }
  }
}

main().catch(err => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
