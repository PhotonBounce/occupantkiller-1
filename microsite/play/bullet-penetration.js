// ============================================================
//  bullet-penetration.js — Bullet penetration through materials
//  Bullets from high-power weapons pass through glass, wood,
//  plaster, brick, concrete, and metal depending on rating.
//  Public API: init, checkPenetration, getPenetrationBonus
// ============================================================
window.BulletPenetration = (function () {
  'use strict';

  /* ── Penetration ratings by weapon type ───────────────────── */
  var PENETRATION_RATING = {
    'PISTOL':      1,
    'SHOTGUN':     1,
    'MELEE':       0,
    'ASSAULT':     2,   // AK74, AK12, M4A1, AKS74U
    'NATO':        2,   // SCARH, etc.
    'NATO_HEAVY':  2,
    'SMG':         1,
    'SNIPER':      3,   // SVD, BARRETTM82, etc.
    'AMR':         5,   // Anti-materiel rifle (BARRETTM82 type AMR)
    'LMG':         3,
    'HMG':         3,
    'HMG_HEAVY':   3,
    'MACHINEGUN':  3,
    'MINIGUN':     2,
    'GATLING':     2,
    'SILENT':      2,
    'AT':          0,   // Rockets — no penetration, they explode
    'AT_HEAVY':    0,
    'AT_LIGHT':    0,
    'ATGM':        0,
    'AA':          0,
    'GRENADE':     0,
    'THERMOBARIC': 0,
    'MINE':        0,
    'SMOKE':       0,
    'FLASHBANG':   0,
    'INCENDIARY':  0,
    'EXPLOSIVE':   0,
    'JAMMER':      0
  };

  /* Per-weapon-ID overrides for special cases */
  var WEAPON_ID_RATING = {
    'BARRETTM82': 5,   // .50 BMG — penetrates everything short of stone
    'AIAX':       5,   // .338 Lapua precision rifle
    'AK74':       2,
    'AK12':       2,
    'AKS74U':     2,
    'M4A1':       2,
    'SCARH':      2,
    'SVD':        3,
    'RPK74':      3,
    'PKM':        3,
    'MG3':        3,
    'DSHK':       4,
    'MAKAROV':    1,
    'GLOCK':      1,
    'DOUBLEBARREL': 1,
    'KS23':       1,
    'MP5':        1,
    'P90':        1,
    'VSS':        2,
    'CROSSBOW':   1,
    'MINIGUN':    2,
    'GATLING':    2
  };

  /* ── Material hardness thresholds ─────────────────────────── */
  /*
   * A bullet penetrates if its rating > material hardness.
   * velocity multiplier = how much speed (and thus damage) remains.
   */
  var MATERIAL_HARDNESS = {
    'GLASS':    { threshold: 0.5, velocityMult: 0.85, scatter: 3 },
    'WOOD':     { threshold: 1,   velocityMult: 0.70, scatter: 3 },
    'PLASTER':  { threshold: 1,   velocityMult: 0.60, scatter: 3 },
    'BRICK':    { threshold: 3,   velocityMult: 0.40, scatter: 4 },
    'CONCRETE': { threshold: 4,   velocityMult: 0.30, scatter: 4 },
    'METAL':    { threshold: 5,   velocityMult: 0.20, scatter: 5 },
    'STONE':    { threshold: 99,  velocityMult: 0,    scatter: 0 }  // impenetrable
  };

  /* ── Map BLOCK IDs to material names ─────────────────────── */
  var BLOCK_MATERIAL = {
    4:  'WOOD',       // BLOCK.WOOD
    5:  'METAL',      // BLOCK.METAL
    3:  'STONE',      // BLOCK.STONE
    9:  'CONCRETE',   // BLOCK.CONCRETE
    10: 'BRICK',      // BLOCK.BRICK
    11: 'GLASS',      // BLOCK.GLASS
    20: 'PLASTER',    // BLOCK.PLASTER
    14: 'CONCRETE',   // BLOCK.REINFORCED (treat as concrete)
    17: 'CONCRETE',   // BLOCK.SANDBAG
    16: 'STONE',      // BLOCK.RUBBLE
    24: 'STONE',      // BLOCK.CERAMIC
    25: 'STONE',      // BLOCK.SHINGLE
    19: 'WOOD',       // BLOCK.ROOFTILE
    35: 'CONCRETE',   // BLOCK.BRIDGE
    36: 'CONCRETE'    // BLOCK.TUNNEL
  };

  /* ── Bullet hole decal pool ───────────────────────────────── */
  var POOL_SIZE    = 30;
  var _pool        = [];   // array of DOM div elements
  var _poolIndex   = 0;    // next slot to reuse (ring buffer)
  var _poolReady   = false;

  /* ── Private state ────────────────────────────────────────── */
  var _camera      = null;
  var _hudElem     = null;   // container for "PENETRATION" flash text
  var _hudTimer    = null;   // setTimeout handle

  /* ── Exported globals ─────────────────────────────────────── */
  window._penetrationDamageBonus = window._penetrationDamageBonus || 0;
  window._lastPenetrationCount   = window._lastPenetrationCount   || 0;

  /* ── Hook placeholder ─────────────────────────────────────── */
  /* game-manager.js can overwrite _onBulletPenetration to react  */
  window._onBulletPenetration = window._onBulletPenetration || null;

  // ── Initialise ──────────────────────────────────────────────
  function init(camera) {
    _camera = camera || null;
    _buildDecalPool();
    _buildHudElement();
  }

  // ── Build DOM pool of bullet-hole decals ────────────────────
  function _buildDecalPool() {
    if (_poolReady) return;
    var container = document.getElementById('bullet-hole-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bullet-hole-container';
      container.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:50',
        'overflow:hidden'
      ].join(';');
      document.body.appendChild(container);
    }

    for (var i = 0; i < POOL_SIZE; i++) {
      var el = document.createElement('div');
      el.className = 'bullet-hole';
      el.style.cssText = [
        'position:absolute',
        'width:3px',
        'height:3px',
        'border-radius:50%',
        'background:radial-gradient(circle,#3d1f00 40%,#6b3a1f 70%,transparent 100%)',
        'box-shadow:0 0 2px rgba(0,0,0,0.8)',
        'transform:translate(-50%,-50%)',
        'display:none',
        'transition:opacity 1s ease'
      ].join(';');
      container.appendChild(el);
      _pool.push(el);
    }
    _poolReady = true;
  }

  // ── Build HUD element for "PENETRATION" flash ───────────────
  function _buildHudElement() {
    if (_hudElem) return;
    _hudElem = document.createElement('div');
    _hudElem.id = 'penetration-hud-msg';
    _hudElem.style.cssText = [
      'position:fixed',
      'bottom:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:11px',
      'letter-spacing:3px',
      'color:#aaa',
      'text-transform:uppercase',
      'pointer-events:none',
      'z-index:60',
      'display:none',
      'text-shadow:0 0 4px rgba(0,0,0,0.9)',
      'transition:opacity 0.3s ease'
    ].join(';');
    _hudElem.textContent = 'PENETRATION';
    document.body.appendChild(_hudElem);
  }

  // ── Show "PENETRATION" text briefly ────────────────────────
  function _showPenetrationHud() {
    if (!_hudElem) return;
    if (_hudTimer) clearTimeout(_hudTimer);
    _hudElem.style.display  = 'block';
    _hudElem.style.opacity  = '1';
    _hudTimer = setTimeout(function () {
      _hudElem.style.opacity = '0';
      setTimeout(function () {
        if (_hudElem) _hudElem.style.display = 'none';
      }, 320);
    }, 800);
  }

  // ── Project world position to screen coords (2D) ───────────
  function _worldToScreen(worldPos) {
    if (!_camera || typeof THREE === 'undefined') return null;
    var vec = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    vec.project(_camera);
    var x = ( vec.x * 0.5 + 0.5) * window.innerWidth;
    var y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
    // discard if behind camera or off screen
    if (vec.z > 1) return null;
    if (x < -20 || x > window.innerWidth  + 20) return null;
    if (y < -20 || y > window.innerHeight + 20) return null;
    return { x: x, y: y };
  }

  // ── Spawn a bullet-hole decal at world position ─────────────
  function _spawnDecal(worldPos) {
    if (!_poolReady) _buildDecalPool();
    var screen = _worldToScreen(worldPos);
    if (!screen) return;

    var el = _pool[_poolIndex];
    _poolIndex = (_poolIndex + 1) % POOL_SIZE;

    el.style.display = 'block';
    el.style.opacity = '1';
    el.style.left    = screen.x + 'px';
    el.style.top     = screen.y + 'px';

    /* Slight random size variation for realism */
    var sz = 2 + Math.random() * 3;
    el.style.width  = sz + 'px';
    el.style.height = sz + 'px';

    /* Fade out after 8 seconds */
    var captured = el;
    setTimeout(function () {
      captured.style.opacity = '0';
      setTimeout(function () { captured.style.display = 'none'; }, 1000);
    }, 8000);
  }

  // ── Look up penetration rating for a weapon ─────────────────
  function getPenetrationRating(weaponIdOrType) {
    if (!weaponIdOrType) return 0;
    var str = String(weaponIdOrType).toUpperCase();
    /* Check weapon ID first */
    if (WEAPON_ID_RATING.hasOwnProperty(str)) {
      return WEAPON_ID_RATING[str];
    }
    /* Fall back to type */
    if (PENETRATION_RATING.hasOwnProperty(str)) {
      return PENETRATION_RATING[str];
    }
    return 1; // default — most projectiles stop at hard surfaces
  }

  // ── Resolve block numeric ID → material name ────────────────
  function _blockIdToMaterial(blockId) {
    if (BLOCK_MATERIAL.hasOwnProperty(blockId)) {
      return BLOCK_MATERIAL[blockId];
    }
    /* Named string fallback (caller may pass e.g. 'CONCRETE') */
    if (typeof blockId === 'string') {
      var up = blockId.toUpperCase();
      if (MATERIAL_HARDNESS.hasOwnProperty(up)) return up;
    }
    return null;
  }

  // ── Core penetration check ──────────────────────────────────
  /*
   * weaponIdOrType — weapon ID string (e.g. 'AK74') or type ('ASSAULT')
   * blockId        — numeric BLOCK value or material name string
   *
   * Returns { penetrates: bool, velocityMult: float, scatter: float }
   */
  function checkPenetration(weaponIdOrType, blockId) {
    var result = { penetrates: false, velocityMult: 1, scatter: 0 };

    var rating   = getPenetrationRating(weaponIdOrType);
    var material = _blockIdToMaterial(blockId);

    if (!material || rating <= 0) return result;

    var mat = MATERIAL_HARDNESS[material];
    if (!mat) return result;

    if (rating > mat.threshold) {
      result.penetrates    = true;
      result.velocityMult  = mat.velocityMult;
      result.scatter       = mat.scatter;
    }
    return result;
  }

  // ── Public: penetration damage bonus (for PerkSystem hooks) ─
  function getPenetrationBonus() {
    return window._penetrationDamageBonus || 0;
  }

  // ── Handle a bullet hitting a surface ───────────────────────
  /*
   * Called externally (or via the _onBulletPenetration hook) when
   * a bullet ray intersects a block surface.
   *
   * opts = {
   *   weaponId    : string   — e.g. 'AK74'
   *   weaponType  : string   — e.g. 'ASSAULT'
   *   blockId     : number   — numeric BLOCK value
   *   worldPos    : THREE.Vector3 | {x,y,z}  — world-space hit point
   *   hitCount    : number   — how many surfaces this bullet already passed through
   * }
   *
   * Returns penetration result object, or null if bullet should stop.
   */
  function handleBulletHit(opts) {
    opts = opts || {};

    var weaponKey = opts.weaponId || opts.weaponType || '';
    var blockId   = (opts.blockId !== undefined) ? opts.blockId : opts.blockType;
    var hitCount  = opts.hitCount || 0;
    var worldPos  = opts.worldPos || null;

    /* Hard cap: max 2 penetrations per bullet */
    if (hitCount >= 2) return null;

    var res = checkPenetration(weaponKey, blockId);

    if (!res.penetrates) return null;

    /* Spawn decal at hit surface */
    if (worldPos) _spawnDecal(worldPos);

    /* Glass sound */
    var material = _blockIdToMaterial(blockId);
    if (material === 'GLASS') {
      if (window.AudioSystem && typeof window.AudioSystem.playGlassBreak === 'function') {
        window.AudioSystem.playGlassBreak(worldPos);
      }
    }

    /* HUD flash */
    _showPenetrationHud();

    /* Bump achievement counter */
    window._lastPenetrationCount = (window._lastPenetrationCount || 0) + 1;

    /* Apply global bonus damage from perks */
    var bonus = getPenetrationBonus();
    var finalVelocityMult = res.velocityMult * (1 + bonus / 100);

    /* Fire external hook if registered */
    if (typeof window._onBulletPenetration === 'function') {
      window._onBulletPenetration({
        weaponKey:    weaponKey,
        material:     material,
        velocityMult: finalVelocityMult,
        scatter:      res.scatter,
        hitCount:     hitCount + 1,
        worldPos:     worldPos
      });
    }

    return {
      penetrates:    true,
      velocityMult:  finalVelocityMult,
      scatter:       res.scatter,
      material:      material,
      hitCount:      hitCount + 1
    };
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init:               init,
    checkPenetration:   checkPenetration,
    getPenetrationBonus: getPenetrationBonus,
    getPenetrationRating: getPenetrationRating,
    handleBulletHit:    handleBulletHit,
    spawnDecal:         _spawnDecal
  };
})();
