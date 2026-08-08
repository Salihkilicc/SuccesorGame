import React from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet } from 'react-native';
import { useMarketPosition } from './useMarketPosition';
import { useStatsStore } from '../store/useStatsStore';
import { formatNumber, formatPercent } from '../utils';
import CollapsibleSection from '../../components/common/CollapsibleSection';
import InfoDot from '../../components/common/InfoDot';

// ============================================================================
//  PAZAR KONUMU PANELI
// ============================================================================
//  Urun detayinda gosterilir. Amac: oyuncunun "ben bu pazarda neredeyim"
//  sorusunu tek bakista cevaplamak.
//
//  Gosterilen pay UYDURMA DEGIL — son ceyrekte o kategoride satilan adedin
//  pazar buyuklugune oranı. Bkz. useMarketPosition.ts
//
//  NOT: Motor henuz bu payi kullanmiyor; talep hala uretimden turetiliyor.
//  Bu panel once sayilari gorunur kilmak icin var.
// ============================================================================

/** Pay yuzdesini okunur bicimde yazar: kucuk paylarda daha cok ondalik. */
const formatShare = (share: number): string => {
    if (share === 0) return '0%';
    if (share < 0.1) return `${share.toFixed(3)}%`;
    if (share < 1) return `${share.toFixed(2)}%`;
    return `${share.toFixed(1)}%`;
};

type Props = {
    category: string | undefined;
    /** Kompakt mod: sadece tek satir ozet (urun kartlari icin) */
    compact?: boolean;
};

export const MarketPositionPanel = ({ category, compact }: Props) => {
    useLocale();
    const position = useMarketPosition(category);
    const brandValue = useStatsStore(state => state.brandValue);
    // Per-category brand. The corporate figure above is a weighted average of
    // these, leaning towards the harder markets.
    const brandByCategory = useStatsStore(state => state.brandByCategory);

    if (!position) return null;

    const { market, playerShare, playerRank, ranking, unitsSold, ownedShare, groupShare } = position;

    if (compact) {
        return (
            <Text style={styles.compactLine} numberOfLines={1}>
                {market.category} · {formatShare(playerShare)}
            </Text>
        );
    }

    return (
        <View style={styles.panel}>
            <View style={styles.headerRow}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>📈 Market Position</Text>
                    <InfoDot
                        title={t('os.marketPosition')}
                        text={t('os.everyProductCategoryIsA')}
                        detail="Building more units does not create demand. Buying a competitor transfers most of their share to you."
                    />
                </View>
                <View style={styles.regionBadge}>
                    <Text style={styles.regionText}>{market.region}</Text>
                </View>
            </View>

            <Text style={styles.description}>{market.description}</Text>

            {/* Ozet sayilar */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>{t('os.marketSize')}</Text>
                    <Text style={styles.summaryValue}>
                        {formatNumber(market.sizeUnitsPerQuarter)}
                    </Text>
                    <Text style={styles.summaryUnit}>units / quarter</Text>
                </View>
                <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>{t('os.yourShare')}</Text>
                    <Text style={[styles.summaryValue, { color: '#5992C6' }]}>
                        {formatShare(playerShare)}
                    </Text>
                    {ownedShare > 0 && (
                        <Text style={styles.groupNote}>
                            +{formatShare(ownedShare)} through companies you own = {formatShare(groupShare)} of
                            this market
                        </Text>
                    )}
                    <Text style={{ display: 'none' }}>
                    </Text>
                    <Text style={styles.summaryUnit}>rank #{playerRank}</Text>
                </View>
                <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>{t('brand.thisCategory')}</Text>
                    <Text style={[styles.summaryValue, { color: '#E9B8C9' }]}>
                        {Math.round((brandByCategory || {})[category ?? ""] ?? 0)}
                    </Text>
                    <Text style={styles.summaryUnit}>{t('brand.corporateShort', { v1: brandValue.toFixed(0) })}</Text>
                </View>
            </View>

            {/* --------------------------------------------------------------
                EVERY CATEGORY'S BRAND
                --------------------------------------------------------------
                This existed in the engine for weeks and was never on screen,
                so the player reasonably concluded there was only one brand.
                The gate to a new market reads the WEAKEST row here.
               -------------------------------------------------------------- */}
            {Object.keys(brandByCategory || {}).length > 1 && (
                <View style={styles.brandRow}>
                    {Object.entries(brandByCategory || {}).map(([cat, v]) => (
                        <View key={cat} style={styles.brandChip}>
                            <Text style={styles.brandChipCat}>{cat}</Text>
                            <Text style={[
                                styles.brandChipVal,
                                { color: (v as number) >= 200 ? '#5992C6' : '#E9B8C9' },
                            ]}>
                                {Math.round(v as number)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <Text style={styles.soldLine}>
                You sold {formatNumber(unitsSold)} units in this category last quarter.
            </Text>

            {/* Siralama — katlanir. Ozet yukarida zaten gorunuyor. */}
            <CollapsibleSection
                title={t('os.competitors')}
                note={t('os.whoHoldsThisMarketAnd')}
                info={t('os.theseAreRealCompaniesYou')}
                summary={`#${playerRank} of ${ranking.length}`}
                summaryColor="#5992C6"
                style={styles.rankingSection}
            >
            <View style={styles.rankingBox}>
                {ranking.map((p, index) => (
                    <View key={p.id} style={[styles.rankRow, (p.isPlayer || p.owned) && styles.rankRowPlayer]}>
                        <Text style={[styles.rankNum, (p.isPlayer || p.owned) && styles.rankTextPlayer]}>
                            {index + 1}
                        </Text>
                        <Text
                            style={[styles.rankName, (p.isPlayer || p.owned) && styles.rankTextPlayer]}
                            numberOfLines={1}
                        >
                            {p.name}
                            {p.symbol ? <Text style={styles.rankSymbol}>  {p.symbol}</Text> : null}
                        </Text>
                        <View style={styles.rankBarTrack}>
                            <View
                                style={[
                                    styles.rankBarFill,
                                    {
                                        width: `${Math.min(100, p.share)}%`,
                                        backgroundColor: p.isPlayer
                                            ? '#5992C6'
                                            : p.owned ? '#5992C6' : 'rgba(255,255,255,0.28)',
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.rankShare, (p.isPlayer || p.owned) && styles.rankTextPlayer]}>
                            {formatShare(p.share)}
                        </Text>
                    </View>
                ))}
            </View>
            </CollapsibleSection>

            <Text style={styles.footnote}>
                Market grows {formatPercent(market.growthPerQuarter)} per quarter. Buying a competitor
                transfers most of their share to you.
            </Text>
        </View>
    );
};

export default MarketPositionPanel;

const styles = StyleSheet.create({
    groupNote: { color: '#5992C6', fontSize: 10.5, lineHeight: 15, marginTop: 4, fontWeight: '600' },
    compactLine: { color: '#5992C6', fontSize: 11, fontWeight: '600' },

    panel: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    regionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: 'rgba(233,184,201,0.12)',
    },
    regionText: { color: '#E9B8C9', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
    description: { color: 'rgba(255,255,255,0.48)', fontSize: 11, lineHeight: 16, marginTop: 6 },

    summaryRow: { flexDirection: 'row', marginTop: 14, marginBottom: 10 },
    summaryCell: { flex: 1, alignItems: 'center' },
    brandRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    brandChip: { backgroundColor: '#31241F', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
    brandChipCat: { color: 'rgba(255,255,255,0.48)', fontSize: 9 },
    brandChipVal: { fontSize: 13, fontWeight: '800' },
    summaryLabel: { color: '#7F5E51', fontSize: 9.5, letterSpacing: 0.5 },
    summaryValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: 3 },
    summaryUnit: { color: '#7F5E51', fontSize: 9, marginTop: 1 },

    soldLine: { color: 'rgba(255,255,255,0.48)', fontSize: 10.5, fontStyle: 'italic', marginBottom: 10 },

    rankingSection: { marginTop: 4, marginBottom: 4 },
    rankingBox: { gap: 7 },
    rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
    rankRowPlayer: {
        backgroundColor: 'rgba(89,146,198,0.08)',
        borderRadius: 6,
        paddingHorizontal: 4,
        marginHorizontal: -4,
    },
    rankNum: { color: '#7F5E51', fontSize: 10, width: 18, fontWeight: '700' },
    rankName: { color: '#FFFFFF', fontSize: 11.5, flex: 1 },
    rankSymbol: { color: '#7F5E51', fontSize: 9.5 },
    rankTextPlayer: { color: '#5992C6', fontWeight: '800' },
    rankBarTrack: {
        width: 70,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    rankBarFill: { height: '100%', borderRadius: 2 },
    rankShare: { color: 'rgba(255,255,255,0.48)', fontSize: 11, width: 52, textAlign: 'right', fontWeight: '600' },

    footnote: { color: '#7F5E51', fontSize: 9.5, lineHeight: 14, marginTop: 12, fontStyle: 'italic' },
});
