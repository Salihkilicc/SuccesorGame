// src/features/casino/components/PokerSeat.tsx
//
// ============================================================================
//  ONE PERSON AT THE TABLE
// ============================================================================
//
//  Asked for as "there should be opponents, round character circles, and when
//  images are added everyone gets a photo".
//
//  So the avatar is a CIRCLE from the start, with initials in it, and the
//  photograph drops into exactly the same circle later with one line changed.
//  Building it square and rounding it afterwards is how a UI ends up with two
//  kinds of avatar.
//
//  The colour is derived from the person's id rather than assigned, so the
//  same chief executive is the same colour every time you sit down with them.
//  That is most of what makes five bots feel like five people you have met
//  before.
//
//  ---------------------------------------------------------------------------
//  AND THE BUBBLE IS THE OTHER HALF
//  ---------------------------------------------------------------------------
//  A seat that only shows a name and a number is a scoreboard. What makes a
//  table feel populated is seeing what somebody just DID - "raise 8M", "fold"
//  - appear beside their face a moment after their turn came round.
// ============================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '../../../core/i18n';
import { theme } from '../../../core/theme';
import { avatarHue, type SeatKind } from '../../../core/casino/pokerTable';
import { translateOccupation } from '../../../data/i18n/profileLoveShopText';
import Portrait from '../../../components/common/Portrait';
import type { Action } from '../../../core/casino/pokerBots';
import type { Card } from '../../../core/casino/blackjack';
import AnimatedCard from './AnimatedCard';
import { type RoomFelt } from '../../../core/casino/roomPalette';

/**
 * How wide a card is at the showdown.
 *
 * Two of them plus the gap has to fit inside a seat, which is 86 points. See
 * the `width` prop on AnimatedCard for why this is a size rather than a
 * separate mini card component.
 */
export const SHOWN_CARD_W = 27;

type Props = {
    id: string;
    name: string;
    kind: SeatKind;
    /** The company they run, where they run one. */
    company?: string;
    stack: number;
    /** What they just did. Null when it is not their turn and they have done nothing. */
    lastAction?: Action | null;
    lastAmount?: number;
    /** Whose turn it is. */
    active?: boolean;
    /** Out of the hand. */
    folded?: boolean;
    /** The room's accent, for the active ring. */
    tint: string;
    // ----------------------------------------------------------------------
    //  THE SHOWDOWN
    // ----------------------------------------------------------------------
    //  Asked for as "let us see the winners' hands at the end in poker".
    //
    //  Until now the opponents' cards were never shown at all: the hand ended,
    //  a line of status text named the winning hand, and the player had no way
    //  to check it or to learn anything from it. Poker is a game of reading
    //  people and there was nothing to read - which is most of why the table
    //  felt like it was resolving rather than being played.
    // ----------------------------------------------------------------------
    /** Their two cards, at the showdown. Undefined until then. */
    hole?: Card[];
    /** What those cards make. "Two Pair", "Flush". */
    handName?: string;
    /** They won or shared the pot. */
    winner?: boolean;
    /** The room's card back. These flip as they land, so it is seen. */
    back?: RoomFelt;
};

const money = (n: number): string => {
    const v = Math.max(0, n || 0);
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${Math.round(v / 1e3)}K`;
    return String(Math.round(v));
};

/**
 * What a seat says about itself.
 *
 * A rival chief executive is worth naming as one - that is the entire point of
 * putting them at the table rather than a stranger.
 */
const KIND_LABEL: Record<SeatKind, string> = {
    ceo: 'CEO',
    board: 'YOUR BOARD',
    stranger: '',
    // A magnate always carries their own line - "Shipping, fourth generation"
    // - so this is only the fallback if one ever arrives without one.
    magnate: 'PRIVATE WEALTH',
};

const PokerSeat = ({
    id, name, kind, company, stack, lastAction, lastAmount, active, folded, tint,
    hole, handName, winner, back,
}: Props) => {
    const showing = !!hole && hole.length > 0;
    const hue = avatarHue(id);
    const ring = `hsl(${hue}, 45%, 52%)`;

    return (
        <View style={[styles.wrap, folded && styles.folded]}>
            {/* ----------------------------------------------------------------
                The photograph the circle was always built for.

                This file has said since it was written that "the photograph
                drops into exactly the same circle later with one line
                changed". This is that line. Portrait keeps the fill, the
                initials and the hue that were here, so a person with no file
                looks exactly as they did before - a partner generated at
                runtime out of 66,040 name combinations never will have one.

                The ring stays the person's own colour because all 299 faces
                sit on one warm ramp by construction; without it a table of
                five is five near identical oranges.
               ---------------------------------------------------------------- */}
            <Portrait
                id={id}
                name={name}
                size={46}
                borderColor={active || winner ? tint : ring}
                borderWidth={active || winner ? 3 : 2}
            />

            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {/* Lit for the people who are SOMEBODY, muted for your own board.
                A magnate reads like a rival because that is what they are in
                the room: a name, not a seat filler. */}
            {kind !== 'stranger' && (
                <Text
                    style={[
                        styles.kind,
                        { color: kind === 'ceo' || kind === 'magnate' ? tint : theme.colors.textMuted },
                    ]}
                    numberOfLines={1}
                >
                    {/* ------------------------------------------------
                        A MAGNATE'S LINE WAS IN ENGLISH ON EVERY SEAT.

                        `Magnate.of` - "Shipping, fourth generation" - has
                        been printed here since the table was built, and
                        scripts/untranslated.js cannot see it: it reads .tsx
                        and looks at Text CHILDREN and naming props, and this
                        arrives through a variable out of a .ts data file.

                        A rival's company is a brand name and stays as it is;
                        the registry returns anything it does not know
                        unchanged, so both cases go through one call.
                       ------------------------------------------------ */}
                    {translateOccupation(company || '') || KIND_LABEL[kind]}
                </Text>
            )}
            <Text style={styles.stack}>{money(stack)}</Text>

            {/* ------------------------------------------------------------
                THE SHOWDOWN, or what they just did. Never both: once the
                cards are face up, "CALL 8M" is history and the hand is the
                only thing worth the space.
               ------------------------------------------------------------ */}
            {showing ? (
                <View style={styles.shown}>
                    <View style={styles.shownCards}>
                        {hole!.map((c, i) => (
                            <AnimatedCard
                                key={`${c.rank}${c.suit}`}
                                card={c}
                                index={i}
                                width={SHOWN_CARD_W}
                                fromY={-24}
                                back={back}
                            />
                        ))}
                    </View>
                    {!!handName && (
                        <Text
                            numberOfLines={1}
                            style={[styles.handName, winner && { color: tint }]}
                        >
                            {handName.toUpperCase()}
                        </Text>
                    )}
                </View>
            ) : !!lastAction && (
                <View style={[styles.bubble, { borderColor: `${tint}55` }]}>
                    <Text style={styles.bubbleText} numberOfLines={1}>
                        {lastAction === 'raise' ? t('casino.raiseAction', { amount: money(lastAmount || 0) })
                            : lastAction === 'call' ? t('casino.callAction', { amount: money(lastAmount || 0) })
                                : lastAction.toUpperCase()}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', width: 86 },
    /** Dimmed, not hidden: who folded is information for the rest of the hand. */
    folded: { opacity: 0.38 },
    // ------------------------------------------------------------------
    //  SHELVED, not deleted: the seat's own avatar styles.
    // ------------------------------------------------------------------
    //  These three moved into components/common/Portrait.tsx so that every
    //  avatar in the game is one component rather than five copies. The
    //  numbers are unchanged there - 46 across, radius half of it, 2 point
    //  ring going to 3 for whoever is to act - and Portrait derives the
    //  initials size from the diameter instead of fixing it at 16, which is
    //  what lets a 46 point seat and a 96 point profile header read alike.
    //
    //  Kept here because they are the record of what the seat looked like
    //  before there were photographs, and because if Portrait ever has to be
    //  backed out this is what goes back in.
    //
    // avatar: {
    //     width: 46,
    //     height: 46,
    //     borderRadius: 23,
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     borderWidth: 2,
    // },
    // /** The one whose turn it is. A ring rather than a fill, so nothing moves. */
    // avatarActive: { borderWidth: 3 },
    // initials: {
    //     color: '#FFFFFF',
    //     fontSize: 16,
    //     fontWeight: '800',
    //     letterSpacing: 0.5,
    // },
    name: {
        marginTop: 4,
        color: theme.colors.textPrimary,
        fontSize: 9.5,
        fontWeight: '700',
    },
    /**
     * SMALLER, because the whole point is that it FITS.
     *
     * Reported as "write the labels in a smaller font so they fit, you cannot
     * tell who the CEOs are otherwise". A company name that truncates to
     * "Gener..." tells the player nothing, and the one thing this line exists
     * to say is which of the five people at the table runs a rival.
     */
    kind: {
        fontSize: 7,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    stack: {
        marginTop: 1,
        color: theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: '700',
    },
    shown: { alignItems: 'center', marginTop: 3 },
    shownCards: { flexDirection: 'row', gap: 3 },
    /**
     * What the cards make.
     *
     * The winner's is in the room's colour and everybody else's is muted, so
     * who took it is legible before the words are read. TEXT ONLY - green and
     * red belong to profit and loss and nothing else in this game.
     */
    handName: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 7,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    bubble: {
        marginTop: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    bubbleText: {
        color: '#FFFFFF',
        fontSize: 8.5,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
});

export default PokerSeat;
