/**
 * fortification-system.js — Deployable Sandbag Cover System
 * Toggle with F2. Place sandbag walls for tactical cover.
 * IIFE pattern, all var.
 *
 * Key bindings:
 *   F2        — toggle placement mode
 *   LMB       — confirm placement (while in placement mode)
 *   Escape    — cancel placement mode
 *
 * F1 is taken by WeaponCodex. F2 standalone is free (F2 inside build mode
 * selects "factory" but the fortification key only fires outside build mode).
 */

window._fortificationCount = 0;
window._maxFortifications = 5;
window._placingFortification = false;

window.FortificationSystem = (function () {
  'use strict';

  /* ── private state ──────────────────────────────────────────────── */
  var _scene         = null;
  var _camera        = null;
  var _deployed      = [];   // array of sandbag wall objects
  var _ghost         = null; // transparent preview mesh group
  var _ghostMats     = [];   // ghost materials (to dispose)
  var _hudEl         = null; // #sandbagHud DOM element
  var _infoEl        = null; // #sandbagInfo DOM element
  var _keyHandler    = null;
  var _clickHandler  = null;

  var MAX  = 5;
  var BAG_HP = 150;
  var PLACE_DIST = 3;    // units in front of player
  var MAX_Y      = 2;    // must be near ground

  /* ── geometry constants ─────────────────────────────────────────── */
  var BAG_R_TOP    = 0.3;
  var BAG_R_BOT    = 0.35;
  var BAG_H        = 0.4;
  var BAG_SEGS     = 8;
  var BAG_COLOR    = 0xC2956C;

  var COLS         = 4;  // bags per row
  var ROWS         = 2;  // rows high
  var WALL_W       = 1.6; // total wall width  (4 × 0.4)
  var WALL_H       = 0.8; // total wall height (2 × 0.4)

  /* ── helpers ────────────────────────────────────────────────────── */
  function _makeBagMesh(roughnessTint) {
    var geo = new THREE.CylinderGeometry(BAG_R_TOP, BAG_R_BOT, BAG_H, BAG_SEGS);
    var col = BAG_COLOR + roughnessTint;
    var mat = new THREE.MeshLambertMaterial({ color: col });
    var mesh = new THREE.Mesh(geo, mat);
    // lay on its side: rotate X so the cylinder axis is horizontal
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  function _buildWallGroup(ghost) {
    var group = new THREE.Group();
    var ghostMatsLocal = [];

    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        var tint = (Math.floor(Math.random() * 5) - 2) * 0x010000;
        var bag;
        if (ghost) {
          var geo = new THREE.CylinderGeometry(BAG_R_TOP, BAG_R_BOT, BAG_H, BAG_SEGS);
          var mat = new THREE.MeshBasicMaterial({
            color: 0x00ff44,
            transparent: true,
            opacity: 0.4,
            depthWrite: false
          });
          bag = new THREE.Mesh(geo, mat);
          bag.rotation.x = Math.PI / 2;
          ghostMatsLocal.push(mat);
        } else {
          bag = _makeBagMesh(tint);
        }
        // position: centre the wall on (0,0,0) of the group
        var xOff = (col - (COLS - 1) / 2) * BAG_H; // BAG_H = 0.4 is the laid length
        var yOff = row * BAG_H + BAG_H / 2;
        bag.position.set(xOff, yOff, 0);
        group.add(bag);
      }
    }

    return { group: group, ghostMats: ghostMatsLocal };
  }

  /* ── ghost preview ──────────────────────────────────────────────── */
  function _createGhost() {
    _removeGhost();
    var result = _buildWallGroup(true);
    _ghost = result.group;
    _ghostMats = result.ghostMats;
    if (_scene) _scene.add(_ghost);
  }

  function _removeGhost() {
    if (_ghost && _scene) {
      _scene.remove(_ghost);
    }
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
    var cy = 0; // ground level
    _ghost.position.set(cx, cy, cz);
    // face the player
    var angle = Math.atan2(dir.x, dir.z) + Math.PI / 2;
    _ghost.rotation.y = angle;
  }

  /* ── bullet-hole canvas texture (low-hp damage visual) ─────────── */
  function _makeDamageTexture() {
    var canvas = document.createElement('canvas');
    canvas.width  = 128;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#C2956C';
    ctx.fillRect(0, 0, 128, 128);
    // draw 6 dark bullet-hole dots
    for (var i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(
        16 + Math.random() * 96,
        16 + Math.random() * 96,
        3 + Math.random() * 4,
        0, Math.PI * 2
      );
      ctx.fillStyle = 'rgba(30,20,10,0.85)';
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  /* ── placement validation ───────────────────────────────────────── */
  function _isValidPlacement(x, y, z) {
    // must be near ground
    if (y > MAX_Y) return false;

    // cannot place inside a solid voxel
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.isSolid) {
      if (VoxelWorld.isSolid(Math.round(x), 1, Math.round(z))) return false;
    }

    // cannot be within 1 unit of another sandbag wall
    for (var i = 0; i < _deployed.length; i++) {
      var d = _deployed[i];
      var dx = d.group.position.x - x;
      var dz = d.group.position.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.0) return false;
    }

    return true;
  }

  /* ── deploy a sandbag wall ──────────────────────────────────────── */
  function _deployWall(x, y, z, rotY) {
    // enforce limit: remove oldest if at max
    if (_deployed.length >= MAX) {
      var oldest = _deployed.shift();
      _removeWall(oldest);
    }

    var result = _buildWallGroup(false);
    var group  = result.group;

    group.position.set(x, y, z);
    group.rotation.y = rotY || 0;

    var wall = {
      group:    group,
      hp:       BAG_HP,
      maxHp:    BAG_HP,
      isSolid:  true,
      damaged:  false,
      dmgTex:   null
    };

    if (_scene) _scene.add(group);
    _deployed.push(wall);
    window._fortificationCount = _deployed.length;
    _updateHud();

    // play sound if available
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playFortificationBuild) {
      AudioSystem.playFortificationBuild();
    }

    return wall;
  }

  /* ── remove a single wall ───────────────────────────────────────── */
  function _removeWall(wall) {
    if (!wall) return;
    if (_scene && wall.group) _scene.remove(wall.group);
    // dispose geometries and materials
    wall.group.traverse(function (obj) {
      if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map && obj.material.map.dispose) obj.material.map.dispose();
        if (obj.material.dispose) obj.material.dispose();
      }
    });
    if (wall.dmgTex && wall.dmgTex.dispose) wall.dmgTex.dispose();
  }

  /* ── sand particle explosion ────────────────────────────────────── */
  function _explodeWall(wall) {
    if (!_scene || !wall.group) return;
    var cx = wall.group.position.x;
    var cy = wall.group.position.y + WALL_H / 2;
    var cz = wall.group.position.z;
    var pGeo = new THREE.SphereGeometry(0.06, 4, 4);
    var particles = [];
    for (var i = 0; i < 8; i++) {
      var pMat = new THREE.MeshBasicMaterial({ color: BAG_COLOR });
      var pm = new THREE.Mesh(pGeo, pMat);
      pm.position.set(cx, cy, cz);
      _scene.add(pm);
      particles.push({
        mesh: pm,
        mat: pMat,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          1.5 + Math.random() * 2,
          (Math.random() - 0.5) * 4
        ),
        life: 0.7 + Math.random() * 0.5
      });
    }
    // animate particles
    var geo = pGeo; // shared geometry
    var startTime = Date.now();
    var interval = setInterval(function () {
      var dt = 0.016;
      var allDead = true;
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        if (p.life <= 0) continue;
        allDead = false;
        p.life -= dt;
        p.vel.y -= 9.8 * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        p.mat.opacity = Math.max(0, p.life / 1.2);
        p.mat.transparent = true;
        if (p.life <= 0 && _scene) {
          _scene.remove(p.mesh);
          p.mat.dispose();
        }
      }
      if (allDead || (Date.now() - startTime) > 2000) {
        clearInterval(interval);
        if (geo && geo.dispose) geo.dispose();
      }
    }, 16);
  }

  /* ── apply bullet damage to a wall ─────────────────────────────── */
  function _damageWall(wall, amount) {
    if (!wall) return;
    wall.hp -= (amount || 20);
    if (wall.hp < 0) wall.hp = 0;

    // apply damage texture at <50% HP
    if (wall.hp < wall.maxHp * 0.5 && !wall.damaged) {
      wall.damaged = true;
      wall.dmgTex = _makeDamageTexture();
      wall.group.traverse(function (obj) {
        if (obj.isMesh && obj.material && !obj.material.isMeshBasicMaterial) {
          obj.material.map = wall.dmgTex;
          obj.material.needsUpdate = true;
        }
      });
    }

    // destroy at 0 HP
    if (wall.hp <= 0) {
      _explodeWall(wall);
      var idx = _deployed.indexOf(wall);
      if (idx !== -1) _deployed.splice(idx, 1);
      _removeWall(wall);
      window._fortificationCount = _deployed.length;
      _updateHud();
    }
  }

  /* ── HUD ────────────────────────────────────────────────────────── */
  function _buildHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'sandbagHud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:92px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:11px',
      'color:#c8b480',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(200,180,120,0.35)',
      'border-radius:4px',
      'padding:2px 12px',
      'z-index:200',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHud() {
    if (!_hudEl) return;
    var remaining = MAX - _deployed.length;
    if (remaining > 0) {
      _hudEl.style.color = '#c8b480';
      _hudEl.textContent = '[F2] SANDBAGS: ' + remaining + '/' + MAX;
    } else {
      _hudEl.style.color = '#ffee00';
      _hudEl.textContent = '[F2] SANDBAGS DEPLETED';
    }
    _hudEl.style.display = '';
  }

  function _buildInfoEl() {
    if (_infoEl) return;
    _infoEl = document.createElement('div');
    _infoEl.id = 'sandbagInfo';
    _infoEl.style.cssText = [
      'position:fixed',
      'bottom:115px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:11px',
      'color:#c8b480',
      'background:rgba(0,0,0,0.7)',
      'border:1px solid rgba(200,180,120,0.4)',
      'border-radius:4px',
      'padding:4px 14px',
      'z-index:200',
      'pointer-events:none',
      'display:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_infoEl);
  }

  function _updateInfoEl(wall) {
    if (!_infoEl) return;
    if (!wall) {
      _infoEl.style.display = 'none';
      return;
    }
    var pct = wall.hp / wall.maxHp;
    var bars = Math.round(pct * 10);
    var filled = '';
    for (var i = 0; i < 10; i++) filled += (i < bars ? '█' : '░');
    var col = pct > 0.5 ? '#44dd44' : (pct > 0.25 ? '#ffcc00' : '#ff4444');
    _infoEl.style.color = col;
    _infoEl.innerHTML = 'SANDBAG COVER &mdash; HP: ' + wall.hp + '/' + wall.maxHp +
      ' [' + filled + ']';
    _infoEl.style.display = '';
  }

  /* ── enter / exit placement mode ────────────────────────────────── */
  function _enterPlacementMode() {
    window._placingFortification = true;
    _createGhost();
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('SANDBAG PLACEMENT MODE — Click to place, ESC to cancel', '#c8b480');
    }
  }

  function _exitPlacementMode() {
    window._placingFortification = false;
    _removeGhost();
  }

  /* ── confirm placement at current ghost position ─────────────────── */
  function _confirmPlacement() {
    if (!window._placingFortification || !_ghost) return;

    var x   = _ghost.position.x;
    var y   = _ghost.position.y;
    var z   = _ghost.position.z;
    var rotY = _ghost.rotation.y;

    if (!_isValidPlacement(x, y, z)) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('CANNOT PLACE HERE', '#ff4444');
      }
      return;
    }

    _exitPlacementMode();
    _deployWall(x, y, z, rotY);
  }

  /* ── look-at detection (runs each frame) ────────────────────────── */
  function _checkLookAt() {
    if (!_camera || _deployed.length === 0) {
      if (_infoEl) _infoEl.style.display = 'none';
      return;
    }

    var camPos = _camera.position;
    var dir    = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    var closest = null;
    var closestDot = 0.85; // must be looking roughly at it

    for (var i = 0; i < _deployed.length; i++) {
      var wall = _deployed[i];
      if (!wall.group) continue;
      var wPos = wall.group.position;
      var dx = wPos.x - camPos.x;
      var dy = wPos.y + WALL_H / 2 - camPos.y;
      var dz = wPos.z - camPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 4) continue;
      var nx = dx / dist;
      var ny = dy / dist;
      var nz = dz / dist;
      var dot = dir.x * nx + dir.y * ny + dir.z * nz;
      if (dot > closestDot) {
        closestDot = dot;
        closest = wall;
      }
    }

    _updateInfoEl(closest);
  }

  /* ── keyboard / click handlers ───────────────────────────────────── */
  function _onKey(e) {
    if (e.code === 'F2') {
      e.preventDefault();
      if (window._placingFortification) {
        _confirmPlacement();
      } else {
        _enterPlacementMode();
      }
      return;
    }
    if (e.code === 'Escape' && window._placingFortification) {
      _exitPlacementMode();
    }
  }

  function _onClick(e) {
    if (!window._placingFortification) return;
    if (e.button !== 0) return;
    _confirmPlacement();
  }

  /* ── public API ─────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _deployed = [];
    window._fortificationCount = 0;
    window._maxFortifications  = MAX;
    window._placingFortification = false;

    _buildHud();
    _buildInfoEl();
    _updateHud();

    // register key/click handlers (once)
    if (!_keyHandler) {
      _keyHandler = _onKey;
      document.addEventListener('keydown', _keyHandler, false);
    }
    if (!_clickHandler) {
      _clickHandler = _onClick;
      document.addEventListener('mousedown', _clickHandler, false);
    }
  }

  function update(delta) {
    if (window._placingFortification) {
      _updateGhostPosition();
    }
    _checkLookAt();
  }

  function deploy(x, y, z, rotY) {
    return _deployWall(x, y, z, rotY || 0);
  }

  function damage(wall, amount) {
    _damageWall(wall, amount);
  }

  function getDeployed() {
    return _deployed;
  }

  function clear() {
    _exitPlacementMode();
    for (var i = _deployed.length - 1; i >= 0; i--) {
      _removeWall(_deployed[i]);
    }
    _deployed = [];
    window._fortificationCount = 0;
    _updateHud();
    if (_infoEl) _infoEl.style.display = 'none';
  }

  function reset() {
    clear();
  }

  return {
    init:        init,
    update:      update,
    deploy:      deploy,
    damage:      damage,
    getDeployed: getDeployed,
    clear:       clear,
    reset:       reset
  };

})();
