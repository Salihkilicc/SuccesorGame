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

const BuybackModal = ({ visible, onClose }: Props) => {
    const { companyValue, companyOwnership, companyCapital, performBuyback } = useStatsStore();
    const [buybackPercentage, setBuybackPercentage] = useState(1);

    const cost = companyValue * (buybackPercentage / 100);
    const multiplier = 1 / (1 - (buybackPercentage / 100));
    // Check constraint: logic preserved
    const newOwnership = Math.min(100, companyOwnership * multiplier);

    // Check affordability
    const isAffordable = companyCapital >= cost;

    const handleConfirm = () => {
        if (buybackPercentage <= 0) {
            Alert.alert('Invalid Amount', 'Please select a percentage.');
            return;
        }
        if (!isAffordable) {
            Alert.alert('Insufficient Capital', `Company needs $${(cost / 1_000_000).toFixed(1)}M to buy back shares.`);
            return;
        }

        Alert.alert(
            'Confirm Buyback',
            `Spend $${(cost / 1_000_000).toFixed(1)}M to buy back ${buybackPercentage.toFixed(1)}% of shares?\n\nThis will increase your ownership to ${newOwnership.toFixed(1)}%.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: () => {
                        performBuyback(buybackPercentage);
                        onClose();
                        Alert.alert(
                            'Buyback Complete',
                            `Company shares retired. Your ownership increased to ${newOwnership.toFixed(1)}%.`
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
            title="📈 Share Buyback"
            subtitle="Retire shares to increase ownership"
        >
            <View style={{ gap: 16 }}>

                {/* Visual Description handled by subtitle mostly, but can add more if needed */}

                {/* Slider Section */}
                <View style={styles.sliderCard}>
                    <View style={styles.sliderHeader}>
                        <Text style={styles.sliderLabel}>Buyback Amount</Text>
                        <Text style={styles.sliderValue}>{buybackPercentage.toFixed(1)}%</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={0.5}
                        maximumValue={10}
                        step={0.5}
                        value={buybackPercentage}
                        onValueChange={setBuybackPercentage}
                        minimumTrackTintColor={theme.colors.success}
                        maximumTrackTintColor={theme.colors.cardSoft}
                        thumbTintColor={theme.colors.success}
                    />
                </View>

                {/* Calculation Info */}
                <View style={{ gap: 4 }}>
                    <SectionCard
                        title="Cost (Capital)"
                        rightText={`-$${(cost / 1_000_000).toFixed(2)}M`}
                        danger={!isAffordable}
                    />
                    <SectionCard
                        title="Available Capital"
                        rightText={`$${(companyCapital / 1_000_000).toFixed(2)}M`}
                    />
                    <SectionCard
                        title="New Ownership"
                        rightText={`${newOwnership.toFixed(2)}%`}
                        style={{ borderColor: theme.colors.success }}
                        selected
                    />
                </View>

                {/* Actions */}
                <View style={{ gap: 8 }}>
                    <GameButton
                        title="Confirm Buyback"
                        onPress={handleConfirm}
                        disabled={!isAffordable}
                        variant={!isAffordable ? 'secondary' : 'primary'}
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

export default BuybackModal;

const styles = StyleSheet.create({
    sliderCard: {
        backgroundColor: '#2D3748', // Matching SectionCard bg
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
});
