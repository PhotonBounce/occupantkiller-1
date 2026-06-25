window.WarConvoy = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var convoy = [];
  var drone = null;
  var barriers = [];
  var rubble = [];
  var towers = [];
  var time = 0;

  function init(s, c) {
    scene = s;
    camera = c;
    buildConvoy();
    buildDrone();
    buildBarriers();
    buildRubble();
    buildTowers();
  }

  function buildConvoy() {
    var positions = [
      { x: 0, z: -20, type: 'tank' },
      { x: 3, z: -28, type: 'apc' },
      { x: -3, z: -35, type: 'motorcycle' },
      { x: 2, z: -42, type: 'tank' }
    ];

    positions.forEach(function(pos) {
      var vehicle = buildVehicle(pos.type);
      vehicle.position.set(pos.x, 1.5, pos.z);
      scene.add(vehicle);
      convoy.push(vehicle);
    });
  }

  function buildVehicle(type) {
    var group = new THREE.Group();
    var material = new THREE.MeshStandardMaterial({ color: 0x2a5f2a });
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });

    if (type === 'tank') {
      var hull = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.2, 5),
        material
      );
      hull.position.y = 0.6;
      group.add(hull);

      var turret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16),
        metalMaterial
      );
      turret.position.set(0, 1.8, 0);
      group.add(turret);

      var gun = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 2, 8),
        metalMaterial
      );
      gun.position.set(0, 1.8, 1.2);
      gun.rotation.z = Math.PI / 2;
      group.add(gun);

      for (var i = 0; i < 4; i++) {
        var wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16),
          metalMaterial
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(i < 2 ? -1.3 : 1.3, 0.5, (i % 2) * 3 - 1.5);
        group.add(wheel);
      }

    } else if (type === 'apc') {
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 4.5),
        material
      );
      body.position.y = 0.75;
      group.add(body);

      for (var i = 0; i < 4; i++) {
        var pod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12),
          metalMaterial
        );
        pod.rotation.z = Math.PI / 2;
        var sideX = i < 2 ? -1.2 : 1.2;
        var posZ = (i % 2) * 2.5 - 1.25;
        pod.position.set(sideX, 0.75, posZ);
        group.add(pod);
      }

    } else if (type === 'motorcycle') {
      var frame = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 2, 8),
        metalMaterial
      );
      frame.rotation.z = Math.PI / 2;
      frame.position.y = 0.5;
      group.add(frame);

      var frontWheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12),
        metalMaterial
      );
      frontWheel.rotation.z = Math.PI / 2;
      frontWheel.position.set(0, 0.35, 1);
      group.add(frontWheel);

      var rearWheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12),
        metalMaterial
      );
      rearWheel.rotation.z = Math.PI / 2;
      rearWheel.position.set(0, 0.35, -1);
      group.add(rearWheel);
    }

    group.userData.type = type;
    return group;
  }

  function buildDrone() {
    var group = new THREE.Group();
    var chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    group.add(chassis);

    var rotors = [
      { x: 0.7, z: 0.7 },
      { x: -0.7, z: 0.7 },
      { x: 0.7, z: -0.7 },
      { x: -0.7, z: -0.7 }
    ];

    rotors.forEach(function(rotor) {
      var prop = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6 })
      );
      prop.position.set(rotor.x, 0.3, rotor.z);
      group.add(prop);
    });

    group.position.set(8, 15, -30);
    group.userData.rotors = rotors;
    scene.add(group);
    drone = group;
  }

  function buildBarriers() {
    var barricadePositions = [
      { x: -5, z: -10 },
      { x: 5, z: -18 },
      { x: -4, z: -26 },
      { x: 6, z: -38 },
      { x: -6, z: -50 }
    ];

    barricadePositions.forEach(function(pos) {
      var barricade = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
      );
      barricade.position.set(pos.x, 0.75, pos.z);
      scene.add(barricade);
      barriers.push(barricade);
    });
  }

  function buildRubble() {
    var rubblePositions = [
      { x: -12, z: -15, size: 1.5 },
      { x: 10, z: -22, size: 1.2 },
      { x: -11, z: -32, size: 1.8 },
      { x: 9, z: -44, size: 1.4 },
      { x: -13, z: -55, size: 1.6 }
    ];

    rubblePositions.forEach(function(pos) {
      var rock = new THREE.Mesh(
        new THREE.BoxGeometry(pos.size, pos.size * 0.7, pos.size),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
      );
      rock.position.set(pos.x, pos.size * 0.35, pos.z);
      rock.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.2);
      scene.add(rock);
      rubble.push(rock);
    });

    var wallSegments = [
      { x: -14, z: -20 },
      { x: -14, z: -35 },
      { x: 12, z: -25 },
      { x: 12, z: -45 }
    ];

    wallSegments.forEach(function(pos) {
      var wallBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 3, 6),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );
      wallBlock.position.set(pos.x, 1.5, pos.z);
      scene.add(wallBlock);
      rubble.push(wallBlock);
    });
  }

  function buildTowers() {
    var towerPositions = [
      { x: -15, z: -10 },
      { x: 14, z: -40 }
    ];

    towerPositions.forEach(function(pos) {
      var base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
      );
      base.position.set(pos.x, 0.25, pos.z);

      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      pole.position.set(pos.x, 6, pos.z);

      var antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 3, 4),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      antenna.position.set(pos.x, 13, pos.z);
      antenna.rotation.z = Math.PI / 6;

      var group = new THREE.Group();
      group.add(base);
      group.add(pole);
      group.add(antenna);
      scene.add(group);
      towers.push(group);
    });
  }

  function update(delta) {
    time += delta;

    convoy.forEach(function(vehicle, index) {
      var offset = index * 0.5;
      vehicle.position.z = vehicle.userData.type === 'motorcycle' ?
        -35 + Math.sin(time * 0.3 + offset) * 2 :
        -20 - index * 7 + Math.sin(time * 0.2 + offset) * 1.5;
      vehicle.rotation.y += delta * 0.1;
    });

    if (drone) {
      drone.position.x = 8 + Math.sin(time * 0.4) * 3;
      drone.position.z = -30 + Math.cos(time * 0.3) * 5;
      drone.position.y = 15 + Math.sin(time * 0.5) * 2;
      drone.rotation.y += delta * 0.3;

      var children = drone.children;
      for (var i = 0; i < children.length; i++) {
        if (i > 0) {
          children[i].rotation.x += delta * 15;
          children[i].rotation.z += delta * 12;
        }
      }
    }

    barriers.forEach(function(barrier, index) {
      barrier.rotation.y = Math.sin(time * 0.1 + index) * 0.1;
    });

    towers.forEach(function(tower, index) {
      tower.children[2].rotation.z = Math.sin(time * 0.6 + index * Math.PI) * 0.3;
    });
  }

  function reset() {
    time = 0;
    convoy.forEach(function(vehicle) {
      vehicle.rotation.set(0, 0, 0);
    });
    if (drone) {
      drone.rotation.set(0, 0, 0);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
