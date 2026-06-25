window.SkyStation = (function() {
  'use strict';

  var objects = [];
  var animatedObjects = [];
  var scene = null;

  var Colors = {
    stone: 0x4a4a4a,
    darkStone: 0x2a2a2a,
    white: 0xffffff,
    cloud: 0xe8e8e8,
    silver: 0xd0d0d0,
    militaryGreen: 0x3d5a3d,
    darkGreen: 0x2a3d2a,
    concrete: 0x5a5a5a,
    black: 0x000000
  };

  function createMaterial(color, emissive) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.3,
      roughness: 0.7
    });
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addAnimatedObject(mesh, animationData) {
    scene.add(mesh);
    objects.push(mesh);
    animatedObjects.push({ mesh: mesh, animation: animationData });
    return mesh;
  }

  function createFloatingPlatform(x, y, z, width, depth, height) {
    var platformGroup = new THREE.Group();
    platformGroup.position.set(x, y, z);

    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = createMaterial(Colors.darkStone);
    var platform = new THREE.Mesh(geometry, material);
    platformGroup.add(platform);

    var edgeHeight = height * 0.3;
    var edgeGeometry = new THREE.BoxGeometry(width + 2, edgeHeight, depth + 2);
    var edgeMaterial = createMaterial(Colors.stone);
    var edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.position.y = height / 2 + edgeHeight / 2;
    platformGroup.add(edge);

    platformGroup.bobOffset = Math.random() * Math.PI * 2;
    platformGroup.bobAmount = 0.3;
    platformGroup.bobSpeed = 0.5;

    return addAnimatedObject(platformGroup, { type: 'bob' });
  }

  function createSkyBridge(x1, y1, z1, x2, y2, z2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dz = z2 - z1;
    var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    var bridgeGroup = new THREE.Group();
    var midX = (x1 + x2) / 2;
    var midY = (y1 + y2) / 2;
    var midZ = (z1 + z2) / 2;
    bridgeGroup.position.set(midX, midY, midZ);

    var angle = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
    var rotationZ = Math.atan2(dz, dx);

    var geometry = new THREE.BoxGeometry(length * 0.9, 0.8, 4);
    var material = createMaterial(Colors.concrete);
    var bridge = new THREE.Mesh(geometry, material);
    bridge.rotation.z = rotationZ;
    bridge.rotation.x = angle;
    bridgeGroup.add(bridge);

    var railGeometry = new THREE.BoxGeometry(length * 0.9, 1.5, 0.3);
    var railMaterial = createMaterial(Colors.militaryGreen);
    var rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.y = 0.8;
    rail.rotation.z = rotationZ;
    rail.rotation.x = angle;
    bridgeGroup.add(rail);

    return addToScene(bridgeGroup);
  }

  function createCommandTower(x, y, z, height) {
    var towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    var baseGeometry = new THREE.BoxGeometry(8, height, 8);
    var baseMaterial = createMaterial(Colors.concrete);
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = height / 2;
    towerGroup.add(base);

    var windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
    var windowMaterial = createMaterial(Colors.black);
    for (var i = 0; i < 5; i++) {
      var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(-3, 2 + i * 3, 4.2);
      towerGroup.add(window1);

      var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
      window2.position.set(3, 2 + i * 3, 4.2);
      towerGroup.add(window2);
    }

    var roofGeometry = new THREE.BoxGeometry(8, 1, 8);
    var roofMaterial = createMaterial(Colors.militaryGreen);
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height + 0.5;
    towerGroup.add(roof);

    for (var a = 0; a < 3; a++) {
      var antennaGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
      var antennaMaterial = createMaterial(Colors.silver);
      var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      var angle = (a / 3) * Math.PI * 2;
      antenna.position.set(Math.cos(angle) * 2, height + 3, Math.sin(angle) * 2);
      towerGroup.add(antenna);

      var diskGeometry = new THREE.ConeGeometry(1.2, 0.3, 8);
      var diskMaterial = createMaterial(Colors.silver);
      var disk = new THREE.Mesh(diskGeometry, diskMaterial);
      disk.position.set(Math.cos(angle) * 2, height + 6.5, Math.sin(angle) * 2);
      towerGroup.add(disk);
    }

    return addToScene(towerGroup);
  }

  function createWindTurbine(x, y, z) {
    var turbineGroup = new THREE.Group();
    turbineGroup.position.set(x, y, z);

    var pillarGeometry = new THREE.CylinderGeometry(0.8, 1.2, 10, 16);
    var pillarMaterial = createMaterial(Colors.concrete);
    var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = 5;
    turbineGroup.add(pillar);

    var hubGeometry = new THREE.SphereGeometry(1, 16, 16);
    var hubMaterial = createMaterial(Colors.silver);
    var hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.y = 10.5;
    turbineGroup.add(hub);

    var bladeGroup = new THREE.Group();
    bladeGroup.position.y = 10.5;
    turbineGroup.add(bladeGroup);

    for (var b = 0; b < 4; b++) {
      var bladeGeometry = new THREE.BoxGeometry(0.8, 6, 0.2);
      var bladeMaterial = createMaterial(Colors.white);
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.y = 3;
      var angle = (b / 4) * Math.PI * 2;
      blade.rotation.z = angle;
      bladeGroup.add(blade);
    }

    turbineGroup.bladeGroup = bladeGroup;
    turbineGroup.rotationSpeed = 0.02;

    return addAnimatedObject(turbineGroup, { type: 'rotateBlade' });
  }

  function createAntiAirGun(x, y, z) {
    var gunGroup = new THREE.Group();
    gunGroup.position.set(x, y, z);

    var baseGeometry = new THREE.BoxGeometry(3, 1.5, 3);
    var baseMaterial = createMaterial(Colors.darkGreen);
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    gunGroup.add(base);

    var pedestal = new THREE.CylinderGeometry(1, 1.5, 2, 16);
    var pedestalMaterial = createMaterial(Colors.concrete);
    var petal = new THREE.Mesh(pedestal, pedestalMaterial);
    petal.position.y = 1.75;
    gunGroup.add(petal);

    for (var g = 0; g < 2; g++) {
      var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.45, 5, 12);
      var barrelMaterial = createMaterial(Colors.darkStone);
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set((g === 0 ? -0.8 : 0.8), 3.8, 0);
      barrel.rotation.z = 0.3;
      gunGroup.add(barrel);
    }

    return addToScene(gunGroup);
  }

  function createObservationDome(x, y, z) {
    var domeGroup = new THREE.Group();
    domeGroup.position.set(x, y, z);

    var domeGeometry = new THREE.SphereGeometry(3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    var domeMaterial = createMaterial(Colors.white);
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 3;
    domeGroup.add(dome);

    var baseGeometry = new THREE.BoxGeometry(6.2, 0.5, 6.2);
    var baseMaterial = createMaterial(Colors.concrete);
    var baseRing = new THREE.Mesh(baseGeometry, baseMaterial);
    domeGroup.add(baseRing);

    var innerGeometry = new THREE.BoxGeometry(5, 2.5, 5);
    var innerMaterial = createMaterial(Colors.militaryGreen);
    var inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.position.y = 1.5;
    domeGroup.add(inner);

    for (var d = 0; d < 4; d++) {
      var windowGeometry = new THREE.BoxGeometry(1, 1, 0.2);
      var windowMaterial = createMaterial(Colors.black);
      var win = new THREE.Mesh(windowGeometry, windowMaterial);
      var angle = (d / 4) * Math.PI * 2;
      win.position.set(Math.cos(angle) * 2.8, 1.5, Math.sin(angle) * 2.8);
      domeGroup.add(win);
    }

    return addToScene(domeGroup);
  }

  function createCargoLift(x, y, z) {
    var liftGroup = new THREE.Group();
    liftGroup.position.set(x, y, z);

    var platformGeometry = new THREE.BoxGeometry(4, 0.8, 4);
    var platformMaterial = createMaterial(Colors.militaryGreen);
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    liftGroup.add(platform);

    var cableGeometry = new THREE.CylinderGeometry(0.08, 0.08, 8, 8);
    var cableMaterial = createMaterial(Colors.silver);
    for (var l = 0; l < 4; l++) {
      var cable = new THREE.Mesh(cableGeometry, cableMaterial);
      var cx = l % 2 === 0 ? -1.5 : 1.5;
      var cz = Math.floor(l / 2) % 2 === 0 ? -1.5 : 1.5;
      cable.position.set(cx, 4.5, cz);
      liftGroup.add(cable);
    }

    var topGeometry = new THREE.BoxGeometry(4.5, 0.5, 4.5);
    var topMaterial = createMaterial(Colors.concrete);
    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 8.5;
    liftGroup.add(top);

    liftGroup.platformPosition = 0;
    liftGroup.platformDirection = 1;

    return addAnimatedObject(liftGroup, { type: 'lift' });
  }

  function createCloudCluster(x, y, z) {
    var cloudGroup = new THREE.Group();
    cloudGroup.position.set(x, y, z);
    cloudGroup.driftOffset = Math.random() * Math.PI * 2;

    for (var c = 0; c < 5; c++) {
      var cloudGeometry = new THREE.SphereGeometry(Math.random() * 2 + 1.5, 8, 6);
      var cloudMaterial = createMaterial(Colors.cloud);
      var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 8
      );
      cloudGroup.add(cloud);
    }

    return addAnimatedObject(cloudGroup, { type: 'drift' });
  }

  function createRadarDish(x, y, z) {
    var radarGroup = new THREE.Group();
    radarGroup.position.set(x, y, z);

    var mastGeometry = new THREE.CylinderGeometry(0.3, 0.4, 5, 8);
    var mastMaterial = createMaterial(Colors.concrete);
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.y = 2.5;
    radarGroup.add(mast);

    var dishGeometry = new THREE.ConeGeometry(2.5, 1.2, 16);
    var dishMaterial = createMaterial(Colors.silver);
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.y = 5.2;
    radarGroup.add(dish);

    var rimGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 16);
    var rimMaterial = createMaterial(Colors.darkStone);
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 4.6;
    radarGroup.add(rim);

    return addToScene(radarGroup);
  }

  function createGuardPost(x, y, z) {
    var postGroup = new THREE.Group();
    postGroup.position.set(x, y, z);

    var bunkerGeometry = new THREE.BoxGeometry(3, 2, 3);
    var bunkerMaterial = createMaterial(Colors.darkGreen);
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.y = 1;
    postGroup.add(bunker);

    var roofGeometry = new THREE.BoxGeometry(3.2, 0.8, 3.2);
    var roofMaterial = createMaterial(Colors.concrete);
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.5;
    postGroup.add(roof);

    for (var p = 0; p < 2; p++) {
      var loopGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 8);
      var loopMaterial = createMaterial(Colors.darkStone);
      var loop = new THREE.Mesh(loopGeometry, loopMaterial);
      loop.position.set((p === 0 ? -0.8 : 0.8), 1.2, 1.6);
      loop.rotation.z = Math.PI / 2;
      postGroup.add(loop);
    }

    return addToScene(postGroup);
  }

  function createRopeBridge(x1, y1, z1, x2, y2, z2) {
    var bridgeGroup = new THREE.Group();

    var dx = x2 - x1;
    var dy = y2 - y1;
    var dz = z2 - z1;
    var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var segments = Math.floor(distance / 1.5);

    var cablePoints = [];
    for (var r = 0; r <= segments; r++) {
      var t = r / segments;
      var px = x1 + dx * t;
      var py = y1 + dy * t + Math.sin(t * Math.PI) * 2;
      var pz = z1 + dz * t;
      cablePoints.push(new THREE.Vector3(px, py, pz));
    }

    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var lineMaterial = new THREE.LineBasicMaterial({ color: Colors.silver, linewidth: 2 });
    var cableLine = new THREE.LineSegments(cableGeometry, lineMaterial);
    scene.add(cableLine);
    objects.push(cableLine);

    for (var s = 0; s < segments; s++) {
      var plankGeometry = new THREE.BoxGeometry(distance / segments * 0.8, 0.3, 0.8);
      var plankMaterial = createMaterial(Colors.darkGreen);
      var plank = new THREE.Mesh(plankGeometry, plankMaterial);
      var midT = (s + 0.5) / segments;
      plank.position.set(
        x1 + dx * midT,
        y1 + dy * midT + Math.sin(midT * Math.PI) * 2,
        z1 + dz * midT
      );
      scene.add(plank);
      objects.push(plank);
    }

    return bridgeGroup;
  }

  function createMissileBattery(x, y, z) {
    var batteryGroup = new THREE.Group();
    batteryGroup.position.set(x, y, z);

    var rackGeometry = new THREE.BoxGeometry(12, 3, 3);
    var rackMaterial = createMaterial(Colors.concrete);
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.y = 1.5;
    batteryGroup.add(rack);

    for (var m = 0; m < 6; m++) {
      var tubeGeometry = new THREE.CylinderGeometry(0.4, 0.45, 3, 12);
      var tubeMaterial = createMaterial(Colors.darkStone);
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.set(-4.5 + m * 1.8, 3, 0);
      tube.rotation.z = 0.4;
      batteryGroup.add(tube);

      var baseGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var baseMaterial = createMaterial(Colors.militaryGreen);
      var tubeBase = new THREE.Mesh(baseGeometry, baseMaterial);
      tubeBase.position.set(-4.5 + m * 1.8, 1.8, 0);
      batteryGroup.add(tubeBase);
    }

    return addToScene(batteryGroup);
  }

  function createSupplyDrop(x, y, z) {
    var dropGroup = new THREE.Group();
    dropGroup.position.set(x, y, z);

    var crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var crateMaterial = createMaterial(Colors.militaryGreen);
    var crate = new THREE.Mesh(crateGeometry, crateMaterial);
    crate.position.y = 0.75;
    dropGroup.add(crate);

    var stripeGeometry = new THREE.BoxGeometry(1.6, 0.2, 1.6);
    var stripeMaterial = createMaterial(Colors.white);
    for (var st = 0; st < 3; st++) {
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.y = 0.4 + st * 0.5;
      dropGroup.add(stripe);
    }

    var parachutePoints = [
      new THREE.Vector3(-0.8, 2.5, -0.8),
      new THREE.Vector3(0.8, 2.5, -0.8),
      new THREE.Vector3(0.8, 2.5, 0.8),
      new THREE.Vector3(-0.8, 2.5, 0.8),
      new THREE.Vector3(-0.6, 1.5, 0),
      new THREE.Vector3(0.6, 1.5, 0),
      new THREE.Vector3(0, 1.5, -0.6),
      new THREE.Vector3(0, 1.5, 0.6)
    ];

    var ropeLines = [
      [0, 4], [1, 5], [2, 5], [3, 4], [0, 6], [1, 6], [2, 7], [3, 7]
    ];

    for (var rope = 0; rope < ropeLines.length; rope++) {
      var ropeGeometry = new THREE.BufferGeometry().setFromPoints([
        parachutePoints[ropeLines[rope][0]],
        parachutePoints[ropeLines[rope][1]]
      ]);
      var ropeMaterial = new THREE.LineBasicMaterial({ color: Colors.white, linewidth: 1 });
      var ropeLine = new THREE.LineSegments(ropeGeometry, ropeMaterial);
      dropGroup.add(ropeLine);
    }

    return addToScene(dropGroup);
  }

  function init(inputScene, camera) {
    scene = inputScene;
    objects = [];
    animatedObjects = [];

    var platform1 = createFloatingPlatform(0, 15, 0, 30, 30, 2);
    var platform2 = createFloatingPlatform(40, 10, 25, 25, 25, 2);
    var platform3 = createFloatingPlatform(-35, 12, 30, 22, 22, 2);
    var platform4 = createFloatingPlatform(35, 8, -30, 20, 20, 2);
    var platform5 = createFloatingPlatform(-30, 20, -25, 25, 25, 2);
    var platform6 = createFloatingPlatform(0, 6, -50, 18, 18, 2);

    createSkyBridge(-15, 15, 0, 0, 15, 0);
    createSkyBridge(0, 15, 0, 20, 12.5, 12.5);
    createSkyBridge(0, 15, 0, -17.5, 13, 15);
    createSkyBridge(0, 15, 0, 17.5, 12, -15);
    createSkyBridge(20, 12.5, 12.5, 40, 10, 25);
    createSkyBridge(-17.5, 13, 15, -35, 12, 30);

    createCommandTower(0, 17, 0, 18);

    createWindTurbine(15, 18, -8);
    createWindTurbine(-12, 18, 12);
    createWindTurbine(25, 13, 20);

    createAntiAirGun(8, 17, 8);
    createAntiAirGun(-8, 17, 8);
    createAntiAirGun(8, 17, -8);
    createAntiAirGun(-8, 17, -8);

    createAntiAirGun(30, 12, 20);
    createAntiAirGun(-25, 14, 25);
    createAntiAirGun(28, 10, -25);

    createObservationDome(12, 17, 12);
    createObservationDome(-12, 17, -12);
    createObservationDome(35, 12, 28);

    createCargoLift(-10, 15, -8);
    createCargoLift(10, 15, 8);
    createCargoLift(35, 10, 20);

    for (var cl = 0; cl < 8; cl++) {
      var cloudX = (Math.random() - 0.5) * 100;
      var cloudY = (Math.random() * 8) + 2;
      var cloudZ = (Math.random() - 0.5) * 100;
      createCloudCluster(cloudX, cloudY, cloudZ);
    }

    createRadarDish(20, 17, -15);
    createRadarDish(-20, 18, 15);
    createRadarDish(-25, 14, 30);

    createGuardPost(15, 15, -10);
    createGuardPost(-15, 15, 10);
    createGuardPost(-30, 12, 28);
    createGuardPost(32, 10, -28);
    createGuardPost(15, 10, 25);

    createRopeBridge(5, 15, -5, 15, 13, 5);
    createRopeBridge(-10, 15, 5, -20, 13, 15);
    createRopeBridge(30, 12, 20, 40, 10, 25);

    createMissileBattery(0, 17, -12);
    createMissileBattery(18, 12.5, 10);
    createMissileBattery(-20, 14, 20);

    for (var drop = 0; drop < 8; drop++) {
      var dropX = (Math.random() - 0.5) * 60;
      var dropY = (Math.random() * 6) + 10;
      var dropZ = (Math.random() - 0.5) * 60;
      createSupplyDrop(dropX, dropY, dropZ);
    }

    createGuardPost(10, 15, 15);
    createGuardPost(-10, 15, -15);

    createObservationDome(-20, 14, 20);
    createObservationDome(25, 13, -20);

    createRadarDish(15, 15, 20);
    createRadarDish(-30, 14, -20);

    createMissileBattery(15, 15, 15);
    createMissileBattery(-25, 13, -18);

    createAntiAirGun(12, 15, 20);
    createAntiAirGun(-18, 14, -22);

    createWindTurbine(-20, 14, 25);
    createWindTurbine(30, 11, -28);

    createCargoLift(-20, 12, 18);
    createCargoLift(25, 10, -20);

    createSupplyDrop(5, 8, -30);
    createSupplyDrop(-15, 9, 35);
    createSupplyDrop(25, 7, -15);

    for (var cl2 = 0; cl2 < 6; cl2++) {
      var cloudX2 = (Math.random() - 0.5) * 80;
      var cloudY2 = (Math.random() * 6) + 4;
      var cloudZ2 = (Math.random() - 0.5) * 80;
      createCloudCluster(cloudX2, cloudY2, cloudZ2);
    }
  }

  function update(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var item = animatedObjects[i];
      var mesh = item.mesh;
      var anim = item.animation;

      if (anim.type === 'rotateBlade' && mesh.bladeGroup) {
        mesh.bladeGroup.rotation.z += mesh.rotationSpeed;
      } else if (anim.type === 'bob') {
        var bobValue = Math.sin(Date.now() * 0.001 * mesh.bobSpeed + mesh.bobOffset) * mesh.bobAmount;
        var originalY = mesh.userData.originalY;
        if (originalY === undefined) {
          mesh.userData.originalY = mesh.position.y;
          originalY = mesh.position.y;
        }
        mesh.position.y = originalY + bobValue;
      } else if (anim.type === 'drift') {
        var driftValue = Math.sin(Date.now() * 0.0003 + mesh.driftOffset) * 3;
        mesh.position.x += driftValue * delta * 0.1;
      } else if (anim.type === 'lift') {
        mesh.platformPosition += mesh.platformDirection * delta * 0.5;
        if (mesh.platformPosition > 3) {
          mesh.platformDirection = -1;
        } else if (mesh.platformPosition < 0) {
          mesh.platformDirection = 1;
        }
        if (mesh.userData.originalY === undefined) {
          mesh.userData.originalY = mesh.position.y;
        }
        mesh.position.y = mesh.userData.originalY + mesh.platformPosition;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
