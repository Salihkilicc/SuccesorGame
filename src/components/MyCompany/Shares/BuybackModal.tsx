import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../../theme';
import GameModal from '../../common/GameModal';
import SectionCard from '../../common/SectionCard';
import GameButton from '../../common/GameButton';
import { PercentageSelector } from '../../atoms/PercentageSelector';
// 👇 YOL GÜNCELLENDİ
import { useBuybackLogic } from './logic/useBuybackLogic';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const BuybackModal = ({ visible, onClose }: Props) => {
    const { 
        buybackPercentage, 
        setBuybackPercentage, 
        cost, 
        newOwnership, 
        companyCapital, 
        isAffordable, 
        handleConfirm 
    } = useBuybackLogic(onClose);

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="📈 Share Buyback"
            subtitle="Retire shares to increase ownership"
        >
            <View style={{ gap: 16 }}>
                <PercentageSelector
                    label="Buyback Amount"
                    value={buybackPercentage}
                    min={0.5}
                    max={10}
                    onChange={setBuybackPercentage}
                    unit="%"
                />

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

const styles = StyleSheet.create({}); // Stil gerekirse buraya eklenir, şu an inline stiller yeterli.