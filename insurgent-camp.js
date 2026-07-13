window.InsurgentCamp = (function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────────
  var _scene, _camera, _renderer;
  var _objects = [];          // all meshes for cleanup
  var _lights  = [];          // all lights for cleanup

  // Terrain / environment
  var _boulders       = [];
  var _tents          = [];
  var _campfires      = [];
  var _ammoCaches     = [];
  var _commandTent    = null;
  var _cave           = null;
  var _bunkerTunnel   = null;
  var _bunkerOpsRoom  = null;
  var _armory         = null;
  var _switchbackPath = [];
  var _dropZone       = null;

  // Enemies
  var _insurgents   = [];   // { mesh, hp, dead, pos:{x,y,z}, shootTimer }
  var _rpgGunners   = [];   // { mesh, hp, dead, pos:{x,y,z}, shootTimer }
  var _sniper       = null; // { mesh, hp, dead, shootTimer }
  var _abuMalik     = null; // { mesh, hp, dead }

  // Rockets
  var _rockets = [];        // { mesh, dir:{x,y,z}, speed, ttl }

  // Stolen equipment crates
  var _militaryCrates = [];  // { mesh, captured, light }

  // IEDs
  var _ieds = [];            // { mesh, disarmed, pos:{x,y,z}, disarmProgress }

  // Game state
  var _active         = false;
  var _win            = false;
  var _lose           = false;
  var _timer          = 600;   // 10 min in seconds
  var _playerHP       = 100;
  var _cratesRecovered = 0;
  var _sniperDead     = false;
  var _abuMalikDead   = false;
  var _iedsRemaining  = 6;
  var _insurgentsAlive = 29;   // 25 + 4 RPG + sniper counted separately
  var _dropCooldown   = 0;     // supply drop cooldown in seconds (180s = 3min)
  var _eHoldTimer     = 0;     // hold E timer for IED disarm
  var _extractReady   = false;
  var _extractPos     = { x: -60, y: 0, z: -60 };

  // Activation key sequence: I then C within 400ms
  var _lastITime = 0;

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function addToScene(mesh) {
    _scene.add(mesh);
    _objects.push(mesh);
    return mesh;
  }

  function addLight(light) {
    _scene.add(light);
    _lights.push(light);
    return light;
  }

  function makeMesh(geo, matParams) {
    var mat  = new THREE.MeshLambertMaterial(matParams);
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ─── Build terrain ───────────────────────────────────────────────────────────
  function buildTerrain() {
    // Base ground plane
    var groundGeo = new THREE.BoxGeometry(300, 1, 300);
    var ground    = makeMesh(groundGeo, { color: 0x554433 });
    ground.position.set(0, -0.5, 0);
    addToScene(ground);

    // Rocky mountainside — scattered rock platforms ascending toward +z
    for (var i = 0; i < 60; i++) {
      var w  = rnd(3, 12);
      var h  = rnd(0.5, 4);
      var d  = rnd(3, 12);
      var px = rnd(-80, 80);
      var pz = rnd(-90, 60);
      var py = rnd(0.5, 8) + (pz + 90) * 0.08; // higher as we go further back
      var rock = makeMesh(new THREE.BoxGeometry(w, h, d), { color: 0x776655 });
      rock.position.set(px, py, pz);
      addToScene(rock);
    }

    // Boulders (SphereGeometry)
    for (var b = 0; b < 30; b++) {
      var r   = rnd(1, 3.5);
      var bpx = rnd(-70, 70);
      var bpz = rnd(-90, 70);
      var bpy = r * 0.5 + (bpz + 90) * 0.06;
      var boul = makeMesh(new THREE.SphereGeometry(r, 8, 6), { color: 0x665544 });
      boul.position.set(bpx, bpy, bpz);
      _boulders.push(boul);
      addToScene(boul);
    }
  }

  // ─── Switchback path ─────────────────────────────────────────────────────────
  function buildSwitchbackPath() {
    // A narrow path up the mountain — alternating left/right switchbacks
    var segments = [
      { x: 0,   z: -90, rot: 0 },
      { x:-20,  z: -60, rot: 0.3 },
      { x: 20,  z: -30, rot: -0.3 },
      { x:-10,  z:   0, rot: 0.15 },
      { x: 10,  z:  30, rot: -0.15 },
      { x:  0,  z:  60, rot: 0 }
    ];
    for (var s = 0; s < segments.length; s++) {
      var seg = segments[s];
      var pathGeo  = new THREE.BoxGeometry(4, 0.3, 20);
      var pathMesh = makeMesh(pathGeo, { color: 0x887766 });
      var py = 0.15 + (seg.z + 90) * 0.07;
      pathMesh.position.set(seg.x, py, seg.z);
      pathMesh.rotation.y = seg.rot;
      _switchbackPath.push(pathMesh);
      addToScene(pathMesh);
    }
  }

  // ─── Mountain camp ───────────────────────────────────────────────────────────
  function buildCamp() {
    // 8 tents (ConeGeometry)
    var tentPositions = [
      {x: -25, z: 60}, {x: -15, z: 55}, {x: -5,  z: 65},
      {x:  10, z: 58}, {x:  20, z: 62}, {x:  30, z: 55},
      {x: -30, z: 70}, {x:  35, z: 70}
    ];
    for (var t = 0; t < tentPositions.length; t++) {
      var tp  = tentPositions[t];
      var tpy = 2.5 + (tp.z + 90) * 0.07;
      var tent = makeMesh(new THREE.ConeGeometry(3, 5, 6), { color: 0x667744 });
      tent.position.set(tp.x, tpy, tp.z);
      _tents.push(tent);
      addToScene(tent);
    }

    // Campfires: CylinderGeometry base + PointLight
    var firePositions = [
      {x: -10, z: 60}, {x: 15, z: 65}, {x: 0, z: 75}
    ];
    for (var f = 0; f < firePositions.length; f++) {
      var fp  = firePositions[f];
      var fpy = 0.5 + (fp.z + 90) * 0.07;
      var fireMesh = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, 1, 8), { color: 0xFF6600 });
      fireMesh.position.set(fp.x, fpy, fp.z);
      _campfires.push(fireMesh);
      addToScene(fireMesh);
      var fl = new THREE.PointLight(0xFF4400, 2, 15);
      fl.position.set(fp.x, fpy + 1.5, fp.z);
      addLight(fl);
    }

    // Ammo caches (BoxGeometry)
    var cachePositions = [{x: -20, z: 68}, {x: 25, z: 72}, {x: 5, z: 80}];
    for (var c = 0; c < cachePositions.length; c++) {
      var cp  = cachePositions[c];
      var cpy = 1 + (cp.z + 90) * 0.07;
      var cache = makeMesh(new THREE.BoxGeometry(2, 2, 2), { color: 0x556644 });
      cache.position.set(cp.x, cpy, cp.z);
      _ammoCaches.push(cache);
      addToScene(cache);
    }

    // Command tent (larger BoxGeometry 15×5×10, colour 0x556644)
    var ctpy = 2.5 + (85 + 90) * 0.07;
    _commandTent = makeMesh(new THREE.BoxGeometry(15, 5, 10), { color: 0x556644 });
    _commandTent.position.set(0, ctpy, 85);
    addToScene(_commandTent);

    // Drop zone — LineSegments circle
    var points = [];
    var radius = 8;
    var segs   = 32;
    for (var i = 0; i <= segs; i++) {
      var angle = (i / segs) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0.2, Math.sin(angle) * radius));
    }
    var dzGeo = new THREE.BufferGeometry().setFromPoints(points);
    var dzMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
    _dropZone = new THREE.Line(dzGeo, dzMat);
    _dropZone.position.set(-40, 1, 40);
    _scene.add(_dropZone);
    _objects.push(_dropZone);
  }

  // ─── Hidden cave + underground bunker ────────────────────────────────────────
  function buildBunker() {
    // Cave entrance (concealed)
    var cavePy = 2 + (90 + 90) * 0.07;
    _cave = makeMesh(new THREE.BoxGeometry(4, 4, 6), { color: 0x555544 });
    _cave.position.set(5, cavePy, 90);
    addToScene(_cave);

    // Tunnel descending underground (long BoxGeometry 3×3 cross-section)
    var tunnel = makeMesh(new THREE.BoxGeometry(3, 3, 40), { color: 0x444433 });
    tunnel.position.set(5, -5, 100);
    _bunkerTunnel = tunnel;
    addToScene(tunnel);

    // Operations room
    var opsRoom = makeMesh(new THREE.BoxGeometry(15, 4, 12), { color: 0x443322 });
    opsRoom.position.set(5, -8, 120);
    _bunkerOpsRoom = opsRoom;
    addToScene(opsRoom);

    // Armory
    var armory = makeMesh(new THREE.BoxGeometry(10, 4, 8), { color: 0x332211 });
    armory.position.set(-10, -8, 120);
    _armory = armory;
    addToScene(armory);

    // Ambient light for bunker
    var bunkerLight = new THREE.PointLight(0x885522, 1.5, 30);
    bunkerLight.position.set(5, -6, 118);
    addLight(bunkerLight);
  }

  // ─── Stolen equipment crates ─────────────────────────────────────────────────
  function buildMilitaryCrates() {
    var cratePositions = [
      { x: 10, y: -7.5, z: 118 },
      { x: -5, y: -7.5, z: 122 },
      { x: 15, y: -7.5, z: 122 }
    ];
    for (var i = 0; i < cratePositions.length; i++) {
      var cp    = cratePositions[i];
      var mesh  = makeMesh(new THREE.BoxGeometry(2, 2, 2), { color: 0x556644 });
      mesh.position.set(cp.x, cp.y, cp.z);
      addToScene(mesh);
      var cl = new THREE.PointLight(0x00FF44, 1, 8);
      cl.position.set(cp.x, cp.y + 2, cp.z);
      addLight(cl);
      _militaryCrates.push({ mesh: mesh, captured: false, light: cl, pos: cp });
    }
  }

  // ─── IEDs ─────────────────────────────────────────────────────────────────────
  function buildIEDs() {
    var iedPositions = [
      {x:  -5, z: -75},
      {x:  10, z: -55},
      {x: -15, z: -35},
      {x:   8, z: -15},
      {x: -12, z:   5},
      {x:   5, z:  25}
    ];
    for (var i = 0; i < iedPositions.length; i++) {
      var ip  = iedPositions[i];
      var ipy = 0.3 + (ip.z + 90) * 0.07;
      var ied = makeMesh(new THREE.SphereGeometry(0.35, 6, 4), { color: 0x222211 });
      ied.position.set(ip.x, ipy, ip.z);
      addToScene(ied);
      _ieds.push({
        mesh:          ied,
        disarmed:      false,
        pos:           { x: ip.x, y: ipy, z: ip.z },
        disarmProgress: 0
      });
    }
  }

  // ─── Insurgents ──────────────────────────────────────────────────────────────
  function buildInsurgents() {
    // 25 regular insurgents spread around camp area
    for (var i = 0; i < 25; i++) {
      var px  = rnd(-40, 40);
      var pz  = rnd(40, 90);
      var py  = 1.5 + (pz + 90) * 0.07;
      var m   = makeMesh(new THREE.BoxGeometry(1, 2, 1), { color: 0x554433 });
      m.position.set(px, py, pz);
      addToScene(m);
      _insurgents.push({
        mesh:        m,
        hp:          70,
        dead:        false,
        pos:         { x: px, y: py, z: pz },
        shootTimer:  rnd(2, 8)
      });
    }

    // 4 RPG gunners at key positions
    var rpgPositions = [
      {x: -35, z: 55}, {x: 35, z: 55}, {x: -30, z: 80}, {x: 30, z: 80}
    ];
    for (var r = 0; r < rpgPositions.length; r++) {
      var rp  = rpgPositions[r];
      var rpy = 1.5 + (rp.z + 90) * 0.07;
      var rm  = makeMesh(new THREE.BoxGeometry(1.2, 2, 1.2), { color: 0x665544 });
      rm.position.set(rp.x, rpy, rp.z);
      addToScene(rm);
      _rpgGunners.push({
        mesh:       rm,
        hp:         90,
        dead:       false,
        pos:        { x: rp.x, y: rpy, z: rp.z },
        shootTimer: rnd(6, 12)
      });
    }

    // Sniper at top of mountain
    var snipMesh = makeMesh(new THREE.BoxGeometry(1, 2, 1), { color: 0x443322 });
    snipMesh.position.set(0, 20, 95);
    addToScene(snipMesh);
    _sniper = { mesh: snipMesh, hp: 120, dead: false, pos: {x:0, y:20, z:95}, shootTimer: 6 };

    // Abu Malik — cell leader in underground bunker operations room
    var amMesh = makeMesh(new THREE.BoxGeometry(1.4, 2.2, 1.4), { color: 0x443322 });
    amMesh.position.set(5, -7, 118);
    addToScene(amMesh);
    _abuMalik = { mesh: amMesh, hp: 450, dead: false, pos: {x:5, y:-7, z:118}, shootTimer: 3 };
  }

  // ─── Extraction zone ─────────────────────────────────────────────────────────
  function buildExtractZone() {
    var pts = [];
    var segCount = 24;
    for (var i = 0; i <= segCount; i++) {
      var a = (i / segCount) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 5, 0.3, Math.sin(a) * 5));
    }
    var geo  = new THREE.BufferGeometry().setFromPoints(pts);
    var mat  = new THREE.LineBasicMaterial({ color: 0x00FFFF });
    var ring = new THREE.Line(geo, mat);
    ring.position.set(_extractPos.x, _extractPos.y + 0.3, _extractPos.z);
    _scene.add(ring);
    _objects.push(ring);

    var el = new THREE.PointLight(0x00FFFF, 1.5, 20);
    el.position.set(_extractPos.x, _extractPos.y + 2, _extractPos.z);
    addLight(el);
  }

  // ─── Ambient + directional light ─────────────────────────────────────────────
  function buildLighting() {
    var ambient = new THREE.AmbientLight(0x404040, 0.8);
    addLight(ambient);
    var sun = new THREE.DirectionalLight(0xFFEECC, 1.0);
    sun.position.set(50, 100, 50);
    addLight(sun);
  }

  // ─── init ─────────────────────────────────────────────────────────────────────
  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;

    // Reset all arrays
    _objects        = [];
    _lights         = [];
    _boulders       = [];
    _tents          = [];
    _campfires      = [];
    _ammoCaches     = [];
    _ieds           = [];
    _insurgents     = [];
    _rpgGunners     = [];
    _rockets        = [];
    _militaryCrates = [];
    _switchbackPath = [];

    // Game state reset
    _active          = true;
    _win             = false;
    _lose            = false;
    _timer           = 600;
    _playerHP        = 100;
    _cratesRecovered = 0;
    _sniperDead      = false;
    _abuMalikDead    = false;
    _iedsRemaining   = 6;
    _insurgentsAlive = 29;
    _dropCooldown    = 0;
    _eHoldTimer      = 0;
    _extractReady    = false;

    buildLighting();
    buildTerrain();
    buildSwitchbackPath();
    buildCamp();
    buildBunker();
    buildMilitaryCrates();
    buildIEDs();
    buildInsurgents();
    buildExtractZone();

    // Position camera at mountain base
    camera.position.set(0, 2, -85);
    camera.lookAt(0, 5, 0);
  }

  // ─── Shoot helpers ───────────────────────────────────────────────────────────
  function spawnRocket(fromPos, toPos) {
    var geo  = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(fromPos.x, fromPos.y, fromPos.z);
    _scene.add(mesh);
    _objects.push(mesh);

    var dx   = toPos.x - fromPos.x;
    var dy   = toPos.y - fromPos.y;
    var dz   = toPos.z - fromPos.z;
    var len  = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    _rockets.push({
      mesh:  mesh,
      dir:   { x: dx / len, y: dy / len, z: dz / len },
      speed: 20,
      ttl:   8
    });
  }

  function damageEnemy(enemy, dmg) {
    if (enemy.dead) return;
    enemy.hp -= dmg;
    if (enemy.hp <= 0) {
      enemy.dead = true;
      enemy.mesh.visible = false;
      return true;
    }
    return false;
  }

  // ─── Player shoot (raycasting against enemy meshes) ──────────────────────────
  function handlePlayerShoot(playerPos) {
    if (!_camera) return 0;
    var forward = new THREE.Vector3();
    _camera.getWorldDirection(forward);

    var allEnemies = [];
    var i;
    for (i = 0; i < _insurgents.length; i++) {
      if (!_insurgents[i].dead) allEnemies.push(_insurgents[i]);
    }
    for (i = 0; i < _rpgGunners.length; i++) {
      if (!_rpgGunners[i].dead) allEnemies.push(_rpgGunners[i]);
    }
    if (_sniper && !_sniper.dead) allEnemies.push(_sniper);
    if (_abuMalik && !_abuMalik.dead) allEnemies.push(_abuMalik);

    var raycaster = new THREE.Raycaster(
      new THREE.Vector3(playerPos.x, playerPos.y + 1.6, playerPos.z),
      forward,
      0,
      150
    );
    var meshes = allEnemies.map(function (e) { return e.mesh; });
    var hits   = raycaster.intersectObjects(meshes, false);

    if (hits.length === 0) return 0;
    var hitMesh = hits[0].object;
    for (i = 0; i < allEnemies.length; i++) {
      if (allEnemies[i].mesh === hitMesh) {
        var killed = damageEnemy(allEnemies[i], 35);
        if (killed) {
          if (allEnemies[i] === _sniper) { _sniperDead = true; }
          else if (allEnemies[i] === _abuMalik) { _abuMalikDead = true; checkExtract(); }
          else { _insurgentsAlive = Math.max(0, _insurgentsAlive - 1); }
        }
        break;
      }
    }
    return 0;
  }

  function checkExtract() {
    if (_abuMalikDead && _cratesRecovered >= 3) {
      _extractReady = true;
    }
  }

  // ─── IED interaction ──────────────────────────────────────────────────────────
  function updateIEDs(delta, playerPos, eHeld) {
    var dmg = 0;
    for (var i = 0; i < _ieds.length; i++) {
      var ied = _ieds[i];
      if (ied.disarmed) continue;

      var d = dist3D(playerPos, ied.pos);

      // Trigger if player walks over it (within 1.5m) without disarming
      if (d < 1.5 && !eHeld) {
        // Explode!
        ied.disarmed = true;    // remove from future checks
        ied.mesh.visible = false;
        _iedsRemaining--;
        dmg += 60;             // IED damage
      }

      // Disarm — player must hold E within 2m for 4 seconds
      if (d < 2 && eHeld) {
        ied.disarmProgress += delta;
        if (ied.disarmProgress >= 4) {
          ied.disarmed = true;
          ied.mesh.visible = false;
          _iedsRemaining--;
        }
      } else {
        ied.disarmProgress = 0;
      }
    }
    return dmg;
  }

  // ─── Crate capture ────────────────────────────────────────────────────────────
  function updateCrates(playerPos) {
    for (var i = 0; i < _militaryCrates.length; i++) {
      var crate = _militaryCrates[i];
      if (crate.captured) continue;
      var d = dist3D(playerPos, { x: crate.pos.x, y: crate.pos.y, z: crate.pos.z });
      if (d < 3) {
        crate.captured = true;
        crate.mesh.visible = false;
        if (crate.light) { crate.light.intensity = 0; }
        _cratesRecovered++;
        checkExtract();
      }
    }
  }

  // ─── Enemy AI ─────────────────────────────────────────────────────────────────
  function updateEnemyAI(delta, playerPos) {
    var dmg   = 0;
    var camPY = { x: playerPos.x, y: playerPos.y + 1.6, z: playerPos.z };
    var i;

    // Regular insurgents — shoot player if close enough
    for (i = 0; i < _insurgents.length; i++) {
      var ins = _insurgents[i];
      if (ins.dead) continue;
      ins.shootTimer -= delta;
      var d = dist3D(camPY, ins.pos);
      if (d < 50 && ins.shootTimer <= 0) {
        ins.shootTimer = rnd(3, 7);
        dmg += 8;   // gunshot damage
      }
    }

    // RPG gunners — fire rocket every 12s
    for (i = 0; i < _rpgGunners.length; i++) {
      var rpg = _rpgGunners[i];
      if (rpg.dead) continue;
      rpg.shootTimer -= delta;
      var dr = dist3D(camPY, rpg.pos);
      if (dr < 80 && rpg.shootTimer <= 0) {
        rpg.shootTimer = 12;
        spawnRocket(rpg.pos, camPY);
      }
    }

    // Sniper — fire every 6s, 50dmg, long range
    if (_sniper && !_sniper.dead) {
      _sniper.shootTimer -= delta;
      if (_sniper.shootTimer <= 0) {
        _sniper.shootTimer = 6;
        var ds = dist3D(camPY, _sniper.pos);
        if (ds < 200) {
          dmg += 50;
        }
      }
    }

    // Abu Malik — fires bursts if player in bunker area
    if (_abuMalik && !_abuMalik.dead) {
      _abuMalik.shootTimer -= delta;
      var dam = dist3D(camPY, _abuMalik.pos);
      if (dam < 20 && _abuMalik.shootTimer <= 0) {
        _abuMalik.shootTimer = 3;
        dmg += 15;
      }
    }

    return dmg;
  }

  // ─── Update rockets ───────────────────────────────────────────────────────────
  function updateRockets(delta, playerPos) {
    var dmg = 0;
    for (var i = _rockets.length - 1; i >= 0; i--) {
      var rkt = _rockets[i];
      rkt.ttl -= delta;
      rkt.mesh.position.x += rkt.dir.x * rkt.speed * delta;
      rkt.mesh.position.y += rkt.dir.y * rkt.speed * delta;
      rkt.mesh.position.z += rkt.dir.z * rkt.speed * delta;

      var rp  = rkt.mesh.position;
      var dp  = dist3D({ x: rp.x, y: rp.y, z: rp.z }, playerPos);
      if (dp < 3 || rkt.ttl <= 0) {
        if (dp < 3) dmg += 45;
        _scene.remove(rkt.mesh);
        _rockets.splice(i, 1);
      }
    }
    return dmg;
  }

  // ─── Supply drop ──────────────────────────────────────────────────────────────
  function triggerSupplyDrop(playerPos) {
    // Instantly restore some HP and ammo (ammo tracked externally via hudText)
    _playerHP = Math.min(100, _playerHP + 40);
    _dropCooldown = 180;
  }

  // ─── Extract check ────────────────────────────────────────────────────────────
  function checkExtraction(playerPos) {
    if (!_extractReady) return false;
    var d = dist3D(playerPos, _extractPos);
    return d < 6;
  }

  // ─── format timer ────────────────────────────────────────────────────────────
  function formatTime(seconds) {
    var s   = Math.max(0, Math.floor(seconds));
    var mm  = Math.floor(s / 60);
    var ss  = s % 60;
    return (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  }

  // ─── HUD string ───────────────────────────────────────────────────────────────
  function buildHUD(playerHP) {
    return (
      'INSURGENT CAMP' +
      ' [EQUIPMENT: ' + _cratesRecovered + '/3 RECOVERED]' +
      ' [MALIK: ' + (_abuMalikDead ? 'ELIMINATED' : 'ALIVE') + ']' +
      ' [SNIPER: ' + (_sniperDead ? 'NEUTRALIZED' : 'ACTIVE') + ']' +
      ' [IEDs: ' + _iedsRemaining + ' REMAINING]' +
      ' [INSURGENTS: ' + _insurgentsAlive + ']' +
      ' [TIMER: ' + formatTime(_timer) + ']' +
      ' [HP: ' + Math.max(0, Math.floor(playerHP)) + ']'
    );
  }

  // ─── update ──────────────────────────────────────────────────────────────────
  function update(delta, keys, playerPos, playerHP) {
    if (!_active || _win || _lose) {
      return {
        damage:  0,
        hudText: buildHUD(playerHP || _playerHP),
        win:     _win,
        lose:    _lose
      };
    }

    // Use provided HP if given, otherwise track internally
    if (playerHP !== undefined && playerHP !== null) {
      _playerHP = playerHP;
    }

    var totalDmg = 0;

    // Countdown timer
    _timer -= delta;
    if (_timer <= 0) {
      _timer = 0;
      _lose  = true;
      return { damage: 0, hudText: buildHUD(_playerHP), win: false, lose: true };
    }

    // Keys
    var eHeld = keys && (keys['e'] || keys['E'] || keys['KeyE']);
    var dHeld = keys && (keys['d'] || keys['D'] || keys['KeyD']);

    // Supply drop cooldown
    if (_dropCooldown > 0) _dropCooldown -= delta;

    // Supply drop (D key, 3 min cooldown)
    if (dHeld && _dropCooldown <= 0 && playerPos) {
      var dpDist = dist3D(playerPos, { x: -40, y: 0, z: 40 });
      if (dpDist < 15) {
        triggerSupplyDrop(playerPos);
      }
    }

    // IEDs
    if (playerPos) totalDmg += updateIEDs(delta, playerPos, eHeld);

    // Crate capture
    if (playerPos) updateCrates(playerPos);

    // Enemy AI
    if (playerPos) totalDmg += updateEnemyAI(delta, playerPos);

    // Rockets
    if (playerPos) totalDmg += updateRockets(delta, playerPos);

    // Apply damage to internal HP
    _playerHP -= totalDmg;
    if (_playerHP <= 0) {
      _playerHP = 0;
      _lose     = true;
    }

    // Win condition
    if (_extractReady && playerPos && checkExtraction(playerPos)) {
      _win = true;
    }

    // Sync insurgentsAlive count
    var aliveCount = 0;
    var j;
    for (j = 0; j < _insurgents.length; j++) { if (!_insurgents[j].dead) aliveCount++; }
    for (j = 0; j < _rpgGunners.length; j++) { if (!_rpgGunners[j].dead) aliveCount++; }
    _insurgentsAlive = aliveCount;

    return {
      damage:  totalDmg,
      hudText: buildHUD(_playerHP),
      win:     _win,
      lose:    _lose
    };
  }

  // ─── reset ───────────────────────────────────────────────────────────────────
  function reset() {
    var i;
    for (i = 0; i < _objects.length; i++) {
      _scene.remove(_objects[i]);
      if (_objects[i].geometry) _objects[i].geometry.dispose();
      if (_objects[i].material) _objects[i].material.dispose();
    }
    for (i = 0; i < _lights.length; i++) {
      _scene.remove(_lights[i]);
    }
    _objects        = [];
    _lights         = [];
    _boulders       = [];
    _tents          = [];
    _campfires      = [];
    _ammoCaches     = [];
    _ieds           = [];
    _insurgents     = [];
    _rpgGunners     = [];
    _rockets        = [];
    _militaryCrates = [];
    _switchbackPath = [];
    _commandTent    = null;
    _cave           = null;
    _bunkerTunnel   = null;
    _bunkerOpsRoom  = null;
    _armory         = null;
    _dropZone       = null;
    _sniper         = null;
    _abuMalik       = null;

    _active          = false;
    _win             = false;
    _lose            = false;
    _timer           = 600;
    _playerHP        = 100;
    _cratesRecovered = 0;
    _sniperDead      = false;
    _abuMalikDead    = false;
    _iedsRemaining   = 6;
    _insurgentsAlive = 29;
    _dropCooldown    = 0;
    _eHoldTimer      = 0;
    _extractReady    = false;
  }

  // ─── Activation key handler (I then C within 400ms) ─────────────────────────
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', function (e) {
      if (e.key === 'i' || e.key === 'I') {
        _lastITime = Date.now();
      }
      if ((e.key === 'c' || e.key === 'C') && _active) {
        // C already active — could be used to confirm/reset; ignore
      }
    });
  }

  // ─── Mouse shoot handler ─────────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.addEventListener('click', function () {
      if (_active && !_win && !_lose && _camera) {
        var fakePlayerPos = new THREE.Vector3();
        _camera.getWorldPosition(fakePlayerPos);
        handlePlayerShoot({ x: fakePlayerPos.x, y: fakePlayerPos.y, z: fakePlayerPos.z });
      }
    });
  }

  // ─── Public API ──────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset,

    // Allow activation test: call activate() to start (triggered by I+C binding in parent engine)
    activate: function () {
      var now = Date.now();
      if (now - _lastITime <= 400) {
        return true;
      }
      return false;
    },

    // Expose shoot for external call from parent engine click handler
    shoot: function (playerPos) {
      if (_active && !_win && !_lose) handlePlayerShoot(playerPos);
    }
  };
})();
