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
import { applyCorporateShock, corporateBrandFrom } from '../market/brand';
import type { EffectSink } from './effects';
import { CAST } from '../../data/story/cast';
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
    cash: (amount) => {
        const s = useStatsStore.getState();
        s.update({ money: (s.money || 0) + amount });
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

        const next = applyCorporateShock(byCategory, amount, active);
        s.update({
            brandByCategory: next,
            // Recomputed rather than adjusted, so q stays DERIVED. Storing it
            // twice is how the two halves drifted apart in the first place.
            brandValue: corporateBrandFrom(next, active),
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
        const m = CAST[who];
        if (!m) throw new Error(`story: no cast member "${who}"`);
        useMessageStore.getState().sendFromCharacter(
            { id: m.id, name: m.name, role: m.role },
            text,
            useGameStore.getState().currentMonth,
        );
    },
    mail: (m) => {
        const from = CAST[m.from];
        if (!from) throw new Error(`story: no cast member "${m.from}"`);
        useMailStore.getState().receiveMail({
            fromName: from.name,
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
        useStoryStore.getState().schedule({
            conversationId: conversation,
            dueQuarter: now + Math.max(0, Math.floor(afterQuarters)),
            urgent,
            expiresAfter,
            queuedAtQuarter: now,
        });
    },
    // The one effect that stops the game. Written to the story store rather
    // than to a screen's local state, because the decision happens inside a
    // conversation and the overlay lives four screens away - and because an
    // ending the app forgets on a reload is not an ending.
    ending: (id) => {
        useStoryStore.getState().endGame(id);
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
    // It has a home now - see core/store/useNewsStore.ts. This used to
    // console.log with a note saying so, which meant a scene could use the
    // effect, look wired, and reach nobody.
    news: (headline) => {
        useNewsStore.getState().publish(
            headline, 'story', useGameStore.getState().currentMonth,
        );
    },
});
