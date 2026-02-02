import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

// Veri Tipi
export interface FinancialData {
  productionCount?: number;
  salesCount?: number;
  revenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  endingCash?: number;
  endingCapital?: number;
  inventory?: number; // Added
  reportCurrentRP?: number;
  operationalSetback?: boolean;
  setbackMessage?: string;
  lostRevenue?: number;
  lostUnits?: number;
  productBreakdown?: {
    id: string;
    name: string;
    produced: number;
    sold: number;
    revenue: number;
    expense: number;
    profit: number;
    stock: number;
  }[];
}

// Para Formatlayıcı
const formatCurrency = (value: number | undefined) => {
  // Eğer değer tanımsızsa 0 kabul et
  const val = value || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

type Props = {
  visible: boolean;
  onClose: () => void;
  reportData: FinancialData | null;
};

const QuarterlyReportModal = ({ visible, onClose, reportData }: Props) => {
  // --- GÜVENLİK ---
  // Veri null gelse bile boş bir obje ver ki patlamasın.
  const data = reportData || {};

  const production = data.productionCount || 0;
  const sales = data.salesCount || 0;
  const revenue = data.revenue || 0;
  const expenses = data.totalExpenses || 0;
  const profit = data.netProfit || 0;
  const cash = data.endingCash || 0;
  const capital = data.endingCapital || 0;
  const stock = data.inventory || 0;
  const currentRP = data.reportCurrentRP || 0;

  // Calculate additional metrics
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';
  const isProfit = profit >= 0;

  // Calculate expense breakdown for visual bars
  const expenseCategories = data.productBreakdown && data.productBreakdown.length > 0
    ? data.productBreakdown.reduce((acc, product) => {
      acc.push({
        label: product.name,
        amount: product.expense,
        percentage: expenses > 0 ? (product.expense / expenses) * 100 : 0
      });
      return acc;
    }, [] as { label: string; amount: number; percentage: number }[])
    : [];

  // Get current quarter/period (placeholder - you can enhance this)
  const currentPeriod = 'Q1 2026';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Custom Header with Close Button & Period Badge */}
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>FINANCIAL PERFORMANCE</Text>
              <Text style={styles.headerSubtitle}>CFO Dashboard</Text>
            </View>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>{currentPeriod}</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >

            {/* HERO CARD - Net Profit */}
            <View style={[
              styles.heroCard,
              { borderColor: isProfit ? '#FFD700' : '#F44336' }
            ]}>
              <Text style={styles.heroLabel}>NET INCOME</Text>
              <Text style={[
                styles.heroValue,
                { color: isProfit ? '#4CAF50' : '#F44336' }
              ]}>
                {isProfit ? '+' : ''}{formatCurrency(profit)}
              </Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>vs Last Quarter</Text>
              </View>
            </View>

            {/* METRICS GRID (2x2) */}
            <View style={styles.metricsGrid}>
              {/* Revenue Card */}
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>📈</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <Text style={styles.metricValue}>{formatCurrency(revenue)}</Text>
              </View>

              {/* Expenses Card */}
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>📉</Text>
                <Text style={styles.metricLabel}>Total Expenses</Text>
                <Text style={[styles.metricValue, { color: '#F44336' }]}>
                  {formatCurrency(expenses)}
                </Text>
              </View>

              {/* Profit Margin Card */}
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>💰</Text>
                <Text style={styles.metricLabel}>Profit Margin</Text>
                <Text style={[styles.metricValue, { color: '#FFD700' }]}>
                  {profitMargin}%
                </Text>
              </View>

              {/* R&D Card */}
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>🔬</Text>
                <Text style={styles.metricLabel}>R&D Points</Text>
                <Text style={[styles.metricValue, { color: '#9C27B0' }]}>
                  {currentRP >= 1000 ? (currentRP >= 1000000 ? `${(currentRP / 1000000).toFixed(1)}M` : `${(currentRP / 1000).toFixed(1)}K`) : currentRP}
                </Text>
              </View>
            </View>

            {/* VISUAL EXPENSE BREAKDOWN */}
            {expenseCategories.length > 0 && (
              <View style={styles.expenseSection}>
                <Text style={styles.sectionTitle}>EXPENSE BREAKDOWN</Text>
                {expenseCategories.slice(0, 5).map((category, index) => (
                  <View key={index} style={styles.expenseBar}>
                    <View style={styles.expenseBarHeader}>
                      <Text style={styles.expenseBarLabel}>{category.label}</Text>
                      <Text style={styles.expenseBarAmount}>{formatCurrency(category.amount)}</Text>
                    </View>
                    <View style={styles.expenseBarTrack}>
                      <View
                        style={[
                          styles.expenseBarFill,
                          {
                            width: `${Math.min(100, category.percentage)}%`,
                            backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#FF6B6B' : '#4CAF50'
                          }
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* OPERATIONAL SETBACK ALERT */}
            {data.operationalSetback && (
              <View style={styles.alertBox}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <Text style={styles.alertTitle}>OPERATIONAL FAILURE</Text>
                </View>
                <Text style={styles.alertMessage}>"{data.setbackMessage}"</Text>
                <Text style={styles.alertLoss}>
                  Loss: -{data.lostUnits?.toLocaleString()} Units • {formatCurrency(data.lostRevenue)}
                </Text>
              </View>
            )}

            {/* PRODUCT PERFORMANCE LIST */}
            <View style={styles.productSection}>
              <Text style={styles.sectionTitle}>PRODUCT PERFORMANCE</Text>
              <View style={styles.productList}>
                <View style={styles.productListHeader}>
                  <Text style={styles.productHeaderText}>Product</Text>
                  <Text style={styles.productHeaderText}>Prod/Sold</Text>
                  <Text style={styles.productHeaderText}>Profit</Text>
                </View>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {data.productBreakdown && data.productBreakdown.length > 0 ? (
                    data.productBreakdown.map((item) => (
                      <View key={item.id} style={styles.productItem}>
                        <View style={styles.productCol1}>
                          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.productStock}>Stock: {item.stock}</Text>
                        </View>
                        <View style={styles.productCol2}>
                          <Text style={styles.productPerf}>{item.produced}/{item.sold}</Text>
                        </View>
                        <View style={styles.productCol3}>
                          <Text style={[
                            styles.productProfit,
                            { color: item.profit >= 0 ? '#4CAF50' : '#F44336' }
                          ]}>
                            {item.profit >= 0 ? '+' : ''}{formatCurrency(item.profit)}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No active products this quarter.</Text>
                  )}
                </ScrollView>
              </View>
            </View>

            {/* FOOTER INFO */}
            <View style={styles.footerInfo}>
              <View style={styles.footerInfoItem}>
                <Text style={styles.footerInfoLabel}>Cash</Text>
                <Text style={styles.footerInfoValue}>{formatCurrency(cash)}</Text>
              </View>
              <View style={styles.footerInfoDivider} />
              <View style={styles.footerInfoItem}>
                <Text style={styles.footerInfoLabel}>Capital</Text>
                <Text style={styles.footerInfoValue}>{formatCurrency(capital)}</Text>
              </View>
            </View>

          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.footerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed
              ]}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default QuarterlyReportModal;

const styles = StyleSheet.create({
  // MODAL CONTAINER
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '95%',
    backgroundColor: '#121212', // Deep Black
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2D35',
    overflow: 'hidden',
  },

  // CUSTOM HEADER
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#1A1A1C',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D35',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2D35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8A9BA8',
    marginTop: 2,
    fontWeight: '600',
  },
  periodBadge: {
    backgroundColor: '#2A2D35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  periodText: {
    color: '#8A9BA8',
    fontSize: 11,
    fontWeight: '700',
  },

  // SCROLL CONTENT
  scrollContent: {
    padding: 20,
    gap: 20,
  },

  // HERO CARD - Net Profit
  heroCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9BA8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroBadge: {
    backgroundColor: '#2A2D35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroBadgeText: {
    color: '#8A9BA8',
    fontSize: 11,
    fontWeight: '600',
  },

  // METRICS GRID (2x2)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#8A9BA8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // EXPENSE BREAKDOWN
  expenseSection: {
    backgroundColor: '#1A1A1C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9BA8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  expenseBar: {
    marginBottom: 12,
  },
  expenseBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  expenseBarLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  expenseBarAmount: {
    fontSize: 12,
    color: '#8A9BA8',
    fontWeight: '600',
  },
  expenseBarTrack: {
    height: 8,
    backgroundColor: '#2A2D35',
    borderRadius: 4,
    overflow: 'hidden',
  },
  expenseBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // OPERATIONAL SETBACK ALERT
  alertBox: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 2,
    borderColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertTitle: {
    color: '#F44336',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  alertMessage: {
    color: '#FFCDD2',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertLoss: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '700',
  },

  // PRODUCT PERFORMANCE
  productSection: {
    backgroundColor: '#1A1A1C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  productList: {
    gap: 8,
  },
  productListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D35',
    marginBottom: 8,
  },
  productHeaderText: {
    flex: 1,
    fontSize: 10,
    color: '#8A9BA8',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  productCol1: {
    flex: 1.5,
  },
  productCol2: {
    flex: 1,
    alignItems: 'center',
  },
  productCol3: {
    flex: 1,
    alignItems: 'flex-end',
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  productStock: {
    color: '#666',
    fontSize: 10,
  },
  productPerf: {
    color: '#8A9BA8',
    fontSize: 12,
    fontWeight: '600',
  },
  productProfit: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },

  // FOOTER INFO
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#1A1A1C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  footerInfoItem: {
    alignItems: 'center',
  },
  footerInfoLabel: {
    fontSize: 10,
    color: '#8A9BA8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  footerInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2D35',
  },

  // FOOTER ACTIONS
  footerActions: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: '#121212',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});