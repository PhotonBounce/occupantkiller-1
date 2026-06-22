window.Airdrop = (function() {
  'use strict';

  var _scene = null;
  var _airdrop = null; // { group, crate, chute, lines, vy, landed, timer }
  var _active = false;

  function init(scene) {
    _scene = scene;
  }

  function _buildChuteGroup() {
    var group = new THREE.Group();

    // Crate (green supply box)
    var crateGeo = new THREE.BoxGeometry(1.2, 0.9, 1.2);
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x4a6b3a });
    var crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.y = 0.45;
    group.add(crate);

    // Red cross on top
    var crossH = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    crossH.position.y = 0.93;
    group.add(crossH);
    var crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.05, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    crossV.position.y = 0.93;
    group.add(crossV);

    // Suspension lines (4 strings from crate corners to chute)
    var lineMat = new THREE.LineBasicMaterial({ color: 0xccccaa });
    var lineOffsets = [[-0.5, 0.9, -0.5], [0.5, 0.9, -0.5], [-0.5, 0.9, 0.5], [0.5, 0.9, 0.5]];
    lineOffsets.forEach(function(off) {
      var pts = [new THREE.Vector3(off[0], off[1], off[2]), new THREE.Vector3(0, 5.5, 0)];
      var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(lineGeo, lineMat));
    });

    // Parachute canopy (hemisphere)
    var chuteGeo = new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    var chuteMat = new THREE.MeshLambertMaterial({ color: 0xeeeedd, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    var chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.y = 5.5;
    chute.rotation.x = Math.PI; // dome faces down
    group.add(chute);

    return { group: group, crate: crate, chute: chute, crateRef: crate };
  }

  function spawn(x, z) {
    if (_active || !_scene) return;
    _active = true;

    var built = _buildChuteGroup();
    built.group.position.set(x, 80, z);
    _scene.add(built.group);

    _airdrop = {
      group: built.group,
      chute: built.chute,
      crateRef: built.crateRef,
      vy: 0,
      landed: false,
      timer: 30
    };

    // HUD notice
    if (window.HUD && HUD.showToast) {
      HUD.showToast('📦 SUPPLY AIRDROP INBOUND!', 3000, '#44aaff');
    }

    // Play audio (helicopter)
    try {
      if (window.AudioSystem && AudioSystem.playVehicleEngine) AudioSystem.playVehicleEngine('helo');
    } catch(e) {}
  }

  function spawnNearPlayer(playerPos) {
    if (_active) return;
    // Drop 20-35 units ahead of player in a random forward direction
    var angle = Math.random() * Math.PI * 2;
    var dist = 20 + Math.random() * 15;
    spawn(
      playerPos.x + Math.cos(angle) * dist,
      playerPos.z + Math.sin(angle) * dist
    );
  }

  function update(dt, playerPos) {
    if (!_active || !_airdrop) return;

    if (!_airdrop.landed) {
      // Terminal velocity descent with parachute deceleration
      _airdrop.vy = Math.max(_airdrop.vy - dt * 4, -6); // accelerate to -6 m/s max
      _airdrop.group.position.y += _airdrop.vy * dt;

      // Gentle sway
      _airdrop.group.rotation.z = Math.sin(Date.now() * 0.001) * 0.04;

      // Ground check
      var groundY = 0;
      try {
        if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
          groundY = VoxelWorld.getTerrainHeight(
            Math.round(_airdrop.group.position.x),
            Math.round(_airdrop.group.position.z)
          ) || 0;
        }
      } catch(e) {}

      if (_airdrop.group.position.y <= groundY + 0.45) {
        _airdrop.group.position.y = groundY + 0.45;
        _airdrop.landed = true;
        _airdrop.vy = 0;
        _airdrop.group.rotation.z = 0;

        // Deflate chute
        if (_airdrop.chute) {
          _airdrop.chute.material.opacity = 0.3;
          _airdrop.chute.position.y = 1.5; // chute sags to ground
        }

        // Landing thud
        try {
          if (window.AudioSystem && AudioSystem.playLandingThud) AudioSystem.playLandingThud(1.0);
          if (window.AudioSystem && AudioSystem.playExplosion) AudioSystem.playExplosion(0.2);
        } catch(e) {}

        if (window.HUD && HUD.showToast) {
          HUD.showToast('📦 AIRDROP LANDED — grab it!', 4000, '#44ff88');
        }
      }
    } else {
      // On ground: check player pickup radius
      _airdrop.timer -= dt;

      if (playerPos) {
        var dx = playerPos.x - _airdrop.group.position.x;
        var dz = playerPos.z - _airdrop.group.position.z;
        if (dx * dx + dz * dz < 4) { // 2m radius
          _collect();
          return;
        }
      }

      if (_airdrop.timer <= 0) {
        _despawn();
      }
    }
  }

  function _collect() {
    if (!_active) return;

    // Apply rewards
    try {
      if (window.GameManager && GameManager.healPlayer) {
        GameManager.healPlayer(50);
      } else if (window.player) {
        player.hp = Math.min((player.maxHp || 100), (player.hp || 100) + 50);
      }
    } catch(e) {}

    try {
      if (window.Weapons && Weapons.addAmmo) Weapons.addAmmo(60);
    } catch(e) {}

    try {
      if (window.GameManager && GameManager.addGrenade) {
        GameManager.addGrenade(1);
      }
    } catch(e) {}

    try {
      if (window.Marketplace && Marketplace.addOKC) {
        Marketplace.addOKC(25);
      }
    } catch(e) {}

    if (window.HUD && HUD.showToast) {
      HUD.showToast('📦 AIRDROP COLLECTED! +50HP +60 ammo +1 grenade +25 OKC', 4000, '#00ff88');
    }

    try {
      if (window.AudioSystem && AudioSystem.playLootPickup) AudioSystem.playLootPickup();
    } catch(e) {}

    _despawn();
  }

  function _despawn() {
    if (_airdrop && _airdrop.group && _scene) {
      _scene.remove(_airdrop.group);
    }
    _airdrop = null;
    _active = false;
  }

  function isActive() { return _active; }

  function clear() {
    _despawn();
  }

  return {
    init: init,
    spawn: spawn,
    spawnNearPlayer: spawnNearPlayer,
    update: update,
    isActive: isActive,
    clear: clear
  };
})();
