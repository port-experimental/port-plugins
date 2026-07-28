const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const path = require("path");
require("dotenv").config();

module.exports = (env, argv) => ({
  mode: argv.mode === "production" ? "production" : "development",

  entry: {
    ui: "./src/index.tsx",
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: { transpileOnly: true },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [["postcss-preset-env", {}]],
              },
            },
          },
        ],
      },
    ],
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: { ascii_only: true },
        },
      }),
    ],
    usedExports: true,
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "",
  },

  plugins: [
    // Replace process.env.* at compile time so the browser bundle never references `process`.
    new webpack.DefinePlugin({
      "process.env.PORT_TOKEN":        JSON.stringify(process.env.PORT_TOKEN        ?? ""),
      "process.env.PORT_API_BASE_URL": JSON.stringify(process.env.PORT_API_BASE_URL ?? ""),
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
      chunks: ["ui"],
      cache: false,
      inject: "body",
    }),
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),
  ],

  devServer: {
    compress: true,
    port: 9000,
    static: { directory: path.join(__dirname, "dist") },
  },
});
