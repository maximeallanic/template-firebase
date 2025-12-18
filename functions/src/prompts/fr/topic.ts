/**
 * French Topic Generation Prompts
 * Prompts for generating game themes/topics
 */

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
