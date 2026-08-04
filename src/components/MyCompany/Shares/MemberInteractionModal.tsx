import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import GameModal from '../../common/GameModal';
import { useShareholderStore, type BoardMember } from '../../../features/shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store';
import { formatMoney } from '../../../core/utils';

interface Props {
    visible: boolean;
    onClose: () => void;
    memberId: string;
}

type TabType = 'LOBBYING' | 'BUYOUT';

const MemberInteractionModal = ({ visible, onClose, memberId }: Props) => {
    useLocale();
    const { members, calculateBuyoutPrice } = useShareholderStore();
    const { money, companySharePrice, update: updateStats } = useStatsStore();

    const [activeTab, setActiveTab] = useState<TabType>('LOBBYING');
    const [offerPremium, setOfferPremium] = useState(0); // Percentage premium (-20 to +100)

    const member = members.find((m) => m.id === memberId);

    if (!member) {
        return null;
    }

    // Get trust status
    const getTrustStatus = (trust: number) => {
        if (trust >= 80) return { label: t('equity.loyalAlly'), color: '#90EE90' };
        if (trust >= 60) return { label: t('equity.supportive'), color: '#FFD700' };
        if (trust >= 40) return { label: t('equity.neutral'), color: '#FFA500' };
        if (trust >= 20) return { label: t('equity.suspiciousOfYou'), color: '#FF6B6B' };
        return { label: t('equity.hostileEnemy'), color: '#FF3B30' };
    };

    const trustStatus = getTrustStatus(member.trust);

    // Lobbying Actions
    const handleSendGift = () => {
        const GIFT_COST = 50000;
        const TRUST_BOOST = 5;

        if (money < GIFT_COST) {
            Alert.alert(t('alert.insufficientFunds'), `You need ${formatMoney(GIFT_COST)} to send a gift.`);
            return;
        }

        Alert.alert(
            '🎁 Send Gift',
            `Send a ${formatMoney(GIFT_COST)} gift to ${member.name}?\n\nTrust will increase by ${TRUST_BOOST}.`,
            [
                { text: t('equity.cancel'), style: 'cancel' },
                {
                    text: t('equity.sendGift'),
                    onPress: () => {
                        updateStats({ money: money - GIFT_COST });
                        // TODO: Implement trust increase in store
                        Alert.alert('✅ Gift Sent', `${member.name} appreciates your generosity!\n\nTrust +${TRUST_BOOST}`);
                        console.log(`[Lobbying] Gift sent to ${member.name}. Trust +${TRUST_BOOST}`);
                    },
                },
            ]
        );
    };

    const handlePrivateDinner = () => {
        const ENERGY_COST = 20;
        const TRUST_BOOST = 15;

        // TODO: Check energy from stats store
        Alert.alert(
            '🍽️ Private Dinner',
            `Invite ${member.name} to a private dinner?\n\nCost: ${ENERGY_COST} Energy\nTrust will increase by ${TRUST_BOOST}.`,
            [
                { text: t('equity.cancel'), style: 'cancel' },
                {
                    text: t('equity.arrangeDinner'),
                    onPress: () => {
                        // TODO: Deduct energy, increase trust
                        Alert.alert('✅ Dinner Arranged', `You had a productive conversation with ${member.name}.\n\nTrust +${TRUST_BOOST}`);
                        console.log(`[Lobbying] Dinner with ${member.name}. Trust +${TRUST_BOOST}`);
                    },
                },
            ]
        );
    };

    const handleBlackmail = () => {
        Alert.alert(
            '🕵️ Blackmail',
            t('alert.thisFeatureIsLockedN'),
            [{ text: 'OK' }]
        );
    };

    // Buyout Logic
    const calculateOfferPrice = () => {
        const basePrice = companySharePrice * (member.shares / 100) * 1_000_000; // Assuming 1M total shares
        const premiumMultiplier = 1 + offerPremium / 100;
        return basePrice * premiumMultiplier;
    };

    const offerPrice = calculateOfferPrice();

    const getLikelihoodColor = () => {
        if (offerPremium < 0) return '#FF3B30'; // Insulted
        if (offerPremium < 20) return '#FFA500'; // Hesitant
        return '#90EE90'; // Interested
    };

    const getLikelihoodLabel = () => {
        if (offerPremium < 0) return 'Insulted';
        if (offerPremium < 20) return 'Hesitant';
        if (offerPremium < 50) return 'Interested';
        return 'Very Interested';
    };

    const getLikelihoodWidth = (): string => {
        // Map premium to percentage width
        const normalized = Math.max(0, Math.min(100, offerPremium + 20)); // -20 to +100 → 0 to 120
        const percentage = (normalized / 120) * 100;
        return `${percentage}%`;
    };

    const handleMakeOffer = () => {
        if (money < offerPrice) {
            Alert.alert(t('alert.insufficientFunds'), `You need ${formatMoney(offerPrice)} to make this offer.`);
            return;
        }

        // Use the smart negotiation logic from the store
        const buyoutResult = calculateBuyoutPrice(member.id, companySharePrice);

        if (!buyoutResult) {
            Alert.alert(t('alert.error'), t('alert.unableToCalculateBuyoutPrice'));
            return;
        }

        if (!buyoutResult.canSell) {
            Alert.alert(
                '❌ Offer Rejected',
                buyoutResult.refusalReason || `${member.name} refuses to sell their shares.`,
                [{ text: 'OK', style: 'destructive' }]
            );
            return;
        }

        // Check if offer is acceptable
        const requiredPrice = buyoutResult.askingPrice || 0;
        const offerAcceptable = offerPrice >= requiredPrice;

        if (offerAcceptable) {
            Alert.alert(
                '✅ Offer Accepted!',
                `${member.name} has accepted your offer!\n\n` +
                `Price: ${formatMoney(offerPrice)}\n` +
                `Shares Acquired: ${member.shares.toFixed(1)}%\n\n` +
                `Your ownership will increase to ${(member.shares + 65).toFixed(1)}%`,
                [
                    { text: t('equity.cancel'), style: 'cancel' },
                    {
                        text: t('equity.completePurchase'),
                        onPress: () => {
                            // TODO: Implement actual share transfer
                            updateStats({ money: money - offerPrice });
                            Alert.alert('🎉 Purchase Complete', `You now own ${member.shares.toFixed(1)}% more of the company!`);
                            console.log(`[Buyout] Purchased ${member.shares}% from ${member.name} for $${offerPrice}`);
                            onClose();
                        },
                    },
                ]
            );
        } else {
            Alert.alert(
                '❌ Offer Too Low',
                `${member.name} rejected your offer.\n\n` +
                `Your Offer: ${formatMoney(offerPrice)}\n` +
                `They Want: ${formatMoney(requiredPrice)}\n\n` +
                `Try increasing your premium.`,
                [{ text: 'OK', style: 'destructive' }]
            );
        }
    };

    const adjustPremium = (delta: number) => {
        setOfferPremium((prev) => Math.max(-20, Math.min(100, prev + delta)));
    };

    return (
        <GameModal visible={visible} onClose={onClose}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={styles.heroAvatar}>
                    <Text style={styles.heroAvatarText}>{member.name.charAt(0)}</Text>
                </View>
                <Text style={styles.heroName}>{member.name}</Text>
                <Text style={styles.heroRole}>The {member.trait}</Text>
                <View style={[styles.trustBadge, { borderColor: trustStatus.color }]}>
                    <Text style={[styles.trustBadgeText, { color: trustStatus.color }]}>
                        {trustStatus.label}
                    </Text>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.shares')}</Text>
                        <Text style={styles.statValue}>{member.shares.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.trust')}</Text>
                        <Text style={[styles.statValue, { color: trustStatus.color }]}>
                            {member.trust}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.origin')}</Text>
                        <Text style={styles.statValue}>{member.origin}</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, activeTab === 'LOBBYING' && styles.tabActive]}
                    onPress={() => setActiveTab('LOBBYING')}
                >
                    <Text style={[styles.tabText, activeTab === 'LOBBYING' && styles.tabTextActive]}>{t('equity.lobbying')}</Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'BUYOUT' && styles.tabActive]}
                    onPress={() => setActiveTab('BUYOUT')}
                >
                    <Text style={[styles.tabText, activeTab === 'BUYOUT' && styles.tabTextActive]}>{t('equity.buyout')}</Text>
                </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {/* Lobbying Tab */}
                {activeTab === 'LOBBYING' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>{t('equity.influenceActions')}</Text>
                        <View style={styles.actionGrid}>
                            {/* Send Gift */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    pressed && styles.actionButtonPressed,
                                    money < 50000 && styles.actionButtonDisabled,
                                ]}
                                onPress={handleSendGift}
                                disabled={money < 50000}
                            >
                                <Text style={styles.actionIcon}>🎁</Text>
                                <Text style={styles.actionTitle}>{t('equity.sendGift')}</Text>
                                <Text style={styles.actionCost}>$50K</Text>
                                <Text style={styles.actionEffect}>{t('equity.trust5')}</Text>
                            </Pressable>

                            {/* Private Dinner */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    pressed && styles.actionButtonPressed,
                                ]}
                                onPress={handlePrivateDinner}
                            >
                                <Text style={styles.actionIcon}>🍽️</Text>
                                <Text style={styles.actionTitle}>{t('equity.privateDinner')}</Text>
                                <Text style={styles.actionCost}>20 Energy</Text>
                                <Text style={styles.actionEffect}>{t('equity.trust15')}</Text>
                            </Pressable>

                            {/* Blackmail */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    styles.actionButtonDisabled,
                                    pressed && styles.actionButtonPressed,
                                ]}
                                onPress={handleBlackmail}
                            >
                                <Text style={styles.actionIcon}>🕵️</Text>
                                <Text style={styles.actionTitle}>{t('equity.blackmail')}</Text>
                                <Text style={styles.actionCost}>🔒 Locked</Text>
                                <Text style={styles.actionEffect}>{t('equity.forceVote')}</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Buyout Tab */}
                {activeTab === 'BUYOUT' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>{t('equity.shareNegotiation2')}</Text>

                        {/* Stepper UI */}
                        <View style={styles.stepperContainer}>
                            <Text style={styles.stepperLabel}>{t('equity.offerPremium')}</Text>
                            <View style={styles.stepperRow}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.stepperButton,
                                        pressed && styles.stepperButtonPressed,
                                        offerPremium <= -20 && styles.stepperButtonDisabled,
                                    ]}
                                    onPress={() => adjustPremium(-10)}
                                    disabled={offerPremium <= -20}
                                >
                                    <Text style={styles.stepperButtonText}>−</Text>
                                </Pressable>

                                <View style={styles.stepperDisplay}>
                                    <Text style={styles.stepperPrice}>
                                        {formatMoney(offerPrice)}
                                    </Text>
                                    <Text style={[
                                        styles.stepperPremium,
                                        { color: offerPremium >= 0 ? '#90EE90' : '#FF6B6B' }
                                    ]}>
                                        {offerPremium >= 0 ? '+' : ''}{offerPremium}%
                                    </Text>
                                </View>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.stepperButton,
                                        pressed && styles.stepperButtonPressed,
                                        offerPremium >= 100 && styles.stepperButtonDisabled,
                                    ]}
                                    onPress={() => adjustPremium(10)}
                                    disabled={offerPremium >= 100}
                                >
                                    <Text style={styles.stepperButtonText}>+</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Reaction Bar */}
                        <View style={styles.reactionContainer}>
                            <View style={styles.reactionLabels}>
                                <Text style={styles.reactionLabel}>{t('equity.likelihoodToSell')}</Text>
                                <Text style={[styles.reactionStatus, { color: getLikelihoodColor() }]}>
                                    {getLikelihoodLabel()}
                                </Text>
                            </View>
                            <View style={styles.reactionBarBg}>
                                <View
                                    style={[
                                        styles.reactionBarFill,
                                        {
                                            width: getLikelihoodWidth() as any,
                                            backgroundColor: getLikelihoodColor(),
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        {/* Make Offer Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.makeOfferButton,
                                pressed && styles.makeOfferButtonPressed,
                                money < offerPrice && styles.makeOfferButtonDisabled,
                            ]}
                            onPress={handleMakeOffer}
                            disabled={money < offerPrice}
                        >
                            <Text style={styles.makeOfferButtonText}>
                                {money < offerPrice ? '💰 INSUFFICIENT FUNDS' : '💼 MAKE OFFER'}
                            </Text>
                        </Pressable>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                💡 Tip: Higher premiums increase acceptance chance. Sharks and Snakes require higher premiums.
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </GameModal>
    );
};

export default MemberInteractionModal;

const styles = StyleSheet.create({
    heroSection: {
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    heroAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    heroAvatarText: {
        fontSize: 40,
        fontWeight: '900',
        color: '#000',
    },
    heroName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    heroRole: {
        fontSize: 14,
        color: '#8A9BA8',
        marginBottom: 12,
    },
    trustBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        marginBottom: 16,
    },
    trustBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: '#8A9BA8',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#2A2D35',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#FFD700',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#8A9BA8',
        letterSpacing: 1,
    },
    tabTextActive: {
        color: '#000',
    },
    tabContent: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8A9BA8',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionButton: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    actionButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    actionButtonDisabled: {
        borderColor: '#2A2D35',
        opacity: 0.5,
    },
    actionIcon: {
        fontSize: 32,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    actionCost: {
        fontSize: 12,
        color: '#FFD700',
        fontWeight: '600',
    },
    actionEffect: {
        fontSize: 11,
        color: '#90EE90',
    },
    stepperContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    stepperLabel: {
        fontSize: 12,
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepperButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2A2D35',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    stepperButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    stepperButtonDisabled: {
        borderColor: '#2A2D35',
        opacity: 0.3,
    },
    stepperButtonText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepperDisplay: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        paddingVertical: 12,
    },
    stepperPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    stepperPremium: {
        fontSize: 16,
        fontWeight: '800',
    },
    reactionContainer: {
        gap: 8,
    },
    reactionLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reactionLabel: {
        fontSize: 12,
        color: '#8A9BA8',
    },
    reactionStatus: {
        fontSize: 14,
        fontWeight: '800',
    },
    reactionBarBg: {
        height: 12,
        backgroundColor: '#0A0A0A',
        borderRadius: 6,
        overflow: 'hidden',
    },
    reactionBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    makeOfferButton: {
        backgroundColor: '#30D158',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#30D158',
    },
    makeOfferButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    makeOfferButtonDisabled: {
        backgroundColor: '#2A2D35',
        borderColor: '#2A2D35',
        opacity: 0.5,
    },
    makeOfferButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },
    infoBox: {
        backgroundColor: '#2A2D35',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    infoText: {
        fontSize: 12,
        color: '#FFFFFF',
        lineHeight: 18,
    },
});
