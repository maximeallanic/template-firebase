/**
 * Secure Game Types for Cloud Functions - Server-Side Game Orchestration (#72)
 *
 * These types are used by Cloud Functions to manage:
 * - Question generation (separating Q/A)
 * - Answer validation
 * - Score calculation
 * - Pub/Sub message payloads
 */

// ============================================================================
// TEAM & BASIC TYPES
// ============================================================================

export type Team = 'spicy' | 'sweet';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'wtf';
export type GameMode = 'multi' | 'solo';
export type PhaseId = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';

// ============================================================================
// PUBLIC QUESTIONS - Written to rooms/{roomCode}/customQuestions/
// ============================================================================

export interface Phase1QuestionPublic {
  text: string;
  options: string[];
  anecdote?: string;
}

export interface Phase2ItemPublic {
  text: string;
  anecdote?: string;
  justification?: string;
}

export interface Phase2SetPublic {
  title: string;
  items: Phase2ItemPublic[];
  optionA: string;
  optionB: string;
  optionADescription?: string;
  optionBDescription?: string;
  humorousDescription?: string;
}

export interface Phase3QuestionPublic {
  question: string;
}

export interface Phase3ThemePublic {
  title: string;
  description: string;
  questions: Phase3QuestionPublic[];
}

export interface Phase4QuestionPublic {
  text: string;
  options: string[];
  anecdote?: string;
}

export interface Phase5QuestionPublic {
  question: string;
}

export interface CustomQuestionsPublic {
  phase1?: Phase1QuestionPublic[];
  phase2?: Phase2SetPublic | Phase2SetPublic[];
  phase3?: Phase3ThemePublic[];
  phase4?: Phase4QuestionPublic[];
  phase5?: Phase5QuestionPublic[];
}

// ============================================================================
// PRIVATE ANSWERS - Written to gameData/{roomCode}/
// ============================================================================

export interface Phase1AnswerPrivate {
  correctIndex: number;
}

export interface Phase2ItemAnswerPrivate {
  answer: 'A' | 'B' | 'Both';
  acceptedAnswers?: ('A' | 'B' | 'Both')[];
}

export interface Phase2SetAnswerPrivate {
  items: Phase2ItemAnswerPrivate[];
}

export interface Phase3AnswerPrivate {
  expectedAnswer: string;
  acceptableAnswers?: string[];
}

export interface Phase3ThemeAnswerPrivate {
  isTrap: boolean;
  questions: Phase3AnswerPrivate[];
}

export interface Phase4AnswerPrivate {
  correctIndex: number;
}

export interface Phase5AnswerPrivate {
  expectedAnswer: string;
  acceptableAnswers?: string[];
}

export interface GameDataPrivate {
  phase1?: Phase1AnswerPrivate[];
  phase2?: Phase2SetAnswerPrivate | Phase2SetAnswerPrivate[];
  phase3?: Phase3ThemeAnswerPrivate[];
  phase4?: Phase4AnswerPrivate[];
  phase5?: Phase5AnswerPrivate[];
}

// ============================================================================
// REVEALED ANSWERS - Written to rooms/{roomCode}/revealedAnswers/
// ============================================================================

export interface Phase1RevealedAnswer {
  correctIndex: number;
  winnerId?: string;
  winnerName?: string;
  winnerTeam?: Team;
  revealedAt: number;
}

export interface Phase2TeamAnswerRevealed {
  playerId: string;
  playerName: string;
  answer: 'A' | 'B' | 'Both';
  isCorrect: boolean;
  answeredAt: number;
}

export interface Phase2RevealedAnswer {
  answer: 'A' | 'B' | 'Both';
  teamAnswers: {
    spicy?: Phase2TeamAnswerRevealed;
    sweet?: Phase2TeamAnswerRevealed;
  };
  revealedAt: number;
}

export interface Phase3RevealedAnswer {
  expectedAnswer: string;
  playerId: string;
  playerAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  revealedAt: number;
}

export interface Phase4RevealedAnswer {
  correctIndex: number;
  winnerId?: string;
  winnerName?: string;
  winnerTeam?: Team;
  revealedAt: number;
}

export interface Phase5RevealedAnswer {
  expectedAnswer: string;
  team: Team;
  representativeId: string;
  givenAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  revealedAt: number;
}

// ============================================================================
// GENERATION STATUS
// ============================================================================

export type GenerationStatusState = 'idle' | 'generating' | 'ready' | 'partial' | 'error';

export interface PhaseGenerationResult {
  phase: PhaseId;
  generated?: boolean;
  skipped?: boolean;
  count?: number;
  error?: string;
}

export interface GenerationStatus {
  status: GenerationStatusState;
  startedAt?: number;
  completedAt?: number;
  phases?: PhaseGenerationResult[];
  errors?: string[];
}

// ============================================================================
// TEAM SCORES
// ============================================================================

export interface TeamScores {
  spicy: number;
  sweet: number;
}

// ============================================================================
// PUB/SUB MESSAGE TYPES
// ============================================================================

/** Message for generatePhaseQuestions Pub/Sub trigger */
export interface GenerateAllPhasesMessage {
  roomId: string;
  phases: PhaseId[];
  difficulty: Difficulty;
  language: string;
  mode: GameMode;
  requestedAt: number;
}

// ============================================================================
// CLOUD FUNCTION REQUEST/RESPONSE TYPES
// ============================================================================

/** startGame request */
export interface StartGameRequest {
  roomId: string;
  mode: GameMode;
  difficulty?: Difficulty;
  language?: string;
}

/** startGame response */
export interface StartGameResponse {
  success: boolean;
  phase: 'phase1';
  error?: string;
}

/** submitAnswer request */
export interface SubmitAnswerRequest {
  roomId: string;
  phase: PhaseId;
  questionIndex: number;
  answer: number | string; // number for MCQ, string for open questions
  clientTimestamp: number;
}

/** submitAnswer response */
export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  correctAnswer?: number | string; // Only revealed according to phase rules
  scores?: TeamScores;
  explanation?: string; // For LLM-validated phases (P3, P5)
  error?: string;
}

/** nextPhase request */
export interface NextPhaseRequest {
  roomId: string;
  currentPhase: PhaseId;
}

/** nextPhase response */
export interface NextPhaseResponse {
  success: boolean;
  nextPhase: PhaseId | 'victory';
  scores: TeamScores;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the RTDB base path for a game session
 */
export function getBasePath(roomId: string, mode: GameMode): string {
  return mode === 'solo' ? `soloSessions/${roomId}` : `rooms/${roomId}`;
}

/**
 * Get the next phase in sequence
 */
export function getNextPhase(currentPhase: PhaseId): PhaseId | 'victory' {
  const phases: (PhaseId | 'victory')[] = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'victory'];
  const currentIndex = phases.indexOf(currentPhase);
  return phases[currentIndex + 1] || 'victory';
}

/**
 * Check if a phase uses LLM validation
 */
export function usesLLMValidation(phase: PhaseId): boolean {
  return phase === 'phase3' || phase === 'phase5';
}

/**
 * Check if a phase is MCQ-based
 */
export function isMCQPhase(phase: PhaseId): boolean {
  return phase === 'phase1' || phase === 'phase4';
}
