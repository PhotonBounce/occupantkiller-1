/* ============================================================
 *  RECON-UAV.JS — Autonomous reconnaissance drone (F8)
 *
 *  Press F8 to launch a small scout UAV. It climbs, flies to a
 *  scouting position 70u ahead, circles for 20s pinging enemy
 *  positions to the minimap, then auto-returns.
 *
 *  Features:
 *    • 3D drone mesh (body + 4 arm + rotor discs)
 *    • Thermal HUD window (top-right corner, 180×120 canvas)
 *      showing orange enemy silhouettes under the UAV
 *    • Minimap integration: spotted enemies show as orange
 *      pulsing dots for 18s (via window._uavSpottedEnemies Set)
 *    • Ping animation (radar sweep circle) on spot
 *    • 1 stock per wave, 75s cooldown
 * ============================================================ */
var ReconUAV = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    ALTITUDE:     12,     /* cruise height above terrain */
    FWD_DIST:     70,     /* scout point distance ahead */
    ORBIT_RADIUS: 35,     /* orbit radius around scout point */
    ORBIT_SPD:    0.9,    /* rad/s */
    CLIMB_SPD:    8,      /* u/s climb */
    FLY_SPD:      18,     /* u/s transit */
    SCAN_RANGE:   30,     /* enemy detection range from UAV */
    SCAN_INTERVAL:1.2,    /* seconds between scans */
    SCOUT_TIME:   20,     /* seconds of orbiting */
    MARK_TTL:     18,     /* seconds spotted marker lasts */
    COOLDOWN:     75000,  /* ms */
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _active      = false;
  var _stock       = 1;
  var _cooldownMs  = 0;
  var _phase       = 0;   /* 0=idle 1=climb 2=transit 3=orbit 4=return */
  var _mesh        = null;
  var _scene       = null;
  var _orbitAngle  = 0;
  var _scoutPoint  = null;
  var _orbitT      = 0;
  var _scanT       = 0;
  var _hudEl       = null;
  var _thermal     = null; /* canvas */
  var _thermalCtx  = null;
  var _pings       = [];   /* { pos, t } ping ripples */
  var _lastTs      = 0;

  /* exposed for minimap integration */
  window._uavSpottedEnemies = window._uavSpottedEnemies || new Map(); /* enemy → expiry ms */

  /* ── Build drone mesh ───────────────────── */
  function _buildMesh(scene) {
    var g = new THREE.Group();

    /* Body */
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.18, 0.45),
      new THREE.MeshLambertMaterial({ color: 0x223344 })
    );
    g.add(body);

    /* Camera dome on bottom */
    var dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    dome.position.y = -0.1;
    g.add(dome);

    /* 4 arms + rotor discs */
    var armDirs = [[1,1],[-1,1],[1,-1],[-1,-1]];
    armDirs.forEach(function (dir) {
      var arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.04, 0.06),
        new THREE.MeshLambertMaterial({ color: 0x334455 })
      );
      arm.position.set(dir[0] * 0.3, 0, dir[1] * 0.3);
      arm.rotation.y = Math.PI / 4;
      g.add(arm);

      /* Rotor disc */
      var rotor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.02, 10),
        new THREE.MeshLambertMaterial({ color: 0x445566, transparent: true, opacity: 0.55 })
      );
      rotor.position.set(dir[0] * 0.42, 0.06, dir[1] * 0.42);
      rotor.userData.isRotor = true;
      g.add(rotor);
    });

    /* LED light — red blink */
    var led = new THREE.PointLight(0xff2200, 0.8, 5);
    led.userData.isLED = true;
    g.add(led);

    scene.add(g);
    return g;
  }

  /* ── Helpers ────────────────────────────── */
  function _getCamera() { try { return window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch(e){return null;} }
  function _getPlayer() { try { return window.player || null; } catch(e){return null;} }
  function _terrainY(x, z) { try { return (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ? VoxelWorld.getTerrainHeight(x, z) : 0; } catch(e){return 0;} }

  /* ── Scan enemies (mark spotted ones) ──── */
  function _scan() {
    if (!_mesh) return;
    var now = Date.now();
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || e.dead) continue;
        var dx = e.mesh.position.x - _mesh.position.x;
        var dz = e.mesh.position.z - _mesh.position.z;
        var dy = e.mesh.position.y - _mesh.position.y;
        var d  = Math.sqrt(dx*dx + dz*dz + dy*dy);
        if (d > CFG.SCAN_RANGE) continue;
        /* Mark enemy */
        window._uavSpottedEnemies.set(e, now + CFG.MARK_TTL * 1000);
        /* Add ping ripple */
        _pings.push({ pos: e.mesh.position.clone(), t: 0 });
      }
    } catch(err) {}
  }

  /* ── Draw thermal feed ──────────────────── */
  function _drawThermal() {
    if (!_thermalCtx || !_mesh) return;
    var ctx = _thermalCtx;
    var tw = 180, th = 120;
    ctx.fillStyle = '#000810';
    ctx.fillRect(0, 0, tw, th);

    /* Border */
    ctx.strokeStyle = 'rgba(255,120,0,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, tw, th);

    /* Header */
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = 'rgba(255,120,0,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('▶ THERMAL  UAV-1', 6, 11);
    var ts = new Date().toTimeString().substr(0, 8);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,100,0,0.6)';
    ctx.fillText(ts, tw - 4, 11);

    /* Ground grid */
    ctx.strokeStyle = 'rgba(50,80,40,0.3)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < tw; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, 12); ctx.lineTo(gx, th); ctx.stroke(); }
    for (var gy = 12; gy < th; gy += 20) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(tw, gy); ctx.stroke(); }

    /* Enemies relative to UAV position */
    var mx = _mesh.position.x, mz = _mesh.position.z;
    var SCALE = 1.6;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh || e.dead) continue;
          var dx = (e.mesh.position.x - mx) * SCALE;
          var dz = (e.mesh.position.z - mz) * SCALE;
          var sx = tw/2 + dx, sy = th/2 + dz;
          if (sx < 2 || sx > tw-2 || sy < 14 || sy > th-2) continue;
          var spotted = window._uavSpottedEnemies.has(e);
          /* Heat blob */
          var hg = ctx.createRadialGradient(sx, sy, 0, sx, sy, spotted ? 8 : 5);
          hg.addColorStop(0, spotted ? 'rgba(255,200,50,0.95)' : 'rgba(255,100,0,0.7)');
          hg.addColorStop(1, 'rgba(255,50,0,0)');
          ctx.fillStyle = hg;
          ctx.fillRect(sx - 8, sy - 8, 16, 16);
        }
      }
    } catch(err) {}

    /* Ping ripples */
    for (var pi = _pings.length - 1; pi >= 0; pi--) {
      var pg = _pings[pi];
      var pr = pg.t * 60;
      if (pr > tw) { _pings.splice(pi, 1); continue; }
      var pdx = (pg.pos.x - mx) * SCALE;
      var pdz = (pg.pos.z - mz) * SCALE;
      ctx.strokeStyle = 'rgba(255,200,0,' + (1 - pg.t / 1.2) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tw/2 + pdx, th/2 + pdz, pr, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* UAV center cross */
    ctx.strokeStyle = 'rgba(0,255,100,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tw/2-6, th/2); ctx.lineTo(tw/2+6, th/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tw/2, th/2-6); ctx.lineTo(tw/2, th/2+6); ctx.stroke();
    ctx.beginPath();
    ctx.arc(tw/2, th/2, 4, 0, Math.PI*2);
    ctx.stroke();

    /* Altitude readout */
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(255,120,0,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('ALT ' + Math.round(_mesh.position.y) + 'u', 4, th - 4);
    var spottedCount = 0;
    window._uavSpottedEnemies.forEach(function () { spottedCount++; });
    ctx.textAlign = 'right';
    ctx.fillText('TGT ' + spottedCount, tw - 4, th - 4);
  }

  /* ── Update HUD chip ──────────────────────*/
  function _updateHUD() {
    if (!_hudEl) return;
    var ready = _cooldownMs <= 0 && _stock > 0;
    var label  = _active ? '🚁 RECON IN FLIGHT' : ('[F8] RECON ×' + _stock);
    var suf    = (!_active && _cooldownMs > 0) ? ' <span style="color:rgba(255,255,255,0.3);font-size:8px">' + Math.ceil(_cooldownMs/1000) + 's</span>' : '';
    _hudEl.innerHTML = label + suf;
    _hudEl.style.color = ready || _active ? '#aaffcc' : 'rgba(170,255,200,0.3)';
  }

  /* ── Launch ─────────────────────────────── */
  function _launch() {
    if (_active || _stock <= 0 || _cooldownMs > 0) return;
    var player = _getPlayer();
    if (!player || !player.position) return;
    var cam = _getCamera();
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){}
    }
    if (!_scene) return;

    _stock--;
    _active = true;
    _phase  = 1; /* climb */
    _orbitT = 0;
    _scanT  = 0;

    /* Build mesh */
    if (!_mesh) _mesh = _buildMesh(_scene);
    _mesh.position.set(player.position.x, player.position.y + 1, player.position.z);
    _mesh.visible = true;

    /* Compute scout point ahead */
    var fwd = new THREE.Vector3();
    if (cam) { cam.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); }
    else { fwd.set(0, 0, 1); }
    _scoutPoint = new THREE.Vector3(
      player.position.x + fwd.x * CFG.FWD_DIST,
      0,
      player.position.z + fwd.z * CFG.FWD_DIST
    );
    _scoutPoint.y = _terrainY(_scoutPoint.x, _scoutPoint.z) + CFG.ALTITUDE;
    _orbitAngle = Math.random() * Math.PI * 2;

    /* Show thermal window */
    if (_thermal) _thermal.parentNode.style.display = 'block';
    _updateHUD();
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('🚁 RECON UAV LAUNCHED', '#aaffcc'); } catch(e){}
  }

  /* ── End flight ─────────────────────────── */
  function _land() {
    _active = false;
    _phase  = 0;
    _cooldownMs = CFG.COOLDOWN;
    if (_mesh) _mesh.visible = false;
    if (_thermal) _thermal.parentNode.style.display = 'none';
    _updateHUD();
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('🚁 RECON UAV RETURNED', '#aaffcc'); } catch(e){}
  }

  /* ── Per-frame update ───────────────────── */
  function _update(dt) {
    if (!_active || !_mesh) return;

    /* Spin rotors */
    _mesh.children.forEach(function (c) {
      if (c.userData && c.userData.isRotor) c.rotation.y += dt * 20;
      if (c.userData && c.userData.isLED) {
        c.intensity = 0.5 + 0.5 * Math.sin(Date.now() / 150);
      }
    });

    var player = _getPlayer();

    if (_phase === 1) {
      /* Climb */
      var targetY = (_mesh.position.y > 0 ? _mesh.position.y : 1) + CFG.ALTITUDE;
      if (player) targetY = player.position.y + CFG.ALTITUDE;
      _mesh.position.y = Math.min(targetY, _mesh.position.y + CFG.CLIMB_SPD * dt);
      if (_mesh.position.y >= targetY - 0.5) { _phase = 2; }

    } else if (_phase === 2) {
      /* Fly to scout point */
      var dx = _scoutPoint.x - _mesh.position.x;
      var dz = _scoutPoint.z - _mesh.position.z;
      var d  = Math.sqrt(dx*dx + dz*dz);
      if (d < 2) {
        _phase = 3;
        _orbitT = 0;
      } else {
        var spd = Math.min(CFG.FLY_SPD * dt, d);
        _mesh.position.x += (dx / d) * spd;
        _mesh.position.z += (dz / d) * spd;
        _mesh.position.y += (_scoutPoint.y - _mesh.position.y) * Math.min(1, dt * 3);
      }

    } else if (_phase === 3) {
      /* Orbit + scan */
      _orbitT += dt;
      _scanT  += dt;
      _orbitAngle += CFG.ORBIT_SPD * dt;

      _mesh.position.x = _scoutPoint.x + Math.cos(_orbitAngle) * CFG.ORBIT_RADIUS;
      _mesh.position.z = _scoutPoint.z + Math.sin(_orbitAngle) * CFG.ORBIT_RADIUS;
      _mesh.position.y = _scoutPoint.y;
      _mesh.rotation.y = _orbitAngle + Math.PI / 2;

      /* Periodic scan */
      if (_scanT >= CFG.SCAN_INTERVAL) {
        _scanT = 0;
        _scan();
      }

      /* Advance pings */
      for (var i = 0; i < _pings.length; i++) _pings[i].t += dt;

      /* Expire spotter marks */
      var now = Date.now();
      window._uavSpottedEnemies.forEach(function (expiry, enemy) {
        if (now > expiry) window._uavSpottedEnemies.delete(enemy);
      });

      if (_orbitT >= CFG.SCOUT_TIME) { _phase = 4; }

    } else if (_phase === 4) {
      /* Return to player */
      if (!player) { _land(); return; }
      var tx = player.position.x;
      var tz = player.position.z;
      var ty = player.position.y + 1.5;
      var rdx = tx - _mesh.position.x;
      var rdz = tz - _mesh.position.z;
      var rd  = Math.sqrt(rdx*rdx + rdz*rdz);
      if (rd < 2) { _land(); return; }
      var rs = Math.min(CFG.FLY_SPD * dt, rd);
      _mesh.position.x += (rdx / rd) * rs;
      _mesh.position.z += (rdz / rd) * rs;
      _mesh.position.y += (ty - _mesh.position.y) * Math.min(1, dt * 2);
    }
  }

  /* ── rAF tick ──────────────────────────── */
  var _frameN = 0;
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    if (_cooldownMs > 0) {
      _cooldownMs = Math.max(0, _cooldownMs - dt * 1000);
      if (_cooldownMs === 0 && _stock > 0) _updateHUD();
    }

    _update(dt);

    /* Draw thermal every 2 frames */
    if (_active && _frameN % 2 === 0) {
      try { _drawThermal(); } catch(e){}
    }
  }

  /* ── Restock on wave change ─────────────── */
  function _hookWave() {
    var lastWave = -1;
    setInterval(function () {
      try {
        var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;
        if (w !== lastWave && w > 0) {
          lastWave = w;
          if (!_active) { _stock = 1; _cooldownMs = 0; _updateHUD(); }
        }
      } catch(e){}
    }, 2000);
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    /* Thermal window */
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed;top:44px;left:10px;z-index:210;pointer-events:none;',
      'display:none;',
    ].join('');

    _thermal = document.createElement('canvas');
    _thermal.width  = 180;
    _thermal.height = 120;
    _thermal.style.cssText = 'display:block;border:1px solid rgba(255,100,0,0.4);box-shadow:0 0 8px rgba(255,80,0,0.2);';
    _thermalCtx = _thermal.getContext('2d');
    wrap.appendChild(_thermal);
    document.body.appendChild(wrap);

    /* HUD chip */
    _hudEl = document.createElement('div');
    _hudEl.id = 'uav-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:330px;left:52px;font-family:monospace;font-size:9px;',
      'pointer-events:none;z-index:210;line-height:20px;letter-spacing:0.08em;',
    ].join('');
    document.body.appendChild(_hudEl);
    _updateHUD();

    /* Key binding */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'F8' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        _launch();
      }
    });

    _hookWave();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ReconUAV = ReconUAV;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ReconUAV.init(); });
} else {
  ReconUAV.init();
}
