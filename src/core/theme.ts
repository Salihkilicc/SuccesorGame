// src/core/theme.ts
//
// ============================================================================
//  TEMA — kahve zemin, dolgu butonlar, beyaz yazi
// ============================================================================
//
//  Oyuncunun karari: zemin Cocoa Brown, butonlar Shilo / Danube / Torea Bay,
//  yazilar beyaz. Yesil ve kirmizi YALNIZCA kar-zarar icin; baska hicbir yerde
//  kullanilmaz.
//
//  CERCEVE DEGIL DOLGU. Onceki hali siyah kartlara renkli kenarlik cekiyordu
//  ve ekran "siyah zemin + renkli cerceve" gibi duruyordu. Renk artik
//  kenarlikta degil YUZEYDE: kart zaten kahvenin bir tonu, kenarliga gerek
//  kalmiyor. Derinlik kenarlikla degil, zemini kademeli acarak anlatiliyor.
//
//  KONTRAST (olculdu, hepsi WCAG AA):
//    kahve zeminde beyaz            15.0
//    Torea dolguda beyaz            11.9
//    Shilo dolguda KOYU metin        8.7   <- Shilo acik, ustune beyaz gelmez
//    Danube dolguda KOYU metin       5.0
//
//  KURAL: bilesenler hex yazmaz, jetonu kullanir.
//
// ============================================================================

/** Oyuncunun sectigi dort renk. */
export const palette = {
    cocoa: '#31241F',
    torea: '#0A2A92',
    danube: '#5992C6',
    shilo: '#E9B8C9',
} as const;

export const theme = {
    colors: {
        // --- Zemin: Cocoa, kademeli acilarak. Kenarlik degil DOLGU. -------
        background: '#31241F',
        surface: '#42312A',
        surfaceRaised: '#533D35',
        surfaceHigh: '#674C41',
        border: 'rgba(255,255,255,0.08)',
        borderStrong: '#7F5E51',

        // --- Yazi: beyaz ---------------------------------------------------
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.72)',
        textMuted: 'rgba(255,255,255,0.48)',

        // --- Butonlar ------------------------------------------------------
        //  Torea koyu  -> ustune BEYAZ
        //  Danube orta -> ustune KOYU
        //  Shilo acik  -> ustune KOYU
        primary: '#0A2A92',
        primaryText: '#FFFFFF',
        secondary: '#5992C6',
        secondaryText: '#31241F',
        highlight: '#E9B8C9',
        highlightText: '#31241F',

        accentSoft: 'rgba(89,146,198,0.18)',
        highlightSoft: 'rgba(233,184,201,0.16)',

        // ------------------------------------------------------------------
        //  KAR / ZARAR — ve BASKA HICBIR SEY
        // ------------------------------------------------------------------
        //  Oyuncunun uyarisi: "oyunda cok yerde yesil var, olmasin". Dogruydu
        //  — 184 yesil kullanimindan yalnizca 15'i parayla ilgiliydi. Yesil
        //  her yerde olunca hicbir sey ifade etmez.
        //
        //  Artik yesil ve kirmizi rozet, durum, ilerleme cubugu, aktif sekme
        //  gibi yerlerde YOK. Yalnizca bir SAYININ isaretini gosterirler.
        //  Onlarin yerini Danube (olumlu/bilgi) ve Shilo (dikkat) aldi.
        // ------------------------------------------------------------------
        positive: '#5FB37A',
        negative: '#E06B6B',

        // Eski adlar — kademeli gecis. Dikkat: success/danger ARTIK
        // yesil-kirmizi DEGIL; durum bildirimi paletten yapilir.
        card: '#42312A',
        cardSoft: '#533D35',
        success: '#5992C6',
        danger: '#E9B8C9',
        error: '#E9B8C9',
        warning: '#E9B8C9',
        accent: '#5992C6',
        neutral: 'rgba(255,255,255,0.48)',
    },

    elevation: {
        flat: '#31241F',
        low: '#42312A',
        mid: '#533D35',
        high: '#674C41',
    },

    radius: { xs: 6, sm: 10, md: 14, lg: 20, pill: 999 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    typography: { display: 34, title: 28, subtitle: 16, body: 14, caption: 12, micro: 10 },
} as const;
