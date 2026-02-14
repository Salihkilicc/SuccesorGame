
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { theme } from '../../../core/theme';
import AppScreen from '../../../components/layout/AppScreen';
import StockInfoSection from '../../../components/Market/StockInfoSection';
import BuySellPanel from '../../../components/Market/BuySellPanel';
import SimpleLineChart from '../../../components/Market/SimpleLineChart';
import { getFakeChartData } from '../data/chartData';
import { INITIAL_MARKET_ITEMS } from '../data/marketData';

const StockDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();

    // Safely destructure params with defaults
    const {
        symbol = 'UNKNOWN',
        price: initialPrice = 0,
        change: initialChange = 0,
        category = 'Stock',
        name = ''
    } = route.params || {};

    // Determine current price (Logic: use params as fallback if store lookup fails)
    // In a real scenario, we'd use ID to look up live price.
    const currentPrice = initialPrice;
    const currentChange = initialChange;

    const isPositive = currentChange >= 0;
    const changeColor = isPositive ? theme.colors.success : theme.colors.danger;

    // Get current quarter for random chart selection
    const currentMonth = useGameStore(state => state.currentMonth);
    const quarters = Math.ceil(currentMonth / 3);

    // Get deterministic random chart data
    const chartData = getFakeChartData(symbol, isPositive, quarters);

    // Find market item for additional info
    const marketItem = INITIAL_MARKET_ITEMS.find(item => 'symbol' in item && item.symbol === symbol);
    const valuation = marketItem && 'marketCap' in marketItem ? (marketItem as any).marketCap : undefined;

    return (
        <AppScreen
            title={symbol}
            subtitle={name || "Stock Details"}
            leftNode={
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            }
        >
            <View style={{ flex: 1 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Card */}
                    <View style={styles.headerCard}>
                        <View>
                            <Text style={styles.symbolText}>{symbol}</Text>
                            <Text style={styles.categoryText}>{category}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.priceText}>
                                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            <Text style={[styles.changeText, { color: changeColor }]}>
                                {isPositive ? '+' : ''}{currentChange}%
                            </Text>
                        </View>
                    </View>

                    {/* Chart Visualization */}
                    <View style={styles.chartContainer}>
                        <SimpleLineChart
                            data={chartData}
                            color={changeColor}
                            height={150}
                        />
                    </View>

                    {/* Company Info */}
                    <StockInfoSection
                        description={marketItem && 'description' in marketItem ? marketItem.description : undefined}
                        valuation={valuation}
                    />

                    {/* Trading Panel */}
                    <BuySellPanel
                        symbol={symbol}
                        price={currentPrice}
                        category={category}
                    />

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    backBtn: {
        padding: 4,
    },
    backText: {
        color: theme.colors.accent, // Using accent color usually indicates interactive elements
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
        paddingBottom: 40,
    },
    headerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.card, // Ensure this isn't transparent if bg is dark
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    symbolText: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    categoryText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    priceText: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    changeText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    chartContainer: {
        height: 180,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        overflow: 'hidden', // Ensure chart stays inside
    },
});

export default StockDetailScreen;
