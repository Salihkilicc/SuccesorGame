
import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayerStore } from '../../../core/store';
import { CASINO_LOCATIONS, LocationId, CasinoLocation } from '../data/casinoData';

export const useCasinoSystem = () => {
    // Switch to PlayerStore (DNA Page Source)
    const { reputation, updateReputation } = usePlayerStore();
    const casinoReputation = reputation.casino;

    // Local state for the currently selected location.
    // Default to the first location (Athens).
    const [currentLocationId, setCurrentLocationId] = useState<LocationId>('athens');

    // Derive the current location object
    const currentLocation = useMemo(
        () => CASINO_LOCATIONS.find((l) => l.id === currentLocationId) || CASINO_LOCATIONS[0],
        [currentLocationId]
    );

    // Determine unlocked locations based on reputation
    const unlockedLocations = useMemo(() => {
        return CASINO_LOCATIONS.filter((loc) => casinoReputation >= loc.requirement);
    }, [casinoReputation]);

    // Check if current location is still valid (locked/unlocked)
    // Auto-switch logic: If the current location becomes locked (e.g., Rep drops),
    // switch to the highest tier available.
    useEffect(() => {
        const isCurrentUnlocked = unlockedLocations.some((l) => l.id === currentLocationId);

        // Strict checking as per requirements (locked if below rep)
        if (!isCurrentUnlocked) {
            // Find the highest unlocked location
            const highestUnlocked = unlockedLocations[unlockedLocations.length - 1];
            if (highestUnlocked && highestUnlocked.id !== currentLocationId) {
                setCurrentLocationId(highestUnlocked.id);
            }
        }
    }, [unlockedLocations, currentLocationId]);

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
        casinoReputation
    };
};
