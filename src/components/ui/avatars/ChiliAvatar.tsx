import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function ChiliAvatar({ className = '', size = 32 }: AvatarProps) {
    const id = useId();
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            className={`drop-shadow-sm ${className}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={`${id}-chili`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="50%" stopColor="#B91C1C" />
                    <stop offset="100%" stopColor="#7F1D1D" />
                </linearGradient>
            </defs>
            <g transform="rotate(45 32 32)">
                {/* Stem */}
                <path d="M30 6H34V12H30V6Z" fill="#166534" />
                <path d="M26 12H38C38 12 36 16 32 16C28 16 26 12 26 12Z" fill="#22C55E" />
                {/* Body */}
                <path d="M26 14C20 18 18 28 22 40C24 48 30 58 32 60C34 58 40 48 42 40C46 28 44 18 38 14H26Z" fill={`url(#${id}-chili)`} />
                {/* Shine */}
                <path d="M28 20C26 26 26 34 28 42" stroke="white" strokeWidth="2" opacity="0.3" strokeLinecap="round" fill="none" />
                {/* Face */}
                <circle cx="28" cy="30" r="3" fill="white" />
                <circle cx="36" cy="30" r="3" fill="white" />
                <circle cx="29" cy="30" r="1.5" fill="#1F2937" />
                <circle cx="35" cy="30" r="1.5" fill="#1F2937" />
                {/* Eyebrows */}
                <path d="M26 26L30 28" stroke="#1F2937" strokeWidth="1.5" />
                <path d="M38 26L34 28" stroke="#1F2937" strokeWidth="1.5" />
                {/* Mouth */}
                <path d="M30 36C31 35 33 35 34 36" stroke="#1F2937" strokeWidth="1.5" />
            </g>
        </svg>
    );
}
