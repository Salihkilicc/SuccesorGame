import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import useWeatherLogic, { DailyForecast } from '../hooks/useWeatherLogic';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

const ForecastDay = ({ item, isFirst }: { item: DailyForecast; isFirst: boolean }) => (
    <View style={[styles.forecastDay, isFirst && styles.forecastDayFirst]}>
        <Text style={[styles.forecastDayLabel, isFirst && styles.forecastDayLabelToday]}>
            {item.dayLabel}
        </Text>
        <Text style={styles.forecastEmoji}>{item.emoji}</Text>
        <Text style={styles.forecastHigh}>{item.high}°</Text>
        <Text style={styles.forecastLow}>{item.low}°</Text>
    </View>
);

const WeatherScreen = () => {
    useLocale();
    const navigation = useNavigation();
    const { temperature, condition, forecast, unit, toggleUnit, loading, error } = useWeatherLogic();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#020626', '#020626', '#020626']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <View style={styles.header}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.backLabel}>{t('life.home')}</Text>
                    </TouchableOpacity>

                    {/* Unit Toggle Button */}
                    <TouchableOpacity
                        style={styles.unitToggle}
                        onPress={toggleUnit}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.unitToggleText, unit === 'C' && styles.unitToggleActive]}>°C</Text>
                        <Text style={styles.unitToggleDivider}>|</Text>
                        <Text style={[styles.unitToggleText, unit === 'F' && styles.unitToggleActive]}>°F</Text>
                    </TouchableOpacity>
                </View>

                {/* Header Title */}
                <Text style={styles.appTitle}>{t('life.weather')}</Text>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    {loading ? (
                        <View style={styles.centerBox}>
                            <ActivityIndicator size="large" color="rgba(123,104,215,0.9)" />
                            <Text style={styles.statusText}>{t('life.detectingLocation')}</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centerBox}>
                            <MaterialCommunityIcons name="weather-cloudy-alert" size={64} color="rgba(199,52,202,0.7)" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : (
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* ── Current Weather Card ── */}
                            <View style={styles.glassCard}>
                                <Text style={styles.weatherEmoji}>{condition?.emoji ?? '🌡️'}</Text>
                                <Text style={styles.temperature}>
                                    {temperature !== null ? `${temperature}°` : '--'}
                                </Text>
                                <Text style={styles.unit}>{unit === 'C' ? 'Celsius' : 'Fahrenheit'}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.conditionLabel}>{condition?.label ?? 'Unknown'}</Text>
                            </View>

                            {/* ── 7-Day Forecast ── */}
                            {forecast.length > 0 && (
                                <View style={styles.forecastCard}>
                                    <Text style={styles.forecastTitle}>7-DAY FORECAST</Text>
                                    <View style={styles.forecastRow}>
                                        {forecast.map((item, i) => (
                                            <ForecastDay key={item.dayLabel + i} item={item} isFirst={i === 0} />
                                        ))}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>

                {/* Universal Crystal Navigation Bar (Dark Variant) */}
                <CrystalNavBar activeTab="Home" variant="dark" hideDots={true} />
            </SafeAreaView>
        </View>
    );
};

export default WeatherScreen;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0B0635',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    backLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    unitToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    unitToggleText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
    unitToggleActive: {
        color: '#FFFFFF',
    },
    unitToggleDivider: {
        color: 'rgba(255,255,255,0.48)',
        marginHorizontal: 8,
        fontSize: 14,
    },
    appTitle: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 6,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 0,
    },
    mainContent: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 140, // Increased to ensure scroll reaches bottom safely above CrystalNavBar
        gap: 16,
    },
    centerBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    statusText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    errorText: {
        color: 'rgba(199,52,202,0.9)',
        fontSize: 15,
        textAlign: 'center',
        letterSpacing: 0.3,
        lineHeight: 22,
        marginTop: 12,
    },
    // ── Current weather glass card ──
    glassCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 36,
        alignItems: 'center',
        shadowColor: '#6004BD',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
        elevation: 8,
    },
    weatherEmoji: {
        fontSize: 68,
        marginBottom: 12,
    },
    temperature: {
        fontSize: 90,
        fontWeight: '200',
        color: '#FFFFFF',
        letterSpacing: -4,
        lineHeight: 96,
    },
    unit: {
        fontSize: 13,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginTop: 4,
        marginBottom: 22,
    },
    divider: {
        width: 48,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginBottom: 22,
    },
    conditionLabel: {
        fontSize: 20,
        fontWeight: '300',
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    // ── 7-day forecast card ──
    forecastCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    forecastTitle: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 18,
        paddingHorizontal: 4,
    },
    forecastRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    forecastDay: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: 14,
    },
    forecastDayFirst: {
        backgroundColor: 'rgba(123,104,215,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(123,104,215,0.18)',
    },
    forecastDayLabel: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    forecastDayLabelToday: {
        color: 'rgba(123,104,215,0.9)',
    },
    forecastEmoji: {
        fontSize: 20,
        marginVertical: 2,
    },
    forecastHigh: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    forecastLow: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 11,
        fontWeight: '400',
    },
    attribution: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 10,
        letterSpacing: 0.5,
        textAlign: 'center',
        marginTop: 4,
    },
});
