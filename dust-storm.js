window.DustStorm = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var group = null;
  var stormWall = null;
  var vehicles = [];
  var particles = [];
  var lights = [];
  var ropes = [];
  var dustSwarms = [];

  function init(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;
    group = new THREE.Group();
    scene.add(group);

    buildStormWall();
    buildVehicles();
    buildShelters();
    buildCommunicationEquipment();
    buildBeacon();
    buildDustSwarms();
  }

  function buildStormWall() {
    var geometry = new THREE.SphereGeometry(150, 32, 32);
    var material = new THREE.MeshPhongMaterial({
      color: 0xcc6633,
      emissive: 0x664422,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide
    });
    stormWall = new THREE.Mesh(geometry, material);
    stormWall.position.y = 30;
    group.add(stormWall);
  }

  function buildVehicles() {
    var vehiclePositions = [
      { x: -40, z: 20, rotation: 0.3 },
      { x: 35, z: -15, rotation: -0.25 },
      { x: -20, z: -40, rotation: 0.15 }
    ];

    vehiclePositions.forEach(function(pos) {
      var vehicle = new THREE.Group();

      var chassis = new THREE.Mesh(
        new THREE.BoxGeometry(8, 5, 12),
        new THREE.MeshPhongMaterial({ color: 0x444444 })
      );
      chassis.position.y = 2;
      chassis.rotation.z = pos.rotation;
      vehicle.add(chassis);

      var cabin = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 5),
        new THREE.MeshPhongMaterial({ color: 0x333333 })
      );
      cabin.position.y = 5;
      cabin.position.z = 2;
      chassis.add(cabin);

      var sandMound = new THREE.Mesh(
        new THREE.CylinderGeometry(12, 15, 4, 16),
        new THREE.MeshPhongMaterial({ color: 0xcc9966 })
      );
      sandMound.position.y = 1;
      vehicle.add(sandMound);

      vehicle.position.set(pos.x, 0, pos.z);
      group.add(vehicle);
      vehicles.push(vehicle);
    });
  }

  function buildShelters() {
    var shelterPositions = [
      { x: 50, z: -30 },
      { x: -55, z: 25 },
      { x: 20, z: 45 }
    ];

    shelterPositions.forEach(function(pos) {
      var shelter = new THREE.Group();

      var roof = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1, 14),
        new THREE.MeshPhongMaterial({ color: 0x8B4513 })
      );
      roof.position.y = 5;
      roof.rotation.z = 0.4;
      shelter.add(roof);

      var support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 6, 8),
        new THREE.MeshPhongMaterial({ color: 0x654321 })
      );
      support.position.y = 3;
      support.position.x = -3;
      shelter.add(support);

      shelter.position.set(pos.x, 0, pos.z);
      group.add(shelter);
    });
  }

  function buildCommunicationEquipment() {
    var baseX = 60;
    var baseZ = 10;

    var antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 18, 12),
      new THREE.MeshPhongMaterial({ color: 0x666666 })
    );
    antenna.position.set(baseX, 10, baseZ);
    group.add(antenna);

    var equipmentBox = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 5),
      new THREE.MeshPhongMaterial({ color: 0x444455 })
    );
    equipmentBox.position.set(baseX, 2, baseZ);
    group.add(equipmentBox);

    buildRopes(baseX, baseZ);
  }

  function buildRopes(x, z) {
    var ropeEnds = [
      { start: [x, 18, z], end: [x - 15, 2, z - 15] },
      { start: [x, 18, z], end: [x + 12, 3, z + 18] },
      { start: [x, 18, z], end: [x - 10, 5, z + 14] }
    ];

    ropeEnds.forEach(function(rope) {
      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        rope.start[0], rope.start[1], rope.start[2],
        rope.end[0], rope.end[1], rope.end[2]
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var line = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xaa8844, linewidth: 2 })
      );
      group.add(line);
      ropes.push(line);
    });
  }

  function buildBeacon() {
    var beacon = new THREE.PointLight(0xffff00, 2, 80);
    beacon.position.set(0, 25, 0);
    group.add(beacon);
    lights.push(beacon);

    var beaconGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var beaconMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
    beaconMesh.position.copy(beacon.position);
    group.add(beaconMesh);
  }

  function buildDustSwarms() {
    var swarmCount = 4;
    for (var i = 0; i < swarmCount; i++) {
      var swarm = {
        particles: [],
        centerX: (Math.random() - 0.5) * 100,
        centerY: 20 + Math.random() * 40,
        centerZ: (Math.random() * - 0.5) * 100,
        speed: 0.3 + Math.random() * 0.4,
        angle: Math.random() * Math.PI * 2
      };

      for (var j = 0; j < 12; j++) {
        var geom = new THREE.SphereGeometry(1.2, 8, 8);
        var mat = new THREE.MeshPhongMaterial({
          color: 0xcc9966,
          transparent: true,
          opacity: 0.3
        });
        var particle = new THREE.Mesh(geom, mat);
        particle.position.set(
          swarm.centerX + (Math.random() - 0.5) * 20,
          swarm.centerY + (Math.random() - 0.5) * 15,
          swarm.centerZ + (Math.random() - 0.5) * 20
        );
        group.add(particle);
        swarm.particles.push(particle);
      }

      dustSwarms.push(swarm);
    }
  }

  function update(delta) {
    if (!group) return;

    stormWall.rotation.y += delta * 0.05;

    vehicles.forEach(function(v) {
      v.rotation.y += delta * 0.15;
    });

    dustSwarms.forEach(function(swarm) {
      swarm.angle += delta * swarm.speed;
      var radius = 25;
      swarm.centerX = Math.cos(swarm.angle) * radius;
      swarm.centerZ = Math.sin(swarm.angle) * radius;

      swarm.particles.forEach(function(p) {
        var offsetX = (Math.random() - 0.5) * 25;
        var offsetY = (Math.random() - 0.5) * 20;
        var offsetZ = (Math.random() - 0.5) * 25;

        p.position.x = swarm.centerX + offsetX;
        p.position.y = swarm.centerY + offsetY + Math.sin(swarm.angle * 2) * 5;
        p.position.z = swarm.centerZ + offsetZ;
      });
    });

    lights.forEach(function(light) {
      light.intensity = 1.8 + Math.sin(Date.now() * 0.003) * 0.4;
    });
  }

  function reset() {
    if (group && scene) {
      scene.remove(group);
    }
    vehicles = [];
    particles = [];
    lights = [];
    ropes = [];
    dustSwarms = [];
    group = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
