/* ─────────────────────────────────────────────────────────────────────────────
   scavenge-system.js  — pick up fallen enemy weapons (E key)
   Depends on: THREE, Weapons, HUD (optional), AudioSystem (optional)
   ───────────────────────────────────────────────────────────────────────────── */
window.ScavengeSystem = (function () {
  'use strict';

  /* ── Enemy → weapon pool mapping ──────────────────────────────────────── */
  var ENEMY_WEAPON_POOLS = {
    SOLDIER:   ['AK74', 'AKSU', 'RPK74'],
    HEAVY:     ['PKM', 'SVD', 'PKPECHENEG'],
    SNIPER:    ['SVD', 'VSS', 'BARRETTM82'],
    OFFICER:   ['APS', 'OTS33', 'MAKAROV'],
    SPEC_OPS:  ['AKSU', 'VSS', 'AK12'],
    MEDIC:     ['AK74', 'AKSU'],
    DEFAULT:   ['AK74'],
  };

  /* Alias IDs that appear in ENEMY_WEAPON_POOLS but may not match weapons.js
     exactly — map them to the closest real ID so lookups succeed.           */
  var WEAPON_ID_ALIASES = {
    AKSU:      'AKS74U',
    RPK:       'RPK74',
    PKP_HVY:   'PKPECHENEG',
    VSS_SF:    'VSS',
    AN94_BURST:'AK12',
    APS:       'MAKAROV',
    OTS33:     'GLOCK',
  };

  /* Weapon-type colour for the drop mesh */
  var WEAPON_TYPE_COLORS = {
    PISTOL:    0x111111,  // black
    ASSAULT:   0x333333,  // dark gray
    SMG:       0x333333,
    SNIPER:    0x3a3a2a,  // olive-ish
    LMG:       0x333333,
    HMG:       0x333333,
    HMG_HEAVY: 0x333333,
    AT:        0x4a4a2a,  // olive
    AT_LIGHT:  0x4a4a2a,
    AT_HEAVY:  0x4a4a2a,
    ATGM:      0x4a4a2a,
    AA:        0x4a4a2a,
    GRENADE:   0x4a4a2a,
    SILENT:    0x222222,
    DEFAULT:   0x2a2a2a,
  };

  /* ── Module state ──────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _drops    = [];         // active weapon-drop objects
  var MAX_DROPS = 8;

  /* ─ DOM elements ─ */
  var _promptEl = null;       // #scavengePrompt element

  /* ── Init ──────────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    // Build prompt element if not in DOM yet
    _promptEl = document.getElementById('scavengePrompt');
    if (!_promptEl && typeof document !== 'undefined') {
      _promptEl = document.createElement('div');
      _promptEl.id = 'scavengePrompt';
      _promptEl.style.cssText = [
        'position:fixed',
        'bottom:22%',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.72)',
        'color:#fff',
        'font-family:monospace',
        'font-size:15px',
        'padding:7px 18px',
        'border-radius:5px',
        'border:1px solid rgba(255,255,255,0.3)',
        'pointer-events:none',
        'display:none',
        'z-index:9000',
        'white-space:nowrap',
      ].join(';');
      document.body.appendChild(_promptEl);
    }
  }

  /* ── Resolve weapon ID alias → real weapons.js id ─────────────────────── */
  function _resolveId(id) {
    return WEAPON_ID_ALIASES[id] || id;
  }

  /* ── Pick a random weapon from the pool for an enemy type ─────────────── */
  function _pickWeapon(enemyTypeName) {
    var pool = ENEMY_WEAPON_POOLS[enemyTypeName] || ENEMY_WEAPON_POOLS.DEFAULT;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ── Find a weapon def by id string ───────────────────────────────────── */
  function _findWeaponIdx(weaponId) {
    if (typeof Weapons === 'undefined' || !Weapons.getWeaponCount) return -1;
    var count = Weapons.getWeaponCount();
    for (var i = 0; i < count; i++) {
      if (Weapons.getWeaponId(i) === weaponId) return i;
    }
    return -1;
  }

  /* ── Build a canvas texture with the weapon name label ────────────────── */
  function _makeLabel(name) {
    var canvas = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.roundRect ? ctx.roundRect(4, 4, 248, 56, 8) : ctx.fillRect(4, 4, 248, 56);
    ctx.fill();
    ctx.font        = 'bold 18px monospace';
    ctx.fillStyle   = '#ddeeff';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 32);
    var tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /* ── Build the Three.js drop visual ────────────────────────────────────── */
  function _buildMesh(weaponDef) {
    var wtype  = (weaponDef && weaponDef.type) || 'DEFAULT';
    var color  = WEAPON_TYPE_COLORS[wtype] || WEAPON_TYPE_COLORS.DEFAULT;

    var mat    = new THREE.MeshLambertMaterial({ color: color });

    // Rifle body
    var bodyGeo  = new THREE.BoxGeometry(0.8, 0.08, 0.12);
    var bodyMesh = new THREE.Mesh(bodyGeo, mat);

    // Angled stock
    var stockGeo  = new THREE.BoxGeometry(0.25, 0.08, 0.10);
    var stockMesh = new THREE.Mesh(stockGeo, mat);
    stockMesh.position.set(-0.50, -0.04, 0);
    stockMesh.rotation.z = 0.22;        // slight angle
    bodyMesh.add(stockMesh);

    // Group everything
    var group = new THREE.Group();
    group.add(bodyMesh);

    // Label sprite above weapon
    var wname = (weaponDef && weaponDef.name) || 'Unknown';
    var labelTex  = _makeLabel(wname);
    var labelMat  = new THREE.SpriteMaterial({ map: labelTex, transparent: true, opacity: 0.95 });
    var sprite    = new THREE.Sprite(labelMat);
    sprite.scale.set(1.2, 0.3, 1);
    sprite.position.set(0, 0.55, 0);
    group.add(sprite);
    group.userData._labelSprite = sprite;
    group.userData._labelMat    = labelMat;

    // Point light (subtle blue glow)
    var light = new THREE.PointLight(0x88aaff, 0.8, 2.5);
    light.position.set(0, 0.2, 0);
    group.add(light);
    group.userData._light = light;

    return group;
  }

  /* ── Spawn a weapon drop at enemyPos ────────────────────────────────────── */
  function spawnWeaponDrop(enemyPos, weaponId, ammoCount) {
    if (!_scene || !enemyPos) return;

    // Enforce max drops — remove oldest first
    while (_drops.length >= MAX_DROPS) {
      _removeDrop(_drops[0]);
    }

    // Resolve weaponId
    var rawId = weaponId || null;
    // If not provided, pick from DEFAULT pool
    if (!rawId) rawId = _pickWeapon('DEFAULT');
    var resolvedId = _resolveId(rawId);

    var wIdx = _findWeaponIdx(resolvedId);
    // Fall back to AK74 if not found
    if (wIdx < 0) {
      resolvedId = 'AK74';
      wIdx = _findWeaponIdx(resolvedId);
    }

    var weaponDef = (typeof Weapons !== 'undefined' && Weapons.getWeaponDef) ? Weapons.getWeaponDef(wIdx) : null;

    // Compute ammo — 30–80 % of clipSize
    var clipSize = (weaponDef && weaponDef.clipSize) ? weaponDef.clipSize : 30;
    var finalAmmo = (typeof ammoCount === 'number' && ammoCount >= 0)
      ? ammoCount
      : Math.max(1, Math.round(clipSize * (0.30 + Math.random() * 0.50)));

    var mesh = _buildMesh(weaponDef);

    // Arc / tumble start — slightly above enemy position
    var startY = enemyPos.y + 0.6 + Math.random() * 0.3;

    mesh.position.set(
      enemyPos.x + (Math.random() - 0.5) * 0.4,
      startY,
      enemyPos.z + (Math.random() - 0.5) * 0.4
    );

    // Lie flat on X axis (weapon lies on ground)
    mesh.rotation.x = Math.PI / 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;

    _scene.add(mesh);

    var drop = {
      mesh:       mesh,
      weaponId:   resolvedId,
      weaponIdx:  wIdx,
      weaponName: (weaponDef && weaponDef.name) || resolvedId,
      ammoCount:  finalAmmo,
      age:        0,              // seconds alive
      lifetime:   20,             // despawn after 20 s
      groundY:    enemyPos.y,     // target Y for landing
      falling:    true,
      fallVel:    0,
      landed:     false,
      blinkTimer: 0,
      blinkState: true,
    };

    _drops.push(drop);
  }

  /* ── Remove a drop cleanly ──────────────────────────────────────────────── */
  function _removeDrop(drop) {
    if (!drop) return;
    if (_scene && drop.mesh) _scene.remove(drop.mesh);
    // Dispose geometries/materials
    drop.mesh.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function (m) { m.dispose(); });
        } else {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      }
    });
    var idx = _drops.indexOf(drop);
    if (idx >= 0) _drops.splice(idx, 1);
  }

  /* ── Try pickup — called when player presses E ─────────────────────────── */
  function tryPickup(playerPos) {
    if (!playerPos || _drops.length === 0) return false;
    for (var i = 0; i < _drops.length; i++) {
      var drop = _drops[i];
      if (!drop || !drop.mesh) continue;
      if (!drop.landed) continue;   // still falling — can't pick up yet
      var dist = drop.mesh.position.distanceTo(playerPos);
      if (dist <= 1.5) {
        _doPickup(drop);
        return true;
      }
    }
    return false;
  }

  /* ── Execute pickup ─────────────────────────────────────────────────────── */
  function _doPickup(drop) {
    var wid   = drop.weaponId;
    var widx  = drop.weaponIdx;
    var ammo  = drop.ammoCount;
    var wname = drop.weaponName;

    // Switch to the weapon
    var pickedUp = false;
    if (typeof window._onWeaponPickup === 'function') {
      window._onWeaponPickup(wid, ammo);
      pickedUp = true;
    } else if (typeof Weapons !== 'undefined') {
      if (widx >= 0) {
        // Unlock if needed
        if (Weapons.unlockWeapon) Weapons.unlockWeapon(widx);
        // Switch to weapon
        if (Weapons.switchTo) Weapons.switchTo(widx);
        // Set ammo (clip only — reserve stays as-is)
        if (Weapons.setClip) {
          Weapons.setClip(ammo);
        }
        pickedUp = true;
      } else if (Weapons.equipById) {
        Weapons.equipById(wid);
        pickedUp = true;
      }
    }

    // SFX — metallic click
    if (typeof AudioSystem !== 'undefined') {
      if (AudioSystem.playWeaponSwitch) AudioSystem.playWeaponSwitch();
      else if (AudioSystem.playPickup)  AudioSystem.playPickup();
      else if (AudioSystem.playClick)   AudioSystem.playClick();
    }

    // Toast
    var toastMsg = '🔫 PICKED UP ' + wname + ' [' + ammo + 'rds]';
    if (typeof HUD !== 'undefined') {
      if (HUD.showToast)      HUD.showToast(toastMsg, 2500, '#88ddff');
      else if (HUD.notifyPickup) HUD.notifyPickup(toastMsg, '#88ddff');
    }

    // Hide prompt immediately
    if (_promptEl) _promptEl.style.display = 'none';

    _removeDrop(drop);
  }

  /* ── Update ──────────────────────────────────────────────────────────────── */
  function update(delta, player) {
    if (!_drops.length) {
      if (_promptEl) _promptEl.style.display = 'none';
      return;
    }

    var playerPos = (player && player.position) ? player.position : null;
    var nearbyDrop = null;
    var GRAVITY = 9.8;

    for (var i = _drops.length - 1; i >= 0; i--) {
      var drop = _drops[i];
      if (!drop || !drop.mesh) { _drops.splice(i, 1); continue; }

      drop.age += delta;

      /* ── Fade out during last 2 s ─────────────────────────────────── */
      if (drop.age >= drop.lifetime) {
        _removeDrop(drop);
        continue;
      }

      /* ── Fall physics (0.4 s tumble to ground) ───────────────────── */
      if (drop.falling) {
        drop.fallVel += GRAVITY * delta;
        drop.mesh.position.y -= drop.fallVel * delta;
        // Tumble
        drop.mesh.rotation.z += 3.0 * delta;

        if (drop.mesh.position.y <= drop.groundY) {
          drop.mesh.position.y = drop.groundY;
          drop.falling = false;
          drop.landed  = true;
          // Settle flat — lying on X plane
          drop.mesh.rotation.z = 0;
          drop.mesh.rotation.x = Math.PI / 2;
        }
      }

      /* ── Slow rotation while on ground ──────────────────────────── */
      if (drop.landed) {
        drop.mesh.rotation.y += 0.8 * delta;
      }

      /* ── Blink at 0.5 Hz ─────────────────────────────────────────── */
      drop.blinkTimer += delta;
      if (drop.blinkTimer >= 1.0) drop.blinkTimer -= 1.0;
      var visible = drop.blinkTimer < 0.5;
      if (drop.mesh.visible !== undefined) drop.mesh.visible = visible;

      /* ── Fade label when near despawn ────────────────────────────── */
      var timeLeft = drop.lifetime - drop.age;
      if (drop.mesh.userData._labelMat) {
        drop.mesh.userData._labelMat.opacity = timeLeft < 3 ? Math.max(0, timeLeft / 3) * 0.95 : 0.95;
      }

      /* ── Proximity check for prompt ───────────────────────────────── */
      if (playerPos && drop.landed) {
        var dist = drop.mesh.position.distanceTo(playerPos);
        if (dist <= 1.5) {
          nearbyDrop = drop;
        }
      }
    }

    /* ── Update pickup prompt ─────────────────────────────────────────── */
    if (_promptEl) {
      if (nearbyDrop) {
        _promptEl.textContent = '⬆ PICK UP ' + nearbyDrop.weaponName;
        _promptEl.style.display = 'block';
      } else {
        _promptEl.style.display = 'none';
      }
    }
  }

  /* ── Clear (called when starting new stage) ──────────────────────────── */
  function clear() {
    for (var i = _drops.length - 1; i >= 0; i--) {
      _removeDrop(_drops[i]);
    }
    _drops = [];
    if (_promptEl) _promptEl.style.display = 'none';
  }

  /* ── Reset (called after KillStreak.reset / full game reset) ─────────── */
  function reset() {
    clear();
  }

  /* ── Public API ───────────────────────────────────────────────────────── */
  return {
    init:            init,
    spawnWeaponDrop: spawnWeaponDrop,
    update:          update,
    tryPickup:       tryPickup,
    clear:           clear,
    reset:           reset,
    ENEMY_WEAPON_POOLS: ENEMY_WEAPON_POOLS,
  };

})();
