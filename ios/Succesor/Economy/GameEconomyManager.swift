import Foundation
import Combine

enum GameState {
    case active
    case bankrupt(reason: String)
}

class GameEconomyManager: ObservableObject {
    @Published var player: Player
    @Published var company: Company
    
    // Player's salary from the company
    var playerSalary: Double
    
    init(player: Player, company: Company, playerSalary: Double) {
        self.player = player
        self.company = company
        self.playerSalary = playerSalary
    }
    
    /// Advances time by a specified number of months
    /// Returns the state of the game (active or bankrupt)
    public struct QuarterlyReport {
        var totalProduction: Double = 0
        var totalSales: Double = 0
        var totalRevenue: Double = 0
        var totalExpenses: Double = 0
        var netProfit: Double = 0
    }

    /// Advances time by a specified number of months
    /// Returns the state of the game (active or bankrupt) AND the accumulated report
    func advanceTime(months: Int) -> (GameState, QuarterlyReport) {
        var report = QuarterlyReport()
        
        for _ in 0..<months {
            // --- Step 0: Accumulators for this month ---
            var monthRevenue: Double = 0
            var monthExpenses: Double = 0
            
            // --- STEP 1: Company Fixed Expenses & Debts ---
            // Deduct salaries, maintenance, and debt interest
            let fixedCosts = company.monthlyFixedExpenses + (company.debt * company.interestRate)
            company.availableCapital -= fixedCosts
            monthExpenses += fixedCosts
            
            if checkBankruptcy() {
                report.netProfit = report.totalRevenue - report.totalExpenses
                return (.bankrupt(reason: "Company ran out of capital paying fixed expenses."), report)
            }
            
            // --- STEP 2: Production Logic ---
            // Calculate how much we can produce
            // Logic: Produce up to capacity, but limited by available capital
            let maxProductionByCapital = company.availableCapital / company.productionCostPerUnit
            let productionAmount = min(company.productionCapacity, maxProductionByCapital)
            
            // Deduct Production Costs
            let productionCost = productionAmount * company.productionCostPerUnit
            company.availableCapital -= productionCost
            monthExpenses += productionCost
            
            if checkBankruptcy() {
                report.netProfit = report.totalRevenue - report.totalExpenses
                return (.bankrupt(reason: "Company capital negative after production costs."), report)
            }
            
            // Update Stock & Accumulate
            company.productStock += productionAmount
            report.totalProduction += productionAmount
            
            // --- STEP 3: Sales & Revenue ---
            // "Production -> Stock -> Sales". Let's assume we sell all stock for simplicity or demand logic.
            let salesAmount = company.productStock
            let revenue = salesAmount * company.salesPricePerUnit
            
            company.availableCapital += revenue
            company.productStock = 0 // Sold everything
            
            // Accumulate
            report.totalSales += salesAmount
            monthRevenue += revenue
            
            // --- STEP 4: Salary Payment ---
            company.availableCapital -= playerSalary
            monthExpenses += playerSalary // Company expense
            
            if checkBankruptcy() {
                 report.netProfit = report.totalRevenue - report.totalExpenses
                 return (.bankrupt(reason: "Company could not afford CEO salary."), report)
            }
            
            // Add to Player Cash
            player.cash += playerSalary
            
            // --- STEP 5: Personal Expenses ---
            player.cash -= player.monthlyExpenses
            
            // --- End of Month Aggregation ---
            report.totalRevenue += monthRevenue
            report.totalExpenses += monthExpenses
        }
        
        report.netProfit = report.totalRevenue - report.totalExpenses
        return (.active, report)
    }
    
    /// Checks if the company is bankrupt
    /// Logic: If Available Capital < 0 -> Bankrupt
    private func checkBankruptcy() -> Bool {
        if company.availableCapital < 0 {
            company.isBankrupt = true
            return true
        }
        return false
    }
}
