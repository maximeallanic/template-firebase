import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function CupcakeAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-wrapper`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#BE185D" />
                </linearGradient>
                <linearGradient id={`${id}-frosting`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F9A8D4" />
                    <stop offset="100%" stopColor="#F472B6" />
                </linearGradient>
            </defs>
            {/* Wrapper */}
            <path d="M16 38L20 56H44L48 38H16Z" fill={`url(#${id}-wrapper)`} />
            <path d="M18 38L21 56M24 38L26 56M30 38L31 56M34 38L33 56M40 38L38 56M46 38L43 56" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Cake */}
            <path d="M14 38C14 34 20 30 32 30C44 30 50 34 50 38H14Z" fill="#F59E0B" />
            {/* Frosting */}
            <path d="M32 8C42 8 48 16 48 24C48 30 44 32 40 30C36 28 38 24 32 24C26 24 28 28 24 30C20 32 16 30 16 24C16 16 22 8 32 8Z" fill={`url(#${id}-frosting)`} />
            <path d="M32 8C28 8 24 12 24 16" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Cherry */}
            <circle cx="32" cy="8" r="4" fill="#EF4444" />
            <path d="M32 4L36 0" stroke="#166534" strokeWidth="2" />
            {/* Face */}
            <circle cx="26" cy="22" r="3" fill="white" />
            <circle cx="38" cy="22" r="3" fill="white" />
            <circle cx="27" cy="22" r="1.5" fill="#1F2937" />
            <circle cx="39" cy="22" r="1.5" fill="#1F2937" />
            <path d="M29 26C30 28 34 28 35 26" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
