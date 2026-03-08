import { useState, useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';

export type WeatherCondition = {
    emoji: string;
    label: string;
};

export type DailyForecast = {
    dayLabel: string; // e.g. "Mon", "Tue"
    emoji: string;
    high: number;
    low: number;
};

export type TemperatureUnit = 'C' | 'F';

export type WeatherState = {
    temperature: number | null;
    condition: WeatherCondition | null;
    forecast: DailyForecast[];
    unit: TemperatureUnit;
    toggleUnit: () => void;
    loading: boolean;
    error: string | null;
};

/**
 * Maps Open-Meteo WMO weather codes to human-readable label + emoji.
 * https://open-meteo.com/en/docs#weathervariables
 */
const getCondition = (code: number): WeatherCondition => {
    if (code === 0) return { emoji: '☀️', label: 'Clear Sky' };
    if (code <= 2) return { emoji: '⛅', label: 'Partly Cloudy' };
    if (code === 3) return { emoji: '☁️', label: 'Overcast' };
    if (code <= 49) return { emoji: '🌫️', label: 'Foggy' };
    if (code <= 59) return { emoji: '🌦️', label: 'Drizzle' };
    if (code <= 69) return { emoji: '🌧️', label: 'Rain' };
    if (code <= 79) return { emoji: '🌨️', label: 'Snow' };
    if (code <= 82) return { emoji: '🌧️', label: 'Showers' };
    if (code <= 86) return { emoji: '❄️', label: 'Snow Showers' };
    if (code <= 99) return { emoji: '⛈️', label: 'Thunderstorm' };
    return { emoji: '🌡️', label: 'Unknown' };
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const celsiusToFahrenheit = (celsius: number) => Math.round((celsius * 9) / 5 + 32);

const useWeatherLogic = (): WeatherState => {
    const [rawTempC, setRawTempC] = useState<number | null>(null);
    const [rawForecastC, setRawForecastC] = useState<DailyForecast[]>([]);
    const [unit, setUnit] = useState<TemperatureUnit>('C');
    const [condition, setCondition] = useState<WeatherCondition | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const toggleUnit = () => setUnit((prev) => (prev === 'C' ? 'F' : 'C'));

    useEffect(() => {
        Geolocation.setRNConfiguration({ skipPermissionRequests: false, authorizationLevel: 'whenInUse' });
        Geolocation.requestAuthorization();

        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const url =
                        `https://api.open-meteo.com/v1/forecast` +
                        `?latitude=${latitude}&longitude=${longitude}` +
                        `&current_weather=true` +
                        `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
                        `&timezone=auto`;

                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();

                    // Current weather
                    const cw = data.current_weather;
                    setRawTempC(Math.round(cw.temperature));
                    setCondition(getCondition(cw.weathercode));

                    // 7-day daily forecast
                    const daily = data.daily;
                    const days: DailyForecast[] = daily.time.map((dateStr: string, i: number) => {
                        const dow = new Date(dateStr).getDay();
                        return {
                            dayLabel: i === 0 ? 'Today' : DAY_LABELS[dow],
                            emoji: getCondition(daily.weathercode[i]).emoji,
                            high: Math.round(daily.temperature_2m_max[i]),
                            low: Math.round(daily.temperature_2m_min[i]),
                        };
                    });
                    setRawForecastC(days);
                } catch (fetchErr) {
                    setError('Could not load weather data.');
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError('Location access denied or unavailable.');
                setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
    }, []);

    // Compute derived values based on unit
    const temperature = rawTempC !== null ? (unit === 'C' ? rawTempC : celsiusToFahrenheit(rawTempC)) : null;
    const forecast = rawForecastC.map(day => ({
        ...day,
        high: unit === 'C' ? day.high : celsiusToFahrenheit(day.high),
        low: unit === 'C' ? day.low : celsiusToFahrenheit(day.low),
    }));

    return { temperature, condition, forecast, unit, toggleUnit, loading, error };
};

export default useWeatherLogic;
