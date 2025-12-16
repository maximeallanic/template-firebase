
export interface Phase3Menu {
    title: string;
    description: string;
    questions: {
        question: string;
        answer: string;
    }[];
}

export const PHASE3_DATA: Phase3Menu[] = [
    {
        title: "Menu C'est pas sorcier",
        description: "Des questions sur la célèbre émission de Fred et Jamy.",
        questions: [
            { question: "Quel est le prénom du camion ?", answer: "Marcel" },
            { question: "Comment s'appelle la 'petite voix' ?", answer: "Sabine" },
            { question: "Quelle est la marque du camion ?", answer: "Kenworth" },
            { question: "Dans quelle ville est né Jamy ?", answer: "Fontenay-le-Comte" },
            { question: "Quel était le métier de Fred avant l'émission ?", answer: "Journaliste" }
        ]
    },
    {
        title: "Menu Fast Food",
        description: "Gras, sucre et sel. Le combo gagnant.",
        questions: [
            { question: "Quel est le slogan de McDonald's ?", answer: "Venez comme vous êtes" },
            { question: "Quel fast-food a pour mascotte un roi ?", answer: "Burger King" },
            { question: "Dans quel fast-food mange-t-on un bucket ?", answer: "KFC" },
            { question: "Quel sandwich est l'équivalent du Big Mac chez Quick ?", answer: "Le Giant" },
            { question: "Quelle chaîne de fast-food a été fondée par Dave Thomas ?", answer: "Wendy's" }
        ]
    },
    {
        title: "Menu Animaux étranges",
        description: "La nature fait parfois des choses bizarres.",
        questions: [
            { question: "Quel animal peut dormir 3 ans ?", answer: "L'escargot" },
            { question: "Quel est le seul mammifère capable de voler ?", answer: "La chauve-souris" },
            { question: "Quel animal a des empreintes digitales presque identiques aux humains ?", answer: "Le koala" },
            { question: "Quel animal n'a pas de cordes vocales ?", answer: "La girafe" },
            { question: "Combien de coeurs a une pieuvre ?", answer: "3" }
        ]
    }
];
