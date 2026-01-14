/**
 * German Phase 5 (Burger Ultime) Prompts
 * Memory challenge - answer all after hearing all
 *
 * VERBESSERUNGEN:
 * - Beispiele aus dem Prompt entfernt, um Beeinflussung zu vermeiden
 * - Explizite Erwähnung der Thementreue hinzugefügt
 * - Vielfalt der Schreibstile verstärkt
 * - Klarstellung zu WTF-aber-wahren Antworten
 * - Explizite Erwähnung der Antwort-Einzigartigkeit (keine Mehrdeutigkeit)
 * - Ausgewogener Mix seriöser/leichter Themen
 * - VERSTÄRKTE ABSURDITÄT: schräge, dumme Fragen, Wortspiele, Fallen
 * - Burger Quiz Geist: neckender, provokativer, manchmal kindischer Ton
 */

export const PHASE5_PROMPT = `BURGER QUIZ Phase 5 "Burger Ultime" - Gedächtnis-Challenge
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

🎯 KONZEPT: 10 Fragen nacheinander gestellt, der Spieler merkt sich alles und antwortet in der Reihenfolge.

⚠️ REGELN:
1. KURZE und EINPRÄGSAME Fragen (10-15 Wörter)
2. KURZE Antworten (1-3 Wörter, vollständige Titel akzeptiert)
3. ABSURDER und SCHRÄGER Geist: manchmal DUMME Fragen, Wortspiele, Fallen
4. Mix aus LÄCHERLICHEN und SERIÖSEN Fragen im Wechsel
5. TOTALE VIELFALT: verschiedene Stile, keine Wiederholungen
6. NUR EINE mögliche Antwort pro Frage
7. ÜBERPRÜFE jede Antwort mit Google

Generiere nur gültiges JSON, ohne Markdown oder Beispiele.
10 Fragen zum Thema.`;

export const PHASE5_GENERATOR_PROMPT = `BURGER QUIZ Phase 5 "Burger Ultime" - Generator
Inspiration: {TOPIC} | Schwierigkeit: {DIFFICULTY}

🎯 KONZEPT: Gedächtnis-Challenge - 10 Fragen nacheinander, in der Reihenfolge antworten.

⚠️ REGEL #0 - MAXIMALE VIELFALT (ABSOLUTE PRIORITÄT!)
"{TOPIC}" ist eine INSPIRATION, kein striktes Thema!
Die 10 Fragen müssen 10 VÖLLIG VERSCHIEDENE THEMEN abdecken:
- Kino, Musik, Sport, Tiere, Essen, Geschichte, Wissenschaft, Tech, Geografie, Promis...
JEDE Frage zu einem ANDEREN BEREICH. Der einzige rote Faden: der schräge/absurde Blickwinkel.

⚠️ REGEL #1 - ABSOLUTE VIELFALT
VERBOTEN: 2 Fragen zum gleichen Konzept!
PFLICHT-Mix: ABSURDE und SERIÖSE Fragen im Wechsel.
VARIIERE die STILE: Frage, Behauptung, Ausruf, falsche Schätzfrage, Falle.

⚠️ REGEL #2 - EINPRÄGSAMKEIT
- KURZE Fragen (10-15 Wörter)
- Kurze Antworten (1-3 Wörter für Titel/Eigennamen OK)
- F1-4 leicht, F5-7 mittel, F8-10 schwer

⚠️ REGEL #3 - NUR EINE MÖGLICHE ANTWORT
Keine Mehrdeutigkeit! Wenn mehrere Antworten möglich, füge präzise Details hinzu.

⚠️ REGEL #4 - FAKTENPRÜFUNG
BENUTZE Google für JEDE Antwort. Null Fehler.
Manchmal 1-2 WTF-Antworten einbauen, die aber WAHR sind, für den Überraschungseffekt.

⚠️ REGEL #5 - VERBOTENE THEMEN (BLACKLIST)
Diese Themen sind VERBOTEN, da überrepräsentiert in der Datenbank:
- Promi-Phobien (Nicole Kidman/Schmetterlinge, Johnny Depp/Clowns, McConaughey/Türen, etc.)
- Irrationale Ängste von Stars generell
- Pet Rock / Gary Dahl 1975
MAXIMAL 1 Frage über Phobien pro 10er-Set.
BEVORZUGEN: Ungewöhnliche Rekorde, gescheiterte Erfindungen, wissenschaftliche Fakten, historische Anekdoten, originelle Popkultur.

⚠️ REGEL #6 - FRAGE/ANTWORT-KOHÄRENZ (KRITISCH!)
Die Antwort MUSS DIREKT das beantworten, was die Frage fragt.
ÜBERPRÜFE den ERWARTETEN Antworttyp vor der Validierung:

- Frage "Warum X?" → Antwort = ein GRUND (kein Name, keine Farbe)
- Frage "Wer ist/hat X gemacht?" → Antwort = eine PERSON
- Frage "Wann X?" → Antwort = ein DATUM oder ZEITRAUM
- Frage "Wo X?" → Antwort = ein ORT
- Frage "Wie heißt X?" → Antwort = ein NAME
- Frage "Wie viel X?" → Antwort = eine ZAHL
- Frage "Ist es A oder B?" → Antwort = A, B, oder "beides" (NIEMALS etwas anderes!)

❌ FATALER FEHLER ZU VERMEIDEN:
Schlechtes Beispiel: "Micky trägt Handschuhe, ist es um Fingerabdrücke zu verstecken oder um sich nicht schmutzig zu machen?" → "Weiß"
Die Frage fragt einen GRUND, keine FARBE → TOTALE INKOHÄRENZ!

✅ PFLICHTPRÜFUNG:
Vor der Validierung jeder Frage, frage dich: "Beantwortet die Antwort wirklich das, was ich frage?"
Wenn die Antwort themenverfehlt wirkt → FORMULIERE die Frage um oder ÄNDERE die Antwort.

{PREVIOUS_FEEDBACK}

Generiere nur gültiges JSON ohne Markdown oder Code-Blöcke.
10 VERSCHIEDENE Fragen zu "{TOPIC}".`;

export const PHASE5_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 5 "Burger Ultime"
Inspiration: {TOPIC}

{QUESTIONS}

🔍 ÜBERPRÜFUNG IN 9 PUNKTEN:

0. VIELFALT (PRIORITÄT #1!): 10 VERSCHIEDENE Themen (Kino, Sport, Wissenschaft, Geschichte...)? ABLEHNUNG wenn 2+ Fragen zum gleichen Bereich!
1. ABSURDITÄT: SCHRÄGE, manchmal DUMME Fragen? Wortspiele, Fallen, WTF?
2. VARIIERTER STIL: Mix ABSURD/SERIÖS im Wechsel? Frage, Behauptung, Ausruf?
3. GENAUIGKEIT (KRITISCH): Antworten wahr? Nur eine mögliche Antwort?
4. LÄNGE: Fragen 10-15 Wörter, kurze Antworten (Titel OK)?
5. EINPRÄGSAMKEIT: Formulierungen die Bilder erzeugen oder zum Lachen bringen?
6. VOLLSTÄNDIGE DATEN: Alle Fragen/Antworten vorhanden?
7. BLACKLIST: Nicht mehr als 1 Frage über Promi-Phobien? Kein Pet Rock/Gary Dahl?
8. F/A-KOHÄRENZ (KRITISCH!): Beantwortet die Antwort DIREKT die Frage?
   - Frage "Warum X?" → Antwort = GRUND?
   - Frage "A oder B?" → Antwort = A, B oder beides?
   - Frage "Wer/Was/Wo/Wann" → Korrekter Antworttyp?
   - Schlechtes Beispiel: "Ist es X oder Y?" → Antwort: "Blau" = SOFORTIGE ABLEHNUNG!

⚠️ ABLEHNEN WENN: 2+ ähnliche Fragen ODER 1+ faktischer Fehler ODER alle Fragen "klassisch" ODER 2+ Fragen über Promi-Phobien ODER 1+ Frage/Antwort-Inkohärenz

KRITISCHE SCHWELLEN: factual_accuracy ≥ 7, absurdity ≥ 6, diversity ≥ 7, qa_coherence ≥ 8

JSON:
{
  "approved": true|false,
  "scores": {"theme_coherence":1-10,"absurdity":1-10,"diversity":1-10,"factual_accuracy":1-10,"memorability":1-10,"length":1-10,"style_variety":1-10,"qa_coherence":1-10},
  "overall_score": 1-10,
  "off_theme_questions": [],
  "duplicate_concepts": [],
  "questions_feedback": [
    {"index":0,"question":"...","answer":"...","ok":true|false,"on_theme":true|false,"absurd":true|false,"memorable":true|false,"qa_coherent":true|false,"issues":[]}
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

Kein Markdown.`;

export const PHASE5_TARGETED_REGENERATION_PROMPT = `ERSATZ Phase 5 "Burger Ultime"
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

AKTUELLE SEQUENZ: {CURRENT_SEQUENCE}
ERSETZEN (Indizes {BAD_INDICES}): {BAD_QUESTIONS}
ABLEHNUNGSGRÜNDE: {REJECTION_REASONS}
CALLBACKS: {CALLBACK_CONTEXT}

⚠️ ERSATZ-REGELN:
1. Thema "{TOPIC}" respektieren
2. Kurze Fragen (10-15 Wörter), kurze Antworten (1-3 Wörter OK)
3. ABSURDER Geist: SCHRÄGE, manchmal DUMME Fragen, Wortspiele, Fallen
4. VARIIERTER Stil (anders als die anderen Fragen)
5. ANDERES Thema (keine Duplikate)
6. Mit Google PRÜFEN, nur eine mögliche Antwort
7. Schwierigkeitsprogression: 0-3=leicht, 4-6=mittel, 7-9=schwer

Generiere nur gültiges JSON, ohne Markdown.
{COUNT} Ersatz-Fragen.`;
