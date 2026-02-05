import React, { useState } from 'react';
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
import BottomStatsBar from '../../common/BottomStatsBar';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const ExistingCompaniesModal = ({ visible, onClose }: Props) => {
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
                    <Text style={styles.title}>My Empire</Text>
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
                                <Text style={styles.value}>${(item.valuation / 1_000_000).toFixed(1)}M</Text>
                                <Text style={[styles.change, item.lastChangePercent >= 0 ? { color: '#4ADE80' } : { color: '#FF453A' }]}>
                                    {item.lastChangePercent > 0 ? '+' : ''}{item.lastChangePercent.toFixed(1)}%
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.empty}>No companies owned.</Text>
                        </View>
                    }
                    contentContainerStyle={[
                        styles.listContent,
                        subsidiaries.length === 0 && styles.emptyList
                    ]}
                />

                <BottomStatsBar onHomePress={handleHomePress} />

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
        backgroundColor: '#121212',
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
        backgroundColor: '#1C1C1E',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    sector: {
        fontSize: 12,
        color: '#8E8E93',
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
        color: '#8E8E93',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 100, // Space for BottomStatsBar
    },
    emptyList: {
        flex: 1,
    }
});
