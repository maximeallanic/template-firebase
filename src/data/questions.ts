export interface Question {
    text: string;
    options: string[]; // 4 options
    correctIndex: number;
}

export const QUESTIONS: Question[] = [
    {
        text: "Quel fruit est connu pour sa mauvaise odeur mais son goût délicieux ?",
        options: ["Le Durian", "La Papaye", "Le Jacquier", "La Mangue"],
        correctIndex: 0
    },
    {
        text: "De quel pays vient le Tiramisu ?",
        options: ["France", "Italie", "Espagne", "Grèce"],
        correctIndex: 1
    },
    {
        text: "Quel est l'ingrédient principal du Guacamole ?",
        options: ["Tomate", "Oignon", "Avocat", "Citron"],
        correctIndex: 2
    },
    {
        text: "Quel piment est l'un des plus forts au monde ?",
        options: ["Jalapeño", "Espelette", "Carolina Reaper", "Cayenne"],
        correctIndex: 2
    },
    {
        text: "Quelle pâtisserie est faite de milie-feuilles ?",
        options: ["Le Mille-feuille", "L'Éclair", "Le Paris-Brest", "Le Croissant"],
        correctIndex: 0
    },
    {
        text: "Que signifie 'Al Dente' ?",
        options: ["Mou", "À la dent", "Cuit", "Froid"],
        correctIndex: 1
    },
    {
        text: "Quel est le plat national de l'Espagne ?",
        options: ["Pizza", "Paella", "Tacos", "Burger"],
        correctIndex: 1
    },
    {
        text: "Avec quoi fait-on du houmous ?",
        options: ["Petits pois", "Haricots rouges", "Pois chiches", "Lentilles"],
        correctIndex: 2
    },
    {
        text: "Quelle est la couleur de la chair d'un kiwi classique ?",
        options: ["Jaune", "Rouge", "Vert", "Bleu"],
        correctIndex: 2
    },
    {
        text: "Lequel n'est PAS un ingrédient de la pizza Margherita ?",
        options: ["Tomate", "Mozzarella", "Basilic", "Jambon"],
        correctIndex: 3
    }
];
