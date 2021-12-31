# 강의 노트

- ✅ 1-webpack/1-entry: 웹팩 엔트리/아웃풋 실습
- 본 강의를 듣고 정리한 내용을 아래에 담았습니다. 강의에서 진행한 실습은 본 브랜치에 commit 남겨두었습니다

&nbsp;

## [프론트엔드 개발환경의 이해: 웹팩(기본)](https://jeonghwan-kim.github.io/series/2019/12/10/frontend-dev-env-webpack-basic.html)

- 문법 수준에서 모듈을 지원한 것은 `ES2015` 의 `import` / `export` 키워드부터다. webpack 이 등장하면서 이런 키워드들을 사용했다

&nbsp;

### ES6 이전의 모듈

- 아래 코드 각각을 `math.js`, `app.js` 파일로 만들어 동일한 html 에 로드해 브라우저에서 실행하면, 전역 scope 이 오염된다 (window.sum)

```javascript
/* math.js */
function sum(a, b) {
  return a + b;
} // 전역 공간에 sum이 노출
```

```javascript
console.log(sum(1, 2)); // 3
```

&nbsp;

- 이 문제 해결을 위해 함수 scope 를 사용해 IIFE 방식의 모듈을 만든다. 이 안에 정의한 이름은 함수 외부에서 접근할 수 없으므로 전역 scope 가 오염되지 않는다

```javascript
/* math.js */
var math = math || {}; // 전역 math 네임스페이스

(function () {
  function sum(a, b) {
    return a + b;
  }
  math.sum = sum; // 네임스페이스에 추가
})();
```

- sum 이름은 즉시실행함수 내부에 감춰졌으므로 외부에서 같은 이름을 사용해도 된다. 전역에 등록한 math 네임스페이스만 잘 활용하면 된다

&nbsp;

### 다양한 모듈 스펙

1. CommonJS 는 `exports` 키워드로 모듈을 만들고, `require()` 함수로 불러들인다. Nodejs 가 채택한 방식이다

```javascript
exports function sum(a, b) { return a + b; }
```

```javascript
const math = require("./math.js");
math.sum(1, 2); // 3
```

2. AMD (Asynchronous Module Definition) 는 비동기로 로딩되는 환경에서 모듈을 사용하는 것이 목표다. 주로 브라우저 환경이다

3. UMD (Universal Module Definition) 은 AMD 기반으로 CommonJS 방식까지 지원하는 통합 형태다

4. _**ES2015 의 표준모듈 시스템**_ 이 나온 이후로 바벨, 웹팩을 이용해 표준모듈 시스템을 이용하는 것이 일반적이다. `export` 구문으로 모듈을 만들고, `import` 구문으로 가져온다

```javascript
export function sum(a, b) {
  return a + b;
}
```

```javascript
import * as math from "./math.js";
math.sum(1, 2); // 3
```

&nbsp;

- 그러나 몇몇 브라우저에서는 여전히 모듈을 사용하지 못한다. `<script>` 태그로 로딩할 때 `type="text/javascript"` 대신 `type="module"` 을 사용해 module 을 읽어올 수 있는 파일임을 명시해준다

- 모든 브라우저에서 모듈 시스템을 사용하고 싶다 !!!!!! 이제야 **Webpack** 이 나온다. **Webpack** 은 이런 모듈시스템을 어떻게 처리할까

&nbsp;

## Entry / Output

- 모듈로 개발하면 모듈 간 의존관계가 생긴다. Webpack 은 모듈로 연결된 여러 js 파일을 하나로 합쳐주는 번들러이다. 하나의 시작점 (Entry) 으로부터 의존적인 모듈을 모두 찾아서 하나의 결과물로 만든다

- 웹팩으로 번들링 작업을 하기 위해, 번들 작업을 하는 webpack 패키지와 웹팩 터미널 도구인 webpack-cli 를 설치한다

```
$ npm install -D webpack webpack-cli
```

&nbsp;

- 설치 후 node_module 내부 `.bin` 폴더에 명령어 `webpack`, `webpack-cli` 가 있다. 터미널에서 `--help` 옵션을 주고 사용법을 보자

```
$ node_modules/.bin/webpack --help
```

&nbsp;

- 번들링 하기 위해 이 중 3가지 옵션 `--mode`, `--entry`, `-o` 을 준다

```
$ node_modules/.bin/webpack --mode development --entry ./src/app.js -o dist/main.js
```

- - `--mode` 는 웹팩 실행모드를 의미하며 `development`, `production` 모드가 있다
  - `--entry` 는 시작점 경로를 지정하며, `-o` 은 번들링 결과물을 위치시킬 경로이다

&nbsp;

- 결과 파일을 똑같이 index.html 에서 로드하면 결과가 나오는데, 모듈을 인식하는 키워드 `type="module"` 은 뺀다. cors 이슈를 피하기 위해 `crossorigin="anonymous"` 도 넣어주면 끝

```html
<script src="dist/main.js" crossorigin="anonymous"></script>
```

&nbsp;

- 웹팩은 여러 개 모듈을 1개 파일로 만들어준다. 더 많은 옵션을 설정하기 위해 웹팩 설정파일을 만든다. `node_modules/.bin/webpack --help` 에서 `--config` 내용을 보면 기본 설정파일이 `./webpack.config.js` 로 돼 있다

- 터미널에서 사용한 `--mode`, `--entry`, `-o` 옵션을 `webpack.config.js` 에 코드로 다시 구현하면 아래와 같다

```javascript
const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    main: "./src/app.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve("./dist"),
  },
};
```

- - `entry` 에 직접 경로를 쓸 수도 있지만, 객체를 할당해 `{ [name]: '경로' }` 로 작성할 수도 있다

  - `output` 에 설정한 `[name]` 은 `entry:` `main` 이 문자열로 들어오는 방식이다. `entry` 가 여러 개일수도 있는데, `output` 파일 이름을 동적으로 만드는 효과가 있다

  - `output.path` 는 절대경로를 사용하므로, node 코어모듈 1인 path 모듈 (경로를 처리하는 기능) 의 `resolve()` 함수로 계산한다

&nbsp;

- **npm** 은 프로젝트를 관리하고, `script` 를 자동화해주므로 webpack 으로 코드를 bundling 하는 과정을 `npm scripts` 에 등록한다

```
{
  "scripts": {
    "build": "webpack"
  }
}
```

- **npm** 은 node_modules 에서 명령어를 찾고, webpack 은 기본 config 파일인 `webpack.config.js` 를 읽어서 웹팩 번들링 작업을 한다

&nbsp;

- JS 모듈은 여러 개의 의존관계가 있는데, 그 의존성 모듈들의 시작점이 `entry` 이다. 웹팩은 `entry` 기준으로 모든 모듈들을 찾아서 1개 파일로 번들링해주고, 그 결과를 `output` 에 내보낸다
