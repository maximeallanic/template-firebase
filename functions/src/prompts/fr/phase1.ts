/**
 * French Phase 1 (Tenders) Prompts
 * Speed MCQ questions in Burger Quiz style
 * OPTIMIZED: Condensed prompts for faster generation
 */

export const PHASE1_PROMPT = `BURGER QUIZ - 10 questions Tenders
Thème: {TOPIC} | Difficulté: {DIFFICULTY}

STYLE ALAIN CHABAT - Question drôle, réponses sérieuses :
• "Quel rappeur français porte le même blaze qu'un gros singe poilu ?" → Booba/Maître Gims/Soprano/Nekfeu
• "Quelle chanteuse a plus de streams que de douches par semaine ?" → Aya Nakamura/Angèle/Clara Luciani/Pomme
• "Quel animal passe sa vie à dormir et à manger du bambou comme ton coloc ?" → Panda/Koala/Paresseux/Marmotte

RÈGLES :
1. HUMOUR dans la FORMULATION, pas dans les options
2. 4 options CRÉDIBLES du même registre (on hésite vraiment)
3. Questions courtes (10-15 mots max)
4. Anecdote WTF sur la bonne réponse (20 mots max)
5. Réponse vérifiable sur Google

INTERDIT : Option blague évidente, réponse dans la question, markdown

JSON: [{"text":"Question?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fait insolite"}]`;

export const PHASE1_GENERATOR_PROMPT = `BURGER QUIZ - 10 questions Tenders DRÔLES
Thème: {TOPIC} | Difficulté: {DIFFICULTY}

🎯 RÈGLE #1 - HUMOUR OBLIGATOIRE
Chaque question doit faire SOURIRE grâce à :
- Formulations DÉCALÉES ("C'est quoi déjà...", "Quel génie a pensé...")
- DÉTAILS ABSURDES qui font sourire
- Comparaisons POP CULTURE inattendues

🎯 RÈGLE #2 - QUESTIONS COURTES (max 20 mots)
❌ INTERDIT : Questions à rallonge ennuyeuses
✅ BON : Questions percutantes et mémorables

🎯 RÈGLE #3 - PRÉCISION FACTUELLE
VÉRIFIE avec Google AVANT d'écrire :
✓ Bonne réponse = FAIT établi
✓ 3 mauvaises réponses = vraiment FAUSSES
✓ Anecdote = VRAIE et vérifiable

🎯 RÈGLE #4 - OPTIONS DISTINCTES
4 réponses du MÊME registre, aucun synonyme !

{PREVIOUS_FEEDBACK}

JSON: [{"text":"Question drôle et courte?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fait WTF vérifiable"}]

10 questions DRÔLES, COURTES et PRÉCISES. Pas de markdown.`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `REVIEWER BURGER QUIZ Phase 1

{QUESTIONS}

🔍 VÉRIFICATION EN 4 POINTS :

1. HUMOUR : Questions DRÔLES ? Formulations qui font sourire ?
2. LONGUEUR : Questions COURTES (max 20 mots) ?
3. EXACTITUDE (CRITIQUE) : Utilise Google pour vérifier CHAQUE réponse !
4. OPTIONS : 4 réponses distinctes, pas de synonymes ?

⚠️ REJETER SI :
- Question ennuyeuse ou trop longue
- Erreur factuelle (même mineure)
- Options avec synonymes

SEUILS : factual_accuracy ≥ 8, humor ≥ 6, overall ≥ 7

JSON:
{
  "approved": true|false,
  "scores": {"factual_accuracy":1-10,"humor":1-10,"clarity":1-10,"variety":1-10,"options_quality":1-10},
  "overall_score": 1-10,
  "questions_feedback": [{"index":0,"text":"...","ok":true|false,"funny":true|false,"issue":"...","issue_type":"factual_error"|"not_funny"|"too_long"|"ambiguous"|"duplicate_options"|null}],
  "global_feedback": "...",
  "suggestions": ["..."]
}

Pas de markdown.`;

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
