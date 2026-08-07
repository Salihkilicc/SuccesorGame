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

// Tab icon mapping for the main category tabs
const TAB_ICONS: Record<string, string> = {
    stocks: '📈',
    crypto: '₿',
    bonds: '🏛️',
    funds: '💼',
    Technology: '💻',
    Health: '⚕️',
    Industrial: '🏭',
    Finance: '🏦',
};

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
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {tabs.map((tab) => {
                    const isActive = selectedTab === tab.key;
                    const icon = TAB_ICONS[tab.key];
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, tabStyle, isActive && [styles.activeTab, activeTabStyle]]}
                            onPress={() => onSelectTab(tab.key)}
                            activeOpacity={0.75}
                        >
                            {icon ? <Text style={styles.tabIcon}>{icon}</Text> : null}
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
        height: 54,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: 10,
        alignItems: 'center',
        gap: 6,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    activeTab: {
        backgroundColor: 'rgba(212,175,55,0.18)',
        borderColor: '#E9B8C9',
        shadowColor: '#E9B8C9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    tabIcon: {
        fontSize: 13,
    },
    tabText: {
        color: '#8A807B',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    activeTabText: {
        color: '#E9B8C9',
        fontWeight: '800',
    },
});

