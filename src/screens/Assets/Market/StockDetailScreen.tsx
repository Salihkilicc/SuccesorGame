import React from 'react';
import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AssetsStackParamList} from '../../../navigation';
import StockDetailHeader from '../../../components/Market/StockDetailHeader';
import StockInfoSection from '../../../components/Market/StockInfoSection';
import BuySellPanel from '../../../components/Market/BuySellPanel';

type Props = NativeStackScreenProps<AssetsStackParamList, 'StockDetail'>;

const StockDetailScreen = ({route}: Props) => {
  const {symbol, price, change, category} = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
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
    </SafeAreaView>
  );
};

export default StockDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  container: {
    padding: 16,
    gap: 16,
  },
});
