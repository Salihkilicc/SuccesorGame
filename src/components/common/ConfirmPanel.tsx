// src/components/common/ConfirmPanel.tsx
//
// ============================================================================
//  THE CONFIRMATION DIALOG
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
//  So this is the same decision, themed, with the figures as real rows.
//
//  ---------------------------------------------------------------------------
//  IT IS AN ACTUAL MODAL NOW, AND THAT WAS THE BUG
//  ---------------------------------------------------------------------------
//  It used to be a plain absolutely-positioned View, on the theory that a
//  confirmation should stay inside the screen that raised it. That theory does
//  not survive contact with the tree, because `absoluteFillObject` fills the
//  PARENT, not the window:
//
//    - Raised from inside a card, the "full-screen" backdrop covered the card.
//      The dim and the centring were relative to a box a third of the screen
//      high, so the dialog sat wherever that box happened to be.
//    - Any ancestor with `overflow: 'hidden'` CLIPPED it. The board room's
//      container has one for its rounded corners; so does CollapsibleSection
//      and the finance hub. A dialog can be cut in half by a border radius
//      four levels above it, and nothing in the code says so.
//    - It drew UNDER the hoisted nav bar, so a decision could be covered by
//      navigation.
//
//  An RN Modal fills the window by definition and cannot be clipped by an
//  ancestor. This is the one case where drawing above everything - the nav bar
//  included - is the correct behaviour rather than the fault: you should not be
//  able to navigate away from a question you have been asked. That is the
//  opposite of a destination, which is why destinations became routes and this
//  did not.
//
//  Alert is still right for genuinely unexpected failures - a rejected loan,
//  a missing prerequisite - which is why this does not try to replace those.
// ============================================================================

import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { t } from '../../core/i18n';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
     *
     * ---------------------------------------------------------------------
     *  A CHOICE THAT CANNOT BE TAKEN IS STILL WORTH SHOWING
     * ---------------------------------------------------------------------
     *  The acquisition panel filtered the impossible routes out of this list,
     *  so a player who could not pay cash saw two buttons and no explanation.
     *  Reported as "param var ama olmuyor, issue shares cikiyor sadece" - and
     *  the money was there, it was in the wrong pocket: a deal is paid from
     *  company capital and the player was looking at their own.
     *
     *  A missing button teaches nothing. A greyed one with the reason under
     *  it teaches the whole rule in one line.
     */
    choices?: {
        label: string;
        description?: string;
        onPress: () => void;
        /** Shown, greyed, and not pressable. `description` carries the why. */
        disabled?: boolean;
        /**
         * A MaterialCommunityIcons name, drawn in the row's left gutter.
         */
        icon?: string;
        /**
         * Optional color theme for the choice card.
         * 'brand' uses the warm orange (#FFA94D) theme.
         * 'primary' uses the signature blue (#05A8F6 / #7DD3FC) theme.
         */
        tone?: 'default' | 'brand' | 'primary' | 'accent' | 'danger';
        /**
         * The figure this choice comes down to, shown large on the right.
         */
        value?: string;
    }[];
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
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCancel}>
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
                        {choices.map((c, i) => {
                            const isBrand = c.tone === 'brand';
                            const isPrimary = c.tone === 'primary';
                            const isDanger = c.tone === 'danger';

                            const toneIconColor = c.disabled
                                ? theme.colors.textMuted
                                : isBrand
                                ? '#FFA94D'
                                : isPrimary
                                ? '#05A8F6'
                                : isDanger
                                ? theme.colors.destructive
                                : theme.colors.textPrimary;

                            const toneLabelColor = c.disabled
                                ? theme.colors.textMuted
                                : isBrand
                                ? '#FFA94D'
                                : isPrimary
                                ? '#7DD3FC'
                                : isDanger
                                ? theme.colors.destructive
                                : theme.colors.textPrimary;

                            return (
                                <Pressable
                                    key={i}
                                    onPress={c.disabled ? undefined : c.onPress}
                                    disabled={c.disabled}
                                    style={({ pressed }) => [
                                        styles.choice,
                                        isBrand && styles.choiceBrand,
                                        isPrimary && styles.choicePrimary,
                                        isDanger && styles.choiceDanger,
                                        c.disabled && styles.choiceOff,
                                        pressed && !c.disabled && styles.btnPressed,
                                    ]}>
                                    <View style={styles.choiceHead}>
                                        {!!c.icon && (
                                            <View style={[
                                                styles.choiceIconBadge,
                                                isBrand && styles.choiceIconBadgeBrand,
                                                isPrimary && styles.choiceIconBadgePrimary,
                                                isDanger && styles.choiceIconBadgeDanger,
                                            ]}>
                                                <MaterialCommunityIcons
                                                    name={c.icon}
                                                    size={18}
                                                    color={toneIconColor}
                                                />
                                            </View>
                                        )}
                                        <Text
                                            style={[
                                                styles.choiceLabel,
                                                styles.choiceLabelFlex,
                                                { color: toneLabelColor },
                                                c.disabled && styles.choiceLabelOff,
                                            ]}>
                                            {c.label}
                                        </Text>
                                        {!!c.value && (
                                            <Text
                                                style={[styles.choiceValue, c.disabled && styles.choiceLabelOff]}
                                                numberOfLines={1}>
                                                {c.value}
                                            </Text>
                                        )}
                                        {!c.disabled && (
                                            <MaterialCommunityIcons
                                                name="chevron-right"
                                                size={18}
                                                color={isBrand ? '#FFA94D' : isPrimary ? '#05A8F6' : theme.colors.textMuted}
                                                style={{ marginLeft: 4 }}
                                            />
                                        )}
                                    </View>
                                    {!!c.description && (
                                        <Text style={[styles.choiceDesc, !!c.icon && styles.choiceDescWithIcon]}>
                                            {c.description}
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                <View style={styles.actions}>
                    {!choices?.length && !!onConfirm && (
                        <Pressable
                            onPress={onCancel}
                            style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.btnPressed]}>
                            <Text style={styles.btnCancelText}>{cancelLabel || t('ui.cancel')}</Text>
                        </Pressable>
                    )}
                    {choices?.length ? (
                        <Pressable
                            onPress={onCancel}
                            style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.btnPressed]}>
                            <Text style={styles.btnCancelText}>{cancelLabel || t('ui.cancel')}</Text>
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
        </Modal>
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
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    choiceBrand: {
        backgroundColor: 'rgba(255, 169, 77, 0.08)',
        borderColor: 'rgba(255, 169, 77, 0.35)',
    },
    choicePrimary: {
        backgroundColor: 'rgba(5, 168, 246, 0.08)',
        borderColor: 'rgba(5, 168, 246, 0.35)',
    },
    choiceDanger: {
        backgroundColor: 'rgba(255, 138, 138, 0.08)',
        borderColor: 'rgba(255, 138, 138, 0.35)',
    },
    choiceIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    choiceIconBadgeBrand: {
        backgroundColor: 'rgba(255, 169, 77, 0.16)',
    },
    choiceIconBadgePrimary: {
        backgroundColor: 'rgba(5, 168, 246, 0.16)',
    },
    choiceIconBadgeDanger: {
        backgroundColor: 'rgba(255, 138, 138, 0.16)',
    },
    // Dimmed by the SURFACE rather than by the text, so the reason underneath
    // stays as readable as it is on a live row. A greyed explanation is an
    // explanation nobody reads. See rule 3 in core/theme.ts: no signal colour
    // for a state that is not a profit or a loss.
    choiceOff: { opacity: 0.55 },
    choiceHead: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    choiceLabel: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: theme.typography.body + 1 },
    /** Only when the row has a head; a label on its own still fills the row. */
    choiceLabelFlex: { flex: 1 },
    choiceValue: { color: theme.colors.textPrimary, fontWeight: '900', fontSize: theme.typography.subtitle },
    choiceLabelOff: { color: theme.colors.textMuted },
    choiceDesc: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1, marginTop: 4, lineHeight: 16 },
    choiceDescWithIcon: { paddingLeft: 40 },
    actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
    btn: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center' },
    btnCancel: {
        backgroundColor: theme.colors.surfaceHigh,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    btnConfirm: { backgroundColor: theme.colors.primary },
    btnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
    // ----------------------------------------------------------------------
    //  CENTRED AS A BLOCK IS NOT CENTRED AS A SENTENCE
    // ----------------------------------------------------------------------
    //  Reported as the confirm label sitting off centre. `btn` above has
    //  `alignItems: 'center'`, which centres the Text ELEMENT inside the
    //  button and does nothing to the lines inside it. A short label like OK
    //  is one line and looks fine; "Satın almayı onayla" wraps to two, and
    //  the second line hangs left while the block sits in the middle.
    //
    //  So the button looks correct in English and crooked in Turkish, which
    //  is why it was found by playing rather than by looking.
    // ----------------------------------------------------------------------
    btnCancelText: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: theme.typography.body + 1, textAlign: 'center' },
    btnConfirmText: { color: theme.colors.onLight, fontWeight: '800', fontSize: theme.typography.body + 1, textAlign: 'center' },
});
