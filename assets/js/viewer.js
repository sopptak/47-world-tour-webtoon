(function () {
  var data = window.WEBTOON_DATA;
  var core = window.WebtoonCore;
  var episodes = core.buildEpisodes(data);
  var no = core.parseNoParam(location.search, episodes.length);

  var $ = function (id) { return document.getElementById(id); };
  var body = $("ep-body");
  var nav = $("ep-nav");

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }

  function placeholder(title, desc) {
    var box = el("div", { "class": "placeholder" });
    box.appendChild(el("strong", {}, title));
    box.appendChild(el("p", {}, desc));
    return box;
  }

  if (no === null) {
    document.title = "회차를 찾을 수 없습니다 · 47세, 세계일주";
    $("ep-title").textContent = "회차를 찾을 수 없습니다";
    body.appendChild(placeholder("존재하지 않는 회차입니다", "1화부터 " + episodes.length + "화 사이의 회차를 선택해 주세요."));
    var home = el("a", { "class": "to-list", href: "./#episodes" }, "전체 목록 보기");
    nav.style.gridTemplateColumns = "1fr";
    nav.appendChild(home);
    return;
  }

  var n = core.neighbors(episodes, no);
  var ep = n.current;
  var listHref = "./#ep-" + core.pad3(ep.no);

  document.title = ep.code + " " + ep.title + " · 47세, 세계일주";
  $("back-link").href = listHref;
  $("ep-arc").textContent = ep.arcName;
  $("ep-code").textContent = ep.code;
  $("ep-title").textContent = ep.title;
  $("ep-meta").textContent = ep.published ? (ep.date ? ep.date + " 공개" : "") : "준비 중 · 제목은 가제입니다";

  if (ep.published) {
    var viewer = el("div", { "class": "viewer" });
    ep.images.forEach(function (src, i) {
      var img = el("img", { src: src, alt: ep.code + " " + ep.title + " " + (i + 1) + "번째 컷", decoding: "async", tabindex: "0", role: "button", "aria-label": "확대해서 보기: " + ep.code + " " + ep.title });
      if (i > 1) img.loading = "lazy";
      img.addEventListener("click", function () { openImage(src, img.alt); });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openImage(src, img.alt);
        }
      });
      viewer.appendChild(img);
    });
    body.appendChild(viewer);
  } else {
    body.appendChild(placeholder("이 회차는 준비 중입니다", "아직 공개된 원고가 없습니다. 원고가 완성되면 이 자리에 공개됩니다."));
  }

  function navLink(target, label, cls) {
    if (!target) return el("span", { "class": "disabled " + cls }, label === "이전 화" ? "첫 회차입니다" : "마지막 회차입니다");
    var a = el("a", { "class": cls, href: "episode.html?no=" + target.no, rel: cls });
    a.appendChild(el("small", {}, (cls === "prev" ? "← " : "") + label + (cls === "next" ? " →" : "") + (target.published ? "" : " · 준비 중")));
    a.appendChild(el("span", {}, target.code + " " + target.title));
    return a;
  }

  nav.appendChild(navLink(n.prev, "이전 화", "prev"));
  nav.appendChild(el("a", { "class": "to-list", href: listHref }, "전체 목록"));
  nav.appendChild(navLink(n.next, "다음 화", "next"));

  function openImage(src, alt) {
    var overlay = el("div", { "class": "image-zoom", role: "dialog", "aria-modal": "true", "aria-label": "원고 확대 보기" });
    var close = el("button", { type: "button", "class": "image-zoom-close", "aria-label": "확대 보기 닫기" }, "닫기 ×");
    var zoomed = el("img", { src: src, alt: alt });
    close.addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    overlay.addEventListener("keydown", function (e) { if (e.key === "Escape") overlay.remove(); });
    overlay.appendChild(close);
    overlay.appendChild(zoomed);
    document.body.appendChild(overlay);
    close.focus();
  }

  // 키보드 ← → 로 회차 이동
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft" && n.prev) location.href = "episode.html?no=" + n.prev.no;
    if (e.key === "ArrowRight" && n.next) location.href = "episode.html?no=" + n.next.no;
  });
})();
