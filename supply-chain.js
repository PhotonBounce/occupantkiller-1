window.SupplyChain = (function () {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────────────────
  var RESOURCE = {
    AMMO: 'AMMO',
    FUEL: 'FUEL',
    MEDICAL: 'MEDICAL',
    PARTS: 'PARTS'
  };

  var MAX_STOCK = 20;
  var CACHE_BONUS = 3;
  var DELIVERY_TIME = 30;        // seconds
  var UNLOAD_TIME = 5;           // seconds
  var ENEMY_TRUCK_INTERVAL = 90; // seconds
  var ENEMY_DEBUFF_DURATION = 60;// seconds

  var RESOURCE_COLORS = {};
  RESOURCE_COLORS[RESOURCE.AMMO]    = 0xffcc00;
  RESOURCE_COLORS[RESOURCE.FUEL]    = 0x00cc44;
  RESOURCE_COLORS[RESOURCE.MEDICAL] = 0xff4444;
  RESOURCE_COLORS[RESOURCE.PARTS]   = 0x4499ff;

  var RESOURCE_ICONS = {};
  RESOURCE_ICONS[RESOURCE.AMMO]    = '🔴';
  RESOURCE_ICONS[RESOURCE.FUEL]    = '⛽';
  RESOURCE_ICONS[RESOURCE.MEDICAL] = '🏥';
  RESOURCE_ICONS[RESOURCE.PARTS]   = '🔧';

  // ─── Module state ────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _inited   = false;

  // Stock levels
  var _stock = {};
  _stock[RESOURCE.AMMO]    = 10;
  _stock[RESOURCE.FUEL]    = 10;
  _stock[RESOURCE.MEDICAL] = 10;
  _stock[RESOURCE.PARTS]   = 10;

  // Degradation flags
  var _degraded = {};
  _degraded[RESOURCE.AMMO]    = false;
  _degraded[RESOURCE.FUEL]    = false;
  _degraded[RESOURCE.MEDICAL] = false;
  _degraded[RESOURCE.PARTS]   = false;

  // Delivery state
  var _pendingDelivery = null;
  // { type, qty, timeLeft, truck, state: 'incoming'|'unloading'|'outgoing', unloadTimer }

  // Enemy supply truck state
  var _enemyTruckTimer   = 0;
  var _enemyTruck        = null;
  var _enemyDebuffActive = false;
  var _enemyDebuffTimer  = 0;

  // Three.js objects
  var _depotGroup      = null;
  var _stockpileGroups = {};
  var _cacheObjects    = [];
  var _hudEl           = null;
  var _panelEl         = null;
  var _panelOpen       = false;

  // ─── Geometry helpers ────────────────────────────────────────────────────────
  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.roughness !== undefined) params.roughness = opts.roughness;
      if (opts.metalness !== undefined) params.metalness = opts.metalness;
      if (opts.transparent !== undefined) params.transparent = opts.transparent;
      if (opts.opacity !== undefined) params.opacity = opts.opacity;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function box(w, h, d, color, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  // ─── Depot (warehouse) ───────────────────────────────────────────────────────
  function buildDepot() {
    _depotGroup = new THREE.Group();
    _depotGroup.name = 'supply_depot';

    // Main building body: 12×4×8 (w×h×d), corrugated metal look (dark grey)
    var body = box(12, 4, 8, 0x888888);
    body.position.set(0, 2, 0);
    _depotGroup.add(body);

    // Flat roof (slightly lighter, overhangs by 0.3 on each side)
    var roof = box(12.6, 0.3, 8.6, 0x999999);
    roof.position.set(0, 4.15, 0);
    _depotGroup.add(roof);

    // Corrugation strips on front face (decorative boxes)
    for (var i = -5; i <= 5; i += 2) {
      var strip = box(0.15, 4, 0.12, 0x777777);
      strip.position.set(i, 2, 4.06);
      _depotGroup.add(strip);
    }

    // Roll-up door (dark)
    var door = box(3, 3, 0.1, 0x555555);
    door.position.set(0, 1.5, 4.1);
    _depotGroup.add(door);

    // Door frame
    var doorFrame = box(3.2, 3.2, 0.08, 0x333333);
    doorFrame.position.set(0, 1.6, 4.12);
    _depotGroup.add(doorFrame);

    // Small side window
    var win = box(1.2, 0.8, 0.08, 0x88ccff);
    win.position.set(4.5, 2.8, 4.1);
    _depotGroup.add(win);

    // Place depot near world origin, slightly offset
    _depotGroup.position.set(5, 0, 5);
    _scene.add(_depotGroup);
  }

  // ─── Resource stockpile crates ───────────────────────────────────────────────
  function buildStockpiles() {
    var corners = [
      { x: -6, z: -4, type: RESOURCE.AMMO    },
      { x:  6, z: -4, type: RESOURCE.FUEL     },
      { x: -6, z:  4, type: RESOURCE.MEDICAL  },
      { x:  6, z:  4, type: RESOURCE.PARTS    }
    ];

    for (var i = 0; i < corners.length; i++) {
      var c = corners[i];
      var grp = new THREE.Group();
      grp.name = 'stockpile_' + c.type;

      // Stack of crates (max 5 visible)
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 2; col++) {
          var crate = box(0.9, 0.9, 0.9, RESOURCE_COLORS[c.type]);
          crate.position.set(col * 1 - 0.5, row * 1 + 0.45, 0);
          grp.add(crate);
        }
      }

      // Label plate
      var plate = box(1.8, 0.4, 0.05, 0x222222);
      plate.position.set(0, 3.3, 0.5);
      grp.add(plate);

      // World position: depot is at (5,0,5), corners relative to depot center
      grp.position.set(5 + c.x, 0, 5 + c.z);
      _scene.add(grp);
      _stockpileGroups[c.type] = grp;
    }
  }

  // ─── Update stockpile visual scale based on stock level ──────────────────────
  function refreshStockpileVisuals() {
    var types = [RESOURCE.AMMO, RESOURCE.FUEL, RESOURCE.MEDICAL, RESOURCE.PARTS];
    for (var i = 0; i < types.length; i++) {
      var t = types[i];
      var grp = _stockpileGroups[t];
      if (!grp) continue;
      var ratio = Math.max(0, _stock[t] / MAX_STOCK);
      grp.scale.set(1, Math.max(0.05, ratio), 1);
    }
  }

  // ─── Supply caches (scattered collectibles) ───────────────────────────────────
  function buildCaches() {
    var positions = [
      { x: -30, z:  20 },
      { x:  25, z: -35 },
      { x:  40, z:  30 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var grp = new THREE.Group();
      grp.name = 'supply_cache_' + i;

      var body2 = box(1.2, 0.8, 1.2, 0x8B6914);
      body2.position.set(0, 0.4, 0);
      grp.add(body2);

      var lid = box(1.3, 0.2, 1.3, 0x7a5c10);
      lid.position.set(0, 0.9, 0);
      grp.add(lid);

      // White cross marker on top
      var crossH = box(0.8, 0.06, 0.2, 0xffffff);
      crossH.position.set(0, 1.03, 0);
      grp.add(crossH);
      var crossV = box(0.2, 0.06, 0.8, 0xffffff);
      crossV.position.set(0, 1.03, 0);
      grp.add(crossV);

      grp.position.set(p.x, 0, p.z);
      grp.userData.collected = false;
      grp.userData.bobOffset = i * 2.1;
      _scene.add(grp);
      _cacheObjects.push(grp);
    }
  }

  // ─── Truck mesh builder ───────────────────────────────────────────────────────
  function buildTruck(isEnemy) {
    var khaki    = isEnemy ? 0x8b3a3a : 0x78866b;
    var darkKhaki = isEnemy ? 0x6b2a2a : 0x5a6650;

    var grp = new THREE.Group();
    grp.name = isEnemy ? 'enemy_supply_truck' : 'friendly_supply_truck';

    // Cab
    var cab = box(2.2, 1.8, 2.4, khaki);
    cab.position.set(-1.5, 1.3, 0);
    grp.add(cab);

    // Cab roof
    var cabRoof = box(2.2, 0.5, 2.4, darkKhaki);
    cabRoof.position.set(-1.5, 2.35, 0);
    grp.add(cabRoof);

    // Windshield
    var glass = box(0.05, 1.0, 1.8, 0x88ccff, { transparent: true, opacity: 0.5 });
    glass.position.set(-0.38, 1.5, 0);
    grp.add(glass);

    // Flatbed
    var bed = box(4.0, 0.3, 2.4, darkKhaki);
    bed.position.set(1.0, 0.55, 0);
    grp.add(bed);

    // Bed sides
    var sideL = box(4.0, 0.8, 0.1, khaki);
    sideL.position.set(1.0, 0.95, -1.25);
    grp.add(sideL);
    var sideR = box(4.0, 0.8, 0.1, khaki);
    sideR.position.set(1.0, 0.95, 1.25);
    grp.add(sideR);
    var sideBack = box(0.1, 0.8, 2.4, khaki);
    sideBack.position.set(3.05, 0.95, 0);
    grp.add(sideBack);

    // 4 wheels (cylinder)
    var wheelPositions = [
      { x: -1.8, z: -1.3 },
      { x: -1.8, z:  1.3 },
      { x:  1.5, z: -1.3 },
      { x:  1.5, z:  1.3 }
    ];
    for (var i = 0; i < wheelPositions.length; i++) {
      var wp = wheelPositions[i];
      var wheel = cyl(0.4, 0.4, 0.35, 12, 0x222222);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wp.x, 0.4, wp.z);
      grp.add(wheel);

      // Hub cap
      var hub = cyl(0.15, 0.15, 0.36, 8, 0x888888);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(wp.x, 0.4, wp.z);
      grp.add(hub);
    }

    // Headlights (front = negative X side of cab)
    var hl1 = box(0.25, 0.25, 0.25, 0xffffcc);
    hl1.position.set(-2.62, 1.1, -0.6);
    grp.add(hl1);
    var hl2 = box(0.25, 0.25, 0.25, 0xffffcc);
    hl2.position.set(-2.62, 1.1,  0.6);
    grp.add(hl2);

    // Headlight point lights
    if (!isEnemy) {
      var light1 = new THREE.PointLight(0xffffcc, 0.6, 8);
      light1.position.set(-2.7, 1.1, -0.6);
      grp.add(light1);
      var light2 = new THREE.PointLight(0xffffcc, 0.6, 8);
      light2.position.set(-2.7, 1.1,  0.6);
      grp.add(light2);
    }

    return grp;
  }

  // ─── Delivery logic ───────────────────────────────────────────────────────────
  function startDelivery(type, qty) {
    if (_pendingDelivery) return; // already one in flight

    var truck = buildTruck(false);
    // Spawn at map edge (far negative X)
    truck.position.set(-80, 0, 5);
    // Rotate so cab faces positive X (toward depot)
    truck.rotation.y = 0;
    _scene.add(truck);

    _pendingDelivery = {
      type:        type,
      qty:         qty,
      timeLeft:    DELIVERY_TIME,
      truck:       truck,
      state:       'incoming',
      unloadTimer: 0
    };

    showToast('DELIVERY DISPATCHED: ' + qty + 'x ' + type + ' (' + DELIVERY_TIME + 's ETA)');
    refreshHUD();
  }

  function updateDelivery(delta) {
    if (!_pendingDelivery) return;

    var d = _pendingDelivery;

    if (d.state === 'incoming') {
      d.timeLeft -= delta;
      // Drive truck toward depot
      var target = 5 + (-2.6); // depot X minus a little
      if (d.truck.position.x < target) {
        d.truck.position.x += 12 * delta;
      }

      if (d.timeLeft <= 0) {
        d.truck.position.x = target;
        d.state       = 'unloading';
        d.unloadTimer = UNLOAD_TIME;
        showToast('UNLOADING: ' + d.qty + 'x ' + d.type + '...');
        animateTruckUnload(d);
      }
    } else if (d.state === 'unloading') {
      d.unloadTimer -= delta;
      if (d.unloadTimer <= 0) {
        // Add resources
        addResource(d.type, d.qty);
        d.state = 'outgoing';
        showToast('DELIVERY COMPLETE: +' + d.qty + ' ' + d.type);
      }
    } else if (d.state === 'outgoing') {
      // Drive truck away (positive X, off map)
      d.truck.rotation.y = Math.PI;
      d.truck.position.x += 15 * delta;
      if (d.truck.position.x > 100) {
        _scene.remove(d.truck);
        disposeMesh(d.truck);
        _pendingDelivery = null;
      }
    }
  }

  function animateTruckUnload(delivery) {
    // Spawn crate-drop effect: 3 boxes fall off flatbed
    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var crate = box(0.8, 0.8, 0.8, RESOURCE_COLORS[delivery.type]);
        crate.position.set(
          delivery.truck.position.x + 0.5 + idx * 0.3,
          2.5,
          delivery.truck.position.z + (idx - 1) * 0.5
        );
        crate.userData.fallSpeed = 0;
        crate.userData.isFalling = true;
        _scene.add(crate);
        // Simple gravity fall handled in update via _fallingCrates
        _fallingCrates.push(crate);
      })(i);
    }
  }

  var _fallingCrates = [];

  function updateFallingCrates(delta) {
    for (var i = _fallingCrates.length - 1; i >= 0; i--) {
      var c = _fallingCrates[i];
      if (!c.userData.isFalling) continue;
      c.userData.fallSpeed = (c.userData.fallSpeed || 0) + 9.8 * delta;
      c.position.y -= c.userData.fallSpeed * delta;
      if (c.position.y <= 0.4) {
        c.position.y = 0.4;
        c.userData.isFalling = false;
        // Remove after 5 s — store timestamp
        c.userData.removeAt = _elapsed + 5;
      }
      if (c.userData.removeAt && _elapsed > c.userData.removeAt) {
        _scene.remove(c);
        disposeMesh(c);
        _fallingCrates.splice(i, 1);
      }
    }
  }

  var _elapsed = 0;

  // ─── Enemy supply truck ───────────────────────────────────────────────────────
  function spawnEnemyTruck() {
    if (_enemyTruck) return;
    var truck = buildTruck(true);
    truck.position.set(80, 0, -40);
    truck.rotation.y = Math.PI; // faces negative X
    _scene.add(truck);
    _enemyTruck = { mesh: truck, alive: true, progress: 0 };
    showToast('ENEMY SUPPLY TRUCK SPOTTED — intercept to degrade enemy!');
  }

  function updateEnemyTruck(delta) {
    _enemyTruckTimer += delta;
    if (_enemyTruckTimer >= ENEMY_TRUCK_INTERVAL && !_enemyTruck) {
      _enemyTruckTimer = 0;
      spawnEnemyTruck();
    }

    if (_enemyTruck && _enemyTruck.alive) {
      // Drives across the map on a fixed path
      _enemyTruck.progress += delta;
      _enemyTruck.mesh.position.x = 80 - _enemyTruck.progress * 10;
      if (_enemyTruck.mesh.position.x < -80) {
        // Left the map
        _scene.remove(_enemyTruck.mesh);
        disposeMesh(_enemyTruck.mesh);
        _enemyTruck = null;
      }
    }

    if (_enemyDebuffActive) {
      _enemyDebuffTimer -= delta;
      if (_enemyDebuffTimer <= 0) {
        _enemyDebuffActive = false;
        showToast('ENEMY SUPPLY RESTORED — enemy units back to normal');
      }
    }
  }

  // Call this from external game logic when player destroys the enemy truck
  function destroyEnemyTruck() {
    if (!_enemyTruck || !_enemyTruck.alive) return false;
    _enemyTruck.alive = false;
    _scene.remove(_enemyTruck.mesh);
    disposeMesh(_enemyTruck.mesh);
    _enemyTruck       = null;
    _enemyDebuffActive = true;
    _enemyDebuffTimer  = ENEMY_DEBUFF_DURATION;
    showToast('ENEMY SUPPLY DESTROYED! Enemy degraded for ' + ENEMY_DEBUFF_DURATION + 's!');
    return true;
  }

  // ─── Resource management ─────────────────────────────────────────────────────
  function addResource(type, n) {
    if (!_stock.hasOwnProperty(type)) return;
    _stock[type] = Math.min(MAX_STOCK, _stock[type] + n);
    _degraded[type] = false;
    refreshStockpileVisuals();
    refreshHUD();
  }

  function consumeResource(type, n) {
    if (!_stock.hasOwnProperty(type)) return;
    _stock[type] = Math.max(0, _stock[type] - n);
    if (_stock[type] === 0 && !_degraded[type]) {
      _degraded[type] = true;
      showCriticalToast(type);
    }
    refreshStockpileVisuals();
    refreshHUD();
  }

  function getStock(type) {
    return _stock[type] !== undefined ? _stock[type] : 0;
  }

  // ─── Cache collection ─────────────────────────────────────────────────────────
  function checkCacheCollection() {
    if (!_camera) return;
    var playerPos = _camera.position;
    for (var i = 0; i < _cacheObjects.length; i++) {
      var cache = _cacheObjects[i];
      if (cache.userData.collected) continue;
      var dx = playerPos.x - cache.position.x;
      var dz = playerPos.z - cache.position.z;
      if (dx * dx + dz * dz < 4) {
        cache.userData.collected = true;
        cache.visible = false;
        var types  = [RESOURCE.AMMO, RESOURCE.FUEL, RESOURCE.MEDICAL, RESOURCE.PARTS];
        var rndType = types[Math.floor(Math.random() * types.length)];
        addResource(rndType, CACHE_BONUS);
        showToast('SUPPLY CACHE COLLECTED: +' + CACHE_BONUS + ' ' + rndType);
      }
    }
  }

  // ─── Cache bob animation ──────────────────────────────────────────────────────
  function updateCacheBob(elapsed) {
    for (var i = 0; i < _cacheObjects.length; i++) {
      var cache = _cacheObjects[i];
      if (!cache.userData.collected) {
        cache.position.y = Math.sin(elapsed * 1.5 + cache.userData.bobOffset) * 0.2 + 0.3;
        cache.rotation.y = elapsed * 0.6 + cache.userData.bobOffset;
      }
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────────
  function buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'supply-chain-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'border:1px solid #444',
      'border-radius:6px',
      'padding:8px 16px',
      'display:flex',
      'gap:18px',
      'align-items:center',
      'z-index:9000',
      'font-family:monospace',
      'font-size:12px',
      'color:#eee',
      'pointer-events:none',
      'user-select:none'
    ].join(';');

    document.body.appendChild(_hudEl);
    refreshHUD();
  }

  function refreshHUD() {
    if (!_hudEl) return;
    var types = [RESOURCE.AMMO, RESOURCE.FUEL, RESOURCE.MEDICAL, RESOURCE.PARTS];
    var html  = '';

    for (var i = 0; i < types.length; i++) {
      var t     = types[i];
      var cur   = _stock[t];
      var pct   = Math.round((cur / MAX_STOCK) * 100);
      var isDeg = _degraded[t];
      var barColor = isDeg ? '#ff3333' : barColorForType(t);
      var requestStr = '';

      if (_pendingDelivery && _pendingDelivery.type === t) {
        var d = _pendingDelivery;
        if (d.state === 'incoming') {
          requestStr = ' <span style="color:#ffcc00">[ETA ' + Math.ceil(d.timeLeft) + 's]</span>';
        } else if (d.state === 'unloading') {
          requestStr = ' <span style="color:#66ff66">[UNLOADING]</span>';
        }
      }

      html += '<div style="display:flex;flex-direction:column;align-items:center;min-width:70px">';
      html += '<span>' + t + requestStr + '</span>';
      html += '<div style="background:#333;width:64px;height:8px;border-radius:4px;overflow:hidden;margin:2px 0">';
      html += '<div style="background:' + barColor + ';width:' + pct + '%;height:100%;transition:width 0.3s"></div>';
      html += '</div>';
      html += '<span style="color:' + (isDeg ? '#ff3333' : '#aaa') + '">' + cur + '/' + MAX_STOCK + (isDeg ? ' !' : '') + '</span>';
      html += '</div>';
    }

    // Enemy debuff indicator
    if (_enemyDebuffActive) {
      html += '<div style="color:#ff6600;border-left:1px solid #555;padding-left:12px">';
      html += 'ENEMY DEGRADED<br>' + Math.ceil(_enemyDebuffTimer) + 's';
      html += '</div>';
    }

    // [O] hint
    html += '<div style="border-left:1px solid #555;padding-left:12px;color:#888">[O] Logistics</div>';

    _hudEl.innerHTML = html;
  }

  function barColorForType(t) {
    var colors = {};
    colors[RESOURCE.AMMO]    = '#ffcc00';
    colors[RESOURCE.FUEL]    = '#00cc44';
    colors[RESOURCE.MEDICAL] = '#ff4466';
    colors[RESOURCE.PARTS]   = '#4499ff';
    return colors[t] || '#aaa';
  }

  // ─── Logistics panel ──────────────────────────────────────────────────────────
  function buildPanel() {
    _panelEl = document.createElement('div');
    _panelEl.id = 'supply-chain-panel';
    _panelEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(5,15,5,0.95)',
      'border:2px solid #446644',
      'border-radius:8px',
      'padding:24px 32px',
      'z-index:9100',
      'font-family:monospace',
      'color:#ccffcc',
      'min-width:320px',
      'display:none'
    ].join(';');

    _panelEl.innerHTML = buildPanelHTML();
    document.body.appendChild(_panelEl);
  }

  function buildPanelHTML() {
    var types = [RESOURCE.AMMO, RESOURCE.FUEL, RESOURCE.MEDICAL, RESOURCE.PARTS];
    var opts  = '';
    for (var i = 0; i < types.length; i++) {
      opts += '<option value="' + types[i] + '">' + types[i] + ' (' + _stock[types[i]] + '/' + MAX_STOCK + ')</option>';
    }

    return [
      '<h3 style="margin:0 0 16px;color:#88ff88;letter-spacing:2px">LOGISTICS PANEL</h3>',
      '<div style="margin-bottom:12px">',
      '  <label>Resource Type<br>',
      '    <select id="sc-res-type" style="margin-top:4px;padding:4px;background:#112211;color:#ccffcc;border:1px solid #446644;width:100%">',
      opts,
      '    </select>',
      '  </label>',
      '</div>',
      '<div style="margin-bottom:12px">',
      '  <label>Quantity: <span id="sc-qty-display">5</span><br>',
      '    <input type="range" id="sc-qty-slider" min="1" max="10" value="5"',
      '      style="width:100%;margin-top:4px">',
      '  </label>',
      '</div>',
      '<div style="margin-bottom:16px;color:#888;font-size:11px">Delivery time: ' + DELIVERY_TIME + 's</div>',
      '<div style="display:flex;gap:10px">',
      '  <button id="sc-request-btn" style="flex:1;padding:8px;background:#226622;color:#ccffcc;border:1px solid #446644;cursor:pointer;font-family:monospace">REQUEST DELIVERY</button>',
      '  <button id="sc-close-btn" style="padding:8px 16px;background:#332222;color:#ffaaaa;border:1px solid #664444;cursor:pointer;font-family:monospace">CLOSE</button>',
      '</div>'
    ].join('');
  }

  function openPanel() {
    if (!_panelEl) return;
    _panelOpen = true;
    _panelEl.innerHTML = buildPanelHTML();
    _panelEl.style.display = 'block';

    var slider  = document.getElementById('sc-qty-slider');
    var display = document.getElementById('sc-qty-display');
    var reqBtn  = document.getElementById('sc-request-btn');
    var closeBtn = document.getElementById('sc-close-btn');

    if (slider && display) {
      slider.addEventListener('input', function () {
        display.textContent = slider.value;
      });
    }

    if (reqBtn) {
      reqBtn.addEventListener('click', function () {
        var typeEl = document.getElementById('sc-res-type');
        var qtyEl  = document.getElementById('sc-qty-slider');
        if (!typeEl || !qtyEl) return;
        if (_pendingDelivery) {
          showToast('A delivery is already in transit!');
        } else {
          startDelivery(typeEl.value, parseInt(qtyEl.value, 10));
        }
        closePanel();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closePanel);
    }

    // Disable pointer lock / game input while panel open
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function closePanel() {
    if (!_panelEl) return;
    _panelOpen = false;
    _panelEl.style.display = 'none';
  }

  // ─── Toast notifications ──────────────────────────────────────────────────────
  var _toastQueue = [];
  var _toastEl    = null;

  function ensureToastEl() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'supply-chain-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:20px',
      'right:20px',
      'z-index:9200',
      'display:flex',
      'flex-direction:column',
      'gap:6px',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_toastEl);
  }

  function showToast(msg, critical) {
    ensureToastEl();
    var el = document.createElement('div');
    el.style.cssText = [
      'background:' + (critical ? 'rgba(180,20,20,0.92)' : 'rgba(20,40,20,0.92)'),
      'color:' + (critical ? '#ffdddd' : '#ccffcc'),
      'border:1px solid ' + (critical ? '#ff4444' : '#446644'),
      'border-radius:4px',
      'padding:7px 14px',
      'font-family:monospace',
      'font-size:13px',
      'letter-spacing:0.5px',
      'opacity:1',
      'transition:opacity 0.5s'
    ].join(';');
    el.textContent = msg;
    _toastEl.appendChild(el);

    // Auto-remove
    var removeDelay = critical ? 5000 : 3500;
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 600);
    }, removeDelay);
  }

  function showCriticalToast(type) {
    showToast('SUPPLY CRITICAL: ' + type + ' — system degraded!', true);
  }

  // ─── Keyboard input ───────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (e.code === 'KeyO' || e.key === 'o' || e.key === 'O') {
      if (_panelOpen) {
        closePanel();
      } else {
        openPanel();
      }
    }
  }

  // ─── Dispose helper ───────────────────────────────────────────────────────────
  function disposeMesh(obj) {
    if (!obj) return;
    obj.traverse(function (child) {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            for (var m = 0; m < child.material.length; m++) child.material[m].dispose();
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  // ─── Public: init ─────────────────────────────────────────────────────────────
  function init(scene, camera) {
    if (_inited) return;
    _scene  = scene;
    _camera = camera;

    buildDepot();
    buildStockpiles();
    buildCaches();
    buildHUD();
    buildPanel();

    document.addEventListener('keydown', onKeyDown);

    _inited = true;
  }

  // ─── Public: update ───────────────────────────────────────────────────────────
  function update(delta) {
    if (!_inited) return;
    _elapsed += delta;

    updateDelivery(delta);
    updateFallingCrates(delta);
    updateEnemyTruck(delta);
    checkCacheCollection();
    updateCacheBob(_elapsed);
    refreshHUD();
  }

  // ─── Public: reset ────────────────────────────────────────────────────────────
  function reset() {
    // Remove 3D objects
    if (_depotGroup)  { _scene.remove(_depotGroup);  disposeMesh(_depotGroup);  _depotGroup = null; }

    var types = [RESOURCE.AMMO, RESOURCE.FUEL, RESOURCE.MEDICAL, RESOURCE.PARTS];
    for (var i = 0; i < types.length; i++) {
      var t = types[i];
      if (_stockpileGroups[t]) {
        _scene.remove(_stockpileGroups[t]);
        disposeMesh(_stockpileGroups[t]);
      }
      _stock[t]   = 10;
      _degraded[t] = false;
    }
    _stockpileGroups = {};

    for (var j = 0; j < _cacheObjects.length; j++) {
      _scene.remove(_cacheObjects[j]);
      disposeMesh(_cacheObjects[j]);
    }
    _cacheObjects = [];

    for (var k = 0; k < _fallingCrates.length; k++) {
      _scene.remove(_fallingCrates[k]);
      disposeMesh(_fallingCrates[k]);
    }
    _fallingCrates = [];

    if (_pendingDelivery && _pendingDelivery.truck) {
      _scene.remove(_pendingDelivery.truck);
      disposeMesh(_pendingDelivery.truck);
    }
    _pendingDelivery = null;

    if (_enemyTruck && _enemyTruck.mesh) {
      _scene.remove(_enemyTruck.mesh);
      disposeMesh(_enemyTruck.mesh);
    }
    _enemyTruck        = null;
    _enemyTruckTimer   = 0;
    _enemyDebuffActive = false;
    _enemyDebuffTimer  = 0;

    // Remove HUD/panel
    if (_hudEl && _hudEl.parentNode)   _hudEl.parentNode.removeChild(_hudEl);
    if (_panelEl && _panelEl.parentNode) _panelEl.parentNode.removeChild(_panelEl);
    if (_toastEl && _toastEl.parentNode) _toastEl.parentNode.removeChild(_toastEl);
    _hudEl   = null;
    _panelEl = null;
    _toastEl = null;
    _panelOpen = false;

    document.removeEventListener('keydown', onKeyDown);

    _elapsed = 0;
    _inited  = false;
  }

  // ─── Expose public API ───────────────────────────────────────────────────────
  return {
    init:              init,
    update:            update,
    reset:             reset,
    addResource:       addResource,
    consumeResource:   consumeResource,
    getStock:          getStock,
    destroyEnemyTruck: destroyEnemyTruck,
    RESOURCE:          RESOURCE
  };

})();
