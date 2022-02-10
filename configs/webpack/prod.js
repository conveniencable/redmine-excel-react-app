// production config
const merge = require('webpack-merge');
const {resolve} = require('path');

const commonConfig = require('./common');

const redmine_plugin_dir = commonConfig.redmine_plugin_dir;
delete commonConfig.redmine_plugin_dir;

module.exports = merge(commonConfig, {
  mode: 'production',
  entry: {
    app: './index.tsx',
    vendor: ['semantic-ui-react', 'sockjs-client', 'semantic-ui-css', 'lodash', 'moment', 'react-table', 'framer-motion']
  },
  output: {
    filename: 'js/bundle.min.js',
    path: resolve(__dirname, redmine_plugin_dir, 'assets/react-dist'),
    publicPath: '/plugin_assets/redmine_excel_connector/react-dist',
  },
  devtool: 'source-map',
  plugins: [],
});
