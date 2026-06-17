/* ============================================================
 *  OBJECTIVE-TRACKER.JS — Persistent objective strip at top-center (passive)
 *
 *  Shows: "WAVE N/M  ·  ELIMINATE: K/T  ·  STAGE: NAME"
 *  Updates kill count in real-time as enemies die.
 *  Fades in at wave start, fades out when wave clears.
 *
 *  Placed at top-center, z-index 361, small monospace text.
 *  Does NOT conflict with existing wave-intel panel (different position).
 * ============================================================ */
var ObjectiveTracker = (function () {
  'use strict';

  var UPDATE_MS = 500;

  var _el       = null;
  var _waveLbl  = null;
  var _killLbl  = null;
  var _stageLbl = null;
  var _init     = false;

  var _waveWas  = -1;
  var _waveTotal = 0;
  var _waveKills = 0;
  var _totalEnemies = 0;

  var _prevHp   = new WeakMap();
  var _counted  = new WeakSet();
  var _lastUpd  = 0;

  function _buildDom() {
    var style = document.createElement('style');
    style.textContent = [
      '#ot-bar{',
        'position:fixed;top:8px;left:50%;transform:translateX(-50%);',
        'font-family:"Courier New",monospace;font-size:9px;',
        'letter-spacing:3px;color:rgba(200,220,200,0.70);',
        'background:rgba(0,0,0,0.35);',
        'padding:4px 14px 4px;border-radius:3px;',
        'pointer-events:none;z-index:361;',
        'white-space:nowrap;',
        'transition:opacity 0.4s ease;',
      '}',
      '#ot-bar.ot-hidden{opacity:0;}',
    ].join('');
    document.head.appendChild(style);

    _el = document.createElement('div');
    _el.id = 'ot-bar';
    _el.className = 'ot-hidden';

    _waveLbl  = document.createElement('span'); _waveLbl.id  = 'ot-wave';
    _killLbl  = document.createElement('span'); _killLbl.id  = 'ot-kills';
    _stageLbl = document.createElement('span'); _stageLbl.id = 'ot-stage';

    var sep1 = document.createTextNode('  ·  ');
    var sep2 = document.createTextNode('  ·  ');
    _el.appendChild(_waveLbl);
    _el.appendChild(sep1);
    _el.appendChild(_killLbl);
    _el.appendChild(sep2);
    _el.appendChild(_stageLbl);

    document.body.appendChild(_el);
  }

  function _update(now) {
    if (!_el || now - _lastUpd < UPDATE_MS / 1000) return;
    _lastUpd = now;

    try {
      if (typeof GameManager === 'undefined') return;

      var wave = GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;

      /* Detect wave change */
      if (wave !== _waveWas) {
        _waveWas = wave;
        _waveKills = 0;
        _counted  = new WeakSet();

        /* Count initial enemies for this wave */
        _totalEnemies = 0;
        try {
          if (typeof Enemies !== 'undefined' && Enemies.getAll) {
            _totalEnemies = Enemies.getAll().filter(function (e) { return e && e.mesh; }).length;
          }
        } catch (er) {}

        /* Get max waves and stage name */
        var info = GameManager.getStageInfo ? GameManager.getStageInfo() : null;
        _waveTotal = info && info.wavesPerStage ? info.wavesPerStage : '?';
        var stageName = info && info.name ? info.name : '';
        if (_stageLbl) _stageLbl.textContent = 'STAGE: ' + stageName;

        if (_el) _el.classList.remove('ot-hidden');
      }

      if (_waveLbl)  _waveLbl.textContent  = 'WAVE ' + wave + '/' + _waveTotal;
      if (_killLbl) {
        var remaining = Math.max(0, _totalEnemies - _waveKills);
        _killLbl.textContent = 'ELIMINATE: ' + remaining + ' LEFT';
      }

    } catch (e) {}
  }

  function _tickKills() {
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        var cur  = e.hp !== undefined ? e.hp : null;
        if (cur === null) continue;
        var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
        if (cur <= 0 && prev > 0 && !_counted.has(e)) {
          _counted.add(e);
          _waveKills++;
          if (_totalEnemies > 0 && _waveKills >= _totalEnemies) {
            if (_el) {
              if (_killLbl) _killLbl.textContent = 'ELIMINATE: CLEAR';
              setTimeout(function () { if (_el) _el.classList.add('ot-hidden'); }, 2000);
            }
          }
        }
        _prevHp.set(e, cur);
      }
    } catch (er) {}
  }

  var _frameN = 0;
  var _lastTs = 0;
  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    if (_frameN % 3 === 0) _tickKills();
    _update(now);
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ObjectiveTracker = ObjectiveTracker;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ObjectiveTracker.init(); });
} else {
  ObjectiveTracker.init();
}