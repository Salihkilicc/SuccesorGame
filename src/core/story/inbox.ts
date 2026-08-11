// src/core/story/inbox.ts
//
// ============================================================================
//  WHEN THINGS ARRIVE
// ============================================================================
//
//  Two problems, and they pull against each other.
//
//  THE FIRST IS TIMING. Some conversations must not answer immediately. You
//  write to a company the size of Pear and a reply the same afternoon says
//  they were waiting by the phone; a quarter of silence says they are large
//  and you are not. Your father dies and the condolences should not all be
//  sitting there before you have closed the notification.
//
//  THE SECOND IS VOLUME. Once a dozen systems can each write to you, a single
//  quarter can dump six messages into an inbox at once, and six messages is
//  not six times one message - it is a wall, and the player skims it. The
//  story spends its whole budget in one screen.
//
//  So: a queue with a per-quarter allowance. Nothing is thrown away; what does
//  not fit rolls to the next quarter and keeps its place in line. A wave of
//  four condolences becomes two this quarter and two the next, which happens
//  to be how condolences actually arrive.
//
//  ---------------------------------------------------------------------------
//  URGENT IS AN ESCAPE HATCH, AND IT IS MEANT TO BE USED TWICE
//  ---------------------------------------------------------------------------
//  Some deliveries are the point of the quarter rather than an event in it -
//  the offer that arrives when your father dies decides whether there is a
//  game after it. Those ignore the allowance.
//
//  It is a hatch, so it will be tempting. The rule for using it: if the player
//  could reasonably finish the quarter without reading it, it is not urgent.
//
//  ---------------------------------------------------------------------------
//  NOTHING IN HERE TOUCHES THE APP
//  ---------------------------------------------------------------------------
//  `drain` is a pure function over a list. The store holds the queue, the tick
//  calls it, and this file can be tested by handing it an array - which is the
//  only way scheduling logic ever actually gets tested.
// ============================================================================

/** One thing waiting to arrive. */
export type Pending = {
    /** Unique per scheduling, so the same conversation can be queued twice. */
    id: string;
    conversationId: string;
    /** The quarter it becomes eligible. */
    dueQuarter: number;
    /**
     * Order among things due together. Lower first.
     *
     * This is what makes a wave arrive in a written order rather than
     * whatever order the effects happened to run in.
     */
    priority: number;
    /** Ignores the per-quarter allowance. See the note above. */
    urgent?: boolean;
    /**
     * Give up after this many quarters of being undeliverable.
     *
     * A scene can be due and still blocked, because its own conditions are
     * not met - gated on a hostility that has not happened yet, say. Waiting
     * is usually right: it becomes true later and the scene lands then.
     *
     * But some scenes stop making sense. A condolence that has not been
     * delivered eleven quarters after the funeral should not suddenly appear,
     * and without an expiry it eventually would. Undefined means wait
     * forever, which is the right default for most things.
     */
    expiresAfter?: number;
    /** Bookkeeping for `expiresAfter`. Set when queued. */
    queuedAtQuarter: number;
};

/**
 * How many non-urgent conversations may arrive in one quarter.
 *
 * Two. One feels like the story is asleep; three already reads as a pile,
 * because each one is a decision rather than a notification.
 */
export const DELIVERIES_PER_QUARTER = 2;

export type DrainResult = {
    /** Send these now, in this order. */
    deliver: Pending[];
    /** Still waiting - either not due, over the allowance, or blocked. */
    keep: Pending[];
    /** Waited too long and stopped making sense. */
    expired: Pending[];
};

/**
 * Decide what arrives this quarter.
 *
 * `canDeliver` answers "are this conversation's own conditions met right
 * now" - passed in rather than read, so this stays testable with a plain
 * function.
 */
export const drain = (
    pending: Pending[],
    quarter: number,
    canDeliver: (p: Pending) => boolean,
    budget: number = DELIVERIES_PER_QUARTER,
): DrainResult => {
    const deliver: Pending[] = [];
    const keep: Pending[] = [];
    const expired: Pending[] = [];

    // Due first, then written order. Sorting by dueQuarter before priority
    // matters: something that has been waiting since Q2 goes before this
    // quarter's arrivals, however important they think they are.
    const ordered = [...pending].sort((a, b) =>
        a.dueQuarter - b.dueQuarter || a.priority - b.priority);

    let spent = 0;
    for (const p of ordered) {
        if (p.dueQuarter > quarter) { keep.push(p); continue; }

        if (!canDeliver(p)) {
            const waited = quarter - p.queuedAtQuarter;
            if (p.expiresAfter !== undefined && waited > p.expiresAfter) expired.push(p);
            else keep.push(p);
            continue;
        }

        if (p.urgent) { deliver.push(p); continue; }
        if (spent < budget) { deliver.push(p); spent += 1; continue; }

        // Over the allowance. It keeps its due quarter, so next quarter it
        // sorts ahead of anything newer - the queue is fair, not a stack.
        keep.push(p);
    }

    return { deliver, keep, expired };
};

/** Next free priority in a wave, so callers can queue several in order. */
export const nextPriority = (pending: Pending[], dueQuarter: number): number => {
    const sameQuarter = pending.filter(p => p.dueQuarter === dueQuarter);
    return sameQuarter.length === 0
        ? 0
        : Math.max(...sameQuarter.map(p => p.priority)) + 1;
};
