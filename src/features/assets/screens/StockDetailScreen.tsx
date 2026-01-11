import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AssetsStackParamList } from '../../../navigation';
import StockDetailHeader from '../../../components/Market/StockDetailHeader';
import StockInfoSection from '../../../components/Market/StockInfoSection';
import BuySellPanel from '../../../components/Market/BuySellPanel';
import { theme } from '../../../core/theme';
import AppScreen from '../../../components/layout/AppScreen';

type Props = NativeStackScreenProps<AssetsStackParamList, 'StockDetail'>;

const StockDetailScreen = ({ route, navigation }: Props) => {
  const { symbol, price, change, category } = route.params;
  const categoryLabel = category ?? 'Tech';
  const riskLabel = 'Medium';

  return (
    <AppScreen title={symbol} subtitle={`${categoryLabel} • Risk ${riskLabel}`}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backText}>Market</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <StockDetailHeader
          symbol={symbol}
          price={price}
          change={change}
          category={category}
        />
        <StockInfoSection />
        <BuySellPanel symbol={symbol} price={price} category={category} />
      </ScrollView>
    </AppScreen>
  );
};

export default StockDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  backText: {
    color: 'white',
    fontSize: theme.typography.body,
    fontWeight: '600',
  },
});
