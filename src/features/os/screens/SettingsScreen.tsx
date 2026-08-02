import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    StatusBar,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSettingsStore } from '../../../core/store/useSettingsStore';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { startNewGame } from '../../../core/newGame';

// ─── Settings Row ────────────────────────────────────────────────────────────

type SettingsRowProps = {
    icon: string;
    label: string;
    value?: boolean;
    onToggle?: () => void;
    onPress?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
    color?: string;
};

const SettingsRow = ({
    icon,
    label,
    value,
    onToggle,
    onPress,
    isFirst,
    isLast,
    color = '#C0C0C0',
}: SettingsRowProps) => {
    return (
        <TouchableOpacity
            style={[
                styles.row,
                isFirst && styles.rowFirst,
                isLast && styles.rowLast,
            ]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name={icon} size={20} color={color} />
                </View>
                <Text style={styles.rowLabel}>{label}</Text>
            </View>

            {onToggle !== undefined ? (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#2A2A2A', true: '#C5A059' }}
                    thumbColor={value ? '#FFFFFF' : '#888888'}
                    ios_backgroundColor="#2A2A2A"
                />
            ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color="#5A5A72" />
            )}
        </TouchableOpacity>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SettingsScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const {
        isMusicEnabled,
        isSoundEnabled,
        isNotificationsEnabled,
        isHapticsEnabled,
        toggleMusic,
        toggleSound,
        toggleNotifications,
        toggleHaptics,
    } = useSettingsStore();

    const handleUnavailable = () => {
        Alert.alert('Successor OS', 'This document is currently unavailable.');
    };

    /**
     * Temiz yeni oyun. startNewGame() tum store'lari ve AsyncStorage'i
     * temizleyip initialStatsState'e doner (1 fabrika, 20 calisan, 2M sermaye).
     */
    const handleNewGame = () => {
        Alert.alert(
            'New Game',
            'All progress will be erased and a fresh run will be set up. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await startNewGame();
                            navigation.goBack();
                            Alert.alert(
                                'New Game',
                                'Fresh start ready.\n\n• Company capital: $2M\n• Personal cash: $50K\n• 1 factory, 20 employees\n• 1 active product (Smart Phone)',
                            );
                        } catch (e) {
                            console.error('[Settings] Yeni oyun baslatilamadi', e);
                            Alert.alert('Error', 'Could not start a new game. Check the console.');
                        }
                    },
                },
            ],
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#050509', '#040408', '#020205']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={styles.safeArea}>
                {/* ── Header ── */}
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={({ pressed }) => [
                            styles.backBtn,
                            pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#C5A059" />
                    </Pressable>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>SETTINGS</Text>
                        <View style={styles.headerAccent} />
                    </View>
                </View>

                {/* ── Content ── */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Preferences Group */}
                    <Text style={styles.sectionTitle}>PREFERENCES</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="music-note"
                            label="Music"
                            value={isMusicEnabled}
                            onToggle={toggleMusic}
                            isFirst
                            color="#8E2DE2"
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="volume-high"
                            label="Sound Effects"
                            value={isSoundEnabled}
                            onToggle={toggleSound}
                            color="#2980B9"
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="bell"
                            label="Notifications"
                            value={isNotificationsEnabled}
                            onToggle={toggleNotifications}
                            color="#ec008c"
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="vibrate"
                            label="Haptics"
                            value={isHapticsEnabled}
                            onToggle={toggleHaptics}
                            isLast
                            color="#F2994A"
                        />
                    </View>

                    {/* Legal & Support Group */}
                    <Text style={styles.sectionTitle}>ABOUT</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="file-document-outline"
                            label="Terms & Conditions"
                            onPress={handleUnavailable}
                            isFirst
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="shield-check-outline"
                            label="Privacy Policy"
                            onPress={handleUnavailable}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="help-circle-outline"
                            label="Help & Support"
                            onPress={handleUnavailable}
                            isLast
                        />
                    </View>

                    {/* Oyun Yonetimi */}
                    <Text style={styles.sectionTitle}>GAME</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="restart"
                            label="New Game"
                            onPress={handleNewGame}
                            isFirst
                            isLast
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerVersion}>Successor OS v1.0.0</Text>
                        <Text style={styles.footerTagline}>Designed for Billionaires</Text>
                    </View>
                </ScrollView>

                {/* Universal Crystal Navigation Bar */}
                <CrystalNavBar activeTab="Home" variant="dark" hideDots={true} />
            </View>
        </View>
    );
};

export default SettingsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#020205',
    },
    safeArea: {
        flex: 1,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(197,160,89,0.15)',
        minHeight: 70,
    },
    backBtn: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 16,
        bottom: 12,
        zIndex: 10,
        backgroundColor: 'rgba(197,160,89,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(197,160,89,0.2)',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '300',
        color: '#E5E5E5',
        letterSpacing: 6,
        textTransform: 'uppercase',
    },
    headerAccent: {
        width: 32,
        height: 2,
        backgroundColor: '#D4AF37',
        marginTop: 6,
        borderRadius: 2,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },

    // ── Content ─────────────────────────────────────────────────────────────
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 140,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7A7A92',
        letterSpacing: 2,
        marginLeft: 16,
        marginBottom: 8,
    },
    group: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#1A1A1A',
    },
    rowFirst: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    rowLast: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: {
        fontSize: 16,
        color: '#E8E8E8',
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginLeft: 60, // Align with text
    },

    // ── Footer ──────────────────────────────────────────────────────────────
    footer: {
        alignItems: 'center',
        marginTop: 20,
        opacity: 0.6,
    },
    footerVersion: {
        fontSize: 13,
        color: '#7A7A92',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 4,
    },
    footerTagline: {
        fontSize: 11,
        color: '#5A5A72',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});
