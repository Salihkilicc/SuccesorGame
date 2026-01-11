import { useUserStore } from '../../../core/store/useUserStore';
import { useCompanyManagement, FACTORY_COST } from '../../../components/MyCompany/useCompanyManagement';

export const useCompanyLogic = () => {
  const subsidiaries = useUserStore(state => state.subsidiaries);
  const mgmt = useCompanyManagement();

  // Legacy Management Logic (Bridged)
  const limits = {
    maxFactories: 100, // Static limit or based on tech
    minEmployees: mgmt.factoryCount * 300,
    maxEmployees: mgmt.factoryCount * 1000 // Capacity based
  };

  const costs = {
    factory: FACTORY_COST,
    employee: 0 // Hiring cost 0, salary is monthly expense
  };

  // Wrapper handlers to match expected signature
  const handlePurchaseFactory = (delta: number) => {
    // ManagementCard likely sends delta or check implementation
    // Assuming delta based on standard usage
    mgmt.updateFactories(delta);
  };

  const handleHireEmployees = (delta: number) => {
    mgmt.updateEmployees(delta);
  };

  // Calculate Total Buffs
  const getAcquisitionBuffs = () => {
    let rndSpeed = 0;
    let productionCost = 0;
    let marketingBoost = 0;
    let loanInterest = 0;

    subsidiaries.forEach(sub => {
      if (sub.acquisitionBuff) {
        switch (sub.acquisitionBuff.type) {
          case 'R_AND_D_SPEED': rndSpeed += sub.acquisitionBuff.value; break;
          case 'PRODUCTION_COST': productionCost += sub.acquisitionBuff.value; break;
          case 'MARKETING_BOOST': marketingBoost += sub.acquisitionBuff.value; break;
          case 'LOAN_INTEREST': loanInterest += sub.acquisitionBuff.value; break;
        }
      }
    });

    return { rndSpeed, productionCost, marketingBoost, loanInterest };
  };

  return {
    subsidiaries,
    getAcquisitionBuffs,
    activeBuffs: getAcquisitionBuffs(),

    // Restored Legacy Exports
    limits,
    costs,
    handlePurchaseFactory,
    handleHireEmployees
  };
};