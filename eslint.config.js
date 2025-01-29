module.exports = {
  parser: "@babel/eslint-parser", // Use Babel ESLint parser to support JSX
  parserOptions: {
    requireConfigFile: false, // Disable needing a config file (important for Babel)
    babelOptions: {
      presets: ["@babel/preset-env", "@babel/preset-react"],
    },
  },
  env: {
    browser: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended", // Enable recommended React rules (optional)
  ],
  plugins: ["react"], // Ensure React plugin is used (even if React isn't in the code)
  rules: {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "react/react-in-jsx-scope": "off", // Not needed for React 17+
    "react/jsx-uses-react": "off", // Not needed for React 17+
    "react/prop-types": "off", // Optional, if you're not using prop-types
  },
};
