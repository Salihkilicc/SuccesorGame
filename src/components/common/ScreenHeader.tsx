// src/components/common/ScreenHeader.tsx
//
// ============================================================================
//  ONE WAY BACK, ONE WAY TO SAY WHERE YOU ARE
// ============================================================================
//
//  Leaving a screen was different on nearly every screen. The app had, at
//  once: "← Close" as text, a bare "←", a "✕" in the top right, a "← Back",
//  a full-width Close button at the bottom, and several screens with no way
//  out at all except the OS gesture. The sections that had just been promoted
//  from popups to routes had none, because a popup is dismissed by tapping
//  outside it and a screen is not.
//
//  So there is one header. The arrow is the ONLY affordance for leaving and
//  it is in the same place on every screen - which is the point. A player
//  should never have to look for the way out.
//
//  THE SHAPE IS MY COMPANY'S COMMAND CENTER, because that is the one the
//  player picked. It differs from the old header here in three ways, and
//  each was a complaint:
//
//    1) THE TITLE IS CENTRED, not sitting against the arrow. The old one put
//       them a `gap` apart, which on a short title read as one object - the
//       player's words were "too close to the back button".
//
//    2) THE TITLE IS SPACED CAPITALS at a light weight, not bold sentence
//       case. At this size the letter-spacing is what makes it read as a
//       place rather than a label.
//
//    3) THERE IS A SHORT RULE UNDER IT, and its colour says which section
//       you are in. See core/screenCategories.ts - the colour is resolved
//       from the route, so a screen cannot be given the wrong one by
//       forgetting a prop.
//
//  Long titles SHRINK rather than truncate. "CORPORATE FINANCE" at 22pt with
//  four points of letter-spacing is wider than a phone, and an ellipsis in
//  the middle of a place name is worse than a slightly smaller place name.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';
import { categoryColor, type ScreenCategory } from '../../core/screenCategories';

/**
 * Half the back button's width.
 *
 * With an accessory on the left and nothing on the right, a mathematically
 * centred title reads as sitting slightly left - the eye centres on the
 * whole bar, including the button. Shifting by half the accessory restores
 * the optical centre. This is the player's "move the text a little right",
 * and it is half a button rather than a taste number so it stays right if
 * the button ever changes size.
 *
 * Zero when there IS something on the right, because then both gutters are
 * occupied and the mathematical centre is already the optical one.
 */
const TITLE_NUDGE = 19;

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
    /**
     * Override the section colour.
     *
     * Only for headers that are NOT on a route of their own - a modal raised
     * from somewhere else, where the route underneath would give the wrong
     * section. Screens should leave this alone and let the route decide.
     */
    category?: ScreenCategory;
};

const ScreenHeader = ({ title, subtitle, onBack, right, inset = true, category }: Props) => {
    // ------------------------------------------------------------------
    //  THE TITLE HAS TO CLEAR WHATEVER IS ACTUALLY ON THE RIGHT
    // ------------------------------------------------------------------
    //  THE BUG. Both accessories are absolutely positioned and the centre
    //  reserved a FIXED gutter - the back button's width - on each side. The
    //  back button is that width, so the left was always right. The right is
    //  whatever the screen puts there, and on the tech tree that is an info
    //  dot plus a two line balance carrying the research points and the cash.
    //  Far wider than a button, so the centred title ran underneath it.
    //
    //  Reported as "innovation centerda RP points cakisiyor diger yerlerle".
    //
    //  Measured rather than guessed at, because the next screen to put
    //  something there will have a different width and a second magic number
    //  would be the same bug again.
    //
    //  ---------------------------------------------------------------------
    //  AND EACH SIDE RESERVES ONLY WHAT IT NEEDS
    //  ---------------------------------------------------------------------
    //  The first version put the SAME gutter on both, to keep the title
    //  optically centred. It is centred and it is tiny: the tech tree's right
    //  accessory is an info dot beside a two line balance, so "Future
    //  Technologies" was being squeezed into what was left after paying for
    //  that width TWICE. Reported as the title being too small, and asked for
    //  in exactly these words - grow it leftward.
    //
    //  So the left pays for the back button and the right pays for whatever
    //  is actually there. The title still centres inside the space it is
    //  given, which on a screen with a wide accessory sits left of the middle
    //  - which is the point.
    // ------------------------------------------------------------------
    const [rightWidth, setRightWidth] = useState(0);
    const navigation = useNavigation<any>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const goBack = onBack || (() => navigation.goBack());
    const rule = category ? theme.categories[category] : categoryColor(route?.name);

    // ------------------------------------------------------------------
    //  THE FLOOR IS 24 NOW, BECAUSE THE STATUS BAR IS GONE
    // ------------------------------------------------------------------
    //  SHELVED: a `console.log` that printed `insets.top` once per screen.
    //  It was put here to answer "what is the inset on Android", and that
    //  question stopped existing when the status bar was removed. See the
    //  note in App.tsx.
    //
    //      useEffect(() => {
    //          if (__DEV__) console.log(`[header] ${route?.name} ...`);
    //      }, [insets.top, inset, route?.name]);
    //
    //  What replaced it is the FLOOR. It was 12, which was fine while the
    //  status bar existed and paid for the cutout itself. With the bar gone
    //  the window runs to the top of the glass, so on a phone with a
    //  hole-punch camera `insets.top` can come back small and a 12 point
    //  floor would put the title under the lens.
    //
    //  24 is a floor rather than a measurement: on any device that reports
    //  a real cutout `insets.top` is larger and wins, and this only decides
    //  what happens on a device that reports nothing.
    // ------------------------------------------------------------------
    const HEADER_TOP_FLOOR = 24;

    return (
        <View style={[styles.header, { paddingTop: inset ? Math.max(insets.top, HEADER_TOP_FLOOR) + 8 : theme.spacing.md }]}>
            {/* Absolute, so it never pushes the title off centre. */}
            <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Back">
                <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.textPrimary} />
            </Pressable>

            <View
                style={[
                    styles.center,
                    {
                        paddingLeft: HEADER_BACK_SIZE + theme.spacing.sm,
                        paddingRight: rightWidth + theme.spacing.sm,
                    },
                    !right && { transform: [{ translateX: TITLE_NUDGE }] },
                ]}>
                <Text
                    style={styles.title}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}>
                    {title}
                </Text>
                <View style={[styles.rule, { backgroundColor: rule }]} />
                {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>

            {right ? (
                <View
                    style={styles.right}
                    onLayout={e => setRightWidth(e.nativeEvent.layout.width)}>
                    {right}
                </View>
            ) : null}
        </View>
    );
};

export default ScreenHeader;

/** So screens can reserve the same top space the header occupies. */
export const HEADER_BACK_SIZE = 38;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    backBtn: {
        position: 'absolute',
        left: theme.spacing.lg,
        bottom: theme.spacing.md,
        width: HEADER_BACK_SIZE,
        height: HEADER_BACK_SIZE,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        zIndex: 10,
    },
    backBtnPressed: { backgroundColor: theme.colors.surfaceHigh, transform: [{ scale: 0.96 }] },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // Each gutter is applied at the call site: the left from the back
        // button, the right from the MEASURED width of the accessory - see
        // the note in the component. This is the floor, for the case where
        // there is nothing on the right at all.
        paddingHorizontal: HEADER_BACK_SIZE + theme.spacing.sm,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: 22,
        fontWeight: '300',
        letterSpacing: 4,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    /** The section colour. Short on purpose - it is a mark, not an underline. */
    rule: {
        width: 32,
        height: 2,
        borderRadius: 2,
        marginTop: 6,
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 4,
        textAlign: 'center',
    },
    right: { position: 'absolute', right: theme.spacing.lg, bottom: theme.spacing.md, alignItems: 'flex-end' },
});
