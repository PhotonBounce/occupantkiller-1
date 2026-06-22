// ============================================================
//  vehicle-repair.js — Vehicle Repair System with Toolbox Pickups
//
//  Allows players to repair damaged vehicles using toolbox pickups.
//  Walk within 2 units of an active vehicle and hold E for 3s to repair.
//  Cannot repair while enemies are within 10 units.
//  Cannot repair destroyed wrecks from vehicle-wrecks.js.
//
//  Public API: init(scene), update(dt), spawnToolbox(x, y, z), reset()
//  Global:     window._toolboxCount
// ============================================================
window.VehicleRepair = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────
  var _scene = null;
  var _toolboxes = [];          // active pickup objects in scene
  var _repairTimer = 0;         // seconds E held near vehicle
  var _repairDuration = 3.0;    // seconds required to complete repair
  var _isRepairing = false;
  var _repairWarningShown = false;
  var _repairComplete = false;
  var _sparks = [];             // active spark particles
  var _eKeyHeld = false;
  var _hudEl = null;            // "🔧 TOOL x2" HUD element
  var _progressBarEl = null;    // repair progress bar element
  var _bannerEl = null;         // result banner element
  var _warningEl = null;        // "CLEAR AREA FIRST" warning
  var _audioCtx = null;         // AudioContext for hammering sound
  var _lastHammerTime = 0;      // time of last hammer burst
  var _hammerInterval = 0.2;    // 200ms between hammer bursts
  var _initialized = false;
  var _nearVehicleCache = false;
  var _spawnOnWave3Done = false; // guard so we only auto-spawn once

  // Max toolboxes player can carry
  var MAX_TOOLBOXES = 2;

  // ── Init ─────────────────────────────────────────────────────

  function init(scene) {
    if (_initialized) return;
    _scene = scene || (window.GameManager && window.GameManager.getScene ? window.GameManager.getScene() : null);
    window._toolboxCount = window._toolboxCount || 0;

    _buildHUD();
    _buildProgressBar();
    _buildBanner();
    _buildWarning();
    _bindKeys();

    _initialized = true;
  }

  // ── Key binding ──────────────────────────────────────────────

  function _bindKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        _eKeyHeld = true;
      }
    });
    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        _eKeyHeld = false;
        if (_isRepairing) {
          _cancelRepair();
        }
      }
    });
  }

  // ── Toolbox Mesh ─────────────────────────────────────────────

  function spawnToolbox(x, y, z) {
    if (!_scene) {
      _scene = window.GameManager && window.GameManager.getScene ? window.GameManager.getScene() : null;
    }
    if (!_scene) return;

    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Main body — red BoxGeometry(0.3, 0.2, 0.4)
    var bodyGeo = new THREE.BoxGeometry(0.3, 0.2, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0);
    group.add(body);

    // Handle — small BoxGeometry(0.05, 0.12, 0.05)
    var handleGeo = new THREE.BoxGeometry(0.05, 0.12, 0.05);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x884400 });
    var handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0.16, 0);
    group.add(handle);

    // "TOOL" canvas label sprite
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 128, 32);
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOOL', 64, 16);
    var tex = new THREE.CanvasTexture(canvas);
    var spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    var sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.5, 0.125, 1);
    sprite.position.set(0, 0.35, 0);
    group.add(sprite);

    _scene.add(group);

    var toolbox = {
      group: group,
      body: body,
      handle: handle,
      sprite: sprite,
      canvas: canvas,
      tex: tex,
      bobOffset: Math.random() * Math.PI * 2,
      time: 0,
      removed: false
    };
    _toolboxes.push(toolbox);
    return toolbox;
  }

  // ── HUD Elements ─────────────────────────────────────────────

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'vr-toolbox-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'right:20px',
      'padding:6px 12px',
      'background:rgba(0,0,0,0.65)',
      'color:#fff',
      'font-family:monospace',
      'font-size:14px',
      'border-radius:4px',
      'border:1px solid rgba(255,255,255,0.3)',
      'display:none',
      'pointer-events:none',
      'z-index:900'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _buildProgressBar() {
    var container = document.createElement('div');
    container.id = 'vr-progress-container';
    container.style.cssText = [
      'position:fixed',
      'bottom:160px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:220px',
      'background:rgba(0,0,0,0.7)',
      'border:2px solid #fff',
      'border-radius:4px',
      'padding:4px',
      'display:none',
      'pointer-events:none',
      'z-index:901'
    ].join(';');

    var label = document.createElement('div');
    label.style.cssText = 'color:#fff;font-family:monospace;font-size:12px;text-align:center;margin-bottom:3px;';
    label.textContent = 'REPAIRING...';

    var barOuter = document.createElement('div');
    barOuter.style.cssText = 'background:#333;height:12px;border-radius:2px;overflow:hidden;';

    var barInner = document.createElement('div');
    barInner.id = 'vr-progress-fill';
    barInner.style.cssText = 'background:#4488ff;height:100%;width:0%;transition:width 0.05s linear;';

    barOuter.appendChild(barInner);
    container.appendChild(label);
    container.appendChild(barOuter);
    document.body.appendChild(container);

    _progressBarEl = container;
  }

  function _buildBanner() {
    _bannerEl = document.createElement('div');
    _bannerEl.id = 'vr-banner';
    _bannerEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'padding:14px 28px',
      'background:rgba(0,60,200,0.85)',
      'color:#fff',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'border-radius:6px',
      'border:2px solid #88aaff',
      'display:none',
      'pointer-events:none',
      'z-index:950',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_bannerEl);
  }

  function _buildWarning() {
    _warningEl = document.createElement('div');
    _warningEl.id = 'vr-warning';
    _warningEl.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translateX(-50%)',
      'padding:10px 20px',
      'background:rgba(180,30,0,0.85)',
      'color:#fff',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'border-radius:4px',
      'border:2px solid #ff5533',
      'display:none',
      'pointer-events:none',
      'z-index:950',
      'text-align:center'
    ].join(';');
    _warningEl.textContent = 'CLEAR AREA FIRST';
    document.body.appendChild(_warningEl);
  }

  // ── Update ────────────────────────────────────────────────────

  function update(dt) {
    if (!_initialized) return;

    var t = (window.performance ? window.performance.now() : Date.now()) / 1000;

    // Animate toolboxes (bob up/down)
    for (var i = _toolboxes.length - 1; i >= 0; i--) {
      var tb = _toolboxes[i];
      if (tb.removed) {
        _toolboxes.splice(i, 1);
        continue;
      }
      tb.time += dt;
      tb.group.position.y += Math.sin(tb.time * 2 + tb.bobOffset) * 0.002;
      tb.group.rotation.y += dt * 0.8;

      // Check player proximity for pickup
      _checkToolboxPickup(tb, i);
    }

    // Animate sparks
    _updateSparks(dt);

    // Detect if player is near a vehicle
    var nearVehicle = _isNearVehicle();
    _nearVehicleCache = nearVehicle;

    // Show/hide toolbox HUD
    if (nearVehicle) {
      _hudEl.textContent = '🔧 TOOL x' + (window._toolboxCount || 0);
      _hudEl.style.display = 'block';
    } else {
      _hudEl.style.display = 'none';
      if (_isRepairing) _cancelRepair();
    }

    // Auto-spawn toolboxes on wave 3 completion
    _checkWave3Spawn();

    // Repair logic
    if (nearVehicle && _eKeyHeld && window._toolboxCount > 0) {
      // Check if vehicle HP is below 10% (unrecoverable)
      var hp = window._vehicleHP !== undefined ? window._vehicleHP : 100;
      var maxHp = window._vehicleMaxHP !== undefined ? window._vehicleMaxHP : 100;
      if (hp < maxHp * 0.1) {
        _showBanner('VEHICLE DESTROYED — UNRECOVERABLE', '#c00');
        if (_isRepairing) _cancelRepair();
        return;
      }

      // Check for nearby enemies
      if (_enemiesNearby()) {
        _warningEl.style.display = 'block';
        if (_isRepairing) _cancelRepair();
        return;
      }
      _warningEl.style.display = 'none';

      // Tick repair timer
      _isRepairing = true;
      _repairTimer += dt;
      _progressBarEl.style.display = 'block';
      var pct = Math.min((_repairTimer / _repairDuration) * 100, 100);
      var fill = document.getElementById('vr-progress-fill');
      if (fill) fill.style.width = pct + '%';

      // Play hammering sound
      if (t - _lastHammerTime >= _hammerInterval) {
        _playHammer();
        _lastHammerTime = t;
      }

      if (_repairTimer >= _repairDuration) {
        _completeRepair();
      }
    } else {
      // E not held or not near vehicle or no toolboxes
      _warningEl.style.display = 'none';
      if (_isRepairing) {
        _cancelRepair();
      }
    }
  }

  // ── Vehicle proximity detection ───────────────────────────────

  function _isNearVehicle() {
    // Honour explicit global flag first
    if (window._nearVehicle) return true;
    if (window._inVehicle || window._vehicleMode) return true;

    // Check player position against known vehicle positions
    var playerPos = _getPlayerPos();
    if (!playerPos) return false;

    // Try Bradley
    if (window.Bradley && typeof window.Bradley.getPosition === 'function') {
      var bp = window.Bradley.getPosition();
      if (bp && _dist3(playerPos, bp) < 2) return true;
    }
    // Try BTR80
    if (window.BTR80 && typeof window.BTR80.getPosition === 'function') {
      var bp2 = window.BTR80.getPosition();
      if (bp2 && _dist3(playerPos, bp2) < 2) return true;
    }
    // Try generic vehicle system
    if (window.VehicleSystem && typeof window.VehicleSystem.getNearestVehiclePos === 'function') {
      var vp = window.VehicleSystem.getNearestVehiclePos(playerPos);
      if (vp && _dist3(playerPos, vp) < 2) return true;
    }
    return false;
  }

  // ── Enemy proximity detection ─────────────────────────────────

  function _enemiesNearby() {
    var playerPos = _getPlayerPos();
    if (!playerPos) return false;

    // Check generic enemy list
    if (window._enemies && Array.isArray(window._enemies)) {
      for (var i = 0; i < window._enemies.length; i++) {
        var e = window._enemies[i];
        if (!e || e.dead || e.removed) continue;
        var ep = e.position || (e.mesh && e.mesh.position);
        if (ep && _dist3(playerPos, ep) < 10) return true;
      }
    }
    // Check enemy system
    if (window.Enemies && typeof window.Enemies.getList === 'function') {
      var list = window.Enemies.getList();
      if (list) {
        for (var j = 0; j < list.length; j++) {
          var en = list[j];
          if (!en || en.dead || en.removed) continue;
          var enp = en.position || (en.mesh && en.mesh.position);
          if (enp && _dist3(playerPos, enp) < 10) return true;
        }
      }
    }
    return false;
  }

  // ── Toolbox pickup check ──────────────────────────────────────

  function _checkToolboxPickup(tb, idx) {
    var playerPos = _getPlayerPos();
    if (!playerPos) return;
    var tbPos = tb.group.position;
    if (_dist3(playerPos, tbPos) < 1.2) {
      if (window._toolboxCount < MAX_TOOLBOXES) {
        window._toolboxCount = (window._toolboxCount || 0) + 1;
        _removeToolbox(tb);
        _toolboxes.splice(idx, 1);
        _showBanner('🔧 Toolbox picked up (' + window._toolboxCount + '/' + MAX_TOOLBOXES + ')', '#446644');
      }
    }
  }

  function _removeToolbox(tb) {
    if (!_scene || tb.removed) return;
    _scene.remove(tb.group);
    if (tb.body.geometry) tb.body.geometry.dispose();
    if (tb.body.material) tb.body.material.dispose();
    if (tb.handle.geometry) tb.handle.geometry.dispose();
    if (tb.handle.material) tb.handle.material.dispose();
    if (tb.tex) tb.tex.dispose();
    if (tb.sprite.material) tb.sprite.material.dispose();
    tb.removed = true;
  }

  // ── Repair actions ────────────────────────────────────────────

  function _completeRepair() {
    _isRepairing = false;
    _repairTimer = 0;
    _progressBarEl.style.display = 'none';

    // Consume one toolbox
    window._toolboxCount = Math.max(0, (window._toolboxCount || 1) - 1);

    // Restore HP and armor
    window._vehicleHP = window._vehicleMaxHP !== undefined ? window._vehicleMaxHP : 100;
    if (window._vehicleArmor !== undefined) {
      window._vehicleArmor = window._vehicleMaxArmor !== undefined ? window._vehicleMaxArmor : 100;
    }
    // Notify vehicle HUD if available
    if (window.VehicleHUD && typeof window.VehicleHUD.onRepair === 'function') {
      window.VehicleHUD.onRepair();
    }

    // Show banner
    _showBanner('🔧 VEHICLE REPAIRED', '#2244cc');

    // Sparks VFX
    _spawnSparks();
  }

  function _cancelRepair() {
    _isRepairing = false;
    _repairTimer = 0;
    _progressBarEl.style.display = 'none';
    var fill = document.getElementById('vr-progress-fill');
    if (fill) fill.style.width = '0%';
  }

  // ── Sparks VFX ────────────────────────────────────────────────

  function _spawnSparks() {
    if (!_scene) return;
    var vehiclePos = _getVehiclePos() || { x: 0, y: 1, z: 0 };
    var sparkGeo = new THREE.SphereGeometry(0.05, 4, 4);
    var sparkMat = new THREE.MeshBasicMaterial({ color: 0xFF8800 });

    for (var i = 0; i < 8; i++) {
      var mesh = new THREE.Mesh(sparkGeo, sparkMat);
      mesh.position.set(vehiclePos.x, vehiclePos.y + 1, vehiclePos.z);
      _scene.add(mesh);

      var angle = (i / 8) * Math.PI * 2;
      var speed = 3 + Math.random() * 3;
      var spark = {
        mesh: mesh,
        vx: Math.cos(angle) * speed,
        vy: 4 + Math.random() * 3,
        vz: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.4,
        age: 0,
        removed: false
      };
      _sparks.push(spark);
    }
  }

  function _updateSparks(dt) {
    for (var i = _sparks.length - 1; i >= 0; i--) {
      var s = _sparks[i];
      if (s.removed) {
        _sparks.splice(i, 1);
        continue;
      }
      s.age += dt;
      if (s.age >= s.life) {
        if (_scene) _scene.remove(s.mesh);
        if (s.mesh.geometry) s.mesh.geometry.dispose();
        if (s.mesh.material) s.mesh.material.dispose();
        s.removed = true;
        _sparks.splice(i, 1);
        continue;
      }
      s.vy -= 9.8 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      var alpha = 1 - s.age / s.life;
      s.mesh.material.opacity = alpha;
    }
  }

  // ── Sound ─────────────────────────────────────────────────────

  function _playHammer() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      // 180Hz pulse for metallic clank
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, _audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, _audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.2);
    } catch (e) {
      // AudioContext not available — silently skip
    }
  }

  // ── Banner display ────────────────────────────────────────────

  function _showBanner(msg, bgColor) {
    if (!_bannerEl) return;
    _bannerEl.textContent = msg;
    _bannerEl.style.background = bgColor || 'rgba(0,60,200,0.85)';
    _bannerEl.style.display = 'block';
    if (_bannerEl._hideTimer) clearTimeout(_bannerEl._hideTimer);
    _bannerEl._hideTimer = setTimeout(function () {
      if (_bannerEl) _bannerEl.style.display = 'none';
    }, 3000);
  }

  // ── Wave 3 auto-spawn ─────────────────────────────────────────

  function _checkWave3Spawn() {
    if (_spawnOnWave3Done) return;
    var wave = window._currentWave || (window.GameManager && window.GameManager.getCurrentWave ? window.GameManager.getCurrentWave() : 0);
    if (wave > 3) {
      _spawnOnWave3Done = true;
      // Spawn near player
      var pp = _getPlayerPos();
      var sx = pp ? pp.x + 3 : 3;
      var sy = pp ? pp.y : 0;
      var sz = pp ? pp.z + 3 : 3;
      spawnToolbox(sx, sy, sz);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────

  function _getPlayerPos() {
    if (window._playerPos) return window._playerPos;
    if (window.Player && window.Player.getPosition) return window.Player.getPosition();
    if (window._camera) return window._camera.position;
    if (window.camera) return window.camera.position;
    return null;
  }

  function _getVehiclePos() {
    if (window.Bradley && typeof window.Bradley.getPosition === 'function') {
      var bp = window.Bradley.getPosition();
      if (bp) return bp;
    }
    if (window.BTR80 && typeof window.BTR80.getPosition === 'function') {
      var bp2 = window.BTR80.getPosition();
      if (bp2) return bp2;
    }
    if (window.VehicleSystem && typeof window.VehicleSystem.getNearestVehiclePos === 'function') {
      var pp = _getPlayerPos();
      return pp ? window.VehicleSystem.getNearestVehiclePos(pp) : null;
    }
    return null;
  }

  function _dist3(a, b) {
    var dx = (a.x || 0) - (b.x || 0);
    var dy = (a.y || 0) - (b.y || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ── Reset ─────────────────────────────────────────────────────

  function reset() {
    // Remove all toolboxes from scene
    for (var i = 0; i < _toolboxes.length; i++) {
      _removeToolbox(_toolboxes[i]);
    }
    _toolboxes = [];
    _sparks = [];
    _repairTimer = 0;
    _isRepairing = false;
    _repairWarningShown = false;
    _repairComplete = false;
    _spawnOnWave3Done = false;
    window._toolboxCount = 0;

    if (_progressBarEl) _progressBarEl.style.display = 'none';
    if (_hudEl) _hudEl.style.display = 'none';
    if (_bannerEl) _bannerEl.style.display = 'none';
    if (_warningEl) _warningEl.style.display = 'none';

    var fill = document.getElementById('vr-progress-fill');
    if (fill) fill.style.width = '0%';
  }

  // ── Public API ────────────────────────────────────────────────

  return {
    init: init,
    update: update,
    spawnToolbox: spawnToolbox,
    reset: reset
  };

})();
