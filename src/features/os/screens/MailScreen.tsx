import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme, avatarTintFor } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import SwipeToDelete from '../../../components/common/SwipeToDelete';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMailStore, type Mail } from '../../../core/store/useMailStore';
import { useNegotiationStore } from '../../../core/store/useNegotiationStore';

const formatMonth = (m: number) => `M${m}`;

const getInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// The palette and the hash moved to core/theme.ts. MailDetailScreen carried a
// SECOND copy of both, so the same sender could be drawn in one colour in the
// list and another in the detail view. One of the eight, '#85DCB', was five
// digits - not a colour - so one sender in eight got whatever React Native
// does with a malformed hex.

const MailRow = ({ mail, onPress }: { mail: Mail; onPress: () => void }) => {
    const isUnread = !mail.isRead;
    
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            
            <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: avatarTintFor(mail.fromName) }]}>
                    <Text style={styles.avatarText}>{getInitials(mail.fromName)}</Text>
                </View>
                {isUnread && (
                    <View style={styles.unreadIndicatorRow}>
                        <Text style={styles.unreadIndicatorRowText}>!</Text>
                    </View>
                )}
            </View>

            <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                    <Text style={[styles.fromName, isUnread && styles.textUnread]} numberOfLines={1}>
                        {mail.fromName}
                    </Text>
                    <Text style={[styles.time, isUnread && styles.textUnreadTime]}>
                        {formatMonth(mail.atMonth)}
                    </Text>
                </View>
                <Text style={[styles.subject, isUnread && styles.textUnread]} numberOfLines={1}>
                    {mail.subject}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                    {mail.body.replace(/\n/g, ' ')}
                </Text>
            </View>
        </Pressable>
    );
};

const MailScreen = () => {
    const navigation = useNavigation<any>();
    const inbox = useMailStore(s => s.inbox);
    const markRead = useMailStore(s => s.markRead);
    const deleteMail = useMailStore(s => s.deleteMail);
    const offers = useNegotiationStore(s => s.offers);
    const withdrawOffer = useNegotiationStore(s => s.withdraw);

    // ------------------------------------------------------------------
    //  A LETTER SOMEBODY IS WAITING ON AN ANSWER TO
    // ------------------------------------------------------------------
    //  The gesture is for tidying, and most of the inbox is tidy-able: a
    //  sponsorship offer nobody wants, a scene that has been played out. Two
    //  kinds of letter are not.
    //
    //  A BOARD WAITING FOR AN ANSWER is the dangerous one, and it is dangerous
    //  in a way that has nothing to do with losing the letter. The offer stays
    //  `open` in the negotiation store, and `send` refuses a second approach
    //  while one is open - so binning the reply would lock that company out of
    //  the game for ever, with the reason living in a store the player cannot
    //  see. Deleting the letter now withdraws the approach, which is what
    //  throwing away somebody's reply means.
    //
    //  AN UNPLAYED SCENE is the other, and is merely lost. Said out loud
    //  rather than prevented: it is their inbox.
    // ------------------------------------------------------------------
    
    const [searchQuery, setSearchQuery] = useState('');

    // ------------------------------------------------------------------
    //  BELOW EVERY HOOK, DELIBERATELY
    // ------------------------------------------------------------------
    //  These sat above `useState` and the audit called it: a plain `return`
    //  inside a helper reads, to a scan of the function body, exactly like an
    //  early return before a hook. The heuristic was wrong about the danger
    //  and right about the shape, and the shape is worth keeping - hooks
    //  first, then everything that is merely a function.
    // ------------------------------------------------------------------
    const openOfferFor = (mail: Mail) =>
        mail.negotiationId
            ? offers.find(o => o.id === mail.negotiationId && o.status === 'open')
            : undefined;

    /**
     * A letter that is carrying something, so it costs a full swipe.
     *
     * ONLY THE UNPLAYED SCENE. A letter with an open negotiation on it is NOT
     * guarded, and that is the interesting half: the danger there was never
     * losing the letter, it was the offer staying `open` and locking the
     * company out of the game with the reason in a store the player cannot
     * see. `binMail` withdraws the approach, so throwing the reply away now
     * means what it looks like it means and needs no extra friction.
     */
    const isGuarded = (mail: Mail): boolean => !!mail.conversationId;

    const binMail = (mail: Mail) => {
        const offer = openOfferFor(mail);
        // Withdraw FIRST. If the delete somehow fails the player still has the
        // letter; if the withdrawal failed they would have neither the letter
        // nor the ability to write again, and nothing on screen to explain it.
        if (offer) withdrawOffer(offer.id);
        deleteMail(mail.id);
    };


    const filteredInbox = inbox.filter(m => 
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.fromName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.root}>
            <ScreenHeader title="Mail" onBack={() => navigation.goBack()} />

            <View style={styles.searchHeader}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search in mail"
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>ME</Text>
                </View>
            </View>

            <Text style={styles.inboxLabel}>PRIMARY</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: NAV_BAR_CLEARANCE }}>
                {filteredInbox.length === 0 ? (
                    <Text style={styles.empty}>Nothing in Primary.</Text>
                ) : (
                    filteredInbox.map(m => (
                        // `deleteMail` had been on the store since it was
                        // written, with nothing calling it.
                        <SwipeToDelete
                            key={m.id}
                            label={`"${m.subject}"`}
                            guarded={isGuarded(m)}
                            onDelete={() => binMail(m)}>
                            <MailRow
                                mail={m}
                                onPress={() => {
                                    markRead(m.id);
                                    navigation.navigate('MailDetail', { mailId: m.id });
                                }}
                            />
                        </SwipeToDelete>
                    ))
                )}
            </ScrollView>
            
            {/* The Compose FAB. It has been on this screen since before the
                mail app did anything, wired to an empty arrow function - a
                control that is drawn, styled, labelled and connected to
                nothing. It opens the offer composer now. */}
            <Pressable
                style={styles.fab}
                onPress={() => navigation.navigate('ComposeOffer')}>
                <View style={styles.fabIconWrap}>
                    <MaterialCommunityIcons name="pencil" size={22} color={theme.colors.brand} />
                </View>
                <Text style={styles.fabText}>Compose</Text>
            </Pressable>
        </View>
    );
};

export default MailScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    
    // Header & Search
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        height: 44,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        color: theme.colors.textPrimary,
        fontSize: 16,
    },
    avatarMini: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    avatarMiniText: { color: theme.colors.brand, fontSize: 10, fontWeight: '800' },
    
    inboxLabel: {
        color: theme.colors.brandMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    
    empty: {
        color: theme.colors.textMuted,
        fontSize: 15,
        textAlign: 'center',
        paddingVertical: 40,
    },

    // Row styles
    row: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        backgroundColor: theme.colors.background,
    },
    rowPressed: { backgroundColor: theme.colors.surface },
    avatarWrap: {
        marginRight: 16,
        paddingTop: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Black. Every avatar tint is a light fill and prefers it by at
    // least 10:1; white on them measured 1.45 to 2.03 - the whole avatar
    // column was below the floor and nothing reported it, because the fill
    // comes out of a function and the audit can only read tokens.
    avatarText: { color: theme.colors.onLight, fontWeight: '600', fontSize: 16 },
    
    // ------------------------------------------------------------------
    //  THE UNREAD BADGE IS TOBACCO, NOT RED
    // ------------------------------------------------------------------
    //  Red on a badge is the convention every phone uses, and it is the
    //  wrong convention here: this game keeps red for one sentence, "this is
    //  costing you", and a message you have not opened is not costing you
    //  anything. It was the last red in the app doing a job that was not
    //  that.
    //
    //  LIGHT tobacco with dark text. The dark tobacco was the obvious pick
    //  and does not survive measurement - 1.61 from the surface it sits on,
    //  so the badge would be a slightly warmer patch of the same darkness.
    //  A badge nobody notices is not a badge. See `unread` in core/theme.ts.
    // ------------------------------------------------------------------
    unreadIndicatorRow: {
        position: 'absolute',
        top: 0,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.unread,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    unreadIndicatorRowText: {
        color: theme.colors.onLight,
        fontSize: 10,
        fontWeight: '900',
    },

    rowBody: { flex: 1, justifyContent: 'center' },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    fromName: { color: theme.colors.textSecondary, fontSize: 16, flex: 1, marginRight: 8 },
    time: { color: theme.colors.textMuted, fontSize: 12 },
    subject: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 2 },
    preview: { color: theme.colors.textMuted, fontSize: 14 },
    
    textUnread: { fontWeight: '700', color: theme.colors.textPrimary },
    textUnreadTime: { fontWeight: '700', color: theme.colors.brand },
    
    // FAB
    fab: {
        position: 'absolute',
        bottom: NAV_BAR_CLEARANCE + 16,
        right: 16,
        backgroundColor: theme.colors.surfaceRaised,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 28,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    fabIconWrap: {
        marginRight: 8,
    },
    fabText: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
});
