/* Mockup behaviour only. On the real site Elementor, HFE and TablePress supply these. */
(function () {
  // Elementor Toggle: answers closed until clicked
  document.querySelectorAll('.elementor-toggle .elementor-tab-title').forEach(function (t) {
    function flip() { var c = document.getElementById(t.getAttribute('aria-controls')); var open = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', open ? 'false' : 'true'); t.classList.toggle('elementor-active', !open); if (c) c.hidden = open; }
    t.addEventListener('click', flip); t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  });
  // Side menu: + / − opens a section without leaving the page
  document.querySelectorAll('.rpad-sidenav .sub-arrow').forEach(function (s) {
    s.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); var ul = s.closest('li').querySelector(':scope > ul'); if (!ul) return; ul.hidden = !ul.hidden; s.textContent = ul.hidden ? '+' : '−'; });
  });
  // TablePress search box filters its own table; the page search box filters every table on the page
  function filter(tables, q) { q = q.trim().toLowerCase(); tables.forEach(function (tb) { tb.querySelectorAll('tbody tr').forEach(function (tr) { tr.hidden = q && tr.textContent.toLowerCase().indexOf(q) < 0; }); }); }
  document.querySelectorAll('.dt-search input').forEach(function (i) { var t = i.closest('.dt-container').querySelector('table'); i.addEventListener('input', function () { filter([t], i.value); }); });
  document.querySelectorAll('.rpad-search input').forEach(function (i) { i.addEventListener('input', function () { filter([].slice.call(document.querySelectorAll('table.tablepress')), i.value); }); });
  // phone menu
  var tg = document.querySelector('#masthead .elementor-menu-toggle'), dd = document.querySelector('#masthead nav.elementor-nav-menu--dropdown');
  if (tg && dd) tg.addEventListener('click', function () { var o = tg.classList.toggle('elementor-active'); tg.setAttribute('aria-expanded', o); dd.style.cssText = o ? 'display:block;position:absolute;left:0;right:0;top:100%;background:#fff;z-index:99;box-shadow:0 6px 12px rgba(0,0,0,.15)' : ''; dd.setAttribute('aria-hidden', !o); });
})();
