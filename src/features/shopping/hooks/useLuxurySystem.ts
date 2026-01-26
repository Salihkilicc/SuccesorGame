import { useMemo, useEffect } from 'react';
import { useAssetPortfolio } from './useAssetPortfolio';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useAssetStore } from '../store/useAssetStore';

const MAX_WEALTH = 10_000_000_000; // $10 Billion

export const useLuxurySystem = () => {
    const { netWorth } = useAssetPortfolio();
    const { appliedLuxuryBuff, setAppliedLuxuryBuff } = useAssetStore();

    // 1. Calculate Wealth Percentage (0 - 100%)
    const percentage = useMemo(() => {
        const rawPercentage = (netWorth / MAX_WEALTH) * 100;
        return Math.min(Math.max(rawPercentage, 0), 100);
    }, [netWorth]);

    // 2. Calculate Passive Stat Buffs
    // Max +50 Stats at 100% Wealth
    const buffAmount = useMemo(() => {
        return Math.floor(percentage * 0.5);
    }, [percentage]);

    // 3. EFFECT: Inject Real Stats
    useEffect(() => {
        const delta = buffAmount - appliedLuxuryBuff;

        if (delta !== 0) {
            console.log(`[Luxury System] Applying buff delta: ${delta}`);

            // Get current values to prevent race conditions or stale closures
            const state = usePlayerStore.getState();

            // Update Stats
            state.updateReputation('social', (state.reputation.social || 0) + delta);
            state.updateReputation('business', (state.reputation.business || 0) + delta);
            state.updateAttribute('charm', (state.attributes.charm || 0) + delta);

            // Update Memory
            setAppliedLuxuryBuff(buffAmount);
        }
    }, [buffAmount, appliedLuxuryBuff, setAppliedLuxuryBuff]);

    return {
        netWorth,
        maxWealth: MAX_WEALTH,
        percentage,
        buffAmount,
    };
};
