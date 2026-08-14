// src/core/story/inbox.test.ts
//
// The queue decides what the player reads and in what order, and every one of
// its failures is quiet: a scene that arrives a quarter early, a wave that
// lands out of order, a conversation that waits forever. None of them crash.

import { drain, nextPriority, DELIVERIES_PER_QUARTER, type Pending } from './inbox';

let seq = 0;
const item = (over: Partial<Pending> = {}): Pending => ({
    id: `p${seq++}`,
    conversationId: over.conversationId ?? `c${seq}`,
    dueQuarter: 1,
    priority: 0,
    queuedAtQuarter: 1,
    ...over,
});

const always = () => true;
const never = () => false;
const ids = (ps: Pending[]) => ps.map(p => p.conversationId);

beforeEach(() => { seq = 0; });

describe('when things are due', () => {
    it('holds anything scheduled for a later quarter', () => {
        const r = drain([item({ conversationId: 'later', dueQuarter: 4 })], 2, always);
        expect(ids(r.deliver)).toEqual([]);
        expect(ids(r.keep)).toEqual(['later']);
    });

    it('delivers what is due now', () => {
        const r = drain([item({ conversationId: 'now', dueQuarter: 2 })], 2, always);
        expect(ids(r.deliver)).toEqual(['now']);
    });

    it('delivers something overdue rather than stranding it', () => {
        // It was due in Q1 and the player is in Q5 - it still arrives.
        const r = drain([item({ conversationId: 'late', dueQuarter: 1 })], 5, always);
        expect(ids(r.deliver)).toEqual(['late']);
    });
});

describe('the per-quarter allowance', () => {
    it('lets one through and holds the rest', () => {
        const six = ['a', 'b', 'c', 'd', 'e', 'f'].map((c, i) =>
            item({ conversationId: c, priority: i }));
        const r = drain(six, 1, always);
        expect(r.deliver).toHaveLength(DELIVERIES_PER_QUARTER);
        expect(ids(r.deliver)).toEqual(['a']);
        expect(ids(r.keep)).toEqual(['b', 'c', 'd', 'e', 'f']);
    });

    it('drops nothing - the overflow arrives next quarter, in order', () => {
        const wave = ['a', 'b'].map((c, i) => item({ conversationId: c, priority: i }));
        const first = drain(wave, 1, always);
        const second = drain(first.keep, 2, always);
        expect(ids(first.deliver)).toEqual(['a']);
        expect(ids(second.deliver)).toEqual(['b']);
        expect(second.keep).toEqual([]);
    });

    it('serves the oldest queue first, however important the new arrival thinks it is', () => {
        const fresh = item({ conversationId: 'new', dueQuarter: 3, priority: 0 });
        const held = item({ conversationId: 'waiting-since-q1', dueQuarter: 1, priority: 9 });
        const r = drain([fresh, held], 3, always, 1);
        expect(ids(r.deliver)).toEqual(['waiting-since-q1']);
    });

    it('keeps a wave in its written order', () => {
        // Effects run in whatever order a scene lists them; the story should
        // not depend on that. Priority is what fixes the order.
        const out = drain([
            item({ conversationId: 'third', priority: 2 }),
            item({ conversationId: 'first', priority: 0 }),
            item({ conversationId: 'second', priority: 1 }),
        ], 1, always, 3);
        expect(ids(out.deliver)).toEqual(['first', 'second', 'third']);
    });
});

describe('urgent', () => {
    it('ignores the allowance', () => {
        const r = drain([
            item({ conversationId: 'a', priority: 0 }),
            item({ conversationId: 'b', priority: 1 }),
            item({ conversationId: 'c', priority: 2 }),
            item({ conversationId: 'the-offer', priority: 3, urgent: true }),
        ], 1, always);
        expect(ids(r.deliver)).toContain('the-offer');
        expect(r.deliver).toHaveLength(DELIVERIES_PER_QUARTER + 1);
    });

    it('does not spend the allowance, so the routine one still arrives', () => {
        const r = drain([
            item({ conversationId: 'urgent', priority: 0, urgent: true }),
            item({ conversationId: 'a', priority: 1 }),
            item({ conversationId: 'b', priority: 2 }),
        ], 1, always);
        expect(ids(r.deliver).sort()).toEqual(['a', 'urgent']);
    });
});

describe('conversations that are due but blocked', () => {
    it('waits rather than dropping, because a gate can come true later', () => {
        const r = drain([item({ conversationId: 'gated' })], 1, never);
        expect(ids(r.keep)).toEqual(['gated']);
        expect(r.expired).toEqual([]);
    });

    it('does not spend the allowance while it waits', () => {
        const r = drain([
            item({ conversationId: 'blocked' }),
            item({ conversationId: 'fine' }),
        ], 1, p => p.conversationId !== 'blocked');
        expect(ids(r.deliver)).toEqual(['fine']);
    });

    it('gives up once it has waited past its expiry', () => {
        // A condolence eleven quarters after the funeral should not appear.
        const r = drain(
            [item({ conversationId: 'condolence', queuedAtQuarter: 1, expiresAfter: 2 })],
            5, never);
        expect(ids(r.expired)).toEqual(['condolence']);
        expect(r.keep).toEqual([]);
    });

    it('waits forever when no expiry was set', () => {
        const r = drain([item({ conversationId: 'patient', queuedAtQuarter: 1 })], 40, never);
        expect(ids(r.keep)).toEqual(['patient']);
    });

    it('an expiry does not throw away something that CAN be delivered', () => {
        const r = drain(
            [item({ conversationId: 'ok', queuedAtQuarter: 1, expiresAfter: 1 })],
            9, always);
        expect(ids(r.deliver)).toEqual(['ok']);
    });
});

describe('nextPriority', () => {
    it('starts at zero for an empty quarter', () => {
        expect(nextPriority([], 3)).toBe(0);
    });

    it('counts only the quarter being queued into', () => {
        const existing = [
            item({ dueQuarter: 2, priority: 7 }),
            item({ dueQuarter: 3, priority: 0 }),
        ];
        expect(nextPriority(existing, 3)).toBe(1);
        expect(nextPriority(existing, 5)).toBe(0);
    });
});
