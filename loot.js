/**
 * loot.js – Loot drop system for defeated enemies
 * Depends on: Three.js global (THREE), GameManager, Weapons, HUD
 */

window.Loot = (function() {
  'use strict';

  // Loot types with drop weights and properties
  var LOOT_TYPES = {
    AMMO:    { weight: 40, color: 0xffcc00, label: '📦 AMMO',   size: 0.35, effect: 'ammo' },
    HEALTH:  { weight: 25, color: 0xff3333, label: '❤️ +30 HP', size: 0.4,  effect: 'health' },
    OKC_S:   { weight: 20, color: 0x44ff88, label: '💰 +20 OKC', size: 0.3, effect: 'okc_small' },
    OKC_L:   { weight: 8,  color: 0xffaa00, label: '💰 +75 OKC', size: 0.45, effect: 'okc_large' },
    GRENADE: { weight: 5,  color: 0x888888, label: '💣 GRENADE', size: 0.35, effect: 'grenade' },
    ARMOR:   { weight: 2,  color: 0x4488cc, label: '🛡️ ARMOR',  size: 0.45, effect: 'armor' },
  };

  // Active loot items in world
  var _items = [];
  var _scene = null;

  function init(scene) {
    _scene = scene;
  }

  // Called when an enemy dies; rolls for loot drop
  function dropAt(position, enemyType) {
    if (!_scene) return;

    // 60% chance for a drop
    if (Math.random() > 0.60) return;

    // Weighted random selection
    var type = _weightedRandom(LOOT_TYPES);
    if (!type) return;

    // Create spinning pickup mesh: CylinderGeometry (hexagonal disc)
    var mat = new THREE.MeshStandardMaterial({
      color: type.color,
      emissive: type.color,
      emissiveIntensity: 0.3,
      roughness: 0.5
    });
    var geo = new THREE.CylinderGeometry(type.size, type.size, 0.12, 6);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position.x, position.y + 0.5, position.z);

    // Glow ring: TorusGeometry around the disc
    var glowMat = new THREE.MeshBasicMaterial({
      color: type.color,
      transparent: true,
      opacity: 0.4
    });
    var glowGeo = new THREE.TorusGeometry(type.size + 0.1, 0.04, 6, 12);
    var glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    mesh.add(glow);

    _scene.add(mesh);
    _items.push({
      mesh: mesh,
      type: type,
      bobOffset: Math.random() * Math.PI * 2,
      lifetime: 30.0  // 30 seconds before despawn
    });
  }

  // Update loot items: bobbing, spinning, collision detection
  function update(dt, playerPos) {
    if (!playerPos || !_scene) return;

    for (var i = _items.length - 1; i >= 0; i--) {
      var item = _items[i];
      item.lifetime -= dt;

      // Bob and spin
      item.bobOffset += dt * 2.0;
      item.mesh.position.y += Math.sin(item.bobOffset) * 0.002;
      item.mesh.rotation.y += dt * 1.5;

      // Pulse glow
      if (item.mesh.children[0]) {
        item.mesh.children[0].material.opacity = 0.3 + Math.sin(item.bobOffset * 2) * 0.15;
      }

      // Pickup detection (within 1.5 units)
      var dx = playerPos.x - item.mesh.position.x;
      var dz = playerPos.z - item.mesh.position.z;
      if (dx * dx + dz * dz < 2.25) {
        _applyEffect(item.type);
        if (window.AudioSystem && AudioSystem.playLootPickup) AudioSystem.playLootPickup();
        _scene.remove(item.mesh);
        _items.splice(i, 1);
        continue;
      }

      // Despawn after lifetime
      if (item.lifetime <= 0) {
        _scene.remove(item.mesh);
        _items.splice(i, 1);
      }
    }
  }

  function _applyEffect(type) {
    switch(type.effect) {
      case 'health':
        if (window.GameManager && GameManager.healPlayer) {
          GameManager.healPlayer(30);
        }
        break;
      case 'ammo':
        if (window.Weapons && Weapons.refillCurrentAmmo) {
          Weapons.refillCurrentAmmo(30);
        }
        break;
      case 'okc_small':
        if (window.GameManager && GameManager.addOKC) {
          GameManager.addOKC(20);
        }
        break;
      case 'okc_large':
        if (window.GameManager && GameManager.addOKC) {
          GameManager.addOKC(75);
        }
        break;
      case 'grenade':
        window._bonusGrenades = (window._bonusGrenades || 0) + 1;
        break;
      case 'armor':
        window._armorDamageReduction = Math.min(0.7, (window._armorDamageReduction || 0) + 0.15);
        break;
    }

    // Show pickup notification
    if (window.HUD && HUD.notifyPickup) {
      var colorHex = '#' + type.color.toString(16).padStart(6, '0');
      HUD.notifyPickup(type.label, colorHex);
    }
  }

  // Weighted random selection from loot types
  function _weightedRandom(types) {
    var total = 0;
    var keys = Object.keys(types);

    keys.forEach(function(k) {
      total += types[k].weight;
    });

    var r = Math.random() * total;
    for (var ki = 0; ki < keys.length; ki++) {
      r -= types[keys[ki]].weight;
      if (r <= 0) return types[keys[ki]];
    }
    return types[keys[0]];
  }

  // Clear all loot items (e.g., on stage transition)
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
