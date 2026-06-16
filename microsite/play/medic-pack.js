/* ============================================================
 *  MEDIC-PACK.JS — Field medicine: H key to heal
 *
 *  Starts with 2 medic packs. H key → heals +40 HP over 3s.
 *  Can't use while already healing or at full HP.
 *  Visual: green pulsing vignette + HUD counter + progress bar.
 *  Restocks on airdrop collect (monkey-patches HUD.notifyPickup).
 * ============================================================ */
var MedicPack = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    MAX_STOCK:   2,
    HEAL_AMOUNT: 40,
    HEAL_SEC:    3.0,
    COOLDOWN:    6.0,
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _stock       = CFG.MAX_STOCK;
  var _healing     = false;
  var _healTimer   = 0;
  var _healTotal   = 0;
  var _cooldown    = 0;
  var _hudEl       = null;
  var _barEl       = null;
  var _vigEl       = null;

  function _getPlayer() { try { return window.player || null; } catch(e){return null;} }

  /* ── Start heal ─────────────────────────── */
  function _startHeal() {
    if (_stock <= 0) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('No medic packs remaining', '#888'); } catch(e){}
      return;
    }
    if (_healing) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('Already healing…', '#44ff88'); } catch(e){}
      return;
    }
    if (_cooldown > 0) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('Medic on cooldown', '#888'); } catch(e){}
      return;
    }
    var p = _getPlayer();
    if (p && p.hp >= p.maxHp) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('Already at full health', '#44ff88'); } catch(e){}
      return;
    }

    _stock--;
    _healing   = true;
    _healTimer = 0;
    _healTotal = 0;
    _cooldown  = CFG.COOLDOWN;
    _updateHUD();

    if (_vigEl) {
      _vigEl.style.opacity = '1';
      _vigEl.style.transition = 'opacity 0.4s';
    }
    if (_barEl) _barEl.parentElement.style.display = 'block';
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('💉 FIELD DRESSING APPLIED', '#44ff88'); } catch(e){}
  }

  /* ── Update ──────────────────────────────── */
  function update(dt) {
    _cooldown = Math.max(0, _cooldown - dt);

    if (!_healing) return;

    _healTimer += dt;
    var frac = Math.min(1, _healTimer / CFG.HEAL_SEC);

    /* Heal proportionally each frame */
    var targetHeal = CFG.HEAL_AMOUNT * frac;
    var delta      = targetHeal - _healTotal;
    if (delta > 0) {
      var p = _getPlayer();
      if (p) {
        var newHp = Math.min((p.maxHp || 100), (p.hp || 0) + delta);
        p.hp = newHp;
        _healTotal = targetHeal;
        try { if (window.HUD && HUD.setHealth) HUD.setHealth(p.hp, p.maxHp); } catch(e){}
      }
    }

    /* Progress bar */
    if (_barEl) _barEl.style.width = (frac * 100) + '%';

    /* Vignette pulse */
    if (_vigEl) {
      var pulse = 0.5 + 0.3 * Math.abs(Math.sin(_healTimer * 3));
      _vigEl.style.opacity = String(pulse);
    }

    if (frac >= 1) {
      _healing = false;
      if (_vigEl) { _vigEl.style.transition = 'opacity 0.6s'; _vigEl.style.opacity = '0'; }
      if (_barEl) _barEl.parentElement.style.display = 'none';
    }
  }

  /* ── HUD ──────────────────────────────── */
  function _updateHUD() {
    if (_hudEl) {
      _hudEl.textContent = '💉 ' + _stock;
      _hudEl.style.opacity = _stock > 0 ? '1' : '0.35';
    }
  }

  /* ── Init ────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    var style = document.createElement('style');
    style.textContent = [
      '#medic-vig{transition:opacity 0.4s;pointer-events:none;}',
      '#medic-bar-wrap{display:none;position:fixed;bottom:155px;left:50%;',
        'transform:translateX(-50%);width:200px;height:4px;',
        'background:rgba(0,0,0,0.5);border:1px solid rgba(68,255,136,0.4);',
        'border-radius:2px;z-index:220;pointer-events:none;}',
      '#medic-bar{height:100%;width:0;background:#44ff88;border-radius:2px;',
        'box-shadow:0 0 6px #44ff88;transition:width 0.1s linear;}',
    ].join('');
    document.head.appendChild(style);

    /* Heal vignette */
    _vigEl = document.createElement('div');
    _vigEl.id = 'medic-vig';
    _vigEl.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:106;',
      'opacity:0;',
      'background:radial-gradient(ellipse at center,',
        'rgba(68,255,136,0.0) 30%,rgba(20,200,80,0.30) 100%);',
    ].join('');
    document.body.appendChild(_vigEl);

    /* Progress bar */
    var barWrap = document.createElement('div');
    barWrap.id = 'medic-bar-wrap';
    _barEl = document.createElement('div');
    _barEl.id = 'medic-bar';
    barWrap.appendChild(_barEl);
    document.body.appendChild(barWrap);

    /* HUD counter (above smoke counter) */
    _hudEl = document.createElement('div');
    _hudEl.id = 'medic-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:210px;left:12px;font-family:monospace;font-size:11px;',
      'color:#44ff88;background:rgba(0,0,0,0.5);border:1px solid rgba(68,255,136,0.3);',
      'padding:2px 7px;border-radius:4px;z-index:210;pointer-events:none;',
    ].join('');
    _updateHUD();
    document.body.appendChild(_hudEl);

    /* [H] label */
    var hint = document.createElement('div');
    hint.style.cssText = [
      'position:fixed;bottom:210px;left:52px;font-family:monospace;font-size:9px;',
      'color:rgba(68,255,136,0.45);pointer-events:none;z-index:210;line-height:20px;',
    ].join('');
    hint.textContent = '[H] MEDIC';
    document.body.appendChild(hint);

    /* Key handler */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyH' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        _startHeal();
      }
    });

    /* rAF loop */
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  function restock(n) {
    _stock = Math.min(CFG.MAX_STOCK, _stock + (n || 1));
    _updateHUD();
  }

  return { init: init, restock: restock };
})();

window.MedicPack = MedicPack;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { MedicPack.init(); });
} else {
  MedicPack.init();
}
