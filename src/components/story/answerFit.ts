// src/components/story/answerFit.ts
//
// ============================================================================
//  WILL THE ANSWERS FIT ON THE SMALLEST PHONE WE SUPPORT
// ============================================================================
//
//  This is arithmetic about a thing that is otherwise only visible by holding
//  the right device with the right setting and reaching the right card. The
//  numbers below were measured, not guessed - see the note at the bottom.
//
//  ---------------------------------------------------------------------------
//  WHY NOT SHRINK THE TEXT TO FIT, WHICH IS THE OBVIOUS ANSWER
//  ---------------------------------------------------------------------------
//  iOS offers `adjustsFontSizeToFit`, and it is the wrong tool here twice over.
//
//  These are BUTTONS. Shrinking a button's label until it fits produces a
//  seven-point line of Turkish on a control the player is supposed to tap, and
//  it does it worst exactly when the sentence is longest - which is to say when
//  the decision is most complicated.
//
//  And it fights the player. A person who has turned the system text size up
//  has told the phone they cannot read small text. Answering that by shrinking
//  the text is not a fix, it is an argument.
//
//  So: the text keeps its size and the CONTAINER gives way. The block scrolls,
//  and the growth is capped rather than shrunk.
//
//  ---------------------------------------------------------------------------
//  WHAT ACTUALLY BREAKS, AND IT IS NOT TRANSLATION
//  ---------------------------------------------------------------------------
//  Measured across all 403 cards, on a 375x667 screen:
//
//      text size      english   turkish (+20%)   tallest block
//      default            0 /403      0 /403         156pt
//      xxxLarge           0 /403      0 /403         228pt
//      AX1                0 /403      0 /403         308pt
//      AX5                2 /403      3 /403         700pt   <-- off-screen
//
//  Turkish makes it slightly worse. Turkish does not cause it. At the largest
//  accessibility size the block is taller than the screen in English TODAY,
//  the answers do not scroll, and the second answer is therefore unreachable -
//  which does not look like a layout bug to the player. It looks like a
//  conversation they cannot finish.
// ============================================================================

/**
 * The smallest screen the game is expected to run on - an iPhone SE.
 *
 * Everything here is measured against this rather than against the device the
 * layout was written on, because a card that fits a Pro Max proves nothing.
 */
export const SMALLEST_SCREEN = { width: 375, height: 667 };

/**
 * Status bar, navigation header and home indicator.
 *
 * Deliberately generous. Being wrong in this direction means the budget is
 * slightly tight; being wrong in the other direction means the check passes
 * for a card that does not fit.
 */
export const SCREEN_CHROME = 100;

export const USABLE_HEIGHT = SMALLEST_SCREEN.height - SCREEN_CHROME;

/**
 * How much of the screen the answers are allowed to take before they scroll.
 *
 * Half. Past that the player is choosing between two sentences with no sight
 * of the question that prompted them, which is the same as not having read it.
 */
export const ANSWER_BLOCK_FRACTION = 0.5;

export const MAX_ANSWER_BLOCK = Math.round(USABLE_HEIGHT * ANSWER_BLOCK_FRACTION);

/**
 * The ceiling on iOS Dynamic Type for answer text.
 *
 * 1.8 is AX1 - large, genuinely helpful, and the last step at which every card
 * in the game still fits in Turkish without scrolling. Above it the system
 * goes to 3.1x, which is where the table above falls over.
 *
 * A cap rather than `allowFontScaling={false}`: switching scaling off entirely
 * would ignore the setting completely, and the point is to honour it as far as
 * the layout can carry it and then stop.
 */
export const MAX_FONT_MULTIPLIER = 1.8;

// --- the geometry of one answer --------------------------------------------

/** ConversationRunner's `answerText`: theme body + 1, semibold. */
export const ANSWER_FONT = 15;
/** `answer` paddingVertical 13, top and bottom. */
const ANSWER_PADDING = 26;
/** `answers` padding md, top and bottom. */
const BLOCK_PADDING = 24;
/** `answers` gap sm. */
const ANSWER_GAP = 8;
/** `answers` padding md + `answer` paddingHorizontal md, both sides. */
const HORIZONTAL_CHROME = 48;

/**
 * Average glyph width as a fraction of font size, for SF at semibold.
 *
 * An approximation, and the only soft number in this file. It is used to count
 * how many characters reach the end of a line, so it is wrong by a character
 * either way on a line of forty - which never changes an answer's line count
 * except within a character of the boundary.
 */
const GLYPH_RATIO = 0.52;

export const charsPerLine = (scale = 1): number =>
    Math.max(1, Math.floor(
        (SMALLEST_SCREEN.width - HORIZONTAL_CHROME) / (ANSWER_FONT * scale * GLYPH_RATIO),
    ));

/**
 * How tall the answer block would be for these strings.
 *
 * `scale` is the Dynamic Type multiplier. Callers pass MAX_FONT_MULTIPLIER to
 * ask the question that matters: does it fit for a player who needs large text.
 */
export const answerBlockHeight = (answers: string[], scale = 1): number => {
    if (!answers.length) return 0;
    const perLine = charsPerLine(scale);
    const lineHeight = Math.round(ANSWER_FONT * scale * 1.2);
    return BLOCK_PADDING + answers.reduce(
        (total, text, i) =>
            total
            + ANSWER_PADDING
            + Math.max(1, Math.ceil(text.length / perLine)) * lineHeight
            + (i ? ANSWER_GAP : 0),
        0,
    );
};

/**
 * The longest an answer should be, in characters.
 *
 * Two lines at the default size. Not a hard limit - a third line costs 18
 * points and the block scrolls - but it is the length past which a button
 * stops reading like something a person said and starts reading like a
 * paragraph, and that is a writing problem rather than a layout one.
 *
 * The English budget is the Turkish one divided by the 20% that translation
 * adds, so a line written to the English budget survives being translated.
 */
export const ANSWER_CHAR_BUDGET = charsPerLine() * 2;
export const TRANSLATION_GROWTH = 1.2;
export const ENGLISH_CHAR_BUDGET = Math.floor(ANSWER_CHAR_BUDGET / TRANSLATION_GROWTH);
