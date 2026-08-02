import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { formatMoney } from '../../../core/utils';

interface Props { visible: boolean; onClose: () => void; }

const CapitalInjectionModal: React.FC<Props> = ({ visible, onClose }) => {
    const { money } = useStatsStore();
    const { injectCapital } = useCorporateFinanceStore();
    const [percent, setPercent] = useState<number>(10);

    const amount = Math.floor(money * (percent / 100));

    const handleConfirm = () => {
        const res = injectCapital(amount);
        if (res.success) onClose();
        else Alert.alert("Error", res.msg);
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>🏦 Capital Injection</Text>
                    <Text style={styles.subtitle}>Transfer Personal Wealth</Text>

                    <View style={styles.balanceCard}>
                        <Text style={styles.label}>AVAILABLE CASH</Text>
                        <Text style={styles.balance}>{formatMoney(money)}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Select Amount</Text>
                    <View style={styles.grid}>
                        {[5, 10, 15, 20, 25, 30, 40, 50].map((p) => (
                            <TouchableOpacity key={p} onPress={() => setPercent(p)}
                                style={[styles.chip, percent === p && styles.activeChip]}>
                                <Text style={[styles.chipText, percent === p && styles.activeChipText]}>{p}%</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.preview}>
                        <Text style={styles.label}>Injecting:</Text>
                        <Text style={styles.previewAmount}>{formatMoney(amount)}</Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}><Text style={[styles.btnText, { color: 'black' }]}>CONFIRM</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    container: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#333' },
    title: { fontSize: 22, fontWeight: 'bold', color: 'white', textAlign: 'center' },
    subtitle: { color: '#888', textAlign: 'center', marginBottom: 20 },
    balanceCard: { backgroundColor: '#2C2C2E', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
    label: { color: '#AAA', fontSize: 12, fontWeight: '600' },
    balance: { color: '#4ADE80', fontSize: 26, fontWeight: 'bold', marginTop: 4 },
    sectionTitle: { color: 'white', marginBottom: 10, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    chip: { width: '22%', backgroundColor: '#3A3A3C', padding: 10, borderRadius: 8, alignItems: 'center' },
    activeChip: { backgroundColor: '#4ADE80' },
    chipText: { color: 'white', fontWeight: 'bold' },
    activeChipText: { color: 'black' },
    preview: { alignItems: 'center', marginBottom: 20 },
    previewAmount: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, padding: 15, backgroundColor: '#333', borderRadius: 10, alignItems: 'center' },
    confirmBtn: { flex: 2, padding: 15, backgroundColor: '#4ADE80', borderRadius: 10, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold' }
});

export default CapitalInjectionModal;
