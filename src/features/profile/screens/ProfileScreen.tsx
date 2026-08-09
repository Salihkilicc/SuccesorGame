import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import ScreenHeader from '../../../components/common/ScreenHeader';

const ProfileScreen = () => {
    useLocale();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#1C242C', '#1C242C', '#1C242C']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[styles.safeArea]}>
                {/* The back arrow here was painted #FF8A8A - the LOSS red,
                    on a navigation control. Exactly the leak the colour rule
                    exists to stop, and it survived because it was a JSX
                    `color=` prop rather than a style, which the audit was
                    only reading in styles. Both are checked now. */}
                <ScreenHeader title={t('ui.profile')} />

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
            </View>
        </View>
    );
};

export default ProfileScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#434B50',
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
        borderBottomColor: 'rgba(5,168,246,0.15)',
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
        backgroundColor: 'rgba(5,168,246,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(5,168,246,0.2)',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 6,
        textTransform: 'uppercase',
    },
    headerAccent: {
        width: 32,
        height: 2,
        backgroundColor: '#434B50',
        marginTop: 6,
        borderRadius: 2,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },
    content: {
        flex: 1,
    },
});
