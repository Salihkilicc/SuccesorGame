import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MarketScreen from './Assets/Market/MarketScreen';
import MyCompanyScreen from './Assets/MyCompany/MyCompanyScreen';
import {useStatsStore, useUserStore, useEventStore} from '../store';
import {getRandomEvent} from '../utils/randomEvent';
import type {AssetsStackParamList} from '../navigation';

const TABS = [
  {key: 'Market', label: 'Market'},
  {key: 'MyCompany', label: 'My Company'},
] as const;

type AssetsTab = (typeof TABS)[number]['key'];

const AssetsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const {netWorth, money, riskApetite, strategicSense} = useStatsStore();
  const {hasPremium} = useUserStore();
  const {lastMarketEvent} = useEventStore();
  const [activeTab, setActiveTab] = useState<AssetsTab>('Market');
  const nextMove = useMemo(
    () =>
      getRandomEvent([
        'Rebalance your portfolio.',
        'Check startup deal flow.',
        'Park cash in a safe asset.',
      ]),
    [],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assets</Text>
      <Text style={styles.body}>
        Overview of your holdings and net worth. Switch tabs to peek at the
        market or your own company.
      </Text>
      <Pressable
        onPress={() => navigation.navigate('Casino')}
        style={({pressed}) => [
          styles.casinoButton,
          pressed && styles.casinoButtonPressed,
        ]}>
        <Text style={styles.casinoButtonText}>Go to Casino</Text>
      </Pressable>
      <Text style={styles.stat}>Net worth: ${netWorth.toLocaleString()}</Text>
      <Text style={styles.stat}>Cash: ${money.toLocaleString()}</Text>
      <Text style={styles.stat}>Risk appetite: {riskApetite}</Text>
      <Text style={styles.stat}>Strategic sense: {strategicSense}</Text>
      <Text style={styles.event}>Last market event: {lastMarketEvent}</Text>
      <Text style={styles.event}>Next move idea: {nextMove}</Text>
      <Text style={styles.event}>Premium: {hasPremium ? 'Yes' : 'No'}</Text>

      <View style={styles.segmentContainer}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              style={[styles.segmentButton, isActive && styles.segmentButtonOn]}
              onPress={() => setActiveTab(tab.key)}>
              <Text
                style={[
                  styles.segmentLabel,
                  isActive && styles.segmentLabelOn,
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.content}>
        {activeTab === 'Market' ? <MarketScreen /> : <MyCompanyScreen />}
      </View>
    </View>
  );
};

export default AssetsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 24,
    color: '#111827',
  },
  body: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  casinoButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  casinoButtonPressed: {
    backgroundColor: '#0b1220',
    transform: [{scale: 0.98}],
  },
  casinoButtonText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 14,
  },
  segmentContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonOn: {
    backgroundColor: '#111827',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  segmentLabelOn: {
    color: '#f9fafb',
  },
  content: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
