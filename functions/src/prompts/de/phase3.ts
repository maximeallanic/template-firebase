/**
 * German Phase 3 (Die Karte) Prompts
 * Menu-based themed question sets
 */

export const PHASE3_PROMPT = `BURGER QUIZ Phase 3 "Die Karte"
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

🎯 KONZEPT: 4 Menüs (3 normale + 1 FALLE) mit jeweils 5 Fragen

⚠️ KRITISCHE REGELN:
1. TITEL: Kreativ und thematisch (nicht "Menü Allgemeinwissen")
2. BESCHREIBUNGEN: Einprägsam und witzig
3. FRAGEN: Schräge Formulierung, FAKTISCHE Antworten (1-3 Wörter)
4. FALLEN-MENÜ: 1 Menü mit isTrap:true, normales Aussehen aber SEHR schwierige Fragen
5. ÜBERPRÜFE jede Antwort mit Google

JSON:
[
  {
    "title": "Menü [Kreativer Name]",
    "description": "Witziger Aufhänger",
    "isTrap": false,
    "questions": [
      { "question": "Frage?", "answer": "Antwort" }
    ]
  }
]

4 Menüs × 5 Fragen. Kein Markdown.`;

export const PHASE3_GENERATOR_PROMPT = `BURGER QUIZ Phase 3 "Die Karte" - Generator
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

🎯 KONZEPT: Das Team wählt 1 Menü aus 4, dann beantwortet es die 5 Fragen.

⚠️ REGEL #1 - TITEL & BESCHREIBUNGEN
- KREATIVE und thematische Titel (nicht "Menü Allgemeinwissen")
- EINPRÄGSAME Beschreibungen, die Lust machen
- Jedes Menü = ein ANDERER BLICKWINKEL auf das Thema

⚠️ REGEL #2 - FRAGEN (KRITISCH!)
- GENAU 5 FRAGEN pro Menü (PFLICHT - Vor dem Absenden prüfen)
- VARIIERTE Formulierung: Mix aus "Was ist?", "Wie viel?", "Wer?", "Wo?", "Wann?", "Welcher?" (nicht mehr als 2x die gleiche Formulierung pro Menü)
- SCHRÄGER und witziger Stil (nicht schulisch)
- Antworten = zu 100% VERIFIZIERBARE FAKTEN (vor dem Vorschlagen bei Google/Wikipedia suchen)
- PRÄZISE Antworten: 1 Wort oder max. 2-3 Wörter (NIEMALS vage Antworten)
- Wenn die Frage einen präzisen Namen verlangt, muss die Antwort präzise und nicht generisch sein
- NULL Mehrdeutigkeit: nur eine mögliche Antwort

⚠️ REGEL #3 - OBLIGATORISCHER FAKTENCHECK
- ÜBERPRÜFE jeden Fakt bei Google BEVOR du ihn einbaust
- Wenn du nicht 100% SICHER bist, BENUTZE ES NICHT
- Bevorzuge DOKUMENTIERTE Fakten (Interviews, Artikel, Wikipedia)
- VERBOTEN: vage oder generische Antworten, nicht verifizierbare Fakten

⚠️ REGEL #4 - FALLEN-MENÜ (1 von 4)
- NORMALES Aussehen (Titel/Beschreibung identisch mit den anderen)
- VIEL schwierigere Fragen (obskure Fakten, präzise Details)
- Mit isTrap: true markieren
- Muss kohärent mit dem Thema bleiben

📊 SCHWIERIGKEIT:
- easy: Sehr bekannte Fakten
- normal: Anekdoten, unerwartete Verbindungen
- hard: Obskure Fakten, präzise Details
- wtf: Absurde aber wahre Fakten

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "title": "Menü [Kreativer Name]",
    "description": "Witziger Aufhänger",
    "isTrap": false,
    "questions": [
      { "question": "Frage 1?", "answer": "Antwort" },
      { "question": "Frage 2?", "answer": "Antwort" },
      { "question": "Frage 3?", "answer": "Antwort" },
      { "question": "Frage 4?", "answer": "Antwort" },
      { "question": "Frage 5?", "answer": "Antwort" }
    ]
  }
]

⚠️ WICHTIG: 4 Menüs × 5 Fragen JEWEILS (insgesamt = 20 Fragen). Überprüfe, dass jedes Menü GENAU 5 Fragen hat, bevor du absendest!
Kein Markdown.`;

export const PHASE3_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 3 "Die Karte"

{MENUS}

🔍 ÜBERPRÜFUNG IN 10 PUNKTEN (SEI STRENG!):

1. ANZAHL DER FRAGEN: Hat JEDES Menü GENAU 5 Fragen? (KRITISCH - ABLEHNEN wenn ein Menü 4 oder 6 Fragen hat)
2. TITEL & BESCHREIBUNGEN: Kreativ? Thematisch? Einprägsam?
3. GENAUIGKEIT (KRITISCH): Ist jede Antwort bei Google/Wikipedia verifizierbar? ABLEHNEN beim geringsten Zweifel
4. PRÄZISION DER ANTWORTEN: Antwort = 1 Wort oder max. 2-3 Wörter? ABLEHNEN bei "Alte Möbel", "Ein Hund", "Sprechendes Essen", etc.
5. NULL MEHRDEUTIGKEIT: Nur eine mögliche Antwort? ABLEHNEN wenn mehrere gültige Antworten
6. VARIIERTE FORMULIERUNG: Nicht mehr als 2x die gleiche Formulierung pro Menü? (z.B. "Was ist?" 5x wiederholt = ABLEHNEN)
7. SCHRÄGER STIL: Nicht schulisch? Witzig?
8. FALLEN-MENÜ: 1 Menü isTrap:true mit WIRKLICH schwierigeren Fragen?
9. KEINE DUPLIKATE: Keine identische Frage zwischen den 4 Menüs?
10. KOHÄRENTES THEMA: Alle Fragen bleiben mit dem Thema verbunden?

⚠️ SEI BESONDERS STRENG BEI:
- Vagen Antworten (z.B. "Möbel", "Objekte", "Essen")
- Erfundenen oder nicht dokumentierten Phobien
- Repetitiven Fragen ("Was ist?" × 5)

SCHWELLEN: factual_accuracy ≥ 8, clarity ≥ 8, answer_length ≥ 7, trap_menu ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"title_creativity":1-10,"descriptions":1-10,"thematic_variety":1-10,"question_style":1-10,"factual_accuracy":1-10,"clarity":1-10,"difficulty":1-10,"answer_length":1-10,"trap_menu":1-10},
  "overall_score": 1-10,
  "menus_feedback": [
    {
      "menu_index": 0,
      "title": "...",
      "title_ok": true|false,
      "questions_feedback": [
        {"index":0,"question":"...","answer":"...","ok":true|false,"issues":["Antwort zu vage", "Repetitive Formulierung", "Faktencheck unmöglich"],"correction":"Korrigierte Antwort oder null"}
      ]
    }
  ],
  "global_feedback": "...",
  "suggestions": ["Formulierungen variieren", "Fakten bei Google prüfen", "Präzisere Antworten"]
}

Kein Markdown.`;

export const PHASE3_TARGETED_REGENERATION_PROMPT = `ERSATZ Phase 3 "Die Karte"

STRUKTUR: {MENUS_STRUCTURE}
ZU ERSETZEN: {BAD_QUESTIONS}
GRÜNDE: {REJECTION_REASONS}

REGELN: Schräge Formulierung, verifizierbare Antwort (Google), 1-3 Wörter, gleiches Thema.

JSON:
{
  "replacements": [
    {"menu_index":0,"question_index":2,"new_question":"...?","new_answer":"..."}
  ]
}

Kein Markdown.`;

/**
 * Answer Validation Prompt
 * Used by answerValidator.ts for LLM-based fuzzy matching
 */
export const ANSWER_VALIDATION_PROMPT = `Du bist ein LUSTIGER Quiz-Validierer im Burger Quiz Stil. Sei GROSSZÜGIG!

SPIELER-ANTWORT: "{PLAYER_ANSWER}"
KORREKTE ANTWORT: "{CORRECT_ANSWER}"
AKZEPTIERTE ALTERNATIVEN: {ALTERNATIVES}

=== PHILOSOPHIE: ES IST EIN SPIEL, KEINE PRÜFUNG! ===
Wenn der Spieler zeigt, dass er das Thema kennt, AKZEPTIERE seine Antwort.
Wir wollen Freudenmomente, keine Frustrationen wegen Details.

✅ GROSSZÜGIG AKZEPTIEREN wenn:
- Synonym oder Wort aus der gleichen Familie (z.B. "Armbrust" ≈ "Armbrustbolzen")
- Genauere Antwort als gefordert (z.B. "Eiffelturm" für "Pariser Denkmal")
- Antwort verbunden mit dem gleichen Konzept (z.B. "Armbrustmunition" ≈ "Armbrust")
- Rechtschreibfehler, auch grobe (z.B. "Napolean" = "Napoleon")
- Variante mit/ohne Akzent (z.B. "Naher Osten" = "Naher-Osten")
- Abkürzung oder vollständiger Name (z.B. "USA" = "Vereinigte Staaten")
- Mit oder ohne Artikel (z.B. "Der Louvre" = "Louvre")
- Zahlen in Worten oder Ziffern (z.B. "3" = "drei")
- Umgekehrte Wortfolge (z.B. "Barack Obama" = "Obama Barack")
- Bekannter Spitzname (z.B. "Messi" = "Lionel Messi")

❌ NUR ABLEHNEN wenn:
- Antwort VÖLLIG themenverfehlt (keine Verbindung zur richtigen Antwort)
- Offensichtliche Verwechslung zwischen zwei verschiedenen Dingen (z.B. "Napoleon" für "Cäsar")
- Zu vage Antwort, die alles sein könnte (z.B. "ein Ding" für "Deutschland")
- Pure Erfindung (Antwort die überhaupt nicht existiert)

KONKRETE BEISPIELE:
- "Eine Armbrust" erwartet, "Armbrustbolzen" gegeben → ✅ AKZEPTIEREN (gleiches Konzept)
- "Eiffelturm" erwartet, "Der Turm" gegeben → ✅ AKZEPTIEREN (im Kontext präzise genug)
- "Napoleon" erwartet, "Bonaparte" gegeben → ✅ AKZEPTIEREN (gleiche Person)
- "Napoleon" erwartet, "Ludwig XIV" gegeben → ❌ ABLEHNEN (andere Person)

JSON FORMAT:
{
    "isCorrect": true | false,
    "confidence": 1-100,
    "explanation": "Kurzer Grund"
}

Kein Markdown.`;
