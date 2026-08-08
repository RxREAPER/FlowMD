const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Add share button click listener
const tooltipListener = `
// Simple touch-active toggler for tooltips
document.querySelectorAll('.tooltip-container').forEach(el => {
  el.addEventListener('click', (e) => {
    if(e.target.closest('button') && !e.target.closest('.share-btn-main')) return;
    el.classList.toggle('touch-active');
  });
});
`;

appJs = appJs.replace(
  /\/\/ Simple touch-active toggler for tooltips[\s\S]*?}\);/m, 
  tooltipListener.trim()
);

// 2. Add touch-active to share-btn-wrapper dynamically when it's rendered if needed, 
// but since it's re-rendered, we should use event delegation or add it to the render function.

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Fixed app.js share button logic');
