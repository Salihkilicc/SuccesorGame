// dosya: src/features/MyCompany/useCompanyLogic.ts

import { Alert } from 'react-native';
import { useStatsStore } from '../../../store'; // Store yolunu projene göre ayarla

// Sabit değerleri buraya alarak "Magic Number"lardan kurtulduk
const COST_FACTORY = 50_000_000;
const COST_EMPLOYEE = 5_000;
const EMPLOYEES_PER_FACTORY = 500;

export const useCompanyLogic = () => {
  const {
    companyCapital,
    factoryCount,
    employeeCount,
    setField,
  } = useStatsStore();

  const handlePurchaseFactory = (delta: number) => {
    if (delta === 0) return;

    const cost = Math.abs(delta) * COST_FACTORY;
    const newCount = factoryCount + delta;

    if (delta > 0) {
      // Satın Alma
      if (companyCapital < cost) {
        Alert.alert('Yetersiz Sermaye', 'Bu genişlemeyi karşılayamazsınız.');
        return;
      }
      setField('companyCapital', companyCapital - cost);
      setField('factoryCount', newCount);
      Alert.alert('Başarılı', `${delta} Fabrika Satın Alındı!`);
    } else {
      // Satış
      const refund = cost * 0.5; // %50 iade
      setField('companyCapital', companyCapital + refund);
      setField('factoryCount', newCount);
      Alert.alert('Başarılı', `${Math.abs(delta)} Fabrika ${refund.toLocaleString()} karşılığında satıldı!`);
    }
  };

  const handleHireEmployees = (delta: number) => {
    if (delta === 0) return;

    const cost = Math.abs(delta) * COST_EMPLOYEE;
    const newCount = employeeCount + delta;
    const currentLimit = factoryCount * EMPLOYEES_PER_FACTORY;

    if (delta > 0) {
      // İşe Alma
      if (companyCapital < cost) {
        Alert.alert('Yetersiz Sermaye', 'İşe alım ücretlerini karşılayamazsınız.');
        return;
      }
      if (newCount > currentLimit) {
        Alert.alert('Kapasite Dolu', `Her fabrika ${EMPLOYEES_PER_FACTORY} çalışan destekler. Önce fabrika kurun.`);
        return;
      }
      setField('companyCapital', companyCapital - cost);
      setField('employeeCount', newCount);
      Alert.alert('Başarılı', `${delta} Çalışan İşe Alındı!`);
    } else {
      // İşten Çıkarma (Kıdem tazminatı ödenir, iade yok)
      setField('companyCapital', companyCapital - cost);
      setField('employeeCount', newCount);
      Alert.alert('Bildirim', `${Math.abs(delta)} Çalışan İşten Çıkarıldı (Tazminat: $${cost.toLocaleString()})`);
    }
  };

  return {
    handlePurchaseFactory,
    handleHireEmployees,
    costs: {
        factory: COST_FACTORY,
        employee: COST_EMPLOYEE
    },
    limits: {
        maxFactories: Math.floor((companyCapital || 0) / COST_FACTORY),
        maxEmployees: Math.min(
            Math.floor((companyCapital || 0) / COST_EMPLOYEE),
            (factoryCount * EMPLOYEES_PER_FACTORY) - employeeCount
        )
    }
  };
};