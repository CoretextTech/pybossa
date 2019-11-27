const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

console.log('Compiling html bundles...');

getDirectories('./tasks/').forEach(t => {
  const taskDir = `./tasks/${t}`;

  webpack({
    entry: `${taskDir}/src/index.js`,
    output: {
      path: path.resolve(__dirname, `${taskDir}/dist`),
    },
    optimization: {
      minimize: true
    },
    plugins: [    
      new HtmlWebpackPlugin ({
        filename: `bundle.html`,
        inject: 'body',
        inlineSource: '.(js|css)$',
        template: `${taskDir}/src/index.html`,
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        },
      }),
      new HtmlWebpackInlineSourcePlugin()
    ]
  }, (err, stats) => { // Stats Object
    const info = stats.toJson();
    
    if (err || stats.hasErrors())
      console.error(String(info.errors));
    else
      console.log(`Task "${t}" has been successfully compiled to ${taskDir}/src/index.html`)
  });
});