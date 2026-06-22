/* ============================================================
 *  DODGE-ROLL.JS — Combat dodge roll evasion system
 *
 *  API:
 *    DodgeRoll.init()      — call once after DOM ready
 *    DodgeRoll.update(dt)  — call each frame with delta-time seconds
 *    DodgeRoll.roll(dir)   — {x,z} unit vector; triggers roll if allowed
 *    DodgeRoll.reset()     — cancel active roll, reset cooldown
 *
 *  Globals set/read:
 *    window._dodgeRolling  {boolean}  — true while roll is active
 *    window._controlsLocked           — prevents roll when truthy
 *    window._onZipline               — prevents roll on zipline
 *    window.StaminaSystem            — costs 20 stamina if present
 *    window._playerMoveVelocity      — {x,z} impulse consumed by game-manager
 * ============================================================ */
window.DodgeRoll = (function () {
  'use strict';

  /* ── Config ─────────────────────────────────── */
  var CFG = {
    DOUBLE_TAP_WINDOW: 0.3,    // seconds between taps to trigger roll
    ROLL_DURATION:     0.5,    // seconds
    ROLL_SPEED:        10.0,   // units/s burst (2.5 units over 0.5s)
    ROLL_CAM_TILT:     0.52,   // ~30° in radians (rotation.z delta)
    ROLL_CAM_DROP:     0.3,    // units lower during roll
    INVINCIBILITY_START: 0.1,  // roll-time at which i-frames begin
    INVINCIBILITY_END:   0.4,  // roll-time at which i-frames end
    DAMAGE_MULT:       0.3,    // 30% damage taken during i-frames
    COOLDOWN:          2.5,    // seconds between rolls
    STAMINA_COST:      20,     // stamina points consumed
    DUST_COUNT:        5,      // number of dust particles
    DUST_LIFETIME:     0.4,    // seconds particles live
    AUDIO_FREQ:        100,    // Hz sine tone
    AUDIO_DUR:         0.15,   // seconds for audio burst
    CAM_TILT_LERP:     8.0,    // lerp speed for tilt-back
    CAM_DROP_LERP:     8.0     // lerp speed for height-back
  };

  /* ── State ──────────────────────────────────── */
  var _active       = false;
  var _rollTimer    = 0;
  var _cooldown     = 0;
  var _rollDirX     = 0;
  var _rollDirZ     = 0;
  var _camTiltCur   = 0;   // current camera z-tilt applied
  var _camDropCur   = 0;   // current camera y-drop applied
  var _dustParticles = [];

  /* ── Double-tap tracking (WASD) ─────────────── */
  var _lastTap = {
    KeyW: 0,
    KeyA: 0,
    KeyS: 0,
    KeyD: 0,
    ArrowUp: 0,
    ArrowLeft: 0,
    ArrowDown: 0,
    ArrowRight: 0
  };
  // Direction vectors per key
  var _keyDir = {
    KeyW:    { x:  0, z: -1 },
    ArrowUp: { x:  0, z: -1 },
    KeyS:    { x:  0, z:  1 },
    ArrowDown: { x: 0, z:  1 },
    KeyA:    { x: -1, z:  0 },
    ArrowLeft: { x: -1, z: 0 },
    KeyD:    { x:  1, z:  0 },
    ArrowRight:{ x: 1, z:  0 }
  };

  /* ── HUD elements ───────────────────────────── */
  var _hudRingEl = null;
  var _hudArcEl  = null;
  var _hudTextEl = null;

  /* ── Three.js scene reference ───────────────── */
  var _scene = null;

  /* ── AudioContext reference ─────────────────── */
  var _audioCtx = null;

  /* ─────────────────────────────────────────────
   *  Helpers
   * ───────────────────────────────────────────── */
  function _getCamera() {
    if (typeof CameraSystem !== 'undefined' && CameraSystem.getCamera) {
      return CameraSystem.getCamera();
    }
    // Fallback: search for THREE.PerspectiveCamera on window
    return window._camera || null;
  }

  function _getScene() {
    return window._scene || _scene;
  }

  function _getPlayer() {
    return window.player || null;
  }

  function _getYaw() {
    if (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw) {
      return CameraSystem.getYaw();
    }
    var cam = _getCamera();
    return cam ? cam.rotation.y : 0;
  }

  function _canRoll() {
    if (_active) return false;
    if (_cooldown > 0) return false;
    if (window._controlsLocked) return false;
    if (window._onZipline) return false;
    // Check swimming via Traversal
    if (typeof Traversal !== 'undefined' && Traversal.isSwimming && Traversal.isSwimming()) return false;
    var p = _getPlayer();
    if (p && p.prone) return false;
    return true;
  }

  /* ─────────────────────────────────────────────
   *  Audio: body-impact thud (100Hz sine + noise)
   * ───────────────────────────────────────────── */
  function _playRollAudio() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      var now = ctx.currentTime;

      // Sine tone at 100Hz
      var osc = ctx.createOscillator();
      var oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(CFG.AUDIO_FREQ, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + CFG.AUDIO_DUR);
      oscGain.gain.setValueAtTime(0.45, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + CFG.AUDIO_DUR);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + CFG.AUDIO_DUR);

      // Noise burst
      var bufSize = Math.floor(ctx.sampleRate * CFG.AUDIO_DUR);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      var noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buf;
      var noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 400;
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + CFG.AUDIO_DUR);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);
      noiseSource.stop(now + CFG.AUDIO_DUR);
    } catch (e) {
      // Audio not available — silent fail
    }
  }

  /* ─────────────────────────────────────────────
   *  Dust particles
   * ───────────────────────────────────────────── */
  function _spawnDust(dirX, dirZ) {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;
    var p = _getPlayer();
    if (!p) return;

    for (var i = 0; i < CFG.DUST_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 4, 4);
      var mat = new THREE.MeshBasicMaterial({
        color: 0xc8a86e,
        transparent: true,
        opacity: 0.75
      });
      var mesh = new THREE.Mesh(geo, mat);
      // Spread in roll direction with slight random offset
      var spread = 0.4;
      mesh.position.set(
        p.position.x + dirX * (0.3 + Math.random() * 0.5) + (Math.random() - 0.5) * spread,
        p.position.y - p.height + 0.15 + Math.random() * 0.1,
        p.position.z + dirZ * (0.3 + Math.random() * 0.5) + (Math.random() - 0.5) * spread
      );
      sc.add(mesh);
      _dustParticles.push({
        mesh: mesh,
        age: 0,
        vx: dirX * (0.5 + Math.random() * 0.5),
        vz: dirZ * (0.5 + Math.random() * 0.5),
        vy: 0.5 + Math.random() * 0.5
      });
    }
  }

  function _updateDust(dt) {
    for (var i = _dustParticles.length - 1; i >= 0; i--) {
      var d = _dustParticles[i];
      d.age += dt;
      var t = d.age / CFG.DUST_LIFETIME;
      if (t >= 1) {
        var sc = _getScene();
        if (sc) sc.remove(d.mesh);
        if (d.mesh.geometry) d.mesh.geometry.dispose();
        if (d.mesh.material) d.mesh.material.dispose();
        _dustParticles.splice(i, 1);
        continue;
      }
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.material.opacity = 0.75 * (1 - t);
      // Slow drift
      d.vx *= (1 - dt * 4);
      d.vz *= (1 - dt * 4);
      d.vy *= (1 - dt * 3);
    }
  }

  /* ─────────────────────────────────────────────
   *  HUD: cooldown ring (bottom-left)
   * ───────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudRingEl) return;
    var container = document.createElement('div');
    container.id = 'dodge-roll-hud';
    container.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:24px',
      'width:52px',
      'height:52px',
      'pointer-events:none',
      'z-index:900'
    ].join(';');

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '52');
    svg.setAttribute('height', '52');
    svg.style.cssText = 'display:block;';

    // Background track
    var track = document.createElementNS(ns, 'circle');
    track.setAttribute('cx', '26');
    track.setAttribute('cy', '26');
    track.setAttribute('r', '22');
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', 'rgba(255,255,255,0.12)');
    track.setAttribute('stroke-width', '4');
    svg.appendChild(track);

    // Foreground arc (progress)
    var arc = document.createElementNS(ns, 'circle');
    arc.setAttribute('cx', '26');
    arc.setAttribute('cy', '26');
    arc.setAttribute('r', '22');
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#4dddff');
    arc.setAttribute('stroke-width', '4');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('transform', 'rotate(-90 26 26)');
    arc.id = 'dodge-roll-arc';
    svg.appendChild(arc);

    // Icon letter
    var icon = document.createElementNS(ns, 'text');
    icon.setAttribute('x', '26');
    icon.setAttribute('y', '31');
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('fill', 'rgba(255,255,255,0.85)');
    icon.setAttribute('font-size', '14');
    icon.setAttribute('font-family', 'monospace');
    icon.textContent = 'R';
    svg.appendChild(icon);

    container.appendChild(svg);

    // "ROLL READY" label
    var label = document.createElement('div');
    label.id = 'dodge-roll-label';
    label.textContent = 'ROLL READY';
    label.style.cssText = [
      'position:absolute',
      'bottom:-16px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#4dddff',
      'font-size:9px',
      'font-family:monospace',
      'white-space:nowrap',
      'letter-spacing:1px',
      'text-shadow:0 0 4px #4dddff'
    ].join(';');
    container.appendChild(label);

    document.body.appendChild(container);
    _hudRingEl = container;
    _hudArcEl  = arc;
    _hudTextEl = label;
  }

  function _updateHUD() {
    if (!_hudArcEl) return;
    var r = 22;
    var circumference = 2 * Math.PI * r;

    var pct;
    if (_cooldown <= 0) {
      pct = 1;
    } else {
      pct = 1 - (_cooldown / CFG.COOLDOWN);
    }
    pct = Math.max(0, Math.min(1, pct));

    var dash = pct * circumference;
    _hudArcEl.setAttribute('stroke-dasharray', dash + ' ' + circumference);

    // Color: ready = bright cyan, cooling = grey-blue
    if (pct >= 1) {
      _hudArcEl.setAttribute('stroke', '#4dddff');
    } else if (_active) {
      _hudArcEl.setAttribute('stroke', '#ff8c00');
    } else {
      _hudArcEl.setAttribute('stroke', '#336688');
    }

    if (_hudTextEl) {
      _hudTextEl.style.display = (pct >= 1 && !_active) ? 'block' : 'none';
    }
  }

  /* ─────────────────────────────────────────────
   *  Camera tilt helpers
   * ───────────────────────────────────────────── */
  function _applyCamTilt(tiltZ, dropY) {
    var cam = _getCamera();
    if (!cam) return;
    // Remove old tilt, apply new
    cam.rotation.z += (tiltZ - _camTiltCur);
    cam.position.y  += (-dropY + _camDropCur);
    _camTiltCur = tiltZ;
    _camDropCur = dropY;
  }

  function _resetCamTilt() {
    var cam = _getCamera();
    if (cam) {
      cam.rotation.z -= _camTiltCur;
      cam.position.y  += _camDropCur;
    }
    _camTiltCur = 0;
    _camDropCur = 0;
  }

  /* ─────────────────────────────────────────────
   *  World-space roll direction from camera yaw
   * ───────────────────────────────────────────── */
  function _resolveWorldDir(localX, localZ) {
    var yaw = _getYaw();
    // forward = -sin(yaw), 0, -cos(yaw);  right = cos(yaw), 0, -sin(yaw)
    var wx = -Math.sin(yaw) * localZ + Math.cos(yaw) * localX;
    var wz = -Math.cos(yaw) * localZ - Math.sin(yaw) * localX;
    // Normalise
    var len = Math.sqrt(wx * wx + wz * wz);
    if (len > 0.001) { wx /= len; wz /= len; }
    return { x: wx, z: wz };
  }

  /* ─────────────────────────────────────────────
   *  Public: roll(dir) — {x,z} in local space
   * ───────────────────────────────────────────── */
  function roll(dir) {
    if (!_canRoll()) return false;

    // Stamina cost
    if (window.StaminaSystem && typeof StaminaSystem.useStamina === 'function') {
      StaminaSystem.useStamina(CFG.STAMINA_COST);
    }

    // Resolve world-space direction
    var wd = _resolveWorldDir(dir.x || 0, dir.z || 0);

    _rollDirX = wd.x;
    _rollDirZ = wd.z;
    _rollTimer = 0;
    _active = true;
    window._dodgeRolling = true;

    // Camera: initial tilt in roll direction
    // Tilt is proportional to right-component (x) of roll dir after yaw transform
    var tiltSign = (dir.x !== 0) ? Math.sign(dir.x) : 0;
    _applyCamTilt(tiltSign * CFG.ROLL_CAM_TILT, CFG.ROLL_CAM_DROP);

    _playRollAudio();
    _spawnDust(_rollDirX, _rollDirZ);

    return true;
  }

  /* ─────────────────────────────────────────────
   *  Key handler: double-tap WASD / Alt+direction
   * ───────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (!_keyDir[e.code]) return;
    var now = performance.now() / 1000;

    // Alt + direction shortcut
    if (e.altKey) {
      e.preventDefault();
      roll(_keyDir[e.code]);
      _lastTap[e.code] = 0; // reset so it doesn't also double-tap
      return;
    }

    // Double-tap detection
    var prev = _lastTap[e.code] || 0;
    if (now - prev <= CFG.DOUBLE_TAP_WINDOW && prev > 0) {
      roll(_keyDir[e.code]);
      _lastTap[e.code] = 0;
    } else {
      _lastTap[e.code] = now;
    }
  }

  /* ─────────────────────────────────────────────
   *  Public: init()
   * ───────────────────────────────────────────── */
  function init() {
    window.addEventListener('keydown', _onKeyDown);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _buildHUD);
    } else {
      _buildHUD();
    }
    window._dodgeRolling = false;
  }

  /* ─────────────────────────────────────────────
   *  Public: update(dt)
   * ───────────────────────────────────────────── */
  function update(dt) {
    // Cooldown countdown
    if (_cooldown > 0) {
      _cooldown = Math.max(0, _cooldown - dt);
    }

    // Dust particles
    _updateDust(dt);

    if (_active) {
      _rollTimer += dt;
      var t = _rollTimer / CFG.ROLL_DURATION;

      // i-frames window
      var rollFrac = _rollTimer;
      if (rollFrac >= CFG.INVINCIBILITY_START && rollFrac <= CFG.INVINCIBILITY_END) {
        window._dodgeRolling = true; // kept true during i-frames
        // External damage code checks _dodgeRolling and applies DAMAGE_MULT
        // Expose multiplier so shooting/damage systems can read it
        window._dodgeRollDamageMult = CFG.DAMAGE_MULT;
      } else {
        window._dodgeRollDamageMult = 1.0;
      }

      // Move player via velocity impulse
      if (window._playerMoveVelocity) {
        window._playerMoveVelocity.x += _rollDirX * CFG.ROLL_SPEED * dt;
        window._playerMoveVelocity.z += _rollDirZ * CFG.ROLL_SPEED * dt;
      } else {
        // Fallback: directly nudge player.position
        var p = _getPlayer();
        if (p) {
          p.position.x += _rollDirX * CFG.ROLL_SPEED * dt;
          p.position.z += _rollDirZ * CFG.ROLL_SPEED * dt;
        }
      }

      // Camera tilt lerp back toward 0 as roll progresses
      var tiltDecay = Math.max(0, 1 - t);
      var targetTilt = Math.sign(_rollDirX) * CFG.ROLL_CAM_TILT * tiltDecay;
      var targetDrop = CFG.ROLL_CAM_DROP * tiltDecay;
      var lerpSpeed = CFG.CAM_TILT_LERP * dt;
      var newTilt = _camTiltCur + (targetTilt - _camTiltCur) * Math.min(1, lerpSpeed);
      var newDrop = _camDropCur + (targetDrop - _camDropCur) * Math.min(1, lerpSpeed);
      _applyCamTilt(newTilt, newDrop);

      // Roll finished
      if (_rollTimer >= CFG.ROLL_DURATION) {
        _endRoll();
      }
    } else {
      // Lerp any residual tilt back to zero even when not rolling
      if (Math.abs(_camTiltCur) > 0.001 || _camDropCur > 0.001) {
        var lerpS = CFG.CAM_TILT_LERP * dt;
        var nt = _camTiltCur + (0 - _camTiltCur) * Math.min(1, lerpS);
        var nd = _camDropCur + (0 - _camDropCur) * Math.min(1, lerpS);
        _applyCamTilt(nt, nd);
        if (Math.abs(_camTiltCur) < 0.001) _camTiltCur = 0;
        if (_camDropCur < 0.001) _camDropCur = 0;
      }
    }

    _updateHUD();
  }

  /* ─────────────────────────────────────────────
   *  End roll internal
   * ───────────────────────────────────────────── */
  function _endRoll() {
    _active = false;
    window._dodgeRolling = false;
    window._dodgeRollDamageMult = 1.0;
    _rollTimer = 0;
    _cooldown = CFG.COOLDOWN;
    // Camera snap tilt to zero
    _resetCamTilt();
  }

  /* ─────────────────────────────────────────────
   *  Public: reset()
   * ───────────────────────────────────────────── */
  function reset() {
    _active = false;
    window._dodgeRolling = false;
    window._dodgeRollDamageMult = 1.0;
    _rollTimer = 0;
    _cooldown = 0;
    _resetCamTilt();

    // Clean up dust
    var sc = _getScene();
    for (var i = 0; i < _dustParticles.length; i++) {
      if (sc) sc.remove(_dustParticles[i].mesh);
      if (_dustParticles[i].mesh.geometry) _dustParticles[i].mesh.geometry.dispose();
      if (_dustParticles[i].mesh.material) _dustParticles[i].mesh.material.dispose();
    }
    _dustParticles = [];
  }

  return { init: init, update: update, roll: roll, reset: reset };
}());
