/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(js|jsx|ts|tsx)', '**/*.(test|spec).(js|jsx|ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
