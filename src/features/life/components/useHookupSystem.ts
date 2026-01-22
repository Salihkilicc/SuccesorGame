/**
 * Hookup System - Logic Layer
 * Custom Hook managing all hookup state and business logic
 */

import { useState, useCallback } from 'react';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { generateCandidate, HookupCandidate } from './hookupData';

type MatchStatus = 'IDLE' | 'MATCHED' | 'NO_MATCH';

interface UseHookupSystemReturn {
    // State
    currentCandidate: HookupCandidate | null;
    matchStatus: MatchStatus;
    isModalVisible: boolean;

    // Actions
    startHookup: () => void;
    swipeLeft: () => void;
    swipeRight: () => void;
    nextCandidate: () => void; // New action for UI to trigger after animation
    closeHookupModal: () => void;
}

export function useHookupSystem(): UseHookupSystemReturn {
    const [currentCandidate, setCurrentCandidate] = useState<HookupCandidate | null>(null);
    const [matchStatus, setMatchStatus] = useState<MatchStatus>('IDLE');
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Get player charm from store
    const playerCharm = usePlayerStore((state) => state.attributes.charm);

    /**
     * Start the hookup process - generate candidate and open modal
     */
    const startHookup = useCallback(() => {
        if (!currentCandidate) {
            const newCandidate = generateCandidate();
            setCurrentCandidate(newCandidate);
        }
        setMatchStatus('IDLE');
        setIsModalVisible(true);
    }, [currentCandidate]);

    /**
     * Generate the next candidate (Called by UI after animation completes)
     */
    const nextCandidate = useCallback(() => {
        const newCandidate = generateCandidate();
        setCurrentCandidate(newCandidate);
        setMatchStatus('IDLE');
    }, []);

    /**
     * Swipe Left - Reject candidate
     * Logic is now handled by UI animation -> nextCandidate()
     */
    const swipeLeft = useCallback(() => {
        // No-op here, waiting for UI to call nextCandidate()
    }, []);

    /**
     * Swipe Right - Like candidate
     * Success formula: (Random * 100) + (Charm * 0.8) >= Difficulty
     */
    const swipeRight = useCallback(() => {
        if (!currentCandidate) return;

        // Calculate success chance
        const randomFactor = Math.random() * 100;
        const charmBonus = playerCharm * 0.8;
        const totalScore = randomFactor + charmBonus;

        const isMatch = totalScore >= currentCandidate.difficulty;

        if (isMatch) {
            setMatchStatus('MATCHED');
        } else {
            setMatchStatus('NO_MATCH');
            // Timeout removed - UI will handle the delay and call nextCandidate
        }
    }, [currentCandidate, playerCharm]);

    /**
     * Close modal and reset state
     */
    const closeHookupModal = useCallback(() => {
        setIsModalVisible(false);
        setMatchStatus('IDLE');
        // Keep current candidate for next open
    }, []);

    return {
        // State
        currentCandidate,
        matchStatus,
        isModalVisible,

        // Actions
        startHookup,
        swipeLeft,
        swipeRight,
        nextCandidate,
        closeHookupModal,
    };
}
