// src/features/products/screens/ProductDetailScreen.tsx
//
// ============================================================================
//  A PRODUCT, AS A ROUTE
// ============================================================================
//
//  ProductDetailModal was already a full screen with its own ScreenHeader. The
//  only thing the Modal was still doing was making it ARRIVE differently:
//  Products slid in from the right and the product itself faded in on top, so
//  opening one and leaving it were two unrelated gestures on the same screen.
//
//  Reported as "urunlere girip cikinca ekran saga gitmeli, girerken sola
//  gelmeli, ekran kayarak". Every route in this app pushes from the right -
//  see the screenOptions on RootStack.
//
//  ---------------------------------------------------------------------------
//  IT TAKES AN ID, NOT A PRODUCT, AND CERTAINLY NOT A CALLBACK
//  ---------------------------------------------------------------------------
//  The modal was handed `onUpdate`, `onRetire` and `getTip` by the screen
//  above it. Route params must be serialisable, and this codebase has already
//  paid for a function travelling between screens once: the IPO handler was a
//  route param that called `setPanel` on the screen it came FROM, so the
//  confirmation appeared on a screen nobody was looking at. See
//  components/MyCompany/Shares/IpoModal.tsx.
//
//  So this mounts `useProductsLogic` itself. The hook reads the stores; there
//  is nothing to hand down.
// ============================================================================

import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ProductDetailModal } from '../components/ProductModals';
import { useProductsLogic } from '../logic/useProductsLogic';

const ProductDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { products, maxCapacityUnits, actions } = useProductsLogic();

    const productId = route.params?.productId;
    const product = products.find((p: any) => p.id === productId);

    // The product was retired from inside the sheet, or the save moved on.
    // Leaving is the honest answer; an empty page with a header is not.
    React.useEffect(() => {
        if (!product) navigation.goBack();
    }, [product, navigation]);

    if (!product) return null;

    return (
        <ProductDetailModal
            asScreen
            visible
            product={product}
            totalCapacity={maxCapacityUnits}
            onClose={() => navigation.goBack()}
            onUpdate={actions.updateProductSettings}
            onRetire={actions.retireProduct}
            getTip={actions.getInsightTip}
        />
    );
};

export default ProductDetailScreen;
