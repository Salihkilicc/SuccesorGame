import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';

const { width, height } = Dimensions.get('window');

interface VoteResult {
    memberId: string;
    vote: 'YES' | 'NO';
    betrayal?: boolean; // Snake betrayal flag
}

interface Props {
    visible: boolean;
    proposalTitle: string;
    voteResults: VoteResult[];
    stockImpact: number; // Percentage change (e.g., -5 or +3)
    onComplete: () => void;
}

const VotingOverlay = ({ visible, proposalTitle, voteResults, stockImpact, onComplete }: Props) => {
    const { members } = useShareholderStore();
    const [currentVoteIndex, setCurrentVoteIndex] = useState(-1);
    const [showVerdict, setShowVerdict] = useState(false);
    const [passed, setPassed] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const verdictScale = useRef(new Animated.Value(0)).current;
    const verdictRotate = useRef(new Animated.Value(0)).current;

    // Card animations (one per vote result)
    const cardAnims = useRef(
        voteResults.map(() => ({
            scale: new Animated.Value(1),
            shake: new Animated.Value(0),
            flash: new Animated.Value(0),
            betrayalFlash: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        if (visible) {
            // Reset state
            setCurrentVoteIndex(-1);
            setShowVerdict(false);
            fadeAnim.setValue(0);
            verdictScale.setValue(0);
            verdictRotate.setValue(0);
            cardAnims.forEach((anim) => {
                anim.scale.setValue(1);
                anim.shake.setValue(0);
                anim.flash.setValue(0);
                anim.betrayalFlash.setValue(0);
            });

            // Fade in overlay
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                // Start vote sequence after 1 second
                setTimeout(() => {
                    startVoteSequence();
                }, 1000);
            });
        }
    }, [visible]);

    const startVoteSequence = () => {
        let index = 0;

        const revealNextVote = () => {
            if (index >= voteResults.length) {
                // All votes revealed, show verdict
                setTimeout(() => {
                    showVerdictAnimation();
                }, 1000);
                return;
            }

            setCurrentVoteIndex(index);
            const result = voteResults[index];
            const anim = cardAnims[index];

            if (result.betrayal) {
                // Snake betrayal: Flash green first, then shatter to red
                Animated.sequence([
                    // Flash green (fake yes)
                    Animated.timing(anim.flash, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.delay(500),
                    // Betrayal flash (turn red)
                    Animated.parallel([
                        Animated.timing(anim.betrayalFlash, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.sequence([
                            Animated.timing(anim.shake, {
                                toValue: 1,
                                duration: 100,
                                useNativeDriver: true,
                            }),
                            Animated.timing(anim.shake, {
                                toValue: -1,
                                duration: 100,
                                useNativeDriver: true,
                            }),
                            Animated.timing(anim.shake, {
                                toValue: 0,
                                duration: 100,
                                useNativeDriver: true,
                            }),
                        ]),
                    ]),
                ]).start();
            } else if (result.vote === 'YES') {
                // Yes vote: Flash green
                Animated.sequence([
                    Animated.timing(anim.scale, {
                        toValue: 1.1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.parallel([
                        Animated.timing(anim.flash, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim.scale, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start();
            } else {
                // No vote: Flash red + shake
                Animated.parallel([
                    Animated.timing(anim.flash, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(anim.shake, {
                            toValue: 1,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim.shake, {
                            toValue: -1,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim.shake, {
                            toValue: 1,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim.shake, {
                            toValue: 0,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start();
            }

            index++;
            setTimeout(revealNextVote, 1200); // 1200ms delay between votes
        };

        revealNextVote();
    };

    const showVerdictAnimation = () => {
        // Calculate if passed (majority yes)
        const yesVotes = voteResults.filter(
            (r) => r.vote === 'YES' && !r.betrayal
        ).length;
        const totalVotes = voteResults.length;
        const votePassed = yesVotes > totalVotes / 2;

        setPassed(votePassed);
        setShowVerdict(true);

        // Stamp animation
        Animated.parallel([
            Animated.spring(verdictScale, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(verdictRotate, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Auto-close after 3 seconds
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => {
                    onComplete();
                });
            }, 3000);
        });
    };

    const getMemberById = (id: string) => {
        return members.find((m) => m.id === id);
    };

    const getVoteColor = (index: number) => {
        if (index > currentVoteIndex) return '#2A2D35'; // Not revealed yet
        const result = voteResults[index];
        if (result.betrayal) return '#FF3B30'; // Red for betrayal
        return result.vote === 'YES' ? '#90EE90' : '#FF3B30';
    };

    const getVoteIcon = (index: number) => {
        if (index > currentVoteIndex) return '?';
        const result = voteResults[index];
        if (result.betrayal) return '🐍';
        return result.vote === 'YES' ? '✓' : '✗';
    };

    const rotation = verdictRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['-15deg', '0deg'],
    });

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                {/* Proposal Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.titleLabel}>BOARD VOTE</Text>
                    <Text style={styles.proposalTitle}>{proposalTitle}</Text>
                </View>

                {/* Vote Cards */}
                <View style={styles.votesContainer}>
                    {voteResults.map((result, index) => {
                        const member = getMemberById(result.memberId);
                        if (!member) return null;

                        const anim = cardAnims[index];
                        const isRevealed = index <= currentVoteIndex;
                        const isCurrent = index === currentVoteIndex;

                        // Determine background color based on state
                        let backgroundColor = '#1C1C1E';
                        if (isRevealed) {
                            if (result.betrayal) {
                                // Betrayal: interpolate from green to red
                                backgroundColor = anim.betrayalFlash.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['rgba(144, 238, 144, 0.3)', 'rgba(255, 59, 48, 0.3)'],
                                }) as any;
                            } else {
                                const flashColor =
                                    result.vote === 'YES'
                                        ? 'rgba(144, 238, 144, 0.3)'
                                        : 'rgba(255, 59, 48, 0.3)';
                                backgroundColor = anim.flash.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['#1C1C1E', flashColor],
                                }) as any;
                            }
                        }

                        const shakeTranslate = anim.shake.interpolate({
                            inputRange: [-1, 0, 1],
                            outputRange: [-10, 0, 10],
                        });

                        return (
                            <Animated.View
                                key={result.memberId}
                                style={[
                                    styles.voteCard,
                                    {
                                        backgroundColor,
                                        transform: [
                                            { scale: anim.scale },
                                            { translateX: shakeTranslate },
                                        ],
                                        borderColor: getVoteColor(index),
                                        borderWidth: isCurrent ? 3 : 1,
                                    },
                                ]}
                            >
                                <View style={styles.voteCardHeader}>
                                    <View style={styles.voteAvatar}>
                                        <Text style={styles.voteAvatarText}>
                                            {member.name.charAt(0)}
                                        </Text>
                                    </View>
                                    <Text style={styles.voteMemberName} numberOfLines={1}>
                                        {member.name}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.voteIcon,
                                        { backgroundColor: getVoteColor(index) },
                                    ]}
                                >
                                    <Text style={styles.voteIconText}>{getVoteIcon(index)}</Text>
                                </View>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Verdict Stamp */}
                {showVerdict && (
                    <Animated.View
                        style={[
                            styles.verdictContainer,
                            {
                                transform: [{ scale: verdictScale }, { rotate: rotation }],
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.verdictText,
                                { color: passed ? '#FFD700' : '#FF3B30' },
                            ]}
                        >
                            {passed ? 'PASSED' : 'REJECTED'}
                        </Text>
                        <View style={styles.impactContainer}>
                            <Text style={styles.impactLabel}>Stock Impact:</Text>
                            <Text
                                style={[
                                    styles.impactValue,
                                    { color: stockImpact >= 0 ? '#90EE90' : '#FF3B30' },
                                ]}
                            >
                                {stockImpact >= 0 ? '+' : ''}
                                {stockImpact.toFixed(1)}%
                            </Text>
                        </View>
                    </Animated.View>
                )}
            </Animated.View>
        </Modal>
    );
};

export default VotingOverlay;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    titleLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#8A9BA8',
        letterSpacing: 2,
        marginBottom: 8,
    },
    proposalTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 1,
    },
    votesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        maxWidth: width - 40,
    },
    voteCard: {
        width: (width - 80) / 2,
        minWidth: 140,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    voteCardHeader: {
        alignItems: 'center',
        gap: 8,
    },
    voteAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    voteAvatarText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000',
    },
    voteMemberName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    voteIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2A2D35',
    },
    voteIconText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#000',
    },
    verdictContainer: {
        position: 'absolute',
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 20,
        padding: 32,
        borderWidth: 4,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 20,
    },
    verdictText: {
        fontSize: 56,
        fontWeight: '900',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    impactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    impactLabel: {
        fontSize: 14,
        color: '#8A9BA8',
        fontWeight: '700',
    },
    impactValue: {
        fontSize: 24,
        fontWeight: '900',
    },
});
