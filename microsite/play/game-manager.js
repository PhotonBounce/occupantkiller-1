    // ── Drone Selection Overlay ──
    var _droneSelectionCallback = null;

    // ── Loadout result from pre-stage selection ──
    var _loadoutResult = null;

    function showDroneSelection(callback) {
      // Export to window for global access (always)
      if (typeof window !== 'undefined') window.showDroneSelection = showDroneSelection;
      // If a drone type is pre-selected (e.g. for QA or automation), skip overlay
      if (window.__QA_MODE || window.__chosenDroneType) {
        // Only skip overlay if QA or automation is set
        selectAndLaunchDrone(window.__chosenDroneType || 'recon');
        if (typeof callback === 'function') callback();
        return;
      }
      // Otherwise, show the overlay and wait for user selection
      var overlay = document.getElementById('overlay-drone-select');
      if (!overlay) {
        // Fallback: if overlay missing, just launch default drone
        selectAndLaunchDrone('recon');
        if (typeof callback === 'function') callback();
        return;
      }
      overlay.style.display = 'flex';
      _droneSelectionCallback = callback;
      // Set up button handlers if not already set
      var btns = overlay.querySelectorAll('[data-drone-type]');
      btns.forEach(function(btn) {
        if (!btn._droneHandlerAttached) {
          btn.addEventListener('click', function() {
            var type = btn.getAttribute('data-drone-type');
            selectAndLaunchDrone(type);
          });
          btn._droneHandlerAttached = true;
        }
      });
    }
  // ── Browser Boot Timeout Handler ──
  let _bootTimeout = null;
  function _showBootTimeoutError() {
    var overlay = document.getElementById('error-overlay');
    var preloader = document.getElementById('boot-preloader');
    window.__gameBootReady = true;
    setTimeout(function() {
      if (preloader && window.__gameBootReady) preloader.style.display = 'none';
    }, 200);
    if (overlay) {
      overlay.style.display = 'block';
      overlay.innerHTML = 'STARTUP ERROR:\nGame failed to load in time. This may be due to a slow device, browser extension, or network issue.<br><br>' +
        '<button id="retry-btn" style="margin-top:18px;padding:8px 24px;font-size:15px;background:#222;color:#ffd700;border:1px solid #ffd700;border-radius:6px;cursor:pointer">Retry</button>';
      var btn = document.getElementById('retry-btn');
      if (btn) btn.onclick = function() { window.location.reload(); };
    }
  }
  function _startBootTimeout() {
    if (_bootTimeout) clearTimeout(_bootTimeout);
    _bootTimeout = setTimeout(_showBootTimeoutError, 15000);
  }
  function _clearBootTimeout() {
    if (_bootTimeout) { clearTimeout(_bootTimeout); _bootTimeout = null; }
  }

  // Start boot timeout on DOMContentLoaded
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _startBootTimeout);
    } else {
      _startBootTimeout();
    }
  }
/* ───────────────────────────────────────────────────────────────────────
   GAME MANAGER — central orchestrator for all hybrid game systems
   ─────────────────────────────────────────────────────────────────────── */
const GameManager = (function () {
  // Overlay state for drone controls HUD
  var _droneControlsVisible = false;
  // QA automation override: set by test script before any game code runs
  if (typeof window !== 'undefined' && window.__QA_MODE === undefined) window.__QA_MODE = false;
  'use strict';

  /* ── Game States ─────────────────────────────────────────────────── */
  const STATE = Object.freeze({
    MENU:        'menu',
    PLAYING:     'playing',
    PAUSED:      'paused',
    BUILD_MODE:  'buildMode',
    DEAD:        'dead',
    WAVE_CLEAR:  'waveClear',
    STAGE_CLEAR: 'stageClear',
    WIN:         'win',
  });

  /* ── Core State ──────────────────────────────────────────────────── */
  let gameState     = STATE.MENU;
  let _scene        = null;
  let _camera       = null;
  let _renderer     = null;

  // Reusable temp vectors for update loops (avoids per-frame GC)
  var _gmTmp1 = new THREE.Vector3();
  var _gmTmp2 = new THREE.Vector3();
  var _gmTmp3 = new THREE.Vector3();
  var _gmNewPos = new THREE.Vector3();
  var _waveStartTimer = null;
  var _levelStartTime = 0;  // Date.now() timestamp when the current level began
  var _defeatReason = null; // custom defeat banner (e.g. 'KYIV HAS FALLEN'); null = 'YOU DIED'
  var _hudSlowTimer = 0; // throttle slow HUD updates (dailies, bounties, prestige)
  var _musicIntTimer = 0; // throttle music intensity calc
  var _buildMatHud = null; // cached DOM ref for build materials HUD
  var _weaponWheelHeld = false; // tracks whether Q is held for weapon wheel
  var _bossBarShowing = false; // tracks whether boss health bar is currently visible

  // ── Muzzle flash PointLight — scene-space burst on every shot (Task 2) ──
  var _muzzleFlash = null;

  // ── Weapon idle sway time accumulator (Task 1) ────────────────────────
  var _swayTime = 0;

  // ── Sniper scope overlay DOM element (Task 3) ─────────────────────────
  var _gmScopeEl = null;

  // Killstreak time scale (1.0 = normal, <1.0 = slow motion via KillStreak module)
  window._killstreakTimeScale = 1.0;

  // Footstep dust puffs (visible when sprinting)
  var _footstepPuffs = [];
  var _footstepPuffGeo = null;
  function _spawnFootstepPuff() {
    if (!_scene) return;
    if (!_footstepPuffGeo) _footstepPuffGeo = new THREE.PlaneGeometry(0.5, 0.5);
    var groundY = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
      ? VoxelWorld.getTerrainHeight(player.position.x, player.position.z)
      : (player.position.y - player.height);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xb0a080, transparent: true, opacity: 0.45,
      depthWrite: false,
    });
    var puff = new THREE.Mesh(_footstepPuffGeo, mat);
    puff.rotation.x = -Math.PI / 2;
    puff.position.set(
      player.position.x + (Math.random() - 0.5) * 0.2,
      groundY + 0.04,
      player.position.z + (Math.random() - 0.5) * 0.2
    );
    var s = 0.4 + Math.random() * 0.2;
    puff.scale.set(s, s, 1);
    _scene.add(puff);
    _footstepPuffs.push({ mesh: puff, material: mat, life: 0.5, maxLife: 0.5 });
    // Cap puff count for perf
    if (_footstepPuffs.length > 24) {
      var oldP = _footstepPuffs.shift();
      if (oldP.mesh && _scene) _scene.remove(oldP.mesh);
      if (oldP.material && oldP.material.dispose) oldP.material.dispose();
    }
  }
  function _updateFootstepPuffs(delta) {
    for (var pi = _footstepPuffs.length - 1; pi >= 0; pi--) {
      var p = _footstepPuffs[pi];
      p.life -= delta;
      if (p.material) p.material.opacity = Math.max(0, (p.life / p.maxLife) * 0.45);
      // Expand outward as it rises slightly
      p.mesh.scale.x += delta * 0.6;
      p.mesh.scale.y += delta * 0.6;
      p.mesh.position.y += delta * 0.15;
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        if (p.material && p.material.dispose) p.material.dispose();
        _footstepPuffs.splice(pi, 1);
      }
    }
  }
  // ── Muzzle flash PointLight: burst of warm light at barrel tip ──────
  function doMuzzleFlash() {
    if (!_muzzleFlash && typeof THREE !== 'undefined' && _scene) {
      _muzzleFlash = new THREE.PointLight(0xffffaa, 8, 4);
      _scene.add(_muzzleFlash);
    }
    if (_muzzleFlash && _camera) {
      _muzzleFlash.intensity = 8;
      _muzzleFlash.position.copy(_camera.position);
      var _mfDir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
      _muzzleFlash.position.addScaledVector(_mfDir, 1.2);
      setTimeout(function() { if (_muzzleFlash) _muzzleFlash.intensity = 0; }, 40);
    }
  }

  // ── Scope overlay: create SVG vignette+crosshair for sniper rifles ───
  function _gmCreateScopeOverlay() {
    var existing = document.getElementById('scope-overlay');
    if (existing) { _gmScopeEl = existing; return; }
    var scopeEl = document.createElement('div');
    scopeEl.id = 'scope-overlay';
    scopeEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;display:none;';
    scopeEl.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="sg" cx="50%" cy="50%" r="45%"><stop offset="40%" stop-color="transparent"/><stop offset="80%" stop-color="rgba(0,0,0,0.7)"/><stop offset="100%" stop-color="rgba(0,0,0,0.95)"/></radialGradient></defs>' +
      '<rect width="100" height="100" fill="url(#sg)"/>' +
      '<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0,255,0,0.7)" stroke-width="0.2"/>' +
      '<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,255,0,0.7)" stroke-width="0.2"/>' +
      '<circle cx="50" cy="50" r="0.4" fill="rgba(0,255,0,0.9)"/>' +
      '<line x1="50" y1="40" x2="50" y2="38" stroke="rgba(0,255,0,0.6)" stroke-width="0.3"/>' +
      '<line x1="50" y1="60" x2="50" y2="62" stroke="rgba(0,255,0,0.6)" stroke-width="0.3"/>' +
      '<line x1="40" y1="50" x2="38" y2="50" stroke="rgba(0,255,0,0.6)" stroke-width="0.3"/>' +
      '<line x1="60" y1="50" x2="62" y2="50" stroke="rgba(0,255,0,0.6)" stroke-width="0.3"/>' +
      '</svg>';
    document.body.appendChild(scopeEl);
    _gmScopeEl = scopeEl;
  }

  // ── Threat-behind warning glow ───────────────────────────────────
  var _threatEl = null;
  var _threatOpacity = 0;
  function _updateThreatBehind() {
    if (!_threatEl) _threatEl = document.getElementById('threat-behind');
    if (!_threatEl) return;
    var threatNear = false;
    if (typeof Enemies !== 'undefined' && Enemies.getAll && _camera) {
      var fwd = _camera.getWorldDirection(new THREE.Vector3());
      var pp = player.position;
      var list = Enemies.getAll();
      for (var ii = 0; ii < list.length; ii++) {
        var ee = list[ii];
        if (!ee || !ee.alive || !ee.mesh) continue;
        var dx = ee.mesh.position.x - pp.x;
        var dz = ee.mesh.position.z - pp.z;
        var d2 = dx*dx + dz*dz;
        if (d2 > 49) continue; // >7m away
        // dot of forward vs to-enemy direction; <0 means behind
        var len = Math.sqrt(d2) || 1;
        var dot = (fwd.x * dx + fwd.z * dz) / len;
        if (dot < -0.25) { threatNear = true; break; }
      }
    }
    var target = threatNear ? 1 : 0;
    _threatOpacity += (target - _threatOpacity) * Math.min(1, 6 * 0.016);
    if (_threatOpacity < 0.02 && target === 0) {
      if (_threatEl.style.display !== 'none') _threatEl.style.display = 'none';
      return;
    }
    if (_threatEl.style.display === 'none') _threatEl.style.display = 'block';
    _threatEl.style.opacity = _threatOpacity.toFixed(2);
  }
  var _buildMatList = null;
  // Cached per-frame HUD indicator DOM refs
  var _domLean = null, _domInspect = null, _domBayonet = null;
  var _domHeatBar = null, _domOverheat = null, _domMaint = null;
  var _domSwim = null, _domBreathContainer = null, _domBreathBar = null;
  var _domMantle = null;

  /* ── Prestige State ─────────────────────────────────────────────── */
  window._prestigeLevel = parseInt(localStorage.getItem('okk_prestige') || '0');
  window._prestigeScoreMult = 1 + (window._prestigeLevel * 0.25);
  window._prestigeFireRate = 1 + (window._prestigeLevel * 0.05);

  /* ── Player State ────────────────────────────────────────────────── */
  const GOD_MODE_HP = 999999;
  const player = {
    position:   new THREE.Vector3(0, 10, 0),
    velocity:   new THREE.Vector3(0, 0, 0),
    hp:         100,
    maxHp:      100,
    score:      0,
    kills:      0,
    onGround:   false,
    sprinting:  false,
    height:     1.7,
    stealth:    false,        // invisibility toggle
    role:       'brigade',    // 'brigade' or 'lonewolf'
    godMode: false,       // God Mode: all weapons, invincible, invisible
    prone:      false,        // prone stance for accuracy
    bleeding:   false,        // bleed DOT status
    bleedTimer: 0,            // time remaining on bleed
    killStreak: 0,            // consecutive rapid kills
    streakTimer: 0,           // time since last kill (resets streak)
    dogTags:    0,            // collected dog tags
    airdropCooldown: 0,       // cooldown for airdrop beacon
    stamina:    1.0,          // 0-1, drains on sprint, regens on walk
    nightVision: false,       // night vision toggle
    shieldTimer: 0,           // temporary shield timer
    intelTimer: 0,            // intel reveal timer
    armor:      0,            // armor points (0-100), reduces damage
    lastDamageTime: 0,        // time since last damage (for health regen)
    // ── Throwables ──
    grenades:   5,            // hand grenades on player; default 5, unlimited in god mode
    grenadeType: 'FRAG',      // current grenade type: FRAG, SMOKE, FLASHBANG
    smokeGrenades: 2,         // smoke grenade count
    flashGrenades: 2,         // flashbang grenade count
    // ── Loot & Building ──
    lootParticles: [],        // active loot particles in world
    buildMaterials: { wood: 0, stone: 0, metal: 0, dirt: 0, sand: 0, brick: 0 },
    // ── Stats Tracking ──
    totalShots: 0,
    totalHits: 0,
    totalHeadshots: 0,
    totalDamageTaken: 0,
    waveStartTime: 0,
    bestStreak: 0,
    waveKills: 0,
    waveShots: 0,
    waveHits: 0,
    waveHeadshots: 0,
    waveDamageTaken: 0,
    waveMeleeKills: 0,
    waveFirstKillTime: 999,
    waveMaxExplosiveKill: 0,
    distanceWalked: 0,
    _lastPos: null,
    playStartTime: 0,
    // ── B23: New Gameplay State ──
    xp: 0,
    level: 1,
    grenadeCooked: false,
    grenadeCookTimer: 0,
    _radTimer: 0,
    _geigerTimer: 0,
    executionTarget: null,
    lastKillWeapon: null,
    multikillTimer: 0,
    multikillCount: 0,
    // ── B24: Cover & Crouch ──
    isCrouching: false,
    crouchTimer: 0,        // smooth crouch lerp
    inCover: false,         // near a wall while crouching
    slideTimer: 0,
    slideDir: null,
    _usedLastStand: false,
  };

  /* ── Wave State ──────────────────────────────────────────────────── */
  let currentWave = 0;
  const SCORE_WAVE_BONUS = 500;

  /* ── Stamina Config ──────────────────────────────────────────────── */
  const STAMINA_DRAIN_RATE = 0.15;  // per second while sprinting
  const STAMINA_REGEN_RATE = 0.08;  // per second while not sprinting

  /* ── Battlefield Events ─────────────────────────────────────────── */
  const BATTLE_EVENTS = [
    // Probabilities must sum to <= 1.0 so all events can fire (cumulative selection)
    { id: 'ARTILLERY',     label: '💥 ARTILLERY BARRAGE!',      color: '#ff4444', chance: 0.15 },
    { id: 'SUPPLY_DROP',   label: '📦 SUPPLY DROP INCOMING!',   color: '#44ff88', chance: 0.13 },
    { id: 'MORTAR',        label: '💣 MORTAR STRIKE!',          color: '#ff8800', chance: 0.10 },
    { id: 'REINFORCEMENT', label: '🛡 ALLIED REINFORCEMENTS!',  color: '#4488ff', chance: 0.09 },
    { id: 'AMBUSH',        label: '⚠ ENEMY AMBUSH!',           color: '#ff2222', chance: 0.09 },
    { id: 'SNIPER_DUEL',   label: '🎯 SNIPER DUEL!',           color: '#ffaa00', chance: 0.07 },
    { id: 'ARMOR_PUSH',    label: '🛡 ENEMY ARMOR PUSH!',      color: '#cc0000', chance: 0.07 },
    { id: 'AIR_SUPPORT',   label: '✈ FRIENDLY AIR SUPPORT!',   color: '#00aaff', chance: 0.08 },
    { id: 'DRONE_SWARM',   label: '🤖 FPV DRONE SUPPORT!',      color: '#44ffcc', chance: 0.07 },
    { id: 'CHEMICAL',       label: '☣ CHEMICAL ATTACK!',       color: '#aaff00', chance: 0.05 },
    { id: 'EMP',            label: '⚡ EMP BLAST!',             color: '#4400ff', chance: 0.04 },
    { id: 'TUNNEL_BREACH',  label: '🕳 TUNNEL BREACH!',        color: '#884400', chance: 0.06 },
  ];

  function triggerBattlefieldEvent() {
    const roll = Math.random();
    let cumulative = 0;
    let event = null;
    for (const ev of BATTLE_EVENTS) {
      cumulative += ev.chance;
      if (roll < cumulative) { event = ev; break; }
    }
    if (!event) return;

    HUD.notifyPickup(event.label, event.color);

    switch (event.id) {
      case 'ARTILLERY':
        // Damage enemies in a random area + screen shake
        for (let i = 0; i < 5; i++) {
          const bx = player.position.x + (Math.random() - 0.5) * 30;
          const bz = player.position.z + (Math.random() - 0.5) * 30;
          const bh = window.VoxelWorld.getTerrainHeight(bx, bz);
          Enemies.damageInRadius(new THREE.Vector3(bx, bh, bz), 5, 40);
        }
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.06, 0.8);
        break;
      case 'SUPPLY_DROP':
        // Drop pickups near player
        for (let i = 0; i < 4; i++) {
          const sx = player.position.x + (Math.random() - 0.5) * 12;
          const sz = player.position.z + (Math.random() - 0.5) * 12;
          const sh = window.VoxelWorld.getTerrainHeight(sx, sz);
          const types = ['HEALTH', 'AMMO', 'ARMOR', 'MEDKIT', 'GRENADE', 'STIM'];
          Pickups.spawn(new THREE.Vector3(sx, sh, sz), types[Math.floor(Math.random() * types.length)]);
        }
        break;
      case 'MORTAR':
        // Single large explosion near enemies + screen shake
        const all = Enemies.getAll();
        if (all.length > 0) {
          const target = all[Math.floor(Math.random() * all.length)];
          if (target.alive && target.mesh) {
            Enemies.damageInRadius(target.mesh.position, 8, 80);
            if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.1, 0.6);
          }
        }
        break;
      case 'REINFORCEMENT':
        // Spawn extra friendly NPCs
        if (typeof NPCSystem !== 'undefined' && NPCSystem.spawn) {
          for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 4 + Math.random() * 6;
            const nx = player.position.x + Math.cos(angle) * dist;
            const nz = player.position.z + Math.sin(angle) * dist;
            const nh = window.VoxelWorld.getTerrainHeight(nx, nz);
            NPCSystem.spawn(nx, nh, nz, 'infantry');
          }
        }
        break;
      case 'AMBUSH':
        // Enemy ambush: spawn fast stormers all around the player
        for (let i = 0; i < 6; i++) {
          const aa = (i / 6) * Math.PI * 2;
          const ad = 8 + Math.random() * 4;
          Enemies.spawnSingle('STORMER', {
            x: player.position.x + Math.cos(aa) * ad,
            z: player.position.z + Math.sin(aa) * ad
          });
        }
        break;
      case 'SNIPER_DUEL':
        // Spawn enemy snipers at long range + give player ammo
        for (let i = 0; i < 3; i++) {
          const sa = Math.random() * Math.PI * 2;
          const sd = 18 + Math.random() * 8;
          Enemies.spawnSingle('SNIPER', {
            x: player.position.x + Math.cos(sa) * sd,
            z: player.position.z + Math.sin(sa) * sd
          });
        }
        Weapons.addAmmo(20);
        break;
      case 'ARMOR_PUSH':
        // Spawn armored enemies in formation (full 360° around player)
        for (let i = 0; i < 4; i++) {
          const fa = Math.random() * Math.PI * 2;
          const fd = 15 + Math.random() * 6;
          Enemies.spawnSingle('ARMORED', {
            x: player.position.x + Math.cos(fa) * fd,
            z: player.position.z + Math.sin(fa) * fd
          });
        }
        break;
      case 'AIR_SUPPORT':
        // Massive damage to enemies in a large area
        const allEnemies = Enemies.getAll();
        for (let i = 0; i < allEnemies.length && i < 10; i++) {
          if (allEnemies[i].alive && allEnemies[i].mesh) {
            Enemies.damageInRadius(allEnemies[i].mesh.position, 6, 60);
          }
        }
        break;
      case 'DRONE_SWARM':
        // Spawn extra drones for the player
        if (typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
          for (let i = 0; i < 2; i++) {
            const dx = player.position.x + (Math.random() - 0.5) * 10;
            const dz = player.position.z + (Math.random() - 0.5) * 10;
            const dh = window.VoxelWorld.getTerrainHeight(dx, dz) + 8;
            DroneSystem.spawn(dx, dh, dz, i === 0 ? 'fpv_attack' : 'bomb');
          }
        }
        break;
      case 'CHEMICAL':
        // Chemical attack: slow damage to all enemies in area + player warning
        for (let i = 0; i < 8; i++) {
          const cx = player.position.x + (Math.random() - 0.5) * 20;
          const cz = player.position.z + (Math.random() - 0.5) * 20;
          const ch = window.VoxelWorld.getTerrainHeight(cx, cz);
          Enemies.damageInRadius(new THREE.Vector3(cx, ch, cz), 4, 25);
        }
        // Player takes minor damage if not stealth
        if (!player.stealth) {
          player.hp = Math.max(1, player.hp - 10);
          HUD.setHealth(player.hp, player.maxHp);
        }
        break;
      case 'EMP':
        // EMP: destroys kamikaze drones, severely damages drone operators
        Enemies.getAll().forEach(function (e) {
          if (e.typeName === 'DRONE_OP') Enemies.damage(e, 80);
          else if (e.typeName === 'KAMIKAZE_DRONE') Enemies.damage(e, 999);
        });
        break;
      case 'TUNNEL_BREACH':
        // Enemies emerge from underground behind the player
        var _tbYaw = (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw) ? CameraSystem.getYaw() : Math.random() * Math.PI * 2;
        for (let i = 0; i < 4; i++) {
          const ta = Math.PI + (Math.random() - 0.5) * 1.0; // behind player
          const td = 5 + Math.random() * 5;
          Enemies.spawnSingle('STORMER', {
            x: player.position.x + Math.cos(_tbYaw + ta) * td,
            z: player.position.z + Math.sin(_tbYaw + ta) * td
          });
        }
        break;
    }
  }

  /* ── Loot Particle System (Sonic-style gold rings from terrain) ── */
  const _lootParticles = [];
  const _lootGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const _lootMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xaa8800 });
  const LOOT_CONFIG = {
    VALUE: 5,             // gold per loot particle collected
    COLLECT_RANGE: 2.5,   // distance to auto-collect
    LIFETIME: 15,         // seconds before despawn
    MAGNET_RANGE: 5,      // auto-attract within this range
  };

  function spawnLootParticle(worldPos, count) {
    if (!_scene) return;
    for (var i = 0; i < (count || 1); i++) {
      var mesh = new THREE.Mesh(_lootGeo, _lootMat.clone());
      // Scatter slightly from source
      mesh.position.set(
        worldPos.x + (Math.random() - 0.5) * 1.5,
        worldPos.y + 0.5 + Math.random() * 1.0,
        worldPos.z + (Math.random() - 0.5) * 1.5
      );
      mesh.userData.vy = 3 + Math.random() * 2; // bounce up velocity
      mesh.userData.age = 0;
      mesh.userData.baseY = worldPos.y;
      if (_scene) _scene.add(mesh);
      else console.warn('Skipped mesh add: _scene is null');
      _lootParticles.push(mesh);
    }
  }

  function updateLootParticles(delta) {
    for (var i = _lootParticles.length - 1; i >= 0; i--) {
      var lp = _lootParticles[i];
      lp.userData.age += delta;
      // Gravity + bounce
      lp.userData.vy -= 12 * delta;
      lp.position.y += lp.userData.vy * delta;
      var groundH = window.VoxelWorld.getTerrainHeight(lp.position.x, lp.position.z) + 0.15;
      if (lp.position.y < groundH) {
        lp.position.y = groundH;
        lp.userData.vy = Math.abs(lp.userData.vy) * 0.4; // bounce
        if (Math.abs(lp.userData.vy) < 0.5) lp.userData.vy = 0;
      }
      // Spin
      lp.rotation.y += delta * 5;
      // Magnet toward player
      var dist = lp.position.distanceTo(player.position);
      if (dist < LOOT_CONFIG.MAGNET_RANGE) {
        var pullDir = _gmTmp1.copy(player.position).sub(lp.position).normalize();
        var pullSpeed = (1 - dist / LOOT_CONFIG.MAGNET_RANGE) * 12;
        lp.position.addScaledVector(pullDir, pullSpeed * delta);
      }
      // Collect
      if (dist < LOOT_CONFIG.COLLECT_RANGE) {
        Economy.addCurrency(LOOT_CONFIG.VALUE);
        player.score += LOOT_CONFIG.VALUE;
        HUD.setScore(player.score);
        if (HUD.addCombatLog) HUD.addCombatLog('+' + LOOT_CONFIG.VALUE + ' gold (loot)', '#ffd700');
        if (_scene) _scene.remove(lp);
        if (lp.geometry) lp.geometry.dispose();
        if (lp.material) lp.material.dispose();
        _lootParticles.splice(i, 1);
        if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playPickup) window.AudioSystem.playPickup();
        continue;
      }
      // Blink before despawning (last 3 seconds)
      if (lp.userData.age > LOOT_CONFIG.LIFETIME - 3) {
        lp.visible = Math.floor(lp.userData.age * 6) % 2 === 0;
      }
      // Despawn after lifetime
      if (lp.userData.age > LOOT_CONFIG.LIFETIME) {
        if (_scene) _scene.remove(lp);
        if (lp.geometry) lp.geometry.dispose();
        if (lp.material) lp.material.dispose();
        _lootParticles.splice(i, 1);
      }
    }
  }

  /* ── Block-to-Material Mapping (Minecraft style) ────────────────── */
  function blockToMaterialName(blockType) {
    var B = window.VoxelWorld.BLOCK;
    if (blockType === B.WOOD || blockType === B.LOG) return 'wood';
    if (blockType === B.STONE || blockType === B.REINFORCED) return 'stone';
    if (blockType === B.METAL || blockType === B.ELECTRONICS) return 'metal';
    if (blockType === B.DIRT || blockType === B.GRASS) return 'dirt';
    if (blockType === B.SAND || blockType === B.SANDBAG) return 'sand';
    if (blockType === B.BRICK || blockType === B.CONCRETE || blockType === B.ASPHALT) return 'brick';
    return 'dirt'; // fallback
  }

  function blockToEconomyResource(blockType) {
    var B = window.VoxelWorld.BLOCK;
    if (blockType === B.WOOD || blockType === B.LOG) return 'wood';
    if (blockType === B.STONE || blockType === B.REINFORCED) return 'stone';
    if (blockType === B.METAL || blockType === B.ELECTRONICS) return 'metal';
    return null; // non-resource blocks just give gold loot
  }

  /* ── Terrain Destruction Loot Handler ───────────────────────────── */
  function onTerrainDestroyed(x, y, z, blockType) {
    if (!blockType || blockType === 0) return; // AIR, skip
    var worldPos = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
    // Spawn terrain impact particle debris
    if (typeof Tracers !== 'undefined' && Tracers.spawnBlockImpact) {
      var blockColor = (typeof window !== 'undefined' && window.BLOCK_COLORS) ? (window.BLOCK_COLORS[blockType] || 0x8B7355) : 0x8B7355;
      Tracers.spawnBlockImpact(worldPos, blockColor);
    }
    // 5% chance to spawn 1-2 gold loot particles
    if (Math.random() < 0.05) {
      spawnLootParticle(worldPos, 1 + Math.floor(Math.random() * 2));
    }
    // ── B31: Every destroyed block yields OKC for NFT conversion ──
    var okcReward = 1;
    if (typeof Economy !== 'undefined' && Economy.addCurrency) {
      Economy.addCurrency(okcReward);
      if (typeof HUD !== 'undefined' && HUD.notifyPickup && Math.random() < 0.15) {
        HUD.notifyPickup('+1 OKC (block destroyed)', '#ffd700');
      }
    }
  }

  /* ── Shovel Mining Handler (gives materials like Minecraft) ─────── */
  function onShovelMine(x, y, z, blockType) {
    if (!blockType || blockType === 0) return;
    var matName = blockToMaterialName(blockType);
    var ecoRes = blockToEconomyResource(blockType);
    if (ecoRes) {
      // Give actual building resource
      Economy.add(ecoRes, 1);
      player.buildMaterials[matName] = (player.buildMaterials[matName] || 0) + 1;
      if (HUD.addCombatLog) HUD.addCombatLog('+1 ' + ecoRes + ' (mined)', '#8B6914');
      HUD.notifyPickup('⛏ +1 ' + ecoRes.toUpperCase(), '#8B6914');
    } else {
      // Non-resource block: give gold loot instead
      player.buildMaterials[matName] = (player.buildMaterials[matName] || 0) + 1;
      var worldPos = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
      spawnLootParticle(worldPos, 1);
      if (HUD.addCombatLog) HUD.addCombatLog('+1 ' + matName + ' (mined)', '#888');
    }
  }

  /* ── Stage Definitions ──────────────────────────────────────────── */
  const STAGES = [
    {
      id:           1,
      name:         'HOSTOMEL AIRPORT',
      theme:        'grassland',
      wavesPerStage: 7,
      difficulty:   0.8,
      fogColor:     0x4a5a3a,
      bgColor:      0x4a5a3a,
      sunColor:     0xff8833,
      sunIntensity: 0.85,
      exposure:     0.9,
      hintWeapons:  ['AK-74M','RPG-7','NLAW'],
      description:  'Stop the airborne assault at Hostomel Airport.',
      objective:    'Repel VDV paratroopers and secure Hostomel Airport. Survive 7 waves.',
    },
    {
      id:           2,
      name:         'AVDIIVKA SECTOR',
      theme:        'urban',
      wavesPerStage: 7,
      difficulty:   1.0,
      fogColor:     0x3a3028,
      bgColor:      0x3a3028,
      sunColor:     0xccccdd,
      sunIntensity: 0.7,
      exposure:     0.8,
      hintWeapons:  ['SVD Dragunov','NLAW','FGM-148 Javelin'],
      description:  'Industrial ruins of Avdiivka. Defend the coking plant.',
      objective:    'Hold the coking plant against ground assault and armor. Watch for snipers in the ruins.',
    },
    {
      id:           3,
      name:         'BAKHMUT RUINS',
      theme:        'urban',
      wavesPerStage: 7,
      difficulty:   1.4,
      fogColor:     0x2a2a2a,
      bgColor:      0x2a2a2a,
      sunColor:     0xccccdd,
      sunIntensity: 0.65,
      exposure:     0.7,
      hintWeapons:  ['AK-74M','PKM','RPO-A Shmel'],
      description:  'Total destruction in Bakhmut. The city is a graveyard.',
      objective:    'Navigate the ruins. Wagner mercenaries attack from all angles. Clear 7 waves.',
    },
    {
      id:           4,
      name:         'KHERSON CROSSING',
      theme:        'grassland',
      wavesPerStage: 7,
      difficulty:   1.8,
      fogColor:     0x4a5a3a,
      bgColor:      0x4a5a3a,
      sunColor:     0xffcc55,
      sunIntensity: 0.9,
      exposure:     0.9,
      hintWeapons:  ['NLAW','FGM-148 Javelin','Stugna-P'],
      description:  'Cross the Dnipro at Kherson. Liberate the bridgehead.',
      objective:    'Secure the Dnipro crossing. Drown enemy armor in the river. 7 waves.',
    },
    {
      id:           5,
      name:         'MARIUPOL STEELWORKS',
      theme:        'industrial',
      wavesPerStage: 7,
      difficulty:   2.2,
      fogColor:     0x1a1a20,
      bgColor:      0x1a1a20,
      sunColor:     0xff6622,
      sunIntensity: 0.5,
      exposure:     0.65,
      hintWeapons:  ['M4A1','PKM','RPO-A Shmel'],
      description:  'Fight through the burning Azovstal steelworks. No retreat.',
      objective:    'Survive the steelworks inferno. Fire deals constant damage. Clear all 7 waves.',
    },
    {
      id:           6,
      name:         'CRIMEA BRIDGE',
      theme:        'coastal',
      wavesPerStage: 7,
      difficulty:   2.5,
      fogColor:     0x5577aa,
      bgColor:      0x5577aa,
      sunColor:     0xffddaa,
      sunIntensity: 0.95,
      exposure:     0.9,
      hintWeapons:  ['M142 HIMARS (GMLRS Strike)','RPG-7','C4 Explosive'],
      description:  'Assault the Kerch Strait bridge. Cut off their supply line.',
      objective:    'Repel naval marines at the Kerch Strait crossing. Drone strikes and naval bombardment incoming. 7 waves.',
    },
    {
      id:           7,
      name:         'CHORNOBYL ZONE',
      theme:        'wasteland',
      wavesPerStage: 7,
      difficulty:   2.8,
      fogColor:     0x3a3520,
      bgColor:      0x3a3520,
      sunColor:     0xaacc44,
      sunIntensity: 0.55,
      exposure:     0.75,
      hintWeapons:  ['Barrett M82','AK-74M','RPO-A Shmel'],
      description:  'The irradiated exclusion zone. Radiation adds periodic damage.',
      objective:    'Survive Chornobyl. Constant radiation drains HP — watch your health bar. Spetsnaz and feral threats. 7 waves.',
    },
    {
      id:           8,
      name:         'OUTER MOSCOW',
      theme:        'cityscape',
      wavesPerStage: 9,
      difficulty:   3.5,
      fogColor:     0x222228,
      bgColor:      0x222228,
      sunColor:     0xeeeeff,
      sunIntensity: 0.4,
      exposure:     0.6,
      hintWeapons:  ['Barrett M82','M2HB Browning .50cal','FGM-148 Javelin'],
      description:  'The armored push into Moscow\'s outer ring. FSB elite and Rosgvardiya defend the suburbs.',
      objective:    'Break through the outer Moscow defensive ring. 9 waves of elite defenders.',
    },
    {
      id:           9,
      name:         'SEVASTOPOL NAVAL BASE',
      theme:        'coastal',
      wavesPerStage: 7,
      difficulty:   3.8,
      fogColor:     0x3355aa,
      bgColor:      0x3355aa,
      sunColor:     0xddccaa,
      sunIntensity: 0.85,
      exposure:     0.85,
      hintWeapons:  ['M142 HIMARS (GMLRS Strike)','RPG-7','NLAW'],
      description:  'Destroy the Black Sea Fleet at Sevastopol. Sink them all.',
      objective:    'Naval base assault. Ship artillery rains down. Destroy all fleet defenders. 7 waves.',
    },
    {
      id:           10,
      name:         'DONBAS FINAL PUSH',
      theme:        'urban',
      wavesPerStage: 8,
      difficulty:   4.2,
      fogColor:     0x2a2020,
      bgColor:      0x2a2020,
      sunColor:     0xdd6633,
      sunIntensity: 0.6,
      exposure:     0.7,
      hintWeapons:  ['RPO-A Shmel','TOS-1A Buratino (Thermobaric MLRS)','M142 HIMARS (GMLRS Strike)'],
      description:  'Liberate the last occupied stronghold in Donbas.',
      objective:    'Break the Donbas line. Kadyrovites, Wagner, mortar teams, and suppressive trench fire. 8 waves.',
    },
    {
      id:           11,
      name:         'BELGOROD OFFENSIVE',
      theme:        'grassland',
      wavesPerStage: 8,
      difficulty:   4.6,
      fogColor:     0x3a4a2a,
      bgColor:      0x3a4a2a,
      sunColor:     0xffaa44,
      sunIntensity: 0.75,
      exposure:     0.85,
      hintWeapons:  ['NLAW','FGM-148 Javelin','M142 HIMARS (GMLRS Strike)'],
      description:  'Cross into enemy territory. Take the fight to them.',
      objective:    'Invade Belgorod. Tanks and mechanized infantry counter-attack hard. 8 waves.',
    },
    {
      id:           12,
      name:         'KREMLIN SHOWDOWN',
      theme:        'cityscape',
      wavesPerStage: 10,
      difficulty:   5.0,
      fogColor:     0x111118,
      bgColor:      0x111118,
      sunColor:     0xff3322,
      sunIntensity: 0.3,
      exposure:     0.5,
      hintWeapons:  ['FGM-148 Javelin','M142 HIMARS (GMLRS Strike)','Barrett M82'],
      description:  'The ultimate battle for peace. Storm the Kremlin. End the war.',
      objective:    'Final assault. Every enemy type. Maximum difficulty. Survive 10 waves.',
    },
    {
      id:           13,
      name:         'BATTLE OF KYIV',
      theme:        'urban',
      wavesPerStage: 8,
      difficulty:   1.5,
      fogColor:     0x6a7080,
      bgColor:      0x6a7080,
      sunColor:     0xc8d0dc,
      sunIntensity: 0.55,
      exposure:     0.75,
      tankFocus:    true,
      capitalDefense: true,  // armored columns + city-integrity objective + Bayraktar support
      hintWeapons:  ['NLAW','FGM-148 Javelin','RPG-7','Stugna-P'],
      description:  'Feb 2022. Russian armored columns push down the boulevard toward Maidan. NLAW teams and Bayraktar strikes hold the capital.',
      objective:    'DEFEND KYIV: stop every armored column before it breaches the line. City integrity must survive 8 waves.',
    },
    {
      id:           14,
      name:         'SNAKE ISLAND DEFENSE',
      theme:        'coastal',
      wavesPerStage: 6,
      difficulty:   1.4,
      fogColor:     0x4a6680,
      bgColor:      0x4a6680,
      sunColor:     0xddddff,
      sunIntensity: 0.65,
      exposure:     0.8,
      hintWeapons:  ['Igla MANPADS','RPG-7','NLAW'],
      description:  'Feb 24, 2022. Russian warship Moskva approaches Snake Island. Reply: "Russian warship, go fuck yourself."',
      objective:    'Hold Snake Island against naval bombardment. Only 6 waves — make them count.',
    },
    {
      id:           15,
      name:         'SAKY AIRBASE STRIKE',
      theme:        'coastal',
      wavesPerStage: 7,
      difficulty:   1.7,
      fogColor:     0x886644,
      bgColor:      0xa8845a,
      sunColor:     0xfff0d0,
      sunIntensity: 0.95,
      exposure:     0.95,
      hintWeapons:  ['Drone Jammer Rifle','Igla MANPADS','Strela-2M (SA-7 MANPADS)'],
      description:  'Aug 2022. Crimea. Light up the Saky airbase — every parked Su-24 is a war crime grounded.',
      objective:    'Airbase raid. Heavy bomber drone presence. Jammer rifle recommended. 7 waves.',
    },
    {
      id:           16,
      name:         'VUHLEDAR TANK GRAVEYARD',
      theme:        'wasteland',
      wavesPerStage: 8,
      difficulty:   1.9,
      fogColor:     0x4a4030,
      bgColor:      0x5a5040,
      sunColor:     0xddccaa,
      sunIntensity: 0.5,
      exposure:     0.7,
      tankFocus:    true,
      hintWeapons:  ['NLAW','FGM-148 Javelin','Stugna-P','RPG-7'],
      description:  'Feb 2023. The 155th Naval Infantry Brigade walks into a minefield. Make Vuhledar the largest tank graveyard of the war.',
      objective:    'Tank graveyard. Mines and AT weapons are your friends. 8 waves of armor.',
    },
    {
      hintWeapons:  ['SV-98 Precision Sniper Rifle','Barrett M82','SVD Dragunov'],
      id:           17,
      name:         'ANTONOV BRIDGE STRIKE',
      theme:        'urban',
      wavesPerStage: 7,
      difficulty:   2.0,
      fogColor:     0x556677,
      bgColor:      0x6a7888,
      sunColor:     0xffeecc,
      sunIntensity: 0.85,
      exposure:     0.85,
      description:  'Jul-Aug 2022. HIMARS season. Cut the Antonov Bridge supply line and trap the Russian forces in Kherson.',
      objective:    'Bridge strike. Long-range artillery duels. Precision weapons matter. 7 waves.',
    },
    {
      id:           18,
      name:         'REFINERY STRIKE — FPV DRONE',
      theme:        'industrial',
      wavesPerStage: 1,
      difficulty:   1.6,
      fogColor:     0x2a2620,
      bgColor:      0x3a342a,
      sunColor:     0xffaa66,
      sunIntensity: 0.6,
      exposure:     0.75,
      droneOnly:    true,
      description:  'Pilot a one-way FPV drone deep into a Russian oil refinery. No respawns at the wheel — only at the launch pad.',
      objective:    'FPV drone mission. Fly into the refinery. Blow the fuel tanks. One wave, one chance.',
    },
  ];

  let currentStage = 0;  // 0-based index into STAGES

  /* ── Last-kill camera tracking ───────────────────────────────── */
  var _lastKillPos = null;  // position of most recent enemy kill
  var _rfFlagObjects = [];  // Russian flag meshes placed each wave — cleared at wave start

  /* ── Suppression System (near-miss visual response) ──────────── */
  var _suppressionLevel = 0;  // 0→1
  var _suppressionDecay = 0.5; // per second
  var _suppressionCanvas = null;

  function addSuppression(amount) {
    _suppressionLevel = Math.min(1, _suppressionLevel + (amount || 0.15));
  }

  function updateSuppression(delta) {
    if (_suppressionLevel <= 0) return;
    _suppressionLevel = Math.max(0, _suppressionLevel - _suppressionDecay * delta);
    if (!_suppressionCanvas) {
      _suppressionCanvas = document.querySelector('canvas');
    }
    if (_suppressionCanvas) {
      var bl = _suppressionLevel * 1.5;
      var sat = 1 - _suppressionLevel * 0.4;
      _suppressionCanvas.style.filter = _suppressionLevel > 0.01
        ? 'blur(' + bl.toFixed(2) + 'px) saturate(' + sat.toFixed(2) + ')'
        : '';
    }
    // Micro-shake from suppression
    if (_suppressionLevel > 0.2 && typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(_suppressionLevel * 0.008, 0.05);
    }
  }

  /* ── FOV Kick State (sprint widens, ADS narrows) ─────────────── */
  const _baseFOV = 75;
  var _currentFOV = 75;
  var _targetFOV = 75;
  var _killFovKick = 0; // additive FOV bump on kill, decays
  var _killStreak = 0;
  var _killStreakTimer = 0;
  var _killStreakMult = 1;

  /* ── Score Chain (kill chain multiplier) ────────────────────────── */
  var _scoreChain = 1;       // current multiplier (1, 2, 3, 4, or 5)
  var _chainTimer = 0;       // seconds since last kill
  var _chainExpiry = 5.0;    // chain resets after 5s without a kill
  var _chainKills = 0;       // kills in current chain
  var _chainEl = null;
  function _updateChainDisplay() {
    if (!_chainEl) {
      _chainEl = document.createElement('div');
      _chainEl.id = 'chain-multiplier';
      _chainEl.style.cssText = 'position:fixed;top:80px;right:12px;font-family:monospace;font-size:22px;font-weight:bold;color:#ffdd00;text-shadow:0 0 8px #ff8800;z-index:500;pointer-events:none;transition:opacity 0.3s;';
      document.body.appendChild(_chainEl);
    }
    if (_scoreChain > 1) {
      _chainEl.textContent = 'x' + _scoreChain + ' CHAIN';
      _chainEl.style.opacity = '1';
    } else {
      _chainEl.style.opacity = '0';
    }
  }

  /* ── Physics Constants ───────────────────────────────────────────── */
  const MOVE_SPEED   = 6.0;
  const SPRINT_MULT  = 1.65;
  const GRAVITY      = 18;
  const JUMP_SPEED   = 7.0;
  const GROUND_SNAP_EPS = 0.35;
  const PLAYER_RADIUS = 0.35; // approximate half-width for wall collision

  /* ── Mobile Detection ──────────────────────────────────────────── */
  // iPadOS 13+ identifies as Mac; treat touch-capable devices as mobile.
  const _uaIsMobile = /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|PlayBook|BB10|Opera Mini/i.test(navigator.userAgent);
  const _isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const _isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isMobile = _uaIsMobile || _isIpadOS || (_isTouch && Math.min(window.innerWidth, window.innerHeight) < 900);
  if (isMobile) {
    try { document.documentElement.classList.add('is-mobile'); } catch (e) {}
  }

  /* ── Input State ─────────────────────────────────────────────────── */
  const keys = {};
  let mouseDown = false;
  let mouseNewPress = false;

  /* ── Touch State ─────────────────────────────────────────────────── */
  const touch = {
    moveX: 0, moveY: 0,
    lookX: 0, lookY: 0,
    aimX: 0, aimY: 0,
    firing: false,
    jumping: false,
    reloading: false,
    sprinting: false,
    moveActive: false,
    lookActive: false,
    aimActive: false,
    moveTouchId: null,
    lookTouchId: null,
    aimTouchId: null,
    moveStartX: 0, moveStartY: 0,
    aimStartX: 0, aimStartY: 0,
    // Tap-to-shoot tracking
    tapStartX: 0, tapStartY: 0, tapStartTime: 0,
    // ── Gyro aim (mobile DeviceOrientation) ──
    gyroEnabled: false,
    gyroReady: false,
    gyroPrevAlpha: null,
    gyroPrevBeta: null,
    gyroDX: 0,
    gyroDY: 0,
    gyroSensitivity: 4.0,
    gyroAutoAssist: true,
  };

  let _rendererProfile = 'desktop';
  let _mobileControlsReady = false;

  function showStartupError(message) {
    var overlay = document.getElementById('error-overlay');
    if (!overlay) return;
    overlay.style.display = 'block';
    overlay.innerText = 'STARTUP ERROR:\n' + message;
  }

  function getPreferredPixelRatio() {
    var dpr = window.devicePixelRatio || 1;
    if (_rendererProfile === 'compatibility') return 1;
    return Math.min(dpr, isMobile ? 1.1 : 1.5);
  }

  function createRendererWithFallback() {
    var container = document.getElementById('game-container');
    var profiles = [
      {
        name: isMobile ? 'mobile' : 'desktop',
        powerPreference: isMobile ? 'default' : 'high-performance',
        precision: isMobile ? 'mediump' : 'highp',
        shadows: !isMobile,
        toneMapping: true,
        exposure: isMobile ? 0.92 : 0.85,
      },
      {
        name: 'compatibility',
        powerPreference: 'default',
        precision: 'lowp',
        shadows: false,
        toneMapping: false,
        exposure: 1.0,
      }
    ];
    var lastError = null;
    for (var pi = 0; pi < profiles.length; pi++) {
      var profile = profiles[pi];
      try {
        var canvas = document.createElement('canvas');
        var attrs = {
          alpha: false,
          antialias: false,
          depth: true,
          stencil: false,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          powerPreference: profile.powerPreference,
          failIfMajorPerformanceCaveat: false,
        };
        var context = canvas.getContext('webgl2', attrs) ||
                      canvas.getContext('webgl', attrs) ||
                      canvas.getContext('experimental-webgl', attrs);
        if (!context) continue;
        var renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          context: context,
          antialias: false,
          alpha: false,
          depth: true,
          stencil: false,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          powerPreference: profile.powerPreference,
          precision: profile.precision,
        });
        _rendererProfile = profile.name;
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(getPreferredPixelRatio());
        renderer.shadowMap.enabled = profile.shadows;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.toneMapping = profile.toneMapping ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
        renderer.toneMappingExposure = profile.exposure;
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.addEventListener('webglcontextlost', function (e) {
          e.preventDefault();
          showStartupError('WebGL context was lost. Reload the page or close background tabs and try again.');
        }, false);
        container.appendChild(renderer.domElement);
        return renderer;
      } catch (err) {
        lastError = err;
      }
    }
    throw (lastError || new Error('Unable to create a WebGL context on this device.'));
  }

  function shouldSkipGroundSnap() {
    if (typeof DroneSystem !== 'undefined' && DroneSystem.isPossessing && DroneSystem.isPossessing()) return true;
    if (typeof VehicleSystem !== 'undefined' && VehicleSystem.isInVehicle && VehicleSystem.isInVehicle()) return true;
    if (typeof Traversal !== 'undefined') {
      if (Traversal.isMantling && Traversal.isMantling()) return true;
      if (Traversal.isHanging && Traversal.isHanging()) return true;
      if (Traversal.isGrappling && Traversal.isGrappling()) return true;
      if (Traversal.isWallRunning && Traversal.isWallRunning()) return true;
      if (Traversal.isSwimming && Traversal.isSwimming()) return true;
    }
    return false;
  }

  function enforcePlayerGroundSnap() {
    if (typeof window.VoxelWorld === 'undefined') return;

    // Use top-solid scan so craters / placed structures don't trick us into
    // snapping to procedural noise height while the player is in a hole.
    var topY = (typeof window.VoxelWorld.getTopSolidY === 'function')
      ? window.VoxelWorld.getTopSolidY(player.position.x, player.position.z)
      : window.VoxelWorld.getTerrainHeight(player.position.x, player.position.z) + 1;
    var terrainY = topY + player.height;
    var gap = player.position.y - terrainY;

    // Hard-correct under-surface cases immediately, regardless of traversal state.
    if (gap < -0.02) {
      player.position.y = terrainY;
      if (player.velocity.y < 0) player.velocity.y = 0;
      player.onGround = true;
      return;
    }

    // Skip soft snapping while special movement states control vertical motion.
    if (shouldSkipGroundSnap()) return;

    // Soft snap small downward gaps so movement stops feeling floaty.
    if (gap <= GROUND_SNAP_EPS && player.velocity.y <= 0) {
      player.position.y = terrainY;
      player.velocity.y = 0;
      player.onGround = true;
    }
  }

  function updateMobileControlsVisibility() {
    if (!isMobile) return;
    var mobileControls = document.getElementById('mobile-controls');
    if (!mobileControls) return;
    var shouldShow = gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE;
    mobileControls.style.display = shouldShow ? 'block' : 'none';
  }

  function syncTouchDriveKeys() {
    if (!isMobile) return;
    var forwardActive = touch.moveActive && touch.moveY < -0.2;
    var backActive = touch.moveActive && touch.moveY > 0.2;
    var leftActive = touch.moveActive && touch.moveX < -0.2;
    var rightActive = touch.moveActive && touch.moveX > 0.2;

    if (DroneSystem && DroneSystem.setDroneKey) {
      DroneSystem.setDroneKey('w', DroneSystem.isPossessing() && forwardActive);
      DroneSystem.setDroneKey('s', DroneSystem.isPossessing() && backActive);
      DroneSystem.setDroneKey('a', DroneSystem.isPossessing() && leftActive);
      DroneSystem.setDroneKey('d', DroneSystem.isPossessing() && rightActive);
      DroneSystem.setDroneKey('up', DroneSystem.isPossessing() && !!touch.jumping);
      DroneSystem.setDroneKey('down', DroneSystem.isPossessing() && !!touch.sprinting);
    }
    if (VehicleSystem && VehicleSystem.setVehicleKey) {
      VehicleSystem.setVehicleKey('w', VehicleSystem.isInVehicle() && forwardActive);
      VehicleSystem.setVehicleKey('s', VehicleSystem.isInVehicle() && backActive);
      VehicleSystem.setVehicleKey('a', VehicleSystem.isInVehicle() && leftActive);
      VehicleSystem.setVehicleKey('d', VehicleSystem.isInVehicle() && rightActive);
      VehicleSystem.setVehicleKey('up', VehicleSystem.isInVehicle() && !!touch.jumping);
      VehicleSystem.setVehicleKey('down', VehicleSystem.isInVehicle() && !!touch.sprinting);
      VehicleSystem.setVehicleKey('fire', VehicleSystem.isInVehicle() && !!touch.firing);
      VehicleSystem.setVehicleKey('mgFire', VehicleSystem.isInVehicle() && !!touch.firing);
    }
  }

  function getKeyValueFromCode(code) {
    var map = {
      Escape: 'Escape',
      Tab: 'Tab',
      Space: ' ',
      KeyB: 'b',
      KeyC: 'c',
      KeyF: 'f',
      KeyG: 'g',
      KeyL: 'l',
      KeyV: 'v',
      KeyX: 'x',
      KeyZ: 'z'
    };
    return map[code] || code;
  }

  function tapVirtualKey(code, holdMs) {
    var key = getKeyValueFromCode(code);
    document.dispatchEvent(new KeyboardEvent('keydown', { code: code, key: key, bubbles: true, cancelable: true }));
    window.setTimeout(function () {
      document.dispatchEvent(new KeyboardEvent('keyup', { code: code, key: key, bubbles: true, cancelable: true }));
    }, holdMs || 70);
  }

  function setMobileAim(active) {
    if (VehicleSystem && VehicleSystem.isInVehicle && VehicleSystem.isInVehicle()) {
      var occupied = VehicleSystem.getOccupied ? VehicleSystem.getOccupied() : null;
      if (occupied && occupied.isTank && VehicleSystem.setVehicleKey) {
        VehicleSystem.setVehicleKey('mgFire', active);
        return;
      }
    }
    if (active) {
      if (Weapons && Weapons.handleRightDown) Weapons.handleRightDown();
    } else if (Weapons && Weapons.handleRightUp) {
      Weapons.handleRightUp();
    }
  }

  /* ── Lighting References ─────────────────────────────────────────── */
  let sunLight  = null;
  var _skyDome = null;
  let ambLight  = null;
  let hemiLight = null;
  let _updateLoopStarted = false;

  /* ── Init ────────────────────────────────────────────────────────── */
  function init() {
    _clearBootTimeout(); // Boot succeeded, clear timeout
    // Keep the start-screen badge in sync with the real stage count so it
    // never drifts from STAGES (was hardcoded "12" while STAGES has grown).
    try {
      var _badge = document.getElementById('level-badge');
      if (_badge) _badge.textContent = 'HYBRID VOXEL WARFARE · ' + STAGES.length + ' STAGES';
    } catch (_e) {}
    try {
      _renderer = createRendererWithFallback();
        // Create scene — dynamic background/fog per stage
        _scene = new THREE.Scene();
        if (typeof Mines !== 'undefined') Mines.init(_scene);
        if (window.TripwireIED) TripwireIED.init(_scene, _camera);
        if (window.LootDrops) LootDrops.init(_scene);
        if (window.WaveEvents) WaveEvents.init(_scene);
        if (window.BountySystem) BountySystem.init(_scene);
        if (window.VehicleEnemies) VehicleEnemies.init(_scene);
        window._takeVehicleRamDamage = function(dmg) { onPlayerHit(dmg, null); };
        window._takeBTRDamage        = function(dmg) { onPlayerHit(dmg, null); };
        window._takeDamageFromWaveEvent = function(dmg) { onPlayerHit(dmg, null); };
        if (window.Destructibles) Destructibles.init(_scene);
        if (window.StaminaSystem) StaminaSystem.init();
        if (window.Grapple) Grapple.init(_scene, _camera);
        if (window.ZiplineGrapple) ZiplineGrapple.init(_scene, _camera);
        if (window.Wingsuit) Wingsuit.init(_scene, _camera);
        if (window.ScavengeSystem) ScavengeSystem.init(_scene, _camera);
        if (window.CrouchSystem) CrouchSystem.init();
        if (window.SpecialGrenades) SpecialGrenades.init(_scene, _camera, function(enemyCallback) {
            var enemies = Enemies ? Enemies.getAll() : [];
            for (var i = 0; i < enemies.length; i++) {
                if (enemies[i] && !enemies[i].dead) enemyCallback(enemies[i]);
            }
        });
        if (window.BloodEffects) BloodEffects.init(_scene, _camera);
        if (window.BallisticShield) BallisticShield.init(_scene, _camera);
        if (window.MeleeKnife) MeleeKnife.init(_scene, _camera);
        if (window.RadioSupport) RadioSupport.init(_scene, function(pos, radius, callback) {
          var enemies = (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : [];
          for (var _rsi = 0; _rsi < enemies.length; _rsi++) {
            var _rse = enemies[_rsi];
            if (!_rse || _rse.hp <= 0 || !_rse.alive || !_rse.mesh) continue;
            var _rsdx = _rse.mesh.position.x - pos.x;
            var _rsdz = _rse.mesh.position.z - pos.z;
            if (Math.sqrt(_rsdx*_rsdx + _rsdz*_rsdz) < radius) {
              if (typeof Enemies !== 'undefined' && Enemies.damage) Enemies.damage(_rse, 9999);
              player.kills++;
            }
          }
          if (callback) callback();
        });
        if (window.ClaymoreMines) ClaymoreMines.init(_scene, function(pos, isPlayer) {
          if (isPlayer) { _takeDamage(45); }
        });
        if (typeof ArmorSystem !== 'undefined') ArmorSystem.init(_scene);
        if (window.GasMask) GasMask.init(_scene);
        if (typeof HazardZones !== 'undefined') HazardZones.init(_scene);
        if (typeof AllySoldiers !== 'undefined') AllySoldiers.init(_scene, _camera);
        if (typeof SupplyCrate !== 'undefined') SupplyCrate.init(_scene);
        if (typeof NightVision !== 'undefined') NightVision.init(_renderer.domElement, _scene);
        if (window.WeatherEffects) WeatherEffects.init(_scene);
        if (typeof ExplosiveBarrels !== 'undefined') {
          ExplosiveBarrels.init(_scene, function(x, y, z, radius, damage) {
            // AoE damage to enemies in radius
            if (typeof Enemies !== 'undefined' && Enemies.getAll) {
              var _aeList = Enemies.getAll();
              for (var _aei = 0; _aei < _aeList.length; _aei++) {
                var _ae = _aeList[_aei];
                if (!_ae || !_ae.mesh || _ae.hp <= 0) continue;
                var _aedx = _ae.mesh.position.x - x;
                var _aedz = _ae.mesh.position.z - z;
                var _aedist = Math.sqrt(_aedx*_aedx + _aedz*_aedz);
                if (_aedist < radius) {
                  var _aedmg = damage * (1 - _aedist / radius);
                  if (Enemies.damage) Enemies.damage(_ae, _aedmg);
                }
              }
            }
            // Damage player if nearby
            var _pldx = player.position.x - x;
            var _pldz = player.position.z - z;
            var _pldist = Math.sqrt(_pldx*_pldx + _pldz*_pldz);
            if (_pldist < radius) {
              var _pldmg = damage * 0.5 * (1 - _pldist / radius);
              player.hp = Math.max(0, player.hp - _pldmg);
            }
          });
        }
        var stageCfg = (typeof getCurrentStageConfig === 'function') ? getCurrentStageConfig() : null;
        let fogColor = stageCfg && stageCfg.fogColor !== undefined ? stageCfg.fogColor : 0xFFD700;
        // Fog color must match background to avoid visible horizon seam (audit #17)
        _scene.background = new THREE.Color(fogColor);
        _scene.fog = new THREE.Fog(fogColor, 18, isMobile ? 55 : 120);

        // If running in compatibility mode, show a warning overlay
        if (_rendererProfile === 'compatibility') {
          let compatOverlay = document.getElementById('compat-overlay');
          if (!compatOverlay) {
            compatOverlay = document.createElement('div');
            compatOverlay.id = 'compat-overlay';
            compatOverlay.style.position = 'fixed';
            compatOverlay.style.top = '0';
            compatOverlay.style.left = '0';
            compatOverlay.style.width = '100vw';
            compatOverlay.style.height = '32px';
            compatOverlay.style.background = 'rgba(0,0,0,0.7)';
            compatOverlay.style.color = '#FFD700';
            compatOverlay.style.font = 'bold 16px sans-serif';
            compatOverlay.style.zIndex = '9999';
            compatOverlay.style.display = 'flex';
            compatOverlay.style.alignItems = 'center';
            compatOverlay.style.justifyContent = 'center';
            compatOverlay.innerText = 'Compatibility Mode: Reduced graphics for maximum device support';
            document.body.appendChild(compatOverlay);
          } else {
            compatOverlay.style.display = 'flex';
          }
        } else {
          let compatOverlay = document.getElementById('compat-overlay');
          if (compatOverlay) compatOverlay.style.display = 'none';
        }
    } catch (err) {
      console.error('[INIT] Renderer creation failed:', err);
      showStartupError('This browser could not start WebGL rendering. Try refreshing, closing background tabs, or using a newer browser/GPU profile.');
      return;
    }

    // (Scene was already created with stage-specific bg/fog above; no re-init needed)

    // Create camera
    // Near plane lowered 0.1 -> 0.02 so the close first-person weapon model
    // isn't sliced open by near-clipping (player was seeing inside the guns).
    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.02, isMobile ? 140 : 200);

    if (typeof CompanionDrone !== 'undefined') CompanionDrone.init(_scene, _camera);

    // Lighting — Ukrainian theme
    ambLight = new THREE.AmbientLight(0x888866, 0.8);
    if (_scene) _scene.add(ambLight);
    else console.warn('Skipped ambLight add: _scene is null');

    sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(20, 30, 10);
    sunLight.castShadow = !isMobile; // mobile: skip shadows entirely for FPS
    var shadowRes = isMobile ? 512 : 1024;
    sunLight.shadow.mapSize.set(shadowRes, shadowRes);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = isMobile ? 60 : 100;
    sunLight.shadow.camera.left   = -50;
    sunLight.shadow.camera.right  =  50;
    sunLight.shadow.camera.top    =  50;
    sunLight.shadow.camera.bottom = -50;
    if (_scene) _scene.add(sunLight);
    else console.warn('Skipped sunLight add: _scene is null');

    // ── Procedural environment map → realistic PBR weapon reflections ──
    // Built once from a sky/ground gradient canvas and PMREM-filtered. Only the
    // first-person weapon uses PBR materials, so this stays cheap. Skipped on
    // mobile / low-end to protect frame rate.
    if (_renderer && _scene && !isMobile && _rendererProfile !== 'compatibility') {
      try {
        var _envCanvas = document.createElement('canvas');
        _envCanvas.width = 128; _envCanvas.height = 64;
        var _ectx = _envCanvas.getContext('2d');
        var _grad = _ectx.createLinearGradient(0, 0, 0, 64);
        _grad.addColorStop(0.00, '#9bb7d4'); // sky
        _grad.addColorStop(0.45, '#c9d4dc'); // horizon haze
        _grad.addColorStop(0.55, '#7a6b58'); // ground (near)
        _grad.addColorStop(1.00, '#2e2820'); // ground (far)
        _ectx.fillStyle = _grad; _ectx.fillRect(0, 0, 128, 64);
        var _sun = _ectx.createRadialGradient(96, 15, 0, 96, 15, 22);
        _sun.addColorStop(0, 'rgba(255,250,230,0.95)');
        _sun.addColorStop(1, 'rgba(255,250,230,0)');
        _ectx.fillStyle = _sun; _ectx.fillRect(0, 0, 128, 64);
        var _envTex = new THREE.CanvasTexture(_envCanvas);
        _envTex.mapping = THREE.EquirectangularReflectionMapping;
        var _pmrem = new THREE.PMREMGenerator(_renderer);
        if (_pmrem.compileEquirectangularShader) _pmrem.compileEquirectangularShader();
        var _envRT = _pmrem.fromEquirectangular(_envTex);
        _scene.environment = _envRT.texture;
        _envTex.dispose();
        _pmrem.dispose();
      } catch (eEnv) { /* reflections are optional polish */ }
    }

    hemiLight = new THREE.HemisphereLight(0xFFD700, 0x0057B8, 0.6);
    if (_scene) _scene.add(hemiLight);
    else console.warn('Skipped hemiLight add: _scene is null');

    // Gradient sky dome (hemisphere)
    (function createSkyDome() {
      var skyGeo = new THREE.SphereGeometry(180, 24, 16);
      var skyVertices = skyGeo.attributes.position;
      var skyColors = new Float32Array(skyVertices.count * 3);
      for (var si = 0; si < skyVertices.count; si++) {
        var y = skyVertices.getY(si);
        var t = Math.max(0, Math.min(1, (y + 180) / 360)); // 0 = bottom, 1 = top
        // Warm top → cool horizon → dark bottom
        var r = 0.35 + t * 0.45;
        var g = 0.45 + t * 0.35;
        var b = 0.55 + t * 0.15;
        skyColors[si * 3] = r;
        skyColors[si * 3 + 1] = g;
        skyColors[si * 3 + 2] = b;
      }
      skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));
      var skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false });
      _skyDome = new THREE.Mesh(skyGeo, skyMat);
      if (_scene) _scene.add(_skyDome);
      else console.warn('Skipped skyDome add: _scene is null');
    })();

    // ── Init all sub-systems ─────────────────────────────────
    // Lightweight progress reporter so the boot preloader keeps moving
    // during the ~1s init() blocks the main thread; otherwise it looks
    // frozen on desktop (and worse on mobile / slow GPUs).
    var _initStep = 0;
    var _initSteps = 14;
    var _bootErrors = [];
    function _safeInit(label, fn) {
      try {
        fn();
      } catch (e) {
        console.warn('[BOOT] ' + label + ' failed:', e);
        _bootErrors.push(label + ': ' + (e && e.message ? e.message : e));
      }
    }
    function _bootStep(label) {
      _initStep++;
      if (typeof window.__bootProgress === 'function') {
        var pct = 30 + Math.round((_initStep / _initSteps) * 65); // 30→95
        var detail = _bootErrors.length ? 'warnings: ' + _bootErrors.slice(-2).join('; ') : '';
        try { window.__bootProgress(pct, label, detail); } catch (e) {}
      }
    }

    _safeInit('camera', function () { if (CameraSystem && typeof CameraSystem.init === 'function') CameraSystem.init(_camera); });
    _bootStep('camera');
    _safeInit('voxel world', function () { if (window.VoxelWorld && typeof window.VoxelWorld.init === 'function') window.VoxelWorld.init(_scene); });
    _bootStep('voxel world');

    _safeInit('time', function () { if (TimeSystem && typeof TimeSystem.init === 'function') TimeSystem.init(_scene, sunLight, ambLight, hemiLight); });
    _bootStep('time');
    _safeInit('building', function () { if (Building && typeof Building.init === 'function') Building.init(_scene); });
    _bootStep('building');
    _safeInit('npc system', function () { if (NPCSystem && typeof NPCSystem.init === 'function') NPCSystem.init(_scene); });
    _bootStep('npc system');
    _safeInit('drones', function () {
      if (DroneSystem && typeof DroneSystem.init === 'function') DroneSystem.init(_scene, _camera);
      if (typeof EnemyArtillery !== 'undefined' && EnemyArtillery.init) EnemyArtillery.init(_scene);
    });
    _bootStep('drones');
    _safeInit('refinery', function () { if (typeof RefineryStrike !== 'undefined' && RefineryStrike.init) RefineryStrike.init(_scene); });
    _safeInit('vehicles', function () { if (VehicleSystem && typeof VehicleSystem.init === 'function') VehicleSystem.init(_scene); });
    _bootStep('vehicles');
    _safeInit('economy', function () { if (Economy && typeof Economy.init === 'function') Economy.init(); });
    _safeInit('skills', function () { if (SkillSystem && typeof SkillSystem.init === 'function') SkillSystem.init(); });
    _safeInit('ranks', function () { if (RankSystem && typeof RankSystem.init === 'function') RankSystem.init(); });
    _bootStep('progression');
    _safeInit('missions', function () {
      if (MissionSystem && typeof MissionSystem.init === 'function') MissionSystem.init();
      if (Automation && typeof Automation.init === 'function') Automation.init();
      if (Pickups && typeof Pickups.init === 'function') Pickups.init(_scene);
    });
    _bootStep('missions');

    // Tracers system
    _safeInit('tracers', function () { if (typeof Tracers !== 'undefined' && Tracers && typeof Tracers.init === 'function') Tracers.init(_scene); });
    _bootStep('tracers');

    // Audio, Weather & ML systems
    _safeInit('audio', function () { if (window.AudioSystem && typeof window.AudioSystem.init === 'function') window.AudioSystem.init(); });
    _safeInit('weather', function () { if (WeatherSystem && typeof WeatherSystem.init === 'function') WeatherSystem.init(_scene, _camera); });
    _safeInit('weather-particles', function () { if (typeof Weather !== 'undefined' && Weather.init && _scene) { Weather.init(_scene, _camera); } });
    _safeInit('ml', function () { if (MLSystem && typeof MLSystem.init === 'function') MLSystem.init(); });
    _safeInit('stagevfx', function () { if (typeof StageVFX !== 'undefined' && StageVFX && typeof StageVFX.init === 'function') StageVFX.init(_scene); });
    _safeInit('flags', function () {
      if (typeof Flags !== 'undefined' && Flags && typeof Flags.init === 'function') {
        Flags.init(_scene);
        // Plant a Ukrainian flagpole near the player spawn (and a captured Russian one further out for atmosphere)
        try {
          var spawnX = (typeof player !== 'undefined' && player.position) ? player.position.x : 0;
          var spawnZ = (typeof player !== 'undefined' && player.position) ? player.position.z : 0;
          var groundY = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
            ? VoxelWorld.getTerrainHeight(spawnX + 6, spawnZ + 6) + 1 : 1;
          Flags.spawnFlagpole(spawnX + 6, groundY, spawnZ + 6, 'ukrainian', 4.5);
          var ry = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
            ? VoxelWorld.getTerrainHeight(spawnX + 28, spawnZ - 28) + 1 : 1;
          Flags.spawnFlagpole(spawnX + 28, ry, spawnZ - 28, 'russian', 4.0);
        } catch (e) {}
      }
    });
    _safeInit('environment', function () { if (typeof Environment !== 'undefined' && Environment.init) Environment.init(_scene, _camera); });

    // ── New feature systems init ──────────────────────────
    if (typeof CombatExtras !== 'undefined' && CombatExtras && typeof CombatExtras.reset === 'function') CombatExtras.reset();
    if (typeof Traversal !== 'undefined' && Traversal && typeof Traversal.reset === 'function') Traversal.reset();
    if (typeof EnemyTypes !== 'undefined' && EnemyTypes && typeof EnemyTypes.init === 'function') EnemyTypes.init();
    if (typeof WorldFeatures !== 'undefined' && WorldFeatures && typeof WorldFeatures.init === 'function') WorldFeatures.init(_scene, THREE);
    if (typeof Perks !== 'undefined' && Perks && typeof Perks.reset === 'function') Perks.reset();
    if (typeof MissionTypes !== 'undefined' && MissionTypes && typeof MissionTypes.clear === 'function') MissionTypes.clear();
    if (typeof Feedback !== 'undefined' && Feedback && typeof Feedback.init === 'function') Feedback.init();
    if (typeof Progression !== 'undefined' && Progression && typeof Progression.init === 'function') Progression.init();
    // Tactical minimap
    try { if (typeof Minimap !== 'undefined' && Minimap.init) Minimap.init(typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : []); } catch (eMM) {}

    // Birds + Mortar + MortarEmplacement + Premium + Lottery + Gyro
    try { if (window.Birds   && Birds.init)   Birds.init(_scene); } catch (e) {}
    try { if (window.Mortar  && Mortar.init)  Mortar.init(_scene, _camera, _controls); } catch (e) {}
    try { if (window.MortarEmplacement && MortarEmplacement.init) MortarEmplacement.init(_scene, _camera); } catch (e) {}
    try { if (window.Bradley && Bradley.init) Bradley.init(_scene, _camera, _controls); } catch (e) {}
    try { if (window.Premium && Premium.init) Premium.init(); } catch (e) {}
    try { if (window.Lottery && Lottery.init) Lottery.init(); } catch (e) {}
    try { if (window.MissionDebrief && MissionDebrief.init) MissionDebrief.init(); } catch (e) {}
    try { if (window.LevelBriefing && LevelBriefing.init) LevelBriefing.init(); } catch (e) {}
    try { if (window.Gyro    && Gyro.init)    Gyro.init(_camera); } catch (e) {}
    if (typeof EnemyChatter !== 'undefined' && _camera) EnemyChatter.init(_camera);
    try { if (window.DamageNumbers) DamageNumbers.init(_scene, _camera); } catch (e) {}
    // ADS (Aim Down Sights) system
    try { if (window.ADSSystem && ADSSystem.init) ADSSystem.init(_scene, _camera); } catch (eADS) { console.warn('[ADSSystem] init failed', eADS); }
    // Companion radio tactical chatter
    try { if (window.CompanionRadio && CompanionRadio.init) CompanionRadio.init(); } catch (eCR) {}
    // Bullet-time power-up
    try { if (window.TimeWarp && TimeWarp.init) TimeWarp.init(); } catch (eTW) { console.warn('[TimeWarp] init failed', eTW); }
    // Surrender system
    try { if (window.SurrenderSystem) SurrenderSystem.init(_scene); } catch (eSS) { console.warn('[SurrenderSystem] init failed', eSS); }
    // Suppression system
    try { if (window.SuppressionSystem) SuppressionSystem.init(_scene, _camera); } catch (eSup) { console.warn('[SuppressionSystem] init failed', eSup); }
    // Freeze grenade
    try { if (window.FreezeGrenade && FreezeGrenade.init) FreezeGrenade.init(_scene, _camera); } catch (eFG) { console.warn('[FreezeGrenade] init failed', eFG); }
    try { if (window.KillCam && KillCam.init) KillCam.init(_scene, _camera); } catch (e) {}
    try { if (window.ShieldBubble && ShieldBubble.init) ShieldBubble.init(_scene, _camera); } catch (e) {}
    try { if (window.TripwireTrap && TripwireTrap.init) TripwireTrap.init(_scene, _camera); } catch (e) {}
    try { if (window.BulletTime && BulletTime.init) BulletTime.init(); } catch (e) {}
    try { if (window.MountedTurret && MountedTurret.init) MountedTurret.init(_scene, _camera); } catch (e) {}
    try { if (window.DynamicWeather && DynamicWeather.init) DynamicWeather.init(_scene); } catch (e) {}
    try { if (window.ObjectiveSystem && ObjectiveSystem.init) ObjectiveSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.ClusterBomb && ClusterBomb.init) ClusterBomb.init(_scene, _camera); } catch (e) {}
    try { if (window.TacticalMinimap && TacticalMinimap.init) TacticalMinimap.init(_scene, _camera); } catch (e) {}
    try { if (window.KillFeedEvents && KillFeedEvents.init) KillFeedEvents.init(); } catch (e) {}
    try { if (window.BossFinalForm && BossFinalForm.init) BossFinalForm.init(_scene, _camera); } catch (e) {}
    try { if (window.RadarPulse && RadarPulse.init) RadarPulse.init(_scene, _camera); } catch (e) {}
    try { if (window.WeaponWear && WeaponWear.init) WeaponWear.init(); } catch (e) {}
    try { if (window.Nanobots && Nanobots.init) Nanobots.init(); } catch (e) {}
    try { if (window.AmmoTypes && AmmoTypes.init) AmmoTypes.init(); } catch (e) {}
    try { if (window.PlayerCallouts && PlayerCallouts.init) PlayerCallouts.init(_camera); } catch (e) {}
    try { if (window.DriveableCar && DriveableCar.init) DriveableCar.init(_scene, _camera); } catch (e) {}
    try { if (window.FPVKamikaze && FPVKamikaze.init) FPVKamikaze.init(_scene, _camera); } catch (e) {}
    try { if (window.EMPPulse && EMPPulse.init) EMPPulse.init(_scene, _camera); } catch (e) {}
    try { if (window.InventorySystem && InventorySystem.init) InventorySystem.init(); } catch (e) {}
    try { if (window.MeleeSystem && MeleeSystem.init) MeleeSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.SniperScope && SniperScope.init) SniperScope.init(_scene, _camera); } catch (e) {}
    try { if (window.ParachuteDrop && ParachuteDrop.init) ParachuteDrop.init(_scene, _camera); } catch (e) {}
    try { if (window.LandmineField && LandmineField.init) LandmineField.init(_scene, _camera); } catch (e) {}
    try { if (window.SmokeLauncher && SmokeLauncher.init) SmokeLauncher.init(_scene, _camera); } catch (e) {}
    try { if (window.AirStrike && AirStrike.init) AirStrike.init(_scene, _camera); } catch (e) {}
    try { if (window.WallBreach && WallBreach.init) WallBreach.init(_scene, _camera); } catch (e) {}
    try { if (window.CombatRoll && CombatRoll.init) CombatRoll.init(_scene, _camera); } catch (e) {}
    try { if (window.DogTagCollector && DogTagCollector.init) DogTagCollector.init(_scene, _camera); } catch (e) {}
    try { if (window.EnemySniper && EnemySniper.init) EnemySniper.init(_scene, _camera); } catch (e) {}
    try { if (window.VehicleWreck && VehicleWreck.init) VehicleWreck.init(_scene, _camera); } catch (e) {}
    try { if (window.SuppressorKit && SuppressorKit.init) SuppressorKit.init(_scene, _camera); } catch (e) {}
    try { if (window.BattlefieldPromotions && BattlefieldPromotions.init) BattlefieldPromotions.init(); } catch (e) {}
    try { if (window.HostageRescue && HostageRescue.init) HostageRescue.init(_scene, _camera); } catch (e) {}
    try { if (window.GrenadeLauncherGL && GrenadeLauncherGL.init) GrenadeLauncherGL.init(_scene, _camera); } catch (e) {}
    try { if (window.PlayerDeathSequence && PlayerDeathSequence.init) PlayerDeathSequence.init(_scene, _camera); } catch (e) {}
    try { if (window.TacticalReload && TacticalReload.init) TacticalReload.init(_scene, _camera); } catch (e) {}
    try { if (window.ClaymoreDirectional && ClaymoreDirectional.init) ClaymoreDirectional.init(_scene, _camera); } catch (e) {}
    try { if (window.NightAssault && NightAssault.init) NightAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.VehicleTurret && VehicleTurret.init) VehicleTurret.init(_scene, _camera); } catch (e) {}
    try { if (window.IntelDocuments && IntelDocuments.init) IntelDocuments.init(_scene, _camera); } catch (e) {}
    try { if (window.BodyArmorVest && BodyArmorVest.init) BodyArmorVest.init(_scene, _camera); } catch (e) {}
    try { if (window.ArtilleryBarrage && ArtilleryBarrage.init) ArtilleryBarrage.init(_scene, _camera); } catch (e) {}
    try { if (window.RiotShieldPickup && RiotShieldPickup.init) RiotShieldPickup.init(_scene, _camera); } catch (e) {}
    try { if (window.ScoreMultiplier && ScoreMultiplier.init) ScoreMultiplier.init(); } catch (e) {}
    try { if (window.HeliExtraction && HeliExtraction.init) HeliExtraction.init(_scene, _camera); } catch (e) {}
    try { if (window.ChemicalWarfare && ChemicalWarfare.init) ChemicalWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.EnemyTankDestroyer && EnemyTankDestroyer.init) EnemyTankDestroyer.init(_scene, _camera); } catch (e) {}
    try { if (window.FlashbangSystem && FlashbangSystem.init) FlashbangSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.EnemyEngineer && EnemyEngineer.init) EnemyEngineer.init(_scene, _camera); } catch (e) {}
    try { if (window.RappellingSystem && RappellingSystem.init) RappellingSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.BulletCam && BulletCam.init) BulletCam.init(_scene, _camera); } catch (e) {}
    try { if (window.ReconDrone && ReconDrone.init) ReconDrone.init(_scene, _camera); } catch (e) {}
    try { if (window.BunkerBuster && BunkerBuster.init) BunkerBuster.init(_scene, _camera); } catch (e) {}
    try { if (window.TacticalMap && TacticalMap.init) TacticalMap.init(_scene, _camera); } catch (e) {}
    // Wave 21 modules
    try { if (window.VehiclePhysics && VehiclePhysics.init) VehiclePhysics.init(_scene, _camera); } catch (e) {}
    try { if (window.DecoyFlare && DecoyFlare.init) DecoyFlare.init(_scene, _camera); } catch (e) {}
    try { if (window.FortificationBuilder && FortificationBuilder.init) FortificationBuilder.init(_scene, _camera); } catch (e) {}
    try { if (window.MortarStrikeSystem && MortarStrikeSystem.init) MortarStrikeSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.EnemyMedicNPC && EnemyMedicNPC.init) EnemyMedicNPC.init(_scene, _camera); } catch (e) {}
    try { if (window.ExplosiveBarrelChain && ExplosiveBarrelChain.init) ExplosiveBarrelChain.init(_scene, _camera); } catch (e) {}
    try { if (window.PowerupSystem && PowerupSystem.init) PowerupSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.WaveAnnouncement && WaveAnnouncement.init) WaveAnnouncement.init(_scene, _camera); } catch (e) {}
    try { if (window.EnvironmentalHazards && EnvironmentalHazards.init) EnvironmentalHazards.init(_scene, _camera); } catch (e) {}
    // Wave 22 modules
    try { if (window.CaptureZone && CaptureZone.init) CaptureZone.init(_scene, _camera); } catch (e) {}
    try { if (window.AirdropSupply && AirdropSupply.init) AirdropSupply.init(_scene, _camera); } catch (e) {}
    try { if (window.StealthSystem && StealthSystem.init) StealthSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.EnemyCoordinator && EnemyCoordinator.init) EnemyCoordinator.init(_scene, _camera); } catch (e) {}
    try { if (window.HelicopterGunship && HelicopterGunship.init) HelicopterGunship.init(_scene, _camera); } catch (e) {}
    try { if (window.JavelinLauncher && JavelinLauncher.init) JavelinLauncher.init(_scene, _camera); } catch (e) {}
    try { if (window.TimedCharges && TimedCharges.init) TimedCharges.init(_scene, _camera); } catch (e) {}
    try { if (window.SoldierSkillTree && SoldierSkillTree.init) SoldierSkillTree.init(_scene, _camera); } catch (e) {}
    try { if (window.ShieldGenerator && ShieldGenerator.init) ShieldGenerator.init(_scene, _camera); } catch (e) {}
    try { if (window.CombatXPSystem && CombatXPSystem.init) CombatXPSystem.init(_scene, _camera); } catch (e) {}
    // Loose modules (Waves 21-22 extras)
    try { if (window.LootSystem && LootSystem.init) LootSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.ProximityMine && ProximityMine.init) ProximityMine.init(_scene, _camera); } catch (e) {}
    try { if (window.TacticalShield && TacticalShield.init) TacticalShield.init(_scene, _camera); } catch (e) {}
    // Wave 23 modules
    try { if (window.MineSweeper && MineSweeper.init) MineSweeper.init(_scene, _camera); } catch (e) {}
    try { if (window.SniperNest && SniperNest.init) SniperNest.init(_scene, _camera); } catch (e) {}
    try { if (window.VehicleConvoy && VehicleConvoy.init) VehicleConvoy.init(_scene, _camera); } catch (e) {}
    try { if (window.WeaponWorkshop && WeaponWorkshop.init) WeaponWorkshop.init(_scene, _camera); } catch (e) {}
    try { if (window.SquadTactics && SquadTactics.init) SquadTactics.init(_scene, _camera); } catch (e) {}
    try { if (window.BattleReplay && BattleReplay.init) BattleReplay.init(_scene, _camera); } catch (e) {}
    try { if (window.DynamicEvents && DynamicEvents.init) DynamicEvents.init(_scene, _camera); } catch (e) {}
    try { if (window.PropagandaSystem && PropagandaSystem.init) PropagandaSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.TankControls && TankControls.init) TankControls.init(_scene, _camera); } catch (e) {}
    try { if (window.NBCProtection && NBCProtection.init) NBCProtection.init(_scene, _camera); } catch (e) {}
    // Wave 24 modules
    try { if (window.ArtilleryBattery && ArtilleryBattery.init) ArtilleryBattery.init(_scene, _camera); } catch (e) {}
    try { if (window.UrbanDestruction && UrbanDestruction.init) UrbanDestruction.init(_scene, _camera); } catch (e) {}
    try { if (window.MedicStation && MedicStation.init) MedicStation.init(_scene, _camera); } catch (e) {}
    try { if (window.WeatherSystem && WeatherSystem.init) WeatherSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.ArmorSystem && ArmorSystem.init) ArmorSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.BunkerAssault && BunkerAssault.init) BunkerAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.SignalIntelligence && SignalIntelligence.init) SignalIntelligence.init(_scene, _camera); } catch (e) {}
    try { if (window.ReconDrone && ReconDrone.init) ReconDrone.init(_scene, _camera); } catch (e) {}
    try { if (window.NightVision && NightVision.init) NightVision.init(_scene, _camera); } catch (e) {}
    try { if (window.AirSupport && AirSupport.init) AirSupport.init(_scene, _camera); } catch (e) {}
    // Wave 25 modules
    try { if (window.SatelliteUplink && SatelliteUplink.init) SatelliteUplink.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonerRescue && PrisonerRescue.init) PrisonerRescue.init(_scene, _camera); } catch (e) {}
    try { if (window.SiegeEngine && SiegeEngine.init) SiegeEngine.init(_scene, _camera); } catch (e) {}
    try { if (window.SmokeGrenade && SmokeGrenade.init) SmokeGrenade.init(_scene, _camera); } catch (e) {}
    try { if (window.FortifiedOutpost && FortifiedOutpost.init) FortifiedOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.CombatKnife && CombatKnife.init) CombatKnife.init(_scene, _camera); } catch (e) {}
    try { if (window.MinefieldMapper && MinefieldMapper.init) MinefieldMapper.init(_scene, _camera); } catch (e) {}
    try { if (window.FieldComms && FieldComms.init) FieldComms.init(_scene, _camera); } catch (e) {}
    try { if (window.TrophySystem && TrophySystem.init) TrophySystem.init(_scene, _camera); } catch (e) {}
    try { if (window.ExtractionZone && ExtractionZone.init) ExtractionZone.init(_scene, _camera); } catch (e) {}
    // Wave 26 modules
    try { if (window.AmphibiousAssault && AmphibiousAssault.init) AmphibiousAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.SupplyChain && SupplyChain.init) SupplyChain.init(_scene, _camera); } catch (e) {}
    try { if (window.RiotControl && RiotControl.init) RiotControl.init(_scene, _camera); } catch (e) {}
    try { if (window.ElectromagneticPulse && ElectromagneticPulse.init) ElectromagneticPulse.init(_scene, _camera); } catch (e) {}
    try { if (window.HostageNegotiation && HostageNegotiation.init) HostageNegotiation.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberWarfare && CyberWarfare.init) CyberWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.AntiAir && AntiAir.init) AntiAir.init(_scene, _camera); } catch (e) {}
    try { if (window.BlackMarket && BlackMarket.init) BlackMarket.init(_scene, _camera); } catch (e) {}
    try { if (window.BallisticCalculator && BallisticCalculator.init) BallisticCalculator.init(_scene, _camera); } catch (e) {}
    try { if (window.TunnelSystem && TunnelSystem.init) TunnelSystem.init(_scene, _camera); } catch (e) {}
    // Wave 27 modules
    try { if (window.VehicleRepair && VehicleRepair.init) VehicleRepair.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostRecon && GhostRecon.init) GhostRecon.init(_scene, _camera); } catch (e) {}
    try { if (window.LandslideEvent && LandslideEvent.init) LandslideEvent.init(_scene, _camera); } catch (e) {}
    try { if (window.WarCrimesDetector && WarCrimesDetector.init) WarCrimesDetector.init(_scene, _camera); } catch (e) {}
    try { if (window.CommandoRaid && CommandoRaid.init) CommandoRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.IntelligenceBriefing && IntelligenceBriefing.init) IntelligenceBriefing.init(_scene, _camera); } catch (e) {}
    try { if (window.ParachuteDrop && ParachuteDrop.init) ParachuteDrop.init(_scene, _camera); } catch (e) {}
    try { if (window.RadioBeacon && RadioBeacon.init) RadioBeacon.init(_scene, _camera); } catch (e) {}
    try { if (window.BodyDrag && BodyDrag.init) BodyDrag.init(_scene, _camera); } catch (e) {}
    try { if (window.PsyOps && PsyOps.init) PsyOps.init(_scene, _camera); } catch (e) {}
    // Wave 28 modules
    try { if (window.AmbushSystem && AmbushSystem.init) AmbushSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.FieldHospital && FieldHospital.init) FieldHospital.init(_scene, _camera); } catch (e) {}
    try { if (window.ReconSatellite && ReconSatellite.init) ReconSatellite.init(_scene, _camera); } catch (e) {}
    try { if (window.FortificationBuilder && FortificationBuilder.init) FortificationBuilder.init(_scene, _camera); } catch (e) {}
    try { if (window.NavalCombat && NavalCombat.init) NavalCombat.init(_scene, _camera); } catch (e) {}
    try { if (window.CounterSniper && CounterSniper.init) CounterSniper.init(_scene, _camera); } catch (e) {}
    try { if (window.ExplosiveOrdnance && ExplosiveOrdnance.init) ExplosiveOrdnance.init(_scene, _camera); } catch (e) {}
    try { if (window.ChainOfCommand && ChainOfCommand.init) ChainOfCommand.init(_scene, _camera); } catch (e) {}
    try { if (window.WeatherEffects && WeatherEffects.init) WeatherEffects.init(_scene, _camera); } catch (e) {}
    try { if (window.ObjectiveTracker && ObjectiveTracker.init) ObjectiveTracker.init(_scene, _camera); } catch (e) {}
    // Wave 29 modules
    try { if (window.BattleDamageAssessment && BattleDamageAssessment.init) BattleDamageAssessment.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonerExchange && PrisonerExchange.init) PrisonerExchange.init(_scene, _camera); } catch (e) {}
    try { if (window.TacticalRetreat && TacticalRetreat.init) TacticalRetreat.init(_scene, _camera); } catch (e) {}
    try { if (window.KillHouse && KillHouse.init) KillHouse.init(_scene, _camera); } catch (e) {}
    try { if (window.MortarCalculator && MortarCalculator.init) MortarCalculator.init(_scene, _camera); } catch (e) {}
    try { if (window.LogisticsSystem && LogisticsSystem.init) LogisticsSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.StealthSystem && StealthSystem.init) StealthSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.UrbanPatrol && UrbanPatrol.init) UrbanPatrol.init(_scene, _camera); } catch (e) {}
    try { if (window.ElectronicWarfare && ElectronicWarfare.init) ElectronicWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.VehicleConvoy && VehicleConvoy.init) VehicleConvoy.init(_scene, _camera); } catch (e) {}
    // Wave 30 modules
    try { if (window.BreachingCharges && BreachingCharges.init) BreachingCharges.init(_scene, _camera); } catch (e) {}
    try { if (window.CasualtyEvacuation && CasualtyEvacuation.init) CasualtyEvacuation.init(_scene, _camera); } catch (e) {}
    try { if (window.NightVision && NightVision.init) NightVision.init(_scene, _camera); } catch (e) {}
    try { if (window.FireSupport && FireSupport.init) FireSupport.init(_scene, _camera); } catch (e) {}
    try { if (window.ShieldSystem && ShieldSystem.init) ShieldSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.MineField && MineField.init) MineField.init(_scene, _camera); } catch (e) {}
    try { if (window.TankCommander && TankCommander.init) TankCommander.init(_scene, _camera); } catch (e) {}
    try { if (window.CombatMedic && CombatMedic.init) CombatMedic.init(_scene, _camera); } catch (e) {}
    try { if (window.SiegeWarfare && SiegeWarfare.init) SiegeWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.SniperRifle && SniperRifle.init) SniperRifle.init(_scene, _camera); } catch (e) {}
    // Wave 31 modules
    try { if (window.RappellingSystem && RappellingSystem.init) RappellingSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.GrenadeTypes && GrenadeTypes.init) GrenadeTypes.init(_scene, _camera); } catch (e) {}
    try { if (window.SentryGun && SentryGun.init) SentryGun.init(_scene, _camera); } catch (e) {}
    try { if (window.BunkerAssault && BunkerAssault.init) BunkerAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.AirAssault && AirAssault.init) AirAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.WeatherAmbience && WeatherAmbience.init) WeatherAmbience.init(_scene, _camera); } catch (e) {}
    try { if (window.ObjectiveCapture && ObjectiveCapture.init) ObjectiveCapture.init(_scene, _camera); } catch (e) {}
    try { if (window.TunnelNetwork && TunnelNetwork.init) TunnelNetwork.init(_scene, _camera); } catch (e) {}
    try { if (window.MeleeCombat && MeleeCombat.init) MeleeCombat.init(_scene, _camera); } catch (e) {}
    try { if (window.VehicleDamage && VehicleDamage.init) VehicleDamage.init(_scene, _camera); } catch (e) {}
    // Wave 32 modules
    try { if (window.SupplyDrop && SupplyDrop.init) SupplyDrop.init(_scene, _camera); } catch (e) {}
    try { if (window.HostageRescue && HostageRescue.init) HostageRescue.init(_scene, _camera); } catch (e) {}
    try { if (window.MapSystem && MapSystem.init) MapSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.DecoySystem && DecoySystem.init) DecoySystem.init(_scene, _camera); } catch (e) {}
    try { if (window.CombatDrone && CombatDrone.init) CombatDrone.init(_scene, _camera); } catch (e) {}
    try { if (window.ArmorSystem && ArmorSystem.init) ArmorSystem.init(_scene, _camera); } catch (e) {}
    try { if (window.FortifiedRetreat && FortifiedRetreat.init) FortifiedRetreat.init(_scene, _camera); } catch (e) {}
    try { if (window.WeatherStorm && WeatherStorm.init) WeatherStorm.init(_scene, _camera); } catch (e) {}
    try { if (window.SpecialForces && SpecialForces.init) SpecialForces.init(_scene, _camera); } catch (e) {}
    try { if (window.CommandBunker && CommandBunker.init) CommandBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.CombatSwimming && CombatSwimming.init) CombatSwimming.init(_scene, _camera); } catch (e) {}
    try { if (window.AerialDogfight && AerialDogfight.init) AerialDogfight.init(_scene, _camera); } catch (e) {}
    try { if (window.ForwardObserver && ForwardObserver.init) ForwardObserver.init(_scene, _camera); } catch (e) {}
    try { if (window.CombatJump && CombatJump.init) CombatJump.init(_scene, _camera); } catch (e) {}
    try { if (window.CombatEngineering && CombatEngineering.init) CombatEngineering.init(_scene, _camera); } catch (e) {}
    try { if (window.IEDDisposal && IEDDisposal.init) IEDDisposal.init(_scene, _camera); } catch (e) {}
    try { if (window.BattlefieldTriage && BattlefieldTriage.init) BattlefieldTriage.init(_scene, _camera); } catch (e) {}
    try { if (window.FirebaseDefense && FirebaseDefense.init) FirebaseDefense.init(_scene, _camera); } catch (e) {}
    try { if (window.IntelNetwork && IntelNetwork.init) IntelNetwork.init(_scene, _camera); } catch (e) {}
    try { if (window.NavalOperations && NavalOperations.init) NavalOperations.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticWarfare && ArcticWarfare.init) ArcticWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleWarfare && JungleWarfare.init) JungleWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.CheckpointAssault && CheckpointAssault.init) CheckpointAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.CommandVehicle && CommandVehicle.init) CommandVehicle.init(_scene, _camera); } catch (e) {}
    try { if (window.BallisticShieldOps && BallisticShieldOps.init) BallisticShieldOps.init(_scene, _camera); } catch (e) {}
    try { if (window.RiotResponse && RiotResponse.init) RiotResponse.init(_scene, _camera); } catch (e) {}
    try { if (window.FactorySabotage && FactorySabotage.init) FactorySabotage.init(_scene, _camera); } catch (e) {}
    try { if (window.POWEscape && POWEscape.init) POWEscape.init(_scene, _camera); } catch (e) {}
    try { if (window.AmbushNetwork && AmbushNetwork.init) AmbushNetwork.init(_scene, _camera); } catch (e) {}
    try { if (window.EscapeEvade && EscapeEvade.init) EscapeEvade.init(_scene, _camera); } catch (e) {}
    try { if (window.UrbanWarfare && UrbanWarfare.init) UrbanWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.RescueDownedPilot && RescueDownedPilot.init) RescueDownedPilot.init(_scene, _camera); } catch (e) {}
    try { if (window.ConvoyEscort && ConvoyEscort.init) ConvoyEscort.init(_scene, _camera); } catch (e) {}
    try { if (window.DeepRecon && DeepRecon.init) DeepRecon.init(_scene, _camera); } catch (e) {}
    try { if (window.SupplyChainAttack && SupplyChainAttack.init) SupplyChainAttack.init(_scene, _camera); } catch (e) {}
    try { if (window.MassSurrender && MassSurrender.init) MassSurrender.init(_scene, _camera); } catch (e) {}
    try { if (window.SiegeTower && SiegeTower.init) SiegeTower.init(_scene, _camera); } catch (e) {}
    try { if (window.SniperHunt && SniperHunt.init) SniperHunt.init(_scene, _camera); } catch (e) {}
    try { if (window.VehicleRecovery && VehicleRecovery.init) VehicleRecovery.init(_scene, _camera); } catch (e) {}
    try { if (window.HostageStandoff && HostageStandoff.init) HostageStandoff.init(_scene, _camera); } catch (e) {}
    try { if (window.NightVisionOps && NightVisionOps.init) NightVisionOps.init(_scene, _camera); } catch (e) {}
    try { if (window.BridgeDemolition && BridgeDemolition.init) BridgeDemolition.init(_scene, _camera); } catch (e) {}
    try { if (window.ArtilleryDuel && ArtilleryDuel.init) ArtilleryDuel.init(_scene, _camera); } catch (e) {}
    try { if (window.TunnelWarfare && TunnelWarfare.init) TunnelWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.CarrierAssault && CarrierAssault.init) CarrierAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.DroneSwarm && DroneSwarm.init) DroneSwarm.init(_scene, _camera); } catch (e) {}
    try { if (window.ChemBioResponse && ChemBioResponse.init) ChemBioResponse.init(_scene, _camera); } catch (e) {}
    try { if (window.MedevacOps && MedevacOps.init) MedevacOps.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonBreak && PrisonBreak.init) PrisonBreak.init(_scene, _camera); } catch (e) {}
    try { if (window.MountainAssault && MountainAssault.init) MountainAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.MechSuit && MechSuit.init) MechSuit.init(_scene, _camera); } catch (e) {}
    try { if (window.RiverCrossing && RiverCrossing.init) RiverCrossing.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberWarfare && CyberWarfare.init) CyberWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.TrainAssault && TrainAssault.init) TrainAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearShutdown && NuclearShutdown.init) NuclearShutdown.init(_scene, _camera); } catch (e) {}
    try { if (window.RadioTower && RadioTower.init) RadioTower.init(_scene, _camera); } catch (e) {}
    try { if (window.MortarBarrage && MortarBarrage.init) MortarBarrage.init(_scene, _camera); } catch (e) {}
    try { if (window.TankWarfare && TankWarfare.init) TankWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertStorm && DesertStorm.init) DesertStorm.init(_scene, _camera); } catch (e) {}
    try { if (window.RefugeeConvoy && RefugeeConvoy.init) RefugeeConvoy.init(_scene, _camera); } catch (e) {}
    try { if (window.BlackOpsExtraction && BlackOpsExtraction.init) BlackOpsExtraction.init(_scene, _camera); } catch (e) {}
    try { if (window.ZeroGravityCombat && ZeroGravityCombat.init) ZeroGravityCombat.init(_scene, _camera); } catch (e) {}
    try { if (window.DroneRacing && DroneRacing.init) DroneRacing.init(_scene, _camera); } catch (e) {}
    try { if (window.PirateShipBattle && PirateShipBattle.init) PirateShipBattle.init(_scene, _camera); } catch (e) {}
    try { if (window.GladiatorArena && GladiatorArena.init) GladiatorArena.init(_scene, _camera); } catch (e) {}
    try { if (window.HeistPlanning && HeistPlanning.init) HeistPlanning.init(_scene, _camera); } catch (e) {}
    try { if (window.UnderwaterBase && UnderwaterBase.init) UnderwaterBase.init(_scene, _camera); } catch (e) {}
    try { if (window.ZombieOutbreak && ZombieOutbreak.init) ZombieOutbreak.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoEscape && VolcanoEscape.init) VolcanoEscape.init(_scene, _camera); } catch (e) {}
    try { if (window.FactionStandoff && FactionStandoff.init) FactionStandoff.init(_scene, _camera); } catch (e) {}
    try { if (window.AncientSiege && AncientSiege.init) AncientSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.MechWarfare && MechWarfare.init) MechWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.DrugLord && DrugLord.init) DrugLord.init(_scene, _camera); } catch (e) {}
    try { if (window.MoonBase && MoonBase.init) MoonBase.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonRiot && PrisonRiot.init) PrisonRiot.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticBase && ArcticBase.init) ArcticBase.init(_scene, _camera); } catch (e) {}
    try { if (window.TimeHeist && TimeHeist.init) TimeHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.AlienInvasion && AlienInvasion.init) AlienInvasion.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberHeist && CyberHeist.init) CyberHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.TrainRobbery && TrainRobbery.init) TrainRobbery.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleTemple && JungleTemple.init) JungleTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearPlant && NuclearPlant.init) NuclearPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.CasinoHeist && CasinoHeist.init) CasinoHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.OilRig && OilRig.init) OilRig.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyFortress && SkyFortress.init) SkyFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.SubmarineWarfare && SubmarineWarfare.init) SubmarineWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.BioLab && BioLab.init) BioLab.init(_scene, _camera); } catch (e) {}
    try { if (window.Assassination && Assassination.init) Assassination.init(_scene, _camera); } catch (e) {}
    try { if (window.SiegeDefense && SiegeDefense.init) SiegeDefense.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostMission && GhostMission.init) GhostMission.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceStation && SpaceStation.init) SpaceStation.init(_scene, _camera); } catch (e) {}
    try { if (window.PirateCove && PirateCove.init) PirateCove.init(_scene, _camera); } catch (e) {}
    try { if (window.GladiatorColosseum && GladiatorColosseum.init) GladiatorColosseum.init(_scene, _camera); } catch (e) {}
    try { if (window.BunkerBreach && BunkerBreach.init) BunkerBreach.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoAssault && VolcanoAssault.init) VolcanoAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.CargoShip && CargoShip.init) CargoShip.init(_scene, _camera); } catch (e) {}
    try { if (window.WarzoneHospital && WarzoneHospital.init) WarzoneHospital.init(_scene, _camera); } catch (e) {}
    try { if (window.ArmsDealer && ArmsDealer.init) ArmsDealer.init(_scene, _camera); } catch (e) {}
    try { if (window.HostageCrisis && HostageCrisis.init) HostageCrisis.init(_scene, _camera); } catch (e) {}
    try { if (window.TankBattalion && TankBattalion.init) TankBattalion.init(_scene, _camera); } catch (e) {}
    try { if (window.ZombieApocalypse && ZombieApocalypse.init) ZombieApocalypse.init(_scene, _camera); } catch (e) {}
    try { if (window.SamuraiDuel && SamuraiDuel.init) SamuraiDuel.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearSubmarine && NuclearSubmarine.init) NuclearSubmarine.init(_scene, _camera); } catch (e) {}
    try { if (window.RebelUprising && RebelUprising.init) RebelUprising.init(_scene, _camera); } catch (e) {}
    try { if (window.MiningDisaster && MiningDisaster.init) MiningDisaster.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonBreak && PrisonBreak.init) PrisonBreak.init(_scene, _camera); } catch (e) {}
    try { if (window.RacingCombat && RacingCombat.init) RacingCombat.init(_scene, _camera); } catch (e) {}
    try { if (window.MedievalSiege && MedievalSiege.init) MedievalSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.IslandAssault && IslandAssault.init) IslandAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberpunkCity && CyberpunkCity.init) CyberpunkCity.init(_scene, _camera); } catch (e) {}
    try { if (window.DeepJungle && DeepJungle.init) DeepJungle.init(_scene, _camera); } catch (e) {}
    try { if (window.BattleRoyale && BattleRoyale.init) BattleRoyale.init(_scene, _camera); } catch (e) {}
    try { if (window.CultCompound && CultCompound.init) CultCompound.init(_scene, _camera); } catch (e) {}
    try { if (window.HelipadExtraction && HelipadExtraction.init) HelipadExtraction.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertWarfare && DesertWarfare.init) DesertWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.UrbanSniper && UrbanSniper.init) UrbanSniper.init(_scene, _camera); } catch (e) {}
    try { if (window.ConvoyAmbush && ConvoyAmbush.init) ConvoyAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.NukeDisarm && NukeDisarm.init) NukeDisarm.init(_scene, _camera); } catch (e) {}
    try { if (window.StormTheCastle && StormTheCastle.init) StormTheCastle.init(_scene, _camera); } catch (e) {}
    try { if (window.CorporateEspionage && CorporateEspionage.init) CorporateEspionage.init(_scene, _camera); } catch (e) {}
    try { if (window.AlienMothership && AlienMothership.init) AlienMothership.init(_scene, _camera); } catch (e) {}
    try { if (window.GoldRush && GoldRush.init) GoldRush.init(_scene, _camera); } catch (e) {}
    try { if (window.UnderwaterRuins && UnderwaterRuins.init) UnderwaterRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticRescue && ArcticRescue.init) ArcticRescue.init(_scene, _camera); } catch (e) {}
    try { if (window.MobWar && MobWar.init) MobWar.init(_scene, _camera); } catch (e) {}
    try { if (window.TempleOfDoom && TempleOfDoom.init) TempleOfDoom.init(_scene, _camera); } catch (e) {}
    try { if (window.AirbaseRaid && AirbaseRaid.init) AirbaseRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.BlackSite && BlackSite.init) BlackSite.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceMarines && SpaceMarines.init) SpaceMarines.init(_scene, _camera); } catch (e) {}
    try { if (window.OilWar && OilWar.init) OilWar.init(_scene, _camera); } catch (e) {}
    try { if (window.MechAssault && MechAssault.init) MechAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleAmbush && JungleAmbush.init) JungleAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.CultBunker && CultBunker.init) CultBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearWinter && NuclearWinter.init) NuclearWinter.init(_scene, _camera); } catch (e) {}
    try { if (window.FortressAssault && FortressAssault.init) FortressAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.RobotUprising && RobotUprising.init) RobotUprising.init(_scene, _camera); } catch (e) {}
    try { if (window.DrugCartel && DrugCartel.init) DrugCartel.init(_scene, _camera); } catch (e) {}
    try { if (window.TimeHeist && TimeHeist.init) TimeHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.PirateIsland && PirateIsland.init) PirateIsland.init(_scene, _camera); } catch (e) {}
    try { if (window.AvalancheEscape && AvalancheEscape.init) AvalancheEscape.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberWarfare && CyberWarfare.init) CyberWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.SiegeOfParis && SiegeOfParis.init) SiegeOfParis.init(_scene, _camera); } catch (e) {}
    try { if (window.HauntedMansion && HauntedMansion.init) HauntedMansion.init(_scene, _camera); } catch (e) {}
    try { if (window.DiamondHeist && DiamondHeist.init) DiamondHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.WarOf1812 && WarOf1812.init) WarOf1812.init(_scene, _camera); } catch (e) {}
    try { if (window.Jailbreak && Jailbreak.init) Jailbreak.init(_scene, _camera); } catch (e) {}
    try { if (window.MeteorStrike && MeteorStrike.init) MeteorStrike.init(_scene, _camera); } catch (e) {}
    try { if (window.CloneWars && CloneWars.init) CloneWars.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoEscape && VolcanoEscape.init) VolcanoEscape.init(_scene, _camera); } catch (e) {}
    try { if (window.EmbassySiege && EmbassySiege.init) EmbassySiege.init(_scene, _camera); } catch (e) {}
    try { if (window.NightRaid && NightRaid.init) NightRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.KungFuDojo && KungFuDojo.init) KungFuDojo.init(_scene, _camera); } catch (e) {}
    try { if (window.RefugeeConvoy && RefugeeConvoy.init) RefugeeConvoy.init(_scene, _camera); } catch (e) {}
    try { if (window.MarsColony && MarsColony.init) MarsColony.init(_scene, _camera); } catch (e) {}
    try { if (window.SharkAttack && SharkAttack.init) SharkAttack.init(_scene, _camera); } catch (e) {}
    try { if (window.ColosseumBoss && ColosseumBoss.init) ColosseumBoss.init(_scene, _camera); } catch (e) {}
    try { if (window.DeepCover && DeepCover.init) DeepCover.init(_scene, _camera); } catch (e) {}
    try { if (window.SpySatellite && SpySatellite.init) SpySatellite.init(_scene, _camera); } catch (e) {}
    try { if (window.GladiatorArena && GladiatorArena.init) GladiatorArena.init(_scene, _camera); } catch (e) {}
    try { if (window.NukeLaunch && NukeLaunch.init) NukeLaunch.init(_scene, _camera); } catch (e) {}
    try { if (window.HostageTrain && HostageTrain.init) HostageTrain.init(_scene, _camera); } catch (e) {}
    try { if (window.WaterCrisis && WaterCrisis.init) WaterCrisis.init(_scene, _camera); } catch (e) {}
    try { if (window.MidnightCoup && MidnightCoup.init) MidnightCoup.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueOutbreak && PlagueOutbreak.init) PlagueOutbreak.init(_scene, _camera); } catch (e) {}
    try { if (window.OrbitalDefense && OrbitalDefense.init) OrbitalDefense.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenVessel && SunkenVessel.init) SunkenVessel.init(_scene, _camera); } catch (e) {}
    try { if (window.HighriseHostage && HighriseHostage.init) HighriseHostage.init(_scene, _camera); } catch (e) {}
    try { if (window.WarlordHunt && WarlordHunt.init) WarlordHunt.init(_scene, _camera); } catch (e) {}
    try { if (window.SupplyDepot && SupplyDepot.init) SupplyDepot.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertAmbush && DesertAmbush.init) DesertAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoFortress && VolcanoFortress.init) VolcanoFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.PirateRaid && PirateRaid.init) PirateRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.SubmarineHeist && SubmarineHeist.init) SubmarineHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.CasinoShootout && CasinoShootout.init) CasinoShootout.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticSiege && ArcticSiege.init) ArcticSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.MuseumHeist && MuseumHeist.init) MuseumHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.TrainHeist && TrainHeist.init) TrainHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostTown && GhostTown.init) GhostTown.init(_scene, _camera); } catch (e) {}
    try { if (window.AncientTemple && AncientTemple.init) AncientTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.FootballStadium && FootballStadium.init) FootballStadium.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonEscape && PrisonEscape.init) PrisonEscape.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberpunkHeist && CyberpunkHeist.init) CyberpunkHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.AvalancheRescue && AvalancheRescue.init) AvalancheRescue.init(_scene, _camera); } catch (e) {}
    try { if (window.RomanConquest && RomanConquest.init) RomanConquest.init(_scene, _camera); } catch (e) {}
    try { if (window.OilPlatform && OilPlatform.init) OilPlatform.init(_scene, _camera); } catch (e) {}
    try { if (window.SamuraiSiege && SamuraiSiege.init) SamuraiSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.BloodDiamond && BloodDiamond.init) BloodDiamond.init(_scene, _camera); } catch (e) {}
    try { if (window.SpacePirates && SpacePirates.init) SpacePirates.init(_scene, _camera); } catch (e) {}
    try { if (window.KungFuTemple && KungFuTemple.init) KungFuTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.DeepSeaBase && DeepSeaBase.init) DeepSeaBase.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleTempleRaid && JungleTempleRaid.init) JungleTempleRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.VikingLongship && VikingLongship.init) VikingLongship.init(_scene, _camera); } catch (e) {}
    try { if (window.GuerrillaWar && GuerrillaWar.init) GuerrillaWar.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyscraperSiege && SkyscraperSiege.init) SkyscraperSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.CargoPlane && CargoPlane.init) CargoPlane.init(_scene, _camera); } catch (e) {}
    try { if (window.BankHeist && BankHeist.init) BankHeist.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberEspionage && CyberEspionage.init) CyberEspionage.init(_scene, _camera); } catch (e) {}
    try { if (window.InsurgentCamp && InsurgentCamp.init) InsurgentCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.MoonbaseAssault && MoonbaseAssault.init) MoonbaseAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.WitnessProtection && WitnessProtection.init) WitnessProtection.init(_scene, _camera); } catch (e) {}
    try { if (window.CartelCompound && CartelCompound.init) CartelCompound.init(_scene, _camera); } catch (e) {}
    try { if (window.TokyoShowdown && TokyoShowdown.init) TokyoShowdown.init(_scene, _camera); } catch (e) {}
    try { if (window.DoomsdayVault && DoomsdayVault.init) DoomsdayVault.init(_scene, _camera); } catch (e) {}
    try { if (window.AztecRuins && AztecRuins.init) AztecRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.CiaSafehouse && CiaSafehouse.init) CiaSafehouse.init(_scene, _camera); } catch (e) {}
    try { if (window.NeonArena && NeonArena.init) NeonArena.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostOps && GhostOps.init) GhostOps.init(_scene, _camera); } catch (e) {}
    try { if (window.ArmsSmuggler && ArmsSmuggler.init) ArmsSmuggler.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceStationSiege && SpaceStationSiege.init) SpaceStationSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonRiotResponse && PrisonRiotResponse.init) PrisonRiotResponse.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleCombat && JungleCombat.init) JungleCombat.init(_scene, _camera); } catch (e) {}
    try { if (window.TrainHijack && TrainHijack.init) TrainHijack.init(_scene, _camera); } catch (e) {}
    try { if (window.BountyHunter && BountyHunter.init) BountyHunter.init(_scene, _camera); } catch (e) {}
    try { if (window.BioLabOutbreak && BioLabOutbreak.init) BioLabOutbreak.init(_scene, _camera); } catch (e) {}
    try { if (window.AntarcticStation && AntarcticStation.init) AntarcticStation.init(_scene, _camera); } catch (e) {}
    try { if (window.TimeParadox && TimeParadox.init) TimeParadox.init(_scene, _camera); } catch (e) {}
    try { if (window.NightMarketRaid && NightMarketRaid.init) NightMarketRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.SubmarineHunter && SubmarineHunter.init) SubmarineHunter.init(_scene, _camera); } catch (e) {}
    try { if (window.GlacierFortress && GlacierFortress.init) GlacierFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.TempleGuardian && TempleGuardian.init) TempleGuardian.init(_scene, _camera); } catch (e) {}
    try { if (window.DrugLabTakedown && DrugLabTakedown.init) DrugLabTakedown.init(_scene, _camera); } catch (e) {}
    try { if (window.PowerPlantSiege && PowerPlantSiege.init) PowerPlantSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.AbandonedAsylum && AbandonedAsylum.init) AbandonedAsylum.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticConvoy && ArcticConvoy.init) ArcticConvoy.init(_scene, _camera); } catch (e) {}
    try { if (window.ChemicalFactory && ChemicalFactory.init) ChemicalFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.ColosseumBattle && ColosseumBattle.init) ColosseumBattle.init(_scene, _camera); } catch (e) {}
    try { if (window.BlackMarketArms && BlackMarketArms.init) BlackMarketArms.init(_scene, _camera); } catch (e) {}
    try { if (window.HarborBlockade && HarborBlockade.init) HarborBlockade.init(_scene, _camera); } catch (e) {}
    try { if (window.MountainPass && MountainPass.init) MountainPass.init(_scene, _camera); } catch (e) {}
    try { if (window.BankVault && BankVault.init) BankVault.init(_scene, _camera); } catch (e) {}
    try { if (window.IslandFortress && IslandFortress.init) IslandFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.TrainStationSiege && TrainStationSiege.init) TrainStationSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.SewersEscape && SewersEscape.init) SewersEscape.init(_scene, _camera); } catch (e) {}
    try { if (window.WeaponsFactory && WeaponsFactory.init) WeaponsFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.ResearchStation && ResearchStation.init) ResearchStation.init(_scene, _camera); } catch (e) {}
    try { if (window.UndergroundFight && UndergroundFight.init) UndergroundFight.init(_scene, _camera); } catch (e) {}
    try { if (window.FortressBreach && FortressBreach.init) FortressBreach.init(_scene, _camera); } catch (e) {}
    try { if (window.WetlandsAmbush && WetlandsAmbush.init) WetlandsAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceColony && SpaceColony.init) SpaceColony.init(_scene, _camera); } catch (e) {}
    try { if (window.GlacierCave && GlacierCave.init) GlacierCave.init(_scene, _camera); } catch (e) {}
    try { if (window.AbandonedCity && AbandonedCity.init) AbandonedCity.init(_scene, _camera); } catch (e) {}
    try { if (window.AirBaseAssault && AirBaseAssault.init) AirBaseAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoTemple && VolcanoTemple.init) VolcanoTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.DiamondMine && DiamondMine.init) DiamondMine.init(_scene, _camera); } catch (e) {}
    try { if (window.OilRigSiege && OilRigSiege.init) OilRigSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.HauntedManor && HauntedManor.init) HauntedManor.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticResearch && ArcticResearch.init) ArcticResearch.init(_scene, _camera); } catch (e) {}
    try { if (window.RooftopShowdown && RooftopShowdown.init) RooftopShowdown.init(_scene, _camera); } catch (e) {}
    try { if (window.UnderwaterLab && UnderwaterLab.init) UnderwaterLab.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertFortress && DesertFortress.init) DesertFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.RacingCircuit && RacingCircuit.init) RacingCircuit.init(_scene, _camera); } catch (e) {}
    try { if (window.UndergroundBunker && UndergroundBunker.init) UndergroundBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.CarnivalChaos && CarnivalChaos.init) CarnivalChaos.init(_scene, _camera); } catch (e) {}
    try { if (window.GlacierBase && GlacierBase.init) GlacierBase.init(_scene, _camera); } catch (e) {}
    try { if (window.MetroStation && MetroStation.init) MetroStation.init(_scene, _camera); } catch (e) {}
    try { if (window.SwampVillage && SwampVillage.init) SwampVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostShip && GhostShip.init) GhostShip.init(_scene, _camera); } catch (e) {}
    try { if (window.SatelliteDish && SatelliteDish.init) SatelliteDish.init(_scene, _camera); } catch (e) {}
    try { if (window.EmbassyRaid && EmbassyRaid.init) EmbassyRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.CruiseShip && CruiseShip.init) CruiseShip.init(_scene, _camera); } catch (e) {}
    try { if (window.BunkerComplex && BunkerComplex.init) BunkerComplex.init(_scene, _camera); } catch (e) {}
    try { if (window.AirportSiege && AirportSiege.init) AirportSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.MountainVillage && MountainVillage.init) MountainVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.RefineryAssault && RefineryAssault.init) RefineryAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceDebris && SpaceDebris.init) SpaceDebris.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleAirstrip && JungleAirstrip.init) JungleAirstrip.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenWreck && SunkenWreck.init) SunkenWreck.init(_scene, _camera); } catch (e) {}
    try { if (window.WarCrimesTrial && WarCrimesTrial.init) WarCrimesTrial.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicWasteland && ToxicWasteland.init) ToxicWasteland.init(_scene, _camera); } catch (e) {}
    try { if (window.CargoTrain && CargoTrain.init) CargoTrain.init(_scene, _camera); } catch (e) {}
    try { if (window.TempleRuins && TempleRuins.init) TempleRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.AbandonedMine && AbandonedMine.init) AbandonedMine.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenTundra && FrozenTundra.init) FrozenTundra.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoIsland && VolcanoIsland.init) VolcanoIsland.init(_scene, _camera); } catch (e) {}
    try { if (window.FloodedCity && FloodedCity.init) FloodedCity.init(_scene, _camera); } catch (e) {}
    try { if (window.ChemicalPlant && ChemicalPlant.init) ChemicalPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.BorderCrossing && BorderCrossing.init) BorderCrossing.init(_scene, _camera); } catch (e) {}
    try { if (window.CrashedSatellite && CrashedSatellite.init) CrashedSatellite.init(_scene, _camera); } catch (e) {}
    try { if (window.PowerGrid && PowerGrid.init) PowerGrid.init(_scene, _camera); } catch (e) {}
    try { if (window.SubmarineDock && SubmarineDock.init) SubmarineDock.init(_scene, _camera); } catch (e) {}
    try { if (window.SewageTunnels && SewageTunnels.init) SewageTunnels.init(_scene, _camera); } catch (e) {}
    try { if (window.WarshipDeck && WarshipDeck.init) WarshipDeck.init(_scene, _camera); } catch (e) {}
    try { if (window.HauntedVillage && HauntedVillage.init) HauntedVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.AircraftHangar && AircraftHangar.init) AircraftHangar.init(_scene, _camera); } catch (e) {}
    try { if (window.ClockTower && ClockTower.init) ClockTower.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceElevator && SpaceElevator.init) SpaceElevator.init(_scene, _camera); } catch (e) {}
    try { if (window.CitySewer && CitySewer.init) CitySewer.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearBunker && NuclearBunker.init) NuclearBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleCamp && JungleCamp.init) JungleCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.AuctionHouse && AuctionHouse.init) AuctionHouse.init(_scene, _camera); } catch (e) {}
    try { if (window.DamAssault && DamAssault.init) DamAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticOutpost && ArcticOutpost.init) ArcticOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.CourtroomSiege && CourtroomSiege.init) CourtroomSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.OilPipeline && OilPipeline.init) OilPipeline.init(_scene, _camera); } catch (e) {}
    try { if (window.TechCampus && TechCampus.init) TechCampus.init(_scene, _camera); } catch (e) {}
    try { if (window.MedievalFortress && MedievalFortress.init) MedievalFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.SkiResort && SkiResort.init) SkiResort.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleRiver && JungleRiver.init) JungleRiver.init(_scene, _camera); } catch (e) {}
    try { if (window.BunkerHill && BunkerHill.init) BunkerHill.init(_scene, _camera); } catch (e) {}
    try { if (window.DataCenter && DataCenter.init) DataCenter.init(_scene, _camera); } catch (e) {}
    try { if (window.PirateFortress && PirateFortress.init) PirateFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.RooftopGarden && RooftopGarden.init) RooftopGarden.init(_scene, _camera); } catch (e) {}
    try { if (window.BurningCity && BurningCity.init) BurningCity.init(_scene, _camera); } catch (e) {}
    try { if (window.SwampLab && SwampLab.init) SwampLab.init(_scene, _camera); } catch (e) {}
    try { if (window.FloatingIsland && FloatingIsland.init) FloatingIsland.init(_scene, _camera); } catch (e) {}
    try { if (window.RuralAmbush && RuralAmbush.init) RuralAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.LookoutTower && LookoutTower.init) LookoutTower.init(_scene, _camera); } catch (e) {}
    try { if (window.UndergroundMarket && UndergroundMarket.init) UndergroundMarket.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyPlatform && SkyPlatform.init) SkyPlatform.init(_scene, _camera); } catch (e) {}
    try { if (window.TrainDepot && TrainDepot.init) TrainDepot.init(_scene, _camera); } catch (e) {}
    try { if (window.OrbitalStation && OrbitalStation.init) OrbitalStation.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertOutpost && DesertOutpost.init) DesertOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.HarborAssault && HarborAssault.init) HarborAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.CanyonRaid && CanyonRaid.init) CanyonRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.ShippingHub && ShippingHub.init) ShippingHub.init(_scene, _camera); } catch (e) {}
    try { if (window.DowntownSiege && DowntownSiege.init) DowntownSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.HighwayChase && HighwayChase.init) HighwayChase.init(_scene, _camera); } catch (e) {}
    try { if (window.WaterfallAmbush && WaterfallAmbush.init) WaterfallAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.ShipwreckReef && ShipwreckReef.init) ShipwreckReef.init(_scene, _camera); } catch (e) {}
    try { if (window.AncientRuins && AncientRuins.init) AncientRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.GeothermalPlant && GeothermalPlant.init) GeothermalPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.MissileSiloB && MissileSiloB.init) MissileSiloB.init(_scene, _camera); } catch (e) {}
    try { if (window.UnderwaterCave && UnderwaterCave.init) UnderwaterCave.init(_scene, _camera); } catch (e) {}
    try { if (window.ForestAmbush && ForestAmbush.init) ForestAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.ArenaCombat && ArenaCombat.init) ArenaCombat.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoObservatory && VolcanoObservatory.init) VolcanoObservatory.init(_scene, _camera); } catch (e) {}
    try { if (window.MiningColony && MiningColony.init) MiningColony.init(_scene, _camera); } catch (e) {}
    try { if (window.AirshipBattle && AirshipBattle.init) AirshipBattle.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonEscapeB && PrisonEscapeB.init) PrisonEscapeB.init(_scene, _camera); } catch (e) {}
    try { if (window.IslandBase && IslandBase.init) IslandBase.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberVault && CyberVault.init) CyberVault.init(_scene, _camera); } catch (e) {}
    try { if (window.HelipadAssault && HelipadAssault.init) HelipadAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.ChemicalDepot && ChemicalDepot.init) ChemicalDepot.init(_scene, _camera); } catch (e) {}
    try { if (window.MonasteryRaid && MonasteryRaid.init) MonasteryRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.PipelineSabotage && PipelineSabotage.init) PipelineSabotage.init(_scene, _camera); } catch (e) {}
    try { if (window.IceCave && IceCave.init) IceCave.init(_scene, _camera); } catch (e) {}
    try { if (window.DroneFactory && DroneFactory.init) DroneFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.NightMarket && NightMarket.init) NightMarket.init(_scene, _camera); } catch (e) {}
    try { if (window.WetlandsPatrol && WetlandsPatrol.init) WetlandsPatrol.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearLab && NuclearLab.init) NuclearLab.init(_scene, _camera); } catch (e) {}
    try { if (window.TankGraveyard && TankGraveyard.init) TankGraveyard.init(_scene, _camera); } catch (e) {}
    try { if (window.SatelliteBase && SatelliteBase.init) SatelliteBase.init(_scene, _camera); } catch (e) {}
    try { if (window.WarRoom && WarRoom.init) WarRoom.init(_scene, _camera); } catch (e) {}
    try { if (window.RescueMission && RescueMission.init) RescueMission.init(_scene, _camera); } catch (e) {}
    try { if (window.SandstormBase && SandstormBase.init) SandstormBase.init(_scene, _camera); } catch (e) {}
    try { if (window.WarRuins && WarRuins.init) WarRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.FogValley && FogValley.init) FogValley.init(_scene, _camera); } catch (e) {}
    try { if (window.SwampFort && SwampFort.init) SwampFort.init(_scene, _camera); } catch (e) {}
    try { if (window.StormBeach && StormBeach.init) StormBeach.init(_scene, _camera); } catch (e) {}
    try { if (window.AshFields && AshFields.init) AshFields.init(_scene, _camera); } catch (e) {}
    try { if (window.MidnightPort && MidnightPort.init) MidnightPort.init(_scene, _camera); } catch (e) {}
    try { if (window.FireCamp && FireCamp.init) FireCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.IronWall && IronWall.init) IronWall.init(_scene, _camera); } catch (e) {}
    try { if (window.VaporZone && VaporZone.init) VaporZone.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicSwamp && ToxicSwamp.init) ToxicSwamp.init(_scene, _camera); } catch (e) {}
    try { if (window.RadarHill && RadarHill.init) RadarHill.init(_scene, _camera); } catch (e) {}
    try { if (window.RebelCamp && RebelCamp.init) RebelCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.DeathRidge && DeathRidge.init) DeathRidge.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostFort && GhostFort.init) GhostFort.init(_scene, _camera); } catch (e) {}
    try { if (window.AcidMarsh && AcidMarsh.init) AcidMarsh.init(_scene, _camera); } catch (e) {}
    try { if (window.WarRelic && WarRelic.init) WarRelic.init(_scene, _camera); } catch (e) {}
    try { if (window.StormWall && StormWall.init) StormWall.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberGrid && CyberGrid.init) CyberGrid.init(_scene, _camera); } catch (e) {}
    try { if (window.RustBelt && RustBelt.init) RustBelt.init(_scene, _camera); } catch (e) {}
    try { if (window.RockFortress && RockFortress.init) RockFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.WireZone && WireZone.init) WireZone.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueZone && PlagueZone.init) PlagueZone.init(_scene, _camera); } catch (e) {}
    try { if (window.BlastCrater && BlastCrater.init) BlastCrater.init(_scene, _camera); } catch (e) {}
    try { if (window.SteelCity && SteelCity.init) SteelCity.init(_scene, _camera); } catch (e) {}
    try { if (window.DarkHarbor && DarkHarbor.init) DarkHarbor.init(_scene, _camera); } catch (e) {}
    try { if (window.BloodTide && BloodTide.init) BloodTide.init(_scene, _camera); } catch (e) {}
    try { if (window.CaveFortress && CaveFortress.init) CaveFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.AshLake && AshLake.init) AshLake.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaRidge && LavaRidge.init) LavaRidge.init(_scene, _camera); } catch (e) {}
    try { if (window.Oremine && Oremine.init) Oremine.init(_scene, _camera); } catch (e) {}
    try { if (window.TrenchCity && TrenchCity.init) TrenchCity.init(_scene, _camera); } catch (e) {}
    try { if (window.BombRange && BombRange.init) BombRange.init(_scene, _camera); } catch (e) {}
    try { if (window.FrostKeep && FrostKeep.init) FrostKeep.init(_scene, _camera); } catch (e) {}
        try { if (window.WarChapel && WarChapel.init) WarChapel.init(_scene, _camera); } catch (e) {}
        try { if (window.BrokenDam && BrokenDam.init) BrokenDam.init(_scene, _camera); } catch (e) {}
        try { if (window.EchoValley && EchoValley.init) EchoValley.init(_scene, _camera); } catch (e) {}
        try { if (window.SlagHeap && SlagHeap.init) SlagHeap.init(_scene, _camera); } catch (e) {}
        try { if (window.CryptKeep && CryptKeep.init) CryptKeep.init(_scene, _camera); } catch (e) {}
        try { if (window.SkyCitadel && SkyCitadel.init) SkyCitadel.init(_scene, _camera); } catch (e) {}
        try { if (window.WarGallery && WarGallery.init) WarGallery.init(_scene, _camera); } catch (e) {}
        try { if (window.SaltMine && SaltMine.init) SaltMine.init(_scene, _camera); } catch (e) {}
        try { if (window.WarBunker && WarBunker.init) WarBunker.init(_scene, _camera); } catch (e) {}
        try { if (window.MachineShop && MachineShop.init) MachineShop.init(_scene, _camera); } catch (e) {}
        try { if (window.GlacierFort && GlacierFort.init) GlacierFort.init(_scene, _camera); } catch (e) {}
        try { if (window.IronDepot && IronDepot.init) IronDepot.init(_scene, _camera); } catch (e) {}
        try { if (window.RustYard && RustYard.init) RustYard.init(_scene, _camera); } catch (e) {}
        try { if (window.BogFort && BogFort.init) BogFort.init(_scene, _camera); } catch (e) {}
        try { if (window.WireNest && WireNest.init) WireNest.init(_scene, _camera); } catch (e) {}
        try { if (window.MudCity && MudCity.init) MudCity.init(_scene, _camera); } catch (e) {}
        try { if (window.DarkMesa && DarkMesa.init) DarkMesa.init(_scene, _camera); } catch (e) {}
        try { if (window.RuinPort && RuinPort.init) RuinPort.init(_scene, _camera); } catch (e) {}
        try { if (window.AshDock && AshDock.init) AshDock.init(_scene, _camera); } catch (e) {}
        try { if (window.SwampGate && SwampGate.init) SwampGate.init(_scene, _camera); } catch (e) {}
        try { if (window.FireRidge && FireRidge.init) FireRidge.init(_scene, _camera); } catch (e) {}
        try { if (window.StormPort && StormPort.init) StormPort.init(_scene, _camera); } catch (e) {}
        try { if (window.RiverGate && RiverGate.init) RiverGate.init(_scene, _camera); } catch (e) {}
        try { if (window.DustHarbor && DustHarbor.init) DustHarbor.init(_scene, _camera); } catch (e) {}
        try { if (window.GrimYard && GrimYard.init) GrimYard.init(_scene, _camera); } catch (e) {}
        try { if (window.IronShore && IronShore.init) IronShore.init(_scene, _camera); } catch (e) {}
        try { if (window.TarPit && TarPit.init) TarPit.init(_scene, _camera); } catch (e) {}
        try { if (window.SaltLake && SaltLake.init) SaltLake.init(_scene, _camera); } catch (e) {}
        try { if (window.WarArch && WarArch.init) WarArch.init(_scene, _camera); } catch (e) {}
        try { if (window.CragFort && CragFort.init) CragFort.init(_scene, _camera); } catch (e) {}
        try { if (window.VoltDam && VoltDam.init) VoltDam.init(_scene, _camera); } catch (e) {}
        try { if (window.SootMill && SootMill.init) SootMill.init(_scene, _camera); } catch (e) {}
        try { if (window.PipeYard && PipeYard.init) PipeYard.init(_scene, _camera); } catch (e) {}
        try { if (window.CoalRidge && CoalRidge.init) CoalRidge.init(_scene, _camera); } catch (e) {}
        try { if (window.GunWharf && GunWharf.init) GunWharf.init(_scene, _camera); } catch (e) {}
        try { if (window.OrePit && OrePit.init) OrePit.init(_scene, _camera); } catch (e) {}
        try { if (window.FogBase && FogBase.init) FogBase.init(_scene, _camera); } catch (e) {}
        try { if (window.WaxFort && WaxFort.init) WaxFort.init(_scene, _camera); } catch (e) {}
        try { if (window.HexTown && HexTown.init) HexTown.init(_scene, _camera); } catch (e) {}
        try { if (window.KeelYard && KeelYard.init) KeelYard.init(_scene, _camera); } catch (e) {}
        try { if (window.AshVale && AshVale.init) AshVale.init(_scene, _camera); } catch (e) {}
        try { if (window.BogMill && BogMill.init) BogMill.init(_scene, _camera); } catch (e) {}
        try { if (window.LavaKeep && LavaKeep.init) LavaKeep.init(_scene, _camera); } catch (e) {}
        try { if (window.TideGate && TideGate.init) TideGate.init(_scene, _camera); } catch (e) {}
        try { if (window.ZincMine && ZincMine.init) ZincMine.init(_scene, _camera); } catch (e) {}
        try { if (window.ClayFort && ClayFort.init) ClayFort.init(_scene, _camera); } catch (e) {}
        try { if (window.DuskCamp && DuskCamp.init) DuskCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.BoneRidge && BoneRidge.init) BoneRidge.init(_scene, _camera); } catch (e) {}
        try { if (window.FogMill && FogMill.init) FogMill.init(_scene, _camera); } catch (e) {}
        try { if (window.SaltFlat && SaltFlat.init) SaltFlat.init(_scene, _camera); } catch (e) {}
        try { if (window.WarCove && WarCove.init) WarCove.init(_scene, _camera); } catch (e) {}
        try { if (window.IronGrove && IronGrove.init) IronGrove.init(_scene, _camera); } catch (e) {}
        try { if (window.DustPit && DustPit.init) DustPit.init(_scene, _camera); } catch (e) {}
        try { if (window.MudPass && MudPass.init) MudPass.init(_scene, _camera); } catch (e) {}
        try { if (window.CoalBay && CoalBay.init) CoalBay.init(_scene, _camera); } catch (e) {}
        try { if (window.FlintWall && FlintWall.init) FlintWall.init(_scene, _camera); } catch (e) {}
        try { if (window.StormGate && StormGate.init) StormGate.init(_scene, _camera); } catch (e) {}
        try { if (window.TarDock && TarDock.init) TarDock.init(_scene, _camera); } catch (e) {}
        try { if (window.OilDrum && OilDrum.init) OilDrum.init(_scene, _camera); } catch (e) {}
        try { if (window.PineFort && PineFort.init) PineFort.init(_scene, _camera); } catch (e) {}
        try { if (window.CragMill && CragMill.init) CragMill.init(_scene, _camera); } catch (e) {}
        try { if (window.SiltBay && SiltBay.init) SiltBay.init(_scene, _camera); } catch (e) {}
        try { if (window.DuneFort && DuneFort.init) DuneFort.init(_scene, _camera); } catch (e) {}
        try { if (window.RockQuay && RockQuay.init) RockQuay.init(_scene, _camera); } catch (e) {}
        try { if (window.AshFort && AshFort.init) AshFort.init(_scene, _camera); } catch (e) {}
        try { if (window.GrimPort && GrimPort.init) GrimPort.init(_scene, _camera); } catch (e) {}
        try { if (window.FenGate && FenGate.init) FenGate.init(_scene, _camera); } catch (e) {}
        try { if (window.MossKeep && MossKeep.init) MossKeep.init(_scene, _camera); } catch (e) {}
        try { if (window.RustCamp && RustCamp.init) RustCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.WireFort && WireFort.init) WireFort.init(_scene, _camera); } catch (e) {}
        try { if (window.ChalkPit && ChalkPit.init) ChalkPit.init(_scene, _camera); } catch (e) {}
        try { if (window.EmberVale && EmberVale.init) EmberVale.init(_scene, _camera); } catch (e) {}
        try { if (window.GlassDome && GlassDome.init) GlassDome.init(_scene, _camera); } catch (e) {}
        try { if (window.LochGate && LochGate.init) LochGate.init(_scene, _camera); } catch (e) {}
        try { if (window.CokeYard && CokeYard.init) CokeYard.init(_scene, _camera); } catch (e) {}
        try { if (window.PeatBog && PeatBog.init) PeatBog.init(_scene, _camera); } catch (e) {}
        try { if (window.IronTomb && IronTomb.init) IronTomb.init(_scene, _camera); } catch (e) {}
        try { if (window.WeldYard && WeldYard.init) WeldYard.init(_scene, _camera); } catch (e) {}
        try { if (window.BileFort && BileFort.init) BileFort.init(_scene, _camera); } catch (e) {}
        try { if (window.MastHill && MastHill.init) MastHill.init(_scene, _camera); } catch (e) {}
    try { if (window.ClayDock && ClayDock.init) ClayDock.init(_scene, _camera); } catch (e) {}
    try { if (window.FrostCamp && FrostCamp.init) FrostCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.RockLab && RockLab.init) RockLab.init(_scene, _camera); } catch (e) {}
    try { if (window.HempCamp && HempCamp.init) HempCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.FumeGate && FumeGate.init) FumeGate.init(_scene, _camera); } catch (e) {}
    try { if (window.CoalDock && CoalDock.init) CoalDock.init(_scene, _camera); } catch (e) {}
    try { if (window.MudKeep && MudKeep.init) MudKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.GustBase && GustBase.init) GustBase.init(_scene, _camera); } catch (e) {}
    try { if (window.SlagPit && SlagPit.init) SlagPit.init(_scene, _camera); } catch (e) {}
    try { if (window.BoneKeep && BoneKeep.init) BoneKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.WireCamp && WireCamp.init) WireCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.PeatFort && PeatFort.init) PeatFort.init(_scene, _camera); } catch (e) {}
    try { if (window.LimeDock && LimeDock.init) LimeDock.init(_scene, _camera); } catch (e) {}
    try { if (window.IronWharf && IronWharf.init) IronWharf.init(_scene, _camera); } catch (e) {}
    try { if (window.CragBase && CragBase.init) CragBase.init(_scene, _camera); } catch (e) {}
    try { if (window.FlakTower && FlakTower.init) FlakTower.init(_scene, _camera); } catch (e) {}
    try { if (window.VoltKeep && VoltKeep.init) VoltKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.DuskForge && DuskForge.init) DuskForge.init(_scene, _camera); } catch (e) {}
    try { if (window.SandKeep && SandKeep.init) SandKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.FenDock && FenDock.init) FenDock.init(_scene, _camera); } catch (e) {}
    try { if (window.TarBase && TarBase.init) TarBase.init(_scene, _camera); } catch (e) {}
    try { if (window.LochFort && LochFort.init) LochFort.init(_scene, _camera); } catch (e) {}
    try { if (window.StoneBay && StoneBay.init) StoneBay.init(_scene, _camera); } catch (e) {}
    try { if (window.MireCamp && MireCamp.init) MireCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.ZincKeep && ZincKeep.init) ZincKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.CrowBase && CrowBase.init) CrowBase.init(_scene, _camera); } catch (e) {}
    try { if (window.BarkCamp && BarkCamp.init) BarkCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.GaleFort && GaleFort.init) GaleFort.init(_scene, _camera); } catch (e) {}
    try { if (window.KeelDock && KeelDock.init) KeelDock.init(_scene, _camera); } catch (e) {}
    try { if (window.IronRidge && IronRidge.init) IronRidge.init(_scene, _camera); } catch (e) {}
    try { if (window.AshTower && AshTower.init) AshTower.init(_scene, _camera); } catch (e) {}
    try { if (window.MudGate && MudGate.init) MudGate.init(_scene, _camera); } catch (e) {}
    try { if (window.GrubCamp && GrubCamp.init) GrubCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.VineFort && VineFort.init) VineFort.init(_scene, _camera); } catch (e) {}
    try { if (window.SeedBase && SeedBase.init) SeedBase.init(_scene, _camera); } catch (e) {}
    try { if (window.HornKeep && HornKeep.init) HornKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.ReelDock && ReelDock.init) ReelDock.init(_scene, _camera); } catch (e) {}
    try { if (window.ClayRidge && ClayRidge.init) ClayRidge.init(_scene, _camera); } catch (e) {}
    try { if (window.DriftCamp && DriftCamp.init) DriftCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.PikeGate && PikeGate.init) PikeGate.init(_scene, _camera); } catch (e) {}
    try { if (window.GoreKeep && GoreKeep.init) GoreKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.ThornBase && ThornBase.init) ThornBase.init(_scene, _camera); } catch (e) {}
    try { if (window.FellCamp && FellCamp.init) FellCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.SootBase && SootBase.init) SootBase.init(_scene, _camera); } catch (e) {}
    try { if (window.MossDock && MossDock.init) MossDock.init(_scene, _camera); } catch (e) {}
    try { if (window.IceRidge && IceRidge.init) IceRidge.init(_scene, _camera); } catch (e) {}
    try { if (window.BrineGate && BrineGate.init) BrineGate.init(_scene, _camera); } catch (e) {}
    try { if (window.KelpCamp && KelpCamp.init) KelpCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.DuneCamp && DuneCamp.init) DuneCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.HazeFort && HazeFort.init) HazeFort.init(_scene, _camera); } catch (e) {}
        try { if (window.ArchCamp && ArchCamp.init) ArchCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.QuayKeep && QuayKeep.init) QuayKeep.init(_scene, _camera); } catch (e) {}
        try { if (window.RustRidge && RustRidge.init) RustRidge.init(_scene, _camera); } catch (e) {}
        try { if (window.BileCamp && BileCamp.init) BileCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.GritDock && GritDock.init) GritDock.init(_scene, _camera); } catch (e) {}
        try { if (window.JadeFort && JadeFort.init) JadeFort.init(_scene, _camera); } catch (e) {}
        try { if (window.MesaPost && MesaPost.init) MesaPost.init(_scene, _camera); } catch (e) {}
        try { if (window.CoveBase && CoveBase.init) CoveBase.init(_scene, _camera); } catch (e) {}
        try { if (window.GlenFort && GlenFort.init) GlenFort.init(_scene, _camera); } catch (e) {}
        try { if (window.ValeCamp && ValeCamp.init) ValeCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.ReefKeep && ReefKeep.init) ReefKeep.init(_scene, _camera); } catch (e) {}
        try { if (window.PeatDock && PeatDock.init) PeatDock.init(_scene, _camera); } catch (e) {}
        try { if (window.HolmCamp && HolmCamp.init) HolmCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.CragKeep && CragKeep.init) CragKeep.init(_scene, _camera); } catch (e) {}
        try { if (window.LochBase && LochBase.init) LochBase.init(_scene, _camera); } catch (e) {}
        try { if (window.TarnKeep && TarnKeep.init) TarnKeep.init(_scene, _camera); } catch (e) {}
        try { if (window.FossCamp && FossCamp.init) FossCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.MireDock && MireDock.init) MireDock.init(_scene, _camera); } catch (e) {}
        try { if (window.KnollPost && KnollPost.init) KnollPost.init(_scene, _camera); } catch (e) {}
        try { if (window.BraeFort && BraeFort.init) BraeFort.init(_scene, _camera); } catch (e) {}
        try { if (window.BurnCamp && BurnCamp.init) BurnCamp.init(_scene, _camera); } catch (e) {}
        try { if (window.FellKeep && FellKeep.init) FellKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.SlumWarfare && SlumWarfare.init) SlumWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.CliffOutpost && CliffOutpost.init) CliffOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.FortressGate && FortressGate.init) FortressGate.init(_scene, _camera); } catch (e) {}
    try { if (window.HighriseAssault && HighriseAssault.init) HighriseAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.OvergrownShrine && OvergrownShrine.init) OvergrownShrine.init(_scene, _camera); } catch (e) {}
    try { if (window.SignalTower && SignalTower.init) SignalTower.init(_scene, _camera); } catch (e) {}
    try { if (window.AmmoBunker && AmmoBunker.init) AmmoBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.LootVault && LootVault.init) LootVault.init(_scene, _camera); } catch (e) {}
    try { if (window.CoastalCliff && CoastalCliff.init) CoastalCliff.init(_scene, _camera); } catch (e) {}
    try { if (window.TacticalHub && TacticalHub.init) TacticalHub.init(_scene, _camera); } catch (e) {}
    try { if (window.SubwayAssault && SubwayAssault.init) SubwayAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.CargoDock && CargoDock.init) CargoDock.init(_scene, _camera); } catch (e) {}
    try { if (window.WinterVillage && WinterVillage.init) WinterVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonTowerB && PrisonTowerB.init) PrisonTowerB.init(_scene, _camera); } catch (e) {}
    try { if (window.AirfieldRaid && AirfieldRaid.init) AirfieldRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberBunker && CyberBunker.init) CyberBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.SwampFortress && SwampFortress.init) SwampFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.DuneFortress && DuneFortress.init) DuneFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.EvacuationZone && EvacuationZone.init) EvacuationZone.init(_scene, _camera); } catch (e) {}
    try { if (window.JunkyardWar && JunkyardWar.init) JunkyardWar.init(_scene, _camera); } catch (e) {}
    try { if (window.CasinoFloor && CasinoFloor.init) CasinoFloor.init(_scene, _camera); } catch (e) {}
    try { if (window.MetroHub && MetroHub.init) MetroHub.init(_scene, _camera); } catch (e) {}
    try { if (window.FactoryAssault && FactoryAssault.init) FactoryAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.ArmoryRaid && ArmoryRaid.init) ArmoryRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.CommandPost && CommandPost.init) CommandPost.init(_scene, _camera); } catch (e) {}
    try { if (window.QuarantineZone && QuarantineZone.init) QuarantineZone.init(_scene, _camera); } catch (e) {}
    try { if (window.WaterTreatment && WaterTreatment.init) WaterTreatment.init(_scene, _camera); } catch (e) {}
    try { if (window.MountainShrine && MountainShrine.init) MountainShrine.init(_scene, _camera); } catch (e) {}
    try { if (window.AirborneAssault && AirborneAssault.init) AirborneAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.MineComplex && MineComplex.init) MineComplex.init(_scene, _camera); } catch (e) {}
    try { if (window.SatelliteLaunch && SatelliteLaunch.init) SatelliteLaunch.init(_scene, _camera); } catch (e) {}
    try { if (window.RuinsCity && RuinsCity.init) RuinsCity.init(_scene, _camera); } catch (e) {}
    try { if (window.FuelStation && FuelStation.init) FuelStation.init(_scene, _camera); } catch (e) {}
    try { if (window.BeachLanding && BeachLanding.init) BeachLanding.init(_scene, _camera); } catch (e) {}
    try { if (window.RooftopSniper && RooftopSniper.init) RooftopSniper.init(_scene, _camera); } catch (e) {}
    try { if (window.CrashedChopper && CrashedChopper.init) CrashedChopper.init(_scene, _camera); } catch (e) {}
    try { if (window.PalaceRaid && PalaceRaid.init) PalaceRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.FloodZone && FloodZone.init) FloodZone.init(_scene, _camera); } catch (e) {}
    try { if (window.ScrapyardSiege && ScrapyardSiege.init) ScrapyardSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.RadioBunker && RadioBunker.init) RadioBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.CoastalFortress && CoastalFortress.init) CoastalFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.AncientFort && AncientFort.init) AncientFort.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenBase && FrozenBase.init) FrozenBase.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaFlow && LavaFlow.init) LavaFlow.init(_scene, _camera); } catch (e) {}
    try { if (window.AbandonedPrison && AbandonedPrison.init) AbandonedPrison.init(_scene, _camera); } catch (e) {}
    try { if (window.CanyonBase && CanyonBase.init) CanyonBase.init(_scene, _camera); } catch (e) {}
    try { if (window.DarkMarket && DarkMarket.init) DarkMarket.init(_scene, _camera); } catch (e) {}
    try { if (window.ShippingLane && ShippingLane.init) ShippingLane.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearShelter && NuclearShelter.init) NuclearShelter.init(_scene, _camera); } catch (e) {}
    try { if (window.ChurchSiege && ChurchSiege.init) ChurchSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.ResortSiege && ResortSiege.init) ResortSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.NightFactory && NightFactory.init) NightFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.MountaintopBase && MountaintopBase.init) MountaintopBase.init(_scene, _camera); } catch (e) {}
    try { if (window.BunkerNetwork && BunkerNetwork.init) BunkerNetwork.init(_scene, _camera); } catch (e) {}
    try { if (window.ReconPost && ReconPost.init) ReconPost.init(_scene, _camera); } catch (e) {}
    try { if (window.MuseumAssault && MuseumAssault.init) MuseumAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.StagingArea && StagingArea.init) StagingArea.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostVillage && GhostVillage.init) GhostVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.RiotZone && RiotZone.init) RiotZone.init(_scene, _camera); } catch (e) {}
    try { if (window.Colosseum && Colosseum.init) Colosseum.init(_scene, _camera); } catch (e) {}
    try { if (window.MazeFortress && MazeFortress.init) MazeFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceHub && SpaceHub.init) SpaceHub.init(_scene, _camera); } catch (e) {}
    try { if (window.PolarStation && PolarStation.init) PolarStation.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenShip && SunkenShip.init) SunkenShip.init(_scene, _camera); } catch (e) {}
    try { if (window.RadarDome && RadarDome.init) RadarDome.init(_scene, _camera); } catch (e) {}
    try { if (window.ShantyFortress && ShantyFortress.init) ShantyFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.CliffSummit && CliffSummit.init) CliffSummit.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicPlant && ToxicPlant.init) ToxicPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.CraterWar && CraterWar.init) CraterWar.init(_scene, _camera); } catch (e) {}
    try { if (window.WarCamp && WarCamp.init) WarCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.SnowFort && SnowFort.init) SnowFort.init(_scene, _camera); } catch (e) {}
    try { if (window.WarIsland && WarIsland.init) WarIsland.init(_scene, _camera); } catch (e) {}
    try { if (window.DeepBase && DeepBase.init) DeepBase.init(_scene, _camera); } catch (e) {}
    try { if (window.VoltBase && VoltBase.init) VoltBase.init(_scene, _camera); } catch (e) {}
    try { if (window.TempleRaid && TempleRaid.init) TempleRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.MagmaBase && MagmaBase.init) MagmaBase.init(_scene, _camera); } catch (e) {}
    try { if (window.TundraBase && TundraBase.init) TundraBase.init(_scene, _camera); } catch (e) {}
    try { if (window.OrbitalPlatform && OrbitalPlatform.init) OrbitalPlatform.init(_scene, _camera); } catch (e) {}
    try { if (window.TrenchAssault && TrenchAssault.init) TrenchAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.WaterfallBase && WaterfallBase.init) WaterfallBase.init(_scene, _camera); } catch (e) {}
    try { if (window.VaultRaid && VaultRaid.init) VaultRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceDock && SpaceDock.init) SpaceDock.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaCave && LavaCave.init) LavaCave.init(_scene, _camera); } catch (e) {}
    try { if (window.NeonCity && NeonCity.init) NeonCity.init(_scene, _camera); } catch (e) {}
    try { if (window.FortressPeak && FortressPeak.init) FortressPeak.init(_scene, _camera); } catch (e) {}
    try { if (window.ThermalPlant && ThermalPlant.init) ThermalPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.TidalBase && TidalBase.init) TidalBase.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyBase && SkyBase.init) SkyBase.init(_scene, _camera); } catch (e) {}
    try { if (window.SewerNetwork && SewerNetwork.init) SewerNetwork.init(_scene, _camera); } catch (e) {}
    try { if (window.CaveAmbush && CaveAmbush.init) CaveAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.TowerSiege && TowerSiege.init) TowerSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberDome && CyberDome.init) CyberDome.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleVillage && JungleVillage.init) JungleVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.GlacierVault && GlacierVault.init) GlacierVault.init(_scene, _camera); } catch (e) {}
    try { if (window.StormTower && StormTower.init) StormTower.init(_scene, _camera); } catch (e) {}
    try { if (window.SubterraneanBase && SubterraneanBase.init) SubterraneanBase.init(_scene, _camera); } catch (e) {}
    try { if (window.SiegeCamp && SiegeCamp.init) SiegeCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoRim && VolcanoRim.init) VolcanoRim.init(_scene, _camera); } catch (e) {}
    try { if (window.OutpostDelta && OutpostDelta.init) OutpostDelta.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleRuin && JungleRuin.init) JungleRuin.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyCarrier && SkyCarrier.init) SkyCarrier.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertRuins && DesertRuins.init) DesertRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.SnowValley && SnowValley.init) SnowValley.init(_scene, _camera); } catch (e) {}
    try { if (window.RuinedFort && RuinedFort.init) RuinedFort.init(_scene, _camera); } catch (e) {}
    try { if (window.CoralReef && CoralReef.init) CoralReef.init(_scene, _camera); } catch (e) {}
    try { if (window.PirateBay && PirateBay.init) PirateBay.init(_scene, _camera); } catch (e) {}
    try { if (window.FortressUnderground && FortressUnderground.init) FortressUnderground.init(_scene, _camera); } catch (e) {}
    try { if (window.FloodedMall && FloodedMall.init) FloodedMall.init(_scene, _camera); } catch (e) {}
    try { if (window.MountainMonastery && MountainMonastery.init) MountainMonastery.init(_scene, _camera); } catch (e) {}
    try { if (window.OceanPlatform && OceanPlatform.init) OceanPlatform.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenTemple && FrozenTemple.init) FrozenTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.CargoFortress && CargoFortress.init) CargoFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.WarBridge && WarBridge.init) WarBridge.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberTrain && CyberTrain.init) CyberTrain.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaBridge && LavaBridge.init) LavaBridge.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicSewer && ToxicSewer.init) ToxicSewer.init(_scene, _camera); } catch (e) {}
    try { if (window.IceBridge && IceBridge.init) IceBridge.init(_scene, _camera); } catch (e) {}
    try { if (window.MesaFort && MesaFort.init) MesaFort.init(_scene, _camera); } catch (e) {}
    try { if (window.WarHospital && WarHospital.init) WarHospital.init(_scene, _camera); } catch (e) {}
    try { if (window.SandCastle && SandCastle.init) SandCastle.init(_scene, _camera); } catch (e) {}
    try { if (window.DamFortress && DamFortress.init) DamFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.HauntedHouse && HauntedHouse.init) HauntedHouse.init(_scene, _camera); } catch (e) {}
    try { if (window.CrashedStation && CrashedStation.init) CrashedStation.init(_scene, _camera); } catch (e) {}
    try { if (window.SeaCliff && SeaCliff.init) SeaCliff.init(_scene, _camera); } catch (e) {}
    try { if (window.CliffVillage && CliffVillage.init) CliffVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.DroneBay && DroneBay.init) DroneBay.init(_scene, _camera); } catch (e) {}
    try { if (window.DeepBunker && DeepBunker.init) DeepBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.MineCart && MineCart.init) MineCart.init(_scene, _camera); } catch (e) {}
    try { if (window.WaterTowerSiege && WaterTowerSiege.init) WaterTowerSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.BioStation && BioStation.init) BioStation.init(_scene, _camera); } catch (e) {}
    try { if (window.CrumblingCastle && CrumblingCastle.init) CrumblingCastle.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyTemple && SkyTemple.init) SkyTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonIsland && PrisonIsland.init) PrisonIsland.init(_scene, _camera); } catch (e) {}
    try { if (window.LightningBase && LightningBase.init) LightningBase.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenLab && FrozenLab.init) FrozenLab.init(_scene, _camera); } catch (e) {}
    try { if (window.CrystalCave && CrystalCave.init) CrystalCave.init(_scene, _camera); } catch (e) {}
    try { if (window.DataVault && DataVault.init) DataVault.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaFortress && LavaFortress.init) LavaFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.SandStorm && SandStorm.init) SandStorm.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearSilo && NuclearSilo.init) NuclearSilo.init(_scene, _camera); } catch (e) {}
    try { if (window.RuinedFactory && RuinedFactory.init) RuinedFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.ScorchedCitadel && ScorchedCitadel.init) ScorchedCitadel.init(_scene, _camera); } catch (e) {}
    try { if (window.AcidPlant && AcidPlant.init) AcidPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertLab && DesertLab.init) DesertLab.init(_scene, _camera); } catch (e) {}
    try { if (window.StormBunker && StormBunker.init) StormBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.CargoPort && CargoPort.init) CargoPort.init(_scene, _camera); } catch (e) {}
    try { if (window.WarMarket && WarMarket.init) WarMarket.init(_scene, _camera); } catch (e) {}
    try { if (window.ShipGraveyard && ShipGraveyard.init) ShipGraveyard.init(_scene, _camera); } catch (e) {}
    try { if (window.BlastedBridge && BlastedBridge.init) BlastedBridge.init(_scene, _camera); } catch (e) {}
    try { if (window.FortressRuins && FortressRuins.init) FortressRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.BattleDepot && BattleDepot.init) BattleDepot.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenFortress && FrozenFortress.init) FrozenFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaTemple && LavaTemple.init) LavaTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.MagmaCave && MagmaCave.init) MagmaCave.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyStation && SkyStation.init) SkyStation.init(_scene, _camera); } catch (e) {}
    try { if (window.BloodArena && BloodArena.init) BloodArena.init(_scene, _camera); } catch (e) {}
    try { if (window.SnowFortress && SnowFortress.init) SnowFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.WinterBase && WinterBase.init) WinterBase.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberStation && CyberStation.init) CyberStation.init(_scene, _camera); } catch (e) {}
    try { if (window.BurningTemple && BurningTemple.init) BurningTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueTown && PlagueTown.init) PlagueTown.init(_scene, _camera); } catch (e) {}
    try { if (window.ShadowPalace && ShadowPalace.init) ShadowPalace.init(_scene, _camera); } catch (e) {}
    try { if (window.WarSubmarine && WarSubmarine.init) WarSubmarine.init(_scene, _camera); } catch (e) {}
    try { if (window.SteelCanyon && SteelCanyon.init) SteelCanyon.init(_scene, _camera); } catch (e) {}
    try { if (window.FireTemple && FireTemple.init) FireTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.CrystalVault && CrystalVault.init) CrystalVault.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanicCity && VolcanicCity.init) VolcanicCity.init(_scene, _camera); } catch (e) {}
    try { if (window.LightningTower && LightningTower.init) LightningTower.init(_scene, _camera); } catch (e) {}
    try { if (window.MidnightBase && MidnightBase.init) MidnightBase.init(_scene, _camera); } catch (e) {}
    try { if (window.WreckedCity && WreckedCity.init) WreckedCity.init(_scene, _camera); } catch (e) {}
    try { if (window.ShadowLab && ShadowLab.init) ShadowLab.init(_scene, _camera); } catch (e) {}
    try { if (window.IronKeep && IronKeep.init) IronKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.MetalMarsh && MetalMarsh.init) MetalMarsh.init(_scene, _camera); } catch (e) {}
    try { if (window.ThunderKeep && ThunderKeep.init) ThunderKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoPeak && VolcanoPeak.init) VolcanoPeak.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicMarsh && ToxicMarsh.init) ToxicMarsh.init(_scene, _camera); } catch (e) {}
    try { if (window.CitySiege && CitySiege.init) CitySiege.init(_scene, _camera); } catch (e) {}
    try { if (window.WarDocks && WarDocks.init) WarDocks.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicFacility && ToxicFacility.init) ToxicFacility.init(_scene, _camera); } catch (e) {}
    try { if (window.CrashedShip && CrashedShip.init) CrashedShip.init(_scene, _camera); } catch (e) {}
    try { if (window.MoltenKeep && MoltenKeep.init) MoltenKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.BurningBridge && BurningBridge.init) BurningBridge.init(_scene, _camera); } catch (e) {}
    try { if (window.DarkCitadel && DarkCitadel.init) DarkCitadel.init(_scene, _camera); } catch (e) {}
    try { if (window.SmokeValley && SmokeValley.init) SmokeValley.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceFortress && SpaceFortress.init) SpaceFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.BattleArena && BattleArena.init) BattleArena.init(_scene, _camera); } catch (e) {}
    try { if (window.WarPort && WarPort.init) WarPort.init(_scene, _camera); } catch (e) {}
    try { if (window.IronValley && IronValley.init) IronValley.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaArena && LavaArena.init) LavaArena.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenLab && SunkenLab.init) SunkenLab.init(_scene, _camera); } catch (e) {}
    try { if (window.SeaFortress && SeaFortress.init) SeaFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.ShadowValley && ShadowValley.init) ShadowValley.init(_scene, _camera); } catch (e) {}
    try { if (window.AshRuins && AshRuins.init) AshRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.CrimsonKeep && CrimsonKeep.init) CrimsonKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.StormValley && StormValley.init) StormValley.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenValley && FrozenValley.init) FrozenValley.init(_scene, _camera); } catch (e) {}
    try { if (window.FallenTemple && FallenTemple.init) FallenTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.ScorchedLab && ScorchedLab.init) ScorchedLab.init(_scene, _camera); } catch (e) {}
    try { if (window.IronMarsh && IronMarsh.init) IronMarsh.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceWreck && SpaceWreck.init) SpaceWreck.init(_scene, _camera); } catch (e) {}
    try { if (window.DustValley && DustValley.init) DustValley.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostFortress && GhostFortress.init) GhostFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.QuantumBase && QuantumBase.init) QuantumBase.init(_scene, _camera); } catch (e) {}
    try { if (window.PlasmaTower && PlasmaTower.init) PlasmaTower.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicLab && ToxicLab.init) ToxicLab.init(_scene, _camera); } catch (e) {}
    try { if (window.SteelDome && SteelDome.init) SteelDome.init(_scene, _camera); } catch (e) {}
    try { if (window.BuriedCity && BuriedCity.init) BuriedCity.init(_scene, _camera); } catch (e) {}
    try { if (window.MagmaBridge && MagmaBridge.init) MagmaBridge.init(_scene, _camera); } catch (e) {}
    try { if (window.VaporStation && VaporStation.init) VaporStation.init(_scene, _camera); } catch (e) {}
    try { if (window.WarChurch && WarChurch.init) WarChurch.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenDock && FrozenDock.init) FrozenDock.init(_scene, _camera); } catch (e) {}
    try { if (window.RustCanyon && RustCanyon.init) RustCanyon.init(_scene, _camera); } catch (e) {}
    try { if (window.AcidBay && AcidBay.init) AcidBay.init(_scene, _camera); } catch (e) {}
    try { if (window.ConcreteMaze && ConcreteMaze.init) ConcreteMaze.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyPrison && SkyPrison.init) SkyPrison.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaCity && LavaCity.init) LavaCity.init(_scene, _camera); } catch (e) {}
    try { if (window.WarZoo && WarZoo.init) WarZoo.init(_scene, _camera); } catch (e) {}
    try { if (window.NukeCrater && NukeCrater.init) NukeCrater.init(_scene, _camera); } catch (e) {}
    try { if (window.AmberRuins && AmberRuins.init) AmberRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.DeltaBase && DeltaBase.init) DeltaBase.init(_scene, _camera); } catch (e) {}
    try { if (window.StormShip && StormShip.init) StormShip.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenCrater && FrozenCrater.init) FrozenCrater.init(_scene, _camera); } catch (e) {}
    try { if (window.EmberFields && EmberFields.init) EmberFields.init(_scene, _camera); } catch (e) {}
    try { if (window.HauntedBay && HauntedBay.init) HauntedBay.init(_scene, _camera); } catch (e) {}
    try { if (window.FlamePit && FlamePit.init) FlamePit.init(_scene, _camera); } catch (e) {}
    try { if (window.NanoLab && NanoLab.init) NanoLab.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenPalace && SunkenPalace.init) SunkenPalace.init(_scene, _camera); } catch (e) {}
    try { if (window.WarGarden && WarGarden.init) WarGarden.init(_scene, _camera); } catch (e) {}
    try { if (window.BattleCanyon && BattleCanyon.init) BattleCanyon.init(_scene, _camera); } catch (e) {}
    try { if (window.CliffBase && CliffBase.init) CliffBase.init(_scene, _camera); } catch (e) {}
    try { if (window.RustedBay && RustedBay.init) RustedBay.init(_scene, _camera); } catch (e) {}
    try { if (window.EngineRoom && EngineRoom.init) EngineRoom.init(_scene, _camera); } catch (e) {}
    try { if (window.ChemPlant && ChemPlant.init) ChemPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.WarTower && WarTower.init) WarTower.init(_scene, _camera); } catch (e) {}
    try { if (window.FungalCave && FungalCave.init) FungalCave.init(_scene, _camera); } catch (e) {}
    try { if (window.RadioStation && RadioStation.init) RadioStation.init(_scene, _camera); } catch (e) {}
    try { if (window.SniperHill && SniperHill.init) SniperHill.init(_scene, _camera); } catch (e) {}
    try { if (window.OrbitalDrop && OrbitalDrop.init) OrbitalDrop.init(_scene, _camera); } catch (e) {}
    try { if (window.IceMine && IceMine.init) IceMine.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicBay && ToxicBay.init) ToxicBay.init(_scene, _camera); } catch (e) {}
    try { if (window.DeadSea && DeadSea.init) DeadSea.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaTubes && LavaTubes.init) LavaTubes.init(_scene, _camera); } catch (e) {}
    try { if (window.WarTrain && WarTrain.init) WarTrain.init(_scene, _camera); } catch (e) {}
    try { if (window.ShadowReef && ShadowReef.init) ShadowReef.init(_scene, _camera); } catch (e) {}
    try { if (window.BoneYard && BoneYard.init) BoneYard.init(_scene, _camera); } catch (e) {}
    try { if (window.SteelMill && SteelMill.init) SteelMill.init(_scene, _camera); } catch (e) {}
    try { if (window.AcidMine && AcidMine.init) AcidMine.init(_scene, _camera); } catch (e) {}
    try { if (window.WarResort && WarResort.init) WarResort.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueShip && PlagueShip.init) PlagueShip.init(_scene, _camera); } catch (e) {}
    try { if (window.ThunderBase && ThunderBase.init) ThunderBase.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyBarge && SkyBarge.init) SkyBarge.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenPalace && FrozenPalace.init) FrozenPalace.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberSwamp && CyberSwamp.init) CyberSwamp.init(_scene, _camera); } catch (e) {}
    try { if (window.IceTower && IceTower.init) IceTower.init(_scene, _camera); } catch (e) {}
    try { if (window.CursedShip && CursedShip.init) CursedShip.init(_scene, _camera); } catch (e) {}
    try { if (window.NeonSwamp && NeonSwamp.init) NeonSwamp.init(_scene, _camera); } catch (e) {}
    try { if (window.WarCathedral && WarCathedral.init) WarCathedral.init(_scene, _camera); } catch (e) {}
    try { if (window.BloodSwamp && BloodSwamp.init) BloodSwamp.init(_scene, _camera); } catch (e) {}
    try { if (window.MechBay && MechBay.init) MechBay.init(_scene, _camera); } catch (e) {}
    try { if (window.GravityWell && GravityWell.init) GravityWell.init(_scene, _camera); } catch (e) {}
    try { if (window.PoisonGrove && PoisonGrove.init) PoisonGrove.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticLab && ArcticLab.init) ArcticLab.init(_scene, _camera); } catch (e) {}
    try { if (window.TrenchWar && TrenchWar.init) TrenchWar.init(_scene, _camera); } catch (e) {}
    try { if (window.UnderseaDome && UnderseaDome.init) UnderseaDome.init(_scene, _camera); } catch (e) {}
    try { if (window.SolarForge && SolarForge.init) SolarForge.init(_scene, _camera); } catch (e) {}
    try { if (window.IronCitadel && IronCitadel.init) IronCitadel.init(_scene, _camera); } catch (e) {}
    try { if (window.WarShrine && WarShrine.init) WarShrine.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueLab && PlagueLab.init) PlagueLab.init(_scene, _camera); } catch (e) {}
    try { if (window.DeathValley && DeathValley.init) DeathValley.init(_scene, _camera); } catch (e) {}
    try { if (window.VoidStation && VoidStation.init) VoidStation.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaDome && LavaDome.init) LavaDome.init(_scene, _camera); } catch (e) {}
    try { if (window.SandFortress && SandFortress.init) SandFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.BoneTemple && BoneTemple.init) BoneTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberRuins && CyberRuins.init) CyberRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.StormBase && StormBase.init) StormBase.init(_scene, _camera); } catch (e) {}
    try { if (window.DeepBunker && DeepBunker.init) DeepBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.WarMuseum && WarMuseum.init) WarMuseum.init(_scene, _camera); } catch (e) {}
    try { if (window.RustPalace && RustPalace.init) RustPalace.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleFort && JungleFort.init) JungleFort.init(_scene, _camera); } catch (e) {}
    try { if (window.FlameShrine && FlameShrine.init) FlameShrine.init(_scene, _camera); } catch (e) {}
    try { if (window.AcidCrater && AcidCrater.init) AcidCrater.init(_scene, _camera); } catch (e) {}
    try { if (window.OrbitalBase && OrbitalBase.init) OrbitalBase.init(_scene, _camera); } catch (e) {}
    try { if (window.TarPits && TarPits.init) TarPits.init(_scene, _camera); } catch (e) {}
    try { if (window.CrystalMine && CrystalMine.init) CrystalMine.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueSwamp && PlagueSwamp.init) PlagueSwamp.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenKeep && FrozenKeep.init) FrozenKeep.init(_scene, _camera); } catch (e) {}
    try { if (window.MunitionsPlant && MunitionsPlant.init) MunitionsPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.TriageZone && TriageZone.init) TriageZone.init(_scene, _camera); } catch (e) {}
    try { if (window.BlackOps && BlackOps.init) BlackOps.init(_scene, _camera); } catch (e) {}
    try { if (window.CraterCity && CraterCity.init) CraterCity.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenCarrier && SunkenCarrier.init) SunkenCarrier.init(_scene, _camera); } catch (e) {}
    try { if (window.NanoCity && NanoCity.init) NanoCity.init(_scene, _camera); } catch (e) {}
    try { if (window.SiloComplex && SiloComplex.init) SiloComplex.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyGarden && SkyGarden.init) SkyGarden.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaTrench && LavaTrench.init) LavaTrench.init(_scene, _camera); } catch (e) {}
    try { if (window.WraithShip && WraithShip.init) WraithShip.init(_scene, _camera); } catch (e) {}
    try { if (window.WarCemetery && WarCemetery.init) WarCemetery.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueCove && PlagueCove.init) PlagueCove.init(_scene, _camera); } catch (e) {}
    try { if (window.ArenaDome && ArenaDome.init) ArenaDome.init(_scene, _camera); } catch (e) {}
    try { if (window.MesaOutpost && MesaOutpost.init) MesaOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.SpireCity && SpireCity.init) SpireCity.init(_scene, _camera); } catch (e) {}
    try { if (window.ShadowMarket && ShadowMarket.init) ShadowMarket.init(_scene, _camera); } catch (e) {}
    try { if (window.PolarSiege && PolarSiege.init) PolarSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.ForgottenLab && ForgottenLab.init) ForgottenLab.init(_scene, _camera); } catch (e) {}
    try { if (window.WarStation && WarStation.init) WarStation.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueTower && PlagueTower.init) PlagueTower.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicMine && ToxicMine.init) ToxicMine.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenReactor && FrozenReactor.init) FrozenReactor.init(_scene, _camera); } catch (e) {}
    try { if (window.NeonBunker && NeonBunker.init) NeonBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertFort && DesertFort.init) DesertFort.init(_scene, _camera); } catch (e) {}
    try { if (window.MagmaCore && MagmaCore.init) MagmaCore.init(_scene, _camera); } catch (e) {}
    try { if (window.SkullFortress && SkullFortress.init) SkullFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.PlasmaOutpost && PlasmaOutpost.init) PlasmaOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.SiegePlatform && SiegePlatform.init) SiegePlatform.init(_scene, _camera); } catch (e) {}
    try { if (window.BloodChapel && BloodChapel.init) BloodChapel.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicHarbor && ToxicHarbor.init) ToxicHarbor.init(_scene, _camera); } catch (e) {}
    try { if (window.IronTower && IronTower.init) IronTower.init(_scene, _camera); } catch (e) {}
    try { if (window.OrbitalRelay && OrbitalRelay.init) OrbitalRelay.init(_scene, _camera); } catch (e) {}
    try { if (window.BattleConvoy && BattleConvoy.init) BattleConvoy.init(_scene, _camera); } catch (e) {}
    try { if (window.EchoStation && EchoStation.init) EchoStation.init(_scene, _camera); } catch (e) {}
    try { if (window.WarheadCache && WarheadCache.init) WarheadCache.init(_scene, _camera); } catch (e) {}
    try { if (window.WarConvoy && WarConvoy.init) WarConvoy.init(_scene, _camera); } catch (e) {}
    try { if (window.AshCitadel && AshCitadel.init) AshCitadel.init(_scene, _camera); } catch (e) {}
    try { if (window.MoltenBridge && MoltenBridge.init) MoltenBridge.init(_scene, _camera); } catch (e) {}
    try { if (window.VoidLab && VoidLab.init) VoidLab.init(_scene, _camera); } catch (e) {}
    try { if (window.BlackMarch && BlackMarch.init) BlackMarch.init(_scene, _camera); } catch (e) {}
    try { if (window.IceCarrier && IceCarrier.init) IceCarrier.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleRuins && JungleRuins.init) JungleRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.ThunderTower && ThunderTower.init) ThunderTower.init(_scene, _camera); } catch (e) {}
    try { if (window.MidnightRaid && MidnightRaid.init) MidnightRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.RustFactory && RustFactory.init) RustFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.DustStorm && DustStorm.init) DustStorm.init(_scene, _camera); } catch (e) {}
    try { if (window.AssaultCamp && AssaultCamp.init) AssaultCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.StoneQuarry && StoneQuarry.init) StoneQuarry.init(_scene, _camera); } catch (e) {}
    try { if (window.WarzoneMarket && WarzoneMarket.init) WarzoneMarket.init(_scene, _camera); } catch (e) {}
    try { if (window.RidgeBase && RidgeBase.init) RidgeBase.init(_scene, _camera); } catch (e) {}
    try { if (window.PoisonLake && PoisonLake.init) PoisonLake.init(_scene, _camera); } catch (e) {}
    try { if (window.SkyDock && SkyDock.init) SkyDock.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaCore && LavaCore.init) LavaCore.init(_scene, _camera); } catch (e) {}
    try { if (window.NeonSubway && NeonSubway.init) NeonSubway.init(_scene, _camera); } catch (e) {}
    try { if (window.CopperMine && CopperMine.init) CopperMine.init(_scene, _camera); } catch (e) {}
    try { if (window.WastelandHub && WastelandHub.init) WastelandHub.init(_scene, _camera); } catch (e) {}
    try { if (window.TrenchLine && TrenchLine.init) TrenchLine.init(_scene, _camera); } catch (e) {}
    try { if (window.GlacierBunker && GlacierBunker.init) GlacierBunker.init(_scene, _camera); } catch (e) {}
    try { if (window.PalaceRuins && PalaceRuins.init) PalaceRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.DamStation && DamStation.init) DamStation.init(_scene, _camera); } catch (e) {}
    try { if (window.Shipyard && Shipyard.init) Shipyard.init(_scene, _camera); } catch (e) {}
    try { if (window.SpacePort && SpacePort.init) SpacePort.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenRiver && FrozenRiver.init) FrozenRiver.init(_scene, _camera); } catch (e) {}
    try { if (window.AvalanchePass && AvalanchePass.init) AvalanchePass.init(_scene, _camera); } catch (e) {}
    try { if (window.BunkerCity && BunkerCity.init) BunkerCity.init(_scene, _camera); } catch (e) {}
    try { if (window.WarlordPalace && WarlordPalace.init) WarlordPalace.init(_scene, _camera); } catch (e) {}
    try { if (window.ScrapYard && ScrapYard.init) ScrapYard.init(_scene, _camera); } catch (e) {}
    try { if (window.CommandShip && CommandShip.init) CommandShip.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertBase && DesertBase.init) DesertBase.init(_scene, _camera); } catch (e) {}
    try { if (window.TrainWreck && TrainWreck.init) TrainWreck.init(_scene, _camera); } catch (e) {}
    try { if (window.CaveTemple && CaveTemple.init) CaveTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostFactory && GhostFactory.init) GhostFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.BombShelter && BombShelter.init) BombShelter.init(_scene, _camera); } catch (e) {}
    try { if (window.SandDunes && SandDunes.init) SandDunes.init(_scene, _camera); } catch (e) {}
    try { if (window.SwampRefinery && SwampRefinery.init) SwampRefinery.init(_scene, _camera); } catch (e) {}
    try { if (window.RooftopSiege && RooftopSiege.init) RooftopSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenBase && SunkenBase.init) SunkenBase.init(_scene, _camera); } catch (e) {}
    try { if (window.FloodCity && FloodCity.init) FloodCity.init(_scene, _camera); } catch (e) {}
    try { if (window.CoastGuard && CoastGuard.init) CoastGuard.init(_scene, _camera); } catch (e) {}
    try { if (window.CanyonFort && CanyonFort.init) CanyonFort.init(_scene, _camera); } catch (e) {}
    try { if (window.SniperRidge && SniperRidge.init) SniperRidge.init(_scene, _camera); } catch (e) {}
    try { if (window.HarborFort && HarborFort.init) HarborFort.init(_scene, _camera); } catch (e) {}
    try { if (window.TundraCamp && TundraCamp.init) TundraCamp.init(_scene, _camera); } catch (e) {}
    try { if (window.OilDepot && OilDepot.init) OilDepot.init(_scene, _camera); } catch (e) {}
    try { if (window.BattleCrater && BattleCrater.init) BattleCrater.init(_scene, _camera); } catch (e) {}
    try { if (window.UrbanDecay && UrbanDecay.init) UrbanDecay.init(_scene, _camera); } catch (e) {}
    try { if (window.WarAirfield && WarAirfield.init) WarAirfield.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaBase && LavaBase.init) LavaBase.init(_scene, _camera); } catch (e) {}
    try { if (window.StormIsland && StormIsland.init) StormIsland.init(_scene, _camera); } catch (e) {}
    try { if (window.SaltFlats && SaltFlats.init) SaltFlats.init(_scene, _camera); } catch (e) {}
    try { if (window.AshPlains && AshPlains.init) AshPlains.init(_scene, _camera); } catch (e) {}
    try { if (window.WarDepot && WarDepot.init) WarDepot.init(_scene, _camera); } catch (e) {}
    try { if (window.CommandCenter && CommandCenter.init) CommandCenter.init(_scene, _camera); } catch (e) {}
    try { if (window.HighlandFort && HighlandFort.init) HighlandFort.init(_scene, _camera); } catch (e) {}
    try { if (window.FloodDam && FloodDam.init) FloodDam.init(_scene, _camera); } catch (e) {}
    try { if (window.IceBreaker && IceBreaker.init) IceBreaker.init(_scene, _camera); } catch (e) {}
    try { if (window.MissileBase && MissileBase.init) MissileBase.init(_scene, _camera); } catch (e) {}
    try { if (window.WreckYard && WreckYard.init) WreckYard.init(_scene, _camera); } catch (e) {}
    try { if (window.TankYard && TankYard.init) TankYard.init(_scene, _camera); } catch (e) {}
    try { if (window.ForwardBase && ForwardBase.init) ForwardBase.init(_scene, _camera); } catch (e) {}
    try { if (window.DeathSwamp && DeathSwamp.init) DeathSwamp.init(_scene, _camera); } catch (e) {}
    try { if (window.SteelFortress && SteelFortress.init) SteelFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.PoisonMarsh && PoisonMarsh.init) PoisonMarsh.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleMaze && JungleMaze.init) JungleMaze.init(_scene, _camera); } catch (e) {}
    try { if (window.WarGate && WarGate.init) WarGate.init(_scene, _camera); } catch (e) {}
    try { if (window.NeonRuins && NeonRuins.init) NeonRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.DarkWoods && DarkWoods.init) DarkWoods.init(_scene, _camera); } catch (e) {}
    try { if (window.ShadowBase && ShadowBase.init) ShadowBase.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueCity && PlagueCity.init) PlagueCity.init(_scene, _camera); } catch (e) {}
    try { if (window.ThunderRidge && ThunderRidge.init) ThunderRidge.init(_scene, _camera); } catch (e) {}
    try { if (window.FloodPlains && FloodPlains.init) FloodPlains.init(_scene, _camera); } catch (e) {}
    try { if (window.NuclearWaste && NuclearWaste.init) NuclearWaste.init(_scene, _camera); } catch (e) {}
    try { if (window.BloodRiver && BloodRiver.init) BloodRiver.init(_scene, _camera); } catch (e) {}
    try { if (window.VoidBase && VoidBase.init) VoidBase.init(_scene, _camera); } catch (e) {}
    try { if (window.AcidLake && AcidLake.init) AcidLake.init(_scene, _camera); } catch (e) {}
    try { if (window.StormFortress && StormFortress.init) StormFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.FrostHarbor && FrostHarbor.init) FrostHarbor.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaRiver && LavaRiver.init) LavaRiver.init(_scene, _camera); } catch (e) {}
    try { if (window.SiegeLines && SiegeLines.init) SiegeLines.init(_scene, _camera); } catch (e) {}
    try { if (window.GhostRidge && GhostRidge.init) GhostRidge.init(_scene, _camera); } catch (e) {}
    try { if (window.WarLab && WarLab.init) WarLab.init(_scene, _camera); } catch (e) {}
    try { if (window.IceDock && IceDock.init) IceDock.init(_scene, _camera); } catch (e) {}
    try { if (window.RubbleCity && RubbleCity.init) RubbleCity.init(_scene, _camera); } catch (e) {}
    try { if (window.WinterAssault && WinterAssault.init) WinterAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.CryptBase && CryptBase.init) CryptBase.init(_scene, _camera); } catch (e) {}
    try { if (window.WarDome && WarDome.init) WarDome.init(_scene, _camera); } catch (e) {}
    try { if (window.HarborRaid && HarborRaid.init) HarborRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.ReefBase && ReefBase.init) ReefBase.init(_scene, _camera); } catch (e) {}
    try { if (window.CanyonWar && CanyonWar.init) CanyonWar.init(_scene, _camera); } catch (e) {}
    try { if (window.MagmaLab && MagmaLab.init) MagmaLab.init(_scene, _camera); } catch (e) {}
    try { if (window.FireBase && FireBase.init) FireBase.init(_scene, _camera); } catch (e) {}
    try { if (window.WarCrypt && WarCrypt.init) WarCrypt.init(_scene, _camera); } catch (e) {}
    try { if (window.WarPrison && WarPrison.init) WarPrison.init(_scene, _camera); } catch (e) {}
    try { if (window.CoastLine && CoastLine.init) CoastLine.init(_scene, _camera); } catch (e) {}
    try { if (window.RockBase && RockBase.init) RockBase.init(_scene, _camera); } catch (e) {}
    try { if (window.PoisonBase && PoisonBase.init) PoisonBase.init(_scene, _camera); } catch (e) {}
    try { if (window.MoonGate && MoonGate.init) MoonGate.init(_scene, _camera); } catch (e) {}
    try { if (window.WarShip && WarShip.init) WarShip.init(_scene, _camera); } catch (e) {}
    try { if (window.JadeTemple && JadeTemple.init) JadeTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.AncientColosseum && AncientColosseum.init) AncientColosseum.init(_scene, _camera); } catch (e) {}
    try { if (window.TundraVillage && TundraVillage.init) TundraVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.SolarFarm && SolarFarm.init) SolarFarm.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleFortress && JungleFortress.init) JungleFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.BridgeAssault && BridgeAssault.init) BridgeAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceWreckage && SpaceWreckage.init) SpaceWreckage.init(_scene, _camera); } catch (e) {}
    try { if (window.UndergroundLab && UndergroundLab.init) UndergroundLab.init(_scene, _camera); } catch (e) {}
    try { if (window.HospitalRaid && HospitalRaid.init) HospitalRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.WeaponsDepot && WeaponsDepot.init) WeaponsDepot.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaCavern && LavaCavern.init) LavaCavern.init(_scene, _camera); } catch (e) {}
    try { if (window.NavalBase && NavalBase.init) NavalBase.init(_scene, _camera); } catch (e) {}
    try { if (window.ChemFactory && ChemFactory.init) ChemFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.PalaceGardens && PalaceGardens.init) PalaceGardens.init(_scene, _camera); } catch (e) {}
    try { if (window.SubmarineHunt && SubmarineHunt.init) SubmarineHunt.init(_scene, _camera); } catch (e) {}
    try { if (window.ArcticStation && ArcticStation.init) ArcticStation.init(_scene, _camera); } catch (e) {}
    try { if (window.CityRooftop && CityRooftop.init) CityRooftop.init(_scene, _camera); } catch (e) {}
    try { if (window.PowerPlant && PowerPlant.init) PowerPlant.init(_scene, _camera); } catch (e) {}
    try { if (window.TrainStation && TrainStation.init) TrainStation.init(_scene, _camera); } catch (e) {}
    try { if (window.CanyonAmbush && CanyonAmbush.init) CanyonAmbush.init(_scene, _camera); } catch (e) {}
    try { if (window.MissileSilo && MissileSilo.init) MissileSilo.init(_scene, _camera); } catch (e) {}
    try { if (window.FloatingPlatform && FloatingPlatform.init) FloatingPlatform.init(_scene, _camera); } catch (e) {}
    try { if (window.WarFactory && WarFactory.init) WarFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.IcePalace && IcePalace.init) IcePalace.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoBase && VolcanoBase.init) VolcanoBase.init(_scene, _camera); } catch (e) {}
    try { if (window.UndergroundCity && UndergroundCity.init) UndergroundCity.init(_scene, _camera); } catch (e) {}
    try { if (window.CoastalVillage && CoastalVillage.init) CoastalVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.ResearchVessel && ResearchVessel.init) ResearchVessel.init(_scene, _camera); } catch (e) {}
    try { if (window.StormDrain && StormDrain.init) StormDrain.init(_scene, _camera); } catch (e) {}
    try { if (window.ThroneRoom && ThroneRoom.init) ThroneRoom.init(_scene, _camera); } catch (e) {}
    try { if (window.JungleOutpost && JungleOutpost.init) JungleOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.NavalYard && NavalYard.init) NavalYard.init(_scene, _camera); } catch (e) {}
    try { if (window.IceShelf && IceShelf.init) IceShelf.init(_scene, _camera); } catch (e) {}
    try { if (window.RuinsAssault && RuinsAssault.init) RuinsAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.AircraftCarrier && AircraftCarrier.init) AircraftCarrier.init(_scene, _camera); } catch (e) {}
    try { if (window.SportsStadium && SportsStadium.init) SportsStadium.init(_scene, _camera); } catch (e) {}
    try { if (window.NukeTransport && NukeTransport.init) NukeTransport.init(_scene, _camera); } catch (e) {}
    try { if (window.AbandonedFactory && AbandonedFactory.init) AbandonedFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.SwampBase && SwampBase.init) SwampBase.init(_scene, _camera); } catch (e) {}
    try { if (window.HauntedCastle && HauntedCastle.init) HauntedCastle.init(_scene, _camera); } catch (e) {}
    try { if (window.CliffFortress && CliffFortress.init) CliffFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.ServerFarm && ServerFarm.init) ServerFarm.init(_scene, _camera); } catch (e) {}
    try { if (window.CityBank && CityBank.init) CityBank.init(_scene, _camera); } catch (e) {}
    try { if (window.AncientPyramid && AncientPyramid.init) AncientPyramid.init(_scene, _camera); } catch (e) {}
    try { if (window.ToxicJungle && ToxicJungle.init) ToxicJungle.init(_scene, _camera); } catch (e) {}
    try { if (window.HarborDefense && HarborDefense.init) HarborDefense.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceDerelict && SpaceDerelict.init) SpaceDerelict.init(_scene, _camera); } catch (e) {}
    try { if (window.MedievalDungeon && MedievalDungeon.init) MedievalDungeon.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberLab && CyberLab.init) CyberLab.init(_scene, _camera); } catch (e) {}
    try { if (window.BorderFort && BorderFort.init) BorderFort.init(_scene, _camera); } catch (e) {}
    try { if (window.HauntedHotel && HauntedHotel.init) HauntedHotel.init(_scene, _camera); } catch (e) {}
    try { if (window.StormCoast && StormCoast.init) StormCoast.init(_scene, _camera); } catch (e) {}
    try { if (window.RadiationZone && RadiationZone.init) RadiationZone.init(_scene, _camera); } catch (e) {}
    try { if (window.CrashedSpaceship && CrashedSpaceship.init) CrashedSpaceship.init(_scene, _camera); } catch (e) {}
    try { if (window.IceCavern && IceCavern.init) IceCavern.init(_scene, _camera); } catch (e) {}
    try { if (window.FloodedSubway && FloodedSubway.init) FloodedSubway.init(_scene, _camera); } catch (e) {}
    try { if (window.DesertTemple && DesertTemple.init) DesertTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.MilitaryAcademy && MilitaryAcademy.init) MilitaryAcademy.init(_scene, _camera); } catch (e) {}
    try { if (window.NeonDistrict && NeonDistrict.init) NeonDistrict.init(_scene, _camera); } catch (e) {}
    try { if (window.UnderwaterTemple && UnderwaterTemple.init) UnderwaterTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.SpacePrison && SpacePrison.init) SpacePrison.init(_scene, _camera); } catch (e) {}
    try { if (window.PirateGalleon && PirateGalleon.init) PirateGalleon.init(_scene, _camera); } catch (e) {}
    try { if (window.AbandonedChurch && AbandonedChurch.init) AbandonedChurch.init(_scene, _camera); } catch (e) {}
    try { if (window.GreekRuins && GreekRuins.init) GreekRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.CoalMine && CoalMine.init) CoalMine.init(_scene, _camera); } catch (e) {}
    try { if (window.MountainFortress && MountainFortress.init) MountainFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.ArmoredTrain && ArmoredTrain.init) ArmoredTrain.init(_scene, _camera); } catch (e) {}
    try { if (window.TeslaLab && TeslaLab.init) TeslaLab.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenCastle && FrozenCastle.init) FrozenCastle.init(_scene, _camera); } catch (e) {}
    try { if (window.VampireLair && VampireLair.init) VampireLair.init(_scene, _camera); } catch (e) {}
    try { if (window.SubmarineGraveyard && SubmarineGraveyard.init) SubmarineGraveyard.init(_scene, _camera); } catch (e) {}
    try { if (window.ScorchedEarth && ScorchedEarth.init) ScorchedEarth.init(_scene, _camera); } catch (e) {}
    try { if (window.CrystalCaves && CrystalCaves.init) CrystalCaves.init(_scene, _camera); } catch (e) {}
    try { if (window.BioDome && BioDome.init) BioDome.init(_scene, _camera); } catch (e) {}
    try { if (window.WartimeFactory && WartimeFactory.init) WartimeFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.SpaceHangar && SpaceHangar.init) SpaceHangar.init(_scene, _camera); } catch (e) {}
    try { if (window.AmusementPark && AmusementPark.init) AmusementPark.init(_scene, _camera); } catch (e) {}
    try { if (window.AtlantisRuins && AtlantisRuins.init) AtlantisRuins.init(_scene, _camera); } catch (e) {}
    try { if (window.QuantumLab && QuantumLab.init) QuantumLab.init(_scene, _camera); } catch (e) {}
    try { if (window.BurningVillage && BurningVillage.init) BurningVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.AbandonedSchool && AbandonedSchool.init) AbandonedSchool.init(_scene, _camera); } catch (e) {}
    try { if (window.OrbitalWeapons && OrbitalWeapons.init) OrbitalWeapons.init(_scene, _camera); } catch (e) {}
    try { if (window.WastelandTown && WastelandTown.init) WastelandTown.init(_scene, _camera); } catch (e) {}
    try { if (window.OilRefinery && OilRefinery.init) OilRefinery.init(_scene, _camera); } catch (e) {}
    try { if (window.ColosseumSiege && ColosseumSiege.init) ColosseumSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenDestroyer && SunkenDestroyer.init) SunkenDestroyer.init(_scene, _camera); } catch (e) {}
    try { if (window.MoonOutpost && MoonOutpost.init) MoonOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberFortress && CyberFortress.init) CyberFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.PharaohTomb && PharaohTomb.init) PharaohTomb.init(_scene, _camera); } catch (e) {}
    try { if (window.LavaCaves && LavaCaves.init) LavaCaves.init(_scene, _camera); } catch (e) {}
    try { if (window.StormCarrier && StormCarrier.init) StormCarrier.init(_scene, _camera); } catch (e) {}
    try { if (window.DroneWarfare && DroneWarfare.init) DroneWarfare.init(_scene, _camera); } catch (e) {}
    try { if (window.CathedralSiege && CathedralSiege.init) CathedralSiege.init(_scene, _camera); } catch (e) {}
    try { if (window.SalvageYard && SalvageYard.init) SalvageYard.init(_scene, _camera); } catch (e) {}
    try { if (window.BioweaponLab && BioweaponLab.init) BioweaponLab.init(_scene, _camera); } catch (e) {}
    try { if (window.NavalDockyard && NavalDockyard.init) NavalDockyard.init(_scene, _camera); } catch (e) {}
    try { if (window.SniperTower && SniperTower.init) SniperTower.init(_scene, _camera); } catch (e) {}
    try { if (window.CursedVillage && CursedVillage.init) CursedVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.TankerShip && TankerShip.init) TankerShip.init(_scene, _camera); } catch (e) {}
    try { if (window.IronMine && IronMine.init) IronMine.init(_scene, _camera); } catch (e) {}
    try { if (window.ShantyTown && ShantyTown.init) ShantyTown.init(_scene, _camera); } catch (e) {}
    try { if (window.AztecTemple && AztecTemple.init) AztecTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.CircusTent && CircusTent.init) CircusTent.init(_scene, _camera); } catch (e) {}
    try { if (window.WeatherStation && WeatherStation.init) WeatherStation.init(_scene, _camera); } catch (e) {}
    try { if (window.LaserFacility && LaserFacility.init) LaserFacility.init(_scene, _camera); } catch (e) {}
    try { if (window.SubmarineBay && SubmarineBay.init) SubmarineBay.init(_scene, _camera); } catch (e) {}
    try { if (window.HeistVault && HeistVault.init) HeistVault.init(_scene, _camera); } catch (e) {}
    try { if (window.Catacombs && Catacombs.init) Catacombs.init(_scene, _camera); } catch (e) {}
    try { if (window.CrashedTrain && CrashedTrain.init) CrashedTrain.init(_scene, _camera); } catch (e) {}
    try { if (window.CrystalPalace && CrystalPalace.init) CrystalPalace.init(_scene, _camera); } catch (e) {}
    try { if (window.DeltaForce && DeltaForce.init) DeltaForce.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonTower && PrisonTower.init) PrisonTower.init(_scene, _camera); } catch (e) {}
    try { if (window.RobotFactory && RobotFactory.init) RobotFactory.init(_scene, _camera); } catch (e) {}
    try { if (window.WarMemorial && WarMemorial.init) WarMemorial.init(_scene, _camera); } catch (e) {}
    try { if (window.PrisonYard && PrisonYard.init) PrisonYard.init(_scene, _camera); } catch (e) {}
    try { if (window.MineShaft && MineShaft.init) MineShaft.init(_scene, _camera); } catch (e) {}
    try { if (window.CargoTerminal && CargoTerminal.init) CargoTerminal.init(_scene, _camera); } catch (e) {}
    try { if (window.MilitaryParade && MilitaryParade.init) MilitaryParade.init(_scene, _camera); } catch (e) {}
    try { if (window.GasPlatform && GasPlatform.init) GasPlatform.init(_scene, _camera); } catch (e) {}
    try { if (window.Monorail && Monorail.init) Monorail.init(_scene, _camera); } catch (e) {}
    try { if (window.ArchaeologicalDig && ArchaeologicalDig.init) ArchaeologicalDig.init(_scene, _camera); } catch (e) {}
    try { if (window.CaveNetwork && CaveNetwork.init) CaveNetwork.init(_scene, _camera); } catch (e) {}
    try { if (window.RooftopChase && RooftopChase.init) RooftopChase.init(_scene, _camera); } catch (e) {}
    try { if (window.TyphoonDeck && TyphoonDeck.init) TyphoonDeck.init(_scene, _camera); } catch (e) {}
    try { if (window.SwampOutpost && SwampOutpost.init) SwampOutpost.init(_scene, _camera); } catch (e) {}
    try { if (window.SunkenTemple && SunkenTemple.init) SunkenTemple.init(_scene, _camera); } catch (e) {}
    try { if (window.SalvageBarge && SalvageBarge.init) SalvageBarge.init(_scene, _camera); } catch (e) {}
    try { if (window.FrozenHarbor && FrozenHarbor.init) FrozenHarbor.init(_scene, _camera); } catch (e) {}
    try { if (window.IceFortress && IceFortress.init) IceFortress.init(_scene, _camera); } catch (e) {}
    try { if (window.MerchantShip && MerchantShip.init) MerchantShip.init(_scene, _camera); } catch (e) {}
    try { if (window.HarborCrane && HarborCrane.init) HarborCrane.init(_scene, _camera); } catch (e) {}
    try { if (window.RacingTrack && RacingTrack.init) RacingTrack.init(_scene, _camera); } catch (e) {}
    try { if (window.TortureChamber && TortureChamber.init) TortureChamber.init(_scene, _camera); } catch (e) {}
    try { if (window.PlagueVillage && PlagueVillage.init) PlagueVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.CyberYacht && CyberYacht.init) CyberYacht.init(_scene, _camera); } catch (e) {}
    try { if (window.FortressPrison && FortressPrison.init) FortressPrison.init(_scene, _camera); } catch (e) {}
    try { if (window.BattleStadium && BattleStadium.init) BattleStadium.init(_scene, _camera); } catch (e) {}
    try { if (window.HauntedLighthouse && HauntedLighthouse.init) HauntedLighthouse.init(_scene, _camera); } catch (e) {}
    try { if (window.CanyonAssault && CanyonAssault.init) CanyonAssault.init(_scene, _camera); } catch (e) {}
    try { if (window.DemolitionSite && DemolitionSite.init) DemolitionSite.init(_scene, _camera); } catch (e) {}
    try { if (window.AirshipRaid && AirshipRaid.init) AirshipRaid.init(_scene, _camera); } catch (e) {}
    try { if (window.TempleRun && TempleRun.init) TempleRun.init(_scene, _camera); } catch (e) {}
    try { if (window.AsteroidBase && AsteroidBase.init) AsteroidBase.init(_scene, _camera); } catch (e) {}
    try { if (window.FishingVillage && FishingVillage.init) FishingVillage.init(_scene, _camera); } catch (e) {}
    try { if (window.OperaHouse && OperaHouse.init) OperaHouse.init(_scene, _camera); } catch (e) {}
    try { if (window.CityHall && CityHall.init) CityHall.init(_scene, _camera); } catch (e) {}
    try { if (window.VolcanoSummit && VolcanoSummit.init) VolcanoSummit.init(_scene, _camera); } catch (e) {}
      try { if (window.FloatingFortress && FloatingFortress.init) FloatingFortress.init(_scene, _camera); } catch (e) {}
      try { if (window.Slaughterhouse && Slaughterhouse.init) Slaughterhouse.init(_scene, _camera); } catch (e) {}
      try { if (window.TrainGraveyard && TrainGraveyard.init) TrainGraveyard.init(_scene, _camera); } catch (e) {}
      try { if (window.SewagePlant && SewagePlant.init) SewagePlant.init(_scene, _camera); } catch (e) {}
      try { if (window.UniversityRaid && UniversityRaid.init) UniversityRaid.init(_scene, _camera); } catch (e) {}
      try { if (window.RefugeeCamp && RefugeeCamp.init) RefugeeCamp.init(_scene, _camera); } catch (e) {}
      try { if (window.NuclearConvoy && NuclearConvoy.init) NuclearConvoy.init(_scene, _camera); } catch (e) {}
      try { if (window.PowerSubstation && PowerSubstation.init) PowerSubstation.init(_scene, _camera); } catch (e) {}
      try { if (window.SubmarinePen && SubmarinePen.init) SubmarinePen.init(_scene, _camera); } catch (e) {}
      try { if (window.TorpedoFactory && TorpedoFactory.init) TorpedoFactory.init(_scene, _camera); } catch (e) {}
      try { if (window.MunitionsDepot && MunitionsDepot.init) MunitionsDepot.init(_scene, _camera); } catch (e) {}
      try { if (window.AbandonedMall && AbandonedMall.init) AbandonedMall.init(_scene, _camera); } catch (e) {}
      try { if (window.GoldVault && GoldVault.init) GoldVault.init(_scene, _camera); } catch (e) {}
      try { if (window.CustomsPost && CustomsPost.init) CustomsPost.init(_scene, _camera); } catch (e) {}
      try { if (window.JungleLab && JungleLab.init) JungleLab.init(_scene, _camera); } catch (e) {}
      try { if (window.SatelliteStation && SatelliteStation.init) SatelliteStation.init(_scene, _camera); } catch (e) {}
      try { if (window.DestroyerEscort && DestroyerEscort.init) DestroyerEscort.init(_scene, _camera); } catch (e) {}
      try { if (window.CoastalBattery && CoastalBattery.init) CoastalBattery.init(_scene, _camera); } catch (e) {}
      try { if (window.PrisonColony && PrisonColony.init) PrisonColony.init(_scene, _camera); } catch (e) {}
      try { if (window.AsteroidField && AsteroidField.init) AsteroidField.init(_scene, _camera); } catch (e) {}
      try { if (window.VolcanoLair && VolcanoLair.init) VolcanoLair.init(_scene, _camera); } catch (e) {}
      try { if (window.SeaFort && SeaFort.init) SeaFort.init(_scene, _camera); } catch (e) {}
      try { if (window.FuelDepot && FuelDepot.init) FuelDepot.init(_scene, _camera); } catch (e) {}
      try { if (window.DerelictTown && DerelictTown.init) DerelictTown.init(_scene, _camera); } catch (e) {}
      try { if (window.MethLab && MethLab.init) MethLab.init(_scene, _camera); } catch (e) {}
      try { if (window.CargoFreighter && CargoFreighter.init) CargoFreighter.init(_scene, _camera); } catch (e) {}
      try { if (window.IceFortressInterior && IceFortressInterior.init) IceFortressInterior.init(_scene, _camera); } catch (e) {}
      try { if (window.ReactorCore && ReactorCore.init) ReactorCore.init(_scene, _camera); } catch (e) {}
      try { if (window.GladiatorPit && GladiatorPit.init) GladiatorPit.init(_scene, _camera); } catch (e) {}
      try { if (window.JungleShrine && JungleShrine.init) JungleShrine.init(_scene, _camera); } catch (e) {}
      try { if (window.LaserGrid && LaserGrid.init) LaserGrid.init(_scene, _camera); } catch (e) {}
      try { if (window.DeathMarch && DeathMarch.init) DeathMarch.init(_scene, _camera); } catch (e) {}
      try { if (window.BankRobbery && BankRobbery.init) BankRobbery.init(_scene, _camera); } catch (e) {}
      try { if (window.UndergroundArena && UndergroundArena.init) UndergroundArena.init(_scene, _camera); } catch (e) {}
      try { if (window.AirfieldAssault && AirfieldAssault.init) AirfieldAssault.init(_scene, _camera); } catch (e) {}
      try { if (window.OilPlatformFire && OilPlatformFire.init) OilPlatformFire.init(_scene, _camera); } catch (e) {}
      try { if (window.DamControl && DamControl.init) DamControl.init(_scene, _camera); } catch (e) {}
      try { if (window.ConcertHall && ConcertHall.init) ConcertHall.init(_scene, _camera); } catch (e) {}
      try { if (window.SewerEscape && SewerEscape.init) SewerEscape.init(_scene, _camera); } catch (e) {}
      try { if (window.HauntedGalleon && HauntedGalleon.init) HauntedGalleon.init(_scene, _camera); } catch (e) {}
      try { if (window.AvalancheZone && AvalancheZone.init) AvalancheZone.init(_scene, _camera); } catch (e) {}
      try { if (window.MountainRescue && MountainRescue.init) MountainRescue.init(_scene, _camera); } catch (e) {}
      try { if (window.ShoppingDistrict && ShoppingDistrict.init) ShoppingDistrict.init(_scene, _camera); } catch (e) {}
      try { if (window.SnowfieldBattle && SnowfieldBattle.init) SnowfieldBattle.init(_scene, _camera); } catch (e) {}
      try { if (window.ZooBreakout && ZooBreakout.init) ZooBreakout.init(_scene, _camera); } catch (e) {}
      try { if (window.HospitalSiege && HospitalSiege.init) HospitalSiege.init(_scene, _camera); } catch (e) {}
      try { if (window.RacingPit && RacingPit.init) RacingPit.init(_scene, _camera); } catch (e) {}
      try { if (window.WarehouseDistrict && WarehouseDistrict.init) WarehouseDistrict.init(_scene, _camera); } catch (e) {}
      try { if (window.CyberCity && CyberCity.init) CyberCity.init(_scene, _camera); } catch (e) {}
      try { if (window.PirateHarbor && PirateHarbor.init) PirateHarbor.init(_scene, _camera); } catch (e) {}
      try { if (window.SpaceStationAttack && SpaceStationAttack.init) SpaceStationAttack.init(_scene, _camera); } catch (e) {}
      try { if (window.DustBowl && DustBowl.init) DustBowl.init(_scene, _camera); } catch (e) {}
      try { if (window.SwampAssault && SwampAssault.init) SwampAssault.init(_scene, _camera); } catch (e) {}
      try { if (window.FactoryTakeover && FactoryTakeover.init) FactoryTakeover.init(_scene, _camera); } catch (e) {}
      try { if (window.HarborSiege && HarborSiege.init) HarborSiege.init(_scene, _camera); } catch (e) {}
      try { if (window.MetroAssault && MetroAssault.init) MetroAssault.init(_scene, _camera); } catch (e) {}
      try { if (window.EmbassyTakeover && EmbassyTakeover.init) EmbassyTakeover.init(_scene, _camera); } catch (e) {}
      try { if (window.CemeterySiege && CemeterySiege.init) CemeterySiege.init(_scene, _camera); } catch (e) {}
      try { if (window.BridgeBattle && BridgeBattle.init) BridgeBattle.init(_scene, _camera); } catch (e) {}
      try { if (window.SatelliteCrash && SatelliteCrash.init) SatelliteCrash.init(_scene, _camera); } catch (e) {}
      try { if (window.PyramidRaid && PyramidRaid.init) PyramidRaid.init(_scene, _camera); } catch (e) {}
      try { if (window.SalvageMission && SalvageMission.init) SalvageMission.init(_scene, _camera); } catch (e) {}
      try { if (window.LaboratoryRaid && LaboratoryRaid.init) LaboratoryRaid.init(_scene, _camera); } catch (e) {}
      try { if (window.DamBreak && DamBreak.init) DamBreak.init(_scene, _camera); } catch (e) {}
      try { if (window.ColiseumBattle && ColiseumBattle.init) ColiseumBattle.init(_scene, _camera); } catch (e) {}
      try { if (window.TornadoAlley && TornadoAlley.init) TornadoAlley.init(_scene, _camera); } catch (e) {}
      try { if (window.BiohazardZone && BiohazardZone.init) BiohazardZone.init(_scene, _camera); } catch (e) {}
      try { if (window.PirateCoveRaid && PirateCoveRaid.init) PirateCoveRaid.init(_scene, _camera); } catch (e) {}
      try { if (window.GhostTownSiege && GhostTownSiege.init) GhostTownSiege.init(_scene, _camera); } catch (e) {}
      try { if (window.MansionHeist && MansionHeist.init) MansionHeist.init(_scene, _camera); } catch (e) {}
      try { if (window.ClocktowerRaid && ClocktowerRaid.init) ClocktowerRaid.init(_scene, _camera); } catch (e) {}
      try { if (window.ShipyardAssault && ShipyardAssault.init) ShipyardAssault.init(_scene, _camera); } catch (e) {}
      try { if (window.TankFactory && TankFactory.init) TankFactory.init(_scene, _camera); } catch (e) {}
      try { if (window.SpyCompound && SpyCompound.init) SpyCompound.init(_scene, _camera); } catch (e) {}
      try { if (window.RocketLaunch && RocketLaunch.init) RocketLaunch.init(_scene, _camera); } catch (e) {}
      try { if (window.MineshaftCollapse && MineshaftCollapse.init) MineshaftCollapse.init(_scene, _camera); } catch (e) {}
      try { if (window.AirbaseDefense && AirbaseDefense.init) AirbaseDefense.init(_scene, _camera); } catch (e) {}
      try { if (window.HelicopterCrash && HelicopterCrash.init) HelicopterCrash.init(_scene, _camera); } catch (e) {}
      try { if (window.SmugglersDen && SmugglersDen.init) SmugglersDen.init(_scene, _camera); } catch (e) {}
      try { if (window.EarthquakeZone && EarthquakeZone.init) EarthquakeZone.init(_scene, _camera); } catch (e) {}
      try { if (window.WarlordFortress && WarlordFortress.init) WarlordFortress.init(_scene, _camera); } catch (e) {}
      try { if (window.CombatHospital && CombatHospital.init) CombatHospital.init(_scene, _camera); } catch (e) {}
      try { if (window.WinterWarfare && WinterWarfare.init) WinterWarfare.init(_scene, _camera); } catch (e) {}
      try { if (window.ArmoredConvoy && ArmoredConvoy.init) ArmoredConvoy.init(_scene, _camera); } catch (e) {}
      try { if (window.CatacombsAssault && CatacombsAssault.init) CatacombsAssault.init(_scene, _camera); } catch (e) {}
      try { if (window.OilPlatformRaid && OilPlatformRaid.init) OilPlatformRaid.init(_scene, _camera); } catch (e) {}
      try { if (window.DesertConvoy && DesertConvoy.init) DesertConvoy.init(_scene, _camera); } catch (e) {}
      try { if (window.TrenchWarfare && TrenchWarfare.init) TrenchWarfare.init(_scene, _camera); } catch (e) {}
      try { if (window.SunkenCity && SunkenCity.init) SunkenCity.init(_scene, _camera); } catch (e) {}
      try { if (window.SpaceBattle && SpaceBattle.init) SpaceBattle.init(_scene, _camera); } catch (e) {}
      try { if (window.SubmarineBase && SubmarineBase.init) SubmarineBase.init(_scene, _camera); } catch (e) {}
      try { if (window.RebelOutpost && RebelOutpost.init) RebelOutpost.init(_scene, _camera); } catch (e) {}
      try { if (window.FortressSiege && FortressSiege.init) FortressSiege.init(_scene, _camera); } catch (e) {}
      try { if (window.BattleshipDeck && BattleshipDeck.init) BattleshipDeck.init(_scene, _camera); } catch (e) {}
      try { if (window.StadiumRiot && StadiumRiot.init) StadiumRiot.init(_scene, _camera); } catch (e) {}
      try { if (window.TradingPost && TradingPost.init) TradingPost.init(_scene, _camera); } catch (e) {}
    // Daily challenges panel
    try { if (typeof DailyChallenges !== 'undefined') DailyChallenges.showDailyChallenges(); } catch (eDC) {}

    // Create weapons
    Weapons.createGunMesh(_camera);
    Weapons.createMuzzleFlash(_scene, _camera);

    // Wire terrain destruction callbacks for loot & mining
    Weapons.setOnTerrainDig(function (x, y, z, blockType) {
      onShovelMine(x, y, z, blockType);
    });
    Weapons.setOnTerrainShot(function (x, y, z, blockType) {
      onTerrainDestroyed(x, y, z, blockType);
      // ── Fuel Barrel explosion: shooting a barrel triggers chain detonation ──
      if (blockType === 12) {
        _barrelExplosionDepth = 0;
        detonateBarrel(x, y, z);
        return;
      }
      // ── B29: Destructible environment — explosive weapons destroy blocks ──
      var wType = Weapons.getCurrentType();
      var isExpl = ['AT', 'ATGM', 'AT_HEAVY', 'AT_LIGHT', 'GRENADE', 'INCENDIARY', 'THERMOBARIC'].indexOf(wType) >= 0;
      if (isExpl && typeof WorldFeatures !== 'undefined' && WorldFeatures.applyExplosionDamage) {
        var bRadius = Weapons.getBlastRadius() || 3;
        WorldFeatures.applyExplosionDamage(x, y, z, bRadius, 100);
      }
      // Damage nearby drone nests from explosions and bullets
      if (typeof DroneSystem !== 'undefined' && DroneSystem.damageNest) {
        var nests = DroneSystem.getNests();
        for (var ni = 0; ni < nests.length; ni++) {
          var n = nests[ni];
          if (!n.alive) continue;
          var ndx = n.x - x, ndz = n.z - z;
          var nestDist = Math.sqrt(ndx * ndx + ndz * ndz);
          if (nestDist < 8) {
            var dmg = isExpl ? 40 : 5;
            DroneSystem.damageNest(ni, dmg);
          }
        }
      }
    });

    // Time system callbacks
    TimeSystem.onWeekChange(function () {
      Economy.weeklyUpdate();
    });
    TimeSystem.onPhaseChange(function (phase) {
      HUD.notifyPickup(phase === 'night' ? '🌙 NIGHT FALLS' : '☀️ DAY BREAKS', '#FFCC00');
    });

    // Mission completion callback — with replenishment
    MissionSystem.onMissionComplete(function (mission, reward) {
      HUD.notifyPickup('MISSION COMPLETE: ' + mission.name + ' +' + (reward || 0), '#00FF88');
      // Release drone when a recon/drone mission finishes
      try {
        if ((mission.type === 'recon' || mission.type === 'drone_strike') &&
            typeof DroneSystem !== 'undefined' && DroneSystem.isPossessing()) {
          DroneSystem.release();
          if (HUD.showToast) HUD.showToast('🛬 RECON COMPLETE — returning to ground combat', 3000, '#44ff88');
        }
      } catch (_edr) {}
      if (reward > 0 && typeof Marketplace !== 'undefined') {
        if (Marketplace.awardCustomOKC) {
          Marketplace.awardCustomOKC(reward, 'mission_complete', {
            missionName: mission && mission.name ? mission.name : null,
            missionType: mission && mission.type ? mission.type : null,
          }).then(function () {
            if (HUD && HUD.updateOKC) HUD.updateOKC(Marketplace.getOKC());
          });
        } else {
          Marketplace.addOKC(reward);
        }
      }
      // Replenish: generate a new mission after 10s
      setTimeout(function () {
        if (gameState === STATE.PLAYING && !(STAGES[currentStage] && STAGES[currentStage].droneOnly)) {
          var _newM;
          if (STAGES[currentStage] && STAGES[currentStage].capitalDefense) {
            _newM = MissionSystem.generateMission('kyiv_defense');
          } else if (STAGES[currentStage] && STAGES[currentStage].id === 1) {
            _newM = MissionSystem.generateMission('airborne_assault');
          } else {
            _newM = MissionSystem.generateRandom();
            _autoReconDroneForMission(_newM);
          }
          var active = MissionSystem.getActive();
          if (active && active.length > 0) {
            HUD.notifyPickup('📋 NEW MISSION: ' + active[active.length - 1].name, '#ffcc00');
          }
        }
      }, 10000);
    });

    // Set player spawn on terrain — search outward if (0,0) lands in water
    var sx = 0, sz = 0, spawnH = window.VoxelWorld.getTerrainHeight(0, 0);
    var BLOCK_WATER = 8;
    function _isWaterCol(x, z, h) {
      var b = window.VoxelWorld.getBlock ? window.VoxelWorld.getBlock(Math.floor(x), Math.floor(h), Math.floor(z)) : 0;
      return b === BLOCK_WATER;
    }
    if (_isWaterCol(sx, sz, spawnH)) {
      var _spiral = [[0,3],[3,0],[0,-3],[-3,0],[5,5],[-5,5],[5,-5],[-5,-5],[0,8],[8,0],[0,-8],[-8,0]];
      for (var _si = 0; _si < _spiral.length; _si++) {
        var tx = _spiral[_si][0], tz = _spiral[_si][1];
        var th = window.VoxelWorld.getTerrainHeight(tx, tz);
        if (!_isWaterCol(tx, tz, th)) { sx = tx; sz = tz; spawnH = th; break; }
      }
    }
    player.position.set(sx, spawnH + player.height, sz);

    // Spawn organized assault groups (4 squads of 4-5 armed NPCs) — BRIGADE
    // role only. Lone Wolf previously got the same 22-NPC army, which deleted
    // every nearby enemy before the player could engage (zero threat).
    if (typeof NPCSystem !== 'undefined' && NPCSystem.setPlayerFormation) NPCSystem.setPlayerFormation(window.__chosenFormation || 'wedge');
    if (player.role === 'brigade' && typeof NPCSystem !== 'undefined' && NPCSystem.spawnAssaultGroups) NPCSystem.spawnAssaultGroups();

    // Spawn starter vehicle fleet on roads (road-level positions)
    VehicleSystem.clear(); // prevent duplication if forceStartGame is called multiple times
    var roadWPs = (window.VoxelWorld.getRoadWaypoints ? window.VoxelWorld.getRoadWaypoints() : []);
    var _rp0 = roadWPs.length > 2 ? roadWPs[2] : new THREE.Vector3(8, 0, 20);
    var _rp1 = roadWPs.length > 6 ? roadWPs[6] : new THREE.Vector3(12, 0, 20);
    var _rp2 = roadWPs.length > 10 ? roadWPs[10] : new THREE.Vector3(-8, 0, 20);
    var vh = window.VoxelWorld.getTerrainHeight(_rp0.x, _rp0.z);
    VehicleSystem.spawn(_rp0.x, vh, _rp0.z, 'transport');
    var startVh2 = window.VoxelWorld.getTerrainHeight(_rp1.x, _rp1.z);
    VehicleSystem.spawn(_rp1.x, startVh2, _rp1.z, 'combat');
    var startVh3 = window.VoxelWorld.getTerrainHeight(_rp2.x, _rp2.z);
    VehicleSystem.spawn(_rp2.x, startVh3, _rp2.z, 'turret_rover');
    // Spawn a tank near the player start
    var _rp3 = roadWPs.length > 14 ? roadWPs[14] : new THREE.Vector3(0, 0, 15);
    var startVh4 = window.VoxelWorld.getTerrainHeight(_rp3.x, _rp3.z);
    VehicleSystem.spawn(_rp3.x, startVh4, _rp3.z, 'tank');

    // Spawn starter drones
    const startDh1 = window.VoxelWorld.getTerrainHeight(5, 5) + 8;
    DroneSystem.spawn(5, startDh1, 5, 'recon');
    const startDh2 = window.VoxelWorld.getTerrainHeight(-5, 5) + 8;
    DroneSystem.spawn(-5, startDh2, 5, 'fpv_attack');
    const startDh3 = window.VoxelWorld.getTerrainHeight(0, -10) + 10;
    DroneSystem.spawn(0, startDh3, -10, 'bomb');

    // Input setup
    setupInput();

    // Mobile controls
    if (isMobile) {
      if (!_mobileControlsReady) setupMobileControls();
      updateMobileControlsVisibility();
      setupOrientationHandling();
      var controlsHint = document.getElementById('controls-hint');
      if (controlsHint) {
        controlsHint.innerHTML = 'LEFT PAD · MOVE &nbsp;|&nbsp; RIGHT PAD · LOOK &nbsp;|&nbsp; 🔫 FIRE &nbsp;|&nbsp; ◎ AIM &nbsp;|&nbsp; ✋ USE &nbsp;|&nbsp; 🚗 VEHICLE &nbsp;|&nbsp; 🎒 INVENTORY';
      }
      // Replace keyboard-only grenade hint with touch button reference
      var grHint = document.getElementById('grenade-keyhint');
      if (grHint) grHint.textContent = 'tap 💣 button';
    }

    // Handle resize
    window.addEventListener('resize', onResize);

    if (!_updateLoopStarted) {
      _updateLoopStarted = true;
      prevTime = performance.now();
      update();
      // Hide loader after first frame rendered
      setTimeout(function() {
        var preloader = document.getElementById('boot-preloader');
        window.__gameBootReady = true;
        if (preloader) preloader.style.display = 'none';
      }, 400);
    }

    return { scene: _scene, camera: _camera, renderer: _renderer };
  }

  /* ── Input ───────────────────────────────────────────────────────── */
  var _skipNextEsc = false;

  // Detect fullscreen exit to prevent ESC from also toggling pause
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement) _skipNextEsc = true;
  });
  document.addEventListener('webkitfullscreenchange', function () {
    if (!document.webkitFullscreenElement) _skipNextEsc = true;
  });

  function setupInput() {
    document.addEventListener('keydown', function (e) {
      keys[e.code] = true;

      // Cheat: Ctrl+Shift+G toggles God Mode (works in any state for QA convenience)
      if (e.code === 'KeyG' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        toggleGodMode();
        return;
      }

      // Shift+D: toggle daily challenges panel
      if (e.code === 'KeyD' && e.shiftKey && !e.ctrlKey) {
        if (typeof DailyChallenges !== 'undefined') DailyChallenges.togglePanel();
        return;
      }

      // Shift+G (without Ctrl): cycle grenade type FRAG → SMOKE → FLASHBANG → FRAG
      if (e.code === 'KeyG' && e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        if (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE) {
          if (player.grenadeType === 'FRAG') {
            player.grenadeType = 'SMOKE';
            HUD.notifyPickup('💨 GRENADE: SMOKE [' + (player.smokeGrenades || 0) + ']', '#aaaaaa');
          } else if (player.grenadeType === 'SMOKE') {
            player.grenadeType = 'FLASHBANG';
            HUD.notifyPickup('⚡ GRENADE: FLASHBANG [' + (player.flashGrenades || 0) + ']', '#ffff88');
          } else {
            player.grenadeType = 'FRAG';
            HUD.notifyPickup('💣 GRENADE: FRAG [' + (player.godMode ? '∞' : (player.grenades || 0)) + ']', '#ffaa00');
          }
        }
        return;
      }

      if (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE) {
        // Speed controls (only in build mode, since 4-7 are weapons in play mode)
        if (gameState === STATE.BUILD_MODE) {
          if (e.code === 'Digit4') TimeSystem.setSpeed(1);
          if (e.code === 'Digit5') TimeSystem.setSpeed(2);
          if (e.code === 'Digit6') TimeSystem.setSpeed(5);
          if (e.code === 'Digit7') TimeSystem.setSpeed(10);
        }
        // KeyP reserved for perks menu in PLAYING state (see below)

        // Camera mode toggle (disabled while driving a drone/vehicle)
        if (e.code === 'KeyV' && !DroneSystem.isPossessing() && !VehicleSystem.isInVehicle()) {
          CameraSystem.cycleMode();
        }

        // Build mode
        if (e.code === 'KeyB') {
          if (gameState === STATE.BUILD_MODE) {
            gameState = STATE.PLAYING;
            Building.setBuildMode(false);
            Building.cancelTemplate();
            document.getElementById('build-hud').style.display = 'none';
          } else if (!player.sprinting) {
            gameState = STATE.BUILD_MODE;
            Building.setBuildMode(true);
            document.getElementById('build-hud').style.display = 'block';
          }
        }

        // L key — toggle weapon flashlight
        if (e.code === 'KeyL') {
          if (typeof Weapons !== 'undefined' && Weapons.toggleFlashlight) Weapons.toggleFlashlight();
        }

        // F key priority chain: 1) drone release  2) mission interact  3) drone possess  4) quick melee
        if (e.code === 'KeyF') {
          var fHandled = false;
          // Priority 1: release drone if possessing
          if (releaseDroneRemote()) {
            fHandled = true;
          }
          // Priority 2: mission zone interaction
          if (!fHandled && typeof MissionTypes !== 'undefined' && MissionTypes.getActive && MissionTypes.getActive()) {
            var mt = MissionTypes.getActive();
            if (mt && mt.config) {
            var mtDx = player.position.x - (mt.zoneX || 0);
            var mtDz = player.position.z - (mt.zoneZ || 0);
            // 196 = 14m² — wide enough to cover DEFUSE bombs (placed at radius 8) + 6m interact range
            if (mtDx * mtDx + mtDz * mtDz < 196) {
              if (mt.config.id === 'DEMOLITION') {
                HUD.notifyPickup('\ud83d\udca3 HOLD [F] TO PLANT CHARGE...', '#ff8800');
                fHandled = true; // actual planting progress runs in hold-F update loop
              } else if (mt.config.id === 'RESCUE') {
                // RESCUE: proximity check uses nearest unfreed POW position, not zone center
                var _mtr = MissionTypes.getProgress ? MissionTypes.getProgress() : null;
                var _nearPowDist = 999;
                if (_mtr && _mtr.pows) {
                  for (var _mpi = 0; _mpi < _mtr.pows.length; _mpi++) {
                    var _mp = _mtr.pows[_mpi];
                    if (_mp.freed) continue;
                    var _mdx2 = player.position.x - _mp.x, _mdz2 = player.position.z - _mp.z;
                    _nearPowDist = Math.min(_nearPowDist, _mdx2 * _mdx2 + _mdz2 * _mdz2);
                  }
                }
                if (_nearPowDist < 25) { // 5m radius \u2014 show prompt on keydown, hold runs in update loop
                  HUD.notifyPickup('\ud83d\udd13 HOLD [F] TO FREE POW...', '#88ff88');
                  fHandled = true;
                }
              } else if (mt.config.id === 'DEFUSE') {
                // DEFUSE: proximity check against nearest undefused bomb position
                var _mtp = MissionTypes.getProgress ? MissionTypes.getProgress() : null;
                var _nearBombDist = 999;
                if (_mtp && _mtp.bombs) {
                  for (var _dmi = 0; _dmi < _mtp.bombs.length; _dmi++) {
                    var _dm = _mtp.bombs[_dmi];
                    if (_dm.defused) continue;
                    var _ddx = player.position.x - _dm.x, _ddz = player.position.z - _dm.z;
                    _nearBombDist = Math.min(_nearBombDist, _ddx * _ddx + _ddz * _ddz);
                  }
                }
                if (_nearBombDist < 36) { // 6m radius \u2014 show prompt on keydown, hold runs in update loop
                  HUD.notifyPickup('\u23f1\ufe0f HOLD [F] TO DEFUSE...', '#ffcc00');
                  fHandled = true;
                }
              }
            }
            } // end mt && mt.config
          }
          // Priority 3: possess nearest drone or launch one
          if (!fHandled) {
            var linkedDrone = connectOrLaunchDrone('recon');
            if (linkedDrone) {
              fHandled = true;
            }
          }
          // Priority 4: quick melee
          if (!fHandled && typeof CombatExtras !== 'undefined') {
            var qm = CombatExtras.tryQuickMelee();
            if (qm) {
              var enemies = Enemies.getAll();
              for (var qi = 0; qi < enemies.length; qi++) {
                var qe = enemies[qi];
                if (!qe.alive || !qe.mesh) continue;
                var qdx = qe.mesh.position.x - player.position.x;
                var qdz = qe.mesh.position.z - player.position.z;
                if (qdx * qdx + qdz * qdz < qm.range * qm.range) {
                  Enemies.damage(qe, qm.damage);
                  break;
                }
              }
            }
          }
        }

        // Toggle drone camera view (eye/chase)
        if (e.code === 'KeyT' && DroneSystem.isPossessing()) {
          toggleDroneRemoteView();
        }

        // Vehicle enter/exit/hijack
        if (e.code === 'KeyG') {
          // Bradley IFV: check exit first so pilot can always dismount.
          if (typeof Bradley !== 'undefined' && Bradley.isActive && Bradley.isActive()) {
            Bradley.exit();
            HUD.notifyPickup('🚛 DISMOUNTED BRADLEY', '#a0c878');
          } else if (VehicleSystem.isHijacking()) {
            // Cancel hijack if pressing G again during hijack
            VehicleSystem.cancelHijack();
            HUD.notifyPickup('❌ HIJACK CANCELLED', '#ff4444');
          } else if (VehicleSystem.isInVehicle()) {
            hideTankHUD(); // Hide tank HUD on exit
            const exitPos = VehicleSystem.exit();
            if (exitPos) {
              player.position.copy(exitPos);
              player.position.y += player.height;
            }
          } else {
            // Check Bradley proximity before falling to VehicleSystem
            var _bradleyMounted = false;
            if (typeof Bradley !== 'undefined' && Bradley.getVehicle) {
              var _bv = Bradley.getVehicle();
              if (_bv && _bv.group) {
                var _bdx = player.position.x - _bv.group.position.x;
                var _bdz = player.position.z - _bv.group.position.z;
                if (_bdx * _bdx + _bdz * _bdz < 49) { // 7m
                  Bradley.enter();
                  HUD.notifyPickup('🚛 MOUNTED BRADLEY — M242 Bushmaster ready', '#a0c878');
                  _bradleyMounted = true;
                }
              }
            }
            if (!_bradleyMounted) {
              const nearby = VehicleSystem.getNearby(player.position, 5);
              if (nearby.length > 0) {
                const targetVehicle = nearby[0];
                if (targetVehicle.faction === 'enemy') {
                  // Start animated hijack of enemy vehicle
                  VehicleSystem.startHijack(targetVehicle.id);
                  _removeEnemyTankClone(targetVehicle);
                  HUD.notifyPickup('🚗 HIJACKING… Hold steady!', '#ff4444');
                } else if (targetVehicle.occupied) {
                  // Commandeer friendly vehicle (faster)
                  VehicleSystem.startHijack(targetVehicle.id);
                  _removeEnemyTankClone(targetVehicle);
                  HUD.notifyPickup('🚗 COMMANDEERING…', '#ffaa00');
                } else {
                  VehicleSystem.enter(targetVehicle.id);
                  _removeEnemyTankClone(targetVehicle);
                  // Show tank HUD if entering a tank
                  if (targetVehicle.isTank) showTankHUD();
                  HUD.notifyPickup('🚗 ENTERED VEHICLE', '#44ff44');
                }
              } else {
                // No nearby vehicle: place IED if available, else throw grenade
                if (window.TripwireIED) {
                  TripwireIED.placeIED(player.position, _camera.rotation.y);
                } else {
                  throwHandGrenade();
                }
              }
            }
          }
        }

        if (e.key === 'z' || e.key === 'Z') {
            if (window.SpecialGrenades && SpecialGrenades.getSmokeCount() > 0) {
                SpecialGrenades.throwSmoke(player.position, _camera);
            } else { if (window.HUD && HUD.showToast) HUD.showToast('No smoke grenades'); }
        }
        if (e.key === 'x' || e.key === 'X') {
            if (window.SpecialGrenades && SpecialGrenades.getFlashCount() > 0) {
                SpecialGrenades.throwFlash(player.position, _camera);
            } else { if (window.HUD && HUD.showToast) HUD.showToast('No flashbangs'); }
        }

        // V key — melee knife attack
        if (e.key === 'v' || e.key === 'V') {
          if (window.MeleeKnife && gameState === STATE.PLAYING) {
            var _allEnemiesForKnife = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
            MeleeKnife.attack(player.position, _camera, _allEnemiesForKnife, function(enemy, dmg) {
              Enemies.damageEnemy(enemy, dmg, 'knife');
              player.kills++;
              HUD.addKillFeedEntry('You', enemy.type || 'Enemy', '🔪');
            });
          }
        }

        // C key — place claymore mine
        if (e.key === 'c' || e.key === 'C') {
          if (window.ClaymoreMines && ClaymoreMines.getCount() > 0) {
            ClaymoreMines.placeMine(player.position.clone(), CameraSystem.getForwardDir ? CameraSystem.getForwardDir() : new THREE.Vector3(0, 0, -1));
            HUD.showToast('Claymore placed');
          } else if (window.ClaymoreMines) {
            HUD.showToast('No claymores!');
          }
        }

        // Toggle vehicle camera view (first person / third person)
        if (e.code === 'KeyT' && VehicleSystem.isInVehicle()) {
          VehicleSystem.toggleVehicleView();
          var veh = VehicleSystem.getOccupied();
          HUD.notifyPickup(veh && veh.viewMode === 'first' ? '👁 FIRST PERSON VIEW' : '🎥 THIRD PERSON VIEW', '#00ccff');
        }

        // Stealth / invisibility toggle (moved to Backquote)
        if (e.code === 'Backquote') {
          toggleStealth();
        }

        // Inventory toggle (I key)
        if (e.code === 'KeyI') {
          toggleInventory();
        }

        // Prone toggle
        if (e.code === 'KeyZ') {
          player.prone = !player.prone;
          player.isCrouching = false; // stand if going prone
          player.height = player.prone ? 0.6 : 1.7;
          if (HUD.showProne) HUD.showProne(player.prone);
          HUD.notifyPickup(player.prone ? '🔽 PRONE' : '🔼 STANDING', player.prone ? '#888' : '#fff');
        }

        // Bandage (stop bleeding)
        if (e.code === 'KeyX') {
          if (player.bleeding) {
            player.bleeding = false;
            player.bleedTimer = 0;
            if (HUD.showBleed) HUD.showBleed(false);
            HUD.notifyPickup('🩹 BANDAGE APPLIED', '#22ff55');
            try { if (typeof Achievements !== 'undefined' && Achievements.recordBandage) Achievements.recordBandage(); } catch (eAchB) {}
          }
        }

        // Night Vision Goggles toggle (Shift+N)
        if (e.code === 'KeyN' && e.shiftKey) {
          window._nvgActive = !window._nvgActive;
          var _nvgCanvas = document.getElementById('c') || document.querySelector('canvas');
          if (_nvgCanvas) {
            _nvgCanvas.style.filter = window._nvgActive ? 'brightness(0.3) contrast(3) hue-rotate(100deg) saturate(5) sepia(0.8)' : '';
          }
          if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
            HUD.notifyPickup(window._nvgActive ? '🟢 NVG ON' : 'NVG OFF', window._nvgActive ? '#00ff44' : '#888888');
          }
        }

        // Airdrop beacon
        if (e.code === 'KeyN' && !e.shiftKey && player.airdropCooldown <= 0) {
          player.airdropCooldown = 45; // 45 second cooldown
          HUD.notifyPickup('📦 AIRDROP BEACON DEPLOYED!', '#44ff88');
          setTimeout(function () {
            // Drop 6 pickups near player after 3s delay
            for (var ai = 0; ai < 6; ai++) {
              var ax = player.position.x + (Math.random() - 0.5) * 10;
              var az = player.position.z + (Math.random() - 0.5) * 10;
              var ah = window.VoxelWorld.getTerrainHeight(ax, az);
              var types = ['HEALTH', 'AMMO', 'ARMOR', 'MEDKIT', 'GRENADE', 'STIM'];
              Pickups.spawn(new THREE.Vector3(ax, ah, az), types[Math.floor(Math.random() * types.length)]);
            }
            window.AudioSystem.playExplosion();
            HUD.notifyPickup('📦 AIRDROP ARRIVED!', '#44ff88');
          }, 3000);
        }

        // Clear weapon jam
        if (e.code === 'KeyR' && Weapons.isJammed && Weapons.isJammed()) {
          Weapons.clearJam();
          window.AudioSystem.playReload();
          HUD.notifyPickup('🔧 JAM CLEARED!', '#ffcc00');
          return; // Don't also trigger reload
        }

        // Music toggle (Comma key)
        if (e.code === 'Comma') {
          if (window.AudioSystem.isMusicPlaying && window.AudioSystem.isMusicPlaying()) {
            window.AudioSystem.stopMusic();
            HUD.notifyPickup('🔇 MUSIC OFF', '#888888');
          } else {
            window.AudioSystem.playMusic('battle');
            HUD.notifyPickup('🎵 MUSIC ON', '#00ff88');
          }
        }

        // Night vision toggle
        if (e.code === 'KeyL') {
          player.nightVision = !player.nightVision;
          if (HUD.showNightVision) HUD.showNightVision(player.nightVision);
          HUD.notifyPickup(player.nightVision ? '🔦 NIGHT VISION ON' : '🔦 NIGHT VISION OFF',
            player.nightVision ? '#00ff44' : '#888888');
          // Enhance scene lighting for NV effect
          if (player.nightVision) {
            if (ambLight) ambLight.intensity = 1.8;
            if (_scene.fog) { _scene.fog.near = 80; _scene.fog.far = 200; }
          } else {
            if (ambLight) ambLight.intensity = 0.8;
            if (_scene.fog) { _scene.fog.near = 30; _scene.fog.far = 140; }
          }
        }

        /* ═══ NEW FEATURE KEYBINDS (59 features) ═══ */

        // Tactical lean (Q/E override when not switching weapons in non-build mode)
        if (e.code === 'KeyQ' && !VehicleSystem.isInVehicle() && !DroneSystem.isPossessing() && keys['AltLeft']) {
          if (typeof CombatExtras !== 'undefined') CombatExtras.setLean(-1);
        }
        if (e.code === 'KeyE' && !VehicleSystem.isInVehicle() && !DroneSystem.isPossessing() && keys['AltLeft']) {
          if (typeof CombatExtras !== 'undefined') CombatExtras.setLean(1);
        }

        // Weapon inspect (hold V - only if not in vehicle)
        if (e.code === 'KeyV' && !VehicleSystem.isInVehicle() && keys['ShiftLeft']) {
          if (typeof CombatExtras !== 'undefined') CombatExtras.startInspect();
        }

        // Cycle ammo type (C key)
        if (e.code === 'KeyC' && !e.shiftKey) {
          if (typeof CombatExtras !== 'undefined') {
            var ammoInfo = CombatExtras.cycleAmmoType();
            HUD.notifyPickup('🔄 AMMO: ' + ammoInfo.name, '#' + ammoInfo.color.toString(16).padStart(6, '0'));
            var ammoIndicator = document.getElementById('ammo-type-indicator');
            if (ammoIndicator) ammoIndicator.textContent = ammoInfo.name.toUpperCase();
          }
        }

        // Companion drone toggle (Shift+C)
        if (e.code === 'KeyC' && e.shiftKey) {
          if (typeof CompanionDrone !== 'undefined') {
            if (CompanionDrone.isActive()) {
              CompanionDrone.recall();
            } else {
              CompanionDrone.deploy(player.position);
            }
          }
        }

        // H key — Ballistic Shield deploy/pickup (priority), else field bandage
        if (e.code === 'KeyH') {
          var _shieldHandled = false;
          if (window.BallisticShield) {
            if (BallisticShield.isDeployed()) {
              BallisticShield.pickup(player.position);
              _shieldHandled = true;
            } else {
              BallisticShield.deploy(player.position, _camera.rotation.y);
              HUD.notifyPickup('🛡 SHIELD DEPLOYED', '#88ffaa');
              _shieldHandled = true;
            }
          }
          if (!_shieldHandled) {
            if (typeof Perks !== 'undefined' && Perks.useBandage()) {
              HUD.notifyPickup('🩹 FIELD BANDAGE APPLIED!', '#22ff55');
              try { if (typeof Achievements !== 'undefined' && Achievements.recordBandage) Achievements.recordBandage(); } catch (eAchH) {}
            }
          }
        }

        // Killstreak activation (K key - toggles panel)
        if (e.code === 'KeyK') {
          var ksPanel = document.getElementById('killstreak-panel');
          if (ksPanel) {
            ksPanel.style.display = ksPanel.style.display === 'none' ? 'block' : 'none';
          }
        }

        // ── B24: Crouch toggle (Ctrl) ──
        if (e.code === 'ControlLeft' && gameState === STATE.PLAYING) {
          player.isCrouching = !player.isCrouching;
          if (player.isCrouching && keys['ShiftLeft']) {
            // Slide: sprint + crouch = slide
            player.slideTimer = 0.6;
            var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
            fwd.y = 0; fwd.normalize();
            player.slideDir = fwd;
            HUD.notifyPickup('🏃 SLIDE', '#00ddff');
          }
        }

        // M key — MortarEmplacement deploy/undeploy (no shift), else Ping/Minimap
        if (e.code === 'KeyM' && gameState === STATE.PLAYING) {
          if (!e.shiftKey && window.MortarEmplacement) {
            // Toggle mortar emplacement
            if (MortarEmplacement.isDeployed()) {
              MortarEmplacement.undeploy();
            } else {
              MortarEmplacement.deploy(player.position, _camera);
            }
          } else if (e.shiftKey) {
            // Shift+M: toggle tactical minimap
            if (typeof Minimap !== 'undefined' && Minimap.toggle) {
              Minimap.toggle();
              HUD.notifyPickup('🗺️ MINIMAP ' + (Minimap.isVisible ? 'ON' : 'OFF'), '#88aaff');
            }
          } else {
            if (typeof Minimap !== 'undefined' && Minimap.toggle) Minimap.toggle();
            if (typeof Feedback !== 'undefined') {
              var pingPos = player.position.clone();
              var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
              pingPos.add(fwd.multiplyScalar(20));
              Feedback.addPing(pingPos.x, pingPos.y, pingPos.z, 'MARK', '#ffff00');
              HUD.notifyPickup('📍 POSITION MARKED', '#ffff00');
            }
          }
        }

        // Perks menu (P key — override time pause in gameplay)
        if (e.code === 'KeyP' && gameState === STATE.PLAYING) {
          var perksMenu = document.getElementById('perks-menu');
          if (perksMenu) {
            if (perksMenu.style.display === 'none' || !perksMenu.style.display) {
              _openPerksMenu();
              perksMenu.style.display = 'block';
            } else {
              perksMenu.style.display = 'none';
            }
          }
        }

        // Weather cycle (Shift+W)
        if (e.code === 'KeyW' && e.shiftKey) {
          var weathers = ['clear', 'rain', 'snow', 'fog', 'sandstorm'];
          var cur = (typeof Weather !== 'undefined') ? Weather.getCurrent() : 'clear';
          var nextIdx = (weathers.indexOf(cur) + 1) % weathers.length;
          if (typeof Weather !== 'undefined') Weather.setWeather(weathers[nextIdx]);
          if (typeof HUD !== 'undefined' && HUD.notify) HUD.notify('🌦 Weather: ' + weathers[nextIdx].toUpperCase());
        }

        // War journal (Y key)
        if (e.code === 'KeyY') {
          var journalPanel = document.getElementById('journal-panel');
          if (journalPanel) {
            if (journalPanel.style.display === 'none' || !journalPanel.style.display) {
              _openJournal();
              journalPanel.style.display = 'block';
            } else {
              journalPanel.style.display = 'none';
            }
          }
        }

        // (F-key actions consolidated into priority chain above)

        // Bayonet charge (B key while sprinting, only if not in build mode)
        if (e.code === 'KeyB' && player.sprinting && gameState === STATE.PLAYING && typeof CombatExtras !== 'undefined') {
          if (CombatExtras.startBayonetCharge()) {
            HUD.notifyPickup('🔪 BAYONET CHARGE!', '#ff2222');
          }
        }

        // Weapon maintenance (hold R + M)
        if (e.code === 'KeyR' && keys['KeyM'] && typeof CombatExtras !== 'undefined') {
          if (CombatExtras.startMaintenance()) {
            HUD.notifyPickup('🔧 MAINTAINING WEAPON...', '#cccc00');
          }
        }

        // Blind fire toggle (Alt + LMB mode toggle with KeyO)
        if (e.code === 'KeyO' && typeof CombatExtras !== 'undefined') {
          var blindOn = CombatExtras.toggleBlindFire();
          HUD.notifyPickup(blindOn ? '🔫 BLIND FIRE ON' : '🔫 BLIND FIRE OFF', blindOn ? '#bbb' : '#fff');
          var bfInd = document.getElementById('blindfire-indicator');
          if (bfInd) bfInd.style.display = blindOn ? 'block' : 'none';
        }

        // ── B30: Combat Roll (double-tap A/D or Alt+A/D) ──
        if ((e.code === 'KeyA' || e.code === 'KeyD') && keys['AltLeft'] && typeof CombatExtras !== 'undefined' && CombatExtras.tryRoll) {
          var rollDir = new THREE.Vector3();
          var rRight = new THREE.Vector3(Math.cos(CameraSystem.getYaw()), 0, -Math.sin(CameraSystem.getYaw()));
          rollDir.copy(rRight).multiplyScalar(e.code === 'KeyD' ? 1 : -1);
          if (CombatExtras.tryRoll(rollDir)) {
            HUD.notifyPickup('🔄 DODGE ROLL', '#00ccff');
            if (window.AudioSystem.playRollDodge) window.AudioSystem.playRollDodge();
          }
        }

        // ── B30: Quick Weapon Swap (double-tap Q) ──
        if (e.code === 'KeyQ' && keys['AltLeft'] && typeof CombatExtras !== 'undefined' && CombatExtras.quickSwap) {
                  // Try to re-initialize lighting and fog after context restore
                  setTimeout(() => {
                    if (_scene) {
                      let stageCfg = (typeof getCurrentStageConfig === 'function') ? getCurrentStageConfig() : null;
                      let bgColor = stageCfg && stageCfg.bgColor !== undefined ? stageCfg.bgColor : 0xFFD700;
                      let fogColor = stageCfg && stageCfg.fogColor !== undefined ? stageCfg.fogColor : 0xFFD700;
                      _scene.background = new THREE.Color(bgColor);
                      _scene.fog = new THREE.Fog(fogColor, 14, 80);
                    }
                    // Optionally re-init lighting here if needed
                  }, 100);
          CombatExtras.quickSwap();
        }

        // ── B30: Grapple Hook (KeyF + Shift) ──
        if (e.code === 'KeyF' && keys['ShiftLeft'] && typeof Traversal !== 'undefined' && Traversal.launchGrapple) {
          var grapDir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
          var grapResult = Traversal.launchGrapple(player.position, grapDir, 30, function (bx, by, bz) { return window.VoxelWorld.getBlock(bx, by, bz); });
          if (grapResult) {
            HUD.notifyPickup('🪝 GRAPPLE!', '#ff8800');
            if (window.AudioSystem.playGrappleHook) window.AudioSystem.playGrappleHook();
          }
        }

        // ── B29: Squad Commands (Numpad 1-6) ──
        if (typeof NPCSystem !== 'undefined' && NPCSystem.commandSquad) {
          var squadCmds = { 'Numpad1': 'attack', 'Numpad2': 'defend', 'Numpad3': 'regroup', 'Numpad4': 'flank_left', 'Numpad5': 'flank_right', 'Numpad6': 'hold_fire' };
          if (squadCmds[e.code]) {
            var fGroups = NPCSystem.getFriendlyGroups();
            for (var gi = 0; gi < fGroups.length; gi++) NPCSystem.commandSquad(fGroups[gi].id, squadCmds[e.code]);
            HUD.notifyPickup('📢 SQUAD: ' + squadCmds[e.code].toUpperCase().replace('_', ' '), '#44ddff');
          }
        }

        // ── B29: Build Fortification (Shift+F1..F4) ──
        if (keys['ShiftLeft'] && typeof WorldFeatures !== 'undefined' && WorldFeatures.buildFortification) {
          var fortMap = { 'F1': 'bunker', 'F2': 'barricade', 'F3': 'watchtower', 'F4': 'ammo_cache' };
          if (fortMap[e.code] && gameState === STATE.PLAYING) {
            e.preventDefault();
            var fwd3 = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
            var fx = player.position.x + fwd3.x * 3;
            var fz = player.position.z + fwd3.z * 3;
            var fy = window.VoxelWorld.getTerrainHeight(fx, fz);
            WorldFeatures.buildFortification(fortMap[e.code], fx, fy, fz, _scene);
            HUD.notifyPickup('🏗 ' + fortMap[e.code].toUpperCase() + ' BUILT', '#88cc44');
            if (window.AudioSystem.playFortificationBuild) window.AudioSystem.playFortificationBuild();
          }
        }

        // ── B32: Vehicle Horn (KeyN while in vehicle) ──
        if (e.code === 'KeyN' && typeof VehicleSystem !== 'undefined' && VehicleSystem.isInVehicle()) {
          var veh = VehicleSystem.getOccupied();
          if (veh && VehicleSystem.honkHorn) VehicleSystem.honkHorn(veh.id);
        }

        // Night Vision Goggles (NightVision module — N key, no modifiers, not in vehicle)
        if (e.code === 'KeyN' && !e.shiftKey && !e.ctrlKey && !e.altKey && gameState === STATE.PLAYING) {
          if (typeof NightVision !== 'undefined') NightVision.toggle();
        }

        // Gas Mask toggle (T key — only when not in drone/vehicle, normal gameplay)
        if (e.code === 'KeyT' && !DroneSystem.isPossessing() && !VehicleSystem.isInVehicle() && gameState === STATE.PLAYING) {
          if (window.GasMask) {
            if (GasMask.isAvailable()) {
              GasMask.isEquipped() ? GasMask.unequip() : GasMask.equip();
            } else {
              if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('No gas mask', '#888888');
            }
          }
        }

        // Dolphin dive (Ctrl while sprinting)
        if (e.code === 'ControlLeft' && player.sprinting && typeof Traversal !== 'undefined') {
          var fwdDir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
          if (Traversal.tryDolphinDive({ x: fwdDir.x, z: fwdDir.z }, true)) {
            HUD.notifyPickup('💨 DOLPHIN DIVE!', '#00aaff');
          }
        }

        // Landmine placement (KeyU)
        if (e.code === 'KeyU' && typeof WorldFeatures !== 'undefined') {
          var mineY = window.VoxelWorld.getTerrainHeight(player.position.x, player.position.z);
          if (WorldFeatures.placeMine(player.position.x, mineY, player.position.z, 'player')) {
            HUD.notifyPickup('💣 LANDMINE PLACED!', '#44aa44');
          }
        }

        // Weapon inspect (Home key)
        if (e.code === 'Home' && Weapons.startInspect) Weapons.startInspect();

        // Sandbag quick-deploy (KeyJ + Shift)
        if (e.code === 'KeyJ' && keys['ShiftLeft'] && typeof WorldFeatures !== 'undefined') {
          var fwdSB = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
          var sbX = player.position.x + fwdSB.x * 2;
          var sbZ = player.position.z + fwdSB.z * 2;
          var sbY = window.VoxelWorld.getTerrainHeight(sbX, sbZ);
          if (WorldFeatures.startSandbagDeploy(sbX, sbY, sbZ)) {
            HUD.notifyPickup('🏗️ DEPLOYING SANDBAG...', '#c2b280');
          }
        }
        // Marketplace (KeyJ without Shift — opens inventory Shop tab)
        if (e.code === 'KeyJ' && !keys['ShiftLeft']) {
          toggleInventory();
          // Switch to shop tab
          var shopTab = document.querySelector('.inv-tab[data-tab="shop"]');
          if (shopTab) shopTab.click();
        }

        // Inventory/Tab toggle
        if (e.code === 'Tab') {
          e.preventDefault();
          toggleInventory();
        }

        // Weapon switching (1-9 = weapons 0-8, 0 = weapon 9)
        if (e.code === 'Digit1') Weapons.switchTo(0);
        if (e.code === 'Digit2') Weapons.switchTo(1);
        if (e.code === 'Digit3') Weapons.switchTo(2);
        if (e.code === 'Digit4' && gameState === STATE.PLAYING) Weapons.switchTo(3);
        if (e.code === 'Digit5' && gameState === STATE.PLAYING) Weapons.switchTo(4);
        if (e.code === 'Digit6' && gameState === STATE.PLAYING) Weapons.switchTo(5);
        if (e.code === 'Digit7' && gameState === STATE.PLAYING) Weapons.switchTo(6);
        if (e.code === 'Digit8') Weapons.switchTo(7);
        if (e.code === 'Digit9') Weapons.switchTo(8);
        if (e.code === 'Digit0') Weapons.switchTo(9);
        if (e.code === 'KeyQ' && !keys['AltLeft'] && gameState === STATE.PLAYING) {
          if (!_weaponWheelHeld) {
            _weaponWheelHeld = true;
            // Build weapon list from unlocked weapons
            var _wwWeapons = [];
            var _wwUnlocked = Weapons.getUnlockedList ? Weapons.getUnlockedList() : [];
            for (var _wi = 0; _wi < _wwUnlocked.length; _wi++) {
              var _wwIdx = _wwUnlocked[_wi];
              var _wwDef = Weapons.getWeaponDef ? Weapons.getWeaponDef(_wwIdx) : null;
              var _wwState = Weapons.getWeaponState ? Weapons.getWeaponState(_wwIdx) : null;
              if (_wwDef) {
                _wwWeapons.push({
                  name: _wwDef.name || ('Weapon ' + (_wwIdx + 1)),
                  icon: '🔫',
                  ammo: _wwState ? _wwState.clip : 0,
                  maxAmmo: _wwDef.clipSize || 30,
                  _origIdx: _wwIdx,
                });
              }
            }
            if (typeof HUD !== 'undefined' && HUD.showWeaponWheel) {
              // Find position of current weapon in unlocked list
              var _wwCurIdx = Weapons.getCurrentIdx ? Weapons.getCurrentIdx() : 0;
              var _wwCurPos = 0;
              for (var _wj = 0; _wj < _wwUnlocked.length; _wj++) {
                if (_wwUnlocked[_wj] === _wwCurIdx) { _wwCurPos = _wj; break; }
              }
              HUD.showWeaponWheel(_wwWeapons, _wwCurPos);
            }
          }
        }
        if (e.code === 'KeyE' && !keys['AltLeft'] && gameState === STATE.PLAYING) {
          // ── Grapple: Ctrl+E fires hook; E while attached releases ──
          var _grappleHandled = false;
          if (window.Grapple && !VehicleSystem.isInVehicle() && !DroneSystem.isPossessing()) {
            if (Grapple.isActive()) {
              Grapple.release();
              _grappleHandled = true;
            } else if (e.ctrlKey) {
              Grapple.fire(player.position, _camera);
              _grappleHandled = true;
            }
          }
          if (!_grappleHandled) {
            // Check for nearby scavenged weapon drop first (E key)
            if (window.ScavengeSystem && player && ScavengeSystem.tryPickup(player.position)) {
              // Pickup succeeded — skip further E-key actions
            } else {
            // Check for nearby attachment pickup first
            var _atkPickedUp = false;
            if (typeof Attachments !== 'undefined' && _scene && player) {
              var _atkChildren = _scene.children;
              for (var _ati = 0; _ati < _atkChildren.length; _ati++) {
                var _atkMesh = _atkChildren[_ati];
                if (!_atkMesh || !_atkMesh.userData || !_atkMesh.userData.isAttachmentPickup) continue;
                var _atkDist = _atkMesh.position.distanceTo(player.position);
                if (_atkDist <= 1.5) {
                  var _atkId = _atkMesh.userData.attachmentId;
                  var _atkSlot = Weapons.getCurrentIdx();
                  Attachments.attach(_atkSlot, _atkId);
                  _scene.remove(_atkMesh);
                  if (_atkMesh.geometry) _atkMesh.geometry.dispose();
                  if (_atkMesh.material) _atkMesh.material.dispose();
                  // Refresh weapon HUD to show new attachment icon
                  if (typeof HUD !== 'undefined' && HUD.setWeapon && Weapons.getCurrentName) {
                    var _atkDef = Attachments.getAttached(_atkSlot);
                    var _atkIcon = _atkDef ? ' ' + _atkDef.icon : '';
                    HUD.setWeapon(Weapons.getCurrentName() + _atkIcon, _atkSlot);
                  }
                  _atkPickedUp = true;
                  break;
                }
              }
            }
            if (!_atkPickedUp) Weapons.switchNext();
            } // end else (no scavenge pickup)
          }
        }
        if (e.code === 'KeyR' && !(Weapons.isJammed && Weapons.isJammed()) && !keys['KeyM'])   { Weapons.forceReload(); if (window.AudioSystem && window.AudioSystem.playReload) window.AudioSystem.playReload(); MLSystem.onReload(); MLSystem.trackReload(); }
        if (e.code === 'KeyR' && !e.shiftKey && !e.ctrlKey && !keys['KeyM'] && window.RadioSupport) { RadioSupport.openMenu(); }

        // Build mode: template selection
        if (gameState === STATE.BUILD_MODE) {
          const templateKeys = {
            'F1': 'barracks',
            'F2': 'factory',
            'F3': 'turret',
            'F4': 'droneHangar',
            'F5': 'commandCenter',
            'F6': 'wall',
            'F7': 'dugout',
          };
          if (templateKeys[e.code]) {
            e.preventDefault();
            Building.selectTemplate(templateKeys[e.code]);
          }
        }

        // RTS camera keys
        if (CameraSystem.getMode() === CameraSystem.MODE.STRATEGIC) {
          if (e.code === 'ArrowUp'    || e.code === 'KeyW') CameraSystem.setRTSKey('up', true);
          if (e.code === 'ArrowDown'  || e.code === 'KeyS') CameraSystem.setRTSKey('down', true);
          if (e.code === 'ArrowLeft'  || e.code === 'KeyA') CameraSystem.setRTSKey('left', true);
          if (e.code === 'ArrowRight' || e.code === 'KeyD') CameraSystem.setRTSKey('right', true);
        }

        // Drone keys
        if (DroneSystem.isPossessing()) {
          if (e.code === 'KeyW') DroneSystem.setDroneKey('w', true);
          if (e.code === 'KeyS') DroneSystem.setDroneKey('s', true);
          if (e.code === 'KeyA') DroneSystem.setDroneKey('a', true);
          if (e.code === 'KeyD') DroneSystem.setDroneKey('d', true);
          if (e.code === 'Space')    DroneSystem.setDroneKey('up', true);
          if (e.code === 'ShiftLeft') DroneSystem.setDroneKey('down', true);
        }

        // Vehicle keys
        if (VehicleSystem.isInVehicle()) {
          if (e.code === 'KeyW') VehicleSystem.setVehicleKey('w', true);
          if (e.code === 'KeyS') VehicleSystem.setVehicleKey('s', true);
          if (e.code === 'KeyA') VehicleSystem.setVehicleKey('a', true);
          if (e.code === 'KeyD') VehicleSystem.setVehicleKey('d', true);
          if (e.code === 'Space')     VehicleSystem.setVehicleKey('up', true);
          if (e.code === 'ShiftLeft') VehicleSystem.setVehicleKey('down', true);
        }
        if (e.code === 'ShiftLeft') { if (window.StaminaSystem) StaminaSystem.startSprint(); }
      }

      // ── B26: FPS display toggle (F10) ──
      if (e.code === 'F10') {
        e.preventDefault();
        if (HUD.toggleFPS) HUD.toggleFPS();
      }
      // ── B26: Settings panel toggle (F9) ──
      if (e.code === 'F9') {
        e.preventDefault();
        if (HUD.toggleSettings) HUD.toggleSettings();
      }

      // Pause toggle — skip if we just exited fullscreen (browser ESC exits fullscreen first)
      if (e.code === 'Escape') {
        if (e.isTrusted && (document.fullscreenElement || document.webkitFullscreenElement || _skipNextEsc)) {
          _skipNextEsc = false;
          return; // Let the browser handle fullscreen exit without toggling pause
        }
        if (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE) {
          gameState = STATE.PAUSED;
          var invOv = document.getElementById('inventory-overlay');
          if (invOv) {
            showInventory();
            invOv.style.display = 'flex';
          }
          _releaseMouseForUI();
        } else if (gameState === STATE.PAUSED) {
          gameState = STATE.PLAYING;
          var invOv = document.getElementById('inventory-overlay');
          if (invOv) invOv.style.display = 'none';
          hideOverlays();
          requestPointerLock();
        }
      }
    });

    document.addEventListener('keyup', function (e) {
      keys[e.code] = false;

      // Reset lean on Q/E release
      if ((e.code === 'KeyQ' || e.code === 'KeyE') && typeof CombatExtras !== 'undefined') {
        CombatExtras.setLean(0);
      }

      // Weapon wheel: release Q to confirm selection
      if (e.code === 'KeyQ' && _weaponWheelHeld) {
        _weaponWheelHeld = false;
        var _wwSelected = (typeof HUD !== 'undefined' && HUD.hideWeaponWheel) ? HUD.hideWeaponWheel() : -1;
        if (_wwSelected >= 0) {
          // _wwSelected is position in unlocked list; resolve to actual weapon index
          var _wwUnlockedOnUp = Weapons.getUnlockedList ? Weapons.getUnlockedList() : [];
          var _wwTargetIdx = (_wwUnlockedOnUp[_wwSelected] !== undefined) ? _wwUnlockedOnUp[_wwSelected] : -1;
          if (_wwTargetIdx >= 0 && _wwTargetIdx !== (Weapons.getCurrentIdx ? Weapons.getCurrentIdx() : 0)) {
            Weapons.switchTo(_wwTargetIdx);
          }
        }
      }

      if (CameraSystem.getMode() === CameraSystem.MODE.STRATEGIC) {
        if (e.code === 'ArrowUp'    || e.code === 'KeyW') CameraSystem.setRTSKey('up', false);
        if (e.code === 'ArrowDown'  || e.code === 'KeyS') CameraSystem.setRTSKey('down', false);
        if (e.code === 'ArrowLeft'  || e.code === 'KeyA') CameraSystem.setRTSKey('left', false);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') CameraSystem.setRTSKey('right', false);
      }
      if (DroneSystem.isPossessing()) {
        if (e.code === 'KeyW') DroneSystem.setDroneKey('w', false);
        if (e.code === 'KeyS') DroneSystem.setDroneKey('s', false);
        if (e.code === 'KeyA') DroneSystem.setDroneKey('a', false);
        if (e.code === 'KeyD') DroneSystem.setDroneKey('d', false);
        if (e.code === 'Space')    DroneSystem.setDroneKey('up', false);
        if (e.code === 'ShiftLeft') DroneSystem.setDroneKey('down', false);
      }
      if (VehicleSystem.isInVehicle()) {
        if (e.code === 'KeyW') VehicleSystem.setVehicleKey('w', false);
        if (e.code === 'KeyS') VehicleSystem.setVehicleKey('s', false);
        if (e.code === 'KeyA') VehicleSystem.setVehicleKey('a', false);
        if (e.code === 'KeyD') VehicleSystem.setVehicleKey('d', false);
        if (e.code === 'Space')     VehicleSystem.setVehicleKey('up', false);
        if (e.code === 'ShiftLeft') VehicleSystem.setVehicleKey('down', false);
      }
      if (e.code === 'ShiftLeft') { if (window.StaminaSystem) StaminaSystem.stopSprint(); }
    });

    // Mobile audio unlock — resume Web Audio context on first touch (iOS/Android requirement)
    document.addEventListener('touchstart', function () {
      if (window.AudioSystem && typeof window.AudioSystem.resume === 'function') window.AudioSystem.resume();
    }, { passive: true });

    // Auto-pause when tab/app loses focus (mobile background, alt-tab, etc.)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE)) {
        gameState = STATE.PAUSED;
        var invOv = document.getElementById('inventory-overlay');
        if (invOv) {
          if (typeof showInventory === 'function') showInventory();
          invOv.style.display = 'flex';
        }
        _releaseMouseForUI();
        if (typeof updateMobileControlsVisibility === 'function') updateMobileControlsVisibility();
      }
    });

    document.addEventListener('mousedown', function (e) {
      // Resume audio context on any user gesture
      if (window.AudioSystem && typeof window.AudioSystem.resume === 'function') window.AudioSystem.resume();

      if (e.button === 0) {
        // If playing without pointer lock, re-acquire it on click
        if (!isMobile && (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE)
            && !document.pointerLockElement) {
          requestPointerLock();
          // When possessing a drone, also register the click as fire — don't eat it
          if (typeof DroneSystem !== 'undefined' && DroneSystem.isPossessing && DroneSystem.isPossessing()) {
            mouseDown = true;
            mouseNewPress = true;
          } else {
            return; // Don't fire on the lock-acquiring click
          }
        } else {
          mouseDown = true;
          mouseNewPress = true;
        }

        if (gameState === STATE.BUILD_MODE) {
          handleBuildClick();
        }
      }
      if (e.button === 2 && gameState === STATE.BUILD_MODE) {
        // Right-click removes block
        handleBuildRemove();
      }
      if (e.button === 2 && gameState === STATE.PLAYING) {
        // Tank MG: RMB fires coaxial machine gun
        if (VehicleSystem.isInVehicle()) {
          var occ = VehicleSystem.getOccupied();
          if (occ && occ.isTank) {
            VehicleSystem.setVehicleKey('mgFire', true);
            return;
          }
        }
        // Minecraft-style building: right-click with shovel places a block
        if (Weapons.getCurrentType() === 'MELEE') {
          handleMinecraftPlace();
        } else {
          Weapons.handleRightDown();
          // ADS: aim down sights on right-click (non-melee, non-vehicle)
          if (window.ADSSystem && ADSSystem.startADS) ADSSystem.startADS();
        }
      }
    });

    document.addEventListener('mouseup', function (e) {
      if (e.button === 0) { mouseDown = false; mouseNewPress = false; }
      if (e.button === 2) {
        // Stop tank MG fire on RMB release
        if (VehicleSystem.isInVehicle()) {
          VehicleSystem.setVehicleKey('mgFire', false);
        }
        Weapons.handleRightUp();
        // ADS: exit aim-down-sights on right-click release
        if (window.ADSSystem && ADSSystem.stopADS) ADSSystem.stopADS();
      }
    });

    document.addEventListener('mousemove', function (e) {
      if (_weaponWheelHeld && typeof HUD !== 'undefined' && HUD.updateWeaponWheelMouse) {
        HUD.updateWeaponWheelMouse(e.clientX, e.clientY);
      }
      if (document.pointerLockElement) {
        var stunScale = GameManager._flashbangStun > 0 ? 0.15 : 1;
        CameraSystem.handleMouseMove(e.movementX * stunScale, e.movementY * stunScale);
      }
    });

    document.addEventListener('wheel', function (e) {
      if (gameState === STATE.PLAYING) {
        if (e.deltaY > 0) Weapons.switchNext();
        else if (e.deltaY < 0) Weapons.switchPrev();
      } else {
        CameraSystem.handleWheel(e.deltaY);
      }
    });

    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    document.addEventListener('pointerlockchange', function () {
      if (!document.pointerLockElement && gameState === STATE.PLAYING) {
        // Ignore transient lock loss right after starting/resuming (slow PCs).
        if (performance.now() < _pointerLockGraceUntil) return;
        if (!isMobile) {
          // Unified menu: route to inventory-overlay (pause + inventory + shop in one).
          // Avoids the "4 different menus" complaint.
          gameState = STATE.PAUSED;
          var invOv = document.getElementById('inventory-overlay');
          if (invOv) {
            if (typeof showInventory === 'function') showInventory();
            invOv.style.display = 'flex';
          } else {
            showOverlay('pause');
          }
          _releaseMouseForUI();
          if (typeof updateMobileControlsVisibility === 'function') updateMobileControlsVisibility();
        }
      }
    });

    /* ── Touch look controls (right half of canvas) ──────────── */
    if (isMobile) {
      const lookZone = document.getElementById('mobile-look-zone') || _renderer.domElement;
      lookZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          // Always accept a new look touch (prevents stuck state if touchend was missed)
          touch.lookTouchId = t.identifier;
          touch.lookActive = true;
          touch._lookPrevX = t.clientX;
          touch._lookPrevY = t.clientY;
          touch.tapStartX = t.clientX;
          touch.tapStartY = t.clientY;
          touch.tapStartTime = performance.now();
          try { lookZone.classList.add('look-active'); } catch (_e) {}
        }
      }, { passive: false });
      lookZone.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touch.lookTouchId) {
            const dx = t.clientX - touch._lookPrevX;
            const dy = t.clientY - touch._lookPrevY;
            touch.lookX += dx;
            touch.lookY += dy;
            touch._lookPrevX = t.clientX;
            touch._lookPrevY = t.clientY;
          }
        }
      }, { passive: false });
      // Also listen on document for touchmove in case the finger drifts outside the look zone
      document.addEventListener('touchmove', function (e) {
        if (touch.lookTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touch.lookTouchId) {
            const dx = t.clientX - touch._lookPrevX;
            const dy = t.clientY - touch._lookPrevY;
            touch.lookX += dx;
            touch.lookY += dy;
            touch._lookPrevX = t.clientX;
            touch._lookPrevY = t.clientY;
          }
        }
      }, { passive: false });
      function _releaseLookTouch(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touch.lookTouchId) {
            // Tap-to-shoot: if touch was brief (< 250ms) and barely moved (< 12px)
            var tapDur = performance.now() - touch.tapStartTime;
            var tapDx = t.clientX - touch.tapStartX;
            var tapDy = t.clientY - touch.tapStartY;
            if (tapDur < 250 && Math.abs(tapDx) < 12 && Math.abs(tapDy) < 12) {
              touch.firing = true;
              mouseNewPress = true;
              setTimeout(function() { touch.firing = false; mouseNewPress = false; }, 120);
            }
            touch.lookTouchId = null;
            touch.lookActive = false;
            touch.lookX = 0;
            touch.lookY = 0;
            try { lookZone.classList.remove('look-active'); } catch (_e) {}
          }
        }
      }
      lookZone.addEventListener('touchend', _releaseLookTouch, { passive: true });
      lookZone.addEventListener('touchcancel', _releaseLookTouch, { passive: true });
      // Safety: if touch ends outside the look zone, still release it
      document.addEventListener('touchend', _releaseLookTouch, { passive: true });
      document.addEventListener('touchcancel', _releaseLookTouch, { passive: true });
    }
  }

  /* ── Build interactions ──────────────────────────────────────────── */
  function handleBuildClick() {
    if (Building.getSelectedTemplate()) {
      const ray = window.VoxelWorld.raycastBlock(_camera, 12);
      if (ray) {
        const p = ray.place;
        const tmpl = Building.getSelectedTemplate();
        if (!tmpl || !tmpl.cost) return;
        const cost = tmpl.cost;
        // Check and deduct resources via Economy (not a copy)
        if (!Economy.hasMultiple(cost)) {
          HUD.notifyPickup('NOT ENOUGH RESOURCES', '#FF4444');
          return;
        }
        if (Building.placeTemplate(p.x, p.y, p.z)) {
          Economy.spendMultiple(cost);
          SkillSystem.onBuild();
          RankSystem.onBuild();
          HUD.notifyPickup('STRUCTURE BUILT!', '#00FF88');
        }
      }
    } else {
      // Free-form block placement
      const ray = window.VoxelWorld.raycastBlock(_camera, 8);
      if (ray) {
        Building.placeBlock(ray.place.x, ray.place.y, ray.place.z);
      }
    }
  }

  function handleBuildRemove() {
    const ray = window.VoxelWorld.raycastBlock(_camera, 8);
    if (ray) {
      const blockType = Building.removeBlock(ray.hit.x, ray.hit.y, ray.hit.z);
      if (blockType) {
        // Convert removed block to resource
        const blockToResource = {
          [window.VoxelWorld.BLOCK.WOOD]:  'wood',
          [window.VoxelWorld.BLOCK.METAL]: 'metal',
          [window.VoxelWorld.BLOCK.STONE]: 'stone',
          [window.VoxelWorld.BLOCK.ELECTRONICS]: 'electronics',
        };
        const res = blockToResource[blockType];
        if (res) {
          Economy.add(res, 1);
          MissionSystem.onResourceGathered(res, 1);
        }
      }
    }
  }

  /* ── Minecraft-style block placement (right-click with shovel) ──── */
  function handleMinecraftPlace() {
    var ray = window.VoxelWorld.raycastBlock(_camera, 6);
    if (!ray) return;
    var p = ray.place;
    // Determine which material to place based on resources
    // Priority: wood > stone > brick > dirt > sand
    var B = window.VoxelWorld.BLOCK;
    var placeType = null;
    var resType = null;
    if (Economy.getResources().wood > 0) { placeType = B.WOOD; resType = 'wood'; }
    else if (Economy.getResources().stone > 0) { placeType = B.STONE; resType = 'stone'; }
    else if (Economy.getResources().metal > 0) { placeType = B.METAL; resType = 'metal'; }
    else {
      // Use build materials from mining
      if (player.buildMaterials.wood > 0) { placeType = B.WOOD; player.buildMaterials.wood--; }
      else if (player.buildMaterials.stone > 0) { placeType = B.STONE; player.buildMaterials.stone--; }
      else if (player.buildMaterials.brick > 0) { placeType = B.BRICK; player.buildMaterials.brick--; }
      else if (player.buildMaterials.dirt > 0) { placeType = B.DIRT; player.buildMaterials.dirt--; }
      else if (player.buildMaterials.sand > 0) { placeType = B.SAND; player.buildMaterials.sand--; }
      else if (player.buildMaterials.metal > 0) { placeType = B.METAL; player.buildMaterials.metal--; }
      if (placeType) {
        window.VoxelWorld.setBlock(p.x, p.y, p.z, placeType);
        HUD.notifyPickup('🧱 BLOCK PLACED', '#8B6914');
        if (HUD.addCombatLog) HUD.addCombatLog('Placed block', '#8B6914');
        return;
      }
      HUD.notifyPickup('No materials! Mine with shovel (LMB)', '#ff4444');
      return;
    }
    // Spend economy resource
    if (resType && Economy.spend(resType, 1)) {
      window.VoxelWorld.setBlock(p.x, p.y, p.z, placeType);
      HUD.notifyPickup('🧱 BLOCK PLACED (-1 ' + resType + ')', '#8B6914');
      if (HUD.addCombatLog) HUD.addCombatLog('Placed ' + resType + ' block', '#8B6914');
    } else {
      HUD.notifyPickup('No materials! Mine with shovel (LMB)', '#ff4444');
    }
  }

  /* ── Pointer lock helpers ────────────────────────────────────────── */
  // After (re)entering play we ask for pointer lock; a slow PC may take a beat
  // to actually grant it. Ignore spurious "lock lost" events during this grace
  // window so the pause/inventory menu doesn't auto-pop right when the game starts.
  var _pointerLockGraceUntil = 0;
  function requestPointerLock() {
    if (isMobile) return;   // Touch controls replace pointer lock on mobile
    _pointerLockGraceUntil = performance.now() + 1600;
    if (!_renderer || !_renderer.domElement) return;

    var canvas = _renderer.domElement;
    var ownerDoc = canvas.ownerDocument || document;

    // Pointer lock can fail when canvas is detached or not from the active root document.
    if (!canvas.isConnected || ownerDoc !== document || !document.contains(canvas)) return;
    if (ownerDoc.pointerLockElement === canvas) return;
    if (ownerDoc.visibilityState && ownerDoc.visibilityState !== 'visible') return;

    try {
      var req = canvas.requestPointerLock();
      if (req && typeof req.catch === 'function') {
        req.catch(function () { /* Prevent unhandled promise rejection noise */ });
      }
    } catch (_) {
      // Ignore hard failures; game remains playable without pointer lock.
    }
  }

  /* ── Overlay helpers ─────────────────────────────────────────────── */
  function _releaseMouseForUI() {
    // CRITICAL: Without this, pointer is locked to canvas and the user
    // CANNOT click menu items. Browser tells them "press ESC" — but ESC
    // closes the menu we just opened. Always release before showing UI.
    try {
      if (typeof document.exitPointerLock === 'function' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (_) { /* non-fatal */ }
    try { document.body.style.cursor = 'auto'; } catch (_) {}
  }

  function showOverlay(name) {
    document.querySelectorAll('.overlay').forEach(function (el) { el.style.display = 'none'; });
    // Unified pause: redirect legacy 'pause' to inventory-overlay
    if (name === 'pause') {
      var inv = document.getElementById('inventory-overlay');
      if (inv) {
        if (typeof showInventory === 'function') showInventory();
        inv.style.display = 'flex';
        _releaseMouseForUI();
        return;
      }
    }
    var el = document.getElementById('overlay-' + name);
    if (el) el.style.display = 'flex';
    _releaseMouseForUI();
  }

  function hideOverlays() {
    document.querySelectorAll('.overlay').forEach(function (el) { el.style.display = 'none'; });
    // Release any stuck mobile look touch when overlays change
    touch.lookTouchId = null;
    touch.lookActive = false;
    touch.lookX = 0;
    touch.lookY = 0;
    try { var _lz = document.getElementById('mobile-look-zone'); if (_lz) _lz.classList.remove('look-active'); } catch (_e) {}
  }



  function getNearestFriendlyDrone(maxDist) {
    if (typeof DroneSystem === 'undefined' || !DroneSystem.getAll) return null;
    var drones = DroneSystem.getAll();
    if (!drones || drones.length === 0) return null;

    var range = (typeof maxDist === 'number' ? maxDist : 120);
    var maxDistSq = range * range;
    var best = null;
    var bestDistSq = Infinity;
    for (var i = 0; i < drones.length; i++) {
      var d = drones[i];
      // Friendly drones have faction 'ukrainian', enemy have 'russian'
      if (!d || !d.alive || !d.active || d.faction === 'russian') continue;
      var dx = d.position.x - player.position.x;
      var dz = d.position.z - player.position.z;
      var dsq = dx * dx + dz * dz;
      if (dsq <= maxDistSq && dsq < bestDistSq) {
        best = d;
        bestDistSq = dsq;
      }
    }
    return best;
  }

  function launchAndPossessDrone(droneType) {
    if (typeof DroneSystem === 'undefined' || !DroneSystem.spawn || !DroneSystem.possess) return null;
    var spawnH = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
      ? VoxelWorld.getTerrainHeight(player.position.x, player.position.z)
      : 0;
    var type = droneType || 'recon';
    var drone = DroneSystem.spawn(player.position.x, spawnH + 15, player.position.z + 5, type);
    if (!drone) return null;
    var ok = DroneSystem.possess(drone.id);
    if (!ok) return null;
    showDroneControlsHUD(drone.type || type);
    return drone;
  }

  // Auto-possess a drone when a mission requires it (recon/drone_strike types).
  // Called after generateMission/generateRandom — 2s delay so toast appears first.
  function _autoReconDroneForMission(mission) {
    if (!mission) return;
    if (mission.type !== 'recon' && mission.type !== 'drone_strike') return;
    setTimeout(function () {
      try {
        if (gameState !== STATE.PLAYING) return;
        if (typeof DroneSystem === 'undefined' || DroneSystem.isPossessing()) return;
        var _dmType = (mission.type === 'drone_strike') ? 'bomb' : 'fpv_attack';
        var dr = launchAndPossessDrone(_dmType);
        if (dr && HUD && HUD.showToast) {
          var _dmHint = (mission.type === 'drone_strike')
            ? '💣 DRONE STRIKE — Fly over targets and [LMB] to drop bomb. [F] to exit.'
            : '🚁 DRONE MISSION — Fly to all marked recon points. Press [F] to exit drone when done.';
          HUD.showToast(_dmHint, 5500, '#00ccff');
        }
      } catch (_e) {}
    }, 2000);
  }

  function selectAndLaunchDrone(droneType) {
    // Export to window for global access (always)
    if (typeof window !== 'undefined') window.selectAndLaunchDrone = selectAndLaunchDrone;
    // Ensure global export on script load (not just on first call)
    if (typeof window !== 'undefined') {
      window.showDroneSelection = showDroneSelection;
      window.selectAndLaunchDrone = selectAndLaunchDrone;
    }
    var overlay = document.getElementById('overlay-drone-select');
    if (overlay) overlay.style.display = 'none';

    gameState = STATE.PLAYING;
    requestPointerLock();

    var drone = launchAndPossessDrone(droneType);
    if (!drone) return;

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      var names = { fpv_attack: 'FPV ATTACK', surveillance: 'SURVEILLANCE', bomb: 'BOMBER' };
      HUD.notifyPickup('\uD83D\uDEE9 ' + (names[droneType] || 'DRONE') + ' LAUNCHED! [T] VIEW [F] EXIT', '#00ccff');
    }

    // Start wave after a short delay
    if (_droneSelectionCallback) {
      setTimeout(function () {
        _droneSelectionCallback();
        _droneSelectionCallback = null;
      }, 1500);
    }
  }

  function showDroneControlsHUD(droneType) {
    var hud = document.getElementById('drone-controls-hud');
    if (!hud) return;
    hud.style.display = 'block';
    _droneControlsVisible = true;

    // Toggle key vs touch hint rows based on device
    var keyHints = document.getElementById('drone-key-hints');
    var touchHints = document.getElementById('drone-touch-hints');
    if (keyHints)   keyHints.style.display   = isMobile ? 'none' : 'flex';
    if (touchHints) touchHints.style.display = isMobile ? 'block' : 'none';

    var typeLabel = document.getElementById('drone-type-label');
    var actionText = document.getElementById('drone-action-text');
    var actionHint = document.getElementById('drone-action-hint');
    var payloadDisp = document.getElementById('drone-payload-display');
    var modeEl = document.getElementById('drone-view-mode');

    var names = { fpv_attack: 'FPV ATTACK', surveillance: 'SURVEILLANCE', bomb: 'BOMBER', recon: 'RECON' };
    if (typeLabel) typeLabel.textContent = '\u2014 ' + (names[droneType] || droneType.toUpperCase());
    if (modeEl) modeEl.textContent = 'EYE';

    if (droneType === 'fpv_attack') {
      if (actionText) actionText.textContent = 'Kamikaze Dive';
      if (actionHint) actionHint.style.display = '';
      if (payloadDisp) payloadDisp.style.display = 'none';
    } else if (droneType === 'bomb') {
      if (actionText) actionText.textContent = 'Drop Bomb';
      if (actionHint) actionHint.style.display = '';
      if (payloadDisp) payloadDisp.style.display = '';
    } else {
      if (actionHint) actionHint.style.display = 'none';
      if (payloadDisp) payloadDisp.style.display = 'none';
    }
  }

  function hideDroneControlsHUD() {
    var hud = document.getElementById('drone-controls-hud');
    if (hud) hud.style.display = 'none';
    _droneControlsVisible = false;
  }

  function toggleDroneRemoteView() {
    if (!DroneSystem.isPossessing() || typeof CameraSystem === 'undefined' || !CameraSystem.toggleDroneViewMode) return null;
    var droneViewMode = CameraSystem.toggleDroneViewMode();
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(droneViewMode === 'chase' ? 'DRONE CHASE VIEW' : 'DRONE EYE VIEW', '#00ccff');
    }
    return droneViewMode;
  }

  function releaseDroneRemote() {
    if (!DroneSystem.isPossessing()) return false;
    DroneSystem.release();
    hideDroneControlsHUD();
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('DRONE REMOTE DISCONNECTED', '#88ccff');
    }
    return true;
  }

  function connectOrLaunchDrone(preferredType) {
    var nearestDrone = getNearestFriendlyDrone(100);
    if (nearestDrone) {
      DroneSystem.possess(nearestDrone.id);
      showDroneControlsHUD(nearestDrone.type);
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('REMOTE LINKED: ' + (nearestDrone.type || 'DRONE').toUpperCase() + ' [T] VIEW [F] EXIT', '#00ccff');
      }
      return nearestDrone;
    }

    var launchedDrone = launchAndPossessDrone(preferredType || 'recon');
    if (launchedDrone && typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('RECON DRONE LAUNCHED [T] VIEW [F] EXIT', '#00ccff');
    }
    return launchedDrone;
  }

  function updateDroneControlsHUD() {
    if (!_droneControlsVisible) return;
    if (!DroneSystem.isPossessing()) {
      hideDroneControlsHUD();
      return;
    }
    var drone = DroneSystem.getPossessed();
    if (!drone) { hideDroneControlsHUD(); return; }

    var batteryPct = Math.round((drone.battery / drone.maxBattery) * 100);
    var hpPct = Math.round((drone.health / (DroneSystem.DRONE_STATS[drone.type] ? DroneSystem.DRONE_STATS[drone.type].health : 100)) * 100);

    var battEl = document.getElementById('drone-battery-display');
    var hpEl = document.getElementById('drone-hp-display');
    var payloadEl = document.getElementById('drone-payload-display');
    var nestHint = document.getElementById('drone-nest-hint');
    var viewEl = document.getElementById('drone-view-mode');
    var altEl = document.getElementById('drone-altitude-display');
    var speedEl = document.getElementById('drone-speed-display');
    var distEl = document.getElementById('drone-distance-display');
    var linkEl = document.getElementById('drone-link-quality');
    var statusEl = document.getElementById('drone-remote-status');

    if (battEl) battEl.textContent = batteryPct;
    if (hpEl) hpEl.textContent = hpPct;
    if (viewEl && typeof CameraSystem !== 'undefined' && CameraSystem.getDroneViewMode) {
      viewEl.textContent = (CameraSystem.getDroneViewMode() || 'eye').toUpperCase();
    }
    if (altEl) {
      var groundH = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
        ? VoxelWorld.getTerrainHeight(drone.position.x, drone.position.z)
        : 0;
      altEl.textContent = Math.max(0, Math.round(drone.position.y - groundH));
    }
    if (speedEl && drone.velocity) {
      speedEl.textContent = Math.round(Math.sqrt(
        drone.velocity.x * drone.velocity.x +
        drone.velocity.y * drone.velocity.y +
        drone.velocity.z * drone.velocity.z
      ));
    }
    if (distEl) {
      var pdx = drone.position.x - player.position.x;
      var pdy = drone.position.y - player.position.y;
      var pdz = drone.position.z - player.position.z;
      var linkDist = Math.round(Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz));
      distEl.textContent = linkDist;

      var linkRange = Math.max(30, drone.range || 80);
      var qualityPct = Math.max(0, Math.round(100 - (linkDist / linkRange) * 100));
      if (linkEl) {
        if (qualityPct >= 70) {
          linkEl.textContent = 'GOOD';
          linkEl.style.color = '#66ddff';
        } else if (qualityPct >= 35) {
          linkEl.textContent = 'FAIR';
          linkEl.style.color = '#ffd166';
        } else {
          linkEl.textContent = 'WEAK';
          linkEl.style.color = '#ff8866';
        }
      }

      if (statusEl) {
        if (batteryPct <= 15) {
          statusEl.textContent = 'LOW BATTERY';
          statusEl.style.color = '#ff6666';
        } else if (qualityPct < 35) {
          statusEl.textContent = 'LINK WEAK';
          statusEl.style.color = '#ffbb66';
        } else {
          statusEl.textContent = 'REMOTE STABLE';
          statusEl.style.color = '#66ddff';
        }
      }
    }
    if (payloadEl) {
      if (drone.type === 'bomb') {
        payloadEl.style.display = '';
        payloadEl.textContent = drone.hasPayload ? '\uD83D\uDCA3 PAYLOAD READY' : '\uD83D\uDCA3 PAYLOAD DROPPED';
        payloadEl.style.color = drone.hasPayload ? '#ffaa00' : '#666';
      } else {
        payloadEl.style.display = 'none';
      }
    }

    // Nest proximity hint
    if (nestHint && typeof DroneSystem.getNearestNest === 'function') {
      var ni = DroneSystem.getNearestNest(drone.position.x, drone.position.z);
      if (ni >= 0) {
        var nests = DroneSystem.getNests();
        var nest = nests[ni];
        var ndx = nest.x - drone.position.x;
        var ndz = nest.z - drone.position.z;
        var nestDist = Math.sqrt(ndx * ndx + ndz * ndz);
        if (nestDist < 25) {
          nestHint.style.display = '';
          nestHint.textContent = '\u25B6 Enemy nest ' + Math.round(nestDist) + 'm! Destroy it!';
        } else {
          nestHint.style.display = 'none';
        }
      } else {
        nestHint.style.display = 'none';
      }
    }
  }

  /* ── Remove Enemies-module TANK clone artifact when entering a VehicleSystem vehicle ── */
  function _removeEnemyTankClone(vehicle) {
    if (!vehicle || !vehicle.mesh) return;
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var _all = Enemies.getAll();
    for (var _rci = 0; _rci < _all.length; _rci++) {
      var _rce = _all[_rci];
      if (!_rce || !_rce.alive || !_rce.typeCfg) continue;
      if (_rce.typeCfg.name !== 'TANK' && _rce.typeCfg.name !== 'BTR') continue;
      if (!_rce.mesh) continue;
      if (_rce.mesh.position.distanceTo(vehicle.mesh.position) < 14) {
        _rce.alive = false;
        _rce.mesh.visible = false;
        if (scene) scene.remove(_rce.mesh);
      }
    }
  }

  /* ── Tank HUD Management ─────────────────────────────────────────── */
  var _tankHUDVisible = false;

  function showTankHUD() {
    var hud = document.getElementById('tank-hud');
    if (!hud) return;
    hud.style.display = 'block';
    _tankHUDVisible = true;
    var ctrl = hud.querySelector('.tank-hud-controls');
    if (ctrl) {
      if (isMobile) {
        ctrl.innerHTML =
          '<span>🕹 LEFT · Drive</span>' +
          '<span>🎯 RIGHT · Aim Turret</span>' +
          '<span class="tank-hud-cannon">🔴 Fire btn · Cannon</span>' +
          '<span class="tank-hud-mg">🟡 MG btn · Machine Gun</span>' +
          '<span>👁 View btn</span>' +
          '<span>🚫 Exit btn</span>';
      } else {
        ctrl.innerHTML =
          '<span><kbd>WASD</kbd> Drive</span>' +
          '<span><kbd>MOUSE</kbd> Aim Turret</span>' +
          '<span class="tank-hud-cannon"><kbd>LMB</kbd> Cannon</span>' +
          '<span class="tank-hud-mg"><kbd>RMB</kbd> Machine Gun</span>' +
          '<span><kbd>T</kbd> Toggle View</span>' +
          '<span><kbd>G</kbd> Exit</span>';
      }
    }
  }

  function hideTankHUD() {
    var hud = document.getElementById('tank-hud');
    if (hud) hud.style.display = 'none';
    var overlay = document.getElementById('tank-interior-overlay');
    if (overlay) overlay.style.display = 'none';
    _tankHUDVisible = false;
  }

  function updateTankHUD() {
    var v = VehicleSystem.getOccupied();
    if (!v || !v.isTank) {
      if (_tankHUDVisible) hideTankHUD();
      return;
    }
    if (!_tankHUDVisible) showTankHUD();

    // Update ammo
    var ammo = VehicleSystem.getTankAmmo();
    var cannonEl = document.getElementById('tank-cannon-ammo');
    var cannonMax = document.getElementById('tank-cannon-max');
    var mgEl = document.getElementById('tank-mg-ammo');
    var hpEl = document.getElementById('tank-hp-pct');
    var speedEl = document.getElementById('tank-speed-kmh');
    var viewEl = document.getElementById('tank-view-mode');

    if (cannonEl) cannonEl.textContent = ammo.cannon;
    if (cannonMax) cannonMax.textContent = ammo.maxCannon;
    if (mgEl) mgEl.textContent = ammo.mg;
    if (hpEl) hpEl.textContent = Math.round((v.health / v.maxHealth) * 100);
    if (speedEl && v.velocity) {
      var hudSpeed = Math.sqrt(v.velocity.x * v.velocity.x + v.velocity.z * v.velocity.z);
      speedEl.textContent = Math.round(hudSpeed * 12);
    }
    if (viewEl) viewEl.textContent = v.viewMode === 'first' ? 'PERISCOPE' : 'THIRD PERSON';

    // Reload bar
    var reloadBar = document.getElementById('tank-reload-bar');
    var reloadFill = document.getElementById('tank-reload-fill');
    var reloadText = document.getElementById('tank-reload-text');
    var reloadFlash = document.getElementById('tank-reload-flash');
    var readyFlash = document.getElementById('tank-ready-flash');
    if (v.fireCooldown > 0) {
      v._reloadFxArmed = true;
      var prog = VehicleSystem.getTankReloadProgress();
      if (reloadBar) reloadBar.style.display = 'block';
      if (reloadFill) reloadFill.style.width = (prog * 100) + '%';
      if (reloadText) reloadText.style.display = 'block';
      if (reloadFlash) {
        reloadFlash.classList.add('active');
        reloadFlash.style.opacity = (0.12 + (1 - prog) * 0.16).toFixed(3);
      }
    } else {
      if (reloadBar) reloadBar.style.display = 'none';
      if (reloadText) reloadText.style.display = 'none';
      if (reloadFlash) {
        reloadFlash.classList.remove('active');
        reloadFlash.style.opacity = '0';
      }
      if (v._reloadFxArmed) {
        v._reloadFxArmed = false;
        if (readyFlash) {
          readyFlash.classList.remove('active');
          void readyFlash.offsetWidth;
          readyFlash.classList.add('active');
        }
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playReadyChime) {
          AudioSystem.playReadyChime();
        }
      }
    }

    // Speed vignette — darkens edges when moving fast
    var speedVign = document.getElementById('tank-speed-vignette');
    if (speedVign && v.velocity) {
      var spd = Math.sqrt(v.velocity.x * v.velocity.x + v.velocity.z * v.velocity.z);
      var t = Math.min(1, Math.max(0, (spd - 2) / (v.speed - 2)));
      speedVign.style.opacity = (t * 0.7).toFixed(3);
    }

    // Interior overlay (periscope view) — show only in first person
    var overlay = document.getElementById('tank-interior-overlay');
    if (overlay) {
      if (v.velocity) {
        var yaw = v.rotation ? v.rotation.y : 0;
        var lateral = Math.cos(yaw) * v.velocity.x - Math.sin(yaw) * v.velocity.z;
        var reticleX = Math.max(-6, Math.min(6, -lateral * 1.4 + (v._turnRate || 0) * 1.6));
        var reticleY = Math.max(-4, Math.min(4, v.hullPitch ? -v.hullPitch * 90 : 0));
        overlay.style.setProperty('--tank-reticle-x', reticleX.toFixed(2) + 'px');
        overlay.style.setProperty('--tank-reticle-y', reticleY.toFixed(2) + 'px');
      }
      overlay.style.display = v.viewMode === 'first' ? 'block' : 'none';
    }
  }

  /* ── Start Game ──────────────────────────────────────────────────── */
  function startGame() {
    // CRITICAL: hide overlays immediately so the user doesn't stare at a frozen
    // death screen while we regenerate the world (which can take 1-3s).
    hideOverlays();
    if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
    // Reset mobile touch look state to prevent stuck touches across game sessions
    touch.lookTouchId = null;
    touch.lookActive = false;
    touch.lookX = 0;
    touch.lookY = 0;
    try { var _lz = document.getElementById('mobile-look-zone'); if (_lz) _lz.classList.remove('look-active'); } catch (_e) {}
    try {
      if (typeof window !== 'undefined') {
        console.log('[QA] startGame called, __QA_MODE:', window.__QA_MODE);
      }
    if (!_scene || !_camera) {
      console.warn('[startGame] Aborting: scene/camera not initialized (renderer init failed earlier).');
      return;
    }
    if (window.AudioSystem && typeof window.AudioSystem.resume === 'function') {
      window.AudioSystem.resume();
    }
    // Start battle music
    if (window.AudioSystem.playMusic) window.AudioSystem.playMusic('battle');
    if (window.AudioSystem.resetFirstBlood) window.AudioSystem.resetFirstBlood();
    gameState = STATE.PLAYING;
    // Reset input tips so fresh session shows tutorials again
    try { if (typeof Feedback !== 'undefined' && Feedback.resetTips) Feedback.resetTips(); } catch (_e) {}
    player.hp = player.maxHp;
    player.score = 0;
    player.kills = 0;
    if (typeof Perks !== 'undefined') Perks.reset();
    if (typeof KillStreak !== 'undefined') KillStreak.reset();
    if (window.BallisticShield) BallisticShield.reset();
    if (window.TimeWarp) TimeWarp.reset();
    if (window.ScavengeSystem) ScavengeSystem.reset();
    if (window.TripwireIED) TripwireIED.reset();
    if (window.LootDrops) LootDrops.reset();
    if (window.WaveEvents) WaveEvents.reset();
    if (window.MortarEmplacement && MortarEmplacement.reset) MortarEmplacement.reset();
    if (window.BountySystem) BountySystem.reset();
    if (window.Destructibles) Destructibles.reset();
    if (window.VehicleEnemies) VehicleEnemies.reset();
    if (window.StaminaSystem) StaminaSystem.reset();
    if (window.Grapple) Grapple.reset();
    if (window.ZiplineGrapple) ZiplineGrapple.reset();
    if (window.Wingsuit) Wingsuit.reset();
    if (window.CrouchSystem) CrouchSystem.reset();
    if (window.SpecialGrenades) SpecialGrenades.reset();
    if (window.BloodEffects) BloodEffects.reset();
    if (window.MeleeKnife) MeleeKnife.reset();
    if (window.ClaymoreMines) ClaymoreMines.reset();
    if (window.RadioSupport) RadioSupport.reset();
    if (typeof ArmorSystem !== 'undefined') ArmorSystem.reset();
    if (window.GasMask) GasMask.reset();
    if (typeof AllySoldiers !== 'undefined') AllySoldiers.clear();
    window._killstreakTimeScale = 1.0;
    window._killstreakHealthRegen = 0;
    window._killstreakAmmoRefill = 0;
    currentWave = 0;
    _scoreChain = 1;
    _chainTimer = 0;
    _chainKills = 0;
    currentStage = 0;
    // Stage jump: QA harness override or player map selection from start menu
    if (typeof window !== 'undefined') {
      if (window.__QA_MODE && typeof window.__QA_START_STAGE === 'number') {
        currentStage = Math.max(0, Math.min(STAGES.length - 1, window.__QA_START_STAGE));
      } else if (typeof window.__chosenStartStage === 'number') {
        currentStage = Math.max(0, Math.min(STAGES.length - 1, window.__chosenStartStage));
      }
    }
    player.velocity.set(0, 0, 0);
    player.armor = 0;
    player.lastDamageTime = 10; // Start high so health regen kicks in immediately at game start
    player.totalShots = 0;
    player.totalHits = 0;
    player.totalHeadshots = 0;
    player.totalDamageTaken = 0;
    player.bestStreak = 0;
    player.waveKills = 0;
    player.waveShots = 0;
    player.waveHits = 0;
    player.waveHeadshots = 0;
    player.waveDamageTaken = 0;
    player.waveMeleeKills = 0;
    player.waveFirstKillTime = 999;
    player.waveMaxExplosiveKill = 0;
    player.distanceWalked = 0;
    player._lastPos = null;
    player.playStartTime = performance.now();
    player.stageStartTime = performance.now();
    _levelStartTime = Date.now();  // record when this level started
    player.stageShots = 0;
    player.stageHits = 0;
    player.stageHeadshots = 0;
    player.buildMaterials = { wood: 0, stone: 0, metal: 0, dirt: 0, sand: 0, brick: 0 };
    // Clear desaturation filter
    if (_renderer && _renderer.domElement) _renderer.domElement.style.filter = '';
    // Clear suppression on restart
    _suppressionLevel = 0;
    if (_suppressionCanvas) _suppressionCanvas.style.filter = '';
    // Clear shop countdown
    if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
    // Clear loot particles (shared _lootGeo — only dispose cloned materials)
    for (var li = _lootParticles.length - 1; li >= 0; li--) {
      if (_scene) _scene.remove(_lootParticles[li]);
      if (_lootParticles[li].material) _lootParticles[li].material.dispose();
    }
    _lootParticles.length = 0;

    // Reset skills on new game (skills are designed to accrue per-run, not persist)
    if (typeof SkillSystem !== 'undefined' && SkillSystem.init) SkillSystem.init();
    if (typeof Medals !== 'undefined') Medals.reset();

    // Preserve scalar god-mode effects across a new run.
    if (player.godMode) {
      player.maxHp = GOD_MODE_HP;
      player.hp = GOD_MODE_HP;
      player.stealth = true;
    }

    // ═══ NEW: Apply challenge mode modifiers ═══
    if (typeof Progression !== 'undefined') {
      var chalMods = Progression.getChallengeModifiers();
      if (chalMods.hpMult) {
        player.maxHp = Math.round(player.maxHp * chalMods.hpMult);
        player.hp = player.maxHp;
      }
    }
    // Reset new feature systems on game start
    if (typeof CombatExtras !== 'undefined') CombatExtras.reset();
    if (typeof Traversal !== 'undefined') Traversal.reset();
    if (typeof WorldFeatures !== 'undefined') WorldFeatures.clear();
    if (typeof Perks !== 'undefined') Perks.reset();
    if (typeof MissionTypes !== 'undefined') MissionTypes.clear();
    if (typeof Feedback !== 'undefined') Feedback.clear();
    if (typeof Marketplace !== 'undefined') {
      if (typeof ApiClient === 'undefined') {
        Marketplace.setOKC(0);
      } else if (Marketplace.initBackendSync) {
        Marketplace.initBackendSync().then(function (ok) {
          // Keep local balance intact on transient backend failures.
          if (ok && typeof HUD !== 'undefined' && HUD.updateOKC) {
            HUD.updateOKC(Marketplace.getOKC());
          }
        }).catch(function () {
          /* no-op: preserve local balance fallback */
        });
      } else {
        Marketplace.setOKC(0);
      }
    }
    if (typeof Progression !== 'undefined') {
      Progression.refreshDailies();
    }

    // Apply the starting stage (normally 0; the QA stage-jump hook may have
    // overridden currentStage above).
    // Show level briefing before generating the level, if available.
    var _proceedToLevel = function() {
      applyStage(currentStage);

    var spawnH = window.VoxelWorld.getTerrainHeight(0, 0);
    player.position.set(0, spawnH + player.height, 0);

    Weapons.reset();
    if (player.godMode) {
      for (var gi = 0; gi < Weapons.getWeaponCount(); gi++) {
        Weapons.unlockWeapon(gi);
      }
      Weapons.refillAllAmmo();
    }
    Enemies.clear();
    Pickups.clear();
    VehicleSystem.clear();
    DroneSystem.clear();
    if (typeof Bradley !== 'undefined' && Bradley.clear) Bradley.clear();
    if (typeof EnemyArtillery !== 'undefined' && EnemyArtillery.clear) EnemyArtillery.clear();
    if (typeof NPCSystem !== 'undefined' && NPCSystem.clear) NPCSystem.clear();
    if (typeof Building !== 'undefined' && Building.clear) Building.clear();
    if (typeof Tracers !== 'undefined') Tracers.clear();
    if (typeof StageVFX !== 'undefined' && StageVFX.clear) StageVFX.clear();
    if (typeof Flags !== 'undefined' && Flags.clear) Flags.clear();
    if (typeof Environment !== 'undefined' && Environment.clear) Environment.clear();
    if (typeof WeatherSystem !== 'undefined' && WeatherSystem.clear) WeatherSystem.clear();
    if (typeof WeatherSystem !== 'undefined' && WeatherSystem.init) WeatherSystem.init(_scene, _camera);

    // Respawn organized assault groups for the real gameplay start path
    // (BRIGADE role only — Lone Wolf fights solo).
    if (typeof NPCSystem !== 'undefined' && NPCSystem.setPlayerFormation) NPCSystem.setPlayerFormation(window.__chosenFormation || 'wedge');
    if (player.role === 'brigade' && typeof NPCSystem !== 'undefined' && NPCSystem.spawnAssaultGroups) NPCSystem.spawnAssaultGroups();

    // Respawn vehicle fleet on roads for first stage
    var _rwps = (window.VoxelWorld.getRoadWaypoints ? window.VoxelWorld.getRoadWaypoints() : []);
    var _sp0 = _rwps.length > 2 ? _rwps[2] : new THREE.Vector3(8, 0, 20);
    var _sp1 = _rwps.length > 6 ? _rwps[6] : new THREE.Vector3(12, 0, 20);
    var _sp2 = _rwps.length > 10 ? _rwps[10] : new THREE.Vector3(-8, 0, 20);
    var sgVh = window.VoxelWorld.getTerrainHeight(_sp0.x, _sp0.z);
    VehicleSystem.spawn(_sp0.x, sgVh, _sp0.z, 'transport');
    var sgVh2 = window.VoxelWorld.getTerrainHeight(_sp1.x, _sp1.z);
    VehicleSystem.spawn(_sp1.x, sgVh2, _sp1.z, 'combat');
    var sgVh3 = window.VoxelWorld.getTerrainHeight(_sp2.x, _sp2.z);
    VehicleSystem.spawn(_sp2.x, sgVh3, _sp2.z, 'turret_rover');
    var _sp3 = _rwps.length > 14 ? _rwps[14] : new THREE.Vector3(0, 0, 15);
    var sgVh4 = window.VoxelWorld.getTerrainHeight(_sp3.x, _sp3.z);
    VehicleSystem.spawn(_sp3.x, sgVh4, _sp3.z, 'tank');

    // Respawn drones
    const sgDh1 = window.VoxelWorld.getTerrainHeight(5, 5) + 8;
    DroneSystem.spawn(5, sgDh1, 5, 'recon');
    const sgDh2 = window.VoxelWorld.getTerrainHeight(-5, 5) + 8;
    DroneSystem.spawn(-5, sgDh2, 5, 'fpv_attack');
    const sgDh3 = window.VoxelWorld.getTerrainHeight(0, -10) + 10;
    DroneSystem.spawn(0, sgDh3, -10, 'bomb');

    hideOverlays();
    HUD.show();
    HUD.setHealth(player.hp, player.maxHp);
    HUD.setScore(0);
    HUD.setWave(0);
    HUD.setKills(0);
    HUD.setStage(STAGES[currentStage].id, STAGES[currentStage].name);
    HUD.setWeapon(Weapons.getCurrentName(), Weapons.getCurrentIdx());
    if (Weapons.refreshHud) Weapons.refreshHud();
    if (HUD.setHandGrenades) HUD.setHandGrenades(player.godMode ? Infinity : (player.grenades || 0));

    // Delay pointer lock slightly so the button click doesn't interfere
    setTimeout(function () {
      requestPointerLock();
    }, 100);

    // Announce the starting stage then show drone selection
    HUD.announceStage(STAGES[currentStage].id, STAGES[currentStage].name, STAGES[currentStage].description, STAGES[currentStage].objective);
    if (window.AudioSystem.stopAmbientLoop) window.AudioSystem.stopAmbientLoop();
    if (_waveStartTimer) clearTimeout(_waveStartTimer);
    _waveStartTimer = setTimeout(function () {
      // Start the wave ON FOOT. Drones are an optional tool the player can
      // deploy mid-fight (Q/F) — the game no longer forces a drone-pilot view
      // at stage start (that read as "starting in drone perspective").
      beginWave(1);
      // First-run onboarding (core controls + goal). Shows once ever.
      try { if (typeof Feedback !== 'undefined' && Feedback.startOnboarding) Feedback.startOnboarding(); } catch (_e) {}
    }, 3200);

    // Generate an initial mission. Stage-specific signature missions take priority.
    // droneOnly stages (stage 18 Refinery) handle missions entirely via RefineryStrike.
    if (!(STAGES[currentStage] && STAGES[currentStage].droneOnly)) {
      if (STAGES[currentStage] && STAGES[currentStage].capitalDefense) {
        MissionSystem.generateMission('kyiv_defense');
      } else if (STAGES[currentStage] && STAGES[currentStage].id === 1) {
        MissionSystem.generateMission('airborne_assault');
      } else {
        var _initMission = MissionSystem.generateRandom();
        _autoReconDroneForMission(_initMission);
      }
    }
    }; // end _proceedToLevel
    var _stageName = STAGES[currentStage] ? STAGES[currentStage].name : '';
    if (window.LevelBriefing && _stageName) {
      LevelBriefing.showBriefing(_stageName, _proceedToLevel);
    } else {
      _proceedToLevel();
    }
    } catch (err) {
      console.error('Failed to initialize game:', err);
    }
  }

  function hasSave() {
    try {
      return !!localStorage.getItem('ok_save');
    } catch (_e) {
      return false;
    }
  }

  function loadGame() {
    try {
      var raw = localStorage.getItem('ok_save');
      if (!raw) return false;
      var save = JSON.parse(raw);
      if (!save || typeof save !== 'object') return false;

      if (typeof save.wave === 'number' && isFinite(save.wave)) {
        currentWave = Math.max(0, Math.floor(save.wave));
      }
      if (typeof save.stage === 'number' && isFinite(save.stage)) {
        // save.stage is stored 1-based (highest stage reached), convert to 0-based index
        currentStage = Math.max(0, Math.min(STAGES.length - 1, Math.floor(save.stage) - 1));
      }
      if (typeof save.score === 'number' && isFinite(save.score)) {
        player.score = Math.max(0, Math.floor(save.score));
      }
      if (typeof save.kills === 'number' && isFinite(save.kills)) {
        player.kills = Math.max(0, Math.floor(save.kills));
      }
      if (typeof save.hp === 'number' && isFinite(save.hp)) {
        player.hp = Math.max(1, Math.min(player.maxHp, save.hp));
      }
      return true;
    } catch (_e) {
      return false;
    }
  }

  function saveGame() {
    try {
      var save = {
        wave: currentWave,
        stage: currentStage + 1, // store 1-based for human readability
        score: player.score,
        kills: player.kills,
        hp: player.hp,
        timestamp: Date.now(),
      };
      localStorage.setItem('ok_save', JSON.stringify(save));
    } catch (_e) {
      // noop (private mode, quota exceeded, etc.)
    }
  }

  function notifyExplosiveKills(n) {
    if (player && n > 0) player.waveMaxExplosiveKill = Math.max(player.waveMaxExplosiveKill || 0, n);
  }

  function notifyNPCDeath(npc) {
    // Friendly fire casualty — show feedback and track morale
    if (HUD.notifyPickup) {
      HUD.notifyPickup('💀 FRIENDLY NPC KILLED: ' + (npc.rank || 'soldier').toUpperCase(), '#ff4444');
    }
    if (typeof Progression !== 'undefined' && Progression.trackStat) {
      Progression.trackStat('friendlyDeaths', 1);
    }
  }

  function deleteSave() {
    try {
      localStorage.removeItem('ok_save');
    } catch (_e) {
      // noop
    }
  }

  function continueGame() {
    startGame();
    // Cancel the delayed beginWave(1) that startGame() schedules so it doesn't
    // double-fire when nextStage() calls beginWave(1) immediately below.
    if (_waveStartTimer) { clearTimeout(_waveStartTimer); _waveStartTimer = null; }
    loadGame(); // restores currentStage (completed stage) + currentWave + player stats
    // nextStage increments currentStage to the NEXT stage and calls beginWave(1)
    nextStage();
  }

  /* ── Stage Management ───────────────────────────────────────────── */
  function applyStage(stageIndex) {
    const stageDef = STAGES[stageIndex];
    if (!_scene) {
      console.warn('[applyStage] No scene (renderer init failed); skipping visual update for stage', stageIndex);
      return;
    }

    // Generate level terrain and features
    if (typeof Mines !== 'undefined') Mines.clear();
    if (window.TimeWarp) TimeWarp.clear();
    if (window.WaveEvents) WaveEvents.clear();
    if (window.LootDrops) LootDrops.clear();
    if (window.BountySystem) BountySystem.clear();
    if (window.Destructibles) Destructibles.clear();
    if (window.VehicleEnemies) VehicleEnemies.clear();
    if (window.Grapple) Grapple.clear();
    if (window.SpecialGrenades) SpecialGrenades.clear();
    if (window.BloodEffects) BloodEffects.clear();
    if (window.DamageNumbers) DamageNumbers.clear();
    if (window.ClaymoreMines) ClaymoreMines.clear();
    if (window.TripwireIED) TripwireIED.clear();
    if (window.RadioSupport) RadioSupport.clear();
    if (window.CompanionRadio && CompanionRadio.clear) CompanionRadio.clear();
    if (typeof ArmorSystem !== 'undefined') ArmorSystem.clear();
    if (window.GasMask) GasMask.clear();
    if (window.MeleeKnife) MeleeKnife.clear();
    if (window.WeatherEffects) WeatherEffects.clear();
    if (window.IntelPickups) IntelPickups.clear(_scene);
    if (window.ScavengeSystem) ScavengeSystem.clear();
    if (window.DogTags) DogTags.clear();
    if (window.SurrenderSystem) SurrenderSystem.clear();
    if (window.SuppressionSystem) SuppressionSystem.reset();
    window.VoxelWorld.generateLevel(stageIndex);

    // Place landmines on high-attrition stages (Avdiivka=2, Bakhmut=3, Vuhledar=16, Donbas=10)
    if (stageDef.id === 2 || stageDef.id === 3 || stageDef.id === 10 || stageDef.id === 16) {
      var _minePositions = [[-15,0,-20],[15,0,-20],[0,0,-30],[25,0,10],[-25,0,10],[-10,0,15],[10,0,-15],[-30,0,-25],[30,0,25],[0,0,20]];
      for (var _mi = 0; _mi < _minePositions.length; _mi++) {
        if (typeof Mines !== 'undefined') Mines.placeMine(_minePositions[_mi][0], 0, _minePositions[_mi][2]);
      }
      HUD.notifyPickup('⚠️ MINEFIELD DETECTED', '#ffaa00');
    }

    // Capital defense (Kyiv): fresh city integrity + defense zone at Maidan.
    if (typeof ConvoySystem !== 'undefined') {
      ConvoySystem.reset();
      if (stageDef.capitalDefense) ConvoySystem.setDefenseZone(0, 1, 12);
    }

    // Update scene colors
    _scene.background = new THREE.Color(stageDef.bgColor);
    _scene.fog = new THREE.Fog(stageDef.fogColor, 18, 105);

    // Update sky dome colors for this stage
    if (_skyDome) {
      var bgCol = new THREE.Color(stageDef.bgColor);
      var skyAttr = _skyDome.geometry.attributes.color;
      for (var si = 0; si < skyAttr.count; si++) {
        var y = _skyDome.geometry.attributes.position.getY(si);
        var t = Math.max(0, Math.min(1, (y + 180) / 360));
        // Blend stage bg color with sky gradient
        var topCol = new THREE.Color(stageDef.sunColor || 0xffffff);
        skyAttr.setXYZ(si,
          bgCol.r * (1 - t * 0.5) + topCol.r * t * 0.5,
          bgCol.g * (1 - t * 0.5) + topCol.g * t * 0.5,
          bgCol.b * (1 - t * 0.3) + topCol.b * t * 0.3 + t * 0.15
        );
      }
      skyAttr.needsUpdate = true;
    }

    // Update lighting
    if (sunLight) {
      sunLight.color.setHex(stageDef.sunColor);
      sunLight.intensity = stageDef.sunIntensity;
    }

    // Update tone mapping exposure per stage
    if (_renderer) _renderer.toneMappingExposure = stageDef.exposure || 0.85;

    // Start stage-specific ambient sound loop
    if (typeof AudioSystem !== 'undefined' && AudioSystem.startAmbientLoop) {
      window.AudioSystem.startAmbientLoop(stageDef.theme);
    }

    // Start stage-specific environmental VFX
    if (typeof StageVFX !== 'undefined' && StageVFX.startStageEffects) {
      StageVFX.startStageEffects(stageDef.theme, { warzone: !!stageDef.capitalDefense });
    }

    // Spawn water bodies per stage
    if (typeof WorldFeatures !== 'undefined' && WorldFeatures.spawnWaterBody) {
      // Each stage gets 2-3 water features (pond/river)
      var waterConfigs = [
        // Stage 0 — Hostomel: marshland ponds
        [{ cx: 25, cz: -15, rx: 10, rz: 7, d: 1.5 }, { cx: -20, cz: 30, rx: 6, rz: 12, d: 2 }],
        // Stage 1 — Avdiivka: shell crater pools
        [{ cx: 15, cz: 20, rx: 5, rz: 5, d: 1 }, { cx: -30, cz: -10, rx: 4, rz: 4, d: 0.8 }, { cx: 10, cz: -35, rx: 3, rz: 3, d: 0.6 }],
        // Stage 2 — Bakhmut: river crossing
        [{ cx: 0, cz: 25, rx: 30, rz: 5, d: 2.5 }, { cx: -25, cz: -20, rx: 7, rz: 6, d: 1.2 }],
        // Stage 3 — Kherson: Dnipro river edge
        [{ cx: 0, cz: 40, rx: 50, rz: 8, d: 3 }, { cx: 35, cz: -15, rx: 8, rz: 6, d: 1.5 }],
        // Stage 4 — Mariupol: flooded steelworks trenches
        [{ cx: -10, cz: 20, rx: 8, rz: 4, d: 1 }, { cx: 18, cz: -12, rx: 5, rz: 5, d: 0.8 }],
        // Stage 5 — Crimea: coastal sea inlet
        [{ cx: 0, cz: 55, rx: 60, rz: 10, d: 3 }, { cx: -40, cz: 20, rx: 12, rz: 8, d: 2 }],
        // Stage 6 — Chornobyl: contaminated cooling ponds
        [{ cx: 30, cz: 30, rx: 15, rz: 10, d: 2.5 }, { cx: -20, cz: 15, rx: 8, rz: 8, d: 1.5 }],
        // Stage 7 — Moscow outskirts: Moscow River
        [{ cx: 0, cz: 60, rx: 70, rz: 8, d: 3 }],
        // Stage 8 — Sevastopol: harbour inlet
        [{ cx: 0, cz: 50, rx: 55, rz: 12, d: 4 }, { cx: -35, cz: 0, rx: 10, rz: 6, d: 2 }],
        // Stage 9 — Donbas: mine drainage ponds
        [{ cx: 20, cz: -25, rx: 7, rz: 5, d: 1.2 }, { cx: -15, cz: 30, rx: 6, rz: 4, d: 1 }],
        // Stage 10 — Belgorod: small lakes
        [{ cx: 30, cz: 20, rx: 10, rz: 8, d: 2 }, { cx: -25, cz: -20, rx: 7, rz: 7, d: 1.5 }],
        // Stage 11 — Kremlin: Moskva River
        [{ cx: 0, cz: 65, rx: 75, rz: 10, d: 4 }],
        // Stage 12 — Kyiv: Dnipro/canal strip
        [{ cx: 0, cz: 50, rx: 45, rz: 7, d: 2.5 }, { cx: 30, cz: -10, rx: 6, rz: 4, d: 1 }],
        // Stage 13 — Snake Island: surrounding sea
        [{ cx: 0, cz: 60, rx: 80, rz: 15, d: 5 }, { cx: -50, cz: 0, rx: 12, rz: 8, d: 3 }],
        // Stage 14 — Saky: coastal lagoon
        [{ cx: 0, cz: 50, rx: 50, rz: 10, d: 3 }, { cx: 30, cz: -10, rx: 8, rz: 5, d: 1.5 }],
        // Stage 15 — Vuhledar: none (wasteland)
        [],
        // Stage 16 — Antonov: Dnipro crossing
        [{ cx: 0, cz: 45, rx: 55, rz: 8, d: 3 }],
        // Stage 17 — Refinery: drainage canal
        [{ cx: 15, cz: 30, rx: 10, rz: 5, d: 1.5 }, { cx: -20, cz: -15, rx: 6, rz: 4, d: 1 }],
      ];
      var wc = waterConfigs[stageIndex] || [];
      for (var wi = 0; wi < wc.length; wi++) {
        WorldFeatures.spawnWaterBody(wc[wi].cx, wc[wi].cz, wc[wi].rx, wc[wi].rz, wc[wi].d);
      }
    }

    // Radio comms: map numeric stage id to named level key
    if (typeof Radio !== 'undefined') {
      var _radioLevelMap = {
        3: 'BAKHMUT', 4: 'KHERSON', 5: 'MARIUPOL', 6: 'CRIMEA',
        7: 'CHORNOBYL', 12: 'KREMLIN', 13: 'KYIV', 14: 'SNAKE',
      };
      Radio.init();
      Radio.setLevel(_radioLevelMap[stageDef.id] || null);
    }
    if (typeof HazardZones !== 'undefined') HazardZones.setupForLevel(stageDef ? stageDef.id : null);
    if (window.Destructibles) Destructibles.setupForLevel(stageDef ? stageDef.id : null, _scene);
    if (window.IntelPickups) IntelPickups.spawnForLevel(stageDef ? stageDef.id : null, _scene);
    if (typeof ExplosiveBarrels !== 'undefined') ExplosiveBarrels.setupForLevel(stageDef ? stageDef.id : '');
    if (window.WeatherEffects) {
      var _weatherMap = { 13:'RAIN', 3:'RAIN', 5:'FOG_STORM', 7:'FOG_STORM', 6:'FOG_STORM', 8:'SNOW', 11:'SNOW', 12:'SNOW' };
      WeatherEffects.setWeather(stageDef ? (_weatherMap[stageDef.id] || 'CLEAR') : 'CLEAR');
    }
    if (typeof SupplyCrate !== 'undefined') SupplyCrate.clear();
  }

  function getCurrentStage() { return STAGES[currentStage]; }

  function showPrestigePrompt() {
    var overlay = document.createElement('div');
    overlay.id = 'prestige-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;color:#FFD700;';
    var prestigeBonus = Math.round((window._prestigeLevel + 1) * 25);
    overlay.innerHTML = '<h1 style="font-size:3em;margin:0 0 20px 0;">&#11088; PRESTIGE AVAILABLE &#11088;</h1>' +
      '<p style="font-size:1.4em;color:#fff;margin:0 0 10px 0;">You completed all ' + STAGES.length + ' missions.</p>' +
      '<p style="font-size:1.2em;color:#aaa;margin:0 0 30px 0;">Prestige level: <b style="color:#FFD700">' + window._prestigeLevel + '</b></p>' +
      '<p style="font-size:1.1em;color:#7CFC00;margin:0 0 40px 0;">Prestige now &rarr; +' + prestigeBonus + '% permanent score bonus + 5% fire rate</p>' +
      '<div style="display:flex;gap:20px;">' +
      '<button id="prestige-yes" style="padding:15px 40px;font-size:1.3em;background:#FFD700;color:#000;border:none;cursor:pointer;border-radius:4px;">PRESTIGE NOW</button>' +
      '<button id="prestige-no" style="padding:15px 40px;font-size:1.3em;background:#555;color:#fff;border:none;cursor:pointer;border-radius:4px;">Keep Playing</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('prestige-yes').onclick = function() {
      window._prestigeLevel++;
      localStorage.setItem('okk_prestige', String(window._prestigeLevel));
      window._prestigeScoreMult = 1 + (window._prestigeLevel * 0.25);
      window._prestigeFireRate = 1 + (window._prestigeLevel * 0.05);
      try { if (typeof Achievements !== 'undefined' && Achievements.recordPrestige) Achievements.recordPrestige(window._prestigeLevel); } catch (eAchP) {}
      document.body.removeChild(overlay);
      // Restart from level 0
      currentStage = 0;
      currentWave = 0;
      startLevel();
    };
    document.getElementById('prestige-no').onclick = function() {
      document.body.removeChild(overlay);
    };
  }

  function nextStage() {
    hideOverlays();
    if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
    try {
    currentStage++;
    if (currentStage >= STAGES.length) {
      // All stages done — win! Show prestige prompt then win screen.
      gameState = STATE.WIN;
      showOverlay('win');
      var _ws = document.getElementById('win-score');  if (_ws) _ws.textContent = player.score;
      var _wk = document.getElementById('win-kills');  if (_wk) _wk.textContent = player.kills;
      var _wst = document.getElementById('win-stages'); if (_wst) _wst.textContent = STAGES.length;
      showPrestigePrompt();
      return;
    }

    // Stage-based weapon unlocks
    var stageUnlocks = [
      [],                          // Stage 0→1: nothing extra (player earns via drops)
      [2, 3, 4, 5],               // Stage 1→2: AK-74M, RPK-74, SVD, PKM
      [6, 7, 8, 9, 10, 11, 12, 13], // Stage 2→3: NLAW thru SCAR-H
      [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], // Stage 3→4: DShK thru Glock
      [30, 31, 32, 33, 34, 35],  // Stage 4→5: KS-23 thru C4
      [36, 37, 38, 39, 40, 41],  // Stage 5→6: Drone Jammer thru Panzerfaust
      [42, 43, 44, 45, 46, 47],  // Stage 6→7: NSV thru PKP Pecheneg
      [48, 49, 50, 51, 52, 53],  // Stage 7→8: SPG-9 thru Spike LR
      [54, 55, 56, 57, 58, 59],  // Stage 8→9: Kord thru RPG-29
      [60, 61, 62, 63, 64, 65],  // Stage 9→10: HIMARS thru BGM-71 TOW
      [66, 67, 68, 69, 70, 71],  // Stage 10→11: RPG-29 thru Switchblade 300
      [72, 73, 74, 75, 76, 77],  // Stage 11→12: Saiga thru FAB-500
      [78, 79, 80, 81, 82, 83],  // Stage 12→13: M777 thru DP-27
      [84, 85, 86, 87, 88, 89],  // Stage 13→14: SV-98 thru Neptune
      [90, 91, 92, 93, 94, 95],  // Stage 14→15: Metis-M1 thru RGO
      [96, 97, 98, 99, 100, 101], // Stage 15→16: Gepard thru AI AXMC
      [102, 103, 104, 105, 106],  // Stage 16→17: Malyutka thru RPG-32
      [107, 108, 109, 110, 111, 112, 113, 114, 115, 116], // Stage 17→18: Vasilek thru ATACMS
    ];
    var rewards = stageUnlocks[currentStage] || [];
    for (var ri = 0; ri < rewards.length; ri++) {
      if (!Weapons.isUnlocked(rewards[ri])) {
        Weapons.unlockWeapon(rewards[ri]);
        HUD.notifyPickup('WEAPON UNLOCKED: ' + Weapons.getWeaponName(rewards[ri]), '#ff8800');
        if (HUD.showWeaponUnlockCard && Weapons.getWeaponDef) HUD.showWeaponUnlockCard(Weapons.getWeaponDef(rewards[ri]));
      }
    }
    // Refresh HUD weapon bar after stage unlocks
    if (rewards.length > 0) HUD.setWeapon(Weapons.getCurrentName(), Weapons.getCurrentIdx());

    const stageDef = STAGES[currentStage];
    applyStage(currentStage);

    // Reset wave count for new stage
    currentWave = 0;
    _scoreChain = 1;
    _chainTimer = 0;
    _chainKills = 0;
    _updateChainDisplay();

    // Heal player between stages (50% of missing HP restored)
    const missingHp = player.maxHp - player.hp;
    player.hp = Math.min(player.maxHp, player.hp + Math.ceil(missingHp * 0.5));
    HUD.setHealth(player.hp, player.maxHp);

    // Reset player position on new terrain
    const spawnH = VoxelWorld.getTerrainHeight(0, 0);
    player.position.set(0, spawnH + player.height, 0);
    player.velocity.set(0, 0, 0);

    // Clear enemies, pickups, and module state from old stage
    Enemies.clear();
    Pickups.clear();
    DroneSystem.clear();
    if (typeof EnemyArtillery !== 'undefined' && EnemyArtillery.clear) EnemyArtillery.clear();
    if (typeof RefineryStrike !== 'undefined' && RefineryStrike.clear) RefineryStrike.clear();
    if (typeof Building !== 'undefined' && Building.clear) Building.clear();
    if (typeof Tracers !== 'undefined' && Tracers.clear) Tracers.clear();
    if (typeof StageVFX !== 'undefined' && StageVFX.clear) StageVFX.clear();
    if (typeof Environment !== 'undefined' && Environment.clear) Environment.clear();
    if (typeof WorldFeatures !== 'undefined' && WorldFeatures.clear) WorldFeatures.clear();
    if (typeof CombatExtras !== 'undefined' && CombatExtras.reset) CombatExtras.reset();
    if (typeof Traversal !== 'undefined' && Traversal.reset) Traversal.reset();
    if (typeof MissionTypes !== 'undefined' && MissionTypes.clear) MissionTypes.clear();
    if (typeof Feedback !== 'undefined' && Feedback.clear) Feedback.clear();
    if (typeof WeatherSystem !== 'undefined' && WeatherSystem.clear) WeatherSystem.clear();
    if (typeof WeatherSystem !== 'undefined' && WeatherSystem.init) WeatherSystem.init(_scene, _camera);
    if (typeof Bradley !== 'undefined' && Bradley.clear) Bradley.clear();

    // Respawn organized assault groups on new terrain (BRIGADE role only)
    if (typeof NPCSystem !== 'undefined' && NPCSystem.clear) NPCSystem.clear();
    if (typeof NPCSystem !== 'undefined' && NPCSystem.setPlayerFormation) NPCSystem.setPlayerFormation(window.__chosenFormation || 'wedge');
    if (player.role === 'brigade' && typeof NPCSystem !== 'undefined' && NPCSystem.spawnAssaultGroups) NPCSystem.spawnAssaultGroups();

    // ── Urban stages: spawn Ukrainian civilian/infantry NPCs inside buildings ──
    if (stageDef && (stageDef.theme === 'urban' || stageDef.theme === 'cityscape') &&
        typeof VoxelWorld !== 'undefined' && VoxelWorld.getBuildings &&
        typeof NPCSystem !== 'undefined' && NPCSystem.spawn) {
      var _urbBuildings = VoxelWorld.getBuildings();
      for (var _ubi = 0; _ubi < _urbBuildings.length; _ubi++) {
        var _ubb = _urbBuildings[_ubi];
        if (!_ubb || _ubb.kind !== 'apartment') continue;
        var _ubCount = 1 + Math.floor(Math.random() * 2);
        for (var _ubni = 0; _ubni < _ubCount; _ubni++) {
          var _ubFloor = Math.floor(Math.random() * Math.min(_ubb.floors, 3));
          var _ubY = _ubb.baseY + _ubFloor * (_ubb.floorH || 3) + 1;
          var _ubX = _ubb.x + 3 + Math.floor(Math.random() * Math.max(1, (_ubb.w || 18) - 6));
          var _ubZ = (_ubb.cz || (_ubb.z + 5)) + (Math.random() < 0.5 ? -2 : 2);
          NPCSystem.spawn(_ubX, _ubY, _ubZ, Math.random() < 0.4 ? 'civilian' : 'infantry');
        }
      }
    }

    // Respawn vehicle fleet on roads
    var _nsWps = (VoxelWorld.getRoadWaypoints ? VoxelWorld.getRoadWaypoints() : []);
    var _nsp0 = _nsWps.length > 2 ? _nsWps[2] : new THREE.Vector3(8, 0, 20);
    var _nsp1 = _nsWps.length > 6 ? _nsWps[6] : new THREE.Vector3(12, 0, 20);
    var _nsp2 = _nsWps.length > 10 ? _nsWps[10] : new THREE.Vector3(-8, 0, 20);
    var vh = VoxelWorld.getTerrainHeight(_nsp0.x, _nsp0.z);
    VehicleSystem.clear();
    VehicleSystem.spawn(_nsp0.x, vh, _nsp0.z, 'transport');
    var vh2 = VoxelWorld.getTerrainHeight(_nsp1.x, _nsp1.z);
    VehicleSystem.spawn(_nsp1.x, vh2, _nsp1.z, 'combat');
    var vh3 = VoxelWorld.getTerrainHeight(_nsp2.x, _nsp2.z);
    VehicleSystem.spawn(_nsp2.x, vh3, _nsp2.z, 'turret_rover');
    var _nsp3 = _nsWps.length > 14 ? _nsWps[14] : new THREE.Vector3(0, 0, 15);
    var vh4 = VoxelWorld.getTerrainHeight(_nsp3.x, _nsp3.z);
    VehicleSystem.spawn(_nsp3.x, vh4, _nsp3.z, 'tank');

    // Spawn drones
    const dh1 = VoxelWorld.getTerrainHeight(5, 5) + 8;
    DroneSystem.spawn(5, dh1, 5, 'recon');
    const dh2 = VoxelWorld.getTerrainHeight(-5, 5) + 8;
    DroneSystem.spawn(-5, dh2, 5, 'fpv_attack');
    const dh3 = VoxelWorld.getTerrainHeight(0, -10) + 10;
    DroneSystem.spawn(0, dh3, -10, 'bomb');

    // Update HUD
    HUD.setStage(stageDef.id, stageDef.name);
    HUD.setWave(0);

    player.stageStartTime = performance.now();
    _levelStartTime = Date.now();  // record when this stage started
    player.stageShots = 0;
    player.stageHits = 0;
    player.stageHeadshots = 0;
    hideOverlays();

    // ── Loadout selection before stage begins ──
    if (typeof Loadout !== 'undefined') {
      gameState = STATE.PAUSED;
      Loadout.show(function(result) {
        _loadoutResult = result;
        if (typeof Loadout !== 'undefined') Loadout.applyLoadout(result, player);
        gameState = STATE.PLAYING;
        requestPointerLock();
      });
    } else {
      gameState = STATE.PLAYING;
      requestPointerLock();
    }

    // Clear stale missions from prior stage and seed a fresh stage-appropriate one
    if (typeof MissionSystem !== 'undefined' && MissionSystem.init) MissionSystem.init();
    if (typeof MissionSystem !== 'undefined' && !stageDef.droneOnly) {
      if (stageDef.capitalDefense) {
        MissionSystem.generateMission('kyiv_defense');
      } else if (stageDef.id === 1) {
        MissionSystem.generateMission('airborne_assault');
      } else {
        var _nsM = MissionSystem.generateRandom();
        _autoReconDroneForMission(_nsM);
      }
    }

    // Announce new stage then show drone selection
    HUD.announceStage(stageDef.id, stageDef.name, stageDef.description, stageDef.objective);
    if (_waveStartTimer) clearTimeout(_waveStartTimer);
    _waveStartTimer = setTimeout(function () {
      // Start the wave ON FOOT. Drones are an optional tool the player can
      // deploy mid-fight (Q/F) — the game no longer forces a drone-pilot view
      // at stage start (that read as "starting in drone perspective").
      beginWave(1);
      // First-run onboarding (core controls + goal). Shows once ever.
      try { if (typeof Feedback !== 'undefined' && Feedback.startOnboarding) Feedback.startOnboarding(); } catch (_e) {}
    }, 3200);
    } catch (err) {
      console.error('[nextStage] error:', err);
      // If stage transition fails, at least put us back in a playable state
      gameState = STATE.PLAYING;
    }
  }

  /* ── Wave Management ─────────────────────────────────────────────── */
  function beginWave(w) {
    if (typeof window !== 'undefined') {
      console.log('[QA] beginWave called, __QA_MODE:', window.__QA_MODE, 'gameState:', gameState);
    }
    if (typeof window !== 'undefined' && window.__QA_MODE) {
      // In QA mode, always allow wave start
      gameState = STATE.PLAYING;
    } else {
      if (gameState !== STATE.PLAYING && gameState !== STATE.BUILD_MODE) return;
    }
    currentWave = w;
    player._waveStartCount = 0; // reset before any early-return path (droneOnly etc.)
    // Remove flag meshes from previous wave (they accumulate otherwise)
    for (var _rfi = 0; _rfi < _rfFlagObjects.length; _rfi++) {
      var _rfm = _rfFlagObjects[_rfi];
      if (_scene) _scene.remove(_rfm);
      if (_rfm && _rfm.geometry) _rfm.geometry.dispose();
      if (_rfm && _rfm.material) _rfm.material.dispose();
    }
    _rfFlagObjects.length = 0;
    player.waveStartTime = performance.now();
    player._secondWindTriggered = false;
    if (typeof MissionSystem !== 'undefined' && MissionSystem.generateSideObjective && !MissionSystem.getSideObjective()) MissionSystem.generateSideObjective();
    const stageDef = STAGES[currentStage];
    const mlDiff = MLSystem.getDifficultyMult();

    // AI Smart Learning: classify combat style each wave and pass counter-strategy
    MLSystem.classifyCombatStyle();
    var aiStrategy = MLSystem.generateCounterStrategy();

    // Show AI adaptation notification
    if (aiStrategy.adaptationLevel > 0 && HUD.notifyPickup) {
      HUD.notifyPickup(aiStrategy.adaptationMessage, '#ff00ff');
    }

    // ═══ DroneOnly stages (e.g. Refinery Strike) ═══
    // Skip enemy spawning entirely; instead launch the FPV drone mission.
    // Wave clears when all refinery targets destroyed.
    if (stageDef.droneOnly && typeof RefineryStrike !== 'undefined' && RefineryStrike.startMission) {
      window.AudioSystem.playWaveStart();
      HUD.setWave(w, stageDef.wavesPerStage);
      HUD.announceWave(w, 0, stageDef.wavesPerStage);
      if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('wave_start');
      RefineryStrike.startMission({
        onComplete: function () {
          // Treat refinery destruction as wave complete -> stage clear
          onWaveComplete();
        }
      });
      return;
    }

    // Pass AI strategy to enemies for adaptive behavior.
    // Capital defense (Kyiv): infantry is just the column escort — thin it out
    // so the armored convoy is the main course.
    var _battlePlan = (stageDef && stageDef.capitalDefense)
      ? { groupDelta: -1, extraMultiplier: 0.6 }
      : null;
    Enemies.startWave(w, _scene, stageDef.difficulty * mlDiff, aiStrategy, stageDef.id, _battlePlan, player.position);
    if (window.BountySystem) BountySystem.markEnemy(Enemies ? Enemies.getAll() : []);
    if (window.VehicleEnemies && currentWave && currentWave % 5 === 0) {
      VehicleEnemies.spawnBTR(_scene, player.position.x + 20, player.position.z + 20);
    }
    if (typeof AllySoldiers !== 'undefined') AllySoldiers.spawnForWave(player.position, currentWave);
    if (typeof SupplyCrate !== 'undefined') SupplyCrate.dropAtWave(currentWave);
    window.AudioSystem.playWaveStart();
    HUD.setWave(w, stageDef.wavesPerStage);
    HUD.announceWave(w, Enemies.getAliveCount(), stageDef.wavesPerStage);
    // Announce enemy's randomly chosen formation as an intel report
    var _enemyForms = ['WEDGE', 'LINE', 'COLUMN', 'STAGGERED'];
    var _eFLabel = ['▲ WEDGE', '━ LINE', '| COLUMN', '⋮ STAGGERED'];
    var _efi = (w + stageDef.id + Math.floor(Math.random() * 2)) % _enemyForms.length;
    if (HUD.notifyPickup) HUD.notifyPickup('INTEL: Enemy formation — ' + _eFLabel[_efi], '#ff8800');
    var _sideObj = (typeof MissionSystem !== 'undefined' && MissionSystem.getSideObjective) ? MissionSystem.getSideObjective() : null;
    if (_sideObj && HUD.notifyPickup) HUD.notifyPickup('⭐ SIDE OBJ: ' + _sideObj.name + ' — ' + _sideObj.desc + ' (+' + _sideObj.reward + ' OKC)', '#ffcc00');
    if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('wave_start');
    // 25% chance of weather event on wave 3+
    if (currentWave >= 3 && Math.random() < 0.25 && typeof WeatherEvents !== 'undefined') {
      WeatherEvents.triggerRandom();
    }
    // Random mid-wave events — trigger 'start' phase
    if (window.WaveEvents) WaveEvents.triggerRandom(currentWave, 'start');
    // Show recommended weapons hint on wave 1 if stage defines them
    if (w === 1 && stageDef.hintWeapons && stageDef.hintWeapons.length && HUD.notifyPickup) {
      HUD.notifyPickup('💡 RECOMMENDED: ' + stageDef.hintWeapons.slice(0, 3).join(' · '), '#88ccff');
    }

    // ═══ Stage Boss on final wave ═══
    if (w === stageDef.wavesPerStage) {
      var bossType = (typeof EnemyTypes !== 'undefined' && EnemyTypes.getBossForStage)
        ? EnemyTypes.getBossForStage(stageDef.id) : 'BOSS';
      var _bx = player.position.x + (Math.random() - 0.5) * 20;
      var _bz = player.position.z + 30 + Math.random() * 10;
      Enemies.spawnSingle(bossType, {
        x: _bx,
        z: _bz,
        // omit y so spawnOne() resolves terrain height itself
      });
      HUD.notifyPickup('⚠ BOSS INCOMING: ' + (typeof EnemyTypes !== 'undefined' && EnemyTypes.TYPES && EnemyTypes.TYPES[bossType] ? EnemyTypes.TYPES[bossType].name : 'COMMANDER'), '#ff0000');
      if (window.CompanionRadio && CompanionRadio.onBossSpawn) CompanionRadio.onBossSpawn();
    }

    // ═══ Blood Moon effect on final 2 waves ═══
    var isBloodMoon = (w >= stageDef.wavesPerStage - 1);
    if (isBloodMoon && _skyDome) {
      var skyAttr = _skyDome.geometry.attributes.color;
      for (var bmi = 0; bmi < skyAttr.count; bmi++) {
        var bmy = _skyDome.geometry.attributes.position.getY(bmi);
        var bmt = Math.max(0, Math.min(1, (bmy + 180) / 360));
        skyAttr.setXYZ(bmi,
          0.55 + bmt * 0.35,   // heavy red
          0.08 + bmt * 0.06,   // minimal green
          0.08 + bmt * 0.10    // minimal blue
        );
      }
      skyAttr.needsUpdate = true;
      if (_scene.fog) {
        _scene.fog.color.setHex(0x330505);
      }
      _scene.background = new THREE.Color(0x1a0303);
      if (HUD.notifyPickup) HUD.notifyPickup('🌑 BLOOD MOON RISING', '#ff2200');
    }

    // AI Smart Learning: update NPC assist strategy
    if (typeof NPCSystem !== 'undefined' && NPCSystem.setMLStrategy) {
      NPCSystem.setMLStrategy(MLSystem.getNPCAssistStrategy());
    }

    // Update AI learning indicator on HUD
    updateAIIndicator(aiStrategy);

    // AI Anti-camping: if player was camping, send flush squad
    if (aiStrategy.antiCampFlush) {
      var campPos = MLSystem.getCampingPosition();
      if (campPos) {
        HUD.notifyPickup('⚠ ENEMIES TARGETING YOUR POSITION!', '#ff2222');
        // Spawn stormers aimed at camping position from multiple angles
        for (var fi = 0; fi < 3; fi++) {
          var flushAngle = (fi / 3) * Math.PI * 2 + Math.random() * 0.5;
          var flushDist = 20 + Math.random() * 10;
          var flushX = campPos.x + Math.cos(flushAngle) * flushDist;
          var flushZ = campPos.z + Math.sin(flushAngle) * flushDist;
          Enemies.spawnSingle('STORMER', { x: flushX, z: flushZ });
        }
      }
    }

    // ═══ Capital defense (Battle of Kyiv): armored COLUMNS instead of the
    // generic scattered vehicle spawns. Columns advance down the boulevard
    // toward the defended Maidan zone via ConvoySystem. ═══
    var capitalDefense = !!(stageDef && stageDef.capitalDefense);
    if (capitalDefense && typeof ConvoySystem !== 'undefined') {
      ConvoySystem.spawnConvoy(w, { route: 'north' });
      // Waves 3+: flanking infantry squads from the sides of the approach
      if (w >= 3 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
        var _flankSide = (w % 2 === 0) ? 1 : -1;
        var _flankPositions = [
          { x: _flankSide * 38, z: 60 }, { x: _flankSide * 42, z: 80 },
          { x: _flankSide * 36, z: 100 },
        ];
        for (var _fi = 0; _fi < _flankPositions.length; _fi++) {
          var _fp = _flankPositions[_fi];
          var _fType = (_fi === 0) ? 'STORMER' : (_fi === 1 ? 'CONSCRIPT' : 'ENGINEER');
          Enemies.spawnSingle(_fType, { x: _fp.x, z: _fp.z });
        }
        if (w === 3) HUD.notifyPickup('⚠ FLANKING ASSAULT — PROTECT YOUR SIDES!', '#ff4444');
      }
      // Waves 4 and 7: second column on a flanking axis
      if (w === 4) ConvoySystem.spawnConvoy(w, { route: 'east', tanks: 2, btrs: 1 });
      if (w === 7) ConvoySystem.spawnConvoy(w, { route: 'west', tanks: 3, btrs: 1 });
      if (w === 1) HUD.notifyPickup('🚀 GRAB AN NLAW — STOP THE COLUMNS!', '#ffcc44');
      // Air support: a Bayraktar TB2 comes on station with the wave (auto-
      // engages armor with MAM-L; respects its own 90s rearm cooldown).
      if (typeof DroneSystem !== 'undefined' && DroneSystem.callBayraktar) {
        DroneSystem.callBayraktar();
      }
      // Building snipers — enemy sharpshooters on Soviet apartment rooftops
      // (buildings at x=-15,z=-33/-17/-1 and x=+21,z=-33/-17 per world gen)
      if (w >= 2 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
        var _kyivBuildingPos = [
          { x: -15, z: -33 }, { x: 21, z: -33 },
          { x: -15, z: -17 }, { x: 21, z: -17 },
          { x: -15, z: -1  }, { x: 52, z:  16 },
          { x: -13, z:  39 }, { x: 17, z:  39 }, // approach corridor (z=30)
          { x: -13, z:  59 }, { x: 17, z:  59 }, // approach corridor (z=50)
        ];
        var _snipersThisWave = Math.min(2 + Math.floor(w / 2), 4);
        for (var _si = 0; _si < _snipersThisWave; _si++) {
          var _sb = _kyivBuildingPos[(_si + w) % _kyivBuildingPos.length];
          var _sby = (VoxelWorld.getTopSolidY ? VoxelWorld.getTopSolidY(_sb.x, _sb.z) : VoxelWorld.getTerrainHeight(_sb.x, _sb.z) + 18);
          Enemies.spawnSingle('SNIPER', new THREE.Vector3(_sb.x, _sby, _sb.z));
        }
        if (w === 2) HUD.notifyPickup('⚠ SNIPERS ON ROOFTOPS — CLEAR THE APARTMENT BLOCKS!', '#ff6622');
      }
      // Wave 5+: FPV drone operators appear on building rooftops
      if (w >= 5 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
        var _dronePosRooftops = [
          { x: -15, z: -33 }, { x: 21, z: -17 },
          { x: -15, z: -17 }, { x: 21, z: -33 },
        ];
        var _droneOpsCount = Math.min(1 + Math.floor((w - 5) / 2), 3);
        for (var _doi = 0; _doi < _droneOpsCount; _doi++) {
          var _dp = _dronePosRooftops[(_doi + w) % _dronePosRooftops.length];
          var _dpy = (VoxelWorld.getTopSolidY ? VoxelWorld.getTopSolidY(_dp.x, _dp.z) : VoxelWorld.getTerrainHeight(_dp.x, _dp.z) + 18);
          try { Enemies.spawnSingle('DRONE_OP', new THREE.Vector3(_dp.x, _dpy, _dp.z)); } catch(e) {}
        }
        if (w === 5) HUD.notifyPickup('⚡ FPV DRONE OPERATORS ON THE ROOFTOPS — ELIMINATE THEM!', '#ff8800');
      }
      // Wave 6+: Grad/Uragan artillery salvo warning — area denial for ~8s
      if (w >= 6 && typeof HUD !== 'undefined') {
        HUD.notifyPickup('💥 INCOMING GRAD SALVO — TAKE COVER!', '#ff2222');
        // Spawn rubble/fire at random spots in the approach corridor
        if (typeof VoxelWorld !== 'undefined' && VoxelWorld.setBlock) {
          for (var _gs = 0; _gs < 4; _gs++) {
            var _gx = (Math.random() - 0.5) * 20;
            var _gz = 40 + Math.random() * 80;
            var _gy = VoxelWorld.getTerrainHeight(_gx, _gz);
            try { VoxelWorld.setBlock(Math.round(_gx), _gy + 1, Math.round(_gz), window.BLOCK ? window.BLOCK.FIRE : 37); } catch(e) {}
          }
        }
      }
      // Resupply: AT weapons carry 1+3 rockets — drop ammo crates at the
      // defended line each wave so launchers stay fed.
      if (typeof Pickups !== 'undefined' && Pickups.spawn) {
        var _dz = ConvoySystem.getDefenseZone();
        for (var _ai = 0; _ai < 3; _ai++) {
          var _aa = (_ai / 3) * Math.PI * 2;
          var _ax = _dz.x + Math.cos(_aa) * 5, _az = _dz.z + Math.sin(_aa) * 5;
          Pickups.spawn(new THREE.Vector3(_ax, VoxelWorld.getTerrainHeight(_ax, _az) + 1, _az), 'AMMO');
        }
      }
    }

    // Spawn enemy vehicles on later waves (Russian armored assault)
    // tankFocus stages (e.g. Siege of Kyiv) get heavy armor from wave 1
    var tankFocus = !!(stageDef && stageDef.tankFocus) && !capitalDefense;
    var armorMinWave = tankFocus ? 1 : 3;
    var transportMinWave = tankFocus ? 2 : 5;
    var extraTanks = tankFocus ? 1 + Math.min(3, Math.floor(w / 2)) : 0;

    if (w >= armorMinWave && !capitalDefense) {
      var enemySpawnAngle = Math.random() * Math.PI * 2;
      var enemySpawnDist = 35 + Math.random() * 10;
      var evx = Math.cos(enemySpawnAngle) * enemySpawnDist;
      var evz = Math.sin(enemySpawnAngle) * enemySpawnDist;
      var evy = VoxelWorld.getTerrainHeight(evx, evz);
      VehicleSystem.spawnEnemy(evx, evy, evz, 'combat');
      HUD.notifyPickup('⚠ ENEMY ARMOR SPOTTED!', '#ff4444');
    }
    if (w >= transportMinWave && !capitalDefense) {
      var evAngle2 = Math.random() * Math.PI * 2;
      var evDist2 = 30 + Math.random() * 10;
      var evx2 = Math.cos(evAngle2) * evDist2;
      var evz2 = Math.sin(evAngle2) * evDist2;
      var evy2 = VoxelWorld.getTerrainHeight(evx2, evz2);
      VehicleSystem.spawnEnemy(evx2, evy2, evz2, 'transport');
    }
    // tankFocus extra armored column — convoy-style spawn pattern
    for (var et = 0; et < extraTanks; et++) {
      var convoyAngle = (et / Math.max(1, extraTanks)) * Math.PI * 0.6 - Math.PI * 0.3 + (Math.random() - 0.5) * 0.4;
      var convoyDist = 38 + et * 6 + Math.random() * 6;
      var ctx = Math.cos(convoyAngle) * convoyDist;
      var ctz = Math.sin(convoyAngle) * convoyDist;
      var cty = VoxelWorld.getTerrainHeight(ctx, ctz);
      VehicleSystem.spawnEnemy(ctx, cty, ctz, 'combat');
    }
    if (tankFocus && w === 1) {
      var _tStageId = stageDef ? stageDef.id : 0;
      if (_tStageId === 16) {
        // Vuhledar: minefield tank graveyard — hint mines + AT weapons
        HUD.notifyPickup('💣 MINEFIELD ACTIVE — USE NLAW/STUGNA + PLACE MINES!', '#ffcc44');
        // Seed the approach corridor with enemy mines to simulate the real minefield
        if (typeof WorldFeatures !== 'undefined' && WorldFeatures.placeMine &&
            typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
          for (var _vm = 0; _vm < 12; _vm++) {
            var _va = (_vm / 12) * Math.PI * 2;
            var _vd = 18 + (_vm % 3) * 6 + Math.random() * 4;
            var _vx = Math.cos(_va) * _vd;
            var _vz = Math.sin(_va) * _vd;
            var _vy = VoxelWorld.getTerrainHeight(_vx, _vz);
            WorldFeatures.placeMine(_vx, _vy, _vz, 'enemy');
          }
        }
      } else {
        HUD.notifyPickup('🚀 GRAB AN NLAW OR JAVELIN — STOP THE ARMOR!', '#ffcc44');
      }
    }

    // ═══ Building Garrison — enemies occupy buildings each wave ═══
    if (w >= 2 && typeof VoxelWorld !== 'undefined' && VoxelWorld.getBuildings) {
      var buildings = VoxelWorld.getBuildings();
      for (var bi = 0; bi < buildings.length; bi++) {
        var bld = buildings[bi];
        if (!bld || bld.kind !== 'apartment') continue;
        // Scale garrison size with wave
        var garrisonSize = Math.min(bld.floors, 1 + Math.floor(w / 3));
        var garrisonTypes = ['CONSCRIPT','STORMER','SNIPER'];
        if (w >= 5) garrisonTypes.push('ARMORED','FLAMETHROWER');
        if (w >= 8) garrisonTypes.push('SPETSNAZ','KADYROVITE');
        // Window positions on front face (x offsets 2,8,14 are open air every other)
        var _winXOffsets = [2, 8, 14];
        for (var gf = 0; gf < garrisonSize; gf++) {
          var floorY = bld.baseY + gf * bld.floorH + 1;
          // 2 enemies per floor — 1 at a window opening for visibility, 1 deeper
          for (var gr = 0; gr < 2; gr++) {
            var gpx, gpz;
            if (gr === 0) {
              // At an open window on front wall — visible from outside
              var _wo = _winXOffsets[(gf + w) % _winXOffsets.length];
              gpx = bld.x + _wo;
              gpz = bld.z + 1; // just inside front wall
            } else {
              gpx = bld.x + 3 + Math.floor(Math.random() * (bld.w - 6));
              gpz = bld.cz + (Math.random() < 0.5 ? -2 : 2);
            }
            var gtype = garrisonTypes[Math.floor(Math.random() * garrisonTypes.length)];
            Enemies.spawnSingle(gtype, new THREE.Vector3(gpx + 0.5, floorY, gpz + 0.5), {
              guardPost: { x: gpx + 0.5, y: floorY, z: gpz + 0.5 },
              guardRadius: 3,
              garrisonRole: 'building_defender'
            });
          }
        }
      }
    }

    // ═══ Russian Federation Flag markers at enemy positions ═══
    (function _placeRFFlags() {
      if (!_scene) return;
      var _rfColors = [0xffffff, 0x0033aa, 0xff0000]; // white, blue, red
      var _flagPositions = [];
      // Place flags near enemy spawn points (assault group centers)
      var _egroups = Enemies.getAssaultGroups ? Enemies.getAssaultGroups() : [];
      for (var fgi = 0; fgi < _egroups.length; fgi++) {
        var _eg = _egroups[fgi];
        if (_eg && _eg.center) _flagPositions.push(_eg.center);
      }
      // Also place flags near buildings
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getBuildings) {
        var _fblds = VoxelWorld.getBuildings();
        for (var fbi = 0; fbi < _fblds.length; fbi++) {
          var _fb = _fblds[fbi];
          if (_fb) _flagPositions.push(new THREE.Vector3(_fb.cx, _fb.baseY + _fb.floors * _fb.floorH, _fb.cz));
        }
      }
      for (var fpi = 0; fpi < _flagPositions.length; fpi++) {
        var fp = _flagPositions[fpi];
        if (!fp) continue;
        // Simple flag pole + cloth
        var poleH = 4 + Math.random() * 2;
        var pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, poleH, 6),
          new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        pole.position.set(fp.x, poleH * 0.5, fp.z);
        _scene.add(pole); _rfFlagObjects.push(pole);
        var clothW = 0.9, clothH = 0.5;
        var clothGeo = new THREE.PlaneGeometry(clothW, clothH, 4, 2);
        var clothMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        var cloth = new THREE.Mesh(clothGeo, clothMat);
        cloth.position.set(fp.x + clothW * 0.5, poleH - clothH * 0.5, fp.z);
        _scene.add(cloth); _rfFlagObjects.push(cloth);
        // Stripe overlays (simplified tricolor)
        var stripeB = new THREE.Mesh(
          new THREE.PlaneGeometry(clothW, clothH * 0.33, 2, 1),
          new THREE.MeshBasicMaterial({ color: 0x0033aa, side: THREE.DoubleSide })
        );
        stripeB.position.set(fp.x + clothW * 0.5, poleH - clothH * 0.83, fp.z + 0.01);
        _scene.add(stripeB); _rfFlagObjects.push(stripeB);
        var stripeR = new THREE.Mesh(
          new THREE.PlaneGeometry(clothW, clothH * 0.33, 2, 1),
          new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
        );
        stripeR.position.set(fp.x + clothW * 0.5, poleH - clothH * 0.17, fp.z + 0.01);
        _scene.add(stripeR); _rfFlagObjects.push(stripeR);
      }
    })();

    // Spawn enemy drones (from nests if alive, reduced if nests destroyed)
    if (w >= 2 && typeof DroneSystem !== 'undefined' && DroneSystem.spawnEnemyDrone) {
      var aliveNests = DroneSystem.getAliveNestCount();
      var nestMult = aliveNests > 0 ? 1.0 : 0.3;
      var nests = DroneSystem.getNests();
      var droneSpawnH = 20 + Math.random() * 10;

      function _nestSpawnPos(idx) {
        if (nests.length > 0 && nests[idx % nests.length] && nests[idx % nests.length].alive) {
          var n = nests[idx % nests.length];
          return { x: n.x + (Math.random() - 0.5) * 6, z: n.z + (Math.random() - 0.5) * 6 };
        }
        var a = Math.random() * Math.PI * 2;
        var d = 30 + Math.random() * 15;
        return { x: player.position.x + Math.cos(a) * d, z: player.position.z + Math.sin(a) * d };
      }

      // Enemy FPVs — w2: 1-2, w3+: guaranteed pair
      DroneSystem.spawnEnemyDrone(_nestSpawnPos(0).x, droneSpawnH, _nestSpawnPos(0).z, 'enemy_fpv');
      if (w >= 3 || Math.random() < nestMult * 0.5) {
        var fp2e = _nestSpawnPos(6);
        DroneSystem.spawnEnemyDrone(fp2e.x, droneSpawnH, fp2e.z, 'enemy_fpv');
      }

      // Enemy surveillance observer drones — wave 2+, reliable
      if (Math.random() < nestMult * 0.85) {
        var obsP = _nestSpawnPos(5);
        DroneSystem.spawnEnemyDrone(obsP.x, droneSpawnH + 8, obsP.z, 'enemy_observer');
      }

      // Enemy bomber + extra FPVs — wave 4+
      if (w >= 4 && Math.random() < nestMult) {
        var bp = _nestSpawnPos(1);
        DroneSystem.spawnEnemyDrone(bp.x, droneSpawnH + 5, bp.z, 'enemy_bomber');
        var fp3 = _nestSpawnPos(2);
        DroneSystem.spawnEnemyDrone(fp3.x, droneSpawnH, fp3.z, 'enemy_fpv');
        var fp4 = _nestSpawnPos(3);
        DroneSystem.spawnEnemyDrone(fp4.x, droneSpawnH, fp4.z, 'enemy_fpv');
      }

      // Heavy enemy drone wave — wave 6+
      if (w >= 6 && Math.random() < nestMult) {
        for (var ei = 0; ei < 4; ei++) {
          var ep = _nestSpawnPos(ei);
          DroneSystem.spawnEnemyDrone(ep.x, droneSpawnH + ei * 2, ep.z,
            ei === 0 ? 'enemy_bomber' : (ei === 3 ? 'enemy_observer' : 'enemy_fpv'));
        }
      }

      // Ukrainian incendiary drone (friendly fire-support) — wave 3+
      if (w >= 3 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
        var incPos = _nestSpawnPos(99);
        var incDrone = DroneSystem.spawn(incPos.x, droneSpawnH + 5, incPos.z, 'incendiary');
        if (incDrone && typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('🔥 UKRAINIAN INCENDIARY DRONE DEPLOYED — [F] when possessing to drop fire', '#ff6600');
        }
      }

      // Ukrainian surveillance drone — wave 2+, every other wave (more reliable than before)
      if (w >= 2 && w % 2 === 0 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
        var survPos = _nestSpawnPos(77);
        var survDrone = DroneSystem.spawn(survPos.x, droneSpawnH + 10, survPos.z, 'surveillance');
        if (survDrone && typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('👁 UKRAINIAN SURVEILLANCE DRONE — [F] to possess, marks enemy positions', '#44aaff');
        }
      }

      // Ukrainian FPV attack — wave 3+ (guaranteed)
      if (w >= 3 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
        var ufpvPos = _nestSpawnPos(55);
        DroneSystem.spawn(ufpvPos.x, droneSpawnH, ufpvPos.z, 'fpv_attack');
        // Second FPV on later waves
        if (w >= 5) {
          var ufpvPos2 = _nestSpawnPos(56);
          DroneSystem.spawn(ufpvPos2.x, droneSpawnH, ufpvPos2.z, 'fpv_attack');
        }
      }

      // Ukrainian Baba Yaga fire-dropper — wave 4+, every other wave
      if (w >= 4 && w % 2 === 0 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
        var byPos = _nestSpawnPos(88);
        var byDrone = DroneSystem.spawn(byPos.x, droneSpawnH + 8, byPos.z, 'baba_yaga');
        if (byDrone && typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('🔥 BABA YAGA DEPLOYED — heavy thermite fire-dropper! [F] to possess, [LMB] to drop', '#ff8800');
        }
      }

      // Ukrainian bomb drone — wave 5+
      if (w >= 5 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
        var bombPos = _nestSpawnPos(42);
        DroneSystem.spawn(bombPos.x, droneSpawnH + 3, bombPos.z, 'bomb');
      }

      if (aliveNests > 0) {
        HUD.notifyPickup('⚠ ENEMY DRONES FROM NESTS! Destroy nests to stop them!', '#ff4488');
      } else if (nestMult < 1) {
        HUD.notifyPickup('⚠ Enemy drone operations crippled!', '#44ff88');
      } else {
        HUD.notifyPickup('⚠ ENEMY DRONES DETECTED!', '#ff4488');
      }
    }

    // ═══ NEW: Wave-begin integrations for 59 features ═══
    // Generate bounties for this wave
    if (typeof Progression !== 'undefined') {
      Progression.generateBounties(w);
      Progression.trackStat('wavesCleared', 0); // track at begin; increment at complete
    }
    // Spawn a random mission type every 3 waves
    // ASSAULT_DUGOUTS excluded — it pre-spawns 16 extra garrison enemies which spikes difficulty mid-wave.
    // Only start if no scripted mission already active (avoids silently overwriting in-progress missions).
    // Skip for capitalDefense (Kyiv) — convoy columns are already the priority objective.
    if (w % 3 === 0 && typeof MissionTypes !== 'undefined' && !MissionTypes.getActive() && !capitalDefense) {
      var _mSafeTypes = ['DEMOLITION', 'CAPTURE_ZONE', 'ASSASSINATION', 'RESCUE', 'DEFUSE'];
      var mType = _mSafeTypes[Math.floor(Math.random() * _mSafeTypes.length)];
      var _mzX = player.position.x + (Math.random() - 0.5) * 40;
      var _mzZ = player.position.z + (Math.random() - 0.5) * 40;
      for (var _mzTry = 0; _mzTry < 7 && typeof VoxelWorld !== 'undefined' && VoxelWorld.getBlock &&
           VoxelWorld.getBlock(Math.floor(_mzX), VoxelWorld.getTerrainHeight(_mzX, _mzZ), Math.floor(_mzZ)) === 8; _mzTry++) {
        _mzX = player.position.x + (Math.random() - 0.5) * 40;
        _mzZ = player.position.z + (Math.random() - 0.5) * 40;
      }
      MissionTypes.startMission(mType, _mzX, _mzZ);
      HUD.notifyPickup('📍 NEW MISSION: ' + MissionTypes.TYPES[mType].name, '#ffcc00');
    }
    // Spawn supply airdrop every 4 waves
    if (w % 4 === 0 && typeof WorldFeatures !== 'undefined') {
      var adX = player.position.x + (Math.random() - 0.5) * 30;
      var adZ = player.position.z + (Math.random() - 0.5) * 30;
      var adY = VoxelWorld.getTerrainHeight(adX, adZ);
      WorldFeatures.spawnAirdrop(adX, adZ, adY);
      HUD.notifyPickup('📦 SUPPLY DROP INCOMING!', '#44ff88');
    }
    // Place enemy landmines on later waves
    if (w >= 4 && typeof WorldFeatures !== 'undefined') {
      for (var lmi = 0; lmi < Math.min(w, 8); lmi++) {
        var lmAngle = Math.random() * Math.PI * 2;
        var lmDist = 10 + Math.random() * 20;
        var lmX = player.position.x + Math.cos(lmAngle) * lmDist;
        var lmZ = player.position.z + Math.sin(lmAngle) * lmDist;
        var lmY = VoxelWorld.getTerrainHeight(lmX, lmZ);
        WorldFeatures.placeMine(lmX, lmY, lmZ, 'enemy');
      }
    }
    // Hostomel (id 1): VDV paratroop landing + anti-air warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 1) {
      HUD.notifyPickup('⚡ VDV PARATROOPERS LANDING — HOLD THE AIRFIELD!', '#ffcc44');
    }
    // Avdiivka (id 2): sniper warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 2) {
      HUD.notifyPickup('⚠ SNIPERS IN THE RUINS — KEEP MOVING, USE COVER!', '#ffaa44');
    }
    // Bakhmut (id 3): Wagner multi-directional assault warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 3) {
      HUD.notifyPickup('☠ WAGNER MERCENARIES — COMING FROM ALL SIDES!', '#ff4444');
    }
    // Kherson (id 4): river/armor warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 4) {
      HUD.notifyPickup('🌊 DNIPRO CROSSING — LURE ENEMY ARMOR INTO THE RIVER!', '#44aaff');
    }
    // Snake Island (id 14): warn about Moskva bombardment at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 14) {
      HUD.notifyPickup('⚓ MOSKVA IS SHELLING — SHELTER AND HOLD THE ISLAND!', '#4477ff');
    }
    // Sevastopol (id 9): ship artillery warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 9) {
      HUD.notifyPickup('💥 SHIP ARTILLERY INCOMING — DESTROY THE FLEET!', '#4488ff');
    }
    // Hostomel (id 1): VDV paratroopers drop from altitude each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 1 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _vdvCount = Math.min(3, 1 + Math.floor(w / 2));
      for (var _vi = 0; _vi < _vdvCount; _vi++) {
        var _vA = Math.random() * Math.PI * 2;
        var _vD = 20 + Math.random() * 15;
        var _vX = player.position.x + Math.cos(_vA) * _vD;
        var _vZ = player.position.z + Math.sin(_vA) * _vD;
        var _vY = VoxelWorld.getTerrainHeight(_vX, _vZ) + 14 + Math.random() * 6;
        Enemies.spawnSingle('PARATROOP', new THREE.Vector3(_vX, _vY, _vZ));
      }
      if (w >= 4) {
        // Later waves add a drone operator directing the drop
        var _voA = Math.random() * Math.PI * 2;
        var _voX = player.position.x + Math.cos(_voA) * 28;
        var _voZ = player.position.z + Math.sin(_voA) * 28;
        Enemies.spawnSingle('DRONE_OP', new THREE.Vector3(_voX, VoxelWorld.getTerrainHeight(_voX, _voZ), _voZ));
      }
    }
    // Belgorod (id 11): heavy counter-attack warning + extra armor at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 11) {
      HUD.notifyPickup('⚠ HEAVY ARMORED COUNTER-ATTACK — GRAB ANTI-TANK WEAPONS!', '#ff8800');
      // Extra BTR spawn from wave 1 to reflect "tanks and mech infantry counter-attack"
      if (!capitalDefense && typeof VehicleSystem !== 'undefined') {
        var _bgrA = Math.random() * Math.PI * 2;
        var _bgrD = 35 + Math.random() * 10;
        var _bgrX = Math.cos(_bgrA) * _bgrD;
        var _bgrZ = Math.sin(_bgrA) * _bgrD;
        VehicleSystem.spawnEnemy(_bgrX, VoxelWorld.getTerrainHeight(_bgrX, _bgrZ), _bgrZ, 'combat');
      }
    }
    // Saky airbase (id 15): extra drone spawns each wave + jammer hint at wave 1
    if (STAGES[currentStage] && STAGES[currentStage].id === 15) {
      if (w === 1) HUD.notifyPickup('📡 GRAB A JAMMER RIFLE — HEAVY DRONE PRESENCE!', '#ff6600');
      // Spawn 1+floor(w/2) extra KAMIKAZE_DRONEs at the airbase perimeter
      var _sakySurge = 1 + Math.floor(w / 2);
      for (var _sdi = 0; _sdi < _sakySurge; _sdi++) {
        var _sa = Math.random() * Math.PI * 2;
        var _sd = 28 + _sdi * 5 + Math.random() * 5;
        var _sx = player.position.x + Math.cos(_sa) * _sd;
        var _sz = player.position.z + Math.sin(_sa) * _sd;
        var _sy = VoxelWorld.getTerrainHeight(_sx, _sz) + 7;
        if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) Enemies.spawnSingle('KAMIKAZE_DRONE', new THREE.Vector3(_sx, _sy, _sz));
      }
    }
    // Mariupol (id 5): fire hazard warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 5) {
      HUD.notifyPickup('🔥 STEELWORKS INFERNO — FIRE DEALS CONSTANT DAMAGE!', '#ff6600');
    }
    // Crimea Bridge (id 6): naval marines + drone warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 6) {
      HUD.notifyPickup('⚓ NAVAL MARINES AND DRONE STRIKES — HOLD THE KERCH CROSSING!', '#4477ff');
    }
    // Chornobyl (id 7): radiation warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 7) {
      HUD.notifyPickup('☢ RADIATION ACTIVE — CONSTANT EXPOSURE, WATCH YOUR HP!', '#00ff44');
    }
    // Outer Moscow (id 8): elite defenders warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 8) {
      HUD.notifyPickup('🛡 FSB ELITE & ROSGVARDIYA — MAXIMUM RESISTANCE!', '#cc44ff');
    }
    // Donbas (id 10): thermobaric weapons reminder at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 10) {
      HUD.notifyPickup('☠ DONBAS STRONGHOLD — THERMOBARIC WEAPONS CLEAR TRENCHES!', '#ff4444');
    }
    // Kremlin (id 12): final battle warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 12) {
      HUD.notifyPickup('🏛 KREMLIN — EVERY ENEMY TYPE. MAXIMUM DIFFICULTY. HOLD THE LINE!', '#ff3300');
    }
    // Kyiv (id 13): defend the capital at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 13) {
      HUD.notifyPickup('🇺🇦 DEFEND KYIV — STOP THE ARMORED COLUMNS AT ALL COSTS!', '#0057b7');
    }
    // Antonov (id 17): long-range artillery duel warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 17) {
      HUD.notifyPickup('🎯 ARTILLERY DUELS — PRECISION WEAPONS REQUIRED. WATCH YOUR RANGE!', '#ffcc44');
    }
    // Vuhledar (id 16): tank graveyard warning at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 16) {
      HUD.notifyPickup('⚰ TANK GRAVEYARD — USE MINES AND ANTI-TANK WEAPONS!', '#ff8800');
    }
    // Refinery (id 18): FPV drone mission start at wave 1
    if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 18) {
      HUD.notifyPickup('💥 FPV DRONE ARMED — FLY INTO THE REFINERY. NO SECOND CHANCES!', '#ff6600');
    }
    // Spawn radiation zones in Chornobyl stage (ID 7) on wave 6
    if (w === 6 && typeof WorldFeatures !== 'undefined' && STAGES[currentStage] && STAGES[currentStage].id === 7) {
      WorldFeatures.addRadiationZone(player.position.x + 30, player.position.z + 30, 8);
      WorldFeatures.addRadiationZone(player.position.x - 25, player.position.z + 15, 6);
      HUD.notifyPickup('☢ CHORNOBYL RADIATION ZONES ACTIVE!', '#00ff00');
    }
    // Bakhmut (id 3): Wagner surrounds from all angles each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 3 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _wagnCount = Math.min(4, 2 + Math.floor(w / 3));
      for (var _wi = 0; _wi < _wagnCount; _wi++) {
        var _wa = (_wi / _wagnCount) * Math.PI * 2 + Math.random() * 0.4;
        var _wd = 25 + Math.random() * 10;
        var _wx = player.position.x + Math.cos(_wa) * _wd;
        var _wz = player.position.z + Math.sin(_wa) * _wd;
        Enemies.spawnSingle(w >= 4 ? 'WAGNER' : 'STORMER', new THREE.Vector3(_wx, VoxelWorld.getTerrainHeight(_wx, _wz), _wz));
      }
      if (w >= 5) {
        var _mortA = Math.random() * Math.PI * 2;
        var _mortX = player.position.x + Math.cos(_mortA) * 32;
        var _mortZ = player.position.z + Math.sin(_mortA) * 32;
        Enemies.spawnSingle('MORTAR', new THREE.Vector3(_mortX, VoxelWorld.getTerrainHeight(_mortX, _mortZ), _mortZ));
      }
    }
    // Mariupol siege (id 5): shield-and-engineer breach squads storm ruins each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 5 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _marCount = Math.min(4, 2 + Math.floor(w / 2));
      for (var _mari = 0; _mari < _marCount; _mari++) {
        var _marA = (_mari / _marCount) * Math.PI * 2 + Math.random() * 0.4;
        var _marD = 20 + Math.random() * 10;
        var _marX = player.position.x + Math.cos(_marA) * _marD;
        var _marZ = player.position.z + Math.sin(_marA) * _marD;
        Enemies.spawnSingle(w >= 5 ? 'SHIELD_BEARER' : 'STORMER', new THREE.Vector3(_marX, VoxelWorld.getTerrainHeight(_marX, _marZ), _marZ));
      }
      if (w >= 3) {
        var _marEngA = Math.random() * Math.PI * 2;
        var _marEngX = player.position.x + Math.cos(_marEngA) * 28;
        var _marEngZ = player.position.z + Math.sin(_marEngA) * 28;
        Enemies.spawnSingle('ENGINEER', new THREE.Vector3(_marEngX, VoxelWorld.getTerrainHeight(_marEngX, _marEngZ), _marEngZ));
      }
    }
    // Moscow FSB (id 8): Rosgvardiya response teams deploy each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 8 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _moscCount = Math.min(5, 2 + Math.floor(w / 2));
      for (var _mosci = 0; _mosci < _moscCount; _mosci++) {
        var _moscA = (_mosci / _moscCount) * Math.PI * 2 + Math.random() * 0.3;
        var _moscD = 22 + Math.random() * 12;
        var _moscX = player.position.x + Math.cos(_moscA) * _moscD;
        var _moscZ = player.position.z + Math.sin(_moscA) * _moscD;
        Enemies.spawnSingle(w >= 6 ? 'SPETSNAZ' : (w >= 3 ? 'RIOT' : 'STORMER'), new THREE.Vector3(_moscX, VoxelWorld.getTerrainHeight(_moscX, _moscZ), _moscZ));
      }
      if (w >= 4) {
        var _moscSniA = Math.random() * Math.PI * 2;
        var _moscSniX = player.position.x + Math.cos(_moscSniA) * 35;
        var _moscSniZ = player.position.z + Math.sin(_moscSniA) * 35;
        Enemies.spawnSingle('SNIPER_ELITE', new THREE.Vector3(_moscSniX, VoxelWorld.getTerrainHeight(_moscSniX, _moscSniZ), _moscSniZ));
      }
    }
    // Donbas trenches (id 10): trench-clearing assault each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 10 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _donCount = Math.min(5, 2 + Math.floor(w / 2));
      for (var _doni = 0; _doni < _donCount; _doni++) {
        var _donA = Math.random() * Math.PI * 2;
        var _donD = 18 + Math.random() * 14;
        var _donX = player.position.x + Math.cos(_donA) * _donD;
        var _donZ = player.position.z + Math.sin(_donA) * _donD;
        Enemies.spawnSingle(w >= 5 ? 'KADYROVITE' : 'CONSCRIPT', new THREE.Vector3(_donX, VoxelWorld.getTerrainHeight(_donX, _donZ), _donZ));
      }
      if (w >= 3) {
        var _donThermA = Math.random() * Math.PI * 2;
        var _donThermX = player.position.x + Math.cos(_donThermA) * 30;
        var _donThermZ = player.position.z + Math.sin(_donThermA) * 30;
        Enemies.spawnSingle('THERMOBARIC', new THREE.Vector3(_donThermX, VoxelWorld.getTerrainHeight(_donThermX, _donThermZ), _donThermZ));
      }
      if (w >= 5) {
        var _donMortA = Math.random() * Math.PI * 2;
        var _donMortX = player.position.x + Math.cos(_donMortA) * 36;
        var _donMortZ = player.position.z + Math.sin(_donMortA) * 36;
        Enemies.spawnSingle('MORTAR', new THREE.Vector3(_donMortX, VoxelWorld.getTerrainHeight(_donMortX, _donMortZ), _donMortZ));
      }
    }
    // Chornobyl (id 7): irradiated stalkers emerge from the hot zone each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 7 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _chnCount = Math.min(3, 1 + Math.floor(w / 3));
      for (var _chi = 0; _chi < _chnCount; _chi++) {
        var _chA = Math.random() * Math.PI * 2;
        var _chD = 22 + Math.random() * 12;
        var _chX = player.position.x + Math.cos(_chA) * _chD;
        var _chZ = player.position.z + Math.sin(_chA) * _chD;
        Enemies.spawnSingle(w >= 5 ? 'SPETSNAZ' : 'STORMER', new THREE.Vector3(_chX, VoxelWorld.getTerrainHeight(_chX, _chZ), _chZ));
      }
      if (w >= 4) {
        var _chEwA = Math.random() * Math.PI * 2;
        var _chEwX = player.position.x + Math.cos(_chEwA) * 30;
        var _chEwZ = player.position.z + Math.sin(_chEwA) * 30;
        Enemies.spawnSingle('EW_OPERATOR', new THREE.Vector3(_chEwX, VoxelWorld.getTerrainHeight(_chEwX, _chEwZ), _chEwZ));
      }
    }
    // Sevastopol naval base (id 9): naval marines storm ashore each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 9 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _sevCount = Math.min(4, 2 + Math.floor(w / 2));
      for (var _sevi = 0; _sevi < _sevCount; _sevi++) {
        var _sevA = Math.random() * Math.PI * 2;
        var _sevD = 20 + Math.random() * 12;
        var _sevX = player.position.x + Math.cos(_sevA) * _sevD;
        var _sevZ = player.position.z + Math.sin(_sevA) * _sevD;
        Enemies.spawnSingle(w >= 5 ? 'SPETSNAZ' : 'STORMER', new THREE.Vector3(_sevX, VoxelWorld.getTerrainHeight(_sevX, _sevZ), _sevZ));
      }
      if (w >= 3) {
        var _sevSnA = Math.random() * Math.PI * 2;
        var _sevSnX = player.position.x + Math.cos(_sevSnA) * 35;
        var _sevSnZ = player.position.z + Math.sin(_sevSnA) * 35;
        Enemies.spawnSingle('HEAVY_SNIPER', new THREE.Vector3(_sevSnX, VoxelWorld.getTerrainHeight(_sevSnX, _sevSnZ), _sevSnZ));
      }
    }
    // Kremlin (id 12): Kremlin Guard surge each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 12 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _krCount = Math.min(5, 2 + Math.floor(w / 2));
      for (var _kri = 0; _kri < _krCount; _kri++) {
        var _krA = (_kri / _krCount) * Math.PI * 2 + Math.random() * 0.3;
        var _krD = 22 + Math.random() * 12;
        var _krX = player.position.x + Math.cos(_krA) * _krD;
        var _krZ = player.position.z + Math.sin(_krA) * _krD;
        Enemies.spawnSingle(w >= 6 ? 'HEAVY_SNIPER' : 'SPETSNAZ', new THREE.Vector3(_krX, VoxelWorld.getTerrainHeight(_krX, _krZ), _krZ));
      }
      if (w >= 4) {
        var _krCommA = Math.random() * Math.PI * 2;
        var _krCommX = player.position.x + Math.cos(_krCommA) * 28;
        var _krCommZ = player.position.z + Math.sin(_krCommA) * 28;
        Enemies.spawnSingle('COMMISSAR', new THREE.Vector3(_krCommX, VoxelWorld.getTerrainHeight(_krCommX, _krCommZ), _krCommZ));
      }
    }
    // Snake Island (id 14): Russian naval marines land each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 14 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _snkCount = Math.min(4, 1 + Math.floor(w / 2));
      for (var _sni = 0; _sni < _snkCount; _sni++) {
        var _snA = Math.random() * Math.PI * 2;
        var _snD = 22 + Math.random() * 12;
        var _snX = player.position.x + Math.cos(_snA) * _snD;
        var _snZ = player.position.z + Math.sin(_snA) * _snD;
        Enemies.spawnSingle('STORMER', new THREE.Vector3(_snX, VoxelWorld.getTerrainHeight(_snX, _snZ), _snZ));
      }
      if (w >= 3) {
        var _snA2 = Math.random() * Math.PI * 2;
        var _snX2 = player.position.x + Math.cos(_snA2) * 30;
        var _snZ2 = player.position.z + Math.sin(_snA2) * 30;
        Enemies.spawnSingle('DRONE_OP', new THREE.Vector3(_snX2, VoxelWorld.getTerrainHeight(_snX2, _snZ2), _snZ2));
      }
    }
    // Belgorod offensive (id 11): mechanized territorial counter-attack each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 11 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _bgrInfCount = Math.min(4, 1 + Math.floor(w / 2));
      for (var _bgri = 0; _bgri < _bgrInfCount; _bgri++) {
        var _bgriA = Math.random() * Math.PI * 2;
        var _bgriD = 20 + Math.random() * 12;
        var _bgriX = player.position.x + Math.cos(_bgriA) * _bgriD;
        var _bgriZ = player.position.z + Math.sin(_bgriA) * _bgriD;
        Enemies.spawnSingle(w >= 5 ? 'ARMORED' : 'STORMER', new THREE.Vector3(_bgriX, VoxelWorld.getTerrainHeight(_bgriX, _bgriZ), _bgriZ));
      }
      if (w >= 3) {
        var _bgrEngA = Math.random() * Math.PI * 2;
        var _bgrEngX = player.position.x + Math.cos(_bgrEngA) * 30;
        var _bgrEngZ = player.position.z + Math.sin(_bgrEngA) * 30;
        Enemies.spawnSingle('ENGINEER', new THREE.Vector3(_bgrEngX, VoxelWorld.getTerrainHeight(_bgrEngX, _bgrEngZ), _bgrEngZ));
      }
      if (w >= 5) {
        var _bgrMortA = Math.random() * Math.PI * 2;
        var _bgrMortX = player.position.x + Math.cos(_bgrMortA) * 38;
        var _bgrMortZ = player.position.z + Math.sin(_bgrMortA) * 38;
        Enemies.spawnSingle('MORTAR', new THREE.Vector3(_bgrMortX, VoxelWorld.getTerrainHeight(_bgrMortX, _bgrMortZ), _bgrMortZ));
      }
    }
    // Avdiivka (id 2): assault squads probe the frontline each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 2 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _avdCount = Math.min(3, 1 + Math.floor(w / 3));
      for (var _avdi = 0; _avdi < _avdCount; _avdi++) {
        var _avdA = Math.random() * Math.PI * 2;
        var _avdD = 20 + Math.random() * 10;
        var _avdX = player.position.x + Math.cos(_avdA) * _avdD;
        var _avdZ = player.position.z + Math.sin(_avdA) * _avdD;
        Enemies.spawnSingle(w >= 4 ? 'ARMORED' : 'STORMER', new THREE.Vector3(_avdX, VoxelWorld.getTerrainHeight(_avdX, _avdZ), _avdZ));
      }
    }
    // Kherson (id 4): river-crossing assault — BTR + amphibious infantry
    if (STAGES[currentStage] && STAGES[currentStage].id === 4 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _khsCount = Math.min(3, 1 + Math.floor(w / 3));
      for (var _khsi = 0; _khsi < _khsCount; _khsi++) {
        var _khsA = Math.random() * Math.PI * 2;
        var _khsD = 22 + Math.random() * 12;
        var _khsX = player.position.x + Math.cos(_khsA) * _khsD;
        var _khsZ = player.position.z + Math.sin(_khsA) * _khsD;
        Enemies.spawnSingle('STORMER', new THREE.Vector3(_khsX, VoxelWorld.getTerrainHeight(_khsX, _khsZ), _khsZ));
      }
      if (w >= 4) {
        var _khsBtrA = Math.random() * Math.PI * 2;
        var _khsBtrX = player.position.x + Math.cos(_khsBtrA) * 30;
        var _khsBtrZ = player.position.z + Math.sin(_khsBtrA) * 30;
        Enemies.spawnSingle('BTR', new THREE.Vector3(_khsBtrX, VoxelWorld.getTerrainHeight(_khsBtrX, _khsBtrZ), _khsBtrZ));
      }
    }
    // Crimea (id 6): naval infantry land from the coast each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 6 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _criCount = Math.min(4, 2 + Math.floor(w / 3));
      for (var _crii = 0; _crii < _criCount; _crii++) {
        var _criA = Math.random() * Math.PI * 2;
        var _criD = 22 + Math.random() * 12;
        var _criX = player.position.x + Math.cos(_criA) * _criD;
        var _criZ = player.position.z + Math.sin(_criA) * _criD;
        Enemies.spawnSingle(w >= 5 ? 'PARATROOP' : 'STORMER', new THREE.Vector3(_criX, VoxelWorld.getTerrainHeight(_criX, _criZ), _criZ));
      }
      if (w >= 3) {
        var _criDrA = Math.random() * Math.PI * 2;
        var _criDrX = player.position.x + Math.cos(_criDrA) * 28;
        var _criDrZ = player.position.z + Math.sin(_criDrA) * 28;
        Enemies.spawnSingle('DRONE_OP', new THREE.Vector3(_criDrX, VoxelWorld.getTerrainHeight(_criDrX, _criDrZ) + 5, _criDrZ));
      }
    }
    // Vuhledar tank graveyard (id 16): armor columns advance each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 16 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _vuhTankA = Math.random() * Math.PI * 2;
      var _vuhTankX = player.position.x + Math.cos(_vuhTankA) * 30;
      var _vuhTankZ = player.position.z + Math.sin(_vuhTankA) * 30;
      Enemies.spawnSingle(w >= 6 ? 'ASSAULT_MECH' : 'TANK', new THREE.Vector3(_vuhTankX, VoxelWorld.getTerrainHeight(_vuhTankX, _vuhTankZ), _vuhTankZ));
      if (w >= 3) {
        var _vuhBtrA = _vuhTankA + Math.PI * 0.5 + Math.random() * 0.4;
        var _vuhBtrX = player.position.x + Math.cos(_vuhBtrA) * 26;
        var _vuhBtrZ = player.position.z + Math.sin(_vuhBtrA) * 26;
        Enemies.spawnSingle('BTR', new THREE.Vector3(_vuhBtrX, VoxelWorld.getTerrainHeight(_vuhBtrX, _vuhBtrZ), _vuhBtrZ));
      }
      if (w >= 5) {
        var _vuhMortA = Math.random() * Math.PI * 2;
        var _vuhMortX = player.position.x + Math.cos(_vuhMortA) * 38;
        var _vuhMortZ = player.position.z + Math.sin(_vuhMortA) * 38;
        Enemies.spawnSingle('MORTAR', new THREE.Vector3(_vuhMortX, VoxelWorld.getTerrainHeight(_vuhMortX, _vuhMortZ), _vuhMortZ));
      }
    }
    // Antonov Airport (id 17): paratroopers drop + saboteurs infiltrate each wave
    if (STAGES[currentStage] && STAGES[currentStage].id === 17 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _antCount = Math.min(4, 2 + Math.floor(w / 2));
      for (var _anti = 0; _anti < _antCount; _anti++) {
        var _antA = Math.random() * Math.PI * 2;
        var _antD = 25 + Math.random() * 12;
        var _antX = player.position.x + Math.cos(_antA) * _antD;
        var _antZ = player.position.z + Math.sin(_antA) * _antD;
        var _antY = VoxelWorld.getTerrainHeight(_antX, _antZ) + 18;
        Enemies.spawnSingle('PARATROOP', new THREE.Vector3(_antX, _antY, _antZ));
      }
      if (w >= 3) {
        var _antSabA = Math.random() * Math.PI * 2;
        var _antSabX = player.position.x + Math.cos(_antSabA) * 20;
        var _antSabZ = player.position.z + Math.sin(_antSabA) * 20;
        Enemies.spawnSingle('SABOTEUR', new THREE.Vector3(_antSabX, VoxelWorld.getTerrainHeight(_antSabX, _antSabZ), _antSabZ));
      }
      if (w >= 5) {
        var _antEwA = Math.random() * Math.PI * 2;
        var _antEwX = player.position.x + Math.cos(_antEwA) * 32;
        var _antEwZ = player.position.z + Math.sin(_antEwA) * 32;
        Enemies.spawnSingle('EW_OPERATOR', new THREE.Vector3(_antEwX, VoxelWorld.getTerrainHeight(_antEwX, _antEwZ), _antEwZ));
      }
    }
    // Reset combat extras per wave
    if (typeof CombatExtras !== 'undefined') {
      CombatExtras.reset();
    }
    // Capture total after ALL spawning (garrison, convoys, stage-specific) for correct progress bar denominator
    player._waveStartCount = Enemies.getAliveCount();
    // Re-announce with correct enemy count now that all spawning is complete
    HUD.announceWave(w, player._waveStartCount, stageDef.wavesPerStage);
    if (window.CompanionRadio && CompanionRadio.onWaveStart) CompanionRadio.onWaveStart();
  }

  function onWaveComplete() {
    try {
    if (typeof HUD !== 'undefined' && HUD.hideBossBar) HUD.hideBossBar();
    if (window.CompanionRadio && CompanionRadio.onWaveComplete) CompanionRadio.onWaveComplete();
    if (typeof AllySoldiers !== 'undefined') AllySoldiers.clear();
    player.score += SCORE_WAVE_BONUS;
    HUD.setScore(player.score);
    MLSystem.onWaveComplete(currentWave, currentStage, player.hp / player.maxHp);
    RankSystem.onWaveComplete(currentWave);
    MissionSystem.onWaveCompleted();

    // Slow-mo on wave clear (dramatic final-kill moment)
    if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) Feedback.triggerSlowMo(0.4, 0.2);
    // Confetti / spark burst above player as celebration
    try {
      if (typeof Tracers !== 'undefined' && Tracers.spawnPickupBurst && _scene && player) {
        var _wcPos = player.position.clone(); _wcPos.y += 1.5;
        Tracers.spawnPickupBurst(_wcPos, 0xffd700);
        var _wcPos2 = player.position.clone(); _wcPos2.y += 2.2; _wcPos2.x += 0.6;
        Tracers.spawnPickupBurst(_wcPos2, 0x44ff88);
        var _wcPos3 = player.position.clone(); _wcPos3.y += 2.2; _wcPos3.x -= 0.6;
        Tracers.spawnPickupBurst(_wcPos3, 0x44aaff);
      }
      _killFovKick = Math.max(_killFovKick, 5);
    } catch (eWC) {}
    // Kill cam: brief camera override toward last killed enemy
    if (_lastKillPos && CameraSystem.playLastKillCam) {
      CameraSystem.playLastKillCam(_lastKillPos, _camera.position);
    }

    // Show wave stats (Feature 50)
    if (HUD.showWaveStats) {
      var elapsed = ((performance.now() - player.waveStartTime) / 1000);
      var mins = Math.floor(elapsed / 60);
      var secs = Math.floor(elapsed % 60);
      HUD.showWaveStats({
        kills: player.waveKills,
        accuracy: player.waveShots > 0 ? Math.round((player.waveHits / player.waveShots) * 100) : 0,
        headshots: player.waveHeadshots,
        time: mins + 'm ' + secs + 's',
        damageTaken: Math.round(player.waveDamageTaken),
        bestStreak: player.bestStreak,
      });
    }

    // Show last wave summary overlay (NEW FEATURE)
    if (typeof HUD !== 'undefined' && HUD.showWaveSummary) {
      var elapsedSec = Math.round((performance.now() - player.waveStartTime) / 1000);
      HUD.showWaveSummary({
        wave: currentWave,
        kills: player.waveKills,
        score: player.score,
        headshots: player.waveHeadshots,
        damageTaken: Math.round(player.waveDamageTaken),
        time: elapsedSec
      });
    }
    // Play-to-Earn: OKC for wave clear
    if (typeof Marketplace !== 'undefined') {
      Marketplace.onWaveClear();
      HUD.updateOKC(Marketplace.getOKC());
    }

    // ═══ NEW: Wave-complete integrations for 59 features ═══
    // Mark player as experienced (for quick-start flow)
    try { localStorage.setItem('ok_has_played', '1'); } catch (e) {}
    // Progression stats (BEFORE resetting wave stats so values are accurate)
    if (typeof Progression !== 'undefined') {
      Progression.trackStat('wavesCleared', 1);
      // Check flawless wave
      if (player.waveDamageTaken === 0) {
        Progression.trackStat('flawlessWaves', 1);
      }
      // Speed wave bounty
      var waveTime = (performance.now() - player.waveStartTime) / 1000;
      Progression.updateBounty('speed_wave', 1);
      Progression.updateBounty('survive', 1);
      Progression.updateBounty('low_damage', Math.round(player.waveDamageTaken));
      Progression.save();
    }
    // Achievements: record wave complete
    try {
      if (typeof Achievements !== 'undefined' && Achievements.recordWaveComplete) {
        var _achLevelId = (typeof stageDef !== 'undefined' && stageDef) ? stageDef.id : null;
        Achievements.recordWaveComplete(_achLevelId);
        if (Achievements.recordSurvivor) Achievements.recordSurvivor(player.hp, player.maxHp || 100);
      }
    } catch (eAchW) {}
    // Daily challenges: record wave + score
    try {
      if (typeof DailyChallenges !== 'undefined') {
        DailyChallenges.recordWave();
        DailyChallenges.recordScore(player.score);
        if (player.waveDamageTaken === 0) DailyChallenges.recordNoDamageWave();
      }
    } catch (eDCW) {}
    // Radio chatter on wave clear
    if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('wave_clear');
    // Achievement checks
    if (typeof Feedback !== 'undefined') {
      if (currentWave >= 5) Feedback.unlockAchievement('SURVIVOR');
      if (currentWave >= 10) Feedback.unlockAchievement('WAVE_10');
      if (player.waveDamageTaken === 0) Feedback.unlockAchievement('NO_DAMAGE');
      var waveElapsed = (performance.now() - player.waveStartTime) / 1000;
      if (waveElapsed < 30) Feedback.unlockAchievement('SPEED_RUN');
    }
    // Journal unlocks by wave
    if (typeof Progression !== 'undefined') {
      if (currentWave >= 3) Progression.unlockJournalEntry('entry_flanking');
      if (currentWave >= 5) Progression.unlockJournalEntry('entry_shield');
      if (currentWave >= 7) Progression.unlockJournalEntry('entry_mortar');
    }

    // ── B28: Side objective check (must run BEFORE stats reset) ──
    if (typeof MissionSystem !== 'undefined' && MissionSystem.checkSideObjective) {
      var waveElapsed2 = (performance.now() - player.waveStartTime) / 1000;
      var _ammoPercent = 50;
      try {
        var _wst = Weapons.getState(); var _wdef = Weapons.getCurrent();
        if (_wst && _wdef && (_wdef.clipSize + _wdef.maxReserve) > 0)
          _ammoPercent = Math.round((_wst.clip + _wst.reserve) / (_wdef.clipSize + _wdef.maxReserve) * 100);
      } catch (e) {}
      var sideResult = MissionSystem.checkSideObjective({
        damageTaken: player.waveDamageTaken,
        kills: player.waveKills,
        headshots: player.waveHeadshots,
        waveTime: waveElapsed2,
        shotsFired: player.waveShots,
        shotsHit: player.waveHits,
        hpAtEnd: player.hp,
        ammoPercent: _ammoPercent,
        meleeKills: player.waveMeleeKills,
        firstKillTime: player.waveFirstKillTime,
        undetectedTime: 0,
        maxExplosiveKill: player.waveMaxExplosiveKill,
      });
      if (sideResult && sideResult.completed) {
        if (typeof Marketplace !== 'undefined' && Marketplace.awardCustomOKC) {
          Marketplace.awardCustomOKC(sideResult.reward, 'side_objective', {
            name: sideResult.name || 'side-objective', wave: currentWave,
          }).then(function () {
            if (HUD && HUD.updateOKC) HUD.updateOKC(Marketplace.getOKC());
          });
        } else if (typeof Marketplace !== 'undefined') {
          Marketplace.addOKC(sideResult.reward);
        }
        HUD.notifyPickup('⭐ SIDE OBJ COMPLETE: ' + sideResult.name + ' (+' + sideResult.reward + ' OKC)', '#ffdd00');
      }
      if (MissionSystem.generateSideObjective) MissionSystem.generateSideObjective();
    }

    // Snapshot wave stats before resetting (used by shop display and B31 achievements)
    var _snapWaveKills = player.waveKills;
    var _snapWaveShots = player.waveShots;
    var _snapWaveHits = player.waveHits;
    var _snapWaveDmg = player.waveDamageTaken;
    var _snapWaveTime = Math.round((performance.now() - (player.waveStartTime || performance.now())) / 1000);

    // Show wave medals
    if (typeof Medals !== 'undefined') {
      var _medalStats = {
        kills: _snapWaveKills || 0,
        headshots: player.waveHeadshots || 0,
        shots: _snapWaveShots || 0,
        waveHits: _snapWaveHits || 0,
        damageTaken: _snapWaveDmg || 0,
        waveTime: _snapWaveTime || 0,
        survived: player.hp > 0,
        healsUsed: player.waveBandagesUsed || 0,
        explosiveKills: player.waveExplosiveKills || 0,
        vehicleKills: player.waveVehicleKills || 0,
        hp: player.hp,
        ammoUsed: _snapWaveShots || 0,
      };
      var _waveMedals = Medals.evaluateWave(_medalStats);
      if (_waveMedals.length > 0) Medals.showWaveMedals(_waveMedals, currentWave);
    }

    // Reset wave stats (AFTER all tracking above)
    player.waveKills = 0;
    player.waveShots = 0;
    player.waveHits = 0;
    player.waveHeadshots = 0;
    player.waveDamageTaken = 0;
    player.waveMeleeKills = 0;
    player.waveFirstKillTime = 999;
    player.waveMaxExplosiveKill = 0;

    // ── Weapon unlock on wave clear: 1 new weapon per wave ──
    var newWep = Weapons.unlockNext();
    if (newWep >= 0) {
      HUD.setWeapon(Weapons.getCurrentName(), Weapons.getCurrentIdx());
      if (HUD.showWeaponUnlockCard && Weapons.getWeaponDef) HUD.showWeaponUnlockCard(Weapons.getWeaponDef(newWep));
    }

    // ── NPC reinforcement: replace losses, keep force viable ──
    if (typeof NPCSystem !== 'undefined') {
      var aliveNPCs = NPCSystem.getCount();
      if (aliveNPCs < 12) {
        var reinforceCount = Math.min(3, 12 - aliveNPCs);
        for (var ri = 0; ri < reinforceCount; ri++) {
          var rAngle = Math.random() * Math.PI * 2;
          var rDist = 6 + Math.random() * 8;
          var rnx = player.position.x + Math.cos(rAngle) * rDist;
          var rnz = player.position.z + Math.sin(rAngle) * rDist;
          var rnh = VoxelWorld.getTerrainHeight(rnx, rnz);
          var rRank = Math.random() < 0.3 ? 'veteran' : 'infantry';
          NPCSystem.spawn(rnx, rnh, rnz, rRank);
        }
        HUD.notifyPickup('🔄 Reinforcements arrived! (+' + reinforceCount + ')', '#44ff88');
      }
    }

    // ── B27: Economy wave hooks ──
    if (typeof Economy !== 'undefined') {
      Economy.produce(); // production cycle per wave
      if (Economy.processInvestments) Economy.processInvestments();
      if (Economy.triggerRandomEvent && Math.random() < 0.3) {
        Economy.triggerRandomEvent();
        var evt = Economy.getActiveEvent ? Economy.getActiveEvent() : null;
        if (evt) HUD.notifyPickup('📢 ' + evt.name, '#ffaa00');
      }
      if (Economy.refreshBlackMarket) Economy.refreshBlackMarket();
    }

    // ── B31: Achievement checks on wave clear ──
    if (typeof Progression !== 'undefined' && Progression.checkAchievement) {
      Progression.checkAchievement('SURVIVOR', currentWave);
      Progression.checkAchievement('SLAYER', player.kills);
      Progression.checkAchievement('HEADHUNTER', player.totalHeadshots);
      if (_snapWaveDmg === 0) Progression.checkAchievement('IRONMAN', 1);
      if (typeof Marketplace !== 'undefined') Progression.checkAchievement('WEALTHY', Marketplace.getOKC());
      Progression.checkAchievement('LEGENDARY', player.level);
      if (Progression.addSeasonXP) Progression.addSeasonXP(50 + currentWave * 10);
    }

    // ── B32: Weather forecast & temperature update ──
    if (typeof WeatherSystem !== 'undefined') {
      if (WeatherSystem.generateForecast) WeatherSystem.generateForecast();
      if (WeatherSystem.updateTemperature) {
        var _tsInfo = typeof TimeSystem !== 'undefined' ? TimeSystem.getInfo() : null;
        var tod = _tsInfo ? _tsInfo.timeOfDay : 0.5;
        var season = _tsInfo ? _tsInfo.season : 'Summer';
        WeatherSystem.updateTemperature(tod, season);
      }
    }

    // Trigger a random battlefield event between waves (from wave 2+)
    if (currentWave >= 3) {
      setTimeout(triggerBattlefieldEvent, 1500);
    }

    const stageDef = STAGES[currentStage];

    // Check if all waves in this stage are done
    if (currentWave >= stageDef.wavesPerStage) {
      // Stage clear!
      // Stage clear bonus
      player.score += 1000; // Stage clear bonus
      HUD.setScore(player.score);
      if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('stage_clear');

      // Auto-save checkpoint on stage clear
      saveGame();

      // Track highest stage reached for save/load
      if (typeof Progression !== 'undefined' && Progression.setHighestStage) {
        Progression.setHighestStage(currentStage + 1);
        Progression.save();
      }

      // Play-to-Earn: OKC for stage clear
      if (typeof Marketplace !== 'undefined') {
        Marketplace.onStageClear();
        HUD.updateOKC(Marketplace.getOKC());
        // Off-chain NFT badge mint for veteran stages
        if (Marketplace.mintStageBadge) {
          var stageDefForBadge = STAGES[currentStage];
          var minted = Marketplace.mintStageBadge(stageDefForBadge && stageDefForBadge.id);
          if (minted && HUD.notifyPickup) {
            HUD.notifyPickup('🏅 NFT BADGE MINTED — view in Marketplace', '#ffcc44');
          }
        }
      }

      if (currentStage >= STAGES.length - 1) {
        // Final stage cleared — win!
        gameState = STATE.WIN;
        if (window.AudioSystem.playMusic) window.AudioSystem.playMusic('victory');
        showOverlay('win');
        document.getElementById('win-score').textContent = player.score;
        document.getElementById('win-kills').textContent = player.kills;
        document.getElementById('win-stages').textContent = STAGES.length;
        return;
      }

      // Show level grade overlay
      if (typeof HUD !== 'undefined' && HUD.showLevelGrade) {
        var _gradeStats = {
          levelName: stageDef ? stageDef.name : 'MISSION',
          score: player.score || 0,
          kills: player.kills || 0,
          headshots: player.headshots || player.waveHeadshots || 0,
          shots: player.shots || player.waveShots || 0,
          damageTaken: player.totalDamageTaken || player.waveDamageTaken || 0,
          wavesCompleted: currentWave || 0,
          totalWaves: stageDef ? (stageDef.wavesPerLevel || stageDef.wavesPerStage || 7) : 7,
          time: ((performance.now() - (player.stageStartTime || performance.now())) / 1000)
        };
        HUD.showLevelGrade(_gradeStats);
      }

      // Submit level record to leaderboard
      if (typeof Leaderboard !== 'undefined' && Leaderboard.submitLevelRecord && stageDef) {
        var _stageAcc = (player.stageShots || 0) > 0
          ? Math.round(((player.stageHits || 0) / (player.stageShots || 1)) * 100) : 0;
        Leaderboard.submitLevelRecord(stageDef.id, player.score, player.kills, currentWave, _stageAcc);
      }

      // Show stage clear overlay
      gameState = STATE.STAGE_CLEAR;
      if (typeof EnemyChatter !== 'undefined') EnemyChatter.clear();
      if (typeof ExplosiveBarrels !== 'undefined') ExplosiveBarrels.clear();
      if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playLevelComplete) window.AudioSystem.playLevelComplete();
      // Daily challenges: record level complete
      try { if (typeof DailyChallenges !== 'undefined') DailyChallenges.recordLevel(); } catch (eDCL) {}

      // ── Mission Debrief (shown before stage-clear overlay) ──────────────
      var _debriefAcc = (player.stageShots || 0) > 0
        ? Math.round(((player.stageHits || 0) / (player.stageShots || 1)) * 100) : 0;
      var _debriefStats = {
        levelName: stageDef ? stageDef.name : 'UNKNOWN',
        kills: player.kills || 0,
        totalEnemies: player.kills || 0,
        headshots: player.stageHeadshots || player.totalHeadshots || 0,
        accuracy: _debriefAcc,
        timeSeconds: Math.floor((_levelStartTime ? (Date.now() - _levelStartTime) / 1000 : 0)),
        score: player.score || 0,
        medals: window._lastWaveMedals || []
      };
      function _showStageClearOverlay() {
        showOverlay('stageclear');
        var _scn = document.getElementById('stageclear-num');   if (_scn) _scn.textContent = stageDef.id;
        var _scna = document.getElementById('stageclear-name'); if (_scna) _scna.textContent = stageDef.name;
        var _scs = document.getElementById('stageclear-score'); if (_scs) _scs.textContent = player.score;
        var _sck = document.getElementById('stageclear-kills'); if (_sck) _sck.textContent = player.kills;
        // Show heal preview
        var missingHp = player.maxHp - player.hp;
        var healAmount = Math.ceil(missingHp * 0.5);
        var healEl = document.getElementById('stageclear-heal');
        if (healEl) {
          healEl.textContent = healAmount > 0
            ? '❤ +' + healAmount + ' HP will be restored'
            : '❤ Full health!';
        }
        var nextStageDef = STAGES[currentStage + 1];
        var _scnn = document.getElementById('stageclear-next-name');   if (_scnn) _scnn.textContent = nextStageDef ? nextStageDef.name : 'VICTORY';
        var _scnl = document.getElementById('stageclear-next-label');  if (_scnl) _scnl.style.display = nextStageDef ? '' : 'none';
        // Defensive: ensure no lingering auto-countdown can bypass stage clear
        if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
        // Show perk select overlay after stage clear (300ms delay so stage clear screen shows first)
        if (typeof Perks !== 'undefined') {
          setTimeout(function() {
            if (typeof HUD !== 'undefined' && HUD.hide) HUD.hide(); // hide HUD temporarily
            Perks.showPerkSelect(player, function(perkId) {
              if (typeof HUD !== 'undefined' && HUD.show) HUD.show(); // restore HUD
            });
          }, 1800);
        }
      }
      if (window.MissionDebrief) {
        MissionDebrief.show(_debriefStats, function() {
          _showStageClearOverlay();
        });
      } else {
        // Fallback: original flow without debrief
        _showStageClearOverlay();
      }
      return;
    }

    gameState = STATE.WAVE_CLEAR;
    if (typeof KillStreak !== 'undefined') KillStreak.onWaveClear();
    showOverlay('waveclear');
    var _wvn = document.getElementById('waveclear-num');   if (_wvn) _wvn.textContent = currentWave;
    var _wvt = document.getElementById('waveclear-total'); if (_wvt) _wvt.textContent = stageDef.wavesPerStage;
    var _wvi = document.getElementById('waveclear-stage-info');
    if (_wvi) _wvi.textContent = 'Stage ' + stageDef.id + ': ' + stageDef.name;

    // Populate wave shop stats
    var shopKills = document.getElementById('shop-kills');
    var shopAcc = document.getElementById('shop-accuracy');
    var shopTime = document.getElementById('shop-time');
    var shopBal = document.getElementById('shop-balance');
    var shopNext = document.getElementById('shop-next-wave');
    var shopEnemies = document.getElementById('shop-next-enemies');
    if (shopKills) shopKills.textContent = 'Kills: ' + (_snapWaveKills || 0);
    if (shopAcc) {
      var acc = _snapWaveShots > 0 ? Math.round((_snapWaveHits / _snapWaveShots) * 100) : 0;
      shopAcc.textContent = 'Accuracy: ' + acc + '%';
    }
    if (shopTime) shopTime.textContent = 'Time: ' + _snapWaveTime + 's';
    if (shopBal && typeof Economy !== 'undefined') shopBal.textContent = '\u{1F4B0} ' + Economy.getCurrency() + ' OKC';
    if (shopNext) shopNext.textContent = 'Wave ' + (currentWave + 1);
    if (shopEnemies) {
      var nextCount = 3 + currentWave * 2;
      shopEnemies.textContent = nextCount + ' enemies incoming';
    }
    // Reset shop buttons
    var shopBtns = document.querySelectorAll('.shop-buy-btn');
    for (var si = 0; si < shopBtns.length; si++) {
      shopBtns[si].disabled = false;
      shopBtns[si].style.borderColor = '';
      shopBtns[si].style.color = '';
    }
    // Restore button text
    var btnTexts = { health: '\u2764\uFE0F Health +50 \u00B7 40 OKC', armor: '\uD83D\uDEE1\uFE0F Armor Pack \u00B7 60 OKC', ammo: '\uD83D\uDD2B Full Ammo \u00B7 30 OKC', stim: '\uD83D\uDC89 Stim Pack \u00B7 50 OKC' };
    for (var si2 = 0; si2 < shopBtns.length; si2++) {
      var itemId = shopBtns[si2].getAttribute('data-item');
      if (btnTexts[itemId]) shopBtns[si2].textContent = btnTexts[itemId];
    }
    // Auto-start countdown (5s) — short so wave-clear feels snappy.
    // Click anywhere on the overlay or press SPACE to skip immediately.
    if (window._shopCountdownId) clearInterval(window._shopCountdownId);
    var _shopSec = 5;
    var countdownEl = document.getElementById('shop-countdown');
    if (countdownEl) countdownEl.textContent = _shopSec;
    window._shopCountdownId = setInterval(function () {
      _shopSec--;
      if (countdownEl) countdownEl.textContent = _shopSec;
      if (_shopSec <= 0) {
        clearInterval(window._shopCountdownId);
        window._shopCountdownId = null;
        var nwBtn = document.getElementById('next-wave-btn');
        if (nwBtn) nwBtn.click();
      }
    }, 1000);
    // Tap-to-skip / Space-to-skip. 300ms grace period prevents a stray
    // mouseup (from killing the last enemy) from instantly skipping the
    // shop the player wanted to use. Re-armed on every wave-clear.
    var ovWC = document.getElementById('overlay-waveclear');
    if (ovWC) {
      ovWC.__skipArmedAt = Date.now() + 300;
      if (!ovWC.__skipBound) {
        ovWC.__skipBound = true;
        var skip = function (e) {
          if (Date.now() < (ovWC.__skipArmedAt || 0)) return;
          // Don't skip when the user clicked a shop button or the next-wave button itself.
          if (e && e.target) {
            var cls = e.target.classList;
            if ((cls && cls.contains && cls.contains('shop-buy-btn')) || e.target.id === 'next-wave-btn') return;
          }
          if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
          var nwBtn = document.getElementById('next-wave-btn');
          if (nwBtn) nwBtn.click();
        };
        ovWC.addEventListener('click', skip);
        ovWC.addEventListener('touchstart', skip, { passive: true });
        // Single window-level keydown listener (NOT re-added per wave).
        window.addEventListener('keydown', function (e) {
          if (e.code === 'Space' && ovWC.style.display !== 'none') { e.preventDefault(); skip(e); }
        });
      }
    }
    } catch (e) { console.error('[onWaveComplete] error:', e); }
  }

  /* ── Player Movement ─────────────────────────────────────────────── */
  function updatePlayer(delta) {
    // Apply touch look rotation (drag on look zone)
    if (isMobile && (touch.lookX !== 0 || touch.lookY !== 0)) {
      CameraSystem.handleMouseMove(touch.lookX * 4.0, touch.lookY * 4.0);
      touch.lookX = 0;
      touch.lookY = 0;
    }
    // Apply aim joystick rotation (right-side digital joystick)
    if (isMobile && touch.aimActive && (touch.aimX !== 0 || touch.aimY !== 0)) {
      CameraSystem.handleMouseMove(touch.aimX * 14.0, touch.aimY * 14.0);
      // Don't zero aimX/aimY — joystick holds its position like an analog stick
    }
    // Apply gyro look rotation (additive to touch / aim joystick)
    if (isMobile && touch.gyroEnabled && (touch.gyroDX !== 0 || touch.gyroDY !== 0)) {
      CameraSystem.handleMouseMove(touch.gyroDX, touch.gyroDY);
      touch.gyroDX = 0;
      touch.gyroDY = 0;
    }

    // Skip if in drone or vehicle
    if (DroneSystem.isPossessing() || VehicleSystem.isInVehicle()) return;
    if (CameraSystem.getMode() === CameraSystem.MODE.STRATEGIC) return;
    // Gyro auto-assist: when gyro is on, gently pull crosshair toward nearest enemy
    if (isMobile && touch.gyroEnabled && touch.gyroAutoAssist && typeof Enemies !== 'undefined' && Enemies.getAll) {
      var _gaList = Enemies.getAll();
      if (_gaList && _gaList.length > 0) {
        var _gy = CameraSystem.getYaw(), _gp = CameraSystem.getPitch();
        var _gpx = _camera.position.x, _gpy = _camera.position.y, _gpz = _camera.position.z;
        var _bestG = null, _bestGAng = 0.35, _gdx = 0, _gdy = 0, _gd = 0;
        for (var gi = 0; gi < _gaList.length; gi++) {
          var ge = _gaList[gi];
          if (!ge || !ge.alive || !ge.mesh) continue;
          var gx = ge.mesh.position.x - _gpx;
          var gy = (ge.mesh.position.y + 1.0) - _gpy;
          var gz = ge.mesh.position.z - _gpz;
          var gdist2 = gx * gx + gz * gz;
          if (gdist2 < 4 || gdist2 > 6400) continue;
          var gdist = Math.sqrt(gdist2);
          var gey = Math.atan2(-gx, -gz);
          var gdy = gey - _gy; while (gdy > Math.PI) gdy -= 2 * Math.PI; while (gdy < -Math.PI) gdy += 2 * Math.PI;
          var gep = Math.atan2(gy, gdist);
          var gdp = gep - _gp;
          var gang = Math.sqrt(gdy * gdy + gdp * gdp);
          if (gang < _bestGAng) { _bestGAng = gang; _bestG = ge; _gdx = gdy; _gdy = gdp; _gd = gdist; }
        }
        if (_bestG) {
          var gpull = 0.04 * Math.max(0.25, 1.0 - _gd / 80);
          CameraSystem.setYaw(_gy + _gdx * gpull);
          CameraSystem.setPitch(_gp + _gdy * gpull);
        }
      }
    }

    // ── Mobile aim assist: gentle magnetism toward nearest enemy in cone ──
    // Helps thumb-aim feel responsive without auto-aim-bot behavior.
    if (isMobile && typeof Enemies !== 'undefined' && Enemies.getAll) {
      var _aaList = Enemies.getAll();
      if (_aaList && _aaList.length > 0) {
        var camYaw = CameraSystem.getYaw();
        var camPitch = CameraSystem.getPitch();
        var px = _camera.position.x, py = _camera.position.y, pz = _camera.position.z;
        var bestE = null, bestAng = 0.18; // ~10° cone
        var bestDx = 0, bestDy = 0, bestDist = 0;
        for (var aai = 0; aai < _aaList.length; aai++) {
          var en = _aaList[aai];
          if (!en || !en.alive || !en.mesh) continue;
          var ex = en.mesh.position.x - px;
          var ey = (en.mesh.position.y + 1.0) - py;
          var ez = en.mesh.position.z - pz;
          var d2 = ex * ex + ez * ez;
          if (d2 < 1 || d2 > 3600) continue; // 1m–60m
          var dist = Math.sqrt(d2);
          var enYaw = Math.atan2(-ex, -ez);
          var dy = enYaw - camYaw;
          while (dy > Math.PI) dy -= 2 * Math.PI;
          while (dy < -Math.PI) dy += 2 * Math.PI;
          var enPitch = Math.atan2(ey, dist);
          var dp = enPitch - camPitch;
          var ang = Math.sqrt(dy * dy + dp * dp);
          if (ang < bestAng) {
            bestAng = ang;
            bestE = en;
            bestDx = dy;
            bestDy = dp;
            bestDist = dist;
          }
        }
        if (bestE) {
          // Stronger pull when firing; falls off with distance
          var pull = (touch.firing || mouseDown) ? 0.18 : 0.06;
          pull *= Math.max(0.3, 1.0 - bestDist / 60);
          CameraSystem.setYaw(camYaw + bestDx * pull);
          CameraSystem.setPitch(camPitch + bestDy * pull);
        }
      }
    }

    const yaw = CameraSystem.getYaw();
    const forward = _gmTmp1.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right   = _gmTmp2.set(Math.cos(yaw), 0, -Math.sin(yaw));

    const moveDir = _gmTmp3.set(0, 0, 0);

    // Keyboard movement
    if (keys['KeyW'] || keys['ArrowUp'])    moveDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown'])  moveDir.sub(forward);
    if (keys['KeyA'] || keys['ArrowLeft'])  moveDir.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(right);

    // Strafe direction for camera roll
    var _sDir = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) _sDir -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) _sDir += 1;
    if (CameraSystem.setStrafeDir) CameraSystem.setStrafeDir(_sDir);

    // Touch joystick movement (additive)
    if (isMobile && touch.moveActive) {
      // Deadzone — ignore micro thumb jitter (5% radius), then remap remaining range to 0..1
      var jx = touch.moveX, jy = touch.moveY;
      var jmag = Math.sqrt(jx * jx + jy * jy);
      var dz = 0.12;
      if (jmag < dz) { jx = 0; jy = 0; }
      else {
        var rescale = (jmag - dz) / (1 - dz) / jmag;
        jx *= rescale; jy *= rescale;
      }
      moveDir.addScaledVector(forward, -jy);
      moveDir.addScaledVector(right, jx);
    }

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) {
      moveDir.normalize();
      var wasSprinting = player.sprinting;
      player.sprinting = window.StaminaSystem ? StaminaSystem.isSprinting() : (!!keys['ShiftLeft'] || touch.sprinting);
      // Dismiss sprint tip on first sprint
      if (player.sprinting && !wasSprinting && typeof Feedback !== 'undefined' && Feedback.dismissTip) {
        Feedback.dismissTip('sprint');
      }
      // Cancel reload when sprinting
      if (player.sprinting && Weapons.isReloading()) {
        Weapons.cancelReload();
      }
      var _sprintMult = window.StaminaSystem ? (StaminaSystem.isSprinting() ? 1.8 : 1.0) : (player.sprinting ? SPRINT_MULT : 1);
      var speed = MOVE_SPEED * _sprintMult * (player.prone ? 0.3 : 1);
      // Stim boost: +60% speed while active
      if (player._stimTimer && player._stimTimer > 0) speed *= 1.6;
      // Kill momentum speed boost
      if (player._killSpeedTimer && player._killSpeedTimer > 0) {
        player._killSpeedTimer -= delta;
        speed *= (1 + (player._killSpeedBoost || 0));
      }
      // Weather speed modifier
      if (typeof WeatherSystem !== 'undefined' && WeatherSystem.getModifiers) {
        speed *= WeatherSystem.getModifiers().speedMod;
      }
      // ── B31: Skill passive speed bonus ──
      if (typeof SkillSystem !== 'undefined' && SkillSystem.getPassiveBonus) {
        speed *= SkillSystem.getPassiveBonus('moveSpeed');
      }
      // ── Loadout speed bonus ──
      if (window._loadoutSpeedMult) speed *= window._loadoutSpeedMult;
      // ── ADS speed reduction (0.65 while aiming down sights) ──
      if (window._adsSpeedMult && window._adsSpeedMult !== 1.0) speed *= window._adsSpeedMult;
      // ── B24: Crouch speed reduction (CrouchSystem overrides) ──
      var _crouchMult = (window.CrouchSystem ? CrouchSystem.getSpeedMult() : (player.isCrouching ? 0.5 : 1.0));
      speed *= _crouchMult;
      // ── B32: Blizzard slow ──
      if (player._blizzardSlow) speed *= player._blizzardSlow;
      // ── Landing impact slow ──
      if (player._landSlowTimer && player._landSlowTimer > 0) {
        player._landSlowTimer -= delta;
        speed *= 0.4;
      }
      // Grapple reduces WASD effectiveness to 30% while attached
      if (window.Grapple && Grapple.isActive()) speed *= Grapple.movementMultiplier();
      moveDir.multiplyScalar(speed * delta);

      // Stamina drain on sprint
      if (player.sprinting && player.stamina > 0) {
        player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN_RATE * delta);
        if (player.stamina <= 0) {
          player.sprinting = false; // exhausted
        }
      }

      if (player.sprinting) SkillSystem.onSprint();
    } else {
      // Stamina regen when not sprinting
      player.stamina = Math.min(1.0, player.stamina + STAMINA_REGEN_RATE * delta);
    }

    // Decay stim timer
    if (player._stimTimer && player._stimTimer > 0) {
      player._stimTimer -= delta;
    }

    // ── B24: Crouch height + slide + cover detection ──
    if (!player.prone) {
      var targetH = player.isCrouching ? 1.1 : 1.7;
      player.height += (targetH - player.height) * Math.min(1, delta * 12);
    }
    if (player.slideTimer > 0) {
      player.slideTimer -= delta;
      if (player.slideDir) {
        var slideSpeed = 12 * (player.slideTimer / 0.6);
        moveDir.addScaledVector(player.slideDir, slideSpeed * delta);
      }
      if (player.slideTimer <= 0) player.slideDir = null;
    }
    // Cover: if crouching and there's a solid block adjacent at head height
    if (player.isCrouching) {
      var headY = player.position.y + 0.5;
      var cx = player.position.x, cz = player.position.z;
      player.inCover = window.VoxelWorld.isSolid(cx + 1, headY, cz) || window.VoxelWorld.isSolid(cx - 1, headY, cz) ||
            window.VoxelWorld.isSolid(cx, headY, cz + 1) || window.VoxelWorld.isSolid(cx, headY, cz - 1);
    } else {
      player.inCover = false;
    }

    // Gravity (reduced while grapple or wingsuit is active)
    var _gravMult = (window.Grapple && Grapple.isActive()) ? Grapple.gravityMultiplier()
                  : (window.Wingsuit && Wingsuit.isActive()) ? Wingsuit.gravityMultiplier()
                  : 1.0;
    player.velocity.y -= GRAVITY * _gravMult * delta;

    // Jump (keyboard or touch)
    if ((keys['Space'] || touch.jumping) && player.onGround) {
      player.velocity.y = JUMP_SPEED;
      player.onGround = false;
      touch.jumping = false;
    }

    // Apply movement
    const newPos = _gmNewPos.copy(player.position);
    newPos.x += moveDir.x;
    newPos.z += moveDir.z;
    newPos.y += player.velocity.y * delta;

    // Terrain collision — use getTopSolidY so player snaps to actual voxel surface
    // (not procedural noise) for consistency with enforcePlayerGroundSnap().
    var _solidH = (typeof window.VoxelWorld.getTopSolidY === 'function')
      ? window.VoxelWorld.getTopSolidY(newPos.x, newPos.z)
      : window.VoxelWorld.getTerrainHeight(newPos.x, newPos.z) + 1;
    const terrainH = _solidH + player.height;

    // Horizontal block collision — radius-aware so player can't clip through walls
    const checkH = newPos.y - player.height + 0.5;
    var _blockedX = false, _blockedZ = false;
    // Check four corners of the player's bounding cylinder
    var _corners = [
      { x: newPos.x + PLAYER_RADIUS, z: newPos.z + PLAYER_RADIUS },
      { x: newPos.x + PLAYER_RADIUS, z: newPos.z - PLAYER_RADIUS },
      { x: newPos.x - PLAYER_RADIUS, z: newPos.z + PLAYER_RADIUS },
      { x: newPos.x - PLAYER_RADIUS, z: newPos.z - PLAYER_RADIUS },
    ];
    for (var _ci = 0; _ci < _corners.length; _ci++) {
      if (window.VoxelWorld.isSolid(_corners[_ci].x, checkH, _corners[_ci].z)) {
        // Determine which axis is primarily blocked by comparing against current position
        if (window.VoxelWorld.isSolid(_corners[_ci].x, checkH, player.position.z)) _blockedX = true;
        if (window.VoxelWorld.isSolid(player.position.x, checkH, _corners[_ci].z)) _blockedZ = true;
      }
    }
    if (_blockedX || _blockedZ) {
      // Try mantling over a wall when blocked horizontally and not on ground
      if (!player.onGround && typeof Traversal !== 'undefined' && !Traversal.isMantling()) {
        _gmTmp2.set(0, 0, -1).applyQuaternion(_camera.quaternion);
        Traversal.tryMantle(player.position, player.velocity.y, { x: _gmTmp2.x, z: _gmTmp2.z }, function (bx, by, bz) {
          return window.VoxelWorld.getBlock(bx, by, bz);
        });
      }
      // Slide along whichever axis is still free
      if (!_blockedX) {
        newPos.z = player.position.z;
      } else if (!_blockedZ) {
        newPos.x = player.position.x;
      } else {
        newPos.x = player.position.x;
        newPos.z = player.position.z;
      }
    }

    if (newPos.y <= terrainH + GROUND_SNAP_EPS && player.velocity.y <= 0) {
      if (newPos.y < terrainH - 0.02) {
        newPos.y = terrainH;
        if (player.velocity.y < 0) player.velocity.y = 0;
        player.onGround = true;
      } else {
      newPos.y = terrainH;
      // Landing impact detection
      if (!player.onGround && player.velocity.y < -2) {
        var fallSpeed = Math.abs(player.velocity.y);
        var landIntensity = Math.min(1, fallSpeed / 15);
        if (landIntensity > 0.1) {
          if (CameraSystem.shake) CameraSystem.shake(landIntensity * 0.03, 0.2);
          if (Weapons.applyLandingBob) Weapons.applyLandingBob(landIntensity);
          if (window.AudioSystem && window.AudioSystem.playLandingThud) window.AudioSystem.playLandingThud(landIntensity);
          if (landIntensity > 0.6) player._landSlowTimer = 0.3;
          // Landing dust burst — number of puffs scales with fall intensity
          if (_scene && landIntensity > 0.2) {
            var _puffN = 2 + Math.floor(landIntensity * 4);
            for (var _li = 0; _li < _puffN; _li++) _spawnFootstepPuff();
          }
        }
      }
      player.velocity.y = 0;
      player.onGround = true;
      }
    } else {
      player.onGround = false;
    }

    player.position.copy(newPos);

    // Grapple update — must run after player.position is committed
    if (window.Grapple) Grapple.update(delta, player.position, _camera);
    // ZiplineGrapple update — runs after physics
    if (window.ZiplineGrapple) ZiplineGrapple.update(delta);
    // Wingsuit update — runs after physics, passes player object and key state
    if (window.Wingsuit) Wingsuit.update(delta, player, keys);

    // Update camera
    CameraSystem.update(delta, player.position, isMoving, player.onGround);
    // Update kill cam override (blocks mouse-look while active)
    if (CameraSystem.updateKillCam) CameraSystem.updateKillCam(delta);
    // Update suppression visual
    updateSuppression(delta);

    // Player footstep sounds
    if (isMoving && player.onGround && typeof AudioSystem !== 'undefined') {
      player._footstepTimer = (player._footstepTimer || 0) - delta;
      if (player._footstepTimer <= 0) {
        var _fsType = 0;
        if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.getBlock) {
          _fsType = window.VoxelWorld.getBlock(
            Math.floor(player.position.x),
            Math.floor(player.position.y - 1),
            Math.floor(player.position.z)
          ) || 0;
        }
        if (window.AudioSystem && window.AudioSystem.playFootstep) window.AudioSystem.playFootstep(_fsType);
        // Footstep dust puff (only when sprinting — visible movement polish)
        if (player.sprinting && _scene) _spawnFootstepPuff();
        player._footstepTimer = player.sprinting ? 0.28 : 0.42;
      }
    }
    _updateFootstepPuffs(delta);
    _updateThreatBehind();
  }

  /* ── Combat ──────────────────────────────────────────────────────── */
  function updateCombat(delta) {
    // Drone combat: LMB triggers drone action
    if (DroneSystem.isPossessing()) {
      if (mouseDown || touch.firing) {
        const drone = DroneSystem.getPossessed();
        if (drone) {
          if (drone.type === 'fpv_attack') {
            DroneSystem.fireAttack(drone.id);
          } else if (drone.type === 'bomb' && drone.hasPayload) {
            DroneSystem.dropPayload(drone.id);
          } else if ((drone.type === 'incendiary' || drone.type === 'baba_yaga') && drone.hasPayload) {
            DroneSystem.dropFire(drone.id);
            if (drone.type === 'baba_yaga') HUD.notifyPickup('🔥 THERMITE DROPPED!', '#ff8800');
          }
        }
        mouseNewPress = false;
      }
      return;
    }

    // Vehicle combat: LMB triggers turret fire
    if (VehicleSystem.isInVehicle()) {
      if (mouseDown || touch.firing) {
        VehicleSystem.setVehicleKey('fire', true);
      } else {
        VehicleSystem.setVehicleKey('fire', false);
      }
      return;
    }

    if (CameraSystem.getMode() === CameraSystem.MODE.STRATEGIC) return;

    if (mouseDown || touch.firing) {
      const targets = Enemies.getEnemyMeshes().slice();
      // Add vehicle meshes as targets so player can damage/destroy vehicles
      var allVehicles = VehicleSystem.getAll();
      for (var vi = 0; vi < allVehicles.length; vi++) {
        var veh = allVehicles[vi];
        if (veh.mesh && veh !== VehicleSystem.getOccupied()) {
          targets.push(veh.mesh);
        }
      }
      // Add drone meshes as targets so player can shoot down enemy AND friendly drones (friendly fire allowed)
      if (typeof DroneSystem !== 'undefined' && DroneSystem.getAllMeshes) {
        var droneMeshes = DroneSystem.getAllMeshes();
        for (var dmi = 0; dmi < droneMeshes.length; dmi++) {
          targets.push(droneMeshes[dmi]);
        }
      }
      // Add friendly NPC meshes for friendly-fire
      var _npcMeshes = [];
      if (typeof NPCSystem !== 'undefined' && NPCSystem.getAll) {
        var _npcList = NPCSystem.getAll();
        for (var ni = 0; ni < _npcList.length; ni++) {
          var _n = _npcList[ni];
          if (_n && _n.alive && _n.mesh) { targets.push(_n.mesh); _npcMeshes.push(_n); }
        }
      }
      const weaponType = Weapons.getCurrentType();
      const weaponId = Weapons.getCurrentId();
      // Map weapon type to audio sound type
      const audioMap = { MELEE: 'melee', PISTOL: 'pistol', ASSAULT: 'rifle', LMG: 'rifle', SNIPER: 'sniper', HMG: 'hmg', AT: 'launcher', ATGM: 'launcher', NATO: 'rifle', AT_HEAVY: 'launcher', AT_LIGHT: 'launcher', AA: 'launcher', GRENADE: 'launcher', NATO_HEAVY: 'rifle', HMG_HEAVY: 'hmg', INCENDIARY: 'launcher', MACHINEGUN: 'hmg', SMG: 'smg', AMR: 'heavy_sniper', MINIGUN: 'hmg', SILENT: 'silenced', THERMOBARIC: 'launcher', SHOTGUN: 'shotgun', MINE: 'explosive', SMOKE: 'launcher', FLASHBANG: 'launcher', EXPLOSIVE: 'explosive', GATLING: 'gatling' };
      Weapons.tryFire(_camera, targets, delta, function (hit) {
        // ── Ballistic Shield: check if player's own bullet intersects the shield ──
        if (window.BallisticShield && BallisticShield.isDeployed()) {
          var _bsRayOrigin = _camera.position.clone();
          var _bsRayDir = new THREE.Vector3();
          _camera.getWorldDirection(_bsRayDir);
          if (BallisticShield.checkBulletBlock(_bsRayOrigin, _bsRayDir)) {
            return; // bullet stopped by own deployed shield
          }
        }
        // Check if hit a drone first (mesh hierarchy tagged with userData.droneId)
        var hitDrone = null;
        if (typeof DroneSystem !== 'undefined' && DroneSystem.findByMesh) {
          hitDrone = DroneSystem.findByMesh(hit.object);
        }
        if (hitDrone) {
          var dmgD = Weapons.getDamage();
          DroneSystem.damageDrone(hitDrone.id, dmgD);
          if (typeof Tracers !== 'undefined' && Tracers.spawnImpactSpark) {
            Tracers.spawnImpactSpark(hit.point || hitDrone.position);
          }
          // Award score for downing enemy drone
          if (!hitDrone.alive && hitDrone.faction === 'russian') {
            player.score += 50;
            player.kills += 1;
            if (typeof KillStreak !== 'undefined') KillStreak.onKill();
            if (typeof HUD !== 'undefined' && HUD.addCombatLog) {
              HUD.addCombatLog('Enemy drone shot down (+50)', '#44ddff');
            }
          }
          return;
        }
        // ── Mine detonation: check if bullet hit a landmine mesh or passed near one ──
        if (typeof Mines !== 'undefined') {
          var _hitMineByMesh = hit.object && hit.object.userData && hit.object.userData.isMine;
          if (_hitMineByMesh) {
            Mines.checkBulletHit(hit.object.position.x, hit.object.position.y, hit.object.position.z, 0.8);
            return;
          }
          if (hit.point) {
            Mines.checkBulletHit(hit.point.x, hit.point.y, hit.point.z, 0.8);
          }
        }
        // ── Explosive Barrels: raycast barrel hit check ──
        if (typeof ExplosiveBarrels !== 'undefined') {
          var _bOrigin = _camera.position;
          var _bDir = new THREE.Vector3();
          _camera.getWorldDirection(_bDir);
          ExplosiveBarrels.checkBulletHit(_bOrigin, _bDir, 100);
        }
        // ── Destructibles: shootable crate/barrel/wall/glass hit check ──
        if (window.Destructibles) {
          var _dOrigin = _camera.position;
          var _dDir = new THREE.Vector3();
          _camera.getWorldDirection(_dDir);
          var _dHit = Destructibles.checkBulletHit(_dOrigin, _dDir, 100);
          if (_dHit.hit) Destructibles.damage(_dHit.object, Weapons.getDamage ? Weapons.getDamage() : 25);
        }
        // ── Vehicle Enemies: proximity hit check ──
        if (window.VehicleEnemies) {
          var _vehList = VehicleEnemies.getAll();
          for (var _vi = 0; _vi < _vehList.length; _vi++) {
            var _vehTarget = _vehList[_vi];
            if (!_vehTarget || !_vehTarget.alive || !_vehTarget.mesh) continue;
            var _vehBOrigin = _camera.position;
            var _vehBDir    = new THREE.Vector3();
            _camera.getWorldDirection(_vehBDir);
            var _vehRay = new THREE.Raycaster(_vehBOrigin, _vehBDir, 0, 100);
            var _vehHits = _vehRay.intersectObject(_vehTarget.mesh, true);
            if (_vehHits.length > 0) {
              var _vehDmg = (typeof Weapons !== 'undefined' && Weapons.getDamage) ? Weapons.getDamage() : 25;
              VehicleEnemies.damageVehicle(_vehTarget, _vehDmg);
              player.kills++;
              if (typeof KillStreak !== 'undefined' && KillStreak.onKill) KillStreak.onKill();
              if (typeof HUD !== 'undefined' && HUD.addCombatLog) HUD.addCombatLog('Vehicle hit! (' + Math.round(_vehDmg) + ' dmg)', '#ff8800');
            }
          }
        }
        // ── Friendly Fire: check if bullet hit a Ukrainian NPC ──
        var hitNPC = null;
        var _nWalk = hit.object;
        var _nGuard = 0;
        while (_nWalk && _nGuard < 8 && !hitNPC) {
          for (var _nii = 0; _nii < _npcMeshes.length; _nii++) {
            if (_npcMeshes[_nii].mesh === _nWalk) { hitNPC = _npcMeshes[_nii]; break; }
          }
          _nWalk = _nWalk.parent;
          _nGuard++;
        }
        if (hitNPC) {
          var ffDmg = Weapons.getDamage();
          if (typeof NPCSystem !== 'undefined' && NPCSystem.damage) {
            NPCSystem.damage(hitNPC.id, ffDmg);
          }
          // Penalty
          var penalty = Math.min(50, Math.max(10, Math.floor(ffDmg * 0.5)));
          player.score = Math.max(0, player.score - penalty);
          if (typeof Economy !== 'undefined' && Economy.spendCurrency) {
            Economy.spendCurrency(penalty);
          }
          if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
            HUD.notifyPickup('⚠ FRIENDLY FIRE! -' + penalty + ' OKC', '#ff2222');
          }
          // Red flash
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) {
            HUD.showDamageFlash(0.4);
          }
          return;
        }
        // Check if hit a vehicle mesh — walk up parent tree because vehicles have nested children
        var hitVehicle = null;
        var _vWalk = hit.object;
        var _vGuard = 0;
        while (_vWalk && _vGuard < 8 && !hitVehicle) {
          for (var hvi = 0; hvi < allVehicles.length; hvi++) {
            if (allVehicles[hvi].mesh === _vWalk) { hitVehicle = allVehicles[hvi]; break; }
          }
          _vWalk = _vWalk.parent;
          _vGuard++;
        }
        if (hitVehicle) {
          onVehicleHit(hitVehicle, Weapons.getDamage());
        } else {
          onEnemyHit(hit);
        }
      }, mouseNewPress);
      // Play sound on every actual shot (auto-fire included), not just first click
      if (Weapons.didFire()) {
        if (window.AudioSystem) {
          if (weaponType === 'FLASHBANG' && window.AudioSystem.playFlashbang) window.AudioSystem.playFlashbang();
          else if (weaponType === 'SMOKE' && window.AudioSystem.playSmoke) window.AudioSystem.playSmoke();
          else if (weaponType === 'MINE' && window.AudioSystem.playMine) window.AudioSystem.playMine();
          else if (window.AudioSystem.playGunshot) window.AudioSystem.playGunshot(audioMap[weaponType] || 'rifle');
        }
        // Mobile fire haptic — louder for heavy weapons
        if (isMobile && navigator.vibrate) {
          var heavyFire = ['HMG', 'HMG_HEAVY', 'MACHINEGUN', 'MINIGUN', 'AT', 'ATGM', 'AT_HEAVY', 'AT_LIGHT', 'AA', 'AMR'].indexOf(weaponType) >= 0;
          try { navigator.vibrate(heavyFire ? 22 : 8); } catch (e) {}
        }
        MLSystem.onShot(weaponId);
        player.totalShots++;
        player.waveShots++;
        player.stageShots = (player.stageShots || 0) + 1;
        // Suppression system: notify of each shot fired
        if (window._onShotFired && _camera) {
          _gmTmp2.copy(_camera.position);
          _camera.getWorldDirection(_gmTmp3);
          window._onShotFired(_gmTmp2, _gmTmp3);
        }
        // Register heat + maintenance per shot (not per hit, to avoid shotgun 8x issue)
        if (typeof CombatExtras !== 'undefined') {
          CombatExtras.registerShot();
          var isAutoWep = ['ASSAULT', 'NATO', 'NATO_HEAVY', 'LMG', 'HMG', 'SMG', 'HMG_HEAVY', 'MACHINEGUN', 'MINIGUN'].indexOf(weaponType) >= 0;
          // God mode: never overheat.
          if (!player.godMode) CombatExtras.addHeat(isAutoWep);
        }
        // Spawn bullet tracer
        if (typeof Tracers !== 'undefined' && weaponType !== 'MELEE' && weaponType !== 'SILENT') {
          _gmTmp2.copy(_camera.position);
          _camera.getWorldDirection(_gmTmp3);
          var isHeavy = ['HMG', 'HMG_HEAVY', 'MACHINEGUN', 'MINIGUN'].indexOf(weaponType) >= 0;
          var isExplosive = ['AT', 'ATGM', 'AT_HEAVY', 'AT_LIGHT', 'AA', 'GRENADE', 'INCENDIARY', 'THERMOBARIC'].indexOf(weaponType) >= 0;
          var isSniperShot = ['SNIPER', 'AMR'].indexOf(weaponType) >= 0;
          if (!isExplosive) {
            _gmNewPos.copy(_gmTmp2).addScaledVector(_gmTmp3, 0.5);
            var tracerColor = isHeavy ? 0xff4400 : (isSniperShot ? 0x66ff88 : 0xffcc44);
            Tracers.spawnTracer(_gmNewPos, _gmTmp3, tracerColor, isSniperShot ? 220 : 120);
            if (Tracers.spawnBullet) {
              Tracers.spawnBullet(_gmNewPos, _gmTmp3, tracerColor, isSniperShot ? 320 : 200);
            }
          }
          // Muzzle flash on every shot
          if (Tracers.spawnMuzzleFlash) {
            Tracers.spawnMuzzleFlash(_gmTmp2, _gmTmp3);
          }
          // Screen shake for heavy weapons
          if (isHeavy && CameraSystem.shake) {
            CameraSystem.shake(0.02, 0.1);
          }
        }
        // ── Muzzle flash PointLight burst in world-space (Task 2) ──
        doMuzzleFlash();
      }
      mouseNewPress = false;
    }
  }

  function onEnemyHit(hit) {
    const enemy = Enemies.findByMesh(hit.object);
    if (!enemy || !enemy.alive) return;

    // Pitch-shift hit marker by remaining HP — high pitch when target near death
    if (AudioSystem.playHitPitched) {
      var _hpFrac = (enemy.maxHp > 0) ? (enemy.hp / enemy.maxHp) : 1;
      AudioSystem.playHitPitched(_hpFrac);
    } else {
      AudioSystem.playHit();
    }
    // Blood splatter on hit — directional exit-wound spray
    if (typeof Tracers !== 'undefined' && Tracers.spawnBlood) {
      var _bloodPt = hit.point || enemy.mesh.position;
      var _bloodDir = null;
      try {
        if (hit.point && _camera) {
          _bloodDir = hit.point.clone().sub(_camera.position).normalize();
        }
      } catch (eBd) { _bloodDir = null; }
      Tracers.spawnBlood(_bloodPt, _bloodDir);
    }
    MLSystem.onHit(Weapons.getCurrentId());
    // AI Smart Learning: track weapon engagement range
    var engageRange = enemy.mesh.position.distanceTo(player.position);
    MLSystem.trackWeaponUse(Weapons.getCurrentId(), engageRange);
    MLSystem.trackWeaponType(Weapons.getCurrentType());
    // Track if player is being aggressive (moving toward enemies)
    MLSystem.trackCombatEngagement(engageRange < 10);

    const isHeadshot = hit.object === enemy.mesh.userData.headMesh;
    let baseDmg = Weapons.getDamage();

    // ═══ NEW: Apply ammo type and perk damage modifiers ═══
    if (typeof CombatExtras !== 'undefined') {
      var ammoMods = CombatExtras.getAmmoModifiers();
      baseDmg = Math.round(baseDmg * ammoMods.dmgMult);
    }
    // Dead eye crit check
    var isCrit = false;
    if (typeof Perks !== 'undefined' && Perks.isDeadEyeShot()) {
      baseDmg = Math.round(baseDmg * Perks.getDeadEyeMult());
      HUD.notifyPickup('🎯 DEAD EYE CRIT!', '#ff4400');
      isCrit = true;
    }
    // Prestige damage bonus
    if (typeof Progression !== 'undefined') {
      var pBonuses = Progression.getPrestigeBonuses();
      baseDmg = Math.round(baseDmg * pBonuses.damageMult);
    }
    const dmg = isHeadshot ? baseDmg * 2 : baseDmg;

    var _wepType = (typeof Weapons !== 'undefined' && Weapons.getCurrent) ? Weapons.getCurrent().type : '';
    const remaining = Enemies.damage(enemy, dmg, isHeadshot, _wepType);

    // Surrender check: low-HP enemies may raise hands
    if (window.SurrenderSystem && remaining > 0) SurrenderSystem.checkSurrender(enemy);

    if (window.BloodEffects && enemy && enemy.mesh) {
      BloodEffects.onHit(enemy.mesh.position.clone());
    }

    // Floating damage number on hit (not just kill)
    if (typeof Feedback !== 'undefined') {
      // Project enemy world position to screen so the number rises from the actual hit point
      var _dnX = window.innerWidth / 2 + (Math.random() - 0.5) * 40;
      var _dnY = window.innerHeight / 2 - 20 + (Math.random() - 0.5) * 30;
      try {
        if (enemy && enemy.mesh && _camera) {
          var _wpos = enemy.mesh.position.clone();
          _wpos.y += 1.4 + Math.random() * 0.4; // rise from upper torso
          var _proj = _wpos.project(_camera);
          if (_proj.z < 1) {
            _dnX = (_proj.x * 0.5 + 0.5) * window.innerWidth;
            _dnY = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
          }
        }
      } catch (eDN) {}
      Feedback.spawnDamageNumber(_dnX, _dnY, dmg, isHeadshot, false);
    }
    // HUD floating damage number (supplemental 3D-projected number)
    if (typeof HUD !== 'undefined' && HUD.showDamageNumber && enemy && enemy.mesh && _camera) {
      var _dmgPos = enemy.mesh.position.clone();
      _dmgPos.y += 1.5;
      _dmgPos.project(_camera);
      var _sx = (_dmgPos.x * 0.5 + 0.5) * window.innerWidth;
      var _sy = (-_dmgPos.y * 0.5 + 0.5) * window.innerHeight;
      HUD.showDamageNumber(_sx, _sy, dmg, isHeadshot);
    }
    // DamageNumbers: 3D-projected floating damage numbers above enemy head
    if (window.DamageNumbers && enemy && enemy.mesh) {
      DamageNumbers.spawnNumber(enemy.mesh.position, dmg, isHeadshot, isCrit);
    }
    // HitMarkers: crosshair flash feedback (normal / headshot / kill)
    if (window.HitMarkers) HitMarkers.flash(isHeadshot, remaining <= 0);

    SkillSystem.onShoot(true, isHeadshot);
    HUD.flashHit(isHeadshot, remaining <= 0);
    player.totalHits++;
    player.waveHits++;
    player.stageHits = (player.stageHits || 0) + 1;

    if (isHeadshot) {
      HUD.showHeadshot();
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playCriticalHit) AudioSystem.playCriticalHit();
      player.score += 50;
      player.totalHeadshots++;
      player.waveHeadshots++;
      player.stageHeadshots = (player.stageHeadshots || 0) + 1;
      // Daily challenges: record headshot
      try { if (typeof DailyChallenges !== 'undefined') DailyChallenges.recordHeadshot(); } catch (eDCH) {}
    }

    if (remaining <= 0) {
      AudioSystem.playDeath();
      // Track last kill position for kill cam
      _lastKillPos = enemy.mesh ? enemy.mesh.position.clone() : null;
      // Death explosion effect
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
        Tracers.spawnExplosion(enemy.mesh.position, 1.5);
      }
      MLSystem.onKill(Weapons.getCurrentId());
      MLSystem.trackKillTiming(); // AI Smart Learning: track kill timing patterns
      // INFILTRATE mission: count occupant kills (stealth bonus if disguise still up)
      try { if (typeof MissionSystem !== 'undefined' && MissionSystem.onEnemyKilled) MissionSystem.onEnemyKilled(); } catch (eMK) {}
      // Patriotic kill flair — occasional Ukrainian battle cries on streak.
      try {
        if (player.killStreak >= 3 && Math.random() < 0.18 && typeof HUD !== 'undefined' && HUD.showToast) {
          var _cries = [
            'СЛАВА УКРАЇНІ! 🇺🇦',
            'ГЕРОЯМ СЛАВА!',
            'PUTIN KHUYLO!',
            'Ghost of Kyiv strikes!',
            'For Mariupol! 🇺🇦',
            'BAYRAKTAR! 🚁',
            'Russian warship — go fuck yourself.',
            'НА БАЙРАКТАРИ!',
          ];
          HUD.showToast(_cries[Math.floor(Math.random() * _cries.length)], 1800, '#ffd500');
        }
      } catch (eUC) {}
      // Streak score multiplier: 3+ kills in chain = +10% per streak (capped at +150%)
      var _streakMult = 1 + Math.min(1.5, Math.max(0, player.killStreak - 1) * 0.1);
      var _baseKillScore = Math.round((enemy.scoreValue || 0) * _streakMult * _killStreakMult * (window._prestigeScoreMult || 1));
      // Score chain multiplier
      _chainKills++;
      _chainTimer = _chainExpiry;
      if (_chainKills >= 10) _scoreChain = 5;
      else if (_chainKills >= 6) _scoreChain = 4;
      else if (_chainKills >= 3) _scoreChain = 3;
      else if (_chainKills >= 2) _scoreChain = 2;
      if (_scoreChain > 1 && typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast('x' + _scoreChain + ' KILL CHAIN! +' + (_scoreChain * 10) + ' bonus', '#ffdd00');
      }
      _updateChainDisplay();
      var _scoreGain = Math.round(_baseKillScore * _scoreChain);
      player.score += _scoreGain;
      _killStreak++;
      _killStreakTimer = 5.0;
      var _streakNames = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD KILL', 'RAMPAGE', 'UNSTOPPABLE', 'GODLIKE'];
      var _streakName = _streakNames[Math.min(_killStreak, _streakNames.length - 1)] || 'MASSACRE';
      if (_killStreak >= 2) {
        _killStreakMult = 1 + (_killStreak * 0.1);
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('🔥 ' + _streakName + '! ×' + _killStreakMult.toFixed(1), '#ff8800');
        }
      }
      // Show floating multiplier text when meaningful (>= x1.2)
      if (_streakMult >= 1.2 && typeof Feedback !== 'undefined' && Feedback.showStreakMult) {
        try { Feedback.showStreakMult(_streakMult); } catch (eSM) {}
      }
      player.kills++;
      if (window.BountySystem && enemy) {
        var _bountyResult = BountySystem.checkKill(enemy);
        if (_bountyResult) { player.score += 2000; if (typeof HUD !== 'undefined' && HUD.updateScore) HUD.updateScore(player.score); }
      }
      if (window.BloodEffects && enemy && enemy.mesh) {
        BloodEffects.onDeath(enemy.mesh.position.clone(), isHeadshot || false);
      }
      if (window.RadioSupport) RadioSupport.onKill();
      if (typeof ArmorSystem !== 'undefined' && enemy && enemy.mesh) ArmorSystem.tryDrop(enemy.mesh.position.x, enemy.mesh.position.y, enemy.mesh.position.z);
      if (window.GasMask && enemy && enemy.mesh) GasMask.tryDrop(enemy.mesh.position.x, enemy.mesh.position.y, enemy.mesh.position.z, typeof STAGES !== 'undefined' && STAGES[currentStage] ? STAGES[currentStage].id : '');
      if (window.LootDrops && enemy && enemy.mesh) LootDrops.spawnLoot(enemy.mesh.position, enemy.type);
      if (typeof KillStreak !== 'undefined') KillStreak.onKill();
      player.waveKills++;
      if (player.waveKills === 1) player.waveFirstKillTime = (performance.now() - player.waveStartTime) / 1000;
      // Wave events: trigger 'mid' when 50% of wave enemies are killed
      if (window.WaveEvents && player._waveStartCount > 0 &&
          player.waveKills === Math.ceil(player._waveStartCount * 0.5)) {
        WaveEvents.triggerRandom(currentWave, 'mid');
      }
      // Daily challenges: record kill
      try { if (typeof DailyChallenges !== 'undefined') DailyChallenges.recordKill(); } catch (eDCK) {}
      // Achievements: record kill
      try {
        if (typeof Achievements !== 'undefined' && Achievements.recordKill) {
          Achievements.recordKill({
            headshot: isHeadshot,
            isNvgActive: !!window._nvgActive,
            isDroneKill: !!(typeof DroneSystem !== 'undefined' && DroneSystem.isPossessing && DroneSystem.isPossessing()),
          });
        }
      } catch (eAchK) {}
      // Kill milestone banners — celebrate round numbers of total kills
      try {
        var _kMile = player.kills;
        var _mileLabel = null;
        if (_kMile === 50) _mileLabel = '⚔ 50 KILLS — WARRIOR';
        else if (_kMile === 100) _mileLabel = '🔥 100 KILLS — VETERAN';
        else if (_kMile === 250) _mileLabel = '💀 250 KILLS — REAPER';
        else if (_kMile === 500) _mileLabel = '☠ 500 KILLS — DESTROYER';
        else if (_kMile === 1000) _mileLabel = '👑 1000 KILLS — LEGEND';
        else if (_kMile > 1000 && _kMile % 1000 === 0) _mileLabel = '👑 ' + _kMile + ' KILLS — UNSTOPPABLE';
        if (_mileLabel && HUD.showStreakBanner) HUD.showStreakBanner(_mileLabel, _kMile);
      } catch (eMile) {}
      // Mobile haptic — double-pulse for kill, longer for headshot
      if (isMobile && navigator.vibrate) {
        try { navigator.vibrate(isHeadshot ? [25, 35, 60] : [20, 30, 30]); } catch (e) {}
      }
      HUD.setScore(player.score);
      HUD.setKills(player.kills);
      RankSystem.onKill(isHeadshot);
      HUD.addKill(Weapons.getCurrentName(), enemy.typeCfg ? enemy.typeCfg.name : 'ENEMY', isHeadshot);
      // HUD kill feed entry with weapon icon
      if (typeof HUD !== 'undefined' && HUD.addKillFeedEntry) {
        var _wepIcon = isHeadshot ? '🎯' : '🔫';
        var _wepTyp = (typeof Weapons !== 'undefined' && Weapons.getCurrent) ? (Weapons.getCurrent().type || '') : '';
        if (_wepTyp === 'grenade' || _wepTyp === 'explosive') _wepIcon = '💣';
        else if (isHeadshot) _wepIcon = '🎯';
        HUD.addKillFeedEntry('You', enemy.typeCfg ? enemy.typeCfg.name : 'Enemy', _wepIcon);
      }
      // KillFeed overlay hook — COD-style kill feed (kill-feed.js)
      if (window._onKillForFeed) {
        var _kfEnemyType = enemy.typeCfg ? enemy.typeCfg.name : (enemy.type || 'ENEMY');
        var _kfWeapon = (typeof Weapons !== 'undefined' && Weapons.getCurrent) ? (Weapons.getCurrent().type || '') : '';
        _onKillForFeed(_kfEnemyType, _kfWeapon, isHeadshot);
      }
      // FOV kick: brief zoom-out punch on kill (bigger on headshot)
      _killFovKick = Math.max(_killFovKick, isHeadshot ? 4.5 : 2.5);

      // ── B23: XP system ──
      var xpGain = (enemy.typeCfg ? enemy.typeCfg.xpReward : 20) || 20;
      if (isHeadshot) xpGain = Math.floor(xpGain * 1.5);
      // Long-shot bonus: kills beyond 40m award bonus XP and a banner
      try {
        var _killDist = (enemy && enemy.mesh) ? enemy.mesh.position.distanceTo(player.position) : 0;
        if (_killDist >= 40) {
          var _longBonus = _killDist >= 80 ? 50 : (_killDist >= 60 ? 35 : 20);
          xpGain += _longBonus;
          player.score += _longBonus;
          if (HUD.showStreakBanner) {
            var _ldLabel = _killDist >= 80 ? '🎯 IMPOSSIBLE SHOT' : (_killDist >= 60 ? '🎯 LONG SHOT' : '🎯 RANGED KILL');
            HUD.showStreakBanner(_ldLabel + ' +' + _longBonus, Math.round(_killDist));
          }
        }
      } catch (eLS) {}
      // Personal-best longest-shot tracker — announce + persist when broken
      try {
        var _kdNow = (enemy && enemy.mesh) ? enemy.mesh.position.distanceTo(player.position) : 0;
        if (_kdNow > 5) {
          if (player._longestShot === undefined) {
            player._longestShot = parseFloat(localStorage.getItem('ok_longest_shot') || '0') || 0;
          }
          if (_kdNow > player._longestShot + 1) {
            player._longestShot = _kdNow;
            try { localStorage.setItem('ok_longest_shot', String(_kdNow)); } catch (eLS2) {}
            if (HUD.showStreakBanner) HUD.showStreakBanner('🏆 NEW LONGEST SHOT: ' + Math.round(_kdNow) + 'm', Math.round(_kdNow));
          }
        }
      } catch (eLS3) {}
      player.xp += xpGain;
      var xpNeeded = player.level * 200;
      if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;
        player.level++;
        if (HUD.showStreakBanner) HUD.showStreakBanner('LEVEL UP! LVL ' + player.level, player.level);
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playLevelUp) AudioSystem.playLevelUp();
        // Level-up VFX: golden burst of pickup-style sparks at player + brief FOV punch
        try {
          if (typeof Tracers !== 'undefined' && Tracers.spawnPickupBurst) {
            var _luPos = player.position.clone(); _luPos.y += 1.2;
            Tracers.spawnPickupBurst(_luPos, 0xffd700);
          }
          _killFovKick = Math.max(_killFovKick, 6); // bigger zoom-out punch
          if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) {
            Feedback.triggerSlowMo(0.35, 0.5);
          }
        } catch (eLU) {}
        // Unlock a weapon every 3 levels
        if (player.level % 3 === 0) {
          var newWepIdx = Weapons.unlockNext();
          if (newWepIdx >= 0 && HUD.showWeaponUnlockCard && Weapons.getWeaponDef) {
            HUD.showWeaponUnlockCard(Weapons.getWeaponDef(newWepIdx));
          }
        }
      }
      if (HUD.updateXPBar) HUD.updateXPBar(player.xp, xpNeeded, player.level);
      if (Feedback.showXPGain) Feedback.showXPGain(xpGain);

      // ── B23: Multikill tracking ──
      player.multikillTimer = 2.0;
      player.multikillCount++;
      if (player.multikillCount >= 2) {
        var mkNames = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'MULTI KILL', 'MEGA KILL', 'ULTRA KILL'];
        var mkName = mkNames[Math.min(player.multikillCount, 6)];
        if (HUD.showStreakBanner) HUD.showStreakBanner(mkName, player.multikillCount);
        // Adrenaline rush on quad+: brief slow-mo + FOV punch
        if (player.multikillCount >= 4) {
          if (Feedback.triggerSlowMo) Feedback.triggerSlowMo(0.5, 0.55);
          _killFovKick = Math.max(_killFovKick, 7);
          if (CameraSystem.shake) CameraSystem.shake(0.10, 0.4);
        }
      }

      // ── B23: Kill confirm effect ──
      if (Feedback.showKillConfirm) Feedback.showKillConfirm();
      if (isHeadshot && AudioSystem.playHeadshotDing) AudioSystem.playHeadshotDing();
      // Headshot brain-spurt: extra blood spray upward + slight extra slow-mo
      if (isHeadshot && enemy && enemy.mesh && typeof Tracers !== 'undefined') {
        try {
          var _hsPos = enemy.mesh.position.clone();
          _hsPos.y += (enemy.typeCfg ? enemy.typeCfg.scale * 1.7 : 1.7);
          // Multiple blood sprays in different directions for fountain effect
          var _hsUp = new THREE.Vector3(0, 1, 0);
          if (Tracers.spawnBlood) {
            Tracers.spawnBlood(_hsPos, _hsUp);
            Tracers.spawnBlood(_hsPos, new THREE.Vector3(0.4, 0.9, 0.1).normalize());
            Tracers.spawnBlood(_hsPos, new THREE.Vector3(-0.4, 0.9, -0.1).normalize());
          }
        } catch (eHS) {}
      }

      // ── Kill audio feedback ──
      if (typeof AudioSystem !== 'undefined') {
        if (player.kills === 1 && AudioSystem.playFirstBlood) AudioSystem.playFirstBlood();
        else if (AudioSystem.playKillConfirm) AudioSystem.playKillConfirm();
        if (player.multikillCount >= 2 && AudioSystem.playMultiKill) AudioSystem.playMultiKill(player.multikillCount);
      }

      // ── Hitstop on kill (micro-freeze for impact feel) ──
      if (typeof Feedback !== 'undefined' && Feedback.triggerHitStop) {
        if (player.multikillCount >= 3) Feedback.triggerHitStop(4);
        else if (isHeadshot) Feedback.triggerHitStop(3);
        else Feedback.triggerHitStop(1);
      }

      // ── Slow-mo on triple+ multikill ──
      if (player.multikillCount >= 3 && typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) {
        Feedback.triggerSlowMo(0.25, 0.3);
      }

      // ── Kill Momentum: HP regen + speed burst + mag refill ──
      var killHeal = 5 + Math.min(player.killStreak * 2, 15);
      player.hp = Math.min(player.maxHp, player.hp + killHeal);
      HUD.setHealth(player.hp, player.maxHp);
      // Streak 3+: partial armor regen
      if (player.killStreak >= 3) {
        player.armor = Math.min(100, player.armor + 5);
        if (HUD.updateArmor) HUD.updateArmor(player.armor / 100);
      }
      // Speed burst after kill
      player._killSpeedBoost = Math.min(0.4, 0.1 + player.killStreak * 0.03);
      player._killSpeedTimer = 1.5;
      // Streak 5+: refill 20% of magazine
      if (player.killStreak >= 5) {
        var kst = Weapons.getState ? Weapons.getState() : null;
        var kwep = Weapons.getCurrent ? Weapons.getCurrent() : null;
        if (kst && kwep && kwep.clipSize > 0 && !kst.reloading) {
          kst.clip = Math.min(kwep.clipSize, kst.clip + Math.ceil(kwep.clipSize * 0.2));
          HUD.setAmmo(kst.clip, kst.reserve, kwep.clipSize);
        }
      }

      // ── B22: Boss bar update ──
      if (enemy.type === 'BOSS') {
        if (HUD.hideBossBar) HUD.hideBossBar();
      }

      // ── B22: Damage log ──
      if (HUD.addDamageLog) HUD.addDamageLog('Killed ' + (enemy.typeCfg ? enemy.typeCfg.name : 'Enemy') + ' (+' + xpGain + ' XP)', '#44ff44');

      // ═══ NEW: Progression, Perks, Feedback tracking on kill ═══
      // Kill feed entry
      if (typeof Feedback !== 'undefined') {
        Feedback.addKillFeedEntry('You', enemy.typeCfg ? enemy.typeCfg.name : 'Enemy', Weapons.getCurrentName(), isHeadshot);
      }
      // Floating damage number
      if (typeof Feedback !== 'undefined') {
        Feedback.spawnDamageNumber(window.innerWidth / 2, window.innerHeight / 2 - 30, dmg, isHeadshot, false);
      }
      // Perk: kill tracking & killstreaks
      if (typeof Perks !== 'undefined') {
        Perks.onKill();
        // Scavenger auto-loot
        var scavRange = Perks.getScavengerRange();
        if (scavRange > 0) {
          Weapons.addAmmo(Perks.getScavengerAmmo());
          HUD.notifyPickup('🔄 SCAVENGER: +' + Perks.getScavengerAmmo() + ' ammo', '#88ff88');
        }
        // Update killstreak panel
        var ksList = document.getElementById('killstreak-list');
        if (ksList) {
          var avail = Perks.getAvailableStreaks();
          if (avail.length > 0) {
            document.getElementById('killstreak-panel').style.display = 'block';
            var ksHTML = '';
            for (var ksi = 0; ksi < avail.length; ksi++) {
              ksHTML += '<div style="margin:3px 0;cursor:pointer;padding:2px 4px;border:1px solid #ff6600;border-radius:3px" onclick="GameManager._activateStreak(' + ksi + ')">' + avail[ksi].icon + ' ' + avail[ksi].name + '</div>';
            }
            ksList.innerHTML = ksHTML;
          }
        }
      }
      // Progression: stats tracking
      if (typeof Progression !== 'undefined') {
        Progression.trackStat('totalKills', 1);
        Progression.trackWeaponKill(Weapons.getCurrentName());
        if (isHeadshot) Progression.trackStat('headshots', 1);
        Progression.trackStat('totalDamageDealt', dmg);
        // Check bounties
        var completedBounties = Progression.updateBounty('weapon_kill', 1);
        if (isHeadshot) Progression.updateBounty('headshot_wave', 1);
        Progression.updateBounty('damage', dmg);
        for (var cbi = 0; cbi < completedBounties.length; cbi++) {
          HUD.notifyPickup('💰 BOUNTY COMPLETE! +' + escapeHTML(completedBounties[cbi].reward) + ' OKC', '#ffaa00');
          if (typeof Marketplace !== 'undefined' && Marketplace.awardCustomOKC) {
            Marketplace.awardCustomOKC(completedBounties[cbi].reward, 'bounty_reward', {
              bountyId: completedBounties[cbi].id || null,
              bountyType: completedBounties[cbi].type || null,
            }).then(function () {
              if (HUD && HUD.updateOKC) HUD.updateOKC(Marketplace.getOKC());
            });
          } else if (typeof Marketplace !== 'undefined') {
            Marketplace.addOKC(completedBounties[cbi].reward);
          }
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playBountyComplete) AudioSystem.playBountyComplete();
        }
        // Achievement checks
        if (typeof Feedback !== 'undefined') {
          if (player.kills === 1) Feedback.unlockAchievement('FIRST_BLOOD');
          if (player.totalHeadshots >= 10) Feedback.unlockAchievement('SHARPSHOOTER');
          if (player.killStreak >= 4) Feedback.unlockAchievement('MULTI_KILL');
          if (Weapons.getCurrentIdx() === 0) {
            Progression.trackStat('meleeKills', 1);
            player.waveMeleeKills++;
            if (Progression.getStats().meleeKills >= 10) Feedback.unlockAchievement('MELEE_MASTER');
          }
        }
        // Journal unlock by kills
        if (player.kills >= 5) Progression.unlockJournalEntry('entry_conscript');
        if (player.kills >= 10) Progression.unlockJournalEntry('entry_stormer');
        if (player.kills >= 15) Progression.unlockJournalEntry('entry_armored');
      }

      // Kill streak tracking
      player.killStreak++;
      if (player.killStreak > player.bestStreak) player.bestStreak = player.killStreak;
      // Radio chatter on milestones
      if (typeof Feedback !== 'undefined' && Feedback.radioChatter) {
        if (player.kills === 1) Feedback.radioChatter('first_blood');
        if (player.killStreak === 5 || player.killStreak === 10) Feedback.radioChatter('kill_streak');
        if (window.CompanionRadio && CompanionRadio.onKillStreak) CompanionRadio.onKillStreak(player.killStreak);
      }
      // TimeWarp: award bullet-time charge at streaks 10 and 20
      if (window._onKillStreakForTimeWarp) _onKillStreakForTimeWarp(player.killStreak);

      // ── B30: Weapon Mastery tracking ──
      if (typeof CombatExtras !== 'undefined' && CombatExtras.addWeaponKill) {
        var masteryUp = CombatExtras.addWeaponKill(Weapons.getCurrentId());
        if (masteryUp) {
          var mastery = CombatExtras.getWeaponMastery(Weapons.getCurrentId());
          if (mastery) HUD.notifyPickup('⭐ ' + Weapons.getCurrentName() + ' MASTERY: ' + mastery.rankName, '#ffdd44');
        }
      }

      // ── B27: Economy bounty tracking ──
      if (typeof Economy !== 'undefined' && Economy.updateBounty) {
        if (isHeadshot) Economy.updateBounty('headshot', 1);
        Economy.updateBounty('kills', 1);
        if (Weapons.getCurrentType() === 'MELEE') Economy.updateBounty('melee', 1);
        if (player.killStreak >= 5) Economy.updateBounty('streak', player.killStreak);
      }

      // ── B31: Progression achievements on kill milestones ──
      if (typeof Progression !== 'undefined' && Progression.checkAchievement) {
        Progression.checkAchievement('FIRST_BLOOD', player.kills);
        Progression.checkAchievement('SLAYER', player.kills);
        Progression.checkAchievement('HEADHUNTER', player.totalHeadshots);
        if (player.totalShots >= 100) {
          var accPct = player.totalHits / player.totalShots;
          Progression.checkAchievement('SHARPSHOOTER', accPct * 100);
        }
        if (Progression.addSeasonXP) Progression.addSeasonXP(5 + (isHeadshot ? 5 : 0));
      }
      player.streakTimer = 4.0; // 4 seconds to chain another kill
      var streakMult = 1.0 + Math.min(player.killStreak - 1, 10) * 0.2; // up to 3.0x at 11+ streak
      var streakBonus = Math.floor(enemy.scoreValue * (streakMult - 1));
      if (streakBonus > 0) {
        player.score += streakBonus;
        HUD.setScore(player.score);
      }
      if (HUD.showStreak) HUD.showStreak(player.killStreak, streakMult);

      // Dog tag collection (every kill drops a dog tag)
      player.dogTags++;
      if (player.dogTags % 10 === 0) {
        player.score += 500;
        HUD.setScore(player.score);
        HUD.notifyPickup('🏷 10 DOG TAGS! +500 SCORE', '#ffaa00');
      }

      // Play-to-Earn: award OKC for kills
      if (typeof Marketplace !== 'undefined') {
        Marketplace.onKill(isHeadshot);
        if (player.killStreak === 3 || player.killStreak === 5 || player.killStreak >= 10) {
          Marketplace.onStreak(player.killStreak);
        }
        HUD.updateOKC(Marketplace.getOKC());
      }

      // Pickup spawn — expanded loot table
      if (Math.random() < enemy.dropChance) {
        const lootRoll = Math.random();
        let type;
        if (lootRoll < 0.25)      type = 'HEALTH';
        else if (lootRoll < 0.45) type = 'AMMO';
        else if (lootRoll < 0.58) type = 'ARMOR';
        else if (lootRoll < 0.68) type = 'GRENADE';
        else if (lootRoll < 0.77) type = 'MEDKIT';
        else if (lootRoll < 0.85) type = 'STIM';
        else if (lootRoll < 0.92) type = 'INTEL';
        else                      type = 'SHIELD';
        Pickups.spawn(enemy.mesh.position, type);
        // Loot drop sparkle
        if (typeof Tracers !== 'undefined' && Tracers.spawnSparks) Tracers.spawnSparks(enemy.mesh.position);
      }

      // Enemy weapon drop: 20% chance, drops weapon ammo pickup
      if (Math.random() < 0.20) {
        var _ENEMY_WEAPONS = {
          CONSCRIPT: 'MAKAROV',   STORMER: 'AK74',        ARMORED: 'PKM',
          MEDIC: 'MAKAROV',       OFFICER: 'MAKAROV',     SNIPER: 'SVD',
          ENGINEER: 'AK74',       SPETSNAZ: 'AK12',       RIOT: 'MAKAROV',
          TANK: 'PKM',            ASSAULT_MECH: 'PKM',    BOSS: 'PKM',
          WAGNER: 'SCARH',        KADYROVITE: 'AK74',     COMMISSAR: 'MAKAROV',
          SABOTEUR: 'GP25',       SHIELD_BEARER: 'MAKAROV', MORTAR: 'AK74',
          SNIPER_ELITE: 'BARRETTM82', HEAVY_SNIPER: 'BARRETTM82',
          FLAMETHROWER: 'FLAMETHROWER',
          BTR: 'PKM',             PARATROOP: 'AK74',      DRONE_OP: 'MAKAROV',
          EW_OPERATOR: 'MAKAROV', WAR_DOG: null,          BOMBER: null,
          KAMIKAZE_DRONE: null,   THERMOBARIC: 'RPG7',    ASSAULT_MECH: 'PKM',
        };
        var enemyTypeName = (enemy.typeCfg && enemy.typeCfg.name) || 'CONSCRIPT';
        var dropWeaponId = (enemyTypeName in _ENEMY_WEAPONS) ? _ENEMY_WEAPONS[enemyTypeName] : 'AK74';
        if (!dropWeaponId) dropWeaponId = null;
        // Find weapon index by ID
        var dropIdx = -1;
        var wCount = Weapons.getWeaponCount();
        for (var dwi = 0; dwi < wCount; dwi++) {
          if (Weapons.getWeaponId(dwi) === dropWeaponId) { dropIdx = dwi; break; }
        }
        if (dropIdx >= 0 && dropWeaponId) {
          Pickups.spawn(enemy.mesh.position, 'WEAPON', { weaponIdx: dropIdx, weaponId: dropWeaponId });
        }
      }

      // Attachment drop: 10% chance on enemy death
      if (typeof Attachments !== 'undefined' && _scene && enemy && enemy.mesh && Math.random() < 0.10) {
        var _atkDropId = Attachments.getRandomAttachment();
        Attachments.spawnPickup(_scene, enemy.mesh.position.x, enemy.mesh.position.y, enemy.mesh.position.z, _atkDropId);
      }

      // Weapon unlock drop (pickup weapons 2-15)
      if (Math.random() < 0.12) {
        const candidates = [];
        const weaponCount = Weapons.getWeaponCount();
        for (let wi = 2; wi < weaponCount; wi++) {
          if (!Weapons.isUnlocked(wi)) candidates.push(wi);
        }
        if (candidates.length > 0) {
          const idx = candidates[Math.floor(Math.random() * candidates.length)];
          Weapons.unlockWeapon(idx);
          HUD.notifyPickup('WEAPON UNLOCKED: ' + Weapons.getWeaponName(idx), '#ff8800');
        }
      }

      // Dog tags drop on enemy death
      if (window._onEnemyKillForDogTags) window._onEnemyKillForDogTags(enemy.mesh.position, enemy.type);

      // Scavenge system — spawn a pickable weapon drop at enemy position
      if (window.ScavengeSystem && enemy.mesh) {
        var _scavType = (enemy.typeCfg && enemy.typeCfg.name) || null;
        var _scavId   = enemy._weaponType || null;
        ScavengeSystem.spawnWeaponDrop(enemy.mesh.position, _scavId, null);
      }
    }
  }

  function onVehicleHit(vehicle, dmg) {
    if (!vehicle || !vehicle.alive) return;
    VehicleSystem.damageVehicle(vehicle.id, dmg);
    if (window.AudioSystem && window.AudioSystem.playHit) window.AudioSystem.playHit();
    if (HUD.addCombatLog) HUD.addCombatLog('Hit vehicle (-' + dmg + ')', '#ff8800');
    // Spawn sparks on vehicle hit
    if (typeof Tracers !== 'undefined' && Tracers.spawnMuzzleFlash) {
      _gmTmp1.set(0, 1, 0);
      Tracers.spawnMuzzleFlash(vehicle.position, _gmTmp1);
    }
    // Check if destroyed
    if (vehicle.health <= 0) {
      player.score += 200;
      HUD.setScore(player.score);
      HUD.notifyPickup('🚗 VEHICLE DESTROYED! +200', '#ff8800');
      if (HUD.addCombatLog) HUD.addCombatLog('Vehicle destroyed! +200 score', '#ff4400');
      // Spawn loot from destroyed vehicle
      spawnLootParticle(vehicle.position, 5 + Math.floor(Math.random() * 5));
      // Explosion effect
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
        Tracers.spawnExplosion(vehicle.position, 3);
      }
    }
  }

  var _barrelExplosionDepth = 0;
  function detonateBarrel(bx, by, bz) {
    if (_barrelExplosionDepth > 3) return;
    _barrelExplosionDepth++;
    try {
      // Remove barrel
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.setBlock) {
        VoxelWorld.setBlock(bx, by, bz, 0); // AIR
        VoxelWorld.setBlock(bx, by + 1, bz, 0); // clear above
      }
      // Explosion visual
      var exPos = new THREE.Vector3(bx + 0.5, by + 0.5, bz + 0.5);
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
        Tracers.spawnExplosion(exPos, 2.5);
      }
      // Damage enemies in radius
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var enemies = Enemies.getAll();
        for (var ei = 0; ei < enemies.length; ei++) {
          var ep = enemies[ei].position || (enemies[ei].mesh && enemies[ei].mesh.position);
          if (!ep) continue;
          var dx = ep.x - exPos.x, dy = ep.y - exPos.y, dz = ep.z - exPos.z;
          var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist < 6) {
            var dmg = Math.round(120 * (1 - dist / 6));
            if (Enemies.damage) Enemies.damage(enemies[ei], dmg, false, 'explosion');
          }
        }
      }
      // Chain reaction — check nearby barrels
      for (var cx = bx - 4; cx <= bx + 4; cx++) {
        for (var cy = by - 2; cy <= by + 2; cy++) {
          for (var cz = bz - 4; cz <= bz + 4; cz++) {
            if (cx === bx && cy === by && cz === bz) continue;
            if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getBlock && VoxelWorld.getBlock(cx, cy, cz) === 12) {
              var chainDist = Math.sqrt((cx-bx)*(cx-bx) + (cy-by)*(cy-by) + (cz-bz)*(cz-bz));
              if (chainDist <= 4) {
                setTimeout(function(x,y,z){ detonateBarrel(x,y,z); }.bind(null,cx,cy,cz), 150 + Math.random()*200);
              }
            }
          }
        }
      }
      if (typeof HUD !== 'undefined' && HUD.notifyPickup && _barrelExplosionDepth === 1) {
        HUD.notifyPickup('💥 BARREL EXPLODED!', '#ff8800');
      }
      // Damage player if too close
      if (typeof player !== 'undefined' && player.position) {
        var pdx = player.position.x - exPos.x, pdy = player.position.y - exPos.y, pdz = player.position.z - exPos.z;
        var pDist = Math.sqrt(pdx*pdx + pdy*pdy + pdz*pdz);
        if (pDist < 5) {
          var pDmg = Math.round(80 * (1 - pDist / 5));
          player.hp = Math.max(0, player.hp - pDmg);
          if (typeof HUD !== 'undefined' && HUD.flashDamage) HUD.flashDamage(pDmg);
        }
      }
    } catch(e) {}
    setTimeout(function() { if (_barrelExplosionDepth > 0) _barrelExplosionDepth = Math.max(0, _barrelExplosionDepth - 1); }, 500);
  }

  function onPlayerHit(dmg, attackerPos) {
    if (gameState !== STATE.PLAYING) return; // can't take damage when dead/paused
    if (player.godMode) return; // God mode: immune to damage
    if (DroneSystem.isPossessing()) return; // player body is passive while piloting drone
    // Ballistic Shield blocks bullet from attacker direction (full block)
    if (window.BallisticShield && BallisticShield.isDeployed() && attackerPos) {
      var _bsOrigin = attackerPos.clone ? attackerPos.clone() : new THREE.Vector3(attackerPos.x, attackerPos.y, attackerPos.z);
      _bsOrigin.y += 1.0; // approx bullet height
      var _bsTarget = player.position.clone();
      _bsTarget.y += 0.8;
      var _bsDir = new THREE.Vector3().subVectors(_bsTarget, _bsOrigin).normalize();
      if (BallisticShield.checkBulletBlock(_bsOrigin, _bsDir)) {
        return; // bullet fully blocked by shield
      }
    }
    // Shield absorbs damage
    if (player.shieldTimer > 0) {
      HUD.notifyPickup('🛡 SHIELDED!', '#ffd700');
      return;
    }
    // B24: Crouch reduces damage 15%, cover reduces 40%
    if (player.inCover) {
      dmg = Math.round(dmg * 0.6);
    } else if (player.isCrouching) {
      dmg = Math.round(dmg * 0.85);
    }
    // Perk: Juggernaut reduces incoming damage
    if (typeof Perks !== 'undefined') {
      dmg = Math.round(dmg * Perks.getDamageTakenMult());
    }
    // Challenge mode: hardcore double damage
    if (typeof Progression !== 'undefined') {
      var chalMods = Progression.getChallengeModifiers();
      if (chalMods.enemyDmgMult) dmg = Math.round(dmg * chalMods.enemyDmgMult);
    }
    // ArmorSystem vest absorbs damage before player.armor
    if (typeof ArmorSystem !== 'undefined') { dmg = ArmorSystem.absorbDamage(dmg); }
    // Armor absorbs up to 50% of incoming damage, capped by available armor points
    if (player.armor > 0) {
      var absorbed = Math.min(player.armor, dmg * 0.5);
      player.armor = Math.max(0, player.armor - absorbed);
      dmg = dmg - absorbed;
      if (HUD.updateArmor) HUD.updateArmor(player.armor / 100);
    }
    player.lastDamageTime = 0; // reset health regen timer
    player.totalDamageTaken += dmg;
    player.waveDamageTaken += dmg;
    // Tag the attacker enemy: brief red outline so player can identify the shooter
    try {
      if (attackerPos && Enemies.getAll) {
        var _atkList = Enemies.getAll();
        var _bestE = null, _bestD = Infinity;
        for (var _ai = 0; _ai < _atkList.length; _ai++) {
          var _ae = _atkList[_ai];
          if (!_ae || !_ae.alive || !_ae.mesh) continue;
          var _adx = _ae.mesh.position.x - attackerPos.x;
          var _adz = _ae.mesh.position.z - attackerPos.z;
          var _ad = _adx * _adx + _adz * _adz;
          if (_ad < _bestD) { _bestD = _ad; _bestE = _ae; }
        }
        if (_bestE && _bestD < 9 && Enemies.tagAttacker) Enemies.tagAttacker(_bestE);
        if (_bestE && _bestD < 9 && typeof EnemyChatter !== 'undefined') EnemyChatter.say(_bestE, 'attack');
      }
    } catch (eAtk) {}
    MLSystem.onDamageTaken(dmg);
    if (typeof Achievements !== 'undefined' && Achievements.onDamageTaken) Achievements.onDamageTaken();
    var _hpBefore = player.hp;
    player.hp = Math.max(0, player.hp - dmg);
    HUD.setHealth(player.hp, player.maxHp);
    HUD.flashDamage();
    // Close-call slow-mo: hit drops HP from > 30% into critical (< 18%) in one shot
    var _critFrac = 0.18, _safeFrac = 0.30;
    if (player.maxHp > 0 && _hpBefore > player.maxHp * _safeFrac && player.hp > 0 && player.hp < player.maxHp * _critFrac) {
      try {
        if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) Feedback.triggerSlowMo(0.45, 0.4);
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.12, 0.35);
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playLowHealth) AudioSystem.playLowHealth();
      } catch (eCC) {}
    }
    // Damage-proportional camera shake — big hits punch the view
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake && dmg >= 5) {
      var _shakeAmt = Math.min(0.18, 0.02 + dmg * 0.0025);
      var _shakeDur = Math.min(0.45, 0.12 + dmg * 0.005);
      CameraSystem.shake(_shakeAmt, _shakeDur);
    }
    // ── Second Wind: trigger once per wave when HP first drops to <=20% ──
    if (player.hp > 0 && player.hp <= player.maxHp * 0.20 && !player._secondWindTriggered) {
      player._secondWindTriggered = true;
      if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) Feedback.triggerSlowMo(0.45, 1.2);
      if (HUD.showStreakBanner) HUD.showStreakBanner('⚡ SECOND WIND', 0);
      if (CameraSystem.shake) CameraSystem.shake(0.06, 0.4);
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playReadyChime) AudioSystem.playReadyChime();
    }
    // Mobile haptic feedback — sharper for heavier damage
    if (isMobile && navigator.vibrate) {
      try { navigator.vibrate(Math.min(80, 20 + dmg * 0.8)); } catch (e) {}
    }
    // Blood drops — severity scales with damage as fraction of max HP
    if (HUD.showBloodDrops) HUD.showBloodDrops(Math.min(1, dmg / player.maxHp));
    // Low HP radio chatter
    if (player.hp > 0 && player.hp <= player.maxHp * 0.25) {
      if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('low_hp');
      if (window.CompanionRadio && CompanionRadio.onPlayerLowHealth) CompanionRadio.onPlayerLowHealth();
    }
    // Player-hit audio feedback
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playHit) AudioSystem.playHit();
    // Screen shake on hit
    if (CameraSystem.shake) {
      CameraSystem.shake(dmg * 0.004, 0.2);
    }
    // Directional camera flinch: kick view away from attacker
    if (attackerPos && CameraSystem.flinch) {
      var fAngle = Math.atan2(attackerPos.x - player.position.x, attackerPos.z - player.position.z);
      var camYaw = CameraSystem.getYaw();
      var fRel = fAngle - camYaw;
      // Normalize to [-PI, PI]
      while (fRel > Math.PI) fRel -= Math.PI * 2;
      while (fRel < -Math.PI) fRel += Math.PI * 2;
      var fIntensity = Math.min(1, dmg / 50);
      // Kick view AWAY from attacker (opposite side)
      var fYaw = -Math.sin(fRel) * 0.04 * fIntensity;
      var fPitch = 0.025 * fIntensity; // slight upward kick
      CameraSystem.flinch(fYaw, fPitch);
    }

    // AI Smart Learning: track directional vulnerability
    if (attackerPos) {
      MLSystem.trackHitDirection(
        attackerPos.x, attackerPos.z,
        player.position.x, player.position.z,
        CameraSystem.getYaw()
      );
    }

    // Heavy hits cause bleeding (25% chance on hits > 15 dmg)
    if (dmg > 15 && Math.random() < 0.25 && !player.bleeding) {
      player.bleeding = true;
      player.bleedTimer = 6.0; // 6 seconds of bleed
      if (HUD.showBleed) HUD.showBleed(true);
      HUD.notifyPickup('🩸 BLEEDING! Press X to bandage', '#ff2222');
    }

    // Hit direction indicator
    if (attackerPos && HUD.showHitDirection) {
      var dx = attackerPos.x - player.position.x;
      var dz = attackerPos.z - player.position.z;
      var worldAngle = Math.atan2(dx, dz);
      var relAngle = CameraSystem.getYaw() - worldAngle + Math.PI;
      if (HUD.showHitDirectionScaled) HUD.showHitDirectionScaled(relAngle, dmg);
      else HUD.showHitDirection(relAngle);
    }

    if (player.hp <= 0) {
      // ── B24: Last Stand — once per life, survive fatal hit ──
      if (!player._usedLastStand && player.level >= 5) {
        player._usedLastStand = true;
        player.hp = 1;
        player.shieldTimer = 2.0; // 2 sec invulnerability
        HUD.setHealth(player.hp, player.maxHp);
        if (HUD.showStreakBanner) HUD.showStreakBanner('💀 LAST STAND!', 0);
        if (HUD.showDamageFlash) HUD.showDamageFlash('#ffff00');
        if (CameraSystem.shake) CameraSystem.shake(0.08, 0.5);
        return;
      }
      gameState = STATE.DEAD;
      if (typeof KillStreak !== 'undefined') KillStreak.onDeath();
      if (_waveStartTimer) { clearTimeout(_waveStartTimer); _waveStartTimer = null; }
      if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
      // Streak-end banner: show what was ended
      if (player.killStreak >= 5 && HUD.showStreakBanner) {
        HUD.showStreakBanner('STREAK ENDED — ' + player.killStreak + ' KILLS', 0);
      }
      // Force exit vehicle / release drone on death
      if (VehicleSystem.isInVehicle()) VehicleSystem.exit();
      hideTankHUD();
      hideDroneControlsHUD();
      if (DroneSystem.isPossessing()) DroneSystem.release();
      if (window.AudioSystem.stopMusic) window.AudioSystem.stopMusic();
      if (window.AudioSystem.stopAmbientLoop) window.AudioSystem.stopAmbientLoop();
      Weapons.exitZoom();
      MLSystem.onDeath();
      // Track death in progression
      if (typeof Progression !== 'undefined') {
        Progression.trackStat('deathCount', 1);
        Progression.trackStat('totalDamageTaken', player.totalDamageTaken);
        var rank = Progression.submitScore('Player', player.score, currentWave, STAGES[currentStage].id, player.kills);
        var deadLB = document.getElementById('dead-leaderboard');
        if (deadLB) {
          deadLB.textContent = '🏆 Leaderboard Rank: #' + rank;
        }
        Progression.save();
      }
      // Reset perk streak on death
      if (typeof Perks !== 'undefined') Perks.resetStreak();
      // AI Smart Learning: classify combat style on death and track death context
      MLSystem.classifyCombatStyle();
      if (attackerPos) {
        var deathDist = player.position.distanceTo(attackerPos);
        var deathType = deathDist < 5 ? 'rush' : (deathDist > 25 ? 'sniper' : 'flank');
        var deathAngle = Math.atan2(attackerPos.x - player.position.x, attackerPos.z - player.position.z);
        MLSystem.trackDeathContext(deathType, deathAngle);
      }
      // Defeat banner: custom reason (capital fell) or the default
      var _dtEl = document.getElementById('dead-title');
      if (_dtEl) _dtEl.textContent = _defeatReason || 'YOU DIED';
      _defeatReason = null;
      showOverlay('dead');

      var _ds = document.getElementById('dead-stage');   if (_ds) _ds.textContent = STAGES[currentStage].id;
      var _dsc = document.getElementById('dead-score');  if (_dsc) _dsc.textContent = player.score;
      var _dk = document.getElementById('dead-kills');   if (_dk) _dk.textContent = player.kills;
      var _dw = document.getElementById('dead-wave');    if (_dw) _dw.textContent = currentWave;

      // ── Gameplay Tip Overlay on Death ──
      var tips = [
        'Always keep moving to avoid enemy fire.',
        'Use cover to reduce incoming damage.',
        'Headshots deal extra damage to most enemies.',
        'Switch weapons for different enemy types.',
        'Use grenades to clear groups of enemies.',
        'Reload during downtime, not in combat.',
        'Watch your ammo and reload before empty.',
        'Use perks to boost your survivability.',
        'Try different weapons to find your favorite.',
        'Use the minimap to track enemy positions.',
        'Bandage when bleeding to stop health loss.',
        'Vehicles provide speed and protection.',
        'Drones can scout and attack from above.',
        'Upgrade your skills for new abilities.',
        'Use build mode to create defensive structures.',
        'Night vision helps in dark stages.',
        'Switch to armor-piercing ammo for tough enemies.',
        'Use stealth to avoid detection.',
        'Ping locations for your squad.',
        'Check the shop for upgrades between waves.'
      ];
      var tip = tips[Math.floor(Math.random() * tips.length)];
      var tipEl = document.getElementById('dead-tip');
      if (!tipEl) {
        tipEl = document.createElement('div');
        tipEl.id = 'dead-tip';
        tipEl.style.cssText = 'margin-top:18px;font-size:15px;color:#44ff88;text-align:center;line-height:1.5;max-width:420px;margin-left:auto;margin-right:auto;';
        var overlay = document.getElementById('overlay-dead');
        if (overlay) overlay.appendChild(tipEl);
      }
      tipEl.textContent = '💡 TIP: ' + tip;

      // ── Death Screen: Letter Grade + Personal Best ──
      var gradeScore = 0;
      gradeScore += Math.min(player.kills * 2, 40); // kills: max 40 pts
      var acc = player.totalShots > 0 ? (player.totalHits / player.totalShots) : 0;
      gradeScore += Math.min(Math.round(acc * 30), 30); // accuracy: max 30 pts
      gradeScore += Math.min(currentWave * 3, 30); // wave survival: max 30 pts
      var grades = [{min:90,g:'S',c:'#ffd700'},{min:75,g:'A',c:'#44ff88'},{min:55,g:'B',c:'#4488ff'},{min:35,g:'C',c:'#ffaa44'},{min:0,g:'D',c:'#ff4444'}];
      var letterGrade = grades[grades.length - 1];
      for (var gi = 0; gi < grades.length; gi++) { if (gradeScore >= grades[gi].min) { letterGrade = grades[gi]; break; } }
      var gradeEl = document.getElementById('dead-grade');
      if (gradeEl) {
        gradeEl.textContent = letterGrade.g;
        gradeEl.style.color = letterGrade.c;
      }
      // Personal best tracking
      var pbEl = document.getElementById('dead-pb');
      if (pbEl) {
        try {
          var bestKills = parseInt(localStorage.getItem('ok_best_kills') || '0', 10);
          var bestWave  = parseInt(localStorage.getItem('ok_best_wave') || '0', 10);
          var bestScore = parseInt(localStorage.getItem('ok_best_score') || '0', 10);
          var pbLines = [];
          if (player.kills > bestKills) { localStorage.setItem('ok_best_kills', String(player.kills)); pbLines.push('\u2B06 NEW BEST KILLS: ' + player.kills + ' (prev ' + bestKills + ')'); }
          if (currentWave > bestWave)   { localStorage.setItem('ok_best_wave', String(currentWave)); pbLines.push('\u2B06 NEW BEST WAVE: ' + currentWave + ' (prev ' + bestWave + ')'); }
          if (player.score > bestScore) { localStorage.setItem('ok_best_score', String(player.score)); pbLines.push('\u2B06 NEW BEST SCORE: ' + player.score + ' (prev ' + bestScore + ')'); }
          if (pbLines.length === 0) pbLines.push('BEST: ' + bestKills + ' kills \u2022 wave ' + bestWave + ' \u2022 ' + bestScore + ' pts');
          pbEl.innerHTML = pbLines.join('<br>');
        } catch (e) { pbEl.textContent = ''; }
      }
      // Death statistics (Feature 43)
      if (HUD.showDeathStats) {
        var playTime = Math.floor((performance.now() - player.playStartTime) / 1000);
        var pm = Math.floor(playTime / 60);
        var ps = playTime % 60;
        HUD.showDeathStats({
          accuracy: player.totalShots > 0 ? Math.round((player.totalHits / player.totalShots) * 100) : 0,
          headshotPct: player.totalHits > 0 ? Math.round((player.totalHeadshots / player.totalHits) * 100) : 0,
          favWeapon: Weapons.getCurrentName(),
          playtime: pm + 'm ' + ps + 's',
          distance: Math.round(player.distanceWalked),
        });
      }
    }
  }

  /* ── Main Update Loop ────────────────────────────────────────────── */
  let prevTime = performance.now();
  var _fpsAccum = 0;
  var _fpsSamples = 0;
  var _perfCheckTimer = 0;
  var _qualityReduced = false;
  var _perfLevel = 0;            // current auto-optimization tier (0 = full quality)
  var _PERF_MAX_LEVEL = 3;
  var _lowFpsStreak = 0;
  var _highFpsStreak = 0;
  var _baseFogFar = isMobile ? 55 : 120;
  var _baseShadowsEnabled = true;
  var _basePixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.1 : 1.5);

  function _applyPerfLevel(level, fps) {
    _perfLevel = Math.max(0, Math.min(level, _PERF_MAX_LEVEL));
    _qualityReduced = _perfLevel > 0;
    try {
      var pr, fogFar, shadows;
      if (_perfLevel === 0)      { pr = _basePixelRatio; fogFar = _baseFogFar; shadows = _baseShadowsEnabled; _lowEndVFX = false; }
      else if (_perfLevel === 1) { pr = Math.min(_basePixelRatio, 1.0); fogFar = isMobile ? 50 : 90; shadows = true; _lowEndVFX = false; }
      else if (_perfLevel === 2) { pr = 1.0; fogFar = 60; shadows = false; _lowEndVFX = false; }
      else                       { pr = 0.7; fogFar = 45; shadows = false; _lowEndVFX = true; }
      if (_renderer) { _renderer.setPixelRatio(pr); _renderer.shadowMap.enabled = shadows; }
      if (sunLight) sunLight.castShadow = shadows;
      if (_perfLevel >= 2 && _scene) _scene.environment = null;
      if (_scene && _scene.fog) _scene.fog.far = fogFar;
      var _qlabel = ['ULTRA','HIGH','MEDIUM','LOW'][_perfLevel] || 'L' + _perfLevel;
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('⚙ Quality: ' + _qlabel + ' (auto-calibrated, FPS≈' + (fps ? fps.toFixed(0) : '?') + ')', '#88ccff');
      }
      console.log('[PERF] quality -> ' + _qlabel + ' (fps≈' + (fps ? fps.toFixed(0) : '?') + ')');
    } catch (e) {}
  }
  var _lowEndVFX = false;

  function update() {
    requestAnimationFrame(update);

    const now = performance.now();
    const rawDelta = Math.min((now - prevTime) / 1000, 0.1);
    prevTime = now;

    // Hitstop: update timer with real time, zero delta while frozen
    if (typeof Feedback !== 'undefined' && Feedback.updateHitStop) Feedback.updateHitStop(rawDelta);
    var delta = (typeof Feedback !== 'undefined' && Feedback.isHitStopped && Feedback.isHitStopped()) ? 0 : rawDelta;

    // Slow-mo: scale delta by slow-mo rate (triggered on multikills / wave clears)
    if (typeof Feedback !== 'undefined' && Feedback.getSlowMoRate) delta *= Feedback.getSlowMoRate();

    // Killstreak bullet-time: scale delta by killstreak time scale
    if (window._killstreakTimeScale && window._killstreakTimeScale < 1.0) {
      delta *= window._killstreakTimeScale;
    }

    // TimeWarp bullet-time: update with raw delta, then scale game delta
    if (window.TimeWarp) TimeWarp.update(rawDelta);
    if (window._bulletTimeScale && window._bulletTimeScale !== 1.0) {
      delta *= window._bulletTimeScale;
    }

    // ── Adaptive auto-quality calibration (bi-directional) ───────────
    _fpsAccum += delta;
    _fpsSamples++;
    _perfCheckTimer += delta;
    if (_perfCheckTimer > 2 && _fpsSamples > 8) {
      var avgFps = _fpsSamples / _fpsAccum;
      if (avgFps < 38) { _lowFpsStreak++; _highFpsStreak = 0; }
      else if (avgFps > 65) { _highFpsStreak++; _lowFpsStreak = 0; }
      else { _lowFpsStreak = 0; _highFpsStreak = 0; }
      if (_lowFpsStreak >= 2 && _perfLevel < _PERF_MAX_LEVEL) {
        _applyPerfLevel(_perfLevel + 1, avgFps);
        _lowFpsStreak = 0;
      }
      if (_highFpsStreak >= 3 && _perfLevel > 0) {
        _applyPerfLevel(_perfLevel - 1, avgFps);
        _highFpsStreak = 0;
      }
      _fpsAccum = 0;
      _fpsSamples = 0;
      _perfCheckTimer = 0;
    }

    // ── B26: FPS counter ──
    if (HUD.updateFPS) HUD.updateFPS();

    updateMobileControlsVisibility();
    syncTouchDriveKeys();

    // ── Indicator priority stack refresh (picks up direct DOM changes) ──
    if (HUD.refreshIndicators) HUD.refreshIndicators();

    if (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE) {
      // Core systems
      TimeSystem.update(delta);
      if (window.BloodEffects) BloodEffects.update(delta);
      if (window.StaminaSystem) StaminaSystem.update(delta);
      WeatherSystem.update(delta);
      if (typeof WeatherEvents !== 'undefined') WeatherEvents.update();
      if (window.WaveEvents) WaveEvents.update(delta);
      MLSystem.trackFPS(delta);
      // AI Smart Learning: track player position for behavior profiling
      MLSystem.trackPlayerPosition(player.position.x, player.position.z, delta);
      updatePlayer(delta);

      // When possessing a drone or driving a vehicle, updatePlayer returns early
      // and skips CameraSystem.update(). We must still update the camera so the
      // drone/vehicle view doesn't freeze.
      if (DroneSystem.isPossessing() || VehicleSystem.isInVehicle()) {
        CameraSystem.update(delta, player.position, false, false);
        if (CameraSystem.updateKillCam) CameraSystem.updateKillCam(delta);
        updateSuppression(delta);
      }

      // Bleed DOT (skipped in god mode)
      if (player.bleeding && player.bleedTimer > 0) {
        player.bleedTimer -= delta;
        if (!player.godMode) {
          player.hp = Math.max(1, player.hp - 3 * delta); // 3 HP/sec bleed
          HUD.setHealth(player.hp, player.maxHp);
        }
        if (player.bleedTimer <= 0) {
          player.bleeding = false;
          if (HUD.showBleed) HUD.showBleed(false);
        }
      }

      // Flashbang stun timer
      if (GameManager._flashbangStun > 0) {
        GameManager._flashbangStun -= delta;
        if (GameManager._flashbangStun <= 0) GameManager._flashbangStun = 0;
      }

      // Kill streak decay
      if (player.streakTimer > 0) {
        player.streakTimer -= delta;
        if (player.streakTimer <= 0) {
          player.killStreak = 0;
          if (HUD.showStreak) HUD.showStreak(0, 1.0);
        }
      }

      // Chornobyl Zone radiation damage (stage 7, skipped in god mode)
      if (STAGES[currentStage] && STAGES[currentStage].id === 7) {
        player._radTimer = (player._radTimer || 0) + delta;
        if (player._radTimer >= 3.0) {  // 2 HP every 3 seconds
          player._radTimer = 0;
          if (!player.godMode) {
            player.hp = Math.max(1, player.hp - 2);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0x44ff00, 0.15); // green flash
          }
        }
        // Geiger tick sounds
        player._geigerTimer = (player._geigerTimer || 0) + delta;
        if (player._geigerTimer >= 0.3 + Math.random() * 0.5) {
          player._geigerTimer = 0;
          if (AudioSystem.playGeigerTick) AudioSystem.playGeigerTick();
        }
        if (HUD.showRadiation) HUD.showRadiation(true);
      } else {
        if (HUD.showRadiation) HUD.showRadiation(false);
      }

      // ── MARIUPOL STEELWORKS: Random fire exposure (stage 5) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 5 && gameState === STATE.PLAYING) {
        player._fireTimer = (player._fireTimer || 0) + delta;
        if (player._fireTimer >= 4.0 + Math.random() * 2) {
          player._fireTimer = 0;
          if (!player.godMode && Math.random() < 0.25) {
            player.hp = Math.max(1, player.hp - 3);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff4400, 0.2); // orange fire flash
            if (HUD.notifyPickup) HUD.notifyPickup('🔥 Fire exposure!', '#ff4400');
          }
        }
      }

      // ── CRIMEA BRIDGE: Periodic naval bombardment (stage 6) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 6 && gameState === STATE.PLAYING) {
        player._bombardTimer = (player._bombardTimer || 0) + delta;
        if (player._bombardTimer >= 12.0 + Math.random() * 6) {
          player._bombardTimer = 0;
          var _navExX = player.position.x + (Math.random()-0.5)*12;
          var _navExZ = player.position.z + (Math.random()-0.5)*12;
          var _navExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_navExX, _navExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_navExX, _navExY, _navExZ), 6);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode) {
            var bombDmg = 5 + Math.floor(Math.random() * 10);
            player.hp = Math.max(1, player.hp - bombDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0x2244aa, 0.3);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.6);
            if (HUD.notifyPickup) HUD.notifyPickup('⚓ Naval bombardment!', '#4477ff');
          }
        }
      }

      // ── MOSCOW / KREMLIN: Random mortar barrages (stages 8, 12) ──
      if (STAGES[currentStage] && (STAGES[currentStage].id === 8 || STAGES[currentStage].id === 12) && gameState === STATE.PLAYING) {
        player._mortarTimer = (player._mortarTimer || 0) + delta;
        if (player._mortarTimer >= 15.0 + Math.random() * 10) {
          player._mortarTimer = 0;
          var _mtExX = player.position.x + (Math.random()-0.5)*10;
          var _mtExZ = player.position.z + (Math.random()-0.5)*10;
          var _mtExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_mtExX, _mtExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_mtExX, _mtExY, _mtExZ), 4);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode && Math.random() < 0.35) {
            var mortarDmg = 8 + Math.floor(Math.random() * 15);
            player.hp = Math.max(1, player.hp - mortarDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff3300, 0.4);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(1.0);
            if (HUD.notifyPickup) HUD.notifyPickup('💥 Mortar barrage!', '#ff3300');
          }
        }
      }

      // ── ANTONOV BRIDGE: Enemy long-range artillery strikes (stage 17) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 17 && gameState === STATE.PLAYING) {
        player._antonovArtillTimer = (player._antonovArtillTimer || 0) + delta;
        if (player._antonovArtillTimer >= 16.0 + Math.random() * 10) {
          player._antonovArtillTimer = 0;
          var _antArtExX = player.position.x + (Math.random()-0.5)*14;
          var _antArtExZ = player.position.z + (Math.random()-0.5)*14;
          var _antArtExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_antArtExX, _antArtExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_antArtExX, _antArtExY, _antArtExZ), 5);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode && Math.random() < 0.5) {
            var artillDmg = 7 + Math.floor(Math.random() * 14);
            player.hp = Math.max(1, player.hp - artillDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff8800, 0.35);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.9);
            if (HUD.notifyPickup) HUD.notifyPickup('🔥 Enemy artillery strike!', '#ff8800');
          }
        }
      }

      // ── DONBAS: Suppressive trench fire — accuracy debuff (stage 10) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 10 && gameState === STATE.PLAYING) {
        player._trenchSuppressionTimer = (player._trenchSuppressionTimer || 0) + delta;
        if (player._trenchSuppressionTimer >= 8.0 + Math.random() * 5) {
          player._trenchSuppressionTimer = 0;
          if (Math.random() < 0.30) {
            _suppressionLevel = Math.min(1, _suppressionLevel + 0.3);
            if (HUD.notifyPickup) HUD.notifyPickup('Suppressive fire!', '#ffaa00');
          }
        }
      }

      // ── SNAKE ISLAND: Naval bombardment from Moskva (stage 14) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 14 && gameState === STATE.PLAYING) {
        player._snakeBombardTimer = (player._snakeBombardTimer || 0) + delta;
        if (player._snakeBombardTimer >= 9.0 + Math.random() * 5) {
          player._snakeBombardTimer = 0;
          var _mskExX = player.position.x + (Math.random()-0.5)*14;
          var _mskExZ = player.position.z + (Math.random()-0.5)*14;
          var _mskExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_mskExX, _mskExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_mskExX, _mskExY, _mskExZ), 6);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode) {
            var snakeDmg = 6 + Math.floor(Math.random() * 12);
            player.hp = Math.max(1, player.hp - snakeDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0x2244aa, 0.35);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.8);
            if (HUD.notifyPickup) HUD.notifyPickup('⚓ Moskva bombardment!', '#4477ff');
          }
        }
      }

      // ── SAKY AIRBASE: Periodic kamikaze drone waves (stage 15) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 15 && gameState === STATE.PLAYING) {
        player._sakyDroneTimer = (player._sakyDroneTimer || 0) + delta;
        if (player._sakyDroneTimer >= 18.0 + Math.random() * 10) {
          player._sakyDroneTimer = 0;
          if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
            var _sdAngle = Math.random() * Math.PI * 2;
            var _sdDist  = 30 + Math.random() * 15;
            var _sdX = player.position.x + Math.cos(_sdAngle) * _sdDist;
            var _sdZ = player.position.z + Math.sin(_sdAngle) * _sdDist;
            var _sdY = VoxelWorld.getTerrainHeight(_sdX, _sdZ) + 8;
            Enemies.spawnSingle('KAMIKAZE_DRONE', new THREE.Vector3(_sdX, _sdY, _sdZ));
            if (HUD.notifyPickup) HUD.notifyPickup('⚠ KAMIKAZE DRONE INCOMING!', '#ff6600');
          }
        }
      }

      // ── SEVASTOPOL: Ship artillery bombardment (stage 9) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 9 && gameState === STATE.PLAYING) {
        player._sevaNavalTimer = (player._sevaNavalTimer || 0) + delta;
        if (player._sevaNavalTimer >= 14.0 + Math.random() * 8) {
          player._sevaNavalTimer = 0;
          var _sevaExX = player.position.x + (Math.random()-0.5)*14;
          var _sevaExZ = player.position.z + (Math.random()-0.5)*14;
          var _sevaExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_sevaExX, _sevaExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_sevaExX, _sevaExY, _sevaExZ), 6);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode) {
            var sevaDmg = 7 + Math.floor(Math.random() * 14);
            player.hp = Math.max(1, player.hp - sevaDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0x3355cc, 0.35);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.9);
            if (HUD.notifyPickup) HUD.notifyPickup('💥 Ship artillery!', '#4488ff');
          }
        }
      }

      // ── BAKHMUT: Wagner artillery barrage (stage 3) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 3 && gameState === STATE.PLAYING) {
        player._bakhmutArtillTimer = (player._bakhmutArtillTimer || 0) + delta;
        if (player._bakhmutArtillTimer >= 12.0 + Math.random() * 8) {
          player._bakhmutArtillTimer = 0;
          var _baExX = player.position.x + (Math.random()-0.5)*14;
          var _baExZ = player.position.z + (Math.random()-0.5)*14;
          var _baExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_baExX, _baExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_baExX, _baExY, _baExZ), 5);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode && Math.random() < 0.4) {
            var baDmg = 5 + Math.floor(Math.random() * 12);
            player.hp = Math.max(1, player.hp - baDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff6600, 0.3);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.8);
            if (HUD.notifyPickup) HUD.notifyPickup('💥 Wagner artillery barrage!', '#ff6600');
          }
        }
      }

      // ── VUHLEDAR: Mine detonation hazard (stage 16) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 16 && gameState === STATE.PLAYING) {
        player._vuhMineTimer = (player._vuhMineTimer || 0) + delta;
        if (player._vuhMineTimer >= 18.0 + Math.random() * 10) {
          player._vuhMineTimer = 0;
          var _vuhExX = player.position.x + (Math.random()-0.5)*6;
          var _vuhExZ = player.position.z + (Math.random()-0.5)*6;
          var _vuhExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_vuhExX, _vuhExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_vuhExX, _vuhExY, _vuhExZ), 3);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode && Math.random() < 0.3) {
            var vuhDmg = 10 + Math.floor(Math.random() * 18);
            player.hp = Math.max(1, player.hp - vuhDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff8800, 0.5);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(1.1);
            if (HUD.notifyPickup) HUD.notifyPickup('💣 MINEFIELD — MOVE CAREFULLY!', '#ff8800');
          }
        }
      }

      // ── REFINERY: Oil fire exposure (stage 18) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 18 && gameState === STATE.PLAYING) {
        player._refineryFireTimer = (player._refineryFireTimer || 0) + delta;
        if (player._refineryFireTimer >= 5.0 + Math.random() * 3) {
          player._refineryFireTimer = 0;
          if (!player.godMode && Math.random() < 0.3) {
            player.hp = Math.max(1, player.hp - 4);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff4400, 0.25);
            if (HUD.notifyPickup) HUD.notifyPickup('🔥 Burning refinery — watch your health!', '#ff4400');
          }
        }
      }

      // ── KHERSON: River mines (stage 4) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 4 && gameState === STATE.PLAYING) {
        player._khersonMineTimer = (player._khersonMineTimer || 0) + delta;
        if (player._khersonMineTimer >= 25.0 + Math.random() * 15) {
          player._khersonMineTimer = 0;
          var _khExX = player.position.x + (Math.random()-0.5)*8;
          var _khExZ = player.position.z + (Math.random()-0.5)*8;
          var _khExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_khExX, _khExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_khExX, _khExY, _khExZ), 3);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode && Math.random() < 0.40) {
            var khDmg = 8 + Math.floor(Math.random() * 15);
            player.hp = Math.max(1, player.hp - khDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0x2255ff, 0.35);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.7);
            if (HUD.notifyPickup) HUD.notifyPickup('💧 RIVER MINE — WATCH THE WATER!', '#2266ff');
          }
        }
      }

      // ── DONBAS: Thermobaric strike (stage 10) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 10 && gameState === STATE.PLAYING) {
        player._donbasThermTimer = (player._donbasThermTimer || 0) + delta;
        if (player._donbasThermTimer >= 20.0 + Math.random() * 12) {
          player._donbasThermTimer = 0;
          var _dbX1 = player.position.x + (Math.random()-0.5)*18;
          var _dbZ1 = player.position.z + (Math.random()-0.5)*18;
          var _dbY1 = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_dbX1, _dbZ1) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
            Tracers.spawnExplosion(new THREE.Vector3(_dbX1, _dbY1, _dbZ1), 9);
            Tracers.spawnExplosion(new THREE.Vector3(_dbX1+(Math.random()-0.5)*8, _dbY1, _dbZ1+(Math.random()-0.5)*8), 5);
          }
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode && Math.random() < 0.45) {
            var dbDmg = 15 + Math.floor(Math.random() * 25);
            player.hp = Math.max(1, player.hp - dbDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff2200, 0.55);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(1.3);
            if (HUD.notifyPickup) HUD.notifyPickup('☢ THERMOBARIC STRIKE — EVACUATE!', '#ff2200');
          }
        }
      }

      // ── KYIV: Russian tank fire (stage 13) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 13 && gameState === STATE.PLAYING) {
        player._kyivTankTimer = (player._kyivTankTimer || 0) + delta;
        if (player._kyivTankTimer >= 20.0 + Math.random() * 12) {
          player._kyivTankTimer = 0;
          var _kyExX = player.position.x + (Math.random()-0.5)*10;
          var _kyExZ = player.position.z + (Math.random()-0.5)*10;
          var _kyExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_kyExX, _kyExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_kyExX, _kyExY, _kyExZ), 4);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode && Math.random() < 0.40) {
            var kyTkDmg = 8 + Math.floor(Math.random() * 15);
            player.hp = Math.max(1, player.hp - kyTkDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff4400, 0.35);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.8);
            if (HUD.notifyPickup) HUD.notifyPickup('🔥 RUSSIAN TANK FIRE!', '#ff5500');
          }
        }
      }

      // ── AVDIIVKA: Sniper fire from ruins (stage 2) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 2 && gameState === STATE.PLAYING) {
        player._avdiivkaSniperTimer = (player._avdiivkaSniperTimer || 0) + delta;
        if (player._avdiivkaSniperTimer >= 20.0 + Math.random() * 15) {
          player._avdiivkaSniperTimer = 0;
          if (!player.godMode && Math.random() < 0.35) {
            var avdDmg = 5 + Math.floor(Math.random() * 12);
            player.hp = Math.max(1, player.hp - avdDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xffdd00, 0.3);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.5);
            if (HUD.notifyPickup) HUD.notifyPickup('☠ SNIPER FIRE — FIND COVER!', '#ffaa00');
          }
        }
      }

      // ── BELGOROD: Russian Grad rocket strikes (stage 11) ──
      if (STAGES[currentStage] && STAGES[currentStage].id === 11 && gameState === STATE.PLAYING) {
        player._belgorodGradTimer = (player._belgorodGradTimer || 0) + delta;
        if (player._belgorodGradTimer >= 14.0 + Math.random() * 8) {
          player._belgorodGradTimer = 0;
          var _bgFireChance = Math.random();
          var _bgExX = player.position.x + (Math.random()-0.5)*16;
          var _bgExZ = player.position.z + (Math.random()-0.5)*16;
          var _bgExY = typeof VoxelWorld !== 'undefined' ? VoxelWorld.getTerrainHeight(_bgExX, _bgExZ) : 0;
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(new THREE.Vector3(_bgExX, _bgExY, _bgExZ), 7);
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
          if (!player.godMode && _bgFireChance < 0.50) {
            var bgDmg = 12 + Math.floor(Math.random() * 22);
            player.hp = Math.max(1, player.hp - bgDmg);
            HUD.setHealth(player.hp, player.maxHp);
            if (HUD.showDamageFlash) HUD.showDamageFlash(0xff4400, 0.45);
            if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(1.2);
            if (HUD.notifyPickup) HUD.notifyPickup('🚀 GRAD ROCKET STRIKE!', '#ff4400');
          } else if (!player.godMode) {
            if (HUD.notifyPickup) HUD.notifyPickup('🚀 Grad salvo — near miss!', '#ff6600');
          }
        }
      }

      // B23: Multikill timer decay
      if (player.multikillTimer > 0) {
        player.multikillTimer -= delta;
        if (player.multikillTimer <= 0) player.multikillCount = 0;
      }

      // B22: Stage progress bar
      if (HUD.updateStageProgress && STAGES[currentStage]) {
        HUD.updateStageProgress(currentWave, STAGES[currentStage].wavesPerStage);
      }

      // B23: Feedback screen shake
      if (typeof Feedback !== 'undefined') {
        var shake = Feedback.getShakeOffset ? Feedback.getShakeOffset() : null;
        if (shake && _camera) {
          _camera.position.x += shake.x * 0.01;
          _camera.position.y += shake.y * 0.01;
        }
      }

      // Airdrop cooldown
      if (player.airdropCooldown > 0) player.airdropCooldown -= delta;

      // Stamina HUD
      if (HUD.updateStamina) HUD.updateStamina(player.stamina);

      // Weather indicator
      if (HUD.updateWeatherDisplay && WeatherSystem.getModifiers) {
        HUD.updateWeatherDisplay(WeatherSystem.getModifiers().label);
      }

      // Contextual input tips
      if (typeof Feedback !== 'undefined' && Feedback.checkTips) Feedback.checkTips(currentWave);

      // Low HP vignette pulse + heartbeat + desaturation
      if (HUD.showLowHP) {
        var isLow = player.hp > 0 && player.hp <= player.maxHp * 0.25;
        HUD.showLowHP(isLow);
        if (isLow) {
          var intensity = 1 - (player.hp / (player.maxHp * 0.25));
          intensity = Math.max(0, Math.min(1, intensity));
          if (AudioSystem.playHeartbeat) AudioSystem.playHeartbeat(intensity);
          if (_renderer) _renderer.domElement.style.filter = 'saturate(' + (0.3 + 0.7 * (1 - intensity)) + ')';
        } else {
          if (_renderer && _renderer.domElement.style.filter) _renderer.domElement.style.filter = '';
        }
      }

      // Shield timer countdown
      if (player.shieldTimer > 0) {
        player.shieldTimer -= delta;
        if (player.shieldTimer <= 0) {
          if (HUD.showShield) HUD.showShield(false);
        }
      }

      // Intel timer countdown
      if (player.intelTimer > 0) {
        player.intelTimer -= delta;
      }

      // Interaction prompts (vehicle/drone nearby)
      if (!VehicleSystem.isInVehicle() && !DroneSystem.isPossessing()) {
        const nearVeh = VehicleSystem.getNearby(player.position, 5);
        if (nearVeh.length > 0 && HUD.showInteractionPrompt) {
          const nv = nearVeh[0];
          if (nv.faction === 'enemy') {
            HUD.showInteractionPrompt('Press [G] to HIJACK ' + nv.type.toUpperCase());
          } else {
            HUD.showInteractionPrompt('Press [G] to enter ' + nv.type.toUpperCase());
          }
        } else if (HUD.hideInteractionPrompt) {
          HUD.hideInteractionPrompt();
        }
      }

      // Compass update
      if (HUD.updateCompass) HUD.updateCompass(CameraSystem.getYaw());

      // Objective pointer: big arrow toward nearest enemy so the player always knows where to go
      try {
        var _objPtr = document.getElementById('objective-pointer');
        var _objArrow = document.getElementById('objective-arrow');
        var _objDist = document.getElementById('objective-dist');
        if (_objPtr && Enemies.getAll) {
          var _enList = Enemies.getAll();
          var _nearest = null, _nearD = Infinity;
          for (var _oi = 0; _oi < _enList.length; _oi++) {
            var _oe = _enList[_oi];
            if (!_oe || !_oe.alive || !_oe.mesh) continue;
            var _odx = _oe.mesh.position.x - player.position.x;
            var _odz = _oe.mesh.position.z - player.position.z;
            var _od = _odx*_odx + _odz*_odz;
            if (_od < _nearD) { _nearD = _od; _nearest = _oe; }
          }
          if (_nearest && _nearD > 16*16) { // only show when enemy is >16m away
            _objPtr.style.display = 'block';
            var _odx2 = _nearest.mesh.position.x - player.position.x;
            var _odz2 = _nearest.mesh.position.z - player.position.z;
            var _oAngle = Math.atan2(_odx2, _odz2);
            var _oYaw = CameraSystem.getYaw();
            var _oRel = _oAngle - _oYaw;
            while (_oRel > Math.PI) _oRel -= Math.PI*2;
            while (_oRel < -Math.PI) _oRel += Math.PI*2;
            var _oDeg = _oRel * 180 / Math.PI;
            if (_objArrow) _objArrow.style.transform = 'rotate(' + _oDeg + 'deg)';
            if (_objDist) _objDist.textContent = Math.round(Math.sqrt(_nearD)) + 'm';
          } else {
            if (_objPtr) _objPtr.style.display = 'none';
          }
        }
      } catch (eObj) {}

      // Sprint intensity → HUD vignette + footstep dust puffs
      try {
        var _spdNow = player.velocity ? player.velocity.length() : 0;
        var _sprintAmt = (player.sprinting && player.grounded && _spdNow > 6) ? Math.min(1, (_spdNow - 6) / 6) : 0;
        if (HUD.setSprintIntensity) HUD.setSprintIntensity(_sprintAmt);
        // Periodic dust puff under feet while sprinting
        if (_sprintAmt > 0.4 && typeof Tracers !== 'undefined' && Tracers.spawnSmoke) {
          if (player._dustStepTimer === undefined) player._dustStepTimer = 0;
          player._dustStepTimer -= delta;
          if (player._dustStepTimer <= 0) {
            var _dustPos = new THREE.Vector3(player.position.x, player.position.y - 1.4, player.position.z);
            Tracers.spawnSmoke(_dustPos);
            player._dustStepTimer = 0.22 + Math.random() * 0.08;
          }
        }
      } catch (eSP) {}
      // Distant artillery rumble for war atmosphere (every 18-40s during gameplay)
      try {
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playDistantBoom) {
          if (player._distantBoomTimer === undefined) player._distantBoomTimer = 8 + Math.random() * 12;
          player._distantBoomTimer -= delta;
          if (player._distantBoomTimer <= 0) {
            AudioSystem.playDistantBoom();
            player._distantBoomTimer = 18 + Math.random() * 22;
          }
        }
      } catch (eDB) {}
      // Compass threat ticks: nearest 4 enemies as red marks at top of compass bar
      try {
        if (HUD.setCompassThreats && Enemies.getAll) {
          var _ctList = Enemies.getAll();
          var _ctThreats = [];
          for (var _ci = 0; _ci < _ctList.length; _ci++) {
            var _ce = _ctList[_ci];
            if (!_ce || !_ce.alive || !_ce.mesh) continue;
            var _cdx = _ce.mesh.position.x - player.position.x;
            var _cdz = _ce.mesh.position.z - player.position.z;
            var _cd2 = _cdx * _cdx + _cdz * _cdz;
            if (_cd2 > 90 * 90) continue; // 90m radius
            // Convert world dir → compass bearing (0=N=+Z?). Use atan2(dx, -dz) so 0=N when dz<0.
            var _bear = Math.atan2(_cdx, -_cdz) * 180 / Math.PI;
            if (_bear < 0) _bear += 360;
            _ctThreats.push({
              bearing: _bear, d2: _cd2,
              spotted: !!_ce.playerSpotted,
              boss: (_ce.typeName === 'BOSS' || (_ce.typeName && _ce.typeName.startsWith('BOSS_')))
            });
          }
          // Keep nearest 5 (or all bosses + nearest)
          _ctThreats.sort(function (a, b) { return a.d2 - b.d2; });
          if (_ctThreats.length > 5) _ctThreats.length = 5;
          HUD.setCompassThreats(_ctThreats);
        }
      } catch (eCT) {}

      // Weapon jam indicator
      if (HUD.showJam && Weapons.isJammed) HUD.showJam(Weapons.isJammed());

      // Build materials HUD (show when holding shovel)
      if (!_buildMatHud) _buildMatHud = document.getElementById('build-materials-hud');
      if (_buildMatHud) {
        if (Weapons.getCurrentType() === 'MELEE') {
          _buildMatHud.style.display = 'block';
          if (!_buildMatList) _buildMatList = document.getElementById('build-mat-list');
          var matList = _buildMatList;
          if (matList) {
            var mats = player.buildMaterials;
            var eco = Economy.getResources();
            matList.innerHTML =
              'W Wood: ' + ((mats.wood || 0) + (eco.wood || 0)) + '<br>' +
              'S Stone: ' + ((mats.stone || 0) + (eco.stone || 0)) + '<br>' +
              'M Metal: ' + ((mats.metal || 0) + (eco.metal || 0)) + '<br>' +
              'D Dirt: ' + (mats.dirt || 0) + '<br>' +
              '🏖 Sand: ' + (mats.sand || 0) + '<br>' +
              '🧱 Brick: ' + (mats.brick || 0);
          }
        } else {
          _buildMatHud.style.display = 'none';
        }
      }

      // Dynamic music intensity based on nearby enemies (throttled to every 0.5s)
      _musicIntTimer -= delta;
      if (_musicIntTimer <= 0 && window.AudioSystem.setMusicIntensity && window.AudioSystem.isMusicPlaying()) {
        _musicIntTimer = 0.5;
        var nearEnemies = 0;
        var allEn = Enemies.getAll();
        for (var mei = 0; mei < allEn.length; mei++) {
          if (allEn[mei].mesh && allEn[mei].mesh.position.distanceTo(player.position) < 25) nearEnemies++;
        }
        window.AudioSystem.setMusicIntensity(Math.min(1.0, nearEnemies / 8));
      }

      updateCombat(delta);

      // Feed player velocity to weapon sway
      if (Weapons.setPlayerSpeed) Weapons.setPlayerSpeed(player.velocity.length());
      // Hold breath: Shift while zoomed and not moving steadies scope
      if (Weapons.setHoldBreath) Weapons.setHoldBreath(Weapons.isZoomed() && keys['ShiftLeft'] && player.velocity.length() < 0.5);
      // Holster the FP weapon while piloting a drone or driving a vehicle so it
      // doesn't float in that view ("flying with a machine gun").
      if (Weapons.setHolstered) Weapons.setHolstered(DroneSystem.isPossessing() || VehicleSystem.isInVehicle());
      Weapons.update(delta);

      // ── ADS System update — FOV lerp, scope sway, breath control ──
      window._playerVelocityLen = player.velocity ? player.velocity.length() : 0;
      try {
        if (window.ADSSystem && ADSSystem.update) {
          // Notify ADSSystem of weapon type changes (detected once per frame)
          var _adsWepType = (typeof Weapons !== 'undefined' && Weapons.getCurrentType) ? Weapons.getCurrentType() : '';
          if (_adsWepType && _adsWepType !== window._adsLastWeaponType) {
            window._adsLastWeaponType = _adsWepType;
            ADSSystem.onWeaponChange(_adsWepType);
          }
          ADSSystem.update(delta);
        }
      } catch (eADSU) {}

      // ── Task 1: Weapon idle sway — breathing motion accumulated in GM ────────
      // _swayTime drives the breathing cycle; Weapons.js uses setPlayerSpeed to
      // modulate walk sway; this accumulates the phase for any additional overlay.
      var _isMoving = (Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1);
      var _swayFreq = _isMoving ? 8.0 : 1.5;
      _swayTime += delta * _swayFreq;

      // ── Task 3: Sniper scope overlay — show when zoomed with SNIPER/AMR ─────
      try {
        if (typeof Weapons !== 'undefined' && Weapons.isZoomed && Weapons.getCurrentType) {
          var _curType = Weapons.getCurrentType();
          var _isSniperWep = (_curType === 'SNIPER' || _curType === 'AMR');
          var _shouldShowScope = Weapons.isZoomed() && _isSniperWep;
          if (typeof HUD !== 'undefined' && HUD.showScope && HUD.hideScope) {
            if (_shouldShowScope && !HUD.isScopeActive()) {
              HUD.showScope(4.0);
            } else if (!_shouldShowScope && HUD.isScopeActive()) {
              HUD.hideScope();
            }
            if (typeof HUD.updateScope === 'function') HUD.updateScope(delta);
          }
        }
      } catch (eSc) {}

      // ── Dynamic crosshair spread: widens with movement, sprint, jump, recent fire ──
      try {
        var _chSpread = 0;
        var _spd = player.velocity ? player.velocity.length() : 0;
        _chSpread += Math.min(0.4, _spd * 0.06);          // movement
        if (player.sprinting) _chSpread += 0.35;
        if (!player.grounded) _chSpread += 0.35;          // airborne
        if (player.isCrouching) _chSpread *= 0.55;
        // Recent fire kick — read recoil accum if available
        var _recoilNow = (typeof Weapons !== 'undefined' && Weapons.getRecoilAccum) ? Weapons.getRecoilAccum() : 0;
        _chSpread += Math.min(0.5, _recoilNow * 8);
        // Immediate fire spread boost (frame-accurate)
        if (Weapons.didFire && Weapons.didFire()) _chSpread += 0.25;
        if (Weapons.isZoomed && Weapons.isZoomed()) _chSpread *= 0.25;
        // ADS accuracy bonus: further tighten spread when aiming down sights
        if (window._adsAccuracyBonus) _chSpread *= 0.5;
        var _weatherAccPenalty = (typeof WeatherEvents !== 'undefined') ? WeatherEvents.getAccuracyPenalty() : 0;
        if (_weatherAccPenalty > 0) _chSpread *= (1 + _weatherAccPenalty);
        if (HUD.setCrosshairSpread) HUD.setCrosshairSpread(_chSpread);
      } catch (eCh) {}

      // ── Crosshair target tint: red when aimed at enemy (cheap dot-product check) ──
      try {
        if (HUD.setCrosshairTarget && _camera && Enemies.getAll) {
          var _camFwd = _camera.getWorldDirection(new THREE.Vector3());
          var _camPos = _camera.position;
          var _onTarget = false;
          var _onTargetDist = 0;
          var _list = Enemies.getAll();
          // Tighter cone when zoomed (precise) vs wider when hipfiring (forgiving)
          var _aimCos = (Weapons.isZoomed && Weapons.isZoomed()) ? 0.997 : 0.992;
          for (var _ti = 0; _ti < _list.length; _ti++) {
            var _en = _list[_ti];
            if (!_en || !_en.alive || !_en.mesh) continue;
            var _dx = _en.mesh.position.x - _camPos.x;
            var _dy = (_en.mesh.position.y + 1.0) - _camPos.y;
            var _dz = _en.mesh.position.z - _camPos.z;
            var _dist = Math.sqrt(_dx*_dx + _dy*_dy + _dz*_dz);
            if (_dist < 1 || _dist > 120) continue;
            var _dot = (_dx*_camFwd.x + _dy*_camFwd.y + _dz*_camFwd.z) / _dist;
            if (_dot > _aimCos) { _onTarget = true; _onTargetDist = _dist; break; }
          }
          HUD.setCrosshairTarget(_onTarget);
          // Range readout: only show when zoomed AND on target (sniper info)
          if (HUD.setRangeReadout) {
            if (_onTarget && Weapons.isZoomed && Weapons.isZoomed()) HUD.setRangeReadout(_onTargetDist);
            else HUD.setRangeReadout(null);
          }
        }
      } catch (eCt) {}

      // ── FOV kick: sprint widens (+5), ADS narrows (weapons handles its own) ──
      if (!Weapons.isZoomed()) {
        _targetFOV = _baseFOV + (window._sprintFOVDelta || (player.sprinting ? 5 : 0)) + _killFovKick;
        _currentFOV += (_targetFOV - _currentFOV) * Math.min(1, delta * 10);
        _camera.fov = _currentFOV;
        _camera.updateProjectionMatrix();
      } else {
        // While zoomed, let weapons.js handle FOV, but track for smooth unzoom
        _currentFOV = _camera.fov;
      }
      // Decay kill FOV kick (~0.4s ease-back)
      if (_killFovKick > 0) _killFovKick = Math.max(0, _killFovKick - delta * 8);
      // Decay kill streak timer
      if (_killStreakTimer > 0) {
        _killStreakTimer -= delta;
        if (_killStreakTimer <= 0) { _killStreak = 0; _killStreakMult = 1; }
      }
      // Decay score chain timer
      if (_scoreChain > 1) {
        _chainTimer -= delta;
        if (_chainTimer <= 0) {
          _scoreChain = 1;
          _chainKills = 0;
          _updateChainDisplay();
          if (typeof HUD !== 'undefined' && HUD.showToast) HUD.showToast('CHAIN BROKEN', '#ff6644');
        }
      }

      Enemies.update(delta, player.position, onPlayerHit, function (waveDone) {
        if (waveDone) onWaveComplete();
      });
      // Boss health bar tracking
      try {
        var _bossE = null;
        var _allEnemiesForBoss = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
        for (var _bi = 0; _bi < _allEnemiesForBoss.length; _bi++) {
          var _be = _allEnemiesForBoss[_bi];
          if (_be && _be.hp > 0 && _be.type && _be.type.indexOf('BOSS') !== -1) {
            _bossE = _be; break;
          }
        }
        if (_bossE) {
          if (typeof HUD !== 'undefined' && HUD.showBossBar) {
            HUD.showBossBar(_bossE.type.replace(/_/g, ' '), _bossE.hp, _bossE.maxHp || _bossE.hp);
          }
        } else {
          if (typeof HUD !== 'undefined' && HUD.hideBossBar && _bossBarShowing) {
            HUD.hideBossBar();
            _bossBarShowing = false;
          }
        }
        _bossBarShowing = !!_bossE;
      } catch (eBB) {}
      if (typeof CompanionDrone !== 'undefined' && CompanionDrone.isActive()) {
        var _allEnemies = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
        CompanionDrone.update(delta, player.position, _allEnemies);
      } else if (typeof CompanionDrone !== 'undefined') {
        CompanionDrone.update(delta, player.position, []);
      }
      if (typeof SupplyCrate !== 'undefined') SupplyCrate.update(delta, player.position, player);
      if (window.ClaymoreMines) { var _allEnemies = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : []; ClaymoreMines.update(delta, player.position, _allEnemies); }
      if (window.TripwireIED) { var _iedEnemies = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : []; TripwireIED.update(_iedEnemies, delta); }
      if (typeof ArmorSystem !== 'undefined') ArmorSystem.update(delta, player.position);
      if (window.LootDrops) LootDrops.update(delta);
      if (window.DogTags) DogTags.update(delta);
      if (window.GasMask) GasMask.update(delta, player.position);
      if (typeof NightVision !== 'undefined') NightVision.update(delta);
      if (window.WeatherEffects) WeatherEffects.update(delta, player.position);
      if (typeof AllySoldiers !== 'undefined') { var _allEnemiesForAllies = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : []; AllySoldiers.update(delta, player.position, _allEnemiesForAllies); }
      if (typeof HazardZones !== 'undefined') {
        var _preHazardHp = player.hp;
        HazardZones.update(delta, player.position, player);
        // Gas mask: if equipped and in gas zone, block damage and speed penalty
        if (window.GasMask && GasMask.interceptGasDamage()) {
          player.hp = _preHazardHp;
          window._hazardSlowFactor = 1.0;
        }
      }
      if (window.IntelPickups) IntelPickups.update(delta, player.position, player, _scene);
      if (typeof KillStreak !== 'undefined') KillStreak.update(delta);
      if (window.SurrenderSystem) SurrenderSystem.update(delta);
      if (window.SuppressionSystem) SuppressionSystem.update(delta, player);
      if (window.FreezeGrenade) FreezeGrenade.update(delta);
      if (window.KillCam) KillCam.update(delta);
      if (window.ShieldBubble) ShieldBubble.update(delta);
      if (window.TripwireTrap) TripwireTrap.update(delta);
      if (window.BulletTime) BulletTime.update(delta);
      if (window.MountedTurret) MountedTurret.update(delta);
      if (window.DynamicWeather) DynamicWeather.update(delta);
      if (window.ObjectiveSystem) ObjectiveSystem.update(delta);
      if (window.ClusterBomb) ClusterBomb.update(delta);
      if (window.TacticalMinimap) TacticalMinimap.update(delta);
      if (window.KillFeedEvents) KillFeedEvents.update(delta);
      if (window.BossFinalForm) BossFinalForm.update(delta);
      if (window.RadarPulse) RadarPulse.update(delta);
      if (window.WeaponWear) WeaponWear.update(delta);
      if (window.Nanobots) Nanobots.update(delta);
      if (window.AmmoTypes) AmmoTypes.update(delta);
      if (window.PlayerCallouts) PlayerCallouts.update(delta);
      if (window.DriveableCar) DriveableCar.update(delta);
      if (window.FPVKamikaze) FPVKamikaze.update(delta);
      if (window.EMPPulse) EMPPulse.update(delta);
      if (window.InventorySystem) InventorySystem.update(delta);
      if (window.MeleeSystem) MeleeSystem.update(delta);
      if (window.SniperScope) SniperScope.update(delta);
      if (window.ParachuteDrop) ParachuteDrop.update(delta);
      if (window.LandmineField) LandmineField.update(delta);
      if (window.SmokeLauncher) SmokeLauncher.update(delta);
      if (window.AirStrike) AirStrike.update(delta);
      if (window.WallBreach) WallBreach.update(delta);
      if (window.CombatRoll) CombatRoll.update(delta);
      if (window.DogTagCollector) DogTagCollector.update(delta);
      if (window.EnemySniper) EnemySniper.update(delta);
      if (window.VehicleWreck) VehicleWreck.update(delta);
      if (window.SuppressorKit) SuppressorKit.update(delta);
      if (window.BattlefieldPromotions) BattlefieldPromotions.update(delta);
      if (window.HostageRescue) HostageRescue.update(delta);
      if (window.GrenadeLauncherGL) GrenadeLauncherGL.update(delta);
      if (window.PlayerDeathSequence) PlayerDeathSequence.update(delta);
      if (window.TacticalReload) TacticalReload.update(delta);
      if (window.ClaymoreDirectional) ClaymoreDirectional.update(delta);
      if (window.NightAssault) NightAssault.update(delta);
      if (window.VehicleTurret) VehicleTurret.update(delta);
      if (window.IntelDocuments) IntelDocuments.update(delta);
      if (window.BodyArmorVest) BodyArmorVest.update(delta);
      if (window.ArtilleryBarrage) ArtilleryBarrage.update(delta);
      if (window.RiotShieldPickup) RiotShieldPickup.update(delta);
      if (window.ScoreMultiplier) ScoreMultiplier.update(delta);
      if (window.HeliExtraction) HeliExtraction.update(delta);
      if (window.ChemicalWarfare) ChemicalWarfare.update(delta);
      if (window.EnemyTankDestroyer) EnemyTankDestroyer.update(delta);
      if (window.FlashbangSystem) FlashbangSystem.update(delta);
      if (window.EnemyEngineer) EnemyEngineer.update(delta);
      if (window.RappellingSystem) RappellingSystem.update(delta);
      if (window.BulletCam) BulletCam.update(delta);
      if (window.ReconDrone) ReconDrone.update(delta);
      if (window.BunkerBuster) BunkerBuster.update(delta);
      if (window.TacticalMap) TacticalMap.update(delta);
      // Wave 21
      if (window.VehiclePhysics) VehiclePhysics.update(delta);
      if (window.DecoyFlare) DecoyFlare.update(delta);
      if (window.FortificationBuilder) FortificationBuilder.update(delta);
      if (window.MortarStrikeSystem) MortarStrikeSystem.update(delta);
      if (window.EnemyMedicNPC) EnemyMedicNPC.update(delta);
      if (window.ExplosiveBarrelChain) ExplosiveBarrelChain.update(delta);
      if (window.PowerupSystem) PowerupSystem.update(delta);
      if (window.WaveAnnouncement) WaveAnnouncement.update(delta);
      if (window.EnvironmentalHazards) EnvironmentalHazards.update(delta);
      // Wave 22
      if (window.CaptureZone) CaptureZone.update(delta);
      if (window.AirdropSupply) AirdropSupply.update(delta);
      if (window.StealthSystem) StealthSystem.update(delta);
      if (window.EnemyCoordinator) EnemyCoordinator.update(delta);
      if (window.HelicopterGunship) HelicopterGunship.update(delta);
      if (window.JavelinLauncher) JavelinLauncher.update(delta);
      if (window.TimedCharges) TimedCharges.update(delta);
      if (window.SoldierSkillTree) SoldierSkillTree.update(delta);
      if (window.ShieldGenerator) ShieldGenerator.update(delta);
      if (window.CombatXPSystem) CombatXPSystem.update(delta);
      if (window.LootSystem) LootSystem.update(delta);
      if (window.ProximityMine) ProximityMine.update(delta);
      if (window.TacticalShield) TacticalShield.update(delta);
      // Wave 23
      if (window.MineSweeper) MineSweeper.update(delta);
      if (window.SniperNest) SniperNest.update(delta);
      if (window.VehicleConvoy) VehicleConvoy.update(delta);
      if (window.WeaponWorkshop) WeaponWorkshop.update(delta);
      if (window.SquadTactics) SquadTactics.update(delta);
      if (window.BattleReplay) BattleReplay.update(delta);
      if (window.DynamicEvents) DynamicEvents.update(delta);
      if (window.PropagandaSystem) PropagandaSystem.update(delta);
      if (window.TankControls) TankControls.update(delta);
      if (window.NBCProtection) NBCProtection.update(delta);
      // Wave 24
      if (window.ArtilleryBattery) ArtilleryBattery.update(delta);
      if (window.UrbanDestruction) UrbanDestruction.update(delta);
      if (window.MedicStation) MedicStation.update(delta);
      if (window.WeatherSystem) WeatherSystem.update(delta);
      if (window.ArmorSystem) ArmorSystem.update(delta);
      if (window.BunkerAssault) BunkerAssault.update(delta);
      if (window.SignalIntelligence) SignalIntelligence.update(delta);
      if (window.ReconDrone) ReconDrone.update(delta);
      if (window.NightVision) NightVision.update(delta);
      if (window.AirSupport) AirSupport.update(delta);
      // Wave 25
      if (window.SatelliteUplink) SatelliteUplink.update(delta);
      if (window.PrisonerRescue) PrisonerRescue.update(delta);
      if (window.SiegeEngine) SiegeEngine.update(delta);
      if (window.SmokeGrenade) SmokeGrenade.update(delta);
      if (window.FortifiedOutpost) FortifiedOutpost.update(delta);
      if (window.CombatKnife) CombatKnife.update(delta);
      if (window.MinefieldMapper) MinefieldMapper.update(delta);
      if (window.FieldComms) FieldComms.update(delta);
      if (window.TrophySystem) TrophySystem.update(delta);
      if (window.ExtractionZone) ExtractionZone.update(delta);
      // Wave 26
      if (window.AmphibiousAssault) AmphibiousAssault.update(delta);
      if (window.SupplyChain) SupplyChain.update(delta);
      if (window.RiotControl) RiotControl.update(delta);
      if (window.ElectromagneticPulse) ElectromagneticPulse.update(delta);
      if (window.HostageNegotiation) HostageNegotiation.update(delta);
      if (window.CyberWarfare) CyberWarfare.update(delta);
      if (window.AntiAir) AntiAir.update(delta);
      if (window.BlackMarket) BlackMarket.update(delta);
      if (window.BallisticCalculator) BallisticCalculator.update(delta);
      if (window.TunnelSystem) TunnelSystem.update(delta);
      if (window.VehicleRepair) VehicleRepair.update(delta);
      if (window.GhostRecon) GhostRecon.update(delta);
      if (window.LandslideEvent) LandslideEvent.update(delta);
      if (window.WarCrimesDetector) WarCrimesDetector.update(delta);
      if (window.CommandoRaid) CommandoRaid.update(delta);
      if (window.IntelligenceBriefing) IntelligenceBriefing.update(delta);
      if (window.ParachuteDrop) ParachuteDrop.update(delta);
      if (window.RadioBeacon) RadioBeacon.update(delta);
      if (window.BodyDrag) BodyDrag.update(delta);
      if (window.PsyOps) PsyOps.update(delta);
      if (window.AmbushSystem) AmbushSystem.update(delta);
      if (window.FieldHospital) FieldHospital.update(delta);
      if (window.ReconSatellite) ReconSatellite.update(delta);
      if (window.FortificationBuilder) FortificationBuilder.update(delta);
      if (window.NavalCombat) NavalCombat.update(delta);
      if (window.CounterSniper) CounterSniper.update(delta);
      if (window.ExplosiveOrdnance) ExplosiveOrdnance.update(delta);
      if (window.ChainOfCommand) ChainOfCommand.update(delta);
      if (window.WeatherEffects) WeatherEffects.update(delta);
      if (window.ObjectiveTracker) ObjectiveTracker.update(delta);
      if (window.BattleDamageAssessment) BattleDamageAssessment.update(delta);
      if (window.PrisonerExchange) PrisonerExchange.update(delta);
      if (window.TacticalRetreat) TacticalRetreat.update(delta);
      if (window.KillHouse) KillHouse.update(delta);
      if (window.MortarCalculator) MortarCalculator.update(delta);
      if (window.LogisticsSystem) LogisticsSystem.update(delta);
      if (window.StealthSystem) StealthSystem.update(delta);
      if (window.UrbanPatrol) UrbanPatrol.update(delta);
      if (window.ElectronicWarfare) ElectronicWarfare.update(delta);
      if (window.VehicleConvoy) VehicleConvoy.update(delta);
      if (window.BreachingCharges) BreachingCharges.update(delta);
      if (window.CasualtyEvacuation) CasualtyEvacuation.update(delta);
      if (window.NightVision) NightVision.update(delta);
      if (window.FireSupport) FireSupport.update(delta);
      if (window.ShieldSystem) ShieldSystem.update(delta);
      if (window.MineField) MineField.update(delta);
      if (window.TankCommander) TankCommander.update(delta);
      if (window.CombatMedic) CombatMedic.update(delta);
      if (window.SiegeWarfare) SiegeWarfare.update(delta);
      if (window.SniperRifle) SniperRifle.update(delta);
      if (window.RappellingSystem) RappellingSystem.update(delta);
      if (window.GrenadeTypes) GrenadeTypes.update(delta);
      if (window.SentryGun) SentryGun.update(delta);
      if (window.BunkerAssault) BunkerAssault.update(delta);
      if (window.AirAssault) AirAssault.update(delta);
      if (window.WeatherAmbience) WeatherAmbience.update(delta);
      if (window.ObjectiveCapture) ObjectiveCapture.update(delta);
      if (window.TunnelNetwork) TunnelNetwork.update(delta);
      if (window.MeleeCombat) MeleeCombat.update(delta);
      if (window.VehicleDamage) VehicleDamage.update(delta);
      if (window.SupplyDrop) SupplyDrop.update(delta);
      if (window.HostageRescue) HostageRescue.update(delta);
      if (window.MapSystem) MapSystem.update(delta);
      if (window.DecoySystem) DecoySystem.update(delta);
      if (window.CombatDrone) CombatDrone.update(delta);
      if (window.ArmorSystem) ArmorSystem.update(delta);
      if (window.FortifiedRetreat) FortifiedRetreat.update(delta);
      if (window.WeatherStorm) WeatherStorm.update(delta);
      if (window.SpecialForces) SpecialForces.update(delta);
      if (window.CommandBunker) CommandBunker.update(delta);
      if (window.CombatSwimming) CombatSwimming.update(delta);
      if (window.AerialDogfight) AerialDogfight.update(delta);
      if (window.ForwardObserver) ForwardObserver.update(delta);
      if (window.CombatJump) CombatJump.update(delta);
      if (window.CombatEngineering) CombatEngineering.update(delta);
      if (window.IEDDisposal) IEDDisposal.update(delta);
      if (window.BattlefieldTriage) BattlefieldTriage.update(delta);
      if (window.FirebaseDefense) FirebaseDefense.update(delta);
      if (window.IntelNetwork) IntelNetwork.update(delta);
      if (window.NavalOperations) NavalOperations.update(delta);
      if (window.ArcticWarfare) ArcticWarfare.update(delta);
      if (window.JungleWarfare) JungleWarfare.update(delta);
      if (window.CheckpointAssault) CheckpointAssault.update(delta);
      if (window.NukeSilo) NukeSilo.update(delta);
      if (window.DetentionCenter) DetentionCenter.update(delta);
      if (window.ArtMuseum) ArtMuseum.update(delta);
      if (window.CraterBase) CraterBase.update(delta);
      if (window.TsunamiZone) TsunamiZone.update(delta);
      if (window.FrozenBunker) FrozenBunker.update(delta);
      if (window.MobCasino) MobCasino.update(delta);
      if (window.CommandVehicle) CommandVehicle.update(delta);
      if (window.BallisticShieldOps) BallisticShieldOps.update(delta);
      if (window.RiotResponse) RiotResponse.update(delta);
      if (window.FactorySabotage) FactorySabotage.update(delta);
      if (window.POWEscape) POWEscape.update(delta);
      if (window.AmbushNetwork) AmbushNetwork.update(delta);
      if (window.EscapeEvade) EscapeEvade.update(delta);
      if (window.UrbanWarfare) UrbanWarfare.update(delta);
      if (window.RescueDownedPilot) RescueDownedPilot.update(delta);
      if (window.ConvoyEscort) ConvoyEscort.update(delta);
      if (window.DeepRecon) DeepRecon.update(delta);
      if (window.SupplyChainAttack) SupplyChainAttack.update(delta);
      if (window.MassSurrender) MassSurrender.update(delta);
      if (window.SiegeTower) SiegeTower.update(delta);
      if (window.SniperHunt) SniperHunt.update(delta);
      if (window.VehicleRecovery) VehicleRecovery.update(delta);
      if (window.HostageStandoff) HostageStandoff.update(delta);
      if (window.NightVisionOps) NightVisionOps.update(delta);
      if (window.BridgeDemolition) BridgeDemolition.update(delta);
      if (window.ArtilleryDuel) ArtilleryDuel.update(delta);
      if (window.TunnelWarfare) TunnelWarfare.update(delta);
      if (window.CarrierAssault) CarrierAssault.update(delta);
      if (window.DroneSwarm) DroneSwarm.update(delta);
      if (window.ChemBioResponse) ChemBioResponse.update(delta);
      if (window.MedevacOps) MedevacOps.update(delta);
      if (window.PrisonBreak) PrisonBreak.update(delta);
      if (window.MountainAssault) MountainAssault.update(delta);
      if (window.MechSuit) MechSuit.update(delta);
      if (window.RiverCrossing) RiverCrossing.update(delta);
      if (window.CyberWarfare) CyberWarfare.update(delta);
      if (window.TrainAssault) TrainAssault.update(delta);
      if (window.NuclearShutdown) NuclearShutdown.update(delta);
      if (window.RadioTower) RadioTower.update(delta);
      if (window.MortarBarrage) MortarBarrage.update(delta);
      if (window.TankWarfare) TankWarfare.update(delta);
      if (window.DesertStorm) DesertStorm.update(delta);
      if (window.RefugeeConvoy) RefugeeConvoy.update(delta);
      if (window.BlackOpsExtraction) BlackOpsExtraction.update(delta);
      if (window.ZeroGravityCombat) ZeroGravityCombat.update(delta);
      if (window.DroneRacing) DroneRacing.update(delta);
      if (window.PirateShipBattle) PirateShipBattle.update(delta);
      if (window.GladiatorArena) GladiatorArena.update(delta);
      if (window.HeistPlanning) HeistPlanning.update(delta);
      if (window.UnderwaterBase) UnderwaterBase.update(delta);
      if (window.ZombieOutbreak) ZombieOutbreak.update(delta);
      if (window.VolcanoEscape) VolcanoEscape.update(delta);
      if (window.FactionStandoff) FactionStandoff.update(delta);
      if (window.AncientSiege) AncientSiege.update(delta);
      if (window.MechWarfare) MechWarfare.update(delta);
      if (window.DrugLord) DrugLord.update(delta);
      if (window.MoonBase) MoonBase.update(delta);
      if (window.PrisonRiot) PrisonRiot.update(delta);
      if (window.ArcticBase) ArcticBase.update(delta);
      if (window.TimeHeist) TimeHeist.update(delta);
      if (window.AlienInvasion) AlienInvasion.update(delta);
      if (window.CyberHeist) CyberHeist.update(delta);
      if (window.TrainRobbery) TrainRobbery.update(delta);
      if (window.JungleTemple) JungleTemple.update(delta);
      if (window.NuclearPlant) NuclearPlant.update(delta);
      if (window.CasinoHeist) CasinoHeist.update(delta);
      if (window.OilRig) OilRig.update(delta);
      if (window.SkyFortress) SkyFortress.update(delta);
      if (window.SubmarineWarfare) SubmarineWarfare.update(delta);
      if (window.BioLab) BioLab.update(delta);
      if (window.Assassination) Assassination.update(delta);
      if (window.SiegeDefense) SiegeDefense.update(delta);
      if (window.GhostMission) GhostMission.update(delta);
      if (window.SpaceStation) SpaceStation.update(delta);
      if (window.PirateCove) PirateCove.update(delta);
      if (window.GladiatorColosseum) GladiatorColosseum.update(delta);
      if (window.BunkerBreach) BunkerBreach.update(delta);
      if (window.VolcanoAssault) VolcanoAssault.update(delta);
      if (window.CargoShip) CargoShip.update(delta);
      if (window.WarzoneHospital) WarzoneHospital.update(delta);
      if (window.ArmsDealer) ArmsDealer.update(delta);
      if (window.HostageCrisis) HostageCrisis.update(delta);
      if (window.TankBattalion) TankBattalion.update(delta);
      if (window.ZombieApocalypse) ZombieApocalypse.update(delta);
      if (window.SamuraiDuel) SamuraiDuel.update(delta);
      if (window.NuclearSubmarine) NuclearSubmarine.update(delta);
      if (window.RebelUprising) RebelUprising.update(delta);
      if (window.MiningDisaster) MiningDisaster.update(delta);
      if (window.PrisonBreak) PrisonBreak.update(delta);
      if (window.RacingCombat) RacingCombat.update(delta);
      if (window.MedievalSiege) MedievalSiege.update(delta);
      if (window.IslandAssault) IslandAssault.update(delta);
      if (window.CyberpunkCity) CyberpunkCity.update(delta);
      if (window.DeepJungle) DeepJungle.update(delta);
      if (window.BattleRoyale) BattleRoyale.update(delta);
      if (window.CultCompound) CultCompound.update(delta);
      if (window.HelipadExtraction) HelipadExtraction.update(delta);
      if (window.DesertWarfare) DesertWarfare.update(delta);
      if (window.UrbanSniper) UrbanSniper.update(delta);
      if (window.ConvoyAmbush) ConvoyAmbush.update(delta);
      if (window.NukeDisarm) NukeDisarm.update(delta);
      if (window.StormTheCastle) StormTheCastle.update(delta);
      if (window.CorporateEspionage) CorporateEspionage.update(delta);
      if (window.AlienMothership) AlienMothership.update(delta);
      if (window.GoldRush) GoldRush.update(delta);
      if (window.UnderwaterRuins) UnderwaterRuins.update(delta);
      if (window.ArcticRescue) ArcticRescue.update(delta);
      if (window.MobWar) MobWar.update(delta);
      if (window.TempleOfDoom) TempleOfDoom.update(delta);
      if (window.AirbaseRaid) AirbaseRaid.update(delta);
      if (window.BlackSite) BlackSite.update(delta);
      if (window.SpaceMarines) SpaceMarines.update(delta);
      if (window.OilWar) OilWar.update(delta);
      if (window.MechAssault) MechAssault.update(delta);
      if (window.JungleAmbush) JungleAmbush.update(delta);
      if (window.CultBunker) CultBunker.update(delta);
      if (window.NuclearWinter) NuclearWinter.update(delta);
      if (window.FortressAssault) FortressAssault.update(delta);
      if (window.RobotUprising) RobotUprising.update(delta);
      if (window.DrugCartel) DrugCartel.update(delta);
      if (window.TimeHeist) TimeHeist.update(delta);
      if (window.PirateIsland) PirateIsland.update(delta);
      if (window.AvalancheEscape) AvalancheEscape.update(delta);
      if (window.CyberWarfare) CyberWarfare.update(delta);
      if (window.SiegeOfParis) SiegeOfParis.update(delta);
      if (window.HauntedMansion) HauntedMansion.update(delta);
      if (window.DiamondHeist) DiamondHeist.update(delta);
      if (window.WarOf1812) WarOf1812.update(delta);
      if (window.Jailbreak) Jailbreak.update(delta);
      if (window.MeteorStrike) MeteorStrike.update(delta);
      if (window.CloneWars) CloneWars.update(delta);
      if (window.VolcanoEscape) VolcanoEscape.update(delta);
      if (window.EmbassySiege) EmbassySiege.update(delta);
      if (window.NightRaid) NightRaid.update(delta);
      if (window.KungFuDojo) KungFuDojo.update(delta);
      if (window.RefugeeConvoy) RefugeeConvoy.update(delta);
      if (window.MarsColony) MarsColony.update(delta);
      if (window.SharkAttack) SharkAttack.update(delta);
      if (window.ColosseumBoss) ColosseumBoss.update(delta);
      if (window.DeepCover) DeepCover.update(delta);
      if (window.SpySatellite) SpySatellite.update(delta);
      if (window.GladiatorArena) GladiatorArena.update(delta);
      if (window.NukeLaunch) NukeLaunch.update(delta);
      if (window.HostageTrain) HostageTrain.update(delta);
      if (window.WaterCrisis) WaterCrisis.update(delta);
      if (window.MidnightCoup) MidnightCoup.update(delta);
      if (window.PlagueOutbreak) PlagueOutbreak.update(delta);
      if (window.OrbitalDefense) OrbitalDefense.update(delta);
      if (window.SunkenVessel) SunkenVessel.update(delta);
      if (window.HighriseHostage) HighriseHostage.update(delta);
      if (window.WarlordHunt) WarlordHunt.update(delta);
      if (window.SupplyDepot) SupplyDepot.update(delta);
      if (window.DesertAmbush) DesertAmbush.update(delta);
      if (window.VolcanoFortress) VolcanoFortress.update(delta);
      if (window.PirateRaid) PirateRaid.update(delta);
      if (window.SubmarineHeist) SubmarineHeist.update(delta);
      if (window.CasinoShootout) CasinoShootout.update(delta);
      if (window.ArcticSiege) ArcticSiege.update(delta);
      if (window.MuseumHeist) MuseumHeist.update(delta);
      if (window.TrainHeist) TrainHeist.update(delta);
      if (window.GhostTown) GhostTown.update(delta);
      if (window.AncientTemple) AncientTemple.update(delta);
      if (window.FootballStadium) FootballStadium.update(delta);
      if (window.PrisonEscape) PrisonEscape.update(delta);
      if (window.CyberpunkHeist) CyberpunkHeist.update(delta);
      if (window.AvalancheRescue) AvalancheRescue.update(delta);
      if (window.RomanConquest) RomanConquest.update(delta);
      if (window.OilPlatform) OilPlatform.update(delta);
      if (window.SamuraiSiege) SamuraiSiege.update(delta);
      if (window.BloodDiamond) BloodDiamond.update(delta);
      if (window.SpacePirates) SpacePirates.update(delta);
      if (window.KungFuTemple) KungFuTemple.update(delta);
      if (window.DeepSeaBase) DeepSeaBase.update(delta);
      if (window.JungleTempleRaid) JungleTempleRaid.update(delta);
      if (window.VikingLongship) VikingLongship.update(delta);
      if (window.GuerrillaWar) GuerrillaWar.update(delta);
      if (window.SkyscraperSiege) SkyscraperSiege.update(delta);
      if (window.CargoPlane) CargoPlane.update(delta);
      if (window.BankHeist) BankHeist.update(delta);
      if (window.CyberEspionage) CyberEspionage.update(delta);
      if (window.InsurgentCamp) InsurgentCamp.update(delta);
      if (window.MoonbaseAssault) MoonbaseAssault.update(delta);
      if (window.WitnessProtection) WitnessProtection.update(delta);
      if (window.CartelCompound) CartelCompound.update(delta);
      if (window.TokyoShowdown) TokyoShowdown.update(delta);
    if (window.DoomsdayVault) DoomsdayVault.update(delta);
    if (window.AztecRuins) AztecRuins.update(delta);
    if (window.CiaSafehouse) CiaSafehouse.update(delta);
    if (window.NeonArena) NeonArena.update(delta);
    if (window.GhostOps) GhostOps.update(delta);
    if (window.ArmsSmuggler) ArmsSmuggler.update(delta);
    if (window.SpaceStationSiege) SpaceStationSiege.update(delta);
    if (window.PrisonRiotResponse) PrisonRiotResponse.update(delta);
    if (window.JungleCombat) JungleCombat.update(delta);
    if (window.TrainHijack) TrainHijack.update(delta);
    if (window.BountyHunter) BountyHunter.update(delta);
    if (window.BioLabOutbreak) BioLabOutbreak.update(delta);
    if (window.AntarcticStation) AntarcticStation.update(delta);
    if (window.TimeParadox) TimeParadox.update(delta);
    if (window.NightMarketRaid) NightMarketRaid.update(delta);
    if (window.SubmarineHunter) SubmarineHunter.update(delta);
    if (window.GlacierFortress) GlacierFortress.update(delta);
    if (window.TempleGuardian) TempleGuardian.update(delta);
    if (window.DrugLabTakedown) DrugLabTakedown.update(delta);
    if (window.PowerPlantSiege) PowerPlantSiege.update(delta);
    if (window.AbandonedAsylum) AbandonedAsylum.update(delta);
    if (window.ArcticConvoy) ArcticConvoy.update(delta);
    if (window.ChemicalFactory) ChemicalFactory.update(delta);
    if (window.ColosseumBattle) ColosseumBattle.update(delta);
    if (window.BlackMarketArms) BlackMarketArms.update(delta);
    if (window.HarborBlockade) HarborBlockade.update(delta);
    if (window.MountainPass) MountainPass.update(delta);
    if (window.BankVault) BankVault.update(delta);
    if (window.IslandFortress) IslandFortress.update(delta);
    if (window.TrainStationSiege) TrainStationSiege.update(delta);
    if (window.SewersEscape) SewersEscape.update(delta);
    if (window.WeaponsFactory) WeaponsFactory.update(delta);
    if (window.ResearchStation) ResearchStation.update(delta);
    if (window.UndergroundFight) UndergroundFight.update(delta);
    if (window.FortressBreach) FortressBreach.update(delta);
    if (window.WetlandsAmbush) WetlandsAmbush.update(delta);
    if (window.SpaceColony) SpaceColony.update(delta);
    if (window.GlacierCave) GlacierCave.update(delta);
    if (window.AbandonedCity) AbandonedCity.update(delta);
    if (window.AirBaseAssault) AirBaseAssault.update(delta);
    if (window.VolcanoTemple) VolcanoTemple.update(delta);
    if (window.DiamondMine) DiamondMine.update(delta);
    if (window.OilRigSiege) OilRigSiege.update(delta);
    if (window.HauntedManor) HauntedManor.update(delta);
    if (window.ArcticResearch) ArcticResearch.update(delta);
    if (window.RooftopShowdown) RooftopShowdown.update(delta);
    if (window.UnderwaterLab) UnderwaterLab.update(delta);
    if (window.DesertFortress) DesertFortress.update(delta);
    if (window.RacingCircuit) RacingCircuit.update(delta);
    if (window.UndergroundBunker) UndergroundBunker.update(delta);
    if (window.CarnivalChaos) CarnivalChaos.update(delta);
    if (window.GlacierBase) GlacierBase.update(delta);
    if (window.MetroStation) MetroStation.update(delta);
    if (window.SwampVillage) SwampVillage.update(delta);
    if (window.GhostShip) GhostShip.update(delta);
    if (window.SatelliteDish) SatelliteDish.update(delta);
    if (window.EmbassyRaid) EmbassyRaid.update(delta);
    if (window.CruiseShip) CruiseShip.update(delta);
    if (window.BunkerComplex) BunkerComplex.update(delta);
    if (window.AirportSiege) AirportSiege.update(delta);
    if (window.MountainVillage) MountainVillage.update(delta);
    if (window.RefineryAssault) RefineryAssault.update(delta);
    if (window.SpaceDebris) SpaceDebris.update(delta);
    if (window.JungleAirstrip) JungleAirstrip.update(delta);
    if (window.SunkenWreck) SunkenWreck.update(delta);
    if (window.WarCrimesTrial) WarCrimesTrial.update(delta);
    if (window.ToxicWasteland) ToxicWasteland.update(delta);
    if (window.CargoTrain) CargoTrain.update(delta);
    if (window.TempleRuins) TempleRuins.update(delta);
    if (window.AbandonedMine) AbandonedMine.update(delta);
    if (window.FrozenTundra) FrozenTundra.update(delta);
    if (window.VolcanoIsland) VolcanoIsland.update(delta);
    if (window.FloodedCity) FloodedCity.update(delta);
    if (window.ChemicalPlant) ChemicalPlant.update(delta);
    if (window.BorderCrossing) BorderCrossing.update(delta);
    if (window.CrashedSatellite) CrashedSatellite.update(delta);
    if (window.PowerGrid) PowerGrid.update(delta);
    if (window.SubmarineDock) SubmarineDock.update(delta);
    if (window.SewageTunnels) SewageTunnels.update(delta);
    if (window.WarshipDeck) WarshipDeck.update(delta);
    if (window.HauntedVillage) HauntedVillage.update(delta);
    if (window.AircraftHangar) AircraftHangar.update(delta);
    if (window.ClockTower) ClockTower.update(delta);
    if (window.SpaceElevator) SpaceElevator.update(delta);
    if (window.CitySewer) CitySewer.update(delta);
    if (window.NuclearBunker) NuclearBunker.update(delta);
    if (window.JungleCamp) JungleCamp.update(delta);
    if (window.AuctionHouse) AuctionHouse.update(delta);
    if (window.DamAssault) DamAssault.update(delta);
    if (window.ArcticOutpost) ArcticOutpost.update(delta);
    if (window.CourtroomSiege) CourtroomSiege.update(delta);
    if (window.OilPipeline) OilPipeline.update(delta);
    if (window.TechCampus) TechCampus.update(delta);
    if (window.MedievalFortress) MedievalFortress.update(delta);
    if (window.SkiResort) SkiResort.update(delta);
    if (window.JungleRiver) JungleRiver.update(delta);
    if (window.BunkerHill) BunkerHill.update(delta);
    if (window.DataCenter) DataCenter.update(delta);
    if (window.PirateFortress) PirateFortress.update(delta);
    if (window.RooftopGarden) RooftopGarden.update(delta);
    if (window.BurningCity) BurningCity.update(delta);
    if (window.SwampLab) SwampLab.update(delta);
    if (window.FloatingIsland) FloatingIsland.update(delta);
    if (window.RuralAmbush) RuralAmbush.update(delta);
    if (window.LookoutTower) LookoutTower.update(delta);
    if (window.UndergroundMarket) UndergroundMarket.update(delta);
    if (window.SkyPlatform) SkyPlatform.update(delta);
    if (window.TrainDepot) TrainDepot.update(delta);
    if (window.OrbitalStation) OrbitalStation.update(delta);
    if (window.DesertOutpost) DesertOutpost.update(delta);
    if (window.HarborAssault) HarborAssault.update(delta);
    if (window.CanyonRaid) CanyonRaid.update(delta);
    if (window.ShippingHub) ShippingHub.update(delta);
    if (window.DowntownSiege) DowntownSiege.update(delta);
    if (window.HighwayChase) HighwayChase.update(delta);
    if (window.WaterfallAmbush) WaterfallAmbush.update(delta);
    if (window.ShipwreckReef) ShipwreckReef.update(delta);
    if (window.AncientRuins) AncientRuins.update(delta);
    if (window.GeothermalPlant) GeothermalPlant.update(delta);
    if (window.MissileSiloB) MissileSiloB.update(delta);
    if (window.UnderwaterCave) UnderwaterCave.update(delta);
    if (window.ForestAmbush) ForestAmbush.update(delta);
    if (window.ArenaCombat) ArenaCombat.update(delta);
    if (window.VolcanoObservatory) VolcanoObservatory.update(delta);
    if (window.MiningColony) MiningColony.update(delta);
    if (window.AirshipBattle) AirshipBattle.update(delta);
    if (window.PrisonEscapeB) PrisonEscapeB.update(delta);
    if (window.IslandBase) IslandBase.update(delta);
    if (window.CyberVault) CyberVault.update(delta);
    if (window.HelipadAssault) HelipadAssault.update(delta);
    if (window.ChemicalDepot) ChemicalDepot.update(delta);
    if (window.MonasteryRaid) MonasteryRaid.update(delta);
    if (window.PipelineSabotage) PipelineSabotage.update(delta);
    if (window.IceCave) IceCave.update(delta);
    if (window.DroneFactory) DroneFactory.update(delta);
    if (window.NightMarket) NightMarket.update(delta);
    if (window.WetlandsPatrol) WetlandsPatrol.update(delta);
    if (window.NuclearLab) NuclearLab.update(delta);
    if (window.TankGraveyard) TankGraveyard.update(delta);
    if (window.SatelliteBase) SatelliteBase.update(delta);
    if (window.WarRoom) WarRoom.update(delta);
    if (window.RescueMission) RescueMission.update(delta);
    if (window.SandstormBase) SandstormBase.update(delta);
    if (window.WarRuins) WarRuins.update(delta);
    if (window.FogValley) FogValley.update(delta);
    if (window.SwampFort) SwampFort.update(delta);
    if (window.StormBeach) StormBeach.update(delta);
    if (window.AshFields) AshFields.update(delta);
    if (window.MidnightPort) MidnightPort.update(delta);
    if (window.FireCamp) FireCamp.update(delta);
    if (window.IronWall) IronWall.update(delta);
    if (window.VaporZone) VaporZone.update(delta);
    if (window.ToxicSwamp) ToxicSwamp.update(delta);
    if (window.RadarHill) RadarHill.update(delta);
    if (window.RebelCamp) RebelCamp.update(delta);
    if (window.DeathRidge) DeathRidge.update(delta);
    if (window.GhostFort) GhostFort.update(delta);
    if (window.AcidMarsh) AcidMarsh.update(delta);
    if (window.WarRelic) WarRelic.update(delta);
    if (window.StormWall) StormWall.update(delta);
    if (window.CyberGrid) CyberGrid.update(delta);
    if (window.RustBelt) RustBelt.update(delta);
    if (window.RockFortress) RockFortress.update(delta);
    if (window.WireZone) WireZone.update(delta);
    if (window.PlagueZone) PlagueZone.update(delta);
    if (window.BlastCrater) BlastCrater.update(delta);
    if (window.SteelCity) SteelCity.update(delta);
    if (window.DarkHarbor) DarkHarbor.update(delta);
    if (window.BloodTide) BloodTide.update(delta);
    if (window.CaveFortress) CaveFortress.update(delta);
    if (window.AshLake) AshLake.update(delta);
    if (window.LavaRidge) LavaRidge.update(delta);
    if (window.Oremine) Oremine.update(delta);
    if (window.TrenchCity) TrenchCity.update(delta);
    if (window.BombRange) BombRange.update(delta);
    if (window.FrostKeep) FrostKeep.update(delta);
        if (window.WarChapel) WarChapel.update(delta);
        if (window.BrokenDam) BrokenDam.update(delta);
        if (window.EchoValley) EchoValley.update(delta);
        if (window.SlagHeap) SlagHeap.update(delta);
        if (window.CryptKeep) CryptKeep.update(delta);
        if (window.SkyCitadel) SkyCitadel.update(delta);
        if (window.WarGallery) WarGallery.update(delta);
        if (window.SaltMine) SaltMine.update(delta);
        if (window.WarBunker) WarBunker.update(delta);
        if (window.MachineShop) MachineShop.update(delta);
        if (window.GlacierFort) GlacierFort.update(delta);
        if (window.IronDepot) IronDepot.update(delta);
        if (window.RustYard) RustYard.update(delta);
        if (window.BogFort) BogFort.update(delta);
        if (window.WireNest) WireNest.update(delta);
        if (window.MudCity) MudCity.update(delta);
        if (window.DarkMesa) DarkMesa.update(delta);
        if (window.RuinPort) RuinPort.update(delta);
        if (window.AshDock) AshDock.update(delta);
        if (window.SwampGate) SwampGate.update(delta);
        if (window.FireRidge) FireRidge.update(delta);
        if (window.StormPort) StormPort.update(delta);
        if (window.RiverGate) RiverGate.update(delta);
        if (window.DustHarbor) DustHarbor.update(delta);
        if (window.GrimYard) GrimYard.update(delta);
        if (window.IronShore) IronShore.update(delta);
        if (window.TarPit) TarPit.update(delta);
        if (window.SaltLake) SaltLake.update(delta);
        if (window.WarArch) WarArch.update(delta);
        if (window.CragFort) CragFort.update(delta);
        if (window.VoltDam) VoltDam.update(delta);
        if (window.SootMill) SootMill.update(delta);
        if (window.PipeYard) PipeYard.update(delta);
        if (window.CoalRidge) CoalRidge.update(delta);
        if (window.GunWharf) GunWharf.update(delta);
        if (window.OrePit) OrePit.update(delta);
        if (window.FogBase) FogBase.update(delta);
        if (window.WaxFort) WaxFort.update(delta);
        if (window.HexTown) HexTown.update(delta);
        if (window.KeelYard) KeelYard.update(delta);
        if (window.AshVale) AshVale.update(delta);
        if (window.BogMill) BogMill.update(delta);
        if (window.LavaKeep) LavaKeep.update(delta);
        if (window.TideGate) TideGate.update(delta);
        if (window.ZincMine) ZincMine.update(delta);
        if (window.ClayFort) ClayFort.update(delta);
        if (window.DuskCamp) DuskCamp.update(delta);
        if (window.BoneRidge) BoneRidge.update(delta);
        if (window.FogMill) FogMill.update(delta);
        if (window.SaltFlat) SaltFlat.update(delta);
        if (window.WarCove) WarCove.update(delta);
        if (window.IronGrove) IronGrove.update(delta);
        if (window.DustPit) DustPit.update(delta);
        if (window.MudPass) MudPass.update(delta);
        if (window.CoalBay) CoalBay.update(delta);
        if (window.FlintWall) FlintWall.update(delta);
        if (window.StormGate) StormGate.update(delta);
        if (window.TarDock) TarDock.update(delta);
        if (window.OilDrum) OilDrum.update(delta);
        if (window.PineFort) PineFort.update(delta);
        if (window.CragMill) CragMill.update(delta);
        if (window.SiltBay) SiltBay.update(delta);
        if (window.DuneFort) DuneFort.update(delta);
        if (window.RockQuay) RockQuay.update(delta);
        if (window.AshFort) AshFort.update(delta);
        if (window.GrimPort) GrimPort.update(delta);
        if (window.FenGate) FenGate.update(delta);
        if (window.MossKeep) MossKeep.update(delta);
        if (window.RustCamp) RustCamp.update(delta);
        if (window.WireFort) WireFort.update(delta);
        if (window.ChalkPit) ChalkPit.update(delta);
        if (window.EmberVale) EmberVale.update(delta);
        if (window.GlassDome) GlassDome.update(delta);
        if (window.LochGate) LochGate.update(delta);
        if (window.CokeYard) CokeYard.update(delta);
        if (window.PeatBog) PeatBog.update(delta);
        if (window.IronTomb) IronTomb.update(delta);
        if (window.WeldYard) WeldYard.update(delta);
        if (window.BileFort) BileFort.update(delta);
        if (window.MastHill) MastHill.update(delta);
    if (window.ClayDock) ClayDock.update(delta);
    if (window.FrostCamp) FrostCamp.update(delta);
    if (window.RockLab) RockLab.update(delta);
    if (window.HempCamp) HempCamp.update(delta);
    if (window.FumeGate) FumeGate.update(delta);
    if (window.CoalDock) CoalDock.update(delta);
    if (window.MudKeep) MudKeep.update(delta);
    if (window.GustBase) GustBase.update(delta);
    if (window.SlagPit) SlagPit.update(delta);
    if (window.BoneKeep) BoneKeep.update(delta);
    if (window.WireCamp) WireCamp.update(delta);
    if (window.PeatFort) PeatFort.update(delta);
    if (window.LimeDock) LimeDock.update(delta);
    if (window.IronWharf) IronWharf.update(delta);
    if (window.CragBase) CragBase.update(delta);
    if (window.FlakTower) FlakTower.update(delta);
    if (window.VoltKeep) VoltKeep.update(delta);
    if (window.DuskForge) DuskForge.update(delta);
    if (window.SandKeep) SandKeep.update(delta);
    if (window.FenDock) FenDock.update(delta);
    if (window.TarBase) TarBase.update(delta);
    if (window.LochFort) LochFort.update(delta);
    if (window.StoneBay) StoneBay.update(delta);
    if (window.MireCamp) MireCamp.update(delta);
    if (window.ZincKeep) ZincKeep.update(delta);
    if (window.CrowBase) CrowBase.update(delta);
    if (window.BarkCamp) BarkCamp.update(delta);
    if (window.GaleFort) GaleFort.update(delta);
    if (window.KeelDock) KeelDock.update(delta);
    if (window.IronRidge) IronRidge.update(delta);
    if (window.AshTower) AshTower.update(delta);
    if (window.MudGate) MudGate.update(delta);
    if (window.GrubCamp) GrubCamp.update(delta);
    if (window.VineFort) VineFort.update(delta);
    if (window.SeedBase) SeedBase.update(delta);
    if (window.HornKeep) HornKeep.update(delta);
    if (window.ReelDock) ReelDock.update(delta);
    if (window.ClayRidge) ClayRidge.update(delta);
    if (window.DriftCamp) DriftCamp.update(delta);
    if (window.PikeGate) PikeGate.update(delta);
    if (window.GoreKeep) GoreKeep.update(delta);
    if (window.ThornBase) ThornBase.update(delta);
    if (window.FellCamp) FellCamp.update(delta);
    if (window.SootBase) SootBase.update(delta);
    if (window.MossDock) MossDock.update(delta);
    if (window.IceRidge) IceRidge.update(delta);
    if (window.BrineGate) BrineGate.update(delta);
    if (window.KelpCamp) KelpCamp.update(delta);
        if (window.DuneCamp) DuneCamp.update(delta);
        if (window.HazeFort) HazeFort.update(delta);
        if (window.ArchCamp) ArchCamp.update(delta);
        if (window.QuayKeep) QuayKeep.update(delta);
        if (window.RustRidge) RustRidge.update(delta);
        if (window.BileCamp) BileCamp.update(delta);
        if (window.GritDock) GritDock.update(delta);
        if (window.JadeFort) JadeFort.update(delta);
        if (window.MesaPost) MesaPost.update(delta);
        if (window.CoveBase) CoveBase.update(delta);
        if (window.GlenFort) GlenFort.update(delta);
        if (window.ValeCamp) ValeCamp.update(delta);
        if (window.ReefKeep) ReefKeep.update(delta);
        if (window.PeatDock) PeatDock.update(delta);
        if (window.HolmCamp) HolmCamp.update(delta);
        if (window.CragKeep) CragKeep.update(delta);
        if (window.LochBase) LochBase.update(delta);
        if (window.TarnKeep) TarnKeep.update(delta);
        if (window.FossCamp) FossCamp.update(delta);
        if (window.MireDock) MireDock.update(delta);
        if (window.KnollPost) KnollPost.update(delta);
        if (window.BraeFort) BraeFort.update(delta);
        if (window.BurnCamp) BurnCamp.update(delta);
        if (window.FellKeep) FellKeep.update(delta);
    if (window.SlumWarfare) SlumWarfare.update(delta);
    if (window.CliffOutpost) CliffOutpost.update(delta);
    if (window.FortressGate) FortressGate.update(delta);
    if (window.HighriseAssault) HighriseAssault.update(delta);
    if (window.OvergrownShrine) OvergrownShrine.update(delta);
    if (window.SignalTower) SignalTower.update(delta);
    if (window.AmmoBunker) AmmoBunker.update(delta);
    if (window.LootVault) LootVault.update(delta);
    if (window.CoastalCliff) CoastalCliff.update(delta);
    if (window.TacticalHub) TacticalHub.update(delta);
    if (window.SubwayAssault) SubwayAssault.update(delta);
    if (window.CargoDock) CargoDock.update(delta);
    if (window.WinterVillage) WinterVillage.update(delta);
    if (window.PrisonTowerB) PrisonTowerB.update(delta);
    if (window.AirfieldRaid) AirfieldRaid.update(delta);
    if (window.CyberBunker) CyberBunker.update(delta);
    if (window.SwampFortress) SwampFortress.update(delta);
    if (window.DuneFortress) DuneFortress.update(delta);
    if (window.EvacuationZone) EvacuationZone.update(delta);
    if (window.JunkyardWar) JunkyardWar.update(delta);
    if (window.CasinoFloor) CasinoFloor.update(delta);
    if (window.MetroHub) MetroHub.update(delta);
    if (window.FactoryAssault) FactoryAssault.update(delta);
    if (window.ArmoryRaid) ArmoryRaid.update(delta);
    if (window.CommandPost) CommandPost.update(delta);
    if (window.QuarantineZone) QuarantineZone.update(delta);
    if (window.WaterTreatment) WaterTreatment.update(delta);
    if (window.MountainShrine) MountainShrine.update(delta);
    if (window.AirborneAssault) AirborneAssault.update(delta);
    if (window.MineComplex) MineComplex.update(delta);
    if (window.SatelliteLaunch) SatelliteLaunch.update(delta);
    if (window.RuinsCity) RuinsCity.update(delta);
    if (window.FuelStation) FuelStation.update(delta);
    if (window.BeachLanding) BeachLanding.update(delta);
    if (window.RooftopSniper) RooftopSniper.update(delta);
    if (window.CrashedChopper) CrashedChopper.update(delta);
    if (window.PalaceRaid) PalaceRaid.update(delta);
    if (window.FloodZone) FloodZone.update(delta);
    if (window.ScrapyardSiege) ScrapyardSiege.update(delta);
    if (window.RadioBunker) RadioBunker.update(delta);
    if (window.CoastalFortress) CoastalFortress.update(delta);
    if (window.AncientFort) AncientFort.update(delta);
    if (window.FrozenBase) FrozenBase.update(delta);
    if (window.LavaFlow) LavaFlow.update(delta);
    if (window.AbandonedPrison) AbandonedPrison.update(delta);
    if (window.CanyonBase) CanyonBase.update(delta);
    if (window.DarkMarket) DarkMarket.update(delta);
    if (window.ShippingLane) ShippingLane.update(delta);
    if (window.NuclearShelter) NuclearShelter.update(delta);
    if (window.ChurchSiege) ChurchSiege.update(delta);
    if (window.ResortSiege) ResortSiege.update(delta);
    if (window.NightFactory) NightFactory.update(delta);
    if (window.MountaintopBase) MountaintopBase.update(delta);
    if (window.BunkerNetwork) BunkerNetwork.update(delta);
    if (window.ReconPost) ReconPost.update(delta);
    if (window.MuseumAssault) MuseumAssault.update(delta);
    if (window.StagingArea) StagingArea.update(delta);
    if (window.GhostVillage) GhostVillage.update(delta);
    if (window.RiotZone) RiotZone.update(delta);
    if (window.Colosseum) Colosseum.update(delta);
    if (window.MazeFortress) MazeFortress.update(delta);
    if (window.SpaceHub) SpaceHub.update(delta);
    if (window.PolarStation) PolarStation.update(delta);
    if (window.SunkenShip) SunkenShip.update(delta);
    if (window.RadarDome) RadarDome.update(delta);
    if (window.ShantyFortress) ShantyFortress.update(delta);
    if (window.CliffSummit) CliffSummit.update(delta);
    if (window.ToxicPlant) ToxicPlant.update(delta);
    if (window.CraterWar) CraterWar.update(delta);
    if (window.WarCamp) WarCamp.update(delta);
    if (window.SnowFort) SnowFort.update(delta);
    if (window.WarIsland) WarIsland.update(delta);
    if (window.DeepBase) DeepBase.update(delta);
    if (window.VoltBase) VoltBase.update(delta);
    if (window.TempleRaid) TempleRaid.update(delta);
    if (window.MagmaBase) MagmaBase.update(delta);
    if (window.TundraBase) TundraBase.update(delta);
    if (window.OrbitalPlatform) OrbitalPlatform.update(delta);
    if (window.TrenchAssault) TrenchAssault.update(delta);
    if (window.WaterfallBase) WaterfallBase.update(delta);
    if (window.VaultRaid) VaultRaid.update(delta);
    if (window.SpaceDock) SpaceDock.update(delta);
    if (window.LavaCave) LavaCave.update(delta);
    if (window.NeonCity) NeonCity.update(delta);
    if (window.FortressPeak) FortressPeak.update(delta);
    if (window.ThermalPlant) ThermalPlant.update(delta);
    if (window.TidalBase) TidalBase.update(delta);
    if (window.SkyBase) SkyBase.update(delta);
    if (window.SewerNetwork) SewerNetwork.update(delta);
    if (window.CaveAmbush) CaveAmbush.update(delta);
    if (window.TowerSiege) TowerSiege.update(delta);
    if (window.CyberDome) CyberDome.update(delta);
    if (window.JungleVillage) JungleVillage.update(delta);
    if (window.GlacierVault) GlacierVault.update(delta);
    if (window.StormTower) StormTower.update(delta);
    if (window.SubterraneanBase) SubterraneanBase.update(delta);
    if (window.SiegeCamp) SiegeCamp.update(delta);
    if (window.VolcanoRim) VolcanoRim.update(delta);
    if (window.OutpostDelta) OutpostDelta.update(delta);
    if (window.JungleRuin) JungleRuin.update(delta);
    if (window.SkyCarrier) SkyCarrier.update(delta);
    if (window.DesertRuins) DesertRuins.update(delta);
    if (window.SnowValley) SnowValley.update(delta);
    if (window.RuinedFort) RuinedFort.update(delta);
    if (window.CoralReef) CoralReef.update(delta);
    if (window.PirateBay) PirateBay.update(delta);
    if (window.FortressUnderground) FortressUnderground.update(delta);
    if (window.FloodedMall) FloodedMall.update(delta);
    if (window.MountainMonastery) MountainMonastery.update(delta);
    if (window.OceanPlatform) OceanPlatform.update(delta);
    if (window.FrozenTemple) FrozenTemple.update(delta);
    if (window.CargoFortress) CargoFortress.update(delta);
    if (window.WarBridge) WarBridge.update(delta);
    if (window.CyberTrain) CyberTrain.update(delta);
    if (window.LavaBridge) LavaBridge.update(delta);
    if (window.ToxicSewer) ToxicSewer.update(delta);
    if (window.IceBridge) IceBridge.update(delta);
    if (window.MesaFort) MesaFort.update(delta);
    if (window.WarHospital) WarHospital.update(delta);
    if (window.SandCastle) SandCastle.update(delta);
    if (window.DamFortress) DamFortress.update(delta);
    if (window.HauntedHouse) HauntedHouse.update(delta);
    if (window.CrashedStation) CrashedStation.update(delta);
    if (window.SeaCliff) SeaCliff.update(delta);
    if (window.CliffVillage) CliffVillage.update(delta);
    if (window.DroneBay) DroneBay.update(delta);
    if (window.DeepBunker) DeepBunker.update(delta);
    if (window.MineCart) MineCart.update(delta);
    if (window.WaterTowerSiege) WaterTowerSiege.update(delta);
    if (window.BioStation) BioStation.update(delta);
    if (window.CrumblingCastle) CrumblingCastle.update(delta);
    if (window.SkyTemple) SkyTemple.update(delta);
    if (window.PrisonIsland) PrisonIsland.update(delta);
    if (window.LightningBase) LightningBase.update(delta);
    if (window.FrozenLab) FrozenLab.update(delta);
    if (window.CrystalCave) CrystalCave.update(delta);
    if (window.DataVault) DataVault.update(delta);
    if (window.LavaFortress) LavaFortress.update(delta);
    if (window.SandStorm) SandStorm.update(delta);
    if (window.NuclearSilo) NuclearSilo.update(delta);
    if (window.RuinedFactory) RuinedFactory.update(delta);
    if (window.ScorchedCitadel) ScorchedCitadel.update(delta);
    if (window.AcidPlant) AcidPlant.update(delta);
    if (window.DesertLab) DesertLab.update(delta);
    if (window.StormBunker) StormBunker.update(delta);
    if (window.CargoPort) CargoPort.update(delta);
    if (window.WarMarket) WarMarket.update(delta);
    if (window.ShipGraveyard) ShipGraveyard.update(delta);
    if (window.BlastedBridge) BlastedBridge.update(delta);
    if (window.FortressRuins) FortressRuins.update(delta);
    if (window.BattleDepot) BattleDepot.update(delta);
    if (window.FrozenFortress) FrozenFortress.update(delta);
    if (window.LavaTemple) LavaTemple.update(delta);
    if (window.MagmaCave) MagmaCave.update(delta);
    if (window.SkyStation) SkyStation.update(delta);
    if (window.BloodArena) BloodArena.update(delta);
    if (window.SnowFortress) SnowFortress.update(delta);
    if (window.WinterBase) WinterBase.update(delta);
    if (window.CyberStation) CyberStation.update(delta);
    if (window.BurningTemple) BurningTemple.update(delta);
    if (window.PlagueTown) PlagueTown.update(delta);
    if (window.ShadowPalace) ShadowPalace.update(delta);
    if (window.WarSubmarine) WarSubmarine.update(delta);
    if (window.SteelCanyon) SteelCanyon.update(delta);
    if (window.FireTemple) FireTemple.update(delta);
    if (window.CrystalVault) CrystalVault.update(delta);
    if (window.VolcanicCity) VolcanicCity.update(delta);
    if (window.LightningTower) LightningTower.update(delta);
    if (window.MidnightBase) MidnightBase.update(delta);
    if (window.WreckedCity) WreckedCity.update(delta);
    if (window.ShadowLab) ShadowLab.update(delta);
    if (window.IronKeep) IronKeep.update(delta);
    if (window.MetalMarsh) MetalMarsh.update(delta);
    if (window.ThunderKeep) ThunderKeep.update(delta);
    if (window.VolcanoPeak) VolcanoPeak.update(delta);
    if (window.ToxicMarsh) ToxicMarsh.update(delta);
    if (window.CitySiege) CitySiege.update(delta);
    if (window.WarDocks) WarDocks.update(delta);
    if (window.ToxicFacility) ToxicFacility.update(delta);
    if (window.CrashedShip) CrashedShip.update(delta);
    if (window.MoltenKeep) MoltenKeep.update(delta);
    if (window.BurningBridge) BurningBridge.update(delta);
    if (window.DarkCitadel) DarkCitadel.update(delta);
    if (window.SmokeValley) SmokeValley.update(delta);
    if (window.SpaceFortress) SpaceFortress.update(delta);
    if (window.BattleArena) BattleArena.update(delta);
    if (window.WarPort) WarPort.update(delta);
    if (window.IronValley) IronValley.update(delta);
    if (window.LavaArena) LavaArena.update(delta);
    if (window.SunkenLab) SunkenLab.update(delta);
    if (window.SeaFortress) SeaFortress.update(delta);
    if (window.ShadowValley) ShadowValley.update(delta);
    if (window.AshRuins) AshRuins.update(delta);
    if (window.CrimsonKeep) CrimsonKeep.update(delta);
    if (window.StormValley) StormValley.update(delta);
    if (window.FrozenValley) FrozenValley.update(delta);
    if (window.FallenTemple) FallenTemple.update(delta);
    if (window.ScorchedLab) ScorchedLab.update(delta);
    if (window.IronMarsh) IronMarsh.update(delta);
    if (window.SpaceWreck) SpaceWreck.update(delta);
    if (window.DustValley) DustValley.update(delta);
    if (window.GhostFortress) GhostFortress.update(delta);
    if (window.QuantumBase) QuantumBase.update(delta);
    if (window.PlasmaTower) PlasmaTower.update(delta);
    if (window.ToxicLab) ToxicLab.update(delta);
    if (window.SteelDome) SteelDome.update(delta);
    if (window.BuriedCity) BuriedCity.update(delta);
    if (window.MagmaBridge) MagmaBridge.update(delta);
    if (window.VaporStation) VaporStation.update(delta);
    if (window.WarChurch) WarChurch.update(delta);
    if (window.FrozenDock) FrozenDock.update(delta);
    if (window.RustCanyon) RustCanyon.update(delta);
    if (window.AcidBay) AcidBay.update(delta);
    if (window.ConcreteMaze) ConcreteMaze.update(delta);
    if (window.SkyPrison) SkyPrison.update(delta);
    if (window.LavaCity) LavaCity.update(delta);
    if (window.WarZoo) WarZoo.update(delta);
    if (window.NukeCrater) NukeCrater.update(delta);
    if (window.AmberRuins) AmberRuins.update(delta);
    if (window.DeltaBase) DeltaBase.update(delta);
    if (window.StormShip) StormShip.update(delta);
    if (window.FrozenCrater) FrozenCrater.update(delta);
    if (window.EmberFields) EmberFields.update(delta);
    if (window.HauntedBay) HauntedBay.update(delta);
    if (window.FlamePit) FlamePit.update(delta);
    if (window.NanoLab) NanoLab.update(delta);
    if (window.SunkenPalace) SunkenPalace.update(delta);
    if (window.WarGarden) WarGarden.update(delta);
    if (window.BattleCanyon) BattleCanyon.update(delta);
    if (window.CliffBase) CliffBase.update(delta);
    if (window.RustedBay) RustedBay.update(delta);
    if (window.EngineRoom) EngineRoom.update(delta);
    if (window.ChemPlant) ChemPlant.update(delta);
    if (window.WarTower) WarTower.update(delta);
    if (window.FungalCave) FungalCave.update(delta);
    if (window.RadioStation) RadioStation.update(delta);
    if (window.SniperHill) SniperHill.update(delta);
    if (window.OrbitalDrop) OrbitalDrop.update(delta);
    if (window.IceMine) IceMine.update(delta);
    if (window.ToxicBay) ToxicBay.update(delta);
    if (window.DeadSea) DeadSea.update(delta);
    if (window.LavaTubes) LavaTubes.update(delta);
    if (window.WarTrain) WarTrain.update(delta);
    if (window.ShadowReef) ShadowReef.update(delta);
    if (window.BoneYard) BoneYard.update(delta);
    if (window.SteelMill) SteelMill.update(delta);
    if (window.AcidMine) AcidMine.update(delta);
    if (window.WarResort) WarResort.update(delta);
    if (window.PlagueShip) PlagueShip.update(delta);
    if (window.ThunderBase) ThunderBase.update(delta);
    if (window.SkyBarge) SkyBarge.update(delta);
    if (window.FrozenPalace) FrozenPalace.update(delta);
    if (window.CyberSwamp) CyberSwamp.update(delta);
    if (window.IceTower) IceTower.update(delta);
    if (window.CursedShip) CursedShip.update(delta);
    if (window.NeonSwamp) NeonSwamp.update(delta);
    if (window.WarCathedral) WarCathedral.update(delta);
    if (window.BloodSwamp) BloodSwamp.update(delta);
    if (window.MechBay) MechBay.update(delta);
    if (window.GravityWell) GravityWell.update(delta);
    if (window.PoisonGrove) PoisonGrove.update(delta);
    if (window.ArcticLab) ArcticLab.update(delta);
    if (window.TrenchWar) TrenchWar.update(delta);
    if (window.UnderseaDome) UnderseaDome.update(delta);
    if (window.SolarForge) SolarForge.update(delta);
    if (window.IronCitadel) IronCitadel.update(delta);
    if (window.WarShrine) WarShrine.update(delta);
    if (window.PlagueLab) PlagueLab.update(delta);
    if (window.DeathValley) DeathValley.update(delta);
    if (window.VoidStation) VoidStation.update(delta);
    if (window.LavaDome) LavaDome.update(delta);
    if (window.SandFortress) SandFortress.update(delta);
    if (window.BoneTemple) BoneTemple.update(delta);
    if (window.CyberRuins) CyberRuins.update(delta);
    if (window.StormBase) StormBase.update(delta);
    if (window.DeepBunker) DeepBunker.update(delta);
    if (window.WarMuseum) WarMuseum.update(delta);
    if (window.RustPalace) RustPalace.update(delta);
    if (window.JungleFort) JungleFort.update(delta);
    if (window.FlameShrine) FlameShrine.update(delta);
    if (window.AcidCrater) AcidCrater.update(delta);
    if (window.OrbitalBase) OrbitalBase.update(delta);
    if (window.TarPits) TarPits.update(delta);
    if (window.CrystalMine) CrystalMine.update(delta);
    if (window.PlagueSwamp) PlagueSwamp.update(delta);
    if (window.FrozenKeep) FrozenKeep.update(delta);
    if (window.MunitionsPlant) MunitionsPlant.update(delta);
    if (window.TriageZone) TriageZone.update(delta);
    if (window.BlackOps) BlackOps.update(delta);
    if (window.CraterCity) CraterCity.update(delta);
    if (window.SunkenCarrier) SunkenCarrier.update(delta);
    if (window.NanoCity) NanoCity.update(delta);
    if (window.SiloComplex) SiloComplex.update(delta);
    if (window.SkyGarden) SkyGarden.update(delta);
    if (window.LavaTrench) LavaTrench.update(delta);
    if (window.WraithShip) WraithShip.update(delta);
    if (window.WarCemetery) WarCemetery.update(delta);
    if (window.PlagueCove) PlagueCove.update(delta);
    if (window.ArenaDome) ArenaDome.update(delta);
    if (window.MesaOutpost) MesaOutpost.update(delta);
    if (window.SpireCity) SpireCity.update(delta);
    if (window.ShadowMarket) ShadowMarket.update(delta);
    if (window.PolarSiege) PolarSiege.update(delta);
    if (window.ForgottenLab) ForgottenLab.update(delta);
    if (window.WarStation) WarStation.update(delta);
    if (window.PlagueTower) PlagueTower.update(delta);
    if (window.ToxicMine) ToxicMine.update(delta);
    if (window.FrozenReactor) FrozenReactor.update(delta);
    if (window.NeonBunker) NeonBunker.update(delta);
    if (window.DesertFort) DesertFort.update(delta);
    if (window.MagmaCore) MagmaCore.update(delta);
    if (window.SkullFortress) SkullFortress.update(delta);
    if (window.PlasmaOutpost) PlasmaOutpost.update(delta);
    if (window.SiegePlatform) SiegePlatform.update(delta);
    if (window.BloodChapel) BloodChapel.update(delta);
    if (window.ToxicHarbor) ToxicHarbor.update(delta);
    if (window.IronTower) IronTower.update(delta);
    if (window.OrbitalRelay) OrbitalRelay.update(delta);
    if (window.BattleConvoy) BattleConvoy.update(delta);
    if (window.EchoStation) EchoStation.update(delta);
    if (window.WarheadCache) WarheadCache.update(delta);
    if (window.WarConvoy) WarConvoy.update(delta);
    if (window.AshCitadel) AshCitadel.update(delta);
    if (window.MoltenBridge) MoltenBridge.update(delta);
    if (window.VoidLab) VoidLab.update(delta);
    if (window.BlackMarch) BlackMarch.update(delta);
    if (window.IceCarrier) IceCarrier.update(delta);
    if (window.JungleRuins) JungleRuins.update(delta);
    if (window.ThunderTower) ThunderTower.update(delta);
    if (window.MidnightRaid) MidnightRaid.update(delta);
    if (window.RustFactory) RustFactory.update(delta);
    if (window.DustStorm) DustStorm.update(delta);
    if (window.AssaultCamp) AssaultCamp.update(delta);
    if (window.StoneQuarry) StoneQuarry.update(delta);
    if (window.WarzoneMarket) WarzoneMarket.update(delta);
    if (window.RidgeBase) RidgeBase.update(delta);
    if (window.PoisonLake) PoisonLake.update(delta);
    if (window.SkyDock) SkyDock.update(delta);
    if (window.LavaCore) LavaCore.update(delta);
    if (window.NeonSubway) NeonSubway.update(delta);
    if (window.CopperMine) CopperMine.update(delta);
    if (window.WastelandHub) WastelandHub.update(delta);
    if (window.TrenchLine) TrenchLine.update(delta);
    if (window.GlacierBunker) GlacierBunker.update(delta);
    if (window.PalaceRuins) PalaceRuins.update(delta);
    if (window.DamStation) DamStation.update(delta);
    if (window.Shipyard) Shipyard.update(delta);
    if (window.SpacePort) SpacePort.update(delta);
    if (window.FrozenRiver) FrozenRiver.update(delta);
    if (window.AvalanchePass) AvalanchePass.update(delta);
    if (window.BunkerCity) BunkerCity.update(delta);
    if (window.WarlordPalace) WarlordPalace.update(delta);
    if (window.ScrapYard) ScrapYard.update(delta);
    if (window.CommandShip) CommandShip.update(delta);
    if (window.DesertBase) DesertBase.update(delta);
    if (window.TrainWreck) TrainWreck.update(delta);
    if (window.CaveTemple) CaveTemple.update(delta);
    if (window.GhostFactory) GhostFactory.update(delta);
    if (window.BombShelter) BombShelter.update(delta);
    if (window.SandDunes) SandDunes.update(delta);
    if (window.SwampRefinery) SwampRefinery.update(delta);
    if (window.RooftopSiege) RooftopSiege.update(delta);
    if (window.SunkenBase) SunkenBase.update(delta);
    if (window.FloodCity) FloodCity.update(delta);
    if (window.CoastGuard) CoastGuard.update(delta);
    if (window.CanyonFort) CanyonFort.update(delta);
    if (window.SniperRidge) SniperRidge.update(delta);
    if (window.HarborFort) HarborFort.update(delta);
    if (window.TundraCamp) TundraCamp.update(delta);
    if (window.OilDepot) OilDepot.update(delta);
    if (window.BattleCrater) BattleCrater.update(delta);
    if (window.UrbanDecay) UrbanDecay.update(delta);
    if (window.WarAirfield) WarAirfield.update(delta);
    if (window.LavaBase) LavaBase.update(delta);
    if (window.StormIsland) StormIsland.update(delta);
    if (window.SaltFlats) SaltFlats.update(delta);
    if (window.AshPlains) AshPlains.update(delta);
    if (window.WarDepot) WarDepot.update(delta);
    if (window.CommandCenter) CommandCenter.update(delta);
    if (window.HighlandFort) HighlandFort.update(delta);
    if (window.FloodDam) FloodDam.update(delta);
    if (window.IceBreaker) IceBreaker.update(delta);
    if (window.MissileBase) MissileBase.update(delta);
    if (window.WreckYard) WreckYard.update(delta);
    if (window.TankYard) TankYard.update(delta);
    if (window.ForwardBase) ForwardBase.update(delta);
    if (window.DeathSwamp) DeathSwamp.update(delta);
    if (window.SteelFortress) SteelFortress.update(delta);
    if (window.PoisonMarsh) PoisonMarsh.update(delta);
    if (window.JungleMaze) JungleMaze.update(delta);
    if (window.WarGate) WarGate.update(delta);
    if (window.NeonRuins) NeonRuins.update(delta);
    if (window.DarkWoods) DarkWoods.update(delta);
    if (window.ShadowBase) ShadowBase.update(delta);
    if (window.PlagueCity) PlagueCity.update(delta);
    if (window.ThunderRidge) ThunderRidge.update(delta);
    if (window.FloodPlains) FloodPlains.update(delta);
    if (window.NuclearWaste) NuclearWaste.update(delta);
    if (window.BloodRiver) BloodRiver.update(delta);
    if (window.VoidBase) VoidBase.update(delta);
    if (window.AcidLake) AcidLake.update(delta);
    if (window.StormFortress) StormFortress.update(delta);
    if (window.FrostHarbor) FrostHarbor.update(delta);
    if (window.LavaRiver) LavaRiver.update(delta);
    if (window.SiegeLines) SiegeLines.update(delta);
    if (window.GhostRidge) GhostRidge.update(delta);
    if (window.WarLab) WarLab.update(delta);
    if (window.IceDock) IceDock.update(delta);
    if (window.RubbleCity) RubbleCity.update(delta);
    if (window.WinterAssault) WinterAssault.update(delta);
    if (window.CryptBase) CryptBase.update(delta);
    if (window.WarDome) WarDome.update(delta);
    if (window.HarborRaid) HarborRaid.update(delta);
    if (window.ReefBase) ReefBase.update(delta);
    if (window.CanyonWar) CanyonWar.update(delta);
    if (window.MagmaLab) MagmaLab.update(delta);
    if (window.FireBase) FireBase.update(delta);
    if (window.WarCrypt) WarCrypt.update(delta);
    if (window.WarPrison) WarPrison.update(delta);
    if (window.CoastLine) CoastLine.update(delta);
    if (window.RockBase) RockBase.update(delta);
    if (window.PoisonBase) PoisonBase.update(delta);
    if (window.MoonGate) MoonGate.update(delta);
    if (window.WarShip) WarShip.update(delta);
    if (window.JadeTemple) JadeTemple.update(delta);
    if (window.AncientColosseum) AncientColosseum.update(delta);
    if (window.TundraVillage) TundraVillage.update(delta);
    if (window.SolarFarm) SolarFarm.update(delta);
    if (window.JungleFortress) JungleFortress.update(delta);
    if (window.BridgeAssault) BridgeAssault.update(delta);
    if (window.SpaceWreckage) SpaceWreckage.update(delta);
    if (window.UndergroundLab) UndergroundLab.update(delta);
    if (window.HospitalRaid) HospitalRaid.update(delta);
    if (window.WeaponsDepot) WeaponsDepot.update(delta);
    if (window.LavaCavern) LavaCavern.update(delta);
    if (window.NavalBase) NavalBase.update(delta);
    if (window.ChemFactory) ChemFactory.update(delta);
    if (window.PalaceGardens) PalaceGardens.update(delta);
    if (window.SubmarineHunt) SubmarineHunt.update(delta);
    if (window.ArcticStation) ArcticStation.update(delta);
    if (window.CityRooftop) CityRooftop.update(delta);
    if (window.PowerPlant) PowerPlant.update(delta);
    if (window.TrainStation) TrainStation.update(delta);
    if (window.CanyonAmbush) CanyonAmbush.update(delta);
    if (window.MissileSilo) MissileSilo.update(delta);
    if (window.FloatingPlatform) FloatingPlatform.update(delta);
    if (window.WarFactory) WarFactory.update(delta);
    if (window.IcePalace) IcePalace.update(delta);
    if (window.VolcanoBase) VolcanoBase.update(delta);
    if (window.UndergroundCity) UndergroundCity.update(delta);
    if (window.CoastalVillage) CoastalVillage.update(delta);
    if (window.ResearchVessel) ResearchVessel.update(delta);
    if (window.StormDrain) StormDrain.update(delta);
    if (window.ThroneRoom) ThroneRoom.update(delta);
    if (window.JungleOutpost) JungleOutpost.update(delta);
    if (window.NavalYard) NavalYard.update(delta);
    if (window.IceShelf) IceShelf.update(delta);
    if (window.RuinsAssault) RuinsAssault.update(delta);
    if (window.AircraftCarrier) AircraftCarrier.update(delta);
    if (window.SportsStadium) SportsStadium.update(delta);
    if (window.NukeTransport) NukeTransport.update(delta);
    if (window.AbandonedFactory) AbandonedFactory.update(delta);
  if (window.SwampBase) SwampBase.update(delta);
  if (window.HauntedCastle) HauntedCastle.update(delta);
  if (window.CliffFortress) CliffFortress.update(delta);
  if (window.ServerFarm) ServerFarm.update(delta);
  if (window.CityBank) CityBank.update(delta);
  if (window.AncientPyramid) AncientPyramid.update(delta);
  if (window.ToxicJungle) ToxicJungle.update(delta);
  if (window.HarborDefense) HarborDefense.update(delta);
  if (window.SpaceDerelict) SpaceDerelict.update(delta);
  if (window.MedievalDungeon) MedievalDungeon.update(delta);
  if (window.CyberLab) CyberLab.update(delta);
  if (window.BorderFort) BorderFort.update(delta);
  if (window.HauntedHotel) HauntedHotel.update(delta);
  if (window.StormCoast) StormCoast.update(delta);
  if (window.RadiationZone) RadiationZone.update(delta);
  if (window.CrashedSpaceship) CrashedSpaceship.update(delta);
  if (window.IceCavern) IceCavern.update(delta);
  if (window.FloodedSubway) FloodedSubway.update(delta);
  if (window.DesertTemple) DesertTemple.update(delta);
  if (window.MilitaryAcademy) MilitaryAcademy.update(delta);
  if (window.NeonDistrict) NeonDistrict.update(delta);
  if (window.UnderwaterTemple) UnderwaterTemple.update(delta);
  if (window.SpacePrison) SpacePrison.update(delta);
  if (window.PirateGalleon) PirateGalleon.update(delta);
  if (window.AbandonedChurch) AbandonedChurch.update(delta);
  if (window.GreekRuins) GreekRuins.update(delta);
  if (window.CoalMine) CoalMine.update(delta);
  if (window.MountainFortress) MountainFortress.update(delta);
  if (window.ArmoredTrain) ArmoredTrain.update(delta);
  if (window.TeslaLab) TeslaLab.update(delta);
  if (window.FrozenCastle) FrozenCastle.update(delta);
  if (window.VampireLair) VampireLair.update(delta);
  if (window.SubmarineGraveyard) SubmarineGraveyard.update(delta);
  if (window.ScorchedEarth) ScorchedEarth.update(delta);
  if (window.CrystalCaves) CrystalCaves.update(delta);
  if (window.BioDome) BioDome.update(delta);
  if (window.WartimeFactory) WartimeFactory.update(delta);
  if (window.SpaceHangar) SpaceHangar.update(delta);
  if (window.AmusementPark) AmusementPark.update(delta);
  if (window.AtlantisRuins) AtlantisRuins.update(delta);
  if (window.QuantumLab) QuantumLab.update(delta);
  if (window.BurningVillage) BurningVillage.update(delta);
  if (window.AbandonedSchool) AbandonedSchool.update(delta);
  if (window.OrbitalWeapons) OrbitalWeapons.update(delta);
  if (window.WastelandTown) WastelandTown.update(delta);
  if (window.OilRefinery) OilRefinery.update(delta);
  if (window.ColosseumSiege) ColosseumSiege.update(delta);
  if (window.SunkenDestroyer) SunkenDestroyer.update(delta);
  if (window.MoonOutpost) MoonOutpost.update(delta);
  if (window.CyberFortress) CyberFortress.update(delta);
  if (window.PharaohTomb) PharaohTomb.update(delta);
  if (window.LavaCaves) LavaCaves.update(delta);
  if (window.StormCarrier) StormCarrier.update(delta);
  if (window.DroneWarfare) DroneWarfare.update(delta);
  if (window.CathedralSiege) CathedralSiege.update(delta);
  if (window.SalvageYard) SalvageYard.update(delta);
  if (window.BioweaponLab) BioweaponLab.update(delta);
  if (window.NavalDockyard) NavalDockyard.update(delta);
  if (window.SniperTower) SniperTower.update(delta);
  if (window.CursedVillage) CursedVillage.update(delta);
  if (window.TankerShip) TankerShip.update(delta);
  if (window.IronMine) IronMine.update(delta);
  if (window.ShantyTown) ShantyTown.update(delta);
  if (window.AztecTemple) AztecTemple.update(delta);
  if (window.CircusTent) CircusTent.update(delta);
  if (window.WeatherStation) WeatherStation.update(delta);
  if (window.LaserFacility) LaserFacility.update(delta);
  if (window.SubmarineBay) SubmarineBay.update(delta);
  if (window.HeistVault) HeistVault.update(delta);
  if (window.Catacombs) Catacombs.update(delta);
  if (window.CrashedTrain) CrashedTrain.update(delta);
  if (window.CrystalPalace) CrystalPalace.update(delta);
  if (window.DeltaForce) DeltaForce.update(delta);
  if (window.PrisonTower) PrisonTower.update(delta);
  if (window.RobotFactory) RobotFactory.update(delta);
  if (window.WarMemorial) WarMemorial.update(delta);
  if (window.PrisonYard) PrisonYard.update(delta);
  if (window.MineShaft) MineShaft.update(delta);
  if (window.CargoTerminal) CargoTerminal.update(delta);
  if (window.MilitaryParade) MilitaryParade.update(delta);
  if (window.GasPlatform) GasPlatform.update(delta);
  if (window.Monorail) Monorail.update(delta);
  if (window.ArchaeologicalDig) ArchaeologicalDig.update(delta);
  if (window.CaveNetwork) CaveNetwork.update(delta);
  if (window.RooftopChase) RooftopChase.update(delta);
  if (window.TyphoonDeck) TyphoonDeck.update(delta);
  if (window.SwampOutpost) SwampOutpost.update(delta);
  if (window.SunkenTemple) SunkenTemple.update(delta);
  if (window.SalvageBarge) SalvageBarge.update(delta);
  if (window.FrozenHarbor) FrozenHarbor.update(delta);
  if (window.IceFortress) IceFortress.update(delta);
  if (window.MerchantShip) MerchantShip.update(delta);
  if (window.HarborCrane) HarborCrane.update(delta);
  if (window.RacingTrack) RacingTrack.update(delta);
  if (window.TortureChamber) TortureChamber.update(delta);
  if (window.PlagueVillage) PlagueVillage.update(delta);
  if (window.CyberYacht) CyberYacht.update(delta);
  if (window.FortressPrison) FortressPrison.update(delta);
  if (window.BattleStadium) BattleStadium.update(delta);
  if (window.HauntedLighthouse) HauntedLighthouse.update(delta);
  if (window.CanyonAssault) CanyonAssault.update(delta);
  if (window.DemolitionSite) DemolitionSite.update(delta);
  if (window.AirshipRaid) AirshipRaid.update(delta);
  if (window.TempleRun) TempleRun.update(delta);
  if (window.AsteroidBase) AsteroidBase.update(delta);
  if (window.FishingVillage) FishingVillage.update(delta);
  if (window.OperaHouse) OperaHouse.update(delta);
  if (window.CityHall) CityHall.update(delta);
  if (window.VolcanoSummit) VolcanoSummit.update(delta);
      if (window.FloatingFortress) FloatingFortress.update(delta);
      if (window.Slaughterhouse) Slaughterhouse.update(delta);
      if (window.TrainGraveyard) TrainGraveyard.update(delta);
      if (window.SewagePlant) SewagePlant.update(delta);
      if (window.UniversityRaid) UniversityRaid.update(delta);
      if (window.RefugeeCamp) RefugeeCamp.update(delta);
      if (window.NuclearConvoy) NuclearConvoy.update(delta);
      if (window.PowerSubstation) PowerSubstation.update(delta);
      if (window.SubmarinePen) SubmarinePen.update(delta);
      if (window.TorpedoFactory) TorpedoFactory.update(delta);
      if (window.MunitionsDepot) MunitionsDepot.update(delta);
      if (window.AbandonedMall) AbandonedMall.update(delta);
      if (window.GoldVault) GoldVault.update(delta);
      if (window.CustomsPost) CustomsPost.update(delta);
      if (window.JungleLab) JungleLab.update(delta);
      if (window.SatelliteStation) SatelliteStation.update(delta);
      if (window.DestroyerEscort) DestroyerEscort.update(delta);
      if (window.CoastalBattery) CoastalBattery.update(delta);
      if (window.PrisonColony) PrisonColony.update(delta);
      if (window.AsteroidField) AsteroidField.update(delta);
      if (window.VolcanoLair) VolcanoLair.update(delta);
      if (window.SeaFort) SeaFort.update(delta);
      if (window.FuelDepot) FuelDepot.update(delta);
      if (window.DerelictTown) DerelictTown.update(delta);
      if (window.MethLab) MethLab.update(delta);
      if (window.CargoFreighter) CargoFreighter.update(delta);
      if (window.IceFortressInterior) IceFortressInterior.update(delta);
      if (window.ReactorCore) ReactorCore.update(delta);
      if (window.GladiatorPit) GladiatorPit.update(delta);
      if (window.JungleShrine) JungleShrine.update(delta);
      if (window.LaserGrid) LaserGrid.update(delta);
      if (window.DeathMarch) DeathMarch.update(delta);
      if (window.BankRobbery) BankRobbery.update(delta);
      if (window.UndergroundArena) UndergroundArena.update(delta);
      if (window.AirfieldAssault) AirfieldAssault.update(delta);
      if (window.OilPlatformFire) OilPlatformFire.update(delta);
      if (window.DamControl) DamControl.update(delta);
      if (window.ConcertHall) ConcertHall.update(delta);
      if (window.SewerEscape) SewerEscape.update(delta);
      if (window.HauntedGalleon) HauntedGalleon.update(delta);
      if (window.AvalancheZone) AvalancheZone.update(delta);
      if (window.MountainRescue) MountainRescue.update(delta);
      if (window.ShoppingDistrict) ShoppingDistrict.update(delta);
      if (window.SnowfieldBattle) SnowfieldBattle.update(delta);
      if (window.ZooBreakout) ZooBreakout.update(delta);
      if (window.HospitalSiege) HospitalSiege.update(delta);
      if (window.RacingPit) RacingPit.update(delta);
      if (window.WarehouseDistrict) WarehouseDistrict.update(delta);
      if (window.CyberCity) CyberCity.update(delta);
      if (window.PirateHarbor) PirateHarbor.update(delta);
      if (window.SpaceStationAttack) SpaceStationAttack.update(delta);
      if (window.DustBowl) DustBowl.update(delta);
      if (window.SwampAssault) SwampAssault.update(delta);
      if (window.FactoryTakeover) FactoryTakeover.update(delta);
      if (window.HarborSiege) HarborSiege.update(delta);
      if (window.MetroAssault) MetroAssault.update(delta);
      if (window.EmbassyTakeover) EmbassyTakeover.update(delta);
      if (window.CemeterySiege) CemeterySiege.update(delta);
      if (window.BridgeBattle) BridgeBattle.update(delta);
      if (window.SatelliteCrash) SatelliteCrash.update(delta);
      if (window.PyramidRaid) PyramidRaid.update(delta);
      if (window.SalvageMission) SalvageMission.update(delta);
      if (window.LaboratoryRaid) LaboratoryRaid.update(delta);
      if (window.DamBreak) DamBreak.update(delta);
      if (window.ColiseumBattle) ColiseumBattle.update(delta);
      if (window.TornadoAlley) TornadoAlley.update(delta);
      if (window.BiohazardZone) BiohazardZone.update(delta);
      if (window.PirateCoveRaid) PirateCoveRaid.update(delta);
      if (window.GhostTownSiege) GhostTownSiege.update(delta);
      if (window.MansionHeist) MansionHeist.update(delta);
      if (window.ClocktowerRaid) ClocktowerRaid.update(delta);
      if (window.ShipyardAssault) ShipyardAssault.update(delta);
      if (window.TankFactory) TankFactory.update(delta);
      if (window.SpyCompound) SpyCompound.update(delta);
      if (window.RocketLaunch) RocketLaunch.update(delta);
      if (window.MineshaftCollapse) MineshaftCollapse.update(delta);
      if (window.AirbaseDefense) AirbaseDefense.update(delta);
      if (window.HelicopterCrash) HelicopterCrash.update(delta);
      if (window.SmugglersDen) SmugglersDen.update(delta);
      if (window.EarthquakeZone) EarthquakeZone.update(delta);
      if (window.WarlordFortress) WarlordFortress.update(delta);
      if (window.CombatHospital) CombatHospital.update(delta);
      if (window.WinterWarfare) WinterWarfare.update(delta);
      if (window.ArmoredConvoy) ArmoredConvoy.update(delta);
      if (window.CatacombsAssault) CatacombsAssault.update(delta);
      if (window.OilPlatformRaid) OilPlatformRaid.update(delta);
      if (window.DesertConvoy) DesertConvoy.update(delta);
      if (window.TrenchWarfare) TrenchWarfare.update(delta);
      if (window.SunkenCity) SunkenCity.update(delta);
      if (window.SpaceBattle) SpaceBattle.update(delta);
      if (window.SubmarineBase) SubmarineBase.update(delta);
      if (window.RebelOutpost) RebelOutpost.update(delta);
      if (window.FortressSiege) FortressSiege.update(delta);
      if (window.BattleshipDeck) BattleshipDeck.update(delta);
      if (window.StadiumRiot) StadiumRiot.update(delta);
      if (window.TradingPost) TradingPost.update(delta);
      if (window.BountySystem) BountySystem.update(delta);
      if (window.CrouchSystem) CrouchSystem.update(delta);
      if (window.RadioSupport) RadioSupport.update(delta);
      if (window.MeleeKnife) MeleeKnife.update(delta);
      // Check if any enemy stepped on a landmine
      if (typeof Mines !== 'undefined' && typeof Enemies !== 'undefined' && Enemies.getAll) {
        var _mineEnemies = Enemies.getAll();
        for (var _mei = 0; _mei < _mineEnemies.length; _mei++) {
          var _me = _mineEnemies[_mei];
          if (!_me || !_me.alive || !_me.mesh) continue;
          var _mineHit = Mines.checkTrigger(_me.mesh.position.x, _me.mesh.position.z, 0.5);
          if (_mineHit) {
            Enemies.damage(_me, 80);
          }
        }
      }
      Pickups.update(delta, player.position, function (type, data) {
        AudioSystem.playPickup();
        MLSystem.onPickup();
        // Coloured particle burst at player position to celebrate pickup
        if (typeof Tracers !== 'undefined' && Tracers.spawnPickupBurst) {
          var _bcol = type === 'HEALTH' || type === 'MEDKIT' ? 0x22ff55
                    : type === 'AMMO'   ? 0xffcc00
                    : type === 'ARMOR'  ? 0x4488ff
                    : type === 'STIM'   ? 0xcc44ff
                    : type === 'INTEL'  ? 0x00ffff
                    : type === 'SHIELD' ? 0xffd700
                    : type === 'WEAPON' ? 0xff8800
                    : 0xffffff;
          var _bpos = player.position.clone();
          _bpos.y += 0.6;
          Tracers.spawnPickupBurst(_bpos, _bcol);
        }
        if (type === 'HEALTH') {
          player.hp = Math.min(player.maxHp, player.hp + 25);
          HUD.setHealth(player.hp, player.maxHp);
          HUD.notifyPickup('+25 HP', '#22ff55');
          if (HUD.flashHeal) HUD.flashHeal();
        } else if (type === 'AMMO') {
          Weapons.addAmmo(30);
          HUD.notifyPickup('+30 AMMO', '#ffcc00');
        } else if (type === 'ARMOR') {
          player.armor = Math.min(100, player.armor + 50);
          if (HUD.updateArmor) HUD.updateArmor(player.armor / 100);
          HUD.notifyPickup('+50 ARMOR', '#4488ff');
        } else if (type === 'GRENADE') {
          // Replenish throwables (+3) and minor area damage so it still feels explosive
          if (!player.godMode) player.grenades = Math.min(99, (player.grenades || 0) + 3);
          if (HUD.setHandGrenades) HUD.setHandGrenades(player.godMode ? Infinity : player.grenades);
          Enemies.damageInRadius(player.position, 4, 30);
          HUD.notifyPickup('+3 GRENADES', '#ff6622');
        } else if (type === 'MEDKIT') {
          player.hp = player.maxHp;
          HUD.setHealth(player.hp, player.maxHp);
          HUD.notifyPickup('FULL HEAL!', '#ff4444');
          if (HUD.flashHeal) HUD.flashHeal();
        } else if (type === 'STIM') {
          // Temporary speed boost (handled via flag)
          player._stimTimer = 8.0;
          HUD.notifyPickup('STIM BOOST! 8s', '#cc44ff');
        } else if (type === 'INTEL') {
          // Reveal all enemies on minimap for 10 seconds
          player.intelTimer = 10.0;
          HUD.notifyPickup('📡 INTEL! Enemies revealed 10s', '#00ffff');
        } else if (type === 'SHIELD') {
          // Temporary invulnerability 5 seconds
          player.shieldTimer = 5.0;
          if (HUD.showShield) HUD.showShield(true);
          HUD.notifyPickup('🛡 SHIELD ACTIVE! 5s', '#ffd700');
        } else if (type === 'WEAPON' && data) {
          // Enemy weapon drop: unlock + give one clip of ammo
          var wIdx = data.weaponIdx;
          if (!Weapons.isUnlocked(wIdx)) Weapons.unlockWeapon(wIdx);
          var wDef = Weapons.getWeaponDef(wIdx);
          if (wDef) {
            Weapons.addAmmo(wDef.clipSize || 30);
            HUD.notifyPickup('🔫 ' + (wDef.name || data.weaponId) + ' +' + (wDef.clipSize || 30) + ' ammo', '#ff8800');
          }
        }
      });

      // Hybrid systems
      NPCSystem.update(delta, TimeSystem.getInfo());
      if (typeof HUD !== 'undefined' && HUD._updateNPCTextPositions) {
        HUD._updateNPCTextPositions(NPCSystem.getAll(), _camera, _renderer);
      }
      DroneSystem.update(delta);
      if (typeof Weather !== 'undefined' && Weather.update) { Weather.update(delta, _camera ? _camera.position : null); }
      // Recon mission: check if possessed drone is near a scout target
      if (typeof MissionSystem !== 'undefined' && MissionSystem.onDroneScout && DroneSystem.getPossessed) {
        var _posDrone = DroneSystem.getPossessed();
        if (_posDrone && _posDrone.alive && _posDrone.position) MissionSystem.onDroneScout(_posDrone.position);
      }
      if (typeof ConvoySystem !== 'undefined') ConvoySystem.update(delta);
      if (typeof EnemyArtillery !== 'undefined') EnemyArtillery.update(delta);
      VehicleSystem.update(delta);
      if (window.VehicleEnemies) VehicleEnemies.update(delta, player.position);
      Automation.update(delta);
      MissionSystem.update(delta);
      if (typeof RefineryStrike !== 'undefined' && RefineryStrike.update) RefineryStrike.update(delta);

      // Update drone controls HUD
      updateDroneControlsHUD();

      // Update tank HUD
      updateTankHUD();

      // ── B29: NPC combat barks (random chance per second) ──
      if (typeof NPCSystem !== 'undefined' && NPCSystem.triggerBark) {
        var allNpcsBark = NPCSystem.getAll();
        for (var nbi = 0; nbi < allNpcsBark.length; nbi++) {
          var nb = allNpcsBark[nbi];
          if (!nb.alive) continue;
          nb._barkTimer = (nb._barkTimer || 0) - delta;
          if (nb._barkTimer <= 0) {
            nb._barkTimer = 8 + Math.random() * 12; // bark every 8-20 seconds
            var bCat = nb.job === 'guard' || nb.job === 'assault' ? 'combat' : 'idle';
            if (nb.hp && nb.maxHp && nb.hp < nb.maxHp * 0.3) bCat = 'wounded';
            NPCSystem.triggerBark(nb.id, bCat);
          }
        }
      }

      // ── B31: Skill tree unlock checks per wave ──
      if (typeof SkillSystem !== 'undefined' && SkillSystem.checkSkillTreeUnlocks) {
        SkillSystem.checkSkillTreeUnlocks();
      }

      // ── NPC auto-boarding: friendly NPCs jump into nearby player vehicles ──
      if (VehicleSystem.isInVehicle()) {
        var playerVeh = VehicleSystem.getOccupied();
        if (playerVeh && playerVeh.damage > 0 && !playerVeh.occupiedByNPC) {
          // Find nearest armed NPC to board as gunner
          var allNPCs = (typeof NPCSystem !== 'undefined' && NPCSystem.getAll) ? NPCSystem.getAll() : [];
          var bestNPC = null;
          var bestDist = 8; // NPC must be within 8 units to board
          for (var ni = 0; ni < allNPCs.length; ni++) {
            var npc = allNPCs[ni];
            if (!npc.alive || npc.rank === 'civilian') continue;
            var nd = playerVeh.position.distanceTo(npc.position);
            if (nd < bestDist) {
              bestDist = nd;
              bestNPC = npc;
            }
          }
          if (bestNPC) {
            VehicleSystem.boardNPCGunner(playerVeh.id, bestNPC);
            HUD.notifyPickup('👥 NPC GUNNER BOARDED!', '#00ff88');
          }
        }
      }

      // Voxel chunk rebuilds
      VoxelWorld.updateDirtyChunks();

      // Update loot particles
      updateLootParticles(delta);

      // Animate attachment pickup meshes (bob + rotate) and show interaction prompt
      try {
        if (typeof Attachments !== 'undefined' && _scene && player) {
          var _atkNow = performance.now() / 1000;
          var _atkNearLabel = null;
          var _atkSceneChildren = _scene.children;
          for (var _atkAni = 0; _atkAni < _atkSceneChildren.length; _atkAni++) {
            var _atkM = _atkSceneChildren[_atkAni];
            if (!_atkM || !_atkM.userData || !_atkM.userData.isAttachmentPickup) continue;
            // Rotate
            _atkM.rotation.y += delta * 1.8;
            // Bob up and down
            var _atkBase = _atkM.userData.bobBase || 0.2;
            _atkM.position.y = _atkBase + Math.sin(_atkNow * 2.2) * 0.12;
            // Show pickup prompt if within 1.5 units
            var _atkDist2 = _atkM.position.distanceTo(player.position);
            if (_atkDist2 <= 1.5) {
              _atkNearLabel = '[E] Pick up ' + (_atkM.userData.label || 'Attachment');
            }
          }
          if (_atkNearLabel && HUD.showInteractionPrompt) {
            HUD.showInteractionPrompt(_atkNearLabel);
          }
        }
      } catch (eAtk) {}

      // Minecraft-style building: right-click with shovel to place blocks
      // (handled in mousedown handler below)

      // Health regen: tier 1 (2hp/s after 5s, cap 50%) + tier 2 (1hp/s after 10s, cap 75%)
      player.lastDamageTime += delta;
      if (player.lastDamageTime > 5 && player.hp > 0 && player.hp < player.maxHp * 0.75) {
        if (player.hp < player.maxHp * 0.5) {
          // Tier 1: fast regen to 50%
          player.hp = Math.min(player.maxHp * 0.5, player.hp + 2 * delta);
        } else if (player.lastDamageTime > 10) {
          // Tier 2: slow regen to 75%
          player.hp = Math.min(player.maxHp * 0.75, player.hp + 1 * delta);
        }
        HUD.setHealth(player.hp, player.maxHp);
      }

      // Killstreak health bonus
      if (window._killstreakHealthRegen && window._killstreakHealthRegen > 0) {
        player.hp = Math.min(player.maxHp || 100, player.hp + window._killstreakHealthRegen);
        window._killstreakHealthRegen = 0;
        HUD.setHealth(player.hp, player.maxHp);
      }

      // Killstreak ammo refill bonus
      if (window._killstreakAmmoRefill && window._killstreakAmmoRefill > 0) {
        var _ksWst = Weapons.getStatus ? Weapons.getStatus() : null;
        var _ksWdef = Weapons.getCurrentDef ? Weapons.getCurrentDef() : null;
        if (_ksWst && _ksWdef && _ksWdef.clipSize > 0 && !_ksWst.reloading) {
          _ksWst.clip = Math.min(_ksWdef.clipSize, _ksWst.clip + Math.ceil(_ksWdef.clipSize * window._killstreakAmmoRefill));
          HUD.setAmmo(_ksWst.clip, _ksWst.reserve, _ksWdef.clipSize);
        }
        window._killstreakAmmoRefill = 0;
      }

      // Armor HUD
      if (HUD.updateArmor) HUD.updateArmor(player.armor / 100);

      // Distance tracking
      if (player._lastPos) {
        var dx = player.position.x - player._lastPos.x;
        var dz = player.position.z - player._lastPos.z;
        player.distanceWalked += Math.sqrt(dx * dx + dz * dz);
      }
      if (!player._lastPos) player._lastPos = new THREE.Vector3();
      player._lastPos.copy(player.position);

      // Build mode ghost update
      if (gameState === STATE.BUILD_MODE && Building.getSelectedTemplate()) {
        const ray = VoxelWorld.raycastBlock(_camera, 12);
        if (ray) Building.updateGhost(ray.place.x, ray.place.y, ray.place.z);
      }

      // HUD updates
      HUD.setAmmo(Weapons.getClip(), Weapons.getReserve(), Weapons.getClipSize ? Weapons.getClipSize() : 0);
      HUD.setWeapon(Weapons.getCurrentName(), Weapons.getCurrentIdx());
      HUD.showReload(Weapons.isReloading());
      HUD.setEnemies(Enemies.getAliveCount());
      // ── Prominent primary objective (clarity = retention) ──
      if (HUD.setPrimaryObjective) {
        var _poStg = STAGES[currentStage];
        var _poWaves = _poStg ? _poStg.wavesPerStage : 7;
        var _poAlive = Enemies.getAliveCount();
        var _poMission = (typeof MissionSystem !== 'undefined' && MissionSystem.getActive) ? MissionSystem.getActive() : null;
        if (_poMission && _poMission.length > 0 && _poMission[0] && _poMission[0].status === 'active') {
          // Sub-line = the mission's live progress text (e.g. "Survival: Wave
          // 0/3") — far more actionable than generic wave info while a mission
          // is active. Falls back to wave info when no objectiveText exists.
          var _poProg = (_poMission[0].data && _poMission[0].data.objectiveText) ? _poMission[0].data.objectiveText
            : ((_poStg ? _poStg.name + ' · ' : '') + 'Wave ' + currentWave + '/' + _poWaves + ' · ' + _poAlive + ' enemies left');
          HUD.setPrimaryObjective('🎯 ' + (_poMission[0].name || 'MISSION'), _poProg);
        } else if (_poAlive > 0) {
          var _poSide = (typeof MissionSystem !== 'undefined' && MissionSystem.getSideObjective) ? MissionSystem.getSideObjective() : null;
          var _poBase = (_poStg ? _poStg.name + ' · ' : '') + 'Wave ' + currentWave + '/' + _poWaves + ' · ' + _poAlive + ' left';
          HUD.setPrimaryObjective('⚔ ELIMINATE THE OCCUPANTS', _poSide ? _poBase + ' · ⭐ ' + _poSide.name : _poBase);
        } else {
          HUD.setPrimaryObjective('✓ AREA SECURED', 'Next wave incoming — hold the line');
        }
      }
      // ── Mission waypoint: project the active mission's target into the
      // world so players navigate by marker, not raw coordinates ──
      if (HUD.setMissionWaypoint && HUD.updateMissionWaypoint) {
        var _wpT = null;
        if (_poMission && _poMission.length > 0 && _poMission[0] && _poMission[0].status === 'active') {
          var _md = _poMission[0].data || {};
          if (_md.destination) _wpT = _md.destination;                      // escort
          else if (_md.building) _wpT = { x: _md.building.cx != null ? _md.building.cx : _md.building.x, y: _md.building.baseY || 0, z: _md.building.cz != null ? _md.building.cz : _md.building.z }; // clear_building
          else if (_md.targetPoints && _md.scoutedPoints) {                 // recon: next unscouted
            for (var _wi = 0; _wi < _md.targetPoints.length; _wi++) {
              if (!_md.scoutedPoints[_wi]) { _wpT = _md.targetPoints[_wi]; break; }
            }
          }
          else if (_md.landingZones && _md.landingZones.length) {           // airborne: current LZ
            _wpT = _md.landingZones[(_md.completedWaves || 0) % _md.landingZones.length];
          }
          else if (_md.spawnPositions && _md.spawnPositions.length) {     // bradley: ambush center
            _wpT = _md.spawnPositions[Math.floor(_md.spawnPositions.length / 2)];
          }
        }
        // MissionTypes scripted missions (DEMOLITION, CAPTURE_ZONE, ASSASSINATION, RESCUE, DEFUSE):
        // zone coordinates are zoneX/zoneZ on the active mission — point waypoint there.
        if (!_wpT && typeof MissionTypes !== 'undefined' && MissionTypes.getActive && MissionTypes.getActive()) {
          var _mt = MissionTypes.getActive();
          // RESCUE: point to nearest unfreed POW
          if (_mt.config && _mt.config.id === 'RESCUE') {
            var _mpProg = MissionTypes.getProgress ? MissionTypes.getProgress() : null;
            if (_mpProg && _mpProg.pows) {
              for (var _wpi = 0; _wpi < _mpProg.pows.length; _wpi++) {
                if (!_mpProg.pows[_wpi].freed) {
                  var _wpow = _mpProg.pows[_wpi];
                  _wpT = { x: _wpow.x, y: VoxelWorld.getTerrainHeight(_wpow.x, _wpow.z), z: _wpow.z };
                  break;
                }
              }
            }
          }
          // DEFUSE: point to nearest undefused bomb
          if (!_wpT && _mt.config && _mt.config.id === 'DEFUSE') {
            var _mfProg = MissionTypes.getProgress ? MissionTypes.getProgress() : null;
            if (_mfProg && _mfProg.bombs) {
              for (var _wbi = 0; _wbi < _mfProg.bombs.length; _wbi++) {
                if (!_mfProg.bombs[_wbi].defused) {
                  var _wbomb = _mfProg.bombs[_wbi];
                  _wpT = { x: _wbomb.x, y: VoxelWorld.getTerrainHeight(_wbomb.x, _wbomb.z), z: _wbomb.z };
                  break;
                }
              }
            }
          }
          // All other types: fall back to zone center
          if (!_wpT && typeof _mt.zoneX === 'number' && typeof _mt.zoneZ === 'number') {
            _wpT = { x: _mt.zoneX, y: VoxelWorld.getTerrainHeight(_mt.zoneX, _mt.zoneZ), z: _mt.zoneZ };
          }
        }
        // Capital defense: waypoint tracks the nearest column leader so the
        // player always knows where the armor is coming from.
        if (!_wpT && typeof ConvoySystem !== 'undefined' && ConvoySystem.hasActiveConvoy && ConvoySystem.hasActiveConvoy()) {
          _wpT = ConvoySystem.getLeadPosition(player.position);
        }
        HUD.setMissionWaypoint(_wpT);
        HUD.updateMissionWaypoint(_camera);
      }
      // ── Capital defense (Battle of Kyiv): city bar + defeat check ──
      var _cdStg = STAGES[currentStage];
      if (_cdStg && _cdStg.capitalDefense && typeof ConvoySystem !== 'undefined') {
        if (HUD.setCityIntegrity) HUD.setCityIntegrity(ConvoySystem.getCityHP());
        if (ConvoySystem.isCityLost() && gameState === STATE.PLAYING && !player.godMode) {
          // The capital fell — same defeat flow as player death, but Last
          // Stand can't save a fallen city.
          _defeatReason = 'KYIV HAS FALLEN';
          player.hp = 0;
          player._usedLastStand = true;
          player.shieldTimer = 0;
          onPlayerHit(1, null); // routes through the standard death handling
        }
      } else if (HUD.setCityIntegrity) {
        HUD.setCityIntegrity(null);
      }
      // Wave progress bar: pct of wave cleared based on initial enemy count
      if (HUD.setWaveProgress && player._waveStartCount > 0) {
        var _alv = Enemies.getAliveCount();
        var _pct = 1 - (_alv / player._waveStartCount);
        HUD.setWaveProgress(Math.max(0, Math.min(1, _pct)));
      }

      // Update extended HUD
      updateExtendedHUD();

      // Update minimap
      if (HUD.updateMinimap) {
        var mmEnemies = Enemies.getAll();
        var mmNPCs = (typeof NPCSystem !== 'undefined' && NPCSystem.getAll) ? NPCSystem.getAll() : [];
        var mmVehicles = (typeof VehicleSystem !== 'undefined' && VehicleSystem.getAll) ? VehicleSystem.getAll() : [];
        var mmDrones = (typeof DroneSystem !== 'undefined' && DroneSystem.getAll) ? DroneSystem.getAll() : [];
        HUD.updateMinimap(player.position.x, player.position.z, CameraSystem.getYaw(), mmEnemies, mmNPCs, mmVehicles, mmDrones);
      }

      // Tactical minimap (window.Minimap module)
      if (typeof Minimap !== 'undefined' && Minimap.update) {
        var _mmTactEnemies = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
        Minimap.update(
          player.position,
          CameraSystem ? CameraSystem.getYaw() : 0,
          _mmTactEnemies
        );
      }

      // Targeting assistant (on-weapon enemy readout)
      if (HUD.updateTargetAssist) {
        var taEnemies = Enemies.getAll();
        HUD.updateTargetAssist(player.position.x, player.position.z, CameraSystem.getYaw(), taEnemies);
      }

      // Enemy drone proximity warning
      if (typeof DroneSystem !== 'undefined' && DroneSystem.getAll) {
        var allDrones = DroneSystem.getAll();
        for (var di = 0; di < allDrones.length; di++) {
          var dr = allDrones[di];
          if (dr.faction === 'enemy' && dr.alive !== false && dr.position) {
            var ddist = player.position.distanceTo(dr.position);
            if (ddist < 20) {
              HUD.notifyPickup('⚠ ENEMY DRONE NEARBY!', '#ff4488');
              break;
            }
          }
        }
      }

      // Scavenge system update (weapon drops, pickup prompt)
      if (window.ScavengeSystem) ScavengeSystem.update(delta, player);

      // Update tracers
      if (typeof Tracers !== 'undefined') Tracers.update(delta, player.position);
      if (typeof EnemyChatter !== 'undefined') EnemyChatter.update();
      if (window.CompanionRadio && CompanionRadio.update) CompanionRadio.update(delta);
      if (typeof StageVFX !== 'undefined') StageVFX.update(delta);
      if (typeof Flags !== 'undefined' && Flags.update) Flags.update(delta);
      if (typeof Environment !== 'undefined' && Environment.update) Environment.update(delta);
      // Birds / Mortar / MortarEmplacement / Gyro per-frame
      try { if (window.Birds   && Birds.update)   Birds.update(delta); } catch (eBU) {}
      try { if (window.Mortar  && Mortar.update)  Mortar.update(delta); } catch (eMU) {}
      try { if (window.MortarEmplacement && MortarEmplacement.update) MortarEmplacement.update(delta, typeof Enemies !== 'undefined' ? Enemies.getAll() : []); } catch (eMEU) {}
      try { if (window.Bradley && Bradley.update) Bradley.update(delta); } catch (eBV) {}
      try { if (window.Gyro    && Gyro.update)    Gyro.update(delta); } catch (eGU) {}
      try { if (window.DamageNumbers) DamageNumbers.update(delta); } catch (eDNU) {}

      // ═══ NEW FEATURE SYSTEM UPDATES (59 features) ═══

      // Combat extras update (lean, inspect, bayonet, heat, maintenance)
      if (typeof CombatExtras !== 'undefined') {
        var combatResult = CombatExtras.update(delta);

        // Lean HUD indicator
        if (!_domLean) _domLean = document.getElementById('lean-indicator');
        if (_domLean) _domLean.style.display = CombatExtras.isLeaning() ? 'block' : 'none';

        // Inspect overlay
        if (!_domInspect) _domInspect = document.getElementById('inspect-overlay');
        if (_domInspect) _domInspect.style.display = CombatExtras.isInspecting() ? 'block' : 'none';

        // Bayonet indicator
        if (!_domBayonet) _domBayonet = document.getElementById('bayonet-indicator');
        if (_domBayonet) _domBayonet.style.display = CombatExtras.isBayonetCharging() ? 'block' : 'none';

        // Bayonet charge damage
        if (combatResult.bayonet && combatResult.bayonet.active) {
          var enemies = Enemies.getAll();
          for (var bi = 0; bi < enemies.length; bi++) {
            var be = enemies[bi];
            if (!be.alive || !be.mesh) continue;
            var bdx = be.mesh.position.x - player.position.x;
            var bdz = be.mesh.position.z - player.position.z;
            if (bdx * bdx + bdz * bdz < 4) {
              Enemies.damage(be, combatResult.bayonet.damage * delta * 2);
            }
          }
        }

        // Heat bar HUD
        if (combatResult.heat) {
          if (!_domHeatBar) _domHeatBar = document.getElementById('heat-bar');
          if (_domHeatBar) _domHeatBar.style.width = (combatResult.heat.heat * 100) + '%';
          if (!_domOverheat) _domOverheat = document.getElementById('overheat-indicator');
          if (_domOverheat) _domOverheat.style.display = combatResult.heat.overheated ? 'block' : 'none';
        }

        // Maintenance indicator
        if (!_domMaint) _domMaint = document.getElementById('maintenance-indicator');
        if (_domMaint) _domMaint.style.display = CombatExtras.isMaintaining() ? 'block' : 'none';

        // Ammo type display
        if (CombatExtras.getAmmoType && HUD.updateAmmoType) {
          var at = CombatExtras.getAmmoType();
          if (at) HUD.updateAmmoType(at.name);
        }
      }

      // Traversal update (mantle, dive)
      if (typeof Traversal !== 'undefined') {
        var travResult = Traversal.update(delta);
        // Apply mantle position override if mantling
        if (travResult && travResult.mantle && travResult.mantle.active) {
          player.position.x = travResult.mantle.x;
          player.position.y = travResult.mantle.y;
          player.position.z = travResult.mantle.z;
          player.velocity.y = 0;
        }

        // Apply dolphin dive movement
        if (travResult && travResult.dive && travResult.dive.active) {
          player.position.x += travResult.dive.moveX;
          player.position.z += travResult.dive.moveZ;
          player.position.y += travResult.dive.heightOffset;
        }

        // Apply vault movement
        if (travResult && travResult.vault && travResult.vault.active && travResult.vault.position) {
          player.position.x = travResult.vault.position.x;
          player.position.y = travResult.vault.position.y;
          player.position.z = travResult.vault.position.z;
          player.velocity.y = 0;
        }

        // Swimming check
        var blockUnderPlayer = VoxelWorld.getBlock(
          Math.floor(player.position.x),
          Math.floor(player.position.y - 1),
          Math.floor(player.position.z)
        );
        var inWater = blockUnderPlayer === 8; // WATER
        var swimResult = Traversal.updateSwimming(delta, inWater, player.stamina);
        if (!_domSwim) _domSwim = document.getElementById('swim-indicator');
        if (!_domBreathContainer) _domBreathContainer = document.getElementById('breath-bar-container');
        if (swimResult && swimResult.active) {
          if (_domSwim) _domSwim.style.display = 'block';
          if (_domBreathContainer) {
            _domBreathContainer.style.display = 'block';
            if (!_domBreathBar) _domBreathBar = document.getElementById('breath-bar');
            if (_domBreathBar) _domBreathBar.style.width = (swimResult.breath / 10 * 100) + '%';
          }
          if (swimResult.drowning && !player.godMode) {
            player.hp = Math.max(0, player.hp - swimResult.drownDmg);
            HUD.setHealth(player.hp, player.maxHp);
          }
        } else {
          if (_domSwim) _domSwim.style.display = 'none';
          if (_domBreathContainer) _domBreathContainer.style.display = 'none';
        }

        // Mantle indicator
        if (!_domMantle) _domMantle = document.getElementById('mantle-indicator');
        if (_domMantle) _domMantle.style.display = Traversal.isMantling() ? 'block' : 'none';

        // ── B30: Grapple hook update ──
        if (Traversal.isGrappling && Traversal.isGrappling()) {
          var grapUp = Traversal.updateGrapple(delta, player.position);
          if (grapUp && grapUp.active && grapUp.force) {
            player.position.addScaledVector(grapUp.force, delta);
            player.velocity.y = Math.max(player.velocity.y, 2);
          }
        }

        // ── B30: Wall run update (uses result from Traversal.update above, not a second call) ──
        if (travResult && travResult.wallRun && travResult.wallRun.active) {
          player.position.y += travResult.wallRun.offsetY * delta;
          player.velocity.y = 0;
          if (window.AudioSystem && window.AudioSystem.playWallRun) window.AudioSystem.playWallRun();
        }

        // ── B30: Ledge grab update ──
        if (Traversal.isHanging && Traversal.isHanging()) {
          var ledgeUp = Traversal.updateLedgeHang(delta);
          if (ledgeUp && ledgeUp.hanging) {
            player.velocity.y = 0;
            player._ledgeTimer = (player._ledgeTimer || 0) + delta;
            // Space = pull up onto ledge, Ctrl/C = drop down, auto-drop after 5s
            if (keys['Space'] || touch.jumping) {
              var pullPos = Traversal.pullUp();
              if (pullPos) {
                player.position.set(pullPos.x, pullPos.y, pullPos.z);
                player.onGround = true;
              }
              touch.jumping = false;
              player._ledgeTimer = 0;
            } else if (keys['ControlLeft'] || keys['ControlRight'] || player._ledgeTimer > 5) {
              Traversal.dropDown();
              player.velocity.y = -2;
              player._ledgeTimer = 0;
            }
            // Show ledge hang prompt
            HUD.showInteractionPrompt('[SPACE] Pull Up  [CTRL] Drop', true);
          }
        } else {
          if (player._ledgeTimer > 0) { player._ledgeTimer = 0; HUD.hideInteractionPrompt(); }
          if (player.velocity.y < -2 && Traversal.checkLedgeGrab) {
            Traversal.checkLedgeGrab(player.position, player.velocity, function (bx, by, bz) {
              return VoxelWorld.getBlock(bx, by, bz);
            });
          }
        }
      }

      // ── B30: Combat roll update (uses result from CombatExtras.update above) ──
      if (combatResult && combatResult.roll && combatResult.roll.active) {
        player.position.x += combatResult.roll.moveX;
        player.position.z += combatResult.roll.moveZ;
      }

      // Final grounding pass after traversal/roll adjustments.
      enforcePlayerGroundSnap();

      // ── B29: Hazard zone check ──
      if (typeof WorldFeatures !== 'undefined' && WorldFeatures.checkHazards) {
        var hazard = WorldFeatures.checkHazards(player.position.x, player.position.z);
        if (hazard && hazard.inHazard) {
          player.hp = Math.max(0, player.hp - hazard.damage * delta);
          HUD.setHealth(player.hp, player.maxHp);
          if (Feedback.showEnvironmentWarning) Feedback.showEnvironmentWarning(hazard.type.toUpperCase());
        }
        WorldFeatures.updateHazards(delta);
      }

      // ── B32: Extreme weather update ──
      if (typeof WeatherSystem !== 'undefined' && WeatherSystem.updateExtremeEvent) {
        WeatherSystem.updateExtremeEvent(delta);
        var extreme = WeatherSystem.getExtremeEvent ? WeatherSystem.getExtremeEvent() : null;
        if (extreme && extreme.active) {
          if (extreme.type === 'hailstorm') {
            player.hp = Math.max(0, player.hp - 1 * delta);
            HUD.setHealth(player.hp, player.maxHp);
          }
          if (extreme.type === 'blizzard') {
            // Slow movement during blizzard
            player._blizzardSlow = 0.5;
          } else {
            player._blizzardSlow = 1.0;
          }
        } else {
          player._blizzardSlow = 1.0;
        }
      }

      // ── B32: Vehicle fuel consumption ──
      if (typeof VehicleSystem !== 'undefined' && VehicleSystem.isInVehicle() && VehicleSystem.consumeFuel) {
        var occVeh = VehicleSystem.getOccupied();
        if (occVeh) VehicleSystem.consumeFuel(occVeh.id, delta * 2);
      }

      // ── B28: Mission timer update ──
      if (typeof MissionSystem !== 'undefined' && MissionSystem.updateMissionTimer) {
        MissionSystem.updateMissionTimer(delta);
      }

      // Hand-thrown grenades (player-thrown via KeyG when no nearby vehicle)
      updateHandGrenades(delta);
      if (window.SpecialGrenades) SpecialGrenades.update(delta, player.position, typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : []);

      // World features update (fires, trees, mines, airdrops, smoke)
      if (typeof WorldFeatures !== 'undefined') {
        var enemyPositions = [];
        var allEn2 = Enemies.getAll();
        for (var wei = 0; wei < allEn2.length; wei++) {
          if (allEn2[wei].alive && allEn2[wei].mesh) {
            enemyPositions.push({ x: allEn2[wei].mesh.position.x, z: allEn2[wei].mesh.position.z });
          }
        }
        var wfResult = WorldFeatures.update(delta,
          function (x, y, z) { return VoxelWorld.getBlock(x, y, z); },
          function (x, y, z, b) { VoxelWorld.setBlock(x, y, z, b); },
          player.position, enemyPositions
        );

        // Fire damage to player
        if (wfResult.fireDmg) {
          for (var fi = 0; fi < wfResult.fireDmg.length; fi++) {
            var fz = wfResult.fireDmg[fi];
            var fdx = player.position.x - fz.x;
            var fdz = player.position.z - fz.z;
            if (fdx * fdx + fdz * fdz < fz.radius * fz.radius) {
              player.hp = Math.max(0, player.hp - fz.dps * delta);
              HUD.setHealth(player.hp, player.maxHp);
            }
          }
        }

        // Mine explosions
        if (wfResult.mineExplosions && wfResult.mineExplosions.length > 0) {
          for (var mi = 0; mi < wfResult.mineExplosions.length; mi++) {
            var me = wfResult.mineExplosions[mi];
            if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion();
            if (typeof Tracers !== 'undefined') Tracers.spawnExplosion(new THREE.Vector3(me.x, me.y, me.z), me.radius * 0.5);
            if (CameraSystem.shake) CameraSystem.shake(0.3, 0.5);
            if (me.target === 'player') {
              onPlayerHit(me.damage, new THREE.Vector3(me.x, me.y, me.z));
            } else {
              Enemies.damageInRadius(new THREE.Vector3(me.x, me.y, me.z), me.radius, me.damage);
            }
          }
        }

        // Airdrop collection
        var airdropResult = WorldFeatures.collectAirdrop(player.position);
        if (airdropResult) {
          HUD.notifyPickup('📦 AIRDROP: ' + airdropResult + '!', '#44ff88');
          if (window.AudioSystem && window.AudioSystem.playPickup) window.AudioSystem.playPickup();
          if (airdropResult === 'AMMO_CRATE') Weapons.addAmmo(100);
          else if (airdropResult === 'MEDKIT') { player.hp = player.maxHp; HUD.setHealth(player.hp, player.maxHp); }
          else if (airdropResult === 'ARMOR') { player.armor = 100; if (HUD.updateArmor) HUD.updateArmor(1); }
        }

        // Radiation zone check
        var radCheck = WorldFeatures.checkRadiation(player.position.x, player.position.z);
        var radWarn = document.getElementById('radiation-warning');
        if (radCheck.inZone) {
          if (radWarn) radWarn.style.display = 'block';
          player.hp = Math.max(0, player.hp - radCheck.damage * delta);
          HUD.setHealth(player.hp, player.maxHp);
        } else {
          if (radWarn) radWarn.style.display = 'none';
        }

        // Barbed wire check
        var wireCheck = WorldFeatures.checkWire(player.position.x, player.position.z);
        if (wireCheck.inWire) {
          player.hp = Math.max(0, player.hp - wireCheck.tickDmg * delta);
          HUD.setHealth(player.hp, player.maxHp);
        }

        // Water check — slow movement when wading
        if (typeof WorldFeatures !== 'undefined' && WorldFeatures.checkInWater) {
          var waterCheck = WorldFeatures.checkInWater(player.position.x, player.position.z);
          if (waterCheck.inWater) {
            player._inWater = true;
            player._waterSpeedMult = 0.55; // 55% speed in water
          } else {
            player._inWater = false;
            player._waterSpeedMult = 1;
          }
        }
      }

      // Destructibles update
      if (window.Destructibles) Destructibles.update(delta);

      // Perks update
      if (typeof Perks !== 'undefined') {
        var perkResult = Perks.update(delta);
        if (perkResult.healThisTick > 0) {
          player.hp = Math.min(player.maxHp, player.hp + perkResult.healThisTick);
          HUD.setHealth(player.hp, player.maxHp);
        }
        // Gunship DPS to random enemy (no per-frame filter allocation)
        if (perkResult.gunshipDPS > 0 && Enemies.getAliveCount() > 0) {
          var _allE = Enemies.getAll();
          var _aliveCount = Enemies.getAliveCount();
          var _pick = Math.floor(Math.random() * _aliveCount);
          var _seen = 0;
          for (var _gi = 0; _gi < _allE.length; _gi++) {
            if (_allE[_gi].alive) {
              if (_seen === _pick) {
                Enemies.damage(_allE[_gi], perkResult.gunshipDPS * delta);
                break;
              }
              _seen++;
            }
          }
        }
        // UAV indicator
        var uavInd = document.getElementById('uav-indicator');
        if (uavInd) uavInd.style.display = Perks.isUAVActive() ? 'block' : 'none';

        // Adrenaline indicator
        var adrInd = document.getElementById('adrenaline-indicator');
        if (adrInd) adrInd.style.display = (Perks.getSpeedMult() > 1.1) ? 'block' : 'none';
      }

      // Hold-F mission interact: per-frame continuous progress for RESCUE/DEFUSE
      // _hfNotifCd throttles the per-frame HUD notification so it refreshes ~4 Hz not 60 Hz
      if (!player._hfNotifCd) player._hfNotifCd = 0;
      player._hfNotifCd = Math.max(0, player._hfNotifCd - delta);
      if (keys && keys['KeyF'] && typeof MissionTypes !== 'undefined' && MissionTypes.getActive && MissionTypes.getActive()) {
        var _hfMt = MissionTypes.getActive();
        if (_hfMt && _hfMt.config) {
          var _hfDx = player.position.x - (_hfMt.zoneX || 0);
          var _hfDz = player.position.z - (_hfMt.zoneZ || 0);
          if (_hfDx * _hfDx + _hfDz * _hfDz < 196) {
            if (_hfMt.config.id === 'DEMOLITION') {
              var _hfPlant = MissionTypes.interact('PLANT_CHARGE', { dt: delta });
              if (player._hfNotifCd <= 0) {
                if (_hfPlant && _hfPlant.planting) { HUD.notifyPickup('💣 PLANTING... ' + Math.round((_hfPlant.progress || 0) * 100) + '%', '#ff8800'); player._hfNotifCd = 0.25; }
              }
            } else if (_hfMt.config.id === 'RESCUE') {
              var _hfProg = MissionTypes.getProgress ? MissionTypes.getProgress() : null;
              var _hfNearPow = 999;
              if (_hfProg && _hfProg.pows) {
                for (var _hfi = 0; _hfi < _hfProg.pows.length; _hfi++) {
                  if (_hfProg.pows[_hfi].freed) continue;
                  var _hfpdx = player.position.x - _hfProg.pows[_hfi].x;
                  var _hfpdz = player.position.z - _hfProg.pows[_hfi].z;
                  _hfNearPow = Math.min(_hfNearPow, _hfpdx * _hfpdx + _hfpdz * _hfpdz);
                }
              }
              if (_hfNearPow < 25) {
                var _hfr = MissionTypes.interact('FREE_POW', { dt: delta });
                if (player._hfNotifCd <= 0) {
                  if (_hfr && _hfr.freeing) { HUD.notifyPickup('🔓 FREEING... ' + Math.round((_hfr.progress || 0) * 100) + '%', '#88ff88'); player._hfNotifCd = 0.25; }
                  else if (_hfr && _hfr.freed) HUD.notifyPickup('✅ POW FREED!', '#44ff88');
                }
              }
            } else if (_hfMt.config.id === 'DEFUSE') {
              var _hfBProg = MissionTypes.getProgress ? MissionTypes.getProgress() : null;
              var _hfNearBomb = 999;
              if (_hfBProg && _hfBProg.bombs) {
                for (var _hfbi = 0; _hfbi < _hfBProg.bombs.length; _hfbi++) {
                  if (_hfBProg.bombs[_hfbi].defused) continue;
                  var _hfbdx = player.position.x - _hfBProg.bombs[_hfbi].x;
                  var _hfbdz = player.position.z - _hfBProg.bombs[_hfbi].z;
                  _hfNearBomb = Math.min(_hfNearBomb, _hfbdx * _hfbdx + _hfbdz * _hfbdz);
                }
              }
              if (_hfNearBomb < 36) {
                var _hfdr = MissionTypes.interact('DEFUSE_BOMB', { dt: delta });
                if (player._hfNotifCd <= 0) {
                  if (_hfdr && _hfdr.defusing) { HUD.notifyPickup('⏱️ DEFUSING... ' + Math.round((_hfdr.progress || 0) * 100) + '%', '#ffcc00'); player._hfNotifCd = 0.25; }
                  else if (_hfdr && _hfdr.defused) HUD.notifyPickup('✅ BOMB DEFUSED!', '#44ff88');
                }
              }
            }
          }
        }
      }

      // Mission types update
      if (typeof MissionTypes !== 'undefined') {
        var missionResult = MissionTypes.update(delta, player.position);
        if (missionResult) {
          var mTracker = document.getElementById('mission-tracker');
          if (mTracker) {
            if (missionResult.state === 'ACTIVE') {
              mTracker.style.display = 'block';
              var mTitle = document.getElementById('mission-tracker-title');
              if (mTitle) mTitle.textContent = '📍 ' + (MissionTypes.getActive() ? MissionTypes.getActive().config.name : 'MISSION');
              var mTimer = document.getElementById('mission-tracker-timer');
              if (mTimer && missionResult.timeRemaining !== undefined) {
                mTimer.textContent = '⏱ ' + Math.ceil(missionResult.timeRemaining) + 's';
              }
              // Per-type objective sub-line
              var mObj = document.getElementById('mission-tracker-objectives');
              if (mObj) {
                var _objTxt = '';
                switch (missionResult.type) {
                  case 'CAPTURE_ZONE':
                    _objTxt = 'Hold zone: ' + Math.round((missionResult.holdProgress || 0) * 100) + '%' + (missionResult.contested ? ' ⚔ CONTESTED' : '');
                    break;
                  case 'DEMOLITION':
                    _objTxt = missionResult.planted ? '✓ Charge planted — move 25m clear!' : 'Plant charge: ' + Math.round((missionResult.plantProgress || 0) * 100) + '%';
                    break;
                  case 'ASSASSINATION':
                    _objTxt = missionResult.hvtLocated ? ('HVT HP: ' + Math.max(0, Math.round(missionResult.hvtHP || 0))) : 'Locate and engage HVT in zone';
                    break;
                  case 'RESCUE': {
                    var _powTot = MissionTypes.getActive() ? MissionTypes.getActive().config.powCount : 3;
                    var _powNear = (missionResult.activePow >= 0) ? ' — hold [F] to free POW ' + (missionResult.activePow + 1) : ' — find a POW (approach within 5m)';
                    var _powFreeing = (missionResult.activePow >= 0 && missionResult.pows && missionResult.pows[missionResult.activePow])
                      ? (missionResult.pows[missionResult.activePow].freeProgress > 0 ? ' [freeing: ' + Math.round(missionResult.pows[missionResult.activePow].freeProgress * 100) + '%]' : '') : '';
                    _objTxt = 'POWs freed: ' + (missionResult.freed || 0) + '/' + _powTot + _powFreeing + _powNear;
                    break;
                  }
                  case 'DEFUSE': {
                    var _bombTot = MissionTypes.getActive() ? MissionTypes.getActive().config.bombCount : 3;
                    var _defProg = missionResult.defuseProgress > 0 ? ' [defusing: ' + Math.round(missionResult.defuseProgress * 100) + '%]' : '';
                    _objTxt = 'Bombs defused: ' + (missionResult.defused || 0) + '/' + _bombTot + _defProg + ' · Detonation in ' + Math.ceil(missionResult.detonationTimer || 0) + 's';
                    break;
                  }
                  case 'ASSAULT_DUGOUTS':
                    _objTxt = 'Dugouts: ' + (missionResult.dugoutsCleared || 0) + '/' + (MissionTypes.getActive() ? MissionTypes.getActive().config.dugoutCount : 4);
                    break;
                }
                mObj.textContent = _objTxt;
              }
            } else if (missionResult.state === 'COMPLETE') {
              var _completingMission = MissionTypes.getActive();
              var _completingType = _completingMission ? _completingMission.config.id : null;
              // DEMOLITION: detonate charge — blast kills nearby enemies
              if (_completingType === 'DEMOLITION' && _completingMission && typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
                var _demCfg = _completingMission.config;
                var _demY = VoxelWorld.getTerrainHeight(_completingMission.zoneX, _completingMission.zoneZ);
                Enemies.damageInRadius(
                  new THREE.Vector3(_completingMission.zoneX, _demY, _completingMission.zoneZ),
                  _demCfg.blastRadius || 15, _demCfg.blastDamage || 500
                );
                if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.08, 0.6);
              }
              var reward = MissionTypes.completeMission();
              if (reward) {
                HUD.notifyPickup('✅ MISSION COMPLETE! +' + reward.okc + ' OKC +' + reward.xp + ' XP', '#44ff88');
                if (typeof Marketplace !== 'undefined' && Marketplace.awardCustomOKC) {
                  Marketplace.awardCustomOKC(reward.okc, 'mission_type_complete', {
                    missionType: _completingType,
                  }).then(function () {
                    if (HUD && HUD.updateOKC) HUD.updateOKC(Marketplace.getOKC());
                  });
                } else if (typeof Marketplace !== 'undefined') {
                  Marketplace.addOKC(reward.okc);
                }
                if (typeof RankSystem !== 'undefined') RankSystem.addXP(reward.xp);
                if (typeof Progression !== 'undefined') Progression.trackStat('wavesCleared', 0); // mission tracking
              }
              mTracker.style.display = 'none';
            } else if (missionResult.state === 'FAILED') {
              var _failMsg = { TIME_UP: 'Time ran out', DETONATION: 'Bomb detonated', VIP_DEAD: 'VIP eliminated' }[missionResult.reason] || (missionResult.reason || 'Mission failed');
              HUD.notifyPickup('❌ MISSION FAILED: ' + _failMsg, '#ff4444');
              // DEFUSE detonation: bombs explode — deal blast damage to player
              if (missionResult.reason === 'DETONATION' && !player.godMode) {
                var _defCfg = MissionTypes.getActive() ? MissionTypes.getActive().config : null;
                var _defDmg = (_defCfg && _defCfg.blastDamage) ? _defCfg.blastDamage : 200;
                player.hp = Math.max(1, player.hp - _defDmg);
                HUD.setHealth(player.hp, player.maxHp);
                if (CameraSystem.shake) CameraSystem.shake(0.15, 1.2);
              }
              // Clear the failed mission so future wave-3 checks can spawn a new one
              MissionTypes.cancelMission();
              mTracker.style.display = 'none';
            }
          }
        }
      }

      // Feedback system update (damage numbers, kill feed, pings, compass)
      if (typeof Feedback !== 'undefined') {
        Feedback.update(delta, CameraSystem.getYaw());
      }

      // Progression tracking - play time
      if (typeof Progression !== 'undefined') {
        Progression.trackStat('totalPlayTime', delta);

        // Throttle slow HUD updates (dailies, bounties, prestige) to once per second
        _hudSlowTimer -= delta;
        if (_hudSlowTimer <= 0) {
          _hudSlowTimer = 1.0;

        // Daily challenges display
        var dailyPanel = document.getElementById('daily-challenges');
        if (dailyPanel) {
          var dailies = Progression.getDailies();
          if (dailies.length > 0) {
            dailyPanel.style.display = 'block';
            var dailyList = document.getElementById('daily-challenges-list');
            if (dailyList) {
              var dHTML = '';
              for (var di2 = 0; di2 < dailies.length; di2++) {
                var d = dailies[di2];
                var pct = Math.min(100, Math.round((d.progress / d.target) * 100));
                var color = d.completed ? '#44ff44' : '#ccc';
                dHTML += '<div style="color:' + color + '">' + (d.completed ? '✅ ' : '<span style="display:inline-block;width:10px;height:10px;border:1px solid #888;margin-right:4px;vertical-align:middle"></span>') + d.name + ': ' + d.progress + '/' + d.target + ' (' + pct + '%)</div>';
              }
              dailyList.innerHTML = dHTML;
            }
          }
        }

        // Bounty display (rendered inside daily-challenges panel so it doesn't free-float)
        var bountyPanel = document.getElementById('bounty-display');
        if (bountyPanel) bountyPanel.style.display = 'none';
        var dailyList = document.getElementById('daily-challenges-list');
        if (dailyList) {
          var bounties = Progression.getBounties();
          if (bounties.length > 0) {
            var bHTML = '<div style="color:#ffaa00;font-weight:bold;margin-top:6px;border-top:1px solid rgba(255,170,0,0.3);padding-top:4px">BOUNTIES</div>';
            for (var bi2 = 0; bi2 < bounties.length; bi2++) {
              var b = bounties[bi2];
              var bpct = Math.min(100, Math.round((b.progress / b.target) * 100));
              var bcolor = b.completed ? '#44ff44' : '#ffaa00';
              bHTML += '<div style="color:' + bcolor + '">' + (b.completed ? '&#10003;' : '$') + ' ' + b.name + ': ' + b.progress + '/' + b.target + ' (+' + b.reward + ' OKC)</div>';
            }
            dailyList.innerHTML += bHTML;
          }
        }

        // Prestige indicator
        var prestigeInd = document.getElementById('prestige-indicator');
        if (prestigeInd && Progression.getPrestigeLevel() > 0) {
          prestigeInd.textContent = Progression.getPrestigeIcon() + ' P' + Progression.getPrestigeLevel();
        }
        } // end _hudSlowTimer throttle
      }

      // Sync stealth state to enemy detection system
      Enemies.setPlayerStealth(player.stealth);

      // God mode: keep health maxed, stealth on, ammo infinite
      if (player.godMode) {
        player.hp = player.maxHp;
        player.stealth = true;
        Enemies.setPlayerStealth(true);
        // Refill current weapon ammo every frame
        var gs = Weapons.getState ? Weapons.getState() : null;
        if (gs && !gs.reloading) {
          var gw = Weapons.getCurrent ? Weapons.getCurrent() : null;
          if (gw && gw.type !== 'MELEE') { gs.clip = gw.clipSize; gs.reserve = gw.maxReserve; }
        }
      }
    }

    // DeathCam update (uses rawDelta so camera animates even when game is paused/frozen)
    if (window.DeathCam && DeathCam.isActive && DeathCam.isActive()) {
      try { DeathCam.update(rawDelta); } catch (eDC) {}
    }

    // Switch to mortar bird's-eye cam if deployed, or Bradley chase cam if driving
    var renderCam = _camera;
    try {
      if (window.DeathCam && DeathCam.isActive && DeathCam.isActive() && DeathCam.getCamera && DeathCam.getCamera()) {
        renderCam = DeathCam.getCamera();
      } else if (window.Bradley && window.Bradley.isActive && window.Bradley.isActive() && window.GameManager.__bradleyCam) {
        renderCam = window.GameManager.__bradleyCam;
      } else if (window.Mortar && window.Mortar.isDeployed && window.Mortar.isDeployed() && window.GameManager.__mortarCam) {
        renderCam = window.GameManager.__mortarCam;
      }
    } catch (eMR) {}
    _renderer.render(_scene, renderCam);
  }

  /* ── Extended HUD Updates ────────────────────────────────────────── */
  function updateAIIndicator(strategy) {
    var aiEl = document.getElementById('ai-learning-indicator');
    if (!aiEl) return;
    if (!strategy) {
      aiEl.style.display = 'none';
      return;
    }
    aiEl.style.display = 'block';
    var levels = ['📡 LEARNING', '🔄 ADAPTING', '🧠 COUNTERING'];
    var colors = ['#888888', '#ffaa00', '#ff00ff'];
    var summary = MLSystem.getBehaviorSummary();
    aiEl.textContent = levels[strategy.adaptationLevel] + ' | Style: ' +
      summary.style.toUpperCase() + ' (' + Math.round(summary.confidence * 100) + '%)';
    aiEl.style.color = colors[strategy.adaptationLevel];
    aiEl.style.borderColor = colors[strategy.adaptationLevel];
  }

  function updateExtendedHUD() {
    const timeEl = document.getElementById('hud-time');
    if (timeEl) {
      const info = TimeSystem.getInfo();
      timeEl.textContent = info.time + ' ' + info.phase.toUpperCase() +
        ' | Day ' + info.day + ' | ' + info.season +
        (info.speed > 1 ? ' [x' + info.speed + ']' : '') +
        (info.isPaused ? ' [PAUSED]' : '');
    }

    const rankEl = document.getElementById('hud-rank');
    if (rankEl) {
      const rank = RankSystem.getRank();
      const prog = RankSystem.getProgress();
      rankEl.textContent = rank.icon + ' ' + rank.name +
        ' (' + Math.floor(prog.percent) + '%)';
    }

    const resEl = document.getElementById('hud-resources');
    if (resEl) {
      const r = Economy.getResources();
      // Letter codes (cross-platform safe; emoji tofu on Linux/old Android)
      resEl.innerHTML =
        '<span style="color:#8B6914" title="Wood">W' + r.wood + '</span> ' +
        '<span style="color:#aaa" title="Metal">M' + r.metal + '</span> ' +
        '<span style="color:#00ccff" title="Electronics">E' + r.electronics + '</span> ' +
        '<span style="color:#ff8800" title="Fuel">F' + r.fuel + '</span> ' +
        '<span style="color:#999" title="Stone">S' + r.stone + '</span> ' +
        '<span style="color:#aacc44" title="Food">Fd' + r.food + '</span> ' +
        '| <span style="color:#ffcc00" title="Currency">$' + Economy.getCurrency() + '</span>';
    }

    const modeEl = document.getElementById('hud-mode');
    if (modeEl) {
      const mode = CameraSystem.getMode();
      const modeNames = { fps: 'FPS', tps: '3RD PERSON', rts: 'STRATEGIC', drone: 'DRONE FPV', vehicle: 'VEHICLE' };
      let label = modeNames[mode] || mode;
      if (gameState === STATE.BUILD_MODE) label = 'BUILD MODE';
      if (DroneSystem.isPossessing()) {
        const d = DroneSystem.getPossessed();
        label = 'DRONE: ' + d.type.toUpperCase() + ' [' + Math.floor(d.battery) + 's]';
      }
      if (VehicleSystem.isInVehicle()) {
        const v = VehicleSystem.getOccupied();
        label = 'VEHICLE: ' + v.type.toUpperCase() + ' [' + v.health + '/' + v.maxHealth + ']';
      }
      modeEl.textContent = label;
    }

    const npcEl = document.getElementById('hud-npcs');
    if (npcEl) {
      npcEl.textContent = 'NPCs: ' + NPCSystem.getCount() +
        ' | Morale: ' + Math.floor(NPCSystem.getAverageMorale()) + '%';
    }

    const missionEl = document.getElementById('hud-missions');
    if (missionEl) {
      const active = MissionSystem.getActive();
      if (active.length > 0) {
        missionEl.textContent = '📋 ' + active[0].name + ' (' + active[0].status + ')';
      } else {
        missionEl.textContent = '📋 No active missions';
      }
    }
  }

  /* ── Gyro Aim (mobile DeviceOrientation) ──────────────────────── */
  function _onDeviceOrientation(e) {
    if (!touch.gyroEnabled) return;
    // alpha = compass yaw (0-360, may be null on some devices)
    // beta  = front/back tilt (-180..180); gamma = left/right tilt (-90..90)
    var a = e.alpha, b = e.beta;
    if (a == null || b == null) return;
    if (touch.gyroPrevAlpha === null) {
      touch.gyroPrevAlpha = a;
      touch.gyroPrevBeta  = b;
      return;
    }
    var dA = a - touch.gyroPrevAlpha;
    if (dA > 180) dA -= 360; else if (dA < -180) dA += 360;
    var dB = b - touch.gyroPrevBeta;
    touch.gyroPrevAlpha = a;
    touch.gyroPrevBeta  = b;
    // Reject huge spikes (recalibration jumps)
    if (Math.abs(dA) > 30 || Math.abs(dB) > 30) return;
    // Landscape: yaw comes from -alpha, pitch from beta
    // handleMouseMove(dx, dy) treats dx as horizontal pixel delta. Scale to feel ~similar to touch.
    var sens = touch.gyroSensitivity;
    touch.gyroDX += -dA * sens;
    touch.gyroDY += dB * sens * 0.6;
  }

  function toggleGyroAim() {
    if (!isMobile) return;
    var enable = !touch.gyroEnabled;
    var btn = document.getElementById('btn-gyro');
    function _activate() {
      touch.gyroEnabled = true;
      touch.gyroPrevAlpha = null;
      touch.gyroPrevBeta  = null;
      touch.gyroDX = 0;
      touch.gyroDY = 0;
      if (!touch.gyroReady) {
        window.addEventListener('deviceorientation', _onDeviceOrientation, true);
        touch.gyroReady = true;
      }
      if (btn) btn.classList.add('active');
      try { localStorage.setItem('ok_gyro', '1'); } catch (_e) {}
    }
    function _deactivate() {
      touch.gyroEnabled = false;
      touch.gyroDX = 0;
      touch.gyroDY = 0;
      if (btn) btn.classList.remove('active');
      try { localStorage.setItem('ok_gyro', '0'); } catch (_e) {}
    }
    if (!enable) { _deactivate(); return; }
    // iOS 13+ requires explicit permission
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (state) {
        if (state === 'granted') _activate();
        else if (btn) btn.classList.remove('active');
      }).catch(function () {});
    } else {
      _activate();
    }
  }

  /* ── Mobile Controls Setup ─────────────────────────────────────── */
  function setupMobileControls() {
    if (_mobileControlsReady) return;
    _mobileControlsReady = true;

    const joystickZone  = document.getElementById('joystick-zone');
    const joystickThumb = document.getElementById('joystick-thumb');

    // Joystick touch handling
    joystickZone.addEventListener('touchstart', function (e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      touch.moveTouchId = t.identifier;
      touch.moveActive = true;
      const rect = joystickZone.getBoundingClientRect();
      const currentBaseSize = rect.width || 110;
      const currentThumbSize = joystickThumb.offsetWidth || 46;
      touch.moveStartX = rect.left + currentBaseSize / 2;
      touch.moveStartY = rect.top + currentBaseSize / 2;
      touch.moveMaxDist = (currentBaseSize - currentThumbSize) / 2;
    }, { passive: false });

    joystickZone.addEventListener('touchmove', function (e) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touch.moveTouchId) {
          let dx = t.clientX - touch.moveStartX;
          let dy = t.clientY - touch.moveStartY;
          const maxDist = touch.moveMaxDist || 32;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) {
            dx = dx / dist * maxDist;
            dy = dy / dist * maxDist;
            dist = maxDist;
          }
          touch.moveX = dx / maxDist;
          touch.moveY = dy / maxDist;
          const rect = joystickZone.getBoundingClientRect();
          const currentBaseSize = rect.width || 110;
          const currentThumbSize = joystickThumb.offsetWidth || 46;
          joystickThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2 + dx) + 'px';
          joystickThumb.style.top  = (currentBaseSize / 2 - currentThumbSize / 2 + dy) + 'px';
        }
      }
    }, { passive: false });

    function resetJoystick() {
      touch.moveTouchId = null;
      touch.moveActive = false;
      touch.moveX = 0;
      touch.moveY = 0;
      const rect = joystickZone.getBoundingClientRect();
      const currentBaseSize = rect.width || 110;
      const currentThumbSize = joystickThumb.offsetWidth || 46;
      joystickThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
      joystickThumb.style.top  = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
    }
    function _onMoveTouchEnd(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touch.moveTouchId) resetJoystick();
      }
    }
    joystickZone.addEventListener('touchend', _onMoveTouchEnd, { passive: true });
    joystickZone.addEventListener('touchcancel', _onMoveTouchEnd, { passive: true });
    // Global release so lifting outside zone doesn't leave joystick stuck
    document.addEventListener('touchend', _onMoveTouchEnd, { passive: true });
    document.addEventListener('touchcancel', _onMoveTouchEnd, { passive: true });

    // ── Aim Joystick (right side, mirrors move joystick) ──
    const aimZone  = document.getElementById('aim-joystick-zone');
    const aimThumb = document.getElementById('aim-joystick-thumb');
    if (aimZone && aimThumb) {
      aimZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        const t = e.changedTouches[0];
        touch.aimTouchId = t.identifier;
        touch.aimActive = true;
        const rect = aimZone.getBoundingClientRect();
        const currentBaseSize = rect.width || 110;
        const currentThumbSize = aimThumb.offsetWidth || 46;
        touch.aimStartX = rect.left + currentBaseSize / 2;
        touch.aimStartY = rect.top + currentBaseSize / 2;
        touch.aimMaxDist = (currentBaseSize - currentThumbSize) / 2;
      }, { passive: false });

      aimZone.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touch.aimTouchId) {
            let dx = t.clientX - touch.aimStartX;
            let dy = t.clientY - touch.aimStartY;
            const maxDist = touch.aimMaxDist || 32;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDist) {
              dx = dx / dist * maxDist;
              dy = dy / dist * maxDist;
            }
            touch.aimX = dx / maxDist;
            touch.aimY = dy / maxDist;
            const rect = aimZone.getBoundingClientRect();
            const currentBaseSize = rect.width || 110;
            const currentThumbSize = aimThumb.offsetWidth || 46;
            aimThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2 + dx) + 'px';
            aimThumb.style.top  = (currentBaseSize / 2 - currentThumbSize / 2 + dy) + 'px';
          }
        }
      }, { passive: false });

      function resetAimJoystick() {
        touch.aimTouchId = null;
        touch.aimActive = false;
        touch.aimX = 0;
        touch.aimY = 0;
        const rect = aimZone.getBoundingClientRect();
        const currentBaseSize = rect.width || 110;
        const currentThumbSize = aimThumb.offsetWidth || 46;
        aimThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
        aimThumb.style.top  = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
      }
      function _onAimTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touch.aimTouchId) resetAimJoystick();
        }
      }
      aimZone.addEventListener('touchend', _onAimTouchEnd, { passive: true });
      aimZone.addEventListener('touchcancel', _onAimTouchEnd, { passive: true });
      // Global release: if finger lifts outside aim zone, still reset (prevents stuck joystick)
      document.addEventListener('touchend', _onAimTouchEnd, { passive: true });
      document.addEventListener('touchcancel', _onAimTouchEnd, { passive: true });
    }

    // Fire button
    const btnFire = document.getElementById('btn-fire');
    btnFire.addEventListener('touchstart', function (e) {
      e.preventDefault();
      touch.firing = true;
      mouseNewPress = true;
      btnFire.classList.add('active');
    }, { passive: false });
    btnFire.addEventListener('touchend', function () {
      touch.firing = false;
      mouseNewPress = false;
      btnFire.classList.remove('active');
    });
    btnFire.addEventListener('touchcancel', function () {
      touch.firing = false;
      mouseNewPress = false;
      btnFire.classList.remove('active');
    });

    const btnAim = document.getElementById('btn-aim');
    if (btnAim) {
      btnAim.addEventListener('touchstart', function (e) {
        e.preventDefault();
        setMobileAim(true);
        btnAim.classList.add('active');
      }, { passive: false });
      btnAim.addEventListener('touchend', function () {
        setMobileAim(false);
        btnAim.classList.remove('active');
      });
      btnAim.addEventListener('touchcancel', function () {
        setMobileAim(false);
        btnAim.classList.remove('active');
      });
    }

    // Reload button
    const btnReload = document.getElementById('btn-reload');
    btnReload.addEventListener('touchstart', function (e) {
      e.preventDefault();
      Weapons.forceReload();
      if (window.AudioSystem && window.AudioSystem.playReload) window.AudioSystem.playReload();
      MLSystem.onReload();
      if (navigator.vibrate) { try { navigator.vibrate([10, 40, 10]); } catch (er) {} }
      btnReload.classList.add('active');
    }, { passive: false });
    btnReload.addEventListener('touchend', function () { btnReload.classList.remove('active'); });

    // Jump button
    const btnJump = document.getElementById('btn-jump');
    btnJump.addEventListener('touchstart', function (e) {
      e.preventDefault();
      touch.jumping = true;
      btnJump.classList.add('active');
    }, { passive: false });
    btnJump.addEventListener('touchend', function () {
      touch.jumping = false;
      btnJump.classList.remove('active');
    });
    btnJump.addEventListener('touchcancel', function () {
      touch.jumping = false;
      btnJump.classList.remove('active');
    });

    // Sprint button (toggle)
    const btnSprint = document.getElementById('btn-sprint');
    btnSprint.addEventListener('touchstart', function (e) {
      e.preventDefault();
      touch.sprinting = !touch.sprinting;
      btnSprint.classList.toggle('active', touch.sprinting);
    }, { passive: false });

    // Weapon prev/next
    const btnPrev = document.getElementById('btn-weapon-prev');
    const btnNext = document.getElementById('btn-weapon-next');
    btnPrev.addEventListener('touchstart', function (e) {
      e.preventDefault();
      Weapons.switchPrev();
      btnPrev.classList.add('active');
    }, { passive: false });
    btnPrev.addEventListener('touchend', function () { btnPrev.classList.remove('active'); });
    btnNext.addEventListener('touchstart', function (e) {
      e.preventDefault();
      Weapons.switchNext();
      btnNext.classList.add('active');
    }, { passive: false });
    btnNext.addEventListener('touchend', function () { btnNext.classList.remove('active'); });

    function bindTapButton(id, handler) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        handler();
        btn.classList.add('active');
      }, { passive: false });
      btn.addEventListener('touchend', function () { btn.classList.remove('active'); });
      btn.addEventListener('touchcancel', function () { btn.classList.remove('active'); });
    }

    bindTapButton('btn-use', function () {
      if (DroneSystem.isPossessing()) {
        releaseDroneRemote();
      } else {
        tapVirtualKey('KeyF');
      }
    });
    bindTapButton('btn-vehicle', function () { tapVirtualKey('KeyG'); });
    bindTapButton('btn-build', function () { tapVirtualKey('KeyB'); });
    // Build-opt tap: select template directly on mobile
    document.querySelectorAll('.build-opt[data-template]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (gameState !== STATE.BUILD_MODE) return;
        if (typeof Building !== 'undefined' && Building.selectTemplate) Building.selectTemplate(el.dataset.template);
        document.querySelectorAll('.build-opt').forEach(function (o) { o.classList.remove('selected'); });
        el.classList.add('selected');
      });
    });
    // Mobile: relabel build-opt key hints to bare names
    if (isMobile) {
      var _bOpts = [['barracks','Barracks'],['factory','Factory'],['turret','Turret'],
        ['droneHangar','Drone Hangar'],['commandCenter','Command Center'],['wall','Wall'],['dugout','Dugout']];
      _bOpts.forEach(function (pair) {
        var el = document.querySelector('.build-opt[data-template="' + pair[0] + '"]');
        if (el) el.textContent = pair[1];
      });
      var binfo = document.querySelector('#build-hud .build-info');
      if (binfo) binfo.textContent = 'TAP · Select | Fire · Place | 🔨 · Exit';
    }
    bindTapButton('btn-view', function () {
      if (DroneSystem.isPossessing()) {
        toggleDroneRemoteView();
      } else if (VehicleSystem.isInVehicle()) {
        tapVirtualKey('KeyT');
      } else {
        tapVirtualKey('KeyV');
      }
    });
    bindTapButton('btn-night', function () { tapVirtualKey('KeyL'); });
    bindTapButton('btn-gyro', function () { toggleGyroAim(); });
    bindTapButton('btn-inventory-mobile', function () { toggleInventory(); });
    bindTapButton('btn-crouch', function () { tapVirtualKey('KeyZ', 140); });
    bindTapButton('btn-melee', function () {
      // Switch to melee (slot 0), swing, and return to previous weapon
      if (!Weapons) return;
      var prev = Weapons.getCurrentIdx();
      Weapons.switchTo(0);
      if (Weapons.handleLeftDown) Weapons.handleLeftDown();
      setTimeout(function () {
        if (Weapons.handleLeftUp) Weapons.handleLeftUp();
        if (prev !== 0) Weapons.switchTo(prev);
      }, 260);
    });
    bindTapButton('btn-grenade', function () {
      // Cycle to grenade weapon if available, fire once
      if (!Weapons) return;
      var count = Weapons.getWeaponCount ? Weapons.getWeaponCount() : 0;
      var prev = Weapons.getCurrentIdx();
      var grenadeIdx = -1;
      for (var gi = 0; gi < count; gi++) {
        var nm = Weapons.getWeaponName ? Weapons.getWeaponName(gi) : '';
        if (/grenade|molotov/i.test(nm) && Weapons.isUnlocked && Weapons.isUnlocked(gi)) {
          grenadeIdx = gi;
          break;
        }
      }
      if (grenadeIdx < 0) return;
      Weapons.switchTo(grenadeIdx);
      if (Weapons.handleLeftDown) Weapons.handleLeftDown();
      setTimeout(function () {
        if (Weapons.handleLeftUp) Weapons.handleLeftUp();
        if (prev !== grenadeIdx) Weapons.switchTo(prev);
      }, 200);
    });

    // Pause / inventory button
    const btnPause = document.getElementById('btn-pause');
    btnPause.addEventListener('touchstart', function (e) {
      e.preventDefault();
      // Direct pause toggle — synthetic keyboard events are unreliable on mobile Safari
      if (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE) {
        gameState = STATE.PAUSED;
        var invOv = document.getElementById('inventory-overlay');
        if (invOv) {
          try { if (typeof showInventory === 'function') showInventory(); } catch (e) {}
          invOv.style.display = 'flex';
        } else {
          showOverlay('pause');
        }
        _releaseMouseForUI();
        if (typeof updateMobileControlsVisibility === 'function') updateMobileControlsVisibility();
      } else if (gameState === STATE.PAUSED) {
        gameState = STATE.PLAYING;
        var invOv2 = document.getElementById('inventory-overlay');
        if (invOv2) invOv2.style.display = 'none';
        hideOverlays();
        requestPointerLock();
        if (typeof updateMobileControlsVisibility === 'function') updateMobileControlsVisibility();
      }
    }, { passive: false });

    // Restore gyro preference (if previously enabled and no permission gate needed)
    try {
      if (localStorage.getItem('ok_gyro') === '1') {
        var DOE = window.DeviceOrientationEvent;
        if (!(DOE && typeof DOE.requestPermission === 'function')) {
          // Non-iOS: enable silently
          toggleGyroAim();
        }
        // iOS: require user re-tap (permission must be in user gesture)
      }
    } catch (_e) {}
  }

  /* ── Orientation + Fullscreen (mobile) ──────────────────────────── */
  function requestFullscreenAndLockLandscape() {
    try {
      var el = document.documentElement;
      var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (req) {
        var p = req.call(el);
        if (p && p.then) {
          p.then(function () {
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock('landscape').catch(function () {});
            }
          }).catch(function () {});
        }
      }
    } catch (e) {}
  }

  function isPortraitNow() {
    // Prefer matchMedia where available; fall back to dims.
    if (window.matchMedia) {
      var mm = window.matchMedia('(orientation: portrait)');
      if (mm && typeof mm.matches === 'boolean') return mm.matches;
    }
    return window.innerHeight > window.innerWidth;
  }

  function updateOrientationOverlay() {
    var overlay = document.getElementById('orientation-overlay');
    if (!overlay) return;
    var portrait = isPortraitNow();
    overlay.style.display = (isMobile && portrait) ? 'flex' : 'none';
  }

  function setupOrientationHandling() {
    updateOrientationOverlay();
    window.addEventListener('resize', updateOrientationOverlay);
    window.addEventListener('orientationchange', updateOrientationOverlay);
    if (screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', updateOrientationOverlay);
    }
    var fsBtn = document.getElementById('orientation-fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', requestFullscreenAndLockLandscape);
      fsBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        requestFullscreenAndLockLandscape();
      }, { passive: false });
    }
    // Request fullscreen on first user tap anywhere on mobile
    var firstTap = function () {
      requestFullscreenAndLockLandscape();
      window.removeEventListener('touchend', firstTap);
    };
    window.addEventListener('touchend', firstTap, { once: true, passive: true });
  }

  /* ── Inventory / Pause Toggle ───────────────────────────────────── */
  function toggleInventory() {
    const invOverlay = document.getElementById('inventory-overlay');
    if (!invOverlay) return;
    if (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE) {
      gameState = STATE.PAUSED;
      try { showInventory(); } catch (e) {}
      invOverlay.style.display = 'flex';
      _releaseMouseForUI();
      updateMobileControlsVisibility();
    } else if (gameState === STATE.PAUSED) {
      gameState = STATE.PLAYING;
      invOverlay.style.display = 'none';
      hideOverlays();
      updateMobileControlsVisibility();
      requestPointerLock();
    }
  }

  function resumeFromPause() {
    var invOverlay = document.getElementById('inventory-overlay');
    var pauseOverlay = document.getElementById('overlay-pause');
    if (invOverlay) invOverlay.style.display = 'none';
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    hideOverlays();
    gameState = STATE.PLAYING;
    updateMobileControlsVisibility();
    requestPointerLock();
  }

  function quitToMenu() {
    var invOverlay = document.getElementById('inventory-overlay');
    var pauseOverlay = document.getElementById('overlay-pause');
    if (invOverlay) invOverlay.style.display = 'none';
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    hideOverlays();
    showOverlay('start');
    gameState = STATE.MENU;
    if (window.AudioSystem.stopAmbientLoop) window.AudioSystem.stopAmbientLoop();
    updateMobileControlsVisibility();
  }

  function showInventory() {
    // ── Materials / Resources section ──
    var matGrid = document.getElementById('materials-grid');
    if (matGrid) {
      matGrid.innerHTML = '';
      var resIcons = { wood: 'W', metal: 'M', electronics: 'E', fuel: 'F', stone: 'S', food: 'Fd' };
      var resColors = { wood: '#8B6914', metal: '#aaa', electronics: '#00ccff', fuel: '#ff8800', stone: '#999', food: '#aacc44' };
      var resources = Economy.getResources();
      for (var resType in resources) {
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid ' + (resColors[resType] || '#555') + ';border-radius:4px;padding:6px;text-align:center';
        cell.innerHTML = '<div style="font-size:20px">' + (resIcons[resType] || '📦') + '</div>' +
          '<div style="font-size:11px;color:#ccc;text-transform:uppercase">' + resType + '</div>' +
          '<div style="font-size:16px;font-weight:bold;color:' + (resColors[resType] || '#fff') + '">' + resources[resType] + '</div>';
        matGrid.appendChild(cell);
      }
    }
    var currDisplay = document.getElementById('currency-display');
    if (currDisplay) {
      currDisplay.textContent = '💰 Currency: ' + Economy.getCurrency() + ' gold';
    }

    // ── Weapons grid ──
    var grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var count = Weapons.getWeaponCount();
    var curIdx = Weapons.getCurrentIdx();
    for (var i = 0; i < count; i++) {
      var slot = document.createElement('div');
      slot.className = 'inv-slot';
      var isUnlocked = Weapons.isUnlocked(i);
      if (!isUnlocked) {
        slot.classList.add('locked');
        slot.textContent = '🔒 ' + Weapons.getWeaponName(i);
      } else {
        var info = Weapons.getWeaponInfo(i);
        if (i === curIdx) slot.classList.add('active');
        slot.textContent = info.name + '\n⚔' + info.damage;
        if (info.clip !== undefined && info.type !== 'MELEE') {
          slot.textContent += ' | ' + info.clip + '/' + info.reserve;
        }
      }
      slot.style.whiteSpace = 'pre-line';

      // Allow tapping to switch weapons
      if (isUnlocked) {
        (function (idx) {
          slot.addEventListener('click', function () {
            Weapons.switchTo(idx);
            showInventory();
          });
        })(i);
      }
      grid.appendChild(slot);
    }

    var statsEl = document.getElementById('player-stats');
    if (statsEl) {
      var stage = STAGES[currentStage];
      var npcCount = (typeof NPCSystem !== 'undefined' && NPCSystem.getAll) ? NPCSystem.getAll().length : 0;
      var vehicleCount = VehicleSystem.getAll().length;
      var droneCount = (typeof DroneSystem !== 'undefined' && DroneSystem.getAll) ? DroneSystem.getAll().length : 0;
      statsEl.innerHTML =
        '❤ HP: ' + player.hp + '/' + player.maxHp +
        ' &nbsp;|&nbsp; 🏆 Score: ' + player.score +
        ' &nbsp;|&nbsp; 💀 Kills: ' + player.kills +
        '<br>📍 Stage ' + stage.id + ': ' + stage.name +
        ' &nbsp;|&nbsp; 🌊 Wave: ' + currentWave + '/' + stage.wavesPerStage +
        '<br>👥 NPCs: ' + npcCount +
        ' &nbsp;|&nbsp; 🚗 Vehicles: ' + vehicleCount +
        ' &nbsp;|&nbsp; 🛸 Drones: ' + droneCount;
    }
  }

  /* ── Role / Stealth / Weapons-grid helpers ────────────────────────── */
  function setRole(r) {
    var prev = player.role;
    player.role = (r === 'brigade') ? 'brigade' : 'lonewolf';
    updateRoleIndicator();
    HUD.notifyPickup(player.role === 'brigade' ? '🎖 ASSAULT BRIGADE' : '🐺 LONE WOLF',
      player.role === 'brigade' ? '#00aaff' : '#ffaa00');
    // Apply the role for real: BRIGADE fields the allied assault squads,
    // LONE WOLF fights solo. Previously this only changed the badge and the
    // 22-NPC army spawned either way, erasing all combat threat.
    try {
      if (typeof NPCSystem !== 'undefined' && prev !== player.role) {
        if (player.role === 'brigade') {
          if (NPCSystem.getCount && NPCSystem.getCount() < 4 && NPCSystem.spawnAssaultGroups) NPCSystem.spawnAssaultGroups();
        } else if (NPCSystem.clear) {
          NPCSystem.clear();
        }
      }
    } catch (eRole) {}
  }

  function updateRoleIndicator() {
    var el = document.getElementById('role-indicator');
    if (el) {
      el.textContent = player.role === 'brigade' ? '🎖 BRIGADE' : '🐺 LONE WOLF';
      el.style.color = player.role === 'brigade' ? '#0af' : '#fa0';
    }
    // highlight active button on start screen
    var sb = document.getElementById('start-role-brigade');
    var sl = document.getElementById('start-role-lonewolf');
    if (sb) sb.style.opacity = player.role === 'brigade' ? '1' : '0.4';
    if (sl) sl.style.opacity = player.role === 'lonewolf' ? '1' : '0.4';
    // highlight active button on pause screen
    var pb = document.getElementById('role-brigade-btn');
    var pl = document.getElementById('role-lonewolf-btn');
    if (pb) pb.style.opacity = player.role === 'brigade' ? '1' : '0.4';
    if (pl) pl.style.opacity = player.role === 'lonewolf' ? '1' : '0.4';
  }

  // ── Hand grenade throw ──────────────────────────────────────
  var _handGrenades = [];
  var _handGrenadeCooldown = 0;

  function throwHandGrenade() {
    if (_handGrenadeCooldown > 0) return;
    if (!_scene || !_camera) return;

    var gType = player.grenadeType || 'FRAG';

    // Check ammo for the selected type
    if (!player.godMode) {
      if (gType === 'FRAG' && (!player.grenades || player.grenades <= 0)) {
        HUD.notifyPickup('🚫 NO FRAG GRENADES', '#ff6600');
        return;
      }
      if (gType === 'SMOKE' && (!player.smokeGrenades || player.smokeGrenades <= 0)) {
        HUD.notifyPickup('🚫 NO SMOKE GRENADES', '#ff6600');
        return;
      }
      if (gType === 'FLASHBANG' && (!player.flashGrenades || player.flashGrenades <= 0)) {
        HUD.notifyPickup('🚫 NO FLASHBANGS', '#ff6600');
        return;
      }
    }

    var origin = player.position.clone();
    origin.y -= 0.4;
    var fwd = _camera.getWorldDirection(new THREE.Vector3());
    var vel = new THREE.Vector3(fwd.x * 18, 6 + fwd.y * 14, fwd.z * 18);

    if (gType === 'SMOKE') {
      // Smoke grenade: small grey sphere that lands and creates a smoke cloud
      var sGeo = new THREE.SphereGeometry(0.10, 8, 6);
      var sMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var sNade = new THREE.Mesh(sGeo, sMat);
      sNade.position.copy(origin);
      _scene.add(sNade);
      _handGrenades.push({ mesh: sNade, vel: vel, fuse: 2.0, spin: new THREE.Vector3(6, 5, 3), type: 'SMOKE' });
      if (!player.godMode) player.smokeGrenades = Math.max(0, player.smokeGrenades - 1);
      _handGrenadeCooldown = 0.45;
      HUD.notifyPickup('💨 SMOKE OUT', '#aaaaaa');

    } else if (gType === 'FLASHBANG') {
      // Flashbang: white sphere that blinds on detonation
      var fGeo = new THREE.SphereGeometry(0.10, 8, 6);
      var fMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      var fNade = new THREE.Mesh(fGeo, fMat);
      fNade.position.copy(origin);
      _scene.add(fNade);
      _handGrenades.push({ mesh: fNade, vel: vel, fuse: 2.0, spin: new THREE.Vector3(10, 8, 5), type: 'FLASHBANG' });
      if (!player.godMode) player.flashGrenades = Math.max(0, player.flashGrenades - 1);
      _handGrenadeCooldown = 0.45;
      HUD.notifyPickup('⚡ FLASHBANG OUT', '#ffff88');

    } else {
      // FRAG (default)
      var geo = new THREE.SphereGeometry(0.10, 8, 6);
      var mat = new THREE.MeshLambertMaterial({ color: 0x2a3018 });
      var nade = new THREE.Mesh(geo, mat);
      nade.position.copy(origin);
      _scene.add(nade);
      _handGrenades.push({ mesh: nade, vel: vel, fuse: 2.5, spin: new THREE.Vector3(8, 6, 4), type: 'FRAG' });
      if (!player.godMode) player.grenades = Math.max(0, player.grenades - 1);
      if (HUD.setHandGrenades) HUD.setHandGrenades(player.godMode ? Infinity : player.grenades);
      _handGrenadeCooldown = 0.45;
      HUD.notifyPickup('💣 GRENADE OUT', '#ffaa00');
    }
  }

  function updateHandGrenades(delta) {
    if (_handGrenadeCooldown > 0) _handGrenadeCooldown = Math.max(0, _handGrenadeCooldown - delta);
    if (_handGrenades.length === 0) return;
    for (var i = _handGrenades.length - 1; i >= 0; i--) {
      var g = _handGrenades[i];
      g.fuse -= delta;
      g.vel.y -= 18 * delta;
      g.mesh.position.x += g.vel.x * delta;
      g.mesh.position.y += g.vel.y * delta;
      g.mesh.position.z += g.vel.z * delta;
      // Tumble while flying
      if (g.spin) {
        g.mesh.rotation.x += g.spin.x * delta;
        g.mesh.rotation.y += g.spin.y * delta;
        g.mesh.rotation.z += g.spin.z * delta;
      }
      var groundY = 0;
      try {
        if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTopSolidY) {
          groundY = VoxelWorld.getTopSolidY(g.mesh.position.x, g.mesh.position.z);
        } else if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
          groundY = VoxelWorld.getTerrainHeight(g.mesh.position.x, g.mesh.position.z) + 1;
        }
      } catch (e) {}
      if (g.mesh.position.y <= groundY + 0.1) {
        g.mesh.position.y = groundY + 0.1;
        g.vel.y = Math.abs(g.vel.y) * 0.35;
        g.vel.x *= 0.55;
        g.vel.z *= 0.55;
        if (g.vel.length() < 0.4) g.vel.set(0, 0, 0);
      }
      if (g.fuse <= 0) {
        var pos = g.mesh.position.clone();

        if (g.type === 'SMOKE') {
          // Smoke grenade: create semi-transparent sphere cloud, persist 8 seconds
          var smokeGeo = new THREE.SphereGeometry(4, 12, 8);
          var smokeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
          smokeMat.transparent = true;
          smokeMat.opacity = 0.35;
          var smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
          smokeMesh.position.copy(pos);
          smokeMesh.position.y += 2;
          if (_scene) _scene.add(smokeMesh);
          window._smokePositions = window._smokePositions || [];
          window._smokePositions.push({ x: pos.x, z: pos.z, expires: Date.now() + 8000, mesh: smokeMesh });
          // Schedule smoke removal after 8 seconds
          (function(sm) {
            setTimeout(function() {
              if (_scene) _scene.remove(sm);
              if (sm.geometry) sm.geometry.dispose();
              if (sm.material) sm.material.dispose();
              // Clean up from _smokePositions
              if (window._smokePositions) {
                for (var _si = window._smokePositions.length - 1; _si >= 0; _si--) {
                  if (window._smokePositions[_si].mesh === sm) {
                    window._smokePositions.splice(_si, 1);
                  }
                }
              }
            }, 8000);
          }(smokeMesh));

        } else if (g.type === 'FLASHBANG') {
          // Flashbang: white screen flash + AI blind state
          window._flashTime = Date.now() + 3500;
          var flashDiv = document.createElement('div');
          flashDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#ffffff;opacity:0.95;pointer-events:none;z-index:9999;transition:opacity 2s ease-out';
          document.body.appendChild(flashDiv);
          // Fade out: brief hold then fade
          setTimeout(function() {
            flashDiv.style.opacity = '0';
            setTimeout(function() {
              if (flashDiv.parentNode) flashDiv.parentNode.removeChild(flashDiv);
            }, 2100);
          }, 1500);

        } else {
          // FRAG (default): explosion damage
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(pos, 2.2);
          if (window.AudioSystem && window.AudioSystem.playExplosion) {
            try { window.AudioSystem.playExplosion(); } catch (e) {}
          }
          if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
            var _gRes = Enemies.damageInRadius(pos, 6.5, 110);
            if (player && Array.isArray(_gRes)) {
              var _gKills = 0;
              for (var _gi = 0; _gi < _gRes.length; _gi++) if (_gRes[_gi].remaining <= 0) _gKills++;
              if (_gKills > 0) player.waveMaxExplosiveKill = Math.max(player.waveMaxExplosiveKill || 0, _gKills);
            }
          }
          if (CameraSystem.shake) CameraSystem.shake(0.35, 0.4);
          if (!player.godMode) {
            var dx = player.position.x - pos.x, dy = player.position.y - pos.y, dz = player.position.z - pos.z;
            var d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < 36) {
              var falloff = 1 - Math.sqrt(d2) / 6;
              onPlayerHit(60 * falloff, pos);
            }
          }
        }

        if (_scene) _scene.remove(g.mesh);
        if (g.mesh.geometry) g.mesh.geometry.dispose();
        if (g.mesh.material) g.mesh.material.dispose();
        _handGrenades.splice(i, 1);
      }
    }
  }

  function clearHandGrenades() {
    for (var i = 0; i < _handGrenades.length; i++) {
      var g = _handGrenades[i];
      if (_scene) _scene.remove(g.mesh);
      if (g.mesh.geometry) g.mesh.geometry.dispose();
      if (g.mesh.material) g.mesh.material.dispose();
    }
    _handGrenades.length = 0;
  }

  function toggleStealth() {
    player.stealth = !player.stealth;
    var stInd = document.getElementById('stealth-indicator');
    if (stInd) stInd.style.display = player.stealth ? 'block' : 'none';
    HUD.notifyPickup(player.stealth ? '👻 STEALTH ON' : '👁 STEALTH OFF',
      player.stealth ? '#00ff66' : '#ff6600');
    // update pause button text
    var btn = document.getElementById('stealth-toggle-btn');
    if (btn) btn.textContent = player.stealth ? '👻 STEALTH ON' : '👻 TOGGLE STEALTH';
  }

  function toggleGodMode() {
    player.godMode = !player.godMode;
    if (player.godMode) {
      // Unlock all weapons
      for (var i = 0; i < Weapons.getWeaponCount(); i++) {
        Weapons.unlockWeapon(i);
      }
      // Refresh HUD weapon bar to show all unlocked slots
      HUD.setWeapon(Weapons.getCurrentName(), Weapons.getCurrentIdx());
      // Refill all ammo in god mode
      Weapons.refillAllAmmo();
      // Set infinite health
      player.maxHp = GOD_MODE_HP;
      player.hp = GOD_MODE_HP;
      HUD.setHealth(player.hp, player.maxHp);
      // Full armor
      player.armor = 100;
      if (HUD.updateArmor) HUD.updateArmor(1);
      // Full equipment kit (grenades, throwables, special items)
      try {
        if (typeof Pickups !== 'undefined' && Pickups.grantFullKit) Pickups.grantFullKit();
      } catch (e) {}
      // Equip top-tier perks (fills MAX_PERKS slots)
      try {
        if (typeof Perks !== 'undefined' && Perks.PERK_LIST && Perks.equipPerk) {
          var perkIds = Object.keys(Perks.PERK_LIST);
          var slots = (Perks.MAX_PERKS || 3);
          for (var p = 0; p < Math.min(slots, perkIds.length); p++) {
            try { Perks.equipPerk(perkIds[p]); } catch (e2) {}
          }
        }
      } catch (e) {}
      // Boost economy so player can buy anything
      try {
        if (typeof Economy !== 'undefined' && Economy.setCurrency) Economy.setCurrency(999999);
        else if (player.coins !== undefined) player.coins = 999999;
        // Top up build resources so structure placement (which gates on Economy) always succeeds
        if (typeof Economy !== 'undefined' && Economy.add) {
          ['wood','metal','electronics','fuel','stone','food'].forEach(function(r){
            try { Economy.add(r, 9999); } catch(e3) {}
          });
        }
      } catch (e) {}
      // Unlimited hand grenades (all types)
      player.grenades = Infinity;
      player.smokeGrenades = Infinity;
      player.flashGrenades = Infinity;
      if (HUD.setHandGrenades) HUD.setHandGrenades(Infinity);
      // Enable stealth (enemies can't see player)
      player.stealth = true;
      Enemies.setPlayerStealth(true);
      var stInd = document.getElementById('stealth-indicator');
      if (stInd) stInd.style.display = 'block';
      // Grant unlimited build materials so god-mode player can build dugouts/structures freely
      try {
        if (player.buildMaterials) {
          player.buildMaterials.wood = 9999;
          player.buildMaterials.stone = 9999;
          player.buildMaterials.metal = 9999;
          player.buildMaterials.dirt = 9999;
          player.buildMaterials.sand = 9999;
          player.buildMaterials.brick = 9999;
        }
      } catch (e) {}
      HUD.notifyPickup('⚡ GOD MODE — FULL KIT EQUIPPED', '#ffff00');
    } else {
      // Reset health
      player.maxHp = 100;
      player.hp = 100;
      HUD.setHealth(player.hp, player.maxHp);
      // Disable forced stealth
      player.stealth = false;
      Enemies.setPlayerStealth(false);
      var stInd = document.getElementById('stealth-indicator');
      if (stInd) stInd.style.display = 'none';
      // Reset grenades to default 5 (all types)
      player.grenades = 5;
      player.smokeGrenades = 2;
      player.flashGrenades = 2;
      player.grenadeType = 'FRAG';
      if (HUD.setHandGrenades) HUD.setHandGrenades(5);
      HUD.notifyPickup('⚡ GOD MODE DEACTIVATED', '#ff6600');
    }
  }

  function isGodMode() { return player.godMode; }

  function populateWeaponsGrid(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    var count = Weapons.getWeaponCount();
    for (var i = 0; i < count; i++) {
      var info = Weapons.getWeaponInfo(i);
      if (!info) continue;
      var cell = document.createElement('div');
      cell.style.cssText = 'background:rgba(255,255,255,0.06);border:1px solid #444;padding:4px;border-radius:3px;text-align:center;color:#ccc';
      var key = i < 9 ? String(i + 1) : (i === 9 ? '0' : '');
      cell.innerHTML = '<div style="color:#fff;font-weight:bold;font-size:11px">' + (key ? '[' + key + '] ' : '') + info.name + '</div>' +
        '<div style="font-size:9px;color:#aaa">' + info.type + ' · DMG ' + info.damage + '</div>';
      el.appendChild(cell);
    }
  }

  /* ── Resize ──────────────────────────────────────────────────────── */
  function onResize() {
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setPixelRatio(getPreferredPixelRatio());
  }

  /* ── Marketplace UI Builder ─────────────────────────────────────── */
  function refreshMarketplaceUI(tab) {
    /* Update OKC display everywhere */
    var okc = typeof Marketplace !== 'undefined' ? Marketplace.getOKC() : 0;
    var okcEl = document.getElementById('inv-okc-display');
    if (okcEl) okcEl.textContent = '🪙 ' + okc + ' OKC';
    var hudOkc = document.getElementById('hud-okc');
    if (hudOkc) hudOkc.textContent = '🪙 ' + okc + ' OKC';

    /* Premium tag */
    var premTag = document.getElementById('hud-premium-tag');
    if (premTag && typeof Marketplace !== 'undefined' && Marketplace.isPremium()) {
      var pi = Marketplace.getPremiumInfo();
      premTag.textContent = pi.name + ' (' + pi.daysLeft + 'd)';
      premTag.style.display = 'inline';
    } else if (premTag) {
      premTag.style.display = 'none';
    }

    if (tab === 'shop') { buildShopUI(); }
    else if (tab === 'sell') { buildSellUI(); }
    else if (tab === 'premium') { buildPremiumUI(); }
    else if (tab === 'assets') { buildAssetsUI(); }
  }

  function buildShopUI() {
    var grid = document.getElementById('shop-items-grid');
    if (!grid || typeof Marketplace === 'undefined') return;
    grid.innerHTML = '';
    var items = Marketplace.getShopItems();
    for (var i = 0; i < items.length; i++) {
      (function (idx) {
        var it = items[idx];
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,215,0,0.05);border:1px solid #555;border-radius:6px;padding:8px;text-align:center';
        var discOkc = Marketplace.getDiscountedPrice(it.okcCost);
        cell.innerHTML =
          '<div style="color:#fff;font-weight:bold;font-size:12px">' + it.name + '</div>' +
          '<div style="font-size:10px;color:#ffd700;margin:4px 0">🪙 ' + discOkc + ' OKC | 💎 ' + it.polCost + ' POL</div>';
        var btnOkc = document.createElement('button');
        btnOkc.className = 'btn';
        btnOkc.style.cssText = 'font-size:10px;padding:2px 8px;border-color:#ffd700;color:#ffd700;margin:2px';
        btnOkc.textContent = 'Buy (OKC)';
        btnOkc.addEventListener('click', function () {
          var result = Marketplace.buyItemWithOKC(idx);
          if (result) {
            applyShopItem(result);
            HUD.notifyPickup('✅ ' + result.name, '#ffd700');
            refreshMarketplaceUI('shop');
          } else {
            HUD.notifyPickup('❌ Not enough OKC', '#ff4444');
          }
        });
        cell.appendChild(btnOkc);

        var btnPol = document.createElement('button');
        btnPol.className = 'btn';
        btnPol.style.cssText = 'font-size:10px;padding:2px 8px;border-color:#8247e5;color:#8247e5;margin:2px';
        btnPol.textContent = 'Buy (POL)';
        btnPol.addEventListener('click', function () {
          Marketplace.buyItemWithPOL(idx).then(function (result) {
            if (result) {
              applyShopItem(result);
              HUD.notifyPickup('✅ ' + result.name + ' (POL)', '#8247e5');
              refreshMarketplaceUI('shop');
            } else {
              HUD.notifyPickup('❌ Transaction failed', '#ff4444');
            }
          });
        });
        cell.appendChild(btnPol);
        grid.appendChild(cell);
      })(i);
    }
  }

  function applyShopItem(item) {
    if (item.type === 'ammo') { Weapons.addAmmo(item.value); }
    else if (item.type === 'health') {
      player.hp = Math.min(player.maxHp, player.hp + item.value);
      HUD.setHealth(player.hp, player.maxHp);
    } else if (item.type === 'armor') {
      player.maxHp += item.value;
      player.hp += item.value;
      HUD.setHealth(player.hp, player.maxHp);
    } else if (item.type === 'grenade') {
      // Restock throwable hand grenades (player.grenades) — was incorrectly adding gun ammo
      if (!player.godMode) player.grenades = Math.min(99, (player.grenades || 0) + (item.value || 1));
      if (HUD.setHandGrenades) HUD.setHandGrenades(player.godMode ? Infinity : player.grenades);
    }
  }

  function buildSellUI() {
    var grid = document.getElementById('sell-weapons-grid');
    var ammoGrid = document.getElementById('sell-ammo-grid');
    if (!grid || typeof Marketplace === 'undefined') return;
    grid.innerHTML = '';
    if (ammoGrid) ammoGrid.innerHTML = '';
    var count = Weapons.getWeaponCount();
    for (var i = 0; i < count; i++) {
      (function (idx) {
        var info = Weapons.getWeaponInfo(idx);
        if (!info) return;
        var priceOkc = Marketplace.getWeaponPriceOKC(info.id || Weapons.getWeaponId(idx));
        var pricePol = Marketplace.getWeaponPricePOL(info.id || Weapons.getWeaponId(idx));
        if (priceOkc <= 0) return;
        if (!Weapons.isUnlocked(idx)) return;

        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,136,68,0.05);border:1px solid #555;border-radius:6px;padding:6px;text-align:center';
        cell.innerHTML =
          '<div style="color:#fff;font-size:11px;font-weight:bold">' + info.name + '</div>' +
          '<div style="font-size:10px;color:#ff8844;margin:2px 0">🪙 ' + priceOkc + ' OKC | 💎 ' + pricePol + ' POL</div>';

        var sellBtn = document.createElement('button');
        sellBtn.className = 'btn';
        sellBtn.style.cssText = 'font-size:10px;padding:2px 8px;border-color:#ff8844;color:#ff8844;margin:2px';
        sellBtn.textContent = 'Sell (OKC)';
        sellBtn.addEventListener('click', function () {
          var earned = Marketplace.sellWeaponForOKC(idx);
          if (earned > 0) {
            HUD.notifyPickup('💰 Sold for ' + earned + ' OKC', '#ffd700');
            refreshMarketplaceUI('sell');
          }
        });
        cell.appendChild(sellBtn);
        grid.appendChild(cell);

        /* Ammo sell option */
        var state = Weapons.getWeaponState(idx);
        if (state && state.reserve > 0 && ammoGrid) {
          var aCell = document.createElement('div');
          aCell.style.cssText = 'background:rgba(255,136,68,0.05);border:1px solid #444;border-radius:6px;padding:6px;text-align:center';
          var sellAmt = Math.min(state.reserve, 50);
          var ammoVal = sellAmt * 2;
          aCell.innerHTML =
            '<div style="color:#ccc;font-size:10px">' + info.name + ' ammo (' + state.reserve + ')</div>' +
            '<div style="font-size:10px;color:#ffd700">Sell ' + sellAmt + ' → 🪙 ' + ammoVal + ' OKC</div>';
          var aSellBtn = document.createElement('button');
          aSellBtn.className = 'btn';
          aSellBtn.style.cssText = 'font-size:9px;padding:2px 6px;border-color:#ff8844;color:#ff8844;margin:2px';
          aSellBtn.textContent = 'Sell Ammo';
          aSellBtn.addEventListener('click', function () {
            var earned = Marketplace.sellAmmoForOKC(idx, sellAmt);
            if (earned > 0) {
              HUD.notifyPickup('💰 Sold ammo for ' + earned + ' OKC', '#ffd700');
              refreshMarketplaceUI('sell');
            }
          });
          aCell.appendChild(aSellBtn);
          ammoGrid.appendChild(aCell);
        }
      })(i);
    }
  }

  function buildPremiumUI() {
    var grid = document.getElementById('premium-tiers-grid');
    var status = document.getElementById('premium-status');
    if (!grid || typeof Marketplace === 'undefined') return;
    grid.innerHTML = '';

    if (Marketplace.isPremium()) {
      var pi = Marketplace.getPremiumInfo();
      if (status) {
        status.style.display = 'block';
        status.innerHTML = '✅ Active: <b>' + pi.name + '</b> — ' + pi.daysLeft + ' days remaining';
      }
    } else if (status) {
      status.style.display = 'none';
    }

    var tiers = Marketplace.getPremiumTiers();
    for (var i = 0; i < tiers.length; i++) {
      (function (idx) {
        var tier = tiers[idx];
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(130,71,229,0.08);border:1px solid #8247e5;border-radius:8px;padding:10px;text-align:center';
        var perksHtml = tier.perks.map(function (p) { return '<div style="font-size:9px;color:#aaa">• ' + p + '</div>'; }).join('');
        cell.innerHTML =
          '<div style="color:#fff;font-weight:bold;font-size:13px">' + tier.name + '</div>' +
          '<div style="font-size:11px;color:#8247e5;margin:4px 0">' + tier.duration + ' days</div>' +
          perksHtml +
          '<div style="font-size:11px;color:#ffd700;margin:6px 0">🪙 ' + tier.okcCost + ' OKC | 💎 ' + tier.polCost + ' POL</div>';

        var btnOkc = document.createElement('button');
        btnOkc.className = 'btn';
        btnOkc.style.cssText = 'font-size:10px;padding:3px 8px;border-color:#ffd700;color:#ffd700;margin:2px';
        btnOkc.textContent = 'Buy (OKC)';
        btnOkc.addEventListener('click', function () {
          if (Marketplace.buyPremiumWithOKC(idx)) {
            HUD.notifyPickup('⭐ ' + tier.name + ' activated!', '#8247e5');
            refreshMarketplaceUI('premium');
          } else {
            HUD.notifyPickup('❌ Not enough OKC', '#ff4444');
          }
        });
        cell.appendChild(btnOkc);

        var btnPol = document.createElement('button');
        btnPol.className = 'btn';
        btnPol.style.cssText = 'font-size:10px;padding:3px 8px;border-color:#8247e5;color:#8247e5;margin:2px';
        btnPol.textContent = 'Buy (POL)';
        btnPol.addEventListener('click', function () {
          Marketplace.buyPremiumWithPOL(idx).then(function (ok) {
            if (ok) {
              HUD.notifyPickup('⭐ ' + tier.name + ' activated! (POL)', '#8247e5');
              refreshMarketplaceUI('premium');
            } else {
              HUD.notifyPickup('❌ Transaction failed', '#ff4444');
            }
          });
        });
        cell.appendChild(btnPol);
        grid.appendChild(cell);
      })(i);
    }
  }

  function buildAssetsUI() {
    var grid = document.getElementById('assets-grid');
    if (!grid || typeof Marketplace === 'undefined') return;
    grid.innerHTML = '';
    var assets = Marketplace.getGameAssets();
    for (var i = 0; i < assets.length; i++) {
      (function (idx) {
        var asset = assets[idx];
        var owned = Marketplace.ownsAsset(asset.id);
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(0,255,204,0.05);border:1px solid ' + (owned ? '#0f6' : '#555') + ';border-radius:6px;padding:8px;text-align:center';
        cell.innerHTML =
          '<div style="color:#fff;font-weight:bold;font-size:11px">' + asset.name + '</div>' +
          '<div style="font-size:9px;color:#aaa;margin:2px 0">' + asset.type.toUpperCase() + '</div>' +
          (owned ? '<div style="color:#0f6;font-size:10px">✅ OWNED</div>'
            : '<div style="font-size:10px;color:#ffd700;margin:4px 0">🪙 ' + asset.okcCost + ' OKC | 💎 ' + asset.polCost + ' POL</div>');

        if (!owned) {
          var btnOkc = document.createElement('button');
          btnOkc.className = 'btn';
          btnOkc.style.cssText = 'font-size:9px;padding:2px 6px;border-color:#ffd700;color:#ffd700;margin:2px';
          btnOkc.textContent = 'Buy (OKC)';
          btnOkc.addEventListener('click', function () {
            if (asset.tokenId && Marketplace.buyCatalogAssetWithOKC) {
              Marketplace.buyCatalogAssetWithOKC(asset.tokenId, 1).then(function (ok) {
                if (ok) {
                  HUD.notifyPickup('🎨 ' + asset.name + ' unlocked!', '#00ffcc');
                  refreshMarketplaceUI('assets');
                } else {
                  HUD.notifyPickup('❌ Purchase failed', '#ff4444');
                }
              });
            } else if (Marketplace.buyAssetWithOKC(idx)) {
              HUD.notifyPickup('🎨 ' + asset.name + ' unlocked!', '#00ffcc');
              refreshMarketplaceUI('assets');
            } else {
              HUD.notifyPickup('❌ Not enough OKC', '#ff4444');
            }
          });
          cell.appendChild(btnOkc);

          var btnPol = document.createElement('button');
          btnPol.className = 'btn';
          btnPol.style.cssText = 'font-size:9px;padding:2px 6px;border-color:#8247e5;color:#8247e5;margin:2px';
          btnPol.textContent = 'Buy (POL)';
          btnPol.addEventListener('click', function () {
            Marketplace.buyAssetWithPOL(idx).then(function (ok) {
              if (ok) {
                HUD.notifyPickup('🎨 ' + asset.name + ' unlocked! (POL)', '#00ffcc');
                refreshMarketplaceUI('assets');
              } else {
                HUD.notifyPickup('❌ Transaction failed', '#ff4444');
              }
            });
          });
          cell.appendChild(btnPol);
        }
        grid.appendChild(cell);
      })(i);
    }
  }

  /* ── 59 Features: Helper Functions ──────────────────────────────── */

  /** Open perks selection menu */
  function _openPerksMenu() {
    if (typeof Perks === 'undefined') return;
    var grid = document.getElementById('perks-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var allPerks = Object.values(Perks.PERK_LIST);
    for (var i = 0; i < allPerks.length; i++) {
      (function (perk) {
        var cell = document.createElement('div');
        var equipped = Perks.hasPerk(perk.id);
        cell.style.cssText = 'padding:10px;border:1px solid ' + (equipped ? '#44ff44' : '#555') + ';border-radius:6px;cursor:pointer;background:rgba(' + (equipped ? '0,100,0' : '50,50,50') + ',0.3)';
        cell.innerHTML = '<div style="font-size:20px">' + perk.icon + '</div><div style="color:#ffcc00;font-weight:bold;font-size:12px">' + perk.name + '</div><div style="color:#aaa;font-size:10px;margin-top:4px">' + perk.desc + '</div>' + (equipped ? '<div style="color:#44ff44;font-size:10px;margin-top:4px">✅ EQUIPPED</div>' : '');
        cell.addEventListener('click', function () {
          if (equipped) {
            Perks.unequipPerk(perk.id);
          } else {
            if (!Perks.equipPerk(perk.id)) {
              HUD.notifyPickup('⚠ Max 3 perks equipped!', '#ff4444');
              return;
            }
          }
          _openPerksMenu(); // refresh
          _updatePerkDisplay();
        });
        grid.appendChild(cell);
      })(allPerks[i]);
    }
  }

  /** Update perk display slots in HUD */
  function _updatePerkDisplay() {
    if (typeof Perks === 'undefined') return;
    var equipped = Perks.getEquipped();
    for (var i = 0; i < 3; i++) {
      var slot = document.getElementById('perk-slot-' + (i + 1));
      if (!slot) continue;
      if (equipped[i]) {
        slot.style.display = 'block';
        slot.textContent = equipped[i].icon + ' ' + equipped[i].name;
      } else {
        slot.style.display = 'none';
      }
    }
  }

  /** Open war journal panel */
  function _openJournal() {
    if (typeof Progression === 'undefined') return;
    var content = document.getElementById('journal-content');
    if (!content) return;
    var entries = Progression.getJournal();
    if (entries.length === 0) {
      content.innerHTML = '<div style="color:#888;text-align:center">No entries yet. Kill enemies and explore to unlock intel.</div>';
      return;
    }
    var html = '';
    var cats = Progression.JOURNAL_CATEGORIES;
    for (var cat in cats) {
      var catEntries = Progression.getJournalByCategory(cat);
      if (catEntries.length === 0) continue;
      html += '<div style="color:#8B6914;font-weight:bold;margin-top:12px;border-bottom:1px solid #444;padding-bottom:4px">' + cats[cat] + '</div>';
      for (var j = 0; j < catEntries.length; j++) {
        html += '<div style="margin:6px 0;padding:6px;background:rgba(139,105,20,0.1);border-radius:4px"><div style="color:#ddd;font-weight:bold">' + catEntries[j].title + '</div><div style="color:#aaa;font-size:11px">' + catEntries[j].text + '</div></div>';
      }
    }
    content.innerHTML = html;
  }

  /* ── Mission Board: deliberately choose & START a mission ───────────── */
  var _missionBoardEl = null;
  var _MISSION_ICONS = {
    gather: '🔍', expand: '⚔', recon: '🛰', defense: '🛡', escort: '🚐',
    infiltrate: '🕵', clear_building: '🏚', assassinate: '🎯', sabotage: '💥',
    airborne_assault: '🪂', urban_breakout: '🏃', bradley_mission: '🚛', kyiv_defense: '🏛',
  };
  function _openMissionBoard() {
    if (typeof MissionSystem === 'undefined' || !MissionSystem.TEMPLATES) return;
    if (!_missionBoardEl) {
      _missionBoardEl = document.createElement('div');
      _missionBoardEl.id = 'mission-board';
      _missionBoardEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:520;width:min(560px,92vw);max-height:80vh;overflow-y:auto;background:linear-gradient(180deg,rgba(12,16,22,0.97),rgba(8,11,16,0.97));border:1px solid rgba(255,200,60,0.45);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.7);padding:16px 18px;font-family:"Segoe UI",system-ui,sans-serif;color:#eee;';
      document.body.appendChild(_missionBoardEl);
    }
    var T = MissionSystem.TEMPLATES;
    var active = (MissionSystem.getActive && MissionSystem.getActive()) || [];
    var activeName = active[0] && active[0].name;
    var rows = '';
    Object.keys(T).forEach(function (key) {
      var t = T[key];
      if (!t || !t.name) return;
      var icon = _MISSION_ICONS[key] || '📋';
      var tier = t.tier || 1;
      var stars = '★'.repeat(tier) + '☆'.repeat(Math.max(0, 3 - tier));
      var isActive = activeName === t.name;
      rows +=
        '<div style="display:flex;align-items:center;gap:12px;padding:10px;margin:6px 0;background:rgba(255,255,255,0.03);border:1px solid ' + (isActive ? 'rgba(120,255,140,0.5)' : 'rgba(255,255,255,0.07)') + ';border-radius:8px">' +
          '<div style="font-size:24px;flex:0 0 28px;text-align:center">' + icon + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:700;color:#ffd24a;font-size:14px">' + t.name + (isActive ? ' <span style="color:#7dff8c;font-size:10px">● ACTIVE</span>' : '') + '</div>' +
            '<div style="font-size:11px;color:#bcd;line-height:1.35">' + (t.description || '') + '</div>' +
            '<div style="font-size:10px;color:#caa84a;margin-top:2px">Difficulty ' + stars + '</div>' +
          '</div>' +
          '<button data-mission="' + key + '" class="mb-start-btn" style="flex:0 0 auto;background:' + (isActive ? '#2a3a2a' : 'linear-gradient(180deg,#3a7a3a,#2a5a2a)') + ';color:#dfffdf;border:1px solid rgba(120,255,140,0.5);border-radius:6px;padding:7px 12px;font-weight:700;font-size:12px;cursor:pointer;letter-spacing:0.5px">' + (isActive ? 'RESTART' : '▶ START') + '</button>' +
        '</div>';
    });
    _missionBoardEl.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<div style="font-size:17px;font-weight:800;color:#ffd24a;letter-spacing:1px">📋 MISSION BOARD</div>' +
        '<button id="mb-close" style="background:none;border:1px solid #555;color:#ccc;border-radius:6px;padding:3px 10px;cursor:pointer">✕ CLOSE</button>' +
      '</div>' +
      '<div style="font-size:11px;color:#9ab;margin-bottom:8px">Choose an operation to begin. The active mission shows in your objective banner.</div>' +
      rows;
    _missionBoardEl.style.display = 'block';
    gameState = STATE.PAUSED;
    _releaseMouseForUI();
    // wire buttons
    _missionBoardEl.querySelectorAll('.mb-start-btn').forEach(function (btn) {
      btn.onclick = function () {
        var key = btn.getAttribute('data-mission');
        try { MissionSystem.generateMission(key); } catch (e) {}
        try {
          var t = MissionSystem.TEMPLATES[key];
          if (t && HUD.notifyPickup) HUD.notifyPickup('📋 MISSION STARTED: ' + t.name, '#ffd24a');
        } catch (e) {}
        _closeMissionBoard();
      };
    });
    var closeBtn = document.getElementById('mb-close');
    if (closeBtn) closeBtn.onclick = _closeMissionBoard;
  }
  function _closeMissionBoard() {
    if (_missionBoardEl) _missionBoardEl.style.display = 'none';
    if (gameState === STATE.PAUSED) { gameState = STATE.PLAYING; requestPointerLock(); }
  }
  function _toggleMissionBoard() {
    if (_missionBoardEl && _missionBoardEl.style.display === 'block') _closeMissionBoard();
    else _openMissionBoard();
  }

  /** Activate a killstreak reward */
  function _activateStreak(index) {
    if (typeof Perks === 'undefined') return;
    var streak = Perks.activateStreak(index);
    if (!streak) return;
    HUD.notifyPickup(streak.icon + ' ' + streak.name + ' ACTIVATED!', '#ff6600');
    if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion();
    if (CameraSystem.shake) CameraSystem.shake(0.4, 0.5);

    if (streak.id === 'ARTILLERY' || streak.id === 'AIRSTRIKE') {
      // Damage enemies in area around player's aim point
      var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
      var target = player.position.clone().add(fwd.multiplyScalar(30));
      Enemies.damageInRadius(target, streak.radius || 15, streak.damage || 200);
      if (typeof Tracers !== 'undefined') Tracers.spawnExplosion(target, (streak.radius || 15) * 0.3);
    } else if (streak.id === 'NUKE') {
      // Kill all enemies
      var allEn = Enemies.getAll();
      for (var i = 0; i < allEn.length; i++) {
        if (allEn[i].alive) Enemies.damage(allEn[i], 99999);
      }
      if (typeof Tracers !== 'undefined') Tracers.spawnExplosion(player.position, 10);
      HUD.notifyPickup('☢️ TACTICAL NUKE DEPLOYED!', '#ff0000');
    } else if (streak.id === 'ORBITAL') {
      // Massive area damage
      Enemies.damageInRadius(player.position, streak.radius || 20, streak.damage || 500);
      if (typeof Tracers !== 'undefined') Tracers.spawnExplosion(player.position, 8);
    }
    // Refresh killstreak panel
    var ksList = document.getElementById('killstreak-list');
    if (ksList) {
      var avail = Perks.getAvailableStreaks();
      if (avail.length === 0) {
        document.getElementById('killstreak-panel').style.display = 'none';
        ksList.innerHTML = '';
      }
    }
  }

  /* ── Wave Shop Helper Functions ────────────────────────────── */
  function healPlayer(amount) {
    if (!player) return;
    player.hp = Math.min(player.hp + amount, player.maxHp);
    if (HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
    if (HUD.notifyPickup) HUD.notifyPickup('❤️ +' + amount + ' HP', '#44ff88');
  }

  function addArmor(amount) {
    if (!player) return;
    player.armor = Math.min((player.armor || 0) + amount, 100);
    if (HUD.notifyPickup) HUD.notifyPickup('🛡️ Armor +' + amount, '#4fc3f7');
  }

  function addStimBuff(duration) {
    if (!player) return;
    player._stimTimer = (player._stimTimer || 0) + duration;
    if (HUD.notifyPickup) HUD.notifyPickup('💉 Speed Boost ' + duration + 's', '#ff8a65');
  }

  /* ── Public API ──────────────────────────────────────────────────── */
  return {
    STATE,
    STAGES,
    init,
    startGame,
    hasSave,
    loadGame,
    saveGame,
    deleteSave,
    continueGame,
    notifyExplosiveKills,
    notifyNPCDeath,
    nextStage,
    update,
    beginWave,
    onWaveComplete,
    showOverlay,
    hideOverlays,
    requestPointerLock,
    toggleInventory,
    showInventory,
    resumeFromPause,
    quitToMenu,
    isMobile,
    setRole,
    toggleStealth,
    toggleGodMode,
    isGodMode,
    populateWeaponsGrid,
    updateRoleIndicator,
    refreshMarketplaceUI,
    getState:        function () { return gameState; },
    setState:        function (s) { gameState = s; updateMobileControlsVisibility(); },
    getPlayer:       function () { return player; },
    getScene:        function () { return _scene; },
    getCamera:       function () { return _camera; },
    getCurrentWave:  function () { return currentWave; },
    getCurrentStage: function () { return currentStage; },

    getStageInfo:    function () { return STAGES[currentStage]; },
    isSprinting:     function () { return player.sprinting; },
    _activateStreak: _activateStreak,
    _openPerksMenu: _openPerksMenu,
    _openJournal: _openJournal,
    toggleMissionBoard: _toggleMissionBoard,
    openMissionBoard: _openMissionBoard,
    healPlayer: healPlayer,
    addArmor: addArmor,
    addStimBuff: addStimBuff,
    addSuppression: addSuppression,
    requestFullscreenAndLockLandscape: requestFullscreenAndLockLandscape,
    // Test helpers for headless Puppeteer (bypasses pointer lock requirement)
    _testFireStart:  function () { mouseDown = true; mouseNewPress = true; },
    _testFireStop:   function () { mouseDown = false; mouseNewPress = false; },
    // QA automation: force start game and wave, bypassing all gating
    forceStartGame: function () {
      if (typeof window !== 'undefined' && window.__QA_MODE) {
        try {
          // Forcibly hide all overlays
          var overlayIds = [
            'overlay-start', 'overlay-pause', 'overlay-dead', 'overlay-waveclear',
            'overlay-stageclear', 'overlay-win', 'inventory-overlay', 'perks-menu',
            'stats-panel', 'journal-panel', 'leaderboard-panel', 'mission-tracker',
            'mine-counter', 'adrenaline-indicator', 'uav-indicator', 'supply-menu',
            'field-promotion', 'achievement-popup', 'wave-stats', 'tactical-map',
            'bounty-display', 'daily-challenges', 'perk-display', 'killstreak-panel',
            'slide-indicator', 'focus-indicator', 'revenge-marker', 'dual-wield-indicator',
            'heat-bar-container', 'ammo-type-indicator', 'laststand-indicator', 'combat-log',
            'fog-of-war', 'radiation-warning', 'wallrun-indicator', 'tacsprint-indicator',
            'lean-indicator', 'inspect-overlay', 'bayonet-indicator', 'maintenance-indicator',
            'overheat-indicator', 'blindfire-indicator', 'swim-indicator', 'breath-bar-container',
            'mantle-indicator', 'vehicle-hud', 'build-hud', 'build-materials-hud', 'hud-okc-bar',
            'weather-indicator', 'interaction-prompt', 'low-hp-vignette', 'shield-indicator',
            'inventory-btn', 'mobile-controls', 'skill-hud-overlay', 'skill-hud-btn'
          ];
          overlayIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
          });
          // Hide all elements with class 'overlay'
          var overlays = document.querySelectorAll('.overlay');
          overlays.forEach(function(el) { el.style.display = 'none'; });
          // Show the main HUD
          var hudEl = document.getElementById('hud');
          if (hudEl) hudEl.style.display = 'block';
          gameState = STATE.PLAYING;
          if (typeof GameManager.startGame === 'function') GameManager.startGame();
          // startGame schedules its own beginWave(1) (3.2s announce delay);
          // cancel it — QA starts the wave immediately below, and letting both
          // fire double-spawned every wave-1 (incl. duplicate Kyiv convoys).
          if (_waveStartTimer) { clearTimeout(_waveStartTimer); _waveStartTimer = null; }
          if (typeof GameManager.beginWave === 'function') GameManager.beginWave(1);
          if (typeof HUD !== 'undefined' && HUD.show) HUD.show();
        } catch (e) {
          if (typeof console !== 'undefined') console.error('forceStartGame error:', e);
        }
      }
    },
    // --- CRITICAL: Export drone selection functions for browser QA ---
    showDroneSelection: showDroneSelection,
    selectAndLaunchDrone: selectAndLaunchDrone,
  };
})();

// Expose GameManager and forceStartGame globally for automated QA and Puppeteer access
if (typeof window !== 'undefined') {
  window.GameManager = GameManager;
  console.log('[QA] GameManager export (end)', typeof GameManager, typeof window.GameManager);
  if (typeof GameManager.forceStartGame === 'function') {
    window.forceStartGame = GameManager.forceStartGame;
    console.log('[QA] window.forceStartGame assigned');
  }
}
if (typeof globalThis !== 'undefined') globalThis.GameManager = GameManager;

// Ensure drone selection functions are always exported globally for browser QA
if (typeof window !== 'undefined') {
  window.showDroneSelection = GameManager.showDroneSelection;
  window.selectAndLaunchDrone = GameManager.selectAndLaunchDrone;
  console.log('[QA] window.showDroneSelection and selectAndLaunchDrone assigned');
}
