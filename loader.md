## [프론트엔드 개발환경의 이해: 웹팩(기본) #Loader](https://jeonghwan-kim.github.io/series/2019/12/10/frontend-dev-env-webpack-basic.html#3-%EB%A1%9C%EB%8D%94)

- 웹팩은 모든 파일을 js 의 모듈처럼 만들어준다. CSS stylesheet, image, font 도 `import` 구문을 이용해 js 내부에서 사용할 수 있다

  - css file 을 js 에 직접 로딩해 사용하거나, img 파일을 data URL 형식 문자열로 변환하고 js 내부에서 사용하도록 만든다

&nbsp;

### Custom Loader

- loader 모듈을 만들자. loader 는 함수 형태로 작성한다. loader 는 파일을 읽고, 읽은 파일 내용이 파라미터로 content 변수로 들어온다

```javascript
/* my-webpack-loader.js */
module.exports = function myloader(content) {
  console.log("myloader가 동작함");
  return content;
};
```

&nbsp;

- loader 가 동작하도록 `webpack.config.js` 파일에서 설정해준다. loader 는 `module:` 내부 객체에 `rules:` 배열에 객체 단위로 추가한다. 각 객체 내부에는 `test:` 로 loader 가 처리해야 할 파일의 패턴 (정규표현식) 을 넣고, `use:` 에 배열로 사용할 loader 를 명시한다

```javascript
/* webpack.config.js */
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/, // .js 확장자로 끝나는 모든 파일
        use: [path.resolve("./my-webpack-loader.js")], // 방금 만든 로더를 적용한다
      },
    ],
  },
};
```

- - js 파일이 2개이므로, console log 가 2번 찍힌다

- 웹팩 로더는 각 파일을 처리하기 위한 것이다. 각 파일의 패턴을 명시하고, 패턴에 걸리는 파일에 `use:` 에 설정한 loader 함수가 돌아간다. 파일이 여러 개면 loader 함수도 여러 번 돈다

&nbsp;

### 자주 사용하는 Loader

#### css-loader

- css 파일에 `css-loader` 를 설정하면 js 에서 `import` 구문을 이용해 css 파일을 모듈로 불러올 수 있다. webpack loader 가 `app.css` 파일을 모듈로 바꿔준다

- 먼저 loader 를 설치하고, `webpack.config.js` 를 설정하면 webpack 이 entry point 부터 시작해서 연결된 모든 모듈을 검색한다. 그러다 `.css` 파일을 만나면 `css-loader` 가 동작한다

```javascript
/* webpack.config.js */
module: {
    rules: [
      {
        test: /\.css$/, // .css 확장자로 끝나는 모든 파일
        use: ["css-loader"], // css-loader를 적용한다
      },
    ],
},
```

- - `dist/main.js` 결과물에 css 내용이 js 문자열로 들어간다

&nbsp;

- `html 코드`가 `dom` 으로 변환돼야 브라우저에서 문서가 보이듯, `css 코드`도 `cssom` 형태로 바뀌어야 브라우저에 보인다

- 그렇게 하려면 `html 파일`에서 `css` 코드를 직접 불러오거나 `inline script` 로 넣어줘야 하는데, `css-loader` 만 사용해서는 _**js 파일 내부**_ 에 _**css 코드**_ 가 있으므로 _**브라우저에서 보이지 않는다**_

&nbsp;

#### style-loader

- style-loader 는 js 로 변경된 style 코드를 html 에 넣어주는 로더이다. css 코드를 모듈로 사용하고, 웹팩으로 번들링하려면 `css-loader`, `style-loader` 를 모두 사용해야 한다

- loader 는 배열의 뒤 → 앞 순서로 적용된다. `style-loader` 까지 적용하면, css 코드가 document <head> 에 inline style 형식으로 들어간다

```javascript
{
    test: /\.css$/, // .css 확장자로 끝나는 모든 파일
    use: ["style-loader", "css-loader"],
},
```

&nbsp;

#### file-loader

- loader 는 css 뿐 아니라 img 파일도 처리할 수 있다. `file-loader` 는 파일을 모듈 형태로 지원하고, 웹팩 아웃풋에 파일을 옮겨준다

- 예를 들어 CSS 에서 `url()` 에 img 파일 경로를 지정하면 웹팩은 `file-loader` 를 이용해 이 파일을 처리한다

```css
/* style.css */
body {
  background-image: url(bg.png);
}
```

```javascript
/* webpack.config.js */
{
    test: /\.png$/, // .png 확장자로 마치는 모든 파일
    loader: "file-loader", // 파일 로더를 적용한다
},
```

- `npm run build` 하면 img 파일이 이동되나, 파일명이 해시값이다. 웹팩은 빌드할 때마다 unique 한 해시값을 생성한다

  - 정적 파일 (js, css, img, font 등) 의 경우 브라우저에서 성능을 위해 캐시한다

&nbsp;

- `index.html` 파일 위치 기준으로 보면 img 파일이 같은 폴더가 아니라 src 폴더 내에 있으므로 파일 경로도 수정해줘야 한다

  - `publicPath` 는 `file-loader` 가 처리하는 파일을 모듈로 사용했을 때 경로 앞에 추가되는 문자열
  - `name` 은 `file-loader` 가 파일을 `output` 에 복사할 때 사용하는 파일명

```javascript
{
    test: /\.png$/,
    loader: "file-loader",
    options: {
        publicPath: "./dist/",
        name: "[name].[ext]?[hash]", //  캐시 무력화를 위해 query string 으로 매번 달라진 해시값을 입력
    },
},
```

&nbsp;

#### url-loader

- 사용하는 img 가 많아지면 네트워크에 부담이 되고, 사이트 성능에도 영향을 미친다. 그래서 `data URI 스키마`를 이용하는 것이 좋다

```html
<img
  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38G
          IAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
  alt="Red dot"
/>
```

- `img` 태그 사용 시, img 경로 대신 `문자열 형태`로 넣을 수도 있다. `data format; encoding 방식; 문자열` 로 써주면, 이 문자열을 `img` 로 렌더링한다. 작은 파일들은 이렇게 _**바로 html**_ 로 넣어주는 것이 효율적이다

  - src 에 주소를 넣으면 한번 더 network 통신을 한다. 문자열로 넣어주면 네트워크 통신없이 바로 화면을 그려준다

&nbsp;

- `url-loader` 는 작은 img 파일을 base64 로 인코딩해서 js 문자열로 변환하는 로더이다

- 기존의 `file-loader` 를 `url-loader` 로 대체하고, `options` 에 `limit:` 을 넣고 number 를 써주면, number 미만 파일은 `url-loader` 가 처리해 base64 로 js 문자열로 변환하고, number 이상 파일은 `file-loader` 가 처리해 파일을 복사한다

```javascript
{
    test: /\.(png|jpg|gif|svg)$/,
    loader: "url-loader",
    options: {
        publicPath: "./dist/",
        name: "[name].[ext]?[hash]",
        limit: 20000, // 20kb
    },
},
```

&nbsp;

## 정리

- `css-loader`: css 파일을 js 모듈 처럼 사용할 수 있도록 css 파일을 처리
- `style-loader`: js 문자열로 된 stylesheet 코드를 html 에 주입시켜 브라우저에 style 을 적용
- `file-loader`: img 파일을 모듈로 사용할 수 있도록 변환하며, 파일을 output 경로로 복사 (이동)
- `url-loader`: 파일을 _**base64**_ 로 encoding 해서 js 문자열로 변환. 처리할 파일의 크기 제한을 둬서 일정크기 미만만 처리하고, 나머지는 _**file-loader**_ 로 위임. 파일은 output 경로로 이동
