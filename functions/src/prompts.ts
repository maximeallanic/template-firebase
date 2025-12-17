// --- TOPIC GENERATION ---

export const GENERATE_TOPIC_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère UN thème de quiz original, fun et surprenant.

STYLE OBLIGATOIRE :
- Thèmes décalés, inattendus, parfois absurdes
- Mélange culture pop, food, actualité, sciences, histoire
- Peut être très spécifique ("Les scandales culinaires de 2024") ou large ("La vie en appartement")
- Évite les thèmes trop scolaires ou ennuyeux

EXEMPLES DE BONS THÈMES :
- "Les ratés de l'histoire"
- "Fast-food et gastronomie"
- "Les animaux qui font peur"
- "Célébrités et leurs hobbies bizarres"
- "Les inventions qui ont mal tourné"
- "Le sport vu par quelqu'un qui n'y connaît rien"
- "La géographie approximative"
- "Les expressions françaises qu'on utilise mal"
- "Les films qu'on cite sans les avoir vus"
- "La science du quotidien"
- "Les pires prénoms de bébé"
- "Les dramas de la téléréalité"
- "Les accidents de cuisine célèbres"
- "Les chansons qu'on connaît tous"
- "Les sports bizarres qui existent vraiment"
- "Les records inutiles"
- "Les rumeurs de stars"
- "Les trucs qu'on fait tous mais qu'on avoue pas"

⚠️ THÈMES INTERDITS (trop génériques, JAMAIS ÇA) :
- "Culture générale" ❌
- "Quiz général" ❌
- "Questions diverses" ❌
- "Tout et n'importe quoi" ❌
- "Le monde" ❌
- Tout thème contenant "général" ou "divers" ❌

IMPORTANT :
- Réponds UNIQUEMENT avec le thème, rien d'autre
- Pas de guillemets, pas d'explication
- Maximum 6 mots
- En français
- SOIS CRÉATIF ET SPÉCIFIQUE !`;

// Topic generation specifically for Phase 2 (homophones)
export const GENERATE_TOPIC_PHASE2_PROMPT = `Tu génères un thème pour la phase "Sel ou Poivre" de Burger Quiz.
Cette phase utilise des JEUX DE MOTS / HOMOPHONES français.

CONTRAINTE CRITIQUE :
Le thème doit permettre de créer facilement des HOMOPHONES en français.
Les meilleurs thèmes sont liés à :
- La culture française (régions, villes, gastronomie, expressions)
- Les célébrités françaises et internationales
- La mode, la beauté, les marques connues
- La musique, le cinéma, la télé
- La nourriture et les restaurants
- Les métiers et professions
- Les animaux et la nature

✅ BONS THÈMES (permettent des homophones) :
- "La gastronomie française" → "Vin blanc" / "Vingt blancs"
- "Les régions de France" → "Chair de poule" / "Chère de Pouille"
- "Le monde du cinéma" → "L'écran" / "Les crans"
- "La mode et les tendances" → "Le teint" / "Le thym"
- "Les métiers insolites" → "Le maire" / "La mer"
- "Les célébrités et scandales" → "Sans gêne" / "Cent gènes"
- "La musique pop" → "Le son" / "Les sons"
- "Les animaux de compagnie" → "Le chat" / "Le shah"

❌ MAUVAIS THÈMES (trop abstraits pour homophones) :
- "Les dinosaures et la pizza" → pas d'homophones évidents
- "Les robots du futur" → trop éloigné de la langue française
- "L'espace et les étoiles" → difficile à transformer en jeux de mots

RÉPONDS UNIQUEMENT avec le thème, rien d'autre.
Maximum 5 mots. En français.`;

// --- GAME GENERATION (SPICY VS SWEET) ---

export const GAME_GENERATION_SYSTEM_PROMPT = `Tu es l'animateur de "Spicy vs Sweet", un jeu-quiz délirant inspiré de Burger Quiz.
Ton style :
- Chaotique & rapide
- Drôle & absurde (WTF)
- Parfois faussement sérieux
- STRICTEMENT en FRANÇAIS

Tu génères du contenu de jeu basé sur la PHASE et le THÈME demandés.
La sortie DOIT être du JSON valide correspondant au schéma demandé.`;

export const PHASE1_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère 10 questions "Tenders" dans le style EXACT de l'émission.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

STYLE BURGER QUIZ - OBLIGATOIRE :
- Questions pièges avec formulations trompeuses ("Quel est le prénom du Père Noël ?")
- Humour absurde et décalé
- Fausses évidences qui font douter
- Jeux de mots et calembours
- Références culture pop, food, ou actualité
- Questions qui semblent faciles mais qui piègent

LONGUEUR DES QUESTIONS - TRÈS VARIÉ (OBLIGATOIRE) :
Tu DOIS alterner entre différentes longueurs pour garder le rythme dynamique :
- 3-4 questions TRÈS COURTES (5-10 mots) : "Capitale de la France ?" / "Couleur du ciel ?"
- 3-4 questions COURTES (12-18 mots) : "Quel animal est le symbole de la République française ?"
- 2-3 questions MOYENNES (20-30 mots) : questions avec contexte ou mise en situation
- Maximum 35 mots par question, jamais plus
- Les réponses doivent être courtes (1-3 mots max)

IMPORTANT - VÉRIFICATION DES FAITS :
- Utilise la recherche Google pour VÉRIFIER que chaque bonne réponse est 100% factuelle
- Ne génère JAMAIS de question avec une réponse douteuse ou approximative
- Les 3 mauvaises réponses doivent être plausibles mais fausses

ANECDOTE OBLIGATOIRE :
- Ajoute une anecdote fun/surprenante/WTF sur la bonne réponse
- L'anecdote doit être COURTE (1-2 phrases, max 30 mots)
- Doit être lisible rapidement à l'écran

FORMAT TEXTE - INTERDIT :
- PAS de markdown (pas de **, *, #, etc.)
- PAS de caractères spéciaux inutiles
- Texte brut uniquement, lisible directement à l'écran

JSON Format (STRICTEMENT ce format, texte brut sans markdown) :
[
  {
    "text": "Question style Burger Quiz en français...",
    "options": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant court sur la bonne réponse"
  }
]`;

export const PHASE2_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "Sel ou Poivre".

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

⚠️ RÈGLE CRITIQUE - JEUX DE MOTS PHONÉTIQUES ⚠️
Les deux catégories doivent SONNER SIMILAIRE à l'oral (homophones ou quasi-homophones).
C'est un JEU DE MOTS PHONÉTIQUE, pas des catégories opposées.
Accepté : homophones parfaits OU sons très proches qui créent un calembour drôle.
- Catégorie A = sens sérieux/littéral
- Catégorie B = calembour/sens absurde qui SONNE SIMILAIRE

⚠️ RÈGLE CRITIQUE - LES DEUX CATÉGORIES DOIVENT ÊTRE CONCRÈTES ⚠️
Les deux catégories doivent représenter des CHOSES RÉELLES auxquelles on peut rattacher des items.
La catégorie B (le calembour) doit aussi avoir un sens concret, pas juste sonner pareil.
Si tu ne peux pas lister 5 items ÉVIDENTS pour la catégorie B → CHANGE LE JEU DE MOTS

❌ INTERDIT :
- Catégories opposées ou antonymes (elles doivent sonner pareil, pas s'opposer)
- Notions subjectives : "j'aime", "j'aime pas", "c'est beau", "c'est moche", "bon", "mauvais"
- Questions d'opinion ou de goût personnel

✅ CONTENU OBLIGATOIRE :
- DRÔLE et irrévérencieux, style Burger Quiz
- Personnalités connues (acteurs, politiques, sportifs, influenceurs...)
- Rumeurs célèbres, potins, scandales médiatisés
- Anecdotes WTF et faits divers marquants
- Culture pop, actualité, mèmes connus

⚠️ RÈGLES OPTIONS (CRITIQUE) ⚠️
- optionA et optionB doivent être des NOMS DE CATÉGORIES COURTS (2-4 mots max)
- PAS de proverbes, expressions idiomatiques, ou phrases longues
- Les deux doivent être des CATÉGORIES CONCRÈTES avec des items listables
- ❌ INTERDIT: "Être né avec une cuillère en argent" (trop long, c'est une expression)
- ✅ BON: "Mer" / "Mère", "Ver de terre" / "Verre de terre", "Pot de vin" / "Poteau de vin"

RÈGLES ITEMS :
- Items SURPRENANTS (réponse contre-intuitive)
- Maximum 4 mots par item
- Chaque réponse doit être un FAIT vérifiable, pas une opinion
- La réponse doit être INDISCUTABLE (une seule réponse possible)
- L'item doit avoir un LIEN CLAIR et ÉVIDENT avec sa catégorie
- Si tu dois expliquer pourquoi l'item va dans A ou B, c'est trop ambigu → CHANGE-LE
- VÉRIFIE chaque réponse avec Google Search
- "Both" = l'item fonctionne pour les DEUX sens (rare, max 2)
- Répartition STRICTE : exactement 5 A, exactement 5 B, exactement 2 Both

JUSTIFICATION OBLIGATOIRE :
Pour chaque item, ajoute une "justification" courte (max 15 mots) expliquant POURQUOI cet item appartient à sa catégorie.
- Pour A : explique le lien avec le sens littéral de optionA
- Pour B : explique le lien avec le calembour optionB
- Pour Both : explique pourquoi ça marche pour les deux sens
Cette justification sera affichée aux joueurs après leur réponse.

FORMAT JSON :
{
  "optionA": "[Catégorie courte - 2-4 mots max]",
  "optionB": "[Calembour court - 2-4 mots max]",
  "items": [
    { "text": "[item]", "answer": "A", "justification": "[Pourquoi c'est A]" },
    { "text": "[item]", "answer": "B", "justification": "[Pourquoi c'est B]" },
    { "text": "[item]", "answer": "Both", "justification": "[Pourquoi les deux]" }
  ]
}

12 items exactement. Pas de markdown. PAS de champ "title".`;

export const PHASE3_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "La Carte".
Génère 3 menus thématiques avec 5 questions chacun.

Thème général : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT :
- Chaque menu a un titre fun et une description accrocheuse
- Les questions sont courtes avec des réponses courtes (1-3 mots max)
- Style Burger Quiz : absurde, culture pop, pièges, humour

IMPORTANT - VÉRIFICATION DES FAITS :
- Utilise la recherche Google pour VÉRIFIER chaque réponse
- Les réponses doivent être 100% correctes et vérifiables

FORMAT TEXTE - INTERDIT :
- PAS de markdown (pas de **, *, #, etc.)
- Texte brut uniquement

JSON Format (STRICTEMENT ce format) :
[
  {
    "title": "Menu [Nom créatif]",
    "description": "Description fun et accrocheuse du thème",
    "questions": [
      { "question": "Question courte ?", "answer": "Réponse courte" },
      { "question": "Question courte ?", "answer": "Réponse courte" },
      { "question": "Question courte ?", "answer": "Réponse courte" },
      { "question": "Question courte ?", "answer": "Réponse courte" },
      { "question": "Question courte ?", "answer": "Réponse courte" }
    ]
  }
] (Array of exactly 3 menus with 5 questions each)`;

export const PHASE4_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "La Note" (buzzer).
Génère 15 questions rapides pour un round de buzzer.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT :
- Questions TRÈS courtes et directes
- Réponses en 1-3 mots maximum
- Mélange de : culture générale, pièges classiques, questions absurdes
- Style Alain Chabat : "Quelle est la couleur du cheval blanc d'Henri IV ?"

IMPORTANT - VÉRIFICATION DES FAITS :
- Utilise la recherche Google pour VÉRIFIER chaque réponse
- Les réponses doivent être indiscutables

FORMAT TEXTE - INTERDIT :
- PAS de markdown
- Texte brut uniquement

JSON Format (STRICTEMENT ce format) :
[
  { "question": "Question courte et directe ?", "answer": "Réponse courte" }
] (Array of exactly 15 items)`;

export const PHASE5_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "Burger Ultime" (défi mémoire).
Génère une séquence de 10 questions sur le thème demandé.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT :
- 10 questions posées à la suite
- Le joueur doit répondre à TOUTES après avoir entendu les 10
- Les questions peuvent être liées entre elles ou absurdes
- Réponses courtes (1-3 mots)

IMPORTANT - VÉRIFICATION DES FAITS :
- Utilise la recherche Google pour VÉRIFIER chaque réponse
- Les réponses doivent être 100% correctes

FORMAT TEXTE - INTERDIT :
- PAS de markdown
- Texte brut uniquement

JSON Format (STRICTEMENT ce format) :
[
  { "question": "Question ?", "answer": "Réponse" }
] (Array of exactly 10 items)`;

// --- REVIEW AGENT PROMPTS ---

export const REVIEW_SYSTEM_PROMPT = `Tu es un expert en contrôle qualité pour le jeu "Burger Quiz".
Ta mission : vérifier et valider chaque question générée.

Tu dois être STRICT et IMPITOYABLE :
- Une info douteuse = REJET
- Un style trop scolaire = REJET
- Une question trop facile/évidente = REJET
- Une réponse "Both" qui ne fonctionne pas vraiment = REJET

Tu as accès à la recherche Google pour vérifier les faits.`;

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

3. STYLE BURGER QUIZ :
   - Doit être drôle, absurde, ou piège
   - PAS académique, PAS style Wikipedia
   - Si trop scolaire ou ennuyeux → REJET

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

export const REVIEW_PHASE2_PROMPT = `Analyse ce set Phase 2 (Sel ou Poivre / jeux de mots) :

{QUESTIONS}

⚠️ VÉRIFICATION PHONÉTIQUE ⚠️
Les deux options doivent créer un JEU DE MOTS PHONÉTIQUE (homophones ou quasi-homophones).
TEST : Lis les deux options à voix haute. Créent-elles un calembour drôle basé sur le son ?

✅ ACCEPTÉ (jeux de mots phonétiques) :
- Homophones parfaits (sons identiques)
- Quasi-homophones (sons très proches qui créent un calembour)
- Le jeu de mots doit être DRÔLE et COMPRÉHENSIBLE à l'oral

❌ REJETÉ (pas de jeu de mots) :
- Catégories opposées/antonymes (chaud vs froid, oui vs non, vrai vs faux)
- Catégories sans rapport phonétique
- Sons complètement différents

Pour CHAQUE item du set, vérifie ces critères :

1. RÉPONSE CORRECTE (CRITIQUE) :
   - UTILISE Google Search pour vérifier que l'item appartient VRAIMENT à la catégorie indiquée
   - Si tu as le moindre doute → REJET
   - La réponse doit être indiscutable

2. SANS AMBIGUÏTÉ (CRITIQUE) :
   - L'item doit clairement appartenir à A, B, ou Both (pas "ça dépend")
   - Si plusieurs interprétations possibles → REJET
   - Pour "Both" : l'item DOIT fonctionner pour les DEUX sens du jeu de mots

3. SURPRISE :
   - La réponse doit être inattendue ou contre-intuitive
   - Si la réponse est évidente → REJET

4. FORMAT :
   - Maximum 4 mots par item
   - Si trop long → REJET

Répartition attendue : 5 A, 5 B, 2 Both

Retourne un JSON :
{
  "setValid": true | false,
  "setReason": "Raison si set invalide - notamment si pas de jeu de mots",
  "itemReviews": [
    {
      "index": 0,
      "text": "L'item",
      "answer": "A",
      "status": "approved" | "rejected",
      "reason": "Raison si rejeté (sinon null)",
      "issue": "answer_wrong" | "ambiguous" | "too_easy" | "too_long" | null
    }
  ],
  "summary": {
    "approved": 10,
    "rejected": 2,
    "rejectedIndices": [4, 9]
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
- Garde le style Burger Quiz (absurde, pièges, humour)
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

export const REGENERATE_PHASE2_ITEMS_PROMPT = `Tu dois régénérer {COUNT} item(s) pour un set Phase 2 "Sel ou Poivre".

Catégories du set (JEUX DE MOTS) :
- Option A : {OPTION_A}
- Option B : {OPTION_B}

RAPPEL : Les deux catégories sont des calembours/homophones.
- Option A = la catégorie "sérieuse"
- Option B = le jeu de mots absurde

Items rejetés et raisons :
{REJECTED_REASONS}

Répartition nécessaire : {NEEDED_A} items A, {NEEDED_B} items B, {NEEDED_BOTH} items Both

INSTRUCTIONS :
- Génère EXACTEMENT {COUNT} nouveaux items
- Respecte la répartition demandée
- Corrige les problèmes mentionnés
- Items surprenants, max 4 mots
- Vérifie les faits avec Google Search
- Pour "Both" : l'item doit fonctionner pour les DEUX sens du calembour

JSON Format :
[
  { "text": "[item]", "answer": "A" | "B" | "Both" }
]`;

// --- PHASE 2 DIALOGUE SYSTEM ---

export const PHASE2_GENERATOR_PROMPT = `Tu es un expert en jeux de mots français pour "Burger Quiz" (phase "Sel ou Poivre").

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

GÉNÈRE UN SET COMPLET avec :
1. Un JEU DE MOTS PHONÉTIQUE (optionA et optionB qui sonnent pareil ou très proche)
2. 12 items répartis : exactement 5 A, exactement 5 B, exactement 2 Both

RÈGLES HOMOPHONE (CRITIQUE) :
Les deux phrases doivent SE PRONONCER EXACTEMENT PAREIL à l'oral !

✅ BONS EXEMPLES D'HOMOPHONES :
- "Les poules du couvent couvent" (les poules du monastère font éclore des œufs)
- "Vers vert" vs "Verre vert" (un lombric vs une vitre colorée)
- "Mer, mère, maire" (océan, maman, élu)
- "Sot, seau, sceau, saut" (idiot, récipient, cachet, bond)
- "Vingt vins" vs "20 vins" (même prononciation)
- "Salle comble" vs "Sale con" (si on coupe différemment)

❌ MAUVAIS EXEMPLES (NE FONT PAS CE TYPE) :
- "notre pain" vs "nos terrains" → FAUX! /nɔtʁ pɛ̃/ ≠ /no tɛ.ʁɛ̃/ (sons différents)
- "nos trains" vs "notre règne" → FAUX! /no tʁɛ̃/ ≠ /nɔtʁ ʁɛɲ/ (sons différents)
- "Pot de chambre" vs "Impose des membres" → PAS DU TOUT LE MÊME SON
- "Assurance bateau" vs "Science d'un bateau" → PAS LE MÊME SON

⚠️ PIÈGE À ÉVITER :
- "notre" (/nɔtʁ/) et "nos" (/no/) ne sont JAMAIS homophones !
- Des syllabes similaires ne suffisent pas - les SONS doivent être IDENTIQUES
- Écris la transcription phonétique (IPA) pour vérifier AVANT de proposer

RÈGLES SUPPLÉMENTAIRES :
- Catégorie A = sens sérieux/littéral
- Catégorie B = sens absurde/calembour
- Les deux doivent représenter des CHOSES CONCRÈTES pour lesquelles on peut trouver des items

⚠️ RÈGLE OPTIONS (CRITIQUE) ⚠️
Les options doivent être des NOMS DE CATÉGORIES COURTS, pas des phrases !
- Maximum 4 mots par option (optionA ET optionB)
- Les deux doivent représenter des CATÉGORIES concrètes (pas des expressions idiomatiques)

❌ MAUVAIS EXEMPLES D'OPTIONS (trop long ou abstrait) :
- "Être né avec une cuillère en argent" → INTERDIT (expression idiomatique, trop long)
- "Avoir le cafard du dimanche soir" → INTERDIT (trop long, pas une catégorie)
- "Les trains qui arrivent à l'heure" → INTERDIT (phrase, pas catégorie)

✅ BONS EXEMPLES D'OPTIONS :
- "Mer" / "Mère" (1 mot, concret)
- "Ver de terre" / "Verre de terre" (3 mots, concret)
- "Pot de vin" / "Poteau de vin" (3 mots, concret)
- "Saint" / "Sein" (1 mot, concret)

RÈGLES ITEMS (TRÈS STRICT) :
- Maximum 4 mots par item
- Réponse = FAIT vérifiable (pas opinion)
- Personnalités connues (acteurs, politiques, sportifs...)
- Rumeurs célèbres, potins, scandales
- Culture pop, mèmes, actualité
- VÉRIFIE avec Google Search

⚠️ PIÈGES OBLIGATOIRES (TRÈS IMPORTANT) ⚠️
Au moins 5-6 items sur 12 doivent être des PIÈGES où la réponse est CONTRE-INTUITIVE !

Un bon piège = l'item SEMBLE appartenir à une catégorie mais appartient en fait à L'AUTRE (ou Both).

✅ EXEMPLES DE BONS PIÈGES (réponse SURPRENANTE) :
- "Mer" vs "Mère" :
  • "Jacques Cousteau" → On pense MÈRE (papa de 2 enfants)... MAIS c'est MER (explorateur des océans) = PIÈGE!
  • "Cordon" → On pense MER (cordon littoral)... MAIS c'est MÈRE (cordon ombilical) = PIÈGE!
  • "Bretagne" → On pense MER (côtes bretonnes)... MAIS c'est BOTH (aussi "mère patrie" des Bretons) = PIÈGE!

- "Ver" vs "Verre" :
  • "Sable" → On pense VERRE (verre = silice/sable)... MAIS c'est VER (ver de sable = arénicole) = PIÈGE!
  • "Murano" → On pense VERRE (verrerie italienne)... MAIS c'est BOTH (île où vivent aussi des vers!) = PIÈGE!

- "Saint" vs "Sein" :
  • "Auréole" → On pense SAINT (halo)... MAIS c'est BOTH (aussi l'aréole du sein) = PIÈGE PARFAIT!
  • "Graal" → On pense SAINT (Saint Graal)... MAIS c'est BOTH (cup = sein en argot anglais) = PIÈGE!

❌ MAUVAIS ITEMS (TROP ÉVIDENTS - INTERDIT) :
- "Mer" vs "Mère" → "Océan" = INTERDIT (évidemment Mer, zéro hésitation)
- "Mer" vs "Mère" → "Biberon" = INTERDIT (évidemment Mère, zéro hésitation)
- "Saint" vs "Sein" → "Allaitement" = INTERDIT (évidemment Sein)
- "Saint" vs "Sein" → "Canonisation" = INTERDIT (évidemment Saint)
- "Ver" vs "Verre" → "Cristal" = INTERDIT (évidemment Verre)
- "Ver" vs "Verre" → "Lombric" = INTERDIT (évidemment Ver)

🎯 RÈGLE D'OR : Pour chaque item, demande-toi :
"Est-ce que le joueur va HÉSITER avant de répondre ?"
- Si NON (réponse évidente) → REMPLACE PAR UN PIÈGE
- Si OUI (il y a doute) → BON ITEM

💡 TECHNIQUE POUR CRÉER DES PIÈGES :
1. Pense à un item ÉVIDENT pour la catégorie A
2. Cherche si cet item a AUSSI un lien avec B (souvent via un sens caché, une expression, un contexte différent)
3. Si oui → transforme en piège ou Both!

RÈGLE D'OR DES CATÉGORIES :
- Les DEUX catégories doivent avoir des items FACILES À TROUVER
- Si tu ne peux pas lister 5 choses CONNUES qui appartiennent clairement à la catégorie B → CHANGE LE JEU DE MOTS
- Catégorie A et B doivent TOUTES DEUX représenter des ensembles de CHOSES RÉELLES (pas abstraites)

INTERDIT :
- Catégories opposées (oui/non, vrai/faux, chaud/froid)
- Notions subjectives (j'aime, c'est beau, bon/mauvais)
- Items ambigus qui pourraient aller dans plusieurs catégories
- Calembours où la catégorie B est trop abstraite ou n'a pas de sens concret

{PREVIOUS_FEEDBACK}

FORMAT JSON (STRICTEMENT) :
{
  "optionA": "Catégorie courte (2-4 mots max)",
  "optionB": "Calembour court (2-4 mots max)",
  "reasoning": "Transcription IPA: /.../ = /.../ - Explication de pourquoi les sons sont IDENTIQUES",
  "items": [
    { "text": "Item max 4 mots", "answer": "A", "justification": "Pourquoi cet item va dans A" },
    { "text": "Item max 4 mots", "answer": "B", "justification": "Pourquoi cet item va dans B" },
    { "text": "Item max 4 mots", "answer": "Both", "justification": "Pourquoi cet item va dans Both" }
  ]
}

12 items exactement. Pas de markdown.`;

// Prompt for regenerating ONLY specific items (not the whole set)
export const PHASE2_TARGETED_REGENERATION_PROMPT = `Tu dois REMPLACER certains items d'un set Phase 2 "Sel ou Poivre".

JEU DE MOTS VALIDÉ (NE PAS CHANGER) :
- Option A : {OPTION_A}
- Option B : {OPTION_B}

ITEMS À GARDER (NE PAS TOUCHER) :
{GOOD_ITEMS}

ITEMS À REMPLACER (indices: {BAD_INDICES}) :
{BAD_ITEMS}

RAISONS DU REJET :
{REJECTION_REASONS}

DISTRIBUTION REQUISE :
Tu dois générer exactement {COUNT} nouveaux items avec cette distribution :
- {NEEDED_A} items A
- {NEEDED_B} items B
- {NEEDED_BOTH} items Both

RAPPEL DES RÈGLES PIÈGES :
- Chaque item doit créer du DOUTE (réponse contre-intuitive)
- L'item SEMBLE appartenir à une catégorie mais appartient à l'AUTRE
- Si la réponse est évidente → mauvais item

GÉNÈRE UNIQUEMENT les {COUNT} nouveaux items en JSON :
[
  { "text": "Nouvel item", "answer": "A", "justification": "Pourquoi" },
  { "text": "Nouvel item", "answer": "B", "justification": "Pourquoi" }
]

{COUNT} items exactement. Pas de markdown.`;

export const PHASE2_DIALOGUE_REVIEWER_PROMPT = `Tu es un juge strict pour "Burger Quiz".
Analyse ce set Phase 2 et donne un feedback détaillé pour aider le générateur à s'améliorer.

SET PROPOSÉ :
{SET}

ÉVALUE CHAQUE CRITÈRE (score 1-10) :

1. PHONÉTIQUE (CRITIQUE) : Les deux options se PRONONCENT-ELLES EXACTEMENT PAREIL ?

   ÉTAPE 1 : Vérifie la transcription IPA fournie dans le "reasoning"
   ÉTAPE 2 : Compare les deux transcriptions - sont-elles IDENTIQUES ou très proches ?
   ÉTAPE 3 : Si les transcriptions diffèrent → score < 5

   TEST ORAL : Dis les deux phrases à voix haute. Si quelqu'un les entend, peut-il confondre les deux ?

   ✅ BONS HOMOPHONES (score 8-10) :
   - "vers vert" = "verre vert" → /vɛʁ vɛʁ/ = /vɛʁ vɛʁ/ PARFAIT (sons identiques)
   - "Chair de poule" = "Chère de Pouille" → /ʃɛʁ də pul/ ≈ /ʃɛʁ də puj/ TRÈS BON (quasi-identiques)
   - "Le thym est bon" = "Le teint est bon" → /lə tɛ̃ ɛ bɔ̃/ = /lə tɛ̃ ɛ bɔ̃/ PARFAIT

   ❌ MAUVAIS (score 1-5) - REJETTE IMMÉDIATEMENT :
   - "notre pain" ≠ "nos terrains" → MAUVAIS (/nɔtʁ pɛ̃/ vs /no tɛ.ʁɛ̃/ = sons différents!)
   - "nos trains" ≠ "notre règne" → MAUVAIS (/no tʁɛ̃/ vs /nɔtʁ ʁɛɲ/ = sons différents!)
   - "dépassées" ≠ "de basse" → MAUVAIS (/de.pa.se/ vs /dә.bas/)
   - "absurdes" ≠ "à la base" → MAUVAIS (rien à voir)
   - "Pot de chambre" ≠ "Impose des membres" → TRÈS MAUVAIS

   ⚠️ ATTENTION AUX FAUX HOMOPHONES :
   - Le fait que deux phrases aient des SYLLABES similaires ne suffit pas
   - Les MOTS doivent correspondre phonétiquement, pas juste quelques sons
   - "notre" (/nɔtʁ/) ≠ "nos" (/no/) → JAMAIS homophones!
   - "pain" (/pɛ̃/) ≠ "terrains" (/tɛ.ʁɛ̃/) → sons complètement différents!

   - 10 = homophones PARFAITS (mêmes sons exactement)
   - 8-9 = quasi-homophones (très proche, confusion possible à l'oral)
   - 5-7 = quelques sons communs mais CLAIREMENT distinguables → REJETTE
   - 1-4 = sons complètement différents → REJETTE IMMÉDIATEMENT

   ❌ SI SCORE < 7 → REJETTE LE SET ENTIER, on ne peut pas continuer avec un mauvais homophone

2. CONCRET : Les catégories représentent-elles des choses concrètes ?
   - Peut-on facilement lister des items pour chaque catégorie ?

3. DISTRIBUTION : Y a-t-il exactement 5 A, 5 B, 2 Both ?

4. CLARTÉ ITEMS (CRITIQUE) : Chaque item a-t-il un lien IMMÉDIATEMENT évident avec sa catégorie ?
   - TEST : Peux-tu expliquer en 5 mots pourquoi cet item va dans A ou B ?
   - Si tu dois faire une explication complexe → REJETTE L'ITEM
   - Si l'item pourrait aller dans l'autre catégorie avec un peu d'imagination → REJETTE
   - REJETTE TOUT set où plus de 2 items ont un lien faible avec leur catégorie

   ⚠️ DÉTECTION DES "BOTH" MANQUÉS (TRÈS IMPORTANT) :
   Pour CHAQUE item marqué A ou B, pose-toi ces questions :
   - "Cet item pourrait-il AUSSI appartenir à l'autre catégorie ?"
   - "Est-ce que les DEUX sens du jeu de mots s'appliquent à cet item ?"

   ✅ EXEMPLES OÙ L'ITEM DEVRAIT ÊTRE "Both" :
   - "Un verre de vin" vs "Un verre divin" → "Boisson alcoolisée" devrait être BOTH car :
     • A (verre de vin) : le vin est une boisson alcoolisée ✅
     • B (verre divin) : le vin de communion est "divin" au sens religieux ✅
   - "Chair de poule" vs "Chère de Pouille" → "Cuisine traditionnelle" devrait être BOTH car :
     • A (chair de poule) : on mange du poulet en cuisine ✅
     • B (Chère de Pouille) : les Pouilles ont une cuisine traditionnelle ✅
   - "Le thym" vs "Le teint" → "Belle couleur" devrait être BOTH car :
     • A (le thym) : l'herbe a une couleur verte ✅
     • B (le teint) : on parle de "belle couleur" pour le teint ✅

   ❌ SI UN ITEM A/B FONCTIONNE POUR LES DEUX CATÉGORIES → SIGNALE-LE COMME "should_be_both"
   Le générateur doit soit :
   - Changer la réponse en "Both"
   - Remplacer l'item par un autre plus spécifique à une seule catégorie

5. CATÉGORIE B CONCRÈTE (CRITIQUE) : La catégorie B (calembour) représente-t-elle quelque chose de RÉEL ?
   - Peut-on facilement nommer 5+ choses qui appartiennent clairement à B ?
   - B doit être une VRAIE CHOSE avec des exemples ÉVIDENTS

   ✅ BONS exemples de catégorie B concrète :
   - "Chère de Pouille" = région des Pouilles → Bari, Orecchiette, Trulli = CONCRET
   - "Le teint est bon" = peau/complexion → bronzage, fond de teint = CONCRET
   - "Verre vert" = objet coloré → bouteille, vase, vitre = CONCRET

   ❌ MAUVAIS exemples (REJETER) :
   - "de basse" dans "Ces lois sont de basse" → Que sont des "choses de basse" ? RIEN = ABSTRAIT
   - "sans gène" dans "Touristes sans gène" → Quel est le lien avec l'ADN pour les items ? RIEN = ABSTRAIT
   - "Les humeurs" → Trop abstrait pour lister des items concrets

   ❌ SI B EST ABSTRAIT (score < 6) → REJETTE LE SET ENTIER

6. HUMOUR : Le set est-il drôle, style Burger Quiz ?

7. CÉLÉBRITÉS : Y a-t-il des personnalités connues ?

8. BOTH DETECTION (IMPORTANT) : Les items "Both" sont-ils bien identifiés ?
   - Compte combien d'items A ou B devraient en fait être "Both"
   - Score 10 = aucun item mal catégorisé
   - Score 5 = 1-2 items devraient être Both
   - Score 1-4 = plusieurs items sont mal catégorisés

   ❌ SI SCORE < 6 → SIGNALE les items concernés avec should_be_both=true

9. QUALITÉ DES PIÈGES (CRITIQUE) : Y a-t-il assez d'items CONTRE-INTUITIFS ?
   - Compte combien d'items ont une réponse SURPRENANTE
   - Un piège = l'item SEMBLE appartenir à une catégorie mais appartient à l'AUTRE

   ✅ BON PIÈGE (item qui fait hésiter) :
   - "Mer" vs "Mère" → "Cordon" = PIÈGE car on pense à la mer (cordon littoral) mais c'est Mère (cordon ombilical)
   - L'item crée du DOUTE, le joueur HÉSITE avant de répondre

   ❌ MAUVAIS ITEM (trop évident) :
   - "Mer" vs "Mère" → "Océan" = ÉVIDENT (pas d'hésitation, c'est Mer)
   - "C'est un saint" vs "C'est un sein" → "Allaitement" = ÉVIDENT (pas d'hésitation, c'est Sein)

   Score :
   - 10 = 5+ items pièges qui font vraiment hésiter
   - 7-9 = 3-4 items pièges
   - 4-6 = 1-2 items pièges seulement
   - 1-3 = aucun piège, tous les items sont évidents

   ❌ SI SCORE < 5 → Le set est ENNUYEUX, demande plus de pièges

Pour chaque item problématique, explique PRÉCISÉMENT pourquoi il pose problème.

FORMAT JSON (STRICTEMENT) :
{
  "approved": true | false,
  "scores": {
    "phonetic": 1-10,
    "concrete": 1-10,
    "distribution": 1-10,
    "clarity": 1-10,
    "b_concrete": 1-10,
    "humor": 1-10,
    "celebrities": 1-10,
    "both_detection": 1-10,
    "trap_quality": 1-10
  },
  "overall_score": 1-10,
  "homophone_feedback": "Feedback détaillé sur le jeu de mots - pourquoi ça marche ou pas",
  "items_feedback": [
    {
      "index": 0,
      "text": "L'item",
      "current_answer": "A",
      "ok": true | false,
      "issue": "Description du problème si rejeté",
      "should_be_both": true | false,
      "both_reasoning": "Pourquoi cet item devrait être Both (si applicable)",
      "is_trap": true | false,
      "is_too_obvious": true | false
    }
  ],
  "global_feedback": "Feedback général pour amélioration",
  "suggestions": ["Suggestion concrète 1", "Suggestion concrète 2"]
}

Pas de markdown.`;

// --- PHASE 1 DIALOGUE PROMPTS ---

export const PHASE1_GENERATOR_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère 10 questions "Tenders" (QCM) dans le style EXACT de l'émission.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

STYLE BURGER QUIZ - OBLIGATOIRE :
- Questions pièges avec formulations trompeuses ("Quel est le prénom du Père Noël ?")
- Humour absurde et décalé
- Fausses évidences qui font douter
- Jeux de mots et calembours
- Références culture pop, célébrités, actualité
- Questions qui semblent faciles mais qui piègent

RÈGLES CRITIQUES :

1. RÉPONSE VÉRIFIABLE (CRITIQUE) :
   - CHAQUE réponse doit être un FAIT 100% vérifiable
   - UTILISE Google Search pour vérifier AVANT de proposer
   - Si tu as le moindre doute → NE PROPOSE PAS cette question

   ✅ BONS exemples de questions vérifiables :
   - "Quelle est la capitale de l'Australie ?" → Canberra (fait vérifiable)
   - "Qui a peint la Joconde ?" → Léonard de Vinci (fait vérifiable)
   - "En quelle année est sorti le premier iPhone ?" → 2007 (fait vérifiable)

   ❌ MAUVAIS exemples (ÉVITER) :
   - Questions d'opinion ("Quel est le meilleur film ?")
   - Questions avec réponses débattues ou approximatives
   - Questions où la réponse dépend de l'interprétation

2. UNE SEULE RÉPONSE POSSIBLE (CRITIQUE) :
   - La question doit avoir UNE SEULE réponse correcte, INDISCUTABLE
   - Les 3 mauvaises réponses doivent être CLAIREMENT fausses
   - TEST : Si quelqu'un pouvait argumenter qu'une autre réponse est valide → CHANGE LA QUESTION

3. LONGUEUR DES QUESTIONS - TRÈS VARIÉ :
   - 3-4 questions TRÈS COURTES (5-10 mots)
   - 3-4 questions COURTES (12-18 mots)
   - 2-3 questions MOYENNES (20-30 mots max)
   - Les réponses doivent être courtes (1-3 mots max)

4. ANECDOTE OBLIGATOIRE :
   - Ajoute une anecdote fun/surprenante/WTF sur la bonne réponse
   - L'anecdote doit être VRAIE et vérifiable
   - Maximum 30 mots

5. PAS DE MARKDOWN :
   - Texte brut uniquement
   - Pas de **, *, #, etc.

{PREVIOUS_FEEDBACK}

FORMAT JSON (STRICTEMENT) :
[
  {
    "text": "Question style Burger Quiz en français ?",
    "options": ["Bonne réponse", "Mauvaise 1", "Mauvaise 2", "Mauvaise 3"],
    "correctIndex": 0,
    "anecdote": "Fait amusant court sur la bonne réponse",
    "verification": "Comment j'ai vérifié cette réponse"
  }
]

10 questions exactement. Pas de markdown.`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `Tu es un juge strict pour "Burger Quiz".
Analyse ces questions Phase 1 (Tenders/QCM) et donne un feedback détaillé.

QUESTIONS PROPOSÉES :
{QUESTIONS}

ÉVALUE CHAQUE CRITÈRE (score 1-10) :

1. EXACTITUDE FACTUELLE (CRITIQUE) :
   - UTILISE Google Search pour vérifier CHAQUE réponse
   - La bonne réponse est-elle 100% correcte et vérifiable ?
   - Les 3 mauvaises réponses sont-elles clairement fausses ?

   ✅ Score 9-10 : Toutes les réponses vérifiées, 100% exactes
   ❌ Score 1-5 : Une ou plusieurs réponses douteuses/fausses

   ❌ SI SCORE < 7 → REJETTE IMMÉDIATEMENT (on ne peut pas avoir de fausses réponses)

2. CLARTÉ / NON-AMBIGUÏTÉ (CRITIQUE) :
   - Chaque question a-t-elle UNE SEULE réponse possible ?
   - La formulation est-elle claire et sans équivoque ?
   - TEST : Quelqu'un pourrait-il argumenter qu'une autre option est valide ?

   ✅ Score 9-10 : Questions claires, une seule réponse possible
   ⚠️ Score 6-8 : Formulation un peu vague mais acceptable
   ❌ Score 1-5 : Questions ambiguës ou plusieurs réponses possibles

   ❌ SI SCORE < 6 → REJETTE (les questions ambiguës créent des disputes)

3. STYLE BURGER QUIZ :
   - Les questions sont-elles drôles, absurdes, ou pièges ?
   - Évite-t-on le style trop scolaire/encyclopédique ?
   - Y a-t-il des références culture pop, célébrités, actualité ?

   ✅ Score 9-10 : Style Burger Quiz parfait, drôle et décalé
   ⚠️ Score 6-8 : Acceptable mais un peu plat
   ❌ Score 1-5 : Trop scolaire, ennuyeux, style Wikipedia

4. VARIÉTÉ LONGUEUR :
   - Y a-t-il un mix de questions courtes/moyennes/longues ?
   - Les réponses sont-elles courtes (1-3 mots) ?

5. ANECDOTES :
   - Les anecdotes sont-elles vraies et vérifiables ?
   - Apportent-elles quelque chose d'intéressant/surprenant ?

6. CÉLÉBRITÉS / CULTURE POP :
   - Y a-t-il des références à des personnalités connues ?
   - Y a-t-il des questions sur l'actualité ou la culture populaire ?

Pour chaque question problématique, explique PRÉCISÉMENT pourquoi elle pose problème.

FORMAT JSON (STRICTEMENT) :
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
      "issue": "Description du problème si rejeté",
      "issue_type": "factual_error" | "ambiguous" | "boring" | "too_long" | "bad_anecdote" | null
    }
  ],
  "global_feedback": "Feedback général pour amélioration",
  "suggestions": ["Suggestion concrète 1", "Suggestion concrète 2"]
}

Pas de markdown.`;

// --- PHASE 1 TARGETED REGENERATION ---

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
- Garde le style Burger Quiz (absurde, pièges, humour)
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

