import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function SushiAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-rice`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F9FAFB" />
                    <stop offset="100%" stopColor="#D1D5DB" />
                </linearGradient>
                <linearGradient id={`${id}-nori`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#374151" />
                    <stop offset="100%" stopColor="#111827" />
                </linearGradient>
                <linearGradient id={`${id}-salmon`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FB7185" />
                    <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
            </defs>
            {/* Nori */}
            <rect x="10" y="24" width="44" height="24" rx="4" fill={`url(#${id}-nori)`} />
            {/* Rice Top */}
            <ellipse cx="32" cy="24" rx="20" ry="8" fill={`url(#${id}-rice)`} />
            {/* Salmon Filling */}
            <circle cx="32" cy="24" r="6" fill={`url(#${id}-salmon)`} />
            <path d="M28 22C30 20 34 20 36 22" stroke="white" strokeWidth="1" opacity="0.4" />
            {/* Face on Nori */}
            <circle cx="24" cy="36" r="3" fill="white" />
            <circle cx="40" cy="36" r="3" fill="white" />
            <circle cx="25" cy="36" r="1.5" fill="#1F2937" />
            <circle cx="41" cy="36" r="1.5" fill="#1F2937" />
            {/* Blush */}
            <ellipse cx="18" cy="40" rx="3" ry="2" fill="#F472B6" opacity="0.5" />
            <ellipse cx="46" cy="40" rx="3" ry="2" fill="#F472B6" opacity="0.5" />
            <path d="M29 40C30 42 34 42 35 40" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
