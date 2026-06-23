/* ───────────────────────────────────────────────────────────────────────────
   fire-support.js — Fire Support Coordination: Artillery, CAS, Gunship, Naval
   F+S keys   → open fire support request panel
   Left-click → place target marker (while panel open)
   4 mission types: ARTY, CAS, GUNSHIP, NAVAL
   API: window.FireSupport = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.FireSupport = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var DANGER_CLOSE_RADIUS = 25;    // units — block if target within this range
  var ARTY_COOLDOWN       = 120;   // seconds
  var CAS_COOLDOWN        = 90;
  var GUNSHIP_COOLDOWN    = 180;
  var NAVAL_COOLDOWN      = 150;

  var ARTY_ROUNDS         = 6;
  var ARTY_SPREAD         = 50;    // metres spread across target
  var ARTY_INTERVAL       = 0.5;   // seconds between rounds
  var ARTY_DEBRIS_COUNT   = 8;

  var CAS_JET_Y           = 30;
  var CAS_CANNON_BURSTS   = 3;
  var CAS_BOMB_IMPACTS    = 2;

  var GUNSHIP_ORBIT_RADIUS = 40;
  var GUNSHIP_DURATION     = 30;   // seconds
  var GUNSHIP_IMPACT_COUNT = 4;

  var NAVAL_BLAST_RADIUS   = 8;
  var NAVAL_DEBRIS_COUNT   = 12;
  var NAVAL_SHAKE_MAG      = 0.3;

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;
  var _player   = null;   // optional player object with .position

  var _panelOpen      = false;
  var _fKeyDown       = false;
  var _sKeyDown       = false;
  var _selectedType   = null;   // 'ARTY' | 'CAS' | 'GUNSHIP' | 'NAVAL'

  var _targetMarker   = null;   // red cone mesh
  var _targetPos      = null;   // THREE.Vector3

  var _raycaster      = null;
  var _groundPlane    = null;   // THREE.Plane for raycast fallback

  /* cooldown tracking — seconds remaining */
  var _cooldowns = { ARTY: 0, CAS: 0, GUNSHIP: 0, NAVAL: 0 };
  var _cooldownMax = { ARTY: ARTY_COOLDOWN, CAS: CAS_COOLDOWN, GUNSHIP: GUNSHIP_COOLDOWN, NAVAL: NAVAL_COOLDOWN };

  /* active effects list: {type, life, maxLife, data} */
  var _effects = [];

  /* debris list: {mesh, vx, vy, vz, life} */
  var _debris = [];

  /* naval screen shake */
  var _shakeTimer    = 0;
  var _shakeDuration = 0.6;
  var _camBasePos    = null;

  /* gunship orbit */
  var _gunshipMesh   = null;
  var _gunshipAngle  = 0;
  var _gunshipTimer  = 0;
  var _gunshipTarget = null;
  var _gunshipNextImpact = 0;
  var _gunshipImpactIdx  = 0;

  /* CAS jet */
  var _casJetMesh    = null;
  var _casJetTimer   = 0;
  var _casJetStart   = null;
  var _casJetEnd     = null;
  var _casJetDir     = null;
  var _casJetSpeed   = 60;
  var _casCannonFired = 0;
  var _casBombDropped = 0;
  var _casTarget     = null;
  var _casNextCannon = 0;
  var _casNextBomb   = 0;
  var _casTracers    = [];   /* LineSegments meshes */
  var _casActive     = false;

  /* arty barrage */
  var _artyRoundsLeft  = 0;
  var _artyNextRound   = 0;
  var _artyTarget      = null;
  var _artyFlashes     = [];   /* {mesh, life} */

  /* HUD */
  var _hudEl    = null;
  var _panelEl  = null;

  /* ── helpers ───────────────────────────────────────────────────────────── */
  function _rng(min, max) {
    return min + Math.random() * (max - min);
  }

  function _pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function _fmtCooldown(secs) {
    var s = Math.ceil(secs);
    var m = Math.floor(s / 60);
    s = s % 60;
    return _pad2(m) + ':' + _pad2(s);
  }

  function _removeFromScene(mesh) {
    if (mesh && _scene) {
      _scene.remove(mesh);
      if (mesh.geometry) { mesh.geometry.dispose(); }
      if (mesh.material) { mesh.material.dispose(); }
    }
  }

  function _makeMaterial(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.transparent !== undefined) { params.transparent = opts.transparent; }
      if (opts.opacity !== undefined) { params.opacity = opts.opacity; }
      if (opts.emissive !== undefined) { params.emissive = opts.emissive; }
      if (opts.emissiveIntensity !== undefined) { params.emissiveIntensity = opts.emissiveIntensity; }
    }
    return new THREE.MeshStandardMaterial(params);
  }

  function _spawnDebris(pos, count, spread, speed) {
    var i;
    for (i = 0; i < count; i++) {
      var geo  = new THREE.BoxGeometry(_rng(0.2, 0.6), _rng(0.2, 0.6), _rng(0.2, 0.6));
      var mat  = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      _scene.add(mesh);
      _debris.push({
        mesh : mesh,
        vx   : _rng(-spread, spread),
        vy   : _rng(speed * 0.5, speed),
        vz   : _rng(-spread, spread),
        life : _rng(1.5, 3.0)
      });
    }
  }

  function _spawnExplosionFlash(pos) {
    var geo  = new THREE.SphereGeometry(_rng(1.5, 3.0), 8, 8);
    var mat  = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 2,
      transparent: true, opacity: 0.9
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _artyFlashes.push({ mesh: mesh, life: 0.35 });
  }

  function _spawnCrater(pos) {
    var geo  = new THREE.CylinderGeometry(2.5, 1.5, 0.4, 12);
    var mat  = new THREE.MeshStandardMaterial({ color: 0x2c1a0a });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.01, pos.z);
    _scene.add(mesh);
    /* craters stay permanently — push to effects with huge life */
    _effects.push({ type: 'static', life: 9999, maxLife: 9999, data: { mesh: mesh } });
  }

  /* ── target marker ─────────────────────────────────────────────────────── */
  function _placeTargetMarker(worldPos) {
    if (_targetMarker) {
      _scene.remove(_targetMarker);
      _targetMarker.geometry.dispose();
      _targetMarker.material.dispose();
      _targetMarker = null;
    }
    var geo  = new THREE.ConeGeometry(0.8, 3, 8);
    var mat  = new THREE.MeshStandardMaterial({
      color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6
    });
    var mesh = new THREE.Mesh(geo, mat);
    /* cone tip points up, rotate so it points down into ground */
    mesh.rotation.x = Math.PI;
    mesh.position.set(worldPos.x, worldPos.y + 1.5, worldPos.z);
    _scene.add(mesh);
    _targetMarker = mesh;
    _targetPos    = worldPos.clone();
  }

  /* ── raycast against ground plane ──────────────────────────────────────── */
  function _raycastGround(event) {
    if (!_camera || !_canvas) { return null; }
    var rect = _canvas.getBoundingClientRect();
    var nx   = ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    var ny   = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
    _raycaster.setFromCamera({ x: nx, y: ny }, _camera);
    var target = new THREE.Vector3();
    var hit    = _raycaster.ray.intersectPlane(_groundPlane, target);
    return hit ? target : null;
  }

  /* ── danger-close check ────────────────────────────────────────────────── */
  function _isDangerClose(pos) {
    if (!_player || !_player.position) { return false; }
    var dx = pos.x - _player.position.x;
    var dz = pos.z - _player.position.z;
    return Math.sqrt(dx * dx + dz * dz) < DANGER_CLOSE_RADIUS;
  }

  /* ── HUD creation ──────────────────────────────────────────────────────── */
  function _buildHUD() {
    /* bottom status bar */
    _hudEl = document.createElement('div');
    _hudEl.id = 'fs-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'gap:12px',
      'z-index:900',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    /* request panel */
    _panelEl = document.createElement('div');
    _panelEl.id = 'fs-panel';
    _panelEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'border:2px solid #ff6600',
      'color:#fff',
      'font-family:monospace',
      'font-size:14px',
      'padding:20px',
      'z-index:1000',
      'display:none',
      'min-width:340px'
    ].join(';');
    _panelEl.innerHTML = [
      '<div style="color:#ff6600;font-size:18px;margin-bottom:12px">&#9654; FIRE SUPPORT REQUEST</div>',
      '<div id="fs-type-btns" style="display:flex;gap:8px;margin-bottom:14px">',
      '  <button data-type="ARTY"    style="' + _btnStyle() + '">ARTY</button>',
      '  <button data-type="CAS"     style="' + _btnStyle() + '">CAS</button>',
      '  <button data-type="GUNSHIP" style="' + _btnStyle() + '">GUNSHIP</button>',
      '  <button data-type="NAVAL"   style="' + _btnStyle() + '">NAVAL</button>',
      '</div>',
      '<div id="fs-status-msg" style="margin-bottom:10px;color:#aaa">Select mission type, then click map to designate target.</div>',
      '<div style="display:flex;gap:8px">',
      '  <button id="fs-confirm-btn" style="' + _btnStyle('green') + '">FIRE MISSION</button>',
      '  <button id="fs-cancel-btn"  style="' + _btnStyle('red')   + '">CANCEL</button>',
      '</div>'
    ].join('\n');
    document.body.appendChild(_panelEl);

    /* wire panel buttons */
    var typeBtns = _panelEl.querySelectorAll('[data-type]');
    var i;
    for (i = 0; i < typeBtns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          _selectedType = btn.getAttribute('data-type');
          _highlightTypeBtn();
          _updateStatusMsg('Left-click on the battlefield to mark target.');
        });
      }(typeBtns[i]));
    }

    _panelEl.querySelector('#fs-confirm-btn').addEventListener('click', _onConfirmFire);
    _panelEl.querySelector('#fs-cancel-btn').addEventListener('click', _closePanel);

    _updateHUD();
  }

  function _btnStyle(color) {
    var bg = color === 'green' ? '#1a5c1a' : color === 'red' ? '#5c1a1a' : '#1a2a3a';
    return [
      'background:' + bg,
      'color:#fff',
      'border:1px solid #666',
      'padding:6px 14px',
      'cursor:pointer',
      'font-family:monospace',
      'font-size:13px'
    ].join(';');
  }

  function _highlightTypeBtn() {
    if (!_panelEl) { return; }
    var btns = _panelEl.querySelectorAll('[data-type]');
    var i;
    for (i = 0; i < btns.length; i++) {
      btns[i].style.borderColor = btns[i].getAttribute('data-type') === _selectedType ? '#ff6600' : '#666';
    }
  }

  function _updateStatusMsg(msg) {
    var el = document.getElementById('fs-status-msg');
    if (el) { el.textContent = msg; }
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    _hudEl.innerHTML = '';
    var types = ['ARTY', 'CAS', 'GUNSHIP', 'NAVAL'];
    var i;
    for (i = 0; i < types.length; i++) {
      var t   = types[i];
      var cd  = _cooldowns[t];
      var rdy = cd <= 0;
      var card = document.createElement('div');
      card.style.cssText = [
        'background:rgba(0,0,0,0.7)',
        'border:1px solid ' + (rdy ? '#00cc44' : '#cc4400'),
        'color:#fff',
        'font-family:monospace',
        'font-size:12px',
        'padding:6px 10px',
        'text-align:center',
        'min-width:80px'
      ].join(';');
      card.innerHTML = '<div style="color:#ff9900;font-weight:bold">' + t + '</div>' +
        '<div style="color:' + (rdy ? '#00cc44' : '#ff4400') + '">' +
        (rdy ? 'READY' : 'COOLDOWN ' + _fmtCooldown(cd)) + '</div>';
      _hudEl.appendChild(card);
    }
  }

  /* ── panel open / close ────────────────────────────────────────────────── */
  function _openPanel() {
    if (_panelOpen) { return; }
    _panelOpen    = true;
    _selectedType = null;
    _panelEl.style.display = 'block';
    _updateStatusMsg('Select mission type, then click map to designate target.');
    _highlightTypeBtn();
  }

  function _closePanel() {
    _panelOpen    = false;
    _selectedType = null;
    if (_panelEl) { _panelEl.style.display = 'none'; }
    /* remove unused target marker */
    if (_targetMarker) {
      _scene.remove(_targetMarker);
      _targetMarker.geometry.dispose();
      _targetMarker.material.dispose();
      _targetMarker = null;
    }
    _targetPos = null;
  }

  /* ── confirm fire ──────────────────────────────────────────────────────── */
  function _onConfirmFire() {
    if (!_selectedType) {
      _updateStatusMsg('ERROR: No mission type selected.');
      return;
    }
    if (!_targetPos) {
      _updateStatusMsg('ERROR: No target designated. Click map to mark target.');
      return;
    }
    if (_cooldowns[_selectedType] > 0) {
      _updateStatusMsg('COOLDOWN — ' + _selectedType + ' not available for ' + _fmtCooldown(_cooldowns[_selectedType]));
      return;
    }
    if (_isDangerClose(_targetPos)) {
      var wilco = window.prompt('DANGER CLOSE! Target within ' + DANGER_CLOSE_RADIUS + ' m of your position.\nType WILCO to confirm:');
      if (!wilco || wilco.trim().toUpperCase() !== 'WILCO') {
        _updateStatusMsg('ABORT — Danger close protection active.');
        return;
      }
    }
    _executeMission(_selectedType, _targetPos.clone());
    _cooldowns[_selectedType] = _cooldownMax[_selectedType];
    _closePanel();
  }

  /* ── execute missions ──────────────────────────────────────────────────── */
  function _executeMission(type, pos) {
    if (type === 'ARTY')    { _startArty(pos); }
    if (type === 'CAS')     { _startCAS(pos); }
    if (type === 'GUNSHIP') { _startGunship(pos); }
    if (type === 'NAVAL')   { _startNaval(pos); }
  }

  /* ── ARTY ──────────────────────────────────────────────────────────────── */
  function _startArty(pos) {
    _artyRoundsLeft  = ARTY_ROUNDS;
    _artyNextRound   = 0.8;   /* 0.8s initial delay */
    _artyTarget      = pos;
  }

  function _fireArtyRound() {
    if (!_artyTarget || !_scene) { return; }
    var spread = ARTY_SPREAD * 0.5;
    var ox = _rng(-spread, spread);
    var oz = _rng(-spread, spread);
    var pos = new THREE.Vector3(_artyTarget.x + ox, _artyTarget.y, _artyTarget.z + oz);
    _spawnExplosionFlash(pos);
    _spawnDebris(pos, ARTY_DEBRIS_COUNT, 4, 8);
    _spawnCrater(pos);
  }

  /* ── CAS ───────────────────────────────────────────────────────────────── */
  function _startCAS(pos) {
    if (!_scene) { return; }
    _casTarget     = pos;
    _casActive     = true;
    _casCannonFired = 0;
    _casBombDropped = 0;
    _casNextCannon  = 1.0;
    _casNextBomb    = 2.5;
    _casJetTimer    = 0;

    /* build jet — BoxGeometry 3×0.5×2, color 0x888888 */
    var geo  = new THREE.BoxGeometry(3, 0.5, 2);
    var mat  = new THREE.MeshStandardMaterial({ color: 0x888888 });
    _casJetMesh = new THREE.Mesh(geo, mat);

    /* jet approaches from a random horizontal direction at Y=30 */
    var angle  = _rng(0, Math.PI * 2);
    var dist   = 120;
    _casJetStart = new THREE.Vector3(
      pos.x + Math.cos(angle) * dist,
      CAS_JET_Y,
      pos.z + Math.sin(angle) * dist
    );
    _casJetEnd = new THREE.Vector3(
      pos.x - Math.cos(angle) * dist,
      CAS_JET_Y,
      pos.z - Math.sin(angle) * dist
    );
    _casJetDir = new THREE.Vector3().subVectors(_casJetEnd, _casJetStart).normalize();
    _casJetMesh.position.copy(_casJetStart);
    /* orient jet along flight direction */
    _casJetMesh.lookAt(_casJetEnd);
    _scene.add(_casJetMesh);
  }

  function _fireCASCannon() {
    if (!_casJetMesh || !_casTarget || !_scene) { return; }
    /* fire tracer burst: 5 LineSegments per burst */
    var j;
    for (j = 0; j < 5; j++) {
      var origin = _casJetMesh.position.clone();
      var spread = 0.5;
      var target = new THREE.Vector3(
        _casTarget.x + _rng(-spread, spread),
        _casTarget.y,
        _casTarget.z + _rng(-spread, spread)
      );
      var points = [origin, target];
      var geo  = new THREE.BufferGeometry().setFromPoints(points);
      var mat  = new THREE.LineBasicMaterial({ color: 0xffcc00 });
      var line = new THREE.LineSegments(geo, mat);
      _scene.add(line);
      _casTracers.push({ mesh: line, life: 0.15 });
    }
  }

  function _dropCASBomb() {
    if (!_casJetMesh || !_casTarget || !_scene) { return; }
    var bpos = _casJetMesh.position.clone();
    bpos.y = _casTarget.y;
    _spawnExplosionFlash(bpos);
    _spawnDebris(bpos, 6, 5, 10);
    _spawnCrater(bpos);
  }

  function _cleanupCASJet() {
    if (_casJetMesh) {
      _removeFromScene(_casJetMesh);
      _casJetMesh = null;
    }
    _casActive = false;
  }

  /* ── GUNSHIP ───────────────────────────────────────────────────────────── */
  function _startGunship(pos) {
    if (!_scene) { return; }
    _gunshipTarget    = pos;
    _gunshipAngle     = 0;
    _gunshipTimer     = 0;
    _gunshipNextImpact = GUNSHIP_DURATION / GUNSHIP_IMPACT_COUNT;
    _gunshipImpactIdx  = 0;

    var geo  = new THREE.BoxGeometry(6, 1, 2.5);
    var mat  = new THREE.MeshStandardMaterial({ color: 0x555566 });
    _gunshipMesh = new THREE.Mesh(geo, mat);
    _scene.add(_gunshipMesh);
  }

  function _updateGunship(delta) {
    if (!_gunshipMesh || !_gunshipTarget) { return; }
    _gunshipTimer += delta;
    if (_gunshipTimer >= GUNSHIP_DURATION) {
      _removeFromScene(_gunshipMesh);
      _gunshipMesh   = null;
      _gunshipTarget = null;
      return;
    }
    /* slow orbit */
    var orbitSpeed = (Math.PI * 2) / 20;   /* full circle in 20s */
    _gunshipAngle += orbitSpeed * delta;
    _gunshipMesh.position.set(
      _gunshipTarget.x + Math.cos(_gunshipAngle) * GUNSHIP_ORBIT_RADIUS,
      _gunshipTarget.y + 25,
      _gunshipTarget.z + Math.sin(_gunshipAngle) * GUNSHIP_ORBIT_RADIUS
    );
    _gunshipMesh.rotation.y = -_gunshipAngle + Math.PI * 0.5;

    /* spiral impacts */
    if (_gunshipImpactIdx < GUNSHIP_IMPACT_COUNT) {
      _gunshipNextImpact -= delta;
      if (_gunshipNextImpact <= 0) {
        _gunshipNextImpact = GUNSHIP_DURATION / GUNSHIP_IMPACT_COUNT;
        var spiralR = (_gunshipImpactIdx + 1) * 4;
        var spiralA = _gunshipImpactIdx * (Math.PI * 0.5);
        var ipos = new THREE.Vector3(
          _gunshipTarget.x + Math.cos(spiralA) * spiralR,
          _gunshipTarget.y,
          _gunshipTarget.z + Math.sin(spiralA) * spiralR
        );
        _spawnExplosionFlash(ipos);
        _spawnDebris(ipos, 5, 3, 7);
        _gunshipImpactIdx++;
      }
    }
  }

  /* ── NAVAL ─────────────────────────────────────────────────────────────── */
  function _startNaval(pos) {
    if (!_scene) { return; }
    /* massive explosion */
    var geo  = new THREE.SphereGeometry(NAVAL_BLAST_RADIUS, 12, 12);
    var mat  = new THREE.MeshStandardMaterial({
      color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 3,
      transparent: true, opacity: 0.95
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _artyFlashes.push({ mesh: mesh, life: 0.8 });
    _spawnDebris(pos, NAVAL_DEBRIS_COUNT, 8, 14);
    _spawnCrater(pos);

    /* screen shake — save camera base position */
    if (_camera) {
      _camBasePos   = _camera.position.clone();
      _shakeTimer   = _shakeDuration;
    }
  }

  /* ── keyboard / mouse handlers ─────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.key === 'f' || e.key === 'F') { _fKeyDown = true; }
    if (e.key === 's' || e.key === 'S') { _sKeyDown = true; }
    if (_fKeyDown && _sKeyDown) {
      if (_panelOpen) { _closePanel(); } else { _openPanel(); }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'f' || e.key === 'F') { _fKeyDown = false; }
    if (e.key === 's' || e.key === 'S') { _sKeyDown = false; }
  }

  function _onMouseDown(e) {
    if (!_panelOpen) { return; }
    if (e.button !== 0) { return; }
    /* ignore clicks on panel UI itself */
    if (_panelEl && _panelEl.contains(e.target)) { return; }
    var hit = _raycastGround(e);
    if (hit) {
      _placeTargetMarker(hit);
      _updateStatusMsg('Target marked at (' +
        hit.x.toFixed(1) + ', ' +
        hit.z.toFixed(1) + '). Select type and confirm.');
    }
  }

  /* ── public init ───────────────────────────────────────────────────────── */
  function init(scene, camera, canvas, player) {
    _scene    = scene;
    _camera   = camera;
    _canvas   = canvas || document.querySelector('canvas');
    _player   = player || null;

    _raycaster   = new THREE.Raycaster();
    _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    document.addEventListener('keydown',   _onKeyDown);
    document.addEventListener('keyup',     _onKeyUp);
    document.addEventListener('mousedown', _onMouseDown);

    _buildHUD();
  }

  /* ── public update ─────────────────────────────────────────────────────── */
  function update(delta) {
    if (!_scene) { return; }

    /* cooldowns */
    var types = ['ARTY', 'CAS', 'GUNSHIP', 'NAVAL'];
    var i;
    var changed = false;
    for (i = 0; i < types.length; i++) {
      if (_cooldowns[types[i]] > 0) {
        _cooldowns[types[i]] -= delta;
        if (_cooldowns[types[i]] < 0) { _cooldowns[types[i]] = 0; }
        changed = true;
      }
    }
    if (changed || _panelOpen) { _updateHUD(); }

    /* arty rounds */
    if (_artyRoundsLeft > 0) {
      _artyNextRound -= delta;
      if (_artyNextRound <= 0) {
        _fireArtyRound();
        _artyRoundsLeft--;
        _artyNextRound = ARTY_INTERVAL;
      }
    }

    /* CAS jet */
    if (_casActive && _casJetMesh) {
      _casJetTimer += delta;
      var traveled = _casJetSpeed * delta;
      _casJetMesh.position.addScaledVector(_casJetDir, traveled);

      /* cannon bursts */
      if (_casCannonFired < CAS_CANNON_BURSTS) {
        _casNextCannon -= delta;
        if (_casNextCannon <= 0) {
          _fireCASCannon();
          _casCannonFired++;
          _casNextCannon = 0.8;
        }
      }
      /* bomb drops */
      if (_casBombDropped < CAS_BOMB_IMPACTS) {
        _casNextBomb -= delta;
        if (_casNextBomb <= 0) {
          _dropCASBomb();
          _casBombDropped++;
          _casNextBomb = 1.0;
        }
      }
      /* jet exits after 8 seconds */
      if (_casJetTimer > 8) {
        _cleanupCASJet();
      }
    }

    /* gunship */
    if (_gunshipMesh) {
      _updateGunship(delta);
    }

    /* screen shake */
    if (_shakeTimer > 0) {
      _shakeTimer -= delta;
      if (_camera && _camBasePos) {
        if (_shakeTimer > 0) {
          _camera.position.set(
            _camBasePos.x + _rng(-NAVAL_SHAKE_MAG, NAVAL_SHAKE_MAG),
            _camBasePos.y + _rng(-NAVAL_SHAKE_MAG, NAVAL_SHAKE_MAG),
            _camBasePos.z + _rng(-NAVAL_SHAKE_MAG, NAVAL_SHAKE_MAG)
          );
        } else {
          _camera.position.copy(_camBasePos);
          _camBasePos = null;
        }
      }
    }

    /* update explosion flashes */
    var nextFlashes = [];
    for (i = 0; i < _artyFlashes.length; i++) {
      var f = _artyFlashes[i];
      f.life -= delta;
      if (f.life <= 0) {
        _removeFromScene(f.mesh);
      } else {
        f.mesh.material.opacity = f.life / 0.35;
        nextFlashes.push(f);
      }
    }
    _artyFlashes = nextFlashes;

    /* update tracer lines */
    var nextTracers = [];
    for (i = 0; i < _casTracers.length; i++) {
      var t = _casTracers[i];
      t.life -= delta;
      if (t.life <= 0) {
        _removeFromScene(t.mesh);
      } else {
        nextTracers.push(t);
      }
    }
    _casTracers = nextTracers;

    /* update debris */
    var nextDebris = [];
    var gravity    = 9.8;
    for (i = 0; i < _debris.length; i++) {
      var d = _debris[i];
      d.life -= delta;
      if (d.life <= 0) {
        _removeFromScene(d.mesh);
      } else {
        d.vy -= gravity * delta;
        d.mesh.position.x += d.vx * delta;
        d.mesh.position.y += d.vy * delta;
        d.mesh.position.z += d.vz * delta;
        if (d.mesh.position.y < 0) { d.mesh.position.y = 0; d.vy = 0; d.vx *= 0.7; d.vz *= 0.7; }
        d.mesh.rotation.x += 2 * delta;
        d.mesh.rotation.z += 1.5 * delta;
        nextDebris.push(d);
      }
    }
    _debris = nextDebris;

    /* static effects (craters) — nothing to update */
    /* effects list pruning (remove if life expired) */
    var nextEffects = [];
    for (i = 0; i < _effects.length; i++) {
      var eff = _effects[i];
      eff.life -= delta;
      if (eff.life > 0) { nextEffects.push(eff); }
      /* craters have huge life so they remain */
    }
    _effects = nextEffects;
  }

  /* ── public reset ──────────────────────────────────────────────────────── */
  function reset() {
    var i;
    /* close panel */
    _closePanel();

    /* remove gunship */
    if (_gunshipMesh) { _removeFromScene(_gunshipMesh); _gunshipMesh = null; }
    _gunshipTarget = null;

    /* remove CAS jet */
    if (_casJetMesh) { _removeFromScene(_casJetMesh); _casJetMesh = null; }
    _casActive = false;

    /* clear flashes */
    for (i = 0; i < _artyFlashes.length; i++) { _removeFromScene(_artyFlashes[i].mesh); }
    _artyFlashes = [];

    /* clear tracers */
    for (i = 0; i < _casTracers.length; i++) { _removeFromScene(_casTracers[i].mesh); }
    _casTracers = [];

    /* clear debris */
    for (i = 0; i < _debris.length; i++) { _removeFromScene(_debris[i].mesh); }
    _debris = [];

    /* clear effects (craters etc) */
    for (i = 0; i < _effects.length; i++) {
      if (_effects[i].data && _effects[i].data.mesh) {
        _removeFromScene(_effects[i].data.mesh);
      }
    }
    _effects = [];

    /* reset cooldowns */
    _cooldowns = { ARTY: 0, CAS: 0, GUNSHIP: 0, NAVAL: 0 };

    /* restore camera if shaking */
    if (_camera && _camBasePos) {
      _camera.position.copy(_camBasePos);
      _camBasePos = null;
    }
    _shakeTimer = 0;

    /* arty state */
    _artyRoundsLeft = 0;
    _artyTarget     = null;

    _updateHUD();
  }

  /* ── public API ────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
