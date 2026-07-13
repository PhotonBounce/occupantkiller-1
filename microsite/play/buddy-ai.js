// buddy-ai.js — AI Buddy Companion for OccupantKiller
// U key: spawn/recall one buddy soldier. Max 1 buddy at a time.
window.BuddyAI = (function () {
  'use strict';

  // ── constants ────────────────────────────────────────────────────────────────
  var BUDDY_MAX_HP       = 100;
  var BUDDY_FOLLOW_MIN   = 3;    // stay at least 3 units behind player
  var BUDDY_FOLLOW_MAX   = 5;    // max follow distance before catching up
  var BUDDY_FIRE_RANGE   = 20;   // attack enemies within 20 units
  var BUDDY_FIRE_RATE    = 1.5;  // seconds between shots
  var BUDDY_DAMAGE       = 15;
  var BUDDY_CROUCH_HP    = 30;   // crouch and stop shooting below this HP
  var BUDDY_RECOVER_TIME = 10;   // seconds to recover from crouch
  var BUDDY_RESPAWN_CD   = 60;   // seconds before can spawn again after death
  var BUDDY_SPEED        = 5;

  var BUDDY_NAMES = ['ALPHA', 'BRAVO', 'CHARLIE', 'GHOST'];

  // ── state ────────────────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _buddy        = null;   // the active buddy object (or null)
  var _respawnTimer = 0;      // counts down after buddy death
  var _hudEl        = null;   // HUD corner element

  // Globals
  window._buddyAlive = false;
  window._buddyHP    = 0;

  // ── mesh builder ─────────────────────────────────────────────────────────────
  function _buildMesh() {
    var group = new THREE.Group();
    var s = 1;

    // Torso — olive/camo green
    var torsoGeo = new THREE.BoxGeometry(0.52 * s, 0.7 * s, 0.26 * s);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x4a7a3a });
    var torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.85 * s;
    group.add(torso);

    // Head — skin
    var headGeo = new THREE.BoxGeometry(0.34 * s, 0.34 * s, 0.34 * s);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xc8a882 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.4 * s;
    group.add(head);

    // Helmet — dark camo green
    var helmGeo = new THREE.BoxGeometry(0.40 * s, 0.16 * s, 0.40 * s);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x3a5c2a });
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 1.57 * s;
    group.add(helm);

    // Left leg
    var legGeo = new THREE.BoxGeometry(0.21 * s, 0.55 * s, 0.21 * s);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x3d5c2d });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.14 * s, 0.275 * s, 0);
    group.add(legL);

    // Right leg
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.14 * s, 0.275 * s, 0);
    group.add(legR);

    // Left arm
    var armGeo = new THREE.BoxGeometry(0.18 * s, 0.52 * s, 0.18 * s);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x4a7a3a });
    var armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.35 * s, 0.85 * s, 0);
    group.add(armL);

    // Right arm
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.35 * s, 0.85 * s, 0);
    group.add(armR);

    // Chest rig — bright green accent
    var rigGeo = new THREE.BoxGeometry(0.54 * s, 0.42 * s, 0.10 * s);
    var rigMat = new THREE.MeshLambertMaterial({ color: 0x2e8b3e });
    var rig = new THREE.Mesh(rigGeo, rigMat);
    rig.position.set(0, 0.86 * s, 0.18 * s);
    group.add(rig);

    // Rifle
    var rifleGeo = new THREE.BoxGeometry(0.06 * s, 0.06 * s, 0.75 * s);
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var rifle = new THREE.Mesh(rifleGeo, rifleMat);
    rifle.position.set(0.30 * s, 0.85 * s, 0.45 * s);
    group.add(rifle);

    return group;
  }

  // ── HP bar (canvas texture above head) ───────────────────────────────────────
  function _buildHPBar() {
    var canvas = document.createElement('canvas');
    canvas.width  = 64;
    canvas.height = 8;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00ff44';
    ctx.fillRect(0, 0, 64, 8);
    var tex = new THREE.CanvasTexture(canvas);
    var geo = new THREE.PlaneGeometry(0.9, 0.10);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    var bar = new THREE.Mesh(geo, mat);
    bar._canvas = canvas;
    bar._ctx    = ctx;
    bar._tex    = tex;
    _scene.add(bar);
    return bar;
  }

  function _updateHPBar(bar, pct) {
    var ctx = bar._ctx;
    ctx.clearRect(0, 0, 64, 8);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = '#00ff44';
    ctx.fillRect(0, 0, Math.round(64 * Math.max(0, pct)), 8);
    bar._tex.needsUpdate = true;
  }

  // ── HUD corner element ────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'buddy-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:16px',
      'display:none',
      'background:rgba(0,60,0,0.72)',
      'border:1px solid #00ff44',
      'border-radius:4px',
      'padding:5px 8px',
      'font-family:monospace',
      'font-size:12px',
      'color:#00ff44',
      'z-index:9000',
      'pointer-events:none',
      'min-width:110px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_buddy || !window._buddyAlive) {
      _hudEl.style.display = 'none';
      return;
    }
    var pct = Math.max(0, window._buddyHP / BUDDY_MAX_HP);
    var barW = Math.round(pct * 80);
    var recovering = _buddy.recoverTimer > 0;
    _hudEl.style.display = 'block';
    _hudEl.innerHTML = (
      '<span style="color:#7fff7f">&#9899; ' + _buddy.name + '</span><br>' +
      '<div style="background:#111;width:80px;height:6px;margin-top:2px;display:inline-block">' +
        '<div style="background:#00ff44;width:' + barW + 'px;height:6px"></div>' +
      '</div>' +
      (recovering ? '<br><span style="color:#ffaa00;font-size:10px">RECOVERING</span>' : '')
    );
  }

  // ── toast helper ─────────────────────────────────────────────────────────────
  function _toast(msg, color) {
    color = color || '#ff2222';
    if (window.HUD && HUD.showToast) {
      HUD.showToast(msg, 3000, color);
    } else {
      // Fallback DOM toast
      var el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText = [
        'position:fixed',
        'top:30%',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.8)',
        'color:' + color,
        'font-family:monospace',
        'font-size:22px',
        'font-weight:bold',
        'padding:10px 24px',
        'border-radius:6px',
        'z-index:99999',
        'pointer-events:none'
      ].join(';');
      document.body.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
    }
  }

  // ── callout helper ────────────────────────────────────────────────────────────
  function _callout(type) {
    if (window.PlayerCallouts && PlayerCallouts.callout) {
      try { PlayerCallouts.callout(type); } catch (e) {}
    }
    console.log('[BuddyAI] ' + (_buddy ? _buddy.name : '??') + ': ' + type);
  }

  // ── spawn ─────────────────────────────────────────────────────────────────────
  function spawn(playerPos) {
    if (!_scene) return;

    // Still in respawn cooldown?
    if (_respawnTimer > 0) {
      var secs = Math.ceil(_respawnTimer);
      _toast('BUDDY NOT READY — ' + secs + 's', '#ff8800');
      return;
    }

    // Already alive — despawn first
    if (_buddy) {
      _removeBuddy();
      return;
    }

    var name = BUDDY_NAMES[Math.floor(Math.random() * BUDDY_NAMES.length)];

    var mesh  = _buildMesh();
    var hpBar = _buildHPBar();

    // Place slightly behind player (offset on X so we don't block)
    mesh.position.set(
      playerPos.x + (Math.random() < 0.5 ? 1.5 : -1.5),
      playerPos.y,
      playerPos.z + 2
    );
    _scene.add(mesh);

    _buddy = {
      name:          name,
      mesh:          mesh,
      hpBar:         hpBar,
      hp:            BUDDY_MAX_HP,
      fireTimer:     0,
      recoverTimer:  0,  // > 0 means crouching / recovering
      calloutTimer:  0
    };

    window._buddyAlive = true;
    window._buddyHP    = BUDDY_MAX_HP;

    _toast(name + ' IS WITH YOU!', '#00ff88');
    _callout('CONTACT');
    _updateHUD();
  }

  // ── remove buddy mesh ─────────────────────────────────────────────────────────
  function _removeBuddy() {
    if (!_buddy) return;
    if (_buddy.mesh  && _scene) _scene.remove(_buddy.mesh);
    if (_buddy.hpBar && _scene) _scene.remove(_buddy.hpBar);
    _buddy             = null;
    window._buddyAlive = false;
    window._buddyHP    = 0;
    _updateHUD();
  }

  // ── shoot at nearest enemy ────────────────────────────────────────────────────
  function _shootNearestEnemy(enemies) {
    if (!enemies || !enemies.length) return false;
    var bPos = _buddy.mesh.position;
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e.dead || e.hp <= 0) continue;
      var ep = e.mesh ? e.mesh.position : (e.position || null);
      if (!ep) continue;
      var dx = ep.x - bPos.x;
      var dz = ep.z - bPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist && dist <= BUDDY_FIRE_RANGE) {
        bestDist = dist;
        best = e;
      }
    }
    if (!best) return false;

    // Apply damage
    best.hp -= BUDDY_DAMAGE;
    if (best.hp <= 0) {
      best.hp   = 0;
      best.dead = true;
    }

    // Orient buddy toward enemy
    var tp = best.mesh ? best.mesh.position : best.position;
    _buddy.mesh.lookAt(tp.x, _buddy.mesh.position.y, tp.z);

    return true;
  }

  // ── update loop ───────────────────────────────────────────────────────────────
  function update(delta, playerPos, enemies) {
    // Tick respawn cooldown even when no buddy
    if (_respawnTimer > 0) {
      _respawnTimer -= delta;
      if (_respawnTimer < 0) _respawnTimer = 0;
    }

    if (!_buddy) return;

    var b    = _buddy;
    var bPos = b.mesh.position;

    // ── movement: follow player at 3-5 units offset ──────────────────────────
    var offsetX = 1.8;  // lateral patrol offset so buddy doesn't block player
    var targetX = playerPos.x + offsetX;
    var targetZ = playerPos.z + BUDDY_FOLLOW_MIN + 0.5;

    var dx   = targetX - bPos.x;
    var dz   = targetZ - bPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    var crouching = b.recoverTimer > 0;

    // Reduce speed and height when crouching
    var moveSpeed = crouching ? BUDDY_SPEED * 0.3 : BUDDY_SPEED;

    if (dist > BUDDY_FOLLOW_MIN) {
      var step = Math.min(moveSpeed * delta, dist - BUDDY_FOLLOW_MIN);
      bPos.x += (dx / dist) * step;
      bPos.z += (dz / dist) * step;
    }

    // Keep buddy on terrain
    if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
      var th = VoxelWorld.getTerrainHeight(bPos.x, bPos.z);
      bPos.y = th + (crouching ? 0.3 : 0);
    } else {
      bPos.y = playerPos.y + (crouching ? -0.35 : 0);
    }

    // Scale mesh Y to simulate crouch
    b.mesh.scale.y = crouching ? 0.65 : 1.0;

    // ── recovery timer ───────────────────────────────────────────────────────
    if (crouching) {
      b.recoverTimer -= delta;
      if (b.recoverTimer <= 0) {
        b.recoverTimer = 0;
        _toast(b.name + ' BACK IN ACTION!', '#00ff88');
        _callout('CONTACT');
      }
    }

    // ── HP bar: face camera, float above head ────────────────────────────────
    var barHeight = crouching ? 1.4 : 2.0;
    b.hpBar.position.set(bPos.x, bPos.y + barHeight, bPos.z);
    if (_camera) b.hpBar.lookAt(_camera.position);
    _updateHPBar(b.hpBar, b.hp / BUDDY_MAX_HP);

    // ── shooting ─────────────────────────────────────────────────────────────
    if (!crouching) {
      b.fireTimer -= delta;
      if (b.fireTimer <= 0) {
        var hit = _shootNearestEnemy(enemies);
        if (hit) {
          b.fireTimer = BUDDY_FIRE_RATE;
          // Periodic callout
          b.calloutTimer -= delta;
          if (b.calloutTimer <= 0) {
            _callout('CONTACT');
            b.calloutTimer = 8 + Math.random() * 6;
          }
        } else {
          b.fireTimer = 0.25; // retry quickly when no target
        }
      }
    }

    // ── sync globals ─────────────────────────────────────────────────────────
    window._buddyHP = b.hp;

    // ── HUD update ───────────────────────────────────────────────────────────
    _updateHUD();
  }

  // ── damage intake (called externally if needed) ───────────────────────────────
  function damageBuddy(amount) {
    if (!_buddy || !window._buddyAlive) return;
    _buddy.hp -= amount;
    if (_buddy.hp < 0) _buddy.hp = 0;
    window._buddyHP = _buddy.hp;

    if (_buddy.hp <= 0) {
      // Buddy killed
      _toast('BUDDY DOWN!', '#ff0000');
      _callout('DOWN');
      _removeBuddy();
      _respawnTimer = BUDDY_RESPAWN_CD;
      return;
    }

    if (_buddy.hp < BUDDY_CROUCH_HP && _buddy.recoverTimer <= 0) {
      _buddy.recoverTimer = BUDDY_RECOVER_TIME;
      _toast(_buddy.name + ' IS DOWN — RECOVERING!', '#ffaa00');
    }
  }

  // ── init ─────────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _buildHUD();

    // U key listener
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'KeyU') return;
      // Don't conflict with existing WorldFeatures landmine placement —
      // WorldFeatures check runs first in game-manager; we fire regardless
      // since BuddyAI is a separate concern.
      if (!window.player && !(window.game && window.game.player)) return;
      var pPos = (window.player && window.player.position)
        ? window.player.position
        : null;
      // Try game-manager's player via a common global
      if (!pPos && window._playerPosition) pPos = window._playerPosition;
      if (!pPos) return;
      spawn(pPos);
    });

    // Expose damageBuddy globally so enemies.js / other systems can call it
    window.BuddyAI_damage = damageBuddy;
  }

  // ── reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    _removeBuddy();
    _respawnTimer      = 0;
    window._buddyAlive = false;
    window._buddyHP    = 0;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  // ── public API ────────────────────────────────────────────────────────────────
  return { init: init, update: update, spawn: spawn, reset: reset };

}());
