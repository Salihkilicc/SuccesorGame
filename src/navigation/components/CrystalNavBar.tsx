import React, { useState } from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';
import { jumpToCompany, jumpToTab } from '../jumpToCompany';
import { rootNavigationRef } from '../navigationRef';
import { useStatsStore, usePlayerStore } from '../../core/store';
import { FEATURES } from '../../core/featureFlags';
import UnreadBadge from '../../components/common/UnreadBadge';
import { useMessageStore, unreadCount } from '../../core/store/useMessageStore';
import { formatMoney } from '../../core/utils';

const { width } = Dimensions.get('window');

// ===========================================================================
//  THE BAR'S GEOMETRY, IN ONE PLACE, BECAUSE TWO PLACES WAS THE BUG
// ===========================================================================
//  These five numbers used to be literals scattered through the stylesheet
//  and a hand-added "roughly 78" in the clearance below. The old comment says
//  what that cost: the gap under Finance's buttons was wrong three times
//  running, because resizing the bar and updating the number screens use to
//  clear it were two separate acts and the second one kept being forgotten.
//
//  Named here and read by both the styles and the clearance, so the bar
//  cannot grow without the space under it growing with it.
// ===========================================================================

/** How far the bar floats off the bottom edge. */
const BAR_LIFT = Platform.OS === 'ios' ? 44 : 32;

/** Breathing room inside the bar, above the icon and below the label. */
const BAR_PAD_V = 20;

/** The glyph, and the word under it. */
const BAR_ICON = 28;
const BAR_LABEL = 11;
const BAR_LABEL_GAP = 4;

/** What the bar actually measures, derived rather than estimated. */
const BAR_HEIGHT =
    BAR_PAD_V * 2 + BAR_ICON + BAR_LABEL_GAP + Math.round(BAR_LABEL * 1.3);

/**
 * How much room the floating bar takes at the bottom of every screen.
 *
 * Screens that end in a button need to clear it, and every one of them was
 * guessing a number. One constant, derived from the bar's own geometry, plus
 * eight points so a button does not sit flush against it.
 */
export const NAV_BAR_CLEARANCE = BAR_LIFT + BAR_HEIGHT + 8;

interface CrystalNavBarProps {
    activeTab: NavTab;
    variant: 'light' | 'dark';
    hideDots?: boolean;
    onTabPress?: (targetScreen: string) => void;
}

/**
 * Swipe sekmelerinin sırası — SwipeNavigator ile birebir aynı olmalı.
 * Pagination dot'ları bu listeden türetilir, elle sayılmaz.
 * (bkz. RootNavigator > SwipeNavigator)
 */
const SWIPE_TABS: Array<{ key: string; feature?: keyof typeof FEATURES }> = [
    { key: 'Life', feature: 'life' },
    { key: 'Home' },
    { key: 'Underworld', feature: 'underworld' },
    { key: 'Company' },
];

const ACTIVE_SWIPE_TABS = SWIPE_TABS.filter(t => !t.feature || FEATURES[t.feature]);

/** Alt bardaki eylem sekmeleri. Kapalı modüller hiç render edilmez. */
const NAV_ITEMS: Array<{
    key: string;
    label: string;
    icon: string;
    target: string;
    activeFor: string;
    feature?: keyof typeof FEATURES;
}> = [
        { key: 'home', get label() { return t('nav.home'); }, icon: 'home-outline', target: 'Home', activeFor: 'Home' },
        // ------------------------------------------------------------------
        //  MESSAGES TOOK THE STATS SLOT
        // ------------------------------------------------------------------
        //  Stats opened an inline strip showing cash, net worth and the share
        //  price - three numbers that are already on My Company, one tap away,
        //  with their context attached. A permanent slot for a duplicate is
        //  the most expensive kind of duplicate, because the bar has four.
        //
        //  Messages earns the slot for the opposite reason: it is the only
        //  thing in the app that can want you before you want it. A tab with
        //  a badge is how you find out.
        //
        //  SHELVED, not deleted: the stats strip below is still built and
        //  `setIsStatsMode` still works, so restoring it is one line here.
        // ------------------------------------------------------------------
        { key: 'messages', get label() { return t('nav.messages'); }, icon: 'message-text-outline', target: 'Messages', activeFor: 'Messages' },
        // { key: 'stats', get label() { return t('nav.stats'); }, icon: 'chart-bar', target: 'stats', activeFor: '' },
        // Contacts (ilişkiler) rafa kaldırıldı; yerini şirket aldı.
        // SHELVED: Contacts. It opened the Love screen, which is shelved -
        // the relationship system is inside Profile now, and Profile has its
        // own item two rows down. Two ways into one screen is one too many.
        // { key: 'contacts', get label() { return t('nav.contacts'); }, icon: 'account-group-outline', target: 'Contacts', activeFor: 'Love', feature: 'love' },
        { key: 'company', get label() { return t('nav.company'); }, icon: 'office-building-outline', target: 'Company', activeFor: 'Company' },
        { key: 'profile', get label() { return t('nav.profile'); }, icon: 'account-outline', target: 'Profile', activeFor: 'Profile' },
    ];

const ACTIVE_NAV_ITEMS = NAV_ITEMS.filter(i => !i.feature || FEATURES[i.feature]);

/**
 * The four the bar can actually light.
 *
 * ---------------------------------------------------------------------------
 *  IT WAS 'Life' | 'Home' | 'Company' | 'Love' AND NONE OF THAT WAS TRUE
 * ---------------------------------------------------------------------------
 *  The bar's items are Home, Messages, Company and Profile. The type it was
 *  handed listed Life and Love, which no item has claimed since Contacts was
 *  shelved, and did NOT list Messages or Profile, which two of the four items
 *  answer to.
 *
 *  So `navTabFor` had nothing to return for either of them and they fell to
 *  its default: standing in Messages lit HOME. Reported as exactly that.
 *  Profile was worse and quieter - it mapped to 'Life', which nothing lights,
 *  so the bar showed no tab at all and nobody noticed, because a bar with
 *  nothing lit reads as a bar you have not looked at.
 *
 *  Exported so the mapping and the items cannot drift again, and so the test
 *  alongside can walk one against the other.
 */
export type NavTab = 'Home' | 'Messages' | 'Company' | 'Profile';

const CrystalNavBar: React.FC<CrystalNavBarProps> = ({ activeTab, variant, hideDots, onTabPress }) => {
    const navigation = useNavigation<any>();
    const [isStatsMode, setIsStatsMode] = useState(false);

    // Only the MESSAGE count. Mail has its own badge on its own tile - see
    // the note on UnreadBadge: merging them would report "four things"
    // without saying which room they are in.
    const unreadMessages = useMessageStore(s => unreadCount(s.threads));

    // Stores
    const userMoney = useStatsStore(state => state.money);
    const { core: playerCore, attributes: playerAttributes } = usePlayerStore();

    const navigateTo = (screen: string) => {
        setIsStatsMode(false);
        if (onTabPress) {
            onTabPress(screen);
        }
        if (screen === 'Company') {
            // ------------------------------------------------------------------
            //  MyCompany IS NOT A ROOT ROUTE, SO IT IS ADDRESSED DIRECTLY
            // ------------------------------------------------------------------
            //  SHELVED: `navigation.navigate('Home', { screen: 'MyCompany' })`.
            //
            //  That is the documented form and it does work FROM SOMEWHERE
            //  ELSE: from Messages it switches the stack to Home and hands
            //  the nested action down on the way.
            //
            //  From HOME it does nothing, because RootStack is already on
            //  Home and a navigate to the route you are already on never
            //  reaches the child navigator. Which is the case this bar is in
            //  most of the time.
            //
            //  navigation/jumpToCompany.ts aims the action at the swipe
            //  navigator by key instead, so RootStack is never asked.
            // ------------------------------------------------------------------
            jumpToCompany(rootNavigationRef);
        } else if (screen === 'Home') {
            // ------------------------------------------------------------------
            //  AND HOME HAS THE SAME FAULT, IN THE OTHER DIRECTION
            // ------------------------------------------------------------------
            //  SHELVED: it fell through to `navigation.navigate('Home')`.
            //
            //  Which did nothing when the player was on another swipe tab,
            //  for exactly the reason above: RootStack is already on its Home
            //  route, and a navigate to the route you are already on never
            //  reaches the child navigator. Pressing HOME from My Company
            //  left you on My Company.
            //
            //  It went unreported because Home is where people start, so the
            //  button is usually pressed when it is already correct. The tab
            //  is `Dashboard` now - see the note in RootNavigator - and it is
            //  addressed the same way My Company is.
            // ------------------------------------------------------------------
            jumpToTab(rootNavigationRef, 'Dashboard');
        } else if (screen === 'Contacts') {
            // The item above is shelved so nothing reaches this, and the
            // route it navigated to no longer exists. Left as a guard rather
            // than removed: a stale target that silently does nothing is
            // better than one that throws on the bar visible on every screen.
            return;
        } else if (screen === 'Profile') {
            navigation.navigate('Profile');
        } else {
            navigation.navigate(screen);
        }
    };

    const isLight = variant === 'light';
    const blurType = isLight ? 'light' : 'dark';
    const containerStyle = isLight ? styles.lightContainer : styles.darkContainer;

    const getIconStyle = (tabName: string) => {
        const isActive = activeTab === tabName;
        return {
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
            fontSize: BAR_ICON,
            textShadowColor: 'rgba(28,36,44,0.5)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 3,
        };
    };

    const getLabelStyle = (tabName: string) => {
        const isActive = activeTab === tabName;
        return {
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
            fontSize: BAR_LABEL,
            fontWeight: '700' as '700',
            letterSpacing: 0.3,
            marginTop: BAR_LABEL_GAP,
            textAlign: 'center' as 'center',
        };
    };

    // Dot sayısı ve aktif index, açık swipe sekmelerinden türetilir.
    // Modül rafa kaldırıldığında dot'lar kendiliğinden azalır.
    const foundIndex = ACTIVE_SWIPE_TABS.findIndex(t => t.key === activeTab);
    const homeIndex = ACTIVE_SWIPE_TABS.findIndex(t => t.key === 'Home');
    const activeDotIndex = foundIndex >= 0 ? foundIndex : homeIndex;
    const dots = ACTIVE_SWIPE_TABS.map((_, i) => i);

    return (
        <>
            {/* Dimming Overlay */}
            {isStatsMode && (
                <Pressable
                    style={styles.statsOverlay}
                    onPress={() => setIsStatsMode(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(28,36,44,0.5)' }} />
                </Pressable>
            )}

            <View style={[styles.bottomBarContainer, { zIndex: 1000 }]}>
                {/* SHELVED: the pagination dots.
                    With the shelved modules off there are only two swipe tabs
                    left, so the dots were two marks that said almost nothing -
                    and the bar underneath already shows which tab is lit. */}

                <LinearGradient
                    colors={['rgba(5,168,246,0.5)', 'rgba(5,168,246,0.4)', 'rgba(5,168,246,0.4)', 'rgba(207,208,210,0.5)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    locations={[0, 0.2, 0.8, 1]}
                    style={styles.blurContainer}
                >
                    <BlurView
                        style={StyleSheet.absoluteFill}
                        blurType="dark"
                        blurAmount={8}
                        reducedTransparencyFallbackColor="black"
                    />
                    <View style={[styles.bottomBar, containerStyle]}>
                        {!isStatsMode ? (
                            <>
                                {ACTIVE_NAV_ITEMS.map(item => (
                                    <Pressable
                                        key={item.key}
                                        style={styles.bottomTab}
                                        onPress={() => (item.target === 'stats' ? setIsStatsMode(true) : navigateTo(item.target))}
                                    >
                                        {/* The badge floats over the icon, so
                                            it needs a box that does not stretch
                                            the tab. */}
                                        <View>
                                            <MaterialCommunityIcons name={item.icon} style={getIconStyle(item.activeFor)} />
                                            {item.key === 'messages' && <UnreadBadge count={unreadMessages} floating />}
                                        </View>
                                        <Text style={getLabelStyle(item.activeFor)}>{item.label}</Text>
                                    </Pressable>
                                ))}
                            </>
                        ) : (
                            <>
                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(false)}>
                                    <MaterialCommunityIcons name="cash" style={styles.statsIcon} />
                                    <Text style={styles.statsLabel}>{formatMoney(userMoney)}</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(false)}>
                                    <MaterialCommunityIcons name="heart-pulse" style={[styles.statsIcon, { color: theme.colors.success }]} />
                                    <Text style={styles.statsLabel}>{playerCore.health}%</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(false)}>
                                    <MaterialCommunityIcons name="brain" style={[styles.statsIcon, { color: theme.colors.danger }]} />
                                    <Text style={styles.statsLabel}>{playerCore.stress}%</Text>
                                </Pressable>

                                <Pressable style={styles.bottomTab} onPress={() => setIsStatsMode(false)}>
                                    <MaterialCommunityIcons name="diamond-stone" style={[styles.statsIcon, { color: theme.colors.textPrimary }]} />
                                    <Text style={styles.statsLabel}>{playerAttributes.charm}%</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </LinearGradient>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    statsOverlay: {
        position: 'absolute',
        top: -1000, // Cover the whole screen upwards
        bottom: -1000,
        left: -1000,
        right: -1000,
        zIndex: 998,
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: BAR_LIFT,
        left: 18,
        right: 18,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8, // Space between dots and bar
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 4,
        // Added subtle shadow for dots
        shadowColor: "#1C242C",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 2,
    },
    activeDot: {
        width: 18, // Elongated active dot (iOS style)
    },
    inactiveDot: {
        width: 6,  // Circular inactive dot
    },
    lightDot: {
        backgroundColor: '#FFFFFF',
        opacity: 0.9,
    },
    darkDot: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    blurContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        // ------------------------------------------------------------------
        //  A NARROWER GLOW, BECAUSE THIS ONE IS ON SCREEN ALWAYS
        // ------------------------------------------------------------------
        //  From the device log, on every render:
        //
        //      (ADVICE) BVLinearGradient has a shadow set but cannot
        //               calculate shadow efficiently.
        //
        //  iOS can cache a shadow when it knows the layer is opaque. This bar
        //  is deliberately glass - all four gradient stops are between 0.4 and
        //  0.5 alpha - so it cannot be given a background colour without
        //  taking the effect away, which is the one fix that would have been
        //  free elsewhere. See the app tiles in HomeScreen for that version.
        //
        //  What is left is the RADIUS. The blur is recomputed from the alpha
        //  mask every frame and the work scales with how far it spreads, so 20
        //  is the expensive part rather than the shadow existing. Eight keeps
        //  a glow and costs a fraction of it.
        //
        //  This is the one uncached shadow that is drawn on every screen in
        //  the game rather than on one of them.
        // ------------------------------------------------------------------
        shadowColor: "#CFD0D2",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'transparent',
    },
    bottomBar: {
        flexDirection: 'row',
        width: '100%',
        paddingVertical: BAR_PAD_V,
        paddingHorizontal: 16,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    lightContainer: {
        backgroundColor: 'transparent',
    },
    darkContainer: {
        backgroundColor: 'transparent',
    },
    bottomTab: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    statsIcon: {
        fontSize: BAR_ICON - 2,
        color: '#FFFFFF',
        textShadowColor: 'rgba(28,36,44,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    statsLabel: {
        color: '#FFFFFF',
        fontSize: BAR_LABEL,
        fontWeight: '700',
        letterSpacing: 0.3,
        marginTop: BAR_LABEL_GAP,
        textAlign: 'center',
    },
});

export default CrystalNavBar;
