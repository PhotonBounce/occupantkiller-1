/* ───────────────────────────────────────────────────────────────────────────
   air-strike.js — Radio-called air strike system
   Ctrl+Shift+A → enter targeting mode (red laser designator ring on ground)
   Click        → confirm target → 3s warning → aircraft flyover → bombs away
   API          : window.AirStrike = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.AirStrike = (function () {
  'use strict';

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  var _charges          = 2;
  var _cooldownRemaining = 0;
  var COOLDOWN_TIME      = 45;   // seconds between uses
  var MAX_CHARGES        = 2;

  /* targeting mode */
  var _targeting      = false;
  var _designatorRing = null;   // THREE.Mesh RingGeometry shown on ground
  var _designatorMat  = null;
  var _designatorPulse = 0;    // time accumulator for scale pulsing
  var _targetPos      = null;   // { x, y, z } confirmed target

  /* strike phases */
  var _phase = 'idle';   // idle | warning | flyover | bombing | done
  var _phaseTimer = 0;

  /* aircraft */
  var _aircraft       = null;   // THREE.Group
  var _aircraftDir    = { x: 1, z: 0 };  // unit vector of travel
  var _aircraftSpeed  = 40;    // units/s
  var _aircraftStart  = null;  // { x, y, z }
  var _aircraftEnd    = null;  // { x, y, z }
  var _aircraftT      = 0;     // 0..1 lerp
  var _aircraftTravel = 200;   // total distance across sky

  /* bombs */
  var _bombs          = [];    // { mesh, vy, x, y, z, dropped }
  var _bombDropTimes  = [0, 1, 2];  // seconds after bombing phase start
  var _bombTimer      = 0;
  var _bombsDropped   = 0;

  /* explosions / particles */
  var _particles      = [];   // { mesh, mat, vx, vy, vz, life, maxLife }
  var _craters        = [];   // mesh refs to clean up
  var _smoke          = [];   // { mesh, mat, vy, life, maxLife }

  /* screen shake */
  var _shakeTime = 0;
  var SHAKE_DURATION = 0.3;

  /* HUD elements */
  var _hudEl       = null;
  var _warningEl   = null;
  var _warningTimer = 0;
  var _warningBlink = 0;

  /* raycaster for targeting */
  var _raycaster = null;

  /* ── audio helpers ─────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    return window._audioCtx ||
      (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
  }

  /* 3 beeps at 440 Hz — inbound warning siren */
  function _playSiren() {
    try {
      var ctx = _getAudioCtx();
      var beepCount = 3;
      for (var i = 0; i < beepCount; i++) {
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 440;
        var startT = ctx.currentTime + i * 0.7;
        var endT   = startT + 0.4;
        gain.gain.setValueAtTime(0.18, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, endT);
        osc.start(startT);
        osc.stop(endT);
      }
    } catch (e) { /* silent */ }
  }

  /* low rumble on impact */
  function _playImpact() {
    try {
      var ctx = _getAudioCtx();
      var bufLen = ctx.sampleRate * 2;
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        var t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 2.5);
      }
      var src  = ctx.createBufferSource();
      var lp   = ctx.createBiquadFilter();
      var gn   = ctx.createGain();
      lp.type = 'lowpass';
      lp.frequency.value = 150;
      gn.gain.value = 0.9;
      src.buffer = buf;
      src.connect(lp);
      lp.connect(gn);
      gn.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  /* ── Three.js helpers ──────────────────────────────────────────────────── */
  function _THREE() { return window.THREE; }

  function _makeColor(hex) {
    return new (_THREE().Color)(hex);
  }

  /* ── designator ring ───────────────────────────────────────────────────── */
  function _createDesignator(x, y, z) {
    _removeDesignator();
    var T = _THREE();
    var geo = new T.RingGeometry(1.2, 1.8, 32);
    var mat = new T.MeshBasicMaterial({
      color: 0xff0000,
      side: T.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y + 0.05, z);
    _scene.add(mesh);
    _designatorRing = mesh;
    _designatorMat  = mat;
    _designatorPulse = 0;
  }

  function _removeDesignator() {
    if (_designatorRing) {
      _scene.remove(_designatorRing);
      if (_designatorRing.geometry) _designatorRing.geometry.dispose();
      if (_designatorMat) _designatorMat.dispose();
      _designatorRing = null;
      _designatorMat  = null;
    }
  }

  /* ── aircraft mesh ─────────────────────────────────────────────────────── */
  function _createAircraft(tx, tz) {
    var T = _THREE();
    var group = new T.Group();

    /* fuselage — elongated cylinder */
    var bodyGeo = new T.CylinderGeometry(0.4, 0.4, 8, 8);
    var bodyMat = new T.MeshBasicMaterial({ color: 0x333333 });
    var body    = new T.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    /* left wing */
    var wingGeo = new T.CylinderGeometry(0.15, 0.6, 5, 6);
    var wingMat = new T.MeshBasicMaterial({ color: 0x222222 });
    var wingL   = new T.Mesh(wingGeo, wingMat);
    wingL.rotation.x = Math.PI / 2;
    wingL.position.set(0, 0, -2.8);
    group.add(wingL);

    /* right wing */
    var wingR = new T.Mesh(wingGeo, wingMat);
    wingR.rotation.x = Math.PI / 2;
    wingR.position.set(0, 0, 2.8);
    group.add(wingR);

    /* position: come from far side relative to target */
    var angle = Math.random() * Math.PI * 2;
    _aircraftDir = { x: Math.cos(angle), z: Math.sin(angle) };
    var startX = tx - _aircraftDir.x * (_aircraftTravel / 2);
    var startZ = tz - _aircraftDir.z * (_aircraftTravel / 2);
    var endX   = tx + _aircraftDir.x * (_aircraftTravel / 2);
    var endZ   = tz + _aircraftDir.z * (_aircraftTravel / 2);
    var sy = 80;

    group.position.set(startX, sy, startZ);
    /* rotate group so fuselage faces travel direction */
    group.rotation.y = Math.atan2(_aircraftDir.x, _aircraftDir.z);

    _scene.add(group);
    _aircraft      = group;
    _aircraftStart = { x: startX, y: sy, z: startZ };
    _aircraftEnd   = { x: endX,   y: sy, z: endZ };
    _aircraftT     = 0;
  }

  function _removeAircraft() {
    if (_aircraft) {
      _aircraft.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      _scene.remove(_aircraft);
      _aircraft = null;
    }
  }

  /* ── bombs ─────────────────────────────────────────────────────────────── */
  function _dropBomb() {
    if (!_aircraft || !_targetPos) return;
    var T = _THREE();
    var spread = 3;
    var bx = _targetPos.x + (Math.random() - 0.5) * spread * 2;
    var bz = _targetPos.z + (Math.random() - 0.5) * spread * 2;
    var by = _aircraft.position.y;

    var geo  = new T.BoxGeometry(0.3, 0.8, 0.3);
    var mat  = new T.MeshBasicMaterial({ color: 0x111111 });
    var mesh = new T.Mesh(geo, mat);
    mesh.position.set(bx, by, bz);
    _scene.add(mesh);
    _bombs.push({ mesh: mesh, vy: 0, x: bx, y: by, z: bz });
  }

  function _updateBombs(dt) {
    var gravity = 100;
    var toRemove = [];
    for (var i = 0; i < _bombs.length; i++) {
      var b = _bombs[i];
      b.vy -= gravity * dt;
      b.y  += b.vy * dt;
      b.mesh.position.y = b.y;
      if (b.y <= 0) {
        _onBombImpact(b.x, b.z);
        _scene.remove(b.mesh);
        if (b.mesh.geometry) b.mesh.geometry.dispose();
        if (b.mesh.material) b.mesh.material.dispose();
        toRemove.push(i);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _bombs.splice(toRemove[j], 1);
    }
  }

  /* ── impact explosion ──────────────────────────────────────────────────── */
  function _onBombImpact(ix, iz) {
    _playImpact();
    _spawnExplosionParticles(ix, iz);
    _spawnCrater(ix, iz);
    _spawnSmoke(ix, iz);
    _shakeTime = SHAKE_DURATION;
    _checkFriendlyFire(ix, iz);
  }

  /* 80 red/orange/yellow particles */
  function _spawnExplosionParticles(ix, iz) {
    var T = _THREE();
    var colors = [0xff2200, 0xff6600, 0xffaa00, 0xffff00];
    for (var i = 0; i < 80; i++) {
      var col = colors[Math.floor(Math.random() * colors.length)];
      var geo = new T.BoxGeometry(0.25, 0.25, 0.25);
      var mat = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 });
      var mesh = new T.Mesh(geo, mat);
      var speed = 8 + Math.random() * 20;
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.random() * Math.PI;
      var vx = Math.sin(phi) * Math.cos(theta) * speed;
      var vy = Math.abs(Math.cos(phi)) * speed + 4;
      var vz = Math.sin(phi) * Math.sin(theta) * speed;
      mesh.position.set(ix, 0.1, iz);
      _scene.add(mesh);
      _particles.push({ mesh: mesh, mat: mat, vx: vx, vy: vy, vz: vz, life: 0, maxLife: 0.8 + Math.random() * 0.6 });
    }
  }

  /* flat disc crater */
  function _spawnCrater(ix, iz) {
    var T = _THREE();
    var geo = new T.CircleGeometry(3.5, 16);
    var mat = new T.MeshBasicMaterial({ color: 0x1a0a00, side: T.DoubleSide });
    var mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(ix, 0.02, iz);
    _scene.add(mesh);
    _craters.push(mesh);
  }

  /* 4 grey smoke columns */
  function _spawnSmoke(ix, iz) {
    var T = _THREE();
    for (var i = 0; i < 4; i++) {
      var ox = (Math.random() - 0.5) * 3;
      var oz = (Math.random() - 0.5) * 3;
      var geo  = new T.BoxGeometry(0.8, 0.8, 0.8);
      var mat  = new T.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.7 });
      var mesh = new T.Mesh(geo, mat);
      mesh.position.set(ix + ox, 0.5, iz + oz);
      _scene.add(mesh);
      _smoke.push({ mesh: mesh, mat: mat, vy: 0.5, life: 0, maxLife: 6 });
    }
  }

  /* ── friendly fire check ───────────────────────────────────────────────── */
  function _checkFriendlyFire(ix, iz) {
    if (!_camera) return;
    var px = _camera.position.x;
    var pz = _camera.position.z;
    var dx = px - ix;
    var dz = pz - iz;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= 12) {
      if (window.PlayerHealth && typeof window.PlayerHealth.takeDamage === 'function') {
        window.PlayerHealth.takeDamage(60);
      } else if (window.GameManager && typeof window.GameManager.takeDamage === 'function') {
        window.GameManager.takeDamage(60);
      }
    }
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff4400',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'text-shadow:0 0 6px #ff2200',
      'z-index:500',
      'pointer-events:none'
    ].join(';');
    _updateHUDText();
    document.body.appendChild(_hudEl);

    _warningEl = document.createElement('div');
    _warningEl.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff0000',
      'font-family:monospace',
      'font-size:32px',
      'font-weight:bold',
      'letter-spacing:6px',
      'text-shadow:0 0 24px #ff0000',
      'z-index:3100',
      'display:none',
      'pointer-events:none',
      'text-align:center'
    ].join(';');
    _warningEl.textContent = 'AIR STRIKE INBOUND';
    document.body.appendChild(_warningEl);
  }

  function _updateHUDText() {
    if (!_hudEl) return;
    var cdStr = (_cooldownRemaining > 0)
      ? ' CD:' + Math.ceil(_cooldownRemaining) + 's'
      : '';
    _hudEl.textContent = 'Air Strike [' + _charges + ']' + cdStr;
  }

  function _removeHUD() {
    if (_hudEl)     { document.body.removeChild(_hudEl);     _hudEl     = null; }
    if (_warningEl) { document.body.removeChild(_warningEl); _warningEl = null; }
  }

  /* ── targeting via raycaster ────────────────────────────────────────────── */
  function _groundHitFromCamera() {
    if (!_camera || !_scene) return null;
    var T = _THREE();
    if (!_raycaster) _raycaster = new T.Raycaster();
    /* shoot from camera center forward */
    var dir = new T.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    _raycaster.set(_camera.position, dir);
    /* intersect a virtual ground plane at y=0 */
    var plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    var hit   = new T.Vector3();
    var result = _raycaster.ray.intersectPlane(plane, hit);
    if (result) return { x: hit.x, y: 0, z: hit.z };
    /* fallback: project 50 units ahead */
    var fwd = dir.clone().multiplyScalar(50).add(_camera.position);
    return { x: fwd.x, y: 0, z: fwd.z };
  }

  /* ── keyboard handler ───────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      _enterTargeting();
    }
  }

  function _enterTargeting() {
    if (_charges <= 0)             return;
    if (_cooldownRemaining > 0)    return;
    if (_phase !== 'idle')         return;
    _targeting = true;
    /* place initial designator at crosshair hit */
    var pos = _groundHitFromCamera();
    if (pos) _createDesignator(pos.x, pos.y, pos.z);
  }

  function _onMouseClick(e) {
    if (!_targeting) return;
    e.preventDefault();
    var pos = _groundHitFromCamera();
    if (!pos) return;
    _targetPos = pos;
    _targeting = false;
    _removeDesignator();
    _startWarning();
  }

  /* ── strike phases ──────────────────────────────────────────────────────── */
  function _startWarning() {
    _phase      = 'warning';
    _phaseTimer = 0;
    _warningTimer = 0;
    _warningBlink = 0;
    _playSiren();
    if (_warningEl) {
      _warningEl.style.display = 'block';
      _warningEl.style.opacity = '1';
    }
    _charges--;
    if (_charges <= 0) {
      _cooldownRemaining = COOLDOWN_TIME;
    }
    _updateHUDText();
  }

  function _startFlyover() {
    _phase      = 'flyover';
    _phaseTimer = 0;
    if (_warningEl) _warningEl.style.display = 'none';
    _createAircraft(_targetPos.x, _targetPos.z);
    _bombsDropped = 0;
    _bombTimer    = 0;
  }

  function _startBombing() {
    _phase      = 'bombing';
    _phaseTimer = 0;
    _bombTimer  = 0;
  }

  /* ── update loops ───────────────────────────────────────────────────────── */
  function _updateTargeting() {
    if (!_targeting) return;
    var pos = _groundHitFromCamera();
    if (pos && _designatorRing) {
      _designatorRing.position.set(pos.x, 0.05, pos.z);
    } else if (pos) {
      _createDesignator(pos.x, 0, pos.z);
    }
    /* pulsing scale */
    _designatorPulse += 0.1;
    var s = 1 + 0.15 * Math.sin(_designatorPulse * 6);
    if (_designatorRing) _designatorRing.scale.set(s, s, s);
    if (_designatorMat)  _designatorMat.opacity = 0.7 + 0.3 * Math.abs(Math.sin(_designatorPulse * 3));
  }

  function _updateWarning(dt) {
    _phaseTimer   += dt;
    _warningTimer += dt;
    _warningBlink += dt;
    /* blink the warning text */
    if (_warningEl) {
      _warningEl.style.opacity = (Math.floor(_warningBlink * 4) % 2 === 0) ? '1' : '0.1';
    }
    if (_phaseTimer >= 3) {
      _startFlyover();
    }
  }

  function _updateFlyover(dt) {
    _phaseTimer += dt;
    if (!_aircraft || !_targetPos) return;

    var totalDist = _aircraftTravel;
    var elapsed   = _phaseTimer * _aircraftSpeed;
    _aircraftT    = Math.min(elapsed / totalDist, 1);

    _aircraft.position.x = _aircraftStart.x + (_aircraftEnd.x - _aircraftStart.x) * _aircraftT;
    _aircraft.position.z = _aircraftStart.z + (_aircraftEnd.z - _aircraftStart.z) * _aircraftT;

    /* when aircraft is near overhead the target, switch to bombing */
    var ax = _aircraft.position.x;
    var az = _aircraft.position.z;
    var dx = ax - _targetPos.x;
    var dz = az - _targetPos.z;
    var overheadDist = Math.sqrt(dx * dx + dz * dz);

    if (_aircraftT >= 0.35 && _phase === 'flyover') {
      _startBombing();
    }
    if (_aircraftT >= 1) {
      _removeAircraft();
    }
  }

  function _updateBombing(dt) {
    _phaseTimer += dt;
    _bombTimer  += dt;

    /* still update aircraft position during bombing phase */
    if (_aircraft && _targetPos) {
      var totalDist = _aircraftTravel;
      var elapsed   = (_phaseTimer + 3 * 0.35) * _aircraftSpeed;
      _aircraftT    = Math.min(elapsed / totalDist, 1);
      _aircraft.position.x = _aircraftStart.x + (_aircraftEnd.x - _aircraftStart.x) * _aircraftT;
      _aircraft.position.z = _aircraftStart.z + (_aircraftEnd.z - _aircraftStart.z) * _aircraftT;
      if (_aircraftT >= 1) _removeAircraft();
    }

    /* drop bombs at 0s, 1s, 2s */
    if (_bombsDropped < 3) {
      var nextDropTime = _bombDropTimes[_bombsDropped];
      if (_bombTimer >= nextDropTime) {
        _dropBomb();
        _bombsDropped++;
      }
    }

    /* phase ends when all bombs have landed and smoke/particles settle */
    if (_bombsDropped >= 3 && _bombs.length === 0 && _phaseTimer > 5) {
      _phase = 'done';
    }
  }

  function _updateParticles(dt) {
    var gravity = 18;
    var toRemove = [];
    for (var i = 0; i < _particles.length; i++) {
      var p = _particles[i];
      p.life += dt;
      var t = p.life / p.maxLife;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= gravity * dt;
      p.mat.opacity = Math.max(0, 1 - t);
      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mat) p.mat.dispose();
        toRemove.push(i);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _particles.splice(toRemove[j], 1);
    }
  }

  function _updateSmoke(dt) {
    var toRemove = [];
    for (var i = 0; i < _smoke.length; i++) {
      var s = _smoke[i];
      s.life += dt;
      var t = s.life / s.maxLife;
      s.mesh.position.y += s.vy * dt;
      s.mesh.scale.setScalar(1 + t * 2);
      s.mat.opacity = Math.max(0, 0.7 * (1 - t));
      if (s.life >= s.maxLife) {
        _scene.remove(s.mesh);
        if (s.mesh.geometry) s.mesh.geometry.dispose();
        if (s.mat) s.mat.dispose();
        toRemove.push(i);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _smoke.splice(toRemove[j], 1);
    }
  }

  function _updateShake(dt) {
    if (_shakeTime <= 0 || !_camera) return;
    _shakeTime -= dt;
    var mag = 0.05 * Math.random();
    _camera.rotation.x += mag * (Math.random() - 0.5) * 2;
    _camera.rotation.z += mag * (Math.random() - 0.5) * 2;
    if (_shakeTime <= 0) _shakeTime = 0;
  }

  function _updateCooldown(dt) {
    if (_cooldownRemaining > 0) {
      _cooldownRemaining -= dt;
      if (_cooldownRemaining <= 0) {
        _cooldownRemaining = 0;
        /* restore charges */
        _charges = MAX_CHARGES;
      }
      _updateHUDText();
    }
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');
    _createHUD();
    document.addEventListener('keydown',  _onKeyDown,    false);
    if (_canvas) {
      _canvas.addEventListener('click', _onMouseClick, false);
    } else {
      document.addEventListener('click', _onMouseClick, false);
    }
  }

  function update(dt) {
    if (!_scene || !_camera) return;
    if (!dt || dt <= 0) return;

    _updateCooldown(dt);
    _updateTargeting();
    _updateShake(dt);
    _updateParticles(dt);
    _updateSmoke(dt);
    _updateBombs(dt);

    if (_phase === 'warning') {
      _updateWarning(dt);
    } else if (_phase === 'flyover') {
      _updateFlyover(dt);
    } else if (_phase === 'bombing') {
      _updateBombing(dt);
    } else if (_phase === 'done') {
      _phase = 'idle';
    }
  }

  function reset() {
    /* clean targeting */
    _targeting = false;
    _removeDesignator();
    _targetPos = null;

    /* remove aircraft */
    _removeAircraft();

    /* remove bombs */
    for (var i = 0; i < _bombs.length; i++) {
      _scene.remove(_bombs[i].mesh);
      if (_bombs[i].mesh.geometry) _bombs[i].mesh.geometry.dispose();
      if (_bombs[i].mesh.material) _bombs[i].mesh.material.dispose();
    }
    _bombs = [];
    _bombsDropped = 0;

    /* remove particles */
    for (var j = 0; j < _particles.length; j++) {
      _scene.remove(_particles[j].mesh);
      if (_particles[j].mesh.geometry) _particles[j].mesh.geometry.dispose();
      if (_particles[j].mat) _particles[j].mat.dispose();
    }
    _particles = [];

    /* remove smoke */
    for (var k = 0; k < _smoke.length; k++) {
      _scene.remove(_smoke[k].mesh);
      if (_smoke[k].mesh.geometry) _smoke[k].mesh.geometry.dispose();
      if (_smoke[k].mat) _smoke[k].mat.dispose();
    }
    _smoke = [];

    /* remove craters */
    for (var c = 0; c < _craters.length; c++) {
      _scene.remove(_craters[c]);
      if (_craters[c].geometry) _craters[c].geometry.dispose();
      if (_craters[c].material) _craters[c].material.dispose();
    }
    _craters = [];

    /* reset phase */
    _phase      = 'idle';
    _phaseTimer = 0;
    _shakeTime  = 0;
    _charges    = MAX_CHARGES;
    _cooldownRemaining = 0;

    if (_warningEl) _warningEl.style.display = 'none';
    _updateHUDText();
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };
})();
