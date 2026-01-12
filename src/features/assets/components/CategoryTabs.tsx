import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export type TabKey = 'stocks' | 'crypto' | 'bonds' | 'funds';

export interface TabOption<T extends string> {
    key: T;
    label: string;
}

interface CategoryTabsProps<T extends string> {
    tabs: TabOption<T>[];
    selectedTab: T;
    onSelectTab: (tab: T) => void;
    containerStyle?: any;
    tabStyle?: any;
    activeTabStyle?: any;
}

export function CategoryTabs<T extends string>({
    tabs,
    selectedTab,
    onSelectTab,
    containerStyle,
    tabStyle,
    activeTabStyle
}: CategoryTabsProps<T>) {
    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {tabs.map((tab) => {
                    const isActive = selectedTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, tabStyle, isActive && [styles.activeTab, activeTabStyle]]}
                            onPress={() => onSelectTab(tab.key)}
                        >
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 50,
        backgroundColor: '#1E1E1E', // Dark background
        marginBottom: 8,
    },
    scrollContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#444',
    },
    activeTab: {
        backgroundColor: '#FFD700', // Gold accent
        borderColor: '#FFD700',
    },
    tabText: {
        color: '#CCC',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#000',
        fontWeight: 'bold',
    },
});
