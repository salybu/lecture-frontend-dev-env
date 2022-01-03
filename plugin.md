## [프론트엔드 개발환경의 이해: 웹팩(기본) #Plugin](https://jeonghwan-kim.github.io/series/2019/12/10/frontend-dev-env-webpack-basic.html#5-%ED%94%8C%EB%9F%AC%EA%B7%B8%EC%9D%B8)

- loader 가 파일 단위의 처리를 한다면, plugin 은 번들된 결과물 1개를 처리한다. 번들된 js 를 난독화하거나 특정 text 를 추출한다

&nbsp;

### Custom Plugin

- plugin 모듈을 만들자. loader 는 함수로 정의했지만, plugin 은 class 로 정의한다. [샘플 코드](https://webpack.js.org/contribute/writing-a-plugin/)를 보고 작성한다

  - plugin 에 apply method 를 써주면 webpack 이 compiler 객체를 넣어준다. compiler 객체의 tap() 에 문자열, 콜백함수를 넣는다

```javascript
/* my-webpack-plugin.js */
class MyWebpackPlugin {
  apply(compiler) {
    compiler.hooks.done.tap("My Plugin", (stats) => {
      // Plugin 이 종료되면 실행되는 함수
      console.log("MyPlugin: done");
    });
  }
}

module.exports = MyWebpackPlugin;
```

&nbsp;

- plugin 이 동작하도록 `webpack.config.js` 파일에서 설정해준다. `plugins:` 에 배열 내부에 Class 로 제공되는 플러그인의 생성자 함수를 실행해서 넣는다

```javascript
/* webpack.config.js */
const MyWebpackPlugin = require("./my-webpack-plugin");

module.exports = {
  plugins: [new MyWebpackPlugin()],
};
```

- loader 는 여러 개 파일에 대해 각각 실행된다면, plugin 은 1개로 뭉쳐진 bundle 파일에 대해 1번만 실행된다 (console log 1번 찍힘)

&nbsp;

#### bundle 결과에 접근하는 방법?

- webpack 내장 플러그인 중 1개인 BannerPlugin 을 통해 알 수 있다

- compiler 에 plugin 함수가 있다. 인자로 `"emit"` 과 `callback 함수`를 넘기는데, callback 함수 내부에서 bundle 된 결과물에 접근할 수 있다. callback 함수는 `compilation`, `callback` 2개 인자를 받는다

```javascript
/* my-webpack-plugin.js */
class MyWebpackPlugin {
    compiler.plugin("emit", (compilation, callback) => {
      const source = compilation.assets["main.js"].source();
      console.log(source);
      callback();
    });
}

module.exports = MyWebpackPlugin;
```

- compilation 객체에 번들된 결과가 있으며, `compilation.assets[].source()` 함수로 접근할 수 있다. `compilation.assets['main.js'].source()` 는 `main.js` 의 소스코드를 가져오는 함수이다

&nbsp;

- 아래 코드는 웹팩으로 빌드한 시간을 주석으로 다는 로직이다. bundle 소스를 얻어오는 함수 source()를 재정의 했다

```javascript
/* my-webpack-plugin.js */
class MyWebpackPlugin {
    compiler.plugin("emit", (compilation, callback) => {
      compilation.assets["main.js"].source = () => {
        const banner = [
          "/**",
          " * 이것은 BannerPlugin이 처리한 결과입니다.",
          " * Build Date: 2019-10-10",
          " */",
        ].join("\n");
        return banner + "\n\n" + source;
      };
}

module.exports = MyWebpackPlugin;
```

&nbsp;

- loader 는 모듈로 연결된 각 파일들을 처리한다. plugin 은 static asset 들이 각각 1개로 만들어지기 직전에 개입해서 output 으로 만들어질 번들링에 후처리한다

![image](https://user-images.githubusercontent.com/66893123/147874450-6f6cc133-042f-4dea-9d7d-2223624d5960.png)

&nbsp;

## 자주 사용하는 Plugin

### BannerPlugin

- bundle 결과물에 빌드 정보, commit 버전 등을 추가하는 Plugin 이고, 웹팩이 기본으로 제공한다
- 빌드, 배포했을 때 실제 정적파일들이 잘 배포됐는지, 캐시에 의해 갱신됐는지 아닌지 확인하기 위해 사용한다

- BannerPlugin 생성자 함수에 전달하는 옵션 객체의 `banner:` 속성에 전달하는 문자열이 bundle 결과물에 포함되어 나온다
  - node module 중 child_process 모듈을 가져와서 git bash 명령어인 git config user.name 을 쓰면 작성자도 남길 수 있고, 단축된 commit 해시번호를 넣을 수도 있다

```javascript
/* webpack.config.js */
const webpack = require("webpack");
const childProcess = require("child_process");

module.exports = {
  plugins: [
    new webpack.BannerPlugin({
      banner: `
        Build Date: ${new Date().toLocaleString()}
        Commit Version: ${childProcess.execSync("git rev-parse --short HEAD")}
        Author: ${childProcess.execSync("git config user.name")}
      `,
    }),
  ],
};
```

&nbsp;

- Banner 정보가 많다면 파일을 분리할 수도 있다

```javascript
/* webpack.config.js */
const webpack = require("webpack");
const banner = require("./banner.js");

module.exports = {
  plugins: [new webpack.BannerPlugin(banner)],
};
```

```javascript
/* banner.js */
const childProcess = require("child_process");

module.exports = function banner() {
  const commit = childProcess.execSync("git rev-parse --short HEAD");
  const user = childProcess.execSync("git config user.name");
  const date = new Date().toLocaleString();

  return (
    `commitVersion: ${commit}` + `Build Date: ${date}\n` + `Author: ${user}`
  );
};
```

&nbsp;

### DefinePlugin

- _**환경변수**_ 들을 어플리케이션에 제공하기 위해 DefinePlugin 을 사용한다. 역시 webpack 의 기본 플러그인이다

  - front-end 소스코드는 _개발환경_, _운영환경_ 으로 나눠서 운영한다. 개발환경과 운영환경의 API 주소가 다를 수 있고, 이렇게 환경 의존적인 정보는 소스가 아닌 다른 곳에서 관리하는 것이 좋다

- DefinePlugin 에는 빈 객체를 넣어도 기본적으로 node 의 환경변수(`process.env.NODE_ENV`)를 주입해준다. 정확히는 `webpack.config.js` 에서 설정한 `webpack mode` 를 넘긴다

```javascript
/* webpack.config.js */
const webpack = require("webpack");

module.exports = {
  plugins: [new webpack.DefinePlugin({})],
};
```

```javascript
/* app.js */
console.log(process.env.NODE_ENV); // {} 빈 객체 넘겨도 출력
```

- - `process.env.NODE_ENV` 는 node 에서 제공하는 변수인데, 웹팩이 node 환경에서 돌아가므로 이게 넘어간다

&nbsp;

- 직접 환경변수를 넣고 싶다면 객체 내부에 `{ [name]: value }` 로 넘기면 어플리케이션에서 `name` 전역변수로 접근할 수 있다. `value` 는 `코드`로 넘어가는데, 코드가 아닌 `값`을 넘기고 싶을 때는 `JSON.stringify()` 를 통해 한번 더 문자열화 한다

```javascript
/* webpack.config.js */
const webpack = require("webpack");

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      TWO: "1+1", // 2
      TWO: JSON.stringify("1+1"), // 1+1
      "api.domain": JSON.stringify("http://dev.api.domain.com"), // 객체 타입도 지원
    }),
  ],
};
```

```javascript
/* app.js */
console.log(TWO); // 2
console.log(TWO); // "1+1"
console.log(api.domain); // 객체 형식으로 정의했으므로 객체로 접근
```

&nbsp;

### HtmlTemplatePlugin

- html 파일을 처리하는 데 사용하며, 써드파티 패키지로 따로 설치가 필요하다

- `소스폴더 밖`에서 직접 _**index.html**_ 을 만들고 _**빌드한 결과물**_ 을 직접 _**index.html**_ 에 넣었는데, `html` 도 webpack 의 `빌드과정`에 넣고 싶을 때 이 플러그인을 사용한다. 의존적이지 않은 코드로 유동적으로 html 을 만들 수 있다

  - _**index.html**_ 도 `src 폴더` 로 옮겨서 소스로 관리한다. 빌드하면 `dist 폴더` 에 _**index.html**_ 이 생성된다

  - 웹팩으로 빌드한 결과물을 자동으로 로딩하는 코드가 주입되므로 기존 _**index.html**_ 에 script 로딩 코드도 제거한다

&nbsp;

- 옵션을 전달할 때 `template:` 에 _**index.html 의 경로**_ 를 넣어준다

  - `url-loader` 에 `options:` 로 `publicPath` 에 _**./dist/**_ 넣은 걸 빼준다

```javascript
/* webpack.config.js */
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
};
```

&nbsp;

- ejs 문법을 이용해 html 파일에 변수로 데이터를 전달할 수 있고, 동적으로 html 코드를 생성할 수 있다. 환경 변수(`process.env.NODE_ENV`)에 따라 문자열(`(dev)`)을 붙이거나 뗀다

```html
<!-- TODO: HtmlWebpackPlugin에서 빌드 환경을 주입하도록 웹팩을 구성하세요 -->
<title>검색<%= env %></title>
```

```javascript
/* webpack.config.js */
plugins: [
  new HtmlWebpackPlugin({
    template: "./src/index.html", // template 경로 지정
    templateParameters: { // template 에 주입할 parameter 지정
      env: process.env.NODE_ENV === "development" ? "(dev)" : "",
    },
  }),
],
```

&nbsp;

- 운영환경에서는 빈 칸, 주석을 제거하고 파일을 압축한다

- 정적 파일 배포 후 즉각 브라우저에 반영되지 않는 경우 캐시 때문이다. 이런 캐시를 무력화하는 `hash: true` 옵션을 추가하면, 정적 파일 로딩 주소 쿼리 문자열에 해시값이 붙는다

```javascript
/* webpack.config.js */
plugins: [
  new HtmlWebpackPlugin({
    minify:
      process.env.NODE_ENV === "production"
        ? {
            collapseWhitespace: true, // 빈 칸 제거
            removeComments: true, // 주석 제거
          }
        : false,
    hash: true, // 정적 파일을 불러올 때 쿼리 문자열에 웹팩 해쉬값을 추가
  }),
],
```

&nbsp;

### CleanWebpackPlugin

- 이전 빌드 결과물을 모두 삭제한 후에 빌드 파일을 저장하는 플러그인이다. 따로 설치해줘야 하고 설정 코드내용은 아래와 같다

```javascript
/* webpack.config.js */
const { CleanWebpackPlugin } = require("clean-webpack-plugin"); // default export 가 아니므로 { } 이용

module.exports = {
  plugins: [new CleanWebpackPlugin()],
};
```

&nbsp;

### MiniCssExtractPlugin

- bundle 결과에서 stylesheet 코드만 따로 뽑아서 css 파일을 별도로 만들어 분리하는 것이 좋다. 브라우저에서 큰 파일 1개를 로딩하는 것은 로딩 성능에 영향을 줄 수 있기 때문이다

  - production 환경에서만 설정한다. 결과물에 `main.css` 도 추가되고, _**index.html**_ 에 `<script src='main.css' />` 로드가 추가된다

```javascript
/* webpack.config.js */
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [
    ...(process.env.NODE_ENV === "production"
      ? [new MiniCssExtractPlugin({ filename: `[name].css` })]
      : []),
  ],
};
```

- loader 설정도 추가해야 한다. production 환경에서는 `style-loader` 대신 `MiniCssExtractPlugin.loader` 를 사용한다

```javascript
/* webpack.config.js */
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          process.env.NODE_ENV === "production"
            ? MiniCssExtractPlugin.loader // 프로덕션 환경
            : "style-loader", // 개발 환경
          "css-loader",
        ],
      },
    ],
  },
};
```

&nbsp;

## 정리

- `BannerPlugin`: bundling 된 결과물 상단에 _**build 정보를 추가**_ 한다, 잘 배포됐는지 확인용
- `DefinePlugin`: build time 에 결정되는 _**환경변수 (ex. API 주소)**_ 를 application 안에 주입하기 위해 사용
- `HTMLTemplatePlugin`: html 파일도 build 과정에 포함시켜, 동적으로 js/css script 를 넣는다. _**build time 에 결정되는 값들**_ 을 template 파일에 넣어서 _**html 파일을 동적으로 생성**_
- `CleanWebpackPlugin`: build 할 때마다 output 폴더(./dist) 를 삭제
- `MiniCssExtractPlugin`: bundle 된 js 코드에서 _**css 파일만 따로 뽑아서**_ 만들어 낸다
