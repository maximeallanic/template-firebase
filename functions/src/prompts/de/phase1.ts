/**
 * German Phase 1 (Tenders) Prompts
 * Speed MCQ questions in Burger Quiz style
 * OPTIMIZED: Condensed prompts for faster generation
 */

export const PHASE1_PROMPT = `BURGER QUIZ - 10 Tenders-Fragen
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

⚠️ STRENGE REGELN:
1. 4 GLAUBWÜRDIGE Optionen aus dem gleichen Register (der Spieler ZÖGERT wirklich)
2. EINE EINZIGE verifizierbare korrekte Antwort, 3 FALSCHE aber plausible
3. Klare und direkte Fragen (max. 15 Wörter)
4. Interessante und WAHRE Anekdote (max. 20 Wörter)

❌ VERBOTEN: Wortspiele in den Optionen, Duplikate

JSON: [{"text":"Schräge Frage?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"WTF-Fakt"}]`;

export const PHASE1_GENERATOR_PROMPT = `Du bist ein Fragensteller für BURGER QUIZ für die Phase "Tenders" (Speed MCQ).

📋 KONTEXT
Vorgegebenes Thema: {TOPIC}
Schwierigkeit: {DIFFICULTY}
Anzahl der Fragen: 10

🎯 REGEL #0 - STRIKTE THEMATISCHE KOHÄRENZ
ALLE 10 Fragen MÜSSEN zum Thema "{TOPIC}" gehören.
Erkunde 10 VERSCHIEDENE Blickwinkel des gleichen Themas.
❌ KEINE themenfremdenen Fragen toleriert.

🎯 REGEL #1 - ABSOLUTE FAKTISCHE GENAUIGKEIT
Jede Frage muss EINE EINZIGE zu 100% verifizierbare korrekte Antwort haben.
ÜBERPRÜFE mental jeden Fakt, BEVOR du ihn schreibst.
Die 3 falschen Antworten müssen FALSCH, aber glaubwürdig sein.
❌ Keine mögliche Mehrdeutigkeit zwischen den Antworten.

⚠️ ACHTUNG VOR MYTHEN UND URBANEN LEGENDEN:
Einige "berühmte Anekdoten" sind in Wirklichkeit FALSCH:
- ÜBERPRÜFE IMMER außergewöhnliche Behauptungen mit einer Suche
- Wenn eine Geschichte "zu schön klingt, um wahr zu sein", ist sie es wahrscheinlich
- Bevorzuge vorsichtige Formulierungen für umstrittene Fakten ("Der Legende nach...", "Soll haben...")
- Ein faktischer Fehler = ABLEHNUNG der gesamten Frage

HÄUFIGE MYTHEN, DIE NIEMALS ALS FAKTEN VERWENDET WERDEN SOLLTEN:
- Caligula hat sein Pferd NICHT zum Konsul ernannt
- Einstein war GUT in Mathe
- Wikinger hatten KEINE Hörnerhelme
- Newton und der Apfel: UNBEWIESENE Anekdote

🎯 REGEL #2 - GLAUBWÜRDIGE OPTIONEN
Die 4 Optionen müssen GLAUBWÜRDIG und aus dem gleichen Register sein.
Der Spieler muss ehrlich zwischen den Optionen ZWEIFELN.
❌ VERBOTEN: offensichtliche Wortspiele, 4 zu ähnliche Optionen (z.B. 4 Wörter auf "-ismus")
✅ PFLICHT: Formatvielfalt (Namen, Zahlen, Daten, Orte, Konzepte)
✅ FALLE: 1-2 überraschende Antworten, die WAHR klingen

🎯 REGEL #3 - THEMENVIELFALT
Wechsle intelligent zwischen:
- SERIÖSEN Themen (Wissenschaft, Geschichte, Geografie)
- LEICHTEN Themen (Popkultur, Kurioses, bizarre Rekorde)
- Kontraintuitiven oder überraschenden Fakten
❌ Keine ähnlichen oder redundanten Fragen.

🎯 REGEL #4 - PFLICHT-ANEKDOTEN
Jede Frage MUSS eine WTF/kuriose Anekdote von max. 20 Wörtern haben.
Die Anekdote bereichert die korrekte Antwort mit einem überraschenden VERIFIZIERBAREN Detail.
❌ Die Anekdote darf NICHT leer oder generisch sein.

{PREVIOUS_FEEDBACK}

AUSGABEFORMAT (reines JSON, kein Markdown):
[
  {
    "text": "Schräge Frage hier?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 2,
    "anecdote": "Überraschender und verifizierbarer WTF-Fakt."
  }
]

Generiere 10 VERSCHIEDENE Fragen zum Thema "{TOPIC}".`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `Du bist ein STRENGER Reviewer für BURGER QUIZ Phase 1 Fragen.

ERWARTETES THEMA: {TOPIC}

ZU BEWERTENDE FRAGEN:
{QUESTIONS}

🔍 STRENGE BEWERTUNGSRASTER (10 Kriterien):

1. THEMATISCHE KOHÄRENZ (Punktzahl von 10)
   - Gehören ALLE Fragen zum Thema "{TOPIC}"?
   - NULL Toleranz für themenfremde Fragen
   - Punktzahl < 8 = SOFORTIGE ABLEHNUNG

2. FAKTISCHE GENAUIGKEIT (Punktzahl von 10)
   - Ist jede korrekte Antwort 100% wahr und verifizierbar?
   - Gibt es nur EINE korrekte Antwort ohne Mehrdeutigkeit?
   - Sind die falschen Antworten wirklich falsch?
   - Punktzahl < 8 = SOFORTIGE ABLEHNUNG

3. QUALITÄT DER OPTIONEN (Punktzahl von 10)
   - Klingen alle 4 Optionen plausibel?
   - Verschiedene Formate (nicht 4 Namen auf "-ismus" oder 4 ähnliche Daten)?
   - Vorhandensein von 1-2 WTF/absurden Optionen, die wahr klingen?
   - ❌ Offensichtliche Wortspiele, komische Erfindungen
   - Punktzahl < 7 = ABLEHNUNG

4. HUMOR & STIL (Punktzahl von 10)
   - Schräge, absurde, respektlose Formulierungen?
   - Bringen die Fragen zum Schmunzeln?
   - Punktzahl < 6 = ABLEHNUNG

5. STILVIELFALT (Punktzahl von 10)
   - VERSCHIEDENE Satzstrukturen zwischen den Fragen?
   - Mix aus direkten, behauptenden, provokativen Fragen?
   - Punktzahl < 7 = ABLEHNUNG

6. KLARHEIT (Punktzahl von 10)
   - Kurze Fragen (≤ 15 Wörter)?
   - Keine Mehrdeutigkeit in der Formulierung?
   - Punktzahl < 7 = ABLEHNUNG

7. THEMENVIELFALT (Punktzahl von 10)
   - Mix seriös/leicht?
   - Keine Duplikate oder ähnlichen Fragen?
   - Punktzahl < 7 = ABLEHNUNG

8. ANEKDOTEN (Punktzahl von 10)
   - Hat jede Frage eine verifizierbare WTF-Anekdote?
   - Überraschende und nicht generische Anekdoten?
   - Angemessene Länge (≤ 20 Wörter)?

9. ORIGINALITÄT (Punktzahl von 10)
   - Unerwartete und frische Fragen?
   - Keine Klischees oder 1000-mal gesehene Fragen?

10. TRICKPOTENZIAL (Punktzahl von 10)
    - Bringen die Fragen wirklich zum Zögern?
    - Kann sich der Spieler leicht irren?

⚠️ KRITERIEN FÜR AUTOMATISCHE ABLEHNUNG:
- 1+ themenfremde Frage → approved: false
- 1+ faktischer Fehler → approved: false
- 1+ Mehrdeutigkeit → approved: false
- Lächerliche/zu ähnliche Optionen → approved: false
- Interne Duplikate → approved: false
- Fehlende Anekdoten → approved: false
- Nicht witzig genug (humor < 6) → approved: false

✅ GENEHMIGUNGSSCHWELLEN (ALLE erforderlich):
- factual_accuracy ≥ 8
- options_quality ≥ 7
- humor ≥ 6
- clarity ≥ 7
- variety ≥ 7
- overall_score ≥ 7

AUSGABEFORMAT (reines JSON, kein Markdown):
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
      "text": "Fragentext",
      "ok": true|false,
      "funny": true|false,
      "issue": "Problembeschreibung wenn ok=false",
      "issue_type": "factual_error"|"off_topic"|"ambiguous"|"not_funny"|"too_long"|"duplicate"|"implausible_options"|"missing_anecdote"|null
    }
  ],
  "global_feedback": "Detailliertes Feedback zu allen Fragen",
  "suggestions": ["Vorschlag 1", "Vorschlag 2", "..."]
}

Sei GNADENLOS. Besser ablehnen und iterieren als mittelmäßige Fragen validieren.`;

export const PHASE1_TARGETED_REGENERATION_PROMPT = `ERSATZ - Generiere {COUNT} Burger Quiz Frage(n)
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

ABGELEHNT: {BAD_QUESTIONS}
GRÜNDE: {REJECTION_REASONS}

🎯 ANTI-SPOILER ERINNERUNG:
• NIEMALS das Unterscheidungsmerkmal in der Frage nennen
• FOLGEN oder indirekte AKTIONEN verwenden
• 4 UNTERSCHIEDLICHE Optionen (keine Synonyme)

JSON: [{"text":"Frage ohne Spoiler?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Verifizierbarer Fakt"}]`;

export const REVIEW_PHASE1_PROMPT = `FAKTENCHECK Phase 1: {QUESTIONS}

Überprüfe jede Frage: 1) Antwort wahr? 2) Nur eine mögliche Antwort? 3) Lustiger Stil? 4) Anekdote wahr?

JSON: {"reviews":[{"index":0,"status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"style"|"anecdote"|null}],"summary":{"approved":8,"rejected":2,"rejectedIndices":[3,7]}}`;

export const REGENERATE_PHASE1_PROMPT = `REGENERIERE {COUNT} Burger Quiz Frage(n)
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}
Abgelehnt: {REJECTED_REASONS}

Lustiger Stil, verifizierbare Antworten, 4 glaubwürdige Optionen.

JSON: [{"text":"Frage?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"WTF-Fakt"}]`;
