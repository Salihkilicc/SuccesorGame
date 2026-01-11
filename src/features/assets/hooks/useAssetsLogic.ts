import { useUserStore, usePlayerStore, useMarketStore } from '../../../core/store';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { calculateQuarterlyFinances } from '../logic/EconomyEngine';
import { Alert } from 'react-native';

export const useAssetsLogic = () => {
    const user = useUserStore((state) => state);
    const stats = useStatsStore((state) => state);

    // Calculate "Projected" Report for UI
    const report = calculateQuarterlyFinances(user);

    const { liquidatePortfolio, holdings } = useMarketStore();
    const investmentsValue = holdings.reduce((sum, item) => sum + item.estimatedValue, 0);

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

    return {
        cash,
        bank,
        netWorth: cash + bank + investmentsValue, // Include investments in Net Worth
        report, // { totalIncome, totalExpenses, netFlow, breakdowns... }
        handleLiquidation,
        investmentsValue
    };
};