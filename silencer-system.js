// silencer-system.js — Weapon Suppressor / Silencer System
// Exports: window.SilencerSystem = { init, update, attachSilencer, detachSilencer, reset }
// Key: T (note: T is also used for gas-mask toggle in game-manager.js;
//      both handlers coexist via separate addEventListener registrations)

window.SilencerSystem = (function () {
  'use strict';

  var _equipped = false;
  var _scene = null;
  var _camera = null;
  var _silencerMesh = null;
  var _audioCtx = null;
  var _hudBadge = null;
  var _initialized = false;

  var COMPATIBLE = ['pistol', 'glock', 'pm', 'fort', 'desert eagle', 'deagle',
                    'ak74', 'ak-74', 'ak 74', 'm4a1', 'm4', 'mp5', 'mp-5'];
  var INCOMPATIBLE = ['rpg', 'mg3', 'shotgun', 'spas', 'mossberg', 'usas', 'aa-12'];

  var _pickups = [];
  var _currentLevel = 0;
  var _origPlayGunshot = null;
  var _origPlaySpatialGunshot = null;

  function _showToast(text, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(text, color || '#ffffff');
    } else if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast(text, 2000, color || '#ffffff');
    }
  }

  function _getCurrentWeaponName() {
    if (typeof Weapons !== 'undefined' && Weapons.getCurrentName) {
      return Weapons.getCurrentName();
    }
    var el = document.getElementById('weapon-name-display');
    return el ? el.textContent : '';
  }

  function _isCompatible(weaponName) {
    if (!weaponName) return false;
    var lc = weaponName.toLowerCase();
    for (var i = 0; i < INCOMPATIBLE.length; i++) {
      if (lc.indexOf(INCOMPATIBLE[i]) !== -1) return false;
    }
    for (var j = 0; j < COMPATIBLE.length; j++) {
      if (lc.indexOf(COMPATIBLE[j]) !== -1) return true;
    }
    return false;
  }

  function _buildSilencerMesh() {
    if (typeof THREE === 'undefined') return null;
    var geo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(0.17, -0.13, -0.90);
    mesh.castShadow = false;
    mesh.name = 'silencerMesh';
    return mesh;
  }

  function _attachMeshToCamera() {
    if (!_silencerMesh || !_camera) return;
    _camera.add(_silencerMesh);
    _silencerMesh.visible = true;
  }

  function _removeMeshFromCamera() {
    if (_silencerMesh) {
      if (_camera) _camera.remove(_silencerMesh);
      if (_silencerMesh.geometry) _silencerMesh.geometry.dispose();
      if (_silencerMesh.material) _silencerMesh.material.dispose();
      _silencerMesh = null;
    }
  }

  function _ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) _audioCtx = new AC();
    } catch (e) {}
    return _audioCtx;
  }

  function _playSubsonicPhut() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.035);
    } catch (e) {}
  }

  function _createHUDBadge() {
    if (_hudBadge) return;
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'silencer-hud-badge';
    _hudBadge.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:42px',
      'right:12px',
      'background:rgba(0,60,0,0.75)',
      'border:1px solid #00cc44',
      'color:#00ff66',
      'padding:2px 8px',
      'border-radius:4px',
      'font-size:10px',
      'font-family:monospace',
      'letter-spacing:1px',
      'z-index:201',
      'pointer-events:none'
    ].join(';');
    _hudBadge.textContent = 'SUPPRESSED';
    document.body.appendChild(_hudBadge);
  }

  function _showHUDBadge(on) {
    if (!_hudBadge) _createHUDBadge();
    if (_hudBadge) _hudBadge.style.display = on ? 'block' : 'none';
    var nameEl = document.getElementById('weapon-name-display');
    if (nameEl) {
      var text = nameEl.textContent || '';
      if (on && text.charAt(0) !== '●') {
        nameEl.textContent = '● ' + text;
      } else if (!on && text.charAt(0) === '●') {
        nameEl.textContent = text.slice(2);
      }
    }
  }

  function _setGlobals(equipped) {
    window._silencerEquipped = equipped;
    window._silencerAlertRange = equipped ? 6 : 20;
    window._silencerDamageMult = equipped ? 0.92 : 1.0;
  }

  function _patchAudio(on) {
    if (typeof window.AudioSystem === 'undefined') return;
    if (on) {
      if (!_origPlayGunshot) {
        _origPlayGunshot = window.AudioSystem.playGunshot || function () {};
      }
      if (!_origPlaySpatialGunshot) {
        _origPlaySpatialGunshot = window.AudioSystem.playSpatialGunshot || function () {};
      }
      window.AudioSystem.playGunshot = function () {
        if (window._silencerEquipped) { _playSubsonicPhut(); return; }
        _origPlayGunshot.apply(window.AudioSystem, arguments);
      };
      window.AudioSystem.playSpatialGunshot = function () {
        if (window._silencerEquipped) { _playSubsonicPhut(); return; }
        _origPlaySpatialGunshot.apply(window.AudioSystem, arguments);
      };
    } else {
      if (_origPlayGunshot) {
        window.AudioSystem.playGunshot = _origPlayGunshot;
        _origPlayGunshot = null;
      }
      if (_origPlaySpatialGunshot) {
        window.AudioSystem.playSpatialGunshot = _origPlaySpatialGunshot;
        _origPlaySpatialGunshot = null;
      }
    }
  }

  function _patchMuzzleFlash() {
    var _interval = setInterval(function () {
      if (typeof Tracers === 'undefined' || !Tracers.spawnMuzzleFlash) return;
      clearInterval(_interval);
      var _orig = Tracers.spawnMuzzleFlash;
      Tracers.spawnMuzzleFlash = function (pos, scale) {
        var s = scale;
        if (window._silencerEquipped) { s = (s || 1) * (0.2 / 1.5); }
        _orig.call(Tracers, pos, s);
      };
    }, 500);
  }

  function _spawnPickup(scene, x, y, z) {
    if (typeof THREE === 'undefined') return null;
    var geo = new THREE.BoxGeometry(0.08, 0.08, 0.3);
    var mat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = 'silencerPickup';
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 32;
      var ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        ctx2d.fillStyle = '#223344';
        ctx2d.fillRect(0, 0, 64, 32);
        ctx2d.fillStyle = '#00ff88';
        ctx2d.font = 'bold 14px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.fillText('SUPP', 32, 22);
        var tex = new THREE.CanvasTexture(canvas);
        var lblGeo = new THREE.PlaneGeometry(0.1, 0.05);
        var lblMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        var label = new THREE.Mesh(lblGeo, lblMat);
        label.position.set(0, 0.06, 0);
        mesh.add(label);
      }
    } catch (e) {}
    scene.add(mesh);
    _pickups.push({ mesh: mesh, scene: scene });
    return mesh;
  }

  function _spawnLevelPickups(scene) {
    if (!scene || typeof THREE === 'undefined') return;
    var rx = (Math.random() - 0.5) * 40;
    var rz = (Math.random() - 0.5) * 40;
    _spawnPickup(scene, rx, 1.5, rz);
  }

  function _checkPickupCollection(playerPos) {
    if (!playerPos || _pickups.length === 0) return;
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var p = _pickups[i];
      if (!p.mesh) continue;
      var dx = p.mesh.position.x - playerPos.x;
      var dy = p.mesh.position.y - playerPos.y;
      var dz = p.mesh.position.z - playerPos.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.5) {
        p.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        _pickups.splice(i, 1);
        _showToast('[T] SUPPRESSOR FOUND — press T to equip', '#00ff88');
        if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playPickup) {
          window.AudioSystem.playPickup();
        }
      }
    }
  }

  function _onKeyDown(e) {
    if (e.code !== 'KeyT') return;
    if (typeof gameState !== 'undefined' && typeof STATE !== 'undefined') {
      if (gameState !== STATE.PLAYING) return;
    }
    if (typeof DroneSystem !== 'undefined' && DroneSystem.isPossessing && DroneSystem.isPossessing()) return;
    if (typeof VehicleSystem !== 'undefined' && VehicleSystem.isInVehicle && VehicleSystem.isInVehicle()) return;
    if (_equipped) { detachSilencer(); } else { attachSilencer(); }
  }

  function attachSilencer() {
    var weaponName = _getCurrentWeaponName();
    var lc = (weaponName || '').toLowerCase();
    for (var k = 0; k < INCOMPATIBLE.length; k++) {
      if (lc.indexOf(INCOMPATIBLE[k]) !== -1) {
        _showToast('INCOMPATIBLE — cannot suppress ' + weaponName, '#ff4444');
        return false;
      }
    }
    if (!_isCompatible(weaponName)) {
      _showToast('INCOMPATIBLE — cannot suppress ' + weaponName, '#ff4444');
      return false;
    }
    if (_equipped) return true;
    _equipped = true;
    _setGlobals(true);
    _silencerMesh = _buildSilencerMesh();
    if (_silencerMesh) _attachMeshToCamera();
    _showHUDBadge(true);
    _showToast('● SUPPRESSOR ATTACHED', '#00ff66');
    _patchAudio(true);
    return true;
  }

  function detachSilencer() {
    if (!_equipped) return;
    _equipped = false;
    _setGlobals(false);
    _removeMeshFromCamera();
    _showHUDBadge(false);
    _showToast('SUPPRESSOR REMOVED', '#aaaaaa');
    _patchAudio(false);
  }

  function update(dt) {
    var playerPos = window.player ? window.player.position : null;
    if (playerPos) _checkPickupCollection(playerPos);
    if (!_equipped || !_silencerMesh || !_camera) return;
    if (typeof Weapons !== 'undefined' && typeof THREE !== 'undefined') {
      var gunMeshes = window._weaponGunMeshes;
      if (gunMeshes && gunMeshes.length > 0) {
        for (var i = 0; i < gunMeshes.length; i++) {
          var gm = gunMeshes[i];
          if (gm && gm.visible && gm.userData && gm.userData.muzzlePos) {
            var mp = gm.userData.muzzlePos;
            _silencerMesh.position.set(mp.x, mp.y, mp.z - 0.28);
            return;
          }
        }
      }
    }
    _silencerMesh.position.set(0.17, -0.13, -0.90);
  }

  function _onLevelChange(levelIndex) {
    _currentLevel = levelIndex || 0;
    if (_currentLevel > 0 && _currentLevel % 3 === 0) {
      var scene = _scene || window._scene || null;
      if (scene) _spawnLevelPickups(scene);
    }
  }

  function init(opts) {
    if (_initialized) return;
    _initialized = true;
    opts = opts || {};
    _scene = opts.scene || window._scene || null;
    _camera = opts.camera || window._camera || null;
    _setGlobals(false);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _createHUDBadge);
    } else {
      _createHUDBadge();
    }
    document.addEventListener('keydown', _onKeyDown, false);
    _patchMuzzleFlash();
    var _origLevelStart = window.__onLevelStart;
    window.__onLevelStart = function (idx) {
      _onLevelChange(idx);
      if (_origLevelStart) _origLevelStart(idx);
    };
    if (typeof GameManager !== 'undefined' && GameManager.onLevelStart) {
      var _origGMLevelStart = GameManager.onLevelStart;
      GameManager.onLevelStart = function (idx) {
        _onLevelChange(idx);
        _origGMLevelStart.apply(GameManager, arguments);
      };
    }
    console.log('[SilencerSystem] initialized — press T to toggle suppressor');
  }

  function reset() {
    detachSilencer();
    for (var i = 0; i < _pickups.length; i++) {
      var p = _pickups[i];
      if (p.scene && p.mesh) p.scene.remove(p.mesh);
      if (p.mesh && p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh && p.mesh.material) p.mesh.material.dispose();
    }
    _pickups = [];
    _currentLevel = 0;
    _setGlobals(false);
  }

  return { init: init, update: update, attachSilencer: attachSilencer, detachSilencer: detachSilencer, reset: reset };

})();
