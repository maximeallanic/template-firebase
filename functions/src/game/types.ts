/**
 * Types for Server-Side Game Orchestration
 * Cloud Functions submitAnswer and getGameState
 */

// ============================================================================
// SUBMIT ANSWER TYPES
// ============================================================================

export type GamePhase = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
export type TeamType = 'spicy' | 'sweet';

/**
 * Request to submit an answer during gameplay
 */
export interface SubmitAnswerRequest {
  /** Room code (4-char) for multiplayer, or odId for solo */
  roomId: string;
  /** Current game phase */
  phase: GamePhase;
  /** Index of the current question (0-based) */
  questionIndex: number;
  /** Player's answer: index (P1/P4), 'A'|'B'|'Both' (P2), text (P3/P5) */
  answer: number | string;
  /** Client-side timestamp for P1 fairness (Date.now()) */
  clientTimestamp: number;
  /** Whether this is a solo game session */
  isSolo?: boolean;
}

/**
 * Response from submitAnswer
 */
export interface SubmitAnswerResponse {
  /** Whether the submission was successful */
  success: boolean;

  // === Answer validation result ===
  /** Whether the answer was correct */
  correct: boolean;
  /** Points awarded for this answer */
  pointsAwarded: number;

  // === LLM validation feedback (P3/P5) ===
  /** LLM explanation for fuzzy matching */
  llmFeedback?: string;
  /** Confidence level of LLM validation */
  confidence?: number;

  // === Already answered states ===
  /** P1: Someone already answered this question */
  alreadyAnswered?: boolean;
  /** P2/P3/P4: Your team already answered this question */
  teamAlreadyAnswered?: boolean;
  /** P4: Not the player who buzzed */
  notBuzzer?: boolean;

  // === Progression ===
  /** Next question data (without correct answer) */
  nextQuestion?: QuestionWithoutAnswer;
  /** Whether this was the last question of the phase */
  phaseComplete?: boolean;
  /** Phase results (scores) when phaseComplete is true */
  phaseResults?: {
    spicyScore: number;
    sweetScore: number;
    winner: TeamType | 'tie';
  };

  // === Team-specific (P3) ===
  /** P3: Whether your team finished all questions */
  teamFinished?: boolean;
  /** P3: Current question index for your team */
  teamQuestionIndex?: number;

  // === Winner info (P1/P2/P4) ===
  /** Winner info for race-based phases */
  roundWinner?: {
    odId: string;
    name: string;
    team: TeamType;
  };

  // === Correct answer reveal (after round ends) ===
  /** The correct answer index (MCQ phases) or correct answer text (text phases) */
  correctAnswerIndex?: number;
  /** The correct answer text for display */
  correctAnswer?: string;

  // === Error handling ===
  /** Error code if success is false */
  error?: 'TIMEOUT' | 'INVALID_PHASE' | 'INVALID_QUESTION' | 'NOT_IN_ROOM' | 'ALREADY_ANSWERED' | 'INTERNAL';
  /** Human-readable error message */
  message?: string;
}

// ============================================================================
// QUESTION TYPES (without answers - sent to clients)
// ============================================================================

/**
 * Base question type without correct answer
 */
export interface QuestionWithoutAnswer {
  text: string;
  index: number;
}

/**
 * Phase 1 MCQ question (without correctIndex)
 */
export interface Phase1QuestionClient extends QuestionWithoutAnswer {
  options: string[];
  anecdote?: string;
}

/**
 * Phase 2 binary choice question (without answer)
 */
export interface Phase2QuestionClient extends QuestionWithoutAnswer {
  item: string;
  optionA: string;
  optionB: string;
  optionADescription?: string;
  optionBDescription?: string;
}

/**
 * Phase 3 text question (without expectedAnswer)
 */
export interface Phase3QuestionClient extends QuestionWithoutAnswer {
  theme?: string;
}

/**
 * Phase 4 MCQ question (without correctIndex)
 */
export interface Phase4QuestionClient extends QuestionWithoutAnswer {
  options: string[];
}

/**
 * Phase 5 memorization question (without expectedAnswer)
 * Just the question text for memorization
 */
export type Phase5QuestionClient = QuestionWithoutAnswer;

// ============================================================================
// GAME DATA TYPES (stored server-side with answers)
// ============================================================================

/**
 * Phase 1 question with correct answer
 */
export interface Phase1QuestionServer {
  text: string;
  options: string[];
  correctIndex: number;
  anecdote?: string;
}

/**
 * Phase 2 item with correct answer
 */
export interface Phase2ItemServer {
  text: string;
  answer: 'A' | 'B' | 'Both';
  justification?: string;
  anecdote?: string;
}

/**
 * Phase 2 set with options and items
 */
export interface Phase2SetServer {
  optionA: string;
  optionB: string;
  optionADescription?: string;
  optionBDescription?: string;
  humorousDescription?: string;
  items: Phase2ItemServer[];
}

/**
 * Phase 3 question with expected answer
 */
export interface Phase3QuestionServer {
  question: string;
  answer: string;
  acceptableAnswers?: string[];
}

/**
 * Phase 3 theme with questions
 */
export interface Phase3ThemeServer {
  title: string;
  description: string;
  isTrap: boolean;
  questions: Phase3QuestionServer[];
}

/**
 * Phase 4 question with correct answer
 */
export interface Phase4QuestionServer {
  text: string;
  options: string[];
  correctIndex: number;
  anecdote?: string;
}

/**
 * Phase 5 question with expected answer
 */
export interface Phase5QuestionServer {
  question: string;
  answer: string;
  acceptableAnswers?: string[];
}

/**
 * All game data stored in gameData/{roomCode}/
 */
export interface GameDataServer {
  phase1?: Phase1QuestionServer[];
  phase2?: Phase2SetServer;
  phase3?: Phase3ThemeServer[];
  phase4?: Phase4QuestionServer[];
  phase5?: Phase5QuestionServer[];
}

// ============================================================================
// ROOM STATE TYPES
// ============================================================================

/**
 * Player readiness state for phase transitions
 */
export interface PlayersReadyState {
  [odId: string]: boolean;
}

/**
 * Team-specific question index (for P3 independent progression)
 */
export interface TeamQuestionIndex {
  spicy: number;
  sweet: number;
}

/**
 * Team-specific finished state
 */
export interface TeamFinishedState {
  spicy: boolean;
  sweet: boolean;
}

/**
 * Pending answers for P1 timestamp comparison
 */
export interface PendingAnswer {
  odId: string;
  team: TeamType;
  answer: number;
  clientTimestamp: number;
  serverTimestamp: number;
  correct: boolean;
}

/**
 * Buzz state for P4
 */
export interface BuzzState {
  odId: string;
  team: TeamType;
  timestamp: number;
}

// ============================================================================
// GET GAME STATE TYPES
// ============================================================================

/**
 * Request to get current game state (for reconnection)
 */
export interface GetGameStateRequest {
  roomId: string;
  isSolo?: boolean;
}

/**
 * Response with current game state
 */
export interface GetGameStateResponse {
  success: boolean;
  phase: GamePhase | 'lobby' | 'victory';
  phaseState: string;
  currentQuestionIndex: number;
  currentQuestion?: QuestionWithoutAnswer;
  scores: {
    spicy: number;
    sweet: number;
  };
  playerScores: Record<string, number>;
  playersReady?: PlayersReadyState;
  // P3-specific
  teamQuestionIndex?: TeamQuestionIndex;
  teamFinished?: TeamFinishedState;
  // P4-specific
  buzzedBy?: BuzzState;
  // P5-specific
  phase5State?: 'voting' | 'memorizing' | 'answering' | 'validating' | 'result';
  // Error handling
  error?: string;
  message?: string;
}
