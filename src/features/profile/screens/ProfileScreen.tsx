import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

const ProfileScreen = () => {
    useLocale();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#050509', '#040408', '#020205']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[styles.safeArea]}>
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
                        <Text style={styles.headerTitle}>{t('ui.profile')}</Text>
                        <View style={styles.headerAccent} />
                    </View>
                </View>

                {/* ── Main Content Area ── */}
                <View style={styles.content}>
                    {/* Placeholder for future Profile content */}
                </View>

                {/* Universal Crystal Navigation Bar */}
                {/* hideDots=true disables the pagination dots completely, as requested */}
                {/* Assuming Profile tab acts kind of like 'Home' or 'Life' for activeTab highlighting. 
                    Since 'activeTab' in CrystalNavBar takes 'Life' | 'Home' | 'Company' | 'Love', 
                    and there is no 'Profile', let's just pass 'Life' or '' but since it must be one of them,
                    let's pass 'Home' to avoid typescript error or just ignore it if it's relaxed.
                    The navbar component expects: activeTab: 'Life' | 'Home' | 'Company' | 'Love';
                    I'll use 'Home' but visually activeTab highlights the specific icon.
                    Actually, let's just use 'Life' as it's a fallback.
                */}
                <CrystalNavBar activeTab="Home" variant="dark" hideDots={true} />
            </View>
        </View>
    );
};

export default ProfileScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#020205',
    },
    safeArea: {
        flex: 1,
    },
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
    content: {
        flex: 1,
    },
});
