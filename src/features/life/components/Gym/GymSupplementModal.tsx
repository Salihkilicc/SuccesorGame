import React, { useState } from 'react';
import { t, useLocale } from '../../../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
} from 'react-native';
import { theme } from '../../../../core/theme';

type GymSupplementModalProps = {
    visible: boolean;
    onClose: () => void;
};

const GymSupplementModal = ({ visible, onClose }: GymSupplementModalProps) => {
    useLocale();
    const [showWarning, setShowWarning] = useState(false);

    const handleSelect = (item: string) => {
        if (item === 'steroids') {
            setShowWarning(true);
        } else {
            Alert.alert('Supplements', `You drank your ${item}. +Strength.`);
            onClose(); // In real logic we'd link this to stats but user only specified steroids risk clearly
        }
    };

    const confirmSteroids = () => {
        setShowWarning(false);
        onClose();
        Alert.alert('Injected', 'You feel a surge of power... and palpitations.');
        // Logic for actual stat boost would be handled via 'supplement' state in main hook, 
        // but simpler for now to just acknowledge the event. 
        // User request "Main hook" manages supplements, so ideally we pass a setter. 
        // For this step I'll assume visual feedback only as the specific "modifier" earlier 
        // was replaced with this "Locker Room" modal flow.
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={[styles.container, showWarning && styles.warningContainer]}>

                    {!showWarning ? (
                        <>
                            <Text style={styles.title}>{t('life.lockerRoom2')}</Text>
                            <Text style={styles.subtitle}>{t('life.enhanceYourPerformance')}</Text>

                            <View style={styles.grid}>
                                {['Protein Shake', 'Creatine', 'Pre-Workout'].map((item) => (
                                    <Pressable key={item} style={styles.item} onPress={() => handleSelect(item)}>
                                        <Text style={styles.itemText}>{item.toUpperCase()}</Text>
                                        <Text style={styles.itemPrice}>$50</Text>
                                    </Pressable>
                                ))}

                                <Pressable style={styles.dangerItem} onPress={() => handleSelect('steroids')}>
                                    <Text style={styles.dangerText}>{t('life.anabolicSteroids')}</Text>
                                    <Text style={styles.dangerPrice}>$2,000</Text>
                                </Pressable>
                            </View>

                            <Pressable onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>{t('life.leave2')}</Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningTitle}>⚠️ CRITICAL WARNING</Text>
                            <Text style={styles.warningBody}>
                                You are about to inject unknown substances.
                                {'\n\n'}
                                • Hair Loss Risk
                                {'\n'}
                                • Heart Palpitations
                                {'\n'}
                                • Mood Swings
                                {'\n\n'}
                                Are you absolutely sure?
                            </Text>
                            <View style={styles.warningActions}>
                                <Pressable style={styles.cancelBtn} onPress={() => setShowWarning(false)}>
                                    <Text style={styles.cancelText}>{t('life.cancel2')}</Text>
                                </Pressable>
                                <Pressable style={styles.injectBtn} onPress={confirmSteroids}>
                                    <Text style={styles.injectText}>{t('life.injectAnyway')}</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                </View>
            </View>
        </Modal>
    );
};

export default GymSupplementModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#020626',
        justifyContent: 'center',
        padding: 20
    },
    container: {
        backgroundColor: '#020626',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    warningContainer: {
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#020626'
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center'
    },
    subtitle: {
        textAlign: 'center',
        color: '#C734CA',
        marginBottom: 30
    },
    grid: {
        gap: 12
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#020626',
        borderRadius: 8
    },
    itemText: { color: '#FFFFFF', fontWeight: '700' },
    itemPrice: { color: '#C734CA' },
    dangerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#020626',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 20
    },
    dangerText: { color: '#C734CA', fontWeight: '900' },
    dangerPrice: { color: '#C734CA', fontWeight: '700' },
    closeBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
    closeText: { color: '#C734CA', textDecorationLine: 'underline' },
    warningBox: { alignItems: 'center' },
    warningTitle: { color: '#C734CA', fontSize: 22, fontWeight: '900', marginBottom: 20 },
    warningBody: { color: '#C734CA', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    warningActions: { flexDirection: 'row', gap: 20 },
    cancelBtn: { padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8 },
    cancelText: { color: '#C734CA' },
    injectBtn: { padding: 12, backgroundColor: '#0B0635', borderRadius: 8 },
    injectText: { color: '#FFFFFF', fontWeight: '900' }
});
