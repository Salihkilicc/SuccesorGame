import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useStatsStore } from '../../../core/store';
import { useUserStore } from '../../../core/store/useUserStore';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { theme } from '../../../core/theme';
import { INITIAL_MARKET_ITEMS, CATEGORIES, Category } from '../../../features/assets/data/marketData';
import SubsidiaryDetailModal from './SubsidiaryDetailModal';
import { SubsidiaryState } from '../../../core/store/useStatsStore';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const AcquireStartupModal = ({ visible, onClose }: Props) => {
  const { companyCapital, subsidiaryStates } = useStatsStore();
  const subsidiaries = useUserStore(state => state.subsidiaries);
  const acquireCompany = useMarketStore(state => state.acquireCompany);

  const [viewMode, setViewMode] = useState<'marketplace' | 'owned'>('marketplace');
  const [activeTab, setActiveTab] = useState<Category>('Technology');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<SubsidiaryState | null>(null);

  // Filter market items: only show unacquired companies
  const availableTargets = useMemo(() => {
    return INITIAL_MARKET_ITEMS.filter(item => {
      const isAcquired = subsidiaries.some(s => s.symbol === item.symbol);
      return !isAcquired && item.category === activeTab;
    }).sort((a, b) => a.acquisitionCost - b.acquisitionCost); // Lowest cost first
  }, [activeTab, subsidiaries]);

  // Market Domination Progress
  const totalMarketCompanies = INITIAL_MARKET_ITEMS.length;
  const ownedCount = subsidiaries.length;
  const dominationPercent = Math.round((ownedCount / totalMarketCompanies) * 100);

  const handleAcquire = (item: typeof INITIAL_MARKET_ITEMS[0]) => {
    const canAfford = companyCapital >= item.acquisitionCost;

    if (!canAfford) {
      Alert.alert(
        'Insufficient Capital',
        `You need $${(item.acquisitionCost / 1_000_000).toFixed(0)}M to acquire ${item.name}.`
      );
      return;
    }

    Alert.alert(
      'Hostile Takeover',
      `Acquire 100% of ${item.name} for $${(item.acquisitionCost / 1_000_000).toFixed(0)}M?\n\nActive Buff: ${item.acquisitionBuff.label}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACQUIRE',
          style: 'destructive',
          onPress: () => {
            const success = acquireCompany(item.id);
            if (success) {
              Alert.alert(
                'Acquisition Complete! 🎉',
                `You now own ${item.name}!\n\nActive Bonus: ${item.acquisitionBuff.label}`
              );
            } else {
              Alert.alert('Failed', 'Transaction error. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Hostile Takeover</Text>
            <View style={styles.viewToggle}>
              <Pressable
                onPress={() => setViewMode('marketplace')}
                style={[styles.toggleBtn, viewMode === 'marketplace' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, viewMode === 'marketplace' && styles.toggleTextActive]}>Targets</Text>
              </Pressable>
              <Pressable
                onPress={() => setViewMode('owned')}
                style={[styles.toggleBtn, viewMode === 'owned' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, viewMode === 'owned' && styles.toggleTextActive]}>Owned ({ownedCount})</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceLabel}>WAR CHEST</Text>
            <Text style={styles.balanceValue}>${(companyCapital / 1e9).toFixed(2)}B</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        {/* Market Domination Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Market Domination</Text>
            <Text style={styles.progressValue}>{ownedCount}/{totalMarketCompanies} ({dominationPercent}%)</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${dominationPercent}%` }]} />
          </View>
        </View>

        {/* Filter Tabs (only for marketplace) */}
        {viewMode === 'marketplace' && (
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
        )}

        {/* Marketplace List */}
        {viewMode === 'marketplace' && (
          <ScrollView contentContainerStyle={styles.listContent}>
            {availableTargets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyText}>All {activeTab} companies acquired!</Text>
                <Text style={styles.emptyHint}>Try another category</Text>
              </View>
            ) : (
              availableTargets.map(item => {
                const canAfford = companyCapital >= item.acquisitionCost;

                return (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardLeft}>
                      <View style={styles.logoBox}>
                        <Text style={styles.logo}>🏢</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.companyName}>
                          {item.name} ({item.symbol})
                        </Text>
                        <Text style={styles.buffLabel}>
                          Buff: {item.acquisitionBuff.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardRight}>
                      <Pressable
                        onPress={() => handleAcquire(item)}
                        disabled={!canAfford}
                        style={({ pressed }) => [
                          styles.acquireBtn,
                          !canAfford && styles.acquireBtnDisabled,
                          pressed && canAfford && styles.acquireBtnPressed
                        ]}
                      >
                        <Text style={[styles.acquireBtnText, !canAfford && styles.acquireBtnTextDisabled]}>
                          ACQUIRE
                        </Text>
                        <Text style={[styles.acquireCost, !canAfford && styles.acquireCostDisabled]}>
                          ${(item.acquisitionCost / 1_000_000).toFixed(0)}M
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* Owned Companies List (Acquired Subsidiaries) */}
        {viewMode === 'owned' && (
          <ScrollView contentContainerStyle={styles.listContent}>
            {subsidiaries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyText}>No acquisitions yet</Text>
                <Text style={styles.emptyHint}>Start your hostile takeover campaign</Text>
              </View>
            ) : (
              subsidiaries.map(sub => (
                <View key={sub.id} style={[styles.card, styles.ownedCard]}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.logoBox, { borderColor: theme.colors.success }]}>
                      <Text style={styles.logo}>👑</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.companyName}>
                        {sub.name} ({sub.symbol})
                      </Text>
                      <Text style={styles.buffLabel}>
                        Active: {sub.acquisitionBuff.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedBadgeText}>OWNED</Text>
                  </View>
                </View>
              ))
            )}

            {/* Also show legacy startups if any */}
            {Object.values(subsidiaryStates).length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Founded Startups</Text>
                {Object.values(subsidiaryStates).map(sub => {
                  const isHealthy = !sub.isLossMaking;
                  return (
                    <Pressable
                      key={sub.id}
                      onPress={() => setSelectedSubsidiary(sub)}
                      style={({ pressed }) => [
                        styles.card,
                        pressed && styles.cardPressed,
                        !isHealthy && styles.cardCritical,
                      ]}
                    >
                      <View style={styles.cardLeft}>
                        <View style={[styles.logoBox, !isHealthy && { borderColor: theme.colors.danger }]}>
                          <Text style={styles.logo}>🚀</Text>
                        </View>
                        <View>
                          <Text style={styles.companyName}>{sub.name}</Text>
                          <Text style={[styles.companyDesc, !isHealthy && { color: theme.colors.danger }]}>
                            {isHealthy ? '🟢 Healthy' : '🔻 CRITICAL'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardRight}>
                        <Text style={styles.valueLabel}>Monthly P/L</Text>
                        <Text style={[styles.valueText, { color: isHealthy ? theme.colors.success : theme.colors.danger }]}>
                          ${(Math.abs(sub.currentProfit) / 12 / 1e6).toFixed(1)}M
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* Subsidiary Detail Modal (for legacy startups) */}
        <SubsidiaryDetailModal
          visible={selectedSubsidiary !== null}
          onClose={() => setSelectedSubsidiary(null)}
          subsidiary={selectedSubsidiary}
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
  headerLeft: {
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  cardCritical: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.danger + '08',
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
  ownedCard: {
    backgroundColor: theme.colors.success + '10',
    borderColor: theme.colors.success + '40',
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
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  buffLabel: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  companyDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  acquireBtn: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  acquireBtnDisabled: {
    backgroundColor: theme.colors.cardSoft,
    opacity: 0.5,
  },
  acquireBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  acquireBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
  },
  acquireBtnTextDisabled: {
    color: theme.colors.textMuted,
  },
  acquireCost: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  acquireCostDisabled: {
    color: theme.colors.textMuted,
  },
  ownedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ownedBadgeText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
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
});
