// dosya: src/screens/Assets/Market/MarketScreen.tsx

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventStore } from '../../../core/store';
import { triggerEvent } from '../../../event/eventEngine';
import { theme } from '../../../core/theme';

// Bileşenler
import AppScreen from '../../../components/layout/AppScreen';
import MarketOverview from '../../../components/Market/MarketOverview';
import StockItemSkeleton from '../../../components/Market/StockItemSkeleton';

// Veriler (Yeni Dosyadan Geliyor)
import { CATEGORIES, STOCKS, Category } from './marketData';

const MarketScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Tech');
  const data = useMemo(() => STOCKS[selectedCategory] ?? [], [selectedCategory]);

  return (
    <AppScreen
      title="MARKET"
      subtitle="Simulated Nasdaq & Crypto"
      leftNode={<BackButton navigation={navigation} />}
    >
      <FlatList
        data={data}
        keyExtractor={item => item.symbol}
        contentContainerStyle={styles.listContent}

        // Header ve Footer'ı aşağıda tanımladığımız bileşenlerden alıyoruz
        ListHeaderComponent={
          <MarketHeader
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        }
        ListFooterComponent={<MarketEventFooter />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}

        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('StockDetail', {
              symbol: item.symbol,
              price: item.price,
              change: item.change,
              category: selectedCategory,
            })
            }>
            <StockItemSkeleton
              symbol={item.symbol}
              name={item.name}
              price={item.price}
              change={item.change}
              riskTag={item.riskTag}
              meta={item.meta}
            />
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </AppScreen>
  );
};

// --- ALT BİLEŞENLER (Okunabilirlik İçin Ayrıldı) ---

const BackButton = ({ navigation }: { navigation: any }) => (
  <Pressable
    onPress={() => navigation.canGoBack() && navigation.goBack()}
    style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
    <Text style={styles.backIcon}>←</Text>
  </Pressable>
);

const MarketHeader = ({ selectedCategory, onSelectCategory }: { selectedCategory: Category, onSelectCategory: (c: Category) => void }) => (
  <View style={styles.headerContainer}>
    <MarketOverview trend="Bullish" volatility="Medium" />
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
        {CATEGORIES.map(item => {
          const isActive = item === selectedCategory;
          return (
            <Pressable
              key={item}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onSelectCategory(item)}>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
    <Text style={styles.sectionTitle}>Stock List</Text>
  </View>
);

const MarketEventFooter = () => {
  const { lastMarketEvent } = useEventStore();
  return (
    <View style={styles.eventCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        <Text style={styles.eventIcon}>📈</Text>
        <Text style={styles.sectionTitle}>Today&apos;s Market Event</Text>
      </View>
      <Text style={styles.eventText}>
        {lastMarketEvent ?? 'Bugün henüz özel bir market olayı yaşanmadı.'}
      </Text>
      <Pressable
        onPress={() => void triggerEvent('market')}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
        <Text style={styles.secondaryButtonText}>Trigger Market Event</Text>
      </Pressable>
    </View>
  );
};

export default MarketScreen;

const styles = StyleSheet.create({
  listContent: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: theme.spacing.xl + theme.spacing.md },
  headerContainer: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
  tabBar: { backgroundColor: 'transparent' },
  tabBarContent: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, gap: theme.spacing.sm },
  tab: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md, borderRadius: 999, backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  tabActive: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  tabLabel: { color: theme.colors.textSecondary, fontWeight: '700', fontSize: theme.typography.caption + 1 },
  tabLabelActive: { color: theme.colors.accent },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg },
  eventCard: { marginTop: theme.spacing.md, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.md },
  eventIcon: { fontSize: 16 },
  eventText: { fontSize: theme.typography.caption + 1, color: theme.colors.textSecondary, lineHeight: 18 },
  secondaryButton: { backgroundColor: theme.colors.accentSoft, paddingVertical: theme.spacing.md, borderRadius: theme.radius.sm, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  secondaryButtonPressed: { backgroundColor: theme.colors.card, transform: [{ scale: 0.98 }] },
  secondaryButtonText: { color: theme.colors.accent, fontWeight: '700', fontSize: theme.typography.body },
  backButton: { width: 36, height: 36, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.card },
  backButtonPressed: { backgroundColor: theme.colors.cardSoft, transform: [{ scale: 0.97 }] },
  backIcon: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '700' },
});