/* ============================================================
 *  BERSERKER-MODE.JS — Rage invincibility (Alt+U)
 *
 *  4s duration, 1 per wave.
 *  - Player HP is fully protected: any drop is restored each frame.
 *  - All player-dealt damage boosted +35% via HP-delta intercept
 *    on enemies (same WeakMap pattern as other modules).
 *  - Visual: gold radial canvas vignette, game canvas gets
 *    sepia(0.4) brightness(1.35) saturate(1.8) CSS filter.
 *  - Heartbeat-like intensity pulse at 2Hz.
 *  - On expiry: brief fade, "BERSERKER FADING" HUD alert.
 * ============================================================ */
var BerserkerMode = (function () {
  'use strict';

  var DURATION      = 4.0;
  var DMG_BONUS     = 0.35;   /* +35% to all outgoing damage */
  var STOCK_MAX     = 1;

  var _stock        = STOCK_MAX;
  var _waveWas      = -1;
  var _init         = false;
  var _lastTs       = 0;
  var _active       = false;
  var _timeLeft     = 0;
  var _prevPlayerHp = null;

  /* HP-delta tracking for damage bonus */
  var _enemyPrevHp  = new WeakMap();
  var _justHit      = new WeakMap();

  /* DOM */
  var _canvas       = null;
  var _ctx          = null;
  var _flashEl      = null;
  var _hintEl       = null;
  var _gameCanvas   = null;

  /* ── Find game canvas ──────────────────────── */
  function _getGameCanvas() {
    if (_gameCanvas) return _gameCanvas;
    _gameCanvas = document.querySelector('canvas#game-canvas') || document.querySelector('canvas');
    return _gameCanvas;
  }

  /* ── Gold vignette canvas ──────────────────── */
  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    Object.assign(_canvas.style, {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 295, opacity: 0
    });
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  /* ── Activation flash ──────────────────────── */
  function _buildFlash() {
    _flashEl = document.createElement('div');
    Object.assign(_flashEl.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255,180,0,0.30)',
      zIndex: 325, pointerEvents: 'none', opacity: 0,
      transition: 'opacity 0.15s'
    });
    document.body.appendChild(_flashEl);
  }

  /* ── Hint ──────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'berserk-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '134px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(255,180,0,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+U] BERSERK ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Draw gold vignette ────────────────────── */
  function _drawVignette(intensity) {
    if (!_ctx || !_canvas) return;
    var w = window.innerWidth, h = window.innerHeight;
    if (_canvas.width !== w || _canvas.height !== h) { _canvas.width = w; _canvas.height = h; }
    _ctx.clearRect(0, 0, w, h);
    var grad = _ctx.createRadialGradient(w/2, h/2, h * 0.1, w/2, h/2, h * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.6, 'rgba(200,120,0,' + (intensity * 0.22) + ')');
    grad.addColorStop(1,   'rgba(220,140,0,' + (intensity * 0.65) + ')');
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, w, h);
  }

  /* ── Activate ──────────────────────────────── */
  function _activate() {
    if (_stock <= 0) {
      try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('BERSERKER — NO CHARGE'); } catch (e) {}
      return;
    }
    var player = window.player;
    if (!player) return;

    _stock--;
    _active   = true;
    _timeLeft = DURATION;
    _prevPlayerHp = player.hp;

    /* Activation flash */
    if (_flashEl) { _flashEl.style.opacity = 1; setTimeout(function () { if (_flashEl) _flashEl.style.opacity = 0; }, 200); }

    /* Game canvas filter */
    var gc = _getGameCanvas();
    if (gc) gc.style.filter = 'sepia(0.4) brightness(1.35) saturate(1.8)';

    /* Show vignette */
    if (_canvas) _canvas.style.opacity = 1;

    _hintEl.textContent = '[Alt+U] BERSERK ACTIVE';
    _hintEl.style.color = 'rgba(255,200,0,1.0)';

    try {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('🔥 BERSERKER MODE — 4s INVINCIBLE');
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.35, 0.15);
    } catch (e) {}
  }

  /* ── Deactivate ────────────────────────────── */
  function _deactivate() {
    _active = false;
    _prevPlayerHp = null;
    var gc = _getGameCanvas();
    if (gc) gc.style.filter = '';
    if (_canvas) _canvas.style.opacity = 0;
    _hintEl.textContent = '[Alt+U] BERSERK ×' + _stock;
    _hintEl.style.color = _stock > 0 ? 'rgba(255,180,0,0.55)' : 'rgba(255,180,0,0.2)';
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('BERSERKER FADING'); } catch (e) {}
  }

  /* ── rAF tick ──────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt   = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs  = ts;
    var tSec = ts / 1000;

    /* Restock on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX;
          if (_active) _deactivate();
          _hintEl.textContent = '[Alt+U] BERSERK ×' + _stock;
          _hintEl.style.color = 'rgba(255,180,0,0.55)';
        }
      }
    } catch (e) {}

    if (!_active) return;

    _timeLeft -= dt;
    if (_timeLeft <= 0) { _deactivate(); return; }

    var player = window.player;
    if (!player) return;

    /* HP immunity — restore any drop */
    if (_prevPlayerHp !== null && player.hp < _prevPlayerHp) {
      player.hp = _prevPlayerHp;
      try { if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp || 100); } catch (e) {}
    }
    _prevPlayerHp = player.hp;

    /* Damage bonus via HP-delta intercept on enemies */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || e.dead || !e.mesh) continue;
          var curHp = e.hp;
          var prev  = _enemyPrevHp.has(e) ? _enemyPrevHp.get(e) : curHp;
          var jh    = _justHit.has(e) ? _justHit.get(e) : false;
          if (!jh) {
            var drop = prev - curHp;
            if (drop > 0.5) {
              e.hp = Math.max(0, e.hp - drop * DMG_BONUS);
              _justHit.set(e, true);
            } else {
              _justHit.set(e, false);
            }
          } else {
            _justHit.set(e, false);
          }
          _enemyPrevHp.set(e, e.hp);
        }
      }
    } catch (err) {}

    /* Pulsing gold vignette */
    var prog      = _timeLeft / DURATION;
    var beatRate  = 2.0;
    var pulse     = 0.7 + Math.sin(tSec * Math.PI * beatRate * 2) * 0.3;
    var intensity = (0.6 + pulse * 0.4) * Math.min(1, prog * 4);
    _drawVignette(intensity);

    /* Hint countdown */
    _hintEl.textContent = '[Alt+U] BERSERK ' + Math.ceil(_timeLeft) + 's';
  }

  /* ── Key handler ────────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyU' && e.altKey && !e.repeat) {
      e.preventDefault();
      if (_active) return;
      _activate();
    }
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    _buildFlash();
    _buildHint();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.BerserkerMode = BerserkerMode;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BerserkerMode.init(); });
} else {
  BerserkerMode.init();
}
