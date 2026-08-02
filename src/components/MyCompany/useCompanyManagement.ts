import { useCallback } from 'react';
import { useStatsStore } from '../../core/store/useStatsStore';
import { useGameStore } from '../../core/store/useGameStore';

// Bu sabitler kaldirildi: FACTORY_COST / FACTORY_CAPACITY /
// AUTO_HIRE_PER_FACTORY. Kapasite tesis kademesinden geliyor
// (core/market/capacity.ts) ve "fabrika basina 300 kisi" kurali
// baslangic durumunun kendisiyle celisiyordu.

// COMPANY_EVENTS KALDIRILDI — sabit fiyatliydi ve sirket buyudukce
// bedavaya geliyordu. Ayrica EmployeesModule'un kendi ayri listesi vardi,
// yani ayni sey icin uc kaynak. Tek kaynak: core/market/workforce.ts
// -> TEAM_EVENTS (kisi basi fiyatli).

export const useCompanyManagement = () => {
    const {
        factoryCount,
        employeeCount,
        employeeMorale,
        companyExpensesMonthly,
        companyCapital,
        companyRevenueMonthly,
        salaryRatio,
        update,
        setField,
    } = useStatsStore();

    const {
        employeeMorale: gameMorale,
        eventsHostedThisQuarter,
        lastQuarterProfit,
        bonusDistributedThisQuarter,
        organizeEvent: gameOrganizeEvent,
        distributeBonus: gameDistributeBonus,
        setSalaryRatio: gameSetSalaryRatio,
    } = useGameStore();

    // updateFactories KALDIRILDI. "Fabrika sayisi" diye bir sey yok;
    // kapasite tesis kademesinden geliyor (core/market/capacity.ts) ve
    // kontrolu FacilityPanel'de.

    const updateEmployees = useCallback((delta: number) => {
        const nextCount = employeeCount + delta;
        const minRequired = factoryCount * 300;

        if (nextCount < minRequired) {
            // Reject or clamp? 
            // Requirement says "Never drop below", so we clamp or simple return false to indicate fail
            // But for buttons check, we usually disable them.
            // Here we just ensure logic safety.
            return;
        }

        update({ employeeCount: nextCount });
    }, [employeeCount, factoryCount, update]);

    const organizeEvent = useCallback((eventId: string) => gameOrganizeEvent(eventId), [gameOrganizeEvent]);

    const distributeBonus = useCallback((percentage: number) => {
        // Mapping percentage to simply calling declaration?
        // Store logic is fixed to 5% atm.
        gameDistributeBonus();
    }, [gameDistributeBonus]);

    // ESKI KOPRU EMEKLIYE AYRILDI. Maas artik uc kademeli degil, piyasa
    // maasina gore bir ORAN (0.75-1.35). Bkz. core/market/workforce.ts
    const changeSalaryRatio = useCallback((ratio: number) => {
        gameSetSalaryRatio(ratio);
    }, [gameSetSalaryRatio]);

    return {
        factoryCount,
        employeeCount,
        employeeMorale: gameMorale,
        salaryRatio,
        eventsHostedThisQuarter,
        updateEmployees,
        organizeEvent,
        distributeBonus,
        changeSalaryRatio,
        companyCapital,
        lastQuarterProfit,
        bonusDistributedThisQuarter
    };
};
