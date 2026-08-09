import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCorporateFinanceStore, SubsidiaryStrategy } from '../../../features/finance/stores/useCorporateFinanceStore';
import { theme } from '../../../core/theme';
import SellCompanyModal from '../Actions/SellCompanyModal';
import { formatMoney } from '../../../core/utils';

type Props = {
    visible: boolean;
    subsidiaryId?: string | null;  // Changed to match ExistingCompaniesModal usage (subsidiaryId)
    companyId?: string | null;     // Kept for backward compatibility if any
    onClose: () => void;
};

export default function SubsidiaryDetailModal({ visible, subsidiaryId, companyId, onClose }: Props) {
    useLocale();
    const navigation = useNavigation<any>();
    const { subsidiaries, updateSubsidiaryStrategy } = useCorporateFinanceStore();
    const [isSellModalVisible, setSellModalVisible] = useState(false);

    const targetId = subsidiaryId || companyId;

    // Find the company
    const company = subsidiaries.find(s => s.id === targetId);

    // Local state for strategy editing
    const [strategy, setStrategy] = useState<SubsidiaryStrategy>({
        marketing: 0,
        rnd: 0,
        production: 0,
        workforce: 0
    });

    // Sync state when company changes
    useEffect(() => {
        if (company) {
            setStrategy(company.strategy);
        }
    }, [company]);

    if (!company) return null;

    const totalPoints = strategy.marketing + strategy.rnd + strategy.production + strategy.workforce;
    const maxPoints = 10;
    const remainingPoints = maxPoints - totalPoints;

    const handleChange = (field: keyof SubsidiaryStrategy, change: number) => {
        const currentValue = strategy[field];
        const newValue = currentValue + change;

        // Validations
        if (newValue < 0) return; // Cannot be negative
        if (change > 0 && totalPoints >= maxPoints) return; // Cannot exceed max 10

        setStrategy(prev => ({ ...prev, [field]: newValue }));
    };

    const handleSave = () => {
        if (targetId) {
            updateSubsidiaryStrategy(targetId, strategy);
            onClose();
        }
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    const isPositive = company.lastChangePercent >= 0;

    const renderStrategyRow = (label: string, field: keyof SubsidiaryStrategy, icon: string, description: string) => (
        <View style={styles.strategyRow} key={field}>
            <View style={styles.strategyInfo}>
                <View style={styles.iconBox}>
                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                </View>
                <View>
                    <Text style={styles.strategyLabel}>{label}</Text>
                    <Text style={styles.strategyDesc}>{description}</Text>
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.controlBtn, strategy[field] === 0 && styles.disabledBtn]}
                    onPress={() => handleChange(field, -1)}
                    disabled={strategy[field] === 0}
                >
                    <Ionicons name="remove" size={20} color={strategy[field] === 0 ? '#666E70' : '#FFFFFF'} />
                </TouchableOpacity>

                <View style={styles.valueBox}>
                    <Text style={styles.valueText}>{strategy[field]}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.controlBtn, totalPoints >= maxPoints && styles.disabledBtn]}
                    onPress={() => handleChange(field, 1)}
                    disabled={totalPoints >= maxPoints}
                >
                    <Ionicons name="add" size={20} color={totalPoints >= maxPoints ? '#666E70' : '#FFFFFF'} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Darkened Background instead of Blur for safety */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(28,36,44,0.85)' }]} />

                <View style={[styles.container, { marginTop: 60 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.companyName}>{company.name}</Text>
                            <Text style={styles.sectorText}>{company.sector} Sector</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* KPI Dashboard */}
                        <View style={styles.kpiContainer}>
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>{t('finance.valuation')}</Text>
                                <Text style={styles.kpiValue}>
                                    {formatMoney(company.valuation)}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>{t('finance.lastQChange')}</Text>
                                <Text style={[styles.kpiValue, { color: isPositive ? '#05A8F6' : '#FF8A8A' }]}>
                                    {isPositive ? '+' : ''}{company.lastChangePercent.toFixed(2)}%
                                </Text>
                            </View>
                        </View>

                        {/* Strategy Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('finance.corporateStrategy')}</Text>
                            {remainingPoints > 0 && (
                                <View style={styles.pointsBadge}>
                                    <Text style={styles.pointsText}>
                                        {remainingPoints} Points Available
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.strategyList}>
                            {renderStrategyRow(t('sub.marketing'), 'marketing', '📢', t('sub.marketingDesc'))}
                            {renderStrategyRow(t('sub.rnd'), 'rnd', '🔬', t('sub.rndDesc'))}
                            {renderStrategyRow(t('sub.production'), 'production', '🏭', t('sub.productionDesc'))}
                            {renderStrategyRow(t('sub.workforce'), 'workforce', '👥', t('sub.workforceDesc'))}
                        </View>

                        {/* Info Note */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.48)" />
                            <Text style={styles.infoText}>
                                {t('sub.pointsHint')}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.sellBtn} onPress={() => setSellModalVisible(true)}>
                            <Text style={styles.sellBtnText}>{t('finance.sellCompany')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>{t('finance.confirmStrategy')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Bar */}
                {/* Sell Modal */}
                {company && <SellCompanyModal
                    visible={isSellModalVisible}
                    companyId={company.id}
                    onClose={() => setSellModalVisible(false)}
                />}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(28,36,44,0.5)',
    },
    container: {
        width: '90%',
        maxWidth: 420,
        height: '80%',
        backgroundColor: '#1C242C',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#1C242C",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 80,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1C242C',
        backgroundColor: '#434B50',
    },
    companyName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    sectorText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#434B50',
        borderRadius: 50,
    },
    content: {
        padding: 20,
    },
    kpiContainer: {
        flexDirection: 'row',
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    kpiItem: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        backgroundColor: '#434B50',
        marginHorizontal: 10,
    },
    kpiLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '700',
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pointsBadge: {
        backgroundColor: '#434B50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pointsText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    strategyList: {
        gap: 12,
    },
    strategyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#434B50',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    strategyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    strategyLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    strategyDesc: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.48)',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#434B50',
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    controlBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#434B50',
    },
    disabledBtn: {
        opacity: 0.3,
    },
    valueBox: {
        width: 24,
        alignItems: 'center',
    },
    valueText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(207,208,210,0.1)',
        padding: 12,
        borderRadius: 12,
        marginTop: 20,
        gap: 10,
    },
    infoText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 12,
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#1C242C',
        backgroundColor: '#434B50',
        gap: 12,
    },
    sellBtn: {
        backgroundColor: '#434B50',
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    sellBtnText: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    saveBtn: {
        backgroundColor: '#FFFFFF',
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: theme.colors.onLight,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
