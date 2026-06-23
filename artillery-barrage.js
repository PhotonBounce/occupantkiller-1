/* ───────────────────────────────────────────────────────────────────────────
   artillery-barrage.js — Heavy artillery / indirect fire system
   Ctrl+Shift+F → open artillery HUD with targeting grid
   Click sector  → select target zone, Enter to confirm
   Alt held      → creeping barrage mode (12 shells in line, 5m intervals)
   API           : window.ArtilleryBarrage = { init, update, callFireMission, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.ArtilleryBarrage = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var MAX_MISSIONS       = 3;
  var COOLDOWN_TIME      = 60;    // seconds
  var PRE_DELAY          = 4;     // seconds before first shell
  var SHELL_COUNT        = 8;
  var SHELL_SPREAD       = 8;     // ±metres around target
  var SHELL_SPAWN_Y      = 60;
  var SHELL_SPEED        = 25;    // m/s downward
  var SHELL_RADIUS       = 0.15;
  var BARRAGE_DURATION   = 6;     // seconds total for all shells
  var EXPLOSION_DAMAGE   = 200;
  var EXPLOSION_RADIUS   = 12;
  var FRIENDLY_DAMAGE    = 80;
  var FRIENDLY_RADIUS    = 12;
  var SUPPRESSION_RADIUS = 20;
  var SUPPRESSION_TIME   = 3;
  var PARTICLE_COUNT     = 100;
  var SMOKE_SPHERES      = 6;
  var SMOKE_RISE_SPEED   = 0.5;
  var SMOKE_LIFE         = 10;    // seconds
  var DEBRIS_COUNT       = 10;
  var WARNING_TIME       = 1;     // seconds before first impact
  var CREEP_COUNT        = 12;
  var CREEP_INTERVAL     = 5;     // metres between creeping shells
  var CREEP_DELAY        = 0.8;   // seconds between each creeping shell

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;
  var _renderer = null;

  var _missionsLeft      = MAX_MISSIONS;
  var _cooldownRemaining = 0;

  /* HUD */
  var _hudEl        = null;
  var _gridOverlay  = null;
  var _hudOpen      = false;
  var _selectedSector = -1;   // 0-8 (3x3 grid)
  var _targetPos    = null;   // THREE.Vector3
  var _creepMode    = false;

  /* fire mission phases */
  var _phase      = 'idle';  // idle | targeting | warning | firing | done
  var _phaseTimer = 0;

  /* shells in flight */
  var _shells      = [];  // { mesh, x, y, z, vy }
  var _shellTimers = [];  // seconds after phase start when each shell spawns
  var _shellsFired = 0;
  var _firingTimer = 0;

  /* VFX pools */
  var _particles = [];  // { mesh, mat, vx, vy, vz, life, maxLife }
  var _smoke     = [];  // { mesh, mat, vy, life, maxLife }
  var _craters   = [];
  var _debris    = [];

  /* warning */
  var _warningEl    = null;
  var _warningTimer = 0;
  var _warningBlink = 0;
  var _warningShown = false;

  /* screen shake */
  var _shakeTime     = 0;
  var _shakeStrength = 0;

  /* ammo HUD */
  var _ammoEl = null;

  /* ── init ───────────────────────────────────────────────────────────────── */
  function init(scene, camera, canvas, renderer) {
    _scene    = scene;
    _camera   = camera;
    _canvas   = canvas || document.getElementById('c') || document.querySelector('canvas');
    _renderer = renderer || null;

    _buildAmmoHUD();
    _buildWarningEl();
    _buildHUD();
    _bindKeys();
    _updateAmmoHUD();
  }

  /* ── HUD construction ───────────────────────────────────────────────────── */
  function _buildAmmoHUD() {
    _ammoEl = document.createElement('div');
    _ammoEl.id = 'arty-ammo-hud';
    _ammoEl.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'border:1px solid rgba(255,80,80,0.6)',
      'color:#ff5555',
      'padding:3px 14px',
      'border-radius:4px',
      'font-size:12px',
      'font-family:monospace',
      'z-index:300',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_ammoEl);
  }

  function _buildWarningEl() {
    _warningEl = document.createElement('div');
    _warningEl.id = 'arty-warning';
    _warningEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff0000',
      'font-size:32px',
      'font-family:monospace',
      'font-weight:bold',
      'letter-spacing:4px',
      'z-index:500',
      'pointer-events:none',
      'display:none',
      'text-shadow:0 0 10px #ff0000'
    ].join(';');
    _warningEl.textContent = 'ARTILLERY INCOMING';
    document.body.appendChild(_warningEl);
  }

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'arty-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'background:rgba(0,0,0,0.55)',
      'z-index:400',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace'
    ].join(';');

    /* title */
    var title = document.createElement('div');
    title.style.cssText = 'color:#ff4444;font-size:20px;font-weight:bold;letter-spacing:3px;margin-bottom:16px;text-shadow:0 0 8px #ff0000';
    title.textContent = 'CALL FIRE MISSION';
    _hudEl.appendChild(title);

    /* mode indicator */
    var modeEl = document.createElement('div');
    modeEl.id = 'arty-mode-label';
    modeEl.style.cssText = 'color:#ffaa00;font-size:12px;margin-bottom:12px;letter-spacing:2px';
    modeEl.textContent = 'STANDARD BARRAGE  |  Hold ALT for CREEPING BARRAGE';
    _hudEl.appendChild(modeEl);

    /* grid container */
    var grid = document.createElement('div');
    grid.id = 'arty-grid';
    grid.style.cssText = [
      'display:grid',
      'grid-template-columns:repeat(3,120px)',
      'grid-template-rows:repeat(3,80px)',
      'gap:3px',
      'border:2px solid #ff4444',
      'padding:3px',
      'background:rgba(255,0,0,0.05)'
    ].join(';');

    var sectorNames = ['A1','A2','A3','B1','B2','B3','C1','C2','C3'];
    for (var i = 0; i < 9; i++) {
      (function(idx) {
        var cell = document.createElement('div');
        cell.id = 'arty-sector-' + idx;
        cell.style.cssText = [
          'background:rgba(255,0,0,0.08)',
          'border:1px solid rgba(255,60,60,0.5)',
          'color:#ff6666',
          'font-size:22px',
          'font-weight:bold',
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'cursor:crosshair',
          'user-select:none',
          'transition:background 0.1s'
        ].join(';');
        cell.textContent = sectorNames[idx];
        cell.addEventListener('click', function () { _selectSector(idx); });
        cell.addEventListener('mouseenter', function () {
          if (_selectedSector !== idx) {
            cell.style.background = 'rgba(255,60,60,0.22)';
          }
        });
        cell.addEventListener('mouseleave', function () {
          if (_selectedSector !== idx) {
            cell.style.background = 'rgba(255,0,0,0.08)';
          }
        });
        grid.appendChild(cell);
      })(i);
    }
    _hudEl.appendChild(grid);

    /* instruction row */
    var instr = document.createElement('div');
    instr.style.cssText = 'color:#aaa;font-size:12px;margin-top:14px;letter-spacing:1px';
    instr.textContent = 'CLICK SECTOR TO SELECT  |  ENTER TO CONFIRM  |  ESC TO CANCEL';
    _hudEl.appendChild(instr);

    document.body.appendChild(_hudEl);
  }

  function _selectSector(idx) {
    /* unhighlight old */
    if (_selectedSector >= 0) {
      var old = document.getElementById('arty-sector-' + _selectedSector);
      if (old) old.style.background = 'rgba(255,0,0,0.08)';
    }
    _selectedSector = idx;
    var el = document.getElementById('arty-sector-' + idx);
    if (el) el.style.background = 'rgba(255,0,0,0.45)';
  }

  /* ── key binding ────────────────────────────────────────────────────────── */
  function _bindKeys() {
    document.addEventListener('keydown', function (e) {
      /* Ctrl+Shift+F → open HUD */
      if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        if (_phase === 'idle') _openHUD();
        return;
      }
      /* Enter → confirm selection */
      if (e.key === 'Enter' && _hudOpen) {
        e.preventDefault();
        _confirmTarget();
        return;
      }
      /* Escape → cancel */
      if (e.key === 'Escape' && _hudOpen) {
        _closeHUD();
        return;
      }
    });
  }

  /* ── HUD open/close ─────────────────────────────────────────────────────── */
  function _openHUD() {
    if (_missionsLeft <= 0 && _cooldownRemaining > 0) return;
    if (_missionsLeft <= 0) return;
    _hudOpen = true;
    _selectedSector = -1;
    _creepMode = false;
    _hudEl.style.display = 'flex';
    _updateAmmoHUD();

    /* check Alt for creep mode */
    _hudEl.addEventListener('keydown', _checkAlt);
    _hudEl.addEventListener('keyup', _checkAlt);
  }

  function _checkAlt(e) {
    _creepMode = e.altKey;
    var modeEl = document.getElementById('arty-mode-label');
    if (modeEl) {
      modeEl.textContent = _creepMode
        ? 'CREEPING BARRAGE MODE ACTIVE'
        : 'STANDARD BARRAGE  |  Hold ALT for CREEPING BARRAGE';
      modeEl.style.color = _creepMode ? '#ff4400' : '#ffaa00';
    }
  }

  function _closeHUD() {
    _hudOpen = false;
    _hudEl.style.display = 'none';
  }

  /* ── confirm fire mission ───────────────────────────────────────────────── */
  function _confirmTarget() {
    if (_selectedSector < 0) return;
    if (_missionsLeft <= 0) { _closeHUD(); return; }

    /* compute world position from sector (3x3 in front of camera) */
    var col = _selectedSector % 3;
    var row = Math.floor(_selectedSector / 3);

    /* project grid into world: 30m ahead, ±15m lateral, ±15m depth */
    var forward = new THREE.Vector3(-Math.sin(_camera.rotation.y), 0, -Math.cos(_camera.rotation.y));
    var right   = new THREE.Vector3(forward.z, 0, -forward.x);

    var basePos = _camera.position.clone().add(forward.clone().multiplyScalar(40));
    var offsetX = (col - 1) * 15;
    var offsetZ = (row - 1) * 15;
    var wx = basePos.x + right.x * offsetX + forward.x * offsetZ;
    var wz = basePos.z + right.z * offsetX + forward.z * offsetZ;

    /* check for smoke marker from SmokeLauncher */
    if (window.SmokeLauncher && typeof window.SmokeLauncher.getSmokePosition === 'function') {
      var smokePos = window.SmokeLauncher.getSmokePosition();
      if (smokePos) { wx = smokePos.x; wz = smokePos.z; }
    }

    _targetPos = new THREE.Vector3(wx, 0, wz);
    _creepMode = _creepMode || (typeof event !== 'undefined' && event && event.altKey);

    _missionsLeft--;
    _closeHUD();
    _updateAmmoHUD();

    _startFireMission();
  }

  /* ── public callFireMission ─────────────────────────────────────────────── */
  function callFireMission(worldPos, creep) {
    if (!_scene) return;
    if (_missionsLeft <= 0) return;
    _targetPos = worldPos.clone ? worldPos.clone() : new THREE.Vector3(worldPos.x, 0, worldPos.z);
    _creepMode = !!creep;
    _missionsLeft--;
    _updateAmmoHUD();
    _startFireMission();
  }

  /* ── fire mission logic ─────────────────────────────────────────────────── */
  function _startFireMission() {
    _phase      = 'warning';
    _phaseTimer = 0;
    _shellsFired = 0;
    _firingTimer = 0;
    _warningShown = false;
    _shellTimers  = [];

    if (_creepMode) {
      /* 12 shells in a line, 0.8s apart */
      for (var ci = 0; ci < CREEP_COUNT; ci++) {
        _shellTimers.push(ci * CREEP_DELAY);
      }
    } else {
      /* 8 shells spread over 6 seconds */
      for (var si = 0; si < SHELL_COUNT; si++) {
        _shellTimers.push((si / (SHELL_COUNT - 1)) * BARRAGE_DURATION);
      }
    }
  }

  /* ── update (call each frame) ────────────────────────────────────────────── */
  function update(dt) {
    if (!_scene) return;
    if (!dt || dt > 0.2) dt = 0.016;

    /* cooldown tick */
    if (_cooldownRemaining > 0) {
      _cooldownRemaining -= dt;
      if (_cooldownRemaining < 0) _cooldownRemaining = 0;
      _updateAmmoHUD();
    }

    /* reset missions when cooldown ends */
    if (_cooldownRemaining <= 0 && _missionsLeft < MAX_MISSIONS && _phase === 'idle') {
      _missionsLeft = MAX_MISSIONS;
      _updateAmmoHUD();
    }

    _updatePhase(dt);
    _updateShells(dt);
    _updateParticles(dt);
    _updateSmoke(dt);
    _updateWarning(dt);
    _updateShake(dt);

    /* ALT key tracking while HUD open */
    if (_hudOpen) {
      _creepMode = !!(window.event && window.event.altKey);
    }
  }

  function _updatePhase(dt) {
    if (_phase === 'idle' || _phase === 'done') return;

    _phaseTimer += dt;

    if (_phase === 'warning') {
      /* warning phase: show text + pre-shake, then start shells after PRE_DELAY */
      if (!_warningShown && _phaseTimer >= PRE_DELAY - WARNING_TIME) {
        _warningShown = true;
        _triggerWarning();
      }
      if (_phaseTimer >= PRE_DELAY) {
        _phase = 'firing';
        _phaseTimer = 0;
      }

    } else if (_phase === 'firing') {
      _firingTimer += dt;

      /* spawn shells at scheduled times */
      while (_shellsFired < _shellTimers.length && _firingTimer >= _shellTimers[_shellsFired]) {
        _spawnShell(_shellsFired);
        _shellsFired++;
      }

      /* firing ends when all shells spawned + extra 3s for last shell to land */
      var totalShells = _creepMode ? CREEP_COUNT : SHELL_COUNT;
      if (_shellsFired >= totalShells && _shells.length === 0) {
        _phase = 'done';
        _spawnDebrisField();
        _startCooldown();
      }
    }
  }

  function _spawnShell(shellIdx) {
    if (!_scene || !_targetPos) return;

    var tx = _targetPos.x;
    var tz = _targetPos.z;

    if (_creepMode) {
      /* creep: shells advance in a line from target forward */
      var fwd = new THREE.Vector3(-Math.sin(_camera.rotation.y), 0, -Math.cos(_camera.rotation.y));
      tx += fwd.x * shellIdx * CREEP_INTERVAL;
      tz += fwd.z * shellIdx * CREEP_INTERVAL;
    }

    /* random spread */
    var sx = tx + (Math.random() * 2 - 1) * SHELL_SPREAD;
    var sz = tz + (Math.random() * 2 - 1) * SHELL_SPREAD;

    var geo = new THREE.SphereGeometry(SHELL_RADIUS, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(sx, SHELL_SPAWN_Y, sz);
    _scene.add(mesh);

    _shells.push({ mesh: mesh, x: sx, y: SHELL_SPAWN_Y, z: sz, vy: -SHELL_SPEED, targetX: tx, targetZ: tz });
  }

  function _updateShells(dt) {
    for (var i = _shells.length - 1; i >= 0; i--) {
      var s = _shells[i];
      s.y += s.vy * dt;
      s.mesh.position.y = s.y;

      if (s.y <= 0.1) {
        /* impact! */
        _scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        _shells.splice(i, 1);
        _onShellImpact(s.x, s.z, s.targetX || s.x, s.targetZ || s.z);
      }
    }
  }

  /* ── impact effects ─────────────────────────────────────────────────────── */
  function _onShellImpact(ix, iz, centerX, centerZ) {
    _playBoomSound(0.8);
    _spawnExplosionParticles(ix, iz);
    _spawnCrater(ix, iz);
    _spawnSmoke(ix, iz);
    _triggerShake(0.4, 0.25);
    _dealExplosionDamage(ix, iz);
    _suppressEnemies(centerX, centerZ);
  }

  function _dealExplosionDamage(ix, iz) {
    /* friendly fire */
    if (window.player || window.gameState) {
      var px = 0, pz = 0, py = 0;
      if (window.camera) { px = window.camera.position.x; py = window.camera.position.y; pz = window.camera.position.z; }
      else if (window.player && window.player.position) { px = window.player.position.x; py = window.player.position.y; pz = window.player.position.z; }
      var pdx = px - ix, pdz = pz - iz;
      var dist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (dist < FRIENDLY_RADIUS) {
        _triggerShake(0.8, 0.5);
        if (window.gameState && typeof window.gameState.playerHealth !== 'undefined') {
          window.gameState.playerHealth -= FRIENDLY_DAMAGE;
          if (window.gameState.playerHealth < 0) window.gameState.playerHealth = 0;
        }
        if (window.HUD && typeof window.HUD.flashDamage === 'function') {
          window.HUD.flashDamage();
        }
      }
    }

    /* enemy damage */
    var enemies = _getEnemies();
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      var ep = e.position || (e.mesh && e.mesh.position);
      if (!ep) continue;
      var edx = ep.x - ix, edz = ep.z - iz;
      var edist = Math.sqrt(edx * edx + edz * edz);
      if (edist < EXPLOSION_RADIUS) {
        var dmg = EXPLOSION_DAMAGE * (1 - edist / EXPLOSION_RADIUS);
        if (typeof e.takeDamage === 'function') e.takeDamage(dmg);
        else if (typeof e.health !== 'undefined') e.health -= dmg;
      }
    }
  }

  function _suppressEnemies(cx, cz) {
    var enemies = _getEnemies();
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      var ep = e.position || (e.mesh && e.mesh.position);
      if (!ep) continue;
      var dx = ep.x - cx, dz = ep.z - cz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < SUPPRESSION_RADIUS) {
        e.suppressed = true;
        e.suppressedTimer = SUPPRESSION_TIME;
      }
    }
  }

  function _getEnemies() {
    if (window.enemies && Array.isArray(window.enemies)) return window.enemies;
    if (window.Enemies && Array.isArray(window.Enemies.list)) return window.Enemies.list;
    if (window.gameState && Array.isArray(window.gameState.enemies)) return window.gameState.enemies;
    return [];
  }

  /* ── particles ──────────────────────────────────────────────────────────── */
  function _spawnExplosionParticles(ix, iz) {
    for (var p = 0; p < PARTICLE_COUNT; p++) {
      var isRed = Math.random() > 0.4;
      var color = isRed ? 0xff2200 : 0x888888;
      var geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 4, 4);
      var mat = new THREE.MeshBasicMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ix, 0.3, iz);
      _scene.add(mesh);

      var speed = 3 + Math.random() * 12;
      var angle = Math.random() * Math.PI * 2;
      var elev  = Math.random() * Math.PI * 0.6;
      _particles.push({
        mesh: mesh,
        mat: mat,
        vx: Math.cos(angle) * Math.cos(elev) * speed,
        vy: Math.sin(elev) * speed + 2,
        vz: Math.sin(angle) * Math.cos(elev) * speed,
        life: 0,
        maxLife: 0.8 + Math.random() * 1.0
      });
    }
  }

  function _updateParticles(dt) {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        _particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 12 * dt;  /* gravity */
      if (p.mesh.position.y < 0) p.mesh.position.y = 0;
      p.mat.opacity = 1 - p.life / p.maxLife;
      p.mat.transparent = true;
    }
  }

  /* ── crater ─────────────────────────────────────────────────────────────── */
  function _spawnCrater(ix, iz) {
    var geo = new THREE.CircleGeometry(1.8 + Math.random() * 1.2, 16);
    var mat = new THREE.MeshBasicMaterial({ color: 0x1a1008, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(ix, 0.02, iz);
    _scene.add(mesh);
    _craters.push(mesh);
  }

  /* ── smoke columns ──────────────────────────────────────────────────────── */
  function _spawnSmoke(ix, iz) {
    for (var s = 0; s < SMOKE_SPHERES; s++) {
      var r = 0.3 + Math.random() * 0.5;
      var geo = new THREE.SphereGeometry(r, 6, 6);
      var mat = new THREE.MeshBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.55 + Math.random() * 0.3
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        ix + (Math.random() - 0.5) * 1.5,
        s * 0.5,
        iz + (Math.random() - 0.5) * 1.5
      );
      _scene.add(mesh);
      _smoke.push({
        mesh: mesh,
        mat: mat,
        vy: SMOKE_RISE_SPEED + Math.random() * 0.2,
        life: 0,
        maxLife: SMOKE_LIFE + Math.random() * 3
      });
    }
  }

  function _updateSmoke(dt) {
    for (var i = _smoke.length - 1; i >= 0; i--) {
      var s = _smoke[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        _scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mat.dispose();
        _smoke.splice(i, 1);
        continue;
      }
      s.mesh.position.y += s.vy * dt;
      s.mat.opacity = (1 - s.life / s.maxLife) * 0.65;
    }
  }

  /* ── debris field ───────────────────────────────────────────────────────── */
  function _spawnDebrisField() {
    if (!_targetPos) return;
    for (var d = 0; d < DEBRIS_COUNT; d++) {
      var w = 0.2 + Math.random() * 0.6;
      var h = 0.15 + Math.random() * 0.4;
      var depth = 0.2 + Math.random() * 0.5;
      var geo = new THREE.BoxGeometry(w, h, depth);
      var color = Math.random() > 0.5 ? 0x5c4a28 : 0x555555;
      var mat = new THREE.MeshBasicMaterial({ color: color });
      var mesh = new THREE.Mesh(geo, mat);
      var angle = Math.random() * Math.PI * 2;
      var spread = Math.random() * EXPLOSION_RADIUS;
      mesh.position.set(
        _targetPos.x + Math.cos(angle) * spread,
        h / 2,
        _targetPos.z + Math.sin(angle) * spread
      );
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.rotation.z = (Math.random() - 0.5) * 0.6;
      _scene.add(mesh);
      _debris.push(mesh);
    }
  }

  /* ── warning system ─────────────────────────────────────────────────────── */
  function _triggerWarning() {
    _warningEl.style.display = 'block';
    _warningTimer = 3.0;
    _warningBlink = 0;
    _triggerShake(0.25, 0.3);
    _playBoomSound(0.35);  /* distant boom warning */
  }

  function _updateWarning(dt) {
    if (_warningTimer <= 0) return;
    _warningTimer -= dt;
    _warningBlink += dt;
    /* blink: 4 Hz */
    var visible = Math.sin(_warningBlink * Math.PI * 4) > 0;
    _warningEl.style.display = (visible && _warningTimer > 0) ? 'block' : 'none';
    if (_warningTimer <= 0) {
      _warningEl.style.display = 'none';
    }
  }

  /* ── screen shake ───────────────────────────────────────────────────────── */
  function _triggerShake(strength, duration) {
    _shakeStrength = Math.max(_shakeStrength, strength);
    _shakeTime = Math.max(_shakeTime, duration);
  }

  function _updateShake(dt) {
    if (_shakeTime <= 0) return;
    _shakeTime -= dt;
    if (_shakeTime < 0) { _shakeTime = 0; _shakeStrength = 0; }
    if (_camera) {
      var s = _shakeStrength * (_shakeTime > 0 ? 1 : 0);
      _camera.position.x += (Math.random() - 0.5) * s * 0.15;
      _camera.position.y += (Math.random() - 0.5) * s * 0.08;
    }
  }

  /* ── audio ──────────────────────────────────────────────────────────────── */
  function _playBoomSound(volumeScale) {
    var vol = volumeScale !== undefined ? volumeScale : 1.0;
    try {
      var ctx = window._audioCtx || (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(50, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.7 * vol, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) { /* no audio context available */ }
  }

  /* ── ammo HUD update ────────────────────────────────────────────────────── */
  function _updateAmmoHUD() {
    if (!_ammoEl) return;
    var cdStr = _cooldownRemaining > 0 ? ' CD:' + Math.ceil(_cooldownRemaining) + 's' : '';
    _ammoEl.textContent = 'ARTY [' + _missionsLeft + ']' + cdStr;
    _ammoEl.style.display = 'block';
    _ammoEl.style.color = _missionsLeft > 0 ? '#ff5555' : '#888888';
  }

  /* ── cooldown ───────────────────────────────────────────────────────────── */
  function _startCooldown() {
    _phase = 'idle';
    _cooldownRemaining = COOLDOWN_TIME;
    _missionsLeft = 0;
    _updateAmmoHUD();
  }

  /* ── reset ──────────────────────────────────────────────────────────────── */
  function reset() {
    /* remove all VFX */
    for (var i = 0; i < _shells.length; i++) {
      if (_scene) _scene.remove(_shells[i].mesh);
    }
    _shells = [];

    for (var j = 0; j < _particles.length; j++) {
      if (_scene) _scene.remove(_particles[j].mesh);
    }
    _particles = [];

    for (var k = 0; k < _smoke.length; k++) {
      if (_scene) _scene.remove(_smoke[k].mesh);
    }
    _smoke = [];

    for (var m = 0; m < _craters.length; m++) {
      if (_scene) _scene.remove(_craters[m]);
    }
    _craters = [];

    for (var n = 0; n < _debris.length; n++) {
      if (_scene) _scene.remove(_debris[n]);
    }
    _debris = [];

    _phase             = 'idle';
    _phaseTimer        = 0;
    _shellsFired       = 0;
    _firingTimer       = 0;
    _missionsLeft      = MAX_MISSIONS;
    _cooldownRemaining = 0;
    _warningTimer      = 0;
    _warningShown      = false;
    _shakeTime         = 0;
    _shakeStrength     = 0;
    _targetPos         = null;
    _selectedSector    = -1;

    if (_warningEl) _warningEl.style.display = 'none';
    if (_hudEl)     _hudEl.style.display = 'none';
    _hudOpen = false;

    _updateAmmoHUD();
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  return {
    init:            init,
    update:          update,
    callFireMission: callFireMission,
    reset:           reset
  };

})();
