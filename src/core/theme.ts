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
//  3) GREEN AND RED MEAN PROFIT AND LOSS. Nothing else. They are the only
//     two colours here that are not in the palette, and that is the point:
//     they are a signal, not decoration. They are also the reason no button
//     may be green - a green fill would make the signal ambiguous.
//
//     The obvious #22C55E / #EF4444 pair does not survive this ground. Red
//     in particular fell to 2.36 on a raised card. These clear every rung:
//
//        positive  #4ADE80    9.01 / 6.64 / 5.10 / 3.98
//        negative  #FF8A8A    6.92 / 5.10 / 3.92 / 3.05
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

        // ------------------------------------------------------------------
        //  PROFIT / LOSS — and nothing else
        // ------------------------------------------------------------------
        positive: '#4ADE80',
        negative: '#FF8A8A',

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
