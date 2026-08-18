import React from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet } from 'react-native';
import { useMarketPosition } from './useMarketPosition';
import { useStatsStore } from '../store/useStatsStore';
import { formatNumber, formatPercent } from '../utils';
import CollapsibleSection from '../../components/common/CollapsibleSection';
import InfoDot from '../../components/common/InfoDot';
import { theme } from '../theme';

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
    defaultOpen?: boolean;
};

export const MarketPositionPanel = ({ category, compact, defaultOpen = false }: Props) => {
    useLocale();
    const position = useMarketPosition(category);
    const brandValue = useStatsStore(state => state.brandValue);
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
        <CollapsibleSection
            title={t('os.marketPosition')}
            note={`${market.category}${market.region ? ` · ${market.region}` : ''}`}
            info={t('os.everyProductCategoryIsA')}
            infoDetail="Building more units does not create demand. Buying a competitor transfers most of their share to you."
            summary={`#${playerRank} · ${formatShare(playerShare)}`}
            summaryColor={playerShare > 0 ? theme.colors.primary : theme.colors.textMuted}
            defaultOpen={defaultOpen}
            compact
            style={styles.panelSection}
        >
            <View style={styles.contentBox}>
                <Text style={styles.description}>{market.description}</Text>

                {/* Ozet sayilar - Kompakt 3'lu Izgara */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>{t('os.marketSize')}</Text>
                        <Text style={styles.summaryValue}>
                            {formatNumber(market.sizeUnitsPerQuarter)}
                        </Text>
                        <Text style={styles.summaryUnit}>units/qtr</Text>
                    </View>
                    <View style={[styles.summaryCell, styles.summaryCellBorder]}>
                        <Text style={styles.summaryLabel}>{t('os.yourShare')}</Text>
                        <Text style={[styles.summaryValue, { color: playerShare > 0 ? theme.colors.primary : '#FFFFFF' }]}>
                            {formatShare(playerShare)}
                        </Text>
                        <Text style={styles.summaryUnit}>rank #{playerRank}</Text>
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={styles.summaryLabel}>{t('brand.thisCategory')}</Text>
                        <Text style={styles.summaryValue}>
                            {Math.round((brandByCategory || {})[category ?? ""] ?? 0)}
                        </Text>
                        <Text style={styles.summaryUnit}>{t('brand.corporateShort', { v1: brandValue.toFixed(0) })}</Text>
                    </View>
                </View>

                {ownedShare > 0 && (
                    <Text style={styles.groupNote}>
                        +{formatShare(ownedShare)} through subsidiaries = {formatShare(groupShare)} total market
                    </Text>
                )}

                {/* Satis Bilgisi */}
                <Text style={styles.soldLine}>
                    You sold {formatNumber(unitsSold)} units in this category last quarter.
                </Text>

                {/* Rakipler Siralamasi - Kompakt Liste */}
                <View style={styles.rankingBox}>
                    <Text style={styles.rankingHeader}>{t('os.competitors')}</Text>
                    {ranking.slice(0, 8).map((p, index) => (
                        <View key={p.id} style={[styles.rankRow, (p.isPlayer || p.owned) && styles.rankRowPlayer]}>
                            <Text style={[styles.rankNum, (p.isPlayer || p.owned) && styles.rankTextPlayer]}>
                                {index + 1}
                            </Text>
                            <Text
                                style={[styles.rankName, (p.isPlayer || p.owned) && styles.rankTextPlayer]}
                                numberOfLines={1}
                            >
                                {p.name}
                                {p.symbol ? <Text style={styles.rankSymbol}> ({p.symbol})</Text> : null}
                            </Text>
                            <View style={styles.rankBarTrack}>
                                <View
                                    style={[
                                        styles.rankBarFill,
                                        {
                                            width: `${Math.min(100, p.share)}%`,
                                            backgroundColor: (p.isPlayer || p.owned)
                                                ? theme.colors.primary
                                                : 'rgba(255,255,255,0.22)',
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

                {/* Kategori Markalari */}
                {Object.keys(brandByCategory || {}).length > 1 && (
                    <View style={styles.brandRow}>
                        {Object.entries(brandByCategory || {}).map(([cat, v]) => (
                            <View key={cat} style={styles.brandChip}>
                                <Text style={styles.brandChipCat}>{cat}</Text>
                                <Text style={[
                                    styles.brandChipVal,
                                    { color: (v as number) >= 200 ? theme.colors.textPrimary : theme.colors.warning },
                                ]}>
                                    {Math.round(v as number)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={styles.footnote}>
                    Market grows {formatPercent(market.growthPerQuarter)} / quarter.
                </Text>
            </View>
        </CollapsibleSection>
    );
};

export default MarketPositionPanel;

const styles = StyleSheet.create({
    panelSection: {
        marginBottom: 10,
    },
    compactLine: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    contentBox: {
        paddingTop: 2,
    },
    description: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 11,
        lineHeight: 15,
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    summaryCell: {
        flex: 1,
        alignItems: 'center',
    },
    summaryCellBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 9,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        marginTop: 2,
    },
    summaryUnit: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 9,
        marginTop: 1,
    },
    groupNote: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 6,
    },
    soldLine: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 10.5,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    rankingBox: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        padding: 8,
        gap: 5,
        marginBottom: 6,
    },
    rankingHeader: {
        fontSize: 10.5,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
    },
    rankRowPlayer: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 4,
        paddingHorizontal: 4,
        marginHorizontal: -4,
    },
    rankNum: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 10,
        width: 16,
        fontWeight: '700',
    },
    rankName: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        flex: 1,
    },
    rankSymbol: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 9,
    },
    rankTextPlayer: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    rankBarTrack: {
        width: 50,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginHorizontal: 6,
        overflow: 'hidden',
    },
    rankBarFill: {
        height: '100%',
        borderRadius: 1.5,
    },
    rankShare: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 10.5,
        width: 44,
        textAlign: 'right',
        fontWeight: '600',
    },
    brandRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 6,
    },
    brandChip: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    brandChipCat: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 9,
    },
    brandChipVal: {
        fontSize: 10,
        fontWeight: '800',
    },
    footnote: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 9,
        marginTop: 6,
        fontStyle: 'italic',
    },
});
