window.SupplyDrop = (function() {
  'use strict';

  // ── internal state ──────────────────────────────────────────────────────────
  var _scene       = null;
  var _camera      = null;
  var _player      = null;       // { position: THREE.Vector3, hp, ammo, grenades, stamina }
  var _enemies     = null;       // array of enemy objects with .position
  var _getEnemies  = null;       // optional function returning enemy array

  var _cooldown    = 0;          // seconds remaining on cooldown
  var COOLDOWN_MAX = 90;

  var _dropZone    = null;       // { marker, position }
  var _activeDrop  = null;       // current in-flight / landed crate data

  var _keys        = {};         // tracked key states
  var _sKeyDown    = false;
  var _dKeyDown    = false;

  var _hudEl       = null;

  // smoke particles array: { mesh, vy, life, maxLife }
  var _smokeParticles = [];

  // Crate type definitions
  var CRATE_TYPES = [
    { id: 'AMMO',       color: 0xff2222, beaconColor: 0xff2222, label: 'AMMO CRATE' },
    { id: 'MEDKIT',     color: 0xffffff, beaconColor: 0xffffff, label: 'MEDKIT CRATE' },
    { id: 'WEAPONS',    color: 0xaa22aa, beaconColor: 0xaa22aa, label: 'WEAPONS CRATE' },
    { id: 'EXPLOSIVES', color: 0xff8800, beaconColor: 0xff8800, label: 'EXPLOSIVES CRATE' },
    { id: 'FOOD',       color: 0x22cc44, beaconColor: 0x22cc44, label: 'FOOD CRATE' }
  ];

  // ── init ────────────────────────────────────────────────────────────────────
  function init(opts) {
    if (!opts) opts = {};
    _scene      = opts.scene      || null;
    _camera     = opts.camera     || null;
    _player     = opts.player     || null;
    _enemies    = opts.enemies    || [];
    _getEnemies = opts.getEnemies || null;

    _cooldown  = 0;
    _dropZone  = null;
    _activeDrop = null;
    _smokeParticles = [];

    _bindInputs();
    _buildHUD();
  }

  // ── input handling ──────────────────────────────────────────────────────────
  function _bindInputs() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('contextmenu', _onRightClick);
  }

  function _onKeyDown(e) {
    _keys[e.code] = true;

    // S+D combo → call supply drop
    if ((e.code === 'KeyS' || e.code === 'KeyD')) {
      if (_keys['KeyS'] && _keys['KeyD']) {
        _callSupplyDrop();
      }
    }

    // E to collect
    if (e.code === 'KeyE') {
      _tryCollect();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onRightClick(e) {
    e.preventDefault();
    _placeDropZone(e);
  }

  // ── drop zone marker ────────────────────────────────────────────────────────
  function _placeDropZone(mouseEvent) {
    if (!_scene || !_camera) return;

    // Raycast onto Y=0 plane
    var x = (mouseEvent.clientX / window.innerWidth)  * 2 - 1;
    var y = -(mouseEvent.clientY / window.innerHeight) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), _camera);

    var planeNormal = new THREE.Vector3(0, 1, 0);
    var planeConst  = 0;
    var plane       = new THREE.Plane(planeNormal, planeConst);
    var worldPos    = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, worldPos);

    if (!worldPos) return;

    // Remove old marker
    if (_dropZone && _dropZone.marker) {
      _scene.remove(_dropZone.marker);
    }

    var discGeo = new THREE.CylinderGeometry(5, 5, 0.05, 32);
    var discMat = new THREE.MeshBasicMaterial({
      color:       0xFFFF00,
      transparent: true,
      opacity:     0.55,
      depthWrite:  false
    });
    var disc = new THREE.Mesh(discGeo, discMat);
    disc.position.set(worldPos.x, 0.03, worldPos.z);
    _scene.add(disc);

    _dropZone = {
      marker:   disc,
      material: discMat,
      position: new THREE.Vector3(worldPos.x, 0, worldPos.z),
      pulseT:   0
    };
  }

  // ── call supply drop ────────────────────────────────────────────────────────
  function _callSupplyDrop() {
    if (_cooldown > 0)     return;
    if (_activeDrop)       return;
    if (!_scene)           return;

    // Default drop zone to in front of player if not set
    var pos;
    if (_dropZone) {
      pos = _dropZone.position.clone();
    } else if (_player && _player.position) {
      pos = _player.position.clone();
      pos.x += 10;
      pos.y  = 0;
    } else {
      pos = new THREE.Vector3(0, 0, 0);
    }

    _startCrateDrop(pos);
    _cooldown = COOLDOWN_MAX;

    // Enemy interception: 25% chance 2 enemies sprint toward drop zone
    if (Math.random() < 0.25) {
      _triggerEnemyInterception(pos);
    }
  }

  // ── build crate + parachute group ──────────────────────────────────────────
  function _startCrateDrop(targetPos) {
    var typeIndex = Math.floor(Math.random() * CRATE_TYPES.length);
    var crateType = CRATE_TYPES[typeIndex];

    var group = new THREE.Group();
    group.position.set(targetPos.x, 60, targetPos.z);

    // ── Crate body ──
    var crateGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(0, 0, 0);
    group.add(crateMesh);

    // White cross on front face: 2 thin strips
    var crossMatW = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.05), crossMatW);
    crossH.position.set(0, 0, 0.78);
    group.add(crossH);

    var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.2, 0.05), crossMatW);
    crossV.position.set(0, 0, 0.78);
    group.add(crossV);

    // ── Parachute canopy: half-dome ──
    // phiStart=0, phiLength=PI*2, thetaStart=0, thetaLength=PI/2
    var chuteGeo = new THREE.SphereGeometry(2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    var chuteMat = new THREE.MeshLambertMaterial({
      color:       0x4A5240,
      side:        THREE.DoubleSide,
      transparent: true,
      opacity:     0.92
    });
    var chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
    chuteMesh.position.set(0, 6, 0);
    chuteMesh.rotation.x = Math.PI; // dome faces downward
    group.add(chuteMesh);

    // ── 4 shroud lines crate corners → canopy ──
    var lineMat = new THREE.LineBasicMaterial({ color: 0xccccaa });
    var corners = [[-0.7, 0.75, -0.7], [0.7, 0.75, -0.7], [-0.7, 0.75, 0.7], [0.7, 0.75, 0.7]];
    var shroudLines = [];
    for (var ci = 0; ci < corners.length; ci++) {
      var c = corners[ci];
      var pts = [
        new THREE.Vector3(c[0], c[1], c[2]),
        new THREE.Vector3(0, 6, 0)
      ];
      var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var line = new THREE.Line(lineGeo, lineMat);
      group.add(line);
      shroudLines.push(line);
    }

    // ── Color-coded beacon light ──
    var beacon = new THREE.PointLight(crateType.beaconColor, 2.5, 18);
    beacon.position.set(0, 1, 0);
    group.add(beacon);

    _scene.add(group);

    _activeDrop = {
      group:      group,
      crateMesh:  crateMesh,
      chuteMesh:  chuteMesh,
      shroudLines:shroudLines,
      beacon:     beacon,
      crateType:  crateType,
      targetX:    targetPos.x,
      targetZ:    targetPos.z,
      landed:     false,
      collected:  false,
      dissolving: false,
      dissolveT:  0,
      swayT:      0,
      nearbyT:    0   // timer for "press E" prompt
    };

    _updateHUD();
  }

  // ── enemy interception ──────────────────────────────────────────────────────
  function _triggerEnemyInterception(pos) {
    var enemies = _getEnemies ? _getEnemies() : _enemies;
    if (!enemies || enemies.length === 0) return;

    // pick up to 2 nearest enemies
    var sorted = enemies.slice().sort(function(a, b) {
      var da = a.position ? a.position.distanceTo(pos) : Infinity;
      var db = b.position ? b.position.distanceTo(pos) : Infinity;
      return da - db;
    });

    var count = Math.min(2, sorted.length);
    for (var i = 0; i < count; i++) {
      var enemy = sorted[i];
      if (enemy && enemy.position) {
        // Flag enemy to sprint toward drop zone
        enemy._supplyDropTarget = pos.clone();
        enemy._sprintingToSupply = true;
      }
    }
  }

  // ── smoke particles ─────────────────────────────────────────────────────────
  function _spawnSmoke(worldPos) {
    if (!_scene) return;
    var smokeGeo = new THREE.SphereGeometry(0.18, 4, 4);
    var smokeMat = new THREE.MeshBasicMaterial({
      color:       0xeeeeee,
      transparent: true,
      opacity:     0.5
    });
    var mesh = new THREE.Mesh(smokeGeo, smokeMat);
    mesh.position.set(
      worldPos.x + (Math.random() - 0.5) * 0.6,
      worldPos.y,
      worldPos.z + (Math.random() - 0.5) * 0.6
    );
    _scene.add(mesh);
    _smokeParticles.push({
      mesh:    mesh,
      vy:      0.8 + Math.random() * 0.6,
      life:    0,
      maxLife: 1.2 + Math.random() * 0.8
    });
  }

  function _updateSmoke(dt) {
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var p = _smokeParticles[i];
      p.life += dt;
      var t = p.life / p.maxLife;
      p.mesh.position.y += p.vy * dt;
      p.mesh.material.opacity = 0.5 * (1 - t);
      p.mesh.scale.setScalar(1 + t * 1.5);
      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        _smokeParticles.splice(i, 1);
      }
    }
  }

  // ── collect action ──────────────────────────────────────────────────────────
  function _tryCollect() {
    if (!_activeDrop) return;
    if (!_activeDrop.landed) return;
    if (_activeDrop.collected || _activeDrop.dissolving) return;
    if (!_player || !_player.position) return;

    var dist = _player.position.distanceTo(_activeDrop.group.position);
    if (dist > 2) return;

    _applyEffect(_activeDrop.crateType.id);
    _activeDrop.dissolving = true;
    _activeDrop.dissolveT  = 0;
    _activeDrop.collected  = true;

    _showCollectMessage(_activeDrop.crateType);
  }

  function _applyEffect(typeId) {
    if (!_player) return;
    if (typeId === 'AMMO') {
      // Refill all weapons
      if (_player.ammo !== undefined) _player.ammo = 9999;
      if (window.Weapons && window.Weapons.refillAll) window.Weapons.refillAll();
    } else if (typeId === 'MEDKIT') {
      if (_player.hp !== undefined) {
        _player.hp = Math.min((_player.maxHp || 100), _player.hp + 50);
      }
    } else if (typeId === 'WEAPONS') {
      // Spawn a bonus weapon box near player
      if (window.Loot && window.Loot.spawnWeaponBox && _player.position) {
        window.Loot.spawnWeaponBox(_player.position.x + 2, _player.position.z);
      }
    } else if (typeId === 'EXPLOSIVES') {
      if (_player.grenades !== undefined) {
        _player.grenades = (_player.grenades || 0) + 4;
      }
    } else if (typeId === 'FOOD') {
      if (_player.stamina !== undefined) _player.stamina = 100;
      if (_player.speedBuff !== undefined) {
        _player.speedBuff = 1.3;
        _player.speedBuffTimer = 60;
      }
    }
  }

  function _showCollectMessage(crateType) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#' + crateType.color.toString(16).padStart(6, '0'),
      'font-size:22px',
      'font-family:monospace',
      'font-weight:bold',
      'text-shadow:0 0 8px #000,0 0 16px #000',
      'pointer-events:none',
      'z-index:9999',
      'letter-spacing:2px'
    ].join(';');
    el.textContent = crateType.label + ' COLLECTED!';
    document.body.appendChild(el);
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2500);
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    // Remove stale element if re-initting
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = document.createElement('div');
    _hudEl.id = 'supply-drop-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#fff',
      'font-size:13px',
      'font-family:monospace',
      'text-shadow:0 0 6px #000,0 0 12px #000',
      'pointer-events:none',
      'z-index:8000',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var cdText;
    if (_cooldown <= 0) {
      cdText = 'DROP READY';
    } else {
      var mins = Math.floor(_cooldown / 60);
      var secs = Math.floor(_cooldown % 60);
      cdText = 'COOLDOWN ' + _pad2(mins) + ':' + _pad2(secs);
    }

    var inboundText = '';
    if (_activeDrop && !_activeDrop.collected) {
      inboundText = ' | ' + _activeDrop.crateType.label + ' INBOUND ↓';
    }

    _hudEl.textContent = 'SUPPLY DROP [' + cdText + ']' + inboundText;
    _hudEl.style.color = (_cooldown <= 0) ? '#00ff88' : '#ffcc00';
  }

  function _pad2(n) {
    return (n < 10 ? '0' : '') + Math.floor(n);
  }

  // ── "press E" prompt ─────────────────────────────────────────────────────────
  var _promptEl = null;

  function _showPrompt(show) {
    if (show) {
      if (!_promptEl) {
        _promptEl = document.createElement('div');
        _promptEl.style.cssText = [
          'position:fixed',
          'bottom:90px',
          'left:50%',
          'transform:translateX(-50%)',
          'color:#ffff00',
          'font-size:15px',
          'font-family:monospace',
          'text-shadow:0 0 8px #000',
          'pointer-events:none',
          'z-index:8001'
        ].join(';');
        _promptEl.textContent = '[E] COLLECT SUPPLY CRATE';
        document.body.appendChild(_promptEl);
      }
    } else {
      if (_promptEl && _promptEl.parentNode) {
        _promptEl.parentNode.removeChild(_promptEl);
        _promptEl = null;
      }
    }
  }

  // ── update (call every frame with delta time in seconds) ────────────────────
  function update(dt) {
    if (!dt || dt <= 0) dt = 0.016;

    // Cooldown tick
    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown < 0) _cooldown = 0;
    }

    // Drop zone pulsing opacity
    if (_dropZone && _dropZone.material) {
      _dropZone.pulseT = (_dropZone.pulseT || 0) + dt * 2.5;
      var pulse = 0.3 + (Math.sin(_dropZone.pulseT) * 0.5 + 0.5) * 0.5; // 0.3–0.8
      _dropZone.material.opacity = pulse;
    }

    // Smoke particles
    _updateSmoke(dt);

    // Active drop
    if (_activeDrop) {
      _updateDrop(dt);
    }

    _updateHUD();
  }

  function _updateDrop(dt) {
    var drop = _activeDrop;

    if (drop.collected && !drop.dissolving) {
      return;
    }

    // Dissolve animation
    if (drop.dissolving) {
      drop.dissolveT += dt;
      var t = drop.dissolveT / 0.3;
      if (t >= 1) {
        _removeDrop(drop);
        _activeDrop = null;
        return;
      }
      var s = 1 - t;
      drop.group.scale.setScalar(s);
      return;
    }

    // Descent
    if (!drop.landed) {
      var DESCENT_SPEED = 4;
      drop.swayT += dt;
      var swayX = Math.sin(drop.swayT * 1.2) * 0.4;
      var swayZ = Math.cos(drop.swayT * 0.9) * 0.3;

      drop.group.position.y -= DESCENT_SPEED * dt;
      drop.group.position.x = drop.targetX + swayX;
      drop.group.position.z = drop.targetZ + swayZ;

      // Spawn smoke trail from crate world position
      if (Math.random() < dt * 12) {
        var wp = new THREE.Vector3();
        drop.group.getWorldPosition(wp);
        wp.y -= 0.5;
        _spawnSmoke(wp);
      }

      // Check landing (Y <= 0)
      if (drop.group.position.y <= 0.75) {
        drop.group.position.y = 0.75;
        drop.landed = true;

        // Remove parachute visually
        if (drop.chuteMesh) {
          drop.group.remove(drop.chuteMesh);
        }
        for (var li = 0; li < drop.shroudLines.length; li++) {
          drop.group.remove(drop.shroudLines[li]);
        }

        // Dim beacon on landing
        if (drop.beacon) {
          drop.beacon.intensity = 1.2;
        }
      }
    }

    // Proximity check for "press E"
    if (drop.landed && !drop.collected) {
      if (_player && _player.position) {
        var dist = _player.position.distanceTo(drop.group.position);
        if (dist <= 2) {
          _showPrompt(true);
        } else {
          _showPrompt(false);
        }
      }
    }

    // Enemy interception: move flagged enemies toward drop zone
    var enemies = _getEnemies ? _getEnemies() : _enemies;
    if (enemies) {
      for (var ei = 0; ei < enemies.length; ei++) {
        var enemy = enemies[ei];
        if (enemy && enemy._sprintingToSupply && enemy._supplyDropTarget && enemy.position) {
          var dir = enemy._supplyDropTarget.clone().sub(enemy.position);
          if (dir.length() > 0.5) {
            dir.normalize().multiplyScalar(5 * dt); // sprint speed 5 u/s
            enemy.position.add(dir);
          } else {
            // Enemy reached crate — steal it
            if (drop.landed && !drop.collected) {
              drop.collected   = true;
              drop.dissolving  = true;
              drop.dissolveT   = 0;
              _showStealMessage();
            }
            enemy._sprintingToSupply = false;
            enemy._supplyDropTarget  = null;
          }
        }
      }
    }
  }

  function _showStealMessage() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff4444',
      'font-size:20px',
      'font-family:monospace',
      'font-weight:bold',
      'text-shadow:0 0 8px #000',
      'pointer-events:none',
      'z-index:9999'
    ].join(';');
    el.textContent = 'ENEMY INTERCEPTED THE SUPPLY DROP!';
    document.body.appendChild(el);
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  function _removeDrop(drop) {
    if (!drop) return;
    _showPrompt(false);
    if (drop.group && _scene) {
      _scene.remove(drop.group);
    }
    // Remove drop zone marker when drop is collected/gone
    if (_dropZone && _dropZone.marker && _scene) {
      _scene.remove(_dropZone.marker);
      _dropZone = null;
    }
  }

  // ── reset ───────────────────────────────────────────────────────────────────
  function reset() {
    _cooldown = 0;

    if (_activeDrop) {
      _removeDrop(_activeDrop);
      _activeDrop = null;
    }

    if (_dropZone && _dropZone.marker && _scene) {
      _scene.remove(_dropZone.marker);
    }
    _dropZone = null;

    // Clear smoke
    for (var si = 0; si < _smokeParticles.length; si++) {
      if (_scene) _scene.remove(_smokeParticles[si].mesh);
    }
    _smokeParticles = [];

    _showPrompt(false);
    _updateHUD();

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
    document.removeEventListener('contextmenu', _onRightClick);
  }

  // ── public API ──────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
