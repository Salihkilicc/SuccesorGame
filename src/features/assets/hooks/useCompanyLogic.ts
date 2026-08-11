import { useUserStore } from '../../../core/store/useUserStore';
import { useCompanyManagement } from '../../../components/MyCompany/useCompanyManagement';

export const useCompanyLogic = () => {
  const subsidiaries = useUserStore(state => state.subsidiaries);
  const mgmt = useCompanyManagement();

  // ESKI KAPASITE KURALLARI KALDIRILDI.
  // `minEmployees = fabrika x 300` gibi kurallar hem baslangic durumuyla
  // celisiyordu (1 fabrika, 20 calisan) hem de artik anlamsiz: kapasite
  // tesis kademesinden geliyor. Bkz. core/market/capacity.ts

  const handleHireEmployees = (delta: number) => {
    mgmt.updateEmployees(delta);
  };

  // --------------------------------------------------------------------
  //  SHELVED — acquisition buffs
  // --------------------------------------------------------------------
  //  An acquisition is a financial investment now: revenue, profit and
  //  company value, nothing else. This summed a stat bonus off every owned
  //  company, and the quarterly tick read the total in three places. See the
  //  shelved block at the top of core/store/useGameStore.ts for what it did
  //  and why it lost the argument with the earnings model.
  //
  //  Nothing consumed the values below anyway - MyCompanyScreen imports this
  //  hook for `handleHireEmployees` alone - so `activeBuffs` was computed on
  //  every render of that screen and then thrown away.
  // --------------------------------------------------------------------
  //
  // const getAcquisitionBuffs = () => {
  //   let rndSpeed = 0;
  //   let productionCost = 0;
  //   let marketingBoost = 0;
  //   let loanInterest = 0;
  //
  //   subsidiaries.forEach(sub => {
  //     if (sub.acquisitionBuff) {
  //       switch (sub.acquisitionBuff.type) {
  //         case 'R_AND_D_SPEED': rndSpeed += sub.acquisitionBuff.value; break;
  //         case 'PRODUCTION_COST': productionCost += sub.acquisitionBuff.value; break;
  //         case 'MARKETING_BOOST': marketingBoost += sub.acquisitionBuff.value; break;
  //         case 'LOAN_INTEREST': loanInterest += sub.acquisitionBuff.value; break;
  //       }
  //     }
  //   });
  //
  //   return { rndSpeed, productionCost, marketingBoost, loanInterest };
  // };

  return {
    subsidiaries,

    // Restored Legacy Exports
    handleHireEmployees
  };
};