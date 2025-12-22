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

export const PHASE1_GENERATOR_PROMPT = `BURGER QUIZ - Génère 10 questions Tenders
Thème: {TOPIC} | Difficulté: {DIFFICULTY}

🎤 STYLE ALAIN CHABAT - VARIE LES FORMULATIONS !

⚡ STRUCTURES DE QUESTIONS (alterne entre TOUTES) :
1. FAUSSE NAÏVETÉ : "Comment ça s'appelle déjà, le truc qui..."
2. DESCRIPTION ABSURDE : "Quel bidule à 4 pattes fait 'wouf' et bave sur tes chaussures ?"
3. COMPARAISON DÉCALÉE : "Quel animal dort plus que ton ado le dimanche ?"
4. QUESTION RHÉTORIQUE : "Qui a eu la brillante idée d'inventer..."
5. PERSONNIFICATION : "Quel objet a décidé de se rebeller contre..."
6. EUPHÉMISME IRONIQUE : "Quel événement a légèrement perturbé..."
7. ANTIPHRASE : "Quel génie a pensé que ce serait malin de..."
8. ÉNUMÉRATION TRONQUÉE : "Pain, salade, tomate et... quel fromage ?"

EXEMPLES VARIÉS (chaque question = style différent) :
• [Naïveté] "C'est quoi déjà le nom du bonhomme vert qui habite dans les marais ?" → Shrek
• [Absurde] "Quel mammifère à rayures ressemble à un cheval qui aurait testé un filtre Instagram ?" → Zèbre
• [Rhétorique] "Qui a eu l'idée lumineuse de coller des ailes à un cheval ?" → Pégase
• [Euphémisme] "Quel iceberg a légèrement gêné la croisière du Titanic ?" → Celui de l'Atlantique Nord
• [Antiphrase] "Quel génie a décidé de goûter une pomme random dans un jardin ?" → Ève
• [Énumération] "Astérix, Obélix, Idéfix et... quel druide ?" → Panoramix

⚠️ RÉPONSES - 3 crédibles + 1 qui fait sourire mais reste plausible

RÈGLES : Fait vérifiable, une seule bonne réponse, pas de spoiler dans la question.

{PREVIOUS_FEEDBACK}

JSON: [{"text":"Question?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fait WTF 20 mots max"}]

10 questions variées. Pas de markdown.`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `REVIEWER BURGER QUIZ - Évalue ces questions Phase 1

{QUESTIONS}

🔍 VÉRIFICATION (par question) :

1. FACT-CHECK : Réponse vraie ? Mauvaises réponses fausses ? Pas d'ambiguïté ?

2. STYLE : Question drôle style Burger Quiz ? Pas Wikipedia/exam ?

3. RÉPONSES : 3 crédibles + 1 fun mais plausible ? On hésite vraiment ?

4. VARIÉTÉ DES FORMULATIONS (CRITIQUE) :
   ❌ Si toutes les questions utilisent le même pattern → variety < 5
   ✓ Mélange : naïveté, absurde, comparaison, rhétorique, personnification, euphémisme...

5. ANTI-SPOILER : Réponse pas dans la question ?

⚠️ REJETS : Fait douteux, question plate, réponses évidentes, manque de variété

SEUILS : factual_accuracy ≥ 8, clarity ≥ 7, burger_quiz_style ≥ 7, variety ≥ 6, overall ≥ 7

JSON:
{
  "approved": true|false,
  "scores": {"factual_accuracy":1-10,"clarity":1-10,"burger_quiz_style":1-10,"variety":1-10,"anecdotes":1-10},
  "overall_score": 1-10,
  "questions_feedback": [{"index":0,"text":"...","ok":true|false,"issue":"...","issue_type":"factual_error"|"boring_question"|"obvious_answers"|"repetitive_style"|"ambiguous"|null}],
  "global_feedback": "...",
  "suggestions": ["..."]
}`;

export const PHASE1_TARGETED_REGENERATION_PROMPT = `REMPLACEMENT - Génère {COUNT} question(s) Burger Quiz
Thème: {TOPIC} | Difficulté: {DIFFICULTY}

REJETÉES (indices {BAD_INDICES}): {BAD_QUESTIONS}
RAISONS: {REJECTION_REASONS}
GARDER: {GOOD_QUESTIONS}

CORRIGE les erreurs mentionnées. Style fun, réponses vérifiables, 4 options crédibles.

JSON: [{"text":"Question?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fait WTF"}]`;

export const REVIEW_PHASE1_PROMPT = `FACT-CHECK Phase 1: {QUESTIONS}

Vérifie chaque question: 1) Réponse vraie? 2) Une seule réponse possible? 3) Style fun? 4) Anecdote vraie?

JSON: {"reviews":[{"index":0,"status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"style"|"anecdote"|null}],"summary":{"approved":8,"rejected":2,"rejectedIndices":[3,7]}}`;

export const REGENERATE_PHASE1_PROMPT = `RÉGÉNÈRE {COUNT} question(s) Burger Quiz
Thème: {TOPIC} | Difficulté: {DIFFICULTY}
Rejetées: {REJECTED_REASONS}

Style fun, réponses vérifiables, 4 options crédibles.

JSON: [{"text":"Question?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fait WTF"}]`;
