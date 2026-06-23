// faction-standoff.js — FactionStandoff module
// Activation: F+Z simultaneous (400ms window)
// RULES: var only, IIFE, window.FactionStandoff

window.FactionStandoff = (function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────
  var ARENA_SIZE = 30;
  var NEGOTIATE_DIST = 4;
  var CONFLICT_DIST = 12;
  var ALLY_FAVOR = 70;
  var PEACE_FAVOR = 60;
  var PEACE_DURATION = 60;        // seconds with no firefight
  var EXTREMIST_DELAY = 90;       // seconds before EXTREMISTS arrive
  var IED_FUSE = 180;             // 3-minute fuse in seconds
  var IED_DEFUSE_TIME = 8;        // seconds to defuse
  var BULLET_SPEED = 0.6;
  var GRANT_FAVOR = 15;
  var DENY_FAVOR = -10;
  var SHOOT_PENALTY = -30;
  var ATTACK_THRESHOLD = 30;
  var FACTION_SOLDIER_COUNT = 4;  // per faction

  // ─── Module state ───────────────────────────────────────────────────────────
  var _active = false;
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _playerPos = null;
  var _keys = {};
  var _keysDown = {};
  var _fKeyTime = 0;
  var _zKeyTime = 0;

  var _factions = {};
  var _soldiers = [];
  var _bullets = [];
  var _barriers = [];
  var _firefights = [];
  var _ied = null;
  var _iedTimer = 0;
  var _iedDefusing = false;
  var _iedDefuseProgress = 0;
  var _iedBlinkTimer = 0;

  var _elapsed = 0;
  var _peaceClock = 0;
  var _peaceAchieved = false;
  var _score = 0;
  var _negotiatingFaction = null;
  var _extremistsArrived = false;
  var _allAlly = false;

  var _hudEl = null;
  var _panelEl = null;
  var _messageEl = null;
  var _messageTimer = 0;

  var _animFrame = null;
  var _lastTime = 0;

  var _THREE = null;

  // ─── Faction definitions ─────────────────────────────────────────────────────
  var FACTION_DEFS = {
    REBELS: {
      name: 'REBELS',
      color: 0x8B1A1A,
      cssColor: '#8B1A1A',
      corner: [-1, -1],   // -x, -z corner of arena
      demands: [
        'Demilitarize the eastern checkpoint',
        'Release political prisoners',
        'Recognize rebel territory'
      ]
    },
    MILITIA: {
      name: 'MILITIA',
      color: 0x1A3A8B,
      cssColor: '#1A3A8B',
      corner: [1, -1],    // +x, -z corner
      demands: [
        'Establish civilian safe corridors',
        'Halt government air strikes',
        'Share intelligence on REBELS'
      ]
    },
    GOVERNMENT: {
      name: 'GOVERNMENT',
      color: 0x1A8B1A,
      cssColor: '#1A8B1A',
      corner: [1, 1],     // +x, +z corner
      demands: [
        'Disarm all non-state actors',
        'Swear allegiance to the state',
        'Hand over arms caches'
      ]
    }
  };

  var EXTREMIST_DEF = {
    name: 'EXTREMISTS',
    color: 0x330033,
    cssColor: '#330033'
  };

  // patrol route offsets relative to faction corner base
  var PATROL_ROUTES = [
    [{ x: 0, z: 0 }, { x: 3, z: 0 }, { x: 3, z: 3 }],
    [{ x: 0, z: 0 }, { x: 0, z: 3 }, { x: -2, z: 3 }],
    [{ x: 0, z: 0 }, { x: -3, z: 0 }, { x: -3, z: -3 }]
  ];

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = (a.y || 0) - (b.y || 0);
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function cornerPos(def) {
    var half = ARENA_SIZE / 2 - 3;
    return {
      x: def.corner[0] * half,
      y: 0,
      z: def.corner[1] * half
    };
  }

  function showMessage(msg, duration) {
    if (!_messageEl) { return; }
    _messageEl.textContent = msg;
    _messageEl.style.display = 'block';
    _messageTimer = duration || 3;
  }

  function padTwo(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  // ─── THREE.js object factories ───────────────────────────────────────────────
  function makeMesh(geoArgs, color, geoType) {
    var geo;
    if (geoType === 'cylinder') {
      geo = new _THREE.CylinderGeometry(geoArgs[0], geoArgs[1], geoArgs[2], geoArgs[3] || 8);
    } else if (geoType === 'sphere') {
      geo = new _THREE.SphereGeometry(geoArgs[0], geoArgs[1] || 6, geoArgs[2] || 6);
    } else {
      geo = new _THREE.BoxGeometry(geoArgs[0], geoArgs[1], geoArgs[2]);
    }
    var mat = new _THREE.MeshLambertMaterial({ color: color });
    return new _THREE.Mesh(geo, mat);
  }

  // ─── HUD / UI ────────────────────────────────────────────────────────────────
  function buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'fs-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#eee',
      'font:bold 13px monospace',
      'padding:6px 14px',
      'border-radius:4px',
      'z-index:9990',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);

    _panelEl = document.createElement('div');
    _panelEl.id = 'fs-panel';
    _panelEl.style.cssText = [
      'position:fixed',
      'right:20px',
      'top:50%',
      'transform:translateY(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:#eee',
      'font:13px monospace',
      'padding:12px 16px',
      'border-radius:6px',
      'z-index:9991',
      'min-width:220px',
      'display:none'
    ].join(';');
    document.body.appendChild(_panelEl);

    _messageEl = document.createElement('div');
    _messageEl.id = 'fs-msg';
    _messageEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.80)',
      'color:#ffe',
      'font:bold 14px monospace',
      'padding:8px 18px',
      'border-radius:4px',
      'z-index:9992',
      'display:none',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_messageEl);
  }

  function updateHUD() {
    if (!_hudEl) { return; }
    var r = _factions.REBELS;
    var m = _factions.MILITIA;
    var g = _factions.GOVERNMENT;
    var peaceVal = Math.round(
      (r.favor + m.favor + g.favor) / 3
    );

    var extStr = '';
    if (!_extremistsArrived) {
      var remaining = Math.max(0, EXTREMIST_DELAY - _elapsed);
      extStr = ' | EXTREMISTS: ' + padTwo(Math.floor(remaining / 60)) + ':' + padTwo(Math.floor(remaining % 60));
    } else if (_ied && !_ied.defused) {
      var fuseLeft = Math.max(0, IED_FUSE - _iedTimer);
      extStr = ' | IED FUSE: ' + padTwo(Math.floor(fuseLeft / 60)) + ':' + padTwo(Math.floor(fuseLeft % 60));
    } else {
      extStr = ' | EXTREMISTS: ACTIVE';
    }

    _hudEl.textContent = 'STANDOFF [REBEL: ' + Math.round(r.favor) + '%] [MILITIA: ' +
      Math.round(m.favor) + '%] [GOVT: ' + Math.round(g.favor) + '%] [PEACE: ' +
      peaceVal + '%]' + extStr;
  }

  function showNegotiationPanel(factionKey) {
    if (!_panelEl) { return; }
    var f = _factions[factionKey];
    if (!f) { return; }
    _negotiatingFaction = factionKey;
    var def = FACTION_DEFS[factionKey];
    var html = '<div style="color:' + def.cssColor + ';margin-bottom:8px;font-size:15px">── ' +
      def.name + ' ──</div>';
    html += '<div style="margin-bottom:6px">Favor: <b>' + Math.round(f.favor) + '%</b></div>';
    html += '<div style="margin-bottom:4px">Demands:</div>';
    for (var i = 0; i < def.demands.length; i++) {
      html += '<div style="margin:3px 0">' + (i + 1) + '. ' + def.demands[i] + '</div>';
      html += '<div style="margin:2px 0 6px 0">' +
        '<span style="cursor:pointer;color:#6f6;text-decoration:underline" data-faction="' + factionKey + '" data-demand="' + i + '" data-action="grant">[GRANT +15]</span>' +
        '  ' +
        '<span style="cursor:pointer;color:#f66;text-decoration:underline" data-faction="' + factionKey + '" data-demand="' + i + '" data-action="deny">[DENY -10]</span>' +
        '</div>';
    }
    html += '<div style="margin-top:8px;color:#aaa;font-size:11px">[E] Close</div>';
    _panelEl.innerHTML = html;
    _panelEl.style.display = 'block';
  }

  function hideNegotiationPanel() {
    if (_panelEl) { _panelEl.style.display = 'none'; }
    _negotiatingFaction = null;
  }

  // ─── Faction setup ───────────────────────────────────────────────────────────
  function initFaction(key) {
    var def = FACTION_DEFS[key];
    var base = cornerPos(def);

    // Leader (CylinderGeometry, 1.3x scale, faction color)
    var leader = makeMesh([0.4, 0.4, 1.8, 8], def.color, 'cylinder');
    leader.scale.set(1.3, 1.3, 1.3);
    leader.position.set(base.x, 1.17, base.z);
    _scene.add(leader);

    // Leader head
    var head = makeMesh([0.28, 6, 6], def.color, 'sphere');
    head.position.set(0, 1.5, 0);
    leader.add(head);

    // Soldiers (4 per faction, BoxGeometry)
    var soldierList = [];
    for (var s = 0; s < FACTION_SOLDIER_COUNT; s++) {
      var sol = makeMesh([0.5, 1.6, 0.5], def.color, 'box');
      var routeIdx = s % PATROL_ROUTES.length;
      var route = PATROL_ROUTES[routeIdx];
      var startPt = route[0];
      sol.position.set(
        base.x + startPt.x + (s * 1.2 - 2),
        0.8,
        base.z + startPt.z
      );
      _scene.add(sol);
      // Cigarette (some soldiers idle smoke - CylinderGeometry)
      var cigarette = null;
      if (s === 1) {
        cigarette = makeMesh([0.03, 0.03, 0.25, 6], 0xeeeecc, 'cylinder');
        cigarette.rotation.z = Math.PI / 2;
        cigarette.position.set(0.28, 0.55, 0.12);
        sol.add(cigarette);
      }
      soldierList.push({
        mesh: sol,
        faction: key,
        patrolRoute: PATROL_ROUTES[routeIdx],
        patrolBase: { x: base.x + (s * 1.2 - 2), z: base.z },
        patrolIdx: 0,
        patrolTimer: 0,
        state: 'patrol',   // patrol | fight | salute
        saluteTimer: 0,
        idleTimer: Math.random() * 5,
        cigarette: cigarette,
        smokeTimer: 0,
        hp: 100,
        dead: false
      });
    }

    _factions[key] = {
      key: key,
      def: def,
      favor: 50,
      leader: leader,
      soldiers: soldierList,
      base: base,
      allied: false,
      attacking: false,
      extremistAllied: false
    };

    _soldiers = _soldiers.concat(soldierList);
  }

  function initExtremists() {
    var soldiers = [];
    for (var s = 0; s < 4; s++) {
      var sol = makeMesh([0.5, 1.6, 0.5], EXTREMIST_DEF.color, 'box');
      // Spawn from outside the arena, one side
      sol.position.set(-ARENA_SIZE / 2 - 5 + s * 2, 0.8, -2 + s * 2);
      _scene.add(sol);
      var extSoldier = {
        mesh: sol,
        faction: 'EXTREMISTS',
        state: 'advance',
        hp: 80,
        dead: false,
        attackTimer: 0
      };
      soldiers.push(extSoldier);
      _soldiers.push(extSoldier);
    }
    _factions.EXTREMISTS = {
      key: 'EXTREMISTS',
      def: EXTREMIST_DEF,
      favor: 0,
      soldiers: soldiers,
      leader: null,
      base: { x: -ARENA_SIZE / 2 - 5, y: 0, z: 0 },
      allied: false,
      attacking: true,
      extremistAllied: false
    };

    // Plant IED at junction (center of arena)
    var iedGeo = new _THREE.BoxGeometry(0.6, 0.3, 0.6);
    var iedMat = new _THREE.MeshLambertMaterial({ color: 0xFF2200 });
    var iedMesh = new _THREE.Mesh(iedGeo, iedMat);
    iedMesh.position.set(0, 0.15, 0);
    _scene.add(iedMesh);
    _ied = {
      mesh: iedMesh,
      timer: 0,
      defused: false,
      exploded: false
    };
    _iedTimer = 0;
    showMessage('EXTREMISTS HAVE ARRIVED — IED PLANTED AT JUNCTION! [E] to defuse', 6);
  }

  // ─── Arena setup ─────────────────────────────────────────────────────────────
  function buildArena() {
    // Ground plane
    var ground = makeMesh([ARENA_SIZE, 0.2, ARENA_SIZE], 0x3a3a2a, 'box');
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    // Arena border markers (4 corner posts)
    var corners = [
      [-ARENA_SIZE / 2, 0, -ARENA_SIZE / 2],
      [ARENA_SIZE / 2, 0, -ARENA_SIZE / 2],
      [-ARENA_SIZE / 2, 0, ARENA_SIZE / 2],
      [ARENA_SIZE / 2, 0, ARENA_SIZE / 2]
    ];
    for (var c = 0; c < corners.length; c++) {
      var post = makeMesh([0.3, 3, 0.3], 0x555555, 'box');
      post.position.set(corners[c][0], 1.5, corners[c][2]);
      _scene.add(post);
    }

    // Ambient light
    var ambient = new _THREE.AmbientLight(0x606060);
    _scene.add(ambient);
    var dirLight = new _THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    _scene.add(dirLight);
  }

  // ─── Player object (mediator) ─────────────────────────────────────────────────
  var _playerMesh = null;

  function buildPlayer() {
    _playerMesh = makeMesh([0.5, 1.8, 0.5], 0xdddddd, 'box');
    _playerMesh.position.set(0, 0.9, 0);
    _scene.add(_playerMesh);
    _playerPos = _playerMesh.position;
  }

  // ─── Input handling ───────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!_active) { return; }
    var k = e.key.toUpperCase();
    if (!_keys[k]) {
      _keysDown[k] = true;
    }
    _keys[k] = true;

    // Track F+Z simultaneous activation timing is done at module level
    if (k === 'F') { _fKeyTime = Date.now(); }
    if (k === 'Z') { _zKeyTime = Date.now(); }

    // E key — negotiate or close panel
    if (k === 'E') {
      if (_negotiatingFaction) {
        hideNegotiationPanel();
        return;
      }
      // Check IED defuse
      if (_ied && !_ied.defused && !_ied.exploded && dist2(_playerPos, _ied.mesh.position) < 3) {
        _iedDefusing = true;
        _iedDefuseProgress = 0;
        showMessage('Defusing IED... hold E for 8 seconds', 2);
        return;
      }
      // Check faction leader proximity
      var fkeys = ['REBELS', 'MILITIA', 'GOVERNMENT'];
      for (var fi = 0; fi < fkeys.length; fi++) {
        var fk = fkeys[fi];
        var f = _factions[fk];
        if (f && f.leader) {
          if (dist2(_playerPos, f.leader.position) < NEGOTIATE_DIST) {
            showNegotiationPanel(fk);
            return;
          }
        }
      }
    }

    // B key — place barrier
    if (k === 'B') {
      placeBarrier();
    }

    // P key — propose alliance (if 2 factions at 70+ favor each)
    if (k === 'P') {
      proposeAlliance();
    }
  }

  function onKeyUp(e) {
    var k = e.key.toUpperCase();
    _keys[k] = false;
    if (k === 'E') {
      _iedDefusing = false;
    }
  }

  function onPanelClick(e) {
    var el = e.target;
    var faction = el.getAttribute('data-faction');
    var demand = el.getAttribute('data-demand');
    var action = el.getAttribute('data-action');
    if (!faction || !action) { return; }
    if (action === 'grant') {
      _factions[faction].favor = clamp(_factions[faction].favor + GRANT_FAVOR, 0, 100);
      showMessage('Granted demand to ' + faction + '. Favor +' + GRANT_FAVOR, 3);
    } else if (action === 'deny') {
      _factions[faction].favor = clamp(_factions[faction].favor + DENY_FAVOR, 0, 100);
      showMessage('Denied demand from ' + faction + '. Favor ' + DENY_FAVOR, 3);
    }
    // Refresh panel
    showNegotiationPanel(faction);
  }

  // ─── Barrier placement ────────────────────────────────────────────────────────
  function placeBarrier() {
    var barrier = makeMesh([2, 3, 0.5], 0x888888, 'box');
    barrier.position.set(_playerPos.x, 1.5, _playerPos.z - 1.5);
    _scene.add(barrier);
    _barriers.push({ mesh: barrier });
    showMessage('Barrier placed. Factions may be separated.', 3);
  }

  // ─── Alliance / peace logic ───────────────────────────────────────────────────
  function proposeAlliance() {
    var fkeys = ['REBELS', 'MILITIA', 'GOVERNMENT'];
    var eligible = [];
    for (var fi = 0; fi < fkeys.length; fi++) {
      var fk = fkeys[fi];
      if (_factions[fk] && _factions[fk].favor >= ALLY_FAVOR) {
        eligible.push(fk);
      }
    }
    if (eligible.length < 2) {
      showMessage('Need at least 2 factions at 70+ favor to propose alliance.', 4);
      return;
    }
    // Form alliance between the eligible pair
    for (var ei = 0; ei < eligible.length; ei++) {
      _factions[eligible[ei]].allied = true;
    }
    showMessage(eligible.join(' + ') + ' have formed an ALLIANCE — weapons lowered!', 5);
    // Visually lower weapons: soldiers slow down
    for (var si = 0; si < _soldiers.length; si++) {
      var sol = _soldiers[si];
      if (eligible.indexOf(sol.faction) !== -1 && sol.state === 'fight') {
        sol.state = 'patrol';
      }
    }
  }

  function checkPeace(dt) {
    var r = _factions.REBELS;
    var m = _factions.MILITIA;
    var g = _factions.GOVERNMENT;
    if (!r || !m || !g) { return; }

    var noFirefight = _firefights.length === 0;
    if (r.favor >= PEACE_FAVOR && m.favor >= PEACE_FAVOR && g.favor >= PEACE_FAVOR && noFirefight) {
      _peaceClock += dt;
      if (_peaceClock >= PEACE_DURATION && !_peaceAchieved) {
        _peaceAchieved = true;
        _score += 1000;
        showMessage('PEACE ACHIEVED! All factions stand down. +1000 score!', 10);
      }
    } else {
      _peaceClock = 0;
    }
  }

  // ─── Bullet spawning ──────────────────────────────────────────────────────────
  function spawnBullet(fromPos, toPos, color) {
    var bullet = makeMesh([0.12, 6, 6], color || 0xffff00, 'sphere');
    bullet.position.set(fromPos.x, fromPos.y || 0.8, fromPos.z);
    _scene.add(bullet);
    var dx = toPos.x - fromPos.x;
    var dz = toPos.z - fromPos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    _bullets.push({
      mesh: bullet,
      vel: { x: (dx / len) * BULLET_SPEED, z: (dz / len) * BULLET_SPEED },
      life: 3,
      faction: color
    });
  }

  // ─── Firefight logic ──────────────────────────────────────────────────────────
  function checkConflicts() {
    var fkeys = ['REBELS', 'MILITIA', 'GOVERNMENT'];
    // Check each pair of factions
    for (var a = 0; a < fkeys.length; a++) {
      for (var b = a + 1; b < fkeys.length; b++) {
        var fa = _factions[fkeys[a]];
        var fb = _factions[fkeys[b]];
        if (!fa || !fb) { continue; }
        if (fa.allied && fb.allied) { continue; }
        var d = dist2(fa.base, fb.base);
        if (d < CONFLICT_DIST) {
          startFirefight(fkeys[a], fkeys[b]);
        }
      }
    }
  }

  function startFirefight(keyA, keyB) {
    // Check if already fighting
    for (var fi = 0; fi < _firefights.length; fi++) {
      var ff = _firefights[fi];
      if ((ff.a === keyA && ff.b === keyB) || (ff.a === keyB && ff.b === keyA)) {
        return;
      }
    }
    _firefights.push({ a: keyA, b: keyB, timer: 0 });
    showMessage(keyA + ' and ' + keyB + ' are in FIREFIGHT! Separate or mediate!', 5);
    // Set soldiers to fight state
    for (var si = 0; si < _soldiers.length; si++) {
      var sol = _soldiers[si];
      if (sol.faction === keyA || sol.faction === keyB) {
        sol.state = 'fight';
      }
    }
  }

  function resolveFirefightsWithBarrier() {
    // If player placed a barrier between two fighting factions, resolve them
    for (var fi = _firefights.length - 1; fi >= 0; fi--) {
      var ff = _firefights[fi];
      var fa = _factions[ff.a];
      var fb = _factions[ff.b];
      if (!fa || !fb) { continue; }
      // Check if any barrier lies between them
      for (var bi = 0; bi < _barriers.length; bi++) {
        var bar = _barriers[bi];
        var bx = bar.mesh.position.x;
        var bz = bar.mesh.position.z;
        var midX = (fa.base.x + fb.base.x) / 2;
        var midZ = (fa.base.z + fb.base.z) / 2;
        if (Math.abs(bx - midX) < 5 && Math.abs(bz - midZ) < 5) {
          _firefights.splice(fi, 1);
          showMessage('Barrier separated ' + ff.a + ' and ' + ff.b + '!', 4);
          // Return soldiers to patrol
          for (var si = 0; si < _soldiers.length; si++) {
            var sol = _soldiers[si];
            if ((sol.faction === ff.a || sol.faction === ff.b) && sol.state === 'fight') {
              sol.state = 'patrol';
            }
          }
          break;
        }
      }
    }
  }

  // Warning shot — player fires between factions to separate them
  function warningShotCheck() {
    // If player fires (SPACE) near a firefight midpoint, separate factions
    if (!_keysDown['SPACE']) { return; }
    for (var fi = _firefights.length - 1; fi >= 0; fi--) {
      var ff = _firefights[fi];
      var fa = _factions[ff.a];
      var fb = _factions[ff.b];
      if (!fa || !fb) { continue; }
      var midX = (fa.base.x + fb.base.x) / 2;
      var midZ = (fa.base.z + fb.base.z) / 2;
      if (dist2(_playerPos, { x: midX, z: midZ }) < 8) {
        spawnBullet(
          { x: _playerPos.x, y: 1.2, z: _playerPos.z },
          { x: midX, z: midZ },
          0xffffff
        );
        _firefights.splice(fi, 1);
        showMessage('Warning shot fired — ' + ff.a + ' and ' + ff.b + ' cease fire!', 4);
        for (var si = 0; si < _soldiers.length; si++) {
          var sol = _soldiers[si];
          if ((sol.faction === ff.a || sol.faction === ff.b) && sol.state === 'fight') {
            sol.state = 'patrol';
          }
        }
      }
    }
  }

  // Player shooting a faction soldier = -30 favor
  function playerShootCheck() {
    if (!_keysDown['SPACE']) { return; }
    // Forward direction from player
    var fx = 0, fz = -1;
    for (var si = 0; si < _soldiers.length; si++) {
      var sol = _soldiers[si];
      if (sol.dead) { continue; }
      if (sol.faction === 'EXTREMISTS') { continue; }
      var dx = sol.mesh.position.x - _playerPos.x;
      var dz = sol.mesh.position.z - _playerPos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < 5) {
        var dot = (dx / d) * fx + (dz / d) * fz;
        if (dot > 0.5) {
          // Hit this soldier
          _factions[sol.faction].favor = clamp(_factions[sol.faction].favor + SHOOT_PENALTY, 0, 100);
          showMessage('You shot a ' + sol.faction + ' soldier! Favor -30', 3);
        }
      }
    }
  }

  // ─── Soldier AI update ────────────────────────────────────────────────────────
  function updateSoldierAI(sol, dt) {
    if (sol.dead) { return; }
    sol.idleTimer -= dt;

    if (sol.faction === 'EXTREMISTS') {
      updateExtremistSoldier(sol, dt);
      return;
    }

    var fac = _factions[sol.faction];
    if (!fac) { return; }

    // Salute leader occasionally
    sol.saluteTimer -= dt;
    if (sol.saluteTimer <= 0 && sol.state === 'patrol') {
      sol.saluteTimer = 8 + Math.random() * 12;
      // Animate salute: raise arm (scale y briefly)
      sol.mesh.scale.y = 1.2;
      var mesh = sol.mesh;
      setTimeout(function () { if (mesh) { mesh.scale.y = 1; } }, 600);
    }

    // Cigarette smoke idle animation
    if (sol.cigarette) {
      sol.smokeTimer -= dt;
      if (sol.smokeTimer <= 0) {
        sol.smokeTimer = 3 + Math.random() * 3;
        // Bob cigarette
        sol.cigarette.position.y = 0.55 + Math.sin(Date.now() * 0.003) * 0.05;
      }
    }

    // Attack behavior if favor too low or firefight
    if (fac.favor < ATTACK_THRESHOLD && !fac.allied) {
      sol.state = 'fight';
    } else if (fac.allied) {
      sol.state = 'patrol';
    }

    if (sol.state === 'fight') {
      updateSoldierFight(sol, dt, fac);
    } else {
      updateSoldierPatrol(sol, dt, fac);
    }
  }

  function updateSoldierPatrol(sol, dt, fac) {
    // Move along patrol route
    sol.patrolTimer -= dt;
    if (sol.patrolTimer <= 0) {
      sol.patrolIdx = (sol.patrolIdx + 1) % sol.patrolRoute.length;
      sol.patrolTimer = 2 + Math.random() * 2;
    }
    var target = sol.patrolRoute[sol.patrolIdx];
    var tx = sol.patrolBase.x + target.x;
    var tz = sol.patrolBase.z + target.z;
    var dx = tx - sol.mesh.position.x;
    var dz = tz - sol.mesh.position.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d > 0.2) {
      sol.mesh.position.x += (dx / d) * 1.5 * dt;
      sol.mesh.position.z += (dz / d) * 1.5 * dt;
    }

    // Eye other factions (rotate toward center)
    var cx = 0, cz = 0;
    var toCenter = { x: cx - sol.mesh.position.x, z: cz - sol.mesh.position.z };
    sol.mesh.rotation.y = Math.atan2(toCenter.x, toCenter.z);
  }

  function updateSoldierFight(sol, dt, fac) {
    sol.attackTimer = (sol.attackTimer || 0) - dt;
    if (sol.attackTimer <= 0) {
      sol.attackTimer = 1.5 + Math.random();
      // Find enemy target
      var enemyFactions = ['REBELS', 'MILITIA', 'GOVERNMENT'];
      for (var fi = 0; fi < enemyFactions.length; fi++) {
        if (enemyFactions[fi] === sol.faction) { continue; }
        var ef = _factions[enemyFactions[fi]];
        if (!ef || ef.allied === fac.allied) { continue; }
        // Shoot at enemy base
        var target = ef.base;
        spawnBullet(
          { x: sol.mesh.position.x, y: 0.8, z: sol.mesh.position.z },
          { x: target.x + (Math.random() - 0.5) * 3, z: target.z + (Math.random() - 0.5) * 3 },
          FACTION_DEFS[sol.faction] ? FACTION_DEFS[sol.faction].color : 0xffffff
        );
        break;
      }
    }

    // Posture: shift position based on favor
    var fac2 = _factions[sol.faction];
    if (fac2) {
      var advance = (50 - fac2.favor) / 50;
      advance = clamp(advance, -0.3, 0.5);
      var toCenter = { x: -sol.mesh.position.x, z: -sol.mesh.position.z };
      var tc = Math.sqrt(toCenter.x * toCenter.x + toCenter.z * toCenter.z) || 1;
      sol.mesh.position.x += (toCenter.x / tc) * advance * dt * 0.5;
      sol.mesh.position.z += (toCenter.z / tc) * advance * dt * 0.5;
    }
  }

  function updateExtremistSoldier(sol, dt) {
    sol.attackTimer = (sol.attackTimer || 0) - dt;
    // Advance toward arena center
    var tx = 0, tz = 0;
    var dx = tx - sol.mesh.position.x;
    var dz = tz - sol.mesh.position.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d > 3) {
      sol.mesh.position.x += (dx / d) * 2.0 * dt;
      sol.mesh.position.z += (dz / d) * 2.0 * dt;
    }
    // Attack all factions
    if (sol.attackTimer <= 0) {
      sol.attackTimer = 1.2 + Math.random();
      var fkeys = ['REBELS', 'MILITIA', 'GOVERNMENT'];
      var rnd = Math.floor(Math.random() * fkeys.length);
      var ef = _factions[fkeys[rnd]];
      if (ef) {
        spawnBullet(
          { x: sol.mesh.position.x, y: 0.8, z: sol.mesh.position.z },
          { x: ef.base.x + (Math.random() - 0.5) * 4, z: ef.base.z + (Math.random() - 0.5) * 4 },
          EXTREMIST_DEF.color
        );
      }
    }

    // If all 3 factions are allied (extremistAllied flag), extremists get shot back
    if (_allAlly) {
      sol.hp -= 5 * dt;
      if (sol.hp <= 0) {
        sol.dead = true;
        sol.mesh.visible = false;
      }
    }
  }

  // ─── Bullets update ───────────────────────────────────────────────────────────
  function updateBullets(dt) {
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var b = _bullets[bi];
      b.mesh.position.x += b.vel.x;
      b.mesh.position.z += b.vel.z;
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(bi, 1);
      }
    }
  }

  // ─── IED update ───────────────────────────────────────────────────────────────
  function updateIED(dt) {
    if (!_ied || _ied.defused || _ied.exploded) { return; }
    _iedTimer += dt;

    // Blink red/off
    _iedBlinkTimer += dt;
    var blinkRate = Math.max(0.15, 1 - (_iedTimer / IED_FUSE));
    if (_iedBlinkTimer >= blinkRate) {
      _iedBlinkTimer = 0;
      _ied.mesh.visible = !_ied.mesh.visible;
    }

    // Defuse progress
    if (_iedDefusing && dist2(_playerPos, _ied.mesh.position) < 3) {
      _iedDefuseProgress += dt;
      showMessage('Defusing... ' + Math.round(_iedDefuseProgress) + 's / 8s', 0.5);
      if (_iedDefuseProgress >= IED_DEFUSE_TIME) {
        _ied.defused = true;
        _ied.mesh.visible = false;
        _iedDefusing = false;
        showMessage('IED DEFUSED! Great work, mediator.', 6);
        _score += 300;
      }
    } else {
      _iedDefusing = false;
    }

    // Explode
    if (_iedTimer >= IED_FUSE) {
      _ied.exploded = true;
      _ied.mesh.visible = false;
      showMessage('IED EXPLODED! All factions lose favor!', 6);
      _factions.REBELS && (_factions.REBELS.favor = clamp(_factions.REBELS.favor - 20, 0, 100));
      _factions.MILITIA && (_factions.MILITIA.favor = clamp(_factions.MILITIA.favor - 20, 0, 100));
      _factions.GOVERNMENT && (_factions.GOVERNMENT.favor = clamp(_factions.GOVERNMENT.favor - 20, 0, 100));
    }
  }

  // ─── Extremist alliance check ─────────────────────────────────────────────────
  function checkExtremistAlliance() {
    if (!_extremistsArrived || _allAlly) { return; }
    var r = _factions.REBELS;
    var m = _factions.MILITIA;
    var g = _factions.GOVERNMENT;
    if (!r || !m || !g) { return; }
    if (r.allied && m.allied && g.allied) {
      _allAlly = true;
      showMessage('ALL FACTIONS ALLIED — repelling EXTREMISTS together!', 6);
    }
  }

  // ─── Player movement ──────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var speed = 5;
    if (_keys['W'] || _keys['ARROWUP']) { _playerPos.z -= speed * dt; }
    if (_keys['S'] || _keys['ARROWDOWN']) { _playerPos.z += speed * dt; }
    if (_keys['A'] || _keys['ARROWLEFT']) { _playerPos.x -= speed * dt; }
    if (_keys['D'] || _keys['ARROWRIGHT']) { _playerPos.x += speed * dt; }

    // Clamp to arena
    _playerPos.x = clamp(_playerPos.x, -ARENA_SIZE / 2, ARENA_SIZE / 2);
    _playerPos.z = clamp(_playerPos.z, -ARENA_SIZE / 2, ARENA_SIZE / 2);

    // Camera follow
    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y + 14, _playerPos.z + 10);
      _camera.lookAt(_playerPos.x, _playerPos.y, _playerPos.z);
    }
  }

  // ─── Leader look-at behavior ──────────────────────────────────────────────────
  function updateLeaders() {
    var fkeys = ['REBELS', 'MILITIA', 'GOVERNMENT'];
    // Each leader eyes a different faction leader
    var targets = {
      REBELS: _factions.MILITIA && _factions.MILITIA.leader,
      MILITIA: _factions.GOVERNMENT && _factions.GOVERNMENT.leader,
      GOVERNMENT: _factions.REBELS && _factions.REBELS.leader
    };
    for (var fi = 0; fi < fkeys.length; fi++) {
      var fk = fkeys[fi];
      var f = _factions[fk];
      if (!f || !f.leader) { continue; }
      var tgt = targets[fk];
      if (!tgt) { continue; }
      var dx = tgt.position.x - f.leader.position.x;
      var dz = tgt.position.z - f.leader.position.z;
      f.leader.rotation.y = Math.atan2(dx, dz);
    }
  }

  // ─── Faction attack when favor < threshold ─────────────────────────────────
  function updateFactionAttackState() {
    var fkeys = ['REBELS', 'MILITIA', 'GOVERNMENT'];
    for (var fi = 0; fi < fkeys.length; fi++) {
      var fk = fkeys[fi];
      var f = _factions[fk];
      if (!f) { continue; }
      if (f.favor < ATTACK_THRESHOLD && !f.attacking) {
        f.attacking = true;
        showMessage(fk + ' FAVOR CRITICAL — FACTION ATTACKING!', 5);
      } else if (f.favor >= ATTACK_THRESHOLD) {
        f.attacking = false;
      }
    }
  }

  // ─── Proximity prompt ──────────────────────────────────────────────────────────
  function updateProximityPrompts() {
    var fkeys = ['REBELS', 'MILITIA', 'GOVERNMENT'];
    for (var fi = 0; fi < fkeys.length; fi++) {
      var fk = fkeys[fi];
      var f = _factions[fk];
      if (!f || !f.leader) { continue; }
      var d = dist2(_playerPos, f.leader.position);
      if (d < NEGOTIATE_DIST && !_negotiatingFaction) {
        // hint is shown passively via HUD, avoid flooding
      }
    }
  }

  // ─── Main loop ────────────────────────────────────────────────────────────────
  function loop(now) {
    if (!_active) { return; }
    _animFrame = requestAnimationFrame(loop);

    var dt = Math.min((now - _lastTime) / 1000, 0.1);
    _lastTime = now;
    _elapsed += dt;

    // Update player
    updatePlayer(dt);

    // Extremist arrival
    if (!_extremistsArrived && _elapsed >= EXTREMIST_DELAY) {
      _extremistsArrived = true;
      initExtremists();
    }

    // Leaders look at each other
    updateLeaders();

    // Soldier AI
    for (var si = 0; si < _soldiers.length; si++) {
      updateSoldierAI(_soldiers[si], dt);
    }

    // Bullets
    updateBullets(dt);

    // IED
    if (_extremistsArrived) {
      updateIED(dt);
    }

    // Conflict detection
    checkConflicts();
    resolveFirefightsWithBarrier();

    // Input checks
    warningShotCheck();
    playerShootCheck();

    // Faction attack state
    updateFactionAttackState();

    // Alliance check
    checkExtremistAlliance();

    // Peace check
    checkPeace(dt);

    // Proximity prompts
    updateProximityPrompts();

    // Message timer
    if (_messageTimer > 0) {
      _messageTimer -= dt;
      if (_messageTimer <= 0 && _messageEl) {
        _messageEl.style.display = 'none';
      }
    }

    // HUD
    updateHUD();

    // Clear one-frame keys
    _keysDown = {};

    // Render
    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  // ─── Activation ───────────────────────────────────────────────────────────────
  function activate(scene, camera, renderer) {
    if (_active) { return; }
    _THREE = window.THREE;
    if (!_THREE) {
      console.warn('[FactionStandoff] THREE.js not found on window');
      return;
    }
    _active = true;
    _scene = scene || new _THREE.Scene();
    _camera = camera || new _THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    _renderer = renderer || (function () {
      var r = new _THREE.WebGLRenderer({ antialias: true });
      r.setSize(window.innerWidth, window.innerHeight);
      r.setClearColor(0x2a2a3a);
      document.body.appendChild(r.domElement);
      return r;
    }());

    _elapsed = 0;
    _peaceClock = 0;
    _peaceAchieved = false;
    _score = 0;
    _extremistsArrived = false;
    _allAlly = false;
    _ied = null;
    _iedTimer = 0;
    _iedDefusing = false;
    _iedDefuseProgress = 0;
    _firefights = [];
    _bullets = [];
    _barriers = [];
    _soldiers = [];
    _factions = {};
    _negotiatingFaction = null;

    buildArena();
    buildPlayer();

    initFaction('REBELS');
    initFaction('MILITIA');
    initFaction('GOVERNMENT');

    buildHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    if (_panelEl) { _panelEl.addEventListener('click', onPanelClick); }

    showMessage('FACTION STANDOFF — WASD move | E negotiate | B barrier | P propose alliance | SPACE warning shot', 8);

    _lastTime = performance.now();
    _animFrame = requestAnimationFrame(loop);
  }

  function deactivate() {
    if (!_active) { return; }
    _active = false;
    if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    if (_hudEl) { _hudEl.parentNode && _hudEl.parentNode.removeChild(_hudEl); _hudEl = null; }
    if (_panelEl) { _panelEl.parentNode && _panelEl.parentNode.removeChild(_panelEl); _panelEl = null; }
    if (_messageEl) { _messageEl.parentNode && _messageEl.parentNode.removeChild(_messageEl); _messageEl = null; }
    _factions = {};
    _soldiers = [];
    _bullets = [];
    _barriers = [];
    _firefights = [];
    _ied = null;
  }

  // ─── F+Z simultaneous activation hook ─────────────────────────────────────
  (function () {
    function globalKeyDown(e) {
      var k = e.key.toUpperCase();
      if (k === 'F') { _fKeyTime = Date.now(); }
      if (k === 'Z') { _zKeyTime = Date.now(); }
      if ((k === 'Z' && _keys['F'] !== undefined ? false : false) || k === 'Z' || k === 'F') {
        // Check if both F and Z pressed within 400ms
        if (_fKeyTime && _zKeyTime && Math.abs(_fKeyTime - _zKeyTime) <= 400) {
          if (!_active) {
            activate();
          } else {
            deactivate();
          }
          _fKeyTime = 0;
          _zKeyTime = 0;
        }
      }
    }
    document.addEventListener('keydown', globalKeyDown);
  }());

  // ─── Public API ───────────────────────────────────────────────────────────────
  return {
    activate: activate,
    deactivate: deactivate,
    getScore: function () { return _score; },
    getFavor: function (faction) { return _factions[faction] ? _factions[faction].favor : 0; },
    setFavor: function (faction, val) {
      if (_factions[faction]) { _factions[faction].favor = clamp(val, 0, 100); }
    },
    isPeaceAchieved: function () { return _peaceAchieved; },
    isActive: function () { return _active; }
  };
}());
