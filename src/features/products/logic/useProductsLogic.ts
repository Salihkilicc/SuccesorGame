import { useState, useEffect } from 'react';
import { t } from '../../../core/i18n';
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
    const { products, setProducts, updateProduct, discontinueProduct, upgradeProductQuality, optimizeProductionLine } = useProductStore();
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
            Alert.alert(t('product.alreadyActive'), 'This product is already on the market.');
            return false;
        }

        if (researchPoints < target.rndCost) {
            Alert.alert(t('product.insufficientRD'), t('product.youNeedV1ResearchPoints', { v1: target.rndCost }));
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

    /**
     * Urunu hattan cikarir.
     *
     * ONCE: sadece `status: 'retired'` yaziyordu. Urun listede kaliyor,
     * yer kapliyor ve BIR DAHA ACILAMIYORDU. Pazari kucuk bir urunu
     * birakip sonra tekrar denemek imkansizdi.
     *
     * SIMDI: urun silinir, teknoloji yeniden kilitlenir. Tekrar acmak
     * RP ve nakit ister — vazgecmenin bedeli var ama kapi kapanmiyor.
     */
    const retireProduct = (id: string) => {
        const product = products.find((p: Product) => p.id === id);
        const stock = product?.inventory || 0;

        Alert.alert(
            t('product.discontinueProduct'),
            t('product.takeV1OffTheLine', { v1: product?.name || 'this product' }) +
            (stock > 0
                ? `${stock.toLocaleString()} units still in the warehouse will be written off.\n\n`
                : '') +
            'The technology goes back to locked. You can bring it back later, but you will pay the research and cash cost again.',
            [
                { text: t('product.keepIt'), style: 'cancel' },
                {
                    text: t('product.discontinue'),
                    style: 'destructive',
                    onPress: () => {
                        const result = discontinueProduct(id);
                        if (!result.success) Alert.alert(t('product.error'), result.message);
                        closeModal();
                    },
                },
            ]
        );
    };

    const getInsightTip = (product: Product) => {
        const diff = (product.sellingPrice || 0) - product.suggestedPrice;
        if (diff > 15) return t('product.priceIsTooHigh');
        if (diff < -15) return t('product.priceIsTooLow');
        if ((product.marketingBudget || 0) <= 0) return t('product.noMarketingBudget');

        const demand = product.marketDemand;
        const production = product.productionLevel || 0;

        if (production < demand) return t('product.highDemandIncreaseProduction');
        if (production > demand + 20) return t('product.overproduction');

        return t('product.operationsStable');
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
            Alert.alert(t('product.upgradeFailed'), result.message);
        }
        return result;
    };

    const handleOptimizeProcess = (product: Product) => {
        const result = optimizeProductionLine(product.id, totalRP, (amount) => spendRP(amount));
        if (result.success) {
            // Optional
        } else {
            Alert.alert(t('product.optimizationFailed'), result.message);
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