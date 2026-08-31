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
import PokerSeat from '../components/PokerSeat';
import { CustomChipSelector } from '../components/CustomChipSelector';
import { useCasinoSystem } from '../hooks/useCasinoSystem';
import { useSixHandedPoker, STARTING_STACK_MULTIPLE } from '../logic/useSixHandedPoker';
import { chipsFor } from '../data/casinoStakes';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { translateCasinoStatus } from '../../../data/i18n/casinoText';
import { VIP_LOCATION_ID } from '../data/vipRoom';

const TABLE_W = Dimensions.get('window').width - 16;
const TABLE_H = 300;
/** How wide a seat is, so it can be centred on its point. */
const SEAT_W = 86;
const SEAT_H = 96;

const money = (n: number): string => {
    const v = Math.max(0, n || 0);
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

    const { state, actions } = useSixHandedPoker(
        route.params?.betAmount ?? 1_000_000,
        currentLocationId === VIP_LOCATION_ID,
    );
    const {
        money: cash, ante, round, opponents, status, resultPopup,
        board, hole, pot, owed, yourTurn, handOver,
    } = state;

    const tint = currentLocation.theme.primary;
    const seatCount = opponents.length;

    return (
        <View style={styles.container}>
            <CasinoHeader
                onBack={() => navigation.goBack()}
                location={currentLocation}
                reputation={casinoReputation}
                cash={cash}
            />

            <GameResultPopup result={resultPopup} onHide={actions.closePopup} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                    potLabel={pot > 0 ? `POT ${money(pot)}` : undefined}
                >
                    {/* The five of them, on the arc. */}
                    {opponents.map((o, i) => {
                        const p = round?.players?.[i + 1];
                        const at = seatPosition(i, seatCount);
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
                                    stack={p?.stack ?? 0}
                                    lastAction={p?.lastAction ?? null}
                                    lastAmount={p?.lastAmount ?? 0}
                                    active={!!round && !round.done && round.turn === i + 1}
                                    folded={!!p?.folded}
                                    tint={tint}
                                />
                            </View>
                        );
                    })}

                    {/* The board, in the middle of the felt. */}
                    <View style={styles.boardRow} pointerEvents="none">
                        {board.map((c, i) => (
                            <View key={`${c.rank}${c.suit}`} style={styles.boardCard}>
                                <AnimatedCard card={c} index={i} baseDelay={0} fromY={-60} />
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
                            <AnimatedCard key={`${c.rank}${c.suit}`} card={c} index={i} fromY={-140} fromX={60} />
                        ))}
                    </View>
                    <Text style={styles.yourStack}>
                        {t('casino.you')} · {money(round?.players?.[0]?.stack ?? 0)}
                    </Text>
                </View>

                {/* ---------------------------------------------------------
                    CONTROLS
                   --------------------------------------------------------- */}
                <View style={styles.controls}>
                    {(!round || handOver) && (
                        <>
                            <CustomChipSelector
                                chips={chipsFor(currentLocation, cash)}
                                selectedChip={ante}
                                onSelect={actions.setAnte}
                                gameTheme={currentLocation.theme}
                            />
                            <Text style={styles.buyIn}>
                                {t('casino.buyIn', { v1: money(ante * STARTING_STACK_MULTIPLE) })}
                            </Text>
                            <Pressable
                                onPress={actions.deal}
                                style={[styles.primary, { backgroundColor: tint }]}
                            >
                                <Text style={styles.primaryText}>
                                    {handOver ? t('casino.newDeal') : t('casino.deal')}
                                </Text>
                            </Pressable>
                        </>
                    )}

                    {yourTurn && (
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
                                onPress={() => actions.act('raise', Math.max(pot, ante * 2))}
                                style={[styles.action, { backgroundColor: tint, borderColor: tint }]}
                            >
                                <Text style={[styles.actionText, styles.actionTextStrong]}>
                                    {t('casino.raise')} {money(Math.max(pot, ante * 2))}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default PokerGameScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1C242C' },
    content: { paddingBottom: NAV_BAR_CLEARANCE + 20, paddingHorizontal: 8 },
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
