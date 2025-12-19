import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function WatermelonAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-flesh`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
                <linearGradient id={`${id}-rind`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" />
                    <stop offset="100%" stopColor="#15803D" />
                </linearGradient>
            </defs>
            {/* Rind */}
            <path d="M8 32C8 45.3 18.7 56 32 56C45.3 56 56 45.3 56 32" fill={`url(#${id}-rind)`} />
            <path d="M11 32C11 43.6 20.4 53 32 53C43.6 53 53 43.6 53 32" fill="#DCFCE7" />
            {/* Flesh */}
            <path d="M14 32C14 41.9 22.1 50 32 50C41.9 50 50 41.9 50 32H14Z" fill={`url(#${id}-flesh)`} />
            {/* Seeds */}
            <circle cx="24" cy="38" r="2" fill="#1F2937" />
            <circle cx="40" cy="38" r="2" fill="#1F2937" />
            <circle cx="32" cy="44" r="2" fill="#1F2937" />
            {/* Face */}
            <circle cx="26" cy="32" r="3" fill="white" />
            <circle cx="38" cy="32" r="3" fill="white" />
            <circle cx="27" cy="32" r="1.5" fill="#1F2937" />
            <circle cx="39" cy="32" r="1.5" fill="#1F2937" />
            <path d="M29 36C30 37 34 37 35 36" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
            {/* Highlight */}
            <path d="M18 32Q22 36 26 32" stroke="white" opacity="0.2" strokeWidth="2" fill="none" />
        </svg>
    );
}
