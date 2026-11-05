/* Stand-in for Elementor / HFE / TablePress scripts (they do this on a live WordPress site). */
(function () {
  // Elementor Toggle: answers closed until clicked
  document.querySelectorAll('.elementor-toggle .elementor-tab-title').forEach(function (t) {
    function flip() { var c = document.getElementById(t.getAttribute('aria-controls')); var open = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', open ? 'false' : 'true'); t.classList.toggle('elementor-active', !open); if (c) c.hidden = open; }
    t.addEventListener('click', flip); t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  });
  // HFE vertical menu: the + / − opens a sub-menu in place; the item's text goes to its page (HFE "link redirects to child" off)
  document.querySelectorAll('.hfe-nav-menu__layout-vertical .sub-arrow').forEach(function (s) {
    s.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); var ul = s.closest('li').querySelector(':scope > ul'); if (!ul) return; ul.hidden = !ul.hidden; var i = s.querySelector('i') || s; i.textContent = ul.hidden ? '+' : '−'; });
  });
  // TablePress search box filters its own table; the page search box filters every table on the page
  function filter(tables, q) { q = q.trim().toLowerCase(); tables.forEach(function (tb) { tb.querySelectorAll('tbody tr').forEach(function (tr) { tr.hidden = q && tr.textContent.toLowerCase().indexOf(q) < 0; }); }); }
  document.querySelectorAll('.dt-search input').forEach(function (i) { var t = i.closest('.dt-container').querySelector('table'); i.addEventListener('input', function () { filter([t], i.value); }); });
  document.querySelectorAll('.rpad-search input').forEach(function (i) { i.addEventListener('input', function () { filter([].slice.call(document.querySelectorAll('table.tablepress')), i.value); }); });
  // phone menu
  var tg = document.querySelector('#masthead .elementor-menu-toggle'), dd = document.querySelector('#masthead nav.elementor-nav-menu--dropdown');
  if (tg && dd) tg.addEventListener('click', function () { var o = tg.classList.toggle('elementor-active'); tg.setAttribute('aria-expanded', o); dd.style.cssText = o ? 'display:block;position:absolute;left:0;right:0;top:100%;background:#fff;z-index:99;box-shadow:0 6px 12px rgba(0,0,0,.15)' : ''; dd.setAttribute('aria-hidden', !o); });
})();
/* Elementor Slides (mockup): arrows, dots, autoplay every 6 s, pauses on hover/focus */
(function () {
  document.querySelectorAll('.rpad-slides .swiper').forEach(function (w) {
    var s = [].slice.call(w.querySelectorAll('.swiper-slide')), d = [].slice.call(w.querySelectorAll('.swiper-pagination-bullet')), i = 0, t;
    if (s.length < 2) return;
    function go(n) { i = (n + s.length) % s.length; s.forEach(function (x, k) { x.hidden = k !== i; x.classList.toggle('swiper-slide-active', k === i); }); d.forEach(function (x, k) { x.classList.toggle('swiper-pagination-bullet-active', k === i); x.setAttribute('aria-current', k === i); }); }
    function key(el, f) { el.addEventListener('click', f); el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }); }
    key(w.querySelector('.elementor-swiper-button-next'), function () { go(i + 1); });
    key(w.querySelector('.elementor-swiper-button-prev'), function () { go(i - 1); });
    d.forEach(function (x, k) { key(x, function () { go(k); }); });
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function play() { if (!still) { clearInterval(t); t = setInterval(function () { go(i + 1); }, 6000); } }
    w.addEventListener('mouseenter', function () { clearInterval(t); }); w.addEventListener('mouseleave', play);
    w.addEventListener('focusin', function () { clearInterval(t); }); w.addEventListener('focusout', play);
    play();
  });
})();
/* search boxes inside the page content filter the tables on that page (TablePress does this on the real site) */
(function () {
  document.querySelectorAll('.elementor-widget-text-editor input[type=search]').forEach(function (i) {
    i.addEventListener('input', function () { var q = i.value.trim().toLowerCase();
      document.querySelectorAll('table.tablepress tbody tr').forEach(function (tr) { if (tr.querySelector('th')) return; tr.hidden = q && tr.textContent.toLowerCase().indexOf(q) < 0; }); });
  });
})();
/* Elementor Tabs (mockup) */
(function () {
  document.querySelectorAll('.elementor-tabs').forEach(function (w) {
    var t = w.querySelectorAll('.elementor-tab-title'), c = w.querySelectorAll('.elementor-tab-content');
    t.forEach(function (x, i) { function go() { t.forEach(function (y, j) { y.classList.toggle('elementor-active', j === i); y.setAttribute('aria-selected', j === i); }); c.forEach(function (y, j) { y.hidden = j !== i; y.classList.toggle('elementor-active', j === i); }); }
      x.addEventListener('click', go); x.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
  });
})();

/* Elementor Accordion: one item open at a time */
(function () {
  document.querySelectorAll('.elementor-accordion').forEach(function (acc) {
    var items = [].slice.call(acc.querySelectorAll('.elementor-accordion-item'));
    items.forEach(function (it) { var t = it.querySelector('.elementor-tab-title'), c = it.querySelector('.elementor-tab-content');
      function go() { var open = t.classList.contains('elementor-active');
        items.forEach(function (o) { var ot = o.querySelector('.elementor-tab-title'), oc = o.querySelector('.elementor-tab-content'); ot.classList.remove('elementor-active'); ot.setAttribute('aria-expanded', 'false'); oc.hidden = true; oc.classList.remove('elementor-active'); });
        if (!open) { t.classList.add('elementor-active'); t.setAttribute('aria-expanded', 'true'); c.hidden = false; c.classList.add('elementor-active'); } }
      t.addEventListener('click', go); t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
  });
})();

/* Search pop-up: the magnifying glass opens it, × / Esc / clicking outside closes it */
(function () {
  var m = document.querySelector(".rpad-search-modal"); if (!m) return; var last;
  function open(e) { e.preventDefault(); last = document.activeElement; m.hidden = false; m.querySelector("input").focus(); }
  function close() { m.hidden = true; if (last) last.focus(); }
  document.querySelectorAll("a[aria-label=\"Open site search\"]").forEach(function (a) { a.addEventListener("click", open); });
  m.querySelector(".dialog-close-button").addEventListener("click", close);
  m.addEventListener("click", function (e) { if (e.target === m) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !m.hidden) close(); });
})();

/* Side menu group labels (not pages, e.g. "For homeowners"): clicking the words opens/closes them too (HFE: click opens sub-menu) */
(function () {
  function toggle(li, e) { var ul = li.querySelector(":scope > ul"); if (!ul) return; e.preventDefault(); ul.hidden = !ul.hidden; var s = li.querySelector(":scope > * .sub-arrow i, :scope > * .sub-arrow, :scope > .hfe-has-submenu-container .sub-arrow"); if (s) { var t = s.querySelector("i") || s; t.textContent = ul.hidden ? "+" : "−"; } }
  document.querySelectorAll(".hfe-nav-menu__layout-vertical a.hfe-menu-item[href=\"#\"], .hfe-nav-menu__layout-vertical a.hfe-sub-menu-item[href=\"#\"]").forEach(function (a) { a.addEventListener("click", function (e) { if (e.target.closest(".sub-arrow")) return; toggle(a.closest("li"), e); }); });
  document.querySelectorAll(".rpad-sidenav .rpad-navhead > .hfe-menu-item").forEach(function (sp) { sp.style.cursor = "pointer"; sp.setAttribute("role", "button"); sp.setAttribute("tabindex", "0");
    function go(e) { if (e.target.closest(".sub-arrow")) return; toggle(sp.closest("li"), e); }
    sp.addEventListener("click", go); sp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") go(e); }); });
})();
