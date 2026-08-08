// src/components/common/Disclosure.tsx
//
// ============================================================================
//  LAYERED ROWS
// ============================================================================
//
//  The company screens were reported as "everything is text". They were: one
//  hub carried 52 Text nodes, and the reason was not verbosity but LAYERING -
//  there wasn't any. A valuation breakdown, the note explaining the breakdown,
//  a damping badge and four stat cards were all on screen at once, at the same
//  weight, whether or not the player wanted any of them.
//
//  The shape here is: a number first, one line saying why, and the working
//  underneath only if asked for. Nothing is deleted - the detail that used to
//  be permanently on screen is one tap away instead.
//
//  Deliberately NOT animated with LayoutAnimation. It needs
//  setLayoutAnimationEnabledExperimental on Android and, more to the point,
//  animating height inside a ScrollView that also holds modals made the rows
//  jump. A disclosure that stutters reads as broken; an instant one does not.
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

type StatRowProps = {
    /** What the number is. */
    label: string;
    /** The number itself - this is the thing the player came for. */
    value: string;
    /** ONE line explaining where the number came from. Keep it short. */
    why?: string;
    /**
     * Optional colour for the value. Reserved for profit/loss - pass
     * theme.colors.positive or .negative and nothing else.
     */
    valueColor?: string;
    /** The working. Only rendered once the row is opened. */
    detail?: React.ReactNode;
    /** Start open. For the one row on a screen that matters most. */
    startOpen?: boolean;
};

export const StatRow = ({ label, value, why, valueColor, detail, startOpen }: StatRowProps) => {
    const [open, setOpen] = useState(!!startOpen);
    const expandable = !!detail;

    const body = (
        <>
            <View style={styles.rowTop}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.rowRight}>
                    <Text style={[styles.value, !!valueColor && { color: valueColor }]}>{value}</Text>
                    {expandable && (
                        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
                    )}
                </View>
            </View>
            {!!why && <Text style={styles.why} numberOfLines={open ? undefined : 1}>{why}</Text>}
            {open && !!detail && <View style={styles.detail}>{detail}</View>}
        </>
    );

    if (!expandable) return <View style={styles.row}>{body}</View>;

    return (
        <Pressable
            onPress={() => setOpen(o => !o)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}>
            {body}
        </Pressable>
    );
};

/** A label/value pair for use INSIDE a StatRow's detail. */
export const DetailLine = ({
    label,
    value,
    strong,
    tone,
}: {
    label: string;
    value: string;
    strong?: boolean;
    tone?: 'positive' | 'negative';
}) => (
    <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, strong && styles.detailStrong]}>{label}</Text>
        <Text
            style={[
                styles.detailValue,
                strong && styles.detailStrong,
                tone === 'positive' && { color: theme.colors.positive },
                tone === 'negative' && { color: theme.colors.negative },
            ]}>
            {value}
        </Text>
    </View>
);

/** A horizontal rule for separating a total from its parts. */
export const DetailRule = () => <View style={styles.rule} />;

/** Small print inside a detail block. Still white - see the theme's rule 1. */
export const DetailNote = ({ children }: { children: React.ReactNode }) => (
    <Text style={styles.note}>{children}</Text>
);

/** Groups rows into one card so a screen reads as sections, not a list. */
export const RowGroup = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <View style={styles.group}>
        {!!title && <Text style={styles.groupTitle}>{title}</Text>}
        <View style={styles.groupBody}>{children}</View>
    </View>
);

const styles = StyleSheet.create({
    group: { gap: theme.spacing.xs, marginBottom: theme.spacing.md },
    groupTitle: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.caption,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginLeft: theme.spacing.xs,
    },
    groupBody: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
    },
    row: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm + 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
    },
    rowPressed: { backgroundColor: theme.colors.surfaceRaised },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    label: { color: theme.colors.textSecondary, fontSize: theme.typography.body, flexShrink: 1 },
    value: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '800' },
    chevron: { color: theme.colors.textMuted, fontSize: theme.typography.body, width: 12, textAlign: 'center' },
    why: { color: theme.colors.textMuted, fontSize: theme.typography.caption, marginTop: 2 },
    detail: {
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        gap: 4,
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md },
    detailLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption + 1, flexShrink: 1 },
    detailValue: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1, fontVariant: ['tabular-nums'] },
    detailStrong: { color: theme.colors.textPrimary, fontWeight: '800' },
    rule: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 4 },
    note: { color: theme.colors.textMuted, fontSize: theme.typography.caption, lineHeight: 16, marginTop: 4 },
});
