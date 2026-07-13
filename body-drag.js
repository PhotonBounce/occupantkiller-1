// ============================================================
//  body-drag.js — FPS body-drag system for Three.js combat game
//
//  Drag wounded allies and enemy corpses for tactical advantage.
//
//  Public API:
//    BodyDrag.init(scene, camera)
//    BodyDrag.update(delta)
//    BodyDrag.startDrag(entityMesh)
//    BodyDrag.stopDrag()
//    BodyDrag.isDragging()
//    BodyDrag.reset()
// ============================================================
window.BodyDrag = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  var GRAB_RADIUS         = 2.0;     // units — E key proximity
  var DRAG_BEHIND_OFFSET  = 1.5;     // units behind player
  var LERP_SPEED          = 8.0;     // drag smoothing
  var SPEED_PENALTY       = 0.70;    // 30% slower while dragging
  var WOUNDED_HP_THRESH   = 15;      // ally HP threshold for draggable
  var ENEMY_DETECT_DELAY  = 15;      // seconds added to enemy detection
  var DISTRACT_DURATION   = 20;      // seconds enemies are distracted
  var DISTRACT_RANGE_MULT = 0.5;     // detection range multiplier while distracted
  var COVER_BUFFER_HP     = 50;      // HP added to cover object near placed corpse
  var COVER_RANGE         = 3.0;     // units — "behind cover" check radius
  var BUILDING_RANGE      = 5.0;     // units — "inside building" check radius
  var MEDIC_HEAL_MULT     = 2.0;     // heal rate multiplier for medic badge drag
  var MEDIC_TENT_RANGE    = 4.0;     // units — range to trigger medic tent bonus
  var DUST_INTERVAL       = 0.12;    // seconds between dust particle emits
  var BLOOD_INTERVAL      = 0.5;     // seconds between blood drops
  var PARTICLE_LIFE       = 1.8;     // seconds a dust particle lives
  var BLOOD_LIFE          = 8.0;     // seconds a blood drop lives
  var HUD_UPDATE_INTERVAL = 0.15;    // seconds between HUD label refreshes

  // ── State ──────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;

  var _dragTarget   = null;   // currently dragged mesh (entity)
  var _dragging     = false;

  // entity metadata stored on mesh via ._bodyDragMeta
  // { type:'enemy'|'ally', name:str, hp:number, isWounded:bool }

  // Particle lists — {mesh, elapsed, duration, vx, vy, vz}
  var _dustParticles  = [];
  var _bloodDrops     = [];

  // Timers
  var _dustTimer      = 0;
  var _bloodTimer     = 0;
  var _hudTimer       = 0;
  var _borderPulse    = 0;

  // Key tracking
  var _eDown          = false;
  var _ePrev          = false;

  // Distracted enemies list — [{enemy, timer}]
  var _distractedEnemies = [];

  // DOM
  var _hudDragEl      = null;  // "DRAGGING [E to drop] [cannot fire]" overlay
  var _hudInfoEl      = null;  // entity name + HP + distance info bar
  var _borderEl       = null;  // pulsing red border

  // ── Init ───────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene  || (window.GameManager && window.GameManager.scene)  || null;
    _camera = camera || (window.GameManager && window.GameManager.camera) || null;
    _buildDOM();
    _listenKeys();
    window._bodyDragActive     = false;
    window._bodyDragSpeedMult  = 1.0;
    window._bodyDragWeaponLock = false;
  }

  // ── DOM ────────────────────────────────────────────────────

  function _buildDOM() {
    if (_hudDragEl) return;

    // "DRAGGING" controls reminder
    _hudDragEl = document.createElement('div');
    _hudDragEl.id = 'bd-drag-hud';
    _hudDragEl.style.cssText = [
      'position:fixed',
      'top:22px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff3c3c',
      'font-size:15px',
      'font-weight:bold',
      'font-family:monospace',
      'letter-spacing:2px',
      'pointer-events:none',
      'z-index:9999',
      'background:rgba(0,0,0,0.55)',
      'padding:5px 14px',
      'border-radius:4px',
      'display:none',
      'text-shadow:0 0 6px #ff0000'
    ].join(';');
    _hudDragEl.textContent = 'DRAGGING  [E] DROP  [cannot fire]';
    document.body.appendChild(_hudDragEl);

    // Entity info bar (name / HP / distance to cover or tent)
    _hudInfoEl = document.createElement('div');
    _hudInfoEl.id = 'bd-info-hud';
    _hudInfoEl.style.cssText = [
      'position:fixed',
      'top:56px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#e8e8e8',
      'font-size:13px',
      'font-family:monospace',
      'pointer-events:none',
      'z-index:9999',
      'background:rgba(0,0,0,0.45)',
      'padding:4px 12px',
      'border-radius:4px',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudInfoEl);

    // Pulsing red screen border
    _borderEl = document.createElement('div');
    _borderEl.id = 'bd-border';
    _borderEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9998',
      'display:none'
    ].join(';');
    document.body.appendChild(_borderEl);
  }

  function _showDragUI(on) {
    if (!_hudDragEl) _buildDOM();
    _hudDragEl.style.display = on ? 'block' : 'none';
    _hudInfoEl.style.display = on ? 'block' : 'none';
    _borderEl.style.display  = on ? 'block' : 'none';
    if (!on) { _borderPulse = 0; _borderEl.style.boxShadow = ''; }
  }

  function _updateBorderPulse(dt) {
    if (!_borderEl || _borderEl.style.display === 'none') return;
    _borderPulse += dt;
    var a = 0.25 + 0.25 * Math.sin(_borderPulse * 2.5);
    _borderEl.style.boxShadow = 'inset 0 0 0 5px rgba(255,0,0,' + a + ')';
  }

  function _showPrompt(text) {
    var el = document.getElementById('bd-prompt');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bd-prompt';
      el.style.cssText = [
        'position:fixed',
        'bottom:130px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#ffffff',
        'font-size:14px',
        'font-family:monospace',
        'background:rgba(0,0,0,0.55)',
        'padding:5px 16px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'display:none'
      ].join(';');
      document.body.appendChild(el);
    }
    if (text) {
      el.textContent = text;
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }

  function _toast(text, color, dur) {
    var el = document.createElement('div');
    el.textContent = text;
    var c = color || '#ffffff';
    el.style.cssText = [
      'position:fixed',
      'top:45%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:' + c,
      'font-size:20px',
      'font-weight:bold',
      'font-family:monospace',
      'letter-spacing:2px',
      'pointer-events:none',
      'z-index:10000',
      'text-shadow:0 0 10px ' + c,
      'background:rgba(0,0,0,0.45)',
      'padding:6px 18px',
      'border-radius:6px'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, (dur || 2.5) * 1000);
  }

  // ── Key listener ───────────────────────────────────────────

  function _listenKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyE' && !e.repeat) _eDown = true;
    });
    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyE') _eDown = false;
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _getPlayerPos() {
    if (_camera) return _camera.position;
    return new THREE.Vector3();
  }

  function _getPlayerForward() {
    if (!_camera) return new THREE.Vector3(0, 0, -1);
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    fwd.y = 0;
    if (fwd.lengthSq() < 0.0001) fwd.set(0, 0, -1);
    fwd.normalize();
    return fwd;
  }

  // Find nearest draggable entity within GRAB_RADIUS
  function _findNearestDraggable(playerPos) {
    var best     = null;
    var bestDist = GRAB_RADIUS;

    // Dead enemies — registered on window._deadEnemies or flagged meshes
    var deadEnemies = _getDeadEnemies();
    for (var i = 0; i < deadEnemies.length; i++) {
      var de = deadEnemies[i];
      if (!de || !de.parent) continue;
      var d = _dist2D(playerPos, de.position);
      if (d < bestDist) { bestDist = d; best = de; }
    }

    // Wounded allies from SquadTactics
    var woundedAllies = _getWoundedAllies();
    for (var j = 0; j < woundedAllies.length; j++) {
      var wa = woundedAllies[j];
      if (!wa || !wa.parent) continue;
      var da = _dist2D(playerPos, wa.position);
      if (da < bestDist) { bestDist = da; best = wa; }
    }

    return best;
  }

  function _getDeadEnemies() {
    // Support multiple integration patterns
    if (window._deadBodies && Array.isArray(window._deadBodies)) {
      return window._deadBodies;
    }
    if (window.Enemies && typeof window.Enemies.getDead === 'function') {
      return window.Enemies.getDead();
    }
    if (window._enemies && Array.isArray(window._enemies)) {
      var out = [];
      for (var i = 0; i < window._enemies.length; i++) {
        var e = window._enemies[i];
        if (e && e._isDead) out.push(e.mesh || e);
      }
      return out;
    }
    return [];
  }

  function _getWoundedAllies() {
    if (!window.SquadTactics || !window.SquadTactics.getSquad) return [];
    var squad = window.SquadTactics.getSquad();
    if (!squad || !Array.isArray(squad)) return [];
    var out = [];
    for (var i = 0; i < squad.length; i++) {
      var m = squad[i];
      if (!m) continue;
      var hp = (m._hp !== undefined) ? m._hp : (m.hp !== undefined ? m.hp : 100);
      if (hp < WOUNDED_HP_THRESH && hp > 0) {
        var mesh = m.mesh || m;
        // Tag metadata
        if (!mesh._bodyDragMeta) {
          mesh._bodyDragMeta = {
            type: 'ally',
            name: m.name || m._name || 'ALLY',
            hp: hp,
            isWounded: true,
            squadRef: m
          };
        } else {
          mesh._bodyDragMeta.hp = hp;
        }
        out.push(mesh);
      }
    }
    return out;
  }

  function _ensureMeta(mesh) {
    if (mesh._bodyDragMeta) return;
    // Try to infer from mesh flags
    var isEnemy = mesh._isEnemy || mesh._isDead || mesh._enemyDead || false;
    mesh._bodyDragMeta = {
      type: isEnemy ? 'enemy' : 'ally',
      name: mesh._name || mesh.name || (isEnemy ? 'ENEMY' : 'ALLY'),
      hp: mesh._hp || 0,
      isWounded: !isEnemy
    };
  }

  // ── Nearest cover / medic tent ─────────────────────────────

  function _nearestCoverDist(pos) {
    // Sandbags, wrecks, walls registered on global arrays
    var covers = (window._coverObjects || window._sandbags || window._wreckPositions || []);
    var best = Infinity;
    for (var i = 0; i < covers.length; i++) {
      var c = covers[i];
      var cpos = (c && c.position) ? c.position : c;
      if (!cpos) continue;
      var d = _dist2D(pos, cpos);
      if (d < best) best = d;
    }
    return best === Infinity ? -1 : best;
  }

  function _nearestMedicTentDist(pos) {
    var tents = _getMedicTents();
    var best = Infinity;
    for (var i = 0; i < tents.length; i++) {
      var t = tents[i];
      var tpos = (t && t.position) ? t.position : t;
      if (!tpos) continue;
      var d = _dist2D(pos, tpos);
      if (d < best) best = d;
    }
    return best === Infinity ? -1 : best;
  }

  function _getMedicTents() {
    if (window.MedicStation && window.MedicStation.getTents) {
      return window.MedicStation.getTents();
    }
    if (window._medicTents && Array.isArray(window._medicTents)) {
      return window._medicTents;
    }
    return [];
  }

  function _isNearCover(pos) {
    var d = _nearestCoverDist(pos);
    return d >= 0 && d <= COVER_RANGE;
  }

  function _isInsideBuilding(pos) {
    var buildings = window._buildingBounds || window._buildings || [];
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      if (!b) continue;
      // Support AABB {min, max} or position+range
      if (b.min && b.max) {
        if (pos.x >= b.min.x && pos.x <= b.max.x &&
            pos.z >= b.min.z && pos.z <= b.max.z) return true;
      } else if (b.position) {
        if (_dist2D(pos, b.position) <= BUILDING_RANGE) return true;
      }
    }
    return false;
  }

  function _isNearMedicTent(pos) {
    var d = _nearestMedicTentDist(pos);
    return d >= 0 && d <= MEDIC_TENT_RANGE;
  }

  function _playerHasMedicBadge() {
    if (window._playerMedicBadge) return true;
    if (window.Player && window.Player.hasPerk && window.Player.hasPerk('medic')) return true;
    if (window._playerPerks && window._playerPerks.indexOf('medic') !== -1) return true;
    return false;
  }

  // ── Particles ──────────────────────────────────────────────

  function _spawnDust(pos) {
    if (!_scene) return;
    for (var i = 0; i < 2; i++) {
      var geo = new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 4, 4);
      var mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xb8a070 : 0x9a8060,
        transparent: true,
        opacity: 0.75
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.4,
        pos.y + 0.05,
        pos.z + (Math.random() - 0.5) * 0.4
      );
      _scene.add(mesh);
      _dustParticles.push({
        mesh:     mesh,
        elapsed:  0,
        duration: PARTICLE_LIFE * (0.7 + Math.random() * 0.6),
        vx:       (Math.random() - 0.5) * 0.3,
        vy:       0.08 + Math.random() * 0.12,
        vz:       (Math.random() - 0.5) * 0.3
      });
    }
  }

  function _spawnBloodDrop(pos) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0x8b0000, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.2,
      pos.y + 0.02,
      pos.z + (Math.random() - 0.5) * 0.2
    );
    _scene.add(mesh);
    _bloodDrops.push({ mesh: mesh, elapsed: 0, duration: BLOOD_LIFE });
  }

  function _updateParticles(dt) {
    var i, p;

    // Dust
    for (i = _dustParticles.length - 1; i >= 0; i--) {
      p = _dustParticles[i];
      p.elapsed += dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 0.4 * dt;
      p.mesh.material.opacity = 0.75 * (1 - p.elapsed / p.duration);
      if (p.elapsed >= p.duration) {
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _dustParticles.splice(i, 1);
      }
    }

    // Blood drops
    for (i = _bloodDrops.length - 1; i >= 0; i--) {
      p = _bloodDrops[i];
      p.elapsed += dt;
      var fade = 1 - Math.max(0, (p.elapsed - p.duration * 0.7) / (p.duration * 0.3));
      p.mesh.material.opacity = 0.9 * fade;
      if (p.elapsed >= p.duration) {
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _bloodDrops.splice(i, 1);
      }
    }
  }

  // ── Tactical consequences ───────────────────────────────────

  function _applyEnemyMissingDelay(bodyMesh) {
    // Notify enemy patrol system
    if (typeof window._onBodyMissing === 'function') {
      window._onBodyMissing(bodyMesh, ENEMY_DETECT_DELAY);
    }
    if (window.Enemies && typeof window.Enemies.addDetectionDelay === 'function') {
      window.Enemies.addDetectionDelay(ENEMY_DETECT_DELAY);
    }
  }

  function _applyBodyCover(bodyMesh) {
    // Drag enemy behind sandbag wall → +50 HP buffer to that cover
    var covers = window._coverObjects || window._sandbags || [];
    var pos = bodyMesh.position;
    for (var i = 0; i < covers.length; i++) {
      var c = covers[i];
      var cpos = (c && c.position) ? c.position : c;
      if (!cpos) continue;
      if (_dist2D(pos, cpos) <= COVER_RANGE) {
        if (c._coverHP !== undefined) {
          c._coverHP += COVER_BUFFER_HP;
        } else {
          c._coverHP = COVER_BUFFER_HP;
        }
        _toast('COVER REINFORCED  +' + COVER_BUFFER_HP + ' HP', '#ffcc00', 2);
        break;
      }
    }
  }

  function _applyEvidenceRemoval(bodyMesh) {
    // Remove awareness trigger in area
    if (typeof window._removeAwarenessTrigger === 'function') {
      window._removeAwarenessTrigger(bodyMesh.position.clone());
    }
    _toast('EVIDENCE REMOVED', '#00eeff', 2);
  }

  function _distractNearbyEnemies(centerPos) {
    var enemies = (window._enemies) ? window._enemies : [];
    if (window.Enemies && window.Enemies.getAll) enemies = window.Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en) continue;
      var epos = (en.mesh && en.mesh.position) ? en.mesh.position : en.position;
      if (!epos) continue;
      if (_dist2D(centerPos, epos) <= 20) {
        _distractedEnemies.push({ enemy: en, timer: DISTRACT_DURATION });
        // Signal lower detection range
        if (en._detectionRangeMult !== undefined) {
          en._detectionRangeMult = DISTRACT_RANGE_MULT;
        }
      }
    }
  }

  function _updateDistractions(dt) {
    for (var i = _distractedEnemies.length - 1; i >= 0; i--) {
      var d = _distractedEnemies[i];
      d.timer -= dt;
      if (d.timer <= 0) {
        // Restore detection range
        if (d.enemy && d.enemy._detectionRangeMult !== undefined) {
          d.enemy._detectionRangeMult = 1.0;
        }
        _distractedEnemies.splice(i, 1);
      }
    }
  }

  function _applyMedicTentBonus(meta) {
    if (!meta || meta.type !== 'ally' || !meta.squadRef) return;
    var isMedic  = _playerHasMedicBadge();
    var rate     = isMedic ? MEDIC_HEAL_MULT : 1.0;
    var ref      = meta.squadRef;

    if (ref._healRateMult !== undefined) {
      ref._healRateMult = rate;
    }
    if (typeof window._onAllyAtMedicTent === 'function') {
      window._onAllyAtMedicTent(ref, rate);
    }
    var msg = isMedic
      ? 'MEDIC DRAG BONUS  2x HEAL RATE'
      : 'ALLY AT TENT  HEALING BOOSTED';
    _toast(msg, '#44ff88', 2.5);
  }

  // ── HUD info bar update ────────────────────────────────────

  function _updateInfoHUD() {
    if (!_dragging || !_dragTarget) return;
    _ensureMeta(_dragTarget);
    var meta     = _dragTarget._bodyDragMeta;
    var name     = meta.name || 'UNKNOWN';
    var hp       = meta.hp !== undefined ? meta.hp : '?';
    var pos      = _dragTarget.position;

    var coverD   = _nearestCoverDist(pos);
    var tentD    = _nearestMedicTentDist(pos);
    var coverStr = coverD >= 0 ? Math.round(coverD) + 'm to cover' : 'no cover';
    var tentStr  = tentD  >= 0 ? Math.round(tentD)  + 'm to tent'  : 'no tent';

    _hudInfoEl.textContent = name + '  HP:' + hp + '   ' + coverStr + '  /  ' + tentStr;
  }

  // ── startDrag / stopDrag ───────────────────────────────────

  function startDrag(entityMesh) {
    if (_dragging) stopDrag();
    if (!entityMesh) return;
    _ensureMeta(entityMesh);

    _dragTarget = entityMesh;
    _dragging   = true;

    window._bodyDragActive     = true;
    window._bodyDragSpeedMult  = SPEED_PENALTY;
    window._bodyDragWeaponLock = true;

    _showDragUI(true);
    _updateInfoHUD();
    _showPrompt(null);
  }

  function stopDrag() {
    if (!_dragging || !_dragTarget) {
      _dragging   = false;
      _dragTarget = null;
      _resetGlobals();
      _showDragUI(false);
      _showPrompt(null);
      return;
    }

    var body    = _dragTarget;
    var droppedPos = body.position.clone();
    var meta    = body._bodyDragMeta || {};

    _dragTarget = null;
    _dragging   = false;
    _resetGlobals();
    _showDragUI(false);
    _showPrompt(null);
    _dustTimer  = 0;
    _bloodTimer = 0;

    // Tactical consequences on drop
    if (meta.type === 'enemy') {
      _applyEnemyMissingDelay(body);
      _distractNearbyEnemies(droppedPos);

      if (_isNearCover(droppedPos)) {
        _applyBodyCover(body);
      }
      if (_isInsideBuilding(droppedPos)) {
        _applyEvidenceRemoval(body);
      }
      // Enemies far from patrol notice comrade missing
      if (droppedPos.distanceTo && _getPlayerPos().distanceTo(droppedPos) > 15) {
        _toast('COMRADE HIDDEN — PATROL DISTRACTED', '#ffaa00', 2.5);
      }
    } else if (meta.type === 'ally') {
      if (_isNearMedicTent(droppedPos)) {
        _applyMedicTentBonus(meta);
      }
    }
  }

  function isDragging() {
    return _dragging;
  }

  function _resetGlobals() {
    window._bodyDragActive     = false;
    window._bodyDragSpeedMult  = 1.0;
    window._bodyDragWeaponLock = false;
  }

  // ── Update ─────────────────────────────────────────────────

  function update(delta) {
    if (!_scene && window.GameManager) _scene  = window.GameManager.scene;
    if (!_camera && window.GameManager) _camera = window.GameManager.camera;

    var dt = delta || 0.016;

    _updateDistractions(dt);
    _updateParticles(dt);
    _updateBorderPulse(dt);

    var playerPos = _getPlayerPos();
    var ePressed  = _eDown && !_ePrev;   // rising edge
    _ePrev = _eDown;

    if (_dragging && _dragTarget) {
      // ── While dragging ────────────────────────────────────

      // Move dragged body to target position (lerp)
      var fwd    = _getPlayerForward();
      var targetX = playerPos.x - fwd.x * DRAG_BEHIND_OFFSET;
      var targetZ = playerPos.z - fwd.z * DRAG_BEHIND_OFFSET;
      var t = Math.min(1, LERP_SPEED * dt);

      _dragTarget.position.x += (targetX - _dragTarget.position.x) * t;
      _dragTarget.position.z += (targetZ - _dragTarget.position.z) * t;
      // Keep on ground (y of player feet ~= camera.y - eyeHeight)
      _dragTarget.position.y = playerPos.y - 1.6 + 0.2;

      // Lay body flat (rotate to horizontal)
      _dragTarget.rotation.x = Math.PI / 2;

      // Dust trail
      _dustTimer += dt;
      if (_dustTimer >= DUST_INTERVAL) {
        _dustTimer = 0;
        _spawnDust(_dragTarget.position);
      }

      // Blood trail (wounded ally or any body)
      var meta = _dragTarget._bodyDragMeta || {};
      if (meta.isWounded || meta.type === 'enemy') {
        _bloodTimer += dt;
        if (_bloodTimer >= BLOOD_INTERVAL) {
          _bloodTimer = 0;
          _spawnBloodDrop(_dragTarget.position);
        }
      }

      // HUD refresh
      _hudTimer += dt;
      if (_hudTimer >= HUD_UPDATE_INTERVAL) {
        _hudTimer = 0;
        _updateInfoHUD();
      }

      // E pressed again → drop
      if (ePressed) {
        stopDrag();
        return;
      }

    } else {
      // ── Not dragging: scan for nearby entity ──────────────
      var nearest = _findNearestDraggable(playerPos);

      if (nearest) {
        _ensureMeta(nearest);
        var nm = nearest._bodyDragMeta || {};
        var label = nm.type === 'ally'
          ? '[E] Drag Wounded Ally'
          : '[E] Drag Enemy Corpse';
        _showPrompt(label);

        if (ePressed) {
          startDrag(nearest);
        }
      } else {
        _showPrompt(null);
      }
    }
  }

  // ── reset ──────────────────────────────────────────────────

  function reset() {
    if (_dragging) {
      _dragTarget = null;
      _dragging   = false;
    }
    _resetGlobals();
    _showDragUI(false);
    _showPrompt(null);

    // Clear particles
    var i, p;
    for (i = _dustParticles.length - 1; i >= 0; i--) {
      p = _dustParticles[i];
      if (_scene) _scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    _dustParticles = [];
    for (i = _bloodDrops.length - 1; i >= 0; i--) {
      p = _bloodDrops[i];
      if (_scene) _scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    _bloodDrops = [];

    // Restore any distracted enemies
    for (i = 0; i < _distractedEnemies.length; i++) {
      var d = _distractedEnemies[i];
      if (d.enemy && d.enemy._detectionRangeMult !== undefined) {
        d.enemy._detectionRangeMult = 1.0;
      }
    }
    _distractedEnemies = [];

    _dustTimer  = 0;
    _bloodTimer = 0;
    _hudTimer   = 0;
    _borderPulse = 0;
    _eDown      = false;
    _ePrev      = false;
  }

  // ── Public API ─────────────────────────────────────────────

  return {
    init:      init,
    update:    update,
    startDrag: startDrag,
    stopDrag:  stopDrag,
    isDragging: isDragging,
    reset:     reset
  };

})();
