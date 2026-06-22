window.HazardZones = (function() {
  'use strict';

  var _scene = null;
  var _zones = [];
  var _playerInZone = null;
  var _warningEl = null;

  var ZONE_TYPES = {
    RADIATION: {
      id: 'RADIATION',
      color: 0x33ff44,
      opacity: 0.12,
      particleColor: 0x44ff44,
      dps: 3,
      slowFactor: 1.0,
      blurAmount: 0,
      warningText: '☢ RADIATION ZONE — Take cover!',
      warningColor: '#44ff44',
      hudFilter: 'hue-rotate(90deg) saturate(1.5)',
    },
    FIRE: {
      id: 'FIRE',
      color: 0xff4400,
      opacity: 0.18,
      particleColor: 0xff6600,
      dps: 8,
      slowFactor: 1.0,
      blurAmount: 0,
      warningText: '🔥 FIRE ZONE — Move fast!',
      warningColor: '#ff6600',
      hudFilter: 'sepia(0.5) saturate(2)',
    },
    GAS: {
      id: 'GAS',
      color: 0xaaff00,
      opacity: 0.15,
      particleColor: 0x88ff00,
      dps: 2,
      slowFactor: 0.75,
      blurAmount: 3,
      warningText: '☣ GAS ZONE — Blinded!',
      warningColor: '#aaff00',
      hudFilter: 'blur(2px) hue-rotate(60deg)',
    },
  };

  function createZone(type, x, z, radius, levelId) {
    if (!_scene) return;
    var zoneType = ZONE_TYPES[type];
    if (!zoneType) return;

    var geo = new THREE.CylinderGeometry(radius, radius, 0.3, 24, 1, false);
    var mat = new THREE.MeshLambertMaterial({
      color: zoneType.color,
      transparent: true,
      opacity: zoneType.opacity,
      depthWrite: false,
    });
    var mesh = new THREE.Mesh(geo, mat);
    var h = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
      ? VoxelWorld.getTerrainHeight(x, z) + 0.15
      : 0.15;
    mesh.position.set(x, h, z);
    _scene.add(mesh);

    var light = new THREE.PointLight(zoneType.color, 0.8, radius * 2);
    light.position.set(x, h + 1, z);
    _scene.add(light);

    _zones.push({
      type: type,
      x: x, z: z, radius: radius,
      mesh: mesh, light: light,
      levelId: levelId,
      dps: zoneType.dps,
      slowFactor: zoneType.slowFactor,
      blurAmount: zoneType.blurAmount,
      warningText: zoneType.warningText,
      warningColor: zoneType.warningColor,
      hudFilter: zoneType.hudFilter,
    });
  }

  function update(delta, playerPos, playerRef) {
    if (!playerPos || !_zones.length) return;

    var inZone = null;
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      var dx = playerPos.x - z.x;
      var dz = playerPos.z - z.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < z.radius) { inZone = z; break; }
    }

    if (inZone) {
      if (playerRef && playerRef.hp !== undefined) {
        playerRef.hp = Math.max(1, playerRef.hp - inZone.dps * delta);
        playerRef.lastDamageTime = 0;
      }

      if (!_warningEl) _createWarning();
      if (_warningEl) {
        _warningEl.textContent = inZone.warningText;
        _warningEl.style.color = inZone.warningColor;
        _warningEl.style.borderColor = inZone.warningColor;
        _warningEl.style.display = 'block';
      }

      if (window._renderer && window._renderer.domElement) {
        window._renderer.domElement.style.filter = inZone.hudFilter;
      }

      window._hazardSlowFactor = inZone.slowFactor;

      _playerInZone = inZone;
    } else {
      if (_playerInZone) {
        if (_warningEl) _warningEl.style.display = 'none';
        if (window._renderer && window._renderer.domElement) {
          window._renderer.domElement.style.filter = '';
        }
        window._hazardSlowFactor = 1.0;
        _playerInZone = null;
      }
    }

    var t = performance.now() / 1000;
    for (var j = 0; j < _zones.length; j++) {
      if (_zones[j].light) {
        _zones[j].light.intensity = 0.4 + 0.4 * Math.sin(t * 2 + j);
      }
    }
  }

  function _createWarning() {
    _warningEl = document.createElement('div');
    _warningEl.id = 'hazard-warning';
    _warningEl.style.cssText = [
      'position:fixed;top:35%;left:50%;transform:translateX(-50%);',
      'font-family:monospace;font-size:16px;font-weight:bold;',
      'padding:8px 20px;',
      'background:rgba(0,0,0,0.7);',
      'border:2px solid #44ff44;',
      'border-radius:4px;',
      'z-index:5000;pointer-events:none;',
      'display:none;',
    ].join('');
    document.body.appendChild(_warningEl);
  }

  function setupForLevel(levelId) {
    clear();

    // Stage 7 — CHORNOBYL ZONE: radiation zones around reactor
    if (levelId === 7 || levelId === 'CHORNOBYL' || levelId === 'SLAVUTYCH') {
      createZone('RADIATION', 15, 15, 8, levelId);
      createZone('RADIATION', -20, -10, 6, levelId);
      createZone('RADIATION', 5, -25, 5, levelId);
    }

    // ENERGODAR — radiation leak around nuclear towers (no numeric id in current stages)
    if (levelId === 'ENERGODAR') {
      createZone('RADIATION', 0, -20, 10, levelId);
      createZone('RADIATION', 20, 10, 7, levelId);
    }

    // Stage 3 — BAKHMUT RUINS: fire zones from burning buildings
    // Stage 10 — DONBAS FINAL PUSH: fire zones (industrial fires)
    if (levelId === 3 || levelId === 'BAKHMUT' || levelId === 10 || levelId === 'SEVERODONETSK_AZOT') {
      createZone('FIRE', -12, 8, 6, levelId);
      createZone('FIRE', 18, -15, 5, levelId);
      createZone('FIRE', 0, 20, 7, levelId);
    }

    // Stage 5 — MARIUPOL STEELWORKS: fire zones from theater/steelworks bombing
    if (levelId === 5 || levelId === 'MARIUPOL_DRAMA') {
      createZone('FIRE', -8, -5, 8, levelId);
      createZone('FIRE', 12, 10, 5, levelId);
    }

    // Stage 12 — KREMLIN SHOWDOWN: gas zones (tear gas deployed)
    // Stage 8 — OUTER MOSCOW: gas zones
    if (levelId === 12 || levelId === 'KREMLIN' || levelId === 8 || levelId === 'MOSCOW') {
      createZone('GAS', -15, 20, 6, levelId);
      createZone('GAS', 20, -15, 5, levelId);
    }

    // TORETSK — gas pocket in mine tunnels (no numeric id in current stages)
    if (levelId === 'TORETSK') {
      createZone('GAS', 0, 0, 8, levelId);
      createZone('GAS', 15, -10, 5, levelId);
    }
  }

  function clear() {
    for (var i = 0; i < _zones.length; i++) {
      if (_scene) {
        if (_zones[i].mesh) _scene.remove(_zones[i].mesh);
        if (_zones[i].light) _scene.remove(_zones[i].light);
      }
    }
    _zones = [];
    if (_warningEl) _warningEl.style.display = 'none';
    window._hazardSlowFactor = 1.0;
  }

  function init(scene) {
    _scene = scene;
    window._hazardSlowFactor = 1.0;
  }

  return {
    init: init,
    setupForLevel: setupForLevel,
    update: update,
    clear: clear,
    createZone: createZone,
    ZONE_TYPES: ZONE_TYPES,
  };
})();
