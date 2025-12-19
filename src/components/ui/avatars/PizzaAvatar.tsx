import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function PizzaAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-crust`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id={`${id}-cheese`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#EAB308" />
                </linearGradient>
                <linearGradient id={`${id}-pep`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#B91C1C" />
                </linearGradient>
            </defs>
            <g filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.1))">
                {/* Slice */}
                <path d="M32 8L58 52C58 52 48 56 32 56C16 56 6 52 6 52L32 8Z" fill={`url(#${id}-cheese)`} stroke={`url(#${id}-crust)`} strokeWidth="4" strokeLinejoin="round" />
                {/* Crust Top Detail */}
                <path d="M10 48C10 48 18 46 32 46C46 46 54 48 54 48" stroke="#F59E0B" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
                {/* Pepperoni */}
                <circle cx="32" cy="26" r="5" fill={`url(#${id}-pep)`} />
                <circle cx="24" cy="40" r="4" fill={`url(#${id}-pep)`} />
                <circle cx="42" cy="38" r="4" fill={`url(#${id}-pep)`} />
                {/* Face */}
                <circle cx="26" cy="22" r="3" fill="white" />
                <circle cx="38" cy="22" r="3" fill="white" />
                <circle cx="27" cy="22" r="1.5" fill="#1F2937" />
                <circle cx="39" cy="22" r="1.5" fill="#1F2937" />
                <path d="M29 28C30 30 32 30 35 28" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
            </g>
        </svg>
    );
}
