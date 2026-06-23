window.RadioBeacon = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────

  var BEACON_TYPES = {
    DISTRESS:      'DISTRESS',
    STRIKE_MARKER: 'STRIKE_MARKER',
    SUPPLY_DROP:   'SUPPLY_DROP',
    LZ_MARKER:     'LZ_MARKER',
    JAMMER:        'JAMMER'
  };

  var BEACON_ORDER = [
    BEACON_TYPES.DISTRESS,
    BEACON_TYPES.STRIKE_MARKER,
    BEACON_TYPES.SUPPLY_DROP,
    BEACON_TYPES.LZ_MARKER,
    BEACON_TYPES.JAMMER
  ];

  var BEACON_COLORS = {
    DISTRESS:      0xff2222,
    STRIKE_MARKER: 0x9933ff,
    SUPPLY_DROP:   0xffaa00,
    LZ_MARKER:     0x00ff44,
    JAMMER:        0x0088ff
  };

  var BEACON_ICONS = {
    DISTRESS:      '🆘',
    STRIKE_MARKER: '🎯',
    SUPPLY_DROP:   '📦',
    LZ_MARKER:     '🚁',
    JAMMER:        '📡'
  };

  var BEACON_LABELS = {
    DISTRESS:      'DISTRESS',
    STRIKE_MARKER: 'STRIKE',
    SUPPLY_DROP:   'SUPPLY',
    LZ_MARKER:     'LZ',
    JAMMER:        'JAMMER'
  };

  var MAX_ACTIVE_BEACONS  = 3;
  var BEACON_LIFETIME     = 120;   // seconds
  var BEACON_HP           = 40;
  var BEACON_VISIBLE_DIST = 40;    // units
  var RETRIEVAL_DIST      = 3;     // units
  var COMBO_DIST          = 10;    // units for same-type combo
  var BATTERY_EXTEND      = 60;    // seconds on retrieval
  var RING_INTERVAL       = 2.0;   // seconds between ring pulses
  var LED_BLINK_RATE      = 0.5;   // seconds per state
  var JAMMER_RADIUS       = 25;

  var EFFECT_DELAY = {
    DISTRESS:      20,
    STRIKE_MARKER: 30,
    SUPPLY_DROP:   45,
    LZ_MARKER:     0,
    JAMMER:        0
  };

  // ── Module state ─────────────────────────────────────────────────────────────

  var _scene    = null;
  var _camera   = null;
  var _beacons  = [];          // active beacon objects
  var _rings    = [];          // expanding ring VFX
  var _selectedTypeIndex = 0;
  var _discoveredTypes   = {};
  var _score    = 0;
  var _keys     = {};

  var _hudEl    = null;        // HUD DOM element

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _makeTextSprite(text, color) {
    var canvas  = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.roundRect(4, 4, 248, 56, 10);
    ctx.fill();
    ctx.font      = 'bold 28px Arial';
    ctx.fillStyle = color || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(4, 1, 1);
    return sprite;
  }

  function _makeBatteryBar(parent) {
    var barGroup = new THREE.Group();

    // background
    var bgGeo = new THREE.PlaneGeometry(2, 0.25);
    var bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    var bg    = new THREE.Mesh(bgGeo, bgMat);
    barGroup.add(bg);

    // fill
    var fgGeo = new THREE.PlaneGeometry(2, 0.22);
    var fgMat = new THREE.MeshBasicMaterial({ color: 0x00ff44, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    var fg    = new THREE.Mesh(fgGeo, fgMat);
    fg.position.x = 0;
    fg.position.z = 0.01;
    barGroup.add(fg);

    barGroup.position.set(1.5, 1.6, 0);
    parent.add(barGroup);

    return { group: barGroup, fill: fg };
  }

  function _updateBatteryBar(bar, pct) {
    var fill = bar.fill;
    fill.scale.x = _clamp(pct, 0, 1);
    fill.position.x = (fill.scale.x - 1);
    var col = pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff2222;
    fill.material.color.setHex(col);
  }

  // ── Beacon mesh construction ──────────────────────────────────────────────────

  function _buildBeaconMesh(type) {
    var group = new THREE.Group();
    var color = BEACON_COLORS[type];

    // Base cylinder
    var baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.4, 12);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    var base    = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    base.castShadow = true;
    group.add(base);

    // Body box
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.6 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);

    // Antenna shaft (telescoping)
    var antGeo = new THREE.BoxGeometry(0.06, 0.9, 0.06);
    var antMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    var ant    = new THREE.Mesh(antGeo, antMat);
    ant.position.y = 1.45;
    group.add(ant);

    // Antenna tip
    var tipGeo = new THREE.SphereGeometry(0.05, 6, 6);
    var tipMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 1 });
    var tip    = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 1.93;
    group.add(tip);

    // LED light (PointLight)
    var led = new THREE.PointLight(color, 1.5, 6);
    led.position.y = 1.5;
    group.add(led);

    // Type-specific detail mesh
    if (type === BEACON_TYPES.DISTRESS) {
      // Red cross panel
      var crossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.08, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      crossH.position.set(0, 0.7, 0.26);
      group.add(crossH);
      var crossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.4, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      crossV.position.set(0, 0.7, 0.26);
      group.add(crossV);
    } else if (type === BEACON_TYPES.STRIKE_MARKER) {
      // Laser column (thin cylinder)
      var laserGeo = new THREE.CylinderGeometry(0.025, 0.025, 12, 8);
      var laserMat = new THREE.MeshBasicMaterial({ color: 0x9933ff, transparent: true, opacity: 0.55 });
      var laser    = new THREE.Mesh(laserGeo, laserMat);
      laser.position.y = 7;
      group.add(laser);
      group.userData.laser = laser;
    } else if (type === BEACON_TYPES.JAMMER) {
      // Jammer sphere wireframe
      var jamSphere = new THREE.Mesh(
        new THREE.SphereGeometry(JAMMER_RADIUS, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.06, wireframe: true })
      );
      group.add(jamSphere);
      group.userData.jamSphere = jamSphere;
    } else if (type === BEACON_TYPES.LZ_MARKER) {
      // 4 corner flashing markers
      var corners = [[-0.8, 0, -0.8],[0.8, 0, -0.8],[-0.8, 0, 0.8],[0.8, 0, 0.8]];
      var cornerLights = [];
      for (var ci = 0; ci < corners.length; ci++) {
        var cLightGeo = new THREE.ConeGeometry(0.08, 0.25, 6);
        var cLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
        var cLight    = new THREE.Mesh(cLightGeo, cLightMat);
        cLight.position.set(corners[ci][0], 0.12, corners[ci][2]);
        group.add(cLight);
        var cPt = new THREE.PointLight(0x00ff44, 0.8, 4);
        cPt.position.set(corners[ci][0], 0.3, corners[ci][2]);
        group.add(cPt);
        cornerLights.push(cPt);
      }
      group.userData.cornerLights = cornerLights;
    }

    // Icon sprite (floating above)
    var iconLabel = BEACON_ICONS[type] + ' ' + BEACON_LABELS[type];
    var sprite = _makeTextSprite(iconLabel, '#' + BEACON_COLORS[type].toString(16).padStart(6, '0'));
    sprite.position.y = 2.6;
    sprite.userData.isIcon = true;
    group.add(sprite);

    // Battery bar
    var battBar = _makeBatteryBar(group);

    group.userData.led      = led;
    group.userData.tip      = tip;
    group.userData.battBar  = battBar;
    group.userData.sprite   = sprite;

    return group;
  }

  // ── Ring wave VFX ─────────────────────────────────────────────────────────────

  function _spawnRing(position, color) {
    var geo = new THREE.TorusGeometry(0.5, 0.06, 6, 32);
    var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.75 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.copy(position);
    mesh.position.y += 0.15;
    _scene.add(mesh);
    _rings.push({ mesh: mesh, age: 0, maxAge: 2.0, startRadius: 0.5 });
  }

  function _updateRings(delta) {
    for (var i = _rings.length - 1; i >= 0; i--) {
      var r = _rings[i];
      r.age += delta;
      var pct   = r.age / r.maxAge;
      var scale = 1 + pct * 8;
      r.mesh.scale.set(scale, scale, scale);
      r.mesh.material.opacity = 0.75 * (1 - pct);
      if (r.age >= r.maxAge) {
        _scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        _rings.splice(i, 1);
      }
    }
  }

  // ── Explosion puff VFX ────────────────────────────────────────────────────────

  function _spawnExplosionPuff(position) {
    var particles = [];
    for (var i = 0; i < 12; i++) {
      var geo = new THREE.SphereGeometry(0.12 + Math.random() * 0.15, 5, 5);
      var mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xff6600 : 0x888888,
        transparent: true, opacity: 0.9
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 4
      );
      _scene.add(mesh);
      particles.push({ mesh: mesh, vel: vel, age: 0 });
    }
    // Self-removing puff stored as a ring-style entry with custom update
    _rings.push({
      isPuff: true,
      particles: particles,
      age: 0,
      maxAge: 1.2
    });
  }

  // ── Smoke (STRIKE_MARKER) ─────────────────────────────────────────────────────

  function _spawnSmoke(position) {
    for (var i = 0; i < 6; i++) {
      var geo = new THREE.SphereGeometry(0.3, 6, 6);
      var mat = new THREE.MeshBasicMaterial({
        color: 0x9933ff, transparent: true, opacity: 0.35
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += i * 0.5;
      mesh.position.x += (Math.random() - 0.5) * 0.4;
      mesh.position.z += (Math.random() - 0.5) * 0.4;
      _scene.add(mesh);
      _rings.push({ mesh: mesh, age: 0, maxAge: 3.0, isSmoke: true, riseRate: 0.6 + Math.random() * 0.4 });
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'rb-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'right:16px',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid rgba(255,255,255,0.2)',
      'border-radius:8px',
      'padding:10px 14px',
      'color:#fff',
      'font:13px/1.5 monospace',
      'z-index:9000',
      'min-width:200px',
      'pointer-events:none',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var selectedType = BEACON_ORDER[_selectedTypeIndex];
    var html = '<div style="font-size:11px;color:#aaa;margin-bottom:6px">BEACON: <span style="color:#fff;font-weight:bold">' + selectedType + '</span></div>';

    if (_beacons.length === 0) {
      html += '<div style="color:#666;font-size:11px">No active beacons</div>';
    } else {
      for (var i = 0; i < _beacons.length; i++) {
        var b   = _beacons[i];
        var pct = _clamp(b.lifetime / BEACON_LIFETIME, 0, 1);
        var barColor = pct > 0.5 ? '#00ff44' : pct > 0.25 ? '#ffaa00' : '#ff2222';
        var secs = Math.ceil(b.lifetime);
        var effectStr = '';
        if (b.effectTimer > 0) {
          effectStr = ' <span style="color:#ffaa00">[' + Math.ceil(b.effectTimer) + 's]</span>';
        }
        var comboStr = b.comboActive ? ' <span style="color:#ff0">[COMBO]</span>' : '';
        html += '<div style="margin:2px 0">';
        html += BEACON_ICONS[b.type] + ' ' + BEACON_LABELS[b.type] + effectStr + comboStr;
        html += ' <span style="color:' + barColor + '">' + secs + 's</span>';
        html += ' <span style="color:#555">HP:' + Math.ceil(b.hp) + '</span>';
        html += '</div>';
      }
    }

    html += '<div style="margin-top:6px;font-size:10px;color:#888">[D] Cycle  [Shift+D] Deploy  [E] Retrieve</div>';
    _hudEl.innerHTML = html;
  }

  // ── Beacon effect triggers ─────────────────────────────────────────────────────

  function _triggerBeaconEffect(beacon) {
    var type = beacon.type;
    var pos  = beacon.group.position;
    var multiplier = beacon.comboActive ? 2 : 1;

    if (type === BEACON_TYPES.DISTRESS) {
      // Heal player (dispatch event)
      var healAmt = 80 * multiplier;
      window.dispatchEvent(new CustomEvent('rb:casevac', { detail: { healAmount: healAmt, position: pos.clone() } }));
    } else if (type === BEACON_TYPES.STRIKE_MARKER) {
      var strikePos = pos.clone();
      _spawnSmoke(strikePos);
      window.dispatchEvent(new CustomEvent('rb:airstrike', { detail: { position: strikePos, radius: 12 * multiplier } }));
    } else if (type === BEACON_TYPES.SUPPLY_DROP) {
      _spawnSupplyDrop(pos.clone());
    } else if (type === BEACON_TYPES.LZ_MARKER) {
      window.dispatchEvent(new CustomEvent('rb:lz_marked', { detail: { position: pos.clone() } }));
    } else if (type === BEACON_TYPES.JAMMER) {
      window.dispatchEvent(new CustomEvent('rb:jamming', {
        detail: { position: pos.clone(), radius: JAMMER_RADIUS * multiplier, duration: 90 }
      }));
    }
  }

  // ── Supply drop visual ────────────────────────────────────────────────────────

  function _spawnSupplyDrop(position) {
    var dropGroup = new THREE.Group();

    // Crate
    var crateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var crateMat = new THREE.MeshStandardMaterial({ color: 0x886633 });
    var crate    = new THREE.Mesh(crateGeo, crateMat);
    dropGroup.add(crate);

    // Parachute strings
    for (var pi = 0; pi < 4; pi++) {
      var ang  = (pi / 4) * Math.PI * 2;
      var strGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(ang) * 0.8, 2, Math.sin(ang) * 0.8)
      ]);
      var strMat = new THREE.LineBasicMaterial({ color: 0xffffff });
      dropGroup.add(new THREE.Line(strGeo, strMat));
    }

    // Chute dome
    var chuteGeo = new THREE.SphereGeometry(1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    var chuteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    var chute    = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.y = 2;
    dropGroup.add(chute);

    // Start high above
    dropGroup.position.copy(position);
    dropGroup.position.y += 20;
    _scene.add(dropGroup);

    // Animate downward as a ring entry
    _rings.push({
      isSupplyDrop: true,
      group: dropGroup,
      targetY: position.y + 0.4,
      age: 0,
      maxAge: 5.0,
      landed: false,
      landedTimer: 0
    });

    window.dispatchEvent(new CustomEvent('rb:supply_inbound', { detail: { position: position } }));
  }

  // ── Combo detection ───────────────────────────────────────────────────────────

  function _checkCombos() {
    for (var i = 0; i < _beacons.length; i++) {
      var b = _beacons[i];
      var sameNear = 0;
      for (var j = 0; j < _beacons.length; j++) {
        if (i === j) continue;
        if (_beacons[j].type === b.type && _dist3(_beacons[j].group.position, b.group.position) <= COMBO_DIST) {
          sameNear++;
        }
      }
      b.comboActive = (sameNear >= 2);
    }
  }

  // ── Enemy response ────────────────────────────────────────────────────────────

  function _notifyEnemyResponse(beacon) {
    var type = beacon.type;
    if (type === BEACON_TYPES.DISTRESS || type === BEACON_TYPES.STRIKE_MARKER) {
      window.dispatchEvent(new CustomEvent('rb:enemy_target', {
        detail: { position: beacon.group.position.clone(), beaconId: beacon.id }
      }));
    }
  }

  // ── Core beacon deployment ────────────────────────────────────────────────────

  function deployBeacon(type, pos) {
    if (!_scene) return null;
    if (!BEACON_TYPES[type]) { type = BEACON_ORDER[_selectedTypeIndex]; }

    // Remove oldest if at limit
    if (_beacons.length >= MAX_ACTIVE_BEACONS) {
      var oldest = _beacons.shift();
      _removeBeacon(oldest, false);
    }

    var mesh = _buildBeaconMesh(type);
    mesh.position.copy(pos || (_camera ? _camera.position : new THREE.Vector3()));
    mesh.position.y = (pos ? pos.y : 0);
    _scene.add(mesh);

    var delayBase = EFFECT_DELAY[type];
    var beacon = {
      id:          'rb_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      type:        type,
      group:       mesh,
      lifetime:    BEACON_LIFETIME,
      hp:          BEACON_HP,
      effectTimer: delayBase,
      effectFired: (delayBase === 0),
      ringTimer:   RING_INTERVAL,
      ledTimer:    0,
      ledOn:       true,
      comboActive: false,
      destroyed:   false,
      deployTime:  Date.now()
    };

    _beacons.push(beacon);
    _checkCombos();
    _notifyEnemyResponse(beacon);

    // Discovery score
    if (!_discoveredTypes[type]) {
      _discoveredTypes[type] = true;
      _score += 50;
      window.dispatchEvent(new CustomEvent('rb:score', { detail: { amount: 50, reason: 'First ' + type + ' beacon deployed' } }));
    }

    // Immediate effects for zero-delay types
    if (delayBase === 0) {
      _triggerBeaconEffect(beacon);
    }

    return beacon;
  }

  // ── Remove beacon ─────────────────────────────────────────────────────────────

  function _removeBeacon(beacon, explode) {
    _scene.remove(beacon.group);
    _disposeGroup(beacon.group);
    if (explode) {
      _spawnExplosionPuff(beacon.group.position.clone());
      window.dispatchEvent(new CustomEvent('rb:beacon_destroyed', { detail: { type: beacon.type } }));
    }
  }

  function _disposeGroup(group) {
    group.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var mi = 0; mi < obj.material.length; mi++) obj.material[mi].dispose();
        } else {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      }
    });
  }

  // ── Input handling ────────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    _keys[e.code] = true;

    if (e.code === 'KeyD') {
      if (e.shiftKey) {
        // Shift+D → deploy at feet
        var deployPos = _camera ? _camera.position.clone() : new THREE.Vector3();
        deployPos.y -= 1.0; // feet level
        deployBeacon(BEACON_ORDER[_selectedTypeIndex], deployPos);
      } else {
        // D → cycle type
        _selectedTypeIndex = (_selectedTypeIndex + 1) % BEACON_ORDER.length;
        window.dispatchEvent(new CustomEvent('rb:type_changed', { detail: { type: BEACON_ORDER[_selectedTypeIndex] } }));
      }
    }

    if (e.code === 'KeyE' && _camera) {
      _tryRetrieve();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _tryRetrieve() {
    var camPos = _camera.position;
    for (var i = 0; i < _beacons.length; i++) {
      var b = _beacons[i];
      if (_dist3(b.group.position, camPos) <= RETRIEVAL_DIST) {
        b.lifetime = Math.min(b.lifetime + BATTERY_EXTEND, BEACON_LIFETIME + BATTERY_EXTEND);
        window.dispatchEvent(new CustomEvent('rb:retrieved', { detail: { type: b.type } }));
        break;
      }
    }
  }

  // ── Per-beacon update ─────────────────────────────────────────────────────────

  function _updateBeacon(beacon, delta) {
    // Lifetime countdown
    beacon.lifetime -= delta;

    // Billboard: face sprite toward camera
    if (_camera && beacon.group.userData.sprite) {
      beacon.group.userData.sprite.lookAt(_camera.position);
    }

    // Hide icon if too far
    if (_camera && beacon.group.userData.sprite) {
      var d = _dist3(beacon.group.position, _camera.position);
      beacon.group.userData.sprite.visible = (d <= BEACON_VISIBLE_DIST);
    }

    // Battery bar update
    var pct = _clamp(beacon.lifetime / BEACON_LIFETIME, 0, 1);
    _updateBatteryBar(beacon.group.userData.battBar, pct);

    // Battery bar billboards toward camera
    if (_camera) {
      beacon.group.userData.battBar.group.lookAt(_camera.position);
    }

    // LED blink
    beacon.ledTimer += delta;
    if (beacon.ledTimer >= LED_BLINK_RATE) {
      beacon.ledTimer = 0;
      beacon.ledOn = !beacon.ledOn;
      var ledIntensity = beacon.ledOn ? 1.5 : 0;
      if (beacon.group.userData.led) {
        beacon.group.userData.led.intensity = ledIntensity;
      }
    }

    // LZ corner lights blink at different rate
    if (beacon.type === BEACON_TYPES.LZ_MARKER && beacon.group.userData.cornerLights) {
      var blink = Math.sin(Date.now() * 0.006) > 0;
      for (var ci = 0; ci < beacon.group.userData.cornerLights.length; ci++) {
        beacon.group.userData.cornerLights[ci].intensity = blink ? 1.2 : 0;
      }
    }

    // Ring pulse emission
    beacon.ringTimer -= delta;
    if (beacon.ringTimer <= 0) {
      beacon.ringTimer = RING_INTERVAL;
      _spawnRing(beacon.group.position.clone(), BEACON_COLORS[beacon.type]);
    }

    // Effect timer countdown
    if (!beacon.effectFired && beacon.effectTimer > 0) {
      beacon.effectTimer -= delta;
      if (beacon.effectTimer <= 0) {
        beacon.effectFired = true;
        _triggerBeaconEffect(beacon);
      }
    }

    // JAMMER pulse animation
    if (beacon.type === BEACON_TYPES.JAMMER && beacon.group.userData.jamSphere) {
      var pulse = 0.06 + Math.sin(Date.now() * 0.003) * 0.03;
      beacon.group.userData.jamSphere.material.opacity = pulse;
    }
  }

  // ── Main update ───────────────────────────────────────────────────────────────

  function update(delta) {
    // Update rings / VFX
    for (var ri = _rings.length - 1; ri >= 0; ri--) {
      var entry = _rings[ri];

      if (entry.isPuff) {
        entry.age += delta;
        for (var pi2 = 0; pi2 < entry.particles.length; pi2++) {
          var p = entry.particles[pi2];
          p.age += delta;
          p.mesh.position.addScaledVector(p.vel, delta);
          p.vel.y -= 5 * delta; // gravity
          p.mesh.material.opacity = 0.9 * (1 - p.age / entry.maxAge);
        }
        if (entry.age >= entry.maxAge) {
          for (var pi3 = 0; pi3 < entry.particles.length; pi3++) {
            _scene.remove(entry.particles[pi3].mesh);
            entry.particles[pi3].mesh.geometry.dispose();
            entry.particles[pi3].mesh.material.dispose();
          }
          _rings.splice(ri, 1);
        }
        continue;
      }

      if (entry.isSmoke) {
        entry.age += delta;
        entry.mesh.position.y += entry.riseRate * delta;
        entry.mesh.material.opacity = 0.35 * (1 - entry.age / entry.maxAge);
        if (entry.age >= entry.maxAge) {
          _scene.remove(entry.mesh);
          entry.mesh.geometry.dispose();
          entry.mesh.material.dispose();
          _rings.splice(ri, 1);
        }
        continue;
      }

      if (entry.isSupplyDrop) {
        entry.age += delta;
        if (!entry.landed) {
          entry.group.position.y -= 4 * delta;
          if (entry.group.position.y <= entry.targetY) {
            entry.group.position.y = entry.targetY;
            entry.landed = true;
            window.dispatchEvent(new CustomEvent('rb:supply_landed', {
              detail: { position: entry.group.position.clone() }
            }));
          }
        } else {
          entry.landedTimer += delta;
          if (entry.landedTimer > 5) {
            _scene.remove(entry.group);
            _disposeGroup(entry.group);
            _rings.splice(ri, 1);
          }
        }
        continue;
      }

      // Normal ring
      entry.age += delta;
      var pct2  = entry.age / entry.maxAge;
      var scale2 = 1 + pct2 * 8;
      entry.mesh.scale.set(scale2, scale2, scale2);
      entry.mesh.material.opacity = 0.75 * (1 - pct2);
      if (entry.age >= entry.maxAge) {
        _scene.remove(entry.mesh);
        entry.mesh.geometry.dispose();
        entry.mesh.material.dispose();
        _rings.splice(ri, 1);
      }
    }

    // Update beacons
    _checkCombos();
    for (var bi = _beacons.length - 1; bi >= 0; bi--) {
      var b = _beacons[bi];
      _updateBeacon(b, delta);

      if (b.lifetime <= 0 || b.hp <= 0) {
        _removeBeacon(b, b.hp <= 0);
        _beacons.splice(bi, 1);
      }
    }

    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _createHUD();

    // Expose damage method globally so other modules can damage beacons
    window.RadioBeacon._damageBeacon = function (beaconId, amount) {
      for (var i = 0; i < _beacons.length; i++) {
        if (_beacons[i].id === beaconId) {
          _beacons[i].hp -= amount;
          break;
        }
      }
    };
  }

  function getActiveBeacons() {
    var result = [];
    for (var i = 0; i < _beacons.length; i++) {
      var b = _beacons[i];
      result.push({
        id:          b.id,
        type:        b.type,
        position:    b.group.position.clone(),
        lifetime:    b.lifetime,
        hp:          b.hp,
        comboActive: b.comboActive,
        effectFired: b.effectFired
      });
    }
    return result;
  }

  function reset() {
    for (var i = _beacons.length - 1; i >= 0; i--) {
      _removeBeacon(_beacons[i], false);
    }
    _beacons = [];

    for (var ri = _rings.length - 1; ri >= 0; ri--) {
      var entry = _rings[ri];
      if (entry.mesh) {
        _scene.remove(entry.mesh);
        entry.mesh.geometry.dispose();
        entry.mesh.material.dispose();
      }
      if (entry.isPuff) {
        for (var pi = 0; pi < entry.particles.length; pi++) {
          _scene.remove(entry.particles[pi].mesh);
          entry.particles[pi].mesh.geometry.dispose();
          entry.particles[pi].mesh.material.dispose();
        }
      }
      if (entry.isSupplyDrop && entry.group) {
        _scene.remove(entry.group);
        _disposeGroup(entry.group);
      }
    }
    _rings = [];

    _selectedTypeIndex = 0;
    _discoveredTypes   = {};
    _score             = 0;
    _keys              = {};

    if (_hudEl) {
      _hudEl.innerHTML = '';
    }

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    _scene  = null;
    _camera = null;
  }

  return {
    init:             init,
    update:           update,
    deployBeacon:     deployBeacon,
    getActiveBeacons: getActiveBeacons,
    reset:            reset
  };
})();
