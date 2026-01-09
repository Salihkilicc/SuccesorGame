import { useCallback } from 'react';
import { useProductStore } from '../../../core/store/useProductStore';
import { Product, Supplier, DEFAULT_SUPPLIERS } from '../../../features/products/data/productsData';
import { useStatsStore } from '../../../core/store/useStatsStore';

const MARKET_SEARCH_COST = 50000;

export const useProductManagement = () => {
    const { products, addProduct, updateProduct, retireProduct } = useProductStore();
    const { productionCapacity, money, setField } = useStatsStore();

    // Calculate available capacity
    const usedCapacity = products
        .filter((p) => p.status === 'active')
        .reduce((sum, p) => sum + ((p.production?.allocated || 0) * (p.production?.weight || 1)), 0);
    const availableCapacity = productionCapacity - usedCapacity;

    // Generate random suppliers with RNG logic
    const generateSuppliers = useCallback((productType: string, currentSupplier: Supplier): Supplier[] => {
        const baseSuppliers = DEFAULT_SUPPLIERS[productType] || DEFAULT_SUPPLIERS['Electronics'];
        const newSuppliers: Supplier[] = [];

        for (let i = 0; i < 3; i++) {
            const isHiddenGem = Math.random() < 0.05; // 5% chance

            if (isHiddenGem) {
                // Hidden Gem: Lower cost, higher quality
                newSuppliers.push({
                    name: `Premium ${productType} Co.`,
                    cost: currentSupplier.cost * 0.8,
                    quality: Math.min(100, currentSupplier.quality + 15),
                });
            } else {
                // Normal: Higher cost
                const base = baseSuppliers[i % baseSuppliers.length];
                newSuppliers.push({
                    name: base.name,
                    cost: currentSupplier.cost * (1.1 + Math.random() * 0.3), // 10-40% more expensive
                    quality: base.quality + Math.floor(Math.random() * 10 - 5), // ±5 quality
                });
            }
        }

        return newSuppliers;
    }, []);

    // Perform market search
    const performMarketSearch = useCallback((productId: string) => {
        if (money < MARKET_SEARCH_COST) return false;

        setField('money', money - MARKET_SEARCH_COST);

        const product = products.find((p) => p.id === productId);
        if (!product) return false;

        // Generate demand and competition
        const demand = 30 + Math.floor(Math.random() * 60); // 30-90
        const competition = 20 + Math.floor(Math.random() * 60); // 20-80

        updateProduct(productId, {
            market: {
                demand,
                competition,
                researched: true,
            },
        });

        return true;
    }, [money, products, setField, updateProduct]);

    // Calculate monthly sales for a product
    const calculateProductSales = useCallback((product: Product, morale: number): {
        unitsSold: number;
        revenue: number;
        events: string[];
    } => {
        const { acquisitions } = useStatsStore.getState();
        const events: string[] = [];
        let production = product.production?.allocated || 0;

        // Shipping issue event (20% if morale < 40)
        if (morale < 40 && Math.random() < 0.2) {
            production = Math.floor(production * 0.9);
            events.push(`⚠️ Shipping delayed for ${product.name} due to low morale! Lost 10% stock.`);
        }

        // Market shift event (10% chance)
        if (Math.random() < 0.1) {
            const shiftType = Math.random() < 0.5 ? 'demand' : 'competition';
            if (shiftType === 'demand') {
                events.push(`📉 Demand for ${product.name} decreased.`);
            } else {
                events.push(`📈 Competition for ${product.name} increased.`);
            }
        }

        // Calculate sales
        const priceFactor = calculatePriceFactor(product);
        let maxSales = (product.market?.demand || 0) * priceFactor;

        // Apply Acquisition Bonuses
        if (acquisitions.includes('streamify') && (product.category === 'phone')) {
            maxSales *= 1.15; // 15% boost
        }
        if (acquisitions.includes('gameGen') && (product.category === 'computer')) {
            maxSales *= 1.15; // 15% boost
        }

        const unitsSold = Math.min(production, maxSales);
        const revenue = unitsSold * (product.pricing?.salePrice || 0);

        return { unitsSold, revenue, events };
    }, []);

    // Helper: Calculate price factor based on quality and competition
    const calculatePriceFactor = (product: Product): number => {
        const { techLevels } = useStatsStore.getState();

        const qualityBonus = (product.supplier?.quality || 50) / 100; // 0-1
        const competitionPenalty = (product.market?.competition || 50) / 200; // 0-0.5

        // Base Price Ratio (Optimal is 2x cost)
        // If Software Lvl 3 (MyAI), optimal price is higher (e.g. 2.5x)
        const optimalMultiplier = techLevels.software >= 3 ? 2.5 : 2.0;

        const salePrice = product.pricing?.salePrice || product.suggestedPrice;
        const cost = product.supplier?.cost || product.baseProductionCost;

        const priceRatio = salePrice / (cost * optimalMultiplier);

        return Math.max(0.1, qualityBonus - competitionPenalty - Math.abs(1 - priceRatio) * 0.3);
    };

    return {
        products: products.filter((p) => p.status === 'active'),
        allProducts: products,
        availableCapacity,
        usedCapacity,
        totalCapacity: productionCapacity,
        generateSuppliers,
        performMarketSearch,
        calculateProductSales,
        addProduct,
        updateProduct,
        retireProduct,
    };
};
