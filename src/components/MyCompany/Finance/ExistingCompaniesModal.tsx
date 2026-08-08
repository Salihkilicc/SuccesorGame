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
import { formatMoney } from '../../../core/utils';
import ScreenHost from '../../common/ScreenHost';

type Props = {
    /** Render as a route rather than a popup - see components/common/ScreenHost. */
    asScreen?: boolean;
    visible: boolean;
    onClose: () => void;
};

const ExistingCompaniesModal = ({ visible, onClose, asScreen }: Props) => {
    useLocale();
    const navigation = useNavigation<any>();
    const { subsidiaries } = useCorporateFinanceStore();
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    return (
        <ScreenHost asScreen={asScreen} visible={visible} animationType="slide" presentationStyle="fullScreen">
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
                                <Text style={[styles.change, item.lastChangePercent >= 0 ? { color: '#7DD3FC' } : { color: '#FF8A8A' }]}>
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
                />                {/* Detail Modal Integration */}
                {selectedCompanyId && (
                    <SubsidiaryDetailModal
                        visible={!!selectedCompanyId}
                        subsidiaryId={selectedCompanyId}
                        onClose={() => setSelectedCompanyId(null)}
                    />
                )}
            </SafeAreaView>
        </ScreenHost>
    );
};

export default ExistingCompaniesModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
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
        backgroundColor: '#434B50',
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
        backgroundColor: '#434B50',
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
