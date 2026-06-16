/* ============================================================
 *  FPV-DRONE.JS — Lancet loitering munition
 *
 *  X key → launch autonomous homing drone.
 *  Drone spawns 2u ahead of player, climbs to 8u altitude,
 *  then locks on nearest living enemy and dives in at speed.
 *  Impact: Tracers.spawnExplosion (scale 5) + damageInRadius(8, 250).
 *
 *  While in flight: CRT "DRONE FEED" overlay with coords and
 *  a targeting reticle that tracks the locked enemy on-screen.
 *
 *  1 drone per wave. 60s cooldown. HUD shows status.
 * ============================================================ */
var FPVDrone = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    CLIMB_SPEED:  10,    // u/s vertical ascent
    CRUISE_ALT:   8,     // u above ground
    SEEK_SPEED:   18,    // u/s toward target
    TERMINAL_SPD: 28,    // u/s in dive
    DETONATE_DST: 1.0,   // u from target to explode
    BLAST_RADIUS: 8,
    BLAST_DMG:    250,
    COOLDOWN:     60,
    STOCK:        1,     // 1 per wave
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _stock       = CFG.STOCK;
  var _cooldown    = 0;
  var _drone       = null;    // { mesh, phase, target, timer }
  var _scene       = null;
  var _hudEl       = null;
  var _overlay     = null;
  var _reticleEl   = null;
  var _active      = false;

  /* ── Helpers ────────────────────────────── */
  function _getScene()  { try { return window.GameManager && GameManager.getScene  ? GameManager.getScene()  : null; } catch(e){return null;} }
  function _getCamera() { try { return window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch(e){return null;} }
  function _getPlayer() { try { return window.player || null; } catch(e){return null;} }

  /* ── Nearest living enemy ───────────────── */
  function _nearestEnemy(pos) {
    var best = null, bestD = Infinity;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh || e.dead) continue;
          var dx = e.mesh.position.x - pos.x;
          var dz = e.mesh.position.z - pos.z;
          var d  = Math.sqrt(dx*dx + dz*dz);
          if (d < bestD) { bestD = d; best = e; }
        }
      }
    } catch(err) {}
    return best;
  }

  /* ── Build drone mesh ───────────────────── */
  function _buildMesh() {
    if (typeof THREE === 'undefined') return null;
    var g = new THREE.Group();
    // Fuselage
    var fuse = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    fuse.rotation.z = Math.PI / 2;
    g.add(fuse);
    // Wings
    var wingMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var wing1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.04), wingMat);
    wing1.position.set(0, 0.15, 0);
    g.add(wing1);
    var wing2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.04), wingMat);
    wing2.position.set(0, -0.15, 0);
    g.add(wing2);
    // Nose warhead glow
    var glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff4400 })
    );
    glow.position.set(0.28, 0, 0);
    g.add(glow);
    return g;
  }

  /* ── Launch ─────────────────────────────── */
  function _launch() {
    if (_stock <= 0 || _active || _cooldown > 0) {
      var reason = _active ? 'Drone in flight' : _cooldown > 0 ? 'Drone on cooldown (' + Math.ceil(_cooldown) + 's)' : 'No drones';
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup(reason, '#888'); } catch(e){}
      return;
    }

    var player = _getPlayer();
    var scene  = _getScene();
    if (!player || !scene || typeof THREE === 'undefined') return;

    var mesh = _buildMesh();
    if (!mesh) return;

    var cam = _getCamera();
    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) cam.getWorldDirection(fwd);
    fwd.y = 0; fwd.normalize();

    var gndY = 0;
    try { if (window.VoxelWorld && VoxelWorld.getTerrainHeight) gndY = VoxelWorld.getTerrainHeight(Math.round(player.position.x), Math.round(player.position.z)) || 0; } catch(e){}

    mesh.position.set(
      player.position.x + fwd.x * 2,
      gndY + 1.5,
      player.position.z + fwd.z * 2
    );
    scene.add(mesh);

    _drone = {
      mesh:     mesh,
      phase:    'climb',   // climb → seek → terminal
      target:   null,
      timer:    0,
      groundY:  gndY,
    };

    _stock--;
    _active = true;
    _updateHUD();
    _showOverlay(true);

    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('🚀 LANCET LAUNCHED', '#ff8800'); } catch(e){}
  }

  /* ── Detonate ───────────────────────────── */
  function _detonate(pos) {
    try { if (window.Tracers && Tracers.spawnExplosion) Tracers.spawnExplosion(pos, 5); } catch(e){}
    try { if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) Enemies.damageInRadius(pos, CFG.BLAST_RADIUS, CFG.BLAST_DMG); } catch(e){}
    try { if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(2.5, 0.8); } catch(e){}
    if (_drone) {
      try { _scene.remove(_drone.mesh); } catch(ex){}
      _drone = null;
    }
    _active    = false;
    _cooldown  = CFG.COOLDOWN;
    _showOverlay(false);
    _updateHUD();
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('💥 LANCET DETONATED', '#ff4400'); } catch(e){}
  }

  /* ── Project enemy to screen ────────────── */
  function _projectToScreen(worldPos) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return null;
    var v = worldPos.clone();
    v.project(cam);
    var w = window.innerWidth, h = window.innerHeight;
    return {
      x: (v.x + 1) * 0.5 * w,
      y: (-v.y + 1) * 0.5 * h,
      behind: v.z > 1,
    };
  }

  /* ── CRT overlay ────────────────────────── */
  function _buildOverlay() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes droneScan{0%{top:-8px}100%{top:100%}}',
      '@keyframes droneStatic{0%,100%{opacity:0.04}50%{opacity:0.10}}',
      '@keyframes dronePulse{0%,100%{opacity:1}50%{opacity:0.4}}',
      '#drone-overlay{',
        'display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:310;',
        'pointer-events:none;border:2px solid rgba(255,136,0,0.3);',
        'box-shadow:inset 0 0 40px rgba(255,80,0,0.06);}',
      '#drone-scanline{position:absolute;left:0;right:0;height:4px;',
        'background:rgba(255,120,0,0.08);animation:droneScan 2.5s linear infinite;}',
      '#drone-corner{position:absolute;top:8px;left:8px;right:8px;bottom:8px;',
        'border:1px solid rgba(255,136,0,0.2);pointer-events:none;}',
      '#drone-label{position:absolute;top:14px;left:18px;',
        'font-family:monospace;font-size:10px;color:rgba(255,136,0,0.7);',
        'letter-spacing:0.18em;}',
      '#drone-rec{position:absolute;top:14px;right:18px;',
        'font-family:monospace;font-size:10px;color:#ff4400;',
        'animation:dronePulse 0.7s step-end infinite;}',
      '#drone-coords{position:absolute;bottom:18px;left:18px;',
        'font-family:monospace;font-size:9px;color:rgba(255,136,0,0.5);}',
      '#drone-reticle{display:none;position:fixed;transform:translate(-50%,-50%);',
        'width:28px;height:28px;pointer-events:none;z-index:311;}',
    ].join('');
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.id = 'drone-overlay';
    el.innerHTML = [
      '<div id="drone-scanline"></div>',
      '<div id="drone-corner"></div>',
      '<div id="drone-label">◉ LANCET FEED · AUTO-SEEK</div>',
      '<div id="drone-rec">● REC</div>',
      '<div id="drone-coords" id="drone-coords">ALT: -- · TGT: --</div>',
    ].join('');
    document.body.appendChild(el);

    /* SVG reticle */
    var ret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ret.id = 'drone-reticle';
    ret.setAttribute('viewBox', '0 0 28 28');
    ret.innerHTML = [
      '<circle cx="14" cy="14" r="10" fill="none" stroke="#ff8800" stroke-width="1.5" opacity="0.8"/>',
      '<line x1="14" y1="4" x2="14" y2="8" stroke="#ff8800" stroke-width="1.5"/>',
      '<line x1="14" y1="20" x2="14" y2="24" stroke="#ff8800" stroke-width="1.5"/>',
      '<line x1="4" y1="14" x2="8" y2="14" stroke="#ff8800" stroke-width="1.5"/>',
      '<line x1="20" y1="14" x2="24" y2="14" stroke="#ff8800" stroke-width="1.5"/>',
      '<circle cx="14" cy="14" r="2" fill="#ff4400"/>',
    ].join('');
    document.body.appendChild(ret);
    _reticleEl = ret;

    return el;
  }

  function _showOverlay(on) {
    if (!_overlay) _overlay = _buildOverlay();
    _overlay.style.display = on ? 'block' : 'none';
    if (_reticleEl) _reticleEl.style.display = 'none';
  }

  /* ── Update overlay coords ──────────────── */
  function _updateOverlay() {
    if (!_drone || !_overlay) return;
    var coordEl = document.getElementById('drone-coords');
    if (coordEl && _drone.mesh) {
      var alt = (_drone.mesh.position.y - _drone.groundY).toFixed(1);
      var tgt = _drone.target ? 'LOCKED' : 'SCANNING';
      coordEl.textContent = 'ALT: ' + alt + 'u  ·  TGT: ' + tgt;
    }

    /* Reticle */
    if (_reticleEl && _drone.target && _drone.target.mesh) {
      var sp = _projectToScreen(_drone.target.mesh.position);
      if (sp && !sp.behind) {
        _reticleEl.style.display = 'block';
        _reticleEl.style.left = sp.x + 'px';
        _reticleEl.style.top  = sp.y + 'px';
      } else {
        _reticleEl.style.display = 'none';
      }
    }
  }

  /* ── Update ──────────────────────────────── */
  function update(dt) {
    _cooldown = Math.max(0, _cooldown - dt);

    /* Restock on wave start */
    try {
      var wave = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;
      if (!_active && _stock === 0 && _cooldown === 0 && wave > 0) {
        // stock is restored by _updateHUD call on wave clear — managed externally
      }
    } catch(e) {}

    if (!_active || !_drone) return;
    _drone.timer += dt;
    var d = _drone;
    var mesh = d.mesh;

    if (d.phase === 'climb') {
      mesh.position.y += CFG.CLIMB_SPEED * dt;
      if (mesh.position.y >= d.groundY + CFG.CRUISE_ALT) {
        mesh.position.y = d.groundY + CFG.CRUISE_ALT;
        d.target = _nearestEnemy(mesh.position);
        d.phase  = d.target ? 'seek' : 'terminal'; // if no target, just crash forward
      }
    } else if (d.phase === 'seek') {
      /* Glide toward target at cruise altitude, then nose-dive */
      if (!d.target || d.target.dead) {
        d.target = _nearestEnemy(mesh.position);
        if (!d.target) { d.phase = 'terminal'; }
      }
      if (d.target) {
        var tp = d.target.mesh.position;
        var dx = tp.x - mesh.position.x;
        var dz = tp.z - mesh.position.z;
        var hd = Math.sqrt(dx*dx + dz*dz);
        if (hd < 12) {
          d.phase = 'terminal';
        } else {
          mesh.position.x += (dx / hd) * CFG.SEEK_SPEED * dt;
          mesh.position.z += (dz / hd) * CFG.SEEK_SPEED * dt;
          mesh.rotation.y  = Math.atan2(dx, dz);
        }
      }
    } else { /* terminal — dive */
      if (!d.target || d.target.dead) d.target = _nearestEnemy(mesh.position);
      if (d.target) {
        var tp2 = d.target.mesh.position;
        var dx2 = tp2.x - mesh.position.x;
        var dy2 = tp2.y - mesh.position.y;
        var dz2 = tp2.z - mesh.position.z;
        var dist3 = Math.sqrt(dx2*dx2 + dy2*dy2 + dz2*dz2);
        if (dist3 < CFG.DETONATE_DST) {
          _detonate(mesh.position.clone());
          return;
        }
        mesh.position.x += (dx2 / dist3) * CFG.TERMINAL_SPD * dt;
        mesh.position.y += (dy2 / dist3) * CFG.TERMINAL_SPD * dt;
        mesh.position.z += (dz2 / dist3) * CFG.TERMINAL_SPD * dt;
        mesh.rotation.y  = Math.atan2(dx2, dz2);
        mesh.rotation.x  = -Math.atan2(dy2, Math.sqrt(dx2*dx2 + dz2*dz2));
      } else {
        /* No enemies — self-destruct after 8s */
        if (d.timer > 8) _detonate(mesh.position.clone());
        mesh.position.y -= CFG.TERMINAL_SPD * 0.5 * dt;
        if (mesh.position.y < d.groundY - 2) _detonate(mesh.position.clone());
      }
    }

    _updateOverlay();
  }

  /* ── HUD ──────────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    if (_active) {
      _hudEl.textContent = '🚀 IN FLIGHT';
      _hudEl.style.color = '#ff8800';
    } else if (_cooldown > 0) {
      _hudEl.textContent = '🚀 ' + Math.ceil(_cooldown) + 's';
      _hudEl.style.color = '#888';
    } else {
      _hudEl.textContent = '🚀 ' + _stock;
      _hudEl.style.color = '#ff8800';
    }
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    _scene   = _getScene();
    _overlay = _buildOverlay();

    _hudEl = document.createElement('div');
    _hudEl.id = 'drone-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:260px;left:12px;font-family:monospace;font-size:11px;',
      'color:#ff8800;background:rgba(0,0,0,0.5);border:1px solid rgba(255,136,0,0.3);',
      'padding:2px 7px;border-radius:4px;z-index:210;pointer-events:none;',
    ].join('');
    _updateHUD();
    document.body.appendChild(_hudEl);

    var hint = document.createElement('div');
    hint.style.cssText = [
      'position:fixed;bottom:260px;left:52px;font-family:monospace;font-size:9px;',
      'color:rgba(255,136,0,0.45);pointer-events:none;z-index:210;line-height:20px;',
    ].join('');
    hint.textContent = '[Alt+X] LANCET';
    document.body.appendChild(hint);

    /* Restock on new wave */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyX' && e.altKey && !e.ctrlKey) {
        e.preventDefault();
        _launch();
      }
    });

    /* rAF loop */
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      _updateHUD();
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  function restock() { if (!_active) { _stock = CFG.STOCK; _cooldown = 0; _updateHUD(); } }

  return { init: init, restock: restock };
})();

window.FPVDrone = FPVDrone;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { FPVDrone.init(); });
} else {
  FPVDrone.init();
}
