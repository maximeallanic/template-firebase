export interface Phase2Item {
    text: string;
    answer: 'A' | 'B' | 'Both';
    anecdote?: string;
    justification?: string;
}

export interface Phase2Set {
    title?: string; // Deprecated: not displayed in UI (wordplay format uses optionA/B as the question)
    optionA: string;
    optionB: string;
    items: Phase2Item[];
}

export const PHASE2_SETS: Phase2Set[] = [
    {
        title: "McDonald's ou Burger King ?",
        optionA: "McDonald's",
        optionB: "Burger King",
        items: [
            { text: "Le Big Mac", answer: 'A' },
            { text: "Le Whopper", answer: 'B' },
            { text: "Le Happy Meal", answer: 'A' },
            { text: "Le Steakhouse", answer: 'B' },
            { text: "Les meilleures frites (c'est subjectif, mais bon !)", answer: 'A' }, // Fun bias
            { text: "Ils font des burgers", answer: 'Both' },
            { text: "Le McFlurry", answer: 'A' },
            { text: "King Fusion", answer: 'B' },
            { text: "Le Ronald", answer: 'A' },
            { text: "Le King", answer: 'B' }
        ]
    }
];
