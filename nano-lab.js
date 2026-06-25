window.NanoLab = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var particles = [];
  var time = 0;

  var init = function(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    time = 0;
    meshes = [];
    particles = [];

    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 200);

    buildFloorAndWalls();
    buildNanobotChambers();
    buildMagnificationPlatforms();
    buildCircuitBoard();
    buildMolecularDisplays();
    buildContainmentTubes();
    buildBlastDoors();
    buildDisplayCases();
    buildEmergencyTerminals();
    buildObservationGallery();
    buildLighting();
  };

  var buildFloorAndWalls = function() {
    var floorGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0x1a2a4a });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);

    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x2a4a6a });
    var wallNorth = new THREE.Mesh(new THREE.BoxGeometry(80, 15, 0.5), wallMaterial);
    wallNorth.position.set(0, 7.5, -40);
    wallNorth.receiveShadow = true;
    scene.add(wallNorth);
    meshes.push(wallNorth);

    var wallSouth = new THREE.Mesh(new THREE.BoxGeometry(80, 15, 0.5), wallMaterial);
    wallSouth.position.set(0, 7.5, 40);
    wallSouth.receiveShadow = true;
    scene.add(wallSouth);
    meshes.push(wallSouth);

    var wallEast = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 80), wallMaterial);
    wallEast.position.set(40, 7.5, 0);
    wallEast.receiveShadow = true;
    scene.add(wallEast);
    meshes.push(wallEast);

    var wallWest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 80), wallMaterial);
    wallWest.position.set(-40, 7.5, 0);
    wallWest.receiveShadow = true;
    scene.add(wallWest);
    meshes.push(wallWest);

    var ceilingGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var ceilingMaterial = new THREE.MeshPhongMaterial({ color: 0x1a2a3a });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 28;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    meshes.push(ceiling);
  };

  var buildNanobotChambers = function() {
    var positions = [
      { x: -25, z: -20 },
      { x: 25, z: -20 },
      { x: -25, z: 20 },
      { x: 25, z: 20 },
      { x: 0, z: 0 }
    ];

    var chambermaterial = new THREE.MeshPhongMaterial({ color: 0x00ff88 });

    positions.forEach(function(pos) {
      var chamberGeometry = new THREE.CylinderGeometry(4, 4, 12, 8);
      var chamber = new THREE.Mesh(chamberGeometry, chambermaterial);
      chamber.position.set(pos.x, 6, pos.z);
      chamber.castShadow = true;
      chamber.receiveShadow = true;
      scene.add(chamber);
      meshes.push(chamber);

      var capGeometry = new THREE.SphereGeometry(4.2, 8, 8);
      var capMaterial = new THREE.MeshPhongMaterial({ color: 0x00dd77 });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(pos.x, 12.5, pos.z);
      cap.scale.set(1, 0.6, 1);
      cap.castShadow = true;
      cap.receiveShadow = true;
      scene.add(cap);
      meshes.push(cap);

      createNanoswarmParticles(pos.x, 6, pos.z);
    });
  };

  var createNanoswarmParticles = function(cx, cy, cz) {
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      particles.push({
        x: cx + Math.cos(angle) * 5,
        y: cy,
        z: cz + Math.sin(angle) * 5,
        cx: cx,
        cy: cy,
        cz: cz,
        angle: angle,
        radius: 5,
        speed: 0.5 + Math.random() * 0.3
      });
    }
  };

  var buildMagnificationPlatforms = function() {
    var platformPositions = [
      { x: -30, z: -35, w: 8, d: 8 },
      { x: 30, z: -35, w: 8, d: 8 },
      { x: -30, z: 35, w: 8, d: 8 },
      { x: 30, z: 35, w: 8, d: 8 }
    ];

    var platformMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });

    platformPositions.forEach(function(p) {
      var platformGeometry = new THREE.BoxGeometry(p.w, 0.8, p.d);
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(p.x, 10, p.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      meshes.push(platform);

      var pillarGeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 6);
      var pillarMaterial = new THREE.MeshPhongMaterial({ color: 0xcc5500 });
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(p.x, 5, p.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      meshes.push(pillar);
    });
  };

  var buildCircuitBoard = function() {
    var circuitMaterial = new THREE.MeshPhongMaterial({ color: 0x003366 });
    var nodeMaterial = new THREE.MeshPhongMaterial({ color: 0xff00ff });

    var boardGeometry = new THREE.BoxGeometry(60, 0.3, 60);
    var board = new THREE.Mesh(boardGeometry, circuitMaterial);
    board.position.set(0, 0.3, 0);
    board.receiveShadow = true;
    scene.add(board);
    meshes.push(board);

    var nodePositions = [];
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var radius = 20;
      nodePositions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius
      });
    }

    nodePositions.forEach(function(pos) {
      var nodeGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(pos.x, 0.5, pos.z);
      node.castShadow = true;
      node.receiveShadow = true;
      scene.add(node);
      meshes.push(node);
    });

    var centerGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var center = new THREE.Mesh(centerGeometry, nodeMaterial);
    center.position.set(0, 0.5, 0);
    center.castShadow = true;
    center.receiveShadow = true;
    scene.add(center);
    meshes.push(center);
  };

  var buildMolecularDisplays = function() {
    var displayPositions = [
      { x: -35, z: 0 },
      { x: 35, z: 0 },
      { x: 0, z: -35 },
      { x: 0, z: 35 }
    ];

    displayPositions.forEach(function(pos) {
      createMolecularDisplay(pos.x, 8, pos.z);
    });
  };

  var createMolecularDisplay = function(cx, cy, cz) {
    var displayMaterial = new THREE.MeshPhongMaterial({ color: 0x44ff44 });
    var atomPositions = [];

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var x = cx + Math.cos(angle) * 3;
      var z = cz + Math.sin(angle) * 3;
      atomPositions.push({ x: x, y: cy, z: z });

      var atomGeometry = new THREE.SphereGeometry(0.5, 6, 6);
      var atom = new THREE.Mesh(atomGeometry, displayMaterial);
      atom.position.set(x, cy, z);
      atom.castShadow = true;
      atom.receiveShadow = true;
      scene.add(atom);
      meshes.push(atom);
    }

    var centerAtomGeometry = new THREE.SphereGeometry(0.6, 6, 6);
    var centerAtom = new THREE.Mesh(centerAtomGeometry, displayMaterial);
    centerAtom.position.set(cx, cy, cz);
    centerAtom.castShadow = true;
    centerAtom.receiveShadow = true;
    scene.add(centerAtom);
    meshes.push(centerAtom);

    atomPositions.forEach(function(pos) {
      var lineGeometry = new THREE.BufferGeometry();
      var vertices = new Float32Array([
        cx, cy, cz,
        pos.x, pos.y, pos.z
      ]);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      var lineMaterial = new THREE.LineBasicMaterial({ color: 0x44ff44 });
      var line = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(line);
      meshes.push(line);
    });
  };

  var buildContainmentTubes = function() {
    var tubePositions = [
      { x: -15, z: -28 },
      { x: 15, z: -28 },
      { x: -15, z: 28 },
      { x: 15, z: 28 }
    ];

    var tubeMaterial = new THREE.MeshPhongMaterial({ color: 0x0088ff });
    var swarmMaterial = new THREE.MeshPhongMaterial({ color: 0xff0088 });

    tubePositions.forEach(function(pos) {
      var tubeGeometry = new THREE.CylinderGeometry(2, 2, 16, 6);
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.set(pos.x, 8, pos.z);
      tube.castShadow = true;
      tube.receiveShadow = true;
      scene.add(tube);
      meshes.push(tube);

      for (var i = 0; i < 4; i++) {
        var swarmGeometry = new THREE.SphereGeometry(0.4, 4, 4);
        var swarm = new THREE.Mesh(swarmGeometry, swarmMaterial);
        swarm.position.set(pos.x, 4 + i * 3, pos.z);
        swarm.castShadow = true;
        swarm.receiveShadow = true;
        scene.add(swarm);
        meshes.push(swarm);
      }
    });
  };

  var buildBlastDoors = function() {
    var doorPositions = [
      { x: -38, z: 10 },
      { x: -38, z: -10 },
      { x: 38, z: 10 },
      { x: 38, z: -10 }
    ];

    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var accentMaterial = new THREE.MeshPhongMaterial({ color: 0xff3300 });

    doorPositions.forEach(function(pos) {
      var doorGeometry = new THREE.BoxGeometry(1.5, 6, 4);
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(pos.x, 3, pos.z);
      door.castShadow = true;
      door.receiveShadow = true;
      scene.add(door);
      meshes.push(door);

      var accentGeometry = new THREE.BoxGeometry(0.2, 5, 3.5);
      var accent = new THREE.Mesh(accentGeometry, accentMaterial);
      accent.position.set(pos.x, 3, pos.z);
      accent.castShadow = true;
      accent.receiveShadow = true;
      scene.add(accent);
      meshes.push(accent);
    });
  };

  var buildDisplayCases = function() {
    var casePositions = [
      { x: -32, z: -32 },
      { x: 32, z: -32 },
      { x: -32, z: 32 },
      { x: 32, z: 32 }
    ];

    var caseMaterial = new THREE.MeshPhongMaterial({ color: 0x222244 });
    var specimenMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });

    casePositions.forEach(function(pos) {
      var caseGeometry = new THREE.BoxGeometry(6, 8, 6);
      var caseBox = new THREE.Mesh(caseGeometry, caseMaterial);
      caseBox.position.set(pos.x, 4, pos.z);
      caseBox.castShadow = true;
      caseBox.receiveShadow = true;
      scene.add(caseBox);
      meshes.push(caseBox);

      var specimenGeometry = new THREE.ConeGeometry(1.5, 4, 6);
      var specimen = new THREE.Mesh(specimenGeometry, specimenMaterial);
      specimen.position.set(pos.x, 5, pos.z);
      specimen.castShadow = true;
      specimen.receiveShadow = true;
      scene.add(specimen);
      meshes.push(specimen);
    });
  };

  var buildEmergencyTerminals = function() {
    var terminalPositions = [
      { x: -20, z: -38 },
      { x: 20, z: -38 },
      { x: -20, z: 38 },
      { x: 20, z: 38 }
    ];

    var terminalMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var screenMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

    terminalPositions.forEach(function(pos) {
      var bodyGeometry = new THREE.BoxGeometry(2, 4, 2);
      var body = new THREE.Mesh(bodyGeometry, terminalMaterial);
      body.position.set(pos.x, 2, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      meshes.push(body);

      var screenGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
      var screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(pos.x, 3, pos.z - 1);
      screen.castShadow = true;
      screen.receiveShadow = true;
      scene.add(screen);
      meshes.push(screen);
    });
  };

  var buildObservationGallery = function() {
    var galleryPositions = [
      { x: -35, z: -20 },
      { x: 35, z: -20 },
      { x: -35, z: 20 },
      { x: 35, z: 20 }
    ];

    var galleryMaterial = new THREE.MeshPhongMaterial({ color: 0x4a6a8a });
    var railMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });

    galleryPositions.forEach(function(pos) {
      var platformGeometry = new THREE.BoxGeometry(6, 0.8, 6);
      var platform = new THREE.Mesh(platformGeometry, galleryMaterial);
      platform.position.set(pos.x, 18, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      meshes.push(platform);

      var pillarGeometry = new THREE.CylinderGeometry(1, 1, 10, 4);
      var pillar = new THREE.Mesh(pillarGeometry, railMaterial);
      pillar.position.set(pos.x, 13, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      meshes.push(pillar);
    });
  };

  var buildLighting = function() {
    var ambientLight = new THREE.AmbientLight(0x4488cc, 0.6);
    scene.add(ambientLight);

    var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(20, 25, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.left = -50;
    mainLight.shadow.camera.right = 50;
    mainLight.shadow.camera.top = 50;
    mainLight.shadow.camera.bottom = -50;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    scene.add(mainLight);

    var greenLight = new THREE.PointLight(0x00ff88, 0.5);
    greenLight.position.set(-25, 8, -20);
    scene.add(greenLight);

    var orangeLight = new THREE.PointLight(0xff6600, 0.4);
    orangeLight.position.set(25, 12, 20);
    scene.add(orangeLight);

    var blueLight = new THREE.PointLight(0x0088ff, 0.4);
    blueLight.position.set(0, 15, -30);
    scene.add(blueLight);
  };

  var update = function(delta) {
    time += delta;

    particles.forEach(function(p) {
      p.angle += p.speed * delta;
      p.x = p.cx + Math.cos(p.angle) * p.radius;
      p.z = p.cz + Math.sin(p.angle) * p.radius;
      p.y = p.cy + Math.sin(time * 2 + p.angle) * 0.5;
    });

    meshes.forEach(function(mesh, index) {
      if (index >= 45 && index <= 56) {
        mesh.rotation.y += delta * 0.5;
      }
      if (index >= 17 && index <= 28) {
        var scale = 1 + Math.sin(time * 3 + index) * 0.1;
        mesh.scale.set(scale, scale, scale);
      }
      if (index >= 57 && index <= 72) {
        mesh.rotation.z += delta * 0.3;
      }
    });
  };

  var reset = function() {
    meshes.forEach(function(mesh) {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          mesh.material.dispose();
        }
      }
    });
    meshes = [];
    particles = [];
    time = 0;
    scene.clear();
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
