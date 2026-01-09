import { useState, useEffect } from 'react';
import { useStatsStore } from '../../../core/store/useStatsStore';

export const useProductionLogic = (visible: boolean, onClose: () => void) => {
    const { employeeCount, productionLevel, setField } = useStatsStore();

    const [localEmployeeCount, setLocalEmployeeCount] = useState(employeeCount);
    const [localProductionTarget, setLocalProductionTarget] = useState(productionLevel);

    useEffect(() => {
        if (visible) {
            setLocalEmployeeCount(employeeCount);
            setLocalProductionTarget(productionLevel);
        }
    }, [visible, employeeCount, productionLevel]);

    const minEmployees = 5; // Minimal staff
    const maxEmployees = 10000; // Arbitrary cap or based on factory count?
    // Let's assume factory count * 50? Or just a hard cap for now. 
    // The previous logic likely had some cap. `useStatsStore` has `factoryCount` (init 5).

    // Efficiency: 350 units per employee (from Modal Hint)
    const maxProductionPossible = localEmployeeCount * 350;

    const handleEmployeeChange = (val: number) => {
        setLocalEmployeeCount(val);
        // If workforce drops, max production drops. Clamp target.
        const newMax = val * 350;
        if (localProductionTarget > newMax) {
            setLocalProductionTarget(newMax);
        }
    };

    const handleProductionChange = (val: number) => {
        setLocalProductionTarget(val);
    };

    const handleConfirm = () => {
        setField('employeeCount', localEmployeeCount);
        setField('productionLevel', localProductionTarget);
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
