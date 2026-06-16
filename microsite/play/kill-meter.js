/* ============================================================
 *  KILL-METER.JS — Overkill charge meter + damage frenzy mode
 *
 *  Each kill charges a meter (0-100). At 100 press Alt+G to
 *  activate OVERKILL MODE: 3.5s where all enemy damage from
 *  explosives+weapons is tripled, heavy chromatic vignette,
 *  pulsing red screen overlay, camera shake on entry/exit.
 * ============================================================ */
var KillMeter = (function () {
  'use strict';

  var METER_MAX    = 100;
  var DECAY_RATE   = 7;      /* pts/s idle decay */
  var KILL_PTS     = 22;
  var MODE_DUR     = 3.5;
  var DMG_MULT     = 3;

  var _meter       = 0;
  var _active      = false;
  var _modeTimer   = 0;
  var _lastTs      = 0;
  var _frameN      = 0;
  var _readyAnim   = 0;
  var _init        = false;
  var _patchedDmg  = false;
  var _origDmgFn   = null;
  var _prevDead    = new WeakMap();

  var _canvas, _ctx, _banner, _barFill, _labelEl, _waveWasLast;

  /* ── DOM setup ─────────────────────────── */
  function _buildDOM() {
    /* Chromatic aberration canvas */
    _canvas = document.createElement('canvas');
    _canvas.id = 'km-canvas';
    Object.assign(_canvas.style, {
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 300,
      display: 'none'
    });
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');

    /* Meter bar container — bottom center */
    var wrap = document.createElement('div');
    wrap.id = 'km-wrap';
    Object.assign(wrap.style, {
      position: 'fixed', bottom: '20px', left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '3px',
      zIndex: 250, pointerEvents: 'none'
    });
    document.body.appendChild(wrap);

    _labelEl = document.createElement('div');
    Object.assign(_labelEl.style, {
      fontFamily: "'Courier New', monospace",
      fontSize: '8.5px', letterSpacing: '2.5px',
      color: 'rgba(255,70,70,0.92)',
      textShadow: '0 0 7px rgba(255,40,40,0.9)',
      display: 'none', whiteSpace: 'nowrap'
    });
    _labelEl.textContent = '⚡ OVERKILL READY — [Alt+G]';
    wrap.appendChild(_labelEl);

    var bg = document.createElement('div');
    Object.assign(bg.style, {
      width: '190px', height: '4px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '2px', overflow: 'hidden'
    });
    wrap.appendChild(bg);

    _barFill = document.createElement('div');
    Object.assign(_barFill.style, {
      height: '100%', width: '0%',
      background: 'linear-gradient(90deg,#22ff55 0%,#ffcc00 55%,#ff2020 100%)',
      borderRadius: '2px',
      boxShadow: '0 0 8px rgba(255,180,0,0.65)',
      transition: 'width 0.07s linear'
    });
    bg.appendChild(_barFill);

    /* HUD banner */
    _banner = document.createElement('div');
    _banner.id = 'km-banner';
    Object.assign(_banner.style, {
      position: 'fixed', top: '115px', left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: "'Courier New', monospace",
      fontSize: '17px', fontWeight: 'bold',
      letterSpacing: '4px',
      color: '#ff3300',
      textShadow: '0 0 12px #ff2200, 0 0 28px rgba(255,50,0,0.4)',
      zIndex: 320, display: 'none', pointerEvents: 'none',
      whiteSpace: 'nowrap'
    });
    document.body.appendChild(_banner);
  }

  /* ── Patch damageInRadius for DMG_MULT ── */
  function _patchDamage() {
    if (_patchedDmg) return;
    if (typeof Enemies === 'undefined' || !Enemies.damageInRadius) return;
    _origDmgFn = Enemies.damageInRadius;
    Enemies.damageInRadius = function (pos, radius, dmg, opts) {
      return _origDmgFn.call(Enemies, pos, radius, (_active ? dmg * DMG_MULT : dmg), opts);
    };
    _patchedDmg = true;
  }

  /* ── Activate ───────────────────────────── */
  function _activate() {
    if (_active || _meter < METER_MAX) return;
    _active    = true;
    _modeTimer = MODE_DUR;
    _meter     = 0;
    _labelEl.style.display = 'none';

    var gc = document.querySelector('#game-canvas, canvas.game, canvas[id]');
    if (gc && gc.id !== 'km-canvas') gc.style.filter = 'saturate(0.2) brightness(1.4) hue-rotate(8deg)';

    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.6, 0.28);
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('⚡ OVERKILL ACTIVE — ×' + DMG_MULT + ' DAMAGE');

    _canvas.style.display = 'block';
    _banner.style.display = 'block';
    _resize();
  }

  /* ── Deactivate ─────────────────────────── */
  function _deactivate() {
    _active = false;
    _canvas.style.display = 'none';
    _banner.style.display = 'none';
    var gc = document.querySelector('#game-canvas, canvas.game, canvas[id]');
    if (gc && gc.id !== 'km-canvas') gc.style.filter = '';
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.38, 0.22);
  }

  function _resize() {
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  /* ── Draw overlay ───────────────────────── */
  function _drawOverlay(t) {
    var W = _canvas.width, H = _canvas.height;
    _ctx.clearRect(0, 0, W, H);

    /* Pulsing red vignette */
    var pulse = 0.52 + Math.sin(t * 9.0) * 0.13;
    var vg = _ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(200,0,0,' + pulse.toFixed(2) + ')');
    _ctx.fillStyle = vg;
    _ctx.fillRect(0, 0, W, H);

    /* Chromatic edge fringe */
    _ctx.save();
    _ctx.globalCompositeOperation = 'screen';

    var rl = _ctx.createLinearGradient(0, 0, W * 0.30, 0);
    rl.addColorStop(0, 'rgba(255,0,0,0.18)');
    rl.addColorStop(1, 'rgba(255,0,0,0)');
    _ctx.fillStyle = rl;
    _ctx.fillRect(0, 0, W * 0.30, H);

    var bl = _ctx.createLinearGradient(W, 0, W * 0.70, 0);
    bl.addColorStop(0, 'rgba(20,60,255,0.14)');
    bl.addColorStop(1, 'rgba(20,60,255,0)');
    _ctx.fillStyle = bl;
    _ctx.fillRect(W * 0.70, 0, W * 0.30, H);

    _ctx.restore();

    /* White flash on first frame of activation */
    if (_modeTimer > MODE_DUR - 0.10) {
      _ctx.fillStyle = 'rgba(255,40,10,0.28)';
      _ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── Scan for new kills ─────────────────── */
  function _scanKills() {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var all = Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e) continue;
      var wasDead = _prevDead.has(e) ? _prevDead.get(e) : false;
      if (e.dead && !wasDead) {
        _meter = Math.min(METER_MAX, _meter + KILL_PTS);
      }
      _prevDead.set(e, !!e.dead);
    }
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    _patchDamage();

    /* Kill scan every 3 frames */
    if (_frameN % 3 === 0) _scanKills();

    /* Idle decay */
    if (!_active && _meter > 0) _meter = Math.max(0, _meter - DECAY_RATE * dt);

    /* Update bar */
    _barFill.style.width = ((_meter / METER_MAX) * 100).toFixed(1) + '%';

    /* READY label pulse */
    if (!_active && _meter >= METER_MAX) {
      _readyAnim += dt * 4;
      _labelEl.style.display = 'block';
      _labelEl.style.opacity = (0.65 + Math.sin(_readyAnim) * 0.35).toFixed(2);
    } else if (!_active) {
      _labelEl.style.display = 'none';
    }

    /* Mode countdown */
    if (_active) {
      _modeTimer = Math.max(0, _modeTimer - dt);
      _banner.textContent = '⚡ OVERKILL ' + Math.ceil(_modeTimer) + 's  ×' + DMG_MULT + ' DMG';
      _drawOverlay(ts / 1000);
      if (_modeTimer <= 0) _deactivate();
    }
  }

  /* ── Key ────────────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyG' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildDOM();
    _resize();
    window.addEventListener('resize', _resize);
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.KillMeter = KillMeter;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillMeter.init(); });
} else {
  KillMeter.init();
}
