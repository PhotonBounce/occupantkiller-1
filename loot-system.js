window.LootSystem = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _drops = [];
  var _audioCtx = null;
  var _hudEl = null;
  var _pickupTimer = 0;
  var _lastPickup = null;
  var _lastPickupTimer = 0;

  var RARITIES = { COMMON: 'COMMON', UNCOMMON: 'UNCOMMON', RARE: 'RARE', EPIC: 'EPIC', LEGENDARY: 'LEGENDARY' };

  var LOOT_TABLE = [
    { id: 'ammo_pack', name: 'AMMO PACK', rarity: RARITIES.COMMON, weight: 35, color: 0x888844, icon: '🔧',
      effect: function() {
        if (window._addAmmo) window._addAmmo(40);
        else if (window.player && window.player.ammo !== undefined) window.player.ammo = Math.min(999, (window.player.ammo || 0) + 40);
      }
    },
    { id: 'medkit', name: 'MEDKIT', rarity: RARITIES.COMMON, weight: 30, color: 0xFF4444, icon: '🩹',
      effect: function() {
        var p = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
        if (p) { p.hp = Math.min(100, (p.hp || 50) + 30); if (window.HUD && window.HUD.setHealth) window.HUD.setHealth(p.hp); }
      }
    },
    { id: 'credits', name: 'CREDITS', rarity: RARITIES.UNCOMMON, weight: 20, color: 0xFFCC00, icon: '💰',
      effect: function() { window._credits = (window._credits || 0) + 150; }
    },
    { id: 'armor_vest', name: 'ARMOR VEST', rarity: RARITIES.UNCOMMON, weight: 12, color: 0x4488BB, icon: '🛡',
      effect: function() {
        window._armorAbsorption = Math.min(0.6, (window._armorAbsorption || 0) + 0.2);
        if (window.ArmorSystem && window.ArmorSystem.addArmor) window.ArmorSystem.addArmor(50);
      }
    },
    { id: 'speed_boost_item', name: 'STIM SHOT', rarity: RARITIES.RARE, weight: 8, color: 0xFF8800, icon: '💉',
      effect: function() {
        if (!window._adrenalineActive) {
          window._adrenalineActive = true;
          setTimeout(function() { window._adrenalineActive = false; }, 10000);
          if (window.HUD && window.HUD.showToast) window.HUD.showToast('STIM SHOT! +SPEED +DAMAGE 10s');
        }
      }
    },
    { id: 'grenade_pack', name: 'GRENADE PACK', rarity: RARITIES.RARE, weight: 7, color: 0xFF4400, icon: '💣',
      effect: function() {
        window._grenadeCount = Math.min(6, (window._grenadeCount || 0) + 2);
        window._grenadeCountBonus = (window._grenadeCountBonus || 0) + 2;
      }
    },
    { id: 'repair_kit', name: 'REPAIR KIT', rarity: RARITIES.UNCOMMON, weight: 10, color: 0x44CC44, icon: '🔩',
      effect: function() {
        window._weaponCondition = Math.min(100, (window._weaponCondition || 50) + 30);
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('WEAPON REPAIRED +30%');
      }
    },
    { id: 'tactical_nuke_intel', name: 'INTEL DOCS', rarity: RARITIES.EPIC, weight: 3, color: 0xAA44FF, icon: '📋',
      effect: function() {
        var p = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
        if (p) { p.score = (p.score || 0) + 500; if (window.HUD && window.HUD.setScore) window.HUD.setScore(p.score); }
        if (window.PerkSystem && window.PerkSystem.onKill) window.PerkSystem.onKill({ boss: true });
      }
    },
    { id: 'golden_ammo', name: 'GOLDEN AMMO', rarity: RARITIES.LEGENDARY, weight: 2, color: 0xFFDD00, icon: '✨',
      effect: function() {
        window._goldenAmmoActive = true;
        window._goldenAmmoShots = 20;
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('✨ GOLDEN AMMO: 2x DAMAGE 20 SHOTS');
      }
    }
  ];

  var RARITY_COLORS = {
    COMMON: '#888888', UNCOMMON: '#44AA44', RARE: '#4488FF',
    EPIC: '#AA44FF', LEGENDARY: '#FFCC00'
  };

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playPickupSound(rarity) {
    try {
      var ctx = _getAudioCtx();
      var freqs = rarity === RARITIES.LEGENDARY ? [523, 659, 784, 1047, 1319] :
        rarity === RARITIES.EPIC ? [440, 554, 659, 880] :
        rarity === RARITIES.RARE ? [392, 494, 587] :
        [330, 392];
      for (var i = 0; i < freqs.length; i++) {
        (function(freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.05, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.2);
        })(freqs[i], i * 0.1);
      }
    } catch(e) {}
  }

  function _rollLoot() {
    var totalWeight = 0;
    for (var i = 0; i < LOOT_TABLE.length; i++) totalWeight += LOOT_TABLE[i].weight;
    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < LOOT_TABLE.length; j++) {
      cumulative += LOOT_TABLE[j].weight;
      if (roll < cumulative) return LOOT_TABLE[j];
    }
    return LOOT_TABLE[0];
  }

  function _buildDropMesh(item) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: item.color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    var glowColor = {
      COMMON: 0x888888, UNCOMMON: 0x44FF44, RARE: 0x4488FF,
      EPIC: 0xAA44FF, LEGENDARY: 0xFFCC00
    }[item.rarity] || 0xFFFFFF;

    var light = new THREE.PointLight(glowColor, 2, 4);
    group.add(light);
    group.userData.light = light;

    if (item.rarity === RARITIES.LEGENDARY || item.rarity === RARITIES.EPIC) {
      var outerGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
      var outerMat = new THREE.MeshLambertMaterial({
        color: glowColor, transparent: true, opacity: 0.25, wireframe: true
      });
      var outer = new THREE.Mesh(outerGeo, outerMat);
      group.add(outer);
      group.userData.outerBox = outer;
    }

    return group;
  }

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'loot-pickup-toast';
    _hudEl.style.cssText = [
      'position:fixed', 'bottom:160px', 'left:50%',
      'transform:translateX(-50%)', 'font-family:monospace',
      'font-size:14px', 'font-weight:bold', 'text-align:center',
      'pointer-events:none', 'z-index:1600', 'display:none',
      'text-shadow:0 0 8px currentColor', 'letter-spacing:2px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _showPickupHUD(item) {
    if (!_hudEl) return;
    var col = RARITY_COLORS[item.rarity] || '#FFF';
    _hudEl.style.color = col;
    _hudEl.style.display = 'block';
    _hudEl.innerHTML = item.icon + ' [' + item.rarity + '] ' + item.name + ' ACQUIRED';
    _lastPickupTimer = 2.5;
  }

  function spawnDrop(x, y, z, forcedItem) {
    if (!_scene) return;
    var item = forcedItem || _rollLoot();
    var mesh = _buildDropMesh(item);
    mesh.position.set(x, y || 0.5, z);
    _scene.add(mesh);

    _drops.push({
      mesh: mesh,
      item: item,
      bobPhase: Math.random() * Math.PI * 2,
      age: 0,
      lifetime: 30,
      collected: false
    });
  }

  function _distSq(ax, az, bx, bz) {
    var dx = ax - bx; var dz = az - bz;
    return dx * dx + dz * dz;
  }

  function _hookKillDrops() {
    var prev = window._onEnemyKilled;
    window._onEnemyKilled = function(enemy) {
      if (prev) prev(enemy);
      if (!enemy || !enemy.mesh) return;
      var pos = enemy.mesh.position;
      var roll = Math.random();
      var isBoss = enemy.typeCfg && enemy.typeCfg.role === 'boss';
      var dropChance = isBoss ? 1.0 : 0.3;
      if (roll < dropChance) {
        var count = isBoss ? 3 : 1;
        for (var i = 0; i < count; i++) {
          spawnDrop(
            pos.x + (Math.random() - 0.5) * 2,
            0.5,
            pos.z + (Math.random() - 0.5) * 2
          );
        }
      }
    };
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _drops = [];
    _createHUD();
    _hookKillDrops();
    window._lootDrops = _drops;
    window._spawnLootDrop = spawnDrop;
  }

  function update(dt) {
    if (!_scene) return;

    if (_lastPickupTimer > 0) {
      _lastPickupTimer -= dt;
      if (_lastPickupTimer <= 0 && _hudEl) _hudEl.style.display = 'none';
    }

    var player = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
    var px = player && player.position ? (player.position.x || 0) : 0;
    var pz = player && player.position ? (player.position.z || 0) : 0;

    _pickupTimer -= dt;

    for (var i = _drops.length - 1; i >= 0; i--) {
      var d = _drops[i];
      if (d.collected) { _drops.splice(i, 1); continue; }

      d.age += dt;
      if (d.age >= d.lifetime) {
        _scene.remove(d.mesh);
        _drops.splice(i, 1);
        continue;
      }

      d.bobPhase += dt * 2.5;
      d.mesh.position.y = 0.5 + Math.sin(d.bobPhase) * 0.15;
      d.mesh.rotation.y += dt * 1.5;

      if (d.mesh.userData.outerBox) {
        d.mesh.userData.outerBox.rotation.y -= dt * 2;
        d.mesh.userData.outerBox.rotation.x += dt * 0.7;
      }

      var fade = d.lifetime - d.age;
      if (fade < 5 && d.mesh.userData.light) {
        d.mesh.userData.light.intensity = (fade / 5) * 2;
      }

      if (_pickupTimer <= 0) {
        var distSq = _distSq(px, pz, d.mesh.position.x, d.mesh.position.z);
        if (distSq < 2.25) {
          d.collected = true;
          _scene.remove(d.mesh);
          d.item.effect();
          _playPickupSound(d.item.rarity);
          _showPickupHUD(d.item);
          window._kfeSupplyFound = true;
        }
      }
    }

    if (_pickupTimer <= 0) _pickupTimer = 0.15;
  }

  function reset() {
    for (var i = 0; i < _drops.length; i++) {
      if (_drops[i].mesh) _scene && _scene.remove(_drops[i].mesh);
    }
    _drops = [];
    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, spawnDrop: spawnDrop, reset: reset };
})();
