import React from 'react';
import GameModal from '../../../../components/common/GameModal';
import GameButton from '../../../../components/common/GameButton';
import SanctuaryMenuGrid from './components/SanctuaryMenuGrid';

type SanctuaryHubModalProps = {
    visible: boolean;
    onClose: () => void;
    onOpenGrooming: () => void;
    onOpenMassage: () => void;
    onOpenSunStudio: () => void;
    onOpenSurgery: () => void;
    onBuyMembership: () => void;
    isVIPMember: boolean;
};

const SanctuaryHubModal = ({
    visible,
    onClose,
    onOpenGrooming,
    onOpenMassage,
    onOpenSunStudio,
    onOpenSurgery,
    onBuyMembership,
    isVIPMember,
}: SanctuaryHubModalProps) => {
    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="THE WELLNESS SANCTUARY"
            subtitle="Luxury Care & Aesthetic Perfection">

            <SanctuaryMenuGrid
                onOpenGrooming={onOpenGrooming}
                onOpenMassage={onOpenMassage}
                onOpenSunStudio={onOpenSunStudio}
                onOpenSurgery={onOpenSurgery}
                onBuyMembership={onBuyMembership}
                isVIPMember={isVIPMember}
            />

            <GameButton
                title="Leave Sanctuary"
                variant="ghost"
                onPress={onClose}
                style={{ marginTop: 24 }}
            />
        </GameModal>
    );
};

export default SanctuaryHubModal;
