#!/usr/bin/env npx ts-node
/**
 * Script pour récupérer les questions depuis Firestore (emulateur local ou production)
 *
 * Usage:
 *   npx ts-node scripts/fetch-questions.ts [options]
 *
 * Options:
 *   --phase=<phase>      Filtrer par phase (phase1, phase2, phase3, phase4, phase5)
 *   --topic=<topic>      Filtrer par topic (recherche partielle)
 *   --limit=<n>          Limiter le nombre de résultats (défaut: 50)
 *   --production         Utiliser Firestore production au lieu de l'émulateur
 *   --export=<file>      Exporter les résultats en JSON
 *   --stats              Afficher uniquement les statistiques
 *
 * Exemples:
 *   npx ts-node scripts/fetch-questions.ts
 *   npx ts-node scripts/fetch-questions.ts --phase=phase1
 *   npx ts-node scripts/fetch-questions.ts --phase=phase2 --limit=10
 *   npx ts-node scripts/fetch-questions.ts --stats
 *   npx ts-node scripts/fetch-questions.ts --export=questions.json
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Types pour les questions
interface BaseQuestion {
  phase: string;
  topic: string;
  difficulty: string;
  createdAt: admin.firestore.Timestamp;
  usageCount: number;
  generatedBy: string;
  embedding?: number[];
  embeddingModel?: string;
}

interface Phase1Question extends BaseQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  anecdote?: string;
}

interface Phase2Question extends BaseQuestion {
  optionA: string;
  optionB: string;
  text: string;
  answer: 'A' | 'B' | 'Both';
  justification?: string;
}

interface Phase3To5Question extends BaseQuestion {
  question: string;
  answer: string;
}

// Type pour les données brutes d'un document (avant détection de phase)
type RawQuestionData = Partial<Phase1Question & Phase2Question & Phase3To5Question> & {
  phase?: string;
};


// Parse arguments
function parseArgs(): {
  phase?: string;
  topic?: string;
  limit: number;
  production: boolean;
  exportFile?: string;
  stats: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    phase: undefined as string | undefined,
    topic: undefined as string | undefined,
    limit: 50,
    production: false,
    exportFile: undefined as string | undefined,
    stats: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--phase=')) {
      result.phase = arg.split('=')[1];
    } else if (arg.startsWith('--topic=')) {
      result.topic = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      result.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--production') {
      result.production = true;
    } else if (arg.startsWith('--export=')) {
      result.exportFile = arg.split('=')[1];
    } else if (arg === '--stats') {
      result.stats = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: npx ts-node scripts/fetch-questions.ts [options]

Options:
  --phase=<phase>      Filtrer par phase (phase1, phase2, phase3, phase4, phase5)
  --topic=<topic>      Filtrer par topic (recherche partielle)
  --limit=<n>          Limiter le nombre de résultats (défaut: 50)
  --production         Utiliser Firestore production au lieu de l'émulateur
  --export=<file>      Exporter les résultats en JSON
  --stats              Afficher uniquement les statistiques

Exemples:
  npx ts-node scripts/fetch-questions.ts
  npx ts-node scripts/fetch-questions.ts --phase=phase1
  npx ts-node scripts/fetch-questions.ts --phase=phase2 --limit=10
  npx ts-node scripts/fetch-questions.ts --stats
  npx ts-node scripts/fetch-questions.ts --export=questions.json
`);
      process.exit(0);
    }
  }

  return result;
}

// Initialize Firebase Admin
function initFirebase(useProduction: boolean): admin.firestore.Firestore {
  if (!useProduction) {
    // Configure pour utiliser l'émulateur Firestore
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    console.log('📡 Connexion à l\'émulateur Firestore (127.0.0.1:8080)');
  } else {
    console.log('🌐 Connexion à Firestore production');
  }

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'spicy-vs-sweety',
    });
  }

  return admin.firestore();
}

// Display Phase 1 question
function displayPhase1(q: Phase1Question, index: number): void {
  console.log(`\n${index}. ${q.text || '(sans texte)'}`);
  if (q.options && Array.isArray(q.options)) {
    q.options.forEach((opt, idx) => {
      const marker = idx === q.correctIndex ? '✓' : ' ';
      console.log(`   ${marker} ${String.fromCharCode(65 + idx)}) ${opt}`);
    });
  } else {
    console.log(`   ⚠️  Options manquantes`);
  }
  if (q.anecdote) {
    console.log(`   💡 ${q.anecdote}`);
  }
  console.log(`   📁 Topic: ${q.topic || 'N/A'} | Difficulté: ${q.difficulty || 'N/A'}`);
}

// Display Phase 2 question
function displayPhase2(q: Phase2Question, index: number): void {
  const emoji = q.answer === 'A' ? '🅰️' : q.answer === 'B' ? '🅱️' : '🔁';
  console.log(`\n${index}. ${q.text || '(sans texte)'}`);
  console.log(`   → ${emoji} ${q.answer || 'N/A'}`);
  if (q.optionA || q.optionB) {
    console.log(`   🎭 ${q.optionA || '?'} vs ${q.optionB || '?'}`);
  }
  if (q.justification) {
    console.log(`   📝 ${q.justification}`);
  }
  console.log(`   📁 Topic: ${q.topic || 'N/A'}`);
}

// Display Phase 3-5 question
function displayPhase3To5(q: Phase3To5Question, index: number): void {
  console.log(`\n${index}. ${q.question || '(sans question)'}`);
  console.log(`   → ${q.answer || 'N/A'}`);
  console.log(`   📁 Topic: ${q.topic || 'N/A'}`);
}

// Display question based on phase - detect structure if phase field is missing
function displayQuestion(doc: admin.firestore.DocumentData, index: number): void {
  const data = doc as RawQuestionData;

  // Detect phase from data structure if not explicitly set
  const phase = data.phase || detectPhaseFromData(data);

  if (phase === 'phase1' || data.options) {
    displayPhase1(data as Phase1Question, index);
  } else if (phase === 'phase2' || (data.optionA && data.optionB)) {
    displayPhase2(data as Phase2Question, index);
  } else if (data.question && data.answer) {
    displayPhase3To5(data as Phase3To5Question, index);
  } else {
    // Unknown structure - display raw
    console.log(`\n${index}. [Structure inconnue]`);
    console.log(`   Phase: ${data.phase || 'N/A'}`);
    console.log(`   Données: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
  }
}

// Try to detect phase from data structure
function detectPhaseFromData(data: admin.firestore.DocumentData): string | undefined {
  if ('options' in data && Array.isArray(data.options)) {
    return 'phase1';
  }
  if ('optionA' in data && 'optionB' in data) {
    return 'phase2';
  }
  if ('question' in data && 'answer' in data) {
    return 'phase5'; // Could also be phase3 or phase4
  }
  return undefined;
}

// Get statistics
async function getStats(db: admin.firestore.Firestore): Promise<void> {
  console.log('\n📊 Statistiques des questions en base\n');
  console.log('━'.repeat(60));

  const phases = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5'];
  const stats: Record<string, { count: number; topics: Set<string> }> = {};

  for (const phase of phases) {
    const snapshot = await db.collection('questions')
      .where('phase', '==', phase)
      .get();

    const topics = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.topic) topics.add(data.topic);
    });

    stats[phase] = {
      count: snapshot.size,
      topics,
    };
  }

  let total = 0;
  for (const phase of phases) {
    const { count, topics } = stats[phase];
    total += count;
    const phaseName = {
      phase1: 'Tenders (MCQ)',
      phase2: 'Sucré Salé',
      phase3: 'La Carte',
      phase4: 'La Note',
      phase5: 'Burger Ultime',
    }[phase] || phase;

    console.log(`\n${phase.toUpperCase()} - ${phaseName}`);
    console.log(`  📝 ${count} questions`);
    console.log(`  🏷️  ${topics.size} topics: ${Array.from(topics).slice(0, 5).join(', ')}${topics.size > 5 ? '...' : ''}`);
  }

  console.log('\n' + '━'.repeat(60));
  console.log(`📊 TOTAL: ${total} questions`);
}

// Main function
async function main(): Promise<void> {
  const args = parseArgs();

  console.log('🎲 Récupération des questions depuis Firestore');
  console.log('━'.repeat(60));

  const db = initFirebase(args.production);

  // Stats mode
  if (args.stats) {
    await getStats(db);
    process.exit(0);
  }

  // Build query
  // Note: Firestore requires composite indexes for where + orderBy
  // To avoid index requirements, we fetch without orderBy when filtering by phase
  let query: admin.firestore.Query = db.collection('questions');

  if (args.phase) {
    query = query.where('phase', '==', args.phase);
    console.log(`📌 Filtre phase: ${args.phase}`);
    // Don't add orderBy to avoid composite index requirement
    query = query.limit(args.limit * 2); // Fetch more to allow for sorting
  } else {
    query = query.orderBy('createdAt', 'desc').limit(args.limit);
  }

  // Note: Firestore doesn't support partial text search natively
  // For topic filtering, we'll filter in memory

  console.log(`📌 Limite: ${args.limit} résultats`);
  console.log('');

  try {
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log('❌ Aucune question trouvée');
      process.exit(0);
    }

    // Filter and sort in memory
    let docs = snapshot.docs;

    // Sort by createdAt desc if we couldn't do it in query (when filtering by phase)
    if (args.phase) {
      docs = docs.sort((a, b) => {
        const aTime = a.data().createdAt?.toMillis?.() || 0;
        const bTime = b.data().createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    }

    // Filter by topic in memory if specified
    if (args.topic) {
      const topicLower = args.topic.toLowerCase();
      docs = docs.filter(doc => {
        const data = doc.data();
        return data.topic?.toLowerCase().includes(topicLower);
      });
      console.log(`📌 Filtre topic: "${args.topic}" (${docs.length} résultats)`);
    }

    // Apply actual limit after sorting
    docs = docs.slice(0, args.limit);

    console.log(`✅ ${docs.length} questions trouvées`);
    console.log('━'.repeat(60));

    // Export to file if requested
    if (args.exportFile) {
      const questions = docs.map(doc => {
        const data = doc.data();
        // Remove embedding for cleaner export (destructure and discard with void)
        const { embedding, embeddingModel, ...rest } = data;
        void embedding;
        void embeddingModel;
        return {
          id: doc.id,
          ...rest,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        };
      });

      const exportPath = path.resolve(args.exportFile);
      fs.writeFileSync(exportPath, JSON.stringify(questions, null, 2));
      console.log(`\n📁 Exporté vers: ${exportPath}`);
      console.log(`   ${questions.length} questions`);
    } else {
      // Display questions
      docs.forEach((doc, index) => {
        displayQuestion(doc.data(), index + 1);
      });
    }

    console.log('\n' + '━'.repeat(60));
    console.log('✨ Terminé!');

  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      console.error('❌ Impossible de se connecter à l\'émulateur Firestore');
      console.error('   Assurez-vous que l\'émulateur est lancé: npm run emulators');
    } else {
      console.error('❌ Erreur:', error);
    }
    process.exit(1);
  }
}

main().catch(console.error);
