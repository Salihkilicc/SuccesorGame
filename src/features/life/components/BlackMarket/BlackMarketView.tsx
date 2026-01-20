import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Alert,
    Dimensions
} from 'react-native';
import { BlackMarketData } from './useBlackMarketSystem';
import { BlackMarketItem, REPUTATION_TIERS } from './blackMarketData';

// --- TYPES ---

interface BlackMarketViewProps {
    data: BlackMarketData;
    onBuyItem: (itemId: string) => { success: boolean; message: string; warning?: string };
    onClose: () => void;
}

// --- CONSTANTS ---

const COLORS = {
    background: '#000000',
    bloodRed: '#8a0303',
    neonRed: '#ff0000',
    darkGray: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#999999',
    gold: '#fbbf24',
    locked: '#333333'
};

// --- COMPONENT ---

export const BlackMarketView: React.FC<BlackMarketViewProps> = ({ data, onBuyItem, onClose }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glitchAnim = useRef(new Animated.Value(0)).current;

    // Pulsating suspicion bar animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true
                })
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [pulseAnim]);

    // Glitch effect for high suspicion
    useEffect(() => {
        if (data.suspicion > 60) {
            const glitch = Animated.loop(
                Animated.sequence([
                    Animated.timing(glitchAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true
                    }),
                    Animated.timing(glitchAnim, {
                        toValue: 0,
                        duration: 100,
                        useNativeDriver: true
                    }),
                    Animated.delay(2000)
                ])
            );
            glitch.start();

            return () => glitch.stop();
        }
    }, [data.suspicion, glitchAnim]);

    // Get current tier info
    const getCurrentTier = () => {
        for (const [tier, info] of Object.entries(REPUTATION_TIERS)) {
            if (data.streetRep >= info.min && data.streetRep <= info.max) {
                return { tier: parseInt(tier), ...info };
            }
        }
        return { tier: 1, ...REPUTATION_TIERS[1] };
    };

    const currentTier = getCurrentTier();
    const suspicionPercentage = (data.suspicion / 100) * 100;

    // Handle item purchase
    const handlePurchase = (item: BlackMarketItem) => {
        if (data.streetRep < item.repRequired) {
            Alert.alert('🔒 Locked', `Requires ${item.repRequired} Street Rep to unlock.`);
            return;
        }

        const result = onBuyItem(item.id);

        if (result.success) {
            if (result.warning) {
                Alert.alert('⚠️ Warning', result.warning);
            } else {
                Alert.alert('✅ Acquired', result.message);
            }
        } else {
            Alert.alert('❌ Failed', result.message);
        }
    };

    // Render item card
    const renderItemCard = (item: BlackMarketItem) => {
        const isLocked = data.streetRep < item.repRequired;
        const isDrug = item.isDrug || false;

        return (
            <TouchableOpacity
                key={item.id}
                style={[
                    styles.itemCard,
                    isDrug && styles.drugCard,
                    isLocked && styles.lockedCard
                ]}
                onPress={() => handlePurchase(item)}
                disabled={isLocked}
                activeOpacity={0.7}
            >
                {/* Tier Badge */}
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier) }]}>
                    <Text style={styles.tierText}>T{item.tier}</Text>
                </View>

                {/* Item Content */}
                <View style={styles.itemContent}>
                    <Text
                        style={[styles.itemName, isLocked && styles.lockedText]}
                        numberOfLines={1}
                    >
                        {isLocked ? '███████' : item.name}
                    </Text>
                    <Text style={styles.itemType}>{item.type}</Text>
                    <Text style={styles.itemPrice}>
                        ${isLocked ? '???' : item.price.toLocaleString()}
                    </Text>

                    {!isLocked && (
                        <Text style={styles.itemDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    {isLocked && (
                        <View style={styles.lockOverlay}>
                            <Text style={styles.lockText}>🔒 {item.repRequired} REP</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const getTierColor = (tier: number): string => {
        const colors: Record<number, string> = {
            1: '#4b5563',
            2: '#7c2d12',
            3: '#991b1b',
            4: '#7f1d1d'
        };
        return colors[tier] || colors[1];
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                <Animated.View
                    style={[
                        styles.titleContainer,
                        {
                            transform: [
                                {
                                    translateX: glitchAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 5]
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    <Text style={styles.title}>⚠️ BLACK MARKET ⚠️</Text>
                    <Text style={styles.subtitle}>Underground Trade Network</Text>
                </Animated.View>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
                {/* Suspicion Bar */}
                <View style={styles.statContainer}>
                    <View style={styles.statHeader}>
                        <Text style={styles.statLabel}>🚨 POLICE HEAT</Text>
                        <Text style={styles.statValue}>{Math.floor(data.suspicion)}%</Text>
                    </View>
                    <View style={styles.barContainer}>
                        <Animated.View
                            style={[
                                styles.suspicionBar,
                                {
                                    width: `${suspicionPercentage}%`,
                                    backgroundColor:
                                        data.suspicion > 80
                                            ? COLORS.neonRed
                                            : data.suspicion > 50
                                                ? '#dc2626'
                                                : COLORS.bloodRed,
                                    transform: [{ scale: data.suspicion > 60 ? pulseAnim : 1 }]
                                }
                            ]}
                        />
                    </View>
                    {data.suspicion > 80 && (
                        <Text style={styles.warningText}>⚠️ RAID IMMINENT</Text>
                    )}
                </View>

                {/* Street Rep Bar */}
                <View style={styles.statContainer}>
                    <View style={styles.statHeader}>
                        <Text style={styles.statLabel}>👑 STREET REP</Text>
                        <Text style={[styles.statValue, { color: COLORS.gold }]}>
                            {Math.floor(data.streetRep)}
                        </Text>
                    </View>
                    <View style={styles.barContainer}>
                        <View
                            style={[
                                styles.repBar,
                                { width: `${data.streetRep}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.tierLabel}>{currentTier.label}</Text>
                </View>
            </View>

            {/* Item Grid */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.itemGrid}>
                    {data.availableItems.slice(0, 12).map(item => renderItemCard(item))}
                </View>

                {/* Footer Warning */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        ⚠️ All transactions are final and untraceable
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Quarterly Drug Usage: {data.quarterlyDrugUsage}/3
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

// --- STYLES ---

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: COLORS.darkGray,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.bloodRed
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.bloodRed,
        borderRadius: 20,
        zIndex: 10
    },
    closeText: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: 'bold'
    },
    titleContainer: {
        alignItems: 'center'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.neonRed,
        fontFamily: 'Courier New',
        textShadowColor: COLORS.bloodRed,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        letterSpacing: 2
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 5,
        fontFamily: 'Courier New',
        letterSpacing: 3
    },
    statsSection: {
        padding: 20,
        backgroundColor: COLORS.darkGray,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bloodRed
    },
    statContainer: {
        marginBottom: 15
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontFamily: 'Courier New',
        letterSpacing: 1
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        fontFamily: 'Courier New'
    },
    barContainer: {
        height: 12,
        backgroundColor: '#1f2937',
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#374151'
    },
    suspicionBar: {
        height: '100%',
        borderRadius: 6
    },
    repBar: {
        height: '100%',
        backgroundColor: COLORS.gold,
        borderRadius: 6
    },
    warningText: {
        fontSize: 11,
        color: COLORS.neonRed,
        marginTop: 5,
        fontFamily: 'Courier New',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    tierLabel: {
        fontSize: 11,
        color: COLORS.gold,
        marginTop: 5,
        fontFamily: 'Courier New',
        textAlign: 'center'
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 20
    },
    itemGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    itemCard: {
        width: cardWidth,
        backgroundColor: COLORS.darkGray,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#374151',
        overflow: 'hidden'
    },
    drugCard: {
        borderColor: COLORS.bloodRed,
        borderWidth: 2
    },
    lockedCard: {
        backgroundColor: '#0f0f0f',
        borderColor: COLORS.locked,
        opacity: 0.6
    },
    tierBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        zIndex: 5
    },
    tierText: {
        color: COLORS.textPrimary,
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Courier New'
    },
    itemContent: {
        padding: 12
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
        fontFamily: 'Courier New'
    },
    lockedText: {
        color: COLORS.locked
    },
    itemType: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginBottom: 8,
        fontFamily: 'Courier New'
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.gold,
        marginBottom: 8,
        fontFamily: 'Courier New'
    },
    itemDescription: {
        fontSize: 10,
        color: COLORS.textSecondary,
        lineHeight: 14,
        fontFamily: 'Courier New'
    },
    lockOverlay: {
        marginTop: 10,
        padding: 8,
        backgroundColor: 'rgba(138, 3, 3, 0.2)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.bloodRed
    },
    lockText: {
        fontSize: 11,
        color: COLORS.neonRed,
        textAlign: 'center',
        fontFamily: 'Courier New',
        fontWeight: 'bold'
    },
    footer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: COLORS.darkGray,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.bloodRed,
        alignItems: 'center'
    },
    footerText: {
        fontSize: 11,
        color: COLORS.neonRed,
        fontFamily: 'Courier New',
        textAlign: 'center',
        marginBottom: 5
    },
    footerSubtext: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontFamily: 'Courier New'
    }
});
