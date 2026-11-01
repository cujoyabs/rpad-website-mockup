/* RPAD mockup runtime – renders the page template from the Component's renderVals(). */
(function () {
  'use strict';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    var parts = path.split('.');
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }
  function interp(str, scope) {
    var m = str.match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/);
    if (m) return lookup(scope, m[1]);
    return str.replace(HOLE, function (_, p) { var v = lookup(scope, p); return v == null ? '' : String(v); });
  }

  function render(node, scope, out) {
    if (node.nodeType === 3) { // text
      var t = node.nodeValue;
      if (t.indexOf('{{') >= 0) { var tv = interp(t, scope); t = tv == null ? '' : String(tv); }
      out.appendChild(document.createTextNode(t));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-if') {
      var cond = interp(node.getAttribute('value') || '', scope);
      if (cond) renderChildren(node, scope, out);
      return;
    }
    if (tag === 'sc-for') {
      var list = interp(node.getAttribute('list') || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var s = Object.create(scope);
        s[as] = list[i]; s.$index = i;
        renderChildren(node, s, out);
      }
      return;
    }
    var el = document.createElement(tag);
    var attrs = node.attributes;
    for (var a = 0; a < attrs.length; a++) {
      var name = attrs[a].name, val = attrs[a].value;
      if (name.indexOf('hint-') === 0) continue;
      var lname = name.toLowerCase();
      if (lname.indexOf('on') === 0 && /\{\{/.test(val)) {
        var fn = interp(val, scope);
        if (typeof fn === 'function') el.addEventListener(lname.slice(2), fn);
        continue;
      }
      var v = /\{\{/.test(val) ? interp(val, scope) : val;
      if (v === undefined || v === null || v === false) continue;
      if (lname === 'value' && (tag === 'input' || tag === 'select' || tag === 'textarea')) { el.setAttribute('value', v); el.__value = v; continue; }
      el.setAttribute(name, v === true ? '' : String(v));
    }
    renderChildren(node, scope, el);
    if (el.__value !== undefined) el.value = el.__value;
    out.appendChild(el);
  }
  function parseAttrs(str) {
    var o = {}, re = /([\w-]+)="([^"]*)"/g, m;
    while ((m = re.exec(str))) o[m[1]] = m[2];
    return o;
  }
  var OPEN = /^\s*sc-(for|if)\b([\s\S]*)$/, CLOSE = /^\s*\/sc-(for|if)\s*$/;
  function renderChildren(node, scope, out) { renderRange(node.firstChild, null, scope, out); }
  function renderRange(start, end, scope, out) {
    var c = start;
    while (c && c !== end) {
      if (c.nodeType === 8) { // comment: <!--sc-for list="…" as="…"--> … <!--/sc-for-->
        var m = c.nodeValue.match(OPEN);
        if (m && !CLOSE.test(c.nodeValue)) {
          var kind = m[1], attrs = parseAttrs(m[2]);
          var depth = 1, e = c.nextSibling;
          while (e) {
            if (e.nodeType === 8) {
              if (CLOSE.test(e.nodeValue)) { depth--; if (depth === 0) break; }
              else if (OPEN.test(e.nodeValue)) depth++;
            }
            e = e.nextSibling;
          }
          var bodyStart = c.nextSibling;
          if (kind === 'if') {
            if (interp(attrs.value || '', scope)) renderRange(bodyStart, e, scope, out);
          } else {
            var list = interp(attrs.list || '', scope) || [];
            var as = attrs.as || 'item';
            for (var i = 0; i < list.length; i++) {
              var s = Object.create(scope);
              s[as] = list[i]; s.$index = i;
              renderRange(bodyStart, e, s, out);
            }
          }
          c = e ? e.nextSibling : null;
          continue;
        }
        c = c.nextSibling; continue;
      }
      render(c, scope, out);
      c = c.nextSibling;
    }
  }

  window.DCLogic = function (props) { this.props = props || {}; this.state = {}; };
  DCLogic.prototype.setState = function (partial) {
    for (var k in partial) this.state[k] = partial[k];
    window.__rpadRender();
  };
  DCLogic.prototype.forceUpdate = function () { window.__rpadRender(); };

  window.rpadMount = function (Component, props, meta) {
    var tpl = document.getElementById('rpad-template');
    var root = document.getElementById('rpad-root');
    var inst = new Component(props);
    var optionsPanel = null;
    function doRender() {
      var active = document.activeElement, sel = null, focusId = null;
      if (active && active.id && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) { focusId = active.id; sel = [active.selectionStart, active.selectionEnd]; }
      var y = window.scrollY;
      var vals = inst.renderVals() || {};
      var frag = document.createDocumentFragment();
      renderChildren(tpl.content, vals, frag);
      root.innerHTML = '';
      root.appendChild(frag);
      if (focusId) { var f = document.getElementById(focusId); if (f) { f.focus(); try { f.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
      window.scrollTo(0, y);
    }
    window.__rpadRender = doRender;
    doRender();
    // Options panel for pages that have switchable parts
    var keys = Object.keys(meta || {}).filter(function (k) { return k[0] !== '$' && meta[k] && meta[k].editor; });
    if (keys.length) {
      var p = document.createElement('div');
      p.id = 'rpad-options';
      p.innerHTML = '<button type="button" id="rpad-options-toggle" aria-expanded="false">Options ▸</button><div id="rpad-options-body" hidden><div style="font-weight:700;margin-bottom:8px">Try the options we are deciding between</div></div>';
      document.body.appendChild(p);
      var body = p.querySelector('#rpad-options-body');
      keys.forEach(function (k) {
        var m = meta[k];
        var row = document.createElement('label');
        row.style.cssText = 'display:block;margin:6px 0;font-size:13px';
        var label = k.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); });
        if (m.editor === 'boolean') {
          var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!inst.props[k];
          cb.addEventListener('change', function () { inst.props[k] = cb.checked; doRender(); });
          row.appendChild(cb); row.appendChild(document.createTextNode(' ' + label));
        } else if (m.editor === 'enum') {
          row.appendChild(document.createTextNode(label + ' '));
          var selEl = document.createElement('select');
          (m.options || []).forEach(function (o) { var op = document.createElement('option'); op.value = o; op.textContent = o; if (o === inst.props[k]) op.selected = true; selEl.appendChild(op); });
          selEl.addEventListener('change', function () { inst.props[k] = selEl.value; doRender(); });
          row.appendChild(selEl);
        } else return;
        body.appendChild(row);
      });
      var tg = p.querySelector('#rpad-options-toggle');
      tg.addEventListener('click', function () { var open = body.hidden; body.hidden = !open; tg.setAttribute('aria-expanded', String(open)); tg.textContent = open ? 'Options ▾' : 'Options ▸'; });
    }
  };
})();
