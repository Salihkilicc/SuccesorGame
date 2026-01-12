import { useUserStore, usePlayerStore, useMarketStore } from '../../../core/store';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { calculateQuarterlyFinances } from '../logic/EconomyEngine';
import { Alert } from 'react-native';
import { STOCKS } from '../data/marketData';

export const useAssetsLogic = () => {
    const user = useUserStore((state) => state);
    const stats = useStatsStore((state) => state);

    const { liquidatePortfolio, holdings, marketPrices } = useMarketStore();

    // Calculate "Projected" Report for UI
    const report = calculateQuarterlyFinances(user, { holdings }, stats);

    // Calculate investmentsValue based on CURRENT market prices from store
    const investmentsValue = holdings.reduce((sum, holding) => {
        // Use live price from marketPrices, fallback to averageCost
        const currentPrice = marketPrices[holding.id] || holding.averageCost;
        return sum + (holding.quantity * currentPrice);
    }, 0);

    // Assuming stats now has cash and bank properties, or they are derived
    const cash = stats.money; // Re-using stats.money for cash, adjust if stats has a separate 'cash' property
    const bank = 0; // Stats doesn't have bank, defaulting to 0

    const handleLiquidation = () => {
        const portfolioValue = investmentsValue;

        if (portfolioValue <= 0) {
            Alert.alert("Portfolio Empty", "You don't have any assets to sell.");
            return;
        }

        Alert.alert(
            "Liquidate Portfolio",
            `Are you sure you want to sell all your assets? Estimated value: $${portfolioValue.toLocaleString()}`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sell All",
                    style: "destructive",
                    onPress: () => {
                        const soldAmount = liquidatePortfolio();
                        Alert.alert("Success", `Sold all assets for $${soldAmount.toLocaleString()}`);
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
        bank,
        netWorth: cash + bank + investmentsValue, // Include investments in Net Worth
        report, // { totalIncome, totalExpenses, netFlow, breakdowns... }
        handleLiquidation,
        investmentsValue,
        getPortfolioList,
    };
};