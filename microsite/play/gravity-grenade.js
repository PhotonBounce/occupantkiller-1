// gravity-grenade.js — Gravity Grenade: creates a temporary black hole that pulls enemies
// Key: Ctrl+G to throw (2 charges, 35s cooldown)
// No let/const — only var throughout, IIFE pattern
window.GravityGrenade = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var MAX_CHARGES = 2;
  var COOLDOWN_DURATION = 35;       // seconds per charge restock
  var WELL_DURATION = 4;            // seconds the gravity well is active
  var PULL_RADIUS = 12;             // units — enemies within this get pulled
  var PULL_SPEED = 3;               // units/s pull toward well
  var PULL_DPS = 5;                 // damage per second to pulled enemies
  var IMPLOSION_RADIUS = 4;         // units for final implosion damage
  var IMPLOSION_DAMAGE = 60;        // damage on implosion
  var PULL_SCORE = 100;             // score per enemy hit by gravity pull
  var SHAKE_MAG = 0.4;
  var SHAKE_DUR = 0.2;

  // Grenade physics
  var THROW_SPEED = 14;             // initial speed
  var GRAVITY = 12;                 // downward accel
  var BOUNCE_DAMP = 0.35;           // energy kept on bounce
  var GRENADE_RADIUS = 0.15;        // visual sphere radius

  // Well visuals
  var WELL_SPHERE_RADIUS = 0.5;
  var ORB_COUNT = 8;
  var ORB_RADIUS = 0.08;
  var ORBIT_RADIUS_START = 1.8;
  var ORBIT_RADIUS_END = 0.4;

  // ── Module state ──────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _onHit = null;            // callback(pos, isPlayer, amount)

  var _charges = MAX_CHARGES;
  var _cooldownTimer = 0;       // counts down to next charge restock

  var _projectiles = [];        // in-flight grenades
  var _wells = [];              // active gravity wells

  // Audio: shared AudioContext (reuse window._audioCtx if available)
  var _audioCtx = null;
  var _bassNodes = [];          // oscillator/gain pairs for bass hum per well

  // Canvas distortion state
  var _distortTimer = 0;
  var _canvas = null;

  // ── HUD ──────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('gravity-grenade-hud')) return;
    var el = document.createElement('div');
    el.id = 'gravity-grenade-hud';
    el.style.cssText = [
      'position:fixed',
      'bottom:172px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#cc88ff',
      'background:rgba(0,0,0,0.65)',
      'padding:4px 10px',
      'border-radius:4px',
      'z-index:1001',
      'pointer-events:none',
      'user-select:none',
      'border:1px solid rgba(102,0,204,0.55)',
      'display:none',
    ].join(';');
    document.body.appendChild(el);
  }

  function _updateHUD() {
    var el = document.getElementById('gravity-grenade-hud');
    if (!el) return;

    var chargeStr = '';
    for (var ci = 0; ci < MAX_CHARGES; ci++) {
      chargeStr += ci < _charges ? '●' : '○';
    }
    var cooldownStr = '';
    if (_cooldownTimer > 0) {
      cooldownStr = ' <span style="color:#888">(' + Math.ceil(_cooldownTimer) + 's)</span>';
    }
    el.style.display = 'block';
    el.innerHTML = '🌀 GRAVITY ' + chargeStr + cooldownStr;
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx && _audioCtx.state !== 'closed') return _audioCtx;
    if (window._audioCtx && window._audioCtx.state !== 'closed') {
      _audioCtx = window._audioCtx;
      return _audioCtx;
    }
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        _audioCtx = new Ctx();
        window._audioCtx = _audioCtx;
        return _audioCtx;
      }
    } catch (e) {}
    return null;
  }

  function _startBassHum() {
    var ctx = _getAudioCtx();
    if (!ctx) return null;
    try {
      // 50Hz subharmonic sine
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(50, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      // Second harmonic — 100Hz
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(100, ctx.currentTime);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      return { osc: osc, gain: gain, osc2: osc2, gain2: gain2, stopped: false };
    } catch (e) {
      return null;
    }
  }

  function _stopBassHum(node) {
    if (!node || node.stopped) return;
    node.stopped = true;
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      node.gain.gain.setValueAtTime(node.gain.gain.value, ctx.currentTime);
      node.gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      node.osc.stop(ctx.currentTime + 0.26);
      node.gain2.gain.setValueAtTime(node.gain2.gain.value, ctx.currentTime);
      node.gain2.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      node.osc2.stop(ctx.currentTime + 0.26);
    } catch (e) {}
  }

  function _playImplosionCrack() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Rising pitch to crack
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.18);
      osc.frequency.exponentialRampToValueAtTime(6000, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
      // Low boom
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(80, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 0.5);
      gain2.gain.setValueAtTime(1.8, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.56);
    } catch (e) {}
  }

  function _playBounceTick() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  }

  // ── Ground height helper ──────────────────────────────────────────────────
  function _groundY(x, z) {
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      return VoxelWorld.getTerrainHeight(x, z);
    }
    if (typeof player !== 'undefined' && player.position) {
      return player.position.y - 1.6;
    }
    return 0;
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  function _showToast(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast(msg, 2500, color || '#cc88ff');
    } else if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, color || '#cc88ff');
    }
  }

  // ── Screen shake helper ───────────────────────────────────────────────────
  function _shake(mag, dur) {
    if (typeof Feedback !== 'undefined' && Feedback.screenShake) {
      Feedback.screenShake(mag);
    } else if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(mag, dur);
    } else {
      window._cameraShake = { intensity: mag, duration: dur };
    }
  }

  // ── Canvas distortion ─────────────────────────────────────────────────────
  function _findCanvas() {
    if (_canvas) return _canvas;
    _canvas = document.querySelector('canvas');
    return _canvas;
  }

  function _applyCanvasDistortion(t) {
    // t: 0..1, intensity of distortion
    var cvs = _findCanvas();
    if (!cvs) return;
    if (t <= 0) {
      cvs.style.transform = '';
      cvs.style.perspective = '';
      return;
    }
    var skew = (Math.sin(Date.now() * 0.005) * 0.3 * t).toFixed(3);
    cvs.style.transform = 'perspective(600px) rotateX(' + skew + 'deg)';
  }

  function _clearCanvasDistortion() {
    var cvs = _findCanvas();
    if (!cvs) return;
    cvs.style.transform = '';
    cvs.style.perspective = '';
  }

  // ── Build in-flight grenade mesh ──────────────────────────────────────────
  function _buildGrenadeMesh() {
    var geo = new THREE.SphereGeometry(GRENADE_RADIUS, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x111133 });
    var mesh = new THREE.Mesh(geo, mat);
    var light = new THREE.PointLight(0x6600cc, 1.5, 1.5);
    mesh.add(light);
    return { mesh: mesh, light: light, mat: mat };
  }

  // ── Build gravity well VFX ────────────────────────────────────────────────
  function _buildWellVFX(pos) {
    var group = new THREE.Group();
    group.position.copy(pos);

    // Event horizon sphere
    var horizonGeo = new THREE.SphereGeometry(WELL_SPHERE_RADIUS, 12, 12);
    var horizonMat = new THREE.MeshLambertMaterial({
      color: 0x110022,
      transparent: true,
      opacity: 0.92,
    });
    var horizon = new THREE.Mesh(horizonGeo, horizonMat);
    group.add(horizon);

    // Purple point light
    var light = new THREE.PointLight(0x6600cc, 12, 15);
    group.add(light);

    // Orbiting particle orbs
    var orbGeo = new THREE.SphereGeometry(ORB_RADIUS, 6, 6);
    var orbs = [];
    for (var oi = 0; oi < ORB_COUNT; oi++) {
      var orbColor = oi % 2 === 0 ? 0x8844aa : 0x444455;
      var orbMat = new THREE.MeshLambertMaterial({ color: orbColor });
      var orb = new THREE.Mesh(orbGeo, orbMat);
      group.add(orb);
      orbs.push({ mesh: orb, angle: (oi / ORB_COUNT) * Math.PI * 2, mat: orbMat });
    }

    return {
      group: group,
      horizon: horizon,
      horizonMat: horizonMat,
      light: light,
      orbs: orbs,
    };
  }

  // ── Score helper ──────────────────────────────────────────────────────────
  function _addScore(amount) {
    if (typeof window.addScore === 'function') {
      window.addScore(amount);
    } else if (typeof player !== 'undefined' && typeof player.score !== 'undefined') {
      player.score += amount;
    }
  }

  // ── Throw the grenade ─────────────────────────────────────────────────────
  function _throw() {
    if (!_scene || !_camera) return;
    if (_charges <= 0) {
      _showToast('🌀 Gravity Grenade recharging... ' + Math.ceil(_cooldownTimer) + 's', '#ff8800');
      return;
    }

    _charges--;
    if (_cooldownTimer <= 0) {
      _cooldownTimer = COOLDOWN_DURATION;
    }
    _updateHUD();

    // Build projectile
    var built = _buildGrenadeMesh();
    built.mesh.position.copy(_camera.position);

    // Throw direction: where camera looks, slightly upward arc
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion).normalize();
    var vel = new THREE.Vector3(
      dir.x * THROW_SPEED,
      dir.y * THROW_SPEED + 3.5,   // upward bias for arc
      dir.z * THROW_SPEED
    );

    if (_scene) _scene.add(built.mesh);

    var proj = {
      mesh: built.mesh,
      light: built.light,
      mat: built.mat,
      vel: vel,
      landed: false,
      bounces: 0,
      active: true,
    };
    _projectiles.push(proj);
    _showToast('🌀 GRAVITY GRENADE THROWN', '#cc88ff');
  }

  // ── Land: convert projectile into gravity well ────────────────────────────
  function _land(proj) {
    if (!proj.active) return;
    proj.active = false;
    proj.landed = true;

    var pos = proj.mesh.position.clone();

    // Remove in-flight mesh
    if (_scene) _scene.remove(proj.mesh);

    // Build well VFX at landing spot
    var vfx = _buildWellVFX(pos);
    if (_scene) _scene.add(vfx.group);

    // Start bass hum
    var bassNode = _startBassHum();

    var well = {
      pos: pos,
      vfx: vfx,
      timer: WELL_DURATION,
      bassNode: bassNode,
      dmgTimers: {},        // track last damage time per enemy id
      scoreTimers: {},      // track last score award per enemy id
      orbAngleOffset: 0,
      active: true,
    };
    _wells.push(well);
    _distortTimer = WELL_DURATION;
  }

  // ── Update a single in-flight projectile ─────────────────────────────────
  function _updateProjectile(proj, dt) {
    if (!proj.active || proj.landed) return false;

    // Apply gravity
    proj.vel.y -= GRAVITY * dt;
    proj.mesh.position.x += proj.vel.x * dt;
    proj.mesh.position.y += proj.vel.y * dt;
    proj.mesh.position.z += proj.vel.z * dt;

    // Spin visual
    proj.mesh.rotation.x += proj.vel.length() * dt * 1.5;
    proj.mesh.rotation.z += proj.vel.length() * dt * 0.8;

    // Ground check
    var gY = _groundY(proj.mesh.position.x, proj.mesh.position.z) + GRENADE_RADIUS;
    if (proj.mesh.position.y <= gY) {
      proj.mesh.position.y = gY;
      if (proj.bounces < 2 && Math.abs(proj.vel.y) > 1.5) {
        // Bounce
        proj.vel.y = -proj.vel.y * BOUNCE_DAMP;
        proj.vel.x *= 0.7;
        proj.vel.z *= 0.7;
        proj.bounces++;
        _playBounceTick();
      } else {
        // Land
        _land(proj);
        return true; // remove from list
      }
    }
    return false;
  }

  // ── Implode: final burst when well expires ────────────────────────────────
  function _implode(well) {
    if (!well.active) return;
    well.active = false;

    var pos = well.pos;

    // Stop hum
    _stopBassHum(well.bassNode);

    // Remove well VFX
    if (_scene) _scene.remove(well.vfx.group);

    // Play crack
    _playImplosionCrack();

    // Screen shake
    _shake(SHAKE_MAG, SHAKE_DUR);

    // Damage enemies within implosion radius
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      var enemies = Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        var ep = en.mesh.position;
        var dx = ep.x - pos.x;
        var dz = ep.z - pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= IMPLOSION_RADIUS) {
          if (typeof Enemies.damage === 'function') {
            Enemies.damage(en, IMPLOSION_DAMAGE);
          }
        }
      }
    }

    // Mini-explosion: particles fly OUT (reverse of implosion)
    var expLight = new THREE.PointLight(0x9900ff, 30, 10);
    expLight.position.copy(pos);
    expLight.position.y += 0.5;
    if (_scene) _scene.add(expLight);

    var debGeo = new THREE.SphereGeometry(0.08, 5, 5);
    var debMat = new THREE.MeshLambertMaterial({ color: 0x8844cc });
    var particles = [];
    for (var pi = 0; pi < 12; pi++) {
      var p = new THREE.Mesh(debGeo, debMat);
      p.position.copy(pos);
      p.position.y += 0.3;
      var angle = (pi / 12) * Math.PI * 2;
      var spd = 4 + Math.random() * 5;
      particles.push({
        mesh: p,
        vel: {
          x: Math.sin(angle) * spd,
          y: 2 + Math.random() * 5,
          z: Math.cos(angle) * spd,
        },
        life: 0.6 + Math.random() * 0.5,
      });
      if (_scene) _scene.add(p);
    }

    // Animate burst
    var sceneRef = _scene;
    var startTime = null;
    function animateBurst(ts) {
      if (!startTime) startTime = ts;
      var t = (ts - startTime) / 1000;

      // Fade explosion light
      if (t < 0.4) {
        expLight.intensity = 30 * (1 - t / 0.4);
      } else {
        if (sceneRef) sceneRef.remove(expLight);
      }

      // Move particles
      var anyAlive = false;
      for (var i = 0; i < particles.length; i++) {
        var dp = particles[i];
        if (!dp || dp.life <= 0) continue;
        dp.life -= 0.016;
        dp.vel.y -= GRAVITY * 0.016;
        dp.mesh.position.x += dp.vel.x * 0.016;
        dp.mesh.position.y += dp.vel.y * 0.016;
        dp.mesh.position.z += dp.vel.z * 0.016;
        if (dp.mesh.position.y < _groundY(dp.mesh.position.x, dp.mesh.position.z)) {
          dp.mesh.position.y = _groundY(dp.mesh.position.x, dp.mesh.position.z);
          dp.vel.y = 0;
        }
        if (dp.life <= 0) {
          if (sceneRef) sceneRef.remove(dp.mesh);
          particles[i] = null;
        } else {
          anyAlive = true;
        }
      }

      if (t < 0.4 || anyAlive) {
        requestAnimationFrame(animateBurst);
      }
    }
    requestAnimationFrame(animateBurst);
  }

  // ── Update a single gravity well ──────────────────────────────────────────
  function _updateWell(well, dt) {
    if (!well.active) return;

    well.timer -= dt;
    var progress = 1 - (well.timer / WELL_DURATION); // 0..1 over lifetime

    // Pulse event horizon sphere (scale 0.8–1.2)
    var pulse = 0.8 + 0.4 * (0.5 + 0.5 * Math.sin(Date.now() * 0.006));
    well.vfx.horizon.scale.set(pulse, pulse, pulse);

    // Orbit radius shrinks over time
    var orbitR = ORBIT_RADIUS_START + (ORBIT_RADIUS_END - ORBIT_RADIUS_START) * progress;

    // Orbit speed increases as well strengthens
    well.orbAngleOffset += dt * (1.5 + progress * 2.5);

    for (var oi = 0; oi < well.vfx.orbs.length; oi++) {
      var orb = well.vfx.orbs[oi];
      var angle = orb.angle + well.orbAngleOffset;
      orb.mesh.position.set(
        Math.cos(angle) * orbitR,
        0.05 * Math.sin(angle * 2),  // slight vertical wobble
        Math.sin(angle) * orbitR
      );
    }

    // Light intensity pulses
    well.vfx.light.intensity = 10 + 4 * Math.sin(Date.now() * 0.008);

    // Canvas distortion: stronger when well is active nearby
    if (typeof player !== 'undefined' && player.position) {
      var pdx = player.position.x - well.pos.x;
      var pdz = player.position.z - well.pos.z;
      var playerDist = Math.sqrt(pdx * pdx + pdz * pdz);
      var distortIntensity = Math.max(0, 1 - playerDist / 15) * 0.6;
      _applyCanvasDistortion(distortIntensity);
    }

    // Pull and damage enemies
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      var enemies = Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        var ep = en.mesh.position;
        var dx = ep.x - well.pos.x;
        var dz = ep.z - well.pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= PULL_RADIUS) {
          // Lerp enemy toward well
          ep.x += (well.pos.x - ep.x) * Math.min(1, (PULL_SPEED * dt) / Math.max(0.1, dist));
          ep.z += (well.pos.z - ep.z) * Math.min(1, (PULL_SPEED * dt) / Math.max(0.1, dist));

          // Damage per second
          var eid = en.id || ei;
          well.dmgTimers[eid] = (well.dmgTimers[eid] || 0) + dt;
          if (well.dmgTimers[eid] >= 1) {
            well.dmgTimers[eid] -= 1;
            if (typeof Enemies.damage === 'function') {
              Enemies.damage(en, PULL_DPS);
            }
          }

          // Score per enemy hit by pull (+100 per enemy, once per 1.5s)
          well.scoreTimers[eid] = (well.scoreTimers[eid] || 0) + dt;
          if (well.scoreTimers[eid] >= 1.5) {
            well.scoreTimers[eid] -= 1.5;
            _addScore(PULL_SCORE);
          }
        }
      }
    }

    // Player damage callback (minimal — sucked in counts as hazard)
    if (_onHit && typeof player !== 'undefined' && player.position) {
      var ppx = player.position.x - well.pos.x;
      var ppz = player.position.z - well.pos.z;
      var pDist = Math.sqrt(ppx * ppx + ppz * ppz);
      if (pDist <= 2) {
        // Very close — slight pull damage
        var pullDmgTimer = (well._playerDmgTimer || 0) + dt;
        well._playerDmgTimer = pullDmgTimer;
        if (pullDmgTimer >= 1) {
          well._playerDmgTimer = 0;
          _onHit(well.pos, true, 3);
        }
      }
    }

    // Expire
    if (well.timer <= 0) {
      _implode(well);
    }
  }

  // ── Key handler ───────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyG' || e.key === 'g' || e.key === 'G')) {
      e.preventDefault();
      _throw();
    }
  }

  // ── init ──────────────────────────────────────────────────────────────────
  function init(scene, camera, onHitCb) {
    _scene = scene;
    _camera = camera;
    _onHit = onHitCb || null;

    _charges = MAX_CHARGES;
    _cooldownTimer = 0;
    _projectiles = [];
    _wells = [];
    _bassNodes = [];
    _distortTimer = 0;
    _canvas = null;

    _ensureHUD();
    _updateHUD();

    document.addEventListener('keydown', _onKeyDown, true);
  }

  // ── update ────────────────────────────────────────────────────────────────
  function update(dt) {
    // Charge cooldown
    if (_cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _cooldownTimer = 0;
      }
    }
    // Restock charges when cooldown expires
    if (_charges < MAX_CHARGES && _cooldownTimer <= 0) {
      _charges = Math.min(MAX_CHARGES, _charges + 1);
      if (_charges < MAX_CHARGES) {
        _cooldownTimer = COOLDOWN_DURATION;
      }
      _updateHUD();
    }

    // Update projectiles
    for (var pi = _projectiles.length - 1; pi >= 0; pi--) {
      var proj = _projectiles[pi];
      if (!proj || proj.landed || !proj.active) {
        _projectiles.splice(pi, 1);
        continue;
      }
      var done = _updateProjectile(proj, dt);
      if (done) {
        _projectiles.splice(pi, 1);
      }
    }

    // Update gravity wells
    var hasActiveWell = false;
    for (var wi = _wells.length - 1; wi >= 0; wi--) {
      var well = _wells[wi];
      if (!well || !well.active) {
        _wells.splice(wi, 1);
        continue;
      }
      _updateWell(well, dt);
      if (well.active) {
        hasActiveWell = true;
      } else {
        _wells.splice(wi, 1);
      }
    }

    // Clear canvas distortion if no active wells
    if (!hasActiveWell) {
      _clearCanvasDistortion();
    }

    _updateHUD();
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  function reset() {
    // Clean up projectiles
    for (var pi = 0; pi < _projectiles.length; pi++) {
      var proj = _projectiles[pi];
      if (proj && proj.mesh && _scene) _scene.remove(proj.mesh);
    }
    _projectiles = [];

    // Clean up wells
    for (var wi = 0; wi < _wells.length; wi++) {
      var well = _wells[wi];
      if (!well) continue;
      _stopBassHum(well.bassNode);
      if (well.vfx && well.vfx.group && _scene) _scene.remove(well.vfx.group);
    }
    _wells = [];

    _charges = MAX_CHARGES;
    _cooldownTimer = 0;
    _distortTimer = 0;
    _clearCanvasDistortion();

    document.removeEventListener('keydown', _onKeyDown, true);
    _updateHUD();
  }

  return {
    init: init,
    update: update,
    throw: _throw,
    reset: reset,
  };
})();
