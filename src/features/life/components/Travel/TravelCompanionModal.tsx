import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../../core/theme';
import { CompanionType } from './useTravelSystem';
import GameModal from '../../../../components/common/GameModal';
import SectionCard from '../../../../components/common/SectionCard';
import GameButton from '../../../../components/common/GameButton';

interface TravelCompanionModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (companion: CompanionType) => void;
    hasPartner: boolean;
    hasChildren: boolean;
    partnerName?: string;
    childrenCount: number;
}

const TravelCompanionModal = ({
    visible,
    onClose,
    onConfirm,
    hasPartner,
    hasChildren,
    partnerName,
    childrenCount,
}: TravelCompanionModalProps) => {

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="Travel Companion 👥"
            subtitle="Who are you taking with you?"
        >
            <View style={styles.optionsContainer}>
                {/* Myself */}
                <SectionCard
                    title="Go by Myself"
                    subtitle="Standard Cost (x1)"
                    rightText="👤"
                    onPress={() => onConfirm('Myself')}
                    style={styles.card}
                />

                {/* Partner */}
                <SectionCard
                    title={hasPartner ? `Bring ${partnerName}` : 'No Partner'}
                    subtitle="Cost x2"
                    rightText="❤️"
                    onPress={hasPartner ? () => onConfirm('Partner') : undefined}
                    style={styles.card}
                    danger={!hasPartner}
                />

                {/* Kids */}
                <SectionCard
                    title="Bring Kids"
                    subtitle={hasChildren ? `Cost x${childrenCount + 1} (You + Kids)` : 'No Children'}
                    rightText="🍼"
                    onPress={hasChildren ? () => onConfirm('Kids') : undefined}
                    style={styles.card}
                    danger={!hasChildren}
                />

                {/* Family (Partner + Kids) */}
                <SectionCard
                    title="Bring Whole Family"
                    subtitle={hasChildren && hasPartner ? `Cost x${childrenCount + 2}` : 'Family incomplete'}
                    rightText="👨‍👩‍👧‍👦"
                    onPress={(hasChildren && hasPartner) ? () => onConfirm('Family') : undefined}
                    style={styles.card}
                    danger={!hasChildren || !hasPartner}
                />
            </View>

            <GameButton
                title="Cancel Trip"
                onPress={onClose}
                variant="ghost"
                style={{ marginTop: 12 }}
            />
        </GameModal>
    );
};

const styles = StyleSheet.create({
    optionsContainer: {
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    card: {
        marginBottom: 0,
    }
});

export default TravelCompanionModal;
