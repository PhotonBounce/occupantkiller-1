/* ============================================================
 *  MORALE.JS — Enemy unit morale and routing system
 *
 *  Polls the living/dead ratio each wave. When > 60% of a
 *  wave's enemies are killed:
 *    • "ENEMY UNIT ROUTING" banner appears
 *    • Intel intercept fires with a panic message
 *    • Each surviving enemy gets a "routing velocity" added to
 *      their position every frame, pushing them away from the
 *      player — visually appearing to flee
 *    • After 5s, they slow and attempt to rally (50% chance)
 *      or continue fleeing until dead
 * ============================================================ */
var MoraleSystem = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    BREAK_THRESHOLD: 0.60,   // fraction dead before rout
    ROUT_SPEED:      0.06,   // world units pushed per frame at 60fps
    RALLY_DELAY:     7.0,    // seconds before rally check
    POLL_INTERVAL:   1.2,
  };

  /* ── State ──────────────────────────────── */
  var _initialized  = false;
  var _routing      = false;
  var _routeTimer   = 0;
  var _pollTimer    = 0;
  var _waveBaseline = 0;   // enemy count at wave start
  var _lastWave     = -1;
  var _bannerEl     = null;
  var _routeSet     = new WeakSet(); // enemies that are routing
  var _player       = null;

  /* Panic messages for routing enemies */
  var PANIC_MSGS = [
    ['Berkut-Actual', 'WE ARE ROUTING. Repeat — we are ROUTING. All units fall back NOW.'],
    ['Zubr-6',        'They\'re everywhere. I\'m pulling back. I don\'t care what command says.'],
    ['Volk-Actual',   'The unit is collapsing. There\'s no holding this position. FALL BACK.'],
    ['Groza-1',       'Drop everything and run. It\'s over here. Go go go.'],
    ['Medved-2',      'I\'m not dying for this. I\'m not dying for ANY of this. Retreating.'],
  ];

  /* ── Helpers ────────────────────────────── */
  function _getPlayer() { try { return window.player || null; } catch(e){return null;} }
  function _getEnemies() {
    try { return (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : []; } catch(e){return [];}
  }

  /* ── Show routing banner ─────────────────── */
  function _showBanner() {
    if (!_bannerEl) {
      var style = document.createElement('style');
      style.textContent = [
        '@keyframes mrFlash{0%,100%{opacity:1;transform:translateX(-50%) scale(1)}',
          '50%{opacity:0.5;transform:translateX(-50%) scale(0.97)}}',
        '#mr-banner{position:fixed;top:20%;left:50%;transform:translateX(-50%);',
          'z-index:340;font-family:monospace;font-weight:bold;font-size:18px;',
          'color:#ff4444;letter-spacing:0.2em;text-shadow:0 0 20px rgba(255,0,0,0.6);',
          'animation:mrFlash 0.7s ease-in-out 4;pointer-events:none;display:none;}',
        '#mr-sub{font-size:11px;text-align:center;color:#ff8888;margin-top:4px;',
          'letter-spacing:0.1em;font-weight:normal;}',
      ].join('');
      document.head.appendChild(style);
      _bannerEl = document.createElement('div');
      _bannerEl.id = 'mr-banner';
      _bannerEl.innerHTML = '⚡ ENEMY UNIT ROUTING<div id="mr-sub">PURSUE AND ELIMINATE</div>';
      document.body.appendChild(_bannerEl);
    }
    _bannerEl.style.display = 'block';
    setTimeout(function () { if (_bannerEl) _bannerEl.style.display = 'none'; }, 3200);

    /* Trigger intel intercept if available */
    try {
      if (window.IntelIntercept && IntelIntercept.trigger) {
        setTimeout(IntelIntercept.trigger, 800);
      }
    } catch(e) {}

    try {
      if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('⚡ ENEMY UNIT ROUTING — PURSUE!', '#ff4444');
    } catch(e) {}
  }

  /* ── Start routing for all living enemies ── */
  function _startRouting(enemies) {
    _routing   = true;
    _routeTimer = 0;

    var p = _getPlayer();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || e.dead) continue;
      if (!_routeSet.has(e)) {
        _routeSet.add(e);
        /* Compute flee direction (away from player) */
        if (p && p.position) {
          var dx = e.mesh.position.x - p.position.x;
          var dz = e.mesh.position.z - p.position.z;
          var len = Math.sqrt(dx*dx + dz*dz) || 1;
          e._routeDir = { x: dx/len, z: dz/len };
        } else {
          var angle = Math.random() * Math.PI * 2;
          e._routeDir = { x: Math.cos(angle), z: Math.sin(angle) };
        }
      }
    }
    _showBanner();
  }

  /* ── Update routing movement ─────────────── */
  function _applyRouting(enemies, dt) {
    _routeTimer += dt;
    var rally = (_routeTimer > CFG.RALLY_DELAY);

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || e.dead || !_routeSet.has(e)) continue;
      if (!e._routeDir) continue;

      if (!rally) {
        /* Push enemy away from player */
        var speed = CFG.ROUT_SPEED * (1 - _routeTimer / CFG.RALLY_DELAY * 0.5);
        e.mesh.position.x += e._routeDir.x * speed * dt * 60;
        e.mesh.position.z += e._routeDir.z * speed * dt * 60;
        /* Turn enemy mesh to face flee direction */
        if (e.mesh.rotation !== undefined) {
          e.mesh.rotation.y = Math.atan2(e._routeDir.x, e._routeDir.z);
        }
      }
      /* After rally delay, 50% stop fleeing */
      else if (Math.random() < 0.01) {
        delete e._routeDir;
      }
    }
  }

  /* ── Poll ────────────────────────────────── */
  function update(dt) {
    _pollTimer += dt;

    var enemies = _getEnemies();

    /* Apply routing movement every frame if active */
    if (_routing) {
      _applyRouting(enemies, dt);
    }

    if (_pollTimer < CFG.POLL_INTERVAL) return;
    _pollTimer = 0;

    /* Wave change → reset routing state */
    try {
      var wave = (window.GameManager && GameManager.getCurrentWave) ? (GameManager.getCurrentWave() || 0) : 0;
      if (wave !== _lastWave) {
        _lastWave     = wave;
        _routing      = false;
        _routeTimer   = 0;
        _waveBaseline = enemies.filter(function(e){ return e && !e.dead; }).length;
        return;
      }
    } catch(e2) {}

    if (_routing) return; // already routing, no need to re-check

    /* Count living vs dead */
    var alive = 0, dead = 0;
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (!e || !e.mesh) continue;
      if (e.dead) dead++; else alive++;
    }
    var total = alive + dead;
    if (total < 3) return; // too few enemies to calculate morale

    var deadFrac = dead / total;
    if (deadFrac >= CFG.BREAK_THRESHOLD) {
      _startRouting(enemies);
    }
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.MoraleSystem = MoraleSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { MoraleSystem.init(); });
} else {
  MoraleSystem.init();
}
