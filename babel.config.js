module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: { '@': './src' },
        extensions: ['.js', '.jsx', '.json'],
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
