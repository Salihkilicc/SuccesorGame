// src/core/theme.ts
//
// ============================================================================
//  THEME — blue / grey, one rule per job
// ============================================================================
//
//  The palette:
//    #05A8F6  bright blue
//    #7DD3FC  light blue
//    #0C6C9C  deep blue
//    #8C9494  grey
//    #CFD0D2  light grey
//    #1C242C  near-black    -> the ground
//
//  Three rules hold this together. Everything below is downstream of them.
//
//  1) TEXT IS ONLY EVER WHITE OR BLACK, and which one is not a taste
//     decision - it is decided by what the text sits on. Measured against
//     each fill:
//
//        fill       black   white   -> takes
//        #05A8F6     7.94    2.65      BLACK
//        #7DD3FC    12.60    1.67      BLACK
//        #0C6C9C     3.64    5.77      WHITE
//        #8C9494     6.78    3.10      BLACK
//        #CFD0D2    13.61    1.54      BLACK
//        #1C242C     1.34   15.69      WHITE
//
//     So `onLight` is black and is used on every light fill. No third text
//     colour exists; the muted forms are white at reduced alpha, which is
//     still white.
//
//  2) ANYTHING SITTING ON THE GROUND MUST BE A DIFFERENT TONE FROM IT.
//     The previous theme failed exactly here - every card was within 1.02 of
//     the background, so the screen read as one flat sheet. The ladder below
//     is solved for separation, and each rung clears its neighbour too:
//
//        surface        #323A40   1.36 from ground, 1.36 from the rung below
//        surfaceRaised  #434B50   1.76                1.30
//        surfaceHigh    #535B5F   2.26                1.28
//
//  3) A COLOUR THAT MEANS SOMETHING MEANS ONE THING, AND IT IS A SENTENCE.
//     Not a category, not a mood - a sentence you could say out loud. If a
//     colour needs two sentences it is two colours, and if two colours share
//     a sentence one of them is decoration.
//
//        positive    #4ADE80   "you made money."
//        negative    #FF8A8A   "this is costing you."
//        brand       #FFA94D   "this is brand value."
//        brandMuted  #D6A96C   "this is a section heading."
//        rp          #C4B5FD   "this is research."
//        up          #05A8F6   "this went the way you want."
//        down        #8C9494   "nothing good is happening here."
//
//     NEGATIVE WIDENED, AND ON PURPOSE. It used to mean strictly "loss". It
//     now also covers a wall you have hit - 99% capacity, a breached
//     covenant. That is not two meanings: a loss and a ceiling are the same
//     sentence, "this is costing you". The old rule existed because red kept
//     leaking in as DECORATION (the back arrow, six of seven credit grades,
//     the share price). That ban is untouched: red is still never a fill and
//     never a border.
//
//     Contrast against the four rungs of rule 2. The obvious #22C55E /
//     #EF4444 pair does not survive this ground - red fell to 2.36 on a
//     raised card - so these were solved for it instead:
//
//                     ground  surface  raised   high
//        positive      9.01     6.64     5.10   3.98
//        negative      6.92     5.10     3.92   3.05
//        brand         8.25     6.08     4.67   3.64
//        brandMuted    7.29     5.37     4.13   3.22
//        rp            8.50     6.27     4.82   3.75
//        up            5.93     4.37     3.36   2.62  <- see below
//        down          5.07     3.74     2.87   2.24  <- see below
//
//     `up` and `down` are the only two that do not clear 3.0 on every rung,
//     because they are the palette's own blue and grey rather than colours
//     invented for the job. They are legible on the ground, on `surface` and
//     on `surfaceRaised`; on `surfaceHigh` they are not. Audit pass 0f fails
//     below 3.0, so this is caught rather than remembered.
//
//     WHY `up` IS THE BUTTON BLUE AND NOT THE LIGHT ONE: the light blue is
//     already `warning`. A number that went the right way and a caution
//     cannot be the same colour, so `up` takes the darker blue and pays for
//     it with the surfaceHigh restriction above.
//
//  4) BRAND IS TWO TONES, AND THE DIFFERENCE IS SATURATION.
//     Brand value is vivid orange; section headings are the same hue washed
//     out to about half saturation. Same family, so the app looks composed;
//     different saturation, so the eye does not read "Operations" as a
//     figure. If they shared a tone, every heading would look like data.
//
//  5) CATEGORY COLOURS ARE NOT IN `colors`. They live in `theme.categories`
//     and they are wayfinding, not meaning: the thin rule under a screen
//     header, so you know which part of the app you are in before you read
//     the title. Being a separate namespace is the guard - you cannot reach
//     for one as a text colour by accident, and the audit enforces the
//     mirror of rule 3: signal tokens are TEXT only, category tokens are
//     LINE only.
//
//     Their hues avoid the profit green and the loss red entirely. A
//     wayfinding colour that looks like a signal is worse than no colour.
//
//  RULE: components use tokens, never hex.
//
// ============================================================================

export const palette = {
    blue: '#05A8F6',
    blueLight: '#7DD3FC',
    blueDeep: '#0C6C9C',
    grey: '#8C9494',
    greyLight: '#CFD0D2',
    ink: '#1C242C',

    /** Brand value, and its washed-out form for section headings. */
    orange: '#FFA94D',
    orangeMuted: '#D6A96C',
    /** Research points. */
    violet: '#C4B5FD',
} as const;

export const theme = {
    colors: {
        // --- The ground and the ladder above it ---------------------------
        background: '#1C242C',
        surface: '#323A40',
        surfaceRaised: '#434B50',
        surfaceHigh: '#535B5F',
        border: 'rgba(255,255,255,0.10)',
        borderStrong: '#666E70',

        // --- Text: white or black, nothing else ---------------------------
        //  The two muted forms are white with alpha, so they stay "white" -
        //  they are not a third colour, they are the same colour turned down.
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.72)',
        textMuted: 'rgba(255,255,255,0.50)',

        /** Text on ANY light fill. Black, because every light fill measured
         *  above prefers it by a wide margin. */
        onLight: '#000000',

        // --- Buttons ------------------------------------------------------
        //  One colour per rank, so a button's job is legible before its label
        //  is read. Primary is the bright blue and therefore takes black;
        //  the sub-button is the deep blue and therefore takes white.
        primary: '#05A8F6',
        primaryText: '#000000',
        secondary: '#0C6C9C',
        secondaryText: '#FFFFFF',

        /** Selected / active state. Light, so black text. */
        highlight: '#7DD3FC',
        highlightText: '#000000',

        // --- Accents ------------------------------------------------------
        //  `accent` is a FILL, `accentText` is what you write on the dark
        //  ground when you want the same emphasis. They are deliberately
        //  different tones: the fill's own colour is unreadable as text.
        accent: '#05A8F6',
        /** Deliberately white, not a blue. Emphasis is carried by weight and
         *  placement here, because the rule is that text is white or black -
         *  a third text colour is how the old theme drifted. */
        accentText: '#FFFFFF',
        accentSoft: 'rgba(5,168,246,0.18)',
        highlightSoft: 'rgba(125,211,252,0.16)',

        /** Caution and destructive actions - one colour, every time. Blue
         *  rather than red, because red is spoken for: see rule 3. */
        warning: '#7DD3FC',
        destructive: '#0C6C9C',

        /** Disabled buttons. Grey and LIGHT on purpose: a button's label does
         *  not change colour when it greys out, so the disabled fill has to
         *  stay on the same side of rule 1 as the enabled one. */
        disabled: '#8C9494',

        // ==================================================================
        //  THE SEVEN THAT MEAN SOMETHING
        // ==================================================================
        //  Each is one sentence (rule 3). All seven are TEXT colours: a fill
        //  or a border using any of them is decoration wearing a signal's
        //  clothes, and audit pass 0d2 fails on it.
        // ==================================================================

        /** "You made money." Profit, and nothing that merely feels good. */
        positive: '#4ADE80',
        /**
         * "This is costing you." A loss, or a ceiling you have hit - 99%
         * capacity, a breached covenant. Deliberately wider than it was;
         * see rule 3. Still never a fill and never a border.
         */
        negative: '#FF8A8A',

        /** "This is brand value." The figure itself, wherever it appears. */
        brand: '#FFA94D',
        /**
         * "This is a section heading." Operations, Quick Actions, and their
         * kind. The same hue as `brand` at roughly half the saturation, so
         * headings sit in the family without reading as figures.
         */
        brandMuted: '#D6A96C',
        /**
         * "somebody is teaching you."
         *
         * The tutorial card's ground, and a NEW SENTENCE rather than a shade
         * of an old one - which is the only thing that earns a colour a place
         * here (rule 3 above).
         *
         * It was `surfaceRaised`, so an instruction from a person looked
         * exactly like every other card in the app: the same grey, on a
         * dimmed screen, with no signal that this one was not part of the
         * game. The player had to read it to find out what it was.
         *
         * Same hue as `brandMuted`, which is deliberate twice over - the app
         * stays composed, and the speaker's name on that card is already
         * brandMuted, so the label and its ground are one family.
         *
         * VIOLET RATHER THAN THE TOBACCO IT WAS FOR AN HOUR. The tobacco
         * was the right family for a heading and the wrong one for this: it
         * is now doing a different job (see `unread` below), and one hue
         * cannot carry two sentences - which is rule 3, and the rule this
         * file was written around.
         *
         * Violet is also already research's hue, and the relation is not an
         * accident: `rp` means "this is a thing you invest in and get back
         * later", and so does a lesson.
         *
         * Dark rather than light because it is a FILL and this app's fills
         * carry white text. `rp` itself measures 1.85:1 against white and is
         * unusable as a ground; this measures 7.65, and 2.05 from the
         * ground, which separates the card better than surfaceRaised's 1.76
         * ever did.
         */
        guidance: '#584A87',
        /**
         * "there is something here you have not read."
         *
         * The unread badge on Messages and Mail, which was `notification`
         * red. Red on a badge is the convention every phone uses and it is
         * the wrong convention HERE: this game keeps red for one sentence,
         * "this is costing you", and a message you have not opened is not
         * costing you anything.
         *
         * Tobacco, and LIGHT tobacco with dark text on it. The dark tobacco
         * was asked for and does not survive measurement as a badge - it
         * separates from the surface it sits on by 1.61, so the badge would
         * be a slightly warmer patch of the same darkness and nobody would
         * see it. A badge that is not noticed is not a badge.
         *
         *      #6B5335  dark    1.61 from surface   - invisible
         *      #A8834F          3.32
         *      #D6A96C  light   5.37               - chosen, 7.29 dark text
         *
         * Same value as brandMuted on purpose: this is a fill and that is a
         * text colour, so they never appear in the same role, and the app
         * gets one tobacco rather than two that nearly match.
         */
        unread: '#D6A96C',

        /** "This is research." RP, the letters RP, research spend, upgrades. */
        rp: '#C4B5FD',

        /**
         * "This went the way you want." A rising figure, an affordable
         * price, demand fully served.
         *
         * The same hex as `primary`, and that is not an oversight: one is a
         * button, one is a verdict on a number. Separate tokens because the
         * job should be greppable, same hex because inventing a second blue
         * is how a palette starts drifting.
         *
         * NOT legible on `surfaceHigh` (2.62). See rule 3.
         */
        up: '#05A8F6',
        /**
         * "Nothing good is happening here." A falling figure, a price you
         * cannot afford, an inactive row. Shares its hex with `disabled`
         * because it shares its sentence.
         *
         * NOT legible on `surfaceRaised` or above (2.87). See rule 3.
         */
        down: '#8C9494',

        // ==================================================================
        //  THE ONE RED THAT IS A FILL
        // ==================================================================
        //  An unread badge. It breaks the shape of rule 3 - red is a text
        //  colour and never a fill - so it needs an argument rather than an
        //  exception.
        //
        //  THE ARGUMENT: a notification badge is not this game's red saying
        //  something. It is a convention the player already knows from every
        //  phone they have ever held, and it is the only place in the app
        //  where a colour is doing a job the player learned somewhere else.
        //  Painting it blue would be internally consistent and would read as
        //  decoration.
        //
        //  WHY IT IS NOT `negative`. Two different reds doing two different
        //  jobs is the drift this palette was built to stop, so these are kept
        //  apart deliberately: `negative` is a soft pink-red chosen to be
        //  READ on a dark ground and is never a fill; this is a saturated red
        //  chosen to be a fill and is never text. They never appear in the
        //  same role, so neither can be mistaken for the other.
        //
        //  #D32F2F is measured, not picked. White digits on it read 4.98, and
        //  the badge itself reads 3.15 against the ground - the only rung
        //  that clears both. #FF3B30 (iOS) gives white 3.55, too low for
        //  10pt digits; anything darker than this disappears into the bar.
        // ==================================================================
        notification: '#D32F2F',
        notificationText: '#FFFFFF',

        // ==================================================================
        //  AVATAR TINTS — identity, and nothing else
        // ==================================================================
        //  Eight light fills whose only job is telling one sender from
        //  another at a glance. They carry NO meaning: a green avatar is not
        //  a good sender, which is exactly why the signal seven may not be
        //  used here. Reusing `rp` violet for an avatar would quietly teach
        //  the player that violet sometimes means research and sometimes
        //  means Marisol.
        //
        //  WHY THEY LIVE HERE. There was a hardcoded array of eight hexes
        //  in MailScreen.tsx and a second copy of the same array in
        //  MailDetailScreen.tsx, so the same person could be drawn in two
        //  colours depending on which screen you were on. One of the eight,
        //  '#85DCB', is FIVE digits - not a colour at all - so one sender in
        //  eight got whatever React Native does with a malformed hex.
        //
        //  ALL EIGHT TAKE BLACK. Measured, lowest is 10.34:1; white on them
        //  ranges 1.45 to 2.03, and white is what both screens were using.
        //  Every avatar in the mail app was below the contrast floor and
        //  nothing reported it, because the fill comes out of a function and
        //  the audit can only read tokens.
        // ==================================================================
        avatarTints: [
            '#F0A48A', // coral    10.38 on black
            '#F2C89B', // sand     13.51
            '#D9A9BB', // rose     10.34
            '#7DD3C8', // teal     12.02
            '#F2D479', // wheat    14.47
            '#9DC4F0', // sky      11.59
            '#C9B8F5', // lilac    11.66
            '#A8D8A0', // sage     12.99
        ] as string[],

        // Legacy names, still in wide use. `success` and `danger` are now
        // strictly TEXT colours: they carry the profit/loss signal, so a
        // fill may never use them.
        success: '#4ADE80',
        danger: '#FF8A8A',
        error: '#FF8A8A',

        card: '#323A40',
        cardSoft: '#434B50',
        neutral: 'rgba(255,255,255,0.50)',
        lavender: '#CFD0D2',
    },

    // ======================================================================
    //  CATEGORY COLOURS — wayfinding, not meaning
    // ======================================================================
    //  The thin rule under a screen header. Their whole job is "you are in a
    //  different part of the app now", which is why they carry no valence:
    //  there is no good or bad colour in this set, only a different one.
    //
    //  They sit in their own namespace so they cannot be picked up as a text
    //  colour by accident, and so the audit can enforce the mirror of rule 3
    //  - signal tokens are text only, these are line only.
    //
    //  HUES ARE SPACED, AND TWO ARE FORBIDDEN. Nothing here sits near the
    //  profit green or the loss red; a wayfinding colour that reads as a
    //  signal is worse than no colour at all. What is left, in order round
    //  the wheel: 48 yellow, 176 teal, 199 blue, 230 indigo, 258 violet,
    //  320 pink.
    //
    //  Contrast on the ground, where a header rule actually sits. WCAG asks
    //  3.0 of a graphical object; the tightest here is research at 5.77.
    //
    //     company   #05A8F6  5.93     research  #A78BFA  5.77
    //     finance   #EFC94C  9.81     people    #F09BD0  7.70
    //     products  #3FC9C0  7.72     market    #93A0F7  6.44
    //
    //  RESEARCH IS THE RP VIOLET, one step more saturated. That repetition
    //  is the only one in the set and it is deliberate: the research section
    //  and the research figure should look related.
    // ======================================================================
    categories: {
        /** My Company, My Empire. */
        company: '#05A8F6',
        /** Finance, Borrow, Repay, the financial report. */
        finance: '#EFC94C',
        /** Products and everything made in them. */
        products: '#3FC9C0',
        /** R&D, the laboratory, the tech tree. */
        research: '#A78BFA',
        /** The board, team morale - the screens that are about people. */
        people: '#F09BD0',
        /** The stock market, takeovers. */
        market: '#93A0F7',
        /** Home, settings, profile - anywhere with no section of its own. */
        neutral: '#666E70',
    },

    elevation: {
        flat: '#1C242C',
        low: '#323A40',
        mid: '#434B50',
        high: '#535B5F',
    },

    radius: { xs: 6, sm: 10, md: 14, lg: 20, pill: 999 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    typography: { display: 34, title: 28, subtitle: 16, body: 14, caption: 12, micro: 10 },
} as const;

/**
 * Which tint a sender gets. Stable for a given name.
 *
 * ONE implementation, because there were two: MailScreen and MailDetailScreen
 * each carried their own copy of the palette and the hash, so opening a mail
 * could redraw the sender in a different colour than the list had just shown.
 * The same person, two identities, one tap apart.
 *
 * The initials on top are `colors.onLight` - every tint is a light fill and
 * all eight prefer black by at least 10:1. Both screens were writing white.
 */
export const avatarTintFor = (name: string): string => {
    const tints = theme.colors.avatarTints;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return tints[Math.abs(hash) % tints.length];
};
