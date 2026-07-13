// ============================================================
//  ballistic-shield.js — Deployable ballistic shield (H key)
//  Player can place a protective shield for cover.
//  Public API: init, update, deploy, pickup, isDeployed, clear, reset, getHealth
// ============================================================
window.BallisticShield = (function () {
  'use strict';

  /* ── Private state ─────────────────────────────────────────── */
  var _scene      = null;
  var _camera     = null;
  var _group      = null;        // THREE.Group — the whole shield assembly
  var _deployed   = false;
  var _hp         = 200;
  var MAX_HP      = 200;
  var _shattered  = false;

  /* Deploy animation */
  var _rising     = false;
  var _riseTimer  = 0;
  var RISE_TIME   = 0.3;
  var _targetY    = 0;           // final Y after rise

  /* Impact decals */
  var _decals     = [];          // meshes added to _group on bullet hits
  var MAX_DECALS  = 5;

  /* Spark particles */
  var _sparks     = [];          // { mesh, vel, life }

  /* Shard particles on shatter */
  var _shards     = [];          // { mesh, vel, spin, life }

  /* ── DOM elements ──────────────────────────────────────────── */
  var _hpBar      = null;
  var _hpFill     = null;
  var _statusHUD  = null;

  /* ── Build the shield mesh ─────────────────────────────────── */
  function _buildShield() {
    var g = new THREE.Group();

    /* Main panel */
    var panelMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a2a, metalness: 0.6, roughness: 0.4
    });
    var panel = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.08),
      panelMat
    );
    panel.castShadow = true;
    panel.receiveShadow = true;
    g.add(panel);

    /* Viewport window */
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x88aadd, transparent: true, opacity: 0.5,
      metalness: 0.1, roughness: 0.1
    });
    var glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.35, 0.02),
      glassMat
    );
    glass.position.set(0, 0.4, 0.05);
    g.add(glass);

    /* Support legs (like a display easel) — 2 legs at bottom, angled outward */
    var legMat = new THREE.MeshStandardMaterial({ color: 0x1a2a1a, metalness: 0.5, roughness: 0.6 });
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.3), legMat);
    leg1.position.set(-0.45, -0.85, 0.1);
    leg1.rotation.x = 0.35;
    g.add(leg1);

    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.3), legMat);
    leg2.position.set(0.45, -0.85, 0.1);
    leg2.rotation.x = 0.35;
    g.add(leg2);

    return g;
  }

  /* ── DOM setup ─────────────────────────────────────────────── */
  function _ensureDOM() {
    /* HP bar floating above shield */
    if (!_hpBar) {
      _hpBar = document.createElement('div');
      _hpBar.id = 'shieldHPBar';
      _hpBar.style.cssText = [
        'position:fixed',
        'width:70px',
        'height:8px',
        'background:#333',
        'border:1px solid #888',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'display:none',
        'overflow:hidden'
      ].join(';');

      _hpFill = document.createElement('div');
      _hpFill.style.cssText = 'height:100%;width:100%;background:#44ff44;border-radius:3px;transition:width 0.1s';
      _hpBar.appendChild(_hpFill);
      document.body.appendChild(_hpBar);
    }

    /* Status HUD bottom-right */
    if (!_statusHUD) {
      _statusHUD = document.createElement('div');
      _statusHUD.id = 'shieldStatusHUD';
      _statusHUD.style.cssText = [
        'position:fixed',
        'bottom:14px',
        'right:14px',
        'color:#88ffaa',
        'font-family:monospace',
        'font-size:13px',
        'font-weight:bold',
        'pointer-events:none',
        'z-index:9998',
        'text-shadow:0 0 6px #000,1px 1px 2px #000'
      ].join(';');
      document.body.appendChild(_statusHUD);
    }

    _updateHUD();
  }

  /* ── HUD update ────────────────────────────────────────────── */
  function _updateHUD() {
    if (_statusHUD) {
      if (_deployed && !_shattered) {
        _statusHUD.textContent = '🛡 SHIELD: ' + _hp + '/' + MAX_HP;
      } else {
        _statusHUD.textContent = '🛡 SHIELD: PACKED';
      }
    }
  }

  /* Project shield world-pos to screen and update floating HP bar */
  function _updateHPBar() {
    if (!_hpBar || !_group || !_camera || !_deployed || _shattered) {
      if (_hpBar) _hpBar.style.display = 'none';
      return;
    }
    /* Project the top of the shield to screen coords */
    var worldPos = new THREE.Vector3();
    _group.getWorldPosition(worldPos);
    worldPos.y += 1.1; // above shield

    var ndc = worldPos.clone().project(_camera);
    if (ndc.z > 1) {
      _hpBar.style.display = 'none'; // behind camera
      return;
    }
    var sx = ((ndc.x + 1) / 2) * window.innerWidth  - 35;
    var sy = ((1 - ndc.y) / 2) * window.innerHeight - 14;

    _hpBar.style.left   = sx + 'px';
    _hpBar.style.top    = sy + 'px';
    _hpBar.style.display = 'block';

    var pct = Math.max(0, _hp / MAX_HP);
    _hpFill.style.width = (pct * 100) + '%';
    var barColor = pct > 0.6 ? '#44ff44' : (pct > 0.3 ? '#ffcc00' : '#ff4444');
    _hpFill.style.background = barColor;
  }

  /* ── Spark effect at hit point ─────────────────────────────── */
  function _spawnSparks(hitPoint) {
    if (!_scene) return;
    var count = 3 + Math.floor(Math.random() * 2); // 3-4
    for (var i = 0; i < count; i++) {
      var smat = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.5 ? 0xffffff : 0xffee44
      });
      var smesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), smat);
      smesh.position.copy(hitPoint);
      _scene.add(smesh);
      _sparks.push({
        mesh: smesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3,
          (Math.random() - 0.5) * 4
        ),
        life: 0.25 + Math.random() * 0.2
      });
    }
  }

  /* ── Decal (impact mark) on shield surface ─────────────────── */
  function _addImpactDecal(hitPoint) {
    if (!_group) return;
    if (_decals.length >= MAX_DECALS) {
      var old = _decals.shift();
      _group.remove(old);
    }
    var dmat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    var dmesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.01), dmat);
    /* Convert world hit point to local group space */
    var localPt = _group.worldToLocal(hitPoint.clone());
    dmesh.position.set(
      Math.max(-0.55, Math.min(0.55, localPt.x)),
      Math.max(-0.85, Math.min(0.85, localPt.y + (Math.random() - 0.5) * 0.6)),
      0.05
    );
    _group.add(dmesh);
    _decals.push(dmesh);
  }

  /* ── Shatter animation — 8 plate shards ───────────────────── */
  function _shatter() {
    if (!_scene || !_group) return;
    var shatterPos = new THREE.Vector3();
    _group.getWorldPosition(shatterPos);

    /* Remove shield from scene */
    _scene.remove(_group);
    _group = null;
    _decals.length = 0;

    if (_hpBar) _hpBar.style.display = 'none';

    var shardMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a2a, metalness: 0.7, roughness: 0.3
    });
    for (var i = 0; i < 8; i++) {
      var sw = 0.2 + Math.random() * 0.5;
      var sh = 0.2 + Math.random() * 0.6;
      var shard = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.06), shardMat.clone());
      shard.position.copy(shatterPos);
      shard.position.x += (Math.random() - 0.5) * 0.5;
      shard.position.y += (Math.random() - 0.5) * 0.5;
      _scene.add(shard);

      _shards.push({
        mesh: shard,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          2 + Math.random() * 4,
          (Math.random() - 0.5) * 5
        ),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        ),
        life: 1.0 + Math.random() * 0.5
      });
    }

    /* Explosion of sparks at shatter point */
    var sparkCount = 12;
    var smat2 = new THREE.MeshBasicMaterial({ color: 0xffee44 });
    for (var j = 0; j < sparkCount; j++) {
      var spm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), smat2);
      spm.position.copy(shatterPos);
      _scene.add(spm);
      _sparks.push({
        mesh: spm,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6,
          (Math.random() - 0.5) * 8
        ),
        life: 0.4 + Math.random() * 0.3
      });
    }

    _shattered = true;
    _deployed = false;
    _updateHUD();
  }

  /* ── Public API ────────────────────────────────────────────── */

  function init(scene, camera) {
    _scene   = scene;
    _camera  = camera;
    _group   = null;
    _deployed = false;
    _shattered = false;
    _hp = MAX_HP;
    _decals.length = 0;
    _sparks.length = 0;
    _shards.length = 0;
    _rising = false;
    _riseTimer = 0;
    _ensureDOM();
  }

  function isDeployed() { return _deployed && !_shattered; }

  function getHealth() { return _hp; }

  function deploy(playerPos, cameraYaw) {
    if (_deployed || !_scene) return;
    if (_shattered) {
      /* Restore HP on re-deployment after pickup */
    }

    /* Calculate placement: 1.5 units ahead of player */
    var yaw = (typeof cameraYaw === 'number') ? cameraYaw : 0;
    var fwdX = -Math.sin(yaw);
    var fwdZ = -Math.cos(yaw);

    var px = playerPos.x + fwdX * 1.5;
    var py = playerPos.y;
    var pz = playerPos.z + fwdZ * 1.5;

    _group = _buildShield();

    /* Orient shield to face back toward player (perpendicular to attack direction) */
    _group.rotation.y = yaw;

    /* Start at ground level for rise animation */
    _group.position.set(px, py - 0.9, pz);
    _targetY = py;
    _scene.add(_group);

    _deployed = true;
    _shattered = false;
    _rising = true;
    _riseTimer = 0;
    _decals.length = 0;

    if (_hpBar) _hpBar.style.display = 'none';
    _updateHUD();
  }

  function pickup(playerPos) {
    if (!_deployed || !_group) return;

    /* Check if within 2 units */
    var shieldPos = new THREE.Vector3();
    _group.getWorldPosition(shieldPos);
    var dx = playerPos.x - shieldPos.x;
    var dz = playerPos.z - shieldPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 2) return;

    /* Remove from scene */
    _scene.remove(_group);
    _group = null;
    _decals.length = 0;
    _deployed = false;
    _shattered = false;

    /* Repair 30 HP on pickup */
    _hp = Math.min(MAX_HP, _hp + 30);

    if (_hpBar) _hpBar.style.display = 'none';
    _updateHUD();

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('🛡 SHIELD PICKED UP (+30 repair)', '#88ffaa');
    }
  }

  /* Check if an incoming bullet ray is blocked by the shield.
     Returns true if blocked (caller should skip hit processing). */
  function checkBulletBlock(rayOrigin, rayDir) {
    if (!_deployed || _shattered || !_group) return false;

    /* Build a raycaster and intersect against the shield group */
    var ray = new THREE.Raycaster(rayOrigin, rayDir.normalize(), 0, 200);
    var hits = ray.intersectObject(_group, true);
    if (!hits || hits.length === 0) return false;

    /* Bullet is blocked — deal random damage to shield */
    var dmg = 10 + Math.floor(Math.random() * 11); // 10-20
    _hp -= dmg;

    /* Impact decal */
    var hitPt = hits[0].point;
    _addImpactDecal(hitPt);

    /* Spark effect */
    _spawnSparks(hitPt);

    /* Update HUD */
    _updateHUD();

    /* Shatter if HP depleted */
    if (_hp <= 0) {
      _hp = 0;
      _shatter();
    }

    return true;
  }

  function update(delta) {
    if (!delta || delta <= 0) return;

    /* Rise animation */
    if (_rising && _group) {
      _riseTimer += delta;
      var t = Math.min(1, _riseTimer / RISE_TIME);
      /* Ease out */
      var ease = 1 - (1 - t) * (1 - t);
      _group.position.y = (_targetY - 0.9) + ease * 0.9;
      if (t >= 1) {
        _group.position.y = _targetY;
        _rising = false;
      }
    }

    /* Spark particles */
    for (var i = _sparks.length - 1; i >= 0; i--) {
      var sp = _sparks[i];
      sp.life -= delta;
      if (sp.life <= 0) {
        if (_scene) _scene.remove(sp.mesh);
        _sparks.splice(i, 1);
        continue;
      }
      sp.vel.y -= 9.8 * delta;
      sp.mesh.position.x += sp.vel.x * delta;
      sp.mesh.position.y += sp.vel.y * delta;
      sp.mesh.position.z += sp.vel.z * delta;
      var alpha = sp.life / 0.45;
      if (sp.mesh.material && sp.mesh.material.opacity !== undefined) {
        sp.mesh.material.transparent = true;
        sp.mesh.material.opacity = Math.min(1, alpha);
      }
    }

    /* Shard particles (shatter) */
    for (var j = _shards.length - 1; j >= 0; j--) {
      var sh = _shards[j];
      sh.life -= delta;
      if (sh.life <= 0) {
        if (_scene) _scene.remove(sh.mesh);
        _shards.splice(j, 1);
        continue;
      }
      sh.vel.y -= 9.8 * delta;
      sh.mesh.position.x += sh.vel.x * delta;
      sh.mesh.position.y += sh.vel.y * delta;
      sh.mesh.position.z += sh.vel.z * delta;
      sh.mesh.rotation.x += sh.spin.x * delta;
      sh.mesh.rotation.y += sh.spin.y * delta;
      sh.mesh.rotation.z += sh.spin.z * delta;
      /* Simple floor collision */
      if (sh.mesh.position.y < -0.2) {
        sh.mesh.position.y = -0.2;
        sh.vel.y = 0;
        sh.vel.x *= 0.6;
        sh.vel.z *= 0.6;
      }
    }

    /* Update floating HP bar */
    _updateHPBar();
  }

  function clear() {
    if (_group && _scene) {
      _scene.remove(_group);
    }
    _group = null;
    _deployed = false;
    _shattered = false;
    _decals.length = 0;

    for (var i = 0; i < _sparks.length; i++) {
      if (_scene) _scene.remove(_sparks[i].mesh);
    }
    _sparks.length = 0;

    for (var j = 0; j < _shards.length; j++) {
      if (_scene) _scene.remove(_shards[j].mesh);
    }
    _shards.length = 0;

    if (_hpBar) _hpBar.style.display = 'none';
    _updateHUD();
  }

  function reset() {
    clear();
    _hp = MAX_HP;
    _updateHUD();
  }

  return {
    init:             init,
    update:           update,
    deploy:           deploy,
    pickup:           pickup,
    isDeployed:       isDeployed,
    clear:            clear,
    reset:            reset,
    getHealth:        getHealth,
    checkBulletBlock: checkBulletBlock
  };
})();
