/**
 * hot-zones.js — Score Multiplier Hot Zones for OccupantKiller
 * Circular areas on the map where kills earn bonus score multipliers.
 * Encourages aggressive play in specific areas rather than corner camping.
 *
 * API: HotZones.init(scene, camera), .update(delta, playerPos),
 *      .spawnZones(count), .isPlayerInZone(), .getMultiplier(), .reset()
 *
 * Globals set: window._hotZoneMultiplier, window._hotZonePositions
 * All var, IIFE pattern, no let/const.
 */

window.HotZones = (function () {
  'use strict';

  // ── Zone type definitions ────────────────────────────────────────────────
  var ZONE_TYPES = {
    CONTESTED_GROUND: { multiplier: 1.5, color: 0xFFAA00, icon: '⚔', name: 'CONTESTED GROUND' },
    HIGH_VALUE_AREA:  { multiplier: 2.0, color: 0xFF6600, icon: '★', name: 'HIGH VALUE AREA' },
    CHOKEPOINT:       { multiplier: 2.5, color: 0xFF0000, icon: '⚡', name: 'HOT ZONE' },
    EXTRACTION:       { multiplier: 0.5, color: 0x00FF44, icon: '🚁', name: 'SAFE ZONE' }
  };

  // Ordered list for random selection (weighted toward combat zones)
  var ZONE_TYPE_KEYS = ['CONTESTED_GROUND', 'HIGH_VALUE_AREA', 'CHOKEPOINT', 'EXTRACTION'];

  // ── Module state ─────────────────────────────────────────────────────────
  var _scene         = null;
  var _camera        = null;
  var _zones         = [];          // active zone objects
  var _initialized   = false;
  var _time          = 0;

  // DOM elements
  var _hudEl         = null;        // zone HUD bottom bar
  var _minimapEl     = null;        // minimap dot container
  var _minimapDots   = [];          // DOM divs for minimap dots
  var _labelEls      = [];          // floating 3D->2D labels

  // Player state
  var _playerInZones = [];          // zones the player is currently inside
  var _prevMultiplier = 1.0;

  // Zone rotation / cycling
  var _zoneCycleTimer = 0;
  var ZONE_CYCLE_INTERVAL = 60;     // seconds before a zone moves
  var ZONE_FADE_DURATION  = 3;      // seconds for fade transition

  // AudioContext for entry cue
  var _audioCtx = null;

  // ── Internal helpers ─────────────────────────────────────────────────────

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _randInt(min, max) {
    return Math.floor(_rand(min, max + 1));
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _hexToCSS(hex) {
    return '#' + ('000000' + hex.toString(16)).slice(-6);
  }

  // Clamp a number between lo and hi
  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ── AudioContext zone-entry cue (two ascending tones) ───────────────────

  function _ensureAudio() {
    if (_audioCtx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      _audioCtx = new AC();
      return true;
    } catch (e) {
      return false;
    }
  }

  function _playEntryCue(multiplier) {
    if (!_ensureAudio()) return;
    var t = _audioCtx.currentTime;
    var freqA = multiplier >= 2.0 ? 660 : 440;
    var freqB = multiplier >= 2.0 ? 880 : 550;

    var oscA = _audioCtx.createOscillator();
    var gainA = _audioCtx.createGain();
    oscA.type = 'sine';
    oscA.frequency.value = freqA;
    gainA.gain.setValueAtTime(0.18, t);
    gainA.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    oscA.connect(gainA);
    gainA.connect(_audioCtx.destination);
    oscA.start(t);
    oscA.stop(t + 0.25);

    var oscB = _audioCtx.createOscillator();
    var gainB = _audioCtx.createGain();
    oscB.type = 'sine';
    oscB.frequency.value = freqB;
    gainB.gain.setValueAtTime(0.0, t + 0.2);
    gainB.gain.linearRampToValueAtTime(0.18, t + 0.3);
    gainB.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    oscB.connect(gainB);
    gainB.connect(_audioCtx.destination);
    oscB.start(t + 0.2);
    oscB.stop(t + 0.5);
  }

  // ── Three.js mesh helpers ────────────────────────────────────────────────

  function _getGroundY(x, z) {
    return (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
      ? VoxelWorld.getTerrainHeight(x, z) + 0.05
      : 0.05;
  }

  function _buildRingMesh(radius, color) {
    var geo = new THREE.RingGeometry(radius - 0.3, radius, 32);
    // Rotate flat on ground (RingGeometry is in XY plane by default)
    geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    return new THREE.Mesh(geo, mat);
  }

  function _buildFillMesh(radius, color) {
    var geo = new THREE.CircleGeometry(radius - 0.3, 32);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    return new THREE.Mesh(geo, mat);
  }

  // ── DOM label (floating 3D-projected) ───────────────────────────────────

  function _buildLabel(zone) {
    if (typeof document === 'undefined') return null;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'z-index:280',
      'font-family:monospace',
      'font-size:11px',
      'font-weight:bold',
      'text-align:center',
      'line-height:1.4',
      'padding:3px 8px',
      'border-radius:4px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid ' + _hexToCSS(zone.typeData.color),
      'color:' + _hexToCSS(zone.typeData.color),
      'text-shadow:0 0 6px ' + _hexToCSS(zone.typeData.color),
      'white-space:nowrap',
      'transition:transform 0.2s',
      'display:none'
    ].join(';');
    el.innerHTML = zone.typeData.icon + ' ' + zone.typeData.name +
      '<br>x' + zone.typeData.multiplier.toFixed(1) + ' KILLS';
    document.body.appendChild(el);
    return el;
  }

  function _updateLabelPosition(zone) {
    if (!zone.labelEl || !_camera) return;
    // Project zone center (elevated) into screen space
    var worldPos = new THREE.Vector3(zone.x, zone.y + 4, zone.z);
    worldPos.project(_camera);
    // worldPos.x/y are now in NDC [-1, 1]
    if (worldPos.z > 1) {
      // behind camera
      zone.labelEl.style.display = 'none';
      return;
    }
    var hw = window.innerWidth / 2;
    var hh = window.innerHeight / 2;
    var sx = (worldPos.x  + 1) * hw;
    var sy = (-worldPos.y + 1) * hh;
    // Hide if off-screen
    if (sx < -80 || sx > window.innerWidth + 80 || sy < -40 || sy > window.innerHeight + 40) {
      zone.labelEl.style.display = 'none';
      return;
    }
    zone.labelEl.style.display = 'block';
    zone.labelEl.style.left = Math.round(sx - zone.labelEl.offsetWidth / 2) + 'px';
    zone.labelEl.style.top  = Math.round(sy) + 'px';
  }

  // ── Minimap dots ─────────────────────────────────────────────────────────

  function _buildMinimapDot(zone) {
    if (typeof document === 'undefined') return null;
    var dot = document.createElement('div');
    dot.style.cssText = [
      'position:fixed',
      'width:10px',
      'height:10px',
      'border-radius:50%',
      'background:' + _hexToCSS(zone.typeData.color),
      'box-shadow:0 0 6px ' + _hexToCSS(zone.typeData.color),
      'border:1px solid rgba(255,255,255,0.3)',
      'pointer-events:none',
      'z-index:281',
      'display:none'
    ].join(';');
    document.body.appendChild(dot);
    return dot;
  }

  function _updateMinimapDot(zone) {
    if (!zone.minimapDot) return;
    // Try to position relative to the minimap canvas
    var mm = document.getElementById('minimap-canvas');
    if (!mm) {
      zone.minimapDot.style.display = 'none';
      return;
    }
    var rect = mm.getBoundingClientRect();
    // Map world coordinates to minimap pixel position
    // Minimap is 180x180, world range roughly ±40 units
    var WORLD_RANGE = 40;
    var mmW = rect.width;
    var mmH = rect.height;
    var nx = (zone.x / WORLD_RANGE) * 0.5 + 0.5;  // 0..1
    var nz = (zone.z / WORLD_RANGE) * 0.5 + 0.5;  // 0..1
    var px = rect.left + nx * mmW - 5;
    var py = rect.top  + nz * mmH - 5;
    zone.minimapDot.style.display = 'block';
    zone.minimapDot.style.left = Math.round(px) + 'px';
    zone.minimapDot.style.top  = Math.round(py) + 'px';
    zone.minimapDot.style.opacity = zone.fadeOpacity.toFixed(2);
  }

  // ── HUD bottom bar ───────────────────────────────────────────────────────

  function _ensureHUD() {
    if (typeof document === 'undefined') return;
    if (_hudEl && _hudEl.parentNode) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'hot-zone-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:195px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'color:#ffaa00',
      'text-shadow:0 0 8px #ffaa00',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid #ffaa00',
      'padding:4px 16px',
      'border-radius:5px',
      'z-index:280',
      'pointer-events:none',
      'display:none',
      'text-align:center',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _showHUD(zone) {
    if (!_hudEl) return;
    var cssColor = _hexToCSS(zone.typeData.color);
    _hudEl.style.color = cssColor;
    _hudEl.style.borderColor = cssColor;
    _hudEl.style.textShadow = '0 0 8px ' + cssColor;
    _hudEl.innerHTML =
      zone.typeData.icon + ' ' + zone.typeData.name +
      ' — x' + zone.typeData.multiplier.toFixed(1) + ' KILL BONUS';
    _hudEl.style.display = 'block';
  }

  function _showZoneCountHUD(inCount, total) {
    // Also append zone count info line if inside a zone
    // This is handled in update() alongside _showHUD
  }

  function _hideHUD() {
    if (_hudEl) _hudEl.style.display = 'none';
  }

  // ── Flash banner (transient message) ────────────────────────────────────

  function _flashBanner(text, color, duration) {
    if (typeof document === 'undefined') return;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:28%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:' + (color || '#ffaa00'),
      'text-shadow:0 0 12px ' + (color || '#ffaa00') + ',0 2px 4px #000',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 20px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:500',
      'letter-spacing:2px',
      'white-space:nowrap',
      'opacity:1',
      'transition:opacity 0.3s'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    var life = duration || 2000;
    var fadeStart = life - 400;
    var born = Date.now();
    var iv = setInterval(function () {
      var age = Date.now() - born;
      if (age >= fadeStart) {
        el.style.opacity = Math.max(0, 1 - (age - fadeStart) / 400);
      }
      if (age >= life) {
        clearInterval(iv);
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    }, 30);
  }

  // ── Label scale pop animation ────────────────────────────────────────────

  function _popLabel(labelEl) {
    if (!labelEl) return;
    labelEl.style.transform = 'scale(1.5)';
    setTimeout(function () {
      if (labelEl) labelEl.style.transform = 'scale(1)';
    }, 250);
  }

  // ── Zone creation ────────────────────────────────────────────────────────

  function _makeZone(typeKey, x, z, index) {
    var typeData = ZONE_TYPES[typeKey];
    var radius = _rand(5, 8);
    var y = _getGroundY(x, z);

    var ringMesh = _buildRingMesh(radius, typeData.color);
    ringMesh.position.set(x, y, z);
    if (_scene) _scene.add(ringMesh);

    var fillMesh = _buildFillMesh(radius, typeData.color);
    fillMesh.position.set(x, y, z);
    if (_scene) _scene.add(fillMesh);

    var zone = {
      typeKey:     typeKey,
      typeData:    typeData,
      x:           x,
      y:           y,
      z:           z,
      radius:      radius,
      index:       index,
      ringMesh:    ringMesh,
      fillMesh:    fillMesh,
      labelEl:     null,
      minimapDot:  null,
      cycleTimer:  _rand(0, ZONE_CYCLE_INTERVAL), // stagger timers
      fadeOpacity: 1.0,
      fading:      false,
      fadeDir:     0,           // -1 = fading out, +1 = fading in
      fadeTimer:   0,
      // highlighted state (player inside)
      highlighted: false
    };

    zone.labelEl    = _buildLabel(zone);
    zone.minimapDot = _buildMinimapDot(zone);

    return zone;
  }

  // Find a spawn position that doesn't overlap existing zones (min 8 units apart)
  function _findSpawnPos(existingZones) {
    var tries = 0;
    var MAX_TRIES = 30;
    var MIN_DIST = 8;
    while (tries < MAX_TRIES) {
      var x = _rand(-20, 20);
      var z = _rand(-20, 20);
      var ok = true;
      for (var i = 0; i < existingZones.length; i++) {
        if (_dist2D(x, z, existingZones[i].x, existingZones[i].z) < MIN_DIST) {
          ok = false;
          break;
        }
      }
      if (ok) return { x: x, z: z };
      tries++;
    }
    // Fallback if we can't find a clean position
    return { x: _rand(-20, 20), z: _rand(-20, 20) };
  }

  // ── Zone removal ─────────────────────────────────────────────────────────

  function _removeZoneMeshes(zone) {
    if (_scene) {
      if (zone.ringMesh) _scene.remove(zone.ringMesh);
      if (zone.fillMesh) _scene.remove(zone.fillMesh);
    }
    if (zone.ringMesh && zone.ringMesh.geometry) zone.ringMesh.geometry.dispose();
    if (zone.ringMesh && zone.ringMesh.material) zone.ringMesh.material.dispose();
    if (zone.fillMesh && zone.fillMesh.geometry) zone.fillMesh.geometry.dispose();
    if (zone.fillMesh && zone.fillMesh.material) zone.fillMesh.material.dispose();
    zone.ringMesh = null;
    zone.fillMesh = null;
  }

  function _removeZoneDOM(zone) {
    if (zone.labelEl && zone.labelEl.parentNode) zone.labelEl.parentNode.removeChild(zone.labelEl);
    zone.labelEl = null;
    if (zone.minimapDot && zone.minimapDot.parentNode) zone.minimapDot.parentNode.removeChild(zone.minimapDot);
    zone.minimapDot = null;
  }

  // ── Update the global state arrays ──────────────────────────────────────

  function _syncGlobals() {
    window._hotZonePositions = [];
    for (var i = 0; i < _zones.length; i++) {
      window._hotZonePositions.push({
        x: _zones[i].x,
        y: _zones[i].y,
        z: _zones[i].z,
        multiplier: _zones[i].typeData.multiplier,
        radius: _zones[i].radius
      });
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * init(scene, camera) — call once after Three.js scene is ready.
   */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    window._hotZoneMultiplier  = 1.0;
    window._hotZonePositions   = [];

    _ensureHUD();
    _initialized = true;
  }

  /**
   * spawnZones(count) — spawn 2–3 zones for the current wave/level.
   * Clears existing zones first.
   */
  function spawnZones(count) {
    reset();
    _ensureHUD();

    var n = count || _randInt(2, 3);
    var typeKeys = ZONE_TYPE_KEYS.slice();

    for (var i = 0; i < n; i++) {
      // Pick a random type (but no two of the same type in a row)
      var typeIndex = _randInt(0, typeKeys.length - 1);
      var typeKey = typeKeys[typeIndex];

      var pos = _findSpawnPos(_zones);
      var zone = _makeZone(typeKey, pos.x, pos.z, i);
      _zones.push(zone);
    }

    _syncGlobals();
  }

  /**
   * isPlayerInZone() — returns true if player is inside any zone.
   */
  function isPlayerInZone() {
    return _playerInZones.length > 0;
  }

  /**
   * getMultiplier() — returns the highest multiplier of all zones the player is in.
   */
  function getMultiplier() {
    return window._hotZoneMultiplier || 1.0;
  }

  /**
   * update(delta, playerPos) — call every frame.
   * playerPos must have .x and .z fields.
   */
  function update(delta, playerPos) {
    if (!_initialized || _zones.length === 0) return;

    _time += delta;
    _zoneCycleTimer += delta;

    var now = Date.now();

    // ── Per-zone update: pulsing, label positions, cycling ─────────────
    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];

      // Opacity pulse on ring
      var pulse = 0.15 + 0.15 * Math.sin(now * 0.002 + i);

      if (zone.fading) {
        zone.fadeTimer += delta;
        var fadeFrac = _clamp(zone.fadeTimer / ZONE_FADE_DURATION, 0, 1);
        if (zone.fadeDir === -1) {
          // Fading out
          zone.fadeOpacity = 1.0 - fadeFrac;
          if (fadeFrac >= 1.0) {
            // Fade out complete — move zone to new position
            _removeZoneMeshes(zone);
            var newPos = _findSpawnPos(_zones);
            zone.x = newPos.x;
            zone.z = newPos.z;
            zone.y = _getGroundY(zone.x, zone.z);

            // Rebuild meshes at new position
            zone.ringMesh = _buildRingMesh(zone.radius, zone.typeData.color);
            zone.ringMesh.position.set(zone.x, zone.y, zone.z);
            if (_scene) _scene.add(zone.ringMesh);

            zone.fillMesh = _buildFillMesh(zone.radius, zone.typeData.color);
            zone.fillMesh.position.set(zone.x, zone.y, zone.z);
            if (_scene) _scene.add(zone.fillMesh);

            zone.fadeDir   = 1;   // now fade in
            zone.fadeTimer = 0;
            zone.fadeOpacity = 0;

            _syncGlobals();
          }
        } else {
          // Fading in
          zone.fadeOpacity = fadeFrac;
          if (fadeFrac >= 1.0) {
            zone.fading      = false;
            zone.fadeDir     = 0;
            zone.fadeOpacity = 1.0;
            zone.cycleTimer  = 0;  // reset for next cycle
          }
        }
      } else {
        zone.cycleTimer += delta;
        if (zone.cycleTimer >= ZONE_CYCLE_INTERVAL) {
          // Start fade-out transition
          zone.fading    = true;
          zone.fadeDir   = -1;
          zone.fadeTimer = 0;
        }
      }

      // Apply opacity to meshes
      var ringOpacity = pulse * zone.fadeOpacity;
      var fillOpacity = 0.07 * zone.fadeOpacity;

      if (zone.highlighted) {
        // Green highlight when player is inside
        ringOpacity = _clamp(pulse * 1.6 * zone.fadeOpacity, 0, 1);
        if (zone.ringMesh && zone.ringMesh.material) {
          zone.ringMesh.material.color.setHex(0x00FF88);
        }
        if (zone.fillMesh && zone.fillMesh.material) {
          zone.fillMesh.material.color.setHex(0x00FF88);
          zone.fillMesh.material.opacity = _clamp(0.12 * zone.fadeOpacity, 0, 1);
        }
      } else {
        if (zone.ringMesh && zone.ringMesh.material) {
          zone.ringMesh.material.color.setHex(zone.typeData.color);
        }
        if (zone.fillMesh && zone.fillMesh.material) {
          zone.fillMesh.material.color.setHex(zone.typeData.color);
          zone.fillMesh.material.opacity = fillOpacity;
        }
      }

      if (zone.ringMesh && zone.ringMesh.material) {
        zone.ringMesh.material.opacity = ringOpacity;
      }

      // Update label screen position
      _updateLabelPosition(zone);

      // Update minimap dot
      _updateMinimapDot(zone);
    }

    // ── Player zone detection ────────────────────────────────────────────
    if (!playerPos) {
      window._hotZoneMultiplier = 1.0;
      return;
    }

    var prevInZones = _playerInZones.slice();
    _playerInZones = [];

    for (var j = 0; j < _zones.length; j++) {
      var z = _zones[j];
      var dist = _dist2D(playerPos.x, playerPos.z, z.x, z.z);
      if (dist <= z.radius) {
        _playerInZones.push(z);
      }
    }

    // Mark highlight on each zone
    for (var k = 0; k < _zones.length; k++) {
      _zones[k].highlighted = false;
    }
    for (var m = 0; m < _playerInZones.length; m++) {
      _playerInZones[m].highlighted = true;
    }

    // ── Zone enter / exit events ─────────────────────────────────────────
    // Detect newly entered zones
    for (var ni = 0; ni < _playerInZones.length; ni++) {
      var entered = _playerInZones[ni];
      var wasIn = false;
      for (var pi = 0; pi < prevInZones.length; pi++) {
        if (prevInZones[pi] === entered) { wasIn = true; break; }
      }
      if (!wasIn) {
        // Just entered this zone
        _flashBanner(
          entered.typeData.icon + ' ENTERING ' + entered.typeData.name +
          ' — x' + entered.typeData.multiplier.toFixed(1) + ' KILLS',
          _hexToCSS(entered.typeData.color),
          2000
        );
        _popLabel(entered.labelEl);
        _playEntryCue(entered.typeData.multiplier);
      }
    }

    // Detect zone exits
    for (var xi = 0; xi < prevInZones.length; xi++) {
      var exited = prevInZones[xi];
      var stillIn = false;
      for (var si = 0; si < _playerInZones.length; si++) {
        if (_playerInZones[si] === exited) { stillIn = true; break; }
      }
      if (!stillIn) {
        // Just left this zone
        _flashBanner('ZONE EXIT', '#aaaaaa', 1200);
      }
    }

    // ── Determine multiplier (highest of all occupied zones) ────────────
    var mult = 1.0;
    for (var mi = 0; mi < _playerInZones.length; mi++) {
      var zm = _playerInZones[mi].typeData.multiplier;
      if (zm > mult) mult = zm;
    }
    window._hotZoneMultiplier = mult;

    var multChanged = (Math.abs(mult - _prevMultiplier) > 0.001);
    _prevMultiplier = mult;

    // ── HUD update ───────────────────────────────────────────────────────
    if (_playerInZones.length > 0) {
      // Find best (highest mult) zone for HUD display
      var bestZone = _playerInZones[0];
      for (var bi = 1; bi < _playerInZones.length; bi++) {
        if (_playerInZones[bi].typeData.multiplier > bestZone.typeData.multiplier) {
          bestZone = _playerInZones[bi];
        }
      }
      if (!_hudEl) _ensureHUD();
      if (_hudEl) {
        var cssColor = _hexToCSS(bestZone.typeData.color);
        _hudEl.style.color = cssColor;
        _hudEl.style.borderColor = cssColor;
        _hudEl.style.textShadow = '0 0 8px ' + cssColor;
        _hudEl.innerHTML =
          '[Zones: ' + _playerInZones.length + '/' + _zones.length + ' CAPTURED]<br>' +
          bestZone.typeData.icon + ' +' + bestZone.typeData.multiplier.toFixed(1) + 'x KILLS<br>' +
          '<span style="font-size:10px;opacity:0.8">' +
          bestZone.typeData.icon + ' ' + bestZone.typeData.name +
          ' — x' + bestZone.typeData.multiplier.toFixed(1) + ' KILL BONUS</span>';
        _hudEl.style.display = 'block';
      }
    } else {
      _hideHUD();
    }
  }

  /**
   * reset() — remove all zones and clean up DOM/scene objects.
   */
  function reset() {
    for (var i = 0; i < _zones.length; i++) {
      _removeZoneMeshes(_zones[i]);
      _removeZoneDOM(_zones[i]);
    }
    _zones         = [];
    _playerInZones = [];
    _prevMultiplier = 1.0;
    _zoneCycleTimer = 0;
    _time           = 0;

    window._hotZoneMultiplier = 1.0;
    window._hotZonePositions  = [];

    _hideHUD();
  }

  // ── Expose globals immediately ───────────────────────────────────────────
  window._hotZoneMultiplier = 1.0;
  window._hotZonePositions  = [];

  return {
    init:           init,
    update:         update,
    spawnZones:     spawnZones,
    isPlayerInZone: isPlayerInZone,
    getMultiplier:  getMultiplier,
    reset:          reset,
    // Expose zone data for debugging / other systems
    getZones:       function () { return _zones; },
    ZONE_TYPES:     ZONE_TYPES
  };

})();
