window.WarTower = (function() {
  'use strict';

  var scene;
  var camera;
  var elements = [];
  var spotlights = [];
  var drawbridgeGroup;
  var catapultArm;
  var roofSpotlight;
  var elapsedTime = 0;

  var stoneGray = 0x808080;
  var darkMetal = 0x2a2a2a;
  var warningRed = 0xcc0000;
  var lightBrown = 0xa0826d;
  var darkStone = 0x505050;

  function createBox(x, y, z, width, height, depth, color) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    elements.push(mesh);
    return mesh;
  }

  function createCylinder(x, y, z, radiusTop, radiusBottom, height, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    elements.push(mesh);
    return mesh;
  }

  function createSphere(x, y, z, radius, color) {
    var geometry = new THREE.SphereGeometry(radius, 16, 16);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    elements.push(mesh);
    return mesh;
  }

  function createCone(x, y, z, radius, height, color) {
    var geometry = new THREE.ConeGeometry(radius, height, 12);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    elements.push(mesh);
    return mesh;
  }

  function createSpikeLine(startX, startY, startZ, endX, endY, endZ, color) {
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      startX, startY, startZ,
      endX, endY, endZ
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
    elements.push(line);
    return line;
  }

  function buildMoat() {
    createBox(0, -0.5, 0, 80, 1, 80, darkStone);
    var spikeSpacing = 4;
    var spikeRadius = 15;
    for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      var sx = Math.cos(angle) * spikeRadius;
      var sz = Math.sin(angle) * spikeRadius;
      createCone(sx, 2, sz, 0.8, 4, warningRed);
    }
  }

  function buildCourtyard() {
    var wallHeight = 8;
    var wallThickness = 1.5;
    var courtRadius = 25;
    createBox(-courtRadius, wallHeight / 2, -courtRadius, wallThickness, wallHeight, wallThickness, lightBrown);
    createBox(courtRadius, wallHeight / 2, -courtRadius, wallThickness, wallHeight, wallThickness, lightBrown);
    createBox(-courtRadius, wallHeight / 2, courtRadius, wallThickness, wallHeight, wallThickness, lightBrown);
    createBox(courtRadius, wallHeight / 2, courtRadius, wallThickness, wallHeight, wallThickness, lightBrown);
    createBox(-courtRadius, wallHeight / 2, 0, wallThickness, wallHeight, 25, lightBrown);
    createBox(courtRadius, wallHeight / 2, 0, wallThickness, wallHeight, 25, lightBrown);
    createBox(0, wallHeight / 2, -courtRadius, 25, wallHeight, wallThickness, lightBrown);
    createBox(0, wallHeight / 2, courtRadius, 25, wallHeight, wallThickness, lightBrown);
  }

  function buildCoverCrates() {
    createBox(-12, 2, -12, 4, 4, 4, darkStone);
    createBox(12, 2, -12, 4, 4, 4, darkStone);
    createBox(-12, 2, 12, 4, 4, 4, darkStone);
    createBox(12, 2, 12, 4, 4, 4, darkStone);
    createBox(0, 2, 10, 3, 3, 3, darkStone);
    createBox(-8, 2, -8, 2.5, 2.5, 2.5, darkStone);
  }

  function buildDrawbridge() {
    drawbridgeGroup = new THREE.Group();
    var bridgeBase = createBox(0, 5, -22, 12, 0.8, 6, darkMetal);
    var bridgeLeft = createBox(-6.5, 5, -22, 1, 3, 6, darkMetal);
    var bridgeRight = createBox(6.5, 5, -22, 1, 3, 6, darkMetal);
    drawbridgeGroup.add(bridgeBase);
    drawbridgeGroup.add(bridgeLeft);
    drawbridgeGroup.add(bridgeRight);
    drawbridgeGroup.position.set(0, 0, 0);
    scene.add(drawbridgeGroup);
  }

  function buildMainTower() {
    var towerBaseRadius = 12;
    var towerHeight = 50;
    createCylinder(0, towerHeight / 2, 0, towerBaseRadius, towerBaseRadius, towerHeight, stoneGray);
    var stairCount = 12;
    for (var i = 0; i < stairCount; i++) {
      var stairHeight = (towerHeight / stairCount) * i + 2;
      var angle = (i / stairCount) * Math.PI * 2;
      var stairRadius = towerBaseRadius + 2;
      var stairX = Math.cos(angle) * stairRadius;
      var stairZ = Math.sin(angle) * stairRadius;
      createBox(stairX, stairHeight, stairZ, 2, 2, 2, darkMetal);
    }
  }

  function buildFloors() {
    var floorY = [8, 16, 24, 32, 40];
    for (var i = 0; i < floorY.length; i++) {
      createCylinder(0, floorY[i], 0, 11, 11, 0.5, darkStone);
      var gunSlotCount = 3;
      for (var j = 0; j < gunSlotCount; j++) {
        var slotAngle = (j / gunSlotCount) * Math.PI * 2;
        var slotX = Math.cos(slotAngle) * 10;
        var slotZ = Math.sin(slotAngle) * 10;
        createBox(slotX, floorY[i] + 1.5, slotZ, 2, 1, 1, warningRed);
      }
    }
  }

  function buildRoof() {
    createCone(0, 45, 0, 11, 8, stoneGray);
    createCylinder(0, 50, 0, 12, 12, 1, darkMetal);
  }

  function buildAAGun() {
    var baseHeight = 50.5;
    createCylinder(0, baseHeight, 0, 3, 3, 2, darkMetal);
    createCylinder(0, baseHeight + 2.5, 0, 2.5, 2.5, 3, darkMetal);
    createSphere(0, baseHeight + 4.5, 0, 1.5, darkMetal);
  }

  function buildCatapult() {
    var baseX = -20;
    var baseY = 2;
    var baseZ = -30;
    createBox(baseX, baseY, baseZ, 6, 1.5, 6, darkMetal);
    var armBase = createCylinder(baseX, baseY + 2, baseZ, 1.2, 1.2, 3, darkMetal);
    catapultArm = new THREE.Group();
    var armPart = createBox(0, 0, 0, 0.8, 8, 0.8, darkMetal);
    catapultArm.add(armPart);
    catapultArm.position.set(baseX, baseY + 3.5, baseZ);
    catapultArm.rotation.z = -0.4;
    scene.add(catapultArm);
    createSphere(baseX, baseY + 3, baseZ, 2, warningRed);
  }

  function buildSecondaryTower(posX, posZ) {
    createCylinder(posX, 15, posZ, 5, 5, 30, stoneGray);
    createCone(posX, 30, posZ, 5, 4, stoneGray);
    createCylinder(posX, 30.5, posZ, 5.5, 5.5, 0.8, darkMetal);
    for (var i = 0; i < 3; i++) {
      var floorLevel = 10 + (i * 6);
      createCylinder(posX, floorLevel, posZ, 4.8, 4.8, 0.4, darkStone);
    }
  }

  function buildSupplyDepot() {
    var depotX = 25;
    var depotY = 1;
    var depotZ = 25;
    createBox(depotX, depotY + 5, depotZ, 8, 10, 8, darkMetal);
    createBox(depotX, depotY + 0.5, depotZ, 10, 1, 10, darkStone);
    for (var i = 0; i < 4; i++) {
      var crateOffset = -3 + (i * 2);
      createBox(depotX + crateOffset, depotY + 3, depotZ, 1.5, 2, 1.5, lightBrown);
    }
  }

  function buildWallSegments() {
    createBox(0, 8, -28, 35, 3, 2, lightBrown);
    createBox(-20, 8, -15, 2, 3, 10, lightBrown);
    createBox(20, 8, -15, 2, 3, 10, lightBrown);
    createBox(0, 8, 28, 35, 3, 2, lightBrown);
  }

  function createSpotlight(posX, posY, posZ, targetX, targetY, targetZ, color) {
    var light = new THREE.SpotLight(color, 1, 100, Math.PI / 6, 0.8, 1);
    light.position.set(posX, posY, posZ);
    light.target.position.set(targetX, targetY, targetZ);
    light.castShadow = true;
    scene.add(light);
    scene.add(light.target);
    spotlights.push({
      light: light,
      baseX: posX,
      baseY: posY,
      baseZ: posZ,
      targetX: targetX,
      targetY: targetY,
      targetZ: targetZ
    });
  }

  function addAmbientLight() {
    var ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
  }

  function addRoofSpotlight() {
    roofSpotlight = new THREE.SpotLight(0xffcc00, 1.2, 120, Math.PI / 4, 0.9, 1);
    roofSpotlight.position.set(0, 52, 0);
    roofSpotlight.target.position.set(0, 0, 0);
    roofSpotlight.castShadow = true;
    scene.add(roofSpotlight);
    scene.add(roofSpotlight.target);
  }

  function initEnvironment() {
    buildMoat();
    buildCourtyard();
    buildCoverCrates();
    buildDrawbridge();
    buildMainTower();
    buildFloors();
    buildRoof();
    buildAAGun();
    buildCatapult();
    buildSecondaryTower(-30, -20);
    buildSecondaryTower(30, -20);
    buildSupplyDepot();
    buildWallSegments();
    addAmbientLight();
    addRoofSpotlight();
    createSpotlight(-25, 25, -25, 0, 10, 0, 0x0099ff);
    createSpotlight(25, 25, -25, 0, 10, 0, 0xff6600);
  }

  function updateDrawbridge(delta) {
    if (drawbridgeGroup) {
      var angle = Math.sin(elapsedTime * 0.5) * 0.5;
      drawbridgeGroup.rotation.x = angle;
    }
  }

  function updateCatapult(delta) {
    if (catapultArm) {
      var armAngle = -0.4 + Math.sin(elapsedTime * 1.2) * 0.6;
      catapultArm.rotation.z = armAngle;
    }
  }

  function updateSpotlights(delta) {
    for (var i = 0; i < spotlights.length; i++) {
      var spot = spotlights[i];
      var rotationAngle = (elapsedTime * 0.3) + (i * Math.PI * 2 / spotlights.length);
      var circleRadius = 15;
      var newX = spot.targetX + Math.cos(rotationAngle) * circleRadius;
      var newZ = spot.targetZ + Math.sin(rotationAngle) * circleRadius;
      spot.light.position.set(newX, spot.baseY, newZ);
    }
  }

  function updateRoofSpotlight(delta) {
    if (roofSpotlight) {
      var sweepAngle = (elapsedTime * 0.4) % (Math.PI * 2);
      roofSpotlight.target.position.set(
        Math.cos(sweepAngle) * 20,
        0,
        Math.sin(sweepAngle) * 20
      );
    }
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 150, 200);
    initEnvironment();
  }

  function update(delta) {
    elapsedTime += delta;
    updateDrawbridge(delta);
    updateCatapult(delta);
    updateSpotlights(delta);
    updateRoofSpotlight(delta);
  }

  function reset() {
    elapsedTime = 0;
    for (var i = elements.length - 1; i >= 0; i--) {
      scene.remove(elements[i]);
    }
    for (var j = spotlights.length - 1; j >= 0; j--) {
      scene.remove(spotlights[j].light);
      scene.remove(spotlights[j].light.target);
    }
    if (roofSpotlight) {
      scene.remove(roofSpotlight);
      scene.remove(roofSpotlight.target);
    }
    if (drawbridgeGroup) {
      scene.remove(drawbridgeGroup);
    }
    if (catapultArm) {
      scene.remove(catapultArm);
    }
    elements = [];
    spotlights = [];
    drawbridgeGroup = null;
    catapultArm = null;
    roofSpotlight = null;
    initEnvironment();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
