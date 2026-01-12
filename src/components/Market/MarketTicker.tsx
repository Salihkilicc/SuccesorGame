import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MarketTicker = ({ items }: { items: any[] }) => {
    const flatListRef = useRef<FlatList>(null);
    const scrollOffsetRef = useRef(0);

    // 1. Prepare Data: Filter stocks & crypto, take top 15
    const topItems = items
        .filter(i => {
            // Include stocks and crypto
            return ('symbol' in i && i.symbol) || ('volatility' in i);
        })
        .slice(0, 15);

    // Triple the data for seamless infinite loop
    const tickerData = [...topItems, ...topItems, ...topItems];

    // 2. Auto Scroll Logic - Infinite Loop
    useEffect(() => {
        if (topItems.length === 0) return;

        const interval = setInterval(() => {
            scrollOffsetRef.current += 1; // Speed: 1px per 30ms

            // Estimated item width
            const itemWidth = 150;
            const maxOffset = topItems.length * itemWidth;

            // Reset to create infinite loop illusion
            if (scrollOffsetRef.current >= maxOffset) {
                scrollOffsetRef.current = 0;
            }

            flatListRef.current?.scrollToOffset({
                offset: scrollOffsetRef.current,
                animated: false
            });
        }, 30); // ~33fps for smooth animation

        return () => clearInterval(interval);
    }, [topItems.length]);

    const renderItem = ({ item }: any) => {
        const change = item.change || 0;
        const isUp = change >= 0;
        const price = item.price || 0;

        return (
            <View style={styles.itemContainer}>
                <Text style={styles.symbol}>{item.symbol || 'N/A'}</Text>
                <Text style={styles.price}>
                    ${price < 1 ? price.toFixed(4) : price.toFixed(2)}
                </Text>
                <Text style={[styles.change, { color: isUp ? '#4ade80' : '#ef4444' }]}>
                    {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </Text>
                <Text style={styles.separator}>|</Text>
            </View>
        );
    };

    if (topItems.length === 0) return null;

    return (
        <View style={styles.wrapper}>
            <FlatList
                ref={flatListRef}
                data={tickerData}
                renderItem={renderItem}
                keyExtractor={(_, index) => `ticker-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                getItemLayout={(data, index) => ({
                    length: 150,
                    offset: 150 * index,
                    index,
                })}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: 36,
        backgroundColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        justifyContent: 'center',
    },
    listContent: {
        alignItems: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 36,
        width: 150,
    },
    symbol: {
        color: '#ccc',
        fontWeight: 'bold',
        marginRight: 5,
        fontSize: 11,
    },
    price: {
        color: 'white',
        marginRight: 5,
        fontSize: 11,
    },
    change: {
        fontSize: 11,
        fontWeight: '700',
    },
    separator: {
        color: '#333',
        marginLeft: 10,
        fontSize: 11,
    },
});

export default MarketTicker;
