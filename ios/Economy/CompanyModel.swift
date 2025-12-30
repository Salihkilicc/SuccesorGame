import Foundation

/// The Company Model representing the business entity
class Company {
    // Financials
    var availableCapital: Double
    var isBankrupt: Bool = false
    
    // Stocks
    var totalShares: Int
    var sharePrice: Double
    
    // Production & Operations
    var productionCapacity: Double      // Max units capable of producing
    var productionCostPerUnit: Double   // Cost to make one unit
    var salesPricePerUnit: Double       // Earnings per unit sold
    var productStock: Double            // Current inventory
    
    // Fixed Costs
    var monthlyFixedExpenses: Double    // Salaries, Rent, Maintenance
    
    // Liabilities
    var debt: Double
    var interestRate: Double            // Monthly interest rate (e.g., 0.05 for 5%)
    
    init(availableCapital: Double, totalShares: Int, sharePrice: Double, productionCapacity: Double, productionCostPerUnit: Double, salesPricePerUnit: Double, monthlyFixedExpenses: Double, debt: Double = 0, interestRate: Double = 0) {
        self.availableCapital = availableCapital
        self.totalShares = totalShares
        self.sharePrice = sharePrice
        self.productionCapacity = productionCapacity
        self.productionCostPerUnit = productionCostPerUnit
        self.salesPricePerUnit = salesPricePerUnit
        self.monthlyFixedExpenses = monthlyFixedExpenses
        self.debt = debt
        self.interestRate = interestRate
        self.productStock = 0
    }
    
    /// Market Valuation of the company
    var valuation: Double {
        return Double(totalShares) * sharePrice
    }
}
