// shield-generator.js — Deployable energy barrier system
// Ctrl+G to deploy. Max 2 generators. Alt+G to overcharge nearest generator.
// Shield: 200 HP, 4x3 PlaneGeometry, cyan hex-textured barrier, one-way blocking.
// Generator: 80 HP, dark metallic box with antenna and emitter sphere.
// Overcharge: doubles shield HP (400), adds PointLight glow, lasts 8s.
// Shield recharges 5 HP/s after 15s of no damage. HUD shows "SHIELD [N]" count.
// Public API: init(scene, camera), update(dt), deploy(x, y, z), overcharge(), reset()

window.ShieldGenerator = (function () {
  'use strict';

  // ─── Private state ─────────────────────────────────────────────────────────

  var _scene = null;
  var _camera = null;
  var _generators = [];
  var _MAX_GENERATORS = 2;

  var _SHIELD_MAX_HP = 200;
  var _GEN_MAX_HP = 80;
  var _OVERCHARGE_HP = 400;
  var _OVERCHARGE_DURATION = 8;
  var _RECHARGE_DELAY = 15;
  var _RECHARGE_RATE = 5; // HP per second

  var _deployKeyDown = false;
  var _overchargeKeyDown = false;

  var _overlay = null;

  // Total elapsed time for animation
  var _totalTime = 0;

  // ─── Hex canvas texture ────────────────────────────────────────────────────

  function _createHexTexture() {
    var size = 256;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, size, size);

    // Draw hexagonal grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;

    var hexR = 22; // hex radius
    var w = hexR * 2;
    var h = Math.sqrt(3) * hexR;
    var cols = Math.ceil(size / (w * 0.75)) + 2;
    var rows = Math.ceil(size / h) + 2;
    var ci, ri, cx, cy, angle, ai, x, y;

    for (ri = -1; ri < rows; ri++) {
      for (ci = -1; ci < cols; ci++) {
        cx = ci * w * 0.75;
        cy = ri * h + (ci % 2 === 0 ? 0 : h * 0.5);
        ctx.beginPath();
        for (ai = 0; ai < 6; ai++) {
          angle = (Math.PI / 180) * (60 * ai - 30);
          x = cx + hexR * Math.cos(angle);
          y = cy + hexR * Math.sin(angle);
          if (ai === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Subtle inner glow on some hexes
    ctx.fillStyle = 'rgba(0, 200, 255, 0.06)';
    for (ri = -1; ri < rows; ri++) {
      for (ci = -1; ci < cols; ci++) {
        if ((ri + ci) % 3 === 0) {
          cx = ci * w * 0.75;
          cy = ri * h + (ci % 2 === 0 ? 0 : h * 0.5);
          ctx.beginPath();
          for (ai = 0; ai < 6; ai++) {
            angle = (Math.PI / 180) * (60 * ai - 30);
            x = cx + (hexR - 1) * Math.cos(angle);
            y = cy + (hexR - 1) * Math.sin(angle);
            if (ai === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  // ─── Mesh builders ─────────────────────────────────────────────────────────

  function _buildGeneratorMesh() {
    var group = new THREE.Group();

    // Base box — dark metallic
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), baseMat);
    base.position.y = 0.4;
    group.add(base);

    // Antenna — thin cylinder on top
    var antMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.5, 6), antMat);
    antenna.position.set(0.15, 1.05, 0);
    group.add(antenna);

    // Emitter port — small sphere at front center
    var emitMat = new THREE.MeshBasicMaterial({ color: 0x00ccff });
    var emitter = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), emitMat);
    emitter.position.set(0, 0.55, -0.22);
    group.add(emitter);

    // Accent stripe
    var stripeMat = new THREE.MeshLambertMaterial({ color: 0x0066aa });
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.42), stripeMat);
    stripe.position.y = 0.6;
    group.add(stripe);

    return { group: group, emitter: emitter };
  }

  function _buildShieldMesh() {
    var hexTex = _createHexTexture();
    var mat = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.45,
      map: hexTex,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var geo = new THREE.PlaneGeometry(4, 3);
    var mesh = new THREE.Mesh(geo, mat);
    return { mesh: mesh, mat: mat };
  }

  // ─── DOM overlay ───────────────────────────────────────────────────────────

  function _ensureOverlay() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'shield-generator-overlay';
    _overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:245;overflow:hidden';
    document.body.appendChild(_overlay);
  }

  function _worldToScreen(worldPos) {
    if (!_camera) return null;
    var v = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    v.project(_camera);
    if (v.z > 1) return null;
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  function _createGeneratorDOM(g) {
    _ensureOverlay();

    // HP bar wrapper
    var hpWrap = document.createElement('div');
    hpWrap.style.cssText = [
      'position:absolute',
      'transform:translate(-50%,0)',
      'width:64px',
      'height:5px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid #0088bb',
      'border-radius:2px',
      'overflow:hidden',
      'pointer-events:none'
    ].join(';');
    var hpFill = document.createElement('div');
    hpFill.style.cssText = 'width:100%;height:100%;background:#00ccff;border-radius:2px;transition:width 0.1s';
    hpWrap.appendChild(hpFill);
    _overlay.appendChild(hpWrap);

    // Shield HP bar wrapper
    var sHpWrap = document.createElement('div');
    sHpWrap.style.cssText = [
      'position:absolute',
      'transform:translate(-50%,0)',
      'width:64px',
      'height:5px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid #00aaff',
      'border-radius:2px',
      'overflow:hidden',
      'pointer-events:none'
    ].join(';');
    var sHpFill = document.createElement('div');
    sHpFill.style.cssText = 'width:100%;height:100%;background:#44ffff;border-radius:2px;transition:width 0.1s';
    sHpWrap.appendChild(sHpFill);
    _overlay.appendChild(sHpWrap);

    // Status label (RECHARGING, OVERCHARGE, etc.)
    var label = document.createElement('div');
    label.style.cssText = [
      'position:absolute',
      'transform:translate(-50%,-100%)',
      'color:#00ffff',
      'font-family:monospace',
      'font-size:9px',
      'font-weight:bold',
      'text-shadow:0 0 4px #00ffff',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    label.textContent = 'SHIELD';
    _overlay.appendChild(label);

    g.domHpWrap = hpWrap;
    g.domHpFill = hpFill;
    g.domSHpWrap = sHpWrap;
    g.domSHpFill = sHpFill;
    g.domLabel = label;
  }

  function _removeGeneratorDOM(g) {
    if (g.domHpWrap && g.domHpWrap.parentNode) g.domHpWrap.parentNode.removeChild(g.domHpWrap);
    if (g.domSHpWrap && g.domSHpWrap.parentNode) g.domSHpWrap.parentNode.removeChild(g.domSHpWrap);
    if (g.domLabel && g.domLabel.parentNode) g.domLabel.parentNode.removeChild(g.domLabel);
    g.domHpWrap = null;
    g.domHpFill = null;
    g.domSHpWrap = null;
    g.domSHpFill = null;
    g.domLabel = null;
  }

  function _updateHUD() {
    var count = _generators.length;
    try {
      if (window.HUD && window.HUD.showToast) {
        // No-op: HUD updated via individual toasts
      }
    } catch (e) {}
    // Update any persistent HUD element if present
    var shieldHud = document.getElementById('shield-gen-hud');
    if (!shieldHud) {
      shieldHud = document.createElement('div');
      shieldHud.id = 'shield-gen-hud';
      shieldHud.style.cssText = [
        'position:fixed',
        'top:12px',
        'right:200px',
        'color:#00ffff',
        'font-family:monospace',
        'font-size:13px',
        'font-weight:bold',
        'text-shadow:0 0 6px #00ffff',
        'pointer-events:none',
        'z-index:300'
      ].join(';');
      document.body.appendChild(shieldHud);
    }
    shieldHud.textContent = 'SHIELD [' + count + '/' + _MAX_GENERATORS + ']';
    shieldHud.style.display = count > 0 ? 'block' : 'none';
  }

  // ─── Toast helper ──────────────────────────────────────────────────────────

  function _toast(text, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(text, 2500, color || '#00ccff');
      }
    } catch (e) {}
  }

  // ─── Spark / particle effects ──────────────────────────────────────────────

  function _spawnSparks(pos, count, color) {
    if (!_scene) return;
    count = count || 5;
    color = color || 0x00ffff;
    var sparkMat = new THREE.MeshBasicMaterial({ color: color });
    var sparks = [];
    var si;
    for (si = 0; si < count; si++) {
      var sm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), sparkMat);
      sm.position.set(
        pos.x + (Math.random() - 0.5) * 0.3,
        pos.y + (Math.random() - 0.5) * 0.3,
        pos.z + (Math.random() - 0.5) * 0.3
      );
      _scene.add(sm);
      var angle = Math.random() * Math.PI * 2;
      var speed = 1.5 + Math.random() * 2;
      sparks.push({
        mesh: sm,
        vel: {
          x: Math.cos(angle) * speed * 0.5,
          y: 1 + Math.random() * 2,
          z: Math.sin(angle) * speed * 0.5
        },
        life: 0.3 + Math.random() * 0.3
      });
    }
    var lastT = null;
    function animateSparks(ts) {
      if (!lastT) lastT = ts;
      var dt = Math.min((ts - lastT) / 1000, 0.05);
      lastT = ts;
      var any = false;
      var ii;
      for (ii = 0; ii < sparks.length; ii++) {
        var sp = sparks[ii];
        if (!sp || sp.life <= 0) continue;
        sp.life -= dt;
        sp.vel.y -= 9.8 * dt;
        sp.mesh.position.x += sp.vel.x * dt;
        sp.mesh.position.y += sp.vel.y * dt;
        sp.mesh.position.z += sp.vel.z * dt;
        if (sp.life <= 0) {
          try { _scene.remove(sp.mesh); } catch (e) {}
          sparks[ii] = null;
        } else {
          any = true;
        }
      }
      if (any) requestAnimationFrame(animateSparks);
    }
    requestAnimationFrame(animateSparks);
  }

  function _shatterShield(g) {
    if (!_scene || !g.shieldMesh) return;
    var pos = g.shieldMesh.position.clone();

    // Bright flash
    var flash = new THREE.PointLight(0x00ffff, 15, 10);
    flash.position.copy(pos);
    _scene.add(flash);
    var fStart = null;
    function fadeFlash(ts) {
      if (!fStart) fStart = ts;
      var elapsed = (ts - fStart) / 300;
      if (elapsed < 1) {
        flash.intensity = 15 * (1 - elapsed);
        requestAnimationFrame(fadeFlash);
      } else {
        try { _scene.remove(flash); } catch (e) {}
      }
    }
    requestAnimationFrame(fadeFlash);

    // Debris particles
    _spawnSparks(pos, 8, 0x00ffff);

    // Animate shield scale to 0 over 0.2s
    var scaleStart = null;
    var mesh = g.shieldMesh;
    function shrinkShield(ts) {
      if (!scaleStart) scaleStart = ts;
      var t = Math.min((ts - scaleStart) / 200, 1);
      mesh.scale.set(1 - t, 1 - t, 1);
      if (t < 1) {
        requestAnimationFrame(shrinkShield);
      } else {
        try { _scene.remove(mesh); } catch (e) {}
        g.shieldMesh = null;
      }
    }
    requestAnimationFrame(shrinkShield);
  }

  // ─── Generator creation ────────────────────────────────────────────────────

  function _placeGenerator(wx, wy, wz) {
    if (!_scene || !_camera) return;

    // Remove oldest if at max
    if (_generators.length >= _MAX_GENERATORS) {
      var oldest = _generators[0];
      _destroyGenerator(oldest, true);
      _generators.splice(0, 1);
    }

    var genParts = _buildGeneratorMesh();
    genParts.group.position.set(wx, wy, wz);
    _scene.add(genParts.group);

    var shieldParts = _buildShieldMesh();
    var shieldMesh = shieldParts.mesh;
    var shieldMat = shieldParts.mat;

    // Place shield 2 units in front of generator (camera forward direction)
    var forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(_camera.quaternion);
    forward.y = 0;
    forward.normalize();

    shieldMesh.position.set(
      wx + forward.x * 2,
      wy + 1.5,
      wz + forward.z * 2
    );

    // Orient shield to face the same direction as camera (perpendicular to forward)
    var angle = Math.atan2(forward.x, forward.z);
    shieldMesh.rotation.y = angle;

    _scene.add(shieldMesh);

    // Shield normal = forward direction (faces toward enemy, away from player)
    var shieldNormal = forward.clone();

    var g = {
      group: genParts.group,
      emitter: genParts.emitter,
      shieldMesh: shieldMesh,
      shieldMat: shieldMat,
      shieldNormal: shieldNormal,
      genHp: _GEN_MAX_HP,
      shieldHp: _SHIELD_MAX_HP,
      shieldMaxHp: _SHIELD_MAX_HP,
      timeSinceDamage: 0,
      isRecharging: false,
      overcharged: false,
      overchargeTimer: 0,
      overchargeLight: null,
      domHpWrap: null,
      domHpFill: null,
      domSHpWrap: null,
      domSHpFill: null,
      domLabel: null,
      destroyed: false
    };

    _createGeneratorDOM(g);
    _generators.push(g);
    _updateHUD();

    _toast('SHIELD DEPLOYED (' + _generators.length + '/' + _MAX_GENERATORS + ')', '#00ccff');
    return g;
  }

  function _destroyGenerator(g, silent) {
    if (!g) return;
    g.destroyed = true;

    if (g.shieldMesh) {
      _shatterShield(g);
    }

    if (g.overchargeLight) {
      try { _scene.remove(g.overchargeLight); } catch (e) {}
      g.overchargeLight = null;
    }

    try { if (_scene) _scene.remove(g.group); } catch (e) {}
    _removeGeneratorDOM(g);

    if (!silent) {
      _toast('SHIELD GENERATOR DESTROYED!', '#ff4444');
    }
  }

  // ─── Bullet blocking ───────────────────────────────────────────────────────

  function _checkBulletBlocking(g) {
    if (!g.shieldMesh || g.shieldHp <= 0) return;

    var projectiles = window._activeProjectiles || [];
    var sp = g.shieldMesh.position;
    var norm = g.shieldNormal;
    var pi;

    for (pi = 0; pi < projectiles.length; pi++) {
      var proj = projectiles[pi];
      if (!proj || proj.dead) continue;

      // Skip player bullets — allow them to pass through from behind
      // Check dot product of bullet velocity vs shield normal
      if (proj.velocity || proj.vel || proj.dir) {
        var bulletDir = proj.velocity || proj.vel || proj.dir;
        var dot = 0;
        if (bulletDir.x !== undefined) {
          var bLen = Math.sqrt(bulletDir.x * bulletDir.x + bulletDir.y * bulletDir.y + bulletDir.z * bulletDir.z);
          if (bLen > 0) {
            dot = (bulletDir.x * norm.x + bulletDir.y * norm.y + bulletDir.z * norm.z) / bLen;
          }
        }
        // If bullet travels in same direction as normal (from enemy side), block it
        // If dot < 0, bullet comes from the player's side (player bullet) — pass through
        if (dot < 0) continue; // player shooting out through back — allow
      }

      var bx = proj.position ? proj.position.x : (proj.mesh ? proj.mesh.position.x : null);
      var by = proj.position ? proj.position.y : (proj.mesh ? proj.mesh.position.y : null);
      var bz = proj.position ? proj.position.z : (proj.mesh ? proj.mesh.position.z : null);

      if (bx === null) continue;

      var dx = bx - sp.x;
      var dy = by - sp.y;
      var dz = bz - sp.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 0.5) {
        // Hit! Kill projectile and deal damage
        proj.dead = true;
        if (proj.mesh) {
          try { _scene.remove(proj.mesh); } catch (e) {}
        }

        _spawnSparks(sp, 5, 0x00ffff);
        g.shieldHp -= 20;
        g.timeSinceDamage = 0;
        g.isRecharging = false;

        if (g.shieldHp <= 0) {
          g.shieldHp = 0;
          _shatterShield(g);
          _toast('SHIELD SHATTERED!', '#ff4444');
        }
      }
    }

    // Also check _lastBulletPos
    var lbp = window._lastBulletPos;
    if (lbp) {
      var lbdx = lbp.x - sp.x;
      var lbdy = lbp.y - sp.y;
      var lbdz = lbp.z - sp.z;
      var lbDist = Math.sqrt(lbdx * lbdx + lbdy * lbdy + lbdz * lbdz);
      if (lbDist < 0.5 && !window._lastBulletBlocked) {
        window._lastBulletBlocked = true;
        _spawnSparks(sp, 5, 0x00ffff);
        g.shieldHp -= 20;
        g.timeSinceDamage = 0;
        g.isRecharging = false;
        if (g.shieldHp <= 0) {
          g.shieldHp = 0;
          _shatterShield(g);
          _toast('SHIELD SHATTERED!', '#ff4444');
        }
      }
    }
  }

  // ─── Overcharge ────────────────────────────────────────────────────────────

  function overcharge() {
    if (!_scene || !_camera || _generators.length === 0) {
      _toast('No generator deployed!', '#ff8888');
      return;
    }

    // Find nearest generator within 5 units
    var nearest = null;
    var nearDist = 5;
    var cp = _camera.position;
    var gi;
    for (gi = 0; gi < _generators.length; gi++) {
      var gen = _generators[gi];
      if (!gen || gen.destroyed || gen.overcharged) continue;
      var dx = gen.group.position.x - cp.x;
      var dz = gen.group.position.z - cp.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearDist) {
        nearDist = dist;
        nearest = gen;
      }
    }

    if (!nearest) {
      _toast('No generator in range for overcharge!', '#ff8888');
      return;
    }

    nearest.overcharged = true;
    nearest.overchargeTimer = _OVERCHARGE_DURATION;
    nearest.shieldMaxHp = _OVERCHARGE_HP;
    nearest.shieldHp = Math.min(nearest.shieldHp * 2, _OVERCHARGE_HP);

    // Add glow light at generator
    var glow = new THREE.PointLight(0x00ffff, 3, 8);
    glow.position.copy(nearest.group.position);
    glow.position.y += 0.8;
    _scene.add(glow);
    nearest.overchargeLight = glow;

    // Tint emitter brighter
    if (nearest.emitter) {
      nearest.emitter.material.color.setHex(0xffffff);
    }

    _toast('OVERCHARGE ACTIVE — 8s!', '#ffffff');
  }

  // ─── Public: deploy ────────────────────────────────────────────────────────

  function deploy(wx, wy, wz) {
    if (!_scene || !_camera) return;

    if (wx === undefined) {
      wx = _camera.position.x;
      wy = 0;
      wz = _camera.position.z;
      try {
        if (window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
          wy = window.VoxelWorld.getTerrainHeight(wx, wz) || 0;
        }
      } catch (e) {}
    }

    _placeGenerator(wx, wy, wz);
  }

  // ─── Public: update(dt) ───────────────────────────────────────────────────

  function update(dt) {
    if (!_scene || !_camera) return;

    var safeDt = Math.min(dt, 0.1);
    _totalTime += safeDt;

    var gi;
    for (gi = _generators.length - 1; gi >= 0; gi--) {
      var g = _generators[gi];
      if (!g || g.destroyed) {
        _generators.splice(gi, 1);
        _updateHUD();
        continue;
      }

      // ── Generator HP check ─────────────────────────────────────────────
      if (g.genHp <= 0) {
        _destroyGenerator(g, false);
        _generators.splice(gi, 1);
        _updateHUD();
        continue;
      }

      // ── Bullet blocking ────────────────────────────────────────────────
      _checkBulletBlocking(g);

      // ── Recharge logic ─────────────────────────────────────────────────
      if (g.shieldHp > 0 && g.shieldHp < g.shieldMaxHp) {
        g.timeSinceDamage += safeDt;
        if (g.timeSinceDamage >= _RECHARGE_DELAY) {
          g.isRecharging = true;
          g.shieldHp = Math.min(g.shieldHp + _RECHARGE_RATE * safeDt, g.shieldMaxHp);
        }
      } else {
        if (g.shieldHp >= g.shieldMaxHp) {
          g.isRecharging = false;
        }
      }

      // ── Overcharge countdown ───────────────────────────────────────────
      if (g.overcharged) {
        g.overchargeTimer -= safeDt;
        if (g.overchargeTimer <= 0) {
          g.overcharged = false;
          g.shieldMaxHp = _SHIELD_MAX_HP;
          g.shieldHp = Math.min(g.shieldHp, _SHIELD_MAX_HP);
          g.overchargeTimer = 0;
          if (g.overchargeLight) {
            try { _scene.remove(g.overchargeLight); } catch (e) {}
            g.overchargeLight = null;
          }
          if (g.emitter) {
            g.emitter.material.color.setHex(0x00ccff);
          }
          _toast('Overcharge expired', '#888888');
        } else {
          // Pulse the overcharge light
          if (g.overchargeLight) {
            g.overchargeLight.intensity = 2.5 + Math.sin(_totalTime * 5) * 0.5;
          }
        }
      }

      // ── Shield energy pulse animation ──────────────────────────────────
      if (g.shieldMesh && g.shieldHp > 0) {
        // Oscillate scale X ±3%
        var scaleX = 1 + Math.sin(_totalTime * 2.5) * 0.03;
        g.shieldMesh.scale.set(scaleX, 1, 1);

        // Oscillate opacity between 0.35 and 0.55
        var opacity = 0.45 + Math.sin(_totalTime * 1.8) * 0.10;
        g.shieldMat.opacity = opacity;

        // Bright tint during overcharge
        if (g.overcharged) {
          g.shieldMat.color.setHex(0x88ffff);
        } else {
          g.shieldMat.color.setHex(0x00ccff);
        }
      }

      // ── Update DOM labels ──────────────────────────────────────────────
      var labelWorldPos = new THREE.Vector3(
        g.group.position.x,
        g.group.position.y + 1.4,
        g.group.position.z
      );
      var screen = _worldToScreen(labelWorldPos);

      if (screen) {
        // Shield HP bar
        if (g.domSHpWrap) {
          g.domSHpWrap.style.left = screen.x + 'px';
          g.domSHpWrap.style.top = (screen.y + 8) + 'px';
          g.domSHpWrap.style.display = 'block';
        }
        if (g.domSHpFill) {
          var sPct = Math.max(0, (g.shieldHp / g.shieldMaxHp) * 100);
          g.domSHpFill.style.width = sPct + '%';
          g.domSHpFill.style.background = g.overcharged ? '#ffffff' : (sPct > 50 ? '#44ffff' : '#ff8800');
        }

        // Generator HP bar
        if (g.domHpWrap) {
          g.domHpWrap.style.left = screen.x + 'px';
          g.domHpWrap.style.top = (screen.y + 16) + 'px';
          g.domHpWrap.style.display = 'block';
        }
        if (g.domHpFill) {
          var gPct = Math.max(0, (g.genHp / _GEN_MAX_HP) * 100);
          g.domHpFill.style.width = gPct + '%';
          g.domHpFill.style.background = gPct > 50 ? '#44ff44' : '#ff3333';
        }

        // Status label
        if (g.domLabel) {
          g.domLabel.style.left = screen.x + 'px';
          g.domLabel.style.top = screen.y + 'px';
          g.domLabel.style.display = 'block';
          if (g.overcharged) {
            g.domLabel.textContent = 'OVERCHARGE ' + Math.ceil(g.overchargeTimer) + 's';
            g.domLabel.style.color = '#ffffff';
          } else if (g.isRecharging) {
            g.domLabel.textContent = 'RECHARGING';
            g.domLabel.style.color = '#44ffff';
          } else if (g.shieldHp <= 0) {
            g.domLabel.textContent = 'SHIELD DOWN';
            g.domLabel.style.color = '#ff4444';
          } else {
            g.domLabel.textContent = 'SHIELD ACTIVE';
            g.domLabel.style.color = '#00ffff';
          }
        }
      } else {
        if (g.domSHpWrap) g.domSHpWrap.style.display = 'none';
        if (g.domHpWrap) g.domHpWrap.style.display = 'none';
        if (g.domLabel) g.domLabel.style.display = 'none';
      }
    }
  }

  // ─── Public: reset ────────────────────────────────────────────────────────

  function reset() {
    var gi;
    for (gi = 0; gi < _generators.length; gi++) {
      _destroyGenerator(_generators[gi], true);
    }
    _generators = [];
    _totalTime = 0;
    _deployKeyDown = false;
    _overchargeKeyDown = false;
    _updateHUD();
  }

  // ─── Public: init ─────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _generators = [];
    _totalTime = 0;
    _deployKeyDown = false;
    _overchargeKeyDown = false;

    _ensureOverlay();
    _updateHUD();

    // Ctrl+G — deploy shield generator
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyG' && e.ctrlKey && !e.altKey) {
        if (_deployKeyDown) return;
        _deployKeyDown = true;
        e.preventDefault();
        deploy();
        return;
      }
      if (e.code === 'KeyG' && e.altKey && !e.ctrlKey) {
        if (_overchargeKeyDown) return;
        _overchargeKeyDown = true;
        e.preventDefault();
        overcharge();
        return;
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyG') {
        _deployKeyDown = false;
        _overchargeKeyDown = false;
      }
    });
  }

  // ─── Expose public API ────────────────────────────────────────────────────

  return {
    init: init,
    update: update,
    deploy: deploy,
    overcharge: overcharge,
    reset: reset
  };
})();
