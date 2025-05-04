/**
 * File: ~/bad-movie-engine/src/wordpressFetcher.js
 * Module for fetching posts from WordPress
 */
import fetch from 'node-fetch';
import { extractExperimentNumber } from './utils.js';

/**
 * Fetches recent posts from the WordPress API
 * @returns {Promise<Array>} Array of processed post objects
 */
export async function fetchRecentPosts() {
  try {
    console.log('Fetching recent posts from WordPress API');
    
    const response = await fetch(process.env.WORDPRESS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
    
    const posts = await response.json();
    console.log(`Retrieved ${posts.length} posts from WordPress`);
    
    // Process each post
    return posts.map(post => ({
      id: post.id,
      title: post.title?.rendered || '',
      date: post.date ? post.date.split('T')[0] : null,
      content: post.content?.rendered || '',
      link: post.link,
      excerpt: post.excerpt?.rendered || '',
      image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
      host: post._embedded?.['author']?.[0]?.name || '',
      author: post._embedded?.['author']?.[0]?.name || ''
    }));
  } catch (error) {
    console.error(`Failed to fetch WordPress posts: ${error.message}`);
    return [];
  }
}

/**
 * Fetches all posts from the WordPress API using pagination
 * @returns {Promise<Array>} Array of all processed post objects
 */
export async function fetchAllPosts() {
  try {
    console.log('Fetching all posts from WordPress API');
    
    let allPosts = [];
    let page = 1;
    let hasMorePages = true;
    
    // Get base URL without the page parameter
    const baseUrlParts = process.env.WORDPRESS_URL.split('?');
    const baseUrl = baseUrlParts[0];
    const params = new URLSearchParams(baseUrlParts[1] || '');
    
    // Ensure _embed parameter is set for author and media info
    params.set('_embed', 'true');
    
    while (hasMorePages) {
      // Set the current page
      params.set('page', page.toString());
      
      const url = `${baseUrl}?${params.toString()}`;
      console.log(`Fetching page ${page}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 400) {
          // No more pages
          hasMorePages = false;
          continue;
        }
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
      }
      
      const posts = await response.json();
      if (posts.length === 0) {
        hasMorePages = false;
        continue;
      }
      
      // Process each post
      const processedPosts = posts.map(post => ({
        id: post.id,
        title: post.title?.rendered || '',
        date: post.date ? post.date.split('T')[0] : null,
        content: post.content?.rendered || '',
        link: post.link,
        excerpt: post.excerpt?.rendered || '',
        image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
        host: post._embedded?.['author']?.[0]?.name || '',
        author: post._embedded?.['author']?.[0]?.name || ''
      }));
      
      allPosts = [...allPosts, ...processedPosts];
      console.log(`Retrieved ${posts.length} posts from page ${page}`);
      
      page++;
      
      // Add a short delay to avoid hammering the server
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`Retrieved ${allPosts.length} total posts`);
    return allPosts;
  } catch (error) {
    console.error(`Failed to fetch all posts: ${error.message}`);
    return [];
  }
}

/**
 * Fetches posts newer than a specified date
 * @param {string} sinceDate - ISO format date to fetch posts after
 * @returns {Promise<Array>} Array of processed post objects
 */
export async function fetchPostsSince(sinceDate) {
  try {
    console.log(`Fetching posts since ${sinceDate}`);
    
    // Get base URL without the page parameter
    const baseUrlParts = process.env.WORDPRESS_URL.split('?');
    const baseUrl = baseUrlParts[0];
    const params = new URLSearchParams(baseUrlParts[1] || '');
    
    // Ensure _embed parameter is set for author and media info
    params.set('_embed', 'true');
    
    // Set the after parameter
    params.set('after', new Date(sinceDate).toISOString());
    
    const url = `${baseUrl}?${params.toString()}`;
    console.log(`Fetching from URL: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
    
    const posts = await response.json();
    console.log(`Retrieved ${posts.length} posts since ${sinceDate}`);
    
    // Process each post
    return posts.map(post => ({
      id: post.id,
      title: post.title?.rendered || '',
      date: post.date ? post.date.split('T')[0] : null,
      content: post.content?.rendered || '',
      link: post.link,
      excerpt: post.excerpt?.rendered || '',
      image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
      host: post._embedded?.['author']?.[0]?.name || '',
      author: post._embedded?.['author']?.[0]?.name || ''
    }));
  } catch (error) {
    console.error(`Failed to fetch posts since ${sinceDate}: ${error.message}`);
    return [];
  }
}