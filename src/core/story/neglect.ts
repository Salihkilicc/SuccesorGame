// src/core/story/neglect.ts
//
// ============================================================================
//  SOMEBODY WROTE TO YOU IN THE SPRING AND YOU NEVER ANSWERED
// ============================================================================
//
//  The question this answers was posed as "should there be a penalty for not
//  doing the messaging - cumulative damage, or brand value?", and the answer
//  it implements is deliberately not that.
//
//  A COUNTER THAT DRAINS IS THE WRONG SHAPE. Not reading your messages is
//  usually not a strategy; it is a player who has not worked out that the
//  messages matter. Answering that with quiet cumulative damage does not tell
//  them what to do, it only makes them lose - and a player asking "why am I
//  bleeding money" in the twelfth quarter is not helped by the true answer
//  being "you did not open a message a year ago".
//
//  The game already has the right machine for this and it is the dials. Ignore
//  the CFO and `cfoTrust` falls; a low dial opens harder scenes and closes
//  softer ones. That is not a penalty, it is a CONSEQUENCE, and the difference
//  is that the player can see who is upset.
//
//  So: a message left unread for a whole quarter gets noticed BY THE PERSON WHO
//  SENT IT. They write again, they mention it, and their dial moves one tick.
//  The damage is still cumulative - ignore somebody for five years and you will
//  have a CFO at zero - but every step of it arrives from a human being rather
//  than from a hidden counter.
//
//  ---------------------------------------------------------------------------
//  THE PURE HALF
//  ---------------------------------------------------------------------------
//  This file decides WHO was ignored and nothing else. It reads no stores,
//  writes nothing, and sends no messages; `runNeglect` in the poster does that.
//  Same three-way split the rest of the story uses, and for the same reason:
//  the rule is the part worth testing without a device.
// ============================================================================

/** Only the fields this needs. Keeps the rule testable without a thread. */
export type Neglectable = {
    id: string;
    unread: number;
    messages: { from: 'player' | 'them'; atMonth: number }[];
    /** The month they were last chased, so nobody is chased twice for one silence. */
    chasedAtMonth?: number;
};

/**
 * A whole quarter. Three months, which is one turn of the game's clock.
 *
 * Not two and not four: a quarter is the unit everything else in this game is
 * measured in, and "you did not answer me for a quarter" is a sentence a person
 * would actually say.
 */
export const NEGLECT_MONTHS = 3;

/**
 * How far a relationship moves each time somebody has to chase you.
 *
 * Small on purpose. One ignored message is carelessness and should cost about
 * as much as carelessness costs; the weight comes from doing it repeatedly,
 * which is the player's own doing and takes years.
 */
export const NEGLECT_STEP = 3;

/**
 * Whose messages have been sitting unread since last quarter.
 *
 * The age is measured from the NEWEST unread message, not the oldest. Somebody
 * who wrote in March and again in May has not been ignored for two months, they
 * have been ignored since May - and chasing them for the March one when they
 * have already followed up reads as the game not keeping up.
 */
export const whoWasIgnored = (
    threads: Neglectable[],
    currentMonth: number,
): string[] =>
    threads
        .filter(t => {
            if (t.unread <= 0) return false;

            // Already chased for this silence. The chase itself lands in the
            // thread as a new message, so the clock below restarts from it and
            // this only has to stop a double-chase inside one quarter.
            if (t.chasedAtMonth !== undefined
                && currentMonth - t.chasedAtMonth < NEGLECT_MONTHS) return false;

            const theirs = t.messages.filter(m => m.from === 'them');
            const newest = theirs[theirs.length - 1];
            if (!newest) return false;

            return currentMonth - newest.atMonth >= NEGLECT_MONTHS;
        })
        .map(t => t.id);
