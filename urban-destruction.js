/* ════════════════════════════════════════════════════════════════════════
 *  URBAN-DESTRUCTION.JS — Dynamic building destruction & rubble physics
 *
 *  Public API:
 *    UrbanDestruction.init(scene, camera)
 *    UrbanDestruction.update(delta)
 *    UrbanDestruction.registerBuilding(mesh, hp)
 *    UrbanDestruction.damageBuilding(uuid, amount)
 *    UrbanDestruction.reset()
 * ════════════════════════════════════════════════════════════════════════ */
window.UrbanDestruction = (function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _player   = null;   // optional external player ref (set via init options)

  // Map of uuid -> BuildingRecord
  var _buildings = {};

  // Active animations
  var _collapseAnims  = [];  // { record, elapsed }
  var _rubbleChunks   = [];  // { mesh, vx, vy, vz, landed, elapsed }
  var _dustParticles  = [];  // { mesh, vx, vy, vz, elapsed, life }
  var _smokeParticles = [];  // { mesh, elapsed, life, bRecord }
  var _shakeTimer     = 0;   // seconds remaining
  var _shakeOrigin    = null;

  // Cascade tracking
  var _recentCollapses = []; // { position, time }

  // HUD flash
  var _hudFlashEl    = null;
  var _hudFlashTimer = 0;

  /* ── Constants ──────────────────────────────────────────────────────── */
  var DAMAGE_STATE_INTACT   = 0;  // 100–60%
  var DAMAGE_STATE_DAMAGED  = 1;  // 60–30%
  var DAMAGE_STATE_CRITICAL = 2;  // 30–0%

  var COLLAPSE_DURATION     = 1.5;   // seconds
  var DUST_LIFE             = 3.0;   // seconds
  var SMOKE_LIFE            = 4.0;   // seconds
  var SHAKE_DURATION        = 0.5;   // seconds
  var SHAKE_RADIUS          = 20;    // units
  var SHAKE_AMOUNT          = 0.3;   // units
  var CASCADE_WINDOW        = 5.0;   // seconds
  var CASCADE_CHANCE        = 0.30;
  var CASCADE_RADIUS        = 15;    // units
  var CASCADE_DAMAGE        = 40;
  var PLAYER_COLLAPSE_DMGR  = 80;
  var ENEMY_COLLAPSE_DMG    = 150;
  var HUD_FLASH_NEAR        = 30;    // units
  var HUD_FLASH_DURATION    = 2.0;   // seconds

  /* ── Geometry / Material cache ──────────────────────────────────────── */
  var _rubbleGeoCache  = null;
  var _rubbleMat       = null;
  var _dustMat         = null;
  var _smokeMat        = null;
  var _rubblePileMat   = null;

  function _getRubbleGeo() {
    if (!_rubbleGeoCache) {
      _rubbleGeoCache = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    }
    return _rubbleGeoCache;
  }

  function _getRubbleMat() {
    if (!_rubbleMat) {
      _rubbleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    }
    return _rubbleMat;
  }

  function _getDustMat() {
    if (!_dustMat) {
      _dustMat = new THREE.MeshBasicMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });
    }
    return _dustMat;
  }

  function _getSmokeMat() {
    if (!_smokeMat) {
      _smokeMat = new THREE.MeshBasicMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      });
    }
    return _smokeMat;
  }

  function _getRubblePileMat() {
    if (!_rubblePileMat) {
      _rubblePileMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    }
    return _rubblePileMat;
  }

  /* ── BuildingRecord ─────────────────────────────────────────────────── */
  function _createRecord(mesh, hp) {
    return {
      mesh:          mesh,
      maxHp:         hp,
      hp:            hp,
      state:         DAMAGE_STATE_INTACT,
      collapsed:     false,
      collapseTime:  0,       // game time when collapse started (unused, use anim)
      originalColor: _getMeshColor(mesh),
      windowMeshes:  [],      // black squares added on DAMAGED state
      smokeSources:  [],      // smoke emitter state handles
      rubblePile:    null
    };
  }

  function _getMeshColor(mesh) {
    if (mesh.material && mesh.material.color) {
      return mesh.material.color.getHex();
    }
    return 0xaaaaaa;
  }

  /* ── Damage State Machine ───────────────────────────────────────────── */
  function _getState(hp, maxHp) {
    var pct = hp / maxHp;
    if (pct > 0.60) return DAMAGE_STATE_INTACT;
    if (pct > 0.30) return DAMAGE_STATE_DAMAGED;
    return DAMAGE_STATE_CRITICAL;
  }

  function _applyIntactVisuals(record) {
    // Restore original color
    if (record.mesh.material && record.mesh.material.color) {
      record.mesh.material.color.setHex(record.originalColor);
    }
    _removeWindowMeshes(record);
  }

  function _applyDamagedVisuals(record) {
    // Darken to crack effect
    if (record.mesh.material && record.mesh.material.color) {
      var orig = record.originalColor;
      var r = ((orig >> 16) & 0xff) * 0.65;
      var g = ((orig >>  8) & 0xff) * 0.65;
      var b = ( orig        & 0xff) * 0.65;
      record.mesh.material.color.setRGB(r / 255, g / 255, b / 255);
    }
    // Add broken-window black squares if not already added
    if (record.windowMeshes.length === 0) {
      _spawnWindowDamage(record);
    }
  }

  function _applyCriticalVisuals(record) {
    // Very dark — near rubble look
    if (record.mesh.material && record.mesh.material.color) {
      var orig = record.originalColor;
      var r = ((orig >> 16) & 0xff) * 0.35;
      var g = ((orig >>  8) & 0xff) * 0.35;
      var b = ( orig        & 0xff) * 0.35;
      record.mesh.material.color.setRGB(r / 255, g / 255, b / 255);
    }
    if (record.windowMeshes.length === 0) {
      _spawnWindowDamage(record);
    }
  }

  function _spawnWindowDamage(record) {
    var mesh = record.mesh;
    var geo  = mesh.geometry;
    if (!geo || !geo.boundingBox) {
      if (geo) geo.computeBoundingBox();
    }
    var bb = geo ? geo.boundingBox : null;
    var size = bb ? {
      x: bb.max.x - bb.min.x,
      y: bb.max.y - bb.min.y,
      z: bb.max.z - bb.min.z
    } : { x: 4, y: 6, z: 4 };

    var windowMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    var windowGeo = new THREE.PlaneGeometry(0.8, 0.8);
    var count = 4 + Math.floor(Math.random() * 4);
    for (var i = 0; i < count; i++) {
      var wm = new THREE.Mesh(windowGeo, windowMat);
      // Place windows on front face (z+) at random heights
      wm.position.set(
        (Math.random() - 0.5) * size.x * 0.7,
        (Math.random() - 0.3) * size.y * 0.5,
        size.z * 0.5 + 0.05
      );
      mesh.add(wm);
      record.windowMeshes.push(wm);
    }
  }

  function _removeWindowMeshes(record) {
    for (var i = 0; i < record.windowMeshes.length; i++) {
      record.mesh.remove(record.windowMeshes[i]);
    }
    record.windowMeshes = [];
  }

  /* ── Transition State ───────────────────────────────────────────────── */
  function _transitionState(record, newState) {
    if (newState === record.state) return;
    record.state = newState;
    if (newState === DAMAGE_STATE_INTACT) {
      _applyIntactVisuals(record);
    } else if (newState === DAMAGE_STATE_DAMAGED) {
      _applyDamagedVisuals(record);
    } else if (newState === DAMAGE_STATE_CRITICAL) {
      _applyCriticalVisuals(record);
    }
  }

  /* ── Collapse ───────────────────────────────────────────────────────── */
  function _triggerCollapse(record) {
    if (record.collapsed) return;
    record.collapsed = true;

    var mesh = record.mesh;
    var worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    // Record collapse for cascade check
    _recentCollapses.push({ position: worldPos.clone(), time: 0 });

    // Start collapse animation
    _collapseAnims.push({ record: record, elapsed: 0, startY: mesh.scale.y });

    // Spawn rubble chunks
    _spawnRubble(record, worldPos);

    // Spawn dust cloud
    _spawnDustCloud(worldPos);

    // Damage entities in/near building
    _damageEntitiesInBuilding(record, worldPos);

    // Screen shake if player nearby
    _triggerShake(worldPos);

    // HUD flash if player nearby
    _triggerHudFlash(worldPos);

    // Play collapse rumble sound
    _playCollapseSound();

    // Check cascade
    _checkCascade(worldPos, record.mesh.uuid);
  }

  /* ── Rubble Spawning ────────────────────────────────────────────────── */
  function _spawnRubble(record, worldPos) {
    var mesh = record.mesh;
    var geo  = mesh.geometry;
    if (geo && !geo.boundingBox) geo.computeBoundingBox();
    var bb  = (geo && geo.boundingBox) ? geo.boundingBox : null;
    var halfH = bb ? (bb.max.y - bb.min.y) * 0.5 * mesh.scale.y : 3;

    var count = 8 + Math.floor(Math.random() * 5); // 8-12
    for (var i = 0; i < count; i++) {
      var chunk = new THREE.Mesh(_getRubbleGeo(), _getRubbleMat());
      chunk.position.set(
        worldPos.x + (Math.random() - 0.5) * 4,
        worldPos.y + halfH,
        worldPos.z + (Math.random() - 0.5) * 4
      );

      var angle = Math.random() * Math.PI * 2;
      var speed = 3 + Math.random() * 5;
      _scene.add(chunk);
      _rubbleChunks.push({
        mesh:    chunk,
        vx:      Math.cos(angle) * speed,
        vy:      4 + Math.random() * 4,
        vz:      Math.sin(angle) * speed,
        landed:  false,
        elapsed: 0
      });
    }
  }

  /* ── Dust Cloud ─────────────────────────────────────────────────────── */
  function _spawnDustCloud(worldPos) {
    var dustGeo = new THREE.SphereGeometry(0.8, 6, 6);
    for (var i = 0; i < 20; i++) {
      var mat = new THREE.MeshBasicMaterial({
        color: (Math.random() > 0.5) ? 0xffffff : 0xbbbbbb,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
      });
      var particle = new THREE.Mesh(dustGeo, mat);
      particle.position.set(
        worldPos.x + (Math.random() - 0.5) * 6,
        worldPos.y + Math.random() * 4,
        worldPos.z + (Math.random() - 0.5) * 6
      );
      _scene.add(particle);
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 3;
      _dustParticles.push({
        mesh:    particle,
        vx:      Math.cos(angle) * speed,
        vy:      0.5 + Math.random() * 1.5,
        vz:      Math.sin(angle) * speed,
        elapsed: 0,
        life:    DUST_LIFE
      });
    }
  }

  /* ── Smoke Particles (Critical state, rising) ───────────────────────── */
  function _spawnCriticalSmoke(record) {
    if (!_scene) return;
    var mesh = record.mesh;
    var worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    var smokeGeo = new THREE.SphereGeometry(0.4, 5, 5);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    var particle = new THREE.Mesh(smokeGeo, mat);
    particle.position.set(
      worldPos.x + (Math.random() - 0.5) * 2,
      worldPos.y + 4 + Math.random() * 2,
      worldPos.z + (Math.random() - 0.5) * 2
    );
    _scene.add(particle);
    _smokeParticles.push({
      mesh:    particle,
      elapsed: 0,
      life:    SMOKE_LIFE,
      bRecord: record
    });
  }

  /* ── Entity Damage ──────────────────────────────────────────────────── */
  function _damageEntitiesInBuilding(record, worldPos) {
    // Damage player if inside
    if (_player && _player.position) {
      var pPos = _player.position;
      var dx = pPos.x - worldPos.x;
      var dz = pPos.z - worldPos.z;
      var dist2D = Math.sqrt(dx * dx + dz * dz);
      if (dist2D < 5) {
        // Player inside — apply damage and push outward
        if (typeof _player.takeDamage === 'function') {
          _player.takeDamage(PLAYER_COLLAPSE_DMGR);
        } else if (typeof window.Player !== 'undefined' && typeof window.Player.takeDamage === 'function') {
          window.Player.takeDamage(PLAYER_COLLAPSE_DMGR);
        }
        // Push outward
        if (_player.velocity) {
          var pushAngle = Math.atan2(dz, dx);
          _player.velocity.x += Math.cos(pushAngle) * 8;
          _player.velocity.z += Math.sin(pushAngle) * 8;
        }
      }
    }

    // Damage enemies inside
    if (typeof window.Enemies !== 'undefined' && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        var ePos  = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!ePos) continue;
        var ex = ePos.x - worldPos.x;
        var ez = ePos.z - worldPos.z;
        if (Math.sqrt(ex * ex + ez * ez) < 5) {
          if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(ENEMY_COLLAPSE_DMG);
          }
        }
      }
    }
  }

  /* ── Screen Shake ───────────────────────────────────────────────────── */
  function _triggerShake(worldPos) {
    if (!_camera) return;
    var cp = _camera.position;
    var dx = cp.x - worldPos.x;
    var dz = cp.z - worldPos.z;
    if (Math.sqrt(dx * dx + dz * dz) < SHAKE_RADIUS) {
      _shakeTimer  = SHAKE_DURATION;
      _shakeOrigin = _camera.position.clone();
    }
  }

  /* ── HUD Flash ──────────────────────────────────────────────────────── */
  function _triggerHudFlash(worldPos) {
    if (!_camera) return;
    var cp = _camera.position;
    var dx = cp.x - worldPos.x;
    var dz = cp.z - worldPos.z;
    if (Math.sqrt(dx * dx + dz * dz) < HUD_FLASH_NEAR) {
      _hudFlashTimer = HUD_FLASH_DURATION;
      _showHudFlash();
    }
  }

  function _showHudFlash() {
    if (!_hudFlashEl) {
      _hudFlashEl = document.createElement('div');
      _hudFlashEl.style.cssText = [
        'position:fixed',
        'top:20%',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#ff4400',
        'font-family:monospace',
        'font-size:28px',
        'font-weight:bold',
        'text-shadow:0 0 8px #ff0000',
        'pointer-events:none',
        'z-index:9999',
        'letter-spacing:4px',
        'display:none'
      ].join(';');
      _hudFlashEl.textContent = 'BUILDING COLLAPSE';
      document.body.appendChild(_hudFlashEl);
    }
    _hudFlashEl.style.display = 'block';
  }

  function _hideHudFlash() {
    if (_hudFlashEl) {
      _hudFlashEl.style.display = 'none';
    }
  }

  /* ── Cascade Check ──────────────────────────────────────────────────── */
  function _checkCascade(collapsePos, excludeUuid) {
    // Count recent collapses near this point
    var nearby = 0;
    for (var i = 0; i < _recentCollapses.length; i++) {
      var rc = _recentCollapses[i];
      if (rc.time > CASCADE_WINDOW) continue;
      var dx = rc.position.x - collapsePos.x;
      var dz = rc.position.z - collapsePos.z;
      if (Math.sqrt(dx * dx + dz * dz) < CASCADE_RADIUS) {
        nearby++;
      }
    }

    if (nearby >= 2 && Math.random() < CASCADE_CHANCE) {
      // Apply 40 damage to nearby buildings
      for (var uuid in _buildings) {
        if (uuid === excludeUuid) continue;
        var rec = _buildings[uuid];
        if (rec.collapsed) continue;
        var mPos = new THREE.Vector3();
        rec.mesh.getWorldPosition(mPos);
        var dx2 = mPos.x - collapsePos.x;
        var dz2 = mPos.z - collapsePos.z;
        if (Math.sqrt(dx2 * dx2 + dz2 * dz2) < CASCADE_RADIUS) {
          _applyDamage(rec, CASCADE_DAMAGE);
        }
      }
    }
  }

  /* ── Web Audio Rumble ───────────────────────────────────────────────── */
  function _playCollapseSound() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx    = new AudioCtx();
      var bufLen = Math.floor(ctx.sampleRate * 1.5);
      var buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buffer.getChannelData(0);

      // 60 Hz noise burst — deep rumble
      for (var i = 0; i < bufLen; i++) {
        var t   = i / ctx.sampleRate;
        var env = Math.exp(-t * 2.5); // exponential decay
        // 60 Hz sine + noise
        data[i] = env * (Math.sin(2 * Math.PI * 60 * t) * 0.6 + (Math.random() * 2 - 1) * 0.4);
      }

      var source = ctx.createBufferSource();
      source.buffer = buffer;

      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();
      source.onended = function () { ctx.close(); };
    } catch (e) {
      // Audio API unavailable — silently skip
    }
  }

  /* ── Rubble Pile Spawn ──────────────────────────────────────────────── */
  function _spawnRubblePile(record) {
    var mesh    = record.mesh;
    var geo     = mesh.geometry;
    if (geo && !geo.boundingBox) geo.computeBoundingBox();
    var bb      = (geo && geo.boundingBox) ? geo.boundingBox : null;
    var sizeX   = bb ? (bb.max.x - bb.min.x) * mesh.scale.x : 6;
    var sizeZ   = bb ? (bb.max.z - bb.min.z) * mesh.scale.z : 6;

    var worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    var pileGeo = new THREE.BoxGeometry(sizeX * 0.9, 0.6, sizeZ * 0.9);
    var pile    = new THREE.Mesh(pileGeo, _getRubblePileMat());
    pile.position.set(worldPos.x, worldPos.y + 0.3, worldPos.z);
    _scene.add(pile);
    record.rubblePile = pile;
  }

  /* ── Core Damage Application ────────────────────────────────────────── */
  function _applyDamage(record, amount) {
    if (record.collapsed) return;

    record.hp = Math.max(0, record.hp - amount);

    var newState = _getState(record.hp, record.maxHp);
    _transitionState(record, newState);

    if (record.hp <= 0) {
      _triggerCollapse(record);
    }
  }

  /* ── Update Helpers ─────────────────────────────────────────────────── */
  function _updateCollapseAnims(delta) {
    for (var i = _collapseAnims.length - 1; i >= 0; i--) {
      var anim = _collapseAnims[i];
      anim.elapsed += delta;

      var t = Math.min(anim.elapsed / COLLAPSE_DURATION, 1.0);
      // Shrink Y axis — ease in
      var scaleY = anim.startY * (1.0 - t);
      anim.record.mesh.scale.y = Math.max(scaleY, 0.001);
      // Sink mesh down so base stays on ground
      anim.record.mesh.position.y -= (anim.startY * (1.0 - (1.0 - t))) * delta / COLLAPSE_DURATION * 0.5;

      if (t >= 1.0) {
        // Collapse complete
        anim.record.mesh.visible = false;
        _spawnRubblePile(anim.record);
        _collapseAnims.splice(i, 1);
      }
    }
  }

  function _updateRubbleChunks(delta) {
    var GRAVITY = -12;
    for (var i = _rubbleChunks.length - 1; i >= 0; i--) {
      var rc = _rubbleChunks[i];
      if (rc.landed) continue;

      rc.elapsed += delta;
      rc.vy += GRAVITY * delta;
      rc.mesh.position.x += rc.vx * delta;
      rc.mesh.position.y += rc.vy * delta;
      rc.mesh.position.z += rc.vz * delta;

      // Rotate for visual drama
      rc.mesh.rotation.x += rc.vx * delta * 0.5;
      rc.mesh.rotation.z += rc.vz * delta * 0.5;

      // Ground at y = 0 (approximate floor)
      if (rc.mesh.position.y <= 0.3) {
        rc.mesh.position.y = 0.3;
        rc.vy = 0;
        rc.vx *= 0.3;
        rc.vz *= 0.3;
        rc.landed = true;
        // Leave chunk in scene as permanent debris
      }
    }
  }

  function _updateDustParticles(delta) {
    for (var i = _dustParticles.length - 1; i >= 0; i--) {
      var dp = _dustParticles[i];
      dp.elapsed += delta;

      var t = dp.elapsed / dp.life;
      if (t >= 1.0) {
        _scene.remove(dp.mesh);
        _dustParticles.splice(i, 1);
        continue;
      }

      dp.mesh.position.x += dp.vx * delta;
      dp.mesh.position.y += dp.vy * delta;
      dp.mesh.position.z += dp.vz * delta;

      // Expand and fade
      var scale = 1.0 + t * 3.0;
      dp.mesh.scale.setScalar(scale);
      dp.mesh.material.opacity = 0.6 * (1.0 - t);
    }
  }

  function _updateSmokeParticles(delta) {
    // Periodically spawn new smoke for critical buildings
    for (var uuid in _buildings) {
      var rec = _buildings[uuid];
      if (!rec.collapsed && rec.state === DAMAGE_STATE_CRITICAL) {
        if (Math.random() < delta * 2) { // ~2 particles/sec
          _spawnCriticalSmoke(rec);
        }
      }
    }

    // Update existing smoke
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var sp = _smokeParticles[i];
      sp.elapsed += delta;

      var t = sp.elapsed / sp.life;
      if (t >= 1.0) {
        _scene.remove(sp.mesh);
        _smokeParticles.splice(i, 1);
        continue;
      }

      sp.mesh.position.y += 1.5 * delta;
      sp.mesh.position.x += (Math.random() - 0.5) * 0.3 * delta;
      sp.mesh.position.z += (Math.random() - 0.5) * 0.3 * delta;

      var scale = 1.0 + t * 2.0;
      sp.mesh.scale.setScalar(scale);
      sp.mesh.material.opacity = 0.4 * (1.0 - t);
    }
  }

  function _updateScreenShake(delta) {
    if (_shakeTimer <= 0 || !_camera || !_shakeOrigin) return;

    _shakeTimer -= delta;

    if (_shakeTimer <= 0) {
      // Restore original position
      _camera.position.copy(_shakeOrigin);
      _shakeOrigin = null;
      return;
    }

    // Apply random offset
    _camera.position.set(
      _shakeOrigin.x + (Math.random() - 0.5) * SHAKE_AMOUNT * 2,
      _shakeOrigin.y + (Math.random() - 0.5) * SHAKE_AMOUNT * 2,
      _shakeOrigin.z + (Math.random() - 0.5) * SHAKE_AMOUNT * 2
    );
  }

  function _updateHudFlash(delta) {
    if (_hudFlashTimer > 0) {
      _hudFlashTimer -= delta;
      if (_hudFlashTimer <= 0) {
        _hideHudFlash();
      }
    }
  }

  function _updateRecentCollapses(delta) {
    for (var i = _recentCollapses.length - 1; i >= 0; i--) {
      _recentCollapses[i].time += delta;
      if (_recentCollapses[i].time > CASCADE_WINDOW * 2) {
        _recentCollapses.splice(i, 1);
      }
    }
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  function init(scene, camera, options) {
    _scene  = scene;
    _camera = camera;
    if (options && options.player) {
      _player = options.player;
    }
    // Reset all transient state
    _buildings       = {};
    _collapseAnims   = [];
    _rubbleChunks    = [];
    _dustParticles   = [];
    _smokeParticles  = [];
    _recentCollapses = [];
    _shakeTimer      = 0;
    _shakeOrigin     = null;
    _hudFlashTimer   = 0;
  }

  function update(delta) {
    if (!_scene) return;
    _updateCollapseAnims(delta);
    _updateRubbleChunks(delta);
    _updateDustParticles(delta);
    _updateSmokeParticles(delta);
    _updateScreenShake(delta);
    _updateHudFlash(delta);
    _updateRecentCollapses(delta);
  }

  function registerBuilding(mesh, hp) {
    if (!mesh || !mesh.uuid) return;
    // Clone material so we don't affect shared instances
    if (mesh.material && !mesh.material._udCloned) {
      mesh.material = mesh.material.clone();
      mesh.material._udCloned = true;
    }
    _buildings[mesh.uuid] = _createRecord(mesh, hp || 100);
  }

  function damageBuilding(uuid, amount) {
    var record = _buildings[uuid];
    if (!record) return;
    _applyDamage(record, amount);
  }

  function reset() {
    // Remove all added scene objects
    for (var i = 0; i < _rubbleChunks.length; i++) {
      if (_scene) _scene.remove(_rubbleChunks[i].mesh);
    }
    for (var j = 0; j < _dustParticles.length; j++) {
      if (_scene) _scene.remove(_dustParticles[j].mesh);
    }
    for (var k = 0; k < _smokeParticles.length; k++) {
      if (_scene) _scene.remove(_smokeParticles[k].mesh);
    }

    // Restore building meshes
    for (var uuid in _buildings) {
      var rec = _buildings[uuid];
      rec.mesh.scale.y = 1;
      rec.mesh.visible = true;
      if (rec.rubblePile && _scene) {
        _scene.remove(rec.rubblePile);
      }
      _removeWindowMeshes(rec);
      if (rec.mesh.material && rec.mesh.material.color) {
        rec.mesh.material.color.setHex(rec.originalColor);
      }
    }

    _buildings       = {};
    _collapseAnims   = [];
    _rubbleChunks    = [];
    _dustParticles   = [];
    _smokeParticles  = [];
    _recentCollapses = [];
    _shakeTimer      = 0;
    _shakeOrigin     = null;
    _hudFlashTimer   = 0;

    _hideHudFlash();
  }

  return {
    init:             init,
    update:           update,
    registerBuilding: registerBuilding,
    damageBuilding:   damageBuilding,
    reset:            reset
  };

})();
