// src/core/theme.ts
//
// ============================================================================
//  TEMA — dort renk, hepsi turetilmis
// ============================================================================
//
//  Palet oyuncunun secimi:
//
//    Cocoa Brown  #31241f   koyu, sicak    -> zemin
//    Torea Bay    #0a2a92   koyu, doygun   -> dolgu (metin TASIYAMAZ)
//    Danube       #5992c6   orta mavi      -> bilgi, ikincil, pozitif
//    Shilo        #e9b8c9   acik pembe     -> vurgu, onemli sayi, negatif
//
//  NEDEN BU DOSYA ONEMLI: projede 398 FARKLI renk, 2.760 kullanim vardi. Ayni
//  is icin uc altin (#FFD700, #D4AF37, #C5A059), dort kirmizi, alti arka plan
//  yan yana yasiyordu. Ekrandan ekrana gecerken hissedilen dagiklik buradan
//  geliyordu — cirkinlikten degil, TUTARSIZLIKTAN.
//
//  KURAL: bilesenler artik hex yazmaz. Buradaki jetonu kullanir. Yeni bir ton
//  gerekiyorsa once buraya eklenir, sonra kullanilir.
//
//  KONTRAST — hepsi olculdu, WCAG AA (4.5:1) esigi tutturuldu:
//
//    zemin uzerinde beyaz          15.0    tam okunur
//    zemin uzerinde Shilo           8.7    tam okunur
//    zemin uzerinde textMuted       5.1    tam okunur
//    zemin uzerinde Danube          4.5    tam okunur
//    zemin uzerinde Torea Bay       1.25   OKUNMAZ -> yalnizca dolgu
//    Torea dolgu uzerinde beyaz    11.9    tam okunur
//
//  Bu yuzden Torea Bay hicbir yerde metin rengi degildir. Dugme zemini,
//  secili durum ve gradyan sonu olarak kullanilir; ustune beyaz gelir.
//
// ============================================================================

/** Paletin kendisi. Baska hicbir yerde ham hex bulunmamali. */
export const palette = {
    cocoa: '#31241f',
    torea: '#0a2a92',
    danube: '#5992c6',
    shilo: '#e9b8c9',
} as const;

export const theme = {
    colors: {
        // --- Yuzeyler: Cocoa'dan Shilo yonunde acilarak turetildi ---------
        background: '#31241f',
        surface: '#3c2d29',
        surfaceRaised: '#473633',
        surfaceHigh: '#523f3e',
        border: 'rgba(233,184,201,0.14)',
        borderStrong: '#614a4b',

        // --- Metin: hepsi zemin uzerinde >=4.5 --------------------------
        textPrimary: '#FFFFFF',
        textSecondary: '#e9b8c9',
        textMuted: '#b28c96',

        // --- Eylem: Torea dolgu, ustune beyaz ---------------------------
        primary: '#0a2a92',
        primaryText: '#FFFFFF',
        primaryHover: '#12379f',

        // --- Bilgi / ikincil --------------------------------------------
        accent: '#5992c6',
        accentSoft: 'rgba(89,146,198,0.16)',

        // --- Vurgu: dikkat cekmesi gereken sayi -------------------------
        highlight: '#e9b8c9',
        highlightSoft: 'rgba(233,184,201,0.14)',

        // ------------------------------------------------------------------
        //  KAR / ZARAR
        // ------------------------------------------------------------------
        //  Bunlar dekorasyon degil VERI. Yesil/kirmizi okumasi ogrenilmis bir
        //  refleks; finans oyununda onu paletin hatiri icin feda etmek
        //  okunurlugu dogrudan dusurur. Bu yuzden dort rengin disinda tutuldu.
        //
        //  Doygunluklari kirildi ki sicak kahve zemine otursunlar: ekrandaki
        //  tek parlak sey kar/zarar rakamidir. Ikisi de AA gecti.
        // ------------------------------------------------------------------
        positive: '#5FB37A',
        negative: '#E06B6B',
        neutral: '#b28c96',

        // Eski adlar — kademeli gecis icin
        card: '#3c2d29',
        cardSoft: '#473633',
        success: '#5FB37A',
        danger: '#E06B6B',
        error: '#E06B6B',
        warning: '#E3A857',
    },

    /** Yukseklik: zemin ne kadar acilirsa o kadar "yukarida". */
    elevation: {
        flat: '#31241f',
        low: '#3c2d29',
        mid: '#473633',
        high: '#523f3e',
    },

    radius: { xs: 6, sm: 10, md: 14, lg: 20, pill: 999 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    typography: {
        display: 34,
        title: 28,
        subtitle: 16,
        body: 14,
        caption: 12,
        micro: 10,
    },
} as const;
