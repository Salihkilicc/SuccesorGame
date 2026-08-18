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
//
// `onPress` makes the whole card a way in. On My Company it opens the
// financial report, which is the obvious destination and had no obvious door:
// the card is nine numbers summarising the quarter, and the report is those
// nine numbers explained. A chevron marks it, because a card that reacts to
// being pressed without ever saying it would is a trap the second time.
export const DashboardCard = ({ title, children, rightContent, onPress, showChevron = false }: {
  title: string,
  children: React.ReactNode,
  rightContent?: React.ReactNode,
  onPress?: () => void,
  showChevron?: boolean,
}) => {
  const body = (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.headerRight}>
          {rightContent}
          {showChevron && <Text style={styles.cardChevron}>›</Text>}
        </View>
      </View>
      <View style={styles.contentRow}>
        {children}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.card}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button">
      {body}
    </Pressable>
  );
};

import InfoDot from '../../../../components/common/InfoDot';

// Bölüm Başlığı
export const SectionHeader = ({
  title,
  info,
}: {
  title: string;
  info?: { title: string; text: string; detail?: string };
}) => (
  <View style={[styles.sectionHeader, info && styles.sectionHeaderWithInfo]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {info && (
      <InfoDot
        title={info.title}
        text={info.text}
        detail={info.detail}
        small
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#434B50', borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: theme.spacing.sm, gap: 8 }, // Gold border
  cardPressed: { backgroundColor: theme.colors.surfaceHigh },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardChevron: { color: theme.colors.textMuted, fontSize: 22, marginTop: -2 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' }, // White
  contentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  col: { flex: 1, gap: 4 },
  separator: { width: 1, backgroundColor: '#434B50', marginHorizontal: 12 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.48)', textTransform: 'uppercase' }, // Text Secondary
  value: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' }, // White
  success: { color: '#FFFFFF' }, // Green
  sectionHeader: { marginTop: theme.spacing.sm },
  sectionHeaderWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  /**
   * OPERATIONS, QUICK ACTIONS and the rest. They were 48% white - the same
   * colour as every muted label on the screen - so the things that divide
   * the page read as more page.
   *
   * The washed-out brand orange gives the dividers a colour of their own
   * without letting them shout. It is the brand hue at about half
   * saturation, so a heading cannot be mistaken for the brand-value figure.
   * See rule 4 in core/theme.ts.
   */
  sectionTitle: { color: theme.colors.brandMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginLeft: 4 },
});