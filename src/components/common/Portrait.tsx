// src/components/common/Portrait.tsx
//
// ============================================================================
//  THE ONLY THING THAT DRAWS A FACE
// ============================================================================
//
//  Every avatar in this game is a circle with initials in it, and every one of
//  them was written separately - the poker seat, the partner card, the family
//  list, the board modal, the messages screen. Adding photographs by editing
//  each of those is how a UI ends up with two kinds of avatar, one of which
//  nobody remembers to update.
//
//  So this is one component: give it an id and a name and it shows the
//  portrait if there is one, and the exact same circle with the exact same
//  initials if there is not. Callers never ask which case they are in.
//
//  ---------------------------------------------------------------------------
//  THE COLOUR STAYS EVEN WHEN THERE IS A PHOTOGRAPH
//  ---------------------------------------------------------------------------
//  The ring is still derived from the id, because that is what makes the same
//  chief executive feel like the same person every time you sit down with
//  them. The portraits are all on one warm ramp by construction, so without
//  the ring a table of five would be five near identical oranges.
//
//  The fill is dark and desaturated so white initials clear it, and it sits
//  UNDER the image as well: a portrait that is still decoding shows the
//  person's own colour rather than a white flash.
// ============================================================================

import React from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { avatarHue, initialsOf } from '../../core/casino/pokerTable';
import { portraitForPerson } from '../../core/portraits';

type Props = {
    /** Who this is. Looked up in the portrait registry. */
    id: string;
    /** Their name, for the initials when there is no portrait. */
    name: string;
    /** Diameter in points. The border radius follows it, so this stays a circle. */
    size: number;
    /**
     * An explicit border colour, for the states a screen already owns - whose
     * turn it is at the table, who won. Omitted, the person's own hue is used.
     */
    borderColor?: string;
    /** Border width. 0 turns the ring off entirely. */
    borderWidth?: number;
    /**
     * Override the portrait lookup with a source of your own.
     *
     * This is for the characters who are generated at runtime and cannot have
     * a file of their own - a partner drawn from 66,040 name combinations gets
     * a face LENT to them by the picker, which passes it in here.
     */
    source?: number | null;
    style?: StyleProp<ViewStyle>;
};

const Portrait = ({
    id, name, size, borderColor, borderWidth = 2, source, style,
}: Props) => {
    const hue = avatarHue(id);
    const fill = `hsl(${hue}, 32%, 26%)`;
    const ring = borderColor ?? `hsl(${hue}, 45%, 52%)`;
    // An explicitly passed source wins; undefined means "look it up for me",
    // null means "this one has no face, do not look".
    const src = source === undefined ? portraitForPerson(id, name) : source;

    return (
        <View
            style={[
                styles.wrap,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: fill,
                    borderColor: ring,
                    borderWidth,
                },
                style,
            ]}
        >
            {src ? (
                <Image
                    source={src as number}
                    style={{ width: '100%', height: '100%' }}
                    // The portraits are square and the head fills the frame, so
                    // cover and contain agree. cover is stated anyway: if a
                    // future batch ever comes back at another aspect ratio, a
                    // circle with bars in it is worse than a slight crop.
                    resizeMode="cover"
                    // The one thing a face must never do is arrive late and
                    // shift the row. The box is sized above, so it cannot.
                    fadeDuration={0}
                />
            ) : (
                <Text
                    style={[
                        styles.initials,
                        // Scaled off the circle rather than a table of sizes,
                        // so a 46 point seat and a 96 point profile header read
                        // the same. 0.36 is what fits two capitals at 46.
                        { fontSize: Math.round(size * 0.36) },
                    ]}
                    numberOfLines={1}
                >
                    {initialsOf(name)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
        // Without this the image corners escape the circle on iOS.
        overflow: 'hidden',
    },
    initials: {
        color: '#FFFFFF',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default Portrait;
