import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import { theme } from '../../core/theme';
import { useStatsStore, usePlayerStore } from '../../core/store';

const { width } = Dimensions.get('window');

interface CrystalNavBarProps {
    activeTab: 'Life' | 'Home' | 'Company' | 'Love';
    variant: 'light' | 'dark';
}

const CrystalNavBar: React.FC<CrystalNavBarProps> = ({ activeTab, variant }) => {
    const navigation = useNavigation<any>();
    const [isStatsMode, setIsStatsMode] = useState(false);

    // Stores
    const userMoney = useStatsStore(state => state.money);
    const { core: playerCore, attributes: playerAttributes } = usePlayerStore();

    const navigateTo = (screen: string) => {
        setIsStatsMode(false);
        if (screen === 'Company') {
            navigation.navigate('MyCompany');
        } else if (screen === 'Contacts') {
            navigation.navigate('Love');
        } else if (screen === 'Profile') {
            navigation.navigate('DNA');
        } else {
            navigation.navigate(screen);
        }
    };

    const isLight = variant === 'light';
    const blurType = isLight ? 'light' : 'dark';
    const containerStyle = isLight ? styles.lightContainer : styles.darkContainer;

    const getIconStyle = (tabName: string) => {
        const isActive = activeTab === tabName;
        return {
            color: isActive ? (isLight ? '#FFFFFF' : theme.colors.primary) : (isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)'),
            fontSize: 24,
            textShadowColor: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
        };
    };

    const getLabelStyle = (tabName: string) => {
        const isActive = activeTab === tabName;
        return {
            color: isActive ? (isLight ? '#FFFFFF' : theme.colors.primary) : (isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)'),
            fontSize: 10,
            fontWeight: '700' as '700',
            letterSpacing: 0.3,
            marginTop: 4,
            textAlign: 'center' as 'center',
        };
    };

    // The order of tabs in SwipeNavigator is: Life, Home, Love, MyCompany.
    // We map activeTab to an index for the pagination dots.
    const getDotIndex = () => {
        switch (activeTab) {
            case 'Life': return 0;
            case 'Home': return 1;
            case 'Love': return 2;
            case 'Company': return 3;
            default: return 1; // Default to Home
        }
    };
    const activeDotIndex = getDotIndex();
    const dots = [0, 1, 2, 3];

    return (
        <>
            {/* Dimming Overlay */}
            {isStatsMode && (
                <Pressable
                    style={styles.statsOverlay}
                    onPress={() => setIsStatsMode(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                </Pressable>
            )}

            <View style={[styles.bottomBarContainer, { zIndex: 1000 }]}>
                {/* Pagination Dots */}
                <View style={styles.paginationContainer}>
                    {dots.map((dot, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                activeDotIndex === index ? styles.activeDot : styles.inactiveDot,
                                isLight ? styles.lightDot : styles.darkDot
                            ]}
                        />
                    ))}
                </View>

                <BlurView
                    style={styles.blurContainer}
                    blurType={blurType}
                    blurAmount={20}
                    reducedTransparencyFallbackColor={isLight ? "white" : "black"}
                >
                    <View style={[styles.bottomBar, containerStyle]}>
                        {!isStatsMode ? (
                            <>
                                <Pressable style={styles.bottomTab} onPress={() => navigateTo('Home')}>
                                    <Text style={getIconStyle('Home')}>🏠</Text>
                                    <Text style={getLabelStyle('Home')}>Home</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(true)}>
                                    <Text style={getIconStyle('')}>📊</Text>
                                    <Text style={getLabelStyle('')}>Stats</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => navigateTo('Contacts')}>
                                    <Text style={getIconStyle('Love')}>👥</Text>
                                    <Text style={getLabelStyle('Love')}>Contacts</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => navigateTo('Profile')}>
                                    <Text style={getIconStyle('DNA')}>👤</Text>
                                    <Text style={getLabelStyle('DNA')}>Profile</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(false)}>
                                    <Text style={styles.statsIcon}>💰</Text>
                                    <Text style={styles.statsLabel}>${userMoney.toLocaleString()}</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(false)}>
                                    <Text style={[styles.statsIcon, { color: theme.colors.success }]}>❤️</Text>
                                    <Text style={styles.statsLabel}>{playerCore.health}%</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(false)}>
                                    <Text style={[styles.statsIcon, { color: theme.colors.danger }]}>🧠</Text>
                                    <Text style={styles.statsLabel}>{playerCore.stress}%</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(false)}>
                                    <Text style={[styles.statsIcon, { color: theme.colors.accent }]}>💎</Text>
                                    <Text style={styles.statsLabel}>{playerAttributes.charm}%</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </BlurView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    statsOverlay: {
        position: 'absolute',
        top: -1000, // Cover the whole screen upwards
        bottom: -1000,
        left: -1000,
        right: -1000,
        zIndex: 998,
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 34,
        left: 15,
        right: 15,
        // Removed overflow: hidden so dots above it are visible if we place them inside
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8, // Space between dots and bar
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 4,
        // Added subtle shadow for dots
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 2,
    },
    activeDot: {
        width: 18, // Elongated active dot (iOS style)
    },
    inactiveDot: {
        width: 6,  // Circular inactive dot
    },
    lightDot: {
        backgroundColor: '#FFFFFF',
        opacity: 0.9,
    },
    darkDot: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    blurContainer: {
        borderRadius: 35,
        overflow: 'hidden',
        // Moved shadow to blur container itself
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    bottomBar: {
        flexDirection: 'row',
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 10,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderRadius: 35,
        borderWidth: 1,
    },
    lightContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    darkContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    bottomTab: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    statsIcon: {
        fontSize: 24,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    statsLabel: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
        marginTop: 4,
        textAlign: 'center',
    },
});

export default CrystalNavBar;
