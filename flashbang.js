/* ============================================================
 *  FLASHBANG.JS — Flashbang grenade (] key)
 *
 *  ] key throws a flashbang in the look direction with ballistic arc.
 *  On detonation:
 *    • Player within 12u + inside front hemisphere → white flash
 *      (opacity 0.95 → fades over 1.5s)
 *    • Enemies within 10u → stunned 2.5s (freeze + detectionRange×0
 *    • White point-light bloom at detonation position
 *    • 3D mesh: grey cylinder with safety spoon, follows physics arc
 *    • Bounce once with velocity damping before detonating
 *  2 stock per wave. 12s cooldown.
 * ============================================================ */
var Flashbang = (function () {
  'use strict';

  var CFG = {
    THROW_SPEED:   22,    /* m/s initial */
    THROW_UP:       8,    /* upward component */
    GRAVITY:       18,    /* world units/s² */
    BOUNCE_DAMP:   0.38,
    FUSE:           1.6,  /* seconds until pop */
    STUN_RANGE:    10,
    STUN_DURATION:  2.5,
    FLASH_RANGE:   12,
    STOCK:          2,
    COOLDOWN:      12000,
  };

  var _initialized = false;
  var _stock       = CFG.STOCK;
  var _cooldownMs  = 0;
  var _grenades    = []; /* active grenade objects */
  var _flashEl     = null;
  var _flashOp     = 0;
  var _hudEl       = null;
  var _scene       = null;
  var _lastTs      = 0;

  /* ── Build grenade mesh ─────────────────── */
  function _buildMesh(scene) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    g.add(body);
    /* Safety lever */
    var lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.02),
      new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    lever.position.set(0.07, 0, 0);
    g.add(lever);
    scene.add(g);
    return g;
  }

  /* ── Throw a flashbang ──────────────────── */
  function _throw() {
    if (_stock <= 0 || _cooldownMs > 0) return;
    _stock--;
    _cooldownMs = CFG.COOLDOWN;
    _updateHUD();

    var player = window.player;
    var cam    = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
    if (!player || !player.position) return;
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){}
    }
    if (!_scene) return;

    /* Direction */
    var dir = new THREE.Vector3();
    if (cam) { cam.getWorldDirection(dir); } else { dir.set(0, 0, 1); }
    dir.y = 0; dir.normalize();

    var mesh = _buildMesh(_scene);
    mesh.position.set(
      player.position.x + dir.x * 0.5,
      player.position.y + 1.4,
      player.position.z + dir.z * 0.5
    );

    var vel = {
      x: dir.x * CFG.THROW_SPEED,
      y: CFG.THROW_UP,
      z: dir.z * CFG.THROW_SPEED,
    };

    _grenades.push({
      mesh:     mesh,
      vel:      vel,
      fuse:     CFG.FUSE,
      bounced:  false,
    });

    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('💡 FLASHBANG', '#ffffcc'); } catch(e){}
  }

  /* ── Detonate ───────────────────────────── */
  function _detonate(gr) {
    var pos = gr.mesh.position.clone();

    /* Bloom light */
    try {
      var light = new THREE.PointLight(0xffffff, 12, 20);
      light.position.copy(pos);
      _scene.add(light);
      var fadeLight = function (t) {
        if (t <= 0) { _scene.remove(light); return; }
        light.intensity = 12 * (t / 0.4);
        setTimeout(function () { fadeLight(t - 0.05); }, 50);
      };
      setTimeout(function () { fadeLight(0.4); }, 10);
    } catch(e) {}

    /* Tracer-style explosion flash */
    try { if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(pos, 1.2); } catch(e){}

    /* Player flash */
    try {
      var player = window.player;
      var cam    = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
      if (player && player.position && cam) {
        var dx = pos.x - player.position.x;
        var dz = pos.z - player.position.z;
        var dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < CFG.FLASH_RANGE) {
          /* Check if flashbang is in front hemisphere */
          var pdir = new THREE.Vector3();
          cam.getWorldDirection(pdir);
          var dot = (dx * pdir.x + dz * pdir.z) / (dist || 1);
          var intensity = Math.max(0, (1 - dist / CFG.FLASH_RANGE)) * Math.max(0, dot);
          if (intensity > 0.1) {
            _flashOp = Math.min(0.95, intensity * 1.1);
            if (_flashEl) {
              _flashEl.style.opacity = String(_flashOp);
              _flashEl.style.display = 'block';
            }
            try { if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(0.3 * intensity, 0.4); } catch(ex){}
          }
        }
      }
    } catch(e) {}

    /* Stun enemies */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh || e.dead) continue;
          var edx = e.mesh.position.x - pos.x;
          var edz = e.mesh.position.z - pos.z;
          var ed  = Math.sqrt(edx*edx + edz*edz);
          if (ed > CFG.STUN_RANGE) continue;
          try { e.stunned  = CFG.STUN_DURATION; } catch(ex){}
          try { e._fbStun  = CFG.STUN_DURATION; } catch(ex){}
          /* Freeze movement by zeroing velocity */
          if (e.velocity) { e.velocity.x = 0; e.velocity.z = 0; }
          /* Reduce detection range during stun */
          if (typeof e._savedDetRange === 'undefined') {
            e._savedDetRange   = e.detectionRange;
            e._savedRangedRange = e.rangedRange;
          }
          e.detectionRange  = 0.01;
          e.rangedRange     = 0.01;
          /* Restore after stun expires */
          (function (enemy) {
            setTimeout(function () {
              if (typeof enemy._savedDetRange !== 'undefined') {
                enemy.detectionRange  = enemy._savedDetRange;
                enemy.rangedRange     = enemy._savedRangedRange;
                delete enemy._savedDetRange;
                delete enemy._savedRangedRange;
              }
            }, CFG.STUN_DURATION * 1000);
          }(e));
        }
      }
    } catch(e) {}

    /* Remove mesh */
    _scene.remove(gr.mesh);
  }

  /* ── Update HUD ─────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var ready = _cooldownMs <= 0 && _stock > 0;
    var suf   = _cooldownMs > 0 ? ' <span style="color:rgba(255,255,200,0.3);font-size:8px">' + Math.ceil(_cooldownMs/1000) + 's</span>' : '';
    _hudEl.innerHTML = '[]] FLASH ×' + _stock + suf;
    _hudEl.style.color = ready ? '#ffffcc' : 'rgba(255,255,200,0.35)';
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Cooldown */
    if (_cooldownMs > 0) {
      _cooldownMs = Math.max(0, _cooldownMs - dt * 1000);
      if (_cooldownMs === 0) _updateHUD();
    }

    /* Flash fade */
    if (_flashOp > 0) {
      _flashOp = Math.max(0, _flashOp - dt * 0.7);
      if (_flashEl) {
        _flashEl.style.opacity = String(_flashOp);
        if (_flashOp <= 0) _flashEl.style.display = 'none';
      }
    }

    /* Active grenades */
    for (var i = _grenades.length - 1; i >= 0; i--) {
      var gr = _grenades[i];
      gr.fuse -= dt;

      /* Physics */
      gr.vel.y -= CFG.GRAVITY * dt;
      gr.mesh.position.x += gr.vel.x * dt;
      gr.mesh.position.y += gr.vel.y * dt;
      gr.mesh.position.z += gr.vel.z * dt;

      /* Spin */
      gr.mesh.rotation.x += dt * 8;
      gr.mesh.rotation.z += dt * 5;

      /* Terrain bounce */
      try {
        if (!gr.bounced) {
          var ty = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
            ? VoxelWorld.getTerrainHeight(gr.mesh.position.x, gr.mesh.position.z) : 0;
          if (gr.mesh.position.y < ty + 0.1) {
            gr.mesh.position.y = ty + 0.1;
            gr.vel.y = Math.abs(gr.vel.y) * CFG.BOUNCE_DAMP;
            gr.vel.x *= 0.6;
            gr.vel.z *= 0.6;
            gr.bounced = true;
          }
        }
      } catch(ex){}

      if (gr.fuse <= 0) {
        _detonate(gr);
        _grenades.splice(i, 1);
      }
    }
  }

  /* ── Restock on wave ────────────────────── */
  function _hookWave() {
    var lastWave = -1;
    setInterval(function () {
      try {
        var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;
        if (w !== lastWave && w > 0) {
          lastWave = w;
          _stock = CFG.STOCK;
          _cooldownMs = 0;
          _updateHUD();
        }
      } catch(e){}
    }, 2000);
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    /* Flash overlay */
    _flashEl = document.createElement('div');
    _flashEl.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;',
      'background:#fffff0;pointer-events:none;z-index:320;',
      'display:none;opacity:0;transition:none;',
    ].join('');
    document.body.appendChild(_flashEl);

    /* HUD chip */
    _hudEl = document.createElement('div');
    _hudEl.id = 'fb-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:350px;left:52px;font-family:monospace;font-size:9px;',
      'color:#ffffcc;pointer-events:none;z-index:210;line-height:20px;',
      'letter-spacing:0.08em;',
    ].join('');
    document.body.appendChild(_hudEl);
    _updateHUD();

    /* Key handler */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'BracketRight' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        _throw();
      }
    });

    _hookWave();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.Flashbang = Flashbang;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { Flashbang.init(); });
} else {
  Flashbang.init();
}
