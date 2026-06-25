window.FrozenTemple = (function() {
  'use strict';

  var scene, camera;
  var iceWalls = [];
  var frozenWarriors = [];
  var icePillars = [];
  var cryoTraps = [];
  var iceStalactites = [];
  var altarOrb;
  var frozenThrone;
  var meltCracks = [];
  var iceLights = [];
  var crystalFormations = [];
  var steamParticles = [];
  var time = 0;
  var orb;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildTempleStructure();
    createIceEncasement();
    placeFrozenWarriors();
    createIcePillars();
    setupCryoTraps();
    hangIceStalactites();
    buildAltarChamber();
    placeThrone();
    createMeltCracks();
    addIceLights();
    growCrystalFormations();
  };

  var buildTempleStructure = function() {
    var stoneColor = 0x4a4a4a;
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: stoneColor, metalness: 0.3, roughness: 0.8 });

    var floorGeom = new THREE.BoxGeometry(60, 2, 60);
    var floor = new THREE.Mesh(floorGeom, stoneMaterial);
    floor.position.y = -1;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);

    var wallNorth = new THREE.BoxGeometry(60, 20, 2);
    var wallN = new THREE.Mesh(wallNorth, stoneMaterial);
    wallN.position.z = -30;
    wallN.position.y = 10;
    wallN.castShadow = true;
    wallN.receiveShadow = true;
    scene.add(wallN);
    iceWalls.push(wallN);

    var wallSouth = new THREE.BoxGeometry(60, 20, 2);
    var wallS = new THREE.Mesh(wallSouth, stoneMaterial);
    wallS.position.z = 30;
    wallS.position.y = 10;
    wallS.castShadow = true;
    wallS.receiveShadow = true;
    scene.add(wallS);
    iceWalls.push(wallS);

    var wallEast = new THREE.BoxGeometry(2, 20, 60);
    var wallE = new THREE.Mesh(wallEast, stoneMaterial);
    wallE.position.x = 30;
    wallE.position.y = 10;
    wallE.castShadow = true;
    wallE.receiveShadow = true;
    scene.add(wallE);
    iceWalls.push(wallE);

    var wallWest = new THREE.BoxGeometry(2, 20, 60);
    var wallW = new THREE.Mesh(wallWest, stoneMaterial);
    wallW.position.x = -30;
    wallW.position.y = 10;
    wallW.castShadow = true;
    wallW.receiveShadow = true;
    scene.add(wallW);
    iceWalls.push(wallW);
  };

  var createIceEncasement = function() {
    var iceMaterial = new THREE.MeshStandardMaterial({
      color: 0x4da6d6,
      transparent: true,
      opacity: 0.4,
      metalness: 0.6,
      roughness: 0.2
    });

    var floorIce = new THREE.BoxGeometry(62, 1, 62);
    var floorIceM = new THREE.Mesh(floorIce, iceMaterial);
    floorIceM.position.y = -0.5;
    scene.add(floorIceM);

    var wallNIce = new THREE.BoxGeometry(62, 22, 1.5);
    var wallNIceM = new THREE.Mesh(wallNIce, iceMaterial);
    wallNIceM.position.z = -31;
    wallNIceM.position.y = 10;
    scene.add(wallNIceM);

    var wallSIce = new THREE.BoxGeometry(62, 22, 1.5);
    var wallSIceM = new THREE.Mesh(wallSIce, iceMaterial);
    wallSIceM.position.z = 31;
    wallSIceM.position.y = 10;
    scene.add(wallSIceM);

    var wallEIce = new THREE.BoxGeometry(1.5, 22, 62);
    var wallEIceM = new THREE.Mesh(wallEIce, iceMaterial);
    wallEIceM.position.x = 31;
    wallEIceM.position.y = 10;
    scene.add(wallEIceM);

    var wallWIce = new THREE.BoxGeometry(1.5, 22, 62);
    var wallWIceM = new THREE.Mesh(wallWIce, iceMaterial);
    wallWIceM.position.x = -31;
    wallWIceM.position.y = 10;
    scene.add(wallWIceM);

    var ceilingIce = new THREE.BoxGeometry(62, 1, 62);
    var ceilingIceM = new THREE.Mesh(ceilingIce, iceMaterial);
    ceilingIceM.position.y = 21;
    scene.add(ceilingIceM);
  };

  var placeFrozenWarriors = function() {
    var frostMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.7,
      metalness: 0.4,
      roughness: 0.3
    });

    var positions = [
      { x: -15, z: 0, rotation: 0.3 },
      { x: 15, z: -10, rotation: -0.2 },
      { x: 0, z: 15, rotation: 0.1 },
      { x: -20, z: -20, rotation: -0.4 }
    ];

    var i = 0;
    for (i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
      var body = new THREE.Mesh(bodyGeom, frostMaterial);
      body.position.set(pos.x, 2, pos.z);
      body.rotation.z = pos.rotation;
      scene.add(body);
      frozenWarriors.push(body);

      var headGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      var head = new THREE.Mesh(headGeom, frostMaterial);
      head.position.set(pos.x, 4.5, pos.z);
      head.rotation.z = pos.rotation;
      scene.add(head);
      frozenWarriors.push(head);

      var armGeom = new THREE.BoxGeometry(0.8, 2.5, 0.6);
      var armL = new THREE.Mesh(armGeom, frostMaterial);
      armL.position.set(pos.x - 1.5, 2.5, pos.z);
      armL.rotation.z = Math.PI / 4 + pos.rotation;
      scene.add(armL);
      frozenWarriors.push(armL);

      var armR = new THREE.Mesh(armGeom, frostMaterial);
      armR.position.set(pos.x + 1.5, 2.5, pos.z);
      armR.rotation.z = -Math.PI / 4 + pos.rotation;
      scene.add(armR);
      frozenWarriors.push(armR);
    }
  };

  var createIcePillars = function() {
    var icePillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x5dade2,
      metalness: 0.5,
      roughness: 0.4
    });

    var pillarPositions = [
      { x: -15, z: -15 },
      { x: 15, z: -15 },
      { x: -15, z: 15 },
      { x: 15, z: 15 },
      { x: 0, z: 0 }
    ];

    var j = 0;
    for (j = 0; j < pillarPositions.length; j++) {
      var ppos = pillarPositions[j];
      var pillarGeom = new THREE.CylinderGeometry(2, 2.5, 18, 6);
      var pillar = new THREE.Mesh(pillarGeom, icePillarMaterial);
      pillar.position.set(ppos.x, 9, ppos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      icePillars.push(pillar);
    }
  };

  var setupCryoTraps = function() {
    var vesselMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e5d7a,
      metalness: 0.7,
      roughness: 0.3
    });

    var trapPositions = [
      { x: -20, z: 10 },
      { x: 20, z: 10 },
      { x: -10, z: -20 },
      { x: 10, z: -20 }
    ];

    var k = 0;
    for (k = 0; k < trapPositions.length; k++) {
      var tpos = trapPositions[k];

      var vesselGeom = new THREE.CylinderGeometry(1.2, 1, 3, 8);
      var vessel = new THREE.Mesh(vesselGeom, vesselMaterial);
      vessel.position.set(tpos.x, 1.5, tpos.z);
      vessel.castShadow = true;
      scene.add(vessel);
      cryoTraps.push({ mesh: vessel, active: false, time: 0 });

      var wireGeom = new THREE.BufferGeometry();
      var wirePoints = [
        new THREE.Vector3(tpos.x, 3.5, tpos.z),
        new THREE.Vector3(tpos.x, 4.5, tpos.z - 2),
        new THREE.Vector3(tpos.x, 3.5, tpos.z - 4)
      ];
      wireGeom.setFromPoints(wirePoints);
      var wireMaterial = new THREE.LineBasicMaterial({ color: 0x00d4ff, linewidth: 2 });
      var wireLine = new THREE.LineSegments(wireGeom, wireMaterial);
      scene.add(wireLine);
      cryoTraps[k].wire = wireLine;
    }
  };

  var hangIceStalactites = function() {
    var stalactiteMaterial = new THREE.MeshStandardMaterial({
      color: 0x6db3e8,
      metalness: 0.4,
      roughness: 0.5
    });

    var stalactitePositions = [
      { x: -20, z: -15 },
      { x: 0, z: -20 },
      { x: 20, z: -15 },
      { x: -15, z: 5 },
      { x: 15, z: 5 }
    ];

    var m = 0;
    for (m = 0; m < stalactitePositions.length; m++) {
      var spos = stalactitePositions[m];
      var stalactiteGeom = new THREE.ConeGeometry(1, 4, 6);
      var stalactite = new THREE.Mesh(stalactiteGeom, stalactiteMaterial);
      stalactite.position.set(spos.x, 19, spos.z);
      stalactite.rotation.z = Math.random() * 0.3;
      stalactite.castShadow = true;
      scene.add(stalactite);
      iceStalactites.push(stalactite);
    }
  };

  var buildAltarChamber = function() {
    var altarMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      metalness: 0.2,
      roughness: 0.9
    });

    var altarGeom = new THREE.BoxGeometry(8, 2, 8);
    var altar = new THREE.Mesh(altarGeom, altarMaterial);
    altar.position.set(0, 1, 0);
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);

    var orbGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var orbMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00aa44,
      metalness: 0.6,
      roughness: 0.2
    });
    orb = new THREE.Mesh(orbGeom, orbMaterial);
    orb.position.set(0, 4, 0);
    orb.castShadow = true;
    scene.add(orb);
    altarOrb = orb;
  };

  var placeThrone = function() {
    var throneMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d2d,
      metalness: 0.3,
      roughness: 0.7
    });

    var throneSeatGeom = new THREE.BoxGeometry(6, 2, 5);
    var throneSeat = new THREE.Mesh(throneSeatGeom, throneMaterial);
    throneSeat.position.set(0, 1, -18);
    throneSeat.castShadow = true;
    scene.add(throneSeat);
    frozenThrone = throneSeat;

    var backGeom = new THREE.BoxGeometry(6, 6, 1);
    var back = new THREE.Mesh(backGeom, throneMaterial);
    back.position.set(0, 5, -19);
    back.castShadow = true;
    scene.add(back);

    var rulerGeom = new THREE.BoxGeometry(1.5, 3, 1.2);
    var rulerMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.6,
      metalness: 0.3,
      roughness: 0.4
    });
    var ruler = new THREE.Mesh(rulerGeom, rulerMaterial);
    ruler.position.set(0, 3.5, -18);
    ruler.castShadow = true;
    scene.add(ruler);
  };

  var createMeltCracks = function() {
    var crackMaterial = new THREE.LineBasicMaterial({ color: 0x2b8fc5, linewidth: 1.5 });

    var crackPositions = [
      [
        new THREE.Vector3(-25, 8, -28),
        new THREE.Vector3(-20, 10, -26),
        new THREE.Vector3(-15, 9, -25)
      ],
      [
        new THREE.Vector3(20, 7, 28),
        new THREE.Vector3(25, 9, 26),
        new THREE.Vector3(28, 8, 20)
      ],
      [
        new THREE.Vector3(-28, 9, 10),
        new THREE.Vector3(-26, 11, 15),
        new THREE.Vector3(-24, 10, 20)
      ]
    ];

    var n = 0;
    for (n = 0; n < crackPositions.length; n++) {
      var crackGeom = new THREE.BufferGeometry();
      crackGeom.setFromPoints(crackPositions[n]);
      var crackLine = new THREE.LineSegments(crackGeom, crackMaterial);
      scene.add(crackLine);
      meltCracks.push(crackLine);
    }
  };

  var addIceLights = function() {
    var lightPositions = [
      { x: -15, y: 8, z: -15 },
      { x: 15, y: 8, z: -15 },
      { x: -15, y: 8, z: 15 },
      { x: 15, y: 8, z: 15 }
    ];

    var p = 0;
    for (p = 0; p < lightPositions.length; p++) {
      var lpos = lightPositions[p];

      var lightGeom = new THREE.SphereGeometry(0.8, 8, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0x4da6d6,
        emissive: 0x2b8fc5,
        metalness: 0.8,
        roughness: 0.1
      });
      var lightMesh = new THREE.Mesh(lightGeom, lightMaterial);
      lightMesh.position.set(lpos.x, lpos.y, lpos.z);
      scene.add(lightMesh);
      iceLights.push(lightMesh);

      var pointLight = new THREE.PointLight(0x4da6d6, 1.5, 30);
      pointLight.position.set(lpos.x, lpos.y, lpos.z);
      pointLight.castShadow = true;
      scene.add(pointLight);
    }
  };

  var growCrystalFormations = function() {
    var crystalMaterial = new THREE.MeshStandardMaterial({
      color: 0x6db3e8,
      metalness: 0.5,
      roughness: 0.3
    });

    var crystalSpots = [
      { x: -22, z: -22 },
      { x: 22, z: -22 },
      { x: -22, z: 22 },
      { x: 22, z: 22 },
      { x: -10, z: -10 },
      { x: 10, z: -10 }
    ];

    var q = 0;
    for (q = 0; q < crystalSpots.length; q++) {
      var cspot = crystalSpots[q];
      var clusterSize = 3 + Math.floor(Math.random() * 3);
      var c = 0;
      for (c = 0; c < clusterSize; c++) {
        var crystalGeom = new THREE.ConeGeometry(0.4, 2, 4);
        var crystal = new THREE.Mesh(crystalGeom, crystalMaterial);
        crystal.position.set(
          cspot.x + (Math.random() - 0.5) * 3,
          0.5 + Math.random() * 1.5,
          cspot.z + (Math.random() - 0.5) * 3
        );
        crystal.rotation.z = Math.random() * Math.PI * 2;
        crystal.castShadow = true;
        scene.add(crystal);
        crystalFormations.push(crystal);
      }
    }
  };

  var update = function(delta) {
    time += delta;

    if (altarOrb) {
      altarOrb.rotation.x += 0.015;
      altarOrb.rotation.y += 0.025;
      var orbScale = 1 + Math.sin(time * 2) * 0.08;
      altarOrb.scale.set(orbScale, orbScale, orbScale);
    }

    var r = 0;
    for (r = 0; r < cryoTraps.length; r++) {
      var trap = cryoTraps[r];
      trap.time += delta;
      if (trap.time > 2) {
        trap.time = 0;
        trap.active = !trap.active;
      }
      if (trap.active) {
        trap.mesh.position.y = 1.5 + Math.sin(time * 4) * 0.1;
      }
    }

    var s = 0;
    for (s = 0; s < crystalFormations.length; s++) {
      var crystal = crystalFormations[s];
      crystal.rotation.y += 0.01;
      crystal.position.y += Math.sin(time * 1.5 + s) * 0.001;
    }

    var t = 0;
    for (t = 0; t < iceLights.length; t++) {
      var light = iceLights[t];
      var pulseScale = 0.9 + Math.sin(time * 1.5 + t) * 0.15;
      light.scale.set(pulseScale, pulseScale, pulseScale);
    }

    var u = 0;
    for (u = 0; u < iceStalactites.length; u++) {
      var stalactite = iceStalactites[u];
      stalactite.position.y = 19 + Math.sin(time * 0.5 + u * 0.5) * 0.2;
    }
  };

  var reset = function() {
    time = 0;
    var v = 0;
    for (v = 0; v < cryoTraps.length; v++) {
      cryoTraps[v].active = false;
      cryoTraps[v].time = 0;
    }
    if (altarOrb) {
      altarOrb.scale.set(1, 1, 1);
      altarOrb.rotation.set(0, 0, 0);
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
