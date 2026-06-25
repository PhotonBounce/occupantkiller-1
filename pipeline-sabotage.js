window.PipelineSabotage = (function() {
  'use strict';

  var scene, camera;
  var meshes = [];
  var animations = [];

  // Spawn points for enemy placement
  var spawnPoints = [
    { x: 0, y: 5, z: -50 },     // Pipeline section 1
    { x: -30, y: 8, z: 0 },     // Pump station
    { x: 40, y: 6, z: 30 },     // Control cabin
    { x: 0, y: 4, z: 40 },      // Sabotage point
    { x: -50, y: 3, z: -30 }    // Perimeter marker
  ];

  // Helper function to create a material with specified color
  var createMaterial = function(color) {
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.4
    });
  };

  // Helper function to add mesh to tracking array
  var addMesh = function(mesh) {
    meshes.push(mesh);
    scene.add(mesh);
    return mesh;
  };

  // Create main pipeline sections with support saddles
  var createPipelineSection = function(startX, startY, startZ, endX, endY, endZ) {
    // Main horizontal pipe
    var pipeGeometry = new THREE.CylinderGeometry(3, 3, 80, 32);
    var pipeMaterial = createMaterial(0xc0c0c0); // Silver
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set((startX + endX) / 2, (startY + endY) / 2, (startZ + endZ) / 2);
    addMesh(pipe);

    // Support saddle 1
    var saddle1Geom = new THREE.BoxGeometry(12, 8, 10);
    var saddleMat = createMaterial(0x708090); // Slate gray
    var saddle1 = new THREE.Mesh(saddle1Geom, saddleMat);
    saddle1.position.set(startX - 15, startY - 6, startZ);
    addMesh(saddle1);

    // Support saddle 2
    var saddle2 = new THREE.Mesh(saddle1Geom, saddleMat);
    saddle2.position.set((startX + endX) / 2, (startY + endY) / 2 - 6, (startZ + endZ) / 2);
    addMesh(saddle2);

    // Support saddle 3
    var saddle3 = new THREE.Mesh(saddle1Geom, saddleMat);
    saddle3.position.set(endX + 15, endY - 6, endZ);
    addMesh(saddle3);

    return pipe;
  };

  // Create pump station building
  var createPumpStation = function(x, y, z) {
    // Station building
    var buildingGeom = new THREE.BoxGeometry(20, 15, 25);
    var buildingMat = createMaterial(0x666666); // Dark gray
    var building = new THREE.Mesh(buildingGeom, buildingMat);
    building.position.set(x, y, z);
    addMesh(building);

    // Pump head 1
    var pumpHeadGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 24);
    var pumpMat = createMaterial(0xff8800); // Orange
    var pumpHead1 = new THREE.Mesh(pumpHeadGeom, pumpMat);
    pumpHead1.position.set(x - 5, y + 8, z - 8);
    pumpHead1.userData.isRotating = true;
    pumpHead1.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    addMesh(pumpHead1);

    // Pump head 2
    var pumpHead2 = new THREE.Mesh(pumpHeadGeom, pumpMat);
    pumpHead2.position.set(x + 5, y + 8, z - 8);
    pumpHead2.userData.isRotating = true;
    pumpHead2.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    addMesh(pumpHead2);

    // Pump head 3
    var pumpHead3 = new THREE.Mesh(pumpHeadGeom, pumpMat);
    pumpHead3.position.set(x, y + 8, z + 8);
    pumpHead3.userData.isRotating = true;
    pumpHead3.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    addMesh(pumpHead3);

    // Control panel on building
    var panelGeom = new THREE.BoxGeometry(4, 3, 0.5);
    var panelMat = createMaterial(0xffff00); // Warning yellow
    var panel = new THREE.Mesh(panelGeom, panelMat);
    panel.position.set(x - 10, y + 5, z + 12.5);
    addMesh(panel);

    return building;
  };

  // Create pig launcher station
  var createPigLauncher = function(x, y, z) {
    // Launcher building
    var launcherBldgGeom = new THREE.BoxGeometry(15, 12, 18);
    var launcherBldgMat = createMaterial(0x696969); // Dim gray
    var launcherBldg = new THREE.Mesh(launcherBldgGeom, launcherBldgMat);
    launcherBldg.position.set(x, y, z);
    addMesh(launcherBldg);

    // Launcher tube
    var launcherTubeGeom = new THREE.CylinderGeometry(2.2, 2.2, 20, 24);
    var tubeMat = createMaterial(0xc0c0c0); // Silver
    var launcherTube = new THREE.Mesh(launcherTubeGeom, tubeMat);
    launcherTube.rotation.z = Math.PI / 2;
    launcherTube.position.set(x + 10, y + 2, z);
    addMesh(launcherTube);

    // Valve actuator
    var actuatorGeom = new THREE.BoxGeometry(2, 4, 2);
    var actuatorMat = createMaterial(0xff0000); // Red
    var actuator = new THREE.Mesh(actuatorGeom, actuatorMat);
    actuator.position.set(x - 8, y + 2, z + 9);
    actuator.userData.isOscillating = true;
    addMesh(actuator);

    return launcherBldg;
  };

  // Create pressure monitoring post
  var createMonitoringPost = function(x, y, z) {
    // Shelter building
    var shelterGeom = new THREE.BoxGeometry(8, 10, 8);
    var shelterMat = createMaterial(0x808080); // Medium gray
    var shelter = new THREE.Mesh(shelterGeom, shelterMat);
    shelter.position.set(x, y, z);
    addMesh(shelter);

    // Sensor 1 (CylinderGeometry)
    var sensorGeom = new THREE.CylinderGeometry(0.5, 0.5, 6, 16);
    var sensorMat = createMaterial(0xffff00); // Yellow
    var sensor1 = new THREE.Mesh(sensorGeom, sensorMat);
    sensor1.position.set(x - 2, y + 5, z - 3);
    sensor1.userData.isFlashing = true;
    addMesh(sensor1);

    // Sensor 2
    var sensor2 = new THREE.Mesh(sensorGeom, sensorMat);
    sensor2.position.set(x + 2, y + 5, z - 3);
    sensor2.userData.isFlashing = true;
    addMesh(sensor2);

    // Sensor 3
    var sensor3 = new THREE.Mesh(sensorGeom, sensorMat);
    sensor3.position.set(x, y + 5, z + 3);
    sensor3.userData.isFlashing = true;
    addMesh(sensor3);

    // Display screen
    var screenGeom = new THREE.BoxGeometry(3, 2, 0.3);
    var screenMat = createMaterial(0x00ff00); // Bright green
    var screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(x, y + 2, z + 4.15);
    screen.userData.isFlashing = true;
    addMesh(screen);

    return shelter;
  };

  // Create pipeline inspection robot
  var createInspectionRobot = function(x, y, z) {
    // Robot body
    var bodyGeom = new THREE.BoxGeometry(1.5, 1.5, 3);
    var bodyMat = createMaterial(0xff6600); // Orange
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(x, y + 2, z);
    body.userData.isCrawling = true;
    body.userData.crawlDirection = 1;
    body.userData.crawlSpeed = 10;
    addMesh(body);

    // Wheel 1
    var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16);
    var wheelMat = createMaterial(0x333333); // Dark
    var wheel1 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(x - 0.8, y + 1, z - 0.5);
    wheel1.userData.parentRobot = body;
    addMesh(wheel1);

    // Wheel 2
    var wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(x + 0.8, y + 1, z - 0.5);
    wheel2.userData.parentRobot = body;
    addMesh(wheel2);

    // Sensor arm
    var armGeom = new THREE.BoxGeometry(0.4, 2, 0.4);
    var armMat = createMaterial(0xffff00); // Yellow
    var arm = new THREE.Mesh(armGeom, armMat);
    arm.position.set(x, y + 3, z + 1.5);
    arm.userData.parentRobot = body;
    addMesh(arm);

    return body;
  };

  // Create valve isolation station
  var createValveStation = function(x, y, z) {
    // Station enclosure
    var enclosureGeom = new THREE.BoxGeometry(10, 8, 10);
    var enclosureMat = createMaterial(0x999999); // Light gray
    var enclosure = new THREE.Mesh(enclosureGeom, enclosureMat);
    enclosure.position.set(x, y, z);
    addMesh(enclosure);

    // Ball valve body
    var valveBodyGeom = new THREE.CylinderGeometry(1.5, 1.5, 3, 16);
    var valveMat = createMaterial(0xff0000); // Red
    var valveBody = new THREE.Mesh(valveBodyGeom, valveMat);
    valveBody.rotation.z = Math.PI / 2;
    valveBody.position.set(x, y, z);
    valveBody.userData.isRotating = true;
    valveBody.userData.rotationAxis = new THREE.Vector3(0, 0, 1);
    addMesh(valveBody);

    // Valve handle
    var handleGeom = new THREE.BoxGeometry(0.3, 0.3, 3);
    var handleMat = createMaterial(0xffff00); // Yellow
    var handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.set(x + 1.8, y, z);
    handle.userData.parentValve = valveBody;
    addMesh(handle);

    return enclosure;
  };

  // Create heat trace cable (LineSegments)
  var createHeatTraceCable = function(x1, y1, z1, x2, y2, z2) {
    var points = [];
    var segments = 20;
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      points.push(new THREE.Vector3(
        x1 + (x2 - x1) * t,
        y1 + (y2 - y1) * t + Math.sin(i * 0.3) * 0.5,
        z1 + (z2 - z1) * t
      ));
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 });
    var cable = new THREE.LineSegments(geometry, material);
    cable.userData.isGlowing = true;
    addMesh(cable);
    return cable;
  };

  // Create snow berm terrain
  var createSnowBerm = function(x, y, z, width, depth) {
    var bermGeom = new THREE.BoxGeometry(width, 3, depth);
    var bermMat = createMaterial(0xf0f8ff); // Alice blue (snow)
    var berm = new THREE.Mesh(bermGeom, bermMat);
    berm.position.set(x, y, z);
    addMesh(berm);
    return berm;
  };

  // Create pipeline control cabin
  var createControlCabin = function(x, y, z) {
    // Cabin building
    var cabinGeom = new THREE.BoxGeometry(18, 14, 20);
    var cabinMat = createMaterial(0x555555); // Dark gray
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(x, y, z);
    addMesh(cabin);

    // Entrance door
    var doorGeom = new THREE.BoxGeometry(2, 4, 0.3);
    var doorMat = createMaterial(0x8b4513); // Saddle brown
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(x - 9, y + 2, z + 10.15);
    addMesh(door);

    // Communication antenna
    var antennaGeom = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
    var antennaMat = createMaterial(0xc0c0c0); // Silver
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(x + 8, y + 10, z - 10);
    addMesh(antenna);

    // Window 1
    var windowGeom = new THREE.BoxGeometry(2, 1.5, 0.2);
    var windowMat = createMaterial(0x87ceeb); // Sky blue
    var window1 = new THREE.Mesh(windowGeom, windowMat);
    window1.position.set(x - 9, y + 4, z + 10.1);
    addMesh(window1);

    // Window 2
    var window2 = new THREE.Mesh(windowGeom, windowMat);
    window2.position.set(x + 9, y + 4, z + 10.1);
    addMesh(window2);

    return cabin;
  };

  // Create emergency shutdown valve
  var createEmergencyShutdown = function(x, y, z) {
    // Actuator box
    var actuatorGeom = new THREE.BoxGeometry(6, 8, 6);
    var actuatorMat = createMaterial(0xff0000); // Red
    var actuator = new THREE.Mesh(actuatorGeom, actuatorMat);
    actuator.position.set(x, y + 4, z);
    addMesh(actuator);

    // Main valve body
    var mainValveGeom = new THREE.CylinderGeometry(2, 2, 4, 16);
    var mainValveMat = createMaterial(0x8b0000); // Dark red
    var mainValve = new THREE.Mesh(mainValveGeom, mainValveMat);
    mainValve.rotation.x = Math.PI / 2;
    mainValve.position.set(x, y - 2, z);
    mainValve.userData.isOscillating = true;
    addMesh(mainValve);

    // Pressure relief
    var reliefGeom = new THREE.SphereGeometry(0.8, 16, 16);
    var reliefMat = createMaterial(0xff6600); // Orange
    var relief = new THREE.Mesh(reliefGeom, reliefMat);
    relief.position.set(x + 3.5, y - 2, z);
    relief.userData.isPulsing = true;
    addMesh(relief);

    return actuator;
  };

  // Create sabotage explosion point
  var createSabotagePoint = function(x, y, z) {
    // Cracked pipe section
    var crackedPipeGeom = new THREE.CylinderGeometry(3, 3, 15, 24);
    var crackedPipeMat = createMaterial(0x696969); // Dim gray (damaged)
    var crackedPipe = new THREE.Mesh(crackedPipeGeom, crackedPipeMat);
    crackedPipe.rotation.z = Math.PI / 2;
    crackedPipe.position.set(x, y, z);
    addMesh(crackedPipe);

    // Explosion fire sphere
    var fireGeom = new THREE.SphereGeometry(4, 16, 16);
    var fireMat = createMaterial(0xff4500); // Orange red
    var fire = new THREE.Mesh(fireGeom, fireMat);
    fire.position.set(x + 8, y + 2, z);
    fire.userData.isPulsing = true;
    fire.userData.maxScale = 1.5;
    addMesh(fire);

    // Smoke emitter
    var smokeGeom = new THREE.SphereGeometry(3, 8, 8);
    var smokeMat = createMaterial(0x444444); // Dark gray
    var smoke = new THREE.Mesh(smokeGeom, smokeMat);
    smoke.position.set(x + 10, y + 6, z);
    smoke.userData.isOscillating = true;
    addMesh(smoke);

    return crackedPipe;
  };

  // Create perimeter marker posts
  var createPerimeterMarkers = function(x, y, z) {
    // Marker post pole
    var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var poleMat = createMaterial(0xffff00); // Warning yellow
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(x, y + 3, z);
    addMesh(pole);

    // Warning tape between posts (LineSegments)
    var tapePoints = [
      new THREE.Vector3(x, y + 4, z),
      new THREE.Vector3(x + 20, y + 4, z)
    ];
    var tapeGeometry = new THREE.BufferGeometry().setFromPoints(tapePoints);
    var tapeMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 3 });
    var tape = new THREE.LineSegments(tapeGeometry, tapeMaterial);
    addMesh(tape);

    return pole;
  };

  // Create cathodic protection station
  var createCathodicStation = function(x, y, z) {
    // Equipment shed
    var shedGeom = new THREE.BoxGeometry(12, 10, 12);
    var shedMat = createMaterial(0x808080); // Gray
    var shed = new THREE.Mesh(shedGeom, shedMat);
    shed.position.set(x, y, z);
    addMesh(shed);

    // Transformer unit
    var transformerGeom = new THREE.BoxGeometry(4, 5, 4);
    var transformerMat = createMaterial(0x666666); // Darker gray
    var transformer = new THREE.Mesh(transformerGeom, transformerMat);
    transformer.position.set(x - 4, y + 2.5, z + 4);
    addMesh(transformer);

    // Ground electrode (vertical cylinder)
    var electrodeGeom = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
    var electrodeMat = createMaterial(0x8b4513); // Brown
    var electrode = new THREE.Mesh(electrodeGeom, electrodeMat);
    electrode.position.set(x + 4, y - 1, z - 4);
    addMesh(electrode);

    return shed;
  };

  // Create frost heave ground bumps
  var createFrostHeave = function(x, y, z) {
    var heaveGeom = new THREE.BoxGeometry(8, 1.5, 8);
    var heaveMat = createMaterial(0xd3d3d3); // Light gray
    var heave = new THREE.Mesh(heaveGeom, heaveMat);
    heave.position.set(x, y, z);
    heave.userData.isOscillating = true;
    heave.userData.oscillationAmount = 0.2;
    addMesh(heave);
    return heave;
  };

  // Initialize the scene with all pipeline infrastructure
  var init = function(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    animations = [];

    // Ground/terrain base
    var groundGeom = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMat = createMaterial(0xf5deb3); // Wheat (frozen ground)
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.set(0, -5, 0);
    addMesh(ground);

    // Main pipeline sections
    createPipelineSection(-40, 5, -50, 40, 5, -50);  // First section
    createPipelineSection(40, 5, -50, 80, 5, 0);     // Second section
    createPipelineSection(80, 5, 0, 40, 5, 50);      // Third section

    // Pump station
    createPumpStation(-30, 8, 0);

    // Pig launcher station
    createPigLauncher(50, 6, -30);

    // Pressure monitoring posts
    createMonitoringPost(-20, 4, 30);
    createMonitoringPost(30, 4, 20);

    // Pipeline inspection robots
    createInspectionRobot(0, 5, 0);
    createInspectionRobot(50, 5, -20);

    // Valve isolation stations
    createValveStation(-50, 3, 15);
    createValveStation(60, 3, 25);

    // Heat trace cables
    createHeatTraceCable(-40, 6, -50, 40, 6, -50);
    createHeatTraceCable(40, 6, -50, 80, 6, 0);

    // Snow berms
    createSnowBerm(-80, 1, -30, 30, 40);
    createSnowBerm(100, 1, 20, 25, 35);

    // Pipeline control cabin
    createControlCabin(40, 7, 50);

    // Emergency shutdown valve
    createEmergencyShutdown(-60, 3, -20);

    // Sabotage point (explosion site)
    createSabotagePoint(0, 5, 40);

    // Perimeter marker posts and warning tape
    createPerimeterMarkers(-80, 1, -80);
    createPerimeterMarkers(-80, 1, 80);
    createPerimeterMarkers(80, 1, -80);
    createPerimeterMarkers(80, 1, 80);

    // Cathodic protection station
    createCathodicStation(-20, 3, -60);

    // Frost heave bumps
    createFrostHeave(-60, 0.5, 30);
    createFrostHeave(20, 0.5, -30);
    createFrostHeave(70, 0.5, 50);

    return spawnPoints;
  };

  // Update animations
  var update = function(delta) {
    if (!scene) return;

    // Update rotating pump heads
    var rotationSpeed = 2 * delta;
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (!mesh.userData) continue;

      // Rotating components (pumps, valves)
      if (mesh.userData.isRotating && mesh.userData.rotationAxis) {
        var axis = mesh.userData.rotationAxis;
        if (axis.x) mesh.rotation.x += rotationSpeed;
        if (axis.y) mesh.rotation.y += rotationSpeed;
        if (axis.z) mesh.rotation.z += rotationSpeed * 0.5;
      }

      // Crawling inspection robot
      if (mesh.userData.isCrawling) {
        mesh.position.z += mesh.userData.crawlSpeed * mesh.userData.crawlDirection * delta;
        if (Math.abs(mesh.position.z) > 50) {
          mesh.userData.crawlDirection *= -1;
        }
      }

      // Pulsing fire/explosions
      if (mesh.userData.isPulsing) {
        var pulseAmount = Math.sin(Date.now() * 0.003) * 0.3 + 1;
        var maxScale = mesh.userData.maxScale || 1.3;
        mesh.scale.set(pulseAmount * 0.7, pulseAmount * 0.7, pulseAmount * 0.7);
      }

      // Oscillating components
      if (mesh.userData.isOscillating) {
        var oscillation = Math.sin(Date.now() * 0.002) * (mesh.userData.oscillationAmount || 0.15);
        if (mesh.userData.originalY === undefined) {
          mesh.userData.originalY = mesh.position.y;
        }
        mesh.position.y = mesh.userData.originalY + oscillation;
      }

      // Flashing sensors and displays
      if (mesh.userData.isFlashing) {
        var flash = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
        mesh.material.opacity = 0.7 + flash * 0.3;
      }

      // Heat cable glow
      if (mesh.userData.isGlowing && mesh.material) {
        var glow = Math.sin(Date.now() * 0.002) * 0.4 + 0.6;
        if (mesh.material.emissive) {
          mesh.material.emissive.setHSL(0.08, 1, glow * 0.3);
        }
      }
    }
  };

  // Reset function
  var reset = function() {
    if (!scene) return;

    // Remove all meshes from scene
    for (var i = meshes.length - 1; i >= 0; i--) {
      var mesh = meshes[i];
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          for (var j = 0; j < mesh.material.length; j++) {
            mesh.material[j].dispose();
          }
        } else {
          mesh.material.dispose();
        }
      }
      scene.remove(mesh);
    }

    meshes = [];
    animations = [];
  };

  // Public API
  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getMeshes: function() { return meshes; }
  };
}());
