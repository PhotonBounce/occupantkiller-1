window.ShieldBubble = (function () {
  'use strict';

  // ── globals exposed for game integration ──────────────────────────────────
  window._shieldBubbleActive = false;
  window._shieldBubbleHP = 0;

  // ── constants ─────────────────────────────────────────────────────────────
  var SHIELD_RADIUS = 4;
  var SHIELD_MAX_HP = 300;
  var SHIELD_DURATION = 20;       // seconds
  var COOLDOWN_DURATION = 60;     // seconds
  var MAX_CHARGES = 1;

  // ── internal state ────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _playerRef = null;

  var _shieldGroup = null;
  var _sphereMesh = null;
  var _wireframeMesh = null;
  var _pointLight = null;

  var _active = false;
  var _hp = 0;
  var _timeRemaining = 0;
  var _cooldown = 0;
  var _charges = MAX_CHARGES;

  var _breakAnimActive = false;
  var _breakAnimTime = 0;
  var _breakSphere = null;

  // Audio nodes
  var _audioCtx = null;
  var _humOscillator = null;
  var _humGain = null;

  // HUD element
  var _hudEl = null;
  var _hudBar = null;

  // Crackle sparks pool
  var _sparks = [];
  var _sparkMaterial = null;

  // ── helpers ───────────────────────────────────────────────────────────────
  function _getPlayerPosition() {
    if (_playerRef && _playerRef.position) {
      return _playerRef.position;
    }
    if (window.GameManager && window.GameManager.getPlayerPosition) {
      return window.GameManager.getPlayerPosition();
    }
    if (_camera) {
      return _camera.position;
    }
    return new THREE.Vector3(0, 0, 0);
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _hexToR(hex) { return ((hex >> 16) & 0xFF) / 255; }
  function _hexToG(hex) { return ((hex >> 8) & 0xFF) / 255; }
  function _hexToB(hex) { return (hex & 0xFF) / 255; }

  function _colorLerp(hexA, hexB, t) {
    var r = Math.round(_lerp(_hexToR(hexA) * 255, _hexToR(hexB) * 255, t));
    var g = Math.round(_lerp(_hexToG(hexA) * 255, _hexToG(hexB) * 255, t));
    var b = Math.round(_lerp(_hexToB(hexA) * 255, _hexToB(hexB) * 255, t));
    return (r << 16) | (g << 8) | b;
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  function _initAudio() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
  }

  function _startHum() {
    if (!_audioCtx) { return; }
    try {
      _humOscillator = _audioCtx.createOscillator();
      _humGain = _audioCtx.createGain();
      _humOscillator.type = 'sine';
      _humOscillator.frequency.setValueAtTime(60, _audioCtx.currentTime);
      _humGain.gain.setValueAtTime(0.06, _audioCtx.currentTime);
      _humOscillator.connect(_humGain);
      _humGain.connect(_audioCtx.destination);
      _humOscillator.start();
    } catch (e) {}
  }

  function _stopHum() {
    if (!_humOscillator) { return; }
    try {
      _humGain.gain.setValueAtTime(0.06, _audioCtx.currentTime);
      _humGain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.15);
      _humOscillator.stop(_audioCtx.currentTime + 0.2);
    } catch (e) {}
    _humOscillator = null;
    _humGain = null;
  }

  function _playImpactPing() {
    if (!_audioCtx) { return; }
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, _audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, _audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, _audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start();
      osc.stop(_audioCtx.currentTime + 0.25);
    } catch (e) {}
  }

  function _playShatterSound() {
    if (!_audioCtx) { return; }
    try {
      var bufferSize = _audioCtx.sampleRate * 0.4;
      var buffer = _audioCtx.createBuffer(1, bufferSize, _audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
      }
      var source = _audioCtx.createBufferSource();
      source.buffer = buffer;
      var filter = _audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;
      var gain = _audioCtx.createGain();
      gain.gain.setValueAtTime(0.5, _audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.4);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(_audioCtx.destination);
      source.start();
    } catch (e) {}
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'shield-bubble-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:54px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,60,0.75)',
      'border:1px solid #0088FF',
      'border-radius:6px',
      'padding:5px 14px 6px',
      'color:#44AAFF',
      'font-family:monospace',
      'font-size:13px',
      'pointer-events:none',
      'display:none',
      'z-index:9999',
      'min-width:220px',
      'text-align:center'
    ].join(';');

    var label = document.createElement('div');
    label.id = 'shield-bubble-label';
    label.textContent = '⚡ SHIELD 300HP (20s)';
    label.style.marginBottom = '4px';

    var barBg = document.createElement('div');
    barBg.style.cssText = 'background:#002244;border-radius:3px;height:6px;width:100%;overflow:hidden';
    _hudBar = document.createElement('div');
    _hudBar.style.cssText = 'background:#0088FF;height:6px;width:100%;border-radius:3px;transition:width 0.1s,background 0.1s';
    barBg.appendChild(_hudBar);

    _hudEl.appendChild(label);
    _hudEl.appendChild(barBg);
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    var label = document.getElementById('shield-bubble-label');
    if (_active) {
      _hudEl.style.display = 'block';
      var hpRatio = Math.max(0, _hp / SHIELD_MAX_HP);
      var secs = Math.ceil(_timeRemaining);
      if (label) {
        label.textContent = '⚡ SHIELD ' + Math.ceil(_hp) + 'HP (' + secs + 's)';
      }
      var pct = (hpRatio * 100).toFixed(1) + '%';
      if (_hudBar) {
        _hudBar.style.width = pct;
        // Color: blue → red as HP drops
        var barColor = hpRatio > 0.5
          ? '#0088FF'
          : hpRatio > 0.25
            ? '#FF8800'
            : '#FF2200';
        _hudBar.style.background = barColor;
      }
    } else if (_cooldown > 0) {
      _hudEl.style.display = 'block';
      var cdSecs = Math.ceil(_cooldown);
      if (label) {
        label.textContent = '⚡ SHIELD (cooldown ' + cdSecs + 's)';
      }
      if (_hudBar) {
        _hudBar.style.width = ((_cooldown / COOLDOWN_DURATION) * 100).toFixed(1) + '%';
        _hudBar.style.background = '#334466';
      }
    } else {
      _hudEl.style.display = _charges > 0 ? 'block' : 'block';
      if (label) {
        label.textContent = '⚡ SHIELD READY [Ctrl+Shift+S]';
      }
      if (_hudBar) {
        _hudBar.style.width = '100%';
        _hudBar.style.background = '#0088FF';
      }
      // Hide after half a second if idle — keep showing so player knows it's available
    }
  }

  // ── Visual construction ───────────────────────────────────────────────────
  function _buildShieldVisuals() {
    _shieldGroup = new THREE.Group();

    // Sphere shell
    var sphereGeo = new THREE.SphereGeometry(SHIELD_RADIUS, 16, 16);
    var sphereMat = new THREE.MeshBasicMaterial({
      color: 0x0088FF,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    _sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    _shieldGroup.add(_sphereMesh);

    // Wireframe overlay
    var wireGeo = new THREE.WireframeGeometry(sphereGeo);
    var wireMat = new THREE.LineBasicMaterial({
      color: 0x44AAFF,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    _wireframeMesh = new THREE.LineSegments(wireGeo, wireMat);
    _shieldGroup.add(_wireframeMesh);

    // Interior point light
    _pointLight = new THREE.PointLight(0x0055FF, 3, 8);
    _shieldGroup.add(_pointLight);

    // Spark material (for crackle)
    _sparkMaterial = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    _scene.add(_shieldGroup);
  }

  function _removeShieldVisuals() {
    if (_shieldGroup && _scene) {
      _scene.remove(_shieldGroup);
    }
    _shieldGroup = null;
    _sphereMesh = null;
    _wireframeMesh = null;
    _pointLight = null;
    _removeSparks();
  }

  // ── Crackle sparks ────────────────────────────────────────────────────────
  function _removeSparks() {
    for (var i = 0; i < _sparks.length; i++) {
      if (_sparks[i].parent) { _sparks[i].parent.remove(_sparks[i]); }
      _sparks[i].geometry.dispose();
    }
    _sparks = [];
  }

  function _updateCrackleSparks() {
    // Remove old sparks
    _removeSparks();

    if (!_shieldGroup || !_active) { return; }

    var NUM_SPARKS = 5;
    for (var i = 0; i < NUM_SPARKS; i++) {
      // Random point on sphere surface
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = SHIELD_RADIUS;
      var x0 = r * Math.sin(phi) * Math.cos(theta);
      var y0 = r * Math.sin(phi) * Math.sin(theta);
      var z0 = r * Math.cos(phi);

      // Small random offset for the other end
      var dx = (Math.random() - 0.5) * 1.2;
      var dy = (Math.random() - 0.5) * 1.2;
      var dz = (Math.random() - 0.5) * 1.2;

      var positions = new Float32Array([x0, y0, z0, x0 + dx, y0 + dy, z0 + dz]);
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var spark = new THREE.LineSegments(geo, _sparkMaterial);
      _shieldGroup.add(spark);
      _sparks.push(spark);
    }
  }

  // ── Break animation ───────────────────────────────────────────────────────
  function _startBreakAnim(pos) {
    var geo = new THREE.SphereGeometry(SHIELD_RADIUS, 16, 16);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      wireframe: true
    });
    _breakSphere = new THREE.Mesh(geo, mat);
    _breakSphere.position.copy(pos);
    _scene.add(_breakSphere);
    _breakAnimActive = true;
    _breakAnimTime = 0;
  }

  function _updateBreakAnim(dt) {
    if (!_breakAnimActive || !_breakSphere) { return; }
    _breakAnimTime += dt;
    var t = _breakAnimTime / 0.3; // 0.3 second animation
    if (t >= 1) {
      _scene.remove(_breakSphere);
      _breakSphere.geometry.dispose();
      _breakSphere.material.dispose();
      _breakSphere = null;
      _breakAnimActive = false;
      return;
    }
    // Expand from SHIELD_RADIUS to 6, fade out
    var scale = _lerp(1, 6 / SHIELD_RADIUS, t);
    _breakSphere.scale.setScalar(scale);
    _breakSphere.material.opacity = _lerp(0.8, 0, t);
    // Shift color from white toward dim blue
    _breakSphere.material.color.setHex(_colorLerp(0xFFFFFF, 0x002244, t));
  }

  // ── Activation & deactivation ─────────────────────────────────────────────
  function _activateShield() {
    if (_active || _charges < 1 || _cooldown > 0) { return; }

    _active = true;
    _hp = SHIELD_MAX_HP;
    _timeRemaining = SHIELD_DURATION;
    _charges = 0;

    window._shieldBubbleActive = true;
    window._shieldBubbleHP = _hp;

    _buildShieldVisuals();
    _startHum();
    _updateHUD();
  }

  function _deactivateShield(broken) {
    if (!_active) { return; }

    var pos = _getPlayerPosition().clone();

    _active = false;
    window._shieldBubbleActive = false;
    window._shieldBubbleHP = 0;
    _cooldown = COOLDOWN_DURATION;

    _stopHum();

    if (broken) {
      _playShatterSound();
      _startBreakAnim(pos);
    }

    _removeShieldVisuals();
    _updateHUD();
  }

  // ── Damage absorption (called externally) ────────────────────────────────
  function _absorbDamage(amount) {
    if (!_active) { return amount; } // pass through

    _playImpactPing();
    _hp -= amount;
    window._shieldBubbleHP = _hp;

    if (_hp <= 0) {
      _hp = 0;
      window._shieldBubbleHP = 0;
      _deactivateShield(true);
      return 0; // shield absorbed everything
    }

    return 0; // shield absorbed all damage
  }

  // ── Keyboard handler ─────────────────────────────────────────────────────
  function _onKeyDown(e) {
    // Ctrl+Shift+S
    if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.code === 'KeyS')) {
      e.preventDefault();
      deploy();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function init(scene, camera, playerRef) {
    _scene = scene;
    _camera = camera;
    _playerRef = playerRef || null;

    _active = false;
    _hp = 0;
    _timeRemaining = 0;
    _cooldown = 0;
    _charges = MAX_CHARGES;
    _breakAnimActive = false;

    window._shieldBubbleActive = false;
    window._shieldBubbleHP = 0;

    _initAudio();
    _createHUD();

    document.addEventListener('keydown', _onKeyDown);

    // Expose damage absorber globally so game can call it
    window._shieldAbsorbDamage = _absorbDamage;
  }

  function deploy() {
    if (_active) { return; }   // already up
    if (_cooldown > 0) { return; } // on cooldown
    if (_charges < 1) { return; }
    _activateShield();
  }

  function update(dt) {
    // Handle break animation regardless of active state
    if (_breakAnimActive) {
      _updateBreakAnim(dt);
    }

    // Cooldown tick
    if (!_active && _cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        _charges = MAX_CHARGES;
      }
      _updateHUD();
      return;
    }

    if (!_active) {
      _updateHUD();
      return;
    }

    // --- Shield is active ---

    // Follow player
    var pos = _getPlayerPosition();
    if (_shieldGroup) {
      _shieldGroup.position.copy(pos);
    }

    // Tick duration
    _timeRemaining -= dt;
    if (_timeRemaining <= 0 || _hp <= 0) {
      _deactivateShield(_hp <= 0);
      return;
    }

    var hpRatio = Math.max(0, _hp / SHIELD_MAX_HP);
    var timeRatio = Math.max(0, _timeRemaining / SHIELD_DURATION);

    // Update sphere opacity and color
    if (_sphereMesh) {
      var opacity = _lerp(0.5, 0.18, hpRatio); // more opaque when damaged
      _sphereMesh.material.opacity = opacity;
      var col = _colorLerp(0xFF2200, 0x0088FF, hpRatio); // red when low HP
      _sphereMesh.material.color.setHex(col);
    }

    // Rotate wireframe slowly (simulating shimmer/animation)
    if (_wireframeMesh) {
      _wireframeMesh.rotation.y += dt * 0.4;
      _wireframeMesh.rotation.x += dt * 0.15;
    }

    // Pulse point light
    if (_pointLight) {
      var pulse = 2.5 + Math.sin(Date.now() * 0.006) * 0.5;
      _pointLight.intensity = pulse;
      // Light color shifts to red when damaged
      _pointLight.color.setHex(_colorLerp(0xFF2200, 0x0055FF, hpRatio));
    }

    // Crackle sparks when HP < 100
    if (_hp < 100 && _active) {
      _updateCrackleSparks();
    } else {
      _removeSparks();
    }

    window._shieldBubbleHP = _hp;
    _updateHUD();
  }

  function reset() {
    _deactivateShield(false);
    _active = false;
    _hp = 0;
    _timeRemaining = 0;
    _cooldown = 0;
    _charges = MAX_CHARGES;
    window._shieldBubbleActive = false;
    window._shieldBubbleHP = 0;
    _removeShieldVisuals();
    _stopHum();
    if (_hudEl) {
      _hudEl.style.display = 'none';
    }
    _removeSparks();
    if (_breakAnimActive && _breakSphere) {
      if (_scene) { _scene.remove(_breakSphere); }
      _breakSphere.geometry.dispose();
      _breakSphere.material.dispose();
      _breakSphere = null;
      _breakAnimActive = false;
      _breakAnimTime = 0;
    }
  }

  return { init: init, update: update, deploy: deploy, reset: reset };
})();
