import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

// Common Components
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';
import SectionCard from '../../common/SectionCard';

// YENİ BİLEŞEN (Artık Slider Yok)
import { PercentageSelector } from '../../atoms/PercentageSelector';
import { useDividendLogic } from '../../../features/finance/hooks/useDividendLogic';

interface Props {
    visible: boolean;
    onClose: () => void;
}

/**
 * Component: DividendModal
 * * Updated to use PercentageSelector for better performance.
 */
const DividendModal = ({ visible, onClose }: Props) => {
    
    const {
        dividendPercentage,
        setDividendPercentage,
        availableCash,
        distributionAmount,
        playerDividend,
        remainingCapital,
        playerSharePercentage,
        isRisky,
        handleConfirm
    } = useDividendLogic(visible, onClose);

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="Distribute Dividends"
        >
            <View style={styles.container}>

                {/* Capital Header */}
                <View style={styles.capitalCard}>
                    <Text style={styles.capitalLabel}>Available Cash</Text>
                    <Text style={styles.capitalValue}>
                        ${(availableCash / 1_000_000).toFixed(2)}M
                    </Text>
                </View>

                {/* YENİ KONTROL PANELİ */}
                {/* CustomSlider ve sliderCard yerine bu tek satır yeterli */}
                <PercentageSelector
                    label="Distribution Rate"
                    value={dividendPercentage}
                    min={0}
                    max={50} // Maksimum %50 dağıtılsın
                    onChange={setDividendPercentage}
                    unit="%"
                />

                {/* Calculations */}
                <View style={styles.detailsContainer}>
                    <SectionCard
                        title="Total Distribution"
                        rightText={`$${(distributionAmount / 1_000_000).toFixed(2)}M`}
                    />
                    <SectionCard
                        title={`Your Share (${playerSharePercentage}%)`}
                        rightText={`+$${(playerDividend / 1_000_000).toFixed(2)}M`}
                        style={{ borderColor: theme.colors.success }}
                    />
                    <SectionCard
                        title="Remaining Capital"
                        rightText={`$${(remainingCapital / 1_000_000).toFixed(2)}M`}
                    />
                </View>

                {/* Risk Warning */}
                {isRisky && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            ⚠️ High dividend may impact company operations!
                        </Text>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <GameButton
                        title="Distribute"
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

export default DividendModal;

const styles = StyleSheet.create({
    container: {
        gap: 16,
        paddingVertical: 10,
    },
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
        fontWeight: '600'
    },
    capitalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.success
    },
    // Eski Slider stillerini temizledim (sliderCard, sliderHeader vb.)
    // PercentageSelector kendi stilini yönetiyor.
    detailsContainer: {
        gap: 8,
        marginTop: 4
    },
    warningBox: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        alignItems: 'center',
    },
    warningText: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: '600'
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    }
});