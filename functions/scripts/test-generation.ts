#!/usr/bin/env npx ts-node
/**
 * Script pour tester la génération de questions via Genkit/Gemini
 *
 * Usage:
 *   npx ts-node scripts/test-generation.ts [options]
 *
 * Options:
 *   --phase=<phase>       Phase à générer (phase1, phase2, phase3, phase4, phase5)
 *   --topic=<topic>       Topic spécifique (optionnel, sinon généré par l'IA)
 *   --difficulty=<diff>   Difficulté (easy, normal, hard, wtf) - défaut: normal
 *   --language=<lang>     Langue (fr, en, es, de, pt) - défaut: fr
 *   --output=<file>       Sauvegarder le résultat en JSON
 *   --verbose             Afficher plus de détails
 *   --help                Afficher l'aide
 *
 * Exemples:
 *   npx ts-node scripts/test-generation.ts --phase=phase1
 *   npx ts-node scripts/test-generation.ts --phase=phase2 --topic="Cinéma français"
 *   npx ts-node scripts/test-generation.ts --phase=phase5 --difficulty=hard --language=en
 *   npx ts-node scripts/test-generation.ts --phase=phase1 --output=result.json --verbose
 *
 * Variables d'environnement requises:
 *   GEMINI_API_KEY        Clé API Google Gemini (dans .env.local)
 *
 * Note: Ce script appelle directement le flow Genkit, pas la Cloud Function.
 * Les logs s'affichent en temps réel dans la console.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Variables d\'environnement chargées depuis .env.local');
} else {
  console.log('⚠️  Fichier .env.local non trouvé, utilisation des variables système');
}

// Vérifier que GEMINI_API_KEY est définie
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY non définie');
  console.error('   Créez un fichier functions/.env.local avec:');
  console.error('   GEMINI_API_KEY=your-api-key');
  process.exit(1);
}

// Types pour les arguments
interface ParsedArgs {
  phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
  topic?: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'wtf';
  language: 'fr' | 'en' | 'es' | 'de' | 'pt';
  output?: string;
  verbose: boolean;
}

// Parser les arguments CLI
function parseArgs(): ParsedArgs | null {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {
    phase: 'phase1',
    topic: undefined,
    difficulty: 'normal',
    language: 'fr',
    output: undefined,
    verbose: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      printHelp();
      return null;
    } else if (arg.startsWith('--phase=')) {
      const phase = arg.split('=')[1] as ParsedArgs['phase'];
      if (!['phase1', 'phase2', 'phase3', 'phase4', 'phase5'].includes(phase)) {
        console.error(`❌ Phase invalide: ${phase}`);
        console.error('   Phases valides: phase1, phase2, phase3, phase4, phase5');
        process.exit(1);
      }
      result.phase = phase;
    } else if (arg.startsWith('--topic=')) {
      result.topic = arg.split('=')[1];
    } else if (arg.startsWith('--difficulty=')) {
      const diff = arg.split('=')[1] as ParsedArgs['difficulty'];
      if (!['easy', 'normal', 'hard', 'wtf'].includes(diff)) {
        console.error(`❌ Difficulté invalide: ${diff}`);
        console.error('   Difficultés valides: easy, normal, hard, wtf');
        process.exit(1);
      }
      result.difficulty = diff;
    } else if (arg.startsWith('--language=')) {
      const lang = arg.split('=')[1] as ParsedArgs['language'];
      if (!['fr', 'en', 'es', 'de', 'pt'].includes(lang)) {
        console.error(`❌ Langue invalide: ${lang}`);
        console.error('   Langues valides: fr, en, es, de, pt');
        process.exit(1);
      }
      result.language = lang;
    } else if (arg.startsWith('--output=')) {
      result.output = arg.split('=')[1];
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
🎲 Test de génération de questions Spicy vs Sweet

Usage:
  npx ts-node scripts/test-generation.ts [options]

Options:
  --phase=<phase>       Phase à générer (défaut: phase1)
                        - phase1: Tenders (MCQ rapide)
                        - phase2: Sucré Salé (classification binaire)
                        - phase3: La Carte (menus thématiques)
                        - phase4: La Note (buzzer)
                        - phase5: Burger Ultime (mémorisation)

  --topic=<topic>       Topic spécifique (optionnel)
                        Si non spécifié, l'IA génère un topic créatif

  --difficulty=<diff>   Niveau de difficulté (défaut: normal)
                        - easy: Questions faciles
                        - normal: Difficulté standard
                        - hard: Questions difficiles
                        - wtf: Questions absurdes/drôles

  --language=<lang>     Langue de génération (défaut: fr)
                        - fr: Français
                        - en: English
                        - es: Español
                        - de: Deutsch
                        - pt: Português

  --output=<file>       Sauvegarder le résultat en JSON

  --verbose, -v         Afficher plus de détails (prompts, tokens, etc.)

  --help, -h            Afficher cette aide

Exemples:
  # Générer des questions phase 1 en français
  npx ts-node scripts/test-generation.ts --phase=phase1

  # Générer phase 2 sur un topic spécifique
  npx ts-node scripts/test-generation.ts --phase=phase2 --topic="Cinéma français"

  # Générer en anglais avec difficulté hard
  npx ts-node scripts/test-generation.ts --phase=phase4 --language=en --difficulty=hard

  # Sauvegarder le résultat
  npx ts-node scripts/test-generation.ts --phase=phase1 --output=questions.json --verbose
`);
}

// Affichage formaté des résultats selon la phase
function displayResults(phase: string, data: unknown, verbose: boolean): void {
  console.log('\n' + '═'.repeat(70));
  console.log('📋 RÉSULTATS');
  console.log('═'.repeat(70));

  if (phase === 'phase1') {
    const questions = data as Array<{
      text: string;
      options: string[];
      correctIndex: number;
      anecdote?: string;
    }>;
    console.log(`\n🎯 ${questions.length} questions MCQ générées:\n`);
    questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.text}`);
      q.options.forEach((opt, j) => {
        const marker = j === q.correctIndex ? '✅' : '  ';
        console.log(`   ${marker} ${String.fromCharCode(65 + j)}) ${opt}`);
      });
      if (q.anecdote && verbose) {
        console.log(`   💡 ${q.anecdote}`);
      }
      console.log('');
    });
  } else if (phase === 'phase2') {
    const set = data as {
      optionA: string;
      optionB: string;
      optionADescription?: string;
      optionBDescription?: string;
      humorousDescription?: string;
      items: Array<{
        text: string;
        answer: 'A' | 'B' | 'Both';
        justification?: string;
        anecdote?: string;
      }>;
    };
    console.log(`\n🎭 Set Sucré/Salé: "${set.optionA}" vs "${set.optionB}"\n`);
    if (set.humorousDescription && verbose) {
      console.log(`   📝 ${set.humorousDescription}\n`);
    }
    console.log(`${set.items.length} items générés:\n`);
    set.items.forEach((item, i) => {
      const emoji = item.answer === 'A' ? '🅰️' : item.answer === 'B' ? '🅱️' : '🔁';
      console.log(`${i + 1}. ${item.text}`);
      console.log(`   ${emoji} Réponse: ${item.answer}`);
      if (item.justification && verbose) {
        console.log(`   📝 ${item.justification}`);
      }
      console.log('');
    });
  } else if (phase === 'phase3') {
    const menus = data as Array<{
      title: string;
      description?: string;
      isTrap?: boolean;
      questions: Array<{
        question: string;
        answer: string;
        acceptableAnswers?: string[];
      }>;
    }>;
    console.log(`\n🍽️ ${menus.length} menus générés:\n`);
    menus.forEach((menu, i) => {
      const trapIcon = menu.isTrap ? ' 🎭' : '';
      console.log(`━━━ Menu ${i + 1}: ${menu.title}${trapIcon} ━━━`);
      if (menu.description && verbose) {
        console.log(`   📝 ${menu.description}`);
      }
      menu.questions.forEach((q, j) => {
        console.log(`  ${j + 1}. ${q.question}`);
        console.log(`     → ${q.answer}`);
        if (q.acceptableAnswers?.length && verbose) {
          console.log(`     📝 Aussi accepté: ${q.acceptableAnswers.join(', ')}`);
        }
      });
      console.log('');
    });
  } else if (phase === 'phase4') {
    const questions = data as Array<{
      text: string;
      options: string[];
      correctIndex: number;
      anecdote?: string;
    }>;
    console.log(`\n🔔 ${questions.length} questions MCQ générées:\n`);
    questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.text}`);
      q.options.forEach((opt, j) => {
        const marker = j === q.correctIndex ? '✅' : '  ';
        console.log(`   ${marker} ${String.fromCharCode(65 + j)}) ${opt}`);
      });
      if (q.anecdote && verbose) {
        console.log(`   💡 ${q.anecdote}`);
      }
      console.log('');
    });
  } else if (phase === 'phase5') {
    const questions = data as Array<{
      question: string;
      answer: string;
      acceptableAnswers?: string[];
    }>;
    console.log(`\n🍔 ${questions.length} questions mémorisation générées:\n`);
    questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.question}`);
      console.log(`   → ${q.answer}`);
      if (q.acceptableAnswers?.length && verbose) {
        console.log(`   📝 Aussi accepté: ${q.acceptableAnswers.join(', ')}`);
      }
      console.log('');
    });
  }
}

// Fonction principale
async function main(): Promise<void> {
  const args = parseArgs();
  if (!args) {
    process.exit(0);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('🎲 TEST DE GÉNÉRATION DE QUESTIONS');
  console.log('═'.repeat(70));
  console.log(`\n📋 Configuration:`);
  console.log(`   Phase:      ${args.phase}`);
  console.log(`   Topic:      ${args.topic || '(auto-généré)'}`);
  console.log(`   Difficulté: ${args.difficulty}`);
  console.log(`   Langue:     ${args.language}`);
  if (args.output) {
    console.log(`   Output:     ${args.output}`);
  }
  console.log('');

  // Import dynamique pour éviter les erreurs de configuration avant le chargement des env vars
  console.log('⏳ Initialisation de Genkit...\n');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { generateGameQuestionsFlow } = require('../lib/services/gameGenerator.js') as {
    generateGameQuestionsFlow: (params: {
      phase: string;
      topic: string;
      difficulty: string;
      language: string;
    }) => Promise<{
      topic: string;
      language?: string;
      usage?: { totalTokens?: number; estimatedCost?: number };
      embeddings?: unknown[];
      data: unknown;
    }>;
  };

  console.log('🚀 Lancement de la génération...\n');
  console.log('─'.repeat(70));

  const startTime = Date.now();

  try {
    const result = await generateGameQuestionsFlow({
      phase: args.phase,
      // 'General Knowledge' sera remplacé par un topic généré par l'IA
      topic: args.topic || 'General Knowledge',
      difficulty: args.difficulty,
      language: args.language,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('─'.repeat(70));
    console.log(`\n✅ Génération terminée en ${elapsed}s`);

    // Afficher les métriques
    console.log('\n📊 Métriques:');
    console.log(`   Topic utilisé:    ${result.topic}`);
    console.log(`   Langue:           ${result.language}`);
    console.log(`   Tokens estimés:   ${result.usage?.totalTokens || 'N/A'}`);
    console.log(`   Coût estimé:      $${(result.usage?.estimatedCost || 0).toFixed(4)}`);
    if (result.embeddings?.length) {
      console.log(`   Embeddings:       ${result.embeddings.length}`);
    }

    // Afficher les résultats
    displayResults(args.phase, result.data, args.verbose);

    // Sauvegarder si demandé
    if (args.output) {
      const outputPath = path.resolve(args.output);
      const exportData = {
        phase: args.phase,
        topic: result.topic,
        language: result.language || args.language,
        difficulty: args.difficulty,
        generatedAt: new Date().toISOString(),
        durationSeconds: parseFloat(elapsed),
        usage: result.usage,
        data: result.data,
      };
      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
      console.log(`\n📁 Résultat sauvegardé: ${outputPath}`);
    }

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('─'.repeat(70));
    console.error(`\n❌ Erreur après ${elapsed}s:`);

    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (args.verbose && error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✨ Test terminé!');
  console.log('═'.repeat(70) + '\n');
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
