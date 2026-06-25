window.DesertBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var baseElements = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    baseElements = [];

    buildHescoWalls();
    buildTacticalOpsCenter();
    buildVehicleMotorPool();
    buildHelicopterPad();
    buildFuelBladders();
    buildGuardTowers();
    buildFieldHospitalTent();
    buildCamouflageCables();
  };

  var buildHescoWalls = function() {
    var wallGeometry = new THREE.BoxGeometry(2, 2.5, 0.8);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var radius = 45;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(x, 1.25, z);
      wall.rotation.y = angle;
      scene.add(wall);
      baseElements.push(wall);
    }
  };

  var buildTacticalOpsCenter = function() {
    var buildingGeometry = new THREE.BoxGeometry(20, 8, 15);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4F3D, roughness: 0.8 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(0, 4, 0);
    building.castShadow = true;
    scene.add(building);
    baseElements.push(building);

    var antennaGeometry = new THREE.BoxGeometry(1.5, 12, 1.5);
    var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    for (var i = 0; i < 4; i++) {
      var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antenna.position.set(-6 + i * 4, 14, 5);
      scene.add(antenna);
      baseElements.push(antenna);
    }
  };

  var buildVehicleMotorPool = function() {
    var vehicleGeometry = new THREE.BoxGeometry(4, 2.5, 8);
    var vehicleMaterial = new THREE.MeshStandardMaterial({ color: 0x3D5A3D, roughness: 0.7 });

    for (var row = 0; row < 2; row++) {
      for (var col = 0; col < 3; col++) {
        var vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
        vehicle.position.set(-25 + col * 5, 1.25, -15 + row * 10);
        vehicle.castShadow = true;
        scene.add(vehicle);
        baseElements.push(vehicle);
      }
    }
  };

  var buildHelicopterPad = function() {
    var padGeometry = new THREE.BoxGeometry(25, 0.3, 25);
    var padMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.6 });
    var pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.set(35, 0.15, 0);
    scene.add(pad);
    baseElements.push(pad);

    var markingGeometry = new THREE.BoxGeometry(20, 0.4, 1.5);
    var markingMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 0.6 });
    for (var i = 0; i < 2; i++) {
      var marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.position.set(35, 0.25, -8 + i * 16);
      scene.add(marking);
      baseElements.push(marking);
    }
  };

  var buildFuelBladders = function() {
    var bladderGeometry = new THREE.SphereGeometry(2.5, 12, 12);
    var bladderMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3, roughness: 0.5 });

    for (var row = 0; row < 2; row++) {
      for (var col = 0; col < 3; col++) {
        var bladder = new THREE.Mesh(bladderGeometry, bladderMaterial);
        bladder.scale.set(1.5, 1.2, 1);
        bladder.position.set(-30 + col * 6, 2.5, 20 + row * 8);
        scene.add(bladder);
        baseElements.push(bladder);
      }
    }
  };

  var buildGuardTowers = function() {
    var cornerPositions = [
      { x: 50, z: 50 },
      { x: -50, z: 50 },
      { x: -50, z: -50 },
      { x: 50, z: -50 }
    ];

    for (var i = 0; i < cornerPositions.length; i++) {
      var pos = cornerPositions[i];

      var baseGeometry = new THREE.CylinderGeometry(2, 2.5, 4, 8);
      var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos.x, 2, pos.z);
      scene.add(base);
      baseElements.push(base);

      var platformGeometry = new THREE.BoxGeometry(4, 0.5, 4);
      var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos.x, 4.5, pos.z);
      scene.add(platform);
      baseElements.push(platform);

      var railGeometry = new THREE.BoxGeometry(4, 1, 0.3);
      var railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      for (var j = 0; j < 4; j++) {
        var rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.position.set(pos.x + (j % 2 === 0 ? 1.85 : -1.85), 5, pos.z + (j < 2 ? 1.85 : -1.85));
        if (j % 2 === 1) rail.rotation.z = Math.PI / 2;
        scene.add(rail);
        baseElements.push(rail);
      }
    }
  };

  var buildFieldHospitalTent = function() {
    var tentGeometry = new THREE.BoxGeometry(12, 6, 8);
    var tentMaterial = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.8 });
    var tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.rotation.z = 0.3;
    tent.position.set(-20, 3, 35);
    scene.add(tent);
    baseElements.push(tent);

    var supportGeometry = new THREE.CylinderGeometry(0.5, 0.5, 7, 6);
    var supportMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    for (var i = 0; i < 2; i++) {
      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(-20 + (i === 0 ? -5 : 5), 3.5, 35);
      scene.add(support);
      baseElements.push(support);
    }
  };

  var buildCamouflageCables = function() {
    var points = [];
    var gridSize = 40;
    var gridSpacing = 8;
    var height = 6;

    for (var x = -gridSize; x <= gridSize; x += gridSpacing) {
      for (var z = -gridSize; z <= gridSize; z += gridSpacing) {
        points.push(new THREE.Vector3(x, height, z));
      }
    }

    var cableGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    var cables = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cables);
    baseElements.push(cables);

    for (var i = 0; i < points.length; i++) {
      var poleGeometry = new THREE.CylinderGeometry(0.25, 0.25, height, 6);
      var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(points[i].x, height / 2, points[i].z);
      scene.add(pole);
      baseElements.push(pole);
    }
  };

  var update = function(delta) {
    for (var i = 0; i < baseElements.length; i++) {
      if (baseElements[i].userData && baseElements[i].userData.animate) {
        baseElements[i].rotation.y += delta * 0.5;
      }
    }
  };

  var reset = function() {
    for (var i = 0; i < baseElements.length; i++) {
      scene.remove(baseElements[i]);
    }
    baseElements = [];
    init(scene, camera);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
