/* ============================================================
 *  SIGNAL-FLARE.JS — Illumination signal flare (Alt+E)
 *
 *  Alt+E throws a signal flare with ballistic arc. On landing:
 *    • Burning flare mesh (cylinder + ember particles)
 *    • Orange PointLight (radius 18u) that pulses and sputters
 *    • Terrain illuminated for 30 seconds
 *    • "FLARE ACTIVE" indicator on minimap (yellow star)
 *    • Enemies within radius have heightened visibility
 *      (detectionRange boosted 1.4× while in flare radius)
 *  2 stock per wave. No cooldown (throw back-to-back).
 * ============================================================ */
var SignalFlare = (function () {
  'use strict';

  var CFG = {
    THROW_SPEED:  20,
    THROW_UP:      7,
    GRAVITY:      18,
    BOUNCE_DAMP:  0.25,
    BURN_TIME:    30,    /* seconds */
    LIGHT_RADIUS: 18,
    DETECT_BOOST: 1.4,
    STOCK:         2,
  };

  var _initialized = false;
  var _scene       = null;
  var _active      = []; /* active landed flares */
  var _thrown      = []; /* in-flight flare objects */
  var _stock       = CFG.STOCK;
  var _hudEl       = null;
  var _lastTs      = 0;
  var _lastWave    = -1;

  /* Expose for minimap integration */
  window._activeFlares = window._activeFlares || [];

  /* ── Build flare mesh ───────────────────── */
  function _buildFlareMesh(scene) {
    var g = new THREE.Group();

    /* Body cylinder */
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8),
      new THREE.MeshLambertMaterial({ color: 0xcc3300, emissive: 0x440000 })
    );
    g.add(body);

    /* Flame cap */
    var flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 })
    );
    flame.position.y = 0.17;
    flame.userData.isFlame = true;
    g.add(flame);

    /* Smoke wisp */
    var smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.25, depthWrite: false })
    );
    smoke.position.y = 0.3;
    smoke.userData.isSmoke = true;
    g.add(smoke);

    /* Light source */
    var light = new THREE.PointLight(0xff6622, 2.5, CFG.LIGHT_RADIUS);
    light.userData.isFlareLight = true;
    g.add(light);

    scene.add(g);
    return g;
  }

  /* ── Build in-flight mesh (small) ────────── */
  function _buildFlightMesh(scene) {
    var m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.16, 6),
      new THREE.MeshBasicMaterial({ color: 0xff4400 })
    );
    /* Tiny trail light */
    var tl = new THREE.PointLight(0xff4400, 0.8, 3);
    m.add(tl);
    scene.add(m);
    return m;
  }

  /* ── Terrain height helper ─────────────── */
  function _ty(x, z) { try { return (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ? VoxelWorld.getTerrainHeight(x, z) : 0; } catch(e){return 0;} }

  /* ── Throw a flare ───────────────────────── */
  function _throw() {
    if (_stock <= 0) return;
    var player = window.player;
    var cam    = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
    if (!player || !player.position) return;
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){}
    }
    if (!_scene) return;

    _stock--;
    _updateHUD();

    var dir = new THREE.Vector3();
    if (cam) { cam.getWorldDirection(dir); } else { dir.set(0,0,1); }
    dir.y = 0; dir.normalize();

    var mesh = _buildFlightMesh(_scene);
    mesh.position.set(
      player.position.x + dir.x * 0.4,
      player.position.y + 1.3,
      player.position.z + dir.z * 0.4
    );

    _thrown.push({
      mesh: mesh,
      vel: { x: dir.x * CFG.THROW_SPEED, y: CFG.THROW_UP, z: dir.z * CFG.THROW_SPEED },
      bounced: false,
    });

    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('🔴 FLARE OUT', '#ff8844'); } catch(e){}
  }

  /* ── Land a flare ─────────────────────────── */
  function _land(thrown) {
    _scene.remove(thrown.mesh);
    var pos = thrown.mesh.position.clone();
    pos.y = _ty(pos.x, pos.z);

    var fm = _buildFlareMesh(_scene);
    fm.position.copy(pos);
    fm.position.y += 0.1;

    /* Detect enemies initially and boost detection */
    var boosted = [];
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh || e.dead) continue;
          var dx = e.mesh.position.x - pos.x;
          var dz = e.mesh.position.z - pos.z;
          if (Math.sqrt(dx*dx+dz*dz) < CFG.LIGHT_RADIUS) {
            if (typeof e._flareBoost === 'undefined') {
              e._flareBoost = true;
              if (e.detectionRange) e.detectionRange *= CFG.DETECT_BOOST;
              if (e.rangedRange)    e.rangedRange    *= CFG.DETECT_BOOST;
              boosted.push(e);
            }
          }
        }
      }
    } catch(ex){}

    var flare = {
      mesh:    fm,
      pos:     pos,
      t:       0,
      boosted: boosted,
    };
    _active.push(flare);

    /* Add to minimap registry */
    window._activeFlares.push(flare);
  }

  /* ── Update HUD ─────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.textContent = '[Alt+E] FLARE ×' + _stock;
    _hudEl.style.color = _stock > 0 ? '#ff8844' : 'rgba(255,136,68,0.35)';
  }

  /* ── Restore enemy detection on flare end ─ */
  function _restoreEnemies(flare) {
    for (var i = 0; i < flare.boosted.length; i++) {
      var e = flare.boosted[i];
      if (e && e._flareBoost) {
        delete e._flareBoost;
        if (e.detectionRange) e.detectionRange /= CFG.DETECT_BOOST;
        if (e.rangedRange)    e.rangedRange    /= CFG.DETECT_BOOST;
      }
    }
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Wave restock */
    try {
      var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;
      if (w !== _lastWave && w > 0) { _lastWave = w; _stock = CFG.STOCK; _updateHUD(); }
    } catch(e){}

    /* In-flight */
    for (var fi = _thrown.length - 1; fi >= 0; fi--) {
      var thr = _thrown[fi];
      thr.vel.y -= CFG.GRAVITY * dt;
      thr.mesh.position.x += thr.vel.x * dt;
      thr.mesh.position.y += thr.vel.y * dt;
      thr.mesh.position.z += thr.vel.z * dt;
      thr.mesh.rotation.z += dt * 10;
      var floor = _ty(thr.mesh.position.x, thr.mesh.position.z);
      if (thr.mesh.position.y < floor + 0.1) {
        if (!thr.bounced) {
          thr.vel.y = Math.abs(thr.vel.y) * CFG.BOUNCE_DAMP;
          thr.vel.x *= 0.4; thr.vel.z *= 0.4;
          thr.bounced = true;
        } else {
          /* Settled — land it */
          _land(thr);
          _thrown.splice(fi, 1);
        }
      }
    }

    /* Active burning flares */
    for (var ai = _active.length - 1; ai >= 0; ai--) {
      var fl = _active[ai];
      fl.t += dt;

      /* Animate flame + light */
      fl.mesh.children.forEach(function (c) {
        if (c.userData.isFlame) {
          c.material.opacity = 0.7 + 0.3 * Math.sin(ts / 80 + ai);
          c.scale.y = 0.85 + 0.3 * Math.abs(Math.sin(ts / 120));
        }
        if (c.userData.isSmoke) {
          c.position.y = 0.3 + 0.15 * Math.sin(ts / 200);
          c.material.opacity = 0.15 + 0.1 * Math.sin(ts / 300);
        }
        if (c.userData.isFlareLight) {
          /* Sputter effect */
          c.intensity = 2 + 1.5 * Math.abs(Math.sin(ts / 90 + ai * 1.7));
          /* Warm flicker */
          var r = 0.95 + 0.05 * Math.sin(ts / 60);
          var g = 0.3 + 0.15 * Math.abs(Math.sin(ts / 110));
          c.color.setRGB(r, g, 0.05);
        }
      });

      /* Gradually dim as it dies */
      if (fl.t > CFG.BURN_TIME * 0.8) {
        var dimF = 1 - (fl.t - CFG.BURN_TIME * 0.8) / (CFG.BURN_TIME * 0.2);
        fl.mesh.children.forEach(function (c) {
          if (c.userData.isFlareLight) c.intensity *= dimF;
        });
      }

      if (fl.t >= CFG.BURN_TIME) {
        _restoreEnemies(fl);
        if (_scene) _scene.remove(fl.mesh);
        /* Remove from minimap registry */
        var idx = window._activeFlares.indexOf(fl);
        if (idx !== -1) window._activeFlares.splice(idx, 1);
        _active.splice(ai, 1);
      }
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'flare-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:410px;left:52px;font-family:monospace;font-size:9px;',
      'pointer-events:none;z-index:210;line-height:20px;letter-spacing:0.08em;',
    ].join('');
    document.body.appendChild(_hudEl);
    _updateHUD();

    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyE' && e.altKey && !e.ctrlKey) {
        e.preventDefault();
        _throw();
      }
    });

    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.SignalFlare = SignalFlare;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SignalFlare.init(); });
} else {
  SignalFlare.init();
}
