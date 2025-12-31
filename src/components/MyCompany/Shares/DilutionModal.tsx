import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { theme } from '../../../theme';

// Ortak Bileşenler
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';
import SectionCard from '../../common/SectionCard';

// YENİ SİSTEM (Slider Yerine)
import { PercentageSelector } from '../../atoms/PercentageSelector';

// Store
import { useStatsStore } from '../../../store/useStatsStore';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const DilutionModal = ({ visible, onClose }: Props) => {
    // State: Ne kadar hisse basılacak? (Varsayılan %5)
    const [dilutionPercentage, setDilutionPercentage] = useState(5);

    const { 
        companyValue, 
        companyOwnership, 
        companySharePrice, 
        performDilution 
    } = useStatsStore();

    // --- Hesaplamalar ---
    
    // 1. Yeni basılan hisselerden gelecek nakit para
    const capitalRaised = companyValue * (dilutionPercentage / 100);
    
    // 2. Sulandırma sonrası senin hissenin düşeceği yeni oran
    // Formül: Mevcut Hissen * (1 - Sulandırma Oranı)
    const newOwnership = companyOwnership * (1 - (dilutionPercentage / 100));
    
    // 3. Tahmini yeni hisse fiyatı (Arz artınca fiyat psikolojik olarak %3 düşer)
    const estimatedNewSharePrice = companySharePrice * 0.97; 

    const handleConfirm = () => {
        Alert.alert(
            "Onaylıyor musun?",
            `Hisseleri %${dilutionPercentage} oranında sulandırıp piyasaya süreceksin. Senin payın %${newOwnership.toFixed(1)} seviyesine düşecek.`,
            [
                { text: "İptal", style: "cancel" },
                { 
                    text: "Onayla ve Sat", 
                    style: "destructive",
                    onPress: () => {
                        performDilution(dilutionPercentage);
                        Alert.alert("Başarılı", `$${(capitalRaised / 1_000_000).toFixed(1)}M Nakit toplandı!`);
                        onClose();
                    }
                }
            ]
        );
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="Sermaye Artırımı (Dilution)"
        >
            <View style={styles.container}>
                
                <Text style={styles.description}>
                    Yeni hisse basarak yatırımcılardan nakit toplayabilirsin. 
                    Ancak bu işlem, şirketteki sahiplik oranını düşürür.
                </Text>

                {/* YENİ KONTROL PANELİ */}
                <PercentageSelector
                    label="Sulandırma Oranı"
                    value={dilutionPercentage}
                    min={1}
                    max={20} // Maksimum %20 sulandırmaya izin ver (Oyun dengesi)
                    onChange={setDilutionPercentage}
                    unit="%"
                />

                {/* Finansal Etkiler */}
                <View style={styles.impactContainer}>
                    <SectionCard
                        title="Toplanacak Nakit"
                        rightText={`+$${(capitalRaised / 1_000_000).toFixed(2)}M`}
                        style={{ borderColor: theme.colors.success }}
                    />
                    
                    <SectionCard
                        title="Yeni Hisseniz"
                        rightText={`%${newOwnership.toFixed(2)}`}
                        // Eğer hissen %50'nin altına düşüyorsa kırmızı uyarı ver
                        danger={newOwnership < 50} 
                    />

                    <SectionCard
                        title="Tahmini Hisse Fiyatı"
                        rightText={`$${estimatedNewSharePrice.toFixed(2)}`}
                    />
                </View>

                {/* Kritik Uyarı */}
                {newOwnership < 51 && companyOwnership >= 51 && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            ⚠️ DİKKAT: Bu işlemden sonra çoğunluk hissesini kaybedeceksiniz!
                        </Text>
                    </View>
                )}

                {/* Aksiyonlar */}
                <View style={styles.actionRow}>
                    <GameButton 
                        title="İşlemi Gerçekleştir" 
                        onPress={handleConfirm} 
                        variant="primary" 
                        style={{ flex: 1 }} 
                    />
                    <GameButton 
                        title="İptal" 
                        onPress={onClose} 
                        variant="ghost" 
                        style={{ flex: 1 }} 
                    />
                </View>

            </View>
        </GameModal>
    );
};

export default DilutionModal;

const styles = StyleSheet.create({
    container: { gap: 16, paddingVertical: 10 },
    description: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 4,
        lineHeight: 18,
    },
    impactContainer: { gap: 8 },
    warningBox: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        alignItems: 'center',
    },
    warningText: {
        color: '#FF6B6B',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 }
});