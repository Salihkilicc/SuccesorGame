import { useState, useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';

export type WeatherCondition = {
    emoji: string;
    label: string;
};

export type WeatherState = {
    temperature: number | null;
    condition: WeatherCondition | null;
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

const useWeatherLogic = (): WeatherState => {
    const [temperature, setTemperature] = useState<number | null>(null);
    const [condition, setCondition] = useState<WeatherCondition | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Geolocation.setRNConfiguration({ skipPermissionRequests: false, authorizationLevel: 'whenInUse' });
        Geolocation.requestAuthorization();

        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();
                    const cw = data.current_weather;
                    setTemperature(Math.round(cw.temperature));
                    setCondition(getCondition(cw.weathercode));
                } catch (fetchErr) {
                    setError('Could not load weather data.');
                } finally {
                    setLoading(false);
                }
            },
            (posErr) => {
                setError('Location access denied or unavailable.');
                setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
    }, []);

    return { temperature, condition, loading, error };
};

export default useWeatherLogic;
