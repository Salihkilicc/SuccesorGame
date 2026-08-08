import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { formatMoney } from '../../../core/utils';

interface Props { visible: boolean; onClose: () => void; }

const CapitalInjectionModal: React.FC<Props> = ({ visible, onClose }) => {
    useLocale();
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
                    <Text style={styles.subtitle}>{t('finance.transferPersonalWealth')}</Text>

                    <View style={styles.balanceCard}>
                        <Text style={styles.label}>{t('finance.availableCash')}</Text>
                        <Text style={styles.balance}>{formatMoney(money)}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>{t('finance.selectAmount')}</Text>
                    <View style={styles.grid}>
                        {[5, 10, 15, 20, 25, 30, 40, 50].map((p) => (
                            <TouchableOpacity key={p} onPress={() => setPercent(p)}
                                style={[styles.chip, percent === p && styles.activeChip]}>
                                <Text style={[styles.chipText, percent === p && styles.activeChipText]}>{p}%</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.preview}>
                        <Text style={styles.label}>{t('finance.injecting')}</Text>
                        <Text style={styles.previewAmount}>{formatMoney(amount)}</Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text style={styles.btnText}>{t('finance.cancel')}</Text></TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}><Text style={[styles.btnText, { color: 'black' }]}>{t('finance.confirm')}</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(2,6,38,0.85)', justifyContent: 'center', padding: 20 },
    container: { backgroundColor: '#020626', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    title: { fontSize: 22, fontWeight: 'bold', color: 'white', textAlign: 'center' },
    subtitle: { color: '#FFFFFF', textAlign: 'center', marginBottom: 20 },
    balanceCard: { backgroundColor: '#0B0635', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
    label: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
    balance: { color: '#C8C0EF', fontSize: 26, fontWeight: 'bold', marginTop: 4 },
    sectionTitle: { color: 'white', marginBottom: 10, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    chip: { width: '22%', backgroundColor: '#0B0635', padding: 10, borderRadius: 8, alignItems: 'center' },
    activeChip: { backgroundColor: '#C8C0EF' },
    chipText: { color: 'white', fontWeight: 'bold' },
    activeChipText: { color: 'black' },
    preview: { alignItems: 'center', marginBottom: 20 },
    previewAmount: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, padding: 15, backgroundColor: '#0B0635', borderRadius: 10, alignItems: 'center' },
    confirmBtn: { flex: 2, padding: 15, backgroundColor: '#C8C0EF', borderRadius: 10, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold' }
});

export default CapitalInjectionModal;
