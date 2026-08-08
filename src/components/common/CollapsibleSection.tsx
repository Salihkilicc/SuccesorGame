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
        <View style={[styles.wrapper, style]}>
            <Pressable
                onPress={toggle}
                style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
            >
                <View style={styles.headerText}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{title}</Text>
                        {info ? <InfoDot title={title} text={info} detail={infoDetail} small /> : null}
                    </View>
                    {note ? <Text style={styles.note}>{note}</Text> : null}
                </View>

                <View style={styles.headerRight}>
                    {summary ? (
                        <Text style={[styles.summary, { color: summaryColor }]} numberOfLines={1}>
                            {summary}
                        </Text>
                    ) : null}
                    <Text style={[styles.chevron, open && styles.chevronOpen]}>⌄</Text>
                </View>
            </Pressable>

            {open ? <View style={styles.body}>{children}</View> : null}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 14,
    },
    headerPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
    headerText: { flex: 1, paddingRight: 10 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    title: {
        color: '#E9B8C9',
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 1.6,
    },
    note: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 10.5,
        marginTop: 3,
        lineHeight: 14,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summary: { fontSize: 14, fontWeight: '800', maxWidth: 130, textAlign: 'right' },
    chevron: {
        color: '#7F5E51',
        fontSize: 16,
        marginTop: -4,
        width: 14,
        textAlign: 'center',
    },
    chevronOpen: { color: '#E9B8C9', transform: [{ rotate: '180deg' }], marginTop: 2 },
    body: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        paddingTop: 2,
    },
});
