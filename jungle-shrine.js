window.JungleShrine = (function() { 'use strict';

var scene, camera, renderer, canvas;
var sceneObjects = [];
var idolEyes = [];
var torches = [];
var cultists = [];
var tribalGuards = [];
var vineSegments = [];
var artifact;
var fireFlame;
var clock;
var time = 0;

var gameState = {
  cultistsNeutralized: 0,
  artifactRecovered: false,
  tribalGuardsDown: 0
};

var keybindState = {
  j: false,
  s: false,
  lastJTime: 0
};

var hudCanvas, hudCtx;
var hudVisible = true;

function init(container) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a0f);
  scene.fog = new THREE.Fog(0x1a1a0f, 100, 200);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 40);
  camera.lookAt(0, 15, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  canvas = renderer.domElement;

  clock = new THREE.Clock();

  // Setup HUD canvas
  setupHUD(container);

  // Lighting
  var ambientLight = new THREE.AmbientLight(0x553322, 0.6);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffdd88, 0.8);
  directionalLight.position.set(40, 60, 40);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);

  // Build scene objects
  buildJungleFloor();
  buildSteppedPyramid();
  buildTempleChambered();
  buildStoneIdol();
  buildGuardianStatues();
  buildOvergrownVines();
  buildJungleTrees();
  buildSacrificeAltar();
  buildTorchStands();
  buildCultistFigures();
  buildTreasureChest();
  buildRitualFirePit();
  buildStoneCarvedDoorway();
  buildJungleCanopy();
  buildTribalWarriors();
  buildGlowingArtifact();
  buildCrumblingWall();

  // Input handling
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Initial render
  renderer.render(scene, camera);
}

function setupHUD(container) {
  hudCanvas = document.createElement('canvas');
  hudCanvas.width = window.innerWidth;
  hudCanvas.height = window.innerHeight;
  hudCanvas.style.position = 'absolute';
  hudCanvas.style.top = '0';
  hudCanvas.style.left = '0';
  hudCanvas.style.pointerEvents = 'none';
  hudCanvas.style.zIndex = '100';
  container.appendChild(hudCanvas);
  hudCtx = hudCanvas.getContext('2d');

  window.addEventListener('resize', function() {
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
  });
}

function buildJungleFloor() {
  var geometry = new THREE.BoxGeometry(200, 2, 200);
  var material = new THREE.MeshStandardMaterial({
    color: 0x1a3a1a,
    roughness: 0.9,
    metalness: 0
  });
  var floor = new THREE.Mesh(geometry, material);
  floor.position.y = -1;
  floor.receiveShadow = true;
  floor.castShadow = true;
  scene.add(floor);
  sceneObjects.push(floor);
}

function buildSteppedPyramid() {
  // Base tier
  var baseTier = new THREE.BoxGeometry(60, 15, 60);
  var stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x556644,
    roughness: 0.8,
    metalness: 0
  });
  var base = new THREE.Mesh(baseTier, stoneMaterial);
  base.position.y = 7.5;
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);
  sceneObjects.push(base);

  // Middle tier
  var midTier = new THREE.BoxGeometry(40, 12, 40);
  var mid = new THREE.Mesh(midTier, stoneMaterial);
  mid.position.y = 22.5;
  mid.castShadow = true;
  mid.receiveShadow = true;
  scene.add(mid);
  sceneObjects.push(mid);

  // Top tier
  var topTier = new THREE.BoxGeometry(20, 10, 20);
  var top = new THREE.Mesh(topTier, stoneMaterial);
  top.position.y = 36;
  top.castShadow = true;
  top.receiveShadow = true;
  scene.add(top);
  sceneObjects.push(top);
}

function buildTempleChambered() {
  var geometry = new THREE.BoxGeometry(18, 8, 18);
  var material = new THREE.MeshStandardMaterial({
    color: 0x443322,
    roughness: 0.7,
    metalness: 0
  });
  var chamber = new THREE.Mesh(geometry, material);
  chamber.position.y = 44;
  chamber.position.z = 0;
  chamber.castShadow = true;
  chamber.receiveShadow = true;
  scene.add(chamber);
  sceneObjects.push(chamber);
}

function buildStoneIdol() {
  // Base cylinder
  var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 2, 8);
  var stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x445544,
    roughness: 0.8
  });
  var base = new THREE.Mesh(baseGeometry, stoneMaterial);
  base.position.set(0, 3, 5);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);
  sceneObjects.push(base);

  // Body box
  var bodyGeometry = new THREE.BoxGeometry(2.5, 3, 2);
  var body = new THREE.Mesh(bodyGeometry, stoneMaterial);
  body.position.set(0, 6, 5);
  body.castShadow = true;
  body.receiveShadow = true;
  scene.add(body);
  sceneObjects.push(body);

  // Head sphere
  var headGeometry = new THREE.SphereGeometry(1.2, 8, 8);
  var head = new THREE.Mesh(headGeometry, stoneMaterial);
  head.position.set(0, 8.5, 5);
  head.castShadow = true;
  head.receiveShadow = true;
  scene.add(head);
  sceneObjects.push(head);

  // Emissive eyes
  var eyeGeometry = new THREE.SphereGeometry(0.3, 6, 6);
  var eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    emissive: 0xff3300,
    emissiveIntensity: 0.8
  });
  var leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.4, 8.7, 6);
  scene.add(leftEye);
  sceneObjects.push(leftEye);
  idolEyes.push(leftEye);

  var rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.4, 8.7, 6);
  scene.add(rightEye);
  sceneObjects.push(rightEye);
  idolEyes.push(rightEye);
}

function buildGuardianStatues() {
  var stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x556655,
    roughness: 0.8
  });

  // Left guardian
  var leftStatue = new THREE.BoxGeometry(2, 4, 1.5);
  var leftGuard = new THREE.Mesh(leftStatue, stoneMaterial);
  leftGuard.position.set(-8, 2, 10);
  leftGuard.castShadow = true;
  leftGuard.receiveShadow = true;
  scene.add(leftGuard);
  sceneObjects.push(leftGuard);

  // Right guardian
  var rightStatue = new THREE.BoxGeometry(2, 4, 1.5);
  var rightGuard = new THREE.Mesh(rightStatue, stoneMaterial);
  rightGuard.position.set(8, 2, 10);
  rightGuard.castShadow = true;
  rightGuard.receiveShadow = true;
  scene.add(rightGuard);
  sceneObjects.push(rightGuard);
}

function buildOvergrownVines() {
  var vineMaterial = new THREE.LineBasicMaterial({
    color: 0x2d5a2d,
    linewidth: 2
  });

  for (var i = 0; i < 5; i++) {
    var points = [];
    var xStart = -25 + i * 12.5;
    points.push(new THREE.Vector3(xStart, 35, 0));
    points.push(new THREE.Vector3(xStart - 3, 25, 2));
    points.push(new THREE.Vector3(xStart - 5, 15, 4));
    points.push(new THREE.Vector3(xStart - 6, 5, 5));

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var vine = new THREE.LineSegments(geometry, vineMaterial);
    scene.add(vine);
    sceneObjects.push(vine);
    vineSegments.push(vine);
  }
}

function buildJungleTrees() {
  var trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a,
    roughness: 0.9
  });
  var canopyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a2d,
    roughness: 0.8
  });

  var positions = [
    [-60, 0, -50], [-60, 0, 50], [60, 0, -50], [60, 0, 50],
    [-40, 0, -70], [-40, 0, 70], [40, 0, -70], [40, 0, 70]
  ];

  for (var i = 0; i < positions.length; i++) {
    var pos = positions[i];

    // Trunk
    var trunkGeometry = new THREE.CylinderGeometry(2, 3, 18, 8);
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(pos[0], pos[1] + 9, pos[2]);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    sceneObjects.push(trunk);

    // Canopy cone
    var canopyGeometry = new THREE.ConeGeometry(8, 15, 8);
    var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(pos[0], pos[1] + 26, pos[2]);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    scene.add(canopy);
    sceneObjects.push(canopy);
  }
}

function buildSacrificeAltar() {
  var geometry = new THREE.BoxGeometry(12, 1.5, 8);
  var material = new THREE.MeshStandardMaterial({
    color: 0x441111,
    roughness: 0.7
  });
  var altar = new THREE.Mesh(geometry, material);
  altar.position.set(0, 2.5, 0);
  altar.castShadow = true;
  altar.receiveShadow = true;
  scene.add(altar);
  sceneObjects.push(altar);

  // Emissive markings
  var markGeometry = new THREE.BoxGeometry(10, 0.1, 6);
  var markMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.5
  });
  var markings = new THREE.Mesh(markGeometry, markMaterial);
  markings.position.set(0, 2.55, 0);
  scene.add(markings);
  sceneObjects.push(markings);
}

function buildTorchStands() {
  var standPositions = [
    [-15, 0, -15], [15, 0, -15], [-15, 0, 15],
    [15, 0, 15], [0, 0, -25], [0, 0, 25]
  ];

  for (var i = 0; i < standPositions.length; i++) {
    var pos = standPositions[i];

    // Torch stand pole
    var poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 6);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a1a,
      roughness: 0.8
    });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(pos[0], pos[1] + 4, pos[2]);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    sceneObjects.push(pole);

    // Flame (emissive sphere)
    var flameGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9900,
      emissive: 0xff6600,
      emissiveIntensity: 0.7
    });
    var flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(pos[0], pos[1] + 9, pos[2]);
    scene.add(flame);
    sceneObjects.push(flame);
    torches.push(flame);
  }
}

function buildCultistFigures() {
  for (var i = 0; i < 6; i++) {
    var angle = (i / 6) * Math.PI * 2;
    var x = Math.cos(angle) * 12;
    var z = Math.sin(angle) * 12;

    // Robe body (box)
    var robeGeometry = new THREE.BoxGeometry(1.5, 2.5, 1.5);
    var robeMaterial = new THREE.MeshStandardMaterial({
      color: 0x331111,
      roughness: 0.9
    });
    var robe = new THREE.Mesh(robeGeometry, robeMaterial);
    robe.position.set(x, 2.5, z);
    robe.castShadow = true;
    robe.receiveShadow = true;
    scene.add(robe);
    sceneObjects.push(robe);

    // Head (sphere)
    var headGeometry = new THREE.SphereGeometry(0.7, 6, 6);
    var head = new THREE.Mesh(headGeometry, robeMaterial);
    head.position.set(x, 4.2, z);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    sceneObjects.push(head);

    cultists.push({
      robe: robe,
      head: head,
      angle: angle,
      baseX: x,
      baseZ: z
    });
  }
}

function buildTreasureChest() {
  var geometry = new THREE.BoxGeometry(4, 3, 3);
  var material = new THREE.MeshStandardMaterial({
    color: 0x8b6914,
    roughness: 0.6,
    metalness: 0.3
  });
  var chest = new THREE.Mesh(geometry, material);
  chest.position.set(0, 2, -8);
  chest.castShadow = true;
  chest.receiveShadow = true;
  scene.add(chest);
  sceneObjects.push(chest);

  // Interior glow
  var glowGeometry = new THREE.BoxGeometry(3.8, 2.8, 2.8);
  var glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.4
  });
  var glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(0, 2, -8);
  scene.add(glow);
  sceneObjects.push(glow);
}

function buildRitualFirePit() {
  // Bowl
  var bowlGeometry = new THREE.CylinderGeometry(6, 7, 3, 12);
  var bowlMaterial = new THREE.MeshStandardMaterial({
    color: 0x222211,
    roughness: 0.9
  });
  var bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
  bowl.position.set(0, 1.5, 0);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  scene.add(bowl);
  sceneObjects.push(bowl);

  // Central flame
  var flameGeometry = new THREE.SphereGeometry(3, 10, 10);
  var flameMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff2200,
    emissiveIntensity: 0.8
  });
  fireFlame = new THREE.Mesh(flameGeometry, flameMaterial);
  fireFlame.position.set(0, 4, 0);
  scene.add(fireFlame);
  sceneObjects.push(fireFlame);
}

function buildStoneCarvedDoorway() {
  // Arch frame
  var archGeometry = new THREE.BoxGeometry(6, 7, 0.5);
  var archMaterial = new THREE.MeshStandardMaterial({
    color: 0x556644,
    roughness: 0.8
  });
  var arch = new THREE.Mesh(archGeometry, archMaterial);
  arch.position.set(0, 25, -10);
  arch.castShadow = true;
  arch.receiveShadow = true;
  scene.add(arch);
  sceneObjects.push(arch);

  // Rune patterns (LineSegments)
  var runeMaterial = new THREE.LineBasicMaterial({
    color: 0xff3300,
    linewidth: 2
  });
  var runePoints = [];
  runePoints.push(new THREE.Vector3(-2, 25, -9.5));
  runePoints.push(new THREE.Vector3(-1, 28, -9.5));
  runePoints.push(new THREE.Vector3(0, 25, -9.5));
  runePoints.push(new THREE.Vector3(1, 28, -9.5));
  runePoints.push(new THREE.Vector3(2, 25, -9.5));

  var runeGeometry = new THREE.BufferGeometry().setFromPoints(runePoints);
  var runes = new THREE.LineSegments(runeGeometry, runeMaterial);
  scene.add(runes);
  sceneObjects.push(runes);
}

function buildJungleCanopy() {
  var geometry = new THREE.BoxGeometry(250, 2, 250);
  var material = new THREE.MeshStandardMaterial({
    color: 0x1a3a1a,
    roughness: 0.9,
    transparent: true,
    opacity: 0.3
  });
  var canopy = new THREE.Mesh(geometry, material);
  canopy.position.y = 70;
  scene.add(canopy);
  sceneObjects.push(canopy);
}

function buildTribalWarriors() {
  var positions = [
    [-30, 0, -30], [30, 0, 30], [0, 0, -40]
  ];

  for (var i = 0; i < positions.length; i++) {
    var pos = positions[i];

    // Body
    var bodyGeometry = new THREE.BoxGeometry(1.5, 2.5, 1.5);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.9
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(pos[0], pos[1] + 2.5, pos[2]);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push(body);

    // Head
    var headGeometry = new THREE.SphereGeometry(0.7, 6, 6);
    var head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(pos[0], pos[1] + 4.2, pos[2]);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    sceneObjects.push(head);

    // Weapon (club - box)
    var weaponGeometry = new THREE.BoxGeometry(0.6, 2.5, 0.6);
    var weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3410,
      roughness: 0.8
    });
    var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(pos[0] + 1.5, pos[1] + 3, pos[2]);
    weapon.castShadow = true;
    weapon.receiveShadow = true;
    scene.add(weapon);
    sceneObjects.push(weapon);

    tribalGuards.push({
      body: body,
      head: head,
      weapon: weapon
    });
  }
}

function buildGlowingArtifact() {
  // Pedestal
  var pedalGeometry = new THREE.BoxGeometry(2, 4, 2);
  var pedalMaterial = new THREE.MeshStandardMaterial({
    color: 0x556644,
    roughness: 0.8
  });
  var pedal = new THREE.Mesh(pedalGeometry, pedalMaterial);
  pedal.position.set(0, 2, 8);
  pedal.castShadow = true;
  pedal.receiveShadow = true;
  scene.add(pedal);
  sceneObjects.push(pedal);

  // Artifact sphere
  var artifactGeometry = new THREE.SphereGeometry(1.5, 10, 10);
  var artifactMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.7
  });
  artifact = new THREE.Mesh(artifactGeometry, artifactMaterial);
  artifact.position.set(0, 6.5, 8);
  artifact.castShadow = true;
  artifact.receiveShadow = true;
  scene.add(artifact);
  sceneObjects.push(artifact);
}

function buildCrumblingWall() {
  // Main wall
  var wallGeometry = new THREE.BoxGeometry(20, 8, 1);
  var wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x445544,
    roughness: 0.9
  });
  var wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(25, 4, 20);
  wall.rotation.z = 0.3;
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
  sceneObjects.push(wall);

  // Rubble pile
  var rubbleGeometry = new THREE.BoxGeometry(15, 4, 3);
  var rubble = new THREE.Mesh(rubbleGeometry, wallMaterial);
  rubble.position.set(25, 2, 25);
  rubble.castShadow = true;
  rubble.receiveShadow = true;
  scene.add(rubble);
  sceneObjects.push(rubble);
}

function handleKeyDown(event) {
  if (event.key === 'j' || event.key === 'J') {
    keybindState.j = true;
    keybindState.lastJTime = Date.now();
  }
  if (event.key === 's' || event.key === 'S') {
    if (keybindState.j && (Date.now() - keybindState.lastJTime) < 400) {
      keybindState.s = true;
      hudVisible = !hudVisible;
    }
  }
}

function handleKeyUp(event) {
  if (event.key === 'j' || event.key === 'J') {
    keybindState.j = false;
  }
  if (event.key === 's' || event.key === 'S') {
    keybindState.s = false;
  }
}

function updateHUD() {
  if (!hudVisible) {
    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
    return;
  }

  hudCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  hudCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

  hudCtx.fillStyle = '#ffffff';
  hudCtx.font = 'bold 20px Arial';
  hudCtx.fillText('CULTISTS NEUTRALIZED: ' + gameState.cultistsNeutralized + '/6', 20, 40);
  hudCtx.fillText('ARTIFACT RECOVERED: ' + (gameState.artifactRecovered ? 'YES' : 'NO'), 20, 70);
  hudCtx.fillText('TRIBAL GUARDS DOWN: ' + gameState.tribalGuardsDown + '/3', 20, 100);

  hudCtx.fillStyle = '#888888';
  hudCtx.font = '12px Arial';
  hudCtx.fillText('Press J+S to toggle HUD', 20, hudCanvas.height - 20);
}

function update() {
  time += clock.getDelta();

  // Idol eyes pulsing
  for (var i = 0; i < idolEyes.length; i++) {
    var pulse = Math.sin(time * 3) * 0.4 + 0.6;
    idolEyes[i].material.emissiveIntensity = pulse;
  }

  // Torch flicker
  for (var i = 0; i < torches.length; i++) {
    var flicker = Math.sin(time * 4 + i) * 0.3 + 0.7;
    torches[i].scale.set(
      0.9 + Math.random() * 0.2,
      0.9 + Math.random() * 0.2,
      0.9 + Math.random() * 0.2
    );
    torches[i].material.emissiveIntensity = flicker;
  }

  // Ritual fire flicker
  if (fireFlame) {
    var fireFlicker = Math.sin(time * 5) * 0.4 + 0.8;
    fireFlame.scale.set(
      0.95 + Math.random() * 0.1,
      0.95 + Math.random() * 0.1,
      0.95 + Math.random() * 0.1
    );
    fireFlame.material.emissiveIntensity = fireFlicker;
  }

  // Cultists circling altar
  for (var i = 0; i < cultists.length; i++) {
    var cultist = cultists[i];
    var offset = time * 0.5;
    var x = Math.cos(cultist.angle + offset) * 12;
    var z = Math.sin(cultist.angle + offset) * 12;
    cultist.robe.position.x = x;
    cultist.robe.position.z = z;
    cultist.head.position.x = x;
    cultist.head.position.z = z;
  }

  // Vines sway
  for (var i = 0; i < vineSegments.length; i++) {
    var sway = Math.sin(time * 1.5 + i) * 0.5;
    vineSegments[i].rotation.z = sway;
  }

  // Artifact pulses and color shifts
  if (artifact) {
    var colorShift = Math.sin(time * 1.2) * 0.5 + 0.5;
    var r = Math.floor(255 * colorShift);
    var g = Math.floor(100 * (1 - colorShift));
    var b = Math.floor(255);
    artifact.material.color.setHex((r << 16) | (g << 8) | b);
    artifact.material.emissive.setHex((r << 16) | (g << 8) | b);

    var pulseScale = 1 + Math.sin(time * 2) * 0.15;
    artifact.scale.set(pulseScale, pulseScale, pulseScale);
  }

  // Update HUD
  updateHUD();

  renderer.render(scene, camera);
}

function reset() {
  // Dispose all geometries and materials
  for (var i = 0; i < sceneObjects.length; i++) {
    var obj = sceneObjects[i];
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        for (var j = 0; j < obj.material.length; j++) {
          obj.material[j].dispose();
        }
      } else {
        obj.material.dispose();
      }
    }
    scene.remove(obj);
  }

  sceneObjects = [];
  idolEyes = [];
  torches = [];
  cultists = [];
  tribalGuards = [];
  vineSegments = [];

  gameState.cultistsNeutralized = 0;
  gameState.artifactRecovered = false;
  gameState.tribalGuardsDown = 0;

  if (hudCanvas && hudCanvas.parentNode) {
    hudCanvas.parentNode.removeChild(hudCanvas);
  }
}

return {
  init: init,
  update: update,
  reset: reset
};

}());
