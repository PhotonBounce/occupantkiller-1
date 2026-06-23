/* ═══════════════════════════════════════════════════════════════════════════
   RECON DRONE — Persistent ISR (Intelligence, Surveillance, Reconnaissance)
   ─────────────────────────────────────────────────────────────────────────
   Ctrl+D  → launch drone (first press) / toggle drone-cam HUD (if airborne)
   Alt     → (while drone airborne) paint laser target on nearest tagged enemy
   Battery : 90s life → blink at 10s → return & 60s recharge on empty
   HP      : 30 — takes 10 dmg from enemy shots near drone; death = explosion
   EMP     : window._empActive → loses control 5s (random movement)

   Public API:
     window.ReconDrone = { init, update, launch, recall, reset }
   ═══════════════════════════════════════════════════════════════════════════ */
window.ReconDrone = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var HOVER_Y         = 12;      // altitude above player Y
  var ORBIT_RADIUS    = 15;      // units
  var ORBIT_SPEED     = 0.4;     // rad/s
  var ALT_VARIATION   = 0.5;     // ±units sin wave
  var ROTOR_SPEED     = 15;      // rad/s
  var SCAN_INTERVAL   = 1.0;     // seconds between surveillance sweeps
  var SCAN_RADIUS     = 20;      // metres
  var ENEMY_LIGHT_INT = 0.3;     // intensity of tagging PointLight
  var ENEMY_LIGHT_RNG = 5;       // range of tagging PointLight
  var BATTERY_MAX     = 90;      // seconds
  var BATTERY_WARN    = 10;      // blink below this
  var RECHARGE_TIME   = 60;      // seconds to recharge
  var DRONE_HP        = 30;
  var DMG_PER_HIT     = 10;
  var EMP_LOSE_CTRL   = 5;       // seconds of random movement
  var HUD_W           = 320;
  var HUD_H           = 200;

  /* ── Private State ──────────────────────────────────────────────────────── */
  var _scene          = null;
  var _camera         = null;
  var _playerRef      = null;   // object with .position

  var _initialized    = false;
  var _active         = false;   // drone is airborne
  var _phase          = 'idle'; // idle | rising | orbiting | returning | dead
  var _recharging     = false;
  var _rechargeTimer  = 0;

  var _battery        = BATTERY_MAX;
  var _hp             = DRONE_HP;
  var _orbitAngle     = 0;
  var _orbitOriginX   = 0;
  var _orbitOriginZ   = 0;
  var _dronePos       = null;   // THREE.Vector3 — current world pos

  var _scanTimer      = 0;
  var _empTimer       = 0;      // >0 = EMP-jammed, random movement
  var _blinkTimer     = 0;

  /* ── Drone mesh group ───────────────────────────────────────────────────── */
  var _droneGroup     = null;   // THREE.Group
  var _rotors         = [];     // 4 CylinderGeometry meshes
  var _debrisPieces   = [];     // on-death fragments

  /* ── Surveillance lights ────────────────────────────────────────────────── */
  var _tagLights      = [];     // { light, enemy }

  /* ── Laser marker ───────────────────────────────────────────────────────── */
  var _laserLine      = null;   // THREE.Line
  var _laserTarget    = null;   // THREE.Vector3 of painted target
  var _altHeld        = false;

  /* ── HUD / DOM ──────────────────────────────────────────────────────────── */
  var _hudEl          = null;   // "DRONE ▶ 72s" status bar element
  var _camWindow      = null;   // mini drone-cam overlay div
  var _camCanvas      = null;   // canvas inside cam window
  var _camCtx         = null;
  var _camVisible     = false;
  var _enemyDots      = [];     // DOM elements in cam window

  /* ── Key tracking ───────────────────────────────────────────────────────── */
  var _keysRegistered = false;

  /* ═══════════════════════════════════════════════════════════════════════════
     BUILD DRONE MESH
  ══════════════════════════════════════════════════════════════════════════ */
  function _buildDroneMesh() {
    var THREE = window.THREE;
    if (!THREE) { return null; }

    var group = new THREE.Group();
    var darkGrey = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

    /* body */
    var bodyGeo = new THREE.BoxGeometry(0.4, 0.08, 0.4);
    var body    = new THREE.Mesh(bodyGeo, darkGrey);
    group.add(body);

    /* 4 arms at 45 degrees increments */
    var armAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
    var a;
    for (a = 0; a < 4; a++) {
      var armGeo = new THREE.BoxGeometry(0.3, 0.03, 0.05);
      var arm    = new THREE.Mesh(armGeo, darkGrey);
      arm.rotation.y = armAngles[a];
      arm.position.x = Math.cos(armAngles[a]) * 0.2;
      arm.position.z = Math.sin(armAngles[a]) * 0.2;
      group.add(arm);
    }

    /* 4 rotors */
    _rotors = [];
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var rotorPositions = [
      [  0.25, 0.05,  0.25],
      [ -0.25, 0.05,  0.25],
      [  0.25, 0.05, -0.25],
      [ -0.25, 0.05, -0.25]
    ];
    var r;
    for (r = 0; r < 4; r++) {
      var rotorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.015, 8);
      var rotor    = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(rotorPositions[r][0], rotorPositions[r][1], rotorPositions[r][2]);
      group.add(rotor);
      _rotors.push(rotor);
    }

    return group;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BUILD LASER LINE
  ══════════════════════════════════════════════════════════════════════════ */
  function _buildLaserLine() {
    var THREE = window.THREE;
    if (!THREE || !_scene) { return; }
    var pts = [new THREE.Vector3(), new THREE.Vector3()];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    _laserLine = new THREE.Line(geo, mat);
    _laserLine.visible = false;
    _scene.add(_laserLine);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BUILD HUD
  ══════════════════════════════════════════════════════════════════════════ */
  function _buildHUD() {
    if (_hudEl) { return; } /* already built */

    /* Battery status bar */
    _hudEl = document.createElement('div');
    _hudEl.id = 'recon-drone-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'right:12px',
      'background:rgba(0,0,0,0.7)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:12px',
      'padding:4px 10px',
      'border:1px solid #00ff88',
      'border-radius:3px',
      'z-index:500',
      'display:none',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    /* Drone-cam mini window */
    _camWindow = document.createElement('div');
    _camWindow.id = 'recon-drone-cam';
    _camWindow.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'left:12px',
      'width:' + HUD_W + 'px',
      'height:' + HUD_H + 'px',
      'background:#000',
      'border:2px solid #00ff44',
      'border-radius:4px',
      'z-index:500',
      'display:none',
      'overflow:hidden',
      'filter:sepia(1) hue-rotate(80deg) saturate(3) brightness(0.85)'
    ].join(';');

    _camCanvas = document.createElement('canvas');
    _camCanvas.width  = HUD_W;
    _camCanvas.height = HUD_H;
    _camCanvas.style.cssText = 'display:block;width:100%;height:100%';
    _camWindow.appendChild(_camCanvas);
    _camCtx = _camCanvas.getContext('2d');

    /* label */
    var label = document.createElement('div');
    label.style.cssText = [
      'position:absolute',
      'top:4px',
      'left:6px',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:10px',
      'letter-spacing:1px',
      'pointer-events:none'
    ].join(';');
    label.textContent = 'DRONE CAM REC';
    _camWindow.appendChild(label);

    document.body.appendChild(_camWindow);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HUD UPDATES
  ══════════════════════════════════════════════════════════════════════════ */
  function _updateHUD(dt) {
    if (!_hudEl) { return; }

    if (!_active && !_recharging) {
      _hudEl.style.display = 'none';
      return;
    }

    _hudEl.style.display = 'block';

    if (_recharging) {
      var remain = Math.ceil(RECHARGE_TIME - _rechargeTimer);
      _hudEl.textContent = 'DRONE RECHARGING ' + remain + 's';
      _hudEl.style.color = '#888888';
      _hudEl.style.borderColor = '#888888';
      return;
    }

    var secs = Math.ceil(_battery);
    _hudEl.textContent = 'DRONE > ' + secs + 's';

    if (_battery <= BATTERY_WARN) {
      _blinkTimer += dt;
      if (_blinkTimer > 0.4) { _blinkTimer = 0; }
      var vis = _blinkTimer < 0.2;
      _hudEl.style.color  = vis ? '#ff4444' : 'transparent';
      _hudEl.style.borderColor = vis ? '#ff4444' : 'transparent';
    } else {
      _blinkTimer = 0;
      _hudEl.style.color  = '#00ff88';
      _hudEl.style.borderColor = '#00ff88';
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DRONE-CAM RENDER (top-down schematic)
  ══════════════════════════════════════════════════════════════════════════ */
  function _renderDroneCam() {
    if (!_camCtx || !_camVisible || !_dronePos) { return; }

    var ctx = _camCtx;
    ctx.clearRect(0, 0, HUD_W, HUD_H);

    /* background */
    ctx.fillStyle = '#060f06';
    ctx.fillRect(0, 0, HUD_W, HUD_H);

    /* grid lines */
    ctx.strokeStyle = '#0a280a';
    ctx.lineWidth = 1;
    var gx, gy;
    for (gx = 0; gx < HUD_W; gx += 20) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, HUD_H); ctx.stroke();
    }
    for (gy = 0; gy < HUD_H; gy += 20) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(HUD_W, gy); ctx.stroke();
    }

    var cx = HUD_W / 2;
    var cy = HUD_H / 2;
    var scale = 4;

    /* remove old DOM dots */
    var d;
    for (d = 0; d < _enemyDots.length; d++) {
      if (_enemyDots[d].parentNode) { _enemyDots[d].parentNode.removeChild(_enemyDots[d]); }
    }
    _enemyDots = [];

    /* draw enemy markers */
    var enemies = _getEnemies();
    var i;
    for (i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en) { continue; }
      var ep = en.position || en;
      var ex = ep.x !== undefined ? ep.x : 0;
      var ez = ep.z !== undefined ? ep.z : 0;
      var px = (ex - _dronePos.x) * scale + cx;
      var pz = (ez - _dronePos.z) * scale + cy;
      if (px < 0 || px > HUD_W || pz < 0 || pz > HUD_H) { continue; }

      ctx.fillStyle = '#ff2222';
      ctx.beginPath();
      ctx.arc(px, pz, 4, 0, Math.PI * 2);
      ctx.fill();

      if (en._radarRevealed) {
        var dot = document.createElement('div');
        dot.style.cssText = [
          'position:absolute',
          'left:' + (px - 5) + 'px',
          'top:'  + (pz - 5) + 'px',
          'width:10px',
          'height:10px',
          'border-radius:50%',
          'background:#ff0000',
          'border:1px solid #ff8888',
          'pointer-events:none'
        ].join(';');
        _camWindow.appendChild(dot);
        _enemyDots.push(dot);
      }
    }

    /* drone centre crosshair */
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy); ctx.lineTo(cx + 9, cy); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9); ctx.lineTo(cx, cy + 9); ctx.stroke();

    /* scan radius ring */
    ctx.strokeStyle = '#005500';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, SCAN_RADIUS * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SURVEILLANCE SCAN
  ══════════════════════════════════════════════════════════════════════════ */
  function _getEnemies() {
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      return window.Enemies.getAll() || [];
    }
    return window._enemies || window._activeEnemies || [];
  }

  function _doScan() {
    if (!_dronePos) { return; }
    var enemies = _getEnemies();
    var t;

    /* remove old tag lights */
    for (t = _tagLights.length - 1; t >= 0; t--) {
      if (_tagLights[t] && _tagLights[t].light && _scene) {
        _scene.remove(_tagLights[t].light);
      }
      _tagLights.splice(t, 1);
    }

    var i;
    for (i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en) { continue; }
      var ep = en.position || en;
      var dx = _dronePos.x - (ep.x || 0);
      var dz = _dronePos.z - (ep.z || 0);
      var distSq = dx * dx + dz * dz;

      if (distSq <= SCAN_RADIUS * SCAN_RADIUS) {
        en._radarRevealed = true;

        if (_scene && window.THREE) {
          var pl = new window.THREE.PointLight(0xffff00, ENEMY_LIGHT_INT, ENEMY_LIGHT_RNG);
          pl.position.set(ep.x || 0, (ep.y || 0) + 2.5, ep.z || 0);
          _scene.add(pl);
          _tagLights.push({ light: pl, enemy: en });
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     LASER MARKER
  ══════════════════════════════════════════════════════════════════════════ */
  function _updateLaser(altHeld) {
    if (!_laserLine || !_dronePos) {
      if (_laserLine) { _laserLine.visible = false; }
      return;
    }

    if (!altHeld || !_active || _phase !== 'orbiting') {
      _laserLine.visible = false;
      _laserTarget = null;
      return;
    }

    var enemies  = _getEnemies();
    var bestEn   = null;
    var bestDist = Infinity;
    var i;
    for (i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en._radarRevealed) { continue; }
      var ep = en.position || en;
      var dx = _dronePos.x - (ep.x || 0);
      var dz = _dronePos.z - (ep.z || 0);
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) { bestDist = dist; bestEn = en; }
    }

    if (!bestEn) {
      _laserLine.visible = false;
      _laserTarget = null;
      return;
    }

    var THREE = window.THREE;
    if (!THREE) { return; }

    var ep2 = bestEn.position || bestEn;
    _laserTarget = new THREE.Vector3(ep2.x || 0, ep2.y || 0, ep2.z || 0);

    var positions = _laserLine.geometry.attributes.position;
    if (positions) {
      positions.setXYZ(0, _dronePos.x, _dronePos.y, _dronePos.z);
      positions.setXYZ(1, _laserTarget.x, _laserTarget.y, _laserTarget.z);
      positions.needsUpdate = true;
    } else {
      var pts = [_dronePos.clone(), _laserTarget.clone()];
      _laserLine.geometry.setFromPoints(pts);
    }
    _laserLine.visible = true;

    window._reconDroneLaserTarget = _laserTarget;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     EXPLOSION / DEATH
  ══════════════════════════════════════════════════════════════════════════ */
  function _explodeDrone() {
    if (!_dronePos || !_scene || !window.THREE) { return; }
    var THREE = window.THREE;

    var flash = new THREE.PointLight(0xff6600, 8, 12);
    flash.position.copy(_dronePos);
    _scene.add(flash);
    setTimeout(function () { if (_scene) { _scene.remove(flash); } }, 400);

    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var p;
    for (p = 0; p < 6; p++) {
      var geo  = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      var mesh = new THREE.Mesh(geo, debrisMat);
      mesh.position.copy(_dronePos);
      var vel = {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 3 + 1,
        z: (Math.random() - 0.5) * 4
      };
      _scene.add(mesh);
      _debrisPieces.push({ mesh: mesh, vel: vel, age: 0, maxAge: 2 });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     REMOVE DRONE FROM SCENE
  ══════════════════════════════════════════════════════════════════════════ */
  function _removeDroneMesh() {
    if (_droneGroup && _scene) {
      _scene.remove(_droneGroup);
      _droneGroup = null;
    }
    _rotors = [];
    var t;
    for (t = 0; t < _tagLights.length; t++) {
      if (_tagLights[t] && _tagLights[t].light && _scene) {
        _scene.remove(_tagLights[t].light);
      }
    }
    _tagLights = [];
    if (_laserLine) { _laserLine.visible = false; }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SPAWN DRONE AT PLAYER POSITION
  ══════════════════════════════════════════════════════════════════════════ */
  function _spawnDrone() {
    if (!_scene || !window.THREE) { return; }
    var THREE = window.THREE;

    _droneGroup = _buildDroneMesh();
    if (!_droneGroup) { return; }

    var startPos = _getPlayerPos();
    _droneGroup.position.copy(startPos);
    _scene.add(_droneGroup);

    _dronePos = startPos.clone ? startPos.clone() : new THREE.Vector3(startPos.x, startPos.y, startPos.z);
    _orbitOriginX = startPos.x;
    _orbitOriginZ = startPos.z;
    _orbitAngle   = 0;
    _hp           = DRONE_HP;
    _phase        = 'rising';
    _active       = true;
    _battery      = BATTERY_MAX;
    _scanTimer    = 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PLAYER POSITION HELPER
  ══════════════════════════════════════════════════════════════════════════ */
  function _getPlayerPos() {
    var THREE = window.THREE;
    if (!THREE) { return { x: 0, y: 0, z: 0 }; }

    if (_playerRef && _playerRef.position) { return _playerRef.position.clone(); }
    if (window._playerPosition) {
      var pp = window._playerPosition;
      return new THREE.Vector3(pp.x || 0, pp.y || 0, pp.z || 0);
    }
    if (window.player && window.player.position) { return window.player.position.clone(); }
    if (_camera) { return _camera.position.clone(); }
    return new THREE.Vector3(0, 0, 0);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DAMAGE CHECK — enemy shots near drone
  ══════════════════════════════════════════════════════════════════════════ */
  function _checkDamage() {
    if (!_dronePos || !_active) { return; }
    var shotPos = window._lastEnemyShotPos || window._lastBulletPos;
    if (!shotPos) { return; }
    var dx = _dronePos.x - (shotPos.x || 0);
    var dy = _dronePos.y - (shotPos.y || 0);
    var dz = _dronePos.z - (shotPos.z || 0);
    if (dx * dx + dy * dy + dz * dz < 9) {
      _hp -= DMG_PER_HIT;
      if (_hp <= 0) { _killDrone(); }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     KILL DRONE
  ══════════════════════════════════════════════════════════════════════════ */
  function _killDrone() {
    _explodeDrone();
    _removeDroneMesh();
    _active     = false;
    _phase      = 'dead';
    _camVisible = false;
    if (_camWindow) { _camWindow.style.display = 'none'; }
    _recharging    = true;
    _rechargeTimer = 0;
    if (_hudEl) { _hudEl.style.display = 'block'; }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     KEY HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */
  function _onKeyDown(e) {
    if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      if (!_active && !_recharging) {
        launch();
      } else if (_active) {
        _camVisible = !_camVisible;
        if (_camWindow) {
          _camWindow.style.display = _camVisible ? 'block' : 'none';
        }
      }
      return;
    }
    if (e.key === 'Alt') {
      e.preventDefault();
      _altHeld = true;
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Alt') { _altHeld = false; }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC: INIT
  ══════════════════════════════════════════════════════════════════════════ */
  function init(scene, camera, playerRef) {
    _scene     = scene     || _scene;
    _camera    = camera    || _camera;
    _playerRef = playerRef || _playerRef;

    if (_initialized) { return; }
    _initialized = true;

    _buildHUD();

    if (_scene) { _buildLaserLine(); }

    if (!_keysRegistered) {
      _keysRegistered = true;
      document.addEventListener('keydown', _onKeyDown);
      document.addEventListener('keyup',   _onKeyUp);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC: LAUNCH
  ══════════════════════════════════════════════════════════════════════════ */
  function launch() {
    if (_active || _recharging) { return; }
    if (!_scene || !window.THREE) {
      console.warn('[ReconDrone] Scene not ready — call init(scene, camera) first.');
      return;
    }
    _spawnDrone();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC: RECALL
  ══════════════════════════════════════════════════════════════════════════ */
  function recall() {
    if (!_active) { return; }
    _phase = 'returning';
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC: RESET
  ══════════════════════════════════════════════════════════════════════════ */
  function reset() {
    _removeDroneMesh();
    var d;
    for (d = 0; d < _debrisPieces.length; d++) {
      if (_debrisPieces[d].mesh && _scene) { _scene.remove(_debrisPieces[d].mesh); }
    }
    _debrisPieces  = [];
    _active        = false;
    _phase         = 'idle';
    _recharging    = false;
    _rechargeTimer = 0;
    _battery       = BATTERY_MAX;
    _hp            = DRONE_HP;
    _orbitAngle    = 0;
    _scanTimer     = 0;
    _empTimer      = 0;
    _blinkTimer    = 0;
    _camVisible    = false;
    _altHeld       = false;
    _laserTarget   = null;
    _tagLights     = [];
    _enemyDots     = [];
    if (_camWindow) { _camWindow.style.display = 'none'; }
    if (_hudEl)     { _hudEl.style.display = 'none'; }
    if (_laserLine) { _laserLine.visible = false; }
    window._reconDroneLaserTarget = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC: UPDATE  (dt = seconds)
  ══════════════════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (!dt || dt <= 0) { dt = 0.016; }

    /* ── Recharge phase ─────────────────────────────────────────────── */
    if (_recharging) {
      _rechargeTimer += dt;
      _updateHUD(dt);
      if (_rechargeTimer >= RECHARGE_TIME) {
        _recharging    = false;
        _rechargeTimer = 0;
        _phase         = 'idle';
        if (_hudEl) { _hudEl.style.display = 'none'; }
      }
      return;
    }

    if (!_active) { return; }

    var THREE = window.THREE;
    if (!THREE) { return; }

    /* ── EMP jamming ────────────────────────────────────────────────── */
    if (window._empActive === true && _empTimer <= 0) {
      _empTimer = EMP_LOSE_CTRL;
    }
    if (_empTimer > 0) {
      _empTimer -= dt;
      if (_empTimer < 0) { _empTimer = 0; }
    }

    /* ── Battery drain ──────────────────────────────────────────────── */
    if (_phase === 'orbiting') {
      _battery -= dt;
      if (_battery <= 0) {
        _battery = 0;
        _phase   = 'returning';
      }
    }

    /* ── Phase: rising ──────────────────────────────────────────────── */
    if (_phase === 'rising') {
      var pp = _getPlayerPos();
      var targetY = pp.y + HOVER_Y;
      if (_droneGroup) {
        _droneGroup.position.y += 4 * dt;
        if (_droneGroup.position.y >= targetY) {
          _droneGroup.position.y = targetY;
          _orbitOriginX = pp.x;
          _orbitOriginZ = pp.z;
          _phase = 'orbiting';
        }
        _dronePos.copy(_droneGroup.position);
      }
    }

    /* ── Phase: orbiting ────────────────────────────────────────────── */
    if (_phase === 'orbiting') {
      if (_empTimer > 0) {
        if (_droneGroup) {
          _droneGroup.position.x += (Math.random() - 0.5) * 3 * dt;
          _droneGroup.position.y += (Math.random() - 0.5) * 2 * dt;
          _droneGroup.position.z += (Math.random() - 0.5) * 3 * dt;
          _dronePos.copy(_droneGroup.position);
        }
      } else {
        _orbitAngle += ORBIT_SPEED * dt;
        var pp2 = _getPlayerPos();
        _orbitOriginX += (pp2.x - _orbitOriginX) * 0.02;
        _orbitOriginZ += (pp2.z - _orbitOriginZ) * 0.02;

        var tx = _orbitOriginX + Math.cos(_orbitAngle) * ORBIT_RADIUS;
        var tz = _orbitOriginZ + Math.sin(_orbitAngle) * ORBIT_RADIUS;
        var ty = pp2.y + HOVER_Y + Math.sin(_orbitAngle * 2.3) * ALT_VARIATION;

        if (_droneGroup) {
          _droneGroup.position.x = tx;
          _droneGroup.position.y = ty;
          _droneGroup.position.z = tz;
          _dronePos.copy(_droneGroup.position);
          _droneGroup.rotation.y = _orbitAngle + Math.PI * 0.5;
        }
      }

      _scanTimer += dt;
      if (_scanTimer >= SCAN_INTERVAL) {
        _scanTimer = 0;
        _doScan();
      }
    }

    /* ── Phase: returning ───────────────────────────────────────────── */
    if (_phase === 'returning') {
      var pp3 = _getPlayerPos();
      if (_droneGroup) {
        var rdx = pp3.x - _droneGroup.position.x;
        var rdy = pp3.y - _droneGroup.position.y;
        var rdz = pp3.z - _droneGroup.position.z;
        var spd = 5 * dt;
        _droneGroup.position.x += rdx * spd;
        _droneGroup.position.y += rdy * spd;
        _droneGroup.position.z += rdz * spd;
        _dronePos.copy(_droneGroup.position);
        var distToPlayer = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
        if (distToPlayer < 0.5) {
          _removeDroneMesh();
          _active     = false;
          _phase      = 'idle';
          _recharging = true;
          _rechargeTimer = 0;
          _camVisible = false;
          if (_camWindow) { _camWindow.style.display = 'none'; }
          /* clear enemy radar tags */
          var ens = _getEnemies();
          var ei;
          for (ei = 0; ei < ens.length; ei++) {
            if (ens[ei]) { ens[ei]._radarRevealed = false; }
          }
        }
      }
    }

    /* ── Spin rotors ────────────────────────────────────────────────── */
    var ri;
    for (ri = 0; ri < _rotors.length; ri++) {
      _rotors[ri].rotation.y += ROTOR_SPEED * dt;
    }

    /* ── Debris physics ─────────────────────────────────────────────── */
    var di;
    for (di = _debrisPieces.length - 1; di >= 0; di--) {
      var piece = _debrisPieces[di];
      piece.age += dt;
      piece.vel.y -= 9.8 * dt;
      piece.mesh.position.x += piece.vel.x * dt;
      piece.mesh.position.y += piece.vel.y * dt;
      piece.mesh.position.z += piece.vel.z * dt;
      if (piece.age >= piece.maxAge) {
        if (_scene) { _scene.remove(piece.mesh); }
        _debrisPieces.splice(di, 1);
      }
    }

    /* ── Damage check ───────────────────────────────────────────────── */
    _checkDamage();

    /* ── Laser marker ───────────────────────────────────────────────── */
    _updateLaser(_altHeld);

    /* ── Drone-cam render ───────────────────────────────────────────── */
    if (_camVisible) { _renderDroneCam(); }

    /* ── HUD update ─────────────────────────────────────────────────── */
    _updateHUD(dt);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     AUTO DOM SETUP — keys registered early, scene picked up lazily
  ══════════════════════════════════════════════════════════════════════════ */
  (function _autoSetup() {
    if (typeof document === 'undefined') { return; }
    document.addEventListener('DOMContentLoaded', function () {
      _buildHUD();
      if (!_keysRegistered) {
        _keysRegistered = true;
        document.addEventListener('keydown', _onKeyDown);
        document.addEventListener('keyup',   _onKeyUp);
      }
      /* lazy scene acquisition */
      var _checkId = setInterval(function () {
        var scene  = window._scene  || (window.GameManager && window.GameManager.scene);
        var cam    = window._camera || (window.GameManager && window.GameManager.camera);
        if (scene && cam) {
          clearInterval(_checkId);
          if (!_initialized) {
            _scene       = scene;
            _camera      = cam;
            _initialized = true;
            _buildLaserLine();
          }
        }
      }, 500);
    });
  }());

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */
  return {
    init:   init,
    update: update,
    launch: launch,
    recall: recall,
    reset:  reset
  };

}());
