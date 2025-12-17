import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { organicEase, durations } from '../animations';

const LOADING_MESSAGES = [
    "Le chef prépare les questions...",
    "Cuisson en cours...",
    "On ajoute les épices...",
    "Mélange des ingrédients...",
    "Préchauffage du four...",
    "Découpe des légumes...",
    "Dressage des assiettes...",
    "Le soufflé ne doit pas retomber...",
    "Vérification de la fraîcheur...",
    "Marinade en cours...",
    "Flambée imminente...",
    "Ça mijote doucement...",
    "Ajout d'une pincée de sel...",
    "Le minuteur tourne...",
    "Surveillance du four...",
    "On goûte la sauce...",
    "Les pâtisseries prennent forme...",
    "Battage des blancs en neige...",
];

interface LoadingMessagesProps {
    className?: string;
}

export function LoadingMessages({ className = '' }: LoadingMessagesProps) {
    const [messageIndex, setMessageIndex] = useState(() =>
        Math.floor(Math.random() * LOADING_MESSAGES.length)
    );
    const usedIndices = useRef<Set<number>>(new Set([messageIndex]));

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => {
                // Reset if we've used most messages
                if (usedIndices.current.size >= LOADING_MESSAGES.length - 1) {
                    usedIndices.current = new Set();
                }

                // Find next unused index (different from current)
                let nextIndex: number;
                do {
                    nextIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
                } while (nextIndex === prev || usedIndices.current.has(nextIndex));

                usedIndices.current.add(nextIndex);
                return nextIndex;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`h-8 flex items-center justify-center ${className}`}>
            <AnimatePresence mode="wait">
                <motion.p
                    key={messageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: durations.fast, ease: organicEase }}
                    className="text-slate-300 text-sm font-medium"
                >
                    {LOADING_MESSAGES[messageIndex]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
