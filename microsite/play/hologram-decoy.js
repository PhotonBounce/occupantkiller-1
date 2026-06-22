// hologram-decoy.js — Holographic Player Clone feature module
// Key: Ctrl+H — deploy a holographic copy of the player to distract enemies
// 2 charges, 30s cooldown per charge
// Exposes: window.HologramDecoy
window.HologramDecoy = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────
  var MAX_CHARGES      = 2;
  var COOLDOWN_SEC     = 30;
  var ATTRACT_RADIUS   = 20;      // units — enemies within this range get rerouted
  var ATTRACT_DURATION = 8;       // seconds the decoy lures enemies
  var DECOY_DURATION   = 8;       // total lifetime (seconds)
  var FADEOUT_START    = 6;       // begin fade at this many seconds elapsed (last 2s)
  var MOVE_SPEED       = 2;       // units per second the decoy drifts forward
  var FLICKER_HZ       = 8;       // opacity flicker frequency in Hz
  var FLICKER_LO       = 0.45;    // opacity floor
  var FLICKER_HI       = 0.65;    // opacity ceiling
  var BASE_OPACITY     = 0.55;    // default decoy opacity
  var SCAN_COUNT       = 6;       // number of hologram scan lines
  var SCORE_PER_FOOL   = 100;     // score bonus per fooled enemy
  var TOAST_DURATION   = 2500;    // ms

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _charges      = MAX_CHARGES;
  var _cooldownT    = 0;          // seconds until next charge restores
  var _decoys       = [];         // active decoy objects
  var _keyBound     = false;
  var _hudEl        = null;
  var _audioCtx     = null;
  var _totalTime    = 0;          // for flicker phase

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx && _audioCtx.state !== 'closed') return _audioCtx;
    try {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
    return _audioCtx;
  }

  function _playHum(duration) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 180;
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) { /* ignore */ }
  }

  function _playGlitch() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufSize = Math.floor(ctx.sampleRate * 0.08);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4 * (1 - i / bufSize);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 2400;
      filt.Q.value = 1.5;
      var gain = ctx.createGain();
      gain.gain.value = 0.35;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  function _playDissolve() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufSize = Math.floor(ctx.sampleRate * 0.35);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5 * (1 - i / bufSize);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.value = 800;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  function _playBurstVFX(position) {
    // Blue particle burst — create small planes that fly outward then fade
    if (!_scene) return;
    var burstMat = new THREE.MeshBasicMaterial({
      color: 0x00CCFF,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    var particles = [];
    for (var p = 0; p < 12; p++) {
      var geo = new THREE.PlaneGeometry(0.1, 0.1);
      var mesh = new THREE.Mesh(geo, burstMat.clone());
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.5,
        position.y + Math.random() * 1.8,
        position.z + (Math.random() - 0.5) * 0.5
      );
      var vel = {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 3 + 1,
        z: (Math.random() - 0.5) * 4
      };
      _scene.add(mesh);
      particles.push({ mesh: mesh, vel: vel, life: 0.6 });
    }

    // Simple flash mesh
    var flashGeo = new THREE.SphereGeometry(0.5, 6, 6);
    var flashMat = new THREE.MeshBasicMaterial({
      color: 0x00CCFF,
      transparent: true,
      opacity: 0.7
    });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(position);
    flash.position.y += 0.9;
    _scene.add(flash);

    var startTime = performance.now();
    function animateBurst() {
      var elapsed = (performance.now() - startTime) / 1000;
      var done = true;
      for (var i = 0; i < particles.length; i++) {
        var pt = particles[i];
        if (!pt) continue;
        pt.life -= 0.016;
        if (pt.life > 0) {
          done = false;
          pt.mesh.position.x += pt.vel.x * 0.016;
          pt.mesh.position.y += pt.vel.y * 0.016;
          pt.mesh.position.z += pt.vel.z * 0.016;
          pt.vel.y -= 6 * 0.016;
          pt.mesh.material.opacity = Math.max(0, pt.life / 0.6 * 0.9);
        } else {
          if (pt.mesh.parent) {
            _scene.remove(pt.mesh);
            pt.mesh.geometry.dispose();
            pt.mesh.material.dispose();
          }
          particles[i] = null;
        }
      }
      // Fade flash
      if (elapsed < 0.2) {
        flash.material.opacity = 0.7 * (1 - elapsed / 0.2);
        done = false;
      } else {
        if (flash.parent) {
          _scene.remove(flash);
          flash.geometry.dispose();
          flash.material.dispose();
        }
      }
      if (!done) requestAnimationFrame(animateBurst);
    }
    requestAnimationFrame(animateBurst);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'hologram-decoy-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'left:16px',
      'color:#00CCFF',
      'font-size:13px',
      'font-family:monospace',
      'z-index:300',
      'pointer-events:none',
      'background:rgba(0,20,40,0.55)',
      'padding:4px 10px',
      'border-radius:4px',
      'border:1px solid rgba(0,204,255,0.35)',
      'text-shadow:0 0 8px #00CCFF',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    _ensureHUD();
    var show = _decoys.length > 0 || _charges < MAX_CHARGES || _cooldownT > 0;
    if (!show) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var badge = '👥 DECOY \xD7' + _charges;
    if (_cooldownT > 0) badge += ' CD:' + Math.ceil(_cooldownT) + 's';
    _hudEl.textContent = badge;
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
      return;
    }
    // Fallback inline toast
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed',
      'top:32%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00CCFF',
      'font-size:15px',
      'font-weight:bold',
      'font-family:monospace',
      'z-index:500',
      'pointer-events:none',
      'background:rgba(0,20,40,0.88)',
      'padding:6px 22px',
      'border-radius:6px',
      'border:1px solid #00CCFF',
      'text-shadow:0 0 10px #00CCFF',
      'letter-spacing:2px'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity 0.3s';
      el.style.opacity = '0';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 350);
    }, TOAST_DURATION);
  }

  // ── Build hologram humanoid mesh ──────────────────────────────────────────
  function _buildHologramMesh() {
    var group = new THREE.Group();
    var color = 0x00CCFF;
    var matOpts = {
      color: color,
      transparent: true,
      opacity: BASE_OPACITY,
      side: THREE.DoubleSide
    };

    // Body / torso
    var torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    var torsoMat = new THREE.MeshLambertMaterial(matOpts);
    var torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.0;
    group.add(torso);

    // Head
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = new THREE.MeshLambertMaterial(matOpts);
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.6;
    group.add(head);

    // Left arm
    var armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    var armMat = new THREE.MeshLambertMaterial(matOpts);
    var lArm = new THREE.Mesh(armGeo, armMat);
    lArm.position.set(-0.42, 1.0, 0);
    group.add(lArm);

    // Right arm
    var rArm = new THREE.Mesh(armGeo, armMat.clone());
    rArm.position.set(0.42, 1.0, 0);
    group.add(rArm);

    // Left leg
    var legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
    var legMat = new THREE.MeshLambertMaterial(matOpts);
    var lLeg = new THREE.Mesh(legGeo, legMat);
    lLeg.position.set(-0.18, 0.35, 0);
    group.add(lLeg);

    // Right leg
    var rLeg = new THREE.Mesh(legGeo, legMat.clone());
    rLeg.position.set(0.18, 0.35, 0);
    group.add(rLeg);

    // Scan lines — 6 horizontal PlaneGeometry strips up the body
    var scanMats = [];
    for (var s = 0; s < SCAN_COUNT; s++) {
      var scanGeo = new THREE.PlaneGeometry(0.6, 0.02);
      var scanMat = new THREE.MeshBasicMaterial({
        color: 0x00CCFF,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      var scan = new THREE.Mesh(scanGeo, scanMat);
      // Space scans from y=0.1 to y=1.85 across the body
      var scanY = 0.1 + (s / (SCAN_COUNT - 1)) * 1.75;
      scan.position.y = scanY;
      scan.rotation.x = Math.PI / 2; // face upward so they are horizontal bands
      group.add(scan);
      scanMats.push(scanMat);
    }

    // Collect all submesh materials for flicker
    var allMats = [torsoMat, headMat, armMat, legMat];
    group.traverse(function (child) {
      if (child.isMesh && allMats.indexOf(child.material) === -1 && scanMats.indexOf(child.material) === -1) {
        allMats.push(child.material);
      }
    });

    group._bodyMats = allMats;
    group._scanMats = scanMats;

    return group;
  }

  // ── Spawn a hologram decoy ─────────────────────────────────────────────────
  function _spawnDecoy(playerPos, facingDir) {
    if (!_scene) return null;

    var mesh = _buildHologramMesh();
    mesh.position.set(playerPos.x, playerPos.y, playerPos.z);

    // Face the direction the player was looking
    if (facingDir && (facingDir.x !== 0 || facingDir.z !== 0)) {
      mesh.rotation.y = Math.atan2(facingDir.x, facingDir.z);
    }
    _scene.add(mesh);

    var decoy = {
      mesh:         mesh,
      dir:          { x: facingDir ? facingDir.x : 0, z: facingDir ? facingDir.z : 0 },
      elapsed:      0,
      fooled:       [],        // enemy references that were redirected
      glitchTimer:  1.0,       // seconds until next glitch sound
      humOsc:       null,
      dead:         false,
      dissolving:   false
    };

    // Start hum for decoy lifetime
    _playHum(DECOY_DURATION);

    _decoys.push(decoy);
    return decoy;
  }

  // ── Redirect nearby enemies ────────────────────────────────────────────────
  function _attractEnemies(decoy) {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    var all = window.Enemies.getAll();
    var dpos = decoy.mesh.position;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh) continue;
      var dx = dpos.x - e.mesh.position.x;
      var dz = dpos.z - e.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= ATTRACT_RADIUS) {
        e._decoyTarget = dpos;
        e._decoyLureTimer = ATTRACT_DURATION;
        if (e._patrolState !== undefined) e._patrolState = 'combat';
        if (e._detectedPlayer !== undefined) e._detectedPlayer = true;
        e.playerSpotted = true;
        // Track for scoring — avoid duplicates
        var alreadyFooled = false;
        for (var f = 0; f < decoy.fooled.length; f++) {
          if (decoy.fooled[f] === e) { alreadyFooled = true; break; }
        }
        if (!alreadyFooled) decoy.fooled.push(e);
      }
    }
  }

  // ── Remove decoy, award score, clean up ───────────────────────────────────
  function _removeDecoy(decoy, idx, isBurst) {
    if (decoy.dead) return;
    decoy.dead = true;

    var pos = decoy.mesh.position.clone();

    if (_scene && decoy.mesh) {
      decoy.mesh.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            for (var m = 0; m < child.material.length; m++) child.material[m].dispose();
          } else {
            child.material.dispose();
          }
        }
      });
      _scene.remove(decoy.mesh);
    }

    if (idx >= 0 && idx < _decoys.length) _decoys.splice(idx, 1);

    // Score bonus for each enemy fooled
    var pts = decoy.fooled.length * SCORE_PER_FOOL;
    if (pts > 0) {
      if (window.player && window.player.score !== undefined) {
        window.player.score += pts;
      }
      _toast('ENEMIES FOOLED: ' + decoy.fooled.length + '  +' + pts);
    }

    if (isBurst) {
      _playBurstVFX(pos);
      _playDissolve();
    } else {
      _playDissolve();
    }

    // Clear enemy decoy references pointing to this decoy
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      var all = window.Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (e && e._decoyTarget === decoy.mesh.position) {
          e._decoyTarget = null;
          e._decoyLureTimer = 0;
        }
      }
    }
  }

  // ── Get player facing direction from camera ───────────────────────────────
  function _getFacingDir() {
    var cam = _camera || window._camera;
    if (!cam) return { x: 0, z: -1 };
    // Camera -Z is the "into screen" direction in Three.js
    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    return { x: dir.x, z: dir.z };
  }

  function _getPlayerPos() {
    if (window.player && window.player.position) return window.player.position;
    var cam = _camera || window._camera;
    if (cam) return cam.position;
    return null;
  }

  // ── Key binding (Ctrl+H) ──────────────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (ev) {
      if (ev.code === 'KeyH' && ev.ctrlKey && !ev.altKey && !ev.repeat) {
        ev.preventDefault();
        ev.stopPropagation();
        deploy();
      }
    }, true);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * init(scene, camera)
   * Call once after the Three.js scene is ready.
   */
  function init(scene, camera) {
    _scene   = scene  || window._gameScene;
    _camera  = camera || window._camera;
    _charges = MAX_CHARGES;
    _cooldownT = 0;
    _decoys  = [];
    _ensureHUD();
    _updateHUD();
    _bindKey();
  }

  /**
   * deploy()
   * Place a hologram decoy at the player's current position.
   * Called by Ctrl+H key handler.
   */
  function deploy() {
    if (_charges <= 0) {
      if (_cooldownT > 0) {
        _toast('HOLOGRAM COOLDOWN ' + Math.ceil(_cooldownT) + 's');
      } else {
        _toast('NO HOLOGRAM CHARGES');
      }
      return;
    }
    var pos = _getPlayerPos();
    if (!pos) {
      _toast('HOLOGRAM: NO POSITION');
      return;
    }

    var facing = _getFacingDir();
    _spawnDecoy(pos, facing);
    _charges--;
    if (_charges < MAX_CHARGES && _cooldownT <= 0) {
      _cooldownT = COOLDOWN_SEC;
    }
    _toast('👥 HOLOGRAM DEPLOYED');
    _updateHUD();
  }

  /**
   * update(delta)
   * Call every animation frame with elapsed seconds since last frame.
   */
  function update(delta) {
    _totalTime += delta;

    // Restore charges on cooldown
    if (_charges < MAX_CHARGES && _cooldownT > 0) {
      _cooldownT -= delta;
      if (_cooldownT <= 0) {
        _cooldownT = 0;
        _charges++;
        if (_charges < MAX_CHARGES) {
          // Continue cooldown for next charge
          _cooldownT = COOLDOWN_SEC;
        }
        _toast('HOLOGRAM CHARGE READY');
      }
    }

    // Flicker phase — 8Hz sawtooth
    var flickerPhase = (_totalTime * FLICKER_HZ) % 1.0;
    var flickerOp = FLICKER_LO + flickerPhase * (FLICKER_HI - FLICKER_LO);

    for (var i = _decoys.length - 1; i >= 0; i--) {
      var decoy = _decoys[i];
      if (!decoy || decoy.dead) {
        _decoys.splice(i, 1);
        continue;
      }

      decoy.elapsed += delta;

      // Determine opacity with fade-out in last 2s
      var baseOp = flickerOp;
      if (decoy.elapsed >= FADEOUT_START) {
        var fadeProgress = (decoy.elapsed - FADEOUT_START) / (DECOY_DURATION - FADEOUT_START);
        baseOp = flickerOp * (1 - Math.min(fadeProgress, 1));
      }

      // Apply flicker opacity to all body meshes
      if (decoy.mesh._bodyMats) {
        for (var m = 0; m < decoy.mesh._bodyMats.length; m++) {
          decoy.mesh._bodyMats[m].opacity = Math.max(0, baseOp);
        }
      }

      // Animate scan lines — cycle blue brightness
      if (decoy.mesh._scanMats) {
        for (var s = 0; s < decoy.mesh._scanMats.length; s++) {
          var scanPhase = (_totalTime * 2.5 + s * 0.25) % 1.0;
          var bright = 0.3 + scanPhase * 0.7;
          decoy.mesh._scanMats[s].opacity = Math.max(0, bright * baseOp * 1.2);
        }
      }

      // Slow forward movement
      var spd = MOVE_SPEED * delta;
      var len = Math.sqrt(decoy.dir.x * decoy.dir.x + decoy.dir.z * decoy.dir.z);
      if (len > 0.001) {
        decoy.mesh.position.x += (decoy.dir.x / len) * spd;
        decoy.mesh.position.z += (decoy.dir.z / len) * spd;
      }

      // Attract enemies continuously during attract window
      if (decoy.elapsed < ATTRACT_DURATION) {
        _attractEnemies(decoy);
      }

      // Glitch sound every 1s
      decoy.glitchTimer -= delta;
      if (decoy.glitchTimer <= 0) {
        _playGlitch();
        decoy.glitchTimer = 1.0;
      }

      // Expire
      if (decoy.elapsed >= DECOY_DURATION) {
        _removeDecoy(decoy, i, false);
        continue;
      }
    }

    _updateHUD();
  }

  /**
   * shootDecoy(worldPos)
   * Call from bullet/hit-detection code when a shot hits near a hologram.
   * Bullets pass through (no HP), but the decoy can be manually popped
   * by the player (player shoots it).
   * @param {object} worldPos  {x,y,z} hit position
   * @param {boolean} fromPlayer  true if shot came from the player
   */
  function shootDecoy(worldPos, fromPlayer) {
    // Find nearest decoy within 1.2 units
    var bestDist = 1.2;
    var bestIdx  = -1;
    for (var i = 0; i < _decoys.length; i++) {
      var d = _decoys[i];
      if (!d || d.dead) continue;
      var dx = d.mesh.position.x - worldPos.x;
      var dy = d.mesh.position.y - worldPos.y;
      var dz = d.mesh.position.z - worldPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
    if (bestIdx < 0) return;

    if (fromPlayer) {
      // Player shot the decoy — pop it with burst VFX
      _removeDecoy(_decoys[bestIdx], bestIdx, true);
    } else {
      // Enemy shot — log as miss, bullets pass through
      console.log('[HologramDecoy] Enemy shot passed through decoy (miss)');
    }
  }

  /**
   * reset()
   * Clear all decoys and reset state (e.g. on wave end / stage change).
   */
  function reset() {
    for (var i = _decoys.length - 1; i >= 0; i--) {
      var d = _decoys[i];
      if (d && !d.dead) _removeDecoy(d, i, false);
    }
    _decoys    = [];
    _charges   = MAX_CHARGES;
    _cooldownT = 0;
    _updateHUD();
  }

  // ── Public surface ─────────────────────────────────────────────────────────
  return {
    init:        init,
    update:      update,
    deploy:      deploy,
    reset:       reset,
    shootDecoy:  shootDecoy
  };

}());
