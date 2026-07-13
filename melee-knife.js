/**
 * melee-knife.js — V key knife attack for close-quarters combat
 * Fast melee weapon: 85 damage, 2.5 unit range, 0.7s cooldown
 */
window.MeleeKnife = (function () {

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  var _cooldown = 0;          // seconds remaining on cooldown
  var _cooldownMax = 0.7;     // seconds between slashes
  var _range = 2.5;           // units forward
  var _damage = 85;

  // Swing animation state
  var _swingTime = 0;         // seconds into current swing
  var _swingDuration = 0.4;   // total swing duration
  var _returnDuration = 0.2;  // return phase
  var _isSwinging = false;

  // Knife mesh group (attached to camera)
  var _knifeGroup = null;
  var _bladeMesh = null;
  var _handleMesh = null;

  // Blood particles
  var _bloodParticles = [];   // array of {mesh, vel, life, maxLife}

  // Screen flash overlay
  var _flashEl = null;
  var _flashTimer = 0;

  // HUD icon + glow
  var _hudEl = null;
  var _glowTimer = 0;
  var _hasBeenUsed = false;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;

    _buildKnifeMesh();
    _buildFlashOverlay();
    _buildHUD();
  }

  function _buildKnifeMesh() {
    if (!_scene || !_camera) return;

    _knifeGroup = new THREE.Group();

    // Blade: thin silver box
    var bladeGeo = new THREE.BoxGeometry(0.04, 0.04, 0.35);
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    _bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    _bladeMesh.position.set(0, 0, -0.175); // extend forward

    // Handle: dark brown box
    var handleGeo = new THREE.BoxGeometry(0.06, 0.06, 0.18);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x3a2000 });
    _handleMesh = new THREE.Mesh(handleGeo, handleMat);
    _handleMesh.position.set(0, 0, 0.09); // behind blade

    _knifeGroup.add(_bladeMesh);
    _knifeGroup.add(_handleMesh);

    // Mount relative to camera: right/down/forward
    _knifeGroup.position.set(0.25, -0.15, -0.4);
    _knifeGroup.rotation.x = THREE.MathUtils.degToRad(30); // resting angle

    // Hidden until swinging
    _knifeGroup.visible = false;

    _camera.add(_knifeGroup);
    // camera must be in scene for camera.add to show
    if (_scene.getObjectByName('__knifeCamera') === undefined) {
      // THREE cameras added to the scene's render chain; camera children render automatically
    }
  }

  function _buildFlashOverlay() {
    if (typeof document === 'undefined') return;
    _flashEl = document.getElementById('melee-flash-overlay');
    if (!_flashEl) {
      _flashEl = document.createElement('div');
      _flashEl.id = 'melee-flash-overlay';
      _flashEl.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100%',
        'height:100%',
        'background:rgba(255,255,255,0)',
        'pointer-events:none',
        'z-index:9000',
        'transition:none'
      ].join(';');
      document.body.appendChild(_flashEl);
    }
  }

  function _buildHUD() {
    if (typeof document === 'undefined') return;
    _hudEl = document.getElementById('melee-knife-hud');
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'melee-knife-hud';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'right:180px',
        'display:none',
        'align-items:center',
        'gap:6px',
        'z-index:8000',
        'font-family:monospace',
        'color:#fff',
        'font-size:18px',
        'text-shadow:0 0 4px #000',
        'pointer-events:none'
      ].join(';');
      _hudEl.innerHTML = '<span id="melee-knife-icon">🔪</span><canvas id="melee-knife-arc" width="32" height="32" style="vertical-align:middle"></canvas>';
      document.body.appendChild(_hudEl);
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  function update(delta) {
    if (!delta) delta = 0.016;

    // Cooldown timer
    if (_cooldown > 0) {
      _cooldown -= delta;
      if (_cooldown < 0) _cooldown = 0;
    }

    // Swing animation
    if (_isSwinging) {
      _swingTime += delta;
      _updateSwingAnimation();
      if (_swingTime >= _swingDuration + _returnDuration) {
        _isSwinging = false;
        _swingTime = 0;
        if (_knifeGroup) _knifeGroup.visible = false;
      }
    }

    // Blood particles
    _updateBloodParticles(delta);

    // Flash overlay
    if (_flashTimer > 0) {
      _flashTimer -= delta;
      if (_flashTimer < 0) _flashTimer = 0;
      var alpha = _flashTimer / 0.1;
      if (_flashEl) _flashEl.style.background = 'rgba(255,255,255,' + (alpha * 0.45) + ')';
    }

    // HUD glow timer
    if (_glowTimer > 0) {
      _glowTimer -= delta;
      if (_glowTimer < 0) _glowTimer = 0;
    }

    // Update HUD display
    _updateHUD();
  }

  function _updateSwingAnimation() {
    if (!_knifeGroup) return;

    var t = _swingTime;
    var forwardRad = THREE.MathUtils.degToRad(30);
    var backRad = THREE.MathUtils.degToRad(-90);

    if (t <= _swingDuration) {
      // Forward slash: +30 → -90
      var p = t / _swingDuration;
      _knifeGroup.rotation.x = forwardRad + (backRad - forwardRad) * p;
    } else {
      // Return: -90 → +30
      var p2 = (t - _swingDuration) / _returnDuration;
      if (p2 > 1) p2 = 1;
      _knifeGroup.rotation.x = backRad + (forwardRad - backRad) * p2;
    }
  }

  function _updateBloodParticles(delta) {
    var gravity = 9.8;
    var i = _bloodParticles.length;
    while (i--) {
      var p = _bloodParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        if (_scene && p.mesh) _scene.remove(p.mesh);
        if (p.mesh && p.mesh.geometry) p.mesh.geometry.dispose();
        _bloodParticles.splice(i, 1);
        continue;
      }
      // Move
      p.vel.y -= gravity * delta;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta;
      p.mesh.position.z += p.vel.z * delta;
      // Fade
      var alpha = p.life / p.maxLife;
      if (p.mesh.material) p.mesh.material.opacity = alpha;
    }
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_hasBeenUsed) return;

    _hudEl.style.display = 'flex';

    var canvas = document.getElementById('melee-knife-arc');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 32, 32);

    var ready = _cooldown <= 0;

    if (ready) {
      // Glow: bright ring
      ctx.strokeStyle = _glowTimer > 0 ? '#00ffcc' : '#44cc88';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Cooldown arc: fill from top proportional to remaining
      var fraction = 1 - (_cooldown / _cooldownMax);
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(16, 16, 12, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
      ctx.stroke();
    }
  }

  // ── Attack ─────────────────────────────────────────────────────────────────
  function attack(playerPos, camera, allEnemies, onHitCallback) {
    if (_cooldown > 0) return;

    _cooldown = _cooldownMax;
    _hasBeenUsed = true;

    // Start swing visual
    _isSwinging = true;
    _swingTime = 0;
    if (_knifeGroup) {
      _knifeGroup.visible = true;
      _knifeGroup.rotation.x = THREE.MathUtils.degToRad(30);
    }

    // Forward direction
    var forward = new THREE.Vector3();
    if (camera && camera.getWorldDirection) {
      camera.getWorldDirection(forward);
    } else {
      forward.set(0, 0, -1);
    }
    forward.y = 0;
    forward.normalize();

    var hitAny = false;

    // Check enemies
    if (allEnemies && allEnemies.length) {
      for (var i = 0; i < allEnemies.length; i++) {
        var enemy = allEnemies[i];
        if (!enemy || !enemy.alive) continue;

        var ePos = enemy.mesh ? enemy.mesh.position : enemy.position;
        if (!ePos) continue;

        var dx = ePos.x - playerPos.x;
        var dz = ePos.z - playerPos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > _range) continue;

        // Dot product: is enemy roughly in front?
        var toEnemy = new THREE.Vector3(dx, 0, dz).normalize();
        var dot = forward.dot(toEnemy);
        if (dot < 0.4) continue;

        // Hit!
        hitAny = true;
        if (onHitCallback) onHitCallback(enemy, _damage);
        _spawnBloodAt(ePos);

        // Silent kill for Ghost loadout
        if (window._loadoutType === 'Ghost') {
          // suppress enemy death shout — mark enemy before damage
          if (enemy.silentKill !== undefined) enemy.silentKill = true;
        }
      }
    }

    // Check explosive barrels
    if (window.ExplosiveBarrels && window.ExplosiveBarrels.checkKnifeHit) {
      window.ExplosiveBarrels.checkKnifeHit(playerPos, forward, _range);
    }

    // Screen flash on hit
    if (hitAny) {
      _flashTimer = 0.1;
      _playHitSound();
    } else {
      _playSwingSound();
    }

    // Ready glow when cooldown next expires — we set the glow timer
    // when cooldown ends; handled lazily in update via _cooldown check
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _playSwingSound() {
    var ctx = window._audioCtx;
    if (!ctx) return;

    try {
      var bufferSize = ctx.sampleRate * 0.15;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }

      var source = ctx.createBufferSource();
      source.buffer = buffer;

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      var filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch (e) {
      // audio unavailable
    }
  }

  function _playHitSound() {
    var ctx = window._audioCtx;
    if (!ctx) return;

    try {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // audio unavailable
    }
  }

  // ── Blood particles ────────────────────────────────────────────────────────
  function _spawnBloodAt(pos) {
    if (!_scene) return;

    for (var i = 0; i < 8; i++) {
      var geo = new THREE.SphereGeometry(0.06, 4, 4);
      var mat = new THREE.MeshBasicMaterial({
        color: 0xaa0000,
        transparent: true,
        opacity: 1.0
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y + 0.8, pos.z);

      // Scatter in a cone forward and upward
      var angle = (Math.random() - 0.5) * Math.PI;
      var speed = 2.0 + Math.random() * 3.0;
      var velX = Math.sin(angle) * speed * 0.6;
      var velY = 1.5 + Math.random() * 2.5;
      var velZ = -Math.cos(angle) * speed * 0.6;

      _scene.add(mesh);
      _bloodParticles.push({
        mesh: mesh,
        vel: { x: velX, y: velY, z: velZ },
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  // ── Clear / Reset ──────────────────────────────────────────────────────────
  function clear() {
    // Remove blood particles
    for (var i = 0; i < _bloodParticles.length; i++) {
      if (_scene && _bloodParticles[i].mesh) _scene.remove(_bloodParticles[i].mesh);
      if (_bloodParticles[i].mesh && _bloodParticles[i].mesh.geometry) {
        _bloodParticles[i].mesh.geometry.dispose();
      }
    }
    _bloodParticles = [];

    // Hide knife
    if (_knifeGroup) _knifeGroup.visible = false;
    _isSwinging = false;
    _swingTime = 0;

    // Hide flash
    if (_flashEl) _flashEl.style.background = 'rgba(255,255,255,0)';
    _flashTimer = 0;
  }

  function reset() {
    clear();
    _cooldown = 0;
    _hasBeenUsed = false;
    _glowTimer = 0;

    // Hide HUD
    if (_hudEl) _hudEl.style.display = 'none';
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    attack: attack,
    clear: clear,
    reset: reset
  };

})();
