import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, 'public', 'images');
const outputDir = path.join(__dirname, 'public', 'images', 'compressed');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read all files in the input directory
fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.avif') {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace('.avif', '.jpg'));

      sharp(inputPath)
        .jpeg({ quality: 60 })
        .toFile(outputPath)
        .then(() => {
          console.log(`Compressed ${file} to ${outputPath}`);
        })
        .catch(err => {
          console.error(`Error processing ${file}:`, err);
        });
    }
  });
});