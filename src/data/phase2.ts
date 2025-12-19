import type { SimplePhase2Set } from '../types/gameTypes';

// Re-export for backwards compatibility (aliased to old name)
export type Phase2Set = SimplePhase2Set;
export type Phase2Item = SimplePhase2Set['items'][number];

export const PHASE2_SETS: SimplePhase2Set[] = [
    {
        title: "Cour ou Cours ?",
        optionA: "Cour",
        optionB: "Cours",
        items: [
            {
                text: "Les enfants y jouent à la récré",
                answer: 'A',
                justification: "La cour de récréation est l'espace extérieur où les enfants jouent.",
                anecdote: "En France, la récré dure en moyenne 15 minutes."
            },
            {
                text: "Le prof fait le sien",
                answer: 'B',
                justification: "Un professeur fait son cours, c'est-à-dire sa leçon.",
                anecdote: "Un enseignant donne environ 900 heures de cours par an."
            },
            {
                text: "Le roi y tenait audience",
                answer: 'A',
                justification: "La cour royale était le lieu où le monarque recevait ses sujets.",
                anecdote: "Versailles comptait jusqu'à 10 000 courtisans !"
            },
            {
                text: "C'est là qu'on prend des notes",
                answer: 'B',
                justification: "On prend des notes pendant un cours pour retenir les informations.",
                anecdote: "Prendre des notes à la main améliore la mémorisation de 25%."
            },
            {
                text: "Peut être d'assises",
                answer: 'A',
                justification: "La cour d'assises est le tribunal qui juge les crimes les plus graves.",
                anecdote: "La cour d'assises existe en France depuis 1791."
            },
            {
                text: "Peut être particulier",
                answer: 'B',
                justification: "Un cours particulier est une leçon individuelle avec un professeur.",
                anecdote: "Le marché du soutien scolaire représente 2 milliards d'euros en France."
            },
            {
                text: "Louis XIV y brillait",
                answer: 'A',
                justification: "Le Roi Soleil était célèbre pour sa cour fastueuse à Versailles.",
                anecdote: "Louis XIV a régné 72 ans, le plus long règne d'Europe."
            },
            {
                text: "On peut le sécher",
                answer: 'Both',
                justification: "Sécher un cours (ne pas y aller) ou sécher une cour (après la pluie) !",
                anecdote: "L'expression 'sécher les cours' date des années 1920."
            },
            {
                text: "Se trouve dans une école",
                answer: 'Both',
                justification: "Une école a une cour de récréation ET des salles de cours.",
                anecdote: "La première école publique française date de 1833 (loi Guizot)."
            },
            {
                text: "Napoléon en avait une grande",
                answer: 'A',
                justification: "Napoléon avait une cour impériale somptueuse aux Tuileries.",
                anecdote: "La cour impériale comptait plus de 3 000 personnes."
            },
            {
                text: "La rivière en a un",
                answer: 'B',
                justification: "Une rivière a un cours d'eau, c'est son trajet géographique.",
                anecdote: "La Loire est le plus long cours d'eau français (1 006 km)."
            },
            {
                text: "Peut être de soutien",
                answer: 'B',
                justification: "Un cours de soutien aide les élèves en difficulté scolaire.",
                anecdote: "1 élève sur 3 a déjà pris des cours de soutien en France."
            }
        ]
    },
    {
        title: "Sang ou Cent ?",
        optionA: "Sang",
        optionB: "Cent",
        items: [
            {
                text: "Il coule dans tes veines",
                answer: 'A',
                justification: "Le sang circule dans tout le corps via les veines et artères.",
                anecdote: "Un adulte possède environ 5 litres de sang."
            },
            {
                text: "Il y en a dans un euro",
                answer: 'B',
                justification: "Un euro contient 100 centimes.",
                anecdote: "Le mot 'cent' vient du latin 'centum'."
            },
            {
                text: "Les vampires en raffolent",
                answer: 'A',
                justification: "Dans les légendes, les vampires se nourrissent de sang humain.",
                anecdote: "Le comte Dracula est inspiré de Vlad l'Empaleur."
            },
            {
                text: "C'est un pourcentage",
                answer: 'B',
                justification: "Pour cent signifie 'sur cent', base des pourcentages.",
                anecdote: "Le symbole % date du XVe siècle italien."
            },
            {
                text: "On peut le donner",
                answer: 'Both',
                justification: "On donne son sang (don du sang) ET on donne des centimes/cents.",
                anecdote: "La France a besoin de 10 000 dons de sang par jour."
            },
            {
                text: "Dracula en boit",
                answer: 'A',
                justification: "Dracula est le vampire le plus célèbre, buveur de sang.",
                anecdote: "Le roman Dracula de Bram Stoker date de 1897."
            },
            {
                text: "On l'utilise pour compter",
                answer: 'B',
                justification: "Cent est un nombre utilisé pour compter.",
                anecdote: "Le système décimal est basé sur le nombre 10."
            },
            {
                text: "Les moustiques l'adorent",
                answer: 'A',
                justification: "Les moustiques femelles piquent pour se nourrir de sang.",
                anecdote: "Seules les femelles moustiques piquent !"
            },
            {
                text: "Il peut être froid",
                answer: 'Both',
                justification: "Sang-froid (calme) ET avoir cent ans (être centenaire).",
                anecdote: "L'expression 'sang-froid' date du XVIe siècle."
            },
            {
                text: "C'est rouge",
                answer: 'A',
                justification: "Le sang est rouge à cause de l'hémoglobine.",
                anecdote: "Le sang des limules est bleu !"
            },
            {
                text: "Papy en a peut-être",
                answer: 'B',
                justification: "Avoir cent ans = être centenaire.",
                anecdote: "La France compte plus de 30 000 centenaires."
            },
            {
                text: "On le perd quand on se coupe",
                answer: 'A',
                justification: "Une coupure fait saigner et perdre du sang.",
                anecdote: "Une petite coupure peut saigner jusqu'à 10 minutes."
            }
        ]
    },
    {
        title: "Verre ou Vert ?",
        optionA: "Verre",
        optionB: "Vert",
        items: [
            {
                text: "On trinque avec",
                answer: 'A',
                justification: "On trinque avec un verre de champagne ou de vin.",
                anecdote: "Trinquer vient de l'allemand 'trinken' (boire)."
            },
            {
                text: "C'est la couleur de l'herbe",
                answer: 'B',
                justification: "L'herbe est verte grâce à la chlorophylle.",
                anecdote: "Le vert est la couleur la plus reposante pour les yeux."
            },
            {
                text: "Cendrillon en avait une pantoufle",
                answer: 'A',
                justification: "Dans le conte original de Perrault, la pantoufle est en verre.",
                anecdote: "Certains pensent que c'était 'vair' (fourrure), pas verre !"
            },
            {
                text: "Shrek l'est",
                answer: 'B',
                justification: "Shrek est un ogre de couleur verte.",
                anecdote: "Shrek a rapporté plus de 3 milliards de dollars au box-office."
            },
            {
                text: "On le recycle",
                answer: 'Both',
                justification: "On recycle le verre (bouteilles) ET le vert est la couleur du recyclage.",
                anecdote: "Le verre peut être recyclé à l'infini !"
            },
            {
                text: "C'est transparent",
                answer: 'A',
                justification: "Le verre est un matériau transparent.",
                anecdote: "Le verre existe depuis 5000 ans (Mésopotamie)."
            },
            {
                text: "Les feux l'utilisent",
                answer: 'B',
                justification: "Le feu vert signifie qu'on peut passer.",
                anecdote: "Le premier feu tricolore date de 1914 à Cleveland."
            },
            {
                text: "Hulk l'est quand il est en colère",
                answer: 'B',
                justification: "Bruce Banner devient Hulk vert quand il est énervé.",
                anecdote: "Hulk était gris dans le premier comic de 1962 !"
            },
            {
                text: "On le casse facilement",
                answer: 'A',
                justification: "Le verre est un matériau fragile qui se brise.",
                anecdote: "Casser du verre porte bonheur dans certaines cultures."
            },
            {
                text: "Les écologistes aiment cette couleur",
                answer: 'B',
                justification: "Le vert est la couleur de l'écologie et de l'environnement.",
                anecdote: "Le premier parti vert a été créé en Australie en 1972."
            },
            {
                text: "On boit dedans",
                answer: 'A',
                justification: "On boit dans un verre d'eau, de vin, etc.",
                anecdote: "Le verre à pied a été inventé à Venise au XVe siècle."
            },
            {
                text: "Les martiens le sont souvent",
                answer: 'B',
                justification: "Dans la fiction, les extraterrestres sont souvent représentés en vert.",
                anecdote: "L'expression 'petits hommes verts' date des années 1950."
            }
        ]
    },
    {
        title: "Mer ou Mère ?",
        optionA: "Mer",
        optionB: "Mère",
        items: [
            {
                text: "On s'y baigne en été",
                answer: 'A',
                justification: "La mer est un lieu de baignade populaire en été.",
                anecdote: "La Méditerranée fait 30°C en surface l'été."
            },
            {
                text: "Elle t'a donné la vie",
                answer: 'B',
                justification: "Une mère donne naissance à ses enfants.",
                anecdote: "La fête des mères existe depuis l'Antiquité grecque."
            },
            {
                text: "Elle est salée",
                answer: 'A',
                justification: "L'eau de mer contient environ 35g de sel par litre.",
                anecdote: "La mer Morte est 10 fois plus salée que l'océan !"
            },
            {
                text: "Elle te fait des bisous",
                answer: 'B',
                justification: "Les mamans font des bisous à leurs enfants.",
                anecdote: "Un bisou libère de l'ocytocine, l'hormone du bonheur."
            },
            {
                text: "Les poissons y vivent",
                answer: 'A',
                justification: "La mer abrite des millions d'espèces de poissons.",
                anecdote: "On a découvert moins de 5% des espèces marines."
            },
            {
                text: "Elle te gronde quand tu fais des bêtises",
                answer: 'B',
                justification: "Les mères grondent leurs enfants quand ils désobéissent.",
                anecdote: "Les enfants font en moyenne 3 bêtises par jour !"
            },
            {
                text: "Elle peut être Méditerranée",
                answer: 'A',
                justification: "La mer Méditerranée borde le sud de l'Europe.",
                anecdote: "Méditerranée signifie 'au milieu des terres' en latin."
            },
            {
                text: "Elle cuisine ton plat préféré",
                answer: 'B',
                justification: "Les mamans préparent souvent les plats favoris de leurs enfants.",
                anecdote: "Le plat préféré des Français est le magret de canard."
            },
            {
                text: "Elle peut être belle",
                answer: 'Both',
                justification: "Belle-mer (la mer est belle) ET belle-mère (mère du conjoint).",
                anecdote: "Belle-mère peut aussi désigner une marâtre dans les contes."
            },
            {
                text: "Les pirates y naviguent",
                answer: 'A',
                justification: "Les pirates naviguaient sur les mers à la recherche de trésors.",
                anecdote: "L'âge d'or de la piraterie fut entre 1650 et 1730."
            },
            {
                text: "Elle te borde le soir",
                answer: 'B',
                justification: "Les mamans bordent leurs enfants avant de dormir.",
                anecdote: "Les histoires du soir améliorent le vocabulaire des enfants de 40%."
            },
            {
                text: "Elle est bleue sur les cartes",
                answer: 'A',
                justification: "Les océans et mers sont représentés en bleu sur les cartes.",
                anecdote: "70% de la surface de la Terre est recouverte d'eau."
            }
        ]
    }
];
