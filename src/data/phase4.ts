import type { Phase4Question } from '../types/gameTypes';

// Re-export for backwards compatibility
export type { Phase4Question };

export const PHASE4_QUESTIONS: Phase4Question[] = [
    { question: "Quel est le prénom de Mr. Bean ?", answer: "Mr." },
    { question: "Quelle est la couleur du cheval blanc d'Henri IV ?", answer: "Blanc" },
    { question: "Combien de nains accompagnent Blanche-Neige ?", answer: "7" },
    { question: "Quelle est la capitale de la France ?", answer: "Paris" },
    { question: "Qui a écrit Les Misérables ?", answer: "Victor Hugo" },
    { question: "De quelle couleur sont les petits pois ?", answer: "Verts" },
    { question: "Quel animal miaule ?", answer: "Le chat" },
    { question: "Combien font 2 + 2 ?", answer: "4" },
    { question: "En quelle année sommes-nous ?", answer: new Date().getFullYear().toString() },
    { question: "Quelle est la monnaie du Japon ?", answer: "Le Yen" },
    { question: "Qui est l'ennemi de Batman ?", answer: "Le Joker" },
    { question: "Quel est le plus grand océan ?", answer: "Pacifique" },
    { question: "Qui a peint la Joconde ?", answer: "Léonard de Vinci" },
    { question: "Quelle est la langue parlée au Brésil ?", answer: "Portugais" },
    { question: "Combien de jours dans une semaine ?", answer: "7" }
];
