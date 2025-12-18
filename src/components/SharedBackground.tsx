import React from 'react';
import { motion } from 'framer-motion';
import { organicEase } from '../animations';

export type BackgroundVariant = 'home' | 'lobby' | 'game' | 'legal';

interface SharedBackgroundProps {
    variant: BackgroundVariant;
}

// Circle configurations per page variant
// Only opacity transitions - no scale or translate
const circleConfigs: Record<BackgroundVariant, Array<{
    id: string;
    color: string;
    position: { top?: string; bottom?: string; left?: string; right?: string };
    size: string;
    blur: string;
    opacity: number;
}>> = {
    home: [
        {
            id: 'circle-red',
            color: 'bg-red-600',
            position: { top: '5rem', left: '2.5rem' },
            size: 'w-96 h-96',
            blur: 'blur-[100px]',
            opacity: 0.2,
        },
        {
            id: 'circle-pink',
            color: 'bg-pink-600',
            position: { bottom: '5rem', right: '2.5rem' },
            size: 'w-96 h-96',
            blur: 'blur-[100px]',
            opacity: 0.2,
        },
        {
            id: 'circle-purple',
            color: 'bg-purple-600',
            position: { top: '50%', left: '50%' },
            size: 'w-[600px] h-[600px]',
            blur: 'blur-[150px]',
            opacity: 0.1,
        },
    ],
    lobby: [
        {
            id: 'circle-red',
            color: 'bg-red-600',
            position: { top: '0', left: '0' },
            size: 'w-96 h-96',
            blur: 'blur-3xl',
            opacity: 0.2,
        },
        {
            id: 'circle-pink',
            color: 'bg-pink-600',
            position: { bottom: '0', right: '0' },
            size: 'w-96 h-96',
            blur: 'blur-3xl',
            opacity: 0.2,
        },
        {
            id: 'circle-purple',
            color: 'bg-purple-600',
            position: { top: '50%', left: '50%' },
            size: 'w-[600px] h-[600px]',
            blur: 'blur-[150px]',
            opacity: 0, // Hidden in lobby
        },
    ],
    game: [
        {
            id: 'circle-red',
            color: 'bg-red-600',
            position: { top: '0', left: '0' },
            size: 'w-96 h-96',
            blur: 'blur-3xl',
            opacity: 0.15,
        },
        {
            id: 'circle-pink',
            color: 'bg-pink-600',
            position: { bottom: '0', right: '0' },
            size: 'w-96 h-96',
            blur: 'blur-3xl',
            opacity: 0.15,
        },
        {
            id: 'circle-purple',
            color: 'bg-purple-600',
            position: { top: '50%', left: '50%' },
            size: 'w-[600px] h-[600px]',
            blur: 'blur-[150px]',
            opacity: 0,
        },
    ],
    legal: [
        {
            id: 'circle-red',
            color: 'bg-red-600',
            position: { top: '5rem', left: '2.5rem' },
            size: 'w-96 h-96',
            blur: 'blur-[100px]',
            opacity: 0.1,
        },
        {
            id: 'circle-pink',
            color: 'bg-pink-600',
            position: { bottom: '5rem', right: '2.5rem' },
            size: 'w-96 h-96',
            blur: 'blur-[100px]',
            opacity: 0.1,
        },
        {
            id: 'circle-purple',
            color: 'bg-purple-600',
            position: { top: '50%', left: '50%' },
            size: 'w-[600px] h-[600px]',
            blur: 'blur-[150px]',
            opacity: 0.05,
        },
    ],
};


export const SharedBackground: React.FC<SharedBackgroundProps> = ({ variant }) => {
    const circles = circleConfigs[variant];

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base gradient - always present */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950" />

            {/* Animated circles - opacity transitions only */}
            {circles.map((circle) => {
                // Calculate position styles
                const positionStyle: React.CSSProperties = {
                    ...circle.position,
                };

                // Center transform for purple circle
                if (circle.id === 'circle-purple') {
                    positionStyle.transform = 'translate(-50%, -50%)';
                }

                return (
                    <motion.div
                        key={circle.id}
                        className={`absolute rounded-full ${circle.color} ${circle.size} ${circle.blur}`}
                        style={positionStyle}
                        initial={false}
                        animate={{ opacity: circle.opacity }}
                        transition={{
                            duration: 0.6,
                            ease: organicEase,
                        }}
                    />
                );
            })}
        </div>
    );
};
