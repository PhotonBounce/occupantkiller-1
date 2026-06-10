/* ───────────────────────────────────────────────────────────────────────
   CONVOY SYSTEM — Battle of Kyiv armored columns
   Spawns T-72/BTR columns that advance along road routes toward a defended
   zone (Maidan). Units are normal Enemies (AT homing, armor, kill credit and
   wave-clear checks all work unchanged); only their STEERING is delegated
   here via the e._convoy hook in enemies.js.
   Also owns the city-integrity (KYIV HP) state for the capital-defense mode.
   Depends on: THREE, Enemies, VoxelWorld (terrain height), HUD (toasts),
   Tracers (wreck fire, optional).
   ─────────────────────────────────────────────────────────────────────── */
const ConvoySystem = (function () {
  'use strict';

  const SPACING = 9;          // column gap between vehicles (units)
  const WP_REACH = 5;         // leader advances waypoint when this close
  const HOLD_DIST = 5;        // follower holds if closer than this to its slot
  const MAX_WRECK_FIRES = 8;

  let _scene = null;
  let _convoys = [];
  let _nextId = 1;
  let _wreckFires = 0;

  // ── City integrity (capital-defense objective state) ──
  let _cityHP = 100;
  let _defenseZone = { x: 0, z: 1, radius: 12 };   // Maidan monument plaza
  const BREACH_DMG = { TANK: 15, BTR: 8, BOSS: 30 };

  function _terrainY(x, z) {
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
        return VoxelWorld.getTerrainHeight(x, z) || 0;
      }
    } catch (e) {}
    return 0;
  }

  // Sample a straight route from (x0,z0) to (x1,z1) every `step` units.
  function _buildRoute(x0, z0, x1, z1, step) {
    step = step || 6;
    const pts = [];
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.sqrt(dx * dx + dz * dz);
    const n = Math.max(2, Math.ceil(len / step));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (dx * i) / n;
      const z = z0 + (dz * i) / n;
      pts.push(new THREE.Vector3(x, _terrainY(x, z), z));
    }
    return pts;
  }

  // Approach axes onto the defense zone. Built lazily so terrain exists.
  function _routeFor(name) {
    switch (name) {
      case 'east': return _buildRoute(120, 0, 14, 0);
      case 'west': return _buildRoute(-120, 0, -14, 0);
      case 'south': return _buildRoute(0, -120, 0, -12);
      case 'north':
      default: return _buildRoute(0, 120, 0, 12);
    }
  }

  /* ── Spawning ─────────────────────────────────────────────────────── */
  // opts: { route: 'north'|'east'|'west'|'south', tanks, btrs, bossLead }
  function spawnConvoy(waveNum, opts) {
    opts = opts || {};
    if (typeof Enemies === 'undefined' || !Enemies.spawnSingle) return null;
    const route = _routeFor(opts.route || 'north');
    const w = waveNum || 1;

    let tanks = (opts.tanks != null) ? opts.tanks : 2 + Math.ceil(w / 2);
    let btrs = (opts.btrs != null) ? opts.btrs : 1 + Math.floor(w / 3);
    // Lone-wolf scale (mirrors the 0.6x infantry solo scale)
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getPlayer &&
          GameManager.getPlayer().role !== 'brigade') {
        tanks = Math.max(2, Math.round(tanks * 0.75));
        btrs = Math.max(1, Math.round(btrs * 0.75));
      }
    } catch (e) {}

    // March order: tanks lead, BTRs interleaved behind every 2nd tank.
    const order = [];
    let bi = 0;
    for (let t = 0; t < tanks; t++) {
      order.push('TANK');
      if (bi < btrs && t % 2 === 1) { order.push('BTR'); bi++; }
    }
    while (bi < btrs) { order.push('BTR'); bi++; }

    const convoy = { id: _nextId++, units: [], route: route, wpIdx: 0, state: 'advancing' };
    // Spawn back along the approach axis so the column drives IN from off-map.
    const dir = route[1].clone().sub(route[0]).normalize();
    for (let s = 0; s < order.length; s++) {
      const p = route[0].clone().addScaledVector(dir, -s * SPACING);
      p.y = _terrainY(p.x, p.z);
      const e = Enemies.spawnSingle(order[s], { x: p.x, z: p.z }, { convoy: { id: convoy.id, slot: s } });
      if (e) convoy.units.push(e);
    }
    _convoys.push(convoy);
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        const axis = (opts.route || 'north').toUpperCase();
        HUD.showToast('⚠ ARMORED COLUMN ADVANCING FROM THE ' + axis + ' — ' +
          tanks + ' tanks, ' + btrs + ' APCs', 5000, '#ff5555');
      }
    } catch (e2) {}
    return convoy;
  }

  /* ── Steering ─────────────────────────────────────────────────────── */
  function _findConvoy(id) {
    for (let i = 0; i < _convoys.length; i++) if (_convoys[i].id === id) return _convoys[i];
    return null;
  }

  function getMoveTarget(enemy) {
    if (!enemy || !enemy._convoy) return null;
    const c = _findConvoy(enemy._convoy.id);
    if (!c || !enemy.alive || !enemy.mesh) return null;
    const idx = c.units.indexOf(enemy);
    if (idx < 0) return null;
    if (idx === 0) {
      return c.route[Math.min(c.wpIdx, c.route.length - 1)];
    }
    // Follower: a point SPACING behind the predecessor, along the route axis.
    const pred = c.units[idx - 1];
    if (!pred || !pred.alive || !pred.mesh) return c.route[Math.min(c.wpIdx, c.route.length - 1)];
    const wp = c.route[Math.min(c.wpIdx, c.route.length - 1)];
    const dir = wp.clone().sub(pred.mesh.position);
    dir.y = 0;
    if (dir.lengthSq() < 0.01) dir.set(0, 0, -1); else dir.normalize();
    const slotPoint = pred.mesh.position.clone().addScaledVector(dir, -SPACING);
    slotPoint.y = pred.mesh.position.y;
    // Accordion: hold position when already on the slot (return own pos → no move)
    if (enemy.mesh.position.distanceTo(slotPoint) < HOLD_DIST) return enemy.mesh.position;
    return slotPoint;
  }

  /* ── Per-frame update: waypoint advance, pruning, breach checks ───── */
  function update(delta) {
    for (let ci = _convoys.length - 1; ci >= 0; ci--) {
      const c = _convoys[ci];
      // prune dead/removed units; mark wrecks
      for (let ui = c.units.length - 1; ui >= 0; ui--) {
        const u = c.units[ui];
        if (!u || !u.alive) {
          if (u && u.mesh && !u._wreckMarked) {
            u._wreckMarked = true;
            if (_wreckFires < MAX_WRECK_FIRES) {
              _wreckFires++;
              try { if (typeof Tracers !== 'undefined' && Tracers.spawnFire) Tracers.spawnFire(u.mesh.position, 4); } catch (e) {}
            }
          }
          c.units.splice(ui, 1);
        }
      }
      if (c.units.length === 0) { _convoys.splice(ci, 1); continue; }

      // leader waypoint advance
      const lead = c.units[0];
      if (lead && lead.mesh && c.wpIdx < c.route.length - 1) {
        const wp = c.route[c.wpIdx];
        const dx = lead.mesh.position.x - wp.x, dz = lead.mesh.position.z - wp.z;
        if (dx * dx + dz * dz < WP_REACH * WP_REACH) c.wpIdx++;
      }

      // breach check: any unit inside the defense zone hits the city
      for (let ui = c.units.length - 1; ui >= 0; ui--) {
        const u = c.units[ui];
        if (!u.mesh) continue;
        const bx = u.mesh.position.x - _defenseZone.x;
        const bz = u.mesh.position.z - _defenseZone.z;
        if (bx * bx + bz * bz <= _defenseZone.radius * _defenseZone.radius) {
          _applyBreach(u);
        }
      }
    }
  }

  function _applyBreach(unit) {
    const dmg = unit.isBoss ? BREACH_DMG.BOSS : (BREACH_DMG[unit.typeCfg && unit.typeCfg.name] || BREACH_DMG.BTR);
    _cityHP = Math.max(0, _cityHP - dmg);
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast('🔥 ARMOR BREACHED THE LINE — KYIV INTEGRITY −' + dmg + ' (' + _cityHP + '%)', 5000, '#ff3333');
      }
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.1, 0.6);
    } catch (e) {}
    // Remove THROUGH the normal death path so wave-clear bookkeeping stays
    // correct (no stalled waves). Score/XP/loot only flow through the
    // player-shot path (game-manager onEnemyHit), so a breach gives nothing.
    try { Enemies.damage(unit, 9999999, false); } catch (e2) {}
  }

  /* ── State / API ──────────────────────────────────────────────────── */
  function reset() {
    _convoys = [];
    _cityHP = 100;
    _wreckFires = 0;
  }

  const api = {
    init: function (scene) { _scene = scene; },
    spawnConvoy: spawnConvoy,
    getMoveTarget: getMoveTarget,
    update: update,
    getConvoys: function () { return _convoys; },
    getCityHP: function () { return _cityHP; },
    isCityLost: function () { return _cityHP <= 0; },
    setDefenseZone: function (x, z, r) { _defenseZone = { x: x, z: z, radius: r || 12 }; },
    getDefenseZone: function () { return _defenseZone; },
    hasActiveConvoy: function () { return _convoys.length > 0; },
    // Position of the nearest column leader (for the 3D mission waypoint)
    getLeadPosition: function (fromPos) {
      let best = null, bd = Infinity;
      for (let i = 0; i < _convoys.length; i++) {
        const u = _convoys[i].units[0];
        if (u && u.alive && u.mesh) {
          const d = fromPos ? u.mesh.position.distanceTo(fromPos) : 0;
          if (d < bd) { bd = d; best = u.mesh.position; }
        }
      }
      return best;
    },
    reset: reset,
  };
  if (typeof window !== 'undefined') window.ConvoySystem = api;
  return api;
})();
