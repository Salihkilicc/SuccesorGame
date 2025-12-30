import Foundation
import React

@objc(EconomyBridge)
class EconomyBridge: NSObject {
    
    // Shared instance logic
    // We initialise with dummy data as requested: $100K Cash, $500K Capital
    static var sharedManager: GameEconomyManager = {
        let player = Player(
            cash: 100000,
            assets: [],
            companyShares: 50000,
            investments: 0,
            debts: 0,
            monthlyExpenses: 5000,
            monthlyIncome: 0
        )
        let company = Company(
            availableCapital: 500000,
            totalShares: 50000,
            sharePrice: 10, // $500K Valuation
            productionCapacity: 1000,
            productionCostPerUnit: 50,
            salesPricePerUnit: 80, // Profit margin
            monthlyFixedExpenses: 20000,
            debt: 0
        )
        return GameEconomyManager(player: player, company: company, playerSalary: 10000)
    }()
    
    @objc
    func getFinancialData(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let manager = EconomyBridge.sharedManager
        
        let data: [String: Any] = [
            "playerCash": manager.player.cash,
            "playerNetWorth": manager.player.calculateNetWorth(sharePrice: manager.company.sharePrice),
            "playerIncome": manager.player.monthlyIncome + manager.playerSalary, // Including salary
            "playerExpenses": manager.player.monthlyExpenses,
            "companyCapital": manager.company.availableCapital,
            "companyValuation": manager.company.valuation,
            "isBankrupt": manager.company.isBankrupt
        ]
        
        resolve(data)
    }
    
    @objc
    func advanceTime(_ months: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let manager = EconomyBridge.sharedManager
        let state = manager.advanceTime(months: months)
        
        var result: [String: Any] = [:]
        
        switch state {
        case .active:
            result["status"] = "active"
        case .bankrupt(let reason):
            result["status"] = "bankrupt"
            result["reason"] = reason
        }
        
        // Return updated data immediately
        result["data"] = [
            "playerCash": manager.player.cash,
            "playerNetWorth": manager.player.calculateNetWorth(sharePrice: manager.company.sharePrice),
            "playerIncome": manager.player.monthlyIncome + manager.playerSalary,
            "playerExpenses": manager.player.monthlyExpenses,
            "companyCapital": manager.company.availableCapital,
            "companyValuation": manager.company.valuation,
            "isBankrupt": manager.company.isBankrupt
        ]
        
        resolve(result)
    }
    
    @objc
    func restartGame(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // Reset to initial state
        let player = Player(
            cash: 100000,
            assets: [],
            companyShares: 50000,
            investments: 0,
            debts: 0,
            monthlyExpenses: 5000,
            monthlyIncome: 0
        )
        let company = Company(
            availableCapital: 500000,
            totalShares: 50000,
            sharePrice: 10,
            productionCapacity: 1000,
            productionCostPerUnit: 50,
            salesPricePerUnit: 80,
            monthlyFixedExpenses: 20000,
            debt: 0
        )
        EconomyBridge.sharedManager = GameEconomyManager(player: player, company: company, playerSalary: 10000)
        
        // Return fresh data
        self.getFinancialData(resolve, reject: reject)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
