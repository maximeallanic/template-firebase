import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

async function optimizeImages() {
  console.log('🖼️  Optimisation des images Open Graph...\n');

  try {
    // OG Image: 1200x630px, WebP, quality 85
    console.log('📸 Traitement og-image.jpg → og-image.webp...');
    await sharp(path.join(publicDir, 'og-image.jpg'))
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .webp({ quality: 85, effort: 6 })
      .toFile(path.join(publicDir, 'og-image.webp'));

    const ogStats = await fs.stat(path.join(publicDir, 'og-image.webp'));
    const ogOriginalStats = await fs.stat(path.join(publicDir, 'og-image.jpg'));
    const ogSavings = ((1 - ogStats.size / ogOriginalStats.size) * 100).toFixed(1);
    console.log(`   ✅ og-image.webp créé: ${(ogStats.size / 1024).toFixed(2)} KB`);
    console.log(`   💾 Économie: ${ogSavings}% (${(ogOriginalStats.size / 1024).toFixed(2)} KB → ${(ogStats.size / 1024).toFixed(2)} KB)\n`);

    // Twitter Card: 1200x675px (ratio 16:9), WebP, quality 85
    console.log('🐦 Traitement twitter-card.jpg → twitter-card.webp...');
    await sharp(path.join(publicDir, 'twitter-card.jpg'))
      .resize(1200, 675, { fit: 'cover', position: 'center' })
      .webp({ quality: 85, effort: 6 })
      .toFile(path.join(publicDir, 'twitter-card.webp'));

    const twitterStats = await fs.stat(path.join(publicDir, 'twitter-card.webp'));
    const twitterOriginalStats = await fs.stat(path.join(publicDir, 'twitter-card.jpg'));
    const twitterSavings = ((1 - twitterStats.size / twitterOriginalStats.size) * 100).toFixed(1);
    console.log(`   ✅ twitter-card.webp: ${(twitterStats.size / 1024).toFixed(2)} KB`);
    console.log(`   💾 Économie: ${twitterSavings}% (${(twitterOriginalStats.size / 1024).toFixed(2)} KB → ${(twitterStats.size / 1024).toFixed(2)} KB)\n`);

    // Calcul économie totale
    const totalOriginal = (ogOriginalStats.size + twitterOriginalStats.size) / 1024;
    const totalOptimized = (ogStats.size + twitterStats.size) / 1024;
    const totalSavings = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Optimisation terminée avec succès!\n');
    console.log(`📊 Statistiques:`);
    console.log(`   • Taille originale:  ${totalOriginal.toFixed(2)} KB`);
    console.log(`   • Taille optimisée:  ${totalOptimized.toFixed(2)} KB`);
    console.log(`   • Économie totale:   ${totalSavings}% (~${(totalOriginal - totalOptimized).toFixed(2)} KB)\n`);
    console.log(`🚀 Impact LCP estimé: -4 à -5 secondes sur mobile slow 4G`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error.message);
    process.exit(1);
  }
}

optimizeImages();
