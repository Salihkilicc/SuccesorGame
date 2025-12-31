import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { theme } from '../../../theme';

// Ortak Bileşenler
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';
import SectionCard from '../../common/SectionCard';

// YENİ SİSTEM
import { PercentageSelector } from '../../atoms/PercentageSelector';
import { useProductionLogic } from '../../../features/products/hooks/useProductionLogic';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const ProductionModal = ({ visible, onClose }: Props) => {
    // Hook'tan verileri çek
    const {
        localEmployeeCount,
        localProductionTarget,
        minEmployees,
        maxEmployees,
        maxProductionPossible,
        handleEmployeeChange,
        handleProductionChange,
        handleConfirm
    } = useProductionLogic(visible, onClose);

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="Production Command"
        >
            <View style={styles.container}>

                {/* 1. İŞÇİ YÖNETİMİ */}
                <PercentageSelector
                    label="Workforce"
                    value={localEmployeeCount}
                    min={minEmployees}
                    max={maxEmployees}
                    onChange={handleEmployeeChange}
                    unit={`/ ${maxEmployees}`}
                />

                {/* 2. ÜRETİM HEDEFİ */}
                <PercentageSelector
                    label="Daily Output"
                    value={localProductionTarget}
                    min={0}
                    max={maxProductionPossible}
                    onChange={handleProductionChange}
                    unit="Units"
                />

                {/* ÖZET KARTI */}
                <View style={styles.infoBox}>
                    <SectionCard
                        title="Factory Efficiency"
                        rightText={`${maxProductionPossible > 0 ? ((localProductionTarget / maxProductionPossible) * 100).toFixed(0) : 0}%`}
                    />
                    <Text style={styles.hint}>
                        * Staff efficiency is 350 units per employee.
                    </Text>
                </View>

                {/* BUTONLAR */}
                <View style={styles.actionRow}>
                    <GameButton
                        title="Execute Orders"
                        onPress={handleConfirm}
                        variant="primary"
                        style={{ flex: 1 }}
                    />
                    <GameButton
                        title="Cancel"
                        onPress={onClose}
                        variant="ghost"
                        style={{ flex: 1 }}
                    />
                </View>

            </View>
        </GameModal>
    );
};

export default ProductionModal;

const styles = StyleSheet.create({
    container: { gap: 12, paddingVertical: 10 },
    infoBox: { gap: 4 },
    hint: { fontSize: 11, color: '#718096', textAlign: 'center', fontStyle: 'italic' },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 }
});