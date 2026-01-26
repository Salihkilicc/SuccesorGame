import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  NavigatorScreenParams,
  createNavigationContainerRef,
} from '@react-navigation/native';
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
  StockDetailScreen,
  CasinoScreen,
  HomeScreen,
  ShoppingScreen,
  ShopDetailScreen,
  ProductsScreen,
  TechTreeScreen,
  EducationScreen, // Kept for safety if used elsewhere, but route updated
  EducationDashboard,
  EducationBrowseScreen,
  DNAScreen,
  ResearchScreen,
  FinancialReportScreen,
  BelongingsScreen,
} from '../screens';

import { formatScreenTitle } from '../core/utils';
import BottomStatsBar from '../components/common/BottomStatsBar';

export type LifeStackParamList = {
  LifeHome: undefined;
  Profile: undefined;
  Achievements: undefined;
  Education: undefined;
  EducationBrowse: undefined;
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
  Home: undefined;
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  MyCompany: undefined;
  Premium: undefined;
  Achievements: undefined;
  Casino: NavigatorScreenParams<CasinoStackParamList> | undefined;
  Products: undefined;
  Research: undefined;
  TechTree: undefined;
  FinancialReport: undefined;
};

const LifeStackNavigator = () => (
  <LifeStack.Navigator screenOptions={{ headerShown: false }}>
    <LifeStack.Screen name="LifeHome" component={LifeScreen} />
    {/* TODO: Restore these screens or create new ones */}
    {/* <LifeStack.Screen name="Profile" component={ProfileScreen} /> */}
    {/* <LifeStack.Screen name="Achievements" component={AchievementsScreen} /> */}
    <LifeStack.Screen name="Education" component={EducationDashboard} />
    <LifeStack.Screen name="EducationBrowse" component={EducationBrowseScreen} />
    <LifeStack.Screen name="DNA" component={DNAScreen} />
  </LifeStack.Navigator>
);

const LoveStackNavigator = () => (
  <LoveStack.Navigator screenOptions={{ headerShown: false }}>
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
  <AssetsStack.Navigator screenOptions={{ headerShown: false }}>
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
      options={{ title: 'Quarterly Financial Report' }}
    />

    <AssetsStack.Screen
      name="Shopping"
      component={ShoppingScreen}
      options={{ title: formatScreenTitle('Shopping') }}
    />
    <AssetsStack.Screen
      name="Belongings"
      component={BelongingsScreen}
      options={{ title: 'Asset Portfolio' }}
    />
    <AssetsStack.Screen
      name="ShopDetail"
      component={ShopDetailScreen}
      options={{ title: formatScreenTitle('Shop Detail') }}
    />
  </AssetsStack.Navigator >
);

const CasinoStackNavigator = () => (
  <CasinoStack.Navigator screenOptions={{ headerShown: false }}>
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

const RootNavigator = () => (
  <NavigationContainer ref={rootNavigationRef}>
    <View style={{ flex: 1 }}>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Home">
        <RootStack.Screen name="Home" component={HomeScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="MyCompany" component={MyCompanyScreen} />

        {/* ✅ PRODUCTS EKRANI ARTIK ROOT'TA */}
        <RootStack.Screen name="Products" component={ProductsScreen} />
        {/* ✅ RESEARCH EKRANI DE ARTIK ROOT'TA */}
        <RootStack.Screen name="Research" component={ResearchScreen} />
        <RootStack.Screen
          name="TechTree"
          component={TechTreeScreen}
          options={{ title: 'Innovation Tech Tree' }}
        />

        {/* <RootStack.Screen name="Premium" component={PremiumScreen} /> */}
        {/* <RootStack.Screen name="Achievements" component={AchievementsScreen} /> */}
        <RootStack.Screen name="Casino" component={CasinoStackNavigator} />
        <RootStack.Screen
          name="FinancialReport"
          component={FinancialReportScreen}
          options={{ title: 'Quarterly Financial Report' }}
        />
      </RootStack.Navigator>
      <BottomStatsBar
        onHomePress={() => {
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.navigate('Home');
          }
        }}
      />
    </View>
  </NavigationContainer>
);

export default RootNavigator;