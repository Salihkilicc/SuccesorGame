import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Product } from '../data/productsData';
import { useProductsLogic } from '../logic/useProductsLogic';

interface FormState {
    sellingPrice: number;
    marketingBudget: number;
    productionLevel: number;
    supplierId: string;
}

export const useProductDetail = (
    product: Product | undefined,
    visible: boolean,
    onClose: () => void
) => {
    const { actions } = useProductsLogic();

    const [formState, setFormState] = useState<FormState>({
        sellingPrice: 0,
        marketingBudget: 0,
        productionLevel: 0,
        supplierId: ''
    });

    const [tip, setTip] = useState('');

    // Initialize form state when product changes
    useEffect(() => {
        if (product) {
            setFormState({
                sellingPrice: product.sellingPrice || product.suggestedPrice || 0,
                marketingBudget: product.marketingBudget || 0,
                productionLevel: product.productionLevel || 0,
                supplierId: product.supplierId || 'local',
            });
            setTip('');
        }
    }, [product, visible]);

    // Helper for number increment with dynamic max for marketing
    const adjustValue = (
        field: keyof FormState,
        delta: number,
        min = 0,
        max?: number
    ) => {
        // Calculate dynamic max for marketing budget (50% of selling price)
        let effectiveMax = max;
        if (field === 'marketingBudget' && !max) {
            effectiveMax = Math.floor(formState.sellingPrice * 0.5);
        }
        effectiveMax = effectiveMax || 10000; // Fallback

        setFormState(prev => ({
            ...prev,
            [field]: Math.max(min, Math.min(effectiveMax, (prev[field] as number) + delta))
        }));
    };

    // Helper for percentage-based marketing budget adjustment
    const adjustMarketingByPercent = (percent: number) => {
        const maxLimit = Math.floor(formState.sellingPrice * 0.5);
        const delta = Math.floor(maxLimit * (percent / 100));
        const newValue = formState.marketingBudget + delta;

        setFormState(prev => ({
            ...prev,
            marketingBudget: Math.max(0, Math.min(maxLimit, newValue))
        }));
    };

    const handleSave = () => {
        if (!product) return;
        actions.updateProductSettings(product.id, formState);
        Alert.alert('Saved', 'Product settings updated.');
        onClose();
    };

    const handleRetire = () => {
        if (!product) return;
        Alert.alert('Retire Product', 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Retire',
                style: 'destructive',
                onPress: () => {
                    actions.retireProduct(product.id);
                    onClose();
                }
            }
        ]);
    };

    const handleGetInsight = () => {
        if (!product) return;
        setTip(actions.getInsightTip(product));
    };

    const handleSupplierChange = (supplierId: string) => {
        setFormState(prev => ({ ...prev, supplierId }));
    };

    // Calculate marketing limit and boost percentage
    const maxMarketingLimit = Math.floor(formState.sellingPrice * 0.5);
    const efficiency = Math.min(1, formState.marketingBudget / maxMarketingLimit);
    const boostPercentage = Math.floor(efficiency * 30);

    return {
        formState,
        tip,
        maxMarketingLimit,
        boostPercentage,
        adjustValue,
        adjustMarketingByPercent,
        handleSave,
        handleRetire,
        handleGetInsight,
        handleSupplierChange,
    };
};
