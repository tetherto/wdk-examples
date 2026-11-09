const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',

  entry: {
    background: ['./src/background/polyfills.js', './src/background/index.js'],
    content: './src/content/index.js',
    'popup-qr': './src/popup/qr-bundle.js',
    escrow: './escrow-app/main.js',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) =>
      pathData.chunk?.name === 'escrow' ? 'escrow/escrow.js' : '[name].js',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { chrome: '100' },
                modules: false,
              }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ]
  },

  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /^sodium-native$/,
      'sodium-javascript'
    ),
    new webpack.IgnorePlugin({ resourceRegExp: /@mempool\/electrum-client/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /^ledger-bitcoin$/ }),
    new webpack.NormalModuleReplacementPlugin(
      /wdk-wallet-btc[/\\]src[/\\]transports[/\\](mempool-electrum-client|tcp|tls|ssl|ws)\.js$/,
      path.resolve(__dirname, 'src/shims/btc-transport-stub.js')
    ),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          globOptions: { ignore: ['**/.DS_Store'] }
        },
        {
          from: 'public/manifest.json',
          to: 'manifest.json',
        },
        {
          from: 'escrow-app',
          to: 'escrow',
          globOptions: { ignore: ['**/.DS_Store', '**/main.js', '**/app.js', '**/guide-data.js'] },
        },
        {
          from: 'public/escrow.json',
          to: 'escrow.json',
        },
      ],
    }),
  ],

  resolve: {
    extensions: ['.js'],
    alias: {
      'sodium-native': path.resolve(__dirname, 'node_modules/sodium-javascript'),
      'sodium-universal': path.resolve(__dirname, 'src/shims/sodium-universal.js'),
      '@tetherto/wdk': path.resolve(__dirname, 'node_modules/@tetherto/wdk/index.js'),
      '@tetherto/wdk-wallet-evm': path.resolve(__dirname, 'node_modules/@tetherto/wdk-wallet-evm/index.js'),
      '@tetherto/wdk-wallet-btc': path.resolve(__dirname, 'node_modules/@tetherto/wdk-wallet-btc/index.js'),
      '@tetherto/wdk-wallet-solana': path.resolve(__dirname, 'node_modules/@tetherto/wdk-wallet-solana/index.js'),
    },
    fallback: {
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser.js'),
      crypto: false,
      stream: false,
      util: false,
      path: false,
      fs: false,
    },
  },

  experiments: {
    outputModule: false,
  },

  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    splitChunks: false,
    runtimeChunk: false,
  },
};
