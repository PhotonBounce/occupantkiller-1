// intel-pickups.js — Mission intelligence document pickups
// Collectible glowing document pickups scattered across levels.
// Standalone, self-initializing. Call IntelPickups.spawnForLevel(levelId, scene) to populate.

window.IntelPickups = (function() {

  var INTEL_MESSAGES = [
    { title: 'COMMS INTERCEPT', body: 'Enemy mortar battery repositioning to grid ref 47-Delta. Fire support requested.' },
    { title: 'TROOP MOVEMENTS', body: 'Battalion-sized element moving south from Belgorod. ETA 4 hours.' },
    { title: 'SUPPLY MANIFEST', body: 'Fuel depot at Kremlin coordinate holds 2 weeks of diesel reserves.' },
    { title: 'COMMAND ORDER', body: 'General Surovikin orders aerial bombardment of civilian corridors to deny retreat.' },
    { title: 'DECODED SIGNAL', body: 'Encrypted channel reveals coordinates of hidden ammunition cache under bridge.' },
    { title: 'INFORMANT REPORT', body: 'Local contact confirms 200 soldiers in the church basement. Do not engage front.' },
    { title: 'WAR CRIME DOSSIER', body: 'Satellite imagery confirms mass graves at GPS coordinates 49.23N, 37.45E.' },
    { title: 'ENEMY ORDERS', body: 'Scorched earth protocol authorized. All infrastructure to be destroyed on retreat.' },
    { title: 'MEDICAL SUPPLY LIST', body: 'Field hospital is out of blood plasma. Request priority resupply.' },
    { title: 'PRISONER MANIFEST', body: 'Ukrainian POWs held at compound north of grid 12-Charlie. Condition unknown.' },
    { title: 'ARTILLERY LOG', body: 'S-300 battery expended 60% of missiles. Reload convoy due midnight.' },
    { title: 'FINANCIAL TRACE', body: 'Funds trace to Kremlin accounts via Cyprus shell companies. Evidence preserved.' },
    { title: 'MERCENARY CONTRACT', body: 'Wagner Group contracted for "cleanup" operations. Payment: 120M rubles.' },
    { title: 'DISINFORMATION SCRIPT', body: 'RT scripts confirm: deny all atrocities, blame Kyiv for civilian deaths.' },
    { title: 'NUCLEAR STATUS', body: 'ICBM maintenance complete. Alert level raised to DEFCON 3 equivalent.' },
    { title: 'INTERCEPTED EMAIL', body: 'Oligarch orders evacuation of family to Dubai. Assets already transferred.' },
    { title: 'LOGISTICS REPORT', body: 'T-72 main battle tanks running on 3-day fuel reserves. Replenishment critical.' },
    { title: 'PROPAGANDA ORDER', body: 'All Z symbols mandatory on vehicles. Media to show only victorious footage.' },
    { title: 'CHEMICAL REPORT', body: 'Chlorine compound stocks moved to forward position. UN inspectors denied access.' },
    { title: 'SATELLITE DATA', body: 'Aerial recon confirms enemy HQ at 49.1N 36.2E. Strike window: 03:00-05:00.' },
  ];

  // Per-level hardcoded spawn positions [x, z] (Y is always 0.8)
  var LEVEL_POSITIONS = {
    1:  [[-12, -18], [8, 22], [-5, 5], [20, -10]],
    2:  [[-20, -15], [15, 10], [0, -25], [-8, 18], [25, -5]],
    3:  [[10, -20], [-18, 8], [5, 15], [-25, -10]],
    4:  [[-10, 20], [18, -15], [-5, -5], [12, 10], [-22, -20]],
    5:  [[0, -18], [-15, 12], [20, 5], [-8, -22]],
    6:  [[15, -10], [-20, 15], [5, 25], [-12, -5]],
    7:  [[-18, -20], [10, 15], [-5, 8], [22, -18], [0, 5]],
    8:  [[8, -15], [-15, 20], [20, 10], [-10, -8]],
    9:  [[-22, 10], [12, -20], [0, 15], [18, 5]],
    10: [[15, 20], [-10, -15], [5, -8], [-20, 12], [8, -25]],
    11: [[-12, 15], [20, -10], [-5, 22], [10, 8]],
    12: [[0, -20], [-18, 5], [15, 15], [-8, -12], [22, 10]],
    13: [[-15, -8], [10, 20], [-22, 15], [5, -15]],
    14: [[18, -12], [-10, 8], [0, -22], [-20, -5], [12, 18]],
    15: [[-8, 20], [15, -18], [-18, -10], [5, 12]],
    16: [[10, -5], [-15, 15], [20, 20], [-5, -20], [0, 10]],
  };

  var _pickups = [];      // active pickup objects
  var _collected = 0;
  var _total = 0;
  var _scene = null;
  var _intelOverlay = null;
  var _dismissTimer = null;
  var _audioCtx = null;
  var _time = 0;
  var _counterEl = null;

  // ---- audio helpers ----

  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    if (typeof AudioContext !== 'undefined') {
      _audioCtx = new AudioContext();
    } else if (typeof webkitAudioContext !== 'undefined') {
      _audioCtx = new webkitAudioContext(); // eslint-disable-line
    }
    return _audioCtx;
  }

  function _playCollectSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    // Paper rustle: bandpass noise burst
    var bufSize = ctx.sampleRate * 0.2;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buf;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 300;
    bp.Q.value = 1.5;
    var gainN = ctx.createGain();
    gainN.gain.value = 0.18;
    noise.connect(bp);
    bp.connect(gainN);
    gainN.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.2);

    // Mission blip: 800Hz sine
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;
    var gainB = ctx.createGain();
    gainB.gain.setValueAtTime(0.25, ctx.currentTime + 0.05);
    gainB.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gainB);
    gainB.connect(ctx.destination);
    osc.start(ctx.currentTime + 0.05);
    osc.stop(ctx.currentTime + 0.15);
  }

  // ---- HUD counter ----

  function _ensureCounter() {
    if (document.getElementById('intelCounter')) {
      _counterEl = document.getElementById('intelCounter');
      return;
    }
    _counterEl = document.createElement('div');
    _counterEl.id = 'intelCounter';
    _counterEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'z-index:800',
      'font-family:monospace',
      'font-size:13px',
      'color:#e0d8b0',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 9px',
      'border-radius:3px',
      'border:1px solid #5a5030',
      'pointer-events:none',
      'user-select:none',
    ].join(';');
    document.body.appendChild(_counterEl);
  }

  function _updateCounter() {
    if (!_counterEl) _ensureCounter();
    if (!_counterEl) return;
    if (_total === 0) {
      _counterEl.style.display = 'none';
      return;
    }
    _counterEl.style.display = '';
    if (_collected >= _total) {
      _counterEl.style.color = '#ffd700';
      _counterEl.textContent = '📋 INTEL: ' + _collected + '/' + _total + ' ✓';
    } else {
      _counterEl.style.color = '#e0d8b0';
      _counterEl.textContent = '📋 INTEL: ' + _collected + '/' + _total;
    }
  }

  // ---- overlay popup ----

  function _showIntelPopup(msg) {
    _dismissIntelPopup();
    var overlay = document.createElement('div');
    overlay.id = 'intelOverlay';
    overlay.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:900',
      'background:#c8b97a',
      'border:3px double #7a6030',
      'box-shadow:0 0 0 6px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.2)',
      'padding:24px 32px',
      'min-width:320px',
      'max-width:480px',
      'font-family:"Courier New",Courier,monospace',
      'color:#1a1200',
      'text-align:center',
    ].join(';');

    var header = document.createElement('div');
    header.style.cssText = 'font-size:11px;letter-spacing:3px;color:#5a3a00;margin-bottom:6px;';
    header.textContent = '— CLASSIFIED —';

    var title = document.createElement('div');
    title.style.cssText = 'font-size:16px;font-weight:bold;letter-spacing:2px;margin-bottom:14px;border-bottom:1px solid #7a6030;padding-bottom:8px;color:#3a1a00;';
    title.textContent = '[INTEL ACQUIRED] — ' + msg.title;

    var body = document.createElement('div');
    body.style.cssText = 'font-size:13px;line-height:1.6;text-align:left;margin-bottom:18px;';
    body.textContent = msg.body;

    var btn = document.createElement('button');
    btn.textContent = 'CONTINUE ›';
    btn.style.cssText = [
      'background:#5a3a00',
      'color:#e0d090',
      'border:1px solid #c8a030',
      'font-family:"Courier New",Courier,monospace',
      'font-size:13px',
      'letter-spacing:2px',
      'padding:6px 20px',
      'cursor:pointer',
    ].join(';');
    btn.addEventListener('click', _dismissIntelPopup);

    overlay.appendChild(header);
    overlay.appendChild(title);
    overlay.appendChild(body);
    overlay.appendChild(btn);
    document.body.appendChild(overlay);
    _intelOverlay = overlay;

    _dismissTimer = setTimeout(_dismissIntelPopup, 5000);
  }

  function _dismissIntelPopup() {
    if (_dismissTimer) { clearTimeout(_dismissTimer); _dismissTimer = null; }
    if (_intelOverlay && _intelOverlay.parentNode) {
      _intelOverlay.parentNode.removeChild(_intelOverlay);
    }
    _intelOverlay = null;
  }

  // ---- mesh construction ----

  function _buildDocumentMesh() {
    if (typeof THREE === 'undefined') return null;

    var group = new THREE.Group();

    // Main paper body
    var paperGeo = new THREE.BoxGeometry(0.4, 0.5, 0.05);
    var paperMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e0 });
    var paperMesh = new THREE.Mesh(paperGeo, paperMat);
    group.add(paperMesh);

    // Gold frame strips (top, bottom, left, right)
    var goldMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    var frameThickness = 0.03;
    var frameDepth = 0.07;

    // Top strip
    var topGeo = new THREE.BoxGeometry(0.44, frameThickness, frameDepth);
    var topMesh = new THREE.Mesh(topGeo, goldMat);
    topMesh.position.set(0, 0.265, 0);
    group.add(topMesh);

    // Bottom strip
    var botGeo = new THREE.BoxGeometry(0.44, frameThickness, frameDepth);
    var botMesh = new THREE.Mesh(botGeo, goldMat);
    botMesh.position.set(0, -0.265, 0);
    group.add(botMesh);

    // Left strip
    var leftGeo = new THREE.BoxGeometry(frameThickness, 0.53, frameDepth);
    var leftMesh = new THREE.Mesh(leftGeo, goldMat);
    leftMesh.position.set(-0.215, 0, 0);
    group.add(leftMesh);

    // Right strip
    var rightGeo = new THREE.BoxGeometry(frameThickness, 0.53, frameDepth);
    var rightMesh = new THREE.Mesh(rightGeo, goldMat);
    rightMesh.position.set(0.215, 0, 0);
    group.add(rightMesh);

    // Glow point light
    var light = new THREE.PointLight(0xffdd88, 0.8, 4);
    light.position.set(0, 0, 0);
    group.add(light);

    return group;
  }

  // ---- seeded position generator ----

  function _seededPositions(levelId, count) {
    // Use levelId string char codes as a simple seed
    var seed = 0;
    var idStr = String(levelId);
    for (var ci = 0; ci < idStr.length; ci++) {
      seed += idStr.charCodeAt(ci) * (ci + 1);
    }
    var positions = [];
    for (var i = 0; i < count; i++) {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      var x = ((seed & 0xffff) / 0xffff - 0.5) * 60;
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      var z = ((seed & 0xffff) / 0xffff - 0.5) * 60;
      positions.push([x, z]);
    }
    return positions;
  }

  // ---- seeded message picker ----

  function _pickMessages(seed, count) {
    var indices = [];
    var pool = INTEL_MESSAGES.slice();
    var rng = seed;
    for (var i = 0; i < count && pool.length > 0; i++) {
      rng = (rng * 1664525 + 1013904223) & 0xffffffff;
      var idx = Math.abs(rng) % pool.length;
      indices.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return indices;
  }

  // ---- public API ----

  function spawnForLevel(levelId, scene) {
    clear(scene || _scene);
    if (!scene && !_scene) return;
    _scene = scene || _scene;
    if (typeof THREE === 'undefined') return;

    var positions = LEVEL_POSITIONS[levelId];
    if (!positions) {
      // Seeded fallback: 3-5 documents
      var idStr = String(levelId);
      var seedBase = 0;
      for (var ci = 0; ci < idStr.length; ci++) {
        seedBase += idStr.charCodeAt(ci) * (ci + 7);
      }
      var count = 3 + (Math.abs(seedBase) % 3); // 3, 4, or 5
      positions = _seededPositions(levelId, count);
    }

    // Pick messages (seeded so they're consistent per level)
    var msgSeed = 0;
    var idStr2 = String(levelId);
    for (var mci = 0; mci < idStr2.length; mci++) {
      msgSeed += idStr2.charCodeAt(mci) * (mci + 3);
    }
    var messages = _pickMessages(msgSeed, positions.length);

    _collected = 0;
    _total = positions.length;

    for (var pi = 0; pi < positions.length; pi++) {
      var pos = positions[pi];
      var mesh = _buildDocumentMesh();
      if (!mesh) continue;
      mesh.position.set(pos[0], 0.8, pos[1]);
      _scene.add(mesh);
      _pickups.push({
        mesh: mesh,
        message: messages[pi % messages.length],
        collected: false,
        baseY: 0.8,
        phase: pi * 1.1, // stagger bob phase
      });
    }

    _ensureCounter();
    _updateCounter();
  }

  function update(delta, playerPosition, player, scene) {
    if (!playerPosition) return;
    _time += delta;

    for (var i = 0; i < _pickups.length; i++) {
      var p = _pickups[i];
      if (p.collected) continue;

      // Bob animation
      p.mesh.position.y = p.baseY + Math.sin(_time * 1.5 * Math.PI * 2 + p.phase) * 0.3;
      // Slow Y rotation (0.8 rad/sec)
      p.mesh.rotation.y += 0.8 * delta;

      // Proximity check (1.8 unit range)
      var dx = playerPosition.x - p.mesh.position.x;
      var dz = playerPosition.z - p.mesh.position.z;
      var dist2 = dx * dx + dz * dz;
      if (dist2 <= 1.8 * 1.8) {
        _collect(p, player, scene);
      }
    }
  }

  function _collect(p, player, scene) {
    p.collected = true;
    _collected++;

    // Remove mesh from scene
    var sc = scene || _scene;
    if (sc && p.mesh) {
      sc.remove(p.mesh);
    }

    // Score bonus
    if (player && typeof player.score !== 'undefined') {
      player.score += 500;
    } else if (typeof window._score !== 'undefined') {
      window._score += 500;
    }
    // Also try game-manager score if exposed
    if (typeof window.addScore === 'function') {
      window.addScore(500);
    }

    // Sound
    _playCollectSound();

    // Show popup
    if (p.message) {
      _showIntelPopup(p.message);
    }

    // Update HUD
    _updateCounter();

    // Check all collected
    if (_collected >= _total && _total > 0) {
      _onAllCollected();
    }
  }

  function _onAllCollected() {
    _updateCounter();
    // Fire achievement if available
    if (typeof window.Achievements !== 'undefined' && Achievements.unlock) {
      Achievements.unlock('INTEL_COMPLETE');
    }
    // Brief flash on counter
    if (_counterEl) {
      _counterEl.style.color = '#ffd700';
      _counterEl.style.textShadow = '0 0 8px #ffd700';
      setTimeout(function() {
        if (_counterEl) _counterEl.style.textShadow = '';
      }, 1500);
    }
  }

  function clear(scene) {
    _dismissIntelPopup();
    var sc = scene || _scene;
    for (var i = 0; i < _pickups.length; i++) {
      var p = _pickups[i];
      if (p.mesh && sc) {
        sc.remove(p.mesh);
      }
    }
    _pickups = [];
    _collected = 0;
    _total = 0;
    if (_counterEl) {
      _counterEl.style.display = 'none';
    }
  }

  function getCollected() { return _collected; }
  function getTotalForLevel() { return _total; }

  function init() {
    // Module ready — spawnForLevel() activates it
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Module ready, waiting for spawnForLevel() call
  });

  return {
    init: init,
    update: update,
    spawnForLevel: spawnForLevel,
    clear: clear,
    getCollected: getCollected,
    getTotalForLevel: getTotalForLevel,
  };

})();
