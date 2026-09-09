// src/core/story/gameSink.ts
//
// ============================================================================
//  THE ONLY PLACE THE STORY TOUCHES THE GAME
// ============================================================================
//
//  effects.ts describes what a choice may do. This performs it. They are
//  separate files because the description is read by scenes, tests and the
//  audit, while this one needs four stores and AsyncStorage - and dragging
//  that chain into everything that merely wants the TYPES makes the
//  vocabulary untestable outside a device.
// ============================================================================

import { useStatsStore } from '../store/useStatsStore';
import { useStoryStore } from '../store/useStoryStore';
import { useMessageStore } from '../store/useMessageStore';
import { useMailStore } from '../store/useMailStore';
import { useGameStore } from '../store/useGameStore';
import { useNewsStore } from '../store/useNewsStore';
import { applyCorporateShock, corporateBrandFrom, brandIndex, indexToPoints } from '../market/brand';
import { fineAmount } from './fines';
import { quotedDelta } from './prices';
import type { EffectSink } from './effects';
import { CAST } from '../../data/story/cast';
import { castNow } from './castNow';
import { CONVERSATIONS } from '../../data/story';
import { currentQuarter } from './world';
import { BROTHER_ID, nudgeBrotherLoyalty, syncBrotherDial } from './brother';
import { emailOf } from './cast';

/**
 * The real sink, wired to the game's stores.
 *
 * Built as a function rather than a constant because the stores must be read
 * at CALL time - capturing `getState()` once would hand every later effect a
 * stale snapshot of the money it is trying to change.
 */
export const gameSink = (): EffectSink => ({
    capital: (amount) => {
        const s = useStatsStore.getState();
        s.update({ companyCapital: (s.companyCapital || 0) + amount });
    },
    // ------------------------------------------------------------------
    //  THE BUTTON AND THE LEDGER READ THE SAME FUNCTION
    // ------------------------------------------------------------------
    //  Which they did not, in seven places, for as long as those scenes have
    //  existed: the sentence computed a share of capital and the effect
    //  charged a literal. See prices.ts.
    // ------------------------------------------------------------------
    quoted: (item) => {
        const s = useStatsStore.getState();
        const capital = s.companyCapital || 0;
        s.update({ companyCapital: capital + quotedDelta(capital, item) });
    },
    // ------------------------------------------------------------------
    //  A PENALTY IS PRICED WHEN IT IS PAID, NOT WHEN IT IS WRITTEN
    // ------------------------------------------------------------------
    //  Read at CALL time, like everything else in this file, and that is the
    //  whole point of the effect: the same scene costs a first year company
    //  and a fifteenth year one the same FRACTION rather than the same
    //  number. See fines.ts for what the literals were doing.
    // ------------------------------------------------------------------
    fine: (severity) => {
        const s = useStatsStore.getState();
        const capital = s.companyCapital || 0;
        s.update({ companyCapital: capital - fineAmount(capital, severity) });
    },
    // ------------------------------------------------------------------
    //  CASH PAYS WHAT IT WAS ASKED TO PAY
    // ------------------------------------------------------------------
    //  SHELVED, and it was a trap rather than a shortcut:
    //
    //      // If it is the Pear buyout offer (48_000_000), dynamically
    //      // scale to 1.25x companyValue
    //      const payout = amount === 48_000_000
    //          ? Math.max(48_000_000, Math.round((s.companyValue || 0) * 1.25))
    //          : amount;
    //
    //  It fixed the right problem in the worst place. The letter quotes a
    //  scaling number and the scene paid a literal, so somebody taught the
    //  GENERIC cash effect to recognise one specific amount - which means any
    //  future scene that happens to pay exactly forty eight million is
    //  silently multiplied by a rule about a company nobody mentioned.
    //
    //  There is a `sellToPear` effect now. It reads the same function the
    //  salutation reads, and this one has no opinions.
    // ------------------------------------------------------------------
    cash: (amount) => {
        const s = useStatsStore.getState();
        s.update({ money: (s.money || 0) + amount });
    },
    employees: (amount) => {
        try {
            const s = useStatsStore.getState();
            const current = s.employeeCount || 0;
            const next = Math.max(0, current + amount);
            s.update({ employeeCount: next });
            const { useGameStore } = require('../store/useGameStore');
            useGameStore.setState((gs: any) => ({
                employeeCount: Math.max(0, (gs.employeeCount || 0) + amount),
            }));
        } catch { /* store not ready */ }
    },
    researchers: (amount) => {
        try {
            const { useLaboratoryStore } = require('../store/useLaboratoryStore');
            const lab = useLaboratoryStore.getState();
            const current = lab.researcherCount || 0;
            const next = Math.max(0, current + amount);
            useLaboratoryStore.setState({ researcherCount: next });
        } catch { /* store not ready */ }
    },
    // ------------------------------------------------------------------
    //  A HIT TO YOUR REPUTATION HAS TO LAND WHERE REPUTATION IS KEPT
    // ------------------------------------------------------------------
    //  This used to write `stats.brandValue` directly, and the quarterly tick
    //  DERIVES that field from `brandByCategory` every time it runs. So a
    //  scandal knocked 25 points off, the player saw it, and the next tick
    //  recomputed the number from categories the scandal never touched and
    //  put it back. Measured: 40 -> 15 -> 33.4 one quarter later.
    //
    //  Nothing failed. The effect ran, the store changed, the screen updated.
    //  It just did not survive the night.
    //
    //  `applyCorporateShock` is the function written for exactly this - a
    //  company-wide hit travelling DOWN into each category in proportion to
    //  its weight, with the normaliser that makes a -25 to q land as exactly
    //  -25. It has existed, tested, called from nowhere, for weeks. This is
    //  its caller.
    //
    //  Works in both directions: the slicing is sign-agnostic, so a scene that
    //  repairs your reputation uses the same effect with a positive amount.
    // ------------------------------------------------------------------
    brand: (amount) => {
        const s = useStatsStore.getState();
        const byCategory = { ...(s.brandByCategory || {}) };
        const active = Object.keys(byCategory);

        // Before the first quarter closes there are no categories yet, and
        // spreading a shock over nothing would silently drop it. Fall back to
        // the flat field so an early scene is not quietly ignored.
        if (active.length === 0) {
            s.update({ brandValue: Math.max(0, (s.brandValue || 0) + amount) });
            return;
        }

        // ------------------------------------------------------------------
        //  THE AMOUNT IS AUTHORED IN INDEX POINTS
        // ------------------------------------------------------------------
        //  `brand: -25` in a scene means a quarter of the whole scale, because
        //  that is what brand was when the scenes were written. Category
        //  points run 0 to 433 and beyond, so unconverted it was landing as
        //  five per cent of what it says.
        //
        //  Reported as the choice showing a plus or a minus and changing
        //  nothing. It was changing something; it was changing a twentieth of
        //  what it promised. See brand.indexToPoints.
        // ------------------------------------------------------------------
        const next = applyCorporateShock(byCategory, indexToPoints(amount), active);
        s.update({
            brandByCategory: next,
            // Recomputed rather than adjusted, so q stays DERIVED. Storing it
            // twice is how the two halves drifted apart in the first place.
            //
            // AND AS THE INDEX. `corporateBrandFrom` returns points; this
            // field is read by six modules that all clamp at 100. Writing
            // points here was the same mistake the quarterly tick was making,
            // in a second place - which is this codebase's other signature
            // failure, one fact kept in two places and fixed one at a time.
            brandValue: brandIndex(corporateBrandFrom(next, active)),
        });
    },
    dial: (dial, delta) => {
        // The brother lives on the cap table. Writing the story's copy would
        // leave the board holding the old number - and for a Snake, holding
        // it in the opposite direction.
        if (dial === 'brotherTrust') {
            nudgeBrotherLoyalty(delta);
            syncBrotherDial();
            return;
        }
        useStoryStore.getState().nudge(dial, delta);
    },
    flag: (flag) => useStoryStore.getState().raise(flag),
    // Cast ids are resolved here, at the last possible moment, so a scene
    // never carries a copy of anybody's name. An id with no cast entry throws
    // rather than delivering a message from "undefined" - the audit should
    // have caught it, and if it did not, the loud failure is the next best
    // thing to a silent one.
    message: (who, text) => {
        const m = castNow(who);
        if (!m) throw new Error(`story: no cast member "${who}"`);
        useMessageStore.getState().sendFromCharacter(
            { id: m.id, name: m.name, role: m.role, gender: m.gender, age: m.age, portraitId: m.portraitId },
            text,
            useGameStore.getState().currentMonth,
        );
    },
    mail: (m) => {
        const from = castNow(m.from);
        if (!from) throw new Error(`story: no cast member "${m.from}"`);
        useMailStore.getState().receiveMail({
            fromId: from.id,
            fromName: from.name,
            fromGender: from.gender,
            fromAge: from.age,
            fromPortraitId: from.portraitId,
            fromEmail: emailOf(from) ?? '',
            subject: m.subject,
            body: m.body,
            atMonth: useGameStore.getState().currentMonth,
            category: 'Primary',
        });
    },
    // Scheduling writes to the queue; nothing is delivered here. A scene
    // asks for a reply "next quarter" and the tick decides when that
    // actually lands, which is the only place the per-quarter allowance can
    // be honoured.
    schedule: ({ conversation, afterQuarters, urgent, expiresAfter }) => {
        const now = currentQuarter();
        const dueQuarter = now + Math.max(0, Math.floor(afterQuarters));
        useStoryStore.getState().schedule({
            conversationId: conversation,
            dueQuarter,
            urgent,
            expiresAfter,
            queuedAtQuarter: now,
        });

        // ------------------------------------------------------------------
        //  `afterQuarters: 0` MEANS NOW, AND IT DID NOT
        // ------------------------------------------------------------------
        //  The inbox is drained by the quarterly tick. Everything scheduled
        //  from inside a conversation is therefore scheduled AFTER this
        //  quarter's drain has already happened - so a reply written to
        //  arrive "in the same quarter" sat in the queue until the player
        //  advanced time, and turned up a quarter late.
        //
        //  Which is where the father's death goes quiet. Pear's letter is
        //  scheduled from that scene with afterQuarters 0 and a comment
        //  saying "it arrives in the same quarter, the obscenity of the
        //  timing is the point" - and it did not, and the condolence wave
        //  behind it is gated on the player having answered Pear, so the
        //  whole act stalled: nothing from Pear, nothing from the friend,
        //  nothing from the CFO, nothing from the board.
        //
        //  Draining here makes the zero mean zero. It is the same call the
        //  opening already makes for the same reason (see seedOpening), and
        //  it is safe from inside a conversation: delivery only puts letters
        //  in the inbox - effects run when the player opens them.
        // ------------------------------------------------------------------
        if (dueQuarter <= now) {
            try {
                require('./deliver').runInbox();
            } catch { /* inbox not ready - the next tick will catch it */ }
        }
    },
    // The one effect that stops the game. Written to the story store rather
    // than to a screen's local state, because the decision happens inside a
    // conversation and the overlay lives four screens away - and because an
    // ending the app forgets on a reload is not an ending.
    ending: (id) => {
        useStoryStore.getState().endGame(id);
    },
    // ------------------------------------------------------------------
    //  SIGNING PAYS WHAT THE LETTER SAID
    // ------------------------------------------------------------------
    //  And it used to pay a literal 48,000,000 while the salutation quoted
    //  `max(48M, value * 1.25)`. Those agree only while the company is small
    //  enough for the floor to bind, which stopped being true the moment
    //  Pear started writing to successors. Both sides ask pearPrice.ts now.
    //
    //  ------------------------------------------------------------------
    //  AND IT WRITES `netWorth`, WHICH NOTHING ELSE OUTSIDE THE TICK DOES
    //  ------------------------------------------------------------------
    //  `netWorth` is recalculated once a quarter, inside advanceMonth, as
    //  cash plus your share of the valuation. Every other effect in this
    //  file can leave it alone because a tick always follows.
    //
    //  This one has no tick after it. The ending fires in the same breath,
    //  so the closing record would have read the figure from BEFORE the
    //  sale: a player who signed for a billion and a quarter would be told
    //  on the last screen of the game that they were worth four hundred
    //  million. See core/story/readRecord.ts, which is the only reader that
    //  will ever see this state.
    //
    //  Set rather than added, because a sale CONVERTS the holding. Adding
    //  the proceeds on top of a net worth that still counts the company
    //  would pay the player twice for the thing they just gave away.
    //  ------------------------------------------------------------------
    sellToPear: () => {
        try {
            const { pearOfferAmount } = require('./pearPrice');
            const stats = require('../store/useStatsStore').useStatsStore;
            const s = stats.getState();
            const amount = pearOfferAmount(s.companyValue || 0);
            const cash = (s.money || 0) + amount;
            s.update({ money: cash, netWorth: cash });
        } catch (e) {
            console.warn('[story] the sale did not pay', e);
        }
    },
    // Writes the ANCHOR, not the price. A price alone drifts back to the
    // shipped value within a few quarters - that was the divestiture bug, and
    // a story reward that expires quietly is worse than no reward.
    reprice: (company, multiplier) => {
        try {
            const { INITIAL_MARKET_ITEMS } = require('../../features/assets/data/marketData');
            const base: any = (INITIAL_MARKET_ITEMS as any[]).find(x => x.id === company);
            if (!base?.price) return;
            const market = require('../store/useMarketStore').useMarketStore;
            const next = base.price * multiplier;
            market.setState((st: any) => ({
                marketPrices: { ...st.marketPrices, [company]: next },
            }));
            market.getState().setValueAnchor(company, next);
        } catch { /* market store not ready */ }
    },
    // Both halves of the territory dilemma. Deliberately thin: the store
    // owns the rules (one royalty per category, a siege replaces rather than
    // stacks) so that a scene cannot sign the same category twice by having
    // two choices that both do it.
    royalty: (category, rate) => {
        try {
            const { useTerritoryStore } = require('../store/useTerritoryStore');
            const { currentQuarter } = require('./world');
            const { giantOf } = require('../market/territory');
            useTerritoryStore.getState().agreeRoyalty(
                category, rate, currentQuarter(), giantOf(category)?.name ?? category,
            );
        } catch { /* territory store not ready */ }
    },
    siege: (category, quarters, pressure) => {
        try {
            const { useTerritoryStore } = require('../store/useTerritoryStore');
            const { giantOf } = require('../market/territory');
            useTerritoryStore.getState().beginSiege(
                category, quarters, pressure, giantOf(category)?.name ?? category,
            );
        } catch { /* territory store not ready */ }
    },
    // Writes onto the DEAL rather than anywhere global, so the damage is to
    // the acquisition it was aimed at and nothing else the player owns.
    raid: (company) => {
        try {
            const { rippleFor, realizationAfter } = require('../market/ripple');
            const ripple = rippleFor(company);
            if (!ripple) return;
            const realization = realizationAfter(ripple.kind);
            const finance = require('../../features/finance/stores/useCorporateFinanceStore')
                .useCorporateFinanceStore;
            // ONTO `sub.deal`, NOT ONTO THE SUBSIDIARY. A subsidiary is the
            // holding record - name, sector, valuation, a strategy the player
            // sets - and the deal nested inside it is the M&A model that
            // `dealQuarterEffect` actually reads every quarter. The first
            // version wrote the field on the wrapper, where it was perfectly
            // stored and read by nothing.
            finance.setState((st: any) => ({
                subsidiaries: (st.subsidiaries ?? []).map((sub: any) =>
                    sub.id === company && sub.deal
                        ? {
                            ...sub,
                            deal: {
                                ...sub.deal,
                                // Math.min, so two raids on one deal cannot
                                // stack their way to zero - the worst stands.
                                synergyRealization: Math.min(
                                    sub.deal.synergyRealization ?? 1, realization,
                                ),
                            },
                        }
                        : sub),
            }));
        } catch { /* finance store not ready */ }
    },
    // Priced off the DEAL, which is the only place the target's earnings are
    // recorded. A scene has no way of knowing that number and should not
    // pretend to - the first draft hardcoded six figures per letter.
    retention: (company) => {
        try {
            const { defenceCost } = require('../market/ripple');
            const finance = require('../../features/finance/stores/useCorporateFinanceStore')
                .useCorporateFinanceStore;
            const sub = (finance.getState().subsidiaries ?? [])
                .find((d: any) => d.id === company);
            if (!sub?.deal) return;
            const cost = defenceCost(sub.deal.targetAnnualEbit);
            // Through the same door as every other money movement in this
            // file, rather than a second way of writing capital.
            const stats = useStatsStore.getState();
            stats.update({ companyCapital: (stats.companyCapital || 0) - cost });
        } catch { /* finance store not ready */ }
    },
    // Through `sellSubsidiary`, which is the one door: it credits the money,
    // removes the holding, and - importantly - writes the exit valuation AND
    // its anchor back to the market, so the company returns to the shelf at
    // the value you built rather than the one it shipped with. A scene doing
    // its own arithmetic here would skip all of that.
    divest: (company, priceMultiple) => {
        try {
            require('../../features/finance/stores/useCorporateFinanceStore')
                .useCorporateFinanceStore.getState()
                .sellSubsidiary(company, priceMultiple);
        } catch { /* finance store not ready */ }
    },
    // Onto useGameStore, which is the copy the tick advances. useStatsStore
    // carries a field of the same name that nothing has written since the game
    // was built - see the note in core/story/world.ts.
    morale: (amount) => {
        const g = useGameStore.getState();
        const next = Math.max(0, Math.min(100, (g.employeeMorale ?? 75) + amount));
        useGameStore.setState({ employeeMorale: next } as any);
    },
    // Rolled HERE and once, rather than by the event engine - an event's
    // chance is rolled every quarter and a 30% event therefore happens to
    // everybody eventually. This is a single coin, flipped at the moment the
    // player decides, and the answer is fixed from then on.
    risk: (chance, onBetrayal, afterQuarters) => {
        if (Math.random() < chance) return;      // the promise was kept
        useStoryStore.getState().schedule({
            conversationId: onBetrayal,
            dueQuarter: currentQuarter() + Math.max(0, afterQuarters),
            queuedAtQuarter: currentQuarter(),
            // Urgent: it is the payoff of a decision the player made with
            // money, and holding it behind two condolence letters would be
            // the wrong quarter to find out in.
            urgent: true,
        });
    },
    // Through the same door an acquisition seat uses: new shares issued, the
    // member appended, the board mood recalculated. A second way of seating
    // somebody would be a second way of getting the cap table wrong.
    boardSeat: (person, stake) => {
        try {
            const { founderOf } = require('../../data/market/founders');
            const { SEAT_MIN_STAKE, SEAT_MAX_STAKE } = require('../market/governance');
            const named = founderOf(person);
            if (!named) return;

            const shStore = require('../../features/shareholders/stores/useShareholderStore')
                .useShareholderStore;
            const state = shStore.getState();
            // Already at the table - a gesture cannot be made twice, and
            // stacking two seats on one person would double his vote.
            if ((state.members ?? []).some((m: any) => m.name === named.name)) return;

            const clamped = Math.max(SEAT_MIN_STAKE, Math.min(SEAT_MAX_STAKE, stake));
            const shareCount = Math.round((state.totalShares || 10_000_000) * clamped);

            shStore.setState((st: any) => ({
                totalShares: st.totalShares + shareCount,
                members: [...st.members, {
                    id: `DIR_${person}_${Date.now()}`,
                    name: named.name,
                    shareCount,
                    trait: named.trait,
                    trust: named.trust,
                    motivation: named.motivation,
                    petIssue: named.petIssue,
                    isHostile: false,
                    origin: 'Investor' as const,
                }],
            }));
            shStore.getState().recalculateBoardMood();

            useNewsStore.getState().publish(
                `${named.name} joins the Hale board.`,
                'deal',
                useGameStore.getState().currentMonth,
            );
        } catch { /* shareholder store not ready */ }
    },

    // ------------------------------------------------------------------
    //  A THREAD THAT ENDS BECAUSE THE PERSON DID
    // ------------------------------------------------------------------
    //  Three things, and only the first is obvious.
    //
    //  The THREAD goes, which is the visible half - his name stops sitting
    //  at the top of the messages screen above the message saying he is
    //  dead.
    //
    //  Anything of his still in the QUEUE goes too. A beat scheduled before
    //  the death would have been delivered afterwards and re-created the
    //  thread from scratch, which is the dead man texting you about the
    //  yield a fortnight later. This is the half that is easy to miss,
    //  because it only shows up in saves where the timing went a particular
    //  way.
    //
    //  And any SAVED POSITION in one of his scenes - a conversation the
    //  player was halfway through when the news came. It has nowhere to be
    //  played now, so keeping where they got to would be a record of a
    //  screen that no longer exists.
    // ------------------------------------------------------------------
    closeThread: (who) => {
        useMessageStore.getState().removeThread(who);

        const theirs = new Set(
            CONVERSATIONS.filter(c => c.from === who).map(c => c.id),
        );
        const story = useStoryStore.getState();
        story.setPending(story.pending.filter(p => !theirs.has(p.conversationId)));
        theirs.forEach(id => story.clearScene(id));
    },
    // It has a home now - see core/store/useNewsStore.ts. This used to
    // console.log with a note saying so, which meant a scene could use the
    // effect, look wired, and reach nobody.
    news: (headline) => {
        useNewsStore.getState().publish(
            headline, 'story', useGameStore.getState().currentMonth,
        );
    },
});
