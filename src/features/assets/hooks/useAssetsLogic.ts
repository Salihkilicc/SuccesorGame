
import { useUserStore } from '../../../core/store/useUserStore';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../core/store/usePlayerStore'; // Restore
import { useEventStore } from '../../../core/store/useEventStore';   // Restore
import { calculateMonthlyFinances } from '../logic/EconomyEngine';

export const useAssetsLogic = () => {
    const user = useUserStore();
    const market = useMarketStore();
    const stats = useStatsStore();
    const player = usePlayerStore(); // Restore
    const eventStore = useEventStore(); // Restore

    // Calculate Real-Time Finances
    // Passing stats to ensure salary is found
    const finances = calculateMonthlyFinances(user, market, stats);

    // Helper for currency formatting
    const formatMoney = (value: number) => {
        const absolute = Math.abs(value);
        if (absolute >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
        if (absolute >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        if (absolute >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
        return `$${value.toLocaleString()}`;
    };

    // --- RESTORED LOGIC FOR UI COMPATIBILITY ---
    const riskApetite = player.personality.riskAppetite;

    // Inventory Calculations
    const getCategoryValue = (types: string[]) =>
        user.inventory.filter(i => types.includes(i.type)).reduce((acc, item) => acc + item.price, 0);

    const propertiesValue = getCategoryValue(['penthouse', 'mansion', 'villa', 'estate', 'apartment', 'yali', 'house', 'land', 'ranch', 'chalet', 'vineyard', 'townhouse', 'lodge', 'camp', 'riad', 'resort', 'suite', 'castle', 'island', 'marina']);
    const vehiclesValue = getCategoryValue(['car', 'plane', 'helicopter', 'jet', 'yacht', 'boat', 'submarine', 'ship', 'cruise_ship']);
    const belongingsValue = getCategoryValue(['art', 'antique', 'artifact', 'weapon', 'ring', 'watch', 'gem', 'necklace', 'bracelet', 'tiara', 'earrings', 'brooch', 'watch_jewelry', 'jewel']);

    const nextMove = (() => {
        if (riskApetite > 65) return 'Consider adding a small position in higher risk assets.';
        if (riskApetite < 40) return 'Keep it safe: focus on blue-chip and lower volatility.';
        return 'Balance your portfolio between growth and stability.';
    })();

    return {
        finances, // { netIncome, totalExpenses, breakdown... }
        cash: stats.money, // Using stats.money as that is the source of truth for cash
        netWorth: stats.netWorth,
        stats: { // Keep compatibility with UI if it checks stats.xyz
            money: stats.money,
            netWorth: stats.netWorth,
            portfolioValue: finances.portfolioValue,
            investmentsValue: finances.portfolioValue, // Alias
            riskApetite,
            strategicSense: player.attributes.intellect,
            lastMarketEvent: eventStore.lastMarketEvent,
            nextMove,
            propertiesValue,
            vehiclesValue,
            belongingsValue
        },
        formatMoney
    };
};