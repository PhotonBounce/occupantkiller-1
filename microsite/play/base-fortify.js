/**
 * base-fortify.js — Base Fortification System
 * P key cycles through: SANDBAG | BARBED_WIRE | METAL_WALL | GUARD_TOWER
 * Left click: place selected fortification at crosshair (max 8 total)
 *
 * All fortifications: 150 HP, damage tinting on low HP.
 * Resources: 100 credits per build (window._credits or window.Economy.credits)
 * Ghost preview shown at placement target.
 * Fortifications persist between waves.
 * HUD: selected type shown bottom-right with count remaining.
 *
 * IIFE pattern, all var — no let/const anywhere.
 */

window.BaseFortify = (function () {
  'use strict';

  /* ── Fortification type catalogue ─────────────────────────────────── */
  var TYPES = ['SANDBAG', 'BARBED_WIRE', 'METAL_WALL', 'GUARD_TOWER'];
  var TYPE_LABELS = {
    SANDBAG:     'SANDBAG',
    BARBED_WIRE: 'BARBED WIRE',
    METAL_WALL:  'METAL WALL',
    GUARD_TOWER: 'GUARD TOWER'
  };

  /* ── Constants ─────────────────────────────────────────────────────── */
  var MAX_FORTS    = 8;
  var FORT_HP      = 150;
  var BUILD_COST   = 100;
  var PLACE_DIST   = 4;    // units in front of player
  var WIRE_SLOW    = 0.5;  // 50% speed reduction
  var WIRE_DPS     = 5;    // damage per second
  var TOWER_RANGE_BONUS = 0.20; // +20% range when mounted

  /* ── Private state ─────────────────────────────────────────────────── */
  var _scene        = null;
  var _camera       = null;
  var _selectedIdx  = 0;
  var _forts        = [];    // deployed fortification objects
  var _ghost        = null;  // THREE.Group preview
  var _ghostMats    = [];    // materials to dispose
  var _hudEl        = null;  // bottom-right HUD element
  var _active       = false; // placement mode on/off
  var _onTower      = false; // player mounted on guard tower
  var _mountedTower = null;  // which tower
  var _keyHandler   = null;
  var _clickHandler = null;
  var _wireInterval = null;  // interval for barbed wire damage

  /* ── Geometry builders ─────────────────────────────────────────────── */

  function _buildSandbag(ghost) {
    var group = new THREE.Group();
    var mats = [];
    var cols = 3;
    var rows = 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var geo = new THREE.BoxGeometry(1, 0.5, 0.4);
        var mat;
        if (ghost) {
          mat = new THREE.MeshBasicMaterial({
            color: 0x00ff88, transparent: true, opacity: 0.38, depthWrite: false
          });
          mats.push(mat);
        } else {
          // Tan sandbag colour with slight variation
          var tint = 0xC8A87A + (Math.floor(Math.random() * 3) - 1) * 0x050500;
          mat = new THREE.MeshLambertMaterial({ color: tint });
        }
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (c - 1) * 1.05,
          r * 0.52 + 0.25,
          0
        );
        group.add(mesh);
      }
    }
    return { group: group, mats: mats };
  }

  function _buildBarbedWire(ghost) {
    var group = new THREE.Group();
    var mats = [];

    // Low flat wire body
    var bodyGeo = new THREE.BoxGeometry(1.5, 0.2, 0.1);
    var bodyMat;
    if (ghost) {
      bodyMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88, transparent: true, opacity: 0.38, depthWrite: false
      });
      mats.push(bodyMat);
    } else {
      bodyMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    }
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.1, 0);
    group.add(body);

    // Spike posts
    var spikeCols = 5;
    for (var i = 0; i < spikeCols; i++) {
      var spikeGeo = new THREE.BoxGeometry(0.04, 0.3, 0.04);
      var spikeMat;
      if (ghost) {
        spikeMat = new THREE.MeshBasicMaterial({
          color: 0x00ff88, transparent: true, opacity: 0.28, depthWrite: false
        });
        mats.push(spikeMat);
      } else {
        spikeMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
      }
      var spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(-0.6 + i * 0.3, 0.25, 0);
      group.add(spike);
    }

    return { group: group, mats: mats };
  }

  function _buildMetalWall(ghost) {
    var group = new THREE.Group();
    var mats = [];

    var geo = new THREE.BoxGeometry(0.15, 2, 1.5);
    var mat;
    if (ghost) {
      mat = new THREE.MeshBasicMaterial({
        color: 0x00ff88, transparent: true, opacity: 0.38, depthWrite: false
      });
      mats.push(mat);
    } else {
      mat = new THREE.MeshLambertMaterial({ color: 0x607060 });
    }
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 1, 0);
    group.add(mesh);

    return { group: group, mats: mats };
  }

  function _buildGuardTower(ghost) {
    var group = new THREE.Group();
    var mats = [];

    // Ground floor platform
    var floorGeo = new THREE.BoxGeometry(2, 0.2, 2);
    var floorMat;
    if (ghost) {
      floorMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88, transparent: true, opacity: 0.38, depthWrite: false
      });
      mats.push(floorMat);
    } else {
      floorMat = new THREE.MeshLambertMaterial({ color: 0x5a5040 });
    }
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.1, 0);
    group.add(floor);

    // Support pillars (4 corners)
    var pillarPositions = [[-0.85, 0, -0.85], [0.85, 0, -0.85], [-0.85, 0, 0.85], [0.85, 0, 0.85]];
    for (var i = 0; i < pillarPositions.length; i++) {
      var pGeo = new THREE.BoxGeometry(0.18, 2.4, 0.18);
      var pMat;
      if (ghost) {
        pMat = new THREE.MeshBasicMaterial({
          color: 0x00ff88, transparent: true, opacity: 0.28, depthWrite: false
        });
        mats.push(pMat);
      } else {
        pMat = new THREE.MeshLambertMaterial({ color: 0x5a5040 });
      }
      var pillar = new THREE.Mesh(pGeo, pMat);
      pillar.position.set(pillarPositions[i][0], 1.3, pillarPositions[i][2]);
      group.add(pillar);
    }

    // Upper deck
    var deckGeo = new THREE.BoxGeometry(2.2, 0.2, 2.2);
    var deckMat;
    if (ghost) {
      deckMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88, transparent: true, opacity: 0.38, depthWrite: false
      });
      mats.push(deckMat);
    } else {
      deckMat = new THREE.MeshLambertMaterial({ color: 0x4a4030 });
    }
    var deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 2.5, 0);
    group.add(deck);

    // Railing / parapet on top deck
    var railPositions = [
      [0, 2.75, -1.0], [0, 2.75, 1.0],
      [-1.0, 2.75, 0], [1.0, 2.75, 0]
    ];
    var railDims = [
      [2.2, 0.5, 0.12], [2.2, 0.5, 0.12],
      [0.12, 0.5, 2.2], [0.12, 0.5, 2.2]
    ];
    for (var j = 0; j < railPositions.length; j++) {
      var rGeo = new THREE.BoxGeometry(railDims[j][0], railDims[j][1], railDims[j][2]);
      var rMat;
      if (ghost) {
        rMat = new THREE.MeshBasicMaterial({
          color: 0x00ff88, transparent: true, opacity: 0.25, depthWrite: false
        });
        mats.push(rMat);
      } else {
        rMat = new THREE.MeshLambertMaterial({ color: 0x5a5040 });
      }
      var rail = new THREE.Mesh(rGeo, rMat);
      rail.position.set(railPositions[j][0], railPositions[j][1], railPositions[j][2]);
      group.add(rail);
    }

    return { group: group, mats: mats };
  }

  function _buildFortMesh(type, ghost) {
    switch (type) {
      case 'SANDBAG':     return _buildSandbag(ghost);
      case 'BARBED_WIRE': return _buildBarbedWire(ghost);
      case 'METAL_WALL':  return _buildMetalWall(ghost);
      case 'GUARD_TOWER': return _buildGuardTower(ghost);
      default:            return _buildSandbag(ghost);
    }
  }

  /* ── Ghost preview ─────────────────────────────────────────────────── */

  function _createGhost() {
    _removeGhost();
    var type = TYPES[_selectedIdx];
    var result = _buildFortMesh(type, true);
    _ghost = result.group;
    _ghostMats = result.mats;
    if (_scene) _scene.add(_ghost);
  }

  function _removeGhost() {
    if (_ghost && _scene) _scene.remove(_ghost);
    for (var i = 0; i < _ghostMats.length; i++) {
      if (_ghostMats[i] && _ghostMats[i].dispose) _ghostMats[i].dispose();
    }
    _ghost = null;
    _ghostMats = [];
  }

  function _updateGhostPosition() {
    if (!_ghost || !_camera) return;
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    dir.y = 0;
    if (dir.length() > 0.001) dir.normalize();
    var cx = _camera.position.x + dir.x * PLACE_DIST;
    var cz = _camera.position.z + dir.z * PLACE_DIST;
    _ghost.position.set(cx, 0, cz);
    var angle = Math.atan2(dir.x, dir.z) + Math.PI / 2;
    _ghost.rotation.y = angle;
  }

  /* ── Credits helpers ───────────────────────────────────────────────── */

  function _getCredits() {
    if (window._credits !== undefined) return window._credits;
    if (window.Economy && typeof window.Economy.getCurrency === 'function') {
      return window.Economy.getCurrency();
    }
    return 9999; // fallback: unlimited
  }

  function _spendCredits(amount) {
    if (window._credits !== undefined) {
      if (window._credits < amount) return false;
      window._credits -= amount;
      return true;
    }
    if (window.Economy && typeof window.Economy.spendCurrency === 'function') {
      return window.Economy.spendCurrency(amount);
    }
    return true; // fallback: free
  }

  /* ── Damage visual helper ──────────────────────────────────────────── */

  function _applyDamageTint(fort) {
    if (!fort || !fort.group) return;
    var ratio = fort.hp / fort.maxHp;
    // tint meshes red as HP drops
    fort.group.traverse(function (obj) {
      if (obj.isMesh && obj.material && !obj.material.transparent) {
        var r = Math.min(1, 1 - ratio * 0.5 + 0.5);
        var g = ratio * 0.8;
        var b = ratio * 0.5;
        if (obj.material.color && obj.material.color.setRGB) {
          obj.material.color.setRGB(r, g, b);
        }
      }
    });
  }

  /* ── Placement validation ──────────────────────────────────────────── */

  function _isValidPlacement(x, z) {
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.isSolid) {
      if (VoxelWorld.isSolid(Math.round(x), 1, Math.round(z))) return false;
    }
    for (var i = 0; i < _forts.length; i++) {
      var f = _forts[i];
      var dx = f.group.position.x - x;
      var dz = f.group.position.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.2) return false;
    }
    return true;
  }

  /* ── Deploy a fortification ────────────────────────────────────────── */

  function _deploy(type, x, z, rotY) {
    if (_forts.length >= MAX_FORTS) {
      _showToast('Max fortifications reached (' + MAX_FORTS + ')', '#ff8888');
      return null;
    }
    if (!_spendCredits(BUILD_COST)) {
      _showToast('Need ' + BUILD_COST + ' credits to build', '#ff8888');
      return null;
    }

    var result = _buildFortMesh(type, false);
    var group  = result.group;
    group.position.set(x, 0, z);
    group.rotation.y = rotY || 0;

    var fort = {
      group:    group,
      type:     type,
      hp:       FORT_HP,
      maxHp:    FORT_HP,
      isSolid:  (type === 'SANDBAG' || type === 'METAL_WALL' || type === 'GUARD_TOWER'),
      isWire:   (type === 'BARBED_WIRE'),
      isTower:  (type === 'GUARD_TOWER'),
      damaged:  false
    };

    if (_scene) _scene.add(group);
    _forts.push(fort);
    _updateHud();

    if (typeof AudioSystem !== 'undefined' && AudioSystem.playFortificationBuild) {
      AudioSystem.playFortificationBuild();
    }

    _showToast(TYPE_LABELS[type] + ' placed', '#aaffcc');
    return fort;
  }

  /* ── Remove a fortification ────────────────────────────────────────── */

  function _removeFort(fort) {
    if (!fort) return;
    if (_scene && fort.group) _scene.remove(fort.group);
    fort.group.traverse(function (obj) {
      if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map && obj.material.map.dispose) obj.material.map.dispose();
        if (obj.material.dispose) obj.material.dispose();
      }
    });
    if (_mountedTower === fort) {
      _dismountTower();
    }
  }

  /* ── Barbed wire enemy interaction ────────────────────────────────── */

  function _startWireInterval() {
    if (_wireInterval) return;
    _wireInterval = setInterval(function () {
      if (!window.Enemies || !window.Enemies.getAll) return;
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < _forts.length; i++) {
        var f = _forts[i];
        if (!f.isWire) continue;
        for (var j = 0; j < enemies.length; j++) {
          var e = enemies[j];
          if (!e || !e.mesh) continue;
          var dx = e.mesh.position.x - f.group.position.x;
          var dz = e.mesh.position.z - f.group.position.z;
          var dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 1.0) {
            // Slow enemy
            if (e.speedMult !== undefined) {
              e.speedMult = Math.min(e.speedMult || 1, 1 - WIRE_SLOW);
            }
            // Damage enemy
            if (typeof e.takeDamage === 'function') {
              e.takeDamage(WIRE_DPS, 'wire');
            } else if (e.hp !== undefined) {
              e.hp -= WIRE_DPS;
            }
          } else {
            // Reset slow once out of range
            if (e._wireSlowed) {
              e.speedMult = e._baseSpeedMult || 1;
              e._wireSlowed = false;
            }
          }
        }
      }
    }, 1000);
  }

  /* ── Guard tower mount / dismount ──────────────────────────────────── */

  function _tryMountTower(x, z) {
    for (var i = 0; i < _forts.length; i++) {
      var f = _forts[i];
      if (!f.isTower) continue;
      var dx = f.group.position.x - x;
      var dz = f.group.position.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
        _mountedTower = f;
        _onTower = true;
        // Apply range bonus to weapons module if available
        if (window.Weapons && typeof window.Weapons.addRangeBonus === 'function') {
          window.Weapons.addRangeBonus(TOWER_RANGE_BONUS);
        }
        // Optionally elevate camera
        if (_camera) {
          _camera.position.y = 3.5; // elevated deck position
        }
        _showToast('Mounted GUARD TOWER (+20% range)', '#ffcc44');
        return true;
      }
    }
    return false;
  }

  function _dismountTower() {
    if (!_onTower) return;
    _onTower = false;
    _mountedTower = null;
    if (window.Weapons && typeof window.Weapons.addRangeBonus === 'function') {
      window.Weapons.addRangeBonus(-TOWER_RANGE_BONUS);
    }
    _showToast('Dismounted tower', '#aaa');
  }

  /* ── HUD ───────────────────────────────────────────────────────────── */

  function _buildHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'baseFortifyHud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:92px',
      'right:12px',
      'font-family:monospace',
      'font-size:11px',
      'color:#aaffcc',
      'background:rgba(0,0,0,0.6)',
      'border:1px solid rgba(100,200,140,0.35)',
      'border-radius:4px',
      'padding:4px 12px',
      'z-index:200',
      'pointer-events:none',
      'text-align:right'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHud() {
    if (!_hudEl) return;
    var type = TYPES[_selectedIdx];
    var remaining = MAX_FORTS - _forts.length;
    var credits = _getCredits();
    _hudEl.innerHTML =
      '🛡 ' + TYPE_LABELS[type] +
      ' | ' + remaining + ' remaining' +
      '<br><span style="color:#ffcc44;font-size:10px">P: cycle | LMB: place | $' + credits + '</span>';
  }

  /* ── Toast notification ────────────────────────────────────────────── */

  function _showToast(msg, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg, 2000, color || '#aaffcc');
        return;
      }
    } catch (e) {}
    // Fallback: create inline toast
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'bottom:130px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:12px',
      'color:' + (color || '#aaffcc'),
      'background:rgba(0,0,0,0.7)',
      'border-radius:4px',
      'padding:4px 14px',
      'z-index:300',
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 2000);
  }

  /* ── Key / Click handlers ──────────────────────────────────────────── */

  function _onKeyDown(ev) {
    if (ev.repeat) return;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

    if (ev.code === 'KeyP') {
      // Cycle through fortification types
      _selectedIdx = (_selectedIdx + 1) % TYPES.length;
      _updateHud();
      if (_ghost) {
        _removeGhost();
        _createGhost();
      }
      _showToast('Selected: ' + TYPE_LABELS[TYPES[_selectedIdx]], '#aaffcc');
    }
  }

  function _onClick(ev) {
    // Left click only
    if (ev.button !== 0) return;
    // Only fire when pointer is locked (FPS mode)
    if (!document.pointerLockElement && !document.mozPointerLockElement) return;

    var type = TYPES[_selectedIdx];
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    dir.y = 0;
    if (dir.length() > 0.001) dir.normalize();
    var x = _camera.position.x + dir.x * PLACE_DIST;
    var z = _camera.position.z + dir.z * PLACE_DIST;

    if (!_isValidPlacement(x, z)) {
      _showToast('Cannot place here', '#ff8888');
      return;
    }

    var angle = Math.atan2(dir.x, dir.z) + Math.PI / 2;
    _deploy(type, x, z, angle);
  }

  /* ── Public API ────────────────────────────────────────────────────── */

  function init(scene, camera) {
    _scene  = scene  || (window.GameManager && window.GameManager.getScene  ? window.GameManager.getScene()  : null);
    _camera = camera || (window.GameManager && window.GameManager.getCamera ? window.GameManager.getCamera() : null);

    _buildHud();
    _updateHud();

    if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
    if (_clickHandler) document.removeEventListener('mousedown', _clickHandler);

    _keyHandler   = _onKeyDown;
    _clickHandler = _onClick;

    document.addEventListener('keydown',   _keyHandler);
    document.addEventListener('mousedown', _clickHandler);

    _startWireInterval();

    // Create ghost preview immediately
    _createGhost();

    console.log('[BaseFortify] init — scene:', !!_scene, 'camera:', !!_camera);
  }

  function update() {
    // Pull camera from GameManager each frame if not already set
    if (!_camera && window.GameManager && window.GameManager.getCamera) {
      _camera = window.GameManager.getCamera();
    }
    if (!_scene && window.GameManager && window.GameManager.getScene) {
      _scene = window.GameManager.getScene();
    }
    _updateGhostPosition();
    _updateHud();
  }

  function place(type, x, z, rotY) {
    if (TYPES.indexOf(type) === -1) type = TYPES[0];
    if (!_isValidPlacement(x, z)) return null;
    return _deploy(type, x, z, rotY || 0);
  }

  function reset() {
    // Remove all deployed fortifications
    for (var i = 0; i < _forts.length; i++) {
      _removeFort(_forts[i]);
    }
    _forts = [];
    _onTower = false;
    _mountedTower = null;
    _removeGhost();
    if (_wireInterval) { clearInterval(_wireInterval); _wireInterval = null; }
    if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
    if (_clickHandler) document.removeEventListener('mousedown', _clickHandler);
    _keyHandler = null;
    _clickHandler = null;
    if (_hudEl && _hudEl.parentNode) _hudEl.parentNode.removeChild(_hudEl);
    _hudEl = null;
    console.log('[BaseFortify] reset');
  }

  /* ── Expose damage API for bullets / enemies ───────────────────────── */

  function damageFort(fort, amount) {
    if (!fort) return;
    fort.hp -= (amount || 20);
    if (fort.hp < 0) fort.hp = 0;
    _applyDamageTint(fort);
    if (fort.hp <= 0) {
      var idx = _forts.indexOf(fort);
      if (idx !== -1) _forts.splice(idx, 1);
      _removeFort(fort);
      _updateHud();
      _showToast(TYPE_LABELS[fort.type] + ' destroyed', '#ff8888');
    }
  }

  function getForts()         { return _forts; }
  function getSelectedType()  { return TYPES[_selectedIdx]; }
  function isOnTower()        { return _onTower; }

  return {
    init:            init,
    update:          update,
    place:           place,
    reset:           reset,
    damageFort:      damageFort,
    getForts:        getForts,
    getSelectedType: getSelectedType,
    isOnTower:       isOnTower
  };

})();
