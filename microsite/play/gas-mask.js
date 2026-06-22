window.GasMask = (function() {
  'use strict';

  var _scene = null;
  var _equipped = false;
  var _available = false;
  var _durability = 100;
  var MAX_DURABILITY = 100;
  var DROP_CHANCE = 0.08;
  var COLLECT_RADIUS = 1.5;
  var DRAIN_RATE = 1.5; // durability per second in gas zone
  var GAS_LEVELS = ['KREMLIN', 'MOSCOW', 'TORETSK', 12, 8];

  // pickup objects in world
  var _pickups = [];

  // HUD elements
  var _hudEl = null;
  var _hudDurBarEl = null;
  var _hudDurFillEl = null;
  var _overlayEl = null;

  // breathing audio
  var _audioCtx = null;
  var _breathTimer = 0;
  var _breathInterval = 2.0;

  // ── HUD ──────────────────────────────────────────────────────────

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'gasMaskHUD';
    _hudEl.style.cssText = [
      'position:fixed;top:70px;right:15px;',
      'background:rgba(0,0,0,0.6);',
      'padding:4px 8px;border-radius:4px;',
      'color:#44ff44;font:13px monospace;',
      'pointer-events:none;z-index:4100;display:none;',
    ].join('');

    var label = document.createElement('div');
    label.id = 'gasMaskLabel';
    label.textContent = '😷 GAS MASK';
    _hudEl.appendChild(label);

    // durability bar wrapper
    var durWrap = document.createElement('div');
    durWrap.id = 'gasMaskDurWrap';
    durWrap.style.cssText = 'margin-top:3px;display:none;';

    var durOuter = document.createElement('div');
    durOuter.style.cssText = [
      'width:80px;height:5px;',
      'background:rgba(0,0,0,0.5);',
      'border:1px solid rgba(68,255,68,0.3);',
      'border-radius:3px;overflow:hidden;',
    ].join('');

    _hudDurFillEl = document.createElement('div');
    _hudDurFillEl.style.cssText = [
      'height:100%;width:100%;',
      'background:linear-gradient(90deg,#ffaa00,#ffff00);',
      'transition:width 0.3s,background 0.3s;',
    ].join('');

    durOuter.appendChild(_hudDurFillEl);
    durWrap.appendChild(durOuter);
    _hudDurBarEl = durWrap;
    _hudEl.appendChild(durWrap);

    document.body.appendChild(_hudEl);
  }

  function _createOverlay() {
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'gasMaskOverlay';
    _overlayEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:3000;',
      'background:rgba(0,80,0,0.08);',
      'display:none;',
    ].join('');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD(inGasZone) {
    if (!_hudEl) return;
    if (!_available && !_equipped) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';

    var labelEl = document.getElementById('gasMaskLabel');
    if (labelEl) {
      if (_equipped) {
        labelEl.textContent = '😷 GAS MASK';
        labelEl.style.color = '#44ff44';
      } else {
        labelEl.textContent = '😷 GAS MASK [T]';
        labelEl.style.color = '#888888';
      }
    }

    // Show durability bar only when equipped and in gas zone
    if (_hudDurBarEl) {
      _hudDurBarEl.style.display = (_equipped && inGasZone) ? 'block' : 'none';
    }
    if (_hudDurFillEl) {
      var pct = Math.max(0, Math.min(100, (_durability / MAX_DURABILITY) * 100));
      _hudDurFillEl.style.width = pct + '%';
      if (pct > 40) {
        _hudDurFillEl.style.background = 'linear-gradient(90deg,#ffaa00,#ffff00)';
      } else {
        _hudDurFillEl.style.background = 'linear-gradient(90deg,#ff4400,#ff8800)';
      }
    }
  }

  // ── Pickup mesh ───────────────────────────────────────────────────

  function _createPickupMesh(x, y, z) {
    var group = new THREE.Group();

    // flat cylinder as mask body
    var cylinderGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16);
    var cylinderMat = new THREE.MeshLambertMaterial({ color: 0x226622 });
    var cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    group.add(cylinder);

    // grey strap cross on top
    var strapMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var strap1Geo = new THREE.BoxGeometry(0.5, 0.02, 0.06);
    var strap1 = new THREE.Mesh(strap1Geo, strapMat);
    strap1.position.y = 0.05;
    group.add(strap1);

    var strap2Geo = new THREE.BoxGeometry(0.06, 0.02, 0.5);
    var strap2 = new THREE.Mesh(strap2Geo, strapMat);
    strap2.position.y = 0.05;
    group.add(strap2);

    // faint glow
    var light = new THREE.PointLight(0x44ff44, 0.6, 2);
    light.position.y = 0.3;
    group.add(light);

    group.position.set(x, y + 0.3, z);
    group._bobOffset = Math.random() * Math.PI * 2;

    if (_scene) _scene.add(group);
    return group;
  }

  // ── Audio ─────────────────────────────────────────────────────────

  function _playBreath() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, _audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start();
      osc.stop(_audioCtx.currentTime + 0.3);
    } catch (e) {
      // audio not available
    }
  }

  // ── Gas level check ───────────────────────────────────────────────

  function _isGasLevel(levelId) {
    for (var i = 0; i < GAS_LEVELS.length; i++) {
      if (GAS_LEVELS[i] === levelId) return true;
    }
    return false;
  }

  // ── In gas zone detection ─────────────────────────────────────────

  function _inGasZone() {
    // We infer gas zone from HazardZones internal state via the window flag
    // HazardZones sets window._hazardSlowFactor to < 1 only for GAS zones (slowFactor: 0.75)
    // We also check the filter on the renderer canvas for gas signature
    return (typeof HazardZones !== 'undefined' &&
            window._gasMaskZoneType === 'GAS');
  }

  // ── Public API ────────────────────────────────────────────────────

  function init(scene) {
    _scene = scene;
    _equipped = false;
    _available = false;
    _durability = MAX_DURABILITY;
    _pickups = [];
    _breathTimer = 0;
    window._gasMaskZoneType = null;

    if (!_hudEl) _createHUD();
    if (!_overlayEl) _createOverlay();
    _updateHUD(false);
  }

  function tryDrop(x, y, z, levelId) {
    if (!_isGasLevel(levelId)) return;
    if (Math.random() > DROP_CHANCE) return;

    var mesh = _createPickupMesh(x, y, z);
    _pickups.push({ mesh: mesh, x: x, z: z });
  }

  function update(delta, playerPos) {
    if (!playerPos) return;

    var t = performance.now() / 1000;

    // Animate pickups and check collection
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var p = _pickups[i];
      if (!p.mesh) continue;
      p.mesh.rotation.y += delta * 1.2;
      p.mesh.position.y = (p.mesh.userData.baseY || 0.3) + Math.sin(t * 2 + p.mesh._bobOffset) * 0.08;

      if (!p.mesh.userData.baseY) p.mesh.userData.baseY = 0.3;

      // collect check
      var dx = playerPos.x - p.mesh.position.x;
      var dz = playerPos.z - p.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < COLLECT_RADIUS) {
        _scene.remove(p.mesh);
        _pickups.splice(i, 1);
        _available = true;
        _durability = MAX_DURABILITY;
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('😷 GAS MASK picked up — press T to equip', '#44ff44');
        }
        _updateHUD(false);
      }
    }

    // Detect current zone type from HazardZones
    // HazardZones sets _hazardSlowFactor=0.75 for GAS, 1.0 for others
    // We need to distinguish GAS from FIRE/RADIATION which also use slowFactor=1.0
    // Best we can do: check canvas filter for gas pattern
    var currentZoneType = null;
    if (window._renderer && window._renderer.domElement) {
      var f = window._renderer.domElement.style.filter;
      if (f && f.indexOf('blur') !== -1 && f.indexOf('hue-rotate') !== -1) {
        currentZoneType = 'GAS';
      } else if (f && f.indexOf('hue-rotate(90deg)') !== -1) {
        currentZoneType = 'RADIATION';
      } else if (f && f.indexOf('sepia') !== -1) {
        currentZoneType = 'FIRE';
      }
    }
    window._gasMaskZoneType = currentZoneType;

    var inGas = (currentZoneType === 'GAS');

    // Durability drain when equipped + in gas zone
    if (_equipped && inGas) {
      _durability = Math.max(0, _durability - DRAIN_RATE * delta);
      if (_durability <= 0) {
        unequip();
        _available = false;
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('⚠ Gas mask depleted!', '#ffaa00');
        }
      }
    }

    // Breathing sound every 2s when equipped
    if (_equipped) {
      _breathTimer += delta;
      if (_breathTimer >= _breathInterval) {
        _breathTimer = 0;
        _playBreath();
      }
    }

    // Show/hide canvas overlay
    if (_overlayEl) {
      _overlayEl.style.display = _equipped ? 'block' : 'none';
    }

    // When equipped in gas zone, suppress the renderer canvas filter set by HazardZones
    if (_equipped && inGas && window._renderer && window._renderer.domElement) {
      window._renderer.domElement.style.filter = 'hue-rotate(80deg) saturate(1.2)';
    }

    _updateHUD(inGas);
  }

  function equip() {
    if (!_available) return;
    _equipped = true;
    _breathTimer = 0;
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('😷 Gas mask equipped', '#44ff44');
    }
  }

  function unequip() {
    _equipped = false;
    if (_overlayEl) _overlayEl.style.display = 'none';
    // restore normal filter in case we were in gas zone
    if (window._renderer && window._renderer.domElement) {
      window._renderer.domElement.style.filter = '';
    }
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('😷 Gas mask removed', '#888888');
    }
  }

  function isEquipped() {
    return _equipped;
  }

  function isAvailable() {
    return _available;
  }

  function setAvailable(bool) {
    _available = bool;
    if (!bool && _equipped) unequip();
    _updateHUD(false);
  }

  // Called from game-manager before applying gas damage
  // Returns true if damage should be blocked
  function interceptGasDamage() {
    return _equipped && (window._gasMaskZoneType === 'GAS');
  }

  function clear() {
    for (var i = 0; i < _pickups.length; i++) {
      if (_scene && _pickups[i].mesh) _scene.remove(_pickups[i].mesh);
    }
    _pickups = [];
    if (_equipped) unequip();
    _available = false;
    _durability = MAX_DURABILITY;
    window._gasMaskZoneType = null;
    _updateHUD(false);
  }

  function reset() {
    clear();
  }

  return {
    init: init,
    update: update,
    equip: equip,
    unequip: unequip,
    isEquipped: isEquipped,
    isAvailable: isAvailable,
    setAvailable: setAvailable,
    interceptGasDamage: interceptGasDamage,
    tryDrop: tryDrop,
    clear: clear,
    reset: reset,
  };
})();
