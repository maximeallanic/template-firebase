import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function BurgerAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-meat`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#92400E" />
                    <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
                <linearGradient id={`${id}-cheese`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#EAB308" />
                </linearGradient>
                <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.2" />
                </filter>
            </defs>
            {/* Bun bottom */}
            <path d="M10 44H54V48C54 52.4 50.4 56 46 56H18C13.6 56 10 52.4 10 48V44Z" fill={`url(#${id}-bun)`} filter={`url(#${id}-shadow)`} />
            {/* Lettuce */}
            <path d="M6 38C10 41 14 38 18 41C22 38 26 41 30 38C34 41 38 38 42 41C46 38 50 41 54 38C58 41 58 40 58 40H6" fill="#4ADE80" />
            {/* Patty */}
            <rect x="8" y="32" width="48" height="10" rx="3" fill={`url(#${id}-meat)`} />
            {/* Cheese */}
            <path d="M6 38L10 44H54L58 38H6Z" fill={`url(#${id}-cheese)`} />
            <path d="M14 44V48C14 49.1 14.9 50 16 50C17.1 50 18 49.1 18 48V44" fill={`url(#${id}-cheese)`} />
            <path d="M40 44V47C40 48.1 40.9 49 42 49C43.1 49 44 48.1 44 47V44" fill={`url(#${id}-cheese)`} />
            {/* Bun top */}
            <path d="M8 28C8 17 17 8 32 8C47 8 56 17 56 28H8Z" fill={`url(#${id}-bun)`} />
            {/* Sesame seeds */}
            <circle cx="20" cy="18" r="1.5" fill="#FEF3C7" opacity="0.8" />
            <circle cx="32" cy="14" r="1.5" fill="#FEF3C7" opacity="0.8" />
            <circle cx="44" cy="18" r="1.5" fill="#FEF3C7" opacity="0.8" />
            <circle cx="26" cy="24" r="1.5" fill="#FEF3C7" opacity="0.8" />
            <circle cx="38" cy="24" r="1.5" fill="#FEF3C7" opacity="0.8" />
            {/* Face */}
            <circle cx="22" cy="36" r="3" fill="white" />
            <circle cx="42" cy="36" r="3" fill="white" />
            <circle cx="23" cy="36" r="1.5" fill="#1F2937" />
            <circle cx="43" cy="36" r="1.5" fill="#1F2937" />
            <path d="M28 40C28 42 30 43 32 43C34 43 36 42 36 40" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
