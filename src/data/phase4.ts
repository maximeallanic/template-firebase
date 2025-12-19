import type { Phase4Question } from '../types/gameTypes';

// Re-export for backwards compatibility
export type { Phase4Question };

/**
 * Questions de culture générale pour Phase 4 "La Note"
 * Format: MCQ avec 4 options, difficulté variée
 * Ces questions sont utilisées en fallback si la génération AI échoue
 */
export const PHASE4_QUESTIONS: Phase4Question[] = [
    {
        question: "Quelle est la capitale de l'Australie ?",
        options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
        correctIndex: 2,
        anecdote: "Canberra a été construite spécialement pour être la capitale, un compromis entre Sydney et Melbourne !"
    },
    {
        question: "Quel est le plus grand océan du monde ?",
        options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
        correctIndex: 3,
        anecdote: "Le Pacifique couvre plus de surface que tous les continents réunis !"
    },
    {
        question: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?",
        options: ["1965", "1969", "1972", "1975"],
        correctIndex: 1,
        anecdote: "Neil Armstrong a prononcé sa célèbre phrase le 21 juillet 1969."
    },
    {
        question: "Qui a peint 'La Nuit étoilée' ?",
        options: ["Claude Monet", "Pablo Picasso", "Vincent van Gogh", "Salvador Dalí"],
        correctIndex: 2,
        anecdote: "Van Gogh a peint ce tableau depuis sa chambre à l'asile de Saint-Rémy-de-Provence."
    },
    {
        question: "Quel est l'élément chimique le plus abondant dans l'univers ?",
        options: ["Oxygène", "Carbone", "Hélium", "Hydrogène"],
        correctIndex: 3,
        anecdote: "L'hydrogène représente environ 75% de la masse de l'univers visible !"
    },
    {
        question: "Dans quel pays se trouve le Machu Picchu ?",
        options: ["Colombie", "Pérou", "Bolivie", "Équateur"],
        correctIndex: 1,
        anecdote: "Cette cité inca perchée à 2 430 m d'altitude n'a jamais été découverte par les conquistadors."
    },
    {
        question: "Combien d'os compte le corps humain adulte ?",
        options: ["186", "206", "226", "246"],
        correctIndex: 1,
        anecdote: "Les bébés naissent avec environ 270 os qui fusionnent en grandissant !"
    },
    {
        question: "Quel animal est le symbole de la paresse en raison de sa lenteur ?",
        options: ["Le koala", "Le paresseux", "Le panda", "La tortue"],
        correctIndex: 1,
        anecdote: "Le paresseux peut mettre un mois entier à digérer une seule feuille !"
    },
    {
        question: "Quelle est la langue la plus parlée au monde en nombre de locuteurs natifs ?",
        options: ["Anglais", "Espagnol", "Hindi", "Mandarin"],
        correctIndex: 3,
        anecdote: "Le mandarin compte près d'un milliard de locuteurs natifs."
    },
    {
        question: "Quel compositeur a écrit 'Les Quatre Saisons' ?",
        options: ["Johann Sebastian Bach", "Wolfgang Amadeus Mozart", "Antonio Vivaldi", "Ludwig van Beethoven"],
        correctIndex: 2,
        anecdote: "Vivaldi était surnommé 'le prêtre roux' à cause de la couleur de ses cheveux !"
    }
];
