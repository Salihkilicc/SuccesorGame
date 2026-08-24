import React from 'react';
import { useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet } from 'react-native';
// `t`, `Pressable` and `ScreenHeader` are referenced only by the four shelved
// components below. Left commented rather than removed so uncommenting them
// is one step rather than a hunt for what they used to need.
// import { t } from '../../../core/i18n';
// import { Pressable } from 'react-native';
// import ScreenHeader from '../../../components/common/ScreenHeader';
import { theme } from '../../../core/theme';
import { formatMoney } from '../../../core/utils';

export const StatPill = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.pill}>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillValue}>{value}</Text>
    </View>
);

// ============================================================================
//  FOUR COMPONENTS NOTHING RENDERS
// ============================================================================
//
//  AssetsHeader, InfoCard, CategoryCard and ActionTile have zero call sites in
//  the codebase. They are the remains of an earlier assets screen: a header
//  with risk-appetite and strategic-sense pills, two card variants and a pair
//  of cyan action tiles leading to the market and the company.
//
//  SHELVED rather than deleted, because they are not dead ideas - they are a
//  design that was replaced before it was wired. `AssetsHeader` in particular
//  shows two player traits that the current screen has nowhere to put, and if
//  the personal screen grows a second page that is where they go.
//
//  StatPill stays live below: it is the only one of the five with a reader,
//  and shelving it would take the others' one working part with it.
// ============================================================================

// export const AssetsHeader = ({ onBack, risk, strategy }: any) => (
//     <View style={styles.header}>
//         <ScreenHeader title={t('company.assets2')} onBack={onBack} />
//         <View style={styles.riskRow}>
//             <StatPill label={t('company.riskAppetite')} value={`${Math.round(risk)}%`} />
//             <StatPill label={t('company.strategicSense')} value={`${Math.round(strategy)}%`} />
//         </View>
//     </View>
// );

// export const InfoCard = ({ title, body, variant = 'default' }: any) => (
//     <View style={variant === 'soft' ? styles.cardSoft : styles.card}>
//         <Text style={styles.cardTitle}>{title}</Text>
//         <Text style={styles.cardBody}>{body}</Text>
//     </View>
// );

export const SummaryRow = ({ label, value, marginTop = false, valueColor }: any) => (
    <View style={marginTop && { marginTop: theme.spacing.md }}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={[styles.summaryValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
);

// SHELVED with the two above. Note `marketTile` and `companyTile` are the
// SAME cyan fill, so the variant prop has never selected anything - a third
// symptom of a design that was left half wired.
// export const CategoryCard = ({ label, value, meta, onPress }: any) => (
//     <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}>
//         <Text style={styles.categoryLabel}>{label}</Text>
//         <Text style={styles.categoryValue}>{value}</Text>
//         <Text style={styles.categoryMeta}>{meta}</Text>
//     </Pressable>
// );

// export const ActionTile = ({ title, body, onPress, variant = 'market' }: any) => (
//     <Pressable
//         onPress={onPress}
//         style={({ pressed }) => [
//             styles.actionTile,
//             variant === 'market' ? styles.marketTile : styles.companyTile,
//             pressed && styles.actionTilePressed,
//         ]}>
//         <View style={{ gap: theme.spacing.xs }}>
//             <Text style={styles.actionTitle}>{title}</Text>
//             <Text style={styles.actionBody}>{body}</Text>
//         </View>
//         <Text style={styles.tileCta}>›</Text>
//     </Pressable>
// );

// ============================================================================
//  A ROW KNOWS WHAT IT IS
// ============================================================================
//
//  SHELVED, and it was showing the player's savings as a debt:
//
//      ({ title, items, isIncome }) => ...
//          {isIncome ? '+' : '-'}{formatMoney(item.amount)}
//
//  Three call sites on the assets screen. Income passed `isIncome`, expenses
//  correctly did not, and CURRENT ASSETS did not either - because there was no
//  third answer to pass. So the cash the player owns rendered as
//  "Cash (Liquid) -$450,000", with a minus sign, in the one section that is
//  neither a flow in nor a flow out.
//
//  The items have carried `type: 'asset' | 'income' | 'expense'` the whole
//  time. Reading it off the row removes the chance for a caller to disagree
//  with the data it is passing, which is the same repair as solving the slot
//  machines' two-kind odds instead of storing them.
//
//  Green and red stay inside the rule: an asset is a holding rather than a
//  profit or a loss, so it is plain white with no sign at all.
// ============================================================================
export const BreakdownSection = ({ title, items }: { title: string, items: any[] }) => {
    useLocale();
    if (!items || items.length === 0) return null;
    return (
        <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.lg }}>
            <Text style={styles.sectionHeader}>{title}</Text>
            {items.map((item, index) => {
                const kind = item?.type === 'income' || item?.type === 'expense'
                    ? item.type
                    : 'asset';
                const sign = kind === 'income' ? '+' : kind === 'expense' ? '-' : '';
                const colour = kind === 'income'
                    ? theme.colors.success
                    : kind === 'expense'
                        ? theme.colors.danger
                        : theme.colors.textPrimary;
                return (
                    <View key={index} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{item.label}</Text>
                        <Text style={[styles.breakdownValue, { color: colour }]}>
                            {sign}{formatMoney(item.amount)}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    header: { gap: theme.spacing.sm },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { width: 32, height: 32, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.card },
    backButtonPressed: { backgroundColor: theme.colors.cardSoft, transform: [{ scale: 0.97 }] },
    backIcon: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '700' },
    title: { fontSize: theme.typography.title, fontWeight: '800', color: theme.colors.textPrimary },
    riskRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
    pill: { backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
    pillLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption, letterSpacing: 0.4 },
    pillValue: { color: theme.colors.textPrimary, fontSize: theme.typography.body, fontWeight: '700' },
    card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.xs },
    cardSoft: { backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.xs },
    cardTitle: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: theme.typography.body },
    cardBody: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1, lineHeight: 18 },
    summaryLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
    summaryValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
    categoryCard: { flex: 1, backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.xs, minHeight: 110 },
    categoryCardPressed: { transform: [{ scale: 0.98 }], backgroundColor: theme.colors.card },
    categoryLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption, letterSpacing: 0.4 },
    categoryValue: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
    categoryMeta: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1, lineHeight: 18 },
    actionTile: { flex: 1, backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.sm, justifyContent: 'space-between', minHeight: 120 },
    marketTile: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    companyTile: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    // Both tile variants are light fills (cyan), so all three labels invert.
    actionTitle: { color: theme.colors.onLight, fontSize: theme.typography.subtitle, fontWeight: '800' },
    actionBody: { color: theme.colors.onLight, fontSize: theme.typography.body, lineHeight: 18 },
    actionTilePressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
    tileCta: { color: theme.colors.onLight, fontWeight: '800', fontSize: theme.typography.subtitle, alignSelf: 'flex-end' },
    sectionHeader: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.48)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    breakdownLabel: { fontSize: 14, color: '#FFFFFF' },
    breakdownValue: { fontSize: 14, fontWeight: '700' },
});