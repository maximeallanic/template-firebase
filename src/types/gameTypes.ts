import type { Question } from '../data/questions';

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
    phaseState: 'idle' | 'reading' | 'answering' | 'result' | 'menu_selection' | 'questioning' | 'buzzed';
    currentQuestionIndex?: number;
    phase1Answers?: Record<string, boolean>;
    phase1BlockedTeams?: Team[]; // Teams blocked after wrong answer
    roundWinner?: { playerId: string | 'ALL'; name: string; team: Team | 'neutral' } | null;
    // Phase 2
    currentPhase2Set?: number;
    currentPhase2Item?: number;
    phase2Answers?: Record<string, boolean>;
    // Phase 3
    currentMenuTeam?: Team;
    currentMenuQuestionIndex?: number;
    phase3MenuSelection?: Record<Team, number>;
    phase3CompletedMenus?: number[];
    // Phase 4
    currentPhase4QuestionIndex?: number;
    buzzedTeam?: Team | null;
    phase4State?: 'idle' | 'buzzed';
    questionStartTime?: number;
    // Phase 5
    phase5State?: 'idle' | 'reading' | 'answering';
    phase5QuestionIndex?: number;
    phase5Score?: number;
    // Victory
    winnerTeam?: Team | 'tie';
}

export type PhaseState = GameState['phaseState'];

// === QUESTION TYPES ===

export interface SimplePhase2Set {
    title: string;
    items: { text: string; answer: 'A' | 'B' | 'Both'; anecdote?: string; justification?: string }[];
    optionA: string;
    optionB: string;
}

export interface Phase5Question {
    question: string;
    answer: string;
}

export type Phase5Data = Phase5Question[];

export interface Phase3Menu {
    title: string;
    description: string;
    questions: { question: string; answer: string }[];
}

export interface Phase4Question {
    question: string;
    answer: string;
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
        phase3?: Phase3Menu[];
        phase4?: Phase4Question[];
        phase5?: Phase5Data;
    };
}
