import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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

  const isProfit = profit >= 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          <View style={styles.header}>
            <Text style={styles.title}>QUARTERLY REPORT</Text>
            <Text style={styles.subtitle}>Financial Performance</Text>
          </View>

          {/* Product Breakdown List */}
          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Product</Text>
              <Text style={styles.listHeaderTitle}>Perf (Prd / Sld)</Text>
              <Text style={styles.listHeaderTitle}>Net Profit</Text>
            </View>
            <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
              {data.productBreakdown && data.productBreakdown.length > 0 ? (
                data.productBreakdown.map((item) => (
                  <View key={item.id} style={styles.listItem}>
                    <View style={styles.colName}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemStock}>Stock: {item.stock}</Text>
                    </View>
                    <View style={styles.colPerf}>
                      <Text style={styles.itemPerf}>P: {item.produced}</Text>
                      <Text style={styles.itemPerf}>S: {item.sold}</Text>
                    </View>
                    <View style={styles.colProfit}>
                      <Text style={[styles.itemProfit, { color: item.profit >= 0 ? '#4CAF50' : '#F44336' }]}>
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

          <View style={styles.divider} />

          <View style={styles.resultContainer}>
            {/* Operational Setback Alert */}
            {data.operationalSetback && (
              <View style={styles.alertBox}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <Text style={styles.alertTitle}>OPERATIONAL FAILURE DETECTED</Text>
                </View>
                <Text style={styles.alertMessage}>"{data.setbackMessage}"</Text>
                <Text style={styles.alertLoss}>
                  Loss: -{data.lostUnits?.toLocaleString()} Units <Text style={{ fontWeight: '900' }}>(-{formatCurrency(data.lostRevenue)})</Text>
                </Text>
              </View>
            )}

            {/* Footer Summary */}
            <View style={styles.footerSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
                <Text style={styles.summaryValuePos}>+{formatCurrency(revenue)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
                <Text style={styles.summaryValueNeg}>-{formatCurrency(expenses)}</Text>
              </View>
              <View style={[styles.divider, { marginVertical: 8 }]} />
              <View style={styles.summaryRow}>
                <Text style={styles.resultLabelLarge}>NET PROFIT</Text>
                <Text style={[styles.resultValueLarge, { color: isProfit ? '#4CAF50' : '#F44336' }]}>
                  {isProfit ? '+' : ''}{formatCurrency(profit)}
                </Text>
              </View>
              {/* R&D Display */}
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#9C27B0', // Purple/Lila
                marginTop: 8,
                textAlign: 'center',
                width: '100%'
              }}>
                🟣 Current R&D: {currentRP >= 1000 ? (currentRP >= 1000000 ? `${(currentRP / 1000000).toFixed(1)}M` : `${(currentRP / 1000).toFixed(1)}K`) : currentRP} Pts
              </Text>
            </View>
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>User Cash: {formatCurrency(cash)}</Text>
            <Text style={styles.footerText}>Capital: {formatCurrency(capital)}</Text>
          </View>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
};

export default QuarterlyReportModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999, // Çok yüksek verdim, kesin üstte kalsın.
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, width: '100%' },
  gridItem: { width: '48%', backgroundColor: '#2C2C2C', padding: 12, borderRadius: 8 },
  label: { fontSize: 10, color: '#AAA', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  divider: { width: '100%', height: 1, backgroundColor: '#333', marginVertical: 16 },
  resultContainer: { alignItems: 'center', marginBottom: 20 },
  resultLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  resultValue: { fontSize: 28, fontWeight: '800' },
  footerInfo: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  footerText: { fontSize: 11, color: '#666' },
  button: { width: '100%', backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 15, fontWeight: '700' },
  stockLabel: { color: '#666', fontSize: 10, marginTop: 4 },
  alertBox: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center'
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  alertIcon: { fontSize: 16 },
  alertTitle: { color: '#F44336', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  alertMessage: { color: '#FFCDD2', fontSize: 11, fontStyle: 'italic', marginBottom: 6, textAlign: 'center' },
  alertLoss: { color: '#FF5252', fontSize: 13, fontWeight: '700' },

  // New List Styles
  listContainer: { width: '100%', marginBottom: 16, backgroundColor: '#252525', borderRadius: 8, padding: 8 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#444', marginBottom: 8 },
  listHeaderTitle: { fontSize: 10, color: '#888', textTransform: 'uppercase', flex: 1, textAlign: 'center' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  colName: { flex: 1.2 },
  colPerf: { flex: 1, alignItems: 'center' },
  colProfit: { flex: 1, alignItems: 'flex-end' },
  itemName: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  itemStock: { color: '#666', fontSize: 10 },
  itemPerf: { color: '#CCC', fontSize: 11 },
  itemProfit: { fontSize: 13, fontWeight: '700' },
  emptyText: { color: '#666', fontSize: 12, textAlign: 'center', fontStyle: 'italic', padding: 10 },

  // Footer Summary Styles
  footerSummary: { width: '100%', paddingHorizontal: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  summaryLabel: { color: '#AAA', fontSize: 12 },
  summaryValuePos: { color: '#4CAF50', fontSize: 13, fontWeight: '600' },
  summaryValueNeg: { color: '#F44336', fontSize: 13, fontWeight: '600' },
  resultLabelLarge: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  resultValueLarge: { fontSize: 20, fontWeight: '900' }
});