import { useId } from 'react';

interface PhaseLogoProps {
    className?: string;
    size?: number;
}

export function LaNoteLogo({ className = '', size = 32 }: PhaseLogoProps) {
    const id = useId();
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={`${id}-receipt`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f9fafb" />
                    <stop offset="100%" stopColor="#d1d5db" />
                </linearGradient>
            </defs>
            {/* Long Paper */}
            <path
                d="M8,2 L24,2 L24,30 L22,28 L20,30 L18,28 L16,30 L14,28 L12,30 L10,28 L8,30 Z"
                fill={`url(#${id}-receipt)`}
                stroke="#6b7280"
                strokeWidth="1"
            />

            {/* Header */}
            <rect x="12" y="5" width="8" height="2" rx="0.5" fill="#1f2937" />

            {/* Items */}
            <rect x="10" y="9" width="6" height="1" rx="0.5" fill="#9ca3af" /> <rect x="20" y="9" width="2" height="1" rx="0.5" fill="#9ca3af" />
            <rect x="10" y="12" width="8" height="1" rx="0.5" fill="#9ca3af" /> <rect x="20" y="12" width="2" height="1" rx="0.5" fill="#9ca3af" />
            <rect x="10" y="15" width="5" height="1" rx="0.5" fill="#9ca3af" /> <rect x="20" y="15" width="2" height="1" rx="0.5" fill="#9ca3af" />

            {/* Divider */}
            <path d="M10,18 L22,18" stroke="#1f2937" strokeWidth="1" strokeDasharray="1 1" />

            {/* Coin Stack Overlay */}
            <circle cx="26" cy="26" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
            <text x="26" y="27.5" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#b45309">€</text>
        </svg>
    );
}
