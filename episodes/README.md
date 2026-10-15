# 원고 이미지 폴더

회차마다 세 자리 번호로 폴더를 만들고, 그 안에 컷 이미지를 순서대로 넣습니다.

```
episodes/
  001/
    01.jpg
    02.jpg
    03.jpg
  002/
    01.jpg
```

그다음 `data/episodes.js`의 `MANUSCRIPTS`에 등록합니다.

```js
var MANUSCRIPTS = {
  1: { date: "2026-11-01", images: ["01.jpg", "02.jpg", "03.jpg"] },
};
```

- 등록된 회차만 목록과 읽기 화면에서 "공개"로 표시됩니다.
- 이미지는 가로 800~1000px 정도의 JPG/WebP를 권장합니다(세로로 긴 이미지는 여러 장으로 나누면 로딩이 빠릅니다).
- `node --test tests/*.test.js`를 실행하면 등록한 파일이 실제로 있는지 확인합니다.
