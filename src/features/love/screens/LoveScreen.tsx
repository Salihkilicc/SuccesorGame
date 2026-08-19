// @orphan-ok the relationship system moved into Profile - see the note below
//
// ============================================================================
//  SHELVED: THE LOVE SCREEN
// ============================================================================
//
//  Nothing routes here any more. The tab is gone, the RootStack entry is gone,
//  and the Contacts item on the nav bar is gone with them.
//
//  Everything this screen did is on PROFILE, and it was already there before
//  this file was shelved - which is the reason the move cost nothing:
//
//    THE PARTNER CARD, with its empty state. Tapping it with nobody opens the
//    encounter; tapping it with somebody opens their page.
//    THE ENCOUNTER MODAL, mounted on Profile, same component.
//    THE PROPOSAL WIZARD, on FamilyMemberScreen, which is where a partner's
//    page already lives - venue, ring, prenup, result.
//    THE FAMILY LIST, which was only ever on Profile.
//
//  So this screen was a second front door to a house that already had one, and
//  a tab of its own made it a fifth section of the app for a single card.
//
//  These are facts about the PLAYER. Profile is the screen about the player.
//
//  ---------------------------------------------------------------------------
//  KEPT RATHER THAN DELETED
//  ---------------------------------------------------------------------------
//  It holds the only laid-out version of the breakup flow and the submenu
//  pattern, and it is the reference for what a full relationship screen looks
//  like if one is ever wanted again. Deleting it would mean rebuilding that
//  from the stores.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { ScrollView, View, Text, Pressable, StyleSheet, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserStore, useStatsStore } from '../../../core/store';
import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { useAssetStore } from '../../shopping/store/useAssetStore';
import { useRelationshipStore } from '../../../core/store/useRelationshipStore';
import type { LoveStackParamList } from '../../../navigation';
import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import InteractionModal from '../components/InteractionModal';
import { EncounterModal } from '../components/EncounterModal';
import BreakupModal from '../components/BreakupModal';
import { useEncounterSystem } from '../components/useEncounterSystem';
import { applyPartnerBuffs, getPartnerPerks } from '../../../logic/relationshipLogic';
import { formatMoney } from '../../../core/utils';

// Extracted components
import PartnerHeroCard from '../components/PartnerHeroCard';
import RelationshipList from '../components/RelationshipList';
import BabyNamingModal from '../components/BabyNamingModal';
import ProposalWizardView from '../components/ProposalWizardView';

// Extracted constants & utils
import { GIFTS, TEXT_MESSAGES } from '../data/loveConstants';

type LoveScreenProp = NativeStackNavigationProp<LoveStackParamList, 'LoveHome'>;

type ModalType = 'partner' | 'family' | 'friend' | 'ex' | null;
type SubmenuType = 'gift' | 'propose' | 'text' | 'breakup_confirm' | 'breakup_result' | null;

const LoveScreen = () => {
    useLocale();
  const navigation = useNavigation<LoveScreenProp>();
  // ------------------------------------------------------------------
  //  ONE STORE
  // ------------------------------------------------------------------
  //  The partner, the proposal, the marriage and the breakup all came from
  //  useUserStore, which is the store no encounter ever wrote a partner into.
  //  So this screen was showing, proposing to and divorcing a person the rest
  //  of the game could not see. See the note at the top of useFamilyStore.ts.
  //
  //  `family`, `friends` and `exes` still come from useUserStore because that
  //  is where the legacy lists live and RelationshipList reads them there. They
  //  are empty now - see initialUserState - and moving them is step 5.
  // ------------------------------------------------------------------
  const {
    partner,
    proposeMarriage: proposeMarriageStore,
    marry: marryPartner,
    breakup: breakUp,
  } = useFamilyStore();
  const { family, friends, exes, setField: setUserField } = useUserStore();
  const { money, spendMoney, setField: setStatsField } = useStatsStore();

  // Encounter System Hook
  const {
    isVisible: isEncounterVisible,
    currentScenario,
    candidate: encounterCandidate,
    triggerEncounter,
    handleDate,
    closeEncounter,
    cheatingConsequence,
    clearConsequence
  } = useEncounterSystem();

  const { contacts, addContact, updateContact } = useRelationshipStore();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submenu, setSubmenu] = useState<SubmenuType>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [proposalStep, setProposalStep] = useState(0); // 0: None, 1: Picker, 2: Prenup, 3: Result
  const [proposalResult, setProposalResult] = useState<{ success: boolean; message: string } | null>(null);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  // --- Ring Selection State ---
  const [selectedRingInstanceId, setSelectedRingInstanceId] = useState<string | null>(null);
  const [isPickingRing, setIsPickingRing] = useState(false);
  // --- Baby Naming Modal state ---
  const [isNamingChild, setIsNamingChild] = useState(false);
  const [pendingChildGender, setPendingChildGender] = useState<'Male' | 'Female'>('Male');
  const [childName, setChildName] = useState('');

  // --- Asset Store (Inventory) ---
  const { ownedItems, removeOwnedItem } = useAssetStore();
  const ownedRings = ownedItems.filter(i => i.type === 'engagement_ring');

  // Auto-select the first ring when rings become available
  useEffect(() => {
    if (ownedRings.length > 0 && selectedRingInstanceId === null) {
      setSelectedRingInstanceId(ownedRings[0].instanceId);
    }
  }, [ownedRings.length]);


  const handleBack = () => {
    navigation.navigate('Home' as never);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setSubmenu(null);
    setFeedback(null);
    setProposalStep(0);
    setProposalResult(null);
    setSelectedRingInstanceId(null);
    setIsPickingRing(false);
  };

  const updatePartnerLove = (amount: number) => {
    if (!partner) return;
    const newLove = Math.max(0, Math.min(100, partner.love + amount));
    setUserField('partner', { ...partner, love: newLove });
  };

  // --- Make Love ---
  const handleMakeLove = () => {
    if (!partner) return;

    const partnerNPC = contacts.find(c => c.id === partner.id);

    if (partnerNPC?.madeLoveThisQuarter) {
      Alert.alert('Not Now', 'You need to wait until the next quarter.');
      return;
    }

    if (partnerNPC) {
      updateContact(partner.id, { madeLoveThisQuarter: true });
    } else {
      addContact({
        id: partner.id,
        name: partner.name,
        type: 'Partner',
        age: partner.stats?.age ?? 25,
        gender: 'Female',
        relationship: partner.love ?? 80,
        looks: partner.stats?.looks ?? 50,
        smarts: partner.stats?.intelligence ?? 50,
        isDeceased: false,
        madeLoveThisQuarter: true,
      });
    }

    const score = Math.floor(Math.random() * 91) + 10;
    setSatisfaction(score);

    if (Math.random() <= 0.10) {
      const gender: 'Male' | 'Female' = Math.random() > 0.5 ? 'Male' : 'Female';
      setPendingChildGender(gender);
      setChildName('');
      closeModal();
      setTimeout(() => {
        setIsNamingChild(true);
      }, 350);
    }
  };

  // --- Partner Actions ---
  const handlePartnerAction = (action: string) => {
    if (!partner) return;
    setFeedback(null);

    switch (action) {
      case 'Gift':
        setSubmenu('gift');
        break;
      case 'Compliment':
        const success = Math.random() > 0.3;
        if (success) {
          setFeedback("She blushed and smiled! (+Love)");
          updatePartnerLove(3);
        } else {
          setFeedback("She thought you were being fake. (-Love)");
          updatePartnerLove(-2);
        }
        break;
      case 'Break Up':
        setSubmenu('breakup_confirm');
        break;
      case 'Elope':
        const elopeChance = partner.love / 150;
        if (Math.random() < elopeChance) {
          setFeedback("She said YES! You are now married (in secret)!");
          updatePartnerLove(20);
        } else {
          setFeedback("She thinks it's too sudden. (-Love)");
          updatePartnerLove(-5);
        }
        break;
      case 'Birth Control':
        const wantsKids = Math.random() > 0.5;
        if (wantsKids) {
          setFeedback("She refused. She wants to have a baby soon.");
        } else {
          setFeedback("She agreed it's smart to wait.");
        }
        break;
      case 'Counseling':
        if (partner.love < 40) {
          setFeedback("She agreed that you need help.");
          updatePartnerLove(5);
        } else {
          setFeedback("She doesn't think you need it right now.");
        }
        break;
      case 'Insult':
        Alert.alert("Are you sure?", "This will severely damage your relationship.", [
          { text: "No", style: "cancel" },
          {
            text: t('love.doIt'), style: 'destructive', onPress: () => {
              setFeedback("You had a huge fight!");
              updatePartnerLove(-25);
            }
          }
        ]);
        break;
      case 'Propose':
        setProposalStep(0);
        setProposalResult(null);
        setSubmenu('propose');
        break;
    }
  };

  const handleBuyGift = (item: typeof GIFTS[0]) => {
    if (!spendMoney(item.price)) {
      setFeedback(`Not enough money! Need $${item.price}`);
      return;
    }
    updatePartnerLove(item.loveParams);
    setFeedback(`You gave her ${item.name}! (+${item.loveParams} Love)`);
  };

  // --- Family & Friend Actions ---
  const handleGenericAction = (action: string, type: 'family' | 'friend') => {
    if (!selectedItem) return;
    const person = selectedItem;
    setFeedback(null);

    const updateRelation = (delta: number) => {
      if (type === 'family') {
        const newFamily = family.map(f =>
          f.id === person.id ? { ...f, relationship: Math.max(0, Math.min(100, f.relationship + delta)) } : f
        );
        setUserField('family', newFamily);
      } else {
        const newFriends = friends.map(f =>
          f.id === person.id ? { ...f, relationship: Math.max(0, Math.min(100, f.relationship + delta)) } : f
        );
        setUserField('friends', newFriends);
      }
    };

    switch (action) {
      case 'Spend Time':
        setFeedback("You had a great time together.");
        updateRelation(5);
        break;
      case 'Compliment':
        const success = Math.random() > 0.2;
        if (success) {
          setFeedback("They appreciated your kind words.");
          updateRelation(3);
        } else {
          setFeedback("They didn't really react.");
        }
        break;
      case 'Gift':
        setSubmenu('gift');
        break;
      case 'Insult':
        setFeedback("Why would you do that? They are hurt.");
        updateRelation(-20);
        break;
    }
  };

  const handleGiftToOther = (item: typeof GIFTS[0]) => {
    if (!spendMoney(item.price)) {
      setFeedback(`Not enough money! Need $${item.price}`);
      return;
    }

    if (modalType === 'family') {
      const newFamily = family.map(f =>
        f.id === selectedItem.id ? { ...f, relationship: Math.min(100, f.relationship + item.loveParams) } : f
      );
      setUserField('family', newFamily);
    } else if (modalType === 'friend') {
      const newFriends = friends.map(f =>
        f.id === selectedItem.id ? { ...f, relationship: Math.min(100, f.relationship + item.loveParams) } : f
      );
      setUserField('friends', newFriends);
    }
    setFeedback(`Sent ${item.name} to ${selectedItem.name}!`);
  };


  // --- Exes Actions ---
  const handleExAction = (action: string) => {
    if (!selectedItem) return;
    setFeedback(null);

    const updateExRelation = (delta: number) => {
      const newExes = exes.map(e =>
        e.id === selectedItem.id ? { ...e, love: Math.max(0, Math.min(100, e.love + delta)) } : e
      );
      setUserField('exes', newExes);
    };

    switch (action) {
      case 'Text Her':
        setSubmenu('text');
        break;
      case 'Go Vacation':
        setFeedback("Coming Soon...");
        break;
      case 'Stalk Her':
        Alert.alert("Stalk?", "Do you want to stalk their social media?", [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes', onPress: () => {
              if (Math.random() > 0.5) {
                setFeedback("She looks happy without you... (Stress +5)");
              } else {
                setFeedback("She posted a sad song. She might miss you.");
              }
            }
          }
        ]);
        break;
      case 'Start Dating Again':
        if (selectedItem.love > 80 && Math.random() > 0.6) {
          setFeedback("She agreed to define the relationship!");
        } else {
          setFeedback("She just wants to be friends right now.");
          updateExRelation(-5);
        }
        break;
    }
  };

  const handleSendText = (msg: string) => {
    const rng = Math.random();
    if (rng > 0.6) {
      setFeedback("She replied! (+Relation)");
      const newExes = exes.map(e =>
        e.id === selectedItem.id ? { ...e, love: Math.min(100, e.love + 5) } : e
      );
      setUserField('exes', newExes);
    } else if (rng > 0.3) {
      setFeedback("Read at 11:42 PM.");
    } else {
      setFeedback("Not delivered. You might be blocked.");
      const newExes = exes.map(e =>
        e.id === selectedItem.id ? { ...e, love: Math.max(0, e.love - 2) } : e
      );
      setUserField('exes', newExes);
    }
  };

  // --- Proposal Handlers (passed to ProposalWizardView) ---
  const handleCycleLocation = (direction: 'prev' | 'next') => {
    const { PROPOSAL_LOCATIONS } = require('../data/loveConstants');
    if (direction === 'prev') {
      setSelectedLocationIndex(prev => (prev === 0 ? PROPOSAL_LOCATIONS.length - 1 : prev - 1));
    } else {
      setSelectedLocationIndex(prev => (prev === PROPOSAL_LOCATIONS.length - 1 ? 0 : prev + 1));
    }
  };

  const handleStartProposal = () => {
    const { PROPOSAL_LOCATIONS } = require('../data/loveConstants');
    const location = PROPOSAL_LOCATIONS[selectedLocationIndex];
    const canAfford = money >= location.cost;
    const selectedRing = ownedRings.find(r => r.instanceId === selectedRingInstanceId) ?? ownedRings[0] ?? null;

    if (!selectedRingInstanceId || !selectedRing) {
      setFeedback("You need an Engagement Ring first!");
      return;
    }
    if (!canAfford) {
      setFeedback(`Not enough money! Need $${location.cost.toLocaleString()}`);
      return;
    }
    if (partner && partner.love < 30) {
      setProposalResult({
        success: false,
        message: `${partner.name} doesn't love you enough yet... She said no.`
      });
      setProposalStep(3);
      return;
    }
    if (!spendMoney(location.cost)) {
      setFeedback(`Not enough money! Need $${location.cost.toLocaleString()}`);
      return;
    }
    removeOwnedItem(selectedRingInstanceId);
    setSelectedRingInstanceId(null);
    setProposalStep(2);
  };

  const handleDecidePrenup = (wantsPrenup: boolean) => {
    const { PROPOSAL_LOCATIONS } = require('../data/loveConstants');
    const location = PROPOSAL_LOCATIONS[selectedLocationIndex];
    const result = proposeMarriageStore(wantsPrenup, location.bonus);
    setProposalResult(result);
    if (result.success) {
      marryPartner(wantsPrenup);
    }
    setProposalStep(3);
  };

  const handleGoShopping = () => {
    setSubmenu(null);
    setProposalStep(0);
    setProposalResult(null);
    setSelectedRingInstanceId(null);
    setIsPickingRing(false);
    closeModal();
    // @ts-ignore
    navigation.navigate('Assets', { screen: 'Shopping' });
  };

  // --- Render Modals ---

  const renderPartnerModalContent = () => {
    if (!partner) return null;

    if (submenu === 'gift') {
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.modalSubtitle}>{t('love.selectAGift')}</Text>
          {GIFTS.map((g, i) => (
            <Pressable key={i} style={styles.actionButton} onPress={() => handleBuyGift(g)}>
              <Text style={styles.actionButtonText}>{g.name}</Text>
              <Text style={styles.priceText}>${g.price.toLocaleString()}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.actionButton, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]} onPress={() => setSubmenu(null)}>
            <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>{t('love.back')}</Text>
          </Pressable>
        </View>
      );
    }

    if (submenu === 'breakup_confirm' || submenu === 'breakup_result') {
      const settlement = (partner.isMarried && !partner.hasPrenup) ? money * 0.5 : 0;

      if (submenu === 'breakup_result') {
        return (
          <View style={{ alignItems: 'center', gap: 16, padding: 20 }}>
            <Text style={{ fontSize: 60 }}>🥀</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.danger }]}>{t('love.itSOver')}</Text>
            <Text style={{ color: theme.colors.textPrimary, textAlign: 'center' }}>
              You have ended your relationship with {partner.name}.
            </Text>
            {settlement > 0 && (
              <View style={{ backgroundColor: theme.colors.destructive, padding: 10, borderRadius: 8, marginTop: 10 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  SETTLEMENT PAID: -${settlement.toLocaleString()}
                </Text>
              </View>
            )}
            <Pressable
              style={[styles.actionButton, { marginTop: 20, backgroundColor: theme.colors.card }]}
              onPress={() => {
                breakUp('divorce');
                setSubmenu(null);
                closeModal();
              }}
            >
              <Text style={styles.actionButtonText}>{t('love.leave')}</Text>
            </Pressable>
          </View>
        );
      }

      return (
        <View style={{ gap: 16, padding: 10, backgroundColor: 'rgba(5,168,246,0.05)', borderRadius: 12 }}>
          <Text style={{ fontSize: 40, textAlign: 'center' }}>💔</Text>
          <Text style={[styles.modalSubtitle, { textAlign: 'center', color: theme.colors.danger }]}>{t('love.warning')}</Text>
          <Text style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
            Are you sure you want to end this?
            {partner.isMarried && !partner.hasPrenup && (
              <Text style={{ fontWeight: 'bold', color: theme.colors.danger }}>
                {"\n\n"}
                Reviewing your assets... You have no Prenup.
                {"\n"}
                This will cost you 50% of your wealth.
                {"\n"}
                (~ ${settlement.toLocaleString()})
              </Text>
            )}
          </Text>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.colors.destructive }]}
            onPress={() => setSubmenu('breakup_result')}
          >
            <Text style={[styles.actionButtonText, { color: 'white' }]}>{t('love.yesItSOver')}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={() => setSubmenu(null)}
          >
            <Text style={styles.actionButtonText}>{t('love.cancel')}</Text>
          </Pressable>
        </View>
      );
    }

    if (submenu === 'propose') {
      return (
        <ProposalWizardView
          proposalStep={proposalStep}
          proposalResult={proposalResult}
          selectedLocationIndex={selectedLocationIndex}
          selectedRingInstanceId={selectedRingInstanceId}
          isPickingRing={isPickingRing}
          ownedRings={ownedRings}
          money={money}
          feedback={feedback}
          onCycleLocation={handleCycleLocation}
          onSelectRing={setSelectedRingInstanceId}
          onSetIsPickingRing={setIsPickingRing}
          onStartProposal={handleStartProposal}
          onDecidePrenup={handleDecidePrenup}
          onClose={closeModal}
          onGoShopping={handleGoShopping}
        />
      );
    }

    // Determine if the partner is already 'used' this quarter
    const partnerNPC = contacts.find(c => c.id === partner.id);
    const alreadyMadeLove = !!partnerNPC?.madeLoveThisQuarter;

    const getSatisfactionColor = (v: number) => {
      if (v <= 30) return '#FF8A8A';
      if (v <= 60) return '#FF8A8A';
      return '#05A8F6';
    };

    return (
      <View style={styles.grid}>
        {[
          { label: t('love.gift'), desc: t('love.showYourLove'), emoji: '🎁', action: 'Gift', color: theme.colors.textPrimary },
          { label: t('love.compliment'), desc: t('love.liftHerSpirits'), emoji: '💬', action: 'Compliment', color: '#FFFFFF' },
          { label: t('love.breakUp'), desc: t('love.endThingsHere'), emoji: '💔', action: 'Break Up', danger: true, color: theme.colors.textPrimary },
          { label: t('love.elope'), desc: t('love.secretWedding'), emoji: '🏃', action: 'Elope', color: '#FFFFFF' },
          { label: t('love.birthControl'), desc: t('love.planAhead'), emoji: '💊', action: 'Birth Control', color: '#FFFFFF' },
          { label: t('love.counseling'), desc: t('love.saveTheBond'), emoji: '🗣️', action: 'Counseling', color: '#FFFFFF' },
          { label: t('love.insult'), desc: t('love.riskyMove'), emoji: '🤬', action: 'Insult', danger: true, color: theme.colors.textPrimary },
        ].map((btn) => (
          <Pressable
            key={btn.action}
            style={({ pressed }) => [
              styles.gridTile,
              btn.danger && styles.gridTileDanger,
              pressed && styles.gridTilePressed,
            ]}
            onPress={() => handlePartnerAction(btn.action)}>
            <View style={[styles.gridTileIcon, { backgroundColor: btn.color + '22', borderColor: btn.color + '55' }]}>
              <Text style={styles.gridTileEmoji}>{btn.emoji}</Text>
            </View>
            <Text style={[styles.gridTileLabel, btn.danger && { color: theme.colors.textPrimary }]}>{btn.label}</Text>
            <Text style={styles.gridTileDesc}>{btn.desc}</Text>
          </Pressable>
        ))}

        {/* Make Love Button */}
        <Pressable
          key="makeLove"
          style={({ pressed }) => [
            styles.gridTile,
            alreadyMadeLove && styles.gridTileDanger,
            pressed && styles.gridTilePressed,
          ]}
          onPress={handleMakeLove}
          disabled={alreadyMadeLove}
        >
          <View style={[styles.gridTileIcon, { backgroundColor: alreadyMadeLove ? '#FF8A8A' + '22' : '#FF8A8A' + '22', borderColor: alreadyMadeLove ? '#FF8A8A' + '55' : '#FF8A8A' + '55' }]}>
            <Text style={styles.gridTileEmoji}>💗</Text>
          </View>
          <Text style={[styles.gridTileLabel, alreadyMadeLove && { color: theme.colors.textPrimary }]}>{t('love.makeLove')}</Text>
          <Text style={styles.gridTileDesc}>
            {alreadyMadeLove ? 'Quarterly limit reached' : 'Intimate moment'}
          </Text>
        </Pressable>

        {/* Satisfaction Bar */}
        {satisfaction !== null && (
          <View style={styles.satisfactionContainer}>
            <View style={styles.satisfactionHeader}>
              <Text style={styles.satisfactionLabel}>{t('love.satisfaction')}</Text>
              <Text style={[styles.satisfactionValue, { color: getSatisfactionColor(satisfaction) }]}>
                {satisfaction}%
              </Text>
            </View>
            <View style={styles.satisfactionTrack}>
              <View
                style={[
                  styles.satisfactionFill,
                  {
                    width: `${satisfaction}%` as any,
                    backgroundColor: getSatisfactionColor(satisfaction),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Propose button */}
        {!partner.isMarried && (
          <Pressable
            key="propose"
            style={({ pressed }) => [
              styles.gridTile,
              pressed && styles.gridTilePressed,
            ]}
            onPress={() => handlePartnerAction('Propose')}
          >
            <View style={[styles.gridTileIcon, { backgroundColor: 'rgba(255,255,255,0.08)' + '22', borderColor: 'rgba(255,255,255,0.08)' + '55' }]}>
              <Text style={styles.gridTileEmoji}>💍</Text>
            </View>
            <Text style={styles.gridTileLabel}>{t('love.propose')}</Text>
            <Text style={styles.gridTileDesc}>{t('love.popTheQuestion')}</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderGenericModalContent = (type: 'family' | 'friend') => {
    if (submenu === 'gift') {
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.modalSubtitle}>Gift for {selectedItem?.name}</Text>
          {GIFTS.map((g, i) => (
            <Pressable key={i} style={styles.actionButton} onPress={() => handleGiftToOther(g)}>
              <Text style={styles.actionButtonText}>{g.name}</Text>
              <Text style={styles.priceText}>${g.price.toLocaleString()}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.actionButton, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]} onPress={() => setSubmenu(null)}>
            <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>{t('love.back')}</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.actionList}>
        {[
          { label: t('love.spendTimeTogether'), desc: t('love.qualityTimeBoostsBond'), emoji: '☕', action: 'Spend Time', color: theme.colors.textPrimary },
          { label: t('love.compliment'), desc: t('love.positiveWordsGoFar'), emoji: '💬', action: 'Compliment', color: '#FFFFFF' },
          { label: t('love.sendAGift'), desc: t('love.moneyTalks'), emoji: '🎁', action: 'Gift', color: '#FFFFFF' },
          { label: t('love.insult'), desc: t('love.thisWillHurt'), emoji: '🤬', action: 'Insult', danger: true, color: theme.colors.textPrimary },
        ].map(btn => (
          <Pressable
            key={btn.action}
            style={({ pressed }) => [
              styles.actionRow,
              btn.danger && styles.actionRowDanger,
              pressed && styles.actionRowPressed,
            ]}
            onPress={() => handleGenericAction(btn.action, type)}>
            <View style={[styles.actionRowIcon, { backgroundColor: btn.color + '22', borderColor: btn.color + '44' }]}>
              <Text style={{ fontSize: 20 }}>{btn.emoji}</Text>
            </View>
            <View style={styles.actionRowText}>
              <Text style={[styles.actionRowLabel, btn.danger && { color: theme.colors.textPrimary }]}>{btn.label}</Text>
              <Text style={styles.actionRowDesc}>{btn.desc}</Text>
            </View>
            <Text style={[styles.actionRowChevron, btn.danger && { color: theme.colors.textPrimary }]}>›</Text>
          </Pressable>
        ))}
      </View>
    );
  };


  const renderExModalContent = () => {
    if (submenu === 'text') {
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.modalSubtitle}>Text {selectedItem?.name}</Text>
          {TEXT_MESSAGES.map((msg, i) => (
            <Pressable key={i} style={styles.actionButton} onPress={() => handleSendText(msg)}>
              <Text style={styles.actionButtonText}>"{msg}"</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.actionButton, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]} onPress={() => setSubmenu(null)}>
            <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>{t('love.back')}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.actionList}>
        {[
          { label: t('love.textHer'), desc: t('love.sendAMessage'), emoji: '📱', action: 'Text Her', color: '#FFFFFF' },
          { label: t('love.goOnVacation'), desc: t('love.comingSoon'), emoji: '✈️', action: 'Go Vacation', color: '#FFFFFF' },
          { label: t('love.stalkHer'), desc: t('love.checkHerSocials'), emoji: '👁️', action: 'Stalk Her', color: '#FFFFFF' },
          { label: t('love.startDatingAgain'), desc: t('love.rekindleTheFlame'), emoji: '🔥', action: 'Start Dating Again', color: theme.colors.textPrimary },
        ].map(btn => (
          <Pressable
            key={btn.action}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && styles.actionRowPressed,
            ]}
            onPress={() => handleExAction(btn.action)}>
            <View style={[styles.actionRowIcon, { backgroundColor: btn.color + '22', borderColor: btn.color + '44' }]}>
              <Text style={{ fontSize: 20 }}>{btn.emoji}</Text>
            </View>
            <View style={styles.actionRowText}>
              <Text style={styles.actionRowLabel}>{btn.label}</Text>
              <Text style={styles.actionRowDesc}>{btn.desc}</Text>
            </View>
            <Text style={styles.actionRowChevron}>›</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  // --- Derive family data for RelationshipList ---
  const npcFamily = contacts.filter(
    c => !c.isDeceased && ['Mother', 'Father', 'Sibling', 'Child'].includes(c.type)
  );
  const totalFamilyCount = family.length + npcFamily.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#1C242C' }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1C242C', '#1C242C', '#1C242C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* ------------------------------------------------------------
            THE STANDARD HEADER, LIKE EVERY OTHER SCREEN

            This was hand-rolled: its own back button, its own title, its own
            accent rule. Three consequences, and the audit caught all three.
            The back arrow was drawn in the LOSS RED - the one control on the
            screen that costs nothing, in the colour that means "this is
            costing you". The accent rule was not a category colour, so this
            screen was the only one in the app that did not tell you where you
            were. And the title did not scale with the system text size.

            `ScreenHeader` does all of it, takes the balance as its `right`
            slot, and `handleBack` still runs because the header takes it.
           ------------------------------------------------------------ */}
        <ScreenHeader
          title={t('love.contacts')}
          onBack={handleBack}
          inset={false}
          category="brand"
          right={<Text style={styles.balanceText}>{formatMoney(money)}</Text>}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* 2. Partner Section (Hero) — extracted component */}
          <PartnerHeroCard
            partner={partner}
            onPress={() => setModalType('partner')}
          />

          {/* 3. Family Section — extracted component */}
          <RelationshipList
            title={t('love.family')}
            count={totalFamilyCount}
            type="family"
            emptyText="No family members yet."
            legacyData={family}
            npcData={npcFamily}
            onItemPress={(member) => { setSelectedItem(member); setModalType('family'); }}
          />

          {/* 4. Friends Section — extracted component */}
          {friends && friends.length > 0 && (
            <RelationshipList
              title={t('love.friends')}
              count={friends.length}
              type="friend"
              emptyText="No friends yet."
              legacyData={friends}
              onItemPress={(friend) => { setSelectedItem(friend); setModalType('friend'); }}
            />
          )}

          {/* 5. Exes Section — extracted component */}
          <RelationshipList
            title={t('love.exesPast')}
            count={exes.length}
            type="ex"
            emptyText="No past relationships recorded."
            legacyData={exes}
            onItemPress={(ex) => { setSelectedItem(ex); setModalType('ex'); }}
          />

        </ScrollView>

        {/* INTERACTIONS MODAL */}
        <InteractionModal
          visible={!!modalType}
          onClose={closeModal}
          title={
            modalType === 'partner' ? partner?.name :
              (modalType === 'family' || modalType === 'friend') ? selectedItem?.name :
                modalType === 'ex' ? `Ex: ${selectedItem?.name}` : ''
          }>

          {feedback && (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackIcon}>💡</Text>
              <Text style={styles.feedbackBannerText}>{feedback}</Text>
            </View>
          )}

          {modalType === 'partner' && renderPartnerModalContent()}
          {(modalType === 'family' || modalType === 'friend') && renderGenericModalContent(modalType || 'family')}
          {modalType === 'ex' && renderExModalContent()}

        </InteractionModal>

        {/* ENCOUNTER MODAL (CINEMATIC) */}
        <EncounterModal
          visible={isEncounterVisible}
          candidate={encounterCandidate}
          scenario={currentScenario}
          context={currentScenario?.id.split('_')[0] || 'Unknown'}
          onDate={handleDate}
          onHookup={() => {
            Alert.alert("Fling", "You had a great night! (Stress -10)");
            closeEncounter();
          }}
          onIgnore={closeEncounter}
        />

        {/* BREAKUP MODAL (HIGHEST PRIORITY) */}
        {cheatingConsequence && (
          <BreakupModal
            visible={!!cheatingConsequence}
            onClose={clearConsequence}
            partnerName={cheatingConsequence.partnerName}
            settlementCost={cheatingConsequence.settlement}
          />
        )}

        {/* Universal Crystal Navigation Bar (Active: Love, Dark Variant) */}
        {/* BABY NAMING MODAL — extracted component */}
        <BabyNamingModal
          visible={isNamingChild}
          pendingChildGender={pendingChildGender}
          childName={childName}
          onChangeName={setChildName}
          onConfirm={() => {
            if (!childName.trim()) return;
            addContact({
              id: `npc_child_${Date.now()}`,
              name: childName.trim(),
              type: 'Child',
              age: 0,
              gender: pendingChildGender,
              relationship: 100,
              looks: Math.floor(Math.random() * 31) + 60,
              smarts: Math.floor(Math.random() * 31) + 60,
              isDeceased: false,
            });
            setIsNamingChild(false);
            setChildName('');
          }}
          onSkip={() => { setIsNamingChild(false); setChildName(''); }}
        />

      </SafeAreaView>
    </View>
  );
};


export default LoveScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(5,168,246,0.15)',
    minHeight: 80,
    backgroundColor: 'transparent',
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
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 4,
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
  headerRight: {
    position: 'absolute',
    right: 16,
    bottom: 20,
  },
  balanceText: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 120,
  },

  // MODAL SPECIFIC
  // ── Partner action grid tiles ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridTile: {
    flexBasis: '48%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  gridTileDanger: {
    backgroundColor: 'rgba(5,168,246,0.06)',
    borderColor: 'rgba(5,168,246,0.25)',
  },
  gridTilePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  gridTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gridTileEmoji: {
    fontSize: 22,
  },
  gridTileLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  gridTileDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },

  // ── Full-width list rows (family, exes, generic actions) ──
  actionList: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  actionRowDanger: {
    backgroundColor: 'rgba(5,168,246,0.06)',
    borderColor: 'rgba(5,168,246,0.2)',
  },
  actionRowPressed: {
    opacity: 0.72,
  },
  actionRowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionRowText: {
    flex: 1,
    gap: 2,
  },
  actionRowLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionRowDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '500',
  },
  actionRowChevron: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 22,
    fontWeight: '300',
  },

  // ── Legacy actionButton ──
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  priceText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Feedback Banner ──
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(207,208,210,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(207,208,210,0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  feedbackIcon: {
    fontSize: 18,
  },
  feedbackBannerText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // ── Satisfaction Bar ──────────────────────────────
  satisfactionContainer: {
    width: '100%',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  satisfactionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  satisfactionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  satisfactionValue: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  satisfactionTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden' as const,
  },
  satisfactionFill: {
    height: 6,
    borderRadius: 999,
  },
});
