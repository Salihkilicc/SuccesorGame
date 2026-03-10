import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Image, Alert, StatusBar, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserStore, useStatsStore } from '../../../core/store';
import { useAssetStore } from '../../shopping/store/useAssetStore';
import { useRelationshipStore } from '../../../core/store/useRelationshipStore';
import type { LoveStackParamList } from '../../../navigation';
import { theme } from '../../../core/theme';
import InteractionModal from '../components/InteractionModal';
import { EncounterModal } from '../components/EncounterModal';
import BreakupModal from '../components/BreakupModal';
import { useEncounterSystem } from '../components/useEncounterSystem';
import { applyPartnerBuffs, getPartnerPerks } from '../../../logic/relationshipLogic';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney } from '../../../core/utils';

type LoveScreenProp = NativeStackNavigationProp<LoveStackParamList, 'LoveHome'>;

type ModalType = 'partner' | 'family' | 'friend' | 'ex' | null;
type SubmenuType = 'gift' | 'propose' | 'text' | 'breakup_confirm' | 'breakup_result' | null;

const GIFTS = [
  { name: 'Flowers', price: 50, loveParams: 2 },
  { name: 'Chocolates', price: 100, loveParams: 3 },
  { name: 'Jewelry', price: 5000, loveParams: 15 },
  { name: 'Sports Car', price: 150000, loveParams: 40 },
];

const TEXT_MESSAGES = [
  "I miss you", "Nightclub tonight?", "You up?", "Thinking of you",
  "Hey...", "Remember us?", "Happy Birthday (Late)", "wyd"
];

const PROPOSAL_LOCATIONS = [
  { id: 'public_park', name: 'Public Park', cost: 0, bonus: 0 },
  { id: 'coffee_shop', name: 'Local Coffee Shop', cost: 50, bonus: 1 },
  { id: 'beach_sunset', name: 'Sunset Beach', cost: 200, bonus: 3 },
  { id: 'fancy_dinner', name: 'Luxury Restaurant', cost: 1000, bonus: 5 },
  { id: 'hot_air_balloon', name: 'Hot Air Balloon', cost: 2500, bonus: 8 },
  { id: 'disney_castle', name: 'Fairytale Castle', cost: 5000, bonus: 10 },
  { id: 'private_yacht', name: 'Private Yacht', cost: 15000, bonus: 15 },
  { id: 'paris_eiffel', name: 'Eiffel Tower Top', cost: 25000, bonus: 20 },
  { id: 'maldives_villa', name: 'Maldives Overwater Villa', cost: 50000, bonus: 25 },
  { id: 'times_square', name: 'Times Square Billboard', cost: 100000, bonus: 30 },
  { id: 'private_island', name: 'Rented Private Island', cost: 500000, bonus: 40 },
  { id: 'space_station', name: 'Orbit (Space Station)', cost: 5000000, bonus: 100 }
];

// Progress-bar style gradient: left side fills with purple proportional to love%
// Uses rich multi-stop colors so the card never looks flat
const getLoveGradient = (love: number): { colors: string[]; locations: number[] } => {
  const pct = Math.max(0, Math.min(100, love)) / 100;

  if (pct <= 0) {
    // Full navy: deep blue with subtle teal shimmer
    return { colors: ['#0F172A', '#1E3A8A', '#1E40AF', '#0F172A'], locations: [0, 0.3, 0.7, 1] };
  }
  if (pct >= 1) {
    // Full purple: vivid violet with highlights
    return { colors: ['#3B0764', '#6D28D9', '#7C3AED', '#4C1D95'], locations: [0, 0.3, 0.7, 1] };
  }

  // Mixed: purple left (love%) → soft pink transition → rich navy right
  // We need 6 stops to look modern and smooth
  const midPurple = pct * 0.7;          // purple peak at 70% of love band
  const transStart = pct - 0.02;         // transition starts just before boundary
  const transEnd = Math.min(pct + 0.12, 0.97); // soft 12% wide blend band
  const navyStart = Math.min(pct + 0.13, 0.98);

  return {
    colors: [
      '#4C1D95',   // deep violet start
      '#7C3AED',   // bright purple
      '#A855F7',   // lighter purple peak
      '#DB2777',   // hot pink transition
      '#1E3A8A',   // navy
      '#0F172A',   // deep midnight end
    ],
    locations: [
      0,
      Math.max(midPurple, 0.01),
      Math.max(transStart, 0.02),
      Math.min(transEnd, 0.96),
      Math.min(navyStart, 0.97),
      1,
    ],
  };
};

const LoveScreen = () => {
  const navigation = useNavigation<LoveScreenProp>();
  const {
    partner, family, friends, exes,
    proposeMarriage, marryPartner, breakUp,
    setField: setUserField
  } = useUserStore();
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
  const [selectedItem, setSelectedItem] = useState<any>(null); // FamilyMember, Friend, or ExPartner
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
  // Removed local cheatingConsequence state to use hook's state

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

    // Find or treat the partner's NPC record (keyed by partner.id)
    const partnerNPC = contacts.find(c => c.id === partner.id);

    // Quarterly limit check
    if (partnerNPC?.madeLoveThisQuarter) {
      Alert.alert('Not Now', 'You need to wait until the next quarter.');
      return;
    }

    // Mark as used this quarter (upsert into store)
    if (partnerNPC) {
      updateContact(partner.id, { madeLoveThisQuarter: true });
    } else {
      // First time — create an NPC entry for this partner
      addContact({
        id: partner.id,
        name: partner.name,
        type: 'Partner',
        age: partner.stats?.age ?? 25,
        gender: 'Female', // PartnerProfile has no top-level gender; default reasonable value
        relationship: partner.love ?? 80,
        looks: partner.stats?.looks ?? 50,
        smarts: partner.stats?.intelligence ?? 50,
        isDeceased: false,
        madeLoveThisQuarter: true,
      });
    }

    // Generate satisfaction score
    const score = Math.floor(Math.random() * 91) + 10; // 10–100
    setSatisfaction(score);

    // Pregnancy check: 10% chance every time Make Love is used
    if (Math.random() <= 0.10) {
      const gender: 'Male' | 'Female' = Math.random() > 0.5 ? 'Male' : 'Female';
      setPendingChildGender(gender);
      setChildName('');
      // iOS can't stack two Modals simultaneously.
      // Close the InteractionModal first, then open the naming modal.
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
        const elopeChance = partner.love / 150; // Max ~0.66 chance at 100 love
        if (Math.random() < elopeChance) {
          setFeedback("She said YES! You are now married (in secret)!");
          updatePartnerLove(20);
          // TODO: Add 'isMarried' flag to partner later
        } else {
          setFeedback("She thinks it's too sudden. (-Love)");
          updatePartnerLove(-5);
        }
        break;
      case 'Birth Control':
        // 50/50 chance she wants kids or not for now
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
            text: "Do it", style: 'destructive', onPress: () => {
              setFeedback("You had a huge fight!");
              updatePartnerLove(-25);
            }
          }
        ]);
        break;
      case 'Propose':
        // setSubmenu('propose'); 
        // Reset step state
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
  // Reused interactions for generic relationships
  const handleGenericAction = (action: string, type: 'family' | 'friend') => {
    if (!selectedItem) return;
    const person = selectedItem;
    setFeedback(null);

    // Helper to update specific member
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
    // Generic gift handler for Family/Friends
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
                // TODO: increase stress
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
          // Logic to move ex back to partner would go here
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
      // Update ex relation
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


  const getPartnerBadge = (love: number) => {
    if (partner?.isMarried) return 'Married';
    if (love >= 90) return 'Soulmate';
    if (love >= 70) return 'Lover';
    if (love >= 40) return 'Dating';
    return 'Neutral';
  };

  // --- Render Modals ---

  const renderPartnerModalContent = () => {
    if (!partner) return null;

    if (submenu === 'gift') {
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.modalSubtitle}>Select a Gift</Text>
          {GIFTS.map((g, i) => (
            <Pressable key={i} style={styles.actionButton} onPress={() => handleBuyGift(g)}>
              <Text style={styles.actionButtonText}>{g.name}</Text>
              <Text style={styles.priceText}>${g.price.toLocaleString()}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.actionButton, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]} onPress={() => setSubmenu(null)}>
            <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>Back</Text>
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
            <Text style={[styles.modalSubtitle, { color: theme.colors.danger }]}>IT'S OVER</Text>

            <Text style={{ color: theme.colors.textPrimary, textAlign: 'center' }}>
              You have ended your relationship with {partner.name}.
            </Text>

            {settlement > 0 && (
              <View style={{ backgroundColor: theme.colors.danger, padding: 10, borderRadius: 8, marginTop: 10 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  SETTLEMENT PAID: -${settlement.toLocaleString()}
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.actionButton, { marginTop: 20, backgroundColor: theme.colors.card }]}
              onPress={() => {
                // Finalize
                breakUp('divorce'); // Store handles deduction if we didn't do it manually.
                // Wait, store breaks up instantly.
                // If store handles deduction, we shouldn't have deducted yet.
                // We haven't deducted manually here. We just SHOWED what was paid.
                // So calling breakUp('divorce') now will deduct it. Correct.
                setSubmenu(null);
                closeModal();
              }}
            >
              <Text style={styles.actionButtonText}>Leave</Text>
            </Pressable>
          </View>
        );
      }

      // Confirm Screen
      return (
        <View style={{ gap: 16, padding: 10, backgroundColor: 'rgba(255,0,0,0.05)', borderRadius: 12 }}>
          <Text style={{ fontSize: 40, textAlign: 'center' }}>💔</Text>
          <Text style={[styles.modalSubtitle, { textAlign: 'center', color: theme.colors.danger }]}>WARNING</Text>

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
            style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
            onPress={() => setSubmenu('breakup_result')}
          >
            <Text style={[styles.actionButtonText, { color: 'white' }]}>Yes, It's Over</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={() => setSubmenu(null)}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </Pressable>
        </View>
      );
    }

    if (submenu === 'propose') {
      const location = PROPOSAL_LOCATIONS[selectedLocationIndex];
      const canAfford = money >= location.cost;
      const selectedRing = ownedRings.find(r => r.instanceId === selectedRingInstanceId) ?? ownedRings[0] ?? null;

      // STEP 1: Location & Ring Check
      const onStartProposal = () => {
        if (!selectedRingInstanceId || !selectedRing) {
          setFeedback("You need an Engagement Ring first!");
          return;
        }
        if (!canAfford) {
          setFeedback(`Not enough money! Need $${location.cost.toLocaleString()}`);
          return;
        }

        // Initial Love Check
        if (partner && partner.love < 30) {
          // Immediate Rejection — ring is NOT consumed for a love-check rejection
          setProposalResult({
            success: false,
            message: `${partner.name} doesn't love you enough yet... She said no.`
          });
          setProposalStep(3);
          return;
        }

        // Deduct Cost
        if (!spendMoney(location.cost)) {
          setFeedback(`Not enough money! Need $${location.cost.toLocaleString()}`);
          return;
        }

        // Remove the EXACT selected ring instance from inventory
        removeOwnedItem(selectedRingInstanceId);
        setSelectedRingInstanceId(null);

        // Proceed to Step 2 (Prenup)
        setProposalStep(2);
      };

      // STEP 2: Prenup Decision
      const onDecidePrenup = (wantsPrenup: boolean) => {
        // Calculate Final Result
        const result = proposeMarriage(wantsPrenup, location.bonus);
        setProposalResult(result);

        if (result.success) {
          marryPartner(wantsPrenup); // Commit State
        }

        setProposalStep(3); // Show Result
      };

      const closeProposal = () => {
        setSubmenu(null);
        setProposalStep(0);
        setProposalResult(null);
        setSelectedRingInstanceId(null);
        setIsPickingRing(false);
        closeModal();
      };

      // --- WIZARD UI ---

      // STEP 3: RESULT
      if (proposalStep === 3 && proposalResult) {
        const isSuccess = proposalResult.success;
        return (
          <View style={{ alignItems: 'center', gap: 16, padding: 20 }}>
            <Text style={{ fontSize: 60 }}>{isSuccess ? '💍' : '💔'}</Text>

            <Text style={[styles.modalSubtitle, { fontSize: 24, color: isSuccess ? theme.colors.success : theme.colors.danger }]}>
              {isSuccess ? 'JUST MARRIED!' : 'REJECTED'}
            </Text>

            <Text style={{ color: theme.colors.textPrimary, textAlign: 'center', fontSize: 16 }}>
              {proposalResult.message}
            </Text>
          </View>
        );
      }

      // STEP 2: PRENUP DECISION
      if (proposalStep === 2) {
        return (
          <View style={{ gap: 16, padding: 10 }}>
            <Text style={{ fontSize: 50, textAlign: 'center' }}>😲</Text>
            <Text style={[styles.modalSubtitle, { textAlign: 'center' }]}>She Said YES! (Kind of...)</Text>

            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              She is emotional and waiting for the ring. This is your moment.
              {"\n\n"}
              <Text style={{ fontWeight: 'bold', color: theme.colors.accent }}>Do you want to ask for a Prenup?</Text>
              {"\n"}
              (Protects assets, but might offend her)
            </Text>

            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
              onPress={() => onDecidePrenup(true)}>
              <Text style={[styles.actionButtonText, { color: '#FFF' }]}>📝 Sign Prenup (Risk)</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              onPress={() => onDecidePrenup(false)}>
              <Text style={[styles.actionButtonText, { color: '#000' }]}>❤️ No Prenup (Trust)</Text>
            </Pressable>
          </View>
        );
      }

      // RING PICKER SCREEN (inline view swap)
      if (isPickingRing) {
        return (
          <View style={{ gap: 12 }}>
            <Text style={styles.modalSubtitle}>Choose Your Ring</Text>
            {ownedRings.map(ring => (
              <Pressable
                key={ring.instanceId}
                style={[styles.actionButton, {
                  justifyContent: 'space-between',
                  backgroundColor: ring.instanceId === selectedRingInstanceId
                    ? 'rgba(197,160,89,0.18)'
                    : 'rgba(255,255,255,0.04)',
                  borderWidth: ring.instanceId === selectedRingInstanceId ? 1 : 0,
                  borderColor: theme.colors.accent,
                }]}
                onPress={() => {
                  setSelectedRingInstanceId(ring.instanceId);
                  setIsPickingRing(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 22 }}>💍</Text>
                  <View>
                    <Text style={[styles.actionButtonText, { fontWeight: '700' }]}>{ring.name}</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      Value: ${(ring.marketValue ?? ring.price).toLocaleString()}
                    </Text>
                  </View>
                </View>
                {ring.instanceId === selectedRingInstanceId && (
                  <Text style={{ color: theme.colors.accent, fontSize: 18, fontWeight: 'bold' }}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        );
      }

      // STEP 1: PICKER (Default)
      const cycleLocation = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
          setSelectedLocationIndex(prev => (prev === 0 ? PROPOSAL_LOCATIONS.length - 1 : prev - 1));
        } else {
          setSelectedLocationIndex(prev => (prev === PROPOSAL_LOCATIONS.length - 1 ? 0 : prev + 1));
        }
      };

      return (
        <View style={{ gap: 16 }}>
          <Text style={styles.modalSubtitle}>Plan Proposal</Text>

          {/* Location Picker */}
          <View style={styles.locationPicker}>
            <Pressable onPress={() => cycleLocation('prev')} style={styles.arrowButton}>
              <Text style={styles.arrowText}>←</Text>
            </Pressable>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={[styles.locationCost, !canAfford && { color: theme.colors.danger }]}>
                ${location.cost.toLocaleString()}
              </Text>
              <Text style={styles.locationBonus}>
                Success Bonus: +{location.bonus}%
              </Text>
            </View>

            <Pressable onPress={() => cycleLocation('next')} style={styles.arrowButton}>
              <Text style={styles.arrowText}>→</Text>
            </Pressable>
          </View>

          {/* Ring Check — always shows Go Shopping */}
          <View style={[styles.actionButton, {
            justifyContent: 'space-between',
            backgroundColor: ownedRings.length > 0 ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
          }]}>
            {ownedRings.length === 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18 }}>💍</Text>
                <Text style={[styles.actionButtonText, { color: theme.colors.danger }]}>No Ring</Text>
              </View>
            ) : (
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                onPress={() => setIsPickingRing(true)}
              >
                <Text style={{ fontSize: 18 }}>💍</Text>
                <View>
                  <Text style={[styles.actionButtonText, { fontWeight: '700' }]}>
                    {selectedRing?.name ?? 'Ring Selected'}
                  </Text>
                  <Text style={{ color: theme.colors.accent, fontSize: 11, marginTop: 1, letterSpacing: 0.5 }}>
                    Tap to change
                  </Text>
                </View>
              </Pressable>
            )}

            <Pressable
              style={styles.smallButton}
              // @ts-ignore
              onPress={() => { closeProposal(); navigation.navigate('Assets', { screen: 'Shopping' }); }}
            >
              <Text style={styles.smallButtonText}>Go Shopping</Text>
            </Pressable>
          </View>

          {/* Action Button */}
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.accent, marginTop: 8, opacity: (canAfford && ownedRings.length > 0) ? 1 : 0.5 }
            ]}
            onPress={onStartProposal}>
            <Text style={[styles.actionButtonText, { color: '#000', fontWeight: '800', letterSpacing: 1 }]}>
              PROPOSE ❤️
            </Text>
          </Pressable>
        </View>
      );
    }

    // Determine if the partner is already 'used' this quarter
    const partnerNPC = contacts.find(c => c.id === partner.id);
    const alreadyMadeLove = !!partnerNPC?.madeLoveThisQuarter;

    // Satisfaction bar colour: 0-30 red, 31-60 amber, 61-100 emerald/purple
    const getSatisfactionColor = (v: number) => {
      if (v <= 30) return '#EF4444';
      if (v <= 60) return '#F59E0B';
      return '#A855F7';
    };

    return (
      <View style={styles.grid}>
        {[
          { label: 'Gift', desc: 'Show your love', emoji: '🎁', action: 'Gift', color: '#F59E0B' },
          { label: 'Compliment', desc: 'Lift her spirits', emoji: '💬', action: 'Compliment', color: '#38BDF8' },
          { label: 'Break Up', desc: 'End things here', emoji: '💔', action: 'Break Up', danger: true, color: '#EF4444' },
          { label: 'Elope', desc: 'Secret wedding', emoji: '🏃', action: 'Elope', color: '#A855F7' },
          { label: 'Birth Control', desc: 'Plan ahead', emoji: '💊', action: 'Birth Control', color: '#22C55E' },
          { label: 'Counseling', desc: 'Save the bond', emoji: '🗣️', action: 'Counseling', color: '#6366F1' },
          { label: 'Insult', desc: 'Risky move', emoji: '🤬', action: 'Insult', danger: true, color: '#EF4444' },
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
            <Text style={[styles.gridTileLabel, btn.danger && { color: '#EF4444' }]}>{btn.label}</Text>
            <Text style={styles.gridTileDesc}>{btn.desc}</Text>
          </Pressable>
        ))}

        {/* Make Love Button ─ same gridTile as all other partner actions */}
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
          <View style={[styles.gridTileIcon, { backgroundColor: alreadyMadeLove ? '#EF4444' + '22' : '#EC4899' + '22', borderColor: alreadyMadeLove ? '#EF4444' + '55' : '#EC4899' + '55' }]}>
            <Text style={styles.gridTileEmoji}>💗</Text>
          </View>
          <Text style={[styles.gridTileLabel, alreadyMadeLove && { color: '#EF4444' }]}>
            {alreadyMadeLove ? 'Make Love' : 'Make Love'}
          </Text>
          <Text style={styles.gridTileDesc}>
            {alreadyMadeLove ? 'Quarterly limit reached' : 'Intimate moment'}
          </Text>
        </Pressable>

        {/* Satisfaction Bar — shown after an interaction */}
        {satisfaction !== null && (
          <View style={styles.satisfactionContainer}>
            <View style={styles.satisfactionHeader}>
              <Text style={styles.satisfactionLabel}>Satisfaction</Text>
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

        {/* Propose button ─ same gridTile as all other partner actions */}
        {!partner.isMarried && (
          <Pressable
            key="propose"
            style={({ pressed }) => [
              styles.gridTile,
              pressed && styles.gridTilePressed,
            ]}
            onPress={() => handlePartnerAction('Propose')}
          >
            <View style={[styles.gridTileIcon, { backgroundColor: '#FACC15' + '22', borderColor: '#FACC15' + '55' }]}>
              <Text style={styles.gridTileEmoji}>💍</Text>
            </View>
            <Text style={styles.gridTileLabel}>Propose</Text>
            <Text style={styles.gridTileDesc}>Pop the question</Text>
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
            <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>Back</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.actionList}>
        {[
          { label: 'Spend Time Together', desc: 'Quality time boosts bond', emoji: '☕', action: 'Spend Time', color: '#F59E0B' },
          { label: 'Compliment', desc: 'Positive words go far', emoji: '💬', action: 'Compliment', color: '#38BDF8' },
          { label: 'Send a Gift', desc: 'Money talks', emoji: '🎁', action: 'Gift', color: '#22C55E' },
          { label: 'Insult', desc: 'This will hurt', emoji: '🤬', action: 'Insult', danger: true, color: '#EF4444' },
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
              <Text style={[styles.actionRowLabel, btn.danger && { color: '#EF4444' }]}>{btn.label}</Text>
              <Text style={styles.actionRowDesc}>{btn.desc}</Text>
            </View>
            <Text style={[styles.actionRowChevron, btn.danger && { color: '#EF4444' }]}>›</Text>
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
            <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>Back</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.actionList}>
        {[
          { label: 'Text Her', desc: 'Send a message', emoji: '📱', action: 'Text Her', color: '#38BDF8' },
          { label: 'Go on Vacation', desc: 'Coming soon', emoji: '✈️', action: 'Go Vacation', color: '#6366F1' },
          { label: 'Stalk Her', desc: 'Check her socials', emoji: '👁️', action: 'Stalk Her', color: '#A855F7' },
          { label: 'Start Dating Again', desc: 'Rekindle the flame', emoji: '🔥', action: 'Start Dating Again', color: '#F59E0B' },
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


  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0a0a0c', '#000000', '#050505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 1. Ultra-Slim Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
            ]}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#C5A059" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>CONTACTS</Text>
            <View style={styles.headerAccent} />
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.balanceText}>
              {formatMoney(money)}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* 2. Partner Section (Hero) */}
          {partner ? (
            <Pressable onPress={() => setModalType('partner')} style={styles.partnerCardWrapper}>
              <LinearGradient
                {...getLoveGradient(partner.love)}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 0.8 }}
                style={styles.partnerCardGradient}
              >
                <View style={[styles.partnerInfo, { paddingLeft: 16 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Text style={[styles.partnerName, { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>
                      {partner.name}
                    </Text>
                    <View style={[styles.partnerBadge, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', flexShrink: 0 }]}>
                      <Text style={[styles.partnerBadgeText, { color: '#FFFFFF', fontSize: 9 }]}>{getPartnerBadge(partner.love)}</Text>
                    </View>
                  </View>

                  <View style={styles.partnerStats}>
                    <Text style={[styles.partnerStatLabel, { color: 'rgba(255,255,255,0.8)' }]}>Love: {partner.love}%</Text>
                    <View style={[styles.partnerBarTrack, { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                      <View style={[styles.partnerBarFill, { width: `${partner.love}%`, backgroundColor: '#F472B6', shadowColor: '#F472B6', shadowOpacity: 0.8, shadowRadius: 6 }]} />
                    </View>

                    {/* ACTIVE PERKS DISPLAY */}
                    <View style={{ marginTop: 11, width: '100%', overflow: 'hidden' }}>
                      <Text style={{ fontSize: 11.4, color: 'rgba(255,255,255,0.7)', marginBottom: 5, fontWeight: '700', letterSpacing: 0.5 }}>
                        ACTIVE PERKS
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 7 }}
                      >
                        {getPartnerPerks(partner).length > 0 ? (
                          getPartnerPerks(partner).map(perk => (
                            <View key={perk.id} style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: `${perk.color}15`, // 15 = ~8% opacity
                              paddingVertical: 9,
                              paddingHorizontal: 11,
                              borderRadius: 12,
                              borderLeftWidth: 3,
                              borderLeftColor: perk.color,
                              minWidth: 152,
                              maxWidth: 228
                            }}>
                              <Text style={{ fontSize: 22.8, marginRight: 9 }}>{perk.icon}</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={{
                                  color: perk.color,
                                  fontSize: 11,
                                  fontWeight: 'bold',
                                  marginBottom: 2
                                }}>
                                  {perk.title}
                                </Text>
                                <Text style={{
                                  color: theme.colors.textSecondary,
                                  fontSize: 9,
                                  lineHeight: 11
                                }}>
                                  {perk.desc}
                                </Text>
                              </View>
                            </View>
                          ))
                        ) : (
                          <View style={{
                            padding: 12,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                            width: '100%'
                          }}>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontStyle: 'italic' }}>
                              Your partner has no active perks at the moment.
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.partnerCardWrapper}>
              <LinearGradient
                colors={['#0F172A', '#1E293B', '#334155']} // Muted navy for no partner
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.partnerCardGradient, { opacity: 0.8 }]}
              >
                <View style={[styles.partnerPhotoContainer, { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                  <Text style={styles.noPartnerIcon}>?</Text>
                </View>
                <View style={styles.partnerInfo}>
                  <Text style={[styles.partnerName, { color: 'rgba(255,255,255,0.7)' }]}>No Partner</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Maybe it's time to meet someone?</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* 3. Family Section */}
          {(() => {
            // Merge legacy useUserStore family with NPC contacts that are family types
            const npcFamily = contacts.filter(
              c => !c.isDeceased && ['Mother', 'Father', 'Sibling', 'Child'].includes(c.type)
            );
            const totalCount = family.length + npcFamily.length;
            return (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Family</Text>
                  <Text style={styles.sectionCount}>{totalCount} Members</Text>
                </View>

                {/* Legacy family from useUserStore */}
                {family.map(member => (
                  <Pressable key={member.id} style={styles.listItem} onPress={() => { setSelectedItem(member); setModalType('family'); }}>
                    <View style={styles.listPhotoContainer}>
                      {member.photo ? (
                        <Image source={{ uri: member.photo }} style={styles.listPhoto} />
                      ) : (
                        <Text style={styles.listInitial}>{member.name[0]}</Text>
                      )}
                    </View>
                    <View style={styles.listContent}>
                      <View style={styles.listNameRow}>
                        <Text style={styles.listName}>{member.name}</Text>
                        <Text style={styles.listRole}>({member.relation})</Text>
                      </View>
                      <View style={styles.listBarTrack}>
                        <View style={[styles.listBarFill, { width: `${member.relationship}%` }]} />
                      </View>
                    </View>
                  </Pressable>
                ))}

                {/* NPC family contacts (Mother, Father, Sibling, Child) from useRelationshipStore */}
                {npcFamily.map(npc => (
                  <View key={npc.id} style={styles.listItem}>
                    <View style={[styles.listPhotoContainer, {
                      backgroundColor:
                        npc.type === 'Child' ? 'rgba(250,204,21,0.12)' :
                          npc.type === 'Mother' ? 'rgba(236,72,153,0.12)' :
                            'rgba(99,102,241,0.12)',
                    }]}>
                      <Text style={styles.listInitial}>
                        {npc.type === 'Child' ? '👶' : npc.type === 'Mother' ? '👩' : '👨'}
                      </Text>
                    </View>
                    <View style={styles.listContent}>
                      <View style={styles.listNameRow}>
                        <Text style={styles.listName}>{npc.name}</Text>
                        <Text style={styles.listRole}>({npc.type}, Age {npc.age})</Text>
                      </View>
                      <View style={styles.listBarTrack}>
                        <View style={[styles.listBarFill, {
                          width: `${npc.relationship}%`,
                          backgroundColor: npc.type === 'Child' ? '#FACC15' : npc.type === 'Mother' ? '#EC4899' : '#6366F1',
                        }]} />
                      </View>
                    </View>
                  </View>
                ))}

                {totalCount === 0 && (
                  <Text style={styles.emptyText}>No family members yet.</Text>
                )}
              </View>
            );
          })()}

          {/* 4. Friends Section */}
          {friends && friends.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Friends</Text>
                <Text style={styles.sectionCount}>{friends.length} Friends</Text>
              </View>

              {friends.map(friend => (
                <Pressable key={friend.id} style={styles.listItem} onPress={() => { setSelectedItem(friend); setModalType('friend'); }}>
                  <View style={styles.listPhotoContainer}>
                    {friend.photo ? (
                      <Image source={{ uri: friend.photo }} style={styles.listPhoto} />
                    ) : (
                      <Text style={styles.listInitial}>{friend.name[0]}</Text>
                    )}
                  </View>
                  <View style={styles.listContent}>
                    <View style={styles.listNameRow}>
                      <Text style={styles.listName}>{friend.name}</Text>
                    </View>
                    <View style={styles.listBarTrack}>
                      <View style={[styles.listBarFill, { width: `${friend.relationship}%`, backgroundColor: theme.colors.accent }]} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* 5. Exes Section */}
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exes / Past</Text>
              <Text style={styles.sectionCount}>{exes.length}</Text>
            </View>

            {exes.length > 0 ? (
              exes.map(ex => (
                <Pressable key={ex.id} style={styles.listItem} onPress={() => { setSelectedItem(ex); setModalType('ex'); }}>
                  <View style={styles.listPhotoContainer}>
                    {ex.photo ? (
                      <Image source={{ uri: ex.photo }} style={styles.listPhoto} />
                    ) : (
                      <Text style={styles.listInitial}>{ex.name[0]}</Text>
                    )}
                  </View>
                  <View style={styles.listContent}>
                    <View style={styles.listNameRow}>
                      <Text style={styles.listName}>{ex.name}</Text>
                    </View>
                    <View style={styles.listBarTrack}>
                      <View style={[styles.listBarFill, { width: `${ex.love}%`, backgroundColor: theme.colors.textMuted }]} />
                    </View>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No past relationships recorded.</Text>
            )}
          </View>

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
            // TODO: Implement hookup logic (stress reduction, etc.)
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
        <CrystalNavBar activeTab="Love" variant="dark" />

        {/* BABY NAMING MODAL */}
        <Modal
          visible={isNamingChild}
          transparent
          animationType="fade"
          onRequestClose={() => setIsNamingChild(false)}
        >
          <View style={styles.namingOverlay}>
            <View style={styles.namingCard}>
              {/* Header */}
              <Text style={styles.namingHeadEmoji}>👶</Text>
              <Text style={styles.namingTitle}>A New Life</Text>
              <Text style={styles.namingSubtitle}>
                {'Congratulations! You just had a ' + (pendingChildGender === 'Female' ? 'baby girl' : 'baby boy') + '.\nWhat will you name them?'}
              </Text>

              {/* Input */}
              <TextInput
                style={styles.namingInput}
                placeholderTextColor="rgba(255,255,255,0.3)"
                placeholder="Enter a name..."
                value={childName}
                onChangeText={setChildName}
                autoFocus
                maxLength={20}
              />

              {/* Confirm */}
              <Pressable
                style={({ pressed }) => [
                  styles.namingConfirm,
                  (!childName.trim()) && styles.namingConfirmDisabled,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
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
                disabled={!childName.trim()}
              >
                <Text style={styles.namingConfirmText}>Confirm Name</Text>
              </Pressable>

              {/* Dismiss (skip naming) */}
              <Pressable
                style={styles.namingSkip}
                onPress={() => { setIsNamingChild(false); setChildName(''); }}
              >
                <Text style={styles.namingSkipText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View >
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
    borderBottomColor: 'rgba(197,160,89,0.15)',
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
    fontSize: 22,
    fontWeight: '300',
    color: '#E5E5E5',
    letterSpacing: 4,
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
  headerSubtitle: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
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

  // Partner Hero Card
  partnerCardWrapper: {
    width: '105%',
    marginBottom: 12,
  },
  partnerCardGradient: {
    borderRadius: 26,
    padding: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#BE185D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  partnerPhotoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  partnerPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  noPartnerIcon: {
    fontSize: 28,
    color: theme.colors.textMuted,
  },
  partnerInfo: {
    flex: 1,
    gap: 4,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingRight: 16,
  },
  partnerName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  partnerStats: {
    gap: 2,
  },
  partnerStatLabel: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  partnerBarTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 2,
  },
  partnerBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  partnerBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  partnerBadgeText: {
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionCount: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '600',
  },

  // Generic List item (Family & Exes)
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 16,
    marginBottom: 12,
  },
  listPhotoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.cardSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  listInitial: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Exploration Places
  placeCard: {
    width: 100,
    height: 110,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  placeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  listName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  listRole: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  listBarTrack: {
    height: 4,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 999,
    overflow: 'hidden',
    width: 80,
  },
  listBarFill: {
    height: '100%',
    backgroundColor: theme.colors.textSecondary, // Use a neutral color for family/exes to distinguish from partner
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    paddingLeft: 4,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  backButtonPressed: {
    opacity: 0.7
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
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderColor: 'rgba(239,68,68,0.25)',
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
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderColor: 'rgba(239,68,68,0.2)',
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
    color: 'rgba(255,255,255,0.3)',
    fontSize: 22,
    fontWeight: '300',
  },

  // ── Legacy actionButton (still used in gift list, propose submenu, etc.) ──
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

  // ── Propose tile (full-width, accent border) ──
  proposeTile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(250,204,21,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(250,204,21,0.4)',
  },
  proposeTileText: {
    color: '#FACC15',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceText: {
    color: theme.colors.accent,
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

  // ── Feedback Banner (replaces feedbackContainer) ──
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
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
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Proposal Specific
  locationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  arrowButton: {
    padding: 12,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 8,
  },
  arrowText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  locationInfo: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  locationCost: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  locationBonus: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  smallButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Make Love Button ──────────────────────────────
  makeLoveButton: {
    width: '100%',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1.5,
    borderColor: '#A855F7',
  },
  makeLoveButtonDisabled: {
    opacity: 0.4,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  makeLoveEmoji: {
    fontSize: 20,
  },
  makeLoveLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#A855F7',
  },
  makeLoveSubtext: {
    fontSize: 11,
    color: 'rgba(168, 85, 247, 0.6)',
    fontStyle: 'italic' as const,
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

  // ── Baby Naming Modal ─────────────────────────
  namingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  namingCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#101014',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.3)',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  namingHeadEmoji: {
    fontSize: 52,
  },
  namingTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  namingSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  namingInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  namingConfirm: {
    width: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  namingConfirmDisabled: {
    opacity: 0.35,
  },
  namingConfirmText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  namingSkip: {
    paddingVertical: 10,
  },
  namingSkipText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontWeight: '500',
  },
});
