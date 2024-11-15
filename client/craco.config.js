const path = require('path');
const fs = require('fs-extra');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Disable sourcemaps only for production build
            if (process.env.NODE_ENV === 'production') {
                webpackConfig.devtool = false;
            }

            // Change the output directory
            webpackConfig.output.path = path.resolve(__dirname, '../shellviz/build');

            // Set static filenames for JavaScript and CSS
            webpackConfig.output.filename = 'static/js/main.js';

            // Use a minimal chunk filename to satisfy Webpack's requirements
            webpackConfig.output.chunkFilename = 'static/js/[id].js';

            webpackConfig.plugins.forEach((plugin) => {
                if (plugin.constructor.name === 'MiniCssExtractPlugin' && plugin.options) {
                    plugin.options.filename = 'static/css/main.css';
                    plugin.options.chunkFilename = 'static/css/[id].css';
                }
            });

            return webpackConfig;
        },
        plugins: [
            {
                apply: (compiler) => {
                    compiler.hooks.done.tap('RemoveUnwantedFiles', () => {
                        const buildPath = path.resolve(__dirname, '../shellviz/build/static');
                        const jsPath = path.join(buildPath, 'js');
                        const cssPath = path.join(buildPath, 'css');

                        // Remove unnecessary files after build
                        if (fs.existsSync(jsPath)) {
                            fs.readdirSync(jsPath).forEach(file => {
                                if (file.endsWith('.map') || file.includes('.chunk')) {
                                    fs.unlinkSync(path.join(jsPath, file));
                                }
                            });
                        }

                        if (fs.existsSync(cssPath)) {
                            fs.readdirSync(cssPath).forEach(file => {
                                if (file.endsWith('.map') || file.includes('.chunk')) {
                                    fs.unlinkSync(path.join(cssPath, file));
                                }
                            });
                        }
                    });
                },
            },
        ],
    },
};