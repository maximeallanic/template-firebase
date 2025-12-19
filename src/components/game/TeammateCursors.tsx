/**
 * TeammateCursors - Overlay component that renders all teammate cursors
 * Fixed position, pointer-events-none, high z-index
 */

import { AnimatePresence } from 'framer-motion';
import { TeammatePointer } from './TeammatePointer';
import type { TeammateCursor } from '../../types/cursorTypes';

interface TeammateCursorsProps {
    cursors: TeammateCursor[];
}

export function TeammateCursors({ cursors }: TeammateCursorsProps) {
    if (cursors.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 100 }}
            aria-hidden="true"
        >
            <AnimatePresence mode="popLayout">
                {cursors.map((cursor) => (
                    <TeammatePointer key={cursor.playerId} {...cursor} />
                ))}
            </AnimatePresence>
        </div>
    );
}
