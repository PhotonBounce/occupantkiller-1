/* ───────────────────────────────────────────────────────────────────────────
   mortar-barrage.js — Full mortar fire-mission system
   Activation : M + R simultaneously (within 400 ms)
   Keys        : W/S = elevation, A/D = azimuth, Space = fire, Q = cycle ammo
                 Tab = toggle OP / mortar pit, Z = OP zoom, C = call fire
                 R = register on marker
   API         : window.MortarBarrage = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.MortarBarrage = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────── */
  var SANDBAG_COLOR      = 0x8B6914;
  var TUBE_COLOR         = 0x444444;
  var CREW_COLOR         = 0x445544;
  var ENEMY_COLOR        = 0x554433;
  var FOXHOLE_COLOR      = 0x334433;
  var ROUND_COLOR        = 0x333333;
  var EXPLOSION_COLOR    = 0xFF4400;
  var ILLUM_COLOR        = 0xFFFFDD;
  var SMOKE_COLOR        = 0xAAAAAA;
  var WP_COLOR           = 0xFFFFFF;

  var ACTIVATION_WINDOW  = 0.4;      // seconds for M+R combo
  var ELEVATION_MIN      = 45 * Math.PI / 180;
  var ELEVATION_MAX      = 80 * Math.PI / 180;
  var ELEV_SPEED         = 0.6;      // rad/s
  var AZ_SPEED           = 0.8;      // rad/s
  var ROUND_RADIUS       = 0.5;
  var FLIGHT_MIN         = 3.0;      // seconds
  var FLIGHT_MAX         = 5.0;
  var EXPLOSION_RANGE    = 12;       // base damage radius
  var EXPLOSION_LIGHT_R  = 20;
  var DAMAGE_RADIUS_HE   = 15;
  var SMOKE_RADIUS       = 10;
  var SMOKE_LIFE         = 20;
  var ILLUM_DESCENT      = 2.0;      // units/sec downward
  var ILLUM_LIFE         = 30;
  var WP_COUNT           = 5;
  var WP_BURN_LIFE       = 3.0;
  var AMMO_HE_START      = 8;
  var AMMO_SMOKE_START   = 6;
  var AMMO_ILLUM_START   = 4;
  var AMMO_WP_START      = 4;
  var RELOAD_CREW_TIME   = 5.0;
  var RELOAD_SOLO_TIME   = 8.0;
  var OP_DISTANCE        = 25;
  var ENEMY_FIRE_MIN     = 20;
  var ENEMY_FIRE_MAX     = 30;
  var ENEMY_OFFSET_MAX   = 10;
  var BRACKET_ROUNDS     = 2;
  var FFE_ROUNDS         = 5;
  var FFE_SPREAD         = 5;
  var REG_DISPERSION     = 0.02;
  var SMOKE_SCREEN_COUNT = 8;
  var INFANTRY_COUNT     = 6;

  /* ── state ─────────────────────────────────────────────────────────── */
  var _scene      = null;
  var _camera     = null;
  var _renderer   = null;
  var _active     = false;

  /* activation combo */
  var _mKeyTime   = 0;
  var _rKeyTime   = 0;

  /* mortar pit geometry */
  var _pitGroup   = null;
  var _tubeGroup  = null;
  var _baseplate  = null;

  /* mortar state */
  var _elevation  = 60 * Math.PI / 180;  // radians from horizontal
  var _azimuth    = 0;                    // radians
  var _ammoTypes  = ['HE', 'SMOKE', 'ILLUMINATION', 'WP'];
  var _ammoIndex  = 0;
  var _ammoStock  = { HE: AMMO_HE_START, SMOKE: AMMO_SMOKE_START, ILLUMINATION: AMMO_ILLUM_START, WP: AMMO_WP_START };
  var _reloading  = false;
  var _reloadTimer= 0;
  var _reloadTime = RELOAD_CREW_TIME;

  /* crew */
  var _crewAlive  = 2;
  var _crew       = [];  /* [{mesh}] */

  /* rounds in flight */
  var _rounds     = [];  /* {mesh, x,y,z, vx,vy,vz, type, life, maxLife, apexReached, apexY, opLight} */

  /* explosions / effects */
  var _explosions = [];  /* {light, timer, maxTimer} */
  var _smokeCloud = [];  /* {mesh, life, maxLife} */
  var _illumFlare = [];  /* {light, mesh, y, life} */
  var _wpBurns    = [];  /* {mesh, life} */
  var _craters    = [];

  /* enemy mortars */
  var _enemyMortars = [];   /* {group, fireTimer, x, z} */

  /* priority targets */
  var _targets    = [];   /* {mesh, type, x, z, destroyed, bracketed, bracketCount} */

  /* registration marker */
  var _regMarker  = null;
  var _registered = false;
  var _regOffset  = { x: 0, z: 0 };

  /* bracketing */
  var _bracketTarget  = -1;
  var _bracketCount   = 0;

  /* fire for effect */
  var _ffeActive  = false;
  var _ffeCount   = 0;
  var _ffeTimer   = 0;
  var _ffeTarget  = null;   /* {x,z} */

  /* smoke screen */
  var _smokeScreenActive = false;
  var _smokeScreenCount  = 0;
  var _smokeScreenTimer  = 0;
  var _smokeScreenDir    = { x: 1, z: 0 };

  /* OP position */
  var _opGroup    = null;
  var _opActive   = false;
  var _opZoom     = false;
  var _opFOV      = 75;
  var _normalFOV  = 75;

  /* enemy infantry assault */
  var _assaultSquad = [];
  var _assaultActive= false;

  /* HUD */
  var _hudEl      = null;
  var _incomingTimer = 0;

  /* keys held */
  var _keys       = {};

  /* position of mortar in scene */
  var _pitX = 0;
  var _pitZ = 0;

  /* ── geometry helpers ──────────────────────────────────────────────── */
  function _mat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function _box(w, h, d, color) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), _mat(color));
  }

  function _cyl(rt, rb, h, segs, color) {
    return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), _mat(color));
  }

  function _sphere(r, ws, hs, color) {
    return new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), _mat(color));
  }

  function _cone(r, h, segs, color) {
    return new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), _mat(color));
  }

  /* ── build mortar pit ──────────────────────────────────────────────── */
  function _buildMortarPit(x, z) {
    _pitGroup = new THREE.Group();
    _pitGroup.position.set(x, 0, z);

    /* sandbag walls – 4 sides of a square, BoxGeometry 4×1×4 */
    var wallPositions = [
      { px: 0,    pz: -2.2, ry: 0 },
      { px: 0,    pz:  2.2, ry: Math.PI },
      { px: -2.2, pz:  0,   ry: Math.PI / 2 },
      { px:  2.2, pz:  0,   ry: -Math.PI / 2 }
    ];
    for (var i = 0; i < wallPositions.length; i++) {
      var w = _box(4, 1, 0.6, SANDBAG_COLOR);
      w.position.set(wallPositions[i].px, 0.5, wallPositions[i].pz);
      w.rotation.y = wallPositions[i].ry;
      _pitGroup.add(w);
    }

    /* baseplate */
    _baseplate = _box(1.2, 0.15, 1.2, 0x555555);
    _baseplate.position.set(0, 0.075, 0);
    _pitGroup.add(_baseplate);

    /* mortar tube group (pivots for elevation) */
    _tubeGroup = new THREE.Group();
    _tubeGroup.position.set(0, 0.15, 0);
    var tube = _cyl(0.3, 0.3, 2, 8, TUBE_COLOR);
    tube.position.y = 1;
    _tubeGroup.add(tube);
    _pitGroup.add(_tubeGroup);

    _updateTubeAngle();

    _scene.add(_pitGroup);
    _pitX = x;
    _pitZ = z;
  }

  function _updateTubeAngle() {
    if (!_tubeGroup) return;
    /* elevation: 0 = vertical, positive tilts toward ground */
    var tiltAngle = Math.PI / 2 - _elevation; /* 0=horiz => 90deg-elevation */
    _tubeGroup.rotation.set(0, _azimuth, 0);
    /* inner tube tilt */
    _tubeGroup.children[0].rotation.x = tiltAngle;
  }

  /* ── build crew NPCs ───────────────────────────────────────────────── */
  function _buildCrew() {
    var positions = [{ x: 1.2, z: 0.5 }, { x: -1.2, z: 0.5 }];
    for (var i = 0; i < 2; i++) {
      var g = new THREE.Group();
      var body = _box(0.5, 1.0, 0.4, CREW_COLOR);
      body.position.y = 0.5;
      var head = _sphere(0.2, 6, 6, CREW_COLOR);
      head.position.y = 1.25;
      g.add(body);
      g.add(head);
      g.position.set(_pitX + positions[i].x, 0, _pitZ + positions[i].z);
      _scene.add(g);
      _crew.push({ mesh: g, alive: true });
    }
  }

  /* ── build observation post ────────────────────────────────────────── */
  function _buildOP() {
    _opGroup = new THREE.Group();
    /* foxhole — CylinderGeometry */
    var foxhole = _cyl(1.2, 1.2, 1.0, 10, FOXHOLE_COLOR);
    foxhole.position.y = -0.5;
    _opGroup.add(foxhole);
    /* sandbag rim */
    var rim = _cyl(1.5, 1.5, 0.3, 10, SANDBAG_COLOR);
    rim.position.y = 0.15;
    _opGroup.add(rim);
    _opGroup.position.set(_pitX + OP_DISTANCE, 0, _pitZ);
    _scene.add(_opGroup);
  }

  /* ── build enemy mortars ───────────────────────────────────────────── */
  function _buildEnemyMortars() {
    var positions = [
      { x: _pitX + 85, z: _pitZ + 15 },
      { x: _pitX + 90, z: _pitZ - 20 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var g = new THREE.Group();
      var wall = _box(3, 0.8, 0.5, ENEMY_COLOR);
      wall.position.y = 0.4;
      g.add(wall);
      var tube = _cyl(0.25, 0.25, 1.8, 8, 0x333333);
      tube.position.y = 1.2;
      tube.rotation.x = 0.4;
      g.add(tube);
      g.position.set(positions[i].x, 0, positions[i].z);
      _scene.add(g);
      _enemyMortars.push({
        group: g,
        x: positions[i].x,
        z: positions[i].z,
        fireTimer: ENEMY_FIRE_MIN + Math.random() * (ENEMY_FIRE_MAX - ENEMY_FIRE_MIN)
      });
    }
  }

  /* ── build priority targets ────────────────────────────────────────── */
  function _buildTargets() {
    var defs = [
      { type: 'FUEL_DEPOT',  x: _pitX + 60,  z: _pitZ + 10,  color: 0x884422 },
      { type: 'AMMO_DUMP',   x: _pitX + 70,  z: _pitZ - 15,  color: 0x664422 },
      { type: 'HQ',          x: _pitX + 80,  z: _pitZ + 5,   color: 0x445566 },
      { type: 'AA_GUN',      x: _pitX + 55,  z: _pitZ - 20,  color: 0x336655 }
    ];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var g = new THREE.Group();
      var base = _box(4, 2, 4, d.color);
      base.position.y = 1;
      g.add(base);
      var roof = _box(4.4, 0.3, 4.4, d.color - 0x111111);
      roof.position.y = 2.15;
      g.add(roof);
      g.position.set(d.x, 0, d.z);
      _scene.add(g);
      _targets.push({
        mesh: g,
        type: d.type,
        x: d.x,
        z: d.z,
        destroyed: false,
        bracketCount: 0
      });
    }
  }

  /* ── build registration marker ─────────────────────────────────────── */
  function _buildRegMarker() {
    _regMarker = _box(1, 0.5, 1, 0xFF0000);
    _regMarker.position.set(_pitX + 40, 0.25, _pitZ + 5);
    _scene.add(_regMarker);
  }

  /* ── build enemy infantry (lazy, spawned on demand) ────────────────── */
  function _spawnInfantryAssault() {
    if (_assaultActive) return;
    _assaultActive = true;
    for (var i = 0; i < INFANTRY_COUNT; i++) {
      var g = new THREE.Group();
      var body = _box(0.4, 0.9, 0.35, 0x553333);
      body.position.y = 0.45;
      var head = _sphere(0.18, 5, 5, 0x553333);
      head.position.y = 1.1;
      g.add(body);
      g.add(head);
      var spawnX = _pitX + 50 + (Math.random() - 0.5) * 20;
      var spawnZ = _pitZ + (Math.random() - 0.5) * 20;
      g.position.set(spawnX, 0, spawnZ);
      _scene.add(g);
      _assaultSquad.push({ mesh: g, x: spawnX, z: spawnZ, alive: true });
    }
    _hudMessage('ENEMY ASSAULT — INFANTRY INCOMING!', 0xFF2200);
  }

  /* ── fire a mortar round ───────────────────────────────────────────── */
  function _fireRound(targetX, targetZ, ammoType) {
    if (!_active) return false;
    if (!ammoType) ammoType = _ammoTypes[_ammoIndex];
    if (_ammoStock[ammoType] <= 0) return false;
    if (_reloading) return false;

    _ammoStock[ammoType]--;

    /* calculate trajectory from pit position */
    var sx = _pitX;
    var sz = _pitZ;
    var sy = 0.15 + 2.0;  /* top of tube approx */

    /* dispersion */
    var dispersion = _registered ? (EXPLOSION_RANGE * REG_DISPERSION) : 4.0;
    var tx = targetX + (Math.random() - 0.5) * dispersion;
    var tz = targetZ + (Math.random() - 0.5) * dispersion;

    var dx = tx - sx;
    var dz = tz - sz;
    var hDist = Math.sqrt(dx * dx + dz * dz);
    var flightTime = FLIGHT_MIN + Math.random() * (FLIGHT_MAX - FLIGHT_MIN);

    var vx = dx / flightTime;
    var vz = dz / flightTime;
    /* arc: vy starts positive, gravity brings it down */
    var g = 9.81;
    var vy = (g * flightTime) / 2;  /* approximation for symmetric arc */

    var mesh = _sphere(ROUND_RADIUS, 7, 7, ROUND_COLOR);
    mesh.position.set(sx, sy, sz);
    _scene.add(mesh);

    _rounds.push({
      mesh: mesh,
      x: sx, y: sy, z: sz,
      vx: vx, vy: vy, vz: vz,
      type: ammoType,
      life: 0,
      maxLife: flightTime,
      apexReached: false,
      apexY: sy + (vy * vy) / (2 * g),
      impactX: tx,
      impactZ: tz,
      opLight: null
    });

    /* start reload */
    _reloading = true;
    _reloadTimer = 0;
    _reloadTime = (_crewAlive >= 2) ? RELOAD_CREW_TIME : RELOAD_SOLO_TIME;
    if (_crewAlive === 0) _reloadTime = RELOAD_SOLO_TIME * 1.5;

    _updateHUD();
    return true;
  }

  /* ── compute impact position from current aim ──────────────────────── */
  function _computeAimTarget() {
    /* range based on elevation angle; higher elevation = shorter range */
    var range = 100 - ((_elevation - ELEVATION_MIN) / (ELEVATION_MAX - ELEVATION_MIN)) * 60;
    var tx = _pitX + Math.sin(_azimuth) * range;
    var tz = _pitZ + Math.cos(_azimuth) * range;
    return { x: tx, z: tz, range: range };
  }

  /* ── explosion / impact ────────────────────────────────────────────── */
  function _doImpact(x, z, y, type) {
    y = y || 0;
    /* crater */
    var crater = _cyl(1.5, 0.8, 0.4, 8, 0x221100);
    crater.position.set(x, y - 0.2, z);
    crater.rotation.x = Math.PI / 2;
    _scene.add(crater);
    _craters.push(crater);

    /* explosion light */
    var light = new THREE.PointLight(EXPLOSION_COLOR, 5, EXPLOSION_LIGHT_R);
    light.position.set(x, y + 2, z);
    _scene.add(light);
    _explosions.push({ light: light, timer: 0, maxTimer: 0.4 });

    /* smoke puff */
    for (var i = 0; i < 4; i++) {
      var sm = _sphere(1.0 + Math.random(), 5, 5, SMOKE_COLOR);
      sm.position.set(x + (Math.random() - 0.5) * 4, y + 1 + Math.random() * 3, z + (Math.random() - 0.5) * 4);
      _scene.add(sm);
      _smokeCloud.push({ mesh: sm, life: 0, maxLife: 4.0, vy: 0.5 + Math.random() });
    }

    /* type-specific effects */
    if (type === 'SMOKE') {
      _doSmokeEffect(x, z, y);
    } else if (type === 'ILLUMINATION') {
      _doIllumEffect(x, z, y);
    } else if (type === 'WP') {
      _doWPEffect(x, z, y);
    }

    /* damage to targets */
    var damageRadius = (type === 'HE') ? DAMAGE_RADIUS_HE : EXPLOSION_RANGE;
    _checkTargetDamage(x, z, damageRadius, type);

    /* damage to enemy infantry */
    _checkInfantryDamage(x, z, EXPLOSION_RANGE);

    /* increment bracket count for nearest target */
    _updateBracket(x, z);
  }

  function _doSmokeEffect(x, z, y) {
    for (var i = 0; i < 6; i++) {
      var sm = _sphere(2.0 + Math.random() * 2, 5, 5, SMOKE_COLOR);
      sm.material.transparent = true;
      sm.material.opacity = 0.75;
      sm.position.set(
        x + (Math.random() - 0.5) * SMOKE_RADIUS,
        (y || 0) + 1.5 + Math.random() * 2,
        z + (Math.random() - 0.5) * SMOKE_RADIUS
      );
      _scene.add(sm);
      _smokeCloud.push({ mesh: sm, life: 0, maxLife: SMOKE_LIFE, vy: 0.2 });
    }
  }

  function _doIllumEffect(x, z, apexY) {
    /* PointLight that descends slowly */
    var light = new THREE.PointLight(ILLUM_COLOR, 3, 60);
    light.position.set(x, apexY || 20, z);
    _scene.add(light);
    /* visible flare mesh */
    var flare = _sphere(0.4, 6, 6, ILLUM_COLOR);
    flare.position.set(x, apexY || 20, z);
    _scene.add(flare);
    _illumFlare.push({ light: light, mesh: flare, life: 0, maxLife: ILLUM_LIFE });
  }

  function _doWPEffect(x, z, y) {
    for (var i = 0; i < WP_COUNT; i++) {
      var wp = _sphere(0.3, 5, 5, WP_COLOR);
      wp.material.emissive = new THREE.Color(0xFFFFFF);
      wp.material.emissiveIntensity = 0.5;
      var angle = (i / WP_COUNT) * Math.PI * 2;
      var dist = 2 + Math.random() * 3;
      wp.position.set(
        x + Math.cos(angle) * dist,
        (y || 0) + 0.3,
        z + Math.sin(angle) * dist
      );
      _scene.add(wp);
      _wpBurns.push({ mesh: wp, life: 0, maxLife: WP_BURN_LIFE });
    }
  }

  /* ── damage checks ─────────────────────────────────────────────────── */
  function _checkTargetDamage(ix, iz, radius, type) {
    for (var i = 0; i < _targets.length; i++) {
      var t = _targets[i];
      if (t.destroyed) continue;
      var dx = ix - t.x;
      var dz = iz - t.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= radius) {
        t.bracketCount++;
        if (t.bracketCount >= BRACKET_ROUNDS || _ffeActive) {
          _destroyTarget(i);
        }
      }
    }
  }

  function _destroyTarget(idx) {
    var t = _targets[idx];
    if (t.destroyed) return;
    t.destroyed = true;
    /* visually collapse — replace with debris boxes */
    _scene.remove(t.mesh);
    for (var j = 0; j < 4; j++) {
      var deb = _box(1 + Math.random(), 0.5 + Math.random(), 1 + Math.random(), 0x443322);
      deb.position.set(
        t.x + (Math.random() - 0.5) * 3,
        Math.random() * 0.5,
        t.z + (Math.random() - 0.5) * 3
      );
      deb.rotation.set(
        Math.random() * 0.5,
        Math.random() * Math.PI,
        Math.random() * 0.5
      );
      _scene.add(deb);
    }
    _hudMessage('TARGET ' + t.type + ' DESTROYED!', 0x00FF44);
    /* trigger infantry assault */
    _spawnInfantryAssault();
  }

  function _checkInfantryDamage(ix, iz, radius) {
    for (var i = 0; i < _assaultSquad.length; i++) {
      var inf = _assaultSquad[i];
      if (!inf.alive) continue;
      var dx = ix - inf.x;
      var dz = iz - inf.z;
      if (Math.sqrt(dx * dx + dz * dz) <= radius) {
        inf.alive = false;
        _scene.remove(inf.mesh);
      }
    }
  }

  /* ── bracketing logic ──────────────────────────────────────────────── */
  function _updateBracket(ix, iz) {
    /* find nearest non-destroyed target */
    var nearest = -1;
    var nearDist = 999999;
    for (var i = 0; i < _targets.length; i++) {
      if (_targets[i].destroyed) continue;
      var dx = ix - _targets[i].x;
      var dz = iz - _targets[i].z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < nearDist) {
        nearDist = d;
        nearest = i;
      }
    }
    if (nearest < 0) return;
    if (nearDist < 40) {
      _targets[nearest].bracketCount++;
      if (_targets[nearest].bracketCount >= BRACKET_ROUNDS) {
        _hudMessage('BRACKETED — FIRE FOR EFFECT!', 0xFFFF00);
      }
    }
  }

  /* ── FFE sequence ──────────────────────────────────────────────────── */
  function _startFFE(tx, tz) {
    _ffeActive = true;
    _ffeCount  = 0;
    _ffeTimer  = 0;
    _ffeTarget = { x: tx, z: tz };
  }

  /* ── smoke screen mission ──────────────────────────────────────────── */
  function _startSmokeScreen() {
    if (_ammoStock['SMOKE'] < SMOKE_SCREEN_COUNT) {
      _hudMessage('INSUFFICIENT SMOKE AMMO', 0xFF4400);
      return;
    }
    _smokeScreenActive = true;
    _smokeScreenCount  = 0;
    _smokeScreenTimer  = 0;
    _smokeScreenDir    = { x: Math.cos(_azimuth), z: Math.sin(_azimuth) };
  }

  /* ── enemy counter-battery ─────────────────────────────────────────── */
  function _enemyFireAt(em) {
    /* aim at player mortar pit + random offset */
    var tx = _pitX + (Math.random() - 0.5) * ENEMY_OFFSET_MAX;
    var tz = _pitZ + (Math.random() - 0.5) * ENEMY_OFFSET_MAX;

    /* simple parabola from enemy to target */
    var sx = em.x;
    var sz = em.z;
    var sy = 1.5;
    var dx = tx - sx;
    var dz = tz - sz;
    var flightTime = 3.5 + Math.random() * 2;
    var g2 = 9.81;

    var mesh = _sphere(ROUND_RADIUS, 7, 7, 0x553333);
    mesh.position.set(sx, sy, sz);
    _scene.add(mesh);

    _rounds.push({
      mesh: mesh,
      x: sx, y: sy, z: sz,
      vx: dx / flightTime,
      vy: (g2 * flightTime) / 2,
      vz: dz / flightTime,
      type: 'ENEMY',
      life: 0,
      maxLife: flightTime,
      apexReached: false,
      apexY: sy + (((g2 * flightTime) / 2) * ((g2 * flightTime) / 2)) / (2 * g2),
      impactX: tx,
      impactZ: tz,
      opLight: null
    });

    _incomingTimer = flightTime;
    _hudMessage('INCOMING ROUND!', 0xFF0000);
  }

  /* ── registration ──────────────────────────────────────────────────── */
  function _doRegistration() {
    if (!_regMarker) return;
    var aim = _computeAimTarget();
    var dx = aim.x - _regMarker.position.x;
    var dz = aim.z - _regMarker.position.z;
    _regOffset.x = -dx;
    _regOffset.z = -dz;
    _registered = true;
    _hudMessage('REGISTRATION COMPLETE — DISPERSION < 2%', 0x00FF88);
  }

  /* ── HUD ───────────────────────────────────────────────────────────── */
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'mortar-barrage-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#CCFF88',
      'font:bold 13px monospace',
      'padding:6px 14px',
      'border:1px solid #446622',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9000',
      'display:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl || !_active) return;
    var ammoType = _ammoTypes[_ammoIndex];
    var stock    = _ammoStock[ammoType];
    var rangeMtr = Math.round(_computeAimTarget().range);
    /* deflection in mils: azimuth * 1000 / (2π) * 6400 / 1000 → simplified */
    var deflection = Math.round((_azimuth < 0 ? _azimuth + Math.PI * 2 : _azimuth) / (Math.PI * 2) * 6400);
    var crewStr  = _crewAlive + '/2';
    var incoming = _incomingTimer > 0
      ? '0:' + (_incomingTimer < 10 ? '0' : '') + Math.ceil(_incomingTimer)
      : '--:--';
    var reloadStr = _reloading
      ? ' [RELOADING ' + Math.ceil(_reloadTime - _reloadTimer) + 's]'
      : '';
    var posStr   = _opActive ? ' [OP]' : ' [PIT]';
    _hudEl.textContent =
      'MORTAR' + posStr +
      ' [AMMO: ' + ammoType + ' x' + stock + ']' +
      ' [RANGE: ' + rangeMtr + 'm]' +
      ' [DEFL: ' + deflection + ']' +
      ' [CREW: ' + crewStr + ']' +
      reloadStr +
      ' | INCOMING: ' + incoming;
  }

  var _msgEl = null;
  var _msgTimer = 0;

  function _buildMsgEl() {
    _msgEl = document.createElement('div');
    _msgEl.id = 'mortar-barrage-msg';
    _msgEl.style.cssText = [
      'position:fixed',
      'top:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#FFFF44',
      'font:bold 15px monospace',
      'padding:6px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9001',
      'display:none'
    ].join(';');
    document.body.appendChild(_msgEl);
  }

  function _hudMessage(msg, color) {
    if (!_msgEl) return;
    _msgEl.textContent = msg;
    _msgEl.style.color = '#' + (color || 0xFFFF44).toString(16).padStart(6, '0');
    _msgEl.style.display = 'block';
    _msgTimer = 3.0;
  }

  /* ── keyboard handlers ─────────────────────────────────────────────── */
  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    _keys[k] = true;

    /* activation combo */
    if (k === 'm') _mKeyTime = performance.now() / 1000;
    if (k === 'r') _rKeyTime = performance.now() / 1000;
    var gap = Math.abs(_mKeyTime - _rKeyTime);
    if (gap < ACTIVATION_WINDOW && _mKeyTime > 0 && _rKeyTime > 0) {
      _toggleActive();
      _mKeyTime = 0;
      _rKeyTime = 0;
    }

    if (!_active) return;

    /* ammo cycle */
    if (k === 'q') {
      _ammoIndex = (_ammoIndex + 1) % _ammoTypes.length;
      _hudMessage('AMMO: ' + _ammoTypes[_ammoIndex], 0x88FFCC);
      _updateHUD();
    }

    /* fire */
    if (k === ' ') {
      e.preventDefault();
      if (!_reloading) {
        var aim = _computeAimTarget();
        /* apply registration offset */
        var tx = aim.x + (_registered ? _regOffset.x : 0);
        var tz = aim.z + (_registered ? _regOffset.z : 0);
        _fireRound(tx, tz, _ammoTypes[_ammoIndex]);
      }
    }

    /* toggle OP */
    if (k === 'tab') {
      e.preventDefault();
      _opActive = !_opActive;
      _updateHUD();
    }

    /* OP zoom */
    if (k === 'z' && _opActive) {
      _opZoom = !_opZoom;
      if (_camera && _camera.fov !== undefined) {
        _camera.fov = _opZoom ? 20 : _normalFOV;
        _camera.updateProjectionMatrix();
      }
    }

    /* call fire (OP) */
    if (k === 'c' && _opActive) {
      var aim2 = _computeAimTarget();
      _hudMessage('FIRE MISSION CALLED — GRID ' + Math.round(aim2.x) + '/' + Math.round(aim2.z), 0x00FFCC);
      /* FFE if any target in range is bracketed */
      for (var i = 0; i < _targets.length; i++) {
        if (!_targets[i].destroyed && _targets[i].bracketCount >= BRACKET_ROUNDS) {
          _startFFE(_targets[i].x, _targets[i].z);
          break;
        }
      }
    }

    /* registration */
    if (k === 'r' && _active && !_reloading) {
      _doRegistration();
    }

    /* smoke screen — Shift+Space shortcut */
    if (k === 'x') {
      _startSmokeScreen();
    }
  }

  function _onKeyUp(e) {
    _keys[e.key.toLowerCase()] = false;
  }

  /* ── toggle module on/off ──────────────────────────────────────────── */
  function _toggleActive() {
    _active = !_active;
    if (_hudEl) _hudEl.style.display = _active ? 'block' : 'none';
    if (_pitGroup) _pitGroup.visible = _active;
    if (_opGroup)  _opGroup.visible  = _active;
    if (_msgEl)    _msgEl.style.display = 'none';
    if (_active) {
      _updateHUD();
      _hudMessage('MORTAR BARRAGE ACTIVE — SPACE to fire, Q cycle ammo, Tab OP', 0x88FF88);
    }
  }

  /* ── update helpers ────────────────────────────────────────────────── */
  function _updateRounds(dt) {
    var g = 9.81;
    for (var i = _rounds.length - 1; i >= 0; i--) {
      var r = _rounds[i];
      r.life += dt;
      r.vy   -= g * dt;
      r.x    += r.vx * dt;
      r.y    += r.vy * dt;
      r.z    += r.vz * dt;
      r.mesh.position.set(r.x, r.y, r.z);

      /* illumination: release light at apex */
      if (r.type === 'ILLUMINATION' && !r.apexReached && r.vy <= 0) {
        r.apexReached = true;
        _doIllumEffect(r.x, r.z, r.y);
      }

      /* impact when y hits ground */
      if (r.y <= 0 || r.life >= r.maxLife) {
        _scene.remove(r.mesh);
        var ix = r.impactX;
        var iz = r.impactZ;
        if (r.type !== 'ENEMY') {
          _doImpact(ix, iz, 0, r.type);
        } else {
          /* enemy round — explosion near player pit */
          var elight = new THREE.PointLight(EXPLOSION_COLOR, 4, 18);
          elight.position.set(ix, 2, iz);
          _scene.add(elight);
          _explosions.push({ light: elight, timer: 0, maxTimer: 0.35 });
          /* crew casualty check */
          var pdx = ix - _pitX;
          var pdz = iz - _pitZ;
          if (Math.sqrt(pdx * pdx + pdz * pdz) < 5) {
            _checkCrewCasualty();
          }
        }
        _rounds.splice(i, 1);
      }
    }
  }

  function _checkCrewCasualty() {
    for (var i = 0; i < _crew.length; i++) {
      if (_crew[i].alive) {
        if (Math.random() < 0.4) {
          _crew[i].alive = false;
          _scene.remove(_crew[i].mesh);
          _crewAlive = Math.max(0, _crewAlive - 1);
          _hudMessage('CREW CASUALTY! CREW: ' + _crewAlive + '/2', 0xFF2200);
          return;
        }
      }
    }
  }

  function _updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.timer += dt;
      var frac = ex.timer / ex.maxTimer;
      ex.light.intensity = 5 * (1 - frac);
      if (ex.timer >= ex.maxTimer) {
        _scene.remove(ex.light);
        _explosions.splice(i, 1);
      }
    }
  }

  function _updateSmoke(dt) {
    for (var i = _smokeCloud.length - 1; i >= 0; i--) {
      var s = _smokeCloud[i];
      s.life += dt;
      s.mesh.position.y += s.vy * dt;
      var frac = s.life / s.maxLife;
      if (s.mesh.material.transparent) {
        s.mesh.material.opacity = 0.75 * (1 - frac);
      }
      var scale = 1 + frac * 2;
      s.mesh.scale.set(scale, scale, scale);
      if (s.life >= s.maxLife) {
        _scene.remove(s.mesh);
        _smokeCloud.splice(i, 1);
      }
    }
  }

  function _updateIllum(dt) {
    for (var i = _illumFlare.length - 1; i >= 0; i--) {
      var fl = _illumFlare[i];
      fl.life += dt;
      fl.light.position.y -= ILLUM_DESCENT * dt;
      fl.mesh.position.y  -= ILLUM_DESCENT * dt;
      var frac = fl.life / fl.maxLife;
      fl.light.intensity = 3 * (1 - frac);
      if (fl.life >= fl.maxLife) {
        _scene.remove(fl.light);
        _scene.remove(fl.mesh);
        _illumFlare.splice(i, 1);
      }
    }
  }

  function _updateWP(dt) {
    for (var i = _wpBurns.length - 1; i >= 0; i--) {
      var w = _wpBurns[i];
      w.life += dt;
      if (w.life >= w.maxLife) {
        _scene.remove(w.mesh);
        _wpBurns.splice(i, 1);
      }
    }
  }

  function _updateEnemyMortars(dt) {
    for (var i = 0; i < _enemyMortars.length; i++) {
      var em = _enemyMortars[i];
      em.fireTimer -= dt;
      if (em.fireTimer <= 0) {
        _enemyFireAt(em);
        em.fireTimer = ENEMY_FIRE_MIN + Math.random() * (ENEMY_FIRE_MAX - ENEMY_FIRE_MIN);
      }
    }
  }

  function _updateReload(dt) {
    if (!_reloading) return;
    _reloadTimer += dt;
    if (_reloadTimer >= _reloadTime) {
      _reloading    = false;
      _reloadTimer  = 0;
    }
  }

  function _updateElevAzimuth(dt) {
    if (_keys['w']) {
      _elevation = Math.min(ELEVATION_MAX, _elevation + ELEV_SPEED * dt);
      _updateTubeAngle();
      _updateHUD();
    }
    if (_keys['s']) {
      _elevation = Math.max(ELEVATION_MIN, _elevation - ELEV_SPEED * dt);
      _updateTubeAngle();
      _updateHUD();
    }
    if (_keys['a']) {
      _azimuth -= AZ_SPEED * dt;
      _updateTubeAngle();
      _updateHUD();
    }
    if (_keys['d']) {
      _azimuth += AZ_SPEED * dt;
      _updateTubeAngle();
      _updateHUD();
    }
  }

  function _updateFFE(dt) {
    if (!_ffeActive || !_ffeTarget) return;
    _ffeTimer += dt;
    if (_ffeCount >= FFE_ROUNDS) {
      _ffeActive = false;
      _ffeCount  = 0;
      _ffeTimer  = 0;
      _hudMessage('FIRE FOR EFFECT COMPLETE', 0x00FF88);
      return;
    }
    /* fire one round every reload cycle, chain-loaded */
    var fireInterval = (_crewAlive >= 2) ? RELOAD_CREW_TIME * 0.6 : RELOAD_SOLO_TIME * 0.8;
    if (_ffeTimer >= fireInterval && !_reloading) {
      var tx = _ffeTarget.x + (Math.random() - 0.5) * FFE_SPREAD;
      var tz = _ffeTarget.z + (Math.random() - 0.5) * FFE_SPREAD;
      _fireRound(tx, tz, 'HE');
      _ffeCount++;
      _ffeTimer = 0;
    }
  }

  function _updateSmokeScreen(dt) {
    if (!_smokeScreenActive) return;
    if (_smokeScreenCount >= SMOKE_SCREEN_COUNT) {
      _smokeScreenActive = false;
      _smokeScreenCount  = 0;
      _hudMessage('SMOKE SCREEN COMPLETE', 0xAAFFAA);
      return;
    }
    _smokeScreenTimer += dt;
    var fireInterval = (_crewAlive >= 2) ? RELOAD_CREW_TIME : RELOAD_SOLO_TIME;
    if (_smokeScreenTimer >= fireInterval && !_reloading) {
      var offset = (_smokeScreenCount - SMOKE_SCREEN_COUNT / 2) * 6;
      var perp = { x: -_smokeScreenDir.z, z: _smokeScreenDir.x };
      var aim = _computeAimTarget();
      var tx = aim.x + perp.x * offset;
      var tz = aim.z + perp.z * offset;
      _fireRound(tx, tz, 'SMOKE');
      _smokeScreenCount++;
      _smokeScreenTimer = 0;
    }
  }

  function _updateInfantry(dt) {
    if (!_assaultActive) return;
    for (var i = 0; i < _assaultSquad.length; i++) {
      var inf = _assaultSquad[i];
      if (!inf.alive) continue;
      var dx = _pitX - inf.x;
      var dz = _pitZ - inf.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) {
        var speed = 4.0;
        inf.x += (dx / dist) * speed * dt;
        inf.z += (dz / dist) * speed * dt;
        inf.mesh.position.set(inf.x, 0, inf.z);
      }
    }
  }

  function _updateIncoming(dt) {
    if (_incomingTimer > 0) {
      _incomingTimer -= dt;
      if (_incomingTimer < 0) _incomingTimer = 0;
    }
  }

  function _updateMsg(dt) {
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0) {
        _msgTimer = 0;
        if (_msgEl) _msgEl.style.display = 'none';
      }
    }
  }

  /* ── public API ────────────────────────────────────────────────────── */
  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;

    if (_camera && _camera.fov !== undefined) {
      _normalFOV = _camera.fov;
    }

    _buildHUD();
    _buildMsgEl();

    _buildMortarPit(0, 0);
    _buildCrew();
    _buildOP();
    _buildEnemyMortars();
    _buildTargets();
    _buildRegMarker();

    /* start hidden */
    if (_pitGroup)  _pitGroup.visible  = false;
    if (_opGroup)   _opGroup.visible   = false;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  function update(dt) {
    if (!_active || !_scene) return;

    _updateElevAzimuth(dt);
    _updateReload(dt);
    _updateRounds(dt);
    _updateExplosions(dt);
    _updateSmoke(dt);
    _updateIllum(dt);
    _updateWP(dt);
    _updateEnemyMortars(dt);
    _updateFFE(dt);
    _updateSmokeScreen(dt);
    _updateInfantry(dt);
    _updateIncoming(dt);
    _updateMsg(dt);
    _updateHUD();
  }

  function reset() {
    _active = false;
    _mKeyTime = 0;
    _rKeyTime = 0;

    /* remove rounds */
    for (var i = 0; i < _rounds.length; i++) {
      if (_rounds[i].mesh) _scene.remove(_rounds[i].mesh);
    }
    _rounds.length = 0;

    /* remove explosions */
    for (var j = 0; j < _explosions.length; j++) {
      _scene.remove(_explosions[j].light);
    }
    _explosions.length = 0;

    /* remove smoke */
    for (var k = 0; k < _smokeCloud.length; k++) {
      _scene.remove(_smokeCloud[k].mesh);
    }
    _smokeCloud.length = 0;

    /* remove illum */
    for (var l = 0; l < _illumFlare.length; l++) {
      _scene.remove(_illumFlare[l].light);
      _scene.remove(_illumFlare[l].mesh);
    }
    _illumFlare.length = 0;

    /* remove wp */
    for (var m = 0; m < _wpBurns.length; m++) {
      _scene.remove(_wpBurns[m].mesh);
    }
    _wpBurns.length = 0;

    /* remove crew */
    for (var n = 0; n < _crew.length; n++) {
      _scene.remove(_crew[n].mesh);
    }
    _crew.length = 0;

    /* remove assault squad */
    for (var o = 0; o < _assaultSquad.length; o++) {
      _scene.remove(_assaultSquad[o].mesh);
    }
    _assaultSquad.length = 0;

    /* remove targets */
    for (var p = 0; p < _targets.length; p++) {
      _scene.remove(_targets[p].mesh);
    }
    _targets.length = 0;

    /* remove enemy mortars */
    for (var q = 0; q < _enemyMortars.length; q++) {
      _scene.remove(_enemyMortars[q].group);
    }
    _enemyMortars.length = 0;

    /* remove pit / op */
    if (_pitGroup)  { _scene.remove(_pitGroup);  _pitGroup  = null; }
    if (_opGroup)   { _scene.remove(_opGroup);   _opGroup   = null; }
    if (_regMarker) { _scene.remove(_regMarker); _regMarker = null; }

    /* reset ammo */
    _ammoStock   = { HE: AMMO_HE_START, SMOKE: AMMO_SMOKE_START, ILLUMINATION: AMMO_ILLUM_START, WP: AMMO_WP_START };
    _ammoIndex   = 0;
    _crewAlive   = 2;
    _reloading   = false;
    _reloadTimer = 0;
    _elevation   = 60 * Math.PI / 180;
    _azimuth     = 0;
    _registered  = false;
    _ffeActive   = false;
    _ffeCount    = 0;
    _smokeScreenActive = false;
    _smokeScreenCount  = 0;
    _assaultActive     = false;
    _incomingTimer     = 0;
    _opActive          = false;
    _opZoom            = false;

    if (_hudEl) _hudEl.style.display  = 'none';
    if (_msgEl) _msgEl.style.display  = 'none';

    /* restore camera FOV */
    if (_camera && _camera.fov !== undefined) {
      _camera.fov = _normalFOV;
      _camera.updateProjectionMatrix();
    }

    /* craters stay for atmosphere */
  }

  return { init: init, update: update, reset: reset };

}());
