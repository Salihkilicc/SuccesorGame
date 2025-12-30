import Foundation

/// Represents a simple asset with a value
struct Asset {
    let name: String
    let value: Double
}

/// The Player Model containing personal finance data
struct Player {
    // Liquid Cash
    var cash: Double
    
    // Personal Assets (Houses, Cars, Jewelry, etc.)
    var assets: [Asset]
    
    // Ownership in the company
    var companyShares: Int
    
    // Other investments
    var investments: Double
    
    // Personal Debts
    var debts: Double
    
    // Monthly Personal Finances
    var monthlyExpenses: Double // Lifestyle costs
    var monthlyIncome: Double   // Passive income excluding salary/dividends? Or just general tracker?
    
    /// Calculates total Net Worth dynamically
    func calculateNetWorth(sharePrice: Double) -> Double {
        let assetsValue = assets.reduce(0) { $0 + $1.value }
        let stockValue = Double(companyShares) * sharePrice
        
        return cash + stockValue + investments + assetsValue - debts
    }
}
