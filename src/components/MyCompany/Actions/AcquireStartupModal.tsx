import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useStatsStore } from '../../../store';
import { theme } from '../../../theme';
import { AcquisitionTarget, Category } from '../../../data/AcquisitionData';
import { enrichStockData } from '../../../data/enrichStockData';
import CompanyAnalysisModal from './CompanyAnalysisModal';
import NegotiationModal from './NegotiationModal';

// Import stock market data
import { STOCKS } from '../../Market/StocksList';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const CATEGORIES: Category[] = ['Technology', 'Media', 'Industrial', 'Retail'];

const AcquireStartupModal = ({ visible, onClose }: Props) => {
  const { companyCapital, acquisitions = [] } = useStatsStore(); // Default to empty array if undefined
  const [activeTab, setActiveTab] = useState<Category>('Technology');
  const [selectedCompany, setSelectedCompany] = useState<AcquisitionTarget | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // Enrich stock market data with acquisition fields
  const enrichedTargets = useMemo(() => enrichStockData(STOCKS), []);

  // Optimized Filter: Never shows 'All', defaults to 'Technology'
  const filteredCompanies = useMemo(() => {
    return enrichedTargets.filter(c => c.category === activeTab);
  }, [activeTab, enrichedTargets]);

  const handleInitiateAcquisition = (company: AcquisitionTarget) => {
    // Note: Cost is dynamic now mostly, but simplified as MarketCap * Premium
    const estimatedCost = company.marketCap * company.acquisitionPremium;

    // Basic validation
    if (companyCapital < estimatedCost * 0.5) { // Looser check
      Alert.alert('Insufficient Capital', `You need at least $${(estimatedCost * 0.5 / 1e9).toFixed(1)}B to start talks.`);
      return;
    }

    // Close Analysis, Open Negotiation
    // actually we can keep Analysis open behind it or close it. 
    // Let's keep Analysis modal control as is, but we need to trigger Negotiation.
    // Since Analysis is a Modal, Negotiation should be on top.
    setIsNegotiating(true);
  };

  const onNegotiationSuccess = () => {
    setIsNegotiating(false);
    setSelectedCompany(null);
    Alert.alert('Acquisition Complete', `You have successfully acquired ${selectedCompany?.name} !`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>M&A Marketplace</Text>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceLabel}>WAR CHEST</Text>
            <Text style={styles.balanceValue}>${(companyCapital / 1e9).toFixed(2)}B</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {CATEGORIES.map(category => (
              <Pressable
                key={category}
                onPress={() => setActiveTab(category)}
                style={[styles.tab, activeTab === category && styles.activeTab]}
              >
                <Text style={[styles.tabText, activeTab === category && styles.activeTabText]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* List */}
        <ScrollView contentContainerStyle={styles.listContent}>
          {filteredCompanies.map(company => {
            // Robust check: Legacy state might be an object, so strictly check for Array
            const isOwned = Array.isArray(acquisitions) && acquisitions.includes(company.id);
            const estimatedCost = company.marketCap * company.acquisitionPremium;

            return (
              <Pressable
                key={company.id}
                onPress={() => !isOwned && setSelectedCompany(company)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && !isOwned && styles.cardPressed,
                  isOwned && styles.cardOwned
                ]}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.logoBox, isOwned && { borderColor: theme.colors.success }]}>
                    <Text style={styles.logo}>{company.logo}</Text>
                  </View>
                  <View>
                    <Text style={[styles.companyName, isOwned && { color: theme.colors.textMuted }]}>
                      {company.name} {isOwned && '✅'}
                    </Text>
                    <Text style={styles.companyDesc}>{company.category}</Text>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  {isOwned ? (
                    <View style={styles.badgeOwned}>
                      <Text style={styles.badgeTextOwned}>OWNED</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.valueLabel}>Est. Cost</Text>
                      <Text style={styles.valueText}>${(estimatedCost / 1e9).toFixed(1)}B</Text>
                    </>
                  )}
                </View>
              </Pressable>
            )
          })}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Analysis Modal */}
        <CompanyAnalysisModal
          visible={!!selectedCompany && !isNegotiating}
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onAcquire={handleInitiateAcquisition}
        />

        {/* Negotiation Modal */}
        <NegotiationModal
          visible={isNegotiating}
          company={selectedCompany}
          onClose={() => setIsNegotiating(false)}
          onSuccess={onNegotiationSuccess}
        />
      </View>
    </Modal>
  );
};

export default AcquireStartupModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  balanceBadge: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.success,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTab: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.background,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{ scale: 0.99 }],
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logo: {
    fontSize: 22,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  companyDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    maxWidth: 160,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  valueLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  badgeHighSynergy: {
    backgroundColor: 'rgba(76, 209, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRisky: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.success,
  },
  cardOwned: {
    backgroundColor: theme.colors.background,
    opacity: 0.7,
  },
  badgeOwned: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTextOwned: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 10,
  }
});
