// src/lib/fetchWordPressPosts.js

export default async function fetchPosts() {
    console.log('🌐 Fetching posts from WordPress...');
  
    const response = await fetch(process.env.WORDPRESS_URL);
  
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
  
    const data = await response.json();
  
    // Log one example post to inspect structure
    console.log('🔍 Example post:', JSON.stringify(data[0], null, 2));
  
    const posts = data.map(post => ({
      title: post.title?.rendered || '',
      date: post.date || '',
      rawHtml: post.content?.rendered || ''
    }));
  
    return posts;
  }
  