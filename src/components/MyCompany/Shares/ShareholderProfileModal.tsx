import React, { useState, useRef, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useEquityStore } from '../../../features/finance/stores/useEquityStore';
import type { BoardMember } from '../../../features/shareholders/stores/useShareholderStore';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney, formatNumber, formatPrice } from '../../../core/utils';

interface ShareholderProfileModalProps {
    visible: boolean;
    member: BoardMember | null;
    onClose: () => void;
}

type TabType = 'relations' | 'trade';
type AnimationStateType = 'idle' | 'loading' | 'success' | 'failure';
type TradeModeType = 'buy' | 'sell';

const ShareholderProfileModal: React.FC<ShareholderProfileModalProps> = ({
    visible,
    member,
    onClose,
}) => {
    useLocale();
    const navigation = useNavigation<any>();
    // ============================================================================
    // STATE
    // ============================================================================
    const [activeTab, setActiveTab] = useState<TabType>('relations');
    const [tradeMode, setTradeMode] = useState<TradeModeType>('buy');
    const [offerPremium, setOfferPremium] = useState(0);
    const [shareCount, setShareCount] = useState(100_000); // Default 100k shares (1%)
    const [animationState, setAnimationState] = useState<AnimationStateType>('idle');
    const [adviceText, setAdviceText] = useState<string | null>(null);
    const [adviceQuality, setAdviceQuality] = useState<'good' | 'bad' | 'neutral' | null>(null);

    // ============================================================================
    // STORES
    // ============================================================================
    const { giftMember, askForAdvice, calculateNegotiationChance, negotiateSharePurchase, sellSharesToMember, totalShares } = useShareholderStore();
    const { money } = useStatsStore();
    const { stockPrice } = useEquityStore();

    // ============================================================================
    // ANIMATIONS
    // ============================================================================
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const adviceSlideAnim = useRef(new Animated.Value(50)).current;
    const adviceFadeAnim = useRef(new Animated.Value(0)).current;

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        if (visible) {
            // Reset state when modal opens
            setActiveTab('relations');
            setTradeMode('buy');
            setOfferPremium(0);
            setShareCount(100_000); // Reset to 100k shares
            setAnimationState('idle');
            setAdviceText(null);
            setAdviceQuality(null);
        }
    }, [visible]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    const handleAskAdvice = () => {
        if (!member) return;

        const result = askForAdvice(member.id);
        setAdviceText(result.text);
        setAdviceQuality(result.quality);

        // Animate advice bubble
        adviceSlideAnim.setValue(50);
        adviceFadeAnim.setValue(0);
        Animated.parallel([
            Animated.timing(adviceSlideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(adviceFadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleSendGift = (giftType: 'small' | 'large') => {
        if (!member) return;

        const result = giftMember(member.id, giftType);

        if (result.success) {
            Alert.alert(t('mem.giftSent'), result.message);
        } else {
            Alert.alert(`❌ ${t('common.failed')}`, result.message);
        }
    };

    const handleStepperChange = (direction: 'up' | 'down') => {
        const step = 5;
        const newValue = direction === 'up' ? offerPremium + step : offerPremium - step;

        // Clamp between -20% and 50%
        const clampedValue = Math.max(-20, Math.min(50, newValue));
        setOfferPremium(clampedValue);
    };

    const handleMakeOffer = async () => {
        if (!member) return;

        // Start loading animation
        setAnimationState('loading');
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Wait 1.5s for suspense
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 1500);
        });

        // Execute trade based on mode
        let result: { success: boolean; message: string };

        if (tradeMode === 'buy') {
            result = negotiateSharePurchase(member.id, shareCount, offerPremium);
        } else {
            // For sell mode, convert premium to multiplier
            const priceMultiplier = 1 + (offerPremium / 100);
            result = sellSharesToMember(member.id, shareCount, priceMultiplier);
        }

        // Show result
        setAnimationState(result.success ? 'success' : 'failure');

        // Bounce animation for result
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1.2,
                friction: 5,
                tension: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Show alert with result message
        if (!result.success) {
            Alert.alert(tradeMode === 'buy' ? '❌ Purchase Failed' : '❌ Sale Failed', result.message);
        }

        // Close modal after 2s
        setTimeout(() => {
            setAnimationState('idle');
            if (result.success) {
                onClose();
            }
        }, 2000);
    };

    // ============================================================================
    // HELPERS
    // ============================================================================

    const getTrustColor = (trust: number) => {
        if (trust < 30) return '#C734CA'; // Red
        if (trust < 50) return '#C734CA'; // Orange
        if (trust < 70) return '#C734CA'; // Yellow
        return '#C8C0EF'; // Green
    };

    const getReactionColor = () => {
        if (offerPremium < 0) return '#C734CA'; // Red - Insulted
        if (offerPremium <= 20) return '#C734CA'; // Yellow - Neutral
        return '#C8C0EF'; // Green - Happy
    };

    const getReactionLabel = () => {
        if (offerPremium < 0) return t('mem.insulted');
        if (offerPremium <= 20) return t('mem.neutralMood');
        return t('mem.happy');
    };

    const calculateSuccessChance = () => {
        if (!member) return 0;
        let chance = member.trust;
        if (offerPremium < 0) chance = 0;
        else if (offerPremium > 20) chance = Math.min(100, chance + 30);
        return Math.max(0, Math.min(100, chance));
    };

    const calculateOfferPrice = () => {
        const premiumMultiplier = 1 + offerPremium / 100;
        const totalCost = stockPrice * shareCount * premiumMultiplier;
        return totalCost;
    };

    const getAdviceBubbleStyle = () => {
        const baseStyle = styles.adviceBubble;
        if (adviceQuality === 'good') return [baseStyle, { borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(200,192,239,0.1)' }];
        if (adviceQuality === 'bad') return [baseStyle, { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(199,52,202,0.1)' }];
        return [baseStyle, { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(199,52,202,0.1)' }];
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    if (!member) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Handle Bar */}
                    <View style={styles.handleBarContainer}>
                        <View style={styles.handleBar} />
                    </View>

                    {/* HEADER */}
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, { backgroundColor: getTrustColor(member.trust) }]}>
                                <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                            </View>
                        </View>

                        <Text style={styles.memberName}>{member.name}</Text>

                        <View style={styles.traitBadge}>
                            <Text style={styles.traitText}>
                                {member.trait === 'Shark' && '🦈'}
                                {member.trait === 'Conservative' && '🛡️'}
                                {member.trait === 'Aggressive' && '⚡'}
                                {member.trait === 'Visionary' && '🔮'}
                                {member.trait === 'Snake' && '🐍'}
                                {member.trait === 'Loyalist' && '🤝'}
                                {' '}
                                {t('data.trait.' + member.trait)}
                            </Text>
                        </View>

                        {/* Trust Bar */}
                        <View style={styles.trustContainer}>
                            <View style={styles.trustLabelRow}>
                                <Text style={styles.trustLabel}>{t('equity.trust')}</Text>
                                <Text style={styles.trustValue}>{member.trust}%</Text>
                            </View>
                            <View style={styles.trustBarBg}>
                                <View
                                    style={[
                                        styles.trustBarFill,
                                        {
                                            width: `${member.trust}%`,
                                            backgroundColor: getTrustColor(member.trust),
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* TAB SWITCHER */}
                    <View style={styles.tabSwitcher}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'relations' && styles.tabActive]}
                            onPress={() => setActiveTab('relations')}
                        >
                            <Text style={[styles.tabText, activeTab === 'relations' && styles.tabTextActive]}>{t('equity.relations')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'trade' && styles.tabActive]}
                            onPress={() => setActiveTab('trade')}
                        >
                            <Text style={[styles.tabText, activeTab === 'trade' && styles.tabTextActive]}>{t('equity.trade')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* TAB CONTENT */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {activeTab === 'relations' ? (
                            <View style={styles.relationsTab}>
                                {/* Ask for Advice */}
                                <TouchableOpacity style={styles.actionButton} onPress={handleAskAdvice}>
                                    <Text style={styles.actionButtonIcon}>💬</Text>
                                    <Text style={styles.actionButtonText}>{t('equity.askForAdvice')}</Text>
                                </TouchableOpacity>

                                {/* Advice Bubble */}
                                {adviceText && (
                                    <Animated.View
                                        style={[
                                            getAdviceBubbleStyle(),
                                            {
                                                opacity: adviceFadeAnim,
                                                transform: [{ translateY: adviceSlideAnim }],
                                            },
                                        ]}
                                    >
                                        <Text style={styles.adviceText}>{adviceText}</Text>
                                    </Animated.View>
                                )}

                                {/* Send Gift */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleSendGift('small')}
                                >
                                    <Text style={styles.actionButtonIcon}>🎁</Text>
                                    <View style={styles.actionButtonContent}>
                                        <Text style={styles.actionButtonText}>{t('equity.sendGift')}</Text>
                                        <Text style={styles.actionButtonSubtext}>$10,000 • +5 Trust</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Host Dinner */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleSendGift('large')}
                                >
                                    <Text style={styles.actionButtonIcon}>🍽️</Text>
                                    <View style={styles.actionButtonContent}>
                                        <Text style={styles.actionButtonText}>{t('equity.hostDinner')}</Text>
                                        <Text style={styles.actionButtonSubtext}>$100,000 • +15 Trust</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.tradeTab}>
                                {/* Mode Switcher */}
                                <View style={styles.modeSwitcher}>
                                    <TouchableOpacity
                                        style={[styles.modeButton, tradeMode === 'buy' && styles.modeButtonBuyActive]}
                                        onPress={() => {
                                            setTradeMode('buy');
                                            setOfferPremium(0);
                                        }}
                                    >
                                        <Text style={[styles.modeButtonText, tradeMode === 'buy' && styles.modeButtonTextActive]}>{t('equity.buy')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modeButton, tradeMode === 'sell' && styles.modeButtonSellActive]}
                                        onPress={() => {
                                            setTradeMode('sell');
                                            setOfferPremium(0);
                                        }}
                                    >
                                        <Text style={[styles.modeButtonText, tradeMode === 'sell' && styles.modeButtonTextActive]}>{t('equity.sell')}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Current Stock Price Info */}
                                <View style={{ backgroundColor: '#0B0635', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', marginBottom: 4 }}>{t('equity.currentStockPrice')}</Text>
                                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#C8C0EF' }}>{formatPrice(stockPrice)}</Text>
                                </View>

                                {/* Context Text */}
                                <Text style={styles.tradeContext}>
                                    {tradeMode === 'buy' ? t('shp.buyTheirShares') : t('shp.sellYourShares')}
                                </Text>

                                {/* Amount Stepper */}
                                <View style={styles.stepperContainer}>
                                    <Text style={styles.stepperLabel}>{t('equity.shareAmount')}</Text>
                                    <View style={styles.stepperRow}>
                                        <TouchableOpacity
                                            style={[styles.stepperButton, shareCount <= 10_000 && styles.stepperButtonDisabled]}
                                            onPress={() => setShareCount(Math.max(10_000, shareCount - 10_000))}
                                            disabled={shareCount <= 10_000}
                                        >
                                            <Text style={styles.stepperButtonText}>−</Text>
                                        </TouchableOpacity>

                                        <View style={styles.stepperDisplay}>
                                            <Text style={styles.stepperValue}>
                                                {formatNumber(shareCount)} Shares
                                            </Text>
                                            <Text style={styles.stepperPremium}>
                                                (= {((shareCount / totalShares) * 100).toFixed(2)}% Ownership)
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.stepperButton, shareCount >= 2_000_000 && styles.stepperButtonDisabled]}
                                            onPress={() => setShareCount(Math.min(2_000_000, shareCount + 10_000))}
                                            disabled={shareCount >= 2_000_000}
                                        >
                                            <Text style={styles.stepperButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Stepper UI */}
                                <View style={styles.stepperContainer}>
                                    <Text style={styles.stepperLabel}>{t('equity.totalCostPremium')}</Text>
                                    <View style={styles.stepperRow}>
                                        <TouchableOpacity
                                            style={[styles.stepperButton, offerPremium <= -20 && styles.stepperButtonDisabled]}
                                            onPress={() => handleStepperChange('down')}
                                            disabled={offerPremium <= -20}
                                        >
                                            <Text style={styles.stepperButtonText}>−</Text>
                                        </TouchableOpacity>

                                        <View style={styles.stepperDisplay}>
                                            <Text style={styles.stepperValue}>
                                                {formatMoney(calculateOfferPrice())}
                                            </Text>
                                            <Text style={styles.stepperPremium}>
                                                ({offerPremium >= 0 ? '+' : ''}{offerPremium}%)
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.stepperButton, offerPremium >= 50 && styles.stepperButtonDisabled]}
                                            onPress={() => handleStepperChange('up')}
                                            disabled={offerPremium >= 50}
                                        >
                                            <Text style={styles.stepperButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Reaction Indicator */}
                                <View style={styles.reactionContainer}>
                                    <View style={styles.reactionLabelRow}>
                                        <Text style={styles.reactionLabel}>{t('equity.reactionV1', { v1: getReactionLabel() })}</Text>
                                        <Text style={styles.reactionChance}>
                                            {calculateSuccessChance()}% chance
                                        </Text>
                                    </View>
                                    <View style={styles.reactionBarBg}>
                                        <View
                                            style={[
                                                styles.reactionBarFill,
                                                {
                                                    width: `${calculateSuccessChance()}%`,
                                                    backgroundColor: getReactionColor(),
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>

                                {/* Price Display */}
                                <View style={styles.priceDisplay}>
                                    <Text style={styles.priceLabel}>
                                        {tradeMode === 'buy' ? t('shp.youPay') : t('shp.youReceive')}
                                    </Text>
                                    <Text style={[styles.priceValue, tradeMode === 'sell' && { color: '#C8C0EF' }]}>
                                        {formatMoney(calculateOfferPrice())}
                                    </Text>
                                </View>

                                {/* Make Offer Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.makeOfferButton,
                                        { backgroundColor: tradeMode === 'buy' ? '#C8C0EF' : '#C734CA' }
                                    ]}
                                    onPress={handleMakeOffer}
                                    disabled={animationState !== 'idle'}
                                >
                                    <Text style={styles.makeOfferButtonText}>
                                        {tradeMode === 'buy' ? t('mem.makeOffer') : t('shp.dumpShares')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    {/* Persistent Bottom Bar */}
                    <CrystalNavBar activeTab="Company" variant="dark" />
                </View>

                {/* ANIMATION OVERLAY */}
                {animationState !== 'idle' && (
                    <Animated.View
                        style={[
                            styles.animationOverlay,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        {animationState === 'loading' && (
                            <View style={styles.animationContent}>
                                <ActivityIndicator size="large" color="#6004BD" />
                                <Text style={styles.animationText}>
                                    {tradeMode === 'buy' ? t('shp.negotiating') : t('shp.processing')}
                                </Text>
                            </View>
                        )}
                        {animationState === 'success' && (
                            <View style={styles.animationContent}>
                                <Text style={styles.animationIcon}>✅</Text>
                                <Text style={styles.animationText}>
                                    {tradeMode === 'buy' ? t('shp.offerAccepted') : t('shp.sharesSold')}
                                </Text>
                            </View>
                        )}
                        {animationState === 'failure' && (
                            <View style={styles.animationContent}>
                                <Text style={styles.animationIcon}>❌</Text>
                                <Text style={styles.animationText}>
                                    {tradeMode === 'buy' ? t('shp.offerRejected') : t('shp.saleRejected')}
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                )}
            </View>
        </Modal>
    );
};

export default ShareholderProfileModal;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(2,6,38,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        width: '100%',
        height: '85%',
        backgroundColor: '#020626',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#020626',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 20,
        overflow: 'hidden',
    },
    handleBarContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
    },
    handleBar: {
        width: 48,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#11063D',
    },
    header: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    memberName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    traitBadge: {
        backgroundColor: '#0B0635',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 20,
    },
    traitText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    trustContainer: {
        width: '100%',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    trustLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    trustLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    trustValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    trustBarBg: {
        width: '100%',
        height: 10,
        backgroundColor: '#0B0635',
        borderRadius: 5,
        overflow: 'hidden',
    },
    trustBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        left: 24,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0B0635',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tabSwitcher: {
        flexDirection: 'row',
        padding: 20,
        gap: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#0B0635',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    tabActive: {
        backgroundColor: '#6004BD',
        borderColor: 'rgba(255,255,255,0.06)',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.48)',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100, // Increased padding for BottomStatsBar
    },
    relationsTab: {
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B0635',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 16,
    },
    actionButtonIcon: {
        fontSize: 32,
    },
    actionButtonContent: {
        flex: 1,
    },
    actionButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    actionButtonSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
    },
    adviceBubble: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 8,
    },
    adviceText: {
        fontSize: 16,
        color: '#FFFFFF',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    tradeTab: {
        gap: 32,
    },
    stepperContainer: {
        gap: 16,
    },
    stepperLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stepperButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6004BD',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    stepperButtonDisabled: {
        backgroundColor: '#0B0635',
        borderColor: 'rgba(255,255,255,0.06)',
        opacity: 0.5,
    },
    stepperButtonText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    stepperDisplay: {
        flex: 1,
        height: 56,
        backgroundColor: '#0B0635',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepperPremium: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        marginTop: 2,
    },
    reactionContainer: {
        gap: 12,
    },
    reactionLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    reactionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    reactionChance: {
        fontSize: 16,
        fontWeight: '700',
        color: '#C734CA',
    },
    reactionBarBg: {
        width: '100%',
        height: 16,
        backgroundColor: '#0B0635',
        borderRadius: 8,
        overflow: 'hidden',
    },
    reactionBarFill: {
        height: '100%',
        borderRadius: 8,
    },
    makeOfferButton: {
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#020626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    makeOfferButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    animationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2,6,38,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    animationContent: {
        alignItems: 'center',
        gap: 24,
    },
    animationIcon: {
        fontSize: 96,
    },
    animationText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        textAlign: 'center',
    },
    // Mode Switcher Styles
    modeSwitcher: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#0B0635',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    modeButtonBuyActive: {
        backgroundColor: 'rgba(200,192,239,0.2)',
        borderColor: 'rgba(255,255,255,0.06)',
    },
    modeButtonSellActive: {
        backgroundColor: 'rgba(199,52,202,0.2)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    modeButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.48)',
        letterSpacing: 1,
    },
    modeButtonTextActive: {
        color: '#FFFFFF',
    },
    tradeContext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    priceDisplay: {
        backgroundColor: '#0B0635',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 20,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priceValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#C8C0EF',
    },
});