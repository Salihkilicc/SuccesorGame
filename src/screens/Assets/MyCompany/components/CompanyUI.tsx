// src/features/MyCompany/components/CompanyUI.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../../theme';

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
  card: { backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.primary, marginBottom: theme.spacing.sm, gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  contentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  col: { flex: 1, gap: 4 },
  separator: { width: 1, backgroundColor: theme.colors.border, marginHorizontal: 12 },
  label: { fontSize: 11, color: theme.colors.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  success: { color: theme.colors.success },
  danger: { color: theme.colors.danger },
  sectionHeader: { marginTop: theme.spacing.sm },
  sectionTitle: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginLeft: 4 },
});