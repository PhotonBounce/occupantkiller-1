window.ToxicMine = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var emitters = [];
  var time = 0;

  function buildElevatorShaft(x, z) {
    var geometry = new THREE.BoxGeometry(2, 20, 2);
    var material = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    var shaft = new THREE.Mesh(geometry, material);
    shaft.position.set(x, 10, z);
    scene.add(shaft);
    objects.push(shaft);

    var cableGeometry = new THREE.BufferGeometry();
    var cablePoints = [new THREE.Vector3(x - 0.8, 20, z), new THREE.Vector3(x - 0.8, 0, z)];
    cableGeometry.setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cable);
    objects.push(cable);

    var cable2Geometry = new THREE.BufferGeometry();
    var cable2Points = [new THREE.Vector3(x + 0.8, 20, z), new THREE.Vector3(x + 0.8, 0, z)];
    cable2Geometry.setFromPoints(cable2Points);
    var cable2 = new THREE.LineSegments(cable2Geometry, cableMaterial);
    scene.add(cable2);
    objects.push(cable2);
  }

  function buildMinecartTracks(startX, endX, z) {
    var railMaterial = new THREE.LineBasicMaterial({ color: 0xaa8833 });

    var rail1Geometry = new THREE.BufferGeometry();
    var rail1Points = [new THREE.Vector3(startX, 0.5, z - 1), new THREE.Vector3(endX, 0.5, z - 1)];
    rail1Geometry.setFromPoints(rail1Points);
    var rail1 = new THREE.LineSegments(rail1Geometry, railMaterial);
    scene.add(rail1);
    objects.push(rail1);

    var rail2Geometry = new THREE.BufferGeometry();
    var rail2Points = [new THREE.Vector3(startX, 0.5, z + 1), new THREE.Vector3(endX, 0.5, z + 1)];
    rail2Geometry.setFromPoints(rail2Points);
    var rail2 = new THREE.LineSegments(rail2Geometry, railMaterial);
    scene.add(rail2);
    objects.push(rail2);
  }

  function buildToxicDrum(x, y, z) {
    var drumGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
    var drumMaterial = new THREE.MeshStandardMaterial({ color: 0x660000, metalness: 0.5, roughness: 0.6 });
    var drum = new THREE.Mesh(drumGeometry, drumMaterial);
    drum.position.set(x, y, z);
    scene.add(drum);
    objects.push(drum);

    var sludgeGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var sludgeMaterial = new THREE.MeshStandardMaterial({ color: 0x00cc00, emissive: 0x00ff00, emissiveIntensity: 0.8, metalness: 0 });
    var sludge = new THREE.Mesh(sludgeGeometry, sludgeMaterial);
    sludge.position.set(x, y + 1.2, z);
    scene.add(sludge);
    emitters.push({ mesh: sludge, basePos: sludge.position.clone() });
  }

  function buildGasCloud(x, y, z) {
    var cloudMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00aa00, transparent: true, opacity: 0.3, metalness: 0 });

    var sphere1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 6, 6), cloudMaterial);
    sphere1.position.set(x, y, z);
    scene.add(sphere1);
    emitters.push({ mesh: sphere1, basePos: sphere1.position.clone(), phase: Math.random() * Math.PI * 2 });

    var sphere2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), cloudMaterial);
    sphere2.position.set(x + 1, y + 0.5, z + 1);
    scene.add(sphere2);
    emitters.push({ mesh: sphere2, basePos: sphere2.position.clone(), phase: Math.random() * Math.PI * 2 });

    var sphere3 = new THREE.Mesh(new THREE.SphereGeometry(1.3, 6, 6), cloudMaterial);
    sphere3.position.set(x - 1.5, y - 0.5, z - 1.5);
    scene.add(sphere3);
    emitters.push({ mesh: sphere3, basePos: sphere3.position.clone(), phase: Math.random() * Math.PI * 2 });
  }

  function buildSupportBeam(x, y, z) {
    var beamGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });

    var beam1 = new THREE.Mesh(beamGeometry, beamMaterial);
    beam1.rotation.z = Math.PI / 4;
    beam1.position.set(x - 1, y, z);
    scene.add(beam1);
    objects.push(beam1);

    var beam2 = new THREE.Mesh(beamGeometry, beamMaterial);
    beam2.rotation.z = -Math.PI / 4;
    beam2.position.set(x + 1, y, z);
    scene.add(beam2);
    objects.push(beam2);
  }

  function buildContainmentDoor(x, y, z) {
    var doorGeometry = new THREE.BoxGeometry(3, 4, 0.3);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8, roughness: 0.2 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x, y, z);
    door.rotation.y = 0.4;
    scene.add(door);
    objects.push(door);

    var frameGeometry = new THREE.BoxGeometry(0.2, 4.5, 0.3);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x + 1.7, y, z);
    scene.add(frame);
    objects.push(frame);
  }

  function buildCollapsedTunnel(x, y, z) {
    var rubbleGeometry = new THREE.BoxGeometry(8, 3, 2);
    var rubbleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
    rubble.position.set(x, y, z);
    rubble.rotation.z = 0.3;
    scene.add(rubble);
    objects.push(rubble);

    var coneGeometry = new THREE.ConeGeometry(3, 4, 8);
    var coneMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa77 });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(x + 6, y + 2, z);
    scene.add(cone);
    objects.push(cone);

    var cone2 = new THREE.Mesh(coneGeometry, coneMaterial);
    cone2.position.set(x - 5, y + 1.5, z + 1.5);
    cone2.scale.set(0.7, 0.7, 0.7);
    scene.add(cone2);
    objects.push(cone2);
  }

  function buildFloor() {
    var floorGeometry = new THREE.BoxGeometry(50, 0.5, 40);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -0.25, 0);
    scene.add(floor);
    objects.push(floor);
  }

  function buildCeiling() {
    var ceilingGeometry = new THREE.BoxGeometry(50, 0.5, 40);
    var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, 25, 0);
    scene.add(ceiling);
    objects.push(ceiling);
  }

  function buildWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });

    var northWallGeometry = new THREE.BoxGeometry(50, 25, 0.5);
    var northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, 12.5, -20);
    scene.add(northWall);
    objects.push(northWall);

    var southWallGeometry = new THREE.BoxGeometry(50, 25, 0.5);
    var southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, 12.5, 20);
    scene.add(southWall);
    objects.push(southWall);

    var eastWallGeometry = new THREE.BoxGeometry(0.5, 25, 40);
    var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(25, 12.5, 0);
    scene.add(eastWall);
    objects.push(eastWall);

    var westWallGeometry = new THREE.BoxGeometry(0.5, 25, 40);
    var westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    westWall.position.set(-25, 12.5, 0);
    scene.add(westWall);
    objects.push(westWall);
  }

  function init(s, c) {
    scene = s;
    camera = c;
    objects = [];
    emitters = [];
    time = 0;

    buildFloor();
    buildCeiling();
    buildWalls();

    buildElevatorShaft(-15, -12);
    buildElevatorShaft(15, 12);

    buildMinecartTracks(-20, 20, 0);
    buildMinecartTracks(-20, 20, 8);

    buildToxicDrum(-10, 1, -8);
    buildToxicDrum(8, 1, 15);
    buildToxicDrum(0, 1, -15);

    buildGasCloud(-5, 8, 5);
    buildGasCloud(10, 10, -10);
    buildGasCloud(-15, 9, 0);

    buildSupportBeam(0, 8, 0);
    buildSupportBeam(12, 8, -8);
    buildSupportBeam(-12, 8, 12);

    buildContainmentDoor(-18, 5, 2);
    buildContainmentDoor(18, 5, -5);

    buildCollapsedTunnel(20, 10, -15);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < emitters.length; i++) {
      var emitter = emitters[i];
      var phase = emitter.phase !== undefined ? emitter.phase : 0;
      emitter.mesh.position.x = emitter.basePos.x + Math.sin(time * 0.5 + phase) * 0.5;
      emitter.mesh.position.z = emitter.basePos.z + Math.cos(time * 0.3 + phase) * 0.3;
      emitter.mesh.position.y = emitter.basePos.y + Math.sin(time * 0.8 + phase) * 0.2;
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    for (var j = emitters.length - 1; j >= 0; j--) {
      scene.remove(emitters[j].mesh);
    }
    objects = [];
    emitters = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
