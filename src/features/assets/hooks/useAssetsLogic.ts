import { useUserStore, usePlayerStore, useMarketStore } from '../../../core/store';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useShareholderStore } from '../../shareholders/stores/useShareholderStore';
import { useEquityStore } from '../../finance/stores/useEquityStore';
import { personalNetWorth } from '../../../core/market/personalEconomy';
import { calculateQuarterlyFinances } from '../logic/EconomyEngine';
import { Alert } from 'react-native';
import { STOCKS } from '../data/marketData';
import { formatMoney } from '../../../core/utils';

export const useAssetsLogic = () => {
    const user = useUserStore((state) => state);
    const stats = useStatsStore((state) => state);

    const player = usePlayerStore((state) => state); // Get player store for personality
    const { liquidatePortfolio, holdings, marketPrices } = useMarketStore();
    const { playerShareCount } = useShareholderStore();
    const { stockPrice } = useEquityStore();

    // Calculate "Projected" Report for UI
    const report = calculateQuarterlyFinances(user, { holdings }, stats);

    // Calculate investmentsValue based on CURRENT market prices from store
    const investmentsValue = holdings.reduce((sum, holding) => {
        // Use live price from marketPrices, fallback to averageCost
        const currentPrice = marketPrices[holding.id] || holding.averageCost;
        return sum + (holding.quantity * currentPrice);
    }, 0);

    const cash = stats.money;

    // ----------------------------------------------------------------------
    //  `bank` IS SHELVED
    // ----------------------------------------------------------------------
    //      const bank = 0; // Stats doesn't have bank, defaulting to 0
    //
    //  A constant zero with a comment admitting it is a constant zero, added
    //  to a total and shown as an account the player has. There is no bank in
    //  this game; when there is one, it becomes a real field on the stats
    //  store and joins `personalNetWorth` as a real term.
    // ----------------------------------------------------------------------

    // ----------------------------------------------------------------------
    //  THE STAKE, WHICH IS USUALLY MOST OF THE ANSWER
    // ----------------------------------------------------------------------
    //  HomeScreen computed this itself and the Assets screen did not have it
    //  at all, so the card and the screen behind it disagreed about the same
    //  number under the same name. One derivation now, here, where both of
    //  them already look. See personalEconomy.personalNetWorth.
    // ----------------------------------------------------------------------
    const equityValue = (playerShareCount || 0) * (stockPrice || 0);

    const handleLiquidation = () => {
        const portfolioValue = investmentsValue;

        if (portfolioValue <= 0) {
            Alert.alert("Portfolio Empty", "You don't have any assets to sell.");
            return;
        }

        Alert.alert(
            "Liquidate Portfolio",
            `Are you sure you want to sell all your assets? Estimated value: ${formatMoney(portfolioValue)}`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sell All",
                    style: "destructive",
                    onPress: () => {
                        const soldAmount = liquidatePortfolio();
                        Alert.alert("Success", `Sold all assets for ${formatMoney(soldAmount)}`);
                    }
                }
            ]
        );
    };

    // Get portfolio list with current market data from live prices
    const getPortfolioList = () => {
        return holdings.map(holding => {
            // Use live market price from store
            const currentPrice = marketPrices[holding.id] || holding.averageCost;

            // Find name from static data (name doesn't change)
            let name = holding.symbol;
            for (const category of Object.values(STOCKS)) {
                const stock = category.find(s => s.symbol === holding.symbol);
                if (stock) {
                    name = stock.name || stock.symbol;
                    break;
                }
            }

            const currentValue = holding.quantity * currentPrice;
            const costBasis = holding.quantity * holding.averageCost;
            const profitLoss = currentValue - costBasis;
            const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

            return {
                symbol: holding.symbol,
                name,
                quantity: holding.quantity,
                averageCost: holding.averageCost,
                currentPrice,
                currentValue,
                profitLoss,
                profitLossPercent,
                type: holding.type,
            };
        });
    };

    return {
        cash,
        equityValue,
        netWorth: personalNetWorth({ cash, equityValue, investmentsValue }),
        report, // { totalIncome, totalExpenses, netFlow, breakdowns... }
        handleLiquidation,
        investmentsValue,
        getPortfolioList,
        personality: player.personality
    };
};