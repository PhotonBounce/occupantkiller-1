window.MetroAssault = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;
  var container, hudEl, hudCanvas, hudCtx;
  var lastMPress = -9999;
  var keyState = {};

  // Scene object tracking for disposal
  var allMeshes = [];
  var allLines = [];

  // Animated objects
  var trainCars = [];
  var terroristFigures = [];
  var ctFigures = [];
  var hostageFigures = [];
  var emergencyLights = [];
  var explosiveLED = null;
  var animTime = 0;

  // HUD state
  var hostagesFreed = 0;
  var terroristsDown = 0;
  var trainArrivalSecs = 45;
  var lastTrainTick = 0;

  // Train position
  var trainStartZ = -80;
  var trainEndZ = 10;
  var trainZ = trainStartZ;

  // ── helpers ────────────────────────────────────────────────────────────────
  function makeMat(color, emissive, emissiveIntensity, transparent, opacity) {
    var params = { color: color };
    if (emissive !== undefined) {
      params.emissive = emissive;
      params.emissiveIntensity = emissiveIntensity !== undefined ? emissiveIntensity : 1;
    }
    if (transparent) {
      params.transparent = true;
      params.opacity = opacity !== undefined ? opacity : 1;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function makeBox(w, h, d, color, emissive, emissiveIntensity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, emissive, emissiveIntensity);
    var mesh = new THREE.Mesh(geo, mat);
    allMeshes.push(mesh);
    return mesh;
  }

  function makeCylinder(rTop, rBot, h, segs, color, emissive, emissiveIntensity) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = makeMat(color, emissive, emissiveIntensity);
    var mesh = new THREE.Mesh(geo, mat);
    allMeshes.push(mesh);
    return mesh;
  }

  function makeSphere(r, segs, color, emissive, emissiveIntensity) {
    var geo = new THREE.SphereGeometry(r, segs, segs);
    var mat = makeMat(color, emissive, emissiveIntensity);
    var mesh = new THREE.Mesh(geo, mat);
    allMeshes.push(mesh);
    return mesh;
  }

  function addToScene(mesh, x, y, z) {
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  // ── build scene ────────────────────────────────────────────────────────────
  function buildScene() {
    // 1. Metro tunnel floor — large flat box, grey/brown
    var floor = makeBox(30, 0.4, 120, 0x6b5b45);
    addToScene(floor, 0, -0.2, -30);

    // 2a. Metro station platform
    var platform = makeBox(10, 0.8, 50, 0x9e9e9e);
    addToScene(platform, 12, 0.4, -20);

    // 2b. Platform edge stripe (yellow safety line)
    var edgeStripe = makeBox(0.4, 0.82, 50, 0xf9a825);
    addToScene(edgeStripe, 7.1, 0.41, -20);

    // 3. Tunnel walls — stacked half-cylinder boxes (left and right)
    var wallColors = [0x455a64, 0x546e7a, 0x607d8b, 0x546e7a, 0x455a64];
    var i, j;
    for (i = 0; i < 5; i++) {
      var wallSegH = 2.5;
      // Left wall segments
      var lwSeg = makeBox(0.8, wallSegH, 120, wallColors[i]);
      addToScene(lwSeg, -15 + i * 0.15, i * wallSegH + wallSegH * 0.5, -30);
      // Right wall segments (tunnel side)
      var rwSeg = makeBox(0.8, wallSegH, 120, wallColors[4 - i]);
      addToScene(rwSeg, 7 - i * 0.15, i * wallSegH + wallSegH * 0.5, -30);
    }

    // Ceiling box
    var ceiling = makeBox(30, 0.5, 120, 0x37474f);
    addToScene(ceiling, 0, 13, -30);

    // 4. Metro train cars (2 elongated boxes, on tracks)
    var trainColors = [0x1565c0, 0x0d47a1];
    for (i = 0; i < 2; i++) {
      var car = makeBox(4.5, 3.5, 14, trainColors[i]);
      car.position.set(-3, 2.55, trainStartZ - i * 15);
      scene.add(car);
      trainCars.push(car);

      // Windows strip
      var windows = makeBox(4.3, 0.8, 13, 0x90caf9, 0x90caf9, 0.5);
      windows.position.set(-3, 3.6, trainStartZ - i * 15);
      scene.add(windows);
      trainCars.push(windows);

      // Headlight (front car only)
      if (i === 0) {
        var headlight = makeBox(0.6, 0.4, 0.1, 0xffffff, 0xffffff, 2);
        headlight.position.set(-3, 2.0, trainStartZ + 7);
        scene.add(headlight);
        trainCars.push(headlight);
      }
    }

    // 5. Train tracks — LineSegments rails + box ties
    var railMat = new THREE.LineBasicMaterial({ color: 0x8d6e63 });
    allMeshes.push({ geometry: null, material: railMat }); // track for disposal

    // Rails (left and right)
    var railOffsets = [-4.5, -1.5];
    for (j = 0; j < 2; j++) {
      var railPoints = [];
      for (i = 0; i <= 20; i++) {
        railPoints.push(new THREE.Vector3(railOffsets[j], 0.05, -90 + i * 6));
      }
      var railGeo = new THREE.BufferGeometry().setFromPoints(railPoints);
      var rail = new THREE.Line(railGeo, railMat);
      scene.add(rail);
      allLines.push(rail);
    }

    // Ties (sleepers)
    for (i = 0; i < 20; i++) {
      var tie = makeBox(4, 0.15, 0.4, 0x4e342e);
      addToScene(tie, -3, 0.08, -87 + i * 6);
    }

    // 6. Terrorist figures (5) — box body + sphere head, crouched behind cover
    var terrorPositions = [
      { x: -8, z: -15, rot: 0.3 },
      { x: -10, z: -25, rot: -0.2 },
      { x: 5,  z: -10, rot: 0.5 },
      { x: -6, z: -35, rot: -0.1 },
      { x: 3,  z: -30, rot: 0.4 }
    ];
    for (i = 0; i < terrorPositions.length; i++) {
      var tp = terrorPositions[i];
      var tGrp = new THREE.Group();
      var tBody = makeBox(0.7, 1.1, 0.5, 0x1b5e20);
      tBody.position.set(0, 0.55, 0);
      tGrp.add(tBody);
      var tHead = makeSphere(0.22, 8, 0x8d6e63);
      tHead.position.set(0, 1.3, 0);
      tGrp.add(tHead);
      // Weapon (box)
      var tWeapon = makeBox(0.08, 0.08, 0.7, 0x212121);
      tWeapon.position.set(0.3, 0.8, 0.3);
      tGrp.add(tWeapon);
      tGrp.position.set(tp.x, 0, tp.z);
      tGrp.rotation.y = tp.rot;
      scene.add(tGrp);
      terroristFigures.push(tGrp);
    }

    // 7. CT response team (4) — tactical gear color
    var ctPositions = [
      { x: 14, z: 5,  rot: Math.PI },
      { x: 16, z: 0,  rot: Math.PI + 0.2 },
      { x: 13, z: -5, rot: Math.PI - 0.2 },
      { x: 15, z: -10, rot: Math.PI }
    ];
    for (i = 0; i < ctPositions.length; i++) {
      var cp = ctPositions[i];
      var cGrp = new THREE.Group();
      var cBody = makeBox(0.65, 1.2, 0.5, 0x263238);
      cBody.position.set(0, 0.6, 0);
      cGrp.add(cBody);
      var cHead = makeSphere(0.22, 8, 0x546e7a);
      cHead.position.set(0, 1.35, 0);
      cGrp.add(cHead);
      // Helmet visor
      var visor = makeBox(0.28, 0.1, 0.12, 0x00bcd4, 0x00bcd4, 0.4);
      visor.position.set(0, 1.38, 0.2);
      cGrp.add(visor);
      // Weapon
      var cWeapon = makeBox(0.08, 0.08, 0.8, 0x37474f);
      cWeapon.position.set(0.3, 0.9, 0.35);
      cGrp.add(cWeapon);
      cGrp.position.set(cp.x, 0, cp.z);
      cGrp.rotation.y = cp.rot;
      scene.add(cGrp);
      ctFigures.push(cGrp);
    }

    // 8. Hostage figures (3 civilians crouching)
    var hostagePositions = [
      { x: 9, z: -18 },
      { x: 11, z: -22 },
      { x: 8, z: -26 }
    ];
    for (i = 0; i < hostagePositions.length; i++) {
      var hp = hostagePositions[i];
      var hGrp = new THREE.Group();
      var hBody = makeBox(0.55, 0.8, 0.45, 0xef9a9a);
      hBody.position.set(0, 0.4, 0);
      hGrp.add(hBody);
      var hHead = makeSphere(0.2, 8, 0xffccbc);
      hHead.position.set(0, 0.95, 0);
      hGrp.add(hHead);
      hGrp.position.set(hp.x, 0, hp.z);
      scene.add(hGrp);
      hostageFigures.push(hGrp);
    }

    // 9. Platform benches (5 box benches)
    var benchZ = [-12, -17, -22, -27, -32];
    for (i = 0; i < 5; i++) {
      var bench = makeBox(2.5, 0.2, 0.6, 0x5d4037);
      addToScene(bench, 16, 1.3, benchZ[i]);
      // Bench legs
      var legL = makeBox(0.1, 0.5, 0.1, 0x4e342e);
      addToScene(legL, 15.1, 0.85, benchZ[i] - 0.2);
      var legR = makeBox(0.1, 0.5, 0.1, 0x4e342e);
      addToScene(legR, 17.1, 0.85, benchZ[i] - 0.2);
    }

    // 10. Overhead light strips (emissive long boxes)
    var lightZ = [-10, -20, -30, -40, -50];
    for (i = 0; i < 5; i++) {
      var light = makeBox(0.3, 0.15, 4, 0xfff9c4, 0xfff176, 2);
      addToScene(light, 0, 12.6, lightZ[i]);
      emergencyLights.push(light);
    }

    // 11. Emergency exit sign (box + emissive green)
    var exitBox = makeBox(1.8, 0.5, 0.15, 0x1b5e20, 0x4caf50, 1.5);
    addToScene(exitBox, 18, 8, 5);
    var exitArrow = makeBox(0.4, 0.3, 0.16, 0xffffff, 0xffffff, 1);
    addToScene(exitArrow, 18, 8, 5);

    // 12. Turnstile barriers (box + cylinder posts)
    var turnstileZ = [2, 2];
    var turnstileX = [9, 11];
    for (i = 0; i < 2; i++) {
      var post = makeCylinder(0.08, 0.08, 1.2, 8, 0x757575);
      addToScene(post, turnstileX[i], 1.4, turnstileZ[i]);
      var bar = makeBox(1.5, 0.08, 0.08, 0xbdbdbd);
      addToScene(bar, turnstileX[i] + 0.5, 1.4, turnstileZ[i]);
    }

    // 13. Ticket machine (box + emissive screen)
    var ticketBody = makeBox(0.8, 1.6, 0.5, 0x424242);
    addToScene(ticketBody, 18, 1.6, -5);
    var ticketScreen = makeBox(0.55, 0.7, 0.12, 0x0288d1, 0x29b6f6, 1.2);
    addToScene(ticketScreen, 18, 1.9, -4.7);

    // 14. Trash cans (cylinders)
    var trashX = [10, 17];
    var trashZArr = [-8, -15];
    for (i = 0; i < 2; i++) {
      var trash = makeCylinder(0.22, 0.18, 0.75, 10, 0x616161);
      addToScene(trash, trashX[i], 1.175, trashZArr[i]);
      var trashLid = makeCylinder(0.24, 0.24, 0.08, 10, 0x424242);
      addToScene(trashLid, trashX[i], 1.6, trashZArr[i]);
    }

    // 15. Surveillance camera (box on cylinder pole)
    var camPole = makeCylinder(0.05, 0.05, 3, 6, 0x9e9e9e);
    addToScene(camPole, -14, 9.5, -20);
    var camBody = makeBox(0.3, 0.2, 0.5, 0x212121);
    addToScene(camBody, -14, 11.1, -20);
    var camLens = makeCylinder(0.06, 0.04, 0.18, 6, 0x37474f);
    addToScene(camLens, -14, 11.1, -19.7);
    camLens.rotation.x = Math.PI / 2;

    // 16. Explosive device (box + emissive red LED sphere)
    var explosiveBox = makeBox(0.4, 0.15, 0.25, 0x212121);
    addToScene(explosiveBox, 6, 1.0, -28);
    explosiveLED = makeSphere(0.07, 6, 0xff1744, 0xff1744, 2);
    addToScene(explosiveLED, 6.15, 1.1, -27.85);

    // 17. Ventilation shaft (cylinder opening in wall)
    var ventShaft = makeCylinder(0.55, 0.55, 0.3, 12, 0x546e7a);
    addToScene(ventShaft, -14.8, 6, -40);
    ventShaft.rotation.z = Math.PI / 2;
    var ventGrill = makeBox(0.1, 1.0, 1.0, 0x78909c);
    addToScene(ventGrill, -14.6, 6, -40);

    // Ambient + directional lights for scene
    var ambient = new THREE.AmbientLight(0x334455, 0.6);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    dirLight.position.set(5, 20, 10);
    scene.add(dirLight);

    // Red emergency strip lights
    var redStrip1 = makeBox(0.15, 0.1, 120, 0xff1744, 0xff1744, 0.8);
    addToScene(redStrip1, -14.5, 1.2, -30);
    var redStrip2 = makeBox(0.15, 0.1, 120, 0xff1744, 0xff1744, 0.8);
    addToScene(redStrip2, 6.5, 1.2, -30);
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function createHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 420;
    hudCanvas.height = 120;
    hudCanvas.style.cssText = [
      'position:absolute',
      'top:12px',
      'left:12px',
      'pointer-events:none',
      'z-index:100'
    ].join(';');
    container.appendChild(hudCanvas);
    hudCtx = hudCanvas.getContext('2d');
  }

  function drawHUD() {
    if (!hudCtx) return;
    hudCtx.clearRect(0, 0, 420, 120);

    // Background panel
    hudCtx.fillStyle = 'rgba(0,0,0,0.72)';
    hudCtx.beginPath();
    hudCtx.roundRect(0, 0, 420, 120, 8);
    hudCtx.fill();

    hudCtx.font = 'bold 15px monospace';
    hudCtx.fillStyle = '#4caf50';
    hudCtx.fillText('HOSTAGES FREED: ' + hostagesFreed + '/3', 14, 30);

    hudCtx.fillStyle = '#ff5252';
    hudCtx.fillText('TERRORISTS DOWN: ' + terroristsDown + '/5', 14, 56);

    hudCtx.fillStyle = trainArrivalSecs <= 10 ? '#ff1744' : '#ffd740';
    hudCtx.fillText('TRAIN ARRIVAL: ' + trainArrivalSecs + 'S', 14, 82);

    // Key hint
    hudCtx.fillStyle = 'rgba(255,255,255,0.4)';
    hudCtx.font = '11px monospace';
    hudCtx.fillText('[M+A] TOGGLE', 14, 108);
  }

  // ── animate ────────────────────────────────────────────────────────────────
  function update(delta) {
    if (!active) return;
    animTime += delta;

    // Train approaches station
    if (trainZ < trainEndZ) {
      trainZ += delta * 8;
      for (var t = 0; t < trainCars.length; t++) {
        trainCars[t].position.z += delta * 8;
      }
    }

    // Update train arrival countdown
    lastTrainTick += delta;
    if (lastTrainTick >= 1.0 && trainArrivalSecs > 0) {
      trainArrivalSecs--;
      lastTrainTick = 0;
    }

    // Terrorists take cover — oscillate X (peek and hide)
    for (var i = 0; i < terroristFigures.length; i++) {
      var tf = terroristFigures[i];
      var coverPhase = animTime * 1.2 + i * 1.1;
      tf.position.x += Math.sin(coverPhase) * delta * 0.3;
      // Crouch
      tf.scale.y = 0.75 + 0.12 * Math.abs(Math.sin(animTime * 0.7 + i));
    }

    // CT team advances from exit (moves toward negative Z slowly)
    for (var c = 0; c < ctFigures.length; c++) {
      var cf = ctFigures[c];
      if (cf.position.z > -40) {
        cf.position.z -= delta * 1.5;
      }
    }

    // Emergency lights flicker
    for (var l = 0; l < emergencyLights.length; l++) {
      var em = emergencyLights[l].material;
      var flicker = Math.random() > 0.97;
      em.emissiveIntensity = flicker ? 0.1 : (1.5 + Math.sin(animTime * 8 + l) * 0.4);
    }

    // Explosive LED blinks
    if (explosiveLED) {
      var blinkOn = Math.floor(animTime * 2) % 2 === 0;
      explosiveLED.material.emissiveIntensity = blinkOn ? 2.5 : 0.1;
    }

    // Hostages cower — Y position oscillates (crouching)
    for (var h = 0; h < hostageFigures.length; h++) {
      hostageFigures[h].position.y = Math.abs(Math.sin(animTime * 1.8 + h * 0.9)) * (-0.18);
    }

    drawHUD();
  }

  // ── activation / deactivation ──────────────────────────────────────────────
  function handleKeyDown(e) {
    keyState[e.code] = true;
    if (e.code === 'KeyM') {
      lastMPress = performance.now();
    }
    if (e.code === 'KeyA') {
      var now = performance.now();
      if (now - lastMPress < 400) {
        if (!active) {
          activate();
        } else {
          deactivate();
        }
      }
    }
  }

  function handleKeyUp(e) {
    keyState[e.code] = false;
  }

  function activate() {
    active = true;
    if (hudCanvas) hudCanvas.style.display = 'block';
  }

  function deactivate() {
    active = false;
    if (hudCanvas) hudCanvas.style.display = 'none';
  }

  // ── init ───────────────────────────────────────────────────────────────────
  function init(cfg) {
    container = cfg.container;
    scene = cfg.scene;
    camera = cfg.camera;
    renderer = cfg.renderer;
    clock = cfg.clock || new THREE.Clock();

    // Reset state
    hostagesFreed = 0;
    terroristsDown = 0;
    trainArrivalSecs = 45;
    lastTrainTick = 0;
    animTime = 0;
    trainZ = trainStartZ;
    trainCars = [];
    terroristFigures = [];
    ctFigures = [];
    hostageFigures = [];
    emergencyLights = [];
    explosiveLED = null;
    allMeshes = [];
    allLines = [];

    buildScene();
    createHUD();

    // Camera position — overlooking platform at angle
    camera.position.set(20, 12, 15);
    camera.lookAt(0, 2, -20);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    activate();
  }

  // ── reset / dispose ────────────────────────────────────────────────────────
  function reset() {
    deactivate();
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);

    // Dispose all tracked meshes
    for (var i = 0; i < allMeshes.length; i++) {
      var m = allMeshes[i];
      if (m.geometry && m.geometry.dispose) m.geometry.dispose();
      if (m.material && m.material.dispose) m.material.dispose();
      if (scene && m.parent === scene) scene.remove(m);
    }

    // Dispose lines
    for (var l = 0; l < allLines.length; l++) {
      var ln = allLines[l];
      if (ln.geometry && ln.geometry.dispose) ln.geometry.dispose();
      if (ln.material && ln.material.dispose) ln.material.dispose();
      if (scene && ln.parent === scene) scene.remove(ln);
    }

    // Remove HUD
    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }

    // Clear group children
    var groups = terroristFigures.concat(ctFigures).concat(hostageFigures);
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g];
      if (grp.parent) grp.parent.remove(grp);
    }

    // Clear train cars
    for (var t = 0; t < trainCars.length; t++) {
      var tc = trainCars[t];
      if (tc.parent) tc.parent.remove(tc);
      if (tc.geometry && tc.geometry.dispose) tc.geometry.dispose();
      if (tc.material && tc.material.dispose) tc.material.dispose();
    }

    allMeshes = [];
    allLines = [];
    trainCars = [];
    terroristFigures = [];
    ctFigures = [];
    hostageFigures = [];
    emergencyLights = [];
    explosiveLED = null;
    hudCanvas = null;
    hudCtx = null;
    scene = null;
    camera = null;
    renderer = null;
    container = null;
  }

  // ── public API ─────────────────────────────────────────────────────────────
  return { init: init, update: update, reset: reset };
}());
