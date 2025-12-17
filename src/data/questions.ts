export interface Question {
    text: string;
    options: string[]; // 4 options
    correctIndex: number;
    anecdote?: string; // Info fun sur la réponse (généré par IA)
}

// Questions par défaut vides - force la génération IA
export const QUESTIONS: Question[] = [];
