window.FlashbangSystem = (function() {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var GRAVITY = -9.8;
  var FUSE_TIME = 2.0;
  var MAX_CAPACITY = 2;
  var RELOAD_TIME = 20.0;
  var BOUNCE_DAMPEN = 0.5;

  // Flash detection radii per variant
  var VARIANT_PARAMS = {
    STUN:     { range: 10, stunTime: 4.0, fovAngle: 360, delay: 0,   throws: 1 },
    BREACHING:{ range: 14, stunTime: 5.5, fovAngle: 180, delay: 0.5, throws: 1 },
    MINI:     { range: 4,  stunTime: 2.5, fovAngle: 360, delay: 0,   throws: 2 }
  };
  var VARIANT_NAMES = ['STUN', 'BREACHING', 'MINI'];

  // ── State ──────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var renderer = null;
  var enemies = null;    // array ref injected via init
  var walls = null;      // array ref for LOS raycasting

  var flashbangs = [];   // active grenade objects
  var capacity = MAX_CAPACITY;
  var reloadTimer = 0;
  var reloading = false;
  var currentVariantIndex = 0;
  var audioCtx = null;

  // Pending MINI double-throw state
  var miniThrowPending = false;
  var miniThrowTimer = 0;
  var miniThrowDir = null;

  // DOM refs created once
  var flashOverlay = null;
  var hudEl = null;
  var afterimageContainer = null;

  // Active post-flash DOM effects
  var activeAfterimages = [];
  var blurActive = false;
  var blurTimer = 0;
  var blurDuration = 3.0;

  // Ringing
  var ringNode = null;
  var ringGain = null;
  var ringTimer = 0;
  var ringDuration = 5.0;

  // Key state
  var keysDown = {};

  // ── Audio helpers ──────────────────────────────────────────────────────────
  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {}
    }
    return audioCtx;
  }

  function playBeep(freq, duration, volume) {
    var ctx = getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }

  function playMetallicClink() {
    var ctx = getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 400;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch(e) {}
  }

  function startRinging() {
    stopRinging();
    var ctx = getAudioCtx();
    if (!ctx) return;
    try {
      ringNode = ctx.createOscillator();
      ringGain = ctx.createGain();
      ringNode.connect(ringGain);
      ringGain.connect(ctx.destination);
      ringNode.frequency.value = 6000;
      ringNode.type = 'sine';
      ringGain.gain.setValueAtTime(0.5, ctx.currentTime);
      ringGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ringDuration);
      ringNode.start(ctx.currentTime);
      ringNode.stop(ctx.currentTime + ringDuration);
      ringTimer = ringDuration;
    } catch(e) {}
  }

  function stopRinging() {
    if (ringNode) {
      try { ringNode.stop(); } catch(e) {}
      ringNode = null;
      ringGain = null;
    }
    ringTimer = 0;
  }

  // ── DOM helpers ────────────────────────────────────────────────────────────
  function createFlashOverlay() {
    if (flashOverlay) return;
    flashOverlay = document.createElement('div');
    flashOverlay.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100%', 'height:100%',
      'background:#ffffff',
      'opacity:0',
      'pointer-events:none',
      'z-index:9999',
      'transition:none'
    ].join(';');
    document.body.appendChild(flashOverlay);
  }

  function createAfterimageContainer() {
    if (afterimageContainer) return;
    afterimageContainer = document.createElement('div');
    afterimageContainer.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100%', 'height:100%',
      'pointer-events:none',
      'z-index:9998',
      'overflow:hidden'
    ].join(';');
    document.body.appendChild(afterimageContainer);
  }

  function triggerFlashOverlay(intensity, duration) {
    if (!flashOverlay) return;
    flashOverlay.style.transition = 'none';
    flashOverlay.style.opacity = String(intensity);
    // Force reflow
    void flashOverlay.offsetWidth;
    flashOverlay.style.transition = 'opacity ' + duration.toFixed(2) + 's linear';
    flashOverlay.style.opacity = '0';
  }

  function triggerBlur(intensity) {
    var canvas = renderer ? renderer.domElement : null;
    if (!canvas) return;
    var blurPx = Math.round(intensity * 8);
    canvas.style.filter = 'blur(' + blurPx + 'px)';
    blurActive = true;
    blurTimer = blurDuration;
  }

  function clearBlur() {
    var canvas = renderer ? renderer.domElement : null;
    if (!canvas) return;
    canvas.style.filter = '';
    blurActive = false;
    blurTimer = 0;
  }

  function spawnAfterimages(count) {
    if (!afterimageContainer) return;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    for (var i = 0; i < count; i++) {
      var el = document.createElement('div');
      var size = 20 + Math.random() * 60;
      var x = Math.random() * vw;
      var y = Math.random() * vh;
      el.style.cssText = [
        'position:absolute',
        'left:' + x.toFixed(0) + 'px',
        'top:' + y.toFixed(0) + 'px',
        'width:' + size.toFixed(0) + 'px',
        'height:' + size.toFixed(0) + 'px',
        'background:rgba(255,220,0,0.7)',
        'opacity:1',
        'pointer-events:none',
        'transition:opacity 2s linear'
      ].join(';');
      afterimageContainer.appendChild(el);
      activeAfterimages.push({ el: el, timer: 2.0 });
      // Start fade after brief moment
      (function(e) {
        setTimeout(function() { e.style.opacity = '0'; }, 50);
      })(el);
    }
  }

  function updateAfterimages(dt) {
    var remaining = [];
    for (var i = 0; i < activeAfterimages.length; i++) {
      var ai = activeAfterimages[i];
      ai.timer -= dt;
      if (ai.timer <= 0) {
        if (ai.el.parentNode) ai.el.parentNode.removeChild(ai.el);
      } else {
        remaining.push(ai);
      }
    }
    activeAfterimages = remaining;
  }

  function updateHUD() {
    if (!hudEl) {
      hudEl = document.getElementById('flashbang-hud');
      if (!hudEl) {
        hudEl = document.createElement('div');
        hudEl.id = 'flashbang-hud';
        hudEl.style.cssText = [
          'position:fixed',
          'bottom:60px',
          'right:20px',
          'color:#fff',
          'font-family:monospace',
          'font-size:14px',
          'text-shadow:1px 1px 2px #000',
          'pointer-events:none',
          'z-index:1000',
          'user-select:none'
        ].join(';');
        document.body.appendChild(hudEl);
      }
    }
    var dots = '';
    for (var i = 0; i < MAX_CAPACITY; i++) {
      dots += (i < capacity) ? '●' : '○';
    }
    var variantName = VARIANT_NAMES[currentVariantIndex];
    var reloadStr = reloading ? ' (reload ' + Math.ceil(reloadTimer) + 's)' : '';
    hudEl.textContent = 'FLASH [' + capacity + '] ' + dots + ' [' + variantName + ']' + reloadStr;
  }

  // ── Floating text (canvas texture label) ──────────────────────────────────
  function makeFloatingLabel(text) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx2d = canvas.getContext('2d');
    ctx2d.clearRect(0, 0, 256, 64);
    ctx2d.fillStyle = 'rgba(0,0,0,0.5)';
    ctx2d.fillRect(0, 0, 256, 64);
    ctx2d.fillStyle = '#ffffff';
    ctx2d.font = 'bold 20px monospace';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(text, 128, 32);
    var texture = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.4, 0.1, 1);
    return { sprite: sprite, texture: texture, canvas: canvas, ctx2d: ctx2d };
  }

  function updateFloatingLabel(label, text) {
    var ctx2d = label.ctx2d;
    ctx2d.clearRect(0, 0, 256, 64);
    ctx2d.fillStyle = 'rgba(0,0,0,0.5)';
    ctx2d.fillRect(0, 0, 256, 64);
    ctx2d.fillStyle = '#ffffff';
    ctx2d.font = 'bold 20px monospace';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(text, 128, 32);
    label.texture.needsUpdate = true;
  }

  // ── LOS / distance check ───────────────────────────────────────────────────
  function getFlashIntensityForPlayer(grenadePos) {
    if (!camera) return 0;
    var playerPos = camera.position;

    // Distance
    var dx = playerPos.x - grenadePos.x;
    var dy = playerPos.y - grenadePos.y;
    var dz = playerPos.z - grenadePos.z;
    var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

    var params = VARIANT_PARAMS[VARIANT_NAMES[currentVariantIndex]];
    var maxRange = params.range + 2; // player flash range slightly larger
    if (dist >= maxRange) return 0;

    // Inverse distance: 0m=0%, maxRange=100% (but spec says 12m=100%, 0m=0%)
    // Spec: "12m=100%, 0m=0% (inverse)" — intensity grows with distance up to max
    // This means farther = more blinded (unusual but per spec)
    var intensity = dist / maxRange;
    intensity = Math.min(1.0, Math.max(0.0, intensity));

    // LOS check — walls block flash
    if (walls && walls.length > 0 && typeof THREE !== 'undefined') {
      var dir = new THREE.Vector3(dx, dy, dz).normalize();
      var raycaster = new THREE.Raycaster(grenadePos.clone(), dir, 0, dist);
      var hits = raycaster.intersectObjects(walls, true);
      if (hits.length > 0) {
        // Wall blocks flash — reduce to 0
        return 0;
      }
    }

    return intensity;
  }

  function isEnemyFacingBlast(enemy, grenadePos) {
    // Check if enemy is generally facing toward the grenade
    if (!enemy || !enemy.position) return false;
    var dx = grenadePos.x - enemy.position.x;
    var dz = grenadePos.z - enemy.position.z;
    // Enemy forward vector from rotation.y
    var ry = enemy.rotation ? enemy.rotation.y : 0;
    var ex = -Math.sin(ry);
    var ez = -Math.cos(ry);
    var dot = ex * dx + ez * dz;
    var mag = Math.sqrt(dx*dx + dz*dz);
    if (mag < 0.001) return true;
    var cosAngle = dot / mag;
    var params = VARIANT_PARAMS[VARIANT_NAMES[currentVariantIndex]];
    var halfFov = (params.fovAngle / 2) * (Math.PI / 180);
    return cosAngle >= Math.cos(halfFov);
  }

  function stunNearbyEnemies(grenadePos) {
    if (!enemies) return;
    var params = VARIANT_PARAMS[VARIANT_NAMES[currentVariantIndex]];
    var range = params.range;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var dx = e.position.x - grenadePos.x;
      var dy = e.position.y - grenadePos.y;
      var dz = e.position.z - grenadePos.z;
      var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist > range) continue;
      if (!isEnemyFacingBlast(e, grenadePos)) continue;
      e.stunned = true;
      e.stunnedTimer = params.stunTime;
      // Eyes covered animation — random rotation.y spin
      if (e.rotation) {
        e.rotation.y = Math.random() * Math.PI * 2;
      }
    }
  }

  // ── Grenade creation ───────────────────────────────────────────────────────
  function createGrenadeObject(position, velocity, variantName) {
    var geo = new THREE.SphereGeometry(0.06, 8, 8);
    var mat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8, roughness: 0.3 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    if (scene) scene.add(mesh);

    // Floating label sprite
    var label = makeFloatingLabel('FRAG: ' + FUSE_TIME.toFixed(1) + 's');
    label.sprite.position.set(0, 0.15, 0);
    mesh.add(label.sprite);

    var beepIntervals = [0.2, 0.1, 0.05];
    var beepStage = 0;
    var beepTimer = 0;

    var obj = {
      mesh: mesh,
      velocity: velocity.clone ? velocity.clone() : new THREE.Vector3(velocity.x, velocity.y, velocity.z),
      fuseTimer: FUSE_TIME,
      label: label,
      beepTimer: beepTimer,
      beepStage: beepStage,
      bounceCount: 0,
      variant: variantName,
      detonated: false,
      // For BREACHING delayed detonation
      detonationDelay: VARIANT_PARAMS[variantName].delay,
      detonationPending: false,
      detonationTimer: 0
    };

    return obj;
  }

  // ── Detonation ─────────────────────────────────────────────────────────────
  function detonateGrenade(obj) {
    if (obj.detonated) return;
    obj.detonated = true;

    var grenadePos = obj.mesh.position.clone();

    // Remove mesh from scene
    if (scene) scene.remove(obj.mesh);
    // Dispose geometry/material
    if (obj.mesh.geometry) obj.mesh.geometry.dispose();
    if (obj.mesh.material) obj.mesh.material.dispose();

    // Calculate player flash intensity
    var intensity = getFlashIntensityForPlayer(grenadePos);

    if (intensity > 0.05) {
      // Flash overlay — duration scales with intensity (1–3s)
      var flashDuration = 1.0 + intensity * 2.0;
      triggerFlashOverlay(intensity, flashDuration);

      // Blur if intensity is meaningful
      if (intensity > 0.3) {
        triggerBlur(intensity);
      }

      // Yellow afterimages
      var imageCount = Math.floor(intensity * 12) + 3;
      spawnAfterimages(imageCount);

      // Ringing
      startRinging();
    }

    // Stun enemies
    stunNearbyEnemies(grenadePos);

    // Dispose label texture
    if (obj.label && obj.label.texture) obj.label.texture.dispose();
  }

  // ── Throw logic ───────────────────────────────────────────────────────────
  function throw_() {
    if (!camera) return;
    var params = VARIANT_PARAMS[VARIANT_NAMES[currentVariantIndex]];

    // MINI gets 2 throws from 1 grenade slot
    var throwCount = (VARIANT_NAMES[currentVariantIndex] === 'MINI') ? params.throws : 1;

    if (capacity <= 0) return;
    capacity -= 1;

    // Start reload if empty
    if (capacity === 0 && !reloading) {
      reloading = true;
      reloadTimer = RELOAD_TIME;
    }

    // Get throw direction from camera
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    var spawnPos = camera.position.clone().add(dir.clone().multiplyScalar(0.3));
    spawnPos.y -= 0.1;

    var vel = dir.clone().multiplyScalar(10);
    vel.y += 3; // upward arc component

    var grenade = createGrenadeObject(spawnPos, vel, VARIANT_NAMES[currentVariantIndex]);
    flashbangs.push(grenade);

    // MINI: schedule second throw
    if (VARIANT_NAMES[currentVariantIndex] === 'MINI' && throwCount > 1) {
      miniThrowPending = true;
      miniThrowTimer = 0.3;
      miniThrowDir = dir.clone();
    }

    updateHUD();
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) dt = 0.016;

    // Reload
    if (reloading) {
      reloadTimer -= dt;
      if (reloadTimer <= 0) {
        reloading = false;
        reloadTimer = 0;
        capacity = MAX_CAPACITY;
      }
      updateHUD();
    }

    // MINI pending second throw
    if (miniThrowPending) {
      miniThrowTimer -= dt;
      if (miniThrowTimer <= 0) {
        miniThrowPending = false;
        if (miniThrowDir && camera) {
          var spawnPos2 = camera.position.clone().add(miniThrowDir.clone().multiplyScalar(0.3));
          spawnPos2.y -= 0.1;
          var vel2 = miniThrowDir.clone().multiplyScalar(10);
          vel2.y += 3;
          // Slight offset
          vel2.x += (Math.random() - 0.5) * 1.5;
          vel2.z += (Math.random() - 0.5) * 1.5;
          var g2 = createGrenadeObject(spawnPos2, vel2, 'MINI');
          flashbangs.push(g2);
        }
      }
    }

    // Update blur fade
    if (blurActive) {
      blurTimer -= dt;
      if (blurTimer <= 0) {
        clearBlur();
      } else {
        var blurFrac = blurTimer / blurDuration;
        var blurPx = Math.round(blurFrac * 8);
        var canvas = renderer ? renderer.domElement : null;
        if (canvas) canvas.style.filter = 'blur(' + blurPx + 'px)';
      }
    }

    // Update ring timer
    if (ringTimer > 0) {
      ringTimer -= dt;
      if (ringTimer <= 0) {
        ringTimer = 0;
      }
    }

    // Update afterimages
    updateAfterimages(dt);

    // Update grenades
    var remaining = [];
    for (var i = 0; i < flashbangs.length; i++) {
      var obj = flashbangs[i];
      if (obj.detonated) continue;

      // Pending detonation (BREACHING delay)
      if (obj.detonationPending) {
        obj.detonationTimer -= dt;
        if (obj.detonationTimer <= 0) {
          detonateGrenade(obj);
        } else {
          remaining.push(obj);
        }
        continue;
      }

      // Fuse countdown
      obj.fuseTimer -= dt;

      // Update beep
      obj.beepTimer -= dt;
      var stage = 0;
      if (obj.fuseTimer < 0.5) {
        stage = 2;
      } else if (obj.fuseTimer < 1.0) {
        stage = 1;
      } else {
        stage = 0;
      }
      var beepInterval = [0.2, 0.1, 0.05][stage];
      if (obj.beepTimer <= 0) {
        playBeep(800, 0.05, 0.25);
        obj.beepTimer = beepInterval;
      }

      // Update floating label
      if (obj.fuseTimer > 0) {
        updateFloatingLabel(obj.label, 'FRAG: ' + obj.fuseTimer.toFixed(1) + 's');
      }

      // Physics
      obj.velocity.y += GRAVITY * dt;
      obj.mesh.position.x += obj.velocity.x * dt;
      obj.mesh.position.y += obj.velocity.y * dt;
      obj.mesh.position.z += obj.velocity.z * dt;

      // Bounce on ground (Y <= 0)
      if (obj.mesh.position.y <= 0) {
        obj.mesh.position.y = 0;
        if (Math.abs(obj.velocity.y) > 0.5) {
          playMetallicClink();
          obj.bounceCount++;
        }
        obj.velocity.y = -obj.velocity.y * BOUNCE_DAMPEN;
        // Reduce horizontal velocity slightly on bounce
        obj.velocity.x *= 0.85;
        obj.velocity.z *= 0.85;
      }

      // Spin mesh for realism
      obj.mesh.rotation.x += 2.0 * dt;
      obj.mesh.rotation.z += 1.5 * dt;

      // Detonate on fuse expiry
      if (obj.fuseTimer <= 0) {
        var params = VARIANT_PARAMS[obj.variant];
        if (params.delay > 0) {
          obj.detonationPending = true;
          obj.detonationTimer = params.delay;
          remaining.push(obj);
        } else {
          detonateGrenade(obj);
        }
        continue;
      }

      remaining.push(obj);
    }
    flashbangs = remaining;

    updateHUD();
  }

  // ── Key handling ───────────────────────────────────────────────────────────
  function onKeyDown(e) {
    // Alt+F → throw (if not taken)
    if (e.altKey && !e.ctrlKey && e.code === 'KeyF') {
      e.preventDefault();
      throw_();
      return;
    }
    // Ctrl+B → throw (fallback)
    if (e.ctrlKey && !e.altKey && e.code === 'KeyB') {
      e.preventDefault();
      throw_();
      return;
    }
    // Ctrl+Alt+B → cycle variant
    if (e.ctrlKey && e.altKey && e.code === 'KeyB') {
      e.preventDefault();
      cycleVariant();
      return;
    }
  }

  function cycleVariant() {
    currentVariantIndex = (currentVariantIndex + 1) % VARIANT_NAMES.length;
    updateHUD();
    // Brief audio feedback
    playBeep(600, 0.05, 0.15);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init(options) {
    options = options || {};
    scene    = options.scene    || (window.scene    || null);
    camera   = options.camera   || (window.camera   || null);
    renderer = options.renderer || (window.renderer || null);
    enemies  = options.enemies  || (window.enemies  || null);
    walls    = options.walls    || (window.walls    || null);

    // Try common globals if not passed
    if (!scene    && window.scene)    scene    = window.scene;
    if (!camera   && window.camera)   camera   = window.camera;
    if (!renderer && window.renderer) renderer = window.renderer;
    if (!enemies  && window.enemies)  enemies  = window.enemies;

    createFlashOverlay();
    createAfterimageContainer();
    updateHUD();

    document.addEventListener('keydown', onKeyDown);
  }

  function reset() {
    // Remove all active grenades
    for (var i = 0; i < flashbangs.length; i++) {
      var obj = flashbangs[i];
      if (!obj.detonated && scene) {
        scene.remove(obj.mesh);
        if (obj.mesh.geometry) obj.mesh.geometry.dispose();
        if (obj.mesh.material) obj.mesh.material.dispose();
      }
      if (obj.label && obj.label.texture) obj.label.texture.dispose();
    }
    flashbangs = [];

    // Clear DOM effects
    clearBlur();
    stopRinging();
    for (var j = 0; j < activeAfterimages.length; j++) {
      var ai = activeAfterimages[j];
      if (ai.el && ai.el.parentNode) ai.el.parentNode.removeChild(ai.el);
    }
    activeAfterimages = [];

    if (flashOverlay) flashOverlay.style.opacity = '0';

    // Reset capacity
    capacity = MAX_CAPACITY;
    reloading = false;
    reloadTimer = 0;
    miniThrowPending = false;
    miniThrowTimer = 0;
    miniThrowDir = null;

    updateHUD();
  }

  return {
    init:   init,
    update: update,
    throw_: throw_,
    reset:  reset
  };
})();
