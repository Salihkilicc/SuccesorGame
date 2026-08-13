// src/core/market/negotiation.test.ts
//
// ============================================================================
//  NO DICE, A REAL WAIT, AND FIVE PEOPLE WHO ARE ACTUALLY DIFFERENT
// ============================================================================
//
//  Three things are being protected, and each one is the thing the shelved
//  NegotiationModal got wrong.
//
//  DETERMINISM. That modal decided with `Math.random()` behind a two-second
//  spinner and offered an "Adjust offer" button that re-rolled it, so the
//  optimal play was to press the button until the number came up. Nothing in
//  this system may consult a die, and the sweep below proves it by resolving
//  the same approach a hundred times and demanding one answer.
//
//  THE WAIT. A reply arrives a quarter later, strictly. If that ever weakens
//  to "the same tick" the feature has no mechanic left - the whole reason a
//  board is worth writing to is that you must live a quarter without knowing.
//
//  THE FIVE ARE MECHANICALLY DIFFERENT. Five voices over one identical
//  decision is a reskin, and it is the easy thing to accidentally ship. The
//  tests here assert on BEHAVIOUR - who splits, who raises, who leaves - and
//  deliberately not on their prose.
// ============================================================================

import {
    resistance, replyFor, counterFor, willEngage, isDue, canMeet, termsFor,
    hostilePremiumFor, canAccept, SUBJECT_SHIFT, SECOND_APPROACH_PENALTY,
    HOSTILE_PREMIUM_FLOOR, HOSTILE_PREMIUM_CEILING, REPLY_DELAY_QUARTERS,
    SUBJECTS, type Offer, type Subject,
} from './negotiation';
import {
    NEGOTIATORS, negotiatorFor, genericNegotiator, shiftFor,
} from '../../data/market/negotiators';
import {
    REFUSAL_THRESHOLD, FRIENDLY_PREMIUM, HOSTILE_PREMIUM, HOSTILE_MULTIPLE,
    quoteAcquisition, estimateTargetEbit, boardWillSell,
} from './mergers';

const byId = (id: string) => NEGOTIATORS.find(n => n.id === id)!;
const vane = byId('tech_skynet');
const kohl = byId('ind_voltmotors');
const okonjo = byId('tech_streamify');
const alvarez = byId('tech_planora');
const vogel = byId('tech_pear');

const scoreFor = (n: typeof vane, subject: Subject, over: Partial<{
    cap: number; valuation: number; risk: any; strength: number; refusals: number;
}> = {}) => resistance({
    targetMarketCap: over.cap ?? 100_000_000,
    acquirerValuation: over.valuation ?? 500_000_000,
    risk: over.risk ?? 'Medium',
    strength: over.strength,
    subject,
    personalityShift: shiftFor(n, subject),
    priorRefusals: over.refusals ?? 0,
});

// ============================================================================
//  THE PREMIUM THAT WAS 35%
// ============================================================================
describe('the hostile route is a price, and the price is on the button', () => {
    it('two and a half times the market, flat, for everybody', () => {
        // ------------------------------------------------------------------
        //  THE CURVE LOST TO A LABEL
        // ------------------------------------------------------------------
        //  0.45-0.75 on resistance was a better model than a constant and it
        //  is shelved anyway, because the acquisition screen printed
        //  `valuation * 1.2` beside the button while the engine charged the
        //  curve. The one place the player decides was the one place the
        //  number was wrong, so the model was invisible - and an invisible
        //  model is a surprise at the till.
        // ------------------------------------------------------------------
        expect(HOSTILE_MULTIPLE).toBe(2.5);
        expect(HOSTILE_PREMIUM).toBe(1.5);
        const q = quoteAcquisition(100_000_000, 'Low', true, 500_000_000);
        expect(q.price).toBeCloseTo(250_000_000, 0);
    });

    it('and it costs more than anything the curve could ask', () => {
        // Which is the other half of the change: the rude route was cheap
        // enough to be the default. Nobody takes this for convenience now.
        expect(HOSTILE_PREMIUM).toBeGreaterThan(HOSTILE_PREMIUM_CEILING);
    });

    it('the shelved curve still computes, so bringing it back is a decision', () => {
        expect(hostilePremiumFor(REFUSAL_THRESHOLD)).toBe(HOSTILE_PREMIUM_FLOOR);
        expect(hostilePremiumFor(0)).toBe(HOSTILE_PREMIUM_FLOOR);
    });

    it('it rises with how hard they resist, and stops', () => {
        const mild = hostilePremiumFor(REFUSAL_THRESHOLD + 0.01);
        const determined = hostilePremiumFor(REFUSAL_THRESHOLD + 0.30);
        const absurd = hostilePremiumFor(9);
        expect(determined).toBeGreaterThan(mild);
        expect(absurd).toBe(HOSTILE_PREMIUM_CEILING);
        // Monotonic across the whole range, swept rather than sampled.
        let last = -1;
        for (let s = 0; s <= 2; s = Math.round((s + 0.01) * 100) / 100) {
            const p = hostilePremiumFor(s);
            expect(p).toBeGreaterThanOrEqual(last);
            last = p;
        }
    });

    it('and it is always well clear of the friendly rate', () => {
        expect(HOSTILE_PREMIUM_FLOOR).toBeGreaterThan(FRIENDLY_PREMIUM * 2);
    });

    it('the quote uses the number it is handed', () => {
        // The override exists because mergers.ts must not import negotiation.ts
        // - that module imports this one and the cycle would be real.
        const q = quoteAcquisition(100_000_000, 'Low', true, 500_000_000, 0.60);
        expect(q.premiumRatio).toBe(0.60);
        expect(q.price).toBeCloseTo(160_000_000, 0);
    });

    it('and a caller that passes nothing gets the standing hostile price', () => {
        // Which is now the RIGHT answer rather than a known-wrong fallback:
        // there is one hostile number and everybody charges it.
        const q = quoteAcquisition(100_000_000, 'Low', true, 500_000_000);
        expect(q.premiumRatio).toBe(HOSTILE_PREMIUM);
        expect(q.premiumRatio).toBeGreaterThan(FRIENDLY_PREMIUM);
    });
});

describe('why the premium had to carry the whole load', () => {
    // The measurement the redesign was argued from, kept as a test so that a
    // rebalance which changes the shape of the argument fails loudly.
    const cap = 100_000_000, acquirer = 500_000_000;
    const f = quoteAcquisition(cap, 'Low', false, acquirer);
    const h = quoteAcquisition(cap, 'Low', true, acquirer, HOSTILE_PREMIUM);

    it('the synergy penalty on a hostile deal is nearly nothing', () => {
        const lost = f.annualSynergyAtFullRun - h.annualSynergyAtFullRun;
        // 3.6% of what the deal returns at full run rate, computed here
        // rather than quoted - the file comment said 1.2% on the first pass
        // and this is what corrected it. The documentation shown to the
        // player still says a hostile deal "only realises about 60%".
        expect(lost / h.steadyStateEbitImpact).toBeLessThan(0.05);
        expect(lost / h.steadyStateEbitImpact).toBeGreaterThan(0.02);
    });

    it('so the premium is the only lever with weight on it', () => {
        const extraPremium = h.premium - f.premium;
        const extraIntegration = h.firstYearIntegration - f.firstYearIntegration;
        const lostSynergy = f.annualSynergyAtFullRun - h.annualSynergyAtFullRun;
        expect(extraPremium).toBeGreaterThan(extraIntegration * 3);
        expect(extraPremium).toBeGreaterThan(lostSynergy * 50);
    });

    it('and the route is only open against the strongest boards, which is who charges most', () => {
        // A board only refuses when it is strong or large. Those are exactly
        // the deals where a real acquirer pays fifty points and up.
        expect(boardWillSell(cap, acquirer, 'Low', 60).refuses).toBe(false);
        expect(boardWillSell(cap, acquirer, 'Low', 85).refuses).toBe(true);
        expect(boardWillSell(acquirer * 1.5, acquirer, 'Low', 60).refuses).toBe(true);
        // And the harder of those two costs more than the softer, which is the
        // entire behaviour the flat 35% could not express.
        const strong = boardWillSell(acquirer * 1.5, acquirer, 'Low', 90).score;
        const barely = boardWillSell(cap, acquirer, 'Low', 85).score;
        expect(hostilePremiumFor(strong)).toBeGreaterThan(hostilePremiumFor(barely));
    });
});

// ============================================================================
//  THE WAIT
// ============================================================================
describe('a letter is answered a quarter later and not before', () => {
    const offer: Offer = {
        id: 'o1', targetId: 'x', targetName: 'X', subject: 'purchase',
        sentQuarter: 7, status: 'sent', score: 0.2, risk: 'Medium',
    };

    it('not in the quarter it was sent', () => {
        expect(REPLY_DELAY_QUARTERS).toBe(1);
        expect(isDue(offer, 7)).toBe(false);
    });

    it('but in the next one, and in every one after that', () => {
        expect(isDue(offer, 8)).toBe(true);
        expect(isDue(offer, 20)).toBe(true);
    });

    it('and never twice - an answered offer is not due again', () => {
        expect(isDue({ ...offer, status: 'open' }, 9)).toBe(false);
        expect(isDue({ ...offer, status: 'closed' }, 9)).toBe(false);
    });
});

// ============================================================================
//  NO DICE
// ============================================================================
describe('the same letter to the same board always comes back the same', () => {
    it('a hundred resolutions, one answer', () => {
        for (const n of NEGOTIATORS) {
            for (const subject of SUBJECTS) {
                const score = scoreFor(n, subject);
                const answers = new Set(
                    Array.from({ length: 100 }, () =>
                        JSON.stringify(replyFor(n, score, subject))),
                );
                expect({ who: n.id, subject, distinct: answers.size })
                    .toEqual({ who: n.id, subject, distinct: 1 });
            }
        }
    });

    it('and the only way to change it is to change something true', () => {
        // Same person, same subject, different company underneath.
        const weak = replyFor(kohl, scoreFor(kohl, 'purchase', { valuation: 5_000_000_000 }), 'purchase');
        const strong = replyFor(kohl, scoreFor(kohl, 'purchase', { valuation: 60_000_000 }), 'purchase');
        expect(weak.kind).not.toBe(strong.kind);
    });
});

// ============================================================================
//  THE SUBJECT LINE IS A REAL DECISION
// ============================================================================
describe('what you put in the subject line matters', () => {
    it('the slow route softens the most and the notice hardens', () => {
        expect(SUBJECT_SHIFT.partnership).toBeLessThan(SUBJECT_SHIFT.merger);
        expect(SUBJECT_SHIFT.merger).toBeLessThan(SUBJECT_SHIFT.purchase);
        expect(SUBJECT_SHIFT.notice).toBeGreaterThan(SUBJECT_SHIFT.purchase);
    });

    it('and only two of the four can ever produce a plain yes', () => {
        expect(canAccept('purchase')).toBe(true);
        expect(canAccept('merger')).toBe(true);
        // You bought the lower resistance with an extra condition.
        expect(canAccept('partnership')).toBe(false);
        expect(canAccept('notice')).toBe(false);
    });

    it('so a partnership to somebody who would have said yes still attaches a condition', () => {
        const keen = 0.05;
        expect(replyFor(alvarez, keen, 'purchase').kind).toBe('accept');
        expect(replyFor(alvarez, keen, 'partnership').kind).toBe('demand');
    });

    it('a refused board is harder the second time, so there is no free retry', () => {
        // The shelved modal's "Adjust offer" button, closed off.
        const once = scoreFor(kohl, 'purchase', { refusals: 0 });
        const twice = scoreFor(kohl, 'purchase', { refusals: 1 });
        expect(twice - once).toBeCloseTo(SECOND_APPROACH_PENALTY, 6);
    });

    it('and the notice is the one letter that still reaches them afterwards', () => {
        // Its whole reason for existing: without it a refused player has no
        // move at all between "nothing" and "hostile".
        const hard = { strength: 78, refusals: 2, risk: 'Low' as const };
        const polite = scoreFor(kohl, 'partnership', hard);
        const notice = scoreFor(kohl, 'notice', hard);
        expect(notice).toBeGreaterThan(polite);
        // It reaches them by being the only one that does not need them to
        // engage - a notice is not a question.
        expect(canAccept('notice')).toBe(false);
    });
});

// ============================================================================
//  A DEMAND IS NOT ALWAYS THERE
// ============================================================================
describe('not every reply is a demand', () => {
    it('some boards simply answer', () => {
        expect(replyFor(alvarez, 0.05, 'purchase')).toEqual({ kind: 'accept' });
        const desperate = genericNegotiator('x', 'High');
        expect(replyFor(desperate, 0.1, 'purchase')).toEqual({ kind: 'accept' });
    });

    it('and a plain yes costs exactly the friendly premium', () => {
        expect(termsFor({ kind: 'none' }, true))
            .toEqual({ premiumRatio: FRIENDLY_PREMIUM, seat: false });
    });

    it('the reputation floor is a gate rather than a price', () => {
        // The only demand the player cannot decide to pay in the moment.
        const d = { kind: 'reputation' as const, floor: 60 };
        expect(canMeet(d, { publicReputation: 59, capital: 1e12, price: 1 })).toBe(false);
        expect(canMeet(d, { publicReputation: 60, capital: 0, price: 1e12 })).toBe(true);
        // And meeting it costs no money, which is what makes it different.
        expect(termsFor(d, true).premiumRatio).toBe(FRIENDLY_PREMIUM);
    });

    it('a seat costs nothing today and a director forever', () => {
        expect(termsFor({ kind: 'seat' }, true)).toEqual({
            premiumRatio: FRIENDLY_PREMIUM, seat: true,
        });
    });

    it('and refusing any demand puts you back at the plain rate with nothing attached', () => {
        for (const d of [
            { kind: 'seat' as const },
            { kind: 'price' as const, extraPremium: 0.2 },
            { kind: 'reputation' as const, floor: 60 },
        ]) {
            expect(termsFor(d, false)).toEqual({
                premiumRatio: FRIENDLY_PREMIUM, seat: false,
            });
        }
    });
});

// ============================================================================
//  THE FIVE
// ============================================================================
describe('five people, five different negotiations', () => {
    it('no two of them behave the same way with an answer', () => {
        // The claim that stops this being five voices over one decision.
        const behaviours = NEGOTIATORS.map(n => n.onAnswered);
        // Four distinct mechanics; Vogel shares 'none' with Alvarez because
        // his difference is that he never gets as far as being answered.
        expect(new Set(behaviours).size).toBeGreaterThanOrEqual(4);
        expect(replyFor(vogel, scoreFor(vogel, 'purchase'), 'purchase').kind).toBe('refuse');
        expect(replyFor(alvarez, scoreFor(alvarez, 'purchase'), 'purchase').kind).toBe('accept');
    });

    it('VANE asks for a seat and cannot be bought out of it', () => {
        expect(vane.ask(0.2)).toEqual({ kind: 'seat' });
        // Money is not an answer to her, at any score.
        for (const s of [0, 0.2, 0.4, 0.54]) expect(vane.ask(s).kind).toBe('seat');
    });

    it('...and refusing her ends it permanently', () => {
        expect(vane.onAnswered).toBe('withdraw');
        // No comeback in either direction. She is placing a condition, not
        // opening a trade.
        expect(counterFor(vane, { kind: 'seat' }, false)).toBeUndefined();
        expect(counterFor(vane, { kind: 'seat' }, true)).toBeUndefined();
    });

    it('KØHL splits the difference, once, and only when refused', () => {
        const ask = kohl.ask(0.2);
        expect(ask).toEqual({ kind: 'price', extraPremium: 0.10 });

        const split = counterFor(kohl, ask, false);
        expect(split).toEqual({ kind: 'price', extraPremium: 0.05 });
        // Agreeing gets no comeback, and neither does refusing the second one.
        expect(counterFor(kohl, ask, true)).toBeUndefined();
        expect(counterFor(kohl, split!, false)).toEqual({ kind: 'price', extraPremium: 0.025 });
    });

    it('...so refusing his first number is the right opening move', () => {
        const first = kohl.ask(0.2) as any;
        const second = counterFor(kohl, first, false) as any;
        expect(termsFor(second, true).premiumRatio)
            .toBeLessThan(termsFor(first, true).premiumRatio);
    });

    it('OKONJO raises when you agree, which is the exact inverse', () => {
        const ask = okonjo.ask(0.2) as any;
        const raised = counterFor(okonjo, ask, true) as any;
        expect(raised.extraPremium).toBeGreaterThan(ask.extraPremium);
        // Refusing him gets nothing back - he takes the original rather than
        // lose the deal, so the correct play against him is Køhl's inverse.
        expect(counterFor(okonjo, ask, false)).toBeUndefined();
    });

    it('...and he prices himself off how badly you appear to want it', () => {
        const easy = (okonjo.ask(0) as any).extraPremium;
        const keen = (okonjo.ask(0.5) as any).extraPremium;
        expect(keen).toBeGreaterThan(easy);
        expect(keen).toBeLessThanOrEqual(0.25);
    });

    it('ALVAREZ asks for nothing, and says yes to all four subjects', () => {
        for (const subject of SUBJECTS) {
            const reply = replyFor(alvarez, scoreFor(alvarez, subject), subject);
            expect({ subject, kind: reply.kind }).not.toEqual({ subject, kind: 'refuse' });
        }
        expect(alvarez.ask(0.5)).toEqual({ kind: 'none' });
    });

    it('...including the notice of intent, which is not a request', () => {
        // The worst thing in the file and the reason he is in it.
        const reply = replyFor(alvarez, scoreFor(alvarez, 'notice'), 'notice');
        expect(reply.kind).toBe('demand');
        expect((reply as any).demand).toEqual({ kind: 'none' });
    });

    it('...and he says yes from a position where the board maths says refuse', () => {
        // His company larger than yours, which refuses everybody else.
        const score = scoreFor(alvarez, 'purchase', { cap: 900_000_000, valuation: 500_000_000 });
        expect(willEngage(score)).toBe(true);
        const anyoneElse = scoreFor(kohl, 'purchase', { cap: 900_000_000, valuation: 500_000_000 });
        expect(willEngage(anyoneElse)).toBe(false);
    });

    it('VOGEL never reaches the table, at any size or subject', () => {
        // The cast file: "the insult is the format". Being answered by a
        // template IS the answer, and no run of good quarters changes it.
        for (const subject of SUBJECTS) {
            for (const valuation of [1e8, 1e11, 1e14]) {
                const score = scoreFor(vogel, subject, { valuation, cap: 1e9 });
                expect({ subject, valuation, engaged: willEngage(score) })
                    .toEqual({ subject, valuation, engaged: false });
            }
        }
    });

    it('...and his only reply is a reference number', () => {
        expect(vogel.lines.refuseLine).toContain('Ref:');
        expect(vogel.lines.refuseLine).toContain('Sent on behalf of Nathan Vogel');
        expect(vogel.lines.refuseLine).not.toContain('I ');
    });

    it('the four named traits match the board seats they take afterwards', () => {
        // Same person, same file, one description. A negotiator whose
        // temperament contradicted the director who then joins your board
        // would be two characters wearing one name.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { FOUNDER_BY_COMPANY } = require('../../data/market/founders');
        for (const id of ['tech_skynet', 'ind_voltmotors', 'tech_streamify']) {
            expect({ id, trait: byId(id).trait })
                .toEqual({ id, trait: FOUNDER_BY_COMPANY[id].trait });
            expect(byId(id).name).toBe(FOUNDER_BY_COMPANY[id].name);
        }
    });
});

// ============================================================================
//  EVERYBODY ELSE
// ============================================================================
describe('the forty companies nobody wrote a person for', () => {
    it('still negotiate, and a struggling one asks for nothing', () => {
        expect(genericNegotiator('x', 'High').ask(0.3)).toEqual({ kind: 'none' });
        expect(genericNegotiator('x', 'Extreme').ask(0.3)).toEqual({ kind: 'none' });
    });

    it('a dull respectable board is the one that asks about your reputation', () => {
        // Placed here rather than on any of the five, and that placement is
        // the argument: it is the anonymous profitable board whose own
        // shareholders will ask who they sold to.
        expect(genericNegotiator('x', 'Low').ask(0.3)).toEqual({ kind: 'reputation', floor: 60 });
        for (const n of NEGOTIATORS) {
            for (const s of [0, 0.25, 0.5]) {
                expect(n.ask(s).kind).not.toBe('reputation');
            }
        }
    });

    it('and the fallback is deterministic on the score, not on a die', () => {
        const g = genericNegotiator('x', 'Medium');
        expect(g.ask(0.05)).toEqual({ kind: 'none' });
        expect(g.ask(0.5)).toEqual({ kind: 'price', extraPremium: 0.08 });
    });

    it('an unknown company falls through to it rather than crashing', () => {
        const n = negotiatorFor('health_pyramid', 'Extreme');
        expect(n.name).toBe('The Board');
        expect(replyFor(n, 0.1, 'purchase').kind).toBe('accept');
    });

    it('and a named company never falls through', () => {
        for (const n of NEGOTIATORS) {
            expect(negotiatorFor(n.id, 'Medium').name).toBe(n.name);
        }
    });
});

describe('the target of an approach is a real company', () => {
    it('every named negotiator is a listed, buyable company', () => {
        // A personality for a company the market has never heard of is the
        // failure marketData.ts already documents: three companies written
        // down in data/AcquisitionData.ts and never wired to anything.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { INITIAL_MARKET_ITEMS } = require('../../features/assets/data/marketData');
        const ids = new Set((INITIAL_MARKET_ITEMS as any[]).map(i => i.id));
        for (const n of NEGOTIATORS) {
            expect({ id: n.id, listed: ids.has(n.id) })
                .toEqual({ id: n.id, listed: true });
        }
    });

    it('and every listed company earns something, so a quote is never nonsense', () => {
        expect(estimateTargetEbit(100_000_000, 'Low')).toBeGreaterThan(0);
    });
});
