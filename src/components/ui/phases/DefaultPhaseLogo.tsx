interface PhaseLogoProps {
    className?: string;
    size?: number;
}

export function DefaultPhaseLogo({ className = '', size = 32 }: PhaseLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Default placeholder - question mark in circle */}
            <circle cx="16" cy="16" r="14" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
            <text x="16" y="22" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b7280">?</text>
        </svg>
    );
}
