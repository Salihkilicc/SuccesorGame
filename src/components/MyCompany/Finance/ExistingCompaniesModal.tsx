import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import SubsidiaryDetailModal from './SubsidiaryDetailModal';
import { formatMoney } from '../../../core/utils';
import ScreenHost from '../../common/ScreenHost';
import ScreenHeader from '../../common/ScreenHeader';
import { theme } from '../../../core/theme';
import { getCompanyVisual } from '../../../core/market/companyVisuals';

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
            <View style={styles.container}>
                {/* Header */}
                <ScreenHeader title={t('finance.myEmpire')} onBack={onClose} />

                <FlatList
                    data={subsidiaries}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => {
                        const visual = getCompanyVisual(item, item.valuation);
                        return (
                            <TouchableOpacity style={styles.row} onPress={() => setSelectedCompanyId(item.id)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                    <View style={[styles.sectorIconBadge, { backgroundColor: visual.badgeBg, borderColor: visual.badgeBorder }]}>
                                        <MaterialCommunityIcons name={visual.icon} size={22} color={visual.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                                            <View style={[styles.tierTag, { borderColor: `${visual.tierColor}40`, backgroundColor: `${visual.tierColor}15` }]}>
                                                <Text style={[styles.tierTagText, { color: visual.tierColor }]}>{visual.tierLabel}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.sector}>{item.sector}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                                    <Text style={styles.value}>{formatMoney(item.valuation)}</Text>
                                    <Text style={[styles.change, item.lastChangePercent >= 0 ? { color: '#7DD3FC' } : { color: theme.colors.textPrimary }]}>
                                        {item.lastChangePercent > 0 ? '+' : ''}{item.lastChangePercent.toFixed(1)}%
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
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
                {/* Detail Modal Integration */}
                {selectedCompanyId && (
                    <SubsidiaryDetailModal
                        visible={!!selectedCompanyId}
                        subsidiaryId={selectedCompanyId}
                        onClose={() => setSelectedCompanyId(null)}
                    />
                )}
            </View>
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
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        marginBottom: theme.spacing.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    sectorIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    tierTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    tierTagText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
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
        padding: theme.spacing.md,
        paddingBottom: 120, // clear of the nav bar
    },
    emptyList: {
        flex: 1,
    }
});
