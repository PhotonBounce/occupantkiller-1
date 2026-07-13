window.VaporStation = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var turbines = [];
  var vents = [];
  var valves = [];
  var particles = [];

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    meshes = [];
    turbines = [];
    vents = [];
    valves = [];
    particles = [];

    // Ground plane reference geometry (using BoxGeometry for flat surface)
    var groundGeo = new THREE.BoxGeometry(80, 0.5, 80);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    var groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.25;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    meshes.push(groundMesh);

    // Central geothermal access shaft
    var shaftGeo = new THREE.CylinderGeometry(6, 6.5, 12, 8);
    var shaftMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 });
    var shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.set(0, 6, 0);
    shaftMesh.castShadow = true;
    scene.add(shaftMesh);
    meshes.push(shaftMesh);

    // Cooling towers (main atmospheric exchange points)
    createCoolingTower(-20, 0, -15, 4, 20);
    createCoolingTower(20, 0, -15, 4, 20);
    createCoolingTower(-20, 0, 15, 4.5, 22);
    createCoolingTower(22, 0, 18, 4.5, 22);

    // Steam vent structures (heat source points)
    createSteamVent(-10, 0, -25);
    createSteamVent(12, 0, -28);
    createSteamVent(-28, 0, 8);
    createSteamVent(30, 0, 12);
    createSteamVent(-5, 0, 25);
    createSteamVent(8, 0, 28);

    // Main turbine generator buildings
    createTurbineBuilding(-15, 0, 0);
    createTurbineBuilding(18, 0, -8);
    createTurbineBuilding(0, 0, 20);

    // Pressure release valve manifolds
    createValveManifold(-8, 3, -12);
    createValveManifold(10, 3, 8);
    createValveManifold(-25, 2, 20);

    // Pipe network crisscrossing
    createPipeNetwork(-15, 8, -10, 15, 8, -10);
    createPipeNetwork(10, 8, 5, -10, 8, 15);
    createPipeNetwork(-20, 10, 15, 25, 10, -15);
    createPipeNetwork(0, 9, -20, 0, 9, 25);

    // Catwalk platforms over vents
    createCatwalk(-10, 5, -25, 12, 1);
    createCatwalk(12, 5, -28, 12, 1);
    createCatwalk(30, 5, 12, 10, 1);

    // Underground blast doors (FPS cover objects)
    createBlastDoor(-30, 1.5, -20);
    createBlastDoor(28, 1.5, 25);
    createBlastDoor(-25, 2, 25);

    // Valve housing clusters (cover points)
    createValveHousing(-5, 2, 0);
    createValveHousing(5, 2, 5);
    createValveHousing(-15, 1.5, 15);
    createValveHousing(15, 2, -10);

    // Pressure regulation spheres (visual interest)
    createPressureSphere(0, 4, 0);
    createPressureSphere(-18, 3, 8);
    createPressureSphere(22, 3, -5);

    // Reinforced concrete bunker sections
    createBunkerSection(-35, 2, -30);
    createBunkerSection(35, 2, 30);
    createBunkerSection(-32, 2, 32);

    // Exhaust stack clusters
    createExhaustStack(-12, 8, -18);
    createExhaustStack(15, 8, 10);

    // Water cooling cistern (large central tank)
    createCistern(0, 2, -8);

    // Initialize steam vents for animation
    for (var i = 0; i < vents.length; i++) {
      vents[i].time = Math.random() * Math.PI * 2;
      vents[i].phase = Math.random() * 0.5;
    }

    // Initialize turbines for rotation
    for (var j = 0; j < turbines.length; j++) {
      turbines[j].rotationSpeed = 0.02 + Math.random() * 0.03;
    }

    // Initialize valves for oscillation
    for (var k = 0; k < valves.length; k++) {
      valves[k].time = Math.random() * Math.PI * 2;
      valves[k].amplitude = 0.1 + Math.random() * 0.05;
    }
  }

  function createCoolingTower(x, y, z, radius, height) {
    var geo = new THREE.CylinderGeometry(radius, radius * 1.2, height, 12);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x3a4a4a,
      metalness: 0.4,
      roughness: 0.6
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    // Inner cooling structure
    var innerGeo = new THREE.CylinderGeometry(radius * 0.7, radius * 0.6, height * 0.8, 8);
    var innerMat = new THREE.MeshStandardMaterial({
      color: 0x2a3a3a,
      metalness: 0.6,
      roughness: 0.4
    });
    var innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.set(x, y + height * 0.1, z);
    scene.add(innerMesh);
    meshes.push(innerMesh);

    vents.push({
      mesh: mesh,
      baseX: mesh.position.x,
      baseY: mesh.position.y,
      baseZ: mesh.position.z,
      time: 0,
      phase: 0
    });
  }

  function createSteamVent(x, y, z) {
    var geo = new THREE.CylinderGeometry(2, 2.5, 2, 6);
    var mat = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      emissive: 0xff6b35,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1, z);
    mesh.castShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    vents.push({
      mesh: mesh,
      baseX: mesh.position.x,
      baseY: mesh.position.y,
      baseZ: mesh.position.z,
      time: 0,
      phase: Math.random() * Math.PI * 2
    });
  }

  function createTurbineBuilding(x, y, z) {
    var buildingGeo = new THREE.BoxGeometry(8, 10, 8);
    var buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a2a,
      metalness: 0.5,
      roughness: 0.7
    });
    var buildingMesh = new THREE.Mesh(buildingGeo, buildingMat);
    buildingMesh.position.set(x, y + 5, z);
    buildingMesh.castShadow = true;
    scene.add(buildingMesh);
    meshes.push(buildingMesh);

    // Turbine rotor inside
    var rotorGeo = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
    var rotorMat = new THREE.MeshStandardMaterial({
      color: 0x4a5a5a,
      metalness: 0.7,
      roughness: 0.3
    });
    var rotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
    rotorMesh.position.set(x, y + 5, z);
    rotorMesh.castShadow = true;
    scene.add(rotorMesh);
    meshes.push(rotorMesh);
    turbines.push(rotorMesh);

    // Rotor blades (using cone geometry)
    for (var i = 0; i < 3; i++) {
      var bladeGeo = new THREE.ConeGeometry(1.5, 5, 4);
      var bladeMat = new THREE.MeshStandardMaterial({
        color: 0x5a6a6a,
        metalness: 0.6,
        roughness: 0.4
      });
      var bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      bladeMesh.position.set(x, y + 5, z);
      bladeMesh.rotation.z = (Math.PI * 2 / 3) * i;
      scene.add(bladeMesh);
      meshes.push(bladeMesh);
      turbines.push(bladeMesh);
    }
  }

  function createValveManifold(x, y, z) {
    var manifoldGeo = new THREE.BoxGeometry(6, 4, 3);
    var manifoldMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a4a,
      metalness: 0.6,
      roughness: 0.5
    });
    var manifoldMesh = new THREE.Mesh(manifoldGeo, manifoldMat);
    manifoldMesh.position.set(x, y, z);
    manifoldMesh.castShadow = true;
    scene.add(manifoldMesh);
    meshes.push(manifoldMesh);

    // Individual pressure release valves (spheres)
    for (var i = 0; i < 4; i++) {
      var valveGeo = new THREE.SphereGeometry(0.6, 8, 8);
      var valveMat = new THREE.MeshStandardMaterial({
        color: 0xff8c42,
        emissive: 0xff6b35,
        emissiveIntensity: 0.2,
        metalness: 0.8,
        roughness: 0.2
      });
      var valveMesh = new THREE.Mesh(valveGeo, valveMat);
      var offsetX = (i % 2) * 2 - 1;
      var offsetZ = Math.floor(i / 2) * 2 - 1;
      valveMesh.position.set(x + offsetX * 2, y + 2.5, z + offsetZ * 1.5);
      scene.add(valveMesh);
      meshes.push(valveMesh);
      valves.push({
        mesh: valveMesh,
        baseX: valveMesh.position.x,
        baseY: valveMesh.position.y,
        baseZ: valveMesh.position.z,
        time: 0,
        amplitude: 0.1
      });
    }
  }

  function createPipeNetwork(x1, y1, z1, x2, y2, z2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dz = z2 - z1;
    var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    var pipeGeo = new THREE.CylinderGeometry(0.5, 0.5, length, 8);
    var pipeMat = new THREE.MeshStandardMaterial({
      color: 0x4a5a5a,
      metalness: 0.7,
      roughness: 0.3
    });
    var pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);

    var midX = (x1 + x2) / 2;
    var midY = (y1 + y2) / 2;
    var midZ = (z1 + z2) / 2;
    pipeMesh.position.set(midX, midY, midZ);

    var angle = Math.atan2(dz, dx);
    var vertAngle = Math.asin(dy / length);
    pipeMesh.rotation.z = vertAngle;
    pipeMesh.rotation.y = angle;

    pipeMesh.castShadow = true;
    scene.add(pipeMesh);
    meshes.push(pipeMesh);

    // Pipe joints (cylinders)
    var jointGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.8, 6);
    var jointMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a4a,
      metalness: 0.8,
      roughness: 0.2
    });

    var joint1 = new THREE.Mesh(jointGeo, jointMat);
    joint1.position.set(x1, y1, z1);
    scene.add(joint1);
    meshes.push(joint1);

    var joint2 = new THREE.Mesh(jointGeo, jointMat);
    joint2.position.set(x2, y2, z2);
    scene.add(joint2);
    meshes.push(joint2);
  }

  function createCatwalk(x, y, z, length, width) {
    var plateGeo = new THREE.BoxGeometry(length, width, 1.5);
    var plateMat = new THREE.MeshStandardMaterial({
      color: 0x5a6a6a,
      metalness: 0.6,
      roughness: 0.5
    });
    var plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(x, y, z);
    plateMesh.castShadow = true;
    scene.add(plateMesh);
    meshes.push(plateMesh);

    // Support pillars
    var pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, y, 6);
    var pillarMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a4a,
      metalness: 0.7,
      roughness: 0.4
    });

    for (var i = 0; i < 3; i++) {
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      var pillarX = x - length / 3 + (i * length / 3);
      pillar.position.set(pillarX, y / 2, z);
      scene.add(pillar);
      meshes.push(pillar);
    }

    // Rail guards (line segments)
    var points = [
      new THREE.Vector3(x - length / 2, y + 0.5, z),
      new THREE.Vector3(x + length / 2, y + 0.5, z)
    ];
    var railGeo = new THREE.BufferGeometry().setFromPoints(points);
    var railMat = new THREE.LineBasicMaterial({ color: 0xff6b35, linewidth: 2 });
    var railMesh = new THREE.LineSegments(railGeo, railMat);
    scene.add(railMesh);
    meshes.push(railMesh);
  }

  function createBlastDoor(x, y, z) {
    var doorGeo = new THREE.BoxGeometry(4, 5, 0.8);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a2a,
      metalness: 0.8,
      roughness: 0.3
    });
    var doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(x, y + 2.5, z);
    doorMesh.castShadow = true;
    scene.add(doorMesh);
    meshes.push(doorMesh);

    // Door reinforcement (cylinders)
    for (var i = 0; i < 4; i++) {
      var boltGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 6);
      var boltMat = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.9,
        roughness: 0.1
      });
      var bolt = new THREE.Mesh(boltGeo, boltMat);
      var boltX = x - 1.5 + (i % 2) * 3;
      var boltY = y + 1.5 + Math.floor(i / 2) * 2.5;
      bolt.position.set(boltX, boltY, z);
      scene.add(bolt);
      meshes.push(bolt);
    }
  }

  function createValveHousing(x, y, z) {
    var housingGeo = new THREE.BoxGeometry(3, 3.5, 3);
    var housingMat = new THREE.MeshStandardMaterial({
      color: 0x2a3a3a,
      metalness: 0.6,
      roughness: 0.6
    });
    var housingMesh = new THREE.Mesh(housingGeo, housingMat);
    housingMesh.position.set(x, y + 1.75, z);
    housingMesh.castShadow = true;
    scene.add(housingMesh);
    meshes.push(housingMesh);

    // Central valve (sphere)
    var valveGeo = new THREE.SphereGeometry(0.8, 10, 10);
    var valveMat = new THREE.MeshStandardMaterial({
      color: 0xff8c42,
      metalness: 0.8,
      roughness: 0.2
    });
    var valveMesh = new THREE.Mesh(valveGeo, valveMat);
    valveMesh.position.set(x, y + 1.75, z);
    scene.add(valveMesh);
    meshes.push(valveMesh);
  }

  function createPressureSphere(x, y, z) {
    var geo = new THREE.SphereGeometry(2.5, 16, 16);
    var mat = new THREE.MeshStandardMaterial({
      color: 0xff8c42,
      emissive: 0xff6b35,
      emissiveIntensity: 0.15,
      metalness: 0.7,
      roughness: 0.4
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
  }

  function createBunkerSection(x, y, z) {
    var bunkerGeo = new THREE.BoxGeometry(8, 4, 6);
    var bunkerMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.4,
      roughness: 0.8
    });
    var bunkerMesh = new THREE.Mesh(bunkerGeo, bunkerMat);
    bunkerMesh.position.set(x, y, z);
    bunkerMesh.castShadow = true;
    scene.add(bunkerMesh);
    meshes.push(bunkerMesh);

    // Reinforcing beams (cylinders)
    var beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
    var beamMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.7,
      roughness: 0.3
    });

    for (var i = 0; i < 2; i++) {
      var beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(x - 2 + i * 4, y + 2, z);
      scene.add(beam);
      meshes.push(beam);
    }
  }

  function createExhaustStack(x, y, z) {
    var stackGeo = new THREE.CylinderGeometry(1.5, 1.8, 12, 8);
    var stackMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a4a,
      metalness: 0.5,
      roughness: 0.6
    });
    var stackMesh = new THREE.Mesh(stackGeo, stackMat);
    stackMesh.position.set(x, y + 6, z);
    stackMesh.castShadow = true;
    scene.add(stackMesh);
    meshes.push(stackMesh);

    // Stack top cap (cone)
    var capGeo = new THREE.ConeGeometry(1.8, 1.5, 8);
    var capMat = new THREE.MeshStandardMaterial({
      color: 0x2a3a3a,
      metalness: 0.6,
      roughness: 0.4
    });
    var capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(x, y + 13, z);
    scene.add(capMesh);
    meshes.push(capMesh);

    vents.push({
      mesh: capMesh,
      baseX: capMesh.position.x,
      baseY: capMesh.position.y,
      baseZ: capMesh.position.z,
      time: 0,
      phase: Math.random() * Math.PI * 2
    });
  }

  function createCistern(x, y, z) {
    var cisternGeo = new THREE.CylinderGeometry(5, 5, 4, 12);
    var cisternMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a5a,
      metalness: 0.5,
      roughness: 0.6
    });
    var cisternMesh = new THREE.Mesh(cisternGeo, cisternMat);
    cisternMesh.position.set(x, y + 2, z);
    cisternMesh.castShadow = true;
    scene.add(cisternMesh);
    meshes.push(cisternMesh);

    // Cistern top platform
    var topGeo = new THREE.CylinderGeometry(5.3, 5.3, 0.5, 12);
    var topMat = new THREE.MeshStandardMaterial({
      color: 0x4a6a7a,
      metalness: 0.6,
      roughness: 0.5
    });
    var topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.set(x, y + 4.3, z);
    scene.add(topMesh);
    meshes.push(topMesh);
  }

  function update(delta) {
    var deltaSeconds = delta / 1000;

    // Update steam vents with pulsing motion
    for (var i = 0; i < vents.length; i++) {
      var vent = vents[i];
      vent.time += deltaSeconds * 2.5;
      var pulse = Math.sin(vent.time + vent.phase) * 0.3;
      vent.mesh.position.y = vent.baseY + pulse;
      vent.mesh.scale.y = 1 + Math.abs(pulse) * 0.2;
    }

    // Update turbine rotations
    for (var j = 0; j < turbines.length; j++) {
      var turbine = turbines[j];
      turbine.rotation.x += turbine.rotationSpeed || 0.02;
    }

    // Update pressure valve oscillations
    for (var k = 0; k < valves.length; k++) {
      var valve = valves[k];
      valve.time += deltaSeconds * 3;
      var oscillation = Math.sin(valve.time) * valve.amplitude;
      valve.mesh.position.y = valve.baseY + oscillation;
      valve.mesh.scale.z = 1 + Math.abs(oscillation) * 0.5;
    }
  }

  function reset() {
    // Reset all animations to initial state
    for (var i = 0; i < vents.length; i++) {
      vents[i].time = Math.random() * Math.PI * 2;
      vents[i].mesh.position.y = vents[i].baseY;
      vents[i].mesh.scale.set(1, 1, 1);
    }

    for (var j = 0; j < turbines.length; j++) {
      turbines[j].rotation.set(0, 0, 0);
    }

    for (var k = 0; k < valves.length; k++) {
      valves[k].time = Math.random() * Math.PI * 2;
      valves[k].mesh.position.y = valves[k].baseY;
      valves[k].mesh.scale.set(1, 1, 1);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
