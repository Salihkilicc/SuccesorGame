export const formatScreenTitle = (title: string) => title.trim();
export { getRandomEvent } from './randomEvent';

// ============================================================================
//  SAYI BICIMLENDIRME — tek kaynak
// ============================================================================
//  KURAL: Oyunda hicbir yerde ham `toLocaleString()` ile para basma.
//  1000000 degil 1.0M gorunmeli. Para icin formatMoney, adet/RP gibi
//  birimler icin formatNumber kullan.
// ============================================================================

/** Kisaltma esikleri. K esigi 10.000 — 1.5k yerine 1,500 daha okunur. */
const compact = (abs: number, fractionDigits: number): string | null => {
    if (abs >= 1_000_000_000_000) return `${(abs / 1_000_000_000_000).toFixed(fractionDigits)}T`;
    if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(fractionDigits)}B`;
    if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(fractionDigits)}M`;
    if (abs >= 10_000) return `${(abs / 1_000).toFixed(fractionDigits)}K`;
    return null;
};

const withThousands = (n: number): string =>
    n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Para: `$1.2M`, `$450K`, `$3,200`, `-$1.1B`.
 * Isaret dolar isaretinin ONUNDE durur (muhasebe okumasi icin dogrusu bu).
 */
export const formatMoney = (value: number | undefined | null): string => {
    const val = Number.isFinite(value as number) ? (value as number) : 0;
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    const short = compact(abs, 1);
    return short ? `${sign}$${short}` : `${sign}$${withThousands(abs)}`;
};

/**
 * Birimsiz sayi: `1.2M`, `450K`, `3,200`.
 * Adet, Ar-Ge puani, hisse gibi para OLMAYAN degerler icin.
 */
export const formatNumber = (value: number | undefined | null): string => {
    const val = Number.isFinite(value as number) ? (value as number) : 0;
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    const short = compact(abs, 1);
    return short ? `${sign}${short}` : `${sign}${withThousands(abs)}`;
};

/**
 * Hassas fiyat: `$12.34`, `$249.50`, `$1.2M`.
 *
 * formatMoney kurusu yuvarlar — hisse/kripto fiyatlarinda bu bilgi kaybi olur.
 * 1.000 dolarin altinda iki ondalik gosterir, ustunde kisaltmaya gecer.
 */
export const formatPrice = (value: number | undefined | null): string => {
    const val = Number.isFinite(value as number) ? (value as number) : 0;
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs < 1_000) {
        return `${sign}$${abs.toFixed(2)}`;
    }
    return formatMoney(val);
};

/** Yuzde: `12.4%`. */
export const formatPercent = (value: number | undefined | null, digits = 1): string => {
    const val = Number.isFinite(value as number) ? (value as number) : 0;
    return `${val.toFixed(digits)}%`;
};

/** Isaretli para: kar/zarar satirlari icin `+$1.2M` / `-$400K`. */
export const formatSignedMoney = (value: number | undefined | null): string => {
    const val = Number.isFinite(value as number) ? (value as number) : 0;
    return `${val >= 0 ? '+' : ''}${formatMoney(val)}`;
};
