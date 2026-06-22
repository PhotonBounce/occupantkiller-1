// radio-support.js — Artillery strike and airstrike call-in system
// Uses var only (no let/const)

window.RadioSupport = (function() {

  // ── State ────────────────────────────────────────────────────
  var _scene = null;
  var _aoKillCb = null; // function(pos, radius, callback)

  var _artilleryCharges = 0;
  var _airstrikeCharges = 0;
  var _totalKills = 0;

  var MAX_CHARGES = 3;
  var ART_KILLS_PER_CHARGE = 10;
  var AIR_KILLS_PER_CHARGE = 15;

  var _menuOpen = false;
  var _menuEl = null;
  var _hudEl = null;

  // Pending strikes: array of { type, targetPos, timer, phase }
  var _pendingStrikes = [];

  // Active VFX: array of { mesh, light, startTime, duration, expandFrom, expandTo }
  var _vfx = [];

  // ── HUD counter element ──────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'radio-support-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:52px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#fff',
      'font-family:monospace',
      'font-size:14px',
      'text-shadow:1px 1px 2px #000',
      'pointer-events:none',
      'z-index:400',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.textContent = '📻 ART\xD7' + _artilleryCharges + '  AIR\xD7' + _airstrikeCharges;
  }

  // ── Menu element ─────────────────────────────────────────────
  function _createMenu() {
    if (_menuEl) return;
    _menuEl = document.createElement('div');
    _menuEl.id = 'radio-support-menu';
    _menuEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'padding:16px 24px',
      'border:2px solid #ff4400',
      'color:#fff',
      'font-family:monospace',
      'z-index:500',
      'display:none',
      'min-width:260px',
      'text-align:left'
    ].join(';');
    document.body.appendChild(_menuEl);
  }

  function _renderMenu() {
    if (!_menuEl) return;
    var html = '<div style="color:#ff4400;font-weight:bold;font-size:15px;margin-bottom:10px;">📻 RADIO SUPPORT</div>';
    html += '<div style="margin-bottom:8px;color:#ffcc00;">[1] Artillery Strike</div>';
    html += '<div style="font-size:11px;color:#aaa;margin-bottom:4px;">5s delay · 12-unit radius · 5 shells · ART\xD7' + _artilleryCharges + '</div>';
    html += '<div style="margin-bottom:8px;color:#66ccff;">[2] Airstrike</div>';
    html += '<div style="font-size:11px;color:#aaa;margin-bottom:10px;">2s delay · 8-unit radius · strafing run · AIR\xD7' + _airstrikeCharges + '</div>';
    html += '<div style="color:#666;font-size:11px;">[ESC] Close</div>';
    _menuEl.innerHTML = html;
  }

  // ── Toast notification ────────────────────────────────────────
  function _toast(text, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(text, color || '#ff4400');
    }
  }

  // ── Audio helpers ────────────────────────────────────────────
  function _playBeeps() {
    try {
      var ctx = window._audioCtx;
      if (!ctx) return;
      for (var i = 0; i < 3; i++) {
        (function(idx) {
          var startT = ctx.currentTime + idx * 0.3;
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, startT);
          gain.gain.setValueAtTime(0.4, startT);
          gain.gain.setValueAtTime(0, startT + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startT);
          osc.stop(startT + 0.2);
        })(i);
      }
    } catch (e) { /* audio not available */ }
  }

  function _playJetSFX() {
    try {
      var ctx = window._audioCtx;
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) { /* audio not available */ }
  }

  // ── VFX: single explosion ─────────────────────────────────────
  function _spawnExplosion(x, y, z, expandDuration) {
    if (!_scene) return;

    // Flash column
    var flashGeo = new THREE.BoxGeometry(0.3, 6, 0.3);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(x, y + 3, z);
    _scene.add(flash);
    // Remove flash after one frame (instant)
    setTimeout(function() {
      _scene.remove(flash);
      flashGeo.dispose();
      flashMat.dispose();
    }, 50);

    // Expanding sphere
    var sphereGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var sphereMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    var sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(x, y + 0.5, z);
    _scene.add(sphere);

    // Point light
    var light = new THREE.PointLight(0xffaa00, 12, 18);
    light.position.set(x, y + 1, z);
    _scene.add(light);

    var dur = expandDuration || 0.4;
    _vfx.push({
      sphere: sphere,
      sphereGeo: sphereGeo,
      sphereMat: sphereMat,
      light: light,
      elapsed: 0,
      duration: dur,
      expandFrom: 0.3,
      expandTo: 3.5
    });
  }

  // ── AoE kill at position ──────────────────────────────────────
  function _killInRadius(pos, radius) {
    if (_aoKillCb) {
      _aoKillCb(pos, radius, null);
    }
  }

  // ── Artillery strike execution ────────────────────────────────
  function _executeArtillery(targetPos) {
    var impacts = 5;
    for (var i = 0; i < impacts; i++) {
      (function(idx) {
        setTimeout(function() {
          var angle = Math.random() * Math.PI * 2;
          var dist = Math.random() * 8;
          var ix = targetPos.x + Math.cos(angle) * dist;
          var iz = targetPos.z + Math.sin(angle) * dist;
          var ipos = { x: ix, y: targetPos.y, z: iz };
          _spawnExplosion(ix, targetPos.y, iz, 0.4);
          _killInRadius(ipos, 4);
          if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
            CameraSystem.shake(0.08, 0.5);
          }
        }, idx * 120);
      })(i);
    }
  }

  // ── Airstrike execution ───────────────────────────────────────
  function _executeAirstrike(targetPos) {
    var explosions = 3;
    for (var i = 0; i < explosions; i++) {
      (function(idx) {
        setTimeout(function() {
          // Strafing run: north-to-south (Z axis), each 5 units apart
          var ex = targetPos.x;
          var ez = targetPos.z + (idx - 1) * 5;
          var epos = { x: ex, y: targetPos.y, z: ez };
          _spawnExplosion(ex, targetPos.y, ez, 0.25);
          _killInRadius(epos, 3.5);
          if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
            CameraSystem.shake(0.06, 0.35);
          }
        }, idx * 600);
      })(i);
    }
  }

  // ── Public: init ─────────────────────────────────────────────
  function init(scene, aoKillCallback) {
    _scene = scene;
    _aoKillCb = aoKillCallback;
    _createHUD();
    _createMenu();
    // ESC / 1 / 2 key listener for menu
    document.addEventListener('keydown', function(e) {
      if (!_menuOpen) return;
      if (e.key === 'Escape') {
        closeMenu();
      } else if (e.key === '1') {
        _selectArtillery();
      } else if (e.key === '2') {
        _selectAirstrike();
      }
    });
  }

  // ── Public: update (call each frame with delta seconds) ──────
  function update(delta) {
    // Tick VFX
    for (var vi = _vfx.length - 1; vi >= 0; vi--) {
      var v = _vfx[vi];
      v.elapsed += delta;
      var t = Math.min(v.elapsed / v.duration, 1);
      var scale = v.expandFrom + (v.expandTo - v.expandFrom) * t;
      v.sphere.scale.setScalar(scale / v.expandFrom);

      // Fade light
      v.light.intensity = 12 * (1 - t);

      if (t >= 1) {
        if (_scene) {
          _scene.remove(v.sphere);
          _scene.remove(v.light);
        }
        v.sphereGeo.dispose();
        v.sphereMat.dispose();
        _vfx.splice(vi, 1);
      }
    }
  }

  // ── Public: clear (called on stage change) ───────────────────
  function clear() {
    // Clean up any live VFX
    for (var vi = 0; vi < _vfx.length; vi++) {
      var v = _vfx[vi];
      if (_scene) {
        _scene.remove(v.sphere);
        _scene.remove(v.light);
      }
      v.sphereGeo.dispose();
      v.sphereMat.dispose();
    }
    _vfx = [];
    _pendingStrikes = [];
    closeMenu();
  }

  // ── Public: reset (called on new game) ───────────────────────
  function reset() {
    _artilleryCharges = 0;
    _airstrikeCharges = 0;
    _totalKills = 0;
    clear();
    _updateHUD();
  }

  // ── Public: openMenu ─────────────────────────────────────────
  function openMenu() {
    if (_menuOpen) { closeMenu(); return; }
    if (!_menuEl) _createMenu();
    _menuOpen = true;
    _renderMenu();
    _menuEl.style.display = 'block';
  }

  function closeMenu() {
    _menuOpen = false;
    if (_menuEl) _menuEl.style.display = 'none';
  }

  // ── Public: addCharge ────────────────────────────────────────
  function addCharge(type) {
    if (type === 'artillery') {
      _artilleryCharges = Math.min(MAX_CHARGES, _artilleryCharges + 1);
    } else if (type === 'airstrike') {
      _airstrikeCharges = Math.min(MAX_CHARGES, _airstrikeCharges + 1);
    }
    _updateHUD();
  }

  // ── Public: onKill ───────────────────────────────────────────
  function onKill() {
    _totalKills++;
    var gotArt = (_totalKills % ART_KILLS_PER_CHARGE === 0);
    var gotAir = (_totalKills % AIR_KILLS_PER_CHARGE === 0);
    if (gotArt && _artilleryCharges < MAX_CHARGES) {
      _artilleryCharges++;
      _toast('📻 Artillery charge ready! (' + _artilleryCharges + ')', '#ffcc00');
    }
    if (gotAir && _airstrikeCharges < MAX_CHARGES) {
      _airstrikeCharges++;
      _toast('📻 Airstrike charge ready! (' + _airstrikeCharges + ')', '#66ccff');
    }
    _updateHUD();
  }

  // ── Menu selection handlers ──────────────────────────────────
  function _getPlayerPos() {
    // Try to read from game-manager's player position
    if (window._player && window._player.position) return window._player.position;
    if (window.GameManager && window.GameManager.getPlayerPosition) return window.GameManager.getPlayerPosition();
    // Fallback: try player global
    if (typeof player !== 'undefined' && player.position) return player.position;
    return { x: 0, y: 0, z: 0 };
  }

  function _selectArtillery() {
    closeMenu();
    if (_artilleryCharges <= 0) {
      _toast('No artillery charges available', '#ff4400');
      return;
    }
    _artilleryCharges--;
    _updateHUD();

    var targetPos = { x: 0, y: 0, z: 0 };
    var pp = _getPlayerPos();
    targetPos.x = pp.x; targetPos.y = pp.y; targetPos.z = pp.z;

    _toast('🔴 ARTILLERY INBOUND', '#ff2200');

    // 2.5s: warning beeps
    setTimeout(function() {
      _playBeeps();
    }, 2500);

    // 5s: shells land
    setTimeout(function() {
      _executeArtillery(targetPos);
    }, 5000);
  }

  function _selectAirstrike() {
    closeMenu();
    if (_airstrikeCharges <= 0) {
      _toast('No airstrike charges available', '#ff4400');
      return;
    }
    _airstrikeCharges--;
    _updateHUD();

    var targetPos = { x: 0, y: 0, z: 0 };
    var pp = _getPlayerPos();
    targetPos.x = pp.x; targetPos.y = pp.y; targetPos.z = pp.z;

    // 1s: toast
    setTimeout(function() {
      _toast('🛩 AIRSTRIKE INCOMING', '#66ccff');
    }, 1000);

    // 2s: jet SFX + explosions
    setTimeout(function() {
      _playJetSFX();
      _executeAirstrike(targetPos);
    }, 2000);
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init: init,
    update: update,
    clear: clear,
    reset: reset,
    openMenu: openMenu,
    addCharge: addCharge,
    onKill: onKill
  };

})();
