import React, { useEffect, useRef } from 'react';
import { t, useLocale } from '../../../../core/i18n';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Dimensions } from 'react-native';
import { BlackMarketItem } from './blackMarketData';
import { useStatsStore } from '../../../../core/store/useStatsStore';

// --- PROPS ---

interface BlackMarketDealViewProps {
    deal: BlackMarketItem;
    onBuy: () => void;
    onPass: () => void;
    onConsume: (item: BlackMarketItem) => void;
    isDrug: boolean;
}

// --- CONSTANTS ---

const { width } = Dimensions.get('window');

// --- COMPONENT ---

export const BlackMarketDealView: React.FC<BlackMarketDealViewProps> = ({
    deal,
    onBuy,
    onPass,
    onConsume,
    isDrug
}) => {
    useLocale();
    const { money } = useStatsStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Fade In Animation
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, []);

    const canAfford = money >= deal.price;

    const handleMainAction = () => {
        if (isDrug) {
            onConsume(deal);
        } else {
            onBuy();
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

            {/* Header / Title */}
            <Text style={styles.title}>
                {isDrug ? '🧪 SUBSTANCE ACQUIRED' : '📦 EXCLUSIVE OFFER'}
            </Text>

            {/* Item Card */}
            <View style={styles.card}>
                {/* Placeholder Icon */}
                <View style={[styles.iconContainer, isDrug && styles.drugIconContainer]}>
                    <Text style={styles.icon}>{isDrug ? '💊' : '🏺'}</Text>
                </View>

                {/* Details */}
                <Text style={styles.itemName}>{deal.name}</Text>
                <Text style={styles.itemDesc}>{deal.description}</Text>

                <View style={styles.divider} />

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>{t('life.price')}</Text>
                        <Text style={styles.statValue}>${deal.price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>{t('life.streetRep')}</Text>
                        <Text style={styles.statGain}>+{deal.streetRepGain.toFixed(1)}</Text>
                    </View>
                    {deal.tier === 4 && (
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('life.highSociety2')}</Text>
                            <Text style={[styles.statGain, { color: '#E3A857' }]}>+5</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.passButton]}
                    onPress={onPass}
                >
                    <Text style={styles.passButtonText}>{t('life.pass')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        isDrug ? styles.consumeButton : styles.buyButton,
                        !canAfford && styles.disabledButton
                    ]}
                    onPress={handleMainAction}
                    disabled={!canAfford}
                >
                    <Text style={styles.actionButtonText}>
                        {isDrug ? 'CONSUME' : `BUY`}
                    </Text>
                    {!isDrug && (
                        <Text style={styles.priceSubtext}>
                            (${deal.price.toLocaleString()})
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {!canAfford && (
                <Text style={styles.warningText}>{t('life.insufficientFunds')}</Text>
            )}

        </Animated.View>
    );
};

// --- STYLES ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#E06B6B',
        marginBottom: 30,
        textShadowColor: '#E06B6B',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        fontFamily: 'Courier New'
    },
    card: {
        width: '100%',
        backgroundColor: '#000000',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#31241F',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#473633'
    },
    drugIconContainer: {
        borderColor: '#E06B6B',
        backgroundColor: '#31241F'
    },
    icon: {
        fontSize: 48
    },
    itemName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'Courier New'
    },
    itemDesc: {
        fontSize: 14,
        color: '#B28C96',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic'
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#333',
        marginBottom: 20
    },
    statsContainer: {
        width: '100%'
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    statLabel: {
        color: '#614A4B',
        fontSize: 14
    },
    statValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
    },
    statGain: {
        color: '#5FB37A',
        fontSize: 14,
        fontWeight: 'bold'
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 15
    },
    actionButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    passButton: {
        backgroundColor: '#31241F',
        borderWidth: 1,
        borderColor: '#473633'
    },
    passButtonText: {
        color: '#B28C96',
        fontWeight: 'bold'
    },
    buyButton: {
        backgroundColor: '#5FB37A', // Green
        borderWidth: 1,
        borderColor: '#5FB37A'
    },
    consumeButton: {
        backgroundColor: '#E06B6B', // Red-ish
        borderWidth: 1,
        borderColor: '#E06B6B'
    },
    disabledButton: {
        backgroundColor: '#473633',
        borderColor: '#614A4B',
        opacity: 0.5
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    priceSubtext: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 2
    },
    warningText: {
        color: '#E06B6B',
        marginTop: 15,
        fontWeight: 'bold',
        letterSpacing: 1
    }
});
