// src/core/market/useMarketPosition.ts
//
// ============================================================================
//  PAZAR KONUMU — oyuncunun payini GERCEK satistan hesaplar
// ============================================================================
//
//  ONEMLI: Oyuncunun payi uydurma bir sayi DEGIL. Son tamamlanan ceyrekte
//  o kategoride kac adet sattiysa, pazar buyuklugune bolunuyor:
//
//      pay = satilan adet / pazar buyuklugu
//
//  Yani ekranda gordugun pay senin kararlarinin sonucu.
//
//  MOTOR ARTIK BAGLI: useGameStore.advanceMonth talebi core/market/attraction.ts
//  uzerinden hesapliyor — talep artik uretimden turetilmiyor. Bu dosya o
//  sonucun GERCEKLESEN halini gosterir (kac adet gercekten satildi).
//
//  Ikisi arasindaki fark anlamlidir: talep 400 iken 100 sattiysan
//  buradaki pay 100 uzerinden cikar, cunku pazardaki gercek varligin bu.
//
// ============================================================================

import { useGameStore } from '../store/useGameStore';
import { normalizeQuarterReport } from '../reportTypes';
import {
    getMarket,
    competitorShareTotal,
    PRODUCT_MARKETS,
    type MarketCategory,
    type ProductMarket,
} from './productMarkets';

export interface MarketPlayer {
    id: string;
    name: string;
    symbol?: string;
    share: number;
    strength?: number;
    isPlayer: boolean;
}

export interface MarketPosition {
    market: ProductMarket;
    /** Bu kategoride son ceyrek satilan toplam adet */
    unitsSold: number;
    /** Oyuncunun payi (yuzde) */
    playerShare: number;
    /** Rakipler + oyuncu, paya gore azalan sirali */
    ranking: MarketPlayer[];
    /** Oyuncunun siradaki yeri (1 = lider) */
    playerRank: number;
    /** Kimseye ait olmayan pay — "digerleri" */
    unclaimedShare: number;
}

/**
 * Rakip paylarini, oyuncunun payi da dahil toplam %100 olacak sekilde olcekler.
 *
 * Neden: rakip paylari veride elle yazili ve toplami ~%97. Oyuncu buyudukce
 * birinden pay almasi gerekir, yoksa toplam %100'u asar ve tablo sacmalar.
 * Oyuncunun payi rakiplerden ORANTILI olarak dusulur.
 */
const buildRanking = (market: ProductMarket, playerShare: number): MarketPlayer[] => {
    const rawCompetitorTotal = competitorShareTotal(market);
    const availableForCompetitors = Math.max(0, 100 - playerShare);
    // Rakipler kalan alana sigacak sekilde orantili kucultulur.
    const scale = rawCompetitorTotal > 0
        ? Math.min(1, availableForCompetitors / rawCompetitorTotal)
        : 0;

    const players: MarketPlayer[] = market.competitors.map(c => ({
        id: c.stockId,
        name: c.name,
        symbol: c.symbol,
        share: c.share * scale,
        strength: c.strength,
        isPlayer: false,
    }));

    players.push({
        id: 'player',
        name: 'Your Company',
        share: playerShare,
        isPlayer: true,
    });

    return players.sort((a, b) => b.share - a.share);
};

/** Tek bir kategorinin pazar konumunu hesaplar. */
export const getMarketPosition = (
    category: string | undefined,
    productLines: { category?: string; sold: number }[],
): MarketPosition | null => {
    const market = getMarket(category);
    if (!market) return null;

    const unitsSold = productLines
        .filter(line => line.category === market.category)
        .reduce((sum, line) => sum + (line.sold || 0), 0);

    const rawShare = market.sizeUnitsPerQuarter > 0
        ? (unitsSold / market.sizeUnitsPerQuarter) * 100
        : 0;
    // %100'u asamaz; pazardan fazla satamazsin.
    const playerShare = Math.min(100, rawShare);

    const ranking = buildRanking(market, playerShare);
    const playerRank = ranking.findIndex(p => p.isPlayer) + 1;
    const claimed = ranking.reduce((sum, p) => sum + p.share, 0);

    return {
        market,
        unitsSold,
        playerShare,
        ranking,
        playerRank,
        unclaimedShare: Math.max(0, 100 - claimed),
    };
};

/**
 * Bir urunun kategorisindeki pazar konumu.
 * Son tamamlanan ceyregin verisini kullanir; hic ceyrek gecilmediyse
 * pay 0 gorunur (dogru davranis — henuz hicbir sey satmadin).
 */
export const useMarketPosition = (category: string | undefined): MarketPosition | null => {
    const report = normalizeQuarterReport(useGameStore(state => state.lastQuarterReport));
    return getMarketPosition(category, report?.products ?? []);
};

/** Tum kategorilerin konumu — genel bakis ekranlari icin. */
export const useAllMarketPositions = (): MarketPosition[] => {
    const report = normalizeQuarterReport(useGameStore(state => state.lastQuarterReport));
    const lines = report?.products ?? [];
    return PRODUCT_MARKETS
        .map(m => getMarketPosition(m.category, lines))
        .filter((p): p is MarketPosition => p !== null);
};

export type { MarketCategory };
