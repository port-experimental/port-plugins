const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const path = require("path");

/**
 * When JS is inlined into <script>, a literal "</script>" inside a string
 * closes the HTML tag early and dumps the rest of the bundle as page text.
 * Escape those sequences inside script bodies only.
 */
class EscapeInlineScriptPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("EscapeInlineScriptPlugin", (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        "EscapeInlineScriptPlugin",
        (data, cb) => {
          data.html = data.html.replace(
            /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
            (_match, open, body, close) =>
              open + body.replace(/<\/script/gi, "<\\/script") + close
          );
          cb(null, data);
        }
      );
    });
  }
}

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    mode: isProd ? "production" : "development",

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
          exclude: /node_modules/,
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
        // Don't run postcss-preset-env on AnchorUI's prebuilt CSS — it breaks
        // modern selectors and makes components look unstyled / broken.
        {
          test: /\.css$/,
          include: /node_modules/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|gif|webp|svg)$/,
          type: "asset/inline",
        },
        // @port-labs/anchor-ui CodeBlock ships a Vite-style `*.wasm?url` import.
        {
          test: /\.wasm$/,
          type: "asset/inline",
        },
      ],
    },

    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            output: { ascii_only: true },
          },
        }),
      ],
      usedExports: true,
      splitChunks: false,
      runtimeChunk: false,
    },

    resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"] },

    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "",
      // Clean broken early-</script> cases if any slip through.
      environment: { arrowFunction: true },
    },

    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        filename: "index.html",
        chunks: ["ui"],
        cache: false,
        inject: "body",
      }),
      // Inline only for Port upload (single-file HTML). Dev server uses a
      // normal <script src> so dependency strings can't break the page.
      ...(isProd
        ? [
            new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),
            new EscapeInlineScriptPlugin(),
          ]
        : []),
    ],

    devtool: isProd ? false : "eval-cheap-module-source-map",

    devServer: {
      compress: true,
      port: 9000,
      hot: true,
      historyApiFallback: true,
      static: { directory: path.join(__dirname, "dist") },
    },
  };
};
