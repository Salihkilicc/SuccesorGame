import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../core/theme';

export const StatPill = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.pill}>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillValue}>{value}</Text>
    </View>
);

export const AssetsHeader = ({ onBack, risk, strategy }: any) => (
    <View style={styles.header}>
        <View style={styles.headerRow}>
            <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
                <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <Text style={styles.title}>Assets</Text>
            <View style={{ width: 32 }} />
        </View>
        <View style={styles.riskRow}>
            <StatPill label="Risk Appetite" value={`${Math.round(risk)}%`} />
            <StatPill label="Strategic Sense" value={`${Math.round(strategy)}%`} />
        </View>
    </View>
);

export const InfoCard = ({ title, body, variant = 'default' }: any) => (
    <View style={variant === 'soft' ? styles.cardSoft : styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
    </View>
);

export const SummaryRow = ({ label, value, marginTop = false }: any) => (
    <View style={marginTop && { marginTop: theme.spacing.md }}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
    </View>
);

export const CategoryCard = ({ label, value, meta, onPress }: any) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}>
        <Text style={styles.categoryLabel}>{label}</Text>
        <Text style={styles.categoryValue}>{value}</Text>
        <Text style={styles.categoryMeta}>{meta}</Text>
    </Pressable>
);

export const ActionTile = ({ title, body, onPress, variant = 'market' }: any) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
            styles.actionTile,
            variant === 'market' ? styles.marketTile : styles.companyTile,
            pressed && styles.actionTilePressed,
        ]}>
        <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionBody}>{body}</Text>
        </View>
        <Text style={styles.tileCta}>›</Text>
    </Pressable>
);

export const BreakdownSection = ({ title, items, isIncome }: { title: string, items: any[], isIncome?: boolean }) => {
    if (!items || items.length === 0) return null;
    return (
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <Text style={styles.sectionHeader}>{title}</Text>
            {items.map((item, index) => (
                <View key={index} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={[styles.breakdownValue, { color: isIncome ? theme.colors.success : theme.colors.textPrimary }]}>
                        {isIncome ? '+' : '-'}${item.value.toLocaleString()}
                    </Text>
                </View>
            ))}
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
    summaryLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption, letterSpacing: 0.4, textTransform: 'uppercase' },
    summaryValue: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
    categoryCard: { flex: 1, backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.xs, minHeight: 110 },
    categoryCardPressed: { transform: [{ scale: 0.98 }], backgroundColor: theme.colors.card },
    categoryLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption, letterSpacing: 0.4 },
    categoryValue: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
    categoryMeta: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1, lineHeight: 18 },
    actionTile: { flex: 1, backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.md, justifyContent: 'space-between', minHeight: 140 },
    marketTile: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
    companyTile: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    actionTitle: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
    actionBody: { color: theme.colors.textSecondary, fontSize: theme.typography.body, lineHeight: 18 },
    actionTilePressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
    tileCta: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: theme.typography.subtitle, alignSelf: 'flex-end' },
    sectionHeader: { fontSize: theme.typography.body, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
    breakdownLabel: { fontSize: theme.typography.body, color: theme.colors.textPrimary },
    breakdownValue: { fontSize: theme.typography.body, fontWeight: '700' },
});