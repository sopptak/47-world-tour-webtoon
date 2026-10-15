// 실행: node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const data = require("../data/episodes.js");
const core = require("../assets/js/core.js");
const episodes = core.buildEpisodes(data);

test("전체 200화가 1화부터 순서대로 있다", () => {
  assert.equal(episodes.length, 200);
  episodes.forEach((ep, i) => {
    assert.equal(ep.no, i + 1);
    assert.ok(ep.title.trim(), `${ep.code} 제목이 비어 있음`);
  });
});

test("이야기 구간이 1~200화를 빈틈·겹침 없이 덮는다", () => {
  let expected = 1;
  for (const arc of data.arcs) {
    assert.equal(arc.start, expected, `${arc.name} 시작 회차`);
    assert.ok(arc.end >= arc.start);
    expected = arc.end + 1;
  }
  assert.equal(expected, 201);
  assert.ok(episodes.every((ep) => ep.arcId));
});

test("기존 사이트의 1~3화 제목을 유지한다", () => {
  assert.equal(episodes[0].title, "47세, 세계일주를 꿈꾸다");
  assert.equal(episodes[1].title, "세계일주에는 돈이 얼마나 들까");
  assert.equal(episodes[2].title, "그런데 내 통장에는…");
});

test("원고가 등록되지 않은 회차는 공개로 표시되지 않는다", () => {
  for (const ep of episodes) {
    const ms = data.manuscripts[ep.no];
    assert.equal(ep.published, !!(ms && ms.images && ms.images.length), ep.code);
  }
});

test("등록된 원고 이미지 파일이 실제로 존재한다", () => {
  for (const ep of episodes) {
    for (const src of ep.images) {
      assert.ok(fs.existsSync(path.join(ROOT, src)), `없는 파일: ${src}`);
    }
  }
});

test("회차 번호 검색", () => {
  for (const q of ["12", "012", "EP.12", "ep 12", "12화"]) {
    assert.equal(core.parseEpisodeNumber(q), 12, q);
  }
  assert.equal(core.parseEpisodeNumber("통장"), null);
  const r = core.filterEpisodes(episodes, { query: "EP.012" });
  assert.ok(r.some((ep) => ep.no === 12));
});

test("제목 검색은 공백을 무시하고 부분 일치한다", () => {
  const r = core.filterEpisodes(episodes, { query: "통장" });
  assert.ok(r.length >= 2);
  assert.ok(r.every((ep) => ep.title.includes("통장")));
  assert.ok(core.filterEpisodes(episodes, { query: "세계 일주" }).some((ep) => ep.no === 1));
});

test("구간 필터와 검색어를 함께 적용한다", () => {
  const money = core.filterEpisodes(episodes, { arc: "money" });
  assert.equal(money.length, 35);
  assert.ok(money.every((ep) => ep.no >= 21 && ep.no <= 55));
  assert.deepEqual(core.filterEpisodes(episodes, { arc: "money", query: "통장" }).map((e) => e.no), [28]);
  assert.equal(core.filterEpisodes(episodes, { query: "없는제목xyz" }).length, 0);
});

test("이전 화·다음 화 이동", () => {
  const first = core.neighbors(episodes, 1);
  assert.equal(first.prev, null);
  assert.equal(first.next.no, 2);
  const mid = core.neighbors(episodes, 100);
  assert.equal(mid.prev.no, 99);
  assert.equal(mid.next.no, 101);
  assert.equal(core.neighbors(episodes, 200).next, null);
});

test("잘못된 회차 주소 처리", () => {
  assert.equal(core.parseNoParam("?no=5", 200), 5);
  for (const s of ["", "?no=0", "?no=201", "?no=abc", "?no=-3", "?no=1.5"]) {
    assert.equal(core.parseNoParam(s, 200), null, s);
  }
});

test("HTML이 참조하는 로컬 파일이 모두 존재하고 외부 스크립트·추적 코드가 없다", () => {
  for (const page of ["index.html", "episode.html"]) {
    const html = fs.readFileSync(path.join(ROOT, page), "utf8");
    assert.ok(html.startsWith("<!doctype html>"), `${page}: doctype으로 시작해야 함`);
    for (const [, ref] of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
      if (ref === "./") continue;
      assert.ok(!/^https?:|^\/\//.test(ref), `${page}: 외부 리소스 ${ref}`);
      assert.ok(fs.existsSync(path.join(ROOT, ref)), `${page}: 없는 파일 ${ref}`);
    }
  }
  const sources = ["index.html", "episode.html", "assets/js/list.js", "assets/js/viewer.js", "assets/js/core.js"]
    .map((f) => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n");
  assert.doesNotMatch(sources, /googletagmanager|google-analytics|gtag\(|adsbygoogle|fbq\(|analytics/i);
});
