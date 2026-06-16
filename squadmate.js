/* ============================================================
 *  SQUADMATE.JS — AI friendly soldier (Alt+S)
 *
 *  Press Alt+S to call in a friendly squadmate. They spawn
 *  beside you, follow at 3-4u distance, auto-detect and shoot
 *  enemies (hitscan, 1-2s interval), and die if their HP hits 0.
 *
 *  Features:
 *    • 3D humanoid mesh (torso, head, arms, legs, helmet, rifle)
 *    • Pathfinding: direct follow + strafing when under fire
 *    • Fire visual: muzzle flash point-light + tracer via Tracers
 *    • HP bar above head (DOM element)
 *    • Death animation: stumble + fade
 *    • 1 active at a time. Restocks between waves.
 *    • Radio callout on spawn/death via Feedback.radioChatter
 * ============================================================ */
var Squadmate = (function () {
  'use strict';

  var CFG = {
    FOLLOW_DIST:   3.5,    /* target distance behind player */
    MOVE_SPD:      6.5,    /* world units/s */
    DETECT_RANGE:  40,
    FIRE_RANGE:    35,
    FIRE_INTERVAL: 1.4,    /* seconds between shots */
    FIRE_DAMAGE:   38,
    MAX_HP:        80,
    SHOOT_SPREAD:  0.08,   /* accuracy spread (radians) */
  };

  var _initialized = false;
  var _scene       = null;
  var _group       = null;
  var _hp          = CFG.MAX_HP;
  var _alive       = false;
  var _active      = false;   /* currently deployed */
  var _fireTimer   = 0;
  var _target      = null;    /* current enemy target */
  var _hpBarEl     = null;
  var _hudEl       = null;
  var _deathT      = 0;       /* >0 = playing death anim */
  var _lastTs      = 0;
  var _lastWave    = -1;
  var _muzzleLight = null;
  var _muzzleT     = 0;
  var _rifleBarrel = null;    /* world-space barrel end group */
  var _stock       = 1;
  var _cooldownMs  = 0;

  /* ── Build humanoid mesh ─────────────────── */
  function _buildMesh(scene) {
    var g = new THREE.Group();

    var OD = new THREE.MeshLambertMaterial({ color: 0x4a5a30 }); /* OD green */
    var DARK = new THREE.MeshLambertMaterial({ color: 0x2a3020 });
    var SKIN = new THREE.MeshLambertMaterial({ color: 0xc8a882 });
    var HELM = new THREE.MeshLambertMaterial({ color: 0x3a4428 });
    var RIFLE_M = new THREE.MeshLambertMaterial({ color: 0x222222 });

    /* Torso */
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.28), OD);
    torso.position.y = 0.95;
    g.add(torso);

    /* Head */
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), SKIN);
    head.position.y = 1.45;
    g.add(head);

    /* Helmet */
    var helm = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.14, 8), HELM);
    helm.position.y = 1.61;
    g.add(helm);

    /* Arms */
    [[-0.38], [0.38]].forEach(function (xArr) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.16), OD);
      arm.position.set(xArr[0], 0.85, 0);
      g.add(arm);
    });

    /* Legs */
    [[-0.14], [0.14]].forEach(function (xArr) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 0.2), DARK);
      leg.position.set(xArr[0], 0.31, 0);
      g.add(leg);
    });

    /* Boots */
    [[-0.14], [0.14]].forEach(function (xArr) {
      var boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.26), DARK);
      boot.position.set(xArr[0], 0.07, 0.04);
      g.add(boot);
    });

    /* Rifle body */
    var rfBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), RIFLE_M);
    rfBody.position.set(0.32, 1.0, 0.32);
    rfBody.rotation.x = 0.15;
    g.add(rfBody);

    /* Barrel end marker group (for muzzle flash position) */
    var barrel = new THREE.Group();
    barrel.position.set(0.32, 1.0, 0.58);
    g.add(barrel);
    _rifleBarrel = barrel;

    /* Muzzle flash light */
    _muzzleLight = new THREE.PointLight(0xffaa44, 0, 6);
    barrel.add(_muzzleLight);

    /* Friendly indicator — green diamond above head */
    var indicator = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.1, 0),
      new THREE.MeshBasicMaterial({ color: 0x44ff88 })
    );
    indicator.position.y = 1.85;
    indicator.userData.isIndicator = true;
    g.add(indicator);

    scene.add(g);
    return g;
  }

  /* ── HP bar DOM ─────────────────────────── */
  function _buildHPBar() {
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed;z-index:220;pointer-events:none;',
      'display:none;transform:translate(-50%,-100%);',
    ].join('');
    var bar = document.createElement('div');
    bar.style.cssText = [
      'width:42px;height:5px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,0,0,0.3);',
    ].join('');
    var fill = document.createElement('div');
    fill.style.cssText = 'height:100%;background:#44ff88;width:100%;transition:width 0.2s;';
    bar.appendChild(fill);
    var label = document.createElement('div');
    label.style.cssText = 'font-family:monospace;font-size:8px;color:#44ff88;text-align:center;margin-bottom:2px;letter-spacing:0.05em;';
    label.textContent = 'VOLKOV';
    wrap.appendChild(label);
    wrap.appendChild(bar);
    document.body.appendChild(wrap);
    return { wrap: wrap, fill: fill };
  }

  /* ── Update HP bar screen position ─────── */
  function _updateHPBar() {
    if (!_hpBarEl || !_group) return;
    var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
    if (!cam) return;
    try {
      var headPos = _group.position.clone();
      headPos.y += 2.0;
      var v = headPos.project(cam);
      if (v.z > 1) { _hpBarEl.wrap.style.display = 'none'; return; }
      var sx = (v.x + 1) * 0.5 * window.innerWidth;
      var sy = (-v.y + 1) * 0.5 * window.innerHeight;
      _hpBarEl.wrap.style.display = 'block';
      _hpBarEl.wrap.style.left = sx + 'px';
      _hpBarEl.wrap.style.top  = sy + 'px';
      _hpBarEl.fill.style.width = Math.max(0, (_hp / CFG.MAX_HP) * 100) + '%';
      _hpBarEl.fill.style.background = _hp > 40 ? '#44ff88' : _hp > 20 ? '#ffcc44' : '#ff4422';
    } catch(e){}
  }

  /* ── Shoot at target ─────────────────────── */
  function _shoot(target) {
    if (!_group || !target || !target.mesh) return;
    var barrelWorld = new THREE.Vector3();
    _rifleBarrel.getWorldPosition(barrelWorld);

    /* Muzzle flash */
    _muzzleLight.intensity = 3;
    _muzzleT = 0.08;

    /* Tracer */
    try {
      if (typeof Tracers !== 'undefined' && Tracers.spawnTracer) {
        var dir = target.mesh.position.clone().sub(barrelWorld).normalize();
        Tracers.spawnTracer(barrelWorld, dir, 0x44ff88, 180);
      }
    } catch(e) {}

    /* Damage with spread */
    try {
      var spread = CFG.SHOOT_SPREAD;
      var dx = target.mesh.position.x - barrelWorld.x + (Math.random()-0.5)*spread*10;
      var dz = target.mesh.position.z - barrelWorld.z + (Math.random()-0.5)*spread*10;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < CFG.FIRE_RANGE) {
        if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
          Enemies.damageInRadius(target.mesh.position, 1.2, CFG.FIRE_DAMAGE);
        }
      }
    } catch(e) {}

    /* Blood splash */
    try { if (typeof Tracers !== 'undefined' && Tracers.spawnBlood) Tracers.spawnBlood(target.mesh.position, new THREE.Vector3(0,1,0)); } catch(e){}
  }

  /* ── Find nearest enemy ─────────────────── */
  function _findTarget() {
    if (!_group) return null;
    var best = null, bestD = CFG.DETECT_RANGE;
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return null;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || e.dead) continue;
        var dx = e.mesh.position.x - _group.position.x;
        var dz = e.mesh.position.z - _group.position.z;
        var d  = Math.sqrt(dx*dx + dz*dz);
        if (d < bestD) { bestD = d; best = e; }
      }
    } catch(e){}
    return best;
  }

  /* ── Spawn at player position ───────────── */
  function _spawn() {
    if (_active || _stock <= 0 || _cooldownMs > 0) return;
    var player = window.player;
    if (!player || !player.position) return;
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){}
    }
    if (!_scene) return;

    _stock--;
    _active = true;
    _alive  = true;
    _hp     = CFG.MAX_HP;
    _fireTimer = 0;
    _deathT = 0;
    _updateHUD();

    if (!_group) {
      _group = _buildMesh(_scene);
      _hpBarEl = _buildHPBar();
    } else {
      _group.visible = true;
      _group.rotation.set(0, 0, 0);
      _group.position.set(0, 0, 0);
    }

    _group.position.set(
      player.position.x + 2,
      player.position.y,
      player.position.z + 2
    );

    try { if (window.Feedback && Feedback.radioChatter) Feedback.radioChatter('reinforcements'); } catch(e){}
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('🪖 VOLKOV IN POSITION', '#44ff88'); } catch(e){}
  }

  /* ── Take damage (called by morale or when enemies fire back) ─ */
  function takeDamage(amt) {
    if (!_alive) return;
    _hp = Math.max(0, _hp - amt);
    if (_hp <= 0) _die();
  }

  /* ── Death ──────────────────────────────── */
  function _die() {
    _alive  = false;
    _active = false;
    _deathT = 2.0;
    _cooldownMs = 0; /* no cooldown — gone for the wave */
    if (_hpBarEl) _hpBarEl.wrap.style.display = 'none';
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('☠ VOLKOV DOWN', '#ff4422'); } catch(e){}
    try { if (window.Feedback && Feedback.radioChatter) Feedback.radioChatter('man_down'); } catch(e){}
    _updateHUD();
  }

  /* ── HUD chip ────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var label, color;
    if (_active && _alive) {
      label = '🪖 VOLKOV  HP:' + _hp;
      color = '#44ff88';
    } else if (_cooldownMs > 0) {
      label = '[Alt+S] SQUAD  <span style="color:rgba(68,255,136,0.3);font-size:8px">' + Math.ceil(_cooldownMs/1000) + 's</span>';
      color = 'rgba(68,255,136,0.4)';
    } else if (_stock > 0) {
      label = '[Alt+S] CALL SQUAD ×' + _stock;
      color = '#44ff88';
    } else {
      label = 'VOLKOV KIA';
      color = 'rgba(255,68,34,0.6)';
    }
    _hudEl.innerHTML = label;
    _hudEl.style.color = color;
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

    /* Wave detection for restock */
    try {
      var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : -1;
      if (w !== _lastWave && w > 0) {
        _lastWave = w;
        if (!_active) { _stock = 1; _updateHUD(); }
        if (_active && _alive) {
          /* Clear wave — stay alive into next */
        }
      }
    } catch(e){}

    /* Indicator rotation */
    if (_group) {
      _group.children.forEach(function (c) {
        if (c.userData && c.userData.isIndicator) c.rotation.y += dt * 2;
      });
    }

    /* Muzzle flash decay */
    if (_muzzleT > 0) {
      _muzzleT -= dt;
      if (_muzzleLight) _muzzleLight.intensity = _muzzleT > 0 ? 3 * (_muzzleT / 0.08) : 0;
    }

    /* Death animation */
    if (_deathT > 0) {
      _deathT -= dt;
      if (_group) {
        _group.rotation.z = Math.min(Math.PI / 2, _group.rotation.z + dt * 2);
        _group.children.forEach(function (c) {
          if (c.material) { c.material.transparent = true; c.material.opacity = Math.max(0, _deathT / 2); }
        });
      }
      if (_deathT <= 0 && _group) {
        _group.visible = false;
        _group.rotation.set(0, 0, 0);
      }
      return;
    }

    if (!_active || !_alive || !_group) return;

    var player = window.player;
    if (!player || !player.position) return;

    /* Follow player */
    var pdx = player.position.x - _group.position.x;
    var pdz = player.position.z - _group.position.z;
    var pd  = Math.sqrt(pdx*pdx + pdz*pdz);

    if (pd > CFG.FOLLOW_DIST + 1.5) {
      /* Move toward player */
      var spd = Math.min(CFG.MOVE_SPD * dt, pd - CFG.FOLLOW_DIST);
      _group.position.x += (pdx / pd) * spd;
      _group.position.z += (pdz / pd) * spd;
    }

    /* Terrain height */
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
        var ty = VoxelWorld.getTerrainHeight(_group.position.x, _group.position.z);
        _group.position.y += (ty - _group.position.y) * Math.min(1, dt * 8);
      }
    } catch(e){}

    /* Find + engage target */
    _target = _findTarget();
    if (_target && _target.mesh) {
      /* Face target */
      var tdx = _target.mesh.position.x - _group.position.x;
      var tdz = _target.mesh.position.z - _group.position.z;
      _group.rotation.y = Math.atan2(tdx, tdz);

      _fireTimer -= dt;
      if (_fireTimer <= 0) {
        _shoot(_target);
        _fireTimer = CFG.FIRE_INTERVAL * (0.85 + Math.random() * 0.3);
      }
    } else {
      /* Face player direction */
      if (pd > 0.5) _group.rotation.y = Math.atan2(pdx, pdz);
    }

    /* HP bar positioning */
    _updateHPBar();

    /* Update HUD every ~60 frames */
    if (Math.round(ts / 16) % 60 === 0) _updateHUD();
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    /* HUD chip */
    _hudEl = document.createElement('div');
    _hudEl.id = 'squad-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:370px;left:52px;font-family:monospace;font-size:9px;',
      'pointer-events:none;z-index:210;line-height:20px;letter-spacing:0.08em;',
    ].join('');
    document.body.appendChild(_hudEl);
    _updateHUD();

    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyS' && e.altKey && !e.ctrlKey) {
        e.preventDefault();
        _spawn();
      }
    });

    requestAnimationFrame(_tick);
  }

  return { init: init, takeDamage: takeDamage };
})();

window.Squadmate = Squadmate;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { Squadmate.init(); });
} else {
  Squadmate.init();
}
