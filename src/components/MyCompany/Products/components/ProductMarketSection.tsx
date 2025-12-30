import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../../theme';
import GameButton from '../../../common/GameButton';

interface Props {
    researched: boolean;
    demand: number;
    competition: number;
    onResearch: () => void;
}

const ProductMarketSection = ({ researched, demand, competition, onResearch }: Props) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>MARKET INTELLIGENCE</Text>

            {!researched ? (
                <GameButton
                    title="Perform Market Search ($50k)"
                    variant="primary"
                    onPress={onResearch}
                />
            ) : (
                <View style={styles.statsCard}>
                    <View style={styles.statRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statLabel}>Demand</Text>
                            <View style={styles.barBg}>
                                <View style={[styles.barFill, { width: `${demand}%`, backgroundColor: theme.colors.success }]} />
                            </View>
                        </View>
                        <Text style={styles.statValue}>{demand}%</Text>
                    </View>

                    <View style={styles.statRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statLabel}>Competition</Text>
                            <View style={styles.barBg}>
                                <View style={[styles.barFill, { width: `${competition}%`, backgroundColor: theme.colors.danger }]} />
                            </View>
                        </View>
                        <Text style={styles.statValue}>{competition}%</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginLeft: 4,
        marginBottom: 4,
    },
    statsCard: {
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 12,
        gap: 12,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    barBg: {
        height: 6,
        backgroundColor: theme.colors.card,
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        width: 36,
        textAlign: 'right',
        marginBottom: -2,
    },
});

export default ProductMarketSection;
