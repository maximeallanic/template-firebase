import type { Phase3Theme } from '../../types/gameTypes';

// 4 normal themes + 1 trap theme (very hard questions)
// The trap theme should be filtered out client-side
export const PHASE3_DATA: Phase3Theme[] = [
    {
        title: "Menu C'est pas sorcier",
        description: "Des questions sur la célèbre émission de Fred et Jamy.",
        isTrap: false,
        questions: [
            { question: "Quel est le prénom du camion ?", answer: "Marcel" },
            { question: "Comment s'appelle la 'petite voix' ?", answer: "Sabine" },
            { question: "Quelle est la marque du camion ?", answer: "Kenworth" },
            { question: "Dans quelle ville est né Jamy ?", answer: "Fontenay-le-Comte", acceptableAnswers: ["Fontenay le Comte", "Fontenay"] },
            { question: "Quel était le métier de Fred avant l'émission ?", answer: "Journaliste" }
        ]
    },
    {
        title: "Menu Fast Food",
        description: "Gras, sucre et sel. Le combo gagnant.",
        isTrap: false,
        questions: [
            { question: "Quel est le slogan de McDonald's ?", answer: "Venez comme vous êtes", acceptableAnswers: ["I'm lovin' it", "Venez comme vous etes"] },
            { question: "Quel fast-food a pour mascotte un roi ?", answer: "Burger King", acceptableAnswers: ["BK"] },
            { question: "Dans quel fast-food mange-t-on un bucket ?", answer: "KFC", acceptableAnswers: ["Kentucky Fried Chicken"] },
            { question: "Quel sandwich est l'équivalent du Big Mac chez Quick ?", answer: "Le Giant", acceptableAnswers: ["Giant"] },
            { question: "Quelle chaîne de fast-food a été fondée par Dave Thomas ?", answer: "Wendy's", acceptableAnswers: ["Wendys", "Wendy"] }
        ]
    },
    {
        title: "Menu Animaux étranges",
        description: "La nature fait parfois des choses bizarres.",
        isTrap: false,
        questions: [
            { question: "Quel animal peut dormir 3 ans ?", answer: "L'escargot", acceptableAnswers: ["Escargot", "Un escargot"] },
            { question: "Quel est le seul mammifère capable de voler ?", answer: "La chauve-souris", acceptableAnswers: ["Chauve-souris", "Chauve souris"] },
            { question: "Quel animal a des empreintes digitales presque identiques aux humains ?", answer: "Le koala", acceptableAnswers: ["Koala", "Un koala"] },
            { question: "Quel animal n'a pas de cordes vocales ?", answer: "La girafe", acceptableAnswers: ["Girafe", "Une girafe"] },
            { question: "Combien de coeurs a une pieuvre ?", answer: "3", acceptableAnswers: ["Trois", "3 coeurs"] }
        ]
    },
    {
        title: "Menu Cinéma Français",
        description: "Le 7ème art à la française.",
        isTrap: false,
        questions: [
            { question: "Quel acteur incarne OSS 117 ?", answer: "Jean Dujardin", acceptableAnswers: ["Dujardin"] },
            { question: "Quel film a remporté la Palme d'Or en 2008 ?", answer: "Entre les murs", acceptableAnswers: ["Entre les Murs"] },
            { question: "Qui a réalisé Le Fabuleux Destin d'Amélie Poulain ?", answer: "Jean-Pierre Jeunet", acceptableAnswers: ["Jeunet", "JP Jeunet"] },
            { question: "Dans quel film français voit-on un taxi marseillais ultra rapide ?", answer: "Taxi", acceptableAnswers: ["Taxi 1"] },
            { question: "Quel acteur joue Astérix dans Astérix et Obélix: Mission Cléopâtre ?", answer: "Christian Clavier", acceptableAnswers: ["Clavier"] }
        ]
    },
    {
        title: "Menu Secrets d'État",
        description: "Des révélations qui valent leur pesant d'or.",
        isTrap: true, // TRAP THEME - Very hard questions
        questions: [
            { question: "Quel était le nom de code de l'opération de débarquement en Provence en 1944 ?", answer: "Dragoon", acceptableAnswers: ["Opération Dragoon", "Anvil-Dragoon"] },
            { question: "Quel ministre français a démissionné suite à l'affaire des diamants de Bokassa ?", answer: "Valéry Giscard d'Estaing", acceptableAnswers: ["Giscard", "VGE"] },
            { question: "Quel est le vrai nom du résistant Jean Moulin ?", answer: "Jean Moulin", acceptableAnswers: ["Rex", "Max"] }, // Trick question - his codename was Max/Rex
            { question: "En quelle année la France a-t-elle effectué son premier essai nucléaire ?", answer: "1960", acceptableAnswers: ["Mil neuf cent soixante"] },
            { question: "Quel est le nom du sous-marin nucléaire français qui a coulé en 1968 ?", answer: "La Minerve", acceptableAnswers: ["Minerve", "S647"] }
        ]
    }
];

// Helper to get themes without the trap (for client-side display)
export function getVisibleThemes(): Phase3Theme[] {
    return PHASE3_DATA.filter(theme => !theme.isTrap);
}

// Helper to check if a theme is the trap
export function isThemeTrap(themeIndex: number): boolean {
    return PHASE3_DATA[themeIndex]?.isTrap ?? false;
}
