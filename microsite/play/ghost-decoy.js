// ghost-decoy.js — Inflatable Soldier Decoy feature module
// Key: Ctrl+G — deploy inflatable dummy at player position
// Decoy attracts nearby enemies for 8s, then deflates
// Max 2 active, 30s cooldown
// Exposes: window.GhostDecoy, window._activeDecoys
window.GhostDecoy = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────
  var MAX_DECOYS       = 2;
  var COOLDOWN_SEC     = 30;
  var ATTRACT_RADIUS   = 15;     // units — enemies within this range get redirected
  var ATTRACT_DURATION = 8;      // seconds decoy lures enemies
  var DEFLATE_SPEED    = 1.8;    // scale.y lerp speed when popping
  var DECOY_HEALTH     = 30;     // HP before pop triggered by damage
  var WOBBLE_SPEED     = 0.02;   // radians per second (rotation.y)
  var SEE_THROUGH_DIST = 2.5;    // units — enemy gets this close and sees through decoy
  var TOAST_DURATION   = 2500;   // ms

  // Enemy uniform colors to trick enemies
  var ENEMY_COLORS = [
    0x4a5240,  // Russian EMR digital flora dark
    0x5a6350,  // Russian EMR mid-tone
    0x3d4535,  // Russian EMR shadow
    0x6b7260,  // FSB grey-green
    0x4c5c44   // Wagner olive
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene      = null;
  var _camera     = null;
  var _playerRef  = null;   // reference to player object (position)
  var _cooldownT  = 0;      // seconds remaining on cooldown
  var _keyBound   = false;
  var _hudEl      = null;
  var _toastEl    = null;
  var _toastTimer = null;

  // Shared globals
  window._activeDecoys = [];

  // ── HUD & Toast ──────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'ghost-decoy-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:450px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#88ffcc',
      'font-size:10px',
      'font-family:monospace',
      'z-index:200',
      'pointer-events:none',
      'background:rgba(0,0,0,0.4)',
      'padding:2px 8px',
      'border-radius:3px',
      'border:1px solid rgba(136,255,204,0.3)',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _ensureToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'ghost-decoy-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:35%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#88ffcc',
      'font-size:16px',
      'font-weight:bold',
      'font-family:monospace',
      'z-index:400',
      'pointer-events:none',
      'background:rgba(0,40,20,0.85)',
      'padding:6px 22px',
      'border-radius:6px',
      'border:1px solid #44cc88',
      'letter-spacing:2px',
      'text-shadow:0 0 10px #44cc88',
      'display:none',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(_toastEl);
  }

  function _showToast(msg) {
    _ensureToast();
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastEl.textContent = msg;
    _toastEl.style.display  = 'block';
    _toastEl.style.opacity  = '1';
    _toastTimer = setTimeout(function () {
      _toastEl.style.opacity = '0';
      setTimeout(function () { _toastEl.style.display = 'none'; }, 320);
    }, TOAST_DURATION);
  }

  function _updateHUD() {
    _ensureHUD();
    var count = window._activeDecoys.length;
    if (count === 0 && _cooldownT <= 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var cdStr = _cooldownT > 0 ? (' CD:' + Math.ceil(_cooldownT) + 's') : '';
    _hudEl.textContent = 'DECOY ' + count + '/' + MAX_DECOYS + cdStr + ' [Ctrl+G]';
  }

  // ── Pop sound (filtered noise via Web Audio API) ─────────────────────────
  function _playPopSound() {
    var ctx = null;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    var bufferSize = ctx.sampleRate * 0.2; // 0.2s
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data   = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    var source  = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass filter to give an "air release" hiss
    var filter  = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.8;

    var gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.55, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
    source.onended = function () {
      try { ctx.close(); } catch (ex) { /* ignore */ }
    };
  }

  // ── Build decoy mesh (BoxGeometry soldier shape, transparent) ────────────
  function _buildDecoyMesh() {
    var group   = new THREE.Group();
    var color   = ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
    var matOpts = { color: color, transparent: true, opacity: 0.7 };
    var mat     = new THREE.MeshLambertMaterial(matOpts);

    // Body / torso
    var torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    var torso    = new THREE.Mesh(torsoGeo, mat);
    torso.position.y = 1.0;
    group.add(torso);

    // Head
    var headMat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.7 });
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.6;
    group.add(head);

    // Left arm
    var armMat  = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.7 });
    var armGeo  = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    var lArm    = new THREE.Mesh(armGeo, armMat);
    lArm.position.set(-0.42, 1.0, 0);
    group.add(lArm);

    // Right arm
    var rArm = new THREE.Mesh(armGeo, armMat);
    rArm.position.set(0.42, 1.0, 0);
    group.add(rArm);

    // Left leg
    var legMat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.7 });
    var legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
    var lLeg   = new THREE.Mesh(legGeo, legMat);
    lLeg.position.set(-0.18, 0.35, 0);
    group.add(lLeg);

    // Right leg
    var rLeg = new THREE.Mesh(legGeo, legMat);
    rLeg.position.set(0.18, 0.35, 0);
    group.add(rLeg);

    return group;
  }

  // ── Deploy a decoy at the given world position ───────────────────────────
  function _spawnDecoy(pos) {
    if (!_scene) return;

    var mesh = _buildDecoyMesh();
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    _scene.add(mesh);

    var decoy = {
      mesh:         mesh,
      hp:           DECOY_HEALTH,
      attractTimer: ATTRACT_DURATION,   // seconds remaining luring enemies
      popping:      false,
      dead:         false,
      spawnTime:    performance.now()
    };

    window._activeDecoys.push(decoy);
    return decoy;
  }

  // ── Pop a specific decoy (deflate + sound) ───────────────────────────────
  function _triggerPop(decoy) {
    if (decoy.popping || decoy.dead) return;
    decoy.popping = true;
    _playPopSound();
    // Deflation handled in update() via scale.y lerp to 0
  }

  // ── Remove a dead decoy from scene and array ─────────────────────────────
  function _removeDecoy(decoy, idx) {
    if (_scene && decoy.mesh) {
      decoy.mesh.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      _scene.remove(decoy.mesh);
    }
    decoy.dead = true;
    window._activeDecoys.splice(idx, 1);
  }

  // ── Redirect nearby enemies toward a decoy ───────────────────────────────
  function _attractEnemies(decoy) {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    var all    = window.Enemies.getAll();
    var dpos   = decoy.mesh.position;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh) continue;
      var dx   = dpos.x - e.mesh.position.x;
      var dz   = dpos.z - e.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= ATTRACT_RADIUS) {
        // Tag the enemy with the decoy target so the enemy update loop can read it
        e._decoyTarget    = dpos;
        e._decoyLureTimer = ATTRACT_DURATION;
        // Force them into combat / spotted mode so they move
        if (e._patrolState !== undefined) e._patrolState = 'combat';
        if (e._detectedPlayer !== undefined) e._detectedPlayer = true;
        e.playerSpotted = true;
      }
    }
  }

  // ── Check if enemy gets close enough to see through the decoy ────────────
  function _checkSeeThrough(decoy) {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    var all  = window.Enemies.getAll();
    var dpos = decoy.mesh.position;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (e._decoyTarget !== dpos) continue;
      var dx   = dpos.x - e.mesh.position.x;
      var dz   = dpos.z - e.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < SEE_THROUGH_DIST) {
        // Enemy figured it out — clear the decoy override
        e._decoyTarget    = null;
        e._decoyLureTimer = 0;
      }
    }
  }

  // ── Key binding (Ctrl+G) ─────────────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (ev) {
      if (ev.code === 'KeyG' && ev.ctrlKey && !ev.altKey && !ev.repeat) {
        ev.preventDefault();
        ev.stopPropagation();
        deploy();
      }
    }, true);
  }

  // ── Get player world position ─────────────────────────────────────────────
  function _getPlayerPos() {
    // Try various globals the game uses for the player position
    if (_playerRef && _playerRef.position) return _playerRef.position;
    if (window.player && window.player.position) return window.player.position;
    if (_camera) return _camera.position;
    return null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * init(scene, camera, playerRef?)
   * Call once after Three.js scene is ready.
   */
  function init(scene, camera, playerRef) {
    _scene     = scene;
    _camera    = camera;
    _playerRef = playerRef || null;
    _cooldownT = 0;
    window._activeDecoys = [];
    _ensureHUD();
    _ensureToast();
    _updateHUD();
    _bindKey();
  }

  /**
   * deploy()
   * Place a decoy at the player's current position (called by Ctrl+G).
   */
  function deploy() {
    if (_cooldownT > 0) {
      _showToast('DECOY ON COOLDOWN (' + Math.ceil(_cooldownT) + 's)');
      return;
    }
    if (window._activeDecoys.length >= MAX_DECOYS) {
      _showToast('MAX DECOYS ACTIVE');
      return;
    }
    var pos = _getPlayerPos();
    if (!pos) {
      _showToast('DECOY: NO POSITION');
      return;
    }

    _spawnDecoy(pos);
    _cooldownT = COOLDOWN_SEC;
    _showToast('DECOY DEPLOYED');
    _updateHUD();
  }

  /**
   * update(delta)
   * Call every animation frame with the elapsed seconds since last frame.
   */
  function update(delta) {
    // Tick cooldown
    if (_cooldownT > 0) {
      _cooldownT -= delta;
      if (_cooldownT < 0) _cooldownT = 0;
    }

    // Update each active decoy
    for (var i = window._activeDecoys.length - 1; i >= 0; i--) {
      var decoy = window._activeDecoys[i];
      if (!decoy || decoy.dead) {
        window._activeDecoys.splice(i, 1);
        continue;
      }

      if (decoy.popping) {
        // Deflate: lerp scale.y toward 0
        decoy.mesh.scale.y = Math.max(0, decoy.mesh.scale.y - DEFLATE_SPEED * delta);
        if (decoy.mesh.scale.y <= 0.01) {
          _removeDecoy(decoy, i);
        }
        continue;
      }

      // Wobble to seem alive
      decoy.mesh.rotation.y += WOBBLE_SPEED * delta * 60; // per-frame-rate-independent

      // Lure timer
      if (decoy.attractTimer > 0) {
        decoy.attractTimer -= delta;
        // Re-attract each second (attract fires on first entrance and refreshes)
        _attractEnemies(decoy);
        _checkSeeThrough(decoy);
      } else {
        // Timer expired — pop
        _triggerPop(decoy);
      }
    }

    _updateHUD();
  }

  /**
   * takeDamage(decoy, amount)
   * External modules (e.g. bullet hit detection) call this to damage a decoy.
   * If the decoy reference isn't known, call hitDecoyAt(position, amount).
   */
  function takeDamage(decoy, amount) {
    if (!decoy || decoy.popping || decoy.dead) return;
    decoy.hp -= amount;
    if (decoy.hp <= 0) {
      _triggerPop(decoy);
    }
  }

  /**
   * hitDecoyAt(worldPos, amount)
   * Convenience: find the nearest decoy to worldPos and apply damage.
   */
  function hitDecoyAt(worldPos, amount) {
    var best     = null;
    var bestDist = 3.0; // only hit if within 3 units
    for (var i = 0; i < window._activeDecoys.length; i++) {
      var d = window._activeDecoys[i];
      if (!d || d.dead || d.popping) continue;
      var dx   = d.mesh.position.x - worldPos.x;
      var dz   = d.mesh.position.z - worldPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) { bestDist = dist; best = d; }
    }
    if (best) takeDamage(best, amount);
  }

  /**
   * reset()
   * Clear all decoys and reset state (e.g. on wave end / stage change).
   */
  function reset() {
    for (var i = window._activeDecoys.length - 1; i >= 0; i--) {
      var d = window._activeDecoys[i];
      if (d && !d.dead) _removeDecoy(d, i);
    }
    window._activeDecoys = [];
    _cooldownT = 0;
    _updateHUD();
  }

  // ── Public surface ─────────────────────────────────────────────────────────
  return {
    init:       init,
    update:     update,
    deploy:     deploy,
    reset:      reset,
    takeDamage: takeDamage,
    hitDecoyAt: hitDecoyAt
  };

}());
