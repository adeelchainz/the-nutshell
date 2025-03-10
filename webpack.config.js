const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  mode: "development", // Set mode to development
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true, // Cleans old files in dist
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, "dist"),
    port: 3000, // Change port if needed
    hot: true, // Enable Hot Module Replacement
    open: true, // Auto-open browser
    historyApiFallback: true, // Support for React Router
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html", // Ensure this file exists
    }),
    new webpack.HotModuleReplacementPlugin(), // Enable HMR
  ],
  devtool: "source-map", // Enable source maps for better debugging
};
