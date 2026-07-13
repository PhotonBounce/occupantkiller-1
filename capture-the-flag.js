// capture-the-flag.js — CTF side mission module
// Triggers on every 3rd wave. Enemy flag spawns 20-35 units away.
// Capture and return to base for +3000 score. Drop on damage (30%).
// 90-second timeout. Optional blue flag home defense for +100/stopped enemy.
// IIFE pattern, var throughout — no let/const.
window.CaptureTheFlag = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var CAPTURE_RADIUS    = 1.5;   // units — player must be within this to pick up flag
  var BASE_RADIUS       = 2.0;   // units — home base circle radius
  var TIMEOUT_SECONDS   = 90;    // mission time limit
  var SCORE_CAPTURE     = 3000;  // score for returning flag
  var SCORE_DEFEND      = 100;   // score for each enemy stopped at home flag
  var DROP_CHANCE       = 0.30;  // 30% chance to drop flag on damage
  var SPEED_PENALTY     = 0.20;  // 20% speed reduction while carrying
  var FLAG_SPAWN_MIN    = 20;    // min distance from player for enemy flag
  var FLAG_SPAWN_MAX    = 35;    // max distance from player for enemy flag
  var GUARD_RADIUS      = 3;     // radius around flag for enemy guard spawns
  var GUARD_COUNT       = 3;     // number of guards to spawn
  var DEFEND_ENEMY_INTERVAL = 18; // seconds between defend enemies spawning
  var DEFEND_ENEMY_RADIUS   = 8;  // spawn radius around home base for defenders

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;

  var _phase = 'idle'; // 'idle' | 'active' | 'carrying' | 'done'

  var _missionTimer   = 0;
  var _flagGroup      = null;  // THREE.Group — enemy flag pole in scene
  var _flagMesh       = null;  // the waving plane mesh
  var _flagPos        = null;  // THREE.Vector3 — world position of enemy flag
  var _baseRing       = null;  // THREE.Mesh — green home base ring
  var _homeBlueFlag   = null;  // THREE.Group — optional blue home flag
  var _carryOffset    = null;  // THREE.Vector3 — offset for carried flag visual
  var _carryFlagGroup = null;  // carried flag group (follows camera)
  var _animTime       = 0;     // cumulative time for flag wave animation
  var _defendTimer    = 0;     // timer for defending enemy spawns

  // HUD element IDs
  var HUD_BADGE_ID   = 'ctf-mission-badge';
  var HUD_TIMER_ID   = 'ctf-countdown-timer';

  // Expose carrying state globally for speed system integration
  window._carryingFlag = false;

  // ── AudioContext helpers ───────────────────────────────────────────────────
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        window._audioCtx = new Ctx();
        return window._audioCtx;
      }
    } catch (e) {}
    return null;
  }

  // Fanfare: rapid ascending notes on capture
  function _playFanfare() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var notes = [523, 659, 784, 880, 1047, 1319];
      for (var n = 0; n < notes.length; n++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delay + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.19);
        }(notes[n], n * 0.09));
      }
    } catch (e) {}
  }

  // Alarm sound: descending two-tone when flag is dropped
  function _playAlarm() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var pairs = [[880, 660], [880, 660]];
      for (var p = 0; p < pairs.length; p++) {
        (function (hiFreq, loFreq, baseDelay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(hiFreq, ctx.currentTime + baseDelay);
          osc.frequency.linearRampToValueAtTime(loFreq, ctx.currentTime + baseDelay + 0.18);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + baseDelay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + baseDelay + 0.22);
          osc.start(ctx.currentTime + baseDelay);
          osc.stop(ctx.currentTime + baseDelay + 0.23);
        }(pairs[p][0], pairs[p][1], p * 0.28));
      }
    } catch (e) {}
  }

  // Short beep for win sound (called after fanfare)
  function _playWinChime() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 1760;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.55);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      osc.start(ctx.currentTime + 0.55);
      osc.stop(ctx.currentTime + 1.1);
    } catch (e) {}
  }

  // ── Score / Toast helpers ──────────────────────────────────────────────────
  function _addScore(pts) {
    if (window.player && window.player.score !== undefined) {
      window.player.score += pts;
    }
  }

  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById(HUD_BADGE_ID)) return;

    var wrap = document.createElement('div');
    wrap.id = 'ctf-hud-wrap';
    wrap.style.cssText = [
      'position:fixed',
      'top:56px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'gap:4px',
      'z-index:3100',
      'pointer-events:none',
      'user-select:none',
    ].join(';');

    var badge = document.createElement('div');
    badge.id = HUD_BADGE_ID;
    badge.textContent = '🚩 FLAG MISSION';
    badge.style.cssText = [
      'background:rgba(200,0,0,0.75)',
      'border:2px solid #ff4444',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:3px 14px',
      'border-radius:5px',
      'letter-spacing:2px',
      'text-shadow:0 0 6px #ff0000',
    ].join(';');

    var timer = document.createElement('div');
    timer.id = HUD_TIMER_ID;
    timer.textContent = '1:30';
    timer.style.cssText = [
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'color:#ffdd00',
      'text-shadow:0 0 8px #ff8800,0 0 2px #000',
      'letter-spacing:3px',
    ].join(';');

    wrap.appendChild(badge);
    wrap.appendChild(timer);
    document.body.appendChild(wrap);
  }

  function _showMissionHUD(visible) {
    var el = document.getElementById('ctf-hud-wrap');
    if (el) el.style.display = visible ? 'flex' : 'none';
  }

  function _updateTimerHUD(secs) {
    var el = document.getElementById(HUD_TIMER_ID);
    if (!el) return;
    var s = Math.max(0, Math.ceil(secs));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    el.textContent = m + ':' + (sec < 10 ? '0' : '') + sec;
    el.style.color = secs < 15 ? (Math.floor(secs * 4) % 2 === 0 ? '#ff2200' : '#ffdd00') : '#ffdd00';
  }

  // ── Enemy flag 3D object ───────────────────────────────────────────────────
  function _buildEnemyFlag(x, y, z) {
    var group = new THREE.Group();

    // Pole — dark metal cylinder
    var poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 4);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.25; // base at y=0, top at y=2.5
    group.add(pole);

    // Flag — red double-sided plane
    var flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
    var flagMat = new THREE.MeshLambertMaterial({
      color: 0xdd0000,
      side: THREE.DoubleSide,
    });
    _flagMesh = new THREE.Mesh(flagGeo, flagMat);
    // Position flag at top of pole, offset right by half flag width
    _flagMesh.position.set(0.4, 2.25, 0);
    group.add(_flagMesh);

    group.position.set(x, y, z);
    return group;
  }

  // ── Home base ring ─────────────────────────────────────────────────────────
  function _buildBaseRing() {
    var geo = new THREE.RingGeometry(1.5, 2, 12);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x00cc44,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2; // lay flat on ground
    mesh.position.set(0, 0.05, 0);  // home base at world origin
    return mesh;
  }

  // ── Optional home blue flag ────────────────────────────────────────────────
  function _buildHomeFlag() {
    var group = new THREE.Group();

    var poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 4);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x222244 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.25;
    group.add(pole);

    var flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
    var flagMat = new THREE.MeshLambertMaterial({
      color: 0x2244dd,
      side: THREE.DoubleSide,
    });
    var flagPlane = new THREE.Mesh(flagGeo, flagMat);
    flagPlane.position.set(0.4, 2.25, 0);
    group.add(flagPlane);

    group.position.set(-1.5, 0, 1.5); // slight offset from exact origin
    return group;
  }

  // ── Carried flag visual (attaches to camera) ───────────────────────────────
  function _buildCarriedFlag() {
    var group = new THREE.Group();

    var poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 4);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 0.6;
    group.add(pole);

    var flagGeo = new THREE.PlaneGeometry(0.4, 0.25);
    var flagMat = new THREE.MeshLambertMaterial({
      color: 0xdd0000,
      side: THREE.DoubleSide,
    });
    var flagPlane = new THREE.Mesh(flagGeo, flagMat);
    flagPlane.position.set(0.2, 1.12, 0);
    group.add(flagPlane);

    return group;
  }

  // ── Spawn guards around the flag ───────────────────────────────────────────
  function _spawnGuards(fx, fy, fz) {
    if (!window.Enemies || !window.Enemies.spawnAt) return;
    for (var i = 0; i < GUARD_COUNT; i++) {
      var angle = (i / GUARD_COUNT) * Math.PI * 2;
      var gx = fx + Math.cos(angle) * GUARD_RADIUS;
      var gz = fz + Math.sin(angle) * GUARD_RADIUS;
      try {
        window.Enemies.spawnAt(gx, fy, gz, 'SOLDIER');
      } catch (e) {}
    }
  }

  // ── Spawn a defend enemy approaching home base ─────────────────────────────
  function _spawnDefendEnemy() {
    if (!window.Enemies || !window.Enemies.spawnAt) return;
    var angle = Math.random() * Math.PI * 2;
    var ex = Math.cos(angle) * DEFEND_ENEMY_RADIUS;
    var ez = Math.sin(angle) * DEFEND_ENEMY_RADIUS;
    try {
      window.Enemies.spawnAt(ex, 0, ez, 'SOLDIER');
    } catch (e) {}
  }

  // ── Pick-up flag (attach to player) ───────────────────────────────────────
  function _pickUpFlag() {
    if (_phase !== 'active') return;
    _phase = 'carrying';
    window._carryingFlag = true;

    // Remove world flag
    if (_flagGroup && _scene) {
      _scene.remove(_flagGroup);
      _flagGroup = null;
      _flagMesh  = null;
    }

    // Build carried flag and add to scene (will be repositioned each frame)
    _carryFlagGroup = _buildCarriedFlag();
    if (_scene) _scene.add(_carryFlagGroup);

    _showToast('🚩 FLAG CAPTURED — RETURN TO BASE!');
    _playAlarm(); // alert sound on pick-up
  }

  // ── Drop flag at position ──────────────────────────────────────────────────
  function _dropFlag(px, py, pz) {
    if (_phase !== 'carrying') return;
    _phase = 'active';
    window._carryingFlag = false;

    // Remove carried flag visual
    if (_carryFlagGroup && _scene) {
      _scene.remove(_carryFlagGroup);
      _carryFlagGroup = null;
    }

    // Re-spawn world flag at drop location
    _flagGroup = _buildEnemyFlag(px, py - 0.5, pz);
    _flagPos   = new THREE.Vector3(px, py - 0.5, pz);
    if (_scene) _scene.add(_flagGroup);

    _showToast('🚩 FLAG DROPPED!');
    _playAlarm();
  }

  // ── Capture success ────────────────────────────────────────────────────────
  function _captureSuccess() {
    if (_phase !== 'carrying') return;
    _phase = 'done';
    window._carryingFlag = false;

    // Remove carried flag
    if (_carryFlagGroup && _scene) {
      _scene.remove(_carryFlagGroup);
      _carryFlagGroup = null;
    }

    _addScore(SCORE_CAPTURE);
    _showToast('FLAG CAPTURED! +' + SCORE_CAPTURE);
    _playFanfare();
    _playWinChime();

    // Remove speed penalty signal
    window._ctfSpeedPenalty = 0;

    _showMissionHUD(false);
  }

  // ── Mission failed (timeout) ───────────────────────────────────────────────
  function _missionFailed() {
    if (_phase === 'done' || _phase === 'idle') return;
    _phase = 'done';
    window._carryingFlag = false;
    window._ctfSpeedPenalty = 0;

    // Deduct score (clamp to 0)
    if (window.player && window.player.score !== undefined) {
      window.player.score = Math.max(0, window.player.score - 500);
    }

    // Clean up world objects
    if (_flagGroup && _scene) {
      _scene.remove(_flagGroup);
      _flagGroup = null;
      _flagMesh  = null;
    }
    if (_carryFlagGroup && _scene) {
      _scene.remove(_carryFlagGroup);
      _carryFlagGroup = null;
    }

    _showToast('MISSION FAILED -500');
    _showMissionHUD(false);
  }

  // ── Public: startMission ───────────────────────────────────────────────────
  function startMission() {
    if (_phase !== 'idle') return; // already running

    _scene  = _scene  || window._gameScene;
    _camera = _camera || window._camera;

    if (!_scene || !_camera) return; // no scene yet — skip

    _phase       = 'active';
    _missionTimer = TIMEOUT_SECONDS;
    _animTime    = 0;
    _defendTimer = DEFEND_ENEMY_INTERVAL;
    window._carryingFlag = false;
    window._ctfSpeedPenalty = SPEED_PENALTY;

    // Pick a random angle and distance for the enemy flag
    var angle = Math.random() * Math.PI * 2;
    var dist  = FLAG_SPAWN_MIN + Math.random() * (FLAG_SPAWN_MAX - FLAG_SPAWN_MIN);
    var camPos = _camera.position;
    var fx = camPos.x + Math.cos(angle) * dist;
    var fz = camPos.z + Math.sin(angle) * dist;
    var fy = 0; // ground level

    _flagPos   = new THREE.Vector3(fx, fy, fz);
    _flagGroup = _buildEnemyFlag(fx, fy, fz);
    if (_scene) _scene.add(_flagGroup);

    // Green home base ring
    if (!_baseRing) {
      _baseRing = _buildBaseRing();
      if (_scene) _scene.add(_baseRing);
    }

    // Optional blue home flag
    if (!_homeBlueFlag) {
      _homeBlueFlag = _buildHomeFlag();
      if (_scene) _scene.add(_homeBlueFlag);
    }

    // Spawn guards
    _spawnGuards(fx, fy, fz);

    _ensureHUD();
    _showMissionHUD(true);
    _updateTimerHUD(TIMEOUT_SECONDS);

    _showToast('🚩 FLAG MISSION — CAPTURE THE ENEMY FLAG!');
  }

  // ── Public: onWaveStart ────────────────────────────────────────────────────
  function onWaveStart(waveNum) {
    if (waveNum % 3 !== 0) return;
    // Allow re-triggering after a completed mission (reset first)
    if (_phase !== 'idle') return;
    startMission();
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    _ensureHUD();

    // Hook into global damage event so we can drop flag
    var _origTakeDamage = window._takeDamageFromWaveEvent;
    window._takeDamageFromWaveEvent = function (dmg) {
      if (_origTakeDamage) _origTakeDamage(dmg);
      if (_phase === 'carrying' && Math.random() < DROP_CHANCE) {
        var cp = _camera ? _camera.position : new THREE.Vector3();
        _dropFlag(cp.x, cp.y, cp.z);
      }
    };
  }

  // ── Public: update (call every frame with delta in seconds) ───────────────
  function update(delta) {
    if (_phase === 'idle' || _phase === 'done') return;

    _animTime += delta;

    // ── Countdown ─────────────────────────────────────────────────────────────
    _missionTimer -= delta;
    _updateTimerHUD(_missionTimer);

    if (_missionTimer <= 0) {
      _missionFailed();
      return;
    }

    // ── Carried flag follows camera ────────────────────────────────────────────
    if (_phase === 'carrying' && _carryFlagGroup && _camera) {
      // Offset 0.3 to the right of camera facing
      var right = new THREE.Vector3();
      right.crossVectors(
        _camera.getWorldDirection(new THREE.Vector3()),
        new THREE.Vector3(0, 1, 0)
      ).normalize().multiplyScalar(0.3);

      _carryFlagGroup.position.set(
        _camera.position.x + right.x,
        _camera.position.y - 0.3,
        _camera.position.z + right.z
      );
      _carryFlagGroup.rotation.y = _camera.rotation.y;
    }

    // ── Flag waving animation (sine on Y rotation) ────────────────────────────
    if (_phase === 'active' && _flagMesh) {
      _flagMesh.rotation.y = Math.sin(_animTime * 3.0) * 0.35;
    }

    var playerPos = _camera ? _camera.position : null;
    if (!playerPos) return;

    // ── Check pick-up (player near enemy flag) ─────────────────────────────────
    if (_phase === 'active' && _flagPos) {
      var dx = playerPos.x - _flagPos.x;
      var dz = playerPos.z - _flagPos.z;
      var distToFlag = Math.sqrt(dx * dx + dz * dz);
      if (distToFlag <= CAPTURE_RADIUS) {
        _pickUpFlag();
        return;
      }
    }

    // ── Check return to base (player near origin while carrying) ──────────────
    if (_phase === 'carrying') {
      var bx = playerPos.x;
      var bz = playerPos.z;
      var distToBase = Math.sqrt(bx * bx + bz * bz);
      if (distToBase <= BASE_RADIUS) {
        _captureSuccess();
        return;
      }
    }

    // ── Defend: periodically spawn enemy approaching home base ────────────────
    if (_phase === 'active' || _phase === 'carrying') {
      _defendTimer -= delta;
      if (_defendTimer <= 0) {
        _defendTimer = DEFEND_ENEMY_INTERVAL;
        _spawnDefendEnemy();
      }
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    _phase = 'idle';
    _missionTimer = 0;
    window._carryingFlag = false;
    window._ctfSpeedPenalty = 0;

    if (_flagGroup && _scene) {
      _scene.remove(_flagGroup);
      _flagGroup = null;
      _flagMesh  = null;
    }
    if (_carryFlagGroup && _scene) {
      _scene.remove(_carryFlagGroup);
      _carryFlagGroup = null;
    }
    if (_baseRing && _scene) {
      _scene.remove(_baseRing);
      _baseRing = null;
    }
    if (_homeBlueFlag && _scene) {
      _scene.remove(_homeBlueFlag);
      _homeBlueFlag = null;
    }

    _flagPos = null;
    _animTime = 0;
    _defendTimer = 0;

    _showMissionHUD(false);
  }

  // ── Module export ──────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset,
    startMission: startMission,
    onWaveStart: onWaveStart,
  };

}());
