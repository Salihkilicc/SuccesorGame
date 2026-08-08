// src/core/theme.ts
//
// ============================================================================
//  TEMA — mor/lacivert, oyuna has palet
// ============================================================================
//
//  Oyuncunun secimi:
//    Violet Eggplant  #BA04BD
//    Purple           #8504BD
//    Purple           #6004BD
//    Dark Blue        #2304BD
//    Deep Cove        #020626   -> zemin
//
//  OLCUM SONUCU IKI KISIT:
//
//  1) DORT MORUN HICBIRI METIN OLAMAZ. Deep Cove uzerinde kontrastlari
//     1.73 - 3.63, hepsi 4.5 esiginin altinda. Dolgu olurlar (ustlerine beyaz
//     gelir, 5.5 - 11.5), yazi olmazlar. Metin gereken yerde ayni tonun
//     ACIK TUREVI kullanilir; asagidaki `...Text` jetonlari odur.
//
//  2) PALETTE YESIL DE KIRMIZI DA YOK. Kar/zarar icin renk ekseninde en uzak
//     iki uc secildi ve ACIKLIK ekseninde de ayrildi:
//
//        pozitif  #C8C0EF  acik lavanta   kontrast 11.6
//        negatif  #C836CA  magenta        kontrast  4.6
//
//     Renk farki dE 71, aciklik farki 29 L*. Karsilastirma: yesil/kirmizi
//     dE 84 ama aciklik farki yalnizca 7. Yani bu cift renk ayriminda biraz
//     geride, aciklik ayriminda ONDE — toplamda okunur bir cift.
//
//  KURAL: bilesenler hex yazmaz, jetonu kullanir.
//
// ============================================================================

export const palette = {
    eggplant: '#BA04BD',
    purple: '#8504BD',
    purpleDeep: '#6004BD',
    blue: '#2304BD',
    cove: '#020626',
    /**
     * Violet Eggplant's mirror: rgb(186,4,189) with red and blue swapped
     * becomes rgb(4,189,186). Same saturation, opposite hue - so it belongs to
     * the palette by construction rather than by taste, and it gives the
     * magenta something to push against. That tension is what reads as
     * cyberpunk; without it the screen was purple on purple.
     */
    cyan: '#04BDBA',
    /** A tinted white rather than a signal - only dE 32 from white. */
    lavender: '#C8C0EF',
} as const;

export const theme = {
    colors: {
        // --- Zemin: Deep Cove, mor yonunde kademeli acilarak --------------
        background: '#020626',
        surface: '#07062E',
        surfaceRaised: '#0B0635',
        surfaceHigh: '#11063D',
        border: 'rgba(255,255,255,0.08)',
        borderStrong: '#1A0A4A',

        // --- Yazi ----------------------------------------------------------
        textPrimary: '#FFFFFF',
        textSecondary: '#C8C0EF',
        textMuted: 'rgba(255,255,255,0.48)',

        // --- Dolgu butonlar: ustune BEYAZ ---------------------------------
        primary: '#6004BD',
        primaryText: '#FFFFFF',
        secondary: '#2304BD',
        secondaryText: '#FFFFFF',
        highlight: '#BA04BD',
        highlightText: '#FFFFFF',

        // --- Vurgu METNI -------------------------------------------------
        //     Dolgu tonlari metin olarak okunmadigi icin bunlar var.
        accentText: '#04BDBA',
        highlightTextColor: '#C734CA',
        lavender: '#C8C0EF',

        accentSoft: 'rgba(35,4,189,0.22)',
        highlightSoft: 'rgba(186,4,189,0.18)',

        // ------------------------------------------------------------------
        //  KAR / ZARAR — ve baska hicbir sey
        // ------------------------------------------------------------------
        //  Cyan eklenince bu cift belirgin sekilde guclendi. Olculen
        //  ayirt edilebilirlik (dE):
        //
        //    cyan - magenta        119     <- simdiki cift
        //    eski yesil - kirmizi   84
        //    lavanta - magenta      71     <- onceki cift
        //
        //  Yani kar/zarar artik yesil/kirmizidan bile daha ayrik. Lavanta bu
        //  isi birakti cunku beyazdan yalnizca dE 32 uzakti: sinyal degil,
        //  renkli beyaz olarak okunuyordu. Simdi ikincil metin rengi.
        // ------------------------------------------------------------------
        positive: '#04BDBA',
        negative: '#C836CA',

        // Eski adlar — kademeli gecis
        card: '#07062E',
        cardSoft: '#0B0635',
        success: '#04BDBA',
        danger: '#C734CA',
        error: '#C734CA',
        warning: '#C734CA',
        accent: '#04BDBA',
        neutral: 'rgba(255,255,255,0.48)',
    },

    elevation: {
        flat: '#020626',
        low: '#07062E',
        mid: '#0B0635',
        high: '#11063D',
    },

    radius: { xs: 6, sm: 10, md: 14, lg: 20, pill: 999 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    typography: { display: 34, title: 28, subtitle: 16, body: 14, caption: 12, micro: 10 },
} as const;
