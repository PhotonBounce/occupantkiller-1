// ============================================================
//  space-station-attack.js — Space Station Under Attack module
//  Activation: S+S (S then S within 400ms)
//  Zero-G corridors, alien boarders, laser defense systems,
//  hull breaches, escape pods launching
// ============================================================
window.SpaceStationAttack = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW = 400; // ms
  var ALIEN_COUNT = 6;
  var DEFENDER_COUNT = 4;
  var TURRET_COUNT = 3;
  var POD_COUNT = 3;
  var ALIEN_SPEED = 1.2;
  var CRATE_DRIFT_RADIUS = 2.5;
  var CRATE_DRIFT_SPEED = 0.4;
  var PULSE_SPEED = 2.0;
  var FLICKER_SPEED = 8.0;
  var LAUNCH_SPEED = 6.0;
  var POD_LAUNCH_DISTANCE = 30;

  // ── State ────────────────────────────────────────────────────────────────
  var _active = false;
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _clock = null;
  var _canvas = null;
  var _ctx = null;
  var _hudVisible = true;

  // Key tracking for S+S combo
  var _sPressTime = 0;
  var _sCount = 0;

  // Scene objects (tracked for disposal)
  var _meshes = [];
  var _materials = [];
  var _geometries = [];

  // Scene groups / animated objects
  var _aliens = [];
  var _turrets = [];
  var _debrisChunks = [];
  var _floatingCrate = null;
  var _emergencyLights = [];
  var _escapePods = [];
  var _explosionVent = null;

  // HUD state
  var _aliensEliminated = 0;
  var _hullIntegrity = 78;
  var _podsReady = 3;

  // Pod launch state
  var _podLaunched = [false, false, false];
  var _podLaunchTimer = [0, 0, 0];

  // Animation state
  var _time = 0;
  var _frameId = null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function _makeGeo(geo) {
    _geometries.push(geo);
    return geo;
  }

  function _makeMat(mat) {
    _materials.push(mat);
    return mat;
  }

  function _makeMesh(geo, mat) {
    var mesh = new THREE.Mesh(geo, mat);
    _meshes.push(mesh);
    return mesh;
  }

  function _addToScene(obj) {
    _scene.add(obj);
    return obj;
  }

  // ── Build Scene ──────────────────────────────────────────────────────────
  function _buildScene() {

    // 1. Station floor corridor — large flat box, grey metal
    var floorGeo = _makeGeo(new THREE.BoxGeometry(30, 0.5, 12));
    var floorMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 0.8, metalness: 0.6 }));
    var floor = _makeMesh(floorGeo, floorMat);
    floor.position.set(0, -2.5, 0);
    _addToScene(floor);

    // 2. Station walls — box panels with emissive light strips
    var wallMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.7, metalness: 0.5 }));
    var wallGeo = _makeGeo(new THREE.BoxGeometry(30, 7, 0.4));

    var wallBack = _makeMesh(wallGeo, wallMat);
    wallBack.position.set(0, 1, -6);
    _addToScene(wallBack);

    var wallFront = _makeMesh(wallGeo, wallMat);
    wallFront.position.set(0, 1, 6);
    _addToScene(wallFront);

    // Ceiling
    var ceilGeo = _makeGeo(new THREE.BoxGeometry(30, 0.5, 12));
    var ceilMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.7, metalness: 0.5 }));
    var ceiling = _makeMesh(ceilGeo, ceilMat);
    ceiling.position.set(0, 5, 0);
    _addToScene(ceiling);

    // Emissive light strip along back wall
    var stripGeo = _makeGeo(new THREE.BoxGeometry(28, 0.2, 0.2));
    var stripMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x224488, emissiveIntensity: 1.2 }));
    var strip1 = _makeMesh(stripGeo, stripMat);
    strip1.position.set(0, 3.5, -5.7);
    _addToScene(strip1);

    var strip2 = _makeMesh(stripGeo, stripMat);
    strip2.position.set(0, 3.5, 5.7);
    _addToScene(strip2);

    // 3. Alien invaders — box+sphere figures with emissive eyes, 6 aliens
    var alienBodyGeo = _makeGeo(new THREE.BoxGeometry(0.6, 0.8, 0.4));
    var alienHeadGeo = _makeGeo(new THREE.BoxGeometry(0.55, 0.55, 0.45));
    var alienEyeGeo = _makeGeo(new THREE.BoxGeometry(0.12, 0.08, 0.1));
    var alienBodyMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x1a6b2a, roughness: 0.6, metalness: 0.2 }));
    var alienEyeMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0 }));

    var alienStartX = [-12, -10, -8, -6, -4, -2];
    var alienStartZ = [-1.5, 1.5, -2, 2, -1, 1];

    for (var ai = 0; ai < ALIEN_COUNT; ai++) {
      var alienGroup = new THREE.Group();

      var aBody = _makeMesh(alienBodyGeo, alienBodyMat);
      aBody.position.set(0, 0, 0);
      alienGroup.add(aBody);

      var aHead = _makeMesh(alienHeadGeo, alienBodyMat);
      aHead.position.set(0, 0.7, 0);
      alienGroup.add(aHead);

      var aEyeL = _makeMesh(alienEyeGeo, alienEyeMat);
      aEyeL.position.set(-0.12, 0.75, 0.23);
      alienGroup.add(aEyeL);

      var aEyeR = _makeMesh(alienEyeGeo, alienEyeMat);
      aEyeR.position.set(0.12, 0.75, 0.23);
      alienGroup.add(aEyeR);

      alienGroup.position.set(alienStartX[ai], -1.5, alienStartZ[ai]);
      _scene.add(alienGroup);
      _aliens.push({ group: alienGroup, startX: alienStartX[ai], alive: true, elimTimer: -1 });
    }

    // 4. Human defenders — box+sphere in space suits, 4 defenders
    var defBodyGeo = _makeGeo(new THREE.BoxGeometry(0.65, 0.85, 0.45));
    var defHeadGeo = _makeGeo(new THREE.BoxGeometry(0.6, 0.6, 0.5));
    var defVisorGeo = _makeGeo(new THREE.BoxGeometry(0.35, 0.25, 0.15));
    var defBodyMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.5, metalness: 0.4 }));
    var defVisorMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x8888ff, emissive: 0x4444aa, emissiveIntensity: 0.8 }));

    var defPositions = [
      [4, -1.5, -2.5],
      [6, -1.5, 2.5],
      [8, -1.5, -1.5],
      [10, -1.5, 1.5]
    ];

    for (var di = 0; di < DEFENDER_COUNT; di++) {
      var defGroup = new THREE.Group();

      var dBody = _makeMesh(defBodyGeo, defBodyMat);
      defGroup.add(dBody);

      var dHead = _makeMesh(defHeadGeo, defBodyMat);
      dHead.position.set(0, 0.75, 0);
      defGroup.add(dHead);

      var dVisor = _makeMesh(defVisorGeo, defVisorMat);
      dVisor.position.set(0, 0.77, 0.28);
      defGroup.add(dVisor);

      defGroup.position.set(defPositions[di][0], defPositions[di][1], defPositions[di][2]);
      _scene.add(defGroup);
    }

    // 5. Laser turrets — cylinder + box mount, 3 turrets
    var turretCylGeo = _makeGeo(new THREE.CylinderGeometry(0.15, 0.2, 0.6, 8));
    var turretMountGeo = _makeGeo(new THREE.BoxGeometry(0.5, 0.25, 0.5));
    var turretBarrelGeo = _makeGeo(new THREE.BoxGeometry(0.08, 0.5, 0.08));
    var turretMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.4, metalness: 0.8 }));
    var laserMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.0 }));

    var turretPositions = [
      [2, 4.5, -5],
      [6, 4.5, 5],
      [10, 4.5, -5]
    ];

    for (var ti = 0; ti < TURRET_COUNT; ti++) {
      var turretGroup = new THREE.Group();

      var tMount = _makeMesh(turretMountGeo, turretMat);
      turretGroup.add(tMount);

      var tCyl = _makeMesh(turretCylGeo, turretMat);
      tCyl.position.set(0, 0.4, 0);
      turretGroup.add(tCyl);

      var tBarrel = _makeMesh(turretBarrelGeo, laserMat);
      tBarrel.position.set(0, 0.7, 0.3);
      tBarrel.rotation.x = Math.PI / 4;
      turretGroup.add(tBarrel);

      turretGroup.position.set(turretPositions[ti][0], turretPositions[ti][1], turretPositions[ti][2]);
      _scene.add(turretGroup);
      _turrets.push({ group: turretGroup, barrel: tBarrel });
    }

    // 6. Hull breach hole — dark box gap + emissive stars beyond
    var breachGeo = _makeGeo(new THREE.BoxGeometry(2.5, 2.5, 0.5));
    var breachMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 1.0 }));
    var breach = _makeMesh(breachGeo, breachMat);
    breach.position.set(-10, 1.5, -6);
    _addToScene(breach);

    // Stars beyond the breach
    var starsGeo = _makeGeo(new THREE.BoxGeometry(2.2, 2.2, 0.1));
    var starsMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x000020, emissive: 0x112244, emissiveIntensity: 1.5 }));
    var stars = _makeMesh(starsGeo, starsMat);
    stars.position.set(-10, 1.5, -6.3);
    _addToScene(stars);

    // Breach glow — emissive orange vent
    var ventGeo = _makeGeo(new THREE.BoxGeometry(0.3, 0.3, 0.3));
    var ventMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 3.0 }));
    _explosionVent = _makeMesh(ventGeo, ventMat);
    _explosionVent.position.set(-9.5, 2.5, -5.8);
    _addToScene(_explosionVent);

    // 7. Escape pod bay — box housing + 3 cylinder pods
    var podBayGeo = _makeGeo(new THREE.BoxGeometry(5, 4, 3));
    var podBayMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.7, metalness: 0.5 }));
    var podBay = _makeMesh(podBayGeo, podBayMat);
    podBay.position.set(13, 0.5, 0);
    _addToScene(podBay);

    var podCylGeo = _makeGeo(new THREE.CylinderGeometry(0.4, 0.5, 1.8, 10));
    var podMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0xaaaacc, roughness: 0.3, metalness: 0.7 }));

    var podOffsets = [-1, 0, 1];
    for (var pi = 0; pi < POD_COUNT; pi++) {
      var pod = _makeMesh(podCylGeo, podMat);
      pod.rotation.z = Math.PI / 2;
      pod.position.set(13, 0.5 + podOffsets[pi] * 1.2, 0);
      _addToScene(pod);
      _escapePods.push(pod);
    }

    // 8. Airlock door — box, partially open
    var airlockGeo = _makeGeo(new THREE.BoxGeometry(0.3, 4, 3));
    var airlockMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x777788, roughness: 0.5, metalness: 0.7 }));
    var airlock = _makeMesh(airlockGeo, airlockMat);
    airlock.position.set(-14, 0, 0);
    _addToScene(airlock);

    // Door gap indicator (partially open)
    var gapGeo = _makeGeo(new THREE.BoxGeometry(0.4, 1.5, 1.2));
    var gapMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x000010, emissive: 0x000022, emissiveIntensity: 1.0 }));
    var gap = _makeMesh(gapGeo, gapMat);
    gap.position.set(-14, 1.2, 0);
    _addToScene(gap);

    // 9. Control panel consoles — box with emissive sphere buttons
    var consoleBodies = [
      [-5, -1.5, -5.5],
      [0, -1.5, -5.5],
      [5, -1.5, -5.5]
    ];
    var consoleGeo = _makeGeo(new THREE.BoxGeometry(1.5, 1.2, 0.6));
    var consoleMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.6, metalness: 0.5 }));
    var btnGeo = _makeGeo(new THREE.BoxGeometry(0.12, 0.12, 0.12));
    var btnColors = [0x00ff44, 0xff4400, 0xffcc00];
    var btnMats = [];
    for (var bi = 0; bi < 3; bi++) {
      btnMats.push(_makeMat(new THREE.MeshStandardMaterial({ color: btnColors[bi], emissive: btnColors[bi], emissiveIntensity: 1.5 })));
    }

    for (var ci = 0; ci < consoleBodies.length; ci++) {
      var cons = _makeMesh(consoleGeo, consoleMat);
      cons.position.set(consoleBodies[ci][0], consoleBodies[ci][1], consoleBodies[ci][2]);
      _addToScene(cons);

      for (var bj = 0; bj < 3; bj++) {
        var btn = _makeMesh(btnGeo, btnMats[bj]);
        btn.position.set(consoleBodies[ci][0] + (bj - 1) * 0.25, consoleBodies[ci][1] + 0.7, consoleBodies[ci][2] + 0.28);
        _addToScene(btn);
      }
    }

    // 10. Floating debris — various box fragments, rotating
    var debrisData = [
      { sx: 0.4, sy: 0.3, sz: 0.2, px: -3, py: 1.5, pz: 3 },
      { sx: 0.3, sy: 0.5, sz: 0.35, px: 1, py: 2, pz: -3 },
      { sx: 0.5, sy: 0.2, sz: 0.4, px: -7, py: 1, pz: 2 },
      { sx: 0.2, sy: 0.4, sz: 0.3, px: 3, py: 3, pz: 1 },
      { sx: 0.35, sy: 0.35, sz: 0.25, px: -1, py: 2.5, pz: -1 },
      { sx: 0.25, sy: 0.3, sz: 0.45, px: 7, py: 1.5, pz: -2 }
    ];
    var debrisMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x666677, roughness: 0.9, metalness: 0.4 }));

    for (var dbi = 0; dbi < debrisData.length; dbi++) {
      var dd = debrisData[dbi];
      var dGeo = _makeGeo(new THREE.BoxGeometry(dd.sx, dd.sy, dd.sz));
      var dMesh = _makeMesh(dGeo, debrisMat);
      dMesh.position.set(dd.px, dd.py, dd.pz);
      _addToScene(dMesh);
      _debrisChunks.push({
        mesh: dMesh,
        rx: (Math.random() - 0.5) * 2,
        ry: (Math.random() - 0.5) * 2,
        rz: (Math.random() - 0.5) * 2
      });
    }

    // 11. Emergency lighting — emissive red sphere strips (box shapes)
    var elGeo = _makeGeo(new THREE.BoxGeometry(0.25, 0.25, 0.25));
    var elMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 2.5 }));
    var elPositions = [
      [-12, 4.5, -5.5], [-8, 4.5, 5.5], [-4, 4.5, -5.5],
      [0, 4.5, 5.5], [4, 4.5, -5.5], [8, 4.5, 5.5], [12, 4.5, -5.5]
    ];
    for (var eli = 0; eli < elPositions.length; eli++) {
      var elMesh = _makeMesh(elGeo, elMat);
      elMesh.position.set(elPositions[eli][0], elPositions[eli][1], elPositions[eli][2]);
      _addToScene(elMesh);
      _emergencyLights.push(elMesh);
    }

    // 12. Medical bay — box room + cross marker
    var medGeo = _makeGeo(new THREE.BoxGeometry(4, 4, 4));
    var medMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0xddeeff, roughness: 0.8, metalness: 0.1 }));
    var medBay = _makeMesh(medGeo, medMat);
    medBay.position.set(8, 0.5, -4);
    _addToScene(medBay);

    // Cross marker horizontal
    var crossHGeo = _makeGeo(new THREE.BoxGeometry(1.4, 0.35, 0.15));
    var crossMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xaa0000, emissiveIntensity: 0.6 }));
    var crossH = _makeMesh(crossHGeo, crossMat);
    crossH.position.set(8, 2.6, -2.05);
    _addToScene(crossH);

    // Cross marker vertical
    var crossVGeo = _makeGeo(new THREE.BoxGeometry(0.35, 1.4, 0.15));
    var crossV = _makeMesh(crossVGeo, crossMat);
    crossV.position.set(8, 2.6, -2.05);
    _addToScene(crossV);

    // 13. Weapon rack — box + cylinder rifle shapes
    var rackGeo = _makeGeo(new THREE.BoxGeometry(0.2, 2, 1.5));
    var rackMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.9 }));
    var rack = _makeMesh(rackGeo, rackMat);
    rack.position.set(4, -0.5, -5.8);
    _addToScene(rack);

    var rifleCylGeo = _makeGeo(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6));
    var rifleMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 0.5, metalness: 0.8 }));
    var rifleOffsets = [-0.4, 0, 0.4];
    for (var ri = 0; ri < 3; ri++) {
      var rifle = _makeMesh(rifleCylGeo, rifleMat);
      rifle.rotation.z = Math.PI / 2;
      rifle.position.set(4.15, -0.3, -5.8 + rifleOffsets[ri]);
      _addToScene(rifle);
    }

    // 14. Zero-G floating crate — box slowly drifting in circle
    var crateGeo = _makeGeo(new THREE.BoxGeometry(0.8, 0.8, 0.8));
    var crateMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0xbb8833, roughness: 0.8, metalness: 0.3 }));
    _floatingCrate = _makeMesh(crateGeo, crateMat);
    _floatingCrate.position.set(0, 1.5, 0);
    _addToScene(_floatingCrate);

    // 15. Station exterior hull segment — box seen through window
    var hullGeo = _makeGeo(new THREE.BoxGeometry(8, 3, 0.8));
    var hullMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.6, metalness: 0.7 }));
    var hull = _makeMesh(hullGeo, hullMat);
    hull.position.set(0, 3.5, -8);
    _addToScene(hull);

    // 16. Planet view — large emissive sphere beyond window
    var planetGeo = _makeGeo(new THREE.BoxGeometry(6, 6, 1));
    var planetMat = _makeMat(new THREE.MeshStandardMaterial({ color: 0x1155bb, emissive: 0x112255, emissiveIntensity: 0.8 }));
    var planet = _makeMesh(planetGeo, planetMat);
    planet.position.set(-5, 2, -8);
    _addToScene(planet);

    // 17. Explosion vent already added in item 6 (_explosionVent)

    // ── Lighting ──────────────────────────────────────────────────────────
    var ambientLight = new THREE.AmbientLight(0x222233, 0.6);
    _scene.add(ambientLight);

    var mainLight = new THREE.DirectionalLight(0xaabbff, 0.8);
    mainLight.position.set(5, 10, 5);
    _scene.add(mainLight);

    var redLight = new THREE.PointLight(0xff2200, 1.5, 15);
    redLight.position.set(-10, 3, 0);
    _scene.add(redLight);

    var blueLight = new THREE.PointLight(0x0044ff, 1.0, 20);
    blueLight.position.set(5, 2, 0);
    _scene.add(blueLight);
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _canvas = document.createElement('canvas');
    _canvas.id = 'ssa-hud';
    _canvas.width = 400;
    _canvas.height = 120;
    _canvas.style.cssText = 'position:fixed;top:12px;left:12px;z-index:9999;pointer-events:none;opacity:0.92;';
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  function _drawHUD() {
    if (!_ctx || !_hudVisible) {
      if (_canvas) _canvas.style.display = _hudVisible ? 'block' : 'none';
      return;
    }
    _canvas.style.display = 'block';

    _ctx.clearRect(0, 0, 400, 120);

    // Background
    _ctx.fillStyle = 'rgba(0, 5, 20, 0.78)';
    _ctx.strokeStyle = '#003366';
    _ctx.lineWidth = 2;
    _ctx.beginPath();
    _ctx.roundRect(6, 6, 388, 108, 8);
    _ctx.fill();
    _ctx.stroke();

    _ctx.font = 'bold 13px monospace';
    _ctx.fillStyle = '#ff4444';
    _ctx.fillText('ALIENS ELIMINATED: ' + _aliensEliminated + '/' + ALIEN_COUNT, 20, 36);

    _ctx.fillStyle = _hullIntegrity < 40 ? '#ff6600' : '#44ff88';
    _ctx.fillText('HULL INTEGRITY: ' + _hullIntegrity + '%', 20, 62);

    _ctx.fillStyle = '#88ccff';
    _ctx.fillText('ESCAPE PODS READY: ' + _podsReady, 20, 88);

    _ctx.fillStyle = 'rgba(0,180,255,0.4)';
    _ctx.font = '10px monospace';
    _ctx.fillText('[ S+S to toggle HUD ]', 260, 108);
  }

  // ── Animation / Update ───────────────────────────────────────────────────
  function _animateAliens(dt) {
    for (var i = 0; i < _aliens.length; i++) {
      var a = _aliens[i];
      if (!a.alive) continue;
      a.group.position.x += ALIEN_SPEED * dt;

      // When alien reaches defenders zone, mark eliminated (simulate defense)
      if (a.group.position.x > 12) {
        a.alive = false;
        a.group.visible = false;
        _aliensEliminated++;
      }
    }
  }

  function _animateTurrets(dt) {
    for (var ti = 0; ti < _turrets.length; ti++) {
      var t = _turrets[ti];
      // Find nearest alive alien
      var nearest = null;
      var nearDist = Infinity;
      for (var ai = 0; ai < _aliens.length; ai++) {
        if (!_aliens[ai].alive) continue;
        var dx = _aliens[ai].group.position.x - t.group.position.x;
        var dz = _aliens[ai].group.position.z - t.group.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < nearDist) {
          nearDist = dist;
          nearest = _aliens[ai];
        }
      }
      if (nearest) {
        var targetAngle = Math.atan2(
          nearest.group.position.x - t.group.position.x,
          nearest.group.position.z - t.group.position.z
        );
        t.group.rotation.y = targetAngle;
      }
    }
  }

  function _animateDebris(dt) {
    for (var i = 0; i < _debrisChunks.length; i++) {
      var d = _debrisChunks[i];
      d.mesh.rotation.x += d.rx * dt;
      d.mesh.rotation.y += d.ry * dt;
      d.mesh.rotation.z += d.rz * dt;
    }
  }

  function _animateCrate(t) {
    if (!_floatingCrate) return;
    _floatingCrate.position.x = Math.cos(_time * CRATE_DRIFT_SPEED) * CRATE_DRIFT_RADIUS;
    _floatingCrate.position.z = Math.sin(_time * CRATE_DRIFT_SPEED) * CRATE_DRIFT_RADIUS;
    _floatingCrate.position.y = 1.5 + Math.sin(_time * CRATE_DRIFT_SPEED * 1.3) * 0.4;
    _floatingCrate.rotation.y += 0.3 * t;
  }

  function _animateEmergencyLights() {
    var pulse = 0.5 + 0.5 * Math.sin(_time * PULSE_SPEED);
    for (var i = 0; i < _emergencyLights.length; i++) {
      _emergencyLights[i].material.emissiveIntensity = 1.0 + pulse * 2.5;
    }
  }

  function _animateEscapePods(dt) {
    // Launch pods one by one when aliens get close
    var aliensNear = 0;
    for (var ai = 0; ai < _aliens.length; ai++) {
      if (_aliens[ai].alive && _aliens[ai].group.position.x > 8) aliensNear++;
    }

    for (var pi = 0; pi < POD_COUNT; pi++) {
      if (!_podLaunched[pi] && aliensNear > pi) {
        _podLaunched[pi] = true;
        _podsReady = Math.max(0, _podsReady - 1);
      }
      if (_podLaunched[pi]) {
        _escapePods[pi].position.x += LAUNCH_SPEED * dt;
        if (_escapePods[pi].position.x > 13 + POD_LAUNCH_DISTANCE) {
          _escapePods[pi].position.x = 13 + POD_LAUNCH_DISTANCE; // clamp
        }
      }
    }
  }

  function _animateExplosionVent() {
    if (!_explosionVent) return;
    var flicker = 0.5 + 0.5 * Math.sin(_time * FLICKER_SPEED + Math.sin(_time * 3.7) * 2.1);
    _explosionVent.material.emissiveIntensity = 1.5 + flicker * 4.0;
    var scale = 0.8 + flicker * 0.5;
    _explosionVent.scale.set(scale, scale, scale);
  }

  // ── Core Loop ────────────────────────────────────────────────────────────
  // Drives all per-frame animation. This module decorates the MAIN game scene,
  // so it must NOT run its own render loop — the GameManager render loop already
  // renders _scene every frame. Animation is pumped via the update(dt) hook
  // that GameManager calls. (A prior version ran a private rAF loop that called
  // _renderer.render(); because init() is only ever passed (scene, camera) — no
  // renderer — that produced an uncaught "reading 'render' of undefined" crash.)
  function _step(dt) {
    if (!_active) return;
    if (!dt || dt <= 0 || dt > 0.25) dt = 1 / 60; // clamp stalls / bad deltas
    _time += dt;

    _animateAliens(dt);
    _animateTurrets(dt);
    _animateDebris(dt);
    _animateCrate(dt);
    _animateEmergencyLights();
    _animateEscapePods(dt);
    _animateExplosionVent();

    _drawHUD();
  }

  // ── Keyboard handling ────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (!_active) return;
    if (e.key === 's' || e.key === 'S') {
      var now = performance.now();
      if (_sCount === 1 && now - _sPressTime < ACTIVATION_WINDOW) {
        _hudVisible = !_hudVisible;
        _sCount = 0;
      } else {
        _sCount = 1;
        _sPressTime = now;
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────
  function init(scene, camera, renderer) {
    if (_active) return;
    _active = true;
    _scene = scene;
    _camera = camera;
    _renderer = renderer;
    _clock = new THREE.Clock();

    _aliensEliminated = 0;
    _hullIntegrity = 78;
    _podsReady = 3;
    _podLaunched = [false, false, false];
    _podLaunchTimer = [0, 0, 0];
    _time = 0;

    _buildScene();
    _buildHUD();

    document.addEventListener('keydown', _onKeyDown);
    // No private render loop: animation is pumped by update(dt) below.
  }

  function update(dt) {
    _step(dt);
  }

  function reset() {
    _active = false;

    if (_frameId !== null) {
      cancelAnimationFrame(_frameId);
      _frameId = null;
    }

    document.removeEventListener('keydown', _onKeyDown);

    // Remove alien groups
    for (var ai = 0; ai < _aliens.length; ai++) {
      _scene.remove(_aliens[ai].group);
    }
    _aliens = [];

    // Remove turret groups
    for (var ti = 0; ti < _turrets.length; ti++) {
      _scene.remove(_turrets[ti].group);
    }
    _turrets = [];

    // Dispose geometries
    for (var gi = 0; gi < _geometries.length; gi++) {
      _geometries[gi].dispose();
    }
    _geometries = [];

    // Dispose materials
    for (var mi = 0; mi < _materials.length; mi++) {
      _materials[mi].dispose();
    }
    _materials = [];

    // Remove meshes from scene
    for (var msi = 0; msi < _meshes.length; msi++) {
      if (_scene) _scene.remove(_meshes[msi]);
    }
    _meshes = [];

    _debrisChunks = [];
    _emergencyLights = [];
    _escapePods = [];
    _floatingCrate = null;
    _explosionVent = null;
    _podLaunched = [false, false, false];
    _podLaunchTimer = [0, 0, 0];

    // Remove HUD
    if (_canvas && _canvas.parentNode) {
      _canvas.parentNode.removeChild(_canvas);
    }
    _canvas = null;
    _ctx = null;

    _scene = null;
    _camera = null;
    _renderer = null;
    _clock = null;
  }

  return { init: init, update: update, reset: reset };

}());
