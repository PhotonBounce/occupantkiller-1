window.RustFactory = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var guards = [];
  var cratePositions = [
    [10, 1, 10], [-15, 1, 20], [20, 1, -5], [-10, 1, -15]
  ];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    guards = [];

    buildFloor();
    buildFurnaces();
    buildConveyorFramework();
    buildCrates();
    buildGantryCranes();
    buildDormitory();
    buildControlOffice();
    buildSkylightBeams();
    buildGuards();
  };

  var buildFloor = function() {
    var floorGeo = new THREE.BoxGeometry(100, 0.5, 100);
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.8
    });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    scene.add(floor);
    meshes.push(floor);
  };

  var buildFurnaces = function() {
    var positions = [[-25, 0, 0], [25, 0, -20], [0, 0, 25]];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var furnaceGeo = new THREE.CylinderGeometry(4, 4.5, 20, 12);
      var furnaceMat = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        metalness: 0.8,
        roughness: 0.9,
        emissive: 0xFF6600,
        emissiveIntensity: 0.3
      });
      var furnace = new THREE.Mesh(furnaceGeo, furnaceMat);
      furnace.position.set(pos[0], pos[1] + 10, pos[2]);
      scene.add(furnace);
      meshes.push(furnace);

      var portGeo = new THREE.SphereGeometry(1.2, 8, 8);
      var portMat = new THREE.MeshStandardMaterial({
        color: 0xFF9900,
        emissive: 0xFF6600,
        emissiveIntensity: 0.8
      });
      var port = new THREE.Mesh(portGeo, portMat);
      port.position.set(pos[0] + 4.5, pos[1] + 8, pos[2]);
      scene.add(port);
      meshes.push(port);

      var topGeo = new THREE.CylinderGeometry(4.5, 4.5, 1, 12);
      var topMat = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.9,
        roughness: 0.7
      });
      var top = new THREE.Mesh(topGeo, topMat);
      top.position.set(pos[0], pos[1] + 20.5, pos[2]);
      scene.add(top);
      meshes.push(top);
    }
  };

  var buildConveyorFramework = function() {
    var points = [
      new THREE.Vector3(-30, 8, -30),
      new THREE.Vector3(30, 8, -30),
      new THREE.Vector3(30, 8, 30),
      new THREE.Vector3(-30, 8, 30),
      new THREE.Vector3(-30, 8, -30)
    ];

    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 3 });
    var trackLine = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(trackLine);
    meshes.push(trackLine);

    var supportGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
    var supportMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.9
    });
    var corners = [[-30, 4, -30], [30, 4, -30], [30, 4, 30], [-30, 4, 30]];
    for (var i = 0; i < corners.length; i++) {
      var support = new THREE.Mesh(supportGeo, supportMat);
      support.position.set(corners[i][0], corners[i][1], corners[i][2]);
      scene.add(support);
      meshes.push(support);
    }
  };

  var buildCrates = function() {
    for (var i = 0; i < cratePositions.length; i++) {
      var pos = cratePositions[i];
      var crateGeo = new THREE.BoxGeometry(4, 4, 4);
      var crateMat = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        metalness: 0.5,
        roughness: 0.9
      });
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(pos[0], pos[1] + 2, pos[2]);
      crate.castShadow = true;
      scene.add(crate);
      meshes.push(crate);

      var stackGeo = new THREE.BoxGeometry(4, 4, 4);
      var stack = new THREE.Mesh(stackGeo, crateMat);
      stack.position.set(pos[0] + 0.5, pos[1] + 6.5, pos[2] + 0.5);
      scene.add(stack);
      meshes.push(stack);
    }
  };

  var buildGantryCranes = function() {
    var cranePositions = [[0, 0, -20], [-20, 0, 10]];

    for (var i = 0; i < cranePositions.length; i++) {
      var pos = cranePositions[i];

      var beamGeo = new THREE.BoxGeometry(25, 1, 1);
      var beamMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.85,
        roughness: 0.8
      });
      var beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(pos[0], pos[1] + 12, pos[2]);
      scene.add(beam);
      meshes.push(beam);

      var wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 8);
      var wheelMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.9,
        roughness: 0.7
      });
      var wheelPositions = [[-10, 12, pos[2]], [10, 12, pos[2]]];
      for (var j = 0; j < wheelPositions.length; j++) {
        var wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelPositions[j][0] + pos[0], wheelPositions[j][1], wheelPositions[j][2]);
        scene.add(wheel);
        meshes.push(wheel);
      }
    }
  };

  var buildDormitory = function() {
    var dormGeo = new THREE.BoxGeometry(20, 12, 15);
    var dormMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.4,
      roughness: 0.8
    });
    var dorm = new THREE.Mesh(dormGeo, dormMat);
    dorm.position.set(-35, 6, 0);
    scene.add(dorm);
    meshes.push(dorm);

    var bunkGeo = new THREE.BoxGeometry(1.5, 0.8, 4);
    var bunkMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.6,
      roughness: 0.8
    });
    var bunkPositions = [[-40, 2, -2], [-40, 2, 2], [-30, 2, -2], [-30, 2, 2]];
    for (var i = 0; i < bunkPositions.length; i++) {
      var bunk = new THREE.Mesh(bunkGeo, bunkMat);
      bunk.position.set(bunkPositions[i][0], bunkPositions[i][1], bunkPositions[i][2]);
      scene.add(bunk);
      meshes.push(bunk);
    }
  };

  var buildControlOffice = function() {
    var officeGeo = new THREE.BoxGeometry(12, 8, 12);
    var officeMat = new THREE.MeshStandardMaterial({
      color: 0x777777,
      metalness: 0.5,
      roughness: 0.8
    });
    var office = new THREE.Mesh(officeGeo, officeMat);
    office.position.set(35, 4, -15);
    scene.add(office);
    meshes.push(office);

    var windowGeo = new THREE.BoxGeometry(2, 2, 0.3);
    var windowMat = new THREE.MeshStandardMaterial({
      color: 0x333366,
      metalness: 0.3,
      roughness: 0.2
    });
    var windowPositions = [[29, 6, -9], [29, 6, -21], [41, 6, -9], [41, 6, -21]];
    for (var i = 0; i < windowPositions.length; i++) {
      var window = new THREE.Mesh(windowGeo, windowMat);
      window.position.set(windowPositions[i][0], windowPositions[i][1], windowPositions[i][2]);
      scene.add(window);
      meshes.push(window);
    }
  };

  var buildSkylightBeams = function() {
    var beamPositions = [[-30, 0, -30], [30, 0, -30], [0, 0, 30], [-15, 0, 0]];

    for (var i = 0; i < beamPositions.length; i++) {
      var pos = beamPositions[i];
      var beamGeo = new THREE.ConeGeometry(3, 25, 8);
      var beamMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFCC,
        transparent: true,
        opacity: 0.15
      });
      var beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(pos[0], pos[1] + 12, pos[2]);
      scene.add(beam);
      meshes.push(beam);
    }
  };

  var buildGuards = function() {
    var guardPositions = [[-10, 0, -10], [15, 0, 5], [-20, 0, 15], [20, 0, -25]];

    for (var i = 0; i < guardPositions.length; i++) {
      var pos = guardPositions[i];
      var bodyGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 6);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.6,
        roughness: 0.8
      });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(pos[0], pos[1] + 1.5, pos[2]);
      scene.add(body);

      var headGeo = new THREE.SphereGeometry(0.5, 8, 8);
      var headMat = new THREE.MeshStandardMaterial({
        color: 0xCC8844,
        metalness: 0.3,
        roughness: 0.8
      });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.set(pos[0], pos[1] + 3, pos[2]);
      scene.add(head);

      guards.push({ body: body, head: head, x: pos[0], z: pos[2], angle: Math.random() * Math.PI * 2 });
      meshes.push(body);
      meshes.push(head);
    }
  };

  var update = function(delta) {
    for (var i = 0; i < guards.length; i++) {
      var guard = guards[i];
      guard.angle += delta * 0.5;
      var radius = 8;
      guard.body.position.x = guard.x + Math.cos(guard.angle) * radius;
      guard.body.position.z = guard.z + Math.sin(guard.angle) * radius;
      guard.head.position.x = guard.body.position.x;
      guard.head.position.z = guard.body.position.z;
      guard.body.rotation.y = guard.angle;
    }
  };

  var reset = function() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    guards = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
