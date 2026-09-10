// src/features/casino/screens/PokerGameScreen.tsx
//
// ============================================================================
//  IT WAS TWO HANDS STACKED VERTICALLY, LABELLED YOU AND DEALER
// ============================================================================
//
//  Asked for as "poker should feel like playing with several people, the
//  opponents should be the CEOs of the other companies, with round character
//  circles, and it should feel online but be offline".
//
//  There is a table now, with five people around it, and the hand is genuinely
//  six handed - see core/casino/pokerRound.ts. Drawing the avatars without
//  changing the hand would have been five faces watching a two player game.
//
//  Seats are placed by ANGLE on the ellipse rather than by hand, so the arc is
//  even by construction. The bottom of the oval stays clear because that is
//  where the player's own cards and controls live.
// ============================================================================

import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { t, useLocale } from '../../../core/i18n';
import { theme } from '../../../core/theme';
import CasinoHeader from '../components/CasinoHeader';
import GameResultPopup from '../components/GameResultPopup';
import AnimatedCard from '../components/AnimatedCard';
import PokerTable, { seatPosition } from '../components/PokerTable';
import { HUMAN_SEAT } from '../../../core/casino/pokerRound';
import PokerSeat from '../components/PokerSeat';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import { useStatsStore } from '../../../core/store';
import { useSixHandedPoker, STARTING_STACK_MULTIPLE } from '../logic/useSixHandedPoker';
import { pokerBuyInFor } from '../data/casinoStakes';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { translateCasinoStatus } from '../../../data/i18n/casinoText';
import { VIP_LOCATION_ID } from '../data/vipRoom';
import { feltFor } from '../../../core/casino/roomPalette';

const TABLE_W = Dimensions.get('window').width - 16;
const TABLE_H = 300;
/** How wide a seat is, so it can be centred on its point. */
const SEAT_W = 86;
const SEAT_H = 96;

/**
 * The table's own short form.
 *
 * It stopped at B, which is what "the money does not go above B in the
 * casino" was: a player who sat down with two trillion saw 2000.0B. Two rungs
 * added, to match core/utils formatCompact. Kept local rather than swapped
 * for that function because this one rounds thousands differently on purpose
 * and a chip stack reading 1.2K is not the same as 1.2K of company value.
 */
const money = (n: number): string => {
    const v = Math.max(0, n || 0);
    if (v >= 1e15) return `${(v / 1e15).toFixed(1)}Q`;
    if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`;
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${Math.round(v / 1e3)}K`;
    return String(Math.round(v));
};

const PokerGameScreen = () => {
    useLocale();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { currentLocation, casinoReputation, currentLocationId } = useCasinoSystem();

    // ------------------------------------------------------------------
    //  THE DOOR PRICE, READ REACTIVELY
    // ------------------------------------------------------------------
    //  A selector rather than `getState()`: the buy-in is a share of the
    //  player's fortune, so it has to move when the fortune does. Reading it
    //  once at render would freeze the door at whatever the wallet held the
    //  first time the screen mounted.
    // ------------------------------------------------------------------
    const wallet = useStatsStore(st => st.money);
    const doorPrice = pokerBuyInFor(currentLocation, wallet);

    const { state, actions } = useSixHandedPoker(
        route.params?.betAmount ?? 1_000_000,
        currentLocationId === VIP_LOCATION_ID,
        doorPrice,
    );
    const {
        money: cash, ante, round, opponents, status, resultPopup,
        board, hole, pot, owed, yourTurn, handOver,
        seated, stack, buyIn, broke, seats, sessionUp, hands,
        raiseSteps, raisePct, raiseChips,
    } = state;

    /** True when the chosen size puts everything in. The label should say so. */
    const allIn = seated && raiseChips >= (round?.players?.[HUMAN_SEAT]?.committed ?? 0)
        + (round?.players?.[HUMAN_SEAT]?.stack ?? 0);

    /**
     * Whether the door will open.
     *
     * One number now instead of a rack to hunt through. The MAX button that
     * used to solve "how much can I play for" is gone with the rack: the room
     * answers that itself, and the button says so before the tap rather than
     * alerting after it.
     */
    const canAfford = cash >= buyIn && buyIn > 0;

    /**
     * This room's cloth, rail and card back. Derived from the room's accent
     * rather than typed out six times. See core/casino/roomPalette.ts.
     */
    const felt = feltFor(currentLocation.theme.primary, currentLocationId === VIP_LOCATION_ID);

    const tint = currentLocation.theme.primary;
    const seatCount = opponents.length;

    /**
     * What your own two cards made, once the hand is shown down.
     *
     * `HUMAN_SEAT` rather than the string 'you', so the seat the player sits
     * in is defined in one place. See core/casino/pokerRound.ts.
     */
    const yourId = round?.players?.[HUMAN_SEAT]?.id;
    const yourHand = round?.reveal?.find(r => r.id === yourId)?.rank.name;
    const youWon = !!yourId && !!round?.winners?.includes(yourId);

    return (
        <View style={styles.container}>
            <CasinoHeader
                onBack={() => navigation.goBack()}
                location={currentLocation}
                reputation={casinoReputation}
                cash={cash}
            />

            {/* --------------------------------------------------------------
                EVERYTHING BELOW THE HEADER

                A box of its own, because the result number positions itself
                from the top of whatever contains it and needs something that
                starts under the cash pill. Anchoring it at container level
                would mean knowing the header's height, which depends on the
                safe area inset - a number this screen has no business
                knowing.
               -------------------------------------------------------------- */}
            <View style={styles.stage}>
            <GameResultPopup result={resultPopup} onHide={actions.closePopup} />

            {/* --------------------------------------------------------------
                THE FELT SCROLLS. THE CONTROLS DO NOT.

                Reported as "the bet area and the play button are so far down
                that we have to move around in the game". FOLD, CALL and RAISE
                were at the bottom of a ScrollView below a table and your own
                hand, so on most phones the three buttons the hand depends on
                started below the fold - and a poker action you have to scroll
                to find is one you will not make in time.
               -------------------------------------------------------------- */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.status, { color: tint }]} numberOfLines={1}>
                    {translateCasinoStatus(status).toUpperCase()}
                </Text>

                {/* ---------------------------------------------------------
                    THE TABLE
                   --------------------------------------------------------- */}
                <PokerTable
                    width={TABLE_W}
                    height={TABLE_H}
                    tint={tint}
                    felt={felt}
                    potLabel={pot > 0 ? `POT ${money(pot)}` : undefined}
                >
                    {/* The five of them, on the arc. */}
                    {opponents.map((o, i) => {
                        const p = round?.players?.[i + 1];
                        const at = seatPosition(i, seatCount);
                        // ------------------------------------------------
                        //  WHOSE CARDS GO FACE UP
                        // ------------------------------------------------
                        //  `reveal` is exactly the players who were still in
                        //  when the last bet was called, which is exactly who
                        //  has to show. It is EMPTY when everybody else
                        //  folded - the engine already knows that a pot
                        //  nobody paid to see is a pot nobody shows their
                        //  cards for - so this needs no rule of its own.
                        //  See core/casino/pokerRound.ts -> finish.
                        // ------------------------------------------------
                        const shown = round?.reveal?.find(r => r.id === o.id);
                        return (
                            <View
                                key={o.id}
                                style={[
                                    styles.seat,
                                    {
                                        left: at.x * TABLE_W - SEAT_W / 2,
                                        top: at.y * TABLE_H - SEAT_H / 2,
                                    },
                                ]}
                            >
                                <PokerSeat
                                    id={o.id}
                                    name={o.name}
                                    kind={o.kind}
                                    company={o.company}
                                    // FROM THE SESSION, falling back to the
                                    // hand. Between hands there is no round at
                                    // all, and a table showing five stacks of
                                    // zero while everybody sits there with
                                    // chips is the old model showing through.
                                    stack={p?.stack ?? seats[i + 1]?.stack ?? 0}
                                    lastAction={p?.lastAction ?? null}
                                    lastAmount={p?.lastAmount ?? 0}
                                    active={!!round && !round.done && round.turn === i + 1}
                                    folded={!!p?.folded}
                                    tint={tint}
                                    hole={shown ? p?.hole : undefined}
                                    handName={shown?.rank.name}
                                    winner={!!round?.winners?.includes(o.id)}
                                    back={felt}
                                />
                            </View>
                        );
                    })}

                    {/* The board, in the middle of the felt. */}
                    <View style={styles.boardRow} pointerEvents="none">
                        {board.map((c, i) => (
                            <View key={`${c.rank}${c.suit}`} style={styles.boardCard}>
                                <AnimatedCard card={c} index={i} baseDelay={0} fromY={-60}
                  back={felt} />
                            </View>
                        ))}
                    </View>
                </PokerTable>

                {/* ---------------------------------------------------------
                    YOUR SEAT
                   --------------------------------------------------------- */}
                <View style={styles.you}>
                    <View style={styles.holeRow}>
                        {hole.map((c, i) => (
                            <AnimatedCard key={`${c.rank}${c.suit}`} card={c} index={i} fromY={-140} fromX={60}
                  back={felt} />
                        ))}
                    </View>
                    <Text style={styles.yourStack}>
                        {t('casino.you')} · {money(round?.players?.[0]?.stack ?? stack)}
                        {seated && hands > 0 && (
                            <Text style={styles.sessionUp}>
                                {'   '}{sessionUp >= 0 ? '+' : '-'}{money(Math.abs(sessionUp))}
                            </Text>
                        )}
                    </Text>

                    {/* ----------------------------------------------------
                        AND WHAT YOUR OWN CARDS MADE

                        Left out of the first version and it was the more
                        useful half: a player who cannot see that their two
                        pair lost to a flush has not been told anything by
                        being shown the flush. Named for both sides or it
                        teaches nobody.
                       ---------------------------------------------------- */}
                    {!!yourHand && (
                        <Text
                            style={[styles.yourHand, youWon && { color: tint }]}
                            numberOfLines={1}
                        >
                            {yourHand.toUpperCase()}
                        </Text>
                    )}
                </View>

            </ScrollView>

            {/* ---------------------------------------------------------
                CONTROLS, pinned above the nav bar.
               --------------------------------------------------------- */}
            <View style={styles.controlsDock}>
                <View style={styles.controls}>
                    {/* ------------------------------------------------------
                        BEFORE YOU SIT DOWN

                        The chips choose the STAKE, and the buy-in is a
                        hundred of them. This used to be the same control that
                        dealt a hand, which is how every hand became a new
                        buy-in and the table stopped being a table.

                        MAX picks the biggest stake the bankroll can cover.
                        Asked for by name, and it is also the honest answer to
                        "how much can I play for" - a question the player
                        should not have to solve by tapping chips until the
                        alert stops appearing.
                       ------------------------------------------------------ */}
                    {/* ------------------------------------------------------
                        THE DOOR PRICE

                        Asked for as "remove the bets in poker, set a buy-in
                        for each country and the VIP room, and enter by paying
                        it". The chip rack is gone.

                        It was borrowed from the other three games and never
                        fitted here. They are one-shot, so picking a stake is
                        the whole decision; poker is a session and the betting
                        happens inside the hand, so four chips outside the
                        table asked a question a poker door does not have. A
                        real room posts one number on the wall.

                        The number is the room's OWN share of your fortune, so
                        Athens costs half a per cent and the VIP room ten,
                        which is the figure that was asked for. No second
                        ladder to fall out of step. See data/casinoStakes.ts.
                       ------------------------------------------------------ */}
                    {!seated && (
                        <>
                            <View style={styles.doorCard}>
                                <Text style={styles.doorLabel}>{t('casino.buyInLabel')}</Text>
                                <Text style={[styles.doorPrice, { color: tint }]}>
                                    {money(buyIn)}
                                </Text>
                                <Text style={styles.doorMeta}>
                                    {t('casino.blindsAre', { v1: money(ante), v2: money(ante * 2) })}
                                </Text>
                            </View>
                            <Pressable
                                onPress={actions.sitDown}
                                disabled={!canAfford}
                                style={[
                                    styles.primary,
                                    { backgroundColor: tint },
                                    !canAfford && { opacity: 0.45 },
                                ]}
                            >
                                <Text style={styles.primaryText}>
                                    {canAfford ? t('casino.sitDown') : t('casino.notEnough')}
                                </Text>
                            </Pressable>
                        </>
                    )}

                    {/* ------------------------------------------------------
                        AT THE TABLE

                        Deal the next hand from the chips already in front of
                        you, or stand up and take them with you. Leaving is
                        the only thing that turns a stack into money, which is
                        what makes staying a decision.
                       ------------------------------------------------------ */}
                    {seated && (!round || handOver) && (
                        <View style={styles.tableRow}>
                            <Pressable
                                onPress={actions.leave}
                                style={({ pressed }) => [
                                    styles.leaveBtn,
                                    pressed && { opacity: 0.7 },
                                ]}
                            >
                                <Text style={styles.leaveText}>
                                    {t('casino.cashOut', { v1: money(stack) })}
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={actions.deal}
                                disabled={broke}
                                style={[
                                    styles.primary, styles.primaryFlex,
                                    { backgroundColor: tint },
                                    broke && { opacity: 0.45 },
                                ]}
                            >
                                <Text style={styles.primaryText}>
                                    {broke ? t('casino.outOfChips')
                                        : round ? t('casino.newDeal') : t('casino.deal')}
                                </Text>
                            </Pressable>
                        </View>
                    )}

                    {yourTurn && (
                        <>
                            {/* ----------------------------------------------
                                HOW MUCH, WHICH IS THE ACTUAL DECISION

                                Asked for as "the bets should show as
                                percentages, 5 10 20 25 with plus and minus,
                                like normal poker".

                                It was one button reading `Math.max(pot, ante
                                * 2)`: a single pot sized raise, take it or
                                leave it. Which removes the one thing poker is
                                about. Not whether to put money in, but how
                                much - a small raise and a shove are different
                                sentences and this could only say one of them.

                                A share of YOUR STACK rather than of the pot.
                                See core/casino/pokerStakes.ts for why: five
                                per cent of a pot is almost always under the
                                minimum raise, so two of the four buttons
                                would produce the same number.
                               ---------------------------------------------- */}
                            <View style={styles.sizeRow}>
                                <Pressable
                                    onPress={() => actions.nudgeRaisePct(-5)}
                                    style={({ pressed }) => [styles.nudge, pressed && { opacity: 0.6 }]}
                                >
                                    <Text style={styles.nudgeText}>-</Text>
                                </Pressable>

                                {raiseSteps.map(step => (
                                    <Pressable
                                        key={step}
                                        onPress={() => actions.setRaisePct(step)}
                                        style={[
                                            styles.sizeChip,
                                            raisePct === step && { borderColor: tint, backgroundColor: `${tint}22` },
                                        ]}
                                    >
                                        <Text style={[
                                            styles.sizeChipText,
                                            raisePct === step && { color: tint },
                                        ]}>
                                            {step}%
                                        </Text>
                                    </Pressable>
                                ))}

                                <Pressable
                                    onPress={() => actions.nudgeRaisePct(5)}
                                    style={({ pressed }) => [styles.nudge, pressed && { opacity: 0.6 }]}
                                >
                                    <Text style={styles.nudgeText}>+</Text>
                                </Pressable>
                            </View>

                            <View style={styles.actionRow}>
                                <Pressable
                                    onPress={() => actions.act('fold')}
                                    style={[styles.action, styles.actionQuiet]}
                                >
                                    <Text style={styles.actionText}>{t('casino.fold')}</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => actions.act(owed > 0 ? 'call' : 'check')}
                                    style={[styles.action, { borderColor: tint }]}
                                >
                                    <Text style={styles.actionText}>
                                        {owed > 0 ? `${t('casino.call')} ${money(owed)}` : t('casino.check')}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => actions.act('raise', raiseChips)}
                                    style={[styles.action, { backgroundColor: tint, borderColor: tint }]}
                                >
                                    {/* The SAME number the hook hands the engine.
                                        Computing it twice is how a button ends up
                                        lying about what it will do. */}
                                    <Text style={[styles.actionText, styles.actionTextStrong]}>
                                        {allIn ? t('casino.allIn') : `${t('casino.raise')} ${money(raiseChips)}`}
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    )}
                </View>
            </View>
            </View>
        </View>
    );
};

export default PokerGameScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1C242C' },

    /** Everything below the header, and what the result number measures from. */
    stage: { flex: 1 },
    scroll: { flex: 1 },
    /** The table scrolls; its bottom padding is the dock's business now. */
    content: { paddingBottom: 8, paddingHorizontal: 8 },
    /** FOLD, CALL and RAISE, where they cannot scroll away mid hand. */
    controlsDock: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: NAV_BAR_CLEARANCE,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#1C242C',
    },
    status: {
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginVertical: 8,
    },
    seat: { position: 'absolute', width: SEAT_W, alignItems: 'center' },
    boardRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: TABLE_H * 0.46,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 3,
        transform: [{ scale: 0.62 }],
    },
    boardCard: {},
    you: { alignItems: 'center', marginTop: 6, gap: 4 },
    holeRow: { flexDirection: 'row', gap: 6 },
    /**
     * Up or down since you sat down.
     *
     * MUTED, not green or red. The house rule keeps those for profit and loss
     * in the company, and a poker session running warm is not that. It sits
     * beside your stack because the two answer different questions: how many
     * chips you have, and whether any of them are yours.
     */
    sessionUp: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
    },
    /**
     * The number on the wall.
     *
     * One figure with the blinds it implies underneath, rather than a rack of
     * four chips. A poker room does not ask what you would like the stakes to
     * be; it tells you, and you decide whether to walk in.
     */
    doorCard: {
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: 2,
    },
    doorLabel: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    doorPrice: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 0.4,
    },
    doorMeta: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '700',
    },

    // ----------------------------------------------------------------------
    //  THE RAISE LADDER
    // ----------------------------------------------------------------------
    //  Four quick sizes and a nudge either side. Percentages of your own
    //  stack, which is what makes them always legal and always meaningful.
    // ----------------------------------------------------------------------
    sizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginBottom: 8,
    },
    sizeChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        minWidth: 46,
        alignItems: 'center',
    },
    sizeChipText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '800',
    },
    nudge: {
        width: 30,
        height: 30,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nudgeText: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '900',
        lineHeight: 18,
    },

    buyInRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    maxBtn: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    maxText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    tableRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    primaryFlex: { flex: 1 },
    leaveBtn: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    leaveText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '800',
    },
    /** What your cards made. Muted when you lost, the room's colour when you won. */
    yourHand: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    yourStack: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        fontWeight: '700',
    },
    controls: { marginTop: 12, gap: 10 },
    buyIn: {
        textAlign: 'center',
        color: theme.colors.textMuted,
        fontSize: 10.5,
    },
    primary: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    primaryText: {
        color: theme.colors.onLight,
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    actionRow: { flexDirection: 'row', gap: 8 },
    action: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    actionQuiet: { backgroundColor: 'rgba(255,255,255,0.05)' },
    actionText: {
        color: theme.colors.textPrimary,
        fontSize: 12,
        fontWeight: '800',
    },
    actionTextStrong: { color: theme.colors.onLight },
});
