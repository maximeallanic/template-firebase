import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useAppInstall } from '../../hooks/useAppInstall';

interface PWABackButtonProps {
  /** Custom click handler. If not provided, navigates to home */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * Back button that only appears in PWA mode.
 * Used for navigation on screens where users need to go back.
 */
export function PWABackButton({ onClick, className = '' }: PWABackButtonProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { isInstalled } = useAppInstall();

  // Only render in PWA mode
  if (!isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors ${className}`}
    >
      <ArrowLeft className="w-5 h-5" />
      <span>{t('buttons.back', 'Retour')}</span>
    </button>
  );
}
