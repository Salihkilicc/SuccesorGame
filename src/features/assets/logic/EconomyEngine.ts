import { FinancialReport, BreakdownItem } from '../types/economyTypes';
import {
    personalQuarter,
    PORTFOLIO_YIELD_QUARTERLY,
    PERSONAL_TAX_RATE,
    MONTHS_PER_QUARTER,
} from '../../../core/market/personalEconomy';
import { payCeiling } from '../../../core/market/ceoPay';
import { trailingTotal } from '../../../core/market/equity';

export const calculateQuarterlyFinances = (
    userState: any,
    marketState: any,
    statsState: any
): FinancialReport => {

    // ----------------------------------------------------------------------
    //  THE NUMBERS MOVED OUT
    // ----------------------------------------------------------------------
    //  45,000 / 20,000 / 10,000 / 20% were typed here, and useStatsStore held
    //  a DIFFERENT salary under the name `monthlyIncome`. See
    //  core/market/personalEconomy.ts for what that cost and why every
    //  constant there says whether it is monthly or quarterly.
    // ----------------------------------------------------------------------
    const { useEducationSystem } = require('../../life/components/Education/store/useEducationSystem');
    const educationMultiplier = useEducationSystem.getState().salaryMultiplier();

    let dividendIncome = 0;

    // Calculate Dividends & Portfolio Value
    let portfolioValue = 0;
    if (marketState && marketState.holdings) {
        marketState.holdings.forEach((h: any) => {
            // Use averageCost as fallback if current price isn't available in this context
            // ideally marketState should have current prices or we'd pass a price map
            const val = h.quantity * h.averageCost;
            portfolioValue += val;

            if (h.type === 'stock') {
                dividendIncome += val * PORTFOLIO_YIELD_QUARTERLY.stock;
            } else if (h.type === 'bond') {
                // Bonds pay coupons based on Face Value, not current price/cost
                // Assuming h has faceValue and couponRate attached, OR we need to look it up?
                // The HoldingItem in useMarketStore DOES NOT currently copy detailed fields like 'couponRate'.
                // It only has { id, symbol, quantity, averageCost, type }.
                // We MUST look up the static data to get the coupon rate.
                // We'll trust the 'id' matches valid market items.
                const { INITIAL_MARKET_ITEMS } = require('../data/marketData');
                const itemData = INITIAL_MARKET_ITEMS.find((i: any) => i.id === h.id);

                if (itemData && itemData.couponRate) {
                    // Annual Coupon = faceValue * couponRate
                    // Quarterly = (quantity * faceValue * couponRate) / 4
                    // Note: BondItem definition has 'faceValue'.
                    const faceValue = itemData.faceValue || 1000;
                    const annualCoupon = h.quantity * faceValue * itemData.couponRate;
                    dividendIncome += annualCoupon / 4;
                }
            } else if (h.type === 'fund') {
                dividendIncome += val * PORTFOLIO_YIELD_QUARTERLY.fund;
            }
            // Crypto pays 0 (unless staking is added later)
        });
    }

    // Business Profit (Placeholder)
    const businessProfit = 0;

    const educationCost = useEducationSystem.getState().getCurrentQuarterlyCost();

    let partnerQuarterlyCost = 0;
    if (userState.partner && userState.partner.finances) {
        partnerQuarterlyCost = (userState.partner.finances.monthlyCost || 0) * MONTHS_PER_QUARTER;
    }

    const q = personalQuarter(
        {
            educationMultiplier,
            portfolioIncomeQuarterly: dividendIncome,
            // What the board let the player award themselves, and the roof
            // that number was measured against. Both, because education
            // multiplies the first by up to six and would otherwise carry it
            // straight through the second. See ceoPay.ts.
            ceoPayQuarterly: statsState?.ceoPayQuarterly,
            payCeilingQuarterly: payCeiling(trailingTotal(statsState?.revenueHistory ?? [])),
        },
        { educationCostQuarterly: educationCost, partnerCostQuarterly: partnerQuarterlyCost },
    );

    const salaryQuarterly = q.salary;
    const totalIncome = q.totalIncome + businessProfit;
    const housingCost = q.housing;
    const lifestyleCost = q.lifestyle;
    const tax = q.tax;
    const totalExpenses = q.totalExpenses;

    // ----------------------------------------------------------------------
    //  3. WHAT THE PLAYER HOLDS
    // ----------------------------------------------------------------------
    //  THREE OF THESE FIVE ROWS COULD NEVER APPEAR:
    //
    //      const properties = statsState?.propertiesValue || 0;
    //      const vehicles   = statsState?.vehiclesValue   || 0;
    //      const valuables  = statsState?.belongingsValue || 0;
    //
    //  Those three fields are READ here and written NOWHERE in the codebase.
    //  They belong to the shopping feature, which is flagged off. The
    //  `.filter(amount > 0)` below then removed them silently, so the screen
    //  showed two rows out of five and nothing anywhere said why.
    //
    //  Shelved rather than deleted: when shopping returns, this is where the
    //  rows come back, and `personalEconomy.WealthInput.belongingsValue` is
    //  the term already waiting for them in the net worth.
    //
    //  AND THE PLAYER'S SHAREHOLDING WAS NEVER IN THIS LIST AT ALL - usually
    //  the largest thing they own. The personal screen builds its own holdings
    //  list from `useAssetsLogic` now, which has the stake, so this array has
    //  no reader. Kept because the report TYPE still carries it and because
    //  it is the shape the shopping rows return to.
    // ----------------------------------------------------------------------
    const cash = statsState?.money || 0;

    const assetsBreakdown: BreakdownItem[] = [
        { id: 'cash', label: 'Cash (Liquid)', amount: cash, type: 'asset' as const },
        { id: 'investments', label: 'Investments', amount: portfolioValue, type: 'asset' as const },
        // { id: 'properties', label: 'Properties', amount: properties, type: 'asset' as const },
        // { id: 'vehicles', label: 'Vehicles', amount: vehicles, type: 'asset' as const },
        // { id: 'valuables', label: 'Valuables', amount: valuables, type: 'asset' as const },
    ].filter(item => item.amount > 0);

    // 4. Generate Report
    return {
        totalIncome,
        totalExpenses,
        netFlow: totalIncome - totalExpenses,
        // We can add portfolioValue here if needed by UI directly, currently it's in breakdown
        incomeBreakdown: [
            // "Job Salary" was the old label, and the player does not have a
            // job. This is CEO pay, the board can cap it, and it is decided
            // under Equity - which the personal screen now links to from the
            // row that shows this number.
            { id: 'salary', label: 'Your pay as CEO', amount: salaryQuarterly, type: 'income' },
            ...(dividendIncome > 0 ? [{ id: 'dividends', label: 'Portfolio Income (Divs/Interest)', amount: dividendIncome, type: 'income' as const }] : []),
            ...(businessProfit > 0 ? [{ id: 'business', label: 'Business Profit', amount: businessProfit, type: 'income' as const }] : [])
        ],
        expenseBreakdown: [
            { id: 'tax', label: `Tax (${Math.round(PERSONAL_TAX_RATE * 100)}%)`, amount: tax, type: 'expense' },
            { id: 'housing', label: 'Housing & Rent', amount: housingCost, type: 'expense' },
            { id: 'lifestyle', label: 'Personal/Lifestyle', amount: lifestyleCost, type: 'expense' },
            ...(educationCost > 0 ? [{ id: 'education', label: 'Tuition Fees', amount: educationCost, type: 'expense' as const }] : []),
            ...(partnerQuarterlyCost > 0 ? [{
                id: 'partner',
                label: 'Partner Upkeep',
                amount: partnerQuarterlyCost,
                type: 'expense' as const
            }] : [])
        ],
        assetsBreakdown,
        educationMultiplier,
        educationBonus: educationMultiplier > 1.0 ? `+${Math.round((educationMultiplier - 1) * 100)}%` : undefined
    };
};
