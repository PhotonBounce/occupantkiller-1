window.SatelliteStation = (function() { 'use strict';

var scene, camera;
var allObjects = [];
var dishes = [];
var technicians = [];
var guards = [];
var serverFans = [];
var radarDome = null;
var backupAntenna = null;
var cables = [];

var hudVisible = false;
var lastSKeyTime = 0;
var keysPressed = {};
var dishesDisabled = 0;
var encryptionKeysCopied = false;
var techniciansNeutralized = 0;

function init(scene_, camera_) {
  scene = scene_;
  camera = camera_;
  allObjects = [];
  dishes = [];
  technicians = [];
  guards = [];
  serverFans = [];
  radarDome = null;
  backupAntenna = null;
  cables = [];

  dishesDisabled = 0;
  encryptionKeysCopied = false;
  techniciansNeutralized = 0;
  hudVisible = false;
  lastSKeyTime = 0;
  keysPressed = {};

  buildScene();
  setupHUD();
  setupKeyboardInput();
}

function buildScene() {
  // 1. Concrete station pad
  var padGeo = new THREE.BoxGeometry(200, 5, 200);
  var padMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
  var pad = new THREE.Mesh(padGeo, padMat);
  pad.position.y = 0;
  scene.add(pad);
  allObjects.push(pad);

  // 2. Large primary dish antenna (cylinder base + box dish face)
  var dishBase1Geo = new THREE.CylinderGeometry(8, 8, 3, 32);
  var dishBaseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  var dishBase1 = new THREE.Mesh(dishBase1Geo, dishBaseMat);
  dishBase1.position.set(-60, 8, -40);
  scene.add(dishBase1);
  allObjects.push(dishBase1);

  var dishFace1Geo = new THREE.BoxGeometry(25, 25, 2);
  var dishFaceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6 });
  var dishFace1 = new THREE.Mesh(dishFace1Geo, dishFaceMat);
  dishFace1.position.set(-60, 20, -40);
  dishFace1.rotation.x = Math.PI * 0.3;
  scene.add(dishFace1);
  allObjects.push(dishFace1);
  dishes.push(dishFace1);

  // 3. Secondary tracking dish
  var dishBase2Geo = new THREE.CylinderGeometry(6, 6, 2.5, 32);
  var dishBase2 = new THREE.Mesh(dishBase2Geo, dishBaseMat);
  dishBase2.position.set(40, 6.5, -50);
  scene.add(dishBase2);
  allObjects.push(dishBase2);

  var dishFace2Geo = new THREE.BoxGeometry(18, 18, 1.5);
  var dishFace2 = new THREE.Mesh(dishFace2Geo, dishFaceMat);
  dishFace2.position.set(40, 16, -50);
  dishFace2.rotation.x = Math.PI * 0.25;
  dishFace2.rotation.z = Math.PI * 0.1;
  scene.add(dishFace2);
  allObjects.push(dishFace2);
  dishes.push(dishFace2);

  // 4. SIGINT radar dome radome (sphere on box base)
  var radomeBase = new THREE.BoxGeometry(20, 8, 20);
  var radomeBaseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  var radomeBaseObj = new THREE.Mesh(radomeBase, radomeBaseMat);
  radomeBaseObj.position.set(0, 8, 60);
  scene.add(radomeBaseObj);
  allObjects.push(radomeBaseObj);

  var radiomeGeo = new THREE.SphereGeometry(12, 32, 32);
  var radiomeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 });
  radarDome = new THREE.Mesh(radiomeGeo, radiomeMat);
  radarDome.position.set(0, 24, 60);
  scene.add(radarDome);
  allObjects.push(radarDome);

  // 5. Main operations building
  var buildingGeo = new THREE.BoxGeometry(40, 30, 35);
  var buildingMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  var building = new THREE.Mesh(buildingGeo, buildingMat);
  building.position.set(-80, 15, 20);
  scene.add(building);
  allObjects.push(building);

  var windowGeometry = new THREE.LineSegments(new THREE.EdgesGeometry(buildingGeo));
  var windowMat = new THREE.LineBasicMaterial({ color: 0xff9900 });
  var windowLines = new THREE.LineSegments(windowGeometry.geometry, windowMat);
  windowLines.position.copy(building.position);
  scene.add(windowLines);
  allObjects.push(windowLines);

  // 6. Server cooling unit (box + cylinder fans)
  var serverBoxGeo = new THREE.BoxGeometry(12, 25, 15);
  var serverMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  var serverBox = new THREE.Mesh(serverBoxGeo, serverMat);
  serverBox.position.set(-40, 12.5, 50);
  scene.add(serverBox);
  allObjects.push(serverBox);

  var fan1Geo = new THREE.CylinderGeometry(4, 4, 2, 32);
  var fanMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  var fan1 = new THREE.Mesh(fan1Geo, fanMat);
  fan1.position.set(-40, 25, 50);
  fan1.rotation.z = Math.PI * 0.5;
  scene.add(fan1);
  allObjects.push(fan1);
  serverFans.push(fan1);

  var fan2 = new THREE.Mesh(fan1Geo, fanMat);
  fan2.position.set(-40, 15, 50);
  fan2.rotation.z = Math.PI * 0.5;
  scene.add(fan2);
  allObjects.push(fan2);
  serverFans.push(fan2);

  // 7. Antenna mast array (6 tall cylinders + crossbars)
  for (var i = 0; i < 6; i++) {
    var angle = (i / 6) * Math.PI * 2;
    var x = Math.cos(angle) * 50;
    var z = Math.sin(angle) * 50;

    var mastGeo = new THREE.CylinderGeometry(1.5, 1.5, 40, 16);
    var mastMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(x, 20, z);
    scene.add(mast);
    allObjects.push(mast);

    // Crossbars
    var crossbarGeo = new THREE.BoxGeometry(4, 0.5, 4);
    var crossbar = new THREE.Mesh(crossbarGeo, mastMat);
    crossbar.position.set(x, 25, z);
    scene.add(crossbar);
    allObjects.push(crossbar);
  }

  // 8. Satellite uplink trailer (box + wheels)
  var trailerGeo = new THREE.BoxGeometry(18, 12, 8);
  var trailerMat = new THREE.MeshStandardMaterial({ color: 0x664444 });
  var trailer = new THREE.Mesh(trailerGeo, trailerMat);
  trailer.position.set(70, 6, -60);
  scene.add(trailer);
  allObjects.push(trailer);

  var wheel1Geo = new THREE.CylinderGeometry(2, 2, 1.5, 16);
  var wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  var wheel1 = new THREE.Mesh(wheel1Geo, wheelMat);
  wheel1.position.set(60, 2, -60);
  wheel1.rotation.z = Math.PI * 0.5;
  scene.add(wheel1);
  allObjects.push(wheel1);

  var wheel2 = new THREE.Mesh(wheel1Geo, wheelMat);
  wheel2.position.set(80, 2, -60);
  wheel2.rotation.z = Math.PI * 0.5;
  scene.add(wheel2);
  allObjects.push(wheel2);

  // 9. Power distribution substation (box + conduit)
  var substationGeo = new THREE.BoxGeometry(15, 20, 12);
  var substationMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  var substation = new THREE.Mesh(substationGeo, substationMat);
  substation.position.set(-70, 10, -70);
  scene.add(substation);
  allObjects.push(substation);

  var conduit1Geo = new THREE.BoxGeometry(2, 15, 2);
  var conduitMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  var conduit1 = new THREE.Mesh(conduit1Geo, conduitMat);
  conduit1.position.set(-60, 12, -70);
  scene.add(conduit1);
  allObjects.push(conduit1);

  // 10. Fuel storage tanks (3 cylinders)
  for (var j = 0; j < 3; j++) {
    var tankGeo = new THREE.CylinderGeometry(5, 5, 20, 32);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0xaa4444 });
    var tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(50 + j * 18, 10, 30);
    scene.add(tank);
    allObjects.push(tank);
  }

  // 11. Security perimeter fence (LineSegments + posts)
  var fencePoints = [];
  var fenceRadius = 120;
  for (var k = 0; k <= 16; k++) {
    var fAngle = (k / 16) * Math.PI * 2;
    var fx = Math.cos(fAngle) * fenceRadius;
    var fz = Math.sin(fAngle) * fenceRadius;
    fencePoints.push(new THREE.Vector3(fx, 3, fz));
  }
  var fenceGeometry = new THREE.BufferGeometry().setFromPoints(fencePoints);
  var fenceMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
  var fence = new THREE.LineSegments(fenceGeometry, fenceMat);
  scene.add(fence);
  allObjects.push(fence);

  // Fence posts
  for (var fp = 0; fp < 8; fp++) {
    var fpAngle = (fp / 8) * Math.PI * 2;
    var fpx = Math.cos(fpAngle) * fenceRadius;
    var fpz = Math.sin(fpAngle) * fenceRadius;
    var postGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    var postMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.set(fpx, 3, fpz);
    scene.add(post);
    allObjects.push(post);
  }

  // 12. Guard bunker (half-buried box)
  var bunkerGeo = new THREE.BoxGeometry(20, 15, 25);
  var bunkerMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  var bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
  bunker.position.set(80, 5, 50);
  scene.add(bunker);
  allObjects.push(bunker);

  // 13. Electronic warfare pod (box on cylinder pylon)
  var pylonGeo = new THREE.CylinderGeometry(2, 2, 15, 16);
  var pylonMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
  var pylon = new THREE.Mesh(pylonGeo, pylonMat);
  pylon.position.set(-30, 7.5, -30);
  scene.add(pylon);
  allObjects.push(pylon);

  var ewPodGeo = new THREE.BoxGeometry(12, 8, 6);
  var ewPodMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  var ewPod = new THREE.Mesh(ewPodGeo, ewPodMat);
  ewPod.position.set(-30, 22, -30);
  scene.add(ewPod);
  allObjects.push(ewPod);

  // 14. Weather monitoring station
  var weatherBodyGeo = new THREE.CylinderGeometry(2, 2, 12, 16);
  var weatherMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  var weatherBody = new THREE.Mesh(weatherBodyGeo, weatherMat);
  weatherBody.position.set(20, 6, 80);
  scene.add(weatherBody);
  allObjects.push(weatherBody);

  var weatherInstrGeo = new THREE.BoxGeometry(3, 3, 3);
  var weatherInstr = new THREE.Mesh(weatherInstrGeo, weatherMat);
  weatherInstr.position.set(20, 18, 80);
  scene.add(weatherInstr);
  allObjects.push(weatherInstr);

  // 15. Personnel (4 technicians + 3 guards)
  var techPositions = [
    { x: -50, z: 0 },
    { x: -20, z: 10 },
    { x: 10, z: -20 },
    { x: 30, z: 20 }
  ];

  for (var t = 0; t < 4; t++) {
    var techBody = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 1),
      new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    techBody.position.set(techPositions[t].x, 2, techPositions[t].z);
    scene.add(techBody);
    allObjects.push(techBody);
    technicians.push(techBody);

    var techHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffcc99 })
    );
    techHead.position.set(techPositions[t].x, 5, techPositions[t].z);
    scene.add(techHead);
    allObjects.push(techHead);
  }

  var guardPositions = [
    { x: 0, z: 0 },
    { x: -80, z: 80 },
    { x: 80, z: -80 }
  ];

  for (var g = 0; g < 3; g++) {
    var guardBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 4.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    guardBody.position.set(guardPositions[g].x, 2.25, guardPositions[g].z);
    scene.add(guardBody);
    allObjects.push(guardBody);
    guards.push(guardBody);

    var guardHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffcc99 })
    );
    guardHead.position.set(guardPositions[g].x, 5.5, guardPositions[g].z);
    scene.add(guardHead);
    allObjects.push(guardHead);
  }

  // 16. Cable conduit runs (LineSegments network)
  var cableStartPoints = [
    new THREE.Vector3(-80, 3, 20),
    new THREE.Vector3(-70, 3, -70),
    new THREE.Vector3(0, 3, 60),
    new THREE.Vector3(70, 3, -60),
    new THREE.Vector3(50, 3, 30)
  ];

  var cableEndPoints = [
    new THREE.Vector3(-40, 3, 50),
    new THREE.Vector3(-40, 3, 50),
    new THREE.Vector3(-40, 3, 50),
    new THREE.Vector3(-40, 3, 50),
    new THREE.Vector3(-40, 3, 50)
  ];

  for (var c = 0; c < cableStartPoints.length; c++) {
    var cableLineGeo = new THREE.BufferGeometry().setFromPoints([
      cableStartPoints[c],
      cableEndPoints[c]
    ]);
    var cableMat = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 3 });
    var cable = new THREE.LineSegments(cableLineGeo, cableMat);
    scene.add(cable);
    allObjects.push(cable);
    cables.push(cable);
  }

  // 17. Emergency backup antenna (deployable rotating box arm)
  var deployBaseGeo = new THREE.BoxGeometry(8, 5, 8);
  var deployBaseMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  var deployBase = new THREE.Mesh(deployBaseGeo, deployBaseMat);
  deployBase.position.set(0, 2.5, -80);
  scene.add(deployBase);
  allObjects.push(deployBase);

  var backupArmGeo = new THREE.BoxGeometry(4, 2, 15);
  var armMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  backupAntenna = new THREE.Mesh(backupArmGeo, armMat);
  backupAntenna.position.set(0, 7, -80);
  backupAntenna.rotation.z = Math.PI * 0.3;
  scene.add(backupAntenna);
  allObjects.push(backupAntenna);
}

function setupHUD() {
  var hudCanvas = document.getElementById('satellite-hud');
  if (!hudCanvas) {
    hudCanvas = document.createElement('canvas');
    hudCanvas.id = 'satellite-hud';
    hudCanvas.width = 400;
    hudCanvas.height = 150;
    hudCanvas.style.position = 'fixed';
    hudCanvas.style.top = '20px';
    hudCanvas.style.left = '20px';
    hudCanvas.style.zIndex = '9999';
    hudCanvas.style.display = 'none';
    hudCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    hudCanvas.style.border = '2px solid #00ff00';
    hudCanvas.style.fontFamily = 'monospace';
    hudCanvas.style.color = '#00ff00';
    document.body.appendChild(hudCanvas);
  }
}

function updateHUD() {
  var hudCanvas = document.getElementById('satellite-hud');
  if (!hudCanvas) return;

  var ctx = hudCanvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, hudCanvas.width, hudCanvas.height);

  ctx.fillStyle = '#00ff00';
  ctx.font = '12px monospace';
  ctx.fillText('DISHES DISABLED: ' + dishesDisabled + '/2', 10, 20);
  ctx.fillText('ENCRYPTION KEYS COPIED: ' + (encryptionKeysCopied ? 'YES' : 'NO'), 10, 40);
  ctx.fillText('TECHNICIANS NEUTRALIZED: ' + techniciansNeutralized + '/4', 10, 60);
  ctx.fillText('[Press S+S to toggle HUD]', 10, 80);
}

function setupKeyboardInput() {
  document.addEventListener('keydown', function(e) {
    keysPressed[e.key.toUpperCase()] = true;

    if (e.key.toUpperCase() === 'S') {
      var now = Date.now();
      if (now - lastSKeyTime < 400) {
        hudVisible = !hudVisible;
        var hudCanvas = document.getElementById('satellite-hud');
        if (hudCanvas) {
          hudCanvas.style.display = hudVisible ? 'block' : 'none';
        }
        lastSKeyTime = 0;
      } else {
        lastSKeyTime = now;
      }
    }
  });

  document.addEventListener('keyup', function(e) {
    keysPressed[e.key.toUpperCase()] = false;
  });
}

function update(delta) {
  if (!scene) return;

  // Primary dish tracks (slow rotation)
  if (dishes[0]) {
    dishes[0].rotation.x += delta * 0.05;
    dishes[0].rotation.y += delta * 0.03;
  }

  // Secondary dish moves independently
  if (dishes[1]) {
    dishes[1].rotation.x += delta * 0.08;
    dishes[1].rotation.y -= delta * 0.04;
  }

  // Radar dome rotates
  if (radarDome) {
    radarDome.rotation.y += delta * 0.15;
  }

  // Server fans spin
  for (var i = 0; i < serverFans.length; i++) {
    serverFans[i].rotation.z += delta * 2;
  }

  // Backup antenna deploys (rotating outward)
  if (backupAntenna) {
    var time = Date.now() * 0.001;
    backupAntenna.rotation.z = Math.PI * 0.3 + Math.sin(time * 0.5) * 0.2;
  }

  // Cable lights pulse (emissive)
  for (var j = 0; j < cables.length; j++) {
    if (cables[j].material) {
      var pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
      cables[j].material.color.setScalar(pulse);
    }
  }

  if (hudVisible) {
    updateHUD();
  }
}

function reset() {
  // Dispose all objects
  for (var i = 0; i < allObjects.length; i++) {
    var obj = allObjects[i];
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        for (var m = 0; m < obj.material.length; m++) {
          obj.material[m].dispose();
        }
      } else {
        obj.material.dispose();
      }
    }
    if (obj.parent) obj.parent.remove(obj);
  }

  allObjects = [];
  dishes = [];
  technicians = [];
  guards = [];
  serverFans = [];
  radarDome = null;
  backupAntenna = null;
  cables = [];

  dishesDisabled = 0;
  encryptionKeysCopied = false;
  techniciansNeutralized = 0;
  hudVisible = false;

  var hudCanvas = document.getElementById('satellite-hud');
  if (hudCanvas) {
    hudCanvas.style.display = 'none';
  }
}

return {
  init: init,
  update: update,
  reset: reset
};

}());
