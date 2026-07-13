window.ElectricSubstation = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var particles = [];
  var time = 0;
  var saboteurCount = 0;
  var gridFailure = false;
  var saboteurs = [];
  var lastArcTime = 0;

  var COLORS = {
    transformerGray: 0x778899,
    insulatorWhite: 0xF8F8F8,
    powerLine: 0x888888,
    warningYellow: 0xFFCC00,
    arcBlue: 0x4499FF,
    dangerRed: 0xFF2200,
    steelDark: 0x555555,
    concrete: 0xAAAAAA,
    chainlink: 0x666666,
    oilBlack: 0x1a1a1a,
    copperBrown: 0xB87333
  };

  var spawnPoints = [
    { x: 0, y: 0, z: -30 },     // switching yard
    { x: -40, y: 0, z: 20 },    // control building
    { x: 30, y: 0, z: 10 },     // transformer bank
    { x: 50, y: 5, z: 0 },      // transmission tower base
    { x: -60, y: 0, z: -40 }    // fence breach
  ];

  function createTransformer(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Main tank (large box)
    var tankGeo = new THREE.BoxGeometry(8, 6, 5);
    var tankMat = new THREE.MeshPhongMaterial({ color: COLORS.transformerGray });
    var tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.y = 3;
    tank.castShadow = true;
    tank.receiveShadow = true;
    group.add(tank);
    meshes.push(tank);

    // Oil containment base
    var baseGeo = new THREE.BoxGeometry(10, 0.5, 7);
    var baseMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    meshes.push(base);

    // High-voltage insulators (ceramic cylinders on top)
    for (var i = -1; i <= 1; i++) {
      var insulatorGeo = new THREE.CylinderGeometry(0.4, 0.5, 2, 8);
      var insulatorMat = new THREE.MeshPhongMaterial({ color: COLORS.insulatorWhite });
      var insulator = new THREE.Mesh(insulatorGeo, insulatorMat);
      insulator.position.set(i * 3, 7, 0);
      insulator.castShadow = true;
      insulator.receiveShadow = true;
      group.add(insulator);
      meshes.push(insulator);
    }

    // Cooling tubes
    for (var j = 0; j < 4; j++) {
      var tubeGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 6);
      var tubeMat = new THREE.MeshPhongMaterial({ color: COLORS.copperBrown });
      var tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(-3 + j * 2, 3, 2.5);
      tube.rotation.z = Math.PI / 2;
      tube.castShadow = true;
      group.add(tube);
      meshes.push(tube);
    }

    return group;
  }

  function createBreakerBank(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Main cabinet
    var cabinetGeo = new THREE.BoxGeometry(2, 5, 1.5);
    var cabinetMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
    var cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinet.position.y = 2.5;
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    group.add(cabinet);
    meshes.push(cabinet);

    // Individual breaker switches
    for (var i = 0; i < 6; i++) {
      var switchGeo = new THREE.BoxGeometry(0.3, 0.4, 0.2);
      var switchMat = new THREE.MeshPhongMaterial({ color: COLORS.dangerRed });
      var breaker = new THREE.Mesh(switchGeo, switchMat);
      breaker.position.set(-(i % 3) * 0.8 + 0.8, 4.5 - Math.floor(i / 3) * 1, 0.75);
      breaker.castShadow = true;
      group.add(breaker);
      meshes.push(breaker);
    }

    // Warning label area
    var labelGeo = new THREE.BoxGeometry(1.8, 0.6, 0.05);
    var labelMat = new THREE.MeshPhongMaterial({ color: COLORS.warningYellow });
    var label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(0, 1.2, 0.76);
    group.add(label);
    meshes.push(label);

    return group;
  }

  function createTransmissionTower(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Lattice tower structure (4 vertical columns with cross-bracing)
    var columnPositions = [
      { x: -2, z: -2 }, { x: 2, z: -2 },
      { x: 2, z: 2 }, { x: -2, z: 2 }
    ];

    // Vertical columns
    for (var i = 0; i < columnPositions.length; i++) {
      var colGeo = new THREE.BoxGeometry(0.3, 15, 0.3);
      var colMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
      var column = new THREE.Mesh(colGeo, colMat);
      column.position.set(columnPositions[i].x, 7.5, columnPositions[i].z);
      column.castShadow = true;
      column.receiveShadow = true;
      group.add(column);
      meshes.push(column);
    }

    // Horizontal bracing with LineSegments
    var braceGeo = new THREE.BufferGeometry();
    var bracePositions = new Float32Array([
      -2, 12, -2, 2, 12, -2,   // top front
      2, 12, -2, 2, 12, 2,     // top right
      2, 12, 2, -2, 12, 2,     // top back
      -2, 12, 2, -2, 12, -2,   // top left
      -2, 5, -2, 2, 5, -2,     // mid front
      2, 5, -2, 2, 5, 2,       // mid right
      2, 5, 2, -2, 5, 2,       // mid back
      -2, 5, 2, -2, 5, -2      // mid left
    ]);
    braceGeo.setAttribute('position', new THREE.BufferAttribute(bracePositions, 3));
    var braceMat = new THREE.LineBasicMaterial({ color: COLORS.powerLine, linewidth: 2 });
    var bracing = new THREE.LineSegments(braceGeo, braceMat);
    group.add(bracing);

    // Cross-diagonal bracing
    var diagGeo = new THREE.BufferGeometry();
    var diagPositions = new Float32Array([
      -2, 12, -2, 2, 5, -2,
      2, 12, -2, -2, 5, -2,
      2, 12, 2, -2, 5, 2,
      -2, 12, 2, 2, 5, 2
    ]);
    diagGeo.setAttribute('position', new THREE.BufferAttribute(diagPositions, 3));
    var diagMat = new THREE.LineBasicMaterial({ color: COLORS.powerLine, linewidth: 1 });
    var diagonals = new THREE.LineSegments(diagGeo, diagMat);
    group.add(diagonals);

    // Insulator arms
    for (var j = 0; j < 3; j++) {
      var armGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15);
      var armMat = new THREE.MeshPhongMaterial({ color: COLORS.insulatorWhite });
      var arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(3.5, 13 - j * 2, 0);
      arm.castShadow = true;
      group.add(arm);
      meshes.push(arm);
    }

    return group;
  }

  function createPowerLine(x1, y1, z1, x2, y2, z2) {
    var lineGeo = new THREE.BufferGeometry();
    var positions = new Float32Array([x1, y1, z1, x2, y2, z2]);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: COLORS.powerLine, linewidth: 3 });
    var line = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(line);
    meshes.push(line);
    return line;
  }

  function createControlBuilding(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Main building structure
    var buildingGeo = new THREE.BoxGeometry(15, 8, 12);
    var buildingMat = new THREE.MeshPhongMaterial({ color: COLORS.concrete });
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.y = 4;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);
    meshes.push(building);

    // Roof
    var roofGeo = new THREE.BoxGeometry(16, 0.5, 13);
    var roofMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 8.25;
    roof.castShadow = true;
    group.add(roof);
    meshes.push(roof);

    // Door
    var doorGeo = new THREE.BoxGeometry(2, 3, 0.2);
    var doorMat = new THREE.MeshPhongMaterial({ color: COLORS.oilBlack });
    var door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.5, 6.1);
    door.castShadow = true;
    group.add(door);
    meshes.push(door);

    // Windows (5 on front)
    for (var i = 0; i < 5; i++) {
      var windowGeo = new THREE.BoxGeometry(1.5, 1.5, 0.15);
      var windowMat = new THREE.MeshPhongMaterial({ color: COLORS.arcBlue });
      var window = new THREE.Mesh(windowGeo, windowMat);
      window.position.set(-5 + i * 2.5, 5, 6.1);
      window.castShadow = true;
      group.add(window);
      meshes.push(window);
    }

    // HVAC units on roof
    for (var j = 0; j < 3; j++) {
      var hvacGeo = new THREE.BoxGeometry(2, 1.5, 2);
      var hvacMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
      var hvac = new THREE.Mesh(hvacGeo, hvacMat);
      hvac.position.set(-5 + j * 5, 8.9, -2);
      hvac.castShadow = true;
      group.add(hvac);
      meshes.push(hvac);
    }

    return group;
  }

  function createPerimeterFence(centerX, centerZ, width, depth) {
    var group = new THREE.Group();

    // North fence
    for (var i = 0; i < 8; i++) {
      var poleGeo = new THREE.BoxGeometry(0.15, 3, 0.15);
      var poleMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(centerX - width/2 + i * width/8, 1.5, centerZ - depth/2);
      pole.castShadow = true;
      group.add(pole);
      meshes.push(pole);
    }

    // South fence
    for (var j = 0; j < 8; j++) {
      var poleGeo = new THREE.BoxGeometry(0.15, 3, 0.15);
      var poleMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(centerX - width/2 + j * width/8, 1.5, centerZ + depth/2);
      pole.castShadow = true;
      group.add(pole);
      meshes.push(pole);
    }

    // East fence
    for (var k = 0; k < 6; k++) {
      var poleGeo = new THREE.BoxGeometry(0.15, 3, 0.15);
      var poleMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(centerX + width/2, 1.5, centerZ - depth/2 + k * depth/6);
      pole.castShadow = true;
      group.add(pole);
      meshes.push(pole);
    }

    // West fence
    for (var l = 0; l < 6; l++) {
      var poleGeo = new THREE.BoxGeometry(0.15, 3, 0.15);
      var poleMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(centerX - width/2, 1.5, centerZ - depth/2 + l * depth/6);
      pole.castShadow = true;
      group.add(pole);
      meshes.push(pole);
    }

    // Warning signs on fence poles
    for (var m = 0; m < 6; m++) {
      var signGeo = new THREE.BoxGeometry(1.2, 1, 0.05);
      var signMat = new THREE.MeshPhongMaterial({ color: COLORS.warningYellow });
      var sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(centerX - width/2 + m * width/6, 2.5, centerZ - depth/2 - 0.1);
      group.add(sign);
      meshes.push(sign);
    }

    return group;
  }

  function createCapacitorBank(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // 6 capacitor cylinders in 2x3 arrangement
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 3; j++) {
        var capGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
        var capMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
        var capacitor = new THREE.Mesh(capGeo, capMat);
        capacitor.position.set(i * 1.2, 1.5, j * 1.2);
        capacitor.castShadow = true;
        capacitor.receiveShadow = true;
        group.add(capacitor);
        meshes.push(capacitor);
      }
    }

    // Top connecting bar
    var barGeo = new THREE.BoxGeometry(1.5, 0.2, 3.5);
    var barMat = new THREE.MeshPhongMaterial({ color: COLORS.copperBrown });
    var bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0.6, 3.3, 1.2);
    bar.castShadow = true;
    group.add(bar);
    meshes.push(bar);

    return group;
  }

  function createRelayPanel(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Panel cabinet
    var panelGeo = new THREE.BoxGeometry(1.8, 2.5, 0.8);
    var panelMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
    var panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.y = 1.25;
    panel.castShadow = true;
    group.add(panel);
    meshes.push(panel);

    // Indicator lights
    for (var i = 0; i < 8; i++) {
      var lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
      var lightMat = new THREE.MeshPhongMaterial({ color: COLORS.warningYellow });
      var light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(-0.6 + (i % 4) * 0.4, 2 - Math.floor(i / 4) * 0.6, 0.4);
      light.castShadow = true;
      group.add(light);
      meshes.push(light);
    }

    return group;
  }

  function createGroundingRod(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Main rod (cylinder)
    var rodGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    var rodMat = new THREE.MeshPhongMaterial({ color: COLORS.copperBrown });
    var rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.y = 1;
    rod.castShadow = true;
    group.add(rod);
    meshes.push(rod);

    // Base plate
    var baseGeo = new THREE.BoxGeometry(0.6, 0.1, 0.6);
    var baseMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    group.add(base);
    meshes.push(base);

    return group;
  }

  function createDelugeSystem(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Overhead pipe grid
    var pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 8, 6);
    var pipeMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });

    // Perpendicular pipes
    var pipe1 = new THREE.Mesh(pipeGeo, pipeMat);
    pipe1.position.set(0, 5, 0);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.castShadow = true;
    group.add(pipe1);
    meshes.push(pipe1);

    var pipe2 = new THREE.Mesh(pipeGeo, pipeMat);
    pipe2.position.set(0, 5, 0);
    pipe2.rotation.x = Math.PI / 2;
    pipe2.castShadow = true;
    group.add(pipe2);
    meshes.push(pipe2);

    // Sprinkler heads
    for (var i = -2; i <= 2; i++) {
      for (var j = -2; j <= 2; j++) {
        var sprinklerGeo = new THREE.SphereGeometry(0.2, 6, 6);
        var sprinklerMat = new THREE.MeshPhongMaterial({ color: COLORS.steelDark });
        var sprinkler = new THREE.Mesh(sprinklerGeo, sprinklerMat);
        sprinkler.position.set(i * 2, 5.1, j * 2);
        sprinkler.castShadow = true;
        group.add(sprinkler);
        meshes.push(sprinkler);
      }
    }

    return group;
  }

  function createElectricalArc(x, y, z) {
    var arcGeo = new THREE.SphereGeometry(0.5, 8, 8);
    var arcMat = new THREE.MeshBasicMaterial({ color: COLORS.arcBlue });
    var arc = new THREE.Mesh(arcGeo, arcMat);
    arc.position.set(x, y, z);
    scene.add(arc);

    particles.push({
      mesh: arc,
      lifetime: 0.3,
      age: 0
    });
  }

  function createSaboteur(x, y, z) {
    var saboteur = {
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        0,
        (Math.random() - 0.5) * 15
      ),
      targetIndex: Math.floor(Math.random() * spawnPoints.length),
      rotation: 0
    };
    saboteurs.push(saboteur);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    particles = [];
    saboteurs = [];
    time = 0;
    gridFailure = false;
    saboteurCount = 5;

    // Create main transformers (3 units)
    var transformer1 = createTransformer(-20, 0, 0);
    scene.add(transformer1);

    var transformer2 = createTransformer(0, 0, 0);
    scene.add(transformer2);

    var transformer3 = createTransformer(20, 0, 0);
    scene.add(transformer3);

    // Create breaker banks in switching yard
    for (var i = 0; i < 5; i++) {
      var breakerBank = createBreakerBank(-15 + i * 6, 0, -25);
      scene.add(breakerBank);
    }

    // Create transmission towers
    var tower1 = createTransmissionTower(50, 0, 0);
    scene.add(tower1);

    var tower2 = createTransmissionTower(80, 0, -30);
    scene.add(tower2);

    // Create power lines between towers
    createPowerLine(48, 13, 0, 82, 13, -30);
    createPowerLine(48, 12, 0, 82, 12, -30);
    createPowerLine(48, 11, 0, 82, 11, -30);

    // Power lines from transformers to breaker yards
    createPowerLine(20, 8, 0, 0, 6, -25);
    createPowerLine(0, 8, 0, 0, 6, -25);
    createPowerLine(-20, 8, 0, 0, 6, -25);

    // Create control building
    var controlBuilding = createControlBuilding(-40, 0, 20);
    scene.add(controlBuilding);

    // Create perimeter fence
    var fence = createPerimeterFence(0, 0, 120, 100);
    scene.add(fence);

    // Create capacitor banks
    var capBank1 = createCapacitorBank(-30, 0, 30);
    scene.add(capBank1);

    var capBank2 = createCapacitorBank(30, 0, 30);
    scene.add(capBank2);

    // Create relay protection panels
    var relayPanel1 = createRelayPanel(0, 0, -20);
    scene.add(relayPanel1);

    var relayPanel2 = createRelayPanel(-20, 0, 20);
    scene.add(relayPanel2);

    // Create grounding rods
    for (var j = 0; j < 8; j++) {
      var groundingRod = createGroundingRod(-50 + j * 15, 0, -50);
      scene.add(groundingRod);
    }

    // Create deluge system
    var delugeSystem = createDelugeSystem(0, 0, 0);
    scene.add(delugeSystem);

    // Spawn initial saboteurs
    for (var k = 0; k < saboteurCount; k++) {
      createSaboteur(
        spawnPoints[k % spawnPoints.length].x,
        spawnPoints[k % spawnPoints.length].y,
        spawnPoints[k % spawnPoints.length].z
      );
    }

    // Ground plane
    var groundGeo = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMat = new THREE.MeshPhongMaterial({ color: 0x4d4d4d });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  function update(delta) {
    time += delta;

    // Transformer humming vibration
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh && mesh.userData && mesh.userData.isTransformer) {
        mesh.position.y += Math.sin(time * 8) * 0.002;
      }
    }

    // Random electrical arcs at damaged equipment
    if (time - lastArcTime > 0.5 && Math.random() < 0.3) {
      var arcX = (Math.random() - 0.5) * 60;
      var arcY = 2 + Math.random() * 8;
      var arcZ = (Math.random() - 0.5) * 60;
      createElectricalArc(arcX, arcY, arcZ);
      lastArcTime = time;
    }

    // Update particles
    for (var p = particles.length - 1; p >= 0; p--) {
      var particle = particles[p];
      particle.age += delta;
      if (particle.age >= particle.lifetime) {
        scene.remove(particle.mesh);
        particles.splice(p, 1);
      } else {
        particle.mesh.position.y += delta * 3;
        particle.mesh.material.opacity = 1 - (particle.age / particle.lifetime);
      }
    }

    // Saboteur patrols
    for (var s = 0; s < saboteurs.length; s++) {
      var saboteur = saboteurs[s];
      saboteur.position.x += saboteur.velocity.x * delta;
      saboteur.position.z += saboteur.velocity.z * delta;

      // Boundary checking
      if (Math.abs(saboteur.position.x) > 100) {
        saboteur.velocity.x *= -1;
      }
      if (Math.abs(saboteur.position.z) > 100) {
        saboteur.velocity.z *= -1;
      }

      // Path changing
      if (Math.random() < 0.01) {
        saboteur.velocity.x = (Math.random() - 0.5) * 15;
        saboteur.velocity.z = (Math.random() - 0.5) * 15;
      }
    }

    // Grid failure cascade simulation
    if (time > 30 && !gridFailure) {
      gridFailure = true;
    }

    // Control room monitor flickering
    if (gridFailure && Math.random() < 0.1) {
      for (var m = 0; m < meshes.length; m++) {
        if (meshes[m] && meshes[m].material && meshes[m].material.emissive) {
          meshes[m].material.emissive.setHex(Math.random() < 0.5 ? 0xFF0000 : 0x000000);
        }
      }
    }

    // Lightning rod activation effect
    if (time % 5 < 0.1) {
      for (var l = 0; l < 3; l++) {
        createElectricalArc(
          -50 + Math.random() * 20,
          5 + Math.random() * 3,
          -50 + Math.random() * 20
        );
      }
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      if (meshes[i]) {
        if (meshes[i].parent) {
          meshes[i].parent.remove(meshes[i]);
        } else {
          scene.remove(meshes[i]);
        }
      }
    }

    for (var j = particles.length - 1; j >= 0; j--) {
      if (particles[j]) {
        scene.remove(particles[j].mesh);
      }
    }

    meshes = [];
    particles = [];
    saboteurs = [];
    time = 0;
    gridFailure = false;
    lastArcTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; }
  };
}());
