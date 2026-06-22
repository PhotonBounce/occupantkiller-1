// claymore-directional.js — standalone directional blast-cone claymore module
// No let/const — only var throughout
window.ClaymoreDirectional = (function () {
  'use strict';

  var _scene = null;
  var _onHit = null;        // callback(pos, isPlayer)
  var _claymores = [];      // active placed claymores
  var _MAX_PLACED = 3;
  var _time = 0;

  // ── Canvas texture: "FRONT TOWARD ENEMY" label ───────────────────────────
  function _makeLabelTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3b4a1e';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#c8b850';
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, 250, 58);
    ctx.fillStyle = '#f0d060';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FRONT TOWARD ENEMY', 128, 32);
    var tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // ── Mine mesh construction ────────────────────────────────────────────────
  function _buildMesh(dir) {
    var group = new THREE.Group();

    // Body — flat dark-olive box per spec: BoxGeometry(0.3, 0.2, 0.08)
    var bodyGeo = new THREE.BoxGeometry(0.3, 0.2, 0.08);
    var labelTex = _makeLabelTexture();
    var materials = [
      new THREE.MeshLambertMaterial({ color: 0x3b4a1e }),  // right
      new THREE.MeshLambertMaterial({ color: 0x3b4a1e }),  // left
      new THREE.MeshLambertMaterial({ color: 0x3b4a1e }),  // top
      new THREE.MeshLambertMaterial({ color: 0x3b4a1e }),  // bottom
      new THREE.MeshLambertMaterial({ map: labelTex }),     // front (face +Z)
      new THREE.MeshLambertMaterial({ color: 0x2a3514 }),  // back
    ];
    var body = new THREE.Mesh(bodyGeo, materials);
    body.position.y = 0.15;
    group.add(body);

    // Two small spike-legs
    var legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 5);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.08, 0.06, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.08, 0.06, 0);
    group.add(legR);

    // LED indicator — small red sphere on front face
    var ledGeo = new THREE.SphereGeometry(0.018, 6, 6);
    var ledMat = new THREE.MeshLambertMaterial({
      color: 0xff2200,
      emissive: 0xff2200,
      emissiveIntensity: 1,
    });
    var ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0.1, 0.17, 0.045);
    group.add(ledMesh);

    var ledLight = new THREE.PointLight(0xff2200, 0.5, 1.2);
    ledLight.position.copy(ledMesh.position);
    group.add(ledLight);

    // Tripwire — thin CylinderGeometry(0.01, 0.01, 3), horizontal
    // Rotated 90° on X so it extends in local +Z (forward)
    var wireGeo = new THREE.CylinderGeometry(0.01, 0.01, 3, 6);
    var wireMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.7 });
    var wire = new THREE.Mesh(wireGeo, wireMat);
    wire.rotation.x = Math.PI / 2;
    wire.position.set(0, 0.15, 1.5); // starts at body front, extends 3 units forward
    group.add(wire);

    // Orient group to face in dir direction (dir is forward in XZ plane)
    var angle = Math.atan2(dir.x, dir.z);
    group.rotation.y = angle;

    return { group: group, ledMesh: ledMesh, ledLight: ledLight };
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _updateHUD() {
    var el = document.getElementById('claymoreDirectionalHUD');
    if (!el) return;
    var placed = _claymores.length;
    var remaining = _MAX_PLACED - placed;
    el.textContent = '⊕ CLAYMORE \xd7' + remaining;
    window._claymoreDirectionalCount = remaining;
  }

  function _ensureHUD() {
    if (document.getElementById('claymoreDirectionalHUD')) return;
    var el = document.createElement('div');
    el.id = 'claymoreDirectionalHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:112px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#d4c060',
      'text-shadow:0 0 4px #443800',
      'background:rgba(0,0,0,0.5)',
      'padding:3px 8px',
      'border-radius:4px',
      'z-index:1000',
      'pointer-events:none',
      'user-select:none',
    ].join(';');
    document.body.appendChild(el);
    _updateHUD();
  }

  // ── Angle helpers ─────────────────────────────────────────────────────────
  function _angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }

  // Returns true if testPos is within the blast cone (range + arc half-angle)
  function _inCone(claymore, testPos, range, arcHalf) {
    var dx = testPos.x - claymore.pos.x;
    var dz = testPos.z - claymore.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > range) return false;
    var faceAngle = Math.atan2(claymore.dir.x, claymore.dir.z);
    var toAngle = Math.atan2(dx, dz);
    return Math.abs(_angleDiff(toAngle, faceAngle)) <= arcHalf;
  }

  // ── VFX — orange-white flash, debris, scorch ─────────────────────────────
  function _vfxExplode(pos, dir) {
    if (!_scene) return;

    // Orange-white flash point light
    var flash = new THREE.PointLight(0xffaa33, 10, 12);
    flash.position.copy(pos);
    flash.position.y += 0.3;
    _scene.add(flash);

    // Secondary white core flash
    var flashCore = new THREE.PointLight(0xffffff, 6, 5);
    flashCore.position.copy(flash.position);
    _scene.add(flashCore);

    var flashStart = null;
    function fadeFlash(ts) {
      if (!flashStart) flashStart = ts;
      var t = (ts - flashStart) / 350;
      if (t < 1) {
        flash.intensity = 10 * (1 - t);
        flashCore.intensity = 6 * (1 - t);
        requestAnimationFrame(fadeFlash);
      } else {
        _scene.remove(flash);
        _scene.remove(flashCore);
      }
    }
    requestAnimationFrame(fadeFlash);

    // Ground scorch mark — flat disc
    var scorchGeo = new THREE.CircleGeometry(1.2, 12);
    var scorchMat = new THREE.MeshLambertMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.7,
    });
    var scorch = new THREE.Mesh(scorchGeo, scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.copy(pos);
    scorch.position.y = 0.01;
    _scene.add(scorch);
    // Fade scorch out after 8 seconds
    var scorchStart = null;
    function fadeScorch(ts) {
      if (!scorchStart) scorchStart = ts;
      var t = (ts - scorchStart) / 8000;
      if (t < 1) {
        scorchMat.opacity = 0.7 * (1 - t);
        requestAnimationFrame(fadeScorch);
      } else {
        _scene.remove(scorch);
        scorchGeo.dispose();
        scorchMat.dispose();
      }
    }
    requestAnimationFrame(fadeScorch);

    // Debris scatter — concentrated in forward arc
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var debrisGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var debrisList = [];
    var blastAngle = Math.atan2(dir.x, dir.z);
    var DEBRIS_COUNT = 14;
    for (var di = 0; di < DEBRIS_COUNT; di++) {
      var d = new THREE.Mesh(debrisGeo, debrisMat);
      // Spread within ±50° of blast direction
      var spread = (Math.random() - 0.5) * (Math.PI * 50 / 180) * 2;
      var a = blastAngle + spread;
      var speed = 3 + Math.random() * 5;
      d.position.copy(pos);
      d.position.y += 0.2;
      var dv = {
        x: Math.sin(a) * speed,
        y: 2.5 + Math.random() * 3,
        z: Math.cos(a) * speed,
      };
      _scene.add(d);
      debrisList.push({ mesh: d, vel: dv, life: 1.2 + Math.random() * 0.8 });
    }

    var lastDebrisTs = null;
    function animateDebris(ts) {
      if (!lastDebrisTs) lastDebrisTs = ts;
      var dt = Math.min((ts - lastDebrisTs) / 1000, 0.05);
      lastDebrisTs = ts;
      var any = false;
      for (var i = 0; i < debrisList.length; i++) {
        var p = debrisList[i];
        if (!p || p.life <= 0) continue;
        p.life -= dt;
        p.vel.y -= 9.8 * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        if (p.mesh.position.y < 0.01) { p.mesh.position.y = 0.01; p.vel.y *= -0.2; }
        if (p.life <= 0) {
          _scene.remove(p.mesh);
          debrisList[i] = null;
        } else {
          any = true;
        }
      }
      if (any) requestAnimationFrame(animateDebris);
      else {
        debrisGeo.dispose();
        debrisMat.dispose();
      }
    }
    requestAnimationFrame(animateDebris);
  }

  // ── Audio SFX ─────────────────────────────────────────────────────────────
  function _playSFX() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      // Low directional thump
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(90, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(18, ctx.currentTime + 0.35);
      gain1.gain.setValueAtTime(1.8, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);

      // Metallic crack
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1200, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.5, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  // ── Blast damage application ──────────────────────────────────────────────
  function _applyDamage(claymore) {
    var pos = claymore.pos;
    var dir = claymore.dir;
    var RANGE = 5;
    var ARC_HALF = Math.PI * 30 / 180; // ±30° = 60° total cone
    var DAMAGE = 80;

    // Damage enemies in cone
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      var enemies = Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        if (_inCone(claymore, en.mesh.position, RANGE, ARC_HALF)) {
          if (Enemies.damage) {
            Enemies.damage(en, DAMAGE);
          }
        }
      }
    }

    // Damage player if in cone — call onHit callback
    if (_onHit) {
      if (typeof player !== 'undefined' && player && player.position) {
        if (_inCone(claymore, player.position, RANGE, ARC_HALF)) {
          _onHit(pos, true);
        }
      }
    }
  }

  // ── Explode a claymore ────────────────────────────────────────────────────
  function _explode(claymore) {
    if (claymore.exploded) return;
    claymore.exploded = true;

    if (_scene && claymore.group) {
      _scene.remove(claymore.group);
    }

    _vfxExplode(claymore.pos, claymore.dir);
    _playSFX();
    _applyDamage(claymore);

    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast('Claymore triggered!');
    }
  }

  // ── Check if an enemy crosses the tripwire ────────────────────────────────
  // Tripwire: 3 units long in facing direction, 0.3-unit cross-radius check
  function _crossesTripwire(claymore, testPos) {
    var faceAngle = Math.atan2(claymore.dir.x, claymore.dir.z);
    // Vector from mine to test position
    var dx = testPos.x - claymore.pos.x;
    var dz = testPos.z - claymore.pos.z;
    // Project onto facing direction (along-wire component)
    var fwdX = Math.sin(faceAngle);
    var fwdZ = Math.cos(faceAngle);
    var along = dx * fwdX + dz * fwdZ;   // how far along the wire
    if (along < 0 || along > 3.0) return false;  // outside wire length
    // Perpendicular distance from wire axis
    var perpX = dx - along * fwdX;
    var perpZ = dz - along * fwdZ;
    var perp = Math.sqrt(perpX * perpX + perpZ * perpZ);
    return perp <= 0.3;
  }

  // ── Public: init ─────────────────────────────────────────────────────────
  function init(scene, onHitCb) {
    _scene = scene;
    _onHit = onHitCb || null;
    _claymores = [];
    _time = 0;
    window._claymoreDirectionalCount = _MAX_PLACED;
    _ensureHUD();
    _updateHUD();
    _registerKeys();
  }

  // ── Key registration — Shift+C to place, E to pick up ────────────────────
  var _keysRegistered = false;
  function _registerKeys() {
    if (_keysRegistered) return;
    _keysRegistered = true;

    document.addEventListener('keydown', function (e) {
      // Shift+C — place directional claymore
      if (e.code === 'KeyC' && e.shiftKey) {
        // Let game-manager's Shift+C (CompanionDrone) fire first; we add our own logic
        _tryPlace();
        // Do not stopPropagation — companion drone also uses this
      }

      // E key — pick up nearest claymore within 2 units
      if (e.code === 'KeyE' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
        _tryPickup();
      }
    });
  }

  function _tryPlace() {
    if (!_scene) return;
    if (_claymores.length >= _MAX_PLACED) {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast('Max directional claymores placed (' + _MAX_PLACED + ')');
      }
      return;
    }

    // Resolve player position and facing direction
    var pPos = (typeof player !== 'undefined' && player && player.position)
      ? player.position
      : null;
    if (!pPos) return;

    var dir = new THREE.Vector3(0, 0, -1);
    if (typeof CameraSystem !== 'undefined' && CameraSystem.getForwardDir) {
      var fd = CameraSystem.getForwardDir();
      if (fd) dir = fd.clone();
    }
    dir.y = 0;
    if (dir.length() < 0.001) dir.set(0, 0, -1);
    dir.normalize();

    place(pPos, dir);

    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast('⊕ Directional claymore placed');
    }
  }

  function _tryPickup() {
    if (!_scene) return;
    var pPos = (typeof player !== 'undefined' && player && player.position)
      ? player.position
      : null;
    if (!pPos) return;

    var PICKUP_RANGE = 2;
    for (var i = _claymores.length - 1; i >= 0; i--) {
      var cl = _claymores[i];
      if (!cl || cl.exploded) continue;
      var dx = cl.pos.x - pPos.x;
      var dy = cl.pos.y - pPos.y;
      var dz = cl.pos.z - pPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= PICKUP_RANGE) {
        if (_scene && cl.group) _scene.remove(cl.group);
        _claymores.splice(i, 1);
        _updateHUD();
        if (typeof HUD !== 'undefined' && HUD.showToast) {
          HUD.showToast('⊕ Claymore recovered');
        }
        break; // pick up one at a time
      }
    }
  }

  // ── Public: place ────────────────────────────────────────────────────────
  function place(playerPos, playerDir) {
    if (!_scene) return;
    if (_claymores.length >= _MAX_PLACED) return;

    var pos = new THREE.Vector3(
      playerPos.x,
      (playerPos.y - 1.5 < 0 ? 0 : playerPos.y - 1.5),
      playerPos.z
    );

    var dir = playerDir ? playerDir.clone() : new THREE.Vector3(0, 0, -1);
    dir.y = 0;
    if (dir.length() < 0.001) dir.set(0, 0, -1);
    dir.normalize();

    var built = _buildMesh(dir);
    built.group.position.copy(pos);
    _scene.add(built.group);

    var claymore = {
      group: built.group,
      ledMesh: built.ledMesh,
      ledLight: built.ledLight,
      pos: pos,
      dir: dir,
      exploded: false,
      triggered: false,
      armDelay: 1.5,
      ledTimer: 0,
      ledOn: false,
    };

    _claymores.push(claymore);
    _updateHUD();
  }

  // ── Public: update ───────────────────────────────────────────────────────
  function update(delta, playerPos, allEnemies) {
    _time += delta;

    for (var i = _claymores.length - 1; i >= 0; i--) {
      var cl = _claymores[i];
      if (!cl || cl.exploded) {
        _claymores.splice(i, 1);
        _updateHUD();
        continue;
      }

      // Arming countdown
      if (cl.armDelay > 0) {
        cl.armDelay -= delta;
      }

      // LED blink
      var blinkPeriod = cl.armDelay > 0 ? 1.5 : 0.6;
      cl.ledTimer += delta;
      if (cl.ledTimer >= blinkPeriod) {
        cl.ledTimer -= blinkPeriod;
        cl.ledOn = !cl.ledOn;
        if (cl.ledLight) cl.ledLight.intensity = cl.ledOn ? 0.5 : 0;
        if (cl.ledMesh && cl.ledMesh.material) {
          cl.ledMesh.material.emissiveIntensity = cl.ledOn ? 1 : 0;
        }
      }

      if (cl.armDelay > 0 || cl.triggered) continue;

      // Check enemies crossing tripwire
      if (allEnemies) {
        for (var ei = 0; ei < allEnemies.length; ei++) {
          var en = allEnemies[ei];
          if (!en || !en.mesh || en.hp <= 0) continue;
          if (_crossesTripwire(cl, en.mesh.position)) {
            cl.triggered = true;
            break;
          }
        }
      }

      if (cl.triggered) {
        _explode(cl);
        _claymores.splice(i, 1);
        _updateHUD();
      }
    }
  }

  // ── Public: reset ────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _claymores.length; i++) {
      var cl = _claymores[i];
      if (cl && cl.group && _scene) _scene.remove(cl.group);
    }
    _claymores = [];
    window._claymoreDirectionalCount = _MAX_PLACED;
    _updateHUD();
  }

  return {
    init: init,
    update: update,
    place: place,
    reset: reset,
  };
})();
