window.SupplyCrate = (function() {
  var _scene = null;
  var _crates = [];
  var _time = 0;

  var CRATE_TYPES = {
    AMMO:   { color: 0xcc6600, icon: '📦', label: 'AMMO CRATE',   contents: { ammo: true } },
    MEDKIT: { color: 0xcc2222, icon: '🏥', label: 'MEDKIT CRATE', contents: { hp: 50 } },
    WEAPON: { color: 0x224488, icon: '🔫', label: 'WEAPON CRATE', contents: { weapon: true } },
    ARMOR:  { color: 0x446644, icon: '🛡',  label: 'ARMOR CRATE',  contents: { armor: 50 } },
    SUPPLY: { color: 0x886600, icon: '⭐', label: 'SUPPLY DROP',   contents: { hp: 25, ammo: true, armor: 25 } },
  };

  function _removeCrate(crate) {
    if (!crate) return;
    if (crate.parachute && _scene) {
      _scene.remove(crate.parachute);
      if (crate.parachute.geometry) crate.parachute.geometry.dispose();
      if (crate.parachute.material) crate.parachute.material.dispose();
    }
    if (crate.light && _scene) {
      _scene.remove(crate.light);
    }
    if (crate.mesh && _scene) {
      _scene.remove(crate.mesh);
      if (crate.mesh.geometry) crate.mesh.geometry.dispose();
      if (crate.mesh.material) crate.mesh.material.dispose();
    }
    crate.removed = true;
  }

  function dropCrate(crateTypeId, x, z) {
    if (!_scene) return;
    var type = CRATE_TYPES[crateTypeId];
    if (!type) type = CRATE_TYPES.SUPPLY;

    var targetY = 0;
    var startY = 30;

    // Box mesh
    var geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    var mat = new THREE.MeshLambertMaterial({ color: type.color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, startY, z);
    _scene.add(mesh);

    // Parachute
    var paraGeo = new THREE.ConeGeometry(1.2, 2, 6);
    var paraMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    var parachute = new THREE.Mesh(paraGeo, paraMat);
    parachute.position.set(x, startY + 2.5, z);
    _scene.add(parachute);

    // Pulse light (added after landing)
    var light = new THREE.PointLight(type.color, 0, 5);
    light.position.set(x, targetY + 1, z);

    var crate = {
      typeId: crateTypeId,
      type: type,
      mesh: mesh,
      parachute: parachute,
      light: light,
      targetY: targetY,
      landed: false,
      removed: false,
      collectFlash: 0,
    };
    _crates.push(crate);
    return crate;
  }

  function dropAtWave(waveNumber) {
    if (waveNumber < 2) return;

    // Random safe position near center for any wave >= 2
    var rx = Math.random() * 40 - 20;
    var rz = Math.random() * 40 - 20;

    // Determine which type to drop randomly for the base drop
    var typeKeys = Object.keys(CRATE_TYPES);
    var randomType = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    dropCrate(randomType, rx, rz);

    // Wave-specific guaranteed drops
    if (waveNumber === 3 || waveNumber === 5 || waveNumber === 7) {
      var ax = Math.random() * 40 - 20;
      var az = Math.random() * 40 - 20;
      dropCrate('AMMO', ax, az);
    }
    if (waveNumber === 4 || waveNumber === 6) {
      var mx = Math.random() * 40 - 20;
      var mz = Math.random() * 40 - 20;
      dropCrate('MEDKIT', mx, mz);
    }
    if (waveNumber === 5) {
      var wx = Math.random() * 40 - 20;
      var wz = Math.random() * 40 - 20;
      var specialType = Math.random() < 0.5 ? 'WEAPON' : 'SUPPLY';
      dropCrate(specialType, wx, wz);
    }
  }

  function _applyContents(crate, playerRef) {
    var contents = crate.type.contents;
    if (contents.hp) {
      playerRef.hp = Math.min(playerRef.maxHp || 100, playerRef.hp + contents.hp);
    }
    if (contents.ammo) {
      playerRef.ammo = Math.min(playerRef.maxAmmo || 90, (playerRef.ammo || 0) + 30);
    }
    if (contents.armor) {
      playerRef.armor = Math.min(100, (playerRef.armor || 0) + contents.armor);
    }
    if (contents.weapon) {
      if (typeof Weapons !== 'undefined' && Weapons.grantRandomWeapon) {
        Weapons.grantRandomWeapon(playerRef);
      }
    }
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(crate.type.icon + ' ' + crate.type.label + ' COLLECTED!', '#ffdd44');
    }
    if (typeof NightVision !== 'undefined') NightVision.recharge(25);
  }

  function update(delta, playerPos, playerRef) {
    _time += delta;

    for (var i = _crates.length - 1; i >= 0; i--) {
      var crate = _crates[i];
      if (!crate || crate.removed) {
        _crates.splice(i, 1);
        continue;
      }

      // Handle collect flash/removal
      if (crate.collectFlash > 0) {
        crate.collectFlash -= delta;
        if (crate.collectFlash <= 0) {
          _removeCrate(crate);
          _crates.splice(i, 1);
        }
        continue;
      }

      if (!crate.landed) {
        // Drop animation: fall toward targetY
        var current = crate.mesh.position.y;
        var next = Math.max(crate.targetY, current - delta * 12);
        crate.mesh.position.y = next;
        crate.parachute.position.y = next + 2.5;

        if (next <= crate.targetY) {
          // Landed
          crate.landed = true;
          // Remove parachute
          if (_scene) _scene.remove(crate.parachute);
          if (crate.parachute.geometry) crate.parachute.geometry.dispose();
          if (crate.parachute.material) crate.parachute.material.dispose();
          crate.parachute = null;

          // Play thud sound
          if (window.AudioSystem && window.AudioSystem.playExplosion) {
            window.AudioSystem.playExplosion(0.3, 0.1);
          }

          // Add pulse light
          if (_scene) _scene.add(crate.light);
        }
      } else {
        // On ground: pulse glow
        crate.light.intensity = 0.5 + 0.5 * Math.sin(_time * 3);

        // Check collection distance
        if (playerPos && playerRef) {
          var dx = playerPos.x - crate.mesh.position.x;
          var dz = playerPos.z - crate.mesh.position.z;
          var dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 2) {
            // Apply contents
            _applyContents(crate, playerRef);
            // Play pickup sound
            if (window.AudioSystem && window.AudioSystem.playPickup) {
              window.AudioSystem.playPickup();
            }
            // Flash white then remove
            if (crate.mesh.material) {
              crate.mesh.material.color.setHex(0xffffff);
            }
            crate.collectFlash = 0.15;
            // Remove light immediately
            if (crate.light && _scene) {
              _scene.remove(crate.light);
            }
          }
        }
      }
    }
  }

  function clear() {
    for (var i = 0; i < _crates.length; i++) {
      _removeCrate(_crates[i]);
    }
    _crates = [];
  }

  return {
    init: function(scene) {
      _scene = scene;
      _crates = [];
      _time = 0;
    },
    dropCrate: dropCrate,
    dropAtWave: dropAtWave,
    update: update,
    clear: clear,
  };
})();
