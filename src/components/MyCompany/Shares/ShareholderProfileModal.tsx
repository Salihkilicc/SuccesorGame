import React, { useState, useRef, useEffect } from 'react';
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
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import type { BoardMember } from '../../../features/shareholders/stores/useShareholderStore';

interface ShareholderProfileModalProps {
    visible: boolean;
    member: BoardMember | null;
    onClose: () => void;
}

type TabType = 'relations' | 'trade';
type AnimationStateType = 'idle' | 'loading' | 'success' | 'failure';

const ShareholderProfileModal: React.FC<ShareholderProfileModalProps> = ({
    visible,
    member,
    onClose,
}) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [activeTab, setActiveTab] = useState<TabType>('relations');
    const [offerPremium, setOfferPremium] = useState(0);
    const [animationState, setAnimationState] = useState<AnimationStateType>('idle');
    const [adviceText, setAdviceText] = useState<string | null>(null);
    const [adviceQuality, setAdviceQuality] = useState<'good' | 'bad' | 'neutral' | null>(null);

    // ============================================================================
    // STORES
    // ============================================================================
    const { giftMember, askForAdvice, calculateNegotiationChance } = useShareholderStore();
    const { money } = useStatsStore();

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
            setOfferPremium(0);
            setAnimationState('idle');
            setAdviceText(null);
            setAdviceQuality(null);
        }
    }, [visible]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

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
            Alert.alert('✅ Gift Sent', result.message);
        } else {
            Alert.alert('❌ Failed', result.message);
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

        // Calculate negotiation result
        const result = calculateNegotiationChance(member.id, offerPremium);

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

        // Close modal after 2s
        setTimeout(() => {
            onClose();
            setAnimationState('idle');
        }, 2000);
    };

    // ============================================================================
    // HELPERS
    // ============================================================================

    const getTrustColor = (trust: number) => {
        if (trust < 30) return '#FF453A'; // Red
        if (trust < 50) return '#FF9F0A'; // Orange
        if (trust < 70) return '#FFD60A'; // Yellow
        return '#30D158'; // Green
    };

    const getReactionColor = () => {
        if (offerPremium < 0) return '#FF453A'; // Red - Insulted
        if (offerPremium <= 20) return '#FFD60A'; // Yellow - Neutral
        return '#30D158'; // Green - Happy
    };

    const getReactionLabel = () => {
        if (offerPremium < 0) return 'Insulted';
        if (offerPremium <= 20) return 'Neutral';
        return 'Happy';
    };

    const calculateSuccessChance = () => {
        if (!member) return 0;
        let chance = member.trust;
        if (offerPremium < 0) chance = 0;
        else if (offerPremium > 20) chance = Math.min(100, chance + 30);
        return Math.max(0, Math.min(100, chance));
    };

    const calculateOfferPrice = () => {
        // Placeholder - should use actual stock price from equity store
        const basePrice = 100; // $100 per share
        const premiumMultiplier = 1 + offerPremium / 100;
        return basePrice * premiumMultiplier;
    };

    const getAdviceBubbleStyle = () => {
        const baseStyle = styles.adviceBubble;
        if (adviceQuality === 'good') return [baseStyle, { borderColor: '#30D158', backgroundColor: 'rgba(48, 209, 88, 0.1)' }];
        if (adviceQuality === 'bad') return [baseStyle, { borderColor: '#FF453A', backgroundColor: 'rgba(255, 69, 58, 0.1)' }];
        return [baseStyle, { borderColor: '#FFD60A', backgroundColor: 'rgba(255, 214, 10, 0.1)' }];
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    if (!member) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
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
                                {member.trait}
                            </Text>
                        </View>

                        {/* Trust Bar */}
                        <View style={styles.trustContainer}>
                            <View style={styles.trustLabelRow}>
                                <Text style={styles.trustLabel}>Trust</Text>
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
                            <Text style={[styles.tabText, activeTab === 'relations' && styles.tabTextActive]}>
                                Relations
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'trade' && styles.tabActive]}
                            onPress={() => setActiveTab('trade')}
                        >
                            <Text style={[styles.tabText, activeTab === 'trade' && styles.tabTextActive]}>
                                Trade
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* TAB CONTENT */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {activeTab === 'relations' ? (
                            <View style={styles.relationsTab}>
                                {/* Ask for Advice */}
                                <TouchableOpacity style={styles.actionButton} onPress={handleAskAdvice}>
                                    <Text style={styles.actionButtonIcon}>💬</Text>
                                    <Text style={styles.actionButtonText}>Ask for Advice</Text>
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
                                        <Text style={styles.actionButtonText}>Send Gift</Text>
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
                                        <Text style={styles.actionButtonText}>Host Dinner</Text>
                                        <Text style={styles.actionButtonSubtext}>$100,000 • +15 Trust</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.tradeTab}>
                                {/* Stepper UI */}
                                <View style={styles.stepperContainer}>
                                    <Text style={styles.stepperLabel}>Offer Premium</Text>
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
                                                ${calculateOfferPrice().toFixed(2)}
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
                                        <Text style={styles.reactionLabel}>Reaction: {getReactionLabel()}</Text>
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

                                {/* Make Offer Button */}
                                <TouchableOpacity
                                    style={[styles.makeOfferButton, { backgroundColor: getReactionColor() }]}
                                    onPress={handleMakeOffer}
                                    disabled={animationState !== 'idle'}
                                >
                                    <Text style={styles.makeOfferButtonText}>Make Offer</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
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
                                <ActivityIndicator size="large" color="#0A84FF" />
                                <Text style={styles.animationText}>Negotiating...</Text>
                            </View>
                        )}
                        {animationState === 'success' && (
                            <View style={styles.animationContent}>
                                <Text style={styles.animationIcon}>✅</Text>
                                <Text style={styles.animationText}>OFFER ACCEPTED</Text>
                            </View>
                        )}
                        {animationState === 'failure' && (
                            <View style={styles.animationContent}>
                                <Text style={styles.animationIcon}>❌</Text>
                                <Text style={styles.animationText}>OFFER REJECTED</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#333',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    memberName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    traitBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#444',
        marginBottom: 16,
    },
    traitText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    trustContainer: {
        width: '100%',
        marginTop: 8,
    },
    trustLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    trustLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    trustValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    trustBarBg: {
        width: '100%',
        height: 8,
        backgroundColor: '#2C2C2E',
        borderRadius: 4,
        overflow: 'hidden',
    },
    trustBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    tabSwitcher: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    tabActive: {
        backgroundColor: '#0A84FF',
        borderColor: '#0A84FF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8E8E93',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    relationsTab: {
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#444',
        gap: 12,
    },
    actionButtonIcon: {
        fontSize: 28,
    },
    actionButtonContent: {
        flex: 1,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    actionButtonSubtext: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    adviceBubble: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        marginTop: 8,
    },
    adviceText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    tradeTab: {
        gap: 20,
    },
    stepperContainer: {
        gap: 12,
    },
    stepperLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stepperButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0A84FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#0A84FF',
    },
    stepperButtonDisabled: {
        backgroundColor: '#2C2C2E',
        borderColor: '#444',
        opacity: 0.5,
    },
    stepperButtonText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    stepperDisplay: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#444',
        alignItems: 'center',
    },
    stepperValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepperPremium: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
    },
    reactionContainer: {
        gap: 8,
    },
    reactionLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    reactionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    reactionChance: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFD700',
    },
    reactionBarBg: {
        width: '100%',
        height: 12,
        backgroundColor: '#2C2C2E',
        borderRadius: 6,
        overflow: 'hidden',
    },
    reactionBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    makeOfferButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    makeOfferButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    animationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    animationContent: {
        alignItems: 'center',
        gap: 16,
    },
    animationIcon: {
        fontSize: 80,
    },
    animationText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
});