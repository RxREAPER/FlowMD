const { recognize } = require('tesseract.js');
const path = 'C:/MOHAMMED SAFI/marrow-planner/sources/MArrow edition 8 all subjects combined/IMG-20260729-WA0005.jpg';
recognize(path, 'eng', { logger: m => console.log(m.status + ': ' + m.progress.toFixed(2)) })
  .then(({ data: { text } }) => {
    console.log('=== OCR OUTPUT ===');
    console.log(text);
  })
  .catch(err => console.error('OCR Error:', err));
