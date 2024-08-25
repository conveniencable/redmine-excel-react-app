// development config
const { merge } = require('webpack-merge');
const webpack = require('webpack');
const commonConfig = require('./common');
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const redmine_plugin_dir = commonConfig.redmine_plugin_dir;
const redmine_url_root = 'mypage';
delete commonConfig.redmine_plugin_dir;


module.exports = merge(commonConfig, {
  mode: 'development',
  entry: {
    app: [
      './index.tsx' // the entry point of our app
    ],
    vendor: ['semantic-ui-react', 'semantic-ui-css/semantic.min.css', 'lodash-es', 'moment', 'react-table', 'framer-motion']
  },
  output: {
    filename: 'js/bundle.[name].min.js',
    chunkFilename: '[name].js',
    path: resolve(__dirname, redmine_plugin_dir, 'assets/react-dist'),
    publicPath: `/${redmine_url_root}/plugin_assets/redmine_excel_connector/react-dist/`,
    clean: true
  },
  devtool: 'inline-source-map',
  optimization: {
    moduleIds: 'named'
    // runtimeChunk: 'multiple'
  },
  plugins: [],
  devServer: {
    host: '0.0.0.0',
    port: 3033,
    allowedHosts: 'all',
    hot: true,
    open: true,
    historyApiFallback: true,
    watchFiles: ['src/**/*'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    },
    proxy: [
      {
        context: [`/${redmine_url_root}`,`/${redmine_url_root}/redmine_excel_connector`],
        target: 'http://localhost:3003',
        secure: false,
        changeOrigin: true,
        logLevel: 'info',
        onProxyReq: (proxyReq, req) => {
          console.log('[HPM] %s %s %s %s', req.method, req.originalUrl, '->', req.url);
        }
      }
    ]
  }
});
