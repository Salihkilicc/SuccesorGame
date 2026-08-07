// src/core/theme.ts
//
// ============================================================================
//  TEMA — notr koyu zemin, karakter vurgularda
// ============================================================================
//
//  ILK DENEMEDE HATA YAPILDI: Cocoa Brown (#31241F) dogrudan zemin yapildi.
//  %37 doygunlukta bir renk butun ekranin zemini olunca her sey ona boyanir
//  ve sonuc camurlu durur. Ustune 229 yerde saf siyah zemin duruyordu, yani
//  ekranlar arasinda sicak kahve ile saf siyah yan yana geliyordu.
//
//  Arastirmanin soyledigi iki kural (Material, Toptal, UX Planet):
//
//    1) SAF SIYAH KULLANILMAZ. Beyaz metinle asiri kontrast yapar, goz
//       yorar ve OLED'de "halation" denen tasma olusur. Taban #121212
//       civari bir koyu notr olmali.
//    2) DERINLIK GOLGEYLE DEGIL, ZEMINI ACARAK anlatilir — 4-6 kademe.
//       Doygun renk ZEMIN degil VURGU olur.
//
//  Bu yuzden Cocoa'nin HUE'SU korundu ama doygunlugu kirildi: zemin hala
//  sicak, ama notr. Dort renk artik zemin degil, o zeminin uzerinde duran
//  karakter. Olculdu: notr zeminde Shilo 8.7 -> 11.2, Danube 4.5 -> 5.8
//  kontrast kazandi. Zemin onlarla yarismayi birakinca renkler parladi.
//
//  KURAL: bilesenler hex yazmaz, buradaki jetonu kullanir.
//
// ============================================================================

/** Oyuncunun sectigi dort renk. Zemin degil, KARAKTER. */
export const palette = {
    cocoa: '#31241F',   // sicak dolgu, kart aksani
    torea: '#0A2A92',   // buton dolgusu
    danube: '#5992C6',  // bilgi, ikincil
    shilo: '#E9B8C9',   // vurgu, prestij
} as const;

export const theme = {
    colors: {
        // --- Zemin: Cocoa hue'su, doygunluk kirik, 5 kademe --------------
        //     Yukari ciktikca aciliyor. Golge degil, aciklik = yukseklik.
        background: '#0F0E0D',
        surface: '#181614',
        surfaceRaised: '#201D1C',
        surfaceHigh: '#2A2624',
        border: 'rgba(237,232,228,0.10)',
        borderStrong: '#3B3632',

        // --- Metin: saf beyaz DEGIL (halation) ---------------------------
        textPrimary: '#EDE8E4',
        textSecondary: '#B9AFA9',
        textMuted: '#8A807B',

        // --- Eylem: Torea dolgu, ustune yumusak beyaz --------------------
        primary: '#0A2A92',
        primaryText: '#EDE8E4',
        primaryHover: '#123AB8',

        // --- Bilgi / ikincil ---------------------------------------------
        accent: '#5992C6',
        accentSoft: 'rgba(89,146,198,0.16)',

        // --- Vurgu: ekranda one cikmasi gereken sayi ---------------------
        highlight: '#E9B8C9',
        highlightSoft: 'rgba(233,184,201,0.14)',

        // --- Sicak dolgu: kart aksani, secili durum ----------------------
        warm: '#31241F',
        warmSoft: 'rgba(49,36,31,0.55)',

        // ------------------------------------------------------------------
        //  KAR / ZARAR — anlam renkleri, dort rengin disinda
        // ------------------------------------------------------------------
        //  Dekorasyon degil VERI. Yesil/kirmizi ogrenilmis bir refleks ve
        //  finans oyununda onu paletin hatiri icin feda etmek okunurlugu
        //  dusurur. Doygunluklari kirildi ki notr zemine otursunlar.
        // ------------------------------------------------------------------
        positive: '#5FB37A',
        negative: '#E06B6B',
        warning: '#E3A857',
        neutral: '#8A807B',

        // Eski adlar — kademeli gecis
        card: '#181614',
        cardSoft: '#201D1C',
        success: '#5FB37A',
        danger: '#E06B6B',
        error: '#E06B6B',
    },

    /** Yukseklik: zemin ne kadar acilirsa o kadar yukarida. */
    elevation: {
        flat: '#0F0E0D',
        low: '#181614',
        mid: '#201D1C',
        high: '#2A2624',
    },

    radius: { xs: 6, sm: 10, md: 14, lg: 20, pill: 999 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    typography: { display: 34, title: 28, subtitle: 16, body: 14, caption: 12, micro: 10 },
} as const;
