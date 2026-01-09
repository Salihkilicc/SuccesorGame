import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../../core/theme';
import { ActivityType, CompanionType } from './useTravelSystem';
import GameModal from '../../../../components/common/GameModal';
import GameButton from '../../../../components/common/GameButton';

interface TravelResultModalProps {
    visible: boolean;
    onClose: () => void;
    country: string;
    activity: ActivityType;
    companion: CompanionType | null;
    partnerName?: string;
    cost: number;
    enjoyment: number;
}

const TravelResultModal = ({
    visible,
    onClose,
    country,
    activity,
    companion,
    partnerName,
    cost,
    enjoyment,
}: TravelResultModalProps) => {

    const getCompanionText = () => {
        switch (companion) {
            case 'Partner': return partnerName || 'your partner';
            case 'Kids': return 'your kids';
            case 'Family': return 'your family';
            default: return 'yourself';
        }
    };

    // Simple progress bar component
    const ProgressBar = ({ value }: { value: number }) => {
        // Determine color based on value
        let color: string = theme.colors.error;
        if (value > 60) color = '#F59E0B'; // Orange/Yellow
        if (value > 80) color = theme.colors.success; // Green

        return (
            <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                    <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.progressText}>{value}% Enjoyment</Text>
            </View>
        );
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="Bon Voyage!"
            subtitle="Trip Summary"
        >
            <Text style={styles.headerEmoji}>✈️🌍</Text>

            <Text style={styles.description}>
                You traveled to <Text style={styles.highlight}>{country}</Text> for a{' '}
                <Text style={styles.highlight}>{activity}</Text> with{' '}
                <Text style={styles.highlight}>{getCompanionText()}</Text>.
            </Text>

            <View style={styles.costContainer}>
                <Text style={styles.costLabel}>Total Cost</Text>
                <Text style={styles.costValue}>-${cost.toLocaleString()}</Text>
            </View>

            <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Your Enjoyment</Text>
                <ProgressBar value={enjoyment} />
            </View>

            <GameButton
                title="OK"
                onPress={onClose}
                variant="primary"
                style={{ marginTop: 20 }}
            />
        </GameModal>
    );
};

const styles = StyleSheet.create({
    headerEmoji: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    description: {
        fontSize: theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
    },
    highlight: {
        color: theme.colors.textPrimary,
        fontWeight: '700',
    },
    costContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    costLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        fontWeight: '700',
        marginBottom: 4,
    },
    costValue: {
        fontSize: 24,
        fontWeight: '800', // Heavy bold
        color: theme.colors.error, // Red for cost deduction
    },
    resultContainer: {
        width: '100%',
        marginBottom: theme.spacing.xl,
    },
    resultLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
        textAlign: 'left',
    },
    progressContainer: {
        width: '100%',
    },
    progressBackground: {
        height: 12,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 999,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    progressText: {
        textAlign: 'right',
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '700',
    },
});

export default TravelResultModal;
