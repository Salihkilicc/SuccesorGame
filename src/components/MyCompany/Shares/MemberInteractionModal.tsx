// src/components/MyCompany/Shares/MemberInteractionModal.tsx
//
// ============================================================================
//  ONE DIRECTOR, AND EVERYTHING YOU CAN DO ABOUT THEM
// ============================================================================
//
//  WHAT WAS WRONG. This existed and the board room ALSO carried, inside every
//  row of its list: a trust bar, the promises you had made to that person, a
//  "Speak privately" button and a button to open this. So a board of six read
//  as six stacked dashboards, and the things you could do about one person
//  were split across two places with no rule for which was where.
//
//  Reported as "her seyi bu board memberin kendi ekraninda toplayalim, her
//  seyi oradan yapalim" and "ekrandaki seyler cok buyuk duzensiz duruyor".
//
//  So the list is a list now - name, trait, weight, trust, one tap - and this
//  is the page. Lobbying, gifts, dinner, the buyout, the promises you owe
//  them: all of it here, none of it there.
//
//  ---------------------------------------------------------------------------
//  AND IT IS A ROUTE
//  ---------------------------------------------------------------------------
//  `asScreen` for the same reason the company sections became routes: an RN
//  Modal draws above the nav bar, and a modal comes up from the bottom while
//  every other detail page in the game slides in from the right. See
//  components/common/ScreenHost.tsx.
// ============================================================================

import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Portrait from '../../common/Portrait';
import { faceFor } from '../../../core/portraits/faces';
import ScreenHost from '../../common/ScreenHost';
import ScreenHeader from '../../common/ScreenHeader';
import { theme } from '../../../core/theme';
import { giftEffect } from '../../../core/market/governance';
import { acceptanceChance, MAX_ASK_PREMIUM } from '../../../core/market/buyout';
import {
    quoteAllBuyoutRoutes,
    BUYOUT_ROUTE_LABELS,
    BUYOUT_ROUTE_EXPLANATIONS,
    type BuyoutRoute,
} from '../../../core/market/buyoutFinancing';

import { useShareholderStore, type BoardMember } from '../../../features/shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store';
import { formatMoney, formatNumber } from '../../../core/utils';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import ConfirmPanel, { type ConfirmLine } from '../../common/ConfirmPanel';
import { getTraitVisual } from './BoardRoomModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    memberId: string;
    /** Render as a route rather than a popup - see components/common/ScreenHost. */
    asScreen?: boolean;
}

/** One icon per route, here rather than in the data: these are three fixed things. */
const ROUTE_ICON: Record<BuyoutRoute, string> = {
    cash: 'wallet-outline',
    treasury: 'bank-outline',
    leveraged: 'scale-unbalanced',
};

type TabType = 'LOBBYING' | 'BUYOUT';

const MemberInteractionModal = ({ visible, onClose, memberId, asScreen }: Props) => {
    useLocale();
    const { members, calculateBuyoutPrice, offerGesture, negotiateSharePurchase } = useShareholderStore();
    const { money, companySharePrice, update: updateStats } = useStatsStore();

    // ----------------------------------------------------------------------
    //  EVERY HOOK RUNS BEFORE THE EARLY RETURN
    // ----------------------------------------------------------------------
    //  These two store selectors were added below `if (!member) return null`,
    //  which crashed the moment the screen was opened:
    //    "Rendered more hooks than during the previous render."
    //  With the modal closed memberId is '' so member is undefined and the
    //  component bailed out after 4 hooks; opening it ran 6. React counts
    //  hooks per render and refuses the mismatch.
    //
    //  This is the same mistake that was just fixed in ProductModals. The
    //  rule for this file: no early return above this line.
    // ----------------------------------------------------------------------
    const [activeTab, setActiveTab] = useState<TabType>('LOBBYING');
    // Every confirmation on this screen is one piece of state. Declared with
    // the other hooks, ABOVE the early return - see the note above.
    const [panel, setPanel] = useState<null | {
        title: string;
        summary?: string;
        lines?: ConfirmLine[];
        note?: string;
        confirmLabel: string;
        onConfirm?: () => void;
        tone?: 'default' | 'danger';
    }>(null);
    const [offerPremium, setOfferPremium] = useState(0); // Percentage premium (-20 to +100)
    // Who pays. Declared with the other hooks, ABOVE the early return.
    const [route, setRoute] = useState<BuyoutRoute>('cash');
    // ------------------------------------------------------------------
    //  SPEAKING TO THEM PRIVATELY IS A THING YOU DO ABOUT A PERSON
    // ------------------------------------------------------------------
    //  It lived in the board room list, one button per row, next to a second
    //  button whose only job was to open this page. Two buttons on every row
    //  of a list of six is what made the board read as a stack of dashboards.
    //  See the header.
    //
    //  Declared with the other hooks, ABOVE the early return - the rule at
    //  the top of this component, and the one scripts/reachability.js has a
    //  check for.
    // ------------------------------------------------------------------
    const lobby = useShareholderStore(st => st.lobby);
    const makePromise = useShareholderStore(st => st.makePromise);
    const lobbied = useShareholderStore(st => st.lobbied);
    const promises = useShareholderStore(st => st.promises);
    const companyValue = useStatsStore(st => st.companyValue);
    // The two figures the company routes are paid out of, and the count the
    // player actually holds. Hooks, so above the early return like the rest.
    const companyCapital = useStatsStore(st => st.companyCapital);
    const companyDebtTotal = useStatsStore(st => st.companyDebtTotal);
    const playerShareCount = useShareholderStore(st => st.playerShareCount);
    const totalShares = useShareholderStore(st => st.totalShares);
    const playerPercent = useShareholderStore(st =>
        st.totalShares > 0 ? (st.playerShareCount / st.totalShares) * 100 : 0,
    );

    const member = members.find((m) => m.id === memberId);

    // Safe from here on: no hooks below this point.
    if (!member) {
        return null;
    }

    const memberPercent = totalShares > 0 ? (member.shareCount / totalShares) * 100 : 0;

    // ----------------------------------------------------------------------
    //  SHOW WHAT THIS GESTURE WILL ACTUALLY DO, FOR THIS PERSON
    // ----------------------------------------------------------------------
    //  The buttons carried fixed labels reading "+5 Trust" and "+15 Trust".
    //  Both were wrong twice over: gestures move RELATIONSHIP, not trust, and
    //  the amount depends entirely on who you are dealing with - dinner is +18
    //  for Elena and +5 for Marcus, and a cash gift is -5 for Elena. A player
    //  who took Marcus to dinner expecting +18 reasonably concluded it was
    //  broken.
    //
    //  The preview runs the same function the action does, so the label cannot
    //  drift from the behaviour.
    // ----------------------------------------------------------------------
    const govSelf = {
        id: member.id, name: member.name, trait: member.trait as any,
        trust: member.trust, shareCount: member.shareCount,
        relationship: member.relationship ?? 50, motivation: member.motivation,
    };
    const giftPreview = giftEffect(govSelf, 'money', 1, member.gestureCount ?? 0);
    const dinnerPreview = giftEffect(govSelf, 'legacy', 1, member.gestureCount ?? 0);
    const fmtDelta = (d: number) =>
        d > 0 ? t('mem.relPlus', { v1: String(d) })
              : d < 0 ? t('mem.relMinus', { v1: String(Math.abs(d)) })
              : t('mem.relNone');

    // Get trust status
    //
    //  Four of these five used to be the loss red, so "Supportive" and
    //  "Hostile Enemy" were the same colour - the label was doing all the work
    //  and the colour was actively misleading. Same fault as the credit rating
    //  on the finance screen. Red is reserved for loss; only outright hostility
    //  keeps the caution blue, and the rest is plain white.
    const getTrustStatus = (trust: number) => {
        if (trust >= 80) return { label: t('equity.loyalAlly'), color: theme.colors.textPrimary };
        if (trust >= 60) return { label: t('equity.supportive'), color: theme.colors.textPrimary };
        if (trust >= 40) return { label: t('equity.neutral'), color: theme.colors.textSecondary };
        if (trust >= 20) return { label: t('equity.suspiciousOfYou'), color: theme.colors.warning };
        return { label: t('equity.hostileEnemy'), color: theme.colors.warning };
    };

    const trustStatus = getTrustStatus(member.trust);

    const alreadyLobbied = lobbied[member.id] !== undefined;
    const owed = (promises ?? []).filter(
        (pr: any) => pr.memberId === member.id && !pr.resolved,
    );

    /**
     * Ask them, before the meeting, where they stand.
     *
     * Moved from BoardRoomModal unchanged, including the labels: the wording
     * of what a director asks for is writing, and rewriting it here would
     * have made two versions of the same five sentences.
     */
    const handleLobby = () => {
        const proposal = {
            kind: 'acquisition' as const,
            amount: (companyValue || 0) * 0.3,
            valuation: companyValue || 0,
            title: t('equity.aMajorMoveNextQuarter'),
        };
        const res = lobby(member.id, proposal);
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
            title: `${member.name} wants something`,
            summary: res.message,
            lines: [{ label: 'They want you to', value: labels[res.demands], strong: true }],
            note: t('board.breakPromise'),
            confirmLabel: t('board.giveMyWord'),
            onConfirm: () => {
                makePromise(member.id, res.demands!, 1, 0.8, labels[res.demands!]);
                setPanel({ title: t('board.committed'), summary: member.name, confirmLabel: 'OK' });
            },
        });
    };

    // Lobbying Actions
    const handleSendGift = () => {
        const GIFT_COST = 50000;

        if (money < GIFT_COST) {
            setPanel({
                title: t('alert.insufficientFunds'),
                summary: t('mem.needForGift', { v1: formatMoney(GIFT_COST) }),
                confirmLabel: 'OK',
            });
            return;
        }

        // ------------------------------------------------------------------
        //  SHORTER, BECAUSE IT IS A FIFTY THOUSAND DOLLAR DECISION
        // ------------------------------------------------------------------
        //  Reported as "these dinner and gift panels are much too long,
        //  needlessly". They were: a paragraph of summary, two ledger rows,
        //  and then a second paragraph explaining the mechanic - for a button
        //  the player presses every quarter once they know what it does.
        //
        //  A confirmation should carry what changes and what it costs. The
        //  cost is one line, the effect is one line, and the lesson about
        //  money versus legacy belongs on the button that offers the choice,
        //  not in front of the player who already made it.
        // ------------------------------------------------------------------
        setPanel({
            title: t('mem.sendGiftTitle'),
            summary: t('mem.sendGiftBody2', { v1: formatMoney(GIFT_COST), v2: member.name }),
            lines: [
                { label: t('mem.cashAfter'), value: formatMoney(money - GIFT_COST), strong: true },
            ],
            note: t('mem.giftLikes'),
            confirmLabel: t('equity.sendGift'),
            onConfirm: () => {
                        updateStats({ money: money - GIFT_COST });
                        // ------------------------------------------------
                        //  ARTIK GERCEKTEN BIR SEY OLUYOR
                        // ------------------------------------------------
                        //  Bu iki eylem de `TODO` idi: para dusuyordu ama
                        //  hicbir sey degismiyordu. Simdi ILISKIYI artiriyor
                        //  — guveni degil. Para oy satin alamaz.
                        //
                        //  Hediye PARA jestidir: parayi onemseyen uyeyi
                        //  memnun eder, mirasini dusunen uyeyi asagilar.
                        //  Bkz. core/market/governance.ts -> giftEffect
                        // ------------------------------------------------
                const r = offerGesture(member.id, 'money', 1);
                setPanel({
                    title: r.success ? t('mem.giftSent') : t('mem.giftBackfired'),
                    summary: r.success
                        ? t('mem.relationshipUp', { v1: member.name, v2: String(r.delta) })
                        : t('mem.giftBackfiredBody', { v1: member.name }),
                    confirmLabel: 'OK',
                });
            },
        });
    };

    const handlePrivateDinner = () => {
        const ENERGY_COST = 20;

        // TODO: Check energy from stats store
        setPanel({
            title: t('mem.dinnerTitle'),
            summary: t('mem.dinnerBody2', { v1: member.name, v2: String(ENERGY_COST) }),
            note: t('mem.dinnerLikes'),
            confirmLabel: t('equity.arrangeDinner'),
            onConfirm: () => {
                const r = offerGesture(member.id, 'legacy', 1);
                setPanel({
                    title: r.success ? t('mem.dinnerArranged') : t('mem.giftBackfired'),
                    summary: r.success
                        ? t('mem.relationshipUp', { v1: member.name, v2: String(r.delta) })
                        : t('mem.giftBackfiredBody', { v1: member.name }),
                    confirmLabel: 'OK',
                });
            },
        });
    };

    // ----------------------------------------------------------------------
    //  THE LOCKED DOOR SHOULD STILL BE A DOOR
    // ----------------------------------------------------------------------
    //  It said "This feature is locked. Unlock by completing the Corporate
    //  Espionage storyline", under a spy emoji. Two problems with that beyond
    //  the emoji, which this game has removed from every other surface.
    //
    //  It broke the fiction. Nothing else in the boardroom speaks in features
    //  and unlocks; the board speaks about people. And it explained a
    //  storyline the player may not have met, which tells them a name and
    //  nothing they can act on.
    //
    //  What it says now is the in-world reason - you have nothing on them -
    //  with the storyline as a quiet note underneath. Same information, and
    //  it belongs to the same world as the rest of the panel.
    // ----------------------------------------------------------------------
    const handleBlackmail = () => {
        setPanel({
            title: t('mem.blackmailTitle'),
            summary: t('mem.blackmailBody'),
            note: t('mem.blackmailNote'),
            confirmLabel: t('common.ok'),
        });
    };

    // `member.shares` never existed on BoardMember - the field is shareCount -
    // so every buyout figure on this screen used to render NaN. Percentages are
    // derived above from shareCount/totalShares.

    // Buyout Logic
    const calculateOfferPrice = () => {
        const basePrice = companySharePrice * member.shareCount;
        const premiumMultiplier = 1 + offerPremium / 100;
        return basePrice * premiumMultiplier;
    };

    const offerPrice = calculateOfferPrice();

    // ----------------------------------------------------------------------
    //  ALL THREE ROUTES, INCLUDING THE ONES THAT WILL NOT WORK
    // ----------------------------------------------------------------------
    //  A route the player cannot walk today is still the most useful thing on
    //  this panel: seeing that the treasury covers what the wallet never will
    //  is the entire lesson of a succession. Same argument as the venues on
    //  the proposal sheet and the financing rows on an acquisition.
    // ----------------------------------------------------------------------
    const routeQuotes = quoteAllBuyoutRoutes({
        price: offerPrice,
        playerCash: money,
        companyCapital,
        companyValuation: companyValue,
        existingDebt: companyDebtTotal,
        totalShares,
        playerShares: playerShareCount,
        targetShares: member.shareCount,
        interestRate: 0.08,
    });

    // ----------------------------------------------------------------------
    //  THE BAR READS THE ASKING PRICE, LIKE EVERYTHING ELSE NOW
    // ----------------------------------------------------------------------
    //  These three used to work off `offerPremium` alone, so the bar said
    //  "Very interested" at fifty per cent to a holder who wanted seventy, and
    //  "Hesitant" at thirty to a Loyalist who would have taken the market
    //  price. It was the last copy of a decision that is supposed to live in
    //  one place - see core/market/buyout.ts - and it was the copy the player
    //  actually looked at.
    // ----------------------------------------------------------------------
    const askTotal = calculateBuyoutPrice(member.id, companySharePrice)?.askingTotal ?? 0;
    const likelihood = acceptanceChance(offerPrice, askTotal);

    const getLikelihoodColor = () =>
        likelihood <= 0 ? '#FF8A8A' : theme.colors.textPrimary;

    const getLikelihoodLabel = () => {
        if (likelihood <= 0) return t('mem.insulted');
        if (likelihood >= 1) return t('mem.veryInterested');
        return t('mem.interested');
    };

    const getLikelihoodWidth = (): string => `${Math.round(likelihood * 100)}%`;

    const handleMakeOffer = () => {
        // ------------------------------------------------------------------
        //  YOUR WALLET IS NOT THE ONLY PURSE ANY MORE
        // ------------------------------------------------------------------
        //  SHELVED, and it is worth saying exactly what this line did after
        //  the routes landed. It turned the treasury and the loan off for the
        //  one player they were written for: a successor with a big stake and
        //  no cash could pick "company buys it back", press the button, and be
        //  told they had insufficient funds - about money that was never going
        //  to be spent.
        //
        //      if (money < offerPrice) {
        //          setPanel({
        //              title: t('alert.insufficientFunds'),
        //              summary: t('mem.needForOffer', { v1: formatMoney(offerPrice) }),
        //              confirmLabel: 'OK',
        //          });
        //          return;
        //      }
        //
        //  `routeQuotes[route].feasible` answers this properly, per purse, and
        //  the button below is already disabled on it.
        // ------------------------------------------------------------------
        const affordability = routeQuotes[route];
        if (!affordability.feasible) {
            setPanel({
                title: t('alert.insufficientFunds'),
                summary: affordability.reason || t('mem.needForOffer', { v1: formatMoney(offerPrice) }),
                confirmLabel: 'OK',
            });
            return;
        }

        // Use the smart negotiation logic from the store
        const buyoutResult = calculateBuyoutPrice(member.id, companySharePrice);

        if (!buyoutResult) {
            setPanel({
                title: t('alert.error'),
                summary: t('alert.unableToCalculateBuyoutPrice'),
                confirmLabel: 'OK',
            });
            return;
        }

        if (!buyoutResult.canSell) {
            setPanel({
                title: 'Offer rejected',
                summary: buyoutResult.refusalReason || `${member.name} refuses to sell their shares.`,
                confirmLabel: 'OK',
                tone: 'danger',
            });
            return;
        }

        // ------------------------------------------------------------------
        //  TOTAL AGAINST TOTAL
        // ------------------------------------------------------------------
        //  `offerPrice` is the whole parcel and this used to be compared
        //  against `askingPrice`, which is one share. A holder of 1.25m
        //  shares at thirty cents was offered 375,000 against an ask of 51
        //  cents, so every offer passed, including the one the stepper
        //  labels "insulted", and the branch below was unreachable.
        //  See core/market/buyout.ts.
        // ------------------------------------------------------------------
        const requiredPrice = buyoutResult.askingTotal;

        if (offerPrice < requiredPrice) {
            setPanel({
                title: 'Offer too low',
                summary: `${member.name} will not sell for that.`,
                lines: [
                    { label: 'You offered', value: formatMoney(offerPrice) },
                    { label: 'They want', value: formatMoney(requiredPrice), strong: true },
                ],
                // ----------------------------------------------------------
                //  WHY THE ASK IS ABOVE THE TICKER
                // ----------------------------------------------------------
                //  Without this line the ask simply looks wrong, and the
                //  player concludes the price is broken rather than that the
                //  board is refusing to sell control at the bottom of a hole.
                //  See core/market/buyout.ts.
                // ----------------------------------------------------------
                note: buyoutResult.pricedOffReference
                    ? t('mem.pricedOffReference', {
                        v1: formatMoney(buyoutResult.referencePerShare),
                        v2: formatMoney(buyoutResult.basePrice),
                    })
                    : undefined,
                confirmLabel: 'OK',
                tone: 'danger',
            });
            return;
        }

        // ------------------------------------------------------------------
        //  AND THE ANSWER IS NOT KNOWN UNTIL THEY GIVE IT
        // ------------------------------------------------------------------
        //  This screen used to open a panel headed "Offer accepted", list
        //  what the player would pay and what their stake would become, and
        //  only then - on confirm - call the store, which threw its own die
        //  and could come back "Purchase failed". Being told yes and then no
        //  is worse than being told no.
        //
        //  So the panel is a question now. The store settles it on confirm,
        //  and the odds are on the button before it is pressed.
        // ------------------------------------------------------------------
        const chance = acceptanceChance(offerPrice, requiredPrice);

        setPanel({
            title: `Offer ${formatMoney(offerPrice)}?`,
            summary: `${member.name} is asking ${formatMoney(requiredPrice)} for ${memberPercent.toFixed(1)}% of the company.`,
            lines: [
                { label: 'You pay', value: formatMoney(offerPrice) },
                { label: 'Shares acquired', value: `${memberPercent.toFixed(1)}%` },
                { label: 'Your stake after', value: `${(memberPercent + playerPercent).toFixed(1)}%`, strong: true },
                { label: 'They accept', value: chance >= 1 ? 'Certain' : `${Math.round(chance * 100)}%` },
            ],
            confirmLabel: t('equity.completePurchase'),
            onConfirm: () => {
                // ------------------------------------------------------
                //  THE SHARES ACTUALLY MOVE NOW
                // ------------------------------------------------------
                //  This branch used to read `// TODO: Implement actual
                //  share transfer`, deduct the cash and stop. The player
                //  paid the full buyout price, saw "purchase complete",
                //  and received nothing - the member kept every share.
                //  The store has always had negotiateSharePurchase; it
                //  was simply never called from here.
                // ------------------------------------------------------
                const r = negotiateSharePurchase(member.id, member.shareCount, offerPremium, route);

                if (!r.success) {
                    setPanel({
                        title: 'Not this quarter',
                        summary: r.message,
                        confirmLabel: 'OK',
                        tone: 'danger',
                    });
                    return;
                }

                // ------------------------------------------------------
                //  AND THE STORE IS THE ONE THAT SPENDS
                // ------------------------------------------------------
                //  SHELVED: `updateStats({ money: money - offerPrice })`.
                //  negotiateSharePurchase already calls spendMoney, and
                //  `money` here is the value captured at render, so this
                //  wrote an absolute figure over the store's deduction
                //  and quietly decided the price itself.
                // ------------------------------------------------------
                setPanel({
                    title: t('mem.purchaseComplete'),
                    summary: t('mem.purchaseCompleteBody', { v1: memberPercent.toFixed(1) }),
                    lines: [{ label: 'Shares transferred', value: formatNumber(r.sharesBought) }],
                    confirmLabel: 'OK',
                    onConfirm: undefined,
                });
            },
        });
    };

    // ----------------------------------------------------------------------
    //  THE CEILING HAD TO CLEAR THE DEAREST ASK
    // ----------------------------------------------------------------------
    //  The stepper stopped at 100 while an ask can reach 150: reluctance tops
    //  out at 100 per cent and a Shark adds 50 on top. So the most expensive
    //  holders on the register were priced by the game and then could not be
    //  paid - a lock nobody designed, and invisible, because the broken
    //  comparison meant every offer was accepted anyway. See
    //  core/market/buyout.ts, MAX_ASK_PREMIUM.
    // ----------------------------------------------------------------------
    const PREMIUM_CEILING = Math.round(MAX_ASK_PREMIUM * 100) + 20;

    const adjustPremium = (delta: number) => {
        setOfferPremium((prev) => Math.max(-20, Math.min(PREMIUM_CEILING, prev + delta)));
    };

    return (
        <ScreenHost asScreen={asScreen} visible={visible} animationType="fade" transparent={!asScreen}>
            {/* ----------------------------------------------------------------
                THE NAME IS IN THE HEADER, NOT IN THE PAGE

                The hero used to open with a sixty pixel avatar, the name, the
                trait, a trust pill and a three line character card before a
                single number appeared - most of a phone screen spent saying
                who you were looking at, on a page you reached by tapping
                their name. The header says it once.
               ---------------------------------------------------------------- */}
            <ScreenHeader
                title={member.name}
                subtitle={`${t('equity.theV1', { v1: member.trait })} · ${trustStatus.label}`}
                onBack={onClose}
                inset={!asScreen ? false : undefined}
                category="finance"
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.page}>
            <View style={styles.heroSection}>

                {/* ------------------------------------------------------------
                    WHO THIS PERSON IS
                    ------------------------------------------------------------
                    The gift system filters by motivation - cash insults a
                    director who wants a legacy - but none of that was on
                    screen, so choosing a gift was a coin flip rather than a
                    decision. What they want and what they will not let go of
                    are now stated plainly.
                   ------------------------------------------------------------ */}
                <View style={styles.characterCard}>
                    {/* ------------------------------------------------------
                        THE FACE, BESIDE THE TRAIT RATHER THAN INSTEAD OF IT

                        Asked for as "board membersda sembol var foto yerine".
                        The symbol was a deliberate choice: a sixty pixel hero
                        portrait used to open this page and was cut because
                        most of a phone screen went on saying who you were
                        looking at, on a page reached by tapping their name.

                        That reasoning was about the HERO, not about having no
                        face at all. So the portrait comes back at 40 points,
                        inside the row that was already there, and the page
                        keeps the height it won. The four directors have real
                        files - npc-elena-vance and the rest - and a director
                        from a later generation falls back to their initials.
                       ------------------------------------------------------ */}
                    <View style={styles.traitRow}>
                        <Portrait
                            id={member.id}
                            name={member.name}
                            size={40}
                            borderWidth={0}
                            fill={theme.colors.surfaceRaised}
                            source={faceFor({
                                id: member.id,
                                name: member.name,
                                female: member.gender === undefined
                                    ? undefined
                                    : member.gender === 'female',
                                age: member.age,
                            }) as number | null}
                        />
                        <MaterialCommunityIcons
                            name={getTraitVisual(member.trait).icon}
                            size={18}
                            color={getTraitVisual(member.trait).color}
                        />
                        <Text style={styles.traitRowText}>
                            {t('data.trait.' + member.trait)}
                        </Text>
                    </View>
                    <Text style={styles.characterLine}>
                        {t('mem.wants')}{'  '}
                        <Text style={styles.characterValue}>
                            {t('data.motivation.' + (member.motivation || 'money'))}
                        </Text>
                    </Text>
                    {member.petIssue && (
                        <Text style={styles.characterLine}>
                            {t('mem.neverLetsGo')}{'  '}
                            <Text style={styles.characterValue}>
                                {t('data.petIssue.' + member.petIssue)}
                            </Text>
                        </Text>
                    )}
                    <Text style={styles.characterHint}>
                        {t('mem.giftHint.' + (member.motivation || 'money'))}
                    </Text>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.shares')}</Text>
                        <Text style={styles.statValue}>{memberPercent.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.relationship')}</Text>
                        <Text style={[styles.statValue, { color: '#FFFFFF' }]}>
                            {Math.round(member.relationship ?? 50)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.trust')}</Text>
                        <Text style={[styles.statValue, { color: trustStatus.color }]}>
                            {member.trust}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('equity.origin')}</Text>
                        <Text style={styles.statValue}>{member.origin}</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, activeTab === 'LOBBYING' && styles.tabActive]}
                    onPress={() => setActiveTab('LOBBYING')}
                >
                    <Text style={[styles.tabText, activeTab === 'LOBBYING' && styles.tabTextActive]}>{t('equity.lobbying')}</Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'BUYOUT' && styles.tabActive]}
                    onPress={() => setActiveTab('BUYOUT')}
                >
                    <Text style={[styles.tabText, activeTab === 'BUYOUT' && styles.tabTextActive]}>{t('equity.buyout')}</Text>
                </Pressable>
            </View>

            {/* Lobbying Tab */}
            <View style={styles.tabBody}>
                {activeTab === 'LOBBYING' && (
                    <View style={styles.tabContent}>
                        {/* ------------------------------------------------
                            THE ONE THAT DECIDES A VOTE, ABOVE THE ONES THAT
                            NUDGE A NUMBER

                            A gift is worth a few points of relationship. This
                            is where you find out whether they will back you,
                            and what it will cost, so it is not a fourth tile
                            in a grid of gestures.
                           ------------------------------------------------ */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.lobbyBtn,
                                alreadyLobbied && styles.lobbyBtnDone,
                                pressed && !alreadyLobbied && { opacity: 0.85 },
                            ]}
                            disabled={alreadyLobbied}
                            onPress={handleLobby}>
                            <MaterialCommunityIcons
                                name={alreadyLobbied ? 'check' : 'message-lock-outline'}
                                size={16}
                                color={alreadyLobbied ? theme.colors.textMuted : theme.colors.primaryText}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.lobbyText, alreadyLobbied && styles.lobbyTextDone]}>
                                {alreadyLobbied ? t('board.spokenAlready') : t('board.speakPrivately')}
                            </Text>
                        </Pressable>

                        {/* What you owe them. It was a box in the board list,
                            which is the one place it could not be acted on. */}
                        {owed.map((pr: any) => (
                            <View key={pr.id} style={styles.promiseBox}>
                                <MaterialCommunityIcons
                                    name="handshake-outline" size={14}
                                    color={theme.colors.warning} style={{ marginRight: 6 }}
                                />
                                <Text style={styles.promiseNote}>
                                    You promised to {pr.description}
                                </Text>
                            </View>
                        ))}

                        <Text style={styles.sectionTitle}>{t('equity.influenceActions')}</Text>
                        <View style={styles.actionGrid}>
                            {/* Send Gift */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    pressed && styles.actionButtonPressed,
                                    money < 50000 && styles.actionButtonDisabled,
                                ]}
                                onPress={handleSendGift}
                                disabled={money < 50000}
                            >
                                {/* ------------------------------------------
                                    THE GAME'S OWN COLOURS

                                    Reported as "renovate their symbols to suit
                                    the game's theme". These three badges were
                                    amber, cornflower and slate - three hex
                                    literals belonging to no palette in this
                                    codebase, from whichever component they
                                    were copied out of. Next to a boardroom
                                    built entirely from the theme they read as
                                    stickers.

                                    One family now, and they carry MEANING
                                    rather than decoration: the two gestures
                                    that work share the accent, and the one
                                    you cannot use is the disabled grey every
                                    other dead control in the game uses.
                                   ------------------------------------------ */}
                                <View style={[styles.actionIconBadge, styles.badgeLive]}>
                                    <MaterialCommunityIcons name="gift-outline" size={24} color={theme.colors.highlight} />
                                </View>
                                <Text style={styles.actionTitle}>{t('equity.sendGift')}</Text>
                                <Text style={styles.actionCost}>$50K</Text>
                                <Text style={[styles.actionEffect, { color: giftPreview >= 0 ? '#CFD0D2' : '#FF8A8A' }]}>
                                    {fmtDelta(giftPreview)}
                                </Text>
                            </Pressable>

                            {/* Private Dinner */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    pressed && styles.actionButtonPressed,
                                ]}
                                onPress={handlePrivateDinner}
                            >
                                <View style={[styles.actionIconBadge, styles.badgeLive]}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={24} color={theme.colors.highlight} />
                                </View>
                                <Text style={styles.actionTitle}>{t('equity.privateDinner')}</Text>
                                <Text style={styles.actionCost}>20 Energy</Text>
                                <Text style={[styles.actionEffect, { color: dinnerPreview >= 0 ? '#CFD0D2' : '#FF8A8A' }]}>
                                    {fmtDelta(dinnerPreview)}
                                </Text>
                            </Pressable>

                            {/* Blackmail */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    styles.actionButtonDisabled,
                                    pressed && styles.actionButtonPressed,
                                ]}
                                onPress={handleBlackmail}
                            >
                                <View style={[styles.actionIconBadge, styles.badgeDead]}>
                                    <MaterialCommunityIcons name="incognito" size={24} color={theme.colors.textMuted} />
                                </View>
                                <Text style={styles.actionTitle}>{t('equity.blackmail')}</Text>
                                {/* The padlock emoji went with the rest of them. An
                                    icon says locked; a word beside it says it twice. */}
                                <Text style={styles.actionCost}>{t('mem.locked')}</Text>
                                <Text style={styles.actionEffect}>{t('equity.forceVote')}</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Buyout Tab */}
                {activeTab === 'BUYOUT' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>{t('equity.shareNegotiation2')}</Text>

                        {/* Stepper UI */}
                        <View style={styles.stepperContainer}>
                            <Text style={styles.stepperLabel}>{t('equity.offerPremium')}</Text>
                            <View style={styles.stepperRow}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.stepperButton,
                                        pressed && styles.stepperButtonPressed,
                                        offerPremium <= -20 && styles.stepperButtonDisabled,
                                    ]}
                                    onPress={() => adjustPremium(-10)}
                                    disabled={offerPremium <= -20}
                                >
                                    <Text style={styles.stepperButtonText}>−</Text>
                                </Pressable>

                                <View style={styles.stepperDisplay}>
                                    <Text style={styles.stepperPrice}>
                                        {formatMoney(offerPrice)}
                                    </Text>
                                    <Text style={[
                                        styles.stepperPremium,
                                        { color: offerPremium >= 0 ? '#CFD0D2' : '#FF8A8A' }
                                    ]}>
                                        {offerPremium >= 0 ? '+' : ''}{offerPremium}%
                                    </Text>
                                </View>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.stepperButton,
                                        pressed && styles.stepperButtonPressed,
                                        offerPremium >= PREMIUM_CEILING && styles.stepperButtonDisabled,
                                    ]}
                                    onPress={() => adjustPremium(10)}
                                    disabled={offerPremium >= PREMIUM_CEILING}
                                >
                                    <Text style={styles.stepperButtonText}>+</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Reaction Bar */}
                        <View style={styles.reactionContainer}>
                            <View style={styles.reactionLabels}>
                                <Text style={styles.reactionLabel}>{t('equity.likelihoodToSell')}</Text>
                                <Text style={[styles.reactionStatus, { color: getLikelihoodColor() }]}>
                                    {getLikelihoodLabel()}
                                </Text>
                            </View>
                            <View style={styles.reactionBarBg}>
                                <View
                                    style={[
                                        styles.reactionBarFill,
                                        {
                                            width: getLikelihoodWidth() as any,
                                            backgroundColor: getLikelihoodColor(),
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        {/* ------------------------------------------------
                            WHO PAYS

                            The button below used to be disabled whenever
                            `money < offerPrice`, which made your own wallet
                            the only answer and put a serious holding out of
                            reach for good. A successor inherits sixty per
                            cent of the shares and one nth of the cash, so
                            that gate is permanent, not temporary.
                            See core/market/buyoutFinancing.ts.
                           ------------------------------------------------ */}
                        <Text style={styles.routeHeading}>Paid by</Text>
                        {(Object.keys(BUYOUT_ROUTE_LABELS) as BuyoutRoute[]).map((r) => {
                            const q = routeQuotes[r];
                            const chosen = r === route;
                            return (
                                <Pressable
                                    key={r}
                                    onPress={() => setRoute(r)}
                                    style={[
                                        styles.routeRow,
                                        chosen && styles.routeRowChosen,
                                        !q.feasible && styles.routeRowOff,
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={ROUTE_ICON[r]}
                                        size={20}
                                        color={chosen ? theme.colors.textPrimary : theme.colors.textMuted}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.routeName}>{BUYOUT_ROUTE_LABELS[r]}</Text>
                                        {/* ----------------------------------------------
                                            WHERE THE SHARES GO, ON THE ROW THAT CHOOSES IT

                                            Reported as "when I buy a board member out,
                                            does it make sense that I buy it with the
                                            COMPANY'S money? Because I am buying it for
                                            myself, that felt absurd."

                                            It would be absurd, and it is not what
                                            happens. The treasury route retires the
                                            shares: the player gains none, the total
                                            shrinks, and everybody's percentage rises
                                            because the denominator did. It also goes to
                                            a board vote, because it is their money.
                                            See useShareholderStore -> negotiateSharePurchase.

                                            So this was never a mechanic problem. It was
                                            that the ONLY sentence saying so sat in an
                                            info box BELOW the Make Offer button - after
                                            the decision, which is not information. All
                                            the row said was "your stake 33% becomes
                                            41%", and a player reading that while paying
                                            with company money draws exactly the
                                            conclusion that was drawn.

                                            One line, on the row, before the button.
                                           ---------------------------------------------- */}
                                        <Text style={styles.routeMeta} numberOfLines={2}>
                                            {q.feasible
                                                ? `${q.proposalKind ? t('mem.tornUp') : t('mem.youKeepThem')} ${t('mem.stakeMove', {
                                                    v1: q.ownershipBefore.toFixed(1),
                                                    v2: q.ownershipAfter.toFixed(1),
                                                })}`
                                                : q.reason}
                                        </Text>
                                    </View>
                                    {q.proposalKind ? (
                                        <MaterialCommunityIcons
                                            name="gavel"
                                            size={16}
                                            color={theme.colors.textMuted}
                                        />
                                    ) : null}
                                </Pressable>
                            );
                        })}

                        {/* ------------------------------------------------
                            AND THE FULL EXPLANATION, ABOVE THE BUTTON

                            It was below it. A paragraph explaining that the
                            company tears the shares up, placed after the
                            control that commits to buying them, is not an
                            explanation - it is a receipt. Nobody scrolls past
                            a button they have already pressed.
                           ------------------------------------------------ */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                {BUYOUT_ROUTE_EXPLANATIONS[route]}
                            </Text>
                        </View>

                        {/* Make Offer Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.makeOfferButton,
                                pressed && styles.makeOfferButtonPressed,
                                !routeQuotes[route].feasible && styles.makeOfferButtonDisabled,
                            ]}
                            onPress={handleMakeOffer}
                            disabled={!routeQuotes[route].feasible}
                        >
                            <Text style={styles.makeOfferButtonText}>
                                {routeQuotes[route].feasible ? t('mem.makeOffer') : t('mem.insufficientFunds')}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
            </ScrollView>

            <ConfirmPanel
                visible={!!panel}
                title={panel?.title || ''}
                summary={panel?.summary}
                lines={panel?.lines}
                note={panel?.note}
                tone={panel?.tone}
                confirmLabel={panel?.confirmLabel || 'OK'}
                cancelLabel={t('equity.cancel')}
                onConfirm={panel?.onConfirm}
                onCancel={() => setPanel(null)}
            />
        </ScreenHost>
    );
};

export default MemberInteractionModal;

const styles = StyleSheet.create({
    // ----------------------------------------------------------------------
    //  THE PAGE, AND WHY THE HERO SHRANK
    // ----------------------------------------------------------------------
    //  24pt of padding, a centred column, and a card that carried the avatar,
    //  the name, the trait, a trust pill, three lines of character and four
    //  stats. On a phone that is the whole screen before the first thing you
    //  can DO. The name and the trait moved to the header, the avatar went
    //  with them, and what is left is the four numbers and the two sentences
    //  that actually change how you play this person.
    // ----------------------------------------------------------------------
    page: { padding: 16, paddingBottom: NAV_BAR_CLEARANCE + 16, gap: 14 },
    lobbyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        paddingVertical: 13,
    },
    // Done is a SURFACE, not a colour: nothing here is a profit or a loss.
    lobbyBtnDone: { backgroundColor: theme.colors.surfaceHigh },
    lobbyText: { color: theme.colors.primaryText, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
    lobbyTextDone: { color: theme.colors.textMuted },
    promiseBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceHigh,
        borderRadius: theme.radius.sm,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    promiseNote: { color: theme.colors.textSecondary, fontSize: 11.5, flex: 1, lineHeight: 16 },
    tabBody: { gap: 16 },
    heroSection: {
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 12,
    },
    heroAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    heroAvatarText: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    heroName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    heroRole: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
        marginBottom: 12,
    },
    trustBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
    },
    trustBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    // Inside the hero rather than a card within a card - two nested surfaces
    // of the same colour is a border doing nothing.
    characterCard: { alignSelf: 'stretch', gap: 3 },
    traitRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
    traitRowText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    characterLine: { color: 'rgba(255,255,255,0.48)', fontSize: 11, marginBottom: 3 },
    characterValue: { color: '#FFFFFF', fontWeight: '700' },
    characterHint: { color: '#FFFFFF', fontSize: 10, marginTop: 4, lineHeight: 14, fontStyle: 'italic' },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.48)',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#323A40',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#434B50',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.48)',
        letterSpacing: 1,
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    tabContent: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.48)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionButton: {
        width: '48%',
        backgroundColor: '#434B50',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    actionButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    actionButtonDisabled: {
        borderColor: 'rgba(255,255,255,0.06)',
        opacity: 0.5,
    },
    actionIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 2,
    },
    /**
     * A gesture you can make.
     *
     * The theme's own accent, not one of the three unrelated hex literals
     * these badges carried. `highlightSoft` is the fill that exists for
     * exactly this and it keeps the boardroom in one palette.
     */
    badgeLive: {
        backgroundColor: theme.colors.highlightSoft,
        borderColor: theme.colors.border,
    },
    /** And one you cannot. The same grey every dead control in the game uses. */
    badgeDead: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: theme.colors.border,
    },
    actionIcon: {
        fontSize: 32,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    actionCost: {
        fontSize: 12,
        color: theme.colors.textPrimary,
        fontWeight: '600',
    },
    actionEffect: {
        fontSize: 11,
        color: '#FFFFFF',
    },
    stepperContainer: {
        backgroundColor: '#434B50',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    stepperLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepperButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#323A40',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    stepperButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    stepperButtonDisabled: {
        borderColor: 'rgba(255,255,255,0.06)',
        opacity: 0.3,
    },
    stepperButtonText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepperDisplay: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#434B50',
        borderRadius: 12,
        paddingVertical: 12,
    },
    stepperPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    stepperPremium: {
        fontSize: 16,
        fontWeight: '800',
    },
    reactionContainer: {
        gap: 8,
    },
    reactionLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reactionLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
    },
    reactionStatus: {
        fontSize: 14,
        fontWeight: '800',
    },
    reactionBarBg: {
        height: 12,
        backgroundColor: '#434B50',
        borderRadius: 6,
        overflow: 'hidden',
    },
    reactionBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    makeOfferButton: {
        backgroundColor: '#CFD0D2',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    makeOfferButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    makeOfferButtonDisabled: {
        backgroundColor: '#323A40',
        borderColor: 'rgba(255,255,255,0.06)',
        opacity: 0.5,
    },
    makeOfferButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    infoBox: {
        backgroundColor: '#323A40',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: 'rgba(255,255,255,0.08)',
    },
    infoText: {
        fontSize: 12,
        color: '#FFFFFF',
        lineHeight: 18,
    },

    // ----------------------------------------------------------------------
    //  WHO PAYS
    // ----------------------------------------------------------------------
    //  A list rather than a segmented control, because each row has a
    //  consequence that needs a line of its own: what your stake becomes, or
    //  why this one will not work today. Same reasoning as the venue list on
    //  the proposal sheet.
    // ----------------------------------------------------------------------
    routeHeading: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        marginTop: theme.spacing.sm,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        marginTop: 6,
    },
    routeRowChosen: {
        backgroundColor: theme.colors.surfaceRaised,
        borderColor: theme.colors.primary,
    },
    // Dimmed, not hidden. A route you cannot afford is the one worth reading.
    routeRowOff: {
        opacity: 0.5,
    },
    routeName: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    routeMeta: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
});
