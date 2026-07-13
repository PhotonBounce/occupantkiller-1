window.RuinsCity = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var gameObjects = [];
  var fireParticles = [];
  var debrisParticles = [];
  var vineSway = [];
  var explosionFlashes = [];
  var ambientTime = 0;

  function createMaterial(color, emissive) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: Math.random() * 0.3 + 0.2,
      roughness: Math.random() * 0.6 + 0.3
    });
  }

  function createCrackedAsphaltStreet() {
    var streetGroup = new THREE.Group();

    for (var x = -80; x < 80; x += 20) {
      for (var z = -80; z < 80; z += 20) {
        var crackChance = Math.random();
        if (crackChance > 0.3) {
          var streetGeom = new THREE.BoxGeometry(18, 0.5, 18);
          var streetMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.1,
            roughness: 0.8
          });
          var street = new THREE.Mesh(streetGeom, streetMat);
          street.position.set(x, -0.25, z);
          street.castShadow = true;
          street.receiveShadow = true;
          streetGroup.add(street);

          if (crackChance > 0.6) {
            var crackGeom = new THREE.BoxGeometry(16, 0.3, 2);
            var crackMat = new THREE.MeshStandardMaterial({
              color: 0x1a1a1a,
              metalness: 0,
              roughness: 0.9
            });
            var crack = new THREE.Mesh(crackGeom, crackMat);
            crack.position.set(x, 0.1, z + Math.random() * 10 - 5);
            crack.castShadow = true;
            street.add(crack);
          }
        }
      }
    }
    return streetGroup;
  }

  function createRuinShells() {
    var ruinsGroup = new THREE.Group();
    var ruinPositions = [
      { x: -50, z: 30, h: 60, w: 25, d: 25 },
      { x: 40, z: -50, h: 50, w: 30, d: 20 },
      { x: -30, z: -40, h: 70, w: 22, d: 22 },
      { x: 60, z: 20, h: 55, w: 28, d: 18 }
    ];

    ruinPositions.forEach(function(pos) {
      var wallMat = createMaterial(0x664444, 0x0a0a0a);

      var outerWall = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      var shell = new THREE.Mesh(outerWall, wallMat);
      shell.position.set(pos.x, pos.h / 2 - 2, pos.z);
      shell.castShadow = true;
      shell.receiveShadow = true;
      ruinsGroup.add(shell);

      var innerVoid = new THREE.BoxGeometry(pos.w - 4, pos.h - 10, pos.d - 4);
      var voidMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        emissive: 0x050505,
        metalness: 0,
        roughness: 1
      });
      var void3d = new THREE.Mesh(innerVoid, voidMat);
      void3d.position.set(pos.x, pos.h / 2 - 5, pos.z);
      void3d.castShadow = false;
      void3d.receiveShadow = true;
      ruinsGroup.add(void3d);

      for (var i = 0; i < 3; i++) {
        var floorGeom = new THREE.BoxGeometry(pos.w - 5, 1, pos.d - 5);
        var floorMat = createMaterial(0x555544);
        var floor = new THREE.Mesh(floorGeom, floorMat);
        floor.position.set(pos.x, i * 15 + 5, pos.z);
        floor.castShadow = true;
        floor.receiveShadow = true;
        ruinsGroup.add(floor);
      }
    });

    return ruinsGroup;
  }

  function createRubblePiles() {
    var rubbleGroup = new THREE.Group();
    var rubbleSites = [
      { x: -70, z: -60, radius: 20 },
      { x: 70, z: 60, radius: 18 },
      { x: 20, z: 20, radius: 15 }
    ];

    rubbleSites.forEach(function(site) {
      for (var i = 0; i < 12; i++) {
        var chunkSize = Math.random() * 4 + 2;
        var chunkGeom = new THREE.BoxGeometry(chunkSize, chunkSize * 0.7, chunkSize);
        var chunkMat = createMaterial(0x775555);
        var chunk = new THREE.Mesh(chunkGeom, chunkMat);

        var angle = (i / 12) * Math.PI * 2;
        var dist = Math.random() * site.radius;
        chunk.position.set(
          site.x + Math.cos(angle) * dist,
          chunkSize * 0.35,
          site.z + Math.sin(angle) * dist
        );
        chunk.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
        chunk.castShadow = true;
        chunk.receiveShadow = true;
        rubbleGroup.add(chunk);
      }
    });

    return rubbleGroup;
  }

  function createCollapsedOverpass() {
    var overpassGroup = new THREE.Group();

    var supportMat = createMaterial(0x443333);
    var bridgeGeom = new THREE.BoxGeometry(40, 3, 15);

    var section1 = new THREE.Mesh(bridgeGeom, supportMat);
    section1.position.set(-15, 25, 0);
    section1.rotation.z = -0.3;
    section1.castShadow = true;
    section1.receiveShadow = true;
    overpassGroup.add(section1);

    var section2 = new THREE.Mesh(bridgeGeom, supportMat);
    section2.position.set(20, 20, 0);
    section2.rotation.z = 0.4;
    section2.castShadow = true;
    section2.receiveShadow = true;
    overpassGroup.add(section2);

    var section3 = new THREE.Mesh(new THREE.BoxGeometry(35, 2, 12), supportMat);
    section3.position.set(5, 15, -3);
    section3.rotation.z = -0.2;
    section3.castShadow = true;
    section3.receiveShadow = true;
    overpassGroup.add(section3);

    var pillarGeom = new THREE.CylinderGeometry(2.5, 3, 30, 8);
    var pillar1 = new THREE.Mesh(pillarGeom, supportMat);
    pillar1.position.set(-25, 15, -5);
    pillar1.castShadow = true;
    pillar1.receiveShadow = true;
    overpassGroup.add(pillar1);

    return overpassGroup;
  }

  function createRustedVehicles() {
    var vehiclesGroup = new THREE.Group();

    var carMat = new THREE.MeshStandardMaterial({
      color: 0x552222,
      metalness: 0.6,
      roughness: 0.8,
      emissive: 0x0a0a0a
    });

    var carPositions = [
      { x: 30, z: 40 },
      { x: -40, z: 50 },
      { x: 50, z: -30 }
    ];

    carPositions.forEach(function(pos) {
      var bodyGeom = new THREE.BoxGeometry(8, 4, 16);
      var body = new THREE.Mesh(bodyGeom, carMat);
      body.position.set(pos.x, 2, pos.z);
      body.rotation.y = Math.random() * Math.PI;
      body.castShadow = true;
      body.receiveShadow = true;
      vehiclesGroup.add(body);

      var cabinGeom = new THREE.BoxGeometry(7, 3, 8);
      var cabin = new THREE.Mesh(cabinGeom, carMat);
      cabin.position.set(pos.x, 4, pos.z - 3);
      cabin.rotation.y = body.rotation.y;
      cabin.castShadow = true;
      vehiclesGroup.add(cabin);

      for (var i = 0; i < 4; i++) {
        var wheelGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16);
        var wheelMat = new THREE.MeshStandardMaterial({
          color: 0x111111,
          metalness: 0.7,
          roughness: 0.9
        });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(
          pos.x + (i < 2 ? -3.5 : 3.5),
          1.2,
          pos.z + (i % 2 === 0 ? -5 : 5)
        );
        vehiclesGroup.add(wheel);
      }
    });

    return vehiclesGroup;
  }

  function createOvergrowthVines() {
    var vineGroup = new THREE.Group();
    var vinePositions = [
      { x: -50, z: 30, height: 60 },
      { x: 40, z: -50, height: 50 },
      { x: -30, z: -40, height: 70 }
    ];

    vinePositions.forEach(function(pos) {
      var lineGeom = new THREE.BufferGeometry();
      var linePoints = [];
      for (var i = 0; i <= 20; i++) {
        var curve = Math.sin(i * 0.3) * 2;
        linePoints.push(new THREE.Vector3(curve, pos.height - (i * pos.height / 20), 0));
      }
      lineGeom.setFromPoints(linePoints);
      var lineMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
      var vine = new THREE.LineSegments(lineGeom, lineMat);
      vine.position.set(pos.x, 0, pos.z);
      vineGroup.add(vine);

      var leafMat = new THREE.MeshStandardMaterial({
        color: 0x2d5a2d,
        metalness: 0,
        roughness: 0.8,
        emissive: 0x0a0a0a
      });
      for (var j = 0; j < 15; j++) {
        var leafGeom = new THREE.BoxGeometry(1.5, 0.3, 2);
        var leaf = new THREE.Mesh(leafGeom, leafMat);
        leaf.position.set(
          pos.x + Math.sin(j * 0.4) * 3,
          pos.height - (j * 4),
          pos.z + (j % 2 === 0 ? -2 : 2)
        );
        leaf.rotation.z = Math.random() * 0.3;
        vineSway.push({ obj: leaf, originalPos: leaf.position.clone(), speed: 0.5 + Math.random() * 0.5 });
        vineGroup.add(leaf);
      }
    });

    return vineGroup;
  }

  function createSurvivorCamp() {
    var campGroup = new THREE.Group();

    var shelterMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      metalness: 0.1,
      roughness: 0.9
    });

    for (var i = 0; i < 3; i++) {
      var shelterGeom = new THREE.BoxGeometry(6, 4, 8);
      var shelter = new THREE.Mesh(shelterGeom, shelterMat);
      shelter.position.set(-35 + i * 10, 2, 65);
      shelter.castShadow = true;
      shelter.receiveShadow = true;
      campGroup.add(shelter);
    }

    var fireGeom = new THREE.SphereGeometry(1.5, 8, 8);
    var fireMat = new THREE.MeshStandardMaterial({
      color: 0xff6633,
      emissive: 0xff6633,
      metalness: 0,
      roughness: 0.5
    });
    var firePit = new THREE.Mesh(fireGeom, fireMat);
    firePit.position.set(-30, 1, 65);
    campGroup.add(firePit);

    for (var j = 0; j < 20; j++) {
      var fireParticleGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var fireParticleMat = new THREE.MeshStandardMaterial({
        color: 0xff8844,
        emissive: 0xff6633,
        metalness: 0,
        roughness: 0.8
      });
      var fireParticle = new THREE.Mesh(fireParticleGeom, fireParticleMat);
      fireParticle.position.set(-30 + Math.random() * 2 - 1, 1.5 + Math.random() * 3, 65 + Math.random() * 2 - 1);
      campGroup.add(fireParticle);
      fireParticles.push({
        obj: fireParticle,
        baseY: fireParticle.position.y,
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }

    return campGroup;
  }

  function createScavengerWatchtower() {
    var towerGroup = new THREE.Group();

    var debrisStackMat = createMaterial(0x554433);

    for (var level = 0; level < 4; level++) {
      var platformGeom = new THREE.BoxGeometry(12 - level * 1.5, 0.8, 12 - level * 1.5);
      var platform = new THREE.Mesh(platformGeom, debrisStackMat);
      platform.position.set(70, level * 3 + 1, 60);
      platform.castShadow = true;
      platform.receiveShadow = true;
      towerGroup.add(platform);
    }

    var railingGeom = new THREE.BoxGeometry(0.5, 2, 10);
    var railing = new THREE.Mesh(railingGeom, debrisStackMat);
    railing.position.set(65.5, 13, 60);
    towerGroup.add(railing);

    var lampGeom = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    var lampMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.4,
      roughness: 0.6
    });
    var lamp = new THREE.Mesh(lampGeom, lampMat);
    lamp.position.set(70, 16, 60);
    towerGroup.add(lamp);

    return towerGroup;
  }

  function createSandbagPositions() {
    var sandbagGroup = new THREE.Group();
    var sandbagMat = createMaterial(0x664d33);

    var positions = [
      { x: -60, z: 0 },
      { x: 60, z: 0 },
      { x: 0, z: -70 }
    ];

    positions.forEach(function(pos) {
      for (var i = 0; i < 8; i++) {
        var bagGeom = new THREE.BoxGeometry(1.5, 1, 3);
        var bag = new THREE.Mesh(bagGeom, sandbagMat);
        bag.position.set(pos.x + i * 2 - 7, 0.5, pos.z);
        bag.castShadow = true;
        bag.receiveShadow = true;
        sandbagGroup.add(bag);
      }
    });

    return sandbagGroup;
  }

  function createBurnedVehicles() {
    var burnedGroup = new THREE.Group();
    var charredMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.95,
      emissive: 0x0a0a0a
    });

    var huskPositions = [
      { x: 20, z: -60 },
      { x: -50, z: 45 }
    ];

    huskPositions.forEach(function(pos) {
      var huskGeom = new THREE.BoxGeometry(7, 3, 15);
      var husk = new THREE.Mesh(huskGeom, charredMat);
      husk.position.set(pos.x, 1.5, pos.z);
      husk.rotation.y = Math.random() * Math.PI;
      husk.castShadow = true;
      husk.receiveShadow = true;
      burnedGroup.add(husk);

      for (var i = 0; i < 3; i++) {
        var sootGeom = new THREE.BoxGeometry(8, 0.3, 15);
        var soot = new THREE.Mesh(sootGeom, charredMat);
        soot.position.set(pos.x, 2 + i * 0.5, pos.z);
        burnedGroup.add(soot);
      }
    });

    return burnedGroup;
  }

  function createExposedRebar() {
    var rebarGroup = new THREE.Group();
    var rebarMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });

    var rebarPositions = [
      { x: -50, z: 30, h: 60 },
      { x: 40, z: -50, h: 50 },
      { x: -30, z: -40, h: 70 }
    ];

    rebarPositions.forEach(function(pos) {
      for (var j = 0; j < 4; j++) {
        var rebarGeom = new THREE.BufferGeometry();
        var rebarPoints = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, pos.h, 0)
        ];
        rebarGeom.setFromPoints(rebarPoints);
        var rebar = new THREE.LineSegments(rebarGeom, rebarMat);
        rebar.position.set(pos.x - 8 + j * 5, 0, pos.z);
        rebarGroup.add(rebar);
      }
    });

    return rebarGroup;
  }

  function createWaterBarrels() {
    var barrelGroup = new THREE.Group();
    var barrelMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.7
    });

    var barrelPositions = [
      { x: -35, z: 70 },
      { x: -25, z: 75 },
      { x: -45, z: 75 }
    ];

    barrelPositions.forEach(function(pos) {
      var barrelGeom = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12);
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(pos.x, 1.25, pos.z);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      barrelGroup.add(barrel);

      var capGeom = new THREE.CylinderGeometry(1.3, 1.3, 0.2, 12);
      var cap = new THREE.Mesh(capGeom, barrelMat);
      cap.position.set(pos.x, 2.6, pos.z);
      barrelGroup.add(cap);
    });

    return barrelGroup;
  }

  function createSolarPanels() {
    var panelGroup = new THREE.Group();
    var panelMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.2,
      roughness: 0.6,
      emissive: 0x050a10
    });

    var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var poleMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.6,
      roughness: 0.5
    });

    for (var i = 0; i < 6; i++) {
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(45 + i * 3, 4, 75);
      pole.castShadow = true;
      panelGroup.add(pole);

      var panelGeom = new THREE.BoxGeometry(2.8, 0.2, 2);
      var panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(45 + i * 3, 8.5, 75);
      panel.rotation.x = 0.4;
      panel.castShadow = true;
      panelGroup.add(panel);
    }

    return panelGroup;
  }

  function createBombCrater() {
    var craterGroup = new THREE.Group();
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a3a,
      metalness: 0.2,
      roughness: 0.3,
      emissive: 0x0a1a1a
    });

    var craterGeom = new THREE.SphereGeometry(25, 16, 12);
    var crater = new THREE.Mesh(craterGeom, waterMat);
    crater.position.set(0, -15, 0);
    crater.scale.y = 0.4;
    crater.receiveShadow = true;
    craterGroup.add(crater);

    var waterGeom = new THREE.SphereGeometry(23, 16, 8);
    waterGeom.scale(1, 0.2, 1);
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(0, -2, 0);
    craterGroup.add(water);

    return craterGroup;
  }

  function createOverturnedBus() {
    var busGroup = new THREE.Group();
    var busMat = createMaterial(0x553333);

    var bodyGeom = new THREE.BoxGeometry(3, 3.5, 12);
    var body = new THREE.Mesh(bodyGeom, busMat);
    body.position.set(-20, 2.5, -70);
    body.rotation.z = 1.2;
    body.castShadow = true;
    body.receiveShadow = true;
    busGroup.add(body);

    for (var i = 0; i < 4; i++) {
      var windowGeom = new THREE.BoxGeometry(1.8, 1.5, 0.2);
      var windowMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        metalness: 0.8,
        roughness: 0.2
      });
      var window3d = new THREE.Mesh(windowGeom, windowMat);
      window3d.position.set(-20, 2 + i * 1, -70 + (i - 1.5) * 3);
      busGroup.add(window3d);
    }

    return busGroup;
  }

  function createPropagandaSign() {
    var signGroup = new THREE.Group();
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.5,
      roughness: 0.6
    });

    var poleGeom = new THREE.CylinderGeometry(0.4, 0.5, 12, 8);
    var pole = new THREE.Mesh(poleGeom, frameMat);
    pole.position.set(50, 6, -60);
    pole.castShadow = true;
    signGroup.add(pole);

    var signGeom = new THREE.BoxGeometry(15, 8, 0.5);
    var signMat = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      metalness: 0.2,
      roughness: 0.7,
      emissive: 0x0a0a0a
    });
    var sign = new THREE.Mesh(signGeom, signMat);
    sign.position.set(50, 10.5, -60);
    sign.castShadow = true;
    signGroup.add(sign);

    var textGeom = new THREE.BoxGeometry(14, 6, 0.2);
    var textMat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      metalness: 0,
      roughness: 0.9
    });
    var text = new THREE.Mesh(textGeom, textMat);
    text.position.set(50, 10.5, -59.5);
    signGroup.add(text);

    return signGroup;
  }

  function createFootbridge() {
    var bridgeGroup = new THREE.Group();
    var plankMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      metalness: 0.1,
      roughness: 0.8
    });

    for (var i = 0; i < 12; i++) {
      var plankGeom = new THREE.BoxGeometry(5, 0.3, 0.5);
      var plank = new THREE.Mesh(plankGeom, plankMat);
      plank.position.set(-10 + i * 1.5, 2, 50);
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }

    var cableGeom = new THREE.BufferGeometry();
    var cablePoints = [
      new THREE.Vector3(-10, 3.5, 50),
      new THREE.Vector3(9, 3.5, 50),
      new THREE.Vector3(9, 3.5, 50.5)
    ];
    cableGeom.setFromPoints(cablePoints);
    var cableMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var cable = new THREE.LineSegments(cableGeom, cableMat);
    bridgeGroup.add(cable);

    var supportGeom = new THREE.BoxGeometry(0.3, 2, 0.3);
    var support1 = new THREE.Mesh(supportGeom, plankMat);
    support1.position.set(-10, 1, 50);
    support1.castShadow = true;
    bridgeGroup.add(support1);

    var support2 = new THREE.Mesh(supportGeom, plankMat);
    support2.position.set(9, 1, 50);
    support2.castShadow = true;
    bridgeGroup.add(support2);

    return bridgeGroup;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    gameObjects = [];
    fireParticles = [];
    debrisParticles = [];
    vineSway = [];
    explosionFlashes = [];
    ambientTime = 0;

    var street = createCrackedAsphaltStreet();
    scene.add(street);
    gameObjects.push(street);

    var ruins = createRuinShells();
    scene.add(ruins);
    gameObjects.push(ruins);

    var rubble = createRubblePiles();
    scene.add(rubble);
    gameObjects.push(rubble);

    var overpass = createCollapsedOverpass();
    scene.add(overpass);
    gameObjects.push(overpass);

    var vehicles = createRustedVehicles();
    scene.add(vehicles);
    gameObjects.push(vehicles);

    var vines = createOvergrowthVines();
    scene.add(vines);
    gameObjects.push(vines);

    var camp = createSurvivorCamp();
    scene.add(camp);
    gameObjects.push(camp);

    var tower = createScavengerWatchtower();
    scene.add(tower);
    gameObjects.push(tower);

    var sandbags = createSandbagPositions();
    scene.add(sandbags);
    gameObjects.push(sandbags);

    var burned = createBurnedVehicles();
    scene.add(burned);
    gameObjects.push(burned);

    var rebar = createExposedRebar();
    scene.add(rebar);
    gameObjects.push(rebar);

    var barrels = createWaterBarrels();
    scene.add(barrels);
    gameObjects.push(barrels);

    var panels = createSolarPanels();
    scene.add(panels);
    gameObjects.push(panels);

    var crater = createBombCrater();
    scene.add(crater);
    gameObjects.push(crater);

    var bus = createOverturnedBus();
    scene.add(bus);
    gameObjects.push(bus);

    var sign = createPropagandaSign();
    scene.add(sign);
    gameObjects.push(sign);

    var footbridge = createFootbridge();
    scene.add(footbridge);
    gameObjects.push(footbridge);

    for (var i = 0; i < 30; i++) {
      var debrisGeom = new THREE.BoxGeometry(0.5, 0.3, 0.5);
      var debrisMat = new THREE.MeshStandardMaterial({
        color: 0x665544,
        metalness: 0.1,
        roughness: 0.9
      });
      var debris = new THREE.Mesh(debrisGeom, debrisMat);
      debris.position.set(
        (Math.random() - 0.5) * 160,
        20 + Math.random() * 30,
        (Math.random() - 0.5) * 160
      );
      debris.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        -0.2 - Math.random() * 0.3,
        (Math.random() - 0.5) * 0.3
      );
      scene.add(debris);
      debrisParticles.push(debris);
    }

    var explosionGeom = new THREE.SphereGeometry(5, 8, 8);
    var explosionMat = new THREE.MeshStandardMaterial({
      color: 0xff6633,
      emissive: 0xff4400,
      metalness: 0,
      roughness: 0.8
    });
    var explosionFlash = new THREE.Mesh(explosionGeom, explosionMat);
    explosionFlash.position.set(30, 30, -50);
    explosionFlash.visible = false;
    scene.add(explosionFlash);
    explosionFlashes.push({
      obj: explosionFlash,
      intensity: 0,
      phase: 0
    });
  }

  function update(delta) {
    ambientTime += delta;

    fireParticles.forEach(function(fireParticle) {
      var yOffset = Math.sin(ambientTime * fireParticle.speed + fireParticle.phase) * 1.5;
      fireParticle.obj.position.y = fireParticle.baseY + yOffset;
      fireParticle.obj.position.x += (Math.sin(ambientTime * fireParticle.speed * 0.7) * 0.02);
    });

    vineSway.forEach(function(vine) {
      var swayAmount = Math.sin(ambientTime * vine.speed) * 0.5;
      vine.obj.position.x = vine.originalPos.x + swayAmount;
    });

    debrisParticles.forEach(function(debris) {
      debris.position.add(debris.velocity);
      debris.velocity.y -= 0.05;
      debris.rotation.x += 0.01;
      debris.rotation.y += 0.02;

      if (debris.position.y < -10) {
        debris.position.set(
          (Math.random() - 0.5) * 160,
          40 + Math.random() * 20,
          (Math.random() - 0.5) * 160
        );
        debris.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          -0.2 - Math.random() * 0.3,
          (Math.random() - 0.5) * 0.3
        );
      }
    });

    explosionFlashes.forEach(function(explosion) {
      explosion.phase += delta;
      if (explosion.phase > 3) {
        explosion.phase = 0;
        explosion.obj.visible = false;
      } else if (explosion.phase < 0.3) {
        explosion.obj.visible = true;
        explosion.intensity = 1 - (explosion.phase / 0.3);
        explosion.obj.material.emissive.multiplyScalar(0.5 + explosion.intensity * 0.5);
      }
    });
  }

  function reset() {
    gameObjects.forEach(function(obj) {
      if (scene && obj.parent === scene) {
        scene.remove(obj);
      }
    });
    gameObjects = [];
    fireParticles = [];
    debrisParticles = [];
    vineSway = [];
    explosionFlashes = [];
    ambientTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
