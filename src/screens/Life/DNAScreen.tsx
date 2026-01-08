import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../../store'; // Adjust import based on your structure
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo, if not use standard Icon

const ProgressBar = ({ label, value, max = 100, color = theme.colors.primary, icon }: { label: string, value: number, max?: number, color?: string, icon?: string }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <View style={styles.statRow}>
            <View style={styles.statLabelContainer}>
                {icon && <Text style={{ fontSize: 14, marginRight: 6 }}>{icon}</Text>}
                <Text style={styles.statLabel}>{label}</Text>
            </View>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.statValue}>{value}/{max}</Text>
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
    const {
        attributes,
        personality,
        reputation,
        security,
        skills,
        core
    } = usePlayerStore();

    const handleBack = () => navigation.goBack();

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
                    <Text style={styles.backIcon}>←</Text>
                    <Text style={styles.headerTitle}>DNA & Stats</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* 🛡️ SECURITY */}
                <View style={styles.card}>
                    <SectionHeader title="Security & Safety" icon="🛡️" />
                    <ProgressBar label="Digital Security" value={security.digital} color={theme.colors.accent} icon="💻" />
                    <ProgressBar label="Personal Security" value={security.personal} color={theme.colors.danger} icon="🥋" />
                    <ProgressBar label="Police Heat" value={reputation.police} color={theme.colors.warning} icon="🚨" />
                </View>

                {/* 🥋 SKILLS */}
                <View style={styles.card}>
                    <SectionHeader title="Skills & Mastery" icon="🥋" />

                    <View style={styles.skillRow}>
                        <View>
                            <Text style={styles.skillName}>Martial Arts</Text>
                            <Text style={styles.skillDetail}>Rank: {skills.martialArts.belt} Belt (Lvl {skills.martialArts.level})</Text>
                        </View>
                        <View style={[styles.beltBadge, { backgroundColor: skills.martialArts.belt.toLowerCase() === 'white' ? '#ddd' : skills.martialArts.belt.toLowerCase() }]} >
                            <Text style={[styles.beltText, { color: skills.martialArts.belt.toLowerCase() === 'white' ? '#000' : '#fff' }]}>{skills.martialArts.belt}</Text>
                        </View>
                    </View>
                    <ProgressBar label="Progress" value={skills.martialArts.progress} max={100} color={theme.colors.success} />
                </View>

                {/* 🃏 REPUTATION */}
                <View style={styles.card}>
                    <SectionHeader title="Reputation" icon="🃏" />
                    <ProgressBar label="Casino Rep" value={reputation.casino} color="#E91E63" icon="🎰" />
                    <ProgressBar label="Street Rep" value={reputation.street} color="#F44336" icon="🗡️" />
                    <ProgressBar label="Business Rep" value={reputation.business} color="#2196F3" icon="💼" />
                    <ProgressBar label="Social Rep" value={reputation.social} color="#9C27B0" icon="🥂" />
                </View>

                {/* 🧬 GENETICS */}
                <View style={styles.card}>
                    <SectionHeader title="Genetics (Attributes)" icon="🧬" />
                    <ProgressBar label="Intellect" value={attributes.intellect} color={theme.colors.primary} icon="🧠" />
                    <ProgressBar label="Charm" value={attributes.charm} color={theme.colors.accent} icon="👄" />
                    <ProgressBar label="Looks" value={attributes.looks} color={theme.colors.accent} icon="✨" />
                    <ProgressBar label="Strength" value={attributes.strength} color={theme.colors.danger} icon="💪" />
                </View>

                {/* 🧠 PERSONALITY */}
                <View style={styles.card}>
                    <SectionHeader title="Personality" icon="🧠" />
                    <ProgressBar label="Ambition" value={personality.ambition} color="#FFC107" icon="🔥" />
                    <ProgressBar label="Risk Appetite" value={personality.riskAppetite} color="#FF5722" icon="🎲" />
                    <ProgressBar label="Morality" value={personality.morality} color="#8BC34A" icon="😇" />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: theme.colors.textPrimary,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
        gap: 16
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statLabelContainer: {
        flexDirection: 'row',
        width: 130, // Fixed width for alignment
        alignItems: 'center'
    },
    statLabel: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    progressContainer: {
        flex: 1,
        height: 10, // Slim bar
        backgroundColor: theme.colors.background,
        borderRadius: 5,
        marginRight: 10,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 5,
    },
    statValue: {
        width: 45,
        textAlign: 'right',
        color: theme.colors.textPrimary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    skillRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    skillName: {
        color: theme.colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    skillDetail: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    beltBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    beltText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    }
});

export default DNAScreen;
