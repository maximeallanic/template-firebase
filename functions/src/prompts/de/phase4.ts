/**
 * German Phase 4 (Die Rechnung) Prompts
 * MCQ Race - Classic general knowledge
 */

export const PHASE4_PROMPT = `BURGER QUIZ Phase 4 "Die Rechnung" - MCQ-Rennen
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

🎯 KONZEPT: Schnelligkeitsrennen, wer zuerst richtig antwortet, gewinnt.

⚠️ REGELN:
1. 4 Optionen pro Frage (1 korrekt, 3 PLAUSIBLE Ablenker)
2. VERIFIZIERBARE Antworten (benutze Google)
3. Mix von Themen: Geschichte, Geo, Wissenschaft, Kunst, Sport

JSON:
[
  {
    "text": "Klare Frage?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Lustiger Fakt (optional)"
  }
]

10 Fragen. Kein Markdown.`;

export const PHASE4_GENERATOR_PROMPT = `BURGER QUIZ Phase 4 "Die Rechnung" - MCQ Allgemeinwissen
Vorgeschlagenes Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

🎯 KONZEPT: MCQ-Schnelligkeitsrennen - Abwechslungsreiches Allgemeinwissen wie in der Burger Quiz TV-Show!

⚠️ REGEL #1 - THEMATISCHE VIELFALT (KRITISCH!)
ACHTUNG: Das obige Thema ist nur ein VORSCHLAG für maximal 2-3 Fragen.
Die 10 Fragen MÜSSEN zwingend VERSCHIEDENE Bereiche abdecken:

PFLICHT-VERTEILUNG:
- 2-3 Fragen Geschichte / Geografie (Daten, Länder, historische Persönlichkeiten)
- 2-3 Fragen Wissenschaft / Natur / Tiere (Biologie, Physik, Astronomie)
- 2-3 Fragen Kunst / Musik / Kino (Werke, Künstler, Filme)
- 2-3 Fragen Sport / Popkultur / Alltag (Rekorde, Promis, Traditionen)

VERBOTEN: Mehr als 3 Fragen zum gleichen Thema. Variiere maximal!

⚠️ REGEL #2 - MCQ-FORMAT
- 4 Optionen (1 korrekt, 3 PLAUSIBLE Ablenker aus dem gleichen Register)
- Klare und direkte Fragen (max. 25 Wörter)
- Kurze und prägnante Anekdote (max. 30 Wörter)

⚠️ REGEL #2b - ABLENKER AUS DEM GLEICHEN UNIVERSUM (KRITISCH!)
Die 4 Optionen MÜSSEN zum GLEICHEN Universum/Kontext wie die Frage gehören:

✅ GUTE ABLENKER:
- Frage über Star Wars → 4 Raumschiffe aus STAR WARS (nicht Star Trek!)
- Frage über Deutschland → 4 deutsche Städte/Regionen
- Frage über die Beatles → 4 Gruppen aus der GLEICHEN EPOCHE
- Frage über einen Sport → 4 Athleten aus dem GLEICHEN SPORT

❌ SCHLECHTE ABLENKER (SOFORTIGE ABLEHNUNG):
- Star Wars und Star Trek mischen (unterschiedliche Universen!)
- Fußball und Tennis in der gleichen Frage mischen
- Eine absurde Antwort die niemanden täuscht
- Eine Option aus einem anderen Bereich/Epoche/Universum einfügen

GOLDENE REGEL: Ein Experte des Bereichs muss zwischen den 4 Optionen zögern.
Wenn eine Option "offensichtlich falsch" ist weil themenfremd → SCHLECHTER Ablenker.

⚠️ REGEL #3 - SCHWIERIGKEITSVERTEILUNG
- 3 LEICHTE (Allgemeinwissen: Hauptstädte, berühmte Daten, Kultfilme)
- 4 MITTLERE (solides Allgemeinwissen nötig)
- 3 SCHWERE (spitze Anekdoten, unbekannte Details)

⚠️ REGEL #4 - ABSOLUTE GENAUIGKEIT
BENUTZE Google um JEDE Antwort zu überprüfen, bevor du sie schreibst.
Keine Mehrdeutigkeit, keine mögliche Debatte. Im Zweifelsfall, ändere die Frage.

⚠️ REGEL #5 - ACHTUNG VOR MYTHEN UND URBANEN LEGENDEN
Einige "berühmte Anekdoten" sind in Wirklichkeit FALSCH:
- ÜBERPRÜFE IMMER außergewöhnliche Behauptungen mit einer Suche
- Wenn eine Geschichte "zu schön klingt, um wahr zu sein", ist sie es wahrscheinlich
- Bevorzuge vorsichtige Formulierungen für umstrittene Fakten ("Der Legende nach...", "Soll haben...")
- Ein faktischer Fehler = ABLEHNUNG der gesamten Frage

HÄUFIGE MYTHEN, DIE NIEMALS ALS FAKTEN VERWENDET WERDEN SOLLTEN:
- Caligula hat sein Pferd NICHT zum Konsul ernannt (er hat es nur erwogen)
- Einstein war GUT in Mathe
- Wikinger hatten KEINE Hörnerhelme
- Newton und der Apfel: UNBEWIESENE Anekdote
- Marie-Antoinette: "Sollen sie doch Kuchen essen" nie dokumentiert

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "text": "Präzise Frage?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Verifizierter und prägnanter Fakt"
  }
]

10 ABWECHSLUNGSREICHE Fragen. Kein Markdown.`;

export const PHASE4_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 4 "Die Rechnung" (MCQ)

{QUESTIONS}

🔍 ÜBERPRÜFUNG IN 4 PUNKTEN:

1. GENAUIGKEIT (KRITISCH): Antworten wahr? Benutze Google!
2. OPTIONEN: 4 plausible Optionen aus dem gleichen Register?
3. SCHWIERIGKEIT: 3 leichte + 4 mittlere + 3 schwere?
4. VIELFALT: Mix Geschichte, Geo, Wissenschaft, Kunst, Sport?

SCHWELLEN: factual_accuracy ≥ 7, option_plausibility ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"factual_accuracy":1-10,"option_plausibility":1-10,"difficulty_balance":1-10,"thematic_variety":1-10,"clarity":1-10,"anecdote_quality":1-10},
  "overall_score": 1-10,
  "difficulty_distribution": {"easy":[0,1,2],"medium":[3,4,5,6],"hard":[7,8,9]},
  "questions_feedback": [
    {"index":0,"question":"...","correct_option":"...","ok":true|false,"difficulty":"easy|medium|hard","issues":[],"correction":null}
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

Kein Markdown.`;

export const PHASE4_TARGETED_REGENERATION_PROMPT = `ERSATZ Phase 4 "Die Rechnung" (MCQ)

BEHALTEN: {GOOD_QUESTIONS}
ERSETZEN (Indizes {BAD_INDICES}): {BAD_QUESTIONS}
GRÜNDE: {REJECTION_REASONS}

REGELN: 4 plausible Optionen, 1 korrekt, mit Google prüfen, Anekdote optional.

JSON:
[
  {"text":"...?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"..."}
]

{COUNT} Fragen. Kein Markdown.`;
