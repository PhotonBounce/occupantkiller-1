/* ═══════════════════════════════════════════════════════════════════════
 *  counter-sniper.js — Three.js FPS module: detect enemy snipers &
 *  counter-sniper operations
 *
 *  Public API:
 *    CounterSniper.init(scene, camera)  — call once after scene is ready
 *    CounterSniper.update(delta)        — per-frame (seconds)
 *    CounterSniper.reset()              — tear down all objects / DOM
 *
 *  Depends on: THREE (global), optional window.Weapons, window.Enemies,
 *              window._playerHealth, window._score
 * ════════════════════════════════════════════════════════════════════════ */

window.CounterSniper = (function () {
  'use strict';

  /* ── module state ── */
  var _scene  = null;
  var _camera = null;

  /* ── shot-from-sniper records ── */
  var _shotEvents = [];          /* { time, origin:Vector3, dir:string, dist:number } */
  var _lastShooterHits = {};     /* enemyId -> [ {time, pos:Vector3} ] for triangulation */

  /* ── bullet-crack tracking ── */
  var _activeCracks = [];        /* { pos:Vector3, time } */

  /* ── thermal scope ── */
  var _thermalActive      = false;
  var _thermalTimer       = 0;    /* seconds remaining */
  var _thermalCooldown    = 0;    /* seconds until next allowed activation */
  var _thermalSavedMats   = [];   /* { mesh, originalMat } */
  var _thermalOverlayMesh = null;

  /* ── counter-sniper nest ── */
  var _nestDeployed    = false;
  var _nestMesh        = null;
  var _nestPos         = null;
  var _playerMounted   = false;
  var _baseFOV         = 75;
  var _cKeyDown        = false;
  var _sKeyDown        = false;
  var _eKeyDown        = false;

  /* ── ghost-shot / relocation tracking ── */
  var _sniperLastFire  = {};     /* enemyId -> timestamp */
  var _ghostMarkers    = [];     /* { mesh, time, maxLife } */
  var _sniperRelocated = {};     /* enemyId -> bool */

  /* ── spotter tracking ── */
  var _spotterIds = {};          /* enemyId -> bool (currently active spotter) */

  /* ── score ── */
  var _score = 0;

  /* ── DOM overlay container ── */
  var _overlay = null;

  /* ── HUD elements ── */
  var _shotNotifEl    = null;
  var _crackNotifEl   = null;
  var _compassEl      = null;
  var _triangleEl     = null;
  var _thermalHudEl   = null;
  var _mountPromptEl  = null;

  /* ── AudioContext for crack sounds ── */
  var _audioCtx = null;

  /* ── key state ── */
  var _shiftDown = false;
  var _tPressed  = false;        /* one-shot: prevent repeat */

  /* ── triangulation data ── */
  var _triTarget = null;         /* { x, z } approximate position */
  var _triVisible = false;

  /* ═══ CONSTANTS ═══════════════════════════════════════════════════════ */

  var SNIPER_DETECT_DIST    = 40;   /* units: shots from farther count as sniper */
  var CRACK_RADIUS          = 5;    /* units: bullet passes within this → crack */
  var THERMAL_RANGE         = 60;   /* units: enemies glow in thermal */
  var THERMAL_DURATION      = 8;    /* seconds */
  var THERMAL_COOLDOWN      = 45;   /* seconds */
  var TRIANGULATE_THRESHOLD = 2;    /* shots from same sniper needed */
  var NEST_W                = 2;    /* nest box width */
  var NEST_H                = 1;    /* nest box height */
  var NEST_D                = 1;    /* nest box depth */
  var NEST_COLOR            = 0x4A6741;
  var NEST_ZOOM_MULT        = 1.5;  /* +50% zoom = FOV * (1/1.5) */
  var MOUNT_DIST            = 2.5;  /* distance to press E and mount */
  var SPOTTER_DIST          = 10;   /* units around player that enable spotter */
  var GHOST_FIRE_TIMEOUT    = 30;   /* seconds silence → relocation */
  var GHOST_MARKER_LIFE     = 8;    /* seconds the X fades */
  var SCORE_COUNTER_KILL    = 300;
  var SCORE_SUPPRESSION     = 100;
  var THERMAL_HOT_COLOR     = 0xffaa33;
  var THERMAL_OVERLAY_ALPHA = 0.82;
  var CRACK_NOTIF_LIFE      = 1.0;  /* seconds "CRACK OVERHEAD" shows */
  var SHOT_NOTIF_LIFE       = 3.0;  /* seconds shot notification shows */
  var COMPASS_ARC_LIFE      = 4.0;

  /* ═══ INIT ════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _shotEvents      = [];
    _lastShooterHits = {};
    _activeCracks    = [];
    _thermalActive   = false;
    _thermalTimer    = 0;
    _thermalCooldown = 0;
    _thermalSavedMats = [];
    _nestDeployed    = false;
    _nestMesh        = null;
    _nestPos         = null;
    _playerMounted   = false;
    _ghostMarkers    = [];
    _sniperLastFire  = {};
    _sniperRelocated = {};
    _spotterIds      = {};
    _score           = 0;
    _triTarget       = null;
    _triVisible      = false;

    _buildOverlay();
    _bindKeys();
    _initAudio();
    _initThermalOverlay();

    /* hook into Weapons module bullet-fired events if available */
    if (window.Weapons && typeof window.Weapons.onBulletFired === 'function') {
      window.Weapons.onBulletFired(_onBulletFired);
    }

    /* hook into enemy-fire events */
    if (typeof window._onEnemyFire === 'undefined') {
      window._onEnemyFire = function () {};
    }
    var _prevEnemyFire = window._onEnemyFire;
    window._onEnemyFire = function (enemyId, originPos, damage) {
      _prevEnemyFire(enemyId, originPos, damage);
      _onEnemyShotFired(enemyId, originPos, damage);
    };
  }

  /* ═══ OVERLAY / DOM SETUP ════════════════════════════════════════════ */

  function _buildOverlay() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'counter-sniper-overlay';
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:300;overflow:hidden;font-family:monospace'
    ].join('');
    document.body.appendChild(_overlay);

    /* shot notification */
    _shotNotifEl = _el('div', [
      'position:absolute;top:18%;left:50%;transform:translateX(-50%);',
      'color:#fff;background:rgba(180,0,0,0.78);border:1px solid #f44;',
      'padding:5px 18px;font-size:15px;font-weight:bold;border-radius:4px;',
      'display:none;white-space:nowrap;letter-spacing:1px'
    ].join(''));
    _overlay.appendChild(_shotNotifEl);

    /* bullet crack notification */
    _crackNotifEl = _el('div', [
      'position:absolute;top:28%;left:50%;transform:translateX(-50%);',
      'color:#fff;background:rgba(0,0,0,0.6);border:1px solid #fff;',
      'padding:4px 16px;font-size:14px;font-weight:bold;border-radius:3px;',
      'display:none;letter-spacing:2px'
    ].join(''));
    _crackNotifEl.textContent = 'CRACK OVERHEAD';
    _overlay.appendChild(_crackNotifEl);

    /* compass arc (canvas-based) */
    _compassEl = document.createElement('canvas');
    _compassEl.width  = 220;
    _compassEl.height = 220;
    _compassEl.style.cssText = [
      'position:absolute;bottom:110px;left:50%;transform:translateX(-50%);',
      'display:none;opacity:0.9'
    ].join('');
    _overlay.appendChild(_compassEl);

    /* triangulation yellow triangle pointer */
    _triangleEl = _el('div', [
      'position:absolute;top:40%;left:50%;transform:translateX(-50%);',
      'color:#ffee00;font-size:30px;font-weight:bold;display:none;',
      'text-shadow:0 0 8px #aa8800;letter-spacing:2px;text-align:center'
    ].join(''));
    _overlay.appendChild(_triangleEl);

    /* thermal HUD countdown */
    _thermalHudEl = _el('div', [
      'position:absolute;top:8%;right:20px;',
      'color:#ff8800;font-size:13px;font-weight:bold;',
      'background:rgba(0,0,0,0.55);padding:3px 10px;border-radius:3px;',
      'display:none;letter-spacing:1px'
    ].join(''));
    _overlay.appendChild(_thermalHudEl);

    /* mount prompt */
    _mountPromptEl = _el('div', [
      'position:absolute;bottom:22%;left:50%;transform:translateX(-50%);',
      'color:#fff;background:rgba(0,60,0,0.75);border:1px solid #4A6741;',
      'padding:4px 14px;font-size:13px;border-radius:3px;display:none'
    ].join(''));
    _mountPromptEl.textContent = '[E] Mount counter-sniper nest';
    _overlay.appendChild(_mountPromptEl);
  }

  function _el(tag, css) {
    var e = document.createElement(tag);
    e.style.cssText = css;
    return e;
  }

  /* ═══ THERMAL OVERLAY MESH ═══════════════════════════════════════════ */

  function _initThermalOverlay() {
    if (!_scene || !_camera) return;
    var geo  = new THREE.PlaneGeometry(4, 4);
    var mat  = new THREE.MeshBasicMaterial({
      color: 0x000022,
      transparent: true,
      opacity: THERMAL_OVERLAY_ALPHA,
      depthTest: false,
      depthWrite: false
    });
    _thermalOverlayMesh = new THREE.Mesh(geo, mat);
    _thermalOverlayMesh.renderOrder = 9999;
    _thermalOverlayMesh.visible = false;
    _scene.add(_thermalOverlayMesh);
  }

  /* ═══ AUDIO ══════════════════════════════════════════════════════════ */

  function _initAudio() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) _audioCtx = new AC();
    } catch (e) { /* no audio */ }
  }

  function _playCrack() {
    if (!_audioCtx) return;
    try {
      var osc  = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, _audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, _audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.45, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.08);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.1);
    } catch (e) { /* silent fail */ }
  }

  /* ═══ KEY BINDINGS ════════════════════════════════════════════════════ */

  function _bindKeys() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  function _unbindKeys() {
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
  }

  function _onKeyDown(e) {
    if (e.key === 'Shift') { _shiftDown = true; }

    /* Shift+T — activate thermal scope */
    if (_shiftDown && (e.key === 't' || e.key === 'T') && !_tPressed) {
      _tPressed = true;
      _activateThermal();
    }

    /* C+S together — deploy counter-sniper nest */
    if (e.key === 'c' || e.key === 'C') { _cKeyDown = true; }
    if (e.key === 's' || e.key === 'S') { _sKeyDown = true; }
    if (_cKeyDown && _sKeyDown) { _deployNest(); }

    /* E — mount nest */
    if (e.key === 'e' || e.key === 'E') { _eKeyDown = true; _tryMount(); }
  }

  function _onKeyUp(e) {
    if (e.key === 'Shift') { _shiftDown = false; _tPressed = false; }
    if (e.key === 't' || e.key === 'T') { _tPressed = false; }
    if (e.key === 'c' || e.key === 'C') { _cKeyDown = false; }
    if (e.key === 's' || e.key === 'S') { _sKeyDown = false; }
    if (e.key === 'e' || e.key === 'E') { _eKeyDown = false; }
  }

  /* ═══ SHOT-FIRED HOOKS ════════════════════════════════════════════════ */

  /* Called when an enemy fires and hits near the player */
  function _onEnemyShotFired(enemyId, originPos, damage) {
    if (!_camera) return;
    var playerPos = _camera.position;
    var dist = originPos.distanceTo(playerPos);

    /* register last-fire time (for ghost-shot relocation) */
    _sniperLastFire[enemyId] = _now();

    if (dist < SNIPER_DETECT_DIST) return; /* not a sniper shot */

    /* direction string */
    var dirStr = _bearingStr(originPos, playerPos);

    _shotEvents.push({
      time:   _now(),
      origin: originPos.clone(),
      dir:    dirStr,
      dist:   Math.round(dist),
      enemyId: enemyId
    });

    /* show HUD notification */
    _showShotNotif(dirStr, Math.round(dist));

    /* show compass arc */
    _drawCompassArc(originPos);

    /* triangulation */
    if (!_lastShooterHits[enemyId]) { _lastShooterHits[enemyId] = []; }
    _lastShooterHits[enemyId].push({ time: _now(), pos: originPos.clone() });
    if (_lastShooterHits[enemyId].length >= TRIANGULATE_THRESHOLD) {
      _computeTriangulation(enemyId);
    }

    /* score suppression if sniper relocates (tracked in update) */
    _sniperRelocated[enemyId] = false;
  }

  /* Called (optionally) when a bullet object passes near player */
  function _onBulletFired(bulletOrigin, bulletDir, speed) {
    /* speed threshold for "high-velocity" round */
    if (!speed || speed < 200) return;
    if (!_camera) return;
    var playerPos = _camera.position;

    /* check closest approach — record bullet for update-loop to check */
    _activeCracks.push({ origin: bulletOrigin.clone(), dir: bulletDir.clone().normalize(), speed: speed, time: _now() });
  }

  /* ═══ SNIPER DETECTION (timer-based fallback) ════════════════════════ */

  function _pollEnemyShots() {
    /* If EnemySniper module is present, check its snipers for recent shots */
    if (!window.EnemySniper || !_camera) return;
    var snipers = window.EnemySniper.getAll ? window.EnemySniper.getAll() : [];
    var playerPos = _camera.position;
    for (var i = 0; i < snipers.length; i++) {
      var sn = snipers[i];
      if (!sn || !sn.mesh) continue;
      var enemyId = sn.id || ('sniper_' + i);
      var snPos   = sn.mesh.position;
      var dist    = snPos.distanceTo(playerPos);

      /* register fire time if sniper just fired */
      if (sn.lastFireTime && sn.lastFireTime !== (_sniperLastFire[enemyId] || -1)) {
        _sniperLastFire[enemyId] = sn.lastFireTime;

        if (dist >= SNIPER_DETECT_DIST) {
          _onEnemyShotFired(enemyId, snPos, sn.damage || 45);
        }

        /* check crack — if bullet passes within CRACK_RADIUS of player */
        if (dist < CRACK_RADIUS * 6) {
          _triggerCrack();
        }
      }

      /* spotter detection */
      if (dist <= SPOTTER_DIST) {
        _spotterIds[enemyId] = true;
      }
    }
  }

  /* ═══ THERMAL SCOPE ══════════════════════════════════════════════════ */

  function _activateThermal() {
    if (_thermalActive) return;
    if (_thermalCooldown > 0) {
      _flashMessage('THERMAL RECHARGING: ' + Math.ceil(_thermalCooldown) + 's', '#ff6600', 1.5);
      return;
    }
    _thermalActive = true;
    _thermalTimer  = THERMAL_DURATION;
    _thermalCooldown = 0;

    /* darken scene with overlay */
    if (_thermalOverlayMesh) { _thermalOverlayMesh.visible = true; }

    /* highlight enemies */
    _applyThermalToEnemies(true);

    _thermalHudEl.style.display = 'block';
  }

  function _deactivateThermal() {
    _thermalActive   = false;
    _thermalCooldown = THERMAL_COOLDOWN;

    if (_thermalOverlayMesh) { _thermalOverlayMesh.visible = false; }
    _applyThermalToEnemies(false);
    _thermalHudEl.style.display = 'none';
  }

  function _applyThermalToEnemies(on) {
    /* restore previous */
    for (var r = 0; r < _thermalSavedMats.length; r++) {
      var entry = _thermalSavedMats[r];
      if (entry.mesh && entry.mesh.material) {
        entry.mesh.material = entry.originalMat;
      }
    }
    _thermalSavedMats = [];
    if (!on || !_scene || !_camera) return;

    var playerPos = _camera.position;
    _scene.traverse(function (obj) {
      if (!obj.isMesh) return;
      /* heuristic: enemies tagged or named */
      var isEnemy = (obj.userData && obj.userData.isEnemy) ||
                    (obj.name && /enemy|sniper|soldier|npc/i.test(obj.name));
      if (!isEnemy) return;
      if (!obj.position) return;
      if (obj.position.distanceTo(playerPos) > THERMAL_RANGE) return;

      _thermalSavedMats.push({ mesh: obj, originalMat: obj.material });
      var hotMat = new THREE.MeshBasicMaterial({
        color: THERMAL_HOT_COLOR,
        emissive: new THREE.Color(THERMAL_HOT_COLOR),
        transparent: false
      });
      obj.material = hotMat;
    });
  }

  /* ═══ BULLET CRACK CHECK ═════════════════════════════════════════════ */

  function _checkCracks() {
    if (!_camera) return;
    var playerPos = _camera.position;
    var now = _now();
    var newCracks = [];
    for (var i = 0; i < _activeCracks.length; i++) {
      var c = _activeCracks[i];
      var age = now - c.time;
      if (age > 2.0) continue;  /* expire after 2 seconds */

      /* closest point on ray to player */
      var toPlayer = new THREE.Vector3().subVectors(playerPos, c.origin);
      var t        = toPlayer.dot(c.dir);
      if (t < 0) continue;
      var closest  = new THREE.Vector3().copy(c.origin).addScaledVector(c.dir, t);
      var distToRay = closest.distanceTo(playerPos);

      if (distToRay <= CRACK_RADIUS) {
        _triggerCrack();
        continue; /* don't keep after triggering */
      }
      newCracks.push(c);
    }
    _activeCracks = newCracks;
  }

  function _triggerCrack() {
    _playCrack();
    _crackNotifEl.style.display = 'block';
    _crackNotifEl.style.opacity = '1';
    _crackNotifEl._hideAt = _now() + CRACK_NOTIF_LIFE;
  }

  /* ═══ COUNTER-SNIPER NEST ════════════════════════════════════════════ */

  function _deployNest() {
    if (_nestDeployed || !_scene || !_camera) return;
    _nestDeployed = true;

    var playerPos = _camera.position.clone();
    /* place slightly in front of player */
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    fwd.y = 0;
    fwd.normalize().multiplyScalar(2);
    var nestPos = playerPos.clone().add(fwd);
    nestPos.y = playerPos.y - 0.5;  /* rest on ground level */

    var geo = new THREE.BoxGeometry(NEST_W, NEST_H, NEST_D);
    var mat = new THREE.MeshLambertMaterial({ color: NEST_COLOR });
    _nestMesh = new THREE.Mesh(geo, mat);
    _nestMesh.position.copy(nestPos);
    _nestMesh.userData.isCounterSniperNest = true;

    /* ghillie-style mottled spots */
    _addGhillieSpots(_nestMesh, nestPos);

    /* scope marker — small cylinder on top */
    var scopeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
    var scopeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var scopeMesh = new THREE.Mesh(scopeGeo, scopeMat);
    scopeMesh.position.set(0, 0.55, 0);
    scopeMesh.rotation.z = Math.PI / 2;
    _nestMesh.add(scopeMesh);

    _scene.add(_nestMesh);
    _nestPos = nestPos.clone();

    _flashMessage('Counter-sniper nest deployed! [E] to mount', '#4eff88', 3);
  }

  function _addGhillieSpots(parent, pos) {
    if (!_scene) return;
    /* place a few small dark spheres on top for mottled texture appearance */
    var spotColors = [0x3a5530, 0x2e4427, 0x5c7a4a, 0x1e3018];
    for (var i = 0; i < 8; i++) {
      var sg = new THREE.SphereGeometry(0.1 + Math.random() * 0.12, 4, 4);
      var sm = new THREE.MeshLambertMaterial({ color: spotColors[i % spotColors.length] });
      var sp = new THREE.Mesh(sg, sm);
      sp.position.set(
        (Math.random() - 0.5) * NEST_W * 0.9,
        NEST_H / 2 + 0.05,
        (Math.random() - 0.5) * NEST_D * 0.9
      );
      parent.add(sp);
    }
  }

  function _tryMount() {
    if (!_nestDeployed || !_nestMesh || !_camera) return;
    var dist = _camera.position.distanceTo(_nestMesh.position);
    if (dist > MOUNT_DIST) return;

    if (_playerMounted) {
      /* dismount */
      _playerMounted = false;
      if (_camera.fov !== undefined) {
        _camera.fov = _baseFOV;
        _camera.updateProjectionMatrix();
      }
      if (_mountPromptEl) { _mountPromptEl.textContent = '[E] Mount counter-sniper nest'; }
      _flashMessage('Dismounted nest', '#aaffaa', 1.5);
    } else {
      /* mount */
      _playerMounted = true;
      _baseFOV = _camera.fov || 75;
      if (_camera.fov !== undefined) {
        _camera.fov = _baseFOV / NEST_ZOOM_MULT;   /* +50% zoom */
        _camera.updateProjectionMatrix();
      }
      if (_mountPromptEl) { _mountPromptEl.textContent = '[E] Dismount nest'; }
      _flashMessage('Mounted! +50% zoom. Suppressed fire active.', '#44ff88', 2.5);
    }
  }

  /* ═══ TRIANGULATION ══════════════════════════════════════════════════ */

  function _computeTriangulation(enemyId) {
    var hits = _lastShooterHits[enemyId];
    if (!hits || hits.length < 2) return;

    /* average position of shot origins, add random ±5 unit noise */
    var avg = new THREE.Vector3();
    for (var i = 0; i < hits.length; i++) { avg.add(hits[i].pos); }
    avg.divideScalar(hits.length);
    avg.x += (Math.random() - 0.5) * 10;  /* within 5 units accuracy */
    avg.z += (Math.random() - 0.5) * 10;

    _triTarget  = { x: avg.x, z: avg.z };
    _triVisible = true;
  }

  function _updateTriangle() {
    if (!_triVisible || !_triTarget || !_camera) {
      _triangleEl.style.display = 'none';
      return;
    }
    /* compute bearing angle from camera to target */
    var dx  = _triTarget.x - _camera.position.x;
    var dz  = _triTarget.z - _camera.position.z;
    var angle = Math.atan2(dx, -dz) * (180 / Math.PI);
    _triangleEl.innerHTML = '&#9650; SNIPER ~' + Math.round(
      Math.sqrt(dx * dx + dz * dz)
    ) + 'm';
    _triangleEl.style.display = 'block';
    _triangleEl.style.transform = 'translateX(-50%) rotate(' + angle + 'deg)';
    /* anchor at screen border if far away */
  }

  /* ═══ COMPASS ARC ════════════════════════════════════════════════════ */

  var _compassArc = null; /* { bearing, life } */

  function _drawCompassArc(shotOrigin) {
    if (!_camera) return;
    var bearing = _bearingAngle(shotOrigin, _camera.position);
    _compassArc = { bearing: bearing, life: COMPASS_ARC_LIFE };
    _compassEl.style.display = 'block';
  }

  function _updateCompassCanvas(dt) {
    if (!_compassArc) return;
    _compassArc.life -= dt;
    if (_compassArc.life <= 0) {
      _compassArc = null;
      _compassEl.style.display = 'none';
      return;
    }

    var ctx  = _compassEl.getContext('2d');
    var cx   = 110;
    var cy   = 110;
    var r    = 90;
    ctx.clearRect(0, 0, 220, 220);

    /* compass rose base */
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    /* cardinal labels */
    var cardinals = ['N','E','S','W'];
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var ci = 0; ci < 4; ci++) {
      var ca = (ci * Math.PI / 2) - Math.PI / 2;
      ctx.fillText(cardinals[ci], cx + (r + 12) * Math.cos(ca), cy + (r + 12) * Math.sin(ca));
    }

    /* red arc toward shot origin */
    var arcBearing = (_compassArc.bearing * Math.PI / 180) - Math.PI / 2;
    var arcSpan    = 0.45;   /* ~26 degrees */
    var alpha      = Math.min(1, _compassArc.life / COMPASS_ARC_LIFE);
    ctx.strokeStyle = 'rgba(255,50,50,' + alpha + ')';
    ctx.lineWidth   = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, arcBearing - arcSpan, arcBearing + arcSpan);
    ctx.stroke();

    /* pointer line */
    ctx.strokeStyle = 'rgba(255,100,100,' + alpha + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (r - 10) * Math.cos(arcBearing), cy + (r - 10) * Math.sin(arcBearing));
    ctx.stroke();
  }

  /* ═══ SHOT NOTIFICATION ══════════════════════════════════════════════ */

  var _shotNotifHideAt = 0;

  function _showShotNotif(dirStr, distM) {
    _shotNotifEl.textContent = '⚡ SHOT FROM [' + dirStr + '] ' + distM + 'm';
    _shotNotifEl.style.display = 'block';
    _shotNotifEl.style.opacity = '1';
    _shotNotifHideAt = _now() + SHOT_NOTIF_LIFE;
  }

  /* ═══ GHOST SHOTS (sniper relocation) ════════════════════════════════ */

  function _checkGhostShots() {
    if (!_scene || !_camera) return;
    var now = _now();
    for (var id in _sniperLastFire) {
      if (!_sniperLastFire.hasOwnProperty(id)) continue;
      var lastFire = _sniperLastFire[id];
      if ((now - lastFire) >= GHOST_FIRE_TIMEOUT && !_sniperRelocated[id]) {
        _sniperRelocated[id] = true;

        /* find last known position */
        var hits = _lastShooterHits[id];
        if (!hits || !hits.length) continue;
        var lastHit = hits[hits.length - 1];
        _placeGhostMarker(lastHit.pos);

        /* award suppression score */
        _addScore(SCORE_SUPPRESSION, 'Suppression — sniper relocated');
      }
    }
  }

  function _placeGhostMarker(pos) {
    if (!_scene) return;
    /* create an X from two crossed lines */
    var mat = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 1.0 });

    var pts1 = [
      new THREE.Vector3(-0.5, 0, -0.5),
      new THREE.Vector3( 0.5, 0,  0.5)
    ];
    var pts2 = [
      new THREE.Vector3( 0.5, 0, -0.5),
      new THREE.Vector3(-0.5, 0,  0.5)
    ];

    var geo1 = new THREE.BufferGeometry().setFromPoints(pts1);
    var geo2 = new THREE.BufferGeometry().setFromPoints(pts2);
    var line1 = new THREE.Line(geo1, mat);
    var line2 = new THREE.Line(geo2, mat.clone());

    var group = new THREE.Group();
    group.add(line1);
    group.add(line2);
    group.position.copy(pos);
    group.position.y += 0.05;
    _scene.add(group);

    _ghostMarkers.push({ mesh: group, time: 0, maxLife: GHOST_MARKER_LIFE });
  }

  function _updateGhostMarkers(dt) {
    var alive = [];
    for (var i = 0; i < _ghostMarkers.length; i++) {
      var gm = _ghostMarkers[i];
      gm.time += dt;
      var t = gm.time / gm.maxLife;
      if (t >= 1) {
        if (_scene) _scene.remove(gm.mesh);
        continue;
      }
      /* fade out */
      gm.mesh.traverse(function (c) {
        if (c.material && c.material.opacity !== undefined) {
          c.material.opacity = 1 - t;
        }
      });
      alive.push(gm);
    }
    _ghostMarkers = alive;
  }

  /* ═══ SPOTTER BONUS ══════════════════════════════════════════════════ */

  function _updateSpotterBonuses() {
    if (!_camera) return;
    var playerPos = _camera.position;

    /* gather living enemy NPCs */
    var enemies = [];
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      enemies = window.Enemies.getAll() || [];
    } else if (window.EnemySniper && typeof window.EnemySniper.getAll === 'function') {
      enemies = window.EnemySniper.getAll() || [];
    }

    var newSpotters = {};
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh) continue;
      var id   = e.id || ('enemy_' + i);
      var dist = e.mesh.position.distanceTo(playerPos);

      /* check if enemy is looking toward player (aim direction heuristic) */
      var toPlayer = new THREE.Vector3().subVectors(playerPos, e.mesh.position).normalize();
      var lookDir  = new THREE.Vector3(0, 0, -1).applyQuaternion(e.mesh.quaternion);
      var dot      = lookDir.dot(toPlayer);

      if (dist <= SPOTTER_DIST && dot > 0.7) {
        newSpotters[id] = true;
        /* apply accuracy/range bonus if not already applied */
        if (!_spotterIds[id]) {
          if (e.accuracy !== undefined) { e.accuracy *= 1.30; }
          if (e.range    !== undefined) { e.range    += 20; }
        }
      } else {
        /* remove bonus if spotter left zone */
        if (_spotterIds[id]) {
          if (e.accuracy !== undefined) { e.accuracy /= 1.30; }
          if (e.range    !== undefined) { e.range    -= 20; }
        }
      }
    }
    _spotterIds = newSpotters;
  }

  /* ═══ SCORING ════════════════════════════════════════════════════════ */

  function _addScore(pts, reason) {
    _score += pts;
    if (window._score !== undefined) { window._score += pts; }
    _flashMessage('+' + pts + ' ' + (reason || ''), '#ffff44', 2.0);
  }

  /* Called externally when player kills an enemy */
  function onEnemyKilled(enemyId, enemyPos) {
    if (!_camera || !enemyPos) return;
    var dist = _camera.position.distanceTo(enemyPos);
    if (dist >= SNIPER_DETECT_DIST && _playerMounted) {
      _addScore(SCORE_COUNTER_KILL, 'Counter-sniper kill!');
    }
  }

  /* ═══ MOUNT PROXIMITY PROMPT ═════════════════════════════════════════ */

  function _updateMountPrompt() {
    if (!_nestDeployed || !_nestMesh || !_camera) {
      if (_mountPromptEl) { _mountPromptEl.style.display = 'none'; }
      return;
    }
    var dist = _camera.position.distanceTo(_nestMesh.position);
    if (_mountPromptEl) {
      _mountPromptEl.style.display = (dist <= MOUNT_DIST * 1.5 && !_playerMounted) ? 'block' : 'none';
    }
  }

  /* ═══ THERMAL UPDATE ═════════════════════════════════════════════════ */

  function _updateThermal(dt) {
    if (_thermalCooldown > 0) {
      _thermalCooldown -= dt;
      if (_thermalCooldown < 0) { _thermalCooldown = 0; }
    }

    if (!_thermalActive) return;
    _thermalTimer -= dt;

    /* position overlay mesh just in front of camera */
    if (_thermalOverlayMesh && _camera) {
      _thermalOverlayMesh.position.copy(_camera.position);
      var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
      _thermalOverlayMesh.position.addScaledVector(fwd, 0.3);
      _thermalOverlayMesh.quaternion.copy(_camera.quaternion);
    }

    if (_thermalTimer <= 0) {
      _deactivateThermal();
    } else {
      _thermalHudEl.textContent = 'THERMAL ' + Math.ceil(_thermalTimer) + 's';
      /* pulse enemy highlight */
      var pulse = 0.6 + 0.4 * Math.abs(Math.sin(_now() * 3));
      for (var i = 0; i < _thermalSavedMats.length; i++) {
        var entry = _thermalSavedMats[i];
        if (entry.mesh && entry.mesh.material && entry.mesh.material.color) {
          entry.mesh.material.color.setHex(
            pulse > 0.8 ? 0xffffff : THERMAL_HOT_COLOR
          );
        }
      }
    }

    /* cooldown HUD */
    if (!_thermalActive && _thermalCooldown > 0) {
      _thermalHudEl.style.display = 'block';
      _thermalHudEl.textContent   = 'THERMAL CD ' + Math.ceil(_thermalCooldown) + 's';
    } else if (!_thermalActive) {
      _thermalHudEl.style.display = 'none';
    }
  }

  /* ═══ NOTIFICATION FADE ══════════════════════════════════════════════ */

  function _updateNotifications() {
    var now = _now();
    /* shot notification */
    if (_shotNotifEl.style.display !== 'none') {
      var rem = _shotNotifHideAt - now;
      if (rem <= 0) {
        _shotNotifEl.style.display = 'none';
      } else if (rem < 0.5) {
        _shotNotifEl.style.opacity = String(rem / 0.5);
      }
    }

    /* crack notification */
    if (_crackNotifEl && _crackNotifEl._hideAt) {
      var cremaining = _crackNotifEl._hideAt - now;
      if (cremaining <= 0) {
        _crackNotifEl.style.display = 'none';
        _crackNotifEl._hideAt = 0;
      } else {
        _crackNotifEl.style.opacity = String(Math.min(1, cremaining / CRACK_NOTIF_LIFE));
      }
    }
  }

  /* ═══ FLASH MESSAGE (generic) ════════════════════════════════════════ */

  function _flashMessage(msg, color, duration) {
    if (!_overlay) return;
    var el = _el('div', [
      'position:absolute;top:60%;left:50%;transform:translateX(-50%);',
      'color:' + (color || '#fff') + ';background:rgba(0,0,0,0.65);',
      'padding:4px 16px;font-size:13px;border-radius:3px;',
      'pointer-events:none;transition:opacity 0.4s'
    ].join(''));
    el.textContent = msg;
    _overlay.appendChild(el);
    var dur = (duration || 2) * 1000;
    setTimeout(function () { el.style.opacity = '0'; }, dur - 400);
    setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, dur);
  }

  /* ═══ HELPERS ════════════════════════════════════════════════════════ */

  function _now() { return performance.now() / 1000; }

  function _bearingAngle(from, to) {
    var dx  = to.x - from.x;
    var dz  = to.z - from.z;
    var rad = Math.atan2(dx, -dz);
    return (rad * 180 / Math.PI + 360) % 360;
  }

  function _bearingStr(shotOrigin, playerPos) {
    var angle = _bearingAngle(shotOrigin, playerPos);
    /* shot is coming FROM origin, so invert */
    angle = (angle + 180) % 360;
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    var idx  = Math.round(angle / 45) % 8;
    return dirs[idx];
  }

  /* ═══ UPDATE (per-frame) ═════════════════════════════════════════════ */

  var _pollTimer = 0;
  var _POLL_INT  = 0.1;  /* poll enemy states every 100ms */

  function update(delta) {
    var dt = delta || 0.016;

    _pollTimer += dt;
    if (_pollTimer >= _POLL_INT) {
      _pollTimer = 0;
      _pollEnemyShots();
      _checkGhostShots();
      _updateSpotterBonuses();
    }

    _checkCracks();
    _updateThermal(dt);
    _updateCompassCanvas(dt);
    _updateGhostMarkers(dt);
    _updateTriangle();
    _updateMountPrompt();
    _updateNotifications();
  }

  /* ═══ RESET ══════════════════════════════════════════════════════════ */

  function reset() {
    _deactivateThermal();

    if (_nestMesh && _scene) { _scene.remove(_nestMesh); }
    _nestMesh     = null;
    _nestDeployed = false;
    _playerMounted = false;

    if (_thermalOverlayMesh && _scene) { _scene.remove(_thermalOverlayMesh); }
    _thermalOverlayMesh = null;

    for (var i = 0; i < _ghostMarkers.length; i++) {
      if (_scene) { _scene.remove(_ghostMarkers[i].mesh); }
    }
    _ghostMarkers = [];

    _shotEvents       = [];
    _lastShooterHits  = {};
    _activeCracks     = [];
    _thermalSavedMats = [];
    _sniperLastFire   = {};
    _sniperRelocated  = {};
    _spotterIds       = {};
    _triTarget        = null;
    _triVisible       = false;
    _compassArc       = null;

    if (_overlay && _overlay.parentNode) {
      _overlay.parentNode.removeChild(_overlay);
      _overlay = null;
    }

    _unbindKeys();
  }

  /* ═══ PUBLIC API ══════════════════════════════════════════════════════ */

  return {
    init:           init,
    update:         update,
    reset:          reset,
    onEnemyKilled:  onEnemyKilled,
    /* expose for external bullet-crack injection */
    registerBullet: _onBulletFired,
    /* expose for external shot injection */
    registerEnemyShot: _onEnemyShotFired
  };

}());
