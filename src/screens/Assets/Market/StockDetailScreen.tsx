import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AssetsStackParamList} from '../../../navigation';
import StockDetailHeader from '../../../components/Market/StockDetailHeader';
import StockInfoSection from '../../../components/Market/StockInfoSection';
import BuySellPanel from '../../../components/Market/BuySellPanel';
import {theme} from '../../../theme';
import AppScreen from '../../../components/layout/AppScreen';

type Props = NativeStackScreenProps<AssetsStackParamList, 'StockDetail'>;

const StockDetailScreen = ({route}: Props) => {
  const {symbol, price, change, category} = route.params;
  const categoryLabel = category ?? 'Tech';
  const riskLabel = 'Medium';

  return (
    <AppScreen title={symbol} subtitle={`${categoryLabel} • Risk ${riskLabel}`}>
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
        <BuySellPanel symbol={symbol} price={price} />
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
});
