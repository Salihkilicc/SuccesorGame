// src/features/profile/screens/ProfileScreen.tsx
//
// ============================================================================
//  PROFILE SCREEN — PERSONAL LIFE, DYNASTY & LUXURY DASHBOARD
// ============================================================================
//
//  High-end executive dashboard presenting the CEO's personal identity,
//  romantic relationship health, successor heirs, and sovereign luxury vault.
//
// ============================================================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { theme } from '../../../core/theme';
import { useProfileLogic } from '../logic/useProfileLogic';
import { CeoStatusHeader } from '../components/CeoStatusHeader';
import { PartnerCard } from '../components/PartnerCard';
import { FamilySuccessionList } from '../components/FamilySuccessionList';
import { LuxoNetVipBanner } from '../components/LuxoNetVipBanner';
import { EncounterModal } from '../../love/components/EncounterModal';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';

export const ProfileScreen: React.FC = () => {
    const {
        ceoFullName,
        companyName,
        currentQuarter,
        finances,
        vitals,
        partner,
        children,
        designatedSuccessorId,
        familyReputation,
        luxurySummary,
        isLuxoNetModalVisible,
        isInventoryModalVisible,
        actionFeedback,
        encounter,
        handleAcceptEncounterDate,
        openPartnerModal,
        openChildModal,
        openLuxoNetModal,
        openInventoryModal,
    } = useProfileLogic();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* Standard Theme Ground Background */}
            <LinearGradient
                colors={['#1C242C', '#1C242C', '#1C242C']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.safeArea}>
                {/* Screen Header with Blue Underline and Page Subtitle */}
                <ScreenHeader
                    title="PERSONAL LIFE"
                    subtitle="DYNASTY & SUCCESSION"
                    category="company"
                />

                {/* Toast / Feedback Notice */}
                {actionFeedback && (
                    <View style={styles.feedbackBanner}>
                        <Text style={styles.feedbackText}>{actionFeedback}</Text>
                    </View>
                )}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Top: CEO Status Header */}
                    <CeoStatusHeader
                        ceoFullName={ceoFullName}
                        companyName={companyName}
                    />

                    {/* Middle: Romance & Partner Subheader & Row */}
                    <Text style={styles.sectionHeader}>ROMANCE & PARTNER</Text>
                    <PartnerCard
                        partner={partner}
                        onPress={openPartnerModal}
                    />

                    {/* Below Partner: Family & Successors List */}
                    <FamilySuccessionList
                        children={children}
                        designatedSuccessorId={designatedSuccessorId}
                        onSelectChild={openChildModal}
                    />

                    {/* Bottom: LuxoNet VIP Banner */}
                    <LuxoNetVipBanner
                        onPress={openLuxoNetModal}
                        onInventoryPress={openInventoryModal}
                        luxurySummary={luxurySummary}
                    />
                </ScrollView>

                {/* Encounter Modal for Finding Romance in Elite Circles */}
                <EncounterModal
                    visible={encounter.isVisible}
                    candidate={encounter.candidate}
                    scenario={encounter.currentScenario}
                    context="VIP_LOUNGE"
                    onIgnore={encounter.closeEncounter}
                    onHookup={handleAcceptEncounterDate}
                    onDate={handleAcceptEncounterDate}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: NAV_BAR_CLEARANCE + 32,
    },
    sectionHeader: {
        color: '#05A8F6', // Game's electric blue subheader
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 4,
        paddingHorizontal: 2,
    },
    feedbackBanner: {
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    feedbackText: {
        color: theme.colors.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
});

export default ProfileScreen;
