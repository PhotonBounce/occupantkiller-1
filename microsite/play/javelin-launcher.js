/* ════════════════════════════════════════════════════════════════════
 *  javelin-launcher.js — Shoulder-launched AT missile, top-attack arc
 *  ─────────────────────────────────────────────────────────────────
 *  J          : equip / unequip launcher
 *  Right-click: enter CLU thermal sight (hold to lock onto target)
 *  Left-click : fire missile when locked
 *
 *  Public API: window.JavelinLauncher = { init(scene, camera), update(dt), spawnPickup(x, y, z), reset }
 * ════════════════════════════════════════════════════════════════════ */
window.JavelinLauncher = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────── */
  var PICKUP_RANGE       = 1.5;   // units to auto-collect
  var LAUNCHER_W         = 2.5;
  var LAUNCHER_H         = 0.25;
  var LAUNCHER_D         = 0.25;
  var LOCK_TIME          = 2.5;   // seconds for full lock
  var MISSILE_SPEED      = 22;    // m/s
  var ARC_HEIGHT         = 8;     // units above target for top-attack
  var DAMAGE_DIRECT      = 200;
  var DAMAGE_SPLASH      = 60;
  var SPLASH_RADIUS      = 5;
  var SELF_DAMAGE        = 30;
  var BACK_BLAST_WARN    = 3;     // units: show warning
  var BACK_BLAST_HURT    = 2;     // units: take self-damage
  var MAX_AMMO           = 3;
  var RELOAD_TIME        = 4.0;   // seconds
  var SMOKE_PARTICLE_COUNT = 8;
  var DEBRIS_COUNT       = 12;
  var SHOCKWAVE_EXPAND   = 6;     // max shockwave radius
  var PICKUP_BOB_SPEED   = 1.5;
  var PICKUP_ROT_SPEED   = 0.8;

  /* ── Module state ───────────────────────────────────────────────── */
  var _scene   = null;
  var _camera  = null;

  var _pickups  = [];   // { mesh, x, y, z, age }
  var _equipped = false;
  var _ammo     = 0;
  var _reloading = false;
  var _reloadTimer = 0;

  /* CLU sight */
  var _cluActive  = false;
  var _lockTarget = null;   // enemy object or null
  var _lockProgress = 0;    // 0..1
  var _locked     = false;

  /* missile in flight */
  var _missile = null;   /* {
    mesh, fins, exhaustLight, smokeParticles,
    phase: 'rise'|'arc'|'dive',
    target: {x,y,z},
    arcTop: {x,y,z},
    t: 0,              // 0..1 along current phase
    startPos: {x,y,z},
    riseEnd: {x,y,z},
    age: 0
  } */

  /* impact fx */
  var _particles   = [];   // { mesh, vx, vy, vz, life, maxLife }
  var _shockwaves  = [];   // { mesh, age, maxAge }
  var _explosionLights = []; // { light, age, maxAge }

  /* HUD elements */
  var _hudEl       = null;
  var _reticleEl   = null;
  var _lockRingEl  = null;
  var _warningEl   = null;
  var _warningTimer = 0;

  /* Web Audio */
  var _audioCtx    = null;
  var _lockBeepNode = null;
  var _lockBeepGain = null;

  /* event listener refs for cleanup */
  var _onKeyDown   = null;
  var _onMouseDown = null;
  var _onMouseUp   = null;
  var _onContextMenu = null;

  /* ── DOM / HUD ──────────────────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;

    /* main status bar */
    _hudEl = document.createElement('div');
    _hudEl.id = 'jav-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:13px',
      'color:#00ff88',
      'background:rgba(0,0,0,0.6)',
      'border:1px solid #00ff88',
      'padding:3px 14px',
      'border-radius:4px',
      'z-index:310',
      'pointer-events:none',
      'letter-spacing:2px',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    /* CLU reticle overlay */
    _reticleEl = document.createElement('div');
    _reticleEl.id = 'jav-reticle';
    _reticleEl.style.cssText = [
      'position:fixed',
      'top:0','left:0','width:100%','height:100%',
      'pointer-events:none',
      'z-index:305',
      'display:none'
    ].join(';');
    _reticleEl.innerHTML = [
      '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">',
      '<rect x="48%" y="48%" width="4%" height="4%" fill="none" stroke="#00ff44" stroke-width="1.5" opacity="0.85"/>',
      '<line x1="50%" y1="44%" x2="50%" y2="46%" stroke="#00ff44" stroke-width="1.5" opacity="0.7"/>',
      '<line x1="50%" y1="54%" x2="50%" y2="56%" stroke="#00ff44" stroke-width="1.5" opacity="0.7"/>',
      '<line x1="44%" y1="50%" x2="46%" y2="50%" stroke="#00ff44" stroke-width="1.5" opacity="0.7"/>',
      '<line x1="54%" y1="50%" x2="56%" y2="50%" stroke="#00ff44" stroke-width="1.5" opacity="0.7"/>',
      '<circle cx="50%" cy="50%" r="3%" fill="none" stroke="#00ff44" stroke-width="0.8" opacity="0.5"/>',
      '</svg>'
    ].join('');
    document.body.appendChild(_reticleEl);

    /* lock ring (circular progress) */
    _lockRingEl = document.createElement('div');
    _lockRingEl.id = 'jav-lockring';
    _lockRingEl.style.cssText = [
      'position:fixed',
      'top:50%','left:50%',
      'width:60px','height:60px',
      'margin:-30px 0 0 -30px',
      'border-radius:50%',
      'border:3px solid #ff4400',
      'box-shadow:0 0 8px #ff4400',
      'z-index:306',
      'pointer-events:none',
      'display:none',
      'transition:none'
    ].join(';');
    document.body.appendChild(_lockRingEl);

    /* back-blast warning */
    _warningEl = document.createElement('div');
    _warningEl.id = 'jav-warning';
    _warningEl.style.cssText = [
      'position:fixed',
      'top:35%','left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'color:#ff2200',
      'background:rgba(0,0,0,0.7)',
      'border:2px solid #ff2200',
      'padding:6px 18px',
      'border-radius:4px',
      'z-index:320',
      'pointer-events:none',
      'letter-spacing:3px',
      'display:none'
    ].join(';');
    _warningEl.textContent = 'BACK-BLAST HAZARD';
    document.body.appendChild(_warningEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_equipped) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    if (_reloading) {
      _hudEl.textContent = 'JAVELIN  RELOAD';
      _hudEl.style.color = '#ffaa00';
      _hudEl.style.borderColor = '#ffaa00';
    } else if (_ammo <= 0) {
      _hudEl.textContent = 'JAVELIN  EMPTY';
      _hudEl.style.color = '#ff4444';
      _hudEl.style.borderColor = '#ff4444';
    } else {
      _hudEl.textContent = 'JAVELIN [' + _ammo + ']';
      _hudEl.style.color = _locked ? '#ff4400' : '#00ff88';
      _hudEl.style.borderColor = _locked ? '#ff4400' : '#00ff88';
    }
  }

  function _showBackBlastWarning() {
    if (!_warningEl) return;
    _warningEl.style.display = 'block';
    _warningTimer = 1.5;
  }

  /* ── Audio ──────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* silent */ }
    return _audioCtx;
  }

  function _startLockTone() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    _stopLockTone();
    _lockBeepGain = ctx.createGain();
    _lockBeepGain.gain.setValueAtTime(0.08, ctx.currentTime);
    _lockBeepGain.connect(ctx.destination);
    _lockBeepNode = ctx.createOscillator();
    _lockBeepNode.type = 'sine';
    _lockBeepNode.frequency.setValueAtTime(800, ctx.currentTime);
    _lockBeepNode.connect(_lockBeepGain);
    _lockBeepNode.start();
  }

  function _updateLockTone(progress) {
    if (!_lockBeepNode || !_lockBeepGain) return;
    var ctx = _getAudioCtx();
    if (!ctx) return;
    /* rising pitch 800 → 1800 Hz */
    _lockBeepNode.frequency.setValueAtTime(800 + progress * 1000, ctx.currentTime);
    /* pulse amplitude when nearly locked */
    var pulse = progress > 0.8 ? (0.5 + 0.5 * Math.sin(ctx.currentTime * 30)) : 1.0;
    _lockBeepGain.gain.setValueAtTime(0.08 * pulse, ctx.currentTime);
  }

  function _stopLockTone() {
    try { if (_lockBeepNode) { _lockBeepNode.stop(); } } catch (e) { /* ok */ }
    _lockBeepNode = null;
    _lockBeepGain = null;
  }

  function _playFireSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    gain.connect(ctx.destination);
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.5);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  function _playExplosionSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    gain.connect(ctx.destination);
    var bufSize = ctx.sampleRate * 0.8;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    src.start();
  }

  /* ── CLU thermal effect ─────────────────────────────────────────── */
  function _enterCLU() {
    if (_cluActive) return;
    _cluActive = true;
    document.body.style.filter = 'sepia(1) hue-rotate(80deg) saturate(3) brightness(0.75)';
    if (_reticleEl) _reticleEl.style.display = 'block';
  }

  function _exitCLU() {
    if (!_cluActive) return;
    _cluActive = false;
    document.body.style.filter = '';
    if (_reticleEl) _reticleEl.style.display = 'none';
    if (_lockRingEl) _lockRingEl.style.display = 'none';
    _lockTarget   = null;
    _lockProgress = 0;
    _locked       = false;
    _stopLockTone();
  }

  /* ── Pickup mesh ────────────────────────────────────────────────── */
  function _createPickupMesh() {
    var geo = new THREE.BoxGeometry(LAUNCHER_W, LAUNCHER_H, LAUNCHER_D);
    var mat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
    var mesh = new THREE.Mesh(geo, mat);
    /* small glow */
    var glowGeo = new THREE.BoxGeometry(LAUNCHER_W + 0.1, LAUNCHER_H + 0.1, LAUNCHER_D + 0.1);
    var glowMat = new THREE.MeshBasicMaterial({ color: 0x88ff44, transparent: true, opacity: 0.18, wireframe: true });
    var glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);
    return mesh;
  }

  /* ── Missile mesh ───────────────────────────────────────────────── */
  function _createMissileMesh() {
    var group = new THREE.Group();

    /* body */
    var bodyGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.8, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    /* nose cone */
    var noseGeo = new THREE.ConeGeometry(0.08, 0.25, 8);
    var noseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var nose    = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.525, 0);
    group.add(nose);

    /* 4 fins at rear */
    var fins = [];
    for (var i = 0; i < 4; i++) {
      var finGeo = new THREE.BoxGeometry(0.02, 0.18, 0.12);
      var finMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var fin    = new THREE.Mesh(finGeo, finMat);
      var angle  = (i / 4) * Math.PI * 2;
      fin.position.set(Math.cos(angle) * 0.1, -0.3, Math.sin(angle) * 0.1);
      fin.rotation.y = angle;
      group.add(fin);
      fins.push(fin);
    }

    /* exhaust point light */
    var light = new THREE.PointLight(0xff6600, 1.5, 4);
    light.position.set(0, -0.45, 0);
    group.add(light);

    return { group: group, fins: fins, exhaustLight: light };
  }

  /* ── Smoke trail particle ───────────────────────────────────────── */
  function _spawnSmoke(pos) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.55 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x + (Math.random()-0.5)*0.1, pos.y + (Math.random()-0.5)*0.1, pos.z + (Math.random()-0.5)*0.1);
    _scene.add(mesh);
    _missile.smokeParticles.push({ mesh: mesh, life: 0, maxLife: 1.8 + Math.random() * 0.6 });
  }

  /* ── Explosion ──────────────────────────────────────────────────── */
  function _spawnExplosion(pos, isMissileHit) {
    if (!_scene) return;

    /* orange point light flash */
    var light = new THREE.PointLight(0xff8800, 4.0, 18);
    light.position.set(pos.x, pos.y, pos.z);
    _scene.add(light);
    _explosionLights.push({ light: light, age: 0, maxAge: 0.5 });

    /* debris particles */
    for (var d = 0; d < DEBRIS_COUNT; d++) {
      var dGeo = new THREE.BoxGeometry(0.12 + Math.random()*0.1, 0.12 + Math.random()*0.1, 0.05);
      var dMat = new THREE.MeshBasicMaterial({ color: (Math.random() > 0.5 ? 0xff6600 : 0x333333) });
      var dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(pos.x, pos.y, pos.z);
      _scene.add(dMesh);
      var spd = 5 + Math.random() * 8;
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.random() * Math.PI;
      _particles.push({
        mesh:   dMesh,
        vx: Math.sin(phi) * Math.cos(theta) * spd,
        vy: Math.abs(Math.cos(phi)) * spd + 2,
        vz: Math.sin(phi) * Math.sin(theta) * spd,
        life:    0,
        maxLife: 1.2 + Math.random() * 0.8
      });
    }

    /* shockwave ring */
    var ringGeo = new THREE.RingGeometry(0.1, 0.4, 32);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    var ring    = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(pos.x, pos.y + 0.1, pos.z);
    ring.rotation.x = -Math.PI / 2;
    _scene.add(ring);
    _shockwaves.push({ mesh: ring, age: 0, maxAge: 0.7 });

    _playExplosionSound();

    /* deal damage */
    _applyBlastDamage(pos, isMissileHit);
  }

  /* ── Damage helpers ─────────────────────────────────────────────── */
  function _applyBlastDamage(pos, isDirect) {
    /* collect all enemy arrays */
    var enemies = [];
    if (window._enemies && Array.isArray(window._enemies)) {
      for (var i = 0; i < window._enemies.length; i++) enemies.push(window._enemies[i]);
    }
    if (window._enemyVehicles && Array.isArray(window._enemyVehicles)) {
      for (var i = 0; i < window._enemyVehicles.length; i++) enemies.push(window._enemyVehicles[i]);
    }

    for (var e = 0; e < enemies.length; e++) {
      var enemy = enemies[e];
      if (!enemy) continue;
      var ep = enemy.position || (enemy.mesh && enemy.mesh.position);
      if (!ep) continue;
      var dx = ep.x - pos.x;
      var dy = ep.y - pos.y;
      var dz = ep.z - pos.z;
      var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (isDirect && dist < 1.0) {
        /* defeat armor first */
        if (typeof enemy.armor === 'number') enemy.armor = 0;
        var dmg = DAMAGE_DIRECT;
        if (typeof enemy.takeDamage === 'function') enemy.takeDamage(dmg);
        else if (typeof enemy.hp !== 'undefined') enemy.hp -= dmg;
      } else if (dist < SPLASH_RADIUS) {
        var falloff = 1 - (dist / SPLASH_RADIUS);
        var splashDmg = Math.round(DAMAGE_SPLASH * falloff);
        if (typeof enemy.takeDamage === 'function') enemy.takeDamage(splashDmg);
        else if (typeof enemy.hp !== 'undefined') enemy.hp -= splashDmg;
      }
    }

    /* player self-damage check (back-blast from wall) */
    if (_camera) {
      var cp = _camera.position;
      var cdx = cp.x - pos.x;
      var cdz = cp.z - pos.z;
      var cdist = Math.sqrt(cdx*cdx + cdz*cdz);
      if (cdist < SPLASH_RADIUS * 0.5 && typeof window._playerHealth !== 'undefined') {
        window._playerHealth -= Math.round(DAMAGE_SPLASH * 0.5);
      }
    }
  }

  /* ── Wall / back-blast check ────────────────────────────────────── */
  function _checkBackBlast() {
    if (!_camera || !_scene) return false;
    /* cast ray behind camera */
    var dir = new THREE.Vector3(0, 0, 1);  /* +Z is behind in default camera */
    dir.applyQuaternion(_camera.quaternion);
    var raycaster = new THREE.Raycaster(_camera.position.clone(), dir.normalize(), 0.1, BACK_BLAST_WARN);
    var meshes = [];
    _scene.traverse(function (obj) {
      if (obj.isMesh && obj !== (_missile && _missile.mesh)) meshes.push(obj);
    });
    var hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      _showBackBlastWarning();
      if (hits[0].distance < BACK_BLAST_HURT) {
        if (typeof window._playerHealth !== 'undefined') {
          window._playerHealth -= SELF_DAMAGE;
        }
      }
      return true;
    }
    return false;
  }

  /* ── Lock-on target search ──────────────────────────────────────── */
  function _findLockTarget() {
    if (!_camera) return null;
    var forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(_camera.quaternion).normalize();

    var bestScore = -1;
    var bestTarget = null;

    /* prefer vehicles (EnemyTankDestroyer) */
    var searchLists = [];
    if (window._enemyVehicles && Array.isArray(window._enemyVehicles) && window._enemyVehicles.length > 0) {
      searchLists.push(window._enemyVehicles);
    }
    if (window._enemies && Array.isArray(window._enemies)) {
      searchLists.push(window._enemies);
    }

    for (var li = 0; li < searchLists.length; li++) {
      var list = searchLists[li];
      for (var i = 0; i < list.length; i++) {
        var enemy = list[i];
        if (!enemy) continue;
        /* skip dead */
        if (enemy.hp !== undefined && enemy.hp <= 0) continue;
        if (enemy.dead) continue;
        var ep = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!ep) continue;
        var toTarget = new THREE.Vector3(ep.x - _camera.position.x, ep.y - _camera.position.y, ep.z - _camera.position.z);
        var dist = toTarget.length();
        if (dist < 0.5 || dist > 60) continue;
        toTarget.normalize();
        var dot = forward.dot(toTarget);
        if (dot < 0.92) continue;  /* must be within ~23° of center */
        var score = dot * (1 / dist) * (li === 0 ? 2 : 1); /* vehicle bonus */
        if (score > bestScore) {
          bestScore = score;
          bestTarget = enemy;
        }
      }
      if (bestTarget) break; /* vehicle list found something — stop */
    }
    return bestTarget;
  }

  /* ── Fire missile ───────────────────────────────────────────────── */
  function _fireMissile() {
    if (!_locked || !_lockTarget || _ammo <= 0 || _missile) return;
    if (_reloading) return;

    _checkBackBlast();

    var ep = _lockTarget.position || (_lockTarget.mesh && _lockTarget.mesh.position);
    if (!ep) return;

    _ammo--;
    if (_ammo <= 0 && !_reloading) {
      _reloading    = true;
      _reloadTimer  = RELOAD_TIME;
    }

    var startPos = _camera.position.clone();
    var targetPos = { x: ep.x, y: ep.y, z: ep.z };
    var arcTop    = {
      x: (startPos.x + targetPos.x) * 0.5,
      y: Math.max(startPos.y, targetPos.y) + ARC_HEIGHT,
      z: (startPos.z + targetPos.z) * 0.5
    };

    var missileParts = _createMissileMesh();
    missileParts.group.position.set(startPos.x, startPos.y, startPos.z);
    _scene.add(missileParts.group);

    _missile = {
      mesh:          missileParts.group,
      exhaustLight:  missileParts.exhaustLight,
      smokeParticles: [],
      smokeTimer:    0,
      phase:         'rise',
      target:        targetPos,
      arcTop:        arcTop,
      startPos:      { x: startPos.x, y: startPos.y, z: startPos.z },
      riseEnd:       { x: arcTop.x, y: arcTop.y, z: arcTop.z },
      t:             0,
      age:           0,
      targetRef:     _lockTarget
    };

    /* reset lock state */
    _locked       = false;
    _lockTarget   = null;
    _lockProgress = 0;
    _stopLockTone();
    _exitCLU();

    _playFireSound();
    _updateHUD();
  }

  /* ── Update missile flight ──────────────────────────────────────── */
  function _updateMissile(dt) {
    if (!_missile) return;
    _missile.age += dt;

    var m = _missile;

    /* compute step for this frame */
    var dist;
    if (m.phase === 'rise') {
      var dx = m.arcTop.x - m.startPos.x;
      var dy = m.arcTop.y - m.startPos.y;
      var dz = m.arcTop.z - m.startPos.z;
      dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      var step = dt * MISSILE_SPEED / Math.max(dist, 0.1);
      m.t += step;
      if (m.t >= 1.0) { m.t = 0; m.phase = 'dive'; }
      else {
        m.mesh.position.set(
          m.startPos.x + (m.arcTop.x - m.startPos.x) * m.t,
          m.startPos.y + (m.arcTop.y - m.startPos.y) * m.t,
          m.startPos.z + (m.arcTop.z - m.startPos.z) * m.t
        );
      }
    } else if (m.phase === 'dive') {
      var dx = m.target.x - m.arcTop.x;
      var dy = m.target.y - m.arcTop.y;
      var dz = m.target.z - m.arcTop.z;
      dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      var step = dt * MISSILE_SPEED / Math.max(dist, 0.1);
      m.t += step;
      if (m.t >= 1.0) {
        /* impact */
        _spawnExplosion(m.target, true);
        _cleanupMissile();
        return;
      }
      m.mesh.position.set(
        m.arcTop.x + (m.target.x - m.arcTop.x) * m.t,
        m.arcTop.y + (m.target.y - m.arcTop.y) * m.t,
        m.arcTop.z + (m.target.z - m.arcTop.z) * m.t
      );
    }

    /* orient missile along velocity direction */
    var nextT = Math.min(m.t + 0.05, 1.0);
    var nextPos;
    if (m.phase === 'rise') {
      nextPos = new THREE.Vector3(
        m.startPos.x + (m.arcTop.x - m.startPos.x) * nextT,
        m.startPos.y + (m.arcTop.y - m.startPos.y) * nextT,
        m.startPos.z + (m.arcTop.z - m.startPos.z) * nextT
      );
    } else {
      nextPos = new THREE.Vector3(
        m.arcTop.x + (m.target.x - m.arcTop.x) * nextT,
        m.arcTop.y + (m.target.y - m.arcTop.y) * nextT,
        m.arcTop.z + (m.target.z - m.arcTop.z) * nextT
      );
    }
    var dir = nextPos.clone().sub(m.mesh.position).normalize();
    if (dir.length() > 0.001) {
      var up = new THREE.Vector3(0, 1, 0);
      var right = new THREE.Vector3().crossVectors(dir, up).normalize();
      /* fallback if dir is nearly vertical */
      if (right.length() < 0.001) right.set(1, 0, 0);
      var trueUp = new THREE.Vector3().crossVectors(right, dir).normalize();
      m.mesh.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(right, dir, trueUp.negate())
      );
    }

    /* smoke trail */
    m.smokeTimer -= dt;
    if (m.smokeTimer <= 0) {
      m.smokeTimer = 0.05;
      _spawnSmoke(m.mesh.position);
    }

    /* update smoke particles */
    for (var i = m.smokeParticles.length - 1; i >= 0; i--) {
      var sp = m.smokeParticles[i];
      sp.life += dt;
      var frac = sp.life / sp.maxLife;
      sp.mesh.material.opacity = 0.55 * (1 - frac);
      sp.mesh.scale.setScalar(1 + frac * 1.5);
      sp.mesh.position.y += dt * 0.3;
      if (sp.life >= sp.maxLife) {
        _scene.remove(sp.mesh);
        m.smokeParticles.splice(i, 1);
      }
    }

    /* safety timeout — detonate after 12s */
    if (m.age > 12) {
      _spawnExplosion(m.mesh.position, false);
      _cleanupMissile();
    }
  }

  function _cleanupMissile() {
    if (!_missile) return;
    /* remove remaining smoke */
    for (var i = 0; i < _missile.smokeParticles.length; i++) {
      _scene.remove(_missile.smokeParticles[i].mesh);
    }
    _scene.remove(_missile.mesh);
    _missile = null;
  }

  /* ── Update explosion fx ────────────────────────────────────────── */
  function _updateFX(dt) {
    /* debris particles */
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.life += dt;
      p.vy  -= 9.8 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        _particles.splice(i, 1);
      }
    }

    /* shockwaves */
    for (var i = _shockwaves.length - 1; i >= 0; i--) {
      var sw = _shockwaves[i];
      sw.age += dt;
      var frac = sw.age / sw.maxAge;
      var scale = 1 + frac * (SHOCKWAVE_EXPAND - 1);
      sw.mesh.scale.setScalar(scale);
      sw.mesh.material.opacity = 0.7 * (1 - frac);
      if (sw.age >= sw.maxAge) {
        _scene.remove(sw.mesh);
        _shockwaves.splice(i, 1);
      }
    }

    /* explosion lights */
    for (var i = _explosionLights.length - 1; i >= 0; i--) {
      var el = _explosionLights[i];
      el.age += dt;
      el.light.intensity = 4.0 * (1 - el.age / el.maxAge);
      if (el.age >= el.maxAge) {
        _scene.remove(el.light);
        _explosionLights.splice(i, 1);
      }
    }
  }

  /* ── Update pickups ─────────────────────────────────────────────── */
  function _updatePickups(dt) {
    if (!_camera) return;
    var cp = _camera.position;
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var pk = _pickups[i];
      pk.age += dt;
      /* bob & spin */
      pk.mesh.position.y = pk.baseY + Math.sin(pk.age * PICKUP_BOB_SPEED) * 0.15;
      pk.mesh.rotation.y += PICKUP_ROT_SPEED * dt;

      /* proximity check */
      var dx = cp.x - pk.mesh.position.x;
      var dy = cp.y - pk.mesh.position.y;
      var dz = cp.z - pk.mesh.position.z;
      var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist <= PICKUP_RANGE) {
        /* collect */
        _scene.remove(pk.mesh);
        _pickups.splice(i, 1);
        _ammo     = MAX_AMMO;
        _equipped = true;
        _reloading = false;
        _reloadTimer = 0;
        _updateHUD();
        if (_hudEl) {
          _hudEl.style.display = 'block';
        }
      }
    }
  }

  /* ── Update lock-on ─────────────────────────────────────────────── */
  function _updateLockOn(dt) {
    if (!_cluActive) {
      if (_lockRingEl) _lockRingEl.style.display = 'none';
      return;
    }

    var candidate = _findLockTarget();

    if (candidate) {
      if (candidate !== _lockTarget) {
        /* new target — reset progress */
        _lockTarget   = candidate;
        _lockProgress = 0;
        _locked       = false;
        _startLockTone();
      }
      if (!_locked) {
        _lockProgress += dt / LOCK_TIME;
        if (_lockProgress >= 1.0) {
          _lockProgress = 1.0;
          _locked       = true;
        }
        _updateLockTone(_lockProgress);
      }
      /* update lock ring */
      if (_lockRingEl) {
        _lockRingEl.style.display = 'block';
        var pct = _lockProgress * 100;
        var col = _locked ? '#ff0000' : '#ff8800';
        _lockRingEl.style.borderColor = col;
        _lockRingEl.style.boxShadow   = '0 0 8px ' + col;
        _lockRingEl.style.opacity     = '0.85';
        /* pulse effect when locked */
        if (_locked) {
          var pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
          _lockRingEl.style.opacity = String(pulse);
        }
      }
    } else {
      /* no target in view — decay lock */
      _lockProgress = Math.max(0, _lockProgress - dt * 0.8);
      if (_lockProgress <= 0) {
        _lockTarget = null;
        _locked     = false;
        _stopLockTone();
      }
      if (_lockRingEl) _lockRingEl.style.display = 'none';
    }
  }

  /* ── Input handlers ─────────────────────────────────────────────── */
  function _setupInput() {
    _onKeyDown = function (e) {
      if (e.code === 'KeyJ' || e.key === 'j' || e.key === 'J') {
        if (!_equipped) return; /* no launcher held, ignore unequip */
        _equipped = !_equipped;
        if (!_equipped) {
          _exitCLU();
        }
        _updateHUD();
      }
    };

    _onMouseDown = function (e) {
      if (!_equipped || _reloading) return;
      if (e.button === 2) {
        /* right click — enter CLU / lock */
        _enterCLU();
      }
      if (e.button === 0 && _locked && !_missile) {
        /* left click — fire */
        _fireMissile();
      }
    };

    _onMouseUp = function (e) {
      if (e.button === 2) {
        _exitCLU();
      }
    };

    _onContextMenu = function (e) { e.preventDefault(); };

    document.addEventListener('keydown',     _onKeyDown);
    document.addEventListener('mousedown',   _onMouseDown);
    document.addEventListener('mouseup',     _onMouseUp);
    document.addEventListener('contextmenu', _onContextMenu);
  }

  function _removeInput() {
    if (_onKeyDown)    document.removeEventListener('keydown',     _onKeyDown);
    if (_onMouseDown)  document.removeEventListener('mousedown',   _onMouseDown);
    if (_onMouseUp)    document.removeEventListener('mouseup',     _onMouseUp);
    if (_onContextMenu) document.removeEventListener('contextmenu', _onContextMenu);
    _onKeyDown = _onMouseDown = _onMouseUp = _onContextMenu = null;
  }

  /* ── Public API ─────────────────────────────────────────────────── */

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _createHUD();
    _setupInput();
  }

  function update(dt) {
    if (!_scene || !_camera) return;

    /* pickup bob / collect */
    _updatePickups(dt);

    /* reload timer */
    if (_reloading) {
      _reloadTimer -= dt;
      if (_reloadTimer <= 0) {
        _reloading = false;
        _reloadTimer = 0;
        _ammo = MAX_AMMO;
      }
    }

    /* lock-on */
    if (_equipped) {
      _updateLockOn(dt);
    }

    /* missile */
    _updateMissile(dt);

    /* fx */
    _updateFX(dt);

    /* back-blast warning blink */
    if (_warningTimer > 0) {
      _warningTimer -= dt;
      if (_warningEl) {
        var blink = Math.floor(_warningTimer * 6) % 2 === 0;
        _warningEl.style.display = blink ? 'block' : 'none';
      }
      if (_warningTimer <= 0 && _warningEl) {
        _warningEl.style.display = 'none';
      }
    }

    _updateHUD();
  }

  function spawnPickup(x, y, z) {
    if (!_scene) return;
    var mesh   = _createPickupMesh();
    var baseY  = (y !== undefined) ? y : 0.5;
    mesh.position.set(x || 0, baseY, z || 0);
    _scene.add(mesh);
    _pickups.push({ mesh: mesh, baseY: baseY, age: Math.random() * Math.PI * 2 });
  }

  function reset() {
    _exitCLU();
    _cleanupMissile();

    /* remove pickups */
    for (var i = 0; i < _pickups.length; i++) {
      if (_scene) _scene.remove(_pickups[i].mesh);
    }
    _pickups = [];

    /* remove fx */
    for (var i = 0; i < _particles.length; i++) {
      if (_scene) _scene.remove(_particles[i].mesh);
    }
    _particles = [];

    for (var i = 0; i < _shockwaves.length; i++) {
      if (_scene) _scene.remove(_shockwaves[i].mesh);
    }
    _shockwaves = [];

    for (var i = 0; i < _explosionLights.length; i++) {
      if (_scene) _scene.remove(_explosionLights[i].light);
    }
    _explosionLights = [];

    _equipped     = false;
    _ammo         = 0;
    _reloading    = false;
    _reloadTimer  = 0;
    _lockTarget   = null;
    _lockProgress = 0;
    _locked       = false;
    _warningTimer = 0;
    _stopLockTone();

    _updateHUD();
  }

  return {
    init:        init,
    update:      update,
    spawnPickup: spawnPickup,
    reset:       reset
  };
})();
