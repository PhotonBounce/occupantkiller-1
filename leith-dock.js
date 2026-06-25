window.LeithDock = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createRoyalYacht(scene) {
    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(60, 8, 14),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    hull.position.set(0, 4, 0);
    scene.add(hull);
    objects.push(hull);

    for (var i = 0; i < 8; i++) {
      var stripe = new THREE.Mesh(
        new THREE.BoxGeometry(60, 0.8, 1),
        new THREE.MeshLambertMaterial({ color: 0x003366 })
      );
      stripe.position.set(0, 4 + (i * 0.9), -6);
      scene.add(stripe);
      objects.push(stripe);
    }
  }

  function createOceanTerminal(scene) {
    var terminal = new THREE.Mesh(
      new THREE.BoxGeometry(40, 8, 20),
      new THREE.MeshLambertMaterial({ color: 0x778877 })
    );
    terminal.position.set(55, 4, 0);
    scene.add(terminal);
    objects.push(terminal);

    for (var i = 0; i < 4; i++) {
      var barrier = new THREE.Mesh(
        new THREE.BoxGeometry(1, 3, 20),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      barrier.position.set(35 + (i * 3), 1.5, 0);
      scene.add(barrier);
      objects.push(barrier);
    }
  }

  function createDockWalls(scene) {
    var positions = [
      [0, 3, -50],
      [0, 3, 50],
      [-50, 3, 0],
      [50, 3, 0]
    ];

    for (var i = 0; i < positions.length; i++) {
      var wall = new THREE.Mesh(
        new THREE.BoxGeometry(2, 6, 40),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      );
      wall.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(wall);
      objects.push(wall);
    }
  }

  function createTowerCrane(scene) {
    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 2, 16),
      new THREE.MeshLambertMaterial({ color: 0xFFCC00 })
    );
    base.position.set(-30, 1, 30);
    scene.add(base);
    objects.push(base);

    var tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 20, 16),
      new THREE.MeshLambertMaterial({ color: 0xFFCC00 })
    );
    tower.position.set(-30, 11, 30);
    scene.add(tower);
    objects.push(tower);

    var arm = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0xFFCC00 })
    );
    arm.position.set(-30, 20, 30);
    arm.userData.craneArm = true;
    scene.add(arm);
    objects.push(arm);
  }

  function createCargoRamp(scene) {
    var ramp = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.5, 12),
      new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    ramp.position.set(20, 0.25, -40);
    ramp.rotation.z = 0.3;
    scene.add(ramp);
    objects.push(ramp);
  }

  function createContainers(scene) {
    var colors = [0xCC2222, 0x22CC22, 0x2222CC];
    var containerCount = 0;

    for (var x = -35; x < -15; x += 8) {
      for (var z = -25; z < -5; z += 8) {
        var stacks = Math.floor(Math.random() * 2) + 1;
        for (var s = 0; s < stacks; s++) {
          var color = colors[containerCount % colors.length];
          var container = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 4),
            new THREE.MeshLambertMaterial({ color: color })
          );
          container.position.set(x, 2 + (s * 4), z);
          scene.add(container);
          objects.push(container);
          containerCount++;
        }
      }
    }
  }

  function createFrigate(scene) {
    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(30, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0x668866 })
    );
    hull.position.set(30, 2, 25);
    scene.add(hull);
    objects.push(hull);

    var mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 12, 12),
      new THREE.MeshLambertMaterial({ color: 0x668866 })
    );
    mast.position.set(30, 8, 25);
    scene.add(mast);
    objects.push(mast);
  }

  function createGatehouse(scene) {
    var house = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5, 6),
      new THREE.MeshLambertMaterial({ color: 0x888877 })
    );
    house.position.set(-40, 2.5, -45);
    scene.add(house);
    objects.push(house);

    var barrier = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xFF0000 })
    );
    barrier.position.set(-35, 2, -48);
    scene.add(barrier);
    objects.push(barrier);
  }

  function createLights(scene) {
    var ambient = new THREE.AmbientLight(0x8899AA, 0.7);
    scene.add(ambient);
    lights.push(ambient);

    var floodlightPositions = [
      [-30, 25, 30],
      [30, 25, -40],
      [50, 20, 50],
      [-45, 20, 45]
    ];

    for (var i = 0; i < floodlightPositions.length; i++) {
      var light = new THREE.PointLight(0xFFFFFF, 1.5, 100);
      light.position.set(
        floodlightPositions[i][0],
        floodlightPositions[i][1],
        floodlightPositions[i][2]
      );
      scene.add(light);
      lights.push(light);
    }
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.craneArm) {
        objects[i].rotation.y += delta * 0.5;
      }
    }
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights = [];
  }

  function init(scene) {
    createRoyalYacht(scene);
    createOceanTerminal(scene);
    createDockWalls(scene);
    createTowerCrane(scene);
    createCargoRamp(scene);
    createContainers(scene);
    createFrigate(scene);
    createGatehouse(scene);
    createLights(scene);
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
