module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "nativewind/babel"],
    plugins: [
      "react-native-reanimated/plugin",
      "@babel/plugin-proposal-export-namespace-from",
      [
        "@babel/plugin-transform-react-jsx",
        { runtime: "automatic", importSource: "nativewind" },
      ],
    ],
  };
};
