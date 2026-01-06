import { type ReactNode } from 'react';
import { useProfileComplete } from '../../hooks/useProfileComplete';
import { useAuthUser } from '../../hooks/useAuthUser';
import { MandatoryProfileSetupModal } from './MandatoryProfileSetupModal';

interface ProfileGateProps {
    children: ReactNode;
}

/**
 * Wrapper component that shows a mandatory profile setup modal
 * when an authenticated user has an incomplete profile.
 * The modal cannot be dismissed without completing the profile.
 */
export function ProfileGate({ children }: ProfileGateProps) {
    const { needsSetup, loading } = useProfileComplete();
    const { refreshProfile } = useAuthUser();

    // Only show modal when loading is complete AND profile setup is needed
    // This prevents flash of modal during profile loading/migration
    const showModal = !loading && needsSetup;

    const handleComplete = async () => {
        // Refresh profile to update state
        await refreshProfile();
    };

    return (
        <>
            {children}
            <MandatoryProfileSetupModal
                isOpen={showModal}
                onComplete={handleComplete}
            />
        </>
    );
}
