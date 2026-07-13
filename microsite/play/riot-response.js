// ============================================================
//  riot-response.js — Riot control and crowd management
//  mechanics for the browser-based Three.js game.
//
//  R+R keys: activate Riot Response mode
//  Q:        equip/unequip riot shield
//  Click:    fire rubber bullet (bounces off walls, stuns 3s)
//  G:        throw tear gas canister (cloud, rioters flee 8s)
//  T:        crowd taser (stuns all rioters within 6 units, 5s)
//  B:        place barricade in front of player
//
//  Public API: init(scene, camera), update(delta), reset()
// ============================================================
window.RiotResponse = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  var RIOTER_COUNT_START  = 20;
  var RIOTER_COUNT_MAX    = 50;
  var RIOTER_WAVE_ADD     = 5;
  var WAVE_INTERVAL       = 30;     // seconds between escalation waves

  var CLUSTER_SPEED       = 1.5;    // units/s toward player
  var ORBIT_RADIUS        = 1.2;    // rioter orbit around cluster center
  var ORBIT_SPEED         = 1.0;    // radians/s

  var SHIELD_HP_MAX       = 200;
  var SHIELD_DAMAGE_BLOCK = 0.90;   // 90% damage blocked

  var RUBBER_SPEED        = 40;     // units/s
  var RUBBER_AMMO_MAX     = 48;
  var RUBBER_STUN_TIME    = 3;      // seconds

  var TEARGAS_SPEED_XZ    = 8;
  var TEARGAS_GRAVITY     = -9.8;
  var TEARGAS_CLOUD_MAX_R = 8;
  var TEARGAS_CLOUD_GROW  = 3;      // seconds to reach max radius
  var TEARGAS_FLEE_TIME   = 8;      // seconds rioters flee

  var TASER_RANGE         = 6;      // units
  var TASER_STUN_TIME     = 5;      // seconds

  var BARRICADE_W         = 3;
  var BARRICADE_H         = 1.5;
  var BARRICADE_D         = 0.3;

  var RIOTER_THROW_MIN    = 2;      // seconds
  var RIOTER_THROW_MAX    = 4;
  var ROCK_SPEED          = 10;
  var ROCK_DAMAGE         = 15;

  var MORALE_START        = 100;

  var HUD_ID              = 'rr-hud';

  // ── Private state ──────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;
  var _active         = false;

  var _rioters        = [];    // rioter objects
  var _clusters       = [];    // cluster objects
  var _projectiles    = [];    // rubber bullets
  var _rocks          = [];    // rioter thrown rocks
  var _gasCloud       = null;  // active tear gas cloud object
  var _gasCanisters   = [];    // in-flight canisters
  var _barricades     = [];    // placed barricades

  var _shieldMesh     = null;
  var _shieldEquipped = false;
  var _shieldHP       = SHIELD_HP_MAX;

  var _rubberAmmo     = RUBBER_AMMO_MAX;
  var _morale         = MORALE_START;
  var _waveTimer      = 0;
  var _waveNumber     = 0;
  var _missionEnd     = false;

  var _rKeyDown       = false;
  var _rrPending      = false;
  var _rrPendingTimer = 0;

  var _taserActive    = false;
  var _taserTimer     = 0;
  var _taserLines     = null;

  var _hudEl          = null;

  // ── Geometry helpers ────────────────────────────────────────
  function _makeRioterMesh() {
    var group = new THREE.Group();

    var headGeo  = new THREE.SphereGeometry(0.3, 8, 6);
    var headMat  = new THREE.MeshLambertMaterial({ color: 0xCC6633 });
    var head     = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.2;
    group.add(head);

    var bodyGeo  = new THREE.CylinderGeometry(0.25, 0.25, 1.0, 8);
    var bodyMat  = new THREE.MeshLambertMaterial({ color: 0xCC6633 });
    var body     = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    return group;
  }

  function _makeShieldMesh() {
    var geo = new THREE.BoxGeometry(1.2, 1.8, 0.1);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x8888AA,
      transparent: true,
      opacity: 0.7
    });
    return new THREE.Mesh(geo, mat);
  }

  function _makeRubberBullet() {
    var geo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
    return new THREE.Mesh(geo, mat);
  }

  function _makeRock() {
    var geo = new THREE.SphereGeometry(0.12, 5, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    return new THREE.Mesh(geo, mat);
  }

  function _makeGasCanister() {
    var geo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    return new THREE.Mesh(geo, mat);
  }

  function _makeGasCloud(radius) {
    var geo = new THREE.SphereGeometry(radius, 10, 8);
    var mat = new THREE.MeshLambertMaterial({
      color: 0xFFFF88,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    return new THREE.Mesh(geo, mat);
  }

  function _makeBarricade() {
    var geo = new THREE.BoxGeometry(BARRICADE_W, BARRICADE_H, BARRICADE_D);
    var mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    return new THREE.Mesh(geo, mat);
  }

  // ── Cluster management ────────────────────────────────────
  function _buildClusters(rioters) {
    var clusters = [];
    var remaining = rioters.slice();
    while (remaining.length > 0) {
      var size = 3 + Math.floor(Math.random() * 5); // 3-7
      var members = remaining.splice(0, Math.min(size, remaining.length));
      var cx = members[0].mesh.position.x;
      var cz = members[0].mesh.position.z;
      clusters.push({ members: members, cx: cx, cz: cz });
      for (var i = 0; i < members.length; i++) {
        members[i].clusterId = clusters.length - 1;
        members[i].orbitAngle = (Math.PI * 2 / members.length) * i;
      }
    }
    return clusters;
  }

  function _spawnRioters(count) {
    var scene = _scene;
    if (!scene) return;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = 18 + Math.random() * 10;
      var mesh  = _makeRioterMesh();
      mesh.position.set(
        Math.cos(angle) * dist,
        0,
        Math.sin(angle) * dist
      );
      scene.add(mesh);
      _rioters.push({
        mesh:        mesh,
        hp:          100,
        stunTimer:   0,
        fleeTimer:   0,
        throwTimer:  RIOTER_THROW_MIN + Math.random() * (RIOTER_THROW_MAX - RIOTER_THROW_MIN),
        clusterId:   -1,
        orbitAngle:  0,
        dead:        false,
        wobble:      0
      });
    }
    _clusters = _buildClusters(_rioters.filter(function (r) { return !r.dead; }));
  }

  // ── Shield ────────────────────────────────────────────────
  function _equipShield() {
    var cam = _camera;
    if (!cam || _shieldEquipped) return;
    _shieldMesh = _makeShieldMesh();
    _shieldMesh.position.set(0, 0, -1);
    cam.add(_shieldMesh);
    _shieldEquipped = true;
  }

  function _unequipShield() {
    if (!_shieldEquipped || !_shieldMesh) return;
    var cam = _camera;
    if (cam) cam.remove(_shieldMesh);
    _shieldMesh = null;
    _shieldEquipped = false;
  }

  // ── Rubber bullet fire ───────────────────────────────────
  function _fireRubberBullet() {
    if (!_active || _rubberAmmo <= 0) return;
    var cam = _camera;
    if (!cam) return;
    _rubberAmmo--;

    var mesh = _makeRubberBullet();
    var worldPos = new THREE.Vector3();
    cam.getWorldPosition(worldPos);
    mesh.position.copy(worldPos);

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion).normalize();

    _scene.add(mesh);
    _projectiles.push({
      mesh:  mesh,
      vel:   dir.multiplyScalar(RUBBER_SPEED),
      life:  5
    });
  }

  // ── Tear gas ─────────────────────────────────────────────
  function _throwTearGas() {
    if (!_active) return;
    var cam = _camera;
    if (!cam) return;

    var canisterMesh = _makeGasCanister();
    var worldPos = new THREE.Vector3();
    cam.getWorldPosition(worldPos);
    canisterMesh.position.copy(worldPos);

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion).normalize();

    _scene.add(canisterMesh);
    _gasCanisters.push({
      mesh:  canisterMesh,
      velX:  dir.x * TEARGAS_SPEED_XZ,
      velY:  4,
      velZ:  dir.z * TEARGAS_SPEED_XZ,
      life:  8
    });
  }

  function _spawnGasCloud(pos) {
    if (_gasCloud) {
      _scene.remove(_gasCloud.mesh);
    }
    var mesh = _makeGasCloud(0.1);
    mesh.position.set(pos.x, pos.y, pos.z);
    _scene.add(mesh);
    _gasCloud = {
      mesh:   mesh,
      timer:  0,
      radius: 0.1
    };
  }

  // ── Taser ────────────────────────────────────────────────
  function _activateTaser() {
    if (!_active) return;
    var cam = _camera;
    if (!cam) return;

    // Create spark line segments
    if (_taserLines) {
      _scene.remove(_taserLines);
      _taserLines = null;
    }

    var geo = new THREE.BufferGeometry();
    var verts = [];
    var worldPos = new THREE.Vector3();
    cam.getWorldPosition(worldPos);

    for (var i = 0; i < 12; i++) {
      var angle = (Math.PI * 2 / 12) * i;
      verts.push(worldPos.x, worldPos.y, worldPos.z);
      verts.push(
        worldPos.x + Math.cos(angle) * TASER_RANGE,
        worldPos.y,
        worldPos.z + Math.sin(angle) * TASER_RANGE
      );
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x4444FF });
    _taserLines = new THREE.LineSegments(geo, mat);
    _scene.add(_taserLines);

    _taserActive = true;
    _taserTimer  = 0.3; // visual lasts 0.3s

    // Stun all rioters in range
    var camPos = new THREE.Vector3();
    cam.getWorldPosition(camPos);
    for (var j = 0; j < _rioters.length; j++) {
      var r = _rioters[j];
      if (r.dead) continue;
      var dx = r.mesh.position.x - camPos.x;
      var dz = r.mesh.position.z - camPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= TASER_RANGE) {
        r.stunTimer = TASER_STUN_TIME;
        _setRioterColor(r, 0x888888);
        _dropMorale(5);
      }
    }
  }

  // ── Barricade ─────────────────────────────────────────────
  function _placeBarricade() {
    if (!_active) return;
    var cam = _camera;
    if (!cam) return;

    var mesh = _makeBarricade();
    var dir  = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion).normalize();

    var worldPos = new THREE.Vector3();
    cam.getWorldPosition(worldPos);
    mesh.position.set(
      worldPos.x + dir.x * 2,
      BARRICADE_H / 2,
      worldPos.z + dir.z * 2
    );

    _scene.add(mesh);
    _barricades.push({ mesh: mesh, hp: 300 });
  }

  // ── Color helpers ─────────────────────────────────────────
  function _setRioterColor(rioter, hex) {
    rioter.mesh.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material.color.setHex(hex);
      }
    });
  }

  function _resetRioterColor(rioter) {
    _setRioterColor(rioter, 0xCC6633);
  }

  // ── Morale ────────────────────────────────────────────────
  function _dropMorale(amount) {
    _morale -= amount;
    if (_morale < 0) _morale = 0;
    if (_morale === 0 && !_missionEnd) {
      _missionEnd = true;
      _showToast('CROWD DISPERSED — MISSION COMPLETE');
    }
  }

  // ── Rioter throw logic ────────────────────────────────────
  function _rioterThrow(rioter) {
    var cam = _camera;
    if (!cam) return;
    var rock = _makeRock();
    rock.position.copy(rioter.mesh.position);
    rock.position.y += 1.2;

    var camPos = new THREE.Vector3();
    cam.getWorldPosition(camPos);
    var dir = new THREE.Vector3(
      camPos.x - rock.position.x,
      camPos.y - rock.position.y + 0.5,
      camPos.z - rock.position.z
    ).normalize();

    _scene.add(rock);
    _rocks.push({
      mesh:   rock,
      vel:    dir.multiplyScalar(ROCK_SPEED),
      life:   5,
      damage: ROCK_DAMAGE
    });
  }

  // ── Player hit by rock ────────────────────────────────────
  function _checkRockHitPlayer(rock) {
    var cam = _camera;
    if (!cam) return false;
    var camPos = new THREE.Vector3();
    cam.getWorldPosition(camPos);
    var dx = rock.mesh.position.x - camPos.x;
    var dy = rock.mesh.position.y - camPos.y;
    var dz = rock.mesh.position.z - camPos.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.8) {
      var dmg = rock.damage;
      if (_shieldEquipped && _shieldHP > 0) {
        var blocked = dmg * SHIELD_DAMAGE_BLOCK;
        dmg = dmg - blocked;
        _shieldHP -= blocked * 0.5;
        if (_shieldHP < 0) _shieldHP = 0;
        if (_shieldHP === 0) {
          _unequipShield();
          _showToast('SHIELD BROKEN');
        }
      }
      if (window.PlayerHealth && window.PlayerHealth.damage) {
        window.PlayerHealth.damage(dmg);
      }
      return true;
    }
    return false;
  }

  // ── Rubber bullet hit checks ──────────────────────────────
  function _checkBulletHitRioter(proj) {
    for (var i = 0; i < _rioters.length; i++) {
      var r = _rioters[i];
      if (r.dead || r.stunTimer > 0) continue;
      var dx = proj.mesh.position.x - r.mesh.position.x;
      var dy = proj.mesh.position.y - r.mesh.position.y - 0.9;
      var dz = proj.mesh.position.z - r.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 0.5) {
        r.stunTimer = RUBBER_STUN_TIME;
        _setRioterColor(r, 0x888888);
        _dropMorale(3);
        return true;
      }
    }
    return false;
  }

  function _checkBulletHitBarricade(proj) {
    for (var i = 0; i < _barricades.length; i++) {
      var b = _barricades[i];
      var bx = b.mesh.position.x;
      var bz = b.mesh.position.z;
      var dx = Math.abs(proj.mesh.position.x - bx);
      var dz = Math.abs(proj.mesh.position.z - bz);
      if (dx < BARRICADE_W / 2 + 0.1 && dz < BARRICADE_D / 2 + 0.1) {
        // Reflect off barricade
        proj.vel.z = -proj.vel.z;
        return false; // don't destroy bullet
      }
    }
    return false;
  }

  // Wall bounce (simple AABB world bounds)
  function _bounceProjectile(proj) {
    var p = proj.mesh.position;
    var WALL = 50;
    if (p.x >  WALL || p.x < -WALL) { proj.vel.x = -proj.vel.x; }
    if (p.z >  WALL || p.z < -WALL) { proj.vel.z = -proj.vel.z; }
    if (p.y < 0.1)  {
      proj.vel.y = Math.abs(proj.vel.y) * 0.5;
      p.y = 0.1;
    }
  }

  // ── Rioter-barricade collision ────────────────────────────
  function _checkRioterBarricades(rioter) {
    for (var i = 0; i < _barricades.length; i++) {
      var b = _barricades[i];
      var dx = rioter.mesh.position.x - b.mesh.position.x;
      var dz = rioter.mesh.position.z - b.mesh.position.z;
      if (Math.abs(dx) < BARRICADE_W / 2 + 0.3 && Math.abs(dz) < BARRICADE_D / 2 + 0.3) {
        // Push rioter back
        var pushLen = Math.sqrt(dx * dx + dz * dz) || 1;
        rioter.mesh.position.x += (dx / pushLen) * 2;
        rioter.mesh.position.z += (dz / pushLen) * 2;
        rioter.hp -= 10;
        b.hp -= 5;
        if (b.hp <= 0) {
          _scene.remove(b.mesh);
          _barricades.splice(i, 1);
          i--;
        }
        if (rioter.hp <= 0) {
          _killRioter(rioter);
        }
      }
    }
  }

  // ── Kill rioter ───────────────────────────────────────────
  function _killRioter(rioter) {
    if (rioter.dead) return;
    rioter.dead = true;
    _scene.remove(rioter.mesh);
    _dropMorale(5);
  }

  // ── HUD ──────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = HUD_ID;
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,0,0,0.5)',
      'padding:4px 10px',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  function _updateHUD() {
    if (!_hudEl || !_active) return;
    var alive = _rioters.filter(function (r) { return !r.dead; }).length;
    _hudEl.textContent = (
      'RIOT [CROWD: ' + alive + ']' +
      ' [MORALE: ' + Math.round(_morale) + '%]' +
      ' [SHIELD: ' + (_shieldEquipped ? Math.round(_shieldHP) + 'HP' : 'NONE') + ']' +
      ' | AMMO: ' + _rubberAmmo
    );
  }

  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    } else {
      console.log('[RiotResponse] ' + msg);
    }
  }

  // ── Input handlers ────────────────────────────────────────
  function _onKeyDown(e) {
    if (!e) return;
    var key = (e.key || '').toLowerCase();

    // R+R activation (two R presses within 0.5s)
    if (key === 'r') {
      if (_rKeyDown && _rrPending && _rrPendingTimer > 0) {
        _activateRiotResponse();
        _rrPending = false;
      } else if (!_rKeyDown) {
        _rrPending = true;
        _rrPendingTimer = 0.5;
      }
      _rKeyDown = true;
      return;
    }

    if (!_active) return;

    if (key === 'q') {
      if (_shieldEquipped) { _unequipShield(); }
      else                 { _equipShield();   }
    }
    if (key === 'g') { _throwTearGas(); }
    if (key === 't') { _activateTaser(); }
    if (key === 'b') { _placeBarricade(); }
  }

  function _onKeyUp(e) {
    if (!e) return;
    var key = (e.key || '').toLowerCase();
    if (key === 'r') { _rKeyDown = false; }
  }

  function _onClick() {
    if (_active) { _fireRubberBullet(); }
  }

  // ── Activate / Deactivate ─────────────────────────────────
  function _activateRiotResponse() {
    if (_active) return;
    _active      = true;
    _morale      = MORALE_START;
    _waveTimer   = 0;
    _waveNumber  = 0;
    _missionEnd  = false;
    _rubberAmmo  = RUBBER_AMMO_MAX;
    _shieldHP    = SHIELD_HP_MAX;

    _createHUD();
    _spawnRioters(RIOTER_COUNT_START);
    _showToast('RIOT RESPONSE ACTIVATED — Q:Shield G:TearGas T:Taser B:Barricade');
  }

  function _deactivate() {
    _active = false;
    _unequipShield();
    _removeHUD();

    // Remove all scene objects
    var i;
    for (i = 0; i < _rioters.length; i++) {
      if (!_rioters[i].dead) _scene.remove(_rioters[i].mesh);
    }
    _rioters = [];
    _clusters = [];

    for (i = 0; i < _projectiles.length; i++) {
      _scene.remove(_projectiles[i].mesh);
    }
    _projectiles = [];

    for (i = 0; i < _rocks.length; i++) {
      _scene.remove(_rocks[i].mesh);
    }
    _rocks = [];

    for (i = 0; i < _gasCanisters.length; i++) {
      _scene.remove(_gasCanisters[i].mesh);
    }
    _gasCanisters = [];

    if (_gasCloud) {
      _scene.remove(_gasCloud.mesh);
      _gasCloud = null;
    }

    for (i = 0; i < _barricades.length; i++) {
      _scene.remove(_barricades[i].mesh);
    }
    _barricades = [];

    if (_taserLines) {
      _scene.remove(_taserLines);
      _taserLines = null;
    }
  }

  // ── Update: rioter AI ─────────────────────────────────────
  function _updateRioters(delta) {
    var cam = _camera;
    if (!cam) return;

    var camPos = new THREE.Vector3();
    cam.getWorldPosition(camPos);

    // Update clusters toward player
    var ci;
    for (ci = 0; ci < _clusters.length; ci++) {
      var cluster = _clusters[ci];
      var alive = cluster.members.filter(function (r) { return !r.dead; });
      if (alive.length === 0) continue;

      var dx = camPos.x - cluster.cx;
      var dz = camPos.z - cluster.cz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 2) {
        cluster.cx += (dx / dist) * CLUSTER_SPEED * delta;
        cluster.cz += (dz / dist) * CLUSTER_SPEED * delta;
      }
    }

    for (var i = 0; i < _rioters.length; i++) {
      var r = _rioters[i];
      if (r.dead) continue;

      // Stun handling
      if (r.stunTimer > 0) {
        r.stunTimer -= delta;
        // Wobble while stunned
        r.wobble = (r.wobble || 0) + delta * 8;
        r.mesh.rotation.y = Math.sin(r.wobble) * 0.3;
        if (r.stunTimer <= 0) {
          r.stunTimer = 0;
          r.mesh.rotation.y = 0;
          _resetRioterColor(r);
        }
        // Still do throw timer while stunned
        r.throwTimer -= delta;
        if (r.throwTimer <= 0) {
          r.throwTimer = RIOTER_THROW_MIN + Math.random() * (RIOTER_THROW_MAX - RIOTER_THROW_MIN);
        }
        continue;
      }

      // Flee handling (tear gas)
      if (r.fleeTimer > 0) {
        r.fleeTimer -= delta;
        var fdx = r.mesh.position.x - camPos.x;
        var fdz = r.mesh.position.z - camPos.z;
        var fd = Math.sqrt(fdx * fdx + fdz * fdz) || 1;
        r.mesh.position.x += (fdx / fd) * CLUSTER_SPEED * 2 * delta;
        r.mesh.position.z += (fdz / fd) * CLUSTER_SPEED * 2 * delta;
        continue;
      }

      // Orbit cluster center
      var cid = r.clusterId;
      if (cid >= 0 && cid < _clusters.length) {
        var cl = _clusters[cid];
        r.orbitAngle += ORBIT_SPEED * delta;
        r.mesh.position.x = cl.cx + Math.cos(r.orbitAngle) * ORBIT_RADIUS;
        r.mesh.position.z = cl.cz + Math.sin(r.orbitAngle) * ORBIT_RADIUS;
        r.mesh.position.y = 0;
      }

      // Face toward player
      var toPlayerX = camPos.x - r.mesh.position.x;
      var toPlayerZ = camPos.z - r.mesh.position.z;
      r.mesh.rotation.y = Math.atan2(toPlayerX, toPlayerZ);

      // Throw rocks at player
      r.throwTimer -= delta;
      if (r.throwTimer <= 0) {
        r.throwTimer = RIOTER_THROW_MIN + Math.random() * (RIOTER_THROW_MAX - RIOTER_THROW_MIN);
        _rioterThrow(r);
      }

      // Check barricade collisions
      _checkRioterBarricades(r);
    }
  }

  // ── Update: projectiles ───────────────────────────────────
  function _updateProjectiles(delta) {
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var proj = _projectiles[i];
      proj.life -= delta;
      if (proj.life <= 0) {
        _scene.remove(proj.mesh);
        _projectiles.splice(i, 1);
        continue;
      }

      proj.mesh.position.x += proj.vel.x * delta;
      proj.mesh.position.y += proj.vel.y * delta;
      proj.mesh.position.z += proj.vel.z * delta;

      _bounceProjectile(proj);
      _checkBulletHitBarricade(proj);

      if (_checkBulletHitRioter(proj)) {
        _scene.remove(proj.mesh);
        _projectiles.splice(i, 1);
      }
    }
  }

  // ── Update: rocks ─────────────────────────────────────────
  function _updateRocks(delta) {
    for (var i = _rocks.length - 1; i >= 0; i--) {
      var rock = _rocks[i];
      rock.life -= delta;
      rock.vel.y += -9.8 * delta; // gravity
      rock.mesh.position.x += rock.vel.x * delta;
      rock.mesh.position.y += rock.vel.y * delta;
      rock.mesh.position.z += rock.vel.z * delta;

      if (rock.life <= 0 || rock.mesh.position.y < -1) {
        _scene.remove(rock.mesh);
        _rocks.splice(i, 1);
        continue;
      }

      if (_checkRockHitPlayer(rock)) {
        _scene.remove(rock.mesh);
        _rocks.splice(i, 1);
      }
    }
  }

  // ── Update: gas canisters ─────────────────────────────────
  function _updateGasCanisters(delta) {
    for (var i = _gasCanisters.length - 1; i >= 0; i--) {
      var c = _gasCanisters[i];
      c.life   -= delta;
      c.velY   += TEARGAS_GRAVITY * delta;
      c.mesh.position.x += c.velX * delta;
      c.mesh.position.y += c.velY * delta;
      c.mesh.position.z += c.velZ * delta;

      if (c.mesh.position.y <= 0.2 || c.life <= 0) {
        // Land — spawn gas cloud
        _spawnGasCloud(c.mesh.position);
        _scene.remove(c.mesh);
        _gasCanisters.splice(i, 1);
        _affectRiotersWithGas(c.mesh.position.x, c.mesh.position.z);
      }
    }
  }

  function _affectRiotersWithGas(gx, gz) {
    for (var i = 0; i < _rioters.length; i++) {
      var r = _rioters[i];
      if (r.dead) continue;
      var dx = r.mesh.position.x - gx;
      var dz = r.mesh.position.z - gz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < TEARGAS_CLOUD_MAX_R) {
        r.fleeTimer = TEARGAS_FLEE_TIME;
      }
    }
  }

  // ── Update: gas cloud ─────────────────────────────────────
  function _updateGasCloud(delta) {
    if (!_gasCloud) return;
    _gasCloud.timer += delta;
    var t = Math.min(_gasCloud.timer / TEARGAS_CLOUD_GROW, 1);
    _gasCloud.radius = t * TEARGAS_CLOUD_MAX_R;
    var s = _gasCloud.radius;
    _gasCloud.mesh.scale.set(s, s, s);

    if (_gasCloud.timer > TEARGAS_CLOUD_GROW + 5) {
      _scene.remove(_gasCloud.mesh);
      _gasCloud = null;
    }
  }

  // ── Update: taser ─────────────────────────────────────────
  function _updateTaser(delta) {
    if (!_taserActive) return;
    _taserTimer -= delta;
    if (_taserTimer <= 0) {
      _taserActive = false;
      if (_taserLines) {
        _scene.remove(_taserLines);
        _taserLines = null;
      }
    }
  }

  // ── Update: escalation waves ──────────────────────────────
  function _updateWaves(delta) {
    _waveTimer += delta;
    if (_waveTimer >= WAVE_INTERVAL) {
      _waveTimer = 0;
      _waveNumber++;
      _morale = MORALE_START;

      var aliveCount = _rioters.filter(function (r) { return !r.dead; }).length;
      var toSpawn    = Math.min(RIOTER_WAVE_ADD, RIOTER_COUNT_MAX - aliveCount);
      if (toSpawn > 0) {
        _spawnRioters(toSpawn);
        _showToast('WAVE ' + (_waveNumber + 1) + ' — Reinforcements! +' + toSpawn + ' rioters');
      }
    }
  }

  // ── Update: R+R pending timer ─────────────────────────────
  function _updateRRPending(delta) {
    if (_rrPending) {
      _rrPendingTimer -= delta;
      if (_rrPendingTimer <= 0) {
        _rrPending = false;
      }
    }
  }

  // ── Public API ────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('click',   _onClick);
  }

  function update(delta) {
    _updateRRPending(delta);

    if (!_active) return;
    if (_missionEnd) return;

    _updateRioters(delta);
    _updateProjectiles(delta);
    _updateRocks(delta);
    _updateGasCanisters(delta);
    _updateGasCloud(delta);
    _updateTaser(delta);
    _updateWaves(delta);
    _updateHUD();
  }

  function reset() {
    _deactivate();
    _rKeyDown       = false;
    _rrPending      = false;
    _rrPendingTimer = 0;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
