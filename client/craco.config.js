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
            webpackConfig.output.path = path.resolve(__dirname, 'dist');

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
            // {
            //     apply: (compiler) => {
            //         compiler.hooks.done.tap('RemoveUnwantedFiles', () => {
            //             const buildPath = path.resolve(__dirname, 'dist/static');

            //             const removeUnwantedFiles = (dirPath, fileCondition) => {
            //                 if (fs.existsSync(dirPath)) {
            //                     fs.readdirSync(dirPath).forEach(file => {
            //                         if (fileCondition(file)) {
            //                             fs.unlinkSync(path.join(dirPath, file));
            //                         }
            //                     });
            //                 }
            //             };

            //             const jsPath = path.join(buildPath, 'js');
            //             removeUnwantedFiles(jsPath, file => file.endsWith('.map') || file.includes('.chunk'));

            //             const cssPath = path.join(buildPath, 'css');
            //             removeUnwantedFiles(cssPath, file => file.endsWith('.map') || file.includes('.chunk'));
            //         });
            //     },
            // },
            {
                apply: (compiler) => {
                    // Removes the `build` folder that is created by default by Create React App
                    compiler.hooks.done.tap('RemoveBuildFolder', () => {
                        const buildFolder = path.resolve(__dirname, 'build');
                        if (fs.existsSync(buildFolder)) {
                            fs.removeSync(buildFolder);
                            console.log('Removed build folder after compilation');
                        }
                    });
                },
            },
        ],
    },
};