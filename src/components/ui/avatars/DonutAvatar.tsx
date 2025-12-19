import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function DonutAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-dough`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id={`${id}-glaze`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F9A8D4" />
                    <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
            </defs>
            {/* Donut Body */}
            <circle cx="32" cy="32" r="24" fill={`url(#${id}-dough)`} />
            <circle cx="32" cy="32" r="8" fill="#1F2937" />
            {/* Glaze */}
            <path d="M32 12C46 12 53 22 53 30C53 34 50 38 46 36C42 34 40 38 36 36C32 34 30 38 26 36C22 34 18 36 14 34C14 20 22 12 32 12Z" fill={`url(#${id}-glaze)`} />
            {/* Light Reflection */}
            <path d="M16 20Q24 14 32 14" stroke="white" strokeWidth="3" opacity="0.3" strokeLinecap="round" fill="none" />
            {/* Sprinkles */}
            <rect x="20" y="20" width="4" height="2" rx="1" fill="#FEF3C7" transform="rotate(-30 20 20)" />
            <rect x="36" y="18" width="4" height="2" rx="1" fill="#60A5FA" transform="rotate(15 36 18)" />
            <rect x="44" y="26" width="4" height="2" rx="1" fill="#A78BFA" transform="rotate(-10 44 26)" />
            <rect x="24" y="16" width="4" height="2" rx="1" fill="#34D399" transform="rotate(45 24 16)" />
            <rect x="18" y="30" width="4" height="2" rx="1" fill="#FCD34D" transform="rotate(80 18 30)" />
            {/* Face */}
            <circle cx="24" cy="28" r="3" fill="white" />
            <circle cx="40" cy="28" r="3" fill="white" />
            <circle cx="25" cy="28" r="1.5" fill="#1F2937" />
            <circle cx="41" cy="28" r="1.5" fill="#1F2937" />
            <path d="M28 34C30 37 34 37 36 34" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
