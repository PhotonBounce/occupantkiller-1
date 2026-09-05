/* ============================================================
 *  BATTLE-ROYALE.JS — Battle Royale mode
 *  Activation: B+R simultaneous keypress (both within 400ms)
 *  IIFE exposes window.BattleRoyale
 *  Rules: var only, no let/const
 * ============================================================ */
window.BattleRoyale = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  /* ── Config ──────────────────────────────────────────────── */
  var CFG = {
    MAP_SIZE: 80,
    TOTAL_PLAYERS: 20,
    AI_COUNT: 19,
    BUILDING_COUNT: 16,
    WRECK_COUNT: 4,
    TREE_COUNT: 12,
    CRATE_COUNT: 30,
    ATV_COUNT: 3,
    PARACHUTE_Y_START: 60,
    PARACHUTE_FALL_SPEED: 2,
    PARACHUTE_FREE_FALL_SPEED: 18,
    LOOT_WINDOW: 30,         // seconds before AI becomes aggressive
    ZONE_DAMAGE_PER_SEC: 5,
    KEY_COMBO_MS: 400,
    KILL_FEED_MAX: 5,
    ATV_RUN_OVER_DMG: 80,
    ZONE_STAGES: [
      { time: 0,   radius: 40 },
      { time: 120, radius: 35 },
      { time: 240, radius: 25 },
      { time: 360, radius: 15 },
      { time: 480, radius: 8  },
      { time: 600, radius: 3  }
    ]
  };

  var WEAPONS = {
    pistol:   { name: 'Pistol',   damage: 25, range: 15, fireRate: 0.6, ammo: 12 },
    rifle:    { name: 'Rifle',    damage: 35, range: 40, fireRate: 0.12, ammo: 30 },
    shotgun:  { name: 'Shotgun',  damage: 70, range: 10, fireRate: 0.9, ammo: 8  },
    sniper:   { name: 'Sniper',   damage: 95, range: 80, fireRate: 1.5, ammo: 5  },
    grenade:  { name: 'Grenade',  damage: 120, range: 12, fireRate: 2.0, ammo: 3 }
  };

  var ARMOR_TYPES = {
    none:   { name: 'None',   color: 0x000000, reduction: 0,    durability: 0 },
    light:  { name: 'Light',  color: 0x887766, reduction: 0.25, durability: 3 },
    medium: { name: 'Medium', color: 0x667766, reduction: 0.40, durability: 3 },
    heavy:  { name: 'Heavy',  color: 0x446666, reduction: 0.50, durability: 3 }
  };

  var AI_COLORS   = [0x334455, 0x553344, 0x334433, 0x445544];
  var AI_WEAPONS  = ['pistol', 'rifle', 'shotgun', 'sniper'];
  var BLDG_COLORS = [0x556644, 0x445533, 0x334422];

  /* ── Module state ────────────────────────────────────────── */
  var _active   = false;
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;

  // Key-combo detection
  var _bPressed = false;
  var _rPressed = false;
  var _bTime    = 0;
  var _rTime    = 0;

  // Game state
  var _gameTime     = 0;
  var _playerHP     = 100;
  var _playerDead   = false;
  var _playerKills  = 0;
  var _playerWeapons = [];
  var _playerWeaponIdx = 0;
  var _playerArmor  = 'none';
  var _playerArmorDur = 0;
  var _playerGrenades = 0;
  var _playerPos    = null;   // THREE.Vector3
  var _playerVel    = null;   // THREE.Vector3
  var _playerMesh   = null;

  // Parachute drop state
  var _inDrop        = false;
  var _parachuteOpen = false;
  var _landed        = false;

  // Zone
  var _zoneCenter   = null;   // THREE.Vector3 (xz only)
  var _zoneCurRadius = 40;
  var _zoneNextRadius = 40;
  var _zoneNextTime   = 0;
  var _zoneShrinking  = false;
  var _zoneShrinkDur  = 30;   // seconds to shrink between stages
  var _zoneShrinkElapsed = 0;
  var _zoneShrinkFrom = 40;
  var _zoneStageIdx   = 0;

  // AI opponents
  var _ais = [];

  // Loot crates
  var _crates = [];

  // Vehicles (ATVs)
  var _vehicles = [];
  var _playerVehicle = null;

  // Buildings, wrecks, trees stored for cleanup
  var _sceneMeshes = [];

  // Kill feed
  var _killFeed  = [];

  // HUD element
  var _hudEl = null;

  // Zone ring mesh
  var _zoneRing = null;

  // AI names (short)
  var AI_NAMES = [
    'Ghost','Viper','Wolf','Storm','Blaze','Raven','Hawk','Ace',
    'Tank','Snipe','Fury','Zeus','Bolt','Iron','Cruz','Jet',
    'Lex','Fox','Nova'
  ];

  var WEAPON_KEYS = ['pistol', 'rifle', 'shotgun', 'sniper'];

  /* ── Helpers ─────────────────────────────────────────────── */
  function _rnd(min, max) { return min + Math.random() * (max - min); }
  function _rndInt(min, max) { return Math.floor(_rnd(min, max + 1)); }
  function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function _v3(x, y, z) { return new THREE.Vector3(x, y, z); }

  function _makeMat(color, emissive) {
    var opts = { color: color };
    if (emissive !== undefined) opts.emissive = emissive;
    return new THREE.MeshLambertMaterial(opts);
  }

  function _addMesh(mesh) {
    _scene.add(mesh);
    _sceneMeshes.push(mesh);
    return mesh;
  }

  function _disposeObj(obj) {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.dispose) obj.material.dispose();
    }
    if (_scene) _scene.remove(obj);
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ── Key handling ────────────────────────────────────────── */
  function _onKeyDown(e) {
    var k = e.key ? e.key.toLowerCase() : '';
    var now = Date.now();
    if (k === 'b') { _bPressed = true; _bTime = now; }
    if (k === 'r') { _rPressed = true; _rTime = now; }
    if (_bPressed && _rPressed && Math.abs(_bTime - _rTime) <= CFG.KEY_COMBO_MS) {
      if (!_active) {
        _startGame();
      }
    }

    if (!_active) return;

    // Parachute deploy
    if (k === ' ' && _inDrop && !_parachuteOpen) {
      _parachuteOpen = true;
    }

    // Open crate
    if (k === 'e') {
      _tryOpenCrate();
    }

    // Enter/exit vehicle
    if (k === 'f') {
      _tryToggleVehicle();
    }

    // Throw grenade
    if (k === 'g') {
      _throwGrenade();
    }

    // Weapon switch (1-4)
    if (k === '1') _playerWeaponIdx = 0;
    if (k === '2') _playerWeaponIdx = 1;
    if (k === '3') _playerWeaponIdx = 2;
    if (k === '4') _playerWeaponIdx = 3;

    // Shoot (left-click handled separately, spacebar as alt fire when landed)
    if (k === 'q') {
      _playerShoot();
    }
  }

  function _onKeyUp(e) {
    var k = e.key ? e.key.toLowerCase() : '';
    if (k === 'b') _bPressed = false;
    if (k === 'r') _rPressed = false;
  }

  function _onMouseDown(e) {
    if (!_active || _inDrop || !_landed) return;
    if (e.button === 0) _playerShoot();
  }

  /* ── Scene construction ──────────────────────────────────── */
  function _buildMap() {
    // Ground plane
    var groundGeo = new THREE.PlaneGeometry(CFG.MAP_SIZE, CFG.MAP_SIZE);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x447733 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    _addMesh(ground);

    // 16 Buildings
    var i, x, z, w, h, d, geo, mat, mesh;
    for (i = 0; i < CFG.BUILDING_COUNT; i++) {
      x = _rnd(-35, 35);
      z = _rnd(-35, 35);
      w = _rnd(3, 8);
      h = _rnd(4, 12);
      d = _rnd(3, 8);
      geo = new THREE.BoxGeometry(w, h, d);
      mat = _makeMat(_pick(BLDG_COLORS));
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, z);
      mesh._isSolid = true;
      mesh._w = w; mesh._h = h; mesh._d = d;
      _addMesh(mesh);
    }

    // 4 Vehicle wrecks
    for (i = 0; i < CFG.WRECK_COUNT; i++) {
      x = _rnd(-38, 38);
      z = _rnd(-38, 38);
      geo = new THREE.BoxGeometry(_rnd(3, 5), 1.5, _rnd(5, 8));
      mat = _makeMat(0x443322);
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.75, z);
      mesh.rotation.y = _rnd(0, Math.PI);
      _addMesh(mesh);
    }

    // Trees (CylinderGeometry trunk + cone top)
    var j;
    for (i = 0; i < CFG.TREE_COUNT; i++) {
      x = _rnd(-38, 38);
      z = _rnd(-38, 38);
      // Trunk
      geo = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
      mat = _makeMat(0x553311);
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 1.5, z);
      _addMesh(mesh);
      // Canopy
      geo = new THREE.CylinderGeometry(0, 2, 4, 7);
      mat = _makeMat(0x225522);
      var canopy = new THREE.Mesh(geo, mat);
      canopy.position.set(x, 5, z);
      _addMesh(canopy);
    }

    // 30 Loot crates
    for (i = 0; i < CFG.CRATE_COUNT; i++) {
      x = _rnd(-37, 37);
      z = _rnd(-37, 37);
      geo = new THREE.BoxGeometry(1, 1, 1);
      mat = new THREE.MeshLambertMaterial({ color: 0x44FFAA, emissive: 0x113322 });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.5, z);
      var crate = {
        mesh: mesh,
        opened: false,
        contents: _genCrateContents()
      };
      _scene.add(mesh);
      _crates.push(crate);
    }

    // 3 ATV vehicles
    for (i = 0; i < CFG.ATV_COUNT; i++) {
      x = _rnd(-30, 30);
      z = _rnd(-30, 30);
      geo = new THREE.BoxGeometry(2.5, 1.2, 4);
      mat = _makeMat(0x556633);
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.6, z);
      var atv = {
        mesh: mesh,
        hp: 100,
        tireDmg: 0,
        engineDmg: 0,
        occupant: null
      };
      _scene.add(mesh);
      _vehicles.push(atv);
    }

    // Zone ring (LineSegments circle)
    _buildZoneRing();
  }

  function _buildZoneRing() {
    if (_zoneRing) {
      _scene.remove(_zoneRing);
      if (_zoneRing.geometry) _zoneRing.geometry.dispose();
      if (_zoneRing.material) _zoneRing.material.dispose();
    }
    var segments = 64;
    var positions = [];
    var i, angle;
    for (i = 0; i <= segments; i++) {
      angle = (i / segments) * Math.PI * 2;
      positions.push(
        Math.cos(angle) * _zoneCurRadius + _zoneCenter.x, 0.3,
        Math.sin(angle) * _zoneCurRadius + _zoneCenter.z
      );
      if (i > 0 && i < segments) {
        positions.push(
          Math.cos(angle) * _zoneCurRadius + _zoneCenter.x, 0.3,
          Math.sin(angle) * _zoneCurRadius + _zoneCenter.z
        );
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x0088FF, linewidth: 2 });
    _zoneRing = new THREE.LineSegments(geo, mat);
    _scene.add(_zoneRing);
  }

  function _updateZoneRing() {
    if (!_zoneRing || !_zoneCenter) return;
    var segments = 64;
    var positions = [];
    var i, angle;
    for (i = 0; i <= segments; i++) {
      angle = (i / segments) * Math.PI * 2;
      positions.push(
        Math.cos(angle) * _zoneCurRadius + _zoneCenter.x, 0.3,
        Math.sin(angle) * _zoneCurRadius + _zoneCenter.z
      );
      if (i > 0 && i < segments) {
        positions.push(
          Math.cos(angle) * _zoneCurRadius + _zoneCenter.x, 0.3,
          Math.sin(angle) * _zoneCurRadius + _zoneCenter.z
        );
      }
    }
    _zoneRing.geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3)
    );
    _zoneRing.geometry.attributes.position.needsUpdate = true;
  }

  function _genCrateContents() {
    var roll = Math.random();
    if (roll < 0.25) return { type: 'weapon', weapon: _pick(['rifle', 'shotgun', 'sniper']) };
    if (roll < 0.45) return { type: 'armor',  armor: _pick(['light', 'medium', 'heavy'])  };
    if (roll < 0.65) return { type: 'medkit', heal: _rnd(30, 60)                           };
    return { type: 'grenade', count: _rndInt(1, 3) };
  }

  /* ── AI Spawning ─────────────────────────────────────────── */
  function _spawnAIs() {
    var i, x, z, geo, mat, mesh, ai;
    for (i = 0; i < CFG.AI_COUNT; i++) {
      x = _rnd(-35, 35);
      z = _rnd(-35, 35);
      geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
      mat = _makeMat(_pick(AI_COLORS));
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.9, z);
      _scene.add(mesh);

      ai = {
        mesh: mesh,
        hp: 100,
        maxHp: 100,
        alive: true,
        weapon: _pick(AI_WEAPONS),
        armor: _pick(['none', 'none', 'none', 'light', 'medium']),
        armorDur: 3,
        name: AI_NAMES[i] || ('AI' + i),
        state: 'idle',        // idle | loot | engage | flee | laststand
        fireCD: 0,
        grenadesLeft: _rndInt(0, 2),
        grenadeCD: 0,
        targetLoot: null,
        fleeTimer: 0
      };
      _ais.push(ai);
    }
  }

  /* ── Player setup ────────────────────────────────────────── */
  function _spawnPlayer() {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat = _makeMat(0xDDCC99);
    _playerMesh = new THREE.Mesh(geo, mat);
    _playerMesh.position.set(0, CFG.PARACHUTE_Y_START, 0);
    _scene.add(_playerMesh);

    _playerPos = _v3(0, CFG.PARACHUTE_Y_START, 0);
    _playerVel = _v3(0, -CFG.PARACHUTE_FREE_FALL_SPEED, 0);
    _playerHP = 100;
    _playerDead = false;
    _playerKills = 0;
    _playerWeapons = ['pistol'];
    _playerWeaponIdx = 0;
    _playerArmor = 'none';
    _playerArmorDur = 0;
    _playerGrenades = 0;
    _inDrop = true;
    _parachuteOpen = false;
    _landed = false;
  }

  /* ── Zone logic ──────────────────────────────────────────── */
  function _updateZone(dt) {
    _gameTime += dt;

    // determine current and next stage
    var stages = CFG.ZONE_STAGES;
    var stageIdx = 0;
    var i;
    for (i = stages.length - 1; i >= 0; i--) {
      if (_gameTime >= stages[i].time) { stageIdx = i; break; }
    }

    var curStage  = stages[stageIdx];
    var nextStage = stages[Math.min(stageIdx + 1, stages.length - 1)];

    // lerp radius between current and next stage based on elapsed time
    if (stageIdx < stages.length - 1) {
      var segDur   = nextStage.time - curStage.time;
      var segElapsed = _gameTime - curStage.time;
      var t = Math.min(1, segElapsed / segDur);
      _zoneCurRadius = curStage.radius + (nextStage.radius - curStage.radius) * t;
    } else {
      _zoneCurRadius = curStage.radius;
    }

    _zoneNextRadius = nextStage.radius;
    _zoneNextTime   = nextStage.time;

    _updateZoneRing();

    // Zone damage to player
    if (_landed && _zoneCenter && _playerMesh) {
      var pdist = _dist2D(
        _playerMesh.position.x, _playerMesh.position.z,
        _zoneCenter.x, _zoneCenter.z
      );
      if (pdist > _zoneCurRadius) {
        _damagePlayer(CFG.ZONE_DAMAGE_PER_SEC * dt, 'zone');
      }
    }

    // Zone damage to AIs
    for (i = 0; i < _ais.length; i++) {
      var ai = _ais[i];
      if (!ai.alive || !ai.mesh) continue;
      var adist = _dist2D(
        ai.mesh.position.x, ai.mesh.position.z,
        _zoneCenter.x, _zoneCenter.z
      );
      if (adist > _zoneCurRadius) {
        _damageAI(ai, CFG.ZONE_DAMAGE_PER_SEC * dt, null);
      }
    }
  }

  /* ── Parachute drop update ───────────────────────────────── */
  function _updateDrop(dt) {
    if (!_inDrop) return;

    var fallSpeed = _parachuteOpen
      ? CFG.PARACHUTE_FALL_SPEED
      : CFG.PARACHUTE_FREE_FALL_SPEED;

    _playerMesh.position.y -= fallSpeed * dt;
    _playerPos.copy(_playerMesh.position);

    // Camera follows during drop
    if (_camera) {
      _camera.position.set(
        _playerMesh.position.x,
        _playerMesh.position.y + 10,
        _playerMesh.position.z + 20
      );
      _camera.lookAt(_playerMesh.position);
    }

    if (_playerMesh.position.y <= 0.9) {
      _playerMesh.position.y = 0.9;
      _inDrop = false;
      _landed = true;
      _parachuteOpen = false;
    }
  }

  /* ── Player movement (WASD) ──────────────────────────────── */
  var _keys = {};
  function _onKeyDownMove(e) {
    _keys[e.key ? e.key.toLowerCase() : ''] = true;
  }
  function _onKeyUpMove(e) {
    _keys[e.key ? e.key.toLowerCase() : ''] = false;
  }

  function _updatePlayerMovement(dt) {
    if (!_landed || _playerDead) return;

    // If in vehicle, handle vehicle movement
    if (_playerVehicle) {
      _updateVehicleDrive(dt);
      return;
    }

    var speed = 6;
    var dx = 0, dz = 0;
    if (_keys['w'] || _keys['arrowup'])    dz -= 1;
    if (_keys['s'] || _keys['arrowdown'])  dz += 1;
    if (_keys['a'] || _keys['arrowleft'])  dx -= 1;
    if (_keys['d'] || _keys['arrowright']) dx += 1;

    if (dx !== 0 || dz !== 0) {
      var len = Math.sqrt(dx * dx + dz * dz);
      dx /= len; dz /= len;
      _playerMesh.position.x += dx * speed * dt;
      _playerMesh.position.z += dz * speed * dt;
      // Clamp to map
      _playerMesh.position.x = Math.max(-40, Math.min(40, _playerMesh.position.x));
      _playerMesh.position.z = Math.max(-40, Math.min(40, _playerMesh.position.z));
      _playerPos.copy(_playerMesh.position);
    }

    // Camera follow
    if (_camera) {
      _camera.position.set(
        _playerMesh.position.x,
        _playerMesh.position.y + 12,
        _playerMesh.position.z + 18
      );
      _camera.lookAt(_playerMesh.position);
    }
  }

  /* ── Vehicle driving ─────────────────────────────────────── */
  function _updateVehicleDrive(dt) {
    if (!_playerVehicle) return;
    var v = _playerVehicle;
    if (v.engineDmg >= 100) return; // engine stopped

    var speed = 14 * (1 - v.tireDmg / 200);
    if (v.engineDmg > 50) speed *= 0.4;

    var dx = 0, dz = 0;
    if (_keys['w'] || _keys['arrowup'])    dz -= 1;
    if (_keys['s'] || _keys['arrowdown'])  dz += 1;
    if (_keys['a'] || _keys['arrowleft'])  dx -= 1;
    if (_keys['d'] || _keys['arrowright']) dx += 1;

    if (dx !== 0 || dz !== 0) {
      var len = Math.sqrt(dx * dx + dz * dz);
      dx /= len; dz /= len;
      v.mesh.position.x += dx * speed * dt;
      v.mesh.position.z += dz * speed * dt;
      v.mesh.position.x = Math.max(-40, Math.min(40, v.mesh.position.x));
      v.mesh.position.z = Math.max(-40, Math.min(40, v.mesh.position.z));
    }

    // Player rides on top of ATV
    _playerMesh.position.x = v.mesh.position.x;
    _playerMesh.position.z = v.mesh.position.z;
    _playerMesh.position.y = v.mesh.position.y + 1.5;
    _playerPos.copy(_playerMesh.position);

    // Run over nearby AIs
    var i;
    for (i = 0; i < _ais.length; i++) {
      var ai = _ais[i];
      if (!ai.alive) continue;
      var d = _dist2D(
        v.mesh.position.x, v.mesh.position.z,
        ai.mesh.position.x, ai.mesh.position.z
      );
      if (d < 2.5 && (dx !== 0 || dz !== 0)) {
        _damageAI(ai, CFG.ATV_RUN_OVER_DMG, 'ATV');
      }
    }

    if (_camera) {
      _camera.position.set(
        v.mesh.position.x,
        v.mesh.position.y + 14,
        v.mesh.position.z + 20
      );
      _camera.lookAt(v.mesh.position);
    }
  }

  function _tryToggleVehicle() {
    if (_playerVehicle) {
      // Exit vehicle
      _playerVehicle.occupant = null;
      _playerVehicle = null;
      return;
    }
    // Find nearest vehicle within 4 units
    var best = null, bestDist = 4;
    var i;
    for (i = 0; i < _vehicles.length; i++) {
      var v = _vehicles[i];
      if (v.occupant) continue;
      var d = _dist2D(
        _playerMesh.position.x, _playerMesh.position.z,
        v.mesh.position.x, v.mesh.position.z
      );
      if (d < bestDist) { bestDist = d; best = v; }
    }
    if (best) {
      best.occupant = 'player';
      _playerVehicle = best;
    }
  }

  /* ── Crate interaction ───────────────────────────────────── */
  function _tryOpenCrate() {
    var i;
    for (i = 0; i < _crates.length; i++) {
      var crate = _crates[i];
      if (crate.opened) continue;
      var d = _dist2D(
        _playerMesh.position.x, _playerMesh.position.z,
        crate.mesh.position.x, crate.mesh.position.z
      );
      if (d > 3) continue;

      crate.opened = true;
      crate.mesh.visible = false;
      _applyLoot(crate.contents, true);
      break;
    }
  }

  function _applyLoot(contents, isPlayer, ai) {
    if (!contents) return;
    if (isPlayer) {
      if (contents.type === 'weapon') {
        _upgradePlayerWeapon(contents.weapon);
      } else if (contents.type === 'armor') {
        _playerArmor = contents.armor;
        _playerArmorDur = ARMOR_TYPES[contents.armor].durability;
      } else if (contents.type === 'medkit') {
        _playerHP = Math.min(100, _playerHP + contents.heal);
      } else if (contents.type === 'grenade') {
        _playerGrenades += contents.count;
      }
    } else if (ai) {
      if (contents.type === 'weapon') {
        var rank = WEAPON_KEYS.indexOf(ai.weapon);
        var newRank = WEAPON_KEYS.indexOf(contents.weapon);
        if (newRank > rank) ai.weapon = contents.weapon;
      } else if (contents.type === 'medkit') {
        ai.hp = Math.min(ai.maxHp, ai.hp + 40);
      } else if (contents.type === 'grenade') {
        ai.grenadesLeft += contents.count;
      }
    }
  }

  function _upgradePlayerWeapon(weapon) {
    // pistol → rifle → sniper chain
    var chain = { pistol: 'rifle', rifle: 'sniper' };
    var i;
    for (i = 0; i < _playerWeapons.length; i++) {
      if (_playerWeapons[i] === weapon) return; // already have it
    }
    _playerWeapons.push(weapon);
    if (_playerWeapons.length > 4) _playerWeapons.shift();
  }

  /* ── Combat ──────────────────────────────────────────────── */
  function _playerShoot() {
    if (_playerDead || !_landed) return;
    var weapon = _playerWeapons[_playerWeaponIdx] || 'pistol';
    var wCfg = WEAPONS[weapon];
    if (!wCfg) return;

    // Find nearest AI in range
    var i, best = null, bestDist = wCfg.range;
    for (i = 0; i < _ais.length; i++) {
      var ai = _ais[i];
      if (!ai.alive) continue;
      var d = _dist2D(
        _playerMesh.position.x, _playerMesh.position.z,
        ai.mesh.position.x, ai.mesh.position.z
      );
      if (d < bestDist) { bestDist = d; best = ai; }
    }

    if (best) {
      var dmg = wCfg.damage;
      _damageAI(best, dmg, weapon);
    }
  }

  function _throwGrenade() {
    if (_playerDead || !_landed || _playerGrenades <= 0) return;
    _playerGrenades--;
    var wCfg = WEAPONS.grenade;

    // Damage all AIs within blast radius
    var i;
    for (i = 0; i < _ais.length; i++) {
      var ai = _ais[i];
      if (!ai.alive) continue;
      var d = _dist2D(
        _playerMesh.position.x, _playerMesh.position.z,
        ai.mesh.position.x, ai.mesh.position.z
      );
      if (d < wCfg.range) {
        var falloff = 1 - (d / wCfg.range);
        _damageAI(ai, wCfg.damage * falloff, 'grenade');
      }
    }
  }

  function _damageAI(ai, dmg, weaponName) {
    if (!ai.alive) return;

    // Apply armor reduction
    if (ai.armor && ai.armor !== 'none') {
      var armorCfg = ARMOR_TYPES[ai.armor];
      dmg = dmg * (1 - armorCfg.reduction);
      ai.armorDur--;
      if (ai.armorDur <= 0) ai.armor = 'none';
    }

    ai.hp -= dmg;

    if (ai.hp <= 30 && ai.hp > 0 && ai.state !== 'laststand') {
      ai.state = 'flee';
      ai.fleeTimer = _rnd(3, 6);
    }

    if (ai.hp <= 0) {
      ai.alive = false;
      ai.hp = 0;
      ai.mesh.visible = false;

      if (weaponName) {
        // Player kill
        _playerKills++;
        _addKillFeed('You', ai.name, weaponName, true);
      } else {
        _addKillFeed('Zone', ai.name, 'storm', false);
      }
      _checkWin();
    }
  }

  function _damagePlayer(dmg, source) {
    if (_playerDead) return;

    // Apply armor
    if (_playerArmor && _playerArmor !== 'none') {
      var armorCfg = ARMOR_TYPES[_playerArmor];
      dmg = dmg * (1 - armorCfg.reduction);
      if (source !== 'zone') {
        _playerArmorDur--;
        if (_playerArmorDur <= 0) _playerArmor = 'none';
      }
    }

    _playerHP -= dmg;
    if (_playerHP <= 0) {
      _playerHP = 0;
      _playerDead = true;
      _showOverlay('YOU WERE ELIMINATED', '#ff4444');
    }
  }

  /* ── Kill feed ───────────────────────────────────────────── */
  function _addKillFeed(killer, victim, weapon, isPlayer) {
    _killFeed.unshift({ killer: killer, victim: victim, weapon: weapon, isPlayer: isPlayer });
    if (_killFeed.length > CFG.KILL_FEED_MAX) _killFeed.pop();
  }

  /* ── AI update ───────────────────────────────────────────── */
  function _updateAIs(dt) {
    var looting = _gameTime < CFG.LOOT_WINDOW;
    var i, ai, playerInRange, d, wx;

    for (i = 0; i < _ais.length; i++) {
      ai = _ais[i];
      if (!ai.alive) continue;

      ai.fireCD   = Math.max(0, ai.fireCD   - dt);
      ai.grenadeCD = Math.max(0, ai.grenadeCD - dt);

      // Check player line-of-sight distance
      playerInRange = false;
      if (_playerMesh && !_playerDead && _landed) {
        d = _dist2D(
          ai.mesh.position.x, ai.mesh.position.z,
          _playerMesh.position.x, _playerMesh.position.z
        );
        wx = WEAPONS[ai.weapon] || WEAPONS.pistol;
        if (d <= wx.range) playerInRange = true;
      }

      // State machine
      if (ai.hp <= 15 && ai.grenadesLeft > 0) {
        ai.state = 'laststand';
      } else if (ai.hp <= 30 && ai.state !== 'laststand') {
        if (ai.state !== 'flee') { ai.state = 'flee'; ai.fleeTimer = _rnd(3, 6); }
      }

      if (ai.state === 'flee') {
        ai.fleeTimer -= dt;
        _aiMoveFlee(ai, dt);
        if (ai.fleeTimer <= 0) ai.state = 'idle';
      } else if (ai.state === 'laststand') {
        if (playerInRange && ai.grenadeCD <= 0 && ai.grenadesLeft > 0) {
          _aiThrowGrenade(ai);
        }
      } else if (!looting && playerInRange) {
        ai.state = 'engage';
        _aiEngage(ai, dt);
      } else if (looting || ai.state === 'idle' || ai.state === 'loot') {
        _aiLoot(ai, dt);
      } else if (ai.state === 'engage') {
        // chase player
        _aiMoveToward(ai, _playerMesh.position.x, _playerMesh.position.z, 4, dt);
      }
    }

    // AI vs AI — removed detailed ai-ai combat to keep performant
    // AIs naturally reduce each other through zone pressure
  }

  function _aiEngage(ai, dt) {
    if (!_playerMesh || _playerDead) return;
    _aiMoveToward(ai, _playerMesh.position.x, _playerMesh.position.z, 5, dt);

    var wx = WEAPONS[ai.weapon] || WEAPONS.pistol;
    var d = _dist2D(
      ai.mesh.position.x, ai.mesh.position.z,
      _playerMesh.position.x, _playerMesh.position.z
    );
    if (d <= wx.range && ai.fireCD <= 0) {
      ai.fireCD = wx.fireRate;
      var dmg = wx.damage * _rnd(0.7, 1.0);
      _addKillFeed(ai.name, 'You', ai.weapon, false);
      _damagePlayer(dmg, ai.weapon);
    }
  }

  function _aiMoveFlee(ai, dt) {
    if (!_playerMesh) return;
    var dx = ai.mesh.position.x - _playerMesh.position.x;
    var dz = ai.mesh.position.z - _playerMesh.position.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) { dx = _rnd(-1, 1); dz = _rnd(-1, 1); len = 1; }
    dx /= len; dz /= len;
    ai.mesh.position.x += dx * 5 * dt;
    ai.mesh.position.z += dz * 5 * dt;
    ai.mesh.position.x = Math.max(-40, Math.min(40, ai.mesh.position.x));
    ai.mesh.position.z = Math.max(-40, Math.min(40, ai.mesh.position.z));
  }

  function _aiMoveToward(ai, tx, tz, speed, dt) {
    var dx = tx - ai.mesh.position.x;
    var dz = tz - ai.mesh.position.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 2) return;
    dx /= len; dz /= len;
    ai.mesh.position.x += dx * speed * dt;
    ai.mesh.position.z += dz * speed * dt;
    ai.mesh.position.x = Math.max(-40, Math.min(40, ai.mesh.position.x));
    ai.mesh.position.z = Math.max(-40, Math.min(40, ai.mesh.position.z));
  }

  function _aiLoot(ai, dt) {
    // Find nearest unopened crate
    if (!ai.targetLoot) {
      var best = null, bestDist = 999;
      var i;
      for (i = 0; i < _crates.length; i++) {
        if (_crates[i].opened) continue;
        var d = _dist2D(
          ai.mesh.position.x, ai.mesh.position.z,
          _crates[i].mesh.position.x, _crates[i].mesh.position.z
        );
        if (d < bestDist) { bestDist = d; best = _crates[i]; }
      }
      ai.targetLoot = best;
    }

    if (!ai.targetLoot || ai.targetLoot.opened) {
      ai.targetLoot = null;
      return;
    }

    _aiMoveToward(ai, ai.targetLoot.mesh.position.x, ai.targetLoot.mesh.position.z, 4, dt);

    var dc = _dist2D(
      ai.mesh.position.x, ai.mesh.position.z,
      ai.targetLoot.mesh.position.x, ai.targetLoot.mesh.position.z
    );
    if (dc < 1.5) {
      var crate = ai.targetLoot;
      crate.opened = true;
      crate.mesh.visible = false;
      _applyLoot(crate.contents, false, ai);
      ai.targetLoot = null;
    }
  }

  function _aiThrowGrenade(ai) {
    if (!_playerMesh || ai.grenadesLeft <= 0) return;
    ai.grenadesLeft--;
    ai.grenadeCD = 4;

    var d = _dist2D(
      ai.mesh.position.x, ai.mesh.position.z,
      _playerMesh.position.x, _playerMesh.position.z
    );
    if (d < WEAPONS.grenade.range) {
      var falloff = 1 - (d / WEAPONS.grenade.range);
      _damagePlayer(WEAPONS.grenade.damage * falloff, 'grenade');
    }
  }

  /* ── Win/Lose checks ─────────────────────────────────────── */
  function _checkWin() {
    var aliveCount = 0;
    var i;
    for (i = 0; i < _ais.length; i++) {
      if (_ais[i].alive) aliveCount++;
    }
    if (aliveCount === 0 && !_playerDead) {
      _showOverlay('#1 VICTORY ROYALE!', '#FFDD00');
    }
  }

  function _aliveCount() {
    var n = _playerDead ? 0 : 1;
    var i;
    for (i = 0; i < _ais.length; i++) {
      if (_ais[i].alive) n++;
    }
    return n;
  }

  /* ── HUD ─────────────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'br-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'right:0',
      'background:rgba(0,0,0,0.55)',
      'color:#eee',
      'font:14px/1.6 monospace',
      'padding:6px 12px',
      'z-index:9999',
      'pointer-events:none',
      'display:flex',
      'justify-content:space-between',
      'align-items:flex-start'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var alive = _aliveCount();
    var armorCfg = ARMOR_TYPES[_playerArmor] || ARMOR_TYPES.none;
    var armorStr = _playerArmor === 'none'
      ? 'None'
      : (armorCfg.name + '/' + _playerArmorDur);

    var weapStr = '';
    var i;
    for (i = 0; i < _playerWeapons.length; i++) {
      if (i === _playerWeaponIdx) weapStr += '[' + _playerWeapons[i] + '] ';
      else weapStr += _playerWeapons[i] + ' ';
    }
    if (_playerGrenades > 0) weapStr += 'GRN:' + _playerGrenades;

    var timeToNext = 0;
    var stages = CFG.ZONE_STAGES;
    var nextStageTime = stages[stages.length - 1].time;
    for (i = 0; i < stages.length; i++) {
      if (stages[i].time > _gameTime) { nextStageTime = stages[i].time; break; }
    }
    timeToNext = Math.max(0, Math.ceil(nextStageTime - _gameTime));

    var mainText = [
      'BATTLE ROYALE',
      '[ALIVE: ' + alive + '/' + CFG.TOTAL_PLAYERS + ']',
      '[ZONE: ' + Math.round(_zoneCurRadius) + 'm]',
      '[ZONE CLOSES: ' + timeToNext + 's]',
      '[ARMOR: ' + armorStr + ']',
      '| WEAPONS: ' + weapStr.trim(),
      '| KILLS: ' + _playerKills,
      '| HP: ' + Math.round(_playerHP)
    ].join(' ');

    // Kill feed (right side)
    var feedHtml = '';
    for (i = 0; i < _killFeed.length; i++) {
      var kf = _killFeed[i];
      var color = kf.isPlayer ? '#ffdd44' : '#aaaaaa';
      feedHtml += '<div style="color:' + color + ';font-size:12px;">' +
        kf.killer + ' &rsaquo; ' + kf.victim + ' [' + kf.weapon + ']</div>';
    }

    _hudEl.innerHTML =
      '<div>' + mainText + '</div>' +
      '<div style="text-align:right">' + feedHtml + '</div>';
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  /* ── Overlay ─────────────────────────────────────────────── */
  function _showOverlay(msg, color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,0.7)',
      'color:' + (color || '#fff'),
      'font:bold 48px monospace',
      'z-index:10000',
      'text-shadow:0 0 20px ' + (color || '#fff')
    ].join(';');
    el.textContent = msg;
    el.id = 'br-overlay';
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 5000);
  }

  /* ── Animation loop ──────────────────────────────────────── */
  var _animId = null;
  var _lastTime = 0;

  function _tick(now) {
    if (!_active) return;
    _animId = requestAnimationFrame(_tick);

    var dt = Math.min((now - _lastTime) / 1000, 0.1);
    _lastTime = now;

    if (_inDrop) {
      _updateDrop(dt);
    } else if (_landed) {
      _updatePlayerMovement(dt);
      _updateAIs(dt);
    }
    _updateZone(dt);
    _updateHUD();

    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  /* ── Game start / stop ───────────────────────────────────── */
  function _startGame() {
    if (_active) return;
    _active = true;

    // Find or create renderer + scene + camera
    _scene    = new THREE.Scene();
    _scene.background = new THREE.Color(0x87CEEB);
    _scene.fog = new THREE.Fog(0x87CEEB, 50, 120);

    _camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
    _camera.position.set(0, 30, 40);
    _camera.lookAt(0, 0, 0);

    _renderer = new THREE.WebGLRenderer({ antialias: false });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.domElement.id = 'br-canvas';
    _renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:999;';
    document.body.appendChild(_renderer.domElement);

    // Lighting
    var ambient = new THREE.AmbientLight(0xffffff, 0.6);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(20, 40, 20);
    _scene.add(sun);

    // Zone center (random)
    _zoneCenter = _v3(_rnd(-10, 10), 0, _rnd(-10, 10));
    _zoneCurRadius = 40;
    _zoneStageIdx = 0;
    _gameTime = 0;

    _buildMap();
    _spawnPlayer();
    _spawnAIs();
    _buildHUD();

    _lastTime = performance.now();
    _animId = requestAnimationFrame(_tick);
  }

  function _stopGame() {
    _active = false;
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }

    // Clean up scene meshes
    var i;
    for (i = 0; i < _sceneMeshes.length; i++) { _disposeObj(_sceneMeshes[i]); }
    _sceneMeshes = [];

    // Clean up crates
    for (i = 0; i < _crates.length; i++) { _disposeObj(_crates[i].mesh); }
    _crates = [];

    // Clean up vehicles
    for (i = 0; i < _vehicles.length; i++) { _disposeObj(_vehicles[i].mesh); }
    _vehicles = [];

    // Clean up AIs
    for (i = 0; i < _ais.length; i++) { _disposeObj(_ais[i].mesh); }
    _ais = [];

    if (_playerMesh) { _disposeObj(_playerMesh); _playerMesh = null; }
    if (_zoneRing) { _disposeObj(_zoneRing); _zoneRing = null; }

    // Remove canvas
    if (_renderer) {
      if (_renderer.domElement && _renderer.domElement.parentNode) {
        _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      }
      _renderer.dispose();
      _renderer = null;
    }

    _scene  = null;
    _camera = null;
    _killFeed = [];
    _playerVehicle = null;
    _keys = {};

    _removeHUD();
    var ov = document.getElementById('br-overlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

  /* ── Event binding ───────────────────────────────────────── */
  window.addEventListener('keydown', _onKeyDown,     false);
  window.addEventListener('keyup',   _onKeyUp,       false);
  window.addEventListener('keydown', _onKeyDownMove, false);
  window.addEventListener('keyup',   _onKeyUpMove,   false);
  window.addEventListener('mousedown', _onMouseDown, false);

  window.addEventListener('resize', function () {
    if (!_active || !_renderer || !_camera) return;
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
  }, false);

  /* ── Public API ──────────────────────────────────────────── */
  var api = {
    start:    _startGame,
    stop:     _stopGame,
    isActive: function () { return _active; },
    getPlayerHP:    function () { return _playerHP; },
    getPlayerKills: function () { return _playerKills; },
    getAliveCount:  _aliveCount,
    getZoneRadius:  function () { return _zoneCurRadius; },
    getGameTime:    function () { return _gameTime; }
  };

  return api;
})();
