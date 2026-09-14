import { useUserStore, usePlayerStore, useMarketStore } from '../../../core/store';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useShareholderStore } from '../../shareholders/stores/useShareholderStore';
// SHELVED: `useEquityStore().stockPrice` is a mirror that starts at zero. See
// the note on `equityValue` below.
// import { useEquityStore } from '../../finance/stores/useEquityStore';
import { personalNetWorth } from '../../../core/market/personalEconomy';
import { useAssetStore } from '../../shopping/store/useAssetStore';
import { calculateQuarterlyFinances } from '../logic/EconomyEngine';
import { Alert } from 'react-native';
import { t } from '../../../core/i18n';
import { STOCKS } from '../data/marketData';
import { formatMoney } from '../../../core/utils';

export const useAssetsLogic = () => {
    const user = useUserStore((state) => state);
    const stats = useStatsStore((state) => state);

    const player = usePlayerStore((state) => state); // Get player store for personality
    const { liquidatePortfolio, holdings, marketPrices } = useMarketStore();
    const { playerShareCount } = useShareholderStore();

    // Calculate "Projected" Report for UI
    const report = calculateQuarterlyFinances(user, { holdings }, stats);

    // Calculate investmentsValue based on CURRENT market prices from store
    const investmentsValue = holdings.reduce((sum, holding) => {
        // Use live price from marketPrices, fallback to averageCost
        const currentPrice = marketPrices[holding.id] || holding.averageCost;
        return sum + (holding.quantity * currentPrice);
    }, 0);

    const cash = stats.money;

    /** What the luxury collection is worth right now, at its condition. */
    const belongingsValue = useAssetStore(s => s.ownedItems)
        .reduce((sum, a) => sum + (a.marketValue || 0), 0);

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
    // ----------------------------------------------------------------------
    //  AND THE PRICE COMES FROM THE STORE THAT KEEPS IT
    // ----------------------------------------------------------------------
    //  This read `useEquityStore().stockPrice`, and the stake showed $0.
    //
    //  That field is a MIRROR. It initialises to zero and is only ever filled
    //  in by `syncStockPrice`, which nothing calls on its own - it runs from
    //  an effect on My Company, from a shareholder action, from an IPO. So the
    //  price was correct if the player had already been to the right screen
    //  this session and zero otherwise, and a founder holding three and a half
    //  million shares was told their stake was worth nothing.
    //
    //  `stats.companySharePrice` is the value that is actually maintained: the
    //  quarterly recalculation writes it from the cap table, `syncStockPrice`
    //  writes it too, and it is persisted. Reading it removes the dependency
    //  on where the player happened to have been.
    // ----------------------------------------------------------------------
    const equityValue = (playerShareCount || 0) * (stats.companySharePrice || 0);

    const handleLiquidation = () => {
        const portfolioValue = investmentsValue;

        if (portfolioValue <= 0) {
            Alert.alert(t('assets.portfolioEmpty'), t('assets.nothingToSell'));
            return;
        }

        Alert.alert(
            t('assets.liquidateTitle'),
            t('assets.liquidateBody', { value: formatMoney(portfolioValue) }),
            [
                { text: t('ui.cancel'), style: "cancel" },
                {
                    text: t('assets.sellAll'),
                    style: "destructive",
                    onPress: () => {
                        const soldAmount = liquidatePortfolio();
                        Alert.alert(
                            t('ui.success'),
                            t('assets.soldAllFor', { amount: formatMoney(soldAmount) }),
                        );
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
        // ------------------------------------------------------------------
        //  AND THE THINGS YOU BOUGHT ARE THINGS YOU OWN
        // ------------------------------------------------------------------
        //  `belongingsValue` has been a term in `personalNetWorth` since it
        //  was written, with a note saying it was waiting for the shop. It was
        //  never passed, so buying a $70M car turned $75.6M of cash into an
        //  object the wealth screen could not see, and the player's net worth
        //  fell by the whole of it. Spending was indistinguishable from
        //  burning.
        //
        //  So this is not an inflation, it is the correction of one. A
        //  purchase is now roughly neutral: down by the 8% luxury tax, and
        //  down further as the condition falls. The player gets poorer for
        //  owning it, slowly, which is the point of the upkeep work - not
        //  instantly and by the sticker price.
        //
        //  Valued at CONDITION, not at what was paid. A neglected fleet is
        //  worth less and the number says so. See core/luxury/upkeep.valueAt.
        // ------------------------------------------------------------------
        netWorth: personalNetWorth({
            cash, equityValue, investmentsValue, belongingsValue,
        }),
        belongingsValue,
        report, // { totalIncome, totalExpenses, netFlow, breakdowns... }
        handleLiquidation,
        investmentsValue,
        getPortfolioList,
        personality: player.personality
    };
};