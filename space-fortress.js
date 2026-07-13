window.SpaceFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var stationGroup = null;
  var mainRing = null;
  var solarPanels = null;
  var laserBatteries = null;
  var dockingBay = null;
  var dockedShips = null;
  var debrisField = null;
  var commandBridge = null;
  var shieldGenerator = null;
  var missileCluster = null;
  var maintenanceDrones = null;
  var lifeSupport = null;
  var escapePods = null;
  var allObjects = [];
  var animatingObjects = [];

  var colors = {
    silver: 0xc0c0c0,
    darkSilver: 0x808080,
    black: 0x1a1a1a,
    darkGray: 0x333333,
    blue: 0x0099ff,
    lightBlue: 0x66ccff,
    red: 0xff3333,
    brightRed: 0xff0000,
    green: 0x00cc00,
    yellow: 0xffff00,
    darkGreen: 0x004400
  };

  function addToScene(mesh) {
    scene.add(mesh);
    allObjects.push(mesh);
    return mesh;
  }

  function createMainRing() {
    mainRing = new THREE.Group();

    var geometry = new THREE.BoxGeometry(15, 3, 15);
    var material = new THREE.MeshStandardMaterial({ color: colors.silver, metalness: 0.8, roughness: 0.2 });

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 30;
      var z = Math.sin(angle) * 30;

      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, 0, z);
      mesh.rotation.z = angle;
      mainRing.add(mesh);
      allObjects.push(mesh);
    }

    var hubGeom = new THREE.BoxGeometry(8, 8, 8);
    var hubMat = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.9, roughness: 0.1 });
    var hub = new THREE.Mesh(hubGeom, hubMat);
    mainRing.add(hub);
    allObjects.push(hub);

    scene.add(mainRing);
    allObjects.push(mainRing);
    animatingObjects.push({ object: mainRing, type: 'rotate', axis: 'y', speed: 0.3 });

    return mainRing;
  }

  function createSolarPanels() {
    solarPanels = new THREE.Group();
    var panelMat = new THREE.MeshStandardMaterial({ color: colors.darkGray, metalness: 0.7, roughness: 0.3 });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;

      var armGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
      var armMesh = new THREE.Mesh(armGeom, panelMat);
      armMesh.position.set(Math.cos(angle) * 25, 0, Math.sin(angle) * 25);
      armMesh.rotation.z = angle + Math.PI / 2;
      solarPanels.add(armMesh);
      allObjects.push(armMesh);

      var panelGeom = new THREE.BoxGeometry(12, 0.3, 18);
      var panelMesh = new THREE.Mesh(panelGeom, panelMat);
      panelMesh.position.set(Math.cos(angle) * 25, 12, Math.sin(angle) * 25);
      solarPanels.add(panelMesh);
      allObjects.push(panelMesh);
      animatingObjects.push({ object: panelMesh, type: 'rotate', axis: 'x', speed: 0.2 });

      var panelMesh2 = new THREE.Mesh(panelGeom, panelMat);
      panelMesh2.position.set(Math.cos(angle) * 25, -12, Math.sin(angle) * 25);
      solarPanels.add(panelMesh2);
      allObjects.push(panelMesh2);
      animatingObjects.push({ object: panelMesh2, type: 'rotate', axis: 'x', speed: -0.2 });
    }

    scene.add(solarPanels);
    allObjects.push(solarPanels);
    return solarPanels;
  }

  function createLaserBatteries() {
    laserBatteries = new THREE.Group();

    for (var cluster = 0; cluster < 6; cluster++) {
      var clusterGroup = new THREE.Group();
      var angle = (cluster / 6) * Math.PI * 2;
      var clusterX = Math.cos(angle) * 35;
      var clusterZ = Math.sin(angle) * 35;
      clusterGroup.position.set(clusterX, 8, clusterZ);

      var turretGeom = new THREE.BoxGeometry(8, 4, 8);
      var turretMat = new THREE.MeshStandardMaterial({ color: colors.red, metalness: 0.8, roughness: 0.2 });
      var turret = new THREE.Mesh(turretGeom, turretMat);
      clusterGroup.add(turret);
      allObjects.push(turret);

      for (var gun = 0; gun < 4; gun++) {
        var gunAngle = (gun / 4) * Math.PI * 2;
        var gunX = Math.cos(gunAngle) * 4;
        var gunZ = Math.sin(gunAngle) * 4;

        var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 6);
        var barrelMat = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.9, roughness: 0.1 });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(gunX, 2, gunZ);
        barrel.rotation.z = Math.PI / 2;
        clusterGroup.add(barrel);
        allObjects.push(barrel);
      }

      laserBatteries.add(clusterGroup);
      allObjects.push(clusterGroup);
    }

    scene.add(laserBatteries);
    allObjects.push(laserBatteries);
    return laserBatteries;
  }

  function createDockingBay() {
    dockingBay = new THREE.Group();

    var bayGeom = new THREE.BoxGeometry(35, 20, 30);
    var bayMat = new THREE.MeshStandardMaterial({ color: colors.darkGray, metalness: 0.6, roughness: 0.4 });
    var bayMesh = new THREE.Mesh(bayGeom, bayMat);
    bayMesh.position.set(0, 0, 40);
    dockingBay.add(bayMesh);
    allObjects.push(bayMesh);

    var leftWallGeom = new THREE.BoxGeometry(1, 20, 30);
    var wallMat = new THREE.MeshStandardMaterial({ color: colors.silver, metalness: 0.8, roughness: 0.2 });
    var leftWall = new THREE.Mesh(leftWallGeom, wallMat);
    leftWall.position.set(-17.5, 0, 40);
    dockingBay.add(leftWall);
    allObjects.push(leftWall);

    var rightWall = new THREE.Mesh(leftWallGeom, wallMat);
    rightWall.position.set(17.5, 0, 40);
    dockingBay.add(rightWall);
    allObjects.push(rightWall);

    var topWallGeom = new THREE.BoxGeometry(35, 1, 30);
    var topWall = new THREE.Mesh(topWallGeom, wallMat);
    topWall.position.set(0, 9.5, 40);
    dockingBay.add(topWall);
    allObjects.push(topWall);

    var bottomWallGeom = new THREE.BoxGeometry(35, 1, 30);
    var bottomWall = new THREE.Mesh(bottomWallGeom, wallMat);
    bottomWall.position.set(0, -9.5, 40);
    dockingBay.add(bottomWall);
    allObjects.push(bottomWall);

    var backWallGeom = new THREE.BoxGeometry(35, 20, 1);
    var backWall = new THREE.Mesh(backWallGeom, wallMat);
    backWall.position.set(0, 0, 55);
    dockingBay.add(backWall);
    allObjects.push(backWall);

    dockedShips = new THREE.Group();
    for (var i = 0; i < 4; i++) {
      var yPos = -7 + (i * 5);
      var shipGroup = new THREE.Group();
      shipGroup.position.set(-10, yPos, 48);

      var hullGeom = new THREE.BoxGeometry(6, 2.5, 10);
      var hullMat = new THREE.MeshStandardMaterial({ color: colors.blue, metalness: 0.7, roughness: 0.3 });
      var hull = new THREE.Mesh(hullGeom, hullMat);
      shipGroup.add(hull);
      allObjects.push(hull);

      var noseGeom = new THREE.ConeGeometry(1, 3, 8);
      var noseMat = new THREE.MeshStandardMaterial({ color: colors.lightBlue, metalness: 0.8, roughness: 0.2 });
      var nose = new THREE.Mesh(noseGeom, noseMat);
      nose.position.set(0, 0, 6.5);
      shipGroup.add(nose);
      allObjects.push(nose);

      var wingGeom = new THREE.BoxGeometry(1.5, 0.3, 4);
      var wingMat = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.9, roughness: 0.1 });
      var leftWing = new THREE.Mesh(wingGeom, wingMat);
      leftWing.position.set(-3.5, 0, 0);
      shipGroup.add(leftWing);
      allObjects.push(leftWing);

      var rightWing = new THREE.Mesh(wingGeom, wingMat);
      rightWing.position.set(3.5, 0, 0);
      shipGroup.add(rightWing);
      allObjects.push(rightWing);

      dockedShips.add(shipGroup);
      allObjects.push(shipGroup);
    }

    for (var j = 0; j < 4; j++) {
      var yPos2 = -7 + (j * 5);
      var shipGroup2 = new THREE.Group();
      shipGroup2.position.set(10, yPos2, 48);

      var hullGeom2 = new THREE.BoxGeometry(6, 2.5, 10);
      var hullMat2 = new THREE.MeshStandardMaterial({ color: colors.blue, metalness: 0.7, roughness: 0.3 });
      var hull2 = new THREE.Mesh(hullGeom2, hullMat2);
      shipGroup2.add(hull2);
      allObjects.push(hull2);

      var noseGeom2 = new THREE.ConeGeometry(1, 3, 8);
      var noseMat2 = new THREE.MeshStandardMaterial({ color: colors.lightBlue, metalness: 0.8, roughness: 0.2 });
      var nose2 = new THREE.Mesh(noseGeom2, noseMat2);
      nose2.position.set(0, 0, 6.5);
      shipGroup2.add(nose2);
      allObjects.push(nose2);

      var wingGeom2 = new THREE.BoxGeometry(1.5, 0.3, 4);
      var wingMat2 = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.9, roughness: 0.1 });
      var leftWing2 = new THREE.Mesh(wingGeom2, wingMat2);
      leftWing2.position.set(-3.5, 0, 0);
      shipGroup2.add(leftWing2);
      allObjects.push(leftWing2);

      var rightWing2 = new THREE.Mesh(wingGeom2, wingMat2);
      rightWing2.position.set(3.5, 0, 0);
      shipGroup2.add(rightWing2);
      allObjects.push(rightWing2);

      dockedShips.add(shipGroup2);
      allObjects.push(shipGroup2);
    }

    dockingBay.add(dockedShips);
    allObjects.push(dockedShips);

    scene.add(dockingBay);
    allObjects.push(dockingBay);
    return dockingBay;
  }

  function createDebrisField() {
    debrisField = new THREE.Group();

    var positions = [
      { x: -50, y: 25, z: -35 },
      { x: 45, y: -20, z: 50 },
      { x: -35, y: 35, z: 45 },
      { x: 50, y: -15, z: -40 },
      { x: -45, y: 30, z: -50 },
      { x: 40, y: 20, z: 30 },
      { x: -40, y: -25, z: 35 },
      { x: 35, y: 40, z: -30 },
      { x: -50, y: -30, z: 20 },
      { x: 50, y: 15, z: -50 },
      { x: -30, y: 45, z: 50 },
      { x: 30, y: -40, z: -35 },
      { x: -55, y: 10, z: 40 },
      { x: 55, y: -10, z: 35 },
      { x: -35, y: -35, z: -45 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var size = 3 + Math.random() * 4;
      var asteroidGeom = new THREE.SphereGeometry(size, 8, 8);
      var asteroidMat = new THREE.MeshStandardMaterial({ color: colors.darkGray, metalness: 0.5, roughness: 0.7 });
      var asteroid = new THREE.Mesh(asteroidGeom, asteroidMat);
      asteroid.position.set(pos.x, pos.y, pos.z);
      asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      debrisField.add(asteroid);
      allObjects.push(asteroid);
      animatingObjects.push({ object: asteroid, type: 'tumble' });
    }

    for (var j = 0; j < 18; j++) {
      var randomX = -55 + Math.random() * 110;
      var randomY = -45 + Math.random() * 90;
      var randomZ = -55 + Math.random() * 110;
      var debrisGeom = new THREE.BoxGeometry(2 + Math.random() * 3, 1 + Math.random() * 2, 2 + Math.random() * 3);
      var debrisMat = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.6, roughness: 0.5 });
      var debris = new THREE.Mesh(debrisGeom, debrisMat);
      debris.position.set(randomX, randomY, randomZ);
      debris.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
      debrisField.add(debris);
      allObjects.push(debris);
      animatingObjects.push({ object: debris, type: 'tumble' });
    }

    scene.add(debrisField);
    allObjects.push(debrisField);
    return debrisField;
  }

  function createCommandBridge() {
    commandBridge = new THREE.Group();

    var bridgeBodyGeom = new THREE.BoxGeometry(12, 12, 12);
    var bridgeMat = new THREE.MeshStandardMaterial({ color: colors.darkGray, metalness: 0.7, roughness: 0.3 });
    var bridgeBody = new THREE.Mesh(bridgeBodyGeom, bridgeMat);
    bridgeBody.position.set(-45, 15, 0);
    commandBridge.add(bridgeBody);
    allObjects.push(bridgeBody);

    var domeGeom = new THREE.SphereGeometry(7, 16, 16);
    var domeMat = new THREE.MeshStandardMaterial({ color: colors.lightBlue, metalness: 0.3, roughness: 0.5, transparent: true, opacity: 0.4 });
    var dome = new THREE.Mesh(domeGeom, domeMat);
    dome.position.set(-45, 22, 0);
    commandBridge.add(dome);
    allObjects.push(dome);

    for (var i = 0; i < 24; i++) {
      var starGeom = new THREE.SphereGeometry(0.3, 4, 4);
      var starMat = new THREE.MeshStandardMaterial({ color: colors.yellow, emissive: colors.yellow, emissiveIntensity: 0.8 });
      var star = new THREE.Mesh(starGeom, starMat);
      var angle = (i / 24) * Math.PI * 2;
      var radius = 6;
      star.position.set(-45 + Math.cos(angle) * radius, 22 + (Math.random() - 0.5) * 8, Math.sin(angle) * radius);
      commandBridge.add(star);
      allObjects.push(star);
    }

    scene.add(commandBridge);
    allObjects.push(commandBridge);
    return commandBridge;
  }

  function createShieldGenerator() {
    shieldGenerator = new THREE.Group();

    var emitterGeom = new THREE.CylinderGeometry(3, 3, 8, 12);
    var emitterMat = new THREE.MeshStandardMaterial({ color: colors.lightBlue, metalness: 0.9, roughness: 0.1, emissive: colors.blue, emissiveIntensity: 0.5 });
    var emitter = new THREE.Mesh(emitterGeom, emitterMat);
    emitter.position.set(45, -15, 0);
    shieldGenerator.add(emitter);
    allObjects.push(emitter);

    var baseGeom = new THREE.BoxGeometry(6, 2, 6);
    var baseMat = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.8, roughness: 0.2 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(45, -19, 0);
    shieldGenerator.add(base);
    allObjects.push(base);

    var shieldGeom = new THREE.SphereGeometry(40, 32, 32);
    var shieldMat = new THREE.MeshStandardMaterial({ color: colors.blue, metalness: 0.2, roughness: 0.8, transparent: true, opacity: 0.15, emissive: colors.blue, emissiveIntensity: 0.3 });
    var shield = new THREE.Mesh(shieldGeom, shieldMat);
    shield.position.set(0, 0, 0);
    shieldGenerator.add(shield);
    allObjects.push(shield);
    animatingObjects.push({ object: shield, type: 'pulse', speed: 0.05 });

    scene.add(shieldGenerator);
    allObjects.push(shieldGenerator);
    return shieldGenerator;
  }

  function createMissileSilos() {
    missileCluster = new THREE.Group();

    var siloBaseGeom = new THREE.BoxGeometry(16, 3, 16);
    var siloBaseMat = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.7, roughness: 0.3 });
    var siloBase = new THREE.Mesh(siloBaseGeom, siloBaseMat);
    siloBase.position.set(0, -25, -40);
    missileCluster.add(siloBase);
    allObjects.push(siloBase);

    for (var i = 0; i < 9; i++) {
      var row = Math.floor(i / 3);
      var col = i % 3;
      var xOffset = (col - 1) * 5;
      var zOffset = (row - 1) * 5;

      var siloGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
      var siloMat = new THREE.MeshStandardMaterial({ color: colors.red, metalness: 0.8, roughness: 0.2 });
      var silo = new THREE.Mesh(siloGeom, siloMat);
      silo.position.set(xOffset, -15, -40 + zOffset);
      missileCluster.add(silo);
      allObjects.push(silo);

      var capGeom = new THREE.ConeGeometry(1.5, 1.5, 8);
      var capMat = new THREE.MeshStandardMaterial({ color: colors.brightRed, metalness: 0.9, roughness: 0.1 });
      var cap = new THREE.Mesh(capGeom, capMat);
      cap.position.set(xOffset, -4, -40 + zOffset);
      missileCluster.add(cap);
      allObjects.push(cap);
    }

    scene.add(missileCluster);
    allObjects.push(missileCluster);
    return missileCluster;
  }

  function createMaintenanceDrones() {
    maintenanceDrones = new THREE.Group();

    for (var i = 0; i < 6; i++) {
      var droneGroup = new THREE.Group();
      var angle = (i / 6) * Math.PI * 2;
      droneGroup.userData.angle = angle;
      droneGroup.userData.orbitRadius = 25;
      droneGroup.userData.height = (i % 3 - 1) * 8;

      var bodyGeom = new THREE.SphereGeometry(1.5, 8, 8);
      var bodyMat = new THREE.MeshStandardMaterial({ color: colors.green, metalness: 0.7, roughness: 0.3 });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      droneGroup.add(body);
      allObjects.push(body);

      for (var arm = 0; arm < 4; arm++) {
        var armAngle = (arm / 4) * Math.PI * 2;
        var armGeom = new THREE.BoxGeometry(0.8, 0.8, 3);
        var armMat = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.8, roughness: 0.2 });
        var armMesh = new THREE.Mesh(armGeom, armMat);
        armMesh.position.set(Math.cos(armAngle) * 2, Math.sin(armAngle) * 2, 0);
        droneGroup.add(armMesh);
        allObjects.push(armMesh);
      }

      maintenanceDrones.add(droneGroup);
      allObjects.push(droneGroup);
      animatingObjects.push({ object: droneGroup, type: 'orbit' });
    }

    scene.add(maintenanceDrones);
    allObjects.push(maintenanceDrones);
    return maintenanceDrones;
  }

  function createLifeSupportGreenhouse() {
    lifeSupport = new THREE.Group();

    var cylinderGeom = new THREE.CylinderGeometry(8, 8, 15, 12);
    var cylinderMat = new THREE.MeshStandardMaterial({ color: colors.darkGray, metalness: 0.7, roughness: 0.3 });
    var cylinder = new THREE.Mesh(cylinderGeom, cylinderMat);
    cylinder.position.set(-40, -15, -35);
    lifeSupport.add(cylinder);
    allObjects.push(cylinder);

    var domeTopGeom = new THREE.SphereGeometry(8, 16, 8);
    var domeMat = new THREE.MeshStandardMaterial({ color: colors.green, metalness: 0.4, roughness: 0.6, transparent: true, opacity: 0.3 });
    var domeTop = new THREE.Mesh(domeTopGeom, domeMat);
    domeTop.position.set(-40, 0, -35);
    lifeSupport.add(domeTop);
    allObjects.push(domeTop);

    var interiorGeom = new THREE.BoxGeometry(14, 13, 14);
    var interiorMat = new THREE.MeshStandardMaterial({ color: colors.darkGreen, metalness: 0.3, roughness: 0.7 });
    var interior = new THREE.Mesh(interiorGeom, interiorMat);
    interior.position.set(-40, -8, -35);
    lifeSupport.add(interior);
    allObjects.push(interior);

    for (var i = 0; i < 8; i++) {
      var supportGeom = new THREE.BoxGeometry(1, 12, 1);
      var supportMat = new THREE.MeshStandardMaterial({ color: colors.silver, metalness: 0.8, roughness: 0.2 });
      var support = new THREE.Mesh(supportGeom, supportMat);
      var angle = (i / 8) * Math.PI * 2;
      support.position.set(-40 + Math.cos(angle) * 6, -8, -35 + Math.sin(angle) * 6);
      lifeSupport.add(support);
      allObjects.push(support);
    }

    scene.add(lifeSupport);
    allObjects.push(lifeSupport);
    return lifeSupport;
  }

  function createEscapePods() {
    escapePods = new THREE.Group();

    var recessBaseGeom = new THREE.BoxGeometry(24, 3, 24);
    var recessMat = new THREE.MeshStandardMaterial({ color: colors.darkSilver, metalness: 0.7, roughness: 0.3 });
    var recessBase = new THREE.Mesh(recessBaseGeom, recessMat);
    recessBase.position.set(40, 25, -40);
    escapePods.add(recessBase);
    allObjects.push(recessBase);

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        var xOffset = (col - 1.5) * 5;
        var zOffset = (row - 1.5) * 5;

        var recessGeom = new THREE.BoxGeometry(4, 8, 4);
        var recessWallMat = new THREE.MeshStandardMaterial({ color: colors.darkGray, metalness: 0.6, roughness: 0.4 });
        var recessed = new THREE.Mesh(recessGeom, recessWallMat);
        recessed.position.set(40 + xOffset, 18, -40 + zOffset);
        escapePods.add(recessed);
        allObjects.push(recessed);

        var podGeom = new THREE.CylinderGeometry(1.8, 1.8, 6, 8);
        var podMat = new THREE.MeshStandardMaterial({ color: colors.yellow, metalness: 0.8, roughness: 0.2, emissive: colors.yellow, emissiveIntensity: 0.4 });
        var pod = new THREE.Mesh(podGeom, podMat);
        pod.position.set(40 + xOffset, 21, -40 + zOffset);
        escapePods.add(pod);
        allObjects.push(pod);

        var hatchGeom = new THREE.SphereGeometry(1.8, 8, 8);
        var hatchMat = new THREE.MeshStandardMaterial({ color: colors.red, metalness: 0.9, roughness: 0.1 });
        var hatch = new THREE.Mesh(hatchGeom, hatchMat);
        hatch.position.set(40 + xOffset, 27, -40 + zOffset);
        escapePods.add(hatch);
        allObjects.push(hatch);
      }
    }

    scene.add(escapePods);
    allObjects.push(escapePods);
    return escapePods;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    allObjects = [];
    animatingObjects = [];

    stationGroup = new THREE.Group();
    scene.add(stationGroup);
    allObjects.push(stationGroup);

    createMainRing();
    createSolarPanels();
    createLaserBatteries();
    createDockingBay();
    createDebrisField();
    createCommandBridge();
    createShieldGenerator();
    createMissileSilos();
    createMaintenanceDrones();
    createLifeSupportGreenhouse();
    createEscapePods();

    return {
      totalGeometries: allObjects.length
    };
  }

  function update(delta) {
    for (var i = 0; i < animatingObjects.length; i++) {
      var anim = animatingObjects[i];
      var obj = anim.object;

      if (anim.type === 'rotate') {
        if (anim.axis === 'y') {
          obj.rotation.y += anim.speed * delta;
        } else if (anim.axis === 'x') {
          obj.rotation.x += anim.speed * delta;
        } else if (anim.axis === 'z') {
          obj.rotation.z += anim.speed * delta;
        }
      } else if (anim.type === 'tumble') {
        obj.rotation.x += (0.3 + Math.random() * 0.2) * delta;
        obj.rotation.y += (0.4 + Math.random() * 0.2) * delta;
        obj.rotation.z += (0.2 + Math.random() * 0.3) * delta;
      } else if (anim.type === 'pulse') {
        var scale = 1 + Math.sin(Date.now() * 0.001) * 0.05;
        obj.scale.set(scale, scale, scale);
      } else if (anim.type === 'orbit') {
        obj.userData.angle += 0.5 * delta;
        var radius = obj.userData.orbitRadius;
        obj.position.x = Math.cos(obj.userData.angle) * radius;
        obj.position.z = Math.sin(obj.userData.angle) * radius;
        obj.position.y = obj.userData.height;
      }
    }
  }

  function reset() {
    for (var i = allObjects.length - 1; i >= 0; i--) {
      var obj = allObjects[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }

    allObjects = [];
    animatingObjects = [];
    stationGroup = null;
    mainRing = null;
    solarPanels = null;
    laserBatteries = null;
    dockingBay = null;
    dockedShips = null;
    debrisField = null;
    commandBridge = null;
    shieldGenerator = null;
    missileCluster = null;
    maintenanceDrones = null;
    lifeSupport = null;
    escapePods = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
