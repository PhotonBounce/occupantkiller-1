// ============================================================
//  bunker-assault.js — Browser-based Three.js bunker assault module
//  B+A keys to spawn bunker complex at target position (marked by click).
//  Defenders fire through embrasures, suppression, satchel charges,
//  flanking indicators, AI buddy assault, capture flag mechanic.
//  Public API: init(scene, camera, controls), update(dt), reset()
// ============================================================
window.BunkerAssault = (function () {
  'use strict';

  // ── Module state ────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _controls = null;

  // Target position (set by click)
  var _targetPos    = null;
  var _targetMarker = null;

  // Key state
  var _keyBDown = false;
  var _keyADown = false;

  // Active bunkers list
  var _bunkers = [];

  // Satchel charges in flight or fusing
  var _satchels = [];

  // Explosion particles
  var _explosionParticles = [];

  // Flanking indicators
  var _flankArrows = [];

  // AI flankers
  var _flankers = [];

  // Pending spawn flag (waiting for click)
  var _pendingSpawn = false;

  // Score
  var _score = 0;

  // HUD element
  var _hudEl = null;

  // ── Constants ───────────────────────────────────────────
  var BUNKER_HP          = 400;
  var SATCHEL_DAMAGE     = 300;
  var BULLET_DAMAGE      = 5;
  var BLAST_RADIUS       = 8;
  var FLANK_RANGE        = 20;
  var DEFENDER_FIRE_RATE = 2.0;
  var SUPPRESS_DURATION  = 3.0;
  var FUSE_DELAY         = 5.0;
  var DEBRIS_COUNT       = 15;

  // Colors
  var COLOR_BUNKER_BODY  = 0x5C5C3D;
  var COLOR_PYLON        = 0x4A4A30;
  var COLOR_SANDBAG      = 0xC2B280;
  var COLOR_DEFENDER     = 0x3A4A20;
  var COLOR_SATCHEL      = 0x8B6914;
  var COLOR_FLAG_CAPTURE = 0x3399FF;
  var COLOR_TRACER       = 0xFFFF00;
  var COLOR_FLANK_ARROW  = 0x00FF44;

  // ── HUD ─────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'ba-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:14px',
      'font-family:monospace',
      'font-size:12px',
      'color:#CCFF88',
      'background:rgba(0,0,0,0.6)',
      'border:1px solid #6A8A44',
      'padding:4px 10px',
      'border-radius:4px',
      'z-index:310',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_bunkers.length === 0) {
      _hudEl.style.display = 'none';
      return;
    }
    var lines = [];
    for (var i = 0; i < _bunkers.length; i++) {
      var bk = _bunkers[i];
      var total     = bk.defenders.length;
      var alive     = 0;
      var suppCount = 0;
      for (var d = 0; d < bk.defenders.length; d++) {
        if (!bk.defenders[d].dead) alive++;
        if (bk.defenders[d].suppressTimer > 0) suppCount++;
      }
      var suppStr = suppCount > 0 ? ' [SUPPRESSED:' + suppCount + ']' : '';
      lines.push(
        'BUNKER' + (i + 1) +
        ' [HP:' + Math.max(0, Math.round(bk.hp)) + '/' + BUNKER_HP + ']' +
        ' [DEFENDERS:' + alive + '/' + total + ']' +
        suppStr
      );
    }
    _hudEl.textContent = lines.join(' | ');
    _hudEl.style.display = 'block';
  }

  // ── Toast helper ────────────────────────────────────────
  function _toast(msg, dur, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg, dur || 2000, color || '#CCFF88');
        return;
      }
    } catch (e) {}
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed',
      'top:45%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:18px',
      'color:' + (color || '#CCFF88'),
      'background:rgba(0,0,0,0.75)',
      'padding:8px 20px',
      'border-radius:6px',
      'z-index:999',
      'pointer-events:none'
    ].join(';');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, dur || 2000);
  }

  // ── Target marker ────────────────────────────────────────
  function _spawnTargetMarker(pos) {
    if (_targetMarker && _scene) {
      _scene.remove(_targetMarker);
    }
    var geo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 0.7 });
    _targetMarker = new THREE.Mesh(geo, mat);
    _targetMarker.position.copy(pos);
    _targetMarker.position.y = 0.05;
    _scene.add(_targetMarker);
  }

  // ── Bunker construction ──────────────────────────────────
  function _buildBunker(pos) {
    var group = new THREE.Group();

    // Main body 8×3×6
    var bodyGeo = new THREE.BoxGeometry(8, 3, 6);
    var bodyMat = new THREE.MeshLambertMaterial({ color: COLOR_BUNKER_BODY });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.5, 0);
    group.add(body);

    // Reinforced corner pylons (1×4×1)
    var pylonMat = new THREE.MeshLambertMaterial({ color: COLOR_PYLON });
    var pylonOffsets = [
      [-4, 2, -3],
      [ 4, 2, -3],
      [-4, 2,  3],
      [ 4, 2,  3]
    ];
    for (var pi = 0; pi < pylonOffsets.length; pi++) {
      var pylonGeo = new THREE.BoxGeometry(1, 4, 1);
      var pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(pylonOffsets[pi][0], pylonOffsets[pi][1], pylonOffsets[pi][2]);
      group.add(pylon);
    }

    // Embrasure slots (3 gaps in front wall) — thin dark recesses
    var embrasureMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var embrasures = [];
    var embXPos = [-2.5, 0, 2.5];
    for (var ei = 0; ei < 3; ei++) {
      var eGeo = new THREE.BoxGeometry(0.8, 0.4, 0.3);
      var eMesh = new THREE.Mesh(eGeo, embrasureMat);
      eMesh.position.set(embXPos[ei], 1.2, -3.05);
      group.add(eMesh);
      embrasures.push(eMesh);
    }

    // Sandbag wall: 5 stacked cylinders in front
    var sandbagMat = new THREE.MeshLambertMaterial({ color: COLOR_SANDBAG });
    for (var si = 0; si < 5; si++) {
      var sbGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.45, 8);
      var sb = new THREE.Mesh(sbGeo, sandbagMat);
      sb.position.set((si - 2) * 1.2, 0.25, -4.5);
      sb.rotation.y = si * 0.4;
      group.add(sb);
    }

    // 3 defender NPC meshes inside bunker
    var defenders = [];
    var defXPos = [-2, 0, 2];
    for (var di = 0; di < 3; di++) {
      var defGroup = new THREE.Group();

      var dbGeo = new THREE.BoxGeometry(0.45, 0.65, 0.3);
      var dbMat = new THREE.MeshLambertMaterial({ color: COLOR_DEFENDER });
      var dbMesh = new THREE.Mesh(dbGeo, dbMat);
      dbMesh.position.y = 0.7;
      defGroup.add(dbMesh);

      var dhGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var dhMat = new THREE.MeshLambertMaterial({ color: 0x7A6248 });
      var dhMesh = new THREE.Mesh(dhGeo, dhMat);
      dhMesh.position.y = 1.2;
      defGroup.add(dhMesh);

      var helmGeo = new THREE.BoxGeometry(0.32, 0.18, 0.32);
      var helmMat = new THREE.MeshLambertMaterial({ color: 0x2A3A18 });
      var helmMesh = new THREE.Mesh(helmGeo, helmMat);
      helmMesh.position.y = 1.38;
      defGroup.add(helmMesh);

      defGroup.position.set(defXPos[di], 0, -2.0);
      group.add(defGroup);

      defenders.push({
        mesh:          defGroup,
        dead:          false,
        suppressTimer: 0,
        embrasureIndex: di,
        fireTimer:     0.5 + di * 0.6
      });
    }

    group.position.copy(pos);
    group.position.y = 0;
    _scene.add(group);

    var bk = {
      group:        group,
      hp:           BUNKER_HP,
      maxHp:        BUNKER_HP,
      defenders:    defenders,
      embrasures:   embrasures,
      captured:     false,
      flag:         null,
      flagAnim:     0,
      tracers:      [],
      debrisChunks: [],
      destroyed:    false,
      pos:          pos.clone()
    };

    _bunkers.push(bk);
    _updateHUD();
    _toast('BUNKER COMPLEX DEPLOYED — ASSAULT!', 2200, '#FF8844');
    return bk;
  }

  // ── Tracer fire ──────────────────────────────────────────
  function _spawnTracer(fromVec, toVec) {
    var geo = new THREE.BufferGeometry();
    var pts = new Float32Array([
      fromVec.x, fromVec.y, fromVec.z,
      toVec.x,   toVec.y,   toVec.z
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: COLOR_TRACER, transparent: true, opacity: 0.9 });
    var line = new THREE.LineSegments(geo, mat);
    _scene.add(line);
    return { mesh: line, mat: mat, life: 0.12 };
  }

  function _defenderFire(bk, defender, targetPos) {
    if (defender.dead || defender.suppressTimer > 0) return;
    var eWorld = new THREE.Vector3();
    bk.embrasures[defender.embrasureIndex].getWorldPosition(eWorld);
    var tracer = _spawnTracer(eWorld, targetPos);
    bk.tracers.push(tracer);
    try {
      if (window.Player && window.Player.takeDamage) window.Player.takeDamage(4);
    } catch (e) {}
  }

  // ── Flanking arrows ──────────────────────────────────────
  function _buildFlankArrow(bk, side) {
    var arrowGroup = new THREE.Group();

    var stemGeo = new THREE.BoxGeometry(0.2, 0.2, 2);
    var stemMat = new THREE.MeshBasicMaterial({ color: COLOR_FLANK_ARROW });
    var stem = new THREE.Mesh(stemGeo, stemMat);
    arrowGroup.add(stem);

    var headGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
    var headMat = new THREE.MeshBasicMaterial({ color: COLOR_FLANK_ARROW });
    var arrowHead = new THREE.Mesh(headGeo, headMat);
    arrowHead.rotation.x = Math.PI / 2;
    arrowHead.position.z = 1.4;
    arrowGroup.add(arrowHead);

    var offsetX = (side === 'left') ? -7 : 7;
    arrowGroup.position.set(bk.pos.x + offsetX, 2.0, bk.pos.z);
    arrowGroup.rotation.y = (side === 'left') ? -Math.PI / 2 : Math.PI / 2;
    arrowGroup.visible = false;
    _scene.add(arrowGroup);

    var labelEl = document.createElement('div');
    labelEl.style.cssText = [
      'position:fixed',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'color:#00FF44',
      'background:rgba(0,0,0,0.6)',
      'padding:2px 8px',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:320',
      'display:none'
    ].join(';');
    labelEl.textContent = (side === 'left') ? 'FLANK LEFT' : 'FLANK RIGHT';
    document.body.appendChild(labelEl);

    var fa = { group: arrowGroup, labelEl: labelEl, side: side, bunker: bk, visible: false };
    _flankArrows.push(fa);
    return fa;
  }

  function _updateFlankArrows(playerPos) {
    for (var i = _flankArrows.length - 1; i >= 0; i--) {
      var fa = _flankArrows[i];
      if (!fa || !fa.bunker) continue;

      if (fa.bunker.destroyed || fa.bunker.captured) {
        _scene.remove(fa.group);
        if (fa.labelEl && fa.labelEl.parentNode) fa.labelEl.parentNode.removeChild(fa.labelEl);
        _flankArrows.splice(i, 1);
        continue;
      }

      var dx = playerPos.x - fa.bunker.pos.x;
      var dz = playerPos.z - fa.bunker.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      var show = (dist < FLANK_RANGE);

      if (show !== fa.visible) {
        fa.visible = show;
        fa.group.visible = show;
        fa.labelEl.style.display = show ? 'block' : 'none';
      }

      if (show && _camera) {
        var wp = new THREE.Vector3();
        fa.group.getWorldPosition(wp);
        var proj = wp.clone().project(_camera);
        var sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
        var sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
        fa.labelEl.style.left = Math.round(sx) + 'px';
        fa.labelEl.style.top  = Math.round(sy - 28) + 'px';
      }
    }
  }

  // ── Satchel charge ───────────────────────────────────────
  function _throwSatchel(bk) {
    var pPos = _playerPos();
    var startPos = pPos.clone();
    startPos.y += 1.0;

    var endPos = bk.pos.clone();
    endPos.z -= 3.0;
    endPos.y = 0.5;

    var geo = new THREE.BoxGeometry(1, 0.5, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_SATCHEL, emissive: new THREE.Color(0x000000) });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    _scene.add(mesh);

    _satchels.push({
      mesh:         mesh,
      mat:          mat,
      targetBunker: bk,
      phase:        'arc',
      arcTime:      0,
      arcDur:       1.2,
      fuseTimer:    FUSE_DELAY,
      startPos:     startPos.clone(),
      endPos:       endPos.clone()
    });

    _toast('SATCHEL THROWN — 5s FUSE!', 1800, '#FF8800');
  }

  function _detonateSatchel(sc) {
    var pos = sc.endPos;
    var bk  = sc.targetBunker;

    bk.hp -= SATCHEL_DAMAGE;
    _spawnDebris(bk, pos);
    _spawnExplosionParticles(pos.x, pos.y + 0.5, pos.z);

    if (bk.hp <= 0) {
      _destroyBunker(bk);
    }

    _scene.remove(sc.mesh);

    _toast('SATCHEL DETONATED!', 2200, '#FF4400');

    for (var i = 0; i < bk.defenders.length; i++) {
      _killDefender(bk.defenders[i]);
    }

    _checkCapture(bk);
    _updateHUD();
  }

  // ── Debris ──────────────────────────────────────────────
  function _spawnDebris(bk, pos) {
    for (var i = 0; i < DEBRIS_COUNT; i++) {
      var sz = 0.2 + Math.random() * 0.5;
      var geo = new THREE.BoxGeometry(sz, sz, sz);
      var mat = new THREE.MeshLambertMaterial({ color: COLOR_BUNKER_BODY });
      var dMesh = new THREE.Mesh(geo, mat);
      dMesh.position.set(
        pos.x + (Math.random() - 0.5) * 8,
        pos.y + 0.5 + Math.random() * 3,
        pos.z + (Math.random() - 0.5) * 8
      );
      dMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      _scene.add(dMesh);
      bk.debrisChunks.push({
        mesh: dMesh,
        vel: {
          x: (Math.random() - 0.5) * 8,
          y: 3 + Math.random() * 6,
          z: (Math.random() - 0.5) * 8
        },
        life: 2.5 + Math.random()
      });
    }
  }

  // ── Explosion particles ──────────────────────────────────
  function _spawnExplosionParticles(x, y, z) {
    var colors = [0xFF6600, 0xFF2200, 0x886644, 0x555544, 0xFFAA00];
    for (var i = 0; i < 60; i++) {
      var geo = new THREE.SphereGeometry(0.12 + Math.random() * 0.2, 4, 4);
      var mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1.0
      });
      var pm = new THREE.Mesh(geo, mat);
      pm.position.set(x, y, z);
      _scene.add(pm);
      var angle = Math.random() * Math.PI * 2;
      var pitch = Math.random() * Math.PI * 0.7;
      var spd   = 3 + Math.random() * 10;
      var life  = 1.0 + Math.random() * 1.0;
      _explosionParticles.push({
        mesh:    pm,
        mat:     mat,
        vel:     {
          x: Math.cos(angle) * Math.cos(pitch) * spd,
          y: Math.sin(pitch) * spd,
          z: Math.sin(angle) * Math.cos(pitch) * spd
        },
        life:    life,
        maxLife: life
      });
    }
  }

  // ── Destroy bunker ───────────────────────────────────────
  function _destroyBunker(bk) {
    if (bk.destroyed) return;
    bk.destroyed = true;
    bk.hp = 0;
    bk.group.traverse(function (obj) {
      if (obj.isMesh && obj.material) {
        obj.material.transparent = true;
        obj.material.opacity = 0.0;
      }
    });
    _toast('BUNKER DESTROYED!', 2500, '#FF2200');
    _updateHUD();
  }

  // ── Defender kill ────────────────────────────────────────
  function _killDefender(defender) {
    if (defender.dead) return;
    defender.dead = true;
    if (defender.mesh) {
      defender.mesh.rotation.z = Math.PI / 2;
      defender.mesh.position.y -= 0.5;
    }
  }

  // ── Capture check ────────────────────────────────────────
  function _checkCapture(bk) {
    if (bk.captured) return;
    var allDead = true;
    for (var i = 0; i < bk.defenders.length; i++) {
      if (!bk.defenders[i].dead) { allDead = false; break; }
    }
    if (!allDead) return;

    bk.captured = true;
    _toast('BUNKER CAPTURED! +500', 3000, '#44FFAA');

    var flagGeo = new THREE.ConeGeometry(0.4, 1.5, 8);
    var flagMat = new THREE.MeshLambertMaterial({ color: COLOR_FLAG_CAPTURE });
    var flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(bk.pos.x, 3.5, bk.pos.z);
    _scene.add(flagMesh);
    bk.flag     = flagMesh;
    bk.flagAnim = 0;

    _score += 500;
    try {
      if (window.Score && window.Score.add) window.Score.add(500, 'BUNKER CAPTURED');
    } catch (e) {}

    _updateHUD();
  }

  // ── Suppress defender ─────────────────────────────────────
  function suppressDefender(bk, defenderIndex) {
    if (!bk || !bk.defenders[defenderIndex]) return;
    var def = bk.defenders[defenderIndex];
    if (def.dead) return;
    def.suppressTimer = SUPPRESS_DURATION;
    if (def.mesh) def.mesh.scale.y = 0.55;
    _updateHUD();
  }

  // ── Grenade through embrasure ─────────────────────────────
  function checkGrenadeEmbrasure(bk, grenadePos) {
    if (!bk || bk.destroyed || bk.captured) return false;
    for (var ei = 0; ei < bk.embrasures.length; ei++) {
      var eWorld = new THREE.Vector3();
      bk.embrasures[ei].getWorldPosition(eWorld);
      var dx = grenadePos.x - eWorld.x;
      var dz = grenadePos.z - eWorld.z;
      if (Math.abs(dx) < 1.5 && Math.abs(dz) < 1.5) {
        _toast('+BUNKER CLEAR +500', 2500, '#44FFFF');
        _score += 500;
        try {
          if (window.Score && window.Score.add) window.Score.add(500, 'BUNKER CLEAR');
        } catch (e) {}
        for (var d = 0; d < bk.defenders.length; d++) {
          _killDefender(bk.defenders[d]);
        }
        _checkCapture(bk);
        return true;
      }
    }
    return false;
  }

  // ── Damage bunker ─────────────────────────────────────────
  function damageBunker(bk, amount) {
    if (!bk || bk.destroyed) return;
    bk.hp -= amount;
    if (bk.hp <= 0) _destroyBunker(bk);
    _updateHUD();
  }

  // ── Smoke & assault (S key near bunker) ──────────────────
  function _triggerSmokeAssault(bk) {
    _toast('SMOKE AND ASSAULT — BUDDIES MOVING!', 2500, '#88FFCC');
    try {
      if (window.ChainOfCommand && window.ChainOfCommand.orderAttack) {
        window.ChainOfCommand.orderAttack(bk.pos);
        return;
      }
      if (window.AllySoldiers && window.AllySoldiers.orderAttack) {
        window.AllySoldiers.orderAttack(bk.pos);
        return;
      }
    } catch (e) {}
    _spawnFlankers(bk);
  }

  function _spawnFlankers(bk) {
    var pPos = _playerPos();
    var sides = [-5, 5];
    for (var i = 0; i < sides.length; i++) {
      var fGroup = new THREE.Group();
      var fGeo = new THREE.BoxGeometry(0.45, 0.65, 0.3);
      var fMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
      var fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.y = 0.35;
      fGroup.add(fMesh);
      fGroup.position.set(pPos.x + sides[i], 0, pPos.z);
      _scene.add(fGroup);
      _flankers.push({
        group:  fGroup,
        target: bk.pos.clone(),
        speed:  5,
        life:   6
      });
    }
  }

  // ── Nearest bunker within range ───────────────────────────
  function _nearestBunker(range) {
    var pPos = _playerPos();
    var best = null;
    var bestDist = range || 999;
    for (var i = 0; i < _bunkers.length; i++) {
      var bk = _bunkers[i];
      var dx = pPos.x - bk.pos.x;
      var dz = pPos.z - bk.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestDist) {
        bestDist = d;
        best = bk;
      }
    }
    return best;
  }

  // ── Player position ───────────────────────────────────────
  function _playerPos() {
    if (_controls && _controls.object && _controls.object.position) return _controls.object.position;
    if (_camera) return _camera.position;
    return new THREE.Vector3(0, 0, 0);
  }

  // ── Keyboard / mouse handlers ─────────────────────────────
  function _onKeyDown(e) {
    if (e.key === 'b' || e.key === 'B') {
      if (!e.shiftKey) {
        _keyBDown = true;
        if (_keyADown) {
          _pendingSpawn = true;
          _toast('CLICK TO PLACE BUNKER', 2000, '#CCFF88');
        }
      }
    }
    if (e.key === 'a' || e.key === 'A') {
      _keyADown = true;
      if (_keyBDown) {
        _pendingSpawn = true;
        _toast('CLICK TO PLACE BUNKER', 2000, '#CCFF88');
      }
    }

    // Shift+B: satchel charge
    if (e.shiftKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      var nb = _nearestBunker(80);
      if (nb && !nb.destroyed) {
        _throwSatchel(nb);
      } else {
        _toast('NO BUNKER IN RANGE FOR SATCHEL', 1500, '#FF8800');
      }
    }

    // S key near bunker: smoke and assault
    if (e.key === 's' || e.key === 'S') {
      var sb = _nearestBunker(12);
      if (sb && !sb.captured && !sb.destroyed) {
        _triggerSmokeAssault(sb);
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'b' || e.key === 'B') _keyBDown = false;
    if (e.key === 'a' || e.key === 'A') _keyADown = false;
  }

  function _onMouseDown(e) {
    if (!_pendingSpawn) return;
    if (e.button !== 0) return;
    _pendingSpawn = false;

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1)
    );
    raycaster.setFromCamera(mouse, _camera);
    var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var hitPos = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, hitPos);

    if (!hitPos || isNaN(hitPos.x)) {
      hitPos = _playerPos().clone();
      hitPos.x += 10;
    }

    _targetPos = hitPos.clone();
    _spawnTargetMarker(_targetPos);
    var bk = _buildBunker(_targetPos);
    _buildFlankArrow(bk, 'left');
    _buildFlankArrow(bk, 'right');
  }

  // ── Update ────────────────────────────────────────────────
  function update(dt) {
    if (!dt || isNaN(dt)) dt = 0.016;

    var pPos = _playerPos();

    // Bunker logic
    for (var bi = 0; bi < _bunkers.length; bi++) {
      var bk = _bunkers[bi];

      // Defenders
      for (var di = 0; di < bk.defenders.length; di++) {
        var def = bk.defenders[di];
        if (def.dead) continue;

        if (def.suppressTimer > 0) {
          def.suppressTimer -= dt;
          if (def.suppressTimer <= 0) {
            def.suppressTimer = 0;
            if (def.mesh) def.mesh.scale.y = 1.0;
          }
          continue;
        }

        if (!bk.destroyed) {
          def.fireTimer -= dt;
          if (def.fireTimer <= 0) {
            def.fireTimer = DEFENDER_FIRE_RATE;
            _defenderFire(bk, def, pPos);
          }
        }
      }

      // Tracers
      for (var ti = bk.tracers.length - 1; ti >= 0; ti--) {
        var tr = bk.tracers[ti];
        tr.life -= dt;
        if (tr.life <= 0) {
          _scene.remove(tr.mesh);
          bk.tracers.splice(ti, 1);
        } else {
          tr.mat.opacity = tr.life / 0.12;
        }
      }

      // Flag raise animation
      if (bk.captured && bk.flag && bk.flagAnim < 1.0) {
        bk.flagAnim = Math.min(1.0, bk.flagAnim + dt);
        bk.flag.position.y = 3.5 + bk.flagAnim * 2.0;
        bk.flag.rotation.y += dt * 2;
      }

      // Debris physics
      for (var dbi = bk.debrisChunks.length - 1; dbi >= 0; dbi--) {
        var db = bk.debrisChunks[dbi];
        db.life -= dt;
        if (db.life <= 0) {
          _scene.remove(db.mesh);
          bk.debrisChunks.splice(dbi, 1);
          continue;
        }
        db.vel.y -= 9.8 * dt;
        db.mesh.position.x += db.vel.x * dt;
        db.mesh.position.y += db.vel.y * dt;
        db.mesh.position.z += db.vel.z * dt;
        if (db.mesh.position.y < 0) {
          db.mesh.position.y = 0;
          db.vel.y *= -0.3;
          db.vel.x *= 0.8;
          db.vel.z *= 0.8;
        }
        db.mesh.rotation.x += db.vel.x * dt * 0.5;
        db.mesh.rotation.z += db.vel.z * dt * 0.5;
      }
    }

    // Satchels
    for (var si = _satchels.length - 1; si >= 0; si--) {
      var sc = _satchels[si];

      if (sc.phase === 'arc') {
        sc.arcTime += dt;
        var t = sc.arcTime / sc.arcDur;
        if (t >= 1.0) {
          sc.mesh.position.copy(sc.endPos);
          sc.phase = 'fuse';
        } else {
          var ix = sc.startPos.x + (sc.endPos.x - sc.startPos.x) * t;
          var iz = sc.startPos.z + (sc.endPos.z - sc.startPos.z) * t;
          var iy = sc.startPos.y + (sc.endPos.y - sc.startPos.y) * t + 4 * Math.sin(t * Math.PI);
          sc.mesh.position.set(ix, iy, iz);
          sc.mesh.rotation.x += dt * 4;
        }
      } else if (sc.phase === 'fuse') {
        sc.fuseTimer -= dt;
        if (Math.floor(sc.fuseTimer * 4) % 2 === 0) {
          sc.mat.emissive.setHex(0xFF4400);
        } else {
          sc.mat.emissive.setHex(0x000000);
        }
        if (sc.fuseTimer <= 0) {
          _detonateSatchel(sc);
          _satchels.splice(si, 1);
        }
      }
    }

    // Explosion particles
    for (var epi = _explosionParticles.length - 1; epi >= 0; epi--) {
      var ep = _explosionParticles[epi];
      ep.life -= dt;
      if (ep.life <= 0) {
        _scene.remove(ep.mesh);
        _explosionParticles.splice(epi, 1);
        continue;
      }
      ep.vel.y -= 9.8 * dt;
      ep.mesh.position.x += ep.vel.x * dt;
      ep.mesh.position.y += ep.vel.y * dt;
      ep.mesh.position.z += ep.vel.z * dt;
      ep.mat.opacity = ep.life / ep.maxLife;
    }

    // Flankers
    for (var fi = _flankers.length - 1; fi >= 0; fi--) {
      var fl = _flankers[fi];
      fl.life -= dt;
      if (fl.life <= 0) {
        _scene.remove(fl.group);
        _flankers.splice(fi, 1);
        continue;
      }
      var fdx = fl.target.x - fl.group.position.x;
      var fdz = fl.target.z - fl.group.position.z;
      var fd  = Math.sqrt(fdx * fdx + fdz * fdz);
      if (fd > 0.5) {
        fl.group.position.x += (fdx / fd) * fl.speed * dt;
        fl.group.position.z += (fdz / fd) * fl.speed * dt;
      }
    }

    // Flanking indicators
    _updateFlankArrows(pPos);

    // HUD
    _updateHUD();
  }

  // ── Reset ─────────────────────────────────────────────────
  function reset() {
    var bi, ti, dbi, fai, fi, epi;

    for (bi = 0; bi < _bunkers.length; bi++) {
      var bk = _bunkers[bi];
      if (_scene) {
        _scene.remove(bk.group);
        for (ti = 0; ti < bk.tracers.length; ti++) _scene.remove(bk.tracers[ti].mesh);
        for (dbi = 0; dbi < bk.debrisChunks.length; dbi++) _scene.remove(bk.debrisChunks[dbi].mesh);
        if (bk.flag) _scene.remove(bk.flag);
      }
    }
    _bunkers.length = 0;

    for (var si = 0; si < _satchels.length; si++) {
      if (_scene) _scene.remove(_satchels[si].mesh);
    }
    _satchels.length = 0;

    for (epi = 0; epi < _explosionParticles.length; epi++) {
      if (_scene) _scene.remove(_explosionParticles[epi].mesh);
    }
    _explosionParticles.length = 0;

    for (fai = 0; fai < _flankArrows.length; fai++) {
      var fa = _flankArrows[fai];
      if (_scene) _scene.remove(fa.group);
      if (fa.labelEl && fa.labelEl.parentNode) fa.labelEl.parentNode.removeChild(fa.labelEl);
    }
    _flankArrows.length = 0;

    for (fi = 0; fi < _flankers.length; fi++) {
      if (_scene) _scene.remove(_flankers[fi].group);
    }
    _flankers.length = 0;

    if (_targetMarker && _scene) {
      _scene.remove(_targetMarker);
      _targetMarker = null;
    }

    _keyBDown     = false;
    _keyADown     = false;
    _pendingSpawn = false;
    _score        = 0;

    _updateHUD();
  }

  // ── Init ──────────────────────────────────────────────────
  function init(scene, camera, controls) {
    _scene    = scene;
    _camera   = camera;
    _controls = controls;

    _bunkers.length            = 0;
    _satchels.length           = 0;
    _explosionParticles.length = 0;
    _flankArrows.length        = 0;
    _flankers.length           = 0;
    _keyBDown     = false;
    _keyADown     = false;
    _pendingSpawn = false;
    _score        = 0;

    _createHUD();

    document.removeEventListener('keydown',   _onKeyDown);
    document.removeEventListener('keyup',     _onKeyUp);
    document.removeEventListener('mousedown', _onMouseDown);
    document.addEventListener('keydown',   _onKeyDown);
    document.addEventListener('keyup',     _onKeyUp);
    document.addEventListener('mousedown', _onMouseDown);
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    init:                  init,
    update:                update,
    reset:                 reset,
    damageBunker:          damageBunker,
    suppressDefender:      suppressDefender,
    checkGrenadeEmbrasure: checkGrenadeEmbrasure,
    getBunkers:            function () { return _bunkers; }
  };

})();
