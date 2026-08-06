/**
 * Script pour générer les icônes PWA depuis le SVG
 * Requiert: sharp (npm install sharp)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const SVG_FILE = path.join(PUBLIC_DIR, 'pwa-icon-template.svg');

// Tailles requises pour PWA
const SIZES = [
  { width: 192, height: 192, filename: 'pwa-192x192.png' },
  { width: 512, height: 512, filename: 'pwa-512x512.png' },
  { width: 192, height: 192, filename: 'icon-192.png' },
  { width: 512, height: 512, filename: 'icon-512.png' },
];

async function generateIcons() {
  try {
    const sharp = (await import('sharp')).default;
    const svgBuffer = fs.readFileSync(SVG_FILE);
    
    console.log('📝 Génération des icônes PWA...\n');
    
    for (const size of SIZES) {
      const outputPath = path.join(PUBLIC_DIR, size.filename);
      
      await sharp(svgBuffer)
        .resize(size.width, size.height)
        .png({ quality: 90, compressionLevel: 6 })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`✅ ${size.filename} (${size.width}x${size.height}) - ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    console.log('\n✨ Icônes générées avec succès!');
    console.log('📦 N\'oubliez pas de rebuild: npm run build');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Solution: Installez sharp avec: npm install sharp');
    process.exit(1);
  }
}

generateIcons();
