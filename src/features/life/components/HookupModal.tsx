/**
 * Hookup Modal - UI Layer (v2)
 * Tinder-style swipe interface with animations and detailed profiles
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    Easing,
    ScrollView
} from 'react-native';
import { theme } from '../../../core/theme';
import { HookupCandidate } from './hookupData';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

interface HookupModalProps {
    visible: boolean;
    candidate: HookupCandidate | null;
    matchStatus: 'IDLE' | 'MATCHED' | 'NO_MATCH';
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    nextCandidate: () => void; // New prop for generating next profile
    onClose: () => void;
}

export function HookupModal({
    visible,
    candidate,
    matchStatus,
    onSwipeLeft,
    onSwipeRight,
    nextCandidate,
    onClose,
}: HookupModalProps) {
    // Animation Values
    const translateX = useRef(new Animated.Value(0)).current;

    // Reset animation when candidate changes
    useEffect(() => {
        if (visible && candidate) {
            translateX.setValue(0);
        }
    }, [candidate, visible]);

    // Handle Match/No Match feedback flow
    useEffect(() => {
        if (matchStatus === 'NO_MATCH') {
            // Auto-advance after ghosted message
            const timer = setTimeout(() => {
                handleNext();
            }, 1500); // 1.5s delay to read "Ghosted"
            return () => clearTimeout(timer);
        }
    }, [matchStatus]);

    /**
     * Safe method to reset and get next candidate
     */
    const handleNext = () => {
        translateX.setValue(0);
        nextCandidate();
    };

    /**
     * Handle Manual Swipe Buttons
     */
    const handlePass = () => {
        Animated.timing(translateX, {
            toValue: -width,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start(() => {
            onSwipeLeft(); // Logic (no-op)
            handleNext(); // Immediately show next
        });
    };

    const handleLike = () => {
        Animated.timing(translateX, {
            toValue: width,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start(() => {
            onSwipeRight(); // Trigger logic check
            // Result handled by useEffect above (NO_MATCH) or Overlay (MATCHED)
        });
    };

    if (!candidate && visible) return null; // Should ideally show loading?

    // Interpolations
    const rotate = translateX.interpolate({
        inputRange: [-width / 2, 0, width / 2],
        outputRange: ['-10deg', '0deg', '10deg'],
        extrapolate: 'clamp',
    });

    const likeOpacity = translateX.interpolate({
        inputRange: [0, width / 4],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const nopeOpacity = translateX.interpolate({
        inputRange: [-width / 4, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    // Determine emoji based on gender
    const avatarEmoji = candidate?.gender === 'female' ? '👩' : '👨';

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>

                {/* SWIPE CARD */}
                {candidate && (
                    <Animated.View
                        style={[
                            styles.card,
                            {
                                backgroundColor: theme.colors.card,
                                transform: [{ translateX }, { rotate }]
                            }
                        ]}
                    >
                        {/* Top Half - Profile Image */}
                        <View style={[styles.imageSection, { backgroundColor: candidate.imageColor }]}>
                            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>

                            {/* Swipe Feedback Overlay - LIKE */}
                            <Animated.View style={[styles.swipeFeedback, styles.likeFeedback, { opacity: likeOpacity }]}>
                                <Text style={styles.likeText}>LIKE</Text>
                            </Animated.View>

                            {/* Swipe Feedback Overlay - NOPE */}
                            <Animated.View style={[styles.swipeFeedback, styles.nopeFeedback, { opacity: nopeOpacity }]}>
                                <Text style={styles.nopeText}>NOPE</Text>
                            </Animated.View>
                        </View>

                        {/* Bottom Half - Info */}
                        <View style={styles.infoSection}>
                            <ScrollView showsVerticalScrollIndicator={false}>

                                {/* Header: Name, Age, Distance */}
                                <View style={styles.headerRow}>
                                    <View>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.name}>{candidate.name}</Text>
                                            <Text style={styles.age}>{candidate.age}</Text>
                                        </View>
                                        <Text style={styles.jobText}>{candidate.job}</Text>
                                    </View>
                                    <View style={styles.distanceBadge}>
                                        <Text style={styles.distanceText}>📍 {candidate.distance}m</Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Interests Chips */}
                                <Text style={styles.sectionTitle}>PASSIONS</Text>
                                <View style={styles.chipsContainer}>
                                    {candidate.interests.map((interest, index) => (
                                        <View key={index} style={styles.chip}>
                                            <Text style={styles.chipText}>{interest}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.divider} />

                                {/* Bio */}
                                <Text style={styles.sectionTitle}>ABOUT ME</Text>
                                <Text style={styles.bioText}>{candidate.bio}</Text>

                                {/* Padding for Scroll */}
                                <View style={{ height: 20 }} />
                            </ScrollView>
                        </View>

                    </Animated.View>
                )}

                {/* CONTROLS (Only visible if IDLE) */}
                {matchStatus === 'IDLE' && (
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.passButton]}
                            onPress={handlePass}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonIcon}>❌</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.smallButton} onPress={onClose}>
                            <Text style={styles.smallButtonText}>Close</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.likeButton]}
                            onPress={handleLike}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonIcon}>💚</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* --- OVERLAYS --- */}

                {/* MATCHED OVERLAY */}
                {matchStatus === 'MATCHED' && candidate && (
                    <View style={styles.overlayContainer}>
                        <View style={[styles.overlayCard, { backgroundColor: '#22C55E' }]}>
                            <Text style={styles.overlayTitle}>IT'S A MATCH! 💕</Text>
                            <Text style={styles.overlaySubtitle}>
                                You and {candidate.name} passed the vibe check.
                            </Text>

                            <View style={styles.overlayAvatarRow}>
                                <View style={[styles.smallAvatar, { backgroundColor: '#333' }]}>
                                    <Text style={{ fontSize: 40 }}>😎</Text>
                                </View>
                                <View style={[styles.smallAvatar, { backgroundColor: candidate.imageColor }]}>
                                    <Text style={{ fontSize: 40 }}>{avatarEmoji}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.keepPlayingBtn}
                                onPress={handleNext}
                            >
                                <Text style={styles.keepPlayingText}>Keep Swiping</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onClose} style={{ marginTop: 15 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* GHOSTED OVERLAY */}
                {matchStatus === 'NO_MATCH' && candidate && (
                    <View style={styles.overlayContainer}>
                        <View style={[styles.overlayCard, { backgroundColor: '#EF4444' }]}>
                            <Text style={styles.overlayTitle}>GHOSTED 👻</Text>
                            <Text style={styles.overlaySubtitle}>
                                {candidate.name} wasn't interested...
                            </Text>
                        </View>
                    </View>
                )}

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: width * 0.92,
        height: height * 0.75,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'absolute',
        top: height * 0.08,
    },
    imageSection: {
        height: '45%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarEmoji: {
        fontSize: 100,
    },
    swipeFeedback: {
        position: 'absolute',
        top: 20,
        paddingHorizontal: 10,
        borderWidth: 4,
        borderRadius: 8,
        transform: [{ rotate: '-15deg' }],
    },
    likeFeedback: {
        left: 20,
        borderColor: '#4ECDC4',
    },
    nopeFeedback: {
        right: 20,
        borderColor: '#FF6B6B',
        transform: [{ rotate: '15deg' }],
    },
    likeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4ECDC4',
    },
    nopeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    infoSection: {
        flex: 1,
        padding: 20,
        backgroundColor: '#1A1D2D', // Slightly lighter than pure black/card
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    name: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    age: {
        fontSize: 24,
        fontWeight: '300',
        color: 'rgba(255,255,255,0.7)',
    },
    jobText: {
        fontSize: 16,
        color: theme.colors.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    distanceBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    distanceText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 10,
        letterSpacing: 1,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: 'rgba(76, 111, 255, 0.15)', // Accent soft
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(76, 111, 255, 0.3)',
    },
    chipText: {
        color: '#4C6FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    bioText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 22,
    },
    buttonsContainer: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 30
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2A2E40',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    passButton: {
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    likeButton: {
        borderWidth: 1,
        borderColor: '#22C55E',
    },
    buttonIcon: {
        fontSize: 28,
    },
    smallButton: {
        padding: 10,
    },
    smallButtonText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14
    },
    // Overlays
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 100,
    },
    overlayCard: {
        width: width * 0.8,
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    overlayTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    overlaySubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 24,
    },
    overlayAvatarRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    smallAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: -10,
        borderWidth: 3,
        borderColor: '#fff',
    },
    keepPlayingBtn: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
    },
    keepPlayingText: {
        color: '#22C55E',
        fontWeight: '800',
        textAlign: 'center',
        fontSize: 16,
    }
});
