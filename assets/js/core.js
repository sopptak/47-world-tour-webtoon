/* 회차 목록·검색·이동에 쓰는 순수 함수 (브라우저와 Node 테스트 양쪽에서 사용) */
(function (root) {
  function pad3(n) {
    return String(n).padStart(3, "0");
  }

  function buildEpisodes(data) {
    return data.titles.map(function (title, i) {
      var no = i + 1;
      var arc = data.arcs.find(function (a) { return no >= a.start && no <= a.end; }) || null;
      var ms = data.manuscripts[no];
      var images = ms && Array.isArray(ms.images) ? ms.images.filter(Boolean) : [];
      return {
        no: no,
        code: "EP." + pad3(no),
        title: title,
        arcId: arc ? arc.id : null,
        arcName: arc ? arc.name : "",
        date: ms && ms.date ? ms.date : "",
        images: images.map(function (file) { return "episodes/" + pad3(no) + "/" + file; }),
        published: images.length > 0
      };
    });
  }

  function normalize(s) {
    return String(s).toLowerCase().replace(/\s+/g, "");
  }

  // "12", "012", "EP.12", "ep12", "12화" 같은 입력을 회차 번호로 해석
  function parseEpisodeNumber(query) {
    var m = String(query).trim().toLowerCase().match(/^(?:ep\.?\s*)?0*(\d{1,3})\s*화?$/);
    return m ? parseInt(m[1], 10) : null;
  }

  function filterEpisodes(episodes, opts) {
    var arc = (opts && opts.arc) || "all";
    var query = (opts && opts.query) || "";
    var q = normalize(query);
    var num = parseEpisodeNumber(query);
    return episodes.filter(function (ep) {
      if (arc !== "all" && ep.arcId !== arc) return false;
      if (!q) return true;
      if (num !== null && ep.no === num) return true;
      return normalize(ep.title).indexOf(q) !== -1 || normalize(ep.code).indexOf(q) !== -1;
    });
  }

  function neighbors(episodes, no) {
    var i = episodes.findIndex(function (ep) { return ep.no === no; });
    if (i === -1) return { prev: null, current: null, next: null };
    return { prev: episodes[i - 1] || null, current: episodes[i], next: episodes[i + 1] || null };
  }

  function parseNoParam(search, total) {
    var raw = new URLSearchParams(search).get("no");
    if (!raw || !/^\d+$/.test(raw)) return null;
    var no = parseInt(raw, 10);
    return no >= 1 && no <= total ? no : null;
  }

  var api = {
    pad3: pad3,
    buildEpisodes: buildEpisodes,
    parseEpisodeNumber: parseEpisodeNumber,
    filterEpisodes: filterEpisodes,
    neighbors: neighbors,
    parseNoParam: parseNoParam
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.WebtoonCore = api;
})(this);
