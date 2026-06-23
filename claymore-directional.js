/* ─────────────────────────────────────────────────────────────────────────────
   CLAYMORE DIRECTIONAL — directional blast-cone claymore mine system
   Ctrl+C   → place directional claymore at player feet (max 4)
   C        → remote detonate all claymores (0.5s delay + beep)
   Tripwire → 3 m wire extending forward, auto-detonates on enemy crossing
   Pressure → enemy within 0.4 m of body auto-detonates
   Back-blast zone: 2 m behind → 40 dmg enemies, 60 dmg player
   Damage cone: 90° arc, 12 m range, 180 dmg
   Arming delay: 2 s (green LED blink → solid red when armed)
   Particle blast: 200 orange/red box particles, 0-20 m/s, 0.8 s fade
   ───────────────────────────────────────────────────────────────────────────── */
window.ClaymoreDirectional = (function () {
  'use strict';

  var _scene     = null;
  var _onHit     = null;       // callback(pos, isPlayer)
  var _claymores = [];         // active placed claymores
  var _MAX_PLACED = 4;
  var _time       = 0;
  var _keysRegistered = false;

  // Remote detonation state
  var _remotePending  = false;
  var _remoteTimer    = 0;
  var REMOTE_DELAY    = 0.5;   // seconds

  // ── Canvas texture: "FRONT TOWARD ENEMY" label ───────────────────────────
  function _makeLabelTexture() {
    var canvas = document.createElement('canvas');
    canvas.width  = 256;
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
    return new THREE.CanvasTexture(canvas);
  }

  // ── Mine mesh construction ────────────────────────────────────────────────
  function _buildMesh(dir) {
    var group = new THREE.Group();

    // Body — 0.4 × 0.2 × 0.1, olive-drab green, per spec
    var bodyGeo  = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    var labelTex = _makeLabelTexture();
    var materials = [
      new THREE.MeshLambertMaterial({ color: 0x4b5320 }),   // right
      new THREE.MeshLambertMaterial({ color: 0x4b5320 }),   // left
      new THREE.MeshLambertMaterial({ color: 0x4b5320 }),   // top
      new THREE.MeshLambertMaterial({ color: 0x4b5320 }),   // bottom
      new THREE.MeshLambertMaterial({ map: labelTex }),      // front (+Z)
      new THREE.MeshLambertMaterial({ color: 0x2a3514 }),   // back
    ];
    var body = new THREE.Mesh(bodyGeo, materials);
    body.position.y = 0.15;
    group.add(body);

    // Two CylinderGeometry spike-legs
    var legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 5);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.10, 0.06, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set( 0.10, 0.06, 0);
    group.add(legR);

    // LED indicator — small panel on front face (green while safe, red when armed)
    var ledPanelGeo = new THREE.BoxGeometry(0.04, 0.04, 0.01);
    var ledPanelMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
    });
    var ledPanel = new THREE.Mesh(ledPanelGeo, ledPanelMat);
    ledPanel.position.set(0.14, 0.17, 0.055);
    group.add(ledPanel);

    // PointLight behind the LED
    var ledLight = new THREE.PointLight(0x00ff00, 0.6, 1.5);
    ledLight.position.copy(ledPanel.position);
    group.add(ledLight);

    // Tripwire — thin cylinder rotated to extend in local +Z (forward 3 m)
    var wireGeo = new THREE.CylinderGeometry(0.008, 0.008, 3, 6);
    var wireMat = new THREE.MeshLambertMaterial({
      color: 0xbbbbbb,
      transparent: true,
      opacity: 0.55,
    });
    var wire = new THREE.Mesh(wireGeo, wireMat);
    wire.rotation.x = Math.PI / 2;
    wire.position.set(0, 0.15, 1.5);   // extends 3 m forward from body
    group.add(wire);

    // Orient group to face in dir direction (XZ plane)
    var angle = Math.atan2(dir.x, dir.z);
    group.rotation.y = angle;

    return {
      group:    group,
      ledPanel: ledPanel,
      ledMat:   ledPanelMat,
      ledLight: ledLight,
    };
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _updateHUD() {
    var el = document.getElementById('claymoreDirectionalHUD');
    if (!el) return;
    var placed     = _claymores.length;
    var remaining  = _MAX_PLACED - placed;
    el.textContent = 'CLAYMORE [' + remaining + '] — [C] REMOTE DET';
    window._claymoreDirectionalCount = remaining;
  }

  function _ensureHUD() {
    if (document.getElementById('claymoreDirectionalHUD')) return;
    var el = document.createElement('div');
    el.id = 'claymoreDirectionalHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'left:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#d4c060',
      'text-shadow:0 0 4px #443800',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 10px',
      'border-radius:4px',
      'border:1px solid #665500',
      'z-index:1000',
      'pointer-events:none',
      'user-select:none',
      'letter-spacing:1px',
    ].join(';');
    document.body.appendChild(el);
    _updateHUD();
  }

  // ── Cone / geometry helpers ───────────────────────────────────────────────
  // Returns true if testPos is within the forward blast cone
  function _inCone(claymore, testPos, range, arcHalfRad) {
    var dx = testPos.x - claymore.pos.x;
    var dz = testPos.z - claymore.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > range) return false;
    // dot product check: cos(angle) vs cos(arcHalfRad)
    var toNormX = dx / (dist || 0.001);
    var toNormZ = dz / (dist || 0.001);
    var dot = claymore.dir.x * toNormX + claymore.dir.z * toNormZ;
    return dot >= Math.cos(arcHalfRad);
  }

  // Returns true if testPos is within back-blast zone (2 m behind)
  function _inBackBlast(claymore, testPos) {
    var dx = testPos.x - claymore.pos.x;
    var dz = testPos.z - claymore.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 2.0) return false;
    // Reverse cone: dot against -dir
    var toNormX = dx / (dist || 0.001);
    var toNormZ = dz / (dist || 0.001);
    var dot = (-claymore.dir.x) * toNormX + (-claymore.dir.z) * toNormZ;
    return dot >= Math.cos(Math.PI / 4); // 90° back-blast arc
  }

  // Tripwire: 3 m extending in claymore's forward direction
  function _crossesTripwire(claymore, testPos) {
    var dx = testPos.x - claymore.pos.x;
    var dz = testPos.z - claymore.pos.z;
    var fwdX = claymore.dir.x;
    var fwdZ = claymore.dir.z;
    var along = dx * fwdX + dz * fwdZ;
    if (along < 0 || along > 3.0) return false;
    var perpX = dx - along * fwdX;
    var perpZ = dz - along * fwdZ;
    var perp = Math.sqrt(perpX * perpX + perpZ * perpZ);
    return perp <= 0.35;
  }

  // Pressure plate: enemy within 0.4 m of claymore body
  function _onPressurePlate(claymore, testPos) {
    var dx = testPos.x - claymore.pos.x;
    var dz = testPos.z - claymore.pos.z;
    return (dx * dx + dz * dz) <= 0.16; // 0.4^2
  }

  // ── Particle blast — 200 orange/red box particles in cone ─────────────────
  function _spawnParticles(pos, dir) {
    if (!_scene) return;
    var GEO  = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    var blastAngle = Math.atan2(dir.x, dir.z);
    var CONE_HALF  = Math.PI / 4; // 45° each side = 90° total
    var particles  = [];
    var COUNT      = 200;

    for (var i = 0; i < COUNT; i++) {
      var mat = new THREE.MeshBasicMaterial({
        color: (Math.random() < 0.5) ? 0xff5500 : 0xff1100,
        transparent: true,
        opacity: 1.0,
      });
      var mesh = new THREE.Mesh(GEO, mat);
      mesh.position.set(pos.x, pos.y + 0.3, pos.z);
      _scene.add(mesh);

      var spread = (Math.random() - 0.5) * 2 * CONE_HALF;
      var a      = blastAngle + spread;
      var vertEl = (Math.random() - 0.2) * 0.6; // slight upward bias
      var speed  = Math.random() * 20;           // 0-20 m/s
      particles.push({
        mesh: mesh,
        mat:  mat,
        vx:   Math.sin(a) * speed,
        vy:   vertEl * speed * 0.5 + 2,
        vz:   Math.cos(a) * speed,
        life: 0.8,
        age:  0,
      });
    }

    var lastTs = null;
    function animateParticles(ts) {
      if (!lastTs) { lastTs = ts; }
      var dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      var any = false;
      for (var pi = 0; pi < particles.length; pi++) {
        var p = particles[pi];
        if (!p) continue;
        p.age += dt;
        if (p.age >= p.life) {
          _scene.remove(p.mesh);
          p.mat.dispose();
          particles[pi] = null;
          continue;
        }
        p.vy -= 9.8 * dt; // gravity
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        if (p.mesh.position.y < 0.02) {
          p.mesh.position.y = 0.02;
          p.vy *= -0.15;
        }
        p.mat.opacity = 1.0 - (p.age / p.life); // fade over 0.8 s
        any = true;
      }
      if (any) {
        requestAnimationFrame(animateParticles);
      } else {
        GEO.dispose();
      }
    }
    requestAnimationFrame(animateParticles);
  }

  // ── Flash / scorch VFX ───────────────────────────────────────────────────
  function _vfxExplode(pos, dir) {
    if (!_scene) return;

    // Orange-white flash
    var flash = new THREE.PointLight(0xffaa33, 12, 14);
    flash.position.set(pos.x, pos.y + 0.3, pos.z);
    _scene.add(flash);
    var flashCore = new THREE.PointLight(0xffffff, 7, 6);
    flashCore.position.copy(flash.position);
    _scene.add(flashCore);

    var flashStart = null;
    function fadeFlash(ts) {
      if (!flashStart) flashStart = ts;
      var t = (ts - flashStart) / 380;
      if (t < 1) {
        flash.intensity     = 12 * (1 - t);
        flashCore.intensity = 7  * (1 - t);
        requestAnimationFrame(fadeFlash);
      } else {
        if (_scene) {
          _scene.remove(flash);
          _scene.remove(flashCore);
        }
      }
    }
    requestAnimationFrame(fadeFlash);

    // Ground scorch disc
    var scorchGeo = new THREE.CircleGeometry(1.5, 12);
    var scorchMat = new THREE.MeshLambertMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.75,
    });
    var scorch = new THREE.Mesh(scorchGeo, scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(pos.x, 0.01, pos.z);
    _scene.add(scorch);
    var scorchStart = null;
    function fadeScorch(ts) {
      if (!scorchStart) scorchStart = ts;
      var t = (ts - scorchStart) / 9000;
      if (t < 1) {
        scorchMat.opacity = 0.75 * (1 - t);
        requestAnimationFrame(fadeScorch);
      } else {
        if (_scene) _scene.remove(scorch);
        scorchGeo.dispose();
        scorchMat.dispose();
      }
    }
    requestAnimationFrame(fadeScorch);

    _spawnParticles(pos, dir);
  }

  // ── Audio SFX — explosion + beep ─────────────────────────────────────────
  function _playExplosionSFX() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      // Directional thump
      var osc1  = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(85, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(16, ctx.currentTime + 0.4);
      gain1.gain.setValueAtTime(2.0, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);

      // Metallic crack overlay
      var osc2  = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1400, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.14);
      gain2.gain.setValueAtTime(0.6, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.14);
    } catch (e) {}
  }

  function _playBeepSFX() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.setValueAtTime(0.0, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  // ── Blast damage ──────────────────────────────────────────────────────────
  function _applyDamage(claymore) {
    var pos     = claymore.pos;
    var dir     = claymore.dir;
    var RANGE   = 12;
    var ARC     = Math.PI * 45 / 180;  // ±45° = 90° total
    var DMG     = 180;
    var BACK_DMG_ENEMY  = 40;
    var BACK_DMG_PLAYER = 60;

    // Enemies in forward cone
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      var enemies = Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        if (_inCone(claymore, en.mesh.position, RANGE, ARC)) {
          if (Enemies.damage) Enemies.damage(en, DMG);
        } else if (_inBackBlast(claymore, en.mesh.position)) {
          if (Enemies.damage) Enemies.damage(en, BACK_DMG_ENEMY);
        }
      }
    }

    // Player damage
    var pPos = (typeof player !== 'undefined' && player && player.position)
      ? player.position : null;
    if (pPos && _onHit) {
      if (_inCone(claymore, pPos, RANGE, ARC)) {
        _onHit(pos, true); // full cone hit
      } else if (_inBackBlast(claymore, pPos)) {
        // Back-blast: pass as a weaker hit (caller handles damage externally)
        // Signal as player-hit with back-blast flag via a global
        if (typeof window._lastExplosionDmg !== 'undefined') {
          window._lastExplosionDmg = BACK_DMG_PLAYER;
        }
        _onHit(pos, true);
      }
    }
  }

  // ── Explode one claymore ──────────────────────────────────────────────────
  function _explode(claymore) {
    if (claymore.exploded) return;
    claymore.exploded = true;

    if (_scene && claymore.group) {
      _scene.remove(claymore.group);
    }

    _vfxExplode(claymore.pos, claymore.dir);
    _playExplosionSFX();
    _applyDamage(claymore);

    if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) {
      AudioSystem.playExplosion();
    }
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast('CLAYMORE — DETONATED');
    }
  }

  // ── Public: detonateAll (remote det, 0.5 s delay) ────────────────────────
  function detonateAll() {
    if (_claymores.length === 0) return;
    if (_remotePending) return;
    _remotePending = true;
    _remoteTimer   = REMOTE_DELAY;
    _playBeepSFX();
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast('REMOTE DET — FIRING...');
    }
  }

  // ── Public: place ─────────────────────────────────────────────────────────
  function place(playerPos, playerDir) {
    if (!_scene) return;
    if (_claymores.length >= _MAX_PLACED) {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast('Max claymores placed (' + _MAX_PLACED + ')');
      }
      return;
    }

    var groundY = (playerPos.y - 1.5 < 0) ? 0 : playerPos.y - 1.5;
    var pos = new THREE.Vector3(playerPos.x, groundY, playerPos.z);

    var dir = playerDir ? playerDir.clone() : new THREE.Vector3(0, 0, -1);
    dir.y = 0;
    if (dir.length() < 0.001) dir.set(0, 0, -1);
    dir.normalize();

    var built = _buildMesh(dir);
    built.group.position.copy(pos);
    _scene.add(built.group);

    var claymore = {
      group:    built.group,
      ledPanel: built.ledPanel,
      ledMat:   built.ledMat,
      ledLight: built.ledLight,
      pos:      pos,
      dir:      dir,
      exploded: false,
      triggered: false,
      armDelay: 2.0,        // 2 s arming delay
      ledTimer: 0,
      ledOn:    false,
    };

    _claymores.push(claymore);
    _updateHUD();

    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast('Claymore placed — arming...');
    }
  }

  // ── Key registration ──────────────────────────────────────────────────────
  function _tryPlace() {
    if (!_scene) return;
    var pPos = (typeof player !== 'undefined' && player && player.position)
      ? player.position : null;
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
  }

  function _registerKeys() {
    if (_keysRegistered) return;
    _keysRegistered = true;

    document.addEventListener('keydown', function (e) {
      // Ctrl+C — place claymore
      if (e.code === 'KeyC' && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        _tryPlace();
        return;
      }
      // C (bare) — remote detonate
      if (e.code === 'KeyC' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        detonateAll();
      }
    });
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, onHitCb) {
    _scene  = scene;
    _onHit  = onHitCb || null;
    _claymores = [];
    _time   = 0;
    _remotePending = false;
    _remoteTimer   = 0;
    window._claymoreDirectionalCount = _MAX_PLACED;
    _ensureHUD();
    _updateHUD();
    _registerKeys();
  }

  // ── Public: update ────────────────────────────────────────────────────────
  function update(delta, playerPos, allEnemies) {
    _time += delta;

    // Remote detonation countdown
    if (_remotePending) {
      _remoteTimer -= delta;
      if (_remoteTimer <= 0) {
        _remotePending = false;
        // Explode all armed claymores
        for (var ri = _claymores.length - 1; ri >= 0; ri--) {
          var rcl = _claymores[ri];
          if (!rcl || rcl.exploded) continue;
          if (rcl.armDelay <= 0) {
            _explode(rcl);
          }
        }
        // Clean up exploded
        for (var rci = _claymores.length - 1; rci >= 0; rci--) {
          if (!_claymores[rci] || _claymores[rci].exploded) {
            _claymores.splice(rci, 1);
          }
        }
        _updateHUD();
      }
    }

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
        if (cl.armDelay <= 0) {
          // Finished arming → switch to red LED
          if (cl.ledMat) {
            cl.ledMat.color.setHex(0xff2200);
          }
          if (cl.ledLight) {
            cl.ledLight.color.setHex(0xff2200);
          }
        }
      }

      // LED blink
      // Green fast blink while arming (2 s), red 1 Hz blink when armed
      var blinkPeriod = cl.armDelay > 0 ? 0.25 : 1.0;
      cl.ledTimer += delta;
      if (cl.ledTimer >= blinkPeriod) {
        cl.ledTimer -= blinkPeriod;
        cl.ledOn = !cl.ledOn;
        if (cl.ledLight) {
          cl.ledLight.intensity = cl.ledOn ? 0.6 : 0;
        }
        if (cl.ledMat) {
          // Toggle emissive brightness via opacity trick; use color manipulation
          var brightness = cl.ledOn ? 1.0 : 0.05;
          if (cl.armDelay > 0) {
            cl.ledMat.color.setHex(cl.ledOn ? 0x00ff00 : 0x003300);
          } else {
            cl.ledMat.color.setHex(cl.ledOn ? 0xff2200 : 0x330000);
          }
        }
      }

      // Skip trigger checks until armed
      if (cl.armDelay > 0 || cl.triggered) continue;

      // Resolve enemy list
      var enemies = allEnemies;
      if (!enemies && typeof Enemies !== 'undefined' && Enemies.getAll) {
        enemies = Enemies.getAll();
      }

      if (enemies) {
        for (var ei = 0; ei < enemies.length; ei++) {
          var en = enemies[ei];
          if (!en || !en.mesh || en.hp <= 0) continue;
          var ePos = en.mesh.position;

          // Wire trigger
          if (_crossesTripwire(cl, ePos)) {
            cl.triggered = true;
            break;
          }
          // Pressure plate trigger
          if (_onPressurePlate(cl, ePos)) {
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

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _claymores.length; i++) {
      var cl = _claymores[i];
      if (cl && cl.group && _scene) _scene.remove(cl.group);
    }
    _claymores     = [];
    _remotePending = false;
    _remoteTimer   = 0;
    window._claymoreDirectionalCount = _MAX_PLACED;
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:        init,
    update:      update,
    place:       place,
    detonateAll: detonateAll,
    reset:       reset,
  };
})();
