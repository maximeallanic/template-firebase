import { useState, useEffect, type ReactNode } from 'react';
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
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Show modal when authenticated user has incomplete profile
        if (needsSetup && !loading) {
            setShowModal(true);
        }
    }, [needsSetup, loading]);

    const handleComplete = async () => {
        // Refresh profile to update state
        await refreshProfile();
        setShowModal(false);
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
