import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import useWeatherLogic from '../hooks/useWeatherLogic';

const WeatherScreen = () => {
    const navigation = useNavigation();
    const { temperature, condition, loading, error } = useWeatherLogic();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#050A1A', '#0A1832', '#071428']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="chevron-left" size={28} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.backLabel}>Home</Text>
                </TouchableOpacity>

                {/* Header Title */}
                <Text style={styles.appTitle}>WEATHER</Text>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    {loading ? (
                        <View style={styles.centerBox}>
                            <ActivityIndicator size="large" color="rgba(100,180,255,0.9)" />
                            <Text style={styles.statusText}>Detecting location…</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centerBox}>
                            <MaterialCommunityIcons name="weather-cloudy-alert" size={64} color="rgba(255,100,100,0.7)" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : (
                        <View style={styles.weatherCard}>
                            {/* Glassy card background */}
                            <View style={styles.glassCard}>
                                {/* Weather Emoji */}
                                <Text style={styles.weatherEmoji}>{condition?.emoji ?? '🌡️'}</Text>

                                {/* Temperature — the star of the show */}
                                <Text style={styles.temperature}>
                                    {temperature !== null ? `${temperature}°` : '--'}
                                </Text>
                                <Text style={styles.unit}>Celsius</Text>

                                {/* Divider */}
                                <View style={styles.divider} />

                                {/* Condition Label */}
                                <Text style={styles.conditionLabel}>{condition?.label ?? 'Unknown'}</Text>
                            </View>

                            {/* Attribution */}
                            <Text style={styles.attribution}>Powered by Open-Meteo · Real-time data</Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

export default WeatherScreen;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#050A1A',
    },
    safeArea: {
        flex: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 2,
    },
    backLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    appTitle: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 6,
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 0,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    centerBox: {
        alignItems: 'center',
        gap: 16,
    },
    statusText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    errorText: {
        color: 'rgba(255,140,140,0.9)',
        fontSize: 15,
        textAlign: 'center',
        letterSpacing: 0.3,
        lineHeight: 22,
        marginTop: 12,
    },
    weatherCard: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    glassCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 40,
        alignItems: 'center',
        // Subtle glow
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
        elevation: 8,
    },
    weatherEmoji: {
        fontSize: 72,
        marginBottom: 16,
    },
    temperature: {
        fontSize: 96,
        fontWeight: '200',
        color: '#FFFFFF',
        letterSpacing: -4,
        lineHeight: 104,
    },
    unit: {
        fontSize: 14,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginTop: 4,
        marginBottom: 24,
    },
    divider: {
        width: 48,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginBottom: 24,
    },
    conditionLabel: {
        fontSize: 22,
        fontWeight: '300',
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    attribution: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 11,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
});
