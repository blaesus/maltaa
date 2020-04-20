const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

module.exports = {
    mode: "production",

    entry: {
        root: path.join(__dirname, "WebRoot.tsx"),
    },

    output: {
        path: path.resolve(__dirname, "..", "..", "..", "built", "dist", "web"),
        filename: '[name].[contenthash].js',
        publicPath: "/",
    },

    optimization: {
        minimize: true,
        minimizer: [
            new OptimizeCSSAssetsPlugin({}),
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: /@license/i,
                    },
                },
                extractComments: false,
            }),
        ],
        splitChunks: {
            cacheGroups: {
                react: {
                    name: "react",
                    chunks: "all",
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                }
            }
        },
        moduleIds: "hashed",
        chunkIds: "named",
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".css"],
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    configFile: "../../../tsconfig.json",
                }
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ],
            },
        ]
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].css',
            ignoreOrder: false,
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "index.html"),
            filename: "index.html",
            inject: "body",
            inlineSource: ".css$",
        }),
        new HtmlWebpackInlineSourcePlugin(),
    ]

}
