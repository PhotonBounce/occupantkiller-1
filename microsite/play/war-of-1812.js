/* ───────────────────────────────────────────────────────────────────────────
   war-of-1812.js — War of 1812: Naval Battle & Shore Assault
   API: window.WarOf1812 = { init, update, reset }

   Controls:
     W + 8 (simultaneous, within 400ms) → activate module
     WASD                               → move player (phase 2)
     Mouse                              → aim / look
     E                                  → man cannon (phase 1) / plant ladder (phase 2)
     Left-click                         → fire cannon (phase 1) / fire musket (phase 2) / bayonet (phase 2 <3u)
     Right-click                        → grape shot (phase 1, kills 3 boarders)
     Q                                  → surrender mechanic on commander (<20HP)
     Sprint (Shift+W)                   → bayonet charge (phase 2)
   ─────────────────────────────────────────────────────────────────────────── */
window.WarOf1812 = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active         = false;
  var _keysDown       = {};
  var _wPressTime     = 0;
  var _8PressTime     = 0;
  var COMBO_WINDOW    = 400; // ms

  /* ── Phase management ──────────────────────────────────────────────────── */
  var PHASE_NAVAL    = 1;
  var PHASE_SHORE    = 2;
  var _phase         = PHASE_NAVAL;
  var _phaseTransitioning = false;

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _playerHP      = 100;
  var _playerMaxHP   = 100;
  var _playerPos     = null; // THREE.Vector3
  var _playerMesh    = null;
  var _playerSpeed   = 8;
  var _isSprinting   = false;
  var _isAlive       = true;

  /* ── Win / Lose state ──────────────────────────────────────────────────── */
  var _gameOver      = false;
  var _gameWon       = false;

  /* ── Phase 1: Naval ────────────────────────────────────────────────────── */
  var _ocean            = null;
  var _playerShip       = null;
  var _playerShipHP     = 400;
  var _playerShipMaxHP  = 400;
  var _playerShipGroup  = null;
  var _rockTime         = 0;

  var _cannons          = [];       // array of { mesh, loaded, cooldown, powderBoy }
  var _cannonCount      = 8;
  var _currentCannon    = -1;       // which cannon is manned (-1 = none)
  var _RELOAD_TIME      = 4.0;     // seconds

  var _cannonBalls      = [];       // { mesh, vel:{x,y,z}, age }
  var _cannonSmoke      = [];       // { mesh, vel:{x,y,z}, age, maxAge }

  var _enemyFrigates    = [];       // { group, hp, speed, fireTimer, boarders:[], sunk, mesh }
  var _FRIGATE_HP       = 240;
  var _ENEMY_BROADSIDE  = 80;
  var _ENEMY_FIRE_INT   = 4.0;
  var _frigatesSunk     = 0;

  var _boarders         = [];       // { mesh, hp, onShip }
  var _enemyBalls       = [];       // { mesh, vel:{x,y,z}, age }

  /* ── Phase 2: Shore ────────────────────────────────────────────────────── */
  var _rowboat          = null;
  var _rowboatAnimDone  = false;
  var _beach            = null;
  var _fort             = null;
  var _fortGroup        = null;
  var _fortHP           = 600;

  var _redcoats         = [];       // { mesh, hp, alive, fireTimer, pos:{x,z} }
  var _REDCOAT_COUNT    = 15;
  var _REDCOAT_HP       = 60;
  var _redcoatsAlive    = 0;

  var _fortCannons      = [];       // { mesh, fireTimer }
  var _fortCannonBalls  = [];       // { mesh, vel:{x,y,z}, age }

  var _commander        = null;     // { mesh, hp, surrendered }
  var _COMMANDER_HP     = 300;

  var _alliedSoldiers   = [];       // 10 BoxGeometry soldiers
  var _ladders          = [];       // { mesh, pos:{x,y,z} }
  var _powderBarrel     = null;     // { mesh, placed, pos }
  var _gateBlown        = false;

  var _musketLoaded     = true;
  var _musketCooldown   = 0;
  var _MUSKET_RELOAD    = 2.0;
  var _MUSKET_RANGE     = 20;
  var _MUSKET_DMG       = 60;

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hudEl            = null;

  /* ── Clock ───────────────────────────────────────────────────────────────── */
  var _totalTime        = 0;

  /* ══════════════════════════════════════════════════════════════════════════
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
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = _makeMat(color, opacity);
    return new THREE.Mesh(geo, mat);
  }

  function _makeCylinder(rt, rb, h, color, opacity) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = _makeMat(color, opacity);
    return new THREE.Mesh(geo, mat);
  }

  function _makeCone(r, h, color) {
    var geo = new THREE.ConeGeometry(r, h, 8);
    var mat = _makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _distXZ(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'war1812-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#F5DEB3',
      'font:bold 13px monospace',
      'padding:6px 14px',
      'border:1px solid #886644',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var phaseStr   = (_phase === PHASE_NAVAL) ? 'NAVAL' : 'ASSAULT';
    var frigLeft   = 3 - _frigatesSunk;
    var rcAlive    = _redcoatsAlive;
    var cannonStr  = 'N/A';
    if (_phase === PHASE_NAVAL && _currentCannon >= 0) {
      var cd = _cannons[_currentCannon] ? _cannons[_currentCannon].cooldown : 0;
      cannonStr = (cd <= 0) ? 'READY' : (cd.toFixed(1) + 's RELOAD');
    } else if (_phase === PHASE_SHORE) {
      cannonStr = _musketLoaded ? 'READY' : (_musketCooldown.toFixed(1) + 's RELOAD');
    }
    var hpStr = (_phase === PHASE_NAVAL) ? ('SHIP HP: ' + Math.max(0, Math.round(_playerShipHP))) : ('PLAYER HP: ' + Math.max(0, Math.round(_playerHP)));
    _hudEl.textContent = 'WAR OF 1812  [PHASE: ' + phaseStr + ']  [' + hpStr + ']  [FRIGATES: ' + frigLeft + ']  [REDCOATS: ' + rcAlive + ']  |  ' + ((_phase === PHASE_NAVAL) ? 'CANNON' : 'MUSKET') + ': ' + cannonStr;
    if (_gameOver) {
      _hudEl.textContent = '*** DEFEAT — ' + (_playerShipHP <= 0 ? 'SHIP SUNK' : 'FALLEN IN BATTLE') + ' ***';
      _hudEl.style.color = '#FF4444';
    } else if (_gameWon) {
      _hudEl.textContent = '*** VICTORY — WAR OF 1812 — GLORY TO AMERICA! ***';
      _hudEl.style.color = '#FFDD44';
    }
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PHASE 1 — BUILD NAVAL SCENE
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildOcean() {
    var mesh = _makeBox(300, 1, 300, 0x1A4A6A, 0.85);
    mesh.position.set(0, -0.5, 0);
    _scene.add(mesh);
    _ocean = mesh;
  }

  function _buildPlayerShip() {
    var group = new THREE.Group();
    // Hull: 20x3x6
    var hull = _makeBox(20, 3, 6, 0x664422);
    hull.position.set(0, 0, 0);
    group.add(hull);
    // Deck planking detail
    var deck = _makeBox(18, 0.4, 5.5, 0x775533);
    deck.position.set(0, 1.7, 0);
    group.add(deck);
    // Bow
    var bow = _makeCone(2.5, 5, 0x664422);
    bow.rotation.z = -Math.PI / 2;
    bow.position.set(11, -0.2, 0);
    group.add(bow);
    // Stern rail
    var sternRail = _makeBox(1.5, 2.5, 6.5, 0x554411);
    sternRail.position.set(-10, 2, 0);
    group.add(sternRail);
    // Foremast
    var foremast = _makeCylinder(0.2, 0.25, 14, 0x554411);
    foremast.position.set(5, 8.5, 0);
    group.add(foremast);
    // Mainmast
    var mainmast = _makeCylinder(0.25, 0.3, 18, 0x554411);
    mainmast.position.set(-1, 10.5, 0);
    group.add(mainmast);
    // Mizzen mast
    var mizzen = _makeCylinder(0.18, 0.22, 11, 0x554411);
    mizzen.position.set(-7, 7, 0);
    group.add(mizzen);
    // Sail yard (crossbar) on main
    var yard = _makeBox(10, 0.3, 0.3, 0x554411);
    yard.position.set(-1, 17, 0);
    group.add(yard);
    // Sail fore
    var sail = _makeBox(7, 6, 0.15, 0xEEDDBB, 0.9);
    sail.position.set(5, 10, 0);
    group.add(sail);
    // Sail main
    var sailMain = _makeBox(9, 8, 0.15, 0xEEDDBB, 0.9);
    sailMain.position.set(-1, 14, 0);
    group.add(sailMain);

    group.position.set(0, 1.5, 0);
    _scene.add(group);
    _playerShipGroup = group;
    _playerShip = hull;
  }

  function _buildCannons() {
    var i;
    var side;
    var cx;
    var cz;
    var cyl;
    var pw;
    _cannons = [];
    // 4 cannons per side (port/starboard)
    for (i = 0; i < 8; i++) {
      side = (i < 4) ? 1 : -1;
      cx   = -7 + (i % 4) * 4;
      cz   = side * 3.5;
      cyl  = _makeCylinder(0.3, 0.35, 2, 0x333333);
      cyl.rotation.z = Math.PI / 2;
      cyl.position.set(cx, 1.5, cz);
      _playerShipGroup.add(cyl);
      // Powder boy placeholder (hidden until reload)
      pw = _makeBox(0.5, 1, 0.5, 0xBB8844);
      pw.position.set(cx - 1, 1.5, cz);
      pw.visible = false;
      _playerShipGroup.add(pw);
      _cannons.push({ mesh: cyl, loaded: true, cooldown: 0, powderBoy: pw });
    }
  }

  function _buildEnemyFrigates() {
    var i;
    var fx;
    var fz;
    _enemyFrigates = [];
    var offsets = [[-10, -60], [0, -80], [10, -55]];
    for (i = 0; i < 3; i++) {
      var group = new THREE.Group();
      var hull  = _makeBox(16, 2.5, 5, 0x334455);
      group.add(hull);
      // Enemy mast
      var mast = _makeCylinder(0.2, 0.25, 12, 0x445566);
      mast.position.set(0, 7.5, 0);
      group.add(mast);
      // Enemy sail
      var sail = _makeBox(7, 6, 0.15, 0xCC9966, 0.9);
      sail.position.set(0, 11, 0);
      group.add(sail);
      group.position.set(offsets[i][0], 1.5, offsets[i][1]);
      _scene.add(group);
      _enemyFrigates.push({
        group:     group,
        mesh:      hull,
        hp:        _FRIGATE_HP,
        speed:     2.5 + i * 0.3,
        fireTimer: 1.5 + i * 0.8,
        boarders:  [],
        sunk:      false
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PHASE 2 — BUILD SHORE SCENE
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildShoreScene() {
    // Beach ground plane (using BoxGeometry as PlaneGeometry substitute)
    var beach = _makeBox(120, 0.5, 80, 0xDDCC88);
    beach.position.set(0, -0.25, 10);
    _scene.add(beach);
    _beach = beach;

    // Water approach
    var water = _makeBox(120, 0.5, 60, 0x1A4A6A, 0.85);
    water.position.set(0, -0.3, -40);
    _scene.add(water);

    // Fort: BoxGeometry 30x8x20
    var fortGroup = new THREE.Group();
    var fortWall  = _makeBox(30, 8, 20, 0x887766);
    fortWall.position.set(0, 4, 0);
    fortGroup.add(fortWall);
    // Parapet top
    var parapet = _makeBox(30, 1, 20, 0x776655);
    parapet.position.set(0, 8.5, 0);
    fortGroup.add(parapet);
    // Battlements
    var j;
    for (j = 0; j < 5; j++) {
      var batt = _makeBox(2.5, 1.5, 1.5, 0x776655);
      batt.position.set(-12 + j * 6, 9.5, -10);
      fortGroup.add(batt);
      var battB = _makeBox(2.5, 1.5, 1.5, 0x776655);
      battB.position.set(-12 + j * 6, 9.5, 10);
      fortGroup.add(battB);
    }
    // Gate opening (dark box)
    var gate = _makeBox(5, 6, 1, 0x221100);
    gate.position.set(0, 3, -10.5);
    fortGroup.add(gate);
    fortGroup.position.set(0, 0, 35);
    _scene.add(fortGroup);
    _fortGroup = fortGroup;
    _fort = fortWall;

    // Fort cannons (4 emplacements)
    var fcOffsets = [[-12, 0], [12, 0], [0, -8], [0, 8]];
    _fortCannons = [];
    for (j = 0; j < 4; j++) {
      var fc = _makeCylinder(0.35, 0.4, 2.2, 0x444444);
      fc.rotation.x = Math.PI / 2;
      fc.position.set(fcOffsets[j][0], 5, 35 + fcOffsets[j][1] - 10);
      _scene.add(fc);
      _fortCannons.push({ mesh: fc, fireTimer: 2.0 + j * 0.7 });
    }

    // Redcoat defenders
    _redcoats = [];
    _redcoatsAlive = 0;
    var k;
    for (k = 0; k < _REDCOAT_COUNT; k++) {
      var rc = _makeBox(0.9, 1.8, 0.9, 0x992222);
      // Shako hat
      var hat = _makeCylinder(0.3, 0.25, 0.6, 0x111111);
      hat.position.y = 1.2;
      rc.add(hat);
      var px = -12 + (k % 5) * 6 + (Math.random() - 0.5) * 2;
      var pz = 28 + Math.floor(k / 5) * 4 + (Math.random() - 0.5);
      rc.position.set(px, 0.9, pz);
      _scene.add(rc);
      _redcoats.push({
        mesh:      rc,
        hp:        _REDCOAT_HP,
        alive:     true,
        fireTimer: 2.0 + Math.random() * 2,
        morale:    100
      });
      _redcoatsAlive++;
    }

    // British commander
    var cmdMesh = _makeBox(1, 2, 1, 0x992222);
    // Epaulettes
    var epL = _makeBox(0.8, 0.3, 0.25, 0xCCBB00);
    epL.position.set(-0.6, 0.8, 0);
    cmdMesh.add(epL);
    var epR = _makeBox(0.8, 0.3, 0.25, 0xCCBB00);
    epR.position.set(0.6, 0.8, 0);
    cmdMesh.add(epR);
    var cmdHat = _makeCylinder(0.35, 0.3, 0.7, 0x111111);
    cmdHat.position.y = 1.3;
    cmdMesh.add(cmdHat);
    cmdMesh.position.set(2, 1, 36);
    _scene.add(cmdMesh);
    _commander = { mesh: cmdMesh, hp: _COMMANDER_HP, surrendered: false };

    // Allied soldiers (10 BoxGeometry — blue coats)
    _alliedSoldiers = [];
    for (k = 0; k < 10; k++) {
      var ally = _makeBox(0.9, 1.8, 0.9, 0x334455);
      ally.position.set(-8 + k * 1.8, 0.9, -5);
      _scene.add(ally);
      _alliedSoldiers.push({ mesh: ally, alive: true, targetZ: 30 + Math.random() * 5 });
    }

    // Powder barrel near beach
    var barrel = _makeCylinder(0.5, 0.5, 1.2, 0xFF4400);
    barrel.position.set(3, 0.6, -2);
    _scene.add(barrel);
    _powderBarrel = { mesh: barrel, placed: false, carried: false };

    // Player in shore position
    _playerMesh.position.set(0, 0.9, -8);
    _playerPos.set(0, 0.9, -8);
    if (_camera) {
      _camera.position.set(0, 5, -15);
      _camera.lookAt(0, 1, 0);
    }
  }

  function _buildRowboat() {
    var boat = _makeBox(5, 1.2, 2.5, 0x664422);
    boat.position.set(-15, 1, -25);
    _scene.add(boat);
    _rowboat = boat;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PHASE 1 UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateNaval(dt) {
    _updateShipRocking(dt);
    _updateCannonReload(dt);
    _updateCannonBalls(dt);
    _updateCannonSmoke(dt);
    _updateEnemyFrigates(dt);
    _updateEnemyBalls(dt);
    _updateBoarders(dt);
    _checkNavalWin();
  }

  function _updateShipRocking(dt) {
    _rockTime += dt;
    if (_playerShipGroup) {
      _playerShipGroup.rotation.z = Math.sin(_rockTime * 0.4) * 0.04;
      _playerShipGroup.rotation.x = Math.cos(_rockTime * 0.3) * 0.02;
    }
  }

  function _updateCannonReload(dt) {
    var i;
    for (i = 0; i < _cannons.length; i++) {
      var c = _cannons[i];
      if (!c.loaded) {
        c.cooldown -= dt;
        if (c.powderBoy) {
          c.powderBoy.visible = (c.cooldown > 0);
        }
        if (c.cooldown <= 0) {
          c.loaded   = true;
          c.cooldown = 0;
          if (c.powderBoy) c.powderBoy.visible = false;
        }
      }
    }
  }

  function _updateCannonBalls(dt) {
    var i;
    var GRAVITY = 4.0;
    for (i = _cannonBalls.length - 1; i >= 0; i--) {
      var cb = _cannonBalls[i];
      cb.vel.y -= GRAVITY * dt;
      cb.mesh.position.x += cb.vel.x * dt;
      cb.mesh.position.y += cb.vel.y * dt;
      cb.mesh.position.z += cb.vel.z * dt;
      cb.age += dt;
      if (cb.age > 6 || cb.mesh.position.y < -5) {
        _scene.remove(cb.mesh);
        _cannonBalls.splice(i, 1);
        continue;
      }
      // Check hits on enemy frigates
      var j;
      for (j = 0; j < _enemyFrigates.length; j++) {
        var ef = _enemyFrigates[j];
        if (ef.sunk) continue;
        var d = _dist3(cb.mesh.position, ef.group.position);
        if (d < 10) {
          ef.hp -= 55;
          _spawnSmoke(cb.mesh.position.x, cb.mesh.position.y, cb.mesh.position.z);
          _scene.remove(cb.mesh);
          _cannonBalls.splice(i, 1);
          if (ef.hp <= 0) {
            _sinkFrigate(ef);
          }
          break;
        }
      }
    }
  }

  function _updateCannonSmoke(dt) {
    var i;
    for (i = _cannonSmoke.length - 1; i >= 0; i--) {
      var s = _cannonSmoke[i];
      s.mesh.position.x += s.vel.x * dt;
      s.mesh.position.y += s.vel.y * dt;
      s.mesh.position.z += s.vel.z * dt;
      s.age += dt;
      var ratio = s.age / s.maxAge;
      if (s.mesh.material) {
        s.mesh.material.opacity = 0.7 * (1 - ratio);
      }
      if (s.age >= s.maxAge) {
        _scene.remove(s.mesh);
        _cannonSmoke.splice(i, 1);
      }
    }
  }

  function _spawnSmoke(x, y, z) {
    var sm = _makeSphere(0.6, 0x888888, 0.7);
    sm.position.set(x, y, z);
    _scene.add(sm);
    _cannonSmoke.push({
      mesh:   sm,
      vel:    { x: (Math.random() - 0.5) * 1.5, y: 1.5 + Math.random(), z: (Math.random() - 0.5) * 1.5 },
      age:    0,
      maxAge: 2.5 + Math.random()
    });
  }

  function _updateEnemyFrigates(dt) {
    var i;
    for (i = 0; i < _enemyFrigates.length; i++) {
      var ef = _enemyFrigates[i];
      if (ef.sunk) continue;
      // Approach player ship
      var px = _playerShipGroup ? _playerShipGroup.position.x : 0;
      var pz = _playerShipGroup ? _playerShipGroup.position.z : 0;
      var dx = px - ef.group.position.x;
      var dz = pz - ef.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 12) {
        ef.group.position.x += (dx / dist) * ef.speed * dt;
        ef.group.position.z += (dz / dist) * ef.speed * dt;
      } else {
        // Close range — fire broadside and try boarding
        ef.fireTimer -= dt;
        if (ef.fireTimer <= 0) {
          ef.fireTimer = _ENEMY_FIRE_INT;
          _playerShipHP -= _ENEMY_BROADSIDE;
          _spawnSmoke(ef.group.position.x, ef.group.position.y + 2, ef.group.position.z);
          // Enemy cannonball toward player
          _fireEnemyBall(ef);
        }
        if (dist < 5) {
          _spawnBoarders(ef, i);
        }
      }
      // Aim broadside slightly
      ef.group.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    }
  }

  function _fireEnemyBall(ef) {
    var ball = _makeSphere(0.4, 0x222222);
    ball.position.copy(ef.group.position);
    ball.position.y += 2;
    var tx = _playerShipGroup ? _playerShipGroup.position.x : 0;
    var ty = _playerShipGroup ? _playerShipGroup.position.y + 1 : 2;
    var tz = _playerShipGroup ? _playerShipGroup.position.z : 0;
    var dx = tx - ball.position.x;
    var dy = ty - ball.position.y;
    var dz = tz - ball.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    var speed = 18;
    _scene.add(ball);
    _enemyBalls.push({
      mesh: ball,
      vel:  { x: (dx / dist) * speed, y: dy / dist * speed * 0.3 + 3, z: (dz / dist) * speed },
      age:  0
    });
  }

  function _updateEnemyBalls(dt) {
    var i;
    var GRAVITY = 4.0;
    for (i = _enemyBalls.length - 1; i >= 0; i--) {
      var eb = _enemyBalls[i];
      eb.vel.y -= GRAVITY * dt;
      eb.mesh.position.x += eb.vel.x * dt;
      eb.mesh.position.y += eb.vel.y * dt;
      eb.mesh.position.z += eb.vel.z * dt;
      eb.age += dt;
      if (eb.age > 5 || eb.mesh.position.y < -5) {
        _scene.remove(eb.mesh);
        _enemyBalls.splice(i, 1);
        continue;
      }
      if (_playerShipGroup) {
        var d = _dist3(eb.mesh.position, _playerShipGroup.position);
        if (d < 12) {
          _playerShipHP -= 25;
          _spawnSmoke(eb.mesh.position.x, eb.mesh.position.y, eb.mesh.position.z);
          _scene.remove(eb.mesh);
          _enemyBalls.splice(i, 1);
        }
      }
    }
  }

  function _spawnBoarders(ef, frigIdx) {
    if (ef.boarders.length >= 6) return;
    var k;
    for (k = ef.boarders.length; k < 6; k++) {
      var b = _makeBox(0.9, 1.8, 0.9, 0x992222);
      b.position.set(
        _playerShipGroup.position.x + (Math.random() - 0.5) * 8,
        1.5,
        _playerShipGroup.position.z + (Math.random() - 0.5) * 4
      );
      _scene.add(b);
      var bd = { mesh: b, hp: 40, onShip: true, frigIdx: frigIdx };
      ef.boarders.push(bd);
      _boarders.push(bd);
    }
  }

  function _updateBoarders(dt) {
    var i;
    for (i = _boarders.length - 1; i >= 0; i--) {
      var bd = _boarders[i];
      if (bd.hp <= 0) {
        _scene.remove(bd.mesh);
        _boarders.splice(i, 1);
        continue;
      }
      // Move boarders toward player ship center
      var tx = _playerShipGroup ? _playerShipGroup.position.x : 0;
      var tz = _playerShipGroup ? _playerShipGroup.position.z : 0;
      var dx = tx - bd.mesh.position.x;
      var dz = tz - bd.mesh.position.z;
      var d  = Math.sqrt(dx * dx + dz * dz) || 1;
      if (d > 2) {
        bd.mesh.position.x += (dx / d) * 2 * dt;
        bd.mesh.position.z += (dz / d) * 2 * dt;
      } else {
        // Attack player ship
        _playerShipHP -= 8 * dt;
      }
    }
  }

  function _sinkFrigate(ef) {
    if (ef.sunk) return;
    ef.sunk = true;
    _frigatesSunk++;
    // Animate sinking
    ef.group.userData.sinking = true;
    _spawnSmoke(ef.group.position.x, ef.group.position.y + 3, ef.group.position.z);
    _spawnSmoke(ef.group.position.x + 4, ef.group.position.y + 2, ef.group.position.z);
  }

  function _checkNavalWin() {
    if (_frigatesSunk >= 3 && _phase === PHASE_NAVAL && !_phaseTransitioning) {
      _phaseTransitioning = true;
      _startPhase2();
    }
    if (_playerShipHP <= 0 && !_gameOver) {
      _gameOver = true;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PHASE TRANSITION
  ══════════════════════════════════════════════════════════════════════════ */

  function _startPhase2() {
    _phase = PHASE_SHORE;
    _phaseTransitioning = false;
    // Clear naval objects from scene
    var i;
    for (i = 0; i < _enemyFrigates.length; i++) {
      _scene.remove(_enemyFrigates[i].group);
    }
    for (i = _cannonBalls.length - 1; i >= 0; i--) {
      _scene.remove(_cannonBalls[i].mesh);
    }
    _cannonBalls = [];
    for (i = _enemyBalls.length - 1; i >= 0; i--) {
      _scene.remove(_enemyBalls[i].mesh);
    }
    _enemyBalls = [];
    for (i = _boarders.length - 1; i >= 0; i--) {
      _scene.remove(_boarders[i].mesh);
    }
    _boarders = [];
    if (_ocean) { _scene.remove(_ocean); _ocean = null; }
    if (_playerShipGroup) { _scene.remove(_playerShipGroup); _playerShipGroup = null; }

    // Reset fog for shore
    _scene.fog = new THREE.FogExp2(0x9999AA, 0.015);

    // Build player mesh for shore
    _playerPos  = new THREE.Vector3(0, 0.9, -8);
    _playerMesh = _makeBox(0.9, 1.8, 0.9, 0x334455);
    _playerMesh.position.copy(_playerPos);
    _scene.add(_playerMesh);

    _buildShoreScene();
    _buildRowboat();
    _rowboatAnimDone = false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PHASE 2 UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateShore(dt) {
    _updateRowboat(dt);
    _updatePlayerMovement(dt);
    _updateMusketCooldown(dt);
    _updateFortCannons(dt);
    _updateFortCannonBalls(dt);
    _updateRedcoatAI(dt);
    _updateAlliedSoldiers(dt);
    _updateSinkingFrigatesDisplay(dt);
    _checkShoreWin();
  }

  function _updateRowboat(dt) {
    if (_rowboatAnimDone || !_rowboat) return;
    _rowboat.position.z += 6 * dt;
    if (_rowboat.position.z >= -5) {
      _rowboatAnimDone = true;
    }
  }

  function _updatePlayerMovement(dt) {
    if (!_playerPos || !_playerMesh) return;
    var speed = _playerSpeed;
    _isSprinting = _keysDown['ShiftLeft'] || _keysDown['ShiftRight'];
    if (_isSprinting) speed *= 1.7;

    var moveX = 0;
    var moveZ = 0;
    if (_keysDown['KeyW'] || _keysDown['ArrowUp'])    moveZ -= 1;
    if (_keysDown['KeyS'] || _keysDown['ArrowDown'])  moveZ += 1;
    if (_keysDown['KeyA'] || _keysDown['ArrowLeft'])  moveX -= 1;
    if (_keysDown['KeyD'] || _keysDown['ArrowRight']) moveX += 1;

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }
    _playerPos.x = _clamp(_playerPos.x + moveX * speed * dt, -55, 55);
    _playerPos.z = _clamp(_playerPos.z + moveZ * speed * dt, -20, 50);
    _playerMesh.position.copy(_playerPos);

    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y + 4, _playerPos.z + 8);
      _camera.lookAt(_playerPos.x, _playerPos.y + 1, _playerPos.z - 5);
    }
  }

  function _updateMusketCooldown(dt) {
    if (!_musketLoaded) {
      _musketCooldown -= dt;
      if (_musketCooldown <= 0) {
        _musketLoaded   = true;
        _musketCooldown = 0;
      }
    }
  }

  function _updateFortCannons(dt) {
    var i;
    for (i = 0; i < _fortCannons.length; i++) {
      var fc = _fortCannons[i];
      fc.fireTimer -= dt;
      if (fc.fireTimer <= 0) {
        fc.fireTimer = 3.5 + Math.random() * 2;
        _fireFortCannon(fc);
      }
    }
  }

  function _fireFortCannon(fc) {
    if (!_playerPos) return;
    var ball = _makeSphere(0.5, 0x111111);
    ball.position.copy(fc.mesh.position);
    var dx = _playerPos.x - ball.position.x;
    var dy = _playerPos.y - ball.position.y;
    var dz = _playerPos.z - ball.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    var speed = 20;
    _scene.add(ball);
    _fortCannonBalls.push({
      mesh: ball,
      vel:  { x: (dx / dist) * speed + (Math.random() - 0.5) * 5, y: Math.abs(dy / dist) * speed * 0.2 + 4, z: (dz / dist) * speed },
      age:  0
    });
    _spawnSmoke(fc.mesh.position.x, fc.mesh.position.y, fc.mesh.position.z);
  }

  function _updateFortCannonBalls(dt) {
    var i;
    var GRAVITY = 5.0;
    for (i = _fortCannonBalls.length - 1; i >= 0; i--) {
      var fcb = _fortCannonBalls[i];
      fcb.vel.y -= GRAVITY * dt;
      fcb.mesh.position.x += fcb.vel.x * dt;
      fcb.mesh.position.y += fcb.vel.y * dt;
      fcb.mesh.position.z += fcb.vel.z * dt;
      fcb.age += dt;
      if (fcb.age > 6 || fcb.mesh.position.y < -3) {
        _scene.remove(fcb.mesh);
        _fortCannonBalls.splice(i, 1);
        continue;
      }
      if (_playerPos) {
        var d = _dist3(fcb.mesh.position, _playerPos);
        if (d < 2) {
          _playerHP -= 35;
          _spawnSmoke(fcb.mesh.position.x, fcb.mesh.position.y, fcb.mesh.position.z);
          _scene.remove(fcb.mesh);
          _fortCannonBalls.splice(i, 1);
          if (_playerHP <= 0) _gameOver = true;
        }
      }
    }
  }

  function _updateRedcoatAI(dt) {
    var i;
    for (i = 0; i < _redcoats.length; i++) {
      var rc = _redcoats[i];
      if (!rc.alive || !_playerPos) continue;
      var dx = _playerPos.x - rc.mesh.position.x;
      var dz = _playerPos.z - rc.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // Rotate to face player
      rc.mesh.rotation.y = Math.atan2(dx, dz);

      // Fire if in range
      if (dist < 18) {
        rc.fireTimer -= dt;
        if (rc.fireTimer <= 0) {
          rc.fireTimer = 2.5 + Math.random() * 2;
          // Hit player with some accuracy
          var hitChance = dist < 10 ? 0.45 : 0.25;
          if (Math.random() < hitChance) {
            _playerHP -= 15;
            if (_playerHP <= 0) _gameOver = true;
          }
          _spawnSmoke(rc.mesh.position.x, rc.mesh.position.y + 0.9, rc.mesh.position.z);
        }
      }
    }
  }

  function _updateAlliedSoldiers(dt) {
    var i;
    for (i = 0; i < _alliedSoldiers.length; i++) {
      var ally = _alliedSoldiers[i];
      if (!ally.alive) continue;
      var tz = ally.targetZ;
      if (ally.mesh.position.z < tz - 0.5) {
        ally.mesh.position.z += 2.5 * dt;
      }
    }
  }

  function _updateSinkingFrigatesDisplay(dt) {
    // Slowly sink frigates visually
    var i;
    for (i = 0; i < _enemyFrigates.length; i++) {
      var ef = _enemyFrigates[i];
      if (ef.sunk && ef.group && _scene.children.indexOf(ef.group) >= 0) {
        ef.group.position.y -= 1.5 * dt;
        ef.group.rotation.z += 0.3 * dt;
        if (ef.group.position.y < -8) {
          _scene.remove(ef.group);
        }
      }
    }
  }

  function _checkShoreWin() {
    if (_gameWon || _gameOver) return;
    // Win: commander surrenders OR fort cleared (0 redcoats)
    if (_commander && _commander.surrendered) {
      _gameWon = true;
      return;
    }
    if (_redcoatsAlive <= 0) {
      _gameWon = true;
    }
    if (_playerHP <= 0) {
      _gameOver = true;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    // Activation: W + 8 within 400ms
    if (e.code === 'KeyW') {
      _wPressTime = Date.now();
    }
    if (e.code === 'Digit8') {
      _8PressTime = Date.now();
    }
    if (_keysDown['KeyW'] && _keysDown['Digit8']) {
      if (Math.abs(_wPressTime - _8PressTime) < COMBO_WINDOW) {
        _activate();
      }
    }

    if (!_active) return;

    // E — man cannon (phase 1) or plant ladder (phase 2)
    if (e.code === 'KeyE') {
      if (_phase === PHASE_NAVAL) {
        _manNearestCannon();
      } else {
        _plantLadder();
      }
    }

    // Q — surrender mechanic (phase 2)
    if (e.code === 'KeyQ' && _phase === PHASE_SHORE) {
      _trySurrender();
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) {
      // Left-click
      if (_phase === PHASE_NAVAL) {
        _firePlayerCannon();
      } else {
        _fireMusketOrBayonet();
      }
    } else if (e.button === 2) {
      // Right-click — grape shot (phase 1)
      if (_phase === PHASE_NAVAL) {
        _fireGrapeShot();
      }
    }
  }

  function _onContextMenu(e) {
    if (_active) e.preventDefault();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIONS
  ══════════════════════════════════════════════════════════════════════════ */

  function _manNearestCannon() {
    if (!_playerShipGroup) return;
    // Find nearest unmanned loaded cannon
    var best = -1;
    var bestDist = 999;
    var i;
    for (i = 0; i < _cannons.length; i++) {
      var c = _cannons[i];
      var d = Math.abs(i - _currentCannon);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    _currentCannon = (best === _currentCannon) ? -1 : best;
  }

  function _firePlayerCannon() {
    if (_currentCannon < 0 || _currentCannon >= _cannons.length) return;
    var c = _cannons[_currentCannon];
    if (!c.loaded) return;
    c.loaded   = false;
    c.cooldown = _RELOAD_TIME;
    if (c.powderBoy) c.powderBoy.visible = true;

    // Spawn cannonball from ship side
    var spawnPos = new THREE.Vector3();
    if (_playerShipGroup) {
      spawnPos.copy(_playerShipGroup.position);
    }
    spawnPos.y += 2;
    // Side offset based on cannon index
    var side = (_currentCannon < 4) ? 1 : -1;
    spawnPos.z += side * 6;

    var ball = _makeSphere(0.45, 0x222222);
    ball.position.copy(spawnPos);
    _scene.add(ball);

    // Arc toward nearest enemy frigate
    var target = _nearestActiveFrigate();
    var speed  = 22;
    var dx = 0, dy = 0, dz = -1;
    if (target) {
      dx = target.group.position.x - spawnPos.x;
      dz = target.group.position.z - spawnPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz) || 1;
      dx /= dist;
      dz /= dist;
      dy = 0.3; // arc up
    }
    _cannonBalls.push({
      mesh: ball,
      vel:  { x: dx * speed, y: dy * speed, z: dz * speed },
      age:  0
    });
    _spawnSmoke(spawnPos.x, spawnPos.y, spawnPos.z);
  }

  function _nearestActiveFrigate() {
    var best = null;
    var bestDist = 999;
    var i;
    for (i = 0; i < _enemyFrigates.length; i++) {
      var ef = _enemyFrigates[i];
      if (ef.sunk) continue;
      var px = _playerShipGroup ? _playerShipGroup.position.x : 0;
      var pz = _playerShipGroup ? _playerShipGroup.position.z : 0;
      var d  = _distXZ(px, pz, ef.group.position.x, ef.group.position.z);
      if (d < bestDist) {
        bestDist = d;
        best     = ef;
      }
    }
    return best;
  }

  function _fireGrapeShot() {
    // Short range, kills up to 3 boarders
    var killed = 0;
    var i;
    for (i = _boarders.length - 1; i >= 0 && killed < 3; i--) {
      var bd = _boarders[i];
      if (bd.hp <= 0) continue;
      bd.hp = 0;
      killed++;
    }
    // Spawn smoke effect at ship bow
    if (_playerShipGroup) {
      _spawnSmoke(_playerShipGroup.position.x + 8, _playerShipGroup.position.y + 2, _playerShipGroup.position.z);
    }
  }

  function _fireMusketOrBayonet() {
    if (!_playerPos) return;
    // Check bayonet: sprint + within 3u of a redcoat
    if (_isSprinting) {
      var i;
      for (i = 0; i < _redcoats.length; i++) {
        var rc = _redcoats[i];
        if (!rc.alive) continue;
        var d = _distXZ(_playerPos.x, _playerPos.z, rc.mesh.position.x, rc.mesh.position.z);
        if (d < 3) {
          _killRedcoat(i);
          // Morale check on nearby enemies
          _bayonetMoraleCheck(rc.mesh.position.x, rc.mesh.position.z);
          return;
        }
      }
      // Check commander
      if (_commander && !_commander.surrendered) {
        var cd = _distXZ(_playerPos.x, _playerPos.z, _commander.mesh.position.x, _commander.mesh.position.z);
        if (cd < 3) {
          _commander.hp -= 80;
          return;
        }
      }
    }
    // Musket shot
    if (!_musketLoaded) return;
    _musketLoaded   = false;
    _musketCooldown = _MUSKET_RELOAD;
    _spawnSmoke(_playerPos.x, _playerPos.y + 0.8, _playerPos.z - 1);

    // Check if any redcoat or commander within musket range
    var j;
    for (j = 0; j < _redcoats.length; j++) {
      var r = _redcoats[j];
      if (!r.alive) continue;
      var dist = _distXZ(_playerPos.x, _playerPos.z, r.mesh.position.x, r.mesh.position.z);
      if (dist <= _MUSKET_RANGE) {
        r.hp -= _MUSKET_DMG;
        if (r.hp <= 0) {
          _killRedcoat(j);
        }
        break; // musket hits one target
      }
    }
    if (_commander && !_commander.surrendered) {
      var cmdDist = _distXZ(_playerPos.x, _playerPos.z, _commander.mesh.position.x, _commander.mesh.position.z);
      if (cmdDist <= _MUSKET_RANGE) {
        _commander.hp -= _MUSKET_DMG;
      }
    }
  }

  function _killRedcoat(idx) {
    var rc = _redcoats[idx];
    if (!rc.alive) return;
    rc.alive = false;
    rc.mesh.position.y = -1; // "fall" down
    _redcoatsAlive = Math.max(0, _redcoatsAlive - 1);
  }

  function _bayonetMoraleCheck(x, z) {
    var i;
    for (i = 0; i < _redcoats.length; i++) {
      var rc = _redcoats[i];
      if (!rc.alive) continue;
      var d = _distXZ(x, z, rc.mesh.position.x, rc.mesh.position.z);
      if (d < 6) {
        rc.morale -= 30;
        if (rc.morale <= 0) {
          // Rout — run away (move far back)
          rc.mesh.position.z += 15;
          _killRedcoat(i);
        }
      }
    }
  }

  function _plantLadder() {
    if (!_playerPos) return;
    // Plant ladder against fort wall
    var fortZ = 25; // front face of fort
    if (_playerPos.z > fortZ - 5 && _playerPos.z < fortZ + 3) {
      var ladder = _makeBox(0.4, 9, 0.4, 0x884422);
      ladder.position.set(_playerPos.x, 4.5, fortZ);
      _scene.add(ladder);
      // Rungs
      var k;
      for (k = 0; k < 5; k++) {
        var rung = _makeBox(1.5, 0.2, 0.2, 0x774411);
        rung.position.set(_playerPos.x, 1 + k * 1.6, fortZ + 0.1);
        _scene.add(rung);
        _ladders.push({ mesh: rung });
      }
      _ladders.push({ mesh: ladder });
    }
  }

  function _trySurrender() {
    if (!_playerPos || !_commander || _commander.surrendered) return;
    var d = _distXZ(_playerPos.x, _playerPos.z, _commander.mesh.position.x, _commander.mesh.position.z);
    if (d < 5 && _commander.hp < 60) {
      _commander.surrendered = true;
      // Visual: commander changes color
      if (_commander.mesh.material) {
        _commander.mesh.material.color.setHex(0x888888);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVATE
  ══════════════════════════════════════════════════════════════════════════ */

  function _activate() {
    if (_active) return;
    _active = true;

    // Set scene atmosphere
    _scene.background = new THREE.Color(0x88AABB);
    _scene.fog = new THREE.FogExp2(0x9999AA, 0.015);

    // Lighting
    var ambient = new THREE.AmbientLight(0xAABBCC, 0.5);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFDDAA, 0.8);
    sun.position.set(30, 60, 20);
    _scene.add(sun);

    // Phase 1: build naval scene
    _phase = PHASE_NAVAL;
    _buildOcean();
    _buildPlayerShip();
    _buildCannons();
    _buildEnemyFrigates();
    _redcoatsAlive = 0;

    // Camera
    if (_camera) {
      _camera.position.set(0, 12, 25);
      _camera.lookAt(0, 2, -20);
    }

    _buildHUD();

    // Register mouse
    window.addEventListener('mousedown',    _onMouseDown);
    window.addEventListener('contextmenu',  _onContextMenu);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  function update(scene, camera, canvas, dt) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    if (!_active) return;
    if (_gameOver || _gameWon) {
      _updateHUD();
      return;
    }

    _totalTime += dt;

    if (_phase === PHASE_NAVAL) {
      _updateNaval(dt);
    } else {
      _updateShore(dt);
    }

    _updateHUD();
  }

  function reset() {
    var i;

    // Remove naval objects
    if (_ocean)           { _scene.remove(_ocean);           _ocean = null; }
    if (_playerShipGroup) { _scene.remove(_playerShipGroup); _playerShipGroup = null; }
    for (i = 0; i < _enemyFrigates.length; i++) {
      if (_enemyFrigates[i].group) _scene.remove(_enemyFrigates[i].group);
    }
    _enemyFrigates = [];
    for (i = _cannonBalls.length - 1; i >= 0; i--) { _scene.remove(_cannonBalls[i].mesh); }
    _cannonBalls = [];
    for (i = _enemyBalls.length - 1; i >= 0; i--) { _scene.remove(_enemyBalls[i].mesh); }
    _enemyBalls = [];
    for (i = _cannonSmoke.length - 1; i >= 0; i--) { _scene.remove(_cannonSmoke[i].mesh); }
    _cannonSmoke = [];
    for (i = _boarders.length - 1; i >= 0; i--) { _scene.remove(_boarders[i].mesh); }
    _boarders = [];

    // Remove shore objects
    if (_beach)        { _scene.remove(_beach);    _beach = null; }
    if (_fortGroup)    { _scene.remove(_fortGroup); _fortGroup = null; }
    if (_rowboat)      { _scene.remove(_rowboat);   _rowboat = null; }
    if (_playerMesh)   { _scene.remove(_playerMesh); _playerMesh = null; }
    if (_powderBarrel && _powderBarrel.mesh) { _scene.remove(_powderBarrel.mesh); }
    _powderBarrel = null;
    for (i = 0; i < _redcoats.length; i++) { _scene.remove(_redcoats[i].mesh); }
    _redcoats = [];
    for (i = 0; i < _fortCannons.length; i++) { _scene.remove(_fortCannons[i].mesh); }
    _fortCannons = [];
    for (i = _fortCannonBalls.length - 1; i >= 0; i--) { _scene.remove(_fortCannonBalls[i].mesh); }
    _fortCannonBalls = [];
    for (i = 0; i < _alliedSoldiers.length; i++) { _scene.remove(_alliedSoldiers[i].mesh); }
    _alliedSoldiers = [];
    for (i = 0; i < _ladders.length; i++) { _scene.remove(_ladders[i].mesh); }
    _ladders = [];
    if (_commander && _commander.mesh) { _scene.remove(_commander.mesh); }
    _commander = null;

    // Remove HUD
    _removeHUD();

    // Reset scene props
    _scene.fog = null;

    // Reset all state
    _active              = false;
    _keysDown            = {};
    _wPressTime          = 0;
    _8PressTime          = 0;
    _phase               = PHASE_NAVAL;
    _phaseTransitioning  = false;
    _playerHP            = 100;
    _playerPos           = null;
    _playerMesh          = null;
    _isSprinting         = false;
    _isAlive             = true;
    _gameOver            = false;
    _gameWon             = false;
    _playerShip          = null;
    _playerShipHP        = 400;
    _playerShipGroup     = null;
    _rockTime            = 0;
    _cannons             = [];
    _currentCannon       = -1;
    _frigatesSunk        = 0;
    _redcoatsAlive       = 0;
    _fortHP              = 600;
    _gateBlown           = false;
    _rowboatAnimDone     = false;
    _musketLoaded        = true;
    _musketCooldown      = 0;
    _totalTime           = 0;

    window.removeEventListener('keydown',    _onKeyDown);
    window.removeEventListener('keyup',      _onKeyUp);
    window.removeEventListener('mousedown',  _onMouseDown);
    window.removeEventListener('contextmenu', _onContextMenu);
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
