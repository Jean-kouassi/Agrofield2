import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '..', '..', 'AgroField2_Business_Plan_2026.html');

console.log('📄 Ouverture du Business Plan AgroField2...');
console.log(`   Fichier: ${htmlPath}`);
console.log('');
console.log('💡 Pour convertir en PDF :');
console.log('   1. Le fichier HTML va s\'ouvrir dans votre navigateur');
console.log('   2. Appuyez sur CTRL+P (ou Cmd+P sur Mac)');
console.log('   3. Choisissez "Enregistrer au format PDF" comme imprimante');
console.log('   4. Cliquez sur "Enregistrer" sur le Bureau');
console.log('');
console.log('🎨 Le design est optimisé pour l\'impression A4 !');
console.log('');

// Ouvrir dans le navigateur par défaut
const start = spawn('cmd', ['/c', 'start', htmlPath], {
  shell: true,
  detached: true
});

start.on('close', (code) => {
  console.log('✅ Fichier ouvert avec succès !');
  console.log('');
  console.log('Suivez les instructions ci-dessus pour exporter en PDF 📄');
});
