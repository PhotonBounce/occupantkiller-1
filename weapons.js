// Ensure window.Weapons is always defined before any code runs (robust for QA/headless)
if (typeof window !== 'undefined' && typeof window.Weapons === 'undefined') {
  window.Weapons = {};
}
// Ensure AudioSystem is always defined for direct references
if (typeof AudioSystem === 'undefined' && typeof window !== 'undefined' && window.AudioSystem) {
  AudioSystem = window.AudioSystem;
}
/**
 * weapons.js – 23-weapon Ukrainian war arsenal with melee, projectiles, grenades, fire & scope zoom
 * Switch with keys 1-0, Q/E scroll. Weapons 0 (shovel) and 1 (pistol) start unlocked.
 * Depends on: Three.js global (THREE), HUD, VoxelWorld, Enemies
 */

const Weapons = (() => {
  // ── Weapon definitions ────────────────────────────────────
  const WEAPONS = (typeof WeaponData !== 'undefined' && WeaponData.WEAPONS) ? WeaponData.WEAPONS : [];
  // NOTE: weapon definitions moved to weapons-data.js — load it BEFORE weapons.js

  // ── Per-weapon mutable state ───────────────────────────────
  function makeState(cfg) {
    var initReserve = cfg.maxReserve;
    // Ensure player always starts with at least 5 grenades available
    if (cfg.type === 'GRENADE' && initReserve < 5) initReserve = 5;
    return {
      clip: cfg.clipSize, reserve: initReserve,
      reloading: false, reloadTimer: 0, fireCooldown: 0,
      jammed: false, shotsSinceClean: 0,
    };
  }
  let states     = WEAPONS.map(makeState);
  let currentIdx = 0;
  // Gatling (0), Shovel (1), and Drone Jammer (last) start unlocked
  let _jammerIdx = WEAPONS.findIndex(function(w) { return w.id === 'DRONEJAMMER'; });
  let unlocked   = WEAPONS.map(function(_, i) { return i <= 1 || i === _jammerIdx; });

  // Unlock weapons per stage (example: 2 new weapons per stage)
  function unlockForStage(stageNum) {
    // Always keep first 2 + jammer unlocked
    for (let i = 2; i < WEAPONS.length; i++) {
      unlocked[i] = (i === _jammerIdx);
    }
    // Example: unlock 2 new weapons per stage (after first 2)
    let unlockCount = Math.min(2 * stageNum, WEAPONS.length - 2);
    for (let i = 2; i < 2 + unlockCount; i++) {
      if (i < WEAPONS.length && i !== _jammerIdx) unlocked[i] = true;
    }
  }

  function cur()      { return WEAPONS[currentIdx]; }
  function curState() { return states[currentIdx]; }

  const _LAUNCHER_TYPES = { AT:1, ATGM:1, AT_HEAVY:1, AT_LIGHT:1, AA:1, GRENADE:1, THERMOBARIC:1, SMOKE:1, FLASHBANG:1, EXPLOSIVE:1, MINE:1, INCENDIARY:1 };
  function _isLauncherType(t) { return !!_LAUNCHER_TYPES[t]; }

  function refreshWeaponHud() {
    if (typeof HUD === 'undefined' || !HUD.setWeapon) return;
    HUD.setWeapon(cur().name, currentIdx);
    if (cur().type === 'MELEE') {
      HUD.setAmmo('∞', '—');
      if (HUD.showGrenadeSection) HUD.showGrenadeSection(true);
      return;
    }
    const st = curState();
    HUD.setAmmo(st.clip, st.reserve);
    if (HUD.showGrenadeSection) HUD.showGrenadeSection(!_isLauncherType(cur().type));
  }

  // ── Terrain dig callbacks ────────────────────────────────
  let _onTerrainDig = null;    // called when shovel mines a block
  let _onTerrainShot = null;   // called when bullet/explosion destroys a block

  function setOnTerrainDig(fn) { _onTerrainDig = fn; }
  function setOnTerrainShot(fn) { _onTerrainShot = fn; }

  // Helper: destroy a block and notify
  // Block-type to resource mapping for destructible environment rewards
  var BLOCK_RESOURCE_MAP = {
    1: { type: 'stone', amount: 1 },   // dirt
    2: { type: 'wood', amount: 1 },    // grass
    3: { type: 'stone', amount: 2 },   // stone
    4: { type: 'wood', amount: 3 },    // wood
    5: { type: 'metal', amount: 2 },   // metal
    9: { type: 'stone', amount: 2 },   // concrete
    10:{ type: 'stone', amount: 2 },   // brick
    11:{ type: 'electronics', amount: 1 }, // glass
    14:{ type: 'metal', amount: 3 },   // reinforced
  };
  function _awardBlockResource(blockType) {
    var drop = BLOCK_RESOURCE_MAP[blockType];
    if (!drop) return;
    if (typeof Economy !== 'undefined' && Economy.add) {
      Economy.add(drop.type, drop.amount);
    }
    // Show tiny floating text for the drop
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast('+' + drop.amount + ' ' + drop.type.toUpperCase(), 600, '#aaa');
    }
  }
  function destroyBlock(x, y, z, isShovel) {
    if (typeof VoxelWorld === 'undefined') return;
    var blockType = VoxelWorld.getBlock(x, y, z);
    if (!blockType || blockType === 0) return; // already air
    VoxelWorld.setBlock(x, y, z, 0);
    _awardBlockResource(blockType);
    if (isShovel && _onTerrainDig) {
      _onTerrainDig(x, y, z, blockType);
    } else if (!isShovel && _onTerrainShot) {
      _onTerrainShot(x, y, z, blockType);
    }
  }

  // ── Scope zoom state ──────────────────────────────────────
  // All eligible weapons now have hasScope: true for proper scope overlay/zoom
  let _camera      = null;
  let _scene       = null;
  let zoomed       = false;
  let rightMouseDown = false;
  const FOV_DEFAULT = 75;
  const FOV_ZOOMED  = 25;

  // ── Gun meshes ────────────────────────────────────────────
  const gunMeshes = [];

  /* ════════════════════════════════════════════════════════════════
   * WD — Weapon Detail Kit.
   * Reusable mini-mesh helpers for super-detailed firearm meshes:
   * Picatinny rails, iron sights, safety selectors with engravings,
   * checkered grips, bolt-carrier faces, muzzle crowns, screws,
   * rivets, mag-window slots, heat-shield vents, charging-handle
   * knurling, lever/button details. All take a parent group + anchor.
   * Based on real firearm reference (AK-74M, M4A1, Makarov PM,
   * Glock 17, SVD Dragunov, MP5A3, RPG-7).
   * ════════════════════════════════════════════════════════════════ */
  const WD = (function () {
    const M = (c, opts) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, opts || {}));
    const P = (c, sh) => new THREE.MeshPhongMaterial({ color: c, shininess: sh || 60, specular: 0x666666 });
    // Cached materials — avoid re-creating per rivet
    const matSteel    = P(0x9aa0a6, 80);
    const matBlued    = P(0x1a1c20, 40);
    const matMatte    = M(0x2a2a2e);
    const matDark     = M(0x14141a);
    const matBrass    = P(0xb88a3a, 50);
    const matWhite    = M(0xe6e6ea);
    const matRed      = M(0xc02020);
    const matRubber   = M(0x101012);

    // ── Picatinny rail: row of teeth + slots, MIL-STD-1913 spaced ──
    function picatinnyRail(g, ax, ay, az, length, opts) {
      opts = opts || {};
      const width = opts.width || 0.022;
      const height = opts.height || 0.008;
      const teeth = Math.max(3, Math.floor(length / 0.015));
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(width, height * 0.55, length),
        matMatte
      );
      base.position.set(ax, ay, az);
      g.add(base);
      for (let i = 0; i < teeth; i++) {
        const t = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, 0.008),
          matBlued
        );
        t.position.set(ax, ay + height * 0.30, az - length * 0.5 + 0.006 + i * (length / teeth));
        g.add(t);
      }
    }

    // ── Iron sights: front post with protective ears + rear aperture/notch ──
    function ironSights(g, frontPos, rearPos, opts) {
      opts = opts || {};
      // Front post + ears
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.018, 0.004), matSteel);
      post.position.copy(frontPos);
      g.add(post);
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.020, 0.005), matMatte);
      earL.position.set(frontPos.x - 0.008, frontPos.y, frontPos.z); g.add(earL);
      const earR = earL.clone(); earR.position.x = frontPos.x + 0.008; g.add(earR);
      // Front sight base
      const fbase = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.006, 0.014), matMatte);
      fbase.position.set(frontPos.x, frontPos.y - 0.013, frontPos.z); g.add(fbase);
      // Rear sight: aperture or notch
      if (opts.aperture) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0018, 6, 12), matMatte);
        ring.position.copy(rearPos); ring.rotation.y = Math.PI / 2; g.add(ring);
      } else {
        const rear = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 0.006), matMatte);
        rear.position.copy(rearPos); g.add(rear);
        const notch = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.005, 0.008), matDark);
        notch.position.set(rearPos.x, rearPos.y + 0.003, rearPos.z); g.add(notch);
        // White dots either side of notch
        for (let s = -1; s <= 1; s += 2) {
          const dot = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.0015, 0.0015), matWhite);
          dot.position.set(rearPos.x + s * 0.005, rearPos.y + 0.001, rearPos.z); g.add(dot);
        }
      }
    }

    // ── Safety selector lever with engraved markings (S / F / A) ──
    function safetySelector(g, ax, ay, az, opts) {
      opts = opts || {};
      // Lever
      const lever = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.030, 0.012), matBlued);
      lever.position.set(ax, ay, az); g.add(lever);
      // Pivot screw
      const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.005, 8), matSteel);
      pivot.position.set(ax, ay, az); pivot.rotation.z = Math.PI / 2; g.add(pivot);
      // Slot (Phillips cross)
      const sl1 = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.0008, 0.0008), matDark);
      sl1.position.set(ax + 0.002, ay, az); g.add(sl1);
      const sl2 = sl1.clone(); sl2.rotation.x = Math.PI / 2; g.add(sl2);
      // Engraved S/F/A pip markings (simulated as tiny white boxes)
      const marks = opts.marks || ['S', 'F', 'A'];
      for (let i = 0; i < marks.length; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.0008), matWhite);
        m.position.set(ax - 0.004, ay + 0.004 - i * 0.008, az); g.add(m);
      }
    }

    // ── Diagonal checkering for pistol grip (reference: Glock RTF) ──
    function checkering(g, ax, ay, az, w, h, opts) {
      opts = opts || {};
      const rows = opts.rows || 8;
      const cols = opts.cols || 4;
      const matG = M(opts.color || 0x111114);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dot = new THREE.Mesh(new THREE.BoxGeometry(0.0025, 0.0025, 0.0025), matG);
          dot.position.set(
            ax + (c - cols / 2 + 0.5) * (w / cols),
            ay - (r - rows / 2 + 0.5) * (h / rows),
            az
          );
          g.add(dot);
        }
      }
    }

    // ── Finger grooves (pistol front-strap) ──
    function fingerGrooves(g, ax, ay, az, count, w) {
      count = count || 4;
      w = w || 0.024;
      for (let i = 0; i < count; i++) {
        const grv = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, w, 6), M(0x080808));
        grv.position.set(ax, ay - i * 0.011, az);
        grv.rotation.z = Math.PI / 2; g.add(grv);
      }
    }

    // ── Bolt-carrier face with extractor + firing pin (visible thru port) ──
    function boltFace(g, ax, ay, az) {
      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.003, 12), matSteel);
      face.position.set(ax, ay, az); face.rotation.x = Math.PI / 2; g.add(face);
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.0015, 0.002), matDark);
      pin.position.set(ax, ay, az + 0.0015); g.add(pin);
      const ext = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.005, 0.002), matBlued);
      ext.position.set(ax + 0.005, ay + 0.002, az + 0.0015); g.add(ext);
    }

    // ── Muzzle crown: recessed ring with rifling slot hint ──
    function muzzleCrown(g, ax, ay, az, radius) {
      radius = radius || 0.012;
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 0.95, 0.005, 12),
        matBlued
      );
      crown.position.set(ax, ay, az); crown.rotation.x = Math.PI / 2; g.add(crown);
      const bore = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, 0.004, 10),
        matDark
      );
      bore.position.set(ax, ay, az); bore.rotation.x = Math.PI / 2; g.add(bore);
      // Suggest 4 lands of rifling
      for (let i = 0; i < 4; i++) {
        const land = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.4, 0.0008, 0.003), matSteel);
        land.position.set(ax, ay, az + 0.0005);
        land.rotation.z = (i / 4) * Math.PI; g.add(land);
      }
    }

    // ── Phillips screw head ──
    function screw(g, ax, ay, az, size) {
      size = size || 0.005;
      const head = new THREE.Mesh(new THREE.CylinderGeometry(size, size, size * 0.4, 8), matSteel);
      head.position.set(ax, ay, az); head.rotation.x = Math.PI / 2; g.add(head);
      const sl1 = new THREE.Mesh(new THREE.BoxGeometry(size * 1.6, size * 0.3, size * 0.15), matDark);
      sl1.position.set(ax, ay, az + size * 0.21); g.add(sl1);
      const sl2 = sl1.clone(); sl2.rotation.z = Math.PI / 2; g.add(sl2);
    }

    // ── Rivet (small metallic dome) ──
    function rivet(g, ax, ay, az, size) {
      size = size || 0.003;
      const r = new THREE.Mesh(new THREE.SphereGeometry(size, 6, 4), matSteel);
      r.position.set(ax, ay, az); g.add(r);
    }

    // ── Charging handle knurled grip ──
    function chargingHandle(g, ax, ay, az, opts) {
      opts = opts || {};
      const len = opts.len || 0.018;
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, len), matMatte);
      handle.position.set(ax, ay, az); g.add(handle);
      // Knurl ridges
      for (let i = 0; i < 6; i++) {
        const k = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.0015, 0.0015), matDark);
        k.position.set(ax, ay + 0.006, az - len * 0.4 + i * (len * 0.16));
        g.add(k);
      }
    }

    // ── Mag release button (round, paddle, or AK-style catch) ──
    function magReleaseButton(g, ax, ay, az, opts) {
      opts = opts || {};
      const r = opts.radius || 0.005;
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.004, 8), matBlued);
      btn.position.set(ax, ay, az); btn.rotation.z = Math.PI / 2; g.add(btn);
      // Outer ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.3, r * 0.25, 4, 10), matMatte);
      ring.position.set(ax, ay, az); ring.rotation.y = Math.PI / 2; g.add(ring);
    }

    // ── Heat-shield vent slots (handguard) ──
    function heatShieldVents(g, ax, ay, az, count, length) {
      count = count || 6;
      length = length || 0.10;
      for (let i = 0; i < count; i++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.001, 0.006), matDark);
        slot.position.set(ax, ay, az - length * 0.4 + i * (length * 0.85 / count));
        g.add(slot);
      }
    }

    // ── Mag witness/inspection holes (round count holes) ──
    function magWitnessHoles(g, ax, ay, az, count) {
      count = count || 5;
      for (let i = 0; i < count; i++) {
        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.001, 6), matDark);
        hole.position.set(ax, ay - i * 0.012, az);
        hole.rotation.x = Math.PI / 2; g.add(hole);
      }
    }

    // ── Receiver ribs (top-cover stamping detail, AK-style) ──
    function receiverRibs(g, ax, ay, az, length, count) {
      count = count || 4;
      for (let i = 0; i < count; i++) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.001, 0.003), matBlued);
        rib.position.set(ax, ay, az - length * 0.4 + i * (length * 0.8 / count));
        g.add(rib);
      }
    }

    // ── Sling swivel + ring ──
    function slingSwivel(g, ax, ay, az) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.005, 0.006), matMatte);
      base.position.set(ax, ay, az); g.add(base);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0012, 4, 8), matSteel);
      ring.position.set(ax, ay - 0.006, az); ring.rotation.y = Math.PI / 2; g.add(ring);
    }

    // ── Manufacturer/serial micro-stamp (visual hint only) ──
    function serialStamp(g, ax, ay, az, len) {
      len = len || 0.030;
      const plate = new THREE.Mesh(new THREE.BoxGeometry(len, 0.001, 0.006), matMatte);
      plate.position.set(ax, ay, az); g.add(plate);
      // Micro-letters (5 tiny boxes)
      for (let i = 0; i < 5; i++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0008, 0.0008), matDark);
        l.position.set(ax - len * 0.4 + i * (len * 0.2), ay + 0.001, az);
        g.add(l);
      }
    }

    return {
      picatinnyRail, ironSights, safetySelector, checkering, fingerGrooves,
      boltFace, muzzleCrown, screw, rivet, chargingHandle, magReleaseButton,
      heatShieldVents, magWitnessHoles, receiverRibs, slingSwivel, serialStamp,
      // ── Universal auto-detail ──
      // Walks the largest mesh in the weapon group and stamps proportional
      // rivets, screws, an info-plate, and surface texture stippling so every
      // weapon (including placeholders) reads as a real machined firearm.
      autoDetail(g, weaponName) {
        if (!g || !g.children || g.children.length === 0) return;
        // Find the geometric center & bbox of the whole weapon
        const box = new THREE.Box3().setFromObject(g);
        if (box.isEmpty()) return;
        const size = box.getSize(new THREE.Vector3());
        const cen  = box.getCenter(new THREE.Vector3());
        const halfW = size.x / 2, halfH = size.y / 2, halfL = size.z / 2;
        // Skip super-small things (knives, throwables) but still add a few details
        const isSmall = (size.length() < 0.3);
        // Top side
        const top = cen.y + halfH * 0.85;
        const right = cen.x + halfW * 0.95;
        const front = cen.z - halfL * 0.85;
        const back  = cen.z + halfL * 0.85;
        // Stippled texture (random micro-bumps along the body — wear marks)
        const stippleCount = isSmall ? 6 : 18;
        for (let i = 0; i < stippleCount; i++) {
          const px = cen.x + (Math.random() - 0.5) * size.x * 0.7;
          const py = cen.y + (Math.random() - 0.5) * size.y * 0.7;
          const pz = cen.z + (Math.random() - 0.5) * size.z * 0.85;
          const dot = new THREE.Mesh(
            new THREE.BoxGeometry(0.0015, 0.0015, 0.0015),
            new THREE.MeshLambertMaterial({ color: 0x0a0a0c })
          );
          dot.position.set(px, py, pz); g.add(dot);
        }
        // Rivet line along receiver side (right face)
        const rivetCount = isSmall ? 3 : 7;
        for (let i = 0; i < rivetCount; i++) {
          const t = i / (rivetCount - 1 || 1);
          rivet(g, right, cen.y, cen.z + (t - 0.5) * size.z * 0.55, 0.0022);
        }
        // 2 screws on the underside
        if (!isSmall) {
          screw(g, cen.x - halfW * 0.5, cen.y - halfH * 0.85, cen.z + halfL * 0.30, 0.004);
          screw(g, cen.x + halfW * 0.5, cen.y - halfH * 0.85, cen.z + halfL * 0.30, 0.004);
        }
        // Tiny serial-stamp on right side
        if (!isSmall) {
          serialStamp(g, right, cen.y - halfH * 0.40, cen.z, Math.min(0.04, size.z * 0.22));
        }
        // Top vent grooves (heat-relief texture, near the front half)
        if (!isSmall && size.z > 0.4) {
          const ventCount = 5;
          for (let i = 0; i < ventCount; i++) {
            const groove = new THREE.Mesh(
              new THREE.BoxGeometry(size.x * 0.28, 0.001, 0.004),
              new THREE.MeshLambertMaterial({ color: 0x05050a })
            );
            groove.position.set(cen.x, top - 0.001, front + 0.04 + i * 0.020);
            g.add(groove);
          }
        }
      },
    };
  })();

  function buildShovelMesh() {
    // MPL-50 entrenching tool: wooden shaft held diagonally with a real
    // pentagonal spade blade at the forward end (previously a stick + flat box).
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const woodMat   = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
    const darkWood  = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
    const steelMat  = new THREE.MeshPhongMaterial({ color: 0x9a9aa0, shininess: 80,  specular: 0x6a6a77 });
    const edgeMat   = new THREE.MeshPhongMaterial({ color: 0xcfcfd6, shininess: 120, specular: 0xaaaaaa });
    const collarMat = new THREE.MeshLambertMaterial({ color: 0x55555a });

    // Shaft runs along Z (grip near camera → blade forward)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.34, 10), woodMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0.16, -0.13, -0.46);
    g.add(shaft);

    // Rounded grip knob at the near end
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 8), woodMat);
    knob.position.set(0.16, -0.13, -0.29);
    g.add(knob);

    // Darker hand-grip wrap
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.07, 8), darkWood);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0.16, -0.13, -0.355);
    g.add(wrap);

    // Steel collar / ferrule where the shaft meets the blade socket
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.018, 0.045, 10), collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0.16, -0.13, -0.605);
    g.add(collar);

    // ── Spade blade: extruded pentagon (flat top, tapering to a point) ──
    const bw = 0.058, bh = 0.062;
    const shape = new THREE.Shape();
    shape.moveTo(-bw, bh);
    shape.lineTo(bw, bh);
    shape.lineTo(bw, -bh * 0.25);
    shape.lineTo(0, -bh * 1.75);     // pointed digging tip
    shape.lineTo(-bw, -bh * 0.25);
    shape.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.009, bevelEnabled: false });
    bladeGeo.center();
    const blade = new THREE.Mesh(bladeGeo, steelMat);
    // Stand the spade at the front of the shaft, point hanging down, tilted so
    // the scoop face angles up toward the player.
    blade.rotation.x = -0.35;
    blade.position.set(0.16, -0.165, -0.685);
    g.add(blade);

    // Sharpened edge strip along the lower point
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.012, 0.011), edgeMat);
    edge.rotation.x = -0.35;
    edge.position.set(0.16, -0.235, -0.70);
    g.add(edge);

    // Socket rivets on the blade
    for (let i = -1; i <= 1; i += 2) {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.005, 5, 5), collarMat);
      rivet.position.set(0.16 + i * 0.022, -0.135, -0.665);
      g.add(rivet);
    }

    return g;
  }

  function buildAxeMesh() {
    // Combat/fire axe: wooden haft held diagonally with a steel head (bit +
    // poll) at the forward end.
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const woodMat  = new THREE.MeshLambertMaterial({ color: 0x6e4a26 });
    const wrapMat  = new THREE.MeshLambertMaterial({ color: 0x2a1c10 });
    const headMat  = new THREE.MeshPhongMaterial({ color: 0x3a3a40, shininess: 70, specular: 0x6a6a77 });
    const edgeMat  = new THREE.MeshPhongMaterial({ color: 0xd0d0d8, shininess: 130, specular: 0xbbbbbb });

    // Haft runs along Z (grip near camera → head forward)
    const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.016, 0.40, 10), woodMat);
    haft.rotation.x = Math.PI / 2;
    haft.position.set(0.16, -0.13, -0.45);
    g.add(haft);

    // Grip wrap near the camera end
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.10, 8), wrapMat);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0.16, -0.13, -0.30);
    g.add(wrap);

    // Eye / socket where the head mounts the haft
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.05, 0.05), headMat);
    eye.position.set(0.16, -0.13, -0.635);
    g.add(eye);

    // Axe bit (blade) — extruded fan shape flaring out to a curved edge
    const bw = 0.012, top = 0.052, bot = 0.062;
    const shape = new THREE.Shape();
    shape.moveTo(0, top);
    shape.lineTo(0.085, 0.085);        // upper edge tip
    shape.lineTo(0.10, 0);             // mid (cutting edge front)
    shape.lineTo(0.085, -0.085);       // lower edge tip
    shape.lineTo(0, -bot);
    shape.closePath();
    const bitGeo = new THREE.ExtrudeGeometry(shape, { depth: bw, bevelEnabled: false });
    bitGeo.center();
    const bit = new THREE.Mesh(bitGeo, headMat);
    // Stand the bit vertically at the head, cutting edge facing forward (-Z)
    bit.rotation.y = Math.PI / 2;
    bit.position.set(0.205, -0.13, -0.635);
    g.add(bit);

    // Sharpened edge strip along the cutting face
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.155, 0.012), edgeMat);
    edge.position.set(0.252, -0.13, -0.635);
    g.add(edge);

    // Poll (back hammer face) behind the eye
    const poll = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.035), headMat);
    poll.position.set(0.135, -0.13, -0.635);
    g.add(poll);

    return g;
  }

  function buildMakarovMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const met = 0x2a2a2e, frame_c = 0x333336, grip_c = 0x1a1a0a, panel_c = 0x2a1a0a;

    // ── Slide assembly (moves back on fire) ──
    const slide = new THREE.Group();
    slide.name = '_slide';
    // Slide body
    const slideBody = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.028, 0.135), new THREE.MeshLambertMaterial({ color: met }));
    slideBody.position.set(0.18, -0.125, -0.285);
    // Barrel (inside slide)
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.145, 12), new THREE.MeshLambertMaterial({ color: 0x222226 }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.18, -0.132, -0.29);
    // Muzzle crown
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.010, 12), new THREE.MeshLambertMaterial({ color: 0x1a1a1e }));
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0.18, -0.130, -0.365);
    // Rear serrations (grip lines) — keep only 4, avoid floating/overlapping
    for (let i = 0; i < 4; i++) {
      const ser = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.002, 0.003), new THREE.MeshLambertMaterial({ color: 0x222228 }));
      ser.position.set(0.18, -0.125, -0.22 + i * 0.01);
      slide.add(ser);
    }
    // Front sight
    const fsight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, 0.004), new THREE.MeshLambertMaterial({ color: met }));
    fsight.position.set(0.18, -0.107, -0.35);
    // Rear sight notch
    const rsight = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.008, 0.006), new THREE.MeshLambertMaterial({ color: met }));
    rsight.position.set(0.18, -0.107, -0.22);
    const rnotch = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.005, 0.008), new THREE.MeshLambertMaterial({ color: 0x111114 }));
    rnotch.position.set(0.18, -0.105, -0.22);
    // Ejection port
    const eport = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.018), new THREE.MeshLambertMaterial({ color: 0x111114 }));
    eport.position.set(0.198, -0.120, -0.27);
    // Extractor
    const ext = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.005, 0.020), new THREE.MeshLambertMaterial({ color: 0x444448 }));
    ext.position.set(0.198, -0.112, -0.28);
    slide.add(slideBody, barrel, muzzle, fsight, rsight, rnotch, eport, ext);

    // ── Frame (static) ──
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.018, 0.095), new THREE.MeshLambertMaterial({ color: frame_c }));
    frame.position.set(0.18, -0.148, -0.25);
    // Dust cover / rail area
    const dustc = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.006, 0.035), new THREE.MeshLambertMaterial({ color: frame_c }));
    dustc.position.set(0.18, -0.155, -0.30);

    // ── Trigger assembly ──
    const trig = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.016, 0.006), new THREE.MeshLambertMaterial({ color: 0x888888 }));
    trig.position.set(0.18, -0.165, -0.255);
    // Trigger guard
    const gFront = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.004, 0.004), new THREE.MeshLambertMaterial({ color: frame_c }));
    gFront.position.set(0.18, -0.178, -0.28);
    const gBottom = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.004, 0.032), new THREE.MeshLambertMaterial({ color: frame_c }));
    gBottom.position.set(0.18, -0.182, -0.262);
    const gRear = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.004, 0.004), new THREE.MeshLambertMaterial({ color: frame_c }));
    gRear.position.set(0.18, -0.168, -0.244);

    // ── Grip ──
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.065, 0.032), new THREE.MeshLambertMaterial({ color: grip_c }));
    grip.position.set(0.18, -0.195, -0.225);
    grip.rotation.x = 0.12;
    // Grip panels (textured)
    const panL = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.050, 0.028), new THREE.MeshLambertMaterial({ color: panel_c }));
    panL.position.set(0.163, -0.190, -0.225);
    panL.rotation.x = 0.12;
    const panR = panL.clone(); panR.position.x = 0.197;
    // Grip screws — only one per panel, avoid floating
    const scrL = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.004), new THREE.MeshLambertMaterial({ color: 0x999999 }));
    scrL.position.set(0.163, -0.218, -0.225);
    const scrR = scrL.clone(); scrR.position.x = 0.197;
    // Grip texture lines — keep 3 for realism
    for (let i = 0; i < 3; i++) {
      const ln = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.002, 0.028), new THREE.MeshLambertMaterial({ color: 0x151510 }));
      ln.position.set(0.163, -0.170 - i * 0.012, -0.225);
      ln.rotation.x = 0.12;
      g.add(ln);
      const lnR = ln.clone(); lnR.position.x = 0.197; g.add(lnR);
    }

    // ── Magazine base plate ──
    const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.028), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    magBase.position.set(0.18, -0.234, -0.218);
    // Magazine release
    const magRel = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.005), new THREE.MeshLambertMaterial({ color: 0x555555 }));
    magRel.position.set(0.198, -0.155, -0.235);

    // ── Hammer ──
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.006), new THREE.MeshLambertMaterial({ color: 0x444448 }));
    hammer.position.set(0.18, -0.115, -0.205);
    // Safety lever
    const safety = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.012, 0.010), new THREE.MeshLambertMaterial({ color: 0x555558 }));
    safety.position.set(0.198, -0.125, -0.215);
    // Slide stop
    const slideStop = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.008, 0.008), new THREE.MeshLambertMaterial({ color: 0x444448 }));
    slideStop.position.set(0.198, -0.140, -0.260);

    // ── Lanyard loop ──
    const lanyard = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.010, 0.004), new THREE.MeshLambertMaterial({ color: frame_c }));
    lanyard.position.set(0.18, -0.230, -0.200);

    g.add(slide, frame, dustc, trig, gFront, gBottom, gRear,
          grip, panL, panR, scrL, scrR, magBase, magRel,
          hammer, safety, slideStop, lanyard);

    // ── Super-detail pass (WD kit) — Makarov PM ──
    // Real PM has decocker safety (top-rear of slide), 3-dot sights, slide-stop notch,
    // checkered grip panels with star medallion, lanyard loop, takedown screw.
    WD.muzzleCrown(g, 0.18, -0.130, -0.368, 0.009);
    WD.boltFace(g, 0.198, -0.120, -0.27);
    WD.checkering(g, 0.163, -0.195, -0.225, 0.022, 0.040, { rows: 6, cols: 3 });
    WD.checkering(g, 0.197, -0.195, -0.225, 0.022, 0.040, { rows: 6, cols: 3 });
    WD.screw(g, 0.180, -0.218, -0.225, 0.004); // grip-panel screw bottom
    WD.screw(g, 0.180, -0.165, -0.225, 0.004); // grip-panel screw top
    WD.magReleaseButton(g, 0.198, -0.155, -0.235, { radius: 0.004 });
    WD.serialStamp(g, 0.198, -0.142, -0.260, 0.020);
    // Remove duplicate slide-serration mirrors on right side (avoid floating/overlap)
    // Star medallion (CCCP) on grip
    const star = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.0015, 5), new THREE.MeshLambertMaterial({ color: 0xb88a3a }));
    star.position.set(0.163, -0.190, -0.224); star.rotation.y = Math.PI / 2; g.add(star);
    const star2 = star.clone(); star2.position.x = 0.197; g.add(star2);
    return g;
  }

  function buildAkMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const bk = 0x2a2a2e, wd = 0x5a3a1a, dk = 0x222226, frm = 0x333336;
    // All dimensions/positions below are refined to match real AK-74M blueprints (side/top/front)
    // All parts are now physically connected, no floating/overlapping

    // ── Handguard (wood, upper/lower) ──
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.040, 0.160), new THREE.MeshLambertMaterial({ color: wd }));
    handguard.position.set(0.18, -0.145, -0.42);
    const handguardLo = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.014, 0.160), new THREE.MeshLambertMaterial({ color: 0x4a2a12 }));
    handguardLo.position.set(0.18, -0.162, -0.42);
    // ── Gas tube ──
    const gasTube = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.180), new THREE.MeshLambertMaterial({ color: bk }));
    gasTube.position.set(0.18, -0.120, -0.42);
    // Gas block (refined)
    const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.028, 0.020), new THREE.MeshLambertMaterial({ color: bk }));
    gasBlock.position.set(0.18, -0.128, -0.53);
    // ── Barrel ──
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0105, 0.380, 14), new THREE.MeshLambertMaterial({ color: frm }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.18, -0.140, -0.44);
    // ── Muzzle brake (slotted, refined) ──
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.040), new THREE.MeshLambertMaterial({ color: dk }));
    brake.position.set(0.18, -0.140, -0.64);
    // Muzzle brake slots (2, realistic)
    for (let i = 0; i < 2; i++) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.003, 0.008), new THREE.MeshLambertMaterial({ color: 0x111114 }));
      slot.position.set(0.18, -0.140, -0.625 + i * 0.012);
      g.add(slot);
    }
    // ── Receiver (main body, refined) ──
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.052, 0.220), new THREE.MeshLambertMaterial({ color: bk }));
    receiver.position.set(0.18, -0.140, -0.24);
    // Receiver cover
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.010, 0.180), new THREE.MeshLambertMaterial({ color: frm }));
    cover.position.set(0.18, -0.110, -0.24);
    // ── Dust cover / ejection port ──
    const ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.016, 0.022), new THREE.MeshLambertMaterial({ color: 0x111114 }));
    ejPort.position.set(0.208, -0.125, -0.27);
    // ── Bolt carrier (visible through ejection port) ──
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.025), new THREE.MeshLambertMaterial({ color: 0x999999 }));
    bolt.position.set(0.207, -0.128, -0.27); bolt.name = '_bolt';
    // ── Charging handle ──
    const chHandle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.014), new THREE.MeshLambertMaterial({ color: frm }));
    chHandle.position.set(0.21, -0.120, -0.22);
    // ── Curved AK magazine (refined) ──
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.105, 0.045), new THREE.MeshLambertMaterial({ color: 0x2a2218 }));
    mag.position.set(0.18, -0.228, -0.24); mag.rotation.x = 0.18;
    // Magazine ribs (2, realistic)
    for (let i = 0; i < 2; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.003, 0.004), new THREE.MeshLambertMaterial({ color: 0x1a180e }));
      rib.position.set(0.18, -0.19 - i * 0.028, -0.24 + i * 0.004);
      g.add(rib);
    }
    // Mag catch
    const magCatch = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, 0.008), new THREE.MeshLambertMaterial({ color: frm }));
    magCatch.position.set(0.18, -0.175, -0.215);
    // ── Pistol grip (refined) ──
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.080, 0.038), new THREE.MeshLambertMaterial({ color: 0x1a1a0e }));
    grip.position.set(0.18, -0.208, -0.17); grip.rotation.x = 0.10;
    // Grip texture (2, realistic)
    for (let i = 0; i < 2; i++) {
      const gt = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.002, 0.034), new THREE.MeshLambertMaterial({ color: 0x121210 }));
      gt.position.set(0.163, -0.180 - i * 0.016, -0.17);
      g.add(gt);
      const gt2 = gt.clone(); gt2.position.x = 0.197; g.add(gt2);
    }
    // Grip screw (one, realistic)
    const gScrew = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.005, 0.005), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    gScrew.position.set(0.163, -0.205, -0.17);
    // ── Stock (folding polymer AK-74M, refined) ──
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.042, 0.195), new THREE.MeshLambertMaterial({ color: 0x1a1a0e }));
    stock.position.set(0.18, -0.140, -0.04);
    const buttpad = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.045, 0.010), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    buttpad.position.set(0.18, -0.140, 0.06);
    // Stock hinge
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.020, 0.015), new THREE.MeshLambertMaterial({ color: frm }));
    hinge.position.set(0.18, -0.140, -0.13);
    // ── Trigger + guard (refined) ──
    const trig = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.018, 0.006), new THREE.MeshLambertMaterial({ color: 0x888888 }));
    trig.position.set(0.18, -0.175, -0.195);
    const grdFr = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.004, 0.004), new THREE.MeshLambertMaterial({ color: bk }));
    grdFr.position.set(0.18, -0.188, -0.22);
    const grdBt = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.004, 0.032), new THREE.MeshLambertMaterial({ color: bk }));
    grdBt.position.set(0.18, -0.192, -0.200);
    // ── Safety lever (refined) ──
    const safetyLvr = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.032, 0.008), new THREE.MeshLambertMaterial({ color: frm }));
    safetyLvr.position.set(0.21, -0.130, -0.21);
    // ── Sling loop (front/rear, refined) ──
    const slingF = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.004), new THREE.MeshLambertMaterial({ color: bk }));
    slingF.position.set(0.18, -0.175, -0.53);
    const slingR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.004), new THREE.MeshLambertMaterial({ color: bk }));
    slingR.position.set(0.18, -0.160, 0.04);
    // ── Cleaning rod (under barrel, refined) ──
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.35), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    rod.position.set(0.18, -0.170, -0.42);

    g.add(handguard, handguardLo, gasTube, gasBlock, barrel, brake,
          receiver, cover, ejPort, bolt, chHandle,
          mag, magCatch, grip, gScrew,
          stock, buttpad, hinge,
          trig, grdFr, grdBt, safetyLvr,
          slingF, slingR, rod);

    // ── Super-detail pass (WD kit) — all details checked for realism ──
    WD.ironSights(g,
      new THREE.Vector3(0.18, -0.118, -0.55),  // front post (gas block)
      new THREE.Vector3(0.18, -0.110, -0.32),  // rear notch (receiver)
      { aperture: false }
    );
    WD.safetySelector(g, 0.211, -0.140, -0.245, { marks: ['A', 'D'] }); // AK selector AB/OD
    WD.muzzleCrown(g, 0.18, -0.140, -0.66, 0.014);
    WD.boltFace(g, 0.207, -0.128, -0.265);
    WD.chargingHandle(g, 0.214, -0.118, -0.215, { len: 0.020 });
    WD.receiverRibs(g, 0.18, -0.110, -0.235, 0.16, 5);
    WD.heatShieldVents(g, 0.18, -0.118, -0.42, 6, 0.16);
    WD.checkering(g, 0.180, -0.205, -0.150, 0.034, 0.060, { rows: 8, cols: 5, color: 0x0a0a08 });
    WD.fingerGrooves(g, 0.180, -0.180, -0.183, 4, 0.030);
    WD.magWitnessHoles(g, 0.202, -0.215, -0.236, 4);
    WD.screw(g, 0.180, -0.140, -0.13, 0.005);  // stock hinge screw
    WD.screw(g, 0.180, -0.140,  0.05, 0.005);  // butt-pad screw
    WD.slingSwivel(g, 0.180, -0.182, -0.530);
    WD.slingSwivel(g, 0.180, -0.165,  0.040);
    WD.serialStamp(g, 0.207, -0.140, -0.235, 0.040);
    // 6 rivets along receiver (real AK stamping)
    for (let ri = 0; ri < 6; ri++) {
      WD.rivet(g, 0.207, -0.155, -0.32 + ri * 0.025, 0.0025);
    }
    return g;
  }

  function buildRpkMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.52),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    barrel.position.set(0.24, -0.18, -0.48);
    const brake = new THREE.Mesh(
      new THREE.BoxGeometry(0.054, 0.054, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    brake.position.set(0.24, -0.18, -0.76);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.08, 0.28),
      new THREE.MeshLambertMaterial({ color: 0x443a28 })
    );
    body.position.set(0.24, -0.19, -0.24);
    // Drum magazine
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.065, 12),
      new THREE.MeshLambertMaterial({ color: 0x2a2218 })
    );
    drum.rotation.x = Math.PI / 2;
    drum.position.set(0.24, -0.26, -0.24);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, 0.10, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x221a0a })
    );
    grip.position.set(0.24, -0.26, -0.17);
    g.add(barrel, brake, body, drum, grip);
    return g;
  }

  function buildSvdMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const bk = 0x2a2a2e, wd = 0x3a2a18, frm = 0x333336;
    // ── Barrel (long, thin) ──
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0105, 0.55, 14), new THREE.MeshLambertMaterial({ color: bk }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.17, -0.13, -0.54);
    // Barrel fluting (visual grooves)
    // Barrel fluting — keep 3 for realism
    for (let i = 0; i < 3; i++) {
      const flute = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.003, 0.40), new THREE.MeshLambertMaterial({ color: 0x222226 }));
      flute.position.set(0.17, -0.13, -0.48);
      flute.rotation.z = (i / 3) * Math.PI;
      g.add(flute);
    }
    // Flash hider
    const flash = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.035), new THREE.MeshLambertMaterial({ color: 0x1a1a1e }));
    flash.position.set(0.17, -0.13, -0.82);
    for (let i = 0; i < 3; i++) {
      const fSlot = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.004, 0.006), new THREE.MeshLambertMaterial({ color: 0x111114 }));
      fSlot.position.set(0.17, -0.13, -0.81 + i * 0.010);
      g.add(fSlot);
    }
    // Gas tube
    const gasT = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.22), new THREE.MeshLambertMaterial({ color: bk }));
    gasT.position.set(0.17, -0.108, -0.48);
    // Gas block
    const gasB = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.025, 0.018), new THREE.MeshLambertMaterial({ color: bk }));
    gasB.position.set(0.17, -0.115, -0.60);
    // ── Handguard (skeletal wood) ──
    const hgTop = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.012, 0.15), new THREE.MeshLambertMaterial({ color: wd }));
    hgTop.position.set(0.17, -0.102, -0.38);
    const hgBot = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.012, 0.15), new THREE.MeshLambertMaterial({ color: wd }));
    hgBot.position.set(0.17, -0.152, -0.38);
    // ── Receiver ──
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.048, 0.22), new THREE.MeshLambertMaterial({ color: bk }));
    receiver.position.set(0.17, -0.130, -0.22);
    // Receiver cover
    const rCover = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.008, 0.18), new THREE.MeshLambertMaterial({ color: frm }));
    rCover.position.set(0.17, -0.102, -0.22);
    // Ejection port
    const ej = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.014, 0.020), new THREE.MeshLambertMaterial({ color: 0x111114 }));
    ej.position.set(0.193, -0.120, -0.25);
    // ── PSO-1 Scope ──
    const scopeTube = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.030, 0.22), new THREE.MeshLambertMaterial({ color: 0x181818 }));
    scopeTube.position.set(0.17, -0.085, -0.28);
    // Scope eyepiece (wider)
    const eyepiece = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.025), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
    eyepiece.position.set(0.17, -0.085, -0.17);
    // Scope objective lens
    const objLens = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.034, 0.020), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
    objLens.position.set(0.17, -0.085, -0.39);
    // Scope elevation turret
    const turretE = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.018, 0.012), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    turretE.position.set(0.17, -0.068, -0.28);
    // Scope windage turret
    const turretW = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.012), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    turretW.position.set(0.188, -0.085, -0.28);
    // Scope mount rail
    const scopeMount = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.10), new THREE.MeshLambertMaterial({ color: frm }));
    scopeMount.position.set(0.17, -0.098, -0.25);
    // ── Magazine ──
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.090, 0.038), new THREE.MeshLambertMaterial({ color: bk }));
    mag.position.set(0.17, -0.21, -0.24); mag.rotation.x = 0.10;
    // Mag ribs
    // Mag ribs — keep 1 for realism
    for (let i = 0; i < 1; i++) {
      const mr = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.003, 0.004), new THREE.MeshLambertMaterial({ color: 0x1a1a1e }));
      mr.position.set(0.17, -0.18, -0.24);
      g.add(mr);
    }
    // ── Pistol grip (SVD skeleton) ──
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.075, 0.030), new THREE.MeshLambertMaterial({ color: wd }));
    grip.position.set(0.17, -0.200, -0.155); grip.rotation.x = 0.12;
    // ── Thumbhole stock ──
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.048, 0.18), new THREE.MeshLambertMaterial({ color: wd }));
    stock.position.set(0.17, -0.140, -0.04);
    const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.018, 0.08), new THREE.MeshLambertMaterial({ color: wd }));
    cheekRest.position.set(0.17, -0.115, -0.02);
    const buttplate = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.050, 0.008), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    buttplate.position.set(0.17, -0.140, 0.07);
    // ── Trigger + guard ──
    const trig = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.016, 0.006), new THREE.MeshLambertMaterial({ color: 0x888888 }));
    trig.position.set(0.17, -0.165, -0.185);
    const tGuard = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.004, 0.032), new THREE.MeshLambertMaterial({ color: bk }));
    tGuard.position.set(0.17, -0.178, -0.185);

    g.add(barrel, flash, gasT, gasB, hgTop, hgBot,
          receiver, rCover, ej, scopeTube, eyepiece, objLens,
          turretE, turretW, scopeMount,
          mag, grip, stock, cheekRest, buttplate,
          trig, tGuard);
    return g;
  }

  function buildPkmMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.048, 0.65),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    barrel.position.set(0.25, -0.19, -0.54);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.10, 0.32),
      new THREE.MeshLambertMaterial({ color: 0x3a3a28 })
    );
    body.position.set(0.25, -0.20, -0.22);
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, 0.072, 12),
      new THREE.MeshLambertMaterial({ color: 0x2a2a18 })
    );
    drum.rotation.x = Math.PI / 2;
    drum.position.set(0.25, -0.27, -0.22);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, 0.10, 0.056),
      new THREE.MeshLambertMaterial({ color: 0x1a1a0a })
    );
    grip.position.set(0.25, -0.28, -0.16);
    const bipL = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.14, 0.012),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    bipL.position.set(0.22, -0.24, -0.48);
    bipL.rotation.z = 0.25;
    const bipR = bipL.clone();
    bipR.position.set(0.28, -0.24, -0.48);
    bipR.rotation.z = -0.25;
    g.add(barrel, body, drum, grip, bipL, bipR);
    return g;
  }

  function buildNlawMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Launch tube
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.55, 10),
      new THREE.MeshLambertMaterial({ color: 0x3a5a2a })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0.17, -0.12, -0.38);
    // Front sight
    const front = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.06, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x2a3a1a })
    );
    front.position.set(0.17, -0.07, -0.58);
    // Grip
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.09, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    grip.position.set(0.17, -0.20, -0.25);
    g.add(tube, front, grip);
    return g;
  }

  function buildStugnaMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Launch tube
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.45, 10),
      new THREE.MeshLambertMaterial({ color: 0x3a4a2a })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0.17, -0.10, -0.38);
    // Scope housing
    const scopeBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.10),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    scopeBox.position.set(0.17, -0.05, -0.30);
    // Tripod legs
    const legMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const legGeo = new THREE.BoxGeometry(0.012, 0.18, 0.012);
    const l1 = new THREE.Mesh(legGeo, legMat);
    l1.position.set(0.12, -0.22, -0.42); l1.rotation.z = 0.3;
    const l2 = new THREE.Mesh(legGeo, legMat);
    l2.position.set(0.22, -0.22, -0.42); l2.rotation.z = -0.3;
    const l3 = new THREE.Mesh(legGeo, legMat);
    l3.position.set(0.17, -0.22, -0.32); l3.rotation.x = -0.3;
    g.add(tube, scopeBox, l1, l2, l3);
    return g;
  }

  function buildM4Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const bk = 0x2a2a2e, fde = 0x8a7a5a, frm = 0x333336;
    // ── Barrel (M4 carbine profile) ──
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.020, 0.32), new THREE.MeshLambertMaterial({ color: frm }));
    barrel.position.set(0.18, -0.14, -0.44);
    // Barrel nut
    const bNut = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.015), new THREE.MeshLambertMaterial({ color: bk }));
    bNut.position.set(0.18, -0.14, -0.28);
    // Flash hider (A2 birdcage)
    const flashH = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.030), new THREE.MeshLambertMaterial({ color: 0x1a1a1e }));
    flashH.position.set(0.18, -0.14, -0.62);
    for (let i = 0; i < 3; i++) {
      const fSlot = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.004, 0.005), new THREE.MeshLambertMaterial({ color: 0x111114 }));
      fSlot.position.set(0.18, -0.14, -0.610 + i * 0.008);
      g.add(fSlot);
    }
    // ── Handguard (M-LOK free-float) ──
    const hg = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.038, 0.22), new THREE.MeshLambertMaterial({ color: bk }));
    hg.position.set(0.18, -0.14, -0.39);
    // M-LOK slots
    for (let i = 0; i < 5; i++) {
      const mlok = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.010, 0.018), new THREE.MeshLambertMaterial({ color: 0x111114 }));
      mlok.position.set(0.200, -0.14, -0.32 - i * 0.035);
      g.add(mlok);
      const mlok2 = mlok.clone(); mlok2.position.x = 0.160; g.add(mlok2);
    }
    // Gas block (low profile)
    const gasB = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.020, 0.012), new THREE.MeshLambertMaterial({ color: bk }));
    gasB.position.set(0.18, -0.125, -0.50);
    // ── Top rail (full-length Picatinny) ──
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.006, 0.35), new THREE.MeshLambertMaterial({ color: frm }));
    topRail.position.set(0.18, -0.098, -0.34);
    // Rail teeth
    // Rail teeth — keep 8 for realism
    for (let i = 0; i < 8; i++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.003, 0.002), new THREE.MeshLambertMaterial({ color: frm }));
      tooth.position.set(0.18, -0.094, -0.18 - i * 0.03);
      g.add(tooth);
    }
    // ── Upper receiver ──
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.044, 0.14), new THREE.MeshLambertMaterial({ color: bk }));
    upper.position.set(0.18, -0.130, -0.22);
    // ── Lower receiver ──
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.035, 0.12), new THREE.MeshLambertMaterial({ color: bk }));
    lower.position.set(0.18, -0.165, -0.22);
    // Ejection port
    const ePort = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.014, 0.020), new THREE.MeshLambertMaterial({ color: 0x111114 }));
    ePort.position.set(0.203, -0.120, -0.24);
    // Brass deflector
    const defl = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.008, 0.015), new THREE.MeshLambertMaterial({ color: frm }));
    defl.position.set(0.203, -0.110, -0.24);
    // Forward assist
    const fAssist = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.010, 0.012), new THREE.MeshLambertMaterial({ color: bk }));
    fAssist.position.set(0.203, -0.118, -0.21);
    // Charging handle
    const chH = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.006, 0.020), new THREE.MeshLambertMaterial({ color: frm }));
    chH.position.set(0.18, -0.098, -0.16);
    // Bolt carrier (visible through port)
    const boltC = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.010, 0.022), new THREE.MeshLambertMaterial({ color: 0x999999 }));
    boltC.position.set(0.203, -0.125, -0.24); boltC.name = '_bolt';
    // ── STANAG magazine ──
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.100, 0.038), new THREE.MeshLambertMaterial({ color: fde }));
    mag.position.set(0.18, -0.225, -0.24); mag.rotation.x = 0.06;
    // Mag base plate
    const magPlate = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.006, 0.040), new THREE.MeshLambertMaterial({ color: 0x7a6a4a }));
    magPlate.position.set(0.18, -0.278, -0.24);
    // Mag release
    const magRel = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.010, 0.006), new THREE.MeshLambertMaterial({ color: frm }));
    magRel.position.set(0.203, -0.160, -0.240);
    // ── Pistol grip (A2) ──
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.078, 0.036), new THREE.MeshLambertMaterial({ color: 0x1a1a1e }));
    grip.position.set(0.18, -0.210, -0.170); grip.rotation.x = 0.10;
    // Grip texture
    // Grip texture — keep 2 for realism
    for (let i = 0; i < 2; i++) {
      const gt = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.002, 0.030), new THREE.MeshLambertMaterial({ color: 0x111114 }));
      gt.position.set(0.163, -0.185 - i * 0.018, -0.170);
      g.add(gt);
      const gt2 = gt.clone(); gt2.position.x = 0.197; g.add(gt2);
    }
    // Grip screw
    // Grip screw — only one, avoid floating
    const gS = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.005, 0.005), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    gS.position.set(0.163, -0.200, -0.170);
    // ── Collapsible stock ──
    const bufferTube = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.16), new THREE.MeshLambertMaterial({ color: bk }));
    bufferTube.position.set(0.18, -0.138, -0.06);
    const stockBody = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.042, 0.10), new THREE.MeshLambertMaterial({ color: bk }));
    stockBody.position.set(0.18, -0.138, 0.01);
    const buttpad = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.044, 0.008), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    buttpad.position.set(0.18, -0.138, 0.06);
    // Stock latch
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.006), new THREE.MeshLambertMaterial({ color: frm }));
    latch.position.set(0.18, -0.115, -0.02);
    // ── Trigger + guard ──
    const trig = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.018, 0.006), new THREE.MeshLambertMaterial({ color: 0x888888 }));
    trig.position.set(0.18, -0.185, -0.200);
    const tGuard = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.004, 0.036), new THREE.MeshLambertMaterial({ color: bk }));
    tGuard.position.set(0.18, -0.196, -0.205);
    const tGuardFr = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.020, 0.004), new THREE.MeshLambertMaterial({ color: bk }));
    tGuardFr.position.set(0.18, -0.183, -0.224);
    // Safety selector
    const safety = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.015, 0.005), new THREE.MeshLambertMaterial({ color: frm }));
    safety.position.set(0.203, -0.155, -0.195);
    // ── Sling mount ──
    const sMount = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.010, 0.004), new THREE.MeshLambertMaterial({ color: bk }));
    sMount.position.set(0.18, -0.160, -0.50);

    g.add(barrel, bNut, flashH, hg, gasB, topRail,
          upper, lower, ePort, defl, fAssist, chH, boltC,
          mag, magPlate, magRel, grip, gS,
          bufferTube, stockBody, buttpad, latch,
          trig, tGuard, tGuardFr, safety, sMount);

    // ── Super-detail pass (WD kit) — M4A1 carbine ──
    // Real M4A1: SAFE/SEMI/AUTO selector, A2 pistol grip checkering, BUIS sights,
    // M-LOK rail teeth, shell-deflector ridges, dust-cover hinge, takedown pins.
    WD.ironSights(g,
      new THREE.Vector3(0.18, -0.085, -0.45),  // front BUIS post
      new THREE.Vector3(0.18, -0.085, -0.16),  // rear BUIS aperture
      { aperture: true }
    );
    WD.safetySelector(g, 0.203, -0.155, -0.195, { marks: ['S', 'F', 'A'] });
    WD.muzzleCrown(g, 0.18, -0.140, -0.640, 0.012);
    WD.boltFace(g, 0.203, -0.125, -0.235);
    WD.chargingHandle(g, 0.180, -0.092, -0.155, { len: 0.022 });
    WD.checkering(g, 0.180, -0.205, -0.150, 0.030, 0.060, { rows: 7, cols: 4 });
    WD.fingerGrooves(g, 0.180, -0.180, -0.183, 4, 0.026);
    WD.magWitnessHoles(g, 0.197, -0.220, -0.236, 5);
    WD.magReleaseButton(g, 0.207, -0.160, -0.240, { radius: 0.005 });
    // Takedown pins (front + rear)
    WD.screw(g, 0.205, -0.155, -0.165, 0.004);
    WD.screw(g, 0.205, -0.155, -0.275, 0.004);
    WD.slingSwivel(g, 0.180, -0.160, -0.500);
    WD.slingSwivel(g, 0.180, -0.155,  0.030);
    WD.serialStamp(g, 0.205, -0.165, -0.220, 0.040);
    return g;
  }

  function buildJavelinMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // CLU (Command Launch Unit) housing
    const clu = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.10, 0.20),
      new THREE.MeshLambertMaterial({ color: 0x4a5a3a })
    );
    clu.position.set(0.17, -0.12, -0.28);
    // Launch tube
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.55, 10),
      new THREE.MeshLambertMaterial({ color: 0x5a6a4a })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0.17, -0.08, -0.42);
    // Scope/seeker housing
    const scope = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.07, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    scope.position.set(0.17, -0.02, -0.32);
    // Grip
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.10, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    grip.position.set(0.17, -0.22, -0.20);
    // Shoulder rest
    const rest = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.06, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x3a4a2a })
    );
    rest.position.set(0.17, -0.14, -0.10);
    g.add(clu, tube, scope, grip, rest);
    return g;
  }

  function buildRpg7Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Main tube
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.035, 0.70, 8),
      new THREE.MeshLambertMaterial({ color: 0x4a5a3a })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0.17, -0.12, -0.40);
    // Warhead (front cone)
    const warhead = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.15, 8),
      new THREE.MeshLambertMaterial({ color: 0x3a3a2a })
    );
    warhead.rotation.x = -Math.PI / 2;
    warhead.position.set(0.17, -0.12, -0.80);
    // Rear flare (exhaust bell)
    const flare = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.08, 8),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    flare.rotation.x = Math.PI / 2;
    flare.position.set(0.17, -0.12, -0.02);
    // Grip + trigger guard
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.10, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
    );
    grip.position.set(0.17, -0.22, -0.30);
    // Heat shield
    const shield = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.02, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x4a4a3a })
    );
    shield.position.set(0.17, -0.08, -0.40);
    g.add(tube, warhead, flare, grip, shield);
    return g;
  }

  function buildIglaMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Main tube (olive green, longer than NLAW)
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.65, 10),
      new THREE.MeshLambertMaterial({ color: 0x5a6a4a })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0.17, -0.10, -0.44);
    // Seeker unit (front cap)
    const seeker = new THREE.Mesh(
      new THREE.SphereGeometry(0.058, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    seeker.rotation.x = -Math.PI / 2;
    seeker.position.set(0.17, -0.10, -0.78);
    // Grip mechanism (trigger assembly)
    const gripAssembly = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    gripAssembly.position.set(0.17, -0.20, -0.30);
    // Battery unit
    const battery = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    battery.position.set(0.17, -0.26, -0.30);
    g.add(tube, seeker, gripAssembly, battery);
    return g;
  }

  function buildGp25Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Grenade launcher barrel (stubby, wide bore)
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.28, 10),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.17, -0.16, -0.38);
    // Breech block
    const breech = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.10),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    breech.position.set(0.17, -0.16, -0.20);
    // Trigger guard / grip
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.08, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x2a1a0a })
    );
    grip.position.set(0.17, -0.23, -0.22);
    // Sight (leaf sight)
    const sight = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.06, 0.015),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    sight.position.set(0.17, -0.10, -0.35);
    g.add(barrel, breech, grip, sight);
    return g;
  }

  function buildScarHMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Barrel with integrated suppressor look
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.038, 0.36),
      new THREE.MeshLambertMaterial({ color: 0x3a3a28 })
    );
    barrel.position.set(0.18, -0.14, -0.42);
    // Picatinny rail
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.015, 0.28),
      new THREE.MeshLambertMaterial({ color: 0x4a4a3a })
    );
    rail.position.set(0.18, -0.10, -0.35);
    // Receiver body (FDE tan color)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, 0.075, 0.24),
      new THREE.MeshLambertMaterial({ color: 0x8a7a5a })
    );
    body.position.set(0.18, -0.15, -0.22);
    // Magazine
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.11, 0.058),
      new THREE.MeshLambertMaterial({ color: 0x3a3a2a })
    );
    mag.position.set(0.18, -0.24, -0.22);
    mag.rotation.x = 0.06;
    // Folding stock
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.05, 0.14),
      new THREE.MeshLambertMaterial({ color: 0x8a7a5a })
    );
    stock.position.set(0.18, -0.15, -0.06);
    // Grip
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.09, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    grip.position.set(0.18, -0.22, -0.17);
    g.add(barrel, rail, body, mag, stock, grip);
    return g;
  }

  function buildDshkMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Heavy barrel
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.70),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    barrel.position.set(0.17, -0.12, -0.55);
    // Flash hider
    const flash = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    flash.position.set(0.17, -0.12, -0.93);
    // Receiver
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.30),
      new THREE.MeshLambertMaterial({ color: 0x3a3a28 })
    );
    body.position.set(0.17, -0.13, -0.22);
    // Belt-fed ammo box
    const ammoBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.10, 0.10),
      new THREE.MeshLambertMaterial({ color: 0x4a4a2a })
    );
    ammoBox.position.set(0.24, -0.18, -0.22);
    // Spade grips (butterfly triggers)
    const gripL = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.10, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    gripL.position.set(0.12, -0.22, -0.10);
    const gripR = gripL.clone();
    gripR.position.set(0.22, -0.22, -0.10);
    g.add(barrel, flash, body, ammoBox, gripL, gripR);
    return g;
  }

  function buildMolotovMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Bottle body
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.035, 0.18, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a5a1a, transparent: true, opacity: 0.7 })
    );
    bottle.position.set(0.18, -0.16, -0.26);
    // Bottle neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.06, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a5a1a, transparent: true, opacity: 0.7 })
    );
    neck.position.set(0.18, -0.05, -0.26);
    // Rag / wick (sticking out the top)
    const rag = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.06, 0.02),
      new THREE.MeshLambertMaterial({ color: 0x8a6a3a })
    );
    rag.position.set(0.18, -0.01, -0.26);
    // Flame on wick
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.04, 6),
      new THREE.MeshBasicMaterial({ color: 0xff6600 })
    );
    flame.position.set(0.18, 0.03, -0.26);
    // Liquid inside (visible through glass)
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.030, 0.12, 8),
      new THREE.MeshBasicMaterial({ color: 0xcc6600, transparent: true, opacity: 0.5 })
    );
    liquid.position.set(0.18, -0.18, -0.26);
    g.add(bottle, neck, rag, flame, liquid);
    return g;
  }

  function buildMg3Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.65),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    barrel.position.set(0.17, -0.12, -0.52);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.10, 0.30),
      new THREE.MeshLambertMaterial({ color: 0x3a3a28 })
    );
    body.position.set(0.17, -0.13, -0.22);
    const beltBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.10, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x4a4a2a })
    );
    beltBox.position.set(0.24, -0.18, -0.20);
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.05, 0.16),
      new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
    );
    stock.position.set(0.17, -0.13, -0.02);
    const bipod1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.14, 0.012),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    bipod1.position.set(0.13, -0.22, -0.60);
    bipod1.rotation.z = 0.25;
    const bipod2 = bipod1.clone();
    bipod2.position.set(0.21, -0.22, -0.60);
    bipod2.rotation.z = -0.25;
    g.add(barrel, body, beltBox, stock, bipod1, bipod2);
    return g;
  }

  function buildMp5Mesh() {
    // H&K MP5: tubular receiver, slim slotted handguard, short shrouded barrel,
    // curved 30-rd magazine, retractable stock rails + butt, cocking-tube on top.
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const X = 0.18, Y = -0.14;
    const black = new THREE.MeshLambertMaterial({ color: 0x202023 });
    const dark = new THREE.MeshLambertMaterial({ color: 0x16161a });
    const steel = new THREE.MeshPhongMaterial({ color: 0x35353a, shininess: 60 });

    // Receiver tube (round)
    const recv = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.20, 16), black);
    recv.rotation.x = Math.PI / 2; recv.position.set(X, Y, -0.24);
    // Cocking-tube housing on top-left (signature MP5 line)
    const cock = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.24, 12), steel);
    cock.rotation.x = Math.PI / 2; cock.position.set(X - 0.018, Y + 0.026, -0.30);
    // Cocking handle knob
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.016, 10), steel);
    knob.rotation.z = Math.PI / 2; knob.position.set(X - 0.032, Y + 0.026, -0.235);

    // Short barrel + shroud
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.14, 12), steel);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(X, Y + 0.004, -0.40);
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 14), black);
    shroud.rotation.x = Math.PI / 2; shroud.position.set(X, Y + 0.004, -0.37);

    // Slim slotted handguard (tri-lug style)
    const hand = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.12, 14), dark);
    hand.rotation.x = Math.PI / 2; hand.position.set(X, Y - 0.002, -0.31);

    // Curved 30-rd magazine — three short angled segments for the banana curve
    const magMat = dark;
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.05, 0.030), magMat);
    m1.position.set(X, Y - 0.045, -0.205); m1.rotation.x = 0.10;
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.05, 0.028), magMat);
    m2.position.set(X, Y - 0.092, -0.196); m2.rotation.x = 0.26;
    const m3 = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.030, 0.026), magMat);
    m3.position.set(X, Y - 0.128, -0.181); m3.rotation.x = 0.42;

    // Pistol grip + trigger housing
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.030, 0.085), black);
    lower.position.set(X, Y - 0.028, -0.165);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.062, 0.034), dark);
    grip.position.set(X, Y - 0.072, -0.145); grip.rotation.x = -0.22;

    // Retractable stock: two side rails + butt pad
    const railL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.13, 8), steel);
    railL.rotation.x = Math.PI / 2; railL.position.set(X - 0.014, Y + 0.004, -0.09);
    const railR = railL.clone(); railR.position.x = X + 0.014;
    const butt = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.052, 0.018), black);
    butt.position.set(X, Y, -0.028);

    // Drum rear sight + hooded front
    const rearDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.012, 14), black);
    rearDrum.rotation.z = Math.PI / 2; rearDrum.position.set(X, Y + 0.034, -0.17);
    const frontHood = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.016, 12), black);
    frontHood.rotation.x = Math.PI / 2; frontHood.position.set(X, Y + 0.034, -0.345);

    g.add(recv, cock, knob, barrel, shroud, hand, m1, m2, m3,
          lower, grip, railL, railR, butt, rearDrum, frontHood);
    return g;
  }

  function buildBarrettMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.75),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    barrel.position.set(0.17, -0.12, -0.60);
    const brake = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.07, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    brake.position.set(0.17, -0.12, -1.00);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.12, 0.32),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    body.position.set(0.17, -0.13, -0.24);
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0.17, -0.04, -0.30);
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    mag.position.set(0.17, -0.24, -0.22);
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.07, 0.18),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    stock.position.set(0.17, -0.12, -0.02);
    g.add(barrel, brake, body, scope, mag, stock);
    return g;
  }

  function buildMinigunMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // 6 rotating barrels
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.50, 6),
        new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
      );
      b.rotation.x = Math.PI / 2;
      b.position.set(0.17 + Math.cos(a) * 0.04, -0.12 + Math.sin(a) * 0.04, -0.50);
      g.add(b);
    }
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.20, 10),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    housing.rotation.x = Math.PI / 2;
    housing.position.set(0.17, -0.12, -0.22);
    const ammo = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.10, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x4a4a2a })
    );
    ammo.position.set(0.17, -0.26, -0.18);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.10, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    grip.position.set(0.17, -0.22, -0.08);
    g.add(housing, ammo, grip);
    return g;
  }

  function buildCrossbowMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.35),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    stock.position.set(0.17, -0.14, -0.30);
    const limb = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.02, 0.03),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    limb.position.set(0.17, -0.12, -0.48);
    const string = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.005, 0.005),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
    );
    string.position.set(0.17, -0.12, -0.42);
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0.17, -0.08, -0.30);
    g.add(stock, limb, string, scope);
    return g;
  }

  function buildFlamethrowerMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.55, 10),
      new THREE.MeshLambertMaterial({ color: 0x4a5a3a })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0.17, -0.12, -0.40);
    const capFront = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x3a4a2a })
    );
    capFront.rotation.x = -Math.PI / 2;
    capFront.position.set(0.17, -0.12, -0.68);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.10, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    grip.position.set(0.17, -0.22, -0.25);
    const sight = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.04, 0.02),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    sight.position.set(0.17, -0.05, -0.50);
    g.add(tube, capFront, grip, sight);
    return g;
  }

  function buildDoubleBarrelMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const barrel1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(0.15, -0.12, -0.45);
    const barrel2 = barrel1.clone();
    barrel2.position.set(0.19, -0.12, -0.45);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x3a3a28 })
    );
    body.position.set(0.17, -0.13, -0.18);
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.05, 0.20),
      new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
    );
    stock.position.set(0.17, -0.14, -0.02);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.08, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
    );
    grip.position.set(0.17, -0.22, -0.14);
    g.add(barrel1, barrel2, body, stock, grip);
    return g;
  }

  // ── Claymore Mine mesh ──
  function buildClaymoreMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Curved body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x4a5a3a })
    );
    body.position.set(0.17, -0.16, -0.22);
    // Legs
    const leg1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.06, 4),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    leg1.position.set(0.13, -0.20, -0.22);
    leg1.rotation.z = 0.3;
    const leg2 = leg1.clone();
    leg2.position.x = 0.21;
    leg2.rotation.z = -0.3;
    // "FRONT TOWARD ENEMY" label
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.10, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xcccc88 })
    );
    label.position.set(0.17, -0.155, -0.249);
    g.add(body, leg1, leg2, label);
    return g;
  }

  // ── Smoke Grenade mesh ──
  function buildSmokeMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.10, 8),
      new THREE.MeshLambertMaterial({ color: 0x556655 })
    );
    body.position.set(0.17, -0.14, -0.22);
    // Top cap
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.027, 0.027, 0.015, 8),
      new THREE.MeshLambertMaterial({ color: 0x777777 })
    );
    cap.position.set(0.17, -0.088, -0.22);
    // Spoon/lever
    const spoon = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.07, 0.015),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    spoon.position.set(0.185, -0.12, -0.22);
    // Smoke band
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.02, 8),
      new THREE.MeshLambertMaterial({ color: 0x88aa88 })
    );
    band.position.set(0.17, -0.14, -0.22);
    g.add(body, cap, spoon, band);
    return g;
  }

  // ── Flashbang mesh ──
  function buildFlashbangMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.08, 8),
      new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 60 })
    );
    body.position.set(0.17, -0.14, -0.22);
    // Blue band (flash indicator)
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.023, 0.023, 0.015, 8),
      new THREE.MeshLambertMaterial({ color: 0x3366cc })
    );
    band.position.set(0.17, -0.12, -0.22);
    // Fuze/cap
    const fuze = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.024, 0.02, 8),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    fuze.position.set(0.17, -0.098, -0.22);
    // Pin ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.012, 0.003, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0xaaaa66 })
    );
    ring.position.set(0.19, -0.098, -0.22);
    ring.rotation.y = Math.PI / 2;
    g.add(body, band, fuze, ring);
    return g;
  }

  // ── AK-12 mesh ──
  function buildAk12Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.05, 0.38),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    receiver.position.set(0.17, -0.13, -0.30);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.17, -0.115, -0.55);
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.12, 0.035),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    mag.position.set(0.17, -0.20, -0.28);
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.04, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    stock.position.set(0.17, -0.13, -0.08);
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.012, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    rail.position.set(0.17, -0.098, -0.35);
    g.add(receiver, barrel, mag, stock, rail);
    return g;
  }

  // ── P90 mesh ──
  function buildP90Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.08, 0.30),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    body.position.set(0.17, -0.13, -0.28);
    const topMag = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.02, 0.20),
      new THREE.MeshLambertMaterial({ color: 0x444422 })
    );
    topMag.position.set(0.17, -0.085, -0.28);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.17, -0.12, -0.46);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.05, 0.025),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    grip.position.set(0.17, -0.19, -0.22);
    g.add(body, topMag, barrel, grip);
    return g;
  }

  // ── AT4 mesh ──
  function buildAt4Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8),
      new THREE.MeshLambertMaterial({ color: 0x556633 })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0.17, -0.12, -0.32);
    const sight = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.04, 0.015),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    sight.position.set(0.17, -0.075, -0.25);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.05, 0.02),
      new THREE.MeshLambertMaterial({ color: 0x443322 })
    );
    grip.position.set(0.17, -0.17, -0.28);
    g.add(tube, sight, grip);
    return g;
  }

  // ── Glock mesh ──
  function buildGlockMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const bk = 0x1a1a1e, frm = 0x222226, poly = 0x1e1e22;

    // ── Slide (moving part) ──
    const slide = new THREE.Group();
    slide.name = '_slide';
    const slideBody = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.024, 0.135), new THREE.MeshPhongMaterial({ color: bk, shininess: 60 }));
    slideBody.position.set(0.17, -0.122, -0.255);
    // Barrel inside
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.14, 12), new THREE.MeshLambertMaterial({ color: 0x2a2a2e }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.17, -0.128, -0.26);
    // Muzzle
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 12), new THREE.MeshLambertMaterial({ color: 0x111114 }));
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0.17, -0.126, -0.325);
    // Front sight (Glock-style dot)
    const fs = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, 0.004), new THREE.MeshLambertMaterial({ color: bk }));
    fs.position.set(0.17, -0.105, -0.31);
    const fsDot = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.003), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    fsDot.position.set(0.17, -0.102, -0.31);
    // Rear sight
    const rs = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 0.006), new THREE.MeshLambertMaterial({ color: bk }));
    rs.position.set(0.17, -0.105, -0.195);
    // Rear serrations
    for (let i = 0; i < 10; i++) {
      const ser = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.002, 0.002), new THREE.MeshLambertMaterial({ color: 0x151518 }));
      ser.position.set(0.17, -0.122, -0.19 + i * 0.004);
      slide.add(ser);
    }
    // Front serrations
    for (let i = 0; i < 5; i++) {
      const ser = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.002, 0.002), new THREE.MeshLambertMaterial({ color: 0x151518 }));
      ser.position.set(0.17, -0.122, -0.300 + i * 0.004);
      slide.add(ser);
    }
    // Ejection port
    const ePort = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.010, 0.016), new THREE.MeshLambertMaterial({ color: 0x111114 }));
    ePort.position.set(0.186, -0.115, -0.25);
    // Extractor
    const extr = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.004, 0.018), new THREE.MeshLambertMaterial({ color: 0x444448 }));
    extr.position.set(0.186, -0.108, -0.255);
    slide.add(slideBody, barrel, muzzle, fs, fsDot, rs, ePort, extr);

    // ── Frame (polymer) ──
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.020, 0.095), new THREE.MeshLambertMaterial({ color: poly }));
    frame.position.set(0.17, -0.143, -0.235);
    // Accessory rail (Glock-style)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.008, 0.028), new THREE.MeshLambertMaterial({ color: poly }));
    rail.position.set(0.17, -0.155, -0.28);
    for (let i = 0; i < 3; i++) {
      const rSlot = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.003, 0.003), new THREE.MeshLambertMaterial({ color: 0x111114 }));
      rSlot.position.set(0.17, -0.152, -0.272 + i * 0.008);
      g.add(rSlot);
    }
    // Trigger guard (squared Glock style)
    const grd = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.004, 0.032), new THREE.MeshLambertMaterial({ color: poly }));
    grd.position.set(0.17, -0.168, -0.245);
    const grdFr = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.020, 0.004), new THREE.MeshLambertMaterial({ color: poly }));
    grdFr.position.set(0.17, -0.155, -0.262);
    // Trigger
    const trig = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.014, 0.006), new THREE.MeshLambertMaterial({ color: 0x888888 }));
    trig.position.set(0.17, -0.155, -0.243);
    // Trigger safety tab
    const trigSafe = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.004, 0.003), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    trigSafe.position.set(0.17, -0.150, -0.244);

    // ── Grip (stippled polymer) ──
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.058, 0.030), new THREE.MeshLambertMaterial({ color: poly }));
    grip.position.set(0.17, -0.188, -0.215); grip.rotation.x = 0.08;
    // Grip texture (stippling pattern)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        const dot = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.003), new THREE.MeshLambertMaterial({ color: 0x0e0e0e }));
        dot.position.set(0.155, -0.168 - i * 0.010, -0.208 - j * 0.008);
        g.add(dot);
        const dot2 = dot.clone(); dot2.position.x = 0.185; g.add(dot2);
      }
    }
    // Backstrap
    const backstrap = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.050, 0.006), new THREE.MeshLambertMaterial({ color: 0x151518 }));
    backstrap.position.set(0.17, -0.185, -0.198); backstrap.rotation.x = 0.08;

    // ── Magazine ──
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.055, 0.024), new THREE.MeshLambertMaterial({ color: bk }));
    mag.position.set(0.17, -0.225, -0.215);
    // Mag base plate
    const magPlate = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.006, 0.026), new THREE.MeshLambertMaterial({ color: 0x111114 }));
    magPlate.position.set(0.17, -0.255, -0.215);
    // Mag release
    const magRel = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, 0.006), new THREE.MeshLambertMaterial({ color: frm }));
    magRel.position.set(0.184, -0.148, -0.228);

    // ── Slide stop ──
    const slideStop = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.010), new THREE.MeshLambertMaterial({ color: frm }));
    slideStop.position.set(0.184, -0.135, -0.242);
    // ── Take-down lever ──
    const tdLever = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.005, 0.008), new THREE.MeshLambertMaterial({ color: frm }));
    tdLever.position.set(0.184, -0.140, -0.255);

    g.add(slide, frame, rail, grd, grdFr, trig, trigSafe,
          grip, backstrap, mag, magPlate, magRel,
          slideStop, tdLever);
    return g;
  }

  // ── KS-23 mesh ──
  function buildKs23Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.45, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.17, -0.12, -0.38);
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.06, 0.18),
      new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
    );
    stock.position.set(0.17, -0.14, -0.06);
    const pump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.10, 6),
      new THREE.MeshLambertMaterial({ color: 0x443322 })
    );
    pump.rotation.x = Math.PI / 2;
    pump.position.set(0.17, -0.15, -0.35);
    g.add(barrel, stock, pump);
    return g;
  }

  // ── AGS-17 mesh ──
  function buildAgs17Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.25),
      new THREE.MeshLambertMaterial({ color: 0x3a3a2a })
    );
    body.position.set(0.17, -0.13, -0.30);
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a2a1a })
    );
    drum.position.set(0.17, -0.10, -0.25);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.20, 6),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.17, -0.13, -0.50);
    const tripod1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.10, 4),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    tripod1.position.set(0.14, -0.20, -0.35);
    tripod1.rotation.z = 0.3;
    const tripod2 = tripod1.clone();
    tripod2.position.x = 0.20;
    tripod2.rotation.z = -0.3;
    g.add(body, drum, barrel, tripod1, tripod2);
    return g;
  }

  // ── VSS Vintorez mesh ──
  function buildVssMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.04, 0.28),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    receiver.position.set(0.17, -0.13, -0.30);
    const suppressor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    suppressor.rotation.x = Math.PI / 2;
    suppressor.position.set(0.17, -0.13, -0.52);
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.035, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
    );
    stock.position.set(0.17, -0.13, -0.10);
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0.17, -0.09, -0.30);
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.025),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    mag.position.set(0.17, -0.19, -0.26);
    g.add(receiver, suppressor, stock, scope, mag);
    return g;
  }

  // ── Stinger mesh ──
  function buildStingerMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.60, 8),
      new THREE.MeshLambertMaterial({ color: 0x556644 })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0.17, -0.12, -0.35);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.06, 0.03),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    grip.position.set(0.17, -0.19, -0.25);
    const seeker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 0.06, 8),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    seeker.rotation.x = Math.PI / 2;
    seeker.position.set(0.17, -0.08, -0.20);
    g.add(tube, grip, seeker);
    return g;
  }

  // ── Throwing Knife mesh ──
  function buildThrowKnifeMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.003, 0.12),
      new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 80 })
    );
    blade.position.set(0.17, -0.13, -0.28);
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6),
      new THREE.MeshLambertMaterial({ color: 0x2a1a0a })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.17, -0.13, -0.16);
    g.add(blade, handle);
    return g;
  }

  // ── C4 mesh ──
  function buildC4Mesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.04, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x556644 })
    );
    block.position.set(0.17, -0.14, -0.24);
    const det = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.04, 6),
      new THREE.MeshLambertMaterial({ color: 0xcc2222 })
    );
    det.position.set(0.17, -0.115, -0.20);
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.002, 0.06, 4),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    wire.position.set(0.19, -0.115, -0.22);
    wire.rotation.z = Math.PI / 4;
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.005, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    led.position.set(0.15, -0.115, -0.20);
    g.add(block, det, wire, led);
    return g;
  }


  // ── Gatling Machine Gun mesh (6 rotating barrels, heavy housing) ──
  function buildGatlingMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // 6 rotating barrels
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.013, 0.55, 6),
        new THREE.MeshPhongMaterial({ color: 0x2a2a2e, shininess: 100, specular: 0x555566 })
      );
      b.rotation.x = Math.PI / 2;
      b.position.set(0.17 + Math.cos(a) * 0.036, -0.12 + Math.sin(a) * 0.036, -0.52);
      g.add(b);
    }
    // Front clamp ring
    const frontRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.007, 6, 12),
      new THREE.MeshPhongMaterial({ color: 0x333338, shininess: 80, specular: 0x444455 })
    );
    frontRing.position.set(0.17, -0.12, -0.73);
    g.add(frontRing);
    // Rear clamp ring
    const rearRing = frontRing.clone();
    rearRing.position.z = -0.34;
    g.add(rearRing);
    // Motor/receiver housing
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.20, 10),
      new THREE.MeshPhongMaterial({ color: 0x3a3a3e, shininess: 60, specular: 0x333344 })
    );
    housing.rotation.x = Math.PI / 2;
    housing.position.set(0.17, -0.12, -0.20);
    g.add(housing);
    // Ammo drum
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.075, 12),
      new THREE.MeshPhongMaterial({ color: 0x4a4a2e, shininess: 35, specular: 0x222211 })
    );
    drum.position.set(0.17, -0.22, -0.17);
    g.add(drum);
    // Carry handle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.010, 0.11),
      new THREE.MeshPhongMaterial({ color: 0x333338, shininess: 60, specular: 0x333344 })
    );
    handle.position.set(0.17, -0.04, -0.20);
    g.add(handle);
    const handleL = new THREE.Mesh(
      new THREE.BoxGeometry(0.010, 0.035, 0.010),
      new THREE.MeshPhongMaterial({ color: 0x333338, shininess: 60, specular: 0x333344 })
    );
    handleL.position.set(0.14, -0.055, -0.25);
    g.add(handleL);
    const handleR = handleL.clone();
    handleR.position.x = 0.20;
    g.add(handleR);
    // Pistol grip
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.10, 0.04),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1e, shininess: 30, specular: 0x222222 })
    );
    grip.position.set(0.17, -0.22, -0.08);
    g.add(grip);
    // Trigger guard
    const tGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.012, 0.035),
      new THREE.MeshPhongMaterial({ color: 0x2a2a2e, shininess: 60, specular: 0x333344 })
    );
    tGuard.position.set(0.17, -0.17, -0.08);
    g.add(tGuard);
    return g;
  }

  // ── Drone Jammer Rifle mesh ──
  function buildDroneJammerMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    // Main body — bulky EMP rifle
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.065, 0.38),
      new THREE.MeshPhongMaterial({ color: 0x2a3a2a, shininess: 40, specular: 0x334433 })
    );
    body.position.set(0.17, -0.14, -0.28);
    g.add(body);
    // Barrel / emitter
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.015, 0.22, 8),
      new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 80, specular: 0x555555 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.17, -0.14, -0.52);
    g.add(barrel);
    // EMP antenna — 3 prongs
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const ant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.14, 6),
        new THREE.MeshBasicMaterial({ color: 0x888888 })
      );
      ant.position.set(0.17 + Math.cos(a) * 0.025, -0.06, -0.42 + Math.sin(a) * 0.025);
      g.add(ant);
    }
    // Glowing EMP coil
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.004, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    coil.position.set(0.17, -0.14, -0.44);
    g.add(coil);
    // Scope
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8),
      new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 60 })
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0.17, -0.10, -0.30);
    g.add(scope);
    // Grip
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.09, 0.04),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1e })
    );
    grip.position.set(0.17, -0.22, -0.12);
    g.add(grip);
    // Magazine
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.08, 0.045),
      new THREE.MeshPhongMaterial({ color: 0x3a3a3e })
    );
    mag.position.set(0.17, -0.20, -0.22);
    g.add(mag);
    return g;
  }

  // Placeholder mesh builder for missing weapons
  function buildPlaceholderMesh() {
    const g = new THREE.Group();
    g.userData.selfContained = true;
    const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const geo = new THREE.BoxGeometry(0.2, 0.2, 0.6);
    const mesh = new THREE.Mesh(geo, mat);
    g.add(mesh);
    return g;
  }

  // ════════════════════════════════════════════════════════════════════
  //  CLEAN SILHOUETTE BUILDERS (NB)  —  few well-aligned parts, game coords
  //  (muzzle toward -Z, receiver back at z=-0.10, base x=0.17, y=-0.125).
  //  Each marks userData.selfContained so enhanceMesh skips generic furniture.
  // ════════════════════════════════════════════════════════════════════
  function _M(c, m, r) { return new THREE.MeshStandardMaterial({ color: c, metalness: m == null ? 0.5 : m, roughness: r == null ? 0.5 : r }); }
  function _B(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
  function _T(r, len, mat, seg) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 16), mat); o.rotation.x = Math.PI / 2; return o; }
  function _CONE(r, len, mat, seg) { const o = new THREE.Mesh(new THREE.ConeGeometry(r, len, seg || 16), mat); o.rotation.x = -Math.PI / 2; return o; }
  function _P(o, x, y, z) { o.position.set(x, y, z); return o; }
  const _pal = {
    gm: () => _M(0x2b2d31, 0.55, 0.45), blk: () => _M(0x191a1d, 0.45, 0.5),
    steel: () => _M(0x52555b, 0.7, 0.35), wood: () => _M(0x4a3018, 0.1, 0.85),
    plum: () => _M(0x5a2a1f, 0.18, 0.7), poly: () => _M(0x202024, 0.25, 0.62),
    tan: () => _M(0x8a7345, 0.2, 0.7), olive: () => _M(0x30332a, 0.3, 0.62),
    tube: () => _M(0x39402f, 0.4, 0.6),
  };

  // Parametric rifle/SMG/MG/sniper. o = { recvLen, barLen, barR, hg, hgColor,
  // hgLen, mag, magColor, stock, stockColor, muzzle, rail, scope, bipod, belt,
  // recvColor, sights }
  function _rifle(o) {
    o = o || {};
    const g = new THREE.Group(); g.userData.selfContained = true;
    const X = 0.17, Y = -0.125;
    const recvLen = o.recvLen || 0.26, barLen = o.barLen || 0.30, barR = o.barR || 0.012;
    const recv = o.recvColor ? o.recvColor() : _pal.gm();
    const recvBack = -0.10, recvFront = recvBack - recvLen, recvCz = recvBack - recvLen / 2;
    g.add(_P(_B(0.05, 0.072, recvLen, recv), X, Y, recvCz));               // receiver runs along Z
    // barrel + muzzle
    const muzZ = recvFront - barLen;
    g.add(_P(_T(barR, barLen, _pal.steel(), 12), X, Y + 0.008, recvFront - barLen / 2));
    if (o.muzzle === 'brake') g.add(_P(_T(barR * 1.7, 0.05, _pal.gm(), 12), X, Y + 0.008, muzZ + 0.02));
    else if (o.muzzle === 'flash') g.add(_P(_T(barR * 1.55, 0.05, _pal.blk(), 8), X, Y + 0.008, muzZ + 0.02));
    else if (o.muzzle === 'supp') g.add(_P(_T(barR * 2.3, 0.16, _pal.blk(), 16), X, Y + 0.008, recvFront - 0.08));
    // handguard (runs along Z over the barrel breech)
    const hgLen = o.hgLen || 0.14, hgZ = recvFront - hgLen / 2 + 0.01;
    if (o.hg === 'wood') { const wc = o.hgColor || _pal.wood; g.add(_P(_B(0.05, 0.05, hgLen, wc()), X, Y, hgZ)); g.add(_P(_B(0.03, 0.024, hgLen, wc()), X, Y + 0.042, hgZ)); }
    else if (o.hg === 'tube') { g.add(_P(_T(0.026, hgLen, (o.hgColor || _pal.blk)(), 16), X, Y + 0.004, hgZ)); }
    else if (o.hg === 'rail') { g.add(_P(_B(0.044, 0.044, hgLen, (o.hgColor || _pal.blk)()), X, Y, hgZ)); }
    // top rail / iron sights
    if (o.rail) g.add(_P(_B(0.02, 0.016, recvLen * 0.8, _pal.blk()), X, Y + 0.05, recvCz));
    if (o.sights !== false) {
      g.add(_P(_B(0.012, 0.032, 0.012, _pal.gm()), X, Y + 0.05, muzZ + 0.06));
      g.add(_P(_B(0.022, 0.022, 0.018, _pal.gm()), X, Y + 0.05, recvFront - 0.01));
    }
    // magazine (hangs down from the receiver/barrel junction)
    const mz = recvFront + 0.03;
    if (o.mag === 'curved') {
      const mc = o.magColor || _pal.olive;
      const m1 = _P(_B(0.03, 0.07, 0.045, mc()), X, Y - 0.05, mz); m1.rotation.x = -0.12;
      const m2 = _P(_B(0.03, 0.07, 0.04, mc()), X, Y - 0.10, mz - 0.022); m2.rotation.x = -0.34;
      const m3 = _P(_B(0.028, 0.05, 0.036, mc()), X, Y - 0.145, mz - 0.052); m3.rotation.x = -0.52;
      g.add(m1, m2, m3);
    } else if (o.mag === 'straight') { g.add(_P(_B(0.03, 0.125, 0.045, (o.magColor || _pal.olive)()), X, Y - 0.088, mz)); }
    else if (o.mag === 'drum') { g.add(_P(_T(0.06, 0.05, (o.magColor || _pal.blk)(), 18), X, Y - 0.07, mz)); }
    else if (o.mag === 'box') { g.add(_P(_B(0.06, 0.075, 0.085, (o.magColor || _pal.olive)()), X, Y - 0.07, mz)); }
    // pistol grip
    if (o.grip !== false) { const gp = _P(_B(0.032, 0.085, 0.04, _pal.poly()), X, Y - 0.06, recvBack - 0.03); gp.rotation.x = 0.32; g.add(gp); }
    // stock (runs along Z behind the receiver)
    if (o.stock === 'wood') { const sc = o.stockColor || _pal.wood; g.add(_P(_B(0.045, 0.05, 0.10, sc()), X, Y - 0.005, recvBack + 0.06)); g.add(_P(_B(0.05, 0.075, 0.05, sc()), X, Y - 0.01, recvBack + 0.135)); }
    else if (o.stock === 'tube') { g.add(_P(_T(0.017, 0.10, _pal.gm(), 12), X, Y + 0.004, recvBack + 0.05)); g.add(_P(_B(0.048, 0.07, 0.045, _pal.poly()), X, Y, recvBack + 0.11)); }
    else if (o.stock === 'fixed') { g.add(_P(_B(0.048, 0.075, 0.12, (o.stockColor || _pal.blk)()), X, Y, recvBack + 0.07)); }
    else if (o.stock === 'skel') { g.add(_P(_B(0.016, 0.016, 0.11, (o.stockColor || _pal.wood)()), X, Y + 0.028, recvBack + 0.06)); g.add(_P(_B(0.016, 0.016, 0.13, (o.stockColor || _pal.wood)()), X, Y - 0.05, recvBack + 0.07)); g.add(_P(_B(0.04, 0.075, 0.05, (o.stockColor || _pal.wood)()), X, Y - 0.012, recvBack + 0.135)); }
    // scope
    if (o.scope) { g.add(_P(_T(0.018, 0.17, _pal.blk(), 14), X, Y + 0.078, recvCz)); g.add(_P(_B(0.022, 0.05, 0.03, _pal.blk()), X, Y + 0.046, recvCz + 0.04)); g.add(_P(_B(0.022, 0.05, 0.03, _pal.blk()), X, Y + 0.046, recvCz - 0.04)); }
    // bolt / charging handle on the right of the receiver — cycles back on each
    // shot via WeaponDetails.onFire (anim.bolt), like the real reciprocating handle.
    const bolt = new THREE.Group(); bolt.name = '_bolt';
    bolt.add(_P(_B(0.018, 0.012, 0.035, _pal.steel()), X + 0.032, Y + 0.018, recvCz - 0.02));
    bolt.add(_P(_B(0.012, 0.012, 0.012, _pal.blk()), X + 0.044, Y + 0.018, recvCz - 0.02));
    g.add(bolt);
    g.userData._anim = { bolt: bolt, boltHome: bolt.position.z };
    // bipod
    if (o.bipod) { const l1 = _P(_B(0.008, 0.10, 0.008, _pal.blk()), X - 0.03, Y - 0.06, muzZ + 0.08); l1.rotation.z = 0.3; const l2 = l1.clone(); l2.position.x = X + 0.03; l2.rotation.z = -0.3; g.add(l1, l2); }
    // belt feed (MG)
    if (o.belt) g.add(_P(_B(0.045, 0.02, 0.06, _pal.gm()), X - 0.03, Y - 0.03, recvFront + 0.04));
    // butt-pad on stock (rubber pad at the rear)
    if (o.stock) {
      const buttZ = recvBack + (o.stock === 'wood' ? 0.16 : o.stock === 'tube' ? 0.14 : o.stock === 'fixed' ? 0.14 : 0.15);
      g.add(_P(_B(0.052, 0.062, 0.01, _M(0x080808, 0.2, 0.9)), X, Y - 0.005, buttZ));
    }
    // trigger guard (curved ring below receiver)
    if (o.grip !== false) {
      const tgMat = _M(0x1a1c20, 0.5, 0.6);
      const tg = _P(_T(0.014, 0.04, tgMat, 8), X, Y - 0.022, mz + 0.015);
      tg.rotation.x = Math.PI / 2; g.add(tg);
      // trigger blade
      g.add(_P(_B(0.005, 0.015, 0.006, _M(0x888888, 0.7, 0.3)), X, Y - 0.032, mz + 0.01));
    }
    // ejection port (right side of receiver)
    if (o.ejection !== false) {
      const portMat = _M(0x0a0a0c, 0.3, 0.8);
      const port = _P(_B(0.022, 0.001, 0.055, portMat), X + 0.027, Y + 0.018, recvCz - 0.02);
      port.rotation.z = 0.12; g.add(port);
      // dust cover line above port
      g.add(_P(_B(0.020, 0.001, 0.058, _M(0x111114, 0.4, 0.6)), X + 0.028, Y + 0.022, recvCz - 0.02));
    }
    // forward assist / bolt catch detail
    if (o.forwardAssist !== false) {
      g.add(_P(_B(0.008, 0.014, 0.006, _M(0x2a2a2e, 0.6, 0.4)), X + 0.030, Y + 0.028, recvCz - 0.06));
    }
    // handguard vent slots (if not already added)
    if (o.hg && o.hg !== 'tube') {
      const ventMat = _M(0x05050a, 0.2, 0.9);
      const vZ = recvFront - hgLen / 2 + 0.01;
      for (let v = 0; v < 4; v++) {
        g.add(_P(_B(0.035, 0.001, 0.005, ventMat), X, Y + 0.042, vZ - hgLen * 0.35 + v * (hgLen * 0.22)));
      }
    }
    // pistol grip checkering + finger grooves
    if (o.grip !== false) {
      WD.checkering(g, X, Y - 0.06, recvBack - 0.03, 0.032, 0.085, { color: 0x111114 });
      WD.fingerGrooves(g, X, Y - 0.035, recvBack - 0.03, 4, 0.032);
    }
    // magazine baseplate and witness holes
    if (o.mag && o.mag !== 'none') {
      const magBaseZ = mz + (o.mag === 'curved' ? -0.065 : -0.05);
      const magBaseY = Y - (o.mag === 'curved' ? 0.155 : o.mag === 'straight' ? 0.088 : 0.07);
      const basePlate = _P(_B(0.032, 0.008, 0.048, _M(0x080808, 0.3, 0.8)), X, magBaseY, magBaseZ);
      g.add(basePlate);
      if (o.mag === 'straight' || o.mag === 'curved') {
        WD.magWitnessHoles(g, X, magBaseY + 0.04, magBaseZ + 0.025, 4);
      }
    }
    // top rail picatinny segments (if rail specified)
    if (o.rail) {
      WD.picatinnyRail(g, X, Y + 0.058, recvCz, recvLen * 0.8, { width: 0.022, height: 0.008 });
    }
    // enhanced iron sights with protective ears and elevation wheel
    if (o.sights !== false) {
      // Add WD iron sights on top of the basic ones for extra detail
      WD.ironSights(g, new THREE.Vector3(X, Y + 0.052, muzZ + 0.06), new THREE.Vector3(X, Y + 0.052, recvFront - 0.01), { aperture: o.scope ? false : true });
    }
    // sling swivel on stock
    if (o.stock) {
      WD.slingSwivel(g, X, Y - 0.04, recvBack + 0.12);
    }
    // serial stamp on receiver
    WD.serialStamp(g, X + 0.028, Y + 0.005, recvCz - 0.04, 0.030);
    // receiver ribs (top cover detail)
    WD.receiverRibs(g, X, Y + 0.052, recvCz - 0.02, recvLen * 0.6, 5);
    return g;
  }

  function _pistol(o) {
    o = o || {};
    const g = new THREE.Group(); g.userData.selfContained = true;
    const X = 0.17, Y = -0.125;
    const slideMat = o.slide ? o.slide() : _pal.gm();
    const z = -0.30, len = o.len || 0.16;
    // Slide assembly grouped for recoil animation (cycles back on each shot,
    // driven by WeaponDetails.triggerSlideAnim via userData._anim.slide).
    const slide = new THREE.Group(); slide.name = '_slide';
    slide.add(_P(_B(0.034, 0.04, len, slideMat), X, Y + 0.02, z));               // slide body
    // Slide serrations (front and rear)
    const serrMat = _M(0x1a1c20, 0.5, 0.6);
    for (let s = 0; s < 6; s++) {
      const serr = _P(_B(0.001, 0.012, 0.008, serrMat), X + 0.018, Y + 0.02, z + len * 0.35 - s * 0.012);
      slide.add(serr);
      const serr2 = serr.clone(); serr2.position.z = z - len * 0.35 + s * 0.012; slide.add(serr2);
    }
    // Dovetail rear sight with white dot
    const rearSight = _P(_B(0.014, 0.012, 0.014, slideMat), X, Y + 0.045, z + len / 2 - 0.01);
    slide.add(rearSight);
    const rearDot = _P(_B(0.002, 0.002, 0.002, _M(0xffffff, 0.1, 0.2)), X, Y + 0.052, z + len / 2 - 0.01);
    slide.add(rearDot);
    // Front sight post with protective ears
    const frontBase = _P(_B(0.010, 0.008, 0.010, slideMat), X, Y + 0.042, z - len / 2 + 0.01);
    slide.add(frontBase);
    const frontPost = _P(_B(0.003, 0.010, 0.003, _M(0xffffff, 0.1, 0.2)), X, Y + 0.050, z - len / 2 + 0.01);
    slide.add(frontPost);
    g.add(slide);
    g.userData._anim = { slide: slide, slideHome: slide.position.z };
    // Frame detail (under the slide)
    g.add(_P(_B(0.03, 0.02, len - 0.015, _pal.poly()), X, Y - 0.008, z));  // frame
    // Trigger guard (curved)
    const tgMat = _M(0x1a1c20, 0.5, 0.6);
    const tg = _P(_T(0.012, 0.03, tgMat, 8), X, Y - 0.025, z + 0.03);
    tg.rotation.x = Math.PI / 2; g.add(tg);
    // Trigger
    g.add(_P(_B(0.005, 0.012, 0.006, _M(0x888888, 0.7, 0.3)), X, Y - 0.035, z + 0.02));
    // Grip with checkering and finger grooves
    const gp = _P(_B(0.03, 0.085, 0.036, o.grip ? o.grip() : _pal.poly()), X, Y - 0.07, z + 0.045); gp.rotation.x = 0.18; g.add(gp);
    WD.checkering(g, X, Y - 0.07, z + 0.045, 0.03, 0.085, { color: 0x111114 });
    WD.fingerGrooves(g, X, Y - 0.045, z + 0.045, 3, 0.03);
    // Magazine baseplate
    g.add(_P(_B(0.028, 0.008, 0.040, _M(0x080808, 0.3, 0.8)), X, Y - 0.120, z + 0.045));
    // Barrel (fixed)
    g.add(_P(_T(0.008, 0.03, _pal.steel(), 12), X, Y + 0.02, z - len / 2 - 0.01)); // muzzle
    // Muzzle crown detail
    WD.muzzleCrown(g, X, Y + 0.02, z - len / 2 - 0.028, 0.008);
    // Suppressor (if equipped)
    if (o.supp) g.add(_P(_T(0.018, 0.10, _pal.blk(), 14), X, Y + 0.02, z - len / 2 - 0.05)); // suppressor
    // Serial stamp on frame
    WD.serialStamp(g, X + 0.018, Y - 0.015, z + 0.02, 0.020);
    // Safety lever
    WD.safetySelector(g, X + 0.018, Y + 0.005, z + 0.06, { marks: ['S', 'F'] });
    // Accessory rail under barrel
    WD.picatinnyRail(g, X, Y - 0.020, z - 0.04, 0.06, { width: 0.018, height: 0.005 });
    return g;
  }

  // Shoulder-fired launcher / MANPADS / ATGM. o = { len, r, tube, rear, warhead,
  // hs (heat shields), optic, sight, clu (command unit), cluColor, grip2 }
  function _launcher(o) {
    o = o || {};
    const g = new THREE.Group(); g.userData.selfContained = true;
    const X = 0.17, Y = -0.115;
    const len = o.len || 0.55, r = o.r || 0.03, tube = (o.tube || _pal.tube)();
    const cz = -0.24, front = cz - len / 2, back = cz + len / 2;
    // Main tube with subtle heat-shield texture segments
    g.add(_P(_T(r, len, tube, 18), X, Y, cz));
    // Tube bands / heat shields
    if (o.hs) {
      g.add(_P(_T(r * 1.48, 0.08, _pal.wood(), 16), X, Y, cz - 0.08));
      g.add(_P(_T(r * 1.48, 0.08, _pal.wood(), 16), X, Y, cz + 0.06));
      // Vent slots between shields
      WD.heatShieldVents(g, X, Y + r * 1.5, cz - 0.01, 4, 0.10);
    }
    // Rear cone / booster
    if (o.rear === 'cone') { const c = _CONE(r * 1.5, 0.10, tube, 18); c.rotation.x = Math.PI / 2; g.add(_P(c, X, Y, back + 0.04)); }
    // Warhead
    if (o.warhead) { const wm = _M(0x4a4233, 0.4, 0.6); g.add(_P(_T(0.034, 0.10, wm, 16), X, Y, front - 0.05)); g.add(_P(_CONE(0.034, 0.09, wm, 16), X, Y, front - 0.135)); }
    // Optic / sight unit
    if (o.optic) {
      g.add(_P(_B(0.05, 0.05, 0.07, _pal.blk()), X, Y + 0.055, cz + 0.02));
      // Lens detail
      g.add(_P(_T(0.012, 0.005, _M(0x112233, 0.1, 0.1), 8), X, Y + 0.055, cz + 0.055));
    }
    else if (o.sight) {
      g.add(_P(_B(0.016, 0.05, 0.016, _pal.blk()), X, Y + 0.052, front + 0.10));
      // Leaf sight elevation wheel
      g.add(_P(_T(0.008, 0.008, _M(0x222222, 0.5, 0.5), 8), X, Y + 0.078, front + 0.10));
    }
    // CLU (Command Launch Unit) box
    if (o.clu) { g.add(_P(_B(0.085, 0.10, 0.10, (o.cluColor || _pal.tan)()), X, Y + 0.005, back - 0.06)); }
    // Primary pistol grip
    const gp = _P(_B(0.035, 0.085, 0.04, _pal.poly()), X, Y - 0.07, cz + 0.04); gp.rotation.x = 0.12; g.add(gp);
    WD.checkering(g, X, Y - 0.07, cz + 0.04, 0.035, 0.085, { color: 0x111114 });
    // Forward grip (second grip)
    if (o.grip2) { const g2 = _P(_B(0.03, 0.07, 0.035, _pal.poly()), X, Y - 0.055, cz - 0.10); g2.rotation.x = -0.12; g.add(g2); WD.checkering(g, X, Y - 0.055, cz - 0.10, 0.03, 0.07, { color: 0x111114 }); }
    // Shoulder pad at rear
    g.add(_P(_B(0.05, 0.06, 0.015, _M(0x080808, 0.2, 0.9)), X, Y - 0.005, back + 0.01));
    // Sling swivel
    WD.slingSwivel(g, X, Y - 0.04, back - 0.02);
    // Trigger guard
    const tgMat = _M(0x1a1c20, 0.5, 0.6);
    const tg = _P(_T(0.015, 0.04, tgMat, 8), X, Y - 0.02, cz + 0.04);
    tg.rotation.x = Math.PI / 2; g.add(tg);
    return g;
  }

  // Double-barrel break shotgun (IZH-43): two stacked barrels + wood furniture.
  function _doubleShotgun() {
    const g = new THREE.Group(); g.userData.selfContained = true;
    const X = 0.17, Y = -0.125;
    g.add(_P(_B(0.05, 0.06, 0.14, _pal.gm()), X, Y, -0.20));                 // breech/receiver
    g.add(_P(_T(0.013, 0.40, _pal.steel(), 12), X, Y + 0.012, -0.46));        // top barrel
    g.add(_P(_T(0.013, 0.40, _pal.steel(), 12), X, Y - 0.012, -0.46));        // bottom barrel
    g.add(_P(_B(0.04, 0.05, 0.13, _pal.wood()), X, Y - 0.01, -0.36));         // forend
    g.add(_P(_B(0.045, 0.07, 0.16, _pal.wood()), X, Y - 0.02, 0.01));         // wood stock
    const gp = _P(_B(0.03, 0.06, 0.04, _pal.wood()), X, Y - 0.05, -0.08); gp.rotation.x = 0.3; g.add(gp);
    g.add(_P(_B(0.012, 0.018, 0.012, _pal.gm()), X, Y + 0.03, -0.64));        // bead sight
    return g;
  }

  const NB = {
    ak:     () => _rifle({ hg: 'wood', hgColor: _pal.plum, stock: 'wood', stockColor: _pal.plum, mag: 'curved', magColor: _pal.plum, muzzle: 'brake', recvLen: 0.24, barR: 0.013 }),
    ak12:   () => _rifle({ hg: 'rail', stock: 'tube', mag: 'curved', muzzle: 'brake', rail: true, recvColor: _pal.blk }),
    m4:     () => _rifle({ hg: 'tube', stock: 'tube', mag: 'straight', muzzle: 'flash', rail: true, recvColor: _pal.blk, barR: 0.011 }),
    scarh:  () => _rifle({ hg: 'rail', hgColor: _pal.tan, stock: 'fixed', stockColor: _pal.tan, mag: 'curved', muzzle: 'flash', rail: true, recvColor: () => _M(0x6a5836, 0.4, 0.55), barLen: 0.32 }),
    rpk:    () => _rifle({ hg: 'wood', stock: 'wood', mag: 'curved', muzzle: 'brake', barLen: 0.40, bipod: true, recvLen: 0.26 }),
    pkm:    () => _rifle({ hg: 'tube', stock: 'wood', mag: 'box', muzzle: 'flash', barLen: 0.42, bipod: true, belt: true, recvLen: 0.28 }),
    mg3:    () => _rifle({ hg: 'tube', stock: 'fixed', mag: 'box', magColor: _pal.gm, muzzle: 'flash', barLen: 0.42, bipod: true, belt: true, recvColor: _pal.blk }),
    svd:    () => _rifle({ hg: 'wood', stock: 'skel', mag: 'curved', scope: true, muzzle: 'flash', barLen: 0.42, barR: 0.010, recvLen: 0.26 }),
    vss:    () => _rifle({ hg: 'tube', stock: 'skel', mag: 'curved', scope: true, muzzle: 'supp', barLen: 0.12, recvLen: 0.22 }),
    mp5:    () => _rifle({ hg: 'tube', stock: 'tube', mag: 'curved', barLen: 0.14, recvLen: 0.20, sights: true }),
    barrett:() => _rifle({ hg: 'rail', stock: 'fixed', mag: 'straight', scope: true, muzzle: 'brake', barLen: 0.50, barR: 0.015, recvLen: 0.32, bipod: true }),
    makarov:() => _pistol({ slide: _pal.blk, len: 0.13 }),
    glock:  () => _pistol({ len: 0.16 }),
    // launchers
    rpg7:   () => _launcher({ len: 0.60, r: 0.030, rear: 'cone', warhead: true, hs: true, sight: true, grip2: true }),
    at4:    () => _launcher({ len: 0.58, r: 0.034, tube: () => _M(0x55563f, 0.3, 0.6), sight: true }),
    nlaw:   () => _launcher({ len: 0.52, r: 0.036, tube: () => _M(0x5a5b42, 0.3, 0.6), optic: true }),
    igla:   () => _launcher({ len: 0.54, r: 0.034, tube: () => _M(0x3a4030, 0.35, 0.6), grip2: true, sight: true }),
    stinger:() => _launcher({ len: 0.50, r: 0.038, tube: () => _M(0x4a4636, 0.35, 0.6), optic: true, grip2: true }),
    shmel:  () => _launcher({ len: 0.50, r: 0.032, tube: () => _M(0x3f4a36, 0.35, 0.6), sight: true }),
    javelin:() => _launcher({ len: 0.40, r: 0.050, tube: _pal.tan, clu: true, cluColor: _pal.tan, grip2: true }),
    stugna: () => _launcher({ len: 0.46, r: 0.045, tube: _pal.olive, optic: true, clu: true, cluColor: _pal.olive, grip2: true }),
    gp25:   () => _launcher({ len: 0.18, r: 0.022, tube: _pal.gm, sight: true }),
    // shotguns
    izh43:  () => _doubleShotgun(),
    ks23:   () => _rifle({ hg: 'tube', hgColor: _pal.blk, stock: 'fixed', mag: 'none', barLen: 0.40, barR: 0.018, recvLen: 0.22, sights: true }),
    // heavy MG
    dshk:   () => _rifle({ hg: 'tube', stock: 'fixed', mag: 'box', magColor: _pal.gm, muzzle: 'brake', barLen: 0.52, barR: 0.018, recvLen: 0.30, bipod: true, belt: true }),
    // ── custom shapes ──
    p90: function () {
      const g = new THREE.Group(); g.userData.selfContained = true; const X = 0.17, Y = -0.125;
      g.add(_P(_B(0.05, 0.075, 0.22, _pal.poly()), X, Y, -0.22));           // bullpup shell
      g.add(_P(_B(0.045, 0.03, 0.20, _pal.blk()), X, Y + 0.055, -0.24));    // top-mounted flat magazine
      g.add(_P(_T(0.011, 0.10, _pal.steel(), 12), X, Y + 0.005, -0.40));    // short barrel
      g.add(_P(_B(0.03, 0.042, 0.05, _pal.blk()), X, Y + 0.062, -0.13));    // rear reflex optic
      g.add(_P(_B(0.03, 0.07, 0.04, _pal.poly()), X, Y - 0.05, -0.20));     // integrated grip
      g.add(_P(_B(0.025, 0.05, 0.03, _pal.poly()), X, Y - 0.04, -0.32));    // front finger grip
      return g;
    },
    ags17: function () {
      const g = new THREE.Group(); g.userData.selfContained = true; const X = 0.17, Y = -0.125;
      g.add(_P(_B(0.07, 0.09, 0.18, _pal.gm()), X, Y, -0.20));              // receiver block
      g.add(_P(_T(0.022, 0.20, _pal.blk(), 14), X, Y + 0.02, -0.42));       // fat short barrel
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 18), _pal.blk()); drum.rotation.z = Math.PI / 2; g.add(_P(drum, X + 0.04, Y - 0.02, -0.15)); // side drum
      g.add(_P(_B(0.10, 0.02, 0.03, _pal.blk()), X, Y + 0.02, -0.02));      // rear spade bar
      g.add(_P(_B(0.012, 0.06, 0.012, _pal.blk()), X - 0.042, Y - 0.02, -0.02));
      g.add(_P(_B(0.012, 0.06, 0.012, _pal.blk()), X + 0.042, Y - 0.02, -0.02));
      const l1 = _P(_B(0.01, 0.16, 0.01, _pal.blk()), X, Y - 0.11, -0.30); l1.rotation.x = 0.4;
      const l2 = _P(_B(0.01, 0.16, 0.01, _pal.blk()), X - 0.05, Y - 0.11, -0.02); l2.rotation.z = 0.3;
      const l3 = _P(_B(0.01, 0.16, 0.01, _pal.blk()), X + 0.05, Y - 0.11, -0.02); l3.rotation.z = -0.3;
      g.add(l1, l2, l3);
      return g;
    },
    crossbow: function () {
      const g = new THREE.Group(); g.userData.selfContained = true; const X = 0.17, Y = -0.125;
      g.add(_P(_B(0.035, 0.04, 0.40, _pal.blk()), X, Y, -0.26));            // stock rail
      g.add(_P(_B(0.34, 0.02, 0.03, _pal.gm()), X, Y + 0.01, -0.46));       // bow limbs (wide in X)
      g.add(_P(_B(0.30, 0.006, 0.006, _M(0xc8c8c8, 0.2, 0.5)), X, Y + 0.01, -0.40)); // string
      g.add(_P(_B(0.02, 0.03, 0.12, _pal.wood()), X, Y + 0.012, -0.32));    // bolt track
      g.add(_P(_T(0.016, 0.10, _pal.blk(), 12), X, Y + 0.05, -0.20));       // scope
      const gp = _P(_B(0.03, 0.075, 0.04, _pal.poly()), X, Y - 0.05, -0.14); gp.rotation.x = 0.3; g.add(gp);
      g.add(_P(_B(0.045, 0.065, 0.07, _pal.blk()), X, Y, -0.04));           // butt
      return g;
    },
    dronejammer: function () {
      const g = _rifle({ hg: 'rail', stock: 'tube', mag: 'straight', muzzle: 'none', rail: true, recvColor: _pal.blk, barLen: 0.20 });
      const X = 0.17, Y = -0.125;
      g.add(_P(_B(0.05, 0.012, 0.05, _pal.gm()), X, Y + 0.07, -0.42));      // emitter pad
      g.add(_P(_B(0.006, 0.11, 0.006, _pal.steel()), X, Y + 0.13, -0.42));  // central antenna
      const a2 = _P(_B(0.006, 0.09, 0.006, _pal.steel()), X - 0.02, Y + 0.12, -0.40); a2.rotation.z = 0.25; g.add(a2);
      const a3 = _P(_B(0.006, 0.09, 0.006, _pal.steel()), X + 0.02, Y + 0.12, -0.40); a3.rotation.z = -0.25; g.add(a3);
      return g;
    },
    // ── 5 Ukraine-war weapons ──────────────────────────────────
    aks74u: () => _rifle({ hg: 'wood', hgColor: _pal.plum, stock: 'tube', mag: 'curved', magColor: _pal.plum,
      muzzle: 'flash', recvLen: 0.18, barLen: 0.14, barR: 0.012, recvColor: _pal.blk }),
    m72law: () => _launcher({ len: 0.50, r: 0.028, tube: () => _M(0x5a4a2f, 0.3, 0.65), sight: true }),
    panzerfaust3: () => _launcher({ len: 0.55, r: 0.033, tube: () => _M(0x504e3a, 0.3, 0.6), rear: 'cone', sight: true, grip2: true }),
    nsvhmg: () => _rifle({ hg: 'tube', stock: 'fixed', mag: 'box', magColor: _pal.gm, muzzle: 'brake',
      barLen: 0.55, barR: 0.020, recvLen: 0.32, bipod: true, belt: true, recvColor: _pal.blk }),
    // ── 3 additional Ukraine-conflict weapons ─────────────────
    malyuk: function () {
      // Bullpup: action at rear, long barrel out front
      const g = new THREE.Group(); g.userData.selfContained = true; const X = 0.17, Y = -0.125;
      g.add(_P(_B(0.055, 0.088, 0.30, _pal.blk()), X, Y, -0.17));              // combined receiver+stock shell
      g.add(_P(_T(0.013, 0.40, _pal.steel(), 12), X, Y + 0.012, -0.37));       // long barrel
      g.add(_P(_B(0.046, 0.024, 0.20, () => _M(0x1a1a1a)), X, Y - 0.014, -0.29)); // underbarrel rail/forend
      const mag = _P(_B(0.030, 0.092, 0.022, _pal.plum()), X, Y - 0.058, -0.05); mag.rotation.x = -0.14; g.add(mag);
      const gp = _P(_B(0.030, 0.080, 0.038, _pal.poly()), X, Y - 0.063, -0.11); gp.rotation.x = 0.17; g.add(gp);
      g.add(_P(_B(0.035, 0.046, 0.060, _pal.blk()), X, Y + 0.060, -0.04));     // built-in optic housing
      g.add(_P(_T(0.016, 0.038, _pal.steel(), 8), X, Y + 0.012, -0.58));        // muzzle device
      return g;
    },
    carlgustaf: () => _launcher({ len: 0.64, r: 0.046, tube: () => _M(0x4a4a3a, 0.3, 0.6),
      rear: 'cone', sight: true, grip2: true, hs: true }),
    m240b: () => _rifle({ hg: 'tube', hgColor: _pal.blk, stock: 'fixed', mag: 'box', magColor: _pal.gm,
      muzzle: 'flash', barLen: 0.48, barR: 0.015, recvLen: 0.30, bipod: true, belt: true, recvColor: _pal.blk }),
    // ── 3 new weapons (PKP, SPG-9, HK416) ─────────────────────
    pkpecheneg: () => _rifle({ hg: 'tube', hgColor: _pal.blk, stock: 'fixed', mag: 'box', magColor: _pal.gm,
      muzzle: 'flash', barLen: 0.50, barR: 0.016, recvLen: 0.30, bipod: true, belt: true, recvColor: _pal.blk }),
    spg9: function () {
      // Recoilless rifle: wide rear blast tube, pistol grip, small sight
      const g = new THREE.Group(); g.userData.selfContained = true; const X = 0.17, Y = -0.125;
      const tubeMat = () => _M(0x5a5845, 0.35, 0.6);
      g.add(_P(_T(0.040, 0.72, tubeMat, 14), X, Y + 0.008, -0.36)); // main tube
      g.add(_P(_T(0.030, 0.14, () => _M(0x3a3830), 12), X, Y + 0.008, -0.74)); // rear blast diffuser (cone flared end)
      // Rear blast cone flare
      const rear = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.08, 12), _M(0x2a2820));
      rear.rotation.x = Math.PI / 2; rear.position.set(X, Y + 0.008, -0.75); g.add(rear);
      // Pistol grip
      const gp = _P(_B(0.028, 0.085, 0.034, _pal.poly()), X, Y - 0.052, -0.30); gp.rotation.x = 0.20; g.add(gp);
      // Trigger group box
      g.add(_P(_B(0.030, 0.028, 0.040, _pal.blk()), X, Y - 0.015, -0.30));
      // Simple folding sight post
      g.add(_P(_B(0.005, 0.040, 0.005, _pal.steel()), X + 0.04, Y + 0.055, -0.28));
      g.add(_P(_B(0.030, 0.005, 0.005, _pal.steel()), X + 0.04, Y + 0.055, -0.28));
      return g;
    },
    hk416: () => _rifle({ hg: 'rail', hgColor: _pal.blk, stock: 'tube', mag: 'curved',
      muzzle: 'flash', rail: true, recvLen: 0.24, barLen: 0.30, barR: 0.012, recvColor: _pal.blk }),
    fort500: function () {
      const g = new THREE.Group(); g.userData.selfContained = true; const X = 0.17, Y = -0.125;
      g.add(_P(_B(0.05, 0.072, 0.28, _pal.blk()), X, Y, -0.24));
      g.add(_P(_T(0.020, 0.38, _pal.steel(), 14), X, Y + 0.004, -0.42));
      g.add(_P(_T(0.018, 0.26, _pal.blk(), 12), X, Y - 0.016, -0.36));
      g.add(_P(_B(0.048, 0.075, 0.11, _pal.wood()), X, Y - 0.005, -0.04));
      const gp = _P(_B(0.030, 0.082, 0.038, _pal.poly()), X, Y - 0.062, -0.14); gp.rotation.x = 0.30; g.add(gp);
      g.add(_P(_B(0.030, 0.012, 0.038, _pal.blk()), X, Y - 0.030, -0.22));
      g.add(_P(_B(0.010, 0.030, 0.010, _pal.blk()), X, Y - 0.032, -0.19));
      g.add(_P(_B(0.012, 0.014, 0.012, _pal.gm()), X, Y + 0.050, -0.54));
      return g;
    },

    // ── RGD-5 Fragmentation Grenade ───────────────────────────────────
    rgd5: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.13;
      // Egg-shaped body (two spheres blended with cylinder)
      g.add(_P(_T(0.036, 0.054, 0x556B2F, 10), X, Y + 0.010, -0.22));   // lower body
      g.add(_P(_T(0.032, 0.036, 0x4A6020, 10), X, Y + 0.040, -0.22));   // upper body taper
      // Fuse assembly (top)
      g.add(_P(_B(0.014, 0.014, 0.014, 0x666666), X, Y + 0.063, -0.22)); // fuze cap
      g.add(_P(_T(0.005, 0.018, 0x888888, 8), X, Y + 0.075, -0.22));    // safety pin post
      // Spoon lever
      const spoon = _P(_B(0.003, 0.022, 0.008, 0x999999), X + 0.016, Y + 0.060, -0.22);
      spoon.rotation.z = 0.3; g.add(spoon);
      // Pull ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.010, 0.002, 6, 12), new THREE.MeshLambertMaterial({ color: 0x999999 }));
      ring.position.set(X + 0.010, Y + 0.082, -0.22); g.add(ring);
      return g;
    },

    // ── Spike LR ATGM ─────────────────────────────────────────────────
    spike_lr: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.12;
      // Launch tube (rectangular, OD green)
      g.add(_P(_B(0.060, 0.060, 0.55, 0x4B5320), X, Y, -0.35));
      // Optic/seeker head (front, square black)
      g.add(_P(_B(0.050, 0.050, 0.04, 0x1a1a1a), X, Y, -0.62));
      // Seeker window (glass)
      g.add(_P(_B(0.030, 0.030, 0.008, 0x334455), X, Y, -0.645));
      // Rear exhaust cone
      g.add(_P(_B(0.068, 0.068, 0.03, 0x2a2a2a), X, Y, -0.07));
      // Folded gripstock/tripod legs
      g.add(_P(_B(0.010, 0.070, 0.010, 0x333322), X - 0.040, Y - 0.02, -0.32));
      g.add(_P(_B(0.010, 0.070, 0.010, 0x333322), X + 0.040, Y - 0.02, -0.32));
      // Carry handle
      g.add(_P(_B(0.008, 0.010, 0.120, 0x222211), X, Y + 0.042, -0.32));
      // IDF Star of David sticker (small light block)
      g.add(_P(_B(0.006, 0.006, 0.004, 0xddcc44), X + 0.031, Y + 0.010, -0.45));
      return g;
    },

    // ── MILAN ATGM ────────────────────────────────────────────────────
    milan: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.12;
      // Main launch tube (olive drab, slightly wider than NLAW)
      g.add(_P(_T(0.048, 0.52, 0x4F5022, 10), X, Y, -0.34));
      // Thermal sight unit (boxed, on top)
      g.add(_P(_B(0.055, 0.045, 0.14, 0x1a1a1a), X, Y + 0.055, -0.38));
      // Sight eyepiece
      g.add(_P(_B(0.028, 0.028, 0.030, 0x333333), X, Y + 0.055, -0.27));
      // Front trigger grip
      const fg = _P(_B(0.030, 0.085, 0.030, 0x1a1a1a), X, Y - 0.060, -0.22); fg.rotation.x = 0.15; g.add(fg);
      // Rear shoulder rest
      g.add(_P(_B(0.070, 0.048, 0.025, 0x3a3a2a), X, Y, -0.09));
      // Wire guidance spool (side, small cylinder)
      g.add(_P(_T(0.018, 0.040, 0x888866, 8), X + 0.035, Y, -0.28));
      return g;
    },

    // ── HK MP7A2 ──────────────────────────────────────────────────────
    mp7: () => _rifle({ hg: 'rail', hgColor: _pal.blk, stock: 'skel', mag: 'box',
      magColor: _pal.blk, muzzle: 'flash', recvLen: 0.13, recvH: 0.040, barLen: 0.14,
      barR: 0.009, recvColor: _pal.blk }),

    // ── Kord 12.7mm HMG ──────────────────────────────────────────────
    kord: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.11;
      // Heavy receiver body
      g.add(_P(_B(0.055, 0.065, 0.35, _pal.blk()), X, Y, -0.28));
      // Thick heavy barrel with fluted cooling
      g.add(_P(_T(0.020, 0.54, _pal.steel(), 14), X, Y + 0.008, -0.52));
      for (let i = 0; i < 8; i++) {
        g.add(_P(_T(0.023, 0.008, _pal.blk(), 10), X, Y + 0.008, -0.24 - i * 0.04));
      }
      // Muzzle brake (rectangular)
      g.add(_P(_B(0.044, 0.044, 0.05, _pal.blk()), X, Y + 0.008, -0.78));
      // Spade grips (rear handles)
      g.add(_P(_B(0.010, 0.075, 0.012, _pal.blk()), X - 0.030, Y - 0.025, -0.04));
      g.add(_P(_B(0.010, 0.075, 0.012, _pal.blk()), X + 0.030, Y - 0.025, -0.04));
      g.add(_P(_B(0.064, 0.010, 0.012, _pal.blk()), X, Y - 0.000, -0.04));
      // Belt feed box (left side, large)
      g.add(_P(_B(0.025, 0.055, 0.110, 0x3a3a28), X - 0.045, Y - 0.005, -0.22));
      // Rear sight
      g.add(_P(_B(0.008, 0.028, 0.006, _pal.blk()), X, Y + 0.045, -0.10));
      // Top rail / carry handle stub
      g.add(_P(_B(0.022, 0.010, 0.18, _pal.steel()), X, Y + 0.042, -0.32));
      return g;
    },

    // ── M2HB Browning .50cal ──────────────────────────────────────────
    browning_m2: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.11;
      // Receiver (large, rectangular)
      g.add(_P(_B(0.065, 0.075, 0.40, _pal.blk()), X, Y, -0.30));
      // Very heavy barrel
      g.add(_P(_T(0.022, 0.62, _pal.steel(), 14), X, Y + 0.010, -0.58));
      // Barrel fluting rings
      for (let i = 0; i < 6; i++) {
        g.add(_P(_T(0.026, 0.010, _pal.blk(), 10), X, Y + 0.010, -0.26 - i * 0.06));
      }
      // Muzzle booster / compensator
      g.add(_P(_T(0.030, 0.06, _pal.blk(), 10), X, Y + 0.010, -0.88));
      g.add(_P(_B(0.050, 0.050, 0.018, _pal.blk()), X, Y + 0.010, -0.900));
      // Spade grips
      g.add(_P(_B(0.010, 0.080, 0.014, _pal.blk()), X - 0.034, Y - 0.024, -0.06));
      g.add(_P(_B(0.010, 0.080, 0.014, _pal.blk()), X + 0.034, Y - 0.024, -0.06));
      g.add(_P(_B(0.072, 0.012, 0.014, _pal.blk()), X, Y + 0.002, -0.06));
      // Ammo belt box (right side)
      g.add(_P(_B(0.022, 0.062, 0.130, 0x4a4a38), X + 0.050, Y, -0.22));
      // Backplate
      g.add(_P(_B(0.070, 0.080, 0.025, _pal.blk()), X, Y, -0.08));
      // Rear leaf sight
      g.add(_P(_B(0.008, 0.032, 0.006, _pal.blk()), X, Y + 0.050, -0.12));
      // Front sight post
      g.add(_P(_B(0.005, 0.022, 0.005, _pal.blk()), X, Y + 0.050, -0.86));
      return g;
    },

    // ── ZU-23-2 (twin 23mm AA autocannon) ────────────────────────────
    zu23_2: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Receiver/breech housing (wide, flat)
      g.add(_P(_B(0.090, 0.055, 0.28, _pal.blk()), X, Y, -0.20));
      // Twin barrels — upper and lower, slightly separated
      g.add(_P(_T(0.014, 0.52, _pal.steel(), 12), X, Y + 0.024, -0.50));
      g.add(_P(_T(0.014, 0.52, _pal.steel(), 12), X, Y - 0.012, -0.50));
      // Muzzle brakes on both barrels
      g.add(_P(_B(0.018, 0.018, 0.030, _pal.blk()), X, Y + 0.024, -0.76));
      g.add(_P(_B(0.018, 0.018, 0.030, _pal.blk()), X, Y - 0.012, -0.76));
      // Ammo drum/box (left side of receiver)
      g.add(_P(_B(0.028, 0.055, 0.090, 0x3a3a28), X - 0.058, Y, -0.18));
      // Ammo drum (right side)
      g.add(_P(_B(0.028, 0.055, 0.090, 0x3a3a28), X + 0.058, Y, -0.18));
      // Gunshield (protective plate in front)
      g.add(_P(_B(0.100, 0.072, 0.010, _pal.blk()), X, Y + 0.008, -0.37));
      // Ring sight (AA lead ring)
      g.add(_P(_T(0.020, 0.005, _pal.steel(), 16), X, Y + 0.064, -0.42));
      // Spade grip handles
      g.add(_P(_B(0.008, 0.060, 0.010, _pal.blk()), X - 0.028, Y - 0.020, -0.06));
      g.add(_P(_B(0.008, 0.060, 0.010, _pal.blk()), X + 0.028, Y - 0.020, -0.06));
      return g;
    },

    // ── FPV Kamikaze Drone ────────────────────────────────────────────
    fpv_drone: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.14, Y = -0.06;
      // Central body frame
      g.add(_P(_B(0.040, 0.020, 0.040, _pal.blk()), X, Y, -0.15));
      // 4 motor arms (diagonal, extending outward)
      g.add(_P(_B(0.060, 0.008, 0.010, _pal.blk()), X - 0.032, Y + 0.002, -0.13));
      g.add(_P(_B(0.060, 0.008, 0.010, _pal.blk()), X + 0.032, Y + 0.002, -0.13));
      g.add(_P(_B(0.010, 0.008, 0.060, _pal.blk()), X, Y + 0.002, -0.12));
      g.add(_P(_B(0.010, 0.008, 0.060, _pal.blk()), X, Y + 0.002, -0.18));
      // Motor nodes at arm tips
      g.add(_P(_T(0.010, 0.016, _pal.steel(), 8), X - 0.062, Y + 0.010, -0.13));
      g.add(_P(_T(0.010, 0.016, _pal.steel(), 8), X + 0.062, Y + 0.010, -0.13));
      g.add(_P(_T(0.010, 0.016, _pal.steel(), 8), X, Y + 0.010, -0.245));
      g.add(_P(_T(0.010, 0.016, _pal.steel(), 8), X, Y + 0.010, -0.066));
      // Propeller discs (flat torus approximated by thin flat cylinders)
      g.add(_P(_T(0.022, 0.003, 0xdddddd, 8), X - 0.062, Y + 0.018, -0.13));
      g.add(_P(_T(0.022, 0.003, 0xdddddd, 8), X + 0.062, Y + 0.018, -0.13));
      g.add(_P(_T(0.022, 0.003, 0xdddddd, 8), X, Y + 0.018, -0.245));
      g.add(_P(_T(0.022, 0.003, 0xdddddd, 8), X, Y + 0.018, -0.066));
      // Explosive warhead (cylinder underneath)
      g.add(_P(_T(0.016, 0.042, 0xcc6600, 10), X, Y - 0.026, -0.15));
      // FPV camera (small sphere at front)
      const camMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const cam = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 4), camMat);
      cam.position.set(X, Y + 0.005, -0.175); g.add(cam);
      // Antenna (thin stick)
      g.add(_P(_T(0.003, 0.050, _pal.blk(), 6), X + 0.015, Y + 0.030, -0.14));
      return g;
    },

    // ── 9M133 Kornet ATGM ────────────────────────────────────────────
    kornet: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.08;
      // Launch tube (long rectangular box, Russian green)
      g.add(_P(_B(0.055, 0.055, 0.52, 0x2d3d1f), X, Y, -0.36));
      // Thermal sight CLU (left side of launcher, box)
      g.add(_P(_B(0.028, 0.050, 0.095, _pal.blk()), X - 0.046, Y + 0.010, -0.20));
      // Sight lens (circular)
      g.add(_P(_T(0.014, 0.010, 0x334455, 8), X - 0.060, Y + 0.018, -0.20));
      // Rear fuze cap
      g.add(_P(_T(0.024, 0.020, _pal.blk(), 8), X, Y, -0.62));
      // Warhead nose dome
      g.add(_P(_T(0.026, 0.040, 0x3d4830, 8), X, Y, -0.12));
      // Folded carry handle
      g.add(_P(_B(0.040, 0.008, 0.055, _pal.blk()), X, Y + 0.035, -0.30));
      // Bipod legs
      g.add(_P(_B(0.006, 0.055, 0.006, _pal.blk()), X - 0.020, Y - 0.028, -0.44));
      g.add(_P(_B(0.006, 0.055, 0.006, _pal.blk()), X + 0.020, Y - 0.028, -0.44));
      // Rear pistol grip
      g.add(_P(_B(0.014, 0.038, 0.020, 0x1a1a0a), X, Y - 0.018, -0.60));
      return g;
    },

    // ── RPG-26 Aglen (disposable) ─────────────────────────────────────
    rpg26: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Main tube (shorter than RPG-7, cylindrical)
      g.add(_P(_T(0.028, 0.46, 0x5c5c3a, 12), X, Y, -0.28));
      // Warhead nose (slightly wider cone-like)
      g.add(_P(_T(0.032, 0.065, 0x3a3a28, 10), X, Y, -0.005));
      // Nose cap ogive
      g.add(_P(_T(0.018, 0.040, 0x2a2a18, 8), X, Y, 0.040));
      // Rear exhaust nozzle (narrowed end)
      g.add(_P(_T(0.018, 0.032, _pal.blk(), 8), X, Y, -0.56));
      // Sling attachment (small loop left side)
      g.add(_P(_B(0.004, 0.020, 0.006, _pal.blk()), X - 0.032, Y, -0.30));
      // Trigger mechanism housing
      g.add(_P(_B(0.014, 0.030, 0.028, _pal.blk()), X, Y - 0.030, -0.32));
      // Shoulder pad (rubber buffer, flat plate)
      g.add(_P(_B(0.040, 0.022, 0.010, 0x2a2a2a), X, Y, -0.50));
      // Front sight (flip-up pin)
      g.add(_P(_B(0.004, 0.018, 0.004, _pal.blk()), X, Y + 0.030, -0.09));
      return g;
    },

    // ── M142 HIMARS (fire-control unit) ──────────────────────────────
    himars: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.14, Y = -0.08;
      // Fire control unit body (laptop-sized box, OD green)
      g.add(_P(_B(0.100, 0.068, 0.026, 0x3a4a2a), X, Y, -0.18));
      // Screen face (dark, slight lighter border)
      g.add(_P(_B(0.080, 0.050, 0.004, 0x0a1a2a), X, Y + 0.004, -0.205));
      // Keypad area (lower half of screen face)
      g.add(_P(_B(0.080, 0.014, 0.004, 0x1a2a1a), X, Y - 0.012, -0.205));
      // GPS antenna stub (top right)
      g.add(_P(_T(0.006, 0.040, _pal.blk(), 6), X + 0.042, Y + 0.056, -0.18));
      // Handle/grip bar
      g.add(_P(_B(0.090, 0.010, 0.018, _pal.blk()), X, Y - 0.038, -0.18));
      // Side connector panel
      g.add(_P(_B(0.006, 0.044, 0.020, _pal.blk()), X - 0.054, Y, -0.17));
      // Launch confirm button (red)
      const btnMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 6), btnMat);
      btn.position.set(X + 0.030, Y + 0.022, -0.208); g.add(btn);
      // US Army star decal (small flat star)
      g.add(_P(_B(0.016, 0.016, 0.003, 0xcccccc), X - 0.010, Y + 0.018, -0.208));
      return g;
    },

    // ── F-1 "Limonka" Frag Grenade ────────────────────────────────────
    f1_grenade: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.10, Y = -0.06;
      // Oval/lemon body (two cylinders stacked for bulge)
      g.add(_P(_T(0.022, 0.028, 0x3a4a28, 10), X, Y, -0.12));
      g.add(_P(_T(0.020, 0.018, 0x3a4a28, 10), X, Y, -0.09));
      g.add(_P(_T(0.020, 0.018, 0x3a4a28, 10), X, Y, -0.150));
      // Segmented/grooved body (fragmentation pattern cast in)
      for (let s = 0; s < 4; s++) {
        g.add(_P(_T(0.023, 0.003, 0x2a3820, 10), X, Y, -0.098 - s * 0.010));
      }
      // Fuze assembly on top
      g.add(_P(_T(0.010, 0.024, _pal.blk(), 8), X, Y + 0.018, -0.090));
      g.add(_P(_B(0.014, 0.010, 0.020, _pal.blk()), X, Y + 0.030, -0.090));
      // Safety pin ring (small torus from two segments)
      g.add(_P(_T(0.010, 0.003, _pal.steel(), 8), X + 0.014, Y + 0.035, -0.090));
      // Safety lever (spoon)
      g.add(_P(_B(0.005, 0.022, 0.006, _pal.steel()), X + 0.014, Y + 0.022, -0.090));
      return g;
    },

    // ── Maxim M1910 water-cooled MG ───────────────────────────────────
    maxim1910: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.10;
      // Receiver box (large, squarish)
      g.add(_P(_B(0.075, 0.070, 0.32, 0x3a3228), X, Y, -0.22));
      // Water jacket (cylindrical barrel shroud — the iconic Maxim feature)
      g.add(_P(_T(0.025, 0.38, 0x4a4640, 12), X, Y + 0.008, -0.40));
      // Corrugated cooling rings on water jacket
      for (let i = 0; i < 10; i++) {
        g.add(_P(_T(0.027, 0.005, 0x2a2a26, 10), X, Y + 0.008, -0.24 - i * 0.040));
      }
      // Muzzle flash hider
      g.add(_P(_T(0.022, 0.036, _pal.blk(), 8), X, Y + 0.008, -0.60));
      // Water filler cap on top of jacket
      g.add(_P(_T(0.012, 0.014, 0x5a5650, 8), X, Y + 0.034, -0.38));
      // Trigger/grip area
      g.add(_P(_B(0.016, 0.048, 0.026, 0x2a2216), X - 0.018, Y - 0.020, -0.08));
      g.add(_P(_B(0.016, 0.048, 0.026, 0x2a2216), X + 0.018, Y - 0.020, -0.08));
      // Rear spade grip cross bar
      g.add(_P(_B(0.060, 0.012, 0.014, _pal.blk()), X, Y + 0.002, -0.07));
      // Feed block (right side, for cloth belt)
      g.add(_P(_B(0.020, 0.040, 0.055, 0x3a3228), X + 0.052, Y, -0.15));
      return g;
    },

    // ── BM-21 Grad MLRS (call-for-fire device) ───────────────────────
    bm21_grad: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.14, Y = -0.07;
      // Artillery fire control tablet (ruggedized, olive green)
      g.add(_P(_B(0.095, 0.062, 0.024, 0x2a3420), X, Y, -0.17));
      // Screen (military map display, dark green)
      g.add(_P(_B(0.074, 0.044, 0.004, 0x0d1a0a), X, Y + 0.003, -0.194));
      // Map grid lines (two lighter strips)
      g.add(_P(_B(0.074, 0.002, 0.003, 0x1a3a14), X, Y + 0.008, -0.194));
      g.add(_P(_B(0.074, 0.002, 0.003, 0x1a3a14), X, Y - 0.004, -0.194));
      // Side carry handle
      g.add(_P(_B(0.012, 0.008, 0.028, _pal.blk()), X - 0.052, Y + 0.024, -0.17));
      // Battery pack (rear)
      g.add(_P(_B(0.090, 0.058, 0.020, 0x222822), X, Y, -0.150));
      // Fire mission button (red, with guard)
      const gradBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 6),
        new THREE.MeshLambertMaterial({ color: 0xdd1111 }));
      gradBtn.position.set(X + 0.028, Y + 0.024, -0.196); g.add(gradBtn);
      // Red star decal (Soviet)
      g.add(_P(_B(0.012, 0.012, 0.003, 0xcc1111), X - 0.012, Y + 0.020, -0.195));
      return g;
    },

    // ── BGM-71 TOW ATGM ──────────────────────────────────────────────
    tow_bgm71: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Launch tube (square cross-section, OD green)
      g.add(_P(_B(0.055, 0.055, 0.48, 0x2d3d1f), X, Y, -0.30));
      // AN/TAS-4 thermal sight (boxy, right side of tube)
      g.add(_P(_B(0.038, 0.050, 0.075, _pal.blk()), X - 0.052, Y + 0.012, -0.24));
      g.add(_P(_T(0.012, 0.010, 0x223322, 8), X - 0.075, Y + 0.020, -0.24)); // lens
      // Wire spool (at rear, cylindrical drum)
      g.add(_P(_T(0.030, 0.035, 0x4a4a3a, 10), X, Y - 0.012, -0.54));
      // Bipod legs (front folded down)
      g.add(_P(_B(0.005, 0.065, 0.008, _pal.blk()), X - 0.022, Y - 0.032, -0.18));
      g.add(_P(_B(0.005, 0.065, 0.008, _pal.blk()), X + 0.022, Y - 0.032, -0.18));
      // Traversing handle (rear pistol grip)
      g.add(_P(_B(0.016, 0.042, 0.022, 0x1a1a0a), X, Y - 0.022, -0.56));
      // Missile nose (warhead cap protruding front)
      g.add(_P(_T(0.022, 0.050, 0x3a4830, 8), X, Y, -0.05));
      return g;
    },

    // ── RPG-29 Vampir ────────────────────────────────────────────────
    rpg29: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Two-section main tube (larger diameter than RPG-7, front+rear halves)
      g.add(_P(_T(0.034, 0.30, 0x5c5c3a, 12), X, Y, -0.15));
      g.add(_P(_T(0.030, 0.26, 0x4c4c32, 12), X, Y, -0.45));
      // Tandem warhead (two-stage nose: precursor + main charge)
      g.add(_P(_T(0.038, 0.055, 0x3a3a28, 10), X, Y, -0.01));
      g.add(_P(_T(0.028, 0.030, 0x2a2a18, 8), X, Y, 0.045));
      // Rear nozzle / exhaust
      g.add(_P(_T(0.020, 0.028, _pal.blk(), 8), X, Y, -0.71));
      // Trigger/pistol grip housing (center)
      g.add(_P(_B(0.015, 0.038, 0.032, _pal.blk()), X, Y - 0.030, -0.32));
      // Front grip handle
      g.add(_P(_B(0.012, 0.035, 0.018, 0x1a1a0a), X, Y - 0.026, -0.18));
      // PGO-7V optical sight (right side)
      g.add(_P(_B(0.024, 0.032, 0.070, _pal.blk()), X + 0.044, Y + 0.014, -0.30));
      g.add(_P(_T(0.010, 0.008, 0x223322, 6), X + 0.063, Y + 0.018, -0.30));
      return g;
    },

    // ── Starstreak HVM ───────────────────────────────────────────────
    starstreak: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.085;
      // Shoulder-launch tube (hexagonal, olive drab)
      g.add(_P(_T(0.028, 0.38, 0x2a3c20, 10), X, Y, -0.24));
      // Aiming unit (distinctive three-window target acquisition unit, front-top)
      g.add(_P(_B(0.048, 0.038, 0.065, _pal.blk()), X, Y + 0.034, -0.16));
      // Three sensor windows on aiming unit
      for (let sw = 0; sw < 3; sw++) {
        g.add(_P(_B(0.010, 0.014, 0.006, 0x224433), X - 0.012 + sw * 0.012, Y + 0.042, -0.195));
      }
      // Gripstock (rear handle assembly)
      g.add(_P(_B(0.060, 0.016, 0.035, 0x1a1a0a), X, Y - 0.022, -0.41));
      // Missile fin/dart assembly visible at rear
      g.add(_P(_T(0.018, 0.025, 0x3a3a28, 6), X, Y, -0.44));
      // Fire button cover (hinged guard, top right)
      g.add(_P(_B(0.012, 0.010, 0.018, 0x555544), X + 0.020, Y + 0.030, -0.38));
      // Shoulder pad
      g.add(_P(_B(0.044, 0.020, 0.012, 0x2a2a1a), X, Y, -0.46));
      return g;
    },

    // ── AKM / AK-47 (7.62×39mm) ──────────────────────────────────────
    akm: function () {
      // 7.62×39mm: slightly thicker barrel, brown wood furniture, slant brake
      return _rifle({
        hg: 'wood', hgColor: _pal.wood,
        stock: 'wood', stockColor: _pal.wood,
        mag: 'curved', magColor: _pal.olive,
        muzzle: 'brake',
        recvLen: 0.26, barR: 0.014, barLen: 0.32,
        recvColor: () => 0x2a2a1e,
      });
    },

    // ── AN-94 Abakan ─────────────────────────────────────────────────
    an94: function () {
      // Unusual geometry: offset barrel, side-fold stock, prominent muzzle device
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.115;
      // Receiver (slightly longer than AK, offset barrel channel)
      g.add(_P(_B(0.044, 0.065, 0.28, _pal.blk()), X, Y, -0.20));
      // Barrel (offset right/up — Abakan has unusual barrel layout)
      g.add(_P(_T(0.011, 0.32, _pal.steel(), 12), X + 0.006, Y + 0.006, -0.38));
      // Distinctive large muzzle device (asymmetric compensator)
      g.add(_P(_B(0.028, 0.028, 0.048, _pal.blk()), X + 0.006, Y + 0.006, -0.55));
      // Side-folding stock (folded — compact position)
      g.add(_P(_B(0.008, 0.060, 0.080, 0x1a1a14), X + 0.034, Y + 0.002, -0.09));
      // Curved pistol grip (distinctive shape)
      g.add(_P(_B(0.022, 0.055, 0.030, _pal.poly()), X, Y - 0.038, -0.08));
      g.add(_P(_B(0.018, 0.032, 0.022, _pal.poly()), X, Y - 0.058, -0.065));
      // Curved 30-round magazine
      const m1 = _P(_B(0.028, 0.068, 0.040, _pal.olive()), X, Y - 0.060, -0.22); m1.rotation.x = -0.10; g.add(m1);
      const m2 = _P(_B(0.026, 0.060, 0.036, _pal.olive()), X, Y - 0.108, -0.244); m2.rotation.x = -0.28; g.add(m2);
      // Handguard
      g.add(_P(_B(0.040, 0.044, 0.130, _pal.poly()), X, Y, -0.30));
      // Front sight post
      g.add(_P(_B(0.006, 0.026, 0.008, _pal.blk()), X, Y + 0.040, -0.52));
      return g;
    },

    // ── M67 Fragmentation Grenade ─────────────────────────────────────
    m67_grenade: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.10, Y = -0.06;
      // Spherical body (approximate with scaled sphere + cylinder base)
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a3a1e });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), bodyMat);
      body.position.set(X, Y, -0.12); g.add(body);
      // Body band (equator seam)
      g.add(_P(_T(0.027, 0.004, 0x223320, 10), X, Y, -0.12));
      // Fuze assembly on top
      g.add(_P(_T(0.010, 0.022, _pal.blk(), 8), X, Y + 0.025, -0.120));
      g.add(_P(_B(0.014, 0.012, 0.020, _pal.blk()), X, Y + 0.038, -0.120));
      // Safety spoon (flat lever on side)
      g.add(_P(_B(0.006, 0.028, 0.006, _pal.steel()), X + 0.016, Y + 0.022, -0.120));
      // Pull ring
      g.add(_P(_T(0.008, 0.002, _pal.steel(), 8), X + 0.026, Y + 0.038, -0.120));
      return g;
    },

    // ── Switchblade 300 loitering munition ───────────────────────────
    switchblade300: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.13, Y = -0.05;
      // Launch tube (cylindrical, OD green, narrow)
      g.add(_P(_T(0.020, 0.32, 0x3a4a28, 12), X, Y, -0.20));
      // Deployed wing stubs (pop-out delta wings, mid-body)
      g.add(_P(_B(0.075, 0.004, 0.028, 0x2a3a1e), X, Y, -0.16));   // left+right wing span
      g.add(_P(_B(0.055, 0.004, 0.020, 0x2a3a1e), X, Y, -0.20));   // rear stabilizer
      // EO/IR seeker nose dome
      g.add(_P(_T(0.016, 0.025, 0x1a1a1e, 8), X, Y, -0.055));
      // Sensor window
      g.add(_P(_T(0.009, 0.008, 0x223344, 6), X, Y, -0.042));
      // Canard fins (tiny front control surfaces)
      g.add(_P(_B(0.040, 0.003, 0.016, 0x2a3a1e), X, Y, -0.08));
      // Battery/warhead module (mid-body slightly fatter section)
      g.add(_P(_T(0.022, 0.06, 0x2d3d20, 10), X, Y, -0.14));
      // Propeller at rear
      g.add(_P(_B(0.060, 0.004, 0.006, 0x444434), X, Y, -0.34));
      return g;
    },

    // ── Saiga-12 combat shotgun ───────────────────────────────────────
    saiga12: function () {
      return _rifle({
        hg: 'tube', hgColor: _pal.blk,
        stock: 'fixed', stockColor: _pal.blk,
        mag: 'box', magColor: _pal.blk,
        muzzle: 'brake',
        recvLen: 0.22, barR: 0.016, barLen: 0.22,
        recvColor: _pal.blk,
      });
    },

    // ── IWI Tavor X95 bullpup ─────────────────────────────────────────
    tavor_x95: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.10;
      // Bullpup body (magazine behind trigger — compact)
      g.add(_P(_B(0.040, 0.060, 0.34, 0x3a3a3a), X, Y, -0.17));
      // Barrel (short, protruding from very front)
      g.add(_P(_T(0.010, 0.22, _pal.steel(), 10), X, Y + 0.010, -0.38));
      // Muzzle device
      g.add(_P(_T(0.014, 0.028, _pal.blk(), 8), X, Y + 0.010, -0.50));
      // Polymer grip (forward)
      g.add(_P(_B(0.022, 0.042, 0.018, 0x2a2a2a), X, Y - 0.024, -0.28));
      // Box magazine (behind trigger position, bottom of stock)
      g.add(_P(_B(0.022, 0.052, 0.036, 0x1a1a18), X, Y - 0.026, -0.09));
      // Optical top rail
      g.add(_P(_B(0.030, 0.008, 0.200, _pal.blk()), X, Y + 0.036, -0.18));
      // Holographic sight (standard on Israeli units)
      g.add(_P(_B(0.026, 0.024, 0.030, 0x2a2a2a), X, Y + 0.040, -0.26));
      g.add(_P(_B(0.014, 0.014, 0.004, 0x113311, 8), X, Y + 0.044, -0.278)); // lens
      // Thumb hole stock cutout
      g.add(_P(_B(0.018, 0.028, 0.060, 0x3a3a3a), X, Y + 0.006, -0.04));
      // IDF-style folding buttstock stub
      g.add(_P(_B(0.028, 0.028, 0.022, 0x2a2a2a), X, Y, -0.005));
      return g;
    },

    // ── RPG-18 Mukha (64mm disposable AT tube) ───────────────────────
    rpg18: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Main tube (thin cylinder, telescoping — show deployed)
      g.add(_P(_T(0.022, 0.38, 0x6a6a4a, 12), X, Y, -0.22));
      // Forward shoulder section (slightly wider)
      g.add(_P(_T(0.026, 0.12, 0x5a5a3a, 10), X, Y, -0.08));
      // Nose cap (64mm HEAT warhead)
      g.add(_P(_T(0.020, 0.040, 0x3a3a28, 8), X, Y, 0.012));
      // Nose ogive tip
      g.add(_P(_T(0.010, 0.024, 0x2a2a18, 6), X, Y, 0.050));
      // Rear nozzle/exhaust cap
      g.add(_P(_T(0.016, 0.028, _pal.blk(), 8), X, Y, -0.42));
      // Trigger/firing mechanism (small box under center)
      g.add(_P(_B(0.012, 0.022, 0.020, _pal.blk()), X, Y - 0.024, -0.22));
      // Front flip-up sight
      g.add(_P(_B(0.004, 0.016, 0.004, _pal.blk()), X, Y + 0.026, -0.10));
      // Rear iron sight
      g.add(_P(_B(0.012, 0.010, 0.004, _pal.blk()), X, Y + 0.026, -0.32));
      return g;
    },

    // ── 2B14 Podnos 82mm Mortar ──────────────────────────────────────
    podnos82: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.14, Y = -0.10;
      // Baseplate (wide flat square plate)
      g.add(_P(_B(0.090, 0.008, 0.090, 0x3a3a2a), X, Y + 0.002, -0.15));
      // Bipod V-legs
      const legMat = _pal.blk();
      const legL = _P(_B(0.008, 0.055, 0.006, legMat), X - 0.022, Y - 0.018, -0.18);
      legL.rotation.z = 0.22; g.add(legL);
      const legR = _P(_B(0.008, 0.055, 0.006, legMat), X + 0.022, Y - 0.018, -0.18);
      legR.rotation.z = -0.22; g.add(legR);
      // Traversing joint at top of bipod
      g.add(_P(_T(0.010, 0.014, _pal.steel(), 8), X, Y + 0.030, -0.18));
      // Mortar tube at ~45° elevation
      const tube = _P(_T(0.016, 0.35, 0x4a4a3a, 12), X, Y + 0.048, -0.20);
      tube.rotation.x = Math.PI / 4 + 0.1;
      g.add(tube);
      // Muzzle bell (slightly wider)
      const muz = _P(_T(0.020, 0.025, _pal.steel(), 10), X, Y + 0.055, -0.085);
      muz.rotation.x = Math.PI / 4 + 0.1;
      g.add(muz);
      return g;
    },

    // ── OTs-14 Groza (Spetsnaz bullpup with integral suppressor) ─────
    ots14: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.105;
      // Compact bullpup body
      g.add(_P(_B(0.038, 0.058, 0.28, _pal.blk()), X, Y, -0.15));
      // Integral suppressor (large cylindrical can — characteristic of Groza)
      g.add(_P(_T(0.018, 0.22, _pal.blk(), 12), X, Y + 0.008, -0.30));
      // Suppressor end cap (wider than tube)
      g.add(_P(_T(0.022, 0.018, _pal.blk(), 10), X, Y + 0.008, -0.42));
      // Under-barrel GP-25 grenade launcher (short tube below barrel)
      g.add(_P(_T(0.012, 0.16, 0x2a2a18, 10), X, Y - 0.022, -0.24));
      g.add(_P(_T(0.016, 0.020, 0x1a1a10, 8), X, Y - 0.022, -0.33));
      // Pistol grip (rear)
      g.add(_P(_B(0.020, 0.046, 0.026, _pal.poly()), X, Y - 0.032, -0.05));
      // Curved 9×39mm magazine
      g.add(_P(_B(0.022, 0.060, 0.038, _pal.olive()), X, Y - 0.058, -0.16));
      // Front sight (folding post over suppressor)
      g.add(_P(_B(0.006, 0.018, 0.006, _pal.blk()), X, Y + 0.040, -0.38));
      return g;
    },

    // ── PP-19 Bizon (helical magazine SMG) ───────────────────────────
    pp19: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.095;
      // Main receiver (AK-derived, compact)
      g.add(_P(_B(0.042, 0.058, 0.22, _pal.blk()), X, Y, -0.15));
      // Barrel (short, protruding)
      g.add(_P(_T(0.010, 0.22, _pal.steel(), 12), X, Y + 0.006, -0.30));
      // Muzzle device (threaded crown)
      g.add(_P(_T(0.014, 0.028, _pal.blk(), 8), X, Y + 0.006, -0.42));
      // Helical 64-round magazine (fat cylinder under barrel — the Bizon's trademark)
      g.add(_P(_T(0.020, 0.20, 0x1a1a18, 12), X, Y - 0.020, -0.22));
      const mc = new THREE.Mesh(new THREE.SphereGeometry(0.020, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0x1a1a18 }));
      mc.position.set(X, Y - 0.020, -0.32); g.add(mc);
      // Side-fold stock (AKS-style wire)
      g.add(_P(_B(0.006, 0.052, 0.080, 0x1a1a14), X + 0.030, Y + 0.002, -0.08));
      // Pistol grip
      g.add(_P(_B(0.020, 0.046, 0.024, _pal.poly()), X, Y - 0.034, -0.05));
      // Front sight post
      g.add(_P(_B(0.006, 0.022, 0.006, _pal.blk()), X, Y + 0.040, -0.38));
      return g;
    },

    // ── FAB-500M62 Glide Bomb with UMPK kit ──────────────────────────
    fab500: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.12, Y = -0.08;
      // Main bomb body (thick cylinder — 500kg iron bomb)
      g.add(_P(_T(0.034, 0.52, 0x2a2a1e, 14), X, Y, -0.28));
      // Ogive nose
      const noseMat = new THREE.MeshLambertMaterial({ color: 0x1a1a14 });
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.085, 14), noseMat);
      nose.rotation.x = -Math.PI / 2; nose.position.set(X, Y, -0.04); g.add(nose);
      // Tail section (narrower)
      g.add(_P(_T(0.026, 0.10, 0x1a1a14, 10), X, Y, -0.57));
      // UMPK folded navigation wings (mid-body, flat rectangles)
      g.add(_P(_B(0.130, 0.005, 0.062, 0x3a3a28), X, Y + 0.002, -0.22));
      // UMPK electronics box on top (guidance kit)
      g.add(_P(_B(0.018, 0.016, 0.055, 0x1a1a0a), X, Y + 0.053, -0.24));
      // Tail fins (two crossed planes)
      g.add(_P(_B(0.062, 0.005, 0.048, 0x2a2a1e), X, Y + 0.002, -0.56));
      g.add(_P(_B(0.005, 0.062, 0.048, 0x2a2a1e), X, Y + 0.002, -0.56));
      // Wing-tip control surfaces (ailerons)
      g.add(_P(_B(0.010, 0.014, 0.024, _pal.blk()), X - 0.068, Y + 0.002, -0.22));
      g.add(_P(_B(0.010, 0.014, 0.024, _pal.blk()), X + 0.068, Y + 0.002, -0.22));
      // Nose fuze arming wire
      g.add(_P(_T(0.002, 0.040, _pal.steel(), 4), X + 0.016, Y + 0.010, -0.05));
      return g;
    },

    // ── M777 155mm Howitzer (laser rangefinder / fire control) ───────
    m777: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.14, Y = -0.08;
      // Binocular body (rangefinder/laser designator for calling fire)
      g.add(_P(_B(0.068, 0.040, 0.028, 0x4a5230), X, Y, -0.18));
      // Left and right objective lenses
      g.add(_P(_T(0.012, 0.012, 0x1a2a1a, 8), X - 0.024, Y + 0.002, -0.196));
      g.add(_P(_T(0.012, 0.012, 0x1a2a1a, 8), X + 0.024, Y + 0.002, -0.196));
      // Eyepiece housing (rear, slightly different shape)
      g.add(_P(_B(0.060, 0.036, 0.022, 0x3a4228), X, Y, -0.162));
      // Eyepiece cups
      g.add(_P(_T(0.010, 0.008, 0x0a0a0a, 6), X - 0.020, Y + 0.002, -0.154));
      g.add(_P(_T(0.010, 0.008, 0x0a0a0a, 6), X + 0.020, Y + 0.002, -0.154));
      // Laser rangefinder unit (top)
      g.add(_P(_B(0.020, 0.012, 0.016, 0x1a1a0a), X, Y + 0.028, -0.18));
      // Laser emission window (small glass block)
      g.add(_P(_B(0.010, 0.006, 0.006, 0x223344), X - 0.012, Y + 0.028, -0.190));
      // Handle / grip (bottom centre)
      g.add(_P(_B(0.024, 0.038, 0.018, _pal.poly()), X, Y - 0.038, -0.175));
      // Ranging knob (top right)
      g.add(_P(_T(0.005, 0.010, _pal.steel(), 6), X + 0.026, Y + 0.028, -0.175));
      // NATO yellow artillery callsign sticker
      g.add(_P(_B(0.018, 0.008, 0.004, 0xcccc44), X - 0.018, Y + 0.018, -0.195));
      return g;
    },

    // ── Strela-2M (SA-7 GRAIL MANPADS) ───────────────────────────────
    strela2: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.085;
      // Main launch tube (older design — thicker, less refined than Igla)
      g.add(_P(_T(0.026, 0.42, 0x4a5030, 10), X, Y, -0.26));
      // Seeker head (nose, Strela-2 has large blunt IR seeker dome)
      g.add(_P(_T(0.032, 0.065, 0x2a2a1e, 10), X, Y, -0.035));
      // Glass IR seeker dome (semi-transparent sphere)
      const domeM = new THREE.MeshLambertMaterial({ color: 0x1a2830, transparent: true, opacity: 0.75 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), domeM);
      dome.position.set(X, Y, 0.030); g.add(dome);
      // Shoulder rest / gripstock
      g.add(_P(_B(0.055, 0.016, 0.038, 0x1a1a10), X, Y - 0.020, -0.44));
      // Trigger/pistol grip
      g.add(_P(_B(0.014, 0.040, 0.022, 0x1a1a0a), X, Y - 0.030, -0.22));
      // IFF transponder block (side)
      g.add(_P(_B(0.010, 0.016, 0.022, 0x222211), X + 0.028, Y + 0.004, -0.30));
      // Rear stabilising fin stubs
      g.add(_P(_B(0.040, 0.004, 0.022, 0x3a4030), X, Y, -0.46));
      g.add(_P(_B(0.004, 0.040, 0.022, 0x3a4030), X, Y, -0.46));
      // Cooling unit (grey cylinder, left side mid-tube) — cools seeker before use
      g.add(_P(_T(0.010, 0.030, 0x666655, 8), X - 0.028, Y, -0.20));
      return g;
    },

    // ── Commercial Drop Drone (DJI Mavic-style + VOG-25 grenade) ─────
    dropdrone: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.13, Y = -0.05;
      // Central body (DJI Mavic wedge shape)
      g.add(_P(_B(0.038, 0.018, 0.044, 0x222224), X, Y, -0.14));
      // Camera gimbal housing (front underside)
      g.add(_P(_B(0.020, 0.016, 0.010, 0x333336), X, Y - 0.001, -0.178));
      // Camera lens
      const cam = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 4),
        new THREE.MeshLambertMaterial({ color: 0x111122 }));
      cam.position.set(X, Y - 0.001, -0.185); g.add(cam);
      // Rear arms (folded back — Mavic fold pattern)
      g.add(_P(_B(0.006, 0.006, 0.040, 0x222224), X - 0.018, Y, -0.122));
      g.add(_P(_B(0.006, 0.006, 0.040, 0x222224), X + 0.018, Y, -0.122));
      // Front arms (folded forward, shorter)
      g.add(_P(_B(0.040, 0.006, 0.006, 0x222224), X, Y, -0.130));
      // Motor pods (4 tips)
      for (let i = 0; i < 4; i++) {
        const ax = (i < 2 ? -1 : 1) * 0.040, az = (i % 2 === 0 ? -0.122 : -0.108);
        g.add(_P(_T(0.008, 0.014, _pal.steel(), 6), X + ax, Y + 0.010, az));
        g.add(_P(_T(0.018, 0.002, 0xddddcc, 6), X + ax, Y + 0.018, az));
      }
      // VOG-25 grenade in 3D-printed clamp (hanging under body)
      g.add(_P(_T(0.012, 0.038, 0x3a3a28, 8), X, Y - 0.030, -0.14));
      g.add(_P(_T(0.015, 0.008, 0x2a2a20, 6), X, Y - 0.030, -0.118));
      // Clamp bracket
      g.add(_P(_B(0.022, 0.005, 0.004, 0x444444), X, Y - 0.016, -0.132));
      // Battery indicator LED (tiny coloured dot on top)
      g.add(_P(_B(0.004, 0.004, 0.004, 0x00cc44), X - 0.010, Y + 0.012, -0.158));
      return g;
    },

    // ── Bayraktar TB2 Ground Control Station handset ──────────────────
    bayraktar: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.14, Y = -0.07;
      // GCS body (thicker game controller / handheld terminal)
      g.add(_P(_B(0.090, 0.055, 0.030, 0x2a3020), X, Y, -0.185));
      // Screen (drone video feed — slightly blue-tinted)
      g.add(_P(_B(0.070, 0.038, 0.004, 0x080e1a), X, Y + 0.004, -0.204));
      // Drone silhouette on screen (tiny T-shape = TB2 top view)
      g.add(_P(_B(0.028, 0.003, 0.004, 0x1a4488), X, Y + 0.010, -0.205));  // wings
      g.add(_P(_B(0.003, 0.016, 0.004, 0x1a4488), X, Y + 0.002, -0.205));  // fuselage
      // Left joystick grip
      g.add(_P(_B(0.014, 0.036, 0.022, _pal.poly()), X - 0.036, Y - 0.020, -0.185));
      g.add(_P(_T(0.006, 0.014, _pal.blk(), 6), X - 0.036, Y + 0.014, -0.185));
      // Right joystick grip
      g.add(_P(_B(0.014, 0.036, 0.022, _pal.poly()), X + 0.036, Y - 0.020, -0.185));
      g.add(_P(_T(0.006, 0.014, _pal.blk(), 6), X + 0.036, Y + 0.014, -0.185));
      // Turkish flag sticker (red block on right side)
      g.add(_P(_B(0.010, 0.006, 0.004, 0xcc2222), X + 0.028, Y + 0.022, -0.200));
      // Antenna (right side, thin post)
      g.add(_P(_T(0.003, 0.042, _pal.blk(), 6), X + 0.038, Y + 0.048, -0.185));
      // Launch authorise button (red top-centre)
      const authBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.006, 6),
        new THREE.MeshLambertMaterial({ color: 0xcc2200 }));
      authBtn.position.set(X, Y + 0.032, -0.205); g.add(authBtn);
      return g;
    },

    // ── TOS-1A Buratino thermobaric fire control unit ─────────────────
    tos1a: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.14, Y = -0.07;
      // Ruggedised fire control unit (orange-red safety colour)
      g.add(_P(_B(0.080, 0.052, 0.028, 0x8a3308), X, Y, -0.170));
      // Screen (target area map, dark green)
      g.add(_P(_B(0.056, 0.034, 0.004, 0x0a0e08), X, Y + 0.004, -0.186));
      // Grid lines on screen
      g.add(_P(_B(0.056, 0.001, 0.003, 0x1a3a0a), X, Y + 0.008, -0.186));
      g.add(_P(_B(0.001, 0.034, 0.003, 0x1a3a0a), X, Y + 0.004, -0.186));
      // Large red fire-mission button (prominent, safety guard ring)
      const fBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 8),
        new THREE.MeshLambertMaterial({ color: 0xff3300 }));
      fBtn.position.set(X + 0.028, Y + 0.020, -0.190); g.add(fBtn);
      g.add(_P(_T(0.018, 0.004, 0x5a2a08, 8), X + 0.028, Y + 0.022, -0.190));
      // Rubber side grips
      g.add(_P(_B(0.006, 0.044, 0.024, 0x1a1a10), X - 0.044, Y, -0.170));
      g.add(_P(_B(0.006, 0.044, 0.024, 0x1a1a10), X + 0.044, Y, -0.170));
      // "TOS" marking on face (yellow lines)
      g.add(_P(_B(0.016, 0.002, 0.002, 0xdddd22), X - 0.022, Y + 0.020, -0.188));
      g.add(_P(_B(0.002, 0.012, 0.002, 0xdddd22), X - 0.022, Y + 0.014, -0.188));
      return g;
    },

    // ── DP-27/28 Degtyarev LMG with 47-round pan magazine ────────────
    dp27: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.11;
      // Flat low receiver (DP-28 has very slim profile)
      g.add(_P(_B(0.042, 0.048, 0.28, 0x3a3228), X, Y, -0.20));
      // Long barrel with cooling fins (distinctive jacketted barrel)
      g.add(_P(_T(0.012, 0.52, _pal.steel(), 12), X, Y + 0.004, -0.49));
      for (let rf = 0; rf < 7; rf++) {
        g.add(_P(_T(0.014, 0.006, 0x4a4842, 10), X, Y + 0.004, -0.26 - rf * 0.050));
      }
      // Muzzle (plain open)
      g.add(_P(_T(0.014, 0.018, _pal.blk(), 8), X, Y + 0.004, -0.75));
      // Gas cylinder (long piston rod below barrel — characteristic DP feature)
      g.add(_P(_T(0.009, 0.32, 0x5a5850, 10), X, Y - 0.020, -0.35));
      // DISTINCTIVE flat 47-round pan magazine on TOP of receiver
      const panM = new THREE.MeshLambertMaterial({ color: 0x2a2822 });
      const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.024, 18), panM);
      pan.rotation.x = Math.PI / 2; pan.position.set(X, Y + 0.042, -0.22); g.add(pan);
      const panRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.044, 0.005, 6, 18), _pal.blk());
      panRim.rotation.x = Math.PI / 2; panRim.position.set(X, Y + 0.042, -0.22); g.add(panRim);
      // Bipod legs (V-shape at gas block, folded forward)
      const bl = _P(_B(0.006, 0.046, 0.008, _pal.blk()), X - 0.022, Y - 0.022, -0.38);
      bl.rotation.z = 0.25; g.add(bl);
      const br2 = _P(_B(0.006, 0.046, 0.008, _pal.blk()), X + 0.022, Y - 0.022, -0.38);
      br2.rotation.z = -0.25; g.add(br2);
      // Wooden pistol grip and buttstock
      g.add(_P(_B(0.020, 0.044, 0.025, _pal.wood()), X, Y - 0.030, -0.06));
      g.add(_P(_B(0.032, 0.038, 0.115, _pal.wood()), X, Y - 0.006, 0.014));
      return g;
    },

    // ── SV-98 bolt-action precision sniper ───────────────────────────
    sv98: function () {
      return _rifle({
        hg: 'rail', hgColor: _pal.tan,
        stock: 'fixed', stockColor: () => _M(0x2a2820, 0.25, 0.7),
        mag: 'box', magColor: _pal.blk,
        muzzle: 'brake',
        rail: true, scope: true, bipod: true,
        recvLen: 0.30, barR: 0.013, barLen: 0.55,
        recvColor: () => _M(0x282624, 0.4, 0.5),
      });
    },

    // ── Lancet-3 loitering munition ──────────────────────────────────
    lancet3: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.10;
      // Main fuselage (cylindrical, 380mm body)
      g.add(_P(_T(0.016, 0.36, 0x1c1e1a, 10), X, Y, -0.24));
      // Ogive warhead nose
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.016, 0.08, 8),
        new THREE.MeshLambertMaterial({ color: 0x2a2c28 }));
      nose.rotation.x = -Math.PI / 2; nose.position.set(X, Y, -0.47); g.add(nose);
      // Distinctive X-wing fins at NOSE (4 swept wings)
      for (let i = 0; i < 4; i++) {
        const wf = _P(_B(0.002, 0.038, 0.040, 0x2a2c28), X, Y, -0.44);
        wf.rotation.z = (Math.PI / 4) + i * (Math.PI / 2); g.add(wf);
      }
      // X-wing fins at TAIL (same distinctive pattern)
      for (let i = 0; i < 4; i++) {
        const wt = _P(_B(0.002, 0.040, 0.045, 0x2a2c28), X, Y, -0.06);
        wt.rotation.z = (Math.PI / 4) + i * (Math.PI / 2); g.add(wt);
      }
      // Electric propulsion unit (pusher prop at tail)
      g.add(_P(_T(0.012, 0.025, _pal.steel(), 8), X, Y, 0.04));
      // Camera/seeker dome (transparent-tinted)
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x4060a0, transparent: true, opacity: 0.7 }));
      dome.rotation.x = -Math.PI / 2; dome.position.set(X, Y - 0.012, -0.45); g.add(dome);
      // Operator handle / launch tube section
      g.add(_P(_B(0.018, 0.014, 0.07, _pal.blk()), X, Y + 0.024, -0.22));
      return g;
    },

    // ── Storm Shadow cruise missile (operator GCS) ───────────────────
    stormshadow: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.10;
      // Laptop-style GCS body
      g.add(_P(_B(0.06, 0.045, 0.085, 0x2a2c30), X, Y, 0.0));
      // Screen lid (angled open)
      const lid = _P(_B(0.058, 0.042, 0.001, 0x111318), X, Y + 0.020, -0.042);
      lid.rotation.x = -0.4; g.add(lid);
      // Screen glow (blue mission display)
      const scrn = _P(_B(0.050, 0.034, 0.002, 0x1a4a8c), X, Y + 0.022, -0.043);
      scrn.rotation.x = -0.4; g.add(scrn);
      // Keyboard keys (2 rows)
      for (let kx = 0; kx < 5; kx++) {
        g.add(_P(_B(0.009, 0.005, 0.009, 0x1a1c20), X - 0.022 + kx * 0.011, Y - 0.004, 0.022));
        g.add(_P(_B(0.009, 0.005, 0.009, 0x1a1c20), X - 0.022 + kx * 0.011, Y - 0.004, 0.033));
      }
      // Missile profile silhouette on screen
      const msil = _P(_B(0.030, 0.002, 0.015, 0x4080ff), X, Y + 0.028, -0.040);
      msil.rotation.x = -0.4; g.add(msil);
      // NATO badge sticker
      g.add(_P(_B(0.014, 0.014, 0.001, 0x003087), X + 0.025, Y + 0.020, -0.001));
      // Joystick nub
      const jnub = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0x111111 }));
      jnub.position.set(X - 0.020, Y + 0.000, 0.005); g.add(jnub);
      // STRIKE button (red)
      const sbtn = new THREE.Mesh(
        new THREE.SphereGeometry(0.005, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0xdd1111 }));
      sbtn.position.set(X + 0.025, Y - 0.001, 0.015); g.add(sbtn);
      return g;
    },

    // ── AS Val suppressed assault rifle ─────────────────────────────
    asval: function () {
      return _rifle({
        hg: 'wood', hgColor: () => _M(0x1c1e1c, 0.3, 0.7),
        stock: 'skel', stockColor: _pal.blk,
        mag: 'curved', magColor: _pal.blk,
        muzzle: 'supp',
        recvLen: 0.26, barR: 0.011, barLen: 0.18,
        recvColor: _pal.blk, sights: false,
      });
    },

    // ── OSV-96 12.7mm anti-material rifle ───────────────────────────
    osv96: function () {
      return _rifle({
        hg: 'rail', hgColor: _pal.steel,
        stock: 'tube', stockColor: _pal.blk,
        mag: 'box', magColor: _pal.blk,
        muzzle: 'brake',
        rail: true, scope: true, bipod: true,
        recvLen: 0.38, barR: 0.018, barLen: 0.62,
        recvColor: _pal.blk,
      });
    },

    // ── Neptune R-360 (coastal battery fire-control console) ────────
    neptune: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Ruggedised military console body
      g.add(_P(_B(0.070, 0.050, 0.090, 0x1e2228), X, Y, 0.0));
      // Targeting screen (sea-blue radar display)
      const sc = _P(_B(0.054, 0.038, 0.002, 0x0a2840), X, Y + 0.006, -0.045);
      sc.rotation.x = -0.2; g.add(sc);
      // Radar sweep arc on screen
      const arc = _P(_B(0.040, 0.002, 0.025, 0x00cc88), X, Y + 0.012, -0.044);
      arc.rotation.x = -0.2; g.add(arc);
      // TARGET LOCKED indicator
      const tgt = _P(_B(0.018, 0.006, 0.001, 0xff2200), X + 0.010, Y + 0.020, -0.044);
      tgt.rotation.x = -0.2; g.add(tgt);
      // Fire panel (3 buttons on top — ARM, CONFIRM, FIRE)
      const btnColors = [0x224488, 0xff8800, 0xff0000];
      for (let b = 0; b < 3; b++) {
        const btn = new THREE.Mesh(
          new THREE.SphereGeometry(0.006, 6, 6),
          new THREE.MeshLambertMaterial({ color: btnColors[b] }));
        btn.position.set(X - 0.016 + b * 0.016, Y + 0.028, 0.010); g.add(btn);
      }
      // Cable / communications port
      g.add(_P(_T(0.004, 0.040, _pal.blk(), 6), X + 0.030, Y - 0.010, 0.010));
      // Ukrainian trident embossed on console face
      g.add(_P(_B(0.012, 0.018, 0.001, 0x4488cc), X, Y + 0.010, 0.046));
      return g;
    },

    // ── Metis-M1 ATGM (launcher + sight unit) ───────────────────────
    metis_m1: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.10;
      // Launch tube (rectangular cross-section, tan colour)
      g.add(_P(_B(0.040, 0.036, 0.38, _pal.tan), X, Y, -0.22));
      // Forward grip (folding)
      g.add(_P(_B(0.012, 0.040, 0.016, 0x2a2820), X - 0.002, Y - 0.030, -0.28));
      // Thermal sight unit (box on top)
      g.add(_P(_B(0.030, 0.028, 0.065, 0x282a26), X, Y + 0.034, -0.15));
      // Sight lens (circular, front-facing)
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.010, 0.006, 8),
        new THREE.MeshLambertMaterial({ color: 0x1a2a40, transparent: true, opacity: 0.8 }));
      lens.rotation.x = Math.PI / 2; lens.position.set(X, Y + 0.034, -0.186); g.add(lens);
      // Missile tube end-cap (distinctive squared shape)
      g.add(_P(_B(0.042, 0.038, 0.012, 0x404038), X, Y, -0.43));
      // Firing grip / trigger assembly
      g.add(_P(_B(0.014, 0.038, 0.020, 0x1a1c18), X, Y - 0.016, -0.10));
      // Front ring clamp
      g.add(_P(_B(0.044, 0.040, 0.010, 0x3a3c38), X, Y, -0.38));
      // Sling attachment point
      g.add(_P(_B(0.006, 0.012, 0.020, _pal.blk()), X + 0.022, Y + 0.010, -0.30));
      return g;
    },

    // ── M249 SAW / FN Minimi belt-fed LMG ───────────────────────────
    m249saw: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.10;
      // Receiver (flat top rail, M249 profile)
      g.add(_P(_B(0.040, 0.044, 0.28, 0x2c2e2a), X, Y, -0.18));
      // Top rail
      g.add(_P(_B(0.038, 0.008, 0.26, 0x242624), X, Y + 0.028, -0.18));
      // Barrel (heavy, fluted — M249 has quick-detach barrel)
      g.add(_P(_T(0.013, 0.50, _pal.steel(), 12), X, Y, -0.55));
      // Muzzle flash hider (birdcage type)
      g.add(_P(_T(0.016, 0.024, _pal.blk(), 6), X, Y, -0.82));
      // Bipod (characteristic M249 bipod attached to gas block)
      const bL = _P(_B(0.006, 0.050, 0.010, _pal.blk()), X - 0.020, Y - 0.030, -0.42);
      bL.rotation.z = 0.20; g.add(bL);
      const bR = _P(_B(0.006, 0.050, 0.010, _pal.blk()), X + 0.020, Y - 0.030, -0.42);
      bR.rotation.z = -0.20; g.add(bR);
      // 200-round ammo box (dangling on left side — STANAG-style plastic box)
      g.add(_P(_B(0.020, 0.040, 0.058, 0x1e2820), X - 0.032, Y - 0.022, -0.14));
      // Feed tray cover
      g.add(_P(_B(0.040, 0.010, 0.090, 0x282a26), X, Y + 0.032, -0.12));
      // Carry handle / barrel grab
      g.add(_P(_B(0.006, 0.030, 0.080, 0x242422), X, Y + 0.050, -0.35));
      // Pistol grip
      g.add(_P(_B(0.018, 0.045, 0.022, 0x1a1c18), X, Y - 0.032, -0.02));
      // Collapsible stock
      g.add(_P(_B(0.024, 0.030, 0.085, 0x282a26), X, Y - 0.010, 0.060));
      return g;
    },

    // ── Shahed-136 / Geranium-2 suicide drone ───────────────────────
    shahed136: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.10;
      // Fuselage (rectangular, very low profile)
      g.add(_P(_B(0.026, 0.016, 0.30, 0x2a2e22), X, Y, -0.18));
      // Warhead nose (blunt cone, forward)
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.013, 0.055, 7),
        new THREE.MeshLambertMaterial({ color: 0x3a3a2a }));
      nose.rotation.x = -Math.PI / 2; nose.position.set(X, Y, -0.36); g.add(nose);
      // DISTINCTIVE delta wings (swept back, triangular)
      const wMat = new THREE.MeshLambertMaterial({ color: 0x303428 });
      const wShape = [
        new THREE.Vector2(0, 0), new THREE.Vector2(-0.10, 0.10),
        new THREE.Vector2(-0.10, 0.12), new THREE.Vector2(0, 0.004),
      ];
      // Left delta wing
      for (let s = 0; s < 2; s++) {
        const wSide = _P(_B(0.001, 0.065, 0.18, 0x383c2c), X + (s === 0 ? -0.020 : 0.020), Y, -0.12);
        wSide.rotation.z = s === 0 ? 0.45 : -0.45; g.add(wSide);
      }
      // Tail: small vertical fins
      g.add(_P(_B(0.002, 0.030, 0.028, 0x303028), X, Y + 0.020, 0.04));
      g.add(_P(_B(0.002, 0.030, 0.028, 0x303028), X, Y - 0.020, 0.04));
      // Pusher propeller (rear-mounted)
      g.add(_P(_T(0.010, 0.020, _pal.steel(), 6), X, Y, 0.09));
      // Prop blades (2-blade)
      g.add(_P(_B(0.002, 0.004, 0.070, _pal.blk()), X, Y, 0.10));
      // Operator tracking screen (ruggedised military tablet)
      const scrn = _P(_B(0.050, 0.040, 0.006, 0x111418), X, Y + 0.002, 0.20);
      scrn.rotation.x = -0.3; g.add(scrn);
      // Red "LAUNCH" indicator on screen
      g.add(_P(_B(0.016, 0.010, 0.001, 0xcc1100), X, Y + 0.014, 0.195));
      return g;
    },

    // ── AGM-88 HARM cockpit GCS ─────────────────────────────────────
    agm88harm: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // EW console body (flat panel)
      g.add(_P(_B(0.072, 0.048, 0.080, 0x1c1e22), X, Y, 0.0));
      // Radar frequency display (green-on-black like early EW units)
      const rd = _P(_B(0.058, 0.035, 0.002, 0x001408), X, Y + 0.006, -0.041);
      rd.rotation.x = -0.15; g.add(rd);
      // Frequency lock bars (target radar signatures)
      for (let f = 0; f < 5; f++) {
        const h = 0.004 + (f % 3) * 0.008;
        g.add(_P(_B(0.006, h, 0.002, 0x00ff44), X - 0.020 + f * 0.010, Y + 0.010, -0.040));
      }
      // LOCK indicator
      g.add(_P(_B(0.020, 0.008, 0.001, 0xffcc00), X + 0.010, Y + 0.020, -0.040));
      // Physical radar horn (small directional antenna on top)
      g.add(_P(_T(0.012, 0.028, 0x404044, 6), X, Y + 0.032, -0.010));
      // Frequency band selector knob
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.012, 8),
        new THREE.MeshLambertMaterial({ color: 0x181a1e }));
      knob.position.set(X - 0.025, Y - 0.006, 0.010); g.add(knob);
      // FIRE button
      const fbtn = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0xff2200 }));
      fbtn.position.set(X + 0.025, Y - 0.002, 0.015); g.add(fbtn);
      return g;
    },

    // ── RGO-78 defensive grenade ────────────────────────────────────
    rgo78: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.12;
      // Slightly larger than RGD-5, olive drab body
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 10, 8),
        new THREE.MeshLambertMaterial({ color: 0x2e3428 }));
      body.position.set(X, Y, -0.04); g.add(body);
      // Segmentation lines (dual fragmentation pattern — waist ring)
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.026, 0.003, 6, 16),
        new THREE.MeshLambertMaterial({ color: 0x1e2418 }));
      band.rotation.x = Math.PI / 2; band.position.set(X, Y, -0.04); g.add(band);
      // Fuze body (top cylinder)
      g.add(_P(_T(0.009, 0.040, 0x282a24, 8), X, Y + 0.030, -0.04));
      // Spoon / lever
      g.add(_P(_B(0.004, 0.032, 0.006, _pal.steel()), X + 0.012, Y + 0.014, -0.04));
      // Safety pin ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.007, 0.002, 6, 8),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      ring.position.set(X + 0.014, Y + 0.044, -0.04); g.add(ring);
      return g;
    },

    // ── Gepard 35mm AA (operator sight + joystick controller) ───────
    gepard35: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Gunner console body (German angular military design)
      g.add(_P(_B(0.068, 0.052, 0.085, 0x282c28), X, Y, 0.0));
      // Radar tracking display (circular sweep, German grey)
      const disp = _P(_B(0.052, 0.040, 0.002, 0x101810), X, Y + 0.006, -0.043);
      disp.rotation.x = -0.15; g.add(disp);
      // Radar arc (green sweep)
      const arc = _P(_B(0.040, 0.002, 0.030, 0x00aa44), X, Y + 0.012, -0.042);
      arc.rotation.x = -0.15; g.add(arc);
      // Target blip
      const blip = new THREE.Mesh(
        new THREE.SphereGeometry(0.004, 5, 5),
        new THREE.MeshLambertMaterial({ color: 0x00ff44 }));
      blip.position.set(X + 0.008, Y + 0.016, -0.041); g.add(blip);
      // Dual joystick handles (German twin-handle design)
      for (let jx = 0; jx < 2; jx++) {
        const jh = _P(_B(0.014, 0.028, 0.016, 0x1a1c1a), X - 0.018 + jx * 0.036, Y - 0.014, 0.020);
        g.add(jh);
        const jt = new THREE.Mesh(
          new THREE.SphereGeometry(0.007, 6, 6),
          new THREE.MeshLambertMaterial({ color: 0x111311 }));
        jt.position.set(X - 0.018 + jx * 0.036, Y + 0.010, 0.020); g.add(jt);
      }
      // FIRE buttons (red, one per joystick)
      const fb1 = new THREE.Mesh(new THREE.SphereGeometry(0.004, 5, 5), new THREE.MeshLambertMaterial({ color: 0xff1100 }));
      const fb2 = new THREE.Mesh(new THREE.SphereGeometry(0.004, 5, 5), new THREE.MeshLambertMaterial({ color: 0xff1100 }));
      fb1.position.set(X - 0.018, Y + 0.014, 0.020); g.add(fb1);
      fb2.position.set(X + 0.018, Y + 0.014, 0.020); g.add(fb2);
      // Iron Cross / Bundeswehr sticker (subtle)
      g.add(_P(_B(0.010, 0.010, 0.001, 0x111111), X, Y + 0.020, -0.001));
      return g;
    },

    // ── RPG-30 (dual-tube precursor system) ─────────────────────────
    rpg30: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.10;
      // Main 105mm tube (wider bore)
      g.add(_P(_T(0.028, 0.50, 0x2c2e28, 12), X, Y, -0.28));
      // Main warhead (PG-30 tandem — blunter nose than RPG-7)
      const wh = new THREE.Mesh(
        new THREE.ConeGeometry(0.028, 0.10, 10),
        new THREE.MeshLambertMaterial({ color: 0x4a3a1a }));
      wh.rotation.x = -Math.PI / 2; wh.position.set(X, Y, -0.55); g.add(wh);
      // Distinctive SECOND smaller precursor tube (parallel, upper left)
      g.add(_P(_T(0.014, 0.32, 0x3a3830, 10), X - 0.030, Y + 0.026, -0.20));
      // Precursor warhead (smaller cone)
      const pre = new THREE.Mesh(
        new THREE.ConeGeometry(0.014, 0.055, 8),
        new THREE.MeshLambertMaterial({ color: 0x3a2a10 }));
      pre.rotation.x = -Math.PI / 2; pre.position.set(X - 0.030, Y + 0.026, -0.38); g.add(pre);
      // Grip (rear section, trigger assembly)
      g.add(_P(_B(0.018, 0.048, 0.025, 0x1c1e1a), X, Y - 0.018, -0.08));
      // Front and rear sights
      g.add(_P(_B(0.003, 0.018, 0.003, _pal.blk()), X, Y + 0.032, -0.38));
      g.add(_P(_B(0.003, 0.014, 0.003, _pal.blk()), X, Y + 0.030, -0.12));
      // Strap loops
      g.add(_P(_B(0.006, 0.012, 0.008, _pal.blk()), X + 0.030, Y, -0.25));
      return g;
    },

    // ── PTRD-41 anti-tank rifle (14.5mm bolt-action) ─────────────────
    ptrd41: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Very long, thin receiver (PTRD is almost entirely barrel, ~2m overall)
      g.add(_P(_B(0.022, 0.028, 0.38, 0x2c2e28), X, Y, -0.22));
      // Extremely long heavy barrel (14.5mm bore — much thicker than sniper)
      g.add(_P(_T(0.016, 0.72, _pal.steel(), 12), X, Y + 0.002, -0.66));
      // Muzzle brake (large 3-port brake characteristic of PTRD)
      g.add(_P(_T(0.022, 0.055, _pal.steel(), 8), X, Y + 0.002, -1.04));
      g.add(_P(_B(0.028, 0.014, 0.008, _pal.blk()), X, Y + 0.002, -1.02));
      g.add(_P(_B(0.028, 0.014, 0.008, _pal.blk()), X, Y + 0.002, -1.00));
      // Muzzle block/crown
      g.add(_P(_T(0.018, 0.010, _pal.blk(), 8), X, Y + 0.002, -1.07));
      // Pistol grip (simple wood)
      g.add(_P(_B(0.018, 0.048, 0.022, _pal.wood()), X, Y - 0.028, -0.06));
      // Fixed wood stock (straight, no pistol grip — WW2 style)
      g.add(_P(_B(0.028, 0.030, 0.14, _pal.wood()), X, Y - 0.010, 0.065));
      // Recoil pad (rubber, distinctive for 14.5mm)
      g.add(_P(_B(0.032, 0.036, 0.012, 0x1a1a1a), X, Y - 0.010, 0.142));
      // Single-shot loading port (no magazine — pure bolt-action)
      g.add(_P(_B(0.010, 0.008, 0.022, 0x1c1c1c), X + 0.012, Y + 0.008, -0.10));
      // Bipod (long for stability — attached at forestock)
      const bL2 = _P(_B(0.006, 0.060, 0.010, _pal.blk()), X - 0.025, Y - 0.038, -0.45);
      bL2.rotation.z = 0.20; g.add(bL2);
      const bR2 = _P(_B(0.006, 0.060, 0.010, _pal.blk()), X + 0.025, Y - 0.038, -0.45);
      bR2.rotation.z = -0.20; g.add(bR2);
      // Rear sight
      g.add(_P(_B(0.003, 0.020, 0.003, _pal.blk()), X, Y + 0.022, -0.08));
      return g;
    },

    // ── 9M113 Konkurs ATGM (tripod launcher) ────────────────────────
    konkurs: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Launch tube (square cross-section, NATO tan)
      g.add(_P(_B(0.044, 0.040, 0.42, _pal.tan), X, Y, -0.24));
      // Missile tube protective end-cap (rear)
      g.add(_P(_B(0.046, 0.042, 0.012, 0x3a3830), X, Y, -0.46));
      // Sight unit (9Sh119M periscope box, prominent on top)
      g.add(_P(_B(0.035, 0.035, 0.070, 0x282a26), X, Y + 0.040, -0.12));
      // Periscope lens (front of sight)
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.006, 8),
        new THREE.MeshLambertMaterial({ color: 0x1a2840, transparent: true, opacity: 0.8 }));
      lens.rotation.x = Math.PI / 2; lens.position.set(X, Y + 0.040, -0.158); g.add(lens);
      // Grip assembly (pistol grip style under tube)
      g.add(_P(_B(0.016, 0.044, 0.024, 0x1e2018), X, Y - 0.026, -0.10));
      // Trigger guard
      g.add(_P(_B(0.020, 0.006, 0.028, 0x1e2018), X, Y - 0.038, -0.09));
      // Tube front support / gas deflector
      g.add(_P(_B(0.048, 0.016, 0.016, 0x3a3c38), X, Y - 0.016, -0.40));
      // Wire spool housing (Konkurs is wire-guided — visible spool at rear)
      g.add(_P(_T(0.020, 0.018, 0x2a2c28, 10), X + 0.024, Y + 0.012, -0.44));
      // Tripod legs (3 legs at 120°)
      for (let lt = 0; lt < 3; lt++) {
        const la = _P(_B(0.006, 0.070, 0.008, _pal.blk()), X, Y - 0.042, -0.20);
        la.rotation.z = (lt * 2.094) - 0.3; g.add(la);
      }
      return g;
    },

    // ── M32A1 MGL (6-shot revolver grenade launcher) ─────────────────
    m32mgl: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.10;
      // Receiver body (compact, wider than rifle due to cylinder)
      g.add(_P(_B(0.050, 0.048, 0.18, 0x1c1e1a), X, Y, -0.08));
      // Cylinder (6-chamber revolver — the visual centrepiece)
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.048, 12),
        new THREE.MeshLambertMaterial({ color: 0x222420 }));
      cyl.rotation.x = Math.PI / 2; cyl.position.set(X, Y, -0.095); g.add(cyl);
      // Cylinder chambers visible (6 holes)
      for (let ch = 0; ch < 6; ch++) {
        const ca = new THREE.Mesh(
          new THREE.CylinderGeometry(0.010, 0.010, 0.050, 6),
          new THREE.MeshLambertMaterial({ color: 0x0a0c0a }));
        ca.rotation.x = Math.PI / 2;
        ca.position.set(X + Math.cos(ch * Math.PI / 3) * 0.024,
          Y + Math.sin(ch * Math.PI / 3) * 0.024, -0.095); g.add(ca);
      }
      // Short barrel (40mm smooth bore)
      g.add(_P(_T(0.022, 0.28, 0x282a26, 10), X, Y, -0.25));
      // Muzzle (plain, no device)
      g.add(_P(_T(0.024, 0.010, _pal.blk(), 8), X, Y, -0.40));
      // Folding stock (telescoping wire — Milkor design)
      const st = _P(_B(0.020, 0.022, 0.11, 0x1a1c18), X, Y - 0.008, 0.075);
      g.add(st);
      g.add(_P(_B(0.028, 0.012, 0.006, 0x1a1c18), X, Y - 0.008, 0.128));
      // Pistol grip
      g.add(_P(_B(0.018, 0.044, 0.022, 0x282a26), X, Y - 0.032, 0.004));
      // Foregrip (vertical)
      g.add(_P(_B(0.018, 0.038, 0.020, 0x1c1e1a), X, Y - 0.030, -0.28));
      // Top rail
      g.add(_P(_B(0.038, 0.007, 0.15, 0x111312), X, Y + 0.030, -0.04));
      return g;
    },

    // ── AI AXMC .338 Lapua precision sniper ─────────────────────────
    aiax: function () {
      return _rifle({
        hg: 'rail', hgColor: _pal.blk,
        stock: 'tube', stockColor: () => _M(0x1a1e20, 0.3, 0.6),
        mag: 'box', magColor: _pal.blk,
        muzzle: 'brake',
        rail: true, scope: true, bipod: true,
        recvLen: 0.34, barR: 0.015, barLen: 0.58,
        recvColor: () => _M(0x1e2022, 0.4, 0.5),
      });
    },

    // ── 9M14 Malyutka (Sagger) manual ATGM ──────────────────────────
    malyutka: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.09;
      // Suitcase-style carrying/launch box (distinctive black box)
      g.add(_P(_B(0.065, 0.042, 0.095, 0x1c1e1a), X, Y, 0.0));
      // Launch rail on top (extends up at slight angle)
      const rail = _P(_B(0.008, 0.005, 0.080, 0x2a2c28), X, Y + 0.028, -0.010);
      rail.rotation.x = 0.15; g.add(rail);
      // Missile (small, seated on rail — 9M14 is tiny)
      g.add(_P(_T(0.010, 0.14, 0x2e3028, 8), X, Y + 0.036, -0.010));
      const misNose = new THREE.Mesh(
        new THREE.ConeGeometry(0.010, 0.035, 7),
        new THREE.MeshLambertMaterial({ color: 0x3a2a10 }));
      misNose.rotation.x = -Math.PI / 2; misNose.position.set(X, Y + 0.036, -0.096); g.add(misNose);
      // Wings (4 small fins at 45°)
      for (let mf = 0; mf < 4; mf++) {
        const fin = _P(_B(0.002, 0.018, 0.016, 0x2a2c28), X, Y + 0.036, 0.060);
        fin.rotation.z = (Math.PI / 4) + mf * (Math.PI / 2); g.add(fin);
      }
      // Joystick controller (thumb stick, iconic Sagger feature)
      const js = _P(_B(0.014, 0.032, 0.016, 0x181a18), X - 0.022, Y - 0.004, 0.030);
      g.add(js);
      const jst = new THREE.Mesh(
        new THREE.SphereGeometry(0.005, 5, 5),
        new THREE.MeshLambertMaterial({ color: 0x0a0a0a }));
      jst.position.set(X - 0.022, Y + 0.022, 0.030); g.add(jst);
      // Wire spool (prominent on front)
      g.add(_P(_T(0.016, 0.014, 0x282a26, 8), X + 0.020, Y + 0.010, -0.048));
      // Sight telescope (small, on right side)
      g.add(_P(_T(0.008, 0.055, 0x1e201e, 8), X + 0.028, Y + 0.010, -0.005));
      return g;
    },

    // ── 9K333 Verba MANPADS ──────────────────────────────────────────
    verba: function () {
      // Newer than Igla — sleeker tube, more ergonomic grip assembly
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.10;
      // Launch tube (lighter grey than older Strela/Igla systems)
      g.add(_P(_T(0.030, 0.68, 0x3a3c38, 14), X, Y, -0.34));
      // Grip/trigger section (modern ergonomic pistol grip shape)
      g.add(_P(_B(0.028, 0.058, 0.055, 0x282a26), X, Y - 0.018, -0.10));
      // Battery/coolant unit (distinctive modern box at grip)
      g.add(_P(_B(0.032, 0.030, 0.045, 0x1e201c), X, Y - 0.044, -0.10));
      // IFF identification unit (modern digital box, not on older systems)
      g.add(_P(_B(0.030, 0.020, 0.060, 0x242622), X, Y + 0.036, -0.20));
      // Seeker dome (3-channel — slightly larger than Igla/Strela)
      const dom = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x1a2835, transparent: true, opacity: 0.75 }));
      dom.rotation.x = -Math.PI / 2; dom.position.set(X, Y, -0.70); g.add(dom);
      // Rear exhaust / blast shield
      g.add(_P(_T(0.034, 0.018, 0x2a2a28, 10), X, Y, 0.00));
      // Shoulder rest pad (modern ergonomic design)
      g.add(_P(_B(0.055, 0.016, 0.026, 0x1a1c1a), X, Y, -0.14));
      // Front sight
      g.add(_P(_B(0.004, 0.020, 0.004, _pal.blk()), X, Y + 0.038, -0.58));
      return g;
    },

    // ── RGN-86 offensive grenade ─────────────────────────────────────
    rgn86: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.12;
      // Slightly smaller and rounder than RGO — offensive (less fragmentation)
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.023, 10, 8),
        new THREE.MeshLambertMaterial({ color: 0x2e3028 }));
      body.scale.y = 1.15; body.position.set(X, Y, -0.04); g.add(body);
      // Smooth plastic shell (no seam ring on RGN unlike RGO)
      // Fuze body
      g.add(_P(_T(0.008, 0.036, 0x242622, 8), X, Y + 0.028, -0.04));
      // UDZ impact fuze cap (distinctive dome-shaped top)
      const fcap = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 7, 5),
        new THREE.MeshLambertMaterial({ color: 0x1a1c18 }));
      fcap.position.set(X, Y + 0.050, -0.04); g.add(fcap);
      // Spoon/safety lever
      g.add(_P(_B(0.003, 0.028, 0.005, _pal.steel()), X + 0.010, Y + 0.014, -0.04));
      // Safety ring pull
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.006, 0.0018, 5, 7),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      ring2.position.set(X + 0.012, Y + 0.044, -0.04); g.add(ring2);
      return g;
    },

    // ── PPSh-41 (WW2 submachine gun, 71-round drum) ──────────────────
    ppsh41: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.17, Y = -0.10;
      // Distinctive rounded receiver + barrel shroud (perforated)
      g.add(_P(_T(0.026, 0.45, 0x2a2c28, 12), X, Y, -0.29));
      // Barrel shroud perforations (4 ring slots)
      for (let ps = 0; ps < 4; ps++) {
        g.add(_P(_B(0.058, 0.006, 0.020, 0x181a16), X, Y, -0.18 - ps * 0.055));
      }
      // Muzzle compensator (slanted, iconic PPSh feature)
      const comp = _P(_B(0.032, 0.022, 0.030, _pal.steel()), X, Y + 0.008, -0.51);
      comp.rotation.z = 0.15; g.add(comp);
      // DISTINCTIVE 71-round drum magazine (large circular)
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, 0.032, 20),
        new THREE.MeshLambertMaterial({ color: 0x1e201c }));
      drum.rotation.x = Math.PI / 2; drum.position.set(X, Y - 0.010, -0.12); g.add(drum);
      const drumRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.052, 0.004, 6, 20),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      drumRim.rotation.x = Math.PI / 2; drumRim.position.set(X, Y - 0.010, -0.12); g.add(drumRim);
      // Drum feed neck
      g.add(_P(_T(0.014, 0.028, 0x282a26, 8), X, Y + 0.014, -0.12));
      // Wood pistol grip (Soviet brown wood)
      g.add(_P(_B(0.020, 0.046, 0.026, 0x5a3c1a), X, Y - 0.030, -0.03));
      // Wood stock (straight, one-piece)
      g.add(_P(_B(0.028, 0.030, 0.14, 0x5a3c1a), X, Y - 0.010, 0.07));
      // Rear sight (flip-type)
      g.add(_P(_B(0.003, 0.018, 0.003, _pal.blk()), X, Y + 0.028, -0.06));
      // Front sight post
      g.add(_P(_B(0.003, 0.016, 0.003, _pal.blk()), X, Y + 0.030, -0.48));
      return g;
    },

    // ── RPG-32 Hashim (dual-calibre reusable AT launcher) ────────────
    rpg32: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.10;
      // Main launch tube — fibreglass/composite (sand tan)
      g.add(_P(_T(0.028, 0.55, _pal.tan(), 12), X, Y, -0.27));
      // Front sight / optical mount rail (above tube)
      g.add(_P(_B(0.060, 0.012, 0.008, _pal.blk()), X, Y + 0.032, -0.08));
      // 105mm warhead capsule (removable front module — wider than tube)
      const wHead = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.028, 0.14, 10),
        new THREE.MeshLambertMaterial({ color: 0x3a3c30 }));
      wHead.rotation.x = Math.PI / 2; wHead.position.set(X, Y, -0.53); g.add(wHead);
      // Piezo contact fuze tip (cone)
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.012, 0.038, 8),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      tip.rotation.x = Math.PI / 2; tip.position.set(X, Y, -0.64); g.add(tip);
      // Tandem warhead seam ring
      g.add(_P(_T(0.030, 0.006, _pal.steel(), 10), X, Y, -0.47));
      // Backblast cone (rear counterblast vent, open funnel)
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.042, 0.065, 10),
        new THREE.MeshLambertMaterial({ color: _pal.tan() }));
      cone.rotation.x = -Math.PI / 2; cone.position.set(X, Y, 0.035); g.add(cone);
      // Pistol grip
      g.add(_P(_B(0.022, 0.062, 0.028, _pal.blk()), X, Y - 0.048, -0.06));
      // Trigger guard
      const tg = new THREE.Mesh(
        new THREE.TorusGeometry(0.014, 0.003, 5, 10, Math.PI),
        new THREE.MeshLambertMaterial({ color: _pal.blk() }));
      tg.rotation.x = Math.PI / 2; tg.position.set(X, Y - 0.052, -0.06); g.add(tg);
      // Shoulder rest pad (folding, rear of tube)
      g.add(_P(_B(0.050, 0.018, 0.040, 0x4a4c40), X, Y + 0.002, 0.10));
      return g;
    },

    // ── HK G36C (5.56mm NATO carbine, German aid to Ukraine) ─────────
    g36c: function () {
      return _rifle({ hg: 'rail', hgColor: _pal.poly, stock: 'skel', mag: 'curved',
        magColor: _pal.olive, muzzle: 'flash', recvLen: 0.19, recvH: 0.044, barLen: 0.09,
        barR: 0.010, recvColor: _pal.poly });
    },

    // ── 2B9 Vasilek (82mm automatic mortar, 4-round clip) ────────────
    vasilek: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.08;
      // Main barrel (smooth-bore, long)
      g.add(_P(_T(0.022, 0.68, _pal.steel(), 10), X, Y + 0.04, -0.30));
      // Breech block (boxy, bottom-load)
      g.add(_P(_B(0.056, 0.058, 0.10, 0x3a3c38), X, Y, -0.02));
      // 4-round clip feed from right side
      for (let r = 0; r < 4; r++) {
        const round = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.014, 0.092, 8),
          new THREE.MeshLambertMaterial({ color: 0x8a7c40 }));
        round.rotation.x = Math.PI / 2;
        round.position.set(X + 0.034 - r * 0.024, Y + 0.004, 0.02 - r * 0.005); g.add(round);
      }
      // Clip carrier frame
      g.add(_P(_B(0.008, 0.018, 0.092, _pal.steel()), X + 0.040, Y + 0.004, 0.02));
      // Bipod legs (spread V)
      const bpL = _P(_B(0.006, 0.068, 0.007, _pal.steel()), X + 0.022, Y - 0.040, -0.48);
      bpL.rotation.z = -0.30; g.add(bpL);
      const bpR = _P(_B(0.006, 0.068, 0.007, _pal.steel()), X - 0.022, Y - 0.040, -0.48);
      bpR.rotation.z = 0.30; g.add(bpR);
      // Wheel carriage axle (distinctive — can be towed)
      g.add(_P(_T(0.006, 0.18, _pal.steel(), 6), X, Y - 0.048, 0.06));
      const wL = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.006, 6, 12),
        new THREE.MeshLambertMaterial({ color: _pal.blk() }));
      wL.rotation.y = Math.PI / 2; wL.position.set(X + 0.090, Y - 0.048, 0.06); g.add(wL);
      const wR = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.006, 6, 12),
        new THREE.MeshLambertMaterial({ color: _pal.blk() }));
      wR.rotation.y = Math.PI / 2; wR.position.set(X - 0.090, Y - 0.048, 0.06); g.add(wR);
      // Muzzle opening indicator
      g.add(_P(_T(0.025, 0.005, _pal.blk(), 10), X, Y + 0.04, -0.655));
      return g;
    },

    // ── AK-74M (Russia's standard 5.45mm service rifle) ──────────────
    ak74m: function () {
      return _rifle({ hg: 'wood', hgColor: _pal.poly, stock: 'skel', mag: 'curved',
        magColor: _pal.poly, muzzle: 'brake', recvLen: 0.22, barLen: 0.16,
        barR: 0.009, recvColor: _pal.gm });
    },

    // ── Switchblade 600 (anti-armor loitering munition) ──────────────
    switchblade600: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.09;
      // Launch tube (larger than SB300 — stores the whole drone)
      g.add(_P(_T(0.038, 0.52, _pal.olive(), 10), X, Y, -0.22));
      // Tube end cap (sealed before launch)
      g.add(_P(_T(0.040, 0.010, _pal.blk(), 10), X, Y, -0.49));
      // Carry handle / grip rail
      g.add(_P(_B(0.012, 0.022, 0.10, _pal.blk()), X, Y + 0.038, -0.18));
      // Folded wing nubs visible through vents (2 each side)
      g.add(_P(_B(0.042, 0.006, 0.018, _pal.blk()), X, Y, -0.12));
      g.add(_P(_B(0.042, 0.006, 0.018, _pal.blk()), X, Y, -0.30));
      // Launch trigger assembly (rear grip)
      g.add(_P(_B(0.022, 0.055, 0.028, _pal.blk()), X, Y - 0.042, 0.04));
      const tg = new THREE.Mesh(
        new THREE.TorusGeometry(0.012, 0.003, 5, 10, Math.PI),
        new THREE.MeshLambertMaterial({ color: _pal.blk() }));
      tg.rotation.x = Math.PI / 2; tg.position.set(X, Y - 0.048, 0.04); g.add(tg);
      // Shoulder brace (folding, rear)
      g.add(_P(_B(0.048, 0.014, 0.030, _pal.gm()), X, Y + 0.002, 0.10));
      // Status LED strip
      g.add(_P(_B(0.006, 0.004, 0.060, 0x002200), X + 0.020, Y + 0.012, -0.22));
      return g;
    },

    // ── PzH 2000 (155mm self-propelled howitzer) ──────────────────────
    pzh2000: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.15, Y = -0.08;
      // Turret body (large boxy superstructure)
      g.add(_P(_B(0.10, 0.065, 0.12, _pal.olive()), X, Y, -0.02));
      // Barrel — long 155mm/L52 (very long for howitzer)
      g.add(_P(_T(0.020, 0.80, _pal.steel(), 10), X, Y + 0.014, -0.46));
      // Muzzle brake (double-baffle, prominent)
      g.add(_P(_B(0.042, 0.028, 0.042, _pal.steel()), X, Y + 0.014, -0.87));
      g.add(_P(_T(0.023, 0.006, _pal.blk(), 10), X, Y + 0.014, -0.91));
      // Autoloader hump on rear of turret
      g.add(_P(_B(0.068, 0.048, 0.060, _pal.olive()), X, Y + 0.030, 0.08));
      // Hatch rings on top (commander + loader)
      const hA = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 5, 12),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      hA.position.set(X - 0.020, Y + 0.048, -0.01); g.add(hA);
      const hB = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 5, 12),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      hB.position.set(X + 0.020, Y + 0.048, 0.04); g.add(hB);
      // Gun shield / mantlet
      g.add(_P(_B(0.062, 0.058, 0.018, _pal.gm()), X, Y + 0.014, -0.08));
      // Side grab handle
      g.add(_P(_B(0.006, 0.006, 0.040, _pal.steel()), X + 0.056, Y + 0.010, -0.05));
      return g;
    },

    // ── Kh-101 cruise missile (Russian air-launched) ──────────────────
    kh101: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.07;
      // Main body (long, narrow, stealthy faceted airframe)
      g.add(_P(_T(0.022, 0.76, _pal.gm(), 8), X, Y, -0.32));
      // Slightly wider centre section (warhead section)
      g.add(_P(_T(0.028, 0.22, _pal.gm(), 8), X, Y, -0.16));
      // Nose cone (pointed, composite)
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.022, 0.09, 8),
        new THREE.MeshLambertMaterial({ color: _pal.blk() }));
      nose.rotation.x = Math.PI / 2; nose.position.set(X, Y, -0.74); g.add(nose);
      // Folded pop-out wings (2 mid-body, swept)
      const wL = _P(_B(0.12, 0.004, 0.050, _pal.gm()), X + 0.062, Y, -0.25);
      wL.rotation.z = -0.10; g.add(wL);
      const wR = _P(_B(0.12, 0.004, 0.050, _pal.gm()), X - 0.062, Y, -0.25);
      wR.rotation.z = 0.10; g.add(wR);
      // Tail fins (cruciform, 4 × small)
      const finAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
      for (var fi = 0; fi < 4; fi++) {
        const fin = _P(_B(0.040, 0.004, 0.028, _pal.steel()), X, Y, 0.06);
        fin.rotation.z = finAngles[fi]; fin.position.x += Math.cos(finAngles[fi]) * 0.026;
        fin.position.y += Math.sin(finAngles[fi]) * 0.026; g.add(fin);
      }
      // Turbojet intake (bottom, rectangular)
      g.add(_P(_B(0.022, 0.014, 0.020, _pal.blk()), X, Y - 0.030, -0.10));
      // Engine nozzle (rear)
      g.add(_P(_T(0.014, 0.018, 0x441a00, 8), X, Y, 0.13));
      return g;
    },

    // ── B-10 Recoilless Rifle (82mm, Soviet 1954) ────────────────────
    b10: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.08;
      // Smooth-bore barrel
      g.add(_P(_T(0.022, 0.72, _pal.steel(), 10), X, Y, -0.30));
      // Breech body (large boxy block — horizontal sliding breech)
      g.add(_P(_B(0.062, 0.052, 0.12, 0x3c3e3a), X, Y, 0.04));
      // Counterblast venturi (rear cone — prominent feature of RCL rifles)
      const venL = new THREE.Mesh(
        new THREE.ConeGeometry(0.036, 0.09, 10),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      venL.rotation.x = -Math.PI / 2; venL.position.set(X, Y, 0.13); g.add(venL);
      // Carrying handles (two, top-mounted)
      const hA = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 5, 10, Math.PI),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      hA.position.set(X, Y + 0.024, -0.10); g.add(hA);
      const hB = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 5, 10, Math.PI),
        new THREE.MeshLambertMaterial({ color: _pal.steel() }));
      hB.position.set(X, Y + 0.024, -0.35); g.add(hB);
      // Bipod
      const bpA = _P(_B(0.006, 0.072, 0.007, _pal.steel()), X + 0.024, Y - 0.040, -0.48);
      bpA.rotation.z = -0.28; g.add(bpA);
      const bpB = _P(_B(0.006, 0.072, 0.007, _pal.steel()), X - 0.024, Y - 0.040, -0.48);
      bpB.rotation.z = 0.28; g.add(bpB);
      // Rear sighting assembly (telescopic sight mount)
      g.add(_P(_B(0.015, 0.048, 0.015, 0x282a28), X + 0.038, Y + 0.010, -0.02));
      // Muzzle face
      g.add(_P(_T(0.025, 0.006, _pal.blk(), 10), X, Y, -0.665));
      return g;
    },

    // ── CAESAR 155mm SPH (French wheeled howitzer) ───────────────────
    caesar155: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.07;
      // Truck cab (boxy, olive)
      g.add(_P(_B(0.055, 0.040, 0.055, _pal.olive()), X, Y + 0.012, 0.04));
      // Windscreen (dark glass strip)
      g.add(_P(_B(0.054, 0.016, 0.005, _pal.blk()), X, Y + 0.036, 0.012));
      // Gun platform (wider mounting deck behind cab)
      g.add(_P(_B(0.060, 0.012, 0.090, _pal.gm()), X, Y - 0.004, -0.06));
      // Main 155mm barrel (long, L52)
      g.add(_P(_T(0.014, 0.62, _pal.steel(), 10), X, Y + 0.016, -0.38));
      // Muzzle brake (double baffle)
      g.add(_P(_B(0.028, 0.022, 0.022, _pal.steel()), X, Y + 0.016, -0.68));
      g.add(_P(_B(0.028, 0.022, 0.010, _pal.steel()), X, Y + 0.016, -0.64));
      // Breech block (boxy, rear of barrel)
      g.add(_P(_B(0.030, 0.030, 0.055, _pal.gm()), X, Y + 0.016, 0.00));
      // Equilibrators (two cylinders each side of barrel)
      g.add(_P(_T(0.008, 0.08, _pal.steel(), 8), X + 0.022, Y + 0.006, -0.10));
      g.add(_P(_T(0.008, 0.08, _pal.steel(), 8), X - 0.022, Y + 0.006, -0.10));
      // Wheels (4 visible — front pair and rear pair)
      const wMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const wGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.010, 10);
      for (var wi = 0; wi < 2; wi++) {
        const wz = wi === 0 ? 0.060 : -0.040;
        const wF = new THREE.Mesh(wGeo, wMat); wF.rotation.z = Math.PI/2; wF.position.set(X + 0.036, Y - 0.026, wz); g.add(wF);
        const wR = new THREE.Mesh(wGeo, wMat); wR.rotation.z = Math.PI/2; wR.position.set(X - 0.036, Y - 0.026, wz); g.add(wR);
      }
      // Hydraulic jack (deployed stabiliser leg)
      g.add(_P(_B(0.006, 0.040, 0.006, _pal.steel()), X + 0.038, Y - 0.030, -0.065));
      // French flag decal (small tri-colour on cab side — just coloured blocks)
      g.add(_P(_B(0.003, 0.010, 0.018, 0x002395), X + 0.029, Y + 0.012, 0.040));
      g.add(_P(_B(0.003, 0.010, 0.006, 0xffffff), X + 0.029, Y + 0.012, 0.052));
      g.add(_P(_B(0.003, 0.010, 0.006, 0xed2939), X + 0.029, Y + 0.012, 0.058));
      return g;
    },

    // ── Brimstone 2 missile (UK dual-mode precision) ─────────────────
    brimstone2: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.08;
      // Main body (slim, shorter than Kh-101)
      g.add(_P(_T(0.016, 0.44, _pal.gm(), 8), X, Y, -0.16));
      // Wider mid-section (warhead)
      g.add(_P(_T(0.020, 0.12, _pal.gm(), 8), X, Y, -0.08));
      // Nose cone (flat-faceted seeker head)
      g.add(_P(_T(0.016, 0.055, 0x282828, 8), X, Y, -0.40));
      // Seeker dome (mmW radar — darker tip)
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
      dome.rotation.x = Math.PI / 2; dome.position.set(X, Y, -0.44); g.add(dome);
      // Pop-out wings (2 pairs — mid-body and tail)
      for (var wi = 0; wi < 2; wi++) {
        const wz = wi === 0 ? -0.14 : 0.10;
        const wL = _P(_B(0.070, 0.004, 0.032, _pal.gm()), X + 0.037, Y, wz); wL.rotation.z = -0.08; g.add(wL);
        const wR = _P(_B(0.070, 0.004, 0.032, _pal.gm()), X - 0.037, Y, wz); wR.rotation.z = 0.08; g.add(wR);
      }
      // Tail fins (4 × cruciform control fins)
      const finAngles = [0, Math.PI/2, Math.PI, -Math.PI/2];
      for (var fi = 0; fi < 4; fi++) {
        const fin = _P(_B(0.028, 0.003, 0.022, _pal.steel()), X, Y, 0.14);
        fin.rotation.z = finAngles[fi];
        fin.position.x += Math.cos(finAngles[fi]) * 0.020;
        fin.position.y += Math.sin(finAngles[fi]) * 0.020;
        g.add(fin);
      }
      // Rocket motor nozzle
      g.add(_P(_T(0.010, 0.014, _pal.blk(), 8), X, Y, 0.22));
      return g;
    },

    // ── IRIS-T SLM launcher (German SAM system) ──────────────────────
    iristslm: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.07;
      // Launch vehicle body (boxy TRAKKER truck hull)
      g.add(_P(_B(0.050, 0.032, 0.075, _pal.olive()), X, Y, -0.02));
      // Cab front
      g.add(_P(_B(0.046, 0.028, 0.030, _pal.gm()), X, Y + 0.006, 0.055));
      // Missile launcher module (raised rectangular box on back)
      g.add(_P(_B(0.046, 0.024, 0.060, _pal.gm()), X, Y + 0.032, -0.025));
      // 4 × launch tubes (quad-pack visible ends)
      const tubeMat = new THREE.MeshLambertMaterial({ color: 0x2a2c2a });
      for (var ti = 0; ti < 4; ti++) {
        const tx = X + (ti % 2 === 0 ? 0.011 : -0.011);
        const ty = Y + 0.038 + (ti < 2 ? 0.010 : -0.002);
        g.add(_P(_T(0.010, 0.065, tubeMat, 6), tx, ty, -0.024));
      }
      // Radar mast (folded down — boxy radar antenna at top)
      g.add(_P(_B(0.006, 0.045, 0.006, _pal.steel()), X, Y + 0.058, 0.015));
      g.add(_P(_B(0.022, 0.006, 0.018, _pal.gm()), X, Y + 0.082, 0.015));
      // Truck wheels
      const wMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const wGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.008, 10);
      for (var wi = 0; wi < 2; wi++) {
        const wz = wi === 0 ? 0.048 : -0.040;
        const wF = new THREE.Mesh(wGeo, wMat); wF.rotation.z = Math.PI/2; wF.position.set(X + 0.032, Y - 0.022, wz); g.add(wF);
        const wR = new THREE.Mesh(wGeo, wMat); wR.rotation.z = Math.PI/2; wR.position.set(X - 0.032, Y - 0.022, wz); g.add(wR);
      }
      return g;
    },

    // ── MGM-140 ATACMS ballistic missile ─────────────────────────────
    atacms: function () {
      const g = new THREE.Group(); g.userData.selfContained = true;
      const X = 0.16, Y = -0.07;
      // Main body (chunky ballistic missile — wider than cruise missiles)
      g.add(_P(_T(0.030, 0.72, _pal.gm(), 10), X, Y, -0.26));
      // Wider warhead section (front third)
      g.add(_P(_T(0.034, 0.28, _pal.gm(), 10), X, Y, -0.44));
      // Ogive nose (conical — ATACMS has blunt ogive)
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.034, 0.10, 10),
        new THREE.MeshLambertMaterial({ color: _pal.gm() }));
      nose.rotation.x = Math.PI / 2; nose.position.set(X, Y, -0.62); g.add(nose);
      // Nose tip (guidance section — darker)
      g.add(_P(_T(0.012, 0.030, _pal.blk(), 8), X, Y, -0.68));
      // 4 × large wrap-around fins (distinctive ATACMS feature)
      const finMat = new THREE.MeshLambertMaterial({ color: _pal.gm() });
      for (var fi = 0; fi < 4; fi++) {
        const ang = (fi / 4) * Math.PI * 2;
        const fin = _P(_B(0.055, 0.004, 0.070, finMat), X, Y, 0.07);
        fin.rotation.z = ang;
        fin.position.x += Math.cos(ang) * 0.032;
        fin.position.y += Math.sin(ang) * 0.032;
        g.add(fin);
      }
      // Rocket motor (wide nozzle at rear)
      g.add(_P(_T(0.022, 0.022, 0x3a1800, 10), X, Y, 0.15));
      // Aft skirt (aerodynamic boat-tail)
      g.add(_P(_T(0.026, 0.055, _pal.blk(), 10), X, Y, 0.10));
      // Stencilled serial number band (two black rings)
      g.add(_P(_T(0.031, 0.008, _pal.blk(), 10), X, Y, -0.10));
      g.add(_P(_T(0.031, 0.008, _pal.blk(), 10), X, Y, 0.02));
      return g;
    },

  };

  const meshBuilders = [
    buildGatlingMesh, buildShovelMesh, NB.makarov, NB.ak, NB.rpk,
    NB.svd, NB.pkm, NB.nlaw, NB.stugna, NB.m4,
    NB.javelin, NB.rpg7, NB.igla, NB.gp25,
    NB.scarh, NB.dshk, buildMolotovMesh,
    NB.mg3, NB.mp5, NB.barrett, buildMinigunMesh,
    NB.crossbow, NB.shmel, NB.izh43,
    buildClaymoreMesh, buildSmokeMesh, buildFlashbangMesh,
    NB.ak12, NB.p90, NB.at4, NB.glock,
    NB.ks23, NB.ags17, NB.vss, NB.stinger,
    buildThrowKnifeMesh, buildC4Mesh, NB.dronejammer, buildAxeMesh,
    // 5 Ukraine-war additions
    NB.aks74u, NB.m72law, NB.panzerfaust3, NB.nsvhmg, NB.fort500,
    // 3 more Ukraine-conflict weapons
    NB.malyuk, NB.carlgustaf, NB.m240b,
    // 3 new additions (PKP Pecheneg, SPG-9, HK416)
    NB.pkpecheneg, NB.spg9, NB.hk416,
    // 6 more authentic war weapons
    NB.rgd5, NB.spike_lr, NB.milan, NB.mp7, NB.kord, NB.browning_m2,
    // 5 new war weapons (ZU-23-2, FPV drone, Kornet, RPG-26, HIMARS)
    NB.zu23_2, NB.fpv_drone, NB.kornet, NB.rpg26, NB.himars,
    // 4 more (F-1 grenade, Maxim M1910, BM-21 Grad, Tavor X95)
    NB.f1_grenade, NB.maxim1910, NB.bm21_grad, NB.tavor_x95,
    // 4 more (TOW BGM-71, RPG-29, Starstreak, AKM)
    NB.tow_bgm71, NB.rpg29, NB.starstreak, NB.akm,
    // 4 more (AN-94, M67, Switchblade 300, Saiga-12)
    NB.an94, NB.m67_grenade, NB.switchblade300, NB.saiga12,
    // 4 more (RPG-18, Podnos 82mm mortar, OTs-14 Groza, PP-19 Bizon)
    NB.rpg18, NB.podnos82, NB.ots14, NB.pp19,
    // 4 more (FAB-500 glide bomb, M777 howitzer, Strela-2, commercial drop drone)
    NB.fab500, NB.m777, NB.strela2, NB.dropdrone,
    // 4 more (Bayraktar TB2, TOS-1A, DP-27, SV-98)
    NB.bayraktar, NB.tos1a, NB.dp27, NB.sv98,
    // 4 more (Lancet-3, Storm Shadow, AS Val, OSV-96)
    NB.lancet3, NB.stormshadow, NB.asval, NB.osv96,
    // 4 more (Neptune R-360, Metis-M1 ATGM, M249 SAW, RPG-30)
    NB.neptune, NB.metis_m1, NB.m249saw, NB.rpg30,
    // 4 more (Shahed-136, AGM-88 HARM, RGO-78 grenade, Gepard 35mm)
    NB.shahed136, NB.agm88harm, NB.rgo78, NB.gepard35,
    // 4 more (PTRD-41, Konkurs ATGM, M32A1 MGL, PPSh-41)
    NB.ptrd41, NB.konkurs, NB.m32mgl, NB.ppsh41,
    // 4 more (AI AXMC, Malyutka Sagger, Verba MANPADS, RGN-86)
    NB.aiax, NB.malyutka, NB.verba, NB.rgn86,
    // 4 more (RPG-32 Hashim, HK G36C, 2B9 Vasilek auto-mortar, B-10 RCL)
    NB.rpg32, NB.g36c, NB.vasilek, NB.b10,
    // 4 more (AK-74M, Switchblade 600, PzH 2000, Kh-101)
    NB.ak74m, NB.switchblade600, NB.pzh2000, NB.kh101,
    // 4 more (CAESAR 155mm, Brimstone 2, IRIS-T SLM, ATACMS)
    NB.caesar155, NB.brimstone2, NB.iristslm, NB.atacms,
  ];

  // Ensure meshBuilders matches WEAPONS length
  while (meshBuilders.length < WEAPONS.length) {
    meshBuilders.push(buildPlaceholderMesh);
  }

  function createGunMesh(camera) {
    _camera = camera;
    for (let i = 0; i < WEAPONS.length; i++) {
      const m = meshBuilders[i]();
      // Enhance with reflective materials, sub-details, and animation rigging
      if (typeof WeaponDetails !== 'undefined' && WeaponDetails.enhanceMesh) {
        WeaponDetails.enhanceMesh(m, WEAPONS[i], i);
      }
      // Universal barrel-rounding: convert square, axis-aligned, thin-and-long
      // box meshes (barrels, gas tubes, cleaning rods) into cylinders so guns
      // read as real round-barreled weapons instead of square bars.
      try { _roundifyBarrels(m); } catch (e) {}
      // Universal weapon-detail pass — DISABLED by default. It scattered random
      // micro-meshes using an inflated bounding box, flinging tiny boxes off the
      // weapon (visible as floating debris, esp. on pistols/SMGs). The base mesh
      // builders are already richly detailed, so this pass cost more than it gave.
      // Re-enable per-session with window.__enableAutoDetail = true if ever fixed.
      if (typeof window !== 'undefined' && window.__enableAutoDetail) { try { WD.autoDetail(m, WEAPONS[i]); } catch (e) {} }
      // Weld visual gaps so parts don't look detached / floating in air
      if (!(typeof window !== 'undefined' && window.__noUnify)) { try { _unifyWeaponMesh(m); } catch (e) {} }
      // FINAL reflectivity pass — autoDetail/unify added micro-meshes AFTER the
      // first material upgrade, leaving them flat. Re-run so every gun part is
      // reflective PBR (skips glass/emissive/already-PBR internally).
      try { if (typeof WeaponDetails !== 'undefined' && WeaponDetails.upgradeMaterials) WeaponDetails.upgradeMaterials(m); } catch (e) {}
      // Apply equipped skin (if any) to the freshly built mesh
      try { if (weaponSkins[i]) applySkinToMesh(m, weaponSkins[i]); } catch (e) {}
      // Scale down viewmodels so they don't occlude viewport (issue #15)
      var _wepScale = 0.62;
      if (WEAPONS[i].type === 'PISTOL') _wepScale = 0.55;
      else if (['LMG','HMG','HMG_HEAVY','MACHINEGUN','MINIGUN'].indexOf(WEAPONS[i].type) >= 0) _wepScale = 0.52;
      m.scale.set(_wepScale, _wepScale, _wepScale);
      // Compute per-weapon muzzle flash offset from mesh bounds so flash aligns with barrel
      try {
        const bbox = new THREE.Box3().setFromObject(m);
        const cx = (bbox.min.x + bbox.max.x) * 0.5;
        const by = bbox.min.y;
        const fz = bbox.min.z;
        m.userData.muzzlePos = new THREE.Vector3(cx, by + 0.02, fz - 0.02);
      } catch (e) {}
      gunMeshes.push(m);
      m.visible = (i === currentIdx);
      camera.add(m);
    }
  }

  // Universal barrel-rounding pass. Walks the weapon and converts any square,
  // axis-aligned, thin-and-long BoxGeometry (barrels, gas tubes, cleaning rods)
  // into a matching cylinder so guns stop looking like they have square barrels.
  // Conservative filters keep flat parts (rails, flutes), wide parts (handguards,
  // receivers, stocks) and pre-rotated parts untouched.
  function _roundifyBarrels(g) {
    if (!g) return;
    g.traverse(function (o) {
      if (!o.isMesh || !o.geometry || o.geometry.type !== 'BoxGeometry') return;
      const p = o.geometry.parameters;
      if (!p || p.width == null || p.height == null || p.depth == null) return;
      const w = p.width, h = p.height, d = p.depth;
      const cross = Math.max(w, h);
      // square-ish cross-section, thin, at least 4x longer than wide
      if (cross > 0.026) return;
      if (Math.abs(w - h) > 0.006) return;
      if (d < cross * 4) return;
      // only axis-aligned boxes (long axis is local Z); skip anything rotated
      if (Math.abs(o.rotation.x) > 0.02 || Math.abs(o.rotation.y) > 0.02 || Math.abs(o.rotation.z) > 0.02) return;
      const r = cross * 0.5;
      const cyl = new THREE.CylinderGeometry(r, r, d, 12);
      cyl.rotateX(Math.PI / 2); // align cylinder's Y axis with the box's long Z axis
      if (o.geometry.dispose) o.geometry.dispose();
      o.geometry = cyl;
    });
  }

  // Post-process a built weapon mesh: detect children that are visually orphaned
  // from the dominant cluster (large gap in space) and add thin dark connector
  // strips so the weapon reads as a single contiguous object.
  function _unifyWeaponMesh(g) {
    if (!g || !g.children || g.children.length < 2) return;
    // Snapshot direct children only (some builders nest scopes/sub-groups)
    const kids = [];
    for (let i = 0; i < g.children.length; i++) {
      const c = g.children[i];
      if (!c || c.userData && c.userData._unifyConnector) continue;
      kids.push(c);
    }
    if (kids.length < 2) return;
    // Compute per-child world-equivalent (here local) bounding boxes
    const bboxes = [];
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i];
      try {
        const b = new THREE.Box3().setFromObject(c);
        if (!b.isEmpty()) bboxes.push({ obj: c, box: b, center: b.getCenter(new THREE.Vector3()) });
      } catch (e) {}
    }
    if (bboxes.length < 2) return;
    // Overall bbox
    const overall = new THREE.Box3();
    for (let i = 0; i < bboxes.length; i++) overall.union(bboxes[i].box);
    const size = overall.getSize(new THREE.Vector3());
    const longLen = Math.max(size.x, size.y, size.z);
    if (longLen <= 0) return;
    // Gap threshold: parts farther than 5% of longest side from any other
    // along the firing axis (Z is forward in this engine; X is gun-right).
    const gapTol = longLen * 0.05;
    const connMat = new THREE.MeshLambertMaterial({ color: 0x1d1d20 });
    const added = [];
    // For each child, find nearest neighbour. If gap > tol, drop a thin
    // connector box that bridges the two centroids.
    for (let i = 0; i < bboxes.length; i++) {
      const a = bboxes[i];
      let nearest = null, nearestDist = Infinity;
      for (let j = 0; j < bboxes.length; j++) {
        if (i === j) continue;
        const b = bboxes[j];
        // Distance between bbox surfaces along Z (the long gun axis)
        const dz = Math.max(0,
          Math.max(a.box.min.z, b.box.min.z) - Math.min(a.box.max.z, b.box.max.z));
        const dx = Math.max(0,
          Math.max(a.box.min.x, b.box.min.x) - Math.min(a.box.max.x, b.box.max.x));
        const dy = Math.max(0,
          Math.max(a.box.min.y, b.box.min.y) - Math.min(a.box.max.y, b.box.max.y));
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < nearestDist) { nearestDist = dist; nearest = b; }
      }
      if (!nearest || nearestDist <= gapTol) continue;
      // Build a thin connector from a.center to nearest.center
      const start = a.center, end = nearest.center;
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const span = new THREE.Vector3().subVectors(end, start);
      const len = span.length();
      if (len <= 0) continue;
      const thick = Math.max(0.006, longLen * 0.012);
      const geo = new THREE.BoxGeometry(thick, thick, len);
      const conn = new THREE.Mesh(geo, connMat);
      conn.position.copy(mid);
      // Orient connector along the span
      conn.lookAt(end);
      conn.userData._unifyConnector = true;
      added.push(conn);
    }
    for (let i = 0; i < added.length; i++) g.add(added[i]);
  }


  // ── Muzzle flash ──────────────────────────────────────────
  let muzzleFlash = null;
  let muzzleTimer = 0;
  let _muzzleLight = null;
  let _weaponFlashlight = null;
  let _flashlightOn = false;
  // Lingering muzzle smoke puff (plane that fades + drifts up)
  let _muzzleSmoke = null;
  let _muzzleSmokeTimer = 0;
  const _MUZZLE_SMOKE_LIFE = 0.45;

  function createMuzzleFlash(scene, camera) {
    _scene = scene;
    _camera = camera;
    // Initialize weapon details visual system
    if (typeof WeaponDetails !== 'undefined' && WeaponDetails.init) {
      WeaponDetails.init(scene, camera);
    }
    // Muzzle flash: compact footprint (30% of original size)
    const geo = new THREE.PlaneGeometry(0.03, 0.048);
    const mat = new THREE.MeshBasicMaterial({
      color:       0xffdd44,
      transparent: true,
      opacity:     0,
      depthTest:   false,
      blending:    THREE.AdditiveBlending,
    });
    muzzleFlash = new THREE.Mesh(geo, mat);
    muzzleFlash.position.set(0.17, -0.11, -0.62);
    camera.add(muzzleFlash);
    // Align muzzle flash to current weapon barrel if bounds already computed
    if (gunMeshes[currentIdx] && gunMeshes[currentIdx].userData.muzzlePos) {
      muzzleFlash.position.copy(gunMeshes[currentIdx].userData.muzzlePos);
    }

    // Dynamic point light for muzzle flash illumination
    _muzzleLight = new THREE.PointLight(0xff8833, 0, 8);
    _muzzleLight.position.set(0, -0.05, -0.7);
    camera.add(_muzzleLight);

    // Weapon tactical flashlight (spotlight attached to camera)
    _weaponFlashlight = new THREE.SpotLight(0xffffee, 0, 35, Math.PI / 5, 0.6, 1.5);
    _weaponFlashlight.position.set(0, -0.08, -0.3);
    _weaponFlashlight.target.position.set(0, -0.08, -10);
    camera.add(_weaponFlashlight);
    camera.add(_weaponFlashlight.target);
    _flashlightOn = true;

    // Lingering smoke puff plane (additive grey, faces camera)
    var smokeGeo = new THREE.PlaneGeometry(0.18, 0.18);
    var smokeMat = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa, transparent: true, opacity: 0,
      depthTest: false, depthWrite: false,
      blending: THREE.NormalBlending,
    });
    _muzzleSmoke = new THREE.Mesh(smokeGeo, smokeMat);
    _muzzleSmoke.position.set(0.17, -0.10, -0.60);
    _muzzleSmoke.visible = false;
    camera.add(_muzzleSmoke);

    scene.add(camera);
  }

  function showMuzzle() {
    if (!muzzleFlash) return;
    // 67% smaller muzzle flash per design feedback (was covering too much view).
    var _MF_SCALE = 0.33;
    var _mfm = getMuzzleFlashMult(currentIdx);
    if (_mfm == null || isNaN(_mfm)) _mfm = 1; // guard: most weapons leave muzzleFlashMult undefined
    muzzleFlash.material.opacity = Math.min(1, _mfm);
    muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
    muzzleFlash.scale.setScalar(_mfm * _MF_SCALE);
    muzzleTimer = 0.10;
    // Flash point light burst (also dimmed so the glare doesn't wash the screen)
    if (_muzzleLight) _muzzleLight.intensity = 2.5 * _mfm * 0.5;
    // Trigger lingering smoke puff (smaller too)
    if (_muzzleSmoke) {
      _muzzleSmoke.visible = true;
      _muzzleSmoke.material.opacity = 0.45;
      _muzzleSmoke.position.set(
        0.17 + (Math.random() - 0.5) * 0.02,
        -0.10,
        -0.60 + (Math.random() - 0.5) * 0.02
      );
      _muzzleSmoke.rotation.z = Math.random() * Math.PI * 2;
      _muzzleSmoke.scale.setScalar((0.6 + Math.random() * 0.2) * 0.5);
      _muzzleSmokeTimer = _MUZZLE_SMOKE_LIFE;
    }
    // Shell casing eject for hitscan/shotgun weapons
    if (_camera && typeof Tracers !== 'undefined' && Tracers.spawnCasing) {
      Tracers.spawnCasing(_camera);
    }
    // Scare birds nearby — chaotic flock scatter on every shot
    try {
      if (window.Birds && window.Birds.scareNear && _camera) {
        window.Birds.scareNear(_camera.position, 40);
      }
    } catch (eSB) {}
  }

  // ── Recoil / reload animation state ───────────────────────
  let _lastDryHint = 0; // throttle for the out-of-ammo hint toast
  let recoilOffset = 0;
  let recoilOffsetY = 0;
  let recoilOffsetZ = 0;
  let _chSpread = 0;
  let switchAnimTimer = 0;  // weapon switch bob animation
  const SWITCH_ANIM_DUR_DEFAULT = 0.22;
  const SWITCH_SPEED_BY_TYPE = {
    MELEE: 0.12, PISTOL: 0.16, SMG: 0.20, SILENT: 0.20, JAMMER: 0.22,
    ASSAULT: 0.24, NATO: 0.24, SHOTGUN: 0.24,
    SNIPER: 0.35, AMR: 0.35,
    LMG: 0.40, HMG: 0.40, MACHINEGUN: 0.40, NATO_HEAVY: 0.35, HMG_HEAVY: 0.45,
    AT: 0.45, ATGM: 0.45, AT_HEAVY: 0.50, AT_LIGHT: 0.40, AA: 0.45,
    MINIGUN: 0.55, THERMOBARIC: 0.50,
    GRENADE: 0.18, SMOKE: 0.18, FLASHBANG: 0.18, MINE: 0.20,
    INCENDIARY: 0.22, EXPLOSIVE: 0.30
  };
  function getSwitchDur() {
    var w = cur();
    return SWITCH_SPEED_BY_TYPE[w.type] || SWITCH_ANIM_DUR_DEFAULT;
  }
  let walkSwayTime = 0;    // weapon walk sway accumulator
  let _playerSpeed = 0;    // fed from game-manager
  let _sprintLowerY = 0;     // current sprint lower offset (lerped)
  let _sprintLowerRotX = 0;  // current sprint tilt (lerped)
  let _sprintLowerZ = 0;     // current sprint forward offset (lerped)
  let _scopeSwayTime = 0;  // scope idle drift accumulator
  let _holdingBreath = false;
  let _inspectTimer = 0;   // weapon inspect animation timer
  const INSPECT_DUR = 1.8; // seconds for full inspect cycle
  let reloadAnimAngle = 0;

  // ── Recoil recovery (camera returns after spray) ──────────
  let _recoilPitchAccum = 0;
  let _recoilYawAccum = 0;
  let _lastFireTime = 0;
  const RECOIL_RECOVERY_DELAY = 0.12;
  const RECOIL_RECOVERY_RATE = 4;

  // ── Viewmodel inertia (mouse-look lag) ────────────────────
  let _prevYaw = 0;
  let _prevPitch = 0;
  let _inertiaX = 0;  // horizontal lag offset
  let _inertiaY = 0;  // vertical lag offset
  const INERTIA_MAX = 0.06;
  const INERTIA_WEIGHT = { PISTOL: 0.75, SMG: 0.7, ASSAULT: 0.6, NATO: 0.6, SILENT: 0.65, JAMMER: 0.6,
    SHOTGUN: 0.55, SNIPER: 0.45, AMR: 0.4, LMG: 0.35, HMG: 0.3, MACHINEGUN: 0.35,
    MINIGUN: 0.25, AT: 0.35, ATGM: 0.35, MELEE: 0.85, GRENADE: 0.8 };

  // ── Viewmodel fire kick rotation ──────────────────────────
  let _fireKickRot = 0;   // upward barrel kick (radians)
  let _fireKickZ = 0;     // backward snap offset

  // ── Smooth ADS transition ─────────────────────────────────
  let _adsLerp = 0;       // 0 = hip, 1 = fully zoomed
  let _adsTarget = 0;     // 0 or 1

  function applyLandingBob(intensity) {
    recoilOffsetY = -0.04 * intensity;
    recoilOffsetZ = -0.02 * intensity;
  }

  function applyRecoil() {
    const w = cur();
    if (!w.recoilY && !w.recoilX) return;
    const recoilMod = (typeof SkillSystem !== 'undefined' && typeof SkillSystem.getRecoilMod === 'function')
      ? SkillSystem.getRecoilMod() : 1.0;
    var appliedYaw = (Math.random() - 0.5) * w.recoilX * 2 * recoilMod;
    if (typeof CameraSystem !== 'undefined') {
      CameraSystem.setPitch(CameraSystem.getPitch() + w.recoilY * recoilMod);
      CameraSystem.setYaw(CameraSystem.getYaw() + appliedYaw);
    }
    // Track accumulated recoil for auto-recovery
    _recoilPitchAccum += w.recoilY * recoilMod;
    _recoilYawAccum += appliedYaw;
    _lastFireTime = performance.now() / 1000;
    // Scale visual kick with weapon recoil intensity
    const intensity = Math.min(1, (w.recoilY || 0) / 0.04);
    recoilOffsetZ = -0.02 - intensity * 0.04;
    recoilOffsetY = 0.01 + intensity * 0.02;
    // Viewmodel fire kick: barrel snaps up + backward
    _fireKickRot += (w.recoilY || 0.01) * 12;
    _fireKickZ -= intensity * 0.02;
    // Camera screen shake — adds visceral kick scaled to recoil intensity
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(0.004 + intensity * 0.012, 0.12 + intensity * 0.08);
    }
  }

  // ── Weapon switching ──────────────────────────────────────
  function switchTo(idx) {
    if (idx < 0 || idx >= WEAPONS.length) return;
    if (!unlocked[idx]) return;
    if (idx === currentIdx) return;
    if (zoomed) exitZoom();
    // Cancel reload on old weapon before switching
    var oldState = states[currentIdx];
    if (oldState && oldState.reloading) {
      oldState.reloading = false;
      oldState.reloadTimer = 0;
    }
    if (gunMeshes[currentIdx]) gunMeshes[currentIdx].visible = false;
    // Track weapon swap for CombatExtras quick-swap feature
    if (typeof CombatExtras !== 'undefined') {
      if (CombatExtras._trackWeaponSwap) CombatExtras._trackWeaponSwap(currentIdx);
      // Clear blind fire on weapon switch
      if (CombatExtras.isBlindFiring && CombatExtras.isBlindFiring()) CombatExtras.toggleBlindFire();
    }
    currentIdx = idx;
    if (gunMeshes[currentIdx]) gunMeshes[currentIdx].visible = !_holstered;
    // Align muzzle flash to new weapon barrel so flash doesn't float detached
    if (muzzleFlash && gunMeshes[currentIdx] && gunMeshes[currentIdx].userData.muzzlePos) {
      muzzleFlash.position.copy(gunMeshes[currentIdx].userData.muzzlePos);
    }
    recoilOffset = 0;
    recoilOffsetY = 0;
    recoilOffsetZ = 0;
    reloadAnimAngle = 0;
    switchAnimTimer = getSwitchDur(); // trigger bob-up animation (per-type speed)
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playWeaponSwitch) AudioSystem.playWeaponSwitch();
    const st = curState();
    HUD.setWeapon(cur().name, currentIdx);
    if (cur().type === 'MELEE') {
      HUD.setAmmo('∞', '—');
      if (HUD.showGrenadeSection) HUD.showGrenadeSection(true);
    } else {
      HUD.setAmmo(st.clip, st.reserve);
      if (HUD.showGrenadeSection) HUD.showGrenadeSection(!_isLauncherType(cur().type));
    }
    HUD.showReload(st.reloading);
  }

  // Holster (hide) the first-person weapon while the player is piloting a drone
  // or driving a vehicle — otherwise the gun (a camera child) floats in the
  // drone/vehicle view ("flying with a machine gun").
  var _holstered = false;
  function setHolstered(hidden) {
    hidden = !!hidden;
    if (_holstered === hidden) return;
    _holstered = hidden;
    if (gunMeshes[currentIdx]) gunMeshes[currentIdx].visible = !hidden;
    if (muzzleFlash) muzzleFlash.visible = !hidden;
    if (_muzzleSmoke && hidden) _muzzleSmoke.visible = false;
    if (typeof WeaponDetails !== 'undefined' && WeaponDetails.setHidden) {
      try { WeaponDetails.setHidden(hidden); } catch (e) {}
    }
  }
  function isHolstered() { return _holstered; }

  function switchNext() {
    const ids = [];
    for (let i = 0; i < WEAPONS.length; i++) { if (unlocked[i]) ids.push(i); }
    if (ids.length <= 1) return;
    const ci = ids.indexOf(currentIdx);
    switchTo(ids[(ci + 1) % ids.length]);
  }

  function switchPrev() {
    const ids = [];
    for (let i = 0; i < WEAPONS.length; i++) { if (unlocked[i]) ids.push(i); }
    if (ids.length <= 1) return;
    const ci = ids.indexOf(currentIdx);
    switchTo(ids[(ci - 1 + ids.length) % ids.length]);
  }

  function unlockWeapon(idx) {
    if (idx >= 0 && idx < WEAPONS.length) {
      unlocked[idx] = true;
      refreshWeaponHud();
    }
  }

  // ── Scope zoom ────────────────────────────────────────────
  function enterZoom() {
    if (!_camera) return;
    if (cur().type === 'MELEE') return; // no zoom on melee
    zoomed = true;
    _adsTarget = 1;
  }

  function exitZoom() {
    if (!_camera) return;
    zoomed = false;
    _adsTarget = 0;
  }

  function toggleFlashlight() {
    _flashlightOn = !_flashlightOn;
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(_flashlightOn ? '🔦 Flashlight ON' : '🔦 Flashlight OFF', _flashlightOn ? '#ffffaa' : '#888888');
    }
  }

  function handleRightDown() {
    rightMouseDown = true;
    enterZoom();
  }

  function handleRightUp() {
    rightMouseDown = false;
    if (zoomed) exitZoom();
  }

  // ── Projectile system (NLAW / Stugna) ────────────────────
  const projectiles = [];
  const PROJ_SPEED = 30;

  function spawnProjectile(camera, wep) {
    if (!_scene) return;
    const isGrenade = wep.type === 'GRENADE';
    const isMolotov = wep.type === 'INCENDIARY';
    const isSmoke = wep.type === 'SMOKE';
    const isFlash = wep.type === 'FLASHBANG';
    const projColor = isMolotov ? 0xff4400 : isGrenade ? 0x555544 : isSmoke ? 0x88aa88 : isFlash ? 0xffffcc : 0xffaa22;
    const projSize = isMolotov ? [0.06, 0.06, 0.12] : isGrenade ? [0.05, 0.05, 0.10] : [0.08, 0.08, 0.25];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(projSize[0], projSize[1], projSize[2]),
      new THREE.MeshBasicMaterial({ color: projColor })
    );
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);
    // Grenades, smoke, flashbangs have upward arc
    if (isGrenade || isMolotov || isSmoke || isFlash) dir.y += 0.3;
    dir.normalize();
    const pos = camera.getWorldPosition(_wTmp1);
    mesh.position.copy(pos).addScaledVector(dir, 1.0);
    _wTmp2.copy(pos).addScaledVector(dir, 2);
    mesh.lookAt(_wTmp2);
    _scene.add(mesh);
    const speed = (isGrenade || isMolotov || isSmoke || isFlash) ? 18 : PROJ_SPEED;

    // ── Heat-seeking / fire-and-forget guidance ──
    // AA (Igla/Stinger) → lock onto enemy aircraft (drones)
    // ATGM/AT_HEAVY (Stugna/Javelin) → lock onto nearest enemy in cone
    var homingTarget = null;
    if (wep.homing) {
      var origin = pos.clone();
      var fwd = dir.clone();
      var bestScore = -Infinity;
      var maxRange = 220;
      var minDot = 0.85; // ~32° cone half-angle
      function _scoreCand(tpos) {
        var dx = tpos.x - origin.x, dy = tpos.y - origin.y, dz = tpos.z - origin.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > maxRange || dist < 1) return null;
        var dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
        if (dot < minDot) return null;
        return dot - dist * 0.001;
      }
      if (wep.type === 'AA' && typeof DroneSystem !== 'undefined' && DroneSystem.getEnemyDrones) {
        var dlist = DroneSystem.getEnemyDrones() || [];
        for (var di = 0; di < dlist.length; di++) {
          var dr = dlist[di];
          if (!dr || !dr.position || dr.destroyed || dr.alive === false) continue;
          var s = _scoreCand(dr.position);
          if (s !== null && s > bestScore) { bestScore = s; homingTarget = { kind: 'drone', ref: dr }; }
        }
      } else if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var elist = Enemies.getAll();
        for (var ei = 0; ei < elist.length; ei++) {
          var e2 = elist[ei];
          if (!e2 || !e2.alive || !e2.mesh) continue;
          var s2 = _scoreCand(e2.mesh.position);
          if (s2 !== null && s2 > bestScore) { bestScore = s2; homingTarget = { kind: 'enemy', ref: e2 }; }
        }
      }
      if (homingTarget && typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playPickup) {
        // brief lock-on chirp
        try { window.AudioSystem.playPickup(); } catch (_e) {}
      }
    }

    projectiles.push({
      mesh, dir: dir.clone(), speed: speed,
      damage: wep.damage, radius: wep.blastRadius || 4,
      life: 5.0,
      gravity: (isGrenade || isMolotov || isSmoke || isFlash) ? 12 : 0,
      isMolotov: isMolotov,
      isSmoke: isSmoke,
      isFlash: isFlash,
      weaponType: wep.type,
      homing: !!wep.homing,
      target: homingTarget,
      turnRate: (wep.type === 'AA') ? 3.0 : 1.6,
    });
  }

  function updateProjectiles(delta) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      // ── Homing guidance: steer dir toward locked target ──
      if (p.homing && p.target && p.target.ref) {
        var tref = p.target.ref;
        var tpos = (p.target.kind === 'drone') ? tref.position : (tref.mesh && tref.mesh.position);
        var tAlive = (p.target.kind === 'drone') ? !tref.destroyed : !!tref.alive;
        if (tpos && tAlive) {
          _wTmp2.copy(tpos).sub(p.mesh.position).normalize();
          var maxTurn = Math.min(1, (p.turnRate || 2.0) * delta);
          p.dir.lerp(_wTmp2, maxTurn).normalize();
          p.mesh.lookAt(_wTmp1.copy(p.mesh.position).add(p.dir));
        } else {
          p.target = null;
        }
      }
      p.mesh.position.addScaledVector(p.dir, p.speed * delta);
      // Smoke trail behind projectiles (visibility aid for grenades/rockets)
      p._trailTimer = (p._trailTimer || 0) - delta;
      if (p._trailTimer <= 0 && typeof Tracers !== 'undefined' && Tracers.spawnSmoke) {
        Tracers.spawnSmoke(p.mesh.position);
        p._trailTimer = (p.weaponType === 'AT' || p.weaponType === 'ATGM' || p.weaponType === 'AA') ? 0.025 : 0.06;
      }
      // Apply gravity for arc projectiles (grenades, molotovs)
      if (p.gravity) {
        p.dir.y -= p.gravity * delta / p.speed;
        p.mesh.position.y -= p.gravity * delta * delta * 0.5;
        // Grenade bounce clank when close to ground
        if (!p._bounced && typeof VoxelWorld !== 'undefined') {
          var gndH = VoxelWorld.getTerrainHeight(p.mesh.position.x, p.mesh.position.z);
          if (p.mesh.position.y <= gndH + 0.5 && p.dir.y < 0) {
            p._bounced = true;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playRicochet();
          }
        }
      }
      p.life -= delta;

      // Check enemy collision
      let hit = false;
      const enemyMeshes = Enemies.getEnemyMeshes();
      _projRaycaster.set(p.mesh.position, p.dir);
      _projRaycaster.near = 0;
      _projRaycaster.far = p.speed * delta + 0.5;
      // Sprites (health bars, alert icons) cannot be raycast without camera — filter them
      let hits = [];
      try {
        const nonSpriteMeshes = enemyMeshes.filter(function(m) { return m && !(m instanceof THREE.Sprite); });
        hits = _projRaycaster.intersectObjects(nonSpriteMeshes, true);
      } catch (_e) { hits = []; }
      if (hits.length > 0) hit = true;
      // Friendly fire: projectiles can also hit NPCs
      if (!hit && typeof NPCSystem !== 'undefined' && NPCSystem.getAll) {
        var npcs = NPCSystem.getAll();
        for (var ni = 0; ni < npcs.length; ni++) {
          var npc = npcs[ni];
          if (!npc || !npc.alive || !npc.position || !npc.mesh) continue;
          var npcDist = npc.position.distanceTo(p.mesh.position);
          if (npcDist < 1.5) { hit = true; break; }
        }
      }

      // Check terrain collision via VoxelWorld
      if (!hit && typeof VoxelWorld !== 'undefined') {
        _wTmpFakePos.copy(p.mesh.position);
        const fakeCamera = {
          position: _wTmpFakePos,
          getWorldDirection: function(v) { return v.copy(p.dir); },
        };
        const ray = VoxelWorld.raycastBlock(fakeCamera, p.speed * delta + 0.5);
        if (ray) hit = true;
      }

      if (hit || p.life <= 0) {
        // Smoke grenade: spawn obscuring cloud instead of explosion
        if (p.isSmoke) {
          createSmokeCloud(p.mesh.position, p.radius);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          _scene.remove(p.mesh);
          projectiles.splice(i, 1);
          continue;
        }
        // Flashbang: screen flash + enemy stun
        if (p.isFlash) {
          triggerFlashbang(p.mesh.position, p.radius);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          _scene.remove(p.mesh);
          projectiles.splice(i, 1);
          continue;
        }
        // Play unique mine sound for MINE type
        if (p.weaponType === 'MINE' && typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playMine) {
          window.AudioSystem.playMine();
        } else if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playExplosion) {
          window.AudioSystem.playExplosion();
        }
        // Explosion effect
        var _wExplRes = Enemies.damageInRadius(p.mesh.position, p.radius, p.damage);
        if (typeof GameManager !== 'undefined' && GameManager.notifyExplosiveKills && Array.isArray(_wExplRes)) {
          var _wExplK = 0;
          for (var _wei = 0; _wei < _wExplRes.length; _wei++) if (_wExplRes[_wei].remaining <= 0) _wExplK++;
          if (_wExplK > 0) GameManager.notifyExplosiveKills(_wExplK);
        }
        // Destroy terrain blocks in blast radius
        if (typeof VoxelWorld !== 'undefined') {
          const cx = Math.round(p.mesh.position.x);
          const cy = Math.round(p.mesh.position.y);
          const cz = Math.round(p.mesh.position.z);
          const blastR = Math.ceil(p.radius);
          for (let bx = -blastR; bx <= blastR; bx++) {
            for (let by = -blastR; by <= blastR; by++) {
              for (let bz = -blastR; bz <= blastR; bz++) {
                if (bx * bx + by * by + bz * bz <= blastR * blastR) {
                  destroyBlock(cx + bx, cy + by, cz + bz, false);
                }
              }
            }
          }
        }
        if (p.isMolotov) {
          createFireArea(p.mesh.position, p.radius);
        } else {
          createExplosionFlash(p.mesh.position);
        }
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }
  }

  function createExplosionFlash(pos) {
    if (!_scene) return;
    const flashGeo = new THREE.SphereGeometry(1.5, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xff6600, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    _scene.add(flash);
    let t = 0.2;
    const fadeInterval = setInterval(function () {
      t -= 0.016;
      flash.material.opacity = Math.max(0, t / 0.2) * 0.9;
      flash.scale.setScalar(1 + (0.2 - t) * 5);
      if (t <= 0) {
        _scene.remove(flash);
        flashGeo.dispose();
        flashMat.dispose();
        clearInterval(fadeInterval);
      }
    }, 16);
  }

  function createFireArea(pos, radius) {
    if (!_scene) return;
    // Flat fire disc on the ground
    const fireGeo = new THREE.CylinderGeometry(radius, radius, 0.15, 12);
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff4400, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.copy(pos);
    fire.position.y += 0.1;
    _scene.add(fire);
    // Fire burns for 3 seconds, dealing damage over time
    let burnTime = 3.0;
    const burnInterval = setInterval(function () {
      burnTime -= 0.25;
      // Pulse the fire
      fire.material.opacity = 0.4 + Math.sin(burnTime * 6) * 0.3;
      fire.scale.setScalar(0.8 + Math.sin(burnTime * 4) * 0.2);
      // Damage enemies in area every 0.25s
      if (typeof Enemies !== 'undefined') {
        Enemies.damageInRadius(pos, radius, 15);
      }
      if (burnTime <= 0) {
        _scene.remove(fire);
        fireGeo.dispose();
        fireMat.dispose();
        clearInterval(burnInterval);
      }
    }, 250);
  }

  // ── Smoke Cloud ────────────────────────────────────────────
  const _smokeClouds = []; // active smoke zones for LOS checks

  function createSmokeCloud(pos, radius) {
    if (!_scene) return;
    // Visual: multiple translucent spheres
    const group = new THREE.Group();
    group.position.copy(pos);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(radius * (0.5 + Math.random() * 0.5), 8, 6),
        new THREE.MeshBasicMaterial({
          color: 0xcccccc, transparent: true, opacity: 0.45,
          depthWrite: false,
        })
      );
      s.position.set(
        (Math.random() - 0.5) * radius * 0.6,
        Math.random() * radius * 0.4,
        (Math.random() - 0.5) * radius * 0.6
      );
      group.add(s);
    }
    _scene.add(group);
    const cloud = { group: group, pos: pos.clone(), radius: radius, life: 6.0 };
    _smokeClouds.push(cloud);
    if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playSmoke) window.AudioSystem.playSmoke();

    // Animate fade-out
    const fadeInt = setInterval(function () {
      cloud.life -= 0.1;
      // Drift upward slowly
      group.position.y += 0.02;
      // Expand slightly
      group.scale.setScalar(1 + (6.0 - cloud.life) * 0.05);
      // Fade in last 2 seconds
      if (cloud.life < 2.0) {
        group.children.forEach(function (c) {
          c.material.opacity = 0.45 * (cloud.life / 2.0);
        });
      }
      if (cloud.life <= 0) {
        group.children.forEach(function (c) { c.geometry.dispose(); c.material.dispose(); });
        _scene.remove(group);
        const idx = _smokeClouds.indexOf(cloud);
        if (idx >= 0) _smokeClouds.splice(idx, 1);
        clearInterval(fadeInt);
      }
    }, 100);
  }

  function isInSmoke(px, pz) {
    for (let i = 0; i < _smokeClouds.length; i++) {
      const c = _smokeClouds[i];
      const dx = px - c.pos.x, dz = pz - c.pos.z;
      if (dx * dx + dz * dz < c.radius * c.radius) return true;
    }
    return false;
  }

  // ── Flashbang Effect ────────────────────────────────────────
  function triggerFlashbang(pos, radius) {
    if (!_scene) return;
    // 1) Screen flash — player gets flashed if within radius
    var flashOverlay = document.getElementById('flashbang-overlay');
    if (flashOverlay && _camera) {
      var camPos = _camera.getWorldPosition(new THREE.Vector3());
      var dist = camPos.distanceTo(pos);
      if (dist < radius * 1.5) {
        var intensity = Math.max(0, 1 - dist / (radius * 1.5));
        flashOverlay.style.opacity = intensity;
        setTimeout(function () { flashOverlay.style.transition = 'opacity 2s'; flashOverlay.style.opacity = '0'; }, 100);
        setTimeout(function () { flashOverlay.style.transition = 'opacity 0.05s'; }, 2200);
      }
    }
    // 2) Stun enemies in radius
    if (typeof Enemies !== 'undefined' && Enemies.stunInRadius) {
      Enemies.stunInRadius(pos, radius, 3.0);
    }
    // 3) Audio
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playFlashbang) AudioSystem.playFlashbang();
    // 4) Bright flash light
    var flashLight = new THREE.PointLight(0xffffff, 8, radius * 3);
    flashLight.position.copy(pos);
    _scene.add(flashLight);
    setTimeout(function () { _scene.remove(flashLight); }, 200);
  }

  // ── Shovel swing animation state ──────────────────────────
  let swingTimer = 0;

  // ── Shooting / Melee ──────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const _projRaycaster = new THREE.Raycaster(); // hoisted for projectile collision checks
  const spreadVec = new THREE.Vector2();
  const _wTmp1 = new THREE.Vector3(); // reusable temp vectors for fire/projectile paths
  const _wTmp2 = new THREE.Vector3();
  const _wTmpFakePos = new THREE.Vector3();
  const _wTmp3 = new THREE.Vector3(); // bullet hole position
  const _wTmp4 = new THREE.Vector3(); // bullet hole normal
  const _wTmpSpark = new THREE.Vector3(); // ricochet spark position

  // Track whether a shot was actually fired this frame (for sound)
  let _firedThisFrame = false;

  function tryFire(camera, targets, delta, onHit, newPress) {
    const wep = cur();
    const st  = curState();
    // Defensive: ensure targets is always a valid array of THREE.js objects
    if (!Array.isArray(targets)) targets = [];
    else targets = targets.filter(obj => obj && typeof obj === 'object' && typeof obj.isObject3D === 'boolean');
    _firedThisFrame = false;
    st.fireCooldown -= delta;
    if (st.reloading) return;
    if (st.fireCooldown > 0) return;
    if (!wep.auto && !newPress) return;
    // Block firing when weapon is overheated
    if (typeof CombatExtras !== 'undefined' && CombatExtras.isOverheated()) return;
    st.fireCooldown = effectiveFireRate(currentIdx);
    _firedThisFrame = true;

    // Trigger visual animations (bolt cycle, barrel spin, muzzle smoke)
    if (typeof WeaponDetails !== 'undefined' && WeaponDetails.onFire) {
      WeaponDetails.onFire(gunMeshes[currentIdx], wep);
    }

    // ── Weapon jamming system ────────────────────────────
    if (wep.type !== 'MELEE' && wep.type !== 'MINE' && wep.type !== 'SMOKE' && wep.type !== 'FLASHBANG') {
      st.shotsSinceClean++;
      // Jam chance increases with sustained fire (0.1% per shot after 60 shots)
      if (st.shotsSinceClean > 60 && Math.random() < (st.shotsSinceClean - 60) * 0.001) {
        st.jammed = true;
        _firedThisFrame = false;
        return;
      }
    }
    if (st.jammed) { _firedThisFrame = false; return; }

    applyRecoil();

    // ── Melee: shovel ───────────────────────────────────
    if (wep.type === 'MELEE') {
      swingTimer = 0.2;
      // Lunge when sprinting: extended range + bonus damage
      var meleeRange = 3;
      var meleeDmg = wep.damage;
      if (typeof GameManager !== 'undefined' && GameManager.isSprinting && GameManager.isSprinting()) {
        meleeRange = 5;
        meleeDmg = Math.round(wep.damage * 1.8);
        swingTimer = 0.3;
      }
      raycaster.set(
        camera.getWorldPosition(_wTmp1),
        camera.getWorldDirection(_wTmp2)
      );
      raycaster.far = meleeRange;
      let hits = [];
      try {
        hits = raycaster.intersectObjects(targets, true);
      } catch (e) { hits = []; }
      if (hits.length > 0) {
        onHit(hits[0], meleeDmg);
      } else if (typeof VoxelWorld !== 'undefined') {
        // Dig terrain (shovel)
        const ray = VoxelWorld.raycastBlock(camera, meleeRange);
        if (ray) {
          destroyBlock(ray.hit.x, ray.hit.y, ray.hit.z, true);
        }
      }
      return;
    }

    // ── Mine: place claymore at feet ──────────────────────
    if (wep.type === 'MINE') {
      if (st.clip <= 0) { startReload(); _firedThisFrame = false; return; }
      st.clip--;
      HUD.setAmmo(st.clip, st.reserve);
      // Mine is placed as a projectile that lands and waits
      spawnProjectile(camera, wep);
      if (st.clip === 0 && st.reserve > 0) startReload();
      return;
    }

    // ── Smoke grenade: launch smoke projectile ────────────
    if (wep.type === 'SMOKE') {
      if (st.clip <= 0) { startReload(); _firedThisFrame = false; return; }
      st.clip--;
      HUD.setAmmo(st.clip, st.reserve);
      spawnProjectile(camera, wep);
      if (st.clip === 0 && st.reserve > 0) startReload();
      return;
    }

    // ── Flashbang: launch flash projectile ────────────────
    if (wep.type === 'FLASHBANG') {
      if (st.clip <= 0) { startReload(); _firedThisFrame = false; return; }
      st.clip--;
      HUD.setAmmo(st.clip, st.reserve);
      spawnProjectile(camera, wep);
      if (st.clip === 0 && st.reserve > 0) startReload();
      return;
    }

    // ── Projectile weapons (AT/ATGM/AT_HEAVY/AT_LIGHT/AA/GRENADE/INCENDIARY/THERMOBARIC/EXPLOSIVE) ──
    if (wep.type === 'AT' || wep.type === 'ATGM' || wep.type === 'AT_HEAVY' ||
        wep.type === 'AT_LIGHT' || wep.type === 'AA' || wep.type === 'GRENADE' ||
        wep.type === 'INCENDIARY' || wep.type === 'THERMOBARIC' || wep.type === 'EXPLOSIVE') {
      var _isGod = (typeof GameManager !== 'undefined' && GameManager.isGodMode && GameManager.isGodMode());
      if (_isGod && wep.type === 'GRENADE') {
        // Unlimited grenades in god mode — top up clip + reserve so ammo never depletes
        st.clip = wep.clipSize; st.reserve = wep.maxReserve;
      }
      if (st.clip <= 0) { startReload(); _firedThisFrame = false; return; }
      if (!_isGod) st.clip--;
      HUD.setAmmo(st.clip, st.reserve);
      showMuzzle();
      spawnProjectile(camera, wep);
      recoilOffset = 0.04;
      if (!_isGod && st.clip === 0 && st.reserve > 0) startReload();
      return;
    }

    // ── Shotgun: multi-pellet hitscan (8 pellets per shot) ──
    if (wep.type === 'SHOTGUN') {
      if (st.clip <= 0) { startReload(); _firedThisFrame = false; return; }
      st.clip--;
      HUD.setAmmo(st.clip, st.reserve);
      showMuzzle();
      var _m = (gunMeshes && gunMeshes[currentIdx]);
      if (typeof Tracers !== 'undefined' && Tracers.spawnMuzzleFlash && _m && _m.userData && _m.userData.muzzlePos) {
        Tracers.spawnMuzzleFlash(_m.userData.muzzlePos, 0.4 + Math.random()*0.1); // 66% less glare
        Tracers.spawnSmoke(_m.userData.muzzlePos);
      }
      recoilOffset = 0.05;
      _chSpread = Math.min(1, wep.spread * 12 + _chSpread * 0.22);
      if (typeof HUD !== 'undefined' && HUD.setCrosshairSpread) HUD.setCrosshairSpread(_chSpread);
      const pellets = 8;
      for (let p = 0; p < pellets; p++) {
        spreadVec.set(
          (Math.random() - 0.5) * wep.spread * 2,
          (Math.random() - 0.5) * wep.spread * 2
        );
        raycaster.setFromCamera(spreadVec, camera);
        raycaster.far = 25; // shotgun effective range
        const pelletHits = raycaster.intersectObjects(targets, true);
        if (pelletHits.length > 0) {
          onHit(pelletHits[0], Math.floor(wep.damage / pellets));
        } else if (typeof VoxelWorld !== 'undefined') {
          // Pellet missed — dig terrain using pellet's spread direction
          _wTmp1.copy(raycaster.ray.direction);
          var _pelletX = _wTmp1.x, _pelletY = _wTmp1.y, _pelletZ = _wTmp1.z;
          const pelletCam = {
            position: camera.position,
            getWorldDirection: function(v) { return v.set(_pelletX, _pelletY, _pelletZ); },
          };
          const pRay = VoxelWorld.raycastBlock(pelletCam, 25);
          if (pRay) destroyBlock(pRay.hit.x, pRay.hit.y, pRay.hit.z, false);
        }
      }
      if (st.clip === 0 && st.reserve > 0) startReload();
      return;
    }

    // ── Drone Jammer: EMP cone pulse ────────────────────
    if (wep.type === 'JAMMER') {
      if (st.clip <= 0) { startReload(); _firedThisFrame = false; return; }
      st.clip--;
      HUD.setAmmo(st.clip, st.reserve);
      showMuzzle();
      var _m = (gunMeshes && gunMeshes[currentIdx]);
      if (typeof Tracers !== 'undefined' && Tracers.spawnMuzzleFlash && _m && _m.userData && _m.userData.muzzlePos) {
        Tracers.spawnMuzzleFlash(_m.userData.muzzlePos, 0.33 + Math.random()*0.07); // 66% less glare
        Tracers.spawnSmoke(_m.userData.muzzlePos);
      }
      recoilOffset = 0.02;
      _chSpread = Math.min(1, 0.18 + _chSpread * 0.22);
      if (typeof HUD !== 'undefined' && HUD.setCrosshairSpread) HUD.setCrosshairSpread(_chSpread);
      // Cone disable: find enemy drones in front of camera
      if (typeof DroneSystem !== 'undefined' && DroneSystem.getEnemyDrones) {
        const origin = camera.getWorldPosition(new THREE.Vector3());
        const fwd = camera.getWorldDirection(new THREE.Vector3());
        const dlist = DroneSystem.getEnemyDrones() || [];
        let hitCount = 0;
        for (let di = 0; di < dlist.length; di++) {
          const dr = dlist[di];
          if (!dr || !dr.mesh || dr.destroyed) continue;
          const to = new THREE.Vector3().subVectors(dr.mesh.position, origin);
          const dist = to.length();
          to.normalize();
          const dot = to.dot(fwd);
          if (dist < 45 && dot > 0.82) {   // 45m range, ~35° cone
            dr.disabled = true;
            dr.disabledTimer = 6.0;        // 6 seconds disabled
            dr.hp = Math.max(0, (dr.hp || 30) - wep.damage); // also damage drone HP
            // Use shootDownDrone(id) — it resolves the id to the drone object
            // and cleans up the enemy list. Calling destroyDrone(dr.id) passed a
            // number where a drone object was expected → "Cannot create property
            // 'alive' on number" fatal crash mid-combat.
            if (dr.hp <= 0) {
              if (DroneSystem.shootDownDrone) DroneSystem.shootDownDrone(dr.id);
              else if (DroneSystem.destroyDrone) DroneSystem.destroyDrone(dr);
            }
            hitCount++;
          }
        }
        if (hitCount > 0 && typeof HUD !== 'undefined' && HUD.showToast) {
          HUD.showToast('⚡ ' + hitCount + ' drone' + (hitCount > 1 ? 's' : '') + ' jammed', 1200, '#00ff88');
        }
      }
      // Also damage enemy electronics (DRONE_OP, EW_OPERATOR) via raycast
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      raycaster.far = 45;
      let hits = [];
      try {
        hits = raycaster.intersectObjects(targets, true);
      } catch (e) { hits = []; }
      if (hits.length > 0) {
        var h = hits[0];
        // Check if target is a drone operator or EW type
        var enemyObj = h.object;
        while (enemyObj && !enemyObj.userData && enemyObj.parent) enemyObj = enemyObj.parent;
        if (enemyObj && enemyObj.userData && enemyObj.userData.enemyType) {
          var et = enemyObj.userData.enemyType;
          if (et === 'DRONE_OP' || et === 'EW_OPERATOR' || et === 'SWARM_OP') {
            onHit(h, wep.damage * 3); // 3x damage to drone operators
          } else {
            onHit(h, wep.damage); // normal damage to anyone else
          }
        } else {
          onHit(h, wep.damage);
        }
      }
      if (st.clip === 0 && st.reserve > 0) startReload();
      return;
    }

    // ── Standard hitscan fire ───────────────────────────
    if (st.clip <= 0) { startReload(); _firedThisFrame = false; return; }
    st.clip--;
    HUD.setAmmo(st.clip, st.reserve);

    // ── Auto-aim: snap ray toward nearest enemy if enabled ──
    var _autoAimEnabled = (typeof window !== 'undefined' && window.__AUTO_AIM);
    var _autoAimCone = 0.16; // ~9° cone
    var _autoAimMaxDist = 35;
    var _aimSnapDir = null;
    if (_autoAimEnabled && targets && targets.length) {
      var camPos = camera.getWorldPosition(new THREE.Vector3());
      var camDir = camera.getWorldDirection(new THREE.Vector3());
      var bestDot = -1, bestTarget = null;
      for (var ai = 0; ai < targets.length; ai++) {
        var tObj = targets[ai];
        if (!tObj || !tObj.position) continue;
        var toT = new THREE.Vector3().subVectors(tObj.position, camPos);
        var distT = toT.length();
        if (distT > _autoAimMaxDist) continue;
        toT.normalize();
        var dotT = toT.dot(camDir);
        if (dotT > _autoAimCone && dotT > bestDot) {
          bestDot = dotT; bestTarget = tObj;
        }
      }
      if (bestTarget) {
        _aimSnapDir = new THREE.Vector3().subVectors(bestTarget.position, camPos).normalize();
      }
    }

    spreadVec.set(
      (Math.random() - 0.5) * wep.spread * 2,
      (Math.random() - 0.5) * wep.spread * 2
    );
    if (_aimSnapDir) {
      raycaster.ray.origin.copy(camera.getWorldPosition(new THREE.Vector3()));
      raycaster.ray.direction.copy(_aimSnapDir).add(
        new THREE.Vector3((Math.random()-0.5)*wep.spread, (Math.random()-0.5)*wep.spread, (Math.random()-0.5)*wep.spread)
      ).normalize();
    } else {
      raycaster.setFromCamera(spreadVec, camera);
    }
    raycaster.far = Infinity;
    let hits = [];
    try {
      hits = raycaster.intersectObjects(targets, true);
    } catch (e) { hits = []; }
    showMuzzle();
    // Defensive: ensure m is always defined
    var _m = (typeof m !== 'undefined' && m) ? m : (gunMeshes && gunMeshes[currentIdx]);
    if (typeof Tracers !== 'undefined' && Tracers.spawnMuzzleFlash && _m && _m.userData && _m.userData.muzzlePos) {
      Tracers.spawnMuzzleFlash(_m.userData.muzzlePos, 1.1 + Math.random()*0.2);
      Tracers.spawnSmoke(_m.userData.muzzlePos);
    }
    recoilOffset = 0.02;
    _chSpread = Math.min(1, wep.spread * 10 + _chSpread * 0.22);
    if (typeof HUD !== 'undefined' && HUD.setCrosshairSpread) HUD.setCrosshairSpread(_chSpread);

    // Bullet drop: for long-range weapons, distant hits drift downward
    var _dropTypes = { SNIPER: 0.5, AMR: 0.3, ASSAULT: 1.0, NATO: 0.9, LMG: 1.2, HMG: 1.0 };
    var _dropG = _dropTypes[wep.type];

    if (hits.length > 0) {
      var hitDist = hits[0].distance;
      // Bullet drop: check if gravity would cause a miss at this distance
      var dropMiss = false;
      if (_dropG && hitDist > 40) {
        var travelTime = hitDist / 200; // bullet speed ~200 units/s
        var dropAmount = 0.5 * _dropG * travelTime * travelTime;
        // If drop exceeds enemy hitbox height (~2 units), it's a miss
        if (dropAmount > 1.8) {
          dropMiss = true;
        } else if (dropAmount > 0.3) {
          // Partial drop: reduce damage proportionally for marginal hits
          var dropPenalty = 1 - (dropAmount - 0.3) / 1.5;
          hits[0]._dropDamageMult = Math.max(0.3, dropPenalty);
        }
      }
      if (!dropMiss) {
        var dropDmgMult = hits[0]._dropDamageMult || 1;
        onHit(hits[0], Math.round(wep.damage * dropDmgMult));
      // Bullet penetration for high-caliber weapons — hit 2nd target at reduced damage
      var penTypes = ['SNIPER', 'LMG', 'HMG', 'HMG_HEAVY', 'MINIGUN', 'AMR', 'MACHINEGUN'];
      if (penTypes.indexOf(wep.type) >= 0 && hits.length > 1) {
        // Find next hit that belongs to a different root enemy mesh
        var firstRoot = hits[0].object;
        while (firstRoot.parent && firstRoot.parent.type !== 'Scene') firstRoot = firstRoot.parent;
        for (var pi = 1; pi < hits.length; pi++) {
          var pRoot = hits[pi].object;
          while (pRoot.parent && pRoot.parent.type !== 'Scene') pRoot = pRoot.parent;
          if (pRoot !== firstRoot) {
            onHit(hits[pi], Math.round(wep.damage * 0.6));
            break;
          }
        }
      }
      } // end !dropMiss
    } else if (typeof VoxelWorld !== 'undefined') {
      // Bullet missed enemies — dig terrain on impact using bullet's spread direction
      _wTmp1.copy(raycaster.ray.direction);
      var _bx = _wTmp1.x, _by = _wTmp1.y, _bz = _wTmp1.z;
      const bulletCam = {
        position: camera.position,
        getWorldDirection: function(v) { return v.set(_bx, _by, _bz); },
      };
      const bRay = VoxelWorld.raycastBlock(bulletCam, 80);
      if (bRay) {
        var hitBlockType = VoxelWorld.getBlock(bRay.hit.x, bRay.hit.y, bRay.hit.z);
        // Bullet hole decal on terrain (surface-aware)
        if (typeof Tracers !== 'undefined' && Tracers.spawnBulletHole) {
          _wTmp3.set(bRay.hit.x + 0.5, bRay.hit.y + 0.5, bRay.hit.z + 0.5);
          _wTmp4.set(
            bRay.place.x - bRay.hit.x,
            bRay.place.y - bRay.hit.y,
            bRay.place.z - bRay.hit.z
          ).normalize();
          if (_wTmp4.lengthSq() > 0) {
            _wTmp3.addScaledVector(_wTmp4, 0.5);
            Tracers.spawnBulletHole(_wTmp3, _wTmp4, hitBlockType);
          }
        }
        // Surface-aware impact audio
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playImpact) {
          AudioSystem.playImpact(hitBlockType);
        }
        // Surface-aware impact particles
        if (typeof Tracers !== 'undefined' && Tracers.spawnBlockImpact) {
          var impactPos = _wTmpSpark.set(bRay.hit.x + 0.5, bRay.hit.y + 0.5, bRay.hit.z + 0.5);
          var impactColor = (hitBlockType === 5 || hitBlockType === 14) ? 0xC0C0C0 :
                            (hitBlockType === 11) ? 0xCCEEFF :
                            (hitBlockType === 4) ? 0x8B6914 : undefined;
          Tracers.spawnBlockImpact(impactPos, impactColor);
        }
        // Metal/glass sparks
        if ((hitBlockType === 5 || hitBlockType === 14 || hitBlockType === 11) && typeof Tracers !== 'undefined') {
          Tracers.spawnSparks(_wTmpSpark.set(bRay.hit.x + 0.5, bRay.hit.y + 0.5, bRay.hit.z + 0.5));
        }
        // Ricochet check on metal/reinforced surfaces
        if (typeof CombatExtras !== 'undefined') {
          var blockType = hitBlockType;
          var ric = CombatExtras.calcRicochet(blockType, _wTmp1);
          if (ric) {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playRicochet();
            if (typeof Tracers !== 'undefined') Tracers.spawnSparks(_wTmpSpark.set(bRay.hit.x, bRay.hit.y, bRay.hit.z));
          }
        }
        // Fuel barrel detonation (block type 12 = FUEL_BARREL)
        if (hitBlockType === 12 && typeof WorldFeatures !== 'undefined' && WorldFeatures.detonateBarrel) {
          WorldFeatures.detonateBarrel(bRay.hit.x, bRay.hit.y, bRay.hit.z);
        } else {
          // Cover degradation: accumulate damage instead of instant destroy
          var wepDmg = wep.damage || 10;
          // All bullets now destroy terrain blocks instantly (not just high-caliber)
          destroyBlock(bRay.hit.x, bRay.hit.y, bRay.hit.z, false);
        }
      }
    }
    if (st.clip === 0 && st.reserve > 0) startReload();
  }

  function startReload() {
    const wep = cur();
    const st  = curState();
    if (wep.type === 'MELEE') return;
    var effClip = effectiveClipSize(currentIdx);
    if (st.reloading || st.clip === effClip) return;
    if (st.reserve <= 0) {
      // No ammo — dry fire click + actionable hint (throttled to one per 8s)
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playDryFire) AudioSystem.playDryFire();
      var _now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      if (!_lastDryHint || _now - _lastDryHint > 8000) {
        _lastDryHint = _now;
        if (typeof HUD !== 'undefined' && HUD.showToast) {
          HUD.showToast('🔫 OUT OF AMMO — grab a yellow AMMO drop from fallen enemies, or switch weapons (scroll / 1-9)', 4500, '#ffcc00');
        }
      }
      return;
    }
    st.reloading   = true;
    st.reloadTimer = effectiveReloadTime(currentIdx);
    reloadAnimAngle = 0;
    HUD.showReload(true);
    // Mag-drop visual: spawn a small black mag that falls + fades
    try {
      if (_scene && _camera && wep.type !== 'MELEE' && wep.clipSize >= 5) {
        var _magGeo = new THREE.BoxGeometry(0.08, 0.18, 0.05);
        var _magMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.9 });
        var _mag = new THREE.Mesh(_magGeo, _magMat);
        // Spawn near gun position (slightly below + right of camera)
        var _camDir = new THREE.Vector3();
        _camera.getWorldDirection(_camDir);
        var _camRight = new THREE.Vector3().crossVectors(_camDir, new THREE.Vector3(0, 1, 0)).normalize();
        _mag.position.copy(_camera.position)
          .addScaledVector(_camDir, 0.6)
          .addScaledVector(_camRight, 0.18)
          .y -= 0.25;
        _mag.userData.vy = -0.2;
        _mag.userData.vx = (Math.random() - 0.5) * 0.3;
        _mag.userData.vz = (Math.random() - 0.5) * 0.3;
        _mag.userData.life = 1.4;
        _mag.userData.rotSpd = (Math.random() - 0.5) * 6;
        _scene.add(_mag);
        _droppedMags.push(_mag);
      }
    } catch (eMD) {}
  }
  var _droppedMags = [];
  function _updateDroppedMags(delta) {
    for (var i = _droppedMags.length - 1; i >= 0; i--) {
      var m = _droppedMags[i];
      m.userData.vy -= 9.8 * delta;
      m.position.x += m.userData.vx * delta;
      m.position.y += m.userData.vy * delta;
      m.position.z += m.userData.vz * delta;
      m.rotation.x += m.userData.rotSpd * delta;
      m.rotation.z += m.userData.rotSpd * 0.7 * delta;
      m.userData.life -= delta;
      if (m.userData.life < 0.5) m.material.opacity = Math.max(0, m.userData.life / 0.5) * 0.9;
      if (m.userData.life <= 0) {
        if (_scene) _scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
        _droppedMags.splice(i, 1);
      }
    }
  }

  function cancelReload() {
    const st = curState();
    if (!st.reloading) return;
    st.reloading = false;
    st.reloadTimer = 0;
    reloadAnimAngle = 0;
    var mesh = gunMeshes[currentIdx];
    if (mesh) mesh.rotation.x = 0;
    HUD.showReload(false);
  }

  // ── Per-frame update ──────────────────────────────────────
  function update(delta) {
    _updateDroppedMags(delta);
    _updateBloodStains(delta);
    // Muzzle flash fade
    if (muzzleTimer > 0) {
      muzzleTimer -= delta;
      if (muzzleFlash) muzzleFlash.material.opacity = Math.max(0, muzzleTimer / 0.10);
      if (_muzzleLight) _muzzleLight.intensity = Math.max(0, (muzzleTimer / 0.10) * 2.5);
    }
    // Weapon flashlight: on for suitable weapons, auto-off in daylight
    if (_weaponFlashlight) {
      var cw = cur();
      var hasLight = cw && ['MELEE','MINE','SMOKE','FLASHBANG','EXPLOSIVE'].indexOf(cw.type) < 0;
      var isBright = false;
      try {
        if (typeof TimeSystem !== 'undefined' && TimeSystem.getInfo) {
          isBright = TimeSystem.getInfo().phase === 'day';
        }
      } catch (e) {}
      var targetInt = (_flashlightOn && hasLight && !isBright) ? 2.5 : 0;
      _weaponFlashlight.intensity += (targetInt - _weaponFlashlight.intensity) * Math.min(1, delta * 8);
    }
    // Lingering muzzle smoke puff: drift up & fade
    if (_muzzleSmokeTimer > 0 && _muzzleSmoke) {
      _muzzleSmokeTimer -= delta;
      var sFrac = Math.max(0, _muzzleSmokeTimer / _MUZZLE_SMOKE_LIFE);
      _muzzleSmoke.material.opacity = sFrac * 0.55;
      _muzzleSmoke.position.y += delta * 0.18;
      _muzzleSmoke.position.z -= delta * 0.06;
      _muzzleSmoke.scale.x += delta * 0.6;
      _muzzleSmoke.scale.y += delta * 0.6;
      if (_muzzleSmokeTimer <= 0) _muzzleSmoke.visible = false;
    }

    // Projectiles
    updateProjectiles(delta);

    // Recoil recovery (visual gun kick)
    const mesh = gunMeshes[currentIdx];
    if (recoilOffsetZ < 0) recoilOffsetZ = Math.min(0, recoilOffsetZ + delta * 12 * 0.04);
    if (recoilOffsetY > 0) recoilOffsetY = Math.max(0, recoilOffsetY - delta * 12 * 0.02);
    if (recoilOffset > 0) recoilOffset = Math.max(0, recoilOffset - delta * 0.3);
    if (_chSpread > 0) {
      _chSpread = Math.max(0, _chSpread - delta * 1.2);
      if (typeof HUD !== 'undefined' && HUD.setCrosshairSpread) HUD.setCrosshairSpread(_chSpread);
    }

    // Smooth ADS FOV transition
    if (_camera) {
      var adsSpeed = 8;
      _adsLerp += (_adsTarget - _adsLerp) * Math.min(1, delta * adsSpeed);
      if (Math.abs(_adsLerp - _adsTarget) < 0.005) _adsLerp = _adsTarget;
      var _zoomFov = (typeof WeaponDetails !== 'undefined' && WeaponDetails.getZoomFov)
        ? WeaponDetails.getZoomFov(cur().type) : FOV_ZOOMED;
      _camera.fov = FOV_DEFAULT + (_zoomFov - FOV_DEFAULT) * _adsLerp;
      _camera.updateProjectionMatrix();
    }

    // Camera recoil recovery: pitch/yaw return after firing stops
    var timeSinceFire = (performance.now() / 1000) - _lastFireTime;
    if (timeSinceFire > RECOIL_RECOVERY_DELAY && _recoilPitchAccum > 0.001 && typeof CameraSystem !== 'undefined') {
      var recoveryAmt = RECOIL_RECOVERY_RATE * delta;
      var pitchRecover = Math.min(_recoilPitchAccum, recoveryAmt);
      CameraSystem.setPitch(CameraSystem.getPitch() - pitchRecover);
      _recoilPitchAccum = Math.max(0, _recoilPitchAccum - pitchRecover);
      // Yaw recovery (gentler, 60% rate)
      var yawRecover = Math.min(Math.abs(_recoilYawAccum), recoveryAmt * 0.6);
      CameraSystem.setYaw(CameraSystem.getYaw() - Math.sign(_recoilYawAccum) * yawRecover);
      _recoilYawAccum *= (1 - delta * 3);
      if (Math.abs(_recoilYawAccum) < 0.001) _recoilYawAccum = 0;
    }
    if (mesh) {
      // Weapon switch bob-up animation
      let switchY = 0;
      if (switchAnimTimer > 0) {
        switchAnimTimer -= delta;
        if (switchAnimTimer < 0) switchAnimTimer = 0;
        // Smooth ease-out: weapon rises from below
        const t = switchAnimTimer / getSwitchDur();
        switchY = -0.12 * t * t;
      }
      // Weapon walk sway (figure-8 pattern)
      let swayX = 0, swayY = 0;
      if (_playerSpeed > 0.5) {
        walkSwayTime += delta * 8;
        const swayAmt = zoomed ? 0.0008 : 0.003;
        swayX = Math.sin(walkSwayTime) * _playerSpeed * swayAmt;
        swayY = Math.sin(walkSwayTime * 2) * _playerSpeed * swayAmt * 0.6;
      } else {
        // Idle micro-sway (breathing)
        walkSwayTime += delta * 1.5;
        swayX = Math.sin(walkSwayTime) * 0.0005;
        swayY = Math.sin(walkSwayTime * 0.7) * 0.0003;
      }
      // Scope sway (drift when zoomed, reduced when holding breath via Shift)
      if (zoomed) {
        _scopeSwayTime += delta;
        var breathMult = _holdingBreath ? 0.1 : 1.0;
        swayX += Math.sin(_scopeSwayTime * 1.3) * 0.004 * breathMult;
        swayY += Math.cos(_scopeSwayTime * 0.9) * 0.003 * breathMult;
      }
      // Sprint weapon lowering (lerp down when sprinting, up when not)
      var isSprint = typeof GameManager !== 'undefined' && GameManager.isSprinting && GameManager.isSprinting() && !zoomed;
      var sprintTargY = isSprint ? -0.08 : 0;
      var sprintTargRotX = isSprint ? 0.3 : 0;
      var sprintTargZ = isSprint ? 0.04 : 0;
      var sprintLerp = 1 - Math.pow(0.001, delta); // ~6.9/s
      _sprintLowerY += (sprintTargY - _sprintLowerY) * sprintLerp;
      _sprintLowerRotX += (sprintTargRotX - _sprintLowerRotX) * sprintLerp;
      _sprintLowerZ += (sprintTargZ - _sprintLowerZ) * sprintLerp;

      // Viewmodel inertia: weapon lags behind camera rotation
      if (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw) {
        var curYaw = CameraSystem.getYaw();
        var curPitch = CameraSystem.getPitch();
        var dY = curYaw - _prevYaw;
        var dP = curPitch - _prevPitch;
        _prevYaw = curYaw;
        _prevPitch = curPitch;
        var wType = cur().type;
        var follow = INERTIA_WEIGHT[wType] || 0.6;
        var inertiaLerp = 1 - Math.pow(1 - follow, delta * 60);
        _inertiaX += dY * 0.4;
        _inertiaY += dP * 0.3;
        _inertiaX *= (1 - inertiaLerp);
        _inertiaY *= (1 - inertiaLerp);
        _inertiaX = Math.max(-INERTIA_MAX, Math.min(INERTIA_MAX, _inertiaX));
        _inertiaY = Math.max(-INERTIA_MAX, Math.min(INERTIA_MAX, _inertiaY));
      }

      // Fire kick decay
      _fireKickRot *= (1 - Math.min(1, delta * 15));
      _fireKickZ *= (1 - Math.min(1, delta * 12));

      // ADS dynamic scale: interpolate from base scale to larger ADS scale
      var _baseScale = 0.62;
      if (cur().type === 'PISTOL') _baseScale = 0.55;
      else if (['LMG','HMG','HMG_HEAVY','MACHINEGUN','MINIGUN'].indexOf(cur().type) >= 0) _baseScale = 0.52;
      var _adsScaleTarget = _baseScale * (1 + _adsLerp * 0.35); // 1.0 in hip, 1.35 in full ADS
      var _curScale = mesh.scale.x;
      var _newScale = _curScale + (_adsScaleTarget - _curScale) * Math.min(1, delta * 8);
      if (Math.abs(_newScale - _curScale) > 0.0001) mesh.scale.set(_newScale, _newScale, _newScale);

      // ADS iron-sight / scope alignment offset
      var _adsOff = (typeof WeaponDetails !== 'undefined' && WeaponDetails.getAdsOffset)
        ? WeaponDetails.getAdsOffset(cur(), _adsLerp) : { x: 0, y: 0, z: 0 };
      mesh.position.x = swayX + _inertiaX - _adsLerp * swayX * 0.8 + _adsOff.x;
      mesh.position.z = recoilOffsetZ + recoilOffset + _sprintLowerZ + _fireKickZ + _adsOff.z;
      mesh.position.y = recoilOffsetY + switchY + swayY + _sprintLowerY + _inertiaY + _adsLerp * 0.03 + _adsOff.y;
      mesh.rotation.x = reloadAnimAngle + _sprintLowerRotX - _fireKickRot;
      // Slight upward tilt in ADS so sights align with camera center
      mesh.rotation.y = _adsLerp * 0.08;
    }

    // Weapon inspect animation
    if (_inspectTimer > 0 && mesh) {
      _inspectTimer -= delta;
      var t = 1 - _inspectTimer / INSPECT_DUR;
      // Phase 1: tilt right (0→0.4) Phase 2: rotate (0.4→0.7) Phase 3: return (0.7→1.0)
      if (t < 0.4) {
        var p = t / 0.4;
        mesh.rotation.z = p * 0.6;
        mesh.rotation.y = p * 0.3;
        mesh.position.x = swayX + p * 0.05;
      } else if (t < 0.7) {
        var p2 = (t - 0.4) / 0.3;
        mesh.rotation.z = 0.6;
        mesh.rotation.y = 0.3 + p2 * 0.5;
        mesh.position.x = swayX + 0.05;
      } else {
        var p3 = (t - 0.7) / 0.3;
        mesh.rotation.z = 0.6 * (1 - p3);
        mesh.rotation.y = 0.8 * (1 - p3);
        mesh.position.x = swayX + 0.05 * (1 - p3);
      }
      if (_inspectTimer <= 0) {
        mesh.rotation.z = 0;
        mesh.rotation.y = 0;
      }
    }

    // Shovel swing animation
    if (swingTimer > 0 && mesh) {
      swingTimer -= delta;
      mesh.rotation.x = -Math.sin((0.2 - swingTimer) / 0.2 * Math.PI) * 0.8;
      if (swingTimer <= 0) mesh.rotation.x = 0;
    }

    // Barrel overheat glow
    if (mesh && typeof CombatExtras !== 'undefined' && CombatExtras.getHeat) {
      var curHeat = CombatExtras.getHeat();
      if (curHeat > 0.3) {
        var glow = (curHeat - 0.3) / 0.7; // 0..1 from 30% to 100% heat
        mesh.traverse(function(child) {
          if (child.isMesh && child.material && child.material.emissive) {
            child.material.emissive.setRGB(glow * 0.8, glow * 0.15, 0);
          }
        });
        mesh._heatGlowing = true;
      } else if (mesh._heatGlowing) {
        mesh.traverse(function(child) {
          if (child.isMesh && child.material && child.material.emissive) {
            child.material.emissive.setRGB(0, 0, 0);
          }
        });
        mesh._heatGlowing = false;
      }
    }

    // WeaponDetails visual animations (bolt, barrel spin, laser, smoke, scope overlay)
    if (typeof WeaponDetails !== 'undefined' && WeaponDetails.update) {
      WeaponDetails.update(delta, mesh, cur(), curState(), _firedThisFrame, zoomed);
    }

    // ── Guided weapon lock-on indicator ──
    if (typeof HUD !== 'undefined' && HUD.showLockOn && _camera) {
      var cw = cur();
      if (cw.homing && zoomed) {
        var _hOrigin = _camera.getWorldPosition(new THREE.Vector3());
        var _hFwd = new THREE.Vector3(0,0,-1).applyQuaternion(_camera.quaternion);
        var _hBest = null, _hBestScore = -Infinity;
        var _hMaxR = 220, _hMinDot = 0.82;
        function _hScore(tp) {
          var hdx = tp.x - _hOrigin.x, hdy = tp.y - _hOrigin.y, hdz = tp.z - _hOrigin.z;
          var hdist = Math.sqrt(hdx*hdx + hdy*hdy + hdz*hdz);
          if (hdist > _hMaxR || hdist < 1) return null;
          var hdot = (hdx*_hFwd.x + hdy*_hFwd.y + hdz*_hFwd.z) / hdist;
          if (hdot < _hMinDot) return null;
          return hdot - hdist * 0.001;
        }
        if (cw.type === 'AA' && typeof DroneSystem !== 'undefined' && DroneSystem.getEnemyDrones) {
          var hdlist = DroneSystem.getEnemyDrones() || [];
          for (var hdi = 0; hdi < hdlist.length; hdi++) {
            var hdr = hdlist[hdi];
            if (!hdr || !hdr.position || hdr.destroyed || hdr.alive === false) continue;
            var hs = _hScore(hdr.position);
            if (hs !== null && hs > _hBestScore) { _hBestScore = hs; _hBest = hdr; }
          }
        } else if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var helist = Enemies.getAll();
          for (var hei = 0; hei < helist.length; hei++) {
            var he = helist[hei];
            if (!he || !he.alive || !he.mesh) continue;
            var hs2 = _hScore(he.mesh.position);
            if (hs2 !== null && hs2 > _hBestScore) { _hBestScore = hs2; _hBest = he; }
          }
        }
        if (_hBest) {
          // Project the locked target to screen space so the HUD can draw a
          // tracking bracket directly over it (instead of a static caption).
          var _hTgtPos = _hBest.mesh ? _hBest.mesh.position : _hBest.position;
          var _hProj = _hTgtPos.clone().project(_camera);
          if (_hProj.z < 1) {
            var _hsx = (_hProj.x * 0.5 + 0.5) * window.innerWidth;
            var _hsy = (-_hProj.y * 0.5 + 0.5) * window.innerHeight;
            HUD.showLockOn(true, _hsx, _hsy);
          } else {
            HUD.showLockOn(true); // target behind camera — fall back to caption
          }
        } else {
          HUD.showLockOn(false);
        }
      } else {
        HUD.showLockOn(false);
      }
    }

    // Reload
    const wep = cur();
    const st  = curState();
    if (st.reloading) {
      st.reloadTimer -= delta;
      // Per-type reload animation
      if (mesh) {
        const progress = 1 - st.reloadTimer / wep.reloadTime;
        // Push reload progress to HUD bar
        if (typeof HUD !== 'undefined' && HUD.showReload) HUD.showReload(true, progress);
        var rType = wep.type;
        var rRotX = 0, rRotZ = 0, rPosY = 0;
        if (rType === 'PISTOL' || rType === 'SMG' || rType === 'SILENT') {
          // Slide rack: quick Z snap at 60%, brief tilt
          if (progress < 0.4) {
            rRotX = progress / 0.4 * 0.15;
            rPosY = -progress / 0.4 * 0.03;
          } else if (progress < 0.6) {
            var t2 = (progress - 0.4) / 0.2;
            rRotZ = Math.sin(t2 * Math.PI) * 0.2;
            rRotX = 0.15;
            rPosY = -0.03;
          } else {
            var t2 = (progress - 0.6) / 0.4;
            rRotX = 0.15 * (1 - t2);
            rPosY = -0.03 * (1 - t2);
          }
        } else if (rType === 'LMG' || rType === 'HMG' || rType === 'HMG_HEAVY' || rType === 'MACHINEGUN' || rType === 'MINIGUN') {
          // Belt feed: slow roll + longer hold at bottom
          if (progress < 0.3) {
            rRotX = progress / 0.3 * (Math.PI / 8);
            rPosY = -progress / 0.3 * 0.06;
          } else if (progress < 0.7) {
            rRotX = Math.PI / 8;
            rPosY = -0.06;
            rRotZ = Math.sin((progress - 0.3) / 0.4 * Math.PI) * 0.12;
          } else {
            var t2 = (progress - 0.7) / 0.3;
            rRotX = Math.PI / 8 * (1 - t2);
            rPosY = -0.06 * (1 - t2);
          }
        } else if (rType === 'SNIPER' || rType === 'AMR') {
          // Bolt action: X rotation + Z offset pull
          if (progress < 0.25) {
            rRotX = progress / 0.25 * 0.1;
          } else if (progress < 0.5) {
            var t2 = (progress - 0.25) / 0.25;
            rRotX = 0.1;
            rRotZ = t2 * 0.25;
          } else if (progress < 0.75) {
            var t2 = (progress - 0.5) / 0.25;
            rRotZ = 0.25 * (1 - t2);
            rRotX = 0.1;
          } else {
            rRotX = 0.1 * (1 - (progress - 0.75) / 0.25);
          }
        } else if (rType === 'AT' || rType === 'ATGM' || rType === 'AT_HEAVY' || rType === 'AT_LIGHT' || rType === 'AA' || rType === 'THERMOBARIC') {
          // Tube load: full Y drop + slow rise
          if (progress < 0.4) {
            rPosY = -progress / 0.4 * 0.1;
            rRotX = progress / 0.4 * (Math.PI / 6);
          } else if (progress < 0.6) {
            rPosY = -0.1;
            rRotX = Math.PI / 6;
          } else {
            var t2 = (progress - 0.6) / 0.4;
            rPosY = -0.1 * (1 - t2);
            rRotX = Math.PI / 6 * (1 - t2);
          }
        } else if (rType === 'SHOTGUN') {
          // Pump action: tilt + Z-pull snap
          if (progress < 0.3) {
            rRotX = progress / 0.3 * 0.12;
          } else if (progress < 0.6) {
            var t2 = (progress - 0.3) / 0.3;
            rRotX = 0.12;
            rRotZ = Math.sin(t2 * Math.PI) * 0.15;
          } else {
            rRotX = 0.12 * (1 - (progress - 0.6) / 0.4);
          }
        } else {
          // Default (ASSAULT, NATO, GRENADE, etc): magazine swap
          if (progress < 0.5) {
            rRotX = progress * 2 * (Math.PI / 12);
          } else {
            rRotX = (1 - (progress - 0.5) * 2) * (Math.PI / 12);
          }
        }
        reloadAnimAngle = rRotX;
        mesh.rotation.x = rRotX + _sprintLowerRotX;
        mesh.rotation.z = (mesh.rotation.z || 0) * 0.5 + rRotZ * 0.5; // smooth Z
        mesh.position.y += rPosY;
      }
      if (st.reloadTimer <= 0) {
        const need = effectiveClipSize(currentIdx) - st.clip;
        const fill = Math.min(need, st.reserve);
        st.clip    += fill;
        st.reserve -= fill;
        st.reloading = false;
        reloadAnimAngle = 0;
        if (mesh) { mesh.rotation.x = _sprintLowerRotX; mesh.rotation.z = 0; }
        HUD.showReload(false);
        HUD.setAmmo(st.clip, st.reserve);
      }
    }
  }

  function reset() {
    states     = WEAPONS.map(makeState);
    currentIdx = 0;
    unlocked   = WEAPONS.map((_, i) => i <= 1 || i === _jammerIdx);
    if (zoomed) exitZoom();
    recoilOffset = 0;
    recoilOffsetY = 0;
    recoilOffsetZ = 0;
    reloadAnimAngle = 0;
    swingTimer = 0;
    switchAnimTimer = 0;
    walkSwayTime = 0;
    _playerSpeed = 0;
    _scopeSwayTime = 0;
    _holdingBreath = false;
    _inspectTimer = 0;
    _sprintLowerY = 0;
    _sprintLowerRotX = 0;
    _sprintLowerZ = 0;
    _adsLerp = 0;
    _adsTarget = 0;
    // Remove lingering projectiles with proper disposal
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (_scene) _scene.remove(projectiles[i].mesh);
      if (projectiles[i].mesh) {
        if (projectiles[i].mesh.geometry) projectiles[i].mesh.geometry.dispose();
        if (projectiles[i].mesh.material) projectiles[i].mesh.material.dispose();
      }
    }
    projectiles.length = 0;
    // Clear smoke clouds with proper disposal
    for (let i = _smokeClouds.length - 1; i >= 0; i--) {
      var sc = _smokeClouds[i];
      if (sc.group) {
        sc.group.children.forEach(function (c) { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
        if (_scene) _scene.remove(sc.group);
      }
    }
    _smokeClouds.length = 0;
    if (typeof WeaponDetails !== 'undefined' && WeaponDetails.clear) WeaponDetails.clear();
    gunMeshes.forEach(function (m, i) { if (m) m.visible = (i === 0); });
    refreshWeaponHud();
  }

  function addAmmo(amount) {
    const wep = cur();
    const st  = curState();
    if (wep.type === 'MELEE') return;
    st.reserve = Math.min(wep.maxReserve, st.reserve + amount);
    HUD.setAmmo(st.clip, st.reserve);
  }

  function forceReload() { startReload(); }
  function setClip(val) { var st = curState(); if (typeof val === 'number') { st.clip = Math.min(val, effectiveClipSize(currentIdx) || val); HUD.setAmmo(st.clip, st.reserve); } }

  function clearJam() {
    const st = curState();
    if (st.jammed) {
      st.jammed = false;
      st.shotsSinceClean = 0;
    }
  }
  function isJammed() { return curState().jammed; }

  function isReloading() { return curState().reloading; }
  function getClip()     { return cur().type === 'MELEE' ? Infinity : curState().clip; }
  function getReserve()  { return cur().type === 'MELEE' ? '—' : curState().reserve; }
  function getClipSize() { return effectiveClipSize(currentIdx) || 0; }
  function getDamage()   {
    var base = effectiveDamage(currentIdx);
    /* WoT-style premium ammo: if equipped + compatible, multiply damage AND
       consume one round. Falls back to 1.0 when no pack equipped or empty. */
    if (typeof Marketplace !== 'undefined' && typeof Marketplace.consumeAmmoShot === 'function') {
      var mult = Marketplace.consumeAmmoShot(cur().type);
      if (mult && mult !== 1.0) return Math.round(base * mult);
    }
    return base;
  }
  function isZoomed()    { return zoomed; }
  function setHoldBreath(v) { _holdingBreath = !!v; }
  function startInspect() { if (_inspectTimer <= 0 && !curState().reloading) _inspectTimer = INSPECT_DUR; }
  function getWeaponName(idx) { return WEAPONS[idx] ? WEAPONS[idx].name : ''; }

  function refillAllAmmo() {
    for (var i = 0; i < states.length; i++) {
      var w = WEAPONS[i];
      if (w && w.type !== 'MELEE') {
        states[i].clip = w.clipSize;
        states[i].reserve = w.maxReserve;
      }
    }
  }

  // ── B24: Unlock next locked weapon ──
  function unlockNext() {
    for (var i = 0; i < WEAPONS.length; i++) {
      if (!unlocked[i]) {
        unlocked[i] = true;
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('🔓 UNLOCKED: ' + WEAPONS[i].name, '#ffdd44');
        }
        if (typeof Feedback !== 'undefined' && Feedback.showWeaponPickup) {
          Feedback.showWeaponPickup(WEAPONS[i].name);
        }
        return i;
      }
    }
    return -1;
  }

  // ── B24: Weapon Attachment System ──
  const ATTACHMENTS = {
    SUPPRESSOR:   { id: 'SUPPRESSOR',   name: 'Suppressor',     damageMult: 0.85, spreadMult: 0.9, sound: 'silent', muzzleFlashMult: 0.25, silent: true, cost: 800,  icon: '🔇' },
    EXT_MAG:      { id: 'EXT_MAG',      name: 'Extended Mag',   clipMult: 1.5,                                                                              cost: 600,  icon: '📦' },
    DRUM_MAG:     { id: 'DRUM_MAG',     name: 'Drum Magazine',  clipMult: 2.5, reloadMult: 1.25,                                                            cost: 1400, icon: '🥁' },
    RAPID_FIRE:   { id: 'RAPID_FIRE',   name: 'Rapid Fire',     fireRateMult: 0.8,                                                                          cost: 900,  icon: '⚡' },
    GRIP:         { id: 'GRIP',         name: 'Foregrip',       recoilMult: 0.7, spreadMult: 0.85,                                                          cost: 500,  icon: '✊' },
    LASER:        { id: 'LASER',        name: 'Laser Sight',    spreadMult: 0.75,                                                                           cost: 400,  icon: '🔴' },
    SCOPE_4X:     { id: 'SCOPE_4X',     name: '4x Scope',       hasScope: true, zoomFOV: 20,                                                                cost: 1100, icon: '🎯' },
    FMJ:          { id: 'FMJ',          name: 'FMJ Rounds',     damageMult: 1.15, penetration: true,                                                        cost: 700,  icon: '💥' },
    SPEED_LOADER: { id: 'SPEED_LOADER', name: 'Speed Loader',   reloadMult: 0.7,                                                                            cost: 600,  icon: '🔄' },
    HEAVY_BARREL: { id: 'HEAVY_BARREL', name: 'Heavy Barrel',   damageMult: 1.20, recoilMult: 1.10, fireRateMult: 1.05,                                     cost: 1000, icon: '🛢' },
  };

  // Compatibility: which attachments suit which weapon TYPE.
  // Suppressors only on subsonic-friendly types (no rockets, no shotguns of huge
  // bore, no AT/AGS/HMG/AA/MELEE etc.). Drum mags only on auto fed.
  const ATTACHMENT_COMPAT = {
    SUPPRESSOR:   ['PISTOL','ASSAULT','NATO','NATO_HEAVY','SMG','SNIPER','AMR','SILENT','MACHINEGUN','HMG','HMG_HEAVY','LMG'],
    EXT_MAG:      ['PISTOL','ASSAULT','NATO','NATO_HEAVY','SMG','LMG','MACHINEGUN','HMG','HMG_HEAVY','MINIGUN','GATLING','SNIPER','AMR','SILENT','SHOTGUN'],
    DRUM_MAG:     ['ASSAULT','NATO','NATO_HEAVY','SMG','LMG','MACHINEGUN','HMG','HMG_HEAVY'],
    RAPID_FIRE:   ['ASSAULT','NATO','NATO_HEAVY','SMG','LMG','MACHINEGUN','HMG','HMG_HEAVY','MINIGUN','GATLING','PISTOL','SILENT','SHOTGUN'],
    GRIP:         ['ASSAULT','NATO','NATO_HEAVY','SMG','LMG','MACHINEGUN','HMG','HMG_HEAVY','SHOTGUN','SNIPER','AMR'],
    LASER:        ['PISTOL','ASSAULT','NATO','NATO_HEAVY','SMG','SHOTGUN','SILENT'],
    SCOPE_4X:     ['ASSAULT','NATO','NATO_HEAVY','SMG','LMG','MACHINEGUN','SNIPER','AMR','SILENT'],
    FMJ:          ['PISTOL','ASSAULT','NATO','NATO_HEAVY','SMG','LMG','MACHINEGUN','HMG','HMG_HEAVY','SNIPER','AMR','SILENT','SHOTGUN','MINIGUN','GATLING'],
    SPEED_LOADER: ['PISTOL','ASSAULT','NATO','NATO_HEAVY','SMG','LMG','MACHINEGUN','HMG','HMG_HEAVY','SNIPER','AMR','SILENT','SHOTGUN'],
    HEAVY_BARREL: ['SNIPER','AMR','SILENT','LMG','MACHINEGUN','HMG','HMG_HEAVY','ASSAULT','NATO','NATO_HEAVY'],
  };

  function isCompatible(weaponIdx, attachId) {
    var w = WEAPONS[weaponIdx];
    if (!w) return false;
    var list = ATTACHMENT_COMPAT[attachId];
    return list && list.indexOf(w.type) >= 0;
  }
  function getCompatibleAttachments(weaponIdx) {
    var out = [];
    for (var key in ATTACHMENTS) {
      if (isCompatible(weaponIdx, key)) out.push(ATTACHMENTS[key]);
    }
    return out;
  }

  // ── Weapon Skins (cosmetic + premium upgrades) ──
  // Each skin defines tint colors mapped onto the procedural mesh.  metal =
  // primary body, accent = highlight (rails, sights), wood = grips/stock, glow
  // = optional emissive for premium tiers.
  const SKINS = {
    DEFAULT:   { id: 'DEFAULT',   name: 'Standard',          rarity: 'common',    cost: 0,    icon: '⬜', metal: null,     accent: null,     wood: null     },
    BLACK:     { id: 'BLACK',     name: 'Tactical Black',    rarity: 'common',    cost: 200,  icon: '⬛', metal: 0x111111, accent: 0x222222, wood: 0x222222 },
    DESERT:    { id: 'DESERT',    name: 'Desert Tan',        rarity: 'uncommon',  cost: 600,  icon: '🏜', metal: 0xc7a679, accent: 0x8a7146, wood: 0x6b4d2a },
    WOODLAND:  { id: 'WOODLAND',  name: 'Woodland Camo',     rarity: 'uncommon',  cost: 600,  icon: '🌲', metal: 0x4a5d3a, accent: 0x2c3a22, wood: 0x3d2e1b },
    URBAN:     { id: 'URBAN',     name: 'Urban Camo',        rarity: 'uncommon',  cost: 600,  icon: '🏙', metal: 0x6b6e72, accent: 0x33363a, wood: 0x2a2c2e },
    JUNGLE:    { id: 'JUNGLE',    name: 'Jungle Tigerstripe', rarity: 'uncommon', cost: 700,  icon: '🐅', metal: 0x445d2a, accent: 0x1a1a0d, wood: 0x2d1f0d },
    ARCTIC:    { id: 'ARCTIC',    name: 'Arctic White',      rarity: 'uncommon',  cost: 700,  icon: '❄',  metal: 0xe8eef2, accent: 0xb0b8c0, wood: 0xc8cfd3 },
    DIGITAL:   { id: 'DIGITAL',   name: 'Digital Pixel',     rarity: 'rare',      cost: 1000, icon: '🔳', metal: 0x556680, accent: 0x223344, wood: 0x33445a },
    REDSTAR:   { id: 'REDSTAR',   name: 'Red Star',          rarity: 'rare',      cost: 1200, icon: '⭐', metal: 0x551111, accent: 0xcc1111, wood: 0x331111 },
    CHROME:    { id: 'CHROME',    name: 'Chrome',            rarity: 'epic',      cost: 1800, icon: '🪙', metal: 0xeeeef2, accent: 0xb8bfc8, wood: 0x4a4a4e, metalness: 1.0, roughness: 0.15 },
    GOLD:      { id: 'GOLD',      name: 'Gold Plated',       rarity: 'legendary', cost: 3000, icon: '🌟', metal: 0xf2c14a, accent: 0xb88b1f, wood: 0x3a2410, metalness: 1.0, roughness: 0.20, glow: 0xffaa00 },
    OBSIDIAN:  { id: 'OBSIDIAN',  name: 'Obsidian',          rarity: 'epic',      cost: 1800, icon: '🖤', metal: 0x0a0a14, accent: 0x141422, wood: 0x0a0a14, metalness: 0.7, roughness: 0.25 },
    FIRE:      { id: 'FIRE',      name: 'Fire Inferno',      rarity: 'legendary', cost: 3000, icon: '🔥', metal: 0xc23a0c, accent: 0xff7a1a, wood: 0x3a0c0c, glow: 0xff4400 },
    NEON:      { id: 'NEON',      name: 'Neon Cyber',        rarity: 'legendary', cost: 3000, icon: '💜', metal: 0x1a1a3a, accent: 0x9a44ff, wood: 0x2a1a3a, glow: 0xaa44ff },
    PRESTIGE:  { id: 'PRESTIGE',  name: 'Founder Prestige',  rarity: 'mythic',    cost: 6000, icon: '👑', metal: 0xd9b347, accent: 0xff2a2a, wood: 0x1a0a0a, metalness: 1.0, roughness: 0.10, glow: 0xff5500 },
  };

  // Storage: { weaponIdx: skinId }
  let weaponSkins = {};

  // ── Effective-stat helpers (applied at firing/reload time) ──
  function _stats(weaponIdx) {
    var w = WEAPONS[weaponIdx];
    if (!w) return null;
    var s = { damage: w.damage, spread: w.spread, fireRate: w.fireRate,
              clipSize: w.clipSize, reloadTime: w.reloadTime, recoilY: w.recoilY,
              silent: false, muzzleFlashMult: 1 };
    var atts = weaponAttachments[weaponIdx] || [];
    for (var i = 0; i < atts.length; i++) {
      var a = ATTACHMENTS[atts[i]]; if (!a) continue;
      if (a.damageMult)        s.damage     = Math.round(s.damage * a.damageMult);
      if (a.spreadMult)        s.spread    *= a.spreadMult;
      if (a.fireRateMult)      s.fireRate  *= a.fireRateMult;
      if (a.clipMult)          s.clipSize   = Math.max(1, Math.floor(s.clipSize * a.clipMult));
      if (a.reloadMult)        s.reloadTime *= a.reloadMult;
      if (a.recoilMult)        s.recoilY   *= a.recoilMult;
      if (a.silent)            s.silent     = true;
      if (a.muzzleFlashMult != null) s.muzzleFlashMult = Math.min(s.muzzleFlashMult, a.muzzleFlashMult);
    }
    return s;
  }
  function _curStats() { return _stats(currentIdx); }
  function effectiveClipSize(idx)  { var s = _stats(idx == null ? currentIdx : idx); return s ? s.clipSize   : 0; }
  function effectiveReloadTime(idx){ var s = _stats(idx == null ? currentIdx : idx); return s ? s.reloadTime : 0; }
  function effectiveFireRate(idx)  { var s = _stats(idx == null ? currentIdx : idx); return s ? s.fireRate   : 0; }
  function effectiveDamage(idx)    { var s = _stats(idx == null ? currentIdx : idx); return s ? s.damage     : 0; }
  function effectiveSpread(idx)    { var s = _stats(idx == null ? currentIdx : idx); return s ? s.spread     : 0; }
  function isSilenced(idx)         { var s = _stats(idx == null ? currentIdx : idx); return !!(s && s.silent); }
  function getMuzzleFlashMult(idx) { var s = _stats(idx == null ? currentIdx : idx); return s ? s.muzzleFlashMult : 1; }

  // ── Skin equip + mesh tint ──
  function setWeaponSkin(weaponIdx, skinId) {
    if (!SKINS[skinId]) return false;
    weaponSkins[weaponIdx] = skinId;
    if (gunMeshes && gunMeshes[weaponIdx]) applySkinToMesh(gunMeshes[weaponIdx], skinId);
    return true;
  }
  function getWeaponSkin(weaponIdx) { return weaponSkins[weaponIdx] || 'DEFAULT'; }

  function applySkinToMesh(mesh, skinId) {
    if (!mesh || !skinId) return;
    var skin = SKINS[skinId];
    if (!skin || skinId === 'DEFAULT') return;
    mesh.traverse(function (child) {
      if (!child.material || !child.material.color) return;
      var mat = child.material;
      // Don't tint glass/scope-lens (transparent) or very dark eye dots.
      if (mat.transparent && mat.opacity < 0.7) return;
      var name = (child.name || '').toLowerCase();
      var c = mat.color.getHex();
      // Heuristic: wood-toned (browns) → wood color; otherwise → metal/accent.
      var r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff;
      var isWoody = (r > g && g > b && r - b > 30 && r < 200);
      var target = null;
      if (isWoody && skin.wood != null)                target = skin.wood;
      else if (skin.metal != null)                      target = skin.metal;
      // Accent for very small parts (rails, sight blades) — name hint
      if (skin.accent != null && (name.indexOf('rail') >= 0 || name.indexOf('sight') >= 0)) {
        target = skin.accent;
      }
      if (target != null) mat.color.setHex(target);
      if (skin.metalness != null && 'metalness' in mat) mat.metalness = skin.metalness;
      if (skin.roughness != null && 'roughness' in mat) mat.roughness = skin.roughness;
      if (skin.glow != null && 'emissive' in mat) {
        mat.emissive = new THREE.Color(skin.glow);
        mat.emissiveIntensity = 0.35;
      }
    });
  }


  let weaponAttachments = {}; // { weaponIdx: [attachmentId, ...] }

  // ── Blood-stain layer on the current weapon mesh ────────────────────
  // Each kill paints a small red sprite on the gun (handle / barrel).
  // Stains slowly fade after ~30 s without further blood.  Kept on the
  // weapon group so it persists across attacks but vanishes if the weapon
  // is swapped out.
  let _bloodStainSprites = [];   // { mesh, life }
  let _bloodStainGeo = null;
  function _initBloodGeo() {
    if (_bloodStainGeo) return;
    _bloodStainGeo = new THREE.PlaneGeometry(1, 1);
  }
  function markBlooded(amount) {
    try {
      var g = gunMeshes && gunMeshes[currentIdx];
      if (!g) return;
      _initBloodGeo();
      // Pick a child mesh that's most likely a barrel/blade — the
      // longest-axis box.  Fallback to the gun root.
      var host = g;
      var bestLen = 0;
      g.traverse(function (c) {
        if (!c.geometry || !c.geometry.boundingBox) {
          if (c.geometry && c.geometry.computeBoundingBox) try { c.geometry.computeBoundingBox(); } catch(e){}
        }
        if (c.geometry && c.geometry.boundingBox) {
          var s = c.geometry.boundingBox.getSize(new THREE.Vector3());
          var ml = Math.max(s.x, s.y, s.z);
          if (ml > bestLen) { bestLen = ml; host = c; }
        }
      });
      var n = 1 + Math.floor(Math.min(3, (amount || 10) / 30));
      for (var i = 0; i < n; i++) {
        var col = Math.random() < 0.4 ? 0x550000 : 0x880000;
        var mat = new THREE.MeshBasicMaterial({
          color: col, transparent: true, opacity: 0.85,
          depthWrite: false, side: THREE.DoubleSide,
        });
        var sp = new THREE.Mesh(_bloodStainGeo, mat);
        var sz = 0.018 + Math.random() * 0.025;
        sp.scale.set(sz, sz, sz);
        // Random spot on host mesh
        sp.position.set(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.10
        );
        sp.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        host.add(sp);
        _bloodStainSprites.push({ mesh: sp, mat: mat, life: 30, host: host });
      }
      // Cap accumulated stains
      while (_bloodStainSprites.length > 24) {
        var old = _bloodStainSprites.shift();
        if (old.host && old.mesh) try { old.host.remove(old.mesh); } catch(e){}
        if (old.mat) try { old.mat.dispose(); } catch(e){}
      }
    } catch (e) {}
  }
  function _updateBloodStains(delta) {
    for (var i = _bloodStainSprites.length - 1; i >= 0; i--) {
      var s = _bloodStainSprites[i];
      s.life -= delta;
      if (s.life <= 5 && s.mat) s.mat.opacity = Math.max(0, (s.life / 5) * 0.85);
      if (s.life <= 0) {
        if (s.host && s.mesh) try { s.host.remove(s.mesh); } catch(e){}
        if (s.mat) try { s.mat.dispose(); } catch(e){}
        _bloodStainSprites.splice(i, 1);
      }
    }
  }

  function addAttachment(weaponIdx, attachId) {
    if (!ATTACHMENTS[attachId]) return false;
    if (!isCompatible(weaponIdx, attachId)) return false;
    if (!weaponAttachments[weaponIdx]) weaponAttachments[weaponIdx] = [];
    if (weaponAttachments[weaponIdx].length >= 3) return false; // max 3 attachments
    if (weaponAttachments[weaponIdx].indexOf(attachId) >= 0) return false; // already has it
    // Mutually exclusive: EXT_MAG and DRUM_MAG share a slot
    if (attachId === 'EXT_MAG' && weaponAttachments[weaponIdx].indexOf('DRUM_MAG') >= 0) return false;
    if (attachId === 'DRUM_MAG' && weaponAttachments[weaponIdx].indexOf('EXT_MAG') >= 0) return false;
    weaponAttachments[weaponIdx].push(attachId);
    // If an extended mag was just added and current clip is at base capacity,
    // refill into the new larger capacity from reserve.
    var st = states[weaponIdx];
    if (st && (attachId === 'EXT_MAG' || attachId === 'DRUM_MAG')) {
      var newCap = effectiveClipSize(weaponIdx);
      var fill = Math.min(newCap - st.clip, st.reserve);
      if (fill > 0) { st.clip += fill; st.reserve -= fill; }
    }
    return true;
  }

  function removeAttachment(weaponIdx, attachId) {
    if (!weaponAttachments[weaponIdx]) return;
    var idx = weaponAttachments[weaponIdx].indexOf(attachId);
    if (idx >= 0) weaponAttachments[weaponIdx].splice(idx, 1);
  }

  function getAttachments(weaponIdx) {
    return (weaponAttachments[weaponIdx] || []).map(function(id) { return ATTACHMENTS[id]; });
  }

  function getModifiedStats(weaponIdx) {
    var w = WEAPONS[weaponIdx];
    if (!w) return null;
    var stats = { damage: w.damage, spread: w.spread, fireRate: w.fireRate, clipSize: w.clipSize, reloadTime: w.reloadTime, recoilY: w.recoilY };
    var attachs = weaponAttachments[weaponIdx] || [];
    for (var i = 0; i < attachs.length; i++) {
      var a = ATTACHMENTS[attachs[i]];
      if (!a) continue;
      if (a.damageMult) stats.damage = Math.round(stats.damage * a.damageMult);
      if (a.spreadMult) stats.spread *= a.spreadMult;
      if (a.fireRateMult) stats.fireRate *= a.fireRateMult;
      if (a.clipMult) stats.clipSize = Math.floor(stats.clipSize * a.clipMult);
      if (a.reloadMult) stats.reloadTime *= a.reloadMult;
      if (a.recoilMult) stats.recoilY *= a.recoilMult;
    }
    return stats;
  }

  // ── WeaponDetails polyfill (ADS offsets, zoom FOV, recoiling parts) ──
  // If weapon-details.js is not loaded, this polyfill ensures ADS / zoom works.
  if (typeof window !== 'undefined' && typeof window.WeaponDetails === 'undefined') {
    window.WeaponDetails = {
      // ADS offset: moves gun from hip-fire position to sight alignment.
      // Returns {x,y,z} added to mesh.position in update().
      getAdsOffset: function (wep, lerp) {
        if (!wep || lerp <= 0) return { x: 0, y: 0, z: 0 };
        var t = lerp;
        var o = { PISTOL: { x: -0.14, y: 0.055, z: 0.035 },
                  RIFLE: { x: -0.11, y: 0.045, z: 0.025 },
                  ASSAULT_RIFLE: { x: -0.11, y: 0.045, z: 0.025 },
                  SMG: { x: -0.12, y: 0.050, z: 0.030 },
                  LMG: { x: -0.09, y: 0.040, z: 0.020 },
                  HMG: { x: -0.08, y: 0.035, z: 0.015 },
                  HMG_HEAVY: { x: -0.08, y: 0.035, z: 0.015 },
                  MACHINEGUN: { x: -0.09, y: 0.040, z: 0.020 },
                  MINIGUN: { x: -0.08, y: 0.035, z: 0.015 },
                  SNIPER: { x: -0.12, y: 0.060, z: 0.030 },
                  LAUNCHER: { x: -0.10, y: 0.040, z: 0.025 },
                  AT: { x: -0.10, y: 0.040, z: 0.025 },
                  ATGM: { x: -0.10, y: 0.040, z: 0.025 },
                  AT_HEAVY: { x: -0.10, y: 0.040, z: 0.025 },
                  AT_LIGHT: { x: -0.10, y: 0.040, z: 0.025 },
                  AA: { x: -0.10, y: 0.040, z: 0.025 },
                  SHOTGUN: { x: -0.11, y: 0.045, z: 0.025 },
                  MELEE: { x: 0, y: 0, z: 0 },
                  GRENADE: { x: -0.08, y: 0.035, z: 0.020 },
                  THERMOBARIC: { x: -0.08, y: 0.035, z: 0.020 },
                  SMOKE: { x: -0.08, y: 0.035, z: 0.020 },
                  FLASHBANG: { x: -0.08, y: 0.035, z: 0.020 },
                  EXPLOSIVE: { x: -0.08, y: 0.035, z: 0.020 },
                  MINE: { x: -0.08, y: 0.035, z: 0.020 },
                  INCENDIARY: { x: -0.08, y: 0.035, z: 0.020 },
                };
        var base = o[wep.type] || o.RIFLE;
        return { x: base.x * t, y: base.y * t, z: base.z * t };
      },
      // Per-weapon zoom FOV (degrees). Lower = more zoom.
      getZoomFov: function (type) {
        var fovs = { PISTOL: 35, RIFLE: 25, ASSAULT_RIFLE: 25, SMG: 30, LMG: 28, HMG: 28,
                     HMG_HEAVY: 26, MACHINEGUN: 28, MINIGUN: 30, SNIPER: 12, LAUNCHER: 30,
                     AT: 30, ATGM: 20, AT_HEAVY: 18, AT_LIGHT: 32, AA: 25, SHOTGUN: 30,
                     MELEE: 75, GRENADE: 40, THERMOBARIC: 35, SMOKE: 40, FLASHBANG: 40,
                     EXPLOSIVE: 40, MINE: 40, INCENDIARY: 40 };
        return fovs[type] || 25;
      },
      // Animate recoiling parts (bolt, slide) on fire and reload.
      update: function (delta, mesh, wep, state, fired, zoomed) {
        if (!mesh || !mesh.userData || !mesh.userData._anim) return;
        var anim = mesh.userData._anim;
        var speed = 12;
        // Bolt recoil (rifles, LMGs, etc.)
        if (anim.bolt && anim.boltHome != null) {
          var target = fired ? anim.boltHome - 0.045 : anim.boltHome;
          var cur = anim.bolt.position.z;
          anim.bolt.position.z += (target - cur) * Math.min(1, delta * speed);
        }
        // Slide recoil (pistols)
        if (anim.slide && anim.slideHome != null) {
          var target2 = fired ? anim.slideHome - 0.035 : anim.slideHome;
          var cur2 = anim.slide.position.z;
          anim.slide.position.z += (target2 - cur2) * Math.min(1, delta * speed);
        }
      },
      // Fallback enhanceMesh (does nothing but prevents errors)
      enhanceMesh: function (mesh, wep, idx) {},
      // Fallback upgradeMaterials (does nothing)
      upgradeMaterials: function (mesh) {},
    };
  }

  return {
    createGunMesh,
    createMuzzleFlash,
    tryFire,
    update,
    reset,
    addAmmo,
    forceReload,
    reload: forceReload,
    setClip,
    cancelReload,
    isReloading,
    getClip,
    getReserve,
    getClipSize,
    getDamage,
    switchTo,
    setHolstered,
    isHolstered,
    switchNext,
    switchPrev,
    unlockWeapon,
    refillAllAmmo,
    handleRightDown,
    handleRightUp,
    exitZoom,
    isZoomed,
    toggleFlashlight,
    setPlayerSpeed: function(s) { _playerSpeed = s; },
    setHoldBreath,
    getRecoilAccum: function() { return _recoilPitchAccum; },
    startInspect,
    isInSmoke: isInSmoke,
    getWeaponCount: function () { return WEAPONS.length; },
    unlockForStage: unlockForStage,
    getCurrentIdx:  function () { return currentIdx; },
    getCurrentType: function () { return cur().type; },
    getCurrentId:   function () { return cur().id; },
    getCurrentName: function () { return cur().name; },
    getCurrent:     function () { return cur(); },
    getState:       function () { return curState(); },
    getWeaponName:  getWeaponName,
    getWeaponInfo:  function (i) {
      if (!WEAPONS[i]) return null;
      const s = states[i];
      return { id: WEAPONS[i].id, name: WEAPONS[i].name, damage: WEAPONS[i].damage, clip: s.clip, reserve: s.reserve, type: WEAPONS[i].type };
    },
    getWeaponDef: function (i) { return WEAPONS[i] || null; },
    isUnlocked:     function (i) { return !!unlocked[i]; },
    getUnlockedList: function () {
      var list = [];
      for (var i = 0; i < unlocked.length; i++) { if (unlocked[i]) list.push(i); }
      return list;
    },
    lockWeapon:     function (i) {
      if (i < 2) return;  // can't lock starter weapons
      unlocked[i] = false;
      if (currentIdx === i) switchTo(0);
      refreshWeaponHud();
    },
    getWeaponState: function (i) {
      if (!states[i]) return null;
      return { clip: states[i].clip, reserve: states[i].reserve };
    },
    removeAmmo:     function (idx, amount) {
      if (!states[idx]) return;
      states[idx].reserve = Math.max(0, states[idx].reserve - amount);
      if (idx === currentIdx) HUD.setAmmo(states[idx].clip, states[idx].reserve);
    },
    getWeaponId:    function (i) { return WEAPONS[i] ? WEAPONS[i].id : ''; },
    didFire:        function () { return _firedThisFrame; },
    applyRecoil:    applyRecoil,
    applyLandingBob: applyLandingBob,
    clearJam:       clearJam,
    isJammed:       isJammed,
    getBlastRadius: function () { return cur().blastRadius || 0; },
    setOnTerrainDig: setOnTerrainDig,
    setOnTerrainShot: setOnTerrainShot,
    // B24 exports
    unlockNext:       unlockNext,
    ATTACHMENTS:      ATTACHMENTS,
    ATTACHMENT_COMPAT: ATTACHMENT_COMPAT,
    addAttachment:    addAttachment,
    removeAttachment: removeAttachment,
    getAttachments:   getAttachments,
    getModifiedStats: getModifiedStats,
    isCompatible:           isCompatible,
    getCompatibleAttachments: getCompatibleAttachments,
    effectiveClipSize:      effectiveClipSize,
    effectiveReloadTime:    effectiveReloadTime,
    effectiveFireRate:      effectiveFireRate,
    effectiveDamage:        effectiveDamage,
    effectiveSpread:        effectiveSpread,
    isSilenced:             isSilenced,
    getMuzzleFlashMult:     getMuzzleFlashMult,
    SKINS:                  SKINS,
    setWeaponSkin:          setWeaponSkin,
    getWeaponSkin:          getWeaponSkin,
    applySkinToMesh:        applySkinToMesh,
    markBlooded:            markBlooded,
    refreshHud:             refreshWeaponHud,
    // AP Ammo (premium): more penetration, larger damage on hit
    addAPAmmo: function (n) {
      try { window._apAmmo = (window._apAmmo || 0) + (n | 0); } catch (e) {}
      try { window.HUD && window.HUD.showToast && window.HUD.showToast('🛡 +' + n + ' AP rounds', 1800, '#88ddff'); } catch (e) {}
    },
    getAPAmmo: function () { return window._apAmmo || 0; },
    consumeAPAmmo: function (n) {
      var have = window._apAmmo || 0;
      if (have <= 0) return false;
      window._apAmmo = Math.max(0, have - (n | 1));
      return true;
    },
    // Unlock a random not-yet-owned weapon (used by lottery prize)
    unlockRandomWeapon: function () {
      var locked = [];
      for (var i = 0; i < unlocked.length; i++) { if (!unlocked[i]) locked.push(i); }
      if (!locked.length) return -1;
      var pick = locked[Math.floor(Math.random() * locked.length)];
      unlocked[pick] = true;
      try {
        var wname = (WEAPONS[pick] && WEAPONS[pick].name) || ('Weapon #' + pick);
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('🎁 New weapon unlocked: ' + wname, 3500, '#00ff88');
      } catch (e) {}
      return pick;
    },
  };
})();

// Quick weapon swap: swap to last used weapon.
// This must be wired after the Weapons singleton exists to avoid TDZ crashes during script load.
let _lastWeaponIdx = 0;
function quickSwapLast() {
  if (typeof Weapons === 'undefined' || !Weapons.getCurrentIdx || !Weapons.switchTo) return;
  const cur = Weapons.getCurrentIdx();
  Weapons.switchTo(_lastWeaponIdx);
  _lastWeaponIdx = cur;
}

if (typeof Weapons !== 'undefined' && typeof Weapons.switchTo === 'function' && !Weapons.quickSwapLast) {
  const _origSwitchTo = Weapons.switchTo;
  Weapons.switchTo = function(idx) {
    if (typeof Weapons.getCurrentIdx === 'function') {
      _lastWeaponIdx = Weapons.getCurrentIdx();
    }
    return _origSwitchTo.call(this, idx);
  };
  Weapons.quickSwapLast = quickSwapLast;
}

if (typeof window !== 'undefined') {
  window.Weapons = Weapons;
}
