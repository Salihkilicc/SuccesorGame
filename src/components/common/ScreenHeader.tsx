// src/components/common/ScreenHeader.tsx
//
// ============================================================================
//  ONE WAY BACK
// ============================================================================
//
//  Leaving a screen was different on nearly every screen. The app had, at
//  once: "← Close" as text, a bare "←", a "✕" in the top right, a "← Back",
//  a full-width Close button at the bottom, and several screens with no way
//  out at all except the OS gesture. The sections that had just been promoted
//  from popups to routes had none, because a popup is dismissed by tapping
//  outside it and a screen is not.
//
//  So there is one header now: back arrow top left, title beside it, optional
//  slot on the right. The arrow is the ONLY affordance for leaving, and it is
//  in the same place on every screen - which is the point. A player should
//  never have to look for the way out.
//
//  Modelled on the financial report header, which is the one the player
//  singled out as correct.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';

type Props = {
    title: string;
    /** Small line under the title - the period, a count, a status. */
    subtitle?: string;
    /**
     * What "back" does. Defaults to popping the navigation stack, which is
     * right for a screen; a component still used as a modal passes its own
     * dismiss here.
     */
    onBack?: () => void;
    /** A single control on the right - a balance, a filter. Never a close. */
    right?: React.ReactNode;
    /**
     * Pad for the status bar.
     *
     * True when the header is the top of an actual screen. FALSE when it sits
     * inside a modal card - there the inset is already handled by the page
     * behind it, and adding it again reserved a status-bar's worth of empty
     * surface INSIDE the card, which is the wide grey band that appeared above
     * the product title.
     */
    inset?: boolean;
};

const ScreenHeader = ({ title, subtitle, onBack, right, inset = true }: Props) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const goBack = onBack || (() => navigation.goBack());

    return (
        <View style={[styles.header, { paddingTop: inset ? Math.max(insets.top, 12) + 8 : theme.spacing.md }]}>
            <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Back">
                <Text style={styles.backTxt}>←</Text>
            </Pressable>

            <View style={styles.titleBlock}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>

            {right ? <View style={styles.right}>{right}</View> : null}
        </View>
    );
};

export default ScreenHeader;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    backBtnPressed: { backgroundColor: theme.colors.surfaceHigh, transform: [{ scale: 0.96 }] },
    backTxt: { color: theme.colors.textPrimary, fontSize: 22, lineHeight: 26, marginTop: -2 },
    titleBlock: { flex: 1 },
    title: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle + 4, fontWeight: '800' },
    subtitle: { color: theme.colors.textSecondary, fontSize: theme.typography.caption + 1, marginTop: 2 },
    right: { alignItems: 'flex-end' },
});
