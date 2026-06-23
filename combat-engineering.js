/* ───────────────────────────────────────────────────────────────────────────
   COMBAT ENGINEERING — bridge building, demolition, fighting positions
   Press C or E to open the engineering menu (BUILD / DEMOLISH / REPAIR tabs).
   ─────────────────────────────────────────────────────────────────────────── */

window.CombatEngineering = (function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     CONSTANTS
  ══════════════════════════════════════════════════════════════════════════ */

  var STRUCTURE_DEFS = {
    FOXHOLE: {
      id: 'FOXHOLE',
      label: 'Foxhole',
      cost: 2,
      color: 0x5C3A1E,
      desc: 'Digs in — lowers player Y when inside'
    },
    SANDBAG_WALL: {
      id: 'SANDBAG_WALL',
      label: 'Sandbag Wall',
      cost: 1,
      color: 0xC2B280,
      desc: '6-stack sandbag wall, 4m long'
    },
    WIRE_OBSTACLE: {
      id: 'WIRE_OBSTACLE',
      label: 'Wire Obstacle',
      cost: 1,
      color: 0x555555,
      desc: 'Zigzag wire — impassable'
    },
    BRIDGE_SECTION: {
      id: 'BRIDGE_SECTION',
      label: 'Bridge Section',
      cost: 3,
      color: 0x8B5A2B,
      desc: 'Wooden plank bridge (3 needed to span gap)'
    }
  };

  var STRUCT_KEYS = ['FOXHOLE', 'SANDBAG_WALL', 'WIRE_OBSTACLE', 'BRIDGE_SECTION'];

  var MAX_STRUCTURES   = 20;
  var BRIDGE_GAP_Z_MIN = -15;
  var BRIDGE_GAP_Z_MAX = -10;
  var REPAIR_DURATION  = 3.0;
  var RUBBLE_LIFE      = 2.0;
  var FUSE_DURATION    = 5.0;
  var DEMCHARGE_RADIUS = 12;
  var SUPPLY_MAT_BONUS = 5;
  var COLLECT_DIST     = 2.5;

  /* ══════════════════════════════════════════════════════════════════════════
     PRIVATE STATE
  ══════════════════════════════════════════════════════════════════════════ */

  var _scene    = null;
  var _camera   = null;
  var _player   = null;  // { position: THREE.Vector3, ... }

  /* materials / resources */
  var _materials    = 10;

  /* structures */
  var _structures   = [];   // { id, typeId, mesh, damaged, hp, maxHp }
  var _idCounter    = 0;

  /* ghost */
  var _ghost        = null;
  var _ghostMats    = [];
  var _ghostValid   = false;
  var _ghostTypeId  = 'FOXHOLE';

  /* raycaster */
  var _raycaster    = null;
  var _mouse        = null;
  var _groundPlane  = null;

  /* rubble particles */
  var _rubbles      = [];  // { meshes:[], vel:[], age, life }

  /* demolition charges */
  var _demCharges   = [];  // { mesh, fuse, pos }

  /* repair */
  var _repairing    = null;
  var _repairTimer  = 0;
  var _repairBarEl  = null;

  /* supply crates */
  var _supplyCrates = [];  // { mesh, light, collected }

  /* progress tracking */
  var _bridgeSections  = 0;  // how many BRIDGE_SECTIONs placed in the gap
  var _sandbagWalls    = 0;
  var _obstaclesCleared = false;

  /* UI */
  var _menuOpen    = false;
  var _activeTab   = 'BUILD';  /* BUILD | DEMOLISH | REPAIR */
  var _menuEl      = null;
  var _hudEl       = null;

  /* event handlers (stored for unbind) */
  var _onKeyDown   = null;
  var _onClick     = null;
  var _onMouseMove = null;

  /* ══════════════════════════════════════════════════════════════════════════
     AUDIO — 3-tone construction sound
  ══════════════════════════════════════════════════════════════════════════ */

  function _playConstructionSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var freqs = [220, 330, 440];
      var i;
      for (i = 0; i < freqs.length; i++) {
        (function (freq, delay) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'square';
          gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.2);
        }(freqs[i], i * 0.12));
      }
    } catch (e) { /* audio not available */ }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MESH FACTORY
  ══════════════════════════════════════════════════════════════════════════ */

  function _makeMat(color, opacity, transparent) {
    return new THREE.MeshLambertMaterial({
      color:       color,
      opacity:     opacity !== undefined ? opacity : 1.0,
      transparent: transparent !== undefined ? transparent : false
    });
  }

  function _makeBox(w, h, d, mat) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  function _buildFoxhole(opacity, transparent) {
    var group = new THREE.Group();
    var mat   = _makeMat(0x5C3A1E, opacity, transparent);
    if (transparent) { _ghostMats.push(mat); }
    /* main pit rim */
    var rim = _makeBox(3, 0.4, 3, mat);
    rim.position.y = -0.3;
    group.add(rim);
    /* inner darker pit */
    var matDark = _makeMat(0x2E1A0A, opacity, transparent);
    if (transparent) { _ghostMats.push(matDark); }
    var pit = _makeBox(2.4, 0.6, 2.4, matDark);
    pit.position.y = -0.5;
    group.add(pit);
    return group;
  }

  function _buildSandbagWall(opacity, transparent) {
    var group = new THREE.Group();
    var mat   = _makeMat(0xC2B280, opacity, transparent);
    if (transparent) { _ghostMats.push(mat); }
    var i, bag;
    for (i = 0; i < 6; i++) {
      bag = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.55, 8),
        mat
      );
      bag.position.set(-2.5 + i * 0.85, 0.28, 0);
      group.add(bag);
    }
    /* second row */
    var mat2 = _makeMat(0xB5A070, opacity, transparent);
    if (transparent) { _ghostMats.push(mat2); }
    for (i = 0; i < 5; i++) {
      bag = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.55, 8),
        mat2
      );
      bag.position.set(-2.1 + i * 0.85, 0.84, 0);
      group.add(bag);
    }
    return group;
  }

  function _buildWireObstacle(opacity, transparent) {
    var group = new THREE.Group();
    /* posts */
    var postMat = _makeMat(0x444444, opacity, transparent);
    if (transparent) { _ghostMats.push(postMat); }
    var i, post;
    for (i = 0; i <= 3; i++) {
      post = _makeBox(0.08, 1.2, 0.08, postMat);
      post.position.set(-2 + i * 1.33, 0.6, 0);
      group.add(post);
    }
    /* zigzag wire as LineSegments */
    var points = [];
    var seg, x;
    for (seg = 0; seg <= 12; seg++) {
      x = -2.5 + seg * 0.42;
      points.push(x, (seg % 2 === 0) ? 0.2 : 1.0, 0);
    }
    var wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3)
    );
    var wireMat = new THREE.LineBasicMaterial({ color: 0x999999 });
    var wire = new THREE.LineSegments(wireGeo, wireMat);
    group.add(wire);
    return group;
  }

  function _buildBridgeSection(opacity, transparent) {
    var group = new THREE.Group();
    var mat   = _makeMat(0x8B5A2B, opacity, transparent);
    if (transparent) { _ghostMats.push(mat); }
    /* main plank */
    var plank = _makeBox(6, 0.3, 2, mat);
    plank.position.y = 0.15;
    group.add(plank);
    /* support beams */
    var beamMat = _makeMat(0x6B4020, opacity, transparent);
    if (transparent) { _ghostMats.push(beamMat); }
    var beam1 = _makeBox(6, 0.15, 0.2, beamMat);
    beam1.position.set(0, 0.0, 0.9);
    group.add(beam1);
    var beam2 = _makeBox(6, 0.15, 0.2, beamMat);
    beam2.position.set(0, 0.0, -0.9);
    group.add(beam2);
    return group;
  }

  function _buildStructureMesh(typeId, opacity, transparent) {
    _ghostMats = [];
    if (typeId === 'FOXHOLE')      { return _buildFoxhole(opacity, transparent); }
    if (typeId === 'SANDBAG_WALL') { return _buildSandbagWall(opacity, transparent); }
    if (typeId === 'WIRE_OBSTACLE'){ return _buildWireObstacle(opacity, transparent); }
    if (typeId === 'BRIDGE_SECTION'){ return _buildBridgeSection(opacity, transparent); }
    /* fallback */
    var mat = _makeMat(0xFFFFFF, opacity, transparent);
    if (transparent) { _ghostMats.push(mat); }
    return _makeBox(1, 1, 1, mat);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     GHOST PREVIEW
  ══════════════════════════════════════════════════════════════════════════ */

  function _createGhost(typeId) {
    _destroyGhost();
    _ghostTypeId = typeId || _ghostTypeId;
    _ghostMats   = [];
    _ghost = _buildStructureMesh(_ghostTypeId, 0.4, true);
    /* force ghost colour to teal */
    var j;
    for (j = 0; j < _ghostMats.length; j++) {
      _ghostMats[j].color.setHex(0x00FF88);
    }
    _scene.add(_ghost);
  }

  function _destroyGhost() {
    if (!_ghost) { return; }
    _scene.remove(_ghost);
    _ghost.traverse(function (obj) {
      if (obj.geometry) { obj.geometry.dispose(); }
      if (obj.material) {
        var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        var k;
        for (k = 0; k < mats.length; k++) { mats[k].dispose(); }
      }
    });
    _ghost     = null;
    _ghostMats = [];
  }

  function _setGhostColor(valid) {
    _ghostValid = valid;
    var color = valid ? 0x00FF88 : 0xFF2222;
    var j;
    for (j = 0; j < _ghostMats.length; j++) {
      if (_ghostMats[j].color) { _ghostMats[j].color.setHex(color); }
    }
  }

  function _updateGhostPosition() {
    if (!_ghost || !_camera) { return; }
    _raycaster.setFromCamera(_mouse, _camera);
    var target = new THREE.Vector3();
    var hit    = _raycaster.ray.intersectPlane(_groundPlane, target);
    if (!hit) {
      _ghost.visible = false;
      return;
    }
    _ghost.visible = true;
    target.x = Math.round(target.x * 2) / 2;
    target.z = Math.round(target.z * 2) / 2;
    target.y = 0;
    _ghost.position.copy(target);
    _setGhostColor(_isValidPlacement(target, _ghostTypeId));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLACEMENT VALIDATION
  ══════════════════════════════════════════════════════════════════════════ */

  function _isValidPlacement(pos, typeId) {
    if (_structures.length >= MAX_STRUCTURES) { return false; }
    var def = STRUCTURE_DEFS[typeId];
    if (!def) { return false; }
    if (_materials < def.cost) { return false; }
    /* bridge sections must be near the gap */
    if (typeId === 'BRIDGE_SECTION') {
      if (pos.z < BRIDGE_GAP_Z_MAX - 2 || pos.z > BRIDGE_GAP_Z_MIN + 2) {
        /* allow placement anywhere but it only counts toward bridge if in gap zone */
      }
    }
    return true;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLACE STRUCTURE
  ══════════════════════════════════════════════════════════════════════════ */

  function _placeStructure() {
    if (!_ghost || !_ghostValid) { return; }
    var typeId = _ghostTypeId;
    var def    = STRUCTURE_DEFS[typeId];
    if (!def || _materials < def.cost) { return; }

    _materials -= def.cost;
    var mesh = _buildStructureMesh(typeId, 1.0, false);
    mesh.position.copy(_ghost.position);
    _scene.add(mesh);

    var sid = 'ce_' + (++_idCounter);
    var struct = {
      id:      sid,
      typeId:  typeId,
      mesh:    mesh,
      hp:      100,
      maxHp:   100,
      damaged: false
    };
    _structures.push(struct);

    /* track bridge sections in gap zone */
    if (typeId === 'BRIDGE_SECTION') {
      var pz = mesh.position.z;
      if (pz >= BRIDGE_GAP_Z_MIN && pz <= BRIDGE_GAP_Z_MAX) {
        _bridgeSections = Math.min(_bridgeSections + 1, 3);
      }
    }
    if (typeId === 'SANDBAG_WALL') {
      _sandbagWalls = Math.min(_sandbagWalls + 1, 2);
    }

    _playConstructionSound();
    _updateHUD();
    _updateEngineerPanel();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DEMOLISH — highlight + destroy / charge
  ══════════════════════════════════════════════════════════════════════════ */

  function _getNearestStructure(fromPos, maxDist) {
    var nearest = null;
    var nearestDist = maxDist;
    var i, s, dx, dz, dist;
    for (i = 0; i < _structures.length; i++) {
      s = _structures[i];
      dx = s.mesh.position.x - fromPos.x;
      dz = s.mesh.position.z - fromPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest     = s;
      }
    }
    return nearest;
  }

  function _highlightForDemolish() {
    /* paint nearby structures red, others normal */
    var playerPos = _player ? _player.position : (_camera ? _camera.position : null);
    if (!playerPos) { return; }
    var i, s, dx, dz, dist;
    for (i = 0; i < _structures.length; i++) {
      s = _structures[i];
      dx = s.mesh.position.x - playerPos.x;
      dz = s.mesh.position.z - playerPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      s.mesh.traverse(function (obj) {
        if (obj.isMesh && obj.material && obj.material.color) {
          obj.material.color.setHex(dist < 3 ? 0xFF3333 : (STRUCTURE_DEFS[s.typeId] ? STRUCTURE_DEFS[s.typeId].color : 0xAAAAAA));
        }
      });
    }
  }

  function _removeStructure(struct) {
    _scene.remove(struct.mesh);
    struct.mesh.traverse(function (obj) {
      if (obj.geometry) { obj.geometry.dispose(); }
      if (obj.material) {
        var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        var k;
        for (k = 0; k < mats.length; k++) { mats[k].dispose(); }
      }
    });
    var idx = _structures.indexOf(struct);
    if (idx !== -1) { _structures.splice(idx, 1); }

    /* recalculate tracked counts */
    _recalcProgress();
    _updateEngineerPanel();
    _updateHUD();
  }

  function _recalcProgress() {
    _bridgeSections = 0;
    _sandbagWalls   = 0;
    var i, s, pz;
    for (i = 0; i < _structures.length; i++) {
      s = _structures[i];
      if (s.typeId === 'BRIDGE_SECTION') {
        pz = s.mesh.position.z;
        if (pz >= BRIDGE_GAP_Z_MIN && pz <= BRIDGE_GAP_Z_MAX) {
          _bridgeSections++;
        }
      }
      if (s.typeId === 'SANDBAG_WALL') {
        _sandbagWalls++;
      }
    }
  }

  function _spawnRubble(pos) {
    var rubble = { meshes: [], vel: [], age: 0, life: RUBBLE_LIFE };
    var i, geo, mat, m, vx, vy, vz;
    for (i = 0; i < 4; i++) {
      geo = new THREE.BoxGeometry(
        0.3 + Math.random() * 0.4,
        0.3 + Math.random() * 0.4,
        0.3 + Math.random() * 0.4
      );
      mat = new THREE.MeshLambertMaterial({ color: 0x7A6040 });
      m   = new THREE.Mesh(geo, mat);
      m.position.set(
        pos.x + (Math.random() - 0.5) * 2,
        pos.y + 0.5,
        pos.z + (Math.random() - 0.5) * 2
      );
      vx = (Math.random() - 0.5) * 6;
      vy = 3 + Math.random() * 4;
      vz = (Math.random() - 0.5) * 6;
      _scene.add(m);
      rubble.meshes.push(m);
      rubble.vel.push({ x: vx, y: vy, z: vz });
    }
    _rubbles.push(rubble);
  }

  function _tryDemolishNearest() {
    var playerPos = _player ? _player.position : (_camera ? _camera.position : null);
    if (!playerPos) { return; }
    var nearest = _getNearestStructure(playerPos, 3);
    if (!nearest) { return; }
    _spawnRubble(nearest.mesh.position);
    _removeStructure(nearest);
  }

  function _placeDemolitionCharge() {
    var playerPos = _player ? _player.position : (_camera ? _camera.position : null);
    if (!playerPos) { return; }
    var geo = new THREE.BoxGeometry(0.4, 0.3, 0.2);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
    var m   = new THREE.Mesh(geo, mat);
    m.position.set(playerPos.x, playerPos.y + 0.15, playerPos.z - 0.5);
    _scene.add(m);
    _demCharges.push({ mesh: m, fuse: FUSE_DURATION, pos: m.position.clone() });
  }

  function _triggerExplosion(pos) {
    /* massive sphere flash */
    var geo = new THREE.SphereGeometry(DEMCHARGE_RADIUS, 12, 12);
    var mat = new THREE.MeshBasicMaterial({
      color:       0xFF6600,
      transparent: true,
      opacity:     0.7
    });
    var sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(pos);
    _scene.add(sphere);

    /* fade out sphere over 0.5s using setTimeout chain */
    var step = 0;
    var steps = 10;
    var interval = setInterval(function () {
      step++;
      if (sphere.material) {
        sphere.material.opacity = 0.7 * (1 - step / steps);
      }
      if (step >= steps) {
        clearInterval(interval);
        _scene.remove(sphere);
        if (sphere.geometry) { sphere.geometry.dispose(); }
        if (sphere.material) { sphere.material.dispose(); }
      }
    }, 50);

    /* destroy structures within blast */
    var i, s, dx, dz, dist;
    for (i = _structures.length - 1; i >= 0; i--) {
      s  = _structures[i];
      dx = s.mesh.position.x - pos.x;
      dz = s.mesh.position.z - pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= DEMCHARGE_RADIUS) {
        _spawnRubble(s.mesh.position);
        _removeStructure(s);
      }
    }

    /* remove supply crates in blast */
    for (i = _supplyCrates.length - 1; i >= 0; i--) {
      var sc = _supplyCrates[i];
      dx = sc.mesh.position.x - pos.x;
      dz = sc.mesh.position.z - pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= DEMCHARGE_RADIUS) {
        _removeSupplyCrate(sc, i);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     REPAIR
  ══════════════════════════════════════════════════════════════════════════ */

  function _tryRepairNearest() {
    if (_repairing) { return; }
    if (_materials < 1) { return; }
    var playerPos = _player ? _player.position : (_camera ? _camera.position : null);
    if (!playerPos) { return; }
    var nearest = _getNearestStructure(playerPos, 3);
    if (!nearest || !nearest.damaged) { return; }
    _materials -= 1;
    _repairing   = nearest;
    _repairTimer = 0;
    _showRepairBar();
    _updateHUD();
  }

  function _showRepairBar() {
    if (!_repairBarEl) {
      _repairBarEl = document.createElement('div');
      _repairBarEl.id = 'ceRepairBar';
      _repairBarEl.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'width:200px',
        'height:14px',
        'background:#222',
        'border:1px solid #0F0',
        'display:none',
        'z-index:10002'
      ].join(';');
      var inner = document.createElement('div');
      inner.id  = 'ceRepairBarInner';
      inner.style.cssText = 'height:100%;width:0%;background:#00FF44;transition:width 0.1s;';
      _repairBarEl.appendChild(inner);
      document.body.appendChild(_repairBarEl);
    }
    _repairBarEl.style.display = 'block';
  }

  function _hideRepairBar() {
    if (_repairBarEl) { _repairBarEl.style.display = 'none'; }
  }

  function _updateRepairBar(pct) {
    var inner = document.getElementById('ceRepairBarInner');
    if (inner) { inner.style.width = (pct * 100) + '%'; }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SUPPLY CRATES
  ══════════════════════════════════════════════════════════════════════════ */

  function _spawnSupplyCrates() {
    var positions = [
      { x: Math.random() * 20 - 10, z: Math.random() * 20 - 10 },
      { x: Math.random() * 20 - 10, z: Math.random() * 20 - 10 }
    ];
    var i, pos, geo, mat, m, light;
    for (i = 0; i < positions.length; i++) {
      pos  = positions[i];
      geo  = new THREE.BoxGeometry(1.5, 1, 1);
      mat  = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
      m    = new THREE.Mesh(geo, mat);
      m.position.set(pos.x, 0.5, pos.z);
      _scene.add(m);

      light = new THREE.PointLight(0xFFCC00, 1.2, 6);
      light.position.set(pos.x, 1.5, pos.z);
      _scene.add(light);

      _supplyCrates.push({ mesh: m, light: light, collected: false });
    }
  }

  function _removeSupplyCrate(sc, idx) {
    if (sc.mesh && _scene) {
      _scene.remove(sc.mesh);
      if (sc.mesh.geometry) { sc.mesh.geometry.dispose(); }
      if (sc.mesh.material) { sc.mesh.material.dispose(); }
    }
    if (sc.light && _scene) { _scene.remove(sc.light); }
    sc.collected = true;
    if (idx !== undefined) {
      _supplyCrates.splice(idx, 1);
    }
  }

  function _checkSupplyCratePickup(playerPos) {
    if (!playerPos) { return; }
    var i, sc, dx, dz, dist;
    for (i = _supplyCrates.length - 1; i >= 0; i--) {
      sc = _supplyCrates[i];
      if (sc.collected) { _supplyCrates.splice(i, 1); continue; }
      dx   = playerPos.x - sc.mesh.position.x;
      dz   = playerPos.z - sc.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < COLLECT_DIST) {
        _materials += SUPPLY_MAT_BONUS;
        _removeSupplyCrate(sc, i);
        _updateHUD();
        _showPickupNotice('+' + SUPPLY_MAT_BONUS + ' MATERIALS');
      }
    }
  }

  function _showPickupNotice(txt) {
    var el = document.createElement('div');
    el.textContent = txt;
    el.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:10005',
      'text-shadow:0 0 6px #000'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 1800);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLAYER FOXHOLE EFFECT
  ══════════════════════════════════════════════════════════════════════════ */

  function _checkFoxholeEffect() {
    if (!_player || !_player.position) { return; }
    var pp   = _player.position;
    var inside = false;
    var i, s, dx, dz, dist;
    for (i = 0; i < _structures.length; i++) {
      s = _structures[i];
      if (s.typeId !== 'FOXHOLE') { continue; }
      dx   = pp.x - s.mesh.position.x;
      dz   = pp.z - s.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.5) { inside = true; break; }
    }
    if (inside && pp.y > -0.8) {
      _player.position.y = -1;
    } else if (!inside && pp.y < -0.5) {
      _player.position.y = 0;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UI — ENGINEERING MENU
  ══════════════════════════════════════════════════════════════════════════ */

  function _createMenuDOM() {
    if (_menuEl) { return; }
    _menuEl = document.createElement('div');
    _menuEl.id = 'ceMenu';
    _menuEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(8,18,8,0.94)',
      'color:#DDD',
      'padding:16px 20px',
      'font-family:monospace',
      'font-size:12px',
      'border:1px solid #2A7A2A',
      'border-radius:4px',
      'display:none',
      'min-width:320px',
      'z-index:10001'
    ].join(';');
    document.body.appendChild(_menuEl);
  }

  function _openMenu() {
    _menuOpen = true;
    if (!_menuEl) { _createMenuDOM(); }
    _renderMenu();
    _menuEl.style.display = 'block';
    if (_activeTab === 'BUILD') {
      _createGhost(_ghostTypeId);
    } else {
      _destroyGhost();
    }
    _updateHUD();
  }

  function _closeMenu() {
    _menuOpen = false;
    if (_menuEl) { _menuEl.style.display = 'none'; }
    _destroyGhost();
    _resetDemolishHighlight();
    _updateHUD();
  }

  function _toggleMenu() {
    if (_menuOpen) { _closeMenu(); } else { _openMenu(); }
  }

  function _resetDemolishHighlight() {
    var i, s, def;
    for (i = 0; i < _structures.length; i++) {
      s   = _structures[i];
      def = STRUCTURE_DEFS[s.typeId];
      if (!def) { continue; }
      s.mesh.traverse(function (obj) {
        if (obj.isMesh && obj.material && obj.material.color) {
          obj.material.color.setHex(def.color);
        }
      });
    }
  }

  function _renderMenu() {
    if (!_menuEl) { return; }
    _menuEl.innerHTML = '';

    /* title */
    var title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-weight:bold;font-size:14px;margin-bottom:10px;';
    title.textContent = '=== COMBAT ENGINEERING ===';
    _menuEl.appendChild(title);

    /* tabs */
    var tabs     = ['BUILD', 'DEMOLISH', 'REPAIR'];
    var tabRow   = document.createElement('div');
    tabRow.style.cssText = 'display:flex;gap:6px;margin-bottom:12px;';
    var t, i;
    for (i = 0; i < tabs.length; i++) {
      (function (tab) {
        t = document.createElement('button');
        t.textContent = tab;
        t.style.cssText = [
          'flex:1',
          'padding:5px 0',
          'background:' + (tab === _activeTab ? '#1A5A1A' : '#1A2A1A'),
          'color:' + (tab === _activeTab ? '#FFD700' : '#AAA'),
          'border:1px solid #3A6A3A',
          'cursor:pointer',
          'font-family:monospace',
          'font-size:12px'
        ].join(';');
        t.addEventListener('click', function () {
          _activeTab = tab;
          if (tab === 'BUILD') {
            _createGhost(_ghostTypeId);
            _resetDemolishHighlight();
          } else {
            _destroyGhost();
            if (tab === 'DEMOLISH') { _highlightForDemolish(); }
            else { _resetDemolishHighlight(); }
          }
          _renderMenu();
        });
        tabRow.appendChild(t);
      }(tabs[i]));
    }
    _menuEl.appendChild(tabRow);

    /* tab content */
    var content = document.createElement('div');
    if (_activeTab === 'BUILD')     { _renderBuildTab(content); }
    if (_activeTab === 'DEMOLISH')  { _renderDemolishTab(content); }
    if (_activeTab === 'REPAIR')    { _renderRepairTab(content); }
    _menuEl.appendChild(content);

    /* engineering task list */
    _menuEl.appendChild(_renderTaskList());

    /* close button */
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '[ESC] Close';
    closeBtn.style.cssText = [
      'display:block',
      'width:100%',
      'margin-top:10px',
      'padding:5px',
      'background:#2A2A2A',
      'color:#AAA',
      'border:1px solid #555',
      'cursor:pointer',
      'font-family:monospace'
    ].join(';');
    closeBtn.addEventListener('click', _closeMenu);
    _menuEl.appendChild(closeBtn);
  }

  function _renderBuildTab(parent) {
    var k, def, row, costColor, btn;
    for (k = 0; k < STRUCT_KEYS.length; k++) {
      (function (typeId) {
        def = STRUCTURE_DEFS[typeId];
        row = document.createElement('div');
        row.style.cssText = 'margin-bottom:5px;display:flex;align-items:center;gap:6px;';

        var indicator = document.createElement('span');
        indicator.style.cssText = 'color:#FFD700;width:10px;display:inline-block;';
        indicator.textContent = (typeId === _ghostTypeId) ? '>' : ' ';

        var label = document.createElement('span');
        label.style.cssText = 'flex:1;';
        label.textContent = def.label + ' — ' + def.desc;

        costColor = (_materials >= def.cost) ? '#7CF' : '#F88';
        var costEl = document.createElement('span');
        costEl.style.cssText = 'color:' + costColor + ';';
        costEl.textContent = '[' + def.cost + ' mats]';

        btn = document.createElement('button');
        btn.textContent = 'SELECT';
        btn.style.cssText = [
          'padding:2px 8px',
          'background:' + (typeId === _ghostTypeId ? '#1A5A1A' : '#1A2A1A'),
          'color:#EEE',
          'border:1px solid #3A6A3A',
          'cursor:pointer',
          'font-family:monospace',
          'font-size:11px'
        ].join(';');
        btn.addEventListener('click', function () {
          _ghostTypeId = typeId;
          _createGhost(typeId);
          _renderMenu();
        });

        row.appendChild(indicator);
        row.appendChild(label);
        row.appendChild(costEl);
        row.appendChild(btn);
        parent.appendChild(row);
      }(STRUCT_KEYS[k]));
    }

    var hint = document.createElement('div');
    hint.style.cssText = 'margin-top:6px;color:#777;font-size:10px;';
    hint.textContent = 'Aim at ground then LEFT-CLICK to place selected structure.';
    parent.appendChild(hint);
  }

  function _renderDemolishTab(parent) {
    var hint = document.createElement('div');
    hint.style.cssText = 'color:#EEE;margin-bottom:8px;';
    hint.textContent = 'Nearby structures shown in red.';
    parent.appendChild(hint);

    var row1 = document.createElement('div');
    row1.style.cssText = 'margin-bottom:5px;';
    row1.textContent = '[X] — Destroy nearest structure (within 3m)';
    parent.appendChild(row1);

    var row2 = document.createElement('div');
    row2.style.cssText = 'color:#FF6644;';
    row2.textContent = '[Shift+X] — Place demolition charge (5s fuse, r=' + DEMCHARGE_RADIUS + 'm)';
    parent.appendChild(row2);
  }

  function _renderRepairTab(parent) {
    var hint = document.createElement('div');
    hint.style.cssText = 'color:#EEE;margin-bottom:8px;';
    hint.textContent = 'Stand near a damaged structure, then press R.';
    parent.appendChild(hint);

    var row = document.createElement('div');
    row.style.cssText = 'color:#7CF;';
    row.textContent = '[R] — Repair nearest damaged structure (costs 1 mat, 3s)';
    parent.appendChild(row);

    var matRow = document.createElement('div');
    matRow.style.cssText = 'margin-top:6px;color:' + (_materials >= 1 ? '#AFA' : '#F88') + ';';
    matRow.textContent = 'Materials available: ' + _materials;
    parent.appendChild(matRow);
  }

  function _renderTaskList() {
    var container = document.createElement('div');
    container.style.cssText = [
      'margin-top:12px',
      'border-top:1px solid #333',
      'padding-top:8px',
      'font-size:11px',
      'color:#AAA'
    ].join(';');

    var heading = document.createElement('div');
    heading.style.cssText = 'color:#FFD700;margin-bottom:4px;';
    heading.textContent = 'ENGINEERING TASKS:';
    container.appendChild(heading);

    var tasks = [
      {
        label: 'Bridge Gap',
        done:  _bridgeSections,
        total: 3,
        suffix: 'sections'
      },
      {
        label: 'Fortify Position',
        done:  _sandbagWalls,
        total: 2,
        suffix: 'walls'
      },
      {
        label: 'Clear Obstacle',
        done:  _obstaclesCleared ? 1 : 0,
        total: 1,
        suffix: ''
      }
    ];

    var i, t, row, color;
    for (i = 0; i < tasks.length; i++) {
      t     = tasks[i];
      color = (t.done >= t.total) ? '#00FF88' : '#AAA';
      row   = document.createElement('div');
      row.style.cssText = 'color:' + color + ';margin-bottom:2px;';
      if (t.total === 1 && t.suffix === '') {
        row.textContent = (t.done ? '[X] ' : '[ ] ') + t.label + ': ' + (t.done ? 'DONE' : '—');
      } else {
        row.textContent = (t.done >= t.total ? '[X] ' : '[ ] ') + t.label + ': ' + t.done + '/' + t.total + ' ' + t.suffix;
      }
      container.appendChild(row);
    }
    return container;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MATERIAL HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function _createHUD() {
    if (_hudEl) { return; }
    _hudEl = document.createElement('div');
    _hudEl.id = 'ceHUD';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'left:14px',
      'background:rgba(0,0,0,0.8)',
      'color:#EEE',
      'padding:6px 12px',
      'font-family:monospace',
      'font-size:12px',
      'border:1px solid #2A5A2A',
      'border-radius:3px',
      'display:none',
      'pointer-events:none',
      'z-index:9995'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    if (!_menuOpen && _activeTab !== 'BUILD') {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var tab    = _activeTab;
    var placed = _structures.length;
    var bsect  = _bridgeSections;
    _hudEl.textContent = 'ENGR [' + tab + '] [MATS: ' + _materials + '] [PLACED: ' + placed + '/' + MAX_STRUCTURES + '] | BRIDGE: ' + bsect + '/3';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UPDATE ENGINEERING PANEL (while menu open)
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateEngineerPanel() {
    if (_menuOpen && _menuEl && _menuEl.style.display !== 'none') {
      _renderMenu();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     EVENT BINDING
  ══════════════════════════════════════════════════════════════════════════ */

  function _bindEvents() {
    _onKeyDown = function (e) {
      var key = e.key;

      /* C or E opens/closes engineering menu */
      if (key === 'c' || key === 'C' || key === 'e' || key === 'E') {
        _toggleMenu();
        return;
      }

      if (key === 'Escape' && _menuOpen) {
        _closeMenu();
        return;
      }

      /* X — demolish nearest / Shift+X — place charge */
      if ((key === 'x' || key === 'X') && _menuOpen && _activeTab === 'DEMOLISH') {
        if (e.shiftKey) {
          _placeDemolitionCharge();
        } else {
          _tryDemolishNearest();
          _highlightForDemolish();
        }
        return;
      }

      /* R — repair */
      if ((key === 'r' || key === 'R') && _menuOpen && _activeTab === 'REPAIR') {
        _tryRepairNearest();
        return;
      }
    };

    _onClick = function (e) {
      if (!_menuOpen) { return; }
      if (_activeTab !== 'BUILD') { return; }
      if (e.button !== 0) { return; }
      /* prevent clicks on the menu itself from placing */
      if (_menuEl && _menuEl.contains(e.target)) { return; }
      _placeStructure();
    };

    _onMouseMove = function (e) {
      if (!_mouse) { return; }
      _mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
      _mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('click',   _onClick);
    window.addEventListener('mousemove', _onMouseMove);
  }

  function _unbindEvents() {
    if (_onKeyDown)   { window.removeEventListener('keydown',    _onKeyDown); }
    if (_onClick)     { window.removeEventListener('click',      _onClick); }
    if (_onMouseMove) { window.removeEventListener('mousemove',  _onMouseMove); }
    _onKeyDown = _onClick = _onMouseMove = null;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RUBBLE UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateRubble(dt) {
    var i, r, j, mesh, mat, ratio;
    for (i = _rubbles.length - 1; i >= 0; i--) {
      r = _rubbles[i];
      r.age += dt;
      ratio = 1 - (r.age / r.life);

      for (j = 0; j < r.meshes.length; j++) {
        mesh = r.meshes[j];
        r.vel[j].y -= 9.8 * dt;
        mesh.position.x += r.vel[j].x * dt;
        mesh.position.y += r.vel[j].y * dt;
        mesh.position.z += r.vel[j].z * dt;
        if (mesh.position.y < 0) { mesh.position.y = 0; r.vel[j].y = 0; }
        mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (mat && mat.opacity !== undefined) {
          mat.transparent = true;
          mat.opacity     = Math.max(0, ratio);
        }
      }

      if (r.age >= r.life) {
        for (j = 0; j < r.meshes.length; j++) {
          mesh = r.meshes[j];
          _scene.remove(mesh);
          if (mesh.geometry) { mesh.geometry.dispose(); }
          if (mesh.material) {
            var mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            var k;
            for (k = 0; k < mats.length; k++) { mats[k].dispose(); }
          }
        }
        _rubbles.splice(i, 1);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DEMOLITION CHARGE FUSE UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateDemCharges(dt) {
    var i, dc;
    for (i = _demCharges.length - 1; i >= 0; i--) {
      dc = _demCharges[i];
      dc.fuse -= dt;
      /* blink faster as fuse runs out */
      if (dc.mesh && dc.mesh.material) {
        dc.mesh.material.emissive = dc.mesh.material.emissive || new THREE.Color(0);
        dc.mesh.material.emissiveIntensity = (Math.sin(Date.now() * 0.02 * (1 + (FUSE_DURATION - dc.fuse))) > 0) ? 1 : 0;
      }
      if (dc.fuse <= 0) {
        _triggerExplosion(dc.pos);
        _scene.remove(dc.mesh);
        if (dc.mesh.geometry) { dc.mesh.geometry.dispose(); }
        if (dc.mesh.material) { dc.mesh.material.dispose(); }
        _demCharges.splice(i, 1);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     REPAIR UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateRepair(dt) {
    if (!_repairing) { return; }
    _repairTimer += dt;
    _updateRepairBar(_repairTimer / REPAIR_DURATION);
    if (_repairTimer >= REPAIR_DURATION) {
      _repairing.hp      = _repairing.maxHp;
      _repairing.damaged = false;
      /* restore color */
      var def = STRUCTURE_DEFS[_repairing.typeId];
      if (def) {
        _repairing.mesh.traverse(function (obj) {
          if (obj.isMesh && obj.material && obj.material.color) {
            obj.material.color.setHex(def.color);
          }
        });
      }
      _repairing   = null;
      _repairTimer = 0;
      _hideRepairBar();
      _updateEngineerPanel();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SUPPLY CRATE GLOW UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function _updateSupplyCrates(dt, elapsed) {
    var i, sc;
    for (i = 0; i < _supplyCrates.length; i++) {
      sc = _supplyCrates[i];
      if (sc.light) {
        sc.light.intensity = 0.8 + 0.6 * Math.sin(elapsed * 3 + i);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  var _elapsed = 0;

  function init(options) {
    options = options || {};
    _scene  = options.scene  || (window.GameState && window.GameState.scene)  || null;
    _camera = options.camera || (window.GameState && window.GameState.camera) || null;
    _player = options.player || (window.GameState && window.GameState.player) || null;

    if (options.materials !== undefined) { _materials = options.materials; }

    _raycaster   = new THREE.Raycaster();
    _mouse       = new THREE.Vector2(0, 0);
    _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    _elapsed = 0;

    _createHUD();
    _createMenuDOM();

    if (_scene) { _spawnSupplyCrates(); }

    _bindEvents();
    _updateHUD();
  }

  function update(dt) {
    if (!_scene || !_camera) { return; }
    _elapsed += dt;

    /* ghost preview */
    if (_menuOpen && _activeTab === 'BUILD' && _ghost) {
      _updateGhostPosition();
    }

    /* demolish highlight refresh */
    if (_menuOpen && _activeTab === 'DEMOLISH') {
      _highlightForDemolish();
    }

    _updateRubble(dt);
    _updateDemCharges(dt);
    _updateRepair(dt);
    _updateSupplyCrates(dt, _elapsed);

    /* player effects */
    _checkFoxholeEffect();

    /* supply crate pickup */
    var playerPos = _player ? _player.position : null;
    _checkSupplyCratePickup(playerPos);

    _updateHUD();
  }

  function reset() {
    var i, s;

    _closeMenu();
    _destroyGhost();
    _hideRepairBar();

    /* clear structures */
    for (i = _structures.length - 1; i >= 0; i--) {
      s = _structures[i];
      _scene.remove(s.mesh);
      s.mesh.traverse(function (obj) {
        if (obj.geometry) { obj.geometry.dispose(); }
        if (obj.material) {
          var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          var k;
          for (k = 0; k < mats.length; k++) { mats[k].dispose(); }
        }
      });
    }
    _structures = [];

    /* clear rubble */
    for (i = _rubbles.length - 1; i >= 0; i--) {
      var r = _rubbles[i];
      var j;
      for (j = 0; j < r.meshes.length; j++) {
        _scene.remove(r.meshes[j]);
      }
    }
    _rubbles = [];

    /* clear dem charges */
    for (i = _demCharges.length - 1; i >= 0; i--) {
      var dc = _demCharges[i];
      _scene.remove(dc.mesh);
    }
    _demCharges = [];

    /* clear supply crates */
    for (i = _supplyCrates.length - 1; i >= 0; i--) {
      _removeSupplyCrate(_supplyCrates[i]);
    }
    _supplyCrates = [];

    _materials        = 10;
    _bridgeSections   = 0;
    _sandbagWalls     = 0;
    _obstaclesCleared = false;
    _repairing        = null;
    _repairTimer      = 0;
    _idCounter        = 0;
    _elapsed          = 0;
    _activeTab        = 'BUILD';
    _ghostTypeId      = 'FOXHOLE';

    _unbindEvents();
    _updateHUD();
  }

  /* extra helpers for external systems */
  function getStructures()   { return _structures.slice(); }
  function getMaterials()    { return _materials; }
  function addMaterials(n)   { _materials += n; _updateHUD(); }
  function getBridgeProgress(){ return _bridgeSections; }
  function isBridgeComplete(){ return _bridgeSections >= 3; }

  return {
    init:               init,
    update:             update,
    reset:              reset,
    getStructures:      getStructures,
    getMaterials:       getMaterials,
    addMaterials:       addMaterials,
    getBridgeProgress:  getBridgeProgress,
    isBridgeComplete:   isBridgeComplete
  };

}());
