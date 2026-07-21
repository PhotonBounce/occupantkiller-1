/* ============================================================
 * stepove-duel.js — BRADLEY DUEL AT STEPOVE (stage module)
 *
 * Recreates the January 2024 Stepove engagement: an M2 Bradley
 * crew blinds and cripples a T-90M with sustained 25mm fire at
 * close range until the tank spins out, the crew bails, and an
 * FPV drone (or TOW) finishes the wreck.
 *
 * Mission beats:
 *   1. ENGAGE  — T-90M advances from the treeline, firing its
 *                main gun. Rake it with the Bushmaster.
 *   2. BLIND   — sustained 25mm kills its optics: aim wanders,
 *                ERA bricks pop, smoke pours.
 *   3. PANIC   — mobility kill triggers the infamous spin-out.
 *   4. BAIL    — the crew abandons the tank under fire.
 *   5. FINISH  — TOW it (T key) or hit the wreck with any
 *                explosive (FPV drone, grenade). Turret-toss.
 *
 * Damage routing: init() taps Enemies.damageInRadius — the seam
 * every AoE weapon system resolves through — and classifies hits
 * by damage tier. Bradley AP shells are pure hitscan (no AoE
 * call), so bradley.js notifies those explicitly.
 *
 * Model convention: the T-90M mesh is built +Z-forward to match
 * the movement/aim math (yaw = atan2(dx, dz), advance along
 * (sin(yaw), cos(yaw))).
 *
 * Public API (mirrors RefineryStrike so game-manager wiring is
 * identical):  init(scene), startMission(opts), update(delta),
 *              notifyImpact(pos, dmg, kind), isActive(),
 *              isTankTargetable(), getT90(), getProgress(), clear()
 * ============================================================ */
window.StepoveDuel = (function () {
  'use strict';

  var _scene = null;
  var _active = false;
  var _onComplete = null;
  var _t90 = null;
  var _phase = 'idle';      // idle|engage|blind|panic|bail|finish|dead
  var _phaseT = 0;
  var _fireCool = 4.0;
  var _spinDir = 1;
  var _bailSpawned = false;
  var _smokeT = 0;
  var _objEl = null;
  var _hpBarShown = false;
  var _completeTimer = -1;

  // Component pools sized against real Bushmaster throughput (~390 dmg/s of
  // sustained HE): blind ≈ 4s of on-target fire, mobility ≈ +6s, bail ≈ +8s.
  // With aim time, T-90 return fire and the scripted 7s panic spin, a clean
  // run of the duel lands around 35-45 seconds.
  var HP = { optics: 1400, tracks: 2200, hull: 5200 };
  var _hp = null;
  var HULL_BAIL_FRAC = 0.42;

  var T90_SPEED = 3.2;
  var T90_STOP_DIST = 26;
  var GUN_DMG = 55;
  var FINISH_DMG_MIN = 60;   // any non-coax hit this big finishes a bailed wreck

  /* ── T-90M procedural mesh (built +Z forward) ─────────────── */
  function _mat(c, r, m) { return new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.85 : r, metalness: m == null ? 0.25 : m }); }

  function _buildT90() {
    var g = new THREE.Group();
    var green = 0x3d4a33, dark = 0x2b3526, rust = 0x5a4632;

    var hull = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 6.6), _mat(green));
    hull.position.y = 1.0; g.add(hull);
    // Glacis wedge on the nose (+z)
    var glacis = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 1.6), _mat(dark));
    glacis.position.set(0, 1.25, 3.4); glacis.rotation.x = 0.5; g.add(glacis);
    var trkL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 6.8), _mat(0x1c1c1c, 0.95, 0.1));
    trkL.position.set(-1.75, 0.55, 0); g.add(trkL);
    var trkR = trkL.clone(); trkR.position.x = 1.75; g.add(trkR);
    for (var w = 0; w < 6; w++) {
      var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 10), _mat(0x222522, 0.9, 0.2));
      wh.rotation.z = Math.PI / 2;
      wh.position.set(-1.75, 0.5, -2.5 + w);
      g.add(wh);
      var wh2 = wh.clone(); wh2.position.x = 1.75; g.add(wh2);
    }
    var turret = new THREE.Group();
    var tBase = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.6, 0.75, 12), _mat(dark));
    tBase.position.y = 0.35; turret.add(tBase);
    var tRoof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 2.1), _mat(green));
    tRoof.position.y = 0.75; turret.add(tRoof);
    // 125mm 2A46M pointing +z
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 5.4, 10), _mat(0x2f332b, 0.7, 0.4));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.42, 3.6);
    turret.add(barrel);
    var sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.2, 8), _mat(rust, 0.9, 0.2));
    sleeve.rotation.x = Math.PI / 2; sleeve.position.set(0, 0.42, 2.4); turret.add(sleeve);
    // Sosna-U gunner sight + commander sight — the optics the 25mm eats
    var sight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), _mat(0x161a14, 0.6, 0.5));
    sight.position.set(-0.55, 1.12, 0.5); turret.add(sight);
    var cSight = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 8), _mat(0x161a14, 0.6, 0.5));
    cSight.position.set(0.5, 1.15, -0.2); turret.add(cSight);
    var hatchL = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 10), _mat(dark));
    hatchL.position.set(-0.5, 0.94, -0.35); turret.add(hatchL);
    var hatchR = hatchL.clone(); hatchR.position.x = 0.55; turret.add(hatchR);
    turret.position.y = 1.55;
    g.add(turret);

    // ERA bricks — knocked off by hits
    var era = [];
    function brick(px, py, pz, rx, ry, parent) {
      var b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.3), _mat(rust, 0.9, 0.15));
      b.position.set(px, py, pz);
      if (rx) b.rotation.x = rx; if (ry) b.rotation.y = ry;
      (parent || g).add(b); era.push(b);
      return b;
    }
    for (var ex = -3; ex <= 3; ex++) brick(ex * 0.48, 1.5, 3.15, 0.5, 0);              // glacis row (nose)
    for (var et = 0; et < 8; et++) {
      var a = (et / 8) * Math.PI - Math.PI / 2;
      // turret ring bricks live in turret-local space so they slew with it
      brick(Math.sin(a) * 1.5, 0.5, Math.cos(a) * 1.55 + 0.2, 0, a, turret);
    }
    for (var es = 0; es < 5; es++) { brick(-1.95, 1.25, -2.2 + es * 1.1, 0, Math.PI / 2); brick(1.95, 1.25, -2.2 + es * 1.1, 0, Math.PI / 2); }

    // Cope cage
    var cage = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 2.6), _mat(0x333a30, 0.95, 0.1));
    cage.position.y = 1.45; turret.add(cage);
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 6), _mat(0x333a30));
    [[-0.9, -1.1], [0.9, -1.1], [-0.9, 1.1], [0.9, 1.1]].forEach(function (pq) {
      var p = post.clone(); p.position.set(pq[0], 1.1, pq[1]); turret.add(p);
    });

    // Red "Z"
    var zTex = null;
    if (THREE.CanvasTexture) {
      try {
        var cv = document.createElement('canvas'); cv.width = cv.height = 64;
        var cx = cv.getContext('2d');
        cx.strokeStyle = '#ff2a2a'; cx.lineWidth = 9; cx.lineCap = 'square';
        cx.beginPath(); cx.moveTo(12, 14); cx.lineTo(52, 14); cx.lineTo(12, 50); cx.lineTo(52, 50); cx.stroke();
        zTex = new THREE.CanvasTexture(cv);
        var zM = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1),
          new THREE.MeshBasicMaterial({ map: zTex, transparent: true }));
        zM.position.set(-1.83, 1.15, -0.4); zM.rotation.y = -Math.PI / 2; g.add(zM);
        var zM2 = zM.clone(); zM2.position.x = 1.83; zM2.rotation.y = Math.PI / 2; g.add(zM2);
      } catch (e) {}
    }

    return { group: g, turret: turret, barrel: barrel, era: era, sight: sight, cSight: cSight, hatchL: hatchL, hatchR: hatchR, trkL: trkL, trkR: trkR, zTex: zTex };
  }

  /* ── helpers ───────────────────────────────────────────── */
  function _toast(msg, color) {
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup(msg, color || '#ffd24a'); } catch (e) {}
  }
  function _radio(msg) {
    _toast('📻 ' + msg, '#9fd3ff');
  }
  function _objective(text) {
    try {
      if (!_objEl) {
        _objEl = document.createElement('div');
        _objEl.id = 'stepove-objective';
        _objEl.style.cssText = 'position:fixed;top:15%;left:50%;transform:translateX(-50%);z-index:1500;' +
          'background:rgba(10,14,8,0.72);border:1px solid rgba(255,210,74,0.5);color:#ffd24a;' +
          'font:700 15px/1.4 monospace;padding:8px 18px;border-radius:6px;pointer-events:none;text-align:center';
        document.body.appendChild(_objEl);
      }
      _objEl.textContent = text;
      _objEl.style.display = 'block';
    } catch (e) {}
  }
  function _explosionFx(pos, big) {
    try { if (window.Tracers && Tracers.spawnExplosion) Tracers.spawnExplosion(pos, big ? 3.2 : 1.2); } catch (e) {}
    try {
      if (window.AudioSystem) {
        if (big && AudioSystem.playExplosionNear) AudioSystem.playExplosionNear(4);
        else if (AudioSystem.playExplosion) AudioSystem.playExplosion();
      }
    } catch (e) {}
  }
  function _playerPos() {
    try { return GameManager.getPlayer().position; } catch (e) { return { x: 0, y: 0, z: 0 }; }
  }
  function _hpTotal() { return Math.max(0, _hp.hull) + Math.max(0, _hp.optics) * 0.4 + Math.max(0, _hp.tracks) * 0.4; }
  function _hpMax() { return HP.hull + HP.optics * 0.4 + HP.tracks * 0.4; }

  function _showHpBar() {
    try {
      if (window.Enemies && Enemies.showBossHPBar) { Enemies.showBossHPBar('T-90M «PROUD» — STEPOVE', _hpMax()); _hpBarShown = true; }
    } catch (e) {}
  }
  function _updateHpBar() {
    try { if (_hpBarShown && Enemies.updateBossHPBar) Enemies.updateBossHPBar(_hpTotal()); } catch (e) {}
  }
  function _objectiveForState() {
    if (_phase === 'finish') { _objective('FINISH THE WRECK — TOW (T), FPV DRONE, ANY EXPLOSIVE'); return; }
    if (_hp.optics > 0) _objective('RAKE THE T-90M WITH 25MM — KILL ITS OPTICS');
    else if (_hp.tracks > 0) _objective('IT’S BLIND — NOW SHRED THE TRACKS');
    else _objective('KEEP FIRING — BREAK THE CREW');
  }

  /* ── init / start ──────────────────────────────────────── */
  function init(scene) {
    _scene = scene;
    // One seam for every AoE damage source in the game (Bradley HE, TOW,
    // FPV drones, grenades, artillery): tap Enemies.damageInRadius and
    // classify by damage tier. Bradley AP is hitscan-only and notifies
    // explicitly from bradley.js.
    try {
      if (window.Enemies && Enemies.damageInRadius && !Enemies.__stepoveTap) {
        var _origDIR = Enemies.damageInRadius;
        Enemies.damageInRadius = function (pos, radius, dmg) {
          try {
            if (_active && pos && typeof dmg === 'number') {
              // discriminate by blast radius too: Bradley HE is 70 dmg but only
              // r=2.6 — FPV warheads are r>=4. Without the radius check the
              // Bushmaster's own HE was classified FPV and got the 3x bonus.
              var kind = dmg >= 300 ? 'TOW'
                : (dmg >= 60 && typeof radius === 'number' && radius >= 3.5) ? 'FPV'
                : dmg <= 25 ? 'COAX' : 'HE';
              notifyImpact(pos, dmg, kind);
            }
          } catch (e) {}
          return _origDIR.apply(this, arguments);
        };
        Enemies.__stepoveTap = true;
      }
    } catch (e) {}
  }

  function startMission(opts) {
    if (!_scene) return false;
    opts = opts || {};
    clear();
    _active = true;
    _onComplete = opts.onComplete || null;
    _hp = { optics: HP.optics, tracks: HP.tracks, hull: HP.hull };
    _phase = 'engage'; _phaseT = 0; _fireCool = 5;
    _bailSpawned = false; _completeTimer = -1;

    var gy = 0;
    try { gy = VoxelWorld.getTerrainHeight(0, 0); } catch (e) {}

    // Treeline the tank emerges from
    try {
      var B = VoxelWorld.BLOCK;
      if (B && VoxelWorld.setBlock) {
        for (var row = 0; row < 2; row++) {
          for (var tx = -46; tx <= 46; tx += 6) {
            var jx = tx + ((tx * 7) % 3) + (row % 2 ? 3 : 0), jz = -102 - row * 7 - ((tx * 5) % 4);
            var th = VoxelWorld.getTerrainHeight(jx, jz);
            for (var tt2 = 1; tt2 <= 4; tt2++) VoxelWorld.setBlock(jx, th + tt2, jz, B.WOOD);
            for (var cx = -2; cx <= 2; cx++) for (var cz = -2; cz <= 2; cz++) for (var cy = 4; cy <= 7; cy++) {
              if (Math.abs(cx) + Math.abs(cz) + Math.abs(cy - 5) <= 4) VoxelWorld.setBlock(jx + cx, th + cy, jz + cz, B.PARK_TREE);
            }
          }
        }
      }
    } catch (eTree) {}

    // Bradley for the player, already crewed
    try {
      if (window.Bradley) {
        var v = Bradley.getVehicle && Bradley.getVehicle();
        if (!v) v = Bradley.spawnAt({ x: 0, y: gy + 1, z: 6 });
        if (v && !Bradley.isActive()) Bradley.enter();
      }
    } catch (e) {}

    var t = _buildT90();
    var tz = -95;
    var ty = 0;
    try { ty = VoxelWorld.getTerrainHeight(4, tz); } catch (e) {}
    t.group.position.set(4, ty, tz);
    // +Z-forward mesh: yaw 0 already faces the player spawn side
    t.group.rotation.y = Math.atan2(0 - 4, 6 - tz);
    _scene.add(t.group);
    _t90 = t;

    _showHpBar();
    _toast('⚔ STEPOVE — T-90M ADVANCING FROM THE TREELINE', '#ff6a4a');
    _radio('Contact! Tank, twelve o’clock, closing. Gunner — blind him!');
    _objectiveForState();
    try { if (window.AudioSystem && AudioSystem.playWaveStart) AudioSystem.playWaveStart(); } catch (e) {}
    return true;
  }

  /* ── impact routing ────────────────────────────────────── */
  function notifyImpact(pos, dmg, kind) {
    if (!_active || !_t90 || _phase === 'dead') return false;
    if (!pos || !isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z) || !isFinite(dmg)) return false;
    var gp = _t90.group.position;
    var dx = pos.x - gp.x, dy = pos.y - (gp.y + 1.4), dz = pos.z - gp.z;
    var d2 = dx * dx + dy * dy + dz * dz;
    if (d2 > 36) return false;
    var mult = (kind === 'AP') ? 1.25 : (kind === 'TOW') ? 6 : (kind === 'FPV') ? 3 : (kind === 'COAX') ? 0.15 : 1;
    var dealt = dmg * mult;

    // A bailed wreck is finished by a heavy warhead — TOW or FPV — which is
    // the scripted cinematic; 25mm just keeps chewing hull the slow way.
    if (_phase === 'finish' && (kind === 'TOW' || kind === 'FPV' || dmg >= 250)) {
      _hp.hull = 0;
      _updateHpBar();
      _onDestroyed(pos);
      return true;
    }

    // Component pools with overflow into the hull. Center-mass fire also
    // sprays the running gear (45%) until the tracks die — guarantees the
    // mobility-kill spin-out happens before the crew breaks.
    if (dy > 0.35 && _hp.optics > 0) {
      _hp.optics -= dealt;
      if (_hp.optics <= 0) { _hp.hull += _hp.optics; _hp.optics = 0; _onOpticsDead(); }
    } else if (dy < -0.55 && _hp.tracks > 0) {
      _hp.tracks -= dealt;
      if (_hp.tracks <= 0) { _hp.hull += _hp.tracks; _hp.tracks = 0; _onMobilityKill(); }
    } else if (_hp.tracks > 0) {
      var toTracks = dealt * 0.45;
      _hp.tracks -= toTracks;
      _hp.hull -= dealt - toTracks;
      if (_hp.tracks <= 0) { _hp.hull += _hp.tracks; _hp.tracks = 0; _onMobilityKill(); }
    } else {
      _hp.hull -= dealt;
    }
    if (mult >= 1 && _t90.era.length && Math.random() < 0.4) {
      var b = _t90.era.pop();
      try {
        var wp = new THREE.Vector3(); b.getWorldPosition(wp);
        _explosionFx(wp, false);
        if (b.parent) b.parent.remove(b);
        if (b.geometry) b.geometry.dispose();
        if (b.material) b.material.dispose();
      } catch (e) {}
    }
    _updateHpBar();
    if (_phase !== 'bail' && _phase !== 'finish' && _hp.hull <= HP.hull * HULL_BAIL_FRAC) _onCrewBail();
    if (_hp.hull <= 0) _onDestroyed(pos);
    return true;
  }

  function _onOpticsDead() {
    try {
      _t90.sight.material.color.setHex(0x0a0a0a);
      _t90.sight.scale.set(0.7, 0.5, 0.7);
      _t90.cSight.visible = false;
    } catch (e) {}
    if (_phase === 'engage') { _phase = 'blind'; _phaseT = 0; }
    _toast('🎯 SOSNA-U DESTROYED — THE TANK IS BLIND', '#7fff9f');
    _radio('His optics are gone! He’s firing wild!');
    _objectiveForState();
  }

  function _onMobilityKill() {
    try { _t90.trkL.material.color.setHex(0x0f0f0f); _t90.trkR.material.color.setHex(0x0f0f0f); } catch (e) {}
    if (_phase === 'engage' || _phase === 'blind') { _phase = 'panic'; _phaseT = 0; _spinDir = Math.random() < 0.5 ? -1 : 1; }
    _toast('💥 MOBILITY KILL — IT’S SPINNING OUT', '#7fff9f');
    _radio('Track’s off! Look at him spin — keep pouring it on!');
    _objectiveForState();
  }

  function _onCrewBail() {
    if (_bailSpawned) return;
    _bailSpawned = true;
    _phase = 'finish'; _phaseT = 0;
    try { _t90.hatchL.position.y += 0.3; _t90.hatchL.rotation.x = 1.2; } catch (e) {}
    try { _t90.hatchR.position.y += 0.3; _t90.hatchR.rotation.x = -1.1; } catch (e) {}
    var gp = _t90.group.position;
    try {
      if (window.Enemies && Enemies.spawnSingle) {
        for (var i = 0; i < 3; i++) {
          var e = Enemies.spawnSingle('CONSCRIPT', { x: gp.x + (i - 1) * 2.2, z: gp.z + 2.5 + i }, { fleeing: true });
          if (e) {
            e.morale = -1;
            // If no infantry wave has run yet this session, the Enemies module
            // may not have adopted the scene — parent the mesh ourselves.
            try { if (e.mesh && !e.mesh.parent && _scene) _scene.add(e.mesh); } catch (e2) {}
          }
        }
      }
    } catch (e3) {}
    _toast('🏃 CREW IS BAILING OUT', '#ffd24a');
    _radio('They’re abandoning it! Crew in the open!');
    _objectiveForState();
  }

  function _onDestroyed(pos) {
    if (_phase === 'dead') return;
    _phase = 'dead';
    _hp.hull = 0;
    _updateHpBar();
    var gp = new THREE.Vector3(_t90.group.position.x, _t90.group.position.y + 1.6, _t90.group.position.z);
    _explosionFx(gp, true);
    try {
      _t90.turret.userData.toss = { vy: 14 + Math.random() * 5, spin: (Math.random() - 0.5) * 6, vx: 1.5 + Math.random() * 1.5 };
    } catch (e) {}
    _toast('☠ T-90M DESTROYED — STEPOVE HOLDS', '#7fff9f');
    _radio('Target destroyed. Beautiful work, gunner.');
    _objective('T-90M DESTROYED');
    try { if (window.CameraSystem && CameraSystem.playLastKillCam) CameraSystem.playLastKillCam(gp, GameManager.getCamera().position); } catch (e) {}
    try { if (window.Progression && Progression.checkAchievement) Progression.checkAchievement('TANK_HUNTER', 1); } catch (e) {}
    _completeTimer = 4.0;
  }

  /* ── per-frame ─────────────────────────────────────────── */
  function update(delta) {
    if (!_active || !_t90) return;
    _phaseT += delta;
    var g = _t90.group;
    var pp = _playerPos();
    var dx = pp.x - g.position.x, dz = pp.z - g.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz) || 0.001;

    try { g.position.y += ((VoxelWorld.getTerrainHeight(g.position.x, g.position.z)) - g.position.y) * Math.min(1, delta * 6); } catch (e) {}

    if (_phase === 'engage' || _phase === 'blind') {
      var wantYaw = Math.atan2(dx, dz);
      var dyaw = ((wantYaw - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      g.rotation.y += dyaw * Math.min(1, delta * 1.4);
      if (dist > T90_STOP_DIST) {
        g.position.x += Math.sin(g.rotation.y) * T90_SPEED * delta;
        g.position.z += Math.cos(g.rotation.y) * T90_SPEED * delta;
      }
      _fireCool -= delta;
      if (_fireCool <= 0) {
        _fireCool = (_phase === 'blind') ? 3.2 : 5.5;
        _fireMainGun(dist, _phase === 'blind');
      }
    } else if (_phase === 'panic') {
      g.rotation.y += _spinDir * delta * 1.9;
      try { _t90.turret.rotation.y -= _spinDir * delta * 2.6; } catch (e) {}
      _fireCool -= delta;
      if (_fireCool <= 0) { _fireCool = 2.4; _fireMainGun(dist, true); }
      if (_phaseT > 7) { _onCrewBail(); }
    } else if (_phase === 'finish') {
      try { _t90.turret.rotation.y += Math.sin(_phaseT * 0.7) * delta * 0.2; } catch (e) {}
    } else if (_phase === 'dead') {
      var toss = _t90.turret.userData.toss;
      if (toss) {
        _t90.turret.position.y += toss.vy * delta;
        _t90.turret.position.x += toss.vx * delta;
        toss.vy -= 22 * delta;
        _t90.turret.rotation.z += toss.spin * delta;
        // land beside the hull, upside-down-ish
        if (_t90.turret.position.y < 0.55 && toss.vy < 0) {
          _t90.turret.userData.toss = null;
          _t90.turret.position.y = 0.55;
          _t90.turret.rotation.z = 2.6;
        }
      }
      if (_completeTimer > 0) {
        _completeTimer -= delta;
        if (_completeTimer <= 0 && _onComplete) { var cb = _onComplete; _onComplete = null; cb(); }
      }
    }

    _smokeT -= delta;
    var hurt = 1 - _hpTotal() / _hpMax();
    if (_smokeT <= 0 && hurt > 0.25) {
      _smokeT = Math.max(0.08, 0.5 - hurt * 0.45);
      try {
        var sp = new THREE.Vector3(g.position.x + (Math.random() - 0.5) * 2, g.position.y + 2.2, g.position.z + (Math.random() - 0.5) * 2);
        if (window.Tracers && Tracers.spawnSmoke) {
          Tracers.spawnSmoke(sp);
          if (_phase === 'dead') Tracers.spawnSmoke(new THREE.Vector3(sp.x + 0.6, sp.y + 0.8, sp.z - 0.4));
        }
      } catch (e) {}
    }
  }

  function _fireMainGun(dist, blind) {
    var g = _t90.group;
    try {
      // muzzle at the real barrel tip, flash directed along the shot line
      var mz = new THREE.Vector3();
      _t90.barrel.getWorldPosition(mz);
      var pp0 = _playerPos();
      var dir = new THREE.Vector3(pp0.x - mz.x, 0, pp0.z - mz.z).normalize();
      mz.addScaledVector(dir, 2.7); mz.y += 0.15;
      if (window.Tracers && Tracers.spawnMuzzleFlash) Tracers.spawnMuzzleFlash(mz, dir);
      if (window.AudioSystem && AudioSystem.playExplosionFar) AudioSystem.playExplosionFar();
    } catch (e) {}
    var missR = blind ? (8 + Math.random() * 16) : (2.5 + Math.random() * 5);
    var pp = _playerPos();
    var ix = pp.x + (Math.random() - 0.5) * missR * 2;
    var iz = pp.z + (Math.random() - 0.5) * missR * 2;
    var iy = 0; try { iy = VoxelWorld.getTerrainHeight(ix, iz); } catch (e) {}
    var impact = new THREE.Vector3(ix, iy + 0.4, iz);
    _explosionFx(impact, false);
    var ddx = impact.x - pp.x, ddz = impact.z - pp.z;
    if (ddx * ddx + ddz * ddz < 20) {
      // through the real damage pipeline: armor, god mode, death handling
      try { if (window._takeVehicleRamDamage) window._takeVehicleRamDamage(Math.round(GUN_DMG * 0.4)); } catch (e) {}
    }
    try { if (window.VoxelWorld && VoxelWorld.damageBlock) VoxelWorld.damageBlock(Math.round(ix), Math.round(iy), Math.round(iz), 200); } catch (e) {}
  }

  /* ── misc API ──────────────────────────────────────────── */
  function isActive() { return _active; }
  function isTankTargetable() { return _active && !!_t90 && _phase !== 'dead'; }
  function getT90() { return _t90; }
  function getProgress() {
    if (!_hp) return { done: 0, total: 1, phase: _phase };
    return { done: _phase === 'dead' ? 1 : 0, total: 1, phase: _phase, hull: Math.max(0, _hp.hull), optics: Math.max(0, _hp.optics), tracks: Math.max(0, _hp.tracks) };
  }
  function clear() {
    _active = false; _phase = 'idle'; _onComplete = null;
    if (_t90) {
      try {
        if (_scene) _scene.remove(_t90.group);
        _t90.group.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (o.material.map) o.material.map.dispose();
            o.material.dispose();
          }
        });
        if (_t90.zTex) _t90.zTex.dispose();
      } catch (e) {}
    }
    _t90 = null; _bailSpawned = false;
    if (_objEl) { try { _objEl.style.display = 'none'; } catch (e) {} }
    try { if (_hpBarShown && window.Enemies && Enemies.hideBossHPBar) Enemies.hideBossHPBar(); } catch (e) {}
    _hpBarShown = false;
  }

  return {
    init: init,
    startMission: startMission,
    update: update,
    notifyImpact: notifyImpact,
    isActive: isActive,
    isTankTargetable: isTankTargetable,
    getT90: getT90,
    getProgress: getProgress,
    clear: clear,
  };
})();
