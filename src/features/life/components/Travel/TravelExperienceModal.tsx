import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import { VacationSpot } from './data/travelData';
import BottomStatsBar from '../../../../components/common/BottomStatsBar';

type TravelExperienceModalProps = {
    visible: boolean;
    spot: VacationSpot | null;
    resultData: {
        enjoyment: number;
        narrative: string;
        happiness: number;
        foundSouvenir: boolean;
    } | null;
    onComplete: () => void;
    onHomePress: () => void;
};

const { width } = Dimensions.get('window');
const ANIMATION_DURATION = 3000;

const TravelExperienceModal = ({
    visible,
    spot,
    resultData,
    onComplete,
    onHomePress,
}: TravelExperienceModalProps) => {
    const [progress] = useState(new Animated.Value(0));
    const [currentNarrative, setCurrentNarrative] = useState('');
    const [showCompletion, setShowCompletion] = useState(false);

    useEffect(() => {
        if (visible && spot && resultData) {
            // Reset state
            progress.setValue(0);
            setShowCompletion(false);
            setCurrentNarrative('Preparing for departure...');

            // Start animation
            Animated.timing(progress, {
                toValue: 100,
                duration: ANIMATION_DURATION,
                useNativeDriver: false,
            }).start(() => {
                setShowCompletion(true);
            });

            // Update narrative based on progress
            const narrativeTimer1 = setTimeout(() => {
                const lowNarrative = spot.narratives.low[Math.floor(Math.random() * spot.narratives.low.length)];
                setCurrentNarrative(lowNarrative);
            }, ANIMATION_DURATION * 0.2);

            const narrativeTimer2 = setTimeout(() => {
                const midNarrative = spot.narratives.mid[Math.floor(Math.random() * spot.narratives.mid.length)];
                setCurrentNarrative(midNarrative);
            }, ANIMATION_DURATION * 0.5);

            const narrativeTimer3 = setTimeout(() => {
                setCurrentNarrative(resultData.narrative);
            }, ANIMATION_DURATION * 0.8);

            return () => {
                clearTimeout(narrativeTimer1);
                clearTimeout(narrativeTimer2);
                clearTimeout(narrativeTimer3);
            };
        }
    }, [visible, spot, resultData]);

    if (!visible || !spot || !resultData) return null;

    const progressWidth = progress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const iconPosition = progress.interpolate({
        inputRange: [0, 100],
        outputRange: [0, width - 120],
    });

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={() => { }}
        >
            <View style={[styles.container, { backgroundColor: spot.color }]}>
                {!showCompletion ? (
                    <>
                        {/* Journey Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerEmoji}>{spot.emoji}</Text>
                            <Text style={styles.headerTitle}>{spot.name}</Text>
                            <Text style={styles.headerSubtitle}>En Route</Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressBarBg}>
                                <Animated.View
                                    style={[
                                        styles.progressBarFill,
                                        { width: progressWidth }
                                    ]}
                                />
                            </View>

                            {/* Moving Transport Icon */}
                            <Animated.View
                                style={[
                                    styles.transportIcon,
                                    { transform: [{ translateX: iconPosition }] }
                                ]}
                            >
                                <Text style={styles.transportEmoji}>{spot.transportIcon}</Text>
                            </Animated.View>
                        </View>

                        {/* Narrative Log */}
                        <View style={styles.narrativeBox}>
                            <Text style={styles.narrativeText}>{currentNarrative}</Text>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Completion Screen */}
                        <View style={styles.completionHeader}>
                            <Text style={styles.completionEmoji}>{spot.emoji}</Text>
                            <Text style={styles.completionTitle}>Trip Complete!</Text>
                        </View>

                        <View style={styles.narrativeBox}>
                            <Text style={styles.finalNarrative}>{resultData.narrative}</Text>
                        </View>

                        {/* Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statBadge}>
                                <Text style={styles.statText}>Enjoyment: {resultData.enjoyment}%</Text>
                            </View>
                            <View style={styles.statBadge}>
                                <Text style={styles.statText}>Happiness +{resultData.happiness}</Text>
                            </View>
                        </View>

                        {/* Souvenir Hint */}
                        {resultData.foundSouvenir && (
                            <View style={styles.souvenirHint}>
                                <Text style={styles.souvenirHintText}>
                                    ✨ You discovered something special...
                                </Text>
                            </View>
                        )}

                        {/* Continue Button */}
                        <Pressable style={styles.continueButton} onPress={onComplete}>
                            <Text style={styles.continueButtonText}>
                                {resultData.foundSouvenir ? 'INVESTIGATE' : 'RETURN HOME'}
                            </Text>
                        </Pressable>
                    </>
                )}


            </View>
        </Modal>
    );
};

export default TravelExperienceModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111', // Solid base background
        padding: 24,
        paddingBottom: 100, // Add padding for bottom bar
        justifyContent: 'center',
    },
    opaqueLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#111', // Base layer behind spot color
        zIndex: -1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    headerEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#000',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(0,0,0,0.6)',
        fontWeight: '600',
    },
    progressSection: {
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    progressBarBg: {
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 6,
    },
    transportIcon: {
        position: 'absolute',
        top: -20,
        left: 20,
    },
    transportEmoji: {
        fontSize: 32,
    },
    narrativeBox: {
        backgroundColor: 'rgba(0,0,0,0.15)',
        padding: 24,
        borderRadius: 16,
        marginBottom: 24,
        minHeight: 120,
        justifyContent: 'center',
    },
    narrativeText: {
        fontSize: 18,
        color: '#000',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 28,
    },
    completionHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    completionEmoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    completionTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    finalNarrative: {
        fontSize: 20,
        color: '#000',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 32,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    statBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    statText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '700',
    },
    souvenirHint: {
        backgroundColor: 'rgba(255,215,0,0.3)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(255,215,0,0.5)',
    },
    souvenirHintText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    continueButton: {
        backgroundColor: '#000',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
});
