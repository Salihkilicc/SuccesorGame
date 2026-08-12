// jest.setup.js
//
// ============================================================================
//  THE NATIVE PIECES, STUBBED ONCE
// ============================================================================
//
//  Two test files were red for months and neither was failing. App.test.tsx -
//  the template's "does it render at all" smoke test - could not even load,
//  because importing App reaches native modules that do not exist in Node.
//  So `npm test` was red, and a red suite that is red for reasons nobody
//  intends is a suite people stop reading. That is the actual cost: the two
//  broken files were hiding the signal from the twelve working ones.
//
//  Worth having rather than deleting. The safe-area crash reported by
//  screenshot earlier - "No safe area value available" - was exactly a
//  does-it-render failure, caught by a person on a device instead of by this.
// ============================================================================



jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => {}),
        removeItem: jest.fn(async () => {}),
        clear: jest.fn(async () => {}),
        getAllKeys: jest.fn(async () => []),
        multiRemove: jest.fn(async () => {}),
    },
}));

jest.mock('react-native-bootsplash', () => ({
    __esModule: true,
    default: {
        hide: jest.fn(async () => {}),
        isVisible: jest.fn(async () => false),
    },
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('@react-native-community/blur', () => ({ BlurView: 'BlurView' }));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Geolocation reaches for a native event emitter at import time. It arrives
// through the weather screen, which is part of the shelved life module and is
// still in the navigator.
jest.mock('@react-native-community/geolocation', () => ({
    __esModule: true,
    default: {
        getCurrentPosition: jest.fn(),
        watchPosition: jest.fn(),
        clearWatch: jest.fn(),
        setRNConfiguration: jest.fn(),
    },
}));
