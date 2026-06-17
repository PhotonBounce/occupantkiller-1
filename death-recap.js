/* ============================================================
 *  DEATH-RECAP.JS — Player death notice (passive)
 *
 *  Watches player.hp. On transition > 0 → ≤ 0:
 *  - Shows "YOU DIED" + "killed by [type] at Xm" centered text
 *  - Uses the nearest living enemy at time of death as the killer
 *  - Fades out after 3.5s
 *  - Also increments a death counter shown in corner
 *
 *  Text is CSS animated; does NOT block game or show modal.
 *  Respects the game's own death handling.
 * ============================================================ */
var DeathRecap = (function () {
  'use strict';

  var _prevHp  = null;
  var _deaths  = 0;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _deadCd  = false;   /* prevent multi-fire during hp=0 frames */

  var _el      = null;
  var _mainEl  = null;
  var _subEl   = null;
  var _deathEl = null;   /* deaths-counter chip */
  var _timer   = null;
  var _style   = null;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes drIn{',
        '0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}',
        '18%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}',
        '30%{transform:translate(-50%,-50%) scale(1.0)}',
        '65%{opacity:1}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.92)}',
      '}',
      '#dr-wrap{',
        'position:fixed;top:42%;left:50%;',
        'transform:translate(-50%,-50%);',
        'text-align:center;',
        'pointer-events:none;z-index:440;',
        'display:none;',
      '}',
      '#dr-main{',
        'font-family:"Courier New",monospace;font-weight:900;',
        'font-size:36px;color:#ff2222;letter-spacing:0.4em;',
        'text-shadow:0 0 28px rgba(255,30,30,0.8);',
        'display:block;',
      '}',
      '#dr-sub{',
        'font-family:"Courier New",monospace;font-size:12px;',
        'color:#ff8888;letter-spacing:0.2em;margin-top:8px;',
        'text-shadow:0 0 10px rgba(255,100,100,0.6);',
        'display:block;',
      '}',
      '#dr-deaths{',
        'position:fixed;top:310px;left:20px;',
        'font-family:"Courier New",monospace;',
        'pointer-events:none;z-index:370;',
      '}',
      '#dr-dlabel{font-size:9px;color:rgba(255,100,100,0.5);letter-spacing:1px;text-transform:uppercase;}',
      '#dr-dcount{font-size:18px;font-weight:bold;color:rgba(255,100,100,0.8);letter-spacing:2px;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'dr-wrap';

    _mainEl = document.createElement('span');
    _mainEl.id = 'dr-main';
    _mainEl.textContent = 'YOU DIED';

    _subEl = document.createElement('span');
    _subEl.id = 'dr-sub';

    _el.appendChild(_mainEl);
    _el.appendChild(_subEl);
    document.body.appendChild(_el);

    var dc = document.createElement('div');
    dc.id = 'dr-deaths';
    var dl = document.createElement('div');
    dl.id = 'dr-dlabel';
    dl.textContent = 'DEATHS';
    _deathEl = document.createElement('div');
    _deathEl.id = 'dr-dcount';
    _deathEl.textContent = '0';
    dc.appendChild(dl);
    dc.appendChild(_deathEl);
    document.body.appendChild(dc);
  }

  function _nearestEnemy() {
    var px = 0, pz = 0;
    try {
      if (window.player && window.player.position) { px = window.player.position.x; pz = window.player.position.z; }
    } catch (e) {}
    var bestDist = Infinity, bestE = null;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh) continue;
          /* Include even dead enemies — they may have just landed the killing blow */
          var dx = e.mesh.position.x - px;
          var dz = e.mesh.position.z - pz;
          var d  = dx * dx + dz * dz;
          if (d < bestDist) { bestDist = d; bestE = e; }
        }
      }
    } catch (er) {}
    return { e: bestE, dist: Math.sqrt(bestDist) };
  }

  function _onDeath() {
    _deaths++;
    if (_deathEl) _deathEl.textContent = String(_deaths);

    var nearest = _nearestEnemy();
    var sub = '';
    if (nearest.e) {
      var type = (nearest.e.type || nearest.e.name || 'ENEMY').toUpperCase().replace(/_/g,' ');
      sub = 'KILLED BY ' + type + ' · ' + nearest.dist.toFixed(0) + 'm AWAY';
    }
    if (_subEl) _subEl.textContent = sub;

    if (_el) {
      if (_timer) { clearTimeout(_timer); _timer = null; }
      _el.style.display = 'block';
      _el.style.animation = 'none';
      void _el.offsetWidth;
      _el.style.animation = 'drIn 3.5s ease-out forwards';
      _timer = setTimeout(function () { if (_el) _el.style.display = 'none'; _deadCd = false; }, 3600);
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 4 !== 0) return;
    _lastTs = ts;

    try {
      if (window.player && window.player.hp !== undefined) {
        var cur = window.player.hp;
        if (_prevHp !== null && cur <= 0 && _prevHp > 0 && !_deadCd) {
          _deadCd = true;
          _onDeath();
        }
        /* Reset cd when player respawns (hp goes back up) */
        if (cur > 0 && _prevHp !== null && _prevHp <= 0) {
          _deadCd = false;
        }
        _prevHp = cur;
      }
    } catch (e) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.DeathRecap = DeathRecap;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { DeathRecap.init(); });
} else {
  DeathRecap.init();
}