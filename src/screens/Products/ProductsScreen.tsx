import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useProductsLogic } from '../../features/products/logic/useProductsLogic';
import { ProductLaunchModal, ProductDetailModal } from './components/ProductModals';

const ProductsScreen = () => {
  const navigation = useNavigation();
  const {
    activeProducts,
    lockedProducts,
    selectedProduct,
    analysisData,
    maxCapacityUnits, // Destructured here
    actions
  } = useProductsLogic();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backText}>←</Text></Pressable>
        <Text style={styles.title}>Product Lines</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ACTIVE PRODUCTS */}
        <Text style={styles.sectionTitle}>Active Products ({activeProducts.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeList}>
          {activeProducts.map(prod => (
            <Pressable key={prod.id} style={styles.activeCard} onPress={() => actions.openDetailModal(prod)}>
              <View style={styles.activeHeader}>
                <Text style={styles.activeIcon}>{prod.icon}</Text>
                <View style={styles.statusBadge}><Text style={styles.statusText}>ACTIVE</Text></View>
              </View>
              <Text style={styles.activeName}>{prod.name}</Text>
              <Text style={styles.activeProfit}>Prod: {prod.productionLevel}%</Text>
              <Text style={styles.activePrice}>${prod.sellingPrice}</Text>
            </Pressable>
          ))}
          {activeProducts.length === 0 && <Text style={styles.emptyText}>No active products yet.</Text>}
        </ScrollView>

        {/* LOCKED PRODUCTS REMOVED AS REQUESTED */}
      </ScrollView>

      {/* MODALS */}
      {selectedProduct?.status === 'locked' && (
        <ProductLaunchModal
          visible={!!selectedProduct}
          product={selectedProduct}
          onClose={actions.closeModal}
          onAnalyze={actions.performMarketAnalysis}
          onLaunch={actions.launchProduct}
          analysisData={analysisData}
        />
      )}

      {selectedProduct?.status === 'active' && (
        <ProductDetailModal
          visible={!!selectedProduct}
          product={selectedProduct}
          totalCapacity={maxCapacityUnits} // Passed dynamically
          onClose={actions.closeModal}
          onUpdate={actions.updateProductSettings}
          onRetire={actions.retireProduct}
          getTip={actions.getInsightTip}
        />
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  content: { paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 20, marginBottom: 12, marginTop: 20 },
  activeList: { paddingHorizontal: 20, gap: 12 },
  activeCard: { width: 140, height: 160, backgroundColor: theme.colors.card, borderRadius: 16, padding: 12, justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeIcon: { fontSize: 32 },
  statusBadge: { backgroundColor: 'rgba(76, 175, 80, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: theme.colors.success, fontSize: 8, fontWeight: 'bold' },
  activeName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  activeProfit: { color: '#A0AEC0', fontSize: 12 },
  activePrice: { color: theme.colors.success, fontWeight: '800', fontSize: 16 },
  emptyText: { color: '#666', fontStyle: 'italic', marginLeft: 20 },
  lockedList: { paddingHorizontal: 20, gap: 12 },
  lockedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2D3748', padding: 16, borderRadius: 12, opacity: 0.8 },
  iconBox: { width: 48, height: 48, backgroundColor: '#1A202C', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  lockedIcon: { fontSize: 24 },
  infoBox: { flex: 1 },
  lockedName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  lockedCost: { color: theme.colors.accent, fontSize: 13, fontWeight: '600', marginTop: 2 },
  arrow: { color: '#666', fontSize: 20, fontWeight: 'bold' },
});

export default ProductsScreen;