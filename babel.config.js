// babel.config.js
module.exports = {
  presets: [
    "@babel/preset-env",
    [
      "@babel/preset-react",
      {
        // This tells Babel to use your custom JSX transform
        // instead of React.createElement
        pragma: "jsx",
        pragmaFrag: "Fragment",
      },
    ],
  ],
};
