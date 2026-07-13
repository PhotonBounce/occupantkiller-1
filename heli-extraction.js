// heli-extraction.js — helicopter extraction/evacuation mechanic for Three.js FPS
window.HeliExtraction = (function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────────
  var scene, camera, renderer, playerRef;

  var state = 'idle'; // idle | approaching | hovering | rope_descending | lifting | departing
  var heliGroup = null;
  var mainRotor = null;
  var tailRotor = null;
  var searchlight = null;
  var ropeObj = null;
  var ropeLengthTarget = 0;
  var ropeLengthCurrent = 0;
  var ropeEnd = null; // Three.js Object3D tracking rope bottom

  var hoverPosition = null; // THREE.Vector3
  var spawnPosition = null; // THREE.Vector3
  var heliSpeed = 8;
  var heliAltitude = 15;
  var landingZone = null; // THREE.Vector3 — (0, 15, -10)

  var etaTimer = 0;
  var totalETA = 20;
  var hoverTimer = 0;
  var maxHoverTime = 60;
  var ropeMesh = null;
  var ropeDescendTimer = 0;
  var ropeDescendDuration = 4;
  var liftTimer = 0;
  var liftDuration = 5;
  var playerLifting = false;
  var extractionUsedThisWave = false;
  var cooldownActive = false;

  var underFireTimer = 0;
  var underFireCooldown = 0;
  var evasiveOffsetX = 0;
  var evasiveOffsetZ = 0;

  var audioCtx = null;
  var heliAudioNodes = null; // { osc, gainNode, amOsc, amGain }

  var hudEl = null; // main HUD div for extraction messages
  var hudTimeout = null;

  // ─── Key binding ─────────────────────────────────────────────────────────────
  var keysDown = {};

  function onKeyDown(e) {
    keysDown[e.code] = true;
    // Ctrl+Shift+E => call extraction
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') {
      callExtraction();
    }
    // E => grab rope
    if (e.code === 'KeyE' && state === 'rope_descending') {
      tryGrabRope();
    }
  }

  function onKeyUp(e) {
    keysDown[e.code] = false;
  }

  // ─── HUD helpers ─────────────────────────────────────────────────────────────
  function ensureHUD() {
    if (hudEl) return;
    hudEl = document.createElement('div');
    hudEl.id = 'heli-extraction-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'text-shadow:0 0 8px #00ff88',
      'pointer-events:none',
      'text-align:center',
      'z-index:9999',
      'letter-spacing:2px',
      'display:none'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function showHUD(msg, duration, color) {
    ensureHUD();
    hudEl.style.color = color || '#00ff88';
    hudEl.style.textShadow = '0 0 8px ' + (color || '#00ff88');
    hudEl.innerText = msg;
    hudEl.style.display = 'block';
    if (hudTimeout) clearTimeout(hudTimeout);
    if (duration) {
      hudTimeout = setTimeout(function () {
        if (hudEl) hudEl.style.display = 'none';
      }, duration);
    }
  }

  function hideHUD() {
    if (hudEl) hudEl.style.display = 'none';
    if (hudTimeout) clearTimeout(hudTimeout);
  }

  // ─── Web Audio: helicopter approach sound ────────────────────────────────────
  function startHeliSound() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (heliAudioNodes) stopHeliSound();

      // Main rotor oscillator at ~200 Hz
      var osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);

      // AM modulator at 8 Hz for blade slap
      var amOsc = audioCtx.createOscillator();
      amOsc.type = 'sine';
      amOsc.frequency.setValueAtTime(8, audioCtx.currentTime);

      var amGain = audioCtx.createGain();
      amGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      amOsc.connect(amGain);

      // Carrier gain node
      var carrierGain = audioCtx.createGain();
      carrierGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      amGain.connect(carrierGain.gain); // AM modulation

      // Master gain (quiet distant at first)
      var masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + totalETA);

      osc.connect(carrierGain);
      carrierGain.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      osc.start();
      amOsc.start();

      heliAudioNodes = { osc: osc, amOsc: amOsc, amGain: amGain, carrierGain: carrierGain, masterGain: masterGain };
    } catch (err) {
      // Web Audio not available — silently skip
    }
  }

  function stopHeliSound() {
    if (!heliAudioNodes) return;
    try {
      heliAudioNodes.osc.stop();
      heliAudioNodes.amOsc.stop();
    } catch (e) {}
    heliAudioNodes = null;
  }

  // ─── Helicopter mesh construction ────────────────────────────────────────────
  function buildHelicopter() {
    var THREE = window.THREE;
    var group = new THREE.Group();

    // Fuselage
    var fuselageGeo = new THREE.BoxGeometry(4, 1.5, 1.3);
    var oliveMat = new THREE.MeshLambertMaterial({ color: 0x4b5320 });
    var fuselage = new THREE.Mesh(fuselageGeo, oliveMat);
    fuselage.castShadow = true;
    group.add(fuselage);

    // Tail boom — angled up slightly
    var tailGeo = new THREE.CylinderGeometry(0.2, 0.1, 3, 8);
    var tailMat = new THREE.MeshLambertMaterial({ color: 0x4b5320 });
    var tailBoom = new THREE.Mesh(tailGeo, tailMat);
    tailBoom.position.set(-3.0, 0.3, 0);
    tailBoom.rotation.z = 0.2; // slight upward angle
    group.add(tailBoom);

    // Main rotor hub
    var rotorHub = new THREE.Group();
    rotorHub.position.set(0, 1.0, 0);
    group.add(rotorHub);
    mainRotor = rotorHub;

    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var blade1Geo = new THREE.BoxGeometry(0.1, 0.05, 2.5);
    var blade1 = new THREE.Mesh(blade1Geo, rotorMat);
    rotorHub.add(blade1);

    var blade2Geo = new THREE.BoxGeometry(0.1, 0.05, 2.5);
    var blade2 = new THREE.Mesh(blade2Geo, rotorMat);
    blade2.rotation.y = Math.PI / 2;
    rotorHub.add(blade2);

    // Tail rotor hub
    var tailRotorHub = new THREE.Group();
    tailRotorHub.position.set(-4.3, 0.5, 0.3);
    group.add(tailRotorHub);
    tailRotor = tailRotorHub;

    var tBladeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var tBlade1Geo = new THREE.BoxGeometry(0.05, 0.05, 0.8);
    var tBlade1 = new THREE.Mesh(tBlade1Geo, tBladeMat);
    tailRotorHub.add(tBlade1);

    var tBlade2Geo = new THREE.BoxGeometry(0.05, 0.05, 0.8);
    var tBlade2 = new THREE.Mesh(tBlade2Geo, tBladeMat);
    tBlade2.rotation.z = Math.PI / 2;
    tailRotorHub.add(tBlade2);

    // Landing skids
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var skidGeo1 = new THREE.CylinderGeometry(0.05, 0.05, 4, 6);
    var skid1 = new THREE.Mesh(skidGeo1, skidMat);
    skid1.rotation.z = Math.PI / 2;
    skid1.position.set(0, -1.0, 0.5);
    group.add(skid1);

    var skidGeo2 = new THREE.CylinderGeometry(0.05, 0.05, 4, 6);
    var skid2 = new THREE.Mesh(skidGeo2, skidMat);
    skid2.rotation.z = Math.PI / 2;
    skid2.position.set(0, -1.0, -0.5);
    group.add(skid2);

    // Searchlight (SpotLight pointing down)
    var spot = new THREE.SpotLight(0xffffff, 1.5, 40, Math.PI / 6, 0.3);
    spot.position.set(0.5, -1.2, 0);
    spot.target.position.set(0.5, -20, 0);
    group.add(spot);
    group.add(spot.target);
    searchlight = spot;

    return group;
  }

  function buildRope() {
    var THREE = window.THREE;
    // Start with height=0 so it's invisible; we'll scale it each frame
    var ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
    var ropeMat = new THREE.MeshLambertMaterial({ color: 0xd4a017 });
    var mesh = new THREE.Mesh(ropeGeo, ropeMat);
    mesh.geometry.translate(0, -0.5, 0); // pivot at top
    mesh.visible = false;
    return mesh;
  }

  // ─── Helicopter spawning ──────────────────────────────────────────────────────
  function spawnHeli() {
    var THREE = window.THREE;
    if (!scene || !THREE) return;

    heliGroup = buildHelicopter();
    landingZone = new THREE.Vector3(0, heliAltitude, -10);

    // Spawn 80 units away in a random horizontal direction from landing zone
    var angle = Math.random() * Math.PI * 2;
    spawnPosition = new THREE.Vector3(
      landingZone.x + Math.cos(angle) * 80,
      heliAltitude,
      landingZone.z + Math.sin(angle) * 80
    );

    heliGroup.position.copy(spawnPosition);
    scene.add(heliGroup);

    // Rope (added as child of heliGroup so it moves with it; but rope descends world-space)
    ropeMesh = buildRope();
    ropeMesh.position.set(0, -1.2, 0); // hang below fuselage
    heliGroup.add(ropeMesh);
    ropeObj = ropeMesh;
    ropeLengthCurrent = 0;
    ropeLengthTarget = 0;

    hoverPosition = landingZone.clone();
  }

  // ─── ETA HUD update ──────────────────────────────────────────────────────────
  function updateETAHUD() {
    var remaining = Math.ceil(totalETA - etaTimer);
    if (remaining > 0) {
      showHUD('EXTRACTION CALLED — ETA ' + remaining + 's', null, '#00ff88');
    } else {
      showHUD('HELICOPTER ARRIVING', null, '#00ff88');
    }
  }

  // ─── Public: callExtraction ───────────────────────────────────────────────────
  function callExtraction() {
    if (state !== 'idle') return;
    if (extractionUsedThisWave) {
      showHUD('EXTRACTION ALREADY USED THIS WAVE', 3000, '#ff8800');
      return;
    }
    if (cooldownActive) {
      showHUD('EXTRACTION ON COOLDOWN', 3000, '#ff8800');
      return;
    }
    if (window._bossActive) {
      showHUD('CANNOT EXTRACT DURING BOSS FIGHT', 3000, '#ff4444');
      return;
    }

    state = 'approaching';
    etaTimer = 0;
    hoverTimer = 0;

    startHeliSound();
    spawnHeli();
    showHUD('EXTRACTION CALLED — ETA ' + totalETA + 's', null, '#00ff88');
  }

  // ─── Try to grab rope ─────────────────────────────────────────────────────────
  function tryGrabRope() {
    if (state !== 'rope_descending') return;
    if (!playerRef) return;
    var THREE = window.THREE;

    // Compute world position of rope end
    var ropeWorldEnd = getRopeEndWorld();
    if (!ropeWorldEnd) return;

    var playerPos = playerRef.position;
    var dist = playerPos.distanceTo(ropeWorldEnd);

    if (dist <= 2.0) {
      state = 'lifting';
      liftTimer = 0;
      playerLifting = true;
      showHUD('GRAB ROPE — LIFTING…', null, '#00ff88');
    }
  }

  function getRopeEndWorld() {
    if (!heliGroup || !ropeMesh) return null;
    var THREE = window.THREE;
    // Rope hangs below heli; its end is at ropeLengthCurrent below ropeMesh's world position
    var ropeTop = new THREE.Vector3();
    ropeMesh.getWorldPosition(ropeTop);
    return new THREE.Vector3(ropeTop.x, ropeTop.y - ropeLengthCurrent, ropeTop.z);
  }

  // ─── Enemy proximity check ───────────────────────────────────────────────────
  function checkUnderFire() {
    if (!heliGroup) return false;
    var enemies = window._enemies || (window.Enemies && window.Enemies.getList ? window.Enemies.getList() : null);
    if (!enemies || !enemies.length) return false;
    var THREE = window.THREE;
    var heliPos = heliGroup.position;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var dx = e.position.x - heliPos.x;
      var dy = e.position.y - heliPos.y;
      var dz = e.position.z - heliPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 15) return true;
    }
    return false;
  }

  // ─── Evasive action ──────────────────────────────────────────────────────────
  function applyEvasive(dt) {
    underFireTimer += dt;
    if (underFireTimer > 0.5) {
      underFireTimer = 0;
      evasiveOffsetX = (Math.random() - 0.5) * 4; // ±2m
      evasiveOffsetZ = (Math.random() - 0.5) * 4;
      showHUD('HELICOPTER TAKING FIRE', 2000, '#ff4444');

      // Retract rope
      if (state === 'rope_descending' || state === 'hovering') {
        ropeLengthTarget = 0;
        state = 'hovering';
      }
    }

    if (hoverPosition && heliGroup) {
      heliGroup.position.x += (hoverPosition.x + evasiveOffsetX - heliGroup.position.x) * Math.min(1, dt * 3);
      heliGroup.position.z += (hoverPosition.z + evasiveOffsetZ - heliGroup.position.z) * Math.min(1, dt * 3);
    }
  }

  // ─── Depart ──────────────────────────────────────────────────────────────────
  function depart() {
    state = 'departing';
    stopHeliSound();
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────
  function cleanupHeli() {
    if (heliGroup && scene) {
      scene.remove(heliGroup);
    }
    heliGroup = null;
    mainRotor = null;
    tailRotor = null;
    searchlight = null;
    ropeMesh = null;
    ropeObj = null;
    ropeLengthCurrent = 0;
    ropeLengthTarget = 0;
    stopHeliSound();
    state = 'idle';
    playerLifting = false;
    underFireTimer = 0;
    evasiveOffsetX = 0;
    evasiveOffsetZ = 0;
    hideHUD();
  }

  // ─── Public: reset ────────────────────────────────────────────────────────────
  function reset() {
    cleanupHeli();
    extractionUsedThisWave = false;
    cooldownActive = false;
    hoverTimer = 0;
    etaTimer = 0;
  }

  // ─── Public: init ─────────────────────────────────────────────────────────────
  function init(opts) {
    opts = opts || {};
    scene = opts.scene || window._scene || null;
    camera = opts.camera || window._camera || null;
    renderer = opts.renderer || window._renderer || null;
    playerRef = opts.player || window._player || null;

    ensureHUD();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  // ─── Public: update ───────────────────────────────────────────────────────────
  function update(dt) {
    // Allow late binding of scene/player
    if (!scene) scene = window._scene || null;
    if (!playerRef) playerRef = window._player || null;
    if (!window.THREE) return;
    var THREE = window.THREE;

    // Spin rotors
    if (mainRotor) mainRotor.rotation.y += 5 * dt;
    if (tailRotor) tailRotor.rotation.x += 12 * dt;

    if (state === 'idle') return;

    // ── Approaching ────────────────────────────────────────────────────────────
    if (state === 'approaching') {
      etaTimer += dt;
      updateETAHUD();

      if (!heliGroup) return;

      var target = hoverPosition.clone();
      var toTarget = target.clone().sub(heliGroup.position);
      var distToTarget = toTarget.length();

      // Decelerate last 20 units
      var speed = heliSpeed;
      if (distToTarget < 20) {
        speed = heliSpeed * (distToTarget / 20);
        speed = Math.max(speed, 1.0);
      }

      if (distToTarget > 0.3) {
        var dir = toTarget.normalize();
        heliGroup.position.addScaledVector(dir, speed * dt);

        // Face direction of travel
        var angle = Math.atan2(dir.x, dir.z);
        heliGroup.rotation.y = angle;
      } else {
        heliGroup.position.copy(hoverPosition);
        state = 'hovering';
        hoverTimer = 0;
        showHUD('HELICOPTER HOVERING — DEPLOYING ROPE', 3000, '#00ff88');
        ropeLengthTarget = 0; // will be set in hover state
        ropeMesh.visible = true;

        // After 2s in hover, start rope descent
        setTimeout(function () {
          if (state === 'hovering') {
            state = 'rope_descending';
            ropeDescendTimer = 0;
            ropeLengthTarget = heliAltitude - 1.5; // from heli altitude down to y=1.5
          }
        }, 2000);
      }
    }

    // ── Hovering ──────────────────────────────────────────────────────────────
    if (state === 'hovering') {
      hoverTimer += dt;

      // Face player
      if (playerRef && heliGroup) {
        var px = playerRef.position.x - heliGroup.position.x;
        var pz = playerRef.position.z - heliGroup.position.z;
        var faceAngle = Math.atan2(px, pz);
        heliGroup.rotation.y += (faceAngle - heliGroup.rotation.y) * Math.min(1, dt * 2);
      }

      // Under fire check
      if (checkUnderFire()) {
        applyEvasive(dt);
      } else {
        underFireTimer = 0;
      }

      // Max hover time exceeded => depart
      if (hoverTimer > maxHoverTime) {
        depart();
      }
    }

    // ── Rope descending ───────────────────────────────────────────────────────
    if (state === 'rope_descending') {
      hoverTimer += dt;
      ropeDescendTimer += dt;

      // Face player
      if (playerRef && heliGroup) {
        var rpx = playerRef.position.x - heliGroup.position.x;
        var rpz = playerRef.position.z - heliGroup.position.z;
        var rfaceAngle = Math.atan2(rpx, rpz);
        heliGroup.rotation.y += (rfaceAngle - heliGroup.rotation.y) * Math.min(1, dt * 2);
      }

      // Under fire
      if (checkUnderFire()) {
        applyEvasive(dt);
        // rope retracts on evasive
      } else {
        underFireTimer = 0;
        evasiveOffsetX = 0;
        evasiveOffsetZ = 0;
      }

      // Grow rope
      var progress = Math.min(ropeDescendTimer / ropeDescendDuration, 1);
      ropeLengthCurrent = ropeLengthTarget * progress;

      // Update rope mesh scale (grows downward)
      if (ropeMesh) {
        ropeMesh.scale.y = Math.max(ropeLengthCurrent, 0.001);
      }

      // Show GRAB prompt if rope is near full
      if (progress > 0.9) {
        showHUD('GRAB ROPE [E]', null, '#00ff88');
      }

      // Check player nearby rope end
      if (playerRef) {
        var ropeEnd = getRopeEndWorld();
        if (ropeEnd) {
          var distToRope = playerRef.position.distanceTo(ropeEnd);
          if (distToRope <= 2.0) {
            showHUD('GRAB ROPE [E]', null, '#ffff00');
          }
        }
      }

      // Max hover exceeded
      if (hoverTimer > maxHoverTime) {
        depart();
      }
    }

    // ── Lifting ────────────────────────────────────────────────────────────────
    if (state === 'lifting') {
      liftTimer += dt;
      if (playerRef) {
        playerRef.position.y += 0.8 * dt;
      }

      var liftProgress = liftTimer / liftDuration;
      showHUD('LIFTING… ' + Math.floor(liftProgress * 100) + '%', null, '#00ff88');

      if (liftTimer >= liftDuration) {
        // Extraction complete
        state = 'departing';
        extractionUsedThisWave = true;
        cooldownActive = true;
        playerLifting = false;
        showHUD('EXTRACTION SUCCESSFUL! +5000 SCORE', 5000, '#00ff88');

        // Award score
        if (window._score !== undefined) {
          window._score += 5000;
        } else if (window.ScoreSystem && window.ScoreSystem.add) {
          window.ScoreSystem.add(5000);
        }

        // Trigger next wave after a delay
        setTimeout(function () {
          if (window._triggerNextWave) window._triggerNextWave();
          else if (window.WaveManager && window.WaveManager.nextWave) window.WaveManager.nextWave();
        }, 3000);

        depart();
      }
    }

    // ── Departing ─────────────────────────────────────────────────────────────
    if (state === 'departing') {
      if (!heliGroup) return;

      // Ascend then fly away
      heliGroup.position.y += 5 * dt;
      heliGroup.position.z -= 12 * dt; // fly away in -Z

      // Retract rope
      if (ropeMesh) {
        ropeLengthCurrent = Math.max(0, ropeLengthCurrent - 8 * dt);
        ropeMesh.scale.y = Math.max(ropeLengthCurrent, 0.001);
      }

      // Far enough away => cleanup
      if (heliGroup.position.y > 60 || heliGroup.position.z < -200) {
        cleanupHeli();
      }
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    callExtraction: callExtraction,
    reset: reset
  };

})();
