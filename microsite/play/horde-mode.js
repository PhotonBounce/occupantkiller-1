/* ============================================================
 *  HORDE-MODE.JS — Infinite wave survival mode
 *  H key: toggle on/off
 *  Waves grow in count (+4/wave, starting at 8) and difficulty.
 *  2× score multiplier, personal-best tracking, boss every 5th wave,
 *  ammo resupply crate on wave clear.
 * ============================================================ */
window.HordeMode = (function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────── */
  var CFG = {
    BASE_ENEMIES:   8,      // enemies on wave 1
    ENEMIES_STEP:   4,      // +4 per wave
    HP_SCALE_RATE:  0.1,    // +10% HP per wave
    SPEED_SCALE:    0.05,   // +0.05 speed per wave
    SCORE_MULT:     2,
    REST_SECONDS:   10,
    BOSS_EVERY:     5,
    CRATE_HALF:     0.25,   // BoxGeometry half-size (full 0.5)
    CRATE_COLOR:    0x4b5320, // olive drab
    LS_KEY:         'okk_horde_best_v1',
  };

  /* ── State ──────────────────────────────────────────────── */
  var _active       = false;
  var _wave         = 0;
  var _restTimer    = 0;
  var _inRest       = false;
  var _spawned      = 0;   // enemies spawned this wave
  var _waveTarget   = 0;   // total enemies this wave
  var _hudEl        = null;
  var _scene        = null;
  var _crates       = [];  // live supply crate meshes
  var _bestWave     = 0;
  var _initialized  = false;

  /* ── HUD element creation ───────────────────────────────── */
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'horde-hud';
    _hudEl.style.cssText = [
      'display:none',
      'position:fixed',
      'top:130px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:#ff2222',
      'text-shadow:0 0 12px rgba(255,0,0,0.8)',
      'z-index:201',
      'pointer-events:none',
      'text-align:center',
      'line-height:1.4',
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';
    var alive = _getAliveCount();
    var restTxt = _inRest
      ? ('<br><span style="color:#ffcc00;font-size:13px">NEXT WAVE IN ' + Math.ceil(_restTimer) + 's</span>')
      : ('<br><span style="color:#ff8888;font-size:13px">ENEMIES: ' + alive + '</span>');
    _hudEl.innerHTML = 'HORDE WAVE ' + _wave + restTxt;
  }

  /* ── Helpers ────────────────────────────────────────────── */
  function _getAliveCount() {
    if (typeof Enemies !== 'undefined' && Enemies.getAliveCount) {
      return Enemies.getAliveCount();
    }
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      return Enemies.getAll().length;
    }
    return 0;
  }

  function _toast(msg, ms, color) {
    ms    = ms    || 3000;
    color = color || '#ffffff';
    if (typeof window.HUD !== 'undefined' && window.HUD.showToast) {
      window.HUD.showToast(msg, ms, color);
    }
  }

  function _bestStr() {
    try { return parseInt(localStorage.getItem(CFG.LS_KEY), 10) || 0; } catch (e) { return 0; }
  }

  function _saveBest(w) {
    try {
      var prev = _bestStr();
      if (w > prev) localStorage.setItem(CFG.LS_KEY, String(w));
    } catch (e) {}
  }

  function _waveEnemyCount(w) {
    return CFG.BASE_ENEMIES + CFG.ENEMIES_STEP * (w - 1);
  }

  /* ── Scene reference ────────────────────────────────────── */
  function _getScene() {
    if (_scene) return _scene;
    if (typeof GameManager !== 'undefined' && GameManager.getScene) {
      _scene = GameManager.getScene();
    }
    return _scene;
  }

  /* ── Ammo crate ─────────────────────────────────────────── */
  function _spawnCrate() {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;
    var geo  = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var mat  = new THREE.MeshLambertMaterial({ color: CFG.CRATE_COLOR });
    var mesh = new THREE.Mesh(geo, mat);

    var px = (Math.random() - 0.5) * 40;
    var pz = (Math.random() - 0.5) * 40;
    mesh.position.set(px, 0.25, pz);
    mesh.castShadow = true;
    mesh.userData.isHordeCrate = true;
    sc.add(mesh);
    _crates.push(mesh);
  }

  function _clearCrates() {
    var sc = _getScene();
    for (var ci = 0; ci < _crates.length; ci++) {
      var cm = _crates[ci];
      if (sc) sc.remove(cm);
      if (cm.geometry) cm.geometry.dispose();
      if (cm.material) cm.material.dispose();
    }
    _crates = [];
  }

  /* Check if player walks into a crate (called from update) */
  function _checkCratePickup() {
    var sc = _getScene();
    if (!sc) return;
    var playerPos = null;
    if (typeof GameManager !== 'undefined' && GameManager.getPlayerPosition) {
      playerPos = GameManager.getPlayerPosition();
    } else if (typeof window._playerPosition !== 'undefined') {
      playerPos = window._playerPosition;
    }
    if (!playerPos) return;

    var toRemove = [];
    for (var ci = 0; ci < _crates.length; ci++) {
      var cm = _crates[ci];
      var dx = cm.position.x - playerPos.x;
      var dz = cm.position.z - playerPos.z;
      if (dx * dx + dz * dz < 2.25) { // 1.5 unit radius
        toRemove.push(ci);
        _toast('AMMO RESUPPLY!', 2500, '#ffcc00');
        if (typeof window._playerAmmo !== 'undefined') {
          window._playerAmmo = Math.min((window._playerAmmo || 0) + 120, 999);
        }
      }
    }
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      var idx = toRemove[ri];
      var rm  = _crates[idx];
      if (sc) sc.remove(rm);
      if (rm.geometry) rm.geometry.dispose();
      if (rm.material) rm.material.dispose();
      _crates.splice(idx, 1);
    }
  }

  /* ── Wave spawn ─────────────────────────────────────────── */
  function _spawnWave(w) {
    if (typeof Enemies === 'undefined' || !Enemies.spawnSingle) return;

    var count    = _waveEnemyCount(w);
    var hpMult   = 1 + CFG.HP_SCALE_RATE * w;
    var spdBonus = CFG.SPEED_SCALE * w;
    var isBoss   = (w % CFG.BOSS_EVERY === 0);

    _waveTarget = count + (isBoss ? 1 : 0);
    _spawned    = 0;

    /* Normal enemies */
    var pool = ['STORMER', 'CONSCRIPT', 'ARMORED', 'SNIPER'];
    for (var si = 0; si < count; si++) {
      var type = pool[si % pool.length];
      var px   = (Math.random() - 0.5) * 60;
      var pz   = (Math.random() - 0.5) * 60;
      try {
        var ent = Enemies.spawnSingle(type, { x: px, z: pz });
        if (ent) {
          if (typeof ent.hp    !== 'undefined') ent.hp    *= hpMult;
          if (typeof ent.maxHp !== 'undefined') ent.maxHp *= hpMult;
          if (typeof ent.speed !== 'undefined') ent.speed += spdBonus;
        }
      } catch (e) {}
      _spawned++;
    }

    /* Boss on every 5th wave */
    if (isBoss) {
      try {
        var bx   = (Math.random() - 0.5) * 40;
        var bz   = (Math.random() - 0.5) * 40;
        var boss = Enemies.spawnSingle('ARMORED', { x: bx, z: bz });
        if (boss) {
          if (typeof boss.hp    !== 'undefined') boss.hp    *= hpMult * 2;
          if (typeof boss.maxHp !== 'undefined') boss.maxHp *= hpMult * 2;
          if (typeof boss.speed !== 'undefined') boss.speed += spdBonus;
        }
      } catch (e) {}
      _spawned++;
      _toast('BOSS WAVE! Heavy unit inbound!', 4000, '#ff4400');
    }
  }

  /* ── Toggle ─────────────────────────────────────────────── */
  function _enable() {
    _active              = true;
    window._hordeModeActive = true;
    window._scoreMult       = CFG.SCORE_MULT;
    _wave    = 0;
    _inRest  = false;
    _restTimer = 0;
    _clearCrates();
    _bestWave = _bestStr();
    _ensureHUD();
    _toast('HORDE MODE ACTIVATED — 2x SCORE', 3500, '#ff2222');
    _startNextWave();
  }

  function _disable() {
    _active              = false;
    window._hordeModeActive = false;
    window._scoreMult       = 1;
    _inRest  = false;
    _restTimer = 0;
    _clearCrates();
    if (_hudEl) _hudEl.style.display = 'none';
    _toast('Horde Mode OFF', 2500, '#aaaaaa');
  }

  function _toggle() {
    if (_active) { _disable(); } else { _enable(); }
  }

  function _startNextWave() {
    _wave++;
    _inRest   = false;
    _restTimer = 0;
    _toast('HORDE WAVE ' + _wave + ' — ' + _waveEnemyCount(_wave) + ' enemies!', 3000, '#ff2222');
    _spawnWave(_wave);
    _updateHUD();
  }

  function _startRest() {
    _inRest    = true;
    _restTimer = CFG.REST_SECONDS;
    _spawnCrate();
    _toast('WAVE CLEARED! Ammo crate dropped. Next wave in ' + CFG.REST_SECONDS + 's', 4000, '#44ff88');
    _updateHUD();
  }

  /* ── Death notification ─────────────────────────────────── */
  function _onPlayerDeath() {
    if (!_active) return;
    _saveBest(_wave);
    var best = _bestStr();
    _disable();
    _toast('HORDE BEST: WAVE ' + best, 6000, '#ff2222');
  }

  /* ── Key handler ────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.code === 'KeyH' || e.key === 'h' || e.key === 'H') {
      /* Only act if game is in play (not in menus) */
      var inGame = (typeof window._gameState !== 'undefined')
        ? (window._gameState === 'playing' || window._gameState === 'PLAYING')
        : true;
      if (inGame) _toggle();
    }
  }

  /* ── Public API ─────────────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    _bestWave    = _bestStr();
    _ensureHUD();
    window.addEventListener('keydown', _onKeyDown);

    /* Hook into player-death event if available */
    var _origDeath = window._onPlayerDeath;
    window._onPlayerDeath = function () {
      _onPlayerDeath();
      if (typeof _origDeath === 'function') _origDeath.apply(this, arguments);
    };

    /* Expose a direct death hook for other modules */
    window._hordeOnPlayerDeath = _onPlayerDeath;

    console.log('[HordeMode] initialized. H key toggles horde mode.');
  }

  function update(delta) {
    if (!_active) return;

    _checkCratePickup();

    if (_inRest) {
      _restTimer -= delta;
      _updateHUD();
      if (_restTimer <= 0) {
        _inRest = false;
        _startNextWave();
      }
      return;
    }

    /* Check wave-clear: all alive enemies gone */
    var alive = _getAliveCount();
    _updateHUD();

    if (_spawned > 0 && alive === 0) {
      _spawned = 0; // prevent re-triggering
      _startRest();
    }
  }

  function start() { _enable(); }

  function reset() {
    _disable();
    _wave      = 0;
    _inRest    = false;
    _restTimer = 0;
    _spawned   = 0;
    _waveTarget = 0;
  }

  return { init: init, update: update, start: start, reset: reset };

}());
