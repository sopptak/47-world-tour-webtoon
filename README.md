# 47세, 세계일주

47세에 세계일주를 꿈꾸기 시작한 한 사람의 인생 후반전 준비기 웹툰 사이트입니다. 전체 200화로 기획했습니다.

외부 프레임워크·빌드 도구 없이 정적 파일만으로 동작하므로 GitHub Pages에 그대로 배포할 수 있습니다. 광고나 분석 추적 코드는 넣지 않았습니다.

현재 1~5화 원고를 공개하고 있습니다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `index.html` | 작품 소개 + 전체 200화 목록 (번호·제목 검색, 이야기 구간 필터) |
| `episode.html?no=N` | 회차 읽기 화면 (이전 화·다음 화, 전체 목록으로) |
| `data/episodes.js` | 이야기 구간, 회차 제목, 공개된 원고 목록 |
| `episodes/NNN/` | 회차별 원고 이미지 ([추가 방법](episodes/README.md)) |
| `assets/css/style.css` | 공통 스타일 |
| `assets/js/core.js` | 검색·필터·이동 로직 (테스트 대상) |
| `assets/js/list.js`, `assets/js/viewer.js` | 목록 화면, 읽기 화면 |
| `tests/site.test.js` | Node 내장 테스트 |

## 원고 공개하기

1. `episodes/001/01.jpg`처럼 이미지를 넣습니다.
2. `data/episodes.js`의 `MANUSCRIPTS`에 `1: { date: "2026-11-01", images: ["01.jpg"] }`처럼 등록합니다.
3. 등록하지 않은 회차는 자동으로 "준비 중"으로 표시됩니다.

회차 제목과 순서는 200화 기준 자료이므로 임의로 바꾸지 않습니다.

## 테스트

```bash
node --test tests/*.test.js
```

## 로컬에서 보기

```bash
python3 -m http.server 8000
# http://localhost:8000
```
