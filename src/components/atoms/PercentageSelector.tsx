import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../core/theme'; // Tema yolunu projene göre kontrol et

interface Props {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (val: number) => void;
    unit?: string;
}

export const PercentageSelector = ({
    label, value, min, max, onChange, unit = ""
}: Props) => {

    // 1. Kapasite Barı Hesaplaması (Görsel)
    const range = max - min;
    const percentage = range > 0 ? Math.min(100, Math.max(0, ((value - min) / range) * 100)) : 0;

    // 2. Değer Güncelleme Mantığı (Yüzdelik)
    const update = (type: 'min' | 'max' | 'percent', payload: number) => {
        let newValue = value;

        if (type === 'min') newValue = min;
        else if (type === 'max') newValue = max;
        else if (type === 'percent') {
            // Yüzdeliği, toplam kapasite (Range) üzerinden hesapla
            // Örn: Kapasite 1000 ise, %10 artış +100 demektir.
            const step = Math.ceil(range * (payload / 100));
            newValue = value + step;
        }

        // Güvenlik: Asla sınırların dışına çıkma
        const safeValue = Math.min(max, Math.max(min, newValue));
        onChange(safeValue);
    };

    // Buton Oluşturucu (Kod tekrarını önlemek için)
    const renderBtn = (label: string, onPress: () => void, bgColor: string, borderColor: string) => (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.btn, { backgroundColor: bgColor, borderColor: borderColor }]}
        >
            <Text style={styles.btnText}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* BAŞLIK ve DEĞER */}
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>
                    {value.toLocaleString()} <Text style={styles.unit}>{unit}</Text>
                </Text>
            </View>

            {/* GÖRSEL BAR (Dokunulmaz, sadece gösterge) */}
            <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${percentage}%` }]} />
            </View>
            <View style={styles.barLabels}>
                <Text style={styles.limitText}>{min}</Text>
                <Text style={styles.limitText}>{percentage.toFixed(0)}% Capacity</Text>
                <Text style={styles.limitText}>{max}</Text>
            </View>

            {/* BUTON IZGARASI */}
            <View style={styles.controls}>

                {/* 1. Satır: AZALTMA (Kırmızı/Turuncu Tonlar) */}
                <View style={styles.row}>
                    {renderBtn("MIN", () => update('min', 0), '#4A2525', '#742A2A')}
                    {renderBtn("-50%", () => update('percent', -50), '#552828', '#9B2C2C')}
                    {renderBtn("-10%", () => update('percent', -10), '#632727', '#C53030')}
                    {renderBtn("-5%", () => update('percent', -5), '#702828', '#E53E3E')}
                </View>

                {/* 2. Satır: ARTIRMA (Yeşil/Mavi Tonlar) */}
                <View style={styles.row}>
                    {renderBtn("+5%", () => update('percent', 5), '#1C4532', '#38A169')}
                    {renderBtn("+10%", () => update('percent', 10), '#194D33', '#2F855A')}
                    {renderBtn("+50%", () => update('percent', 50), '#155239', '#276749')}
                    {renderBtn("MAX", () => update('max', 0), '#114633', '#22543D')}
                </View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1A202C', // Koyu Kart Rengi
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2D3748',
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    label: { color: '#A0AEC0', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
    value: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
    unit: { fontSize: 12, color: '#718096', fontWeight: 'normal' },

    // Bar Stilleri
    barTrack: {
        height: 6,
        backgroundColor: '#2D3748',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: { height: '100%', backgroundColor: theme.colors.primary }, // Tema rengini kullanır
    barLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 10
    },
    limitText: { fontSize: 10, color: '#718096' },

    // Buton Stilleri
    controls: { gap: 6 },
    row: { flexDirection: 'row', gap: 6 },
    btn: {
        flex: 1,
        height: 36,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    btnText: { color: 'white', fontSize: 11, fontWeight: '700' },
});