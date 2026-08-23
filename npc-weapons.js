/* ───────────────────────────────────────────────────────────────────────
   NPC WEAPONS — faction weapons, aiming, firing FX and bullet physics for
   every non-player character.

   Design constraint from playtesting: NPC combat must not add per-character
   per-frame cost. Everything here is either O(1) per SHOT (a shot is a rare
   event) or a flat loop over fixed-size pools. Nothing allocates during a
   firefight: bullets, muzzle smoke and casings are recycled, and the lights
   come from the pool in tracers.js so the scene's light count never changes.
   ─────────────────────────────────────────────────────────────────────── */
window.NPCWeapons = (function () {
  'use strict';

  var _scene = null;

  /* ── Faction weapons ───────────────────────────────────────────────
     Ukrainian forces carry the M16 family, Russian forces the AK family.
     Sub-types stay available for roles that are not line infantry. */
  var KIND = {
    M16:    'M16',
    AK47:   'AK47',
    PISTOL: 'PISTOL',
    LMG:    'LMG',
    SNIPER: 'SNIPER'
  };

  var STATS = {
    M16:    { damage: 26, rpm: 700, range: 60, muzzleVel: 900, spread: 0.020, jam: 0.006, backfire: 0.0004, sound: 'rifle'  },
    AK47:   { damage: 29, rpm: 600, range: 52, muzzleVel: 715, spread: 0.026, jam: 0.010, backfire: 0.0009, sound: 'rifle'  },
    PISTOL: { damage: 14, rpm: 400, range: 28, muzzleVel: 340, spread: 0.040, jam: 0.008, backfire: 0.0006, sound: 'pistol' },
    LMG:    { damage: 22, rpm: 800, range: 70, muzzleVel: 825, spread: 0.034, jam: 0.014, backfire: 0.0008, sound: 'hmg'    },
    SNIPER: { damage: 85, rpm: 45,  range: 140, muzzleVel: 830, spread: 0.004, jam: 0.004, backfire: 0.0003, sound: 'rifle' }
  };

  function forFaction(faction, role) {
    var ukrainian = (faction === 'ukrainian' || faction === 'ally' || faction === 'civilian');
    if (role === 'PISTOL' || role === 'SNIPER' || role === 'LMG') return role;
    return ukrainian ? KIND.M16 : KIND.AK47;
  }

  /* ── Shared materials ──────────────────────────────────────────────
     One material per part type for the whole game. A fresh material per NPC
     weapon would mean a new shader program compile per unique material, which
     is the single most expensive thing this codebase can do at runtime. */
  var _M = null;
  function _mats() {
    if (_M) return _M;
    function lam(c) { return new THREE.MeshLambertMaterial({ color: c }); }
    _M = {
      steelDark: lam(0x1e1e20),
      steel:     lam(0x33343a),
      polyBlack: lam(0x232326),
      polyGreen: lam(0x3d4632),
      wood:      lam(0x6b4423),
      wood2:     lam(0x53341b),
      optic:     lam(0x131315),
      lens:      new THREE.MeshBasicMaterial({ color: 0x66aaff })
    };
    return _M;
  }

  /* ── Weapon meshes ─────────────────────────────────────────────────
     Built pointing down -Z with the origin at the grip, so mounting is a
     translate and aiming is a single lookAt on the pivot.
     The M16 and the AK are deliberately readable apart at a glance: the M16
     has a carry handle and a straight box magazine; the AK has wood furniture
     and a strongly curved magazine. */
  // Geometry cache. A level holds ~100 armed characters and each weapon is
  // ~12 boxes, so building fresh BoxGeometry per part per character means well
  // over a thousand redundant buffers. The dimensions repeat constantly, so
  // they are shared — meshes still have their own transform, and nothing here
  // ever mutates a geometry.
  var _geoCache = Object.create(null);
  function _geo(w, h, d) {
    var k = w + '|' + h + '|' + d;
    var g = _geoCache[k];
    if (!g) { g = new THREE.BoxGeometry(w, h, d); _geoCache[k] = g; }
    return g;
  }
  function _box(w, h, d, mat) { return new THREE.Mesh(_geo(w, h, d), mat); }

  function build(kind, scale) {
    var s = scale || 1;
    var M = _mats();
    var g = new THREE.Group();
    var i, p;

    if (kind === KIND.PISTOL) {
      p = _box(0.05, 0.09, 0.16, M.steelDark); p.position.set(0, 0, -0.06); g.add(p);
      p = _box(0.035, 0.03, 0.10, M.steel);    p.position.set(0, 0.02, -0.16); g.add(p);
      p = _box(0.04, 0.10, 0.05, M.polyBlack); p.position.set(0, -0.08, 0.01); g.add(p);
    } else if (kind === KIND.AK47) {
      // Receiver + wood handguard
      p = _box(0.055, 0.085, 0.30, M.steelDark); p.position.set(0, 0, -0.10); g.add(p);
      p = _box(0.062, 0.070, 0.24, M.wood);      p.position.set(0, -0.005, -0.30); g.add(p);
      // Barrel + gas tube + slanted muzzle brake
      p = _box(0.024, 0.024, 0.30, M.steel);     p.position.set(0, 0.005, -0.52); g.add(p);
      p = _box(0.026, 0.026, 0.16, M.steel);     p.position.set(0, 0.045, -0.34); g.add(p);
      p = _box(0.040, 0.040, 0.07, M.steelDark); p.position.set(0, 0.005, -0.70); p.rotation.x = 0.16; g.add(p);
      // Curved magazine — three segments stepping forward and down
      for (i = 0; i < 3; i++) {
        p = _box(0.038, 0.085, 0.055, M.polyGreen);
        p.position.set(0, -0.075 - i * 0.055, -0.14 - i * 0.030);
        p.rotation.x = -0.26 - i * 0.13;
        g.add(p);
      }
      // Wood stock, pistol grip, front sight post
      p = _box(0.050, 0.080, 0.26, M.wood2);     p.position.set(0, -0.020, 0.15); g.add(p);
      p = _box(0.042, 0.095, 0.050, M.polyBlack); p.position.set(0, -0.080, 0.01); p.rotation.x = 0.22; g.add(p);
      p = _box(0.020, 0.050, 0.020, M.steelDark); p.position.set(0, 0.055, -0.64); g.add(p);
    } else if (kind === KIND.SNIPER) {
      p = _box(0.055, 0.075, 0.36, M.steelDark); p.position.set(0, 0, -0.12); g.add(p);
      p = _box(0.022, 0.022, 0.58, M.steel);     p.position.set(0, 0.005, -0.60); g.add(p);
      p = _box(0.050, 0.070, 0.34, M.polyGreen); p.position.set(0, -0.015, 0.18); g.add(p);
      p = _box(0.045, 0.045, 0.22, M.optic);     p.position.set(0, 0.075, -0.18); g.add(p);
      p = _box(0.036, 0.036, 0.006, M.lens);     p.position.set(0, 0.075, -0.292); g.add(p);
      p = _box(0.042, 0.090, 0.048, M.polyBlack); p.position.set(0, -0.075, 0.02); g.add(p);
      // Bipod
      for (i = 0; i < 2; i++) {
        p = _box(0.008, 0.14, 0.008, M.steelDark);
        p.position.set(i ? 0.045 : -0.045, -0.085, -0.66);
        p.rotation.z = i ? -0.3 : 0.3;
        g.add(p);
      }
    } else if (kind === KIND.LMG) {
      p = _box(0.070, 0.095, 0.36, M.steelDark); p.position.set(0, 0, -0.12); g.add(p);
      p = _box(0.028, 0.028, 0.46, M.steel);     p.position.set(0, 0.010, -0.54); g.add(p);
      p = _box(0.090, 0.110, 0.13, M.polyGreen); p.position.set(0, -0.085, -0.08); g.add(p);  // belt box
      p = _box(0.050, 0.075, 0.26, M.wood2);     p.position.set(0, -0.015, 0.16); g.add(p);
      p = _box(0.042, 0.095, 0.050, M.polyBlack); p.position.set(0, -0.080, 0.02); g.add(p);
      for (i = 0; i < 2; i++) {
        p = _box(0.008, 0.15, 0.008, M.steelDark);
        p.position.set(i ? 0.05 : -0.05, -0.09, -0.62);
        p.rotation.z = i ? -0.32 : 0.32;
        g.add(p);
      }
    } else {
      // M16 / M4 family
      p = _box(0.052, 0.080, 0.30, M.polyBlack); p.position.set(0, 0, -0.10); g.add(p);
      p = _box(0.058, 0.058, 0.26, M.polyBlack); p.position.set(0, 0, -0.34); g.add(p);   // handguard
      p = _box(0.020, 0.020, 0.34, M.steel);     p.position.set(0, 0, -0.60); g.add(p);   // barrel
      p = _box(0.030, 0.030, 0.06, M.steelDark); p.position.set(0, 0, -0.79); g.add(p);   // flash hider
      p = _box(0.036, 0.048, 0.24, M.polyBlack); p.position.set(0, 0.062, -0.12); g.add(p); // carry handle
      p = _box(0.020, 0.055, 0.020, M.steelDark); p.position.set(0, 0.055, -0.68); g.add(p); // front post
      p = _box(0.040, 0.100, 0.048, M.polyBlack); p.position.set(0, -0.078, -0.12); g.add(p); // straight mag
      p = _box(0.052, 0.075, 0.24, M.polyBlack); p.position.set(0, -0.010, 0.14); g.add(p);  // stock
      p = _box(0.042, 0.090, 0.048, M.polyBlack); p.position.set(0, -0.075, 0.01); p.rotation.x = 0.18; g.add(p);
    }

    if (s !== 1) g.scale.setScalar(s);
    g.userData.npcWeaponKind = kind;
    // The muzzle in weapon-local space, for flash/smoke/bullet origin.
    g.userData.muzzle = new THREE.Vector3(0, 0.005, kind === KIND.PISTOL ? -0.24 : (kind === KIND.SNIPER ? -0.90 : -0.82));
    return g;
  }

  /* ── Mounting ──────────────────────────────────────────────────────
     The weapon hangs off a pivot at the right shoulder. Aiming rotates the
     pivot, not the character, so the body can face its movement direction
     while the muzzle tracks the target — which is what "pointing the weapon"
     actually looks like. */
  function mount(charGroup, kind, scale) {
    if (!charGroup) return null;
    var s = scale || 1;
    var pivot = new THREE.Group();
    pivot.position.set(0.26 * s, 1.05 * s, 0);
    var w = build(kind, s);
    w.position.set(0, -0.06 * s, -0.10 * s);
    pivot.add(w);
    charGroup.add(pivot);
    charGroup.userData.weaponPivot = pivot;
    charGroup.userData.weaponMesh  = w;
    charGroup.userData.weaponKind  = kind;
    return pivot;
  }

  var _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();

  /* Aim the mounted weapon at a world point. One lookAt; callers throttle. */
  function aimAt(charGroup, targetWorld) {
    var pivot = charGroup && charGroup.userData && charGroup.userData.weaponPivot;
    if (!pivot || !targetWorld) return;
    pivot.getWorldPosition(_v1);
    _v2.copy(targetWorld).sub(_v1);
    if (_v2.lengthSq() < 1e-6) return;
    // lookAt orients +Z at the target; the weapon is modelled along -Z.
    _v3.copy(_v1).sub(_v2);
    pivot.lookAt(_v3);
  }

  /* Rest position when no target — muzzle down and forward, not stuck aiming
     at wherever the last target died. */
  function relax(charGroup, delta) {
    var pivot = charGroup && charGroup.userData && charGroup.userData.weaponPivot;
    if (!pivot) return;
    var k = Math.min(1, (delta || 0.016) * 4);
    pivot.rotation.x += (0.35 - pivot.rotation.x) * k;
    pivot.rotation.y += (0 - pivot.rotation.y) * k;
    pivot.rotation.z += (0 - pivot.rotation.z) * k;
  }

  /* ── Bullet pool ───────────────────────────────────────────────────
     Real travel time and drop, but resolved against ONLY the intended target
     and the player. A full broad-phase per bullet is exactly the sort of
     processor-intensive NPC work this has to avoid, and at these ranges the
     difference is not visible. */
  var MAX_BULLETS = 96;
  var _bullets = [];
  var _bulletHead = 0;
  function _initBullets() {
    if (_bullets.length) return;
    for (var i = 0; i < MAX_BULLETS; i++) {
      _bullets.push({
        active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
        life: 0, dmg: 0, target: null, hitPlayer: false, faction: ''
      });
    }
  }

  var GRAVITY = 9.81;

  function _spawnBullet(ox, oy, oz, dx, dy, dz, speed, dmg, target, hitPlayer, faction) {
    _initBullets();
    // Round-robin: the oldest slot is reused when saturated, which caps the
    // cost of a sustained firefight instead of letting it grow.
    var b = null;
    for (var n = 0; n < MAX_BULLETS; n++) {
      var cand = _bullets[(_bulletHead + n) % MAX_BULLETS];
      if (!cand.active) { b = cand; _bulletHead = (_bulletHead + n + 1) % MAX_BULLETS; break; }
    }
    if (!b) { b = _bullets[_bulletHead]; _bulletHead = (_bulletHead + 1) % MAX_BULLETS; }
    b.active = true;
    b.x = ox; b.y = oy; b.z = oz;
    b.vx = dx * speed; b.vy = dy * speed; b.vz = dz * speed;
    b.life = 2.2; b.dmg = dmg; b.target = target; b.hitPlayer = !!hitPlayer; b.faction = faction || '';
    return b;
  }

  function updateBullets(delta, ctx) {
    if (!_bullets.length) return;
    var d = Math.min(delta, 0.1);
    var px = null, py = null, pz = null;
    if (ctx && ctx.playerPos) { px = ctx.playerPos.x; py = ctx.playerPos.y; pz = ctx.playerPos.z; }
    for (var i = 0; i < MAX_BULLETS; i++) {
      var b = _bullets[i];
      if (!b.active) continue;
      b.life -= d;
      if (b.life <= 0) { b.active = false; continue; }
      b.vy -= GRAVITY * d;                        // drop
      var nx = b.x + b.vx * d, ny = b.y + b.vy * d, nz = b.z + b.vz * d;

      // Intended target: swept-sphere test against the segment travelled.
      var t = b.target;
      if (t && t.mesh && !t.dead && (t.hp === undefined || t.hp > 0)) {
        var tp = t.mesh.position;
        if (_segNear(b.x, b.y, b.z, nx, ny, nz, tp.x, tp.y + 0.9, tp.z, 0.55)) {
          if (ctx && ctx.onHitTarget) ctx.onHitTarget(t, b.dmg, nx, ny, nz);
          b.active = false;
          continue;
        }
      }
      if (b.hitPlayer && px !== null) {
        if (_segNear(b.x, b.y, b.z, nx, ny, nz, px, py, pz, 0.5)) {
          if (ctx && ctx.onHitPlayer) ctx.onHitPlayer(b.dmg, nx, ny, nz);
          b.active = false;
          continue;
        }
      }
      // Ground stop.
      var gh = 0;
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        try { gh = VoxelWorld.getTerrainHeight(nx, nz) || 0; } catch (e) { gh = 0; }
      }
      if (ny <= gh) {
        if (typeof Tracers !== 'undefined' && Tracers.spawnBlockImpact) {
          try { Tracers.spawnBlockImpact(new THREE.Vector3(nx, gh + 0.02, nz)); } catch (e) {}
        }
        b.active = false;
        continue;
      }
      b.x = nx; b.y = ny; b.z = nz;
    }
  }

  // Distance from point P to segment AB, squared, compared against r².
  function _segNear(ax, ay, az, bx, by, bz, px, py, pz, r) {
    var abx = bx - ax, aby = by - ay, abz = bz - az;
    var apx = px - ax, apy = py - ay, apz = pz - az;
    var ab2 = abx * abx + aby * aby + abz * abz;
    var t = ab2 > 0 ? (apx * abx + apy * aby + apz * abz) / ab2 : 0;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    var cx = ax + abx * t - px, cy = ay + aby * t - py, cz = az + abz * t - pz;
    return (cx * cx + cy * cy + cz * cz) <= r * r;
  }

  /* ── Muzzle smoke pool ─────────────────────────────────────────────
     Grey additive quads that rise and fade. Fixed pool, no allocation. */
  var SMOKE_POOL = 24;
  var _smoke = [];
  var _smokeGeo = null, _smokeMat = null;
  function _initSmoke() {
    if (_smoke.length || !_scene) return;
    _smokeGeo = new THREE.PlaneGeometry(0.3, 0.3);
    _smokeMat = new THREE.MeshBasicMaterial({
      color: 0xb0b0b0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
    });
    for (var i = 0; i < SMOKE_POOL; i++) {
      // Each puff needs its own opacity, so each gets its own material clone —
      // but only SMOKE_POOL of them exist for the whole game, created once.
      var m = new THREE.Mesh(_smokeGeo, _smokeMat.clone());
      m.visible = false;
      m.frustumCulled = false;
      _scene.add(m);
      _smoke.push({ mesh: m, life: 0, max: 0, vy: 0 });
    }
  }
  function _puff(x, y, z, big) {
    _initSmoke();
    for (var i = 0; i < _smoke.length; i++) {
      var s = _smoke[i];
      if (s.life > 0) continue;
      s.max = big ? 1.1 : 0.5;
      s.life = s.max;
      s.vy = big ? 0.9 : 0.45;
      s.mesh.position.set(x, y, z);
      s.mesh.scale.setScalar(big ? 1.2 : 0.55);
      s.mesh.visible = true;
      s.mesh.material.opacity = big ? 0.6 : 0.35;
      return;
    }
  }
  function _updateSmoke(delta, camera) {
    for (var i = 0; i < _smoke.length; i++) {
      var s = _smoke[i];
      if (s.life <= 0) continue;
      s.life -= delta;
      if (s.life <= 0) { s.mesh.visible = false; s.mesh.material.opacity = 0; continue; }
      var f = s.life / s.max;
      s.mesh.position.y += s.vy * delta;
      s.mesh.scale.setScalar(s.mesh.scale.x + delta * 0.7);
      s.mesh.material.opacity = f * 0.45;
      if (camera) s.mesh.quaternion.copy(camera.quaternion);   // billboard
    }
  }

  /* ── Firing ────────────────────────────────────────────────────────
     Returns 'fired' | 'jam' | 'backfire' | 'blocked'. */
  function fire(charGroup, targetWorld, opts) {
    opts = opts || {};
    var kind = (charGroup.userData && charGroup.userData.weaponKind) || KIND.AK47;
    var st = STATS[kind] || STATS.AK47;
    var ud = charGroup.userData || (charGroup.userData = {});

    // Jam clearing occupies the shooter for a moment; it is a timer, not AI.
    if (ud.wpnJamUntil && ud.wpnJamUntil > _now()) return 'blocked';

    var pivot = ud.weaponPivot;
    var w = ud.weaponMesh;
    if (!pivot || !w) return 'blocked';

    // Muzzle position in world space, taken from the actual weapon mesh, so the
    // flash comes out of the barrel rather than out of the character's middle.
    w.updateMatrixWorld();
    _v1.copy(w.userData.muzzle || _v1.set(0, 0, -0.8)).applyMatrix4(w.matrixWorld);
    _v2.copy(targetWorld).sub(_v1);
    var dist = _v2.length();
    if (dist < 0.001) return 'blocked';
    _v2.divideScalar(dist);

    // Rare catastrophic backfire: the round detonates in the chamber.
    if (Math.random() < st.backfire) {
      ud.wpnJamUntil = _now() + 3.2;
      _puff(_v1.x, _v1.y, _v1.z, true);
      if (typeof Tracers !== 'undefined' && Tracers.spawnMuzzleFlash) {
        try { Tracers.spawnMuzzleFlash(_v1, _v2); } catch (e) {}
      }
      if (typeof Tracers !== 'undefined' && Tracers.spawnSparks) {
        try { Tracers.spawnSparks(_v1); } catch (e) {}
      }
      _sound('backfire', st.sound, charGroup);
      if (opts.onBackfire) opts.onBackfire();
      return 'backfire';
    }

    // Jam: a dead trigger and a click. Dirtier weapons jam more (see STATS).
    if (Math.random() < st.jam) {
      ud.wpnJamUntil = _now() + (1.4 + Math.random() * 1.6);
      _sound('jam', st.sound, charGroup);
      return 'jam';
    }

    // Spread cone, widened while suppressed or moving if the caller says so.
    var spread = st.spread * (opts.spreadMult || 1);
    var dx = _v2.x + (Math.random() - 0.5) * spread * 2;
    var dy = _v2.y + (Math.random() - 0.5) * spread * 2;
    var dz = _v2.z + (Math.random() - 0.5) * spread * 2;
    var L = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    dx /= L; dy /= L; dz /= L;
    // Aim slightly high so gravity drop lands on target at typical range.
    dy += Math.min(0.06, (dist * GRAVITY) / (2 * st.muzzleVel * st.muzzleVel) * 6);

    _spawnBullet(_v1.x, _v1.y, _v1.z, dx, dy, dz, st.muzzleVel * 0.16,
                 opts.damage != null ? opts.damage : st.damage,
                 opts.target || null, !!opts.canHitPlayer, opts.faction || '');

    // Fire and smoke at the muzzle.
    if (typeof Tracers !== 'undefined') {
      try {
        if (Tracers.spawnMuzzleFlash) Tracers.spawnMuzzleFlash(_v1, _v2);
        if (Tracers.spawnTracer) Tracers.spawnTracer(_v1, _v2, opts.tracerColor || 0xffcc44, st.muzzleVel * 0.16);
        if (Tracers.spawnCasing) Tracers.spawnCasing(_v1);
      } catch (e) {}
    }
    _puff(_v1.x, _v1.y + 0.02, _v1.z, false);

    // Recoil kick on the pivot; recovers in update().
    pivot.rotation.x -= 0.06 + Math.random() * 0.03;
    ud.wpnRecoil = 0.12;

    _sound('shot', st.sound, charGroup);
    return 'fired';
  }

  function isJammed(charGroup) {
    var ud = charGroup && charGroup.userData;
    return !!(ud && ud.wpnJamUntil && ud.wpnJamUntil > _now());
  }

  function _now() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; }

  function _sound(what, soundType, charGroup) {
    if (typeof AudioSystem === 'undefined') return;
    try {
      if (what === 'shot') {
        if (AudioSystem.playSpatialGunshot && charGroup && window.GAME && GAME.camera) {
          AudioSystem.playSpatialGunshot(soundType, charGroup.position, GAME.camera.position, 0);
        } else if (AudioSystem.playGunshot) {
          AudioSystem.playGunshot(soundType);
        }
      } else if (what === 'jam') {
        // A dry mechanical click. Reuse the reload/click cue if the audio
        // system has one; otherwise stay silent rather than play a gunshot.
        if (AudioSystem.playClick) AudioSystem.playClick();
        else if (AudioSystem.playDryFire) AudioSystem.playDryFire();
      } else if (what === 'backfire') {
        if (AudioSystem.playExplosion) AudioSystem.playExplosion(0.35);
        else if (AudioSystem.playGunshot) AudioSystem.playGunshot('hmg');
      }
    } catch (e) {}
  }

  /* ── Frame update ──────────────────────────────────────────────────
     One flat pass over the pools. Independent of how many NPCs exist. */
  function update(delta, ctx) {
    if (!_scene) return;
    updateBullets(delta, ctx);
    _updateSmoke(delta, ctx && ctx.camera);
  }

  function init(scene) {
    _scene = scene;
    _smoke.length = 0;
    _initBullets();
    for (var i = 0; i < _bullets.length; i++) _bullets[i].active = false;
  }

  function clear() {
    for (var i = 0; i < _bullets.length; i++) _bullets[i].active = false;
    for (var j = 0; j < _smoke.length; j++) {
      _smoke[j].life = 0;
      _smoke[j].mesh.visible = false;
    }
  }

  return {
    KIND: KIND,
    STATS: STATS,
    init: init,
    clear: clear,
    update: update,
    build: build,
    mount: mount,
    aimAt: aimAt,
    relax: relax,
    fire: fire,
    isJammed: isJammed,
    forFaction: forFaction
  };
})();
