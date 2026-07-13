// ============================================================
//  signal-flare.js — Distress flare: marks area, calls air support
//  Alt+F to fire upward; 2 flares, 50s cooldown per flare
//  Public API: init(scene, camera, renderer), update(dt), fire(), reset()
// ============================================================
window.SignalFlare = (function () {
  'use strict';

  /* ── Private state ───────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;

  var _flares   = [];        // active flare state objects
  var _flareCount = 2;       // remaining flares
  var _MAX_FLARES = 2;
  var _COOLDOWN = 50;        // seconds between reloads
  var _cooldownTimer = 0;    // counts down from _COOLDOWN

  /* ── Geometries (shared, lazy created) ──────────────────── */
  var _projectileGeo  = null;
  var _smokeGeo       = null;
  var _glowGeo        = null;
  var _chuteGeo       = null;

  /* ── HUD elements ────────────────────────────────────────── */
  var _hudCounterEl   = null;  // "FLARE x2"
  var _hudActiveEl    = null;  // pulsing "FLARE ACTIVE" top-center

  /* ── Key binding ─────────────────────────────────────────── */
  var _keyHandlerAttached = false;

  /* ── Helpers ─────────────────────────────────────────────── */
  function _lazyGeos() {
    if (!_projectileGeo) _projectileGeo = new THREE.SphereGeometry(0.08, 6, 6);
    if (!_smokeGeo)      _smokeGeo      = new THREE.SphereGeometry(0.04, 4, 4);
    if (!_glowGeo)       _glowGeo       = new THREE.SphereGeometry(0.4, 8, 8);
    if (!_chuteGeo)      _chuteGeo      = new THREE.ConeGeometry(0.5, 1, 6);
  }

  /* ── Show a toast notification ───────────────────────────── */
  function _toast(msg, color) {
    color = color || '#ff4444';
    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg, color);
      return;
    }
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:18%;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.75);border:1px solid ' + color + ';color:' + color + ';' +
      'font-family:monospace;font-size:14px;padding:6px 18px;border-radius:5px;' +
      'z-index:5000;pointer-events:none;letter-spacing:2px;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  /* ── Audio helpers ───────────────────────────────────────── */
  function _playPop() {
    if (typeof window.AudioSystem !== 'undefined') {
      if (window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(0.5);
      else if (window.AudioSystem.playGunshot) window.AudioSystem.playGunshot();
    }
  }

  function _playApexPop() {
    if (typeof window.AudioSystem !== 'undefined') {
      if (window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(0.8);
      else if (window.AudioSystem.playGunshot) window.AudioSystem.playGunshot();
    }
  }

  function _playGunshot() {
    if (typeof window.AudioSystem !== 'undefined') {
      if (window.AudioSystem.playSpatialGunshot) window.AudioSystem.playSpatialGunshot();
      else if (window.AudioSystem.playGunshot) window.AudioSystem.playGunshot();
    }
  }

  /* ── Enemy detection within radius ──────────────────────── */
  function _revealEnemies(pos, radius) {
    if (typeof window.enemies === 'undefined' || !Array.isArray(window.enemies)) return;
    for (var i = 0; i < window.enemies.length; i++) {
      var e = window.enemies[i];
      if (!e || !e.mesh) continue;
      var dx = e.mesh.position.x - pos.x;
      var dz = e.mesh.position.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= radius) {
        e._flareRevealed = true;
      }
    }
  }

  /* ── Air support effect ──────────────────────────────────── */
  function _triggerAirSupport() {
    _toast('AIR SUPPORT INBOUND', '#ff4444');

    // 3 distant gunshot sounds with small delays
    var delays = [200, 600, 1100];
    for (var d = 0; d < delays.length; d++) {
      (function (delay) {
        setTimeout(function () { _playGunshot(); }, delay);
      })(delays[d]);
    }

    // 1 random enemy takes 80 damage
    if (typeof window.enemies !== 'undefined' && Array.isArray(window.enemies) && window.enemies.length > 0) {
      var alive = [];
      for (var i = 0; i < window.enemies.length; i++) {
        if (window.enemies[i] && window.enemies[i].health > 0) alive.push(window.enemies[i]);
      }
      if (alive.length > 0) {
        var target = alive[Math.floor(Math.random() * alive.length)];
        if (typeof target.health === 'number') {
          target.health -= 80;
          if (target.health <= 0) {
            target.health = 0;
            if (typeof target.die === 'function') target.die();
          }
        }
      }
    }
  }

  /* ── Create the flare projectile visual ─────────────────── */
  function _createProjectile(startPos) {
    _lazyGeos();
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF2200 });
    var mesh = new THREE.Mesh(_projectileGeo, mat);
    mesh.position.copy(startPos);
    if (_scene) _scene.add(mesh);
    return { mesh: mesh, mat: mat };
  }

  /* ── Spawn a red smoke trail particle ────────────────────── */
  function _spawnSmokeParticle(pos, particles) {
    if (!_scene) return;
    _lazyGeos();
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFF2200,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    var mesh = new THREE.Mesh(_smokeGeo, mat);
    mesh.position.copy(pos);
    var s = 0.4 + Math.random() * 0.6;
    mesh.scale.setScalar(s);
    _scene.add(mesh);
    particles.push({ mesh: mesh, mat: mat, life: 1.2, maxLife: 1.2 });
    // Cap at 20
    while (particles.length > 20) {
      var old = particles.shift();
      if (_scene) _scene.remove(old.mesh);
      if (old.mat && old.mat.dispose) old.mat.dispose();
    }
  }

  /* ── Update smoke particles ──────────────────────────────── */
  function _updateSmoke(particles, dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= dt;
      p.mesh.position.y += 0.15 * dt;
      p.mesh.position.x += (Math.random() - 0.5) * 0.03;
      p.mesh.position.z += (Math.random() - 0.5) * 0.03;
      p.mat.opacity = Math.max(0, (p.life / p.maxLife) * 0.7);
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        if (p.mat && p.mat.dispose) p.mat.dispose();
        particles.splice(i, 1);
      }
    }
  }

  /* ── Create the apex burst (light + glow mesh + parachute) ─ */
  function _createApex(pos) {
    _lazyGeos();

    var group = new THREE.Group();
    group.position.copy(pos);

    // Bright point light
    var light = new THREE.PointLight(0xFF3300, 20, 40);
    group.add(light);

    // Glow sphere (red/orange)
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0xFF4400,
      transparent: true,
      opacity: 0.9,
    });
    var glowMesh = new THREE.Mesh(_glowGeo, glowMat);
    group.add(glowMesh);

    // Parachute cone above
    var chuteMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    var chuteMesh = new THREE.Mesh(_chuteGeo, chuteMat);
    chuteMesh.position.y = 1.0;  // above the glow
    group.add(chuteMesh);

    if (_scene) _scene.add(group);

    return {
      group:    group,
      light:    light,
      glowMesh: glowMesh,
      glowMat:  glowMat,
      chuteMesh: chuteMesh,
      chuteMat:  chuteMat,
    };
  }

  /* ── Destroy an apex burst ───────────────────────────────── */
  function _destroyApex(apex) {
    if (_scene && apex.group) _scene.remove(apex.group);
    if (apex.glowMat  && apex.glowMat.dispose)  apex.glowMat.dispose();
    if (apex.chuteMat && apex.chuteMat.dispose) apex.chuteMat.dispose();
  }

  /* ── Update HUD counter ──────────────────────────────────── */
  function _updateHUDCounter() {
    if (!_hudCounterEl) return;
    _hudCounterEl.textContent = '🔴 FLARE ×' + _flareCount;
    _hudCounterEl.style.display = 'block';
  }

  /* ── Update "FLARE ACTIVE" pulsing indicator ─────────────── */
  function _updateHUDActive() {
    if (!_hudActiveEl) return;
    var anyActive = false;
    for (var i = 0; i < _flares.length; i++) {
      if (_flares[i].state !== 'done') { anyActive = true; break; }
    }
    window._flareActive = anyActive;
    // update position global
    if (anyActive && _flares.length > 0) {
      var f = _flares[0];
      if (f.state === 'descending' && f.apex) {
        window._flarePos = f.apex.group.position.clone();
      } else if (f.projectile) {
        window._flarePos = f.projectile.mesh.position.clone();
      }
    } else {
      window._flarePos = null;
    }

    if (anyActive) {
      _hudActiveEl.style.display = 'block';
    } else {
      _hudActiveEl.style.display = 'none';
    }
  }

  /* ── Night vision blinding overlay ──────────────────────── */
  function _updateNVGBlind(show) {
    var el = document.getElementById('signal-flare-nvg-blind');
    if (show && window._nvgActive) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'signal-flare-nvg-blind';
        el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;' +
          'pointer-events:none;z-index:9990;' +
          'background:rgba(255,120,60,0.45);' +
          'filter:brightness(3) saturate(3);';
        document.body.appendChild(el);
      }
      el.style.display = 'block';
    } else {
      if (el) el.style.display = 'none';
    }
  }

  /* ── Register Alt+F keydown ──────────────────────────────── */
  function _attachKeyHandler() {
    if (_keyHandlerAttached) return;
    _keyHandlerAttached = true;
    document.addEventListener('keydown', function (ev) {
      if (ev.altKey && (ev.code === 'KeyF' || ev.key === 'f' || ev.key === 'F')) {
        ev.preventDefault();
        fire();
      }
    });
  }

  /* ── Public: init ────────────────────────────────────────── */
  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;
    _flares   = [];
    _flareCount = _MAX_FLARES;
    _cooldownTimer = 0;

    // Flare counter HUD (bottom-center area)
    var counterEl = document.getElementById('signal-flare-counter');
    if (!counterEl) {
      counterEl = document.createElement('div');
      counterEl.id = 'signal-flare-counter';
      counterEl.style.cssText = 'position:fixed;bottom:420px;left:50%;transform:translateX(-50%);' +
        'color:#ff2200;font-size:12px;font-family:monospace;z-index:200;pointer-events:none;' +
        'background:rgba(0,0,0,0.5);padding:2px 10px;border-radius:3px;' +
        'border:1px solid #ff2200;display:block;';
      document.body.appendChild(counterEl);
    }
    _hudCounterEl = counterEl;

    // Pulsing "FLARE ACTIVE" top-center
    var activeEl = document.getElementById('signal-flare-active');
    if (!activeEl) {
      activeEl = document.createElement('div');
      activeEl.id = 'signal-flare-active';
      activeEl.style.cssText = 'display:none;position:fixed;top:38px;left:50%;' +
        'transform:translateX(-50%);color:#ff2200;font-size:13px;font-family:monospace;' +
        'z-index:201;pointer-events:none;letter-spacing:2px;' +
        'text-shadow:0 0 8px rgba(255,34,0,0.9);' +
        'animation:signalFlareActivePulse 0.8s ease-in-out infinite;';
      activeEl.textContent = 'FLARE ACTIVE';
      document.body.appendChild(activeEl);

      // Inject pulse keyframes once
      if (!document.getElementById('signal-flare-style')) {
        var style = document.createElement('style');
        style.id = 'signal-flare-style';
        style.textContent = '@keyframes signalFlareActivePulse{0%,100%{opacity:1}50%{opacity:0.25}}';
        document.head.appendChild(style);
      }
    }
    _hudActiveEl = activeEl;

    _attachKeyHandler();

    window._flareActive = false;
    window._flarePos    = null;

    _updateHUDCounter();
  }

  /* ── Public: fire ────────────────────────────────────────── */
  function fire() {
    if (!_scene || !_camera) return;
    if (_flareCount <= 0) {
      _toast('NO FLARES — RELOADING (' + Math.ceil(_cooldownTimer) + 's)', '#ff6600');
      return;
    }

    _flareCount--;
    _updateHUDCounter();

    // Start cooldown reload if needed
    if (_flareCount < _MAX_FLARES && _cooldownTimer <= 0) {
      _cooldownTimer = _COOLDOWN;
    }

    var startPos = _camera.position.clone();
    startPos.y -= 0.1; // slightly below eye

    var projectile = _createProjectile(startPos);

    var flareObj = {
      state:          'ascending',  // 'ascending' | 'descending' | 'done'
      projectile:     projectile,
      smokeParticles: [],
      apex:           null,
      // physics
      posY:           startPos.y,
      posX:           startPos.x,
      posZ:           startPos.z,
      velY:           12,            // 12 u/s upward
      // timing
      timer:          0,
      apexTriggered:  false,
      descentTimer:   0,
      supportTriggered: false,
      // support call delay
      supportDelay:   8,
    };

    _flares.push(flareObj);

    // Loud pop on fire
    _playPop();

    _toast('SIGNAL FLARE FIRED [Alt+F]', '#ff2200');
  }

  /* ── Public: update(dt) ──────────────────────────────────── */
  function update(dt) {
    if (!dt || dt <= 0) return;

    // Cooldown / reload
    if (_cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _cooldownTimer = 0;
        _flareCount = _MAX_FLARES;
        _updateHUDCounter();
        _toast('FLARES RELOADED', '#ff4400');
      }
    }

    var time = (typeof performance !== 'undefined') ? performance.now() * 0.001 : 0;

    for (var i = _flares.length - 1; i >= 0; i--) {
      var f = _flares[i];

      if (f.state === 'ascending') {
        f.timer += dt;

        // Move projectile upward
        f.posY += f.velY * dt;
        f.velY -= 2 * dt;  // slight drag / gravity fighting the thrust
        f.projectile.mesh.position.set(f.posX, f.posY, f.posZ);

        // Spawn red smoke trail each frame
        _spawnSmokeParticle(f.projectile.mesh.position, f.smokeParticles);
        _updateSmoke(f.smokeParticles, dt);

        // Apex condition: Y >= 15 OR 2 seconds elapsed
        if (f.posY >= 15 || f.timer >= 2) {
          _triggerApex(f);
        }

        // Air support after 8s
        if (!f.supportTriggered && f.timer >= f.supportDelay) {
          f.supportTriggered = true;
          _triggerAirSupport();
        }

      } else if (f.state === 'descending') {
        f.descentTimer += dt;
        f.timer += dt;

        // Descend at 0.8 u/s
        f.posY -= 0.8 * dt;
        f.apex.group.position.y = f.posY;

        // Update smoke from apex
        _spawnSmokeParticle(f.apex.group.position, f.smokeParticles);
        _updateSmoke(f.smokeParticles, dt);

        // Reveal enemies within 25 units every second
        if (Math.floor(f.descentTimer) > Math.floor(f.descentTimer - dt)) {
          _revealEnemies(f.apex.group.position, 25);
        }

        // Night vision blinding
        _updateNVGBlind(true);

        // Light pulse
        var pulseIntensity = 18 + Math.sin(time * 3) * 2;
        f.apex.light.intensity = pulseIntensity;

        // Glow pulse
        var glowScale = 0.9 + Math.sin(time * 4) * 0.15;
        f.apex.glowMesh.scale.setScalar(glowScale);

        // Air support after 8s total
        if (!f.supportTriggered && f.timer >= f.supportDelay) {
          f.supportTriggered = true;
          _triggerAirSupport();
        }

        // Burn out after 12s of descent
        if (f.descentTimer >= 12) {
          _cleanupFlare(f);
          _flares.splice(i, 1);
          continue;
        }

      } else if (f.state === 'done') {
        _flares.splice(i, 1);
        continue;
      }
    }

    _updateHUDActive();

    // Turn off NVG blind if no active descending flares
    var anyDescending = false;
    for (var j = 0; j < _flares.length; j++) {
      if (_flares[j].state === 'descending') { anyDescending = true; break; }
    }
    if (!anyDescending) _updateNVGBlind(false);
  }

  /* ── Trigger apex pop ────────────────────────────────────── */
  function _triggerApex(f) {
    f.state = 'descending';
    f.descentTimer = 0;

    // Remove projectile
    if (_scene && f.projectile && f.projectile.mesh) {
      _scene.remove(f.projectile.mesh);
    }
    if (f.projectile && f.projectile.mat && f.projectile.mat.dispose) {
      f.projectile.mat.dispose();
    }
    f.projectile = null;

    // Create apex burst at current position
    var apexPos = new THREE.Vector3(f.posX, f.posY, f.posZ);
    f.apex = _createApex(apexPos);

    // Apex pop sound
    _playApexPop();
  }

  /* ── Cleanup one flare's resources ──────────────────────── */
  function _cleanupFlare(f) {
    // Remove projectile if still around
    if (f.projectile) {
      if (_scene && f.projectile.mesh) _scene.remove(f.projectile.mesh);
      if (f.projectile.mat && f.projectile.mat.dispose) f.projectile.mat.dispose();
      f.projectile = null;
    }
    // Remove apex
    if (f.apex) {
      _destroyApex(f.apex);
      f.apex = null;
    }
    // Remove smoke
    for (var i = 0; i < f.smokeParticles.length; i++) {
      var p = f.smokeParticles[i];
      if (_scene) _scene.remove(p.mesh);
      if (p.mat && p.mat.dispose) p.mat.dispose();
    }
    f.smokeParticles = [];
    f.state = 'done';
  }

  /* ── Public: reset ───────────────────────────────────────── */
  function reset() {
    for (var i = 0; i < _flares.length; i++) {
      _cleanupFlare(_flares[i]);
    }
    _flares = [];
    _flareCount = _MAX_FLARES;
    _cooldownTimer = 0;
    window._flareActive = false;
    window._flarePos    = null;
    _updateNVGBlind(false);
    if (_hudActiveEl)  _hudActiveEl.style.display  = 'none';
    if (_hudCounterEl) _updateHUDCounter();
  }

  /* ── Expose public API ───────────────────────────────────── */
  return {
    init:   init,
    update: update,
    fire:   fire,
    reset:  reset,
  };

})();
