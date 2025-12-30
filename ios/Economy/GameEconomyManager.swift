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
    func advanceTime(months: Int) -> GameState {
        for _ in 0..<months {
            // --- STEP 1: Company Fixed Expenses & Debts ---
            // Deduct salaries, maintenance, and debt interest
            let fixedCosts = company.monthlyFixedExpenses + (company.debt * company.interestRate)
            company.availableCapital -= fixedCosts
            
            if checkBankruptcy() {
                return .bankrupt(reason: "Company ran out of capital paying fixed expenses.")
            }
            
            // --- STEP 2: Production Logic ---
            // Calculate how much we can produce
            // Logic: Produce up to capacity, but limited by available capital
            let maxProductionByCapital = company.availableCapital / company.productionCostPerUnit
            let productionAmount = min(company.productionCapacity, maxProductionByCapital)
            
            // Deduct Production Costs
            let productionCost = productionAmount * company.productionCostPerUnit
            company.availableCapital -= productionCost
             
            // Note: If capital was 0 but capacity > 0, we produce 0.
            // But if we had SOME capital, we spend it.
            // The user wanted "Check Bankruptcy" immediately after cost deduction.
            // Even if we limited production to capital, floating point errors or logic might dip us below 0 if not careful?
            // Actually, since we use `min(..., capital / cost)`, `capital - cost` should be >= 0.
            // BUT, if `availableCapital` was negative coming in (which Step 1 checks), we wouldn't reach here.
            // Let's add the check just in case logic changes or debt is weird.
            if checkBankruptcy() {
                return .bankrupt(reason: "Company capital negative after production costs.")
            }
            
            // Update Stock
            company.productStock += productionAmount
            
            // --- STEP 3: Sales & Revenue ---
            // Assuming 100% sell-through for this basic logic, or you could add a demand factor later.
            // User prompt says: Capital -> Production Cost -> Stock -> Sales -> Revenue
            // Let's assume we sell everything we just made + existing stock? Or just what we made?
            // "Production -> Stock -> Sales". Let's assume we sell all stock for simplicity or demand logic.
            // For now, let's assume market buys everything (simplest V1).
            let salesAmount = company.productStock
            let revenue = salesAmount * company.salesPricePerUnit
            
            company.availableCapital += revenue
            company.productStock = 0 // Sold everything
            
            // (No bankruptcy check needed after ADDING money usually, but good practice if revenue was negative somehow?)
            
            // --- STEP 4: Salary Payment ---
            company.availableCapital -= playerSalary
            
            // Check company bankruptcy due to salary
            if checkBankruptcy() {
                 return .bankrupt(reason: "Company could not afford CEO salary.")
            }
            
            // Add to Player Cash
            player.cash += playerSalary
            
            // --- STEP 5: Personal Expenses ---
            player.cash -= player.monthlyExpenses
            
            // Note: Player bankruptcy is not strictly defined as "Game Over" in the prompt,
            // but usually debt increases or cash goes negative.
            // The prompt emphasized COMPANY bankruptcy.
            // We'll leave player cash going negative as allowed (debt) or handle it later.
        }
        
        return .active
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
