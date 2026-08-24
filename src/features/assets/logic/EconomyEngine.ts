import { FinancialReport, BreakdownItem } from '../types/economyTypes';
import {
    personalQuarter,
    PORTFOLIO_YIELD_QUARTERLY,
    PERSONAL_TAX_RATE,
    MONTHS_PER_QUARTER,
} from '../../../core/market/personalEconomy';

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
        { educationMultiplier, portfolioIncomeQuarterly: dividendIncome },
        { educationCostQuarterly: educationCost, partnerCostQuarterly: partnerQuarterlyCost },
    );

    const salaryQuarterly = q.salary;
    const totalIncome = q.totalIncome + businessProfit;
    const housingCost = q.housing;
    const lifestyleCost = q.lifestyle;
    const tax = q.tax;
    const totalExpenses = q.totalExpenses;

    // 3. Prepare Assets Breakdown
    const cash = statsState?.money || 0;
    const properties = statsState?.propertiesValue || 0;
    const vehicles = statsState?.vehiclesValue || 0;
    const valuables = statsState?.belongingsValue || 0;

    const assetsBreakdown: BreakdownItem[] = [
        { id: 'cash', label: 'Cash (Liquid)', amount: cash, type: 'asset' as const },
        { id: 'investments', label: 'Investments', amount: portfolioValue, type: 'asset' as const },
        { id: 'properties', label: 'Properties', amount: properties, type: 'asset' as const },
        { id: 'vehicles', label: 'Vehicles', amount: vehicles, type: 'asset' as const },
        { id: 'valuables', label: 'Valuables', amount: valuables, type: 'asset' as const }
    ].filter(item => item.amount > 0);

    // 4. Generate Report
    return {
        totalIncome,
        totalExpenses,
        netFlow: totalIncome - totalExpenses,
        // We can add portfolioValue here if needed by UI directly, currently it's in breakdown
        incomeBreakdown: [
            { id: 'salary', label: 'Job Salary', amount: salaryQuarterly, type: 'income' },
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
