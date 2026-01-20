/**
 * Secure Game Types - Server-Side Game Orchestration (#72)
 *
 * These types define the separation between:
 * - PUBLIC questions (visible to clients, NO answers)
 * - PRIVATE answers (stored in gameData/, only accessible by Cloud Functions)
 * - REVEALED answers (written by CF after validation)
 */

import type { Team } from './gameTypes';

// ============================================================================
// PUBLIC QUESTIONS - Visible to clients (NO answers!)
// Stored in: rooms/{roomCode}/customQuestions/
// ============================================================================

/** Phase 1 question without the correct answer */
export interface Phase1QuestionPublic {
  text: string;
  options: string[];
  anecdote?: string;
  // NO correctIndex!
}

/** Phase 2 item without the correct answer */
export interface Phase2ItemPublic {
  text: string;
  // NO answer!
  // NO acceptedAnswers!
  anecdote?: string;
  justification?: string;
}

/** Phase 2 set without answers */
export interface Phase2SetPublic {
  title: string;
  items: Phase2ItemPublic[];
  optionA: string;
  optionB: string;
  optionADescription?: string;
  optionBDescription?: string;
  humorousDescription?: string;
}

/** Phase 3 question without the expected answer */
export interface Phase3QuestionPublic {
  question: string;
  // NO answer!
  // NO acceptableAnswers!
}

/** Phase 3 theme without answers */
export interface Phase3ThemePublic {
  title: string;
  description: string;
  // isTrap is NOT exposed to clients!
  questions: Phase3QuestionPublic[];
}

/** Phase 4 question without the correct answer */
export interface Phase4QuestionPublic {
  text: string;
  options: string[];
  anecdote?: string;
  // NO correctIndex!
}

/** Phase 5 question without the expected answer */
export interface Phase5QuestionPublic {
  question: string;
  // NO answer!
}

/** All public questions for a room */
export interface CustomQuestionsPublic {
  phase1?: Phase1QuestionPublic[];
  phase2?: Phase2SetPublic | Phase2SetPublic[];
  phase3?: Phase3ThemePublic[];
  phase4?: Phase4QuestionPublic[];
  phase5?: Phase5QuestionPublic[];
}

// ============================================================================
// PRIVATE ANSWERS - Only accessible by Cloud Functions
// Stored in: gameData/{roomCode}/
// ============================================================================

/** Phase 1 answer (private) */
export interface Phase1AnswerPrivate {
  correctIndex: number;
}

/** Phase 2 item answer (private) */
export interface Phase2ItemAnswerPrivate {
  answer: 'A' | 'B' | 'Both';
  acceptedAnswers?: ('A' | 'B' | 'Both')[];
}

/** Phase 2 set answers (private) */
export interface Phase2SetAnswerPrivate {
  items: Phase2ItemAnswerPrivate[];
}

/** Phase 3 question answer (private) */
export interface Phase3AnswerPrivate {
  expectedAnswer: string;
  acceptableAnswers?: string[];
}

/** Phase 3 theme answers (private) */
export interface Phase3ThemeAnswerPrivate {
  isTrap: boolean;
  questions: Phase3AnswerPrivate[];
}

/** Phase 4 answer (private) */
export interface Phase4AnswerPrivate {
  correctIndex: number;
}

/** Phase 5 answer (private) */
export interface Phase5AnswerPrivate {
  expectedAnswer: string;
  acceptableAnswers?: string[];
}

/** All private answers for a room */
export interface GameDataPrivate {
  phase1?: Phase1AnswerPrivate[];
  phase2?: Phase2SetAnswerPrivate | Phase2SetAnswerPrivate[];
  phase3?: Phase3ThemeAnswerPrivate[];
  phase4?: Phase4AnswerPrivate[];
  phase5?: Phase5AnswerPrivate[];
}

// ============================================================================
// REVEALED ANSWERS - Written by CF after validation
// Stored in: rooms/{roomCode}/revealedAnswers/
// ============================================================================

/** Phase 1 revealed answer (after first correct answer) */
export interface Phase1RevealedAnswer {
  correctIndex: number;
  winnerId?: string;
  winnerName?: string;
  winnerTeam?: Team;
  revealedAt: number;
}

/** Phase 2 team answer for a single question */
export interface Phase2TeamAnswerRevealed {
  playerId: string;
  playerName: string;
  answer: 'A' | 'B' | 'Both';
  isCorrect: boolean;
  answeredAt: number;
}

/** Phase 2 revealed answer (after team responds) */
export interface Phase2RevealedAnswer {
  answer: 'A' | 'B' | 'Both';
  teamAnswers: {
    spicy?: Phase2TeamAnswerRevealed;
    sweet?: Phase2TeamAnswerRevealed;
  };
  revealedAt: number;
}

/** Phase 3 revealed answer (after LLM validation) */
export interface Phase3RevealedAnswer {
  expectedAnswer: string;
  playerId: string;
  playerAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  revealedAt: number;
}

/** Phase 4 revealed answer (after first correct answer - buzzer) */
export interface Phase4RevealedAnswer {
  correctIndex: number;
  winnerId?: string;
  winnerName?: string;
  winnerTeam?: Team;
  revealedAt: number;
}

/** Phase 5 revealed answer (after LLM validation) */
export interface Phase5RevealedAnswer {
  expectedAnswer: string;
  team: Team;
  representativeId: string;
  givenAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  revealedAt: number;
}

/** All revealed answers for a room */
export interface RevealedAnswers {
  phase1?: Record<number, Phase1RevealedAnswer>;
  phase2?: Record<number, Phase2RevealedAnswer>;
  phase3?: Record<Team, Record<number, Phase3RevealedAnswer>>;
  phase4?: Record<number, Phase4RevealedAnswer>;
  phase5?: Record<Team, Record<number, Phase5RevealedAnswer>>;
}

// ============================================================================
// GENERATION STATUS - Pub/Sub background generation tracking
// Stored in: rooms/{roomCode}/generationStatus/
// ============================================================================

export type GenerationStatusState = 'idle' | 'generating' | 'ready' | 'partial' | 'error';

export interface PhaseGenerationResult {
  phase: string;
  generated?: boolean;
  skipped?: boolean;
  count?: number;
  error?: string;
}

/** Generation status for Pub/Sub background generation */
export interface GenerationStatus {
  status: GenerationStatusState;
  startedAt?: number;
  completedAt?: number;
  phases?: PhaseGenerationResult[];
  errors?: string[];
}

// ============================================================================
// TEAM SCORES - Managed by Cloud Functions only
// Stored in: rooms/{roomCode}/state/scores/
// ============================================================================

/** Team scores (source of truth from CF) */
export interface TeamScores {
  spicy: number;
  sweet: number;
}

// ============================================================================
// SOLO SESSION STRUCTURE
// Stored in: soloSessions/{odId}/
// ============================================================================

export interface SoloSessionState {
  status: 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'victory';
  phaseState: 'idle' | 'reading' | 'answering' | 'result';
  currentQuestionIndex?: number;
  score: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface SoloSession {
  odId: string;
  state: SoloSessionState;
  customQuestions?: CustomQuestionsPublic;
  revealedAnswers?: {
    phase1?: Record<number, { correctIndex: number; isCorrect: boolean }>;
    phase2?: Record<number, { answer: 'A' | 'B' | 'Both'; isCorrect: boolean }>;
    phase3?: Record<number, { expectedAnswer: string; isCorrect: boolean }>;
    phase4?: Record<number, { correctIndex: number; isCorrect: boolean }>;
    phase5?: Record<number, { expectedAnswer: string; isCorrect: boolean }>;
  };
  generationStatus?: GenerationStatus;
  difficulty?: 'easy' | 'normal' | 'hard' | 'wtf';
  language?: string;
  createdAt: number;
}
