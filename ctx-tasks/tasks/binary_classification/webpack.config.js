var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

module.exports = {
  optimization: {
		minimize: false
	},
  plugins: [    
    new HtmlWebpackPlugin ({
      filename: 'bundle.html',
      inject: 'body',
      inlineSource: '.(js|css)$',
      template: 'src/index.html'
    }),
    new HtmlWebpackInlineSourcePlugin()
  ]
};
