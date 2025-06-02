module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-proposal-decorators', {legacy: true}],
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-private-methods',
    '@babel/plugin-transform-private-property-in-object',
  ],
};
