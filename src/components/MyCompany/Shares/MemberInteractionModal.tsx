import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import GameModal from '../../common/GameModal';
import { giftEffect } from '../../../core/market/governance';
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
    const { members, calculateBuyoutPrice, offerGesture } = useShareholderStore();
    const { money, companySharePrice, update: updateStats } = useStatsStore();

    // ----------------------------------------------------------------------
    //  EVERY HOOK RUNS BEFORE THE EARLY RETURN
    // ----------------------------------------------------------------------
    //  These two store selectors were added below `if (!member) return null`,
    //  which crashed the moment the screen was opened:
    //    "Rendered more hooks than during the previous render."
    //  With the modal closed memberId is '' so member is undefined and the
    //  component bailed out after 4 hooks; opening it ran 6. React counts
    //  hooks per render and refuses the mismatch.
    //
    //  This is the same mistake that was just fixed in ProductModals. The
    //  rule for this file: no early return above this line.
    // ----------------------------------------------------------------------
    const [activeTab, setActiveTab] = useState<TabType>('LOBBYING');
    const [offerPremium, setOfferPremium] = useState(0); // Percentage premium (-20 to +100)
    const totalShares = useShareholderStore(st => st.totalShares);
    const playerPercent = useShareholderStore(st =>
        st.totalShares > 0 ? (st.playerShareCount / st.totalShares) * 100 : 0,
    );

    const member = members.find((m) => m.id === memberId);

    // Safe from here on: no hooks below this point.
    if (!member) {
        return null;
    }

    const memberPercent = totalShares > 0 ? (member.shareCount / totalShares) * 100 : 0;

    // ----------------------------------------------------------------------
    //  SHOW WHAT THIS GESTURE WILL ACTUALLY DO, FOR THIS PERSON
    // ----------------------------------------------------------------------
    //  The buttons carried fixed labels reading "+5 Trust" and "+15 Trust".
    //  Both were wrong twice over: gestures move RELATIONSHIP, not trust, and
    //  the amount depends entirely on who you are dealing with - dinner is +18
    //  for Elena and +5 for Marcus, and a cash gift is -5 for Elena. A player
    //  who took Marcus to dinner expecting +18 reasonably concluded it was
    //  broken.
    //
    //  The preview runs the same function the action does, so the label cannot
    //  drift from the behaviour.
    // ----------------------------------------------------------------------
    const govSelf = {
        id: member.id, name: member.name, trait: member.trait as any,
        trust: member.trust, shareCount: member.shareCount,
        relationship: member.relationship ?? 50, motivation: member.motivation,
    };
    const giftPreview = giftEffect(govSelf, 'money', 1, member.gestureCount ?? 0);
    const dinnerPreview = giftEffect(govSelf, 'legacy', 1, member.gestureCount ?? 0);
    const fmtDelta = (d: number) =>
        d > 0 ? t('mem.relPlus', { v1: String(d) })
              : d < 0 ? t('mem.relMinus', { v1: String(Math.abs(d)) })
              : t('mem.relNone');

    // Get trust status
    const getTrustStatus = (trust: number) => {
        if (trust >= 80) return { label: t('equity.loyalAlly'), color: '#5992C6' };
        if (trust >= 60) return { label: t('equity.supportive'), color: '#E9B8C9' };
        if (trust >= 40) return { label: t('equity.neutral'), color: '#E9B8C9' };
        if (trust >= 20) return { label: t('equity.suspiciousOfYou'), color: '#E9B8C9' };
        return { label: t('equity.hostileEnemy'), color: '#E9B8C9' };
    };

    const trustStatus = getTrustStatus(member.trust);

    // Lobbying Actions
    const handleSendGift = () => {
        const GIFT_COST = 50000;

        if (money < GIFT_COST) {
            Alert.alert(t('alert.insufficientFunds'), t('mem.needForGift', { v1: formatMoney(GIFT_COST) }));
            return;
        }

        Alert.alert(
            t('mem.sendGiftTitle'),
            t('mem.sendGiftBody2', { v1: formatMoney(GIFT_COST), v2: member.name }),
            [
                { text: t('equity.cancel'), style: 'cancel' },
                {
                    text: t('equity.sendGift'),
                    onPress: () => {
                        updateStats({ money: money - GIFT_COST });
                        // ------------------------------------------------
                        //  ARTIK GERCEKTEN BIR SEY OLUYOR
                        // ------------------------------------------------
                        //  Bu iki eylem de `TODO` idi: para dusuyordu ama
                        //  hicbir sey degismiyordu. Simdi ILISKIYI artiriyor
                        //  — guveni degil. Para oy satin alamaz.
                        //
                        //  Hediye PARA jestidir: parayi onemseyen uyeyi
                        //  memnun eder, mirasini dusunen uyeyi asagilar.
                        //  Bkz. core/market/governance.ts -> giftEffect
                        // ------------------------------------------------
                        const r = offerGesture(member.id, 'money', 1);
                        Alert.alert(
                            r.success ? t('mem.giftSent') : t('mem.giftBackfired'),
                            r.success
                                ? t('mem.relationshipUp', { v1: member.name, v2: String(r.delta) })
                                : t('mem.giftBackfiredBody', { v1: member.name }),
                        );
                    },
                },
            ]
        );
    };

    const handlePrivateDinner = () => {
        const ENERGY_COST = 20;

        // TODO: Check energy from stats store
        Alert.alert(
            t('mem.dinnerTitle'),
            t('mem.dinnerBody2', { v1: member.name, v2: String(ENERGY_COST) }),
            [
                { text: t('equity.cancel'), style: 'cancel' },
                {
                    text: t('equity.arrangeDinner'),
                    onPress: () => {
                        // Ozel yemek bir TANINMA jestidir: adinin gecmesini
                        // isteyen uyeye para degil ilgi lazimdir.
                        const r = offerGesture(member.id, 'legacy', 1);
                        Alert.alert(
                            r.success ? t('mem.dinnerArranged') : t('mem.giftBackfired'),
                            r.success
                                ? t('mem.relationshipUp', { v1: member.name, v2: String(r.delta) })
                                : t('mem.giftBackfiredBody', { v1: member.name }),
                        );
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

    // `member.shares` never existed on BoardMember - the field is shareCount -
    // so every buyout figure on this screen used to render NaN. Percentages are
    // derived above from shareCount/totalShares.

    // Buyout Logic
    const calculateOfferPrice = () => {
        const basePrice = companySharePrice * member.shareCount;
        const premiumMultiplier = 1 + offerPremium / 100;
        return basePrice * premiumMultiplier;
    };

    const offerPrice = calculateOfferPrice();

    const getLikelihoodColor = () => {
        if (offerPremium < 0) return '#E9B8C9'; // Insulted
        if (offerPremium < 20) return '#E9B8C9'; // Hesitant
        return '#5992C6'; // Interested
    };

    const getLikelihoodLabel = () => {
        if (offerPremium < 0) return t('mem.insulted');
        if (offerPremium < 20) return t('mem.hesitant');
        if (offerPremium < 50) return t('mem.interested');
        return t('mem.veryInterested');
    };

    const getLikelihoodWidth = (): string => {
        // Map premium to percentage width
        const normalized = Math.max(0, Math.min(100, offerPremium + 20)); // -20 to +100 → 0 to 120
        const percentage = (normalized / 120) * 100;
        return `${percentage}%`;
    };

    const handleMakeOffer = () => {
        if (money < offerPrice) {
            Alert.alert(t('alert.insufficientFunds'), t('mem.needForOffer', { v1: formatMoney(offerPrice) }));
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
                t('mem.offerAccepted'),
                `${member.name} has accepted your offer!\n\n` +
                t('mem.offerAcceptedBody', {
                    v1: formatMoney(offerPrice),
                    v2: memberPercent.toFixed(1),
                    v3: (memberPercent + playerPercent).toFixed(1),
                }),
                [
                    { text: t('equity.cancel'), style: 'cancel' },
                    {
                        text: t('equity.completePurchase'),
                        onPress: () => {
                            // TODO: Implement actual share transfer
                            updateStats({ money: money - offerPrice });
                            Alert.alert(t('mem.purchaseComplete'), t('mem.purchaseCompleteBody', { v1: memberPercent.toFixed(1) }));
                            console.log(`[Buyout] Purchased ${memberPercent.toFixed(1)}% from ${member.name} for $${offerPrice}`);
                            onClose();
                        },
                    },
                ]
            );
        } else {
            Alert.alert(
                '❌ Offer Too Low',
                `${member.name} rejected your offer.\n\n` +
                t('mem.offerRejectedBody', {
                    v1: formatMoney(offerPrice),
                    v2: formatMoney(requiredPrice),
                }),
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
                <Text style={styles.heroRole}>{t('equity.theV1', { v1: member.trait })}</Text>
                <View style={[styles.trustBadge, { borderColor: trustStatus.color }]}>
                    <Text style={[styles.trustBadgeText, { color: trustStatus.color }]}>
                        {trustStatus.label}
                    </Text>
                </View>

                {/* ------------------------------------------------------------
                    WHO THIS PERSON IS
                    ------------------------------------------------------------
                    The gift system filters by motivation - cash insults a
                    director who wants a legacy - but none of that was on
                    screen, so choosing a gift was a coin flip rather than a
                    decision. What they want and what they will not let go of
                    are now stated plainly.
                   ------------------------------------------------------------ */}
                <View style={styles.characterCard}>
                    <Text style={styles.characterLine}>
                        {t('mem.wants')}{'  '}
                        <Text style={styles.characterValue}>
                            {t('data.motivation.' + (member.motivation || 'money'))}
                        </Text>
                    </Text>
                    {member.petIssue && (
                        <Text style={styles.characterLine}>
                            {t('mem.neverLetsGo')}{'  '}
                            <Text style={styles.characterValue}>
                                {t('data.petIssue.' + member.petIssue)}
                            </Text>
                        </Text>
                    )}
                    <Text style={styles.characterHint}>
                        {t('mem.giftHint.' + (member.motivation || 'money'))}
                    </Text>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.shares')}</Text>
                        <Text style={styles.statValue}>{memberPercent.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.relationship')}</Text>
                        <Text style={[styles.statValue, { color: '#5992C6' }]}>
                            {Math.round(member.relationship ?? 50)}
                        </Text>
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
                                <Text style={[styles.actionEffect, { color: giftPreview >= 0 ? '#5992C6' : '#E9B8C9' }]}>
                                    {fmtDelta(giftPreview)}
                                </Text>
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
                                <Text style={[styles.actionEffect, { color: dinnerPreview >= 0 ? '#5992C6' : '#E9B8C9' }]}>
                                    {fmtDelta(dinnerPreview)}
                                </Text>
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
                                        { color: offerPremium >= 0 ? '#5992C6' : '#E9B8C9' }
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
                                {money < offerPrice ? `💰 ${t('mem.insufficientFunds')}` : `💼 ${t('mem.makeOffer')}`}
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
        backgroundColor: '#31241F',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#42312A',
    },
    heroAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#533D35',
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
        color: 'rgba(255,255,255,0.48)',
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
    characterCard: { backgroundColor: '#31241F', borderRadius: 10, padding: 10, marginTop: 10, alignSelf: 'stretch' },
    characterLine: { color: 'rgba(255,255,255,0.48)', fontSize: 11, marginBottom: 3 },
    characterValue: { color: '#FFFFFF', fontWeight: '700' },
    characterHint: { color: '#5992C6', fontSize: 10, marginTop: 4, lineHeight: 14, fontStyle: 'italic' },
    statsRow: {
        flexDirection: 'row',
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.48)',
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
        backgroundColor: '#42312A',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#533D35',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.48)',
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
        color: 'rgba(255,255,255,0.48)',
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
        backgroundColor: '#31241F',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    actionButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    actionButtonDisabled: {
        borderColor: '#42312A',
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
        color: '#E9B8C9',
        fontWeight: '600',
    },
    actionEffect: {
        fontSize: 11,
        color: '#5992C6',
    },
    stepperContainer: {
        backgroundColor: '#31241F',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    stepperLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
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
        backgroundColor: '#42312A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    stepperButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    stepperButtonDisabled: {
        borderColor: '#42312A',
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
        backgroundColor: '#31241F',
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
        color: 'rgba(255,255,255,0.48)',
    },
    reactionStatus: {
        fontSize: 14,
        fontWeight: '800',
    },
    reactionBarBg: {
        height: 12,
        backgroundColor: '#31241F',
        borderRadius: 6,
        overflow: 'hidden',
    },
    reactionBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    makeOfferButton: {
        backgroundColor: '#5992C6',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#5992C6',
    },
    makeOfferButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    makeOfferButtonDisabled: {
        backgroundColor: '#42312A',
        borderColor: '#42312A',
        opacity: 0.5,
    },
    makeOfferButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },
    infoBox: {
        backgroundColor: '#42312A',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: 'rgba(255,255,255,0.08)',
    },
    infoText: {
        fontSize: 12,
        color: '#FFFFFF',
        lineHeight: 18,
    },
});
