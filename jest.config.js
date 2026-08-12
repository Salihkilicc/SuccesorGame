module.exports = {
    preset: 'react-native',
    setupFiles: ['<rootDir>/jest.setup.js'],
    // ------------------------------------------------------------------
    //  The navigation packages ship ES modules.
    // ------------------------------------------------------------------
    //  The react-native preset only transforms a fixed list of node_modules,
    //  and @react-navigation is not on it - so importing App died on
    //  "Cannot use import statement outside a module" before reaching a single
    //  line of this project's own code. That is why the app's only
    //  does-it-render test has never run.
    // ------------------------------------------------------------------
    transformIgnorePatterns: [
        'node_modules/(?!(' +
        'react-native' +
        '|@react-native' +
        '|@react-native-community' +
        '|@react-navigation' +
        '|react-native-.*' +
        ')/)',
    ],
};
