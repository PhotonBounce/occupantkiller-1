/* ───────────────────────────────────────────────────────────────────────────
   pirate-ship-battle.js — Pirate Ship Battle Mini-Game
   API: window.PirateShipBattle = { init, update, reset }
   Controls:
     P + S (simultaneous, 400ms) → activate module
     A / D                       → aim cannons left / right
     Space                       → fire cannon (8s reload per barrel)
     G                           → throw grappling hooks (within 15 units)
     E                           → board enemy ship / extinguish fire with bucket
   ─────────────────────────────────────────────────────────────────────────── */
window.PirateShipBattle = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active        = false;
  var _keysDown      = {};
  var _pPressTime    = 0;
  var _sPressTime    = 0;
  var _COMBO_WINDOW  = 400; // ms

  /* ── Score / mission ───────────────────────────────────────────────────── */
  var _score         = 0;
  var _missionClear  = false;

  /* ── Ocean & environment ───────────────────────────────────────────────── */
  var _ocean         = null;
  var _waveParticles = [];

  /* ── Player ship (galleon) ─────────────────────────────────────────────── */
  var _playerShip    = null;
  var _playerHP      = 400;
  var _playerMaxHP   = 400;
  var _playerSinking = false;

  /* ── Enemy ship (brigantine) ───────────────────────────────────────────── */
  var _enemyShip        = null;
  var _enemyHP          = 300;
  var _enemyMaxHP       = 300;
  var _enemySinking     = false;
  var _enemySpeed       = 3;      // units/s toward player
  var _enemyMastDamaged = false;

  /* ── Cannon system ─────────────────────────────────────────────────────── */
  var _playerCannons   = [];      // mesh refs
  var _cannonAimAngle  = 0;       // radians offset from ship
  var _cannonBalls     = [];      // { mesh, vel, age }
  var _cannonLoaded    = [true, true, true, true];
  var _cannonCooldowns = [0, 0, 0, 0];
  var _RELOAD_TIME     = 8;       // seconds

  /* ── Enemy cannons ─────────────────────────────────────────────────────── */
  var _enemyCannons    = [];
  var _enemyBalls      = [];      // { mesh, vel, age }
  var _enemyFireTimer  = 0;
  var _ENEMY_FIRE_INT  = 3;       // seconds between salvos

  /* ── Grappling hooks ───────────────────────────────────────────────────── */
  var _hooks           = [];      // { lines: [LineSegments x3], active, progress }
  var _grapplingActive = false;
  var _grappleProgress = 0;       // 0..1 over 5 seconds

  /* ── Boarding ──────────────────────────────────────────────────────────── */
  var _boarding        = false;
  var _boardingPirates = [];      // 8 enemy pirate meshes
  var _pirateHP        = [];      // HP per pirate (simple)

  /* ── Enemy crew muskets ────────────────────────────────────────────────── */
  var _enemyCrew       = [];      // 6 pirate meshes on enemy deck
  var _crewMusketBalls = [];      // { mesh, vel, age }
  var _crewFireTimer   = 0;

  /* ── Treasure chest ────────────────────────────────────────────────────── */
  var _treasureChest   = null;
  var _treasureCollected = false;

  /* ── Fire effects ──────────────────────────────────────────────────────── */
  var _fires           = [];      // { light, particles:[], position, intensity, age }

  /* ── Ship rocking ──────────────────────────────────────────────────────── */
  var _rockTime        = 0;
  var _ROCK_AMP        = 0.03;    // ±0.03 rad
  var _ROCK_FREQ       = 0.2;     // Hz  →  2π * 0.2

  /* ── Mast references ───────────────────────────────────────────────────── */
  var _playerMast      = null;
  var _enemyMast       = null;
  var _enemySailTears  = [];      // LineSegments

  /* ── Weather / fog ─────────────────────────────────────────────────────── */
  var _fogTimer        = 0;
  var _FOG_INTERVAL    = 90;      // seconds between fog events
  var _fogActive       = false;
  var _fogDuration     = 0;
  var _FOG_DURATION    = 20;
  var _originalFog     = null;

  /* ── HUD element ───────────────────────────────────────────────────────── */
  var _hudEl           = null;
  var _windDir         = 'N';

  /* ── Clock ─────────────────────────────────────────────────────────────── */
  var _clock           = null;
  var _lastTime        = 0;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════════════════ */

  function _makeMat(color, opacity) {
    var opts = { color: color };
    if (opacity !== undefined && opacity < 1) {
      opts.transparent = true;
      opts.opacity     = opacity;
    }
    return new THREE.MeshLambertMaterial(opts);
  }

  function _makeBox(w, h, d, color, opacity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = _makeMat(color, opacity);
    return new THREE.Mesh(geo, mat);
  }

  function _makeSphere(r, color, opacity) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = _makeMat(color, opacity);
    return new THREE.Mesh(geo, mat);
  }

  function _makeCylinder(rt, rb, h, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  /* ── Simple distance in XZ plane ──────────────────────────────────────── */
  function _distXZ(a, b) {
    var dx = a.position.x - b.position.x;
    var dz = a.position.z - b.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD SCENE OBJECTS
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildOcean() {
    var mesh = _makeBox(200, 0.5, 200, 0x1A5276, 0.8);
    mesh.position.set(0, -1, 0);
    _scene.add(mesh);
    _ocean = mesh;
  }

  function _buildWaveParticles() {
    for (var i = 0; i < 30; i++) {
      var p = _makeSphere(0.3, 0xFFFFFF);
      p.position.set(
        (Math.random() - 0.5) * 180,
        -0.6,
        (Math.random() - 0.5) * 180
      );
      p.userData.baseY   = p.position.y;
      p.userData.phase   = Math.random() * Math.PI * 2;
      p.userData.speed   = 0.5 + Math.random() * 1.0;
      _scene.add(p);
      _waveParticles.push(p);
    }
  }

  /* ── Build one cannon (barrel + mount) ────────────────────────────────── */
  function _buildCannon(offsetX, offsetZ) {
    var group  = new THREE.Group();
    // barrel
    var barrel = _makeBox(2.5, 0.6, 0.6, 0x444444);
    barrel.position.set(0.8, 0.3, 0);
    group.add(barrel);
    // mount (cylinder lying on its side)
    var mount  = _makeCylinder(0.35, 0.35, 1.0, 0x333333);
    mount.rotation.z = Math.PI / 2;
    mount.position.set(0, 0, 0);
    group.add(mount);
    group.position.set(offsetX, 2.7, offsetZ);
    return group;
  }

  /* ── Build mast + sail (cylinder mast, plane sail) ─────────────────────── */
  function _buildMast(parent) {
    var mast = _makeCylinder(0.2, 0.2, 10, 0x8B4513);
    mast.position.set(0, 5, 0);
    parent.add(mast);
    return mast;
  }

  /* ── Build player galleon ───────────────────────────────────────────────── */
  function _buildPlayerShip() {
    var group = new THREE.Group();
    // hull
    var hull = _makeBox(20, 5, 6, 0x8B4513);
    group.add(hull);
    // deck railing strips
    var railL = _makeBox(20, 0.4, 0.3, 0x6B3410);
    railL.position.set(0, 2.7, 3.15);
    group.add(railL);
    var railR = _makeBox(20, 0.4, 0.3, 0x6B3410);
    railR.position.set(0, 2.7, -3.15);
    group.add(railR);
    // cannons: 4 per side
    var i;
    for (i = 0; i < 4; i++) {
      var cx = -7.5 + i * 5;
      var cPort  = _buildCannon(cx, 3.5);
      var cStarb = _buildCannon(cx, -3.5);
      cStarb.rotation.y = Math.PI;
      group.add(cPort);
      group.add(cStarb);
      _playerCannons.push(cPort);
    }
    // mast
    _playerMast = _buildMast(group);
    // position ship
    group.position.set(-20, 1.75, 0);
    _scene.add(group);
    _playerShip = group;
  }

  /* ── Build enemy brigantine ─────────────────────────────────────────────── */
  function _buildEnemyShip() {
    var group = new THREE.Group();
    // hull
    var hull = _makeBox(15, 4, 5, 0x222222);
    group.add(hull);
    // deck railing
    var railL = _makeBox(15, 0.4, 0.3, 0x111111);
    railL.position.set(0, 2.2, 2.65);
    group.add(railL);
    var railR = _makeBox(15, 0.4, 0.3, 0x111111);
    railR.position.set(0, 2.2, -2.65);
    group.add(railR);
    // enemy cannons: 4 per side
    var i;
    for (i = 0; i < 4; i++) {
      var cx = -5 + i * 3.5;
      var cPort  = _buildCannon(cx, 2.8);
      var cStarb = _buildCannon(cx, -2.8);
      cStarb.rotation.y = Math.PI;
      group.add(cPort);
      group.add(cStarb);
      _enemyCannons.push(cPort);
    }
    // mast
    _enemyMast = _buildMast(group);
    // treasure chest
    _treasureChest = _makeBox(0.8, 0.6, 0.6, 0xFFD700, 0.8);
    _treasureChest.position.set(3, 2.6, 0);
    group.add(_treasureChest);
    // enemy crew: 6 pirates
    var j;
    for (j = 0; j < 6; j++) {
      var crew = _makeBox(0.5, 1.4, 0.5, 0x333322);
      crew.position.set(-5 + j * 2, 2.7, 0);
      group.add(crew);
      _enemyCrew.push(crew);
    }
    // position ship
    group.position.set(25, 1.5, 0);
    _scene.add(group);
    _enemyShip = group;
  }

  /* ── Build boarding pirates (appear when boarding begins) ───────────────── */
  function _buildBoardingPirates() {
    var i;
    for (i = 0; i < 8; i++) {
      var p = _makeBox(0.5, 1.5, 0.5, 0x333322);
      p.position.set(
        _enemyShip.position.x + (Math.random() - 0.5) * 10,
        _enemyShip.position.y + 2.5,
        (Math.random() - 0.5) * 3
      );
      _scene.add(p);
      _boardingPirates.push(p);
      _pirateHP.push(30);
    }
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'pirate-battle-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:13px',
      'padding:4px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var loaded = 0;
    var i;
    for (i = 0; i < _cannonLoaded.length; i++) {
      if (_cannonLoaded[i]) loaded++;
    }
    var boardStr = _boarding ? 'YES' : 'NO';
    _hudEl.textContent =
      'NAVAL BATTLE' +
      ' [SHIP HP: ' + Math.max(0, _playerHP) + '/' + _playerMaxHP + ']' +
      ' [CANNONS: ' + loaded + ' LOADED]' +
      ' [ENEMY HP: ' + Math.max(0, _enemyHP) + '/' + _enemyMaxHP + ']' +
      ' [BOARDING: ' + boardStr + ']' +
      ' | WIND: ' + _windDir;
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = true;

    /* ── Activation combo: P + S within 400ms ──────────────────────────── */
    if (key === 'p') { _pPressTime = performance.now(); }
    if (key === 's') { _sPressTime = performance.now(); }
    if (key === 'p' && _keysDown['s'] && Math.abs(_pPressTime - _sPressTime) < _COMBO_WINDOW) {
      if (!_active) { _activate(); }
    }
    if (key === 's' && _keysDown['p'] && Math.abs(_pPressTime - _sPressTime) < _COMBO_WINDOW) {
      if (!_active) { _activate(); }
    }

    if (!_active) return;

    /* ── Grappling hook ─────────────────────────────────────────────────── */
    if (key === 'g') {
      _tryGrapple();
    }

    /* ── Board / extinguish fire ────────────────────────────────────────── */
    if (key === 'e') {
      if (_grapplingActive && !_boarding) {
        _startBoarding();
      } else {
        _tryExtinguishFire();
      }
    }

    /* ── Fire cannon (Space) ────────────────────────────────────────────── */
    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      _firePlayerCannon();
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.key.toLowerCase()] = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ══════════════════════════════════════════════════════════════════════════ */

  function _activate() {
    _active = true;
    _buildOcean();
    _buildWaveParticles();
    _buildPlayerShip();
    _buildEnemyShip();
    _buildHUD();
    _updateHUD();

    // ambient light
    var ambient = new THREE.AmbientLight(0x888888);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFEECC, 0.8);
    sun.position.set(50, 80, 30);
    _scene.add(sun);

    // position camera above player ship
    if (_camera) {
      _camera.position.set(-20, 18, 30);
      _camera.lookAt(-20, 2, 0);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CANNON FIRE — PLAYER
  ══════════════════════════════════════════════════════════════════════════ */

  function _firePlayerCannon() {
    // find first loaded cannon
    var i;
    for (i = 0; i < 4; i++) {
      if (_cannonLoaded[i]) {
        _cannonLoaded[i]  = false;
        _cannonCooldowns[i] = _RELOAD_TIME;

        // create cannonball
        var ball = _makeSphere(0.6, 0x333333);
        var startX = _playerShip.position.x + 10;
        var startY = _playerShip.position.y + 3;
        var startZ = _playerShip.position.z + 3.5;
        ball.position.set(startX, startY, startZ);
        _scene.add(ball);

        // velocity toward enemy ship with gravity arc
        var toX = _enemyShip.position.x - startX;
        var toZ = _enemyShip.position.z - startZ;
        var dist = Math.sqrt(toX * toX + toZ * toZ);
        var speed = 25;
        _cannonBalls.push({
          mesh: ball,
          vel:  {
            x: (toX / dist) * speed * Math.cos(_cannonAimAngle),
            y: 8,
            z: (toZ / dist) * speed + Math.sin(_cannonAimAngle) * speed * 0.5
          },
          age:  0
        });
        break;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CANNON FIRE — ENEMY CREW
  ══════════════════════════════════════════════════════════════════════════ */

  function _fireEnemyCrewMuskets(dt) {
    _crewFireTimer += dt;
    if (_crewFireTimer < _ENEMY_FIRE_INT) return;
    _crewFireTimer = 0;

    var i;
    for (i = 0; i < _enemyCrew.length; i++) {
      var crew = _enemyCrew[i];
      var ball = _makeSphere(0.15, 0x888888);
      ball.position.set(
        _enemyShip.position.x + crew.position.x,
        _enemyShip.position.y + crew.position.y + 0.5,
        _enemyShip.position.z + crew.position.z
      );
      _scene.add(ball);
      var toX = _playerShip.position.x - ball.position.x;
      var toZ = _playerShip.position.z - ball.position.z;
      var d   = Math.sqrt(toX * toX + toZ * toZ) || 1;
      _crewMusketBalls.push({
        mesh: ball,
        vel:  { x: (toX / d) * 30, y: 0, z: (toZ / d) * 30 },
        age:  0
      });
    }
  }

  function _fireEnemyCannonSalvo(dt) {
    _enemyFireTimer += dt;
    if (_enemyFireTimer < 5) return;
    _enemyFireTimer = 0;

    var i;
    for (i = 0; i < 2; i++) {
      var ball = _makeSphere(0.6, 0x222222);
      var sx = _enemyShip.position.x - 8;
      var sy = _enemyShip.position.y + 2;
      var sz = _enemyShip.position.z - 3;
      ball.position.set(sx, sy, sz);
      _scene.add(ball);
      var toX = _playerShip.position.x - sx;
      var toZ = _playerShip.position.z - sz;
      var d   = Math.sqrt(toX * toX + toZ * toZ) || 1;
      var spd = 18;
      _enemyBalls.push({
        mesh: ball,
        vel:  { x: (toX / d) * spd, y: 6, z: (toZ / d) * spd },
        age:  0
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GRAPPLING HOOKS
  ══════════════════════════════════════════════════════════════════════════ */

  function _tryGrapple() {
    if (_grapplingActive) return;
    var dist = _distXZ(_playerShip, _enemyShip);
    if (dist > 15) return;

    _grapplingActive = true;
    _grappleProgress = 0;

    // create 3 LineSegments as hooks
    var i;
    for (i = 0; i < 3; i++) {
      var pts = [];
      pts.push(new THREE.Vector3(
        _playerShip.position.x + 8,
        _playerShip.position.y + 3,
        _playerShip.position.z + (i - 1) * 1.5
      ));
      pts.push(new THREE.Vector3(
        _enemyShip.position.x - 6,
        _enemyShip.position.y + 3,
        _enemyShip.position.z + (i - 1) * 1.5
      ));
      var geo  = new THREE.BufferGeometry().setFromPoints(pts);
      var mat  = new THREE.LineBasicMaterial({ color: 0x8B6914 });
      var line = new THREE.LineSegments(geo, mat);
      _scene.add(line);
      _hooks.push({ line: line, pts: pts });
    }
  }

  function _updateGrapple(dt) {
    if (!_grapplingActive) return;

    _grappleProgress += dt / 5; // 5 seconds to pull together
    if (_grappleProgress > 1) _grappleProgress = 1;

    // lerp player ship toward enemy on Z axis (keep some separation on X)
    var targetZ  = _enemyShip.position.z;
    var targetX  = _enemyShip.position.x - 12; // 5-unit gap roughly
    _playerShip.position.x = THREE.MathUtils
      ? THREE.MathUtils.lerp(_playerShip.position.x, targetX, _grappleProgress * dt * 0.4)
      : (_playerShip.position.x + (_grappleProgress * dt * 0.4) * (targetX - _playerShip.position.x));
    _playerShip.position.z = THREE.MathUtils
      ? THREE.MathUtils.lerp(_playerShip.position.z, targetZ, _grappleProgress * dt * 0.4)
      : (_playerShip.position.z + (_grappleProgress * dt * 0.4) * (targetZ - _playerShip.position.z));

    // update hook line endpoints
    var i;
    for (i = 0; i < _hooks.length; i++) {
      var h = _hooks[i];
      h.pts[0].x = _playerShip.position.x + 8;
      h.pts[0].y = _playerShip.position.y + 3;
      h.pts[1].x = _enemyShip.position.x - 6;
      h.pts[1].y = _enemyShip.position.y + 3;
      h.line.geometry.setFromPoints(h.pts);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BOARDING
  ══════════════════════════════════════════════════════════════════════════ */

  function _startBoarding() {
    _boarding = true;
    _buildBoardingPirates();
    // move player camera onto enemy ship
    if (_camera) {
      _camera.position.set(_enemyShip.position.x, _enemyShip.position.y + 10, _enemyShip.position.z + 15);
      _camera.lookAt(_enemyShip.position.x, _enemyShip.position.y, _enemyShip.position.z);
    }
  }

  function _updateBoarding(dt) {
    if (!_boarding) return;
    var i;
    for (i = 0; i < _boardingPirates.length; i++) {
      if (_pirateHP[i] <= 0) continue;
      var p = _boardingPirates[i];
      // simple attack: move toward player center & deal damage over time
      var dx = _enemyShip.position.x - p.position.x;
      var dz = _enemyShip.position.z - p.position.z;
      var d  = Math.sqrt(dx * dx + dz * dz) || 1;
      p.position.x += (dx / d) * 2 * dt;
      p.position.z += (dz / d) * 2 * dt;
      // saber attack: damage player if close
      if (d < 2) {
        _playerHP -= 5 * dt;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FIRE EFFECTS
  ══════════════════════════════════════════════════════════════════════════ */

  function _spawnFire(x, y, z) {
    var light = new THREE.PointLight(0xFF4400, 2, 8);
    light.position.set(x, y + 1, z);
    _scene.add(light);

    var particles = [];
    var i;
    for (i = 0; i < 5; i++) {
      var s = _makeSphere(0.25, 0xFF6600);
      s.position.set(
        x + (Math.random() - 0.5),
        y + Math.random() * 1.5,
        z + (Math.random() - 0.5)
      );
      s.userData.vel = {
        x: (Math.random() - 0.5) * 0.5,
        y: 0.8 + Math.random() * 0.6,
        z: (Math.random() - 0.5) * 0.5
      };
      _scene.add(s);
      particles.push(s);
    }

    _fires.push({
      light:     light,
      particles: particles,
      position:  { x: x, y: y, z: z },
      intensity: 1.0,
      age:       0,
      spreading: false,
      spreadTimer: 0
    });
  }

  function _tryExtinguishFire() {
    if (_fires.length === 0) return;
    // extinguish fire closest to player ship
    var closest = null;
    var closestDist = Infinity;
    var i;
    for (i = 0; i < _fires.length; i++) {
      var f  = _fires[i];
      var dx = f.position.x - _playerShip.position.x;
      var dz = f.position.z - _playerShip.position.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < closestDist) {
        closestDist = d;
        closest     = i;
      }
    }
    if (closest !== null && closestDist < 20) {
      _extinguishFire(closest);
    }
  }

  function _extinguishFire(idx) {
    var f = _fires[idx];
    _scene.remove(f.light);
    var i;
    for (i = 0; i < f.particles.length; i++) {
      _scene.remove(f.particles[i]);
    }
    _fires.splice(idx, 1);
  }

  function _updateFires(dt) {
    var i;
    for (i = _fires.length - 1; i >= 0; i--) {
      var f = _fires[i];
      f.age += dt;
      f.spreadTimer += dt;
      // animate smoke particles
      var j;
      for (j = 0; j < f.particles.length; j++) {
        var p = f.particles[j];
        p.position.x += p.userData.vel.x * dt;
        p.position.y += p.userData.vel.y * dt;
        p.position.z += p.userData.vel.z * dt;
        // reset when too high
        if (p.position.y > f.position.y + 4) {
          p.position.set(
            f.position.x + (Math.random() - 0.5),
            f.position.y,
            f.position.z + (Math.random() - 0.5)
          );
        }
      }
      // pulsing light
      f.light.intensity = 1.5 + Math.sin(f.age * 5) * 0.5;
      // fire spreads after 8s if not extinguished
      if (f.spreadTimer > 8 && !f.spreading) {
        f.spreading = true;
        _spawnFire(
          f.position.x + (Math.random() - 0.5) * 3,
          f.position.y,
          f.position.z + (Math.random() - 0.5) * 3
        );
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HIT DETECTION
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateCannonBalls(dt) {
    var i;
    for (i = _cannonBalls.length - 1; i >= 0; i--) {
      var b = _cannonBalls[i];
      b.vel.y -= 9.8 * dt; // gravity
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      b.age += dt;

      // hit enemy ship
      var dx = b.mesh.position.x - _enemyShip.position.x;
      var dy = b.mesh.position.y - (_enemyShip.position.y + 2);
      var dz = b.mesh.position.z - _enemyShip.position.z;
      var d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 9 || b.age > 8 || b.mesh.position.y < -3) {
        if (d < 9 && !_enemySinking) {
          _enemyHP -= 35;
          _score   += 50;
          _spawnFire(
            _enemyShip.position.x + dx * 0.3,
            _enemyShip.position.y + 2,
            _enemyShip.position.z + dz * 0.3
          );
          // check mast hit
          var mDx = b.mesh.position.x - (_enemyShip.position.x);
          var mDz = b.mesh.position.z - (_enemyShip.position.z);
          var mD  = Math.sqrt(mDx * mDx + mDz * mDz);
          if (mD < 1.5 && !_enemyMastDamaged) {
            _enemyMastDamaged = true;
            _enemySpeed *= 0.5;
            _spawnSailTear();
          }
        }
        _scene.remove(b.mesh);
        _cannonBalls.splice(i, 1);
      }
    }
  }

  function _updateEnemyBalls(dt) {
    var i;
    for (i = _enemyBalls.length - 1; i >= 0; i--) {
      var b = _enemyBalls[i];
      b.vel.y -= 9.8 * dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      b.age += dt;

      var dx = b.mesh.position.x - _playerShip.position.x;
      var dy = b.mesh.position.y - (_playerShip.position.y + 2);
      var dz = b.mesh.position.z - _playerShip.position.z;
      var d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 12 || b.age > 10 || b.mesh.position.y < -3) {
        if (d < 12 && !_playerSinking) {
          _playerHP -= 40;
          _spawnFire(
            _playerShip.position.x + dx * 0.3,
            _playerShip.position.y + 2,
            _playerShip.position.z + dz * 0.3
          );
        }
        _scene.remove(b.mesh);
        _enemyBalls.splice(i, 1);
      }
    }
  }

  function _updateMusketBalls(dt) {
    var i;
    for (i = _crewMusketBalls.length - 1; i >= 0; i--) {
      var b = _crewMusketBalls[i];
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      b.age += dt;

      var dx = b.mesh.position.x - _playerShip.position.x;
      var dz = b.mesh.position.z - _playerShip.position.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < 12 || b.age > 5) {
        if (d < 12) { _playerHP -= 5; }
        _scene.remove(b.mesh);
        _crewMusketBalls.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SAIL TEAR
  ══════════════════════════════════════════════════════════════════════════ */

  function _spawnSailTear() {
    var pts = [];
    var i;
    for (i = 0; i < 4; i++) {
      pts.push(new THREE.Vector3(
        _enemyShip.position.x + (Math.random() - 0.5) * 2,
        _enemyShip.position.y + 5 + Math.random() * 3,
        _enemyShip.position.z + (Math.random() - 0.5) * 2
      ));
    }
    var geo  = new THREE.BufferGeometry().setFromPoints(pts);
    var mat  = new THREE.LineBasicMaterial({ color: 0xEEEECC });
    var line = new THREE.LineSegments(geo, mat);
    _scene.add(line);
    _enemySailTears.push(line);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHIP ROCKING & WAVE ANIMATION
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateRocking(dt) {
    _rockTime += dt;
    var angle = Math.sin(_rockTime * 2 * Math.PI * _ROCK_FREQ) * _ROCK_AMP;
    if (_playerShip && !_playerSinking) {
      _playerShip.rotation.z = angle;
    }
    if (_enemyShip && !_enemySinking) {
      _enemyShip.rotation.z = angle * 0.8 + 0.01; // slightly different phase
    }
  }

  function _updateWaves(dt) {
    var i;
    for (i = 0; i < _waveParticles.length; i++) {
      var p = _waveParticles[i];
      p.position.y = p.userData.baseY +
        Math.sin(_rockTime * p.userData.speed + p.userData.phase) * 0.3;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHIP SINKING
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateSinking(dt) {
    if (_enemyHP <= 0 && !_enemySinking) {
      _enemySinking = true;
    }
    if (_playerHP <= 0 && !_playerSinking) {
      _playerSinking = true;
    }

    if (_enemySinking && _enemyShip) {
      _enemyShip.position.y -= 0.5 * dt;
      _enemyShip.rotation.z += 0.3 * dt;
    }
    if (_playerSinking && _playerShip) {
      _playerShip.position.y -= 0.5 * dt;
      _playerShip.rotation.z += 0.3 * dt;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY SHIP AI
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateEnemyAI(dt) {
    if (_enemySinking || !_enemyShip || !_playerShip) return;
    // slow approach toward player
    var dx = _playerShip.position.x - _enemyShip.position.x;
    var dz = _playerShip.position.z - _enemyShip.position.z;
    var d  = Math.sqrt(dx * dx + dz * dz) || 1;
    if (d > 20) {
      _enemyShip.position.x += (dx / d) * _enemySpeed * dt;
      _enemyShip.position.z += (dz / d) * _enemySpeed * dt;
    }
    // face player
    _enemyShip.rotation.y = Math.atan2(dx, dz);
  }

  /* ════════════════════════════════════════════════════════════════════════
     CANNON AIM (A/D keys)
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateCannonAim(dt) {
    var aimSpeed = 1.0; // radians per second
    if (_keysDown['a']) { _cannonAimAngle -= aimSpeed * dt; }
    if (_keysDown['d']) { _cannonAimAngle += aimSpeed * dt; }
    _cannonAimAngle = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, _cannonAimAngle));

    // rotate player cannon visuals
    var i;
    for (i = 0; i < _playerCannons.length; i++) {
      _playerCannons[i].rotation.y = _cannonAimAngle;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CANNON RELOAD
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateReload(dt) {
    var i;
    for (i = 0; i < _cannonCooldowns.length; i++) {
      if (!_cannonLoaded[i]) {
        _cannonCooldowns[i] -= dt;
        if (_cannonCooldowns[i] <= 0) {
          _cannonLoaded[i]    = true;
          _cannonCooldowns[i] = 0;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     TREASURE COLLECTION
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateTreasure() {
    if (_treasureCollected || !_treasureChest || !_boarding) return;
    // check if player (camera) is near treasure
    if (_camera) {
      var wx = _enemyShip.position.x + _treasureChest.position.x;
      var wy = _enemyShip.position.y + _treasureChest.position.y;
      var wz = _enemyShip.position.z + _treasureChest.position.z;
      var dx = _camera.position.x - wx;
      var dy = _camera.position.y - wy;
      var dz = _camera.position.z - wz;
      var d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 8) {
        _treasureCollected = true;
        _missionClear      = true;
        _score            += 1000;
        _treasureChest.material.emissive = new THREE.Color(0xFFFF00);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WEATHER / FOG
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateWeather(dt) {
    _fogTimer += dt;
    if (!_fogActive && _fogTimer >= _FOG_INTERVAL) {
      _fogTimer   = 0;
      _fogActive  = true;
      _fogDuration = 0;
      _originalFog = _scene.fog;
      _scene.fog   = new THREE.FogExp2(0x888888, 0.04);
    }
    if (_fogActive) {
      _fogDuration += dt;
      if (_fogDuration >= _FOG_DURATION) {
        _fogActive   = false;
        _scene.fog   = _originalFog || null;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIND (randomize direction every 30s)
  ══════════════════════════════════════════════════════════════════════════ */

  var _windTimer = 0;
  var _windDirs  = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  function _updateWind(dt) {
    _windTimer += dt;
    if (_windTimer > 30) {
      _windTimer = 0;
      _windDir   = _windDirs[Math.floor(Math.random() * _windDirs.length)];
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function update(scene, camera, canvas, dt) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    if (!_active) return;

    _updateRocking(dt);
    _updateWaves(dt);
    _updateCannonAim(dt);
    _updateReload(dt);
    _updateCannonBalls(dt);
    _updateEnemyBalls(dt);
    _updateMusketBalls(dt);
    _fireEnemyCrewMuskets(dt);
    _fireEnemyCannonSalvo(dt);
    _updateEnemyAI(dt);
    _updateGrapple(dt);
    _updateBoarding(dt);
    _updateFires(dt);
    _updateSinking(dt);
    _updateTreasure();
    _updateWeather(dt);
    _updateWind(dt);
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     INIT — called once when game engine starts; registers input listeners
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ══════════════════════════════════════════════════════════════════════════ */

  function reset() {
    // remove all objects from scene
    var i;
    if (_ocean)        { _scene.remove(_ocean);       _ocean = null; }
    for (i = 0; i < _waveParticles.length; i++) { _scene.remove(_waveParticles[i]); }
    _waveParticles = [];
    if (_playerShip)   { _scene.remove(_playerShip);  _playerShip = null; }
    if (_enemyShip)    { _scene.remove(_enemyShip);   _enemyShip  = null; }
    for (i = 0; i < _cannonBalls.length; i++) { _scene.remove(_cannonBalls[i].mesh); }
    _cannonBalls = [];
    for (i = 0; i < _enemyBalls.length; i++) { _scene.remove(_enemyBalls[i].mesh); }
    _enemyBalls = [];
    for (i = 0; i < _crewMusketBalls.length; i++) { _scene.remove(_crewMusketBalls[i].mesh); }
    _crewMusketBalls = [];
    for (i = 0; i < _hooks.length; i++) { _scene.remove(_hooks[i].line); }
    _hooks = [];
    for (i = 0; i < _boardingPirates.length; i++) { _scene.remove(_boardingPirates[i]); }
    _boardingPirates = [];
    for (i = 0; i < _fires.length; i++) {
      _scene.remove(_fires[i].light);
      var j;
      for (j = 0; j < _fires[i].particles.length; j++) { _scene.remove(_fires[i].particles[j]); }
    }
    _fires = [];
    for (i = 0; i < _enemySailTears.length; i++) { _scene.remove(_enemySailTears[i]); }
    _enemySailTears = [];

    if (_fogActive) { _scene.fog = _originalFog || null; }

    _removeHUD();

    // reset state
    _active            = false;
    _score             = 0;
    _missionClear      = false;
    _playerHP          = 400;
    _enemyHP           = 300;
    _playerSinking     = false;
    _enemySinking      = false;
    _enemySpeed        = 3;
    _enemyMastDamaged  = false;
    _cannonLoaded      = [true, true, true, true];
    _cannonCooldowns   = [0, 0, 0, 0];
    _cannonAimAngle    = 0;
    _grapplingActive   = false;
    _grappleProgress   = 0;
    _boarding          = false;
    _pirateHP          = [];
    _treasureCollected = false;
    _treasureChest     = null;
    _rockTime          = 0;
    _fogTimer          = 0;
    _fogActive         = false;
    _fogDuration       = 0;
    _windTimer         = 0;
    _windDir           = 'N';
    _enemyFireTimer    = 0;
    _crewFireTimer     = 0;
    _enemyCrew         = [];
    _playerCannons     = [];
    _enemyCannons      = [];
    _playerMast        = null;
    _enemyMast         = null;
    _keysDown          = {};
    _pPressTime        = 0;
    _sPressTime        = 0;

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup',   _onKeyUp);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
