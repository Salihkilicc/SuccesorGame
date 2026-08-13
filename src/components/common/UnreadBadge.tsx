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
//
//  ---------------------------------------------------------------------------
//  AND IT DID NOT MANAGE TO BE THE ONLY ONE
//  ---------------------------------------------------------------------------
//  This covers the nav bar and the home tiles. MessagesScreen and MailScreen
//  each grew their OWN `unreadIndicatorRow` styles instead of using it, which
//  is precisely the drift the file was opened to prevent - three badges, two
//  of them copies.
//
//  They are not folded in here yet because the ring colour genuinely differs:
//  the row badges sit on `surface`, this one on `background`, and merging
//  them needs a prop rather than a find-and-replace. Recorded rather than
//  quietly tolerated, so the next person sees a decision instead of an
//  oversight.
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
        // ------------------------------------------------------------------
        //  TOBACCO, NOT RED
        // ------------------------------------------------------------------
        //  It was `notification` #D32F2F - the one red in the palette that is
        //  a fill - and it was the last red in this app doing a job that is
        //  not red's job. Red here means one sentence, "this is costing you",
        //  and a message you have not opened is not costing you anything.
        //
        //  It measures better as well, which was not the reason and is worth
        //  writing down anyway. On the app's own ground:
        //
        //      #D32F2F   3.15 from the ground, white digits 4.98
        //      #D6A96C   7.29 from the ground, dark digits  7.29
        //
        //  The floating badge sits on that ground with a ring cut in it, so
        //  separation is the number that decides whether it is seen at all.
        // ------------------------------------------------------------------
        backgroundColor: theme.colors.unread,
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
        // Dark on a light fill, which is this app's rule for every light
        // fill and the reason the light tobacco was picked over the dark one.
        color: theme.colors.onLight,
        fontSize: 11,
        fontWeight: '800',
        lineHeight: 14,
    },
});
