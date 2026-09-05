/**
 * Hookup System - Logic Layer
 * Custom Hook managing all hookup state and business logic
 */

import { useState, useCallback } from 'react';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { useStatsStore } from '../../../core/store';
import {
    cheatingOutcome,
    partnerFromCandidate,
} from '../../love/logic/startRelationship';
import { generateCandidate, HookupCandidate } from './hookupData';

type MatchStatus = 'IDLE' | 'MATCHED' | 'NO_MATCH';

/** What leaving the partner you had cost, if you had one. */
export type MatchConsequence = {
    /** Whether they found out. A marriage always does. */
    caught: boolean;
    /** Money lost. Only ever above zero for a marriage with no prenup. */
    settlement: number;
    partnerName: string;
};

interface UseHookupSystemReturn {
    // State
    currentCandidate: HookupCandidate | null;
    matchStatus: MatchStatus;
    isModalVisible: boolean;
    /**
     * What the last match cost, when there was somebody to leave.
     *
     * Null when the player was single. Exposed rather than swallowed because
     * a settlement that happens silently is the hidden counter this game's
     * design keeps arguing against.
     */
    lastConsequence: MatchConsequence | null;

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
    const [lastConsequence, setLastConsequence] = useState<MatchConsequence | null>(null);

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
            // ------------------------------------------------------------------
            //  A MATCH IS A RELATIONSHIP NOW, NOT A STATUS FLAG
            // ------------------------------------------------------------------
            //  This used to set MATCHED and nothing else. The overlay came up,
            //  the player closed it, and the person they had just matched with
            //  did not exist anywhere - reported as "date de eslesince de
            //  profilde esin dursun".
            //
            //  It goes through the SAME door the VIP encounter uses, including
            //  what it costs to leave the partner you already have. The rules
            //  live in logic/startRelationship.ts so that the two ways in
            //  cannot disagree about what cheating means.
            //
            //  The break up happens BEFORE the new partner is set, in that
            //  order, because setPartner overwrites and `breakup` reads the
            //  person it is ending things with.
            // ------------------------------------------------------------------
            const family = useFamilyStore.getState();
            const existing = family.partner;
            if (existing) {
                const outcome = cheatingOutcome(
                    existing,
                    useStatsStore.getState().money,
                    Math.random() * 100,
                );
                setLastConsequence({
                    caught: outcome.caught,
                    settlement: outcome.settlement,
                    partnerName: existing.name,
                });
                family.breakup(outcome.caught ? 'cheated' : 'drifted');
            } else {
                setLastConsequence(null);
            }
            useFamilyStore.getState().setPartner(partnerFromCandidate(currentCandidate));
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
        lastConsequence,

        // Actions
        startHookup,
        swipeLeft,
        swipeRight,
        nextCandidate,
        closeHookupModal,
    };
}
