import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../../core/theme';
import GameButton from '../../../common/GameButton';

interface Props {
    price: number;
    onPriceChange: (delta: number) => void;
}

const ProductPricingSection = ({ price, onPriceChange }: Props) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>PRICING STRATEGY</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Sale Price</Text>
                <View style={styles.row}>
                    <Text style={styles.priceDisplay}>${price}</Text>
                    <View style={styles.controls}>
                        <GameButton
                            title="-$5"
                            variant="ghost"
                            onPress={() => onPriceChange(-5)}
                            style={styles.btn}
                            textStyle={{ fontSize: 12 }}
                        />
                        <GameButton
                            title="+$5"
                            variant="ghost"
                            onPress={() => onPriceChange(5)}
                            style={styles.btn}
                            textStyle={{ fontSize: 12 }}
                        />
                    </View>
                </View>
            </View>
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
    card: {
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 12,
    },
    label: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceDisplay: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    controls: {
        flexDirection: 'row',
        gap: 8,
    },
    btn: {
        minWidth: 50,
        height: 32,
        paddingVertical: 0,
    },
});

export default ProductPricingSection;
