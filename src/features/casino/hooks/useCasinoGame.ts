import { useState, useCallback } from 'react';
import { useStatsStore } from '../../../core/store';

export type GameResult = {
    type: 'win' | 'loss';
    amount: number;
};

export const useCasinoGame = () => {
    const { money, update } = useStatsStore();
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
                // We show the total payout or just the profit? 
                // Request says "KAZANDIN! +$20,000" for a win. 
                // If bet is 10k and win is 20k (2x), profit is 10k. 
                // Usually casinos show "WIN $20,000" (total return). 
                // But user request specifically says "Bakiyeyi güncelle" and example "+$20,000".
                // If I bet 10k and get 20k back, my balance increases by 10k.
                // I will display the PROFIT for clarity in "+/-" context.
                // Wait, if I lose I lose 10k. If I win 2x, I get 20k back (10k profit).
                // Let's stick to showing the change in balance.

                result = { type: 'win', amount: Math.floor(betAmount * (multiplier - 1)) };
            } else {
                update({ money: money - betAmount });
                result = { type: 'loss', amount: betAmount };
            }

            setLastResult(result);
            return { success: true, result };
        },
        [money, update],
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
