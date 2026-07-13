/* killcam-system.js — slow-motion orbital killcam for boss and special kills
 * IIFE pattern, all var. Exposes window.KillcamSystem = { init, onKill, update, reset }
 */
window.KillcamSystem = (function () {
  'use strict';

  // ── Private state ────────────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;   // reference to the game's active camera

  var _active         = false;
  var _elapsed        = 0;
  var _duration       = 3.5;   // default; boss kills get 5s
  var _killType       = '';

  var _targetPos      = null;  // THREE.Vector3 — dead enemy position
  var _savedCamPos    = null;  // THREE.Vector3 — saved camera position
  var _savedCamQuat   = null;  // THREE.Quaternion — saved camera rotation

  var _killcamAngle   = 0;     // current orbit angle (0 → Math.PI)
  var _orbitRadius    = 3;
  var _orbitY         = 1.5;

  var _lastKillcamEnd = -999;  // timestamp of last killcam end (seconds)
  var _COOLDOWN       = 5;     // seconds between killcams

  // blood splatter particles
  var _bloodParticles = [];

  // DOM elements
  var _letterboxTop    = null;
  var _letterboxBot    = null;
  var _killLabel       = null;

  // audio
  var _audioCtx        = null;
  var _droneOsc        = null;
  var _droneGain       = null;

  // vignette
  var _vignetteEl      = null;

  // skip handlers
  var _spaceHandler    = null;
  var _clickHandler    = null;

  // ── Helpers ──────────────────────────────────────────────────────

  function _now() {
    return (typeof performance !== 'undefined') ? performance.now() / 1000 : Date.now() / 1000;
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ── DOM helpers ───────────────────────────────────────────────────

  function _ensureDOM() {
    // Letterbox — top bar
    if (!document.getElementById('_kcLetterboxTop')) {
      var topBar = document.createElement('div');
      topBar.id = '_kcLetterboxTop';
      topBar.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0',
        'height:0px',
        'background:#000',
        'pointer-events:none',
        'z-index:2000',
        'transition:height 0.3s ease-in'
      ].join(';');
      document.body.appendChild(topBar);
    }
    _letterboxTop = document.getElementById('_kcLetterboxTop');

    // Letterbox — bottom bar
    if (!document.getElementById('_kcLetterboxBot')) {
      var botBar = document.createElement('div');
      botBar.id = '_kcLetterboxBot';
      botBar.style.cssText = [
        'position:fixed',
        'bottom:0', 'left:0', 'right:0',
        'height:0px',
        'background:#000',
        'pointer-events:none',
        'z-index:2000',
        'transition:height 0.3s ease-in'
      ].join(';');
      document.body.appendChild(botBar);
    }
    _letterboxBot = document.getElementById('_kcLetterboxBot');

    // Kill label
    if (!document.getElementById('_kcKillLabel')) {
      var lbl = document.createElement('div');
      lbl.id = '_kcKillLabel';
      lbl.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'font-family:\'Arial Black\',Arial,sans-serif',
        'font-size:36px',
        'font-weight:900',
        'color:#fff',
        'letter-spacing:6px',
        'text-transform:uppercase',
        'text-shadow:0 0 20px rgba(255,80,0,0.9),0 2px 6px rgba(0,0,0,0.9)',
        'pointer-events:none',
        'z-index:2001',
        'opacity:0',
        'transition:opacity 0.4s ease'
      ].join(';');
      document.body.appendChild(lbl);
    }
    _killLabel = document.getElementById('_kcKillLabel');

    // Vignette
    if (!document.getElementById('_kcVignette')) {
      var vig = document.createElement('div');
      vig.id = '_kcVignette';
      vig.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.7) 100%)',
        'pointer-events:none',
        'z-index:1999',
        'opacity:0',
        'transition:opacity 0.3s ease'
      ].join(';');
      document.body.appendChild(vig);
    }
    _vignetteEl = document.getElementById('_kcVignette');
  }

  function _showLetterbox() {
    if (_letterboxTop) _letterboxTop.style.height = '80px';
    if (_letterboxBot) _letterboxBot.style.height = '80px';
  }

  function _hideLetterbox() {
    if (_letterboxTop) { _letterboxTop.style.transition = 'height 0.3s ease-out'; _letterboxTop.style.height = '0px'; }
    if (_letterboxBot) { _letterboxBot.style.transition = 'height 0.3s ease-out'; _letterboxBot.style.height = '0px'; }
  }

  function _showVignette() {
    if (_vignetteEl) _vignetteEl.style.opacity = '1';
  }

  function _hideVignette() {
    if (_vignetteEl) _vignetteEl.style.opacity = '0';
  }

  function _showKillLabel(text) {
    if (!_killLabel) return;
    _killLabel.textContent = text;
    _killLabel.style.opacity = '1';
  }

  function _hideKillLabel() {
    if (_killLabel) _killLabel.style.opacity = '0';
  }

  function _killLabelText(killType) {
    var labels = {
      'boss':      'BOSS ELIMINATED',
      'headshot':  'HEADSHOT KILL',
      'knife':     'STEALTH KILL',
      'last':      'WAVE CLEARED',
      'default':   'KILL CONFIRMED'
    };
    return labels[killType] || labels['default'];
  }

  // ── Audio helpers ─────────────────────────────────────────────────

  function _startDroneAudio() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
      }
      _droneOsc  = _audioCtx.createOscillator();
      _droneGain = _audioCtx.createGain();

      _droneOsc.type = 'sine';
      _droneOsc.frequency.setValueAtTime(40, _audioCtx.currentTime);

      _droneGain.gain.setValueAtTime(0, _audioCtx.currentTime);
      _droneGain.gain.linearRampToValueAtTime(0.18, _audioCtx.currentTime + 0.6);

      _droneOsc.connect(_droneGain);
      _droneGain.connect(_audioCtx.destination);
      _droneOsc.start();
    } catch (e) {
      // audio unavailable — silently skip
    }
  }

  function _stopDroneAudio() {
    try {
      if (_droneGain && _audioCtx) {
        _droneGain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.3);
      }
      if (_droneOsc) {
        var osc = _droneOsc;
        _droneOsc = null;
        setTimeout(function () { try { osc.stop(); } catch (e) {} }, 400);
      }
    } catch (e) {}
  }

  // ── Blood splatter ────────────────────────────────────────────────

  function _spawnBloodSplatter(pos) {
    if (!_scene || typeof THREE === 'undefined') return;

    var geo = new THREE.SphereGeometry(0.1, 4, 4);

    for (var i = 0; i < 5; i++) {
      var mat = new THREE.MeshBasicMaterial({ color: 0xcc0011, transparent: true, opacity: 0.9 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y + 0.5, pos.z);

      // Random outward velocity
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 4;
      var vy    = 1.5 + Math.random() * 3;
      var vx    = Math.cos(angle) * speed;
      var vz    = Math.sin(angle) * speed;

      _scene.add(mesh);
      _bloodParticles.push({
        mesh: mesh,
        vx: vx, vy: vy, vz: vz,
        life: 0, maxLife: 1.2 + Math.random() * 0.6
      });
    }
  }

  function _updateBloodParticles(dt) {
    var GRAVITY = -9.8;
    for (var i = _bloodParticles.length - 1; i >= 0; i--) {
      var p = _bloodParticles[i];
      p.life += dt;
      var t = p.life / p.maxLife;
      p.vy += GRAVITY * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.material.opacity = _clamp(1 - t, 0, 1) * 0.9;
      if (p.life >= p.maxLife) {
        if (_scene) _scene.remove(p.mesh);
        _bloodParticles.splice(i, 1);
      }
    }
  }

  function _clearBloodParticles() {
    for (var i = 0; i < _bloodParticles.length; i++) {
      if (_scene) _scene.remove(_bloodParticles[i].mesh);
    }
    _bloodParticles = [];
  }

  // ── Skip logic ────────────────────────────────────────────────────

  function _attachSkipHandlers() {
    _detachSkipHandlers();

    _spaceHandler = function (e) {
      if (e.code === 'Space' && _active) { e.preventDefault(); _endKillcam(); }
    };
    _clickHandler = function () {
      if (_active) { _endKillcam(); }
    };

    document.addEventListener('keydown', _spaceHandler);
    document.addEventListener('click',   _clickHandler);
  }

  function _detachSkipHandlers() {
    if (_spaceHandler) { document.removeEventListener('keydown', _spaceHandler); _spaceHandler = null; }
    if (_clickHandler) { document.removeEventListener('click',   _clickHandler); _clickHandler = null; }
  }

  // ── Main flow ─────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _ensureDOM();
  }

  function onKill(enemy, killType) {
    // Cooldown check
    var now = _now();
    if (now - _lastKillcamEnd < _COOLDOWN) return;

    // Only trigger for qualifying kills
    var qualifies = (
      killType === 'boss' ||
      killType === 'headshot' ||
      killType === 'knife' ||
      killType === 'last'
    );
    if (!qualifies) return;

    // Can't start another if active
    if (_active) return;

    // Determine killcam position (enemy position)
    var pos;
    if (enemy && enemy.position) {
      pos = enemy.position.clone ? enemy.position.clone() : new THREE.Vector3(enemy.position.x, enemy.position.y, enemy.position.z);
    } else if (enemy && enemy.mesh && enemy.mesh.position) {
      pos = enemy.mesh.position.clone ? enemy.mesh.position.clone() : new THREE.Vector3(enemy.mesh.position.x, enemy.mesh.position.y, enemy.mesh.position.z);
    } else {
      // Fallback: in front of camera
      if (!_camera) return;
      var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
      pos = _camera.position.clone().add(fwd.multiplyScalar(5));
    }

    _startKillcam(pos, killType);
  }

  function _startKillcam(pos, killType) {
    if (!_scene || !_camera) return;

    _active     = true;
    _elapsed    = 0;
    _killType   = killType;
    _duration   = (killType === 'boss') ? 5.0 : 3.5;
    _killcamAngle = 0;
    _targetPos  = pos;

    // Save camera state
    _savedCamPos  = _camera.position.clone();
    _savedCamQuat = _camera.quaternion.clone();

    // Global flags
    window._killcamActive  = true;
    window._bulletTimeScale = 0.1;

    // DOM
    _ensureDOM();
    _showLetterbox();
    _showVignette();
    _hideKillLabel();

    // Blood splatter
    _spawnBloodSplatter(pos);

    // Audio
    _startDroneAudio();

    // Skip handlers
    _attachSkipHandlers();
  }

  function _endKillcam() {
    if (!_active) return;
    _active = false;
    _lastKillcamEnd = _now();

    // Restore time
    window._bulletTimeScale = 1.0;
    window._killcamActive   = false;

    // Hide DOM
    _hideLetterbox();
    _hideVignette();
    _hideKillLabel();

    // Stop audio
    _stopDroneAudio();

    // Restore camera
    if (_camera && _savedCamPos && _savedCamQuat) {
      _camera.position.copy(_savedCamPos);
      _camera.quaternion.copy(_savedCamQuat);
    }

    // Clean up particles
    _clearBloodParticles();

    // Remove skip handlers
    _detachSkipHandlers();
  }

  function update(dt) {
    // Always update blood particles even outside killcam
    _updateBloodParticles(dt);

    if (!_active) return;

    _elapsed += dt;

    // ── Phase: label fade-in at 0.5s ─────────────────────────────
    if (_elapsed >= 0.5 && _killLabel && _killLabel.style.opacity === '0') {
      _showKillLabel(_killLabelText(_killType));
    }

    // ── Phase: label fade-out 2s after appearing (at 2.5s) ───────
    if (_elapsed >= 2.5 && _killLabel && _killLabel.style.opacity !== '0') {
      _hideKillLabel();
    }

    // ── Camera orbit ──────────────────────────────────────────────
    // Lerp angle from 0 to PI over 3s (or _duration - 0.5 for boss)
    var orbitDuration = (_killType === 'boss') ? _duration - 0.5 : 3.0;
    var orbitT = _clamp(_elapsed / orbitDuration, 0, 1);
    _killcamAngle = _lerp(0, Math.PI, orbitT);

    // Boss: add extra spin (continues from PI to 3*PI)
    var angle = _killcamAngle;
    if (_killType === 'boss' && orbitT >= 1.0) {
      var spinT = _clamp((_elapsed - orbitDuration) / (_duration - orbitDuration), 0, 1);
      angle = Math.PI + _lerp(0, Math.PI * 2, spinT);
    }

    // Position camera on orbit circle
    if (_camera && _targetPos) {
      var camX = _targetPos.x + Math.cos(angle) * _orbitRadius;
      var camY = _targetPos.y + _orbitY;
      var camZ = _targetPos.z + Math.sin(angle) * _orbitRadius;
      _camera.position.set(camX, camY, camZ);
      _camera.lookAt(_targetPos.x, _targetPos.y, _targetPos.z);
    }

    // ── End condition ─────────────────────────────────────────────
    if (_elapsed >= _duration) {
      _endKillcam();
    }
  }

  function reset() {
    _endKillcam();
    _clearBloodParticles();
    _savedCamPos  = null;
    _savedCamQuat = null;
    _targetPos    = null;
    _elapsed      = 0;
    _killcamAngle = 0;
  }

  // ── Public API ────────────────────────────────────────────────────
  return {
    init:   init,
    onKill: onKill,
    update: update,
    reset:  reset
  };

}());
