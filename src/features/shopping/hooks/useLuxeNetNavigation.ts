import { useState, useCallback } from 'react';
import { SHOPS } from '../data/ShoppingData';

export type LuxeNetView = 'HUB' | 'CATEGORY_LIST' | 'SHOP_DETAIL';

export const useLuxeNetNavigation = () => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [currentUrl, setCurrentUrl] = useState<string>('https://www.luxenet.com');
    const [currentView, setCurrentView] = useState<LuxeNetView>('HUB');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

    // ============================================================================
    // ACTIONS
    // ============================================================================

    /**
     * Resets navigation to the main Hub
     */
    const goHome = useCallback(() => {
        setCurrentUrl('https://www.luxenet.com');
        setCurrentView('HUB');
        setSelectedCategory(null);
        setSelectedShopId(null);
    }, []);

    /**
     * Navigates to a specific Category List
     */
    const goToCategory = useCallback((category: string) => {
        // Format category for URL (e.g., REAL_ESTATE -> real-estate)
        const urlSlug = category.toLowerCase().replace('_', '-');
        setCurrentUrl(`https://www.luxenet.com/${urlSlug}`);

        setCurrentView('CATEGORY_LIST');
        setSelectedCategory(category);
        setSelectedShopId(null);
    }, []);

    /**
     * Navigates to a specific Shop Detail view
     */
    const visitShop = useCallback((shopId: string) => {
        const shop = SHOPS.find(s => s.id === shopId);
        if (!shop) {
            console.warn(`Shop with id ${shopId} not found`);
            return;
        }

        // Set URL to the shop's specific URL
        setCurrentUrl(`https://${shop.url}`);

        setCurrentView('SHOP_DETAIL');
        setSelectedShopId(shopId);

        // Ensure category is set for the "Back" logic hierarchy (Shop -> Category -> Hub)
        // If we jumped straight here (e.g. from Trending), we might update the category context too.
        setSelectedCategory(shop.category);
    }, []);

    /**
     * Handles hierarchical back navigation
     * Shop -> Category -> Hub
     */
    const goBack = useCallback(() => {
        if (currentView === 'SHOP_DETAIL') {
            // From Shop, go up to Category
            if (selectedCategory) {
                goToCategory(selectedCategory);
            } else {
                // Fallback if somehow category is missing
                goHome();
            }
        } else if (currentView === 'CATEGORY_LIST') {
            // From Category, go up to Hub
            goHome();
        } else {
            // Already at HUB, caller should handle exiting the app/screen
            // or do nothing
        }
    }, [currentView, selectedCategory, goToCategory, goHome]);

    return {
        // State
        currentUrl,
        currentView,
        selectedCategory,
        selectedShopId,

        // Actions
        goHome,
        goToCategory,
        visitShop,
        goBack,
    };
};
