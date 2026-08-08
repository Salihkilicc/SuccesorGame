import React, { useState, useCallback } from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';

// ============================================================================
//  INFO NOKTASI
// ============================================================================
//  Kucuk bir ⓘ yuvarlagi. Basinca kisa bir modal acar ve o seyin ne
//  oldugunu anlatir.
//
//  NEDEN: Rapor ekranlarinda her kalemin altinda surekli acik duran
//  aciklama metinleri vardi. Bilgi degerliydi ama ekran okunmaz haldeydi.
//  Aciklamayi silmek yerine BUTONUN ARKASINA aldik: isteyen basar okur,
//  istemeyen sadece rakamlari gorur.
//
//  KULLANIM:
//    <InfoDot title={t('ui.costOfGoodsSold')} text={t('ui.uretilenBirimeYazilir')} />
// ============================================================================

type Props = {
    /** Modal basligi */
    title: string;
    /** Ana aciklama */
    text: string;
    /** Isteğe bagli ikinci paragraf — ornek veya ipucu */
    detail?: string;
    /** Kucuk boy: satir ici kullanim icin */
    small?: boolean;
};

export const InfoDot = ({ title, text, detail, small }: Props) => {
    useLocale();
    const [open, setOpen] = useState(false);

    const show = useCallback(() => setOpen(true), []);
    const hide = useCallback(() => setOpen(false), []);

    return (
        <>
            <Pressable
                onPress={show}
                hitSlop={10}
                style={({ pressed }) => [
                    styles.dot,
                    small && styles.dotSmall,
                    pressed && styles.dotPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`What is ${title}`}
            >
                <Text style={[styles.dotText, small && styles.dotTextSmall]}>i</Text>
            </Pressable>

            <Modal visible={open} transparent animationType="fade" onRequestClose={hide}>
                <Pressable style={styles.overlay} onPress={hide}>
                    {/* Ic karta basinca kapanmasin */}
                    <Pressable style={styles.card} onPress={() => { }}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.text}>{text}</Text>
                        {detail ? <Text style={styles.detail}>{detail}</Text> : null}

                        <Pressable style={styles.button} onPress={hide}>
                            <Text style={styles.buttonText}>{t('ui.gotIt')}</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

export default InfoDot;

const styles = StyleSheet.create({
    dot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: 'rgba(199,52,202,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(199,52,202,0.08)',
    },
    dotSmall: { width: 15, height: 15, borderRadius: 7.5 },
    dotPressed: { backgroundColor: 'rgba(199,52,202,0.25)' },
    dotText: {
        color: '#C734CA',
        fontSize: 11,
        fontWeight: '800',
        lineHeight: 14,
    },
    dotTextSmall: { fontSize: 9.5, lineHeight: 12 },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(2,6,38,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#0B0635',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(199,52,202,0.22)',
        padding: 20,
    },
    title: {
        color: '#C734CA',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.6,
        marginBottom: 10,
    },
    text: { color: '#FFFFFF', fontSize: 13, lineHeight: 20 },
    detail: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 11.5,
        lineHeight: 17,
        marginTop: 10,
        fontStyle: 'italic',
    },
    button: {
        marginTop: 18,
        backgroundColor: 'rgba(199,52,202,0.15)',
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: 'center',
    },
    buttonText: { color: '#C734CA', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.8 },
});
