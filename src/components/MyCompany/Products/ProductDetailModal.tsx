import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../core/theme';
import { useProductManagement } from './useProductManagement';
import { Supplier } from '../../../core/store/useProductStore';
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';

// Atomic Components
import ProductHeader from './components/ProductHeader';
import ProductSupplierSection from './components/ProductSupplierSection';
import ProductProductionSection from './components/ProductProductionSection';
import ProductPricingSection from './components/ProductPricingSection';
import ProductMarketSection from './components/ProductMarketSection';

interface Props {
    productId: string;
    visible: boolean;
    onClose: () => void;
}

const ProductDetailModal = ({ productId, visible, onClose }: Props) => {
    const { allProducts, updateProduct, retireProduct, generateSuppliers, performMarketSearch } =
        useProductManagement();
    const product = allProducts.find((p) => p.id === productId);

    const [showSuppliers, setShowSuppliers] = useState(false);
    const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([]);

    if (!product) return null;

    const handleFindSuppliers = () => {
        if (showSuppliers) {
            setShowSuppliers(false);
            return;
        }
        const options = generateSuppliers(product.type, product.supplier);
        setSupplierOptions(options);
        setShowSuppliers(true);
    };

    const handleSelectSupplier = (supplier: Supplier) => {
        updateProduct(productId, { supplier });
        setShowSuppliers(false);
    };

    const handleMarketSearch = () => {
        const success = performMarketSearch(productId);
        if (!success) {
            // Insufficient funds handling
        }
    };

    const handlePriceChange = (delta: number) => {
        const newPrice = Math.max(1, product.pricing.salePrice + delta);
        updateProduct(productId, {
            pricing: { salePrice: newPrice },
        });
    };

    const handleCapacityChange = (value: number) => {
        // Logic constraint: allocated cannot be less than 0. Max is handled by available logic usually, but here we just set it.
        // Assuming updateProduct handles upper bounds or simple setter.
        const safeValue = Math.max(0, value);
        updateProduct(productId, {
            production: { ...product.production, allocated: safeValue },
        });
    };

    const handleRetire = () => {
        retireProduct(productId);
        onClose();
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title={`${product.name} Details`} // GameModal handles title, but we have a custom header so maybe use blank title or just standard?
        // Going with standard GameModal title for consistency, and custom header inside content for richness.
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <ProductHeader name={product.name} type={product.type} />

                <ProductSupplierSection
                    currentSupplier={product.supplier}
                    supplierOptions={supplierOptions}
                    showSuppliers={showSuppliers}
                    onFindSuppliers={handleFindSuppliers}
                    onSelectSupplier={handleSelectSupplier}
                />

                <ProductProductionSection
                    allocated={product.production.allocated}
                    onAllocChange={handleCapacityChange}
                />

                <ProductPricingSection
                    price={product.pricing.salePrice}
                    onPriceChange={handlePriceChange}
                />

                <ProductMarketSection
                    researched={product.market.researched}
                    demand={product.market.demand}
                    competition={product.market.competition}
                    onResearch={handleMarketSearch}
                />

                <View style={styles.footer}>
                    <GameButton
                        title="Retire Product Line"
                        variant="danger"
                        onPress={handleRetire}
                    />
                </View>

            </ScrollView>
        </GameModal>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        gap: 16,
        paddingBottom: 20,
    },
    footer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
});

export default ProductDetailModal;
