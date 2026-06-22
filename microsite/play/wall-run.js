window.WallRun = (function () {
  'use strict';

  var WALL_RUN_DURATION = 1.2;
  var WALL_COOLDOWN = 1.5;
  var WALL_DETECT_DIST = 0.6;
  var WALL_Y_OFFSET = 1;
  var CAMERA_TILT = 0.26;
  var Y_DRIFT = 0.3;
  var JUMP_BOOST = 1.5;
  var HUD_ID = 'wall-run-hud';

  var _active = false;
  var _timeLeft = 0;
  var _cooldown = 0;
  var _wallSide = 0; // -1 left, 1 right
  var _audioCtx = null;
  var _hudEl = null;

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return _audioCtx;
  }

  function _playScrape() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufSize = ctx.sampleRate * 0.18;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1800;
      bpf.Q.value = 0.6;
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      src.connect(bpf);
      bpf.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playJump() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.28, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  function _createHud() {
    if (document.getElementById(HUD_ID)) return;
    var el = document.createElement('div');
    el.id = HUD_ID;
    el.style.cssText = [
      'position:fixed',
      'bottom:82px',
      'left:18px',
      'background:rgba(0,0,0,0.55)',
      'color:#e0e0e0',
      'font-family:monospace',
      'font-size:11px',
      'padding:4px 8px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:999',
      'letter-spacing:0.04em',
      'user-select:none'
    ].join(';');
    el.textContent = 'WALL RUN READY';
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _updateHud() {
    if (!_hudEl) {
      _hudEl = document.getElementById(HUD_ID);
      if (!_hudEl) return;
    }
    if (_cooldown > 0) {
      _hudEl.style.color = '#ff6b6b';
      _hudEl.textContent = 'WALL RUN COOLDOWN ' + _cooldown.toFixed(1) + 's';
    } else if (_active) {
      _hudEl.style.color = '#7effa0';
      _hudEl.textContent = 'WALL RUNNING ' + _timeLeft.toFixed(1) + 's';
    } else {
      _hudEl.style.color = '#e0e0e0';
      _hudEl.textContent = 'WALL RUN READY';
    }
  }

  function _detectWall(pos) {
    if (typeof VoxelWorld === 'undefined' || typeof VoxelWorld.isSolid !== 'function') {
      return 0;
    }
    var x = pos.x, y = pos.y, z = pos.z;
    var checkY = Math.floor(y) + WALL_Y_OFFSET;
    var leftSolid = VoxelWorld.isSolid(x - WALL_DETECT_DIST, checkY, z);
    var rightSolid = VoxelWorld.isSolid(x + WALL_DETECT_DIST, checkY, z);
    if (leftSolid) return -1;
    if (rightSolid) return 1;
    return 0;
  }

  function _canStart() {
    if (_active) return false;
    if (_cooldown > 0) return false;
    if (!window._sprinting) return false;
    if (window._dodgeRolling) return false;
    if (window._aimingWeapon) return false;
    return true;
  }

  function _getCamera() {
    if (window.camera) return window.camera;
    if (window.Camera && window.Camera.instance) return window.Camera.instance;
    return null;
  }

  function _getVelocity(playerVelocity) {
    return playerVelocity || window._playerVelocity || null;
  }

  function _startWallRun(side, pos) {
    _active = true;
    _timeLeft = WALL_RUN_DURATION;
    _wallSide = side;
    window._wallRunning = true;
    window._wallRunTimeleft = _timeLeft;
    _playScrape();
    var cam = _getCamera();
    if (cam && cam.rotation) {
      cam.rotation.z = -side * CAMERA_TILT;
    }
  }

  function _endWallRun(playerVelocity) {
    _active = false;
    _cooldown = WALL_COOLDOWN;
    window._wallRunning = false;
    window._wallRunTimeleft = 0;
    var vel = _getVelocity(playerVelocity);
    if (vel) {
      vel.y = JUMP_BOOST;
    } else {
      window._wallRunJumpBoost = JUMP_BOOST;
    }
    _playJump();
    var cam = _getCamera();
    if (cam && cam.rotation) {
      cam.rotation.z = 0;
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _createHud);
    } else {
      _createHud();
    }
    window._wallRunning = false;
    window._wallRunTimeleft = 0;
    window._wallRunJumpBoost = 0;
  }

  function update(dt, playerPos, playerVelocity) {
    if (!dt || dt <= 0) return;

    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown < 0) _cooldown = 0;
    }

    var pos = playerPos || window._playerPos || null;

    if (_active) {
      _timeLeft -= dt;
      window._wallRunTimeleft = _timeLeft > 0 ? _timeLeft : 0;

      if (_timeLeft <= 0) {
        _endWallRun(playerVelocity);
        _updateHud();
        return;
      }

      var wallStillThere = pos ? (_detectWall(pos) === _wallSide) : true;
      if (!window._sprinting || !wallStillThere || window._dodgeRolling) {
        _endWallRun(playerVelocity);
        _updateHud();
        return;
      }

      var vel = _getVelocity(playerVelocity);
      if (vel) {
        vel.y = 0;
        var fraction = 1 - (_timeLeft / WALL_RUN_DURATION);
        var yDriftRate = Y_DRIFT / WALL_RUN_DURATION;
        vel.y = yDriftRate;
      }

      var cam = _getCamera();
      if (cam && cam.rotation) {
        cam.rotation.z = -_wallSide * CAMERA_TILT;
      }

      if (window.HeadBob && typeof window.HeadBob.setMultiplier === 'function') {
        window.HeadBob.setMultiplier(2.0);
      }

      _updateHud();
      return;
    }

    if (window.HeadBob && typeof window.HeadBob.setMultiplier === 'function' && !_active) {
      window.HeadBob.setMultiplier(1.0);
    }

    if (!pos) {
      _updateHud();
      return;
    }

    if (_canStart()) {
      var side = _detectWall(pos);
      if (side !== 0) {
        var vel2 = _getVelocity(playerVelocity);
        var movingH = false;
        if (vel2) {
          movingH = Math.abs(vel2.x) > 0.1 || Math.abs(vel2.z) > 0.1;
        } else {
          movingH = true;
        }
        if (movingH) {
          _startWallRun(side, pos);
        }
      }
    }

    _updateHud();
  }

  function reset() {
    _active = false;
    _timeLeft = 0;
    _cooldown = 0;
    _wallSide = 0;
    window._wallRunning = false;
    window._wallRunTimeleft = 0;
    window._wallRunJumpBoost = 0;
    var cam = _getCamera();
    if (cam && cam.rotation) {
      cam.rotation.z = 0;
    }
    if (window.HeadBob && typeof window.HeadBob.setMultiplier === 'function') {
      window.HeadBob.setMultiplier(1.0);
    }
    _updateHud();
  }

  return { init: init, update: update, reset: reset };
})();
