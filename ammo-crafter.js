/* ─────────────────────────────────────────────────────────────────────────────
   ammo-crafter.js  — scavenge gunpowder, brass and primers; craft ammunition
   Depends on: THREE (global), GameManager (optional), HUD (optional)

   Public API  (window.AmmoCrafter):
     init(scene, camera)   — call once after THREE scene exists
     update(dt)            — call every frame with delta-seconds
     craft(recipeIndex)    — start crafting a recipe by index
     reset()               — clear pickups & inventory (new game / restart)

   Global state:
     window._craftingMaterials  {gunpowder, brass, primer}
   ───────────────────────────────────────────────────────────────────────────── */

window.AmmoCrafter = (function () {
  'use strict';

  /* ─── material config ─────────────────────────────────────────────────── */
  var MAT = {
    GUNPOWDER: { key: 'gunpowder', label: 'GP', color: 0x8B4513, perLevel: 3 },
    BRASS:     { key: 'brass',     label: 'BR', color: 0xB8860B, perLevel: 4 },
    PRIMER:    { key: 'primer',    label: 'PR', color: 0xCC2222, perLevel: 2 },
  };

  var COLLECT_DIST    = 1.2;    // units
  var COLLECT_DIST_SQ = COLLECT_DIST * COLLECT_DIST;
  var BOB_SPEED       = 1.4;    // rad/s
  var BOB_RANGE       = 0.07;   // metres
  var ROTATE_SPEED    = 0.9;    // rad/s

  /* ─── crafting recipes ────────────────────────────────────────────────── */
  var RECIPES = [
    {
      name:   '12 RIFLE ROUNDS',
      cost:   { gunpowder: 1, brass: 1, primer: 0 },
      give:   function (gm) { _addAmmo(gm, 'ASSAULT', 12); },
      label:  '1 GP + 1 BR  →  12 Rifle Rounds',
    },
    {
      name:   '8 PISTOL ROUNDS',
      cost:   { gunpowder: 1, brass: 0, primer: 1 },
      give:   function (gm) { _addAmmo(gm, 'PISTOL', 8); },
      label:  '1 GP + 1 PR  →  8 Pistol Rounds',
    },
    {
      name:   '5 SHOTGUN SHELLS',
      cost:   { gunpowder: 0, brass: 2, primer: 1 },
      give:   function (gm) { _addAmmo(gm, 'SHOTGUN', 5); },
      label:  '2 BR + 1 PR  →  5 Shotgun Shells',
    },
    {
      name:   '3 SNIPER ROUNDS',
      cost:   { gunpowder: 1, brass: 2, primer: 1 },
      give:   function (gm) { _addAmmo(gm, 'SNIPER', 3); },
      label:  '1 GP + 2 BR + 1 PR  →  3 Sniper Rounds',
    },
    {
      name:   'IMPROVISED GRENADE',
      cost:   { gunpowder: 3, brass: 0, primer: 1 },
      give:   function (gm) { _addGrenade(gm); },
      label:  '3 GP + 1 PR  →  1 Grenade',
    },
  ];

  /* ─── module state ────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _pickups  = [];    // { mesh, type, baseY, phase }
  var _time     = 0;

  /* crafting animation */
  var _crafting       = false;
  var _craftTimer     = 0;
  var _craftDuration  = 2.0;
  var _craftRecipe    = null;
  var _craftBarEl     = null;
  var _craftLabelEl   = null;
  var _craftWrapEl    = null;

  /* craft menu */
  var _menuOpen       = false;
  var _menuEl         = null;
  var _menuSelected   = 0;

  /* HUD material display */
  var _hudEl          = null;

  /* toast */
  var _toastEl        = null;
  var _toastTimer     = 0;

  /* AudioContext for hammering */
  var _audioCtx       = null;

  /* ─── public inventory (persists between waves) ───────────────────────── */
  window._craftingMaterials = window._craftingMaterials || {
    gunpowder: 0,
    brass:     0,
    primer:    0,
  };

  /* ─── helpers ─────────────────────────────────────────────────────────── */
  function _getCamera() {
    if (_camera) return _camera;
    if (window.GameManager && window.GameManager.camera) return window.GameManager.camera;
    if (window._camera) return window._camera;
    return null;
  }

  function _getScene() {
    if (_scene) return _scene;
    if (window.GameManager && window.GameManager.scene) return window.GameManager.scene;
    if (window._scene) return window._scene;
    return null;
  }

  function _addAmmo(gm, type, count) {
    if (!gm) return;
    /* Try common patterns used by different weapon systems */
    if (gm.addAmmoByType) { gm.addAmmoByType(type, count); return; }
    if (gm.addReserveAmmo) { gm.addReserveAmmo(type, count); return; }
    /* Fallback: store in a window reserve */
    window._reserveAmmo = window._reserveAmmo || {};
    window._reserveAmmo[type] = (window._reserveAmmo[type] || 0) + count;
  }

  function _addGrenade(gm) {
    if (!gm) return;
    if (typeof gm.grenadeCount === 'number') { gm.grenadeCount += 1; return; }
    if (window._grenadeCount !== undefined) { window._grenadeCount += 1; return; }
    window._grenadeCount = (window._grenadeCount || 0) + 1;
  }

  /* ─── pickup geometry factories ────────────────────────────────────────── */
  function _makeGunpowderMesh() {
    var geo  = new THREE.BoxGeometry(0.15, 0.1, 0.15);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    return new THREE.Mesh(geo, mat);
  }

  function _makeBrassMesh() {
    var geo  = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xB8860B });
    return new THREE.Mesh(geo, mat);
  }

  function _makePrimerMesh() {
    var geo  = new THREE.SphereGeometry(0.06, 8, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
    return new THREE.Mesh(geo, mat);
  }

  function _meshForType(type) {
    if (type === 'GUNPOWDER') return _makeGunpowderMesh();
    if (type === 'BRASS')     return _makeBrassMesh();
    if (type === 'PRIMER')    return _makePrimerMesh();
    return _makeGunpowderMesh();
  }

  /* ─── spawn ──────────────────────────────────────────────────────────────*/
  function _spawnPickup(type, x, y, z) {
    var sc = _getScene();
    if (!sc) return;
    var mesh = _meshForType(type);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    sc.add(mesh);
    _pickups.push({ mesh: mesh, type: type, baseY: y, phase: Math.random() * Math.PI * 2 });
  }

  function _spawnLevel() {
    /* spread pickups in a 20×20 area centred on origin */
    var i, x, z;
    for (i = 0; i < MAT.GUNPOWDER.perLevel; i++) {
      x = (Math.random() - 0.5) * 20;
      z = (Math.random() - 0.5) * 20;
      _spawnPickup('GUNPOWDER', x, 0.5, z);
    }
    for (i = 0; i < MAT.BRASS.perLevel; i++) {
      x = (Math.random() - 0.5) * 20;
      z = (Math.random() - 0.5) * 20;
      _spawnPickup('BRASS', x, 0.5, z);
    }
    for (i = 0; i < MAT.PRIMER.perLevel; i++) {
      x = (Math.random() - 0.5) * 20;
      z = (Math.random() - 0.5) * 20;
      _spawnPickup('PRIMER', x, 0.5, z);
    }
  }

  /* ─── proximity collection ───────────────────────────────────────────── */
  function _checkCollect() {
    var cam = _getCamera();
    if (!cam) return;
    var sc  = _getScene();
    var px  = cam.position.x;
    var py  = cam.position.y;
    var pz  = cam.position.z;
    var remaining = [];
    var i, p, dx, dy, dz, d2, key;
    for (i = 0; i < _pickups.length; i++) {
      p  = _pickups[i];
      dx = p.mesh.position.x - px;
      dy = p.mesh.position.y - py;
      dz = p.mesh.position.z - pz;
      d2 = dx*dx + dy*dy + dz*dz;
      if (d2 <= COLLECT_DIST_SQ) {
        key = MAT[p.type].key;
        window._craftingMaterials[key] += 1;
        if (sc) sc.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _updateHUD();
        _showToast('PICKED UP ' + p.type);
      } else {
        remaining.push(p);
      }
    }
    _pickups = remaining;
  }

  /* ─── audio ──────────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { _audioCtx = new AC(); } catch(e) { return null; }
    return _audioCtx;
  }

  function _playHammerClick() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc   = ctx.createOscillator();
      var gain  = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch(e) { /* ignore audio errors */ }
  }

  /* ─── HUD ────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'ammo-crafter-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:48px',
      'right:16px',
      'color:#e8d080',
      'font-family:monospace',
      'font-size:11px',
      'font-weight:bold',
      'letter-spacing:0.5px',
      'text-shadow:1px 1px 2px rgba(0,0,0,0.9)',
      'pointer-events:none',
      'z-index:800',
      'white-space:nowrap',
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var m = window._craftingMaterials;
    _hudEl.textContent = 'GP:' + m.gunpowder + ' BR:' + m.brass + ' PR:' + m.primer;
  }

  /* ─── toast ──────────────────────────────────────────────────────────── */
  function _buildToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'ammo-crafter-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:#f0e060',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'letter-spacing:1px',
      'padding:8px 20px',
      'border:1px solid #b0a040',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:1100',
      'display:none',
    ].join(';');
    document.body.appendChild(_toastEl);
  }

  function _showToast(msg) {
    if (!_toastEl) _buildToast();
    _toastEl.textContent = msg;
    _toastEl.style.display = 'block';
    _toastTimer = 2.2;
  }

  /* ─── craft progress bar ─────────────────────────────────────────────── */
  function _buildCraftBar() {
    if (_craftWrapEl) return;
    _craftWrapEl = document.createElement('div');
    _craftWrapEl.id = 'ammo-crafter-bar-wrap';
    _craftWrapEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:220px',
      'pointer-events:none',
      'z-index:900',
      'display:none',
    ].join(';');

    _craftLabelEl = document.createElement('div');
    _craftLabelEl.style.cssText = [
      'color:#f0e060',
      'font-family:monospace',
      'font-size:12px',
      'text-align:center',
      'margin-bottom:4px',
      'text-shadow:1px 1px 3px #000',
    ].join(';');
    _craftLabelEl.textContent = 'CRAFTING…';

    var track = document.createElement('div');
    track.style.cssText = [
      'background:rgba(0,0,0,0.6)',
      'border:1px solid #888',
      'border-radius:3px',
      'height:10px',
      'overflow:hidden',
    ].join(';');

    _craftBarEl = document.createElement('div');
    _craftBarEl.style.cssText = [
      'background:#c8a020',
      'height:100%',
      'width:0%',
      'transition:none',
    ].join(';');

    track.appendChild(_craftBarEl);
    _craftWrapEl.appendChild(_craftLabelEl);
    _craftWrapEl.appendChild(track);
    document.body.appendChild(_craftWrapEl);
  }

  /* ─── craft menu ─────────────────────────────────────────────────────── */
  function _buildMenu() {
    if (_menuEl) return;
    _menuEl = document.createElement('div');
    _menuEl.id = 'ammo-crafter-menu';
    _menuEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,10,10,0.92)',
      'border:1px solid #6a5a20',
      'border-radius:6px',
      'padding:18px 28px',
      'color:#e8d080',
      'font-family:monospace',
      'font-size:13px',
      'z-index:1200',
      'min-width:340px',
      'display:none',
    ].join(';');
    document.body.appendChild(_menuEl);
  }

  function _renderMenu() {
    if (!_menuEl) return;
    var m   = window._craftingMaterials;
    var html = '<div style="font-size:15px;font-weight:bold;margin-bottom:10px;color:#f0e060;">✦ AMMO CRAFTING MENU ✦</div>';
    html += '<div style="margin-bottom:8px;color:#aaa;font-size:11px;">Materials: GP:' + m.gunpowder + '  BR:' + m.brass + '  PR:' + m.primer + '</div>';
    html += '<div style="margin-bottom:8px;color:#888;font-size:11px;">↑/↓ select   ENTER craft   C close</div>';
    var i, r, canAfford, costStr, parts;
    for (i = 0; i < RECIPES.length; i++) {
      r = RECIPES[i];
      canAfford = _canAfford(r);
      parts = [];
      if (r.cost.gunpowder) parts.push(r.cost.gunpowder + 'GP');
      if (r.cost.brass)     parts.push(r.cost.brass + 'BR');
      if (r.cost.primer)    parts.push(r.cost.primer + 'PR');
      costStr = parts.join(' + ');
      html += '<div style="';
      html += 'padding:5px 8px;';
      html += 'margin:2px 0;';
      html += 'border-radius:3px;';
      if (i === _menuSelected) {
        html += 'background:rgba(180,150,30,0.25);';
        html += 'border-left:3px solid #c8a020;';
        html += 'color:#fff;';
      } else {
        html += 'border-left:3px solid transparent;';
        html += 'color:' + (canAfford ? '#d8c060' : '#666') + ';';
      }
      html += '">';
      html += costStr + '  →  ' + r.name;
      html += '</div>';
    }
    _menuEl.innerHTML = html;
  }

  function _openMenu() {
    if (_crafting) return;
    _menuOpen = true;
    if (!_menuEl) _buildMenu();
    _menuEl.style.display = 'block';
    _renderMenu();
  }

  function _closeMenu() {
    _menuOpen = false;
    if (_menuEl) _menuEl.style.display = 'none';
  }

  function _canAfford(recipe) {
    var m = window._craftingMaterials;
    return (
      m.gunpowder >= recipe.cost.gunpowder &&
      m.brass     >= recipe.cost.brass     &&
      m.primer    >= recipe.cost.primer
    );
  }

  function _onKey(e) {
    var key = e.key || e.keyCode;
    /* C toggles craft menu (not bound by other systems) */
    if (key === 'c' || key === 'C') {
      if (_menuOpen) { _closeMenu(); } else { _openMenu(); }
      return;
    }
    if (!_menuOpen) return;
    if (key === 'ArrowUp' || key === 38) {
      _menuSelected = (_menuSelected - 1 + RECIPES.length) % RECIPES.length;
      _renderMenu();
      e.preventDefault();
    } else if (key === 'ArrowDown' || key === 40) {
      _menuSelected = (_menuSelected + 1) % RECIPES.length;
      _renderMenu();
      e.preventDefault();
    } else if (key === 'Enter' || key === 13) {
      _startCraft(_menuSelected);
      e.preventDefault();
    }
  }

  /* ─── crafting logic ─────────────────────────────────────────────────── */
  function _startCraft(recipeIndex) {
    if (_crafting) return;
    var r = RECIPES[recipeIndex];
    if (!r) return;
    if (!_canAfford(r)) {
      _showToast('NOT ENOUGH MATERIALS');
      return;
    }
    /* deduct materials */
    var m = window._craftingMaterials;
    m.gunpowder -= r.cost.gunpowder;
    m.brass     -= r.cost.brass;
    m.primer    -= r.cost.primer;
    _updateHUD();

    _craftRecipe  = r;
    _craftTimer   = 0;
    _crafting     = true;

    _closeMenu();

    if (!_craftWrapEl) _buildCraftBar();
    _craftLabelEl.textContent = 'CRAFTING ' + r.name + '…';
    _craftBarEl.style.width = '0%';
    _craftWrapEl.style.display = 'block';
  }

  /* Public craft() — lets external code trigger crafting */
  function craft(recipeIndex) {
    _startCraft(recipeIndex);
  }

  /* ─── update tick ────────────────────────────────────────────────────── */
  function update(dt) {
    if (!dt || isNaN(dt)) dt = 0.016;
    _time += dt;

    /* animate pickups */
    var i, p;
    for (i = 0; i < _pickups.length; i++) {
      p = _pickups[i];
      p.mesh.position.y = p.baseY + Math.sin(_time * BOB_SPEED + p.phase) * BOB_RANGE;
      p.mesh.rotation.y += ROTATE_SPEED * dt;
    }

    /* proximity collect */
    _checkCollect();

    /* crafting progress */
    if (_crafting) {
      _craftTimer += dt;

      /* hammering sound: click every ~0.4s */
      if (Math.floor(_craftTimer / 0.4) > Math.floor((_craftTimer - dt) / 0.4)) {
        _playHammerClick();
      }

      var pct = Math.min(_craftTimer / _craftDuration, 1);
      if (_craftBarEl) _craftBarEl.style.width = Math.round(pct * 100) + '%';

      if (_craftTimer >= _craftDuration) {
        /* complete */
        _crafting = false;
        if (_craftWrapEl) _craftWrapEl.style.display = 'none';
        var gm = window.GameManager || null;
        _craftRecipe.give(gm);
        _showToast('CRAFTED: ' + _craftRecipe.name);
        _craftRecipe = null;
      }
    }

    /* toast fade */
    if (_toastTimer > 0) {
      _toastTimer -= dt;
      if (_toastTimer <= 0 && _toastEl) {
        _toastEl.style.display = 'none';
      }
    }
  }

  /* ─── init ───────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    _buildHUD();
    _buildToast();
    _buildCraftBar();
    _buildMenu();

    document.addEventListener('keydown', _onKey, false);

    _spawnLevel();
  }

  /* ─── reset ──────────────────────────────────────────────────────────── */
  function reset() {
    var sc = _getScene();
    var i;
    for (i = 0; i < _pickups.length; i++) {
      if (sc) sc.remove(_pickups[i].mesh);
      _pickups[i].mesh.geometry.dispose();
      _pickups[i].mesh.material.dispose();
    }
    _pickups = [];
    _crafting     = false;
    _craftTimer   = 0;
    _craftRecipe  = null;
    if (_craftWrapEl) _craftWrapEl.style.display = 'none';
    _closeMenu();
    /* NOTE: _craftingMaterials intentionally NOT cleared so resources persist */
    _spawnLevel();
    _updateHUD();
  }

  /* ─── public API ─────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    craft:  craft,
    reset:  reset,
  };

}());
