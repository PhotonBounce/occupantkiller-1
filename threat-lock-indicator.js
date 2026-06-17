/* ============================================================
 *  THREAT-LOCK-INDICATOR.JS — enemy-spotted radar ping (passive)
 *
 *  Watches nearby enemies. When a SNIPER or any enemy within
 *  CLOSE_DIST is facing the player (dot product > FACE_THRESH),
 *  a pulsing diamond icon briefly flashes at the player's center
 *  with the label "TARGET ACQUIRED" — one ping per enemy, re-arms
 *  after the enemy dies or moves away.
 *
 *  Also dims active locks after LOCK_COOLDOWN seconds so the alert
 *  doesn't spam during sustained gun fights.
 *
 *  CSS-only. z-index 460. Passive — no keybind.
 * ============================================================ */
var ThreatLockIndicator = (function () {
  'use strict';

  var FACE_THRESH  = 0.82;   /* dot product: enemy forward · player direction */
  var CLOSE_DIST   = 55;     /* world units — range for non-sniper lock */
  var SNIPER_DIST  = 120;    /* snipers get extended range */
  var LOCK_COOL    = 4.0;    /* seconds before same enemy can re-trigger */
  var SHOW_TIME    = 0.9;    /* display duration per alert */
  var STAGGER      = 0.25;   /* minimum gap between consecutive alerts */

  var _el       = null;
  var _init     = false;
  var _showing  = false;
  var _lastTs   = 0;
  var _frameN   = 0;
  var _lockMap  = new WeakMap();   /* enemy → timestamp of last alert */
  var _queue    = [];

  function _buildStyle() {
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes tliPulse{',
        '0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}',
        '15%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}',
        '55%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.85)}',
      '}',
      '#tli-wrap{',
        'position:fixed;left:50%;top:42%;',
        'transform:translate(-50%,-50%);',
        'pointer-events:none;z-index:460;',
        'display:none;text-align:center;',
      '}',
      '#tli-diamond{',
        'width:20px;height:20px;',
        'border:2px solid rgba(255,40,40,0.9);',
        'transform:rotate(45deg);',
        'margin:0 auto 6px;',
        'box-shadow:0 0 10px rgba(255,0,0,0.7);',
      '}',
      '#tli-label{',
        'font-family:"Courier New",monospace;',
        'font-size:9px;font-weight:bold;',
        'letter-spacing:3px;',
        'color:rgba(255,80,80,1);',
        'text-shadow:0 0 12px rgba(255,0,0,0.8);',
        'white-space:nowrap;',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'tli-wrap';
    _el.innerHTML = '<div id="tli-diamond"></div><div id="tli-label">TARGET ACQUIRED</div>';
    document.body.appendChild(_el);
  }

  function _showNext() {
    if (_showing || _queue.length === 0 || !_el) return;
    _showing = true;
    _queue.shift();
    _el.style.display = 'block';
    _el.style.animation = 'none';
    void _el.offsetWidth;
    _el.style.animation = 'tliPulse ' + SHOW_TIME + 's ease forwards';
    var el = _el;
    setTimeout(function () {
      if (el) el.style.display = 'none';
      _showing = false;
      if (_queue.length > 0) setTimeout(_showNext, STAGGER * 1000);
    }, SHOW_TIME * 1000);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Check every 6th frame (~10Hz) to keep CPU negligible */
    if (_frameN % 6 !== 0) return;

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      if (!window.player || !window.player.position) return;

      var pp  = window.player.position;
      var now = ts / 1000;
      var all = Enemies.getAll();

      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || e.hp <= 0) continue;

        var isSniper = (e.type || '').toUpperCase() === 'SNIPER';
        var maxDist  = isSniper ? SNIPER_DIST : CLOSE_DIST;

        var dx = pp.x - e.mesh.position.x;
        var dz = pp.z - e.mesh.position.z;
        var distSq = dx*dx + dz*dz;
        if (distSq > maxDist * maxDist) continue;

        /* Check cooldown */
        var lastAlert = _lockMap.has(e) ? _lockMap.get(e) : 0;
        if (now - lastAlert < LOCK_COOL) continue;

        /* Check if enemy is facing the player */
        var dist = Math.sqrt(distSq);
        if (dist < 0.001) continue;
        var toPlayerX = dx / dist;
        var toPlayerZ = dz / dist;

        /* Enemy forward from mesh rotation (Y axis only) */
        var fwd = new THREE.Vector3(0, 0, 1);
        fwd.applyQuaternion(e.mesh.quaternion);
        fwd.y = 0;
        fwd.normalize();

        var dot = fwd.x * toPlayerX + fwd.z * toPlayerZ;
        if (dot < FACE_THRESH) continue;

        /* Lock! */
        _lockMap.set(e, now);
        _queue.push(1);
        if (!_showing) _showNext();
      }
    } catch (er) {}
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

window.ThreatLockIndicator = ThreatLockIndicator;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ThreatLockIndicator.init(); });
} else {
  ThreatLockIndicator.init();
}
