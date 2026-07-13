// loot-drops.js — Enemy loot drop system for Ukraine-conflict FPS
// Floating collectible pickups that spawn when enemies die.
// Depends on: THREE (global), Weapons, ArmorSystem, HUD
// API: LootDrops.init(scene), .update(delta), .spawnLoot(position, enemyType), .clear(), .reset()

window.LootDrops = (function() {
  'use strict';

  /* ── Loot table ─────────────────────────────────────────────────── */
  var LOOT_TABLE = [
    { type: 'AMMO_9MM',   label: '9mm Ammo +30',   chance: 0.25, color: 0xffff00, icon: '🔫', ammoAmt: 30 },
    { type: 'AMMO_556',   label: '5.56 Ammo +25',   chance: 0.20, color: 0xffcc00, icon: '🔫', ammoAmt: 25 },
    { type: 'AMMO_762',   label: '7.62 Ammo +20',   chance: 0.15, color: 0xff9900, icon: '🔫', ammoAmt: 20 },
    { type: 'MEDKIT_SM',  label: 'Medkit +25 HP',   chance: 0.15, color: 0xff0000, icon: '❤️',  healAmt: 25 },
    { type: 'MEDKIT_LG',  label: 'Medkit +60 HP',   chance: 0.05, color: 0xff0055, icon: '❤️',  healAmt: 60 },
    { type: 'ARMOR_VEST', label: 'Body Armor +30',   chance: 0.10, color: 0x00aaff, icon: '🛡️' },
    { type: 'GRENADE',    label: 'Grenade +2',       chance: 0.06, color: 0x00ff44, icon: '💣' },
    { type: 'INTEL_DOC',  label: 'Intel +500pts',    chance: 0.03, color: 0xffffff, icon: '📄', score: 500 },
    { type: 'GOLD_CACHE', label: 'Gold Cache +1500', chance: 0.01, color: 0xffd700, icon: '⭐', score: 1500 }
  ];

  /* ── State ───────────────────────────────────────────────────────── */
  var _scene = null;
  var _items = [];        // active loot objects
  var _time  = 0;         // running time for bob/rotate
  var _audioCtx = null;
  var _hudEl = null;      // lootCollectHUD element
  var _hudTimer = 0;
  var LOOT_LIFETIME = 20; // seconds before despawn
  var COLLECT_RADIUS = 1.2;

  /* ── Init ────────────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene;
    _items = [];
    _time  = 0;
    _ensureHUD();
  }

  /* ── HUD element ─────────────────────────────────────────────────── */
  function _ensureHUD() {
    if (typeof document === 'undefined') return;
    _hudEl = document.getElementById('lootCollectHUD');
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'lootCollectHUD';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)',
        'color:#fff',
        'font-family:monospace',
        'font-size:16px',
        'font-weight:bold',
        'padding:8px 22px',
        'border-radius:8px',
        'border:1px solid rgba(255,255,255,0.25)',
        'pointer-events:none',
        'z-index:9900',
        'display:none',
        'text-align:center',
        'letter-spacing:1px'
      ].join(';');
      if (document.body) document.body.appendChild(_hudEl);
    }
  }

  function _showHUD(icon, label) {
    if (!_hudEl) _ensureHUD();
    if (!_hudEl) return;
    _hudEl.textContent = icon + '  ' + label;
    _hudEl.style.display = 'block';
    _hudEl.style.opacity = '1';
    _hudTimer = 2.0;
  }

  /* ── Audio: 880 Hz sine, 0.1 gain, 0.12 s ───────────────────────── */
  function _playCollectSFX() {
    try {
      if (!_audioCtx) {
        if (typeof AudioContext !== 'undefined') {
          _audioCtx = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
          _audioCtx = new webkitAudioContext(); // eslint-disable-line
        }
      }
      if (!_audioCtx) return;
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, _audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.12);
    } catch (e) { /* audio not supported */ }
  }

  /* ── Canvas billboard label ──────────────────────────────────────── */
  function _makeLabel(icon, label, color) {
    var canvas = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    // background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    var rr = 10;
    ctx.beginPath();
    ctx.moveTo(rr, 0);
    ctx.lineTo(canvas.width - rr, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, rr);
    ctx.lineTo(canvas.width, canvas.height - rr);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - rr, canvas.height);
    ctx.lineTo(rr, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - rr);
    ctx.lineTo(0, rr);
    ctx.quadraticCurveTo(0, 0, rr, 0);
    ctx.closePath();
    ctx.fill();
    // icon
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(icon, 10, 40);
    // label
    var hexColor = '#' + ('000000' + color.toString(16)).slice(-6);
    ctx.fillStyle = hexColor;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, 44, 40);

    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 0.4, 1);
    sprite.position.set(0, 0.85, 0);
    return sprite;
  }

  /* ── Build a single loot 3-D pickup ─────────────────────────────── */
  function _buildPickup(def, position) {
    var group = new THREE.Group();

    // Main sphere
    var geo  = new THREE.SphereGeometry(0.25, 10, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.6 });
    var mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // Glow sphere (slightly larger, additive-like, transparent)
    var glowGeo = new THREE.SphereGeometry(0.32, 8, 6);
    var glowMat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.BackSide });
    var glow    = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // Point light
    var light = new THREE.PointLight(def.color, 1.5, 3);
    group.add(light);

    // Canvas label sprite
    var sprite = _makeLabel(def.icon, def.label, def.color);
    group.add(sprite);

    // Ground Y: use provided Y but keep consistent height
    var groundY = (position && typeof position.y === 'number') ? position.y : 0;
    group.position.set(
      (position ? position.x : 0) + (Math.random() - 0.5) * 0.4,
      groundY,
      (position ? position.z : 0) + (Math.random() - 0.5) * 0.4
    );

    return group;
  }

  /* ── Roll one item from LOOT_TABLE by chance ─────────────────────── */
  function _rollLoot() {
    var roll = Math.random();
    var cumulative = 0;
    for (var i = 0; i < LOOT_TABLE.length; i++) {
      cumulative += LOOT_TABLE[i].chance;
      if (roll < cumulative) return LOOT_TABLE[i];
    }
    return null; // no drop
  }

  /* ── Determine if enemy is a boss ────────────────────────────────── */
  function _isBoss(enemyType) {
    if (!enemyType) return false;
    var t = (typeof enemyType === 'string') ? enemyType.toLowerCase() : String(enemyType).toLowerCase();
    return t.indexOf('boss') >= 0 || t.indexOf('commander') >= 0 || t.indexOf('general') >= 0 || t.indexOf('heavy') >= 0;
  }

  /* ── Add a pickup item to the scene ─────────────────────────────── */
  function _addItem(def, position) {
    if (!_scene || !def) return;
    var group = _buildPickup(def, position);
    _scene.add(group);
    _items.push({
      group:    group,
      def:      def,
      lifetime: LOOT_LIFETIME,
      groundY:  (position && typeof position.y === 'number') ? position.y : 0,
      bobSeed:  Math.random() * Math.PI * 2,
      fadeOut:  false,
      opacity:  1
    });
  }

  /* ── Public: spawnLoot(position, enemyType) ──────────────────────── */
  function spawnLoot(position, enemyType) {
    if (!_scene) return;

    var isBoss = _isBoss(enemyType);

    if (isBoss) {
      // Guaranteed loot + double roll (pick 2 items)
      var def1 = _rollLoot();
      var def2 = _rollLoot();
      // offset slightly so they don't overlap
      var pos1 = position ? { x: position.x - 0.3, y: position.y, z: position.z } : position;
      var pos2 = position ? { x: position.x + 0.3, y: position.y, z: position.z } : position;
      if (def1) _addItem(def1, pos1);
      if (def2) _addItem(def2, pos2);
    } else {
      // Normal: roll against the table sequentially, max 1 item
      var drop = _rollLoot();
      if (drop) _addItem(drop, position);
    }
  }

  /* ── Apply effect to player when collecting ──────────────────────── */
  function _applyLoot(def, playerRef) {
    if (!def) return;

    switch (def.type) {
      case 'AMMO_9MM':
      case 'AMMO_556':
      case 'AMMO_762':
        if (window.Weapons && Weapons.addAmmo) {
          Weapons.addAmmo(def.ammoAmt || 25);
        }
        break;

      case 'MEDKIT_SM':
      case 'MEDKIT_LG':
        if (playerRef) {
          playerRef.hp = Math.min(playerRef.maxHp || 100, (playerRef.hp || 0) + (def.healAmt || 25));
          if (window.HUD && HUD.setHealth) HUD.setHealth(playerRef.hp, playerRef.maxHp || 100);
        }
        break;

      case 'ARMOR_VEST':
        if (window.ArmorSystem && ArmorSystem.addArmor) {
          ArmorSystem.addArmor(30);
        } else if (playerRef) {
          playerRef.armor = (playerRef.armor || 0) + 30;
        }
        break;

      case 'GRENADE':
        if (playerRef) {
          playerRef.grenades = (playerRef.grenades || 0) + 2;
          if (window.HUD && HUD.setGrenades) HUD.setGrenades(playerRef.grenades);
        }
        break;

      case 'INTEL_DOC':
        if (playerRef) {
          playerRef.score = (playerRef.score || 0) + (def.score || 500);
          if (window.HUD && HUD.setScore) HUD.setScore(playerRef.score);
        }
        break;

      case 'GOLD_CACHE':
        if (playerRef) {
          playerRef.score = (playerRef.score || 0) + (def.score || 1500);
          if (window.HUD && HUD.setScore) HUD.setScore(playerRef.score);
        }
        break;
    }
  }

  /* ── Get a reference to the player object from GameManager ──────── */
  function _getPlayer() {
    // GameManager exposes player via window or via a getter; fall back gracefully
    if (window.GameManager && GameManager.getPlayer) return GameManager.getPlayer();
    if (window._player) return window._player;
    return null;
  }

  /* ── Public: update(delta) ───────────────────────────────────────── */
  function update(delta) {
    if (!_scene) return;

    _time += delta;

    // Tick HUD
    if (_hudTimer > 0) {
      _hudTimer -= delta;
      if (_hudTimer <= 0 && _hudEl) {
        _hudEl.style.display = 'none';
      }
    }

    var playerRef  = _getPlayer();
    var playerPos  = playerRef ? playerRef.position : null;

    for (var i = _items.length - 1; i >= 0; i--) {
      var item = _items[i];

      // Lifetime countdown
      item.lifetime -= delta;

      // Fade out in last 3 seconds
      if (item.lifetime < 3.0) {
        item.opacity = Math.max(0, item.lifetime / 3.0);
        // Apply opacity to all meshes in group
        item.group.traverse(function(obj) {
          if (obj.material) {
            obj.material.transparent = true;
            obj.material.opacity = item.opacity * (obj._baseOpacity !== undefined ? obj._baseOpacity : 1);
          }
        });
      }

      // Despawn
      if (item.lifetime <= 0) {
        _scene.remove(item.group);
        _disposeGroup(item.group);
        _items.splice(i, 1);
        continue;
      }

      // Bob animation: y = groundY + 0.3 + 0.15 * sin(time * 2)
      item.group.position.y = item.groundY + 0.3 + 0.15 * Math.sin(_time * 2 + item.bobSeed);

      // Rotate slowly: 1 rad/s around Y axis
      item.group.rotation.y += delta * 1.0;

      // Collection check
      if (playerPos) {
        var dx = playerPos.x - item.group.position.x;
        var dz = playerPos.z - item.group.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < COLLECT_RADIUS) {
          // Apply effect
          _applyLoot(item.def, playerRef);
          _playCollectSFX();
          _showHUD(item.def.icon, item.def.label);
          // Remove from scene
          _scene.remove(item.group);
          _disposeGroup(item.group);
          _items.splice(i, 1);
          continue;
        }
      }
    }
  }

  /* ── Dispose Three.js objects to prevent memory leaks ────────────── */
  function _disposeGroup(group) {
    if (!group) return;
    group.traverse(function(obj) {
      if (obj.geometry) { try { obj.geometry.dispose(); } catch(e){} }
      if (obj.material) {
        if (obj.material.map) { try { obj.material.map.dispose(); } catch(e){} }
        try { obj.material.dispose(); } catch(e) {}
      }
    });
  }

  /* ── Public: clear() — remove all items from scene ──────────────── */
  function clear() {
    for (var i = 0; i < _items.length; i++) {
      if (_scene) _scene.remove(_items[i].group);
      _disposeGroup(_items[i].group);
    }
    _items = [];
  }

  /* ── Public: reset() — full state reset ─────────────────────────── */
  function reset() {
    clear();
    _time = 0;
    _hudTimer = 0;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ── Public API ──────────────────────────────────────────────────── */
  return {
    init:      init,
    update:    update,
    spawnLoot: spawnLoot,
    clear:     clear,
    reset:     reset
  };
})();
