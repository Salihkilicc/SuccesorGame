// src/features/profile/screens/FamilyMemberScreen.tsx
//
// ============================================================================
//  FAMILY MEMBER DOSSIER & SUCCESSION SCREEN
// ============================================================================
//
//  Full-fledged screen displaying psychometrics, succession suitability,
//  special traits, dynamic dynasty actions, official ScreenHeader, and
//  bottom CrystalNavBar clearance.
//
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useAssetStore } from '../../shopping/store/useAssetStore';
import {
    handleGift,
    handleMarriage,
    handleMessyBreakup,
    handleProposalRejected,
    handleChildBirth,
} from '../../../logic/relationshipEvents';
import ScreenHeader from '../../../components/common/ScreenHeader';
import BabyNamingModal from '../../love/components/BabyNamingModal';
import ProposalWizardView from '../../love/components/ProposalWizardView';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';

export const FamilyMemberScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { memberId, memberType, memberName: paramName } = route.params || {};

    const family = useFamilyStore();
    const player = usePlayerStore();

    // Resolve whether this is the partner or one of the children
    const isPartner =
        memberType === 'partner' ||
        memberId === 'partner' ||
        memberId === family.partner?.id;

    const partner = isPartner ? family.partner : null;
    const child = !isPartner
        ? family.children.find((c) => c.id === memberId) || family.children[0]
        : null;

    const isDesignatedSuccessor = child
        ? child.id === family.designatedSuccessorId
        : false;

    const rawName = paramName || (isPartner ? partner?.name || 'Partner' : child?.name || 'Heir');
    const name = useMemo(() => {
        if (!isPartner) {
            const firstName = rawName.split(' ')[0] || 'Heir';
            return `${firstName} Hale`;
        }
        return rawName;
    }, [isPartner, rawName]);

    const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const { ownedItems, removeOwnedItem } = useAssetStore();
    const ownedRings = useMemo(() => {
        return ownedItems.filter(
            (i) => i.type === 'engagement_ring' || i.name.toLowerCase().includes('ring'),
        );
    }, [ownedItems]);

    // Proposal Wizard State
    const [isProposalWizardVisible, setIsProposalWizardVisible] = useState(false);
    const [proposalStep, setProposalStep] = useState(0); // 0: Select venue & ring, 2: Prenup, 3: Result
    const [proposalResult, setProposalResult] = useState<{ success: boolean; message: string } | null>(null);
    const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
    const [selectedRingInstanceId, setSelectedRingInstanceId] = useState<string | null>(null);
    const [isPickingRing, setIsPickingRing] = useState(false);
    const [proposalFeedback, setProposalFeedback] = useState<string | null>(null);

    // Baby Naming State
    const [isBabyNamingVisible, setIsBabyNamingVisible] = useState(false);
    const [pendingBabyGender, setPendingBabyGender] = useState<'Male' | 'Female'>('Male');
    const [babyName, setBabyName] = useState('');

    // ============================================================================
    // ACTIONS
    // ============================================================================
    const handleDesignateSuccessor = (targetChildId: string) => {
        family.designateSuccessor(targetChildId);
        Alert.alert(
            'Succession Declared',
            `${name} has been designated as the primary heir to the Hale dynasty.`,
        );
    };

    const handleDate = () => {
        const cost = 2500;
        if (player.core.money < cost) {
            Alert.alert('Insufficient Funds', 'You need $2,500 for an exclusive date night.');
            return;
        }
        player.spendMoney(cost);
        family.updateLove(8);
        player.updateCore('happiness', Math.min(100, player.core.happiness + 6));
        player.updateCore('stress', Math.max(0, player.core.stress - 8));
        Alert.alert('Exclusive Date', `Enjoyed a romantic evening with ${name} (+8 Love, -8 Stress).`);
    };

    const handleGiftPartner = () => {
        const res = handleGift(15000);
        if (!res.success) {
            Alert.alert('Gift Failed', res.error || 'Could not send gift.');
        } else {
            Alert.alert('Luxury Gift', `Luxury gift presented (+${res.loveDelta} Love).`);
        }
    };

    const handleOpenProposal = () => {
        if (ownedRings.length > 0 && !selectedRingInstanceId) {
            setSelectedRingInstanceId(ownedRings[0].instanceId);
        }
        setProposalStep(0);
        setProposalResult(null);
        setProposalFeedback(null);
        setIsProposalWizardVisible(true);
    };

    const handleCycleLocation = (direction: 'prev' | 'next') => {
        const { PROPOSAL_LOCATIONS } = require('../../love/data/loveConstants');
        if (direction === 'prev') {
            setSelectedLocationIndex((prev) => (prev === 0 ? PROPOSAL_LOCATIONS.length - 1 : prev - 1));
        } else {
            setSelectedLocationIndex((prev) => (prev === PROPOSAL_LOCATIONS.length - 1 ? 0 : prev + 1));
        }
    };

    const handleStartProposal = () => {
        const { PROPOSAL_LOCATIONS } = require('../../love/data/loveConstants');
        const location = PROPOSAL_LOCATIONS[selectedLocationIndex];
        const canAfford = player.core.money >= location.cost;
        const selectedRing = ownedRings.find((r) => r.instanceId === selectedRingInstanceId) ?? ownedRings[0] ?? null;

        if (ownedRings.length === 0 || !selectedRing) {
            setProposalFeedback("You need an Engagement Ring first! Buy one at LuxoNet.");
            return;
        }
        if (!canAfford) {
            setProposalFeedback(`Not enough money! Need $${location.cost.toLocaleString()}`);
            return;
        }
        if (partner && partner.love < 30) {
            const rejRes = handleProposalRejected(name);
            setProposalResult({
                success: false,
                message: `${partner.name} doesn't feel ready yet... She declined.\n\nNews: "${rejRes.newsHeadline}"`,
            });
            setProposalStep(3);
            return;
        }

        player.spendMoney(location.cost);
        if (selectedRingInstanceId) {
            removeOwnedItem(selectedRingInstanceId);
        }
        setProposalStep(2); // Prenup Step
    };

    const handleDecidePrenup = (wantsPrenup: boolean) => {
        const { PROPOSAL_LOCATIONS } = require('../../love/data/loveConstants');
        const location = PROPOSAL_LOCATIONS[selectedLocationIndex];
        const res = handleMarriage(wantsPrenup, location?.bonus || 0);

        if (res.success) {
            const prenupBadge = res.actualPrenup
                ? '\n\n🛡️ Prenup Signed: Your personal wealth is 100% protected in case of divorce.'
                : '\n\n⚠️ No Prenup: In case of divorce, 50% of your personal fortune will be forfeited.';

            setProposalResult({
                success: true,
                message: `💍 ${name} said YES! Corporate Brand Surge: +${res.brandValueDelta} pts.${prenupBadge}\n\nMedia: "${res.newsHeadline}"`,
            });
        } else {
            setProposalResult({
                success: false,
                message: res.error || 'Proposal did not succeed.',
            });
        }
        setProposalStep(3);
    };

    const handleGoShopping = () => {
        setIsProposalWizardVisible(false);
        navigation.navigate('Shopping');
    };

    const handleStartBaby = () => {
        const randomGender: 'Male' | 'Female' = Math.random() > 0.5 ? 'Male' : 'Female';
        setPendingBabyGender(randomGender);
        setBabyName('');
        setIsBabyNamingVisible(true);
    };

    const handleConfirmBaby = () => {
        if (!babyName.trim()) return;
        const newChildName = babyName.trim();
        family.addChild({
            name: newChildName,
            gender: pendingBabyGender,
            age: 0,
            birthYear: 2026,
            birthQuarter: 1,
            educationLevel: 'None',
            role: 'Infant',
            stats: {
                intellect: 75 + Math.floor(Math.random() * 20),
                charm: 75 + Math.floor(Math.random() * 20),
                businessAcumen: 65 + Math.floor(Math.random() * 25),
                loyalty: 95,
                ambition: 65 + Math.floor(Math.random() * 25),
                health: 95 + Math.floor(Math.random() * 5),
                creativity: 75 + Math.floor(Math.random() * 20),
            },
            relationshipWithPlayer: 100,
            isSuccessorCandidate: false,
            traits: ['Newborn Heir'],
            allowance: 0,
        });

        // Trigger dynamic media news & brand value boost
        const birthRes = handleChildBirth(newChildName, pendingBabyGender);

        setIsBabyNamingVisible(false);
        setBabyName('');
        Alert.alert(
            '👶 Dynasty Expanded!',
            `${newChildName} Hale was born and added to your succession roster.\n\nMedia Headline: "${birthRes.newsHeadline}"`,
        );
    };

    const handleBreakup = () => {
        const res = handleMessyBreakup('drifted');
        if (!res.success) {
            Alert.alert('Breakup', res.error || 'Failed.');
        } else {
            Alert.alert('Relationship Dissolved', `News Broadcast: "${res.newsHeadline}"`, [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    };

    if (!partner && !child) {
        return (
            <View style={styles.root}>
                <ScreenHeader title="FAMILY MEMBER" category="company" />
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Member not found in family registry.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {/* Screen Header with Back Arrow and dynamic child name subtitle */}
            <ScreenHeader
                title={isPartner ? 'PARTNER' : 'FAMILY MEMBER'}
                subtitle={name.toUpperCase()}
                category="company"
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Member Identity Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.identityBlock}>
                        <Text style={styles.memberName}>{name}</Text>
                        <Text style={styles.memberSub}>
                            {isPartner
                                ? `${partner!.stats.occupation} • Age ${partner!.stats.age}`
                                : `${child!.gender === 'Female' ? 'Daughter' : 'Son'} • Age ${child!.age} (${child!.educationLevel})`}
                        </Text>
                    </View>
                    <View style={styles.badgesCol}>
                        {isPartner ? (
                            <>
                                <View style={styles.socialBadge}>
                                    <Text style={styles.socialBadgeText}>
                                        {partner!.stats.socialClass.toUpperCase()}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        partner!.isMarried && styles.marriedBadge,
                                    ]}
                                >
                                    <Text style={styles.statusBadgeText}>
                                        {partner!.isMarried ? 'SPOUSE' : 'PARTNER'}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            isDesignatedSuccessor && (
                                <View style={styles.heirBadge}>
                                    <MaterialCommunityIcons name="crown" size={14} color="#FBBF24" />
                                    <Text style={styles.heirBadgeText}>HEIR</Text>
                                </View>
                            )
                        )}
                    </View>
                </View>

                {/* Bond & Love Meter Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>
                            {isPartner ? 'ROMANTIC BOND' : 'FAMILY RELATIONSHIP'}
                        </Text>
                        <Text style={styles.metricValue}>
                            {isPartner
                                ? `${partner!.love}%`
                                : `${child!.relationshipWithPlayer}%`}
                        </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${isPartner ? partner!.love : child!.relationshipWithPlayer}%`,
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* ========================================================= */}
                {/* PARTNER DOSSIER & ACTIONS                                */}
                {/* ========================================================= */}
                {isPartner && partner && (
                    <>
                        {/* Personality Matrix */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>PSYCHOMETRIC PROFILE</Text>
                            <View style={styles.traitsWrap}>
                                <View style={styles.traitChip}>
                                    <Text style={styles.traitText}>
                                        {partner.stats.style.toUpperCase()} STYLE
                                    </Text>
                                </View>
                                <View style={styles.traitChip}>
                                    <Text style={styles.traitText}>
                                        {partner.stats.socialClass.toUpperCase()} CLASS
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Partner Interactions */}
                        <View style={styles.actionsContainer}>
                            <Text style={styles.sectionTitle}>INTERACTIONS</Text>
                            <View style={styles.actionButtonsCol}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionButton,
                                        styles.btnSurface,
                                        pressed && styles.btnPressed,
                                    ]}
                                    onPress={handleDate}
                                >
                                    <MaterialCommunityIcons
                                        name="glass-cocktail"
                                        size={18}
                                        color="#05A8F6"
                                    />
                                    <Text style={styles.btnSurfaceText}>
                                        Exclusive Date Night ($2.5K)
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionButton,
                                        styles.btnSurface,
                                        pressed && styles.btnPressed,
                                    ]}
                                    onPress={handleGiftPartner}
                                >
                                    <MaterialCommunityIcons
                                        name="gift-outline"
                                        size={18}
                                        color="#05A8F6"
                                    />
                                    <Text style={styles.btnSurfaceText}>
                                        Send Luxury Gift ($15K)
                                    </Text>
                                </Pressable>

                                {!partner.isMarried && (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.actionButton,
                                            styles.btnAmber,
                                            pressed && styles.btnPressed,
                                        ]}
                                        onPress={handleOpenProposal}
                                    >
                                        <MaterialCommunityIcons
                                            name="ring"
                                            size={18}
                                            color="#FBBF24"
                                        />
                                        <Text style={styles.btnAmberText}>Propose Marriage</Text>
                                    </Pressable>
                                )}

                                {partner.isMarried && (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.actionButton,
                                            styles.btnSurface,
                                            pressed && styles.btnPressed,
                                        ]}
                                        onPress={handleStartBaby}
                                    >
                                        <MaterialCommunityIcons
                                            name="baby-carriage"
                                            size={18}
                                            color="#05A8F6"
                                        />
                                        <Text style={styles.btnSurfaceText}>
                                            Have a Baby / Dynasty Heir
                                        </Text>
                                    </Pressable>
                                )}

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionButton,
                                        styles.btnDestructive,
                                        pressed && styles.btnPressed,
                                    ]}
                                    onPress={handleBreakup}
                                >
                                    <MaterialCommunityIcons
                                        name="heart-broken"
                                        size={18}
                                        color={theme.colors.textSecondary}
                                    />
                                    <Text style={styles.btnDestructiveText}>
                                        {partner.isMarried ? 'File for Divorce' : 'Break Up'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </>
                )}

                {/* ========================================================= */}
                {/* CHILD DEEP STATS & SUCCESSION ACTIONS                     */}
                {/* ========================================================= */}
                {!isPartner && child && (
                    <>
                        {/* Succession Suitability Stats Grid */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>SUCCESSION SUITABILITY</Text>
                            <View style={styles.statsGrid}>
                                <View style={styles.statTile}>
                                    <Text style={styles.statTileLabel}>BUSINESS ACUMEN</Text>
                                    <Text style={[styles.statTileValue, { color: '#FFA94D' }]}>
                                        {child.stats.businessAcumen}
                                    </Text>
                                </View>
                                <View style={styles.statTile}>
                                    <Text style={styles.statTileLabel}>INTELLECT</Text>
                                    <Text style={[styles.statTileValue, { color: '#38BDF8' }]}>
                                        {child.stats.intellect}
                                    </Text>
                                </View>
                                <View style={styles.statTile}>
                                    <Text style={styles.statTileLabel}>AMBITION</Text>
                                    <Text style={[styles.statTileValue, { color: '#05A8F6' }]}>
                                        {child.stats.ambition}
                                    </Text>
                                </View>
                                <View style={styles.statTile}>
                                    <Text style={styles.statTileLabel}>CHARM</Text>
                                    <Text style={styles.statTileValue}>{child.stats.charm}</Text>
                                </View>
                                <View style={styles.statTile}>
                                    <Text style={styles.statTileLabel}>LOYALTY</Text>
                                    <Text style={styles.statTileValue}>{child.stats.loyalty}</Text>
                                </View>
                                <View style={styles.statTile}>
                                    <Text style={styles.statTileLabel}>HEALTH</Text>
                                    <Text style={styles.statTileValue}>{child.stats.health}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Traits List */}
                        {child.traits && child.traits.length > 0 && (
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>SPECIAL TRAITS</Text>
                                <View style={styles.traitsWrap}>
                                    {child.traits.map((trait, index) => (
                                        <View key={index} style={styles.traitChip}>
                                            <Text style={styles.traitText}>{trait}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Child Succession Action */}
                        <View style={styles.actionsContainer}>
                            <Text style={styles.sectionTitle}>DYNASTY ACTIONS</Text>
                            <View style={styles.actionButtonsCol}>
                                {!isDesignatedSuccessor ? (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.actionButton,
                                            styles.btnAmber,
                                            pressed && styles.btnPressed,
                                        ]}
                                        onPress={() => handleDesignateSuccessor(child.id)}
                                    >
                                        <MaterialCommunityIcons
                                            name="crown"
                                            size={18}
                                            color="#FBBF24"
                                        />
                                        <Text style={styles.btnAmberText}>
                                            Designate as Primary Heir
                                        </Text>
                                    </Pressable>
                                ) : (
                                    <View style={styles.activeSuccessorBanner}>
                                        <MaterialCommunityIcons
                                            name="crown"
                                            size={20}
                                            color="#FBBF24"
                                        />
                                        <Text style={styles.activeSuccessorText}>
                                            Designated Primary Heir to the Hale Empire
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Baby Naming & Heir Birth Modal */}
            <BabyNamingModal
                visible={isBabyNamingVisible}
                pendingChildGender={pendingBabyGender}
                childName={babyName}
                onChangeName={setBabyName}
                onConfirm={handleConfirmBaby}
                onSkip={() => setIsBabyNamingVisible(false)}
            />

            {/* Proposal Wizard Modal */}
            <Modal
                visible={isProposalWizardVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsProposalWizardVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setIsProposalWizardVisible(false)}
                    />
                    <View style={styles.modalCard}>
                        <ProposalWizardView
                            proposalStep={proposalStep}
                            proposalResult={proposalResult}
                            selectedLocationIndex={selectedLocationIndex}
                            selectedRingInstanceId={selectedRingInstanceId}
                            isPickingRing={isPickingRing}
                            ownedRings={ownedRings}
                            money={player.core.money}
                            feedback={proposalFeedback}
                            onCycleLocation={handleCycleLocation}
                            onSelectRing={setSelectedRingInstanceId}
                            onSetIsPickingRing={setIsPickingRing}
                            onStartProposal={handleStartProposal}
                            onDecidePrenup={handleDecidePrenup}
                            onClose={() => setIsProposalWizardVisible(false)}
                            onGoShopping={handleGoShopping}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(28,36,44,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#434B50',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(5,168,246,0.3)',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: NAV_BAR_CLEARANCE + 32, // Clear CrystalNavBar safely
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    // Header Identity Card
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#183D5C',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        color: '#7DD3FC',
        fontSize: 18,
        fontWeight: '800',
    },
    identityBlock: {
        flex: 1,
    },
    memberName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 3,
    },
    memberSub: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    badgesCol: {
        alignItems: 'flex-end',
        gap: 4,
    },
    socialBadge: {
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    socialBadgeText: {
        color: '#05A8F6',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statusBadge: {
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    marriedBadge: {
        backgroundColor: '#4E3A20',
    },
    statusBadgeText: {
        color: '#FBBF24',
        fontSize: 9,
        fontWeight: '800',
    },
    heirBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4E3A20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    heirBadgeText: {
        color: '#FBBF24',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Section Cards
    sectionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#05A8F6',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },

    // Metric / Bond Bar
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    metricLabel: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    metricValue: {
        color: '#7DD3FC',
        fontSize: 14,
        fontWeight: '800',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#05A8F6',
        borderRadius: 3,
    },

    // Succession Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statTile: {
        width: '31%',
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
    },
    statTileLabel: {
        color: theme.colors.textMuted,
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.5,
        textAlign: 'center',
        marginBottom: 4,
    },
    statTileValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    // Traits
    traitsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    traitChip: {
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    traitText: {
        color: '#7DD3FC',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Actions
    actionsContainer: {
        marginBottom: 16,
    },
    actionButtonsCol: {
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    btnSurface: {
        backgroundColor: theme.colors.surface,
    },
    btnSurfaceText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    btnAmber: {
        backgroundColor: '#4E3A20',
    },
    btnAmberText: {
        color: '#FBBF24',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    btnDestructive: {
        backgroundColor: theme.colors.surfaceRaised,
    },
    btnDestructiveText: {
        color: '#FF8A8A',
        fontSize: 13,
        fontWeight: '700',
    },
    btnPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },

    // Active Successor Banner
    activeSuccessorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4E3A20',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    activeSuccessorText: {
        color: '#FBBF24',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default FamilyMemberScreen;
