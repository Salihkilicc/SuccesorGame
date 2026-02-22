import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
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

import UnderworldScreen from '../features/life/screens/UnderworldScreen';

import StockDetailScreen from '../features/assets/screens/StockDetailScreen';

import { formatScreenTitle } from '../core/utils';

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
  Home: NavigatorScreenParams<SwipeTabParamList> | undefined;
  Premium: undefined;
  Achievements: undefined;
  Casino: NavigatorScreenParams<CasinoStackParamList> | undefined;
  Products: undefined;
  Research: undefined;
  TechTree: undefined;
  FinancialReport: undefined;
  Assets: NavigatorScreenParams<AssetsStackParamList>;
  Love: undefined;
  DNA: undefined;
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
    }}
  >
    <SwipeTab.Screen name="Life" component={LifeScreen} />
    <SwipeTab.Screen name="Home" component={HomeScreen} />
    <SwipeTab.Screen name="Underworld" component={UnderworldScreen} />
    <SwipeTab.Screen name="MyCompany" component={MyCompanyScreen} />
  </SwipeTab.Navigator>
);

const RootNavigator = () => {
  const [currentRouteName, setCurrentRouteName] = React.useState<string | undefined>();

  return (
    <NavigationContainer
      ref={rootNavigationRef}
      onStateChange={() => {
        setCurrentRouteName(rootNavigationRef.getCurrentRoute()?.name);
      }}>
      <View style={{ flex: 1 }}>
        <RootStack.Navigator
          screenOptions={{ headerShown: false }}
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
          <RootStack.Screen name="Assets" component={AssetsStackNavigator} />
          <RootStack.Screen name="Love" component={LoveScreen} />
          <RootStack.Screen
            name="FinancialReport"
            component={FinancialReportScreen}
            options={{ title: 'Quarterly Financial Report' }}
          />
        </RootStack.Navigator>

      </View>
    </NavigationContainer>
  );
};

export default RootNavigator;