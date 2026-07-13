/* night-assault.js — Night assault mode system for Three.js FPS game */
window.NightAssault = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────────
  var _active = false;
  var _scene = null;
  var _renderer = null;
  var _camera = null;

  var _originalAmbientIntensity = 1.0;
  var _originalFogDensity = 0.0;
  var _originalBg = null;
  var _ambientLight = null;

  var _searchlights = [];
  var _buildingLights = [];
  var _flares = [];
  var _muzzleFlashTimeout = null;

  var _nightStartTime = 0;
  var _dawnActive = false;
  var _dawnStartTime = 0;
  var _dawnDuration = 30000; // 30s in ms
  var _nightDuration = 120000; // 2 minutes

  var _hudOverlay = null;
  var _hudDawnText = null;
  var _hudVisible = false;

  var _keyHandlerBound = false;
  var _lastFireTime = 0;
  var _flareKey = false;

  // ── HUD helpers ──────────────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudOverlay) return;

    _hudOverlay = document.createElement('div');
    _hudOverlay.id = 'night-assault-hud';
    _hudOverlay.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00cfff',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'letter-spacing:4px',
      'text-shadow:0 0 12px #00cfff,0 0 24px #005577',
      'opacity:0',
      'transition:opacity 1.2s ease',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'user-select:none'
    ].join(';');
    _hudOverlay.textContent = 'NIGHT ASSAULT MODE';
    document.body.appendChild(_hudOverlay);

    _hudDawnText = document.createElement('div');
    _hudDawnText.id = 'night-assault-dawn-hud';
    _hudDawnText.style.cssText = [
      'position:fixed',
      'top:90px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffcc44',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'letter-spacing:3px',
      'text-shadow:0 0 8px #ffaa00',
      'opacity:0',
      'transition:opacity 1.5s ease',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'user-select:none'
    ].join(';');
    _hudDawnText.textContent = 'DAWN APPROACHING';
    document.body.appendChild(_hudDawnText);
  }

  function _showHUD() {
    if (!_hudOverlay) _createHUD();
    // Force reflow so transition fires
    void _hudOverlay.offsetWidth;
    _hudOverlay.style.opacity = '1';
    _hudVisible = true;
  }

  function _hideHUD() {
    if (_hudOverlay) _hudOverlay.style.opacity = '0';
    if (_hudDawnText) _hudDawnText.style.opacity = '0';
    _hudVisible = false;
  }

  function _showDawnHUD() {
    if (!_hudDawnText) _createHUD();
    void _hudDawnText.offsetWidth;
    _hudDawnText.style.opacity = '1';
  }

  // ── Searchlight tower ────────────────────────────────────────────────────────
  function _spawnSearchlight(x, z) {
    if (!_scene) return null;

    var THREE = window.THREE;
    if (!THREE) return null;

    // Tower cylinder
    var towerGeo = new THREE.CylinderGeometry(0.4, 0.6, 12, 8);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(x, 6, z);
    _scene.add(tower);

    // SpotLight at tower top
    var spot = new THREE.SpotLight(0xffffff, 0.8);
    spot.angle = 0.3;
    spot.distance = 40;
    spot.penumbra = 0.15;
    spot.position.set(x, 12, z);
    _scene.add(spot);

    // Target object for spotlight direction
    var target = new THREE.Object3D();
    target.position.set(x + 10, 0, z);
    _scene.add(target);
    spot.target = target;

    var sl = {
      tower: tower,
      spot: spot,
      target: target,
      baseAngle: Math.atan2(z, x),
      sweepRange: Math.PI / 4, // 45 degrees
      sweepSpeed: 0.3,         // rad/s
      phase: Math.random() * Math.PI * 2,
      originX: x,
      originZ: z
    };

    _searchlights.push(sl);
    return sl;
  }

  function _spawnAllSearchlights() {
    // 4 searchlights at scene edges (±40m)
    _spawnSearchlight(40, 0);
    _spawnSearchlight(-40, 0);
    _spawnSearchlight(0, 40);
    _spawnSearchlight(0, -40);
  }

  function _removeSearchlights() {
    for (var i = 0; i < _searchlights.length; i++) {
      var sl = _searchlights[i];
      if (_scene) {
        _scene.remove(sl.tower);
        _scene.remove(sl.spot);
        _scene.remove(sl.target);
      }
      if (sl.tower.geometry) sl.tower.geometry.dispose();
      if (sl.tower.material) sl.tower.material.dispose();
    }
    _searchlights = [];
  }

  function _updateSearchlights(dt) {
    for (var i = 0; i < _searchlights.length; i++) {
      var sl = _searchlights[i];
      sl.phase += sl.sweepSpeed * dt;
      var angle = sl.baseAngle + Math.sin(sl.phase) * sl.sweepRange;
      var radius = 30;
      sl.target.position.set(
        sl.originX + Math.cos(angle) * radius,
        0,
        sl.originZ + Math.sin(angle) * radius
      );
    }
  }

  // ── Building lights ──────────────────────────────────────────────────────────
  function _spawnBuildingLights() {
    if (!_scene) return;
    var THREE = window.THREE;
    if (!THREE) return;

    for (var i = 0; i < 8; i++) {
      var px = (Math.random() - 0.5) * 60;
      var py = 2 + Math.random() * 8;
      var pz = (Math.random() - 0.5) * 60;

      var pl = new THREE.PointLight(0xffdd44, 0.6, 15);
      pl.position.set(px, py, pz);
      _scene.add(pl);
      _buildingLights.push(pl);
    }
  }

  function _removeBuildingLights() {
    for (var i = 0; i < _buildingLights.length; i++) {
      if (_scene) _scene.remove(_buildingLights[i]);
    }
    _buildingLights = [];
  }

  // ── Muzzle flash ─────────────────────────────────────────────────────────────
  function _createMuzzleFlash(position) {
    if (!_active || !_scene) return;
    var THREE = window.THREE;
    if (!THREE) return;

    var flash = new THREE.PointLight(0xff8800, 1.5, 8, 2);
    flash.position.copy(position || new THREE.Vector3(0, 1.5, 0));
    _scene.add(flash);

    setTimeout(function () {
      if (_scene) _scene.remove(flash);
    }, 50);
  }

  // ── Flare system ─────────────────────────────────────────────────────────────
  function _fireFlare() {
    if (!_active || !_scene) return;
    var THREE = window.THREE;
    if (!THREE) return;

    var playerPos = (window._playerPosition) || new THREE.Vector3(0, 1.5, 0);

    // Flare projectile mesh
    var geo = new THREE.SphereGeometry(0.15, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(playerPos);
    mesh.position.y += 1.5;
    _scene.add(mesh);

    // Illumination light (deployed later)
    var light = new THREE.PointLight(0xfff8e0, 2.0, 40);
    light.visible = false;
    light.position.copy(mesh.position);
    _scene.add(light);

    var flare = {
      mesh: mesh,
      light: light,
      phase: 'arc',   // arc → parachute → expire
      velY: 18,       // initial upward velocity
      velX: (Math.random() - 0.5) * 4,
      velZ: (Math.random() - 0.5) * 4,
      arcTarget: mesh.position.y + 20,
      descentSpeed: 0.3,
      life: 12.0,     // seconds after parachute deploys
      elapsed: 0,
      active: true,
      lit: false
    };

    _flares.push(flare);
  }

  function _updateFlares(dt) {
    var THREE = window.THREE;
    if (!THREE) return;

    for (var i = _flares.length - 1; i >= 0; i--) {
      var f = _flares[i];
      if (!f.active) {
        _cleanupFlare(f);
        _flares.splice(i, 1);
        continue;
      }

      if (f.phase === 'arc') {
        // Rise phase
        f.mesh.position.x += f.velX * dt;
        f.mesh.position.z += f.velZ * dt;
        f.mesh.position.y += f.velY * dt;
        f.velY -= 14 * dt; // gravity

        if (f.mesh.position.y >= f.arcTarget || f.velY <= 0) {
          // Switch to parachute phase
          f.phase = 'parachute';
          f.light.position.copy(f.mesh.position);
          f.light.visible = true;
          f.lit = true;
        }
      } else if (f.phase === 'parachute') {
        f.elapsed += dt;
        f.mesh.position.y -= f.descentSpeed * dt;
        f.light.position.copy(f.mesh.position);

        // Gentle sway
        f.mesh.position.x += Math.sin(f.elapsed * 1.2) * 0.02;

        if (f.elapsed >= f.life) {
          f.active = false;
        }
      }
    }
  }

  function _cleanupFlare(f) {
    if (_scene) {
      _scene.remove(f.mesh);
      _scene.remove(f.light);
    }
    if (f.mesh.geometry) f.mesh.geometry.dispose();
    if (f.mesh.material) f.mesh.material.dispose();
  }

  function _removeAllFlares() {
    for (var i = 0; i < _flares.length; i++) {
      _cleanupFlare(_flares[i]);
    }
    _flares = [];
  }

  // ── Thermal detection ────────────────────────────────────────────────────────
  function _isThermalDetectable(enemyPosition) {
    if (!_active) return true; // normal detection when not in night mode

    var THREE = window.THREE;
    var playerPos = window._playerPosition;
    if (!playerPos || !THREE) return false;

    var dist = playerPos.distanceTo(enemyPosition);
    var playerMoving = !!window._playerMoving;
    var justFired = (Date.now() - _lastFireTime) < 500;

    // Check if player is in a lit flare area
    var inFlareLight = false;
    for (var i = 0; i < _flares.length; i++) {
      var f = _flares[i];
      if (f.lit && f.active) {
        var flareDist = playerPos.distanceTo(f.light.position);
        if (flareDist < 40) {
          inFlareLight = true;
          break;
        }
      }
    }

    if (inFlareLight) {
      // Full detection range in lit area
      return dist < 50;
    }

    // Reduced detection: 30% of normal (70% reduction)
    var reducedRange = 50 * 0.30;

    if (dist <= 12 && (playerMoving || justFired)) {
      return true;
    }
    if (justFired) {
      return dist < reducedRange;
    }
    return false;
  }

  // ── Suppression detection multiplier ────────────────────────────────────────
  function _applySuppressionMult() {
    if (!_active) return;
    if (typeof window._suppressionDetectMult !== 'undefined') {
      window._suppressionDetectMult = window._suppressionDetectMult * 0.3;
    }
  }

  // ── Scene setup / teardown ───────────────────────────────────────────────────
  function _applyNightSettings() {
    if (!_scene) return;
    var THREE = window.THREE;
    if (!THREE) return;

    // Find and dim ambient light
    _scene.traverse(function (obj) {
      if (obj.isAmbientLight && !_ambientLight) {
        _ambientLight = obj;
        _originalAmbientIntensity = obj.intensity;
        obj.intensity = 0.05;
      }
    });

    // Fog
    if (_scene.fog) {
      _originalFogDensity = _scene.fog.density || 0;
      _scene.fog.density = 0.08;
    } else {
      _scene.fog = new THREE.FogExp2(0x020208, 0.08);
    }

    // Background
    if (_renderer) {
      _originalBg = _renderer.getClearColor
        ? _renderer.getClearColor(new THREE.Color()).getHex()
        : 0x000000;
      _renderer.setClearColor(0x020208);
    }
  }

  function _restoreNightSettings() {
    if (_ambientLight) {
      _ambientLight.intensity = _originalAmbientIntensity;
      _ambientLight = null;
    }
    if (_scene && _scene.fog) {
      _scene.fog.density = _originalFogDensity;
    }
    if (_renderer) {
      _renderer.setClearColor(_originalBg || 0x87ceeb);
    }
  }

  // ── Key handler ──────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    // Night toggle: N (if not taken) or Ctrl+Shift+N
    var key = e.key || '';
    var code = e.code || '';

    var isCtrlShiftN = (e.ctrlKey && e.shiftKey && (key === 'N' || key === 'n'));
    var isN = (!e.ctrlKey && !e.shiftKey && !e.altKey && (key === 'n' || key === 'N'));

    if (isN || isCtrlShiftN) {
      if (_active) {
        // Don't toggle off during dawn — let dawn play out, but allow force reset
        reset();
      } else {
        enableNight();
      }
      return;
    }

    // Alt+F — fire flare
    if (e.altKey && (key === 'f' || key === 'F')) {
      if (_active) {
        e.preventDefault();
        _fireFlare();
      }
    }
  }

  function _bindKeys() {
    if (_keyHandlerBound) return;
    window.addEventListener('keydown', _onKeyDown, false);
    _keyHandlerBound = true;
  }

  // ── Dawn transition ──────────────────────────────────────────────────────────
  function enableDawn() {
    if (!_active || _dawnActive) return;
    _dawnActive = true;
    _dawnStartTime = Date.now();
    _showDawnHUD();
  }

  function _updateDawn(now) {
    if (!_dawnActive || !_ambientLight) return;

    var elapsed = now - _dawnStartTime;
    var t = Math.min(elapsed / _dawnDuration, 1.0);

    // Lerp ambient 0.05 → original
    _ambientLight.intensity = 0.05 + (_originalAmbientIntensity - 0.05) * t;

    // Lerp fog density back
    if (_scene && _scene.fog) {
      _scene.fog.density = 0.08 * (1 - t) + _originalFogDensity * t;
    }

    if (t >= 1.0) {
      // Dawn complete — full reset
      _dawnActive = false;
      _active = false;
      _hideHUD();
      _restoreNightSettings();
      _removeSearchlights();
      _removeBuildingLights();
      _removeAllFlares();
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  function init(scene, renderer, camera) {
    _scene = scene || null;
    _renderer = renderer || null;
    _camera = camera || null;

    // Try to grab from window globals if not passed directly
    if (!_scene && window._scene) _scene = window._scene;
    if (!_renderer && window._renderer) _renderer = window._renderer;
    if (!_camera && window._camera) _camera = window._camera;

    _createHUD();
    _bindKeys();

    // Expose muzzle flash so weapon system can call it
    window._nightAssaultMuzzleFlash = _createMuzzleFlash;
    window._nightAssaultThermalCheck = _isThermalDetectable;
  }

  function enableNight() {
    if (_active) return;
    _active = true;
    _nightStartTime = Date.now();
    _dawnActive = false;

    // Re-grab scene/renderer from globals in case init was called before they existed
    if (!_scene && window._scene) _scene = window._scene;
    if (!_renderer && window._renderer) _renderer = window._renderer;

    _applyNightSettings();
    _spawnAllSearchlights();
    _spawnBuildingLights();
    _applySuppressionMult();
    _showHUD();
  }

  function update(dt) {
    if (!_active) return;

    var now = Date.now();

    // Auto-trigger dawn after 2 minutes
    if (!_dawnActive && (now - _nightStartTime) >= _nightDuration) {
      enableDawn();
    }

    _updateSearchlights(dt);
    _updateFlares(dt);

    if (_dawnActive) {
      _updateDawn(now);
    }

    // Continuously apply suppression mult if window value was reset externally
    if (typeof window._suppressionDetectMult !== 'undefined') {
      // Only clamp if it's been set higher than 0.3 factor — re-apply silhouette penalty
      // (We don't re-apply every frame aggressively; the initial set handles it)
    }
  }

  function reset() {
    _active = false;
    _dawnActive = false;
    _hideHUD();
    _restoreNightSettings();
    _removeSearchlights();
    _removeBuildingLights();
    _removeAllFlares();
  }

  return {
    init: init,
    update: update,
    enableNight: enableNight,
    enableDawn: enableDawn,
    reset: reset
  };
})();
