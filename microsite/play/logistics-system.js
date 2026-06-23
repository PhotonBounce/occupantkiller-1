/* ───────────────────────────────────────────────────────────────────────
   LOGISTICS SYSTEM — Military supply management for FPS gameplay
   Tracks ammunition, fuel, food, water, and medical supplies.
   Spawns supply crates and player-callable supply convoys.
   Depends on: THREE (global), optional HUD, optional AudioSystem,
               optional window.GameState for score, optional window.Player
   ─────────────────────────────────────────────────────────────────────── */
window.LogisticsSystem = (function () {
  'use strict';

  /* ── Resource state ──────────────────────────────────────────────── */
  var _resources = {
    ammo:    300,
    fuel:    100,
    food:    100,
    water:   100,
    medical: 5
  };

  /* ── Internal state ──────────────────────────────────────────────── */
  var _scene = null;
  var _playerRef = null;
  var _time = 0;

  var _fuelTimer    = 0;   // countdown to next 1% fuel drain (30 s)
  var _foodTimer    = 0;   // countdown to next food/water drain (120 s)
  var _vehicleActive = false;

  var _supplyCrates   = [];
  var _crateSpawnTimer = 0;   // time until next crate drop (60 s)
  var CRATE_SPAWN_INTERVAL = 60;

  var _convoy = null;          // active supply truck object or null
  var _convoyCallCooldown = 0; // seconds remaining before another call allowed
  var _convoyStopTimer    = 0; // how long truck has been stopped (max 15 s)
  var _convoyDeparting    = false;

  var _emergencyAlertActive = false;
  var _emergencyConvoyTimer = 0; // countdown for auto-convoy after critical
  var _emergencyPulseTime   = 0;

  var _eKeyWasDown = false;   // edge-detect for E key
  var _lKeyWasDown = false;   // edge-detect for L key

  /* ── HUD element refs ────────────────────────────────────────────── */
  var _hudPanel   = null;
  var _hudContent = null;
  var _hudToggle  = null;
  var _hudOpen    = true;
  var _criticalEl = null;

  /* ── Constants ───────────────────────────────────────────────────── */
  var AMMO_START    = 300;
  var FUEL_START    = 100;
  var FOOD_START    = 100;
  var WATER_START   = 100;
  var MEDICAL_START = 5;

  var FUEL_DRAIN_INTERVAL  = 30;   // seconds per 1% drain when vehicle active
  var FOOD_DRAIN_INTERVAL  = 120;  // seconds per 5% food/water drain
  var FOOD_DRAIN_AMOUNT    = 5;
  var CRATE_COLLECT_RADIUS = 2.5;
  var TRUCK_COLLECT_RADIUS = 4;
  var CONVOY_STOP_DURATION = 15;   // seconds truck waits
  var CONVOY_DRIVE_DIST    = 30;   // units truck drives before stopping
  var EMERGENCY_CONVOY_DELAY = 60; // seconds auto-convoy waits after critical

  /* ── Geometry / material helpers ────────────────────────────────── */
  function _makeMat(color, emissive) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) mat.emissive = new THREE.Color(emissive);
    return mat;
  }

  /* ── Supply crate mesh ───────────────────────────────────────────── */
  // Wooden box 1×1×1 (0x8B6914 wood-brown) with black strap lines
  function _buildCrateMesh() {
    var group = new THREE.Group();

    // Main wooden box body
    var boxGeo = new THREE.BoxGeometry(1, 1, 1);
    var boxMat = _makeMat(0x8B6914);
    var box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    // Horizontal strap (thin flat bar across front/back)
    var strapHGeo = new THREE.BoxGeometry(1.02, 0.08, 0.08);
    var strapMat  = _makeMat(0x111111);
    var strapH1 = new THREE.Mesh(strapHGeo, strapMat);
    strapH1.position.set(0, 0, 0.51);
    group.add(strapH1);

    var strapH2 = new THREE.Mesh(strapHGeo, strapMat);
    strapH2.position.set(0, 0, -0.51);
    group.add(strapH2);

    // Vertical strap (thin flat bar over the top)
    var strapVGeo = new THREE.BoxGeometry(0.08, 1.02, 1.02);
    var strapV = new THREE.Mesh(strapVGeo, strapMat);
    strapV.position.set(0, 0, 0);
    group.add(strapV);

    return group;
  }

  /* ── Supply truck mesh ───────────────────────────────────────────── */
  // Cab: 2×2×2.5 (OD green), flat bed: 5×1×2.5, 4 cylinder wheels, headlights
  function _buildTruckMesh() {
    var group = new THREE.Group();
    var odGreen = 0x4A5240;

    // Cab (front half)
    var cabGeo = new THREE.BoxGeometry(2, 2, 2.5);
    var cabMat = _makeMat(odGreen);
    var cab    = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, 1, -1.25);   // centred at wheel height + 1 up
    group.add(cab);

    // Flat bed (rear)
    var bedGeo = new THREE.BoxGeometry(5, 1, 2.5);
    var bedMat = _makeMat(odGreen);
    var bed    = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(2.5, 0.5, -1.25);  // offset behind cab
    group.add(bed);

    // 4 Wheels – cylinders lying on their side
    var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
    var wheelMat = _makeMat(0x222222);

    var wheelPositions = [
      [-0.6, 0, -0.5],
      [-0.6, 0, -2.0],
      [ 3.6, 0, -0.5],
      [ 3.6, 0, -2.0]
    ];

    for (var wi = 0; wi < wheelPositions.length; wi++) {
      var wl = new THREE.Mesh(wheelGeo, wheelMat);
      wl.rotation.z = Math.PI / 2;
      wl.position.set(
        wheelPositions[wi][0],
        wheelPositions[wi][1],
        wheelPositions[wi][2]
      );
      group.add(wl);
    }

    // Headlights – small yellow spheres on front face of cab
    var headGeo = new THREE.SphereGeometry(0.18, 8, 6);
    var headMat = _makeMat(0xFFFF88, 0xFFFF44);

    var hl1 = new THREE.Mesh(headGeo, headMat);
    hl1.position.set(-0.6, 0.8, -2.5);
    group.add(hl1);

    var hl2 = new THREE.Mesh(headGeo, headMat);
    hl2.position.set( 0.6, 0.8, -2.5);
    group.add(hl2);

    return group;
  }

  /* ── HUD build ───────────────────────────────────────────────────── */
  function _buildHUD() {
    if (typeof document === 'undefined') return;

    // Critical alert overlay
    _criticalEl = document.createElement('div');
    _criticalEl.id = 'logistics-critical-alert';
    _criticalEl.style.cssText = [
      'position:fixed',
      'top:20%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(180,0,0,0.9)',
      'color:#fff',
      'padding:14px 28px',
      'font-size:20px',
      'font-weight:bold',
      'font-family:monospace',
      'border:3px solid #ff4444',
      'border-radius:6px',
      'z-index:9999',
      'display:none',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    _criticalEl.textContent = '⚠ CRITICAL LOGISTICS FAILURE ⚠';
    document.body.appendChild(_criticalEl);

    // Right sidebar logistics panel
    var sidebar = document.createElement('div');
    sidebar.id = 'logistics-hud';
    sidebar.style.cssText = [
      'position:fixed',
      'top:80px',
      'right:0',
      'width:190px',
      'background:rgba(10,14,10,0.88)',
      'border:1px solid #3a4a3a',
      'border-right:none',
      'border-radius:6px 0 0 6px',
      'z-index:500',
      'font-family:monospace',
      'font-size:12px',
      'color:#ccc',
      'user-select:none'
    ].join(';');

    var header = document.createElement('div');
    header.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'padding:6px 8px',
      'background:rgba(40,60,40,0.7)',
      'border-radius:6px 0 0 0',
      'cursor:pointer'
    ].join(';');
    header.innerHTML = '<span>🔧 LOGISTICS</span>';

    _hudToggle = document.createElement('span');
    _hudToggle.style.cssText = 'cursor:pointer;padding:0 4px;font-size:14px;color:#afc';
    _hudToggle.textContent = '▼';
    header.appendChild(_hudToggle);
    header.addEventListener('click', _togglePanel);

    _hudContent = document.createElement('div');
    _hudContent.id = 'logistics-hud-content';
    _hudContent.style.cssText = 'padding:8px 8px 10px 8px;';

    sidebar.appendChild(header);
    sidebar.appendChild(_hudContent);
    document.body.appendChild(sidebar);
    _hudPanel = sidebar;

    _renderHUD();
  }

  function _togglePanel() {
    _hudOpen = !_hudOpen;
    if (_hudContent) _hudContent.style.display = _hudOpen ? 'block' : 'none';
    if (_hudToggle) _hudToggle.textContent = _hudOpen ? '▼' : '▲';
  }

  function _barColor(pct) {
    if (pct > 60) return '#44cc44';
    if (pct > 30) return '#cccc22';
    return '#cc3333';
  }

  function _makeBar(label, pct, unit) {
    var col = _barColor(pct);
    var filled = Math.round(Math.max(0, Math.min(100, pct)));
    return (
      '<div style="margin-bottom:6px">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:2px">' +
          '<span>' + label + '</span>' +
          '<span style="color:' + col + '">' + (unit || Math.round(pct) + '%') + '</span>' +
        '</div>' +
        '<div style="background:#222;height:6px;border-radius:3px;overflow:hidden">' +
          '<div style="width:' + filled + '%;height:100%;background:' + col + ';border-radius:3px;transition:width 0.3s"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function _renderHUD() {
    if (!_hudContent) return;
    var ammoPct  = Math.round((_resources.ammo / AMMO_START) * 100);
    var convoyStatus = _convoy ? (_convoyDeparting ? 'DEPARTING' : 'INBOUND') : (_convoyCallCooldown > 0 ? 'CD ' + Math.ceil(_convoyCallCooldown) + 's' : 'Press L');
    var html = '';
    html += _makeBar('AMMO', ammoPct, _resources.ammo + ' rds');
    html += _makeBar('FUEL', _resources.fuel);
    html += _makeBar('FOOD', _resources.food);
    html += _makeBar('WATER', _resources.water);
    html += _makeBar('MEDICAL', (_resources.medical / MEDICAL_START) * 100, _resources.medical + ' kits');
    html += '<div style="margin-top:8px;border-top:1px solid #334;padding-top:6px;color:#8bc;font-size:11px">' +
              'CONVOY: <span style="color:#fc6">' + convoyStatus + '</span>' +
            '</div>';
    if (_convoy && !_convoyDeparting) {
      var remaining = Math.max(0, Math.ceil(CONVOY_STOP_DURATION - _convoyStopTimer));
      html += '<div style="color:#f84;font-size:11px">Reach truck! ' + remaining + 's</div>';
    }
    _hudContent.innerHTML = html;
  }

  /* ── Explosion VFX (simple flash light + screen shake) ──────────── */
  function _spawnExplosion(pos) {
    if (!_scene) return;
    var light = new THREE.PointLight(0xff6600, 4, 12);
    light.position.copy(pos);
    _scene.add(light);
    var timer = 0;
    var _updateLight = function (dt) {
      timer += dt;
      light.intensity = Math.max(0, 4 - timer * 12);
      if (timer > 0.4) {
        _scene.remove(light);
        light.dispose && light.dispose();
      }
    };
    _explosionLights.push(_updateLight);

    // Screen shake via CameraSystem if available
    try {
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
        CameraSystem.shake(0.2, 0.5);
      }
    } catch (e2) {}
  }

  var _explosionLights = [];

  /* ── Supply crate drop ───────────────────────────────────────────── */
  function _spawnSupplyCrate() {
    if (!_scene) return;

    var rx = (Math.random() - 0.5) * 80;  // ±40 units
    var rz = (Math.random() - 0.5) * 80;

    // 20% chance enemy artillery interdicts the drop
    if (Math.random() < 0.20) {
      _scheduleInterdiction(rx, rz);
      return;
    }

    var mesh = _buildCrateMesh();
    mesh.position.set(rx, 0.5, rz);
    _scene.add(mesh);

    var light = new THREE.PointLight(0xFFAA22, 1.2, 6);
    light.position.set(rx, 1.5, rz);
    _scene.add(light);

    _supplyCrates.push({
      mesh: mesh,
      light: light,
      x: rx,
      z: rz,
      pulseTime: 0,
      removed: false
    });
  }

  function _scheduleInterdiction(rx, rz) {
    // Simulate artillery impact 2-4 seconds after drop call
    var delay = 2 + Math.random() * 2;
    var elapsed = 0;
    var done = false;
    _interdictions.push({
      x: rx, z: rz, delay: delay, elapsed: 0, done: false
    });
    _showNotification('⚠ SUPPLY DROP INTERDICTED BY ARTILLERY!', '#ff4444');
  }

  var _interdictions = [];

  function _collectCrate(crate, playerRef) {
    // Randomly grant ammo+fuel or food kits
    if (Math.random() < 0.5) {
      _resources.ammo = Math.min(AMMO_START, _resources.ammo + 100);
      _resources.fuel = Math.min(100, _resources.fuel + 30);
      _showNotification('+100 AMMO  +30% FUEL', '#44ff88');
    } else {
      _resources.food = Math.min(100, _resources.food + 25);
      _resources.water = Math.min(100, _resources.water + 25);
      _resources.medical = Math.min(MEDICAL_START + 10, _resources.medical + 5);
      _showNotification('+FOOD +WATER +5 MED KITS', '#44ff88');
    }
    _removeCrate(crate);
  }

  function _removeCrate(crate) {
    if (crate.removed) return;
    crate.removed = true;
    if (_scene) {
      if (crate.mesh) _scene.remove(crate.mesh);
      if (crate.light) _scene.remove(crate.light);
    }
  }

  /* ── Supply convoy ───────────────────────────────────────────────── */
  function _callConvoy() {
    if (_convoy) return;
    if (_convoyCallCooldown > 0) {
      _showNotification('CONVOY COOLDOWN: ' + Math.ceil(_convoyCallCooldown) + 's', '#ffaa44');
      return;
    }

    if (!_scene) return;

    // Spawn truck at random map edge, drive 30 units inward
    var edge = Math.floor(Math.random() * 4);  // 0=N 1=E 2=S 3=W
    var startX, startZ, dirX, dirZ;
    var MAP_EDGE = 60;

    if (edge === 0) { startX =  Math.random() * 40 - 20; startZ = -MAP_EDGE; dirX = 0;  dirZ =  1; }
    else if (edge === 1) { startX =  MAP_EDGE; startZ =  Math.random() * 40 - 20; dirX = -1; dirZ = 0;  }
    else if (edge === 2) { startX =  Math.random() * 40 - 20; startZ =  MAP_EDGE; dirX = 0;  dirZ = -1; }
    else                 { startX = -MAP_EDGE; startZ =  Math.random() * 40 - 20; dirX =  1; dirZ = 0;  }

    var stopX = startX + dirX * CONVOY_DRIVE_DIST;
    var stopZ = startZ + dirZ * CONVOY_DRIVE_DIST;

    var truckMesh = _buildTruckMesh();
    truckMesh.position.set(startX, 0, startZ);

    // Orient truck toward destination
    truckMesh.rotation.y = Math.atan2(dirX, dirZ);

    _scene.add(truckMesh);

    _convoy = {
      mesh:      truckMesh,
      startX:    startX,
      startZ:    startZ,
      stopX:     stopX,
      stopZ:     stopZ,
      dirX:      dirX,
      dirZ:      dirZ,
      state:     'driving',   // 'driving' | 'stopped' | 'departing'
      speed:     12,
      resupplied: false
    };

    _convoyStopTimer    = 0;
    _convoyDeparting    = false;
    _convoyCallCooldown = 120;   // 2-minute cooldown between manual calls

    _showNotification('🚚 SUPPLY CONVOY INBOUND — REACH TRUCK IN 15s!', '#44aaff');
  }

  function _departConvoy() {
    if (!_convoy) return;
    _convoyDeparting = true;
    _convoy.state    = 'departing';
    _showNotification('SUPPLY CONVOY DEPARTING', '#ffaa44');
  }

  function _destroyConvoy() {
    if (!_convoy) return;
    if (_scene && _convoy.mesh) _scene.remove(_convoy.mesh);
    _convoy = null;
    _convoyDeparting = false;
    _convoyStopTimer = 0;
  }

  function _resupplyFromTruck(playerRef) {
    if (!_convoy || _convoy.state !== 'stopped') return;
    if (_convoy.resupplied) {
      _showNotification('ALREADY RESUPPLIED FROM THIS CONVOY', '#aaaaaa');
      return;
    }
    _resources.ammo    = AMMO_START;
    _resources.fuel    = 100;
    _resources.food    = 100;
    _resources.water   = 100;
    _resources.medical = Math.min(_resources.medical + 3, MEDICAL_START + 10);
    _convoy.resupplied = true;

    // Award score
    try {
      if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.addScore === 'function') {
        window.GameState.addScore(150);
      } else if (typeof window !== 'undefined' && typeof window.score === 'number') {
        window.score = (window.score || 0) + 150;
      }
    } catch (e) {}

    _showNotification('✅ FULL RESUPPLY COMPLETE! +150 SCORE', '#44ff88');
    _departConvoy();
  }

  /* ── Notification helper ─────────────────────────────────────────── */
  function _showNotification(msg, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast(msg, 4000, color || '#ffffff');
        return;
      }
    } catch (e) {}
    // Fallback DOM toast
    if (typeof document === 'undefined') return;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:' + (color || '#fff'),
      'padding:8px 18px',
      'border-radius:4px',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'z-index:9998',
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    var startTime = Date.now();
    var removeEl = function () {
      var age = (Date.now() - startTime) / 1000;
      if (age >= 3.5) {
        if (el.parentNode) el.parentNode.removeChild(el);
      } else {
        requestAnimationFrame(removeEl);
      }
    };
    requestAnimationFrame(removeEl);
  }

  /* ── Depletion effects ───────────────────────────────────────────── */
  function _applyDepletionEffects() {
    // fuel=0 → vehicles disabled (set flag other systems can check)
    _vehiclesDisabled = (_resources.fuel <= 0);

    // food/water <20% → player speed penalty + regen disabled
    var lowSustain = (_resources.food < 20 || _resources.water < 20);
    if (_playerRef) {
      if (lowSustain) {
        _playerRef._logisticsSpeedPenalty = 0.9;  // -10%
        _playerRef._logisticsRegenDisabled = true;
      } else {
        _playerRef._logisticsSpeedPenalty = 1.0;
        _playerRef._logisticsRegenDisabled = false;
      }
    }

    // food=0 → -1 HP every 10s
    if (_resources.food <= 0 && _playerRef) {
      _starvationTimer += _lastDelta;
      if (_starvationTimer >= 10) {
        _starvationTimer = 0;
        _playerRef.hp = Math.max(0, (_playerRef.hp || 0) - 1);
      }
    } else {
      _starvationTimer = 0;
    }
  }

  var _vehiclesDisabled = false;
  var _starvationTimer  = 0;
  var _lastDelta        = 0;

  /* ── Critical logistics alert ────────────────────────────────────── */
  function _checkCritical() {
    var wasActive = _emergencyAlertActive;
    _emergencyAlertActive = (
      _resources.ammo    <= 0 ||
      _resources.fuel    <= 0 ||
      _resources.food    <= 0 ||
      _resources.water   <= 0 ||
      _resources.medical <= 0
    );

    if (_emergencyAlertActive && !wasActive) {
      // Just became critical — start auto convoy countdown
      _emergencyConvoyTimer = EMERGENCY_CONVOY_DELAY;
    }

    if (_criticalEl) {
      _criticalEl.style.display = _emergencyAlertActive ? 'block' : 'none';
    }
  }

  /* ── Keyboard handling ───────────────────────────────────────────── */
  function _setupKeys() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', function (e) {
      if (e.key === 'l' || e.key === 'L') {
        if (!_lKeyWasDown) {
          _lKeyWasDown = true;
          _callConvoy();
        }
      }
      if (e.key === 'e' || e.key === 'E') {
        _eKeyWasDown = true;
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.key === 'l' || e.key === 'L') _lKeyWasDown = false;
      if (e.key === 'e' || e.key === 'E') _eKeyWasDown = false;
    });
  }

  /* ── Init ────────────────────────────────────────────────────────── */
  function init(scene, playerRef) {
    _scene     = scene;
    _playerRef = playerRef || null;

    _resources.ammo    = AMMO_START;
    _resources.fuel    = FUEL_START;
    _resources.food    = FOOD_START;
    _resources.water   = WATER_START;
    _resources.medical = MEDICAL_START;

    _time              = 0;
    _fuelTimer         = FUEL_DRAIN_INTERVAL;
    _foodTimer         = FOOD_DRAIN_INTERVAL;
    _crateSpawnTimer   = CRATE_SPAWN_INTERVAL;
    _convoyCallCooldown = 0;
    _convoyDeparting   = false;
    _convoy            = null;
    _supplyCrates      = [];
    _emergencyAlertActive = false;
    _emergencyConvoyTimer = 0;
    _vehiclesDisabled  = false;
    _starvationTimer   = 0;
    _explosionLights   = [];
    _interdictions     = [];

    _buildHUD();
    _setupKeys();
  }

  /* ── Update ──────────────────────────────────────────────────────── */
  function update(delta, playerPos) {
    _lastDelta = delta;
    _time += delta;

    // Update explosion lights
    for (var eli = _explosionLights.length - 1; eli >= 0; eli--) {
      _explosionLights[eli](delta);
    }

    // Handle interdiction delays
    for (var ii = _interdictions.length - 1; ii >= 0; ii--) {
      var interd = _interdictions[ii];
      if (interd.done) { _interdictions.splice(ii, 1); continue; }
      interd.elapsed += delta;
      if (interd.elapsed >= interd.delay) {
        interd.done = true;
        _spawnExplosion(new THREE.Vector3(interd.x, 0.5, interd.z));
        _interdictions.splice(ii, 1);
      }
    }

    /* ── Resource drain timers ── */
    // Fuel: drain 1% every 30s when vehicle is active
    if (_vehicleActive && _resources.fuel > 0) {
      _fuelTimer -= delta;
      if (_fuelTimer <= 0) {
        _fuelTimer = FUEL_DRAIN_INTERVAL;
        _resources.fuel = Math.max(0, _resources.fuel - 1);
      }
    }

    // Food and water: drain 5% every 2 minutes
    _foodTimer -= delta;
    if (_foodTimer <= 0) {
      _foodTimer = FOOD_DRAIN_INTERVAL;
      _resources.food  = Math.max(0, _resources.food  - FOOD_DRAIN_AMOUNT);
      _resources.water = Math.max(0, _resources.water - FOOD_DRAIN_AMOUNT);
    }

    /* ── Convoy cooldown ── */
    if (_convoyCallCooldown > 0) {
      _convoyCallCooldown = Math.max(0, _convoyCallCooldown - delta);
    }

    /* ── Crate spawn timer ── */
    _crateSpawnTimer -= delta;
    if (_crateSpawnTimer <= 0) {
      _crateSpawnTimer = CRATE_SPAWN_INTERVAL;
      _spawnSupplyCrate();
    }

    /* ── Crate pulsing and collection ── */
    for (var ci = _supplyCrates.length - 1; ci >= 0; ci--) {
      var crate = _supplyCrates[ci];
      if (crate.removed) { _supplyCrates.splice(ci, 1); continue; }

      crate.pulseTime += delta;
      if (crate.light) {
        crate.light.intensity = 0.8 + 0.4 * Math.sin(crate.pulseTime * 3);
      }

      if (playerPos) {
        var cdx = playerPos.x - crate.x;
        var cdz = playerPos.z - crate.z;
        var cdist = Math.sqrt(cdx * cdx + cdz * cdz);
        if (cdist < CRATE_COLLECT_RADIUS) {
          // Auto-collect on walk-over, or E key press
          if (cdist < 1.5 || _eKeyWasDown) {
            _collectCrate(crate, _playerRef);
            _supplyCrates.splice(ci, 1);
          }
        }
      }
    }

    /* ── Convoy update ── */
    if (_convoy) {
      var truck = _convoy;
      if (truck.state === 'driving') {
        // Move truck toward stop point
        var tdx = truck.stopX - truck.mesh.position.x;
        var tdz = truck.stopZ - truck.mesh.position.z;
        var tdist = Math.sqrt(tdx * tdx + tdz * tdz);
        if (tdist < 1.0) {
          truck.state = 'stopped';
          _convoyStopTimer = 0;
          truck.mesh.position.set(truck.stopX, 0, truck.stopZ);
        } else {
          var tspeed = truck.speed * delta;
          var tnorm  = tspeed / tdist;
          truck.mesh.position.x += tdx * tnorm;
          truck.mesh.position.z += tdz * tnorm;
        }
      } else if (truck.state === 'stopped') {
        _convoyStopTimer += delta;

        // Check player proximity for E-key resupply
        if (playerPos) {
          var pdx = playerPos.x - truck.mesh.position.x;
          var pdz = playerPos.z - truck.mesh.position.z;
          var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
          if (pdist < TRUCK_COLLECT_RADIUS && _eKeyWasDown) {
            _resupplyFromTruck(_playerRef);
          }
        }

        if (_convoyStopTimer >= CONVOY_STOP_DURATION) {
          if (!truck.resupplied) {
            _showNotification('CONVOY DEPARTED — MISSED RESUPPLY WINDOW', '#ff6644');
          }
          _departConvoy();
        }
      } else if (truck.state === 'departing') {
        // Drive back toward spawn edge
        var rx2 = truck.startX - truck.mesh.position.x;
        var rz2 = truck.startZ - truck.mesh.position.z;
        var rdist = Math.sqrt(rx2 * rx2 + rz2 * rz2);
        if (rdist < 2.0) {
          _destroyConvoy();
        } else {
          var rspeed = truck.speed * delta;
          var rnorm  = rspeed / rdist;
          truck.mesh.position.x += rx2 * rnorm;
          truck.mesh.position.z += rz2 * rnorm;
        }
      }
    }

    /* ── Depletion effects ── */
    _applyDepletionEffects();

    /* ── Critical check + emergency auto-convoy ── */
    _checkCritical();

    if (_emergencyAlertActive) {
      _emergencyPulseTime += delta;
      if (_criticalEl) {
        var pulse = Math.abs(Math.sin(_emergencyPulseTime * 3));
        _criticalEl.style.opacity = String(0.5 + 0.5 * pulse);
        _criticalEl.style.borderColor = 'rgba(' + Math.round(255) + ',' + Math.round(pulse * 80) + ',' + Math.round(pulse * 80) + ',1)';
      }

      if (_emergencyConvoyTimer > 0) {
        _emergencyConvoyTimer -= delta;
        if (_emergencyConvoyTimer <= 0 && !_convoy) {
          _showNotification('🚚 AUTO EMERGENCY CONVOY DISPATCHED!', '#ff4444');
          _callConvoy();
        }
      }
    }

    /* ── HUD refresh ── */
    _renderHUD();
  }

  /* ── Reset ───────────────────────────────────────────────────────── */
  function reset() {
    // Remove all crates
    for (var ci = 0; ci < _supplyCrates.length; ci++) {
      _removeCrate(_supplyCrates[ci]);
    }
    _supplyCrates = [];

    // Remove convoy truck
    _destroyConvoy();

    // Remove explosion lights
    _explosionLights = [];
    _interdictions   = [];

    // Reset resources
    _resources.ammo    = AMMO_START;
    _resources.fuel    = FUEL_START;
    _resources.food    = FOOD_START;
    _resources.water   = WATER_START;
    _resources.medical = MEDICAL_START;

    _time               = 0;
    _fuelTimer          = FUEL_DRAIN_INTERVAL;
    _foodTimer          = FOOD_DRAIN_INTERVAL;
    _crateSpawnTimer    = CRATE_SPAWN_INTERVAL;
    _convoyCallCooldown = 0;
    _convoyDeparting    = false;
    _emergencyAlertActive = false;
    _emergencyConvoyTimer = 0;
    _vehiclesDisabled   = false;
    _starvationTimer    = 0;
    _lastDelta          = 0;

    if (_criticalEl) _criticalEl.style.display = 'none';
    _renderHUD();
  }

  /* ── Public API ──────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset,

    // Ammo hook — called by weapons system on each shot
    consumeAmmo: function (n) {
      _resources.ammo = Math.max(0, _resources.ammo - (n || 1));
    },

    // Can the player shoot?
    canShoot: function () {
      return _resources.ammo > 0;
    },

    // Are vehicles disabled (fuel=0)?
    vehiclesDisabled: function () {
      return _vehiclesDisabled;
    },

    // Set whether a vehicle is currently active (affects fuel drain)
    setVehicleActive: function (active) {
      _vehicleActive = !!active;
    },

    // Expose resource values for external HUD / systems
    getResources: function () {
      return {
        ammo:    _resources.ammo,
        fuel:    _resources.fuel,
        food:    _resources.food,
        water:   _resources.water,
        medical: _resources.medical
      };
    },

    // Manually call supply convoy (same as L key)
    callConvoy: function () {
      _callConvoy();
    },

    // Check if an active convoy is waiting
    hasActiveConvoy: function () {
      return !!_convoy;
    },

    // Check critical state
    isCritical: function () {
      return _emergencyAlertActive;
    }
  };
})();
