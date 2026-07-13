/* powerup-system.js — 8-type random combat powerup drop system for Three.js FPS
 * Exposes: window.PowerupSystem = { init, update, dropAt, spawnWave, reset }
 */
window.PowerupSystem = (function () {
  'use strict';

  // ─────────────────────────────────────────────
  // Constants
  // ─────────────────────────────────────────────
  var COLLECTION_RADIUS = 1.5;
  var FLOAT_HEIGHT = 0.8;
  var ROTATION_SPEED = 1.8;
  var PULSE_SPEED = 2.5;
  var PICKUP_TEXT_DURATION = 1800; // ms

  // Powerup type definitions
  var TYPES = {
    SPEED_BOOST: {
      key: 'SPEED_BOOST',
      label: 'SPEED BOOST',
      color: 0xffd700,
      cssColor: '#ffd700',
      duration: 12,
      weight: 15,
      shape: 'sphere',
      applyEffect: function () {
        window._playerSpeedMult = 1.5;
      },
      removeEffect: function () {
        window._playerSpeedMult = 1.0;
      }
    },
    DAMAGE_AMP: {
      key: 'DAMAGE_AMP',
      label: 'DAMAGE AMP',
      color: 0xff2222,
      cssColor: '#ff2222',
      duration: 10,
      weight: 14,
      shape: 'star',
      applyEffect: function () {
        window._weaponDamageMult = 2.0;
      },
      removeEffect: function () {
        window._weaponDamageMult = 1.0;
      }
    },
    INVINCIBILITY: {
      key: 'INVINCIBILITY',
      label: 'INVINCIBILITY',
      color: 0xffffff,
      cssColor: '#ffffff',
      duration: 6,
      weight: 8,
      shape: 'cube',
      rainbow: true,
      applyEffect: function () {
        window._invincible = true;
      },
      removeEffect: function () {
        window._invincible = false;
      }
    },
    HEALTH_SURGE: {
      key: 'HEALTH_SURGE',
      label: 'HEALTH SURGE',
      color: 0x00ff44,
      cssColor: '#00ff44',
      duration: 0, // instant
      weight: 18,
      shape: 'cross',
      applyEffect: function () {
        if (typeof window._playerHP !== 'undefined') {
          window._playerHP = (window._playerHP || 100) + 40;
        } else {
          window._playerHP = 140;
        }
      },
      removeEffect: function () { /* instant — nothing to undo */ }
    },
    AMMO_DUMP: {
      key: 'AMMO_DUMP',
      label: 'AMMO DUMP',
      color: 0xffee00,
      cssColor: '#ffee00',
      duration: 0, // instant
      weight: 16,
      shape: 'box',
      applyEffect: function () {
        if (typeof window._playerAmmo !== 'undefined') {
          window._playerAmmo = (window._playerAmmo || 0) + 50;
        }
        if (typeof window._playerAmmoReserve !== 'undefined') {
          window._playerAmmoReserve = (window._playerAmmoReserve || 0) + 50;
        }
        // Fire a custom event so weapons.js can react
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('powerup_ammo_dump', { detail: { amount: 50 } }));
        }
      },
      removeEffect: function () { /* instant */ }
    },
    RAGE_MODE: {
      key: 'RAGE_MODE',
      label: 'RAGE MODE',
      color: 0xcc0000,
      cssColor: '#cc0000',
      duration: 8,
      weight: 10,
      shape: 'sphere',
      applyEffect: function () {
        window._weaponDamageMult = (window._weaponDamageMult || 1.0) * 3;
        window._playerSpeedMult = (window._playerSpeedMult || 1.0) * 1.5;
        window._rageModeActive = true;
      },
      removeEffect: function () {
        window._weaponDamageMult = 1.0;
        window._playerSpeedMult = 1.0;
        window._rageModeActive = false;
      }
    },
    GHOST_MODE: {
      key: 'GHOST_MODE',
      label: 'GHOST MODE',
      color: 0xaaddff,
      cssColor: '#aaddff',
      duration: 8,
      weight: 10,
      shape: 'sphere',
      translucent: true,
      applyEffect: function () {
        window._ghostMode = true;
      },
      removeEffect: function () {
        window._ghostMode = false;
      }
    },
    SCORE_FRENZY: {
      key: 'SCORE_FRENZY',
      label: 'SCORE FRENZY',
      color: 0xcc44ff,
      cssColor: '#cc44ff',
      duration: 15,
      weight: 9,
      shape: 'star',
      applyEffect: function () {
        window._scoreMultiplier = 3.0;
      },
      removeEffect: function () {
        window._scoreMultiplier = 1.0;
      }
    }
  };

  // Build weighted list once
  var _weightedPool = [];
  (function () {
    var keys = Object.keys(TYPES);
    for (var i = 0; i < keys.length; i++) {
      var t = TYPES[keys[i]];
      for (var w = 0; w < t.weight; w++) {
        _weightedPool.push(t.key);
      }
    }
  })();

  // ─────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────
  var _scene = null;
  var _drops = [];       // { mesh, light, type, createdAt, collected }
  var _activeEffects = []; // { type, expiresAt, hudEl, barEl }
  var _pickupTexts = [];   // { el, createdAt }
  var _hudContainer = null;
  var _initialized = false;
  var _clock = 0; // accumulated time in seconds

  // ─────────────────────────────────────────────
  // Geometry helpers (Three.js)
  // ─────────────────────────────────────────────
  function _makeMesh(typeKey) {
    var t = TYPES[typeKey];
    var geo, mat, mesh;

    if (t.shape === 'sphere') {
      geo = new THREE.SphereGeometry(0.35, 16, 12);
    } else if (t.shape === 'star') {
      // Approximate star with an icosahedron
      geo = new THREE.IcosahedronGeometry(0.38, 0);
    } else if (t.shape === 'cube') {
      geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    } else if (t.shape === 'box') {
      geo = new THREE.BoxGeometry(0.55, 0.42, 0.42);
    } else if (t.shape === 'cross') {
      // Build a cross from two merged boxes via a Group
      var group = new THREE.Group();
      var matG = new THREE.MeshPhongMaterial({
        color: t.color,
        emissive: t.color,
        emissiveIntensity: 0.4,
        shininess: 80
      });
      var hBar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.18), matG);
      var vBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), matG);
      group.add(hBar);
      group.add(vBar);
      // Tag group so update loop can spin it
      group._isPowerupMesh = true;
      group._typeKey = typeKey;
      return group;
    } else {
      geo = new THREE.SphereGeometry(0.35, 12, 10);
    }

    var matOpts = {
      color: t.color,
      emissive: t.color,
      emissiveIntensity: 0.35,
      shininess: 120
    };
    if (t.translucent) {
      matOpts.transparent = true;
      matOpts.opacity = 0.55;
    }
    mat = new THREE.MeshPhongMaterial(matOpts);
    mesh = new THREE.Mesh(geo, mat);
    mesh._isPowerupMesh = true;
    mesh._typeKey = typeKey;
    return mesh;
  }

  function _makeLight(typeKey) {
    var t = TYPES[typeKey];
    var light = new THREE.PointLight(t.color, 1.2, 4.0);
    return light;
  }

  // ─────────────────────────────────────────────
  // Random type picker
  // ─────────────────────────────────────────────
  function _randomType() {
    var idx = Math.floor(Math.random() * _weightedPool.length);
    return _weightedPool[idx];
  }

  // ─────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudContainer) return;
    _hudContainer = document.createElement('div');
    _hudContainer.id = 'powerup-hud';
    _hudContainer.style.cssText = [
      'position:fixed',
      'top:160px',
      'left:12px',
      'z-index:220',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:11px',
      'display:flex',
      'flex-direction:column',
      'gap:4px'
    ].join(';');
    document.body.appendChild(_hudContainer);
  }

  function _addEffectToHUD(effect) {
    _ensureHUD();
    var t = TYPES[effect.type];
    var row = document.createElement('div');
    row.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:6px',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid ' + t.cssColor,
      'border-radius:4px',
      'padding:3px 7px',
      'min-width:160px'
    ].join(';');

    var icon = document.createElement('div');
    icon.style.cssText = [
      'width:12px',
      'height:12px',
      'background:' + t.cssColor,
      'border-radius:2px',
      'flex-shrink:0'
    ].join(';');

    var label = document.createElement('div');
    label.style.color = t.cssColor;
    label.style.flex = '1';
    label.textContent = t.label;

    var bar = document.createElement('div');
    bar.style.cssText = [
      'width:60px',
      'height:5px',
      'background:rgba(255,255,255,0.15)',
      'border-radius:2px',
      'overflow:hidden',
      'flex-shrink:0'
    ].join(';');
    var barFill = document.createElement('div');
    barFill.style.cssText = [
      'height:100%',
      'width:100%',
      'background:' + t.cssColor,
      'border-radius:2px',
      'transition:width 0.2s linear'
    ].join(';');
    bar.appendChild(barFill);

    row.appendChild(icon);
    row.appendChild(label);
    if (t.duration > 0) row.appendChild(bar);

    _hudContainer.appendChild(row);
    effect.hudRow = row;
    effect.hudBarFill = barFill;
  }

  function _removeEffectFromHUD(effect) {
    if (effect.hudRow && effect.hudRow.parentNode) {
      effect.hudRow.parentNode.removeChild(effect.hudRow);
    }
  }

  function _updateHUDBars(now) {
    for (var i = 0; i < _activeEffects.length; i++) {
      var e = _activeEffects[i];
      var t = TYPES[e.type];
      if (t.duration <= 0) continue;
      if (!e.hudBarFill) continue;
      var remaining = e.expiresAt - now;
      var pct = Math.max(0, remaining / t.duration) * 100;
      e.hudBarFill.style.width = pct + '%';
    }
  }

  // ─────────────────────────────────────────────
  // Pickup text flash
  // ─────────────────────────────────────────────
  function _showPickupText(x, y, typeKey) {
    var t = TYPES[typeKey];
    var el = document.createElement('div');
    el.textContent = '+' + t.label;
    el.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:40%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:' + t.cssColor,
      'text-shadow:0 0 12px ' + t.cssColor,
      'pointer-events:none',
      'z-index:300',
      'animation:powerupTextFloat 1.8s ease-out forwards'
    ].join(';');
    document.body.appendChild(el);

    // Inject keyframe animation once
    if (!document.getElementById('powerup-keyframes')) {
      var style = document.createElement('style');
      style.id = 'powerup-keyframes';
      style.textContent = '@keyframes powerupTextFloat{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-60px)}}';
      document.head.appendChild(style);
    }

    _pickupTexts.push({ el: el, createdAt: Date.now() });
  }

  function _cleanPickupTexts() {
    var now = Date.now();
    var remaining = [];
    for (var i = 0; i < _pickupTexts.length; i++) {
      var pt = _pickupTexts[i];
      if (now - pt.createdAt > PICKUP_TEXT_DURATION) {
        if (pt.el.parentNode) pt.el.parentNode.removeChild(pt.el);
      } else {
        remaining.push(pt);
      }
    }
    _pickupTexts = remaining;
  }

  // ─────────────────────────────────────────────
  // Effect management
  // ─────────────────────────────────────────────
  function _applyEffect(typeKey, now) {
    var t = TYPES[typeKey];

    // For instant effects just fire and done
    if (t.duration <= 0) {
      t.applyEffect();
      return;
    }

    // Check if same effect already active — refresh timer
    for (var i = 0; i < _activeEffects.length; i++) {
      if (_activeEffects[i].type === typeKey) {
        _activeEffects[i].expiresAt = now + t.duration;
        return;
      }
    }

    t.applyEffect();
    var effect = {
      type: typeKey,
      expiresAt: now + t.duration,
      hudRow: null,
      hudBarFill: null
    };
    _activeEffects.push(effect);
    _addEffectToHUD(effect);
  }

  function _tickEffects(now) {
    var remaining = [];
    for (var i = 0; i < _activeEffects.length; i++) {
      var e = _activeEffects[i];
      if (now >= e.expiresAt) {
        // Expire
        var t = TYPES[e.type];
        t.removeEffect();
        _removeEffectFromHUD(e);
      } else {
        remaining.push(e);
      }
    }
    _activeEffects = remaining;
  }

  // ─────────────────────────────────────────────
  // Drop creation
  // ─────────────────────────────────────────────
  function _createDrop(scene, x, y, z, typeKey) {
    if (!scene || typeof THREE === 'undefined') return;

    var mesh = _makeMesh(typeKey);
    mesh.position.set(x, y + FLOAT_HEIGHT, z);

    var light = _makeLight(typeKey);
    light.position.set(x, y, z);

    scene.add(mesh);
    scene.add(light);

    _drops.push({
      mesh: mesh,
      light: light,
      type: typeKey,
      collected: false,
      spawnY: y + FLOAT_HEIGHT
    });
  }

  // ─────────────────────────────────────────────
  // Collection check
  // ─────────────────────────────────────────────
  function _checkCollection(now) {
    if (typeof window._playerPos === 'undefined') return;
    var px = window._playerPos.x || 0;
    var py = window._playerPos.y || 0;
    var pz = window._playerPos.z || 0;

    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (d.collected) continue;

      var dx = d.mesh.position.x - px;
      var dy = d.mesh.position.y - py;
      var dz = d.mesh.position.z - pz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= COLLECTION_RADIUS) {
        d.collected = true;
        _applyEffect(d.type, now);
        _showPickupText(0, 0, d.type);

        // Remove from scene
        if (_scene) {
          _scene.remove(d.mesh);
          _scene.remove(d.light);
        }

        // Dispose geometry/material to avoid memory leak
        if (d.mesh.geometry) d.mesh.geometry.dispose();
        if (d.mesh.material) {
          if (Array.isArray(d.mesh.material)) {
            for (var m = 0; m < d.mesh.material.length; m++) d.mesh.material[m].dispose();
          } else {
            d.mesh.material.dispose();
          }
        }
        // For cross groups
        if (d.mesh.children) {
          for (var c = 0; c < d.mesh.children.length; c++) {
            var child = d.mesh.children[c];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          }
        }
      }
    }

    // Prune collected drops
    var alive = [];
    for (var j = 0; j < _drops.length; j++) {
      if (!_drops[j].collected) alive.push(_drops[j]);
    }
    _drops = alive;
  }

  // ─────────────────────────────────────────────
  // Animation (bob + rotate + pulse)
  // ─────────────────────────────────────────────
  function _animateDrops(dt) {
    var t = _clock;
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      var mesh = d.mesh;

      // Float bob
      mesh.position.y = d.spawnY + Math.sin(t * 2.0 + i) * 0.15;

      // Spin
      mesh.rotation.y += ROTATION_SPEED * dt;

      // Rainbow hue for INVINCIBILITY cube
      if (TYPES[d.type].rainbow && mesh.material) {
        var hue = (t * 120) % 360;
        mesh.material.color.setHSL(hue / 360, 1.0, 0.55);
        mesh.material.emissive.setHSL(hue / 360, 1.0, 0.3);
      }

      // Scale pulse (sin wave)
      var pulse = 1.0 + 0.12 * Math.sin(t * PULSE_SPEED + i * 0.8);
      mesh.scale.set(pulse, pulse, pulse);

      // For group (cross) — spin the group
      if (mesh.isGroup || (mesh.children && mesh.children.length > 0 && !mesh.isMesh)) {
        mesh.rotation.x += ROTATION_SPEED * 0.4 * dt;
      }
    }
  }

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  function init(scene) {
    _scene = scene;
    _initialized = true;
    _ensureHUD();

    // Set global baseline defaults if not already set
    if (typeof window._playerSpeedMult === 'undefined') window._playerSpeedMult = 1.0;
    if (typeof window._weaponDamageMult === 'undefined') window._weaponDamageMult = 1.0;
    if (typeof window._invincible === 'undefined') window._invincible = false;
    if (typeof window._ghostMode === 'undefined') window._ghostMode = false;
    if (typeof window._scoreMultiplier === 'undefined') window._scoreMultiplier = 1.0;
    if (typeof window._rageModeActive === 'undefined') window._rageModeActive = false;
  }

  function update(dt, scene) {
    if (!_initialized) return;
    if (scene && !_scene) _scene = scene;

    _clock += dt;
    var now = _clock;

    _animateDrops(dt);
    _checkCollection(now);
    _tickEffects(now);
    _updateHUDBars(now);
    _cleanPickupTexts();
  }

  /**
   * dropAt — call from game logic on enemy death.
   * @param {THREE.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {boolean} [isBoss] — boss drop uses 40% chance, regular uses 15%
   */
  function dropAt(scene, x, y, z, isBoss) {
    if (!_initialized) {
      init(scene);
    }
    if (!scene) return;
    _scene = scene;

    var chance = isBoss ? 0.40 : 0.15;
    if (Math.random() > chance) return;

    var typeKey = _randomType();
    _createDrop(scene, x, y, z, typeKey);
  }

  /**
   * spawnWave — drop 2-3 random powerups at wave start (wave 5+).
   * @param {THREE.Scene} scene
   * @param {number} count — suggested count (clamped 2-3)
   */
  function spawnWave(scene, count) {
    if (!_initialized) init(scene);
    if (!scene) return;
    _scene = scene;

    var num = Math.min(3, Math.max(2, count || 2));
    for (var i = 0; i < num; i++) {
      // Scatter in a ring around origin (or spread if player pos known)
      var angle = (i / num) * Math.PI * 2 + Math.random() * 0.5;
      var radius = 6 + Math.random() * 4;
      var ox = typeof window._playerPos !== 'undefined' ? (window._playerPos.x || 0) : 0;
      var oz = typeof window._playerPos !== 'undefined' ? (window._playerPos.z || 0) : 0;
      var px = ox + Math.cos(angle) * radius;
      var pz = oz + Math.sin(angle) * radius;
      var typeKey = _randomType();
      _createDrop(scene, px, 0, pz, typeKey);
    }
  }

  function reset() {
    // Remove all drops from scene
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (_scene) {
        _scene.remove(d.mesh);
        _scene.remove(d.light);
      }
    }
    _drops = [];

    // Expire all active effects
    for (var j = 0; j < _activeEffects.length; j++) {
      var e = _activeEffects[j];
      TYPES[e.type].removeEffect();
      _removeEffectFromHUD(e);
    }
    _activeEffects = [];

    // Reset globals to baseline
    window._playerSpeedMult = 1.0;
    window._weaponDamageMult = 1.0;
    window._invincible = false;
    window._ghostMode = false;
    window._scoreMultiplier = 1.0;
    window._rageModeActive = false;

    _clock = 0;
  }

  return {
    init: init,
    update: update,
    dropAt: dropAt,
    spawnWave: spawnWave,
    reset: reset
  };
})();
