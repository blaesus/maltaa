const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    entry: path.join(__dirname, "main.tsx"),

    output: {
        path: path.resolve(__dirname, "..", "..", "built", "web"),
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    configFile: "../../tsconfig.json",
                }
            },
        ]
    },

    devServer: {
        contentBase: "/",
        historyApiFallback: true,
        port: 1990
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "index.html"),
            filename: "index.html",
            inject: "body"
        }),
    ]
}
