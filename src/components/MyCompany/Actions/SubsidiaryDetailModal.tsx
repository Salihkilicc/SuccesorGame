import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCorporateFinanceStore, SubsidiaryStrategy } from '../../../features/finance/stores/useCorporateFinanceStore';
import { theme } from '../../../core/theme';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import SellCompanyModal from './SellCompanyModal';

type Props = {
    visible: boolean;
    companyId: string | null;
    onClose: () => void;
};

export const SubsidiaryDetailModal = ({ visible, companyId, onClose }: Props) => {
    const navigation = useNavigation<any>();
    const { subsidiaries, updateSubsidiaryStrategy } = useCorporateFinanceStore();
    const [isSellModalVisible, setSellModalVisible] = useState(false);

    // Find the company
    const company = subsidiaries.find(s => s.id === companyId);

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
        if (companyId) {
            updateSubsidiaryStrategy(companyId, strategy);
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
                    <Ionicons name="remove" size={20} color={strategy[field] === 0 ? '#555' : '#FFF'} />
                </TouchableOpacity>

                <View style={styles.valueBox}>
                    <Text style={styles.valueText}>{strategy[field]}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.controlBtn, totalPoints >= maxPoints && styles.disabledBtn]}
                    onPress={() => handleChange(field, 1)}
                    disabled={totalPoints >= maxPoints}
                >
                    <Ionicons name="add" size={20} color={totalPoints >= maxPoints ? '#555' : '#FFF'} />
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
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />

                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.companyName}>{company.name}</Text>
                            <Text style={styles.sectorText}>{company.sector} Sector</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* KPI Dashboard */}
                        <View style={styles.kpiContainer}>
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>VALUATION</Text>
                                <Text style={styles.kpiValue}>
                                    ${(company.valuation / 1_000_000).toFixed(1)}M
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>LAST Q CHANGE</Text>
                                <Text style={[styles.kpiValue, { color: isPositive ? '#30D158' : '#FF453A' }]}>
                                    {isPositive ? '+' : ''}{company.lastChangePercent.toFixed(2)}%
                                </Text>
                            </View>
                        </View>

                        {/* Strategy Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Corporate Strategy</Text>
                            <View style={[styles.pointsBadge, remainingPoints === 0 && { backgroundColor: '#30D158' }]}>
                                <Text style={[styles.pointsText, remainingPoints === 0 && { color: '#000' }]}>
                                    {remainingPoints} Points Available
                                </Text>
                            </View>
                        </View>

                        <View style={styles.strategyList}>
                            {renderStrategyRow('Marketing', 'marketing', '📢', 'Boosts sales & brand awareness')}
                            {renderStrategyRow('R&D', 'rnd', '🔬', 'Drives innovation & tech growth')}
                            {renderStrategyRow('Production', 'production', '🏭', 'Increases output & efficiency')}
                            {renderStrategyRow('Workforce', 'workforce', '👥', 'Improves morale & stability')}
                        </View>

                        {/* Info Note */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
                            <Text style={styles.infoText}>
                                Max 10 points total. High R&D benefits Tech companies. High Production benefits Industrial.
                                Workforce below 2 causes instability.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.sellBtn} onPress={() => setSellModalVisible(true)}>
                            <Text style={styles.sellBtnText}>SELL COMPANY</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>CONFIRM STRATEGY</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Bar */}
                <CrystalNavBar activeTab="Company" variant="dark" />

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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        width: '90%',
        maxWidth: 420,
        height: '80%',
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
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
        borderBottomColor: '#2C2C2E',
        backgroundColor: '#151517',
    },
    companyName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    sectorText: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#2C2C2E',
        borderRadius: 50,
    },
    content: {
        padding: 20,
    },
    kpiContainer: {
        flexDirection: 'row',
        backgroundColor: '#252528',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#333',
    },
    kpiItem: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        backgroundColor: '#3A3A3C',
        marginHorizontal: 10,
    },
    kpiLabel: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '700',
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
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
        color: '#FFF',
    },
    pointsBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pointsText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFF',
    },
    strategyList: {
        gap: 12,
    },
    strategyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#252528',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
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
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    strategyLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    strategyDesc: {
        fontSize: 11,
        color: '#8E8E93',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#151517',
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    controlBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#2C2C2E',
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
        color: '#FFF',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginTop: 20,
        gap: 10,
    },
    infoText: {
        flex: 1,
        color: '#0A84FF',
        fontSize: 12,
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
        backgroundColor: '#151517',
        gap: 12,
    },
    sellBtn: {
        backgroundColor: '#2C2C2E',
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    sellBtnText: {
        color: '#FF3B30',
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
        color: '#000',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
