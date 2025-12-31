import { useState, useEffect } from 'react';
import { useStatsStore } from '../../../store/useStatsStore'; 

export const useProductionLogic = (visible: boolean, onClose: () => void) => {
    // 1. Store'dan verileri çek
    // Store'unda 'productionLevel' olarak geçiyor, UI'da Target diyeceğiz.
    const { 
        factoryCount, 
        employeeCount, 
        productionLevel, 
        update 
    } = useStatsStore();

    // 2. Limitleri Hesapla (Senin Kuralların)
    const minEmployees = factoryCount * 100;
    const maxEmployees = factoryCount * 320;

    // 3. Local State (Modal açıkken slider'ın hareket edeceği geçici hafıza)
    const [localEmployeeCount, setLocalEmployeeCount] = useState(employeeCount);
    const [localProductionTarget, setLocalProductionTarget] = useState(productionLevel);

    // 4. Dinamik Üretim Kapasitesi: (Anlık Slider Değeri * 350)
    const maxProductionPossible = localEmployeeCount * 350;

    // --- PERSISTENCE & INIT LOGIC ---
    // Modal her açıldığında store'daki gerçek veriyi alıp slider'lara yükler.
    useEffect(() => {
        if (visible) {
            // Güvenlik: Eğer fabrika satıldıysa ve işçi sayısı max'ın üstünde kaldıysa kırp.
            const safeStartEmployees = Math.max(minEmployees, Math.min(employeeCount, maxEmployees));
            
            // Güvenlik: Eğer mevcut üretim, kapasiteyi aşıyorsa kırp.
            const currentCap = safeStartEmployees * 350;
            const safeStartProduction = Math.min(productionLevel, currentCap);

            setLocalEmployeeCount(safeStartEmployees);
            setLocalProductionTarget(safeStartProduction);
        }
    }, [visible, factoryCount, employeeCount, productionLevel]);

    // --- HANDLERS ---

    const handleEmployeeChange = (val: number) => {
        const roundedVal = Math.floor(val);
        setLocalEmployeeCount(roundedVal);

        // KURAL: İşçi azalırsa, üretim kapasitesi de düşer.
        // Eğer hedef üretim, yeni kapasitenin üstünde kalıyorsa aşağı çek.
        const newMaxProd = roundedVal * 350;
        if (localProductionTarget > newMaxProd) {
            setLocalProductionTarget(newMaxProd);
        }
    };

    const handleProductionChange = (val: number) => {
        setLocalProductionTarget(Math.floor(val));
    };

    const handleConfirm = () => {
        // Store'u güncelle
        update({
            employeeCount: localEmployeeCount,
            productionLevel: localProductionTarget
        });
        onClose();
    };

    return {
        localEmployeeCount,
        localProductionTarget,
        minEmployees,
        maxEmployees,
        maxProductionPossible,
        handleEmployeeChange,
        handleProductionChange,
        handleConfirm
    };
};