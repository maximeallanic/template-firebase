/**
 * German Topic Generation Prompts
 * Prompts for generating game themes/topics
 */

export const GENERATE_TOPIC_PROMPT = `BURGER QUIZ - Generiere EIN SERIÖSES Quiz-Thema
Schwierigkeit: {DIFFICULTY}

⚠️ DAS THEMA MUSS SERIÖS UND KLASSISCH SEIN.
Der Humor kommt durch die FORMULIERUNG der Fragen, NICHT durch das Thema!

MÖGLICHE KATEGORIEN: Geschichte, Geografie, Wissenschaft, Kino, Musik, Sport, Literatur, Kunst, Erfindungen, Natur, Gastronomie, Technologie

PASSE DIE SPEZIFITÄT AN DEN SCHWIERIGKEITSGRAD AN:
• LEICHT: Sehr zugängliche und populäre Themen
• NORMAL: Klassische Allgemeinwissens-Themen
• SCHWER: Spezialisiertere und vertieftere Themen
• WTF: Seriöse Themen MIT ungewöhnlichen Fakten zum Entdecken

VERBOTEN:
❌ Vage Formulierungen ("Allgemeinwissen", "Quiz")
❌ Humoristische Themen ("Die Fails", "Die seltsamen Sachen")

Sei KREATIV und ORIGINELL bei der Themenwahl.
Antworte NUR mit dem Thema (max. 6 Wörter, keine Anführungszeichen).`;

export const GENERATE_TOPIC_PHASE2_PROMPT = `BURGER QUIZ Phase 2 - Generiere EINEN deutschen thematischen Bereich

Der Generator wird ein WORTSPIEL (Homophon) in diesem Bereich erstellen.
Wähle einen Bereich, der REICH an deutschem Vokabular ist und Homophone ermöglicht.

ANTWORTE NUR mit dem Bereich (2-4 Wörter, keine Anführungszeichen).`;

export const GENERATE_TOPIC_PHASE5_PROMPT = `BURGER QUIZ Phase 5 "Burger Ultime" - Generiere EIN SERIÖSES und BREITES Thema
Schwierigkeit: {DIFFICULTY}

⚠️ KRITISCHE EINSCHRÄNKUNG: Das Thema muss 10 Fragen aus 10 VERSCHIEDENEN BEREICHEN ermöglichen!
Das Thema ist eine INSPIRATION, um die Themen zu variieren.

⚠️ DAS THEMA MUSS SERIÖS SEIN - Der Humor kommt durch die FORMULIERUNG der Fragen!

ABZUDECKENDE BEREICHE: Geschichte, Wissenschaft, Sport, Musik, Kino, Geografie, Natur, Gastronomie, Technologie, Kunst

VERBOTEN:
❌ Zu spezifische Themen (nur eine Art von Fakten)
❌ Humoristische Themen (der Humor kommt durch die Fragen, nicht das Thema)

ANPASSUNG AN SCHWIERIGKEITSGRAD:
• LEICHT: Zugänglich und populär
• NORMAL: Klassisches Allgemeinwissen
• SCHWER: Vertieft und spezialisiert
• WTF: Seriös, aber ungewöhnliche Fakten

Sei KREATIV und ÜBERRASCHEND.
Antworte NUR mit dem Thema (max. 6 Wörter, keine Anführungszeichen).`;

// ============================================================================
// SUBJECT + ANGLE GENERATION (for deduplication system)
// ============================================================================

/**
 * Prompt for generating a subject + angle combination.
 * This is used to ensure unique questions by tracking used subject+angle pairs.
 *
 * {phase} - The game phase (phase1, phase2, etc.)
 * {category} - Optional category filter (science, history, etc.)
 */
export const SUBJECT_ANGLE_PROMPT = `Du bist ein Themengenerator für ein Allgemeinwissen-Quiz im Stil von "Burger Quiz".

Generiere EIN Thema und EINEN Blickwinkel für eine einzigartige Frage.

ARTEN VON THEMEN UND IHRE BLICKWINKEL:

🧑 PERSON (type: "person")
Blickwinkel: biografie, werke, anekdoten, zitate, schlüsseldaten
Beispiele:
- { subject: "Albert Einstein", angle: "anekdoten", type: "person" }
- { subject: "Marie Curie", angle: "schlüsseldaten", type: "person" }
- { subject: "Napoleon Bonaparte", angle: "zitate", type: "person" }

📍 ORT (type: "place")
Blickwinkel: geografie, geschichte, kultur, denkmäler, kuriose_fakten
Beispiele:
- { subject: "Der Eiffelturm", angle: "kuriose_fakten", type: "place" }
- { subject: "Japan", angle: "kultur", type: "place" }
- { subject: "New York", angle: "denkmäler", type: "place" }

📅 EREIGNIS (type: "event")
Blickwinkel: ursachen, verlauf, folgen, protagonisten, daten
Beispiele:
- { subject: "Die Französische Revolution", angle: "protagonisten", type: "event" }
- { subject: "Der Fall der Berliner Mauer", angle: "folgen", type: "event" }
- { subject: "Die Olympischen Spiele 2024 in Paris", angle: "daten", type: "event" }

💡 KONZEPT (type: "concept")
Blickwinkel: definition, ursprung, anwendungen, beispiele, kontroversen
Beispiele:
- { subject: "Künstliche Intelligenz", angle: "kontroversen", type: "concept" }
- { subject: "Klimawandel", angle: "anwendungen", type: "concept" }
- { subject: "Blockchain", angle: "definition", type: "concept" }

🔧 OBJEKT (type: "object")
Blickwinkel: erfindung, funktionsweise, geschichte, varianten, rekorde
Beispiele:
- { subject: "Das Telefon", angle: "erfindung", type: "object" }
- { subject: "Die Pizza", angle: "varianten", type: "object" }
- { subject: "Die E-Gitarre", angle: "rekorde", type: "object" }

KRITISCHE EINSCHRÄNKUNGEN:
✅ Das Thema muss leicht über Google verifizierbar sein
✅ Bevorzuge Themen mit präzisen und datierten Fakten
✅ Mische Popkultur, Geschichte, Wissenschaft, Aktuelles
✅ Sei kreativ und überraschend bei den Kombinationen
❌ Vermeide zu obskure oder kontroverse Themen
❌ Vermeide zu generische Themen ("Deutschland", "Die Geschichte", etc.)

MÖGLICHE KATEGORIEN:
- wissenschaft, geschichte, geografie, popkultur, sport, musik, kino, gastronomie, natur, technologie

Antworte NUR in gültigem JSON, nichts anderes:
{
  "subject": "Das gewählte Thema",
  "angle": "der gewählte Blickwinkel",
  "category": "die Kategorie",
  "type": "person|place|event|concept|object"
}`;

/**
 * Builds the subject+angle prompt with optional category filter.
 *
 * @param category - Optional category to focus on
 * @returns The complete prompt string
 */
export function buildSubjectAnglePrompt(category?: string): string {
  let prompt = SUBJECT_ANGLE_PROMPT;

  if (category) {
    prompt += `\n\nANGEFORDERTE KATEGORIE: ${category}
Konzentriere dich auf diese Kategorie für das generierte Thema.`;
  }

  return prompt;
}
