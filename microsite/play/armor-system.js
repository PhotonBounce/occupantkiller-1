window.ArmorSystem = (function() {
  'use strict';

  var _armor = 0;
  var _maxArmor = 100;
  var _armorType = 'light'; // light, medium, heavy
  var _hudEl = null;
  var _audioCtx = null;
  var _durability = 100;
  var _maxDurability = 100;
  var _pickupTimer = 0;
  var _pickups = [];
  var _scene = null;
  var _camera = null;
  var _lastHitTime = 0;

  var ARMOR_TYPES = {
    light:  { absorption: 0.30, maxArmor: 60,  move: 1.0,  color: 0x4A6FA5, label: 'LIGHT VEST' },
    medium: { absorption: 0.50, maxArmor: 80,  move: 0.95, color: 0x556B2F, label: 'BODY ARMOR' },
    heavy:  { absorption: 0.70, maxArmor: 100, move: 0.85, color: 0x444444, label: 'HEAVY PLATES' }
  };

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playArmorHit() {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
  }

  function _playPickup() {
    try {
      var ctx = _getAudio();
      var freqs = [523, 659, 784];
      for (var i = 0; i < freqs.length; i++) {
        (function(f, d) {
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = 'sine'; osc.frequency.value = f;
          g.gain.setValueAtTime(0.08, ctx.currentTime + d);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d + 0.2);
          osc.start(ctx.currentTime + d); osc.stop(ctx.currentTime + d + 0.2);
        })(freqs[i], i * 0.1);
      }
    } catch(e) {}
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'armor-system-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:85px;left:16px;color:#4A6FA5;font-family:monospace;font-size:13px;font-weight:bold;text-shadow:0 0 6px #2244AA;z-index:1350;pointer-events:none';
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_armor <= 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var t = ARMOR_TYPES[_armorType];
    var bars = Math.round((_armor / _maxArmor) * 10);
    var bar = '█'.repeat(bars) + '░'.repeat(10 - bars);
    var durPct = Math.round(_durability);
    _hudEl.textContent = '🛡 ' + _armor + '/' + _maxArmor + ' [' + bar + '] ' + (durPct < 50 ? 'WORN' : '');
    _hudEl.style.color = _armor < 20 ? '#FF4400' : (_armor < 50 ? '#FF8800' : '#4A6FA5');
  }

  function absorbDamage(rawDamage) {
    if (_armor <= 0) return rawDamage;
    var t = ARMOR_TYPES[_armorType];
    var absorbed = rawDamage * t.absorption;
    var passthrough = rawDamage - absorbed;

    // Reduce armor value
    _armor = Math.max(0, _armor - absorbed * 0.3);

    // Reduce durability
    _durability = Math.max(0, _durability - rawDamage * 0.5);

    // Durability affects absorption
    var durFactor = _durability / _maxDurability;
    if (durFactor < 0.5) {
      var penaltyAbsorbed = absorbed * (1 - durFactor * 2 * 0.3);
      passthrough += penaltyAbsorbed;
    }

    _playArmorHit();
    _lastHitTime = Date.now() / 1000;

    // Spark effect on armor hit
    var flash = document.getElementById('armor-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.id = 'armor-flash';
      flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(74,111,165,0.2);pointer-events:none;z-index:1900;opacity:0;transition:opacity 0.1s';
      document.body.appendChild(flash);
    }
    flash.style.opacity = '1';
    setTimeout(function() { flash.style.opacity = '0'; }, 100);

    if (_durability <= 0) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('⚠ ARMOR DEPLETED');
      _armor = 0;
    }
    if (_armor <= 20 && _armor > 0) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('⚠ ARMOR LOW');
    }

    _updateHUD();
    return Math.round(passthrough);
  }

  function equip(type, amount) {
    if (!ARMOR_TYPES[type]) type = 'light';
    _armorType = type;
    var t = ARMOR_TYPES[type];
    _maxArmor = t.maxArmor;
    _armor = Math.min(_armor + (amount || t.maxArmor), _maxArmor);
    _durability = 100;
    _maxDurability = 100;
    window._armorAbsorption = t.absorption;
    window._armorMovePenalty = t.move;
    if (window.HUD && window.HUD.showToast) window.HUD.showToast('🛡 ' + t.label + ' EQUIPPED');
    _playPickup();
    _updateHUD();
  }

  function _spawnArmorPickup(type) {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return;
    var cam = _camera || window._camera;
    var t = ARMOR_TYPES[type || 'medium'];
    var angle = Math.random() * Math.PI * 2;
    var dist = 15 + Math.random() * 15;
    var x = (cam ? cam.position.x : 0) + Math.cos(angle) * dist;
    var z = (cam ? cam.position.z : 0) + Math.sin(angle) * dist;

    var group = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.15);
    var bodyMat = new THREE.MeshLambertMaterial({ color: t.color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    // Shoulder straps
    [-0.15, 0.15].forEach(function(ox) {
      var strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.1), bodyMat);
      strap.position.set(ox, 0.35, 0);
      group.add(strap);
    });

    var light = new THREE.PointLight(t.color, 3, 3);
    group.position.set(x, 1.0, z);
    sc.add(group);
    sc.add(light);
    light.position.set(x, 1.5, z);

    _pickups.push({ group: group, light: light, type: type || 'medium', collected: false, timer: 0 });
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;
    _createHUD();

    window._armorAbsorption = 0;
    window._armorMovePenalty = 1.0;
    window._absorbArmorDamage = absorbDamage;
    window._equipArmor = equip;

    // Spawn light vest pickup after 20s
    setTimeout(function() { _spawnArmorPickup('light'); }, 20000);
    setTimeout(function() { _spawnArmorPickup('medium'); }, 80000);
  }

  function update(dt) {
    var sc = _scene || window._gameScene || window._scene;
    var cam = _camera || window._camera;

    _pickupTimer += dt;
    if (_pickupTimer > 120) {
      _pickupTimer = 0;
      _spawnArmorPickup(Math.random() > 0.5 ? 'medium' : 'heavy');
    }

    // Animate and check pickups
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var p = _pickups[i];
      if (p.collected) { _pickups.splice(i, 1); continue; }
      p.timer += dt;
      p.group.rotation.y += dt;
      p.group.position.y = 1.0 + Math.sin(p.timer * 2) * 0.1;
      p.light.position.copy(p.group.position);
      p.light.position.y += 0.5;

      if (cam) {
        var dx = cam.position.x - p.group.position.x;
        var dz = cam.position.z - p.group.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.8) {
          p.collected = true;
          sc.remove(p.group);
          sc.remove(p.light);
          equip(p.type, ARMOR_TYPES[p.type].maxArmor);
        } else if (dist < 5) {
          if (window.HUD && window.HUD.showToast && Math.floor(p.timer * 2) % 4 === 0 && Math.floor((p.timer + dt) * 2) % 4 !== 0) {
            window.HUD.showToast('🛡 ' + ARMOR_TYPES[p.type].label + ' NEARBY');
          }
        }
      }
    }
  }

  function reset() {
    _armor = 0;
    _durability = 0;
    _armorType = 'light';
    window._armorAbsorption = 0;
    window._armorMovePenalty = 1.0;
    var sc = _scene || window._gameScene || window._scene;
    for (var i = 0; i < _pickups.length; i++) {
      if (sc) { sc.remove(_pickups[i].group); sc.remove(_pickups[i].light); }
    }
    _pickups = [];
    _updateHUD();
  }

  function getArmor() { return _armor; }
  function getMaxArmor() { return _maxArmor; }
  function getType() { return _armorType; }

  return { init: init, update: update, absorbDamage: absorbDamage, equip: equip, reset: reset, getArmor: getArmor, getMaxArmor: getMaxArmor, getType: getType };
})();
