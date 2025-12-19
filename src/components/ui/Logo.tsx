interface LogoProps {
    className?: string;
}

export function Logo({ className = '' }: LogoProps) {
    return <img src="/logo.svg" className={className} alt="Spicy vs Sweet Logo" />;
}