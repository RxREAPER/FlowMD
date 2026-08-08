const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// Replace the share button wrapper to include onclick for mobile toggle
appJs = appJs.replace(
  '<div class="share-btn-wrapper tooltip-container" style="color: inherit;">',
  '<div class="share-btn-wrapper tooltip-container" style="color: inherit;" onclick="this.classList.toggle(\'touch-active\')">'
);

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Fixed app.js share button onclick');
