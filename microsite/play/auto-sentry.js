// auto-sentry.js — Deployable auto-targeting sentry gun turret
// Ctrl+U to place at player position (max 3 active).
// Targets nearest enemy within 18 units, fires every 0.3s, 25 dmg/shot, 60 rounds.
// HP: 150. Explodes on death, drops ammo pack. HUD: 🤖 SENTRY ×N bottom-right.
// Alert light: green glow, turns red when firing.
// Audio: servo whir (rotating), fire clatter (shooting), explosion (destroy).
// Score: +25 per sentry kill. Public API: init(scene, camera), update(dt), place(), reset()

window.AutoSentry = (function () {
  'use strict';

  // ─── Private state ────────────────────────────────────────────────────────

  var _scene = null;
  var _camera = null;

  var _sentries = [];
  var _MAX_SENTRIES = 3;
  var _FIRE_RATE = 0.3;     // seconds between shots
  var _RANGE = 18;          // detection range in world units
  var _DAMAGE = 25;         // damage per shot
  var _MAX_HP = 150;
  var _MAX_AMMO = 60;
  var _AIM_THRESHOLD = 15; // degrees within which we consider "aimed"

  var _ctrlUDown = false;   // debounce Ctrl+U

  var _hudEl = null;        // HUD element reference
  var _tracers = [];        // active bullet tracer lines

  // ─── Audio helpers ────────────────────────────────────────────────────────

  function _getAudioCtx() {
    try {
      return window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }

  function _playServoWhir() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function _playFireClatter() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufSize = ctx.sampleRate * 0.06;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  function _playExplosion() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufSize = ctx.sampleRate * 0.5;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  // ─── Mesh builder ─────────────────────────────────────────────────────────

  function _buildSentryMesh() {
    var group = new THREE.Group();

    // Base — dark metal gray cylinder
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 0.4, 8),
      baseMat
    );
    base.position.y = 0.2;
    group.add(base);

    // Pivot — box that rotates to track enemies
    var pivotGroup = new THREE.Group();
    pivotGroup.position.y = 0.5;
    group.add(pivotGroup);

    var pivotMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var pivot = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.2),
      pivotMat
    );
    pivotGroup.add(pivot);

    // Barrel — cylinder extending forward from pivot (along -Z in local space)
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6),
      barrelMat
    );
    barrel.rotation.x = Math.PI / 2;   // rotate so it points along -Z
    barrel.position.z = -0.4;          // extend forward from pivot center
    pivotGroup.add(barrel);

    // Ammo LED — small sphere on the base
    var ledMat = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
    var led = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      ledMat
    );
    led.position.set(0.2, 0.42, 0);
    group.add(led);

    // Alert / firing PointLight — green glow
    var alertLight = new THREE.PointLight(0x00FF00, 3, 8);
    alertLight.position.y = 0.5;
    group.add(alertLight);

    return {
      group: group,
      pivotGroup: pivotGroup,
      led: led,
      ledMat: ledMat,
      alertLight: alertLight
    };
  }

  // ─── Bullet tracer ────────────────────────────────────────────────────────

  function _spawnTracer(from, to) {
    if (!_scene) return;
    var points = [from.clone(), to.clone()];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
    var line = new THREE.Line(geo, mat);
    _scene.add(line);
    _tracers.push({ line: line, mat: mat, life: 0.05 });
  }

  function _updateTracers(dt) {
    var i = _tracers.length;
    while (i--) {
      var t = _tracers[i];
      t.life -= dt;
      t.mat.opacity = Math.max(0, t.life / 0.05);
      if (t.life <= 0) {
        _scene.remove(t.line);
        t.line.geometry.dispose();
        t.mat.dispose();
        _tracers.splice(i, 1);
      }
    }
  }

  // ─── Explosion VFX ────────────────────────────────────────────────────────

  function _spawnExplosion(pos) {
    if (!_scene) return;
    // Spawn several particles as small orange spheres that fade
    var particles = [];
    for (var i = 0; i < 12; i++) {
      var mat = new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 1.0 });
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), mat);
      mesh.position.copy(pos);
      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 4,
        (Math.random() - 0.5) * 4
      );
      _scene.add(mesh);
      particles.push({ mesh: mesh, mat: mat, vel: vel, life: 0.5 });
    }
    // Flash light
    var flash = new THREE.PointLight(0xFF6600, 8, 6);
    flash.position.copy(pos);
    _scene.add(flash);
    particles.push({ mesh: flash, mat: null, vel: new THREE.Vector3(), life: 0.12, isLight: true });

    // Store for update loop — piggyback on _tracers with a flag
    for (var j = 0; j < particles.length; j++) {
      _tracers.push({ explosion: true, particle: particles[j] });
    }
  }

  function _updateExplosionParticle(entry, dt) {
    var p = entry.particle;
    p.life -= dt;
    if (p.isLight) {
      p.mesh.intensity = Math.max(0, 8 * (p.life / 0.12));
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        return false;
      }
      return true;
    }
    p.mesh.position.addScaledVector(p.vel, dt);
    p.vel.y -= 6 * dt; // gravity
    p.mat.opacity = Math.max(0, p.life / 0.5);
    if (p.life <= 0) {
      _scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mat.dispose();
      return false;
    }
    return true;
  }

  // Wrap _updateTracers to handle both tracers and explosion particles
  function _updateFX(dt) {
    var i = _tracers.length;
    while (i--) {
      var entry = _tracers[i];
      if (entry.explosion) {
        var alive = _updateExplosionParticle(entry, dt);
        if (!alive) _tracers.splice(i, 1);
      } else {
        var t = entry;
        t.life -= dt;
        t.mat.opacity = Math.max(0, t.life / 0.05);
        if (t.life <= 0) {
          _scene.remove(t.line);
          t.line.geometry.dispose();
          t.mat.dispose();
          _tracers.splice(i, 1);
        }
      }
    }
  }

  // ─── Ammo pack drop ──────────────────────────────────────────────────────

  function _dropAmmoPack(pos) {
    if (!_scene) return;
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.4), mat);
    mesh.position.copy(pos);
    mesh.position.y = 0.1;
    _scene.add(mesh);

    // Simple bob + pickup check — store as a pickup object
    var pack = {
      mesh: mesh,
      pos: pos.clone(),
      life: 15, // disappear after 15 seconds
      bobT: 0
    };

    // Reuse _tracers array with a flag for mixed update
    _tracers.push({ ammoPack: true, pack: pack });
  }

  function _updateAmmoPack(entry, dt) {
    var p = entry.pack;
    p.life -= dt;
    p.bobT += dt * 2;
    p.mesh.position.y = 0.1 + Math.sin(p.bobT) * 0.05;
    p.mesh.rotation.y += dt;

    // Check if player is close enough to pick up
    if (_camera) {
      var camPos = new THREE.Vector3();
      _camera.getWorldPosition(camPos);
      if (camPos.distanceTo(p.mesh.position) < 1.5) {
        // Give player ammo — try weapons system
        if (window.player && window.player.ammo !== undefined) {
          window.player.ammo = Math.min((window.player.ammo || 0) + 30, 999);
        }
        if (window.HUD && window.HUD.showToast) {
          window.HUD.showToast('+30 Ammo (Sentry Pack)');
        }
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        return false;
      }
    }

    if (p.life <= 0) {
      _scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      return false;
    }
    return true;
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'auto-sentry-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'right:16px',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'text-align:right',
      'pointer-events:none',
      'z-index:300',
      'text-shadow:0 0 6px #00FF88'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    _ensureHUD();
    if (_sentries.length === 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var lines = ['🤖 SENTRY ×' + _sentries.length];
    for (var i = 0; i < _sentries.length; i++) {
      var s = _sentries[i];
      var hpPct = Math.round((s.hp / _MAX_HP) * 100);
      lines.push(
        '<span style="font-size:10px;opacity:0.8">  [' +
        s.ammo + '/' + _MAX_AMMO +
        '] HP:' + hpPct + '%</span>'
      );
    }
    _hudEl.innerHTML = lines.join('<br>');
  }

  // ─── Sentry logic ─────────────────────────────────────────────────────────

  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll) {
      return window.Enemies.getAll();
    }
    return [];
  }

  function _dealDamage(enemy, dmg) {
    if (enemy.takeDamage) {
      enemy.takeDamage(dmg);
    } else if (enemy.health !== undefined) {
      enemy.health -= dmg;
    }
  }

  function _getEnemyPosition(enemy) {
    if (enemy.mesh && enemy.mesh.position) return enemy.mesh.position;
    if (enemy.group && enemy.group.position) return enemy.group.position;
    if (enemy.position) return enemy.position;
    return null;
  }

  function _isEnemyAlive(enemy) {
    if (enemy.dead !== undefined) return !enemy.dead;
    if (enemy.health !== undefined) return enemy.health > 0;
    return true;
  }

  function _destroySentry(sentry) {
    var pos = sentry.meshData.group.position.clone();
    _spawnExplosion(pos);
    _playExplosion();
    _dropAmmoPack(pos);
    if (_scene) _scene.remove(sentry.meshData.group);
    // Remove DOM HP bar if any
    if (sentry.hpBarEl && sentry.hpBarEl.parentNode) {
      sentry.hpBarEl.parentNode.removeChild(sentry.hpBarEl);
    }
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('Sentry destroyed!');
    }
  }

  function _updateSentry(sentry, dt) {
    var enemies = _getEnemies();
    var sentryPos = sentry.meshData.group.position;
    var meshData = sentry.meshData;

    // Find nearest live enemy in range
    var nearest = null;
    var nearestDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!_isEnemyAlive(enemy)) continue;
      var ePos = _getEnemyPosition(enemy);
      if (!ePos) continue;
      var dist = sentryPos.distanceTo(ePos);
      if (dist < _RANGE && dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }

    sentry.isTracking = false;
    sentry.isFiring = false;

    if (nearest) {
      sentry.isTracking = true;
      var ePos = _getEnemyPosition(nearest);
      var dx = ePos.x - sentryPos.x;
      var dz = ePos.z - sentryPos.z;
      var targetAngle = Math.atan2(dx, dz); // angle on XZ plane, pointing toward enemy

      // Rotate pivot Y toward target
      var currentAngle = meshData.pivotGroup.rotation.y;
      var diff = targetAngle - currentAngle;
      // Normalize diff to [-PI, PI]
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;

      var rotSpeed = 3.0; // rad/s
      var step = rotSpeed * dt;
      if (Math.abs(diff) < step) {
        meshData.pivotGroup.rotation.y = targetAngle;
      } else {
        meshData.pivotGroup.rotation.y += (diff > 0 ? step : -step);
      }

      // Play servo whir while rotating significantly
      if (Math.abs(diff) > 0.05) {
        sentry.servoTimer = (sentry.servoTimer || 0) - dt;
        if (sentry.servoTimer <= 0) {
          _playServoWhir();
          sentry.servoTimer = 0.2;
        }
      }

      // Check if aimed within threshold
      var angleDiff = Math.abs(diff) * (180 / Math.PI);
      if (angleDiff < _AIM_THRESHOLD && sentry.ammo > 0) {
        sentry.fireTimer = (sentry.fireTimer || 0) - dt;
        if (sentry.fireTimer <= 0) {
          sentry.isFiring = true;
          sentry.fireTimer = _FIRE_RATE;
          sentry.ammo--;

          // Deal damage
          _dealDamage(nearest, _DAMAGE);

          // Score
          if (!_isEnemyAlive(nearest)) {
            if (window.player && window.player.score !== undefined) {
              window.player.score += 25;
            }
          }

          // Tracer from barrel tip to enemy
          // Barrel tip is at pivot position + pivot rotation * (0, 0, -0.7) in world space
          var barrelTip = new THREE.Vector3(0, 0, -0.7);
          barrelTip.applyQuaternion(meshData.pivotGroup.quaternion);
          barrelTip.add(meshData.pivotGroup.getWorldPosition(new THREE.Vector3()));
          _spawnTracer(barrelTip, ePos.clone());

          _playFireClatter();
        }
      }
    }

    // Update alert light color
    if (sentry.isFiring) {
      meshData.alertLight.color.setHex(0xFF0000);
      meshData.alertLight.intensity = 4;
    } else if (sentry.isTracking) {
      meshData.alertLight.color.setHex(0x00FF00);
      meshData.alertLight.intensity = 3;
    } else {
      meshData.alertLight.color.setHex(0x00FF00);
      meshData.alertLight.intensity = 1.5;
    }

    // Update ammo LED color
    if (sentry.ammo < 10) {
      meshData.ledMat.color.setHex(0xFF0000);
      meshData.ledMat.emissive.setHex(0xFF0000);
    } else if (sentry.ammo < 30) {
      meshData.ledMat.color.setHex(0xFFAA00);
      meshData.ledMat.emissive.setHex(0xFFAA00);
    } else {
      meshData.ledMat.color.setHex(0x00FF00);
      meshData.ledMat.emissive.setHex(0x00FF00);
    }

    // Slow pulse on base light when idle
    if (!sentry.isTracking) {
      meshData.alertLight.intensity = 1.0 + 0.5 * Math.sin(Date.now() * 0.003);
    }
  }

  // ─── Key handler ─────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if ((e.key === 'u' || e.key === 'U') && (e.ctrlKey || e.metaKey)) {
      if (_ctrlUDown) return;
      _ctrlUDown = true;
      e.preventDefault();
      place();
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'u' || e.key === 'U') {
      _ctrlUDown = false;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene || window._gameScene || null;
    _camera = camera || window._camera || null;

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup', _onKeyUp, false);

    _ensureHUD();
  }

  function place() {
    if (!_scene || !_camera) {
      // Try lazy-grabbing globals
      _scene = _scene || window._gameScene || null;
      _camera = _camera || window._camera || null;
    }
    if (!_scene) return;

    if (_sentries.length >= _MAX_SENTRIES) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('Max sentries deployed (' + _MAX_SENTRIES + ')');
      }
      return;
    }

    // Place at player/camera position, slightly in front and on the ground
    var pos = new THREE.Vector3();
    if (_camera) {
      _camera.getWorldPosition(pos);
      // Step forward a bit
      var forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(_camera.quaternion);
      forward.y = 0;
      forward.normalize();
      pos.addScaledVector(forward, 2);
      pos.y = 0; // place on ground
    }

    var meshData = _buildSentryMesh();
    meshData.group.position.copy(pos);
    _scene.add(meshData.group);

    var sentry = {
      meshData: meshData,
      hp: _MAX_HP,
      ammo: _MAX_AMMO,
      fireTimer: 0,
      servoTimer: 0,
      isTracking: false,
      isFiring: false
    };

    _sentries.push(sentry);

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('Sentry deployed! [' + _MAX_AMMO + '/' + _MAX_AMMO + '] — ' + _sentries.length + '/' + _MAX_SENTRIES + ' active');
    }

    _updateHUD();
  }

  function update(dt) {
    if (!_scene) {
      _scene = window._gameScene || null;
    }
    if (!_camera) {
      _camera = window._camera || null;
    }
    if (!dt || dt <= 0) return;

    // Update all sentries
    var i = _sentries.length;
    while (i--) {
      var sentry = _sentries[i];
      _updateSentry(sentry, dt);

      // Check if out of ammo and not destroyed — just go quiet
      if (sentry.ammo <= 0 && !sentry._noAmmoToasted) {
        sentry._noAmmoToasted = true;
        if (window.HUD && window.HUD.showToast) {
          window.HUD.showToast('Sentry #' + (i + 1) + ' out of ammo!');
        }
      }

      // Check if destroyed
      if (sentry.hp <= 0) {
        _destroySentry(sentry);
        _sentries.splice(i, 1);
      }
    }

    // Update FX (tracers, explosion particles, ammo packs)
    var j = _tracers.length;
    var nextTracers = [];
    for (var k = 0; k < _tracers.length; k++) {
      var entry = _tracers[k];
      if (entry.ammoPack) {
        var alive = _updateAmmoPack(entry, dt);
        if (alive) nextTracers.push(entry);
      } else {
        nextTracers.push(entry);
      }
    }
    _tracers = nextTracers;

    // Now handle remaining FX (tracers + explosion)
    _updateFX(dt);

    _updateHUD();
  }

  function reset() {
    // Remove all sentry meshes
    for (var i = 0; i < _sentries.length; i++) {
      if (_scene) _scene.remove(_sentries[i].meshData.group);
    }
    _sentries = [];

    // Remove all FX
    for (var j = 0; j < _tracers.length; j++) {
      var entry = _tracers[j];
      if (entry.line && _scene) {
        _scene.remove(entry.line);
        entry.line.geometry.dispose();
        entry.mat.dispose();
      } else if (entry.explosion && entry.particle && !entry.particle.isLight && _scene) {
        _scene.remove(entry.particle.mesh);
      } else if (entry.ammoPack && entry.pack && _scene) {
        _scene.remove(entry.pack.mesh);
      }
    }
    _tracers = [];

    _ctrlUDown = false;
    _updateHUD();
  }

  return {
    init: init,
    update: update,
    place: place,
    reset: reset
  };

})();
