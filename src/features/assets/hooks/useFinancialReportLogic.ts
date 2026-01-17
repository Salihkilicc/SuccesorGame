import { useStatsStore } from '../../../core/store/useStatsStore';
import { useProductStore } from '../../../core/store/useProductStore';


export interface ProductReportItem {
    id: string;
    name: string;
    produced: number;
    sold: number;
    stock: number;
    profit: number;
    isCriticalStock: boolean;
}

export interface FinancialReportData {
    expenses: {
        salaries: number;
        factoryOverhead: number;
        productionCosts: number;
        marketing: number;
        total: number;
    };
    products: ProductReportItem[];
    totalRevenue: number;
    netProfit: number;
}

export const useFinancialReportLogic = () => {
    const stats = useStatsStore();
    const { products } = useProductStore();


    // 1. Calculate Expenses
    const salaryExpense = stats.employeeCount * 5000;
    const factoryOverhead = stats.factoryCount * 30000000;

    // 2. Process Products (Marketing, Production Costs, Table Data)
    const activeProducts = products.filter(p => p.status === 'active');

    let totalProductionCost = 0;
    let totalMarketingCost = 0;
    let totalRevenue = 0;

    const productReports: ProductReportItem[] = activeProducts.map(product => {
        // Estimations based on quarterly calculations (similar to game engine)
        const quarters = 1; // Reporting for a single quarter period usually

        // Production
        // Note: Replicating logic from useGameStore roughly for display consistency
        const BASE_OUTPUT = 500;
        const complexity = product.complexity || 50;
        const rawProduction = (stats.employeeCount * BASE_OUTPUT) / complexity;
        const maxProduction = Math.floor(rawProduction);
        const utilizationRate = (product.productionLevel ?? 50) / 100;
        const productionVolume = Math.floor(maxProduction * utilizationRate * quarters);

        // Sales (Simplified estimation for display)
        // We use the last known inventory and demand to estimate
        const demandRate = (product.marketDemand || 50) / 100;
        const potentialSales = Math.floor(((product.inventory ?? 0) + productionVolume) * demandRate);
        // Cap sales at available stock
        const salesVolume = Math.min((product.inventory ?? 0) + productionVolume, potentialSales);

        // Costs
        const unitCost = product.unitCost ?? product.baseProductionCost;
        const marketingSpend = product.marketingSpendPerUnit || 0;

        const prodCost = productionVolume * unitCost;
        const marketingCost = salesVolume * marketingSpend;

        totalProductionCost += prodCost;
        totalMarketingCost += marketingCost;

        // Profit
        const revenue = salesVolume * (product.sellingPrice || product.suggestedPrice);
        totalRevenue += revenue;

        const profit = revenue - (prodCost + marketingCost);

        return {
            id: product.id,
            name: product.name,
            produced: productionVolume,
            sold: salesVolume,
            stock: product.inventory ?? 0,
            profit: profit,
            isCriticalStock: (product.inventory ?? 0) === 0 || (product.inventory ?? 0) > 1000000 // Arbitrary high number for "too much stock" warning
        };
    });

    const totalExpenses = salaryExpense + factoryOverhead + totalProductionCost + totalMarketingCost;

    const data: FinancialReportData = {
        expenses: {
            salaries: salaryExpense,
            factoryOverhead: factoryOverhead,
            productionCosts: totalProductionCost,
            marketing: totalMarketingCost,
            total: totalExpenses
        },
        products: productReports,
        totalRevenue,
        netProfit: totalRevenue - totalExpenses
    };

    return {
        data
    };
};
