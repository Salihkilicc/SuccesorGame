// src/core/market/postNegotiationReplies.test.ts
//
// ============================================================================
//  DOES THE LETTER ACTUALLY ARRIVE
// ============================================================================
//
//  negotiation.test.ts proves the arithmetic. This proves it is CONNECTED, and
//  it is the check this codebase keeps needing: the subsidiary buffs the engine
//  never read, applyCorporateShock written and never called, the news effect
//  that logged to a console, and - directly upstream of this feature - a
//  Compose button wired to `onPress={() => {}}` that has shipped to players.
//
//  So nothing below calls postDueReplies by hand except where it says so. The
//  claim that matters is the last one: advance a real quarter and find the
//  reply in the inbox.
// ============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => { }),
        removeItem: jest.fn(async () => { }),
    },
}));

import { useGameStore, initialGameState } from '../store/useGameStore';
import { useStatsStore, initialStatsState } from '../store/useStatsStore';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useMailStore } from '../store/useMailStore';
import { useNegotiationStore } from '../store/useNegotiationStore';
import { postDueReplies, bodyFor, demandLine } from './postNegotiationReplies';
import { currentQuarter } from '../story/world';
import { hostilePremiumFor } from './negotiation';

const grownCompany = () => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStatsStore.setState({
        ...initialStatsState, _hasHydrated: true,
        companyName: 'Harness Industries',
        companyCapital: 500_000_000,
        companyValue: 500_000_000,
    } as any);
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
    useMailStore.getState().reset();
    useNegotiationStore.getState().reset();
};

const sendTo = (targetId: string, targetName: string, over: any = {}) =>
    useNegotiationStore.getState().send({
        targetId, targetName,
        subject: over.subject ?? 'purchase',
        marketCap: over.marketCap ?? 100_000_000,
        risk: over.risk ?? 'Medium',
        acquirerValuation: over.acquirerValuation ?? 500_000_000,
        quarter: over.quarter ?? currentQuarter(),
    });

describe('the quarter between sending and hearing back', () => {
    it('nothing comes back in the quarter you sent it', () => {
        grownCompany();
        const q = currentQuarter();
        expect(sendTo('ind_voltmotors', 'VoltMotors', { quarter: q }).ok).toBe(true);

        expect(postDueReplies()).toEqual([]);
        expect(useNegotiationStore.getState().open()).toEqual([]);
    });

    it('and it does in the next one', () => {
        grownCompany();
        sendTo('ind_voltmotors', 'VoltMotors', { quarter: currentQuarter() - 1 });

        const answered = postDueReplies();
        expect(answered).toHaveLength(1);
        expect(answered[0].reply).toBeDefined();
    });

    it('a board is not written to twice while a letter is in the post', () => {
        grownCompany();
        expect(sendTo('ind_voltmotors', 'VoltMotors').ok).toBe(true);
        const second = sendTo('ind_voltmotors', 'VoltMotors');
        expect(second.ok).toBe(false);
    });
});

describe('the reply is a letter the player can find', () => {
    it('it lands in the inbox, from the person, unread', () => {
        grownCompany();
        sendTo('ind_voltmotors', 'VoltMotors', { quarter: currentQuarter() - 1 });
        postDueReplies();

        const mail = useMailStore.getState().inbox[0];
        expect(mail.fromName).toBe('Anders Køhl');
        expect(mail.isRead).toBe(false);
        expect(mail.subject).toContain('Offer to acquire');
        expect(mail.body.length).toBeGreaterThan(50);
    });

    it('a letter that needs an answer carries the negotiation, and a refusal does not', () => {
        // How the player learns that "no" was not an opening position: the
        // refusal simply has no buttons on it.
        grownCompany();
        sendTo('ind_voltmotors', 'VoltMotors', { quarter: currentQuarter() - 1 });
        sendTo('tech_pear', 'Pear Inc.', {
            quarter: currentQuarter() - 1, marketCap: 3_000_000_000_000,
        });
        postDueReplies();

        const inbox = useMailStore.getState().inbox;
        const fromKohl = inbox.find(m => m.fromName === 'Anders Køhl')!;
        const fromVogel = inbox.find(m => m.fromName === 'Nathan Vogel')!;
        expect(fromKohl.negotiationId).toBeTruthy();
        expect(fromVogel.negotiationId).toBeUndefined();
    });

    it('and the refusal still quotes what going over their heads would cost', () => {
        // Never hidden. The price of the rude route is the whole redesign, and
        // a player who cannot see it cannot tell a board that barely refused
        // from one that would fight.
        grownCompany();
        sendTo('tech_pear', 'Pear Inc.', {
            quarter: currentQuarter() - 1, marketCap: 3_000_000_000_000,
        });
        const [offer] = postDueReplies();
        const body = bodyFor(offer);
        expect(body).toContain(`${Math.round(hostilePremiumFor(offer.score) * 100)}%`);
        expect(body).toContain('directly to their shareholders');
    });

    it('every demand renders as a sentence rather than a blank', () => {
        expect(demandLine({ kind: 'seat' })).toContain('seat on your board');
        expect(demandLine({ kind: 'reputation', floor: 60 })).toContain('60');
        expect(demandLine({ kind: 'price', extraPremium: 0.1 })).toContain('10%');
        // `none` is the one that renders as nothing, on purpose - there is no
        // condition to print and a stray "CONDITION:" line would invent one.
        expect(demandLine({ kind: 'none' })).toBe('');
    });
});

describe('answering them', () => {
    const world = { publicReputation: 50, capital: 1e12, price: 0 };

    it('KØHL comes back once with half, and the second answer closes it', () => {
        grownCompany();
        sendTo('ind_voltmotors', 'VoltMotors', { quarter: currentQuarter() - 1 });
        const [offer] = postDueReplies();

        const first = useNegotiationStore.getState().answer(offer.id, false, world);
        expect(first.counter).toEqual({ kind: 'price', extraPremium: 0.05 });
        // Still open - he is waiting, not gone.
        expect(useNegotiationStore.getState().open()).toHaveLength(1);

        const second = useNegotiationStore.getState().answer(offer.id, true, world);
        expect(second.closed).toBe(true);
        expect(useNegotiationStore.getState().open()).toHaveLength(0);
    });

    it('OKONJO raises when you agree instantly', () => {
        grownCompany();
        sendTo('tech_streamify', 'Streamify', { quarter: currentQuarter() - 1 });
        const [offer] = postDueReplies();
        const opening = (offer.reply as any).demand.extraPremium;

        const result = useNegotiationStore.getState().answer(offer.id, true, world);
        expect((result.counter as any).extraPremium).toBeGreaterThan(opening);
    });

    it('VANE closes the door for good, and compose cannot reopen it', () => {
        grownCompany();
        sendTo('tech_skynet', 'SkyNet AI', {
            quarter: currentQuarter() - 1, marketCap: 200_000_000, risk: 'Extreme',
        });
        const [offer] = postDueReplies();
        expect((offer.reply as any).demand).toEqual({ kind: 'seat' });

        useNegotiationStore.getState().answer(offer.id, false, world);
        expect(useNegotiationStore.getState().closedForever['tech_skynet']).toBe(true);
        expect(sendTo('tech_skynet', 'SkyNet AI').ok).toBe(false);
    });

    it('and the reputation floor holds the letter open rather than ending it', () => {
        // The one demand the player cannot decide to pay. They have not gone
        // away; the answer is simply not available this quarter.
        grownCompany();
        sendTo('ind_edison', 'Edison Electric', {
            quarter: currentQuarter() - 1, risk: 'Low',
        });
        const [offer] = postDueReplies();
        expect((offer.reply as any).demand).toEqual({ kind: 'reputation', floor: 60 });

        const denied = useNegotiationStore.getState().answer(offer.id, true, {
            ...world, publicReputation: 50,
        });
        expect(denied.ok).toBe(false);
        expect(useNegotiationStore.getState().open()).toHaveLength(1);

        const allowed = useNegotiationStore.getState().answer(offer.id, true, {
            ...world, publicReputation: 60,
        });
        expect(allowed.ok).toBe(true);
    });

    it('refusing is remembered, so coming back is harder', () => {
        grownCompany();
        sendTo('tech_streamify', 'Streamify', { quarter: currentQuarter() - 1 });
        const [offer] = postDueReplies();
        useNegotiationStore.getState().answer(offer.id, false, world);
        expect(useNegotiationStore.getState().refusalsByTarget['tech_streamify'])
            .toBeGreaterThan(0);
    });
});

describe('the tick posts the letters without being asked', () => {
    it('a whole quarter advances and the reply is in the inbox', async () => {
        // The claim that matters. Everything above calls postDueReplies
        // directly; this one only advances time, which is what the game does.
        grownCompany();
        const before = useMailStore.getState().inbox.length;
        sendTo('ind_voltmotors', 'VoltMotors');

        await useGameStore.getState().advanceMonth(3);

        const inbox = useMailStore.getState().inbox;
        expect(inbox.length).toBeGreaterThan(before);
        expect(inbox.some(m => m.fromName === 'Anders Køhl')).toBe(true);
    });
});
