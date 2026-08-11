// src/components/common/UnreadBadge.tsx
//
// ============================================================================
//  THE UNREAD BADGE
// ============================================================================
//
//  One component, so the count on the nav bar, the count on the Mail tile and
//  the count on the Messages tile cannot end up three slightly different
//  shapes. It is a small thing that goes wrong quietly.
//
//  THE COUNTS ARE SPLIT BY CHANNEL, which is the point rather than a detail.
//  Mail and Messages are different rooms in this game - one is the corporate
//  wall, the other is your pocket - and a single merged number would tell the
//  player "you have four things" without saying whether they are four letters
//  from the board or four texts from his brother at midnight. Those call for
//  different reactions, so they get different badges.
//
//  Renders NOTHING at zero. A badge showing 0 is not information, it is
//  furniture, and it trains the eye to stop looking at the corner where the
//  real ones appear.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';

type Props = {
    count: number;
    /** Sits over an icon rather than beside it. */
    floating?: boolean;
};

/** Past this it says 9+; four digits in a circle is unreadable anyway. */
const MAX_SHOWN = 9;

const UnreadBadge = ({ count, floating }: Props) => {
    if (count <= 0) return null;
    return (
        <View style={[styles.badge, floating && styles.floating]}>
            <Text style={styles.text}>{count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}</Text>
        </View>
    );
};

export default UnreadBadge;

const styles = StyleSheet.create({
    badge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        // The one red in the palette that is a fill. See core/theme.ts - it is
        // #D32F2F rather than the iOS #FF3B30 because white digits on that
        // measure 3.55, which is too low for text this small.
        backgroundColor: theme.colors.notification,
    },
    floating: {
        position: 'absolute',
        top: -6,
        // Far enough right to clear a 26pt icon without leaving the tab.
        right: -10,
        // A ring in the bar's own colour, so the badge reads as sitting ON
        // the icon rather than merging into it.
        borderWidth: 2,
        borderColor: theme.colors.background,
        height: 20,
        minWidth: 20,
        borderRadius: 10,
    },
    text: {
        color: theme.colors.notificationText,
        fontSize: 11,
        fontWeight: '800',
        // Digits are why this red was chosen: white on it reads 4.98.
        lineHeight: 14,
    },
});
