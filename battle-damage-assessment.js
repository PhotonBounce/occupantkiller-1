/* ───────────────────────────────────────────────────────────────────────────
   battle-damage-assessment.js — Post-strike Battle Damage Assessment (BDA),
   kill confirmation, and after-action reporting for Three.js FPS.

   Player flow:
     1. Shift+B  — activate BDA drone view (Y=50, sweeps forward 40 units / 4s)
                   auto-tags all bodies and destroyed vehicles
     2. P        — during BDA view: "photograph" scene (flash + photo log entry)
     3. Shift+R  — show full After-Action Report (AAR) panel

   Kill markers:
     - White skull (inverted cone + thin cylinder) spawned at every kill, 60s TTL
     - Yellow WIA marker for enemies < 30% HP

   BDA report side panel (after scan):
     - Confirmed KIA count, vehicle kills, structures destroyed, areas cleared
     - ENEMY STRENGTH percentage  →  ADVANCE / CONSOLIDATE / HOLD order

   If ReconSatellite or AirSupport called a strike, crater spheres are shown.

   API: window.BattleDamageAssessment = { init(scene, camera, renderer),
                                          update(delta),
                                          reset() }
   ─────────────────────────────────────────────────────────────────────────── */
window.BattleDamageAssessment = (function () {
  'use strict';

  /* ── constants ──────────────────────────────────────────────────────────── */
  var BDA_CAM_Y         = 50;     // drone view height
  var BDA_SWEEP_DIST    = 40;     // units forward during sweep
  var BDA_SWEEP_TIME    = 4;      // seconds for full sweep
  var SKULL_TTL         = 60;     // seconds skull marker lives
  var WIA_HP_THRESHOLD  = 0.30;   // below 30% HP = WIA
  var CRATER_RADIUS     = 3.5;    // default crater sphere radius

  /* ── BDA phases ─────────────────────────────────────────────────────────── */
  var PHASE_IDLE        = 'idle';
  var PHASE_SCANNING    = 'scanning';
  var PHASE_COMPLETE    = 'complete';

  /* ── module references ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;

  /* ── BDA camera state ───────────────────────────────────────────────────── */
  var _phase        = PHASE_IDLE;
  var _sweepTimer   = 0;
  var _sweepStartX  = 0;
  var _sweepStartZ  = 0;
  var _sweepDirX    = 0;
  var _sweepDirZ    = 0;

  /* saved main camera (save/restore) */
  var _savedPos     = null;   /* {x,y,z} */
  var _savedQuat    = null;   /* THREE.Quaternion clone */
  var _savedFOV     = 75;

  /* ── skull / WIA markers ────────────────────────────────────────────────── */
  var _skullMarkers = [];   /* {mesh: Group, timer: number} */
  var _wiaMarkers   = [];   /* {mesh: Group, enemy: obj}    */
  var _craterMeshes = [];   /* THREE.Mesh — permanent per-session */

  /* ── BDA scan results ───────────────────────────────────────────────────── */
  var _lastKIA          = 0;
  var _lastWIA          = 0;
  var _lastVehicleKills = 0;
  var _lastStructures   = 0;
  var _lastAreasCleared = [];
  var _lastStrength     = 100;

  /* ── mission tracking ───────────────────────────────────────────────────── */
  var _missionName      = 'OPERATION UNKNOWN';
  var _missionStartTime = null;   /* Date string */
  var _totalKIA         = 0;
  var _totalShots       = 0;
  var _totalHits        = 0;
  var _objectivesCompleted = [];
  var _missionScore     = 0;
  var _initialEnemyCount = 0;

  /* ── photo log ──────────────────────────────────────────────────────────── */
  var _photoLog  = [];   /* [{time, enemyCount, x, z, label}] */

  /* ── DOM elements ───────────────────────────────────────────────────────── */
  var _hudStatusEl  = null;   /* top-center BDA status */
  var _bdaPanelEl   = null;   /* right-side BDA report panel */
  var _aarPanelEl   = null;   /* full-screen AAR overlay */
  var _flashEl      = null;   /* white photo flash */
  var _darkenEl     = null;   /* subtle screen darken in BDA view */

  /* ── input ───────────────────────────────────────────────────────────────── */
  var _keysDown = {};

  /* ──────────────────────────────────────────────────────────────────────────
     AUDIO
     ────────────────────────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    return window._audioCtx ||
      (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
  }

  function _beep(freq, dur, vol) {
    try {
      var ctx  = _getAudioCtx();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.2));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (dur || 0.2));
    } catch (e) { /* silent */ }
  }

  function _clickSound() {
    _beep(1200, 0.05, 0.1);
    setTimeout(function () { _beep(900, 0.07, 0.08); }, 60);
  }

  function _cameraShutter() {
    /* high-pitched click-click for photo */
    _beep(2200, 0.03, 0.15);
    setTimeout(function () { _beep(1800, 0.04, 0.1); }, 40);
  }

  function _scanStartSound() {
    _beep(660, 0.15, 0.12);
    setTimeout(function () { _beep(880, 0.18, 0.10); }, 150);
    setTimeout(function () { _beep(1100, 0.20, 0.08); }, 300);
  }

  function _scanCompleteSound() {
    _beep(440, 0.12, 0.12);
    setTimeout(function () { _beep(550, 0.12, 0.10); }, 100);
    setTimeout(function () { _beep(660, 0.20, 0.14); }, 200);
    setTimeout(function () { _beep(880, 0.30, 0.12); }, 320);
  }

  /* ──────────────────────────────────────────────────────────────────────────
     TOAST
     ────────────────────────────────────────────────────────────────────────── */
  function _toast(msg, color) {
    if (window.HUD && window.HUD.showToast) { window.HUD.showToast(msg); return; }
    if (window.HUD && window.HUD.notifyPickup) { window.HUD.notifyPickup(msg); return; }
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:' + (color || '#ffffff'),
      'font-family:monospace',
      'font-size:15px',
      'padding:8px 22px',
      'border-radius:4px',
      'z-index:99999',
      'pointer-events:none',
      'letter-spacing:1px'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2800);
  }

  /* ──────────────────────────────────────────────────────────────────────────
     THREE.JS HELPER
     ────────────────────────────────────────────────────────────────────────── */
  function _T() { return window.THREE; }

  /* ──────────────────────────────────────────────────────────────────────────
     MESH BUILDERS
     ────────────────────────────────────────────────────────────────────────── */

  /* Skull marker: inverted cone (head) + thin cylinder (neck/stake)
     All white (0xFFFFFF) */
  function _buildSkullMarker() {
    var T     = _T();
    var group = new T.Group();
    var mat   = new T.MeshBasicMaterial({ color: 0xFFFFFF });

    /* stake — thin cylinder pointing down into ground */
    var stakeMesh = new T.Mesh(
      new T.CylinderGeometry(0.04, 0.06, 1.2, 6),
      mat
    );
    stakeMesh.position.y = 0.6;
    group.add(stakeMesh);

    /* skull head — cone inverted (point downward = base up) */
    var headMesh = new T.Mesh(
      new T.ConeGeometry(0.28, 0.45, 8),
      mat
    );
    /* rotate so the cone's tip points downward */
    headMesh.rotation.z = Math.PI;
    headMesh.position.y = 1.55;
    group.add(headMesh);

    /* eye sockets suggestion: two tiny dark spheres */
    var eyeMat = new T.MeshBasicMaterial({ color: 0x000000 });
    var eyeL = new T.Mesh(new T.SphereGeometry(0.06, 5, 5), eyeMat);
    eyeL.position.set(-0.10, 1.65, 0.22);
    group.add(eyeL);

    var eyeR = new T.Mesh(new T.SphereGeometry(0.06, 5, 5), eyeMat);
    eyeR.position.set(0.10, 1.65, 0.22);
    group.add(eyeR);

    /* small point light so it glows */
    var light = new T.PointLight(0xffffff, 0.7, 5);
    light.position.y = 1.6;
    group.add(light);

    return group;
  }

  /* WIA marker: yellow diamond (two cones base-to-base) */
  function _buildWIAMarker() {
    var T     = _T();
    var group = new T.Group();
    var mat   = new T.MeshBasicMaterial({ color: 0xFFCC00 });

    var coneUp   = new T.Mesh(new T.ConeGeometry(0.22, 0.45, 6), mat);
    coneUp.position.y = 1.45;
    group.add(coneUp);

    var coneDown = new T.Mesh(new T.ConeGeometry(0.22, 0.45, 6), mat);
    coneDown.rotation.z = Math.PI;
    coneDown.position.y = 1.0;
    group.add(coneDown);

    var light = new T.PointLight(0xFFCC00, 0.6, 4);
    light.position.y = 1.2;
    group.add(light);

    return group;
  }

  /* Crater sphere — half-submerged SphereGeometry depression */
  function _buildCraterMesh(x, z, radius) {
    var T     = _T();
    var r     = radius || CRATER_RADIUS;
    var geo   = new T.SphereGeometry(r, 14, 10);
    /* dark scorched earth color */
    var mat   = new T.MeshLambertMaterial({
      color: 0x1a1008,
      transparent: true,
      opacity: 0.88
    });
    var mesh  = new T.Mesh(geo, mat);
    /* half-submerge so it looks like a ground depression */
    mesh.position.set(x, -r * 0.6, z);
    /* radius indicator ring on ground */
    var ringGeo = new T.TorusGeometry(r, 0.12, 6, 28);
    var ringMat = new T.MeshBasicMaterial({ color: 0xff4400 });
    var ring    = new T.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.05, z);
    var group = new T.Group();
    group.add(mesh);
    group.add(ring);
    return group;
  }

  /* ──────────────────────────────────────────────────────────────────────────
     ENEMY / WORLD HELPERS
     ────────────────────────────────────────────────────────────────────────── */

  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll)      return window.Enemies.getAll();
    if (window.Enemies && window.Enemies.getEnemies)  return window.Enemies.getEnemies();
    if (window._enemies)                              return window._enemies;
    return [];
  }

  function _getEnemyPos(en) {
    if (!en) return null;
    if (en.position) return en.position;
    if (en.mesh && en.mesh.position) return en.mesh.position;
    return null;
  }

  function _isDead(en) {
    if (!en) return false;
    if (en.dead === true)   return true;
    if (en.alive === false) return true;
    if (en.hp !== undefined   && en.hp   <= 0) return true;
    if (en.health !== undefined && en.health <= 0) return true;
    return false;
  }

  function _getHPFraction(en) {
    if (!en) return 1;
    if (en.hp !== undefined && en.maxHp !== undefined && en.maxHp > 0) {
      return en.hp / en.maxHp;
    }
    if (en.health !== undefined && en.maxHealth !== undefined && en.maxHealth > 0) {
      return en.health / en.maxHealth;
    }
    if (en.hpFraction !== undefined) return en.hpFraction;
    return 1;
  }

  function _isVehicle(en) {
    if (!en) return false;
    if (en.isVehicle) return true;
    if (en.type && (en.type === 'vehicle' || en.type === 'tank' || en.type === 'car')) return true;
    if (en.vehicleType) return true;
    return false;
  }

  function _isStructure(en) {
    if (!en) return false;
    if (en.isStructure) return true;
    if (en.type && (en.type === 'structure' || en.type === 'building')) return true;
    return false;
  }

  function _getZoneTag(en) {
    if (!en) return null;
    if (en.zone)    return en.zone;
    if (en.area)    return en.area;
    if (en.zoneTag) return en.zoneTag;
    return null;
  }

  /* Check if a strike was called this session via ReconSatellite or AirSupport */
  function _strikeWasCalled() {
    if (window.ReconSatellite && window.ReconSatellite._strikeUsed)    return true;
    if (window._strikeCalledThisSession)  return true;
    if (window._airStrikeCalledThisSession) return true;
    /* check air support strike via phase history */
    if (window.AirSupport && window.AirSupport._lastStrikePos) return true;
    return false;
  }

  /* Collect all crater positions from satellite/air support data */
  function _getStrikeCraterPositions() {
    var craters = [];
    /* from ReconSatellite */
    if (window.ReconSatellite && window.ReconSatellite._strikeTarget) {
      var st = window.ReconSatellite._strikeTarget;
      craters.push({ x: st.x, z: st.z, radius: 4.5 });
    }
    /* from session-level strike list */
    if (window._strikePositions && Array.isArray(window._strikePositions)) {
      var i;
      for (i = 0; i < window._strikePositions.length; i++) {
        craters.push({
          x: window._strikePositions[i].x,
          z: window._strikePositions[i].z,
          radius: window._strikePositions[i].radius || CRATER_RADIUS
        });
      }
    }
    return craters;
  }

  /* ──────────────────────────────────────────────────────────────────────────
     SKULL / WIA MARKER MANAGEMENT
     ────────────────────────────────────────────────────────────────────────── */

  /* Called externally or during scan when a new kill is detected */
  function _spawnSkullAt(x, y, z) {
    if (!_scene) return;
    var skull = _buildSkullMarker();
    skull.position.set(x, y || 0, z);
    _scene.add(skull);
    _skullMarkers.push({ mesh: skull, timer: SKULL_TTL });
  }

  function _spawnWIAMarkerAt(x, y, z, enemy) {
    if (!_scene) return;
    /* remove old WIA marker for this enemy if any */
    var i;
    for (i = _wiaMarkers.length - 1; i >= 0; i--) {
      if (_wiaMarkers[i].enemy === enemy) {
        _scene.remove(_wiaMarkers[i].mesh);
        _wiaMarkers.splice(i, 1);
      }
    }
    var wia = _buildWIAMarker();
    wia.position.set(x, y || 0, z);
    _scene.add(wia);
    _wiaMarkers.push({ mesh: wia, enemy: enemy });
  }

  function _updateSkullMarkers(delta) {
    var i;
    for (i = _skullMarkers.length - 1; i >= 0; i--) {
      _skullMarkers[i].timer -= delta;
      /* gentle idle bob */
      _skullMarkers[i].mesh.position.y = 0.04 * Math.sin(Date.now() * 0.002 + i);
      if (_skullMarkers[i].timer <= 0) {
        _scene.remove(_skullMarkers[i].mesh);
        _skullMarkers.splice(i, 1);
      }
    }
  }

  /* Keep WIA markers following live wounded enemies; remove if dead */
  function _updateWIAMarkers() {
    var i;
    for (i = _wiaMarkers.length - 1; i >= 0; i--) {
      var entry = _wiaMarkers[i];
      if (!entry.enemy || _isDead(entry.enemy)) {
        _scene.remove(entry.mesh);
        _wiaMarkers.splice(i, 1);
        continue;
      }
      /* if HP recovered above threshold, remove WIA marker */
      if (_getHPFraction(entry.enemy) >= WIA_HP_THRESHOLD) {
        _scene.remove(entry.mesh);
        _wiaMarkers.splice(i, 1);
        continue;
      }
      var ep = _getEnemyPos(entry.enemy);
      if (ep) {
        entry.mesh.position.set(ep.x, (ep.y || 0), ep.z);
      }
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     BDA SCAN
     ────────────────────────────────────────────────────────────────────────── */

  function _openBDAView() {
    if (_phase !== PHASE_IDLE) return;

    var T = _T();

    /* save main camera */
    _savedPos  = {
      x: _camera.position.x,
      y: _camera.position.y,
      z: _camera.position.z
    };
    _savedQuat = _camera.quaternion.clone();
    _savedFOV  = _camera.fov || 75;

    /* drone starts above player, forward direction derived from camera look */
    _sweepStartX = _camera.position.x;
    _sweepStartZ = _camera.position.z;

    /* forward vector in XZ plane */
    var forward = new T.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    var fLen    = Math.sqrt(forward.x * forward.x + forward.z * forward.z);
    if (fLen > 0.001) {
      _sweepDirX = forward.x / fLen;
      _sweepDirZ = forward.z / fLen;
    } else {
      _sweepDirX = 0;
      _sweepDirZ = -1;
    }

    /* position drone camera */
    _camera.fov = 60;
    _camera.updateProjectionMatrix();
    _camera.position.set(_sweepStartX, BDA_CAM_Y, _sweepStartZ);
    _camera.lookAt(_sweepStartX, 0, _sweepStartZ);

    _phase      = PHASE_SCANNING;
    _sweepTimer = 0;

    if (_darkenEl) _darkenEl.style.display = 'block';

    _updateHUDStatus();
    _scanStartSound();
    _toast('[BDA] DRONE ACTIVE — scanning forward...  P=photograph  Shift+B=abort', '#00ffcc');
  }

  function _closeBDAView(doReport) {
    if (_phase === PHASE_IDLE) return;

    /* restore camera */
    if (_savedPos) {
      _camera.position.set(_savedPos.x, _savedPos.y, _savedPos.z);
    }
    if (_savedQuat) {
      _camera.quaternion.copy(_savedQuat);
    }
    _camera.fov = _savedFOV;
    _camera.updateProjectionMatrix();

    _savedPos  = null;
    _savedQuat = null;

    if (_darkenEl) _darkenEl.style.display = 'none';

    if (doReport) {
      _runBDAScan();
      _phase = PHASE_COMPLETE;
      _scanCompleteSound();
      _showBDAPanel();
    } else {
      _phase = PHASE_IDLE;
    }

    _updateHUDStatus();
  }

  function _runBDAScan() {
    var enemies = _getEnemies();
    var i;
    var kia       = 0;
    var wia       = 0;
    var vehicles  = 0;
    var structures = 0;
    var areaSet   = {};
    var aliveCount = 0;

    for (i = 0; i < enemies.length; i++) {
      var en  = enemies[i];
      if (!en) continue;

      var dead = _isDead(en);
      var veh  = _isVehicle(en);
      var struc = _isStructure(en);
      var zone  = _getZoneTag(en);
      var hpFrac = _getHPFraction(en);
      var ep   = _getEnemyPos(en);

      if (dead) {
        if (veh)       { vehicles++;  }
        else if (struc){ structures++; }
        else           { kia++;
          /* spawn skull if not already marked */
          if (ep && !en._bdaSkullSpawned) {
            _spawnSkullAt(ep.x, ep.y || 0, ep.z);
            en._bdaSkullSpawned = true;
          }
        }
        if (zone && !areaSet[zone]) areaSet[zone] = true;
      } else {
        aliveCount++;
        /* WIA check */
        if (!veh && !struc && hpFrac < WIA_HP_THRESHOLD) {
          wia++;
          if (ep) _spawnWIAMarkerAt(ep.x, ep.y || 0, ep.z, en);
        }
      }
    }

    var areasCleared = [];
    var zk;
    for (zk in areaSet) {
      if (Object.prototype.hasOwnProperty.call(areaSet, zk)) {
        areasCleared.push(zk);
      }
    }

    /* enemy strength */
    var totalOrig = _initialEnemyCount > 0 ? _initialEnemyCount : enemies.length;
    var strength  = totalOrig > 0 ? Math.round((aliveCount / totalOrig) * 100) : 0;

    _lastKIA          = kia;
    _lastWIA          = wia;
    _lastVehicleKills = vehicles;
    _lastStructures   = structures;
    _lastAreasCleared = areasCleared;
    _lastStrength     = strength;
    _totalKIA         = kia;  /* update session total */

    /* spawn craters if strike was called */
    if (_strikeWasCalled()) {
      _spawnCraters();
    }
  }

  function _spawnCraters() {
    if (!_scene) return;
    var positions = _getStrikeCraterPositions();
    var i;
    /* if no recorded positions, place a placeholder at BDA sweep origin */
    if (positions.length === 0) {
      positions.push({ x: _sweepStartX + _sweepDirX * 20, z: _sweepStartZ + _sweepDirZ * 20, radius: CRATER_RADIUS });
    }
    for (i = 0; i < positions.length; i++) {
      var existing = false;
      var ci;
      /* avoid duplicates by proximity */
      for (ci = 0; ci < _craterMeshes.length; ci++) {
        var cm = _craterMeshes[ci];
        var dx = (cm.position ? cm.position.x : 0) - positions[i].x;
        var dz = (cm.position ? cm.position.z : 0) - positions[i].z;
        if (Math.sqrt(dx * dx + dz * dz) < 2) { existing = true; break; }
      }
      if (!existing) {
        var cg = _buildCraterMesh(positions[i].x, positions[i].z, positions[i].radius);
        _scene.add(cg);
        _craterMeshes.push(cg);
      }
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     PHOTO DOCUMENTATION
     ────────────────────────────────────────────────────────────────────────── */

  function _takePhoto() {
    if (_phase !== PHASE_SCANNING && _phase !== PHASE_COMPLETE) {
      _toast('[BDA] Activate BDA drone first (Shift+B)', '#ff8800');
      return;
    }

    var camX = _camera ? Math.round(_camera.position.x) : 0;
    var camZ = _camera ? Math.round(_camera.position.z) : 0;

    /* count visible enemies */
    var enemies = _getEnemies();
    var visCount = 0;
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (!_isDead(enemies[i])) visCount++;
    }

    var now  = new Date();
    var timeStr = now.getHours() + ':' +
                  String(now.getMinutes()).padStart(2, '0') + ':' +
                  String(now.getSeconds()).padStart(2, '0');

    var entry = {
      time:       timeStr,
      enemyCount: visCount,
      x:          camX,
      z:          camZ,
      label:      'PHOTO-' + String(_photoLog.length + 1).padStart(2, '0')
    };
    _photoLog.push(entry);

    /* white flash */
    _flashScreen();
    _cameraShutter();

    _toast('[BDA] ' + entry.label + ' — ' + visCount + ' enemies at (' + camX + ',' + camZ + ')', '#ffffff');
  }

  function _flashScreen() {
    if (!_flashEl) return;
    _flashEl.style.opacity = '1';
    _flashEl.style.transition = 'none';
    setTimeout(function () {
      _flashEl.style.transition = 'opacity 0.45s ease-out';
      _flashEl.style.opacity    = '0';
    }, 50);
  }

  /* ──────────────────────────────────────────────────────────────────────────
     ORDER LOGIC
     ────────────────────────────────────────────────────────────────────────── */

  function _getOrder(strength) {
    if (strength < 25)  return { text: 'ADVANCE',     color: '#00ff44' };
    if (strength <= 50) return { text: 'CONSOLIDATE', color: '#ffcc00' };
    return                     { text: 'HOLD',         color: '#ff4444' };
  }

  /* ──────────────────────────────────────────────────────────────────────────
     BDA REPORT PANEL
     ────────────────────────────────────────────────────────────────────────── */

  function _showBDAPanel() {
    if (!_bdaPanelEl) _buildBDAPanel();
    _updateBDAPanel();
    _bdaPanelEl.style.display = 'block';
  }

  function _hideBDAPanel() {
    if (_bdaPanelEl) _bdaPanelEl.style.display = 'none';
  }

  function _buildBDAPanel() {
    _bdaPanelEl = document.createElement('div');
    _bdaPanelEl.id = 'bda-report-panel';
    _bdaPanelEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'right:0',
      'width:260px',
      'background:rgba(0,0,0,0.88)',
      'border-left:2px solid #00ffcc',
      'border-top:2px solid #00ffcc',
      'border-bottom:2px solid #00ffcc',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:12px',
      'padding:12px 14px',
      'z-index:5000',
      'pointer-events:none',
      'line-height:1.7',
      'letter-spacing:0.5px',
      'display:none'
    ].join(';');
    document.body.appendChild(_bdaPanelEl);
  }

  function _updateBDAPanel() {
    if (!_bdaPanelEl) return;

    var order   = _getOrder(_lastStrength);
    var craterLine = _strikeWasCalled()
      ? '<div style="color:#ff8800;margin-top:6px">CRATER ANALYSIS: ' + _craterMeshes.length + ' IMPACT SITE(S)</div>'
      : '';

    var photosLine = _photoLog.length > 0
      ? '<div style="color:#aaccff;margin-top:4px">PHOTOS: ' + _photoLog.length + ' TAKEN</div>'
      : '';

    var areasLine = _lastAreasCleared.length > 0
      ? '<div style="color:#88ffcc;margin-top:4px">AREAS CLEARED: ' + _lastAreasCleared.join(', ') + '</div>'
      : '<div style="color:#888;margin-top:4px">AREAS CLEARED: NONE TAGGED</div>';

    _bdaPanelEl.innerHTML =
      '<div style="color:#00ffcc;font-size:13px;border-bottom:1px solid #00ffcc;padding-bottom:5px;margin-bottom:8px;letter-spacing:2px">BDA REPORT</div>' +
      '<div style="color:#ff4444">KIA: ' + _lastKIA + ' CONFIRMED</div>' +
      '<div style="color:#ffcc00">WIA: ' + _lastWIA + ' (HP&lt;30%)</div>' +
      '<div style="color:#ff8844;margin-top:4px">VEHICLE KILLS: ' + _lastVehicleKills + '</div>' +
      '<div style="color:#cc8844">STRUCTURES: ' + _lastStructures + ' DESTROYED</div>' +
      areasLine +
      craterLine +
      photosLine +
      '<div style="margin-top:10px;border-top:1px solid #444;padding-top:8px;color:#cccccc">ENEMY STRENGTH: ' + _lastStrength + '%</div>' +
      '<div style="margin-top:6px;font-size:14px;font-weight:bold;color:' + order.color + ';letter-spacing:3px">' + order.text + '</div>' +
      '<div style="margin-top:10px;color:#555;font-size:10px">Shift+R = FULL AAR</div>';
  }

  /* ──────────────────────────────────────────────────────────────────────────
     AFTER-ACTION REPORT (AAR) PANEL
     ────────────────────────────────────────────────────────────────────────── */

  function _showAAR() {
    if (!_aarPanelEl) _buildAARPanel();
    _updateAARPanel();
    _aarPanelEl.style.display = 'flex';
    _beep(550, 0.1, 0.1);
  }

  function _hideAAR() {
    if (_aarPanelEl) _aarPanelEl.style.display = 'none';
  }

  function _buildAARPanel() {
    _aarPanelEl = document.createElement('div');
    _aarPanelEl.id = 'bda-aar-panel';
    _aarPanelEl.style.cssText = [
      'position:fixed',
      'top:0','left:0',
      'width:100%','height:100%',
      'background:rgba(0,0,0,0.88)',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:13px',
      'z-index:8000',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'pointer-events:auto'
    ].join(';');

    var closeBtn = document.createElement('div');
    closeBtn.style.cssText = [
      'position:absolute',
      'top:16px','right:22px',
      'color:#888',
      'font-size:11px',
      'cursor:pointer',
      'letter-spacing:1px'
    ].join(';');
    closeBtn.textContent = '[ESC / Shift+R to close]';
    closeBtn.addEventListener('click', function () { _hideAAR(); }, false);

    _aarPanelEl.appendChild(closeBtn);
    document.body.appendChild(_aarPanelEl);
  }

  function _updateAARPanel() {
    if (!_aarPanelEl) return;

    var nowStr   = (new Date()).toLocaleTimeString();
    var startStr = _missionStartTime || '--:--:--';
    var accuracy = _totalShots > 0 ? Math.round((_totalHits / _totalShots) * 100) : 0;
    var order    = _getOrder(_lastStrength);

    /* score breakdown */
    var killScore    = _totalKIA         * 100;
    var vehicleScore = _lastVehicleKills * 250;
    var objScore     = _objectivesCompleted.length * 500;
    _missionScore    = killScore + vehicleScore + objScore;

    var objLines = '';
    var i;
    for (i = 0; i < _objectivesCompleted.length; i++) {
      objLines += '<div style="color:#88ff88">  [x] ' + _objectivesCompleted[i] + '</div>';
    }
    if (objLines === '') objLines = '<div style="color:#888">  (none recorded)</div>';

    var photoLines = '';
    for (i = 0; i < _photoLog.length; i++) {
      var ph = _photoLog[i];
      photoLines += '<div style="color:#aaccff">  ' + ph.label + '  ' + ph.time +
        '  (' + ph.x + ',' + ph.z + ')  ' + ph.enemyCount + ' enemies</div>';
    }
    if (photoLines === '') photoLines = '<div style="color:#888">  (none taken)</div>';

    /* clear old content except close button */
    while (_aarPanelEl.children.length > 1) {
      _aarPanelEl.removeChild(_aarPanelEl.lastChild);
    }

    var content = document.createElement('div');
    content.style.cssText = [
      'width:520px',
      'max-height:80vh',
      'overflow-y:auto',
      'border:1px solid #00ffcc',
      'padding:24px 30px',
      'line-height:1.8',
      'background:rgba(0,20,15,0.92)'
    ].join(';');

    content.innerHTML =
      '<div style="color:#00ffcc;font-size:16px;letter-spacing:4px;border-bottom:1px solid #00ffcc;padding-bottom:8px;margin-bottom:14px">AFTER-ACTION REPORT</div>' +
      '<div style="color:#aaffcc">MISSION: ' + _missionName + '</div>' +
      '<div style="color:#888888">START:   ' + startStr + '</div>' +
      '<div style="color:#888888">END:     ' + nowStr + '</div>' +
      '<div style="margin-top:12px;border-top:1px solid #333;padding-top:10px">' +
      '<div style="color:#ff4444">TOTAL KIA:        ' + _totalKIA + '</div>' +
      '<div style="color:#ffcc00">TOTAL WIA:        ' + _lastWIA + '</div>' +
      '<div style="color:#ff8844">VEHICLE KILLS:    ' + _lastVehicleKills + '</div>' +
      '<div style="color:#cc8844">STRUCTURES:       ' + _lastStructures + '</div>' +
      '<div style="color:#cccccc">SHOTS FIRED:      ' + _totalShots + '</div>' +
      '<div style="color:#cccccc">HIT ACCURACY:     ' + accuracy + '%</div>' +
      '</div>' +
      '<div style="margin-top:12px;border-top:1px solid #333;padding-top:10px">' +
      '<div style="color:#cccccc">OBJECTIVES COMPLETED:</div>' + objLines +
      '</div>' +
      '<div style="margin-top:12px;border-top:1px solid #333;padding-top:10px">' +
      '<div style="color:#cccccc">PHOTO INTELLIGENCE:</div>' + photoLines +
      '</div>' +
      '<div style="margin-top:14px;border-top:1px solid #333;padding-top:10px">' +
      '<div style="color:#cccccc">SCORE BREAKDOWN:</div>' +
      '<div style="color:#aaaaaa">  KIA (' + _totalKIA + ' x 100):        ' + killScore + '</div>' +
      '<div style="color:#aaaaaa">  VEHICLES (' + _lastVehicleKills + ' x 250):   ' + vehicleScore + '</div>' +
      '<div style="color:#aaaaaa">  OBJECTIVES (' + _objectivesCompleted.length + ' x 500):  ' + objScore + '</div>' +
      '<div style="color:#ffffff;font-size:14px;margin-top:6px">  TOTAL SCORE: ' + _missionScore + '</div>' +
      '</div>' +
      '<div style="margin-top:14px;border-top:1px solid #333;padding-top:10px">' +
      '<div style="color:#cccccc">ENEMY STRENGTH: ' + _lastStrength + '%</div>' +
      '<div style="font-size:15px;font-weight:bold;color:' + order.color + ';letter-spacing:3px;margin-top:4px">ORDER: ' + order.text + '</div>' +
      '</div>';

    _aarPanelEl.appendChild(content);
  }

  /* ──────────────────────────────────────────────────────────────────────────
     HUD STATUS (top-center)
     ────────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _hudStatusEl = document.createElement('div');
    _hudStatusEl.id = 'bda-hud-status';
    _hudStatusEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00ffcc',
      'font-family:monospace',
      'font-size:12px',
      'padding:4px 14px',
      'border-radius:3px',
      'z-index:600',
      'pointer-events:none',
      'letter-spacing:1px',
      'border:1px solid #005544',
      'text-align:center',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudStatusEl);

    /* photo flash overlay */
    _flashEl = document.createElement('div');
    _flashEl.id = 'bda-flash';
    _flashEl.style.cssText = [
      'position:fixed',
      'top:0','left:0',
      'width:100%','height:100%',
      'background:#ffffff',
      'opacity:0',
      'pointer-events:none',
      'z-index:9900'
    ].join(';');
    document.body.appendChild(_flashEl);

    /* subtle darken during BDA view */
    _darkenEl = document.createElement('div');
    _darkenEl.id = 'bda-darken';
    _darkenEl.style.cssText = [
      'position:fixed',
      'top:0','left:0',
      'width:100%','height:100%',
      'background:rgba(0,30,20,0.35)',
      'pointer-events:none',
      'z-index:480',
      'display:none'
    ].join(';');
    document.body.appendChild(_darkenEl);

    _updateHUDStatus();
  }

  function _updateHUDStatus() {
    if (!_hudStatusEl) return;
    var txt;
    var color;

    if (_phase === PHASE_SCANNING) {
      txt   = 'SCANNING...';
      color = '#ffff00';
    } else if (_phase === PHASE_COMPLETE) {
      txt   = 'BDA COMPLETE [' + _lastKIA + ' KIA / ' + _lastWIA + ' WIA]';
      color = '#00ffcc';
    } else {
      /* idle — show readiness hint */
      txt   = '📋 BDA READY';
      color = '#00ccaa';
    }

    _hudStatusEl.style.color = color;
    _hudStatusEl.textContent = txt;
  }

  /* ──────────────────────────────────────────────────────────────────────────
     BDA CAMERA SWEEP UPDATE
     ────────────────────────────────────────────────────────────────────────── */

  function _updateSweep(delta) {
    if (_phase !== PHASE_SCANNING) return;

    _sweepTimer += delta;
    var progress = Math.min(_sweepTimer / BDA_SWEEP_TIME, 1.0);

    /* advance drone camera forward */
    var cx = _sweepStartX + _sweepDirX * BDA_SWEEP_DIST * progress;
    var cz = _sweepStartZ + _sweepDirZ * BDA_SWEEP_DIST * progress;

    _camera.position.set(cx, BDA_CAM_Y, cz);
    _camera.lookAt(cx, 0, cz);

    /* sweep complete */
    if (progress >= 1.0) {
      _closeBDAView(true);
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     INPUT HANDLERS
     ────────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    /* Shift+B — toggle BDA drone view */
    if (e.code === 'KeyB' && e.shiftKey) {
      e.preventDefault();
      if (_phase === PHASE_SCANNING) {
        /* abort / close early, no report */
        _closeBDAView(false);
        _toast('[BDA] Scan aborted', '#ff8800');
      } else if (_phase === PHASE_COMPLETE) {
        /* re-arm */
        _phase = PHASE_IDLE;
        _hideBDAPanel();
        _updateHUDStatus();
        _clickSound();
        _toast('[BDA] BDA reset — press Shift+B to scan again', '#aaffcc');
      } else {
        _openBDAView();
      }
      return;
    }

    /* Shift+R — toggle AAR panel */
    if (e.code === 'KeyR' && e.shiftKey) {
      e.preventDefault();
      if (_aarPanelEl && _aarPanelEl.style.display !== 'none') {
        _hideAAR();
      } else {
        _showAAR();
      }
      return;
    }

    /* P — photograph (only during active BDA view) */
    if (e.code === 'KeyP') {
      if (_phase === PHASE_SCANNING || _phase === PHASE_COMPLETE) {
        e.preventDefault();
        _takePhoto();
      }
      return;
    }

    /* Escape — close AAR if open */
    if (e.code === 'Escape') {
      if (_aarPanelEl && _aarPanelEl.style.display !== 'none') {
        _hideAAR();
      }
      return;
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  /* ──────────────────────────────────────────────────────────────────────────
     PUBLIC API HELPERS — used by other modules to feed data
     ────────────────────────────────────────────────────────────────────────── */

  /* Called by enemies.js / weapons.js to register hits and shots */
  function recordShot(hit) {
    _totalShots++;
    if (hit) _totalHits++;
  }

  /* Called when an enemy dies — spawn skull immediately */
  function onEnemyKilled(enemy) {
    _totalKIA++;
    if (!enemy) return;
    var ep = _getEnemyPos(enemy);
    if (ep && !enemy._bdaSkullSpawned) {
      _spawnSkullAt(ep.x, ep.y || 0, ep.z);
      enemy._bdaSkullSpawned = true;
    }
  }

  /* Register a completed objective by name */
  function addObjective(name) {
    if (name && _objectivesCompleted.indexOf(name) < 0) {
      _objectivesCompleted.push(name);
    }
  }

  /* Set the mission name shown in AAR */
  function setMissionName(name) {
    _missionName = name || 'OPERATION UNKNOWN';
  }

  /* ──────────────────────────────────────────────────────────────────────────
     INIT / UPDATE / RESET
     ────────────────────────────────────────────────────────────────────────── */

  function init(scene, camera, renderer) {
    _scene    = scene    || window._gameScene || null;
    _camera   = camera   || window._camera    || null;
    _renderer = renderer || window._renderer  || null;

    /* snapshot initial enemy count for strength calculation */
    var enemies = _getEnemies();
    _initialEnemyCount = enemies.length;

    /* mission start time */
    _missionStartTime = (new Date()).toLocaleTimeString();

    /* build HUD */
    _buildHUD();

    /* input */
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    _updateHUDStatus();
  }

  function update(delta) {
    if (!delta || delta <= 0) return;

    _updateSweep(delta);
    _updateSkullMarkers(delta);
    _updateWIAMarkers();
    _updateHUDStatus();
  }

  function reset() {
    /* close views */
    if (_phase === PHASE_SCANNING) _closeBDAView(false);
    _hideBDAPanel();
    _hideAAR();

    /* remove skull markers */
    var i;
    for (i = 0; i < _skullMarkers.length; i++) {
      if (_scene) _scene.remove(_skullMarkers[i].mesh);
    }
    _skullMarkers = [];

    /* remove WIA markers */
    for (i = 0; i < _wiaMarkers.length; i++) {
      if (_scene) _scene.remove(_wiaMarkers[i].mesh);
    }
    _wiaMarkers = [];

    /* remove craters */
    for (i = 0; i < _craterMeshes.length; i++) {
      if (_scene) _scene.remove(_craterMeshes[i]);
    }
    _craterMeshes = [];

    /* reset scan results */
    _lastKIA          = 0;
    _lastWIA          = 0;
    _lastVehicleKills = 0;
    _lastStructures   = 0;
    _lastAreasCleared = [];
    _lastStrength     = 100;

    /* reset mission tracking */
    _totalKIA              = 0;
    _totalShots            = 0;
    _totalHits             = 0;
    _objectivesCompleted   = [];
    _missionScore          = 0;
    _initialEnemyCount     = 0;
    _missionName           = 'OPERATION UNKNOWN';
    _missionStartTime      = (new Date()).toLocaleTimeString();

    /* photo log */
    _photoLog = [];

    /* sweep state */
    _phase      = PHASE_IDLE;
    _sweepTimer = 0;
    _keysDown   = {};

    /* restore camera if interrupted */
    if (_savedPos && _camera) {
      _camera.position.set(_savedPos.x, _savedPos.y, _savedPos.z);
      if (_savedQuat) _camera.quaternion.copy(_savedQuat);
      _camera.fov = _savedFOV;
      _camera.updateProjectionMatrix();
    }
    _savedPos  = null;
    _savedQuat = null;
    _savedFOV  = 75;

    if (_darkenEl) _darkenEl.style.display = 'none';

    _updateHUDStatus();
  }

  return {
    init:            init,
    update:          update,
    reset:           reset,
    /* optional hooks for other modules */
    recordShot:      recordShot,
    onEnemyKilled:   onEnemyKilled,
    addObjective:    addObjective,
    setMissionName:  setMissionName
  };

})();
