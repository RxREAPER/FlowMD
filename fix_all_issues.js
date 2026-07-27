const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');

// Fix garbled strings across app.js
app = app.replace(/ðŸ”¥/g, '🔥');
app = app.replace(/o"/g, '✓');
app = app.replace(/s/g, '⚠️');
app = app.replace(/A/g, '•');
app = app.replace(/dYZ%/g, '100%');
app = app.replace(/dYs\?/g, '🎉');
app = app.replace(/dY"S/g, '📊');
app = app.replace(/dYZ"/g, '🚀');
app = app.replace(/dY\?\+/g, '➕');

fs.writeFileSync('app.js', app, 'utf8');
console.log('Fixed app.js garbled strings');
