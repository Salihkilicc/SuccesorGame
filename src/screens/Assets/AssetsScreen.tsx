import React from 'react';
import { ScrollView, View, StyleSheet, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../core/theme';
import { useAssetsLogic } from './logic/useAssetsLogic'; // Yeni Hook
import {
    AssetsHeader,
    InfoCard,
    SummaryRow,
    CategoryCard,
    ActionTile
} from './components/AssetsUI'; // Yeni UI

const AssetsScreen = () => {
    const navigation = useNavigation<any>();
    const { stats, formatMoney } = useAssetsLogic();

    return (
        <View style={styles.safeArea}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* HEADER */}
                <AssetsHeader
                    risk={stats.riskApetite}
                    strategy={stats.strategicSense}
                    onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
                />

                {/* INFO CARDS */}
                <View style={styles.cardGroup}>
                    <InfoCard title="Last Market Event" body={stats.lastMarketEvent ?? 'No significant market event yet.'} />
                    <InfoCard title="Next Move Idea" body={stats.nextMove} variant="soft" />
                </View>

                {/* NET WORTH SUMMARY */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCol}>
                            <SummaryRow label="Net Worth" value={formatMoney(stats.netWorth)} />
                            <SummaryRow label="Cash" value={`$${stats.money.toLocaleString()}`} marginTop />
                            <SummaryRow label="Investments" value={formatMoney(stats.investmentsValue)} marginTop />
                        </View>

                        <View style={styles.summaryCol}>
                            <Pressable
                                onPress={() => navigation.navigate('Shopping')}
                                style={({ pressed }) => [styles.investmentsButton, pressed && { opacity: 0.9 }]}>
                                <View>
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase' }}>Shopping</Text>
                                    <Text style={{ color: theme.colors.textPrimary, fontWeight: '800', fontSize: 18 }}>Go to Mall</Text>
                                </View>
                                <Text style={{ color: theme.colors.accent, fontSize: 24, fontWeight: '800' }}>›</Text>
                            </Pressable>

                            <View style={styles.incomeRow}>
                                <SummaryRow label="Income" value={stats.monthlyIncome ? formatMoney(stats.monthlyIncome) : '$0'} />
                                <SummaryRow label="Expenses" value={stats.monthlyExpenses ? formatMoney(stats.monthlyExpenses) : '$0'} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* CATEGORIES */}
                <View style={styles.categoryGrid}>
                    <CategoryCard
                        label="Properties"
                        value={formatMoney(stats.propertiesValue)}
                        meta="Homes, estates, islands"
                        onPress={() => navigation.navigate('Shopping')}
                    />
                    <CategoryCard
                        label="Vehicles"
                        value={formatMoney(stats.vehiclesValue)}
                        meta="Cars, jets, yachts"
                        onPress={() => navigation.navigate('Shopping')}
                    />
                    <CategoryCard
                        label="Belongings"
                        value={formatMoney(stats.belongingsValue)}
                        meta="Art, jewelry, antiques"
                        onPress={() => navigation.navigate('Shopping')}
                    />
                </View>

                {/* ACTIONS */}
                <View style={styles.actionRow}>
                    <ActionTile
                        title="Market"
                        body="Scan the latest sectors and move quickly on opportunities."
                        variant="market"
                        onPress={() => navigation.navigate('Market')}
                    />
                    <ActionTile
                        title="My Company"
                        body="Review valuation, ownership, and make strategic moves."
                        variant="company"
                        onPress={() => navigation.navigate('MyCompany')}
                    />
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl * 2 + theme.spacing.sm, gap: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
    cardGroup: { gap: theme.spacing.sm },
    summaryCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
    summaryRow: { flexDirection: 'row', gap: theme.spacing.lg },
    summaryCol: { flex: 1, gap: theme.spacing.sm },
    investmentsButton: { backgroundColor: theme.colors.cardSoft, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    incomeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.lg, marginTop: theme.spacing.md },
    categoryGrid: { flexDirection: 'row', gap: theme.spacing.md },
    actionRow: { flexDirection: 'row', gap: theme.spacing.md },
});

export default AssetsScreen;