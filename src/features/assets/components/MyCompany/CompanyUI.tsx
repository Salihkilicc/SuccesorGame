// src/features/MyCompany/components/CompanyUI.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../../core/theme';

// Tekrar eden dikey çizgi
export const VerticalDivider = () => <View style={styles.separator} />;

// Tekrar eden istatistik sütunu
export const StatColumn = ({ label, value, colorType = 'default' }: { label: string, value: string, colorType?: 'default' | 'success' | 'danger' }) => (
  <View style={styles.col}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[
      styles.value,
      colorType === 'success' && styles.success,
      colorType === 'danger' && styles.danger
    ]}>{value}</Text>
  </View>
);

// ANA KART BİLEŞENİ (Hem Şirket hem Kişisel Finans için)
export const DashboardCard = ({ title, children, rightContent }: { title: string, children: React.ReactNode, rightContent?: React.ReactNode }) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <Text style={styles.cardTitle}>{title}</Text>
      {rightContent}
    </View>
    <View style={styles.contentRow}>
      {children}
    </View>
  </View>
);

// Bölüm Başlığı
export const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#1C1C1E', borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: '#FFD700', marginBottom: theme.spacing.sm, gap: 8 }, // Gold border
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' }, // White
  contentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' },
  col: { flex: 1, gap: 4 },
  separator: { width: 1, backgroundColor: '#333', marginHorizontal: 12 },
  label: { fontSize: 11, color: '#8E8E93', textTransform: 'uppercase' }, // Text Secondary
  value: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' }, // White
  success: { color: '#30D158' }, // Green
  danger: { color: theme.colors.danger },
  sectionHeader: { marginTop: theme.spacing.sm },
  sectionTitle: { color: '#8E8E93', fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginLeft: 4 },
});