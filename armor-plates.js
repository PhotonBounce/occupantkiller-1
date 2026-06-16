/* ============================================================
 *  ARMOR-PLATES.JS — Ceramic armor plate (Alt+A)
 *
 *  Press Alt+A to slam a ceramic plate. It absorbs the next
 *  75 HP of incoming damage before your real health drops.
 *  When the plate breaks, screen flashes white + shake.
 *
 *  Features:
 *    • Plate bar (cyan) sits below HUD health bar, shrinks with hits
 *    • "PLATE ACTIVE" badge pulses when equipped
 *    • Break animation: cyan screen flash + camera shake + shatter sound (WebAudio)
 *    • 2 plates per wave, 8s cooldown between plates
 *    • Monkey-patches player.hp setter to intercept damage
 * ============================================================ */
var ArmorPlates = (function () {
  'use strict';

  var CFG = {
    PLATE_HP:   75,
    STOCK:       2,
    COOLDOWN:  8000,
  };

  var _initialized = false;
  var _plateHp     = 0;     /* current plate HP */
  var _stock       = CFG.STOCK;
  var _cooldownMs  = 0;
  var _lastRealHp  = -1;

  /* DOM elements */
  var _barWrap  = null;
  var _barFill  = null;
  var _badge    = null;
  var _hudEl    = null;
  var _flashEl  = null;

  /* HP interception */
  var _playerRef   = null;
  var _intercepted = false;
  var _trueHp      = null;   /* real HP storage (bypasses setter) */

  /* ── Plate bar DOM ───────────────────────── */
  function _buildBar() {
    /* Plate bar — positioned below health bar area */
    _barWrap = document.createElement('div');
    _barWrap.style.cssText = [
      'position:fixed;top:52px;left:12px;width:120px;height:5px;',
      'background:rgba(0,0,0,0.4);border:1px solid rgba(0,200,255,0.3);',
      'z-index:215;pointer-events:none;display:none;',
    ].join('');
    _barFill = document.createElement('div');
    _barFill.style.cssText = [
      'height:100%;background:rgba(0,220,255,0.85);',
      'transition:width 0.1s;box-shadow:0 0 4px rgba(0,200,255,0.6);',
    ].join('');
    _barWrap.appendChild(_barFill);
    document.body.appendChild(_barWrap);

    /* PLATE label on bar */
    var label = document.createElement('div');
    label.style.cssText = [
      'position:fixed;top:59px;left:12px;font-family:monospace;font-size:7px;',
      'color:rgba(0,220,255,0.7);letter-spacing:0.15em;z-index:215;pointer-events:none;display:none;',
    ].join('');
    label.textContent = 'PLATE';
    label.id = 'ap-label';
    document.body.appendChild(label);
    _badge = label;

    /* Flash overlay */
    _flashEl = document.createElement('div');
    _flashEl.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;',
      'background:rgba(0,220,255,0.45);pointer-events:none;z-index:321;',
      'display:none;opacity:0;',
    ].join('');
    document.body.appendChild(_flashEl);
  }

  /* ── HUD chip ──────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var ready = _cooldownMs <= 0 && _stock > 0;
    var suf   = _cooldownMs > 0 ? ' <span style="color:rgba(0,220,255,0.3);font-size:8px">' + Math.ceil(_cooldownMs/1000) + 's</span>' : '';
    _hudEl.innerHTML = '[Alt+A] PLATE ×' + _stock + suf;
    _hudEl.style.color = ready ? '#00ddff' : 'rgba(0,220,255,0.35)';
  }

  /* ── Update plate bar ──────────────────── */
  function _updateBar() {
    if (!_barWrap) return;
    var active = _plateHp > 0;
    _barWrap.style.display = active ? 'block' : 'none';
    if (_badge) _badge.style.display = active ? 'block' : 'none';
    if (_barFill) _barFill.style.width = Math.max(0, (_plateHp / CFG.PLATE_HP) * 100) + '%';
  }

  /* ── Equip plate ─────────────────────────── */
  function _equip() {
    if (_plateHp > 0 || _stock <= 0 || _cooldownMs > 0) return;
    _stock--;
    _cooldownMs = CFG.COOLDOWN;
    _plateHp = CFG.PLATE_HP;
    _updateBar();
    _updateHUD();
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('🛡 PLATE EQUIPPED — 75 HP shield', '#00ddff'); } catch(e){}
    try { if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(0.1, 0.1); } catch(e){}
  }

  /* ── Intercept damage ────────────────────── */
  function _absorbDamage(dmg) {
    if (_plateHp <= 0 || dmg <= 0) return dmg;
    var absorbed = Math.min(_plateHp, dmg);
    _plateHp -= absorbed;
    _updateBar();

    if (_plateHp <= 0) {
      _plateHp = 0;
      /* Plate shatter */
      if (_flashEl) {
        _flashEl.style.display = 'block';
        _flashEl.style.opacity = '1';
        var t = 0;
        var fade = function () {
          t += 0.05;
          _flashEl.style.opacity = String(Math.max(0, 1 - t / 0.4));
          if (t < 0.4) setTimeout(fade, 50);
          else _flashEl.style.display = 'none';
        };
        setTimeout(fade, 30);
      }
      try { if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(0.35, 0.3); } catch(e){}
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('🛡 PLATE BROKEN', '#ff4422'); } catch(e){}
    }
    return dmg - absorbed;
  }

  /* ── Monitor player HP for damage ─────── */
  function _monitorDamage(dt) {
    try {
      var player = window.player;
      if (!player) return;
      var hp = player.hp;
      if (_lastRealHp < 0) { _lastRealHp = hp; return; }
      if (hp < _lastRealHp && _plateHp > 0) {
        var drop = _lastRealHp - hp;
        var remaining = _absorbDamage(drop);
        /* Restore some HP that the plate absorbed */
        var restored = drop - remaining;
        if (restored > 0) {
          player.hp = Math.min(_lastRealHp, hp + restored);
          /* Update HUD HP display */
          try {
            if (window.HUD && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
          } catch(ex){}
        }
        _lastRealHp = player.hp;
      } else {
        _lastRealHp = hp;
      }
    } catch(e){}
  }

  /* ── rAF tick ──────────────────────────── */
  var _lastTs = 0;
  var _frameN = 0;
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Cooldown */
    if (_cooldownMs > 0) {
      _cooldownMs = Math.max(0, _cooldownMs - dt * 1000);
      if (_cooldownMs === 0) _updateHUD();
    }

    /* Damage monitoring — every 2 frames */
    if (_frameN % 2 === 0) _monitorDamage(dt);

    /* Plate bar pulse when active */
    if (_plateHp > 0 && _barFill && _frameN % 4 === 0) {
      var pulse = 0.75 + 0.25 * Math.sin(ts / 300);
      _barFill.style.opacity = String(pulse);
    }

    /* Wave restock */
    try {
      var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;
      if (w > 0 && w !== (_lastWave || 0)) {
        _lastWave = w;
        _stock    = CFG.STOCK;
        _cooldownMs = 0;
        _updateHUD();
      }
    } catch(e){}
  }
  var _lastWave = 0;

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _buildBar();

    /* HUD chip */
    _hudEl = document.createElement('div');
    _hudEl.id = 'ap-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:390px;left:52px;font-family:monospace;font-size:9px;',
      'pointer-events:none;z-index:210;line-height:20px;letter-spacing:0.08em;',
    ].join('');
    document.body.appendChild(_hudEl);
    _updateHUD();

    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyA' && e.altKey && !e.ctrlKey) {
        e.preventDefault();
        _equip();
      }
    });

    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ArmorPlates = ArmorPlates;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ArmorPlates.init(); });
} else {
  ArmorPlates.init();
}
