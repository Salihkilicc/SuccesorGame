import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import MemberInteractionModal from './MemberInteractionModal';
import { useStatsStore, useGameStore } from '../../../core/store';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { formatMoney, formatNumber } from '../../../core/utils';
import { theme } from '../../../core/theme';
import ConfirmPanel, { type ConfirmLine } from '../../common/ConfirmPanel';
import ScreenHost from '../../common/ScreenHost';
import ScreenHeader from '../../common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import {
    CONTROL_THRESHOLD,
    MAJORITY_VOTE_THRESHOLDS,
    FOUNDER_GRACE_PERIOD_MONTHS,
    Proposal,
} from '../../../core/market/governance';

export const TRAIT_VISUALS: Record<string, { icon: string; color: string }> = {
    Shark: { icon: 'shark', color: '#F87171' },
    Visionary: { icon: 'lightbulb-on-outline', color: '#A78BFA' },
    Bureaucrat: { icon: 'file-document-outline', color: '#94A3B8' },
    OldMoney: { icon: 'bank-outline', color: '#FBBF24' },
    Technocrat: { icon: 'chip', color: '#38BDF8' },
    Opportunist: { icon: 'handshake-outline', color: '#34D399' },
};

export const getTraitVisual = (trait: string) => TRAIT_VISUALS[trait] || { icon: 'account-tie-outline', color: '#60A5FA' };

/**
 * ============================================================================
 *  KURUL ODASI — 1:1 lobi, söz verme ve oy sayımı
 * ============================================================================
 *
 *  NEDEN YENI BIR EKRAN: mevcut kurul ekranlari yalnizca BILGI
 *  gosteriyordu. `BoardMembersModal` uyeleri listeliyor, "Call Emergency
 *  Vote" dugmesi `console.log` yapiyordu. `VotingOverlay.tsx` yazilmis
 *  ama hicbir yerden cagrilmamisti.
 *
 *  Burasi kurulun KARAR verdigi yer. Uc sey yapabilirsin:
 *
 *   1) Kimin ne kadar oy agirligi oldugunu gormek. Kurul kisi basi
 *      degil HISSE AGIRLIKLI oy verir; bu ekran bunu acikca gosterir
 *      cunku oyuncunun seyreltmenin bedelini gormesi gerekiyor.
 *
 *   2) Bir uyeyle 1:1 konusup destegini istemek (lobi). Ceyrekte bir
 *      kez, ve basarisiz denemeler de sayilir.
 *
 *   3) Destek karsiliginda SOZ vermek. Soz kayda gecer; tutmazsan
 *      guven huyundan BAGIMSIZ olarak coker.
 * ============================================================================
 */

type Props = {
    /** Render as a route rather than a popup - see components/common/ScreenHost. */
    asScreen?: boolean;
    visible: boolean;
    onClose: () => void;
    /** Bekleyen bir teklif varsa lobi ona gore hesaplanir */
    pendingProposal?: Proposal;
};

const BoardRoomModal = ({ visible, onClose, pendingProposal, asScreen }: Props) => {
    // Dil degisince yeniden ciz. Bu satir olmadan ekran eski dilde donar.
    useLocale();
    const {
        members,
        playerShareCount,
        totalShares,
        boardStance,
        lobbied,
        promises,
        lastVote,
        noConfidenceLevel,
        boardLog,
        boardDemands,
        lobby,
        makePromise,
        getPlayerOwnershipPercent,
    } = useShareholderStore();

    const companyValue = useStatsStore(s => s.companyValue);
    const currentMonth = useGameStore(s => s.currentMonth);
    const inGracePeriod = (currentMonth || 1) <= FOUNDER_GRACE_PERIOD_MONTHS;

    const [tab, setTab] = useState<'board' | 'log'>('board');
    const [panel, setPanel] = useState<null | {
        title: string;
        summary?: string;
        lines?: ConfirmLine[];
        note?: string;
        confirmLabel: string;
        cancelLabel?: string;
        onConfirm?: () => void;
        tone?: 'default' | 'danger';
    }>(null);

    // ------------------------------------------------------------------
    //  THE MEMBER SCREEN WAS UNREACHABLE
    // ------------------------------------------------------------------
    //  MemberInteractionModal - gifts, private dinners, buyout offers - was
    //  referenced from NOWHERE in the app. The gesture system behind it was
    //  written and wired to the store, and the player still could not open
    //  it. Same class of bug as per-category brand: built, never surfaced.
    //
    //  Tapping a director now opens it.
    // ------------------------------------------------------------------
    const [openMemberId, setOpenMemberId] = useState<string | null>(null);

    const ownership = getPlayerOwnershipPercent();
    const hasControl = ownership >= CONTROL_THRESHOLD;
    const insiderShares = members.reduce((s, m) => s + m.shareCount, 0);
    const floatShares = Math.max(0, totalShares - playerShareCount - insiderShares);

    // Lobi icin bir teklif gerekiyor; yoksa genel bir "destek" teklifi.
    const proposal: Proposal = pendingProposal ?? {
        kind: 'acquisition',
        amount: companyValue * 0.3,
        valuation: companyValue,
        title: t('equity.aMajorMoveNextQuarter'),
    };

    const handleLobby = (memberId: string, name: string) => {
        const res = lobby(memberId, proposal);
        if (!res.success) {
            setPanel({ title: t('board.noCommitment'), summary: res.message, confirmLabel: 'OK', tone: 'danger' });
            return;
        }
        if (!res.demands) {
            setPanel({ title: t('board.supportSecured'), summary: res.message, confirmLabel: 'OK' });
            return;
        }

        const labels: Record<string, string> = {
            dividend_next: 'pay a dividend next quarter',
            board_seat: 'give them an extra board seat',
            no_dilution: 'issue no new shares',
            share_grant: 'grant them additional shares',
            reduce_debt: 'bring the debt down',
        };
        setPanel({
            title: `${name} wants something`,
            summary: res.message,
            lines: [{ label: 'They want you to', value: labels[res.demands], strong: true }],
            note: t('board.breakPromise'),
            cancelLabel: t('board.walkAway'),
            confirmLabel: t('board.giveMyWord'),
            onConfirm: () => {
                makePromise(memberId, res.demands!, 1, 0.8, labels[res.demands!]);
                setPanel({ title: t('board.committed'), summary: name, confirmLabel: 'OK' });
            },
        });
    };

    const moodColor =
        boardStance === 'Supportive' ? theme.colors.textPrimary
            : boardStance === 'Neutral' ? theme.colors.textMuted
                : theme.colors.warning;

    return (
        <ScreenHost asScreen={asScreen} visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            {/* As a SCREEN there is no backdrop to dim and nothing to tap
                outside of - and the card must not stay a card. Left as-is it
                rendered a 460px box capped at 85% height, centred, rounded and
                bordered, which is what looked cramped and misshapen. */}
            <View style={[styles.backdrop, asScreen && styles.backdropScreen]}>
                {!asScreen && <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />}
                <View style={[styles.container, asScreen && styles.containerScreen]}>
                    <ScreenHeader inset={!!asScreen} title={t('board.title')} onBack={onClose} />

                    {/* ------------------------------------------------------
                        WHY THIS WAS CRAMPED, AND IT WAS TWO THINGS

                        1) NO SIDE PADDING. As a modal the card carried
                           `padding: 20`; as a screen that had to go, because
                           the header runs edge to edge - and nothing replaced
                           it for the body. So every card below sat flush
                           against both edges with the text touching the glass.
                           The padding lives on the scroll content now, which
                           is the only thing that wants it.

                        2) HALF THE SCREEN WAS FIXED. The stake card, the open
                           demands, the no-confidence warning and the tabs all
                           sat ABOVE the ScrollView, and the list was
                           `flexShrink: 1` underneath them. With a demand and a
                           warning on screen the directors were squeezed into
                           whatever was left - the more the board had to say,
                           the less room there was to answer it. It all scrolls
                           together now.
                       ------------------------------------------------------ */}
                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={[
                            styles.bodyContent,
                            { paddingBottom: asScreen ? NAV_BAR_CLEARANCE : theme.spacing.lg },
                        ]}>

                    {/* ---- KONTROL DURUMU: seyreltmenin bedeli burada gorunur ---- */}
                    <View style={styles.controlCard}>
                        <View style={styles.controlRow}>
                            <Text style={styles.controlLabel}>{t('board.yourStake')}</Text>
                            {/* Above the threshold is blue. Below it the board
                                can remove you, which ends the run - the widest
                                case of "this is costing you", so it is red. */}
                            <Text style={[styles.controlValue, {
                                color: hasControl ? theme.colors.up : theme.colors.negative,
                            }]}>
                                {ownership.toFixed(1)}%
                            </Text>
                        </View>
                        <Text style={styles.controlNote}>
                            {hasControl
                                ? t('board.aboveMajority', {
                                    threshold: CONTROL_THRESHOLD,
                                    acq: (MAJORITY_VOTE_THRESHOLDS.acquisition! * 100).toFixed(0),
                                    debt: (MAJORITY_VOTE_THRESHOLDS.debt! * 100).toFixed(0),
                                })
                                : t('board.belowMajority', { threshold: CONTROL_THRESHOLD })}
                        </Text>
                        <View style={styles.moodRow}>
                            <Text style={styles.controlLabel}>{t('board.mood')}</Text>
                            <Text style={[styles.moodValue, { color: moodColor }]}>{t(`board.stance.${boardStance}`)}</Text>
                        </View>
                    </View>

                    {/* ------------------------------------------------
                        AÇIK TALEP — kurulun SENDEN istedigi sey.
                        ------------------------------------------------
                        Bu kart, kurul masasini bir tabela olmaktan
                        cikarip karsina birini oturtan sey. Cevap
                        vermezsen guven kaybedersin.
                       ------------------------------------------------ */}
                    {(boardDemands || []).filter(d => d.status === 'open').map(d => (
                        <View key={d.id} style={styles.demandCard}>
                            <Text style={styles.demandTag}>
                                {(d.confidential ? t('board.demandPrivate') : t('board.demandOpen')).toUpperCase()}
                            </Text>
                            <Text style={styles.demandBody}>
                                {t(`board.demand_${d.kind}`, { v1: d.raisedByName })}
                            </Text>
                            {d.confidential && (
                                <Text style={styles.demandPrivate}>
                                    {t('board.demandConfidential', { v1: d.raisedByName })}
                                </Text>
                            )}
                            <Text style={styles.demandDue}>{t('board.demandDue', { v1: d.deadline })}</Text>
                        </View>
                    ))}

                    {/* ---- GUVENSIZLIK ERKEN UYARISI / KURUCU KORUMASI ---- */}
                    {inGracePeriod ? (
                        <View style={[styles.dangerCard, { borderColor: theme.colors.highlight, backgroundColor: 'rgba(125,211,252,0.08)' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <MaterialCommunityIcons name="shield-check-outline" size={18} color={theme.colors.highlight} />
                                <Text style={[styles.dangerTitle, { color: theme.colors.highlight, marginBottom: 0 }]}>
                                    {t('board.inGracePeriod')}
                                </Text>
                            </View>
                            <Text style={styles.dangerBody}>
                                {t('board.removalNeeds', {
                                    threshold: CONTROL_THRESHOLD,
                                    met: noConfidenceLevel,
                                })}
                            </Text>
                        </View>
                    ) : noConfidenceLevel >= 2 && (
                        <View style={styles.dangerCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <MaterialCommunityIcons
                                    name={noConfidenceLevel === 3 ? "alert-decagram-outline" : "alert-outline"}
                                    size={18}
                                    color={noConfidenceLevel === 3 ? theme.colors.negative : theme.colors.warning}
                                />
                                <Text style={[styles.dangerTitle, { marginBottom: 0 }]}>
                                    {noConfidenceLevel === 3
                                        ? t('board.noConfidenceOnTable')
                                        : t('board.noConfidenceNear')}
                                </Text>
                            </View>
                            <Text style={styles.dangerBody}>
                                {t('board.removalNeeds', {
                                    threshold: CONTROL_THRESHOLD,
                                    met: noConfidenceLevel,
                                })}
                            </Text>
                        </View>
                    )}

                    <View style={styles.tabs}>
                        {(['board', 'log'] as const).map(tabKey => (
                            <Pressable
                                key={tabKey}
                                style={[styles.tab, tab === tabKey && styles.tabActive]}
                                onPress={() => setTab(tabKey)}
                            >
                                <Text style={[styles.tabText, tab === tabKey && styles.tabTextActive]}>
                                    {tabKey === 'board' ? t('board.directors') : t('board.whatTheySaw')}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                        {tab === 'board' ? (
                            <>
                                {members.map(m => {
                                    const weight = totalShares > 0 ? (m.shareCount / totalShares) * 100 : 0;
                                    const promised = promises.filter(p => p.memberId === m.id && !p.resolved);
                                    const alreadyLobbied = lobbied[m.id] !== undefined;
                                    const traitVisual = getTraitVisual(m.trait);
                                    const trustColor =
                                        m.trust >= 60 ? theme.colors.up
                                            : m.trust >= 35 ? theme.colors.textSecondary
                                                : theme.colors.down;
                                    const trustFill =
                                        m.trust >= 60 ? theme.colors.primary
                                            : m.trust >= 35 ? theme.colors.borderStrong
                                                : theme.colors.disabled;

                                    return (
                                        <View key={m.id} style={styles.memberCard}>
                                            <Pressable onPress={() => setOpenMemberId(m.id)}>
                                                <View style={styles.memberTop}>
                                                    <View style={[styles.traitBadge, { backgroundColor: `${traitVisual.color}15`, borderColor: `${traitVisual.color}35` }]}>
                                                        <MaterialCommunityIcons name={traitVisual.icon} size={20} color={traitVisual.color} />
                                                    </View>
                                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                                        <Text style={styles.memberName}>{m.name} ›</Text>
                                                        <Text style={styles.memberTrait}>
                                                            {t('data.trait.' + m.trait)} · {weight.toFixed(1)}% of the vote
                                                        </Text>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={[styles.memberTrust, { color: trustColor }]}>
                                                            {m.trust}
                                                        </Text>
                                                        <Text style={styles.memberRel}>
                                                            {t('board.relShort', { v1: String(Math.round(m.relationship ?? 50)) })}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </Pressable>

                                            <View style={styles.trustBarBg}>
                                                <View
                                                    style={[
                                                        styles.trustBarFill,
                                                        { width: `${m.trust}%`, backgroundColor: trustFill },
                                                    ]}
                                                />
                                            </View>

                                            {promised.map(p => (
                                                <View key={p.id} style={styles.promiseBox}>
                                                    <MaterialCommunityIcons name="handshake-outline" size={14} color="#FBBF24" style={{ marginRight: 6 }} />
                                                    <Text style={styles.promiseNote}>
                                                        You promised to {p.description}
                                                    </Text>
                                                </View>
                                            ))}

                                            <View style={styles.actionRow}>
                                                <Pressable
                                                    style={[styles.lobbyBtn, alreadyLobbied && styles.lobbyBtnDone]}
                                                    disabled={alreadyLobbied}
                                                    onPress={() => handleLobby(m.id, m.name)}
                                                >
                                                    <MaterialCommunityIcons
                                                        name={alreadyLobbied ? 'check' : 'message-lock-outline'}
                                                        size={14}
                                                        color={alreadyLobbied ? 'rgba(255,255,255,0.48)' : '#FFFFFF'}
                                                        style={{ marginRight: 4 }}
                                                    />
                                                    <Text style={styles.lobbyText}>
                                                        {alreadyLobbied
                                                            ? t('board.spokenAlready')
                                                            : t('board.speakPrivately')}
                                                    </Text>
                                                </Pressable>
                                                <Pressable
                                                    style={styles.openMemberBtn}
                                                    onPress={() => setOpenMemberId(m.id)}
                                                >
                                                    <MaterialCommunityIcons name="card-account-details-outline" size={14} color={theme.colors.textPrimary} style={{ marginRight: 4 }} />
                                                    <Text style={styles.openMemberText}>
                                                        {t('board.openMember')}
                                                    </Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    );
                                })}

                                <View style={styles.floatCard}>
                                    <Text style={styles.floatTitle}>
                                        {t('board.publicFloat', { shares: formatNumber(floatShares) })}
                                    </Text>
                                    <Text style={styles.floatBody}>
                                        {t('board.floatNote')}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <>
                                {!!lastVote && (
                                    <View style={styles.voteCard}>
                                        <Text style={styles.voteTitle}>{lastVote.title}</Text>
                                        <Text style={styles.voteSummary}>{lastVote.summary}</Text>
                                        {lastVote.votes.map(v => (
                                            <View key={v.memberId} style={styles.voteRow}>
                                                <Text style={[
                                                    styles.voteMark,
                                                    { color: v.vote === 'YES' ? theme.colors.up : theme.colors.down },
                                                ]}>
                                                    {v.vote === 'YES' ? '✓' : '✕'}
                                                </Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.voteName}>{v.name}</Text>
                                                    <Text style={styles.voteReason}>{v.reason}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {boardLog.length === 0 ? (
                                    <Text style={styles.emptyLog}>
                                        {t('board.nothingSeen')}
                                    </Text>
                                ) : (
                                    boardLog.map((l, i) => (
                                        <View key={i} style={styles.logRow}>
                                            <Text style={styles.logLabel}>{l.label}</Text>
                                            {!!l.effect && <Text style={styles.logEffect}>{l.effect}</Text>}
                                        </View>
                                    ))
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* Director detail — gifts, dinners, buyout */}
            <MemberInteractionModal
                visible={!!openMemberId}
                memberId={openMemberId || ''}
                onClose={() => setOpenMemberId(null)}
            />
        
            <ConfirmPanel
                visible={!!panel}
                title={panel?.title || ''}
                summary={panel?.summary}
                lines={panel?.lines}
                note={panel?.note}
                tone={panel?.tone}
                confirmLabel={panel?.confirmLabel || 'OK'}
                cancelLabel={panel?.cancelLabel}
                onConfirm={panel?.onConfirm}
                onCancel={() => setPanel(null)}
            />
        </ScreenHost>
    );
};

export default BoardRoomModal;

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(28,36,44,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    backdropScreen: { backgroundColor: theme.colors.background, padding: 0, justifyContent: 'flex-start' },
    container: {
        width: '100%', maxWidth: 460, maxHeight: '85%',
        backgroundColor: theme.colors.background, borderRadius: 20,
        // No padding: the header must reach both edges. The scroll content
        // below carries it instead - see bodyContent.
        padding: 0, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    containerScreen: {
        flex: 1, maxWidth: undefined, maxHeight: undefined,
        borderRadius: 0, borderWidth: 0, padding: 0,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#323A40', alignItems: 'center', justifyContent: 'center' },
    closeText: { color: 'rgba(255,255,255,0.48)', fontSize: 16, fontWeight: '700' },

    controlCard: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, marginBottom: 12 },
    controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    controlLabel: { fontSize: 12, color: 'rgba(255,255,255,0.48)', fontWeight: '600' },
    controlValue: { fontSize: 22, fontWeight: '800' },
    controlNote: { fontSize: 11, color: theme.colors.textMuted, lineHeight: 16, marginTop: 6 },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    moodValue: { fontSize: 13, fontWeight: '800' },

    demandCard: { backgroundColor: '#434B50', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    demandTag: { fontSize: 10, color: theme.colors.textPrimary, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
    demandBody: { fontSize: 12, color: '#FFFFFF', lineHeight: 18, fontStyle: 'italic' },
    demandPrivate: { fontSize: 10, color: '#FFFFFF', marginTop: 6, lineHeight: 15 },
    demandDue: { fontSize: 10, color: 'rgba(255,255,255,0.48)', marginTop: 6, fontWeight: '700' },

    dangerCard: { backgroundColor: '#434B50', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    dangerTitle: { fontSize: 13, color: theme.colors.warning, fontWeight: '800', marginBottom: 4 },
    dangerBody: { fontSize: 11, color: theme.colors.warning, lineHeight: 16 },

    tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    tab: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: theme.colors.surface, alignItems: 'center' },
    tabActive: { backgroundColor: theme.colors.primary },
    tabText: { fontSize: 12, color: 'rgba(255,255,255,0.48)', fontWeight: '700' },
    tabTextActive: { color: theme.colors.onLight},

    /**
     * The whole page scrolls, so the list gets the screen rather than the
     * leftovers. `flexShrink: 1` under four fixed cards was the cramping.
     */
    body: { flex: 1 },
    bodyContent: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },

    memberCard: { backgroundColor: '#323A40', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    memberTop: { flexDirection: 'row', alignItems: 'center' },
    traitBadge: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    memberName: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
    memberTrait: { fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 2 },
    memberRel: { fontSize: 9, color: '#FFFFFF', marginTop: 2 },
    memberTrust: { fontSize: 20, fontWeight: '800' },
    trustBarBg: { height: 5, backgroundColor: '#434B50', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
    trustBarFill: { height: '100%', borderRadius: 3 },
    promiseBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.08)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 8,
    },
    promiseNote: { fontSize: 11, color: '#FBBF24', fontWeight: '500', flex: 1 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    openMemberBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#434B50',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    openMemberText: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '700' },
    lobbyBtn: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lobbyBtnDone: { opacity: 0.4 },
    lobbyText: { fontSize: 12, color: theme.colors.textPrimary, fontWeight: '700' },

    floatCard: { backgroundColor: '#434B50', borderRadius: 12, padding: 14, marginTop: 4 },
    floatTitle: { fontSize: 13, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 },
    floatBody: { fontSize: 11, color: 'rgba(255,255,255,0.48)', lineHeight: 16 },

    voteCard: { backgroundColor: '#323A40', borderRadius: 12, padding: 14, marginBottom: 12 },
    voteTitle: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
    voteSummary: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, marginBottom: 10 },
    voteRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
    voteMark: { fontSize: 16, fontWeight: '800', width: 18 },
    voteName: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
    voteReason: { fontSize: 11, color: 'rgba(255,255,255,0.48)' },

    logRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    logLabel: { fontSize: 12, color: '#FFFFFF' },
    logEffect: { fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 2 },
    emptyLog: { fontSize: 12, color: 'rgba(255,255,255,0.48)', textAlign: 'center', paddingVertical: 24 },
});
