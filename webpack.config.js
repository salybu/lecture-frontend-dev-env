const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "development",
  entry: {
    main: "./src/app.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve("./dist"),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          process.env.NODE_ENV === "production"
            ? MiniCssExtractPlugin.loader
            : "style-loader",
          "css-loader",
        ],
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        loader: "url-loader",
        options: {
          name: "[name].[ext]?[hash]",
          limit: 10000, // 10Kb
        },
      },
    ],
  },
  /**
   * TODO: 아래 플러그인을 추가해서 번들 결과를 만들어 보세요.
   * 1. BannerPlugin: 결과물에 빌드 시간을 출력하세요.
   * 2. HtmlWebpackPlugin: 동적으로 html 파일을 생성하세요.
   * 3. CleanWebpackPlugin: 빌드 전에 아웃풋 폴더를 깨끗히 정리하세요.
   * 4. MiniCssExtractPlugin: 모듈에서 css 파일을 분리하세요.
   */
  plugins: [
    new webpack.BannerPlugin({
      banner: ` Build Time: ${new Date().toLocaleString()} `,
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      templateParameters: {
        env: process.env.NODE_ENV === "development" ? "(dev)" : "",
      },
      minify:
        process.env.NODE_ENV === "production"
          ? { removeComments: true }
          : false,
    }),
    new CleanWebpackPlugin(),
    // process.env.NODE_ENV === "production"
    //   ? new MiniCssExtractPlugin({ filename: "[name].css" })
    //   : false,
    // 요거 쓰면 NODE_ENV=development npm run build 하면 아래 에러가 뜬다
    // Invalid configuration object. Webpack has been initialised using a configuration object that does not match the API schema.
    //  - configuration.plugins[3] should be one of these:
    //    object { apply, … } | function
    //    -> Plugin of type object or instanceof Function
    //    Details:
    //     * configuration.plugins[3] should be an object.
    //       -> Plugin instance
    //     * configuration.plugins[3] should be an instance of function
    //       -> Function acting as plugin
    // npm ERR! code ELIFECYCLE
    // npm ERR! errno 1
    // new MiniCssExtractPlugin({ filename: "[name].css" }),
    ...(process.env.NODE_ENV === "production"
      ? [new MiniCssExtractPlugin({ filename: "[name].css" })]
      : []),
    // 이제 보니 위에 [new Mini~] 이거 배열로 안 감싸줘서 이렇게 된 듯;;;
  ],
};
