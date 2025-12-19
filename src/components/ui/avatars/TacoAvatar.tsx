import { useId } from 'react';

interface AvatarProps {
    className?: string;
    size?: number;
}

export function TacoAvatar({ className = '', size = 32 }: AvatarProps) {
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
                <linearGradient id={`${id}-shell`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
                <linearGradient id={`${id}-meat`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#78350F" />
                    <stop offset="100%" stopColor="#451a03" />
                </linearGradient>
            </defs>
            {/* Rear Shell */}
            <path d="M12 44C12 28 22 16 36 16C50 16 60 28 60 44" fill={`url(#${id}-shell)`} opacity="0.8" />
            {/* Meat */}
            <path d="M14 44C14 30 24 20 36 20C48 20 56 30 56 44" fill={`url(#${id}-meat)`} />
            {/* Lettuce */}
            <path d="M16 34C20 38 24 34 28 38C32 34 36 38 40 34C44 38 48 34 52 38" stroke="#4ADE80" strokeWidth="6" strokeLinecap="round" />
            {/* Tomatoes */}
            <circle cx="24" cy="34" r="3" fill="#EF4444" />
            <circle cx="40" cy="34" r="3" fill="#EF4444" />
            {/* Front Shell */}
            <path d="M8 44C8 26 18 14 34 14C50 14 60 26 60 44H8Z" fill="none" stroke={`url(#${id}-shell)`} strokeWidth="0" />
            <path d="M6 46C6 28 16 16 32 16C46 16 56 28 56 46" fill={`url(#${id}-shell)`} stroke="#D97706" strokeWidth="2" />
            {/* Face */}
            <g transform="translate(-2, 4)">
                <circle cx="24" cy="30" r="3" fill="white" />
                <circle cx="40" cy="30" r="3" fill="white" />
                <circle cx="25" cy="30" r="1.5" fill="#1F2937" />
                <circle cx="41" cy="30" r="1.5" fill="#1F2937" />
                <path d="M28 34C30 36 34 36 36 34" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
            </g>
        </svg>
    );
}
