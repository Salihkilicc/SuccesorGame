import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import SubsidiaryDetailModal from './SubsidiaryDetailModal';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney } from '../../../core/utils';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const ExistingCompaniesModal = ({ visible, onClose }: Props) => {
    useLocale();
    const navigation = useNavigation<any>();
    const { subsidiaries } = useCorporateFinanceStore();
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('finance.myEmpire')}</Text>
                    <View style={{ width: 50 }} />
                </View>

                <FlatList
                    data={subsidiaries}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.row} onPress={() => setSelectedCompanyId(item.id)}>
                            <View>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.sector}>{item.sector}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.value}>{formatMoney(item.valuation)}</Text>
                                <Text style={[styles.change, item.lastChangePercent >= 0 ? { color: '#5FB37A' } : { color: '#E06B6B' }]}>
                                    {item.lastChangePercent > 0 ? '+' : ''}{item.lastChangePercent.toFixed(1)}%
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.empty}>{t('finance.noCompaniesOwned')}</Text>
                        </View>
                    }
                    contentContainerStyle={[
                        styles.listContent,
                        subsidiaries.length === 0 && styles.emptyList
                    ]}
                />

                <CrystalNavBar activeTab="Company" variant="dark" />

                {/* Detail Modal Integration */}
                {selectedCompanyId && (
                    <SubsidiaryDetailModal
                        visible={!!selectedCompanyId}
                        subsidiaryId={selectedCompanyId}
                        onClose={() => setSelectedCompanyId(null)}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
};

export default ExistingCompaniesModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#31241F',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backBtn: {
        paddingVertical: 8,
        paddingRight: 16,
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#31241F',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    sector: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
    },
    value: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    change: {
        fontSize: 12,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        marginLeft: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    empty: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 100, // Space for BottomStatsBar
    },
    emptyList: {
        flex: 1,
    }
});
