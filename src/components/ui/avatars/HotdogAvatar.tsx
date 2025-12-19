import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function HotdogAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-bun`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
                <linearGradient id={`${id}-sausage`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#B91C1C" />
                </linearGradient>
            </defs>
            <g transform="rotate(-10 32 32)">
                {/* Bun Back */}
                <path d="M14 26C14 22 20 18 32 18C44 18 50 22 50 26V46C50 50 44 54 32 54C20 54 14 50 14 46V26Z" fill={`url(#${id}-bun)`} />
                {/* Sausage */}
                <rect x="18" y="14" width="28" height="44" rx="14" fill={`url(#${id}-sausage)`} />
                <path d="M22 20C22 20 24 18 32 18C40 18 42 20 42 20" stroke="#FFF" opacity="0.3" strokeWidth="2" strokeLinecap="round" />
                {/* Mustard */}
                <path d="M28 16C28 16 36 20 28 24C20 28 28 32 36 36C44 40 36 44 28 48" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
                {/* Bun Front */}
                <path d="M14 28C14 28 12 36 12 40C12 48 18 54 32 54C46 54 52 48 52 40C52 36 50 28 50 28" fill="none" stroke={`url(#${id}-bun)`} strokeWidth="4" />
                {/* Face */}
                <circle cx="26" cy="34" r="3" fill="white" />
                <circle cx="38" cy="34" r="3" fill="white" />
                <circle cx="27" cy="34" r="1.5" fill="#1F2937" />
                <circle cx="39" cy="34" r="1.5" fill="#1F2937" />
                <path d="M30 38C31 39 33 39 34 38" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
            </g>
        </svg>
    );
}
