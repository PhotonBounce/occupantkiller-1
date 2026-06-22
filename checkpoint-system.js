window.CheckpointSystem = (function () {
  'use strict';

  var STORAGE_KEY = 'okk_checkpoint_v1';
  var CHECKPOINT_RADIUS = 2;
  var POSITIONS = [
    { x: 0,   y: 0, z: 10  },
    { x: 15,  y: 0, z: -10 },
    { x: -15, y: 0, z: -5  }
  ];

  var COLOR_UNUSED  = 0x00ff44;
  var COLOR_SAVED   = 0xffdd00;
  var COLOR_OLD     = 0x888888;

  var _scene   = null;
  var _camera  = null;
  var _player  = null;
  var _beacons = [];
  var _lights  = [];
  var _rings   = [];
  var _savedIndex = -1;
  var _restoreUI  = null;
  var _restoreKeyHandler = null;
  var _flashOverlay = null;
  var _flashTimer   = 0;

  window._checkpointData = null;

  // ---------- helpers ----------

  function _loadFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function _saveToStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function _setBeaconColor(index, color) {
    var beacon = _beacons[index];
    if (!beacon) return;
    beacon.material.color.setHex(color);
    beacon.material.emissive.setHex(color);
    beacon.material.emissiveIntensity = 0.4;
    var ring = _rings[index];
    if (ring) {
      ring.material.color.setHex(color);
      ring.material.emissive.setHex(color);
    }
  }

  function _pulseLight(index) {
    var light = _lights[index];
    if (!light) return;
    light.intensity = 3;
    light.color.setHex(COLOR_SAVED);
    // fade out over ~1 second via update
    light._pulse = 1.0;
  }

  // ---------- restore UI ----------

  function _showRestoreUI() {
    if (!_loadFromStorage()) {
      // no checkpoint — just let normal death flow handle it
      return;
    }
    if (_restoreUI) return;

    _restoreUI = document.createElement('div');
    _restoreUI.id = 'ck-restore-ui';
    _restoreUI.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:#fff',
      'font-family:monospace',
      'font-size:22px',
      'padding:32px 48px',
      'border:2px solid #00ff44',
      'border-radius:8px',
      'text-align:center',
      'z-index:99999',
      'pointer-events:none'
    ].join(';');
    _restoreUI.innerHTML =
      '<div style="color:#00ff44;font-size:28px;margin-bottom:12px">&#9632; CHECKPOINT</div>' +
      'RESTORE FROM CHECKPOINT?<br>' +
      '<span style="color:#ffdd00">[Y]</span> Restore &nbsp;&nbsp;' +
      '<span style="color:#ff4444">[N]</span> Respawn at start';
    document.body.appendChild(_restoreUI);

    // lock pointer so key events fire
    _restoreKeyHandler = function (e) {
      var key = e.key.toLowerCase();
      if (key === 'y') {
        _doRestore();
        _hideRestoreUI();
      } else if (key === 'n') {
        _hideRestoreUI();
      }
    };
    window.addEventListener('keydown', _restoreKeyHandler, { once: true });
  }

  function _hideRestoreUI() {
    if (_restoreUI) {
      _restoreUI.parentNode && _restoreUI.parentNode.removeChild(_restoreUI);
      _restoreUI = null;
    }
    if (_restoreKeyHandler) {
      window.removeEventListener('keydown', _restoreKeyHandler);
      _restoreKeyHandler = null;
    }
  }

  // ---------- flash overlay ----------

  function _createFlashOverlay() {
    _flashOverlay = document.createElement('div');
    _flashOverlay.style.cssText = [
      'position:fixed',
      'top:0','left:0',
      'width:100%','height:100%',
      'background:#fff',
      'opacity:0',
      'pointer-events:none',
      'z-index:99998',
      'transition:opacity 0.05s'
    ].join(';');
    document.body.appendChild(_flashOverlay);
  }

  function _triggerFlash() {
    if (!_flashOverlay) return;
    _flashOverlay.style.opacity = '0.85';
    _flashTimer = 0.4;
  }

  // ---------- core ----------

  function _doRestore() {
    var data = _loadFromStorage();
    if (!data || !_player) return;

    // teleport
    if (_player.object3D) {
      _player.object3D.position.set(data.px, data.py, data.pz);
    } else if (_player.position) {
      _player.position.set(data.px, data.py, data.pz);
    }

    // restore HP at 50%, ammo at 25% — never score (anti-exploit)
    if (typeof _player.hp !== 'undefined') {
      _player.hp = Math.max(1, Math.round(data.hp * 0.5));
    }
    if (typeof _player.ammo !== 'undefined') {
      _player.ammo = Math.max(1, Math.round(data.ammo * 0.25));
    }

    _triggerFlash();

    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast('CHECKPOINT RESTORED');
    }
  }

  // ---------- public API ----------

  function init(scene, camera, player) {
    _scene  = scene;
    _camera = camera;
    _player = player;

    _createFlashOverlay();

    // Check storage for previously saved index
    var stored = _loadFromStorage();
    _savedIndex = stored ? stored.checkpointIndex : -1;

    for (var i = 0; i < POSITIONS.length; i++) {
      (function (idx) {
        var pos = POSITIONS[idx];

        // Beacon cylinder
        var cylGeo  = new THREE.CylinderGeometry(0.1, 0.3, 1.5, 8);
        var cylMat  = new THREE.MeshStandardMaterial({
          color: COLOR_UNUSED,
          emissive: COLOR_UNUSED,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.85
        });
        var beacon = new THREE.Mesh(cylGeo, cylMat);
        beacon.position.set(pos.x, pos.y + 0.75, pos.z);
        scene.add(beacon);
        _beacons.push(beacon);

        // Rotating ring above
        var ringGeo = new THREE.TorusGeometry(0.45, 0.06, 8, 24);
        var ringMat = new THREE.MeshStandardMaterial({
          color: COLOR_UNUSED,
          emissive: COLOR_UNUSED,
          emissiveIntensity: 0.6
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(pos.x, pos.y + 1.9, pos.z);
        scene.add(ring);
        _rings.push(ring);

        // Point light
        var light = new THREE.PointLight(COLOR_UNUSED, 0.8, 6);
        light.position.set(pos.x, pos.y + 1.5, pos.z);
        light._pulse = 0;
        scene.add(light);
        _lights.push(light);

        // Apply stored color if this was the last saved checkpoint
        if (stored) {
          if (idx === stored.checkpointIndex) {
            _setBeaconColor(idx, COLOR_SAVED);
          } else if (idx < stored.checkpointIndex) {
            _setBeaconColor(idx, COLOR_OLD);
          }
        }
      })(i);
    }

    // Hook into player death
    var origDeath = window._onPlayerDeath;
    window._onPlayerDeath = function () {
      _showRestoreUI();
      if (typeof origDeath === 'function') origDeath();
    };
  }

  function update(delta) {
    if (!_scene || !_player) return;

    var t = delta || 0.016;

    // Rotate rings
    for (var i = 0; i < _rings.length; i++) {
      _rings[i].rotation.y += t * 1.2;
      _rings[i].rotation.x += t * 0.5;
    }

    // Pulse lights
    for (var j = 0; j < _lights.length; j++) {
      var lt = _lights[j];
      if (lt._pulse > 0) {
        lt._pulse -= t;
        lt.intensity = 0.8 + lt._pulse * 2.5;
        if (lt._pulse <= 0) {
          lt._pulse = 0;
          lt.intensity = 0.8;
        }
      }
    }

    // Flash overlay fade
    if (_flashTimer > 0) {
      _flashTimer -= t;
      if (_flashTimer <= 0) {
        _flashTimer = 0;
        if (_flashOverlay) _flashOverlay.style.opacity = '0';
      }
    }

    // Check proximity
    var playerPos = _player.position ||
      (_player.object3D && _player.object3D.position);
    if (!playerPos) return;

    for (var k = 0; k < POSITIONS.length; k++) {
      var cp = POSITIONS[k];
      var dx = playerPos.x - cp.x;
      var dz = playerPos.z - cp.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < CHECKPOINT_RADIUS) {
        save(k);
        break;
      }
    }
  }

  function save(checkpointIndex) {
    if (!_player) return;
    if (_savedIndex === checkpointIndex) return; // already saved here

    var playerPos = _player.position ||
      (_player.object3D && _player.object3D.position) ||
      { x: 0, y: 0, z: 0 };

    var data = {
      checkpointIndex: checkpointIndex,
      px: playerPos.x,
      py: playerPos.y,
      pz: playerPos.z,
      hp:    typeof _player.hp    !== 'undefined' ? _player.hp    : 100,
      ammo:  typeof _player.ammo  !== 'undefined' ? _player.ammo  : 30,
      wave:  typeof window.currentWave !== 'undefined' ? window.currentWave : 1,
      savedAt: Date.now()
    };

    _saveToStorage(data);
    window._checkpointData = data;

    // Color old checkpoints gray, this one yellow
    for (var i = 0; i < _beacons.length; i++) {
      if (i < checkpointIndex) {
        _setBeaconColor(i, COLOR_OLD);
      } else if (i === checkpointIndex) {
        _setBeaconColor(i, COLOR_SAVED);
      }
    }
    _pulseLight(checkpointIndex);

    _savedIndex = checkpointIndex;

    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast('CHECKPOINT SAVED ✓');
    }
  }

  function restore() {
    _doRestore();
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    window._checkpointData = null;
    _savedIndex = -1;
    for (var i = 0; i < _beacons.length; i++) {
      _setBeaconColor(i, COLOR_UNUSED);
      _lights[i].intensity = 0.8;
      _lights[i]._pulse = 0;
    }
    _hideRestoreUI();
  }

  return { init: init, update: update, save: save, restore: restore, reset: reset };

})();
