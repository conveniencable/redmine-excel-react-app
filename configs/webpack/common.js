// shared config (dev and prod)
const { resolve } = require('path');
const { CheckerPlugin } = require('awesome-typescript-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

const redmine_plugin_dir = './redmine_excel_connector';

module.exports = {
  redmine_plugin_dir,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  context: resolve(__dirname, '../../src'),
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader', 'source-map-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.tsx?$/,
        use: ['babel-loader', 'awesome-typescript-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', { loader: 'css-loader', options: { importLoaders: 1 } }]
      },
      {
        test: /\.(scss|sass)$/,
        loaders: ['style-loader', { loader: 'css-loader', options: { importLoaders: 1 } }, 'sass-loader']
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file-loader?hash=sha512&digest=hex&name=img/[hash].[ext]',
          'image-webpack-loader?bypassOnDebug&optipng.optimizationLevel=7&gifsicle.interlaced=false'
        ]
      },
      { test: /\.(ttf|eot|svg|woff|woff2)$/, use: 'file-loader' }
    ]
  },
  plugins: [
    new CheckerPlugin(),
    new HtmlWebpackPlugin({
      template: 'index.html.ejs',
      filename: resolve(__dirname, redmine_plugin_dir, 'app/views/redmine_excel_connector/index.html.erb'),
      alwaysWriteToDisk: true
    }),
    new HtmlWebpackHarddiskPlugin()
  ],
  externals: {},
  performance: {
    hints: false
  }
};
