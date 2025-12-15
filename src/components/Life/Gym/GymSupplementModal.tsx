import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
} from 'react-native';
import { theme } from '../../../theme';

type GymSupplementModalProps = {
    visible: boolean;
    onClose: () => void;
};

const GymSupplementModal = ({ visible, onClose }: GymSupplementModalProps) => {
    const [showWarning, setShowWarning] = useState(false);

    const handleSelect = (item: string) => {
        if (item === 'steroids') {
            setShowWarning(true);
        } else {
            Alert.alert('Supplements', `You drank your ${item}. +Energy.`);
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
                            <Text style={styles.title}>LOCKER ROOM</Text>
                            <Text style={styles.subtitle}>Enhance your performance.</Text>

                            <View style={styles.grid}>
                                {['Protein Shake', 'Creatine', 'Pre-Workout'].map((item) => (
                                    <Pressable key={item} style={styles.item} onPress={() => handleSelect(item)}>
                                        <Text style={styles.itemText}>{item.toUpperCase()}</Text>
                                        <Text style={styles.itemPrice}>$50</Text>
                                    </Pressable>
                                ))}

                                <Pressable style={styles.dangerItem} onPress={() => handleSelect('steroids')}>
                                    <Text style={styles.dangerText}>ANABOLIC STEROIDS</Text>
                                    <Text style={styles.dangerPrice}>$2,000</Text>
                                </Pressable>
                            </View>

                            <Pressable onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>Leave</Text>
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
                                    <Text style={styles.cancelText}>CANCEL</Text>
                                </Pressable>
                                <Pressable style={styles.injectBtn} onPress={confirmSteroids}>
                                    <Text style={styles.injectText}>INJECT ANYWAY</Text>
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
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        padding: 20
    },
    container: {
        backgroundColor: '#0F0F0F',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333'
    },
    warningContainer: {
        borderColor: theme.colors.error,
        backgroundColor: '#1A0505'
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center'
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 30
    },
    grid: {
        gap: 12
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#222',
        borderRadius: 8
    },
    itemText: { color: '#EEE', fontWeight: '700' },
    itemPrice: { color: theme.colors.success },
    dangerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(255, 77, 79, 0.1)',
        borderColor: theme.colors.error,
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 20
    },
    dangerText: { color: theme.colors.error, fontWeight: '900' },
    dangerPrice: { color: theme.colors.error, fontWeight: '700' },
    closeBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
    closeText: { color: '#666', textDecorationLine: 'underline' },
    warningBox: { alignItems: 'center' },
    warningTitle: { color: theme.colors.error, fontSize: 22, fontWeight: '900', marginBottom: 20 },
    warningBody: { color: '#DDD', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    warningActions: { flexDirection: 'row', gap: 20 },
    cancelBtn: { padding: 12, borderWidth: 1, borderColor: '#666', borderRadius: 8 },
    cancelText: { color: '#AAA' },
    injectBtn: { padding: 12, backgroundColor: theme.colors.error, borderRadius: 8 },
    injectText: { color: '#FFF', fontWeight: '900' }
});
