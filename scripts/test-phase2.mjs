import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCxxxxxxx",
  authDomain: "spicy-vs-sweety.firebaseapp.com",
  projectId: "spicy-vs-sweety",
  storageBucket: "spicy-vs-sweety.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const auth = getAuth(app);

// Connect to emulators
connectFunctionsEmulator(functions, 'localhost', 5001);
connectAuthEmulator(auth, 'http://localhost:9099');

console.log('🎲 Test Phase 2 - Sucré Salé');
console.log('━'.repeat(60));

try {
  console.log('\n📡 Connexion aux émulateurs Firebase...');
  const userCredential = await signInAnonymously(auth);
  console.log('✅ Authentification anonyme réussie');
  console.log(`   UID: ${userCredential.user.uid}`);

  const generateQuestions = httpsCallable(functions, 'generateGameQuestions', { timeout: 300000 });

  console.log('\n🤖 Génération Phase 2 en cours...');
  console.log('   (gemini-3-pro-preview peut prendre 2-3 minutes)');

  const startTime = Date.now();
  const result = await generateQuestions({
    phase: 'phase2',
    difficulty: 'normal'
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✅ Génération réussie en ${duration}s !`);

  const data = result.data;

  if (data.topic) {
    console.log(`\n🎯 Topic IA généré: "${data.topic}"`);
  }

  console.log('\n📝 Set Phase 2 (Sucré Salé):');
  console.log('━'.repeat(60));

  const set = data.data;
  console.log(`\n🅰️  Option A: "${set.optionA}"`);
  console.log(`🅱️  Option B: "${set.optionB}"`);

  const itemCount = set.items ? set.items.length : 0;
  console.log(`\n📋 Items (${itemCount}):\n`);

  if (set.items) {
    set.items.forEach((item, i) => {
      const emoji = item.answer === 'A' ? '🅰️' : item.answer === 'B' ? '🅱️' : '🔀';
      console.log(`${i+1}. "${item.text}"`);
      console.log(`   → Réponse: ${emoji} ${item.answer}`);
      if (item.justification) {
        console.log(`   📝 ${item.justification}`);
      }
      console.log();
    });
  }

  console.log('━'.repeat(60));
  console.log('📊 Usage:');
  const tokenCount = data.usage && data.usage.totalTokenCount ? data.usage.totalTokenCount : 'N/A';
  console.log(`   Tokens: ${tokenCount}`);

  // Check for justifications
  const withJustification = set.items ? set.items.filter(i => i.justification).length : 0;
  console.log(`\n✨ Items avec justification: ${withJustification}/${itemCount}`);

} catch (error) {
  console.error('\n❌ Erreur:', error.message);
  if (error.details) console.error('   Détails:', error.details);
}

process.exit(0);
