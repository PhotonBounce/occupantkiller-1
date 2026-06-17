/* ============================================================
 *  ADRENALINE-SHOT.JS — Combat stimulant injection (Alt+I)
 *
 *  Instantly injects +40 HP + starts 8s regeneration phase:
 *  +4 HP/s continuous heal for the duration (up to max HP).
 *  Visual: warm orange vignette with heartbeat double-pulse
 *  rhythm (ba-DUM ba-DUM at ~1.6 Hz). Yellow HP flash on inject.
 *  HUD.setHealth() called each frame during regen so bar updates.
 *  1 per wave.
 * ============================================================ */
var AdrenalineShot = (function () {
  'use strict';

  var BURST_HEAL  = 40;
  var REGEN_RATE  = 4.0;   /* HP/s during duration */
  var DURATION    = 8.0;
  var STOCK_MAX   = 1;

  var _stock      = STOCK_MAX;
  var _waveWas    = -1;
  var _init       = false;
  var _lastTs     = 0;
  var _active     = false;
  var _timeLeft   = 0;

  var _canvas     = null;   /* vignette overlay */
  var _ctx        = null;
  var _flashEl    = null;
  var _hintEl     = null;

  /* ── Canvas vignette ───────────────────────── */
  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    Object.assign(_canvas.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 295, opacity: 0
    });
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  /* ── HP yellow flash ───────────────────────── */
  function _buildFlash() {
    _flashEl = document.createElement('div');
    Object.assign(_flashEl.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255,200,0,0.22)',
      zIndex: 325, pointerEvents: 'none', opacity: 0
    });
    document.body.appendChild(_flashEl);
  }

  /* ── Hint label ─────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'adren-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '101px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(255,180,60,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+I] STIM ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Draw vignette frame ────────────────────── */
  function _drawVignette(intensity) {
    if (!_ctx || !_canvas) return;
    var w = window.innerWidth, h = window.innerHeight;
    if (_canvas.width !== w || _canvas.height !== h) {
      _canvas.width = w; _canvas.height = h;
    }
    _ctx.clearRect(0, 0, w, h);
    var grad = _ctx.createRadialGradient(w/2, h/2, h * 0.15, w/2, h/2, h * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(220,100,0,' + (intensity * 0.55) + ')');
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, w, h);
  }

  /* ── Activate ──────────────────────────────── */
  function _activate() {
    if (_stock <= 0) {
      try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('STIM — NO STOCK'); } catch (e) {}
      return;
    }
    var player = window.player;
    if (!player) return;

    _stock--;
    _active   = true;
    _timeLeft = DURATION;

    /* Burst heal */
    var maxHp = player.maxHp || 100;
    player.hp = Math.min(maxHp, player.hp + BURST_HEAL);
    try { if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, maxHp); } catch (e) {}

    /* Yellow flash */
    if (_flashEl) {
      _flashEl.style.opacity = 1;
      setTimeout(function () { if (_flashEl) _flashEl.style.opacity = 0; }, 200);
    }

    /* Canvas visible */
    if (_canvas) _canvas.style.opacity = 1;

    _hintEl.textContent = '[Alt+I] STIM ACTIVE';
    _hintEl.style.color = 'rgba(255,180,60,0.9)';
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('💉 ADRENALINE — +' + BURST_HEAL + 'HP + REGEN ' + DURATION + 's'); } catch (e) {}
  }

  /* ── rAF tick ──────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var tSec = ts / 1000;

    /* Restock on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _active = false; _timeLeft = 0;
          _hintEl.textContent = '[Alt+I] STIM ×' + _stock;
          _hintEl.style.color = 'rgba(255,180,60,0.55)';
          if (_canvas) _canvas.style.opacity = 0;
        }
      }
    } catch (e) {}

    if (!_active) return;

    _timeLeft -= dt;
    if (_timeLeft <= 0) {
      _active = false;
      if (_canvas) _canvas.style.opacity = 0;
      _hintEl.textContent = '[Alt+I] STIM ×' + _stock;
      _hintEl.style.color = _stock > 0 ? 'rgba(255,180,60,0.55)' : 'rgba(255,180,60,0.2)';
      try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('ADRENALINE FADING'); } catch (e) {}
      return;
    }

    /* Regen */
    var player = window.player;
    if (player) {
      var maxHp = player.maxHp || 100;
      if (player.hp < maxHp) {
        player.hp = Math.min(maxHp, player.hp + REGEN_RATE * dt);
        try { if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, maxHp); } catch (e) {}
      }
    }

    /* Heartbeat vignette: ba-DUM pattern ~1.6 Hz */
    var beat     = tSec * 1.6;
    var phase    = beat % 1.0;
    /* Double-pulse: peak at 0.08 and 0.22, silent rest of cycle */
    var pulse1   = Math.max(0, 1 - Math.abs(phase - 0.08) / 0.07);
    var pulse2   = Math.max(0, 1 - Math.abs(phase - 0.22) / 0.07);
    var heartBeat= Math.max(pulse1, pulse2);
    var fadeProg = _timeLeft / DURATION;
    var intensity= (0.5 + heartBeat * 0.5) * fadeProg;
    _drawVignette(intensity);

    /* Hint countdown */
    _hintEl.textContent = '[Alt+I] STIM ' + Math.ceil(_timeLeft) + 's';
  }

  /* ── Key handler ────────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyI' && e.altKey && !e.repeat) {
      e.preventDefault();
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

window.AdrenalineShot = AdrenalineShot;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { AdrenalineShot.init(); });
} else {
  AdrenalineShot.init();
}
