import { AppRegistry, LogBox } from 'react-native';
import App from './App';

LogBox.ignoreLogs([
    'MMKV Failed to Initialize',
    'Failed to create a new MMKV instance'
]);

AppRegistry.registerComponent('Succesor', () => App);