window.SwampLab = (function() {
  'use strict';

  var meshes = [];
  var animationRefs = {};
  var swampWaterMesh = null;
  var bubblingPits = [];
  var mutantCreatures = [];
  var specimens = [];
  var electricFenceSegments = [];

  var COLORS = {
    swampGreen: 0x2A4A1A,
    waterDark: 0x1A2A1A,
    cypressBrown: 0x6B4226,
    labWhite: 0xEEEEEE,
    mutantSickly: 0x44AA44,
    electricBlue: 0x4466FF,
    specimenPurple: 0xAA44FF,
    bogBrown: 0x3A2A0A
  };

  function createSwampWater(scene) {
    var waterGeometry = new THREE.BoxGeometry(400, 0.5, 400);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.waterDark,
      metalness: 0.3,
      roughness: 0.7
    });
    swampWaterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    swampWaterMesh.position.y = -5;
    swampWaterMesh.castShadow = true;
    swampWaterMesh.receiveShadow = true;
    scene.add(swampWaterMesh);
    meshes.push(swampWaterMesh);

    animationRefs.waterRipple = {
      time: 0,
      originalPositions: []
    };
  }

  function createLabStilts(scene) {
    var stiltPositions = [
      [-15, 0, -15],
      [15, 0, -15],
      [-15, 0, 15],
      [15, 0, 15],
      [-10, 0, 0],
      [10, 0, 0]
    ];

    stiltPositions.forEach(function(pos) {
      var stiltGeometry = new THREE.CylinderGeometry(1.2, 1.5, 18, 8);
      var stiltMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A3A2A,
        metalness: 0.2,
        roughness: 0.8
      });
      var stilt = new THREE.Mesh(stiltGeometry, stiltMaterial);
      stilt.position.set(pos[0], pos[1], pos[2]);
      stilt.castShadow = true;
      stilt.receiveShadow = true;
      scene.add(stilt);
      meshes.push(stilt);
    });
  }

  function createLabPlatform(scene) {
    var platformGeometry = new THREE.BoxGeometry(45, 1.5, 40);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      metalness: 0.1,
      roughness: 0.9
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 9, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    meshes.push(platform);
  }

  function createLabBuilding(scene) {
    var mainLabGeometry = new THREE.BoxGeometry(30, 18, 25);
    var labMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.labWhite,
      metalness: 0.05,
      roughness: 0.4
    });
    var mainLab = new THREE.Mesh(mainLabGeometry, labMaterial);
    mainLab.position.set(0, 18, 0);
    mainLab.castShadow = true;
    mainLab.receiveShadow = true;
    scene.add(mainLab);
    meshes.push(mainLab);

    var windowPositions = [
      [-10, 20, -13],
      [0, 20, -13],
      [10, 20, -13],
      [-10, 20, 13],
      [0, 20, 13],
      [10, 20, 13]
    ];

    windowPositions.forEach(function(pos) {
      var windowGeometry = new THREE.BoxGeometry(3, 3, 0.2);
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488FF,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x2244AA,
        emissiveIntensity: 0.3
      });
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(pos[0], pos[1], pos[2]);
      window.castShadow = true;
      window.receiveShadow = true;
      scene.add(window);
      meshes.push(window);
    });

    var roofGeometry = new THREE.BoxGeometry(32, 2, 27);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.3,
      roughness: 0.7
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 28, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
    meshes.push(roof);
  }

  function createBoardwalks(scene) {
    var boardwalkPaths = [
      { start: [-20, 9.5, -25], end: [-20, 9.5, 10], name: 'west' },
      { start: [20, 9.5, -25], end: [20, 9.5, 10], name: 'east' },
      { start: [-35, 9.5, 0], end: [-23, 9.5, 0], name: 'southwest' },
      { start: [23, 9.5, 0], end: [35, 9.5, 0], name: 'southeast' }
    ];

    boardwalkPaths.forEach(function(path) {
      var dx = path.end[0] - path.start[0];
      var dz = path.end[2] - path.start[2];
      var length = Math.sqrt(dx * dx + dz * dz);

      var boardGeometry = new THREE.BoxGeometry(2, 0.3, length);
      var boardMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B6B47,
        metalness: 0.1,
        roughness: 0.8
      });
      var board = new THREE.Mesh(boardGeometry, boardMaterial);

      var midX = (path.start[0] + path.end[0]) / 2;
      var midZ = (path.start[2] + path.end[2]) / 2;
      board.position.set(midX, path.start[1], midZ);

      var angle = Math.atan2(dz, dx);
      board.rotation.y = angle;

      board.castShadow = true;
      board.receiveShadow = true;
      scene.add(board);
      meshes.push(board);
    });
  }

  function createCypressTrees(scene) {
    var treePositions = [
      [-45, 0, -45],
      [-50, 0, 10],
      [50, 0, -40],
      [45, 0, 40],
      [-40, 0, 50],
      [55, 0, 15]
    ];

    treePositions.forEach(function(pos) {
      var trunkGeometry = new THREE.CylinderGeometry(1.5, 2.2, 25, 8);
      var trunkMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.cypressBrown,
        metalness: 0.1,
        roughness: 0.9
      });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos[0], pos[1] + 12, pos[2]);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      meshes.push(trunk);

      for (var i = 0; i < 3; i++) {
        var canopyGeometry = new THREE.SphereGeometry(5 - i, 6, 6);
        var canopyMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.swampGreen,
          metalness: 0,
          roughness: 0.9,
          emissive: 0x1A3A1A,
          emissiveIntensity: 0.1
        });
        var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.set(pos[0], pos[1] + 18 + i * 3, pos[2]);
        canopy.scale.set(1, 1.3, 1);
        canopy.castShadow = true;
        canopy.receiveShadow = true;
        scene.add(canopy);
        meshes.push(canopy);
      }

      var mossGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var mossMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A5A3A,
        metalness: 0,
        roughness: 1
      });
      for (var j = 0; j < 5; j++) {
        var moss = new THREE.Mesh(mossGeometry, mossMaterial);
        moss.position.set(
          pos[0] + Math.random() * 6 - 3,
          pos[1] + 20 + Math.random() * 4,
          pos[2] + Math.random() * 6 - 3
        );
        moss.castShadow = true;
        scene.add(moss);
        meshes.push(moss);
      }
    });
  }

  function createSpecimenPods(scene) {
    var podPositions = [
      [5, 10, -5],
      [-5, 10, -8],
      [8, 10, 3],
      [-8, 10, 6]
    ];

    podPositions.forEach(function(pos) {
      var podGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 8);
      var podMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.6,
        roughness: 0.3
      });
      var pod = new THREE.Mesh(podGeometry, podMaterial);
      pod.position.set(pos[0], pos[1], pos[2]);
      pod.castShadow = true;
      pod.receiveShadow = true;
      scene.add(pod);
      meshes.push(pod);

      var glassGeometry = new THREE.BoxGeometry(3.2, 5.2, 0.1);
      var glassMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.specimenPurple,
        metalness: 0.8,
        roughness: 0.1,
        emissive: COLORS.specimenPurple,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.6
      });
      var glass = new THREE.Mesh(glassGeometry, glassMaterial);
      glass.position.set(pos[0] + 1.7, pos[1], pos[2]);
      glass.castShadow = true;
      scene.add(glass);
      meshes.push(glass);

      specimens.push({
        mesh: pod,
        glowMesh: glass,
        pulseTime: Math.random() * Math.PI * 2
      });
    });
  }

  function createGeneratorHouse(scene) {
    var genGeometry = new THREE.BoxGeometry(8, 6, 8);
    var genMaterial = new THREE.MeshStandardMaterial({
      color: 0xAA5533,
      metalness: 0.2,
      roughness: 0.7
    });
    var generator = new THREE.Mesh(genGeometry, genMaterial);
    generator.position.set(18, 10, -15);
    generator.castShadow = true;
    generator.receiveShadow = true;
    scene.add(generator);
    meshes.push(generator);

    var exhaust1Geometry = new THREE.CylinderGeometry(0.6, 0.6, 6, 6);
    var exhaustMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5
    });
    var exhaust1 = new THREE.Mesh(exhaust1Geometry, exhaustMaterial);
    exhaust1.position.set(15, 13, -15);
    exhaust1.castShadow = true;
    scene.add(exhaust1);
    meshes.push(exhaust1);

    var exhaust2 = new THREE.Mesh(exhaust1Geometry, exhaustMaterial);
    exhaust2.position.set(21, 13, -15);
    exhaust2.castShadow = true;
    scene.add(exhaust2);
    meshes.push(exhaust2);

    animationRefs.generatorPulse = {
      time: 0,
      light: null
    };
  }

  function createBoatDock(scene) {
    var dockGeometry = new THREE.BoxGeometry(10, 0.3, 6);
    var dockMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      metalness: 0.1,
      roughness: 0.8
    });
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(-40, 9.5, 30);
    dock.castShadow = true;
    dock.receiveShadow = true;
    scene.add(dock);
    meshes.push(dock);

    var boatBodyGeometry = new THREE.BoxGeometry(6, 1.5, 3);
    var boatMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC6633,
      metalness: 0.3,
      roughness: 0.6
    });
    var boatBody = new THREE.Mesh(boatBodyGeometry, boatMaterial);
    boatBody.position.set(-40, 10.5, 35);
    boatBody.castShadow = true;
    boatBody.receiveShadow = true;
    scene.add(boatBody);
    meshes.push(boatBody);

    var boatCabinGeometry = new THREE.BoxGeometry(2.5, 1.8, 2);
    var boatCabin = new THREE.Mesh(boatCabinGeometry, boatMaterial);
    boatCabin.position.set(-40, 12, 34);
    boatCabin.castShadow = true;
    scene.add(boatCabin);
    meshes.push(boatCabin);
  }

  function createBubblingBogPits(scene) {
    var pitPositions = [
      [-60, -4.5, -50],
      [60, -4.5, 50],
      [-55, -4.5, 55],
      [58, -4.5, -55]
    ];

    pitPositions.forEach(function(pos) {
      var bubbleContainer = [];
      for (var i = 0; i < 4; i++) {
        var bubbleGeometry = new THREE.SphereGeometry(0.8 + Math.random() * 0.5, 6, 6);
        var bubbleMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.bogBrown,
          metalness: 0.3,
          roughness: 0.6,
          emissive: 0x2A1A0A,
          emissiveIntensity: 0.2
        });
        var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.position.set(
          pos[0] + Math.random() * 8 - 4,
          pos[1],
          pos[2] + Math.random() * 8 - 4
        );
        bubble.castShadow = true;
        bubble.receiveShadow = true;
        scene.add(bubble);
        meshes.push(bubble);
        bubbleContainer.push({
          mesh: bubble,
          startY: bubble.position.y,
          time: Math.random() * Math.PI * 2
        });
      }
      bubblingPits.push(bubbleContainer);
    });
  }

  function createElectricFence(scene) {
    var fenceCorners = [
      [-75, 11, -75],
      [75, 11, -75],
      [75, 11, 75],
      [-75, 11, 75]
    ];

    for (var i = 0; i < fenceCorners.length; i++) {
      var start = fenceCorners[i];
      var end = fenceCorners[(i + 1) % fenceCorners.length];

      var lineGeometry = new THREE.BufferGeometry();
      var points = [
        new THREE.Vector3(start[0], start[1], start[2]),
        new THREE.Vector3(end[0], end[1], end[2])
      ];
      lineGeometry.setFromPoints(points);

      var lineMaterial = new THREE.LineBasicMaterial({
        color: COLORS.electricBlue,
        linewidth: 3,
        fog: false
      });
      var line = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(line);
      meshes.push(line);
      electricFenceSegments.push({
        mesh: line,
        time: 0
      });
    }

    for (var j = 0; j < 4; j++) {
      var postGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 6);
      var postMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7,
        roughness: 0.3
      });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(
        fenceCorners[j][0],
        fenceCorners[j][1] - 1.5,
        fenceCorners[j][2]
      );
      post.castShadow = true;
      scene.add(post);
      meshes.push(post);
    }
  }

  function createMutantCreatures(scene) {
    var creatureSpawns = [
      [-60, 1, 20],
      [45, 1, -50],
      [-70, 1, -60],
      [70, 1, 50]
    ];

    creatureSpawns.forEach(function(spawn) {
      var bodyGeometry = new THREE.BoxGeometry(2, 3, 1.5);
      var creatureMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.mutantSickly,
        metalness: 0.2,
        roughness: 0.7,
        emissive: 0x228822,
        emissiveIntensity: 0.3
      });
      var body = new THREE.Mesh(bodyGeometry, creatureMaterial);
      body.position.set(spawn[0], spawn[1], spawn[2]);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      meshes.push(body);

      var headGeometry = new THREE.SphereGeometry(1.2, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0x336633,
        metalness: 0.1,
        roughness: 0.8,
        emissive: 0x225522,
        emissiveIntensity: 0.2
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(spawn[0], spawn[1] + 2.5, spawn[2]);
      head.scale.set(1.2, 1.3, 1);
      head.castShadow = true;
      scene.add(head);
      meshes.push(head);

      mutantCreatures.push({
        body: body,
        head: head,
        time: Math.random() * Math.PI * 2,
        positionIndex: Math.floor(Math.random() * creatureSpawns.length)
      });
    });
  }

  function init(scene, camera) {
    createSwampWater(scene);
    createLabStilts(scene);
    createLabPlatform(scene);
    createLabBuilding(scene);
    createBoardwalks(scene);
    createCypressTrees(scene);
    createSpecimenPods(scene);
    createGeneratorHouse(scene);
    createBoatDock(scene);
    createBubblingBogPits(scene);
    createElectricFence(scene);
    createMutantCreatures(scene);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(50, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    animationRefs.generatorPulse.light = new THREE.PointLight(COLORS.electricBlue, 0.5, 30);
    animationRefs.generatorPulse.light.position.set(18, 16, -15);
    scene.add(animationRefs.generatorPulse.light);
  }

  function update(delta) {
    animationRefs.waterRipple.time += delta;
    if (swampWaterMesh) {
      var posAttribute = swampWaterMesh.geometry.getAttribute('position');
      for (var i = 0; i < posAttribute.count; i++) {
        var x = posAttribute.getX(i);
        var z = posAttribute.getZ(i);
        var ripple = Math.sin(animationRefs.waterRipple.time * 3 + x * 0.05 + z * 0.05) * 0.02;
        posAttribute.setY(i, ripple);
      }
      posAttribute.needsUpdate = true;
    }

    bubblingPits.forEach(function(pit) {
      pit.forEach(function(bubble) {
        bubble.time += delta;
        var yOffset = Math.sin(bubble.time * 2) * 2 + Math.cos(bubble.time * 3) * 0.5;
        bubble.mesh.position.y = bubble.startY + yOffset;
      });
    });

    specimens.forEach(function(spec) {
      spec.pulseTime += delta * 2;
      var pulse = Math.sin(spec.pulseTime) * 0.3 + 0.7;
      spec.glowMesh.material.emissiveIntensity = pulse;
    });

    animationRefs.generatorPulse.time += delta;
    var flicker = Math.sin(animationRefs.generatorPulse.time * 8) * 0.3 + 0.5;
    if (animationRefs.generatorPulse.light) {
      animationRefs.generatorPulse.light.intensity = flicker;
    }

    mutantCreatures.forEach(function(creature) {
      creature.time += delta;
      var bobOffset = Math.sin(creature.time * 1.5) * 0.3;
      creature.body.position.y = creature.body.position.y + bobOffset * 0.1;
      creature.head.position.y = creature.head.position.y + bobOffset * 0.1;

      var wanderX = Math.sin(creature.time * 0.3) * 15;
      var wanderZ = Math.cos(creature.time * 0.3) * 15;
      creature.body.position.x += wanderX * delta * 0.1;
      creature.body.position.z += wanderZ * delta * 0.1;
      creature.head.position.x = creature.body.position.x;
      creature.head.position.z = creature.body.position.z;
    });

    electricFenceSegments.forEach(function(seg) {
      seg.time += delta;
      var sparkIntensity = Math.sin(seg.time * 12) * 0.5 + 0.5;
      seg.mesh.material.linewidth = 2 + sparkIntensity * 3;
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(m) { m.dispose(); });
        } else {
          mesh.material.dispose();
        }
      }
    });
    meshes = [];
    bubblingPits = [];
    mutantCreatures = [];
    specimens = [];
    electricFenceSegments = [];
    animationRefs = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
