import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { theme } from '../../../core/theme';
import { useRelationshipBuffs } from '../../love/hooks/useRelationshipBuffs';
import { useGymSystem } from '../components/Gym/useGymSystem';

// İkon kütüphanesi yoksa veya hata verirse bunları emoji olarak kullanabilirsin.
// Şimdilik Emoji kullanıyoruz ki ekstra paket yüklemeden çalışsın.

const ProgressBar = ({ label, value, max = 100, color = '#3498db', icon, buff }: { label: string, value: number, max?: number, color?: string, icon?: string, buff?: string }) => {
    // Değerlerin undefined gelme ihtimaline karşı koruma
    const safeValue = value || 0;
    const percentage = Math.min(100, Math.max(0, (safeValue / max) * 100));

    return (
        <View style={styles.statRow}>
            <View style={styles.statLabelContainer}>
                {icon && <Text style={{ fontSize: 16, marginRight: 8 }}>{icon}</Text>}
                <Text style={styles.statLabel}>{label}</Text>
                {buff && (
                    <View style={styles.buffBadge}>
                        <Text style={styles.buffText}>{buff} 💖</Text>
                    </View>
                )}
            </View>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.statValue}>{safeValue}/{max}</Text>
        </View>
    );
};

const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const DNAScreen = () => {
    const navigation = useNavigation();

    // Store'dan verileri çekiyoruz
    const {
        attributes,
        personality,
        reputation,
        security,
        skills
    } = usePlayerStore();

    // Relationship Buffs
    const { intellectBoost, strengthBoost, socialBoost } = useRelationshipBuffs();

    // Gym 3.0 Integration
    const { selectedArt, beltTitle, beltRank, bodyType, fatigue } = useGymSystem();

    // Security Level based on belt rank (0-5 = 0-50%)
    const securityLevel = beltRank * 10;

    // Display text for martial arts
    const martialArtsDisplay = selectedArt
        ? `${selectedArt.charAt(0).toUpperCase() + selectedArt.slice(1)} - ${beltTitle}`
        : 'None';

    const handleBack = () => navigation.goBack();

    // Kuşak rengine göre yazı rengini ayarlayan yardımcı fonksiyon
    const getBeltTextColor = (belt: string) => {
        const lowerBelt = belt?.toLowerCase() || 'white';
        if (['white', 'yellow'].includes(lowerBelt)) return '#000';
        return '#fff';
    };

    const getBeltBgColor = (belt: string) => {
        const lowerBelt = belt?.toLowerCase() || 'white';
        // Özel renk haritası
        const colors: Record<string, string> = {
            white: '#f5f5f5',
            yellow: '#f1c40f',
            orange: '#e67e22',
            green: '#2ecc71',
            blue: '#3498db',
            purple: '#9b59b6',
            brown: '#795548',
            black: '#000000'
        };
        return colors[lowerBelt] || '#ccc';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
                    <Text style={styles.backIcon}>←</Text>
                    <Text style={styles.headerTitle}>DNA & Stats Dashboard</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* 🛡️ SECURITY - Yeni Özellik */}
                <View style={styles.card}>
                    <SectionHeader title="Security & Safety" icon="🛡️" />
                    <ProgressBar label="Digital Shield" value={security?.digital} color="#3498db" icon="💻" />
                    <ProgressBar label="Bodyguard / Armor" value={securityLevel} color="#e74c3c" icon="🥋" />
                    <ProgressBar label="Police Heat" value={reputation?.police} color="#f39c12" icon="🚨" />
                </View>

                {/* 🥋 SKILLS - Gym 3.0 Integration */}
                <View style={styles.card}>
                    <SectionHeader title="Combat Mastery" icon="👊" />
                    <View style={styles.skillRow}>
                        <View>
                            <Text style={styles.skillName}>Self Defense</Text>
                            <Text style={styles.skillDetail}>
                                {martialArtsDisplay}
                            </Text>
                            <Text style={styles.skillDetail}>
                                Security Boost: <Text style={{ fontWeight: 'bold', color: '#2ecc71' }}>+{securityLevel}%</Text>
                            </Text>
                            <Text style={styles.skillDetail}>
                                Body Type: <Text style={{ fontWeight: 'bold', color: '#f39c12' }}>{bodyType}</Text>
                            </Text>
                        </View>
                        <View style={[styles.beltBadge, { backgroundColor: getBeltBgColor(beltTitle) }]} >
                            <Text style={[styles.beltText, { color: getBeltTextColor(beltTitle) }]}>
                                {beltTitle}
                            </Text>
                        </View>
                    </View>
                    <ProgressBar
                        label="Fatigue Level"
                        value={fatigue}
                        max={100}
                        color={fatigue > 80 ? '#e74c3c' : '#2ecc71'}
                        icon="⚡"
                    />
                </View>

                {/* 🃏 REPUTATION - Detaylı İtibar Ağı */}
                <View style={styles.card}>
                    <SectionHeader title="Reputation Network" icon="🕸️" />
                    <ProgressBar label="Casino (VIP)" value={reputation?.casino} color="#E91E63" icon="🎰" />
                    <ProgressBar label="Street (Cred)" value={reputation?.street} color="#c0392b" icon="🗡️" />
                    <ProgressBar label="Business (Trust)" value={reputation?.business} color="#2980b9" icon="💼" />
                    <ProgressBar
                        label="High Society"
                        value={reputation?.social}
                        color="#8e44ad"
                        icon="🥂"
                        buff={socialBoost > 0 ? `+${socialBoost}` : undefined}
                    />
                </View>

                {/* 🧬 GENETICS - Temel Özellikler */}
                <View style={styles.card}>
                    <SectionHeader title="Core Genetics" icon="🧬" />
                    <ProgressBar
                        label="Intellect"
                        value={attributes?.intellect}
                        color="#9b59b6"
                        icon="🧠"
                        buff={intellectBoost > 0 ? `+${intellectBoost}` : undefined}
                    />
                    <ProgressBar label="Charm" value={attributes?.charm} color="#e91e63" icon="👄" />
                    <ProgressBar label="Looks" value={attributes?.looks} color="#f1c40f" icon="✨" />
                    <ProgressBar
                        label="Strength"
                        value={attributes?.strength}
                        color="#e74c3c"
                        icon="💪"
                        buff={strengthBoost > 0 ? `+${strengthBoost}` : undefined}
                    />
                </View>

                {/* 🧠 PERSONALITY - Karakter */}
                <View style={styles.card}>
                    <SectionHeader title="Personality Traits" icon="🎭" />
                    <ProgressBar label="Ambition" value={personality?.ambition} color="#FFC107" icon="🔥" />
                    <ProgressBar label="Risk Appetite" value={personality?.riskAppetite} color="#FF5722" icon="🎲" />
                    <ProgressBar label="Morality" value={personality?.morality} color="#8BC34A" icon="😇" />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', // Dark Mode uyumlu arka plan
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: '#1e1e1e',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 22,
        color: '#fff',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
        gap: 16
    },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    sectionIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800', // Extra Bold
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    statLabelContainer: {
        flexDirection: 'row',
        width: 140,
        alignItems: 'center'
    },
    statLabel: {
        color: '#ccc',
        fontSize: 14,
        fontWeight: '500',
    },
    buffBadge: {
        backgroundColor: '#1B5E20', // Dark Green
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 6,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buffText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4CAF50', // Bright Green Text
    },
    progressContainer: {
        flex: 1,
        height: 8, // Daha ince ve modern bar
        backgroundColor: '#333',
        borderRadius: 4,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    statValue: {
        width: 50, // Sabit genişlik hizalama için
        textAlign: 'right',
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'], // Sayıların hizalı durması için
    },
    skillRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    skillName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    skillDetail: {
        color: '#888',
        fontSize: 13,
    },
    beltBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    beltText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});

export default DNAScreen;