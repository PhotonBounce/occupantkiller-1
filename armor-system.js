window.ArmorSystem = (function() {
  'use strict';
  // var only

  var _scene = null;
  var _pickups = [];        // active armor pickup objects in world
  var _playerArmor = 0;    // current armor value (0-100)
  var _maxArmor = 100;
  var _armorEl = null;     // HUD element
  var _armorBarEl = null;
  var PICKUP_RADIUS = 1.8;  // collect range
  var DROP_CHANCE = 0.12;   // 12% drop chance per kill

  // Armor tiers
  var ARMOR_TIERS = [
    { id: 'LIGHT',   color: 0x44aaff, amount: 20, label: '🛡 Soft Vest',      points: 20 },
    { id: 'MEDIUM',  color: 0x4488ff, amount: 40, label: '🛡 Tactical Vest',  points: 40 },
    { id: 'HEAVY',   color: 0x2255dd, amount: 60, label: '🛡 Ceramic Plate',  points: 60 },
  ];

  function _createHUD() {
    // Armor bar positioned next to health bar
    _armorEl = document.createElement('div');
    _armorEl.id = 'armor-hud';
    _armorEl.style.cssText = [
      'position:fixed;bottom:55px;right:15px;',
      'font-family:monospace;font-size:11px;color:#44aaff;',
      'pointer-events:none;z-index:4000;',
      'display:flex;align-items:center;gap:6px;',
    ].join('');

    var icon = document.createElement('span');
    icon.textContent = '🛡';

    var barOuter = document.createElement('div');
    barOuter.style.cssText = 'width:80px;height:6px;background:rgba(0,0,0,0.5);border:1px solid rgba(68,170,255,0.3);border-radius:3px;overflow:hidden;';

    _armorBarEl = document.createElement('div');
    _armorBarEl.style.cssText = 'height:100%;background:linear-gradient(90deg,#2255dd,#44aaff);transition:width 0.3s;width:0%;';

    var valueEl = document.createElement('span');
    valueEl.id = 'armor-value';
    valueEl.textContent = '0';
    valueEl.style.cssText = 'color:#44aaff;min-width:24px;';

    barOuter.appendChild(_armorBarEl);
    _armorEl.appendChild(icon);
    _armorEl.appendChild(barOuter);
    _armorEl.appendChild(valueEl);
    document.body.appendChild(_armorEl);
  }

  function _updateHUD() {
    if (!_armorBarEl) return;
    var pct = Math.min(100, (_playerArmor / _maxArmor) * 100);
    _armorBarEl.style.width = pct + '%';
    var valueEl = document.getElementById('armor-value');
    if (valueEl) valueEl.textContent = Math.round(_playerArmor);
    if (_armorEl) _armorEl.style.opacity = _playerArmor > 0 ? '1' : '0.3';
  }

  function _createPickupMesh(tier, x, y, z) {
    var group = new THREE.Group();

    // Vest shape: flat box
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.15);
    var bodyMat = new THREE.MeshLambertMaterial({ color: tier.color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Glow point light
    var light = new THREE.PointLight(tier.color, 1.5, 2.5);
    light.position.y = 0.5;
    group.add(light);

    // Floating animation offset
    group.position.set(x, y + 0.4, z);
    group._bobOffset = Math.random() * Math.PI * 2;

    if (_scene) _scene.add(group);
    return group;
  }

  function tryDrop(x, y, z) {
    if (Math.random() > DROP_CHANCE) return;

    // Random tier (weighted: mostly light, rarely heavy)
    var r = Math.random();
    var tier;
    if (r < 0.6) tier = ARMOR_TIERS[0];      // 60% light
    else if (r < 0.9) tier = ARMOR_TIERS[1]; // 30% medium
    else tier = ARMOR_TIERS[2];              // 10% heavy

    if (!_scene) return;

    _pickups.push({
      mesh: _createPickupMesh(tier, x, y, z),
      tier: tier,
      collected: false,
    });
  }

  function update(delta, playerPos) {
    if (!playerPos || !_scene) return;

    var t = performance.now() / 1000;

    for (var i = _pickups.length - 1; i >= 0; i--) {
      var p = _pickups[i];
      if (p.collected) { _pickups.splice(i, 1); continue; }

      // Float bob animation
      p.mesh.position.y = 0.4 + Math.sin(t * 2 + p.mesh._bobOffset) * 0.1;
      p.mesh.rotation.y += delta * 1.5;

      // Pulse light
      if (p.mesh.children[1]) {
        p.mesh.children[1].intensity = 0.8 + 0.7 * Math.sin(t * 3);
      }

      // Collect check
      var dx = playerPos.x - p.mesh.position.x;
      var dz = playerPos.z - p.mesh.position.z;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < PICKUP_RADIUS) {
        _collect(p, i);
      }
    }
  }

  function _collect(pickup, idx) {
    pickup.collected = true;

    var added = Math.min(pickup.tier.points, _maxArmor - _playerArmor);
    _playerArmor = Math.min(_maxArmor, _playerArmor + pickup.tier.points);

    if (_scene) _scene.remove(pickup.mesh);
    _pickups.splice(idx, 1);

    _updateHUD();

    // Show pickup notification
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(pickup.tier.label + ' +' + added);
    }
  }

  function absorbDamage(incomingDamage) {
    if (_playerArmor <= 0) return incomingDamage;

    // Armor absorbs 60% of damage, degrades
    var absorbed = Math.min(_playerArmor, incomingDamage * 0.6);
    _playerArmor = Math.max(0, _playerArmor - absorbed);
    _updateHUD();

    return incomingDamage - absorbed; // remaining damage to HP
  }

  function init(scene) {
    _scene = scene;
    _playerArmor = 0;
    _createHUD();
    _updateHUD();
  }

  function setArmor(amount) {
    _playerArmor = Math.min(_maxArmor, Math.max(0, amount));
    _updateHUD();
  }

  function getArmor() { return _playerArmor; }

  function clear() {
    for (var i = 0; i < _pickups.length; i++) {
      if (_scene && !_pickups[i].collected) _scene.remove(_pickups[i].mesh);
    }
    _pickups = [];
  }

  function reset() {
    clear();
    _playerArmor = 0;
    _updateHUD();
  }

  return {
    init: init,
    tryDrop: tryDrop,
    update: update,
    absorbDamage: absorbDamage,
    setArmor: setArmor,
    getArmor: getArmor,
    clear: clear,
    reset: reset,
  };
})();
