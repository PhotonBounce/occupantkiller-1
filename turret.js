/* ============================================================
 *  TURRET.JS — Auto-targeting gun turret (Alt+T)
 *
 *  Alt+T places a stationary machine-gun turret at your position.
 *  The turret autonomously:
 *    • Rotates barrel toward nearest enemy within 28u
 *    • Fires every 0.8s (hitscan, 45 dmg, tracer + muzzle flash)
 *    • Has 200 HP; enemy fire can destroy it (monitored via HP drop)
 *    • Shows HP bar above it and status icon
 *  Max 2 active at once. 1 stock per wave, 15s cooldown.
 * ============================================================ */
var TurretSystem = (function () {
  'use strict';

  var CFG = {
    DETECT_RANGE: 28,
    FIRE_INTERVAL: 0.8,
    FIRE_DAMAGE:  45,
    TURRET_HP:   200,
    STOCK:         1,
    COOLDOWN:  15000,
    MAX_PLACED:    2,
  };

  var _initialized = false;
  var _scene       = null;
  var _turrets     = [];
  var _stock       = CFG.STOCK;
  var _cooldownMs  = 0;
  var _hudEl       = null;
  var _lastTs      = 0;
  var _lastWave    = -1;

  /* ── Build turret mesh ───────────────────── */
  function _buildMesh(scene) {
    var g = new THREE.Group();

    /* Sandbag base (tan/olive) */
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.35, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x9b8860 })
    );
    base.position.y = 0.17;
    g.add(base);

    /* Armored shield plate */
    var shield = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.55, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    shield.position.set(0, 0.55, 0.38);
    g.add(shield);

    /* Gun mount pivot (child group rotates) */
    var pivot = new THREE.Group();
    pivot.position.set(0, 0.6, 0.1);
    pivot.userData.isPivot = true;

    /* Gun body */
    var gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.55),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    gunBody.position.z = 0.2;
    pivot.add(gunBody);

    /* Barrel */
    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.6;
    pivot.add(barrel);

    /* Muzzle light */
    var muzzle = new THREE.PointLight(0xffaa44, 0, 5);
    muzzle.position.z = 0.85;
    muzzle.userData.isMuzzle = true;
    pivot.add(muzzle);

    /* Barrel tip (for tracer origin) */
    var tip = new THREE.Group();
    tip.position.z = 0.85;
    tip.userData.isBarrelTip = true;
    pivot.add(tip);

    g.add(pivot);

    /* Team indicator light (green LED) */
    var led = new THREE.PointLight(0x00ff44, 0.4, 2);
    led.position.set(0, 0.85, 0.3);
    led.userData.isLED = true;
    g.add(led);

    /* Friendly indicator diamond */
    var ind = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09, 0),
      new THREE.MeshBasicMaterial({ color: 0x44ff88 })
    );
    ind.position.y = 1.1;
    ind.userData.isIndicator = true;
    g.add(ind);

    scene.add(g);
    return g;
  }

  /* ── HP bar DOM ─────────────────────────── */
  function _buildHpBar() {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;z-index:218;pointer-events:none;transform:translate(-50%,-100%);display:none;';
    var lbl = document.createElement('div');
    lbl.style.cssText = 'font-family:monospace;font-size:7px;color:#44ff88;text-align:center;margin-bottom:1px;letter-spacing:0.08em;';
    lbl.textContent = '⚙ AUTO-GUN';
    var bar = document.createElement('div');
    bar.style.cssText = 'width:38px;height:4px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,0,0,0.3);';
    var fill = document.createElement('div');
    fill.style.cssText = 'height:100%;background:#44ff88;width:100%;transition:width 0.15s;';
    bar.appendChild(fill);
    wrap.appendChild(lbl);
    wrap.appendChild(bar);
    document.body.appendChild(wrap);
    return { wrap: wrap, fill: fill };
  }

  /* ── Place a turret ──────────────────────── */
  function _place() {
    if (_stock <= 0 || _cooldownMs > 0) return;
    if (_turrets.length >= CFG.MAX_PLACED) {
      try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('MAX 2 TURRETS ACTIVE', '#ffcc44'); } catch(e){}
      return;
    }
    var player = window.player;
    if (!player || !player.position) return;
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){}
    }
    if (!_scene) return;

    _stock--;
    _cooldownMs = CFG.COOLDOWN;
    _updateHUD();

    /* Place 2u in front of player */
    var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
    var dir = new THREE.Vector3(0, 0, 1);
    if (cam) { cam.getWorldDirection(dir); dir.y = 0; dir.normalize(); }

    var ty = 0;
    try { ty = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ? VoxelWorld.getTerrainHeight(player.position.x + dir.x*2, player.position.z + dir.z*2) : 0; } catch(e){}

    var mesh = _buildMesh(_scene);
    mesh.position.set(player.position.x + dir.x * 2, ty, player.position.z + dir.z * 2);
    /* Face the direction the player is looking */
    mesh.rotation.y = Math.atan2(dir.x, dir.z);

    var hpBar = _buildHpBar();
    var turret = {
      mesh:      mesh,
      hp:        CFG.TURRET_HP,
      maxHp:     CFG.TURRET_HP,
      fireTimer: 0,
      target:    null,
      hpBar:     hpBar,
      muzzleT:   0,
    };
    _turrets.push(turret);

    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('⚙ AUTO-GUN DEPLOYED', '#44ff88'); } catch(e){}
  }

  /* ── Find nearest enemy to a turret ─────── */
  function _findTarget(turret) {
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return null;
      var pos = turret.mesh.position;
      var all = Enemies.getAll();
      var best = null, bestD = CFG.DETECT_RANGE;
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || e.dead) continue;
        var dx = e.mesh.position.x - pos.x;
        var dz = e.mesh.position.z - pos.z;
        var d  = Math.sqrt(dx*dx + dz*dz);
        if (d < bestD) { bestD = d; best = e; }
      }
      return best;
    } catch(ex){ return null; }
  }

  /* ── Fire at target ─────────────────────── */
  function _fire(turret) {
    var pivot = null;
    var tip   = null;
    turret.mesh.children.forEach(function (c) {
      if (c.userData.isPivot) pivot = c;
    });
    if (!pivot) return;
    pivot.children.forEach(function (c) {
      if (c.userData.isBarrelTip) tip = c;
      if (c.userData.isMuzzle) { c.intensity = 3; turret.muzzleT = 0.06; }
    });

    /* Barrel tip world position */
    var tipWorld = new THREE.Vector3();
    if (tip) tip.getWorldPosition(tipWorld);
    else turret.mesh.getWorldPosition(tipWorld);

    /* Shoot */
    try {
      if (turret.target && turret.target.mesh) {
        var tpos = turret.target.mesh.position;
        var dir  = tpos.clone().sub(tipWorld).normalize();
        if (typeof Tracers !== 'undefined' && Tracers.spawnTracer) {
          Tracers.spawnTracer(tipWorld, dir, 0xffcc44, 200);
        }
        if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
          Enemies.damageInRadius(tpos, 1, CFG.FIRE_DAMAGE);
        }
        if (typeof Tracers !== 'undefined' && Tracers.spawnBlood) {
          Tracers.spawnBlood(tpos, new THREE.Vector3(0, 1, 0));
        }
      }
    } catch(e){}
  }

  /* ── Update HP bar screen position ─────── */
  function _updateHpBar(turret) {
    if (!turret.hpBar) return;
    var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
    if (!cam) return;
    try {
      var p = turret.mesh.position.clone(); p.y += 1.4;
      var v = p.project(cam);
      if (v.z > 1) { turret.hpBar.wrap.style.display = 'none'; return; }
      turret.hpBar.wrap.style.display = 'block';
      turret.hpBar.wrap.style.left = ((v.x+1)*0.5*window.innerWidth) + 'px';
      turret.hpBar.wrap.style.top  = ((-v.y+1)*0.5*window.innerHeight) + 'px';
      turret.hpBar.fill.style.width = Math.max(0, turret.hp / turret.maxHp * 100) + '%';
      turret.hpBar.fill.style.background = turret.hp > 100 ? '#44ff88' : turret.hp > 50 ? '#ffcc44' : '#ff4422';
    } catch(e){}
  }

  /* ── Destroy turret ─────────────────────── */
  function _destroy(turret, idx) {
    try {
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
        Tracers.spawnExplosion(turret.mesh.position, 1.5);
      }
    } catch(e){}
    if (_scene) _scene.remove(turret.mesh);
    if (turret.hpBar) {
      turret.hpBar.wrap.style.display = 'none';
      if (turret.hpBar.wrap.parentNode) turret.hpBar.wrap.parentNode.removeChild(turret.hpBar.wrap);
    }
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('⚙ AUTO-GUN DESTROYED', '#ff4422'); } catch(e){}
    _turrets.splice(idx, 1);
    _updateHUD();
  }

  /* ── HUD chip ───────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var ready = _cooldownMs <= 0 && _stock > 0;
    var suf   = _cooldownMs > 0 ? ' <span style="color:rgba(68,255,136,0.3);font-size:8px">' + Math.ceil(_cooldownMs/1000) + 's</span>' : '';
    _hudEl.innerHTML = '[Alt+T] TURRET ×' + _stock + '  ACTIVE:' + _turrets.length + suf;
    _hudEl.style.color = ready ? '#44ff88' : 'rgba(68,255,136,0.35)';
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

    /* Wave restock */
    try {
      var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;
      if (w !== _lastWave && w > 0) {
        _lastWave = w;
        _stock = CFG.STOCK;
        _cooldownMs = 0;
        _updateHUD();
      }
    } catch(e){}

    /* Update each turret */
    for (var i = _turrets.length - 1; i >= 0; i--) {
      var t = _turrets[i];

      /* Muzzle flash decay */
      if (t.muzzleT > 0) {
        t.muzzleT -= dt;
        t.mesh.children.forEach(function (c) {
          if (c.userData.isPivot) c.children.forEach(function (cc) {
            if (cc.userData.isMuzzle) cc.intensity = t.muzzleT > 0 ? 3*(t.muzzleT/0.06) : 0;
          });
        });
      }

      /* Indicator spin */
      t.mesh.children.forEach(function (c) {
        if (c.userData.isIndicator) c.rotation.y += dt * 2;
      });

      /* Find target */
      t.target = _findTarget(t);

      if (t.target && t.target.mesh) {
        /* Aim pivot at target */
        var pivot = null;
        t.mesh.children.forEach(function (c) { if (c.userData.isPivot) pivot = c; });
        if (pivot) {
          var dx = t.target.mesh.position.x - t.mesh.position.x;
          var dz = t.target.mesh.position.z - t.mesh.position.z;
          var targetYaw = Math.atan2(dx, dz);
          /* Account for turret's own rotation */
          var relYaw = targetYaw - t.mesh.rotation.y;
          pivot.rotation.y += (relYaw - pivot.rotation.y) * Math.min(1, dt * 5);
        }

        /* Fire */
        t.fireTimer -= dt;
        if (t.fireTimer <= 0) {
          _fire(t);
          t.fireTimer = CFG.FIRE_INTERVAL * (0.9 + Math.random() * 0.2);
        }
      }

      /* Turret damage simulation — check if any enemy is attacking it */
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var ei = 0; ei < all.length; ei++) {
            var e = all[ei];
            if (!e || !e.mesh || e.dead) continue;
            var edx = e.mesh.position.x - t.mesh.position.x;
            var edz = e.mesh.position.z - t.mesh.position.z;
            var ed  = Math.sqrt(edx*edx + edz*edz);
            /* Enemies within 20u occasionally damage the turret */
            if (ed < 20 && !e._turretFireT) {
              e._turretFireT = 3 + Math.random() * 3;
            }
            if (e._turretFireT) {
              e._turretFireT -= dt;
              if (e._turretFireT <= 0) {
                delete e._turretFireT;
                if (ed < 25) { t.hp -= 15 + Math.random() * 20; }
              }
            }
          }
        }
      } catch(ex){}

      /* Check destruction */
      if (t.hp <= 0) { _destroy(t, i); continue; }

      /* HP bar */
      _updateHpBar(t);
    }

    if (Math.round(ts/16) % 90 === 0) _updateHUD();
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'turret-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:430px;left:52px;font-family:monospace;font-size:9px;',
      'pointer-events:none;z-index:210;line-height:20px;letter-spacing:0.08em;',
    ].join('');
    document.body.appendChild(_hudEl);
    _updateHUD();

    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyT' && e.altKey && !e.ctrlKey) {
        e.preventDefault();
        _place();
      }
    });

    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.TurretSystem = TurretSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TurretSystem.init(); });
} else {
  TurretSystem.init();
}
