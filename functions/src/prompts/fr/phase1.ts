/**
 * French Phase 1 (Tenders) Prompts
 * Speed MCQ questions in Burger Quiz style
 */

export const PHASE1_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère 10 questions "Tenders" dans le style EXACT de l'émission.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

AMBIANCE APÉRO - ON VEUT RIGOLER !
⚠️ RÈGLE CLÉ : Les QUESTIONS doivent être drôles, pas les réponses !

✅ QUESTIONS DRÔLES (ce qu'on veut) :
- Formulations décalées : "Quel super-héros porte son slip par-dessus son pantalon ?"
- Tournures inattendues : "Quel dictateur avait une moustache ridicule et détestait les juifs ?"
- Fausses évidences : "De quelle couleur est le cheval blanc d'Henri IV ?"
- Jeux de mots dans la question : "Quel animal fait 'meuh' et donne du lait ?"
- Questions absurdes mais avec vraie réponse : "Quel animal peut survivre dans l'espace ?"

✅ RÉPONSES PLAUSIBLES (IMPORTANT) :
- Les 4 options doivent être CRÉDIBLES et du même registre
- On doit HÉSITER entre les réponses, pas deviner la bonne immédiatement
- Exemple : "Capitale de l'Australie ?" → "Canberra", "Sydney", "Melbourne", "Brisbane" (toutes crédibles !)
- PAS de réponse blague évidente qui trahit la bonne réponse

❌ À ÉVITER :
- Réponses trop absurdes qui rendent la bonne réponse évidente
- Questions style BAC ou encyclopédie (la FORMULATION doit être fun)
- Formulations trop longues

LONGUEUR - COURT ET PUNCHY :
- Questions COURTES (max 20 mots, idéalement 10-15)
- Réponses COURTES (1-3 mots max)
- Pas besoin de contexte complexe

ANECDOTE OBLIGATOIRE :
- Fait fun/WTF/insolite sur la bonne réponse
- Style "Le saviez-vous ?" mais en mode apéro
- Max 25 mots, ton léger

FORMAT TEXTE - INTERDIT :
- PAS de markdown (pas de **, *, #, etc.)
- Texte brut uniquement

JSON Format :
[
  {
    "text": "Question fun et courte ?",
    "options": ["Bonne réponse", "Option drôle 1", "Option drôle 2", "Option drôle 3"],
    "correctIndex": 0,
    "anecdote": "Anecdote fun et courte"
  }
]`;

export const PHASE1_GENERATOR_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère 10 questions "Tenders" (QCM) fun et accessibles.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

AMBIANCE APÉRO - ON EST LÀ POUR RIGOLER !

✅ QUESTIONS DRÔLES (L'HUMOUR EST DANS LA QUESTION) :
- Formulations DÉCALÉES : "Quel rappeur français a le même nom qu'un gros singe ?"
- Tournures INATTENDUES : "Quel président français mesurait la taille d'un Schtroumpf ?"
- JEUX DE MOTS dans la question elle-même
- Questions avec IMAGES MENTALES drôles : "Quel fruit jaune glisse sous les pieds des personnages de cartoon ?"
- Fausses évidences qui font douter

✅ RÉPONSES PLAUSIBLES ET CRÉDIBLES (CRITIQUE) :
- Les 4 options doivent être du MÊME REGISTRE (toutes sérieuses ou toutes du même type)
- Le joueur doit HÉSITER, pas deviner la bonne réponse par élimination
- INTERDIT : 3 blagues + 1 réponse sérieuse (trop facile !)

⚠️ RÈGLE ANTI-SPOILER (CRITIQUE) ⚠️
La réponse correcte ne doit JAMAIS être révélée par la question !

❌ INTERDIT - Réponse dans la question :
- "Que faut-il pour tourner les serviettes ?" → "Une serviette"
  (Le mot "serviette" est DANS la question !)
- "Quelle danse s'appelle la danse des canards ?" → "La danse des canards"
  (Reformuler la question !)

✅ REFORMULATIONS ACCEPTÉES :
- "Quelle est la chorégraphie culte de Patrick Sébastien ?" → "Tourner les serviettes"
- "Quelle danse aviaire fait fureur dans les mariages ?" → "La danse des canards"

TEST : La bonne réponse apparaît-elle (même partiellement) dans la question ?
- Si OUI → REFORMULER la question
- Si NON → OK

EXEMPLES :
✅ BON : "Quel animal peut dormir 22h par jour ?" → Koala, Paresseux, Chat, Chauve-souris
❌ MAUVAIS : "Quel animal dort beaucoup ?" → Koala, Ta mère, Chuck Norris, Mon ex

🎭 GALERIE DES HORREURS - TRANSFORMATIONS OBLIGATOIRES 🎭
Voici comment transformer une question ennuyeuse en question Burger Quiz :

❌ AVANT (Wikipedia/ennuyeux)              → ✅ APRÈS (Burger Quiz/drôle)
─────────────────────────────────────────────────────────────────────────
"Quel ustensile a été perdu lors         → "Quel objet de cuisine a décidé de
d'une sortie spatiale en 2006 ?"           s'évader de la NASA pour prendre
                                           des vacances orbitales en 2006 ?"

"Quelle substance corporelle gelait      → "Qu'est-ce que les astronautes
en orbite dans les navettes Apollo ?"      transforment en feux d'artifice
                                           gratuits, juste en faisant pipi ?"

"Quel jouet a passé 15 mois dans         → "Quel personnage de Pixar a pris
la Station Spatiale Internationale ?"      l'expression 'vers l'infini et au-delà'
                                           un peu trop au sérieux pendant 15 mois ?"

"Quelle voiture a été envoyée            → "Quelle voiture électrique a décidé
vers Mars en 2018 ?"                       que la Terre était trop mainstream
                                           et préfère rouler vers Mars ?"

"Quel rappeur français porte le          → "Quel rappeur français partage son
même nom qu'un primate ?"                  blaze avec un gros singe poilu ?"

TECHNIQUES DE REFORMULATION :
- PERSONNIFIE les objets : "a décidé de", "s'est fait la malle", "préfère"
- MÉTAPHORES ABSURDES : "prendre des vacances orbitales", "trop mainstream"
- EXAGÉRATION COMIQUE : "feux d'artifice gratuits", "un peu trop au sérieux"
- QUESTIONS FAUSSEMENT NAÏVES : "Qu'est-ce qui..." au lieu de "Quel élément..."
- RÉFÉRENCES POP : "vers l'infini et au-delà", "trop mainstream"

⚠️ TEST DU BEAU-FRÈRE (PLAUSIBILITÉ DES OPTIONS) ⚠️
Imagine ton beau-frère un peu bourré à un apéro qui doit répondre.

RÈGLE : S'il peut éliminer 2+ options en ricanant "c'est une blague !" → MAUVAIS SET

❌ EXEMPLE RATÉ :
"Quelles figurines la NASA a envoyées sur Jupiter ?"
→ "G.I. Joe" ← Blague militaire évidente, le beau-frère ricane
→ "Petits Poneys" ← Blague évidente, le beau-frère ricane
→ "Playmobil" ← Presque crédible...
→ "LEGO" ✓ ← Seule option sérieuse

Résultat : Le beau-frère élimine 2 options instantanément → IL DEVINE LEGO → MAUVAIS !

✅ EXEMPLE RÉUSSI :
"Quelles figurines la NASA a envoyées sur Jupiter ?"
→ "LEGO" ✓
→ "Playmobil" ← NASA a collaboré avec des marques de jouets
→ "K'Nex" ← Marque de construction américaine, crédible
→ "Meccano" ← Marque historique, pourquoi pas

Résultat : Le beau-frère hésite vraiment entre les 4 → BON SET !

TEST À APPLIQUER POUR CHAQUE QUESTION :
"Est-ce que 10-20% des joueurs pourraient choisir CHAQUE mauvaise réponse ?"
- Si une option ferait rire tout le monde → REMPLACER
- Si une option est clairement une blague → REMPLACER
- Si 3 options sont du même type et 1 est différente → REMPLACER la différente

RÈGLE DE PLAUSIBILITÉ DES 4 OPTIONS (CRITIQUE) :
Toutes les options doivent appartenir au MÊME REGISTRE sémantique.

❌ REGISTRES MÉLANGÉS (INTERDIT) :
- Question sur les danses → "Danse des canards", "Le dindon de la farce", "Le lac des cygnes"
  PROBLÈME : "Le dindon de la farce" est une EXPRESSION, pas une danse !

- Question sérieuse → "Option A", "Option B", "Faire la vaisselle", "Option D"
  PROBLÈME : "Faire la vaisselle" est une blague évidente parmi options sérieuses

✅ MÊME REGISTRE (CORRECT) :
- Question sur les danses → "Danse des canards", "Macarena", "Kuduro", "Madison"
  (Toutes sont de VRAIES danses de soirée)

- Question sur les films → "Big Mamma", "Madame Doubtfire", "Tootsie", "Mrs. Brown"
  (Tous sont des films avec travestissement)

TEST DE PLAUSIBILITÉ :
Pour chaque mauvaise réponse, demande-toi :
"Est-ce que 10-20% des joueurs pourraient choisir cette réponse ?"
- Si OUI → Bonne option
- Si NON (réponse absurde/blague évidente) → REMPLACER

❌ À ÉVITER :
- Mauvaises réponses absurdes/blagues (ça donne la bonne réponse !)
- Questions style encyclopédie (formulation ennuyeuse)
- Sujets obscurs

❌ TYPES DE QUESTIONS À ÉVITER :

1. RÉPONSE LITTÉRALE :
   ❌ "Avec quoi fait-on la danse des serviettes ?" → "Des serviettes"
   ✅ "Quel accessoire Patrick Sébastien fait-il virevolter ?" → "Une serviette"

2. OPTIONS HORS-SUJET :
   ❌ Options qui ne sont pas du même type que la bonne réponse
   Exemple : Question sur des acteurs → 3 acteurs + "Mon voisin Jean-Pierre"

3. CONTEXTE QUI ÉLIMINE :
   ❌ "Dans ce film d'action avec Schwarzenegger, quelle est l'épreuve ?"
   → Si le contexte élimine 3 options sur 4, c'est trop facile

4. UNE SEULE OPTION SÉRIEUSE :
   ❌ 3 blagues + 1 réponse sérieuse → le joueur devine par élimination
   ✅ 4 options toutes crédibles → le joueur doit vraiment réfléchir

5. DOUBLONS SÉMANTIQUES (CRITIQUE) :
   ❌ Deux options qui sont EN RÉALITÉ la même chose
   Exemples INTERDITS :
   - "Le soufre" ET "L'œuf pourri" → l'œuf pourri SENT le soufre (H2S) !
   - "La capitale" ET "Paris" → si la question porte sur la France
   - "Un félin" ET "Un chat" → l'un inclut l'autre
   - "L'océan" ET "La mer" → trop similaires

   TEST : Si un joueur cultivé peut dire "mais c'est la même chose !" → REMPLACER une des options

RÈGLES SIMPLES :

1. BONNE RÉPONSE = VRAI
   - VÉRIFIE avec Google que c'est correct
   - Une seule réponse possible, indiscutable

2. COURT ET PUNCHY :
   - Questions : 10-20 mots max (idéalement ~12)
   - Réponses : 1-3 mots max
   - Si c'est trop long, raccourcis !

3. ANECDOTE FUN :
   - Un fait WTF ou insolite sur la bonne réponse
   - Ton léger, style "tu savais que..."
   - Max 25 mots

4. PAS DE MARKDOWN

{PREVIOUS_FEEDBACK}

FORMAT JSON :
[
  {
    "text": "Question drôle et courte ?",
    "options": ["Bonne réponse", "Option drôle", "Autre option drôle", "Encore plus drôle"],
    "correctIndex": 0,
    "anecdote": "Fait insolite fun",
    "verification": "Source de vérification"
  }
]

10 questions exactement. Pas de markdown.`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `Tu es le juge fun de "Burger Quiz".
Analyse ces questions Phase 1 et vérifie qu'elles sont DRÔLES et CORRECTES.

QUESTIONS PROPOSÉES :
{QUESTIONS}

CRITÈRES D'ÉVALUATION (score 1-10) :

1. EXACTITUDE (CRITIQUE) :
   - La bonne réponse est-elle VRAIE et vérifiable ?
   - VÉRIFIE avec Google si besoin
   ❌ SI la bonne réponse est FAUSSE → REJETTE

2. QUESTION DRÔLE (IMPORTANT) :
   - La FORMULATION de la question fait-elle sourire ?
   - Y a-t-il un jeu de mots, une tournure décalée, une image mentale drôle ?
   ❌ Question trop sérieuse/encyclopédique = pas fun

3. RÉPONSES PLAUSIBLES (CRITIQUE) :
   - Les 4 options sont-elles du MÊME REGISTRE ?
   - Peut-on HÉSITER entre les réponses ?
   ❌ SI 3 blagues + 1 sérieuse → REJETTE (trop facile de deviner !)
   ❌ SI les mauvaises réponses sont absurdes → REJETTE

3b. ANTI-SPOILER (CRITIQUE) :
   - La bonne réponse apparaît-elle dans la question ?
   - Un mot de la question révèle-t-il directement la réponse ?
   ❌ SI OUI → REJETTE (la question doit être reformulée)
   Exemple interdit : "Que faut-il pour tourner les serviettes ?" → "Une serviette"

3c. COHÉRENCE DES REGISTRES (CRITIQUE) :
   - Les 4 options sont-elles du MÊME TYPE ?
   - Vérifie : toutes des danses, tous des films, tous des acteurs, etc.
   ❌ SI une option est une expression/blague parmi des items réels → REJETTE
   Exemple interdit : "Danse des canards", "Le dindon de la farce", "Macarena", "Kuduro"
   (Le dindon de la farce est une EXPRESSION, pas une danse)

4. ACCESSIBILITÉ :
   - Tout le monde peut comprendre et participer ?
   - Questions culture pop plutôt qu'encyclopédie ?

5. LONGUEUR :
   - Questions courtes et percutantes ?
   - Réponses de 1-3 mots ?

SOIS STRICT sur :
- La bonne réponse doit être VRAIE
- Les mauvaises réponses doivent être CRÉDIBLES (pas des blagues évidentes)
- La QUESTION doit être fun (pas les réponses)

SOIS INDULGENT sur :
- Le ton décalé dans les questions
- Les références pop culture

⚠️ CRITÈRES DE REJET AUTOMATIQUE ⚠️

1. QUESTION ENNUYEUSE (style Wikipedia) :
   - Si la question ressemble à une définition d'encyclopédie → REJETER
   - Test "GAD ELMALEH" : Est-ce que Gad Elmaleh pourrait poser cette question sur scène ?
     • Si OUI → question OK
     • Si NON (trop scolaire, pas drôle) → REJETER
   - Exemples à REJETER :
     • "Quel ustensile a été perdu lors d'une sortie spatiale ?" → trop factuel
     • "Quelle substance corporelle gelait en orbite ?" → style cours de physique

2. OPTIONS NON PLAUSIBLES :
   - Si 2+ options sont des blagues évidentes → REJETER la question
   - Test du BEAU-FRÈRE : Un beau-frère bourré pourrait-il éliminer 2+ options ?
     • Si OUI → OPTIONS À REFAIRE
   - Exemples à REJETER :
     • "G.I. Joe", "Petits Poneys" pour une question NASA → blagues évidentes
     • "Ta mère", "Chuck Norris", "Mon ex" → pas du même registre

3. MANQUE DE PUNCH :
   - La question n'a AUCUN de ces éléments → REJETER :
     • Jeu de mots
     • Image mentale drôle
     • Tournure décalée/absurde
     • Personnification
     • Exagération comique

⚠️ SEUILS DE SCORE STRICTS ⚠️

- burger_quiz_style < 6 → REJETER la question (formulation pas assez fun)
- clarity < 7 → REJETER (options pas assez plausibles)
- Si plus de 3 questions avec burger_quiz_style < 6 → REJETER TOUT LE SET

COMPTAGE OBLIGATOIRE :
Pour chaque question, indique dans le feedback :
- "style_score": 1-10 (la formulation est-elle drôle/décalée ?)
- "plausibility_score": 1-10 (les 4 options font-elles vraiment hésiter ?)

FORMAT JSON :
{
  "approved": true | false,
  "scores": {
    "factual_accuracy": 1-10,
    "clarity": 1-10,
    "burger_quiz_style": 1-10,
    "variety": 1-10,
    "anecdotes": 1-10,
    "celebrities": 1-10
  },
  "overall_score": 1-10,
  "questions_feedback": [
    {
      "index": 0,
      "text": "La question",
      "ok": true | false,
      "issue": "Problème si rejeté",
      "issue_type": "factual_error" | "boring_question" | "obvious_answers" | "too_long" | null
    }
  ],
  "global_feedback": "Feedback général",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

NOTE SUR LES SCORES :
- clarity = les réponses sont-elles PLAUSIBLES (pas des blagues évidentes) ?
- burger_quiz_style = la QUESTION est-elle drôle/décalée ?
- variety = mix de sujets variés ?
- anecdotes = anecdotes intéressantes ?
- celebrities = références pop culture ?

Pas de markdown.`;

export const PHASE1_TARGETED_REGENERATION_PROMPT = `Tu dois REMPLACER certaines questions Phase 1 "Tenders" qui ont été rejetées.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

QUESTIONS À GARDER (NE PAS TOUCHER) :
{GOOD_QUESTIONS}

QUESTIONS À REMPLACER (indices: {BAD_INDICES}) :
{BAD_QUESTIONS}

RAISONS DU REJET :
{REJECTION_REASONS}

INSTRUCTIONS :
- Génère EXACTEMENT {COUNT} nouvelles questions pour remplacer celles rejetées
- HUMOUR DANS LA FORME : formulations drôles, décalées, pièges
- SÉRIEUX DANS LE FOND : contenu factuel et vérifiable
- VÉRIFIE les faits avec Google Search
- Ajoute une anecdote pour chaque question
- Les réponses doivent être 100% vérifiables et INDISCUTABLES
- NE RÉPÈTE PAS les erreurs des questions rejetées

JSON Format (STRICTEMENT ce format) :
[
  {
    "text": "Question style Burger Quiz en français ?",
    "options": ["Bonne réponse", "Mauvaise 1", "Mauvaise 2", "Mauvaise 3"],
    "correctIndex": 0,
    "anecdote": "Fait amusant court sur la bonne réponse"
  }
]

{COUNT} questions exactement. Pas de markdown.`;

export const REVIEW_PHASE1_PROMPT = `Analyse ces questions Phase 1 (Tenders/MCQ) :

{QUESTIONS}

Pour CHAQUE question, vérifie ces critères (DANS L'ORDRE) :

1. RÉPONSE CORRECTE (CRITIQUE) :
   - UTILISE Google Search pour vérifier que la bonne réponse est 100% factuelle
   - Si tu as le moindre doute → REJET
   - Les 3 mauvaises réponses doivent être clairement fausses

2. QUESTION SANS AMBIGUÏTÉ (CRITIQUE) :
   - La question doit avoir UNE SEULE réponse possible
   - Pas de formulation vague ou interprétable
   - Pas de "peut-être" ou "généralement"
   - Si plusieurs réponses pourraient être valides → REJET

3. STYLE BURGER QUIZ (HUMOUR DANS LA FORME) :
   - La FORMULATION doit être drôle, décalée, ou piège
   - Le CONTENU doit rester sérieux et factuel
   - PAS de formulation académique/style Wikipedia
   - Si formulation trop scolaire OU contenu inventé → REJET

4. ANECDOTE :
   - Doit être vraie et vérifiable
   - Doit apporter quelque chose d'intéressant

Retourne un JSON :
{
  "reviews": [
    {
      "index": 0,
      "status": "approved" | "rejected",
      "reason": "Raison si rejeté (sinon null)",
      "issue": "answer_wrong" | "ambiguous" | "style" | "anecdote" | null
    }
  ],
  "summary": {
    "approved": 8,
    "rejected": 2,
    "rejectedIndices": [3, 7]
  }
}`;

export const REGENERATE_PHASE1_PROMPT = `Tu dois régénérer {COUNT} question(s) pour remplacer celles qui ont été rejetées.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

Questions rejetées et raisons :
{REJECTED_REASONS}

INSTRUCTIONS :
- Génère EXACTEMENT {COUNT} nouvelles questions
- Corrige les problèmes mentionnés
- HUMOUR DANS LA FORME : formulations drôles, décalées, pièges
- SÉRIEUX DANS LE FOND : contenu factuel et vérifiable
- Vérifie les faits avec Google Search
- Ajoute une anecdote pour chaque question

JSON Format (STRICTEMENT ce format) :
[
  {
    "text": "Question style Burger Quiz en français...",
    "options": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant court sur la bonne réponse"
  }
]`;
