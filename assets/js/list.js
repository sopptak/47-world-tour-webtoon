(function () {
  var data = window.WEBTOON_DATA;
  var core = window.WebtoonCore;
  var episodes = core.buildEpisodes(data);

  var input = document.getElementById("q");
  var chipsEl = document.getElementById("arc-chips");
  var listEl = document.getElementById("episode-list");
  var countEl = document.getElementById("result-count");
  var summaryEl = document.getElementById("publish-summary");

  var params = new URLSearchParams(location.search);
  var state = {
    query: params.get("q") || "",
    arc: data.arcs.some(function (a) { return a.id === params.get("arc"); }) ? params.get("arc") : "all"
  };
  input.value = state.query;

  var publishedCount = episodes.filter(function (ep) { return ep.published; }).length;
  summaryEl.textContent = "공개 " + publishedCount + "화 · 준비 중 " + (episodes.length - publishedCount) + "화";

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }

  function renderChips() {
    chipsEl.textContent = "";
    [{ id: "all", name: "전체" }].concat(data.arcs).forEach(function (arc) {
      var b = el("button", { type: "button", "class": "chip", "data-arc": arc.id, "aria-pressed": String(state.arc === arc.id) }, arc.name);
      chipsEl.appendChild(b);
    });
  }

  function card(ep) {
    var li = el("li");
    var a = el("a", { "class": "card", id: "ep-" + core.pad3(ep.no), href: "episode.html?no=" + ep.no });
    a.appendChild(el("span", { "class": "num" }, ep.code));
    a.appendChild(el("strong", {}, ep.title));
    a.appendChild(el("span", { "class": "status" + (ep.published ? " open" : "") }, ep.published ? "공개" + (ep.date ? " · " + ep.date : "") : "준비 중"));
    li.appendChild(a);
    return li;
  }

  function render() {
    var result = core.filterEpisodes(episodes, state);
    listEl.textContent = "";
    countEl.textContent = (state.query || state.arc !== "all") ? "검색 결과 " + result.length + "화" : "전체 " + result.length + "화";

    if (!result.length) {
      listEl.appendChild(el("p", { "class": "empty" }, "조건에 맞는 회차가 없습니다."));
      return;
    }
    data.arcs.forEach(function (arc) {
      var items = result.filter(function (ep) { return ep.arcId === arc.id; });
      if (!items.length) return;
      var h = el("h3", { "class": "arc-title" }, arc.name);
      h.appendChild(el("span", {}, "EP." + core.pad3(arc.start) + "–" + core.pad3(arc.end)));
      listEl.appendChild(h);
      var ul = el("ul", { "class": "cards" });
      items.forEach(function (ep) { ul.appendChild(card(ep)); });
      listEl.appendChild(ul);
    });
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.query) p.set("q", state.query);
    if (state.arc !== "all") p.set("arc", state.arc);
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  function update() { render(); syncUrl(); }

  input.addEventListener("input", function () { state.query = input.value.trim(); update(); });
  document.getElementById("search-form").addEventListener("submit", function (e) { e.preventDefault(); input.blur(); });
  document.getElementById("reset").addEventListener("click", function () {
    state.query = ""; state.arc = "all"; input.value = ""; renderChips(); update();
  });
  chipsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    state.arc = b.getAttribute("data-arc");
    renderChips(); update();
  });

  renderChips();
  render();

  // 읽기 화면에서 "목록으로" 돌아오면 해당 회차를 강조하고 그 위치로 이동
  var m = location.hash.match(/^#ep-(\d{3})$/);
  if (m) {
    var target = document.getElementById("ep-" + m[1]);
    if (target) {
      target.classList.add("target");
      target.scrollIntoView({ block: "center" });
    }
  }
})();
