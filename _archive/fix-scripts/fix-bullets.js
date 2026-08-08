const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

// The mangled text was originally a bullet point or em-dash.
// In the current file, it seems many bullets got replaced with ' A '.
// Let's replace " A " with " • " where it makes sense as a separator.
content = content.replace(/ vids A /g, ' vids • ');
content = content.replace(/ Videos A /g, ' Videos • ');
content = content.replace(/} A \$/g, '} • $');
content = content.replace(/ left A /g, ' left • ');
content = content.replace(/} A /g, '} • ');
content = content.replace(/% A /g, '% • ');
content = content.replace(/\/day A /g, '/day • ');
content = content.replace(/ Chapters A /g, ' Chapters • ');
content = content.replace(/h A /g, 'h • ');
content = content.replace(/8 A /g, '8 • ');
content = content.replace(/O A \$/g, 'O • $');
content = content.replace(/t A /g, 't • ');

fs.writeFileSync('app.js', content, 'utf8');
console.log("Bullets fixed");
