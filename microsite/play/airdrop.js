/* ============================================================
 *  AIRDROP.JS — Between-wave supply drop system
 *
 *  After each wave a supply crate parachutes in 60–100 units
 *  ahead of the player. Run within 3.5u and press E to collect.
 *  Random reward: +full ammo / +40 HP / bonus weapon upgrade.
 *  Visual: white cone parachute + tan crate box descending.
 *  Expires after 35 seconds.
 * ============================================================ */
var AirdropSystem = (function () {
  'use strict';

  /* ── Config ──────────────────────────────── */
  var CFG = {
    DROP_HEIGHT:     55,   // spawn height above landing zone
    DESCENT_RATE:    9,    // units/sec downward
    LAND_OFFSET:     70,   // units ahead of player
    COLLECT_RADIUS:  3.5,  // pick-up distance
    EXPIRE_SEC:      35,   // disappears if uncollected
    CHUTE_COLOR:     0xffffff,
    CRATE_COLOR:     0xd4a860,
  };

  /* ── State ───────────────────────────────── */
  var _initialized   = false;
  var _lastWave      = -1;
  var _activeDrop    = null; // { mesh, chute, expireTimer, landed, collectPrompt }
  var _scene         = null;
  var _collectPrompt = null;

  /* ── Helpers ──────────────────────────────── */
  function _getScene() {
    try { return window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e) { return null; }
  }
  function _getCamera() {
    try { return window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch(e) { return null; }
  }
  function _getPlayer() {
    try { return window.player || null; } catch(e) { return null; }
  }
  function _notify(msg, color) {
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup(msg, color || '#44ffaa'); } catch(e) {}
  }

  /* ── Build crate + chute mesh ─────────────── */
  function _buildDrop(x, y, z) {
    if (typeof THREE === 'undefined') return null;
    var group = new THREE.Group();

    // Crate
    var crateGeo = new THREE.BoxGeometry(1.2, 1.0, 1.2);
    var crateMat = new THREE.MeshLambertMaterial({ color: CFG.CRATE_COLOR });
    var crate    = new THREE.Mesh(crateGeo, crateMat);
    crate.position.y = 0;
    group.add(crate);

    // Crate cross marking
    var crossMat = new THREE.MeshLambertMaterial({ color: 0xcc2200 });
    var h = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), crossMat);
    var v = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.8), crossMat);
    h.position.set(0, 0.56, 0); v.position.set(0, 0.56, 0);
    group.add(h); group.add(v);

    // Parachute canopy (cone)
    var chuteGeo = new THREE.ConeGeometry(2.5, 2.0, 12, 1, true);
    var chuteMat = new THREE.MeshLambertMaterial({
      color: CFG.CHUTE_COLOR, side: THREE.DoubleSide, transparent: true, opacity: 0.85
    });
    var chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.y = 3.5;
    chute.rotation.x = Math.PI; // flip cone so opening faces down
    group.add(chute);

    // Suspension lines (4 thin boxes)
    var lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var offsets = [[ 0.9, 0, 0], [-0.9, 0, 0], [0, 0, 0.9], [0, 0,-0.9]];
    for (var i = 0; i < offsets.length; i++) {
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.4, 0.03), lineMat);
      line.position.set(offsets[i][0] * 0.5, 2.2, offsets[i][2] * 0.5);
      group.add(line);
    }

    group.position.set(x, y, z);
    return { group: group, chute: chute };
  }

  /* ── Determine reward ────────────────────── */
  var _REWARDS = [
    {
      id: 'ammo', label: '📦 SUPPLY DROP — Full ammo resupply!', color: '#ffcc00',
      apply: function () {
        try {
          if (window.player && player.ammo) {
            for (var k in player.ammo) {
              if (Object.prototype.hasOwnProperty.call(player.ammo, k)) {
                player.ammo[k] = (player.ammo[k] || 0) + 200;
              }
            }
            if (window.HUD && HUD.setAmmo) HUD.setAmmo(player.ammo);
          }
        } catch(e) {}
      }
    },
    {
      id: 'health', label: '💉 SUPPLY DROP — Medical kit! +40 HP', color: '#44ff88',
      apply: function () {
        try {
          if (window.player) {
            player.hp = Math.min(player.maxHp, player.hp + 40);
            if (window.HUD && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
          }
        } catch(e) {}
      }
    },
    {
      id: 'weapon', label: '🔫 SUPPLY DROP — Weapon upgrade crate!', color: '#44aaff',
      apply: function () {
        try {
          if (window.player && window.Pickups && Pickups.spawnWeaponPickup) {
            // Spawn a bonus weapon pickup at player position
            var pp = window.player.position;
            Pickups.spawnWeaponPickup(pp.x, pp.y, pp.z + 2);
          } else if (window.player && window.HUD && HUD.notifyPickup) {
            // Fallback: give bonus score + ammo
            window.player.score = (window.player.score || 0) + 500;
            if (HUD.setScore) HUD.setScore(window.player.score);
            _notify('🔫 WEAPON CACHE — +500 score', '#44aaff');
          }
        } catch(e) {}
      }
    },
  ];

  function _pickReward() {
    return _REWARDS[Math.floor(Math.random() * _REWARDS.length)];
  }

  /* ── Spawn a drop ────────────────────────── */
  function _spawnDrop() {
    _scene = _getScene();
    if (!_scene || typeof THREE === 'undefined') return;

    var p = _getPlayer();
    var lx, lz;
    if (p && p.position) {
      // Land offset in forward direction from player
      var cam = _getCamera();
      var fwdX = 0, fwdZ = 1;
      if (cam) {
        var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        fwd.y = 0; fwd.normalize();
        fwdX = fwd.x; fwdZ = fwd.z;
      }
      lx = p.position.x + fwdX * CFG.LAND_OFFSET + (Math.random()-0.5) * 20;
      lz = p.position.z + fwdZ * CFG.LAND_OFFSET + (Math.random()-0.5) * 20;
    } else {
      lx = 0; lz = 0;
    }

    // Determine ground height
    var ly = 0;
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        ly = VoxelWorld.getTerrainHeight(Math.round(lx), Math.round(lz)) || 0;
      }
    } catch(e) {}

    var drop = _buildDrop(lx, ly + CFG.DROP_HEIGHT, lz);
    if (!drop) return;

    _scene.add(drop.group);
    _activeDrop = {
      group:       drop.group,
      chute:       drop.chute,
      landY:       ly + 0.5,
      expireTimer: CFG.EXPIRE_SEC,
      landed:      false,
      reward:      _pickReward(),
    };

    _notify('✈ SUPPLY DROP INBOUND — run to collect!', '#44ffaa');
  }

  /* ── Collect logic ───────────────────────── */
  function _tryCollect() {
    if (!_activeDrop || !_activeDrop.landed) return;
    var p = _getPlayer();
    if (!p || !p.position) return;
    var dp = _activeDrop.group.position;
    var dx = p.position.x - dp.x, dz = p.position.z - dp.z;
    if (dx*dx + dz*dz > CFG.COLLECT_RADIUS * CFG.COLLECT_RADIUS) return;

    // Collect!
    _notify(_activeDrop.reward.label, _activeDrop.reward.color);
    _activeDrop.reward.apply();
    _removeDrop();
  }

  /* ── Remove drop from scene ──────────────── */
  function _removeDrop() {
    if (!_activeDrop) return;
    try { _scene.remove(_activeDrop.group); } catch(e) {}
    if (_collectPrompt) _collectPrompt.style.display = 'none';
    _activeDrop = null;
  }

  /* ── Update ──────────────────────────────── */
  function update(dt) {
    // Watch for wave change
    try {
      var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : -1;
      if (w > 0 && w !== _lastWave && _lastWave >= 0) {
        // Wave just incremented → new wave started (previous wave complete)
        if (!_activeDrop) {
          setTimeout(_spawnDrop, 1800); // short delay after wave-clear
        }
      }
      _lastWave = w;
    } catch(e) {}

    if (!_activeDrop) return;

    // Descent
    if (!_activeDrop.landed) {
      _activeDrop.group.position.y -= CFG.DESCENT_RATE * dt;
      // Sway chute
      _activeDrop.chute.rotation.z = Math.sin(performance.now() / 600) * 0.08;

      if (_activeDrop.group.position.y <= _activeDrop.landY) {
        _activeDrop.group.position.y = _activeDrop.landY;
        _activeDrop.landed = true;
        // Detach chute visually (hide it)
        _activeDrop.chute.visible = false;
        _notify('📦 CRATE LANDED — press E to collect', '#ffcc00');
      }
    }

    // Expiry countdown
    _activeDrop.expireTimer -= dt;
    if (_activeDrop.expireTimer <= 0) {
      _notify('📦 Supply crate expired', '#888');
      _removeDrop();
      return;
    }

    // Proximity prompt
    if (_activeDrop.landed && _collectPrompt) {
      var p = _getPlayer();
      if (p && p.position) {
        var dp = _activeDrop.group.position;
        var dx = p.position.x - dp.x, dz = p.position.z - dp.z;
        var near = (dx*dx + dz*dz) < CFG.COLLECT_RADIUS * CFG.COLLECT_RADIUS * 1.8;
        _collectPrompt.style.display = near ? 'block' : 'none';
      }
    }
  }

  /* ── E key → collect ─────────────────────── */
  function _onKeyDown(e) {
    if ((e.code === 'KeyE' || e.key === 'e' || e.key === 'E') && _activeDrop && _activeDrop.landed) {
      _tryCollect();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    // Proximity prompt element
    _collectPrompt = document.createElement('div');
    _collectPrompt.id = 'airdrop-prompt';
    _collectPrompt.style.cssText = [
      'display:none;position:fixed;bottom:180px;left:50%;transform:translateX(-50%);',
      'background:rgba(0,0,0,0.7);border:1px solid rgba(68,255,170,0.5);',
      'color:#44ffaa;padding:6px 20px;border-radius:6px;font-size:14px;',
      'font-family:monospace;z-index:210;pointer-events:none;text-align:center;',
    ].join('');
    _collectPrompt.textContent = '[E] Collect supply crate';
    document.body.appendChild(_collectPrompt);

    window.addEventListener('keydown', _onKeyDown);

    // Self-driven update
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      // Init _lastWave on first tick
      if (_lastWave === -1) {
        try {
          _lastWave = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;
        } catch(e) { _lastWave = 0; }
      }
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init, update: update, getActiveDrop: function () { return _activeDrop; } };
})();

window.AirdropSystem = AirdropSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { AirdropSystem.init(); });
} else {
  AirdropSystem.init();
}
