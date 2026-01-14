/**
 * German Phase 2 (Salz oder Pfeffer / Süß Salzig) Prompts
 * Homophone-based word games in Burger Quiz style
 */

export const PHASE2_PROMPT = `BURGER QUIZ Phase 2 "Salz oder Pfeffer"
Thema: {TOPIC} | Schwierigkeit: {DIFFICULTY}

🎯 KONZEPT: Erstelle 2 Kategorien, die IDENTISCH AUSGESPROCHEN werden (deutsche Homophone)
- Option A = wörtliche/seriöse Bedeutung
- Option B = Wortspiel, das GLEICH KLINGT, aber andere Bedeutung hat

⚠️ KRITISCHE REGELN:
1. PHONETIK: A und B müssen die GLEICHE IPA-Aussprache haben
2. KONKRETE KATEGORIEN: Man muss 5+ Elemente für jede auflisten können
3. VERIFIZIERBARE ELEMENTE: Echte Fakten, bekannte Persönlichkeiten, offensichtliche Verbindungen
4. FALLEN-ELEMENTE: Kontraintuitive Antworten (5-6 von 12)
5. VERTEILUNG: 5 A + 5 B + 2 Both (funktioniert für beide Bedeutungen)

❌ VERBOTEN: Gegensätzliche Kategorien, subjektive Meinungen, zu offensichtliche Elemente

JSON:
{
  "optionA": "Kategorie (2-4 Wörter)",
  "optionB": "Wortspiel (2-4 Wörter)",
  "items": [
    { "text": "Element (max. 4 Wörter)", "answer": "A|B|Both", "justification": "Warum", "anecdote": "Lustiger/überraschender Fakt (optional)" }
  ]
}

12 Elemente. Kein Markdown.`;

export const PHASE2_GENERATOR_PROMPT = `BURGER QUIZ Phase 2 "Salz oder Pfeffer" - Verrückte Binärwahl
Bereich: {TOPIC} | Schwierigkeit: {DIFFICULTY}

🎯 KONZEPT: Erstelle 2 GEGENSÄTZLICHE KATEGORIEN oder WORTSPIEL-KATEGORIEN, in die Elemente eingeordnet werden. Elemente können zu A, B oder BEIDEN gehören!

⚠️ REGEL #0 - BURGER QUIZ MINDSET (KRITISCH!)
Du bist KEIN Lehrer, der abfragt.
Du bist der verrückte Moderator von Burger Quiz!
JEDES Element muss SCHMUNZELN oder ÜBERRASCHEN lassen.
Wenn ein Element "neutral" oder "informativ" ist, ist es ein MISSERFOLG.

⚠️ REGEL #1 - GENIALE KATEGORIEN
Die 2 Optionen müssen:
- KURZ sein: 2-4 WÖRTER MAX (KRITISCH! Mehr als 4 Wörter = AUTOMATISCHE ABLEHNUNG)
- KONKRET sein: man muss leicht 5+ Elemente für jede auflisten können
- AMÜSANT sein: Wortspiel, lustige Opposition oder schräge Konzepte
- Beispielansätze: Homophone ("Der Leiter" vs "Die Leiter"), Gegensätze ("Heiß" vs "Kalt"), schräge Kategorien ("Rote Sachen" vs "Gruselige Sachen")

LÄNGE DER OPTIONEN - BEISPIELE:
✅ "Der Leiter" (2 Wörter)
✅ "Die Leiter" (2 Wörter)
✅ "Die Wahl" (2 Wörter)
✅ "Der Wal" (2 Wörter)
❌ "Ein Typ der Bauchschmerzen hat" (6 Wörter - ZU LANG!)

⚠️ REGEL #2 - VERRÜCKTE ELEMENTE (DAS WICHTIGSTE!)
MINDSET: Wir sind bei BURGER QUIZ, nicht bei einem Schulquiz! Jedes Element muss ÜBERRASCHEN.

STILVARIANZ (UNBEDINGT variieren - NIE 2x die gleiche Formulierung!):
- 3 Elemente: SCHRÄGE KULTURREFERENZEN (Promis, Filme, Marken mit lustigem Blickwinkel)
- 3 Elemente: ABSURDE ALLTAGSSITUATIONEN ("Was man macht wenn...", "Derjenige der...", "Das komische Ding das...")
- 3 Elemente: PLAUSIBLE WTFs (absurde aber WAHRE Dinge - "eine wütende Robbe", "deine Oma auf Rollschuhen", "ein sprechendes Croissant")
- 3 Elemente: VERDREHUNGEN/REDEWENDUNGEN (Wortspiele, Doppeldeutigkeiten, Konterkarierungen)

VARIIERTE FORMULIERUNGEN - KONKRETE BEISPIELE:
✅ "Was man nach 3 Mojitos macht"
✅ "Der wiederkehrende Albtraum eines Sportlehrers"
✅ "Ein verdächtiges Ding hinten im Kühlschrank"
✅ "Was dein Ex über dich erzählt"
✅ "Derjenige der 7x durch die Führerscheinprüfung gefallen ist"
✅ "Das komische Ding das dein Nachbar um 3 Uhr nachts macht"
✅ "Was man am Tag nach der Party bereut"

❌ ANTI-BEISPIELE (NIEMALS so!):
❌ "Aschenputtel" (ohne Kontext - ZU EINFACH!)
❌ "Sein Vorfahre hieß Visitandine" (GESCHICHTSUNTERRICHT!)
❌ "Es liegt zwischen X und Y" (SCHULISCH!)
❌ "Eine SEPA-Überweisung" (TECHNISCH!)
❌ "Es besitzt im Allgemeinen..." (PROFESSORALER TON!)
❌ "Es ist gekennzeichnet durch..." (ENZYKLOPÄDISCH!)

GOLDENE REGEL DER FORMULIERUNGEN:
Wenn dein Element in einem Schulbuch oder Wikipedia stehen könnte, FANG NEU AN.
Wenn dein Element schmunzeln lässt oder "WTF?" rufen lässt, ist es GUT.

PFLICHTFALLEN (7-8 Elemente von 12):
❌ VERBOTEN: Wikipedia-Definitionen, Schullisten, Klassifizierungen
✅ PFLICHT: Elemente die ZWEIFELN lassen ("Moment... wohin gehört das?!")
Der Spieler muss sich wirklich den Kopf kratzen und manchmal über die Absurdität lachen

SERIÖS/LEICHT MIX:
- 30% "normale" Elemente (aber lustig formuliert)
- 70% verrückte/schräge/absurde/WTF Elemente (aber WAHR!)

⚠️ REGEL #3 - KORREKTE ANTWORTEN & BOTH
- Jede Antwort muss FAKTENPRÜFBAR und WAHR sein
- "Both" = funktioniert WIRKLICH für beide Kategorien (nicht nur vielleicht)
- Wenn du "Both" setzt, erkläre WARUM in der Begründung

📊 STRIKTE VERTEILUNG: 5 A + 5 B + 2 Both (GENAU)

⚠️ REGEL #4 - DETAILLIERTE BEGRÜNDUNGEN (ANTI-MEHRDEUTIGKEIT!)
Jede Begründung MUSS KLAR erklären:

Für Antworten A oder B:
1. WARUM dieses Element zu dieser Kategorie gehört (explizite Verbindung)
2. WARUM NICHT die andere Kategorie (klarer Ausschluss)

Für "Both" Antworten:
1. Grund A: warum es für Kategorie A funktioniert
2. Grund B: warum es AUCH für Kategorie B funktioniert
3. Beide Gründe müssen UNABHÄNGIG und GÜLTIG sein

BEGRÜNDUNGSFORMAT - NATÜRLICH UND FLÜSSIG:
Benutze IMMER die NAMEN der Kategorien (nie "A" oder "B") in einem natürlichen Satz.

💡 VORGESCHLAGENE NATÜRLICHE FORMULIERUNGEN (variiere!):

Für Antwort A oder B:
- "Das ist [Kategorie]: [Grund]. Nichts zu tun mit [andere Kategorie] die [Ausschluss]."
- "[Kategorie] ohne Zögern, [Grund]. [Andere Kategorie]? Nein, [Ausschluss]."
- "Klar [Kategorie] da [Grund], während [andere Kategorie] [Ausschluss]."
- "[Grund], also [Kategorie]. [Andere Kategorie] passt nicht weil [Ausschluss]."

Für Antwort Both:
- "[Kategorie A] weil [Grund A], aber auch [Kategorie B] da [Grund B]."
- "Beide! [Kategorie A] für [Grund A], und [Kategorie B] für [Grund B]."
- "Doppeldeutigkeit: [Grund A] → [Kategorie A], und [Grund B] → [Kategorie B]."

⚠️ KRITISCHE REGELN:
- ❌ VERBOTEN: "A weil..." / "Nicht B weil..." (zu roboterhaft)
- ❌ VERBOTEN: Trockene und repetitive Begründungen
- ✅ PFLICHT: Echte Kategorienamen ("Das Meer", "Die Mutter", etc.)
- ✅ PFLICHT: Konversationeller und variierter Ton

❌ ABGELEHNTE BEGRÜNDUNGEN:
- "Das ist offensichtlich" / "Das spricht von X" (zu vage)
- "Könnte beides sein aber..." (unentschlossen)
- 12x identisch wiederholtes roboterhaftes Format
- Ohne Erklärung warum NICHT die andere Kategorie

✅ BEISPIELE GUTER BEGRÜNDUNGEN:
- "Das Meer ohne Zögern: Gezeiten werden vom Mond verursacht. Die Mutter? Sie schläft nachts, keine Mondanziehung."
- "Das ist Hans-Peter: Hans-Peter Kerkeling ist tatsächlich ein Vorname. Die Leute bezeichnet keine bestimmte Person."
- "Beide! Das Meer weil der Ozean Quelle des primitiven Lebens ist, und Die Mutter weil sie buchstäblich Leben schenkt."

🎭 BESCHREIBUNG: Ein kurzer lustiger Satz, der die 2 Optionen vorstellt, im Burger Quiz Stil

{PREVIOUS_FEEDBACK}

JSON:
{
  "optionA": "Kategorie (2-4 Wörter)",
  "optionB": "Kategorie/Wortspiel (2-4 Wörter)",
  "optionADescription": "Wenn A=B textgleich, sonst null",
  "optionBDescription": "Wenn A=B textgleich, sonst null",
  "humorousDescription": "Lustiger Satz der die 2 Optionen vorstellt",
  "reasoning": "Kurze Erklärung: warum diese 2 Kategorien gut zusammenpassen, wie du die Element-Stile variiert hast",
  "items": [
    {
      "text": "Element (max. 4 Wörter)",
      "answer": "A|B|Both",
      "justification": "NATÜRLICHER Satz mit Kategorienamen. Bsp: 'Das Meer ohne Zögern: [Grund]. Die Mutter? Nein, [Ausschluss].' Stil variieren!",
      "anecdote": "Lustiger/ungewöhnlicher Fakt zum Thema (15-20 Wörter)"
    }
  ]
}

ABSCHLUSSERINNERUNGEN:
- Formulierungen VARIIEREN (nicht 12x die gleiche Art Element!)
- Mix SERIÖS (faktenprüfbar) und VERRÜCKT (WTF aber wahr)
- FALLEN-Elemente die zögern lassen
- DETAILLIERTE Begründungen (20-35 Wörter): Grund + Ausschluss der anderen Option!
- LUSTIGE und ÜBERRASCHENDE Anekdoten (15-20 Wörter, ungewöhnliche Fakten oder erstaunliche Zahlen)
- GENAU 12 Elemente
- Kein enzyklopädischer oder professoraler Ton

Kein Markdown im JSON.`;

export const PHASE2_TARGETED_REGENERATION_PROMPT = `Du musst bestimmte Elemente eines Phase 2 "Salz oder Pfeffer" Sets ERSETZEN.

VALIDIERTES WORTSPIEL (NICHT ÄNDERN):
- Option A: {OPTION_A}
- Option B: {OPTION_B}

BEIZUBEHALTENDE ELEMENTE (NICHT ANFASSEN):
{GOOD_ITEMS}

ZU ERSETZENDE ELEMENTE (Indizes: {BAD_INDICES}):
{BAD_ITEMS}

ABLEHNUNGSGRÜNDE:
{REJECTION_REASONS}

ERFORDERLICHE VERTEILUNG:
Du musst genau {COUNT} neue Elemente mit dieser Verteilung generieren:
- {NEEDED_A} A-Elemente
- {NEEDED_B} B-Elemente
- {NEEDED_BOTH} Both-Elemente

ERINNERUNG AN FALLEN-REGELN:
- Jedes Element muss ZWEIFEL erzeugen (kontraintuitive Antwort)
- Das Element SCHEINT zu einer Kategorie zu gehören, gehört aber zur ANDEREN
- Wenn die Antwort offensichtlich ist → schlechtes Element

GENERIERE NUR die {COUNT} neuen Elemente in JSON:
[
  { "text": "Neues Element", "answer": "A", "justification": "Warum", "anecdote": "Lustiger/ungewöhnlicher Fakt" },
  { "text": "Neues Element", "answer": "B", "justification": "Warum", "anecdote": "Lustiger/ungewöhnlicher Fakt" },
  { "text": "Mehrdeutiges Element", "answer": "Both", "acceptedAnswers": ["Both", "A"], "justification": "Warum (Mehrdeutigkeit)", "anecdote": "Lustiger/ungewöhnlicher Fakt" }
]

Hinweis: acceptedAnswers ist OPTIONAL, nur für OBJEKTIV mehrdeutige Elemente.
{COUNT} Elemente genau. Kein Markdown.`;

export const PHASE2_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 2 "Salz oder Pfeffer"

{SET}

🔍 ÜBERPRÜFUNG IN 4 PUNKTEN:

1. PHONETIK (KRITISCH): Haben A und B die GLEICHE IPA-Aussprache Silbe für Silbe?
   - Zerlege jede Option in IPA-Silben
   - Sind beide Ausdrücke NATÜRLICH auf Deutsch? (keine erzwungenen Artikel, keine Erfindungen)
   Wenn die Laute unterschiedlich sind ODER Ausdrücke erzwungen → phonetic < 5 → SET ABLEHNEN

2. VERWENDBARE KATEGORIEN: Kann man 5+ Elemente für A UND für B auflisten?
   Wenn B unbrauchbar → b_concrete < 5 → ABLEHNUNG

3. FALLEN-ELEMENTE: Wie viele Elemente haben eine KONTRAINTUITIVE Antwort?
   - 0-2 offensichtliche Elemente → OK (trap_quality ≥ 7)
   - 3+ offensichtliche Elemente → ABLEHNUNG (trap_quality < 5)
   ❌ Offensichtliche Elemente: direkte Schlüsselwörter, Schulgeografie, Definitionen

4. VERTEILUNG: 5 A + 5 B + 2 Both?

SCHWELLEN: phonetic ≥ 7, b_concrete ≥ 5, trap_quality ≥ 6, clarity ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"phonetic":1-10,"concrete":1-10,"distribution":1-10,"clarity":1-10,"b_concrete":1-10,"trap_quality":1-10},
  "overall_score": 1-10,
  "homophone_feedback": "Feedback zum Wortspiel",
  "items_feedback": [{"index":0,"text":"...","ok":true|false,"issue":"..."|null,"is_too_obvious":true|false}],
  "global_feedback": "...",
  "suggestions": ["..."]
}`;

export const REVIEW_PHASE2_PROMPT = `FAKTENCHECK Phase 2: {QUESTIONS}

Überprüfe jedes Element:
1. Antwort korrekt und verifizierbar?
2. Keine Mehrdeutigkeit (klar A, B oder Both)?
3. Kontraintuitive Antwort (nicht zu offensichtlich)?
4. Max. 4 Wörter?

Erwartete Verteilung: 5 A + 5 B + 2 Both

JSON:
{
  "setValid": true|false,
  "setReason": "Grund wenn ungültig",
  "itemReviews": [{"index":0,"text":"...","answer":"A","status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"too_easy"|null}],
  "summary": {"approved":10,"rejected":2,"rejectedIndices":[4,9]}
}`;

export const REGENERATE_PHASE2_ITEMS_PROMPT = `REGENERIERE {COUNT} Phase 2 Element(e)
Option A: {OPTION_A} | Option B: {OPTION_B}

Abgelehnt: {REJECTED_REASONS}
Verteilung: {NEEDED_A} A, {NEEDED_B} B, {NEEDED_BOTH} Both

Regeln: Fallen-Elemente (kontraintuitiv), max. 4 Wörter, verifizierbare Fakten

JSON: [{"text":"Element","answer":"A|B|Both","justification":"Warum","anecdote":"Lustiger/ungewöhnlicher Fakt"}]`;
