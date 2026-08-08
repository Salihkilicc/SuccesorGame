import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import MemberInteractionModal from './MemberInteractionModal';
import { useStatsStore } from '../../../core/store';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { formatMoney, formatNumber } from '../../../core/utils';
import {
    CONTROL_THRESHOLD,
    MAJORITY_VOTE_THRESHOLDS,
    Proposal,
} from '../../../core/market/governance';

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
    visible: boolean;
    onClose: () => void;
    /** Bekleyen bir teklif varsa lobi ona gore hesaplanir */
    pendingProposal?: Proposal;
};

const BoardRoomModal = ({ visible, onClose, pendingProposal }: Props) => {
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
    const [tab, setTab] = useState<'board' | 'log'>('board');
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
            Alert.alert(t('board.noCommitment'), res.message);
            return;
        }
        if (!res.demands) {
            Alert.alert(t('board.supportSecured'), res.message);
            return;
        }

        const labels: Record<string, string> = {
            dividend_next: 'pay a dividend next quarter',
            board_seat: 'give them an extra board seat',
            no_dilution: 'issue no new shares',
            share_grant: 'grant them additional shares',
            reduce_debt: 'bring the debt down',
        };
        Alert.alert(
            `${name} wants something`,
            `${res.message}\n\nThey want you to ${labels[res.demands]}.\n\n` +
            t('board.breakPromise'),
            [
                { text: t('board.walkAway'), style: 'cancel' },
                {
                    text: t('board.giveMyWord'),
                    onPress: () => {
                        makePromise(memberId, res.demands!, 1, 0.8, labels[res.demands!]);
                        Alert.alert(t('board.committed'), `${name}`);
                    },
                },
            ],
        );
    };

    const moodColor =
        boardStance === 'Supportive' ? '#7B68D7'
            : boardStance === 'Neutral' ? 'rgba(255,255,255,0.48)'
                : boardStance === 'Restless' ? '#C734CA' : '#C734CA';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.container}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{t('board.title')}</Text>
                        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </Pressable>
                    </View>

                    {/* ---- KONTROL DURUMU: seyreltmenin bedeli burada gorunur ---- */}
                    <View style={styles.controlCard}>
                        <View style={styles.controlRow}>
                            <Text style={styles.controlLabel}>{t('board.yourStake')}</Text>
                            <Text style={[styles.controlValue, { color: hasControl ? '#7B68D7' : '#C734CA' }]}>
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

                    {/* ---- GUVENSIZLIK ERKEN UYARISI ---- */}
                    {noConfidenceLevel >= 2 && (
                        <View style={styles.dangerCard}>
                            <Text style={styles.dangerTitle}>
                                {noConfidenceLevel === 3
                                    ? `⛔ ${t('board.noConfidenceOnTable')}`
                                    : `⚠️ ${t('board.noConfidenceNear')}`}
                            </Text>
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

                    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 12 }}>
                        {tab === 'board' ? (
                            <>
                                {members.map(m => {
                                    const weight = totalShares > 0 ? (m.shareCount / totalShares) * 100 : 0;
                                    const promised = promises.filter(p => p.memberId === m.id && !p.resolved);
                                    const alreadyLobbied = lobbied[m.id] !== undefined;
                                    const trustColor =
                                        m.trust >= 60 ? '#7B68D7' : m.trust >= 35 ? '#C734CA' : '#C734CA';

                                    return (
                                        <View key={m.id} style={styles.memberCard}>
                                            <Pressable onPress={() => setOpenMemberId(m.id)}>
                                                <View style={styles.memberTop}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.memberName}>{m.name} ›</Text>
                                                        <Text style={styles.memberTrait}>
                                                            {t('data.trait.' + m.trait)} · {weight.toFixed(1)}% of the vote
                                                        </Text>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={[styles.memberTrust, { color: trustColor }]}>
                                                            {m.trust}
                                                        </Text>
                                                        {/* Trust and relationship are different things - show both. */}
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
                                                        { width: `${m.trust}%`, backgroundColor: trustColor },
                                                    ]}
                                                />
                                            </View>

                                            {promised.map(p => (
                                                <Text key={p.id} style={styles.promiseNote}>
                                                    🤝 You promised to {p.description}
                                                </Text>
                                            ))}

                                            {/* Two different conversations, so two
                                                buttons. Tapping the name alone was
                                                too easy to miss - the player pressed
                                                "speak privately" expecting the
                                                director's screen and got the lobby
                                                flow instead. */}
                                            <View style={styles.actionRow}>
                                                <Pressable
                                                    style={[styles.lobbyBtn, alreadyLobbied && styles.lobbyBtnDone]}
                                                    disabled={alreadyLobbied}
                                                    onPress={() => handleLobby(m.id, m.name)}
                                                >
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
                                                    { color: v.vote === 'YES' ? '#7B68D7' : '#C734CA' },
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
        </Modal>
    );
};

export default BoardRoomModal;

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    container: {
        width: '100%', maxWidth: 460, maxHeight: '85%',
        backgroundColor: '#020626', borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#07062E', alignItems: 'center', justifyContent: 'center' },
    closeText: { color: 'rgba(255,255,255,0.48)', fontSize: 16, fontWeight: '700' },

    controlCard: { backgroundColor: '#07062E', borderRadius: 12, padding: 14, marginBottom: 12 },
    controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    controlLabel: { fontSize: 12, color: 'rgba(255,255,255,0.48)', fontWeight: '600' },
    controlValue: { fontSize: 22, fontWeight: '800' },
    controlNote: { fontSize: 11, color: '#C734CA', lineHeight: 16, marginTop: 6 },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    moodValue: { fontSize: 13, fontWeight: '800' },

    demandCard: { backgroundColor: '#020626', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    demandTag: { fontSize: 10, color: '#C734CA', fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
    demandBody: { fontSize: 12, color: '#FFFFFF', lineHeight: 18, fontStyle: 'italic' },
    demandPrivate: { fontSize: 10, color: '#7B68D7', marginTop: 6, lineHeight: 15 },
    demandDue: { fontSize: 10, color: 'rgba(255,255,255,0.48)', marginTop: 6, fontWeight: '700' },

    dangerCard: { backgroundColor: '#020626', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    dangerTitle: { fontSize: 13, color: '#C734CA', fontWeight: '800', marginBottom: 4 },
    dangerBody: { fontSize: 11, color: '#C734CA', lineHeight: 16 },

    tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    tab: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#07062E', alignItems: 'center' },
    tabActive: { backgroundColor: '#6004BD' },
    tabText: { fontSize: 12, color: 'rgba(255,255,255,0.48)', fontWeight: '700' },
    tabTextActive: { color: '#FFFFFF' },

    body: { flexGrow: 0, flexShrink: 1 },

    memberCard: { backgroundColor: '#07062E', borderRadius: 12, padding: 14, marginBottom: 10 },
    memberTop: { flexDirection: 'row', alignItems: 'center' },
    memberName: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
    memberTrait: { fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 2 },
    memberRel: { fontSize: 9, color: '#7B68D7', marginTop: 2 },
    memberTrust: { fontSize: 20, fontWeight: '800' },
    trustBarBg: { height: 5, backgroundColor: '#020626', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
    trustBarFill: { height: '100%', borderRadius: 3 },
    promiseNote: { fontSize: 11, color: '#C734CA', marginTop: 8 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    openMemberBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#020626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    openMemberText: { color: '#C734CA', fontSize: 12, fontWeight: '700' },
    lobbyBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#020626', alignItems: 'center' },
    lobbyBtnDone: { opacity: 0.4 },
    lobbyText: { fontSize: 12, color: '#C734CA', fontWeight: '700' },

    floatCard: { backgroundColor: '#020626', borderRadius: 12, padding: 14, marginTop: 4 },
    floatTitle: { fontSize: 13, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 },
    floatBody: { fontSize: 11, color: 'rgba(255,255,255,0.48)', lineHeight: 16 },

    voteCard: { backgroundColor: '#07062E', borderRadius: 12, padding: 14, marginBottom: 12 },
    voteTitle: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
    voteSummary: { fontSize: 12, color: '#C734CA', marginTop: 4, marginBottom: 10 },
    voteRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
    voteMark: { fontSize: 16, fontWeight: '800', width: 18 },
    voteName: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
    voteReason: { fontSize: 11, color: 'rgba(255,255,255,0.48)' },

    logRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    logLabel: { fontSize: 12, color: '#FFFFFF' },
    logEffect: { fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 2 },
    emptyLog: { fontSize: 12, color: 'rgba(255,255,255,0.48)', textAlign: 'center', paddingVertical: 24 },
});
