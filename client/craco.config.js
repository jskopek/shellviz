// craco.config.js
module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Set static filenames for JavaScript
            webpackConfig.output.filename = 'static/js/bundle.js';
            webpackConfig.output.chunkFilename = 'static/js/[name].chunk.js';
            
            // Set static filenames for CSS by modifying MiniCssExtractPlugin
            webpackConfig.plugins.forEach((plugin) => {
                if (
                    plugin.constructor.name === 'MiniCssExtractPlugin' &&
                    plugin.options
                ) {
                    plugin.options.filename = 'static/css/main.css';
                    plugin.options.chunkFilename = 'static/css/[name].chunk.css';
                }
            });
            
            return webpackConfig;
        },
    },
};
