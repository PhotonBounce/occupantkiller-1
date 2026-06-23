window.SuppressorKit = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _equipped = false;
  var _weapons = ['PISTOL', 'SMG', 'AR', 'SNIPER'];
  var _suppressedWeapons = {};
  var _flashEl = null;
  var _hudEl = null;
  var _detectionMult = 1.0;
  var _soundMult = 1.0;
  var _suppressorMesh = null;

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'suppressor-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:120px;left:20px;color:#88FF88;font-family:monospace;font-size:11px;letter-spacing:1px;pointer-events:none;display:none;z-index:1500;text-shadow:0 0 6px #00FF00';
    document.body.appendChild(_hudEl);
  }

  function _buildSuppressorMesh() {
    if (!_scene || !_camera) return;
    var geo = new THREE.CylinderGeometry(0.025, 0.03, 0.22, 8);
    var mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    _suppressorMesh = new THREE.Mesh(geo, mat);
    _suppressorMesh.rotation.z = Math.PI / 2;
    _suppressorMesh.position.set(0.08, -0.07, -0.38);
    _suppressorMesh.visible = false;
    _camera.add(_suppressorMesh);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_equipped) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';
    var wType = (window.Weapons && Weapons.getCurrentType) ? Weapons.getCurrentType() : '?';
    var isSup = _suppressedWeapons[wType] ? '●' : '○';
    _hudEl.textContent = 'SUPPRESSOR ' + isSup + ' [' + wType + '] DET:' + Math.round((1 - _detectionMult) * 100) + '% QUIET';
  }

  function _attach() {
    if (!_equipped) return;
    var wType = (window.Weapons && Weapons.getCurrentType) ? Weapons.getCurrentType() : null;
    if (!wType) return;
    _suppressedWeapons[wType] = true;
    _detectionMult = 0.25;
    _soundMult = 0.15;
    if (_suppressorMesh) _suppressorMesh.visible = true;
    if (window.AudioSystem && AudioSystem.setSuppressed) AudioSystem.setSuppressed(true);
    window._suppressed = true;
    _updateHUD();
  }

  function _detach() {
    var wType = (window.Weapons && Weapons.getCurrentType) ? Weapons.getCurrentType() : null;
    if (wType) delete _suppressedWeapons[wType];
    _detectionMult = 1.0;
    _soundMult = 1.0;
    if (_suppressorMesh) _suppressorMesh.visible = false;
    if (window.AudioSystem && AudioSystem.setSuppressed) AudioSystem.setSuppressed(false);
    window._suppressed = false;
    _updateHUD();
  }

  function _onKey(e) {
    if (e.code === 'KeyN' && e.ctrlKey && e.shiftKey) {
      _equipped = !_equipped;
      if (_equipped) _attach(); else _detach();
      var msg = _equipped ? 'SUPPRESSOR ATTACHED' : 'SUPPRESSOR REMOVED';
      if (window.DamageNumbers && DamageNumbers.spawnText) {
        DamageNumbers.spawnText(msg, 0, 1, 0, '#88FF88');
      }
    }
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _suppressedWeapons = {};
    _equipped = false;
    _buildHUD();
    _buildSuppressorMesh();
    document.addEventListener('keydown', _onKey);
    window._suppressed = false;
    window._suppressionDetectMult = 1.0;
  }

  function update(dt) {
    window._suppressionDetectMult = _equipped ? _detectionMult : 1.0;
    if (_equipped && _suppressorMesh) {
      _suppressorMesh.rotation.y += dt * 0.5;
    }
    _updateHUD();
  }

  function reset() {
    _equipped = false;
    _suppressedWeapons = {};
    _detectionMult = 1.0;
    window._suppressed = false;
    if (_suppressorMesh) _suppressorMesh.visible = false;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };
})();
