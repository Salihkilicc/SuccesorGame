import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    LayoutAnimation,
    Platform,
    UIManager,
    type ViewStyle,
} from 'react-native';
import InfoDot from './InfoDot';
import { theme } from '../../core/theme';

// ============================================================================
//  ACILIR BOLUM
// ============================================================================
//  TASARIM KURALI: bilgiyi AZALTMA, KATLA.
//
//  Rapor ekranlari cok fazla veri tasiyor ve hepsi ayni anda acikken
//  ilk bakista okunmuyordu. Cozum bilgiyi silmek degil:
//
//    - Bolum kapaliyken bile SAG TARAFTA ozet deger gorunur,
//      yani basmadan da ana rakami okursun.
//    - Basligin altinda TEK SATIR not, "bu bolum ne anlatiyor" der.
//    - Detay isteyince acilir.
//
//  Boylece ekran sakin gorunur ama hicbir sey kaybolmaz.
// ============================================================================

// LayoutAnimation Android'de acikca etkinlestirilmeli.
if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
    /** Bolum basligi — kisa ve buyuk harf */
    title: string;
    /** Tek satirlik "bu ne" notu. Basligin altinda kucuk gri yazi. */
    note?: string;
    /** Uzun aciklama — baslik yanindaki ⓘ butonunun arkasina konur. */
    info?: string;
    infoDetail?: string;
    /** Kapaliyken sagda gorunen ozet deger */
    summary?: string;
    summaryColor?: string;
    /** Acik mi baslasin */
    defaultOpen?: boolean;
    /** Icerik yoksa bolumu hic gosterme */
    hidden?: boolean;
    /** Daha dar / kompakt baslik ve bosluklar */
    compact?: boolean;
    style?: ViewStyle;
    children: React.ReactNode;
};

export const CollapsibleSection = ({
    title,
    note,
    info,
    infoDetail,
    summary,
    summaryColor = '#FFFFFF',
    defaultOpen = false,
    hidden = false,
    compact = false,
    style,
    children,
}: Props) => {
    const [open, setOpen] = useState(defaultOpen);

    const toggle = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen(prev => !prev);
    }, []);

    if (hidden) return null;

    return (
        <View style={[styles.wrapper, compact && styles.wrapperCompact, style]}>
            <Pressable
                onPress={toggle}
                style={({ pressed }) => [
                    styles.header,
                    compact && styles.headerCompact,
                    pressed && styles.headerPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
            >
                {/* ------------------------------------------------------
                    THE INFO DOT LIVES ON THE RIGHT NOW

                    It used to sit immediately after the title, which put a
                    small circle in the middle of every section header in the
                    app - between the two things the header is actually for,
                    the name of the section and its figure. On a screen with
                    six sections that is six dots down the centre of the page
                    and they read as punctuation rather than as controls.

                    Left column is text, right column is controls. The dot
                    goes with the summary and the chevron, where the eye is
                    already looking for something to press.
                   ------------------------------------------------------ */}
                <View style={styles.headerText}>
                    <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
                    {note ? <Text style={[styles.note, compact && styles.noteCompact]}>{note}</Text> : null}
                </View>

                <View style={styles.headerRight}>
                    {summary ? (
                        <Text style={[styles.summary, compact && styles.summaryCompact, { color: summaryColor }]} numberOfLines={1}>
                            {summary}
                        </Text>
                    ) : null}
                    {info ? <InfoDot title={title} text={info} detail={infoDetail} small /> : null}
                    <Text style={[styles.chevron, open && styles.chevronOpen]}>⌄</Text>
                </View>
            </Pressable>

            {open ? <View style={[styles.body, compact && styles.bodyCompact]}>{children}</View> : null}
        </View>
    );
};

export default CollapsibleSection;

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 10,
        overflow: 'hidden',
    },
    wrapperCompact: {
        borderRadius: 10,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 14,
    },
    headerCompact: {
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    headerPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
    headerText: { flex: 1, paddingRight: 6 },
    /**
     * SHELVED with the InfoDot's move to the right of the header.
     *
     * @orphan-ok-symbol titleRow
     *
     * The title is the only thing on the left now, so it needs no row of its
     * own. Kept because a second badge on a section title is the obvious next
     * request and this is where it would go back.
     *
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
     */
    title: {
        color: theme.colors.textMuted,
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 1.6,
    },
    titleCompact: {
        fontSize: 9.5,
        letterSpacing: 1.1,
    },
    note: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 10.5,
        marginTop: 3,
        lineHeight: 14,
    },
    noteCompact: {
        fontSize: 9,
        marginTop: 1,
        lineHeight: 12,
    },
    /** 8 rather than 6: the dot joined this row and three things need air. */
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summary: { fontSize: 14, fontWeight: '800', maxWidth: 130, textAlign: 'right' },
    summaryCompact: { fontSize: 12, maxWidth: 100 },
    chevron: {
        color: '#FFFFFF',
        fontSize: 16,
        marginTop: -4,
        width: 14,
        textAlign: 'center',
    },
    chevronOpen: { color: theme.colors.textPrimary, transform: [{ rotate: '180deg' }], marginTop: 2 },
    body: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        paddingTop: 2,
    },
    bodyCompact: {
        paddingHorizontal: 10,
        paddingBottom: 10,
        paddingTop: 2,
    },
});
