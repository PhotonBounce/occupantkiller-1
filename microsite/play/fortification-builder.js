/* ───────────────────────────────────────────────────────────────────────────
   FORTIFICATION BUILDER — real-time defensive structure placement & upgrade
   Press B to toggle build mode. Cycle structures with 1-6 keys or scroll wheel.
   Left-click places, right-click upgrades placed structures.
   ─────────────────────────────────────────────────────────────────────────── */

window.FortificationBuilder = (function () {
  'use strict';

  /* ── Structure Definitions ─────────────────────────────────────────────── */
  var STRUCTURE_TYPES = [
    {
      id: 'SANDBAG_WALL',
      label: 'Sandbag Wall',
      cost: 10,
      hp: 150,
      color: 0xC2B280,
      w: 3, h: 1, d: 1,
      blocksBullets: true,
      blocksMovement: true,
      slowEnemy: 0,
      desc: 'Blocks movement + bullets'
    },
    {
      id: 'WATCH_TOWER',
      label: 'Watch Tower',
      cost: 25,
      hp: 200,
      color: 0x8B4513,
      w: 2, h: 5, d: 2,
      blocksBullets: false,
      blocksMovement: false,
      climbable: true,
      desc: 'Climbable tower (E), elevation advantage'
    },
    {
      id: 'WIRE_OBSTACLE',
      label: 'Wire Obstacle',
      cost: 5,
      hp: 60,
      color: 0x555555,
      w: 4, h: 0.3, d: 0.3,
      blocksBullets: false,
      blocksMovement: false,
      slowEnemy: 0.7,
      desc: 'Slows enemies 70%, not bulletproof'
    },
    {
      id: 'MG_NEST',
      label: 'MG Nest',
      cost: 30,
      hp: 180,
      color: 0x4A3728,
      w: 2, h: 1, d: 1,
      blocksBullets: true,
      blocksMovement: true,
      autoFire: true,
      autoFireRate: 0.5,
      autoFireDmg: 10,
      autoFireRange: 15,
      desc: 'Auto-fires at nearest enemy every 0.5s (10 dmg, 15 range)'
    },
    {
      id: 'TANK_TRAP',
      label: 'Tank Trap',
      cost: 15,
      hp: 250,
      color: 0x888888,
      w: 2, h: 1.5, d: 2,
      blocksBullets: false,
      blocksMovement: true,
      blocksVehicles: true,
      desc: 'Stops vehicles, blocks infantry'
    },
    {
      id: 'OBS_POST',
      label: 'Observation Post',
      cost: 20,
      hp: 120,
      color: 0x6B8E5A,
      w: 1, h: 3, d: 1,
      blocksBullets: false,
      blocksMovement: false,
      mountable: true,
      detectionBonus: 0.30,
      desc: 'Mount (E), binocular zoom (Z), +30% detection range'
    }
  ];

  /* ── Private State ─────────────────────────────────────────────────────── */
  var _scene          = null;
  var _camera         = null;
  var _enemies        = null;

  var _buildMode      = false;
  var _selectedIndex  = 0;
  var _buildPoints    = 100;
  var _structures     = [];
  var _maxStructures  = 12;

  var _ghost          = null;
  var _ghostMats      = [];
  var _ghostValid     = false;

  var _raycaster      = null;
  var _mouse          = null;
  var _groundPlane    = null;

  var _hudEl          = null;
  var _upgradeMenuEl  = null;
  var _upgradeTarget  = null;

  var _repairing      = null;
  var _repairTimer    = 0;
  var _repairDuration = 2.0;

  var _mgTimers       = {};
  var _idCounter      = 0;

  var _onKeyDown      = null;
  var _onWheel        = null;
  var _onClick        = null;
  var _onContextMenu  = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function _makeMat(color, opacity, transparent) {
    return new THREE.MeshLambertMaterial({
      color: color,
      opacity: opacity !== undefined ? opacity : 1.0,
      transparent: transparent !== undefined ? transparent : false
    });
  }

  function _makeBox(w, h, d, mat) {
    var geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  /* ════════════════════════════════════════════════════════════════════════
     MESH FACTORY — builds a Group for any structure type
  ════════════════════════════════════════════════════════════════════════ */

  function _buildStructureMesh(type, opacity, transparent) {
    var group = new THREE.Group();
    var mat, mesh, mat2, mesh2, i, rung;

    if (type.id === 'SANDBAG_WALL') {
      mat = _makeMat(type.color, opacity, transparent);
      mesh = _makeBox(type.w, type.h, type.d, mat);
      mesh.position.y = type.h / 2;
      group.add(mesh);
      if (transparent) { _ghostMats.push(mat); }

    } else if (type.id === 'WATCH_TOWER') {
      mat = _makeMat(type.color, opacity, transparent);
      mesh = _makeBox(type.w, type.h, type.d, mat);
      mesh.position.y = type.h / 2;
      group.add(mesh);
      if (transparent) { _ghostMats.push(mat); }
      // Ladder rungs
      mat2 = _makeMat(0x5C3317, opacity, transparent);
      if (transparent) { _ghostMats.push(mat2); }
      for (i = 0; i < 5; i++) {
        rung = _makeBox(0.08, 0.06, 0.4, mat2);
        rung.position.set(-type.w / 2 + 0.04, 0.5 + i * 0.85, 0);
        group.add(rung);
      }

    } else if (type.id === 'WIRE_OBSTACLE') {
      mat = _makeMat(type.color, opacity, transparent);
      mesh = _makeBox(type.w, type.h, type.d, mat);
      mesh.position.y = type.h / 2;
      group.add(mesh);
      if (transparent) { _ghostMats.push(mat); }
      // Second wire strand
      mat2 = _makeMat(0x333333, opacity, transparent);
      if (transparent) { _ghostMats.push(mat2); }
      mesh2 = _makeBox(type.w, 0.04, 0.04, mat2);
      mesh2.position.y = type.h + 0.08;
      group.add(mesh2);

    } else if (type.id === 'MG_NEST') {
      mat = _makeMat(type.color, opacity, transparent);
      mesh = _makeBox(type.w, type.h, type.d, mat);
      mesh.position.y = type.h / 2 - 0.2;
      group.add(mesh);
      if (transparent) { _ghostMats.push(mat); }
      // Horizontal MG barrel
      mat2 = _makeMat(0x222222, opacity, transparent);
      if (transparent) { _ghostMats.push(mat2); }
      var barrelGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
      var barrel = new THREE.Mesh(barrelGeo, mat2);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(type.w / 2 + 0.3, type.h / 2, 0);
      group.add(barrel);

    } else if (type.id === 'TANK_TRAP') {
      mat = _makeMat(type.color, opacity, transparent);
      if (transparent) { _ghostMats.push(mat); }
      var boxA = _makeBox(type.w, type.h, 0.4, mat);
      boxA.position.y = type.h / 2;
      group.add(boxA);
      var boxB = _makeBox(0.4, type.h, type.d, mat);
      boxB.position.y = type.h / 2;
      group.add(boxB);
      mat2 = _makeMat(0x777777, opacity, transparent);
      if (transparent) { _ghostMats.push(mat2); }
      var crossA = _makeBox(type.w * 0.9, 0.3, 0.3, mat2);
      crossA.rotation.y = Math.PI / 4;
      crossA.position.y = type.h * 0.6;
      group.add(crossA);
      var crossB = _makeBox(type.w * 0.9, 0.3, 0.3, mat2);
      crossB.rotation.y = -Math.PI / 4;
      crossB.position.y = type.h * 0.6;
      group.add(crossB);

    } else if (type.id === 'OBS_POST') {
      mat = _makeMat(type.color, opacity, transparent);
      mesh = _makeBox(type.w, type.h, type.d, mat);
      mesh.position.y = type.h / 2;
      group.add(mesh);
      if (transparent) { _ghostMats.push(mat); }
      mat2 = _makeMat(0x4A6640, opacity, transparent);
      if (transparent) { _ghostMats.push(mat2); }
      var platform = _makeBox(type.w + 0.4, 0.1, type.d + 0.4, mat2);
      platform.position.y = type.h + 0.05;
      group.add(platform);
    }

    return group;
  }

  /* ════════════════════════════════════════════════════════════════════════
     GHOST PREVIEW
  ════════════════════════════════════════════════════════════════════════ */

  function _createGhost() {
    _destroyGhost();
    _ghostMats = [];
    var type = STRUCTURE_TYPES[_selectedIndex];
    _ghost = _buildStructureMesh(type, 0.4, true);
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
    _ghost = null;
    _ghostMats = [];
  }

  function _setGhostValidity(valid) {
    _ghostValid = valid;
    var color = valid ? 0x00FF44 : 0xFF2222;
    var j;
    for (j = 0; j < _ghostMats.length; j++) {
      _ghostMats[j].color.setHex(color);
      _ghostMats[j].opacity = 0.4;
    }
  }

  function _updateGhostPosition() {
    if (!_ghost || !_camera) { return; }

    _raycaster.setFromCamera(_mouse, _camera);
    var target = new THREE.Vector3();
    var hit = _raycaster.ray.intersectPlane(_groundPlane, target);

    if (!hit) {
      _ghost.visible = false;
      return;
    }

    _ghost.visible = true;
    // Snap to 0.5-unit grid
    target.x = Math.round(target.x * 2) / 2;
    target.z = Math.round(target.z * 2) / 2;
    target.y = 0;

    _ghost.position.copy(target);
    _setGhostValidity(_isValidPlacement(target));
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLACEMENT VALIDATION
  ════════════════════════════════════════════════════════════════════════ */

  function _isValidPlacement(pos) {
    if (_structures.length >= _maxStructures) { return false; }

    var type = STRUCTURE_TYPES[_selectedIndex];
    if (_buildPoints < type.cost) { return false; }

    var minDist = Math.max(type.w, type.d) * 0.6;
    var i, s, dx, dz, dist;
    for (i = 0; i < _structures.length; i++) {
      s = _structures[i];
      dx = s.mesh.position.x - pos.x;
      dz = s.mesh.position.z - pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) { return false; }
    }

    return true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLACE STRUCTURE
  ════════════════════════════════════════════════════════════════════════ */

  function _placeStructure() {
    if (!_ghost || !_ghostValid) { return; }

    var type = STRUCTURE_TYPES[_selectedIndex];
    _buildPoints -= type.cost;

    var mesh = _buildStructureMesh(type, 1.0, false);
    mesh.position.copy(_ghost.position);
    _scene.add(mesh);

    var id = 'fort_' + (++_idCounter);
    var structure = {
      id: id,
      type: type,
      mesh: mesh,
      hp: type.hp,
      maxHp: type.hp,
      reinforced: false,
      camouflaged: false
    };

    _structures.push(structure);

    if (type.autoFire) {
      _mgTimers[id] = 0;
    }

    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     DAMAGE & REPAIR
  ════════════════════════════════════════════════════════════════════════ */

  function _damageStructure(structure, amount) {
    structure.hp = Math.max(0, structure.hp - amount);
    var ratio = structure.hp / structure.maxHp;
    structure.mesh.scale.y = Math.max(0.2, ratio);
    structure.mesh.position.y = -(1 - Math.max(0.2, ratio)) * 0.3;
    if (structure.hp <= 0) {
      _removeStructure(structure);
    }
  }

  function _removeStructure(structure) {
    _scene.remove(structure.mesh);
    structure.mesh.traverse(function (obj) {
      if (obj.geometry) { obj.geometry.dispose(); }
      if (obj.material) {
        var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        var k;
        for (k = 0; k < mats.length; k++) { mats[k].dispose(); }
      }
    });
    delete _mgTimers[structure.id];
    var idx = _structures.indexOf(structure);
    if (idx !== -1) { _structures.splice(idx, 1); }
    if (_upgradeTarget === structure) { _hideUpgradeMenu(); }
  }

  function _startRepair(structure) {
    if (_repairing) { return; }
    _repairing = structure;
    _repairTimer = 0;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MG NEST AUTO-FIRE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateMGNests(dt) {
    var i, s, type, nearest, nearestDist, j, e, dx, dz, dist;
    for (i = 0; i < _structures.length; i++) {
      s = _structures[i];
      type = s.type;
      if (!type.autoFire) { continue; }

      _mgTimers[s.id] = (_mgTimers[s.id] || 0) - dt;
      if (_mgTimers[s.id] > 0) { continue; }

      _mgTimers[s.id] = type.autoFireRate;

      if (!_enemies || !_enemies.length) { continue; }
      nearest = null;
      nearestDist = type.autoFireRange;

      for (j = 0; j < _enemies.length; j++) {
        e = _enemies[j];
        if (!e || !e.mesh || !e.mesh.position) { continue; }
        dx = e.mesh.position.x - s.mesh.position.x;
        dz = e.mesh.position.z - s.mesh.position.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = e;
        }
      }

      if (nearest) {
        if (typeof nearest.takeDamage === 'function') {
          nearest.takeDamage(type.autoFireDmg);
        } else if (nearest.hp !== undefined) {
          nearest.hp -= type.autoFireDmg;
        }
        _mgFlash(s);
      }
    }
  }

  function _mgFlash(structure) {
    structure.mesh.traverse(function (obj) {
      if (obj.isMesh && obj.geometry && obj.geometry.type === 'CylinderGeometry') {
        var savedHex = obj.material.color.getHex();
        obj.material.color.setHex(0xFFFF88);
        setTimeout(function () {
          if (obj.material) { obj.material.color.setHex(savedHex); }
        }, 80);
      }
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPGRADE MENU
  ════════════════════════════════════════════════════════════════════════ */

  function _createUpgradeMenuDOM() {
    _upgradeMenuEl = document.createElement('div');
    _upgradeMenuEl.id = 'fortUpgradeMenu';
    _upgradeMenuEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,20,10,0.92)',
      'color:#EEE',
      'padding:14px 18px',
      'font-family:monospace',
      'font-size:12px',
      'border:1px solid #4A8A4A',
      'border-radius:4px',
      'display:none',
      'min-width:220px',
      'z-index:10000'
    ].join(';');
    document.body.appendChild(_upgradeMenuEl);
  }

  function _showUpgradeMenu(structure) {
    _upgradeTarget = structure;
    if (!_upgradeMenuEl) { _createUpgradeMenuDOM(); }

    _upgradeMenuEl.innerHTML = '';

    var title = document.createElement('div');
    title.style.cssText = 'font-weight:bold;margin-bottom:6px;color:#FFD700;font-size:13px;';
    title.textContent = structure.type.label + ' — UPGRADE';
    _upgradeMenuEl.appendChild(title);

    var hpBar = document.createElement('div');
    hpBar.style.cssText = 'margin-bottom:8px;font-size:11px;color:#ccc;';
    hpBar.textContent = 'HP: ' + Math.round(structure.hp) + ' / ' + structure.maxHp;
    _upgradeMenuEl.appendChild(hpBar);

    var done1El, done2El;
    if (!structure.reinforced) {
      _upgradeMenuEl.appendChild(_makeUpgradeButton(
        'Reinforce (+50 HP) [15 BP]',
        function () { _upgradeReinforce(structure); }
      ));
    } else {
      done1El = document.createElement('div');
      done1El.style.cssText = 'color:#888;font-size:11px;margin-bottom:4px;';
      done1El.textContent = 'Reinforce: DONE';
      _upgradeMenuEl.appendChild(done1El);
    }

    if (!structure.camouflaged) {
      _upgradeMenuEl.appendChild(_makeUpgradeButton(
        'Camouflage (enemies ignore) [10 BP]',
        function () { _upgradeCamo(structure); }
      ));
    } else {
      done2El = document.createElement('div');
      done2El.style.cssText = 'color:#888;font-size:11px;margin-bottom:4px;';
      done2El.textContent = 'Camouflage: DONE';
      _upgradeMenuEl.appendChild(done2El);
    }

    var closeBtn = _makeUpgradeButton('Close', function () { _hideUpgradeMenu(); });
    closeBtn.style.background = '#444';
    _upgradeMenuEl.appendChild(closeBtn);

    _upgradeMenuEl.style.display = 'block';
  }

  function _makeUpgradeButton(label, fn) {
    var btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = [
      'display:block',
      'width:100%',
      'margin-bottom:4px',
      'padding:5px 8px',
      'background:#2A4A2A',
      'color:#EEE',
      'border:1px solid #555',
      'cursor:pointer',
      'font-size:11px',
      'text-align:left'
    ].join(';');
    btn.addEventListener('click', fn);
    return btn;
  }

  function _hideUpgradeMenu() {
    if (_upgradeMenuEl) { _upgradeMenuEl.style.display = 'none'; }
    _upgradeTarget = null;
  }

  function _upgradeReinforce(structure) {
    if (_buildPoints < 15) { return; }
    _buildPoints -= 15;
    structure.reinforced = true;
    structure.maxHp += 50;
    structure.hp = Math.min(structure.hp + 50, structure.maxHp);
    _hideUpgradeMenu();
    _updateHUD();
  }

  function _upgradeCamo(structure) {
    if (_buildPoints < 10) { return; }
    _buildPoints -= 10;
    structure.camouflaged = true;
    structure.mesh.traverse(function (obj) {
      if (obj.isMesh && obj.material) {
        var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        var k;
        for (k = 0; k < mats.length; k++) {
          mats[k].color.setHex(0x3A5A2A);
        }
      }
    });
    _hideUpgradeMenu();
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function _createHUD() {
    if (_hudEl) { return; }
    _hudEl = document.createElement('div');
    _hudEl.id = 'fortBuildHUD';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'background:rgba(0,0,0,0.75)',
      'color:#EEE',
      'padding:10px 14px',
      'font-family:monospace',
      'font-size:12px',
      'border:1px solid #555',
      'border-radius:4px',
      'display:none',
      'min-width:200px',
      'pointer-events:none',
      'z-index:9990'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }

    if (!_buildMode) {
      _hudEl.style.display = 'none';
      return;
    }

    _hudEl.style.display = 'block';
    var type = STRUCTURE_TYPES[_selectedIndex];
    var slotsUsed = _structures.length;
    var structList = '';
    var k, t, active, affordable;
    for (k = 0; k < STRUCTURE_TYPES.length; k++) {
      t = STRUCTURE_TYPES[k];
      active = (k === _selectedIndex) ? '&#9654; ' : '&nbsp;&nbsp;';
      affordable = (_buildPoints >= t.cost) ? '#AEF' : '#F88';
      structList += '<span style="color:' + affordable + '">' + active + (k + 1) + '. ' + t.label + ' (' + t.cost + ' BP)</span><br>';
    }

    _hudEl.innerHTML = [
      '<div style="color:#FFD700;font-weight:bold;margin-bottom:6px;">-- BUILD MODE --</div>',
      structList,
      '<div style="margin-top:6px;border-top:1px solid #444;padding-top:6px;">',
      '<span style="color:#7CF">SELECTED: </span><b>' + type.label + '</b><br>',
      '<span style="color:#7CF">COST: </span>' + type.cost + ' BP&nbsp;|&nbsp;<span style="color:#7CF">DESC: </span>' + type.desc + '<br>',
      '<span style="color:#FFD700">BUILD POINTS: ' + _buildPoints + '</span><br>',
      '<span style="color:#aaa">STRUCTURES: ' + slotsUsed + ' / ' + _maxStructures + '</span>',
      '</div>',
      '<div style="margin-top:4px;color:#888;font-size:10px;">[B] Toggle &nbsp;[1-6] Select &nbsp;[Scroll] Cycle &nbsp;[E] Repair</div>'
    ].join('');
  }

  /* ════════════════════════════════════════════════════════════════════════
     E/Z KEY ACTIONS
  ════════════════════════════════════════════════════════════════════════ */

  function _getNearestStructure(maxDist) {
    if (!_camera) { return null; }
    var camPos = _camera.position;
    var nearest = null;
    var nearestDist = maxDist;
    var i, s, dx, dz, dist;
    for (i = 0; i < _structures.length; i++) {
      s = _structures[i];
      dx = s.mesh.position.x - camPos.x;
      dz = s.mesh.position.z - camPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }

  function _tryRepairNearest() {
    var nearest = _getNearestStructure(3.0);
    if (nearest && nearest.hp < nearest.maxHp) {
      _startRepair(nearest);
    }
  }

  function _tryZoomObsPost() {
    var nearest = _getNearestStructure(2.5);
    if (!nearest || nearest.type.id !== 'OBS_POST') { return; }
    if (_camera && _camera.fov !== undefined) {
      _camera.fov = (_camera.fov < 45) ? 75 : 30;
      _camera.updateProjectionMatrix();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RIGHT-CLICK — open upgrade menu for nearest structure
  ════════════════════════════════════════════════════════════════════════ */

  function _onRightClick(e) {
    e.preventDefault();
    if (_buildMode) { return; }
    var nearest = _getNearestStructure(5.0);
    if (nearest) {
      _showUpgradeMenu(nearest);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD MODE TOGGLE & STRUCTURE SELECTION
  ════════════════════════════════════════════════════════════════════════ */

  function _toggleBuildMode() {
    _buildMode = !_buildMode;
    if (_buildMode) {
      _createGhost();
    } else {
      _destroyGhost();
      _hideUpgradeMenu();
    }
    _updateHUD();
  }

  function _selectStructure(index) {
    if (index < 0 || index >= STRUCTURE_TYPES.length) { return; }
    _selectedIndex = index;
    if (_buildMode) { _createGhost(); }
    _updateHUD();
  }

  function _cyclePrev() {
    _selectedIndex = (_selectedIndex - 1 + STRUCTURE_TYPES.length) % STRUCTURE_TYPES.length;
    if (_buildMode) { _createGhost(); }
    _updateHUD();
  }

  function _cycleNext() {
    _selectedIndex = (_selectedIndex + 1) % STRUCTURE_TYPES.length;
    if (_buildMode) { _createGhost(); }
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     EVENT BINDING
  ════════════════════════════════════════════════════════════════════════ */

  function _bindEvents() {
    _onKeyDown = function (e) {
      var num;
      if (e.key === 'b' || e.key === 'B') {
        _toggleBuildMode();
        return;
      }
      num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6) {
        _selectStructure(num - 1);
        return;
      }
      if ((e.key === 'e' || e.key === 'E') && !_buildMode) {
        _tryRepairNearest();
        return;
      }
      if ((e.key === 'z' || e.key === 'Z') && !_buildMode) {
        _tryZoomObsPost();
        return;
      }
      if (e.key === 'Escape' && _upgradeMenuEl && _upgradeMenuEl.style.display !== 'none') {
        _hideUpgradeMenu();
      }
    };

    _onWheel = function (e) {
      if (!_buildMode) { return; }
      e.preventDefault();
      if (e.deltaY < 0) {
        _cyclePrev();
      } else {
        _cycleNext();
      }
    };

    _onClick = function (e) {
      if (!_buildMode) { return; }
      if (e.button !== 0) { return; }
      _placeStructure();
    };

    _onContextMenu = _onRightClick;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('wheel', _onWheel, { passive: false });
    window.addEventListener('click', _onClick);
    window.addEventListener('contextmenu', _onContextMenu);
  }

  function _unbindEvents() {
    if (_onKeyDown)     { window.removeEventListener('keydown', _onKeyDown); }
    if (_onWheel)       { window.removeEventListener('wheel', _onWheel); }
    if (_onClick)       { window.removeEventListener('click', _onClick); }
    if (_onContextMenu) { window.removeEventListener('contextmenu', _onContextMenu); }
    _onKeyDown = _onWheel = _onClick = _onContextMenu = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(options) {
    options = options || {};
    _scene   = options.scene   || (window.GameState && window.GameState.scene)  || null;
    _camera  = options.camera  || (window.GameState && window.GameState.camera) || null;
    _enemies = options.enemies || null;

    if (options.buildPoints   !== undefined) { _buildPoints   = options.buildPoints; }
    if (options.maxStructures !== undefined) { _maxStructures = options.maxStructures; }

    // Lazy-init Three.js helpers that require THREE to be available
    _raycaster   = new THREE.Raycaster();
    _mouse       = new THREE.Vector2(0, 0);
    _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    _createHUD();
    _bindEvents();
    _updateHUD();
  }

  function update(dt) {
    if (!_scene || !_camera) { return; }

    if (_buildMode && _ghost) {
      _updateGhostPosition();
    }

    // Repair tick
    if (_repairing) {
      _repairTimer += dt;
      if (_repairTimer >= _repairDuration) {
        _repairing.hp = Math.min(_repairing.maxHp, _repairing.hp + 30);
        var ratio = _repairing.hp / _repairing.maxHp;
        _repairing.mesh.scale.y = Math.max(0.2, ratio);
        _repairing.mesh.position.y = -(1 - Math.max(0.2, ratio)) * 0.3;
        _repairing = null;
        _repairTimer = 0;
      }
    }

    _updateMGNests(dt);
  }

  function reset() {
    var i;

    _buildMode     = false;
    _buildPoints   = 100;
    _selectedIndex = 0;

    _destroyGhost();
    _hideUpgradeMenu();

    for (i = _structures.length - 1; i >= 0; i--) {
      _removeStructure(_structures[i]);
    }
    _structures = [];
    _mgTimers   = {};
    _repairing  = null;
    _repairTimer = 0;

    _unbindEvents();

    if (_hudEl) { _hudEl.style.display = 'none'; }
  }

  /* ── Extra public helpers ─────────────────────────────────────────────── */

  function damageStructureAt(worldPos, amount, radius) {
    radius = radius || 1.0;
    var i, s, dx, dz, dist;
    for (i = 0; i < _structures.length; i++) {
      s = _structures[i];
      dx = s.mesh.position.x - worldPos.x;
      dz = s.mesh.position.z - worldPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= radius) {
        _damageStructure(s, amount);
      }
    }
  }

  function getStructures() {
    return _structures.slice();
  }

  function getBuildPoints() {
    return _buildPoints;
  }

  function addBuildPoints(amount) {
    _buildPoints += amount;
    _updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset,
    damageStructureAt: damageStructureAt,
    getStructures: getStructures,
    getBuildPoints: getBuildPoints,
    addBuildPoints: addBuildPoints
  };

}());
