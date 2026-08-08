const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  // Replace the mangled utf-8 characters with proper ones or HTML entities
  content = content.replace(/â€”/g, '—');
  content = content.replace(/â€¢/g, '•');
  content = content.replace(/âœ¨/g, '✨');
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed', path);
}

fixFile('app.js');
fixFile('index.html');
