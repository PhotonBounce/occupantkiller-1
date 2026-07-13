// claymore-mines.js — player-placeable directional claymore mines
// No let/const — only var throughout
window.ClaymoreMines = (function () {

  var _scene = null;
  var _onHit = null; // callback(pos, isPlayer)
  var _mines = [];          // placed mines in world
  var _inventory = 2;       // how many the player is carrying
  var _MAX_INVENTORY = 5;
  var _MAX_PLACED = 3;      // max live mines in world
  var _time = 0;

  // ── HUD ──────────────────────────────────────────────────────────────────
  function _updateHUD() {
    var el = document.getElementById('claymoreCounter');
    if (!el) return;
    el.textContent = '⚡ ×' + _inventory;
    el.style.display = _inventory > 0 ? 'block' : 'block'; // always show
  }

  function _ensureHUD() {
    if (document.getElementById('claymoreCounter')) return;
    var el = document.createElement('div');
    el.id = 'claymoreCounter';
    el.style.cssText = [
      'position:fixed',
      'bottom:88px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#88ff88',
      'text-shadow:0 0 4px #004400',
      'background:rgba(0,0,0,0.45)',
      'padding:3px 8px',
      'border-radius:4px',
      'z-index:1000',
      'pointer-events:none',
      'user-select:none',
    ].join(';');
    document.body.appendChild(el);
    _updateHUD();
  }

  // ── Mine mesh construction ──────────────────────────────────────────────
  function _buildMineMesh(dir) {
    var group = new THREE.Group();

    // Body — flat green box
    var bodyGeo = new THREE.BoxGeometry(0.25, 0.15, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a3a1a });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2; // sit above ground
    group.add(body);

    // Spike leg — brown cylinder
    var legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var leg = new THREE.Mesh(legGeo, legMat);
    leg.position.y = 0.1;
    group.add(leg);

    // Directional arrows — 4 white box fins fanning in front arc
    var arrowGeo = new THREE.BoxGeometry(0.1, 0.03, 0.1);
    var arrowMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var arrowAngles = [-0.45, -0.15, 0.15, 0.45]; // radians relative to forward
    for (var ai = 0; ai < arrowAngles.length; ai++) {
      var arrow = new THREE.Mesh(arrowGeo, arrowMat);
      var a = arrowAngles[ai];
      arrow.position.set(Math.sin(a) * 0.28, 0.23, -Math.cos(a) * 0.28);
      group.add(arrow);
    }

    // LED — red pulsing point light + tiny sphere
    var ledGeo = new THREE.SphereGeometry(0.05, 6, 6);
    var ledMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
    var ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, 0.29, 0.15);
    group.add(ledMesh);

    var ledLight = new THREE.PointLight(0xff0000, 0.6, 1.5);
    ledLight.position.set(0, 0.29, 0.15);
    group.add(ledLight);

    // Orient group to face in dir (dir is forward XZ)
    var angle = Math.atan2(dir.x, dir.z);
    group.rotation.y = angle;

    return { group: group, ledLight: ledLight, ledMesh: ledMesh };
  }

  // ── Explosion ──────────────────────────────────────────────────────────
  function _explode(mine) {
    if (mine.exploded) return;
    mine.exploded = true;

    var pos = mine.pos;

    // Remove mesh immediately
    if (_scene && mine.group) {
      _scene.remove(mine.group);
    }

    // Flash point light
    var flash = new THREE.PointLight(0xffffff, 8, 10);
    flash.position.copy(pos);
    if (_scene) _scene.add(flash);

    var flashStart = null;
    function fadeFlash(ts) {
      if (!flashStart) flashStart = ts;
      var t = (ts - flashStart) / 300;
      if (t < 1) {
        flash.intensity = 8 * (1 - t);
        requestAnimationFrame(fadeFlash);
      } else {
        if (_scene) _scene.remove(flash);
      }
    }
    requestAnimationFrame(fadeFlash);

    // Debris particles
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var debrisGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    var debrisList = [];
    var blastDir = mine.dir.clone();
    var blastAngle = Math.atan2(blastDir.x, blastDir.z);
    var DEBRIS_COUNT = 12;
    for (var di = 0; di < DEBRIS_COUNT; di++) {
      var d = new THREE.Mesh(debrisGeo, debrisMat);
      var spread = (Math.random() - 0.5) * (Math.PI * 2 / 3); // ±60° in front arc
      var a = blastAngle + spread;
      var speed = 2 + Math.random() * 4;
      d.position.copy(pos);
      d.position.y += 0.3;
      var dv = {
        x: Math.sin(a) * speed,
        y: 3 + Math.random() * 2,
        z: Math.cos(a) * speed
      };
      if (_scene) _scene.add(d);
      debrisList.push({ mesh: d, vel: dv, life: 1.5 + Math.random() * 0.5 });
    }

    // Animate debris
    var lastDebrisTime = null;
    function animateDebris(ts) {
      if (!lastDebrisTime) lastDebrisTime = ts;
      var dt = Math.min((ts - lastDebrisTime) / 1000, 0.05);
      lastDebrisTime = ts;
      var any = false;
      for (var i = 0; i < debrisList.length; i++) {
        var p = debrisList[i];
        if (!p || p.life <= 0) continue;
        p.life -= dt;
        p.vel.y -= 9.8 * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        if (p.mesh.position.y < 0) { p.mesh.position.y = 0; p.vel.y = 0; }
        if (p.life <= 0 && _scene) { _scene.remove(p.mesh); debrisList[i] = null; }
        else any = true;
      }
      if (any) requestAnimationFrame(animateDebris);
    }
    requestAnimationFrame(animateDebris);

    // SFX via _audioCtx if available
    _playExplosionSFX();

    // Apply damage
    _applyBlastDamage(mine);
  }

  function _playExplosionSFX() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      // Low thump
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);
      gain1.gain.setValueAtTime(1.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      // Metallic ting
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(900, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.4, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  function _applyBlastDamage(mine) {
    var pos = mine.pos;
    var dir = mine.dir;
    var RANGE = 6;
    var ARC = Math.PI * 70 / 180; // 70° half-angle — so ±35° either side
    var blastAngle = Math.atan2(dir.x, dir.z);

    // Damage enemies
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      var enemies = Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        var dx = en.mesh.position.x - pos.x;
        var dz = en.mesh.position.z - pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > RANGE) continue;
        var angle = Math.atan2(dx, dz);
        var angleDiff = Math.abs(_angleDiff(angle, blastAngle));
        if (angleDiff <= ARC) {
          if (typeof Enemies !== 'undefined' && Enemies.damage) {
            Enemies.damage(en, 999);
          }
        }
      }
    }

    // Damage player — call the onHit callback
    if (_onHit) {
      if (typeof player !== 'undefined' && player.position) {
        var pdx = player.position.x - pos.x;
        var pdz = player.position.z - pos.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist <= RANGE) {
          var pAngle = Math.atan2(pdx, pdz);
          var pDiff = Math.abs(_angleDiff(pAngle, blastAngle));
          if (pDiff <= ARC) {
            _onHit(pos, true);
          }
        }
      }
    }
  }

  function _angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }

  // ── Trigger check helpers ───────────────────────────────────────────────
  function _isInFrontArc(mine, testPos, radius, arcHalfAngle) {
    var dx = testPos.x - mine.pos.x;
    var dz = testPos.z - mine.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > radius) return false;
    var blastAngle = Math.atan2(mine.dir.x, mine.dir.z);
    var testAngle = Math.atan2(dx, dz);
    var diff = Math.abs(_angleDiff(testAngle, blastAngle));
    return diff <= arcHalfAngle;
  }

  // ── Public API ──────────────────────────────────────────────────────────
  function init(scene, onHitCb) {
    _scene = scene;
    _onHit = onHitCb || null;
    _inventory = 2;
    _mines = [];
    _time = 0;
    _ensureHUD();
    _updateHUD();
  }

  function placeMine(playerPos, playerDir) {
    if (!_scene) return;
    if (_inventory <= 0) return;
    _inventory--;
    _updateHUD();

    // Enforce max placed mines — remove oldest
    if (_mines.length >= _MAX_PLACED) {
      var oldest = _mines.shift();
      if (oldest && oldest.group && _scene) {
        _scene.remove(oldest.group);
      }
    }

    var pos = new THREE.Vector3(playerPos.x, playerPos.y - 1.5, playerPos.z);
    // Clamp to ground if near zero
    if (pos.y < 0) pos.y = 0;

    var dir = playerDir ? playerDir.clone() : new THREE.Vector3(0, 0, -1);
    dir.y = 0;
    if (dir.length() < 0.001) dir.set(0, 0, -1);
    dir.normalize();

    var built = _buildMineMesh(dir);
    built.group.position.copy(pos);
    _scene.add(built.group);

    var mine = {
      group: built.group,
      ledLight: built.ledLight,
      ledMesh: built.ledMesh,
      pos: pos,
      dir: dir,
      triggered: false,
      exploded: false,
      armDelay: 1.5,
      ledTimer: 0,
      ledOn: false,
    };
    _mines.push(mine);
  }

  function update(delta, playerPos, allEnemies) {
    _time += delta;
    var ENEMY_TRIGGER_RADIUS = 1.8;
    var PLAYER_TRIGGER_RADIUS = 1.5;
    var ENEMY_ARC = Math.PI / 3; // ±60°
    var PLAYER_ARC = Math.PI / 3;

    for (var i = _mines.length - 1; i >= 0; i--) {
      var mine = _mines[i];
      if (!mine || mine.exploded) {
        _mines.splice(i, 1);
        continue;
      }

      // Arming countdown
      if (mine.armDelay > 0) {
        mine.armDelay -= delta;
      }

      // LED blink — slower while arming (1.4s), faster when armed (0.8s)
      var blinkPeriod = mine.armDelay > 0 ? 1.4 : 0.8;
      mine.ledTimer += delta;
      if (mine.ledTimer >= blinkPeriod) {
        mine.ledTimer -= blinkPeriod;
        mine.ledOn = !mine.ledOn;
        if (mine.ledLight) mine.ledLight.intensity = mine.ledOn ? 0.6 : 0;
        if (mine.ledMesh && mine.ledMesh.material) {
          mine.ledMesh.material.emissiveIntensity = mine.ledOn ? 1 : 0;
        }
      }

      // Skip trigger check until armed
      if (mine.armDelay > 0) continue;
      if (mine.triggered) continue;

      // Check enemies
      if (allEnemies) {
        for (var ei = 0; ei < allEnemies.length; ei++) {
          var en = allEnemies[ei];
          if (!en || !en.mesh || en.hp <= 0) continue;
          if (_isInFrontArc(mine, en.mesh.position, ENEMY_TRIGGER_RADIUS, ENEMY_ARC)) {
            mine.triggered = true;
            break;
          }
        }
      }

      // Check player (friendly fire)
      if (!mine.triggered && playerPos) {
        if (_isInFrontArc(mine, playerPos, PLAYER_TRIGGER_RADIUS, PLAYER_ARC)) {
          mine.triggered = true;
        }
      }

      if (mine.triggered) {
        _explode(mine);
        _mines.splice(i, 1);
      }
    }
  }

  // Ray vs sphere hit test — called externally when a bullet is fired
  function checkBulletHit(origin, direction, maxDist) {
    var SPHERE_RADIUS = 0.35;
    for (var i = _mines.length - 1; i >= 0; i--) {
      var mine = _mines[i];
      if (!mine || mine.exploded || mine.triggered) continue;
      // Ray-sphere intersection
      var oc = new THREE.Vector3().subVectors(origin, mine.pos);
      var b = oc.dot(direction);
      var c = oc.dot(oc) - SPHERE_RADIUS * SPHERE_RADIUS;
      var discriminant = b * b - c;
      if (discriminant < 0) continue;
      var t = -b - Math.sqrt(discriminant);
      if (t < 0 || t > maxDist) continue;
      mine.triggered = true;
      _explode(mine);
      _mines.splice(i, 1);
    }
  }

  function clear() {
    for (var i = 0; i < _mines.length; i++) {
      var mine = _mines[i];
      if (mine && mine.group && _scene) {
        _scene.remove(mine.group);
      }
    }
    _mines = [];
  }

  function reset() {
    clear();
    _inventory = 2;
    _updateHUD();
  }

  function getCount() {
    return _inventory;
  }

  function setCount(n) {
    _inventory = Math.min(Math.max(0, n), _MAX_INVENTORY);
    _updateHUD();
  }

  return {
    init: init,
    update: update,
    placeMine: placeMine,
    checkBulletHit: checkBulletHit,
    clear: clear,
    reset: reset,
    getCount: getCount,
    setCount: setCount,
  };
})();
