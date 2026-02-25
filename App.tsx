import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  useEffect(() => {
    const hideSplash = async () => {
      await BootSplash.hide({ fade: true });
    };
    hideSplash();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </>
  );
};

export default App;
