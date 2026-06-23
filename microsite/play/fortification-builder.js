/**
 * fortification-builder.js — Player-built defensive fortifications
 * Toggle build mode with B key.
 * IIFE pattern, all var, no import/export.
 *
 * Structures (cycle with scroll or 1-5 keys):
 *   1 — SANDBAG WALL    : BoxGeometry 2×1×0.5, tan, 200 HP, blocks bullets
 *   2 — BARBED WIRE     : 3 flat boxes in row, silver, slows enemies 60%
 *   3 — WATCH TOWER     : 2 stacked boxes, sniper platform
 *   4 — BUNKER          : U-shape of 3 boxes, 400 HP, player can crouch inside
 *   5 — MG NEST         : sandbag half-circle + auto-targeting gun, 15 dmg, 300 RPM
 *
 * Resources: start 50 materials, pickups spawn randomly as grey boxes.
 * Max 8 simultaneous structures.
 * Each structure has HP bar. Enemies damage on contact (20 dmg/s).
 * Destroyed: 6 debris particles, scale.y collapse over 0.5s.
 */
window.FortificationBuilder = (function () {
  'use strict';

  /* ── Constants ────────────────────────────────────────────────────── */
  var MAX_STRUCTURES = 8;
  var PICKUP_INTERVAL = 30; // seconds between material pickups spawning
  var PICKUP_VALUE    = 10; // materials per pickup
  var PICKUP_RANGE    = 2;  // distance to collect pickup
  var ENEMY_DAMAGE_PS = 20; // damage per second from enemy contact
  var MG_RANGE        = 20; // metres MG nest auto-targets
  var MG_DAMAGE       = 15;
  var MG_RPM          = 300;
  var MG_FIRE_INTERVAL = 60 / MG_RPM; // seconds between shots
  var COLLAPSE_TIME   = 0.5; // seconds for destroy animation
  var DEBRIS_COUNT    = 6;
  var GHOST_OPACITY   = 0.5;
  var PLACEMENT_DIST  = 5;   // how far in front of camera to project ghost

  var STRUCTURE_DEFS = [
    null, // index 0 unused — 1-based
    {
      id: 'SANDBAG_WALL',
      label: 'SANDBAG WALL',
      cost: 5,
      hp: 200,
      color: 0xC8A87A,    // tan
      build: buildSandbagWall
    },
    {
      id: 'BARBED_WIRE',
      label: 'BARBED WIRE',
      cost: 3,
      hp: 80,
      color: 0xAAAAAA,    // silver
      build: buildBarbedWire
    },
    {
      id: 'WATCH_TOWER',
      label: 'WATCH TOWER',
      cost: 12,
      hp: 250,
      color: 0x8B7355,    // dark wood
      build: buildWatchTower
    },
    {
      id: 'BUNKER',
      label: 'BUNKER',
      cost: 20,
      hp: 400,
      color: 0x6E7059,    // olive grey
      build: buildBunker
    },
    {
      id: 'MG_NEST',
      label: 'MG NEST',
      cost: 25,
      hp: 300,
      color: 0xC8A060,    // sandbag
      build: buildMgNest
    }
  ];

  /* ── Private state ───────────────────────────────────────────────── */
  var _scene        = null;
  var _camera       = null;
  var _controls     = null; // PointerLockControls reference (optional)

  var _active       = false;  // build mode on/off
  var _selectedIdx  = 1;      // current structure type (1-5)
  var _materials    = 50;     // player's material count
  var _structures   = [];     // placed structure objects
  var _pickups      = [];     // material pickup objects
  var _ghost        = null;   // preview mesh
  var _ghostValid   = false;

  var _hudEl        = null;   // build mode HUD DOM element
  var _matEl        = null;   // material counter DOM element
  var _warnEl       = null;   // MAX FORTIFICATIONS warning

  var _mousePos     = { x: 0, y: 0 };  // normalised NDC
  var _groundPlane  = null;   // THREE.Plane for raycasting onto y=0

  var _keyHandler   = null;
  var _mouseHandler = null;
  var _clickHandler = null;
  var _wheelHandler = null;

  var _pickupTimer  = 0;
  var _clock        = null;

  /* ── Geometry builders ───────────────────────────────────────────── */

  function buildSandbagWall(color) {
    var root = new THREE.Group();
    var geo  = new THREE.BoxGeometry(2, 1, 0.5);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.5;
    root.add(mesh);
    root.userData.colliderSize = { x: 2, y: 1, z: 0.5 };
    return root;
  }

  function buildBarbedWire(color) {
    var root = new THREE.Group();
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    for (var i = 0; i < 3; i++) {
      var geo  = new THREE.BoxGeometry(0.8, 0.1, 0.3);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((i - 1) * 1.0, 0.05, 0);
      root.add(mesh);
    }
    root.userData.colliderSize = { x: 3, y: 0.1, z: 0.3 };
    root.userData.isBarbedWire = true;
    return root;
  }

  function buildWatchTower(color) {
    var root = new THREE.Group();
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    // Base pillar
    var baseGeo  = new THREE.BoxGeometry(1, 3, 1);
    var base     = new THREE.Mesh(baseGeo, mat);
    base.position.y = 1.5;
    root.add(base);
    // Top platform
    var topGeo   = new THREE.BoxGeometry(1, 1, 1);
    var top      = new THREE.Mesh(topGeo, mat);
    top.position.y = 3.5;
    root.add(top);
    root.userData.colliderSize = { x: 1, y: 4, z: 1 };
    root.userData.isWatchTower = true;
    return root;
  }

  function buildBunker(color) {
    var root = new THREE.Group();
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    // Back wall
    var backGeo  = new THREE.BoxGeometry(3, 1.5, 0.5);
    var back     = new THREE.Mesh(backGeo, mat);
    back.position.set(0, 0.75, -1.25);
    root.add(back);
    // Left wall
    var leftGeo  = new THREE.BoxGeometry(0.5, 1.5, 2.5);
    var left     = new THREE.Mesh(leftGeo, mat);
    left.position.set(-1.5, 0.75, 0);
    root.add(left);
    // Right wall
    var rightGeo = new THREE.BoxGeometry(0.5, 1.5, 2.5);
    var right    = new THREE.Mesh(rightGeo, mat);
    right.position.set(1.5, 0.75, 0);
    root.add(right);
    root.userData.colliderSize = { x: 3.5, y: 1.5, z: 2.5 };
    root.userData.isBunker = true;
    return root;
  }

  function buildMgNest(color) {
    var root = new THREE.Group();
    var matSandbag = new THREE.MeshLambertMaterial({ color: color });
    var matGun     = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var matBarrel  = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Sandbag half-circle: 5 boxes arranged in arc
    var numBags = 5;
    for (var i = 0; i < numBags; i++) {
      var angle = (Math.PI / (numBags - 1)) * i; // 0 to PI arc (front open)
      var radius = 1.2;
      var bagGeo = new THREE.BoxGeometry(0.7, 0.6, 0.5);
      var bag    = new THREE.Mesh(bagGeo, matSandbag);
      bag.position.x = Math.cos(angle) * radius;
      bag.position.y = 0.3;
      bag.position.z = Math.sin(angle) * radius;
      bag.rotation.y = angle + Math.PI / 2;
      root.add(bag);
    }

    // Gun body
    var bodyGeo  = new THREE.BoxGeometry(0.25, 0.25, 0.8);
    var body     = new THREE.Mesh(bodyGeo, matGun);
    body.position.set(0, 0.7, 0);
    root.add(body);

    // Barrel
    var barrelGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    var barrel    = new THREE.Mesh(barrelGeo, matBarrel);
    barrel.position.set(0, 0.7, -0.8);
    root.add(barrel);
    root.userData.mgBarrel  = barrel;
    root.userData.mgBody    = body;

    root.userData.colliderSize = { x: 2.5, y: 0.6, z: 2.5 };
    root.userData.isMgNest     = true;
    root.userData.mgCooldown   = 0;
    return root;
  }

  /* ── Ghost (preview) mesh ────────────────────────────────────────── */

  function _buildGhostMesh(defIdx) {
    var def  = STRUCTURE_DEFS[defIdx];
    var real = def.build(def.color);
    var ghostGroup = new THREE.Group();

    real.traverse(function (child) {
      if (child.isMesh) {
        var ghostGeo = child.geometry.clone();
        var ghostMat = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          wireframe: true,
          transparent: true,
          opacity: GHOST_OPACITY
        });
        var ghost = new THREE.Mesh(ghostGeo, ghostMat);
        ghost.position.copy(child.position);
        ghost.rotation.copy(child.rotation);
        ghost.scale.copy(child.scale);
        ghostGroup.add(ghost);
      }
    });

    // Dispose real mesh (just used for shape)
    real.traverse(function (child) {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material && child.material.dispose) child.material.dispose();
      }
    });

    ghostGroup.userData.ghostMats = [];
    ghostGroup.traverse(function (child) {
      if (child.isMesh) ghostGroup.userData.ghostMats.push(child.material);
    });

    return ghostGroup;
  }

  function _setGhostColor(valid) {
    if (!_ghost) return;
    var col = valid ? 0x00ff00 : 0xff2222;
    _ghost.traverse(function (child) {
      if (child.isMesh) child.material.color.setHex(col);
    });
  }

  function _removeGhost() {
    if (_ghost) {
      _scene.remove(_ghost);
      _ghost.traverse(function (child) {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      _ghost = null;
    }
  }

  /* ── Raycasting: project onto ground plane ───────────────────────── */

  function _getGroundPosition() {
    if (!_scene || !_camera) return null;
    var raycaster = new THREE.Raycaster();
    var ndcX = (_mousePos.x / window.innerWidth) * 2 - 1;
    var ndcY = -(_mousePos.y / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera({ x: ndcX, y: ndcY }, _camera);
    var target = new THREE.Vector3();
    var hit = raycaster.ray.intersectPlane(_groundPlane, target);
    return hit ? target : null;
  }

  /* ── Overlap detection ───────────────────────────────────────────── */

  function _overlaps(pos, defIdx) {
    var def  = STRUCTURE_DEFS[defIdx];
    var sz   = def.build(def.color).userData.colliderSize || { x: 2, y: 2, z: 2 };
    // Dispose the temporary mesh used for collider lookup
    // (we just need the size from userData)
    for (var i = 0; i < _structures.length; i++) {
      var s = _structures[i];
      var dx = Math.abs(s.group.position.x - pos.x);
      var dz = Math.abs(s.group.position.z - pos.z);
      var half = (sz.x + (s.def.build(s.def.color).userData.colliderSize || { x: 2 }).x) * 0.5;
      if (dx < half && dz < half) return true;
    }
    return false;
  }

  /* ── Place structure ─────────────────────────────────────────────── */

  function _placeStructure(pos) {
    var def = STRUCTURE_DEFS[_selectedIdx];
    if (!def) return;

    if (_structures.length >= MAX_STRUCTURES) {
      _showWarning('MAX FORTIFICATIONS REACHED');
      return;
    }
    if (_materials < def.cost) {
      _showWarning('NOT ENOUGH MATERIALS (' + def.cost + ' needed)');
      return;
    }
    if (_overlaps(pos, _selectedIdx)) {
      _showWarning('CANNOT PLACE — OVERLAPPING');
      return;
    }

    _materials -= def.cost;
    _updateMatHud();

    var group = def.build(def.color);
    group.position.copy(pos);
    _scene.add(group);

    var hpBar = _createHpBar(def.hp);
    group.add(hpBar.container);
    hpBar.container.position.y = 3.0;

    var sObj = {
      group:      group,
      def:        def,
      hp:         def.hp,
      maxHp:      def.hp,
      hpBar:      hpBar,
      collapsing: false,
      collapseT:  0,
      rotation:   0   // build-mode WASD rotation
    };
    _structures.push(sObj);

    if (typeof window.AudioSystem !== 'undefined') {
      window.AudioSystem.playFortificationBuild();
    }
  }

  /* ── HP bar ──────────────────────────────────────────────────────── */

  function _createHpBar(maxHp) {
    // We'll represent the HP bar as a 3D sprite-like pair of thin boxes
    // (background grey, foreground green)
    var container = new THREE.Group();

    var bgGeo  = new THREE.BoxGeometry(1.2, 0.08, 0.02);
    var bgMat  = new THREE.MeshBasicMaterial({ color: 0x333333 });
    var bg     = new THREE.Mesh(bgGeo, bgMat);
    container.add(bg);

    var fgGeo  = new THREE.BoxGeometry(1.2, 0.08, 0.02);
    var fgMat  = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
    var fg     = new THREE.Mesh(fgGeo, fgMat);
    fg.position.z = 0.02;
    container.add(fg);

    container.rotation.x = -Math.PI / 8; // tilt toward player slightly

    return {
      container: container,
      fg:        fg,
      maxHp:     maxHp,
      update: function (currentHp) {
        var pct = Math.max(0, currentHp / maxHp);
        fg.scale.x = pct;
        fg.position.x = -(1.2 * (1 - pct)) * 0.5;
        var col = pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffaa00 : 0xff2222;
        fgMat.color.setHex(col);
      }
    };
  }

  /* ── Debris ──────────────────────────────────────────────────────── */

  function _spawnDebris(pos, color) {
    for (var i = 0; i < DEBRIS_COUNT; i++) {
      var geo = new THREE.BoxGeometry(
        0.2 + Math.random() * 0.3,
        0.2 + Math.random() * 0.3,
        0.2 + Math.random() * 0.3
      );
      var mat   = new THREE.MeshLambertMaterial({ color: 0x6B4F35 });
      var mesh  = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.position.x += (Math.random() - 0.5) * 2;
      mesh.position.y += Math.random() * 1;
      mesh.position.z += (Math.random() - 0.5) * 2;
      mesh.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
      mesh.userData.life = 2.0; // seconds
      _scene.add(mesh);
      _debrisParticles.push(mesh);
    }
  }

  var _debrisParticles = [];

  function _updateDebris(dt) {
    for (var i = _debrisParticles.length - 1; i >= 0; i--) {
      var p = _debrisParticles[i];
      p.userData.vel.y -= 9.8 * dt;
      p.position.addScaledVector(p.userData.vel, dt);
      if (p.position.y < 0) {
        p.position.y = 0;
        p.userData.vel.y = 0;
      }
      p.userData.life -= dt;
      if (p.userData.life <= 0) {
        _scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        _debrisParticles.splice(i, 1);
      }
    }
  }

  /* ── Material pickups ────────────────────────────────────────────── */

  function _spawnPickup() {
    var geo  = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var mesh = new THREE.Mesh(geo, mat);
    // Random position around player area
    var angle = Math.random() * Math.PI * 2;
    var dist  = 8 + Math.random() * 20;
    var px = 0, pz = 0;
    if (_camera) {
      px = _camera.position.x;
      pz = _camera.position.z;
    }
    mesh.position.set(
      px + Math.cos(angle) * dist,
      0.2,
      pz + Math.sin(angle) * dist
    );
    mesh.userData.isMatPickup = true;
    mesh.userData.bobOffset = Math.random() * Math.PI * 2;
    _scene.add(mesh);
    _pickups.push(mesh);
  }

  function _updatePickups(dt, elapsed) {
    if (!_camera) return;
    var camPos = _camera.position;

    for (var i = _pickups.length - 1; i >= 0; i--) {
      var p = _pickups[i];
      // Bob up and down
      p.position.y = 0.2 + Math.sin(elapsed * 2 + p.userData.bobOffset) * 0.1;
      p.rotation.y += dt * 1.5;

      // Collect if near player
      var dx = p.position.x - camPos.x;
      var dz = p.position.z - camPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < PICKUP_RANGE) {
        _materials += PICKUP_VALUE;
        _updateMatHud();
        _scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        _pickups.splice(i, 1);
        _showPickupNotif('+' + PICKUP_VALUE + ' MATERIALS');
      }
    }
  }

  /* ── MG Nest auto-targeting ──────────────────────────────────────── */

  function _updateMgNests(dt) {
    var enemies = [];
    // Try to get enemies from common game globals
    if (window._enemies && window._enemies.length) enemies = window._enemies;
    else if (window.Enemies && window.Enemies.getList) enemies = window.Enemies.getList();

    for (var i = 0; i < _structures.length; i++) {
      var s = _structures[i];
      if (!s.def || s.def.id !== 'MG_NEST') continue;
      if (s.collapsing) continue;

      s.group.userData.mgCooldown -= dt;

      // Find nearest enemy in range
      var nearest = null;
      var nearDist = MG_RANGE;
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (!e || !e.position) continue;
        var ep = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
        if (!ep) continue;
        var dx = ep.x - s.group.position.x;
        var dz = ep.z - s.group.position.z;
        var d  = Math.sqrt(dx * dx + dz * dz);
        if (d < nearDist) {
          nearDist = d;
          nearest = e;
        }
      }

      if (nearest && s.group.userData.mgCooldown <= 0) {
        s.group.userData.mgCooldown = MG_FIRE_INTERVAL;
        // Rotate barrel toward enemy
        var barrel = s.group.userData.mgBarrel;
        var body   = s.group.userData.mgBody;
        var ep2 = nearest.position || (nearest.mesh && nearest.mesh.position) || (nearest.group && nearest.group.position);
        if (barrel && ep2) {
          var dx2 = ep2.x - s.group.position.x;
          var dz2 = ep2.z - s.group.position.z;
          var targetAngle = Math.atan2(dx2, dz2);
          s.group.rotation.y = targetAngle;
        }
        // Deal damage
        if (nearest.hp !== undefined) {
          nearest.hp -= MG_DAMAGE;
        } else if (nearest.takeDamage) {
          nearest.takeDamage(MG_DAMAGE, 'mg_nest');
        } else if (typeof window.Enemies !== 'undefined' && window.Enemies.damageEnemy) {
          window.Enemies.damageEnemy(nearest, MG_DAMAGE);
        }
        if (typeof window.AudioSystem !== 'undefined') {
          window.AudioSystem.playGunshot();
        }
      }
    }
  }

  /* ── Enemy damage to structures ──────────────────────────────────── */

  function _updateEnemyDamage(dt) {
    var enemies = [];
    if (window._enemies && window._enemies.length) enemies = window._enemies;
    else if (window.Enemies && window.Enemies.getList) enemies = window.Enemies.getList();

    for (var i = 0; i < _structures.length; i++) {
      var s = _structures[i];
      if (s.collapsing) continue;
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (!e) continue;
        var ep = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
        if (!ep) continue;
        var dx = ep.x - s.group.position.x;
        var dz = ep.z - s.group.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5) {
          s.hp -= ENEMY_DAMAGE_PS * dt;
          s.hpBar.update(s.hp);
          if (s.hp <= 0) {
            _beginCollapse(s);
          }
        }
      }
    }
  }

  /* ── Barbed wire: slow enemies ───────────────────────────────────── */

  function _updateBarbedWire() {
    var enemies = [];
    if (window._enemies && window._enemies.length) enemies = window._enemies;
    else if (window.Enemies && window.Enemies.getList) enemies = window.Enemies.getList();

    for (var i = 0; i < _structures.length; i++) {
      var s = _structures[i];
      if (!s.def || s.def.id !== 'BARBED_WIRE') continue;
      if (s.collapsing) continue;
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (!e) continue;
        var ep = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
        if (!ep) continue;
        var dx = ep.x - s.group.position.x;
        var dz = ep.z - s.group.position.z;
        if (Math.abs(dx) < 1.5 && Math.abs(dz) < 0.5) {
          if (e.speedMultiplier !== undefined) {
            e.speedMultiplier = 0.4; // 60% slow
          } else if (e.speed !== undefined && !e._bbSlowed) {
            e._bbOrigSpeed = e.speed;
            e.speed *= 0.4;
            e._bbSlowed = true;
          }
        } else {
          // Restore speed if escaped wire
          if (e._bbSlowed) {
            e.speed = e._bbOrigSpeed || e.speed;
            e._bbSlowed = false;
          }
        }
      }
    }
  }

  /* ── Structure collapse animation ───────────────────────────────── */

  function _beginCollapse(s) {
    if (s.collapsing) return;
    s.collapsing = true;
    s.collapseT  = 0;
    _spawnDebris(s.group.position.clone(), s.def.color);
  }

  function _updateCollapses(dt) {
    for (var i = _structures.length - 1; i >= 0; i--) {
      var s = _structures[i];
      if (!s.collapsing) continue;
      s.collapseT += dt;
      var pct = Math.min(1, s.collapseT / COLLAPSE_TIME);
      s.group.scale.y = 1 - pct;
      if (pct >= 1) {
        _scene.remove(s.group);
        _disposeGroup(s.group);
        _structures.splice(i, 1);
      }
    }
  }

  function _disposeGroup(group) {
    group.traverse(function (child) {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(function (m) { m.dispose(); });
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  /* ── HUD ─────────────────────────────────────────────────────────── */

  function _createHud() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'fortification-builder-hud';
    _hudEl.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:140px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'border:1px solid rgba(255,200,100,0.5)',
      'border-radius:6px',
      'padding:8px 16px',
      'font-family:monospace',
      'font-size:12px',
      'color:#fff',
      'z-index:300',
      'pointer-events:none',
      'text-align:center',
      'min-width:300px'
    ].join(';');

    _hudEl.innerHTML =
      '<div style="color:#ffcc44;font-size:13px;margin-bottom:4px">&#9874; BUILD MODE</div>' +
      '<div id="fb-sel-label" style="color:#aaf;font-size:14px;font-weight:bold;margin-bottom:4px"></div>' +
      '<div style="font-size:10px;color:#aaa;margin-bottom:2px">1-5: select &nbsp; Scroll: cycle &nbsp; WASD: rotate</div>' +
      '<div style="font-size:10px;color:#aaa">LMB: place &nbsp; RMB/B: cancel &amp; exit</div>' +
      '<div id="fb-mat-count" style="color:#8c6;font-size:11px;margin-top:4px"></div>' +
      '<div id="fb-struct-count" style="color:#aaa;font-size:10px;margin-top:2px"></div>';
    document.body.appendChild(_hudEl);

    _matEl = document.getElementById('fb-mat-count');

    _warnEl = document.createElement('div');
    _warnEl.id = 'fb-warn';
    _warnEl.style.cssText = [
      'display:none',
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(255,40,0,0.85)',
      'border:2px solid #ff4444',
      'border-radius:6px',
      'padding:8px 22px',
      'font-family:monospace',
      'font-size:14px',
      'color:#fff',
      'z-index:310',
      'pointer-events:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_warnEl);
  }

  function _showHud() {
    if (_hudEl) {
      _hudEl.style.display = 'block';
      _updateHudSel();
      _updateMatHud();
    }
  }

  function _hideHud() {
    if (_hudEl) _hudEl.style.display = 'none';
  }

  function _updateHudSel() {
    var selEl = document.getElementById('fb-sel-label');
    if (selEl && STRUCTURE_DEFS[_selectedIdx]) {
      var def = STRUCTURE_DEFS[_selectedIdx];
      selEl.textContent = '[' + _selectedIdx + '] ' + def.label + '  (' + def.cost + ' mat)';
    }
    var cntEl = document.getElementById('fb-struct-count');
    if (cntEl) {
      cntEl.textContent = 'Structures: ' + _structures.length + ' / ' + MAX_STRUCTURES;
    }
  }

  function _updateMatHud() {
    if (_matEl) _matEl.textContent = 'Materials: ' + _materials;
    _updateHudSel();
  }

  var _warnTimer = 0;
  function _showWarning(msg) {
    if (_warnEl) {
      _warnEl.textContent = msg;
      _warnEl.style.display = 'block';
      _warnTimer = 2.0;
    }
  }

  function _showPickupNotif(msg) {
    var notif = document.getElementById('pickup-notif');
    if (notif) {
      notif.textContent = msg;
      setTimeout(function () { notif.textContent = ''; }, 1500);
    }
  }

  /* ── Build mode toggle & ghost rotation ─────────────────────────── */

  var _ghostRotation = 0;
  var _rotKeys       = { w: false, a: false, s: false, d: false };

  function _toggleBuildMode() {
    _active = !_active;
    if (_active) {
      _showHud();
      _refreshGhost();
    } else {
      _hideHud();
      _removeGhost();
    }
  }

  function _refreshGhost() {
    _removeGhost();
    if (!_active || !_scene) return;
    _ghost = _buildGhostMesh(_selectedIdx);
    _ghost.rotation.y = _ghostRotation;
    _scene.add(_ghost);
  }

  /* ── Input handlers ──────────────────────────────────────────────── */

  function _onKey(e) {
    var key = (e.key || '').toLowerCase();

    if (key === 'b') {
      _toggleBuildMode();
      return;
    }

    if (!_active) return;

    // Structure selection 1-5
    if (key >= '1' && key <= '5') {
      _selectedIdx = parseInt(key, 10);
      _updateHudSel();
      _refreshGhost();
      return;
    }

    // WASD rotation
    if (key === 'w') _rotKeys.w = (e.type === 'keydown');
    if (key === 'a') _rotKeys.a = (e.type === 'keydown');
    if (key === 's') _rotKeys.s = (e.type === 'keydown');
    if (key === 'd') _rotKeys.d = (e.type === 'keydown');

    if (key === 'escape') {
      _active = false;
      _hideHud();
      _removeGhost();
    }
  }

  function _onMouseMove(e) {
    _mousePos.x = e.clientX;
    _mousePos.y = e.clientY;
  }

  function _onClick(e) {
    if (!_active) return;

    if (e.button === 0) {
      // Left click — place
      var pos = _getGroundPosition();
      if (pos && _ghostValid) {
        _placeStructure(pos);
        _updateHudSel();
      } else if (pos && !_ghostValid) {
        _showWarning('INVALID PLACEMENT');
      }
    } else if (e.button === 2) {
      // Right click — cancel / exit build mode
      _active = false;
      _hideHud();
      _removeGhost();
    }
  }

  function _onWheel(e) {
    if (!_active) return;
    if (e.deltaY > 0) {
      _selectedIdx = (_selectedIdx % 5) + 1;
    } else {
      _selectedIdx = ((_selectedIdx - 2 + 5) % 5) + 1;
    }
    _updateHudSel();
    _refreshGhost();
  }

  /* ── Public API ──────────────────────────────────────────────────── */

  function init(scene, camera, controls) {
    _scene    = scene;
    _camera   = camera;
    _controls = controls || null;
    _clock    = new THREE.Clock();

    _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    _createHud();

    _keyHandler   = _onKey;
    _mouseHandler = _onMouseMove;
    _clickHandler = _onClick;
    _wheelHandler = _onWheel;

    document.addEventListener('keydown', _keyHandler);
    document.addEventListener('keyup',   _keyHandler);
    document.addEventListener('mousemove', _mouseHandler);
    document.addEventListener('mousedown', _clickHandler);
    document.addEventListener('wheel', _wheelHandler, { passive: true });

    // Spawn initial pickups
    for (var i = 0; i < 3; i++) {
      _spawnPickup();
    }

    console.log('[FortificationBuilder] init — B to toggle build mode, 50 materials');
  }

  var _elapsed = 0;

  function update(dt) {
    if (!dt || isNaN(dt)) dt = 0.016;
    _elapsed += dt;
    _pickupTimer += dt;

    // Ghost rotation from held WASD keys
    if (_active && _ghost) {
      var rotSpeed = 2.0; // rad/s
      if (_rotKeys.a) _ghostRotation += rotSpeed * dt;
      if (_rotKeys.d) _ghostRotation -= rotSpeed * dt;
      _ghost.rotation.y = _ghostRotation;

      // Update ghost position
      var gpos = _getGroundPosition();
      if (gpos) {
        _ghost.position.copy(gpos);
        var invalid = _overlaps(gpos, _selectedIdx) || _structures.length >= MAX_STRUCTURES;
        _ghostValid = !invalid;
        _setGhostColor(_ghostValid);
      }
    }

    // Warning timer
    if (_warnTimer > 0) {
      _warnTimer -= dt;
      if (_warnTimer <= 0 && _warnEl) {
        _warnEl.style.display = 'none';
      }
    }

    // Pickup spawn
    if (_pickupTimer >= PICKUP_INTERVAL) {
      _pickupTimer = 0;
      _spawnPickup();
    }

    _updatePickups(dt, _elapsed);
    _updateCollapses(dt);
    _updateDebris(dt);
    _updateEnemyDamage(dt);
    _updateBarbedWire();
    _updateMgNests(dt);

    // Keep HP bars facing camera
    if (_camera) {
      for (var i = 0; i < _structures.length; i++) {
        var s = _structures[i];
        if (s.hpBar && s.hpBar.container) {
          s.hpBar.container.quaternion.copy(_camera.quaternion);
        }
      }
    }
  }

  function build(structureType, position) {
    var idx = typeof structureType === 'number' ? structureType : 1;
    idx = Math.max(1, Math.min(5, idx));
    var pos = position || (_camera ? _camera.position.clone().add(new THREE.Vector3(0, 0, -3)) : new THREE.Vector3(0, 0, 0));
    var prevIdx = _selectedIdx;
    _selectedIdx = idx;
    _placeStructure(pos);
    _selectedIdx = prevIdx;
  }

  function demolish(index) {
    if (index === undefined) {
      // Demolish most recently placed
      if (_structures.length > 0) {
        _beginCollapse(_structures[_structures.length - 1]);
      }
    } else if (_structures[index]) {
      _beginCollapse(_structures[index]);
    }
  }

  function reset() {
    // Remove all structures
    for (var i = _structures.length - 1; i >= 0; i--) {
      _scene.remove(_structures[i].group);
      _disposeGroup(_structures[i].group);
    }
    _structures = [];

    // Remove all pickups
    for (var j = _pickups.length - 1; j >= 0; j--) {
      _scene.remove(_pickups[j]);
      _pickups[j].geometry.dispose();
      _pickups[j].material.dispose();
    }
    _pickups = [];

    // Remove all debris
    for (var k = _debrisParticles.length - 1; k >= 0; k--) {
      _scene.remove(_debrisParticles[k]);
      _debrisParticles[k].geometry.dispose();
      _debrisParticles[k].material.dispose();
    }
    _debrisParticles = [];

    _removeGhost();
    _active    = false;
    _materials = 50;
    _hideHud();
    _updateMatHud();
    _pickupTimer = 0;
    _elapsed     = 0;

    // Respawn initial pickups
    if (_scene) {
      for (var m = 0; m < 3; m++) {
        _spawnPickup();
      }
    }

    console.log('[FortificationBuilder] reset');
  }

  return {
    init:     init,
    update:   update,
    build:    build,
    demolish: demolish,
    reset:    reset
  };

})();
