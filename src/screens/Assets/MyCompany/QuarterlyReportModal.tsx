import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';

// Veri Tipi
export interface FinancialData {
  productionCount?: number;
  salesCount?: number;
  revenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  endingCash?: number;
  endingCapital?: number;
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

          <View style={styles.grid}>
            {/* Production */}
            <View style={styles.gridItem}>
              <Text style={styles.label}>Production</Text>
              <Text style={styles.value}>{production} units</Text>
            </View>

            {/* Sales */}
            <View style={styles.gridItem}>
              <Text style={styles.label}>Sales</Text>
              <Text style={styles.value}>{sales} units</Text>
            </View>

            {/* Revenue */}
            <View style={styles.gridItem}>
              <Text style={styles.label}>Revenue</Text>
              <Text style={[styles.value, { color: '#4CAF50' }]}>
                +{formatCurrency(revenue)}
              </Text>
            </View>

            {/* Expenses */}
            <View style={styles.gridItem}>
              <Text style={styles.label}>Total Expenses</Text>
              <Text style={[styles.value, { color: '#F44336' }]}>
                -{formatCurrency(expenses)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>NET PROFIT</Text>
            <Text style={[styles.resultValue, { color: isProfit ? '#4CAF50' : '#F44336' }]}>
              {isProfit ? '+' : ''}{formatCurrency(profit)}
            </Text>
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
});