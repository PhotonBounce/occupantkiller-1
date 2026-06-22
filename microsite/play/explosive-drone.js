// explosive-drone.js — Kamikaze hunting drone that targets enemies
// Deploy Key: F8
// API: window.ExplosiveDrone = { init, update, deploy, reset }
// window._activeDroneCount — global drone count

window.ExplosiveDrone = (function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────────────
  var CFG = {
    DEPLOY_KEY:       'F8',
    MAX_DRONES:       2,
    DRONE_SPEED:      12,        // units/sec
    DRONE_HP:         30,
    DETONATE_RADIUS:  0.5,       // contact distance
    EXPLOSION_RADIUS: 5,
    EXPLOSION_DAMAGE: 90,
    HUNT_HEIGHT:      1.8,       // hover height above ground
    JAM_CHANCE:       0.20,      // 20% chance drone jams near radio emitter
    ROTOR_HZ:         1200,      // sawtooth oscillator freq
    ROTOR_VOL:        0.3,
    LED_BLINK_RATE:   4,         // blinks/sec
    ORBIT_RADIUS:     2.5,       // orbit radius when circling (no LOS)
    ORBIT_SPEED:      2.0,
  };

  // ── Private state ─────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _drones   = [];       // array of drone objects
  var _audioCtx = null;
  var _hudEl    = null;

  window._activeDroneCount = 0;

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx && _audioCtx.state !== 'closed') return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
    return _audioCtx;
  }

  function _startRotorSound(droneObj) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type            = 'sawtooth';
      osc.frequency.value = CFG.ROTOR_HZ;
      gain.gain.value     = CFG.ROTOR_VOL;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      droneObj._audioOsc  = osc;
      droneObj._audioGain = gain;
    } catch (e) { /* audio unavailable */ }
  }

  function _stopRotorSound(droneObj) {
    try {
      if (droneObj._audioOsc) {
        droneObj._audioOsc.stop();
        droneObj._audioOsc.disconnect();
        droneObj._audioOsc = null;
      }
      if (droneObj._audioGain) {
        droneObj._audioGain.disconnect();
        droneObj._audioGain = null;
      }
    } catch (e) { /* ignore */ }
  }

  function _updateRotorVolume(droneObj, playerPos) {
    if (!droneObj._audioGain || !playerPos) return;
    var dp  = droneObj.mesh.position;
    var dx  = dp.x - playerPos.x;
    var dy  = dp.y - playerPos.y;
    var dz  = dp.z - playerPos.z;
    var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    // Fade out beyond 20 units
    var vol = CFG.ROTOR_VOL * Math.max(0, 1 - dist / 20);
    try {
      droneObj._audioGain.gain.value = vol;
    } catch (e) { /* ignore */ }
  }

  // ── Mesh builders ─────────────────────────────────────────────────────────
  function _buildDroneMesh() {
    var group = new THREE.Group();

    // Body — dark box
    var bodyGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 4 mini-rotors at corners
    var rotorPositions = [
      [ 0.18, 0,  0.18],
      [-0.18, 0,  0.18],
      [ 0.18, 0, -0.18],
      [-0.18, 0, -0.18],
    ];
    var rotorGeo = new THREE.BoxGeometry(0.12, 0.02, 0.12);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (var i = 0; i < rotorPositions.length; i++) {
      var rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(rotorPositions[i][0], rotorPositions[i][1], rotorPositions[i][2]);
      group.add(rotor);
    }

    // Blinking LED (red point light)
    var led = new THREE.PointLight(0xff2200, 1.2, 2);
    led.position.set(0, 0.08, 0);
    group.add(led);

    return { group: group, led: led };
  }

  // ── Small explosion (drone destroyed prematurely) ─────────────────────────
  function _smallExplosion(pos) {
    if (typeof window.Tracers !== 'undefined' && window.Tracers.spawnExplosion) {
      window.Tracers.spawnExplosion(pos.clone(), 1.5);
    }
    _playExplosionSound(0.25);
  }

  // ── Full kamikaze explosion ───────────────────────────────────────────────
  function _kaminkazeExplode(droneObj, enemies, silent) {
    if (!_scene) return;
    var pos = droneObj.mesh.position.clone();

    // VFX — fireball + smoke via Tracers
    if (typeof window.Tracers !== 'undefined' && window.Tracers.spawnExplosion) {
      window.Tracers.spawnExplosion(pos, CFG.EXPLOSION_RADIUS);
    }

    // Camera shake
    if (typeof window.CameraSystem !== 'undefined' && window.CameraSystem.shake) {
      try { window.CameraSystem.shake(0.6); } catch (e) { /* ignore */ }
    }

    // Damage enemies in radius
    if (enemies && enemies.length) {
      for (var i = 0; i < enemies.length; i++) {
        var en = enemies[i];
        if (!en || !en.mesh) continue;
        var ep  = en.mesh.position;
        var ddx = ep.x - pos.x;
        var ddy = ep.y - pos.y;
        var ddz = ep.z - pos.z;
        var dist = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz);
        if (dist <= CFG.EXPLOSION_RADIUS) {
          var falloff = 1 - (dist / CFG.EXPLOSION_RADIUS);
          var dmg = Math.round(CFG.EXPLOSION_DAMAGE * falloff);
          if (en.hp !== undefined) en.hp -= dmg;
          // Some systems expose takeDamage
          if (typeof en.takeDamage === 'function') en.takeDamage(dmg);
        }
      }
    }

    if (!silent) _playExplosionSound(1.0);

    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup('💥 DRONE DETONATED!', '#ff6600');
    }
  }

  function _playExplosionSound(volume) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer     = buf;
      gain.gain.value = Math.min(1, volume);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  // ── Remove drone from scene and arrays ───────────────────────────────────
  function _removeDrone(droneObj) {
    _stopRotorSound(droneObj);
    if (_scene && droneObj.mesh) {
      _scene.remove(droneObj.mesh);
    }
    var idx = _drones.indexOf(droneObj);
    if (idx !== -1) _drones.splice(idx, 1);
    window._activeDroneCount = _drones.length;
    _updateHud();
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _updateHud() {
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'explosive-drone-hud';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:145px',
        'right:12px',
        'background:rgba(0,0,0,0.65)',
        'border:1px solid #ff6600',
        'color:#ff9933',
        'font-family:monospace',
        'font-size:11px',
        'padding:4px 8px',
        'border-radius:3px',
        'z-index:8001',
        'pointer-events:none',
        'display:none',
      ].join(';');
      document.body.appendChild(_hudEl);
    }
    var count = _drones.length;
    if (count > 0) {
      _hudEl.style.display = 'block';
      _hudEl.textContent   = '🚁 DRONE x' + count + '  [F8: DETONATE]';
    } else {
      _hudEl.style.display = _drones.length === 0 ? 'none' : 'block';
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
  }

  // ── Public: deploy ────────────────────────────────────────────────────────
  function deploy(playerPos) {
    if (!_scene) {
      if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
        window.HUD.notifyPickup('🚁 DRONE: Not ready (no scene)', '#ff4400');
      }
      return;
    }

    // If we already have drones: recall-detonate oldest one
    if (_drones.length >= CFG.MAX_DRONES) {
      var oldest = _drones[0];
      _kaminkazeExplode(oldest, [], false);
      _removeDrone(oldest);
      return;
    }

    // Spawn new drone
    var built = _buildDroneMesh();
    var group = built.group;
    var led   = built.led;

    group.position.set(
      playerPos.x + (Math.random() - 0.5) * 0.5,
      playerPos.y + 2,
      playerPos.z + (Math.random() - 0.5) * 0.5
    );
    _scene.add(group);

    var droneObj = {
      mesh:        group,
      led:         led,
      hp:          CFG.DRONE_HP,
      target:      null,
      orbitAngle:  Math.random() * Math.PI * 2,
      ledTimer:    0,
      ledOn:       true,
      jammed:      false,
      jamTimer:    0,
      _audioOsc:   null,
      _audioGain:  null,
    };

    _drones.push(droneObj);
    window._activeDroneCount = _drones.length;

    _startRotorSound(droneObj);
    _updateHud();

    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup('🚁 DRONE DEPLOYED — hunting enemies  [F8: detonate]', '#ff9933');
    }
  }

  // ── Public: update ────────────────────────────────────────────────────────
  function update(dt, enemies, playerPos) {
    if (!_scene || _drones.length === 0) return;

    // Work on a copy so splice inside loop is safe
    var active = _drones.slice();
    for (var i = 0; i < active.length; i++) {
      _tickDrone(active[i], dt, enemies, playerPos);
    }
    _updateHud();
  }

  function _tickDrone(droneObj, dt, enemies, playerPos) {
    if (!droneObj.mesh) return;

    // ── LED blink ────────────────────────────────────────────────
    droneObj.ledTimer += dt;
    if (droneObj.ledTimer >= 1 / CFG.LED_BLINK_RATE) {
      droneObj.ledTimer  = 0;
      droneObj.ledOn     = !droneObj.ledOn;
      if (droneObj.led) droneObj.led.intensity = droneObj.ledOn ? 1.2 : 0;
    }

    // ── Rotor spin (rotate whole group) ──────────────────────────
    droneObj.mesh.rotation.y += dt * 3.0;

    // ── Audio distance fade ───────────────────────────────────────
    _updateRotorVolume(droneObj, playerPos);

    // ── Jam check (atmosphere: 20% if near radio emitter concept) ─
    if (droneObj.jamTimer > 0) {
      droneObj.jamTimer -= dt;
      if (droneObj.jamTimer <= 0) droneObj.jammed = false;
    }
    // Simulate: 20% chance to jam when close to any enemy (radio emitter concept)
    if (!droneObj.jammed && droneObj.target && Math.random() < CFG.JAM_CHANCE * dt) {
      droneObj.jammed   = true;
      droneObj.jamTimer = 1.5 + Math.random() * 1.5;
    }

    // ── Find nearest live enemy ───────────────────────────────────
    droneObj.target = null;
    var nearestDist = Infinity;
    if (enemies && enemies.length) {
      for (var j = 0; j < enemies.length; j++) {
        var en = enemies[j];
        if (!en || !en.mesh) continue;
        if (en.hp !== undefined && en.hp <= 0) continue;
        var ep  = en.mesh.position;
        var ddx = ep.x - droneObj.mesh.position.x;
        var ddy = ep.y - droneObj.mesh.position.y;
        var ddz = ep.z - droneObj.mesh.position.z;
        var dist = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz);
        if (dist < nearestDist) {
          nearestDist = dist;
          droneObj.target = en;
        }
      }
    }

    // ── Movement ──────────────────────────────────────────────────
    var pos = droneObj.mesh.position;

    if (droneObj.jammed) {
      // Jammed: hover in place with bob
      pos.y += Math.sin(Date.now() * 0.003) * 0.005;
    } else if (droneObj.target) {
      var tp   = droneObj.target.mesh.position;
      var tdx  = tp.x - pos.x;
      var tdy  = (tp.y + CFG.HUNT_HEIGHT) - pos.y;
      var tdz  = tp.z - pos.z;
      var tlen = Math.sqrt(tdx*tdx + tdy*tdy + tdz*tdz);

      if (tlen > 0.001) {
        // Simple LOS approximation: try direct path if dist > orbit radius
        if (nearestDist > CFG.ORBIT_RADIUS * 1.5) {
          // Fly straight toward enemy
          var spd = CFG.DRONE_SPEED * dt;
          pos.x += (tdx / tlen) * spd;
          pos.y += (tdy / tlen) * spd;
          pos.z += (tdz / tlen) * spd;
        } else {
          // Close in — orbit to simulate no direct LOS path
          droneObj.orbitAngle += CFG.ORBIT_SPEED * dt;
          var ox = tp.x + Math.cos(droneObj.orbitAngle) * CFG.ORBIT_RADIUS;
          var oy = tp.y + CFG.HUNT_HEIGHT;
          var oz = tp.z + Math.sin(droneObj.orbitAngle) * CFG.ORBIT_RADIUS;
          var lerpK = CFG.DRONE_SPEED * dt / Math.max(0.01, CFG.ORBIT_RADIUS);
          pos.x += (ox - pos.x) * lerpK;
          pos.y += (oy - pos.y) * lerpK;
          pos.z += (oz - pos.z) * lerpK;
        }
      }

      // ── Contact detonation ────────────────────────────────────
      if (nearestDist <= CFG.DETONATE_RADIUS) {
        _kaminkazeExplode(droneObj, enemies, false);
        _removeDrone(droneObj);
        return;
      }
    } else {
      // No target — bob in place waiting
      pos.y += Math.sin(Date.now() * 0.002) * 0.003;
    }
  }

  // ── Public: recall-detonate all (player presses key when drone already out) ──
  function recallDetonate(enemies) {
    if (_drones.length === 0) return false;
    var toRemove = _drones.slice();
    for (var i = 0; i < toRemove.length; i++) {
      _kaminkazeExplode(toRemove[i], enemies || [], false);
      _removeDrone(toRemove[i]);
    }
    return true;
  }

  // ── Public: take damage (enemies can shoot drone) ────────────────────────
  function damageDrone(droneObj, amount) {
    if (!droneObj) return;
    droneObj.hp -= amount;
    if (droneObj.hp <= 0) {
      _smallExplosion(droneObj.mesh.position.clone());
      if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
        window.HUD.notifyPickup('🚁 DRONE SHOT DOWN!', '#ff4400');
      }
      _removeDrone(droneObj);
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    var toRemove = _drones.slice();
    for (var i = 0; i < toRemove.length; i++) {
      _kaminkazeExplode(toRemove[i], [], true);  // silent detonation on reset
      _removeDrone(toRemove[i]);
    }
    _drones = [];
    window._activeDroneCount = 0;
    _updateHud();
  }

  // ── Expose ────────────────────────────────────────────────────────────────
  return {
    init:           init,
    update:         update,
    deploy:         deploy,
    reset:          reset,
    recallDetonate: recallDetonate,
    damageDrone:    damageDrone,
    getDrones:      function () { return _drones; },
  };
})();
