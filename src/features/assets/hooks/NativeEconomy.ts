// dosya: src/features/MyCompany/NativeEconomy.ts (veya mevcut yeri)

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
    // Rapor verileri...
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

// ✅ BU FONKSİYONU MERKEZİLEŞTİRDİK
export const formatCurrency = (value: number | undefined | null): string => {
    const val = value || 0;
    if (val >= 1_000_000_000) {
        return `$${(val / 1_000_000_000).toFixed(1)}B`;
    } else if (val >= 1_000_000) {
        return `$${(val / 1_000_000).toFixed(1)}M`;
    } else if (val >= 1_000) {
        return `$${(val / 1_000).toFixed(1)}K`;
    } else {
        return `$${val.toFixed(0)}`;
    }
};