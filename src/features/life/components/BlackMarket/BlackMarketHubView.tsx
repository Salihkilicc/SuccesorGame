import React, { useRef, useEffect } from 'react';
import { t, useLocale } from '../../../../core/i18n';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useBlackMarketSystem } from './useBlackMarketSystem';
import { BlackMarketCategory } from './blackMarketData';
import { useStatsStore } from '../../../../core/store/useStatsStore';

// --- PROPS ---

interface BlackMarketHubViewProps {
    onOpenCategory: (category: BlackMarketCategory) => void;
    onClose: () => void;
}

// --- COMPONENT ---

export const BlackMarketHubView: React.FC<BlackMarketHubViewProps> = ({ onOpenCategory, onClose }) => {
    useLocale();
    const { data } = useBlackMarketSystem();
    const { money } = useStatsStore();

    // Animation for Suspicion Bar
    const suspicionAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulsate animation if suspicion is high
        if (data.suspicion > 50) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(suspicionAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: false
                    }),
                    Animated.timing(suspicionAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: false
                    })
                ])
            ).start();
        } else {
            suspicionAnim.setValue(0); // Reset
        }
    }, [data.suspicion]);

    const suspicionColor = suspicionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E9B8C9', '#E9B8C9'] // Red to Dark Red
    });

    const categories: { id: BlackMarketCategory, label: string, icon: string, color: string }[] = [
        { id: 'art_antique', label: t('life.fineArtsAntiques'), icon: '🏛️', color: '#E9B8C9' },
        { id: 'weapon', label: t('life.weaponsDefense'), icon: '🔫', color: '#E9B8C9' },
        { id: 'jewelry', label: t('life.jewelryGems'), icon: '💎', color: '#5992C6' },
        { id: 'substance', label: t('life.prohibitedSubstances'), icon: '🧪', color: '#0A2A92' }
    ];

    const getRepTitle = (rep: number) => {
        if (rep < 10) return 'Street Rookie';
        if (rep < 30) return 'Known Player';
        if (rep < 70) return 'Underground Legend';
        return 'Crime Lord';
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('life.theBlackMarket')}</Text>
                <Text style={styles.headerSubtitle}>{t('life.encryptedConnectionEstablished')}</Text>
            </View>

            {/* Status Bars */}
            <View style={styles.statusSection}>
                {/* Suspicion */}
                <View style={styles.barContainer}>
                    <View style={styles.barHeader}>
                        <Text style={styles.barLabel}>⚠️ POLICE HEAT</Text>
                        <Text style={styles.barValue}>{Math.round(data.suspicion)}%</Text>
                    </View>
                    <View style={styles.track}>
                        <Animated.View
                            style={[
                                styles.fill,
                                {
                                    width: `${Math.min(100, data.suspicion)}%`,
                                    backgroundColor: suspicionColor,
                                    shadowColor: '#31241F',
                                    shadowOpacity: data.suspicion > 50 ? 0.8 : 0,
                                    shadowRadius: 10
                                }
                            ]}
                        />
                    </View>
                    {data.suspicion > 80 && (
                        <Text style={styles.warningText}>{t('life.raidImminent')}</Text>
                    )}
                </View>

                {/* Street Rep */}
                <View style={[styles.barContainer, { marginTop: 15 }]}>
                    <View style={styles.barHeader}>
                        <Text style={styles.barLabel}>👑 STREET REP</Text>
                        <Text style={[styles.barValue, { color: '#E9B8C9' }]}>
                            {data.streetRep.toFixed(1)} / 100
                        </Text>
                    </View>
                    <Text style={styles.repTier}>{getRepTitle(data.streetRep)}</Text>
                    <View style={styles.track}>
                        <View
                            style={[
                                styles.fill,
                                {
                                    width: `${Math.min(100, data.streetRep)}%`,
                                    backgroundColor: '#533D35'
                                }
                            ]}
                        />
                    </View>
                </View>

                {/* Money */}
                <View style={styles.moneyContainer}>
                    <Text style={styles.moneyLabel}>{t('life.availableCash')}</Text>
                    <Text style={styles.moneyValue}>${money.toLocaleString()}</Text>
                </View>
            </View>

            {/* Menu Grid */}
            <View style={styles.gridContainer}>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.gridItem, { borderColor: cat.color }]}
                        onPress={() => onOpenCategory(cat.id)}
                    >
                        <Text style={styles.gridIcon}>{cat.icon}</Text>
                        <Text style={[styles.gridLabel, { color: cat.color }]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Footer Warning & Disconnect */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    "We sell everything. You saw nothing."
                </Text>

                <TouchableOpacity onPress={onClose} style={styles.disconnectButton}>
                    <Text style={styles.disconnectButtonText}>{t('life.disconnectLink')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- STYLES ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#31241F',
        padding: 20
    },
    header: {
        marginBottom: 24,
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Courier New',
        letterSpacing: 2
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#5992C6', // Hacker green
        fontFamily: 'Courier New',
        marginTop: 4
    },
    statusSection: {
        marginBottom: 30,
        backgroundColor: '#31241F',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)'
    },
    barContainer: {
        width: '100%'
    },
    barHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    barLabel: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    barValue: {
        color: '#E9B8C9',
        fontSize: 14,
        fontWeight: 'bold'
    },
    repTier: {
        color: '#E9B8C9',
        fontSize: 10,
        marginBottom: 4,
        fontFamily: 'Courier New'
    },
    track: {
        height: 6,
        backgroundColor: '#31241F',
        borderRadius: 3,
        overflow: 'hidden'
    },
    fill: {
        height: '100%',
        borderRadius: 3
    },
    warningText: {
        color: '#E9B8C9',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
        textAlign: 'right',
        textTransform: 'uppercase'
    },
    moneyContainer: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    moneyLabel: {
        color: '#7F5E51',
        fontSize: 12
    },
    moneyValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Courier New'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16
    },
    gridItem: {
        width: '47%',
        aspectRatio: 1,
        backgroundColor: '#31241F', // Dark card
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginBottom: 10
    },
    gridIcon: {
        fontSize: 40,
        marginBottom: 12
    },
    gridLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingVertical: 20
    },
    footerText: {
        color: '#7F5E51',
        fontStyle: 'italic',
        fontSize: 12,
        fontFamily: 'Courier New'
    },
    disconnectButton: {
        marginTop: 20,
        backgroundColor: '#533D35',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    disconnectButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
        fontFamily: 'Courier New'
    }
});
