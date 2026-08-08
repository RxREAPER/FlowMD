const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');

// Revert accidental global character replacement
app = app.replace(/⚠️/g, 's');
app = app.replace(/•/g, 'A');

fs.writeFileSync('app.js', app, 'utf8');
console.log('Reverted accidental replacements in app.js');
