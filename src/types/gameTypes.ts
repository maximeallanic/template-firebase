// === AVATARS ===

export type Avatar =
    | 'burger' | 'pizza' | 'taco' | 'sushi' | 'hotdog'
    | 'donut' | 'cupcake' | 'icecream' | 'fries' | 'cookie'
    | 'chili' | 'popcorn' | 'avocado' | 'egg' | 'watermelon';

export const AVATAR_LIST: Avatar[] = [
    'burger', 'pizza', 'taco', 'sushi', 'hotdog',
    'donut', 'cupcake', 'icecream', 'fries', 'cookie',
    'chili', 'popcorn', 'avocado', 'egg', 'watermelon'
];

// === PHASES ===

export type PhaseStatus = 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'victory';

export interface PhaseInfo {
    name: string;
    subtitle: string;
    shortName: string;
}

export const PHASE_NAMES: Record<PhaseStatus, PhaseInfo> = {
    lobby: { name: 'Lobby', subtitle: 'En attente...', shortName: 'Lobby' },
    phase1: { name: 'Tenders', subtitle: 'Sois le plus rapide à buzzer !', shortName: 'Tenders' },
    phase2: { name: 'Sucré Salé', subtitle: 'Plutôt A ou plutôt B ?', shortName: 'Sucré Salé' },
    phase3: { name: 'La Carte', subtitle: 'Retiens un max de plats !', shortName: 'La Carte' },
    phase4: { name: 'La Note', subtitle: 'Questions de culture G !', shortName: 'La Note' },
    phase5: { name: 'Burger Ultime', subtitle: 'Le défi final pour la victoire !', shortName: 'Burger Ultime' },
    victory: { name: 'Victoire', subtitle: 'Le gagnant est...', shortName: 'Victoire' },
};

// === TEAMS & PLAYERS ===

export type Team = 'spicy' | 'sweet';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar;
    team: Team | null;
    isHost: boolean;
    score: number;
    joinedAt: number;
    isOnline: boolean;
}

// === GAME STATE ===

export interface GameState {
    status: 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'victory';
    phaseState: 'idle' | 'reading' | 'answering' | 'result' | 'menu_selection' | 'questioning' | 'phase_results';
    isGenerating?: boolean; // True when AI is generating questions (visible to all players)
    phase2Generating?: boolean; // Lock for Phase 2 generation (prevents double generation)
    currentQuestionIndex?: number;
    phase1Answers?: Record<string, boolean>;
    phase1BlockedTeams?: Team[]; // Teams blocked after wrong answer
    phase1TriedWrongOptions?: number[]; // Options already tried and wrong (for rebond system)
    phase1LastWrongTeam?: Team; // Team that just answered wrong (for rebond feedback)
    roundWinner?: { playerId: string | 'ALL'; name: string; team: Team | 'neutral' } | null;
    // Phase 2 - Team-based (1 réponse par équipe suffit)
    currentPhase2Set?: number;
    currentPhase2Item?: number;
    phase2TeamAnswers?: Phase2TeamAnswers;  // Réponses par équipe
    phase2RoundWinner?: Team | null;        // Équipe gagnante du round (null = aucun gagnant)
    // Phase 3 v2 - Parallel play with LLM validation
    phase3State?: 'selecting' | 'playing' | 'finished';
    phase3SelectionOrder?: Team[]; // Order based on scores (lowest first)
    phase3ThemeSelection?: Record<Team, number>; // Which theme each team chose
    phase3TeamProgress?: Record<Team, Phase3TeamProgress>;
    // Legacy Phase 3 fields (deprecated)
    currentMenuTeam?: Team;
    currentMenuQuestionIndex?: number;
    phase3CompletedMenus?: number[];
    // Phase 4 - Course de rapidité MCQ
    currentPhase4QuestionIndex?: number;
    phase4State?: 'questioning' | 'result';
    phase4Answers?: Record<string, Phase4Answer>;  // playerId -> réponse
    phase4QuestionStartTime?: number;              // Timestamp début question (pour timer 30s)
    phase4Winner?: Phase4Winner | null;            // Premier à avoir répondu correctement
    // Phase 5 - Burger Ultime (Duel de mémoire)
    phase5State?: Phase5State;
    phase5QuestionIndex?: number;
    phase5TimerStart?: number;  // Timestamp pour auto-advance (10s/question)
    phase5Votes?: Phase5Votes;
    phase5Representatives?: Phase5Representatives;
    phase5Answers?: Phase5Answers;
    phase5CurrentAnswerIndex?: Phase5AnswerIndices;
    phase5Results?: Phase5Results;
    // Victory
    winnerTeam?: Team | 'tie';
}

export type PhaseState = GameState['phaseState'];

// === QUESTION TYPES ===

export interface Question {
    text: string;
    options: string[]; // 4 options
    correctIndex: number;
    anecdote?: string; // Info fun sur la réponse (généré par IA)
}

export interface SimplePhase2Set {
    title: string;
    items: {
        text: string;
        answer: 'A' | 'B' | 'Both';
        acceptedAnswers?: ('A' | 'B' | 'Both')[];  // Réponses alternatives valides pour items ambigus
        anecdote?: string;
        justification?: string;
    }[];
    optionA: string;
    optionB: string;
    optionADescription?: string;  // Description pour différencier les homonymes (ex: "le gâteau")
    optionBDescription?: string;  // Description pour différencier les homonymes (ex: "le banquier")
}

// Phase 2 - Team answer tracking (1 réponse par équipe)
export interface Phase2TeamAnswer {
    playerId: string;
    playerName: string;
    answer: 'A' | 'B' | 'Both';
    correct: boolean;
    timestamp: number;
}

export interface Phase2TeamAnswers {
    spicy?: Phase2TeamAnswer;
    sweet?: Phase2TeamAnswer;
}

export interface Phase5Question {
    question: string;
    answer: string;
}

export type Phase5Data = Phase5Question[];

// === PHASE 5 EXTENDED TYPES ===

export type Phase5State = 'idle' | 'selecting' | 'memorizing' | 'answering' | 'validating' | 'result';

// Votes pour sélection des représentants
export interface Phase5Votes {
    spicy: Record<string, string>;  // voterId -> votedPlayerId
    sweet: Record<string, string>;
}

// Représentants élus
export interface Phase5Representatives {
    spicy: string | null;
    sweet: string | null;
}

// Réponses en temps réel des représentants
export interface Phase5Answers {
    spicy: string[];
    sweet: string[];
}

// Index de progression des réponses
export interface Phase5AnswerIndices {
    spicy: number;
    sweet: number;
}

// Résultat de validation par réponse
export interface Phase5ValidationResult {
    index: number;
    expected: string;
    given: string;
    isCorrect: boolean;
    explanation?: string;
}

// Résultat d'une équipe
export interface Phase5TeamResult {
    answers: Phase5ValidationResult[];
    first5Correct: boolean;
    all10Correct: boolean;
    points: number;
}

// Résultats finaux des 2 équipes
export interface Phase5Results {
    spicy: Phase5TeamResult;
    sweet: Phase5TeamResult;
}

// Phase 3 - Theme structure (v2)
export interface Phase3Theme {
    title: string;
    description: string;
    isTrap: boolean; // Hidden trap theme (never revealed to players)
    questions: Phase3Question[];
}

export interface Phase3Question {
    question: string;
    answer: string;
    acceptableAnswers?: string[]; // Alternative correct answers
}

// Backward compatibility alias
export type Phase3Menu = Phase3Theme;

// Phase 3 - Team progress tracking
export interface Phase3TeamProgress {
    themeIndex: number;
    currentQuestionIndex: number;
    score: number;
    finished: boolean;
    finishedAt?: number;
    questionAnsweredBy?: Record<number, string>; // questionIndex -> playerId who answered correctly
}

// Phase 3 - Player answer record
export interface Phase3PlayerAnswer {
    playerId: string;
    questionIndex: number;
    answer: string;
    isCorrect: boolean | null; // null = pending validation
    validatedAt?: number;
}

export interface Phase4Question {
    question: string;
    options: string[];      // 4 options MCQ
    correctIndex: number;   // Index de la bonne réponse (0-3)
    anecdote?: string;      // Fait amusant optionnel
}

// Phase 4 - Answer tracking for MCQ race
export interface Phase4Answer {
    answer: number;         // Index de la réponse choisie (0-3)
    timestamp: number;      // Timestamp pour déterminer le premier
}

// Phase 4 - Winner info
export interface Phase4Winner {
    playerId: string;
    name: string;
    team: Team;
}

// === ROOM ===

export interface Room {
    code: string;
    hostId: string;
    players: Record<string, Player>;
    state: GameState;
    createdAt: number;
    customQuestions?: {
        phase1?: Question[];
        phase2?: SimplePhase2Set[];
        phase3?: Phase3Theme[];
        phase4?: Phase4Question[];
        phase5?: Phase5Data;
    };
}
