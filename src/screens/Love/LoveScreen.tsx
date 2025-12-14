import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, useStatsStore } from '../../store';
import type { LoveStackParamList } from '../../navigation';
import { theme } from '../../theme';
import { InteractionModal } from '../../components';

type LoveScreenProp = NativeStackNavigationProp<LoveStackParamList, 'LoveHome'>;

type ModalType = 'partner' | 'family' | 'friend' | 'ex' | null;
type SubmenuType = 'gift' | 'propose' | 'text' | null;

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

const LoveScreen = () => {
  const navigation = useNavigation<LoveScreenProp>();
  const { partner, family, friends, exes, setField: setUserField } = useUserStore();
  const { money, setField: setStatsField } = useStatsStore();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null); // FamilyMember, Friend, or ExPartner
  const [submenu, setSubmenu] = useState<SubmenuType>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Home' as never);
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setSubmenu(null);
    setFeedback(null);
  };

  const updatePartnerLove = (amount: number) => {
    if (!partner) return;
    const newLove = Math.max(0, Math.min(100, partner.love + amount));
    setUserField('partner', { ...partner, love: newLove });
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
        Alert.alert("Break Up", "Are you sure you want to end this relationship?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, It's Over", style: 'destructive', onPress: () => {
              // Determine if we move partner to exes? For simplicity, just nullify partner for now
              // In a real app we'd create an ExPartner object
              setUserField('partner', null);
              closeModal();
            }
          }
        ]);
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
        setSubmenu('propose');
        break;
    }
  };

  const handleBuyGift = (item: typeof GIFTS[0]) => {
    if (money < item.price) {
      setFeedback(`Not enough money! Need $${item.price}`);
      return;
    }
    setStatsField('money', money - item.price);
    updatePartnerLove(item.loveParams);
    setFeedback(`You gave her ${item.name}! (+${item.loveParams} Love)`);
    // Close submenu after short delay or manually? Let's keep it open so they can verify
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
    if (money < item.price) {
      setFeedback(`Not enough money! Need $${item.price}`);
      return;
    }
    setStatsField('money', money - item.price);

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
        e.id === selectedItem.id ? { ...e, relationship: Math.max(0, Math.min(100, e.relationship + delta)) } : e
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
        if (selectedItem.relationship > 80 && Math.random() > 0.6) {
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
        e.id === selectedItem.id ? { ...e, relationship: Math.min(100, e.relationship + 5) } : e
      );
      setUserField('exes', newExes);
    } else if (rng > 0.3) {
      setFeedback("Read at 11:42 PM.");
    } else {
      setFeedback("Not delivered. You might be blocked.");
      const newExes = exes.map(e =>
        e.id === selectedItem.id ? { ...e, relationship: Math.max(0, e.relationship - 2) } : e
      );
      setUserField('exes', newExes);
    }
  };


  const getPartnerBadge = (love: number) => {
    if (love >= 90) return 'Soulmate';
    if (love >= 70) return 'Lover';
    if (love >= 40) return 'Dating';
    return 'Neutral';
  };

  // --- Render Modals ---

  const renderPartnerModalContent = () => {
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

    if (submenu === 'propose') {
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.modalSubtitle}>Plan Proposal</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center' }}>
            Ready to pop the question? Pick a spot.
          </Text>

          {/* Placeholder for Location Picker */}
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📍 Location: Beach (Default)</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => console.log('Go to shop')}>
            <Text style={styles.actionButtonText}>💍 Ring: None (Buy)</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.colors.accent, marginTop: 12 }]}
            onPress={() => setFeedback("You don't have a ring yet!")}>
            <Text style={[styles.actionButtonText, { color: '#000' }]}>PROPOSE</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]} onPress={() => setSubmenu(null)}>
            <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>Back</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {[
          { label: '🎁 Gift', action: 'Gift' },
          { label: '💬 Compliment', action: 'Compliment' },
          { label: '💔 Break Up', action: 'Break Up', danger: true },
          { label: '🏃 Elope', action: 'Elope' },
          { label: '💊 Birth Control', action: 'Birth Control' },
          { label: '🗣️ Counseling', action: 'Counseling' },
          { label: '🤬 Insult', action: 'Insult', danger: true },
        ].map((btn) => (
          <Pressable
            key={btn.action}
            style={[styles.gridButton, btn.danger && { borderColor: theme.colors.danger }]}
            onPress={() => handlePartnerAction(btn.action)}>
            <Text style={[styles.gridButtonText, btn.danger && { color: theme.colors.danger }]}>{btn.label}</Text>
          </Pressable>
        ))}

        {/* Special Propose Button */}
        <Pressable style={[styles.actionButton, { backgroundColor: theme.colors.cardSoft, borderWidth: 1, borderColor: theme.colors.accent }]} onPress={() => handlePartnerAction('Propose')}>
          <Text style={[styles.actionButtonText, { color: theme.colors.accent }]}>💍 Propose</Text>
        </Pressable>
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
      <View style={{ gap: 12 }}>
        {[
          { label: '☕ Spend Time Together', action: 'Spend Time' },
          { label: '💬 Compliment', action: 'Compliment' },
          { label: '🎁 Gift', action: 'Gift' },
          { label: '🤬 Insult', action: 'Insult', danger: true },
        ].map(btn => (
          <Pressable
            key={btn.action}
            style={[styles.actionButton, btn.danger && { borderColor: theme.colors.danger, backgroundColor: 'rgba(255,0,0,0.1)' }]}
            onPress={() => handleGenericAction(btn.action, type)}>
            <Text style={[styles.actionButtonText, btn.danger && { color: theme.colors.danger }]}>{btn.label}</Text>
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
      <View style={{ gap: 12 }}>
        {[
          { label: '📱 Text Her', action: 'Text Her' },
          { label: '✈️ Go Vacation (Coming Soon)', action: 'Go Vacation' },
          { label: '👁️ Stalk Her', action: 'Stalk Her' },
          { label: '🔥 Start Dating Again', action: 'Start Dating Again' },
        ].map(btn => (
          <Pressable
            key={btn.action}
            style={styles.actionButton}
            onPress={() => handleExAction(btn.action)}>
            <Text style={styles.actionButtonText}>{btn.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 1. Ultra-Slim Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.headerLeft,
            pressed && { opacity: 0.7 },
          ]}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.headerTitle}>Relationships & Love</Text>
        </Pressable>
        {/* Optional Right Node */}
        <View style={styles.headerRight}>
          <Text style={styles.balanceText}>
            ${money.toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 2. Partner Section (Hero) */}
        {partner ? (
          <Pressable style={styles.partnerCard} onPress={() => setModalType('partner')}>
            <View style={styles.partnerPhotoContainer}>
              {partner.photo ? (
                <Image source={{ uri: partner.photo }} style={styles.partnerPhoto} />
              ) : (
                <Text style={{ fontSize: 32 }}>👤</Text>
              )}
            </View>
            <View style={styles.partnerInfo}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.partnerName}>{partner.name}</Text>
                <View style={styles.partnerBadge}>
                  <Text style={styles.partnerBadgeText}>{getPartnerBadge(partner.love)}</Text>
                </View>
              </View>

              <View style={styles.partnerStats}>
                <Text style={styles.partnerStatLabel}>Love: {partner.love}%</Text>
                <View style={styles.partnerBarTrack}>
                  <View style={[styles.partnerBarFill, { width: `${partner.love}%` }]} />
                </View>
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.partnerCard}>
            <View style={[styles.partnerPhotoContainer, { borderColor: theme.colors.textMuted, borderWidth: 1 }]}>
              <Text style={styles.noPartnerIcon}>?</Text>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={[styles.partnerName, { color: theme.colors.textMuted }]}>No Partner</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Maybe it's time to meet someone?</Text>
            </View>
          </View>
        )}

        {/* 3. Family Section */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family</Text>
            <Text style={styles.sectionCount}>{family.length} Members</Text>
          </View>

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
        </View>

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
                    <View style={[styles.listBarFill, { width: `${ex.relationship}%`, backgroundColor: theme.colors.textMuted }]} />
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
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {modalType === 'partner' && renderPartnerModalContent()}
        {(modalType === 'family' || modalType === 'friend') && renderGenericModalContent(modalType || 'family')}
        {modalType === 'ex' && renderExModalContent()}

      </InteractionModal>
    </SafeAreaView>
  );
};


export default LoveScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '300',
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },

  headerRight: {},
  balanceText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl * 2,
  },

  // Partner Hero Card
  partnerCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.accentSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  partnerPhotoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  partnerPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  noPartnerIcon: {
    fontSize: 32,
    color: theme.colors.textMuted,
  },
  partnerInfo: {
    flex: 1,
    gap: 4,
  },
  partnerName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  partnerStats: {
    gap: 2,
  },
  partnerStatLabel: {
    color: theme.colors.accent,
    fontSize: 12,
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
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionCount: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },

  // Generic List item (Family & Exes)
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
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
    gap: 6,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridButton: {
    flexBasis: '48%', // Approx 2 columns
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gridButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
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
  },
  feedbackContainer: {
    backgroundColor: theme.colors.accentSoft,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    marginBottom: 8,
  },
  feedbackText: {
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  }
});
