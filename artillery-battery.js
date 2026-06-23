// ============================================================
//  artillery-battery.js — Player-controlled howitzer battery
//  Press [ to place battery at current position.
//  Press E near battery to man/exit.
//  While manning: A/D = traverse, W/S = elevation, LMB = fire.
//  Press R near supply crate to replenish ammo.
//  Public API: { init(scene, camera), update(delta), spawnBattery(x, y, z), reset() }
// ============================================================
window.ArtilleryBattery = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  var MAX_BATTERIES     = 3;
  var INTERACT_DIST     = 3;
  var BATTERY_HP_MAX    = 200;
  var MAX_AMMO          = 12;
  var RELOAD_TIME       = 4.0;       // seconds
  var TRAVERSE_SPEED    = 60;        // degrees/sec
  var ELEVATION_SPEED   = 30;        // degrees/sec
  var MIN_ELEVATION     = 15;        // degrees
  var MAX_ELEVATION     = 65;        // degrees
  var TRAVERSE_LIMIT    = 135;       // ±135° from initial heading = 270° arc
  var BLAST_RADIUS      = 8;
  var CRATER_BLOCKS     = 3;
  var SHELL_CHARGE      = 80;        // base muzzle speed units
  var GRAVITY           = 9.8;
  var SUPPLY_OFFSET     = 15;        // units from battery
  var CRATE_GLOW_DIST   = 4;
  var WHISTLE_DURATION  = 0.5;       // seconds
  var SMOKE_INTERVAL    = 0.15;
  var DEBRIS_COUNT      = 12;
  var ENEMY_TAG         = 'enemy';   // object.userData.tag

  // ── Module state ───────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;
  var _batteries      = [];          // array of battery objects
  var _shells         = [];          // active shell projectiles
  var _debris         = [];          // flying debris chunks after destruction
  var _smokeParticles = [];          // smoke puffs
  var _activeBattery  = null;        // battery player is currently manning
  var _playerPos      = new THREE.Vector3();
  var _audioCtx       = null;
  var _keys           = {};          // currently held keys
  var _mouseDownL     = false;
  var _fireCooldown   = 0;
  var _hudEl          = null;
  var _scopeEl        = null;
  var _reloadBarEl    = null;
  var _reloadFillEl   = null;
  var _hudVisible     = false;
  var _savedCamPos    = new THREE.Vector3();
  var _savedCamRot    = new THREE.Euler();
  var _keyDownHandler = null;
  var _keyUpHandler   = null;
  var _mouseDownHandler = null;
  var _mouseUpHandler   = null;

  // ── Materials (lazy) ───────────────────────────────────────
  var _matSteel    = null;
  var _matDark     = null;
  var _matWheel    = null;
  var _matShield   = null;
  var _matCrate    = null;
  var _matSmoke    = null;
  var _matShell    = null;
  var _matDebris   = null;
  var _matGlow     = null;

  function _getMats() {
    if (_matSteel) return;
    _matSteel  = new THREE.MeshLambertMaterial({ color: 0x556655 });
    _matDark   = new THREE.MeshLambertMaterial({ color: 0x222222 });
    _matWheel  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    _matShield = new THREE.MeshLambertMaterial({ color: 0x445544, side: THREE.DoubleSide });
    _matCrate  = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    _matSmoke  = new THREE.MeshLambertMaterial({ color: 0xAAAAAA, transparent: true, opacity: 0.5 });
    _matShell  = new THREE.MeshLambertMaterial({ color: 0xBB9922 });
    _matDebris = new THREE.MeshLambertMaterial({ color: 0x444433 });
    _matGlow   = new THREE.MeshLambertMaterial({ color: 0xFFEE88, emissive: 0xFFCC00, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 });
  }

  // ── Howitzer mesh construction ─────────────────────────────
  function _buildHowitzerGroup() {
    _getMats();
    var group = new THREE.Group();

    // Base carriage platform
    var baseGeo  = new THREE.BoxGeometry(2.4, 0.25, 1.8);
    var baseMesh = new THREE.Mesh(baseGeo, _matSteel);
    baseMesh.position.set(0, 0.125, 0);
    group.add(baseMesh);

    // Two trail beams (spades at rear)
    var trailGeo = new THREE.BoxGeometry(0.18, 0.15, 2.4);
    var trailL   = new THREE.Mesh(trailGeo, _matDark);
    var trailR   = new THREE.Mesh(trailGeo, _matDark);
    trailL.position.set(-0.9, 0.1, -1.5);
    trailR.position.set( 0.9, 0.1, -1.5);
    group.add(trailL, trailR);

    // Wheels (left and right)
    var wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.18, 12);
    var wheelL   = new THREE.Mesh(wheelGeo, _matWheel);
    var wheelR   = new THREE.Mesh(wheelGeo, _matWheel);
    wheelL.rotation.z = Math.PI / 2;
    wheelR.rotation.z = Math.PI / 2;
    wheelL.position.set(-1.28, 0.55, 0.2);
    wheelR.position.set( 1.28, 0.55, 0.2);
    group.add(wheelL, wheelR);

    // Wheel hub caps
    var hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 8);
    var hubL   = new THREE.Mesh(hubGeo, _matSteel);
    var hubR   = new THREE.Mesh(hubGeo, _matSteel);
    hubL.rotation.z = Math.PI / 2;
    hubR.rotation.z = Math.PI / 2;
    hubL.position.set(-1.28, 0.55, 0.2);
    hubR.position.set( 1.28, 0.55, 0.2);
    group.add(hubL, hubR);

    // Breech block (rear of barrel pivot)
    var breechGeo  = new THREE.BoxGeometry(0.65, 0.65, 0.9);
    var breechMesh = new THREE.Mesh(breechGeo, _matDark);
    breechMesh.position.set(0, 0.0, 0);   // relative to barrel pivot
    // will be added to barrelPivot below

    // Barrel pivot group (rotates for elevation)
    var barrelPivot = new THREE.Group();
    barrelPivot.position.set(0, 1.05, 0.3);
    group.add(barrelPivot);
    group.userData.barrelPivot = barrelPivot;

    barrelPivot.add(breechMesh);

    // Barrel tube
    var barrelGeo  = new THREE.CylinderGeometry(0.14, 0.18, 3.4, 10);
    var barrelMesh = new THREE.Mesh(barrelGeo, _matSteel);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0, 1.5);
    barrelPivot.add(barrelMesh);
    group.userData.barrelMesh = barrelMesh;

    // Muzzle brake
    var muzzleGeo  = new THREE.BoxGeometry(0.38, 0.28, 0.32);
    var muzzleMesh = new THREE.Mesh(muzzleGeo, _matDark);
    muzzleMesh.position.set(0, 0, 3.22);
    barrelPivot.add(muzzleMesh);
    group.userData.muzzleMesh = muzzleMesh;

    // Gun shield (front plate)
    var shieldGeo  = new THREE.BoxGeometry(2.0, 1.1, 0.08);
    var shieldMesh = new THREE.Mesh(shieldGeo, _matShield);
    shieldMesh.position.set(0, 1.25, 0.6);
    group.add(shieldMesh);

    // Gunner seat suggestion
    var seatGeo  = new THREE.BoxGeometry(0.45, 0.12, 0.4);
    var seatMesh = new THREE.Mesh(seatGeo, _matDark);
    seatMesh.position.set(-0.6, 0.7, -0.2);
    group.add(seatMesh);

    return group;
  }

  // ── Supply crate mesh ──────────────────────────────────────
  function _buildCrateMesh() {
    _getMats();
    var group = new THREE.Group();

    var boxGeo  = new THREE.BoxGeometry(0.9, 0.7, 0.9);
    var boxMesh = new THREE.Mesh(boxGeo, _matCrate);
    boxMesh.position.y = 0.35;
    group.add(boxMesh);

    // Lid outline strips
    var stripGeo = new THREE.BoxGeometry(0.94, 0.06, 0.06);
    var s1 = new THREE.Mesh(stripGeo, _matDark);
    var s2 = new THREE.Mesh(stripGeo, _matDark);
    s1.position.set(0, 0.68, 0.45);
    s2.position.set(0, 0.68, -0.45);
    group.add(s1, s2);

    // Glow indicator mesh
    var glowGeo  = new THREE.SphereGeometry(0.18, 8, 8);
    var glowMesh = new THREE.Mesh(glowGeo, _matGlow.clone());
    glowMesh.position.set(0, 1.12, 0);
    glowMesh.visible = false;
    group.add(glowMesh);
    group.userData.glowMesh = glowMesh;

    return group;
  }

  // ── HUD construction ───────────────────────────────────────
  function _buildHUD() {
    if (_hudEl) return;

    // Main HUD panel (top-center)
    _hudEl = document.createElement('div');
    _hudEl.id = 'artillery-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,30,0,0.78)',
      'border:1px solid #3a5',
      'border-radius:4px',
      'padding:7px 18px',
      'color:#7f7',
      'font:bold 13px/1.5 monospace',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'min-width:220px',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Scope overlay (full-screen)
    _scopeEl = document.createElement('canvas');
    _scopeEl.id = 'artillery-scope';
    _scopeEl.width  = 480;
    _scopeEl.height = 480;
    _scopeEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
      'display:none',
      'z-index:901'
    ].join(';');
    document.body.appendChild(_scopeEl);

    // Reload bar
    _reloadBarEl = document.createElement('div');
    _reloadBarEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:180px',
      'height:14px',
      'background:rgba(0,0,0,0.6)',
      'border:1px solid #3a5',
      'border-radius:3px',
      'display:none',
      'z-index:900'
    ].join(';');
    _reloadFillEl = document.createElement('div');
    _reloadFillEl.style.cssText = [
      'height:100%',
      'width:0%',
      'background:#5c3',
      'border-radius:2px',
      'transition:width 0.1s linear'
    ].join(';');
    _reloadBarEl.appendChild(_reloadFillEl);
    document.body.appendChild(_reloadBarEl);
  }

  function _drawScope(battery) {
    if (!_scopeEl || _scopeEl.style.display === 'none') return;
    var ctx = _scopeEl.getContext('2d');
    var W = _scopeEl.width;
    var H = _scopeEl.height;
    var cx = W / 2;
    var cy = H / 2;
    var R  = W / 2 - 4;

    ctx.clearRect(0, 0, W, H);

    // Dark circular mask outside reticle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Scope circle border
    ctx.strokeStyle = '#4d8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Mil grid lines (horizontal)
    ctx.strokeStyle = 'rgba(80,220,130,0.5)';
    ctx.lineWidth = 0.8;
    var milSpacing = R / 5;
    for (var i = -4; i <= 4; i++) {
      var yy = cy + i * milSpacing;
      if (yy < cy - R || yy > cy + R) continue;
      var hw = Math.sqrt(Math.max(0, R * R - (yy - cy) * (yy - cy)));
      ctx.beginPath();
      ctx.moveTo(cx - hw, yy);
      ctx.lineTo(cx + hw, yy);
      ctx.stroke();
    }
    // Mil grid lines (vertical)
    for (var j = -4; j <= 4; j++) {
      var xx = cx + j * milSpacing;
      if (xx < cx - R || xx > cx + R) continue;
      var vh = Math.sqrt(Math.max(0, R * R - (xx - cx) * (xx - cx)));
      ctx.beginPath();
      ctx.moveTo(xx, cy - vh);
      ctx.lineTo(xx, cy + vh);
      ctx.stroke();
    }

    // Crosshair
    ctx.strokeStyle = '#5f5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.9, cy);
    ctx.lineTo(cx - 12, cy);
    ctx.moveTo(cx + 12, cy);
    ctx.lineTo(cx + R * 0.9, cy);
    ctx.moveTo(cx, cy - R * 0.9);
    ctx.lineTo(cx, cy - 12);
    ctx.moveTo(cx, cy + 12);
    ctx.lineTo(cx, cy + R * 0.9);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#5f5';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Elevation readout arc
    var elev = battery.elevation;
    var elevFrac = (elev - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION);
    var arcStart = Math.PI * 0.75;
    var arcEnd   = Math.PI * 0.25;  // going counterclockwise is confusing; use simple label
    ctx.fillStyle = '#7f7';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('ELEV ' + elev.toFixed(1) + '°', cx - 35, cy + R - 22);

    // Bearing in mils readout
    var bearingMil = Math.round(((battery.traverse % 360) + 360) % 360 / 360 * 6400);
    ctx.fillText('BRNG ' + bearingMil + ' mil', cx - 35, cy + R - 8);
  }

  function _updateHUD(battery, idx) {
    if (!_hudEl) return;
    var ammoStr   = battery.ammo + '/' + MAX_AMMO;
    var elevStr   = battery.elevation.toFixed(1) + '°';
    var travDeg   = ((battery.traverse % 360) + 360) % 360;
    var milStr    = Math.round(travDeg / 360 * 6400) + ' mil';
    var hpStr     = battery.hp + '/' + BATTERY_HP_MAX;
    var reloadStr = battery.reloading ? ' [RELOADING]' : '';

    _hudEl.innerHTML =
      'BATTERY ' + (idx + 1) + '/' + MAX_BATTERIES +
      '&nbsp;&nbsp;HP:' + hpStr +
      '<br>AMMO: ' + ammoStr + reloadStr +
      '<br>ELEV: ' + elevStr + '&nbsp;&nbsp;BRNG: ' + milStr;

    _drawScope(battery);

    // Reload bar
    if (battery.reloading) {
      _reloadBarEl.style.display = 'block';
      var pct = Math.min(1, battery.reloadTimer / RELOAD_TIME);
      _reloadFillEl.style.width = Math.round(pct * 100) + '%';
    } else {
      _reloadBarEl.style.display = 'none';
    }
  }

  // ── Audio ──────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { /* silent */ }
    }
    return _audioCtx;
  }

  function _playShellWhistle() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + WHISTLE_DURATION);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + WHISTLE_DURATION);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + WHISTLE_DURATION);
    } catch (e) { /* silent */ }
  }

  function _playBoom(volume) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(volume || 0.6, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.55);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch (e) { /* silent */ }
  }

  function _playSmoke() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 60;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) { /* silent */ }
  }

  // ── Spawn battery ──────────────────────────────────────────
  function spawnBattery(x, y, z) {
    if (_batteries.length >= MAX_BATTERIES) {
      console.log('[ArtilleryBattery] Max batteries reached (' + MAX_BATTERIES + ')');
      return null;
    }
    if (!_scene) { console.warn('[ArtilleryBattery] init() not called'); return null; }

    _getMats();
    var group = _buildHowitzerGroup();
    group.position.set(x, y, z);
    _scene.add(group);

    // Supply crate (auto-spawned 15 units in front)
    var crateGroup = _buildCrateMesh();
    crateGroup.position.set(x, y, z + SUPPLY_OFFSET);
    _scene.add(crateGroup);

    var battery = {
      group:       group,
      crateGroup:  crateGroup,
      hp:          BATTERY_HP_MAX,
      ammo:        MAX_AMMO,
      traverse:    0,         // current horizontal rotation offset in degrees
      baseHeading: 0,         // initial world Y rotation
      elevation:   45,        // degrees
      reloading:   false,
      reloadTimer: 0,
      smokeTimer:  0,
      destroyed:   false,
      position:    new THREE.Vector3(x, y, z)
    };

    _batteries.push(battery);
    return battery;
  }

  // ── Shell projectile ───────────────────────────────────────
  function _fireShell(battery) {
    if (battery.reloading || battery.ammo <= 0 || battery.destroyed) return;

    battery.ammo--;
    battery.reloading = true;
    battery.reloadTimer = 0;

    _playShellWhistle();

    var elevRad = battery.elevation * Math.PI / 180;
    var travRad = (battery.traverse + battery.baseHeading) * Math.PI / 180;

    // Muzzle position (end of barrel in world space)
    var barrelPivot = battery.group.userData.barrelPivot;
    var muzzleLocal = new THREE.Vector3(0, 0, 3.3);
    // rotate by barrel elevation
    muzzleLocal.applyEuler(new THREE.Euler(-elevRad, 0, 0));
    var worldMuzzle = muzzleLocal.clone().add(barrelPivot.getWorldPosition(new THREE.Vector3()));

    var speed = SHELL_CHARGE;
    // velocity components
    var vx = speed * Math.sin(travRad) * Math.cos(elevRad);
    var vy = speed * Math.sin(elevRad);
    var vz = speed * Math.cos(travRad) * Math.cos(elevRad);

    var shellGeo  = new THREE.CylinderGeometry(0.06, 0.09, 0.4, 8);
    var shellMesh = new THREE.Mesh(shellGeo, _matShell);
    shellMesh.position.copy(worldMuzzle);
    // orient shell along velocity
    shellMesh.lookAt(worldMuzzle.clone().add(new THREE.Vector3(vx, vy, vz)));
    shellMesh.rotateX(Math.PI / 2);
    _scene.add(shellMesh);

    _shells.push({
      mesh:       shellMesh,
      vx:         vx,
      vy:         vy,
      vz:         vz,
      t:          0,
      smokeTimer: 0,
      battery:    battery
    });
  }

  // ── Explosion ──────────────────────────────────────────────
  function _explode(pos, radius, battery) {
    _playBoom(0.7);

    // Flash light
    var light = new THREE.PointLight(0xFF8833, 8, radius * 3);
    light.position.copy(pos);
    _scene.add(light);
    setTimeout(function () { if (_scene) _scene.remove(light); }, 350);

    // Smoke puffs
    for (var i = 0; i < 6; i++) {
      var sg = new THREE.SphereGeometry(0.6 + Math.random() * 0.8, 6, 6);
      var sm = new THREE.Mesh(sg, _matSmoke.clone());
      sm.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 2
      ));
      _scene.add(sm);
      _smokeParticles.push({ mesh: sm, life: 1.8, maxLife: 1.8, vy: 1.5 + Math.random() });
    }

    // Crater / voxel removal
    if (window.VoxelWorld && typeof window.VoxelWorld.setBlock === 'function') {
      var bx = Math.round(pos.x);
      var by = Math.round(pos.y);
      var bz = Math.round(pos.z);
      for (var dx = -CRATER_BLOCKS; dx <= CRATER_BLOCKS; dx++) {
        for (var dz = -CRATER_BLOCKS; dz <= CRATER_BLOCKS; dz++) {
          for (var dy = 0; dy >= -CRATER_BLOCKS; dy--) {
            if (dx * dx + dz * dz + dy * dy <= CRATER_BLOCKS * CRATER_BLOCKS) {
              window.VoxelWorld.setBlock(bx + dx, by + dy, bz + dz, 0);
            }
          }
        }
      }
    }

    // Kill enemies in radius
    if (window._enemies && window._enemies.length) {
      for (var ei = 0; ei < window._enemies.length; ei++) {
        var enemy = window._enemies[ei];
        if (!enemy || !enemy.mesh) continue;
        var epos = enemy.mesh.position;
        var dist = pos.distanceTo(epos);
        if (dist <= radius) {
          // Damage falloff
          var dmg = Math.round(200 * (1 - dist / radius));
          if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(dmg);
          } else {
            enemy.hp = (enemy.hp || 0) - dmg;
          }
        }
      }
    }
    // Also check generic scene objects tagged as enemy
    if (_scene) {
      _scene.traverse(function (obj) {
        if (obj.userData && obj.userData.tag === ENEMY_TAG) {
          var d = pos.distanceTo(obj.getWorldPosition(new THREE.Vector3()));
          if (d <= radius) {
            var dmgE = Math.round(200 * (1 - d / radius));
            if (typeof obj.userData.takeDamage === 'function') {
              obj.userData.takeDamage(dmgE);
            }
          }
        }
      });
    }
  }

  // ── Battery destruction ────────────────────────────────────
  function _destroyBattery(battery) {
    if (battery.destroyed) return;
    battery.destroyed = true;

    if (_activeBattery === battery) {
      _exitBattery();
    }

    _playBoom(1.0);

    var pos = battery.position.clone();

    // Big flash
    var flashLight = new THREE.PointLight(0xFF4400, 15, 30);
    flashLight.position.copy(pos).add(new THREE.Vector3(0, 1, 0));
    _scene.add(flashLight);
    setTimeout(function () { if (_scene) _scene.remove(flashLight); }, 600);

    // Debris chunks
    for (var i = 0; i < DEBRIS_COUNT; i++) {
      var dg = new THREE.BoxGeometry(
        0.15 + Math.random() * 0.5,
        0.1 + Math.random() * 0.4,
        0.1 + Math.random() * 0.4
      );
      var dm = new THREE.Mesh(dg, _matDebris);
      dm.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        0.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      ));
      _scene.add(dm);
      _debris.push({
        mesh:  dm,
        vx:    (Math.random() - 0.5) * 14,
        vy:    5 + Math.random() * 10,
        vz:    (Math.random() - 0.5) * 14,
        life:  3.0,
        rotX:  (Math.random() - 0.5) * 6,
        rotZ:  (Math.random() - 0.5) * 6
      });
    }

    // Remove battery mesh from scene
    _scene.remove(battery.group);
    _scene.remove(battery.crateGroup);
  }

  // ── Enter/exit battery ─────────────────────────────────────
  function _enterBattery(battery) {
    if (_activeBattery) return;
    _activeBattery = battery;

    // Save camera state
    _savedCamPos.copy(_camera.position);
    _savedCamRot.copy(_camera.rotation);

    // Position camera at gunner seat
    var seatPos = battery.position.clone().add(new THREE.Vector3(-0.6, 1.9, -0.2));
    _camera.position.copy(seatPos);
    _camera.rotation.set(0, battery.baseHeading * Math.PI / 180, 0);

    // Suppress normal player controls
    if (window.controls && typeof window.controls.lock === 'function') {
      // keep pointer lock but we'll override aim
    }

    // Show HUD & scope
    _hudEl.style.display = 'block';
    _scopeEl.style.display = 'block';
    _hudVisible = true;
  }

  function _exitBattery() {
    if (!_activeBattery) return;
    _activeBattery = null;

    // Restore camera
    if (_camera) {
      _camera.position.copy(_savedCamPos);
      _camera.rotation.copy(_savedCamRot);
    }

    // Hide HUD & scope
    if (_hudEl) _hudEl.style.display = 'none';
    if (_scopeEl) _scopeEl.style.display = 'none';
    if (_reloadBarEl) _reloadBarEl.style.display = 'none';
    _hudVisible = false;
  }

  // ── Input handlers ─────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;

    // [ = place battery at player position
    if (e.code === 'BracketLeft') {
      var px = _playerPos.x;
      var py = _playerPos.y;
      var pz = _playerPos.z;
      spawnBattery(px, py, pz);
    }

    // E = enter/exit
    if (e.code === 'KeyE') {
      if (_activeBattery) {
        _exitBattery();
      } else {
        // find nearest battery
        for (var i = 0; i < _batteries.length; i++) {
          var bat = _batteries[i];
          if (bat.destroyed) continue;
          var dist = _playerPos.distanceTo(bat.position);
          if (dist <= INTERACT_DIST) {
            _enterBattery(bat);
            break;
          }
        }
      }
    }

    // R = replenish ammo near supply crate
    if (e.code === 'KeyR' && !_activeBattery) {
      for (var ri = 0; ri < _batteries.length; ri++) {
        var rbat = _batteries[ri];
        if (rbat.destroyed) continue;
        var cratePos = rbat.crateGroup.position;
        var cdist = _playerPos.distanceTo(cratePos);
        if (cdist <= INTERACT_DIST + 1) {
          rbat.ammo = MAX_AMMO;
          rbat.reloading = false;
          rbat.reloadTimer = 0;
          console.log('[ArtilleryBattery] Ammo replenished');
          break;
        }
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseDown(e) {
    if (e.button === 0) _mouseDownL = true;
  }

  function _onMouseUp(e) {
    if (e.button === 0) _mouseDownL = false;
  }

  // ── Update helpers ─────────────────────────────────────────
  function _updateActiveBattery(battery, delta) {
    // Traverse (A/D)
    if (_keys['KeyA']) {
      battery.traverse -= TRAVERSE_SPEED * delta;
    }
    if (_keys['KeyD']) {
      battery.traverse += TRAVERSE_SPEED * delta;
    }
    // Clamp traverse to ±135°
    battery.traverse = Math.max(-TRAVERSE_LIMIT, Math.min(TRAVERSE_LIMIT, battery.traverse));

    // Elevation (W/S)
    if (_keys['KeyW']) {
      battery.elevation += ELEVATION_SPEED * delta;
    }
    if (_keys['KeyS']) {
      battery.elevation -= ELEVATION_SPEED * delta;
    }
    battery.elevation = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, battery.elevation));

    // Apply rotation to howitzer group
    var totalYaw = (battery.baseHeading + battery.traverse) * Math.PI / 180;
    battery.group.rotation.y = totalYaw;

    // Apply elevation to barrel pivot
    var barrelPivot = battery.group.userData.barrelPivot;
    if (barrelPivot) {
      barrelPivot.rotation.x = -battery.elevation * Math.PI / 180;
    }

    // Update gunner camera
    if (_camera) {
      var seatPos = battery.position.clone().add(new THREE.Vector3(
        -0.6 * Math.cos(totalYaw),
        1.9,
        -0.2 * Math.cos(totalYaw)
      ));
      _camera.position.copy(seatPos);
      _camera.rotation.y = totalYaw;
      _camera.rotation.x = -(battery.elevation - 30) * Math.PI / 180 * 0.4;
    }

    // Fire on LMB
    if (_mouseDownL && !battery.reloading && battery.ammo > 0) {
      _fireShell(battery);
      _mouseDownL = false; // single fire per click
    }

    // Reload progress
    if (battery.reloading) {
      battery.reloadTimer += delta;
      if (battery.reloadTimer >= RELOAD_TIME) {
        battery.reloading = false;
        battery.reloadTimer = 0;
      }
    }

    // Find battery index for HUD
    var idx = _batteries.indexOf(battery);
    _updateHUD(battery, idx);
  }

  function _updateBattery(battery, delta) {
    if (battery.destroyed) return;

    // Smoke when damaged
    if (battery.hp < BATTERY_HP_MAX * 0.5) {
      battery.smokeTimer -= delta;
      if (battery.smokeTimer <= 0) {
        battery.smokeTimer = SMOKE_INTERVAL + Math.random() * 0.1;
        _emitSmoke(battery.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.4, 1.2);
      }
    }

    // Supply crate glow
    var cratePos = battery.crateGroup.position;
    var cdist = _playerPos.distanceTo(cratePos);
    var glowMesh = battery.crateGroup.userData.glowMesh;
    if (glowMesh) {
      glowMesh.visible = cdist <= CRATE_GLOW_DIST;
      if (glowMesh.visible) {
        glowMesh.rotation.y += delta * 2;
      }
    }

    // If this is the active battery, handle controls
    if (_activeBattery === battery) {
      _updateActiveBattery(battery, delta);
    }
  }

  function _emitSmoke(pos, size, life) {
    _getMats();
    var sg = new THREE.SphereGeometry(size, 6, 6);
    var sm = new THREE.Mesh(sg, _matSmoke.clone());
    sm.position.copy(pos);
    _scene.add(sm);
    _smokeParticles.push({ mesh: sm, life: life, maxLife: life, vy: 0.8 + Math.random() * 0.5 });
  }

  function _updateShells(delta) {
    for (var i = _shells.length - 1; i >= 0; i--) {
      var s = _shells[i];
      s.t += delta;

      // Update position (Euler integration with gravity)
      s.mesh.position.x += s.vx * delta;
      s.mesh.position.y += (s.vy - GRAVITY * s.t) * delta;
      s.mesh.position.z += s.vz * delta;

      // Smoke trail
      s.smokeTimer -= delta;
      if (s.smokeTimer <= 0) {
        s.smokeTimer = SMOKE_INTERVAL;
        _emitSmoke(s.mesh.position.clone(), 0.25, 0.8);
      }

      // Orient shell along velocity vector
      var curVY = s.vy - GRAVITY * s.t;
      s.mesh.lookAt(
        s.mesh.position.x + s.vx,
        s.mesh.position.y + curVY,
        s.mesh.position.z + s.vz
      );
      s.mesh.rotateX(Math.PI / 2);

      // Hit ground (y <= 0 or terrain)
      var hitGround = s.mesh.position.y <= 0;

      // Check terrain hit via raycasting if available
      if (!hitGround && window._terrainMeshes && window._terrainMeshes.length) {
        var raycaster = new THREE.Raycaster(
          s.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
          new THREE.Vector3(0, -1, 0),
          0, 1.5
        );
        var hits = raycaster.intersectObjects(window._terrainMeshes);
        if (hits.length > 0) hitGround = true;
      }

      // Timeout (45 seconds max)
      if (s.t > 45) hitGround = true;

      if (hitGround) {
        var impactPos = s.mesh.position.clone();
        _scene.remove(s.mesh);
        _shells.splice(i, 1);
        _explode(impactPos, BLAST_RADIUS, s.battery);
      }
    }
  }

  function _updateDebris(delta) {
    for (var i = _debris.length - 1; i >= 0; i--) {
      var d = _debris[i];
      d.life -= delta;
      if (d.life <= 0) {
        _scene.remove(d.mesh);
        _debris.splice(i, 1);
        continue;
      }
      d.mesh.position.x += d.vx * delta;
      d.mesh.position.y += d.vy * delta;
      d.mesh.position.z += d.vz * delta;
      d.vy -= GRAVITY * delta;
      d.mesh.rotation.x += d.rotX * delta;
      d.mesh.rotation.z += d.rotZ * delta;
      // Bounce on ground
      if (d.mesh.position.y < 0) {
        d.mesh.position.y = 0;
        d.vy = Math.abs(d.vy) * 0.35;
        d.vx *= 0.7;
        d.vz *= 0.7;
      }
    }
  }

  function _updateSmoke(delta) {
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var s = _smokeParticles[i];
      s.life -= delta;
      if (s.life <= 0) {
        _scene.remove(s.mesh);
        _smokeParticles.splice(i, 1);
        continue;
      }
      s.mesh.position.y += s.vy * delta;
      s.mesh.scale.setScalar(1 + (1 - s.life / s.maxLife) * 1.5);
      if (s.mesh.material) {
        s.mesh.material.opacity = 0.5 * (s.life / s.maxLife);
      }
    }
  }

  // ── Public API ─────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _buildHUD();

    _keyDownHandler   = _onKeyDown;
    _keyUpHandler     = _onKeyUp;
    _mouseDownHandler = _onMouseDown;
    _mouseUpHandler   = _onMouseUp;

    document.addEventListener('keydown',   _keyDownHandler);
    document.addEventListener('keyup',     _keyUpHandler);
    document.addEventListener('mousedown', _mouseDownHandler);
    document.addEventListener('mouseup',   _mouseUpHandler);

    console.log('[ArtilleryBattery] Initialized. Press [ to place battery.');
  }

  function update(delta) {
    if (!_scene) return;

    // Sync player position from common globals
    if (window._playerMesh) {
      _playerPos.copy(window._playerMesh.position);
    } else if (_camera) {
      _playerPos.copy(_camera.position);
    }

    // Update all batteries
    for (var i = 0; i < _batteries.length; i++) {
      _updateBattery(_batteries[i], delta);
    }

    _updateShells(delta);
    _updateDebris(delta);
    _updateSmoke(delta);
  }

  function reset() {
    // Remove all batteries and crates from scene
    for (var i = 0; i < _batteries.length; i++) {
      var bat = _batteries[i];
      if (_scene) {
        _scene.remove(bat.group);
        _scene.remove(bat.crateGroup);
      }
    }
    _batteries.length = 0;

    // Remove shells
    for (var si = 0; si < _shells.length; si++) {
      if (_scene) _scene.remove(_shells[si].mesh);
    }
    _shells.length = 0;

    // Remove debris
    for (var di = 0; di < _debris.length; di++) {
      if (_scene) _scene.remove(_debris[di].mesh);
    }
    _debris.length = 0;

    // Remove smoke
    for (var smi = 0; smi < _smokeParticles.length; smi++) {
      if (_scene) _scene.remove(_smokeParticles[smi].mesh);
    }
    _smokeParticles.length = 0;

    _activeBattery = null;

    if (_hudEl)       _hudEl.style.display       = 'none';
    if (_scopeEl)     _scopeEl.style.display      = 'none';
    if (_reloadBarEl) _reloadBarEl.style.display  = 'none';
    _hudVisible = false;

    _keys      = {};
    _mouseDownL = false;
    _fireCooldown = 0;
  }

  // ── Expose damage API for enemy mortars ────────────────────
  // Call ArtilleryBattery.damageBattery(worldPos, radius, amount) from enemy scripts
  function damageBattery(worldPos, radius, amount) {
    for (var i = 0; i < _batteries.length; i++) {
      var bat = _batteries[i];
      if (bat.destroyed) continue;
      var d = worldPos.distanceTo(bat.position);
      if (d <= radius) {
        var actual = Math.round(amount * (1 - d / radius));
        bat.hp -= actual;
        if (bat.hp <= 0) {
          bat.hp = 0;
          _destroyBattery(bat);
        }
      }
    }
  }

  return {
    init:          init,
    update:        update,
    spawnBattery:  spawnBattery,
    reset:         reset,
    damageBattery: damageBattery
  };

})();
