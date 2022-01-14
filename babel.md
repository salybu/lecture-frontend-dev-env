## [프론트엔드 개발환경의 이해: Babel](https://jeonghwan-kim.github.io/series/2019/12/22/frontend-dev-env-babel.html)

- 브라우저마다 지원하는 언어가 다르면, 코드가 일관적이지 못하다. 몇년 전까지만 해도 사파리 브라우저에 `promise.prototype.finally` 메소드를 사용할 수 없었다

&nbsp;

### Babel

- Babel 을 설치한다. `@babel/core` 와 terminal 도구로 babel 을 사용하기 위한 `@babel/cli` 를 설치한다

```
$ npm install @babel/core @babel/cli
```

&nbsp;

- babel 을 설치하면 `node_modules/.bin/babel` 명령어가 생긴다. npx 를 붙이면 설치한 모듈을 바로 실행할 수 있다

```
$ npx babel app.js
```

&nbsp;

- `app.js` 을 다음과 같이 쓰고, babel 변환 과정을 살펴보자

```javascript
/* app.js */
const alert = (msg) => window.alert(msg);
```

- - `const` 는 상수 정의에 사용하는 ES6 키워드, `arrow 함수` 역시 ES6 에 나왔다. IE 는 ES6 을 지원하지 않으므로 이를 인식 못한다
  - Babel 로 `app.js` 를 IE 를 포함한 모든 Browser 가 인식할 수 있게 변환하자

&nbsp;

- Babel 이 코드를 변환하는 작업은 총 3단계를 거친다

  - 파싱 (Parsing) 코드를 받아서 각 token 별로 모두 분해한다 (const, alert, =, 하나하나 토큰으로 모두 분해)
  - 변환 (Transforming) ES6 코드를 ES5 로 변환하는 단계
  - 출력 (Printing) 변환된 결과를 출력

&nbsp;

### Babel Plugin

- Babel 에 plugin 이라는 요소가 있는데, plugin 이 변환을 담당한다. Babel plugin 을 custom 으로 만들어보면서 plugin 이 어떻게 동작하고 변환작업을 수행하는지 살펴보겠다

```javascript
/* my-babel-plugin.js */
module.exports = function myplugin() {
  return {
    visitor: {
      Identifier(path) {
        const name = path.node.name;

        // 바벨이 만든 AST 노드를 출력한다
        console.log("Identifier() name:", name);

        // 변환작업: 코드 문자열을 역순으로 변환한다
        path.node.name = name.split("").reverse().join("");
      },
    },
  };
};
```

- Babel custom plugin 에서는 _visitor 객체_ 를 가진 객체를 반환해야 한다. _identifier()_ 메소드가 _visitor 객체_ 에 들어있다. _identifier()_ 는 Babel 이 넣어주는 _path 객체_ 를 받는다

- `path.node.name` 으로 파싱된 결과물에 접근할 수 있다. `console.log` 로 찍어서 확인할 수 있다

&nbsp;

- Babel help 문서로 plugin 사용법을 살펴보자. `--plugins` 옵션 `[list]` 에 plugin 을 전달하면 babel 로 plugin 을 실행할 수 있다

```
$ npx babel --help
```

&nbsp;

- 결과물에 _identifier()_ 에 정의한 `console.log` 가 찍힌다

```
$ npx babel app.js --plugins './my-babel-plugin.js'

Identifier() name: alert
Identifier() name: msg
Identifier() name: window
Identifier() name: alert
Identifier() name: msg

const trela = gsm => wodniw.trela(gsm);
```

- - 실제 변환작업은 path 객체의 `node.name` 을 모두 뒤집는 code 이다. 그래서 `split` 으로 각 캐릭터를 모두 쪼갠 후 `reverse()` 함수로 뒤집고 그 배열을 `join()` 한다
  - log 찍는 부분은 같고 결과물은 const 를 제외한 모든 문자의 순서가 뒤집힌다. 파싱된 token 들이 역순으로 뒤집혀졌다

&nbsp;

- 이제 `const` 키워드를 `var` 키워드로 바꾸는 plugin 을 만들자. _visitor 객체_ 를 갖도록 하고 _identifier()_ 는 지우고, _variableDeclaration 메소드_ 를 쓴다. 이 메소드도 parsing 된 결과를 _path 객체_ 로 받는다

```javascript
/* my-babel-plugin.js */
module.exports = function myplugin() {
  return {
    visitor: {
      // https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-block-scoping/src/index.js#L26
      VariableDeclaration(path) {
        console.log("VariableDeclaration() kind:", path.node.kind); // const

        if (path.node.kind === "const") {
          path.node.kind = "var";
        }
      },
    },
  };
};
```

&nbsp;

- 결과를 보면 `path.node.kind` 에 `const` 로그가 찍힌다

  - `const`, `var`, `let` 등의 키워드가 들어온다고 추측할 수 있다. `alert` 선언이 `var` 로 바뀌어 있다

```
$ npx babel app.js --plugins ./my-babel-plugin.js

VariableDeclaration() kind: const

var alert = msg => window.alert(msg);
```

&nbsp;

### 실제 Plugin

- `const` 를 `var` 로 변환하는 plugin 은 실제로 babel 에서 제공하는 `block-scoping` plugin 이다

```
$ npx babel app.js --plugins @babel/plugin-transform-block-scoping
```

&nbsp;

- arrow 함수를 변환하는 plugin 인 `arrow-functions` 관련 plugin 을 사용한다. 그러면 arrow 함수도 일반 함수로 변환되어 있다

```
$ npx babel app.js --plugins @babel/plugin-transform-block-scoping --plugins @babel/plugin-transform-arrow-functions
```

&nbsp;

- 브라우저에서 `use strict` 구문을 상단 추가해 엄격모드로 실행하는 게 좋은데, 이런 코드를 넣어주는 것이 `strict-mode` 관련 plugin

```
$ npx babel app.js --plugins @babel/plugin-transform-block-scoping --plugins @babel/plugin-transform-arrow-functions
--plugins @babel/plugin-transform-strict-mode
```

&nbsp;

### Babel.config.js

- plugin 이 많아지면 명령어가 길어지므로 `babel.config.js` 파일을 만든다. `node` 에서 돌아가므로, node 의 module 키워드를 쓴다

```javascript
/* babel.config.js */
module.exports = {
  plugins: [
    "@babel/plugin-transform-block-scoping",
    "@babel/plugin-transform-arrow-functions",
    "@babel/plugin-transform-strict-mode",
  ],
};
```

&nbsp;

- Babel 이 기본적으로 `babel.config.js` 을 읽어서 plugin 을 적용하고, 그 plugin 으로 코드를 변환한 다음 결과를 출력한다

- 필요한 plugin 을 일일이 설정하는 것은 비현실적이다. 세트로 모아놓은 것이 `preset` 이고 `custom preset` 을 만들어 보겠다. `preset` 을 통해 이 안에 있는 모든 plugin 들이 실행되도록 한다

```javascript
/* babel.config.js */
module.exports = {
  presets: ["./my-babel-preset.js"],
};
```

```javascript
/* my-babel-preset.js */
module.exports = function myBabelPreset() {
  return {
    plugins: [
      "@babel/plugin-transform-block-scoping",
      "@babel/plugin-transform-arrow-functions",
      "@babel/plugin-transform-strict-mode",
    ],
  };
};
```

&nbsp;

- 실무에서 많이 사용되는 preset, polyfill 추가하는 방법, webpack 으로 어떻게 통합할 수 있는지 등등을 알아보겠다

&nbsp;

### Babel 사용법

- Plugin 을 모아놓은 것이 `preset` 이다

  - Babel 이 제공하는 대표적인 preset 이 `env preset` 이다. 과거 ECMA 버전에 따라 제공되던 것을 모두 `env preset` 으로 통합했다
  - `preset-react`, `preset-typescript` 는 각각 react, typescript 를 변환하기 위한 preset 이다

&nbsp;

- 먼저 env preset 을 설치하고, `babel.config.js` 파일을 수정해준다

```
$ npm install -D @babel/preset-env
```

```javascript
/* babel.config.js */
module.exports = {
  presets: ["@babel/preset-env"],
};
```

&nbsp;

- 그리고 babel 을 실행해주면 똑같은 결과가 나온다

```
$ npx babel app.js
```

&nbsp;

- `preset` 사용 시, 특정 browser 를 지원한다는 설정을 `babel.config.js` 에 추가할 수 있다

  - 작성하면 해당 browser 까지만 돌아가도록 변환해 build 한다
  - IE 버전명도 적어주면 둘 다 동작하는 코드로 변환해준다

```javascript
/* babel.config.js */
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          chrome: "79", // 크롬 79까지 지원하는 코드를 만든다
          // ie: "11", // ie 11까지 지원하는 코드를 만든다
        },
      },
    ],
  ],
};
```

&nbsp;

### Polyfill

- ES6 의 객체인 Promise() 생성자 함수를 실행한다. 아래와 같이 명령어를 입력하면 의도대로 변환이 안된다

```javascript
/* app.js */
new Promise();
```

```
$ npx babel app.js
```

&nbsp;

- caniuse 에 promise 를 검색해보면 IE 에 지원하지 않는다. 따라서 polyfill 코드 조각을 추가해야 한다

  - ES6 `block scoping` 은 ES5 `function scoping` 으로 대응 가능하나, Promise 는 ES5 로 대체할 수 없다 (구현은 가능)
  - 이럴 때 polyfill 을 사용한다. polyfill 을 제공하는 대표 라이브러리가 `corejs`, babel polyfill 등이 있다

&nbsp;

- `babel.config.js` 의 preset-env option 에 `target browser` 와 `polyfill` 사용여부도 쓸 수 있다

  - `useBuiltIns:` 에 usage 나 entry 를 써주면 된다. 그러면 polyfill 패키지 중 corejs 를 모듈로 가져온다
  - polyfill 라이브러리 corejs 를 쓴다면 version 을 명시한다

```javascript
/* babel.config.js */
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage", // 폴리필 사용 방식 지정
        corejs: {
          version: 2, // 폴리필 버전 지정
        },
      },
    ],
  ],
};
```

&nbsp;

- 결과물을 보면 corejs 로부터 promise 구현 관련 모듈을 가져오는 import 구문이 추가된다

```
$ npx babel src/app.js
"use strict";

require("core-js/modules/es6.promise");
require("core-js/modules/es6.object.to-string");

new Promise();
```

&nbsp;

### Webpack 으로 통합

- 실무에서는 Babel 을 webpack 에 통합한다. 패키지를 설치하고, webpack 설정에서 loader 에 `babel-loader` 를 추가한다

```
$ npm install -D babel-loader
```

```javascript
/* webpack.config.js */
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/, // 예외. 이미 build 된 모듈들이므로
        loader: "babel-loader",
      },
    ],
  },
};
```

&nbsp;

- polyfill 설정을 했다면 `corejs` 도 설치한다. webpack 은 `babel-loader` 가 만든 아래 코드를 만나면 corejs 모듈을 찾기 때문이다

```
$ npm i core-js@2
```

```javascript
require("core-js/modules/es6.promise");
require("core-js/modules/es6.object.to-string");
```

&nbsp;

- 마지막으로 webpack 으로 빌드하면 결과물이 나온다

```
$ npm run build
```

&nbsp;

- Babel 을 webpack 과 통합해 사용하려면 `babel-loader` 를 webpack 설정에 추가한다

&nbsp;

### 실습 내용

- js 확장자에 대해 loader 를 설정하는데 babel-loader 가 동작하도록 한다

```
$ npm install babel-loader
```

```javascript
/* webpack.config.js */
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/, // 예외. 이미 build 된 모듈들이므로
        loader: "babel-loader",
      },
    ],
  },
};
```

&nbsp;

- babel-loader 는 babel 을 실행해야 하므로 `@babel/core` 를 설치한다

```
$ npm i @babel/core
```

&nbsp;

- `@babel/core` 가 참조할 `babel.config.js` 을 만든다. Babel 이 webpack 작업을 하므로 `babel.config.js` 를 써야 babel 도 동작한다

```javascript
/* babel.config.js */
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage", // 폴리필 사용 방식 지정
        corejs: {
          version: 2, // 폴리필 버전 지정
        },
      },
    ],
  ],
};
```

- 위에서 `@babel/preset-env` 설정을 해주니까 설치한다. polyfill 도 추가한다면 `corejs` 도 설치한다

```
$ npm i @babel/preset-env core-js@2
```

&nbsp;

- 아래와 같은 에러가 뜰 수 있다

  > regeneratorRuntime is not defined

- IE 에서 async await 코드를 넣으려면 `corejs` 로 가져올 수 없고, `regenerator-runtime` 패키지를 설치해준다

&nbsp;

- Babel 을 실행하기 위해 webpack 에서 `babel-loader` 를 쓰고, babel 설정은 `babel.config.js` 에 쓴다. 필요한 패키지도 다 설치한다

&nbsp;

## 정리

- `Babel` 은 코드 결과물을 다양한 브라우저에서 구동하기 위해 필요한 도구다
- `Babel-core` 는 파싱/출력을 담당하고, `plugin` 이 변환 작업을 한다. babel 은 여러 개 plugin 을 모아 `preset` 으로 제공한다
- plugin 으로 처리되지 않는 코드는 `polyfill` 이라는 코드 조각을 import 해 해결한다
