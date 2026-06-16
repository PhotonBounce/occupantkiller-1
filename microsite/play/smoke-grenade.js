/* ============================================================
 *  SMOKE-GRENADE.JS — Tactical smoke for concealment
 *
 *  Q key → throw smoke grenade toward player aim direction.
 *  Landing point: ground-plane intersection ~20u ahead.
 *  Smoke: THREE.CylinderGeometry that grows over 2s, fades at 20s.
 *  While smoke is active, nearby enemies have sight reduced 80%.
 *  Canvas vignette overlay when player is inside a smoke cloud.
 *  HUD counter shows remaining grenades (starts at 3).
 *  Airdrop restocks +1 smoke when collected (hook on HUD.notifyPickup).
 * ============================================================ */
var SmokeGrenadeSystem = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    MAX_STOCK:    3,
    MAX_ACTIVE:   2,
    THROW_DIST:   22,     // world units ahead of player
    SMOKE_RADIUS: 5.0,    // full-grown radius
    SMOKE_HEIGHT: 4.5,    // cylinder height
    GROW_SEC:     2.0,    // time to reach full size
    LIFE_SEC:     22,     // total life
    FADE_SEC:     3.5,    // fade-out at end of life
    ENEMY_BLIND:  0.15,   // enemy rangedRange multiplier inside smoke
    NEAR_PLAYER:  5.5,    // distance to consider player "inside" smoke
    SEGMENTS:     14,
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _stock       = CFG.MAX_STOCK;
  var _smokes      = [];   // active smoke objects
  var _scene       = null;
  var _hudEl       = null;
  var _vigEl       = null;  // canvas overlay for in-smoke effect
  var _cooldown    = 0;

  /* ── Helpers ────────────────────────────── */
  function _getScene()  { try { return window.GameManager && GameManager.getScene  ? GameManager.getScene()  : null; } catch(e){return null;} }
  function _getCamera() { try { return window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch(e){return null;} }
  function _getPlayer() { try { return window.player || null; } catch(e){return null;} }

  /* ── Build smoke mesh ───────────────────── */
  function _buildSmoke() {
    if (typeof THREE === 'undefined') return null;
    var geo  = new THREE.CylinderGeometry(0.3, 0.5, CFG.SMOKE_HEIGHT, CFG.SEGMENTS, 1, true);
    var mat  = new THREE.MeshBasicMaterial({
      color: 0xe8e8e8, transparent: true, opacity: 0.0,
      side: THREE.DoubleSide, depthWrite: false,
    });
    var mesh = new THREE.Mesh(geo, mat);
    // Inner denser core
    var innerGeo = new THREE.CylinderGeometry(0.2, 0.4, CFG.SMOKE_HEIGHT * 0.7, 10, 1, true);
    var innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.0,
      side: THREE.DoubleSide, depthWrite: false,
    });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    var group = new THREE.Group();
    group.add(mesh);
    group.add(inner);
    return { group: group, outerMat: mat, innerMat: innerMat, outerGeo: geo, innerGeo: innerGeo };
  }

  /* ── Throw grenade ──────────────────────── */
  function _throw() {
    if (_stock <= 0) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('No smokes remaining', '#888'); } catch(e) {}
      return;
    }
    if (_smokes.length >= CFG.MAX_ACTIVE) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('Max smokes active', '#888'); } catch(e) {}
      return;
    }
    if (_cooldown > 0) return;

    var player = _getPlayer();
    var cam    = _getCamera();
    var scene  = _getScene();
    if (!player || !scene || typeof THREE === 'undefined') return;

    /* Landing point: player position + camera direction projected on ground */
    var dir = new THREE.Vector3(0, 0, -1);
    if (cam) {
      cam.getWorldDirection(dir);
      dir.y = 0;
      if (dir.length() < 0.001) dir.set(0, 0, -1);
      dir.normalize();
    }

    var lx = player.position.x + dir.x * CFG.THROW_DIST;
    var lz = player.position.z + dir.z * CFG.THROW_DIST;
    var ly = 0;
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        ly = VoxelWorld.getTerrainHeight(Math.round(lx), Math.round(lz)) || 0;
      }
    } catch(e) {}

    var built = _buildSmoke();
    if (!built) return;

    built.group.position.set(lx, ly + CFG.SMOKE_HEIGHT * 0.5, lz);
    scene.add(built.group);

    _smokes.push({
      group:    built.group,
      outerMat: built.outerMat,
      innerMat: built.innerMat,
      outerGeo: built.outerGeo,
      innerGeo: built.innerGeo,
      x: lx, z: lz,
      timer:    0,
      radius:   0.3,
      alive:    true,
    });

    _stock--;
    _cooldown = 1.2;
    _updateHUD();

    try {
      if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('💨 SMOKE DEPLOYED', '#aaddff');
    } catch(e) {}
    try {
      if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(0.3, 0.2);
    } catch(e) {}
  }

  /* ── Update HUD counter ─────────────────── */
  function _updateHUD() {
    if (_hudEl) {
      _hudEl.textContent = '💨 ' + _stock;
      _hudEl.style.opacity = _stock > 0 ? '1' : '0.4';
    }
  }

  /* ── Update per-frame ───────────────────── */
  function update(dt) {
    _cooldown = Math.max(0, _cooldown - dt);
    var player = _getPlayer();
    var playerInSmoke = false;

    for (var i = _smokes.length - 1; i >= 0; i--) {
      var s = _smokes[i];
      s.timer += dt;

      /* Grow phase */
      var growFrac = Math.min(1, s.timer / CFG.GROW_SEC);
      s.radius = 0.3 + (CFG.SMOKE_RADIUS - 0.3) * growFrac;

      /* Rescale mesh */
      var scale = s.radius / CFG.SMOKE_RADIUS;
      s.group.scale.set(scale, 1, scale);

      /* Opacity */
      var opacity = 0.38 * growFrac;
      if (s.timer > CFG.LIFE_SEC - CFG.FADE_SEC) {
        var fadeFrac = (s.timer - (CFG.LIFE_SEC - CFG.FADE_SEC)) / CFG.FADE_SEC;
        opacity *= Math.max(0, 1 - fadeFrac);
      }
      s.outerMat.opacity = opacity;
      s.innerMat.opacity = opacity * 0.55;

      /* Apply enemy blindness inside/near smoke */
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var j = 0; j < all.length; j++) {
            var e = all[j];
            if (!e || !e.mesh || e.dead) continue;
            var ex = e.mesh.position.x - s.x;
            var ez = e.mesh.position.z - s.z;
            var d2 = ex*ex + ez*ez;
            if (d2 < s.radius * s.radius * 1.5) {
              if (!e._smokeBlinded) {
                e._smokeBlinded = true;
                e._origRange = e.detectionRange || e.rangedRange || 30;
                if (typeof e.detectionRange !== 'undefined') e.detectionRange = e._origRange * CFG.ENEMY_BLIND;
                if (typeof e.rangedRange   !== 'undefined') e.rangedRange   = e._origRange * CFG.ENEMY_BLIND;
              }
            } else if (e._smokeBlinded) {
              e._smokeBlinded = false;
              if (typeof e.detectionRange !== 'undefined') e.detectionRange = e._origRange;
              if (typeof e.rangedRange   !== 'undefined') e.rangedRange   = e._origRange;
            }
          }
        }
      } catch(err) {}

      /* Player inside smoke? */
      if (player && player.position) {
        var px = player.position.x - s.x;
        var pz = player.position.z - s.z;
        if (px*px + pz*pz < CFG.NEAR_PLAYER * CFG.NEAR_PLAYER) {
          playerInSmoke = true;
        }
      }

      /* Expire */
      if (s.timer >= CFG.LIFE_SEC) {
        _scene = _scene || _getScene();
        try { if (_scene) _scene.remove(s.group); } catch(ex) {}
        // Restore blinded enemies
        try {
          if (typeof Enemies !== 'undefined' && Enemies.getAll) {
            var all2 = Enemies.getAll();
            for (var k = 0; k < all2.length; k++) {
              var e2 = all2[k];
              if (e2 && e2._smokeBlinded) {
                e2._smokeBlinded = false;
                if (typeof e2.detectionRange !== 'undefined') e2.detectionRange = e2._origRange;
                if (typeof e2.rangedRange   !== 'undefined') e2.rangedRange   = e2._origRange;
              }
            }
          }
        } catch(err2) {}
        _smokes.splice(i, 1);
      }
    }

    /* In-smoke vignette */
    if (_vigEl) {
      _vigEl.style.opacity = playerInSmoke ? '1' : '0';
    }
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    if (typeof THREE === 'undefined') return;

    /* CSS */
    var style = document.createElement('style');
    style.textContent = '#smoke-vig{transition:opacity 0.8s;}';
    document.head.appendChild(style);

    /* HUD counter (bottom left, above minimap) */
    _hudEl = document.createElement('div');
    _hudEl.id = 'smoke-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:185px;left:12px;font-family:monospace;font-size:11px;',
      'color:#aaddff;background:rgba(0,0,0,0.5);border:1px solid rgba(100,180,255,0.3);',
      'padding:2px 7px;border-radius:4px;z-index:210;pointer-events:none;',
    ].join('');
    _updateHUD();
    document.body.appendChild(_hudEl);

    /* In-smoke vignette overlay */
    _vigEl = document.createElement('canvas');
    _vigEl.id = 'smoke-vig';
    _vigEl.width  = 2;
    _vigEl.height = 2;
    _vigEl.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;',
      'pointer-events:none;z-index:105;opacity:0;',
      'background:radial-gradient(ellipse at center,',
        'rgba(220,230,240,0.0) 0%,rgba(200,215,225,0.55) 100%);',
    ].join('');
    document.body.appendChild(_vigEl);

    /* Hint label */
    var hint = document.createElement('div');
    hint.style.cssText = [
      'position:fixed;bottom:185px;left:52px;font-family:monospace;font-size:9px;',
      'color:rgba(170,210,255,0.45);pointer-events:none;z-index:210;',
      'line-height:20px;',
    ].join('');
    hint.textContent = '[Q] SMOKE';
    document.body.appendChild(hint);

    /* Key handler */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyQ' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        _throw();
      }
    });

    /* rAF loop */
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  function restock(n) {
    _stock = Math.min(CFG.MAX_STOCK, _stock + (n || 1));
    _updateHUD();
  }

  return { init: init, restock: restock };
})();

window.SmokeGrenadeSystem = SmokeGrenadeSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SmokeGrenadeSystem.init(); });
} else {
  SmokeGrenadeSystem.init();
}
