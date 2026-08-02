import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { Product, INITIAL_PRODUCTS } from '../data/productsData';
import { useProductStore } from '../../../core/store/useProductStore';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';

// NOT: Buradaki 'UNITS_PER_EMPLOYEE = 468.75' sabiti KALDIRILDI.
// Motorun formulunden tamamen farkliydi (karmasikligi hic hesaba katmiyordu)
// ve ekranda motorun urettiginin 47 KATI bir sayi gosteriyordu.
// Kapasite artik core/market/production.ts uzerinden hesaplaniyor.

export const useProductsLogic = () => {
    const { researchPoints = 1000, employeeCount } = useStatsStore();
    const { products, setProducts, updateProduct, upgradeProductQuality, optimizeProductionLine } = useProductStore();
    const { totalRP, spendRP } = useLaboratoryStore();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [analysisData, setAnalysisData] = useState<Product | null>(null);

    // Kapasite artik URUNE OZEL: karmasiklik bolen oldugu icin her urunun
    // azami uretimi farkli. Bu yuzden tek bir sayi yerine calisan sayisini
    // gecirip hesabi urun ekraninda yapiyoruz.
    // (Geriye donuk uyumluluk icin alan duruyor; artik calisan sayisi.)
    const maxCapacityUnits = employeeCount;

    useEffect(() => {
        if (products.length === 0) {
            setProducts(INITIAL_PRODUCTS);
        }
    }, [products.length, setProducts]);

    // --- ACTIONS ---

    const openLaunchModal = (product: Product) => {
        setSelectedProduct(product);
        setAnalysisData(null);
    };

    const openDetailModal = (product: Product) => {
        const currentProduct = products.find((p: Product) => p.id === product.id) || product;
        setSelectedProduct(currentProduct);
    };

    const closeModal = () => {
        setSelectedProduct(null);
        setAnalysisData(null);
    };

    const performMarketAnalysis = (product?: Product) => {
        const target = product || selectedProduct;
        if (!target) return;
        setAnalysisData(target);
        return target; // Return data for caller
    };

    const launchProduct = (product?: Product) => {
        const target = product || selectedProduct;
        if (!target) return false;

        const currentProduct = products.find((p: Product) => p.id === target.id);
        if (currentProduct?.status === 'active') {
            Alert.alert('Already Active', 'This product is already on the market.');
            return false;
        }

        if (researchPoints < target.rndCost) {
            Alert.alert('Insufficient R&D', `You need ${target.rndCost} Research Points.`);
            return false;
        }

        updateProduct(target.id, {
            status: 'active',
            sellingPrice: target.suggestedPrice,
            marketingBudget: 0, // Oyuncu bilerek acsin
            productionLevel: 50, // Default 50%
            supplierId: 'local'
        });

        Alert.alert('🚀 Launch Successful', `${target.name} is now on the market!`);
        closeModal();
        return true;
    };

    const updateProductSettings = (id: string, updates: Partial<Product>) => {
        updateProduct(id, updates);
    };

    const retireProduct = (id: string) => {
        Alert.alert('Retire Product', 'Stop production permanently?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Retire',
                style: 'destructive',
                onPress: () => {
                    updateProduct(id, { status: 'retired' });
                    closeModal();
                }
            }
        ]);
    };

    const getInsightTip = (product: Product) => {
        const diff = (product.sellingPrice || 0) - product.suggestedPrice;
        if (diff > 15) return "Price is too high!";
        if (diff < -15) return "Price is too low.";
        if ((product.marketingBudget || 0) <= 0) return "No marketing budget.";

        const demand = product.marketDemand;
        const production = product.productionLevel || 0;

        if (production < demand) return "High Demand! Increase production.";
        if (production > demand + 20) return "Overproduction!";

        return "Operations stable.";
    };

    // NEW HELPERS
    const calculateUpgradeCost = (product: Product, type: 'quality' | 'process') => {
        const level = type === 'quality' ? (product.qualityLevel || 1) : (product.processLevel || 1);
        const complexity = product.complexity || 50;
        return Math.floor(complexity * 100 * Math.pow(1.5, level));
    };

    const handleUpgradeQuality = (product: Product) => {
        const result = upgradeProductQuality(product.id, totalRP, (amount) => spendRP(amount));
        if (result.success) {
            // Optional: Success feedback handled by UI update
        } else {
            Alert.alert('Upgrade Failed', result.message);
        }
        return result;
    };

    const handleOptimizeProcess = (product: Product) => {
        const result = optimizeProductionLine(product.id, totalRP, (amount) => spendRP(amount));
        if (result.success) {
            // Optional
        } else {
            Alert.alert('Optimization Failed', result.message);
        }
        return result;
    };

    return {
        products,
        activeProducts: products.filter((p: Product) => p.status === 'active'),
        lockedProducts: products.filter((p: Product) => p.status === 'locked'),
        selectedProduct,
        analysisData,
        maxCapacityUnits, // UI'da görünecek max değer (Full işçide 75M)
        totalRP, // Expose for UI
        actions: {
            openLaunchModal,
            openDetailModal,
            closeModal,
            performMarketAnalysis,
            launchProduct,
            updateProductSettings,
            retireProduct,
            getInsightTip,
            calculateUpgradeCost,
            handleUpgradeQuality,
            handleOptimizeProcess
        }
    };
};