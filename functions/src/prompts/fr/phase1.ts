/**
 * French Phase 1 (Tenders) Prompts
 * Speed MCQ questions in Burger Quiz style
 * OPTIMIZED: Condensed prompts for faster generation
 */

export const PHASE1_PROMPT = `BURGER QUIZ - 10 questions Tenders
Thème: {TOPIC} | Difficulté: {DIFFICULTY}

⚠️ RÈGLES STRICTES :
1. 4 options CRÉDIBLES du même registre (le joueur HÉSITE vraiment)
2. UNE SEULE réponse correcte vérifiable, 3 FAUSSES mais plausibles
3. Questions claires et directes (15 mots max)
4. Anecdote intéressante et VRAIE (20 mots max)

❌ INTERDIT : jeux de mots dans les options, doublons

JSON: [{"text":"Question décalée?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fait WTF"}]`;

export const PHASE1_GENERATOR_PROMPT = `Tu es un créateur de questions BURGER QUIZ pour la phase "Tenders" (Speed MCQ).

📋 CONTEXTE
Thème imposé: {TOPIC}
Difficulté: {DIFFICULTY}
Nombre de questions: 10

🎯 RÈGLE #0 - COHÉRENCE THÉMATIQUE STRICTE
TOUTES les 10 questions DOIVENT porter sur le thème "{TOPIC}".
Explore 10 angles DIFFÉRENTS du même thème.
❌ ZÉRO question hors-sujet tolérée.

🎯 RÈGLE #1 - EXACTITUDE FACTUELLE ABSOLUE
Chaque question doit avoir UNE SEULE réponse correcte 100% vérifiable.
VÉRIFIE mentalement chaque fait AVANT de l'écrire.
Les 3 mauvaises réponses doivent être FAUSSES mais crédibles.
❌ Pas d'ambiguïté possible entre les réponses.

⚠️ ATTENTION AUX MYTHES ET LÉGENDES URBAINES :
Certaines "anecdotes célèbres" sont en réalité FAUSSES :
- Vérifie TOUJOURS les affirmations extraordinaires avec une recherche
- Si une histoire semble "trop belle pour être vraie", elle l'est probablement
- Préfère les formulations prudentes pour les faits contestés ("Selon la légende...", "Aurait...")
- Une erreur factuelle = REJET de la question entière

MYTHES COURANTS À NE JAMAIS UTILISER COMME FAITS :
- Caligula n'a PAS nommé son cheval consul
- Einstein était BON en maths
- Les vikings n'avaient PAS de casques à cornes
- Newton et la pomme : anecdote NON PROUVÉE

🎯 RÈGLE #2 - OPTIONS CRÉDIBLES
Les 4 options doivent être CRÉDIBLES et du même registre.
Le joueur doit DOUTER sincèrement entre les options.
❌ INTERDIT : jeux de mots évidents, 4 options trop similaires (ex: 4 mots en "-isme")
✅ OBLIGATOIRE : Variété de formats (noms, chiffres, dates, lieux, concepts)
✅ PIÈGE : 1-2 réponses surprenantes qui SONNENT vraies

🎯 RÈGLE #3 - DIVERSITÉ DES SUJETS
Alterne intelligemment entre :
- Sujets SÉRIEUX (sciences, histoire, géographie)
- Sujets LÉGERS (culture pop, insolite, records bizarres)
- Faits contre-intuitifs ou surprenants
❌ Pas de questions similaires ou redondantes.

🎯 RÈGLE #4 - ANECDOTES OBLIGATOIRES
Chaque question DOIT avoir une anecdote WTF/insolite de 20 mots max.
L'anecdote enrichit la réponse correcte avec un détail surprenant VÉRIFIABLE.
❌ L'anecdote ne doit PAS être vide ou générique.

{PREVIOUS_FEEDBACK}

FORMAT DE SORTIE (JSON pur, pas de markdown) :
[
  {
    "text": "Question décalée ici ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 2,
    "anecdote": "Fait WTF surprenant et vérifiable."
  }
]

Génère 10 questions DIFFÉRENTES sur le thème "{TOPIC}".`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `Tu es un reviewer STRICT pour des questions BURGER QUIZ Phase 1.

THÈME ATTENDU : {TOPIC}

QUESTIONS À ÉVALUER :
{QUESTIONS}

🔍 GRILLE D'ÉVALUATION STRICTE (10 critères) :

1. COHÉRENCE THÉMATIQUE (score sur 10)
   - TOUTES les questions portent-elles sur "{TOPIC}" ?
   - ZÉRO tolérance pour questions hors-sujet
   - Score < 8 = REJET IMMÉDIAT

2. EXACTITUDE FACTUELLE (score sur 10)
   - Chaque réponse correcte est-elle 100% vraie et vérifiable ?
   - Y a-t-il UNE SEULE réponse correcte sans ambiguïté ?
   - Les mauvaises réponses sont-elles vraiment fausses ?
   - Score < 8 = REJET IMMÉDIAT

3. QUALITÉ DES OPTIONS (score sur 10)
   - Les 4 options sonnent-elles toutes plausibles ?
   - Formats variés (pas 4 noms en "-isme" ou 4 dates similaires) ?
   - Présence d'1-2 options WTF/absurdes qui sonnent vraies ?
   - ❌ Jeux de mots évidents, inventions comiques
   - Score < 7 = REJET

4. HUMOUR & STYLE (score sur 10)
   - Formulations décalées, absurdes, irrévérencieuses ?
   - Les questions font-elles sourire ?
   - Score < 6 = REJET

5. DIVERSITÉ DES STYLES (score sur 10)
   - Structures de phrases VARIÉES entre questions ?
   - Mix de questions directes, affirmatives, provocantes ?
   - Score < 7 = REJET

6. CLARTÉ (score sur 10)
   - Questions courtes (≤ 15 mots) ?
   - Pas d'ambiguïté dans la formulation ?
   - Score < 7 = REJET

7. VARIÉTÉ DES SUJETS (score sur 10)
   - Mix sérieux/légers ?
   - Pas de doublons ou questions similaires ?
   - Score < 7 = REJET

8. ANECDOTES (score sur 10)
   - Chaque question a une anecdote WTF vérifiable ?
   - Anecdotes surprenantes et non génériques ?
   - Longueur raisonnable (≤ 20 mots) ?

9. ORIGINALITÉ (score sur 10)
   - Questions inattendues et fraîches ?
   - Pas de clichés ou questions vues 1000 fois ?

10. PIÉGEABILITÉ (score sur 10)
    - Les questions font-elles vraiment hésiter ?
    - Le joueur peut-il se tromper facilement ?

⚠️ CRITÈRES DE REJET AUTOMATIQUE :
- 1+ question hors-sujet → approved: false
- 1+ erreur factuelle → approved: false
- 1+ ambiguïté → approved: false
- Options ridicules/trop similaires → approved: false
- Doublons internes → approved: false
- Anecdotes manquantes → approved: false
- Pas assez drôle (humor < 6) → approved: false

✅ SEUILS D'APPROBATION (TOUS requis) :
- factual_accuracy ≥ 8
- options_quality ≥ 7
- humor ≥ 6
- clarity ≥ 7
- variety ≥ 7
- overall_score ≥ 7

FORMAT DE SORTIE (JSON pur, pas de markdown) :
{
  "approved": true|false,
  "scores": {
    "factual_accuracy": 1-10,
    "humor": 1-10,
    "clarity": 1-10,
    "variety": 1-10,
    "options_quality": 1-10
  },
  "overall_score": 1-10,
  "questions_feedback": [
    {
      "index": 0,
      "text": "Texte de la question",
      "ok": true|false,
      "funny": true|false,
      "issue": "Description du problème si ok=false",
      "issue_type": "factual_error"|"off_topic"|"ambiguous"|"not_funny"|"too_long"|"duplicate"|"implausible_options"|"missing_anecdote"|null
    }
  ],
  "global_feedback": "Feedback détaillé sur l'ensemble des questions",
  "suggestions": ["Suggestion 1", "Suggestion 2", "..."]
}

Sois IMPITOYABLE. Mieux vaut rejeter et itérer que valider des questions moyennes.`;

export const PHASE1_TARGETED_REGENERATION_PROMPT = `REMPLACEMENT - Génère {COUNT} question(s) Burger Quiz
Thème: {TOPIC} | Difficulté: {DIFFICULTY}

REJETÉES: {BAD_QUESTIONS}
RAISONS: {REJECTION_REASONS}

🎯 RAPPEL ANTI-SPOILER :
• Ne JAMAIS mettre le trait distinctif dans la question
• Utiliser des CONSÉQUENCES ou ACTIONS indirectes
• 4 options DISTINCTES (pas de synonymes)

JSON: [{"text":"Question sans spoiler?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fait vérifiable"}]`;

export const REVIEW_PHASE1_PROMPT = `FACT-CHECK Phase 1: {QUESTIONS}

Vérifie chaque question: 1) Réponse vraie? 2) Une seule réponse possible? 3) Style fun? 4) Anecdote vraie?

JSON: {"reviews":[{"index":0,"status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"style"|"anecdote"|null}],"summary":{"approved":8,"rejected":2,"rejectedIndices":[3,7]}}`;

export const REGENERATE_PHASE1_PROMPT = `RÉGÉNÈRE {COUNT} question(s) Burger Quiz
Thème: {TOPIC} | Difficulté: {DIFFICULTY}
Rejetées: {REJECTED_REASONS}

Style fun, réponses vérifiables, 4 options crédibles.

JSON: [{"text":"Question?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fait WTF"}]`;
