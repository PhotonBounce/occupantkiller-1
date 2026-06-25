window.CargoDock = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var dockGroup = null;
  var craneAngle = 0;
  var craneSpeed = 0.5;
  var beaconTime = 0;
  var beaconLights = [];
  var shipRockTime = 0;
  var shipGroup = null;
  var craneBooms = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    dockGroup = new THREE.Group();
    scene.add(dockGroup);

    createWharfAndPier();
    createShippingContainers();
    createShipAtBerth();
    createDockCrane();
    createWarehouseShed();
    createForklift();
    createPalletStacks();
    createBollards();
    createChainFence();
    createCustomsCheckpoint();
    createRailTrack();
    createLoadingBumpers();
    createCraneHookAssembly();
    createNetCargoSling();
    createBeaconLights();
    createFuelBowser();
    createWelfareFacility();
    createContainerInspectionLights();
    createRustPatches();
  }

  function createWharfAndPier() {
    var wharfGeometry = new THREE.BoxGeometry(80, 0.3, 30);
    var wharfMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var wharf = new THREE.Mesh(wharfGeometry, wharfMaterial);
    wharf.position.set(0, -0.15, 0);
    dockGroup.add(wharf);

    var pierExtensionGeometry = new THREE.BoxGeometry(40, 0.25, 8);
    var pierMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var pierExtension = new THREE.Mesh(pierExtensionGeometry, pierMaterial);
    pierExtension.position.set(-50, -0.125, -15);
    dockGroup.add(pierExtension);

    var waterLevelGeometry = new THREE.BoxGeometry(150, 0.1, 80);
    var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
    var waterLevel = new THREE.Mesh(waterLevelGeometry, waterMaterial);
    waterLevel.position.set(0, -2, -20);
    dockGroup.add(waterLevel);
  }

  function createShippingContainers() {
    var containerColors = [0xff6b35, 0x004e89, 0x1b998b, 0xf7931e, 0xc41e3a, 0x00a676];
    var containerWidth = 2.2;
    var containerHeight = 2.2;
    var containerDepth = 4.4;
    var startX = -30;
    var startZ = 8;

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 5; col++) {
        for (var layer = 0; layer < 3; layer++) {
          var containerGeometry = new THREE.BoxGeometry(containerWidth, containerHeight, containerDepth);
          var colorIndex = (row + col + layer) % containerColors.length;
          var containerMaterial = new THREE.MeshLambertMaterial({ color: containerColors[colorIndex] });
          var container = new THREE.Mesh(containerGeometry, containerMaterial);

          var posX = startX + col * (containerWidth + 0.1);
          var posY = 1.1 + layer * (containerHeight + 0.05);
          var posZ = startZ + row * (containerDepth + 0.2);

          container.position.set(posX, posY, posZ);
          container.castShadow = true;
          container.receiveShadow = true;
          dockGroup.add(container);

          var markingsGeometry = new THREE.BoxGeometry(containerWidth - 0.1, 0.05, containerDepth - 0.1);
          var markingsMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
          var markings = new THREE.Mesh(markingsGeometry, markingsMaterial);
          markings.position.set(posX, posY + containerHeight * 0.4, posZ);
          dockGroup.add(markings);
        }
      }
    }
  }

  function createShipAtBerth() {
    shipGroup = new THREE.Group();
    dockGroup.add(shipGroup);
    shipGroup.position.set(50, 0, -35);

    var hullGeometry = new THREE.BoxGeometry(35, 8, 12);
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(0, 2, 0);
    shipGroup.add(hull);

    var superstructureGeometry = new THREE.BoxGeometry(8, 6, 8);
    var superMaterial = new THREE.MeshLambertMaterial({ color: 0x2a4a62 });
    var superstructure = new THREE.Mesh(superstructureGeometry, superMaterial);
    superstructure.position.set(12, 8, 0);
    shipGroup.add(superstructure);

    var smokeStackGeometry = new THREE.CylinderGeometry(0.8, 1, 4, 12);
    var smokeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var smokeStack = new THREE.Mesh(smokeStackGeometry, smokeMaterial);
    smokeStack.position.set(13, 12, 0);
    shipGroup.add(smokeStack);

    for (var i = 0; i < 6; i++) {
      var portholeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var portholeGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var porthole = new THREE.Mesh(portholeGeom, portholeMat);
      porthole.position.set(8 + i * 3, 5, -7);
      shipGroup.add(porthole);
    }
  }

  function createDockCrane() {
    var craneGroup = new THREE.Group();
    craneGroup.position.set(-20, 0, 0);
    dockGroup.add(craneGroup);

    var towerGeometry = new THREE.BoxGeometry(2, 20, 2);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, 10, 0);
    craneGroup.add(tower);

    var crossBeamGeometry = new THREE.BoxGeometry(8, 0.5, 3);
    var beamMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var crossBeam = new THREE.Mesh(crossBeamGeometry, beamMaterial);
    crossBeam.position.set(0, 20, 0);
    craneGroup.add(crossBeam);

    var pivotGeometry = new THREE.CylinderGeometry(1, 1, 1, 16);
    var pivotMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
    pivot.position.set(0, 20, 0);
    craneGroup.add(pivot);

    var boomGroup = new THREE.Group();
    boomGroup.position.set(0, 20, 0);
    craneGroup.add(boomGroup);
    craneBooms.push(boomGroup);

    var boomGeometry = new THREE.BoxGeometry(25, 1, 1);
    var boomMaterial = new THREE.MeshLambertMaterial({ color: 0xff9800 });
    var boom = new THREE.Mesh(boomGeometry, boomMaterial);
    boom.position.set(12.5, 0, 0);
    boomGroup.add(boom);

    var boomSupportGeometry = new THREE.BoxGeometry(0.6, 2, 0.6);
    for (var i = 0; i < 4; i++) {
      var support = new THREE.Mesh(boomSupportGeometry, boomMaterial);
      support.position.set(2 + i * 6, -1.2, 0);
      boomGroup.add(support);
    }

    var trolleyGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.8);
    var trolleyMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    var trolley = new THREE.Mesh(trolleyGeometry, trolleyMaterial);
    trolley.position.set(15, -1, 0);
    boomGroup.add(trolley);

    var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12);
    var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    for (var w = 0; w < 4; w++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(15 + (w % 2) * 0.6 - 0.3, -2, (w < 2 ? 1 : -1) * 0.5);
      boomGroup.add(wheel);
    }
  }

  function createWarehouseShed() {
    var shedGeometry = new THREE.BoxGeometry(25, 8, 18);
    var shedMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var shed = new THREE.Mesh(shedGeometry, shedMaterial);
    shed.position.set(30, 4, 15);
    dockGroup.add(shed);

    var roofGeometry = new THREE.BoxGeometry(26, 0.8, 19);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(30, 8.4, 15);
    dockGroup.add(roof);

    var doorGeometry = new THREE.BoxGeometry(3, 6, 0.2);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    for (var d = 0; d < 3; d++) {
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(15 + d * 8, 3, 24.1);
      dockGroup.add(door);
    }

    var supportGeometry = new THREE.BoxGeometry(1, 10, 1);
    var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    for (var s = 0; s < 6; s++) {
      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(17 + s * 4, 5, 6 + (s % 2) * 10);
      dockGroup.add(support);
    }
  }

  function createForklift() {
    var forkGroup = new THREE.Group();
    forkGroup.position.set(-10, 0.5, -8);
    dockGroup.add(forkGroup);

    var bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 2);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.75, 0);
    forkGroup.add(body);

    var cabinGeometry = new THREE.BoxGeometry(1, 1, 0.8);
    var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0xffdd33 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.5, -0.3);
    forkGroup.add(cabin);

    var wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
    var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wheelPositions = [[-0.5, 0.35, -0.5], [0.5, 0.35, -0.5], [-0.5, 0.35, 0.5], [0.5, 0.35, 0.5]];
    for (var w = 0; w < wheelPositions.length; w++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelPositions[w][0], wheelPositions[w][1], wheelPositions[w][2]);
      forkGroup.add(wheel);
    }

    var liftMastGeometry = new THREE.BoxGeometry(0.2, 3, 0.3);
    var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var liftMast = new THREE.Mesh(liftMastGeometry, mastMaterial);
    liftMast.position.set(0, 1.5, 0.4);
    forkGroup.add(liftMast);

    var forkGeometry = new THREE.BoxGeometry(0.1, 0.8, 1.5);
    var forkMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var fork1 = new THREE.Mesh(forkGeometry, forkMaterial);
    fork1.position.set(-0.3, 0.4, 0.8);
    forkGroup.add(fork1);
    var fork2 = new THREE.Mesh(forkGeometry, forkMaterial);
    fork2.position.set(0.3, 0.4, 0.8);
    forkGroup.add(fork2);
  }

  function createPalletStacks() {
    var palletGeometry = new THREE.BoxGeometry(1.2, 0.15, 1.2);
    var palletMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    var crateGeometry = new THREE.BoxGeometry(1, 1, 1);
    var crateMaterial = new THREE.MeshLambertMaterial({ color: 0xa0522d });

    for (var stack = 0; stack < 4; stack++) {
      var baseX = 15 - stack * 6;
      var baseZ = -20 + (stack % 2) * 4;

      for (var layer = 0; layer < 3; layer++) {
        var pallet = new THREE.Mesh(palletGeometry, palletMaterial);
        pallet.position.set(baseX, 0.075 + layer * 1.2, baseZ);
        dockGroup.add(pallet);

        var crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(baseX, 0.6 + layer * 1.2, baseZ);
        dockGroup.add(crate);
      }
    }
  }

  function createBollards() {
    var bollardGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.2, 12);
    var bollardMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });

    for (var b = 0; b < 8; b++) {
      var bollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
      var x = -35 + b * 10;
      var z = 15 + (b % 2) * 2;
      bollard.position.set(x, 0.6, z);
      dockGroup.add(bollard);
    }
  }

  function createChainFence() {
    var postGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    for (var p = 0; p < 10; p++) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(-40 + p * 8, 1, 25);
      dockGroup.add(post);
    }

    var chainGeom = new THREE.BufferGeometry();
    var chainPositions = [];
    for (var c = 0; c < 9; c++) {
      var x1 = -36 + c * 8;
      var x2 = -32 + c * 8;
      for (var h = 0; h < 5; h++) {
        var y = 0.5 + h * 0.3;
        chainPositions.push(x1, y, 25);
        chainPositions.push(x2, y, 25);
      }
    }
    chainGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(chainPositions), 3));
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var chainFence = new THREE.LineSegments(chainGeom, chainMaterial);
    dockGroup.add(chainFence);
  }

  function createCustomsCheckpoint() {
    var boothGeometry = new THREE.BoxGeometry(6, 3, 4);
    var boothMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(-15, 1.5, 20);
    dockGroup.add(booth);

    var roofGeometry = new THREE.BoxGeometry(6.5, 0.3, 4.5);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-15, 3.15, 20);
    dockGroup.add(roof);

    var windowGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
    for (var w = 0; w < 2; w++) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-18 + w * 6, 1.8, 2.05);
      dockGroup.add(window);
    }
  }

  function createRailTrack() {
    var railGeometry = new THREE.BoxGeometry(70, 0.2, 1.5);
    var railMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(0, 0.1, -2);
    dockGroup.add(rail);

    var tieGeometry = new THREE.BoxGeometry(1, 0.15, 2);
    var tieMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    for (var t = 0; t < 15; t++) {
      var tie = new THREE.Mesh(tieGeometry, tieMaterial);
      tie.position.set(-30 + t * 5, 0.075, -2);
      dockGroup.add(tie);
    }
  }

  function createLoadingBumpers() {
    var bumperGeometry = new THREE.BoxGeometry(2, 0.5, 0.4);
    var bumperMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    for (var b = 0; b < 4; b++) {
      var bumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
      bumper.position.set(25, 0.25, 8 + b * 3);
      dockGroup.add(bumper);
    }
  }

  function createCraneHookAssembly() {
    var hookGroup = new THREE.Group();
    hookGroup.position.set(-20, 18, 0);
    dockGroup.add(hookGroup);

    var hookGeometry = new THREE.SphereGeometry(0.4, 12, 12);
    var hookMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    var hook = new THREE.Mesh(hookGeometry, hookMaterial);
    hook.position.set(0, 0, 0);
    hookGroup.add(hook);

    var chainGeom = new THREE.BufferGeometry();
    var chainVerts = [];
    for (var i = 0; i < 8; i++) {
      chainVerts.push(0, i * 0.5, 0);
    }
    chainGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(chainVerts), 3));
    var chainMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var hookChain = new THREE.LineSegments(chainGeom, chainMat);
    hookGroup.add(hookChain);
  }

  function createNetCargoSling() {
    var netGeom = new THREE.BufferGeometry();
    var netVerts = [];
    var netSize = 4;
    var segments = 6;

    for (var y = 0; y < segments; y++) {
      for (var x = 0; x < segments; x++) {
        netVerts.push(
          (x - segments / 2) * (netSize / segments),
          -2 - y * 0.5,
          (y - segments / 2) * (netSize / segments)
        );
      }
    }

    netGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(netVerts), 3));
    var netMat = new THREE.LineBasicMaterial({ color: 0xaaaa44 });
    var netMesh = new THREE.LineSegments(netGeom, netMat);
    netMesh.position.set(10, 3, 10);
    dockGroup.add(netMesh);
  }

  function createBeaconLights() {
    var beaconGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var beaconPositions = [
      [-35, 2, 25],
      [35, 2, 25],
      [50, 3, -40],
      [-30, 2, -25]
    ];

    for (var b = 0; b < beaconPositions.length; b++) {
      var beaconMaterial = new THREE.MeshLambertMaterial({
        color: 0xffff00,
        emissive: 0xffff00
      });
      var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beacon.position.set(beaconPositions[b][0], beaconPositions[b][1], beaconPositions[b][2]);
      dockGroup.add(beacon);
      beaconLights.push({
        mesh: beacon,
        material: beaconMaterial,
        isOn: false
      });
    }
  }

  function createFuelBowser() {
    var tankGeometry = new THREE.BoxGeometry(3, 2, 3);
    var tankMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(45, 1, -15);
    dockGroup.add(tank);

    var pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
    var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(47.5, 1.5, -15);
    dockGroup.add(pipe);

    var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (var w = 0; w < 4; w++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(44 + (w % 2) * 2, 0.4, -15 + (w < 2 ? -1 : 1));
      dockGroup.add(wheel);
    }
  }

  function createWelfareFacility() {
    var hutGeometry = new THREE.BoxGeometry(6, 3, 5);
    var hutMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var hut = new THREE.Mesh(hutGeometry, hutMaterial);
    hut.position.set(0, 1.5, -35);
    dockGroup.add(hut);

    var windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
    for (var w = 0; w < 3; w++) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-2 + w * 2, 2, 2.55);
      dockGroup.add(window);
    }

    var doorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1, 2.55);
    dockGroup.add(door);
  }

  function createContainerInspectionLights() {
    var lightGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.3);
    var lightMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0xffffff
    });

    var lightPositions = [
      [-25, 4, 10],
      [-15, 4, 15],
      [-5, 4, 20],
      [5, 4, 15],
      [15, 4, 10]
    ];

    for (var l = 0; l < lightPositions.length; l++) {
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(lightPositions[l][0], lightPositions[l][1], lightPositions[l][2]);
      dockGroup.add(light);
    }
  }

  function createRustPatches() {
    var patchGeometry = new THREE.BoxGeometry(1.5, 0.05, 1.5);
    var rustMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    var rustPositions = [
      [-20, 3, 8],
      [10, 3.5, 12],
      [25, 3.2, 18],
      [-30, 2.8, -5],
      [35, 3, 5]
    ];

    for (var r = 0; r < rustPositions.length; r++) {
      var patch = new THREE.Mesh(patchGeometry, rustMaterial);
      patch.position.set(rustPositions[r][0], rustPositions[r][1], rustPositions[r][2]);
      dockGroup.add(patch);
    }
  }

  function update(delta) {
    craneAngle += craneSpeed * delta;

    for (var c = 0; c < craneBooms.length; c++) {
      craneBooms[c].rotation.y = craneAngle;
    }

    beaconTime += delta;
    for (var b = 0; b < beaconLights.length; b++) {
      var beacon = beaconLights[b];
      var flashCycle = Math.sin(beaconTime * 4) > 0;
      if (flashCycle !== beacon.isOn) {
        beacon.isOn = flashCycle;
        beacon.material.emissive.setHex(beacon.isOn ? 0xffff00 : 0x333333);
      }
    }

    shipRockTime += delta;
    if (shipGroup) {
      shipGroup.position.y = Math.sin(shipRockTime * 0.5) * 0.3;
      shipGroup.rotation.z = Math.sin(shipRockTime * 0.3) * 0.05;
    }
  }

  function reset() {
    craneAngle = 0;
    beaconTime = 0;
    shipRockTime = 0;
    beaconLights.forEach(function(beacon) {
      beacon.material.emissive.setHex(0x333333);
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
