/* ════════════════════════════════════════════════════════════════════
 *  ENEMY HELICOPTER SYSTEM
 *  ─────────────────────────────────────────────────────────────────
 *  Aerial boss-lite enemy that circles the player and attacks with
 *  a minigun and rocket salvos. Appears from wave 10 onward (every
 *  4 waves). Tracked in window._helicopterEnemies = [].
 *
 *  Visual:
 *   - Body         BoxGeometry(1.5,0.6,3)   military gray 0x666655
 *   - Tail boom    BoxGeometry(0.3,0.3,2.5) behind body
 *   - Main rotor   BoxGeometry(4,0.06,0.3)  spinning on top
 *   - Tail rotor   BoxGeometry(0.06,0.6,0.06)
 *   - Landing skids
 *   - SpotLight(0xFFFFFF, 3) searchlight sweeping toward player
 *
 *  Behavior:
 *   - Orbits at Y=8-12, radius 20-25, clockwise
 *   - rotor.rotation.y += 12 * dt  (tail rotor perpendicular)
 *   - 400 HP
 *   - Minigun: within 30 units, 10 dmg, 0.12 s rate, red tracers
 *   - Rockets: every 10 s, 2 projectiles, slight homing, smoke trail
 *   - Searchlight sweep toward player
 *   - Engine: 8 Hz AM modulation on low-pass noise
 *   - 50% HP → black smoke trail
 *   - 25% HP → erratic movement + rotor slowdown
 *   - Death: spin-out (rotation.z), crash explosion, debris, +1200 score
 *   - Spawn: wave >= 10, every 4 waves, enters from map edge
 *   - HUD: "HOSTILE AIRCRAFT" toast + red dot on compass
 *
 *  Public API  (IIFE, window.EnemyHelicopter):
 *    init(scene)  — once after scene ready
 *    update(dt)   — per-frame
 *    spawn()      — manual / auto trigger
 *    reset()      — clear all helicopters between stages
 * ═════════════════════════════════════════════════════════════════ */
window.EnemyHelicopter = (function () {
  'use strict';

  // ── Module state ──
  var _scene = null;
  var _waveCheckTimer = 0;
  var _spawnCooldown  = 0;
  var _deathExplosions = [];   // fade-out tracking for crash VFX

  // ── Constants ──
  var SPAWN_WAVE_MIN    = 10;
  var SPAWN_EVERY_WAVES = 4;
  var MAX_HELICOPTERS   = 3;
  var SCORE_VALUE       = 1200;

  // ── Global registry (spec: window._helicopterEnemies = []) ──
  window._helicopterEnemies = window._helicopterEnemies || [];

  // ── Web Audio nodes keyed by heli id ──
  var _audioCtx    = null;
  var _engineNodes = {};

  // ── Compass blip DOM element ──
  var _blipEl = null;

  // ── Unique id counter ──
  var _nextId = 0;

  // ─────────────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────────────
  function _getPlayer() {
    try {
      if (window.GameManager && window.GameManager.getPlayer) return window.GameManager.getPlayer();
    } catch (e) {}
    return null;
  }

  function _getCamera() {
    try {
      if (window.GameManager && window.GameManager.getCamera) return window.GameManager.getCamera();
    } catch (e) {}
    return null;
  }

  function _getScene() {
    if (_scene) return _scene;
    try {
      if (window.GameManager && window.GameManager.getScene) {
        var s = window.GameManager.getScene();
        if (s) { _scene = s; }
      }
    } catch (e) {}
    return _scene;
  }

  function _terrainY(x, z) {
    try {
      if (window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
        return window.VoxelWorld.getTerrainHeight(x, z) || 0;
      }
    } catch (e) {}
    return 0;
  }

  function _getCurrentWave() {
    try {
      if (window.GameManager && window.GameManager.getWave) return window.GameManager.getWave();
      if (window.GameManager && typeof window.GameManager.wave === 'number') return window.GameManager.wave;
    } catch (e) {}
    return 0;
  }

  function _addScore(n) {
    try {
      if (window.GameManager && window.GameManager.addScore) window.GameManager.addScore(n);
      else if (window.ScoreSystem && window.ScoreSystem.add) window.ScoreSystem.add(n);
      else window._score = (window._score || 0) + n;
    } catch (e) {}
  }

  function _hudToast(msg, color) {
    try {
      var c = color || '#ff4444';
      if (window.HUD && window.HUD.notifyPickup) { window.HUD.notifyPickup(msg, c); return; }
      if (window.HUD && window.HUD.showToast)    { window.HUD.showToast(msg, 3000, c); }
    } catch (e) {}
  }

  function _damagePlayer(dmg) {
    try {
      var player = _getPlayer();
      if (!player || player.godMode) return;
      if (typeof player.hp === 'undefined') return;
      player.hp = Math.max(0, player.hp - dmg);
      if (window.HUD && window.HUD.setHealth)       window.HUD.setHealth(player.hp, player.maxHp || 100);
      if (window.HUD && window.HUD.showDamageFlash) window.HUD.showDamageFlash(0xff2200, 0.35);
      if (window.Feedback && window.Feedback.screenShake) window.Feedback.screenShake(0.25);
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────
  //  ENGINE AUDIO  (8 Hz AM modulation on low-freq noise)
  // ─────────────────────────────────────────────────────────────────
  function _startEngineSound(heliId) {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_engineNodes[heliId]) return;

      var ctx = _audioCtx;
      var bufLen = ctx.sampleRate * 2;
      var noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var nd = noiseBuf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) nd[i] = Math.random() * 2 - 1;

      var noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      noise.loop = true;

      var lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 110;
      lpf.Q.value = 7;

      // 8 Hz AM oscillator
      var amOsc = ctx.createOscillator();
      amOsc.type = 'sine';
      amOsc.frequency.value = 8;
      var amGain = ctx.createGain();
      amGain.gain.value = 0.35;
      amOsc.connect(amGain);

      // Carrier gain — AM modulates it
      var carrierGain = ctx.createGain();
      carrierGain.gain.value = 0.5;
      amGain.connect(carrierGain.gain);

      var masterGain = ctx.createGain();
      masterGain.gain.value = 0.15;

      noise.connect(lpf);
      lpf.connect(carrierGain);
      carrierGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      noise.start();
      amOsc.start();

      _engineNodes[heliId] = {
        noise: noise, amOsc: amOsc,
        lpf: lpf, masterGain: masterGain
      };
    } catch (e) {}
  }

  function _stopEngineSound(heliId) {
    try {
      var nd = _engineNodes[heliId];
      if (!nd) return;
      try { nd.noise.stop(); } catch (e) {}
      try { nd.amOsc.stop(); } catch (e) {}
      delete _engineNodes[heliId];
    } catch (e) {}
  }

  function _updateEngineAudio(heliId, hpRatio) {
    try {
      var nd = _engineNodes[heliId];
      if (!nd) return;
      // Slow down low-pass cutoff at low HP (rotor sound degrading)
      nd.lpf.frequency.value = 60 + hpRatio * 60;
      nd.masterGain.gain.value = 0.06 + hpRatio * 0.09;
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────
  //  HUD COMPASS BLIP
  // ─────────────────────────────────────────────────────────────────
  function _ensureBlip() {
    if (_blipEl) return;
    try {
      var compass = document.getElementById('tactical-compass');
      if (!compass) return;
      _blipEl = document.createElement('div');
      _blipEl.id = 'heli-compass-blip';
      _blipEl.style.cssText =
        'position:absolute;top:50%;width:8px;height:8px;' +
        'background:#ff2222;border-radius:50%;' +
        'transform:translate(-50%,-50%);' +
        'box-shadow:0 0 4px #ff0000;pointer-events:none;display:none;';
      compass.appendChild(_blipEl);
    } catch (e) {}
  }

  function _updateBlip() {
    try {
      if (!_blipEl) { _ensureBlip(); return; }
      var helis = window._helicopterEnemies;
      if (!helis || helis.length === 0) { _blipEl.style.display = 'none'; return; }

      var player = _getPlayer();
      if (!player || !player.position) { _blipEl.style.display = 'none'; return; }

      // Find nearest alive helicopter
      var nearest = null;
      var nearestDist = Infinity;
      for (var i = 0; i < helis.length; i++) {
        var h = helis[i];
        if (!h || !h.alive || !h.mesh) continue;
        var ddx = h.mesh.position.x - player.position.x;
        var ddz = h.mesh.position.z - player.position.z;
        var dd  = Math.sqrt(ddx * ddx + ddz * ddz);
        if (dd < nearestDist) { nearestDist = dd; nearest = h; }
      }
      if (!nearest) { _blipEl.style.display = 'none'; return; }

      var camera = _getCamera();
      var camYaw = 0;
      if (camera) {
        var fwd = new THREE.Vector3();
        camera.getWorldDirection(fwd);
        camYaw = Math.atan2(fwd.x, fwd.z);
      }
      var dx2 = nearest.mesh.position.x - player.position.x;
      var dz2 = nearest.mesh.position.z - player.position.z;
      var angleToHeli = Math.atan2(dx2, dz2);
      var relAngle = angleToHeli - camYaw;
      // Normalize to -PI..PI
      while (relAngle >  Math.PI) relAngle -= 2 * Math.PI;
      while (relAngle < -Math.PI) relAngle += 2 * Math.PI;
      // Map to compass bar percentage (centre = 0.5)
      var pct = 0.5 + relAngle / (Math.PI * 2);
      pct = Math.max(0.04, Math.min(0.96, pct));
      _blipEl.style.left    = (pct * 100).toFixed(1) + '%';
      _blipEl.style.display = 'block';
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────
  //  MESH CONSTRUCTION  (per spec geometry)
  // ─────────────────────────────────────────────────────────────────
  function _buildMesh() {
    var group = new THREE.Group();

    var bodyMat  = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var darkMat  = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
    var skidMat  = new THREE.MeshLambertMaterial({ color: 0x555544 });
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x223344, transparent: true, opacity: 0.6 });

    // ── Main body: BoxGeometry(1.5, 0.6, 3) ──
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 3), bodyMat);
    body.position.set(0, 0, 0);
    group.add(body);

    // ── Cockpit nose bubble ──
    var cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), glassMat);
    cockpit.position.set(0, 0, -1.7);
    group.add(cockpit);

    // ── Tail boom: BoxGeometry(0.3, 0.3, 2.5) behind body ──
    var tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 2.5), bodyMat);
    tailBoom.position.set(0, 0.08, 2.75);
    group.add(tailBoom);

    // ── Tail fin (vertical stabilizer) ──
    var tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.45), bodyMat);
    tailFin.position.set(0, 0.33, 3.85);
    group.add(tailFin);

    // ── Main rotor hub ──
    var rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 8), darkMat);
    rotorHub.position.set(0, 0.42, 0);
    group.add(rotorHub);

    // ── Main rotor: BoxGeometry(4, 0.06, 0.3) on top, spins on Y ──
    var mainRotorGroup = new THREE.Group();
    mainRotorGroup.position.set(0, 0.50, 0);
    var mainBlade1 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.06, 0.3), rotorMat);
    mainRotorGroup.add(mainBlade1);
    // Second blade (cross) for visual completeness
    var mainBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 4), rotorMat);
    mainRotorGroup.add(mainBlade2);
    group.add(mainRotorGroup);
    group.userData.mainRotor = mainRotorGroup;

    // ── Tail rotor: BoxGeometry(0.06, 0.6, 0.06) ──
    var tailRotorGroup = new THREE.Group();
    tailRotorGroup.position.set(0.20, 0.16, 3.95);
    var tailBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), rotorMat);
    tailRotorGroup.add(tailBlade1);
    var tailBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), rotorMat);
    tailRotorGroup.add(tailBlade2);
    group.add(tailRotorGroup);
    group.userData.tailRotor = tailRotorGroup;

    // ── Landing skids ──
    var skidL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 2.0), skidMat);
    skidL.position.set(-0.65, -0.38, 0);
    group.add(skidL);
    var skidR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 2.0), skidMat);
    skidR.position.set(0.65, -0.38, 0);
    group.add(skidR);
    // Struts connecting body to skids
    var strutPositions = [
      [-0.65, -0.38, -0.55], [-0.65, -0.38, 0.55],
      [ 0.65, -0.38, -0.55], [ 0.65, -0.38,  0.55]
    ];
    for (var si = 0; si < strutPositions.length; si++) {
      var strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.05), skidMat);
      strut.position.set(strutPositions[si][0], strutPositions[si][1] + 0.16, strutPositions[si][2]);
      group.add(strut);
    }

    // ── Minigun pod under nose ──
    var gunPod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.85, 6), darkMat);
    gunPod.rotation.x = Math.PI / 2;
    gunPod.position.set(0.32, -0.25, -1.45);
    group.add(gunPod);
    // World-space gun tip offset (local)
    group.userData.gunLocalPos = new THREE.Vector3(0.32, -0.25, -1.9);

    // ── SpotLight(0xFFFFFF, 3) searchlight cone ──
    var spotlight = new THREE.SpotLight(0xFFFFFF, 3, 35, Math.PI * 0.14, 0.28, 1.4);
    spotlight.position.set(0, -0.28, -0.4);
    var slTarget = new THREE.Object3D();
    slTarget.position.set(0, -10, -6);
    group.add(slTarget);
    spotlight.target = slTarget;
    group.add(spotlight);
    group.userData.searchlight = spotlight;
    group.userData.slTarget    = slTarget;

    return group;
  }

  // ─────────────────────────────────────────────────────────────────
  //  VFX HELPERS
  // ─────────────────────────────────────────────────────────────────
  function _spawnSmokePuff(scene, pos) {
    try {
      var puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 + Math.random() * 0.25, 5, 4),
        new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.6, depthWrite: false })
      );
      puff.position.copy(pos);
      puff.position.x += (Math.random() - 0.5) * 0.35;
      puff.position.z += (Math.random() - 0.5) * 0.35;
      scene.add(puff);
      return { mesh: puff, life: 0, maxLife: 1.0 + Math.random() * 0.6 };
    } catch (e) { return null; }
  }

  // Red tracer line from fromVec to toVec
  function _spawnTracer(scene, fromVec, toVec) {
    try {
      var dir = new THREE.Vector3().subVectors(toVec, fromVec);
      var len = dir.length();
      var mid = new THREE.Vector3().addVectors(fromVec, toVec).multiplyScalar(0.5);
      var geo = new THREE.CylinderGeometry(0.018, 0.018, len, 4);
      var mat = new THREE.MeshBasicMaterial({
        color: 0xff2222, transparent: true, opacity: 0.88, depthWrite: false
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(mid);
      var quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      mesh.quaternion.copy(quat);
      scene.add(mesh);
      return { mesh: mesh, life: 0, maxLife: 0.07 };
    } catch (e) { return null; }
  }

  // Orange rocket projectile with smoke trail
  function _spawnRocket(scene, fromPos, toPos) {
    try {
      var grp = new THREE.Group();
      var bodyGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.55, 6);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
      var rbody = new THREE.Mesh(bodyGeo, bodyMat);
      rbody.rotation.x = Math.PI / 2;
      grp.add(rbody);
      var glowGeo = new THREE.SphereGeometry(0.11, 5, 4);
      var glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00, transparent: true, opacity: 0.85, depthWrite: false
      });
      var glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.z = 0.32;
      grp.add(glow);

      grp.position.copy(fromPos);
      var dir = new THREE.Vector3().subVectors(toPos, fromPos).normalize();
      grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      scene.add(grp);

      return {
        mesh: grp,
        velocity: dir.clone().multiplyScalar(18),
        life: 0, maxLife: 6.0,
        smoke: [], smokeTimer: 0
      };
    } catch (e) { return null; }
  }

  function _rocketImpact(scene, pos, hitPlayer) {
    try {
      var flash = new THREE.Mesh(
        new THREE.SphereGeometry(2.0, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.92, depthWrite: false })
      );
      flash.position.copy(pos);
      scene.add(flash);
      setTimeout(function () { try { scene.remove(flash); } catch (e) {} }, 280);

      if (hitPlayer) {
        _damagePlayer(35);
        if (window.Feedback && window.Feedback.screenShake) window.Feedback.screenShake(0.9);
      }
      try {
        if (window.Enemies && window.Enemies.damageInRadius) {
          window.Enemies.damageInRadius(pos, 3.5, 50);
        }
      } catch (e) {}
      try {
        if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(0.55);
        else if (window.AudioSystem && window.AudioSystem.play) window.AudioSystem.play('explosion', 0.55);
      } catch (e) {}
    } catch (e) {}
  }

  // Death crash explosion + debris
  function _deathExplosion(scene, pos) {
    try {
      var flash = new THREE.Mesh(
        new THREE.SphereGeometry(4.5, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.95, depthWrite: false })
      );
      flash.position.copy(pos);
      scene.add(flash);

      var fire = new THREE.Mesh(
        new THREE.SphereGeometry(2.8, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.82, depthWrite: false })
      );
      fire.position.copy(pos);
      fire.position.y -= 0.4;
      scene.add(fire);

      var smoke = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 0.8, 9, 8),
        new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.72, depthWrite: false })
      );
      smoke.position.copy(pos);
      smoke.position.y += 4.5;
      scene.add(smoke);

      // Debris chunks
      var debrisList = [];
      for (var d = 0; d < 8; d++) {
        var dMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.18 + Math.random() * 0.38, 0.08 + Math.random() * 0.18, 0.18 + Math.random() * 0.38),
          new THREE.MeshLambertMaterial({ color: 0x444433 })
        );
        dMesh.position.copy(pos);
        var ang = Math.random() * Math.PI * 2;
        var spd = 3 + Math.random() * 5;
        debrisList.push({
          mesh:  dMesh,
          vx:    Math.cos(ang) * spd,
          vy:    4 + Math.random() * 6,
          vz:    Math.sin(ang) * spd,
          rvx:   (Math.random() - 0.5) * 8,
          rvz:   (Math.random() - 0.5) * 8
        });
        scene.add(dMesh);
      }

      // Audio + shake
      try {
        if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(1.0);
        else if (window.AudioSystem && window.AudioSystem.play) window.AudioSystem.play('explosion', 1.0);
      } catch (e) {}
      if (window.Feedback && window.Feedback.screenShake) window.Feedback.screenShake(1.8);

      return { flash: flash, fire: fire, smoke: smoke, debris: debrisList, life: 0, maxLife: 4.5 };
    } catch (e) { return null; }
  }

  // ─────────────────────────────────────────────────────────────────
  //  SPAWN ONE HELICOPTER
  // ─────────────────────────────────────────────────────────────────
  function spawn() {
    var scene = _getScene();
    if (!scene) return null;
    if (window._helicopterEnemies.length >= MAX_HELICOPTERS) return null;

    var player   = _getPlayer();
    var spawnX   = 0;
    var spawnZ   = 0;
    if (player && player.position) {
      var angle = Math.random() * Math.PI * 2;
      spawnX = player.position.x + Math.cos(angle) * 65;
      spawnZ = player.position.z + Math.sin(angle) * 65;
    }
    var spawnY = _terrainY(spawnX, spawnZ) + 11 + Math.random() * 4;

    var mesh = _buildMesh();
    mesh.position.set(spawnX, spawnY, spawnZ);
    scene.add(mesh);

    var id = ++_nextId;
    var heli = {
      id:           id,
      mesh:         mesh,
      hp:           400,
      maxHp:        400,
      alive:        true,
      dying:        false,
      deathTimer:   0,
      spinVelocity: 0,
      // Orbit parameters  (Y=8-12, radius 20-25)
      orbitRadius:  20 + Math.random() * 5,
      orbitHeight:   8 + Math.random() * 4,
      orbitAngle:   Math.random() * Math.PI * 2,
      orbitSpeed:   0.27 + Math.random() * 0.11,  // rad/s clockwise
      // Entry flight from edge
      entryPhase:   true,
      entryTimer:   0,
      entryMaxTime: 4.5,
      // Minigun  (10 dmg, 0.12 s rate)
      gunTimer:     0,
      gunRate:      0.12,
      // Rocket salvo  (every 10 s, 2 rockets)
      rocketTimer:  3 + Math.random() * 4,
      rocketRate:   10,
      rockets:      [],
      // VFX
      tracers:      [],
      smokePuffs:   [],
      smokeTimer:   0,
      // Death explosion ref (tracked in _deathExplosions once triggered)
      deathExpTracked: false
    };

    window._helicopterEnemies.push(heli);
    _startEngineSound(id);
    _hudToast('! HOSTILE AIRCRAFT DETECTED !', '#ff2222');
    return heli;
  }

  // ─────────────────────────────────────────────────────────────────
  //  MINIGUN FIRE
  // ─────────────────────────────────────────────────────────────────
  function _fireGun(heli, scene, playerPos) {
    var mesh = heli.mesh;
    var localGun = heli.mesh.userData.gunLocalPos || new THREE.Vector3(0.32, -0.25, -1.9);
    var worldGun = mesh.localToWorld(localGun.clone());

    // Target = player position with small random spread
    var targetPos = new THREE.Vector3(
      playerPos.x + (Math.random() - 0.5) * 1.4,
      (playerPos.y !== undefined ? playerPos.y : 1.5) + (Math.random() - 0.5) * 0.45,
      playerPos.z + (Math.random() - 0.5) * 1.4
    );

    var tracer = _spawnTracer(scene, worldGun, targetPos);
    if (tracer) heli.tracers.push(tracer);

    // Hit check
    var player = _getPlayer();
    if (player && player.position) {
      var dx = targetPos.x - player.position.x;
      var dz = targetPos.z - player.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.1) {
        _damagePlayer(10);
      }
    }

    try {
      if (window.AudioSystem && window.AudioSystem.playGunshot) window.AudioSystem.playGunshot(0.12);
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────
  //  ROCKET SALVO  (2 rockets)
  // ─────────────────────────────────────────────────────────────────
  function _fireRocketSalvo(heli, scene, playerPos) {
    var worldPos = heli.mesh.position.clone();
    for (var r = 0; r < 2; r++) {
      var fromPos = worldPos.clone();
      fromPos.x += (r === 0 ? -0.75 : 0.75);
      fromPos.y -= 0.25;
      var targetPos = new THREE.Vector3(
        playerPos.x + (Math.random() - 0.5) * 2.5,
        playerPos.y !== undefined ? playerPos.y : 0,
        playerPos.z + (Math.random() - 0.5) * 2.5
      );
      var rocket = _spawnRocket(scene, fromPos, targetPos);
      if (rocket) heli.rockets.push(rocket);
    }
    _hudToast('INCOMING ROCKETS', '#ff6600');
    try {
      if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(0.28);
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE ROCKETS
  // ─────────────────────────────────────────────────────────────────
  function _updateRockets(heli, dt, scene, playerPos) {
    for (var r = heli.rockets.length - 1; r >= 0; r--) {
      var rkt = heli.rockets[r];
      rkt.life += dt;
      if (rkt.life >= rkt.maxLife) {
        try { scene.remove(rkt.mesh); } catch (e) {}
        for (var si = 0; si < rkt.smoke.length; si++) {
          try { scene.remove(rkt.smoke[si].mesh); } catch (e) {}
        }
        heli.rockets.splice(r, 1);
        continue;
      }

      // Slight homing toward player
      var rp = rkt.mesh.position;
      var toPlayer = new THREE.Vector3(
        playerPos.x - rp.x,
        (playerPos.y !== undefined ? playerPos.y : 0) + 1 - rp.y,
        playerPos.z - rp.z
      ).normalize().multiplyScalar(18);
      rkt.velocity.lerp(toPlayer, dt * 0.75);

      rp.x += rkt.velocity.x * dt;
      rp.y += rkt.velocity.y * dt;
      rp.z += rkt.velocity.z * dt;

      // Orient along velocity
      var vDir = rkt.velocity.clone().normalize();
      if (vDir.length() > 0.001) {
        try {
          rkt.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vDir);
        } catch (e) {}
      }

      // Smoke puffs
      rkt.smokeTimer += dt;
      if (rkt.smokeTimer >= 0.04) {
        rkt.smokeTimer = 0;
        var puff = _spawnSmokePuff(scene, rp.clone());
        if (puff) rkt.smoke.push(puff);
      }
      // Age smoke puffs
      for (var sj = rkt.smoke.length - 1; sj >= 0; sj--) {
        var sp = rkt.smoke[sj];
        sp.life += dt;
        sp.mesh.position.y += dt * 1.4;
        sp.mesh.material.opacity = Math.max(0, 0.6 * (1 - sp.life / sp.maxLife));
        if (sp.life >= sp.maxLife) {
          try { scene.remove(sp.mesh); } catch (e) {}
          rkt.smoke.splice(sj, 1);
        }
      }

      // Hit detection
      var rdx = rp.x - playerPos.x;
      var rdy = rp.y - (playerPos.y !== undefined ? playerPos.y + 1 : 1);
      var rdz = rp.z - playerPos.z;
      var rdist = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
      var groundHit = rp.y < _terrainY(rp.x, rp.z) + 0.25;
      if (rdist < 2.2 || groundHit) {
        _rocketImpact(scene, rp.clone(), rdist < 2.2);
        for (var sk = rkt.smoke.length - 1; sk >= 0; sk--) {
          try { scene.remove(rkt.smoke[sk].mesh); } catch (e) {}
        }
        try { scene.remove(rkt.mesh); } catch (e) {}
        heli.rockets.splice(r, 1);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  UPDATE ONE LIVE HELICOPTER
  // ─────────────────────────────────────────────────────────────────
  function _updateHeli(heli, dt, scene) {
    var player    = _getPlayer();
    var playerPos = (player && player.position) ? player.position : new THREE.Vector3(0, 0, 0);
    var mesh      = heli.mesh;
    var pos       = mesh.position;
    var hpRatio   = heli.hp / heli.maxHp;

    // ── Entry flight: approach orbit circle ──
    if (heli.entryPhase) {
      heli.entryTimer += dt;
      var tgtX = playerPos.x + Math.cos(heli.orbitAngle) * heli.orbitRadius;
      var tgtZ = playerPos.z + Math.sin(heli.orbitAngle) * heli.orbitRadius;
      var tgtY = _terrainY(tgtX, tgtZ) + heli.orbitHeight;
      pos.x += (tgtX - pos.x) * dt * 1.4;
      pos.y += (tgtY - pos.y) * dt * 1.4;
      pos.z += (tgtZ - pos.z) * dt * 1.4;
      if (heli.entryTimer >= heli.entryMaxTime) heli.entryPhase = false;
    } else {
      // ── Orbit behaviour ──
      var erratic   = hpRatio <= 0.25;
      var spdMult   = erratic ? (0.45 + Math.random() * 0.45) : 1.0;

      if (erratic) {
        heli.orbitHeight += (Math.random() - 0.5) * dt * 2.8;
        heli.orbitHeight  = Math.max(4, Math.min(14, heli.orbitHeight));
        heli.orbitRadius += (Math.random() - 0.5) * dt * 1.8;
        heli.orbitRadius  = Math.max(14, Math.min(28, heli.orbitRadius));
      }

      // Clockwise orbit: angle decreases over time
      heli.orbitAngle -= heli.orbitSpeed * spdMult * dt;

      var orbitX = playerPos.x + Math.cos(heli.orbitAngle) * heli.orbitRadius;
      var orbitZ = playerPos.z + Math.sin(heli.orbitAngle) * heli.orbitRadius;
      var orbitY = _terrainY(orbitX, orbitZ) + heli.orbitHeight;

      var lerpRate = erratic ? 1.4 : 2.4;
      pos.x += (orbitX - pos.x) * dt * lerpRate;
      pos.y += (orbitY - pos.y) * dt * lerpRate;
      pos.z += (orbitZ - pos.z) * dt * lerpRate;

      // Face player (yaw)
      var faceYaw = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
      mesh.rotation.y = faceYaw;

      // Banking roll
      mesh.rotation.z = -0.14 * spdMult + (erratic ? (Math.random() - 0.5) * 0.18 : 0);
    }

    // ── Rotor spin: main rotor += 12 * dt, tail rotor perpendicular ──
    var rotorMult = hpRatio <= 0.25 ? Math.max(0.25, hpRatio * 4) : 1.0;
    if (mesh.userData.mainRotor) {
      mesh.userData.mainRotor.rotation.y += 12 * rotorMult * dt;
    }
    if (mesh.userData.tailRotor) {
      // Tail rotor spins on Z (perpendicular to main Y-axis spin)
      mesh.userData.tailRotor.rotation.z += 18 * rotorMult * dt;
    }

    // ── Searchlight: sweep cone toward player ──
    try {
      var slTarget = mesh.userData.slTarget;
      if (slTarget) {
        var worldTarget = new THREE.Vector3(playerPos.x, playerPos.y || 0, playerPos.z);
        // Convert to local space of group
        mesh.worldToLocal(worldTarget);
        slTarget.position.copy(worldTarget);
        if (slTarget.updateMatrixWorld) slTarget.updateMatrixWorld();
      }
    } catch (e) {}

    // ── Distance to player ──
    var pdx = pos.x - playerPos.x;
    var pdz = pos.z - playerPos.z;
    var distToPlayer = Math.sqrt(pdx * pdx + pdz * pdz);

    // ── Minigun (within 30 units) ──
    if (!heli.entryPhase && distToPlayer < 30) {
      heli.gunTimer += dt;
      if (heli.gunTimer >= heli.gunRate) {
        heli.gunTimer = 0;
        _fireGun(heli, scene, playerPos);
      }
    }

    // ── Rocket salvo (every 10 s) ──
    if (!heli.entryPhase) {
      heli.rocketTimer += dt;
      if (heli.rocketTimer >= heli.rocketRate) {
        heli.rocketTimer = 0;
        _fireRocketSalvo(heli, scene, playerPos);
      }
    }

    // ── Update tracer lifetimes ──
    for (var t = heli.tracers.length - 1; t >= 0; t--) {
      var tr = heli.tracers[t];
      tr.life += dt;
      if (tr.life >= tr.maxLife) {
        try { scene.remove(tr.mesh); } catch (e) {}
        heli.tracers.splice(t, 1);
      }
    }

    // ── Rockets ──
    _updateRockets(heli, dt, scene, playerPos);

    // ── Damage-state smoke (≤ 50% HP) ──
    if (hpRatio <= 0.50) {
      heli.smokeTimer += dt;
      var smokeRate = hpRatio <= 0.25 ? 0.07 : 0.16;
      if (heli.smokeTimer >= smokeRate) {
        heli.smokeTimer = 0;
        var sp2 = _spawnSmokePuff(scene, pos.clone());
        if (sp2) heli.smokePuffs.push(sp2);
      }
    }

    // Age smoke puffs
    for (var spi = heli.smokePuffs.length - 1; spi >= 0; spi--) {
      var spk = heli.smokePuffs[spi];
      spk.life += dt;
      spk.mesh.position.y += dt * 1.7;
      spk.mesh.material.opacity = Math.max(0, 0.6 * (1 - spk.life / spk.maxLife));
      if (spk.life >= spk.maxLife) {
        try { scene.remove(spk.mesh); } catch (e) {}
        heli.smokePuffs.splice(spi, 1);
      }
    }

    // ── Engine audio pitch ──
    _updateEngineAudio(heli.id, hpRatio);

    // ── Die check ──
    if (heli.hp <= 0 && !heli.dying) {
      heli.dying = true;
      try {
        var sl = mesh.userData.searchlight;
        if (sl) sl.intensity = 0;
      } catch (e) {}
      _hudToast('HELICOPTER DOWN!', '#00ff88');
      _addScore(SCORE_VALUE);
      try {
        if (window.GameManager && window.GameManager.onEnemyKilled) {
          window.GameManager.onEnemyKilled({ type: 'helicopter', score: SCORE_VALUE });
        }
      } catch (e) {}
      try {
        if (window.AudioSystem && window.AudioSystem.playEnemyDeath) window.AudioSystem.playEnemyDeath(1.0);
      } catch (e) {}
    }
  }

  // ── Death spin-out animation ──
  function _updateDying(heli, dt, scene) {
    heli.deathTimer += dt;
    var mesh = heli.mesh;

    // Increasing rotation.z spin-out
    heli.spinVelocity += dt * 3.2;
    mesh.rotation.z += heli.spinVelocity * dt;
    mesh.rotation.x += heli.spinVelocity * dt * 0.35;
    // Fall
    mesh.position.y -= dt * (1.8 + heli.deathTimer * 4.5);

    // Rotor slows
    if (mesh.userData.mainRotor) {
      mesh.userData.mainRotor.rotation.y += Math.max(0.4, 7 - heli.deathTimer * 4) * dt;
    }

    // Continuous smoke
    var sp = _spawnSmokePuff(scene, mesh.position.clone());
    if (sp) { sp.maxLife = 1.6; heli.smokePuffs.push(sp); }

    // Crash when near ground or timeout
    var gnd = _terrainY(mesh.position.x, mesh.position.z);
    if (mesh.position.y <= gnd + 0.4 || heli.deathTimer > 5.5) {
      var exp = _deathExplosion(scene, mesh.position.clone());
      if (exp) {
        _deathExplosions.push(exp);
        heli.deathExpTracked = true;
      }
      try { scene.remove(mesh); } catch (e) {}
      _stopEngineSound(heli.id);
      heli.alive = false;

      // Clean rockets
      for (var ri = 0; ri < heli.rockets.length; ri++) {
        try { scene.remove(heli.rockets[ri].mesh); } catch (e) {}
        for (var rsi = 0; rsi < heli.rockets[ri].smoke.length; rsi++) {
          try { scene.remove(heli.rockets[ri].smoke[rsi].mesh); } catch (e) {}
        }
      }
      heli.rockets.length = 0;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  PUBLIC: init
  // ─────────────────────────────────────────────────────────────────
  function init(scene) {
    _scene = scene || _getScene();
    window._helicopterEnemies = window._helicopterEnemies || [];
    _ensureBlip();
  }

  // ─────────────────────────────────────────────────────────────────
  //  PUBLIC: update
  // ─────────────────────────────────────────────────────────────────
  function update(dt) {
    var scene = _getScene();
    if (!scene) return;

    // ── Wave-based auto-spawn check (every 2 s) ──
    _spawnCooldown  -= dt;
    _waveCheckTimer += dt;
    if (_waveCheckTimer >= 2.0) {
      _waveCheckTimer = 0;
      var wave = _getCurrentWave();
      if (wave >= SPAWN_WAVE_MIN && _spawnCooldown <= 0) {
        var wavesSince = (wave - SPAWN_WAVE_MIN) % SPAWN_EVERY_WAVES;
        if (wavesSince === 0 && window._helicopterEnemies.length === 0) {
          spawn();
          _spawnCooldown = 65;
        }
      }
    }

    // ── Update helicopters ──
    for (var i = window._helicopterEnemies.length - 1; i >= 0; i--) {
      var heli = window._helicopterEnemies[i];
      if (!heli) { window._helicopterEnemies.splice(i, 1); continue; }

      if (heli.alive) {
        if (heli.dying) {
          _updateDying(heli, dt, scene);
        } else {
          _updateHeli(heli, dt, scene);
        }
      } else {
        // Dead — clean remaining smoke puffs then remove
        for (var spi = 0; spi < heli.smokePuffs.length; spi++) {
          try { scene.remove(heli.smokePuffs[spi].mesh); } catch (e) {}
        }
        heli.smokePuffs.length = 0;
        window._helicopterEnemies.splice(i, 1);
      }
    }

    // ── Fade death explosions ──
    for (var de = _deathExplosions.length - 1; de >= 0; de--) {
      var exp = _deathExplosions[de];
      exp.life += dt;
      var k = exp.life / exp.maxLife;

      if (exp.flash) {
        exp.flash.scale.setScalar(1 + k * 2.2);
        exp.flash.material.opacity = Math.max(0, 0.95 * (1 - k * 1.3));
      }
      if (exp.fire) {
        exp.fire.scale.setScalar(1 + k * 1.6);
        exp.fire.material.opacity = Math.max(0, 0.82 * (1 - k * 1.2));
      }
      if (exp.smoke) {
        exp.smoke.position.y += dt * 2.2;
        exp.smoke.scale.y     = 1 + k * 2.0;
        exp.smoke.material.opacity = Math.max(0, 0.72 * (1 - k * 0.85));
      }
      if (exp.debris) {
        for (var db = 0; db < exp.debris.length; db++) {
          var dbp = exp.debris[db];
          dbp.mesh.position.x += dbp.vx * dt;
          dbp.mesh.position.y += dbp.vy * dt;
          dbp.mesh.position.z += dbp.vz * dt;
          dbp.vy -= 9.8 * dt;
          dbp.mesh.rotation.x += dbp.rvx * dt;
          dbp.mesh.rotation.z += dbp.rvz * dt;
        }
      }
      if (k >= 1) {
        try { if (exp.flash)  scene.remove(exp.flash);  } catch (e) {}
        try { if (exp.fire)   scene.remove(exp.fire);   } catch (e) {}
        try { if (exp.smoke)  scene.remove(exp.smoke);  } catch (e) {}
        if (exp.debris) {
          for (var db2 = 0; db2 < exp.debris.length; db2++) {
            try { scene.remove(exp.debris[db2].mesh); } catch (e) {}
          }
        }
        _deathExplosions.splice(de, 1);
      }
    }

    // ── HUD compass blip ──
    _updateBlip();
  }

  // ─────────────────────────────────────────────────────────────────
  //  PUBLIC: reset
  // ─────────────────────────────────────────────────────────────────
  function reset() {
    var scene = _getScene();

    for (var i = 0; i < window._helicopterEnemies.length; i++) {
      var heli = window._helicopterEnemies[i];
      if (!heli) continue;
      try { if (scene && heli.mesh) scene.remove(heli.mesh); } catch (e) {}
      for (var ri = 0; ri < heli.rockets.length; ri++) {
        try { if (scene) scene.remove(heli.rockets[ri].mesh); } catch (e) {}
        for (var rsi = 0; rsi < heli.rockets[ri].smoke.length; rsi++) {
          try { if (scene) scene.remove(heli.rockets[ri].smoke[rsi].mesh); } catch (e) {}
        }
      }
      for (var spi = 0; spi < heli.smokePuffs.length; spi++) {
        try { if (scene) scene.remove(heli.smokePuffs[spi].mesh); } catch (e) {}
      }
      for (var tri = 0; tri < heli.tracers.length; tri++) {
        try { if (scene) scene.remove(heli.tracers[tri].mesh); } catch (e) {}
      }
      _stopEngineSound(heli.id);
    }
    window._helicopterEnemies.length = 0;

    for (var de = 0; de < _deathExplosions.length; de++) {
      var exp = _deathExplosions[de];
      try { if (scene && exp.flash)  scene.remove(exp.flash);  } catch (e) {}
      try { if (scene && exp.fire)   scene.remove(exp.fire);   } catch (e) {}
      try { if (scene && exp.smoke)  scene.remove(exp.smoke);  } catch (e) {}
      if (exp.debris) {
        for (var db = 0; db < exp.debris.length; db++) {
          try { if (scene) scene.remove(exp.debris[db].mesh); } catch (e) {}
        }
      }
    }
    _deathExplosions.length = 0;

    _spawnCooldown  = 0;
    _waveCheckTimer = 0;
    if (_blipEl) _blipEl.style.display = 'none';
  }

  return { init: init, update: update, spawn: spawn, reset: reset };
})();
