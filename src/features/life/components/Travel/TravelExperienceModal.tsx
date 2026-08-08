
import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
} from 'react-native';
import { VacationSpot } from './data/travelData';
import { EncounterModal } from '../../../love/components/EncounterModal';
import { useTravelExperienceLogic } from './hooks/useTravelExperienceLogic';

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

const TravelExperienceModal = ({
    visible,
    spot,
    resultData,
    onComplete,
    onHomePress,
}: TravelExperienceModalProps) => {
    useLocale();

    const {
        currentNarrative,
        showCompletion,
        isEncounterVisible,
        encounterCandidate,
        encounterScenario,
        progressWidth,
        iconPosition,
        handleEncounterComplete,
        handleDate,
    } = useTravelExperienceLogic({ visible, spot, resultData });

    if (!visible || !spot || !resultData) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={() => { }}
        >
            <View style={[styles.container, { backgroundColor: spot.color }]}>
                {/* 1. TRAVEL PROGRESS SCREEN */}
                {!showCompletion && !isEncounterVisible && (
                    <>
                        {/* Journey Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerEmoji}>{spot.emoji}</Text>
                            <Text style={styles.headerTitle}>{spot.name}</Text>
                            <Text style={styles.headerSubtitle}>{t('life.enRoute')}</Text>
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
                )}

                {/* 2. ENCOUNTER MODAL - Interjected */}
                <EncounterModal
                    visible={isEncounterVisible}
                    candidate={encounterCandidate}
                    scenario={encounterScenario}
                    context="travel"
                    isEmbedded={true}
                    onIgnore={handleEncounterComplete}
                    onHookup={() => {
                        // Assuming hookup logic is handled elsewhere or we just close for now
                        //Ideally hookup/date outcomes should be impactful, but for this specific request
                        // we just need to handle the flow to completion.
                        // Use hookup check logic if needed via another hook, or just proceed.
                        handleEncounterComplete();
                    }}
                    onDate={() => {
                        handleDate();
                        handleEncounterComplete();
                    }}
                />


                {/* 3. COMPLETION SCREEN (Only after progress AND encounter check) */}
                {showCompletion && (
                    <>
                        {/* Completion Screen */}
                        <View style={styles.completionHeader}>
                            <Text style={styles.completionEmoji}>{spot.emoji}</Text>
                            <Text style={styles.completionTitle}>{t('life.tripComplete')}</Text>
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
        backgroundColor: '#31241F', // Solid base background
        padding: 24,
        paddingBottom: 100, // Add padding for bottom bar
        justifyContent: 'center',
    },
    opaqueLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#31241F', // Base layer behind spot color
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
        color: '#31241F',
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
        color: '#31241F',
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
        color: '#31241F',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    finalNarrative: {
        fontSize: 20,
        color: '#31241F',
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
        color: '#31241F',
        fontSize: 14,
        fontWeight: '700',
    },
    souvenirHint: {
        backgroundColor: 'rgba(233,184,201,0.3)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(233,184,201,0.5)',
    },
    souvenirHintText: {
        color: '#31241F',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    continueButton: {
        backgroundColor: '#31241F',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#FFFFFF',
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
