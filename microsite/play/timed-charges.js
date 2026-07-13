// timed-charges.js — C4 Explosive with Remote Detonator System
// Ctrl+4 to place, X to use detonator, hold Ctrl+4 for 1.5s for timer mode
// Alt+Ctrl+4 for directional shape charge
// No let/const — only var throughout, IIFE pattern
window.TimedCharges = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var MAX_CHARGES       = 5;
  var TIMER_MODE_HOLD   = 1.5;    // seconds to hold Ctrl+4 for timer mode
  var TIMER_COUNTDOWN   = 10;     // seconds countdown for timed charge
  var DAMAGE_INNER      = 150;    // damage within 4m
  var DAMAGE_OUTER      = 60;     // damage within 8m
  var RADIUS_INNER      = 4;
  var RADIUS_OUTER      = 8;
  var VOXEL_RADIUS      = 2;      // units radius to remove voxels
  var SHAKE_DURATION    = 0.3;    // seconds camera shake
  var SHAKE_MAX_DIST    = 20;     // distance at which shake is zero
  var LIGHT_RANGE       = 15;
  var LIGHT_INTENSITY   = 3;
  var DEBRIS_COUNT      = 8;
  var DEBRIS_LIFETIME   = 1.5;
  var SHAPE_CONE_RANGE  = 5;      // cone depth in facing direction
  var SHAPE_CONE_ANGLE  = 0.45;   // ~25 degrees half-angle
  var SHAPE_CONE_DMG    = 300;
  var CLUSTER_RADIUS    = 4;      // radius to detect clustering
  var CLUSTER_THRESHOLD = 3;      // charges needed for structural collapse
  var DEFUSE_TIME       = 3.0;    // seconds for enemy defuse attempt
  var DEFUSE_DIST       = 1.5;    // metres enemy must be within to defuse
  var STARTING_AMMO     = 5;

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene   = null;
  var _camera  = null;
  var _inited  = false;

  var _charges         = [];      // active placed charges
  var _ammo            = STARTING_AMMO;   // C4 units player can still place
  var _time            = 0;

  // Input tracking
  var _ctrlHeld        = false;
  var _altHeld         = false;
  var _ctrl4HoldTimer  = 0;       // how long Ctrl+4 has been held
  var _ctrl4Down       = false;
  var _timerModeArmed  = false;   // did we arm a timer this hold
  var _xKeyDown        = false;
  var _detonatorActive = false;   // is detonator UI visible
  var _safetyFlipped   = false;   // F key flips safety on detonator
  var _fKeyDown        = false;
  var _clickListener   = null;

  // Camera shake state
  var _shakeTimer      = 0;
  var _shakeIntensity  = 0;
  var _origCamPos      = null;

  // Detonator mesh group (hand view)
  var _detonatorGroup  = null;
  var _detonatorHUD    = null;

  // Beep audio context
  var _audioCtx        = null;

  // ── Audio helpers ──────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        _audioCtx = null;
      }
    }
    return _audioCtx;
  }

  function _playBeep(freq, duration, volume) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.05));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (duration || 0.05));
    } catch (e) {}
  }

  function _playExplosionAudio(distFromPlayer) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var vol = Math.max(0.05, 1.0 - distFromPlayer / SHAKE_MAX_DIST);
    // Deep boom — oscillator ramp down from 40Hz
    try {
      var boomOsc = ctx.createOscillator();
      var boomGain = ctx.createGain();
      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomOsc.frequency.setValueAtTime(40, ctx.currentTime);
      boomOsc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.8);
      boomGain.gain.setValueAtTime(vol * 0.8, ctx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      boomOsc.start(ctx.currentTime);
      boomOsc.stop(ctx.currentTime + 0.8);
    } catch (e) {}
    // High crack — noise burst via white noise buffer
    try {
      var bufLen = Math.floor(ctx.sampleRate * 0.15);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var crackGain = ctx.createGain();
      src.connect(crackGain);
      crackGain.connect(ctx.destination);
      crackGain.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
      crackGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  // ── Three.js helpers ───────────────────────────────────────────────────────
  function _THREE() {
    return window.THREE || null;
  }

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  function _getCamera() {
    return _camera || window._gameCamera || null;
  }

  function _getPlayerPos() {
    var cam = _getCamera();
    if (cam) return cam.position.clone();
    var T = _THREE();
    if (!T) return null;
    return new T.Vector3(0, 0, 0);
  }

  function _getPlayerDirection() {
    var cam = _getCamera();
    var T = _THREE();
    if (!cam || !T) return new T.Vector3(0, 0, -1);
    var dir = new T.Vector3();
    cam.getWorldDirection(dir);
    return dir;
  }

  // ── C4 Mesh builder ────────────────────────────────────────────────────────
  function _buildC4Mesh() {
    var T = _THREE();
    if (!T) return null;
    var group = new T.Group();

    // Body: flat box, olive green
    var bodyGeo = new T.BoxGeometry(0.3, 0.06, 0.2);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x4a5c1e });
    var body = new T.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Red LED (small sphere, emissive red)
    var ledGeo = new T.SphereGeometry(0.018, 6, 6);
    var ledMat = new T.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
    var led = new T.Mesh(ledGeo, ledMat);
    led.position.set(0.1, 0.04, 0.0);
    group.add(led);

    // Wiring detail strip
    var wireGeo = new T.BoxGeometry(0.22, 0.008, 0.012);
    var wireMat = new T.MeshLambertMaterial({ color: 0x888800 });
    var wire = new T.Mesh(wireGeo, wireMat);
    wire.position.set(0, 0.035, 0.06);
    group.add(wire);

    group.userData.ledMat = ledMat;
    group.userData.ledMesh = led;
    return group;
  }

  // ── Detonator mesh (hand-view) ─────────────────────────────────────────────
  function _buildDetonatorMesh() {
    var T = _THREE();
    if (!T) return null;
    var group = new T.Group();

    // Body box
    var bodyGeo = new T.BoxGeometry(0.12, 0.22, 0.07);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x2a2a2a });
    var body = new T.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Red safety flip cover
    var safetyGeo = new T.BoxGeometry(0.06, 0.04, 0.075);
    var safetyMat = new T.MeshLambertMaterial({ color: 0xcc2200 });
    var safety = new T.Mesh(safetyGeo, safetyMat);
    safety.position.set(0, 0.07, 0.0);
    group.add(safety);
    group.userData.safetyMesh = safety;
    group.userData.safetyMat = safetyMat;

    // Trigger button
    var btnGeo = new T.SphereGeometry(0.025, 8, 8);
    var btnMat = new T.MeshLambertMaterial({ color: 0x440000 });
    var btn = new T.Mesh(btnGeo, btnMat);
    btn.position.set(0, 0.07, 0.04);
    btn.visible = false;   // hidden while safety is on
    group.add(btn);
    group.userData.btnMesh = btn;
    group.userData.btnMat = btnMat;

    // Antenna stub
    var antGeo = new T.BoxGeometry(0.008, 0.09, 0.008);
    var antMat = new T.MeshLambertMaterial({ color: 0x555555 });
    var ant = new T.Mesh(antGeo, antMat);
    ant.position.set(0.04, 0.155, 0);
    group.add(ant);

    return group;
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('tc-hud')) return;
    var el = document.createElement('div');
    el.id = 'tc-hud';
    el.style.cssText = [
      'position:fixed',
      'bottom:90px',
      'right:14px',
      'font-family:monospace',
      'font-size:12px',
      'color:#88cc44',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 10px',
      'border-radius:4px',
      'z-index:1003',
      'pointer-events:none',
      'user-select:none',
      'border:1px solid rgba(80,120,30,0.5)',
    ].join(';');
    document.body.appendChild(el);
    _updateHUD();
  }

  function _updateHUD() {
    var el = document.getElementById('tc-hud');
    if (!el) return;
    if (_ammo <= 0 && _charges.length === 0) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    var armedCount = _charges.length;
    var anyArmed = armedCount > 0;
    var blink = anyArmed && (Math.floor(_time * 2) % 2 === 0);
    var color = blink ? '#ff4444' : '#88cc44';
    el.style.color = color;
    var text = 'C4 [' + _ammo + ']';
    if (armedCount > 0) {
      text += ' <span style="color:#ff6633">PLACED(' + armedCount + ')</span>';
    }
    el.innerHTML = text;
  }

  // ── Detonator HUD overlay ──────────────────────────────────────────────────
  function _showDetonatorHUD(show) {
    if (!_detonatorHUD) {
      _detonatorHUD = document.createElement('div');
      _detonatorHUD.id = 'tc-detonator-hud';
      _detonatorHUD.style.cssText = [
        'position:fixed',
        'bottom:40px',
        'left:50%',
        'transform:translateX(-50%)',
        'font-family:monospace',
        'font-size:13px',
        'color:#ffcc00',
        'background:rgba(0,0,0,0.7)',
        'padding:8px 18px',
        'border-radius:6px',
        'z-index:1100',
        'pointer-events:none',
        'user-select:none',
        'border:1px solid rgba(200,150,0,0.6)',
        'text-align:center',
      ].join(';');
      document.body.appendChild(_detonatorHUD);
    }
    if (show) {
      _detonatorHUD.style.display = 'block';
      _detonatorHUD.innerHTML = _safetyFlipped
        ? '<span style="color:#ff4444">DETONATOR ARMED — CLICK TO BLOW</span>'
        : 'DETONATOR: Press <b>F</b> to flip safety, then <b>CLICK</b> to detonate';
    } else {
      _detonatorHUD.style.display = 'none';
    }
  }

  // ── Charge placement ───────────────────────────────────────────────────────
  function placeCharge(isShape, isTimed) {
    var T = _THREE();
    var sc = _getScene();
    var pos = _getPlayerPos();
    if (!T || !sc || !pos) return;
    if (_charges.length >= MAX_CHARGES) {
      _toast('Max C4 charges placed (' + MAX_CHARGES + ')');
      return;
    }
    if (_ammo <= 0) {
      _toast('No C4 ammo!');
      return;
    }

    var mesh = _buildC4Mesh();
    if (!mesh) return;

    // Place slightly in front of / below player
    var dir = _getPlayerDirection();
    var placePos = pos.clone();
    placePos.x += dir.x * 0.5;
    placePos.z += dir.z * 0.5;
    placePos.y -= 0.8;  // at feet level

    mesh.position.copy(placePos);
    sc.add(mesh);

    var charge = {
      mesh: mesh,
      pos: placePos.clone(),
      isTimed: isTimed || false,
      isShape: isShape || false,
      timer: isTimed ? TIMER_COUNTDOWN : -1,
      defusing: false,
      defuseTimer: 0,
      defused: false,
      ledBlinkTimer: 0,
      id: _time + Math.random()
    };

    _charges.push(charge);
    _ammo--;
    _updateHUD();

    if (isTimed) {
      _toast('TIMED C4 set! Auto-detonates in ' + TIMER_COUNTDOWN + 's');
    } else if (isShape) {
      _toast('SHAPE CHARGE placed — directional blast!');
    } else {
      _toast('C4 placed. Press X to arm detonator.');
    }
  }

  // ── Detonation ─────────────────────────────────────────────────────────────
  function detonate() {
    if (_charges.length === 0) {
      _toast('No C4 charges placed!');
      return;
    }
    var toDetonate = _charges.slice();
    _charges = [];
    for (var i = 0; i < toDetonate.length; i++) {
      if (!toDetonate[i].defused) {
        _explodeCharge(toDetonate[i]);
      }
    }
    _updateHUD();
  }

  function _explodeCharge(charge) {
    var T = _THREE();
    var sc = _getScene();
    if (!T || !sc) return;

    // Remove C4 mesh from scene
    if (charge.mesh) {
      sc.remove(charge.mesh);
      charge.mesh = null;
    }

    var pos = charge.pos.clone();

    // Flash light
    var light = new T.PointLight(0xff6600, LIGHT_INTENSITY, LIGHT_RANGE);
    light.position.copy(pos);
    sc.add(light);

    // Debris particles
    var debrisMat = new T.MeshLambertMaterial({ color: 0x888844 });
    var debrisMeshes = [];
    for (var d = 0; d < DEBRIS_COUNT; d++) {
      var dGeo = new T.BoxGeometry(
        0.06 + Math.random() * 0.1,
        0.06 + Math.random() * 0.1,
        0.06 + Math.random() * 0.1
      );
      var dm = new T.Mesh(dGeo, debrisMat);
      dm.position.copy(pos);
      sc.add(dm);
      debrisMeshes.push({
        mesh: dm,
        vel: new T.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 2,
          (Math.random() - 0.5) * 8
        ),
        life: DEBRIS_LIFETIME
      });
    }

    // Register debris for cleanup via update
    _activeDebris.push.apply(_activeDebris, debrisMeshes);
    _activeLights.push({ light: light, timer: 0.4 });

    // Play explosion audio
    var playerPos = _getPlayerPos();
    var dist = playerPos ? pos.distanceTo(playerPos) : 0;
    _playExplosionAudio(dist);

    // Camera shake (scales with distance)
    if (dist < SHAKE_MAX_DIST) {
      var shakeFactor = 1.0 - (dist / SHAKE_MAX_DIST);
      _triggerShake(SHAKE_DURATION, shakeFactor * 0.4);
    }

    // Shape charge: cone blast only in facing direction
    if (charge.isShape) {
      _doConeBlast(pos);
    } else {
      _doRadiusBlast(pos);
    }

    // Remove voxels in radius
    _removeVoxelsNear(pos, VOXEL_RADIUS);

    // Check clustering for structural collapse
    _checkStructuralCollapse(pos);

    // Try AudioSystem fallback
    if (window.AudioSystem && typeof window.AudioSystem.playExplosion === 'function') {
      window.AudioSystem.playExplosion();
    }
  }

  // ── Debris / light tracking lists ─────────────────────────────────────────
  var _activeDebris = [];
  var _activeLights = [];

  // ── Blast damage ───────────────────────────────────────────────────────────
  function _doRadiusBlast(pos) {
    _damageEnemiesInRadius(pos, RADIUS_INNER, DAMAGE_INNER);
    _damageEnemiesInRadius(pos, RADIUS_OUTER, DAMAGE_OUTER);
    _damagePlayerIfClose(pos);
  }

  function _doConeBlast(pos) {
    var dir = _getPlayerDirection();
    // Damage enemies inside cone
    _damageEnemiesInCone(pos, dir, SHAPE_CONE_RANGE, SHAPE_CONE_ANGLE, SHAPE_CONE_DMG);
    // No radius damage behind
  }

  function _damageEnemiesInRadius(pos, radius, damage) {
    var T = _THREE();
    if (!T) return;
    // Try window.Enemies or window._enemies
    var enemies = (window.Enemies && window.Enemies.getList && window.Enemies.getList())
      || window._enemies || [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var d = pos.distanceTo(e.position);
      if (d <= radius) {
        if (typeof e.takeDamage === 'function') e.takeDamage(damage);
        else if (e.hp != null) e.hp -= damage;
      }
    }
    // EnemyEngineer specifically
    if (window.EnemyEngineer && typeof window.EnemyEngineer.damageInRadius === 'function') {
      window.EnemyEngineer.damageInRadius(pos, radius, damage);
    }
  }

  function _damageEnemiesInCone(pos, dir, range, halfAngle, damage) {
    var T = _THREE();
    if (!T) return;
    var enemies = (window.Enemies && window.Enemies.getList && window.Enemies.getList())
      || window._enemies || [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var toEnemy = e.position.clone().sub(pos);
      var dist = toEnemy.length();
      if (dist > range) continue;
      toEnemy.normalize();
      var dot = dir.dot(toEnemy);
      if (dot >= Math.cos(halfAngle)) {
        if (typeof e.takeDamage === 'function') e.takeDamage(damage);
        else if (e.hp != null) e.hp -= damage;
      }
    }
  }

  function _damagePlayerIfClose(pos) {
    var T = _THREE();
    var playerPos = _getPlayerPos();
    if (!T || !playerPos) return;
    var dist = pos.distanceTo(playerPos);
    var dmg = 0;
    if (dist <= RADIUS_INNER) dmg = DAMAGE_INNER;
    else if (dist <= RADIUS_OUTER) dmg = DAMAGE_OUTER;
    if (dmg > 0 && window.PlayerHealth && typeof window.PlayerHealth.takeDamage === 'function') {
      window.PlayerHealth.takeDamage(dmg);
    }
  }

  // ── Voxel removal ──────────────────────────────────────────────────────────
  function _removeVoxelsNear(pos, radius) {
    if (!window.VoxelWorld || typeof window.VoxelWorld.removeBlock !== 'function') return;
    var r = Math.ceil(radius);
    for (var x = -r; x <= r; x++) {
      for (var y = -r; y <= r; y++) {
        for (var z = -r; z <= r; z++) {
          if (x * x + y * y + z * z <= radius * radius) {
            var bx = Math.round(pos.x) + x;
            var by = Math.round(pos.y) + y;
            var bz = Math.round(pos.z) + z;
            try { window.VoxelWorld.removeBlock(bx, by, bz); } catch (e) {}
          }
        }
      }
    }
  }

  // ── Structural collapse ────────────────────────────────────────────────────
  function _checkStructuralCollapse(pos) {
    // Count how many of the detonated charges were clustered
    // (we approximate: check any remaining placed charges too)
    // Actually count total this blast: look for other explosion positions within CLUSTER_RADIUS
    // We use a simple: if >= CLUSTER_THRESHOLD nearby blast positions, trigger collapse
    // Store recent explosion positions
    _recentBlastPositions.push({ pos: pos.clone(), time: _time });

    var nearby = 0;
    for (var i = 0; i < _recentBlastPositions.length; i++) {
      var bp = _recentBlastPositions[i];
      if (_time - bp.time < 0.5 && bp.pos.distanceTo(pos) < CLUSTER_RADIUS) {
        nearby++;
      }
    }
    if (nearby >= CLUSTER_THRESHOLD) {
      // Triple voxel removal
      _removeVoxelsNear(pos, VOXEL_RADIUS * 3);
      // Chain barrels
      if (window.ExplosiveBarrelChain && typeof window.ExplosiveBarrelChain.triggerChain === 'function') {
        window.ExplosiveBarrelChain.triggerChain(pos);
      }
      _toast('STRUCTURAL COLLAPSE!');
    }
  }

  var _recentBlastPositions = [];

  // ── Camera shake ───────────────────────────────────────────────────────────
  function _triggerShake(duration, intensity) {
    _shakeTimer = duration;
    _shakeIntensity = intensity;
  }

  function _updateShake(dt) {
    if (_shakeTimer <= 0) return;
    _shakeTimer -= dt;
    var cam = _getCamera();
    if (!cam) return;
    var intensity = (_shakeTimer / SHAKE_DURATION) * _shakeIntensity;
    cam.position.x += (Math.random() - 0.5) * intensity;
    cam.position.y += (Math.random() - 0.5) * intensity;
    if (_shakeTimer <= 0) {
      _shakeTimer = 0;
    }
  }

  // ── Detonator UI (hand-view mesh) ─────────────────────────────────────────
  function _showDetonator(show) {
    var T = _THREE();
    var cam = _getCamera();
    if (!T || !cam) return;

    if (show) {
      if (!_detonatorGroup) {
        _detonatorGroup = _buildDetonatorMesh();
        if (_detonatorGroup) {
          _detonatorGroup.position.set(0.22, -0.18, -0.35);
          _detonatorGroup.rotation.set(0.2, -0.3, 0);
          cam.add(_detonatorGroup);
        }
      } else {
        _detonatorGroup.visible = true;
      }
    } else {
      if (_detonatorGroup) {
        _detonatorGroup.visible = false;
      }
    }
    _detonatorActive = show;
    _showDetonatorHUD(show);
  }

  function _updateDetonatorSafety() {
    if (!_detonatorGroup) return;
    var safety = _detonatorGroup.userData.safetyMesh;
    var btn = _detonatorGroup.userData.btnMesh;
    if (safety) safety.rotation.x = _safetyFlipped ? -0.8 : 0;
    if (btn) btn.visible = _safetyFlipped;
    // Update detonator HUD text
    _showDetonatorHUD(true);
  }

  // ── Enemy defuse logic ─────────────────────────────────────────────────────
  function _updateDefuse(dt) {
    // Check if EnemyEngineer instances are near any charge
    var engineers = null;
    if (window.EnemyEngineer && typeof window.EnemyEngineer.getList === 'function') {
      engineers = window.EnemyEngineer.getList();
    }
    if (!engineers || engineers.length === 0) return;

    var T = _THREE();
    if (!T) return;

    for (var ci = 0; ci < _charges.length; ci++) {
      var charge = _charges[ci];
      if (charge.defused) continue;

      for (var ei = 0; ei < engineers.length; ei++) {
        var eng = engineers[ei];
        if (!eng || !eng.position) continue;
        var dist = charge.pos.distanceTo(eng.position);
        if (dist <= DEFUSE_DIST) {
          // Engineer is attempting defuse
          if (!charge.defusing) {
            charge.defusing = true;
            charge.defuseTimer = 0;
            _toast('Enemy engineer is defusing C4!');
          }
          charge.defuseTimer += dt;
          if (charge.defuseTimer >= DEFUSE_TIME) {
            charge.defused = true;
            charge.defusing = false;
            // Turn off LED
            if (charge.mesh && charge.mesh.userData.ledMat) {
              charge.mesh.userData.ledMat.emissive.setHex(0x000000);
              charge.mesh.userData.ledMat.color.setHex(0x333333);
            }
            _toast('C4 DEFUSED by enemy!');
          }
        } else {
          // Engineer moved away — reset defuse timer
          if (charge.defusing) {
            charge.defusing = false;
            charge.defuseTimer = 0;
          }
        }
      }
    }
  }

  // ── LED blink ──────────────────────────────────────────────────────────────
  function _updateLEDs(dt) {
    for (var i = 0; i < _charges.length; i++) {
      var charge = _charges[i];
      if (!charge.mesh || charge.defused) continue;

      charge.ledBlinkTimer += dt;

      var blinkRate;
      if (charge.isTimed) {
        // Faster blink as timer decreases
        var remaining = charge.timer;
        blinkRate = remaining > 0 ? Math.max(0.1, remaining / TIMER_COUNTDOWN) : 0.05;
        // Beep accelerates
        if (charge.ledBlinkTimer >= blinkRate) {
          _playBeep(1200, 0.04, 0.2);
          charge.ledBlinkTimer = 0;
        }
      } else {
        blinkRate = 1.0;
        if (charge.ledBlinkTimer >= blinkRate) {
          charge.ledBlinkTimer = 0;
        }
      }

      // Toggle LED visibility
      var ledOn = (charge.ledBlinkTimer < blinkRate * 0.5);
      var ledMat = charge.mesh.userData.ledMat;
      if (ledMat) {
        ledMat.emissiveIntensity = ledOn ? 1.0 : 0.0;
      }
    }
  }

  // ── Timed charge countdown ─────────────────────────────────────────────────
  function _updateTimedCharges(dt) {
    var toRemove = [];
    for (var i = 0; i < _charges.length; i++) {
      var charge = _charges[i];
      if (!charge.isTimed || charge.defused) continue;
      charge.timer -= dt;
      if (charge.timer <= 0) {
        toRemove.push(i);
      }
    }
    // Detonate in reverse order so splice indices stay valid
    for (var j = toRemove.length - 1; j >= 0; j--) {
      var idx = toRemove[j];
      var c = _charges.splice(idx, 1)[0];
      _explodeCharge(c);
    }
    if (toRemove.length > 0) _updateHUD();
  }

  // ── Debris & light update ──────────────────────────────────────────────────
  function _updateDebris(dt) {
    var T = _THREE();
    var sc = _getScene();
    var toRemove = [];
    for (var i = 0; i < _activeDebris.length; i++) {
      var d = _activeDebris[i];
      d.life -= dt;
      if (d.life <= 0) {
        if (sc) sc.remove(d.mesh);
        toRemove.push(i);
      } else {
        d.mesh.position.x += d.vel.x * dt;
        d.mesh.position.y += d.vel.y * dt - 4.9 * dt * dt; // gravity
        d.mesh.position.z += d.vel.z * dt;
        d.vel.y -= 9.8 * dt;
        d.mesh.rotation.x += 2 * dt;
        d.mesh.rotation.z += 1.5 * dt;
        d.mesh.material.opacity = d.life / DEBRIS_LIFETIME;
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _activeDebris.splice(toRemove[j], 1);
    }

    // Lights
    var toRemoveL = [];
    for (var k = 0; k < _activeLights.length; k++) {
      var lObj = _activeLights[k];
      lObj.timer -= dt;
      if (lObj.timer <= 0) {
        if (sc) sc.remove(lObj.light);
        toRemoveL.push(k);
      } else {
        lObj.light.intensity = (lObj.timer / 0.4) * LIGHT_INTENSITY;
      }
    }
    for (var m = toRemoveL.length - 1; m >= 0; m--) {
      _activeLights.splice(toRemoveL[m], 1);
    }
  }

  // ── Cleanup old blast records ──────────────────────────────────────────────
  function _cleanBlastHistory() {
    var cutoff = _time - 2.0;
    for (var i = _recentBlastPositions.length - 1; i >= 0; i--) {
      if (_recentBlastPositions[i].time < cutoff) {
        _recentBlastPositions.splice(i, 1);
      }
    }
  }

  // ── Toast helper ───────────────────────────────────────────────────────────
  function _toast(msg) {
    if (window.HUD && typeof window.HUD.showMessage === 'function') {
      window.HUD.showMessage(msg, 2500);
      return;
    }
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:22%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#ffdd44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border-radius:5px',
      'z-index:9999',
      'pointer-events:none',
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2000);
  }

  // ── Input handling ─────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.key === 'Control') _ctrlHeld = true;
    if (e.key === 'Alt') _altHeld = true;

    // Ctrl+4 — hold for timer, tap for normal place
    if (e.key === '4' && _ctrlHeld && !e.repeat) {
      _ctrl4Down = true;
      _ctrl4HoldTimer = 0;
      _timerModeArmed = false;
      e.preventDefault && e.preventDefault();
    }

    // X — toggle detonator UI
    if (e.key === 'x' || e.key === 'X') {
      if (!_xKeyDown) {
        _xKeyDown = true;
        if (_charges.length > 0) {
          var showing = !_detonatorActive;
          _showDetonator(showing);
          if (!showing) {
            _safetyFlipped = false;
          }
        } else {
          _toast('No C4 charges placed.');
        }
      }
    }

    // F — flip safety on detonator
    if ((e.key === 'f' || e.key === 'F') && _detonatorActive) {
      if (!_fKeyDown) {
        _fKeyDown = true;
        _safetyFlipped = !_safetyFlipped;
        _updateDetonatorSafety();
        _toast(_safetyFlipped ? 'Safety OFF — ready to detonate!' : 'Safety ON');
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Control') _ctrlHeld = false;
    if (e.key === 'Alt') _altHeld = false;
    if (e.key === 'x' || e.key === 'X') _xKeyDown = false;
    if (e.key === 'f' || e.key === 'F') _fKeyDown = false;

    if (e.key === '4' && _ctrl4Down) {
      _ctrl4Down = false;
      if (!_timerModeArmed) {
        // Short tap — place normal or shape charge
        if (_altHeld) {
          placeCharge(true, false);   // shape charge
        } else {
          placeCharge(false, false);  // normal charge
        }
      }
      _ctrl4HoldTimer = 0;
    }
  }

  function _onMouseDown(e) {
    if (!_detonatorActive) return;
    if (!_safetyFlipped) {
      _toast('Flip safety first (F)!');
      return;
    }
    // Detonate all charges
    _showDetonator(false);
    _safetyFlipped = false;
    detonate();
  }

  // ── AirdropSupply integration ──────────────────────────────────────────────
  function _tryResupplyFromAirdrop() {
    if (!window.AirdropSupply) return;
    // If AirdropSupply exposes a hook, register ammo resupply
    if (typeof window.AirdropSupply.onCollect === 'function') {
      // Already registered
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene || null;
    _camera = camera || null;
    _charges = [];
    _ammo = STARTING_AMMO;
    _time = 0;
    _shakeTimer = 0;
    _detonatorActive = false;
    _safetyFlipped = false;
    _ctrl4Down = false;
    _ctrl4HoldTimer = 0;
    _timerModeArmed = false;
    _activeDebris = [];
    _activeLights = [];
    _recentBlastPositions = [];

    if (!_inited) {
      document.addEventListener('keydown', _onKeyDown);
      document.addEventListener('keyup', _onKeyUp);
      document.addEventListener('mousedown', _onMouseDown);
      _inited = true;
    }

    _ensureHUD();
    _tryResupplyFromAirdrop();
  }

  function update(dt) {
    _time += dt;

    // Handle Ctrl+4 hold for timer mode
    if (_ctrl4Down) {
      _ctrl4HoldTimer += dt;
      if (_ctrl4HoldTimer >= TIMER_MODE_HOLD && !_timerModeArmed) {
        _timerModeArmed = true;
        // Place timed (or shape+timed) charge
        if (_altHeld) {
          placeCharge(true, true);
        } else {
          placeCharge(false, true);
        }
      }
    }

    _updateTimedCharges(dt);
    _updateLEDs(dt);
    _updateDefuse(dt);
    _updateDebris(dt);
    _updateShake(dt);
    _cleanBlastHistory();

    // Update HUD blink
    _updateHUD();
  }

  function reset() {
    // Remove all charge meshes from scene
    var sc = _getScene();
    for (var i = 0; i < _charges.length; i++) {
      if (_charges[i].mesh && sc) sc.remove(_charges[i].mesh);
    }
    _charges = [];
    _ammo = STARTING_AMMO;
    _shakeTimer = 0;
    _detonatorActive = false;
    _safetyFlipped = false;
    _ctrl4Down = false;
    _ctrl4HoldTimer = 0;
    _timerModeArmed = false;
    _recentBlastPositions = [];

    // Remove debris and lights
    for (var d = 0; d < _activeDebris.length; d++) {
      if (_activeDebris[d].mesh && sc) sc.remove(_activeDebris[d].mesh);
    }
    _activeDebris = [];
    for (var l = 0; l < _activeLights.length; l++) {
      if (_activeLights[l].light && sc) sc.remove(_activeLights[l].light);
    }
    _activeLights = [];

    // Hide detonator
    if (_detonatorGroup) _detonatorGroup.visible = false;
    _showDetonatorHUD(false);
    _updateHUD();
  }

  // Resupply function (called by AirdropSupply or supply drops)
  function resupply(amount) {
    _ammo = Math.min(_ammo + (amount || STARTING_AMMO), MAX_CHARGES * 2);
    _toast('C4 resupplied! x' + _ammo);
    _updateHUD();
  }

  return {
    init: init,
    update: update,
    placeCharge: placeCharge,
    detonate: detonate,
    reset: reset,
    resupply: resupply
  };
})();
