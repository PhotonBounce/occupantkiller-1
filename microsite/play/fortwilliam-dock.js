window.FortWilliamDock = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addLockGates(scene) {
    var geometry = new THREE.BoxGeometry(2, 8, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x333344 });

    var gate1 = new THREE.Mesh(geometry, material);
    gate1.position.set(-5, 4, 0);
    scene.add(gate1);
    objects.push(gate1);

    var gate2 = new THREE.Mesh(geometry, material);
    gate2.position.set(5, 4, 0);
    scene.add(gate2);
    objects.push(gate2);
  }

  function addLockChamberWalls(scene) {
    var geometry = new THREE.BoxGeometry(2, 6, 40);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var wall1 = new THREE.Mesh(geometry, material);
    wall1.position.set(-6, 3, 0);
    scene.add(wall1);
    objects.push(wall1);

    var wall2 = new THREE.Mesh(geometry, material);
    wall2.position.set(6, 3, 0);
    scene.add(wall2);
    objects.push(wall2);
  }

  function addControlTower(scene) {
    var mainGeometry = new THREE.BoxGeometry(8, 12, 6);
    var mainMaterial = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var tower = new THREE.Mesh(mainGeometry, mainMaterial);
    tower.position.set(0, 6, -25);
    scene.add(tower);
    objects.push(tower);

    var glassGeometry = new THREE.BoxGeometry(3, 6, 1);
    var glassMaterial = new THREE.MeshLambertMaterial({ color: 0x88AACC });
    var glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(0, 8, -28.5);
    scene.add(glass);
    objects.push(glass);
  }

  function addNeptunesStaircase(scene) {
    var geometry = new THREE.BoxGeometry(2, 5, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x333344 });

    var zOffsets = [-60, -66, -72];
    var yOffsets = [5, 3, 1];

    for (var i = 0; i < zOffsets.length; i++) {
      var leftGate = new THREE.Mesh(geometry, material);
      leftGate.position.set(-4, yOffsets[i], zOffsets[i]);
      scene.add(leftGate);
      objects.push(leftGate);

      var rightGate = new THREE.Mesh(geometry, material);
      rightGate.position.set(4, yOffsets[i], zOffsets[i]);
      scene.add(rightGate);
      objects.push(rightGate);
    }
  }

  function addPaperMill(scene) {
    var geometry = new THREE.BoxGeometry(20, 10, 15);
    var material = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
    var mill = new THREE.Mesh(geometry, material);
    mill.position.set(35, 5, -40);
    scene.add(mill);
    objects.push(mill);

    var chimneyGeometry = new THREE.CylinderGeometry(1, 1, 20, 16);
    var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var chimney1 = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney1.position.set(30, 15, -35);
    scene.add(chimney1);
    objects.push(chimney1);

    var chimney2 = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney2.position.set(40, 15, -45);
    scene.add(chimney2);
    objects.push(chimney2);
  }

  function addNeptuneRoundabout(scene) {
    var geometry = new THREE.CylinderGeometry(4, 4, 0.5, 32);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var base = new THREE.Mesh(geometry, material);
    base.position.set(-30, 0.25, -50);
    scene.add(base);
    objects.push(base);
  }

  function addNavalVessels(scene) {
    var geometry = new THREE.BoxGeometry(12, 2, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x778877 });

    var vessel1 = new THREE.Mesh(geometry, material);
    vessel1.position.set(-15, 1, 10);
    scene.add(vessel1);
    objects.push(vessel1);

    var vessel2 = new THREE.Mesh(geometry, material);
    vessel2.position.set(0, 1, 15);
    scene.add(vessel2);
    objects.push(vessel2);

    var vessel3 = new THREE.Mesh(geometry, material);
    vessel3.position.set(15, 1, 8);
    scene.add(vessel3);
    objects.push(vessel3);
  }

  function addContainerCrane(scene) {
    var verticalGeometry = new THREE.CylinderGeometry(1, 1, 16, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
    var vertical = new THREE.Mesh(verticalGeometry, material);
    vertical.position.set(25, 8, -15);
    vertical.name = 'craneVertical';
    scene.add(vertical);
    objects.push(vertical);

    var horizontalGeometry = new THREE.BoxGeometry(16, 1, 1);
    var horizontal = new THREE.Mesh(horizontalGeometry, material);
    horizontal.position.set(35, 15.5, -15);
    horizontal.name = 'craneHorizontal';
    scene.add(horizontal);
    objects.push(horizontal);
  }

  function addSecurityPerimeter(scene) {
    var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var positions = [
      [-50, 2, -80],
      [50, 2, -80],
      [50, 2, 30],
      [-50, 2, 30]
    ];

    for (var i = 0; i < positions.length; i++) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(post);
      objects.push(post);
    }

    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      -50, 2, -80,
      50, 2, -80,
      50, 2, -80,
      50, 2, 30,
      50, 2, 30,
      -50, 2, 30,
      -50, 2, 30,
      -50, 2, -80
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));

    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
    objects.push(wire);
  }

  function addFloodlights(scene) {
    var positions = [
      [-40, 15, -60],
      [40, 15, -60],
      [-40, 15, 20],
      [40, 15, 20]
    ];

    for (var i = 0; i < positions.length; i++) {
      var light = new THREE.PointLight(0xFFFFFF, 1.5, 100);
      light.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(light);
      lights.push(light);
    }
  }

  var Module = {};

  Module.init = function(scene) {
    addLockGates(scene);
    addLockChamberWalls(scene);
    addControlTower(scene);
    addNeptunesStaircase(scene);
    addPaperMill(scene);
    addNeptuneRoundabout(scene);
    addNavalVessels(scene);
    addContainerCrane(scene);
    addSecurityPerimeter(scene);
    addFloodlights(scene);
  };

  Module.update = function(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name === 'craneHorizontal') {
        objects[i].rotation.z += delta * 0.3;
      }
    }
  };

  Module.reset = function(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    lights = [];
  };

  Module.getObjects = function() {
    return objects;
  };

  Module.getLights = function() {
    return lights;
  };

  return Module;
}());
