// src/components/common/StepperBar.tsx
//
// ============================================================================
//  ARTAN BAR — mutlak sayı kontrolü
// ============================================================================
//
//  NEDEN VAR:
//  Calisan sayisi, arastirmaci sayisi gibi kontroller YUZDE ile
//  calisiyordu. Sorun sudur: kapasiten buyudugunde %50 ayari otomatik
//  olarak cok daha buyuk bir sayiya donusuyordu. Yani oyuncu bir kere
//  ayarliyor, sonra sayi kendi kendine firliyordu.
//
//  Urun uretim barinda cozdugumuz problem ile AYNISI. Cozum de ayni:
//  deger MUTLAK tutulur, barin tavani buyur, oyuncu tekrar karar verir.
//
//  KONTROLLER
//  ----------
//    -100 -10 -1  |  deger  |  +1 +10 +100     -> hassas ayar
//    kucuk yuzde cipleri (%25 %50 %75 Max)     -> hizli siçrama
//
//  Yuzde tamamen kalkmadi ama artik KUCUK bir kisayol; ana kontrol
//  mutlak sayilar.
//
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { formatNumber } from '../../core/utils';

export interface StepperBarMarker {
    /** Barda nerede duracagi (mutlak deger) */
    value: number;
    label: string;
    color?: string;
}

interface Props {
    value: number;
    onChange: (next: number) => void;
    /** Barin tavani. Buyudukce bar buyur, deger yerinde kalir. */
    max: number;
    min?: number;
    /** Deger altinda gorunecek birim yazisi */
    unit?: string;
    /** Ustune cikilmasi uyari olan esik (or. ekip sayisi) */
    softLimit?: number;
    softLimitLabel?: string;
    /** Barda gosterilecek isaretler */
    markers?: StepperBarMarker[];
    /** Buyuk adim butonlari. Varsayilan 1 / 10 / 100 */
    steps?: number[];
    /** Yuzde kisayollari. Varsayilan 25 / 50 / 75 / 100 */
    percents?: number[];
    fillColor?: string;
    disabled?: boolean;
}

const StepperBar: React.FC<Props> = ({
    value,
    onChange,
    max,
    min = 0,
    unit,
    softLimit,
    softLimitLabel,
    markers = [],
    steps = [1, 10, 100],
    percents = [25, 50, 75, 100],
    fillColor = '#5FB37A',
    disabled = false,
}) => {
    const safeMax = Math.max(1, max);
    const clamp = (n: number) => Math.max(min, Math.min(safeMax, Math.round(n)));
    const apply = (n: number) => { if (!disabled) onChange(clamp(n)); };

    const overSoft = softLimit !== undefined && value > softLimit;
    const fillPct = Math.min(100, (value / safeMax) * 100);

    return (
        <View style={disabled && styles.disabled}>
            {/* Değer */}
            <View style={styles.valueRow}>
                <Text style={styles.value}>{formatNumber(value)}</Text>
                {!!unit && <Text style={styles.unit}>{unit}</Text>}
                <View style={{ flex: 1 }} />
                <Text style={styles.max}>max {formatNumber(safeMax)}</Text>
            </View>

            {/* Bar */}
            <View style={styles.track}>
                {/* Yumusak sinirin otesi: odenir ama ise yaramaz bolge */}
                {softLimit !== undefined && softLimit < safeMax && (
                    <View
                        style={[
                            styles.deadZone,
                            { left: `${(softLimit / safeMax) * 100}%` },
                        ]}
                    />
                )}
                <View
                    style={[
                        styles.fill,
                        { width: `${fillPct}%`, backgroundColor: overSoft ? '#E3A857' : fillColor },
                    ]}
                />
                {markers.map((m, i) => (
                    <View
                        key={i}
                        style={[
                            styles.marker,
                            {
                                left: `${Math.min(100, (m.value / safeMax) * 100)}%`,
                                backgroundColor: m.color || '#E9B8C9',
                            },
                        ]}
                    />
                ))}
            </View>

            {/* İşaret etiketleri */}
            {(markers.length > 0 || softLimit !== undefined) && (
                <Text style={styles.scale}>
                    {softLimit !== undefined &&
                        `${softLimitLabel || 'Needed'} ${formatNumber(softLimit)}`}
                    {markers.map(m => `  ·  ${m.label} ${formatNumber(m.value)}`).join('')}
                </Text>
            )}

            {/* Büyük adımlar */}
            <View style={styles.stepRow}>
                {[...steps].reverse().map(st => (
                    <Pressable key={`m${st}`} style={styles.stepBtn} onPress={() => apply(value - st)}>
                        <Text style={styles.stepText}>−{st}</Text>
                    </Pressable>
                ))}
                <View style={styles.stepGap} />
                {steps.map(st => (
                    <Pressable key={`p${st}`} style={styles.stepBtn} onPress={() => apply(value + st)}>
                        <Text style={styles.stepText}>+{st}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Yüzde kısayolları — küçük */}
            <View style={styles.pctRow}>
                {percents.map(p => {
                    const targetValue = Math.round((safeMax * p) / 100);
                    const active = Math.abs(targetValue - value) <= Math.max(1, safeMax * 0.005);
                    return (
                        <Pressable
                            key={p}
                            style={[styles.pctChip, active && styles.pctChipActive]}
                            onPress={() => apply(targetValue)}
                        >
                            <Text style={[styles.pctText, active && styles.pctTextActive]}>
                                {p === 100 ? 'Max' : `${p}%`}
                            </Text>
                        </Pressable>
                    );
                })}
                {softLimit !== undefined && softLimit <= safeMax && (
                    <Pressable
                        style={[styles.pctChip, styles.pctChipAccent]}
                        onPress={() => apply(softLimit)}
                    >
                        <Text style={[styles.pctText, styles.pctTextAccent]}>
                            {softLimitLabel || 'Needed'}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    disabled: { opacity: 0.45 },
    valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 8 },
    value: { color: theme.colors.textPrimary, fontSize: 26, fontWeight: '800' },
    unit: { color: '#614A4B', fontSize: 11, marginBottom: 4 },
    max: { color: '#614A4B', fontSize: 11, fontWeight: '700', marginBottom: 4 },

    track: {
        height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 6 },
    deadZone: {
        position: 'absolute', top: 0, bottom: 0, right: 0,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    marker: { position: 'absolute', width: 2, height: 12 },
    scale: { color: '#614A4B', fontSize: 9.5, marginTop: 6 },

    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    stepGap: { flex: 1 },
    stepBtn: {
        paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, minWidth: 44,
        alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)',
    },
    stepText: { color: theme.colors.textPrimary, fontSize: 12.5, fontWeight: '800' },

    pctRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    pctChip: {
        paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    pctChipActive: { backgroundColor: 'rgba(76,175,80,0.22)' },
    pctChipAccent: { backgroundColor: 'rgba(127,179,255,0.16)' },
    pctText: { color: '#B28C96', fontSize: 10.5, fontWeight: '700' },
    pctTextActive: { color: '#5FB37A' },
    pctTextAccent: { color: '#5992C6' },
});

export default StepperBar;
