import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text, 
  StyleSheet,
  Pressable,
  FlatList, 
  Alert, 
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { INITIAL_MARKET_ITEMS } from '../../../features/assets/data/marketData';
import BottomStatsBar from '../../../components/common/BottomStatsBar';

const { width } = Dimensions.get('window');

interface AcquisitionModalProps {
  visible: boolean;
  onClose: () => void;
}

const formatMoney = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
};

export const AcquisitionModal = ({ visible, onClose }: AcquisitionModalProps) => {
  const navigation = useNavigation<any>();
  const { marketPrices } = useMarketStore();
  const { subsidiaries, acquireCompany } = useCorporateFinanceStore();
  const { companyCapital } = useStatsStore();

  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);

  // 1. Prepare Data
  const availableCompanies = useMemo(() => {
    return INITIAL_MARKET_ITEMS.filter((item: any) => {
      // Must be a stock (has marketCap/acquisitionCost and NOT crypto/bond)
      const isStock = ('acquisitionCost' in item || 'marketCap' in item) && !('volatility' in item) && !('issuerType' in item);
      if (!isStock) return false;

      // Must not be already owned
      const isOwned = subsidiaries.some((sub: any) => sub.id === item.id);
      if (isOwned) return false;

      return true;
    });
  }, [subsidiaries]);

  // 2. Extract Categories
  const categories = useMemo(() => {
    const sectors = new Set(availableCompanies.map((c: any) => c.category || 'Other'));
    return ['All', ...Array.from(sectors)];
  }, [availableCompanies]);

  // 3. Filter by Sector
  const filteredList = useMemo(() => {
    if (selectedSector === 'All') return availableCompanies;
    return availableCompanies.filter((c: any) => c.category === selectedSector);
  }, [selectedSector, availableCompanies]);

  // 4. Calculate Current Valuation Helper
  const getValuation = (item: any) => {
    const baseStockPrice = item.price || 100;
    const currentStockPrice = marketPrices[item.id] || baseStockPrice;
    const priceRatio = currentStockPrice / baseStockPrice;
    return (item.marketCap || 1_000_000_000) * priceRatio;
  };

  // 5. Handle Acquisition
  const handleAcquire = (type: 'FRIENDLY' | 'HOSTILE') => {
    if (!selectedTarget) return;

    const currentValuation = getValuation(selectedTarget);
    let finalPrice = currentValuation;

    if (type === 'HOSTILE') {
      finalPrice = currentValuation * 1.2; // 20% Premium
    }

    if (companyCapital < finalPrice) {
      Alert.alert('Insufficient Funds', `You need ${formatMoney(finalPrice)} to complete this transaction.`);
      return;
    }

    // Process Acquisition
    acquireCompany(selectedTarget, finalPrice);

    Alert.alert('Acquisition Complete', `You are now the owner of ${selectedTarget.name}.`);
    setSelectedTarget(null);
    onClose();
  };

  const renderCompanyItem = ({ item }: { item: any }) => {
    const valuation = getValuation(item);

    return (
      <TouchableOpacity
        style={styles.itemRow}
        activeOpacity={0.7}
        onPress={() => setSelectedTarget({ ...item, currentValuation: valuation })}
      >
        <View style={styles.itemIcon}>
          <Text style={styles.itemInitial}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSector}>{item.category || 'Technology'}</Text>
        </View>
        <View style={styles.itemValue}>
          <Text style={styles.marketCap}>{formatMoney(valuation)}</Text>
          <Text style={styles.valueLabel}>Market Cap</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleHomePress = () => {
    onClose();
    navigation.navigate('Home');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mergers & Acquisitions</Text>
            <Text style={styles.subtitle}>Expand your corporate empire</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* CAPITAL INDICATOR */}
        <View style={styles.capitalBar}>
          <Text style={styles.capitalLabel}>Acquisition Power</Text>
          <Text style={styles.capitalValue}>{formatMoney(companyCapital)}</Text>
        </View>

        {/* CATEGORY TABS */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.tab, selectedSector === cat && styles.activeTab]}
                onPress={() => setSelectedSector(cat)}
              >
                <Text style={[styles.tabText, selectedSector === cat && styles.activeTabText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* STOCK LIST */}
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderCompanyItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No companies available in this sector.</Text>
            </View>
          }
        />

        {/* Persistent Bottom Bar */}
        <BottomStatsBar onHomePress={handleHomePress} />

        {/* NEGOTIATION OVERLAY */}
        {selectedTarget && (
          <View style={styles.overlayBackdrop}>
            <View style={styles.negotiationCard}>
              <View style={styles.negHeader}>
                <Text style={styles.negTitle}>Acquire {selectedTarget.name}</Text>
                <Text style={styles.negSubtitle}>Choose your approach</Text>
              </View>

              <View style={styles.negBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Current Valuation</Text>
                  <Text style={styles.infoValue}>{formatMoney(selectedTarget.currentValuation)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Synergy Buff</Text>
                  <Text style={styles.buffValue}>{selectedTarget.acquisitionBuff?.label || 'None'}</Text>
                </View>
              </View>

              <View style={styles.negActions}>
                {/* Friendly Offer */}
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => handleAcquire('FRIENDLY')}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>🤝 Friendly Offer</Text>
                    <Text style={styles.optionPrice}>{formatMoney(selectedTarget.currentValuation)}</Text>
                  </View>
                  <Text style={styles.optionDesc}>Purchase at fair market value.</Text>
                </TouchableOpacity>

                {/* Hostile Takeover */}
                <TouchableOpacity
                  style={[styles.optionBtn, styles.hostileBtn]}
                  onPress={() => handleAcquire('HOSTILE')}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionTitle, styles.hostileText]}>⚔️ Hostile Takeover</Text>
                    <Text style={[styles.optionPrice, styles.hostileText]}>
                      {formatMoney(selectedTarget.currentValuation * 1.2)}
                    </Text>
                  </View>
                  <Text style={[styles.optionDesc, styles.hostileDesc]}>
                    Pay +20% premium. Instant close.
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedTarget(null)}
              >
                <Text style={styles.cancelText}>Cancel Negotiation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    paddingTop: 60, // Increased to prevent status bar overlap
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
  capitalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  capitalLabel: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  capitalValue: {
    color: theme.colors.success,
    fontSize: 18,
    fontWeight: '900',
  },

  // Tabs
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeTab: {
    backgroundColor: '#D4AF37', // Gold
    borderColor: '#D4AF37',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 80, // Space for Bottom Bar
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemSector: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemValue: {
    alignItems: 'flex-end',
  },
  marketCap: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  valueLabel: {
    color: '#666',
    fontSize: 11,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#444',
  },

  // Negotiation Overlay
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  negotiationCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  negHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  negTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  negSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  negBody: {
    marginBottom: 24,
    gap: 12,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#888',
  },
  infoValue: {
    color: '#fff',
    fontWeight: '700',
  },
  buffValue: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  negActions: {
    gap: 12,
  },
  optionBtn: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  optionPrice: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  optionDesc: {
    color: '#666',
    fontSize: 12,
  },
  hostileBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: theme.colors.danger,
  },
  hostileText: {
    color: theme.colors.danger,
  },
  hostileDesc: {
    color: '#FF6B6B',
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
  },

});
