import { NativeModules } from 'react-native';

const { EconomyBridge } = NativeModules;

export interface FinancialData {
    playerCash: number;
    playerNetWorth: number;
    playerIncome: number;
    playerExpenses: number;
    companyCapital: number;
    companyValuation: number;
    isBankrupt: boolean;

    // Quarterly Report Data
    reportTotalProduction?: number;
    reportTotalSales?: number;
    reportTotalRevenue?: number;
    reportTotalExpenses?: number;
    reportNetProfit?: number;
}

export interface EconomyResult {
    status: 'active' | 'bankrupt';
    reason?: string;
    data: FinancialData;
}

interface EconomyBridgeType {
    getFinancialData(): Promise<FinancialData>;
    advanceTime(months: number): Promise<EconomyResult>;
    restartGame(): Promise<FinancialData>;
}

export const NativeEconomy = EconomyBridge as EconomyBridgeType;

export const formatCurrency = (value: number): string => {
    if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(1)}K`;
    } else {
        return `$${value.toFixed(0)}`;
    }
};
