
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { theme } from '../../../core/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppScreen from '../../../components/layout/AppScreen';
import StockInfoSection from '../../../components/Market/StockInfoSection';
import BuySellPanel from '../../../components/Market/BuySellPanel';
import SimpleLineChart from '../../../components/Market/SimpleLineChart';
import { getFakeChartData } from '../data/chartData';
import { INITIAL_MARKET_ITEMS } from '../data/marketData';
import { formatPrice } from '../../../core/utils';

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
    const changeColor = isPositive ? '#5FB37A' : '#E06B6B';

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
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
                >
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
                </Pressable>
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
                                {formatPrice(currentPrice)}
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    backBtnPressed: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        transform: [{ scale: 0.95 }],
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
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    symbolText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    categoryText: {
        fontSize: 12,
        color: '#E9B8C9',
        fontWeight: '600',
        marginTop: 4,
    },
    priceText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    changeText: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
    },
    chartContainer: {
        height: 180,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
});

export default StockDetailScreen;
