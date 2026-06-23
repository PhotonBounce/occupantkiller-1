// capture-zone.js — Capture and Hold Zone Control System for OccupantKiller
// 3 circular capture zones; domination scoring; contest alerts; capture particles;
// zone defense bonuses; pulse rings; enemy zone capture AI.
// Depends on: THREE (global), window.Enemies (optional), window.HUD, window.KillFeed
// API: CaptureZone.init(scene, camera), .update(dt), .spawnZones(scene), .reset()

window.CaptureZone = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────
  var ZONE_RADIUS        = 6;          // units
  var CAPTURE_TIME       = 5;          // seconds to fully capture
  var ZONE_HEIGHT        = 0.18;       // cylinder height
  var SCORE_INTERVAL     = 1;          // seconds between domination score ticks
  var DEFENSE_BONUS      = 50;         // score for killing enemy in friendly zone
  var PULSE_INTERVAL     = 4;          // seconds between pulse rings
  var ENEMY_MOVE_SPEED   = 2.5;        // units/sec when walking to zone
  var ENEMY_CAPTURE_TIME = 6;          // seconds for an enemy to cap a zone
  var ZONE_LABELS        = ['A', 'B', 'C'];
  var ZONE_POSITIONS     = [
    { x: -30, y: 0, z: -30 },
    { x:  35, y: 0, z:   5 },
    { x:  -5, y: 0, z:  35 }
  ];

  // Colors
  var COLOR_NEUTRAL  = 0x888888;
  var COLOR_PLAYER   = 0x2266ff;
  var COLOR_ENEMY    = 0xff2222;
  var COLOR_CAPTURE  = 0x44ffaa;

  // States
  var STATE_NEUTRAL  = 'NEUTRAL';
  var STATE_PLAYER   = 'PLAYER';
  var STATE_ENEMY    = 'ENEMY';

  // ── Module state ───────────────────────────────────────────────────────
  var _scene         = null;
  var _camera        = null;
  var _zones         = [];         // zone objects
  var _particles     = [];         // active capture particles
  var _pulseRings    = [];         // active expanding torus rings
  var _scoreTimer    = 0;
  var _initialized   = false;
  var _hudTop        = null;       // "ZONE CONTROL: N/3" element
  var _hudBottom     = null;       // 3-icon row at bottom-center
  var _hudIcons      = [];         // 3 icon elements
  var _contestEl     = null;       // "ZONE [X] CONTESTED" overlay
  var _contestTimer  = 0;
  var _stageOffset   = { x: 0, y: 0, z: 0 };

  // ── Helpers ────────────────────────────────────────────────────────────
  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _colorForState(state) {
    if (state === STATE_PLAYER)  return COLOR_PLAYER;
    if (state === STATE_ENEMY)   return COLOR_ENEMY;
    return COLOR_NEUTRAL;
  }

  function _hexToCSS(hex) {
    return '#' + ('000000' + hex.toString(16)).slice(-6);
  }

  // ── HUD: top-center "ZONE CONTROL: N/3" ──────────────────────────────
  function _ensureHUDTop() {
    if (typeof document === 'undefined') return;
    if (_hudTop) return;
    _hudTop = document.createElement('div');
    _hudTop.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'color:#ffffff',
      'text-shadow:0 0 8px #2266ff,0 2px 4px #000',
      'pointer-events:none',
      'z-index:510',
      'letter-spacing:2px',
      'background:rgba(0,0,0,0.45)',
      'padding:4px 14px',
      'border-radius:6px',
      'white-space:nowrap'
    ].join(';');
    _hudTop.textContent = 'ZONE CONTROL: 0/3';
    document.body.appendChild(_hudTop);
  }

  function _updateHUDTop() {
    if (!_hudTop) return;
    var count = 0;
    for (var i = 0; i < _zones.length; i++) {
      if (_zones[i].state === STATE_PLAYER) count++;
    }
    _hudTop.textContent = 'ZONE CONTROL: ' + count + '/3';
  }

  // ── HUD: bottom-center zone icons ──────────────────────────────────────
  function _ensureHUDBottom() {
    if (typeof document === 'undefined') return;
    if (_hudBottom) return;

    _hudBottom = document.createElement('div');
    _hudBottom.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'gap:14px',
      'pointer-events:none',
      'z-index:510'
    ].join(';');

    for (var i = 0; i < 3; i++) {
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;';

      var circle = document.createElement('div');
      circle.style.cssText = [
        'width:28px',
        'height:28px',
        'border-radius:50%',
        'border:2px solid #ffffff',
        'background:#888888',
        'transition:background 0.3s'
      ].join(';');

      var label = document.createElement('div');
      label.style.cssText = 'font-family:monospace;font-size:11px;font-weight:bold;color:#ffffff;text-shadow:0 1px 3px #000;';
      label.textContent = ZONE_LABELS[i];

      wrapper.appendChild(circle);
      wrapper.appendChild(label);
      _hudBottom.appendChild(wrapper);
      _hudIcons.push(circle);
    }
    document.body.appendChild(_hudBottom);
  }

  function _updateHUDBottom() {
    for (var i = 0; i < _hudIcons.length && i < _zones.length; i++) {
      var z = _zones[i];
      var color = _hexToCSS(_colorForState(z.state));
      // Flash contested zones
      if (z.contested) {
        var flash = (Math.floor(Date.now() / 250) % 2 === 0);
        color = flash ? _hexToCSS(COLOR_ENEMY) : _hexToCSS(COLOR_PLAYER);
      }
      _hudIcons[i].style.background = color;
    }
  }

  // ── Contest overlay ────────────────────────────────────────────────────
  function _ensureContestEl() {
    if (typeof document === 'undefined') return;
    if (_contestEl) return;
    _contestEl = document.createElement('div');
    _contestEl.style.cssText = [
      'position:fixed',
      'top:15%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'color:#ff3333',
      'text-shadow:0 0 12px #ff0000,0 2px 4px #000',
      'pointer-events:none',
      'z-index:520',
      'letter-spacing:3px',
      'opacity:0',
      'transition:opacity 0.2s',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_contestEl);
  }

  function _showContest(label) {
    _ensureContestEl();
    if (!_contestEl) return;
    _contestEl.textContent = 'ZONE ' + label + ' CONTESTED';
    _contestEl.style.opacity = '1';
    _contestTimer = 1.0;
  }

  function _hideContest() {
    if (_contestEl) _contestEl.style.opacity = '0';
  }

  // ── Banner (capture notification) ─────────────────────────────────────
  function _showBanner(text, color, duration) {
    if (typeof document === 'undefined') return;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:22%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'color:' + (color || '#ffd700'),
      'text-shadow:0 0 14px ' + (color || '#ffd700') + ',0 2px 4px #000',
      'pointer-events:none',
      'z-index:515',
      'letter-spacing:3px',
      'white-space:nowrap',
      'opacity:1',
      'transition:opacity 0.4s'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    var life = duration || 2500;
    var fadeStart = life - 400;
    var born = Date.now();
    var timer = setInterval(function () {
      var age = Date.now() - born;
      if (age >= fadeStart) {
        el.style.opacity = String(Math.max(0, 1 - (age - fadeStart) / 400));
      }
      if (age >= life) {
        clearInterval(timer);
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    }, 30);
  }

  // ── Score helper ───────────────────────────────────────────────────────
  function _addScore(amount) {
    if (typeof window !== 'undefined' && window.player && window.player.score !== undefined) {
      window.player.score += amount;
      if (typeof window.HUD !== 'undefined' && window.HUD.setScore) {
        window.HUD.setScore(window.player.score);
      }
    }
  }

  // ── Zone cylinder mesh ─────────────────────────────────────────────────
  function _makeZoneMesh(color) {
    var geo = new THREE.CylinderGeometry(ZONE_RADIUS, ZONE_RADIUS, ZONE_HEIGHT, 36);
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  // ── Progress bar ring (inner cylinder) ────────────────────────────────
  function _makeProgressRing(color) {
    var geo = new THREE.CylinderGeometry(ZONE_RADIUS - 0.4, ZONE_RADIUS, ZONE_HEIGHT + 0.02, 36);
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  // ── Zone label sprite ──────────────────────────────────────────────────
  function _makeZoneSprite(label, color) {
    if (typeof document === 'undefined') return null;
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = _hexToCSS(color);
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 64, 66);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(3, 3, 1);
    return sprite;
  }

  // ── Capture particles ──────────────────────────────────────────────────
  function _spawnCaptureParticles(position, color) {
    if (!_scene) return;
    for (var i = 0; i < 20; i++) {
      var geo = new THREE.SphereGeometry(0.15, 6, 6);
      var mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1.0
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(position.x, position.y + 1, position.z);
      var angle = (i / 20) * Math.PI * 2 + Math.random() * 0.5;
      var speed = 3 + Math.random() * 5;
      var vy = 2 + Math.random() * 4;
      _scene.add(mesh);
      _particles.push({
        mesh: mesh,
        vx: Math.cos(angle) * speed,
        vy: vy,
        vz: Math.sin(angle) * speed,
        life: 1.2 + Math.random() * 0.6,
        age: 0
      });
    }
  }

  // ── Pulse ring ─────────────────────────────────────────────────────────
  function _spawnPulseRing(position, color) {
    if (!_scene) return;
    var geo = new THREE.TorusGeometry(ZONE_RADIUS, 0.18, 8, 36);
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(position.x, position.y + 0.2, position.z);
    _scene.add(mesh);
    _pulseRings.push({
      mesh: mesh,
      age: 0,
      life: 2.0,
      startRadius: ZONE_RADIUS
    });
  }

  // ── Update particles ───────────────────────────────────────────────────
  function _updateParticles(dt) {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.age += dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 8 * dt;  // gravity
      p.mesh.material.opacity = Math.max(0, 1 - p.age / p.life);
      if (p.age >= p.life) {
        if (_scene) _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _particles.splice(i, 1);
      }
    }
  }

  // ── Update pulse rings ─────────────────────────────────────────────────
  function _updatePulseRings(dt) {
    for (var i = _pulseRings.length - 1; i >= 0; i--) {
      var r = _pulseRings[i];
      r.age += dt;
      var t = r.age / r.life;
      var scale = 1 + t * 1.4;
      r.mesh.scale.set(scale, scale, 1);
      r.mesh.material.opacity = Math.max(0, 0.7 * (1 - t));
      if (r.age >= r.life) {
        if (_scene) _scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        _pulseRings.splice(i, 1);
      }
    }
  }

  // ── Apply zone color ───────────────────────────────────────────────────
  function _applyZoneColor(zone) {
    var col = _colorForState(zone.state);
    zone.mesh.material.color.setHex(col);
    // Update sprite
    if (zone.sprite) {
      var canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 128, 128);
      ctx.fillStyle = _hexToCSS(col);
      ctx.beginPath();
      ctx.arc(64, 64, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.label, 64, 66);
      zone.sprite.material.map = new THREE.CanvasTexture(canvas);
      zone.sprite.material.map.needsUpdate = true;
    }
  }

  // ── Create a single zone ───────────────────────────────────────────────
  function _createZone(index, pos) {
    var state   = STATE_NEUTRAL;
    var mesh    = _makeZoneMesh(COLOR_NEUTRAL);
    mesh.position.set(pos.x, pos.y + 0.1, pos.z);
    var sprite  = _makeZoneSprite(ZONE_LABELS[index], COLOR_NEUTRAL);
    if (sprite) {
      sprite.position.set(pos.x, pos.y + 4.5, pos.z);
    }

    var zone = {
      index: index,
      label: ZONE_LABELS[index],
      position: { x: pos.x, y: pos.y, z: pos.z },
      mesh: mesh,
      sprite: sprite,
      state: state,
      captureProgress: 0,   // 0..1 — player capture fraction
      enemyProgress: 0,     // 0..1 — enemy capture fraction
      contested: false,
      pulseTimer: Math.random() * PULSE_INTERVAL,  // stagger
      contestFlash: 0,
      // Enemy AI
      assignedEnemy: null
    };
    return zone;
  }

  // ── Check if a point is inside a zone ─────────────────────────────────
  function _inZone(zone, x, z) {
    return _dist2D(x, z, zone.position.x, zone.position.z) <= ZONE_RADIUS;
  }

  // ── Update a zone's capture state ─────────────────────────────────────
  function _updateZoneCapture(zone, dt, playerInZone, enemiesInZone) {
    var numEnemies = enemiesInZone.length;
    zone.contested = false;

    if (zone.state === STATE_PLAYER) {
      if (numEnemies > 0) {
        zone.contested = true;
        zone.contestFlash += dt;
        // Flash the zone mesh red/blue
        var flash = (Math.floor(zone.contestFlash / 0.15) % 2 === 0);
        zone.mesh.material.color.setHex(flash ? COLOR_ENEMY : COLOR_PLAYER);
      } else {
        zone.contestFlash = 0;
        zone.mesh.material.color.setHex(COLOR_PLAYER);
      }
    }

    if (zone.state === STATE_NEUTRAL || zone.state === STATE_ENEMY) {
      if (playerInZone && numEnemies === 0) {
        // Player capturing
        zone.captureProgress += dt / CAPTURE_TIME;
        zone.captureProgress = Math.min(1, zone.captureProgress);
        // Visual feedback: tint toward blue as progress grows
        var t = zone.captureProgress;
        zone.mesh.material.color.setHex(
          _blendHex(zone.state === STATE_ENEMY ? COLOR_ENEMY : COLOR_NEUTRAL, COLOR_PLAYER, t)
        );
        if (zone.captureProgress >= 1) {
          _captureZoneByPlayer(zone);
        }
      } else if (!playerInZone || numEnemies > 0) {
        // No capture happening; bleed progress back
        if (zone.captureProgress > 0) {
          zone.captureProgress -= dt / CAPTURE_TIME;
          zone.captureProgress = Math.max(0, zone.captureProgress);
        }
      }
    }

    // Enemy capturing player zone
    if (zone.state === STATE_PLAYER && numEnemies > 0 && !playerInZone) {
      zone.enemyProgress += dt / ENEMY_CAPTURE_TIME;
      if (zone.enemyProgress >= 1) {
        zone.enemyProgress = 0;
        zone.captureProgress = 0;
        zone.state = STATE_ENEMY;
        zone.mesh.material.color.setHex(COLOR_ENEMY);
        _applyZoneColor(zone);
        _showBanner('ZONE ' + zone.label + ' LOST!', '#ff3333', 2500);
      }
    } else if (zone.state === STATE_PLAYER) {
      zone.enemyProgress = Math.max(0, zone.enemyProgress - dt / ENEMY_CAPTURE_TIME);
    }
  }

  function _blendHex(from, to, t) {
    var fr = (from >> 16) & 0xff, fg = (from >> 8) & 0xff, fb = from & 0xff;
    var tr = (to >> 16) & 0xff,   tg = (to >> 8) & 0xff,   tb = to & 0xff;
    var r = Math.round(fr + (tr - fr) * t);
    var g = Math.round(fg + (tg - fg) * t);
    var b = Math.round(fb + (tb - fb) * t);
    return (r << 16) | (g << 8) | b;
  }

  function _captureZoneByPlayer(zone) {
    zone.state = STATE_PLAYER;
    zone.captureProgress = 1;
    zone.enemyProgress = 0;
    _applyZoneColor(zone);
    _spawnCaptureParticles(zone.mesh.position, COLOR_PLAYER);
    _showBanner('ZONE ' + zone.label + ' CAPTURED!', '#44bbff', 2500);
    _updateHUDTop();
    _updateHUDBottom();
  }

  // ── Enemy AI — walk toward uncaptured zones ────────────────────────────
  function _updateEnemyAI(zone, dt) {
    if (typeof window === 'undefined') return;
    if (typeof window.Enemies === 'undefined' || !window.Enemies.getAll) return;
    if (zone.state === STATE_ENEMY) return;  // already owned by enemy

    // Find or assign an enemy to walk to this zone
    var allEnemies = window.Enemies.getAll();
    if (!allEnemies || allEnemies.length === 0) return;

    var assigned = zone.assignedEnemy;
    // Validate assigned enemy still alive
    if (assigned && assigned.hp !== undefined && assigned.hp <= 0) {
      zone.assignedEnemy = null;
      assigned = null;
    }
    if (assigned && assigned.mesh) {
      var d = _dist2D(
        assigned.mesh.position.x, assigned.mesh.position.z,
        zone.position.x, zone.position.z
      );
      if (d > 1) {
        // Walk toward zone
        var dx = zone.position.x - assigned.mesh.position.x;
        var dz = zone.position.z - assigned.mesh.position.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0) {
          assigned.mesh.position.x += (dx / len) * ENEMY_MOVE_SPEED * dt;
          assigned.mesh.position.z += (dz / len) * ENEMY_MOVE_SPEED * dt;
        }
      }
    } else {
      // Assign a random enemy that isn't already assigned
      var candidates = [];
      for (var i = 0; i < allEnemies.length; i++) {
        var e = allEnemies[i];
        if (e.hp && e.hp > 0 && e.mesh) {
          var taken = false;
          for (var j = 0; j < _zones.length; j++) {
            if (_zones[j].assignedEnemy === e) { taken = true; break; }
          }
          if (!taken) candidates.push(e);
        }
      }
      if (candidates.length > 0) {
        zone.assignedEnemy = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
  }

  // ── Zone defense bonus ─────────────────────────────────────────────────
  // Called externally via CaptureZone.checkDefenseKill(enemyMesh)
  function checkDefenseKill(enemyMesh) {
    if (!enemyMesh) return false;
    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];
      if (zone.state !== STATE_PLAYER) continue;
      if (_inZone(zone, enemyMesh.position.x, enemyMesh.position.z)) {
        _addScore(DEFENSE_BONUS);
        if (typeof window.KillFeed !== 'undefined' && window.KillFeed.addEvent) {
          window.KillFeed.addEvent('ZONE DEFENDER +' + DEFENSE_BONUS, '#44ffaa');
        }
        _showBanner('ZONE DEFENDER! +' + DEFENSE_BONUS, '#44ffaa', 2000);
        return true;
      }
    }
    return false;
  }

  // ── Public: spawnZones ─────────────────────────────────────────────────
  function spawnZones(scene) {
    _scene = scene || _scene;
    if (!_scene) return;

    // Clean up any old zones
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      if (z.mesh) _scene.remove(z.mesh);
      if (z.sprite) _scene.remove(z.sprite);
    }
    _zones = [];

    for (var k = 0; k < ZONE_POSITIONS.length; k++) {
      var pos = ZONE_POSITIONS[k];
      var zone = _createZone(k, pos);
      _scene.add(zone.mesh);
      if (zone.sprite) _scene.add(zone.sprite);
      _zones.push(zone);
    }

    _ensureHUDTop();
    _ensureHUDBottom();
    _updateHUDTop();
    _updateHUDBottom();
  }

  // ── Public: init ───────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _initialized = true;
    spawnZones(scene);
  }

  // ── Public: update ─────────────────────────────────────────────────────
  function update(dt) {
    if (!_initialized || !_scene) return;
    if (!dt || dt <= 0 || dt > 1) dt = 0.016;

    // Get player position from camera or window.player
    var px = 0, pz = 0;
    if (_camera) {
      px = _camera.position.x;
      pz = _camera.position.z;
    } else if (typeof window !== 'undefined' && window.player && window.player.position) {
      px = window.player.position.x;
      pz = window.player.position.z;
    }

    // Get enemies
    var allEnemies = [];
    if (typeof window !== 'undefined' && window.Enemies && window.Enemies.getAll) {
      allEnemies = window.Enemies.getAll() || [];
    }

    var anyContested = false;
    var contestedLabel = '';

    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];

      // Check player inside zone
      var playerInZone = _inZone(zone, px, pz);

      // Check enemies inside zone
      var enemiesInZone = [];
      for (var j = 0; j < allEnemies.length; j++) {
        var e = allEnemies[j];
        if (e.mesh && e.hp && e.hp > 0) {
          if (_inZone(zone, e.mesh.position.x, e.mesh.position.z)) {
            enemiesInZone.push(e);
          }
        }
      }

      // Update capture logic
      _updateZoneCapture(zone, dt, playerInZone, enemiesInZone);

      // Contest check
      if (zone.contested && zone.state === STATE_PLAYER) {
        anyContested = true;
        contestedLabel = zone.label;
      }

      // Enemy AI pathing
      _updateEnemyAI(zone, dt);

      // Pulse ring timer
      zone.pulseTimer -= dt;
      if (zone.pulseTimer <= 0) {
        zone.pulseTimer = PULSE_INTERVAL;
        _spawnPulseRing(zone.mesh.position, _colorForState(zone.state));
      }
    }

    // Contest overlay
    if (anyContested) {
      _showContest(contestedLabel);
    }
    if (_contestTimer > 0) {
      _contestTimer -= dt;
      if (_contestTimer <= 0 && !anyContested) {
        _hideContest();
      }
    }

    // Domination scoring
    _scoreTimer += dt;
    if (_scoreTimer >= SCORE_INTERVAL) {
      _scoreTimer -= SCORE_INTERVAL;
      var dominated = 0;
      for (var n = 0; n < _zones.length; n++) {
        if (_zones[n].state === STATE_PLAYER) dominated++;
      }
      if (dominated > 0) {
        _addScore(dominated);
      }
    }

    _updateParticles(dt);
    _updatePulseRings(dt);
    _updateHUDBottom();
  }

  // ── Public: reset ──────────────────────────────────────────────────────
  function reset() {
    // Remove meshes from scene
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      if (_scene && z.mesh) _scene.remove(z.mesh);
      if (_scene && z.sprite) _scene.remove(z.sprite);
    }
    _zones = [];

    // Remove particles
    for (var p = 0; p < _particles.length; p++) {
      var part = _particles[p];
      if (_scene) _scene.remove(part.mesh);
      part.mesh.geometry.dispose();
      part.mesh.material.dispose();
    }
    _particles = [];

    // Remove pulse rings
    for (var r = 0; r < _pulseRings.length; r++) {
      var ring = _pulseRings[r];
      if (_scene) _scene.remove(ring.mesh);
      ring.mesh.geometry.dispose();
      ring.mesh.material.dispose();
    }
    _pulseRings = [];

    _scoreTimer = 0;
    _contestTimer = 0;

    // Remove HUD elements
    if (_hudTop && _hudTop.parentNode) {
      _hudTop.parentNode.removeChild(_hudTop);
      _hudTop = null;
    }
    if (_hudBottom && _hudBottom.parentNode) {
      _hudBottom.parentNode.removeChild(_hudBottom);
      _hudBottom = null;
    }
    _hudIcons = [];
    if (_contestEl && _contestEl.parentNode) {
      _contestEl.parentNode.removeChild(_contestEl);
      _contestEl = null;
    }

    _initialized = false;
    _scene = null;
    _camera = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    spawnZones: spawnZones,
    reset: reset,
    checkDefenseKill: checkDefenseKill
  };

})();
