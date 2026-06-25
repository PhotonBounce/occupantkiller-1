window.WarResort = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var lights = [];
  var time = 0;

  function createMaterial(color, metalness, roughness) {
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: metalness || 0.5,
      roughness: roughness || 0.5
    });
  }

  function createHotelBuilding() {
    var hotelGroup = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(25, 35, 18);
    var baseMaterial = createMaterial(0xcccccc, 0.2, 0.8);
    var baseBody = new THREE.Mesh(baseGeometry, baseMaterial);
    baseBody.position.set(5, 17.5, 10);
    baseBody.castShadow = true;
    baseBody.receiveShadow = true;
    hotelGroup.add(baseBody);
    meshes.push(baseBody);

    var roofGeometry = new THREE.BoxGeometry(26, 3, 19);
    var roofMaterial = createMaterial(0xff6b6b, 0.3, 0.6);
    var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.position.set(5, 36.5, 10);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    hotelGroup.add(roofMesh);
    meshes.push(roofMesh);

    var windowFrame1Geometry = new THREE.BoxGeometry(3, 4, 1);
    var frameMaterial = createMaterial(0x1a1a1a, 0.8, 0.2);
    var windowFrame1 = new THREE.Mesh(windowFrame1Geometry, frameMaterial);
    windowFrame1.position.set(10, 25, 19);
    hotelGroup.add(windowFrame1);
    meshes.push(windowFrame1);

    var windowFrame2 = new THREE.Mesh(windowFrame1Geometry, frameMaterial);
    windowFrame2.position.set(0, 25, 19);
    hotelGroup.add(windowFrame2);
    meshes.push(windowFrame2);

    var windowFrame3 = new THREE.Mesh(windowFrame1Geometry, frameMaterial);
    windowFrame3.position.set(10, 10, 19);
    hotelGroup.add(windowFrame3);
    meshes.push(windowFrame3);

    var rubbleGeometry = new THREE.BoxGeometry(2, 2, 2);
    var debrisMaterial = createMaterial(0x8b8b8b, 0.4, 0.7);
    for (var i = 0; i < 5; i++) {
      var rubble = new THREE.Mesh(rubbleGeometry, debrisMaterial);
      rubble.position.set(8 + i * 2, 37.5, 8 + Math.sin(i) * 3);
      rubble.rotation.z = Math.random() * Math.PI;
      hotelGroup.add(rubble);
      meshes.push(rubble);
    }

    return hotelGroup;
  }

  function createSwimmingPool() {
    var poolGroup = new THREE.Group();

    var poolBottomGeometry = new THREE.BoxGeometry(22, 0.5, 16);
    var poolMaterial = createMaterial(0x4a90a4, 0.1, 0.6);
    var poolBottom = new THREE.Mesh(poolBottomGeometry, poolMaterial);
    poolBottom.position.set(45, 1, 35);
    poolBottom.castShadow = true;
    poolBottom.receiveShadow = true;
    poolGroup.add(poolBottom);
    meshes.push(poolBottom);

    var sandbagGeometry = new THREE.CylinderGeometry(1, 1.2, 2, 8);
    var sandbagMaterial = createMaterial(0xd4a574, 0.1, 0.9);
    for (var i = 0; i < 8; i++) {
      var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      var angleOffset = (i / 8) * Math.PI * 2;
      sandbag.position.set(
        45 + Math.cos(angleOffset) * 8,
        2.5,
        35 + Math.sin(angleOffset) * 6
      );
      sandbag.rotation.z = Math.random() * 0.3;
      poolGroup.add(sandbag);
      meshes.push(sandbag);
    }

    for (var j = 0; j < 6; j++) {
      var sandbagRing = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbagRing.position.set(45 + (j % 3) * 4 - 4, 2.5, 35 + Math.floor(j / 3) * 4 - 4);
      poolGroup.add(sandbagRing);
      meshes.push(sandbagRing);
    }

    return poolGroup;
  }

  function createPalmTrees() {
    var palmGroup = new THREE.Group();

    var trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 12, 6);
    var trunkMaterial = createMaterial(0x6b4423, 0.1, 0.8);

    var frondMaterial = createMaterial(0x2d5a2d, 0.2, 0.7);

    var palmPositions = [
      [70, 0, 15],
      [75, 0, 25],
      [68, 0, 40],
      [72, 0, 50],
      [25, 0, 55],
      [10, 0, 60]
    ];

    for (var p = 0; p < palmPositions.length; p++) {
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(palmPositions[p][0], palmPositions[p][1] + 6, palmPositions[p][2]);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      palmGroup.add(trunk);
      meshes.push(trunk);

      var frondGeometry1 = new THREE.ConeGeometry(4, 5, 8);
      var frond1 = new THREE.Mesh(frondGeometry1, frondMaterial);
      frond1.position.set(palmPositions[p][0], palmPositions[p][1] + 13, palmPositions[p][2]);
      frond1.castShadow = true;
      frond1.receiveShadow = true;
      palmGroup.add(frond1);
      meshes.push(frond1);

      var frondGeometry2 = new THREE.ConeGeometry(3, 4, 8);
      var frond2 = new THREE.Mesh(frondGeometry2, frondMaterial);
      frond2.position.set(palmPositions[p][0], palmPositions[p][1] + 14.5, palmPositions[p][2]);
      frond2.castShadow = true;
      frond2.receiveShadow = true;
      palmGroup.add(frond2);
      meshes.push(frond2);
    }

    return palmGroup;
  }

  function createBeachBar() {
    var barGroup = new THREE.Group();

    var counterGeometry = new THREE.BoxGeometry(8, 2, 4);
    var counterMaterial = createMaterial(0x8b4513, 0.3, 0.7);
    var counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(55, 1, 65);
    counter.castShadow = true;
    counter.receiveShadow = true;
    barGroup.add(counter);
    meshes.push(counter);

    var roofGeometry = new THREE.BoxGeometry(10, 1, 6);
    var roofMaterial = createMaterial(0xff8c00, 0.4, 0.6);
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(55, 5, 65);
    roof.castShadow = true;
    roof.receiveShadow = true;
    barGroup.add(roof);
    meshes.push(roof);

    var supportGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 6);
    var supportMaterial = createMaterial(0xcccccc, 0.2, 0.8);
    var support1 = new THREE.Mesh(supportGeometry, supportMaterial);
    support1.position.set(50, 1.5, 62);
    barGroup.add(support1);
    meshes.push(support1);

    var support2 = new THREE.Mesh(supportGeometry, supportMaterial);
    support2.position.set(60, 1.5, 62);
    barGroup.add(support2);
    meshes.push(support2);

    var support3 = new THREE.Mesh(supportGeometry, supportMaterial);
    support3.position.set(50, 1.5, 68);
    barGroup.add(support3);
    meshes.push(support3);

    var support4 = new THREE.Mesh(supportGeometry, supportMaterial);
    support4.position.set(60, 1.5, 68);
    barGroup.add(support4);
    meshes.push(support4);

    return barGroup;
  }

  function createTennisCourt() {
    var courtGroup = new THREE.Group();

    var courtSurfaceGeometry = new THREE.BoxGeometry(20, 0.2, 12);
    var courtMaterial = createMaterial(0x90ee90, 0.1, 0.8);
    var surface = new THREE.Mesh(courtSurfaceGeometry, courtMaterial);
    surface.position.set(30, 0.1, 10);
    surface.receiveShadow = true;
    courtGroup.add(surface);
    meshes.push(surface);

    var fenceGeometry = new THREE.BoxGeometry(0.3, 3, 12.5);
    var fenceMaterial = createMaterial(0x666666, 0.3, 0.6);
    var fenceLeft = new THREE.Mesh(fenceGeometry, fenceMaterial);
    fenceLeft.position.set(19.5, 1.5, 10);
    fenceLeft.castShadow = true;
    courtGroup.add(fenceLeft);
    meshes.push(fenceLeft);

    var fenceRight = new THREE.Mesh(fenceGeometry, fenceMaterial);
    fenceRight.position.set(40.5, 1.5, 10);
    fenceRight.castShadow = true;
    courtGroup.add(fenceRight);
    meshes.push(fenceRight);

    var fenceBackGeometry = new THREE.BoxGeometry(21, 3, 0.3);
    var fenceBack = new THREE.Mesh(fenceBackGeometry, fenceMaterial);
    fenceBack.position.set(30, 1.5, 3.85);
    fenceBack.castShadow = true;
    courtGroup.add(fenceBack);
    meshes.push(fenceBack);

    var fenceFront = new THREE.Mesh(fenceBackGeometry, fenceMaterial);
    fenceFront.position.set(30, 1.5, 16.15);
    fenceFront.castShadow = true;
    courtGroup.add(fenceFront);
    meshes.push(fenceFront);

    return courtGroup;
  }

  function createMilitaryVehicles() {
    var vehicleGroup = new THREE.Group();

    var hullGeometry = new THREE.BoxGeometry(6, 2.5, 3);
    var vehicleMaterial = createMaterial(0x4a5f4a, 0.4, 0.7);
    var hull = new THREE.Mesh(hullGeometry, vehicleMaterial);
    hull.position.set(65, 1.25, 45);
    hull.castShadow = true;
    hull.receiveShadow = true;
    vehicleGroup.add(hull);
    meshes.push(hull);

    var turretGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 8);
    var turretMesh = new THREE.Mesh(turretGeometry, vehicleMaterial);
    turretMesh.position.set(65, 3, 45);
    turretMesh.castShadow = true;
    vehicleGroup.add(turretMesh);
    meshes.push(turretMesh);

    var gunGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
    var gun = new THREE.Mesh(gunGeometry, vehicleMaterial);
    gun.position.set(67, 3.5, 45);
    gun.rotation.z = Math.PI / 4;
    vehicleGroup.add(gun);
    meshes.push(gun);

    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8);
    var wheelMaterial = createMaterial(0x1a1a1a, 0.8, 0.3);
    var wheelPositions = [
      [62, 0.8, 44],
      [62, 0.8, 46],
      [68, 0.8, 44],
      [68, 0.8, 46]
    ];
    for (var w = 0; w < wheelPositions.length; w++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(wheelPositions[w][0], wheelPositions[w][1], wheelPositions[w][2]);
      wheel.rotation.z = Math.PI / 2;
      vehicleGroup.add(wheel);
      meshes.push(wheel);
    }

    return vehicleGroup;
  }

  function createLighthouse() {
    var lighthouseGroup = new THREE.Group();

    var baseGeometry = new THREE.CylinderGeometry(2, 2.5, 1.5, 8);
    var baseMaterial = createMaterial(0x8b8b8b, 0.3, 0.8);
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(15, 0.75, 2);
    base.castShadow = true;
    base.receiveShadow = true;
    lighthouseGroup.add(base);
    meshes.push(base);

    var towerGeometry = new THREE.CylinderGeometry(1.2, 1.2, 20, 8);
    var towerMaterial = createMaterial(0xffffff, 0.2, 0.9);
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(15, 10, 2);
    tower.castShadow = true;
    tower.receiveShadow = true;
    lighthouseGroup.add(tower);
    meshes.push(tower);

    var bulbGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var bulbMaterial = createMaterial(0xffff00, 0.8, 0.2);
    var bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.set(15, 21, 2);
    bulb.castShadow = true;
    lighthouseGroup.add(bulb);
    meshes.push(bulb);

    var lightFixture = new THREE.Light();
    lightFixture.intensity = 0;
    lighthouseGroup.add(lightFixture);

    var pointLight = new THREE.PointLight(0xffff00, 2, 50);
    pointLight.position.set(15, 21, 2);
    pointLight.castShadow = true;
    lighthouseGroup.add(pointLight);
    lights.push(pointLight);

    return lighthouseGroup;
  }

  function createOverturnedSunbeds() {
    var sunbedGroup = new THREE.Group();

    var frameGeometry = new THREE.BoxGeometry(2, 0.2, 1);
    var frameMaterial = createMaterial(0xd4a574, 0.3, 0.7);

    var fabricGeometry = new THREE.BoxGeometry(2.2, 1, 0.05);
    var fabricMaterial = createMaterial(0xff6b9d, 0.1, 0.8);

    var sunbedPositions = [
      [35, 0.5, 55],
      [42, 0.5, 50],
      [28, 0.5, 52],
      [38, 0.5, 45]
    ];

    for (var s = 0; s < sunbedPositions.length; s++) {
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(sunbedPositions[s][0], sunbedPositions[s][1], sunbedPositions[s][2]);
      frame.rotation.z = 0.5 + s * 0.3;
      sunbedGroup.add(frame);
      meshes.push(frame);

      var fabric = new THREE.Mesh(fabricGeometry, fabricMaterial);
      fabric.position.set(sunbedPositions[s][0], sunbedPositions[s][1] + 0.5, sunbedPositions[s][2]);
      fabric.rotation.z = 0.5 + s * 0.3;
      sunbedGroup.add(fabric);
      meshes.push(fabric);
    }

    return sunbedGroup;
  }

  function createBeach() {
    var beachGroup = new THREE.Group();

    var sandGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var sandMaterial = createMaterial(0xf4a460, 0.1, 0.9);
    var sand = new THREE.Mesh(sandGeometry, sandMaterial);
    sand.position.set(40, -0.25, 40);
    sand.receiveShadow = true;
    beachGroup.add(sand);
    meshes.push(sand);

    var rockyPointGeometry = new THREE.SphereGeometry(8, 8, 6);
    var rockMaterial = createMaterial(0x8b7355, 0.4, 0.8);
    var rockOutcrop = new THREE.Mesh(rockyPointGeometry, rockMaterial);
    rockOutcrop.position.set(12, 3, 0);
    rockOutcrop.scale.set(1, 0.6, 1.2);
    rockOutcrop.castShadow = true;
    rockOutcrop.receiveShadow = true;
    beachGroup.add(rockOutcrop);
    meshes.push(rockOutcrop);

    return beachGroup;
  }

  function createPoolDeck() {
    var deckGroup = new THREE.Group();

    var decking1Geometry = new THREE.BoxGeometry(30, 0.3, 25);
    var deckMaterial = createMaterial(0xcccccc, 0.2, 0.8);
    var decking1 = new THREE.Mesh(decking1Geometry, deckMaterial);
    decking1.position.set(50, 3.5, 30);
    decking1.receiveShadow = true;
    deckGroup.add(decking1);
    meshes.push(decking1);

    var barricadeGeometry = new THREE.BoxGeometry(1, 1.5, 20);
    var barricadeMaterial = createMaterial(0x6b4423, 0.3, 0.7);
    var barricade1 = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
    barricade1.position.set(35, 2.2, 30);
    barricade1.rotation.z = 0.1;
    barricade1.castShadow = true;
    deckGroup.add(barricade1);
    meshes.push(barricade1);

    var barricade2 = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
    barricade2.position.set(65, 2.2, 30);
    barricade2.rotation.z = -0.1;
    barricade2.castShadow = true;
    deckGroup.add(barricade2);
    meshes.push(barricade2);

    return deckGroup;
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    var beachGeometry = createBeach();
    scene.add(beachGeometry);

    var hotelGeometry = createHotelBuilding();
    scene.add(hotelGeometry);

    var poolGeometry = createSwimmingPool();
    scene.add(poolGeometry);

    var palmTreeGeometry = createPalmTrees();
    scene.add(palmTreeGeometry);

    var beachBarGeometry = createBeachBar();
    scene.add(beachBarGeometry);

    var tennisCourtGeometry = createTennisCourt();
    scene.add(tennisCourtGeometry);

    var vehicleGeometry = createMilitaryVehicles();
    scene.add(vehicleGeometry);

    var lighthouseGeometry = createLighthouse();
    scene.add(lighthouseGeometry);

    var sunbedGeometry = createOverturnedSunbeds();
    scene.add(sunbedGeometry);

    var deckGeometry = createPoolDeck();
    scene.add(deckGeometry);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(30, 40, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 80;
    sunLight.shadow.camera.bottom = -80;
    scene.add(sunLight);
    lights.push(sunLight);

    var skyLight = new THREE.HemisphereLight(0x87ceeb, 0xf0f0f0, 0.5);
    scene.add(skyLight);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < lights.length; i++) {
      if (lights[i] instanceof THREE.PointLight) {
        lights[i].intensity = 2 + Math.sin(time * 1.5) * 0.5;
      }
    }

    for (var j = 0; j < meshes.length; j++) {
      if (meshes[j].material && meshes[j].material.color) {
        if (meshes[j].material.color.getHex() === 0x4a90a4) {
          meshes[j].material.emissive.setHex(0x2a5a7a);
          meshes[j].material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
        }
      }
    }

    for (var k = 0; k < meshes.length; k++) {
      if (meshes[k].geometry instanceof THREE.ConeGeometry) {
        var originalY = meshes[k].userData.originalY;
        if (originalY === undefined) {
          meshes[k].userData.originalY = meshes[k].position.y;
          originalY = meshes[k].position.y;
        }
        meshes[k].position.y = originalY + Math.sin(time * 1.2 + k) * 0.3;
        meshes[k].rotation.x = Math.sin(time * 0.8 + k * 0.5) * 0.1;
      }
    }
  }

  function reset() {
    time = 0;
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].userData.originalY !== undefined) {
        meshes[i].position.y = meshes[i].userData.originalY;
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
