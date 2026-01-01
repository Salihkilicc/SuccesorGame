import { useStatsStore, useEventStore, useUserStore, useMarketStore } from '../../../store';

export const useAssetsLogic = () => {
    const { netWorth, money, monthlyIncome, monthlyExpenses, riskApetite, strategicSense } = useStatsStore();
    const { lastMarketEvent } = useEventStore();
    const { inventory } = useUserStore();
    const { holdings } = useMarketStore();

    // Helper: Para Formatla
    const formatMoney = (value: number) => {
        const absolute = Math.abs(value);
        if (absolute >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
        if (absolute >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        if (absolute >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
        return `$${value.toLocaleString()}`;
    };

    // Yatırımlar
    const investmentsValue = holdings.reduce((sum, item) => sum + item.estimatedValue, 0);

    // Emlak
    const propertiesValue = inventory
        .filter(i => ['penthouse', 'mansion', 'villa', 'estate', 'apartment', 'yali', 'house', 'land', 'ranch', 'chalet', 'vineyard', 'townhouse', 'lodge', 'camp', 'riad', 'resort', 'suite', 'castle', 'island', 'marina'].includes(i.type))
        .reduce((acc, item) => acc + item.price, 0);

    // Taşıtlar
    const vehiclesValue = inventory
        .filter(i => ['car', 'plane', 'helicopter', 'jet', 'yacht', 'boat', 'submarine', 'ship', 'cruise_ship'].includes(i.type))
        .reduce((acc, item) => acc + item.price, 0);

    // Eşyalar
    const belongingsValue = inventory
        .filter(i => ['art', 'antique', 'artifact', 'weapon', 'ring', 'watch', 'gem', 'necklace', 'bracelet', 'tiara', 'earrings', 'brooch', 'watch_jewelry', 'jewel'].includes(i.type))
        .reduce((acc, item) => acc + item.price, 0);

    // Toplam Net Servet
    const totalNetWorth = netWorth + propertiesValue + vehiclesValue + belongingsValue + investmentsValue;

    // Tavsiye Mantığı
    const nextMove = (() => {
        if (riskApetite > 65) return 'Consider adding a small position in higher risk assets.';
        if (riskApetite < 40) return 'Keep it safe: focus on blue-chip and lower volatility.';
        return 'Balance your portfolio between growth and stability.';
    })();

    return {
        stats: {
            netWorth: totalNetWorth,
            money,
            monthlyIncome,
            monthlyExpenses,
            riskApetite,
            strategicSense,
            investmentsValue,
            propertiesValue,
            vehiclesValue,
            belongingsValue,
            lastMarketEvent,
            nextMove
        },
        formatMoney
    };
};