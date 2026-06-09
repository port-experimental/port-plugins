const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: { ui: './src/index.tsx' },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
      publicPath: '',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          use: [{ loader: 'url-loader', options: { limit: Infinity } }],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
      }),
      ...(isProd ? [new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/])] : []),
    ],
    optimization: isProd
      ? {
          minimizer: [
            new TerserPlugin({
              terserOptions: { output: { ascii_only: true } },
            }),
          ],
          usedExports: true,
        }
      : {},
    devServer: {
      port: 9000,
      compress: true,
      static: path.resolve(__dirname, 'dist'),
      hot: true,
    },
    devtool: isProd ? false : 'eval-source-map',
  };
};
