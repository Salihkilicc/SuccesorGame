
import { useState, useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { VacationSpot } from '../data/travelData';
import { useEncounterSystem } from '../../../../love/components/useEncounterSystem';

const { width } = Dimensions.get('window');
const ANIMATION_DURATION = 3000;

type UseTravelExperienceLogicProps = {
    visible: boolean;
    spot: VacationSpot | null;
    resultData: {
        enjoyment: number;
        narrative: string;
        happiness: number;
        foundSouvenir: boolean;
    } | null;
};

export const useTravelExperienceLogic = ({
    visible,
    spot,
    resultData,
}: UseTravelExperienceLogicProps) => {
    const [progress] = useState(new Animated.Value(0));
    const [currentNarrative, setCurrentNarrative] = useState('');
    const [showCompletion, setShowCompletion] = useState(false);

    // Encounter State
    const {
        triggerEncounter,
        isVisible: isEncounterVisible,
        candidate: encounterCandidate,
        currentScenario: encounterScenario,
        handleDate,
        closeEncounter,
    } = useEncounterSystem();

    // Reset and Animation Logic
    useEffect(() => {
        if (visible && spot && resultData) {
            // Reset state
            progress.setValue(0);
            setShowCompletion(false);
            setCurrentNarrative('Preparing for departure...');

            // Ensure any previous encounter is closed
            closeEncounter();

            // Start animation
            Animated.timing(progress, {
                toValue: 100,
                duration: ANIMATION_DURATION,
                useNativeDriver: false,
            }).start(() => {
                // Animation Complete -> Check for Encounter
                handleTripProgressComplete();
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

    const handleTripProgressComplete = () => {
        if (!spot) return setShowCompletion(true);

        // Try to trigger an encounter
        const encounter = triggerEncounter('travel', spot.id, true);

        if (encounter) {
            console.log('[Travel] Encounter triggered:', encounter.candidate.name);
            // Encounter modal will show automatically due to isEncounterVisible from hook
        } else {
            console.log('[Travel] No encounter, showing completion.');
            setShowCompletion(true);
        }
    };

    const handleEncounterComplete = () => {
        console.log('[Travel] Interaction finished/ignored. Closing encounter...');
        closeEncounter();
        setShowCompletion(true);
    };

    // Interpolations
    const progressWidth = progress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const iconPosition = progress.interpolate({
        inputRange: [0, 100],
        outputRange: [0, width - 120],
    });

    return {
        // State
        currentNarrative,
        showCompletion,
        isEncounterVisible,
        encounterCandidate,
        encounterScenario,

        // Values
        progressWidth,
        iconPosition,

        // Actions
        handleEncounterComplete,
        handleDate,
    };
};
