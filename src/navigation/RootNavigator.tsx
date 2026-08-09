import React from 'react';
import { t, useLocale } from '../core/i18n';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  NavigationContainer,
  NavigatorScreenParams,
  createNavigationContainerRef,
  DarkTheme,
} from '@react-navigation/native';

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#1C242C',
    card: '#1C242C',
  },
};
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AssetsScreen,
  LifeScreen,
  LoveScreen,
  MarketScreen,
  MyCompanyScreen,
  SlotsGameScreen,
  RouletteGameScreen,
  PokerGameScreen,
  BlackjackGameScreen,
  CasinoScreen,
  HomeScreen,
  ShoppingScreen,
  ShopDetailScreen,
  ProductsScreen,
  TechTreeScreen,
  DNAScreen,
  ResearchScreen,
  FinancialReportScreen,
  BelongingsScreen,
} from '../screens';

import UnderworldScreen from '../features/life/screens/UnderworldScreen';

import StockDetailScreen from '../features/assets/screens/StockDetailScreen';

import { formatScreenTitle } from '../core/utils';
import { FEATURES } from '../core/featureFlags';

// Import New Full Screens
import GymScreen from '../features/life/screens/GymScreen';
import SanctuaryScreen from '../features/life/screens/SanctuaryScreen';
import TravelScreen from '../features/life/screens/TravelScreen';
import BlackMarketScreen from '../features/life/screens/BlackMarketScreen';
import NightOutScreen from '../features/life/screens/NightOutScreen';
import EducationScreen from '../features/life/screens/EducationScreen';
import WeatherScreen from '../features/life/screens/WeatherScreen';
import CalendarScreen from '../features/life/screens/CalendarScreen';
import NotesScreen from '../features/os/screens/NotesScreen';
import SettingsScreen from '../features/os/screens/SettingsScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import CrystalNavBar from './components/CrystalNavBar';
import {
  BoardMembersScreen, TeamMoraleScreen, FinanceScreen,
  MyEmpireScreen, HostileTakeoverScreen, StockMarketScreen,
  BorrowLoanScreen, RepayDebtScreen,
  CapitalInjectionScreen, SharkDealScreen,
} from '../features/assets/screens/CompanyScreens';
import { theme } from '../core/theme';

/**
 * Which swipe tab the bar should highlight for a given route.
 *
 * The company screens are pushed on top of the Company tab, so they keep it
 * lit rather than dropping the highlight the moment you open a detail page.
 */
const COMPANY_ROUTES = new Set([
    'MyCompany', 'Products', 'Research', 'TechTree', 'Assets', 'FinancialReport',
    'BoardMembers', 'TeamMorale', 'Finance', 'MyEmpire', 'HostileTakeover', 'StockMarket',
    'BorrowLoan', 'RepayDebt',
]);

const navTabFor = (route?: string): 'Life' | 'Home' | 'Company' | 'Love' => {
    if (!route) return 'Home';
    if (COMPANY_ROUTES.has(route)) return 'Company';
    if (route === 'Life' || route === 'LifeHome') return 'Life';
    if (route === 'Love' || route === 'LoveHome') return 'Love';
    return 'Home';
};

export type LifeStackParamList = {
  LifeHome: undefined;
  Profile: undefined;
  Achievements: undefined;
  DNA: undefined;
};

// ... existing code ...

export type LoveStackParamList = {
  LoveHome: undefined;
};

export type AssetsStackParamList = {
  AssetsHome: undefined;
  Market: undefined;
  MyCompany: undefined;
  Premium: undefined;
  Shopping: undefined;
  ShopDetail: {
    shopId: string;
  };
  StockDetail: {
    symbol: string;
    price: number;
    change: number;
    category?: string;
  };
  FinancialReport: undefined;
  Belongings: undefined;
};

export type CasinoStackParamList = {
  CasinoLobby: undefined;
  SlotsGame: {
    variant: 'street_fighter' | 'poseidon' | 'high_roller';
    betAmount?: number;
  };
  RouletteGame: {
    betAmount?: number;
  };
  PokerGame: {
    betAmount?: number;
  };
  BlackjackGame: {
    betAmount?: number;
  };
};

export type RootTabParamList = {
  Life: NavigatorScreenParams<LifeStackParamList>;
  Love: NavigatorScreenParams<LoveStackParamList>;
  Assets: NavigatorScreenParams<AssetsStackParamList>;
};

export type RootStackParamList = {
  Home: NavigatorScreenParams<SwipeTabParamList> | undefined;
  Premium: undefined;
  Achievements: undefined;
  Casino: NavigatorScreenParams<CasinoStackParamList> | undefined;
  Products: undefined;
  Research: undefined;
  // The company sections - routes now, not popups.
  BoardMembers: undefined;
  TeamMorale: undefined;
  Finance: undefined;
  MyEmpire: undefined;
  HostileTakeover: undefined;
  StockMarket: { onOpenIPO?: () => void } | undefined;
  BorrowLoan: undefined;
  RepayDebt: undefined;
  CapitalInjection: undefined;
  SharkDeal: undefined;
  TechTree: undefined;
  FinancialReport: undefined;
  Assets: NavigatorScreenParams<AssetsStackParamList>;
  Love: undefined;
  DNA: undefined;
  Gym: undefined;
  Sanctuary: undefined;
  Travel: undefined;
  BlackMarket: undefined;
  NightOut: undefined;
  Education: undefined;
  Weather: undefined;
  Calendar: undefined;
  Notes: undefined;
  Settings: undefined;
  Profile: undefined;
};

const LifeStackNavigator = () => (
  <LifeStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#434B50' } }}>
    <LifeStack.Screen name="LifeHome" component={LifeScreen} />
    {/* TODO: Restore these screens or create new ones */}
    {/* <LifeStack.Screen name="Profile" component={ProfileScreen} /> */}
    {/* <LifeStack.Screen name="Achievements" component={AchievementsScreen} /> */}
    <LifeStack.Screen name="DNA" component={DNAScreen} />
  </LifeStack.Navigator>
);

const LoveStackNavigator = () => (
  <LoveStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#434B50' } }}>
    <LoveStack.Screen name="LoveHome" component={LoveScreen} />
  </LoveStack.Navigator>
);

const Tab = createBottomTabNavigator<RootTabParamList>();
const LifeStack = createNativeStackNavigator<LifeStackParamList>();
const LoveStack = createNativeStackNavigator<LoveStackParamList>();
const AssetsStack = createNativeStackNavigator<AssetsStackParamList>();
const CasinoStack = createNativeStackNavigator<CasinoStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

const AssetsStackNavigator = () => (
  <AssetsStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#434B50' } }}>
    <AssetsStack.Screen
      name="AssetsHome"
      component={AssetsScreen}
      options={{ title: formatScreenTitle('Assets') }}
    />
    <AssetsStack.Screen
      name="Market"
      component={MarketScreen}
      options={{ title: formatScreenTitle('Market') }}
    />
    <AssetsStack.Screen
      name="MyCompany"
      component={MyCompanyScreen}
      options={{ title: formatScreenTitle('My Company') }}
    />
    <AssetsStack.Screen
      name="StockDetail"
      component={StockDetailScreen}
      options={{ title: formatScreenTitle('Stock Detail') }}
    />
    <AssetsStack.Screen
      name="FinancialReport"
      component={FinancialReportScreen}
      options={{ title: t('nav.quarterlyFinancialReport') }}
    />

    {/* --- RAFA KALDIRILDI: lüks tüketim --- */}
    {FEATURES.shopping ? (
      <AssetsStack.Screen
        name="Shopping"
        component={ShoppingScreen}
        options={{ title: formatScreenTitle('Shopping') }}
      />
    ) : null}
    {FEATURES.belongings ? (
      <AssetsStack.Screen
        name="Belongings"
        component={BelongingsScreen}
        options={{ title: t('nav.assetPortfolio') }}
      />
    ) : null}
    {FEATURES.shopping ? (
      <AssetsStack.Screen
        name="ShopDetail"
        component={ShopDetailScreen}
        options={{ title: formatScreenTitle('Shop Detail') }}
      />
    ) : null}
  </AssetsStack.Navigator >
);

const CasinoStackNavigator = () => (
  <CasinoStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#434B50' } }}>
    <CasinoStack.Screen
      name="CasinoLobby"
      component={CasinoScreen}
      options={{ title: formatScreenTitle('Casino') }}
    />
    <CasinoStack.Screen
      name="SlotsGame"
      component={SlotsGameScreen}
      options={{ title: formatScreenTitle('Slots Game') }}
    />
    <CasinoStack.Screen
      name="RouletteGame"
      component={RouletteGameScreen}
      options={{ title: formatScreenTitle('Roulette Game') }}
    />
    <CasinoStack.Screen
      name="PokerGame"
      component={PokerGameScreen}
      options={{ title: formatScreenTitle('Poker Game') }}
    />
    <CasinoStack.Screen
      name="BlackjackGame"
      component={BlackjackGameScreen}
      options={{ title: formatScreenTitle('Blackjack Game') }}
    />
  </CasinoStack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { display: 'none' },
    }}>
    <Tab.Screen
      name="Life"
      component={LifeStackNavigator}
      options={{
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🎭</Text>,
      }}
    />
    <Tab.Screen
      name="Love"
      component={LoveStackNavigator}
      options={{
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>❤️</Text>,
      }}
    />
    <Tab.Screen
      name="Assets"
      component={AssetsStackNavigator}
      options={{
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>💼</Text>,
      }}
    />
  </Tab.Navigator>
);

const SwipeTab = createMaterialTopTabNavigator();

export type SwipeTabParamList = {
  Life: undefined;
  Home: undefined;
  Underworld: undefined;
  MyCompany: undefined;
};

const SwipeNavigator = () => (
  <SwipeTab.Navigator
    initialRouteName="Home"
    tabBarPosition="top"
    screenOptions={{
      tabBarStyle: { display: 'none' },
      swipeEnabled: true,
      lazy: true,
      sceneStyle: { backgroundColor: '#434B50' },
    }}
  >
    {/* --- RAFA KALDIRILDI: lifestyle hub'ı --- */}
    {FEATURES.life ? <SwipeTab.Screen name="Life" component={LifeScreen} /> : null}
    <SwipeTab.Screen name="Home" component={HomeScreen} />
    {/* --- RAFA KALDIRILDI: underworld hub'ı --- */}
    {FEATURES.underworld ? <SwipeTab.Screen name="Underworld" component={UnderworldScreen} /> : null}
    <SwipeTab.Screen name="MyCompany" component={MyCompanyScreen} />
  </SwipeTab.Navigator>
);

const RootNavigator = () => {
  const [currentRouteName, setCurrentRouteName] = React.useState<string | undefined>();

  return (
    <NavigationContainer
      ref={rootNavigationRef}
      theme={AppDarkTheme}
      onStateChange={() => {
        setCurrentRouteName(rootNavigationRef.getCurrentRoute()?.name);
      }}>
      <View style={{ flex: 1 }}>
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            // ----------------------------------------------------------------
            //  ONE DIRECTION FOR EVERYTHING
            // ----------------------------------------------------------------
            //  Products slid in from the right while My Empire, the stock
            //  market and the takeover screen came up from the bottom, because
            //  those were Modals and Products was a screen. Two different
            //  gestures for the same kind of navigation is what made the app
            //  feel like separate pieces bolted together. Everything pushes
            //  from the right now.
            // ----------------------------------------------------------------
            animation: 'slide_from_right',
          }}
          initialRouteName="Home">
          <RootStack.Screen name="Home" component={SwipeNavigator} />
          {/* MainTabs removed as we are replaced by SwipeNavigator on 'Home' */}

          {/* <RootStack.Screen name="MainTabs" component={MainTabs} /> */}

          {/* Removed separate MyCompany as it is now in SwipeNavigator, but keeping it in RootStack might be needed if navigated to directly as a stack screen? 
              User said: "RootStack -> SwipeNavigator (Home) -> Diğer detay sayfaları"
              If MyCompany is in SwipeNavigator, we don't necessarily need it in RootStack unless we want it to be pushable over tabs. The user instructions imply swipe navigation is the main way.
              However, keeping it in RootStack doesn't hurt if we don't navigate to it. 
              But duplicate routes can be an issue if keys collide.
              Let's comment out MyCompany in RootStack for now as it's in SwipeNavigator.
          */}
          {/* <RootStack.Screen name="MyCompany" component={MyCompanyScreen} /> */}

          {/* ✅ PRODUCTS EKRANI ARTIK ROOT'TA */}
          <RootStack.Screen name="Products" component={ProductsScreen} />

          {/* The company sections are routes, not popups - see
              features/assets/screens/CompanyScreens.tsx */}
          <RootStack.Screen name="BoardMembers" component={BoardMembersScreen} />
          <RootStack.Screen name="TeamMorale" component={TeamMoraleScreen} />
          <RootStack.Screen name="Finance" component={FinanceScreen} />
          <RootStack.Screen name="MyEmpire" component={MyEmpireScreen} />
          <RootStack.Screen name="HostileTakeover" component={HostileTakeoverScreen} />
          <RootStack.Screen name="StockMarket" component={StockMarketScreen} />
          <RootStack.Screen name="BorrowLoan" component={BorrowLoanScreen} />
          <RootStack.Screen name="RepayDebt" component={RepayDebtScreen} />
          <RootStack.Screen name="CapitalInjection" component={CapitalInjectionScreen} />
          <RootStack.Screen name="SharkDeal" component={SharkDealScreen} />
          {/* ✅ RESEARCH EKRANI DE ARTIK ROOT'TA */}
          <RootStack.Screen name="Research" component={ResearchScreen} />
          <RootStack.Screen
            name="TechTree"
            component={TechTreeScreen}
            options={{ title: t('nav.innovationTechTree') }}
          />

          {/* <RootStack.Screen name="Premium" component={PremiumScreen} /> */}
          {/* <RootStack.Screen name="Achievements" component={AchievementsScreen} /> */}
          {/* --- RAFA KALDIRILDI: kumarhane --- */}
          {FEATURES.casino ? <RootStack.Screen name="Casino" component={CasinoStackNavigator} /> : null}
          <RootStack.Screen name="Assets" component={AssetsStackNavigator} />
          {/* --- RAFA KALDIRILDI: ilişkiler (stakeholder management olarak dönecek) --- */}
          {FEATURES.love ? <RootStack.Screen name="Love" component={LoveScreen} /> : null}
          {/* --- RAFA KALDIRILDI: karakter statları --- */}
          {FEATURES.dna ? <RootStack.Screen name="DNA" component={DNAScreen} /> : null}
          <RootStack.Screen
            name="FinancialReport"
            component={FinancialReportScreen}
            options={{ title: t('nav.quarterlyFinancialReport') }}
          />

          {/* --- RAFA KALDIRILDI: lifestyle ekranları --- */}
          {FEATURES.gym ? <RootStack.Screen name="Gym" component={GymScreen} /> : null}
          {FEATURES.sanctuary ? <RootStack.Screen name="Sanctuary" component={SanctuaryScreen} /> : null}
          {FEATURES.travel ? <RootStack.Screen name="Travel" component={TravelScreen} /> : null}
          {FEATURES.blackMarket ? <RootStack.Screen name="BlackMarket" component={BlackMarketScreen} /> : null}
          {FEATURES.nightOut ? <RootStack.Screen name="NightOut" component={NightOutScreen} /> : null}
          {FEATURES.weather ? <RootStack.Screen name="Weather" component={WeatherScreen} /> : null}

          {/* --- AKTİF: MBA / executive education --- */}
          {FEATURES.education ? <RootStack.Screen name="Education" component={EducationScreen} /> : null}

          {/* --- AKTİF: OS kabuğu --- */}
          <RootStack.Screen name="Calendar" component={CalendarScreen} />
          <RootStack.Screen name="Notes" component={NotesScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
          <RootStack.Screen name="Profile" component={ProfileScreen} />
        </RootStack.Navigator>

        {/* --------------------------------------------------------------
            ONE NAV BAR, RENDERED ONCE
            --------------------------------------------------------------
            44 files used to render their own CrystalNavBar. The bar is
            positioned absolutely, so "the bottom" meant the bottom of
            whatever that screen happened to wrap it in - a SafeAreaView on
            one screen, a plain View on another, a modal on a third. That is
            why it drifted between screens, and why on some screens (My
            Empire among them) it was drawn but sat outside the touchable
            area and did nothing.

            Rendered here it is absolute against the window, so it is in the
            same place on every screen by construction rather than by each
            screen remembering to place it correctly.
           -------------------------------------------------------------- */}
        <CrystalNavBar activeTab={navTabFor(currentRouteName)} variant="dark" />
      </View>
    </NavigationContainer>
  );
};

export default RootNavigator;