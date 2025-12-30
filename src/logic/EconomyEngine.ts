// src/logic/EconomyEngine.ts

export interface EconomyReport {
    productionCount: number;
    salesCount: number;
    revenue: number;
    totalExpenses: number;
    netProfit: number;
    endingCash: number;
    endingCapital: number;
    isBankrupt: boolean;
    bankruptcyReason?: string;
}

// Store'dan gelecek verilerin tipi
interface GameState {
    companyCapital: number;
    productStock: number;
    productionCostPerUnit: number;
    salesPricePerUnit: number;
    monthlyFixedExpenses: number;
    companyDebt: number;
    interestRate: number;
    playerCash: number;
    playerSalary: number;
    playerExpenses: number;
    factoryCount: number;
    employeeCount: number;
    productionLevel: number; // Standing order - persists across turns
}

export const simulateEconomy = (
    currentState: GameState,
    monthsToAdvance: number
): { newState: GameState; report: EconomyReport } => {

    // Başlangıç değerlerini kopyala (Mutable kopya)
    let state = { ...currentState };

    // Rapor için sayaçlar
    let totalProduction = 0;
    let totalSales = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (let i = 0; i < monthsToAdvance; i++) {
        // 1. Sabit Giderler ve Faiz
        // 1. Sabit Giderler ve Faiz
        const factoryMaintenance = state.factoryCount * 1_000_000;
        const employeeWages = state.employeeCount * 5_000; // Maintenance/HR costs

        const debtInterest = state.companyDebt * state.interestRate;
        const fixedCosts = state.monthlyFixedExpenses + debtInterest + factoryMaintenance + employeeWages;

        state.companyCapital -= fixedCosts;
        totalExpenses += fixedCosts;

        if (state.companyCapital < 0) {
            return {
                newState: state,
                report: createReport(state, totalProduction, totalSales, totalRevenue, totalExpenses, true, "Şirket sabit giderleri ödeyemedi.")
            };
        }

        // 2. Production Logic - Standing Order System
        // Use the persistent productionLevel set by the player
        const maxEmployeeCapacity = state.employeeCount * 150; // 150 units per employee

        // Validate: Ensure production doesn't exceed employee capacity
        const validatedProduction = Math.min(state.productionLevel, maxEmployeeCapacity);

        // Check if we have enough capital to produce
        const maxProductionByCapital = Math.floor(state.companyCapital / state.productionCostPerUnit);
        const productionAmount = Math.min(validatedProduction, maxProductionByCapital);

        // Execute production
        if (productionAmount > 0) {
            const productionCost = productionAmount * state.productionCostPerUnit;
            state.companyCapital -= productionCost;
            state.productStock += productionAmount;

            totalProduction += productionAmount;
            totalExpenses += productionCost;
        }

        // 3. Satış Mantığı (Şimdilik üretilenin hepsi satılıyor varsayıyoruz - V1)
        // Stoktaki her şeyi sat
        const salesAmount = state.productStock;
        const revenue = salesAmount * state.salesPricePerUnit;

        state.companyCapital += revenue;
        state.productStock = 0; // Hepsini sattık

        totalSales += salesAmount;
        totalRevenue += revenue;

        // 4. Oyuncu Maaşı ve Giderleri
        // Şirket oyuncuya maaş öder
        state.companyCapital -= state.playerSalary;
        totalExpenses += state.playerSalary;

        if (state.companyCapital < 0) {
            return {
                newState: state,
                report: createReport(state, totalProduction, totalSales, totalRevenue, totalExpenses, true, "Şirket CEO maaşını ödeyemedi.")
            };
        }

        // Oyuncu parayı alır ve kendi giderlerini öder
        state.playerCash += state.playerSalary;
        state.playerCash -= state.playerExpenses;
    }

    // Döngü bitti, iflas yok
    return {
        newState: state,
        report: createReport(state, totalProduction, totalSales, totalRevenue, totalExpenses, false)
    };
};

// Yardımcı Rapor Oluşturucu
const createReport = (
    state: GameState,
    prod: number,
    sales: number,
    rev: number,
    exp: number,
    bankrupt: boolean,
    reason?: string
): EconomyReport => {
    return {
        productionCount: prod,
        salesCount: sales,
        revenue: rev,
        totalExpenses: exp,
        netProfit: rev - exp,
        endingCash: state.playerCash,
        endingCapital: state.companyCapital,
        isBankrupt: bankrupt,
        bankruptcyReason: reason
    };
};