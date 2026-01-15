import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKonamiCode } from '../../hooks/useKonamiCode';

/**
 * Global listener for Konami code that activates debug mode on preview environments.
 * Shows a toast notification when debug mode is activated.
 */
export function KonamiCodeListener() {
    const { isDebugEnabled, isPreviewEnv } = useKonamiCode();
    const [showToast, setShowToast] = useState(false);
    const [wasEnabled, setWasEnabled] = useState(false);

    useEffect(() => {
        // Show toast only when debug mode is newly activated
        if (isDebugEnabled && !wasEnabled) {
            setShowToast(true);
            setWasEnabled(true);
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isDebugEnabled, wasEnabled]);

    // Only render on preview environments
    if (!isPreviewEnv) return null;

    return (
        <AnimatePresence>
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -50, x: '-50%' }}
                    className="fixed top-4 left-1/2 z-[10000] px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl shadow-2xl"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🎮</span>
                        <span>Debug mode activated!</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
