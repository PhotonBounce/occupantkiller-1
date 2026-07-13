// ============================================================
//  vehicle-hud.js — Vehicle Dashboard HUD Overlay
//
//  Shown when player is driving Bradley M2A3 IFV or BTR-80.
//
//  Detection: polls window.Bradley.isActive() / window.BTR80.isActive()
//  each frame, and also responds to window._onVehicleEnter /
//  window._onVehicleExit callbacks and window._inVehicle /
//  window._vehicleMode flags.
//
//  Public API: init(), show(vehicleType), hide(), update(dt)
// ============================================================
window.VehicleHUD = (function () {
  'use strict';

  // ── Internal state ──────────────────────────────────────────
  var _el = null;            // root HUD container element
  var _visible = false;
  var _vehicleType = null;   // 'bradley' | 'btr80' | null

  // Speed simulation
  var _speedKmh = 0;         // displayed speed
  var _speedTarget = 0;      // target speed (ramps)
  var _movingInput = false;  // any WASD held

  // Turret bearing animation
  var _turretBearing = 0;    // 0-359 degrees
  var _turretDelta = 0;      // last mouse dx for smooth sim
  var _turretVel = 0;        // bearing velocity deg/s

  // Smoke launcher
  var _smokeCount = 4;

  // Weapon selector
  var _weaponIdx = 0;        // 0=CANNON, 1=COAX, 2=LAUNCH

  // Armor cached data
  var _maxHp = 200;

  // Key state (WASD tracking)
  var _key = { w: false, s: false, a: false, d: false };

  // Mouse delta accumulator
  var _mouseDxAccum = 0;

  // Timer since last turret idle drift
  var _idleDriftTimer = 0;

  // ── Vehicle config constants ────────────────────────────────
  var VEHICLE_CONFIG = {
    bradley: {
      name: 'BRADLEY M2A3 IFV',
      maxHp: 500,
      maxSpeedKmh: 60,
      weapons: ['CANNON', 'COAX', 'LAUNCH'],
      ammoLabel: '25mm',
      ammoMax: 1000,
      ammoStart: 650,
      smokeStart: 4
    },
    btr80: {
      name: 'BTR-80 APC',
      maxHp: 350,
      maxSpeedKmh: 72,
      weapons: ['KPV', 'COAX', 'SMOKE'],
      ammoLabel: '14.5mm',
      ammoMax: 500,
      ammoStart: 350,
      smokeStart: 4
    }
  };

  var _ammoCount = 650;
  var _ammoMax = 1000;
  var _weaponNames = ['CANNON', 'COAX', 'LAUNCH'];

  // ── Helper: build armor bar string ─────────────────────────
  function _armorBar(pct) {
    var filled = Math.round(pct / 100 * 12);
    var empty = 12 - filled;
    var bar = '';
    var i;
    for (i = 0; i < filled; i++) bar += '█';
    for (i = 0; i < empty; i++) bar += '░';
    var color = pct > 60 ? '#00ff44' : pct > 30 ? '#ffcc00' : '#ff3333';
    return '<span style="color:' + color + '">' + bar + '</span> <span style="color:' + color + '">' + Math.round(pct) + '%</span>';
  }

  // ── Helper: smoke pip string ────────────────────────────────
  function _smokePips(count, max) {
    var out = '';
    var i;
    for (i = 0; i < max; i++) {
      out += i < count ? '●' : '○';
    }
    return out;
  }

  // ── Helper: bearing string (zero-padded 3 digits) ──────────
  function _bearingStr(deg) {
    var d = ((Math.round(deg) % 360) + 360) % 360;
    if (d < 10)  return '00' + d;
    if (d < 100) return '0' + d;
    return '' + d;
  }

  // ── Helper: weapon selector HTML ───────────────────────────
  function _weaponSelector(names, activeIdx) {
    var out = '';
    var i;
    for (i = 0; i < names.length; i++) {
      var active = i === activeIdx;
      var border = active ? '2px solid #00ff44' : '1px solid #336633';
      var bg     = active ? 'rgba(0,60,0,0.8)' : 'rgba(0,20,0,0.5)';
      var color  = active ? '#00ff44' : '#669966';
      out += '<span style="display:inline-block;padding:2px 8px;margin:0 3px;'
           + 'border:' + border + ';background:' + bg + ';color:' + color
           + ';border-radius:2px;font-size:10px;letter-spacing:1px">'
           + names[i] + '</span>';
    }
    return out;
  }

  // ── Helper: mini-arc SVG (60° turret arc) ──────────────────
  function _arcSvg(bearingDeg) {
    var cx = 24, cy = 24, r = 18;
    // convert bearing (0=N, 90=E) to SVG angle (0=E, 90=S)
    var angleDeg = bearingDeg - 90;
    var arcHalf  = 30; // 60° total arc
    var a1 = (angleDeg - arcHalf) * Math.PI / 180;
    var a2 = (angleDeg + arcHalf) * Math.PI / 180;
    var x1 = cx + r * Math.cos(a1);
    var y1 = cy + r * Math.sin(a1);
    var x2 = cx + r * Math.cos(a2);
    var y2 = cy + r * Math.sin(a2);
    // direction tick
    var tx = cx + (r + 4) * Math.cos(angleDeg * Math.PI / 180);
    var ty = cy + (r + 4) * Math.sin(angleDeg * Math.PI / 180);

    return '<svg width="48" height="48" style="vertical-align:middle;display:inline-block">'
         + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#336633" stroke-width="1"/>'
         + '<path d="M ' + x1.toFixed(1) + ' ' + y1.toFixed(1)
         + ' A ' + r + ' ' + r + ' 0 0 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '"'
         + ' fill="none" stroke="#00ff44" stroke-width="2"/>'
         + '<line x1="' + cx + '" y1="' + cy + '" x2="' + tx.toFixed(1) + '" y2="' + ty.toFixed(1) + '"'
         + ' stroke="#00ff44" stroke-width="1.5"/>'
         + '<circle cx="' + cx + '" cy="' + cy + '" r="2" fill="#00ff44"/>'
         + '</svg>';
  }

  // ── Build HUD DOM ───────────────────────────────────────────
  function _buildDom() {
    if (_el) return;
    _el = document.createElement('div');
    _el.id = 'vehicle-hud-overlay';
    _el.style.cssText = [
      'position:fixed;',
      'bottom:0;left:0;right:0;',
      'height:20%;',
      'background:rgba(0,20,0,0.85);',
      'border-top:1px solid #00ff44;',
      'color:#00cc44;',
      'font-family:monospace;',
      'font-size:12px;',
      'z-index:500;',
      'pointer-events:none;',
      'display:none;',
      'box-sizing:border-box;',
      'padding:6px 14px 4px 14px;',
      'overflow:hidden;',
    ].join('');
    document.body.appendChild(_el);
  }

  // ── Render current state ────────────────────────────────────
  function _render() {
    if (!_el || !_visible) return;

    var cfg = VEHICLE_CONFIG[_vehicleType] || VEHICLE_CONFIG.bradley;

    // Get live vehicle HP from Bradley or BTR80 if available
    var currentHp = _maxHp;
    try {
      if (_vehicleType === 'bradley' && window.Bradley && window.Bradley.getHealth) {
        currentHp = window.Bradley.getHealth();
      } else if (_vehicleType === 'btr80' && window.BTR80 && window.BTR80.getHealth) {
        currentHp = window.BTR80.getHealth();
      }
    } catch (e) {}

    var armorPct = Math.max(0, Math.min(100, (currentHp / cfg.maxHp) * 100));

    // Smoke count — prefer global if set
    var smokeDisplay = (typeof window._smokeCount === 'number') ? window._smokeCount : _smokeCount;

    // Speed
    var spdDisplay = Math.round(_speedKmh);

    // Bearing string
    var bearStr = _bearingStr(_turretBearing);

    // Weapon names for this vehicle
    var wNames = cfg.weapons;

    // Engine status
    var engineStatus = (_speedKmh > 0 || _movingInput) ? '<span style="color:#00ff44">RUNNING</span>'
                                                        : '<span style="color:#669944">IDLE</span>';

    // Ammo warning
    var ammoRatio = _ammoCount / _ammoMax;
    var ammoColor = ammoRatio < 0.2 ? '#ff3333' : ammoRatio < 0.4 ? '#ffcc00' : '#00cc44';
    var ammoWarn  = ammoRatio < 0.2 ? ' <span style="color:#ff3333;animation:blink 0.5s infinite">⚠ LOW</span>' : '';

    _el.innerHTML = [
      // Top row: vehicle name + armor
      '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(0,255,68,0.2);padding-bottom:3px;margin-bottom:3px">',
        '<span style="color:#00ff44;font-size:13px;letter-spacing:2px;font-weight:bold">' + cfg.name + '</span>',
        '<span style="font-size:10px">ARMOR: ' + _armorBar(armorPct) + '</span>',
      '</div>',

      // Middle row: speed | ammo | turret + arc | engine
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:nowrap">',

        // Left: speed
        '<div style="min-width:100px">',
          '<div style="color:#aaffaa;font-size:10px;letter-spacing:1px">SPD</div>',
          '<div style="font-size:18px;color:#00ff44;font-weight:bold">' + spdDisplay + ' <span style="font-size:10px;color:#669944">km/h</span></div>',
        '</div>',

        // Center-left: ammo
        '<div style="min-width:130px">',
          '<div style="color:#aaffaa;font-size:10px;letter-spacing:1px">AMMO (' + cfg.ammoLabel + ')</div>',
          '<div style="font-size:15px;color:' + ammoColor + '">' + _ammoCount + '<span style="color:#336633;font-size:11px">/' + _ammoMax + '</span>' + ammoWarn + '</div>',
        '</div>',

        // Center: turret arc SVG + bearing
        '<div style="text-align:center;min-width:100px">',
          _arcSvg(_turretBearing),
          '<div style="color:#00ff44;font-size:11px;letter-spacing:2px">' + bearStr + '°</div>',
        '</div>',

        // Center-right: smoke + engine
        '<div style="min-width:100px">',
          '<div style="color:#aaffaa;font-size:10px;letter-spacing:1px">SMOKE</div>',
          '<div style="font-size:13px;color:#00cc44;letter-spacing:2px">' + _smokePips(smokeDisplay, 4) + '</div>',
          '<div style="margin-top:2px;font-size:10px">ENGINE: ' + engineStatus + '</div>',
        '</div>',

        // Right: weapon selector
        '<div style="min-width:160px;text-align:right">',
          '<div style="color:#aaffaa;font-size:10px;letter-spacing:1px;margin-bottom:3px">WEAPONS</div>',
          '<div>' + _weaponSelector(wNames, _weaponIdx) + '</div>',
        '</div>',

      '</div>',
    ].join('');
  }

  // ── Input listeners ─────────────────────────────────────────
  function _bindInput() {
    window.addEventListener('keydown', function (e) {
      var k = e.key ? e.key.toLowerCase() : '';
      if (k === 'w') _key.w = true;
      if (k === 's') _key.s = true;
      if (k === 'a') _key.a = true;
      if (k === 'd') _key.d = true;

      // Z key — use smoke launcher
      if (k === 'z' && _visible) {
        if (typeof window._smokeCount === 'number') {
          if (window._smokeCount > 0) window._smokeCount--;
        } else {
          if (_smokeCount > 0) _smokeCount--;
        }
      }
    });

    window.addEventListener('keyup', function (e) {
      var k = e.key ? e.key.toLowerCase() : '';
      if (k === 'w') _key.w = false;
      if (k === 's') _key.s = false;
      if (k === 'a') _key.a = false;
      if (k === 'd') _key.d = false;
    });

    // Scroll wheel — cycle weapon
    window.addEventListener('wheel', function (e) {
      if (!_visible) return;
      var wNames = (VEHICLE_CONFIG[_vehicleType] || VEHICLE_CONFIG.bradley).weapons;
      if (e.deltaY > 0) {
        _weaponIdx = (_weaponIdx + 1) % wNames.length;
      } else {
        _weaponIdx = (_weaponIdx - 1 + wNames.length) % wNames.length;
      }
    }, { passive: true });

    // Mouse movement — accumulate for turret bearing
    window.addEventListener('mousemove', function (e) {
      if (!_visible) return;
      _mouseDxAccum += e.movementX || 0;
    });
  }

  // ── Public: init ────────────────────────────────────────────
  function init() {
    _buildDom();
    _bindInput();

    // Hook into optional vehicle enter/exit callbacks
    window._onVehicleEnter = function (type) {
      show(type);
    };
    window._onVehicleExit = function () {
      hide();
    };
  }

  // ── Public: show ────────────────────────────────────────────
  function show(vehicleType) {
    var type = vehicleType || 'bradley';
    _vehicleType = type;

    var cfg = VEHICLE_CONFIG[type] || VEHICLE_CONFIG.bradley;
    _maxHp       = cfg.maxHp;
    _ammoCount   = cfg.ammoStart;
    _ammoMax     = cfg.ammoMax;
    _weaponIdx   = 0;
    _smokeCount  = cfg.smokeStart;
    _speedKmh    = 0;
    _turretBearing = 0;
    _turretVel   = 0;
    _mouseDxAccum = 0;

    if (_el) _el.style.display = 'block';
    _visible = true;
    _render();
  }

  // ── Public: hide ────────────────────────────────────────────
  function hide() {
    _visible = false;
    if (_el) _el.style.display = 'none';
    _vehicleType = null;
    _speedKmh = 0;
  }

  // ── Public: update(dt) ──────────────────────────────────────
  function update(dt) {
    dt = dt || 0.016;

    // Auto-detect vehicle state from global flags or module APIs
    var shouldShow = false;
    var detectedType = null;

    if (window._inVehicle || window._vehicleMode) {
      shouldShow = true;
      detectedType = window._vehicleType || 'bradley';
    }
    try {
      if (window.Bradley && window.Bradley.isActive && window.Bradley.isActive()) {
        shouldShow = true;
        detectedType = 'bradley';
      }
    } catch (e) {}
    try {
      if (window.BTR80 && window.BTR80.isActive && window.BTR80.isActive()) {
        shouldShow = true;
        detectedType = 'btr80';
      }
    } catch (e) {}

    if (shouldShow && !_visible) {
      show(detectedType);
    } else if (!shouldShow && _visible) {
      hide();
    }

    if (!_visible) return;

    // Update vehicle type if it changed
    if (detectedType && detectedType !== _vehicleType) {
      show(detectedType);
    }

    // ── Speed simulation ──────────────────────────────────────
    _movingInput = _key.w || _key.s || _key.a || _key.d;
    var cfg = VEHICLE_CONFIG[_vehicleType] || VEHICLE_CONFIG.bradley;
    var maxSpd = cfg.maxSpeedKmh;
    if (_movingInput) {
      _speedTarget = maxSpd * (0.7 + Math.random() * 0.05); // slight variation
    } else {
      _speedTarget = 0;
    }
    // Ramp speed toward target
    var speedDiff = _speedTarget - _speedKmh;
    _speedKmh += speedDiff * Math.min(1, dt * 1.8);
    if (_speedKmh < 0.5) _speedKmh = 0;

    // ── Turret bearing from mouse ─────────────────────────────
    var mouseSensitivity = 0.12; // degrees per pixel
    _turretVel += _mouseDxAccum * mouseSensitivity;
    _mouseDxAccum = 0;

    // Idle drift when not moving mouse
    _idleDriftTimer += dt;
    if (_idleDriftTimer > 3.0 && Math.abs(_turretVel) < 0.5) {
      // tiny random drift so it looks alive
      _turretVel += (Math.random() - 0.5) * 1.5;
      _idleDriftTimer = 0;
    }

    _turretVel *= Math.pow(0.88, dt * 60); // dampen
    _turretBearing += _turretVel * dt;
    _turretBearing = ((_turretBearing % 360) + 360) % 360;

    // ── Ammo depletion (simulated on fire events) ─────────────
    // Actual ammo draw happens in bradley.js / btr80.js.
    // We read a shared counter if available, else keep our own.
    if (typeof window._vehicleAmmoCount === 'number') {
      _ammoCount = window._vehicleAmmoCount;
    }

    _render();
  }

  // ── Module export ────────────────────────────────────────────
  return {
    init:   init,
    show:   show,
    hide:   hide,
    update: update
  };
})();
