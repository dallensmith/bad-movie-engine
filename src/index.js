// src/index.js
import dotenv from 'dotenv';
import fullUpdate from './fullUpdate.js';

dotenv.config();

(async () => {
  try {
    console.log('📦 Environment loaded. Starting fullUpdate pipeline...');
    await fullUpdate();
  } catch (err) {
    console.error('❌ fullUpdate failed:', err);
    process.exit(1);
  }
})();
