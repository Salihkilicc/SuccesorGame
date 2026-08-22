// src/core/perf.ts
//
// ============================================================================
//  WHERE THE QUARTER ACTUALLY GOES
// ============================================================================
//
//  `advanceMonth` is two and a half thousand lines and it is the one thing in
//  this game the player waits for. "Next quarter'a basinca birkac saniye
//  yukleniyor" has been reported twice, and both times the answer offered was
//  a guess: prune the mail, cap the messages, delete the old conversations.
//
//  Guessing at performance is how a codebase acquires three optimisations that
//  do nothing and one regression. The tick has twenty seven named phases; the
//  cost is in one or two of them, and nothing on screen says which.
//
//  ---------------------------------------------------------------------------
//  DEV ONLY, AND FREE IN RELEASE
//  ---------------------------------------------------------------------------
//  Every function here compiles to a no-op when `__DEV__` is false, so this
//  cannot become the thing that makes the tick slow. It also never throws:
//  a profiler that can break the quarter is worse than no profiler.
// ============================================================================

type Phase = { name: string; ms: number };

let running: { label: string; started: number; marks: Phase[] } | null = null;

/** The clock. `performance` is not guaranteed on every RN runtime. */
const now = (): number => {
    try {
        return typeof performance !== 'undefined' && performance.now
            ? performance.now()
            : Date.now();
    } catch {
        return Date.now();
    }
};

/**
 * Begin timing something with named phases inside it.
 *
 * Nested calls are ignored rather than stacked. One thing at a time is all
 * this is for, and a stack would invite it to become a framework.
 */
export const beginTiming = (label: string): void => {
    if (!__DEV__ || running) return;
    running = { label, started: now(), marks: [] };
};

/**
 * Close off the phase that has been running and name it.
 *
 * Called at the END of a phase rather than the start, so adding one is a
 * single line in a single place and forgetting one merges it into its
 * neighbour instead of losing the total.
 */
export const mark = (name: string): void => {
    if (!__DEV__ || !running) return;
    const spent = running.marks.reduce((sum, m) => sum + m.ms, 0);
    running.marks.push({ name, ms: now() - running.started - spent });
};

/**
 * Print what it cost, worst phase first, and stop.
 *
 * Only the phases worth reading: anything under a millisecond is noise and
 * printing thirty lines of noise is how a profiler gets ignored.
 */
export const endTiming = (): void => {
    if (!__DEV__ || !running) return;
    const total = now() - running.started;
    const worst = [...running.marks]
        .filter(m => m.ms >= 1)
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 8)
        .map(m => `${m.name} ${m.ms.toFixed(0)}ms`)
        .join(', ');
    console.log(`[perf] ${running.label} ${total.toFixed(0)}ms  |  ${worst}`);
    running = null;
};
