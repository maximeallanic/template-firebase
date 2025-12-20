import type { Question } from '../types/gameTypes';

// Re-export for backwards compatibility
export type { Question };

// Questions de fallback Phase 1
// Utilisées quand l'IA est indisponible ou en cas d'erreur
export const QUESTIONS: Question[] = [
    {
        text: "Quel animal est le plus rapide en vitesse de pointe ?",
        options: ["Le guépard", "Le faucon pèlerin", "L'espadon voilier", "Le colibri"],
        correctIndex: 1,
        anecdote: "Le faucon pèlerin atteint 389 km/h en piqué, bien plus que le guépard (120 km/h) !"
    },
    {
        text: "Combien de temps dure un jour sur Vénus ?",
        options: ["24 heures", "243 jours terrestres", "30 minutes", "1 an terrestre"],
        correctIndex: 1,
        anecdote: "Vénus tourne si lentement qu'un jour y dure plus longtemps qu'une année vénusienne !"
    },
    {
        text: "Quel pays a inventé le champagne ?",
        options: ["L'Italie", "L'Espagne", "L'Angleterre", "La France"],
        correctIndex: 2,
        anecdote: "Contrairement aux idées reçues, ce sont les Anglais qui ont découvert la méthode champenoise au XVIIe siècle !"
    },
    {
        text: "Quelle est la capitale de l'Australie ?",
        options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
        correctIndex: 2,
        anecdote: "Canberra a été construite spécialement comme capitale car Sydney et Melbourne se disputaient ce titre !"
    },
    {
        text: "Quel organe humain consomme le plus d'énergie ?",
        options: ["Le cœur", "Les muscles", "Le cerveau", "Le foie"],
        correctIndex: 2,
        anecdote: "Le cerveau ne représente que 2% du poids du corps mais consomme 20% de l'énergie !"
    },
    {
        text: "De quelle couleur est la boîte noire d'un avion ?",
        options: ["Noire", "Orange", "Rouge", "Jaune"],
        correctIndex: 1,
        anecdote: "Elle est orange fluo pour être facilement repérable dans les débris !"
    },
    {
        text: "Quel est le plus grand désert du monde ?",
        options: ["Le Sahara", "Le désert de Gobi", "L'Antarctique", "Le désert d'Arabie"],
        correctIndex: 2,
        anecdote: "L'Antarctique est un désert froid ! Il reçoit moins de précipitations que le Sahara."
    },
    {
        text: "Combien d'os possède un humain adulte ?",
        options: ["206", "312", "180", "256"],
        correctIndex: 0,
        anecdote: "Les bébés naissent avec environ 300 os qui fusionnent en grandissant !"
    },
    {
        text: "Quel acteur a refusé le rôle de Neo dans Matrix ?",
        options: ["Nicolas Cage", "Tom Cruise", "Will Smith", "Brad Pitt"],
        correctIndex: 2,
        anecdote: "Will Smith a préféré tourner Wild Wild West. Il regrette encore ce choix !"
    },
    {
        text: "Dans quel pays se trouve la plus longue muraille du monde ?",
        options: ["Inde", "Chine", "Mongolie", "Russie"],
        correctIndex: 0,
        anecdote: "La Grande Muraille de l'Inde (Kumbhalgarh) fait 36 km, mais la muraille de Chine reste plus célèbre !"
    },
    {
        text: "Quel fruit flotte sur l'eau ?",
        options: ["La banane", "Le raisin", "La pomme", "La cerise"],
        correctIndex: 2,
        anecdote: "Les pommes sont composées de 25% d'air, ce qui leur permet de flotter !"
    },
    {
        text: "Quelle est la seule planète qui tourne dans le sens inverse des autres ?",
        options: ["Mars", "Jupiter", "Vénus", "Saturne"],
        correctIndex: 2,
        anecdote: "Vénus tourne dans le sens horaire alors que toutes les autres planètes tournent dans le sens antihoraire !"
    },
    {
        text: "Quel animal peut survivre dans l'espace ?",
        options: ["Le cafard", "Le tardigrade", "La méduse", "Le scorpion"],
        correctIndex: 1,
        anecdote: "Ces micro-animaux peuvent résister au vide spatial, aux radiations et aux températures extrêmes !"
    },
    {
        text: "Quel pays produit le plus de café au monde ?",
        options: ["La Colombie", "L'Éthiopie", "Le Brésil", "Le Vietnam"],
        correctIndex: 2,
        anecdote: "Le Brésil produit environ un tiers du café mondial, soit plus de 2 millions de tonnes par an !"
    },
    {
        text: "Combien de langues officielles a l'Inde ?",
        options: ["2", "22", "8", "15"],
        correctIndex: 1,
        anecdote: "L'Inde reconnaît 22 langues officielles, mais on y parle plus de 1600 langues différentes !"
    },
    {
        text: "Quel est l'animal national de l'Écosse ?",
        options: ["Le cerf", "L'aigle", "La licorne", "Le lion"],
        correctIndex: 2,
        anecdote: "La licorne est l'animal national écossais depuis le XIIe siècle, symbole de pureté et de puissance !"
    },
    {
        text: "Quelle est la plus petite unité de temps scientifiquement mesurée ?",
        options: ["La nanoseconde", "La femtoseconde", "Le temps de Planck", "L'attoseconde"],
        correctIndex: 2,
        anecdote: "Le temps de Planck dure 10^-43 seconde, c'est le plus petit intervalle de temps ayant un sens physique !"
    },
    {
        text: "Quel pourcentage de l'ADN est commun entre les humains et les bananes ?",
        options: ["15%", "40%", "60%", "0%"],
        correctIndex: 2,
        anecdote: "On partage environ 60% de notre ADN avec les bananes ! Avec les chimpanzés, c'est 98%."
    },
    {
        text: "Dans quelle ville se trouve la plus grande collection d'art au monde ?",
        options: ["Paris", "New York", "Saint-Pétersbourg", "Rome"],
        correctIndex: 2,
        anecdote: "L'Ermitage à Saint-Pétersbourg possède plus de 3 millions d'œuvres. Il faudrait 11 ans pour tout voir !"
    },
    {
        text: "Quelle invention Napoléon a-t-il popularisée ?",
        options: ["Le croissant", "Les boutons de manchette", "La conserve alimentaire", "Le parapluie"],
        correctIndex: 2,
        anecdote: "Napoléon a offert 12 000 francs à Nicolas Appert pour son invention de la conserve pour nourrir ses armées !"
    }
];
