export default function normalizeWordPressData(data) {
  return data.map(item => {
    const match = typeof item.title === 'string' ? item.title.match(/^Experiment (\d+): (.+)$/) : null;


    return {
      experiment: match ? parseInt(match[1], 10) : null,
      title: item.title,
      date: item.date,
      rawHtml: item.rawHtml || '',
    };
  });
}
/**
 * Normalizes WordPress post data by extracting the experiment number from the title.
 * 
 * @param {Array} data - Array of WordPress post objects
 * @returns {Array} - Array of normalized post objects with experiment number, title, date, and raw HTML
 * 
 * Example:
 * Input: [{ title: 'Experiment #1', date: '2023-01-01', rawHtml: '<p>Content</p>' }]
 * Output: [{ experiment: 1, title: 'Experiment #1', date: '2023-01-01', rawHtml: '<p>Content</p>' }]
 */