window.GravityWell = (function() {
  'use strict';

  var scene;
  var camera;
  var renderer;
  var environmentGroup;
  var debrisArray;
  var generatorArray;
  var time;

  var init = function(container, cameraObj) {
    camera = cameraObj;
    time = 0;
    debrisArray = [];
    generatorArray = [];

    environmentGroup = new THREE.Group();

    buildMainChamber();
    buildAntiGravityPlatforms();
    buildGravityFieldGenerators();
    buildEmergencyAnchors();
    buildDebrisField();
    buildSuspendedStructures();
    buildCoverElements();
    buildMilitaryEquipment();

    return environmentGroup;
  };

  var buildMainChamber = function() {
    var chamberMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      metalness: 0.4,
      roughness: 0.6
    });

    var floorGeo = new THREE.BoxGeometry(80, 2, 80);
    var floor = new THREE.Mesh(floorGeo, chamberMaterial);
    floor.position.y = -40;
    environmentGroup.add(floor);

    var ceilingGeo = new THREE.BoxGeometry(80, 2, 80);
    var ceiling = new THREE.Mesh(ceilingGeo, chamberMaterial);
    ceiling.position.y = 40;
    environmentGroup.add(ceiling);

    var wallNorthGeo = new THREE.BoxGeometry(80, 85, 2);
    var wallNorth = new THREE.Mesh(wallNorthGeo, chamberMaterial);
    wallNorth.position.z = -40;
    environmentGroup.add(wallNorth);

    var wallSouthGeo = new THREE.BoxGeometry(80, 85, 2);
    var wallSouth = new THREE.Mesh(wallSouthGeo, chamberMaterial);
    wallSouth.position.z = 40;
    environmentGroup.add(wallSouth);

    var wallEastGeo = new THREE.BoxGeometry(2, 85, 80);
    var wallEast = new THREE.Mesh(wallEastGeo, chamberMaterial);
    wallEast.position.x = 40;
    environmentGroup.add(wallEast);

    var wallWestGeo = new THREE.BoxGeometry(2, 85, 80);
    var wallWest = new THREE.Mesh(wallWestGeo, chamberMaterial);
    wallWest.position.x = -40;
    environmentGroup.add(wallWest);
  };

  var buildAntiGravityPlatforms = function() {
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x00aa44
    });

    var platformHeights = [-20, 0, 15, 25];
    var platformPositions = [
      [-25, 0, -20],
      [25, 0, 20],
      [0, 0, 0],
      [-15, 0, 25]
    ];

    for (var i = 0; i < platformPositions.length; i++) {
      var pos = platformPositions[i];
      var height = platformHeights[i];

      var platformGeo = new THREE.BoxGeometry(12, 1, 12);
      var platform = new THREE.Mesh(platformGeo, platformMaterial);
      platform.position.set(pos[0], height, pos[2]);
      environmentGroup.add(platform);

      var supportGeo = new THREE.CylinderGeometry(0.5, 0.8, 2, 8);
      var supportMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        metalness: 0.6
      });
      var support = new THREE.Mesh(supportGeo, supportMaterial);
      support.position.set(pos[0], height - 3, pos[2]);
      environmentGroup.add(support);
    }
  };

  var buildGravityFieldGenerators = function() {
    var generatorPositions = [
      [-30, -15, -25],
      [30, 10, 25],
      [0, -10, -35],
      [35, 20, 0]
    ];

    for (var i = 0; i < generatorPositions.length; i++) {
      var genObj = createGenerator(generatorPositions[i]);
      generatorArray.push(genObj);
    }
  };

  var createGenerator = function(position) {
    var generatorGroup = new THREE.Group();
    generatorGroup.position.set(position[0], position[1], position[2]);

    var coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xffaa00
    });

    var coreGeo = new THREE.SphereGeometry(3, 16, 16);
    var core = new THREE.Mesh(coreGeo, coreMaterial);
    generatorGroup.add(core);

    var tripodMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.5
    });

    for (var j = 0; j < 3; j++) {
      var angle = (j * Math.PI * 2) / 3;
      var legGeo = new THREE.CylinderGeometry(0.4, 0.6, 8, 8);
      var leg = new THREE.Mesh(legGeo, tripodMaterial);
      var legX = Math.cos(angle) * 4;
      var legZ = Math.sin(angle) * 4;
      leg.position.set(legX, -5, legZ);
      generatorGroup.add(leg);

      var footGeo = new THREE.BoxGeometry(2, 0.5, 2);
      var foot = new THREE.Mesh(footGeo, tripodMaterial);
      foot.position.set(legX, -9.5, legZ);
      generatorGroup.add(foot);
    }

    var obj = {
      group: generatorGroup,
      pulsePhase: i * 1.5
    };

    environmentGroup.add(generatorGroup);
    return obj;
  };

  var buildEmergencyAnchors = function() {
    var anchorMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xaa0000
    });

    var anchorPositions = [
      [-30, 20, 30],
      [28, -25, -28],
      [0, 30, 0],
      [-20, 5, -20]
    ];

    for (var i = 0; i < anchorPositions.length; i++) {
      var pos = anchorPositions[i];

      var baseGeo = new THREE.BoxGeometry(2, 1, 2);
      var base = new THREE.Mesh(baseGeo, anchorMaterial);
      base.position.set(pos[0], pos[1], pos[2]);
      environmentGroup.add(base);

      var ringGeo = new THREE.CylinderGeometry(2, 2, 0.3, 16);
      var ring = new THREE.Mesh(ringGeo, anchorMaterial);
      ring.position.set(pos[0], pos[1] + 2, pos[2]);
      environmentGroup.add(ring);

      var connectorGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
      var connector = new THREE.Mesh(connectorGeo, anchorMaterial);
      connector.position.set(pos[0], pos[1] + 4, pos[2]);
      environmentGroup.add(connector);
    }
  };

  var buildDebrisField = function() {
    var debrisPositions = [
      [-20, 5, 10],
      [15, -10, -15],
      [-10, 15, 25],
      [25, 8, -20],
      [0, -5, 0],
      [20, 20, 10],
      [-35, 0, -30],
      [35, -15, 20],
      [-15, 25, -10],
      [10, 3, 30]
    ];

    for (var i = 0; i < debrisPositions.length; i++) {
      var pos = debrisPositions[i];
      var debrisObj = createDebrisChunk(pos);
      debrisArray.push(debrisObj);
    }
  };

  var createDebrisChunk = function(position) {
    var debrisMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.3,
      roughness: 0.8
    });

    var debrisGroup = new THREE.Group();
    debrisGroup.position.set(position[0], position[1], position[2]);

    var mainGeo = new THREE.BoxGeometry(
      Math.random() * 3 + 1,
      Math.random() * 3 + 1,
      Math.random() * 3 + 1
    );
    var mainChunk = new THREE.Mesh(mainGeo, debrisMaterial);
    debrisGroup.add(mainChunk);

    var smallGeo = new THREE.BoxGeometry(1, 1, 1);
    var smallChunk = new THREE.Mesh(smallGeo, debrisMaterial);
    smallChunk.position.set(2, 1, 0);
    debrisGroup.add(smallChunk);

    var obj = {
      group: debrisGroup,
      rotationX: Math.random() * 0.05,
      rotationY: Math.random() * 0.05,
      rotationZ: Math.random() * 0.05,
      bobPhase: Math.random() * Math.PI * 2
    };

    environmentGroup.add(debrisGroup);
    return obj;
  };

  var buildSuspendedStructures = function() {
    var structMaterial = new THREE.MeshStandardMaterial({
      color: 0x4444ff,
      metalness: 0.6,
      roughness: 0.4
    });

    var invertedBoxGeo = new THREE.BoxGeometry(15, 3, 15);
    var invertedBox = new THREE.Mesh(invertedBoxGeo, structMaterial);
    invertedBox.position.set(-15, 25, 15);
    invertedBox.rotation.z = Math.PI;
    environmentGroup.add(invertedBox);

    var invertedBoxGeo2 = new THREE.BoxGeometry(12, 2, 12);
    var invertedBox2 = new THREE.Mesh(invertedBoxGeo2, structMaterial);
    invertedBox2.position.set(20, 28, -20);
    invertedBox2.rotation.z = Math.PI;
    environmentGroup.add(invertedBox2);

    var columnGeo = new THREE.CylinderGeometry(2, 2, 20, 12);
    var column = new THREE.Mesh(columnGeo, structMaterial);
    column.position.set(-25, 10, 0);
    environmentGroup.add(column);

    var columnGeo2 = new THREE.CylinderGeometry(1.5, 1.5, 15, 10);
    var column2 = new THREE.Mesh(columnGeo2, structMaterial);
    column2.position.set(25, 5, -25);
    environmentGroup.add(column2);
  };

  var buildCoverElements = function() {
    var coverMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.4,
      roughness: 0.7
    });

    var coverPositions = [
      [-30, -15, 20],
      [30, 8, -20],
      [0, 5, -30],
      [15, -10, 15],
      [-20, 15, 0]
    ];

    for (var i = 0; i < coverPositions.length; i++) {
      var pos = coverPositions[i];

      var crateGeo = new THREE.BoxGeometry(5, 5, 5);
      var crate = new THREE.Mesh(crateGeo, coverMaterial);
      crate.position.set(pos[0], pos[1], pos[2]);
      environmentGroup.add(crate);

      var supportGeo = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
      var support = new THREE.Mesh(supportGeo, coverMaterial);
      support.position.set(pos[0] + 2, pos[1] - 4, pos[2] + 2);
      environmentGroup.add(support);
    }
  };

  var buildMilitaryEquipment = function() {
    var equipMaterial = new THREE.MeshStandardMaterial({
      color: 0x996633,
      metalness: 0.5,
      roughness: 0.6
    });

    var scannerGeo = new THREE.ConeGeometry(3, 5, 12);
    var scanner = new THREE.Mesh(scannerGeo, equipMaterial);
    scanner.position.set(-30, 15, 35);
    environmentGroup.add(scanner);

    var radarGeo = new THREE.CylinderGeometry(4, 4, 1, 16);
    var radar = new THREE.Mesh(radarGeo, equipMaterial);
    radar.position.set(35, 25, 35);
    environmentGroup.add(radar);

    var radarPoleGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
    var radarPole = new THREE.Mesh(radarPoleGeo, equipMaterial);
    radarPole.position.set(35, 19, 35);
    environmentGroup.add(radarPole);

    var antennaGeo = new THREE.ConeGeometry(1, 8, 8);
    var antenna = new THREE.Mesh(antennaGeo, equipMaterial);
    antenna.position.set(0, 30, 30);
    environmentGroup.add(antenna);

    var arrayGeo = new THREE.BoxGeometry(8, 1, 8);
    var arrayMaterial = new THREE.MeshStandardMaterial({
      color: 0xccaa00,
      metalness: 0.7
    });
    var array = new THREE.Mesh(arrayGeo, arrayMaterial);
    array.position.set(-35, 20, -30);
    environmentGroup.add(array);
  };

  var update = function(deltaTime) {
    time += deltaTime;

    for (var i = 0; i < debrisArray.length; i++) {
      var debris = debrisArray[i];
      debris.group.rotation.x += debris.rotationX;
      debris.group.rotation.y += debris.rotationY;
      debris.group.rotation.z += debris.rotationZ;

      var bobAmount = Math.sin(time + debris.bobPhase) * 0.3;
      debris.group.position.y += bobAmount * deltaTime;
    }

    for (var j = 0; j < generatorArray.length; j++) {
      var generator = generatorArray[j];
      var pulseAmount = Math.sin(time * 1.5 + generator.pulsePhase) * 0.15;
      var coreMesh = generator.group.children[0];
      if (coreMesh) {
        coreMesh.scale.set(
          1 + pulseAmount,
          1 + pulseAmount,
          1 + pulseAmount
        );
      }
    }
  };

  var reset = function() {
    time = 0;
    for (var i = 0; i < debrisArray.length; i++) {
      debrisArray[i].group.rotation.set(0, 0, 0);
    }
    for (var j = 0; j < generatorArray.length; j++) {
      var coreMesh = generatorArray[j].group.children[0];
      if (coreMesh) {
        coreMesh.scale.set(1, 1, 1);
      }
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
