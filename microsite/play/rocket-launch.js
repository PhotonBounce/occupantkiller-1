window.RocketLaunch = (function() {
  'use strict';

  var scene, camera;
  var meshes = {};
  var state = {
    countdownSeconds: 90,
    launchAborted: false,
    teamOnSite: 4,
    keyStates: {},
    lastHPressTime: 0,
    lastJPressTime: 0,
    rocketVibration: 0,
    exhaustGlowIntensity: 0.3,
    gantryArmAngle: 0
  };

  function createMaterial(color, options) {
    options = options || {};
    var matOpts = { color: color };
    if (options.emissive) matOpts.emissive = options.emissive;
    if (options.emissiveIntensity !== undefined) matOpts.emissiveIntensity = options.emissiveIntensity;
    return new THREE.MeshPhongMaterial(matOpts);
  }

  function addBoxMesh(name, width, height, depth, x, y, z, color, options) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = createMaterial(color, options);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes[name] = mesh;
    return mesh;
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 300, 1000);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 300;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Ground plane
    var groundGeo = new THREE.BoxGeometry(400, 0.2, 400);
    var groundMat = new THREE.MeshPhongMaterial({ color: 0x8b8000 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // 1. Launch pad floor — concrete blast pad
    addBoxMesh('launchpad', 80, 0.3, 80, 0, 0, 0, 0x888888);

    // 2. Rocket body — 5 stacked boxes, narrowing upward
    addBoxMesh('rocket_base', 12, 8, 12, 0, 10, 0, 0xf0f0f0);
    addBoxMesh('rocket_mid1', 10, 10, 10, 0, 20, 0, 0xf0f0f0);
    addBoxMesh('rocket_mid2', 8, 10, 8, 0, 32, 0, 0xf0f0f0);
    addBoxMesh('rocket_mid3', 6, 10, 6, 0, 42, 0, 0xf0f0f0);
    addBoxMesh('rocket_upper', 4, 8, 4, 0, 50, 0, 0xf0f0f0);

    // 3. Rocket nose cone — 3 stacked narrow boxes
    addBoxMesh('nose_cone_lower', 3, 4, 3, 0, 58, 0, 0xcc0000);
    addBoxMesh('nose_cone_mid', 2, 3, 2, 0, 62, 0, 0xcc0000);
    addBoxMesh('nose_cone_top', 1, 2, 1, 0, 64, 0, 0xcc0000);

    // 4. Rocket engine nozzles — 4 at base corners
    addBoxMesh('nozzle_1', 2, 3, 2, 4, 4, 4, 0xff6600, { emissive: 0xff3300, emissiveIntensity: 0.5 });
    addBoxMesh('nozzle_2', 2, 3, 2, -4, 4, 4, 0xff6600, { emissive: 0xff3300, emissiveIntensity: 0.5 });
    addBoxMesh('nozzle_3', 2, 3, 2, 4, 4, -4, 0xff6600, { emissive: 0xff3300, emissiveIntensity: 0.5 });
    addBoxMesh('nozzle_4', 2, 3, 2, -4, 4, -4, 0xff6600, { emissive: 0xff3300, emissiveIntensity: 0.5 });

    // 5. Launch gantry — tall steel A-frame structure
    addBoxMesh('gantry_left_leg', 1, 45, 1, -20, 22, 0, 0x444444);
    addBoxMesh('gantry_right_leg', 1, 45, 1, 20, 22, 0, 0x444444);
    addBoxMesh('gantry_top_beam', 45, 1, 1, 0, 45, 0, 0x555555);
    addBoxMesh('gantry_crossbeam', 1, 1, 30, 0, 25, 0, 0x555555);
    addBoxMesh('gantry_arm_base', 2, 2, 5, -16, 40, 0, 0x666666);
    addBoxMesh('gantry_arm_pull', 12, 2, 2, -22, 38, 0, 0x777777);

    // 6. Umbilical fuel lines — flexible box tubes
    addBoxMesh('fuel_line_1', 1, 20, 1, -10, 25, 3, 0x333333);
    addBoxMesh('fuel_line_2', 1, 20, 1, 10, 25, 3, 0x333333);
    addBoxMesh('fuel_line_3', 1, 20, 1, 0, 25, -8, 0x333333);

    // 7a. Support building (bunker 1)
    addBoxMesh('bunker_1_main', 15, 8, 12, -40, 4, 35, 0x444444);
    addBoxMesh('bunker_1_window1', 2, 1.5, 0.3, -35, 5, 35.2, 0x222222);
    addBoxMesh('bunker_1_window2', 2, 1.5, 0.3, -45, 5, 35.2, 0x222222);

    // 7b. Support building (bunker 2)
    addBoxMesh('bunker_2_main', 15, 8, 12, 40, 4, 35, 0x555555);
    addBoxMesh('bunker_2_window1', 2, 1.5, 0.3, 35, 5, 35.2, 0x222222);
    addBoxMesh('bunker_2_window2', 2, 1.5, 0.3, 45, 5, 35.2, 0x222222);

    // 8. Enemy missile guard figures — 5 desert camo boxes
    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var radius = 50;
      var gx = Math.cos(angle) * radius;
      var gz = Math.sin(angle) * radius;
      addBoxMesh('guard_' + i, 1.5, 3, 1, gx, 1.5, gz, 0x8b7355);
    }

    // 9. Special forces assault team — 4 dark boxes advancing
    addBoxMesh('soldier_1', 1, 2.5, 0.8, -30, 1.25, -35, 0x222222);
    addBoxMesh('soldier_2', 1, 2.5, 0.8, -25, 1.25, -30, 0x222222);
    addBoxMesh('soldier_3', 1, 2.5, 0.8, 30, 1.25, -35, 0x222222);
    addBoxMesh('soldier_4', 1, 2.5, 0.8, 25, 1.25, -30, 0x222222);

    // 10. Blast deflector trench — recessed channel below rocket
    addBoxMesh('blast_deflector_left', 2, 0.5, 20, -8, 0.3, 0, 0x666666);
    addBoxMesh('blast_deflector_right', 2, 0.5, 20, 8, 0.3, 0, 0x666666);
    addBoxMesh('blast_deflector_bottom', 16, 0.5, 2, 0, -0.2, 0, 0x666666);

    // 11. Fueling truck
    addBoxMesh('truck_cab', 3, 2.5, 4, -50, 1.25, 0, 0xffff00);
    addBoxMesh('truck_bed', 4, 2, 8, -42, 1, 0, 0xffcc00);
    addBoxMesh('truck_tank', 3, 2, 3, -36, 1.5, 0, 0xffaa00);
    addBoxMesh('truck_hose_line', 0.5, 15, 0.5, -28, 8, 0, 0x333333);

    // 12. Countdown clock display — large emissive red panel
    addBoxMesh('countdown_display', 10, 6, 0.5, 0, 35, -25, 0xcc0000, { emissive: 0xff0000, emissiveIntensity: 0.6 });

    // 13. Perimeter razor wire fence — thin segments
    for (var f = 0; f < 8; f++) {
      var fx = Math.cos((f / 8) * Math.PI * 2) * 70;
      var fz = Math.sin((f / 8) * Math.PI * 2) * 70;
      addBoxMesh('fence_' + f, 0.3, 2, 15, fx, 1, fz, 0x888800);
    }

    // 14. Control bunker — reinforced box structure
    addBoxMesh('control_bunker_main', 20, 10, 15, -60, 5, -50, 0x333333);
    addBoxMesh('control_bunker_door', 3, 4, 0.5, -60, 3, -57.5, 0x111111);
    addBoxMesh('control_bunker_roof', 22, 1, 17, -60, 10, -50, 0x444444);

    // 15. Rocket exhaust ignition — emissive cluster at nozzles
    addBoxMesh('exhaust_1', 1.5, 2, 1.5, 4, 1, 4, 0xff6600, { emissive: 0xffff00, emissiveIntensity: 0.4 });
    addBoxMesh('exhaust_2', 1.5, 2, 1.5, -4, 1, 4, 0xff6600, { emissive: 0xffff00, emissiveIntensity: 0.4 });
    addBoxMesh('exhaust_3', 1.5, 2, 1.5, 4, 1, -4, 0xff6600, { emissive: 0xffff00, emissiveIntensity: 0.4 });
    addBoxMesh('exhaust_4', 1.5, 2, 1.5, -4, 1, -4, 0xff6600, { emissive: 0xffff00, emissiveIntensity: 0.4 });

    // 16. Launch escape tower — tall lattice-like structure
    addBoxMesh('escape_tower_pole', 1.5, 50, 1.5, 15, 25, 0, 0x555555);
    addBoxMesh('escape_capsule', 3, 3, 3, 15, 52, 0, 0x0088ff);
    addBoxMesh('escape_chute_pack', 2, 1, 2, 15, 50, 0, 0xffff00);

    // Set camera initial position
    camera.position.set(80, 40, 100);
    camera.lookAt(0, 25, 0);

    // Keyboard state tracking
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    createHUD();
  }

  function handleKeyDown(event) {
    var key = event.key.toLowerCase();
    state.keyStates[key] = true;

    if (key === 'h') {
      var now = Date.now();
      if (now - state.lastHPressTime < 400) {
        state.lastHPressTime = 0;
        state.lastJPressTime = 0;
      } else {
        state.lastHPressTime = now;
      }
    }

    if (key === 'j') {
      var now = Date.now();
      if (state.lastHPressTime > 0 && now - state.lastHPressTime < 400) {
        state.launchAborted = true;
        console.log('LAUNCH ABORTED!');
      }
      state.lastJPressTime = now;
    }
  }

  function handleKeyUp(event) {
    var key = event.key.toLowerCase();
    state.keyStates[key] = false;
  }

  function createHUD() {
    var hudCanvas = document.createElement('canvas');
    hudCanvas.width = 512;
    hudCanvas.height = 128;
    var hudCtx = hudCanvas.getContext('2d');

    hudCtx.fillStyle = '#000000aa';
    hudCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudCtx.fillStyle = '#00ff00';
    hudCtx.font = 'bold 20px monospace';
    hudCtx.fillText('COUNTDOWN: T-' + Math.max(0, Math.floor(state.countdownSeconds)) + 's', 20, 40);
    hudCtx.fillText('LAUNCH ABORTED: ' + (state.launchAborted ? 'YES' : 'NO'), 20, 70);
    hudCtx.fillText('TEAM ON SITE: ' + state.teamOnSite, 20, 100);

    var texture = new THREE.CanvasTexture(hudCanvas);
    texture.minFilter = THREE.LinearFilter;
    var hudGeom = new THREE.BoxGeometry(12, 3, 0.1);
    var hudMat = new THREE.MeshBasicMaterial({ map: texture });
    var hudMesh = new THREE.Mesh(hudGeom, hudMat);
    hudMesh.position.set(camera.position.x - 8, camera.position.y, camera.position.z + 5);
    scene.add(hudMesh);
    meshes.hud = hudMesh;
  }

  function update(delta) {
    // Countdown timer
    if (!state.launchAborted && state.countdownSeconds > 0) {
      state.countdownSeconds -= delta;
    }

    // Rocket vibration
    state.rocketVibration = Math.sin(Date.now() * 0.005) * 0.15;
    if (meshes.rocket_base) {
      meshes.rocket_base.position.y = 10 + state.rocketVibration;
      meshes.rocket_mid1.position.y = 20 + state.rocketVibration;
      meshes.rocket_mid2.position.y = 32 + state.rocketVibration;
      meshes.rocket_mid3.position.y = 42 + state.rocketVibration;
      meshes.rocket_upper.position.y = 50 + state.rocketVibration;
      meshes.nose_cone_lower.position.y = 58 + state.rocketVibration;
      meshes.nose_cone_mid.position.y = 62 + state.rocketVibration;
      meshes.nose_cone_top.position.y = 64 + state.rocketVibration;
    }

    // Exhaust glow intensifies
    if (!state.launchAborted) {
      state.exhaustGlowIntensity = 0.3 + Math.sin(Date.now() * 0.008) * 0.4;
      var exhaustNames = ['exhaust_1', 'exhaust_2', 'exhaust_3', 'exhaust_4'];
      for (var i = 0; i < exhaustNames.length; i++) {
        if (meshes[exhaustNames[i]]) {
          meshes[exhaustNames[i]].material.emissiveIntensity = state.exhaustGlowIntensity;
        }
      }
      var nozzleNames = ['nozzle_1', 'nozzle_2', 'nozzle_3', 'nozzle_4'];
      for (var n = 0; n < nozzleNames.length; n++) {
        if (meshes[nozzleNames[n]]) {
          meshes[nozzleNames[n]].material.emissiveIntensity = state.exhaustGlowIntensity * 0.8;
        }
      }
    }

    // Gantry arms pull back
    state.gantryArmAngle = Math.sin(Date.now() * 0.003) * 0.3;
    if (meshes.gantry_arm_pull) {
      meshes.gantry_arm_pull.position.x = -22 - state.gantryArmAngle * 5;
    }

    // Special forces advance
    var advanceOffset = (Date.now() * 0.01) % 20;
    if (meshes.soldier_1) {
      meshes.soldier_1.position.z -= delta * 2;
      meshes.soldier_2.position.z -= delta * 1.8;
      meshes.soldier_3.position.z -= delta * 2;
      meshes.soldier_4.position.z -= delta * 1.8;
    }

    // Fuel lines disconnect animation
    if (meshes.fuel_line_1) {
      var disconnectPhase = (Date.now() * 0.001) % 1;
      meshes.fuel_line_1.position.x = -10 + disconnectPhase * 2;
      meshes.fuel_line_2.position.x = 10 - disconnectPhase * 2;
    }

    // Countdown display pulse
    if (meshes.countdown_display) {
      var pulseIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.4;
      meshes.countdown_display.material.emissiveIntensity = pulseIntensity;
    }

    // Update HUD
    if (meshes.hud) {
      meshes.hud.position.copy(camera.position);
      meshes.hud.position.x -= 8;
      meshes.hud.position.z += 5;
    }
  }

  function reset() {
    state.countdownSeconds = 90;
    state.launchAborted = false;
    state.teamOnSite = 4;
    state.rocketVibration = 0;
    state.exhaustGlowIntensity = 0.3;
    state.gantryArmAngle = 0;

    if (meshes.rocket_base) {
      meshes.rocket_base.position.y = 10;
      meshes.rocket_mid1.position.y = 20;
      meshes.rocket_mid2.position.y = 32;
      meshes.rocket_mid3.position.y = 42;
      meshes.rocket_upper.position.y = 50;
      meshes.nose_cone_lower.position.y = 58;
      meshes.nose_cone_mid.position.y = 62;
      meshes.nose_cone_top.position.y = 64;
    }

    if (meshes.soldier_1) {
      meshes.soldier_1.position.z = -35;
      meshes.soldier_2.position.z = -30;
      meshes.soldier_3.position.z = -35;
      meshes.soldier_4.position.z = -30;
    }

    if (meshes.fuel_line_1) {
      meshes.fuel_line_1.position.x = -10;
      meshes.fuel_line_2.position.x = 10;
    }

    if (meshes.gantry_arm_pull) {
      meshes.gantry_arm_pull.position.x = -22;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
