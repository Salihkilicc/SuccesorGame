
import { useState, useCallback } from 'react';
import { useStatsStore } from '../../../core/store';
import { useCasinoSystem } from './useCasinoSystem';

export type GameResult = {
    type: 'win' | 'loss';
    amount: number;
};

export const useCasinoGame = () => {
    const { money, update } = useStatsStore();
    const { calculateReputationChange } = useCasinoSystem();
    const [lastResult, setLastResult] = useState<GameResult | null>(null);

    const playRound = useCallback(
        (betAmount: number, odds: number = 0.5, multiplier: number = 2) => {
            // Validate balance
            if (money < betAmount) {
                return { success: false, error: 'Insufficient funds' };
            }

            // Simple RNG
            const roll = Math.random();
            const isWin = roll < odds;

            let result: GameResult;

            if (isWin) {
                const netWin = betAmount * multiplier - betAmount; // Profit
                update({ money: money + netWin });
                calculateReputationChange(true);

                result = { type: 'win', amount: Math.floor(betAmount * (multiplier - 1)) };
            } else {
                update({ money: money - betAmount });
                calculateReputationChange(false);

                result = { type: 'loss', amount: betAmount };
            }

            setLastResult(result);
            return { success: true, result };
        },
        [money, update, calculateReputationChange],
    );

    const clearResult = useCallback(() => {
        setLastResult(null);
    }, []);

    return {
        money,
        playRound,
        lastResult,
        clearResult,
    };
};
