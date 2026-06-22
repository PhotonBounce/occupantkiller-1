/**
 * bullet-parry.js — Split-second deflect that sends bullets back at enemies
 *
 * API:
 *   BulletParry.init()       — call once after DOM ready
 *   BulletParry.update(dt)   — call each frame with delta-time seconds
 *   BulletParry.activate()   — manually trigger parry attempt
 *   BulletParry.reset()      — cancel state, reset cooldown
 *
 * Globals read:
 *   window._lastEnemyShotTime  — timestamp (performance.now()) of last enemy shot
 *   window._lastEnemyShooter   — enemy object that fired
 *   window._gameScene          — Three.js scene
 *   window._camera             — Three.js camera
 *   window.player              — player object { score, hp, ... }
 *
 * Globals set:
 *   window._parryActive        — true while Ctrl+D is held and window is open
 *   window._parrySuccess       — 'perfect' | 'regular' | null
 */
window.BulletParry = (function () {
  'use strict';

  /* ── Config ─────────────────────────────────── */
  var CFG = {
    ACTIVE_WINDOW:      0.35,   // seconds the parry window stays open
    COOLDOWN:           8.0,    // seconds between uses
    PERFECT_THRESHOLD:  0.1,    // within this many seconds = perfect parry
    BLADE_DISTANCE:     1.5,    // units in front of camera for blade mesh
    SCORE_PERFECT:      200,    // bonus score on perfect parry
    SCORE_REGULAR:      50,     // bonus score on regular parry
    REFLECT_DAMAGE_MULT: 2.0,   // multiplier on reflected bullet damage
    SPARK_COUNT:        6,      // number of spark particles
    SPARK_LIFETIME:     0.4,    // seconds sparks live
    TRAIL_DURATION:     0.25,   // seconds for cyan trail
    RING_OUTER:         0.7,    // outer radius of crosshair ring
    RING_INNER:         0.6     // inner radius of crosshair ring
  };

  /* ── State ──────────────────────────────────── */
  var _initialized    = false;
  var _cooldownTimer  = 0;        // seconds remaining in cooldown
  var _windowTimer    = 0;        // seconds remaining in active window
  var _ctrlDHeld      = false;    // is Ctrl+D currently held
  var _windowOpen     = false;    // parry window is open (key held + cooldown clear)
  var _parryHandled   = false;    // did we already resolve this key-hold cycle?

  /* ── Three.js objects ───────────────────────── */
  var _scene          = null;
  var _camera         = null;
  var _bladeMesh      = null;     // PlaneGeometry blade
  var _ringMesh       = null;     // RingGeometry crosshair arc
  var _trailLines     = null;     // LineSegments trail
  var _trailTimer     = 0;
  var _sparks         = [];       // { mesh, vel, life, maxLife }

  /* ── HUD elements ───────────────────────────── */
  var _hudBadge       = null;     // 🛡 PARRY badge
  var _hudCooldownSvg = null;     // SVG cooldown ring
  var _hudArcEl       = null;     // SVG arc element
  var _badgeFlashTimer = 0;

  /* ── Audio ──────────────────────────────────── */
  var _audioCtx = null;

  /* ─────────────────────────────────────────────
   *  Helpers
   * ───────────────────────────────────────────── */
  function _getScene() {
    return _scene || window._gameScene || null;
  }

  function _getCamera() {
    return _camera || window._camera || null;
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window._audioCtx = _audioCtx;
      } catch (e) { /* no audio */ }
    }
    return _audioCtx;
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  function _notifyPickup(msg, color) {
    if (window.HUD && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg, color || '#4dddff');
    } else {
      _toast(msg);
    }
  }

  function _addScore(amount) {
    if (window.player && typeof window.player.score === 'number') {
      window.player.score += amount;
      if (window.HUD && window.HUD.setScore) {
        window.HUD.setScore(window.player.score);
      }
    }
  }

  /* ─────────────────────────────────────────────
   *  Audio: metallic clang sounds
   * ───────────────────────────────────────────── */
  function _playPerfectClang() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;

      // High metallic tone
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1800, now);
      osc1.frequency.exponentialRampToValueAtTime(900, now + 0.3);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Harmonics layer
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(3600, now + 0.01);
      osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      gain2.gain.setValueAtTime(0.25, now + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.01);
      osc2.stop(now + 0.4);

      // Short noise click for impact
      var bufSize = Math.floor(ctx.sampleRate * 0.05);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      var noise = ctx.createBufferSource();
      noise.buffer = buf;
      var nFilter = ctx.createBiquadFilter();
      nFilter.type = 'highpass';
      nFilter.frequency.value = 2000;
      var nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.35, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.05);
    } catch (e) { /* audio unavailable */ }
  }

  function _playRegularClank() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;

      // Lower metallic tone
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.exponentialRampToValueAtTime(400, now + 0.2);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Dull click
      var bufSize = Math.floor(ctx.sampleRate * 0.03);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      var noise = ctx.createBufferSource();
      noise.buffer = buf;
      var nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.value = 800;
      var nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.25, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.03);
    } catch (e) { /* audio unavailable */ }
  }

  /* ─────────────────────────────────────────────
   *  Three.js: Blade mesh
   * ───────────────────────────────────────────── */
  function _createBlade() {
    var sc = _getScene();
    var cam = _getCamera();
    if (!sc || !cam || typeof THREE === 'undefined') return;
    if (_bladeMesh) return;

    var geo = new THREE.PlaneGeometry(1.5, 0.08);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });
    _bladeMesh = new THREE.Mesh(geo, mat);
    // Slight angle tilt — 15 degrees
    _bladeMesh.rotation.z = 0.26;
    _bladeMesh.renderOrder = 999;
    sc.add(_bladeMesh);
  }

  function _updateBladePosition() {
    if (!_bladeMesh) return;
    var cam = _getCamera();
    if (!cam) return;

    // Position blade in front of camera at BLADE_DISTANCE units
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion);
    _bladeMesh.position.copy(cam.position).addScaledVector(dir, CFG.BLADE_DISTANCE);
    // Slight offset down and right for a sword-carry look
    var right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(cam.quaternion);
    _bladeMesh.position.addScaledVector(right, 0.3);
    _bladeMesh.position.y -= 0.1;
    _bladeMesh.quaternion.copy(cam.quaternion);
    _bladeMesh.rotateZ(0.26);
  }

  function _removeBlade() {
    if (!_bladeMesh) return;
    var sc = _getScene();
    if (sc) sc.remove(_bladeMesh);
    if (_bladeMesh.geometry) _bladeMesh.geometry.dispose();
    if (_bladeMesh.material) _bladeMesh.material.dispose();
    _bladeMesh = null;
  }

  /* ─────────────────────────────────────────────
   *  Three.js: Crosshair ring (RingGeometry)
   * ───────────────────────────────────────────── */
  function _createRing() {
    var sc = _getScene();
    var cam = _getCamera();
    if (!sc || !cam || typeof THREE === 'undefined') return;
    if (_ringMesh) return;

    var geo = new THREE.RingGeometry(CFG.RING_INNER, CFG.RING_OUTER, 16);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    _ringMesh = new THREE.Mesh(geo, mat);
    _ringMesh.renderOrder = 998;
    sc.add(_ringMesh);
  }

  function _updateRingPosition() {
    if (!_ringMesh) return;
    var cam = _getCamera();
    if (!cam) return;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion);
    // Place ring slightly farther than blade so it frames crosshair
    _ringMesh.position.copy(cam.position).addScaledVector(dir, CFG.BLADE_DISTANCE + 0.05);
    _ringMesh.quaternion.copy(cam.quaternion);
  }

  function _removeRing() {
    if (!_ringMesh) return;
    var sc = _getScene();
    if (sc) sc.remove(_ringMesh);
    if (_ringMesh.geometry) _ringMesh.geometry.dispose();
    if (_ringMesh.material) _ringMesh.material.dispose();
    _ringMesh = null;
  }

  /* ─────────────────────────────────────────────
   *  Three.js: Spark particles
   * ───────────────────────────────────────────── */
  function _spawnSparks(contactPos) {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;

    var pos = contactPos || (_bladeMesh ? _bladeMesh.position.clone() : new THREE.Vector3());

    for (var i = 0; i < CFG.SPARK_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.05, 4, 4);
      var mat = new THREE.MeshBasicMaterial({
        color: 0x44aaff,
        transparent: true,
        opacity: 1.0
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      var angle = (i / CFG.SPARK_COUNT) * Math.PI * 2;
      var speed = 2.5 + Math.random() * 2.5;
      var vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        (Math.random() - 0.3) * speed,
        Math.sin(angle) * speed
      );

      sc.add(mesh);
      _sparks.push({
        mesh: mesh,
        vel: vel,
        life: CFG.SPARK_LIFETIME,
        maxLife: CFG.SPARK_LIFETIME
      });
    }
  }

  function _updateSparks(dt) {
    var sc = _getScene();
    for (var i = _sparks.length - 1; i >= 0; i--) {
      var s = _sparks[i];
      s.life -= dt;
      if (s.life <= 0) {
        if (sc) sc.remove(s.mesh);
        if (s.mesh.geometry) s.mesh.geometry.dispose();
        if (s.mesh.material) s.mesh.material.dispose();
        _sparks.splice(i, 1);
        continue;
      }
      s.mesh.position.addScaledVector(s.vel, dt);
      s.vel.y -= 4 * dt; // gravity
      s.mesh.material.opacity = (s.life / s.maxLife);
    }
  }

  function _clearSparks() {
    var sc = _getScene();
    for (var i = 0; i < _sparks.length; i++) {
      if (sc) sc.remove(_sparks[i].mesh);
      if (_sparks[i].mesh.geometry) _sparks[i].mesh.geometry.dispose();
      if (_sparks[i].mesh.material) _sparks[i].mesh.material.dispose();
    }
    _sparks = [];
  }

  /* ─────────────────────────────────────────────
   *  Three.js: Cyan trail (fading LineSegments)
   * ───────────────────────────────────────────── */
  function _createTrail() {
    var sc = _getScene();
    var cam = _getCamera();
    if (!sc || !cam || typeof THREE === 'undefined') return;
    if (_trailLines) _removeTrail();

    // Build a horizontal fan of lines to suggest a sweep
    var positions = [];
    var segments = 8;
    var halfLen = 1.0;
    for (var i = 0; i < segments; i++) {
      var t = i / (segments - 1);
      var x = (t - 0.5) * halfLen * 2;
      var y = Math.sin(t * Math.PI) * 0.3;
      positions.push(x, y, 0);
      positions.push(x, y - 0.05, -0.08);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({
      color: 0x00eeff,
      transparent: true,
      opacity: 0.85
    });
    _trailLines = new THREE.LineSegments(geo, mat);
    _trailLines.renderOrder = 997;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(cam.quaternion);
    _trailLines.position.copy(cam.position).addScaledVector(dir, CFG.BLADE_DISTANCE);
    _trailLines.quaternion.copy(cam.quaternion);
    _trailLines.rotateZ(0.26);

    sc.add(_trailLines);
    _trailTimer = CFG.TRAIL_DURATION;
  }

  function _removeTrail() {
    if (!_trailLines) return;
    var sc = _getScene();
    if (sc) sc.remove(_trailLines);
    if (_trailLines.geometry) _trailLines.geometry.dispose();
    if (_trailLines.material) _trailLines.material.dispose();
    _trailLines = null;
    _trailTimer = 0;
  }

  /* ─────────────────────────────────────────────
   *  HUD: badge and cooldown ring
   * ───────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudBadge) return;

    // --- Shield badge ---
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'bullet-parry-badge';
    _hudBadge.textContent = '🛡 PARRY';
    _hudBadge.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%, -80px)',
      'color:#4dddff',
      'font-size:13px',
      'font-family:monospace',
      'font-weight:bold',
      'letter-spacing:2px',
      'text-shadow:0 0 6px #4dddff',
      'pointer-events:none',
      'z-index:9999',
      'opacity:0',
      'transition:opacity 0.2s ease'
    ].join(';');
    document.body.appendChild(_hudBadge);

    // --- Cooldown ring (bottom-center) ---
    var container = document.createElement('div');
    container.id = 'bullet-parry-hud';
    container.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:44px',
      'height:44px',
      'pointer-events:none',
      'z-index:900'
    ].join(';');

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '44');
    svg.setAttribute('height', '44');
    svg.style.cssText = 'display:block;';

    // Background track
    var track = document.createElementNS(ns, 'circle');
    track.setAttribute('cx', '22');
    track.setAttribute('cy', '22');
    track.setAttribute('r', '18');
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', 'rgba(255,255,255,0.10)');
    track.setAttribute('stroke-width', '3');
    svg.appendChild(track);

    // Foreground arc
    var arc = document.createElementNS(ns, 'circle');
    arc.setAttribute('cx', '22');
    arc.setAttribute('cy', '22');
    arc.setAttribute('r', '18');
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#4dddff');
    arc.setAttribute('stroke-width', '3');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('transform', 'rotate(-90 22 22)');
    arc.id = 'bullet-parry-arc';
    svg.appendChild(arc);

    // Icon
    var icon = document.createElementNS(ns, 'text');
    icon.setAttribute('x', '22');
    icon.setAttribute('y', '27');
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('fill', 'rgba(255,255,255,0.8)');
    icon.setAttribute('font-size', '12');
    icon.setAttribute('font-family', 'monospace');
    icon.textContent = 'D';
    svg.appendChild(icon);

    container.appendChild(svg);

    // Label
    var label = document.createElement('div');
    label.textContent = 'PARRY';
    label.style.cssText = [
      'position:absolute',
      'bottom:-14px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#4dddff',
      'font-size:8px',
      'font-family:monospace',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    container.appendChild(label);

    document.body.appendChild(container);
    _hudCooldownSvg = container;
    _hudArcEl = arc;
  }

  function _updateHUD() {
    if (!_hudArcEl) return;

    var r = 18;
    var circumference = 2 * Math.PI * r;
    var pct;

    if (_cooldownTimer <= 0) {
      pct = 1;
    } else {
      pct = 1 - (_cooldownTimer / CFG.COOLDOWN);
    }
    pct = Math.max(0, Math.min(1, pct));

    var dash = pct * circumference;
    _hudArcEl.setAttribute('stroke-dasharray', dash + ' ' + circumference);

    if (_windowOpen) {
      _hudArcEl.setAttribute('stroke', '#ffffff');
    } else if (pct >= 1) {
      _hudArcEl.setAttribute('stroke', '#4dddff');
    } else {
      _hudArcEl.setAttribute('stroke', '#336688');
    }

    // Badge flash
    if (_hudBadge) {
      if (_badgeFlashTimer > 0) {
        _hudBadge.style.opacity = '1';
        _hudBadge.style.textShadow = '0 0 14px #ffffff, 0 0 6px #4dddff';
        _hudBadge.style.color = '#ffffff';
      } else if (_windowOpen) {
        _hudBadge.style.opacity = '0.7';
        _hudBadge.style.textShadow = '0 0 6px #4dddff';
        _hudBadge.style.color = '#4dddff';
      } else {
        _hudBadge.style.opacity = '0';
      }
    }
  }

  /* ─────────────────────────────────────────────
   *  Parry resolution
   * ───────────────────────────────────────────── */
  function _resolveParry() {
    if (_parryHandled) return;
    _parryHandled = true;

    var now = performance.now();
    var lastShot = window._lastEnemyShotTime || 0;
    var shooter  = window._lastEnemyShooter  || null;
    var elapsed  = (now - lastShot) / 1000; // convert ms to seconds

    // Check if within parry window
    if (lastShot <= 0 || elapsed > CFG.ACTIVE_WINDOW) {
      // No recent shot or too late — miss, normal damage proceeds
      window._parrySuccess = null;
      _closeWindow();
      return;
    }

    var isPerfect = (elapsed <= CFG.PERFECT_THRESHOLD);

    if (isPerfect) {
      window._parrySuccess = 'perfect';
      _addScore(CFG.SCORE_PERFECT);
      _notifyPickup('PERFECT PARRY! +' + CFG.SCORE_PERFECT, '#ffffff');

      // Reflect bullet at shooter — deal 2x damage
      if (shooter && shooter.alive && typeof shooter.hp === 'number') {
        var reflectDmg = Math.round((shooter.lastBulletDamage || 15) * CFG.REFLECT_DAMAGE_MULT);
        shooter.hp = Math.max(0, shooter.hp - reflectDmg);
        if (shooter.hp <= 0) {
          shooter.alive = false;
          // Let the enemies system pick this up naturally via hp check
        }
      }

      _playPerfectClang();
    } else {
      // Regular parry — block only
      window._parrySuccess = 'regular';
      _addScore(CFG.SCORE_REGULAR);
      _notifyPickup('PARRIED! +' + CFG.SCORE_REGULAR, '#4dddff');
      _playRegularClank();
    }

    // Flash badge
    _badgeFlashTimer = 0.8;

    // Neutralize incoming damage this frame: set parryActive so game-manager skips hit
    window._parryActive = true;

    // VFX
    _spawnSparks(_bladeMesh ? _bladeMesh.position.clone() : null);
    _createTrail();

    // Animate blade bright flash
    if (_bladeMesh && _bladeMesh.material) {
      _bladeMesh.material.color.setHex(0xffffff);
      _bladeMesh.material.opacity = 1.0;
    }

    // Start cooldown
    _closeWindow();
    _cooldownTimer = CFG.COOLDOWN;
  }

  function _openWindow() {
    if (_cooldownTimer > 0) return; // still cooling down
    _windowOpen = true;
    _windowTimer = CFG.ACTIVE_WINDOW;
    window._parryActive = true;
    window._parrySuccess = null;

    _createBlade();
    _createRing();
  }

  function _closeWindow() {
    _windowOpen = false;
    _windowTimer = 0;
    window._parryActive = false;
    _removeBlade();
    _removeRing();
  }

  /* ─────────────────────────────────────────────
   *  Key handlers
   * ───────────────────────────────────────────── */
  function _onKeyDown(e) {
    // Ctrl+D
    if (e.code === 'KeyD' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); // prevent browser default (bookmark dialog, etc.)
      if (!_ctrlDHeld) {
        _ctrlDHeld = true;
        _parryHandled = false;
        activate();
      }
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyD' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
      if (_ctrlDHeld) {
        _ctrlDHeld = false;
        // On key-up, try to resolve if window is still open
        if (_windowOpen && !_parryHandled) {
          _resolveParry();
        }
        if (_windowOpen) {
          _closeWindow();
        }
        // Clear parry active after a brief grace period
        window._parryActive = false;
      }
    }
  }

  /* ─────────────────────────────────────────────
   *  Public: activate()
   * ───────────────────────────────────────────── */
  function activate() {
    if (_cooldownTimer > 0) {
      // Cooldown not done
      return;
    }
    _openWindow();

    // Immediately try to resolve — if shot happened just now, it's a perfect parry
    // We schedule resolution so the key-up can also trigger it
    // On activate, check right away for perfect timing
    var now = performance.now();
    var lastShot = window._lastEnemyShotTime || 0;
    var elapsed = (now - lastShot) / 1000;

    if (lastShot > 0 && elapsed <= CFG.ACTIVE_WINDOW) {
      _resolveParry();
    }
    // Otherwise window stays open until key-up or timer expires
  }

  /* ─────────────────────────────────────────────
   *  Public: init()
   * ───────────────────────────────────────────── */
  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;

    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    // Init globals
    window._parryActive  = false;
    window._parrySuccess = null;

    // Build HUD
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _buildHUD);
    } else {
      _buildHUD();
    }

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  /* ─────────────────────────────────────────────
   *  Public: update(dt)
   * ───────────────────────────────────────────── */
  function update(dt) {
    // Lazy scene/camera resolution
    if (!_scene)  _scene  = window._gameScene || null;
    if (!_camera) _camera = window._camera    || null;

    var realDt = dt || 0.016;

    // --- Cooldown tick ---
    if (_cooldownTimer > 0) {
      _cooldownTimer = Math.max(0, _cooldownTimer - realDt);
    }

    // --- Badge flash tick ---
    if (_badgeFlashTimer > 0) {
      _badgeFlashTimer = Math.max(0, _badgeFlashTimer - realDt);
    }

    // --- Window timer ---
    if (_windowOpen) {
      _windowTimer -= realDt;

      // Update blade and ring positions to follow camera
      _updateBladePosition();
      _updateRingPosition();

      // Pulse blade opacity
      if (_bladeMesh && _bladeMesh.material) {
        var pulse = 0.7 + 0.25 * Math.sin(performance.now() * 0.01);
        _bladeMesh.material.opacity = pulse;
        // Restore blue color if it was set to white on parry
        if (_bladeMesh.material.color.getHex() === 0xffffff && !_parryHandled) {
          _bladeMesh.material.color.setHex(0xaaddff);
        }
      }

      // Window expired without resolution
      if (_windowTimer <= 0) {
        if (!_parryHandled) {
          window._parrySuccess = null;
          window._parryActive  = false;
        }
        _closeWindow();
      }
    }

    // --- Trail fade ---
    if (_trailLines) {
      _trailTimer -= realDt;
      if (_trailTimer <= 0) {
        _removeTrail();
      } else {
        _trailLines.material.opacity = (_trailTimer / CFG.TRAIL_DURATION) * 0.85;
        // Keep trail attached to blade position while fading
        if (_bladeMesh) {
          _trailLines.position.copy(_bladeMesh.position);
          _trailLines.quaternion.copy(_bladeMesh.quaternion);
        }
      }
    }

    // --- Spark particles ---
    _updateSparks(realDt);

    // --- HUD update ---
    _updateHUD();

    // --- Clear parry success flag after one frame ---
    // (game-manager checks it, then we clear it next update)
    if (window._parrySuccess && !_windowOpen) {
      // Keep for ~2 frames then clear so damage suppression doesn't linger
      if (!_parryHandled) {
        window._parrySuccess = null;
      }
    }
  }

  /* ─────────────────────────────────────────────
   *  Public: reset()
   * ───────────────────────────────────────────── */
  function reset() {
    _ctrlDHeld     = false;
    _parryHandled  = false;
    _cooldownTimer = 0;
    _windowTimer   = 0;

    if (_windowOpen) {
      _closeWindow();
    }

    window._parryActive  = false;
    window._parrySuccess = null;

    _removeBlade();
    _removeRing();
    _removeTrail();
    _clearSparks();
    _badgeFlashTimer = 0;

    _updateHUD();
  }

  /* ─────────────────────────────────────────────
   *  Public API
   * ───────────────────────────────────────────── */
  return {
    init:     init,
    update:   update,
    activate: activate,
    reset:    reset
  };

})();
