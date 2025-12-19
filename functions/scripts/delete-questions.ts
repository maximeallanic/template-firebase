#!/usr/bin/env npx ts-node
/**
 * Script pour supprimer les questions depuis Firestore
 * ⚠️  ATTENTION: Opération destructive - utiliser avec précaution!
 *
 * Usage:
 *   npx ts-node scripts/delete-questions.ts [options]
 *
 * Options:
 *   --phase=<phase>      Supprimer uniquement une phase (phase1, phase2, phase3, phase4, phase5)
 *   --production         Supprimer en production (DANGER!)
 *   --dry-run            Simuler sans supprimer (défaut si --production)
 *   --force              Forcer la suppression sans confirmation
 *   --batch-size=<n>     Taille des lots de suppression (défaut: 500)
 *
 * Exemples:
 *   npx ts-node scripts/delete-questions.ts                    # Émulateur, toutes phases
 *   npx ts-node scripts/delete-questions.ts --phase=phase1     # Émulateur, phase1 seulement
 *   npx ts-node scripts/delete-questions.ts --production --dry-run  # Voir ce qui serait supprimé
 *   npx ts-node scripts/delete-questions.ts --production --force    # Supprimer en prod (DANGER!)
 */

import * as admin from 'firebase-admin';
import * as readline from 'readline';

// Parse arguments
function parseArgs(): {
  phase?: string;
  production: boolean;
  dryRun: boolean;
  force: boolean;
  batchSize: number;
} {
  const args = process.argv.slice(2);
  const result = {
    phase: undefined as string | undefined,
    production: false,
    dryRun: false,
    force: false,
    batchSize: 100, // Reduced to avoid "Transaction too big" error (embeddings are large)
  };

  for (const arg of args) {
    if (arg.startsWith('--phase=')) {
      result.phase = arg.split('=')[1];
    } else if (arg === '--production') {
      result.production = true;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg.startsWith('--batch-size=')) {
      result.batchSize = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: npx ts-node scripts/delete-questions.ts [options]

Options:
  --phase=<phase>      Supprimer uniquement une phase (phase1, phase2, phase3, phase4, phase5)
  --production         Supprimer en production (DANGER!)
  --dry-run            Simuler sans supprimer
  --force              Forcer la suppression sans confirmation
  --batch-size=<n>     Taille des lots de suppression (défaut: 500)

Exemples:
  npx ts-node scripts/delete-questions.ts                    # Émulateur, toutes phases
  npx ts-node scripts/delete-questions.ts --phase=phase1     # Émulateur, phase1 seulement
  npx ts-node scripts/delete-questions.ts --production --dry-run  # Voir ce qui serait supprimé
  npx ts-node scripts/delete-questions.ts --production --force    # Supprimer en prod (DANGER!)
`);
      process.exit(0);
    }
  }

  // Default to dry-run in production unless force is specified
  if (result.production && !result.force) {
    result.dryRun = true;
  }

  return result;
}

// Ask for user confirmation
async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'oui');
    });
  });
}

// Initialize Firebase Admin
function initFirebase(useProduction: boolean): admin.firestore.Firestore {
  if (!useProduction) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    console.log('📡 Connexion à l\'émulateur Firestore (127.0.0.1:8080)');
  } else {
    console.log('🌐 Connexion à Firestore PRODUCTION');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'spicy-vs-sweety',
    });
  }

  return admin.firestore();
}

// Count questions
async function countQuestions(
  db: admin.firestore.Firestore,
  phase?: string
): Promise<{ total: number; byPhase: Record<string, number> }> {
  const phases = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5'];
  const byPhase: Record<string, number> = {};
  let total = 0;

  for (const p of phases) {
    if (phase && p !== phase) continue;

    const snapshot = await db.collection('questions')
      .where('phase', '==', p)
      .count()
      .get();

    const count = snapshot.data().count;
    byPhase[p] = count;
    total += count;
  }

  return { total, byPhase };
}

// Delete questions in batches
async function deleteQuestions(
  db: admin.firestore.Firestore,
  phase: string | undefined,
  batchSize: number,
  dryRun: boolean
): Promise<number> {
  let totalDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    let query: admin.firestore.Query = db.collection('questions');

    if (phase) {
      query = query.where('phase', '==', phase);
    }

    query = query.limit(batchSize);

    const snapshot = await query.get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    if (dryRun) {
      // In dry-run mode, just count
      totalDeleted += snapshot.size;
      console.log(`  🔍 [DRY-RUN] ${snapshot.size} documents trouvés...`);
      hasMore = false; // Don't continue in dry-run
    } else {
      // Actually delete
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += snapshot.size;
      console.log(`  🗑️  ${totalDeleted} documents supprimés...`);

      // Continue if we got a full batch
      hasMore = snapshot.size === batchSize;
    }
  }

  return totalDeleted;
}

// Main function
async function main(): Promise<void> {
  const args = parseArgs();

  console.log('');
  console.log('🗑️  Suppression des questions Firestore');
  console.log('━'.repeat(60));

  if (args.production) {
    console.log('');
    console.log('⚠️  ════════════════════════════════════════════════════════');
    console.log('⚠️  ATTENTION: Mode PRODUCTION activé!');
    console.log('⚠️  Les données supprimées ne peuvent PAS être récupérées!');
    console.log('⚠️  ════════════════════════════════════════════════════════');
    console.log('');
  }

  if (args.dryRun) {
    console.log('ℹ️  Mode DRY-RUN: aucune donnée ne sera supprimée');
    console.log('');
  }

  const db = initFirebase(args.production);

  // Count questions first
  console.log('');
  console.log('📊 Comptage des questions...');
  const { total, byPhase } = await countQuestions(db, args.phase);

  if (total === 0) {
    console.log('');
    console.log('✅ Aucune question à supprimer!');
    process.exit(0);
  }

  console.log('');
  console.log('📋 Questions trouvées:');
  for (const [p, count] of Object.entries(byPhase)) {
    if (count > 0) {
      console.log(`   ${p}: ${count} questions`);
    }
  }
  console.log(`   ─────────────────`);
  console.log(`   TOTAL: ${total} questions`);
  console.log('');

  // Ask for confirmation if in production and not force
  if (args.production && !args.dryRun) {
    if (!args.force) {
      console.log('');
      const confirmed = await askConfirmation(
        `❓ Êtes-vous SÛR de vouloir supprimer ${total} questions en PRODUCTION? (tapez "yes" ou "oui"): `
      );

      if (!confirmed) {
        console.log('');
        console.log('❌ Opération annulée.');
        process.exit(0);
      }

      // Double confirmation for production
      console.log('');
      const doubleConfirmed = await askConfirmation(
        `🚨 DERNIÈRE CHANCE - Cette action est IRRÉVERSIBLE. Confirmer? (tapez "yes" ou "oui"): `
      );

      if (!doubleConfirmed) {
        console.log('');
        console.log('❌ Opération annulée.');
        process.exit(0);
      }
    } else {
      console.log('⚡ Mode --force activé, pas de confirmation demandée');
    }
  }

  // Delete questions
  console.log('');
  console.log(args.dryRun ? '🔍 Simulation de suppression...' : '🗑️  Suppression en cours...');
  console.log('');

  const deleted = await deleteQuestions(db, args.phase, args.batchSize, args.dryRun);

  console.log('');
  console.log('━'.repeat(60));

  if (args.dryRun) {
    console.log(`✅ [DRY-RUN] ${deleted} questions seraient supprimées`);
    console.log('');
    console.log('💡 Pour supprimer réellement, utilisez:');
    if (args.production) {
      console.log('   npx ts-node scripts/delete-questions.ts --production --force');
    } else {
      console.log('   npx ts-node scripts/delete-questions.ts');
    }
  } else {
    console.log(`✅ ${deleted} questions supprimées avec succès!`);
  }
}

main().catch(console.error);
