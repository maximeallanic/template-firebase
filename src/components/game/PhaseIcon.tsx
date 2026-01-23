import { PhaseLogo, type PhaseLogoType } from '../PhaseLogo';

type PhaseType = 'nuggets' | 'saltpepper' | 'sweetysalty' | 'menus' | 'addition' | 'burger';

interface PhaseIconProps {
    phase: PhaseType;
    className?: string;
    size?: number;
}

export const PhaseIcon: React.FC<PhaseIconProps> = ({ phase, className = '', size = 32 }) => {
    return <PhaseLogo phase={phase as PhaseLogoType} className={className} size={size} />;
};
