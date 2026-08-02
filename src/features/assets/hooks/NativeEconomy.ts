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

/**
 * Geriye donuk uyumluluk icin duruyor.
 * Gercek uygulama artik core/utils icinde — negatif degerleri ve T esigini
 * de dogru islediginden tek kaynak orasi olmali.
 */
export { formatMoney as formatCurrency } from '../../../core/utils';