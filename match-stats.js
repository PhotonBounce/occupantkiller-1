/* ============================================================================
   OccupantKiller — Match Stats (additive, defensive, read-only).
   Round 8 — a stats layer derived entirely from existing game state:
     1. Live stats readout  — KILLS · TIME · WAVE · BEST STREAK (mid-left)
     2. Tactical callouts    — "HOSTILES INBOUND" / "AREA CLEAR" on count swings
     3. End-of-match summary — recap card on death / stage clear / victory
   Kills are inferred from drops in the live hostile count; nothing hooks combat.
   Honors window.__OK_EXTRAS.stats. Test hooks: window.MatchStats.testCallout/testSummary.
   ========================================================================== */
(function () {
  'use strict';
  function el(tag, css, parent) { var d = document.createElement(tag); if (css) d.style.cssText = css; (parent || document.body).appendChild(d); return d; }
  function alive(o) { if (!o) return false; if (o.alive === false) return false; if (typeof o.hp === 'number') return o.hp > 0; if (typeof o.health === 'number') return o.health > 0; return true; }
  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  var root = el('div', 'position:fixed;inset:0;pointer-events:none;z-index:949;display:none;font-family:"JetBrains Mono",monospace;');
  root.id = 'match-stats-root';  // so CSS can declutter the mid-left MATCH panel on mobile

  /* 1. Live stats readout ---------------------------------------------------- */
  var box = el('div',
    'position:absolute;left:12px;top:42%;transform:translateY(-50%);min-width:118px;'
    + 'padding:8px 11px;border-radius:8px;background:rgba(8,12,22,.5);'
    + 'border:1px solid rgba(124,252,138,.3);color:#dfffe8;font-size:11px;line-height:1.7;'
    + 'text-shadow:0 0 3px #000;', root);
  box.innerHTML =
    '<div style="color:#7CFC8A;font-size:9px;letter-spacing:2px;margin-bottom:3px">MATCH</div>'
    + '<div><span style="color:#9f9">KILLS</span> <b data-ms="kills">0</b></div>'
    + '<div><span style="color:#9cf">TIME</span> <b data-ms="time">0:00</b></div>'
    + '<div><span style="color:#fc9">WAVE</span> <b data-ms="wave">1</b></div>'
    + '<div><span style="color:#ffd24d">BEST</span> <b data-ms="best">x0</b></div>';
  var msK = box.querySelector('[data-ms="kills"]'), msT = box.querySelector('[data-ms="time"]'),
      msW = box.querySelector('[data-ms="wave"]'), msB = box.querySelector('[data-ms="best"]');

  /* 2. Tactical callout ------------------------------------------------------ */
  var callout = el('div',
    'position:absolute;left:50%;top:66%;transform:translate(-50%,-50%) scale(.9);'
    + 'font-size:20px;font-weight:800;letter-spacing:2px;opacity:0;transition:opacity .2s,transform .2s;'
    + 'text-shadow:0 0 10px #000,0 2px 4px #000;', root);
  var _coHideAt = 0;
  function showCallout(text, color) {
    callout.textContent = text;
    callout.style.color = color || '#ffd24d';
    callout.style.opacity = '1'; callout.style.transform = 'translate(-50%,-50%) scale(1)';
    _coHideAt = performance.now() + 1700;
  }

  /* 3. End-of-match summary -------------------------------------------------- */
  var summary = el('div',
    'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:280px;'
    + 'padding:22px 28px;border-radius:14px;background:rgba(8,12,22,.92);'
    + 'border:1px solid rgba(0,216,255,.45);box-shadow:0 12px 50px rgba(0,0,0,.6);'
    + 'color:#fff;text-align:center;opacity:0;transition:opacity .35s;display:none;', root);
  var _sumTitle = el('div', 'font-size:18px;font-weight:900;letter-spacing:3px;color:#ffd400;margin-bottom:14px;', summary);
  var _sumBody = el('div', 'font-size:13px;line-height:2;', summary);
  function showSummary(title) {
    _sumTitle.textContent = title || 'MATCH OVER';
    _sumBody.innerHTML =
      'KILLS <b style="color:#7CFC8A">' + _kills + '</b><br>'
      + 'TIME SURVIVED <b style="color:#9cf">' + mmss((_endT || performance.now() - _startT) / 1000) + '</b><br>'
      + 'WAVE REACHED <b style="color:#fc9">' + _wave + '</b><br>'
      + 'BEST STREAK <b style="color:#ffd24d">x' + _best + '</b>';
    summary.style.display = 'block';
    requestAnimationFrame(function () { summary.style.opacity = '1'; });
  }
  function hideSummary() { summary.style.opacity = '0'; setTimeout(function () { summary.style.display = 'none'; }, 350); }

  /* State + loop ------------------------------------------------------------- */
  var _kills = 0, _best = 0, _wave = 1, _startT = performance.now(), _endT = 0;
  var _lastHostiles = -1, _killWin = [], _wasLive = false, _summaryShown = false;

  function isLive(s) { return s === 'playing' || s === 'preWave'; }
  function isTerminal(s) { return /over|dead|lose|lost|defeat|win|victory|clear|complete/i.test(String(s || '')); }
  function state() { try { return GameManager.getState(); } catch (e) { return ''; } }
  function hostileCount() {
    try { if (typeof Enemies === 'undefined' || !Enemies.getAll) return -1; var a = Enemies.getAll(), n = 0; for (var i = 0; i < a.length; i++) if (alive(a[i])) n++; return n; } catch (e) { return -1; }
  }

  function reset() { _kills = 0; _best = 0; _wave = 1; _startT = performance.now(); _endT = 0; _lastHostiles = -1; _killWin = []; _summaryShown = false; hideSummary(); }

  function tick(now) {
    requestAnimationFrame(tick);
    var s = state();
    var live = isLive(s);
    var on = !(window.__OK_EXTRAS && window.__OK_EXTRAS.stats === false);
    root.style.display = on ? 'block' : 'none';
    if (!on) return;

    if (live && !_wasLive) reset();
    // detect match end
    if (_wasLive && !live && isTerminal(s) && !_summaryShown) { _endT = now - _startT; _summaryShown = true; showSummary(/win|victory|clear|complete/i.test(s) ? 'VICTORY' : 'MATCH OVER'); }
    _wasLive = live;

    // hide live elements (not the summary) when not in a match
    box.style.display = live ? 'block' : 'none';
    if (!live) { if (_coHideAt) { callout.style.opacity = '0'; _coHideAt = 0; } return; }
    summary.style.display = summary.style.opacity === '1' ? summary.style.display : 'none';

    var h = hostileCount();
    if (_lastHostiles >= 0 && h >= 0) {
      if (h < _lastHostiles) {
        var k = _lastHostiles - h; _kills += k;
        for (var i = 0; i < k; i++) _killWin.push(now);
        while (_killWin.length && now - _killWin[0] > 1500) _killWin.shift();
        if (_killWin.length > _best) _best = _killWin.length;
        if (h === 0) showCallout('AREA CLEAR', '#7CFC8A');
      } else if (h > _lastHostiles + 2) {
        showCallout('⚠ HOSTILES INBOUND', '#ff6a6a');
      }
    }
    _lastHostiles = h;

    try { if (GameManager.getCurrentWave) _wave = GameManager.getCurrentWave() || _wave; } catch (e) {}

    if (msK) msK.textContent = _kills;
    if (msT) msT.textContent = mmss((now - _startT) / 1000);
    if (msW) msW.textContent = _wave;
    if (msB) msB.textContent = 'x' + _best;

    if (_coHideAt && now > _coHideAt) { callout.style.opacity = '0'; callout.style.transform = 'translate(-50%,-50%) scale(.9)'; _coHideAt = 0; }
  }
  requestAnimationFrame(tick);

  window.MatchStats = {
    show: function () { root.style.display = 'block'; },
    hide: function () { root.style.display = 'none'; },
    testCallout: function () { root.style.display = 'block'; showCallout('⚠ HOSTILES INBOUND', '#ff6a6a'); },
    testSummary: function () { root.style.display = 'block'; _kills = _kills || 23; _best = _best || 4; _wave = _wave || 5; showSummary('VICTORY'); },
    get: function () { return { kills: _kills, best: _best, wave: _wave }; }, _root: root
  };
})();
