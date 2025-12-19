import { useId } from 'react';

type PhaseType = 'nuggets' | 'saltpepper' | 'sweetysalty' | 'menus' | 'addition' | 'burger';

interface PhaseIconProps {
    phase: PhaseType;
    className?: string;
    size?: number;
}

export const PhaseIcon: React.FC<PhaseIconProps> = ({ phase, className = '', size = 32 }) => {
    const id = useId();
    const svgProps = {
        width: size,
        height: size,
        viewBox: '0 0 32 32',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        className,
    };

    switch (phase) {
        case 'nuggets':
            // Crispy Tenders (Strips) - Golden & Appetizing
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-tenders`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fcd34d" /> {/* lighter gold */}
                            <stop offset="100%" stopColor="#d97706" /> {/* amber-600 */}
                        </linearGradient>
                        <filter id={`${id}-crispy`}>
                            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0" in="noise" result="coloredNoise" />
                            <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite" />
                            <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
                        </filter>
                    </defs>

                    {/* Tender 1 (Back/Bottom) */}
                    <path
                        d="M20,12 C24,10 28,14 26,18 C25,21 20,24 16,22 C12,20 18,14 20,12 Z"
                        fill={`url(#${id}-tenders)`}
                        stroke="#b45309"
                        strokeWidth="1"
                        transform="rotate(10, 22, 17)"
                    />

                    {/* Tender 2 (Middle) */}
                    <path
                        d="M10,8 C14,6 18,7 20,10 C22,14 20,18 16,20 C11,22 6,18 6,14 C6,10 8,9 10,8 Z"
                        fill={`url(#${id}-tenders)`}
                        stroke="#b45309"
                        strokeWidth="1"
                    />

                    {/* Tender 3 (Front/Top) */}
                    <path
                        d="M6,16 C10,14 16,14 18,18 C20,22 16,27 11,28 C6,29 2,24 4,20 C4.5,18 5,17 6,16 Z"
                        fill={`url(#${id}-tenders)`}
                        stroke="#b45309"
                        strokeWidth="1"
                    />

                    {/* Texture/Breading dots */}
                    <circle cx="12" cy="12" r="0.5" fill="#78350f" opacity="0.3" />
                    <circle cx="14" cy="16" r="0.5" fill="#78350f" opacity="0.3" />
                    <circle cx="9" cy="22" r="0.5" fill="#78350f" opacity="0.3" />
                    <circle cx="23" cy="15" r="0.5" fill="#78350f" opacity="0.3" />

                    {/* Sauce Cup - Ketchup/BBQ */}
                    <path d="M24,22 C24,22 25,20 28,20 C30,20 30,22 30,22 C30,24 29,26 27,26 C25,26 24,24 24,22 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
                    <ellipse cx="27" cy="22" rx="2" ry="0.8" fill="#fee2e2" opacity="0.5" />
                </svg>
            );

        case 'saltpepper':
            // High Contrast Shakers: Glass (Salt) vs Wood (Pepper)
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-glass-salt`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#e5e7eb" />
                            <stop offset="50%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#d1d5db" />
                        </linearGradient>
                        <linearGradient id={`${id}-wood-pepper`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3f2e26" /> {/* Dark Wood */}
                            <stop offset="50%" stopColor="#5d4037" />
                            <stop offset="100%" stopColor="#3e2723" />
                        </linearGradient>
                    </defs>

                    {/* Salt (Left) - Light/Glass/White */}
                    <g transform="translate(-1, 0)">
                        <path d="M8 10h6l1 3v13c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2V13l1-3z" fill={`url(#${id}-glass-salt)`} stroke="#9ca3af" strokeWidth="1" />
                        <path d="M7 8c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2H7V8z" fill="#9ca3af" stroke="#6b7280" strokeWidth="1" />
                        {/* Salt crystals inside */}
                        <circle cx="11" cy="25" r="5" fill="#fff" opacity="0.5" />
                        <text x="11" y="24" textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">S</text>
                    </g>

                    {/* Pepper (Right) - Dark/Wood */}
                    <g transform="translate(1, 0)">
                        {/* Grinder Body */}
                        <path d="M20 10h6l1 3v13c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V13l1-3z" fill={`url(#${id}-wood-pepper)`} stroke="#271c19" strokeWidth="1" />
                        {/* Grinder Top */}
                        <path d="M19 8c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h-8V8z" fill="#2d1b16" stroke="#000" strokeWidth="1" />
                        {/* Turning knob */}
                        <circle cx="23.5" cy="5" r="1.5" fill="#a16207" stroke="#713f12" />
                        <text x="23.5" y="24" textAnchor="middle" fontSize="10" fill="#a16207" fontWeight="bold">P</text>
                    </g>
                </svg>
            );

        case 'sweetysalty':
            // Sweet (Candy) vs Salty (Pretzel)
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-candy`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f472b6" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <linearGradient id={`${id}-wrapper`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fda4af" />
                            <stop offset="50%" stopColor="#fb7185" />
                            <stop offset="100%" stopColor="#fda4af" />
                        </linearGradient>
                        <linearGradient id={`${id}-pretzel`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                    </defs>

                    {/* Candy (Left) - Sweet */}
                    <g transform="translate(-2, 0)">
                        {/* Wrapper twisted ends */}
                        <path d="M2,14 L6,12 L6,20 L2,18 Z" fill={`url(#${id}-wrapper)`} stroke="#e11d48" strokeWidth="0.5" />
                        <path d="M14,12 L18,14 L18,18 L14,20 Z" fill={`url(#${id}-wrapper)`} stroke="#e11d48" strokeWidth="0.5" />
                        {/* Candy body */}
                        <ellipse cx="10" cy="16" rx="5" ry="4.5" fill={`url(#${id}-candy)`} stroke="#be185d" strokeWidth="1" />
                        {/* Shine */}
                        <ellipse cx="8" cy="14" rx="1.5" ry="1" fill="#fff" opacity="0.5" />
                    </g>

                    {/* Pretzel (Right) - Salty */}
                    <g transform="translate(2, 0)">
                        {/* Pretzel shape - classic twisted form */}
                        <path
                            d="M22,8 C18,8 16,12 18,15 C16,15 16,19 18,21 C16,23 18,26 22,26 C26,26 28,23 26,21 C28,19 28,15 26,15 C28,12 26,8 22,8 Z M22,12 C23,12 24,13 24,14 C24,15 23,16 22,16 C21,16 20,15 20,14 C20,13 21,12 22,12 Z"
                            fill={`url(#${id}-pretzel)`}
                            stroke="#92400e"
                            strokeWidth="1"
                        />
                        {/* Salt crystals */}
                        <circle cx="20" cy="10" r="0.6" fill="#fff" opacity="0.8" />
                        <circle cx="24" cy="11" r="0.5" fill="#fff" opacity="0.8" />
                        <circle cx="19" cy="18" r="0.5" fill="#fff" opacity="0.8" />
                        <circle cx="25" cy="19" r="0.6" fill="#fff" opacity="0.8" />
                        <circle cx="21" cy="24" r="0.5" fill="#fff" opacity="0.8" />
                        <circle cx="23" cy="23" r="0.4" fill="#fff" opacity="0.8" />
                    </g>
                </svg>
            );

        case 'menus':
            // "Les Menus" (Plural) - Fanned Menus
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-menu-1`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fcd34d" />
                            <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                        <linearGradient id={`${id}-menu-2`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fb923c" />
                            <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                        <linearGradient id={`${id}-menu-3`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f87171" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>

                    {/* Menu 1 (Back Left) */}
                    <g transform="rotate(-15, 10, 20)">
                        <rect x="6" y="6" width="14" height="20" rx="1" fill={`url(#${id}-menu-1)`} stroke="#b45309" strokeWidth="0.5" />
                    </g>

                    {/* Menu 2 (Back Right) */}
                    <g transform="rotate(15, 22, 20)">
                        <rect x="12" y="6" width="14" height="20" rx="1" fill={`url(#${id}-menu-3)`} stroke="#991b1b" strokeWidth="0.5" />
                    </g>

                    {/* Menu 3 (Center Front) */}
                    <rect x="9" y="4" width="14" height="24" rx="1" fill={`url(#${id}-menu-2)`} stroke="#c2410c" strokeWidth="0.5" />
                    {/* Lines on Center Menu */}
                    <rect x="11" y="8" width="10" height="2" rx="0.5" fill="#fff" opacity="0.6" />
                    <rect x="11" y="12" width="6" height="1" rx="0.5" fill="#fff" opacity="0.4" />
                    <rect x="11" y="14" width="8" height="1" rx="0.5" fill="#fff" opacity="0.4" />
                    <rect x="11" y="16" width="5" height="1" rx="0.5" fill="#fff" opacity="0.4" />

                    {/* Star */}
                    <circle cx="16" cy="22" r="2" fill="#fff" />
                    <circle cx="16" cy="22" r="1" fill="#f59e0b" />
                </svg>
            );

        case 'addition':
            // "L'Addition" - Receipt + Total + Coins
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-receipt`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f9fafb" />
                            <stop offset="100%" stopColor="#d1d5db" />
                        </linearGradient>
                    </defs>
                    {/* Long Paper */}
                    <path
                        d="M8,2 L24,2 L24,30 L22,28 L20,30 L18,28 L16,30 L14,28 L12,30 L10,28 L8,30 Z"
                        fill={`url(#${id}-receipt)`}
                        stroke="#6b7280"
                        strokeWidth="1"
                    />

                    {/* Header */}
                    <rect x="12" y="5" width="8" height="2" rx="0.5" fill="#1f2937" />

                    {/* Items */}
                    <rect x="10" y="9" width="6" height="1" rx="0.5" fill="#9ca3af" /> <rect x="20" y="9" width="2" height="1" rx="0.5" fill="#9ca3af" />
                    <rect x="10" y="12" width="8" height="1" rx="0.5" fill="#9ca3af" /> <rect x="20" y="12" width="2" height="1" rx="0.5" fill="#9ca3af" />
                    <rect x="10" y="15" width="5" height="1" rx="0.5" fill="#9ca3af" /> <rect x="20" y="15" width="2" height="1" rx="0.5" fill="#9ca3af" />

                    {/* Divider */}
                    <path d="M10,18 L22,18" stroke="#1f2937" strokeWidth="1" strokeDasharray="1 1" />

                    {/* Coin Stack Overlay */}
                    <circle cx="26" cy="26" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
                    <text x="26" y="27.5" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#b45309">€</text>
                </svg>
            );

        case 'burger':
            // "Burger Final" - Epic Double Patty with Bacon/Cheese
            return (
                <svg {...svgProps}>
                    <defs>
                        <linearGradient id={`${id}-bun`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                    </defs>

                    {/* Top bun */}
                    <path d="M4 11c0-4 5.4-7 12-7s12 3 12 7H4z" fill={`url(#${id}-bun)`} stroke="#b45309" strokeWidth="1" />
                    {/* Sesame seeds */}
                    <circle cx="10" cy="8" r="0.8" fill="#fef3c7" /> <circle cx="16" cy="6" r="0.8" fill="#fef3c7" /> <circle cx="22" cy="8" r="0.8" fill="#fef3c7" />

                    {/* Lettuce */}
                    <path d="M3 12 Q6 14 9 12 T15 12 T21 12 T27 12 T29 12 L29 14 L3 14 Z" fill="#4ade80" stroke="#16a34a" strokeWidth="0.5" />

                    {/* Tomato */}
                    <rect x="4" y="14" width="24" height="2" fill="#ef4444" />

                    {/* Patty 1 */}
                    <rect x="5" y="16" width="22" height="3" rx="1" fill="#78350f" />

                    {/* Cheese 1 (Dripping) */}
                    <path d="M4,15 L28,15 L28,17 L24,17 L24,19 L20,17 L14,17 L14,20 L10,17 L4,17 Z" fill="#facc15" />

                    {/* Patty 2 */}
                    <rect x="5" y="21" width="22" height="3" rx="1" fill="#78350f" />

                    {/* Cheese 2 */}
                    <rect x="4" y="20" width="24" height="1" fill="#facc15" />

                    {/* Bottom bun */}
                    <path d="M4 25h24c0 2.5-5.4 4-12 4S4 27.5 4 25z" fill={`url(#${id}-bun)`} stroke="#b45309" strokeWidth="1" />
                </svg>
            );

        default:
            return null;
    }
};
