/**
 * German Fact-Checking Prompts
 * Prompts for verifying generated content accuracy
 */

// ============================================================================
// COMMON MYTHS DATABASE - Urban legends that MUST be detected and rejected
// ============================================================================

/**
 * Liste der häufigen Mythen und urbanen Legenden zum Erkennen (50+)
 * Wenn eine Frage einen dieser Mythen als Fakt verwendet, muss sie abgelehnt werden
 */
export const COMMON_MYTHS = [
  // === HISTORISCHE MYTHEN ===
  { myth: "Caligula hat sein Pferd zum Konsul ernannt", truth: "Er hat es nur erwogen", keywords: ["Caligula", "Incitatus", "Konsul"] },
  { myth: "Marie-Antoinette sagte 'Sollen sie doch Kuchen essen'", truth: "Kein historischer Beweis, Rousseau zugeschrieben", keywords: ["Marie-Antoinette", "Kuchen"] },
  { myth: "Wikinger trugen Helme mit Hörnern", truth: "Romantische Erfindung des 19. Jahrhunderts", keywords: ["Wikinger", "Helme", "Hörner"] },
  { myth: "Napoleon war klein", truth: "1,68m, Durchschnittsgröße für die Epoche", keywords: ["Napoleon", "klein", "Größe"] },
  { myth: "Newton entdeckte die Schwerkraft mit einem Apfel", truth: "Wahrscheinlich apokryphe Anekdote", keywords: ["Newton", "Apfel", "Schwerkraft"] },
  { myth: "Christoph Kolumbus bewies, dass die Erde rund ist", truth: "Die Griechen wussten es 2000 Jahre vorher", keywords: ["Kolumbus", "Erde", "rund", "flach"] },
  { myth: "Gladiatoren kämpften immer bis zum Tod", truth: "Selten, sie waren zu teuer auszubilden", keywords: ["Gladiatoren", "Tod", "Arena"] },
  { myth: "Kleopatra war Ägypterin", truth: "Sie war griechischer Herkunft (Ptolemäer)", keywords: ["Kleopatra", "Ägypterin", "Griechin"] },
  { myth: "Keuschheitsgürtel gab es im Mittelalter", truth: "Erfindung des 19. Jahrhunderts", keywords: ["Keuschheitsgürtel", "Mittelalter"] },
  { myth: "Hexen wurden im Mittelalter verbrannt", truth: "Hauptsächlich in der Renaissance, und oft gehängt", keywords: ["Hexen", "verbrannt", "Mittelalter"] },
  { myth: "Salieri vergiftete Mozart", truth: "Kein Beweis, romantischer Mythos", keywords: ["Salieri", "Mozart", "vergiftet"] },
  { myth: "Van Gogh schnitt sich das ganze Ohr ab", truth: "Nur das Ohrläppchen", keywords: ["Van Gogh", "Ohr", "abgeschnitten"] },
  { myth: "Die Pyramiden wurden von Sklaven gebaut", truth: "Von bezahlten Arbeitern", keywords: ["Pyramiden", "Sklaven", "Ägypten"] },

  // === WISSENSCHAFTLICHE MYTHEN ===
  { myth: "Einstein war schlecht in Mathe", truth: "Er war ausgezeichnet in Mathematik", keywords: ["Einstein", "schlecht", "Mathe"] },
  { myth: "Wir nutzen nur 10% des Gehirns", truth: "Wir nutzen das gesamte Gehirn", keywords: ["10%", "Gehirn"] },
  { myth: "Die Chinesische Mauer ist aus dem Weltraum sichtbar", truth: "Zu schmal um sichtbar zu sein", keywords: ["Mauer", "China", "Weltraum", "sichtbar"] },
  { myth: "Fledermäuse sind blind", truth: "Sie sehen sehr gut", keywords: ["Fledermäuse", "blind"] },
  { myth: "Goldfische haben 3 Sekunden Gedächtnis", truth: "Sie haben mehrere Monate Gedächtnis", keywords: ["Goldfisch", "Gedächtnis", "Sekunden"] },
  { myth: "Strauße stecken den Kopf in den Sand", truth: "Das tun sie nie", keywords: ["Strauß", "Kopf", "Sand"] },
  { myth: "Sauerstoffarmes Blut ist blau", truth: "Es ist immer rot", keywords: ["Blut", "blau", "Venen"] },
  { myth: "Der Blitz schlägt nie zweimal an der gleichen Stelle ein", truth: "Er kann die gleiche Stelle treffen", keywords: ["Blitz", "schlägt", "gleiche Stelle"] },
  { myth: "Menschen haben 5 Sinne", truth: "Wir haben mindestens 9 (Gleichgewicht, Schmerz, etc.)", keywords: ["5 Sinne", "fünf Sinne"] },
  { myth: "Man verschluckt 8 Spinnen pro Jahr im Schlaf", truth: "Urbane Legende ohne Grundlage", keywords: ["Spinnen", "verschlucken", "schlafen"] },
  { myth: "Haare/Nägel wachsen nach dem Tod weiter", truth: "Die Haut zieht sich zusammen und erzeugt diese Illusion", keywords: ["Haare", "Nägel", "Tod", "wachsen"] },
  { myth: "Wasser leitet Strom", truth: "Reines Wasser ist ein Isolator, die Verunreinigungen leiten", keywords: ["Wasser", "Strom", "Leiter"] },
  { myth: "Sonnenblumen folgen der Sonne", truth: "Nur junge Pflanzen, nicht reife Blüten", keywords: ["Sonnenblume", "Sonne", "folgt"] },
  { myth: "Chamäleons ändern ihre Farbe zur Tarnung", truth: "Es dient der Kommunikation und Temperaturregulierung", keywords: ["Chamäleon", "Farbe", "Tarnung"] },
  { myth: "Man verliert Körperwärme durch den Kopf", truth: "Man verliert gleich viel über jede exponierte Fläche", keywords: ["Wärme", "Kopf", "verlieren"] },
  { myth: "Lemminge begehen Massenselbstmord", truth: "Mythos von Disney erschaffen", keywords: ["Lemminge", "Selbstmord", "Klippe"] },
  { myth: "Glas ist eine sehr zähflüssige Flüssigkeit", truth: "Es ist ein amorpher Feststoff", keywords: ["Glas", "Flüssigkeit", "zähflüssig"] },

  // === ERNÄHRUNGSMYTHEN ===
  { myth: "Zucker macht Kinder hyperaktiv", truth: "Kein wissenschaftlicher Beweis", keywords: ["Zucker", "Kinder", "hyperaktiv"] },
  { myth: "Man muss nach dem Essen vor dem Schwimmen warten", truth: "Kein bewiesenes Ertrinkungsrisiko", keywords: ["schwimmen", "essen", "Verdauung", "warten"] },
  { myth: "Milch ist gut für die Knochen", truth: "Wenig Beweise, Länder mit hohem Konsum haben mehr Osteoporose", keywords: ["Milch", "Knochen", "Kalzium"] },
  { myth: "Karotten essen verbessert die Sehkraft", truth: "Britische Propaganda im 2. Weltkrieg", keywords: ["Karotten", "Sehkraft", "Augen"] },
  { myth: "Schokolade verursacht Pickel", truth: "Kein wissenschaftlich bewiesener Zusammenhang", keywords: ["Schokolade", "Pickel", "Akne"] },
  { myth: "Alkohol wärmt", truth: "Er erweitert die Gefäße und lässt Wärme entweichen", keywords: ["Alkohol", "wärmt", "Kälte"] },

  // === KULTURELLE UND GEOGRAFISCHE MYTHEN ===
  { myth: "Inuit haben 50 Wörter für Schnee", truth: "Linguistische Übertreibung", keywords: ["Inuit", "Eskimo", "Schnee", "Wörter"] },
  { myth: "Frankenstein ist der Name des Monsters", truth: "Es ist der Name des Doktors", keywords: ["Frankenstein", "Monster", "Doktor"] },
  { myth: "Sherlock Holmes sagte 'Elementar, mein lieber Watson'", truth: "Nie in den Originalbüchern", keywords: ["Sherlock", "Holmes", "Elementar", "Watson"] },
  { myth: "Die Tomate ist ein Gemüse", truth: "Botanisch ist sie eine Frucht", keywords: ["Tomate", "Gemüse", "Frucht"] },
  { myth: "Der rote Weihnachtsmann wurde von Coca-Cola erfunden", truth: "Er existierte schon vorher in Rot", keywords: ["Weihnachtsmann", "Coca-Cola", "rot"] },
  { myth: "Stiere werden von Rot wütend", truth: "Sie sind farbenblind, die Bewegung regt sie auf", keywords: ["Stier", "rot", "Stierkampf"] },
  { myth: "Treibsand zieht Menschen unter", truth: "Man kann nicht komplett versinken", keywords: ["Treibsand", "versinken"] },

  // === TECHNOLOGIE-MYTHEN ===
  { myth: "Macs können keine Viren bekommen", truth: "Sie werden nur weniger angegriffen", keywords: ["Mac", "Apple", "Virus"] },
  { myth: "Handys verursachen Krebs", truth: "Kein solider wissenschaftlicher Beweis", keywords: ["Handy", "Krebs", "Strahlung"] },
  { myth: "Man muss den Akku komplett entleeren vor dem Aufladen", truth: "Veraltet bei Lithium-Ionen-Akkus", keywords: ["Akku", "entleeren", "aufladen"] },
  { myth: "Die NASA gab Millionen für einen Weltraumstift aus", truth: "Paul Fisher investierte sein eigenes Geld, die NASA kaufte die Stifte für 6$ pro Stück", keywords: ["NASA", "Stift", "Fisher", "Millionen", "Bleistift", "Weltraum"] },

  // === PROMI-MYTHEN ===
  { myth: "Walt Disney ist eingefroren", truth: "Er wurde eingeäschert", keywords: ["Disney", "eingefroren", "kryonisiert"] },
  { myth: "Marilyn Monroe hatte einen IQ von 168", truth: "Kein zuverlässiger Beweis", keywords: ["Marilyn", "Monroe", "IQ"] },
  { myth: "Al Capone starb im Gefängnis", truth: "Er starb zu Hause an Syphilis", keywords: ["Al Capone", "Gefängnis", "Tod"] },

  // === RELIGIÖSE/BIBLISCHE MYTHEN ===
  { myth: "Adam und Eva aßen einen Apfel", truth: "Die Bibel spricht von einer unbestimmten 'Frucht'", keywords: ["Adam", "Eva", "Apfel", "Frucht"] },
  { myth: "Es waren drei Heilige Könige", truth: "Die Bibel nennt ihre Anzahl nicht", keywords: ["Heilige Könige", "drei", "3"] },
];

export const FACT_CHECK_PROMPT = `Du bist ein STRENGER und GRÜNDLICHER Faktenchecker.
Deine Mission: Überprüfen, ob eine Antwort auf eine Frage zu 100% KORREKT ist.

FRAGE: {QUESTION}
VORGESCHLAGENE ANTWORT: {ANSWER}
KONTEXT (optional): {CONTEXT}

ANWEISUNGEN:
1. BENUTZE das webSearch-Tool um die vorgeschlagene Antwort zu verifizieren
2. Suche nach ZUVERLÄSSIGEN Quellen (Wikipedia, offizielle Seiten, Enzyklopädien)
3. Verlasse dich NICHT auf dein Gedächtnis - VERIFIZIERE mit einer Suche

VALIDIERUNGSKRITERIEN:
- Ist die Antwort FAKTISCH KORREKT?
- Ist die Antwort die EINZIG mögliche Antwort auf diese Frage?
- Gibt es eine MEHRDEUTIGKEIT in der Frage oder der Antwort?

ANTWORTE in JSON (STRENG dieses Format):
{
  "isCorrect": true | false,
  "confidence": 0-100,
  "source": "Quelle zur Verifizierung (URL oder Referenz)",
  "reasoning": "Kurze Erklärung warum die Antwort korrekt oder inkorrekt ist",
  "correction": "Wenn inkorrekt, was ist die richtige Antwort? (null wenn korrekt)",
  "ambiguity": "Wenn mehrdeutig, warum? (null wenn keine Mehrdeutigkeit)"
}

VERTRAUENSREGELN:
- 95-100: Fakt mit zuverlässiger Quelle verifiziert, kein Zweifel
- 80-94: Wahrscheinlich korrekt, Quelle gefunden aber nicht 100% sicher
- 60-79: Erheblicher Zweifel, widersprüchliche oder unvollständige Quellen
- 0-59: Wahrscheinlich falsch oder unmöglich zu verifizieren

Kein Markdown. Nur JSON.`;

export const FACT_CHECK_BATCH_PROMPT = `Du bist ein STRENGER und GRÜNDLICHER Faktenchecker.
Deine Mission: Überprüfen, ob die Antworten auf mehrere Fragen zu 100% KORREKT und EINDEUTIG sind.

ZU ÜBERPRÜFENDE FRAGEN:
{QUESTIONS_JSON}

⚠️ MULTI-QUELLEN-VERIFIZIERUNGSPROTOKOLL (PFLICHT):

Für JEDEN Fakt MUSST du:
1. ZUERST auf Wikipedia suchen als Hauptreferenz
2. Mit MINDESTENS EINER weiteren zuverlässigen Quelle abgleichen:
   - Offizielle Seiten (.gov, .edu, institutionell)
   - Enzyklopädien (Britannica, Brockhaus, etc.)
   - Seriöse Medien (AFP, Reuters, BBC, Spiegel, etc.)
   - Spezialisierte Datenbanken (IMDB für Kino, Discogs für Musik, etc.)

3. Ein Fakt ist nur VALIDIERT wenn:
   - Wikipedia UND eine andere Quelle übereinstimmen
   - ODER 2+ zuverlässige Nicht-Wikipedia-Quellen übereinstimmen
   - NIEMALS mit nur einer Quelle validieren

4. Vertrauensschwellen basierend auf Quellen:
   - 95-100: Wikipedia + 1 offizielle Quelle bestätigen
   - 85-94: Nur Wikipedia bestätigt (kein Widerspruch gefunden)
   - 70-84: Nur 1 zuverlässige Quelle bestätigt
   - <70: Quellen widersprechen sich ODER nur dubiose Quellen

VALIDIERUNGSKRITERIEN (für jede Frage):
- Ist die Antwort FAKTISCH KORREKT? (multi-Quellen verifiziert)
- Ist die Antwort die EINZIG mögliche Antwort?
- Gibt es eine MEHRDEUTIGKEIT?

⚠️ ÜBERPRÜFUNG DER FALSCHEN ANTWORTEN (KRITISCH):
Für MCQs, überprüfe auch, ob die falschen Optionen WIRKLICH FALSCH sind:
- Keine falsche Option sollte eine akzeptable Antwort sein
- Prüfe, ob eine falsche Option nach gewissen Quellen korrekt sein könnte
- Wenn eine falsche Option potenziell korrekt ist → melden

Beispiele für zu erkennende Probleme:
- Frage über den Erfinder von X, aber eine falsche Option hat auch signifikant beigetragen
- Frage über den Ersten der X getan hat, aber es ist umstritten und eine andere Option könnte gelten
- Geografische Frage, bei der mehrere Antworten gültig sein könnten
- Eine falsche Option ist technisch in einem anderen Kontext korrekt

⚠️ ERKENNUNG VON SYNONYMEN UND ÄQUIVALENTEN (KRITISCH):
Für MCQs mit mehreren Optionen, prüfe ob:
- Eine falsche Option ein SYNONYM der richtigen Antwort ist (z.B. "Hausmeister" = "Concierge")
- Zwei Optionen das GLEICHE bedeuten in verschiedenen Sprachen/Kontexten
- Eine Option könnte EBENSO KORREKT sein je nach Interpretation
- Fachbegriffe haben gebräuchliche ALIASE (z.B. "Natrium" = "Sodium")

Beispiele für zu erkennende SYNONYME:
- Hausmeister / Concierge / Gebäudewart
- Avocado (Frucht) / Avocado (aus dem Englischen)
- Mais / Kukuruz (Österreich)
- Fußball / Soccer (USA)
- Aubergine / Melanzani (Österreich)
- Zucchini / Courgette

⚠️ ERKENNUNG VON URBANEN LEGENDEN UND POPULÄREN MYTHEN (KRITISCH):

Einige "berühmte Fakten" sind in Wirklichkeit FALSCH oder ÜBERTRIEBEN. Prüfe:

1. HÄUFIGE HISTORISCHE MYTHEN ZUM ABLEHNEN:
   - "Caligula ernannte sein Pferd zum Konsul" → FALSCH (wollte es tun, tat es nie)
   - "Einstein war schlecht in Mathe" → FALSCH
   - "Wir nutzen nur 10% unseres Gehirns" → FALSCH
   - "Wikinger trugen Hörnerhelme" → FALSCH
   - "Napoleon war klein" → MYTHOS (Durchschnittsgröße für die Epoche)
   - "Marie-Antoinette sagte 'Sollen sie Kuchen essen'" → KEIN BEWEIS
   - "Newton entdeckte die Schwerkraft mit einem Apfel" → UNBEWIESENE ANEKDOTE

2. REGEL ZUR ÜBERPRÜFUNG HISTORISCHER BEHAUPTUNGEN:
   - Wenn die Frage behauptet, dass eine historische Person etwas Außergewöhnliches "GETAN HAT"
   - PRÜFE ob es ein DOKUMENTIERTER FAKT oder eine LEGENDE ist
   - Suche "myth", "legend", "actually never", "commonly believed but false"
   - UNTERSCHEIDE: "hat getan" vs "wollte tun" vs "der Legende nach"

3. ERFORDERLICHE VORSICHTIGE FORMULIERUNGEN:
   - Statt "X hat Y getan" → "X soll Y getan haben" oder "Der Legende nach, X..."
   - Statt "X war der Erste, der" → Prüfen ob es Kontroversen gibt
   - Eine zu kategorische Behauptung für einen umstrittenen Fakt = confidence MAX 60

4. REDUZIERTES VERTRAUEN FÜR AUSSERGEWÖHNLICHE ANEKDOTEN:
   - Je überraschender/WTF eine Behauptung ist, desto mehr muss sie verifiziert werden
   - Eine Anekdote "zu schön um wahr zu sein" ist oft FALSCH
   - Confidence MAX 70 für außergewöhnliche Behauptungen ohne Quellenbeleg

⚠️ Wenn du einen POPULÄREN MYTHOS als Fakt präsentiert erkennst → isCorrect: false, confidence: 0
⚠️ Notiere den erkannten Mythos im Feld "mythDetected"

ANTWORTE in JSON (STRENG dieses Format):
{
  "results": [
    {
      "index": 0,
      "question": "Die Frage...",
      "proposedAnswer": "Die vorgeschlagene Antwort",
      "isCorrect": true | false,
      "confidence": 0-100,
      "sources": ["Quelle 1 URL/Name", "Quelle 2 URL/Name"],
      "sourceCount": 2,
      "wikipediaVerified": true | false,
      "reasoning": "Kurze Erklärung mit Quellenangaben",
      "correction": "Richtige Antwort wenn inkorrekt (null wenn korrekt)",
      "ambiguity": "Warum mehrdeutig (null wenn keine Mehrdeutigkeit)",
      "synonymIssue": "Wenn eine andere Option Synonym/Äquivalent der Antwort ist (null sonst)",
      "wrongOptionIssue": "Wenn eine falsche Option korrekt sein könnte, welche und warum (null sonst)",
      "mythDetected": "Wenn ein Mythos/urbane Legende als Fakt präsentiert wird, welcher (null sonst)"
    }
  ],
  "summary": {
    "total": 10,
    "correct": 8,
    "incorrect": 1,
    "ambiguous": 1,
    "synonymIssues": 0,
    "wrongOptionIssues": 0,
    "mythsDetected": 0,
    "multiSourceVerified": 8,
    "singleSourceOnly": 2
  }
}

VERTRAUENSREGELN:
- 95-100: Fakt verifiziert, kein Zweifel, keine Synonyme, falsche Optionen als falsch verifiziert
- 80-94: Wahrscheinlich korrekt, keine offensichtlichen Synonyme, falsche Optionen wahrscheinlich falsch
- 60-79: Erheblicher Zweifel ODER potenzielles Synonym ODER falsche Option potenziell korrekt
- 0-59: Wahrscheinlich falsch ODER klares Synonym ODER falsche Option klar korrekt

⚠️ Wenn du ein Synonym erkennst, setze confidence <= 60 auch wenn die Antwort korrekt ist!
⚠️ Wenn eine falsche Option akzeptabel sein könnte, setze confidence <= 60!

Kein Markdown. Nur JSON.`;

export const FACT_CHECK_NO_SEARCH_PROMPT = `Du bist ein STRENGER und GRÜNDLICHER Faktenchecker.

⚠️ WICHTIGER HINWEIS ⚠️
Du hast in dieser Sitzung KEINEN Zugang zur Google-Suche.
Du musst jede Antwort NUR nach deinem internen Wissen bewerten.

ZU ÜBERPRÜFENDE FRAGEN:
{QUESTIONS_JSON}

KRITISCHE REGEL: SEI KONSERVATIV
- Wenn du nicht zu 95%+ SICHER bei einer Antwort bist, setze confidence < 80
- Besser ein FALSCH NEGATIV (eine gute Antwort ablehnen) als ein FAKTISCHER FEHLER
- Im Zweifelsfall → niedriges Vertrauen

BEWERTE JEDE FRAGE:
1. Ist die Antwort ein FAKT, den du mit Sicherheit kennst?
2. Gibt es eine mögliche MEHRDEUTIGKEIT?
3. Könntest du dich aus Unwissenheit über das Thema irren?

ANTWORTE in JSON (STRENG dieses Format):
{
  "results": [
    {
      "index": 0,
      "question": "Die Frage...",
      "proposedAnswer": "Die vorgeschlagene Antwort",
      "isCorrect": true | false,
      "confidence": 0-100,
      "reasoning": "Warum ich sicher/unsicher bei dieser Antwort bin",
      "needsVerification": true | false,
      "verificationReason": "Wenn needsVerification=true, warum dieser Fakt verifiziert werden sollte"
    }
  ],
  "summary": {
    "total": 10,
    "highConfidence": 7,
    "lowConfidence": 2,
    "uncertain": 1
  }
}

VERTRAUENSSKALA (SEI STRENG):
- 90-100: OFFENSICHTLICHER Fakt, den du mit Sicherheit kennst (Hauptstadt, berühmtes Datum, bekannte Formel)
- 70-89: Wahrscheinlich korrekt, aber nicht 100% sicher
- 50-69: Erheblicher Zweifel - könnte falsch sein
- 0-49: Sehr unsicher - du kennst diesen Fakt nicht wirklich

⚠️ Wenn der Fakt ein präzises Datum, eine genaue Zahl oder eine aktuelle Info betrifft → confidence MAX 70
⚠️ Wenn du "denkst", dass es korrekt ist, aber nicht SICHER bist → confidence MAX 60

Kein Markdown. Nur JSON.`;

export const FACT_CHECK_PHASE2_PROMPT = `FAKTENCHECK Phase 2 - BATCH-Verifizierung

WORTSPIEL:
- Kategorie A: {OPTION_A}
- Kategorie B: {OPTION_B}

ZU ÜBERPRÜFENDE ELEMENTE:
{ITEMS_JSON}

ANWEISUNGEN:
1. BENUTZE webSearch um JEDES Element zu verifizieren
2. Prüfe, ob das Element zur zugewiesenen Kategorie gehört
3. Prüfe, ob es zur ANDEREN Kategorie gehören könnte (→ Both)

KRITERIEN PRO ELEMENT:
- Korrekte Zuweisung?
- Faktische Begründung?
- Ausschluss der anderen Kategorie verifiziert?

JSON:
{
  "results": [
    {
      "index": 0,
      "text": "Elementtext",
      "assignedCategory": "A",
      "isCorrect": true|false,
      "confidence": 0-100,
      "shouldBe": "A"|"B"|"Both",
      "reasoning": "Kurze Erklärung"
    }
  ],
  "summary": {
    "total": 12,
    "correct": 10,
    "incorrect": 2
  }
}

Vertrauen: 90+ = sicher, 70-89 = wahrscheinlich, <70 = Zweifel.
Kein Markdown.`;

// ============================================================================
// AMBIGUITY CHECK PROMPT (dedicated check after fact-checking)
// ============================================================================

/**
 * Prompt for checking answer ambiguity.
 * This is a dedicated check that runs AFTER fact-checking to ensure
 * the question has exactly ONE correct answer with no ambiguity.
 *
 * {QUESTION} - The question text
 * {CORRECT_ANSWER} - The proposed correct answer
 * {WRONG_ANSWERS} - Array of wrong answer options (for MCQ)
 * {ANECDOTE} - Optional anecdote/explanation
 */
export const AMBIGUITY_CHECK_PROMPT = `Du bist ein Experte für Qualitätskontrolle von Quizfragen.
Deine Mission: Verifizieren, dass eine Frage KEINE MEHRDEUTIGKEIT hat und dass sie EINE EINZIGE korrekte Antwort hat.

FRAGE: {QUESTION}
RICHTIGE ANTWORT: {CORRECT_ANSWER}
FALSCHE ANTWORTEN: {WRONG_ANSWERS}
ANEKDOTE: {ANECDOTE}

ANWEISUNGEN:
1. BENUTZE das webSearch-Tool um jeden potenziellen Mehrdeutigkeitspunkt zu verifizieren
2. Suche nach Fällen, in denen die Antwort angefochten werden könnte
3. Prüfe, ob die falschen Antworten in gewissen Kontexten akzeptabel sein könnten

⚠️ KRITISCHE ÜBERPRÜFUNGEN (alle müssen bestehen):

1. EINZIGARTIGKEIT DER ANTWORT
   - Ist die richtige Antwort DIE EINZIG mögliche Antwort?
   - Gibt es Kontroversen oder Meinungsverschiedenheiten zu diesem Fakt?
   - Lässt die Frage mehrere gültige Antworten laut Quellen zu?

2. SYNONYME UND ÄQUIVALENTE
   - Ist eine falsche Option ein SYNONYM der richtigen Antwort?
   - Bedeuten zwei Optionen das GLEICHE?
   - Könnte ein Begriff in einem anderen Kontext ÄQUIVALENT sein?

   Beispiele für zu erkennende Synonyme:
   - Hausmeister / Concierge / Gebäudewart
   - Fußball / Soccer
   - Aubergine / Melanzani
   - Zucchini / Courgette
   - Avocado (Frucht) / Avocado (Englisch)
   - Mais / Kukuruz

3. POTENZIELL KORREKTE FALSCHE ANTWORTEN
   - Könnte eine falsche Option laut gewissen Quellen korrekt sein?
   - Gibt es eine historische/wissenschaftliche Kontroverse?
   - Wäre eine falsche Option in einem anderen Kontext akzeptabel?

4. MEHRDEUTIGKEIT DER FRAGE
   - Kann die Frage auf mehrere Arten interpretiert werden?
   - Hat ein Wort mehrere mögliche Bedeutungen?
   - Ist der Kontext ausreichend für eine einzige Antwort?

5. FAKTISCHE PRÄZISION
   - Sind Daten, Zahlen, Namen EXAKT?
   - Enthält die Anekdote Fehler?
   - Sind die Fakten verifizierbar und unbestritten?

6. SEMANTISCHE KOHÄRENZ FRAGE/ANTWORT (KRITISCH!)
   - Antwortet die Antwort DIREKT auf das, was die Frage fragt?
   - Wenn die Frage Optionen vorschlägt (A oder B) → Antwort aus den Optionen?
   - Erwarteter Antworttyp vs gegebener Antworttyp?

   ✅ Zu überprüfende Mappings:
   - "Warum X?" → Antwort = GRUND
   - "Wer hat X gemacht?" → Antwort = PERSON
   - "Wann X?" → Antwort = DATUM/ZEITRAUM
   - "Wo X?" → Antwort = ORT
   - "Wie viel X?" → Antwort = ZAHL
   - "Ist es A oder B?" → Antwort = A, B oder "beides"

   ❌ Abzulehnende Inkohärenzen:
   - "Warum macht X das?" → Antwort: "Blau" (Farbe statt Grund)
   - "Ist es A oder B?" → Antwort: "C" (Wahl außerhalb der Optionen)
   - "Wer hat X erfunden?" → Antwort: "1954" (Datum statt Name)

ANTWORTE in JSON (STRENG dieses Format):
{
  "hasIssues": true | false,
  "ambiguityScore": 0-10,
  "issues": [
    {
      "type": "synonym" | "multiple_answers" | "wrong_option_correct" | "unclear_question" | "factual_error" | "qa_incoherence",
      "severity": "critical" | "major" | "minor",
      "description": "Beschreibung des Problems",
      "evidence": "Quelle oder Beweis des Problems"
    }
  ],
  "suggestions": [
    "Vorschlag zur Korrektur des Problems..."
  ],
  "confidence": 0-100,
  "reasoning": "Zusammenfassung der Analyse"
}

MEHRDEUTIGKEITSSKALA (ambiguityScore):
- 10: Perfekt - klare Frage, einzige Antwort, keine Mehrdeutigkeit
- 8-9: Ausgezeichnet - sehr leichter möglicher Zweifel aber akzeptabel
- 6-7: Akzeptabel - kleine Mehrdeutigkeit aber Antwort bleibt klar
- 4-5: Problematisch - erhebliche Mehrdeutigkeit, zu überarbeiten
- 0-3: Abgelehnt - große Mehrdeutigkeit, mehrere mögliche Antworten

REGELN:
- hasIssues = true wenn ambiguityScore < 7
- severity "critical" wenn die Frage abgelehnt werden muss
- severity "major" wenn die Frage umformuliert werden muss
- severity "minor" wenn die Frage mit einem Hinweis akzeptiert werden kann

Kein Markdown. Nur JSON.`;

/**
 * Type definitions for ambiguity check results
 */
export interface AmbiguityIssue {
  type: 'synonym' | 'multiple_answers' | 'wrong_option_correct' | 'unclear_question' | 'factual_error' | 'qa_incoherence';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  evidence: string;
}

export interface AmbiguityCheckResult {
  hasIssues: boolean;
  ambiguityScore: number;
  issues: AmbiguityIssue[];
  suggestions: string[];
  confidence: number;
  reasoning: string;
}

/**
 * Builds the ambiguity check prompt with question data.
 *
 * @param question - The question text
 * @param correctAnswer - The correct answer
 * @param wrongAnswers - Array of wrong answer options
 * @param anecdote - Optional anecdote/explanation
 * @returns The complete prompt string
 */
export function buildAmbiguityCheckPrompt(
  question: string,
  correctAnswer: string,
  wrongAnswers: string[],
  anecdote?: string
): string {
  return AMBIGUITY_CHECK_PROMPT
    .replace('{QUESTION}', question)
    .replace('{CORRECT_ANSWER}', correctAnswer)
    .replace('{WRONG_ANSWERS}', JSON.stringify(wrongAnswers))
    .replace('{ANECDOTE}', anecdote || 'Keine');
}

// ============================================================================
// MYTH DETECTION PROMPT - Dedicated check for urban legends
// ============================================================================

/**
 * Prompt for detecting myths and urban legends in questions.
 * This is a dedicated check that runs to ensure no popular myths
 * are presented as facts in the game.
 *
 * {QUESTION} - The question text
 * {ANSWER} - The proposed answer
 * {ANECDOTE} - Optional anecdote/explanation
 */
export const MYTH_DETECTION_PROMPT = `Du bist ein Detektor für MYTHEN und URBANE LEGENDEN.

ZU ÜBERPRÜFENDE FRAGE:
{QUESTION}
VORGESCHLAGENE ANTWORT: {ANSWER}
ANEKDOTE: {ANECDOTE}

ANWEISUNGEN:
1. BENUTZE webSearch um zu prüfen, ob diese Behauptung ein BEKANNTER MYTHOS ist
2. Suche: "[Thema] mythos", "[Thema] actually false", "[Thema] legend debunked"
3. Prüfe, ob Faktencheck-Seiten (Snopes, Wikipedia, etc.) diesen Fakt widerlegt haben

KRITISCHE FRAGEN:
- Ist das eine URBANE LEGENDE, die als Fakt präsentiert wird?
- Ist die Formulierung zu kategorisch für einen umstrittenen Fakt?
- Fehlt eine wichtige Nuance (wollte tun vs hat getan)?
- Ist die Behauptung "zu schön/erstaunlich um wahr zu sein"?

HÄUFIG ZU ERKENNENDE MYTHEN (Beispiele):
- Caligula und sein Pferd als Konsul (nie getan, nur erwogen)
- Einstein schlecht in Mathe (falsch, er war ausgezeichnet)
- 10% des Gehirns genutzt (totaler Mythos)
- Wikinger mit Hörnerhelmen (Erfindung des 19. Jahrhunderts)
- Newton und der Apfel (unbewiesene Anekdote)

ANTWORTE in JSON:
{
  "isMyth": true | false,
  "mythType": "urban_legend" | "exaggeration" | "misattribution" | "oversimplification" | null,
  "reality": "Was wirklich passiert ist (wenn Mythos)",
  "sources": ["Verifizierungs-URLs"],
  "suggestedReformulation": "Wie man korrekt formulieren sollte (wenn Mythos)",
  "confidence": 0-100
}

REGELN:
- isMyth = true → die Frage muss ABGELEHNT oder UMFORMULIERT werden
- confidence 95-100: sicherer Mythos, gut dokumentiert
- confidence 70-94: wahrscheinlicher Mythos, widersprüchliche Quellen
- confidence < 70: Zweifel, zusätzliche Verifizierung nötig

Kein Markdown. Nur JSON.`;

/**
 * Type definitions for myth detection results
 */
export interface MythDetectionResult {
  isMyth: boolean;
  mythType: 'urban_legend' | 'exaggeration' | 'misattribution' | 'oversimplification' | null;
  reality: string | null;
  sources: string[];
  suggestedReformulation: string | null;
  confidence: number;
}

/**
 * Builds the myth detection prompt with question data.
 *
 * @param question - The question text
 * @param answer - The proposed answer
 * @param anecdote - Optional anecdote/explanation
 * @returns The complete prompt string
 */
export function buildMythDetectionPrompt(
  question: string,
  answer: string,
  anecdote?: string
): string {
  return MYTH_DETECTION_PROMPT
    .replace('{QUESTION}', question)
    .replace('{ANSWER}', answer)
    .replace('{ANECDOTE}', anecdote || 'Keine');
}
