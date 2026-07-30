const fs = require('fs');
const path = require('path');
const { recognize } = require('tesseract.js');

const IMG_DIR = 'C:/MOHAMMED SAFI/marrow-planner/sources/MArrow edition 8 all subjects combined';
const OUT_DIR = 'C:/MOHAMMED SAFI/marrow-planner/sources/ocr_raw';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const files = fs.readdirSync(IMG_DIR)
  .filter(f => f.endsWith('.jpg'))
  .sort();

console.log('Total images to process: ' + files.length);

async function processImage(imgFile) {
  const imgPath = path.join(IMG_DIR, imgFile);
  const outFile = path.join(OUT_DIR, imgFile.replace('.jpg', '.txt'));

  try {
    const result = await recognize(imgPath, 'eng', {
      logger: m => {}
    });
    const text = result.data.text;
    fs.writeFileSync(outFile, text);

    if (text.trim().length > 0) {
      console.log('OK: ' + imgFile + ' (' + text.trim().split('\n')[0].substring(0, 60) + ')');
    } else {
      console.log('EMPTY: ' + imgFile);
    }
  } catch (err) {
    console.error('FAILED: ' + imgFile + ' - ' + err.message);
  }
}

async function main() {
  let done = 0;
  for (const f of files) {
    await processImage(f);
    done++;
    if (done % 10 === 0) {
      console.log('Progress: ' + done + '/' + files.length);
    }
  }
  console.log('Done! Processed ' + done + ' images.');
}

main();
