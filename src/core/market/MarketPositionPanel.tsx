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
                    <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
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
                    <Text style={styles.summaryLabel}>{t('os.brandValue')}</Text>
                    <Text style={[styles.summaryValue, { color: '#FFD700' }]}>{brandValue}</Text>
                    <Text style={styles.summaryUnit}>out of 100</Text>
                </View>
            </View>

            <Text style={styles.soldLine}>
                You sold {formatNumber(unitsSold)} units in this category last quarter.
            </Text>

            {/* Siralama — katlanir. Ozet yukarida zaten gorunuyor. */}
            <CollapsibleSection
                title={t('os.competitors')}
                note={t('os.whoHoldsThisMarketAnd')}
                info={t('os.theseAreRealCompaniesYou')}
                summary={`#${playerRank} of ${ranking.length}`}
                summaryColor="#7FB3FF"
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
                                            ? '#4CAF50'
                                            : p.owned ? '#7FB3FF' : 'rgba(255,255,255,0.28)',
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
    groupNote: { color: '#7FB3FF', fontSize: 10.5, lineHeight: 15, marginTop: 4, fontWeight: '600' },
    compactLine: { color: '#7FB3FF', fontSize: 11, fontWeight: '600' },

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
        backgroundColor: 'rgba(255,215,0,0.12)',
    },
    regionText: { color: '#FFD700', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
    description: { color: '#8A8A8A', fontSize: 11, lineHeight: 16, marginTop: 6 },

    summaryRow: { flexDirection: 'row', marginTop: 14, marginBottom: 10 },
    summaryCell: { flex: 1, alignItems: 'center' },
    summaryLabel: { color: '#6E6E6E', fontSize: 9.5, letterSpacing: 0.5 },
    summaryValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: 3 },
    summaryUnit: { color: '#5C5C5C', fontSize: 9, marginTop: 1 },

    soldLine: { color: '#9E9E9E', fontSize: 10.5, fontStyle: 'italic', marginBottom: 10 },

    rankingSection: { marginTop: 4, marginBottom: 4 },
    rankingBox: { gap: 7 },
    rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
    rankRowPlayer: {
        backgroundColor: 'rgba(76,175,80,0.08)',
        borderRadius: 6,
        paddingHorizontal: 4,
        marginHorizontal: -4,
    },
    rankNum: { color: '#6E6E6E', fontSize: 10, width: 18, fontWeight: '700' },
    rankName: { color: '#D0D0D0', fontSize: 11.5, flex: 1 },
    rankSymbol: { color: '#5C5C5C', fontSize: 9.5 },
    rankTextPlayer: { color: '#4CAF50', fontWeight: '800' },
    rankBarTrack: {
        width: 70,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    rankBarFill: { height: '100%', borderRadius: 2 },
    rankShare: { color: '#B0B0B0', fontSize: 11, width: 52, textAlign: 'right', fontWeight: '600' },

    footnote: { color: '#5C5C5C', fontSize: 9.5, lineHeight: 14, marginTop: 12, fontStyle: 'italic' },
});
