/**
 * Phase-specific validators for submitAnswer (#81)
 *
 * Each validator handles the specific rules for its phase:
 * - P1/P4: MCQ index comparison
 * - P2: Binary choice (A/B/Both)
 * - P3/P5: LLM fuzzy matching (delegated to answerValidator)
 */

import { admin } from '../../config/firebase';
import { validateAnswer } from '../../services/answerValidator';
import type {
  Team,
  Phase1AnswerPrivate,
  Phase2SetAnswerPrivate,
  Phase3ThemeAnswerPrivate,
  Phase4AnswerPrivate,
  Phase5AnswerPrivate,
  Phase1RevealedAnswer,
  Phase2RevealedAnswer,
  Phase2TeamAnswerRevealed,
  Phase3RevealedAnswer,
  Phase4RevealedAnswer,
  Phase5RevealedAnswer,
} from '../../types/secureGameTypes';

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface ValidationResultBase {
  isCorrect: boolean;
  shouldReveal: boolean; // Whether to reveal correct answer to all
  explanation?: string;
}

export interface Phase1ValidationResult extends ValidationResultBase {
  isFirst: boolean;
  correctIndex: number;
}

export interface Phase2ValidationResult extends ValidationResultBase {
  correctAnswer: 'A' | 'B' | 'Both';
  teamComplete: boolean;
  bothTeamsAnswered: boolean;
}

export interface Phase3ValidationResult extends ValidationResultBase {
  expectedAnswer: string;
  confidence: number;
}

export interface Phase4ValidationResult extends ValidationResultBase {
  correctIndex: number;
  allowRebond: boolean; // If incorrect, allow other team to answer
}

export interface Phase5ValidationResult extends ValidationResultBase {
  expectedAnswer: string;
  confidence: number;
}

// ============================================================================
// PHASE 1 - Tenders (Speed MCQ)
// ============================================================================

/**
 * Validates Phase 1 MCQ answer
 * Rules:
 * - First correct answer wins the round
 * - Reveal to all after first correct
 */
export async function validatePhase1Answer(
  roomId: string,
  questionIndex: number,
  answer: number,
  playerId: string,
  playerName: string,
  playerTeam: Team,
  answers: Phase1AnswerPrivate[],
  basePath: string
): Promise<Phase1ValidationResult> {
  const db = admin.database();
  const correctAnswer = answers[questionIndex];

  if (!correctAnswer) {
    return {
      isCorrect: false,
      shouldReveal: false,
      isFirst: false,
      correctIndex: -1,
      explanation: 'Question not found',
    };
  }

  const isCorrect = answer === correctAnswer.correctIndex;

  // Check if someone already won this round
  const revealedRef = db.ref(`${basePath}/revealedAnswers/phase1/${questionIndex}`);
  const revealedSnap = await revealedRef.once('value');
  const alreadyRevealed = revealedSnap.exists();

  // Only first correct answer wins
  const isFirst = isCorrect && !alreadyRevealed;

  // Reveal after first correct answer
  if (isFirst) {
    const revealed: Phase1RevealedAnswer = {
      correctIndex: correctAnswer.correctIndex,
      winnerId: playerId,
      winnerName: playerName,
      winnerTeam: playerTeam,
      revealedAt: Date.now(),
    };
    await revealedRef.set(revealed);
  }

  return {
    isCorrect,
    shouldReveal: isFirst || alreadyRevealed,
    isFirst,
    correctIndex: isCorrect ? correctAnswer.correctIndex : -1,
    explanation: isFirst ? 'First correct answer!' : undefined,
  };
}

// ============================================================================
// PHASE 2 - Sucré Salé (Binary Choice)
// ============================================================================

/**
 * Validates Phase 2 binary choice answer
 * Rules:
 * - Reveal to team when first team member answers
 * - Reveal correct answer when both teams have answered
 */
export async function validatePhase2Answer(
  roomId: string,
  questionIndex: number,
  answer: 'A' | 'B' | 'Both',
  playerId: string,
  playerName: string,
  playerTeam: Team,
  setIndex: number, // Which set we're on (if multiple sets)
  answers: Phase2SetAnswerPrivate | Phase2SetAnswerPrivate[],
  basePath: string
): Promise<Phase2ValidationResult> {
  const db = admin.database();

  // Get the correct answer for this item
  const answerSet = Array.isArray(answers) ? answers[setIndex] : answers;
  const itemAnswer = answerSet?.items?.[questionIndex];

  if (!itemAnswer) {
    return {
      isCorrect: false,
      shouldReveal: false,
      correctAnswer: 'A',
      teamComplete: false,
      bothTeamsAnswered: false,
      explanation: 'Question not found',
    };
  }

  // Check if answer is correct (primary or accepted alternative)
  const isCorrect = answer === itemAnswer.answer ||
    (itemAnswer.acceptedAnswers?.includes(answer) ?? false);

  const revealPath = `${basePath}/revealedAnswers/phase2/${setIndex}_${questionIndex}`;
  const revealedRef = db.ref(revealPath);
  const revealedSnap = await revealedRef.once('value');
  const existingRevealed = revealedSnap.val() as Phase2RevealedAnswer | null;

  // Check if this team already answered
  const teamAlreadyAnswered = existingRevealed?.teamAnswers?.[playerTeam] !== undefined;

  // Determine if both teams have answered
  const otherTeam: Team = playerTeam === 'spicy' ? 'sweet' : 'spicy';
  const otherTeamAnswered = existingRevealed?.teamAnswers?.[otherTeam] !== undefined;
  const bothTeamsAnswered = !teamAlreadyAnswered && otherTeamAnswered;

  // Store team's answer (only first member of each team)
  if (!teamAlreadyAnswered) {
    const teamAnswer: Phase2TeamAnswerRevealed = {
      playerId,
      playerName,
      answer,
      isCorrect,
      answeredAt: Date.now(),
    };

    // Update or create revealed answer
    const updatedRevealed: Partial<Phase2RevealedAnswer> = {
      teamAnswers: {
        ...existingRevealed?.teamAnswers,
        [playerTeam]: teamAnswer,
      },
    };

    // If both teams now answered, reveal the correct answer
    if (bothTeamsAnswered || (existingRevealed && otherTeamAnswered)) {
      updatedRevealed.answer = itemAnswer.answer;
      updatedRevealed.revealedAt = Date.now();
    }

    await revealedRef.update(updatedRevealed);
  }

  return {
    isCorrect,
    shouldReveal: bothTeamsAnswered || (existingRevealed?.answer !== undefined),
    correctAnswer: itemAnswer.answer,
    teamComplete: true,
    bothTeamsAnswered: bothTeamsAnswered || (existingRevealed?.answer !== undefined),
    explanation: isCorrect ? 'Correct!' : undefined,
  };
}

// ============================================================================
// PHASE 3 - La Carte (LLM Validation)
// ============================================================================

/**
 * Validates Phase 3 open question using LLM
 * Rules:
 * - Immediate feedback to the answering player
 * - Uses LLM for fuzzy matching (typos, synonyms)
 */
export async function validatePhase3Answer(
  roomId: string,
  themeIndex: number,
  questionIndex: number,
  answer: string,
  playerId: string,
  answers: Phase3ThemeAnswerPrivate[],
  basePath: string
): Promise<Phase3ValidationResult> {
  const db = admin.database();
  const themeAnswers = answers[themeIndex];

  if (!themeAnswers) {
    return {
      isCorrect: false,
      shouldReveal: true,
      expectedAnswer: '',
      confidence: 0,
      explanation: 'Theme not found',
    };
  }

  const questionAnswer = themeAnswers.questions[questionIndex];
  if (!questionAnswer) {
    return {
      isCorrect: false,
      shouldReveal: true,
      expectedAnswer: '',
      confidence: 0,
      explanation: 'Question not found',
    };
  }

  // Use LLM validation
  const validationResult = await validateAnswer(
    answer,
    questionAnswer.expectedAnswer,
    questionAnswer.acceptableAnswers
  );

  // Store revealed answer
  const revealPath = `${basePath}/revealedAnswers/phase3/${themeIndex}_${questionIndex}`;
  const revealed: Phase3RevealedAnswer = {
    expectedAnswer: questionAnswer.expectedAnswer,
    playerId,
    playerAnswer: answer,
    isCorrect: validationResult.isCorrect,
    explanation: validationResult.explanation || '',
    revealedAt: Date.now(),
  };
  await db.ref(revealPath).set(revealed);

  return {
    isCorrect: validationResult.isCorrect,
    shouldReveal: true, // Always reveal to the player
    expectedAnswer: questionAnswer.expectedAnswer,
    confidence: validationResult.confidence,
    explanation: validationResult.explanation,
  };
}

// ============================================================================
// PHASE 4 - La Note (Buzzer MCQ)
// ============================================================================

/**
 * Validates Phase 4 buzzer MCQ answer
 * Rules:
 * - If incorrect, allow rebond (other team can try)
 * - Reveal after correct answer
 */
export async function validatePhase4Answer(
  roomId: string,
  questionIndex: number,
  answer: number,
  playerId: string,
  playerName: string,
  playerTeam: Team,
  answers: Phase4AnswerPrivate[],
  basePath: string
): Promise<Phase4ValidationResult> {
  const db = admin.database();
  const correctAnswer = answers[questionIndex];

  if (!correctAnswer) {
    return {
      isCorrect: false,
      shouldReveal: false,
      correctIndex: -1,
      allowRebond: false,
      explanation: 'Question not found',
    };
  }

  const isCorrect = answer === correctAnswer.correctIndex;

  // Check if already revealed
  const revealedRef = db.ref(`${basePath}/revealedAnswers/phase4/${questionIndex}`);
  const revealedSnap = await revealedRef.once('value');
  const existingRevealed = revealedSnap.val() as Phase4RevealedAnswer | null;
  const alreadyRevealed = !!existingRevealed;

  // Always store revealed answer for result display (fixes visual bug #72)
  // If correct and first, set winner; otherwise just store correctIndex
  if (!alreadyRevealed) {
    if (isCorrect) {
      // First correct answer - store with winner info
      const revealed: Phase4RevealedAnswer = {
        correctIndex: correctAnswer.correctIndex,
        winnerId: playerId,
        winnerName: playerName,
        winnerTeam: playerTeam,
        revealedAt: Date.now(),
      };
      await revealedRef.set(revealed);
    } else {
      // Wrong answer - still store correctIndex for result display
      // Use partial update to preserve potential future winner info
      await revealedRef.update({
        correctIndex: correctAnswer.correctIndex,
        revealedAt: Date.now(),
      });
    }
  }

  return {
    isCorrect,
    shouldReveal: true, // Always reveal for Phase 4 so result display works
    correctIndex: correctAnswer.correctIndex, // Always return correct index
    allowRebond: !isCorrect && !existingRevealed?.winnerId, // Allow rebond if no winner yet
    explanation: isCorrect ? 'Correct!' : 'Incorrect - rebond!',
  };
}

// ============================================================================
// PHASE 5 - Burger Ultime (LLM Validation)
// ============================================================================

/**
 * Validates Phase 5 memory question using LLM
 * Rules:
 * - Immediate feedback to the representative
 * - Uses LLM for fuzzy matching
 */
export async function validatePhase5Answer(
  roomId: string,
  questionIndex: number,
  answer: string,
  team: Team,
  representativeId: string,
  answers: Phase5AnswerPrivate[],
  basePath: string
): Promise<Phase5ValidationResult> {
  const db = admin.database();
  const questionAnswer = answers[questionIndex];

  if (!questionAnswer) {
    return {
      isCorrect: false,
      shouldReveal: true,
      expectedAnswer: '',
      confidence: 0,
      explanation: 'Question not found',
    };
  }

  // Use LLM validation
  const validationResult = await validateAnswer(
    answer,
    questionAnswer.expectedAnswer,
    questionAnswer.acceptableAnswers
  );

  // Store revealed answer
  const revealPath = `${basePath}/revealedAnswers/phase5/${questionIndex}_${team}`;
  const revealed: Phase5RevealedAnswer = {
    expectedAnswer: questionAnswer.expectedAnswer,
    team,
    representativeId,
    givenAnswer: answer,
    isCorrect: validationResult.isCorrect,
    explanation: validationResult.explanation || '',
    revealedAt: Date.now(),
  };
  await db.ref(revealPath).set(revealed);

  return {
    isCorrect: validationResult.isCorrect,
    shouldReveal: true, // Always reveal to the representative
    expectedAnswer: questionAnswer.expectedAnswer,
    confidence: validationResult.confidence,
    explanation: validationResult.explanation,
  };
}
