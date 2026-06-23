/* ═══════════════════════════════════════════════════════════════════════
 *  sniper-hunt.js — Three.js FPS module: counter-sniper / sniper hunt
 *
 *  Public API:
 *    SniperHunt.init(scene, camera)  — call once after scene is ready
 *    SniperHunt.update(delta)        — per-frame (seconds)
 *    SniperHunt.reset()              — tear down all objects / DOM
 *
 *  Activate: press S+H keys together
 *
 *  Depends on: THREE (global), optional window._score, window._playerHealth
 * ════════════════════════════════════════════════════════════════════════ */

window.SniperHunt = (function () {
  'use strict';

  /* ── scene / camera ── */
  var _scene  = null;
  var _camera = null;

  /* ── mission state ── */
  var _active        = false;
  var _missionDone   = false;
  var _score         = 0;

  /* ── key tracking ── */
  var _keys = {};

  /* ── snipers ── */
  var _snipers = [];   /* array of sniper objects */

  /* ── active laser lines (shot indicators) ── */
  var _laserLines = [];   /* { mesh, timer } */

  /* ── active muzzle flashes (PointLights) ── */
  var _muzzleFlashes = [];  /* { light, timer } */

  /* ── player bullets ── */
  var _playerBullets = [];   /* { mesh, velocity, age } */

  /* ── scope state ── */
  var _scopeActive   = false;
  var _scopeBaseFOV  = 75;
  var _scopeFOV      = 15;

  /* ── ghillie suit state ── */
  var _ghillieOn        = false;
  var _ghillieMeshes    = [];    /* grass-tuft box geometries around camera */
  var _ghillieOverlay   = null;  /* DOM overlay div */

  /* ── wind ── */
  var _windSpeed     = 8;   /* knots */
  var _windDir       = 'NE';
  var _windDrift     = _windSpeed * 0.1;  /* horizontal drift per unit distance */

  /* ── player movement / detection tracking ── */
  var _lastPlayerPos         = null;
  var _straightLineDist      = 0;
  var _lastMoveDir           = null;
  var _detectionLevel        = 0;    /* 0-100 */

  /* ── target-acquired state ── */
  var _targetAcquired        = false;
  var _targetAcquiredTimer   = 0;
  var _targetAcquiredSniper  = null;

  /* ── DOM elements ── */
  var _hudEl         = null;
  var _scopeEl       = null;
  var _bannerEl      = null;
  var _windEl        = null;

  /* ── cover spawn positions for snipers (elevated / in cover) ── */
  var SNIPER_SPAWN_POSITIONS = [
    { x: 25,  y: 4,  z: -30 },  /* rock pile */
    { x: -35, y: 5,  z: 20  },  /* ruined wall */
    { x: 10,  y: 6,  z: 45  }   /* tree line */
  ];

  var SNIPER_COLOR  = 0x2A3A2A;
  var BUSH_COLOR    = 0x2A3A2A;
  var BULLET_COLOR  = 0xFFDD00;
  var LASER_COLOR   = 0xFF0000;
  var MUZZLE_COLOR  = 0xFFEE00;
  var BULLET_SPEED  = 80;
  var GRAVITY_DROP  = 0.02;

  /* ══════════════════════════════════════════════════
   *  HELPERS
   * ══════════════════════════════════════════════════ */

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _vecDist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /* ══════════════════════════════════════════════════
   *  SPAWN SNIPERS
   * ══════════════════════════════════════════════════ */

  function _spawnSnipers() {
    for (var i = 0; i < 3; i++) {
      _spawnSniper(i, SNIPER_SPAWN_POSITIONS[i]);
    }
  }

  function _spawnSniper(id, pos) {
    var group = new THREE.Group();

    /* body — cylinder */
    var bodyGeo  = new THREE.CylinderGeometry(0.25, 0.3, 1.4, 8);
    var bodyMat  = new THREE.MeshLambertMaterial({ color: SNIPER_COLOR });
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.7;
    group.add(bodyMesh);

    /* head — sphere */
    var headGeo  = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat  = new THREE.MeshLambertMaterial({ color: SNIPER_COLOR });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.52;
    group.add(headMesh);

    /* bush concealment — 4 sphere clusters */
    var bushOffsets = [
      { x: 0.7,  z: 0 },
      { x: -0.7, z: 0 },
      { x: 0,    z: 0.7 },
      { x: 0,    z: -0.7 }
    ];
    for (var b = 0; b < 4; b++) {
      var bushGeo  = new THREE.SphereGeometry(_rand(0.5, 0.8), 7, 7);
      var bushMat  = new THREE.MeshLambertMaterial({ color: BUSH_COLOR });
      var bushMesh = new THREE.Mesh(bushGeo, bushMat);
      bushMesh.position.set(bushOffsets[b].x, _rand(0.3, 0.6), bushOffsets[b].z);
      group.add(bushMesh);
    }

    group.position.set(pos.x, pos.y, pos.z);
    _scene.add(group);

    var fireInterval = _rand(8, 15);

    var sniperObj = {
      id:             id,
      group:          group,
      bodyMesh:       bodyMesh,
      headMesh:       headMesh,
      position:       group.position,
      alive:          true,
      dead:           false,
      fireTimer:      fireInterval,
      fireInterval:   fireInterval,
      shotsFromPos:   0,
      shotCount:      0,
      relocating:     false,
      relocateTarget: null,
      relocateSpeed:  6,
      detectedByPlayer: false
    };

    _snipers.push(sniperObj);
  }

  /* ══════════════════════════════════════════════════
   *  SNIPER FIRE
   * ══════════════════════════════════════════════════ */

  function _sniperFire(sniper) {
    if (!_camera) return;

    var sniperPos = sniper.group.position;
    var playerPos = _camera.position;

    /* muzzle flash — PointLight */
    var muzzleLight = new THREE.PointLight(MUZZLE_COLOR, 3, 12);
    muzzleLight.position.copy(sniperPos).add(new THREE.Vector3(0, 1.5, 0));
    _scene.add(muzzleLight);
    _muzzleFlashes.push({ light: muzzleLight, timer: 0.5 });

    /* laser line from sniper to player — brief red line */
    var pts = [];
    pts.push(new THREE.Vector3(sniperPos.x, sniperPos.y + 1.5, sniperPos.z));

    /* apply wind drift to shot destination */
    var dx = playerPos.x - sniperPos.x;
    var dz = playerPos.z - sniperPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var driftX = _windDrift * (dist / 20);
    pts.push(new THREE.Vector3(playerPos.x + driftX, playerPos.y, playerPos.z));

    var laserGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var laserMat = new THREE.LineBasicMaterial({ color: LASER_COLOR });
    var laserLine = new THREE.LineSegments(laserGeo, laserMat);
    _scene.add(laserLine);
    _laserLines.push({ mesh: laserLine, timer: 0.3 });

    /* damage player if in LOS and no ghillie stealth */
    var playerDist = _vecDist(sniperPos, playerPos);
    var blocked = _ghillieOn && playerDist > 30;
    if (!blocked) {
      if (typeof window._playerHealth !== 'undefined') {
        window._playerHealth = Math.max(0, (window._playerHealth || 100) - 20);
      }
    }

    sniper.shotsFromPos++;
    sniper.shotCount++;
    sniper.fireTimer = _rand(8, 15);

    /* after 3 shots always relocate */
    if (sniper.shotsFromPos >= 3) {
      _sniperRelocate(sniper);
    } else {
      /* relocate immediately after each shot */
      _sniperRelocate(sniper);
    }

    _updateHUD();
  }

  function _sniperRelocate(sniper) {
    var angle  = Math.random() * Math.PI * 2;
    var dist   = _rand(5, 10);
    var target = new THREE.Vector3(
      sniper.group.position.x + Math.cos(angle) * dist,
      sniper.group.position.y + _rand(-1, 1),
      sniper.group.position.z + Math.sin(angle) * dist
    );
    sniper.relocating     = true;
    sniper.relocateTarget = target;
    sniper.shotsFromPos   = 0;
  }

  /* ══════════════════════════════════════════════════
   *  PLAYER FIRE (Space)
   * ══════════════════════════════════════════════════ */

  function _playerFire() {
    if (!_camera || !_scopeActive) return;
    if (!_targetAcquired || !_targetAcquiredSniper) return;

    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);

    /* wind drift on player shots */
    dir.x += _windDrift * 0.01;

    var bulletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6);
    var bulletMat = new THREE.MeshBasicMaterial({ color: BULLET_COLOR });
    var bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bulletMesh.position.copy(_camera.position);
    bulletMesh.quaternion.copy(_camera.quaternion);
    _scene.add(bulletMesh);

    var velocity = dir.clone().multiplyScalar(BULLET_SPEED);

    _playerBullets.push({
      mesh:     bulletMesh,
      velocity: velocity,
      age:      0,
      target:   _targetAcquiredSniper
    });
  }

  /* ══════════════════════════════════════════════════
   *  UPDATE PLAYER BULLETS
   * ══════════════════════════════════════════════════ */

  function _updatePlayerBullets(delta) {
    for (var i = _playerBullets.length - 1; i >= 0; i--) {
      var b = _playerBullets[i];
      b.age += delta;

      /* gravity drop */
      b.velocity.y -= GRAVITY_DROP * delta * 60;

      b.mesh.position.addScaledVector(b.velocity, delta);

      /* check hit */
      if (b.target && b.target.alive) {
        var d = _vecDist(b.mesh.position, b.target.group.position);
        if (d < 2.0) {
          _killSniper(b.target);
          _scene.remove(b.mesh);
          _playerBullets.splice(i, 1);
          continue;
        }
      }

      /* remove old bullets */
      if (b.age > 3) {
        _scene.remove(b.mesh);
        _playerBullets.splice(i, 1);
      }
    }
  }

  /* ══════════════════════════════════════════════════
   *  KILL SNIPER
   * ══════════════════════════════════════════════════ */

  function _killSniper(sniper) {
    if (!sniper.alive) return;
    sniper.alive = false;
    sniper.dead  = true;

    /* fall flat */
    sniper.group.rotation.x = Math.PI / 2;
    sniper.group.position.y = 0;

    /* ghillie mesh separates as debris — scatter bushes */
    sniper.group.children.forEach(function (child) {
      if (child.geometry && child.geometry.type === 'SphereGeometry' &&
          child !== sniper.headMesh) {
        /* scatter bush children */
        child.position.x += _rand(-2, 2);
        child.position.z += _rand(-2, 2);
        child.position.y  = 0.3;
      }
    });

    /* score */
    _score += 400;
    if (typeof window._score !== 'undefined') {
      window._score = (window._score || 0) + 400;
    }

    /* clear target acquired if it was this sniper */
    if (_targetAcquiredSniper === sniper) {
      _targetAcquired       = false;
      _targetAcquiredSniper = null;
      _targetAcquiredTimer  = 0;
    }

    _updateHUD();
    _checkMissionComplete();
  }

  /* ══════════════════════════════════════════════════
   *  MISSION COMPLETE
   * ══════════════════════════════════════════════════ */

  function _checkMissionComplete() {
    var alive = 0;
    for (var i = 0; i < _snipers.length; i++) {
      if (_snipers[i].alive) alive++;
    }
    if (alive === 0 && !_missionDone) {
      _missionDone = true;
      _showBanner('AREA CLEAR');
      /* auto extraction after 4 seconds */
      setTimeout(function () {
        if (_bannerEl) _bannerEl.textContent = 'EXTRACTION IN PROGRESS...';
        setTimeout(function () {
          reset();
        }, 3000);
      }, 4000);
    }
  }

  function _aliveSniperCount() {
    var n = 0;
    for (var i = 0; i < _snipers.length; i++) {
      if (_snipers[i].alive) n++;
    }
    return n;
  }

  function _killedSniperCount() {
    return 3 - _aliveSniperCount();
  }

  /* ══════════════════════════════════════════════════
   *  SCOPE VIEW
   * ══════════════════════════════════════════════════ */

  function _enableScope() {
    _scopeActive = true;
    if (_camera) _camera.fov = _scopeFOV;
    if (_camera) _camera.updateProjectionMatrix();
    if (_scopeEl) _scopeEl.style.display = 'block';
    _updateHUD();
  }

  function _disableScope() {
    _scopeActive = false;
    if (_camera) _camera.fov = _scopeBaseFOV;
    if (_camera) _camera.updateProjectionMatrix();
    if (_scopeEl) _scopeEl.style.display = 'none';
    _updateHUD();
  }

  /* ══════════════════════════════════════════════════
   *  GHILLIE SUIT
   * ══════════════════════════════════════════════════ */

  function _enableGhillie() {
    _ghillieOn = true;

    if (_ghillieOverlay) {
      _ghillieOverlay.style.display = 'block';
    }

    /* spawn grass-tuft box geometries around camera */
    if (_camera) {
      var tufts = 8;
      for (var i = 0; i < tufts; i++) {
        var angle = (i / tufts) * Math.PI * 2;
        var r     = 1.5;
        var geo   = new THREE.BoxGeometry(0.2, _rand(0.3, 0.7), 0.2);
        var mat   = new THREE.MeshLambertMaterial({ color: 0x3A5A2A });
        var mesh  = new THREE.Mesh(geo, mat);
        mesh.position.set(
          _camera.position.x + Math.cos(angle) * r,
          _camera.position.y - 0.5,
          _camera.position.z + Math.sin(angle) * r
        );
        _scene.add(mesh);
        _ghillieMeshes.push(mesh);
      }
    }

    _updateHUD();
  }

  function _disableGhillie() {
    _ghillieOn = false;

    if (_ghillieOverlay) {
      _ghillieOverlay.style.display = 'none';
    }

    /* remove grass tufts */
    for (var i = 0; i < _ghillieMeshes.length; i++) {
      _scene.remove(_ghillieMeshes[i]);
    }
    _ghillieMeshes = [];

    _updateHUD();
  }

  /* ══════════════════════════════════════════════════
   *  TARGET ACQUISITION CHECK
   * ══════════════════════════════════════════════════ */

  function _checkTargetAcquisition() {
    if (!_camera || !_scopeActive) {
      _targetAcquired       = false;
      _targetAcquiredSniper = null;
      return;
    }

    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);

    var found = null;
    for (var i = 0; i < _snipers.length; i++) {
      var sniper = _snipers[i];
      if (!sniper.alive) continue;

      var toSniper = new THREE.Vector3();
      toSniper.subVectors(sniper.group.position, _camera.position);
      var dist = toSniper.length();

      if (dist > 80) continue;

      toSniper.normalize();
      var dot = camDir.dot(toSniper);
      /* 60° half-angle => cos(30°) ≈ 0.866 */
      if (dot > 0.866) {
        found = sniper;
        break;
      }
    }

    if (found) {
      if (!_targetAcquired || _targetAcquiredSniper !== found) {
        _targetAcquired       = true;
        _targetAcquiredSniper = found;
        _targetAcquiredTimer  = 3;
        found.detectedByPlayer = true;
        _updateHUD();
      }
    } else {
      _targetAcquired       = false;
      _targetAcquiredSniper = null;
    }
  }

  /* ══════════════════════════════════════════════════
   *  MOVEMENT DETECTION
   * ══════════════════════════════════════════════════ */

  function _updateMovementDetection(delta) {
    if (!_camera) return;

    var pos = _camera.position.clone();

    if (_lastPlayerPos) {
      var moved = _vecDist(pos, _lastPlayerPos);

      if (moved > 0.01) {
        var moveDir = new THREE.Vector3().subVectors(pos, _lastPlayerPos).normalize();

        if (_lastMoveDir) {
          var dot = moveDir.dot(_lastMoveDir);
          /* if moving in very similar direction (straight line) */
          if (dot > 0.98) {
            _straightLineDist += moved;
          } else {
            _straightLineDist = 0;
          }
        }
        _lastMoveDir = moveDir.clone();

        /* check LOS to any alive sniper */
        if (_straightLineDist > 10) {
          for (var i = 0; i < _snipers.length; i++) {
            var sniper = _snipers[i];
            if (!sniper.alive) continue;
            var d = _vecDist(pos, sniper.group.position);
            if (d < 60) {
              /* in sniper LOS — raise detection */
              _detectionLevel = Math.min(100, _detectionLevel + 25);
              break;
            }
          }
          _straightLineDist = 0;
        }
      }

      /* decay detection */
      _detectionLevel = Math.max(0, _detectionLevel - delta * 5);
    }

    _lastPlayerPos = pos;
  }

  /* ══════════════════════════════════════════════════
   *  GHILLIE MESH FOLLOW CAMERA
   * ══════════════════════════════════════════════════ */

  function _updateGhillieMeshes() {
    if (!_ghillieOn || !_camera || _ghillieMeshes.length === 0) return;
    var tufts = _ghillieMeshes.length;
    for (var i = 0; i < tufts; i++) {
      var angle = (i / tufts) * Math.PI * 2;
      var r = 1.5;
      _ghillieMeshes[i].position.set(
        _camera.position.x + Math.cos(angle) * r,
        _camera.position.y - 0.5,
        _camera.position.z + Math.sin(angle) * r
      );
    }
  }

  /* ══════════════════════════════════════════════════
   *  DOM / HUD SETUP
   * ══════════════════════════════════════════════════ */

  function _createDOM() {
    /* main HUD bottom-right */
    _hudEl = document.createElement('div');
    _hudEl.id = 'sh-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'right:16px',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'text-shadow:0 0 4px #00FF88',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 12px',
      'border-radius:4px',
      'z-index:9000',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    /* wind indicator top-left */
    _windEl = document.createElement('div');
    _windEl.id = 'sh-wind';
    _windEl.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:16px',
      'color:#AADDFF',
      'font-family:monospace',
      'font-size:12px',
      'background:rgba(0,0,0,0.5)',
      'padding:4px 10px',
      'border-radius:3px',
      'z-index:9000',
      'pointer-events:none',
      'display:none'
    ].join(';');
    _windEl.textContent = 'WIND: ' + _windSpeed + 'kt ' + _windDir;
    document.body.appendChild(_windEl);

    /* scope overlay — mil-dot reticle */
    _scopeEl = document.createElement('div');
    _scopeEl.id = 'sh-scope';
    _scopeEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:8500',
      'display:none'
    ].join(';');
    _scopeEl.innerHTML = [
      '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">',
      '<defs>',
      '<radialGradient id="scopeGrad" cx="50%" cy="50%" r="50%">',
      '<stop offset="35%" stop-color="transparent"/>',
      '<stop offset="36%" stop-color="rgba(0,0,0,0.92)"/>',
      '</radialGradient>',
      '</defs>',
      '<rect width="100%" height="100%" fill="url(#scopeGrad)"/>',
      '<line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#00FF00" stroke-width="1" opacity="0.7"/>',
      '<line x1="10%" y1="50%" x2="90%" y2="50%" stroke="#00FF00" stroke-width="1" opacity="0.7"/>',
      '<circle cx="50%" cy="50%" r="5" fill="none" stroke="#00FF00" stroke-width="1" opacity="0.8"/>',
      /* mil-dots horizontal */
      '<circle cx="25%" cy="50%" r="3" fill="#00FF00" opacity="0.6"/>',
      '<circle cx="37.5%" cy="50%" r="3" fill="#00FF00" opacity="0.6"/>',
      '<circle cx="62.5%" cy="50%" r="3" fill="#00FF00" opacity="0.6"/>',
      '<circle cx="75%" cy="50%" r="3" fill="#00FF00" opacity="0.6"/>',
      /* mil-dots vertical */
      '<circle cx="50%" cy="25%" r="3" fill="#00FF00" opacity="0.6"/>',
      '<circle cx="50%" cy="37.5%" r="3" fill="#00FF00" opacity="0.6"/>',
      '<circle cx="50%" cy="62.5%" r="3" fill="#00FF00" opacity="0.6"/>',
      '<circle cx="50%" cy="75%" r="3" fill="#00FF00" opacity="0.6"/>',
      '</svg>',
      '<div id="sh-scope-status" style="position:absolute;bottom:22%;left:50%;transform:translateX(-50%);',
      'color:#00FF00;font-family:monospace;font-size:14px;text-shadow:0 0 4px #00FF00;">',
      'SCOPE: SCANNING</div>'
    ].join('');
    document.body.appendChild(_scopeEl);

    /* ghillie overlay — green vignette on screen edge */
    _ghillieOverlay = document.createElement('div');
    _ghillieOverlay.id = 'sh-ghillie';
    _ghillieOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:8000',
      'display:none',
      'box-shadow:inset 0 0 80px 40px rgba(30,80,10,0.55)',
      'border:18px solid rgba(20,70,5,0.45)',
      'box-sizing:border-box'
    ].join(';');
    document.body.appendChild(_ghillieOverlay);

    /* banner */
    _bannerEl = document.createElement('div');
    _bannerEl.id = 'sh-banner';
    _bannerEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFEE00',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'text-shadow:0 0 12px #FFAA00',
      'background:rgba(0,0,0,0.7)',
      'padding:16px 36px',
      'border-radius:8px',
      'z-index:9500',
      'pointer-events:none',
      'display:none',
      'letter-spacing:4px'
    ].join(';');
    document.body.appendChild(_bannerEl);
  }

  function _showBanner(text) {
    if (_bannerEl) {
      _bannerEl.textContent = text;
      _bannerEl.style.display = 'block';
    }
  }

  function _hideBanner() {
    if (_bannerEl) _bannerEl.style.display = 'none';
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var killed   = _killedSniperCount();
    var ghillie  = _ghillieOn ? 'ON' : 'OFF';
    var scope    = _scopeActive ? (_targetAcquired ? 'TARGET ACQUIRED' : 'SCANNING') : 'OFF';
    var wind     = _windSpeed + 'kt ' + _windDir;
    _hudEl.textContent = 'SNIPER HUNT [SNIPERS: ' + killed + '/3] [GHILLIE: ' + ghillie + '] [WIND: ' + wind + '] | SCOPE: ' + scope;

    /* update scope status text */
    var scopeStatus = document.getElementById('sh-scope-status');
    if (scopeStatus) {
      if (_targetAcquired) {
        scopeStatus.textContent = 'TARGET ACQUIRED — FIRE (Space)';
        scopeStatus.style.color = '#FF4444';
      } else {
        scopeStatus.textContent = 'SCOPE: SCANNING';
        scopeStatus.style.color = '#00FF00';
      }
    }
  }

  /* ══════════════════════════════════════════════════
   *  KEY HANDLERS
   * ══════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.code] = true;
    _keys[e.key]  = true;

    /* S+H — start mission */
    if ((_keys['KeyS'] || _keys['s']) && (_keys['KeyH'] || _keys['h'])) {
      if (!_active && !_missionDone) {
        _startMission();
      }
    }

    /* Z — scope toggle */
    if ((e.code === 'KeyZ' || e.key === 'z') && _active) {
      if (_scopeActive) {
        _disableScope();
      } else {
        _enableScope();
      }
    }

    /* G — ghillie toggle */
    if ((e.code === 'KeyG' || e.key === 'g') && _active) {
      if (_ghillieOn) {
        _disableGhillie();
      } else {
        _enableGhillie();
      }
    }

    /* Space — fire when scope + target acquired */
    if (e.code === 'Space' && _active && _scopeActive && _targetAcquired) {
      e.preventDefault();
      _playerFire();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    _keys[e.key]  = false;
  }

  /* ══════════════════════════════════════════════════
   *  START MISSION
   * ══════════════════════════════════════════════════ */

  function _startMission() {
    _active      = true;
    _missionDone = false;
    _score       = 0;

    if (_hudEl)  _hudEl.style.display  = 'block';
    if (_windEl) _windEl.style.display = 'block';

    _spawnSnipers();
    _showBanner('SNIPER HUNT — ELIMINATE ALL SNIPERS');
    setTimeout(_hideBanner, 3500);

    _updateHUD();
  }

  /* ══════════════════════════════════════════════════
   *  PUBLIC: INIT
   * ══════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _createDOM();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    /* read base FOV from camera if available */
    if (_camera && _camera.fov) {
      _scopeBaseFOV = _camera.fov;
    }

    _updateHUD();
  }

  /* ══════════════════════════════════════════════════
   *  PUBLIC: UPDATE (call every frame with delta in seconds)
   * ══════════════════════════════════════════════════ */

  function update(delta) {
    if (!_active || _missionDone) return;

    /* update sniper AI */
    for (var i = 0; i < _snipers.length; i++) {
      var sniper = _snipers[i];
      if (!sniper.alive) continue;

      /* relocation movement */
      if (sniper.relocating && sniper.relocateTarget) {
        var toTarget = new THREE.Vector3().subVectors(sniper.relocateTarget, sniper.group.position);
        var dist = toTarget.length();
        if (dist < 0.3) {
          sniper.relocating     = false;
          sniper.relocateTarget = null;
        } else {
          toTarget.normalize();
          sniper.group.position.addScaledVector(toTarget, sniper.relocateSpeed * delta);
        }
        continue;
      }

      /* fire timer countdown */
      sniper.fireTimer -= delta;
      if (sniper.fireTimer <= 0) {
        _sniperFire(sniper);
      }
    }

    /* update laser lines (shot indicators) */
    for (var l = _laserLines.length - 1; l >= 0; l--) {
      _laserLines[l].timer -= delta;
      if (_laserLines[l].timer <= 0) {
        _scene.remove(_laserLines[l].mesh);
        _laserLines.splice(l, 1);
      }
    }

    /* update muzzle flashes */
    for (var m = _muzzleFlashes.length - 1; m >= 0; m--) {
      _muzzleFlashes[m].timer -= delta;
      if (_muzzleFlashes[m].timer <= 0) {
        _scene.remove(_muzzleFlashes[m].light);
        _muzzleFlashes.splice(m, 1);
      }
    }

    /* update player bullets */
    _updatePlayerBullets(delta);

    /* update target acquired timer */
    if (_targetAcquired && _targetAcquiredTimer > 0) {
      _targetAcquiredTimer -= delta;
      if (_targetAcquiredTimer <= 0) {
        _targetAcquired       = false;
        _targetAcquiredSniper = null;
        _updateHUD();
      }
    }

    /* check target acquisition each frame when scoped */
    _checkTargetAcquisition();

    /* movement detection */
    _updateMovementDetection(delta);

    /* ghillie mesh follow */
    _updateGhillieMeshes();
  }

  /* ══════════════════════════════════════════════════
   *  PUBLIC: RESET
   * ══════════════════════════════════════════════════ */

  function reset() {
    /* remove sniper groups from scene */
    for (var i = 0; i < _snipers.length; i++) {
      if (_scene) _scene.remove(_snipers[i].group);
    }
    _snipers = [];

    /* remove laser lines */
    for (var l = 0; l < _laserLines.length; l++) {
      if (_scene) _scene.remove(_laserLines[l].mesh);
    }
    _laserLines = [];

    /* remove muzzle flashes */
    for (var m = 0; m < _muzzleFlashes.length; m++) {
      if (_scene) _scene.remove(_muzzleFlashes[m].light);
    }
    _muzzleFlashes = [];

    /* remove player bullets */
    for (var b = 0; b < _playerBullets.length; b++) {
      if (_scene) _scene.remove(_playerBullets[b].mesh);
    }
    _playerBullets = [];

    /* remove ghillie meshes */
    for (var g = 0; g < _ghillieMeshes.length; g++) {
      if (_scene) _scene.remove(_ghillieMeshes[g]);
    }
    _ghillieMeshes = [];

    /* restore FOV */
    if (_camera && _scopeActive) {
      _camera.fov = _scopeBaseFOV;
      _camera.updateProjectionMatrix();
    }

    /* remove DOM */
    if (_hudEl)          { _hudEl.remove();          _hudEl          = null; }
    if (_windEl)         { _windEl.remove();          _windEl         = null; }
    if (_scopeEl)        { _scopeEl.remove();         _scopeEl        = null; }
    if (_ghillieOverlay) { _ghillieOverlay.remove();  _ghillieOverlay = null; }
    if (_bannerEl)       { _bannerEl.remove();        _bannerEl       = null; }

    /* remove event listeners */
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    /* reset state */
    _active               = false;
    _missionDone          = false;
    _scopeActive          = false;
    _ghillieOn            = false;
    _targetAcquired       = false;
    _targetAcquiredSniper = null;
    _targetAcquiredTimer  = 0;
    _detectionLevel       = 0;
    _straightLineDist     = 0;
    _lastPlayerPos        = null;
    _lastMoveDir          = null;
    _keys                 = {};
  }

  /* ══════════════════════════════════════════════════
   *  PUBLIC API
   * ══════════════════════════════════════════════════ */

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
