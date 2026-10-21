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

test("EP.002 정본 원고를 20컷으로 공개한다", () => {
  const ep = episodes[1];
  assert.equal(ep.title, "세계일주에는 돈이 얼마나 들까");
  assert.equal(ep.published, true);
  assert.equal(ep.images.length, 20);
  assert.ok(ep.images.every((src, i) => src === `episodes/002/${String(i + 1).padStart(2, "0")}.svg`));
});

test("EP.003을 20컷 세로 배열과 한국어 대사로 공개한다", () => {
  const ep = episodes[2];
  assert.equal(ep.title, "그런데 내 통장에는…");
  assert.equal(ep.published, true);
  assert.equal(ep.images.length, 20);
  assert.ok(ep.images.every((src, i) => src === `episodes/003/${String(i + 1).padStart(2, "0")}.svg`));
  const dialogue = fs.readFileSync(path.join(ROOT, "data/dialogues.js"), "utf8");
  assert.match(dialogue, /고3 아들은 입시 일정이 있고/);
  assert.match(dialogue, /중1 딸도 자기 생활이 있지/);
  assert.match(dialogue, /그래도 순수익은 아니네/);
});

test("EP.001을 기존 그림의 20컷 세로 배열로 공개한다", () => {
  const ep = episodes[0];
  assert.equal(ep.published, true);
  assert.equal(ep.images.length, 20);
  assert.ok(ep.images.every((src, i) => src === `episodes/001/${String(i + 1).padStart(2, "0")}.svg`));
});

test("EP.001~004는 같은 캐릭터 디자인의 20컷 SVG와 한국어 말풍선을 사용한다", () => {
  const dialogues = require("../data/dialogues.js");
  for (let no = 1; no <= 4; no++) {
    const ep = episodes[no - 1];
    assert.equal(ep.images.length, 20, ep.code);
    assert.ok(ep.images.every((src, i) => src === `episodes/${String(no).padStart(3, "0")}/${String(i + 1).padStart(2, "0")}.svg`));
    assert.equal(dialogues[no].length, 20, `${ep.code} 말풍선 수`);
    assert.ok(dialogues[no].every((line) => line.trim()), `${ep.code} 빈 대사`);
    for (const src of ep.images) {
      const svg = fs.readFileSync(path.join(ROOT, src), "utf8");
      assert.match(svg, /viewBox="0 0 720 900"/);
      assert.match(svg, /ellipse cx="120" cy="126" rx="76" ry="89"/);
      assert.match(svg, /role="img" aria-label="웹툰 장면 삽화"/);
      assert.doesNotMatch(svg, /컷\s*\d|panel\s*\d/i, `${src}: 그림에 컷 번호가 노출됨`);
    }
  }
  const page = fs.readFileSync(path.join(ROOT, "episode.html"), "utf8");
  assert.match(page, /data\/dialogues\.js/);
  assert.match(fs.readFileSync(path.join(ROOT, "assets/js/viewer.js"), "utf8"), /panel-caption is-top/);
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

// JPEG(SOFn)·WebP(VP8/VP8L/VP8X) 헤더에서 가로·세로 크기를 읽는다 (외부 라이브러리 없이)
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString("utf8", 0, 256).includes("<svg")) {
    const svg = b.toString("utf8");
    const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    return viewBox ? { type: "svg", width: Number(viewBox[1]), height: Number(viewBox[2]) } : null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { type: "jpeg", height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { type: "webp", width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { type: "webp", width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const v = b.readUInt32LE(21);
      return { type: "webp", width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

test("등록된 원고 이미지는 실제 이미지이며 모바일에서 선명하게 볼 만한 해상도다", () => {
  for (const ep of episodes) {
    for (const src of ep.images) {
      const size = imageSize(path.join(ROOT, src));
      assert.ok(size, `이미지 헤더를 읽을 수 없음: ${src}`);
      // 375px 화면(2배율)에서 크게 흐려지지 않도록 가로 640px 이상
      assert.ok(size.width >= 640, `${src}: 가로 ${size.width}px`);
      // 컷 단위로 나눈 이미지인지 확인 (지나치게 긴 통짜 이미지 방지)
      assert.ok(size.height / size.width <= 2, `${src}: 세로로 너무 긴 이미지 ${size.width}x${size.height}`);
    }
  }
});

test("읽기 화면은 원고를 화면 너비에 맞추고 원본 비율을 유지한다", () => {
  const css = fs.readFileSync(path.join(ROOT, "assets/css/style.css"), "utf8");
  const viewer = css.match(/\.viewer\{([^}]*)\}/);
  const img = css.match(/\.viewer img\{([^}]*)\}/);
  assert.ok(viewer && img, ".viewer 스타일이 있어야 함");
  assert.match(viewer[1], /width:100%/);
  assert.match(viewer[1], /max-width:var\(--reader\)/);
  assert.match(img[1], /width:100%/);
  assert.match(img[1], /height:auto/);
  // 고정 높이·object-fit으로 컷을 자르거나 늘리지 않는다
  assert.doesNotMatch(img[1], /object-fit|(?:^|;)height:\d/);
  const html = fs.readFileSync(path.join(ROOT, "episode.html"), "utf8");
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
});

test("EP.003 최종 대본은 20컷이고 다음 화로 연결한다", () => {
  const file = path.join(ROOT, "scripts/episodes/003.md");
  const md = fs.readFileSync(file, "utf8").replace(/\r/g, "");
  assert.equal(md.split("\n")[0], `# ${episodes[2].code} ${episodes[2].title}`);
  const cuts = md.split(/^### 컷 /m).slice(1);
  assert.equal(cuts.length, 20);
  cuts.forEach((cut, i) => {
    assert.ok(cut.startsWith(String(i + 1)), `EP.003 컷 번호 순서 (${i + 1})`);
    for (const field of ["장면", "인물", "배경", "대사/내레이션", "연출"]) {
      assert.match(cut, new RegExp(`\\*\\*${field}\\*\\*: \\S`), `EP.003 컷 ${i + 1}: ${field} 누락`);
    }
  });
  assert.ok(cuts[19].includes(`「EP.04 ${episodes[3].title}」`), "EP.003 다음 화 예고");
  assert.equal(episodes[2].published, true);
});

test("EP.004 최종 대본은 20컷이고 다음 화로 연결한다", () => {
  const file = path.join(ROOT, "scripts/episodes/004.md");
  const md = fs.readFileSync(file, "utf8").replace(/\r/g, "");
  assert.equal(md.split("\n")[0], `# ${episodes[3].code} ${episodes[3].title}`);
  const cuts = md.split(/^### 컷 /m).slice(1);
  assert.equal(cuts.length, 20);
  cuts.forEach((cut, i) => {
    assert.ok(cut.startsWith(String(i + 1)), `EP.004 컷 번호 순서 (${i + 1})`);
    for (const field of ["장면", "인물", "배경", "대사/내레이션", "연출"]) {
      assert.match(cut, new RegExp(`\\*\\*${field}\\*\\*: \\S`), `EP.004 컷 ${i + 1}: ${field} 누락`);
    }
  });
  assert.ok(cuts[19].includes(`「EP.05 ${episodes[4].title}」`), "EP.004 다음 화 예고");
  assert.equal(episodes[3].published, true);
});

test("EP.005를 14컷으로 공개하고 EP.006~012 대본은 비공개로 유지한다", () => {
  const ep5 = episodes[4];
  const dialogue = require("../data/dialogues.js");
  assert.equal(ep5.title, "서랍 속 오래된 지도");
  assert.equal(ep5.published, true);
  assert.equal(ep5.images.length, 14);
  assert.equal(dialogue[5].length, 14);
  assert.ok(dialogue[5][0].includes("주말에 안방 서랍장 정리하자"));
  assert.ok(dialogue[5][13].includes("그 선을 그었던 사람은"));
  for (let no = 6; no <= 12; no++) {
    const file = path.join(ROOT, `scripts/episodes/${core.pad3(no)}.md`);
    assert.ok(fs.existsSync(file), `없는 대본: ${file}`);
    const md = fs.readFileSync(file, "utf8").replace(/\r/g, "");
    const ep = episodes[no - 1];
    assert.equal(md.split("\n")[0], `# ${ep.code} ${ep.title}`, `${ep.code} 제목 불일치`);
    const cuts = md.split(/^### 컷 /m).slice(1);
    assert.ok(cuts.length >= 12 && cuts.length <= 16, `${ep.code} 컷 수 ${cuts.length}`);
    cuts.forEach((cut, i) => {
      assert.ok(cut.startsWith(String(i + 1)), `${ep.code} 컷 번호 순서 (${i + 1})`);
      for (const field of ["장면", "인물", "배경", "대사/내레이션", "연출"]) {
        assert.match(cut, new RegExp(`\\*\\*${field}\\*\\*: \\S`), `${ep.code} 컷 ${i + 1}: ${field} 누락`);
      }
    });
    // 마지막 컷은 다음 화 예고 띠로 끝난다
    const next = episodes[no];
    assert.ok(cuts[cuts.length - 1].includes(`「EP.${String(next.no).padStart(2, "0")} ${next.title}」`), `${ep.code} 다음 화 예고 띠`);
    assert.equal(ep.published, false, `${ep.code}는 대본 검토 전이므로 공개하면 안 됨`);
  }
});
