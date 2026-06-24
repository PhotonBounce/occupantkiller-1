/* ───────────────────────────────────────────────────────────────────────────
   shark-attack.js — Survive shark-infested waters after a shipwreck
   Browser-based Three.js game module. THREE must be a global.

   ACTIVATION: S + A simultaneous keypress within 400ms

   Controls:
     S + A        — activate module (within 400ms)
     WASD         — swim / move
     Mouse        — look direction
     E            — interact (board debris / pick up items)
     Q            — emergency knife (only within 0.5u of shark)
     Mouse click  — fire harpoon / flare (when weapon equipped)

   Gameplay:
     Ship sank; swim 200 units to shore through shark-infested water.
     5 great whites circle shipwreck debris; attract more by bleeding.
     Board floating planks to move faster and reduce shark aggression.
     Collect harpoon from shipwreck, flare from shore camp.

   Win:  reach shore (Z >= 200)
   Lose: HP reaches 0

   API: window.SharkAttack = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */

window.SharkAttack = (function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════════════
     CONSTANTS
     ═══════════════════════════════════════════════════════════════════════════ */

  var SHORE_Z              = 200;
  var SWIM_SPEED           = 2;        /* u/s normal */
  var SWIM_SPEED_WOUNDED   = 1;        /* u/s when HP < 50 */
  var DEBRIS_SPEED         = 4;        /* u/s on debris */
  var SHARK_COUNT_INIT     = 5;
  var SHARK_COUNT_MAX      = 8;
  var SHARK_ORBIT_RADIUS   = 15;
  var SHARK_ORBIT_SPEED    = 0.4;      /* rad/s */
  var SHARK_ALERT_SPEED    = 6;        /* u/s rushing */
  var SHARK_CHARGE_DIST    = 10;       /* units to trigger charge */
  var SHARK_BITE_DAMAGE    = 60;
  var SHARK_BITE_COOLDOWN  = 10;       /* s per shark */
  var SHARK_BITE_DIST      = 1.8;      /* close enough to bite */
  var SHARK_PLANK_AGGRO    = 0.3;      /* aggro multiplier on plank */
  var SHARK_SEAWEED_AVOID  = true;

  var HARPOON_DAMAGE       = 80;
  var HARPOON_SHOTS        = 3;
  var HARPOON_RELOAD       = 3;        /* s */
  var HARPOON_RANGE        = 40;

  var KNIFE_RANGE          = 0.5;
  var KNIFE_DAMAGE         = 120;
  var KNIFE_COOLDOWN       = 2;

  var FLARE_ATTRACT_DUR    = 20;       /* s sharks chase flare */
  var FLARE_ATTRACT_RADIUS = 80;

  var DEBRIS_COUNT         = 8;
  var DEBRIS_BOB_AMP       = 0.2;
  var DEBRIS_BOB_SPEED     = 1.2;
  var DEBRIS_HP            = 100;
  var DEBRIS_SHARK_DMG     = 20;       /* dmg/s when shark adjacent */
  var DEBRIS_INTERACT_DIST = 2;

  var ROCKY_OUTCROP_Z      = 100;
  var SEAWEED_Z            = 50;
  var SEAWEED_SLOW         = 0.5;

  var BLOOD_CLOUD_LIFE     = 6;        /* s */
  var BLEED_THRESHOLD_PCT  = 0.8;      /* HP below 80% = bleeding */

  var EXTRA_SHARK_SPAWN_Z  = -80;      /* edge of map for attracted sharks */

  /* ═══════════════════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════════════════ */

  var _initialized     = false;
  var _active          = false;
  var _scene           = null;
  var _camera          = null;
  var _renderer        = null;

  /* player */
  var _playerPos       = { x: 0, y: 0.1, z: 0 };
  var _playerHP        = 100;
  var _maxHP           = 100;
  var _onDebris        = false;
  var _onDebrisIdx     = -1;
  var _submerged       = false;
  var _bleeding        = false;
  var _dead            = false;
  var _won             = false;

  /* weapons */
  var _hasHarpoon      = false;
  var _harpoonShots    = 0;
  var _harpoonReload   = 0;
  var _hasFlare        = false;
  var _flareFired      = false;
  var _flarePos        = null;
  var _flareTimer      = 0;
  var _knifeTimer      = 0;

  /* sharks */
  var _sharks          = [];

  /* debris */
  var _debrisList      = [];

  /* scene objects */
  var _waterPlane      = null;
  var _sandPlane       = null;
  var _seaweedPlane    = null;
  var _rockyOutcrop    = null;
  var _shoreCamp       = null;
  var _wreckPieces     = [];
  var _palmTrees       = [];
  var _bloodClouds     = [];
  var _harpoonPickup   = null;
  var _flarePickup     = null;
  var _medKitMesh      = null;
  var _flareProjectile = null;

  /* input */
  var _keys            = {};
  var _mouse           = { x: 0, y: 0, dx: 0, dy: 0, down: false };
  var _yaw             = 0;
  var _pitch           = 0;
  var _sDown           = false;
  var _aDown           = false;
  var _sDownTime       = 0;
  var _aDownTime       = 0;
  var _ePressed        = false;
  var _qPressed        = false;

  /* timing */
  var _time            = 0;

  /* DOM */
  var _hud             = null;
  var _tint            = null;
  var _overlay         = null;

  /* ═══════════════════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, renderer) {
    if (_initialized) { reset(); }
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;

    /* scene setup */
    _scene.background = new THREE.Color(0x001122);
    _scene.fog        = new THREE.FogExp2(0x001133, 0.01);

    /* lighting */
    var ambient = new THREE.AmbientLight(0x112233, 0.8);
    _scene.add(ambient);
    var moon = new THREE.DirectionalLight(0x334466, 0.6);
    moon.position.set(20, 30, -10);
    _scene.add(moon);

    _buildWater();
    _buildShore();
    _buildSeaweed();
    _buildRockyOutcrop();
    _buildShoreCamp();
    _buildShipwreck();
    _buildDebris();
    _buildSharks(SHARK_COUNT_INIT);
    _buildHUD();
    _buildTint();
    _attachInputListeners();

    /* position camera */
    _camera.position.set(0, 1.7, 0);
    _camera.rotation.set(0, 0, 0);
    _yaw   = 0;
    _pitch = 0;

    _initialized = true;
    _active      = false; /* wait for S+A activation */
  }

  /* ── Water surface ───────────────────────────────────────────────────────── */
  function _buildWater() {
    var geo = new THREE.BoxGeometry(400, 0.1, 400);
    var mat = new THREE.MeshLambertMaterial({
      color:       0x002244,
      transparent: true,
      opacity:     0.88
    });
    _waterPlane = new THREE.Mesh(geo, mat);
    _waterPlane.position.set(0, 0, 100);
    _scene.add(_waterPlane);
  }

  /* ── Shore ───────────────────────────────────────────────────────────────── */
  function _buildShore() {
    /* sand shelf */
    var geo = new THREE.BoxGeometry(120, 2, 60);
    var mat = new THREE.MeshLambertMaterial({ color: 0xDDCC88 });
    _sandPlane = new THREE.Mesh(geo, mat);
    _sandPlane.position.set(0, -1, 220);
    _scene.add(_sandPlane);

    /* palm trees */
    _palmTrees = [];
    var palmPositions = [
      [-30, 205], [-15, 212], [0, 208], [15, 215], [30, 205], [45, 210]
    ];
    for (var i = 0; i < palmPositions.length; i++) {
      var px = palmPositions[i][0];
      var pz = palmPositions[i][1];

      /* trunk */
      var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 8, 6);
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
      var trunk    = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(px, 4, pz);
      _scene.add(trunk);
      _palmTrees.push(trunk);

      /* fronds */
      var frondGeo = new THREE.ConeGeometry(4, 2, 6);
      var frondMat = new THREE.MeshLambertMaterial({ color: 0x336622 });
      var frond    = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(px, 8.5, pz);
      _scene.add(frond);
      _palmTrees.push(frond);
    }
  }

  /* ── Seaweed bed ─────────────────────────────────────────────────────────── */
  function _buildSeaweed() {
    var geo = new THREE.BoxGeometry(80, 0.05, 20);
    var mat = new THREE.MeshLambertMaterial({
      color:       0x223322,
      transparent: true,
      opacity:     0.7
    });
    _seaweedPlane = new THREE.Mesh(geo, mat);
    _seaweedPlane.position.set(0, 0.06, SEAWEED_Z);
    _scene.add(_seaweedPlane);
  }

  /* ── Rocky outcrop ───────────────────────────────────────────────────────── */
  function _buildRockyOutcrop() {
    var geo = new THREE.BoxGeometry(8, 3, 5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    _rockyOutcrop = new THREE.Mesh(geo, mat);
    _rockyOutcrop.position.set(-20, 1.5, ROCKY_OUTCROP_Z);
    _scene.add(_rockyOutcrop);
  }

  /* ── Shore camp ──────────────────────────────────────────────────────────── */
  function _buildShoreCamp() {
    /* camp structure */
    var geo = new THREE.BoxGeometry(6, 3, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x775533 });
    _shoreCamp = new THREE.Mesh(geo, mat);
    _shoreCamp.position.set(10, 1.5, 210);
    _scene.add(_shoreCamp);

    /* med kit box */
    var mkGeo = new THREE.BoxGeometry(1, 1, 1);
    var mkMat = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
    _medKitMesh = new THREE.Mesh(mkGeo, mkMat);
    _medKitMesh.position.set(8, 1, 208);
    _scene.add(_medKitMesh);

    /* flare pistol pickup */
    var fpGeo = new THREE.BoxGeometry(0.6, 0.4, 1.2);
    var fpMat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    _flarePickup = new THREE.Mesh(fpGeo, fpMat);
    _flarePickup.position.set(12, 1, 208);
    _scene.add(_flarePickup);
  }

  /* ── Shipwreck ───────────────────────────────────────────────────────────── */
  function _buildShipwreck() {
    _wreckPieces = [];
    var wrecks = [
      { x:  0, y: -0.5, z: -5,  w: 12, h: 2, d: 4 },
      { x:  8, y: -0.3, z: -12, w: 6,  h: 1, d: 8 },
      { x: -6, y: -0.4, z: -18, w: 8,  h: 2, d: 5 }
    ];
    for (var i = 0; i < wrecks.length; i++) {
      var w   = wrecks[i];
      var geo = new THREE.BoxGeometry(w.w, w.h, w.d);
      var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(w.x, w.y, w.z);
      mesh.rotation.y = (i * 0.4);
      _scene.add(mesh);
      _wreckPieces.push(mesh);
    }

    /* harpoon gun pickup near wreck */
    var hGeo = new THREE.BoxGeometry(0.4, 0.4, 2);
    var hMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    _harpoonPickup = new THREE.Mesh(hGeo, hMat);
    _harpoonPickup.position.set(5, 0.4, -10);
    _scene.add(_harpoonPickup);
  }

  /* ── Floating debris ─────────────────────────────────────────────────────── */
  function _buildDebris() {
    _debrisList = [];

    /* 8 planks/barrels scattered between Z=0 and Z=180 */
    var debrisData = [
      { x:  3,  z: 15,  type: 'plank',  w: 3, h: 0.3, d: 1.5, color: 0x664422 },
      { x: -8,  z: 30,  type: 'plank',  w: 4, h: 0.25, d: 1.2, color: 0x554433 },
      { x:  12, z: 50,  type: 'barrel', w: 1.2, h: 1.5, d: 1.2, color: 0x664422 },
      { x: -5,  z: 70,  type: 'plank',  w: 3.5, h: 0.3, d: 1.4, color: 0x554433 },
      { x:  7,  z: 90,  type: 'plank',  w: 2.8, h: 0.28, d: 1.3, color: 0x664422 },
      { x: -12, z: 110, type: 'barrel', w: 1.2, h: 1.5, d: 1.2, color: 0x664422 },
      { x:  4,  z: 140, type: 'plank',  w: 3.2, h: 0.3, d: 1.5, color: 0x554433 },
      { x: -7,  z: 170, type: 'plank',  w: 2.5, h: 0.3, d: 1.2, color: 0x664422 }
    ];

    for (var i = 0; i < debrisData.length; i++) {
      var d   = debrisData[i];
      var geo = new THREE.BoxGeometry(d.w, d.h, d.d);
      var mat = new THREE.MeshLambertMaterial({ color: d.color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, 0, d.z);
      _scene.add(mesh);
      _debrisList.push({
        mesh:     mesh,
        baseX:    d.x,
        baseZ:    d.z,
        bobPhase: i * 1.1,
        hp:       DEBRIS_HP,
        alive:    true,
        width:    d.w,
        depth:    d.d
      });
    }
  }

  /* ── Sharks ──────────────────────────────────────────────────────────────── */
  function _buildSharks(count) {
    for (var i = 0; i < count; i++) {
      _spawnShark(i * ((Math.PI * 2) / count), false);
    }
  }

  function _spawnShark(angle, fromEdge) {
    if (_sharks.length >= SHARK_COUNT_MAX) { return; }

    var startX, startZ;
    if (fromEdge) {
      startX = (Math.random() - 0.5) * 80;
      startZ = EXTRA_SHARK_SPAWN_Z;
    } else {
      startX = Math.cos(angle) * SHARK_ORBIT_RADIUS;
      startZ = Math.sin(angle) * SHARK_ORBIT_RADIUS;
    }

    /* great white body — cylinder horizontal */
    var bodyGeo = new THREE.CylinderGeometry(0.5, 0.35, 4, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x557799 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2; /* lay horizontal */

    /* dorsal fin — cone */
    var finGeo = new THREE.ConeGeometry(0.4, 1.2, 4);
    var finMat = new THREE.MeshLambertMaterial({ color: 0x446688 });
    var fin    = new THREE.Mesh(finGeo, finMat);
    fin.position.set(0, 0.8, -0.5);

    /* tail — box */
    var tailGeo = new THREE.BoxGeometry(0.3, 1.4, 0.4);
    var tailMat = new THREE.MeshLambertMaterial({ color: 0x446688 });
    var tail    = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(-2.2, 0, 0);

    var group = new THREE.Group();
    group.add(body);
    group.add(fin);
    group.add(tail);
    group.position.set(startX, -0.3, startZ);
    _scene.add(group);

    _sharks.push({
      group:      group,
      angle:      angle,
      state:      'orbit',        /* orbit | charge | circle */
      orbitZ:     0,              /* orbit center Z */
      biteCooldown: 0,
      chargeDir:  { x: 0, z: 0 },
      speed:      SHARK_ORBIT_SPEED,
      alive:      true,
      attracted:  fromEdge
    });
  }

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); }
    _hud = document.createElement('div');
    _hud.id = 'sa-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:13px',
      'color:#00FFAA',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 14px',
      'border-radius:4px',
      'display:none',
      'z-index:9999',
      'white-space:nowrap',
      'pointer-events:none',
      'text-shadow:0 0 5px #00FFAA'
    ].join(';');
    document.body.appendChild(_hud);
  }

  /* ── Underwater tint overlay ─────────────────────────────────────────────── */
  function _buildTint() {
    if (_tint && _tint.parentNode) { _tint.parentNode.removeChild(_tint); }
    _tint = document.createElement('div');
    _tint.id = 'sa-tint';
    _tint.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,30,80,0.45)',
      'display:none',
      'z-index:9997',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_tint);
  }

  /* ── Input listeners ─────────────────────────────────────────────────────── */
  function _attachInputListeners() {
    document.addEventListener('keydown',    _onKeyDown);
    document.addEventListener('keyup',      _onKeyUp);
    document.addEventListener('mousemove',  _onMouseMove);
    document.addEventListener('mousedown',  _onMouseDown);
    document.addEventListener('mouseup',    _onMouseUp);
    document.addEventListener('click',      _onMouseClick);
  }

  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    _keys[k] = true;

    /* activation detection: S + A within 400ms */
    if (k === 's') { _sDown = true; _sDownTime = Date.now(); }
    if (k === 'a') { _aDown = true; _aDownTime = Date.now(); }

    if (!_active && _sDown && _aDown) {
      var gap = Math.abs(_sDownTime - _aDownTime);
      if (gap < 400) {
        _active = true;
        _hud.style.display = 'block';
        /* request pointer lock for mouselook */
        if (document.body.requestPointerLock) {
          document.body.requestPointerLock();
        }
      }
    }

    if (!_active || _dead || _won) { return; }

    if (k === 'e') { _ePressed = true; }
    if (k === 'q') { _qPressed = true; }
  }

  function _onKeyUp(e) {
    var k = e.key.toLowerCase();
    _keys[k] = false;
    if (k === 's') { _sDown = false; }
    if (k === 'a') { _aDown = false; }
    if (k === 'e') { _ePressed = false; }
    if (k === 'q') { _qPressed = false; }
  }

  function _onMouseMove(e) {
    if (!_active || _dead || _won) { return; }
    var dx = e.movementX || e.mozMovementX || 0;
    var dy = e.movementY || e.mozMovementY || 0;
    _mouse.dx += dx;
    _mouse.dy += dy;
  }

  function _onMouseDown(e) {
    _mouse.down = true;
  }

  function _onMouseUp(e) {
    _mouse.down = false;
  }

  function _onMouseClick(e) {
    if (!_active || _dead || _won) { return; }
    _fireWeapon();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════════════════════════════════ */

  function update(dt) {
    if (!_initialized || !_active) { return; }
    if (_dead || _won) {
      _updateOverlay();
      return;
    }

    _time += dt;

    /* clamp dt to avoid physics explosions */
    if (dt > 0.1) { dt = 0.1; }

    _updateCamera(dt);
    _updatePlayerMovement(dt);
    _updateDebris(dt);
    _updateSharks(dt);
    _updateWeapons(dt);
    _updateBloodClouds(dt);
    _updateInteractions();
    _updateFlareProjectile(dt);
    _checkWinLose();
    _updateHUD();
    _updateTint();
  }

  /* ── Camera / mouselook ──────────────────────────────────────────────────── */
  function _updateCamera(dt) {
    var sens = 0.002;
    _yaw   -= _mouse.dx * sens;
    _pitch -= _mouse.dy * sens;
    if (_pitch >  1.2) { _pitch =  1.2; }
    if (_pitch < -1.2) { _pitch = -1.2; }
    _mouse.dx = 0;
    _mouse.dy = 0;

    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    /* camera follows player */
    var eyeY = _onDebris ? 1.7 : 1.2;  /* lower eye when swimming */
    _camera.position.set(_playerPos.x, _playerPos.y + eyeY, _playerPos.z);
  }

  /* ── Player movement ─────────────────────────────────────────────────────── */
  function _updatePlayerMovement(dt) {
    /* speed */
    var spd;
    if (_onDebris) {
      spd = DEBRIS_SPEED;
    } else if (_playerHP < 50) {
      spd = SWIM_SPEED_WOUNDED;
    } else {
      spd = SWIM_SPEED;
    }

    /* seaweed slowdown */
    var inSeaweed = (_playerPos.z >= SEAWEED_Z - 10 && _playerPos.z <= SEAWEED_Z + 10);
    if (inSeaweed && !_onDebris) { spd *= SEAWEED_SLOW; }

    /* submerged bonus slowdown */
    _submerged = (_playerPos.y < -0.2);
    if (_submerged) { spd *= 0.7; }

    /* direction vectors from camera yaw */
    var fwdX = -Math.sin(_yaw);
    var fwdZ = -Math.cos(_yaw);
    var rtX  =  Math.cos(_yaw);
    var rtZ  = -Math.sin(_yaw);

    var moved = false;
    if (_keys['w']) { _playerPos.x += fwdX * spd * dt; _playerPos.z += fwdZ * spd * dt; moved = true; }
    if (_keys['s'] && _active) {
      /* S can also mean "move backward" when active — but we only do backward when not also 'a' held for activation re-check */
      _playerPos.x -= fwdX * spd * dt;
      _playerPos.z -= fwdZ * spd * dt;
      moved = true;
    }
    if (_keys['a'] && _active) { _playerPos.x -= rtX * spd * dt; _playerPos.z -= rtZ * spd * dt; moved = true; }
    if (_keys['d']) { _playerPos.x += rtX * spd * dt; _playerPos.z += rtZ * spd * dt; }

    /* keep player on water surface (Y=0) unless on debris or rocky outcrop */
    if (!_onDebris) {
      /* rocky outcrop safe perch */
      var onRock = (Math.abs(_playerPos.x - (-20)) < 5 &&
                    Math.abs(_playerPos.z - ROCKY_OUTCROP_Z) < 4);
      if (onRock) {
        _playerPos.y = 3;
      } else {
        _playerPos.y = 0;
      }
    }
  }

  /* ── Debris update ───────────────────────────────────────────────────────── */
  function _updateDebris(dt) {
    for (var i = 0; i < _debrisList.length; i++) {
      var d = _debrisList[i];
      if (!d.alive) { continue; }

      /* bob */
      var bobY = Math.sin(_time * DEBRIS_BOB_SPEED + d.bobPhase) * DEBRIS_BOB_AMP;
      d.mesh.position.y = bobY;

      /* if player is on this debris, ride it */
      if (_onDebris && _onDebrisIdx === i) {
        _playerPos.y = bobY + 0.5;
      }

      /* shark chewing on debris */
      for (var j = 0; j < _sharks.length; j++) {
        var sh = _sharks[j];
        if (!sh.alive) { continue; }
        var sdx = sh.group.position.x - d.mesh.position.x;
        var sdz = sh.group.position.z - d.mesh.position.z;
        var sdist = Math.sqrt(sdx * sdx + sdz * sdz);
        if (sdist < 2.5) {
          d.hp -= DEBRIS_SHARK_DMG * dt;
          if (d.hp <= 0) {
            d.hp    = 0;
            d.alive = false;
            _scene.remove(d.mesh);
            if (_onDebris && _onDebrisIdx === i) {
              /* thrown off */
              _onDebris    = false;
              _onDebrisIdx = -1;
            }
          }
        }
      }
    }
  }

  /* ── Shark AI ────────────────────────────────────────────────────────────── */
  function _updateSharks(dt) {
    var bleeding = (_playerHP < _maxHP * BLEED_THRESHOLD_PCT);
    _bleeding    = bleeding;

    for (var i = 0; i < _sharks.length; i++) {
      var sh = _sharks[i];
      if (!sh.alive) { continue; }

      /* bite cooldown */
      if (sh.biteCooldown > 0) { sh.biteCooldown -= dt; }

      /* flare attraction overrides all */
      if (_flareFired && _flareTimer > 0 && _flarePos) {
        var ftdx = _flarePos.x - sh.group.position.x;
        var ftdz = _flarePos.z - sh.group.position.z;
        var ftd  = Math.sqrt(ftdx * ftdx + ftdz * ftdz) || 1;
        sh.group.position.x += (ftdx / ftd) * SHARK_ALERT_SPEED * dt;
        sh.group.position.z += (ftdz / ftd) * SHARK_ALERT_SPEED * dt;
        sh.group.rotation.y  = Math.atan2(ftdx, ftdz);
        continue;
      }

      var pdx  = _playerPos.x - sh.group.position.x;
      var pdz  = _playerPos.z - sh.group.position.z;
      var pdist = Math.sqrt(pdx * pdx + pdz * pdz);

      /* aggression modifier on plank */
      var aggroMult = _onDebris ? SHARK_PLANK_AGGRO : 1.0;

      /* seaweed zone: sharks avoid */
      var sharkInSeaweed = (sh.group.position.z >= SEAWEED_Z - 12 &&
                            sh.group.position.z <= SEAWEED_Z + 12);

      /* orbit center follows player Z slowly */
      sh.orbitZ += (_playerPos.z - sh.orbitZ) * dt * 0.3;

      if (sh.state === 'orbit') {
        /* advance orbit angle */
        sh.angle += SHARK_ORBIT_SPEED * aggroMult * dt;
        var orbitX = Math.cos(sh.angle) * SHARK_ORBIT_RADIUS + _playerPos.x * 0.3;
        var orbitZ = sh.orbitZ + Math.sin(sh.angle) * SHARK_ORBIT_RADIUS;

        /* avoid seaweed */
        if (sharkInSeaweed) { orbitZ = sh.group.position.z - 2 * dt; }

        sh.group.position.x = orbitX;
        sh.group.position.z = orbitZ;
        sh.group.position.y = -0.5 + Math.sin(_time + i) * 0.15;
        sh.group.rotation.y = Math.atan2(
          Math.sin(sh.angle + 0.1) - Math.sin(sh.angle),
          Math.cos(sh.angle + 0.1) - Math.cos(sh.angle)
        ) + Math.PI / 2;

        /* alert: bleeding or close enough to charge */
        if ((bleeding || pdist < SHARK_CHARGE_DIST) && !sharkInSeaweed) {
          sh.state = 'charge';
          var len = pdist || 1;
          sh.chargeDir.x = pdx / len;
          sh.chargeDir.z = pdz / len;
        }

      } else if (sh.state === 'charge') {
        /* chase player */
        if (!sharkInSeaweed) {
          sh.group.position.x += sh.chargeDir.x * SHARK_ALERT_SPEED * dt;
          sh.group.position.z += sh.chargeDir.z * SHARK_ALERT_SPEED * dt;
        }
        sh.group.position.y = -0.4;

        /* update direction towards player */
        var nd = pdist || 1;
        sh.chargeDir.x = pdx / nd;
        sh.chargeDir.z = pdz / nd;
        sh.group.rotation.y = Math.atan2(sh.chargeDir.x, sh.chargeDir.z);

        /* bite if close enough */
        if (pdist < SHARK_BITE_DIST && sh.biteCooldown <= 0) {
          _sharkBite(i);
          sh.state       = 'orbit';
          sh.biteCooldown = SHARK_BITE_COOLDOWN;
        }

        /* return to orbit if bleeding stopped */
        if (!bleeding && pdist > SHARK_ORBIT_RADIUS * 1.5) {
          sh.state = 'orbit';
        }
      }
    }
  }

  function _sharkBite(sharkIdx) {
    _playerHP -= SHARK_BITE_DAMAGE;
    if (_playerHP < 0) { _playerHP = 0; }

    /* blood cloud */
    _spawnBloodCloud();

    /* attract 2 extra sharks if bleeding and below max */
    if (_playerHP < _maxHP * BLEED_THRESHOLD_PCT && _sharks.length < SHARK_COUNT_MAX) {
      _spawnShark(Math.random() * Math.PI * 2, true);
      if (_sharks.length < SHARK_COUNT_MAX) {
        _spawnShark(Math.random() * Math.PI * 2, true);
      }
    }
  }

  /* ── Blood cloud ─────────────────────────────────────────────────────────── */
  function _spawnBloodCloud() {
    var geo = new THREE.SphereGeometry(1.5, 8, 8);
    var mat = new THREE.MeshBasicMaterial({
      color:       0x880000,
      transparent: true,
      opacity:     0.3,
      depthWrite:  false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(mesh);
    _bloodClouds.push({ mesh: mesh, life: BLOOD_CLOUD_LIFE });
  }

  function _updateBloodClouds(dt) {
    for (var i = _bloodClouds.length - 1; i >= 0; i--) {
      var bc = _bloodClouds[i];
      bc.life -= dt;
      /* fade out */
      bc.mesh.material.opacity = Math.max(0, 0.3 * (bc.life / BLOOD_CLOUD_LIFE));
      if (bc.life <= 0) {
        _scene.remove(bc.mesh);
        _bloodClouds.splice(i, 1);
      }
    }
  }

  /* ── Weapons ─────────────────────────────────────────────────────────────── */
  function _updateWeapons(dt) {
    /* harpoon reload */
    if (_hasHarpoon && _harpoonReload > 0) {
      _harpoonReload -= dt;
      if (_harpoonReload < 0) { _harpoonReload = 0; }
    }

    /* knife cooldown */
    if (_knifeTimer > 0) {
      _knifeTimer -= dt;
      if (_knifeTimer < 0) { _knifeTimer = 0; }
    }

    /* flare timer */
    if (_flareFired && _flareTimer > 0) {
      _flareTimer -= dt;
      if (_flareTimer <= 0) {
        _flareTimer = 0;
        _flareFired = false;
        if (_flareProjectile) {
          _scene.remove(_flareProjectile);
          _flareProjectile = null;
        }
      }
    }

    /* emergency knife — Q key */
    if (_qPressed && _knifeTimer <= 0) {
      _tryKnifeAttack();
    }
  }

  function _fireWeapon() {
    if (_hasFlare && !_flareFired) {
      /* flare shot */
      _flareFired = true;
      _flareTimer = FLARE_ATTRACT_DUR;

      /* flare projectile */
      var geo  = new THREE.SphereGeometry(0.3, 6, 6);
      var mat  = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
      var mesh = new THREE.Mesh(geo, mat);

      /* fire forward at mid range */
      var fx = _playerPos.x - Math.sin(_yaw) * 40;
      var fz = _playerPos.z - Math.cos(_yaw) * 40;
      mesh.position.set(fx, 2, fz);
      _scene.add(mesh);
      _flareProjectile = mesh;
      _flarePos = { x: fx, z: fz };
      return;
    }

    if (_hasHarpoon && _harpoonShots > 0 && _harpoonReload <= 0) {
      _harpoonShots--;
      if (_harpoonShots === 0) {
        _harpoonReload = HARPOON_RELOAD;
        _harpoonShots  = HARPOON_SHOTS;
      }
      _fireHarpoon();
      return;
    }
  }

  function _fireHarpoon() {
    /* ray along camera direction */
    var fwdX = -Math.sin(_yaw) * Math.cos(_pitch);
    var fwdZ = -Math.cos(_yaw) * Math.cos(_pitch);

    for (var i = 0; i < _sharks.length; i++) {
      var sh = _sharks[i];
      if (!sh.alive) { continue; }

      var sdx  = sh.group.position.x - _playerPos.x;
      var sdz  = sh.group.position.z - _playerPos.z;
      var dist = Math.sqrt(sdx * sdx + sdz * sdz);
      if (dist > HARPOON_RANGE) { continue; }

      /* dot product — check if roughly in front */
      var dotx = sdx / dist;
      var dotz = sdz / dist;
      var dot  = dotx * fwdX + dotz * fwdZ;
      if (dot > 0.7) {
        /* hit */
        sh.alive = false;
        _scene.remove(sh.group);
        _sharks.splice(i, 1);
        break;
      }
    }
  }

  function _tryKnifeAttack() {
    for (var i = 0; i < _sharks.length; i++) {
      var sh = _sharks[i];
      if (!sh.alive) { continue; }
      var sdx  = sh.group.position.x - _playerPos.x;
      var sdz  = sh.group.position.z - _playerPos.z;
      var dist = Math.sqrt(sdx * sdx + sdz * sdz);
      if (dist <= KNIFE_RANGE) {
        _knifeTimer = KNIFE_COOLDOWN;
        /* deal 120 dmg */
        sh.alive = false;
        _scene.remove(sh.group);
        _sharks.splice(i, 1);
        break;
      }
    }
  }

  /* ── Flare projectile visual ─────────────────────────────────────────────── */
  function _updateFlareProjectile(dt) {
    if (!_flareProjectile) { return; }
    /* glow pulse */
    var scale = 1 + 0.3 * Math.sin(_time * 8);
    _flareProjectile.scale.setScalar(scale);
  }

  /* ── Interactions (E key) ────────────────────────────────────────────────── */
  function _updateInteractions() {
    if (!_ePressed) { return; }
    _ePressed = false; /* consume */

    /* disembark first */
    if (_onDebris) {
      _onDebris    = false;
      _onDebrisIdx = -1;
      return;
    }

    /* try to board nearest alive debris */
    var best = -1;
    var bestD = DEBRIS_INTERACT_DIST;
    for (var i = 0; i < _debrisList.length; i++) {
      var d = _debrisList[i];
      if (!d.alive) { continue; }
      var dx = d.mesh.position.x - _playerPos.x;
      var dz = d.mesh.position.z - _playerPos.z;
      var dd = Math.sqrt(dx * dx + dz * dz);
      if (dd < bestD) { bestD = dd; best = i; }
    }
    if (best >= 0) {
      _onDebris    = true;
      _onDebrisIdx = best;
      return;
    }

    /* pick up harpoon */
    if (_harpoonPickup) {
      var hx = _harpoonPickup.position.x - _playerPos.x;
      var hz = _harpoonPickup.position.z - _playerPos.z;
      if (Math.sqrt(hx * hx + hz * hz) < 2.5) {
        _hasHarpoon  = true;
        _harpoonShots = HARPOON_SHOTS;
        _scene.remove(_harpoonPickup);
        _harpoonPickup = null;
        return;
      }
    }

    /* pick up flare at shore camp */
    if (_flarePickup && !_hasFlare) {
      var fpx = _flarePickup.position.x - _playerPos.x;
      var fpz = _flarePickup.position.z - _playerPos.z;
      if (Math.sqrt(fpx * fpx + fpz * fpz) < 3) {
        _hasFlare = true;
        _scene.remove(_flarePickup);
        _flarePickup = null;
        return;
      }
    }

    /* med kit at shore camp */
    if (_medKitMesh) {
      var mx = _medKitMesh.position.x - _playerPos.x;
      var mz = _medKitMesh.position.z - _playerPos.z;
      if (Math.sqrt(mx * mx + mz * mz) < 3) {
        _playerHP = _maxHP;
        _scene.remove(_medKitMesh);
        _medKitMesh = null;
        /* also reload harpoon */
        _harpoonShots  = HARPOON_SHOTS;
        _harpoonReload = 0;
        return;
      }
    }
  }

  /* ── Win / Lose checks ───────────────────────────────────────────────────── */
  function _checkWinLose() {
    if (_playerHP <= 0) {
      _dead = true;
      _showOverlay('YOU WERE EATEN', '#FF2200');
      return;
    }
    if (_playerPos.z >= SHORE_Z) {
      _won = true;
      _showOverlay('RESCUED! YOU SURVIVED!', '#00FF88');
    }
  }

  function _showOverlay(msg, color) {
    if (_overlay && _overlay.parentNode) { _overlay.parentNode.removeChild(_overlay); }
    _overlay = document.createElement('div');
    _overlay.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'color:' + color,
      'background:rgba(0,0,0,0.75)',
      'padding:20px 40px',
      'border-radius:8px',
      'z-index:10000',
      'pointer-events:none',
      'text-shadow:0 0 20px ' + color
    ].join(';');
    _overlay.textContent = msg;
    document.body.appendChild(_overlay);
  }

  function _updateOverlay() { /* nothing dynamic needed */ }

  /* ── HUD update ──────────────────────────────────────────────────────────── */
  function _updateHUD() {
    if (!_hud) { return; }

    var distToShore = Math.max(0, Math.floor(SHORE_Z - _playerPos.z));
    var sharkCount  = 0;
    for (var i = 0; i < _sharks.length; i++) {
      if (_sharks[i].alive) { sharkCount++; }
    }

    var harpoonStr;
    if (!_hasHarpoon) {
      harpoonStr = '--';
    } else if (_harpoonReload > 0) {
      harpoonStr = 'RELOAD ' + _harpoonReload.toFixed(1) + 's';
    } else {
      harpoonStr = _harpoonShots + ' shots';
    }

    var bleedStr  = _bleeding           ? 'YES' : 'NO';
    var debrisStr = _onDebris           ? 'ON'  : 'OFF';
    var flareStr  = _hasFlare
      ? (_flareFired ? 'FIRED ' + Math.ceil(_flareTimer) + 's' : 'READY')
      : 'N/A';

    _hud.textContent =
      'SHARK ATTACK' +
      ' [DISTANCE TO SHORE: ' + distToShore + 'm]' +
      ' [SHARKS: '   + sharkCount  + ']' +
      ' [HP: '       + Math.ceil(_playerHP) + ']' +
      ' [HARPOON: '  + harpoonStr  + ']' +
      ' [FLARE: '    + flareStr    + ']' +
      ' | BLEEDING: ' + bleedStr   +
      ' DEBRIS: '     + debrisStr;
  }

  /* ── Underwater tint ─────────────────────────────────────────────────────── */
  function _updateTint() {
    if (!_tint) { return; }
    _tint.style.display = (_playerPos.y < -0.15) ? 'block' : 'none';
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RESET
     ═══════════════════════════════════════════════════════════════════════════ */

  function reset() {
    if (!_initialized) { return; }

    /* remove scene objects */
    if (_waterPlane)   { _scene.remove(_waterPlane);   _waterPlane   = null; }
    if (_sandPlane)    { _scene.remove(_sandPlane);     _sandPlane    = null; }
    if (_seaweedPlane) { _scene.remove(_seaweedPlane);  _seaweedPlane = null; }
    if (_rockyOutcrop) { _scene.remove(_rockyOutcrop);  _rockyOutcrop = null; }
    if (_shoreCamp)    { _scene.remove(_shoreCamp);     _shoreCamp    = null; }
    if (_medKitMesh)   { _scene.remove(_medKitMesh);    _medKitMesh   = null; }
    if (_flarePickup)  { _scene.remove(_flarePickup);   _flarePickup  = null; }
    if (_harpoonPickup){ _scene.remove(_harpoonPickup); _harpoonPickup= null; }
    if (_flareProjectile){ _scene.remove(_flareProjectile); _flareProjectile = null; }

    for (var i = 0; i < _wreckPieces.length; i++) { _scene.remove(_wreckPieces[i]); }
    _wreckPieces = [];

    for (var j = 0; j < _palmTrees.length; j++) { _scene.remove(_palmTrees[j]); }
    _palmTrees = [];

    for (var k = 0; k < _debrisList.length; k++) { _scene.remove(_debrisList[k].mesh); }
    _debrisList = [];

    for (var s = 0; s < _sharks.length; s++) { _scene.remove(_sharks[s].group); }
    _sharks = [];

    for (var b = 0; b < _bloodClouds.length; b++) { _scene.remove(_bloodClouds[b].mesh); }
    _bloodClouds = [];

    /* remove DOM */
    if (_hud && _hud.parentNode)     { _hud.parentNode.removeChild(_hud);         _hud     = null; }
    if (_tint && _tint.parentNode)   { _tint.parentNode.removeChild(_tint);       _tint    = null; }
    if (_overlay && _overlay.parentNode) { _overlay.parentNode.removeChild(_overlay); _overlay = null; }

    /* remove listeners */
    document.removeEventListener('keydown',   _onKeyDown);
    document.removeEventListener('keyup',     _onKeyUp);
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('mousedown', _onMouseDown);
    document.removeEventListener('mouseup',   _onMouseUp);
    document.removeEventListener('click',     _onMouseClick);

    /* reset state */
    _active      = false;
    _playerPos   = { x: 0, y: 0.1, z: 0 };
    _playerHP    = 100;
    _onDebris    = false;
    _onDebrisIdx = -1;
    _submerged   = false;
    _bleeding    = false;
    _dead        = false;
    _won         = false;
    _hasHarpoon  = false;
    _harpoonShots= 0;
    _harpoonReload = 0;
    _hasFlare    = false;
    _flareFired  = false;
    _flarePos    = null;
    _flareTimer  = 0;
    _knifeTimer  = 0;
    _keys        = {};
    _yaw         = 0;
    _pitch       = 0;
    _sDown       = false;
    _aDown       = false;
    _time        = 0;
    _initialized = false;
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
