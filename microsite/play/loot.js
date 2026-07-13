/**
 * loot.js – Loot drop system for defeated enemies
 * Depends on: Three.js global (THREE), GameManager, Weapons, HUD
 */

window.Loot = (function() {
  'use strict';

  // Base loot types with drop weights and properties
  var LOOT_TYPES = {
    AMMO:       { weight: 35, color: 0xffcc00, label: '📦 AMMO +30',   size: 0.32, effect: 'ammo',     shape: 'box' },
    HEALTH:     { weight: 20, color: 0xff3333, label: '❤️ +30 HP',     size: 0.38, effect: 'health',   shape: 'cross' },
    OKC_S:      { weight: 18, color: 0x44ff88, label: '💰 +20 OKC',    size: 0.28, effect: 'okc_small',shape: 'disc' },
    OKC_L:      { weight: 7,  color: 0xffaa00, label: '💰 +75 OKC',    size: 0.42, effect: 'okc_large',shape: 'disc' },
    GRENADE:    { weight: 8,  color: 0x888888, label: '💣 +2 GRENADES', size: 0.34, effect: 'grenade',  shape: 'sphere' },
    ARMOR:      { weight: 4,  color: 0x4488cc, label: '🛡️ ARMOR SHARD',size: 0.42, effect: 'armor',    shape: 'box' },
    MEDKIT:     { weight: 4,  color: 0xff6666, label: '🩹 MEDKIT +60 HP',size: 0.45, effect: 'medkit', shape: 'cross' },
    FULL_AMMO:  { weight: 3,  color: 0xffdd00, label: '📦 FULL AMMO',  size: 0.45, effect: 'full_ammo',shape: 'box' },
    STAMPACK:   { weight: 1,  color: 0x88ffcc, label: '⚡ STAMINA PACK',size: 0.35, effect: 'stamina', shape: 'sphere' },
  };

  // Heavy enemy / boss loot table (better drops)
  var HEAVY_LOOT = {
    MEDKIT:   { weight: 30, color: 0xff6666, label: '🩹 MEDKIT +60 HP', size: 0.45, effect: 'medkit',    shape: 'cross' },
    OKC_L:    { weight: 25, color: 0xffaa00, label: '💰 +75 OKC',       size: 0.45, effect: 'okc_large', shape: 'disc' },
    FULL_AMMO:{ weight: 25, color: 0xffdd00, label: '📦 FULL AMMO',     size: 0.45, effect: 'full_ammo', shape: 'box' },
    ARMOR:    { weight: 20, color: 0x4488cc, label: '🛡️ ARMOR SHARD',  size: 0.48, effect: 'armor',     shape: 'box' },
  };

  // Active loot items in world
  var _items = [];
  var _scene = null;

  // Reusable geometries
  var _geoBox = null;
  var _geoSphere = null;
  var _geoDisc = null;
  var _geoCross1 = null;
  var _geoCross2 = null;

  function init(scene) {
    _scene = scene;
    _geoBox    = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    _geoSphere = new THREE.SphereGeometry(0.16, 6, 6);
    _geoDisc   = new THREE.CylinderGeometry(0.22, 0.22, 0.10, 8);
    _geoCross1 = new THREE.BoxGeometry(0.44, 0.12, 0.12);
    _geoCross2 = new THREE.BoxGeometry(0.12, 0.44, 0.12);
  }

  // Called when an enemy dies
  // position: THREE.Vector3, enemyType: string or number, enemyTier: 'normal'|'heavy'|'boss'
  function dropAt(position, enemyType, enemyTier) {
    if (!_scene) return;

    var dropChance = 0.65;
    var lootTable = LOOT_TYPES;

    if (enemyTier === 'boss') {
      // Bosses always drop 3 items
      dropChance = 1.0;
      lootTable = HEAVY_LOOT;
      _spawnDrop(position, _weightedRandom(HEAVY_LOOT), 0.8);
      _spawnDrop(position, _weightedRandom(LOOT_TYPES), 1.5);
      _spawnDrop(position, _weightedRandom(LOOT_TYPES), -1.0);
      return;
    } else if (enemyTier === 'heavy') {
      dropChance = 0.90;
      lootTable = HEAVY_LOOT;
    }

    if (Math.random() > dropChance) return;

    _spawnDrop(position, _weightedRandom(lootTable), 0);
    // 20% chance of a bonus second drop
    if (Math.random() < 0.20) {
      _spawnDrop(position, _weightedRandom(LOOT_TYPES), 0.8 + Math.random() * 0.8);
    }
  }

  function _spawnDrop(position, type, offsetX) {
    if (!type || !_scene) return;

    var mat = new THREE.MeshStandardMaterial({
      color: type.color,
      emissive: type.color,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.3
    });

    var meshMain;
    if (type.shape === 'cross') {
      // Health cross shape
      var group = new THREE.Group();
      group.add(new THREE.Mesh(_geoCross1 || new THREE.BoxGeometry(0.44,0.12,0.12), mat));
      group.add(new THREE.Mesh(_geoCross2 || new THREE.BoxGeometry(0.12,0.44,0.12), mat));
      meshMain = group;
    } else if (type.shape === 'sphere') {
      meshMain = new THREE.Mesh(_geoSphere || new THREE.SphereGeometry(0.16,6,6), mat);
    } else if (type.shape === 'disc') {
      meshMain = new THREE.Mesh(_geoDisc || new THREE.CylinderGeometry(0.22,0.22,0.10,8), mat);
    } else {
      meshMain = new THREE.Mesh(_geoBox || new THREE.BoxGeometry(0.22,0.22,0.22), mat);
    }

    meshMain.position.set(
      position.x + (offsetX || 0),
      position.y + 0.5,
      position.z + (Math.random() - 0.5) * 0.6
    );

    // Glow ring
    var glowMat = new THREE.MeshBasicMaterial({
      color: type.color,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    var glowGeo = new THREE.TorusGeometry((type.size || 0.3) + 0.1, 0.035, 6, 14);
    var glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    meshMain.add(glow);

    _scene.add(meshMain);
    _items.push({
      mesh: meshMain,
      type: type,
      bobOffset: Math.random() * Math.PI * 2,
      lifetime: 35.0
    });
  }

  // Update loot items: bobbing, spinning, collision detection
  function update(dt, playerPos) {
    if (!playerPos || !_scene) return;

    for (var i = _items.length - 1; i >= 0; i--) {
      var item = _items[i];
      item.lifetime -= dt;

      item.bobOffset += dt * 2.2;
      item.mesh.position.y += Math.sin(item.bobOffset) * 0.0025;
      item.mesh.rotation.y += dt * 1.6;

      if (item.mesh.children[0]) {
        item.mesh.children[0].material.opacity = 0.25 + Math.sin(item.bobOffset * 2) * 0.15;
      }

      // Flicker warning when about to despawn
      if (item.lifetime < 5.0) {
        var vis = (Math.floor(item.lifetime * 4) % 2 === 0);
        item.mesh.visible = vis;
      }

      // Pickup detection (1.8 unit radius)
      var dx = playerPos.x - item.mesh.position.x;
      var dz = playerPos.z - item.mesh.position.z;
      if (dx * dx + dz * dz < 3.24) {
        _applyEffect(item.type);
        if (window.AudioSystem && AudioSystem.playLootPickup) AudioSystem.playLootPickup();
        _scene.remove(item.mesh);
        _items.splice(i, 1);
        continue;
      }

      if (item.lifetime <= 0) {
        _scene.remove(item.mesh);
        _items.splice(i, 1);
      }
    }
  }

  function _applyEffect(type) {
    switch(type.effect) {
      case 'health':
        if (window.GameManager && GameManager.healPlayer) GameManager.healPlayer(30);
        break;
      case 'medkit':
        if (window.GameManager && GameManager.healPlayer) GameManager.healPlayer(60);
        break;
      case 'ammo':
        if (window.Weapons && Weapons.refillCurrentAmmo) Weapons.refillCurrentAmmo(30);
        break;
      case 'full_ammo':
        if (window.Weapons && Weapons.refillAllAmmo) Weapons.refillAllAmmo();
        break;
      case 'okc_small':
        if (window.GameManager && GameManager.addOKC) GameManager.addOKC(20);
        break;
      case 'okc_large':
        if (window.GameManager && GameManager.addOKC) GameManager.addOKC(75);
        break;
      case 'grenade':
        window._bonusGrenades = (window._bonusGrenades || 0) + 2;
        break;
      case 'armor':
        window._armorDamageReduction = Math.min(0.75, (window._armorDamageReduction || 0) + 0.15);
        break;
      case 'stamina':
        // Restore stamina — game-manager reads window._staminaRefill
        window._staminaRefill = true;
        break;
    }

    if (window.HUD && HUD.notifyPickup) {
      var colorHex = '#' + type.color.toString(16).padStart(6, '0');
      HUD.notifyPickup(type.label, colorHex);
    }
  }

  function _weightedRandom(types) {
    var total = 0;
    var keys = Object.keys(types);
    for (var i = 0; i < keys.length; i++) total += types[keys[i]].weight;
    var r = Math.random() * total;
    for (var ki = 0; ki < keys.length; ki++) {
      r -= types[keys[ki]].weight;
      if (r <= 0) return types[keys[ki]];
    }
    return types[keys[0]];
  }

  function clear() {
    _items.forEach(function(item) {
      if (_scene) _scene.remove(item.mesh);
    });
    _items.length = 0;
  }

  return {
    init: init,
    dropAt: dropAt,
    update: update,
    clear: clear
  };
})();
