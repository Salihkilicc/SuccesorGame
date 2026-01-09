import { Alert } from 'react-native';
import { useStatsStore } from '../../../core/store';

export const useCompanyLogic = () => {
  const {
    companyCapital,
    factoryCount,
    employeeCount,
    setField,
  } = useStatsStore();

  // --- HEDEFLENEN SINIRLAR ---
  const MAX_FACTORIES = 500; // Hedef: 500 Fabrika
  // Hedef: 160.000 İşçi => 160.000 / 500 = 320 İşçi/Fabrika
  const WORKERS_PER_FACTORY_CAPACITY = 320;

  // Fabrika kurulunca otomatik gelen işçi (Opsiyonel, dengede kalsın diye 120 bıraktık)
  const WORKERS_INCLUDED_WITH_FACTORY = 120;

  const COST_FACTORY = 500_000;
  const COST_EMPLOYEE = 5_000;

  // Anlık Maksimum İşçi Kapasitesi (Border)
  const currentMaxEmployees = factoryCount * WORKERS_PER_FACTORY_CAPACITY;

  const handlePurchaseFactory = (delta: number) => {
    if (delta === 0) return;

    const newFactoryCount = factoryCount + delta;

    // 1. Fabrika Limiti Kontrolü (Max 500)
    if (delta > 0 && newFactoryCount > MAX_FACTORIES) {
      Alert.alert('Sınır Aşıldı', `Maksimum ${MAX_FACTORIES} fabrikaya ulaşabilirsiniz.`);
      return;
    }

    const cost = Math.abs(delta) * COST_FACTORY;

    if (delta > 0) {
      // SATIN ALMA
      if (companyCapital < cost) {
        Alert.alert('Yetersiz Sermaye', `Bu işlem için $${cost.toLocaleString()} gerekiyor.`);
        return;
      }

      setField('companyCapital', companyCapital - cost);
      setField('factoryCount', newFactoryCount);

      // Fabrika ile gelen hediye işçiler
      const newEmployeeCount = employeeCount + (delta * WORKERS_INCLUDED_WITH_FACTORY);
      // İşçi sayısının max kapasiteyi geçmemesini garantile (Emniyet sübabı)
      const safeEmployeeCount = Math.min(newEmployeeCount, newFactoryCount * WORKERS_PER_FACTORY_CAPACITY);

      setField('employeeCount', safeEmployeeCount);

      Alert.alert('Başarılı', `${delta} Fabrika kuruldu. Kapasite arttı!`);
    } else {
      // SATIŞ - İADE YOK (Hardcore Economy)
      const refund = 0;
      setField('companyCapital', companyCapital + refund);
      setField('factoryCount', newFactoryCount);

      // FIX: Sync Employee Count (Clamp to new max capacity)
      const newMaxEmployees = newFactoryCount * WORKERS_PER_FACTORY_CAPACITY;
      if (employeeCount > newMaxEmployees) {
        setField('employeeCount', newMaxEmployees);
        Alert.alert('Dikkat', `Kapasite düştüğü için çalışan sayısı ${newMaxEmployees.toLocaleString()}'e çekildi.`);
      } else {
        Alert.alert('Başarılı', `${Math.abs(delta)} Fabrika satıldı.`);
      }
    }
  };

  const handleHireEmployees = (delta: number) => {
    if (delta === 0) return;

    const cost = Math.abs(delta) * COST_EMPLOYEE;
    const newCount = employeeCount + delta;

    if (delta > 0) {
      // İŞE ALMA
      if (companyCapital < cost) {
        Alert.alert('Yetersiz Sermaye', 'Bakiye yetersiz.');
        return;
      }

      // Kapasite Kontrolü (Fabrika * 320)
      if (newCount > currentMaxEmployees) {
        Alert.alert('Kapasite Dolu', `Mevcut fabrikalarınız en fazla ${currentMaxEmployees.toLocaleString()} çalışan alabilir.`);
        return;
      }

      setField('companyCapital', companyCapital - cost);
      setField('employeeCount', newCount);
      Alert.alert('Başarılı', `${delta} Çalışan İşe Alındı!`);
    } else {
      // İŞTEN ÇIKARMA
      const minEmployees = factoryCount * 120;
      setField('companyCapital', companyCapital - cost);
      setField('employeeCount', Math.max(minEmployees, newCount));
      Alert.alert('Bildirim', `${Math.abs(delta)} Çalışan çıkarıldı.`);
    }
  };

  return {
    handlePurchaseFactory,
    handleHireEmployees,
    costs: { factory: COST_FACTORY, employee: COST_EMPLOYEE },
    limits: {
      maxFactories: MAX_FACTORIES, // 500
      maxEmployees: currentMaxEmployees, // Max 160.000'e kadar çıkar
      minEmployees: factoryCount * 120, // Min 120 per factory
    }
  };
};