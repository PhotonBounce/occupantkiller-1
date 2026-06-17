/* ============================================================
 *  SESSION-SCORE.JS — Arcade-style live score (passive)
 *
 *  Tracks enemy HP drops (kill events). Awards:
 *    - Base kill: 100 + maxHp * 2 pts (tougher enemies = more pts)
 *    - Multi-kill bonus: +80/+150/+250/+400 for 2/3/4/5+ kills in 2.5s
 *    - Wave-clear bonus: +500 * waveNumber (detected via getCurrentWave)
 *
 *  Score shown in top-left corner (below REMAINING counter).
 *  Each kill triggers a "+NNN" pop-up that rises and fades in 0.7s.
 *  Score persists in sessionStorage (resets on tab close).
 * ============================================================ */
var SessionScore = (function () {
  'use strict';

  var SS_KEY      = 'ok_session_score';
  var MULTI_WINDOW = 2.5;
  var MULTI_BONUS  = [0, 0, 80, 150, 250, 400];   /* idx = kill count, 0-based */

  /* State */
  var _score      = 0;
  var _prevHp     = new WeakMap();
  var _maxHp      = new WeakMap();
  var _counted    = new WeakSet();
  var _killTimes  = [];
  var _waveWas    = -1;
  var _init       = false;
  var _lastTs     = 0;
  var _frameN     = 0;

  /* DOM */
  var _wrapEl    = null;
  var _scoreEl   = null;
  var _popPool   = [];   /* recycled pop elements */
  var _style     = null;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#ss-wrap{',
        'position:fixed;top:120px;left:20px;',
        'pointer-events:none;z-index:370;',
        'font-family:"Courier New",monospace;',
      '}',
      '#ss-label{font-size:9px;color:rgba(255,200,50,0.55);letter-spacing:1px;text-transform:uppercase;}',
      '#ss-count{font-size:18px;font-weight:bold;color:rgba(255,200,50,0.9);letter-spacing:2px;}',
      '@keyframes ssPop{',
        '0%{opacity:1;transform:translate(-50%,0) scale(1.2)}',
        '100%{opacity:0;transform:translate(-50%,-48px) scale(0.85)}',
      '}',
      '.ss-pop{',
        'position:fixed;left:68px;',
        'font-family:"Courier New",monospace;font-weight:bold;font-size:13px;',
        'color:#ffdd44;text-shadow:0 0 8px rgba(255,200,0,0.7);',
        'pointer-events:none;z-index:372;',
        'animation:ssPop 0.70s ease-out forwards;',
        'white-space:nowrap;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _wrapEl = document.createElement('div');
    _wrapEl.id = 'ss-wrap';

    var lbl = document.createElement('div');
    lbl.id = 'ss-label';
    lbl.textContent = 'SCORE';

    _scoreEl = document.createElement('div');
    _scoreEl.id = 'ss-count';
    _scoreEl.textContent = '0';

    _wrapEl.appendChild(lbl);
    _wrapEl.appendChild(_scoreEl);
    document.body.appendChild(_wrapEl);
  }

  function _spawnPop(pts, baseY) {
    var p = document.createElement('div');
    p.className = 'ss-pop';
    p.textContent = '+' + pts;
    p.style.top = (baseY || 140) + 'px';
    document.body.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 750);
  }

  function _addScore(pts, popY) {
    _score += pts;
    if (_scoreEl) {
      _scoreEl.textContent = _score.toLocaleString ? _score.toLocaleString() : String(_score);
    }
    if (pts > 0) _spawnPop(pts, popY || 140);
    try { sessionStorage.setItem(SS_KEY, String(_score)); } catch (e) {}
  }

  function _fmtScore(n) {
    var s = String(n);
    var out = '';
    for (var i = s.length - 1, c = 0; i >= 0; i--, c++) {
      if (c > 0 && c % 3 === 0) out = ',' + out;
      out = s[i] + out;
    }
    return out;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Wave-clear bonus */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas !== -1 && w > _waveWas) {
          var bonus = 500 * _waveWas;
          _addScore(bonus, 160);
        }
        _waveWas = w;
      }
    } catch (e) {}

    /* Kill scan every 2 frames */
    if (_frameN % 2 !== 0) return;
    var now = ts / 1000;

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        var cur  = e.hp !== undefined ? e.hp : null;
        if (cur === null) continue;
        var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;

        /* Track maxHp */
        if (prev > (_maxHp.has(e) ? _maxHp.get(e) : 0)) _maxHp.set(e, prev);

        if (cur <= 0 && prev > 0 && !_counted.has(e)) {
          _counted.add(e);

          /* Base kill pts */
          var mhp  = _maxHp.has(e) ? _maxHp.get(e) : 100;
          var base = 100 + Math.round(mhp * 1.5);

          /* Multi-kill */
          _killTimes.push(now);
          _killTimes = _killTimes.filter(function (t) { return now - t <= MULTI_WINDOW; });
          var cnt   = _killTimes.length;
          var multi = cnt < MULTI_BONUS.length ? MULTI_BONUS[cnt] : 400;

          _addScore(base + multi, 140);
        }
        _prevHp.set(e, cur);
      }
    } catch (err) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    /* Restore session score */
    try { var saved = sessionStorage.getItem(SS_KEY); if (saved) _score = parseInt(saved, 10) || 0; } catch (e) {}
    _buildStyle();
    _buildDom();
    if (_scoreEl) _scoreEl.textContent = _fmtScore(_score);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.SessionScore = SessionScore;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SessionScore.init(); });
} else {
  SessionScore.init();
}