/* ───────────────────────────────────────────────────────────────────────────
   amphibious-assault.js — Amphibious operations: water crossing, beach
   landings, LCVP landing craft, and naval fire support.
   Ctrl+N → call naval support (cycles: BOMBARDMENT → SMOKE → ILLUMINATION)
   E       → board/exit LCVP landing craft
   Space   → swim toggle when in water
   API     : window.AmphibiousAssault = { init, update, spawnWaterZone,
                                           callNavalSupport, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.AmphibiousAssault = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var WATER_SPEED_MULT     = 0.6;   // 40% reduction in water
  var WADE_SPLASH_HZ       = 3;     // low splash frequency
  var SWIM_BOB_FREQ        = 2.0;   // camera bob Hz while paddling
  var SWIM_BOB_AMP         = 0.08;  // metres amplitude
  var LCVP_WIDTH           = 8;
  var LCVP_DEPTH           = 4;
  var LCVP_BOARD_DIST      = 4;     // metres to board
  var LCVP_SPEED           = 6;     // m/s forward
  var NAVAL_MAX_CALLS      = 3;
  var NAVAL_RECHARGE_TIME  = 90;    // seconds
  var BOMB_SHELL_COUNT     = 5;
  var BOMB_SHELL_INTERVAL  = 1;     // seconds between shells
  var BOMB_BLAST_RADIUS    = 12;
  var SMOKE_ROUND_COUNT    = 8;
  var SMOKE_WALL_WIDTH     = 80;
  var ILLUM_RADIUS         = 40;
  var ILLUM_DURATION       = 30;    // seconds
  var TIDE_PERIOD          = 60;    // seconds per cycle
  var TIDE_AMPLITUDE       = 1;     // unit rise/fall
  var BUBBLE_COUNT         = 8;
  var SPLASH_RINGS         = 8;
  var BEACH_STAKE_COUNT    = 4;
  var BEACH_SANDBAG_COUNT  = 2;

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _audioCtx = null;

  /* water */
  var _waterMesh      = null;
  var _waterBaseY     = 0;
  var _waterZones     = [];    // { mesh, x, z, w, h, baseY }
  var _inWater        = false;
  var _isSwimming     = false;
  var _tideTimer      = 0;
  var _wadeTimer      = 0;
  var _wadeSplashNode = null;
  var _swimBobTimer   = 0;
  var _bubbles        = [];    // { mesh, vy, life }
  var _splashRings    = [];    // { mesh, age, maxAge }
  var _underwaterFilter = false;
  var _lowPassNode    = null;
  var _gainNode       = null;

  /* LCVP landing craft */
  var _lcvp           = null;  // { group, rampMesh, rampDown, pos, onBeach }
  var _playerOnBoard  = false;
  var _rampDropped    = false;

  /* naval fire support */
  var _navalCalls     = NAVAL_MAX_CALLS;
  var _navalRecharge  = 0;
  var _navalType      = 0;     // 0=bombardment 1=smoke 2=illumination
  var _navalActive    = false;

  /* bombardment */
  var _bombShells     = [];    // { mesh, pos, vel, age }
  var _bombTimer      = 0;
  var _bombFired      = 0;

  /* smoke screen */
  var _smokeMeshes    = [];    // Three.Mesh spheres
  var _smokeActive    = false;

  /* illumination */
  var _illumMesh      = null;
  var _illumLight     = null;
  var _illumTimer     = 0;
  var _illumChute     = null;
  var _illumRising    = false;
  var _illumDeployed  = false;

  /* beach defenses */
  var _beachDefenses  = [];

  /* HUD */
  var _hudEl          = null;
  var _compassEl      = null;
  var _callCountEl    = null;
  var _craftStatusEl  = null;
  var _navalTypeEl    = null;

  /* keyboard */
  var _keys           = {};

  /* landing zone target (where bombardment/support aims) */
  var _landingZonePos = new THREE.Vector3(0, 0, -20);

  /* ── audio helpers ─────────────────────────────────────────────────────── */
  function _ensureAudio() {
    if (_audioCtx) return;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _gainNode = _audioCtx.createGain();
      _gainNode.gain.value = 1.0;
      _lowPassNode = _audioCtx.createBiquadFilter();
      _lowPassNode.type = 'lowpass';
      _lowPassNode.frequency.value = 20000;
      _gainNode.connect(_lowPassNode);
      _lowPassNode.connect(_audioCtx.destination);
    } catch (e) { /* no audio */ }
  }

  function _playTone(freq, type, duration, volume, startTime) {
    if (!_audioCtx) return null;
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume || 0.3, startTime || _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, (startTime || _audioCtx.currentTime) + duration);
      osc.connect(gain);
      gain.connect(_gainNode);
      osc.start(startTime || _audioCtx.currentTime);
      osc.stop((startTime || _audioCtx.currentTime) + duration);
      return osc;
    } catch (e) { return null; }
  }

  function _playSplash() {
    if (!_audioCtx) return;
    try {
      var buf = _audioCtx.createBuffer(1, _audioCtx.sampleRate * 0.3, _audioCtx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
      }
      var src = _audioCtx.createBufferSource();
      src.buffer = buf;
      var lp = _audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1200;
      src.connect(lp);
      lp.connect(_gainNode);
      src.start();
    } catch (e) {}
  }

  function _playBoomAt(delay) {
    if (!_audioCtx) return;
    var t = _audioCtx.currentTime + delay;
    _playTone(80, 'sawtooth', 1.5, 0.8, t);
    _playTone(40, 'sine', 2.0, 0.6, t);
  }

  function _setMuffled(on) {
    if (!_lowPassNode) return;
    _lowPassNode.frequency.value = on ? 400 : 20000;
    if (_gainNode) _gainNode.gain.value = on ? 0.3 : 1.0;
  }

  /* ── geometry helpers ──────────────────────────────────────────────────── */
  function _makeMaterial(color, opts) {
    var cfg = { color: color };
    if (opts) {
      if (opts.transparent !== undefined) cfg.transparent = opts.transparent;
      if (opts.opacity !== undefined) cfg.opacity = opts.opacity;
      if (opts.wireframe !== undefined) cfg.wireframe = opts.wireframe;
      if (opts.side !== undefined) cfg.side = opts.side;
    }
    return new THREE.MeshLambertMaterial(cfg);
  }

  /* ── water zone ─────────────────────────────────────────────────────────── */
  function spawnWaterZone(x, z, w, h) {
    x = x || 0; z = z || 0; w = w || 40; h = h || 40;
    var geo = new THREE.PlaneGeometry(w, h);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x1a7ab5,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0, z);
    mesh.receiveShadow = true;
    _scene.add(mesh);

    var zone = { mesh: mesh, x: x, z: z, w: w, h: h, baseY: 0 };
    _waterZones.push(zone);

    if (!_waterMesh) {
      _waterMesh = mesh;
      _waterBaseY = 0;
    }
    return zone;
  }

  function _getCurrentWaterY() {
    var offset = Math.sin((_tideTimer / TIDE_PERIOD) * Math.PI * 2) * TIDE_AMPLITUDE;
    return _waterBaseY + offset;
  }

  function _playerInWater() {
    if (!_camera) return false;
    var px = _camera.position.x;
    var pz = _camera.position.z;
    for (var i = 0; i < _waterZones.length; i++) {
      var z = _waterZones[i];
      var hw = z.w / 2;
      var hh = z.h / 2;
      if (px >= z.x - hw && px <= z.x + hw &&
          pz >= z.z - hh && pz <= z.z + hh) {
        return true;
      }
    }
    return false;
  }

  /* ── splash rings ──────────────────────────────────────────────────────── */
  function _spawnSplashRings(pos) {
    for (var i = 0; i < SPLASH_RINGS; i++) {
      var geo = new THREE.RingGeometry(0.1, 0.3, 16);
      var mat = new THREE.MeshBasicMaterial({
        color: 0x4fc3f7, transparent: true, opacity: 0.8,
        side: THREE.DoubleSide
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 2,
        pos.y + 0.05,
        pos.z + (Math.random() - 0.5) * 2
      );
      _scene.add(mesh);
      _splashRings.push({ mesh: mesh, age: 0, maxAge: 1.2, scale: 1 + i * 0.4 });
    }
    _playSplash();
  }

  /* ── bubbles ────────────────────────────────────────────────────────────── */
  function _spawnBubbles(pos) {
    for (var i = 0; i < BUBBLE_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.06, 6, 6);
      var mat = new THREE.MeshBasicMaterial({
        color: 0xadd8e6, transparent: true, opacity: 0.5
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.5,
        pos.y,
        pos.z + (Math.random() - 0.5) * 0.5
      );
      _scene.add(mesh);
      _bubbles.push({ mesh: mesh, vy: 0.5 + Math.random() * 0.8, life: 2.0 + Math.random() });
    }
  }

  /* ── underwater CSS filter ─────────────────────────────────────────────── */
  function _setUnderwaterFilter(on) {
    if (_underwaterFilter === on) return;
    _underwaterFilter = on;
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.style.filter = on ? 'hue-rotate(200deg) brightness(0.5) saturate(1.8)' : '';
    _setMuffled(on);
  }

  /* ── LCVP landing craft ─────────────────────────────────────────────────── */
  function _spawnLCVP(x, y, z) {
    var group = new THREE.Group();

    /* hull */
    var hullGeo = new THREE.BoxGeometry(LCVP_WIDTH, 1.2, LCVP_DEPTH);
    var hullMat = _makeMaterial(0x5c4a1e);
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0;
    group.add(hull);

    /* sides */
    var sideGeo = new THREE.BoxGeometry(LCVP_WIDTH, 1.0, 0.2);
    var sideMat = _makeMaterial(0x4a3a10);
    var sideL = new THREE.Mesh(sideGeo, sideMat);
    sideL.position.set(0, 0.8, -LCVP_DEPTH / 2 + 0.1);
    group.add(sideL);
    var sideR = new THREE.Mesh(sideGeo, sideMat);
    sideR.position.set(0, 0.8, LCVP_DEPTH / 2 - 0.1);
    group.add(sideR);

    /* ramp (front, hinged at bottom) */
    var rampGeo = new THREE.BoxGeometry(LCVP_WIDTH - 0.4, 0.15, LCVP_DEPTH * 0.6);
    var rampMat = _makeMaterial(0x6b5a20);
    var rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.set(0, 0.6, -(LCVP_DEPTH / 2) - 0.1);
    group.add(rampMesh);

    group.position.set(x, y, z);
    _scene.add(group);

    _lcvp = {
      group: group,
      rampMesh: rampMesh,
      rampDown: false,
      pos: new THREE.Vector3(x, y, z),
      onBeach: false,
      vel: new THREE.Vector3(0, 0, 0),
      moving: false
    };
  }

  function _lcvpDropRamp() {
    if (!_lcvp || _lcvp.rampDown) return;
    _lcvp.rampDown = true;
    /* animate ramp down 90° (forward-down) */
    var ramp = _lcvp.rampMesh;
    ramp.rotation.x = -Math.PI / 2;
    ramp.position.set(0, 0.1, -(LCVP_DEPTH / 2) - LCVP_DEPTH * 0.3);
    /* auto-exit player */
    if (_playerOnBoard) {
      _playerOnBoard = false;
      /* place player at ramp tip */
      if (_camera) {
        _camera.position.set(
          _lcvp.pos.x,
          _lcvp.pos.y + 1.7,
          _lcvp.pos.z - LCVP_DEPTH - 1
        );
      }
    }
  }

  function _isOnBeach(pos) {
    /* beach = not in any water zone */
    var px = pos.x;
    var pz = pos.z;
    for (var i = 0; i < _waterZones.length; i++) {
      var z = _waterZones[i];
      var hw = z.w / 2;
      var hh = z.h / 2;
      if (px >= z.x - hw && px <= z.x + hw &&
          pz >= z.z - hh && pz <= z.z + hh) {
        return false;
      }
    }
    return true;
  }

  /* ── beach defenses ─────────────────────────────────────────────────────── */
  function _spawnBeachDefenses(bx, bz) {
    var i;
    /* wooden stakes in X pattern */
    for (i = 0; i < BEACH_STAKE_COUNT; i++) {
      var group = new THREE.Group();
      var logGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.5, 6);
      var logMat = _makeMaterial(0x8B6914);

      /* two crossing logs */
      var log1 = new THREE.Mesh(logGeo, logMat);
      log1.rotation.z = Math.PI / 4;
      group.add(log1);
      var log2 = new THREE.Mesh(logGeo, logMat);
      log2.rotation.z = -Math.PI / 4;
      group.add(log2);

      group.position.set(
        bx + (i - 2) * 4 + (Math.random() - 0.5) * 2,
        0.8,
        bz + (Math.random() - 0.5) * 3
      );
      _scene.add(group);
      _beachDefenses.push(group);
    }

    /* sandbag walls */
    for (i = 0; i < BEACH_SANDBAG_COUNT; i++) {
      var wallGroup = new THREE.Group();
      /* row of sandbags */
      for (var j = 0; j < 5; j++) {
        var bagGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
        var bagMat = _makeMaterial(0xc2a05a);
        var bag = new THREE.Mesh(bagGeo, bagMat);
        bag.position.set(j * 0.85 - 1.7, 0, 0);
        wallGroup.add(bag);
      }
      /* second row staggered */
      for (var k = 0; k < 4; k++) {
        var bag2Geo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
        var bag2Mat = _makeMaterial(0xb89048);
        var bag2 = new THREE.Mesh(bag2Geo, bag2Mat);
        bag2.position.set(k * 0.85 - 1.3, 0.5, 0);
        wallGroup.add(bag2);
      }
      wallGroup.position.set(
        bx + (i - 1) * 10 + (Math.random() - 0.5) * 4,
        0.25,
        bz + 3 + (Math.random() - 0.5) * 2
      );
      _scene.add(wallGroup);
      _beachDefenses.push(wallGroup);
    }
  }

  /* ── naval fire support ─────────────────────────────────────────────────── */
  function callNavalSupport(type) {
    if (_navalCalls <= 0) return;
    if (_navalActive) return;
    _ensureAudio();
    _navalCalls--;
    _navalActive = true;

    if (type === 'BOMBARDMENT' || type === 0) {
      _startBombardment();
    } else if (type === 'SMOKE' || type === 1) {
      _startSmokeScreen();
    } else if (type === 'ILLUMINATION' || type === 2) {
      _startIllumination();
    }
    _updateHUD();
  }

  function _startBombardment() {
    _bombFired = 0;
    _bombTimer = 0;
  }

  function _spawnBombShell(idx) {
    var target = _landingZonePos.clone();
    target.x += (Math.random() - 0.5) * 20;
    target.z += (Math.random() - 0.5) * 20;

    /* shell starts offscreen high */
    var startX = target.x - 80;
    var startY = 60;
    var startZ = target.z - 20;

    var geo = new THREE.SphereGeometry(0.4, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(startX, startY, startZ);
    _scene.add(mesh);

    var travelTime = 3.0;
    var vel = new THREE.Vector3(
      (target.x - startX) / travelTime,
      (target.y - startY) / travelTime,
      (target.z - startZ) / travelTime
    );

    _bombShells.push({
      mesh: mesh,
      vel: vel,
      age: 0,
      travelTime: travelTime,
      target: target,
      exploded: false,
      shellIdx: idx
    });
  }

  function _bombardmentExplode(shell) {
    if (shell.exploded) return;
    shell.exploded = true;
    _scene.remove(shell.mesh);

    /* explosion flash */
    var geo = new THREE.SphereGeometry(BOMB_BLAST_RADIUS * 0.3, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var flash = new THREE.Mesh(geo, mat);
    flash.position.copy(shell.target);
    _scene.add(flash);

    /* debris particles */
    for (var i = 0; i < 12; i++) {
      var dGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      var dMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var debris = new THREE.Mesh(dGeo, dMat);
      debris.position.copy(shell.target);
      _scene.add(debris);
      (function (d) {
        var t = 0;
        var vx = (Math.random() - 0.5) * 10;
        var vy = Math.random() * 8;
        var vz = (Math.random() - 0.5) * 10;
        var tick = function () {
          t += 0.016;
          d.position.x += vx * 0.016;
          d.position.y += vy * 0.016 - 4.9 * t * t;
          d.position.z += vz * 0.016;
          if (t < 2.5) requestAnimationFrame(tick);
          else _scene.remove(d);
        };
        requestAnimationFrame(tick);
      })(debris);
    }

    /* fade flash */
    (function (f) {
      var t = 0;
      var fade = function () {
        t += 0.016;
        f.material.opacity = Math.max(0, 0.9 - t * 2);
        f.scale.setScalar(1 + t * 3);
        if (t < 0.45) requestAnimationFrame(fade);
        else _scene.remove(f);
      };
      requestAnimationFrame(fade);
    })(flash);

    _playBoomAt(0);
  }

  function _startSmokeScreen() {
    var target = _landingZonePos.clone();
    for (var i = 0; i < SMOKE_ROUND_COUNT; i++) {
      var offset = (i / (SMOKE_ROUND_COUNT - 1) - 0.5) * SMOKE_WALL_WIDTH;
      (function (off, idx) {
        setTimeout(function () {
          var geo = new THREE.SphereGeometry(6, 8, 8);
          var mat = new THREE.MeshLambertMaterial({
            color: 0xddddcc, transparent: true, opacity: 0.7
          });
          var smoke = new THREE.Mesh(geo, mat);
          smoke.position.set(target.x + off, 3, target.z);
          _scene.add(smoke);
          _smokeMeshes.push({ mesh: smoke, age: 0, maxAge: 30 });
          _playBoomAt(0);
        }, idx * 600);
      })(offset, i);
    }
    _smokeActive = true;
    setTimeout(function () {
      _navalActive = false;
      _navalRecharge = NAVAL_RECHARGE_TIME;
    }, SMOKE_ROUND_COUNT * 600 + 1000);
  }

  function _startIllumination() {
    /* star shell rises from offscreen */
    var geo = new THREE.SphereGeometry(0.3, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    _illumMesh = new THREE.Mesh(geo, mat);
    _illumMesh.position.set(_landingZonePos.x - 40, 5, _landingZonePos.z);
    _scene.add(_illumMesh);
    _illumRising = true;
    _illumDeployed = false;
    _illumTimer = 0;

    /* parachute placeholder (cone above shell) */
    var cGeo = new THREE.ConeGeometry(1.5, 2.5, 8);
    var cMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    _illumChute = new THREE.Mesh(cGeo, cMat);
    _illumChute.visible = false;
    _scene.add(_illumChute);

    /* light */
    _illumLight = new THREE.PointLight(0xffffdd, 3.0, ILLUM_RADIUS * 2);
    _illumLight.visible = false;
    _scene.add(_illumLight);
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'amphibious-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:16px',
      'background:rgba(0,20,40,0.82)',
      'color:#7fd8ff',
      'font-family:monospace',
      'font-size:12px',
      'padding:10px 14px',
      'border:1px solid #2a7ab5',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9998',
      'min-width:200px',
      'line-height:1.7'
    ].join(';');

    _compassEl    = document.createElement('div');
    _callCountEl  = document.createElement('div');
    _craftStatusEl= document.createElement('div');
    _navalTypeEl  = document.createElement('div');

    _hudEl.appendChild(_compassEl);
    _hudEl.appendChild(_callCountEl);
    _hudEl.appendChild(_craftStatusEl);
    _hudEl.appendChild(_navalTypeEl);
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl || !_camera) return;

    /* compass bearing to landing zone */
    var dx = _landingZonePos.x - _camera.position.x;
    var dz = _landingZonePos.z - _camera.position.z;
    var bearing = Math.round((Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360);
    _compassEl.textContent = 'LZ BEARING: ' + bearing + '°';

    /* call count */
    var rechargeStr = _navalRecharge > 0 ? ' (RECHARGE: ' + Math.ceil(_navalRecharge) + 's)' : '';
    _callCountEl.textContent = 'NAVAL SUPPORT: ' + _navalCalls + '/' + NAVAL_MAX_CALLS + rechargeStr;

    /* craft status */
    var craftStr = 'LCVP: ';
    if (!_lcvp) craftStr += 'NOT DEPLOYED';
    else if (_playerOnBoard) craftStr += 'BOARDED (W=DRIVE)';
    else if (_lcvp.rampDown) craftStr += 'RAMP DOWN - BEACH';
    else craftStr += 'READY (E=BOARD)';
    _craftStatusEl.textContent = craftStr;

    /* naval type */
    var types = ['BOMBARDMENT', 'SMOKE SCREEN', 'ILLUMINATION'];
    _navalTypeEl.textContent = 'SUPPORT TYPE: ' + types[_navalType] + ' (Ctrl+N)';

    /* water status */
    var wStr = _isSwimming ? ' [SWIMMING]' : (_inWater ? ' [WADING]' : '');
    _compassEl.textContent += wStr;
  }

  /* ── keyboard ───────────────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.code] = true;

    /* Ctrl+N → call naval support */
    if (e.code === 'KeyN' && e.ctrlKey) {
      e.preventDefault();
      callNavalSupport(_navalType);
      _navalType = (_navalType + 1) % 3;
      return;
    }

    /* E → board/exit LCVP */
    if (e.code === 'KeyE') {
      _handleBoardAction();
      return;
    }

    /* Space in water → swim toggle */
    if (e.code === 'Space' && _inWater) {
      e.preventDefault();
      _isSwimming = !_isSwimming;
      return;
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _handleBoardAction() {
    if (!_lcvp || !_camera) return;
    var dist = _camera.position.distanceTo(_lcvp.pos);
    if (!_playerOnBoard) {
      if (dist < LCVP_BOARD_DIST && !_lcvp.rampDown) {
        _playerOnBoard = true;
      }
    } else {
      _playerOnBoard = false;
    }
    _updateHUD();
  }

  /* ── wade sound loop ────────────────────────────────────────────────────── */
  function _tickWadeSound(delta) {
    if (!_inWater || !_audioCtx) return;
    _wadeTimer += delta;
    var interval = 1 / WADE_SPLASH_HZ;
    if (_wadeTimer >= interval) {
      _wadeTimer -= interval;
      _playSplash();
    }
  }

  /* ── update sub-systems ─────────────────────────────────────────────────── */
  function _updateTide(delta) {
    _tideTimer += delta;
    if (_tideTimer > TIDE_PERIOD) _tideTimer -= TIDE_PERIOD;
    var waterY = _getCurrentWaterY();
    for (var i = 0; i < _waterZones.length; i++) {
      _waterZones[i].mesh.position.y = waterY;
    }
  }

  function _updateWaterState(delta) {
    var wasInWater = _inWater;
    _inWater = _playerInWater();

    if (_inWater && !wasInWater && _camera) {
      _spawnSplashRings(_camera.position);
    }

    if (!_inWater) {
      _isSwimming = false;
      _setUnderwaterFilter(false);
    }

    /* underwater check: camera below water surface */
    var waterY = _getCurrentWaterY();
    if (_camera && _inWater && _camera.position.y < waterY) {
      _setUnderwaterFilter(true);
      if (Math.random() < delta * 2) {
        _spawnBubbles(_camera.position);
      }
    } else {
      _setUnderwaterFilter(false);
    }

    /* swim bob */
    if (_isSwimming && _camera) {
      _swimBobTimer += delta;
      var targetY = waterY + 0.05;
      var bob = Math.sin(_swimBobTimer * SWIM_BOB_FREQ * Math.PI * 2) * SWIM_BOB_AMP;
      _camera.position.y += (targetY + bob - _camera.position.y) * delta * 6;
    }
  }

  function _updateSplashRings(delta) {
    for (var i = _splashRings.length - 1; i >= 0; i--) {
      var r = _splashRings[i];
      r.age += delta;
      var t = r.age / r.maxAge;
      var s = r.scale * (1 + t * 4);
      r.mesh.scale.set(s, s, s);
      r.mesh.material.opacity = Math.max(0, 0.8 - t);
      if (r.age >= r.maxAge) {
        _scene.remove(r.mesh);
        _splashRings.splice(i, 1);
      }
    }
  }

  function _updateBubbles(delta) {
    for (var i = _bubbles.length - 1; i >= 0; i--) {
      var b = _bubbles[i];
      b.life -= delta;
      b.mesh.position.y += b.vy * delta;
      b.mesh.material.opacity = Math.max(0, b.life * 0.4);
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bubbles.splice(i, 1);
      }
    }
  }

  function _updateSmokeMeshes(delta) {
    for (var i = _smokeMeshes.length - 1; i >= 0; i--) {
      var s = _smokeMeshes[i];
      s.age += delta;
      s.mesh.material.opacity = Math.max(0, 0.7 * (1 - s.age / s.maxAge));
      s.mesh.position.y += delta * 0.3;
      if (s.age >= s.maxAge) {
        _scene.remove(s.mesh);
        _smokeMeshes.splice(i, 1);
      }
    }
  }

  function _updateIllumination(delta) {
    if (!_illumMesh) return;
    _illumTimer += delta;

    if (_illumRising) {
      _illumMesh.position.x += delta * 15;
      _illumMesh.position.y += delta * 20;
      if (_illumMesh.position.y > 45) {
        /* deploy parachute */
        _illumRising = false;
        _illumDeployed = true;
        _illumChute.visible = true;
        _illumLight.visible = true;
        _illumLight.position.copy(_illumMesh.position);
      }
    }

    if (_illumDeployed) {
      /* drift down slowly */
      _illumMesh.position.y -= delta * 0.5;
      _illumChute.position.set(
        _illumMesh.position.x,
        _illumMesh.position.y + 2,
        _illumMesh.position.z
      );
      _illumLight.position.copy(_illumMesh.position);

      var remaining = ILLUM_DURATION - (_illumTimer - 3);
      if (remaining < 5) {
        _illumLight.intensity = Math.max(0, 3.0 * (remaining / 5));
      }

      if (remaining <= 0) {
        _scene.remove(_illumMesh);
        _scene.remove(_illumChute);
        _scene.remove(_illumLight);
        _illumMesh = null;
        _illumChute = null;
        _illumLight = null;
        _illumDeployed = false;
        _navalActive = false;
        _navalRecharge = NAVAL_RECHARGE_TIME;
        _updateHUD();
      }
    }
  }

  function _updateBombardment(delta) {
    /* spawn shells at intervals */
    if (_navalActive && _bombFired < BOMB_SHELL_COUNT) {
      _bombTimer += delta;
      if (_bombTimer >= BOMB_SHELL_INTERVAL * _bombFired || _bombFired === 0) {
        if (_bombTimer >= BOMB_SHELL_INTERVAL * _bombFired) {
          _spawnBombShell(_bombFired);
          _bombFired++;
        }
      }
    }

    /* move shells in flight */
    for (var i = _bombShells.length - 1; i >= 0; i--) {
      var s = _bombShells[i];
      s.age += delta;
      s.mesh.position.x += s.vel.x * delta;
      s.mesh.position.y += s.vel.y * delta - 4.9 * s.age * delta;
      s.mesh.position.z += s.vel.z * delta;

      if (s.age >= s.travelTime && !s.exploded) {
        _bombardmentExplode(s);
        _bombShells.splice(i, 1);
      }
    }

    /* all shells done */
    if (_navalActive && _bombFired >= BOMB_SHELL_COUNT && _bombShells.length === 0) {
      _navalActive = false;
      _navalRecharge = NAVAL_RECHARGE_TIME;
      _updateHUD();
    }
  }

  function _updateLCVP(delta) {
    if (!_lcvp) return;

    /* drive forward when W held and player on board */
    if (_playerOnBoard && _keys['KeyW']) {
      var fwd = new THREE.Vector3(0, 0, -1);
      fwd.applyQuaternion(_lcvp.group.quaternion);
      _lcvp.pos.addScaledVector(fwd, LCVP_SPEED * delta);
      _lcvp.group.position.copy(_lcvp.pos);

      /* check if on beach → drop ramp */
      if (_isOnBeach(_lcvp.pos) && !_lcvp.rampDown) {
        _lcvp.onBeach = true;
        _lcvpDropRamp();
      }

      /* carry player */
      if (_camera) {
        _camera.position.set(
          _lcvp.pos.x,
          _lcvp.pos.y + 2.5,
          _lcvp.pos.z - 0.5
        );
      }
    }
  }

  function _updateNavalRecharge(delta) {
    if (_navalRecharge > 0) {
      _navalRecharge -= delta;
      if (_navalRecharge <= 0) {
        _navalRecharge = 0;
        if (_navalCalls < NAVAL_MAX_CALLS) {
          _navalCalls++;
          _navalRecharge = _navalCalls < NAVAL_MAX_CALLS ? NAVAL_RECHARGE_TIME : 0;
          _updateHUD();
        }
      }
    }
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _ensureAudio();
    _buildHUD();
    _updateHUD();

    /* default water zone */
    spawnWaterZone(0, -10, 40, 40);

    /* default LCVP */
    _spawnLCVP(-5, 0.6, -25);

    /* beach defenses on the far side */
    _spawnBeachDefenses(0, 5);

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  function update(delta) {
    if (!_scene || !_camera) return;

    _updateTide(delta);
    _updateWaterState(delta);
    _updateSplashRings(delta);
    _updateBubbles(delta);
    _updateSmokeMeshes(delta);
    _updateIllumination(delta);
    _updateBombardment(delta);
    _updateLCVP(delta);
    _updateNavalRecharge(delta);
    _tickWadeSound(delta);
    _updateHUD();
  }

  function reset() {
    /* remove water zones */
    var i;
    for (i = 0; i < _waterZones.length; i++) {
      _scene.remove(_waterZones[i].mesh);
    }
    _waterZones = [];
    _waterMesh = null;

    /* remove splash rings */
    for (i = _splashRings.length - 1; i >= 0; i--) {
      _scene.remove(_splashRings[i].mesh);
    }
    _splashRings = [];

    /* remove bubbles */
    for (i = _bubbles.length - 1; i >= 0; i--) {
      _scene.remove(_bubbles[i].mesh);
    }
    _bubbles = [];

    /* remove smoke */
    for (i = _smokeMeshes.length - 1; i >= 0; i--) {
      _scene.remove(_smokeMeshes[i].mesh);
    }
    _smokeMeshes = [];

    /* remove bomb shells */
    for (i = _bombShells.length - 1; i >= 0; i--) {
      _scene.remove(_bombShells[i].mesh);
    }
    _bombShells = [];

    /* remove illumination */
    if (_illumMesh) _scene.remove(_illumMesh);
    if (_illumChute) _scene.remove(_illumChute);
    if (_illumLight) _scene.remove(_illumLight);
    _illumMesh = null; _illumChute = null; _illumLight = null;

    /* remove LCVP */
    if (_lcvp) { _scene.remove(_lcvp.group); _lcvp = null; }

    /* remove beach defenses */
    for (i = 0; i < _beachDefenses.length; i++) {
      _scene.remove(_beachDefenses[i]);
    }
    _beachDefenses = [];

    /* reset flags */
    _inWater = false;
    _isSwimming = false;
    _playerOnBoard = false;
    _rampDropped = false;
    _navalCalls = NAVAL_MAX_CALLS;
    _navalRecharge = 0;
    _navalType = 0;
    _navalActive = false;
    _bombFired = 0;
    _bombTimer = 0;
    _smokeActive = false;
    _illumRising = false;
    _illumDeployed = false;
    _illumTimer = 0;
    _tideTimer = 0;
    _wadeTimer = 0;
    _swimBobTimer = 0;
    _waterBaseY = 0;

    _setUnderwaterFilter(false);
    _setMuffled(false);
    _updateHUD();
  }

  return {
    init: init,
    update: update,
    spawnWaterZone: spawnWaterZone,
    callNavalSupport: callNavalSupport,
    reset: reset
  };
})();
