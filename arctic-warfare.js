window.ArcticWarfare = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var renderer = null;

  var arcticActive = false;
  var originalAmbient = null;
  var arcticAmbient = null;
  var originalFog = null;
  var snowDrifts = [];
  var snowParticles = [];
  var snowParticleData = [];

  // Blizzard
  var blizzardActive = false;
  var blizzardTimer = 0;
  var blizzardDuration = 45;
  var blizzardFadeIn = 3;
  var blizzardFadeOut = 5;
  var blizzardIntensity = 0;
  var originalFogDensity = 0.018;
  var blizzardFogDensity = 0.06;

  // Frostbite
  var temperature = 100;
  var frostStatus = 'NONE';
  var vignetteEl = null;

  // Campfires
  var campfires = [];
  var playerHP = 100;

  // Camouflage
  var camoActive = false;
  var camoTimer = 0;
  var camoCooldown = 0;
  var camoDuration = 30;
  var camoCooldownMax = 60;
  var camoOverlay = null;

  // Ice surfaces
  var iceSurfaces = [];
  var playerMomentum = { x: 0, z: 0 };
  var onIce = false;
  var iceSlideTimer = 0;

  // Ski poles
  var skiActive = false;
  var skiSpeedMult = 1.5;

  // Arctic enemies
  var arcticEnemies = [];

  // Snowmobile
  var snowmobile = null;
  var snowmobileDisabled = false;
  var snowmobileSpeed = 12;

  // HUD
  var hudEl = null;

  // Key tracking
  var keys = {};

  // Player speed modifier (exposed for integration)
  var speedModifier = 1.0;
  var canShoot = true;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── Snow Terrain ──────────────────────────────────────────────────────────

  function buildSnowTerrain() {
    if (!scene) { return; }

    // Replace ambient light
    scene.traverse(function (obj) {
      if (obj.isAmbientLight && !obj._arcticReplaced) {
        originalAmbient = obj;
        obj.visible = false;
      }
    });

    arcticAmbient = new THREE.AmbientLight(0xDDEEFF, 1.0);
    arcticAmbient._arcticOwned = true;
    scene.add(arcticAmbient);

    // Fog
    originalFog = scene.fog;
    scene.fog = new THREE.FogExp2(0xBBCCDD, originalFogDensity);

    // Snow drifts – 15 squashed spheres
    var driftMat = new THREE.MeshLambertMaterial({ color: 0xEEEEFF });
    for (var i = 0; i < 15; i++) {
      var r = rand(1, 3);
      var geo = new THREE.SphereGeometry(r, 8, 6);
      var mesh = new THREE.Mesh(geo, driftMat);
      mesh.scale.set(1, 0.25, 1);
      mesh.position.set(rand(-40, 40), 0, rand(-40, 40));
      mesh._arcticOwned = true;
      scene.add(mesh);
      snowDrifts.push(mesh);
    }
  }

  function removeSnowTerrain() {
    if (!scene) { return; }

    if (originalAmbient) {
      originalAmbient.visible = true;
    }
    if (arcticAmbient) {
      scene.remove(arcticAmbient);
      arcticAmbient = null;
    }
    scene.fog = originalFog || null;

    for (var i = 0; i < snowDrifts.length; i++) {
      scene.remove(snowDrifts[i]);
    }
    snowDrifts = [];
  }

  // ── Snowfall ──────────────────────────────────────────────────────────────

  function buildSnowfall() {
    if (!scene) { return; }
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    var geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    for (var i = 0; i < 200; i++) {
      var mesh = new THREE.Mesh(geo, mat);
      var px = rand(-50, 50);
      var py = rand(0, 50);
      var pz = rand(-50, 50);
      mesh.position.set(px, py, pz);
      mesh._arcticOwned = true;
      scene.add(mesh);
      snowParticles.push(mesh);
      snowParticleData.push({ phase: rand(0, Math.PI * 2) });
    }
  }

  function removeSnowfall() {
    for (var i = 0; i < snowParticles.length; i++) {
      if (scene) { scene.remove(snowParticles[i]); }
    }
    snowParticles = [];
    snowParticleData = [];
  }

  function updateSnowfall(dt, time) {
    var count = snowParticles.length;
    var speedMult = blizzardActive ? 5 : 1;
    var windMult = blizzardActive ? 3 : 1;
    for (var i = 0; i < count; i++) {
      var p = snowParticles[i];
      var d = snowParticleData[i];
      p.position.y -= 0.5 * speedMult * dt;
      p.position.x += Math.sin(time + d.phase) * 0.02 * windMult;
      if (p.position.y <= 0) {
        p.position.y = 50;
        p.position.x = rand(-50, 50);
        p.position.z = rand(-50, 50);
      }
    }
  }

  // ── Blizzard ──────────────────────────────────────────────────────────────

  function startBlizzard() {
    if (!arcticActive) { return; }
    blizzardActive = true;
    blizzardTimer = 0;
    blizzardIntensity = 0;
  }

  function updateBlizzard(dt) {
    if (!blizzardActive) { return; }
    blizzardTimer += dt;

    if (blizzardTimer < blizzardFadeIn) {
      blizzardIntensity = blizzardTimer / blizzardFadeIn;
    } else if (blizzardTimer < blizzardDuration - blizzardFadeOut) {
      blizzardIntensity = 1.0;
    } else if (blizzardTimer < blizzardDuration) {
      blizzardIntensity = (blizzardDuration - blizzardTimer) / blizzardFadeOut;
    } else {
      blizzardActive = false;
      blizzardIntensity = 0;
      if (scene && scene.fog) {
        scene.fog.density = originalFogDensity;
      }
      speedModifier = recalcSpeed();
      return;
    }

    // Adjust fog density
    if (scene && scene.fog) {
      scene.fog.density = originalFogDensity + (blizzardFogDensity - originalFogDensity) * blizzardIntensity;
    }

    speedModifier = recalcSpeed();
  }

  // ── Frostbite ─────────────────────────────────────────────────────────────

  function updateFrostbite(dt) {
    if (!arcticActive) {
      // Warm up slowly when not in arctic mode
      temperature = Math.min(100, temperature + 5 * dt);
      frostStatus = 'NONE';
      updateVignette(false);
      return;
    }

    // Check proximity to campfires
    var nearFire = false;
    var playerPos = camera ? camera.position : new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < campfires.length; i++) {
      if (distXZ(playerPos, campfires[i].position) < 5) {
        nearFire = true;
        break;
      }
    }

    if (nearFire) {
      temperature = Math.min(100, temperature + 2 * dt);
    } else {
      temperature = Math.max(0, temperature - 1 * dt);
    }

    if (temperature < 10) {
      frostStatus = 'HYPOTHERMIA';
      playerHP = Math.max(0, playerHP - 2 * dt);
      updateVignette(true);
    } else if (temperature < 30) {
      frostStatus = 'FROST HANDS';
      updateVignette(false);
    } else {
      frostStatus = 'NONE';
      updateVignette(false);
    }

    speedModifier = recalcSpeed();
  }

  function recalcSpeed() {
    var s = 1.0;
    if (blizzardActive) { s *= (1 - 0.3 * blizzardIntensity); }
    if (temperature < 30) { s *= 0.80; }
    if (skiActive && arcticActive) { s *= skiSpeedMult; }
    return s;
  }

  function updateVignette(active) {
    if (!vignetteEl) { return; }
    vignetteEl.style.display = active ? 'block' : 'none';
  }

  // ── Campfires ─────────────────────────────────────────────────────────────

  function buildCampfires() {
    if (!scene) { return; }
    var positions = [
      new THREE.Vector3(10, 0.5, 10),
      new THREE.Vector3(-15, 0.5, 5),
      new THREE.Vector3(5, 0.5, -20)
    ];
    var fireMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var fireGeo = new THREE.SphereGeometry(0.5, 8, 6);
    for (var i = 0; i < positions.length; i++) {
      var mesh = new THREE.Mesh(fireGeo, fireMat);
      mesh.position.copy(positions[i]);
      mesh._arcticOwned = true;
      scene.add(mesh);

      var light = new THREE.PointLight(0xFF6600, 1.5, 10);
      light.position.copy(positions[i]);
      light._arcticOwned = true;
      scene.add(light);

      campfires.push(mesh);
    }
  }

  function removeCampfires() {
    if (!scene) { return; }
    for (var i = 0; i < campfires.length; i++) {
      scene.remove(campfires[i]);
    }
    campfires = [];
    // Remove orphan point lights
    var toRemove = [];
    scene.traverse(function (obj) {
      if (obj.isPointLight && obj._arcticOwned) {
        toRemove.push(obj);
      }
    });
    for (var j = 0; j < toRemove.length; j++) {
      scene.remove(toRemove[j]);
    }
  }

  // ── Arctic Camouflage ─────────────────────────────────────────────────────

  function activateCamo() {
    if (camoCooldown > 0 || camoActive) { return; }
    camoActive = true;
    camoTimer = camoDuration;
    if (camoOverlay) { camoOverlay.style.display = 'block'; }
    // Reduce enemy detection range (flag checked in enemy update)
    for (var i = 0; i < arcticEnemies.length; i++) {
      arcticEnemies[i]._camoReduced = true;
    }
  }

  function updateCamo(dt) {
    if (camoActive) {
      camoTimer -= dt;
      if (camoTimer <= 0) {
        camoActive = false;
        camoCooldown = camoCooldownMax;
        if (camoOverlay) { camoOverlay.style.display = 'none'; }
        for (var i = 0; i < arcticEnemies.length; i++) {
          arcticEnemies[i]._camoReduced = false;
        }
      }
    }
    if (camoCooldown > 0) {
      camoCooldown = Math.max(0, camoCooldown - dt);
    }
  }

  // ── Ice Surfaces ──────────────────────────────────────────────────────────

  function buildIceSurfaces() {
    if (!scene) { return; }
    var iceMat = new THREE.MeshLambertMaterial({ color: 0x99CCDD, transparent: true, opacity: 0.75 });
    var iceGeo = new THREE.BoxGeometry(8, 0.1, 8);
    for (var i = 0; i < 5; i++) {
      var mesh = new THREE.Mesh(iceGeo, iceMat);
      mesh.position.set(rand(-35, 35), 0.05, rand(-35, 35));
      mesh._arcticOwned = true;
      scene.add(mesh);
      iceSurfaces.push(mesh);
    }
  }

  function removeIceSurfaces() {
    if (!scene) { return; }
    for (var i = 0; i < iceSurfaces.length; i++) {
      scene.remove(iceSurfaces[i]);
    }
    iceSurfaces = [];
  }

  function checkIce() {
    if (!camera) { return false; }
    var p = camera.position;
    for (var i = 0; i < iceSurfaces.length; i++) {
      var ice = iceSurfaces[i];
      var dx = Math.abs(p.x - ice.position.x);
      var dz = Math.abs(p.z - ice.position.z);
      if (dx < 4 && dz < 4) { return true; }
    }
    return false;
  }

  function updateIce(dt) {
    var wasOnIce = onIce;
    onIce = checkIce();

    if (onIce) {
      iceSlideTimer = 2.0;
    } else if (iceSlideTimer > 0) {
      iceSlideTimer -= dt;
    }

    // Momentum carries for 2s after leaving ice
    if (iceSlideTimer > 0 && !onIce) {
      // momentum continues – handled externally via speedModifier
    }
  }

  // ── Ski Poles ─────────────────────────────────────────────────────────────

  function toggleSki() {
    skiActive = !skiActive;
    canShoot = !skiActive;
    speedModifier = recalcSpeed();
  }

  // ── Arctic Enemies ────────────────────────────────────────────────────────

  function buildArcticEnemies() {
    if (!scene) { return; }
    var mat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
    var geo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
    for (var i = 0; i < 4; i++) {
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(rand(-30, 30), 0.9, rand(-30, 30));
      mesh._arcticOwned = true;
      mesh._camoReduced = false;
      mesh._speed = 2.5;
      mesh._accuracy = 1.0;
      scene.add(mesh);
      arcticEnemies.push(mesh);
    }
  }

  function removeArcticEnemies() {
    if (!scene) { return; }
    for (var i = 0; i < arcticEnemies.length; i++) {
      scene.remove(arcticEnemies[i]);
    }
    arcticEnemies = [];
  }

  function updateArcticEnemies(dt) {
    var playerPos = camera ? camera.position : new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < arcticEnemies.length; i++) {
      var e = arcticEnemies[i];
      var blizzardPenalty = blizzardActive ? 0.5 : 1.0;
      var s = e._speed * blizzardPenalty;
      var dx = playerPos.x - e.position.x;
      var dz = playerPos.z - e.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 1) {
        e.position.x += (dx / dist) * s * dt;
        e.position.z += (dz / dist) * s * dt;
      }
      // Detection range reduced when player camo active
      var detectionRange = e._camoReduced ? 10 : 20;
      e._canDetect = dist < detectionRange;
      e._accuracy = blizzardActive ? 0.5 : 1.0;
    }
  }

  // ── Snowmobile ────────────────────────────────────────────────────────────

  function buildSnowmobile() {
    if (!scene) { return; }
    var bodyGeo = new THREE.BoxGeometry(4, 1, 2);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);

    var runnerGeo = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
    var runnerMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    var runner1 = new THREE.Mesh(runnerGeo, runnerMat);
    runner1.rotation.z = Math.PI / 2;
    runner1.position.set(0, -0.5, 0.6);
    var runner2 = new THREE.Mesh(runnerGeo, runnerMat);
    runner2.rotation.z = Math.PI / 2;
    runner2.position.set(0, -0.5, -0.6);

    var pivot = new THREE.Group();
    pivot.add(body);
    pivot.add(runner1);
    pivot.add(runner2);
    pivot.position.set(rand(-40, 40), 0.5, rand(-40, 40));
    pivot._arcticOwned = true;
    pivot._disabled = false;
    scene.add(pivot);
    snowmobile = pivot;
  }

  function removeSnowmobile() {
    if (!scene || !snowmobile) { return; }
    scene.remove(snowmobile);
    snowmobile = null;
    snowmobileDisabled = false;
  }

  function updateSnowmobile(dt) {
    if (!snowmobile || snowmobileDisabled) { return; }
    var playerPos = camera ? camera.position : new THREE.Vector3(0, 0, 0);
    var dx = playerPos.x - snowmobile.position.x;
    var dz = playerPos.z - snowmobile.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 1.5) {
      snowmobile.position.x += (dx / dist) * snowmobileSpeed * dt;
      snowmobile.position.z += (dz / dist) * snowmobileSpeed * dt;
    }
  }

  function tryDisableSnowmobile() {
    if (!snowmobile || snowmobileDisabled) { return; }
    var playerPos = camera ? camera.position : new THREE.Vector3(0, 0, 0);
    var dist = distXZ(playerPos, snowmobile.position);
    if (dist < 3) {
      snowmobileDisabled = true;
      snowmobile.position.y = 0.3;
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'arctic-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'right:16px',
      'font-family:monospace',
      'font-size:13px',
      'color:#CCFFFF',
      'background:rgba(0,20,40,0.65)',
      'padding:6px 10px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function buildVignette() {
    vignetteEl = document.createElement('div');
    vignetteEl.id = 'arctic-vignette';
    vignetteEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9998',
      'background:radial-gradient(ellipse at center, transparent 40%, rgba(0,30,80,0.7) 100%)',
      'display:none'
    ].join(';');
    document.body.appendChild(vignetteEl);
  }

  function buildCamoOverlay() {
    camoOverlay = document.createElement('div');
    camoOverlay.id = 'arctic-camo-overlay';
    camoOverlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9997',
      'border:8px solid rgba(255,255,255,0.35)',
      'box-sizing:border-box',
      'display:none'
    ].join(';');
    document.body.appendChild(camoOverlay);
  }

  function updateHUD() {
    if (!hudEl) { return; }
    if (!arcticActive) {
      hudEl.style.display = 'none';
      return;
    }
    hudEl.style.display = 'block';

    var tempStr = Math.round(temperature) + '°C';
    var frostLabel = frostStatus === 'NONE' ? 'MILD' : frostStatus;
    var blizzLabel = blizzardActive ? ('ACTIVE ' + Math.round(blizzardDuration - blizzardTimer) + 's') : 'INACTIVE';
    var skiLabel = skiActive ? 'ON' : 'OFF';
    hudEl.textContent = 'ARCTIC [TEMP: ' + tempStr + '] [FROST: ' + frostLabel + '] [BLIZZARD: ' + blizzLabel + '] | SKI: ' + skiLabel;
  }

  // ── Key Handlers ──────────────────────────────────────────────────────────

  function onKeyDown(e) {
    keys[e.code] = true;
    if (!arcticActive && e.code === 'KeyA') {
      enableArctic();
      return;
    }
    if (arcticActive) {
      if (e.code === 'KeyA') {
        disableArctic();
        return;
      }
      if (e.code === 'KeyW') {
        startBlizzard();
        return;
      }
      if (e.code === 'KeyC') {
        activateCamo();
        return;
      }
      if (e.code === 'KeyS') {
        toggleSki();
        return;
      }
      if (e.code === 'KeyE') {
        tryDisableSnowmobile();
        return;
      }
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  // ── Enable / Disable ──────────────────────────────────────────────────────

  function enableArctic() {
    if (arcticActive) { return; }
    arcticActive = true;
    buildSnowTerrain();
    buildSnowfall();
    buildCampfires();
    buildIceSurfaces();
    buildArcticEnemies();
    buildSnowmobile();
    if (hudEl) { hudEl.style.display = 'block'; }
  }

  function disableArctic() {
    if (!arcticActive) { return; }
    arcticActive = false;
    blizzardActive = false;
    blizzardIntensity = 0;
    skiActive = false;
    camoActive = false;
    camoCooldown = 0;
    speedModifier = 1.0;
    canShoot = true;
    removeSnowTerrain();
    removeSnowfall();
    removeCampfires();
    removeIceSurfaces();
    removeArcticEnemies();
    removeSnowmobile();
    if (hudEl) { hudEl.style.display = 'none'; }
    if (vignetteEl) { vignetteEl.style.display = 'none'; }
    if (camoOverlay) { camoOverlay.style.display = 'none'; }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init(threeScene, threeCamera, threeRenderer) {
    scene = threeScene || null;
    camera = threeCamera || null;
    renderer = threeRenderer || null;

    buildHUD();
    buildVignette();
    buildCamoOverlay();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  var _time = 0;
  var _lastTs = null;

  function update(deltaTime) {
    var dt = (typeof deltaTime === 'number' && deltaTime > 0) ? deltaTime : 0.016;
    _time += dt;

    if (!arcticActive) {
      updateFrostbite(dt);
      updateHUD();
      return;
    }

    updateSnowfall(dt, _time);
    updateBlizzard(dt);
    updateFrostbite(dt);
    updateCamo(dt);
    updateIce(dt);
    updateArcticEnemies(dt);
    updateSnowmobile(dt);
    updateHUD();
  }

  function reset() {
    disableArctic();
    temperature = 100;
    playerHP = 100;
    frostStatus = 'NONE';
    _time = 0;
    if (vignetteEl) { vignetteEl.style.display = 'none'; }
  }

  return {
    init: init,
    update: update,
    reset: reset,
    // Expose read-only state for integration
    getState: function () {
      return {
        arcticActive: arcticActive,
        temperature: temperature,
        frostStatus: frostStatus,
        blizzardActive: blizzardActive,
        blizzardIntensity: blizzardIntensity,
        speedModifier: speedModifier,
        canShoot: canShoot,
        skiActive: skiActive,
        camoActive: camoActive,
        onIce: onIce,
        playerHP: playerHP
      };
    }
  };

}());
