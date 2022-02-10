// development config
const merge = require('webpack-merge');
const webpack = require('webpack');
const commonConfig = require('./common');
const { resolve } = require('path');

const redmine_plugin_dir = commonConfig.redmine_plugin_dir;
delete commonConfig.redmine_plugin_dir;

module.exports = merge(commonConfig, {
  mode: 'development',
  entry: {
    app: [
      'react-hot-loader/patch', // activate HMR for React
      'webpack-dev-server/client?http://localhost:3033', // bundle the client for webpack-dev-server and connect to the provided endpoint
      'webpack/hot/only-dev-server', // bundle the client for hot reloading, only- means to only hot reload for successful updates
      './index.tsx' // the entry point of our app
    ],
    vendor: ['semantic-ui-react', 'sockjs-client', 'semantic-ui-css', 'lodash', 'moment', 'react-table', 'framer-motion']
  },
  output: {
    filename: 'js/bundle.min.js',
    path: resolve(__dirname, redmine_plugin_dir, 'assets/react-dist'),
    publicPath: '/'
  },
  devServer: {
    hot: true // enable HMR on the server
  },
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(), // enable HMR globally
    new webpack.NamedModulesPlugin() // prints more readable module names in the browser console on HMR updates
  ],
  devServer: {
    host: '0.0.0.0',
    port: 3033,
    disableHostCheck: true,
    hot: true,
    historyApiFallback: true,
    publicPath: '/',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    },
    proxy: {
      '/redmine_excel_connector': {
        target: 'http://localhost:3003',
        secure: false,
        changeOrigin: true,
        logLevel: 'debug'
      }
    }
  }
});
