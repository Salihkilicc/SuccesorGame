import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { ScrollView, View, StyleSheet, Pressable, Text, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { useAssetsLogic } from '../hooks/useAssetsLogic';
import {
    SummaryRow,
    BreakdownSection
} from '../components/AssetsUI';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney as formatMoneyExact } from '../../../core/utils';

const AssetsScreen = () => {
    useLocale();
    const navigation = useNavigation<any>();
    const { cash, netWorth, report } = useAssetsLogic();

    const formatMoney = (value: number) => {
        const absolute = Math.abs(value);
        return formatMoneyExact(value);
    };

    const backButton = (
        <Pressable
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#020626' }}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#020626', '#020626', '#020626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.sideNode}>{backButton}</View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>{t('company.assets')}</Text>
                        <Text style={styles.headerSubtitle}>{t('company.wealthManagement')}</Text>
                    </View>
                    <View style={styles.sideNode} />
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* QUARTERLY FINANCIAL OVERVIEW */}
                    <View style={styles.glassCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.sectionTitle}>{t('company.quarterlyReport2')}</Text>
                            <MaterialCommunityIcons name="finance" size={20} color="rgba(255,255,255,0.48)" />
                        </View>

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCol}>
                                <SummaryRow label={t('company.netWorth')} value={formatMoney(netWorth)} />
                                <SummaryRow label={t('company.cash')} value={formatMoney(cash)} marginTop />
                            </View>

                            <View style={styles.summaryCol}>
                                <SummaryRow
                                    label={t('company.incomeQ')}
                                    value={formatMoney(report.totalIncome)}
                                    valueColor={theme.colors.success}
                                />
                                <SummaryRow
                                    label={t('company.expensesQ')}
                                    value={formatMoney(report.totalExpenses)}
                                    valueColor={theme.colors.danger}
                                    marginTop
                                />
                            </View>
                        </View>

                        <View style={styles.netFlowContainer}>
                            <Text style={styles.netFlowLabel}>{t('company.netFlow')}</Text>
                            <Text style={[styles.netFlowValue, { color: report.netFlow >= 0 ? theme.colors.success : theme.colors.danger }]}>
                                {report.netFlow >= 0 ? '+' : ''}{formatMoney(report.netFlow)}
                            </Text>
                        </View>

                        {/* DETAIL BREAKDOWN */}
                        <View style={styles.divider} />

                        <BreakdownSection title={t('company.currentAssets')} items={report.assetsBreakdown} />
                        <BreakdownSection title={t('company.incomeSources')} items={report.incomeBreakdown} isIncome />
                        <BreakdownSection title={t('company.quarterlyExpenses')} items={report.expenseBreakdown} />
                    </View>
                </ScrollView>

                <CrystalNavBar activeTab="Company" variant="dark" />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginTop: 2,
    },
    sideNode: {
        width: 44,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
    },
    glassCard: {
        backgroundColor: '#020626',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#020626',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 20,
    },
    summaryCol: {
        flex: 1,
    },
    netFlowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
    },
    netFlowLabel: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    netFlowValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    backButtonPressed: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        transform: [{ scale: 0.95 }],
    },
});

export default AssetsScreen;