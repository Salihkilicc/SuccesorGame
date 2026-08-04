import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, StyleSheet, Text } from 'react-native';
import { theme } from '../../../core/theme';

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
    useLocale();
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
            title={t('ui.productionCommand')}
        >
            <View style={styles.container}>

                {/* 1. İŞÇİ YÖNETİMİ */}
                <PercentageSelector
                    label={t('ui.workforce')}
                    value={localEmployeeCount}
                    min={minEmployees}
                    max={maxEmployees}
                    onChange={handleEmployeeChange}
                    unit={`/ ${maxEmployees}`}
                />

                {/* 2. ÜRETİM HEDEFİ */}
                <PercentageSelector
                    label={t('ui.dailyOutput')}
                    value={localProductionTarget}
                    min={0}
                    max={maxProductionPossible}
                    onChange={handleProductionChange}
                    unit="Units"
                />

                {/* ÖZET KARTI */}
                <View style={styles.infoBox}>
                    <SectionCard
                        title={t('ui.factoryEfficiency')}
                        rightText={`${maxProductionPossible > 0 ? ((localProductionTarget / maxProductionPossible) * 100).toFixed(0) : 0}%`}
                    />
                    <Text style={styles.hint}>
                        * Staff efficiency is 350 units per employee.
                    </Text>
                </View>

                {/* BUTONLAR */}
                <View style={styles.actionRow}>
                    <GameButton
                        title={t('ui.executeOrders')}
                        onPress={handleConfirm}
                        variant="primary"
                        style={{ flex: 1 }}
                    />
                    <GameButton
                        title={t('ui.cancel')}
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