/* ═══════════════════════════════════════════════════════════════════════════
   mortar-strike-system.js — Player-controlled mortar strike system
   ─────────────────────────────────────────────────────────────────────────
   Ctrl+M   → deploy mortar at player feet (max 2)
   F        → enter targeting mode when within 3m of a deployed mortar
   Tab      → cycle shell type: HE → WP → ILLUM
   Up/Down  → adjust range  (15–60m)
   Left/Right → adjust bearing ±30°
   Click/F  → fire (in targeting mode)
   Alt      → fire for effect (4-round burst, ±1m spread, 4× ammo)

   Shell types:
     HE    — 120 dmg, 6m blast, brown smoke
     WP    — white phosphorus: 60 dmg/s × 5s in 3m radius, white smoke
     ILLUM — no damage; bright PointLight 50m for 20s

   Public API: window.MortarStrikeSystem = { init, update, deploy, fire, reset }
   ═══════════════════════════════════════════════════════════════════════════ */
window.MortarStrikeSystem = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var MAX_MORTARS         = 2;
  var DEPLOY_RANGE        = 3;      // metres — must be within this to use mortar
  var AMMO_PER_WAVE       = 12;
  var FLIGHT_TIME         = 2.5;    // seconds
  var FIRE_COOLDOWN       = 0.8;    // seconds between shots
  var RANGE_MIN           = 15;
  var RANGE_MAX           = 60;
  var RANGE_STEP          = 2;
  var BEARING_STEP        = 5;      // degrees per key press
  var BEARING_LIMIT       = 30;     // ±degrees from forward
  var ARC_DOT_COUNT       = 5;
  var COUNTER_BATTERY_CHANCE = 0.20;
  var COUNTER_BATTERY_DELAY  = 8;   // seconds
  var FFE_ROUNDS          = 4;      // fire-for-effect burst count
  var FFE_SPREAD          = 1.0;    // ±metres random per FFE shot
  var FFE_AMMO_COST       = 4;

  /* HE */
  var HE_DAMAGE           = 120;
  var HE_RADIUS           = 6;
  /* WP */
  var WP_DPS              = 60;
  var WP_DURATION         = 5;
  var WP_RADIUS           = 3;
  /* ILLUM */
  var ILLUM_LIGHT_RANGE   = 50;
  var ILLUM_DURATION      = 20;

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;

  var _mortars  = [];   // deployed mortar objects
  var _shells   = [];   // shells in flight
  var _vfx      = [];   // smoke / light VFX objects
  var _wpZones  = [];   // active WP burn zones

  var _targeting    = false;  // in targeting mode
  var _activeMortar = null;   // mortar being used
  var _range        = 30;     // metres
  var _bearing      = 0;      // degrees offset from camera forward
  var _shellType    = 'HE';   // 'HE' | 'WP' | 'ILLUM'
  var _fireCooldown = 0;
  var _recoilTimer  = 0;

  var _arcDots    = [];   // THREE.Mesh dots for targeting arc
  var _arcVisible = false;

  var _hudEl      = null;
  var _warnEl     = null;
  var _warnTimer  = 0;

  var _counterBatteryTimers = [];  // pending counter-battery strikes

  /* ── audio (inline Web Audio, no deps) ─────────────────────────────────── */
  function _audioCtx() {
    if (!window._mortarAudioCtx) {
      try {
        window._mortarAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    return window._mortarAudioCtx;
  }

  function _playThump() {
    var ctx = _audioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  function _playImpact() {
    var ctx = _audioCtx();
    if (!ctx) return;
    var bufSize = ctx.sampleRate * 0.5;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  /* ── THREE helpers ──────────────────────────────────────────────────────── */
  function _THREE() { return window.THREE; }

  function _makeMat(color, opacity) {
    var T = _THREE();
    if (!T) return null;
    var mat = new T.MeshLambertMaterial({ color: color });
    if (opacity !== undefined && opacity < 1) {
      mat.transparent = true;
      mat.opacity = opacity;
    }
    return mat;
  }

  /* ── build mortar mesh ──────────────────────────────────────────────────── */
  function _buildMortarMesh(pos) {
    var T = _THREE();
    if (!T) return null;

    var group = new T.Group();

    // base plate
    var baseGeo = new T.CylinderGeometry(1.0, 1.0, 0.1, 12);
    var baseMat = _makeMat(0x555555);
    var base = new T.Mesh(baseGeo, baseMat);
    base.receiveShadow = true;
    group.add(base);

    // barrel (angled 45°)
    var barrelGeo = new T.CylinderGeometry(0.15, 0.15, 1.2, 8);
    var barrelMat = _makeMat(0x333333);
    var barrel = new T.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0.7, -0.3);
    barrel.rotation.x = Math.PI / 4;   // 45 degrees
    barrel.castShadow = true;
    group.add(barrel);

    // bipod leg left
    var bipodGeo1 = new T.CylinderGeometry(0.04, 0.04, 0.9, 6);
    var bipodMat = _makeMat(0x444444);
    var legL = new T.Mesh(bipodGeo1, bipodMat);
    legL.position.set(-0.35, 0.35, 0.2);
    legL.rotation.z = Math.PI / 6;
    group.add(legL);

    // bipod leg right
    var bipodGeo2 = new T.CylinderGeometry(0.04, 0.04, 0.9, 6);
    var legR = new T.Mesh(bipodGeo2, bipodMat);
    legR.position.set(0.35, 0.35, 0.2);
    legR.rotation.z = -Math.PI / 6;
    group.add(legR);

    group.position.copy(pos);
    group.position.y = pos.y;

    _scene.add(group);
    return { group: group, barrel: barrel, basePos: pos.clone() };
  }

  /* ── arc dots ───────────────────────────────────────────────────────────── */
  function _buildArcDots() {
    var T = _THREE();
    if (!T) return;
    _clearArcDots();
    for (var i = 0; i < ARC_DOT_COUNT; i++) {
      var geo = new T.SphereGeometry(0.12, 6, 6);
      var mat = new T.MeshBasicMaterial({ color: 0xffff00 });
      var dot = new T.Mesh(geo, mat);
      dot.visible = false;
      _scene.add(dot);
      _arcDots.push(dot);
    }
  }

  function _clearArcDots() {
    for (var i = 0; i < _arcDots.length; i++) {
      _scene.remove(_arcDots[i]);
    }
    _arcDots = [];
  }

  function _updateArcDots() {
    if (!_activeMortar || _arcDots.length === 0) return;
    var T = _THREE();
    if (!T) return;

    var origin = _activeMortar.basePos.clone();
    origin.y += 0.5;
    var target = _calcTargetPos(_activeMortar, _range, _bearing);

    for (var i = 0; i < _arcDots.length; i++) {
      var t = (i + 1) / (ARC_DOT_COUNT + 1);
      // parabolic: height peaks at midpoint
      var px = origin.x + (target.x - origin.x) * t;
      var pz = origin.z + (target.z - origin.z) * t;
      var py = origin.y + (target.y - origin.y) * t + Math.sin(t * Math.PI) * (_range * 0.5);
      _arcDots[i].position.set(px, py, pz);
      _arcDots[i].visible = true;
    }
  }

  function _hideArcDots() {
    for (var i = 0; i < _arcDots.length; i++) {
      _arcDots[i].visible = false;
    }
  }

  /* ── targeting math ─────────────────────────────────────────────────────── */
  function _calcTargetPos(mortar, range, bearing) {
    var T = _THREE();
    if (!T) return mortar.basePos.clone();

    // camera forward direction (flattened to XZ)
    var fwd = new T.Vector3();
    _camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();

    // rotate by bearing
    var rad = (bearing * Math.PI) / 180;
    var cos = Math.cos(rad);
    var sin = Math.sin(rad);
    var dx = fwd.x * cos - fwd.z * sin;
    var dz = fwd.x * sin + fwd.z * cos;

    var target = mortar.basePos.clone();
    target.x += dx * range;
    target.z += dz * range;
    target.y = mortar.basePos.y;
    return target;
  }

  /* ── shell launch ───────────────────────────────────────────────────────── */
  function _launchShell(mortar, targetPos, type, spreadX, spreadZ) {
    var T = _THREE();
    if (!T) return;

    var sx = spreadX || 0;
    var sz = spreadZ || 0;

    var origin = mortar.basePos.clone();
    origin.y += 0.7;

    var dest = targetPos.clone();
    dest.x += sx;
    dest.z += sz;

    var geo = new T.SphereGeometry(0.18, 6, 6);
    var color = (type === 'WP') ? 0xffffff : (type === 'ILLUM') ? 0xffffaa : 0x444400;
    var mat = new T.MeshBasicMaterial({ color: color });
    var mesh = new T.Mesh(geo, mat);
    mesh.position.copy(origin);
    _scene.add(mesh);

    _shells.push({
      mesh:       mesh,
      origin:     origin.clone(),
      dest:       dest.clone(),
      type:       type,
      elapsed:    0,
      flightTime: FLIGHT_TIME
    });

    // recoil animation
    _recoilTimer = 0.2;
    _triggerRecoil(mortar);

    // audio
    _playThump();
    if (window.AudioSystem && window.AudioSystem.playMortarFire) {
      window.AudioSystem.playMortarFire();
    }

    // counter-battery check
    if (Math.random() < COUNTER_BATTERY_CHANCE) {
      _scheduleCounterBattery(mortar.basePos.clone());
    }
  }

  function _triggerRecoil(mortar) {
    if (!mortar || !mortar.barrel) return;
    // kick barrel back slightly
    mortar.barrel.position.z += 0.15;
    mortar._recoilReturn = true;
  }

  /* ── impact / detonation ────────────────────────────────────────────────── */
  function _detonate(shell) {
    var T = _THREE();
    if (!T) return;

    var pos = shell.dest.clone();
    _playImpact();

    if (shell.type === 'HE') {
      _spawnSmoke(pos, 0x6B4226, 8);   // brown smoke
      _applyBlastDamage(pos, HE_RADIUS, HE_DAMAGE, 'HE');
      _spawnCrater(pos);
    } else if (shell.type === 'WP') {
      _spawnSmoke(pos, 0xeeeeee, 12);  // white smoke
      _spawnWpZone(pos);
    } else if (shell.type === 'ILLUM') {
      _spawnIllum(pos);
    }

    // screen shake
    if (window.GameManager && window.GameManager.screenShake) {
      window.GameManager.screenShake(0.3, 0.5);
    }
  }

  function _applyBlastDamage(pos, radius, baseDamage, type) {
    // damage player if close
    if (_camera) {
      var T = _THREE();
      var camPos = _camera.position;
      var dist = camPos.distanceTo(pos);
      if (dist < radius) {
        var dmg = baseDamage * (1 - dist / radius);
        if (window.GameManager && window.GameManager.damagePlayer) {
          window.GameManager.damagePlayer(dmg, 'mortar_' + type);
        }
      }
    }
    // damage enemies
    if (window.GameManager && window.GameManager.damageEnemiesInRadius) {
      window.GameManager.damageEnemiesInRadius(pos, radius, baseDamage);
    } else if (window.Enemies && window.Enemies.damageInRadius) {
      window.Enemies.damageInRadius(pos, radius, baseDamage);
    }
    // score
    if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(50, 'mortar_strike');
    }
  }

  function _spawnSmoke(pos, color, count) {
    var T = _THREE();
    if (!T) return;
    for (var i = 0; i < count; i++) {
      var geo = new T.SphereGeometry(0.5 + Math.random() * 0.5, 6, 6);
      var mat = new T.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7
      });
      var mesh = new T.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 3,
        pos.y + Math.random() * 2,
        pos.z + (Math.random() - 0.5) * 3
      );
      _scene.add(mesh);
      _vfx.push({
        mesh:    mesh,
        mat:     mat,
        vy:      0.5 + Math.random() * 0.5,
        life:    0,
        maxLife: 6 + Math.random() * 4,
        type:    'smoke'
      });
    }
  }

  function _spawnCrater(pos) {
    var T = _THREE();
    if (!T) return;
    var geo = new T.CircleGeometry(1.5, 12);
    var mat = new T.MeshLambertMaterial({ color: 0x222222 });
    var mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.02, pos.z);
    _scene.add(mesh);
    // leave crater in scene permanently for this wave
    _vfx.push({ mesh: mesh, mat: mat, type: 'crater', life: 0, maxLife: 9999 });
  }

  function _spawnWpZone(pos) {
    var T = _THREE();
    if (!T) return;
    // visual zone indicator
    var geo = new T.CircleGeometry(WP_RADIUS, 16);
    var mat = new T.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: T.DoubleSide
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.05, pos.z);
    _scene.add(mesh);

    _wpZones.push({
      pos:      pos.clone(),
      mesh:     mesh,
      mat:      mat,
      elapsed:  0,
      duration: WP_DURATION
    });
  }

  function _spawnIllum(pos) {
    var T = _THREE();
    if (!T) return;
    var light = new T.PointLight(0xffffcc, 2.5, ILLUM_LIGHT_RANGE);
    light.position.set(pos.x, pos.y + 15, pos.z);
    _scene.add(light);
    _vfx.push({
      mesh:    null,
      light:   light,
      type:    'illum',
      life:    0,
      maxLife: ILLUM_DURATION
    });
    // show HUD message
    _showWarning('ILLUMINATION ROUND ACTIVE — ' + ILLUM_DURATION + 's', 0xffffaa, 3);
  }

  /* ── counter-battery ────────────────────────────────────────────────────── */
  function _scheduleCounterBattery(mortarPos) {
    _counterBatteryTimers.push({
      pos:     mortarPos,
      elapsed: 0,
      delay:   COUNTER_BATTERY_DELAY
    });
    _showWarning('COUNTER-BATTERY FIRE DETECTED', 0xff4444, 5);
  }

  function _triggerCounterBattery(pos) {
    // enemy shells land near the mortar position
    var T = _THREE();
    if (!T) return;
    var spread = 4;
    var shellCount = 2 + Math.floor(Math.random() * 3);
    for (var i = 0; i < shellCount; i++) {
      var dest = pos.clone();
      dest.x += (Math.random() - 0.5) * spread;
      dest.z += (Math.random() - 0.5) * spread;
      _spawnCounterShell(dest, i * 0.4);
    }
  }

  function _spawnCounterShell(dest, delay) {
    // deferred via a pending entry
    _vfx.push({
      type:    'counter_pending',
      dest:    dest,
      delay:   delay,
      elapsed: 0
    });
  }

  function _detonateCounterBattery(dest) {
    var T = _THREE();
    if (!T) return;
    _spawnSmoke(dest, 0x888888, 5);
    _applyBlastDamage(dest, 5, 80, 'counter');
    _playImpact();
    if (window.GameManager && window.GameManager.screenShake) {
      window.GameManager.screenShake(0.25, 0.4);
    }
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _buildHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'mortar-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:20px',
      'background:rgba(0,0,0,0.7)',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 12px',
      'border:1px solid #444',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:800'
    ].join(';');
    document.body.appendChild(_hudEl);

    _warnEl = document.createElement('div');
    _warnEl.id = 'mortar-warn';
    _warnEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(180,0,0,0.85)',
      'color:#fff',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'padding:10px 20px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'letter-spacing:2px',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_warnEl);
  }

  function _updateHud() {
    if (!_hudEl) return;
    if (_mortars.length === 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var nearMortar = _getNearestMortar();
    var ammo = nearMortar ? nearMortar.ammo : '—';
    var mode = _targeting ? ' [TARGETING]' : '';
    var rangeStr = _targeting ? '  RNG:' + _range + 'm  BRG:' + (_bearing > 0 ? '+' : '') + _bearing + '°' : '';
    _hudEl.innerHTML =
      'MORTAR [' + ammo + '] ' + _shellType + mode + rangeStr;
  }

  function _showWarning(msg, color, duration) {
    if (!_warnEl) return;
    _warnEl.textContent = msg;
    _warnEl.style.background = 'rgba(' +
      ((color >> 16) & 0xff) + ',' +
      ((color >> 8) & 0xff) + ',' +
      (color & 0xff) + ',0.85)';
    _warnEl.style.display = 'block';
    _warnTimer = duration || 3;
  }

  /* ── nearest mortar lookup ──────────────────────────────────────────────── */
  function _getNearestMortar() {
    if (_mortars.length === 0) return null;
    var T = _THREE();
    if (!T || !_camera) return _mortars[0];
    var best = null;
    var bestDist = Infinity;
    var camPos = _camera.position;
    for (var i = 0; i < _mortars.length; i++) {
      var d = camPos.distanceTo(_mortars[i].basePos);
      if (d < bestDist) {
        bestDist = d;
        best = _mortars[i];
      }
    }
    return best;
  }

  function _playerNearMortar() {
    var m = _getNearestMortar();
    if (!m) return null;
    var T = _THREE();
    if (!T || !_camera) return null;
    var d = _camera.position.distanceTo(m.basePos);
    return d <= DEPLOY_RANGE ? m : null;
  }

  /* ── keyboard / input ───────────────────────────────────────────────────── */
  var _keys = {};

  function _onKeyDown(e) {
    _keys[e.code] = true;

    // Ctrl+M — deploy mortar
    if (e.code === 'KeyM' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      deploy();
      return;
    }

    // F — enter/exit targeting mode or fire
    if (e.code === 'KeyF') {
      if (_targeting) {
        _doFire(false);
      } else {
        _enterTargeting();
      }
      return;
    }

    // Tab — cycle shell type
    if (e.code === 'Tab' && _targeting) {
      e.preventDefault();
      _cycleShellType();
      return;
    }

    if (_targeting) {
      // range adjustment
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        _range = Math.min(RANGE_MAX, _range + RANGE_STEP);
        _updateArcDots();
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        _range = Math.max(RANGE_MIN, _range - RANGE_STEP);
        _updateArcDots();
      }
      // bearing adjustment
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        _bearing = Math.max(-BEARING_LIMIT, _bearing - BEARING_STEP);
        _updateArcDots();
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        _bearing = Math.min(BEARING_LIMIT, _bearing + BEARING_STEP);
        _updateArcDots();
      }

      // Alt — fire for effect
      if (e.code === 'AltLeft' || e.code === 'AltRight') {
        e.preventDefault();
        _doFire(true);
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseDown(e) {
    if (_targeting && e.button === 0) {
      _doFire(false);
    }
  }

  /* ── mouse move: update arc with mouse direction ────────────────────────── */
  function _onMouseMove(e) {
    if (!_targeting) return;
    // subtle bearing nudge based on horizontal mouse movement
    // (normalized from -0.5 to 0.5 across screen width)
    var nx = (e.clientX / window.innerWidth - 0.5);
    _bearing = Math.max(-BEARING_LIMIT, Math.min(BEARING_LIMIT, nx * BEARING_LIMIT * 2));
    _updateArcDots();
  }

  /* ── shell type cycling ─────────────────────────────────────────────────── */
  function _cycleShellType() {
    if (_shellType === 'HE')   { _shellType = 'WP'; }
    else if (_shellType === 'WP')   { _shellType = 'ILLUM'; }
    else                            { _shellType = 'HE'; }
    _showWarning('SHELL TYPE: ' + _shellType, 0x0066cc, 1.5);
    _updateHud();
  }

  /* ── enter/exit targeting ───────────────────────────────────────────────── */
  function _enterTargeting() {
    var mortar = _playerNearMortar();
    if (!mortar) {
      _showWarning('TOO FAR FROM MORTAR', 0xff6600, 2);
      return;
    }
    if (mortar.ammo <= 0) {
      _showWarning('MORTAR AMMO DEPLETED', 0xff0000, 2);
      return;
    }
    _targeting = true;
    _activeMortar = mortar;
    _buildArcDots();
    _updateArcDots();
    _updateHud();
  }

  function _exitTargeting() {
    _targeting = false;
    _activeMortar = null;
    _hideArcDots();
    _clearArcDots();
    _updateHud();
  }

  /* ── fire ───────────────────────────────────────────────────────────────── */
  function _doFire(ffeMode) {
    if (!_targeting || !_activeMortar) return;
    if (_fireCooldown > 0) return;

    var mortar = _activeMortar;

    if (ffeMode) {
      // fire for effect — 4 rounds, 4× ammo
      if (mortar.ammo < FFE_AMMO_COST) {
        _showWarning('NOT ENOUGH AMMO FOR FIRE FOR EFFECT', 0xff6600, 2);
        return;
      }
      mortar.ammo -= FFE_AMMO_COST;
      var targetPos = _calcTargetPos(mortar, _range, _bearing);
      for (var i = 0; i < FFE_ROUNDS; i++) {
        (function (idx) {
          var spread = FFE_SPREAD;
          var sx = (Math.random() - 0.5) * spread * 2;
          var sz = (Math.random() - 0.5) * spread * 2;
          _vfx.push({
            type:    'ffe_pending',
            mortar:  mortar,
            target:  targetPos.clone(),
            sx:      sx,
            sz:      sz,
            delay:   idx * FIRE_COOLDOWN,
            elapsed: 0,
            shellType: _shellType
          });
        })(i);
      }
      _fireCooldown = FIRE_COOLDOWN * FFE_ROUNDS;
      _showWarning('FIRE FOR EFFECT — ' + FFE_ROUNDS + ' ROUNDS', 0xff8800, 2);
    } else {
      if (mortar.ammo <= 0) {
        _showWarning('MORTAR AMMO DEPLETED', 0xff0000, 2);
        _exitTargeting();
        return;
      }
      mortar.ammo -= 1;
      var targetPos = _calcTargetPos(mortar, _range, _bearing);
      _launchShell(mortar, targetPos, _shellType, 0, 0);
      _fireCooldown = FIRE_COOLDOWN;
    }

    _updateHud();

    if (mortar.ammo <= 0) {
      _showWarning('MORTAR AMMO DEPLETED', 0xff0000, 3);
      _exitTargeting();
    }
  }

  /* ── public: deploy ─────────────────────────────────────────────────────── */
  function deploy() {
    if (!_scene || !_camera) return false;
    if (_mortars.length >= MAX_MORTARS) {
      _showWarning('MAX MORTARS DEPLOYED (' + MAX_MORTARS + ')', 0xff6600, 2);
      return false;
    }
    var T = _THREE();
    if (!T) return false;

    var pos = _camera.position.clone();
    pos.y -= 1.6;   // player feet

    var meshData = _buildMortarMesh(pos);
    if (!meshData) return false;

    var mortarObj = {
      group:   meshData.group,
      barrel:  meshData.barrel,
      basePos: meshData.basePos,
      ammo:    AMMO_PER_WAVE,
      _recoilReturn: false
    };

    _mortars.push(mortarObj);
    _showWarning('MORTAR DEPLOYED — [F] TO USE', 0x00cc44, 2);
    _updateHud();
    return true;
  }

  /* ── public: fire ───────────────────────────────────────────────────────── */
  function fire(ffeMode) {
    if (!_targeting) {
      _enterTargeting();
    } else {
      _doFire(ffeMode || false);
    }
  }

  /* ── public: reset ──────────────────────────────────────────────────────── */
  function reset() {
    // remove shells
    for (var i = 0; i < _shells.length; i++) {
      if (_shells[i].mesh) _scene.remove(_shells[i].mesh);
    }
    _shells = [];

    // remove VFX
    for (var i = 0; i < _vfx.length; i++) {
      if (_vfx[i].mesh) _scene.remove(_vfx[i].mesh);
      if (_vfx[i].light) _scene.remove(_vfx[i].light);
    }
    _vfx = [];

    // remove WP zones
    for (var i = 0; i < _wpZones.length; i++) {
      if (_wpZones[i].mesh) _scene.remove(_wpZones[i].mesh);
    }
    _wpZones = [];

    // remove mortars
    for (var i = 0; i < _mortars.length; i++) {
      if (_mortars[i].group) _scene.remove(_mortars[i].group);
    }
    _mortars = [];

    _clearArcDots();
    _targeting = false;
    _activeMortar = null;
    _fireCooldown = 0;
    _recoilTimer = 0;
    _counterBatteryTimers = [];
    _warnTimer = 0;
    if (_warnEl) _warnEl.style.display = 'none';
    if (_hudEl) _hudEl.style.display = 'none';
    _updateHud();
  }

  /* ── public: init ───────────────────────────────────────────────────────── */
  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || null;

    _buildHud();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mousemove', _onMouseMove);
  }

  /* ── public: update (called each frame with delta in seconds) ───────────── */
  function update(delta) {
    if (!_scene) return;

    var T = _THREE();
    if (!T) return;

    // cooldown
    if (_fireCooldown > 0) _fireCooldown -= delta;
    if (_fireCooldown < 0) _fireCooldown = 0;

    // warning timer
    if (_warnTimer > 0) {
      _warnTimer -= delta;
      if (_warnTimer <= 0) {
        if (_warnEl) _warnEl.style.display = 'none';
      }
    }

    // counter-battery timers
    for (var i = _counterBatteryTimers.length - 1; i >= 0; i--) {
      var cb = _counterBatteryTimers[i];
      cb.elapsed += delta;
      if (cb.elapsed >= cb.delay) {
        _triggerCounterBattery(cb.pos);
        _counterBatteryTimers.splice(i, 1);
      }
    }

    // update shells in flight
    for (var i = _shells.length - 1; i >= 0; i--) {
      var s = _shells[i];
      s.elapsed += delta;
      var t = Math.min(s.elapsed / s.flightTime, 1);
      // parabolic arc
      var px = s.origin.x + (s.dest.x - s.origin.x) * t;
      var pz = s.origin.z + (s.dest.z - s.origin.z) * t;
      var baseY = s.origin.y + (s.dest.y - s.origin.y) * t;
      var arcH = Math.sin(t * Math.PI) * (10 + (s.dest.distanceTo(s.origin) * 0.3));
      var py = baseY + arcH;
      s.mesh.position.set(px, py, pz);

      if (t >= 1) {
        _detonate(s);
        _scene.remove(s.mesh);
        _shells.splice(i, 1);
      }
    }

    // update VFX
    for (var i = _vfx.length - 1; i >= 0; i--) {
      var v = _vfx[i];

      if (v.type === 'smoke') {
        v.life += delta;
        v.mesh.position.y += v.vy * delta;
        var fade = 1 - v.life / v.maxLife;
        v.mat.opacity = 0.7 * Math.max(0, fade);
        if (v.life >= v.maxLife) {
          _scene.remove(v.mesh);
          _vfx.splice(i, 1);
        }

      } else if (v.type === 'illum') {
        v.life += delta;
        if (v.life >= v.maxLife) {
          _scene.remove(v.light);
          _vfx.splice(i, 1);
        }

      } else if (v.type === 'crater') {
        // craters stay permanently (handled by reset)
        v.life += delta;

      } else if (v.type === 'counter_pending') {
        v.elapsed += delta;
        if (v.elapsed >= v.delay) {
          _detonateCounterBattery(v.dest);
          _vfx.splice(i, 1);
        }

      } else if (v.type === 'ffe_pending') {
        v.elapsed += delta;
        if (v.elapsed >= v.delay) {
          _launchShell(v.mortar, v.target, v.shellType, v.sx, v.sz);
          _vfx.splice(i, 1);
        }
      }
    }

    // update WP zones — deal damage over time
    for (var i = _wpZones.length - 1; i >= 0; i--) {
      var z = _wpZones[i];
      z.elapsed += delta;
      // damage nearby entities each second (approximated by delta accumulation)
      if (_camera) {
        var d = _camera.position.distanceTo(z.pos);
        if (d < WP_RADIUS) {
          var dmg = WP_DPS * delta;
          if (window.GameManager && window.GameManager.damagePlayer) {
            window.GameManager.damagePlayer(dmg, 'WP');
          }
        }
      }
      if (window.GameManager && window.GameManager.damageEnemiesInRadius) {
        window.GameManager.damageEnemiesInRadius(z.pos, WP_RADIUS, WP_DPS * delta);
      }
      // fade zone marker
      var fade = 1 - z.elapsed / z.duration;
      z.mat.opacity = 0.35 * Math.max(0, fade);

      if (z.elapsed >= z.duration) {
        _scene.remove(z.mesh);
        _wpZones.splice(i, 1);
      }
    }

    // recoil return animation for mortar barrels
    for (var i = 0; i < _mortars.length; i++) {
      var m = _mortars[i];
      if (m._recoilReturn && m.barrel) {
        m.barrel.position.z -= delta * 0.6;
        if (m.barrel.position.z <= -0.3) {
          m.barrel.position.z = -0.3;
          m._recoilReturn = false;
        }
      }
    }

    // arc dots — keep updated while targeting and camera moves
    if (_targeting && _activeMortar) {
      _updateArcDots();
    }
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    deploy: deploy,
    fire:   fire,
    reset:  reset
  };

})();
