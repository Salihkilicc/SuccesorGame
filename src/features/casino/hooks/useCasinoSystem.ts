
import { useEffect, useMemo, useCallback } from 'react';
import { usePlayerStore } from '../../../core/store';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useCasinoRiskStore } from '../../../core/store/useCasinoRiskStore';
import { CASINO_LOCATIONS, LocationId, CasinoLocation, VIP_LOCATION } from '../data/casinoData';
import { VIP_LOCATION_ID, canSeeVip, vipEntry } from '../data/vipRoom';
import { currentQuarter } from '../../../core/story/world';

export const useCasinoSystem = () => {
    // Switch to PlayerStore (DNA Page Source)
    const { reputation, updateReputation } = usePlayerStore();
    const casinoReputation = reputation.casino;
    const cash = useStatsStore(s => s.money);

    // ----------------------------------------------------------------------
    //  THE ROOM IS SHARED STATE, WHICH IT WAS NOT
    // ----------------------------------------------------------------------
    //  This was `useState` in here, and every screen calls this hook
    //  separately - so the lobby, the slots, the blackjack table and the
    //  roulette wheel each had their own copy, all of them starting at Athens.
    //  Travelling to Macau and then opening a game put the player back at the
    //  cheapest table in the game, with the cheapest chips, and nothing said
    //  so. See useCasinoRiskStore.currentLocationId.
    // ----------------------------------------------------------------------
    const currentLocationId = useCasinoRiskStore(s => s.currentLocationId) as LocationId;
    const setCurrentLocationId = useCasinoRiskStore(s => s.setCurrentLocationId);
    const lastVipQuarter = useCasinoRiskStore(s => s.lastVipQuarter);
    const recordVipVisit = useCasinoRiskStore(s => s.recordVipVisit);

    /** The VIP room is not in the ladder array. See data/vipRoom.ts. */
    const inVip = currentLocationId === VIP_LOCATION_ID;

    const currentLocation: CasinoLocation = useMemo(
        () => (inVip
            ? VIP_LOCATION
            : CASINO_LOCATIONS.find((l) => l.id === currentLocationId) || CASINO_LOCATIONS[0]),
        [currentLocationId, inVip],
    );

    // Determine unlocked locations based on reputation
    const unlockedLocations = useMemo(() => {
        return CASINO_LOCATIONS.filter((loc) => casinoReputation >= loc.requirement);
    }, [casinoReputation]);

    // Check if current location is still valid (locked/unlocked)
    // Auto-switch logic: If the current location becomes locked (e.g., Rep drops),
    // switch to the highest tier available.
    useEffect(() => {
        // The VIP room is gated by MONEY and a cooldown rather than by
        // standing, so it is never in `unlockedLocations` and this would throw
        // the player straight back out of a room they paid ten billion to
        // enter.
        if (inVip) return;

        const isCurrentUnlocked = unlockedLocations.some((l) => l.id === currentLocationId);

        // Strict checking as per requirements (locked if below rep)
        if (!isCurrentUnlocked) {
            // Find the highest unlocked location
            const highestUnlocked = unlockedLocations[unlockedLocations.length - 1];
            if (highestUnlocked && highestUnlocked.id !== currentLocationId) {
                setCurrentLocationId(highestUnlocked.id);
            }
        }
    }, [unlockedLocations, currentLocationId, inVip, setCurrentLocationId]);

    // ----------------------------------------------------------------------
    //  THE VIP DOOR
    // ----------------------------------------------------------------------
    /** Whether the button is drawn at all. A billion in cash. */
    const vipVisible = canSeeVip(cash);
    /** Whether it opens tonight, and why not when it does not. */
    const vipDoor = useMemo(
        () => vipEntry(cash, lastVipQuarter, currentQuarter()),
        [cash, lastVipQuarter],
    );

    /**
     * Walk in, and stamp the visit.
     *
     * The stamp happens HERE rather than on the first bet, because the
     * cooldown is on the invitation and not on the gambling: a player who
     * walks in, looks at the numbers and walks out has used their visit. That
     * is what makes the decision cost something before it is made.
     */
    const enterVip = useCallback((): boolean => {
        if (!vipDoor.allowed) return false;
        recordVipVisit(currentQuarter());
        setCurrentLocationId(VIP_LOCATION_ID);
        return true;
    }, [vipDoor.allowed, recordVipVisit, setCurrentLocationId]);

    const leaveVip = useCallback(() => {
        const highest = unlockedLocations[unlockedLocations.length - 1];
        setCurrentLocationId(highest ? highest.id : 'athens');
    }, [unlockedLocations, setCurrentLocationId]);

    // Calculate Reputation Change
    const calculateReputationChange = useCallback((isWin: boolean) => {
        // If Win: +0.2 Rep (slightly buffed for visibility)
        // If Loss: -0.1 Rep

        // OLD LOGIC was +0.1 / -0.2. Let's stick to consistent small gains, punishment on loss.
        // Actually, let's make it slightly more rewarding to grind.
        let change = isWin ? 0.2 : -0.1;

        // Prevent dropping below 0
        const newRep = Math.max(0, casinoReputation + change);

        // Update Global Player Store
        updateReputation('casino', newRep);
    }, [casinoReputation, updateReputation]);

    return {
        currentLocation,
        currentLocationId,
        setCurrentLocationId,
        unlockedLocations,
        calculateReputationChange,
        casinoReputation,
        // ---- the VIP room ----
        inVip,
        vipVisible,
        vipDoor,
        enterVip,
        leaveVip,
    };
};
