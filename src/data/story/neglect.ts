// src/data/story/neglect.ts
//
// ============================================================================
//  WHAT EACH OF THEM SAYS WHEN YOU HAVE NOT ANSWERED
// ============================================================================
//
//  Five people, five ways of noticing. The point of doing it this way rather
//  than with one templated "you have unread messages" is that the reprimand is
//  characterisation: how somebody handles being ignored says more about them
//  than most of what they say when you are paying attention.
//
//  ---------------------------------------------------------------------------
//  NOBODY SAYS "YOU HAVE NOT READ MY MESSAGE"
//  ---------------------------------------------------------------------------
//  Real people do not say that. They mention the thing they wrote about, or
//  they ask whether you are all right, or they resend it with a colder opening.
//  A line that names the mechanic would turn a piece of writing into a
//  notification with a face on it.
//
//  ---------------------------------------------------------------------------
//  AND ONE OF THEM COSTS NOTHING
//  ---------------------------------------------------------------------------
//  The father has no dial, by design - see core/story/state.ts, where the COO
//  has none either and for the same reason. He still chases, and the chase is
//  the whole consequence. Being noticed by him is not a number.
// ============================================================================

import type { Dial } from '../../core/story/state';

export type NeglectLine = {
    /** Which relationship moves, if any. */
    dial?: Dial;
    /**
     * Which way. `up` is for Pear, whose dial is hostility rather than
     * affection - the only one in the game where the number rising is the
     * relationship falling.
     */
    direction?: 'up' | 'down';
    /** What they write. One message; none of them sends two. */
    text: string;
    /**
     * The subject line, for the ones who write LETTERS.
     *
     * Four of the people who can be ignored are mail only by design, and the
     * design is the character: Pear does not have your number and has never
     * wanted it. A chase that arrived as a text message would spend a scene
     * the cast file is deliberately saving.
     */
    subject?: string;
};

export const NEGLECT_LINES: Record<string, NeglectLine> = {
    // ------------------------------------------------------------------
    //  He does not ask whether you read it. He assumes you did not.
    // ------------------------------------------------------------------
    father: {
        // The first draft had him say "either you read it and disagreed or you
        // did not read it", which names the mechanic out loud and tripped the
        // test that forbids exactly that. Rewriting him was the right fix
        // rather than widening the rule: he is a man who assumes, and an
        // assumption is stronger writing than a question.
        text: 'I sent you something last quarter and the plant report has been and gone since.\n\nSo either you disagreed with it, which is allowed, or it is still sitting where I left it. I know which I would put money on.',
    },

    // ------------------------------------------------------------------
    //  Affectionate on the surface, auditing underneath. He does not
    //  complain; he notes it, which is worse and is the whole character.
    // ------------------------------------------------------------------
    brother: {
        dial: 'brotherTrust',
        direction: 'down',
        text: 'no reply to the last one, which is fine, you are busy\n\nI mention it only because I will be asked at the next meeting whether I raised it with you, and I would like to be able to say that I did and leave it there',
    },

    // ------------------------------------------------------------------
    //  He gives the board position first and his own second, always. Here
    //  the board position IS the reproach and he does not add a second.
    // ------------------------------------------------------------------
    cfo: {
        dial: 'cfoTrust',
        direction: 'down',
        text: 'The item I wrote to you about last quarter is still open on my side.\n\nI have not escalated it and I do not intend to. But I keep a note of what I have raised and when, and the note is beginning to answer a question nobody has asked yet.',
    },

    // ------------------------------------------------------------------
    //  Fragments, lower case, and bad at asking for help. He does not
    //  reproach you at all, which is the version that lands hardest.
    // ------------------------------------------------------------------
    friend: {
        dial: 'friendLoyalty',
        direction: 'down',
        text: 'mate\n\nnothing needed, just checking you are upright\n\ni know what the first year is like. i am not going to ask twice though, so if you want me to stop you only have to keep not answering',
    },

    // ------------------------------------------------------------------
    //  She does not write about the silence. She writes about the floor,
    //  because that is what she is for, and the silence is in the tense.
    // ------------------------------------------------------------------
    coo: {
        text: 'Following up on the last one. Nothing has changed on the floor since I sent it, which is the problem I was writing about.\n\nI will assume no answer means no change and plan around that.',
    },

    // ======================================================================
    //  AND THEN THE FIVE WHO COULD BE IGNORED FOR FREE
    // ======================================================================
    //  These were missing, and the omission had a shape: the CTO alone sends
    //  sixteen of the game's conversations and the four below are the ones
    //  whose silence carries the most, because they are the ones who can hurt
    //  you. Nobody was ever chased for leaving a federal request open.
    // ======================================================================

    // ------------------------------------------------------------------
    //  Eighteen months out, always, and she has not noticed you did not
    //  reply because she has been building the thing anyway. The reproach
    //  is that none of it needed you.
    // ------------------------------------------------------------------
    cto: {
        text: 'I have carried on as though you had said yes, which I accept is not the same as you having said yes.\n\nIt is further along than it was. At some point one of us has to decide whether that is a good thing.',
    },

    // ------------------------------------------------------------------
    //  He does not chase. An assistant does, on a template, with a
    //  reference number, which is the whole insult.
    // ------------------------------------------------------------------
    pear: {
        dial: 'pearHostility',
        direction: 'up',
        subject: 'Re: our correspondence [ref. 4471-B]',
        text: 'Nathan has asked me to close the file on this one, since it has been open a quarter without a response from your side.\n\nHe notes that the terms were time sensitive and that this is not a criticism. He would like it recorded that the offer was made.\n\nSent on behalf of N. Vogel.',
    },

    // ------------------------------------------------------------------
    //  Cheerful about your silence the way they are cheerful about
    //  everything. They are not going anywhere and they say so warmly.
    // ------------------------------------------------------------------
    vulture: {
        subject: 'No rush at all',
        text: 'No reply, which we took as a no, which is completely fine.\n\nWe do want to flag that our numbers move with your position rather than with the calendar, so the offer you did not answer is not the offer you would get today. It is not a threat, it is just arithmetic, and it has been running the whole time.\n\nWe will be here.',
    },

    // ------------------------------------------------------------------
    //  They do not chase. They NOTE, and the note is the threat, and
    //  there is no threat anywhere in it.
    // ------------------------------------------------------------------
    fbi: {
        subject: 'Second notice',
        text: 'This office wrote to you on the date shown above and has received no response.\n\nA non-response is not a refusal and is not treated as one. It is recorded.\n\nThis notice is issued for completeness and requires no action.',
    },

    // ------------------------------------------------------------------
    //  The section, then the finding, then a date that is not a warning.
    //  Never says "you" where "the undertaking" will do.
    // ------------------------------------------------------------------
    regulator: {
        subject: 'Notice under s.14(2)',
        text: 'Under section 14(2) the undertaking was invited to make representations. No representations have been received.\n\nWhere no representations are received the Directorate proceeds on the material before it. The material before it is the complaint.\n\nThe file remains open until 31 March.',
    },
};
