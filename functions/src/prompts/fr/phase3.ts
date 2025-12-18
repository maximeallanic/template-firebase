/**
 * French Phase 3 (La Carte) Prompts
 * Menu-based themed question sets
 */

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
