window.KillCam = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _enabled = true;
  var _snapshots = [];
  var _maxSnapshots = 60;
  var _captureRate = 20;
  var _captureTimer = 0;
  var _playbackActive = false;
  var _playbackIndex = 0;
  var _playbackTimer = 0;
  var _playbackSpeed = 0.35;
  var _savedCameraState = null;
  var _killCamTimer = 0;
  var _killCamDuration = 4;
  var _overlayEl = null;
  var _labelEl = null;
  var _lastKillerPos = null;
  var _lastKillerMesh = null;
  var _freezeEl = null;
  var _flashTimeout = null;

  function _createOverlay() {
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'killcam-overlay';
    _overlayEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:2000', 'display:none'
    ].join(';');

    var border = document.createElement('div');
    border.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'border:3px solid rgba(255,60,60,0.8)',
      'box-shadow:inset 0 0 60px rgba(200,0,0,0.3)'
    ].join(';');
    _overlayEl.appendChild(border);

    _labelEl = document.createElement('div');
    _labelEl.style.cssText = [
      'position:absolute', 'top:50%', 'left:50%',
      'transform:translate(-50%,-180px)',
      'color:#FF4444', 'font-family:monospace', 'font-size:22px',
      'font-weight:bold', 'letter-spacing:4px',
      'text-shadow:0 0 12px #FF0000, 0 2px 4px #000',
      'text-align:center'
    ].join(';');
    _labelEl.innerHTML = 'KILL CAM<br><span style="font-size:13px;color:#AAA;letter-spacing:1px">REPLAY</span>';
    _overlayEl.appendChild(_labelEl);

    var slowLabel = document.createElement('div');
    slowLabel.style.cssText = [
      'position:absolute', 'bottom:80px', 'right:20px',
      'color:rgba(255,100,100,0.7)', 'font-family:monospace', 'font-size:11px',
      'letter-spacing:2px'
    ].join(';');
    slowLabel.textContent = '0.35× SPEED';
    _overlayEl.appendChild(slowLabel);

    document.body.appendChild(_overlayEl);
  }

  function _createFreezeFrame() {
    _freezeEl = document.createElement('div');
    _freezeEl.id = 'killcam-freeze';
    _freezeEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(200,50,50,0.15)', 'pointer-events:none',
      'z-index:1999', 'display:none', 'backdrop-filter:saturate(1.3) contrast(1.1)'
    ].join(';');
    document.body.appendChild(_freezeEl);
  }

  function _saveCameraState() {
    if (!_camera) return;
    _savedCameraState = {
      px: _camera.position.x, py: _camera.position.y, pz: _camera.position.z,
      rx: _camera.rotation.x, ry: _camera.rotation.y, rz: _camera.rotation.z
    };
  }

  function _restoreCameraState() {
    if (!_camera || !_savedCameraState) return;
    _camera.position.set(_savedCameraState.px, _savedCameraState.py, _savedCameraState.pz);
    _camera.rotation.set(_savedCameraState.rx, _savedCameraState.ry, _savedCameraState.rz);
  }

  function _captureSnapshot() {
    if (!_camera) return;
    var snap = {
      px: _camera.position.x, py: _camera.position.y, pz: _camera.position.z,
      rx: _camera.rotation.x, ry: _camera.rotation.y, rz: _camera.rotation.z
    };
    _snapshots.push(snap);
    if (_snapshots.length > _maxSnapshots) {
      _snapshots.shift();
    }
  }

  function _startPlayback(killerPos) {
    if (!_camera || _snapshots.length < 3 || _playbackActive) return;
    if (window._isPaused) return;

    _playbackActive = true;
    _playbackIndex = 0;
    _playbackTimer = 0;
    _killCamTimer = _killCamDuration;
    _lastKillerPos = killerPos || null;

    _saveCameraState();
    if (_overlayEl) _overlayEl.style.display = 'block';
    if (_freezeEl) _freezeEl.style.display = 'block';
    window._isPaused = true;
    window._killCamActive = true;

    setTimeout(function() {
      window._isPaused = false;
      _playbackActive = true;
    }, 600);
  }

  function _endPlayback() {
    _playbackActive = false;
    window._killCamActive = false;
    if (_overlayEl) _overlayEl.style.display = 'none';
    if (_freezeEl) _freezeEl.style.display = 'none';
    _restoreCameraState();
    _snapshots = [];
  }

  function _hookDeathEvent() {
    var prevDmg = window._onPlayerDamage;
    window._onPlayerDamage = function(dmg, killerMesh) {
      if (prevDmg) prevDmg(dmg, killerMesh);
      var player = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
      if (!player) return;
      var hp = player.hp !== undefined ? player.hp : player.health;
      if (hp !== undefined && hp <= 0 && _enabled) {
        var killerPos = null;
        if (killerMesh && killerMesh.position) killerPos = killerMesh.position.clone();
        else if (killerMesh && killerMesh.parent && killerMesh.parent.position) {
          killerPos = killerMesh.parent.position.clone();
        }
        setTimeout(function() { _startPlayback(killerPos); }, 100);
      }
    };
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _snapshots = [];
    _playbackActive = false;
    _createOverlay();
    _createFreezeFrame();
    _hookDeathEvent();
    window._killCamActive = false;

    document.addEventListener('keydown', function(e) {
      if (e.code === 'Escape' && _playbackActive) {
        _endPlayback();
      }
    });
  }

  function update(dt) {
    if (!_scene || !_camera) return;

    if (!_playbackActive) {
      _captureTimer -= dt;
      if (_captureTimer <= 0) {
        _captureTimer = 1 / _captureRate;
        _captureSnapshot();
      }
      return;
    }

    _killCamTimer -= dt * _playbackSpeed;

    var replayDt = dt * _playbackSpeed;
    _playbackTimer += replayDt;
    var frameInterval = 1 / _captureRate;
    var targetFrame = Math.floor(_playbackTimer / frameInterval);

    if (_snapshots.length > 0 && targetFrame < _snapshots.length) {
      var snap = _snapshots[targetFrame];
      _camera.position.set(snap.px, snap.py, snap.pz);
      _camera.rotation.set(snap.rx, snap.ry, snap.rz);
    }

    if (_lastKillerPos && _snapshots.length > 0 && targetFrame >= _snapshots.length - 1) {
      var lastSnap = _snapshots[_snapshots.length - 1];
      _camera.position.set(lastSnap.px, lastSnap.py, lastSnap.pz);
      _camera.lookAt(_lastKillerPos.x, _lastKillerPos.y + 1, _lastKillerPos.z);
    }

    if (targetFrame >= _snapshots.length || _killCamTimer <= 0) {
      _endPlayback();
    }
  }

  function enable() { _enabled = true; }
  function disable() { _enabled = false; _endPlayback(); }

  function reset() {
    _snapshots = [];
    _playbackActive = false;
    window._killCamActive = false;
    if (_overlayEl) _overlayEl.style.display = 'none';
    if (_freezeEl) _freezeEl.style.display = 'none';
  }

  return { init: init, update: update, enable: enable, disable: disable, reset: reset };
})();
