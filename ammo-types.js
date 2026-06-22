/**
 * ammo-types.js — Player-selectable bullet types for tactical advantage
 *
 * Depends on: Three.js global (THREE)
 * Exposes:  window.AmmoTypes  { init, update, cycle, getCurrent, reset }
 *           window._currentAmmoType   (string key, e.g. 'STANDARD')
 *           window._ammoArmorPiercing (bool)
 *           window._ammoBurning       (bool)
 *           window._ammoExplosive     (bool)
 *
 * Key: V — cycle through ammo types
 * Each special type has 30 rounds; refills on ammo-box pickup.
 */
window.AmmoTypes = (function () {
  'use strict';

  // ── Ammo type definitions ──────────────────────────────────────────────────

  var TYPES = {
    STANDARD: {
      key:         'STANDARD',
      label:       'STANDARD',
      icon:        '●',
      dmgMult:     1.0,
      speedMult:   1.0,
      knockback:   1.0,
      tracerColor: 0xffffff,
      crossColor:  '#ffffff',
      flashColor:  0xffffff,
      unlimited:   true,
      maxRounds:   Infinity,
      desc:        '100% dmg, normal behavior'
    },
    ARMOR_PIERCING: {
      key:         'ARMOR_PIERCING',
      label:       'ARMOR PIERCING',
      icon:        '▲',
      dmgMult:     1.30,
      speedMult:   0.80,
      knockback:   1.0,
      tracerColor: 0xaaaaaa,
      crossColor:  '#aaaaaa',
      flashColor:  0xcccccc,
      unlimited:   false,
      maxRounds:   30,
      desc:        '130% dmg, -20% speed, penetrates 2 enemies'
    },
    HOLLOW_POINT: {
      key:         'HOLLOW_POINT',
      label:       'HOLLOW POINT',
      icon:        '◆',
      dmgMult:     0.90,
      speedMult:   1.0,
      knockback:   2.0,
      tracerColor: 0xff2222,
      crossColor:  '#ff2222',
      flashColor:  0xff4444,
      unlimited:   false,
      maxRounds:   30,
      bleedDps:    3,
      bleedDur:    6,
      desc:        '90% dmg, 2x knockback, bleed 3 dmg/s for 6s'
    },
    INCENDIARY: {
      key:         'INCENDIARY',
      label:       'INCENDIARY',
      icon:        '🔥',
      dmgMult:     0.70,
      speedMult:   1.0,
      knockback:   1.0,
      tracerColor: 0xff6600,
      crossColor:  '#ff6600',
      flashColor:  0xff4400,
      unlimited:   false,
      maxRounds:   30,
      burnDps:     5,
      burnDur:     4,
      desc:        '70% dmg + sets enemies on fire'
    },
    EXPLOSIVE: {
      key:         'EXPLOSIVE',
      label:       'EXPLOSIVE ROUNDS',
      icon:        '💥',
      dmgMult:     0.60,
      speedMult:   1.0,
      knockback:   1.0,
      tracerColor: 0xffff00,
      crossColor:  '#ffff00',
      flashColor:  0xffdd00,
      unlimited:   false,
      maxRounds:   30,
      splashDmg:   40,
      splashRadius: 1.5,
      desc:        '60% dmg + 40 radius splash dmg (1.5 unit radius)'
    }
  };

  var TYPE_ORDER = ['STANDARD', 'ARMOR_PIERCING', 'HOLLOW_POINT', 'INCENDIARY', 'EXPLOSIVE'];

  // ── Module state ───────────────────────────────────────────────────────────

  var _scene          = null;
  var _currentIdx     = 0;
  var _rounds         = {};       // { ARMOR_PIERCING: 30, HOLLOW_POINT: 30, ... }
  var _activeEffects  = [];       // [{type, target, timer, total, ...}]
  var _hudEl          = null;
  var _hudTypeEl      = null;
  var _hudCountEl     = null;
  var _crosshairEl    = null;     // canvas or element from CrosshairConfig

  // ── Init special round counts ──────────────────────────────────────────────

  function _initRounds() {
    for (var i = 0; i < TYPE_ORDER.length; i++) {
      var key = TYPE_ORDER[i];
      var def = TYPES[key];
      _rounds[key] = def.unlimited ? Infinity : def.maxRounds;
    }
  }

  // ── Expose globals ─────────────────────────────────────────────────────────

  function _syncGlobals() {
    var cur = TYPES[TYPE_ORDER[_currentIdx]];
    window._currentAmmoType   = cur.key;
    window._ammoArmorPiercing = (cur.key === 'ARMOR_PIERCING');
    window._ammoBurning       = (cur.key === 'INCENDIARY');
    window._ammoExplosive     = (cur.key === 'EXPLOSIVE');
  }

  // ── HUD element ───────────────────────────────────────────────────────────

  function _ensureHud() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'ammo-type-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:88px',
      'right:18px',
      'font-family:monospace',
      'font-size:13px',
      'color:#ffffff',
      'text-shadow:0 0 6px rgba(0,0,0,0.9)',
      'pointer-events:none',
      'z-index:650',
      'letter-spacing:1px',
      'user-select:none',
      'background:rgba(0,0,0,0.35)',
      'border-radius:4px',
      'padding:3px 8px',
      'display:flex',
      'align-items:center',
      'gap:6px'
    ].join(';');

    _hudTypeEl = document.createElement('span');
    _hudTypeEl.id = 'ammo-type-label';

    _hudCountEl = document.createElement('span');
    _hudCountEl.id = 'ammo-type-count';
    _hudCountEl.style.cssText = 'color:#aaa;font-size:11px';

    _hudEl.appendChild(_hudTypeEl);
    _hudEl.appendChild(_hudCountEl);
    document.body.appendChild(_hudEl);
  }

  function _updateHud() {
    if (!_hudEl) _ensureHud();
    var cur = TYPES[TYPE_ORDER[_currentIdx]];
    var count = _rounds[cur.key];
    var countStr = (count === Infinity) ? '∞' : String(count);

    if (_hudTypeEl) {
      _hudTypeEl.style.color = cur.crossColor;
      _hudTypeEl.textContent = 'AMMO: ' + cur.icon + ' ' + cur.label;
    }
    if (_hudCountEl) {
      _hudCountEl.textContent = '[' + countStr + ']';
    }
    // Update crosshair color if CrosshairConfig supports it
    _applyCrosshairColor(cur.crossColor);
  }

  // ── Crosshair color override ───────────────────────────────────────────────

  function _applyCrosshairColor(cssColor) {
    // We store the override; CrosshairConfig reads window._ammoTypeCrosshairColor
    window._ammoTypeCrosshairColor = cssColor;
    // Attempt direct canvas fill if accessible
    var canvas = document.getElementById('crosshairCanvas');
    if (!canvas) return;
    // CrosshairConfig drives its own RAF loop, so just storing the global is enough
    // for it to pick up on next draw. Nothing further needed.
  }

  // ── Cycle ──────────────────────────────────────────────────────────────────

  function cycle() {
    _currentIdx = (_currentIdx + 1) % TYPE_ORDER.length;
    var cur = TYPES[TYPE_ORDER[_currentIdx]];
    _syncGlobals();
    _updateHud();

    // Toast notification
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      var count = _rounds[cur.key];
      var countStr = (count === Infinity) ? '∞' : String(count);
      HUD.notifyPickup(cur.icon + ' ' + cur.label + ' [' + countStr + ']', cur.crossColor);
    }

    return cur;
  }

  // ── getCurrent ─────────────────────────────────────────────────────────────

  function getCurrent() {
    return TYPES[TYPE_ORDER[_currentIdx]];
  }

  // ── Consume one round (called by game-manager on shoot) ───────────────────

  function consumeRound() {
    var cur = getCurrent();
    if (cur.unlimited) return true;
    if (_rounds[cur.key] <= 0) {
      // Auto-fallback to STANDARD when out of special ammo
      _currentIdx = 0;
      _syncGlobals();
      _updateHud();
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('OUT OF ' + cur.label + ' — back to STANDARD', '#aaaaaa');
      }
      return false;
    }
    _rounds[cur.key]--;
    _updateHud();
    return true;
  }

  // ── Refill (called when player picks up ammo box) ─────────────────────────

  function refill() {
    for (var i = 0; i < TYPE_ORDER.length; i++) {
      var key = TYPE_ORDER[i];
      var def = TYPES[key];
      if (!def.unlimited) {
        _rounds[key] = def.maxRounds;
      }
    }
    _updateHud();
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('SPECIAL AMMO REFILLED', '#ffdd44');
    }
  }

  // ── On-hit effects ─────────────────────────────────────────────────────────

  function onHit(enemy, hitPosition) {
    var cur = getCurrent();
    if (!enemy || !hitPosition) return;

    if (cur.key === 'ARMOR_PIERCING') {
      _onHitArmorPiercing(enemy);
    } else if (cur.key === 'HOLLOW_POINT') {
      _onHitHollowPoint(enemy);
    } else if (cur.key === 'INCENDIARY') {
      _onHitIncendiary(enemy, hitPosition);
    } else if (cur.key === 'EXPLOSIVE') {
      _onHitExplosive(enemy, hitPosition);
    }
  }

  // Armor Piercing: penetrates through 2 enemies (flag already set via global)
  function _onHitArmorPiercing(enemy) {
    // window._ammoArmorPiercing already set; game-manager reads it for penetration logic
    // Visual: brief gray flash on enemy mesh
    if (enemy && enemy.mesh) {
      _flashMesh(enemy.mesh, 0xaaaaaa, 0.12);
    }
  }

  // Hollow Point: extra knockback + bleed DOT
  function _onHitHollowPoint(enemy) {
    var cur = TYPES['HOLLOW_POINT'];

    // Stumble: tilt enemy mesh on Z axis briefly
    if (enemy && enemy.mesh) {
      var origZ = enemy.mesh.rotation.z;
      enemy.mesh.rotation.z = (Math.random() > 0.5 ? 1 : -1) * 0.4;
      var meshRef = enemy.mesh;
      setTimeout(function () {
        if (meshRef) meshRef.rotation.z = origZ;
      }, 600);
    }

    // Bleed DOT record
    _activeEffects.push({
      type:    'bleed',
      target:  enemy,
      dps:     cur.bleedDps,
      dur:     cur.bleedDur,
      elapsed: 0
    });
  }

  // Incendiary: orange fireball + PointLight + burn DOT
  function _onHitIncendiary(enemy, hitPos) {
    var cur = TYPES['INCENDIARY'];
    if (!_scene) return;

    // Orange sphere fire visual
    var geo  = new THREE.SphereGeometry(0.4, 6, 6);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.9 });
    var ball = new THREE.Mesh(geo, mat);
    ball.position.copy(hitPos);
    _scene.add(ball);

    // PointLight
    var light = new THREE.PointLight(0xFF4400, 4, 3);
    light.position.copy(hitPos);
    _scene.add(light);

    // Burn DOT + cleanup reference
    _activeEffects.push({
      type:    'burn',
      target:  enemy,
      dps:     cur.burnDps,
      dur:     cur.burnDur,
      elapsed: 0,
      mesh:    ball,
      light:   light
    });

    // Also trigger BurningSystem if available
    if (window.BurningSystem && typeof window.BurningSystem.ignite === 'function') {
      try { window.BurningSystem.ignite(enemy, cur.burnDps, cur.burnDur); } catch (e) {}
    }
  }

  // Explosive: splash damage + ring shockwave
  function _onHitExplosive(enemy, hitPos) {
    var cur = TYPES['EXPLOSIVE'];
    if (!_scene) return;

    // Ring shockwave geometry
    var rGeo  = new THREE.RingGeometry(0.05, 0.2, 16);
    var rMat  = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    var ring  = new THREE.Mesh(rGeo, rMat);
    ring.position.copy(hitPos);
    // Orient ring to be horizontal (face up)
    ring.rotation.x = -Math.PI / 2;
    _scene.add(ring);

    // Animate shockwave expansion
    _activeEffects.push({
      type:     'shockwave',
      mesh:     ring,
      mat:      rMat,
      elapsed:  0,
      dur:      0.6
    });

    // Splash damage to nearby enemies
    var enemies = (window.enemies) || (window.GameManager && window.GameManager.enemies) || [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || !e.alive) continue;
      var dx = e.mesh.position.x - hitPos.x;
      var dy = e.mesh.position.y - hitPos.y;
      var dz = e.mesh.position.z - hitPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < cur.splashRadius && e !== enemy) {
        var splashDmg = Math.round(cur.splashDmg * (1 - dist / cur.splashRadius));
        if (typeof Enemies !== 'undefined' && Enemies.damage) {
          try { Enemies.damage(e, splashDmg, false, 'EXPLOSIVE'); } catch (ex) {}
        }
      }
    }
  }

  // ── Mesh flash helper ──────────────────────────────────────────────────────

  function _flashMesh(mesh, color, dur) {
    if (!mesh || !mesh.material) return;
    var orig = null;
    try { orig = mesh.material.color.getHex(); } catch (e) { return; }
    try { mesh.material.color.setHex(color); } catch (e) { return; }
    setTimeout(function () {
      try { if (mesh && mesh.material) mesh.material.color.setHex(orig); } catch (e2) {}
    }, Math.round(dur * 1000));
  }

  // ── Update (call each frame with delta seconds) ────────────────────────────

  function update(delta) {
    for (var i = _activeEffects.length - 1; i >= 0; i--) {
      var fx = _activeEffects[i];
      fx.elapsed += delta;

      if (fx.type === 'bleed' || fx.type === 'burn') {
        // Apply DOT damage
        if (fx.target && fx.target.alive !== false) {
          var dmg = fx.dps * delta;
          if (typeof Enemies !== 'undefined' && Enemies.damage) {
            try { Enemies.damage(fx.target, dmg, false, fx.type === 'burn' ? 'FIRE' : 'BLEED'); } catch (e) {}
          }
        }
        // Burn fire ball: shrink + fade over time
        if (fx.type === 'burn' && fx.mesh) {
          var t = fx.elapsed / fx.dur;
          var s = Math.max(0.01, 1 - t);
          fx.mesh.scale.setScalar(s);
          if (fx.mat) fx.mat.opacity = Math.max(0, 0.9 * (1 - t));
          if (fx.light) fx.light.intensity = Math.max(0, 4 * (1 - t));
          // Follow enemy
          if (fx.target && fx.target.mesh) {
            fx.mesh.position.copy(fx.target.mesh.position);
            fx.mesh.position.y += 0.5;
            if (fx.light) fx.light.position.copy(fx.mesh.position);
          }
        }
        // Expired
        if (fx.elapsed >= fx.dur) {
          if (fx.mesh && _scene) {
            _scene.remove(fx.mesh);
            if (fx.mesh.geometry) fx.mesh.geometry.dispose();
            if (fx.mesh.material) fx.mesh.material.dispose();
          }
          if (fx.light && _scene) _scene.remove(fx.light);
          _activeEffects.splice(i, 1);
        }
      } else if (fx.type === 'shockwave') {
        var t2 = fx.elapsed / fx.dur;
        // Expand ring
        var scale = 1 + t2 * 6;
        fx.mesh.scale.setScalar(scale);
        if (fx.mat) fx.mat.opacity = Math.max(0, 0.85 * (1 - t2));
        if (fx.elapsed >= fx.dur) {
          if (_scene) {
            _scene.remove(fx.mesh);
            if (fx.mesh.geometry) fx.mesh.geometry.dispose();
            if (fx.mat) fx.mat.dispose();
          }
          _activeEffects.splice(i, 1);
        }
      }
    }
  }

  // ── Keydown handler ────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'v' || e.key === 'V') {
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        cycle();
        e.preventDefault();
      }
    }
  }

  // ── Ammo-box pickup hook ───────────────────────────────────────────────────
  // game-manager calls window._onAmmoPickup when player collects an AMMO box

  window._onAmmoPickup = function () {
    refill();
  };

  // ── Init ───────────────────────────────────────────────────────────────────

  function init(scene) {
    _scene = scene || null;
    _currentIdx = 0;
    _initRounds();
    _syncGlobals();
    _ensureHud();
    _updateHud();

    // V key to cycle
    document.addEventListener('keydown', _onKeyDown);

    console.log('[AmmoTypes] init — current:', TYPE_ORDER[_currentIdx]);
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    // Clean up active 3D effects
    for (var i = 0; i < _activeEffects.length; i++) {
      var fx = _activeEffects[i];
      if (fx.mesh && _scene) {
        _scene.remove(fx.mesh);
        if (fx.mesh.geometry) fx.mesh.geometry.dispose();
        if (fx.mesh.material) fx.mesh.material.dispose();
      }
      if (fx.light && _scene) _scene.remove(fx.light);
    }
    _activeEffects.length = 0;
    _currentIdx = 0;
    _initRounds();
    _syncGlobals();
    _updateHud();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    init:         init,
    update:       update,
    cycle:        cycle,
    getCurrent:   getCurrent,
    reset:        reset,
    consumeRound: consumeRound,
    refill:       refill,
    onHit:        onHit,
    TYPES:        TYPES,
    TYPE_ORDER:   TYPE_ORDER
  };

})();
