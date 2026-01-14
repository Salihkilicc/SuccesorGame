import { FinancialReport, BreakdownItem } from '../types/economyTypes';

export const calculateQuarterlyFinances = (
    userState: any,
    marketState: any,
    statsState: any
): FinancialReport => {

    // 1. Calculate Income with Education Multiplier
    const baseSalary = 45000; // Base quarterly salary

    // Calculate Education Salary Multiplier (Cumulative)
    const { useEducationStore } = require('../../../core/store/useEducationStore');
    const { completedEducations } = useEducationStore.getState();
    const { EDUCATION_DATA } = require('../../education/data/educationData');

    let educationMultiplier = 1.0;

    completedEducations.forEach((id: string) => {
        const item = EDUCATION_DATA.find((e: any) => e.id === id);
        if (!item) return;

        // Use explicit multiplier if set, otherwise infer from type
        // Certificates have no multiplier (1.0), only academic degrees boost salary
        const multiplier = item.salaryMultiplier ??
            (item.type === 'degree' ? 1.2 :
                item.type === 'master' ? 1.35 :
                    item.type === 'phd' ? 1.5 : 1.0);

        educationMultiplier *= multiplier;
    });

    const salaryQuarterly = baseSalary * educationMultiplier;

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
                // Simple 0.5% quarterly dividend for stocks
                dividendIncome += val * 0.005;
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
                // Funds pay small distributions (0.3% quarterly)
                dividendIncome += val * 0.003;
            }
            // Crypto pays 0 (unless staking is added later)
        });
    }

    // Business Profit (Placeholder)
    const businessProfit = 0;

    const totalIncome = salaryQuarterly + dividendIncome + businessProfit;

    // 2. Calculate Expenses
    const housingCost = 20000;
    const lifestyleCost = 10000;

    // Education Cost (Tuition) - Dual Track Support
    // Note: useEducationStore already required above for salary calculation
    const { activeAcademic, activeCertificate } = useEducationStore.getState();

    let educationCost = 0;

    // Academic Track (Degrees/Masters/PhDs)
    if (activeAcademic && activeAcademic.item.isMonthlyCost) {
        educationCost += activeAcademic.item.cost * 3; // Quarterly = Monthly * 3
    }

    // Certificate Track (Most are one-time, but handle monthly if exists)
    if (activeCertificate && activeCertificate.item.isMonthlyCost) {
        educationCost += activeCertificate.item.cost * 3;
    }


    const tax = totalIncome * 0.20; // 20% Tax

    let partnerQuarterlyCost = 0;
    if (userState.partner && userState.partner.finances) {
        // Assume monthlyCost is stored, convert to Quarterly (x3)
        partnerQuarterlyCost = (userState.partner.finances.monthlyCost || 0) * 3;
    }

    const totalExpenses = housingCost + lifestyleCost + partnerQuarterlyCost + educationCost + tax;

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
            { id: 'tax', label: 'Tax (20%)', amount: tax, type: 'expense' },
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
