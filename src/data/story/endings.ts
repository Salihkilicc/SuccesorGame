// src/data/story/endings.ts
//
// ============================================================================
//  THE WAYS IT CAN STOP
// ============================================================================
//
//  The game already had two endings and neither of them was data: `bankrupt`
//  and `removed` are strings compared inline in HomeScreen, with their text in
//  the translation file and their trigger buried in the quarterly tick. That
//  worked while there were two and stops working at three - which is now.
//
//  An ending here is a title, a body, and an id a story effect can name. The
//  audit checks that every `ending` effect points at one of these, the same
//  way it checks a `schedule` points at a real conversation, because the
//  failure is identical and worse: a scene offering an ending that does not
//  exist would take the player's decision and then do nothing with it.
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
            'The money cleared on a Tuesday. It was a fair price — Vogel does not '
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
};

export const endingById = (id: string): Ending | undefined => ENDINGS[id];
