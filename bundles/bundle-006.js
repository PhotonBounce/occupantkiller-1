/* === gravity-grenade.js === */
try {
;
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
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail gravity-grenade.js",_e&&_e.message); }
/* === poison-gas.js === */
try {
;
/* ───────────────────────────────────────────────────────────────────────
   POISON GAS — deployable gas canisters + environmental hazard zones
   Alt+X to throw a canister (3 charges, 30s cooldown).
   Pre-placed environmental zones from broken pipes/barrels.
   Player damage: 6 HP/s. Enemy damage: 4 HP/s.
   Gas mask (window._gasMaskOn) reduces damage to 15%.
   Wind drift via window._windX / _windZ.
   All var, IIFE pattern.
   ─────────────────────────────────────────────────────────────────────── */
window.PoisonGas = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _initialized = false;

  // Canisters the player has thrown
  var _canisters = [];    // { mesh, velocity, landed, landTimer, active, cloudMeshes,
                           //   cloudTimer, cloudRadius, zoneIndex, audioNode }

  // All gas zones (canisters + environmental)
  var _zones = [];        // { position:{x,y,z}, radius, active, timer, meshes[], enviro }

  // Player canister charges
  var _charges = 3;
  var MAX_CHARGES = 3;
  var COOLDOWN = 30;       // seconds
  var _cooldownTimer = 0;

  // Player in-gas tracking
  var _playerInGas = false;
  var _coughTimer = 0;

  // Damage constants
  var PLAYER_DAMAGE_PER_SEC = 6;
  var ENEMY_DAMAGE_PER_SEC = 4;
  var GAS_MASK_MULTIPLIER = 0.15;

  // Gas zone duration (after cloud fully deployed)
  var ZONE_DURATION = 15;      // seconds the cloud lasts
  var LAND_DELAY = 2;          // seconds after landing before crack/emit
  var EXPAND_TIME = 3;         // seconds to grow from radius 1 to 5
  var CLOUD_PARTICLES = 10;
  var CLOUD_MAX_RADIUS = 5;
  var CLOUD_MIN_RADIUS = 1;
  var CLOUD_PARTICLE_RADIUS = 0.8;

  // Enemy flee state: map enemy id -> { fleeing, fleeTimer }
  var _enemyFleeState = {};

  // Audio nodes
  var _audioCtx = null;
  var _hissNodes = [];
  var _coughNode = null;

  // HUD element
  var _hudEl = null;

  // Canvas filter state
  var _canvasFilterActive = false;

  // ── Init ──────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _camera = camera || null;
    _initialized = true;

    _canisters = [];
    _zones = [];
    _charges = MAX_CHARGES;
    _cooldownTimer = 0;
    _playerInGas = false;
    _coughTimer = 0;
    _enemyFleeState = {};
    _hissNodes = [];
    _coughNode = null;
    _canvasFilterActive = false;

    window._gasZones = [];
    window._gasMaskOn = window._gasMaskOn || false;

    _createHud();
    _placeEnvironmentalZones();
    _bindKeys();
    _updateHud();
  }

  // ── Environmental zones (3 pre-placed) ───────────────────────────────
  function _placeEnvironmentalZones() {
    var positions = [
      { x: 20,  y: 0, z: -15 },
      { x: -30, y: 0, z: 10  },
      { x: 5,   y: 0, z: 35  }
    ];
    for (var i = 0; i < positions.length; i++) {
      _createGasZone(positions[i], 4, true, ZONE_DURATION * 100); // long-lasting env zones
    }
  }

  // ── Zone creation ─────────────────────────────────────────────────────
  function _createGasZone(position, initialRadius, isEnviro, duration) {
    var meshes = _buildCloudMeshes(position, initialRadius);
    var zone = {
      position: { x: position.x, y: position.y, z: position.z },
      radius: initialRadius,
      targetRadius: isEnviro ? 4 : CLOUD_MAX_RADIUS,
      active: true,
      timer: duration || ZONE_DURATION,
      meshes: meshes,
      enviro: isEnviro || false,
      expandTimer: isEnviro ? EXPAND_TIME : 0   // env zones start expanded
    };
    _zones.push(zone);
    _syncGasZones();
    return zone;
  }

  function _buildCloudMeshes(position, radius) {
    var meshes = [];
    if (!_scene || typeof THREE === 'undefined') return meshes;

    var geo = new THREE.SphereGeometry(CLOUD_PARTICLE_RADIUS, 6, 6);
    for (var i = 0; i < CLOUD_PARTICLES; i++) {
      var opacity = 0.25 + Math.random() * 0.15;  // 0.25–0.40
      var mat = new THREE.MeshBasicMaterial({
        color: 0x88CC00,
        transparent: true,
        opacity: opacity,
        depthWrite: false
      });
      var mesh = new THREE.Mesh(geo, mat);
      var angle = (i / CLOUD_PARTICLES) * Math.PI * 2;
      var r = radius * (0.4 + Math.random() * 0.6);
      mesh.position.set(
        position.x + Math.cos(angle) * r,
        position.y + 0.5 + Math.random() * 1.5,
        position.z + Math.sin(angle) * r
      );
      mesh.userData.driftAngle = angle;
      mesh.userData.driftSpeed = 0.2 + Math.random() * 0.3;
      mesh.userData.bobOffset = Math.random() * Math.PI * 2;
      mesh.userData.baseY = mesh.position.y;
      _scene.add(mesh);
      meshes.push(mesh);
    }
    return meshes;
  }

  function _removeZoneMeshes(zone) {
    if (!zone.meshes) return;
    for (var i = 0; i < zone.meshes.length; i++) {
      if (_scene) _scene.remove(zone.meshes[i]);
    }
    zone.meshes = [];
  }

  // ── Canister throw ───────────────────────────────────────────────────
  function _throwCanister() {
    if (!_initialized || !_scene || !_camera) return;
    if (_charges <= 0) return;

    _charges--;
    if (_charges === 0) _cooldownTimer = COOLDOWN;
    _updateHud();

    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);

    var spawnPos = _camera.position.clone().add(dir.clone().multiplyScalar(1.0));
    spawnPos.y -= 0.2;

    var geo = new THREE.CylinderGeometry(0.1, 0.12, 0.35, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x88CC00 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(spawnPos);
    _scene.add(mesh);

    var speed = 12;
    var velocity = {
      x: dir.x * speed,
      y: dir.y * speed + 3,
      z: dir.z * speed
    };

    var canister = {
      mesh: mesh,
      velocity: velocity,
      landed: false,
      landTimer: 0,
      active: true,
      cloudMeshes: [],
      cloudTimer: 0,
      cloudRadius: CLOUD_MIN_RADIUS,
      zoneIndex: -1,
      audioNode: null,
      tumbleX: (Math.random() - 0.5) * 5,
      tumbleZ: (Math.random() - 0.5) * 5
    };
    _canisters.push(canister);

    _startHissAudio(canister);
  }

  // ── Canister physics update ───────────────────────────────────────────
  function _updateCanisters(dt) {
    for (var i = _canisters.length - 1; i >= 0; i--) {
      var c = _canisters[i];
      if (!c.active) continue;

      if (!c.landed) {
        // Apply gravity
        c.velocity.y -= 9.8 * dt;
        c.mesh.position.x += c.velocity.x * dt;
        c.mesh.position.y += c.velocity.y * dt;
        c.mesh.position.z += c.velocity.z * dt;

        // Tumble rotation
        c.mesh.rotation.x += c.tumbleX * dt;
        c.mesh.rotation.z += c.tumbleZ * dt;

        // Ground check (y <= 0 or floor)
        if (c.mesh.position.y <= 0.175) {
          c.mesh.position.y = 0.175;
          c.landed = true;
          c.velocity.x = 0;
          c.velocity.y = 0;
          c.velocity.z = 0;
        }
      } else {
        // Countdown to crack and release
        c.landTimer += dt;

        if (c.landTimer >= LAND_DELAY && c.zoneIndex === -1) {
          // Crack: change canister color to cracked look
          if (c.mesh.material) {
            c.mesh.material.color.setHex(0x556600);
          }
          // Create gas zone at canister position
          var pos = {
            x: c.mesh.position.x,
            y: 0,
            z: c.mesh.position.z
          };
          var zone = _createGasZone(pos, CLOUD_MIN_RADIUS, false, ZONE_DURATION);
          c.zoneIndex = _zones.length - 1;
        }

        if (c.zoneIndex >= 0) {
          var zone2 = _zones[c.zoneIndex];
          c.cloudTimer += dt;

          // Expand radius over EXPAND_TIME
          if (c.cloudTimer <= EXPAND_TIME) {
            var t = c.cloudTimer / EXPAND_TIME;
            zone2.radius = CLOUD_MIN_RADIUS + (CLOUD_MAX_RADIUS - CLOUD_MIN_RADIUS) * t;
          }

          // Zone expired => deactivate canister
          if (!zone2.active) {
            _stopHissAudio(c);
            if (_scene) _scene.remove(c.mesh);
            c.active = false;
          }
        }
      }
    }

    // Clean finished canisters
    for (var j = _canisters.length - 1; j >= 0; j--) {
      if (!_canisters[j].active) _canisters.splice(j, 1);
    }
  }

  // ── Zone update ───────────────────────────────────────────────────────
  function _updateZones(dt) {
    var windX = (typeof window._windX === 'number') ? window._windX : 0;
    var windZ = (typeof window._windZ === 'number') ? window._windZ : 0;

    for (var i = _zones.length - 1; i >= 0; i--) {
      var zone = _zones[i];
      if (!zone.active) continue;

      // Tick timer (env zones have very long timer so they persist)
      zone.timer -= dt;
      if (zone.timer <= 0) {
        zone.active = false;
        _removeZoneMeshes(zone);
        continue;
      }

      // Wind drift
      zone.position.x += windX * 0.5 * dt;
      zone.position.z += windZ * 0.5 * dt;

      // Expand env zones
      if (zone.enviro && zone.expandTimer < EXPAND_TIME) {
        zone.expandTimer += dt;
        var te = Math.min(zone.expandTimer / EXPAND_TIME, 1);
        zone.radius = CLOUD_MIN_RADIUS + (zone.targetRadius - CLOUD_MIN_RADIUS) * te;
      }

      // Update cloud particle positions (drift + bob)
      var time = Date.now() * 0.001;
      for (var k = 0; k < zone.meshes.length; k++) {
        var m = zone.meshes[k];
        m.userData.driftAngle += m.userData.driftSpeed * dt;
        var da = m.userData.driftAngle;
        var r2 = zone.radius * (0.4 + 0.6 * ((k % 5) / 5));
        m.position.x = zone.position.x + Math.cos(da) * r2;
        m.position.z = zone.position.z + Math.sin(da) * r2;
        m.position.y = m.userData.baseY + Math.sin(time + m.userData.bobOffset) * 0.3
                       + windX * 0.1 + windZ * 0.1;
        m.rotation.y += 0.3 * dt;

        // Fade out when timer < 3s
        if (zone.timer < 3) {
          m.material.opacity = Math.max(0, m.material.opacity - dt * 0.12);
        }
      }
    }

    _syncGasZones();
  }

  // ── Player damage ─────────────────────────────────────────────────────
  function _updatePlayerDamage(dt) {
    if (!_camera) return;

    var px = _camera.position.x;
    var py = _camera.position.y;
    var pz = _camera.position.z;

    var inGas = false;
    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];
      if (!zone.active) continue;
      var dx = px - zone.position.x;
      var dz = pz - zone.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < zone.radius) {
        inGas = true;
        break;
      }
    }

    _playerInGas = inGas;
    window._playerInGas = inGas;

    if (inGas) {
      _showGasOverlay();
      _applyCanvasFilter();

      var dmgMultiplier = (window._gasMaskOn === true) ? GAS_MASK_MULTIPLIER : 1.0;
      var dmg = PLAYER_DAMAGE_PER_SEC * dmgMultiplier * dt;

      if (typeof window.playerHealth === 'number') {
        window.playerHealth = Math.max(0, window.playerHealth - dmg);
      } else if (typeof window._playerHP === 'number') {
        window._playerHP = Math.max(0, window._playerHP - dmg);
      }

      // Coughing sound
      if (!window._gasMaskOn) {
        _coughTimer -= dt;
        if (_coughTimer <= 0) {
          _playCough();
          _coughTimer = 2.5;
        }
      }
    } else {
      _hideGasOverlay();
      _clearCanvasFilter();
      _coughTimer = 0;
    }
  }

  // ── Enemy damage & flee ───────────────────────────────────────────────
  function _updateEnemyDamage(dt) {
    var enemies = window._enemies || window.enemies || [];
    if (!enemies || !enemies.length) return;

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy || enemy.dead) continue;

      var ex = enemy.position ? enemy.position.x : (enemy.mesh ? enemy.mesh.position.x : 0);
      var ez = enemy.position ? enemy.position.z : (enemy.mesh ? enemy.mesh.position.z : 0);

      var inGas = false;
      for (var j = 0; j < _zones.length; j++) {
        var zone = _zones[j];
        if (!zone.active) continue;
        var dx = ex - zone.position.x;
        var dz = ez - zone.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < zone.radius) {
          inGas = true;
          break;
        }
      }

      if (inGas) {
        // Damage enemy
        var dmg = ENEMY_DAMAGE_PER_SEC * dt;
        if (typeof enemy.hp === 'number') {
          enemy.hp = Math.max(0, enemy.hp - dmg);
        } else if (typeof enemy.health === 'number') {
          enemy.health = Math.max(0, enemy.health - dmg);
        }

        // Flee behaviour — reduce speed and change direction
        var eid = enemy.id || i;
        if (!_enemyFleeState[eid]) {
          _enemyFleeState[eid] = { fleeing: false, fleeTimer: 0 };
        }
        var fs = _enemyFleeState[eid];
        if (!fs.fleeing) {
          fs.fleeing = true;
          fs.fleeTimer = 2 + Math.random() * 2;
          // Push enemy outward from zone centre
          var nearZone = null;
          for (var k = 0; k < _zones.length; k++) {
            if (!_zones[k].active) continue;
            var ddx = ex - _zones[k].position.x;
            var ddz = ez - _zones[k].position.z;
            if (Math.sqrt(ddx * ddx + ddz * ddz) < _zones[k].radius) {
              nearZone = _zones[k];
              break;
            }
          }
          if (nearZone) {
            var fx = ex - nearZone.position.x;
            var fz = ez - nearZone.position.z;
            var fl = Math.sqrt(fx * fx + fz * fz) || 1;
            if (enemy.velocity) {
              enemy.velocity.x = (fx / fl) * 4;
              enemy.velocity.z = (fz / fl) * 4;
            }
            if (typeof enemy.speed === 'number') {
              enemy.speed = Math.max(0, enemy.speed - 2);
            }
          }
        } else {
          fs.fleeTimer -= dt;
          if (fs.fleeTimer <= 0) {
            fs.fleeing = false;
          }
        }
      } else {
        var eid2 = enemy.id || i;
        if (_enemyFleeState[eid2]) {
          _enemyFleeState[eid2].fleeing = false;
        }
      }
    }
  }

  // ── Cooldown & charges ────────────────────────────────────────────────
  function _updateCooldown(dt) {
    if (_cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _cooldownTimer = 0;
        _charges = MAX_CHARGES;
        _updateHud();
      }
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────
  function _createHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'poison-gas-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'left:20px',
      'color:#88CC00',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'text-shadow:0 0 6px #88CC00, 0 1px 3px #000',
      'pointer-events:none',
      'z-index:900',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHud() {
    if (!_hudEl) return;
    _hudEl.style.display = 'block';
    var chargeStr = '';
    for (var i = 0; i < MAX_CHARGES; i++) {
      chargeStr += (i < _charges) ? '●' : '○';
    }
    var coolStr = (_cooldownTimer > 0) ? ' (' + Math.ceil(_cooldownTimer) + 's)' : '';
    _hudEl.textContent = '☠ GAS ' + chargeStr + coolStr;
  }

  // ── Gas overlay (vignette) ────────────────────────────────────────────
  var _overlayEl = null;

  function _showGasOverlay() {
    if (!_overlayEl) {
      _overlayEl = document.createElement('div');
      _overlayEl.id = 'poison-gas-overlay';
      _overlayEl.style.cssText = [
        'position:fixed',
        'inset:0',
        'pointer-events:none',
        'z-index:800',
        'background:radial-gradient(ellipse at center, transparent 40%, rgba(100,180,0,0.30) 100%)',
        'display:none'
      ].join(';');
      document.body.appendChild(_overlayEl);
    }
    _overlayEl.style.display = 'block';
  }

  function _hideGasOverlay() {
    if (_overlayEl) _overlayEl.style.display = 'none';
  }

  // ── Canvas CSS filter ─────────────────────────────────────────────────
  function _applyCanvasFilter() {
    if (_canvasFilterActive) return;
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.style.filter = 'sepia(0.3) hue-rotate(60deg) saturate(1.4) blur(1px)';
    _canvasFilterActive = true;
  }

  function _clearCanvasFilter() {
    if (!_canvasFilterActive) return;
    var canvas = document.querySelector('canvas');
    if (canvas) canvas.style.filter = '';
    _canvasFilterActive = false;
  }

  // ── Audio ─────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx && _audioCtx.state !== 'closed') return _audioCtx;
    try {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _startHissAudio(canister) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      canister.audioNode = { osc: osc, gain: gainNode };
      _hissNodes.push(canister.audioNode);
    } catch (e) { /* silent fail */ }
  }

  function _stopHissAudio(canister) {
    if (!canister.audioNode) return;
    try {
      canister.audioNode.gain.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.3);
      canister.audioNode.osc.stop(_audioCtx.currentTime + 0.5);
    } catch (e) { /* silent fail */ }
    var idx = _hissNodes.indexOf(canister.audioNode);
    if (idx >= 0) _hissNodes.splice(idx, 1);
    canister.audioNode = null;
  }

  function _playCough() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.Q.setValueAtTime(2, ctx.currentTime);
      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent fail */ }
  }

  // ── Key bindings ──────────────────────────────────────────────────────
  function _bindKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.altKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        _throwCanister();
      }
    });
  }

  // ── Sync public _gasZones array ───────────────────────────────────────
  function _syncGasZones() {
    window._gasZones = [];
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      window._gasZones.push({
        position: { x: z.position.x, y: z.position.y, z: z.position.z },
        radius: z.radius,
        active: z.active
      });
    }
  }

  // ── Public API ────────────────────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;
    _updateCooldown(dt);
    _updateCanisters(dt);
    _updateZones(dt);
    _updatePlayerDamage(dt);
    _updateEnemyDamage(dt);
    _updateHud();
  }

  function release() {
    // Remove all zone meshes
    for (var i = 0; i < _zones.length; i++) {
      _removeZoneMeshes(_zones[i]);
    }
    _zones = [];

    // Remove canister meshes
    for (var j = 0; j < _canisters.length; j++) {
      if (_canisters[j].mesh && _scene) _scene.remove(_canisters[j].mesh);
      _stopHissAudio(_canisters[j]);
    }
    _canisters = [];

    _clearCanvasFilter();
    _hideGasOverlay();

    if (_hudEl) { _hudEl.style.display = 'none'; }
    if (_overlayEl) { _overlayEl.style.display = 'none'; }

    window._gasZones = [];
    window._playerInGas = false;
    _initialized = false;
  }

  function reset() {
    release();
  }

  function getZones() {
    var result = [];
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      result.push({
        position: { x: z.position.x, y: z.position.y, z: z.position.z },
        radius: z.radius,
        active: z.active
      });
    }
    return result;
  }

  return { init: init, update: update, release: release, reset: reset, getZones: getZones };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail poison-gas.js",_e&&_e.message); }
/* === ricochet-rounds.js === */
try {
;
/**
 * ricochet-rounds.js — Bullets bounce off walls and hit multiple enemies
 * window.RicochetRounds module
 *
 * Key: Shift+R to toggle ricochet mode (30 bullets, 60s recharge)
 * HUD: gold "🎱 RICOCHET ON [N]" indicator when active
 * Bullets bounce up to 3 times, damage reduces 25% per bounce
 * Trick shot bonus: +150 "RICOCHET KILL" toast after ≥1 bounce hit
 */
window.RicochetRounds = (function() {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_BOUNCES      = 3;
  var BULLET_SPEED     = 8;      // units per dt step
  var MAX_BULLETS      = 30;     // ammo capacity
  var RECHARGE_RATE    = 10;     // bullets per 20 seconds when inactive
  var RECHARGE_PERIOD  = 20;     // seconds per RECHARGE_RATE bullets
  var BASE_DAMAGE      = 25;     // base damage per bullet
  var TRACER_RADIUS    = 0.08;
  var MARK_RADIUS      = 0.1;
  var FLASH_INTENSITY  = 5;
  var FLASH_RANGE      = 2;
  var FLASH_DURATION   = 0.08;   // seconds
  var TRACER_LIFE      = 1.2;    // seconds
  var MARK_LIFE        = 8.0;    // seconds ricochet marks stay on walls
  var HIT_RADIUS       = 0.55;   // enemy hit detection radius
  var SCREEN_FLASH_DUR = 0.35;   // yellow tint duration on trick-shot kill

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _active       = false;     // ricochet mode on/off
  var _ammo         = MAX_BULLETS;
  var _rechargeAcc  = 0;        // accumulator for recharge timer
  var _initialized  = false;

  // active bullets in flight
  var _bullets      = [];
  // temporary visual objects (tracers, marks, sparks)
  var _tracers      = [];
  var _marks        = [];
  var _sparks       = [];        // { light, timer, maxTimer }

  // HUD element
  var _hudEl        = null;

  // Screen flash overlay
  var _flashEl      = null;
  var _flashTimer   = 0;

  // Key state
  var _shiftDown    = false;
  var _rPressHandled = false;

  // AudioContext (shared or created)
  var _audioCtx     = null;

  // ── Audio helpers ─────────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window._audioCtx = _audioCtx;
      } catch (e) { /* no audio ctx */ }
    }
    return _audioCtx;
  }

  // Metallic zing rising with each bounce (bounceIndex 0,1,2)
  function _playRicochetSound(bounceIndex) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var baseFreq = 800 + bounceIndex * 500;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);

      // Add metallic high overtone
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 3, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 6, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.14);
    } catch (e) { /* audio unavailable */ }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'ricochet-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'color:#FFD700',
      'text-shadow:0 0 8px rgba(255,180,0,0.9)',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid rgba(255,200,0,0.6)',
      'border-radius:6px',
      'padding:4px 12px',
      'z-index:220',
      'pointer-events:none',
      'display:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_active) {
      _hudEl.textContent = '🎱 RICOCHET ON [' + _ammo + ']';
      _hudEl.style.display = 'block';
      _hudEl.style.color = '#FFD700';
    } else if (_ammo < MAX_BULLETS) {
      _hudEl.textContent = '🎱 RICOCHET [' + _ammo + '/' + MAX_BULLETS + ']';
      _hudEl.style.display = 'block';
      _hudEl.style.color = '#AA8800';
    } else {
      _hudEl.style.display = 'none';
    }
  }

  // ── Screen flash ──────────────────────────────────────────────────────────

  function _createFlashEl() {
    if (_flashEl) return;
    _flashEl = document.createElement('div');
    _flashEl.id = 'ricochet-screen-flash';
    _flashEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9997',
      'background:rgba(255,200,0,0.15)',
      'opacity:0',
      'transition:opacity 0.05s ease'
    ].join(';');
    document.body.appendChild(_flashEl);
  }

  function _triggerScreenFlash() {
    if (!_flashEl) return;
    _flashTimer = SCREEN_FLASH_DUR;
    _flashEl.style.opacity = '1';
  }

  function _updateScreenFlash(dt) {
    if (!_flashEl || _flashTimer <= 0) return;
    _flashTimer -= dt;
    if (_flashTimer <= 0) {
      _flashTimer = 0;
      _flashEl.style.opacity = '0';
    } else {
      var pct = _flashTimer / SCREEN_FLASH_DUR;
      _flashEl.style.opacity = String(pct);
    }
  }

  // ── Toast helper ──────────────────────────────────────────────────────────

  function _toast(msg, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg, 2500, color || '#FFD700');
      }
    } catch (e) { /* no HUD */ }
  }

  // ── THREE helpers ─────────────────────────────────────────────────────────

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  // ── Visual: gold tracer segment sphere ────────────────────────────────────

  function _spawnTracer(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var geo = new THREE.SphereGeometry(TRACER_RADIUS, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFCC00, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    _tracers.push({ mesh: mesh, timer: TRACER_LIFE, maxTimer: TRACER_LIFE });
  }

  // ── Visual: wall ricochet mark ────────────────────────────────────────────

  function _spawnWallMark(pos, normal) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var geo = new THREE.CircleGeometry(MARK_RADIUS, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFFAA00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    // Offset slightly off wall to avoid z-fighting
    mesh.position.copy(pos).addScaledVector(normal, 0.02);
    // Orient circle to face the normal direction
    var up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(up)) > 0.9) {
      up.set(1, 0, 0);
    }
    var quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    mesh.quaternion.copy(quaternion);
    scene.add(mesh);
    _marks.push({ mesh: mesh, timer: MARK_LIFE, maxTimer: MARK_LIFE });
  }

  // ── Visual: spark burst at bounce point ───────────────────────────────────

  function _spawnSpark(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var light = new THREE.PointLight(0xFFAA00, FLASH_INTENSITY, FLASH_RANGE);
    light.position.copy(pos);
    scene.add(light);
    _sparks.push({ light: light, timer: FLASH_DURATION, maxTimer: FLASH_DURATION });
  }

  // ── Wall collision ────────────────────────────────────────────────────────
  // Returns { hit: true, normal: THREE.Vector3 } or { hit: false }
  // Probes in X, Y, Z directions to find which axis is solid

  function _checkWallHit(pos) {
    var step = 0.15;
    var isSolid = (window.VoxelWorld && window.VoxelWorld.isSolid)
      ? window.VoxelWorld.isSolid
      : (window.isSolid || function() { return false; });

    // Test the current voxel — if solid, bullet is inside a wall (shouldn't happen normally)
    if (isSolid(pos.x, pos.y, pos.z)) {
      return { hit: true, normal: new THREE.Vector3(0, 1, 0) };
    }

    // Probe each axis to find wall normal
    var hitX = isSolid(pos.x + step, pos.y, pos.z) || isSolid(pos.x - step, pos.y, pos.z);
    var hitY = isSolid(pos.x, pos.y + step, pos.z) || isSolid(pos.x, pos.y - step, pos.z);
    var hitZ = isSolid(pos.x, pos.y, pos.z + step) || isSolid(pos.x, pos.y, pos.z - step);

    if (!hitX && !hitY && !hitZ) return { hit: false };

    // Determine dominant axis for normal
    var nx = 0, ny = 0, nz = 0;
    if (hitX) {
      nx = isSolid(pos.x + step, pos.y, pos.z) ? -1 : 1;
    }
    if (hitY && !hitX) {
      ny = isSolid(pos.x, pos.y + step, pos.z) ? -1 : 1;
    }
    if (hitZ && !hitX && !hitY) {
      nz = isSolid(pos.x, pos.y, pos.z + step) ? -1 : 1;
    }
    // If multiple axes hit, pick dominant
    if (hitX && hitZ && !hitY) {
      nx = isSolid(pos.x + step, pos.y, pos.z) ? -1 : 1;
      nz = 0; // use X axis
    }

    var normal = new THREE.Vector3(nx, ny, nz);
    if (normal.lengthSq() === 0) normal.set(0, 1, 0);
    normal.normalize();
    return { hit: true, normal: normal };
  }

  // ── Enemy hit test ────────────────────────────────────────────────────────

  function _checkEnemyHits(bullet) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var enemies = Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      // Skip already-hit enemies for this bullet (chain tracking)
      if (bullet.hitEnemies.indexOf(i) >= 0) continue;

      var dist = bullet.pos.distanceTo(e.mesh.position);
      if (dist < HIT_RADIUS) {
        // Deal damage — reduce 25% per bounce
        var dmgMult = Math.pow(0.75, bullet.bounceCount);
        var dmg = Math.round(BASE_DAMAGE * dmgMult);
        Enemies.damage(e, dmg, false, 'ricochet');

        // Track hit enemy
        bullet.hitEnemies.push(i);

        // Trick shot: if hit after ≥1 bounce AND enemy dies
        if (bullet.bounceCount >= 1 && !e.alive) {
          _toast('+150 RICOCHET KILL!', '#FFD700');
          _triggerScreenFlash();
          if (window.GameManager && window.GameManager.addScore) {
            window.GameManager.addScore(150);
          } else if (window._score !== undefined) {
            window._score += 150;
          }
        }
      }
    }
  }

  // ── Fire a ricochet bullet ────────────────────────────────────────────────

  function _fireBullet() {
    if (!_active || _ammo <= 0) return;
    var cam = _camera || window._camera;
    if (!cam) return;
    if (typeof THREE === 'undefined') return;

    _ammo--;
    _updateHUD();

    // Get direction from camera
    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);

    var bullet = {
      pos:         cam.position.clone().addScaledVector(dir, 0.5),
      dir:         dir.clone(),
      bounceCount: 0,
      hitEnemies:  [],
      dead:        false
    };

    _bullets.push(bullet);

    if (_ammo <= 0) {
      _active = false;
      _toast('RICOCHET ammo depleted — recharging', '#AA8800');
      _updateHUD();
    }
  }

  // ── Activate / Deactivate ─────────────────────────────────────────────────

  function activate() {
    if (_active) {
      // Toggle off
      _active = false;
      _toast('Ricochet mode OFF', '#888888');
      _updateHUD();
      return;
    }
    if (_ammo <= 0) {
      _toast('No ricochet ammo! Recharging...', '#FF4444');
      return;
    }
    _active = true;
    _toast('🎱 RICOCHET ON — ' + _ammo + ' rounds', '#FFD700');
    _updateHUD();
  }

  // ── Key handlers ──────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.shiftKey) _shiftDown = true;
    if (e.code === 'KeyR' && e.shiftKey && !_rPressHandled) {
      _rPressHandled = true;
      activate();
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') _shiftDown = false;
    if (e.code === 'KeyR') _rPressHandled = false;
  }

  // Hook into player shoot events
  function _onShoot() {
    if (!_active) return;
    _fireBullet();
  }

  // ── Update bullets in flight ───────────────────────────────────────────────

  function _updateBullets(dt) {
    var isSolid = (window.VoxelWorld && window.VoxelWorld.isSolid)
      ? window.VoxelWorld.isSolid
      : (window.isSolid || function() { return false; });

    var toRemove = [];
    for (var i = 0; i < _bullets.length; i++) {
      var b = _bullets[i];
      if (b.dead) { toRemove.push(i); continue; }

      // Step bullet forward
      var prevPos = b.pos.clone();
      b.pos.addScaledVector(b.dir, BULLET_SPEED * dt);

      // Spawn tracer at new position
      _spawnTracer(b.pos.clone());

      // Check enemy hits
      _checkEnemyHits(b);

      // Check wall collision
      if (isSolid(b.pos.x, b.pos.y, b.pos.z)) {
        if (b.bounceCount >= MAX_BOUNCES) {
          // Out of bounces — bullet dies
          b.dead = true;
          _spawnSpark(b.pos.clone());
          toRemove.push(i);
          continue;
        }

        // Probe to find the normal
        var wallResult = _checkWallHit(prevPos);
        var normal = wallResult.normal || new THREE.Vector3(0, 1, 0);

        // Reflect direction: r = d - 2(d·n)n
        var dot = b.dir.dot(normal);
        b.dir.addScaledVector(normal, -2 * dot);
        b.dir.normalize();

        // Push bullet out of wall
        b.pos.copy(prevPos).addScaledVector(b.dir, 0.2);

        b.bounceCount++;

        // Spawn wall mark and spark
        _spawnWallMark(prevPos.clone(), normal);
        _spawnSpark(prevPos.clone());
        _playRicochetSound(b.bounceCount - 1);

        // Check enemies immediately after bounce
        _checkEnemyHits(b);
      }

      // Kill bullet if it somehow exits a huge range (safety)
      var cam = _camera || window._camera;
      if (cam && b.pos.distanceTo(cam.position) > 200) {
        b.dead = true;
        toRemove.push(i);
      }
    }

    // Remove dead bullets (in reverse order)
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _bullets.splice(toRemove[j], 1);
    }
  }

  // ── Update tracer visuals ─────────────────────────────────────────────────

  function _updateTracers(dt) {
    var scene = _getScene();
    var toRemove = [];
    for (var i = 0; i < _tracers.length; i++) {
      var t = _tracers[i];
      t.timer -= dt;
      if (t.timer <= 0) {
        if (scene) scene.remove(t.mesh);
        if (t.mesh.geometry) t.mesh.geometry.dispose();
        if (t.mesh.material) t.mesh.material.dispose();
        toRemove.push(i);
      } else {
        t.mesh.material.opacity = (t.timer / t.maxTimer) * 0.85;
        // Shrink over time
        var scale = t.timer / t.maxTimer;
        t.mesh.scale.setScalar(0.4 + scale * 0.6);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _tracers.splice(toRemove[j], 1);
    }
  }

  // ── Update wall marks ─────────────────────────────────────────────────────

  function _updateMarks(dt) {
    var scene = _getScene();
    var toRemove = [];
    for (var i = 0; i < _marks.length; i++) {
      var m = _marks[i];
      m.timer -= dt;
      if (m.timer <= 0) {
        if (scene) scene.remove(m.mesh);
        if (m.mesh.geometry) m.mesh.geometry.dispose();
        if (m.mesh.material) m.mesh.material.dispose();
        toRemove.push(i);
      } else {
        // Fade out in last 2 seconds
        var fadeRatio = Math.min(1, m.timer / 2.0);
        m.mesh.material.opacity = fadeRatio * 0.8;
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _marks.splice(toRemove[j], 1);
    }
  }

  // ── Update spark flashes ──────────────────────────────────────────────────

  function _updateSparks(dt) {
    var scene = _getScene();
    var toRemove = [];
    for (var i = 0; i < _sparks.length; i++) {
      var s = _sparks[i];
      s.timer -= dt;
      if (s.timer <= 0) {
        if (scene) scene.remove(s.light);
        toRemove.push(i);
      } else {
        s.light.intensity = FLASH_INTENSITY * (s.timer / s.maxTimer);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _sparks.splice(toRemove[j], 1);
    }
  }

  // ── Ammo recharge ─────────────────────────────────────────────────────────

  function _updateRecharge(dt) {
    if (_active || _ammo >= MAX_BULLETS) return;
    _rechargeAcc += dt;
    if (_rechargeAcc >= RECHARGE_PERIOD) {
      _rechargeAcc -= RECHARGE_PERIOD;
      _ammo = Math.min(MAX_BULLETS, _ammo + RECHARGE_RATE);
      _updateHUD();
      if (_ammo < MAX_BULLETS) {
        _toast('Ricochet ammo: ' + _ammo + '/' + MAX_BULLETS, '#888800');
      } else {
        _toast('🎱 Ricochet ammo recharged!', '#FFD700');
      }
    }
  }

  // ── Clear all visual objects ───────────────────────────────────────────────

  function _clearVisuals() {
    var scene = _getScene();
    var i;

    for (i = 0; i < _tracers.length; i++) {
      var t = _tracers[i];
      if (scene) scene.remove(t.mesh);
      if (t.mesh.geometry) t.mesh.geometry.dispose();
      if (t.mesh.material) t.mesh.material.dispose();
    }
    _tracers = [];

    for (i = 0; i < _marks.length; i++) {
      var m = _marks[i];
      if (scene) scene.remove(m.mesh);
      if (m.mesh.geometry) m.mesh.geometry.dispose();
      if (m.mesh.material) m.mesh.material.dispose();
    }
    _marks = [];

    for (i = 0; i < _sparks.length; i++) {
      if (scene) scene.remove(_sparks[i].light);
    }
    _sparks = [];
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;

    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _createHUD();
    _createFlashEl();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    // Hook into shoot events if the game provides a hook point
    if (typeof window._onShotForTracer !== 'undefined') {
      var prevHook = window._onShotForRicochet;
      window._onShotForRicochet = function() {
        if (prevHook) prevHook();
        _onShoot();
      };
    }

    // Also listen for a custom shoot event that game-manager may dispatch
    document.addEventListener('player-shoot', _onShoot);

    _updateHUD();
  }

  function update(dt) {
    // Lazy resolve scene/camera
    if (!_scene)  _scene  = window._gameScene || null;
    if (!_camera) _camera = window._camera    || null;

    var realDt = dt || 0.016;

    _updateBullets(realDt);
    _updateTracers(realDt);
    _updateMarks(realDt);
    _updateSparks(realDt);
    _updateRecharge(realDt);
    _updateScreenFlash(realDt);
  }

  function reset() {
    _active      = false;
    _ammo        = MAX_BULLETS;
    _rechargeAcc = 0;
    _flashTimer  = 0;
    _bullets     = [];
    _clearVisuals();
    if (_hudEl)   _hudEl.style.display   = 'none';
    if (_flashEl) _flashEl.style.opacity = '0';
  }

  return {
    init:     init,
    update:   update,
    activate: activate,
    reset:    reset,
    // expose for game-manager shoot hook
    onShoot:  _onShoot
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail ricochet-rounds.js",_e&&_e.message); }
/* === time-rewind.js === */
try {
;
window.TimeRewind = (function() {
  'use strict';

  var _snapshots = [];
  var _maxSnapshots = 40;
  var _recordInterval = 0.1;
  var _recordTimer = 0;
  var _cooldown = 0;
  var _COOLDOWN = 90;
  var _charges = 1;
  var _hudEl = null;
  var _audioCtx = null;
  var _active = false;

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playRewindSound() {
    try {
      var ctx = _getAudio();
      // Reverse time audio - swept filter on noise going backwards
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        var t = i / ctx.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4) * 0.3;
      }
      // Reverse the buffer
      d.reverse();
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = 1200;
      var g = ctx.createGain(); g.gain.value = 0.5;
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      src.start();
    } catch(e) {}
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'time-rewind-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:200px;right:16px;color:#4488FF;font-family:monospace;font-size:13px;font-weight:bold;text-shadow:0 0 8px #2266FF;z-index:1400;pointer-events:none';
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var cdText = _cooldown > 0 ? ' ' + Math.ceil(_cooldown) + 's' : (_charges > 0 ? ' READY' : '');
    _hudEl.textContent = '⏪ REWIND' + cdText;
    _hudEl.style.color = _cooldown > 0 ? '#666688' : '#4488FF';
  }

  function _activate() {
    if (_charges <= 0 || _cooldown > 0 || _active) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(_cooldown > 0 ? 'TIME REWIND RECHARGING' : 'NO REWIND CHARGES');
      }
      return;
    }
    if (_snapshots.length < 3) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('INSUFFICIENT TIMELINE DATA');
      return;
    }

    _active = true;
    _charges--;
    _cooldown = _COOLDOWN;

    var snap = _snapshots[0]; // Oldest = 4s ago
    var cam = window._camera;
    var player = window._gameManager ? window._gameManager.getPlayer() : (window.player || null);

    // Move player back
    if (cam && snap) {
      cam.position.set(snap.x, snap.y, snap.z);
    }

    // Restore HP
    if (player && snap && snap.hp !== undefined) {
      player.hp = Math.max(player.hp, snap.hp);
      if (window.HUD && window.HUD.setHealth) window.HUD.setHealth(player.hp);
    }

    // Screen flash blue
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(50,100,255,0.65);pointer-events:none;z-index:2900;transition:opacity 0.4s';
    document.body.appendChild(overlay);
    setTimeout(function() {
      overlay.style.opacity = '0';
      setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 400);
    }, 80);

    // Film grain flash
    var grain = document.createElement('div');
    grain.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;pointer-events:none;z-index:2950;opacity:0.8;transition:opacity 0.3s';
    document.body.appendChild(grain);
    setTimeout(function() {
      grain.style.opacity = '0';
      setTimeout(function() { if (grain.parentNode) grain.parentNode.removeChild(grain); }, 300);
    }, 50);

    // Ghost marker at old position
    var sc = window._gameScene || window._scene;
    if (sc && cam) {
      var ghostGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var ghostMat = new THREE.MeshBasicMaterial({ color: 0x4488FF, transparent: true, opacity: 0.7 });
      var ghost = new THREE.Mesh(ghostGeo, ghostMat);
      ghost.position.copy(cam.position);
      sc.add(ghost);
      var ghostLight = new THREE.PointLight(0x4488FF, 6, 4);
      ghostLight.position.copy(ghost.position);
      sc.add(ghostLight);
      var fadeTimer = 0;
      var interval = setInterval(function() {
        fadeTimer += 0.05;
        ghostMat.opacity = Math.max(0, 0.7 - fadeTimer);
        ghostLight.intensity = Math.max(0, 6 - fadeTimer * 6);
        if (fadeTimer >= 1.0) {
          sc.remove(ghost);
          sc.remove(ghostLight);
          clearInterval(interval);
        }
      }, 50);
    }

    // Stagger enemies
    if (window.Enemies && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < Math.min(enemies.length, 8); i++) {
        var e = enemies[i];
        if (e && e.mesh) {
          e._stunned = true;
          e._stunTimer = (e._stunTimer || 0) + 1.5;
          if (e.mesh.rotation) e.mesh.rotation.z = (Math.random() - 0.5) * 0.5;
        }
      }
    }

    _playRewindSound();
    if (window.HUD && window.HUD.showToast) window.HUD.showToast('TIME REWOUND');
    _snapshots = [];
    _active = false;
    _updateHUD();
  }

  function init() {
    _createHUD();
    window._timeRewindActive = false;
    window._timeRewindCooldown = 0;

    document.addEventListener('keydown', function(e) {
      if (window._menuOpen || window._isPaused || window._inMenu) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault();
        _activate();
      }
    });
  }

  function update(dt) {
    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        _charges = 1;
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('⏪ TIME REWIND READY');
      }
      window._timeRewindCooldown = _cooldown;
      _updateHUD();
    }

    // Record player state
    _recordTimer -= dt;
    if (_recordTimer <= 0) {
      _recordTimer = _recordInterval;
      var cam = window._camera;
      var player = window.player || (window._gameManager && window._gameManager.getPlayer ? window._gameManager.getPlayer() : null);
      if (cam) {
        _snapshots.unshift({
          x: cam.position.x,
          y: cam.position.y,
          z: cam.position.z,
          hp: player ? (player.hp || player.health || 100) : 100,
          time: Date.now()
        });
        if (_snapshots.length > _maxSnapshots) _snapshots.pop();
      }
    }
  }

  function reset() {
    _snapshots = [];
    _cooldown = 0;
    _charges = 1;
    _active = false;
    window._timeRewindActive = false;
    window._timeRewindCooldown = 0;
    _updateHUD();
  }

  return { init: init, update: update, activate: _activate, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail time-rewind.js",_e&&_e.message); }
/* === speed-boost.js === */
try {
;
window.SpeedBoost = (function() {
  'use strict';

  var _active = false;
  var _timer = 0;
  var _DURATION = 6;
  var _cooldown = 0;
  var _COOLDOWN = 45;
  var _hudEl = null;
  var _barEl = null;
  var _audioCtx = null;
  var _trailPool = [];
  var _syringePickup = null;
  var _syringeTimer = 0;
  var _scene = null;
  var _camera = null;
  var _borderEl = null;

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playWhoosh() {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.6);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    } catch(e) {}
  }

  function _playHeartbeat() {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 80;
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } catch(e) {}
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'speed-boost-hud';
    _hudEl.style.cssText = 'position:fixed;top:170px;left:16px;color:#00FFFF;font-family:monospace;font-size:14px;font-weight:bold;text-shadow:0 0 8px #00AAFF;z-index:1400;pointer-events:none;display:none';
    document.body.appendChild(_hudEl);

    _barEl = document.createElement('div');
    _barEl.id = 'speed-boost-bar';
    _barEl.style.cssText = 'position:fixed;top:188px;left:16px;width:100px;height:4px;background:#113;z-index:1401;pointer-events:none;border-radius:2px;display:none';
    var fill = document.createElement('div');
    fill.id = 'speed-boost-fill';
    fill.style.cssText = 'height:100%;width:100%;background:#00FFFF;border-radius:2px;transition:background 0.2s';
    _barEl.appendChild(fill);
    document.body.appendChild(_barEl);

    // Border effect for speed sensation
    _borderEl = document.createElement('div');
    _borderEl.id = 'speed-boost-border';
    _borderEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1200;border:0px solid #00FFFF;transition:border-width 0.2s;box-shadow:none';
    document.body.appendChild(_borderEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_active) {
      _hudEl.style.display = 'block';
      _barEl.style.display = 'block';
      _hudEl.textContent = '⚡ SPEED ' + Math.ceil(_timer) + 's';
      var fill = document.getElementById('speed-boost-fill');
      if (fill) fill.style.width = Math.round((_timer / _DURATION) * 100) + '%';
      _hudEl.style.color = _timer < 1.5 ? '#FF8800' : '#00FFFF';
    } else if (_cooldown > 0) {
      _hudEl.style.display = 'block';
      _barEl.style.display = 'block';
      _hudEl.style.color = '#335566';
      _hudEl.textContent = '⚡ SPEED ' + Math.ceil(_cooldown) + 's';
      var fill2 = document.getElementById('speed-boost-fill');
      if (fill2) {
        fill2.style.width = Math.round((1 - _cooldown / _COOLDOWN) * 100) + '%';
        fill2.style.background = '#335566';
      }
    } else {
      _hudEl.style.display = 'none';
      _barEl.style.display = 'none';
    }
  }

  function _spawnTrail() {
    var cam = _camera || window._camera;
    var sc = _scene || window._gameScene || window._scene;
    if (!cam || !sc) return;
    var geo = new THREE.BoxGeometry(0.06, 0.06, 0.25);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00CCFF, transparent: true, opacity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(cam.position);
    mesh.position.y -= 0.5;
    mesh.rotation.copy(cam.rotation);
    sc.add(mesh);
    _trailPool.push({ mesh: mesh, mat: mat, life: 0.4 });
  }

  function _spawnSyringe() {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return;
    var cam = window._camera;
    var x = cam ? cam.position.x + (Math.random() - 0.5) * 20 : (Math.random() - 0.5) * 20;
    var z = cam ? cam.position.z + (Math.random() - 0.5) * 20 : (Math.random() - 0.5) * 20;
    var geo = new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF2244 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 1.2, z);
    var light = new THREE.PointLight(0xFF0044, 3, 3);
    light.position.copy(mesh.position);
    sc.add(mesh);
    sc.add(light);
    _syringePickup = { mesh: mesh, light: light, collected: false };
    _syringeTimer = 0;
  }

  function _activate() {
    if (_active || _cooldown > 0) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(_cooldown > 0 ? 'SPEED BOOST RECHARGING' : 'ALREADY ACTIVE');
      }
      return;
    }
    _active = true;
    _timer = _DURATION;
    _cooldown = _COOLDOWN;
    window._speedBoostActive = true;
    window._speedBoostMult = 2.0;
    window._speedBoostTimer = _DURATION;

    // FOV change
    var cam = _camera || window._camera;
    if (cam && cam.fov !== undefined) {
      cam.fov = 90;
      cam.updateProjectionMatrix();
    }

    // Edge effect
    if (_borderEl) {
      _borderEl.style.boxShadow = 'inset 0 0 30px rgba(0,255,255,0.4)';
    }

    _playWhoosh();
    if (window.HUD && window.HUD.showToast) window.HUD.showToast('⚡ SPEED BOOST ACTIVE');
  }

  function _deactivate() {
    _active = false;
    window._speedBoostActive = false;
    window._speedBoostMult = 1.0;
    window._speedBoostTimer = 0;

    var cam = _camera || window._camera;
    if (cam && cam.fov !== undefined) {
      cam.fov = 75;
      cam.updateProjectionMatrix();
    }

    if (_borderEl) _borderEl.style.boxShadow = 'none';
    _updateHUD();
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;
    _createHUD();
    window._speedBoostActive = false;
    window._speedBoostMult = 1.0;
    window._speedBoostTimer = 0;

    document.addEventListener('keydown', function(e) {
      if (window._menuOpen || window._isPaused || window._inMenu) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        _activate();
      }
    });

    // Spawn first syringe after 30s
    setTimeout(_spawnSyringe, 30000);
  }

  function update(dt) {
    var sc = _scene || window._gameScene || window._scene;

    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('⚡ SPEED BOOST READY');
      }
    }

    if (_active) {
      _timer -= dt;
      window._speedBoostTimer = _timer;

      // Warning at 1.5s remaining
      if (_timer < 1.5 && _timer > 0) {
        if (Math.floor(_timer * 4) % 2 === 0) {
          if (window.HUD && window.HUD.showToast && Math.floor(_timer) !== Math.floor(_timer + dt)) {
            window.HUD.showToast('⚡ SPEED FADING');
          }
        }
      }

      // Heartbeat sound
      if (Math.floor(Date.now() / 500) % 2 === 0 && Math.floor((Date.now() + dt * 1000) / 500) % 2 !== 0) {
        _playHeartbeat();
      }

      // Trail particles
      _spawnTrail();

      // Camera shake
      var cam = _camera || window._camera;
      if (cam) {
        cam.position.x += (Math.random() - 0.5) * 0.006;
        cam.position.y += (Math.random() - 0.5) * 0.004;
      }

      if (_timer <= 0) _deactivate();
    }

    // Update trails
    for (var i = _trailPool.length - 1; i >= 0; i--) {
      var t = _trailPool[i];
      t.life -= dt;
      t.mat.opacity = Math.max(0, t.life / 0.4 * 0.8);
      if (t.life <= 0) {
        if (sc) sc.remove(t.mesh);
        _trailPool.splice(i, 1);
      }
    }

    // Syringe pickup check
    if (_syringePickup && !_syringePickup.collected) {
      _syringeTimer += dt;
      _syringePickup.mesh.rotation.y += 1.5 * dt;
      _syringePickup.mesh.position.y = 1.2 + Math.sin(_syringeTimer * 2) * 0.15;
      var cam2 = _camera || window._camera;
      if (cam2) {
        var dx = cam2.position.x - _syringePickup.mesh.position.x;
        var dz = cam2.position.z - _syringePickup.mesh.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
          _syringePickup.collected = true;
          if (sc) { sc.remove(_syringePickup.mesh); sc.remove(_syringePickup.light); }
          _cooldown = 0;
          if (window.HUD && window.HUD.showToast) window.HUD.showToast('💉 ADRENALINE — SPEED READY');
          setTimeout(_spawnSyringe, 90000);
        }
      }
    }

    _updateHUD();
  }

  function reset() {
    _deactivate();
    _cooldown = 0;
    _syringePickup = null;
    for (var i = 0; i < _trailPool.length; i++) {
      var sc = _scene || window._gameScene || window._scene;
      if (sc) sc.remove(_trailPool[i].mesh);
    }
    _trailPool = [];
    _updateHUD();
  }

  return { init: init, update: update, activate: _activate, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail speed-boost.js",_e&&_e.message); }
