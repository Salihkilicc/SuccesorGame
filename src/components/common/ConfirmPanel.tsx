// src/components/common/ConfirmPanel.tsx
//
// ============================================================================
//  IN-PLACE CONFIRMATION
// ============================================================================
//
//  The company screens fired 61 Alert.alert calls, and the big ones were
//  paragraphs: the IPO confirmation was nine lines of prose and figures inside
//  a system dialog. Three problems with that, in order of how much they cost:
//
//  1) A system Alert cannot be styled, so every one of them was a white iOS
//     sheet dropped into a dark themed game. The theme stopped at the dialog.
//  2) It renders monospaced-ish body text with no structure, so a table of
//     figures had to be faked with \n and spaces, and it wrapped differently
//     on every device.
//  3) It takes the player out of the screen. You lose the context you were
//     reading a moment ago, which for a numbers screen is the whole point.
//
//  This is the same decision rendered in place: a title, the figures as real
//  rows, one line of consequence, and the two buttons. It draws inside the
//  screen that raised it rather than over the app.
//
//  Alert is still right for genuinely unexpected failures - a rejected loan,
//  a missing prerequisite - which is why this does not try to replace those.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../core/theme';

export type ConfirmLine = {
    label: string;
    value: string;
    /** Marks the bottom line of a table - the total. */
    strong?: boolean;
    tone?: 'positive' | 'negative';
};

type Props = {
    visible: boolean;
    title: string;
    /** One line saying what this does, before any numbers. */
    summary?: string;
    /** The figures. Rendered as real rows, not as text with newlines in it. */
    lines?: ConfirmLine[];
    /** The consequence - the thing the player should read before confirming. */
    note?: string;
    confirmLabel: string;
    cancelLabel?: string;
    /** Omit to render an acknowledge-only panel (a result, not a question). */
    onConfirm?: () => void;
    onCancel: () => void;
    /** `danger` is for irreversible actions, and colours the NOTE only. */
    tone?: 'default' | 'danger';
    /**
     * A decision with more than two answers - paying for an acquisition in
     * cash, debt or stock, say. Rendered as stacked rows because each one
     * needs a line of explanation; a system Alert could only give them a
     * label, which is why the financing terms used to be crammed into the
     * message body above the buttons.
     *
     * When present, `confirmLabel` is not shown - the choices ARE the answer.
     */
    choices?: { label: string; description?: string; onPress: () => void }[];
};

const ConfirmPanel = ({
    visible,
    title,
    summary,
    lines,
    note,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    tone = 'default',
    choices,
}: Props) => {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            {/* Tapping outside cancels, matching what a system Alert would do. */}
            <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

            <View style={styles.panel}>
                <Text style={styles.title}>{title}</Text>
                {!!summary && <Text style={styles.summary}>{summary}</Text>}

                {!!lines?.length && (
                    <ScrollView style={styles.lines} bounces={false}>
                        {lines.map((l, i) => (
                            <View key={i} style={[styles.line, l.strong && styles.lineStrong]}>
                                <Text style={[styles.lineLabel, l.strong && styles.lineLabelStrong]}>
                                    {l.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.lineValue,
                                        l.strong && styles.lineValueStrong,
                                        l.tone === 'positive' && { color: theme.colors.positive },
                                        l.tone === 'negative' && { color: theme.colors.negative },
                                    ]}>
                                    {l.value}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {!!note && (
                    <View style={[styles.noteBox, tone === 'danger' && styles.noteBoxDanger]}>
                        <Text style={styles.note}>{note}</Text>
                    </View>
                )}

                {!!choices?.length && (
                    <View style={styles.choices}>
                        {choices.map((c, i) => (
                            <Pressable
                                key={i}
                                onPress={c.onPress}
                                style={({ pressed }) => [styles.choice, pressed && styles.btnPressed]}>
                                <Text style={styles.choiceLabel}>{c.label}</Text>
                                {!!c.description && <Text style={styles.choiceDesc}>{c.description}</Text>}
                            </Pressable>
                        ))}
                    </View>
                )}

                <View style={styles.actions}>
                    {!choices?.length && !!onConfirm && (
                        <Pressable
                            onPress={onCancel}
                            style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.btnPressed]}>
                            <Text style={styles.btnCancelText}>{cancelLabel || 'Cancel'}</Text>
                        </Pressable>
                    )}
                    {choices?.length ? (
                        <Pressable
                            onPress={onCancel}
                            style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.btnPressed]}>
                            <Text style={styles.btnCancelText}>{cancelLabel || 'Cancel'}</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={onConfirm || onCancel}
                            style={({ pressed }) => [styles.btn, styles.btnConfirm, pressed && styles.btnPressed]}>
                            {/* Primary is the bright blue: a light fill, so the label is black. */}
                            <Text style={styles.btnConfirmText}>{confirmLabel}</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
};

export default ConfirmPanel;

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        backgroundColor: 'rgba(28,36,44,0.85)',
        zIndex: 9999,
    },
    panel: {
        width: '100%',
        maxWidth: 460,
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    title: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle + 2, fontWeight: '800' },
    summary: { color: theme.colors.textSecondary, fontSize: theme.typography.body, lineHeight: 19 },
    lines: { maxHeight: 260, marginTop: theme.spacing.xs },
    line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: theme.spacing.md },
    lineStrong: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        marginTop: 4,
        paddingTop: 8,
    },
    lineLabel: { color: theme.colors.textMuted, fontSize: theme.typography.body, flexShrink: 1 },
    lineLabelStrong: { color: theme.colors.textPrimary, fontWeight: '700' },
    lineValue: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.body,
        fontVariant: ['tabular-nums'],
    },
    lineValueStrong: { color: theme.colors.textPrimary, fontWeight: '800' },
    noteBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.sm,
        padding: theme.spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.warning,
    },
    noteBoxDanger: { borderLeftColor: theme.colors.destructive },
    note: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1, lineHeight: 17 },
    choices: { gap: theme.spacing.xs, marginTop: theme.spacing.xs },
    choice: {
        backgroundColor: theme.colors.surfaceHigh,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    choiceLabel: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: theme.typography.body + 1 },
    choiceDesc: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1, marginTop: 3, lineHeight: 16 },
    actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
    btn: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center' },
    btnCancel: {
        backgroundColor: theme.colors.surfaceHigh,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    btnConfirm: { backgroundColor: theme.colors.primary },
    btnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
    btnCancelText: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: theme.typography.body + 1 },
    btnConfirmText: { color: theme.colors.onLight, fontWeight: '800', fontSize: theme.typography.body + 1 },
});
