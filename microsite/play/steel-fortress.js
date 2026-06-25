window.SteelFortress = (function() {
'use strict';

var scene = null;
var camera = null;
var objects = [];
var lights = [];

var turrets = [];
var furnaces = [];
var bridgeSections = [];
var pipeSystems = [];
var wallStructures = [];
var platformRotations = [];

var animationTime = 0;

var steelGrey = 0x4a4a4a;
var lightSteel = 0x707070;
var darkSteel = 0x2a2a2a;
var gunMetal = 0x3a3a3a;

function buildMainDome() {
  var radius = 25;
  var geometry = new THREE.SphereGeometry(radius, 16, 16);
  var material = new THREE.MeshLambertMaterial({ color: lightSteel });
  var dome = new THREE.Mesh(geometry, material);
  dome.position.y = 30;
  dome.castShadow = true;
  dome.receiveShadow = true;
  scene.add(dome);
  objects.push(dome);

  var rimGeometry = new THREE.CylinderGeometry(25, 25, 3, 32);
  var rimMaterial = new THREE.MeshLambertMaterial({ color: gunMetal });
  var rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.position.y = 17;
  rim.castShadow = true;
  rim.receiveShadow = true;
  scene.add(rim);
  objects.push(rim);
}

function buildDefensiveTurrets() {
  var positions = [
    [40, 15, 40],
    [-40, 15, 40],
    [40, 15, -40],
    [-40, 15, -40],
    [50, 12, 0],
    [-50, 12, 0],
    [0, 12, 50],
    [0, 12, -50]
  ];

  for (var i = 0; i < positions.length; i++) {
    var turretGroup = buildTurret(positions[i][0], positions[i][1], positions[i][2]);
    turrets.push(turretGroup);
  }
}

function buildTurret(x, y, z) {
  var baseGeometry = new THREE.CylinderGeometry(6, 8, 4, 32);
  var baseMaterial = new THREE.MeshLambertMaterial({ color: steelGrey });
  var base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(x, y, z);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);
  objects.push(base);

  var gunGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 16);
  var gunMaterial = new THREE.MeshLambertMaterial({ color: darkSteel });
  var gun = new THREE.Mesh(gunGeometry, gunMaterial);
  gun.position.set(x, y + 4, z);
  gun.rotation.z = Math.PI * 0.3;
  gun.castShadow = true;
  gun.receiveShadow = true;
  scene.add(gun);
  objects.push(gun);

  var scopeGeometry = new THREE.SphereGeometry(1.2, 8, 8);
  var scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  var scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
  scope.position.set(x, y + 5, z - 4);
  scope.castShadow = true;
  scene.add(scope);
  objects.push(scope);

  return {
    base: base,
    gun: gun,
    scope: scope,
    x: x,
    y: y,
    z: z
  };
}

function buildFortressWalls() {
  var wallConfigs = [
    { x: 0, y: 20, z: 60, w: 120, h: 40, d: 8 },
    { x: 0, y: 20, z: -60, w: 120, h: 40, d: 8 },
    { x: 60, y: 20, z: 0, w: 8, h: 40, d: 120 },
    { x: -60, y: 20, z: 0, w: 8, h: 40, d: 120 },
    { x: 30, y: 20, z: 30, w: 60, h: 35, d: 8 },
    { x: -30, y: 20, z: 30, w: 60, h: 35, d: 8 },
    { x: 30, y: 20, z: -30, w: 60, h: 35, d: 8 },
    { x: -30, y: 20, z: -30, w: 60, h: 35, d: 8 }
  ];

  for (var i = 0; i < wallConfigs.length; i++) {
    var config = wallConfigs[i];
    var geometry = new THREE.BoxGeometry(config.w, config.h, config.d);
    var material = new THREE.MeshLambertMaterial({ color: steelGrey });
    var wall = new THREE.Mesh(geometry, material);
    wall.position.set(config.x, config.y, config.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    objects.push(wall);
    wallStructures.push(wall);

    addPlateDetails(wall, config.w, config.h);
  }
}

function addPlateDetails(wall, width, height) {
  var plateCount = Math.floor(width / 10);
  for (var i = 0; i < plateCount; i++) {
    var lineGeometry = new THREE.BoxGeometry(0.5, height + 2, 0.2);
    var lineMaterial = new THREE.MeshLambertMaterial({ color: darkSteel });
    var line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.x = (i - plateCount / 2) * 10;
    line.position.y = 1;
    line.position.z = 5;
    line.parent = wall;
    wall.add(line);
    objects.push(line);
  }
}

function buildBridgeSections() {
  var bridgePositions = [
    { x: 0, z: 35 },
    { x: 0, z: -35 },
    { x: 35, z: 0 },
    { x: -35, z: 0 }
  ];

  for (var i = 0; i < bridgePositions.length; i++) {
    var pos = bridgePositions[i];
    var sectionGeometry = new THREE.BoxGeometry(20, 2, 25);
    var sectionMaterial = new THREE.MeshLambertMaterial({ color: gunMetal });
    var section = new THREE.Mesh(sectionGeometry, sectionMaterial);
    section.position.set(pos.x, 3, pos.z);
    section.castShadow = true;
    section.receiveShadow = true;
    scene.add(section);
    objects.push(section);

    bridgeSections.push({
      mesh: section,
      baseY: 3,
      extended: true,
      direction: i % 2 === 0 ? 1 : -1
    });

    addBridgeSupports(pos.x, pos.z);
  }
}

function addBridgeSupports(x, z) {
  var supportPositions = [
    [-8, z], [8, z]
  ];

  for (var i = 0; i < supportPositions.length; i++) {
    var pos = supportPositions[i];
    var supportGeometry = new THREE.CylinderGeometry(2, 3, 6, 16);
    var supportMaterial = new THREE.MeshLambertMaterial({ color: steelGrey });
    var support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(x + pos[0], 0, pos[1]);
    support.castShadow = true;
    support.receiveShadow = true;
    scene.add(support);
    objects.push(support);
  }
}

function buildIndustrialFurnaces() {
  var furnacePositions = [
    [-35, 5, -45],
    [35, 5, -45],
    [-35, 5, 45],
    [35, 5, 45]
  ];

  for (var i = 0; i < furnacePositions.length; i++) {
    var pos = furnacePositions[i];
    var furnaceGroup = buildFurnace(pos[0], pos[1], pos[2]);
    furnaces.push(furnaceGroup);
  }
}

function buildFurnace(x, y, z) {
  var bodyGeometry = new THREE.CylinderGeometry(8, 10, 20, 32);
  var bodyMaterial = new THREE.MeshLambertMaterial({ color: darkSteel });
  var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(x, y + 10, z);
  body.castShadow = true;
  body.receiveShadow = true;
  scene.add(body);
  objects.push(body);

  var openingGeometry = new THREE.SphereGeometry(6, 16, 16);
  var openingMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
  var opening = new THREE.Mesh(openingGeometry, openingMaterial);
  opening.position.set(x, y + 12, z - 8);
  opening.scale.z = 0.3;
  opening.castShadow = true;
  scene.add(opening);
  objects.push(opening);

  var stackGeometry = new THREE.CylinderGeometry(3, 3, 15, 24);
  var stackMaterial = new THREE.MeshLambertMaterial({ color: steelGrey });
  var stack = new THREE.Mesh(stackGeometry, stackMaterial);
  stack.position.set(x, y + 25, z);
  stack.castShadow = true;
  stack.receiveShadow = true;
  scene.add(stack);
  objects.push(stack);

  return {
    body: body,
    opening: opening,
    stack: stack,
    x: x,
    y: y,
    z: z,
    glowIntensity: 1.0
  };
}

function buildPressurePipes() {
  var pipeRoutes = [
    { startX: -50, startZ: 0, endX: 50, endZ: 0, startY: 25 },
    { startX: 0, startZ: -50, endX: 0, endZ: 50, startY: 25 },
    { startX: -40, startZ: -40, endX: 40, endZ: 40, startY: 20 },
    { startX: 40, startZ: -40, endX: -40, endZ: 40, startY: 20 }
  ];

  for (var i = 0; i < pipeRoutes.length; i++) {
    var route = pipeRoutes[i];
    buildPipeSegment(route.startX, route.startY, route.startZ, route.endX, route.endZ);
  }
}

function buildPipeSegment(startX, startY, startZ, endX, endZ) {
  var length = Math.sqrt((endX - startX) ** 2 + (endZ - startZ) ** 2);
  var midX = (startX + endX) / 2;
  var midZ = (startZ + endZ) / 2;

  var pipeGeometry = new THREE.CylinderGeometry(1.5, 1.5, length, 16);
  var pipeMaterial = new THREE.MeshLambertMaterial({ color: lightSteel });
  var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
  pipe.position.set(midX, startY, midZ);
  pipe.rotation.z = Math.atan2(endZ - startZ, endX - startX);
  pipe.castShadow = true;
  pipe.receiveShadow = true;
  scene.add(pipe);
  objects.push(pipe);
  pipeSystems.push(pipe);

  var jointGeometry = new THREE.SphereGeometry(2.5, 12, 12);
  var jointMaterial = new THREE.MeshLambertMaterial({ color: gunMetal });
  var joint = new THREE.Mesh(jointGeometry, jointMaterial);
  joint.position.set(startX, startY, startZ);
  joint.castShadow = true;
  scene.add(joint);
  objects.push(joint);
}

function buildScaffoldingTowers() {
  var towerPositions = [
    [-45, 0, -45],
    [45, 0, -45],
    [-45, 0, 45],
    [45, 0, 45],
    [-55, 0, 0],
    [55, 0, 0],
    [0, 0, -55],
    [0, 0, 55]
  ];

  for (var i = 0; i < towerPositions.length; i++) {
    var pos = towerPositions[i];
    buildScaffoldTower(pos[0], pos[1], pos[2]);
  }
}

function buildScaffoldTower(x, y, z) {
  var beamGeometry = new THREE.BoxGeometry(2, 35, 2);
  var beamMaterial = new THREE.MeshLambertMaterial({ color: steelGrey });
  var beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.position.set(x, y + 17, z);
  beam.castShadow = true;
  beam.receiveShadow = true;
  scene.add(beam);
  objects.push(beam);

  var crossbraceGeometry = new THREE.BoxGeometry(20, 1.5, 1.5);
  var cybraceMaterial = new THREE.MeshLambertMaterial({ color: darkSteel });
  var crossbrace = new THREE.Mesh(crossbraceGeometry, cybraceMaterial);
  crossbrace.position.set(x, y + 10, z);
  crossbrace.castShadow = true;
  crossbrace.receiveShadow = true;
  scene.add(crossbrace);
  objects.push(crossbrace);

  var topCapGeometry = new THREE.ConeGeometry(3, 5, 8);
  var topCapMaterial = new THREE.MeshLambertMaterial({ color: gunMetal });
  var topCap = new THREE.Mesh(topCapGeometry, topCapMaterial);
  topCap.position.set(x, y + 36, z);
  topCap.castShadow = true;
  scene.add(topCap);
  objects.push(topCap);
}

function buildFoundryFloor() {
  var floorGeometry = new THREE.BoxGeometry(140, 3, 140);
  var floorMaterial = new THREE.MeshLambertMaterial({ color: darkSteel });
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -40;
  floor.receiveShadow = true;
  scene.add(floor);
  objects.push(floor);

  var gridSize = 20;
  var gridCount = 7;
  for (var i = 0; i < gridCount; i++) {
    for (var j = 0; j < gridCount; j++) {
      var x = (i - gridCount / 2) * gridSize;
      var z = (j - gridCount / 2) * gridSize;
      var gateGeometry = new THREE.BoxGeometry(gridSize - 2, 1.5, gridSize - 2);
      var gateMaterial = new THREE.MeshLambertMaterial({ color: lightSteel });
      var gate = new THREE.Mesh(gateGeometry, gateMaterial);
      gate.position.set(x, -38, z);
      gate.receiveShadow = true;
      scene.add(gate);
      objects.push(gate);
    }
  }
}

function buildCentralStructures() {
  var coreGeometry = new THREE.BoxGeometry(15, 25, 15);
  var coreMaterial = new THREE.MeshLambertMaterial({ color: gunMetal });
  var core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.position.y = 12;
  core.castShadow = true;
  core.receiveShadow = true;
  scene.add(core);
  objects.push(core);

  var beamVerticalGeometry = new THREE.CylinderGeometry(1, 1, 30, 16);
  var beamVerticalMaterial = new THREE.MeshLambertMaterial({ color: steelGrey });
  var beamPositions = [
    [-5, 0],
    [5, 0],
    [0, -5],
    [0, 5]
  ];

  for (var i = 0; i < beamPositions.length; i++) {
    var pos = beamPositions[i];
    var beam = new THREE.Mesh(beamVerticalGeometry, beamVerticalMaterial);
    beam.position.set(pos[0], 15, pos[1]);
    beam.castShadow = true;
    beam.receiveShadow = true;
    scene.add(beam);
    objects.push(beam);
  }
}

function buildPlatformRigging() {
  for (var i = 0; i < 6; i++) {
    var angle = (i / 6) * Math.PI * 2;
    var radius = 30;
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;

    var platformGeometry = new THREE.BoxGeometry(12, 1.5, 12);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: lightSteel });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, 20, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    objects.push(platform);

    var riggingGeometry = new THREE.CylinderGeometry(0.8, 0.8, 15, 12);
    var riggingMaterial = new THREE.MeshLambertMaterial({ color: steelGrey });
    var rigging = new THREE.Mesh(riggingGeometry, riggingMaterial);
    rigging.position.set(x, 12, z);
    rigging.castShadow = true;
    rigging.receiveShadow = true;
    scene.add(rigging);
    objects.push(rigging);

    platformRotations.push({
      platform: platform,
      angle: angle,
      radius: radius
    });
  }
}

function setupLighting() {
  var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  lights.push(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(80, 100, 80);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 4096;
  directionalLight.shadow.mapSize.height = 4096;
  directionalLight.shadow.camera.left = -150;
  directionalLight.shadow.camera.right = 150;
  directionalLight.shadow.camera.top = 150;
  directionalLight.shadow.camera.bottom = -150;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  scene.add(directionalLight);
  lights.push(directionalLight);

  var furnaceLight = new THREE.PointLight(0xff6600, 1.2, 80);
  furnaceLight.position.set(-35, 15, -45);
  scene.add(furnaceLight);
  lights.push(furnaceLight);

  var furnaceLight2 = new THREE.PointLight(0xff6600, 1.2, 80);
  furnaceLight2.position.set(35, 15, -45);
  scene.add(furnaceLight2);
  lights.push(furnaceLight2);

  var furnaceLight3 = new THREE.PointLight(0xff6600, 1.2, 80);
  furnaceLight3.position.set(-35, 15, 45);
  scene.add(furnaceLight3);
  lights.push(furnaceLight3);

  var furnaceLight4 = new THREE.PointLight(0xff6600, 1.2, 80);
  furnaceLight4.position.set(35, 15, 45);
  scene.add(furnaceLight4);
  lights.push(furnaceLight4);
}

function init(sceneRef, cameraRef) {
  scene = sceneRef;
  camera = cameraRef;
  objects = [];
  lights = [];
  turrets = [];
  furnaces = [];
  bridgeSections = [];
  pipeSystems = [];
  wallStructures = [];
  platformRotations = [];
  animationTime = 0;

  buildMainDome();
  buildDefensiveTurrets();
  buildFortressWalls();
  buildBridgeSections();
  buildIndustrialFurnaces();
  buildPressurePipes();
  buildScaffoldingTowers();
  buildFoundryFloor();
  buildCentralStructures();
  buildPlatformRigging();
  setupLighting();
}

function update(delta) {
  animationTime += delta;

  for (var i = 0; i < turrets.length; i++) {
    var turret = turrets[i];
    turret.gun.rotation.y = animationTime * 1.5 + (i * Math.PI / 4);
    turret.gun.rotation.z = Math.sin(animationTime * 2) * 0.5 + Math.PI * 0.25;
    turret.base.rotation.y = animationTime * 0.8;
  }

  for (var i = 0; i < furnaces.length; i++) {
    var furnace = furnaces[i];
    var glowPulse = 0.6 + Math.sin(animationTime * 3 + i) * 0.4;
    furnace.opening.material.color.setHex(Math.round(0xff * glowPulse) * 0x10000 + 0x6600);
    furnace.stack.rotation.y = animationTime * 0.3;
  }

  for (var i = 0; i < bridgeSections.length; i++) {
    var bridge = bridgeSections[i];
    var extendAmount = Math.sin(animationTime * 0.6) * 8;
    bridge.mesh.position.y = bridge.baseY + extendAmount * 0.5;
    bridge.mesh.position.z = bridge.mesh.position.z + extendAmount * 0.01;
  }

  for (var i = 0; i < platformRotations.length; i++) {
    var platform = platformRotations[i];
    var newAngle = platform.angle + animationTime * 0.15;
    var x = Math.cos(newAngle) * platform.radius;
    var z = Math.sin(newAngle) * platform.radius;
    platform.platform.position.x = x;
    platform.platform.position.z = z;
  }
}

function reset() {
  for (var i = 0; i < objects.length; i++) {
    scene.remove(objects[i]);
  }

  for (var i = 0; i < lights.length; i++) {
    scene.remove(lights[i]);
  }

  objects = [];
  lights = [];
  turrets = [];
  furnaces = [];
  bridgeSections = [];
  pipeSystems = [];
  wallStructures = [];
  platformRotations = [];
  scene = null;
  camera = null;
}

return {
  init: init,
  update: update,
  reset: reset
};

})();
