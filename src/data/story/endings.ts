// src/data/story/endings.ts
//
// ============================================================================
//  THE WAYS IT CAN STOP
// ============================================================================
//
//  The game already had two endings and neither of them WAS data: `bankrupt`
//  and `removed` were strings compared inline in HomeScreen, with their text in
//  the translation file and their trigger buried in the quarterly tick. That
//  worked while there were two and stopped working at three.
//
//  An ending here is a title, a body, and an id a story effect can name. The
//  audit checks that every `ending` effect points at one of these, the same
//  way it checks a `schedule` points at a real conversation, because the
//  failure is identical and worse: a scene offering an ending that does not
//  exist would take the player's decision and then do nothing with it.
//
//  ---------------------------------------------------------------------------
//  AND NOW ALL OF THEM LIVE HERE, INCLUDING THE OLD TWO
//  ---------------------------------------------------------------------------
//  `removedByBoard` was brought over first and `bankrupt` was left behind, so
//  the game had its endings in two places: prose in this file for one of them,
//  four translation keys and a nested ternary in HomeScreen for the other.
//
//  That ternary is the reason this is worth doing now rather than at the end.
//  Every new ending had to be threaded through it, and the screen decided both
//  WHETHER the game was over and WHAT it said about it, in the same
//  expression. With three endings it is untidy. With the seven this game is
//  heading for it is where the bugs would come from.
//
//  So: this file owns the WORDS. Two things are still allowed to DECIDE - a
//  story effect, and the quarterly tick - and `ENDING_FOR_STATUS` is how the
//  tick names one, so that the decision and the prose cannot drift apart.
// ============================================================================

export interface Ending {
    id: string;
    /** Shown large. Should be readable as the last thing the game says. */
    title: string;
    /**
     * Two or three sentences. Not an epilogue and not a scorecard - the point
     * is what it FELT like, and a page of consequences dilutes that.
     */
    body: string;
}

export const ENDINGS: Record<string, Ending> = {
    // ----------------------------------------------------------------------
    //  YOU SOLD IT IN THE FIRST YEAR
    // ----------------------------------------------------------------------
    //  The secret early ending. It is a real ending - the money is real, the
    //  price is fair, nobody cheated anybody - and it has to be funny before
    //  it is sad or the joke curdles into a scolding.
    //
    //  The bitterness is entirely in the specifics: the company becomes a
    //  bullet point, the father's forty years become a line in a footnote,
    //  and the player is rich and finished at twenty-six. Nothing in it says
    //  "you were wrong". Being told you were wrong would let you argue.
    // ----------------------------------------------------------------------
    soldToPear: {
        id: 'soldToPear',
        title: 'YOU TOOK THE OFFER',
        body:
            'The money cleared on a Tuesday. It was a fair price, Vogel does not '
            + 'underpay, because underpaying invites a conversation.\n\n'
            + 'The factory ran for eleven more months and closed. The Hale name '
            + 'appears once in the integration report, in a footnote, spelled '
            + 'correctly. You are twenty-six years old and you will never have to '
            + 'work again, which is a longer time than it sounds.\n\n'
            + 'Nobody ever found out whether you would have been any good at it.',
    },

    // ----------------------------------------------------------------------
    //  THE BOARD REMOVED YOU
    // ----------------------------------------------------------------------
    //  There was already a `removed` game over: a title and one line in the
    //  translation file, decided in the quarterly tick. It ended the game
    //  correctly and it ended it about nothing - a procedure happened and a
    //  screen said so.
    //
    //  THE MESSAGE HAD TO BE IN THE ENDING RATHER THAN IN THE INBOX. It has
    //  to arrive immediately before the screen, and a message delivered to
    //  Messages cannot: the overlay covers the app the moment the tick
    //  finishes, so the player would meet the verdict first and find his
    //  commiseration afterwards, as an artefact. Putting it here makes the
    //  ordering a fact rather than a hope.
    //
    //  HE SENDS IT BEFORE THE VOTE IS ANNOUNCED. That is the detail the whole
    //  thing rests on: he knew the outcome early enough to draft something
    //  affectionate. Nothing says so. The timestamp does it.
    //
    //  And he is not gloating - gloating would let the player hate him
    //  cleanly. He is being kind, in his own account genuinely, about a thing
    //  he arranged.
    // ----------------------------------------------------------------------
    removedByBoard: {
        id: 'removedByBoard',
        title: 'THE BOARD HAS REMOVED YOU',
        body:
            'The vote was carried at 11:40. Your phone goes at 11:31.\n\n'
            + '"Do not worry about a thing, darling. I will look after Dad\'s '
            + 'company. You were never going to enjoy this part and I have always '
            + 'thought you knew that. Come for lunch when you have slept. J x"\n\n'
            + 'Nine minutes. You will think about the nine minutes for a long time.',
    },

    // ----------------------------------------------------------------------
    //  THE MONEY RAN OUT
    // ----------------------------------------------------------------------
    //  This was 'gameover.bankruptBody' and it read, in full: "The money ran
    //  out." Four words for the ending most players will actually reach.
    //
    //  It is the hardest of the three to write, because bankruptcy is the one
    //  the player already knows they earned. Anything with an opinion in it
    //  reads as the game telling them off, and being told off lets them argue
    //  with the game instead of sitting in it.
    //
    //  So there is no opinion anywhere in it. It is a Friday, some procedure,
    //  a building. The last line is the only one that judges anything and it
    //  judges the COMPANY, which the player is at liberty to agree with.
    // ----------------------------------------------------------------------
    wentBankrupt: {
        id: 'wentBankrupt',
        title: 'THE MONEY RAN OUT',
        body:
            'Payroll did not clear. You heard it at 6:40 on a Friday, from the '
            + 'bank, which means you were not the first person to know.\n\n'
            + 'Administrators are appointed inside a week. They are polite and '
            + 'they are fast, and by the second morning somebody you hired is '
            + 'explaining the filing system to a man with a clipboard.\n\n'
            + 'The building sells well. It was always the best thing the company '
            + 'owned, which is a sentence somebody should have said out loud '
            + 'while there was still time to do anything about it.',
    },

    // ----------------------------------------------------------------------
    //  YOU BOUGHT PEAR
    // ----------------------------------------------------------------------
    //  The mirror of `soldToPear`, and it is deliberately built out of the
    //  same three pieces: a Tuesday, a footnote, and a fact about how long
    //  the rest of your life is. Somebody who has seen both should recognise
    //  the shape before they work out why.
    //
    //  The inversion is that every one of those pieces now falls the other
    //  way, and the last line is the point of the whole game. "Nobody ever
    //  found out whether you would have been any good at it" is what the
    //  early ending leaves you with. This one is the answer to that question,
    //  and the answer costs the length of a life to get.
    //
    //  It is NOT a victory lap. He does not concede, the letter that precedes
    //  it concedes nothing (see data/story/pearBought.ts), and the ending
    //  does not tell the player they won. It tells them what it cost and
    //  lets them decide, which is the only ending in the file that could
    //  reasonably be read either way.
    // ----------------------------------------------------------------------
    boughtPear: {
        id: 'boughtPear',
        title: 'YOU BOUGHT PEAR',
        body:
            'The money cleared on a Tuesday. It was not a fair price, and both '
            + 'of you signed it anyway.\n\n'
            + 'Vogel is out of the building by Friday. His name appears once in '
            + 'the integration report, in a footnote, spelled correctly, and '
            + 'somebody on your staff asks whether that is the right Vogel.\n\n'
            + 'You have the answer to the only question you ever really had. It '
            + 'took the whole of your life, and it turns out to be a smaller '
            + 'thing to hold than it was to want.',
    },
};

export const endingById = (id: string): Ending | undefined => ENDINGS[id];

/**
 * What the quarterly tick's terminal statuses are called here.
 *
 * The tick decides these two: capital went negative, or the board voted. It
 * has always decided them, and it should - they are the outcome of a quarter
 * of simulation rather than of anything anybody said in a conversation.
 *
 * What it must NOT do is carry its own copy of the words, which is what the
 * ternary in HomeScreen amounted to. This is the join: the tick names an id,
 * the screen renders whatever is under that id, and there is one place to
 * change if the writing changes.
 *
 * `endings.test.ts` checks both sides resolve. A status pointing at an ending
 * that does not exist would end the game on a blank screen, and it would do it
 * only to a player who had just gone bankrupt.
 */
export const ENDING_FOR_STATUS: Record<'bankrupt' | 'removed', string> = {
    bankrupt: 'wentBankrupt',
    removed: 'removedByBoard',
};
