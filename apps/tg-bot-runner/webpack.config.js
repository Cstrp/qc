const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const WebpackBar = require('webpackbar');
const FriendlyWebpackPlugin = require('@soda/friendly-errors-webpack-plugin');

module.exports = {
    output: {
        path: join(__dirname, '../../dist/apps/tg-bot-runner'),
    },
    plugins: [
        new WebpackBar(),
        new FriendlyWebpackPlugin(),
        new NxAppWebpackPlugin({
            target: 'node',
            compiler: 'tsc',
            main: './src/main.ts',
            tsConfig: './tsconfig.app.json',
            optimization: true,
            outputHashing: 'none',
            generatePackageJson: true,
            progress: true,
            statsJson: true,
            transformers: [
                {
                    name: '@nestjs/swagger/plugin',
                    options: {
                        dtoFileNameSuffix: ['.dto.ts', '.entity.ts'],
                    },
                },
            ],
        }),
    ],
};
