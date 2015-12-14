
var path = require('path');
var webpack = require('webpack');

module.exports = {

	cache: true,

	entry: {
		widget: "./src/core/widget"
	},

	output: {
		path: path.join(__dirname, "dist"),
		filename: "[name].js"
	},

	module: {
		loaders: [
			// required to write "require('./style.css')"
			{test: /\.css$/, loader: "style-loader!css-loader"},

			// required for react jsx
			{test: /\.js$/, loader: "jsx-loader"},
			{test: /\.jsx$/, loader: 'jsx-loader?insertPragma=React.DOM'}
		]
	}

}