import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../../theme';
import { useStatsStore } from '../../../store/useStatsStore';
import GameModal from '../../common/GameModal';
import SectionCard from '../../common/SectionCard';
import GameButton from '../../common/GameButton';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const DividendModal = ({ visible, onClose }: Props) => {
    const { companyCapital, companyOwnership, payDividend } = useStatsStore();
    const [dividendPercentage, setDividendPercentage] = useState(10);

    const dividendPool = companyCapital * (dividendPercentage / 100);
    const playerDividend = dividendPool * (companyOwnership / 100);
    const remainingCapital = companyCapital - dividendPool;

    // Logic for warning
    const isRisky = remainingCapital < companyCapital * 0.3;

    const handleConfirm = () => {
        if (dividendPercentage <= 0) {
            Alert.alert('Invalid Amount', 'Please select a dividend percentage.');
            return;
        }

        if (dividendPool > companyCapital) {
            Alert.alert('Insufficient Capital', 'Company does not have enough capital for this dividend.');
            return;
        }

        const warningMessage = dividendPercentage > 30
            ? '\n\n⚠️ Warning: This is a large dividend that may impact company operations.'
            : '';

        Alert.alert(
            'Confirm Dividend',
            `Pay ${dividendPercentage.toFixed(1)}% dividend? You will receive $${(playerDividend / 1_000_000).toFixed(2)}M.${warningMessage}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay Dividend',
                    onPress: () => {
                        payDividend(dividendPercentage);
                        onClose();
                        Alert.alert(
                            'Dividend Paid',
                            `$${(playerDividend / 1_000_000).toFixed(2)}M transferred to your personal account.`
                        );
                    },
                },
            ]
        );
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="💸 Pay Dividend"
            subtitle="Distribute profits to shareholders"
        >
            <View style={{ gap: 16 }}>

                {/* Capital Card */}
                <View style={styles.capitalCard}>
                    <Text style={styles.capitalLabel}>Available Capital</Text>
                    <Text style={styles.capitalValue}>
                        ${(companyCapital / 1_000_000).toFixed(2)}M
                    </Text>
                </View>

                {/* Slider Section */}
                <View style={styles.sliderCard}>
                    <View style={styles.sliderHeader}>
                        <Text style={styles.sliderLabel}>Dividend Amount</Text>
                        <Text style={styles.sliderValue}>{dividendPercentage.toFixed(1)}%</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={50}
                        step={1}
                        value={dividendPercentage}
                        onValueChange={setDividendPercentage}
                        minimumTrackTintColor={theme.colors.success}
                        maximumTrackTintColor={theme.colors.cardSoft}
                        thumbTintColor={theme.colors.success}
                    />
                </View>

                {/* Info */}
                <View style={{ gap: 4 }}>
                    <SectionCard
                        title="Total Dividend Pool"
                        rightText={`$${(dividendPool / 1_000_000).toFixed(2)}M`}
                    />
                    <SectionCard
                        title={`Your Share (${companyOwnership.toFixed(1)}%)`}
                        rightText={`+$${(playerDividend / 1_000_000).toFixed(2)}M`}
                        style={{ borderColor: theme.colors.success }}
                        selected
                    />
                    <SectionCard
                        title="Remaining Capital"
                        rightText={`$${(remainingCapital / 1_000_000).toFixed(2)}M`}
                        danger={isRisky}
                    />
                </View>

                {dividendPercentage > 30 && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            ⚠️ High dividend may impact company operations
                        </Text>
                    </View>
                )}

                {/* Actions */}
                <View style={{ gap: 8 }}>
                    <GameButton
                        title="Pay Dividend"
                        onPress={handleConfirm}
                        variant="primary"
                    />
                    <GameButton
                        title="Cancel"
                        onPress={onClose}
                        variant="ghost"
                    />
                </View>

            </View>
        </GameModal>
    );
};

export default DividendModal;

const styles = StyleSheet.create({
    capitalCard: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.success,
    },
    capitalLabel: {
        fontSize: 14,
        color: '#E2E8F0',
        fontWeight: '600',
    },
    capitalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.success,
    },
    sliderCard: {
        backgroundColor: '#2D3748',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#4A5568',
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sliderLabel: {
        fontSize: 14,
        color: '#E2E8F0',
        fontWeight: '600',
    },
    sliderValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.success,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    warningBox: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        alignItems: 'center',
    },
    warningText: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: '600',
    },
});
