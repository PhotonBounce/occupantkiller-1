// =============================================================================
//  parachute-drop.js — HALO/HAHO Airborne Insertion & Combat Module
//
//  Features: freefall insertion, chute deployment, altimeter HUD, wind FX,
//  AA threats, parachute damage, reserve chute, team drop, drop zone scoring.
//
//  Public API:
//    ParachuteDrop.init(scene, camera)
//    ParachuteDrop.update(delta)
//    ParachuteDrop.triggerAirborneInsertion(altitude)
//    ParachuteDrop.isInFreefall()
//    ParachuteDrop.reset()
// =============================================================================
window.ParachuteDrop = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  var FREEFALL_SPEED        = 25;    // downward units/s during freefall
  var FREEFALL_H_SPEED      = 3;     // horizontal steering speed during freefall
  var CHUTE_SPEED           = 2;     // downward units/s under main chute
  var CHUTE_DAMAGED_SPEED   = 8;     // downward units/s when chute torn
  var RESERVE_SPEED         = 2;     // downward units/s under reserve
  var CHUTE_H_SPEED         = 0.5;   // horizontal steering speed under chute
  var CHUTE_INFLATE_TIME    = 0.5;   // seconds for canopy to inflate
  var CHUTE_RADIUS          = 3;     // hemisphere radius (units)
  var CHUTE_OFFSET_Y        = 5;     // canopy offset above player
  var AUTO_DEPLOY_Y         = 20;    // auto-deploy altitude
  var RESERVE_DEPLOY_Y      = 5;     // reserve auto-deploy altitude
  var PULL_WARNING_Y        = 25;    // show "PULL CHUTE" warning below this
  var GROUND_Y              = 0;     // landing Y
  var SNAP_DIST             = 0.3;   // snap-to-ground threshold
  var CHUTE_MAX_HP          = 50;    // main chute hit points
  var CHUTE_DAMAGE_THRESH   = 0.8;   // 80% damage triggers reserve
  var DROP_ZONE_RADIUS      = 5;     // landing bonus inner radius
  var DROP_ZONE_OUTER       = 10;    // landing bonus outer radius
  var SCORE_INNER           = 150;   // score for landing within inner radius
  var SCORE_OUTER           = 75;    // score for landing within outer radius
  var TEAM_COUNT            = 3;     // number of AI team paratroopers
  var SWAY_FREQ             = 1.1;   // canopy sway frequency
  var SWAY_AMP              = 0.035; // canopy sway amplitude
  var COMBAT_ACCURACY_PENALTY = 0.6; // 60% reduced accuracy during descent
  var AA_THREAT_INTERVAL    = 5;     // seconds between AA threat checks

  // ---------------------------------------------------------------------------
  // Module state
  // ---------------------------------------------------------------------------
  var _scene  = null;
  var _camera = null;

  var _active          = false; // insertion in progress
  var _inFreefall      = false; // true during freefall phase
  var _chuteDeployed   = false; // main chute open
  var _reserveDeployed = false; // reserve chute open
  var _chuteHP         = CHUTE_MAX_HP;
  var _chuteInflating  = false;
  var _inflateTimer    = 0;
  var _landed          = false;
  var _velocityY       = 0;    // current downward speed (positive = falling)

  var _dropZoneX       = 0;
  var _dropZoneZ       = 0;

  // Three.js objects
  var _mainChuteGroup   = null;
  var _reserveGroup     = null;
  var _tearOverlay      = null; // partial tear mesh
  var _dropZoneMesh     = null;
  var _teamChutes       = [];   // array of { group, posY, posX, posZ, color }

  // Sway
  var _swayTimer = 0;

  // HUD elements
  var _hudEl      = null;
  var _altEl      = null;
  var _warnEl     = null;
  var _chuteHudEl = null;

  // Wind FX (Web Audio)
  var _audioCtx    = null;
  var _windSource  = null;
  var _windGain    = null;
  var _windFilter  = null;

  // CSS wind blur
  var _canvas      = null;

  // Input
  var _keys = { w: false, a: false, s: false, d: false };
  var _keydownHandler = null;
  var _keyupHandler   = null;

  // AA threat timer
  var _aaThreatTimer = 0;

  // Night drop
  var _isNightDrop = false;

  // ---------------------------------------------------------------------------
  // Utility: player position helpers
  // ---------------------------------------------------------------------------
  function _getPlayerY() {
    if (typeof window._playerY === 'number') { return window._playerY; }
    if (_camera) { return _camera.position.y; }
    return 0;
  }

  function _setPlayerY(y) {
    if (typeof window._playerY === 'number') { window._playerY = y; }
    if (_camera) { _camera.position.y = y; }
  }

  function _getPlayerX() {
    if (_camera) { return _camera.position.x; }
    return 0;
  }

  function _setPlayerX(x) {
    if (_camera) { _camera.position.x = x; }
  }

  function _getPlayerZ() {
    if (_camera) { return _camera.position.z; }
    return 0;
  }

  function _setPlayerZ(z) {
    if (_camera) { _camera.position.z = z; }
  }

  // ---------------------------------------------------------------------------
  // Wind Audio FX
  // ---------------------------------------------------------------------------
  function _initWindAudio() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { return; }
      _audioCtx = new Ctx();

      // White noise buffer
      var bufLen = _audioCtx.sampleRate * 2;
      var buf = _audioCtx.createBuffer(1, bufLen, _audioCtx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      _windSource = _audioCtx.createBufferSource();
      _windSource.buffer = buf;
      _windSource.loop = true;

      // High-pass filter for high-pitched wind
      _windFilter = _audioCtx.createBiquadFilter();
      _windFilter.type = 'highpass';
      _windFilter.frequency.value = 1800;

      _windGain = _audioCtx.createGain();
      _windGain.gain.value = 0;

      _windSource.connect(_windFilter);
      _windFilter.connect(_windGain);
      _windGain.connect(_audioCtx.destination);
      _windSource.start();
    } catch (e) {
      // Audio not available — fail silently
    }
  }

  function _updateWindAudio(speed) {
    if (!_windGain) { return; }
    // Volume proportional to freefall speed, max 0.4
    var vol = _inFreefall ? Math.min(0.4, (speed / FREEFALL_SPEED) * 0.4) : 0;
    try {
      _windGain.gain.setTargetAtTime(vol, _audioCtx.currentTime, 0.2);
    } catch (e) {}
  }

  function _stopWindAudio() {
    if (_windGain) {
      try { _windGain.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.1); } catch (e) {}
    }
  }

  // ---------------------------------------------------------------------------
  // Visual wind blur (CSS filter on canvas)
  // ---------------------------------------------------------------------------
  function _findCanvas() {
    if (_canvas) { return; }
    // Look for a canvas that looks like the game renderer
    var canvases = document.getElementsByTagName('canvas');
    if (canvases.length > 0) { _canvas = canvases[0]; }
  }

  function _setWindBlur(amount) {
    if (!_canvas) { _findCanvas(); }
    if (!_canvas) { return; }
    if (amount <= 0) {
      _canvas.style.filter = '';
    } else {
      // radial blur approximation via blur + saturate
      var px = (amount * 4).toFixed(1);
      _canvas.style.filter = 'blur(' + px + 'px) saturate(1.4)';
    }
  }

  function _clearWindBlur() {
    if (_canvas) { _canvas.style.filter = ''; }
  }

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------
  function _createHUD() {
    if (_hudEl) { return; }

    _hudEl = document.createElement('div');
    _hudEl.id = 'parachute-drop-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'text-align:center',
      'pointer-events:none',
      'z-index:9200',
      'display:none',
      'user-select:none'
    ].join(';');

    // Altimeter readout
    _altEl = document.createElement('div');
    _altEl.style.cssText = [
      'font-family:\'Courier New\',monospace',
      'font-size:52px',
      'font-weight:bold',
      'color:#00ff88',
      'text-shadow:0 0 16px #00ff88,0 0 32px #00aa55',
      'letter-spacing:4px',
      'line-height:1'
    ].join(';');
    _altEl.textContent = '0';

    // Unit label
    var unitLabel = document.createElement('div');
    unitLabel.style.cssText = [
      'font-family:monospace',
      'font-size:14px',
      'color:#88ffcc',
      'letter-spacing:8px',
      'margin-top:2px'
    ].join(';');
    unitLabel.textContent = 'METERS AGL';

    // Warning
    _warnEl = document.createElement('div');
    _warnEl.style.cssText = [
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'color:#ff2200',
      'text-shadow:0 0 12px #ff2200',
      'letter-spacing:3px',
      'margin-top:8px',
      'animation:pd-blink 0.4s step-end infinite',
      'display:none'
    ].join(';');
    _warnEl.textContent = '⚠ PULL CHUTE ⚠';

    // Chute status
    _chuteHudEl = document.createElement('div');
    _chuteHudEl.style.cssText = [
      'font-family:monospace',
      'font-size:13px',
      'color:#aaddff',
      'margin-top:6px'
    ].join(';');

    _hudEl.appendChild(_altEl);
    _hudEl.appendChild(unitLabel);
    _hudEl.appendChild(_warnEl);
    _hudEl.appendChild(_chuteHudEl);
    document.body.appendChild(_hudEl);

    // Blink keyframe
    if (!document.getElementById('pd-blink-style')) {
      var style = document.createElement('style');
      style.id = 'pd-blink-style';
      style.textContent = '@keyframes pd-blink{0%,100%{opacity:1}50%{opacity:0}}';
      document.head.appendChild(style);
    }
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    if (!_active) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';

    var y = _getPlayerY();
    var altDisplay = Math.max(0, Math.round(y));
    if (_altEl) { _altEl.textContent = altDisplay; }

    // Pull chute warning
    if (_warnEl) {
      if (!_chuteDeployed && !_reserveDeployed && y < PULL_WARNING_Y && y > GROUND_Y + 1) {
        _warnEl.style.display = 'block';
      } else {
        _warnEl.style.display = 'none';
      }
    }

    // Chute status line
    if (_chuteHudEl) {
      var statusParts = [];
      if (_chuteDeployed) {
        var hpPct = Math.round((_chuteHP / CHUTE_MAX_HP) * 100);
        statusParts.push('MAIN CHUTE: ' + hpPct + '%');
        if (_tearOverlay) { statusParts.push('[TORN]'); }
      } else if (_reserveDeployed) {
        statusParts.push('RESERVE CHUTE ACTIVE');
      } else if (_inFreefall) {
        statusParts.push('FREEFALL — SPACE to deploy');
      }
      if (_isNightDrop) { statusParts.push('NIGHT DROP — NVG RECOMMENDED'); }
      _chuteHudEl.textContent = statusParts.join('  ');
    }
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
    _altEl = null;
    _warnEl = null;
    _chuteHudEl = null;
  }

  // ---------------------------------------------------------------------------
  // Drop Zone mesh (green ring on the ground)
  // ---------------------------------------------------------------------------
  function _createDropZone(cx, cz) {
    if (!window.THREE || !_scene) { return; }
    _removeDropZone();

    var ringGeo = new THREE.RingGeometry(DROP_ZONE_RADIUS - 0.3, DROP_ZONE_RADIUS + 0.3, 64);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff44,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cx, GROUND_Y + 0.05, cz);

    // Inner dot
    var dotGeo = new THREE.CircleGeometry(0.8, 32);
    var dotMat = new THREE.MeshBasicMaterial({
      color: 0x00ff44,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    var dot = new THREE.Mesh(dotGeo, dotMat);
    dot.rotation.x = -Math.PI / 2;
    dot.position.set(cx, GROUND_Y + 0.06, cz);

    _dropZoneMesh = new THREE.Group();
    _dropZoneMesh.add(ring);
    _dropZoneMesh.add(dot);

    // Night drop: dim if no lights
    if (_isNightDrop) {
      ringMat.opacity = 0.2;
      dotMat.opacity = 0.15;
    }

    _scene.add(_dropZoneMesh);
  }

  function _removeDropZone() {
    if (_dropZoneMesh && _scene) {
      _scene.remove(_dropZoneMesh);
    }
    _dropZoneMesh = null;
  }

  // ---------------------------------------------------------------------------
  // Canopy mesh builder
  // ---------------------------------------------------------------------------
  function _buildCanopyGroup(color, radius) {
    if (!window.THREE) { return null; }
    var group = new THREE.Group();

    // Hemisphere: use SphereGeometry half-sphere
    var domeGeo = new THREE.SphereGeometry(radius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    var domeMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0  // starts invisible, inflates
    });
    var dome = new THREE.Mesh(domeGeo, domeMat);
    dome.name = 'canopy';
    group.add(dome);

    // Gore lines (alternating panels for visual detail)
    var NUM_GORES = 8;
    for (var g = 0; g < NUM_GORES; g++) {
      var angle = (g / NUM_GORES) * Math.PI * 2;
      var lineGeo = new THREE.CylinderGeometry(0.015, 0.015, CHUTE_OFFSET_Y - 0.5, 4);
      var lineMat = new THREE.MeshBasicMaterial({ color: 0xbbbbbb });
      var line = new THREE.Mesh(lineGeo, lineMat);
      var rimR = radius * 0.8;
      line.position.set(
        Math.cos(angle) * rimR * 0.4,
        -(CHUTE_OFFSET_Y - 0.5) / 2,
        Math.sin(angle) * rimR * 0.4
      );
      line.rotation.z = Math.cos(angle) * 0.18;
      line.rotation.x = Math.sin(angle) * 0.18;
      group.add(line);
    }

    return group;
  }

  // ---------------------------------------------------------------------------
  // Main chute
  // ---------------------------------------------------------------------------
  function _buildMainChute() {
    if (!window.THREE || !_scene) { return; }
    _removeMainChute();

    _mainChuteGroup = _buildCanopyGroup(0xffffff, CHUTE_RADIUS);
    if (_mainChuteGroup) { _scene.add(_mainChuteGroup); }
    _inflateTimer = 0;
    _chuteInflating = true;
  }

  function _updateChuteInflation(dt) {
    if (!_chuteInflating || !_mainChuteGroup) { return; }
    _inflateTimer += dt;
    var t = Math.min(1, _inflateTimer / CHUTE_INFLATE_TIME);
    // Ease-out cubic
    var ease = 1 - Math.pow(1 - t, 3);
    var dome = _mainChuteGroup.getObjectByName('canopy');
    if (dome && dome.material) {
      dome.material.opacity = ease * 0.88;
    }
    // Scale inflate effect
    _mainChuteGroup.scale.setScalar(0.2 + ease * 0.8);
    if (t >= 1) { _chuteInflating = false; }
  }

  function _positionMainChute() {
    if (!_mainChuteGroup || !_camera) { return; }
    _mainChuteGroup.position.set(
      _camera.position.x,
      _camera.position.y + CHUTE_OFFSET_Y,
      _camera.position.z
    );
  }

  function _removeMainChute() {
    if (_mainChuteGroup && _scene) { _scene.remove(_mainChuteGroup); }
    _mainChuteGroup = null;
    _chuteInflating = false;
    _inflateTimer = 0;
  }

  // ---------------------------------------------------------------------------
  // Tear overlay (partial tear mesh on main chute)
  // ---------------------------------------------------------------------------
  function _addTearOverlay() {
    if (!window.THREE || !_mainChuteGroup || _tearOverlay) { return; }
    var tearGeo = new THREE.SphereGeometry(CHUTE_RADIUS + 0.05, 6, 4, 0.8, 1.2, 0.3, 0.9);
    var tearMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      wireframe: true
    });
    _tearOverlay = new THREE.Mesh(tearGeo, tearMat);
    _mainChuteGroup.add(_tearOverlay);
  }

  function _removeTearOverlay() {
    if (_tearOverlay && _mainChuteGroup) {
      _mainChuteGroup.remove(_tearOverlay);
    }
    _tearOverlay = null;
  }

  // ---------------------------------------------------------------------------
  // Reserve chute
  // ---------------------------------------------------------------------------
  function _deployReserve() {
    if (_reserveDeployed) { return; }
    _reserveDeployed = true;
    _velocityY = RESERVE_SPEED; // snap to safe descent

    if (!window.THREE || !_scene) { return; }
    _reserveGroup = _buildCanopyGroup(0xff8800, CHUTE_RADIUS * 0.7);
    if (_reserveGroup) {
      // Offset slightly so it's distinguishable from (torn) main
      _reserveGroup.position.set(
        _getPlayerX() + 0.5,
        _getPlayerY() + CHUTE_OFFSET_Y - 1,
        _getPlayerZ()
      );
      _scene.add(_reserveGroup);
      // Force full opacity immediately
      var dome = _reserveGroup.getObjectByName('canopy');
      if (dome && dome.material) { dome.material.opacity = 0.85; }
      _reserveGroup.scale.setScalar(1);
    }
  }

  function _positionReserve() {
    if (!_reserveGroup || !_camera) { return; }
    _reserveGroup.position.set(
      _camera.position.x + 0.5,
      _camera.position.y + CHUTE_OFFSET_Y - 1,
      _camera.position.z
    );
  }

  function _removeReserve() {
    if (_reserveGroup && _scene) { _scene.remove(_reserveGroup); }
    _reserveGroup = null;
  }

  // ---------------------------------------------------------------------------
  // Team drop (3 AI paratroopers)
  // ---------------------------------------------------------------------------
  var TEAM_COLORS = [0xff3333, 0x3399ff, 0xffdd00];

  function _spawnTeamDrop(startY) {
    _clearTeamChutes();
    for (var t = 0; t < TEAM_COUNT; t++) {
      if (!window.THREE || !_scene) {
        _teamChutes.push({ group: null, posY: startY, posX: _dropZoneX + (t - 1) * 6, posZ: _dropZoneZ + (t % 2 === 0 ? 5 : -5), landed: false, velocityY: FREEFALL_SPEED, chuteOpen: false });
        continue;
      }
      var chuteGroup = _buildCanopyGroup(TEAM_COLORS[t], CHUTE_RADIUS * 0.85);
      var spawnX = _dropZoneX + (t - 1) * 6;
      var spawnZ = _dropZoneZ + (t % 2 === 0 ? 5 : -5);
      if (chuteGroup) {
        chuteGroup.position.set(spawnX, startY + CHUTE_OFFSET_Y, spawnZ);
        _scene.add(chuteGroup);
      }
      _teamChutes.push({
        group: chuteGroup,
        posY: startY,
        posX: spawnX,
        posZ: spawnZ,
        landed: false,
        velocityY: FREEFALL_SPEED,
        chuteOpen: false,
        chuteTimer: 0
      });
    }
  }

  function _updateTeamDrop(dt) {
    for (var i = 0; i < _teamChutes.length; i++) {
      var m = _teamChutes[i];
      if (m.landed) { continue; }

      // Auto-deploy chute at 30 units (staggered)
      var autoDeployY = AUTO_DEPLOY_Y + (i * 5);
      if (!m.chuteOpen && m.posY <= autoDeployY) {
        m.chuteOpen = true;
        m.velocityY = CHUTE_SPEED;
        if (m.group) {
          var dome = m.group.getObjectByName('canopy');
          if (dome && dome.material) { dome.material.opacity = 0.82; }
        }
      }

      m.posY -= m.velocityY * dt;

      if (m.posY <= GROUND_Y) {
        m.posY = GROUND_Y;
        m.landed = true;
        if (m.group && _scene) {
          _scene.remove(m.group);
          m.group = null;
        }
      } else if (m.group) {
        m.group.position.set(m.posX, m.posY + CHUTE_OFFSET_Y, m.posZ);
        // Gentle sway
        m.chuteTimer = (m.chuteTimer || 0) + dt;
        m.group.rotation.x = Math.sin(m.chuteTimer * SWAY_FREQ * 0.9) * SWAY_AMP;
        m.group.rotation.z = Math.cos(m.chuteTimer * SWAY_FREQ * 0.7) * SWAY_AMP;
      }
    }
  }

  function _clearTeamChutes() {
    for (var i = 0; i < _teamChutes.length; i++) {
      if (_teamChutes[i].group && _scene) {
        _scene.remove(_teamChutes[i].group);
      }
    }
    _teamChutes = [];
  }

  // ---------------------------------------------------------------------------
  // Landing
  // ---------------------------------------------------------------------------
  function _calcLandingScore() {
    var dx = _getPlayerX() - _dropZoneX;
    var dz = _getPlayerZ() - _dropZoneZ;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= DROP_ZONE_RADIUS) {
      _awardScore(SCORE_INNER, 'PRECISION LANDING +' + SCORE_INNER);
    } else if (dist <= DROP_ZONE_OUTER) {
      _awardScore(SCORE_OUTER, 'ON TARGET +' + SCORE_OUTER);
    }
  }

  function _awardScore(pts, msg) {
    if (window.ScoreSystem && typeof window.ScoreSystem.add === 'function') {
      window.ScoreSystem.add(pts, msg);
    } else if (window._gameScore !== undefined) {
      window._gameScore += pts;
    }
    // Show brief HUD message
    _showLandingMsg(msg);
  }

  function _showLandingMsg(msg) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffdd00',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:9300',
      'text-shadow:0 0 12px #ffaa00',
      'transition:opacity 1s'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 1500);
    setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, 2600);
  }

  function _land() {
    if (_landed) { return; }
    _landed = true;
    _active = false;
    _inFreefall = false;
    _chuteDeployed = false;
    _reserveDeployed = false;
    _velocityY = 0;

    _setPlayerY(GROUND_Y);
    _removeMainChute();
    _removeReserve();
    _removeTearOverlay();
    _removeDropZone();
    _stopWindAudio();
    _clearWindBlur();
    _calcLandingScore();

    // Restore weapon accuracy
    if (window._parachuteAccuracyPenalty !== undefined) {
      window._parachuteAccuracyPenalty = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Chute deployment
  // ---------------------------------------------------------------------------
  function _deployMainChute() {
    if (_chuteDeployed || _reserveDeployed) { return; }
    if (!_active) { return; }
    var y = _getPlayerY();
    if (y <= GROUND_Y + 1) { return; }

    _chuteDeployed = true;
    _inFreefall = false;
    _velocityY = CHUTE_SPEED;
    _chuteHP = CHUTE_MAX_HP;

    _buildMainChute();
    _stopWindAudio();
    _clearWindBlur();
  }

  // ---------------------------------------------------------------------------
  // AA threat — enemy anti-air fires at player during descent
  // ---------------------------------------------------------------------------
  function _updateAAThreats(dt) {
    if (!_active) { return; }
    _aaThreatTimer -= dt;
    if (_aaThreatTimer > 0) { return; }
    _aaThreatTimer = AA_THREAT_INTERVAL;

    // Ask AntiAir.js (if loaded) to target player
    if (window.AntiAir && typeof window.AntiAir.targetPlayer === 'function') {
      window.AntiAir.targetPlayer();
    }

    // Simulate AA hit with probability proportional to altitude (lower = more dangerous)
    var y = _getPlayerY();
    var hitChance = Math.max(0, 0.3 - (y / 80) * 0.25);
    if (Math.random() < hitChance) {
      _takeChuteHit();
    }
  }

  // ---------------------------------------------------------------------------
  // Parachute damage
  // ---------------------------------------------------------------------------
  function _takeChuteHit() {
    if (!_chuteDeployed || _reserveDeployed) { return; }
    var dmg = 10 + Math.random() * 15;
    _chuteHP = Math.max(0, _chuteHP - dmg);

    var hpFraction = _chuteHP / CHUTE_MAX_HP;

    // Show tear visual
    if (hpFraction < 0.5 && !_tearOverlay) {
      _addTearOverlay();
    }

    // Increase fall speed proportionally to damage
    var damageFactor = 1 - hpFraction;
    _velocityY = CHUTE_SPEED + damageFactor * (CHUTE_DAMAGED_SPEED - CHUTE_SPEED);

    // Reserve auto-deploys if > 80% damage
    if (hpFraction < (1 - CHUTE_DAMAGE_THRESH) && !_reserveDeployed) {
      var playerY = _getPlayerY();
      if (playerY <= RESERVE_DEPLOY_Y + 3 || hpFraction <= 0.05) {
        _deployReserve();
      }
    }
  }

  // Public: external systems can call this to damage the parachute
  function damageChuteExternal(dmg) {
    if (!_chuteDeployed || _reserveDeployed) { return; }
    var amount = (typeof dmg === 'number') ? dmg : 10;
    _takeChuteHit();
  }

  // ---------------------------------------------------------------------------
  // Combat during descent: reduced accuracy flag
  // ---------------------------------------------------------------------------
  function _setDescentCombatMode(on) {
    if (on) {
      window._parachuteAccuracyPenalty = COMBAT_ACCURACY_PENALTY;
    } else {
      window._parachuteAccuracyPenalty = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------
  function _onKeyDown(e) {
    var key = (e.key || '').toLowerCase();
    if (key === 'w') { _keys.w = true; }
    if (key === 'a') { _keys.a = true; }
    if (key === 's') { _keys.s = true; }
    if (key === 'd') { _keys.d = true; }

    // Space — deploy main chute
    if (key === ' ' || e.code === 'Space') {
      if (_active && !_chuteDeployed && !_reserveDeployed) {
        e.preventDefault();
        _deployMainChute();
      }
    }
  }

  function _onKeyUp(e) {
    var key = (e.key || '').toLowerCase();
    if (key === 'w') { _keys.w = false; }
    if (key === 'a') { _keys.a = false; }
    if (key === 's') { _keys.s = false; }
    if (key === 'd') { _keys.d = false; }
  }

  function _registerKeys() {
    if (_keydownHandler) { return; }
    _keydownHandler = _onKeyDown;
    _keyupHandler   = _onKeyUp;
    document.addEventListener('keydown', _keydownHandler, false);
    document.addEventListener('keyup',   _keyupHandler,   false);
  }

  function _unregisterKeys() {
    if (_keydownHandler) {
      document.removeEventListener('keydown', _keydownHandler, false);
      _keydownHandler = null;
    }
    if (_keyupHandler) {
      document.removeEventListener('keyup', _keyupHandler, false);
      _keyupHandler = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Physics update
  // ---------------------------------------------------------------------------
  function _applyHorizontalInput(dt, speed) {
    if (!_camera) { return; }
    var dx = 0, dz = 0;
    if (_keys.w) { dz -= speed * dt; }
    if (_keys.s) { dz += speed * dt; }
    if (_keys.a) { dx -= speed * dt; }
    if (_keys.d) { dx += speed * dt; }
    _camera.position.x += dx;
    _camera.position.z += dz;
  }

  function _updatePhysics(dt) {
    if (!_active) { return; }

    var y = _getPlayerY();

    // ── Auto-deploy reserve at low altitude ──
    if (!_reserveDeployed && _chuteDeployed && y <= RESERVE_DEPLOY_Y) {
      var hpFrac = _chuteHP / CHUTE_MAX_HP;
      if (hpFrac < (1 - CHUTE_DAMAGE_THRESH)) {
        _deployReserve();
      }
    }

    // ── Auto-deploy main chute at 20 units ──
    if (!_chuteDeployed && !_reserveDeployed && _inFreefall && y <= AUTO_DEPLOY_Y) {
      _deployMainChute();
    }

    if (_reserveDeployed) {
      _velocityY = RESERVE_SPEED;
      _applyHorizontalInput(dt, CHUTE_H_SPEED);
      _positionReserve();
      _swayChute(dt);
    } else if (_chuteDeployed) {
      _applyHorizontalInput(dt, CHUTE_H_SPEED);
      _updateChuteInflation(dt);
      _positionMainChute();
      _swayChute(dt);
    } else if (_inFreefall) {
      // Freefall — constant speed per spec
      _velocityY = FREEFALL_SPEED;
      _applyHorizontalInput(dt, FREEFALL_H_SPEED);

      // Wind FX
      _updateWindAudio(_velocityY);
      var blurAmount = Math.min(1, _velocityY / FREEFALL_SPEED);
      _setWindBlur(blurAmount);
    }

    var newY = y - _velocityY * dt;

    // Landing detection
    if (newY <= GROUND_Y + SNAP_DIST) {
      _land();
      return;
    }

    _setPlayerY(newY);
  }

  function _swayChute(dt) {
    _swayTimer += dt;
    if (_mainChuteGroup) {
      _mainChuteGroup.rotation.x = Math.sin(_swayTimer * SWAY_FREQ) * SWAY_AMP;
      _mainChuteGroup.rotation.z = Math.cos(_swayTimer * SWAY_FREQ * 0.75) * SWAY_AMP;
    }
    if (_reserveGroup) {
      _reserveGroup.rotation.x = Math.sin(_swayTimer * SWAY_FREQ * 1.1 + 0.5) * SWAY_AMP;
      _reserveGroup.rotation.z = Math.cos(_swayTimer * SWAY_FREQ * 0.8 + 0.5) * SWAY_AMP;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * init(scene, camera) — wire up module references
   */
  function init(scene, camera) {
    _scene  = scene  || _scene;
    _camera = camera || _camera;

    _createHUD();
    _registerKeys();
    _initWindAudio();

    // Expose chute damage hook for AntiAir.js / projectiles
    window._parachuteDamageChuteHit = _takeChuteHit;
  }

  /**
   * update(delta) — call each frame with elapsed seconds
   */
  function update(delta) {
    if (!delta || delta <= 0) { return; }

    _updatePhysics(delta);
    _updateHUD();
    _updateTeamDrop(delta);
    _updateAAThreats(delta);
  }

  /**
   * triggerAirborneInsertion(altitude) — begin HALO/HAHO drop
   */
  function triggerAirborneInsertion(altitude) {
    var startY = (typeof altitude === 'number' && altitude > 0) ? altitude : 80;

    // Reset any previous drop
    reset();

    _active     = true;
    _inFreefall = true;
    _landed     = false;
    _chuteDeployed  = false;
    _reserveDeployed = false;
    _chuteHP    = CHUTE_MAX_HP;
    _velocityY  = FREEFALL_SPEED;
    _swayTimer  = 0;
    _aaThreatTimer = AA_THREAT_INTERVAL;

    // Check for night drop
    _isNightDrop = (window.NightVision && typeof window.NightVision.isNight === 'function')
      ? window.NightVision.isNight()
      : false;

    // Position player at insertion altitude
    _setPlayerY(startY);

    // Pick drop zone at current XZ position
    _dropZoneX = _getPlayerX();
    _dropZoneZ = _getPlayerZ();
    _createDropZone(_dropZoneX, _dropZoneZ);

    // Create HUD
    _createHUD();
    _registerKeys();

    // Team drop
    _spawnTeamDrop(startY - 5);

    // Combat accuracy penalty during descent
    _setDescentCombatMode(true);

    // Wind audio
    if (!_audioCtx) { _initWindAudio(); }
  }

  /**
   * isInFreefall() — returns true while player is in the freefall phase
   */
  function isInFreefall() {
    return _inFreefall;
  }

  /**
   * reset() — clean up all state and Three.js objects
   */
  function reset() {
    _active          = false;
    _inFreefall      = false;
    _chuteDeployed   = false;
    _reserveDeployed = false;
    _chuteInflating  = false;
    _inflateTimer    = 0;
    _landed          = false;
    _velocityY       = 0;
    _swayTimer       = 0;
    _aaThreatTimer   = 0;
    _isNightDrop     = false;

    _keys.w = false;
    _keys.a = false;
    _keys.s = false;
    _keys.d = false;

    _removeMainChute();
    _removeReserve();
    _removeTearOverlay();
    _removeDropZone();
    _clearTeamChutes();
    _removeHUD();
    _stopWindAudio();
    _clearWindBlur();
    _unregisterKeys();

    window._parachuteAccuracyPenalty = 0;
    window._parachuteDamageChuteHit  = null;
  }

  return {
    init:                     init,
    update:                   update,
    triggerAirborneInsertion: triggerAirborneInsertion,
    isInFreefall:             isInFreefall,
    reset:                    reset,
    damageChute:              damageChuteExternal
  };

}());
