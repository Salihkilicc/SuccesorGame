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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useEquityStore } from '../../../features/finance/stores/useEquityStore';
import type { BoardMember } from '../../../features/shareholders/stores/useShareholderStore';
import { formatMoney, formatNumber, formatPrice } from '../../../core/utils';
import ScreenHeader from '../../common/ScreenHeader';
import { theme } from '../../../core/theme';
import ConfirmPanel, { type ConfirmLine } from '../../common/ConfirmPanel';
import { getTraitVisual } from './BoardRoomModal';

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
    // Results are shown in place rather than in a system Alert - see
    // components/common/ConfirmPanel.
    const [panel, setPanel] = useState<null | {
        title: string;
        summary?: string;
        lines?: ConfirmLine[];
        confirmLabel: string;
        tone?: 'default' | 'danger';
    }>(null);

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

        setPanel({
            title: result.success ? t('mem.giftSent') : t('common.failed'),
            summary: result.message,
            confirmLabel: 'OK',
            tone: result.success ? 'default' : 'danger',
        });
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
            setPanel({
                title: tradeMode === 'buy' ? 'Purchase failed' : 'Sale failed',
                summary: result.message,
                confirmLabel: 'OK',
                tone: 'danger',
            });
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
        if (trust < 30) return '#FF8A8A'; // Red
        if (trust < 50) return '#FF8A8A'; // Orange
        if (trust < 70) return '#FF8A8A'; // Yellow
        return '#CFD0D2'; // Green
    };

    const getReactionColor = () => {
        if (offerPremium < 0) return '#FF8A8A'; // Red - Insulted
        if (offerPremium <= 20) return '#FF8A8A'; // Yellow - Neutral
        return '#CFD0D2'; // Green - Happy
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
        if (adviceQuality === 'good') return [baseStyle, { borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(207,208,210,0.1)' }];
        if (adviceQuality === 'bad') return [baseStyle, { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(5,168,246,0.1)' }];
        return [baseStyle, { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(5,168,246,0.1)' }];
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    if (!member) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ScreenHeader
                        title={member.name}
                        subtitle={t('data.trait.' + member.trait)}
                        onBack={onClose}
                        inset={false}
                        category="people"
                    />

                    {/* The portrait block. It used to carry the name and the
                        close button as well; both moved into the header, so
                        what is left here is the picture. */}
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, { backgroundColor: `${getTraitVisual(member.trait).color}15`, borderWidth: 2, borderColor: `${getTraitVisual(member.trait).color}40` }]}>
                                <MaterialCommunityIcons name={getTraitVisual(member.trait).icon} size={36} color={getTraitVisual(member.trait).color} />
                            </View>
                        </View>

                        <Text style={styles.memberName}>{member.name}</Text>

                        <View style={[styles.traitBadge, { backgroundColor: `${getTraitVisual(member.trait).color}15`, borderColor: `${getTraitVisual(member.trait).color}35`, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                            <MaterialCommunityIcons name={getTraitVisual(member.trait).icon} size={14} color={getTraitVisual(member.trait).color} />
                            <Text style={[styles.traitText, { color: getTraitVisual(member.trait).color }]}>
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

                        {/* SHELVED: the ✕ that used to float over the portrait.
                            A close in the top right of a card, when every
                            other screen leaves by an arrow in the top left,
                            is the inconsistency the player asked to end. The
                            header above carries the way out now. */}
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
                                    <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                                        <MaterialCommunityIcons name="chat-question-outline" size={22} color="#38BDF8" />
                                    </View>
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
                                    <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.3)' }]}>
                                        <MaterialCommunityIcons name="gift-outline" size={22} color="#FBBF24" />
                                    </View>
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
                                    <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(96, 165, 250, 0.15)', borderColor: 'rgba(96, 165, 250, 0.3)' }]}>
                                        <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#60A5FA" />
                                    </View>
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
                                <View style={{ backgroundColor: '#434B50', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', marginBottom: 4 }}>{t('equity.currentStockPrice')}</Text>
                                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF' }}>{formatPrice(stockPrice)}</Text>
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
                                    <Text style={[styles.priceValue, tradeMode === 'sell' && { color: '#FFFFFF' }]}>
                                        {formatMoney(calculateOfferPrice())}
                                    </Text>
                                </View>

                                {/* Make Offer Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.makeOfferButton,
                                        { backgroundColor: tradeMode === 'buy' ? '#CFD0D2' : '#FF8A8A' }
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
                                <ActivityIndicator size="large" color="#05A8F6" />
                                <Text style={styles.animationText}>
                                    {tradeMode === 'buy' ? t('shp.negotiating') : t('shp.processing')}
                                </Text>
                            </View>
                        )}
                        {animationState === 'success' && (
                            <View style={styles.animationContent}>
                                <MaterialCommunityIcons name="check-circle-outline" size={48} color="#34D399" />
                                <Text style={styles.animationText}>
                                    {tradeMode === 'buy' ? t('shp.offerAccepted') : t('shp.sharesSold')}
                                </Text>
                            </View>
                        )}
                        {animationState === 'failure' && (
                            <View style={styles.animationContent}>
                                <MaterialCommunityIcons name="close-circle-outline" size={48} color="#F87171" />
                                <Text style={styles.animationText}>
                                    {tradeMode === 'buy' ? t('shp.offerRejected') : t('shp.saleRejected')}
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                )}
            </View>

            <ConfirmPanel
                visible={!!panel}
                title={panel?.title || ''}
                summary={panel?.summary}
                lines={panel?.lines}
                tone={panel?.tone}
                confirmLabel={panel?.confirmLabel || 'OK'}
                onCancel={() => setPanel(null)}
            />
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
        backgroundColor: 'rgba(28,36,44,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        width: '100%',
        height: '85%',
        backgroundColor: '#1C242C',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#1C242C',
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
        backgroundColor: '#535B5F',
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
        backgroundColor: '#434B50',
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
        backgroundColor: '#434B50',
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
        backgroundColor: '#434B50',
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
        backgroundColor: '#434B50',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    tabActive: {
        backgroundColor: '#05A8F6',
        borderColor: 'rgba(255,255,255,0.06)',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.48)',
    },
    tabTextActive: {
        color: theme.colors.onLight,
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
        backgroundColor: '#434B50',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 16,
    },
    actionIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
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
        backgroundColor: '#05A8F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    stepperButtonDisabled: {
        backgroundColor: '#434B50',
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
        backgroundColor: '#434B50',
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
        color: theme.colors.textPrimary,
    },
    reactionBarBg: {
        width: '100%',
        height: 16,
        backgroundColor: '#434B50',
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
        shadowColor: '#1C242C',
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
        backgroundColor: 'rgba(28,36,44,0.95)',
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
        backgroundColor: '#434B50',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    modeButtonBuyActive: {
        backgroundColor: 'rgba(207,208,210,0.2)',
        borderColor: 'rgba(255,255,255,0.06)',
    },
    modeButtonSellActive: {
        backgroundColor: 'rgba(5,168,246,0.2)',
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
        backgroundColor: '#434B50',
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
        color: '#FFFFFF',
    },
});