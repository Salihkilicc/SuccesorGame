import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../store/useStatsStore';
import { Product, INITIAL_PRODUCTS } from '../data/productsData';
import { useProductStore } from '../../../store/useProductStore';

// --- KRİTİK AYAR ---
// 75.000.000 Üretim / 160.000 İşçi = 468.75
const UNITS_PER_EMPLOYEE = 468.75; 

export const useProductsLogic = () => {
    const { researchPoints = 1000, employeeCount } = useStatsStore();
    const { products, setProducts, updateProduct } = useProductStore();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [analysisData, setAnalysisData] = useState<Product | null>(null);

    // --- KAPASİTE HESABI (BORDER) ---
    // Full kapasitede (160k işçi) bu değer tam 75.000.000 olacak.
    const maxCapacityUnits = Math.floor(employeeCount * UNITS_PER_EMPLOYEE);

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
        const currentProduct = products.find(p => p.id === product.id) || product;
        setSelectedProduct(currentProduct);
    };

    const closeModal = () => {
        setSelectedProduct(null);
        setAnalysisData(null);
    };

    const performMarketAnalysis = () => {
        if (!selectedProduct) return;
        setAnalysisData(selectedProduct);
    };

    const launchProduct = () => {
        if (!selectedProduct) return;

        const currentProduct = products.find(p => p.id === selectedProduct.id);
        if (currentProduct?.status === 'active') {
            Alert.alert('Already Active', 'This product is already on the market.');
            return;
        }

        if (researchPoints < selectedProduct.rndCost) {
            Alert.alert('Insufficient R&D', `You need ${selectedProduct.rndCost} Research Points.`);
            return;
        }

        updateProduct(selectedProduct.id, {
            status: 'active',
            sellingPrice: selectedProduct.suggestedPrice,
            marketingBudget: 5000,
            productionLevel: selectedProduct.marketDemand,
            supplierId: 'local'
        });

        Alert.alert('🚀 Launch Successful', `${selectedProduct.name} is now on the market!`);
        closeModal();
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
        if ((product.marketingBudget || 0) < 2000) return "Marketing is weak.";

        const demand = product.marketDemand;
        const production = product.productionLevel || 0;

        if (production < demand) return "High Demand! Increase production.";
        if (production > demand + 20) return "Overproduction!";

        return "Operations stable.";
    };

    return {
        products,
        activeProducts: products.filter(p => p.status === 'active'),
        lockedProducts: products.filter(p => p.status === 'locked'),
        selectedProduct,
        analysisData,
        maxCapacityUnits, // UI'da görünecek max değer (Full işçide 75M)
        actions: {
            openLaunchModal,
            openDetailModal,
            closeModal,
            performMarketAnalysis,
            launchProduct,
            updateProductSettings,
            retireProduct,
            getInsightTip
        }
    };
};