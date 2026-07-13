// laser-fence.js — Deployable electric tripwire laser fence system
// Key: Ctrl+L to place a fence post (max 4 posts per fence set, max 3 fence sets)
// All var — no let/const. IIFE pattern.
window.LaserFence = (function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────────────
  var MAX_SETS          = 3;        // max active fence sets simultaneously
  var MAX_POSTS_PER_SET = 4;        // posts per deploy session
  var BEAM_DAMAGE       = 45;       // damage on tripwire crossing
  var STUN_DURATION     = 2;        // seconds enemy is stunned
  var START_CHARGES     = 3;        // initial deploy charges
  var FLICKER_FRAMES    = 8;        // frames between opacity flicker
  var POST_RADIUS_TOP   = 0.06;
  var POST_RADIUS_BOT   = 0.08;
  var POST_HEIGHT       = 1.5;
  var POST_SEGMENTS     = 6;
  var BEAM_COLOR        = 0xFF0000;
  var POST_COLOR        = 0x2a2a2a;  // dark metal
  var CROSS_THRESHOLD   = 0.35;      // distance from beam segment to count as cross

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _sets         = [];     // array of fence sets [{posts:[], beams:[], hitEnemy:{}}]
  var _activeSet    = null;   // set currently being built
  var _charges      = START_CHARGES;
  var _keyBound     = false;
  var _hudEl        = null;
  var _frameCount   = 0;
  var _audioCtx     = null;
  var _crackleNode  = null;   // running oscillator for beam crackle

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene    = scene  || window._gameScene;
    _camera   = camera || window._camera;
    _sets     = [];
    _activeSet = null;
    _charges  = START_CHARGES;
    _frameCount = 0;
    window._laserFenceActive = false;
    _ensureHUD();
    _updateHUD();
    _bindKey();
    _spawnPickups();
  }

  // ── Key Binding (Ctrl+L) ───────────────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        deploy();
      }
    });
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('laserFenceHUD')) {
      _hudEl = document.getElementById('laserFenceHUD');
      return;
    }
    var el = document.createElement('div');
    el.id = 'laserFenceHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:140px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#ff2222',
      'text-shadow:0 0 6px #ff0000,0 0 2px #000',
      'background:rgba(0,0,0,0.50)',
      'padding:3px 8px',
      'border-radius:4px',
      'z-index:1000',
      'pointer-events:none',
      'user-select:none'
    ].join(';');
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _updateHUD() {
    if (!_hudEl) _hudEl = document.getElementById('laserFenceHUD');
    if (!_hudEl) return;
    _hudEl.textContent = '⚡ FENCE ×' + _charges;
  }

  // ── Fence post mesh ────────────────────────────────────────────────────────
  function _buildPostMesh(pos) {
    var geo = new THREE.CylinderGeometry(
      POST_RADIUS_TOP, POST_RADIUS_BOT, POST_HEIGHT, POST_SEGMENTS
    );
    var mat = new THREE.MeshLambertMaterial({ color: POST_COLOR });
    var mesh = new THREE.Mesh(geo, mat);
    // Plant base in ground (y=0), top of post at POST_HEIGHT
    mesh.position.set(pos.x, POST_HEIGHT / 2, pos.z);
    return mesh;
  }

  // ── Beam (THREE.Line) between two post tops ────────────────────────────────
  function _buildBeam(postA, postB) {
    var pa = postA.position.clone();
    var pb = postB.position.clone();
    // Connect at top of posts
    pa.y = POST_HEIGHT;
    pb.y = POST_HEIGHT;
    var points = [pa, pb];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({
      color: BEAM_COLOR,
      linewidth: 2,
      transparent: true,
      opacity: 1.0
    });
    var line = new THREE.Line(geo, mat);
    return line;
  }

  // ── Rebuild beams for a fence set ─────────────────────────────────────────
  function _rebuildBeams(set) {
    var i;
    // Remove old beams
    for (i = 0; i < set.beams.length; i++) {
      _scene.remove(set.beams[i]);
    }
    set.beams = [];

    // Connect posts in sequence: 0-1, 1-2, 2-3
    for (i = 0; i < set.posts.length - 1; i++) {
      var beam = _buildBeam(set.posts[i], set.posts[i + 1]);
      _scene.add(beam);
      set.beams.push(beam);
    }
  }

  // ── Deploy: place a post at player position ────────────────────────────────
  function deploy() {
    if (!_scene || !_camera) return;
    if (_charges <= 0) {
      _flashHUD('No fence kits! Find a pickup.');
      return;
    }

    // Start a new set if needed
    if (!_activeSet || _activeSet.posts.length >= MAX_POSTS_PER_SET) {
      // Enforce max sets limit — remove oldest
      if (_sets.length >= MAX_SETS) {
        _removeFenceSet(_sets[0]);
        _sets.shift();
      }
      _activeSet = { posts: [], beams: [], hitEnemy: {} };
      _sets.push(_activeSet);
    }

    var pos = _camera.position.clone();
    var postMesh = _buildPostMesh(pos);
    _scene.add(postMesh);
    _activeSet.posts.push(postMesh);

    // Rebuild beams whenever we have 2+ posts
    if (_activeSet.posts.length >= 2) {
      _rebuildBeams(_activeSet);
    }

    _charges--;
    _updateHUD();
    window._laserFenceActive = (_sets.length > 0);

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('Fence post placed (' + _activeSet.posts.length + '/' + MAX_POSTS_PER_SET + ')');
    }

    _startCrackleLoop();

    // If we just placed the last post of this set, close it out
    if (_activeSet.posts.length >= MAX_POSTS_PER_SET) {
      _activeSet = null;
    }
  }

  // ── Remove a full fence set ────────────────────────────────────────────────
  function _removeFenceSet(set) {
    var i;
    for (i = 0; i < set.posts.length; i++) {
      _scene.remove(set.posts[i]);
    }
    for (i = 0; i < set.beams.length; i++) {
      _scene.remove(set.beams[i]);
    }
    set.posts = [];
    set.beams = [];
  }

  // ── Audio: crackling loop ──────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        _audioCtx = null;
      }
    }
    return _audioCtx;
  }

  function _startCrackleLoop() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    if (_crackleNode) return; // already running
    try {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);

      var lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(40, ctx.currentTime);

      var lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(50, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      lfo.start(ctx.currentTime);
      osc.start(ctx.currentTime);

      _crackleNode = { osc: osc, lfo: lfo, gain: gainNode };
    } catch (e) {
      // Audio unavailable — silent fallback
    }
  }

  function _stopCrackleLoop() {
    if (!_crackleNode) return;
    try {
      _crackleNode.osc.stop();
      _crackleNode.lfo.stop();
    } catch (e) {}
    _crackleNode = null;
  }

  function _playZapSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);

      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  // ── HUD flash helper ───────────────────────────────────────────────────────
  function _flashHUD(msg) {
    if (!_hudEl) return;
    var prev = _hudEl.textContent;
    _hudEl.textContent = msg;
    _hudEl.style.color = '#ff8800';
    setTimeout(function () {
      _hudEl.style.color = '#ff2222';
      _updateHUD();
    }, 1400);
  }

  // ── Line segment / point distance for tripwire detection ───────────────────
  // Returns the closest distance from point P to segment AB
  function _distPointToSegment(P, A, B) {
    var AB = new THREE.Vector3().subVectors(B, A);
    var AP = new THREE.Vector3().subVectors(P, A);
    var lenSq = AB.dot(AB);
    if (lenSq === 0) return P.distanceTo(A);
    var t = Math.max(0, Math.min(1, AP.dot(AB) / lenSq));
    var closest = new THREE.Vector3(
      A.x + t * AB.x,
      A.y + t * AB.y,
      A.z + t * AB.z
    );
    return P.distanceTo(closest);
  }

  // ── Get enemies ────────────────────────────────────────────────────────────
  function _getEnemies() {
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      return window.Enemies.getAll();
    }
    if (window._enemies && Array.isArray(window._enemies)) return window._enemies;
    return [];
  }

  // ── Update (called each frame) ─────────────────────────────────────────────
  function update(delta) {
    if (!_scene) return;
    _frameCount++;

    var hasFences = false;
    var i, j, k, set, beam, enemy, mesh, enemyPos, pa, pb, dist;
    var enemies = _getEnemies();

    for (i = 0; i < _sets.length; i++) {
      set = _sets[i];
      if (set.beams.length === 0) continue;
      hasFences = true;

      // ── Flicker beams ────────────────────────────────────────────────────
      var flickOp = ((_frameCount % (FLICKER_FRAMES * 2)) < FLICKER_FRAMES) ? 1.0 : 0.6;
      for (k = 0; k < set.beams.length; k++) {
        set.beams[k].material.opacity = flickOp;
      }

      // ── Tripwire detection ───────────────────────────────────────────────
      for (j = 0; j < enemies.length; j++) {
        enemy = enemies[j];
        if (!enemy || enemy._dead) continue;

        mesh = enemy.mesh || enemy.group || enemy.object3D;
        if (!mesh) continue;

        // Check stun timer — decrement if needed
        if (enemy.stunned && enemy.stunTimer > 0) {
          enemy.stunTimer -= delta;
          if (enemy.stunTimer <= 0) {
            enemy.stunned  = false;
            enemy.stunTimer = 0;
          }
          continue; // already stunned — skip crossing check
        }

        enemyPos = mesh.position;

        // Check each beam segment
        for (k = 0; k < set.beams.length; k++) {
          beam = set.beams[k];

          // Get the two endpoints from geometry
          var posAttr = beam.geometry.attributes.position;
          pa = new THREE.Vector3(
            posAttr.getX(0), posAttr.getY(0), posAttr.getZ(0)
          );
          pb = new THREE.Vector3(
            posAttr.getX(1), posAttr.getY(1), posAttr.getZ(1)
          );

          dist = _distPointToSegment(enemyPos, pa, pb);

          if (dist <= CROSS_THRESHOLD) {
            // Tripwire triggered — avoid re-triggering same enemy on same set
            var hitKey = 'e' + (enemy._id || j) + 's' + i;
            if (set.hitEnemy[hitKey]) continue;
            set.hitEnemy[hitKey] = true;

            // Apply damage
            if (typeof enemy.hp === 'number') {
              enemy.hp -= BEAM_DAMAGE;
            } else if (typeof enemy.health === 'number') {
              enemy.health -= BEAM_DAMAGE;
            }

            // Stun
            enemy.stunned   = true;
            enemy.stunTimer = STUN_DURATION;

            // Audio zap
            _playZapSound();

            // HUD toast
            if (window.HUD && window.HUD.showToast) {
              window.HUD.showToast('FENCE ZAP! Enemy stunned!');
            }

            // Clear hit key after stun wears off so fence can trigger again
            (function (key, obj) {
              setTimeout(function () { delete obj[key]; }, STUN_DURATION * 1000 + 200);
            })(hitKey, set.hitEnemy);

            break; // one beam trigger per enemy per frame
          }
        }
      }
    }

    window._laserFenceActive = hasFences;

    // Stop crackle if no beams exist
    if (!hasFences && _crackleNode) {
      _stopCrackleLoop();
    }
  }

  // ── Pickup spawning (fence kit ground pickups) ─────────────────────────────
  function _spawnPickups() {
    // Register with window._pickupItems if available
    if (!window._pickupItems) return;

    var positions = [
      new THREE.Vector3(  8, 0,  5),
      new THREE.Vector3(-12, 0,  9),
      new THREE.Vector3(  3, 0, -14),
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      (function (pos) {
        var geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        var mat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var box = new THREE.Mesh(geo, mat);
        box.position.copy(pos);
        box.position.y = 0.175;
        if (_scene) _scene.add(box);

        var item = {
          mesh: box,
          label: 'FENCE KIT',
          onPickup: function () {
            _charges++;
            _updateHUD();
            if (_scene) _scene.remove(box);
            if (window.HUD && window.HUD.showToast) {
              window.HUD.showToast('Picked up Fence Kit! (⚡ ' + _charges + ' charges)');
            }
          }
        };
        window._pickupItems.push(item);
      })(positions[i]);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    var i;
    for (i = 0; i < _sets.length; i++) {
      _removeFenceSet(_sets[i]);
    }
    _sets      = [];
    _activeSet = null;
    _charges   = START_CHARGES;
    _frameCount = 0;
    _stopCrackleLoop();
    window._laserFenceActive = false;
    _updateHUD();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    deploy: deploy,
    reset:  reset
  };

})();
