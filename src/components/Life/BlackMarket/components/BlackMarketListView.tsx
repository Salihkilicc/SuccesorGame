import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

type BlackMarketListViewProps = {
    title: string;
    data: Array<any>;
    onBuy: (id: string) => void;
    onBack: () => void;
};

const BlackMarketListView = ({ title, data, onBuy, onBack }: BlackMarketListViewProps) => {
    return (
        <View style={styles.listContainer}>
            <View style={styles.listHeader}>
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </Pressable>
                <Text style={styles.listTitle}>{title}</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {data.map(item => (
                    <Pressable
                        key={item.id}
                        style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
                        onPress={() => onBuy(item.id)}
                    >
                        <View style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                {'description' in item && (
                                    <Text style={styles.itemDesc}>{item.description}</Text>
                                )}
                            </View>
                            <Text style={styles.itemPrice}>${item.price.toLocaleString()}</Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        marginBottom: 10,
    },
    backButton: {
        padding: 10,
    },
    backText: {
        color: '#888',
    },
    listTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    scrollContent: {
        padding: 20,
        gap: 12,
    },
    listItem: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#222',
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        color: '#eee',
        fontSize: 16,
        fontWeight: '600',
    },
    itemDesc: {
        color: '#555',
        fontSize: 12,
        marginTop: 4,
    },
    itemPrice: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BlackMarketListView;
