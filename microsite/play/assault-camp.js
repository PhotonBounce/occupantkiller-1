window.AssaultCamp = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var particles = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    particles = [];

    buildCommandPost();
    buildAmmoSupply();
    buildMortarBattery();
    buildFieldHospital();
    buildCommsTruck();
    buildPersonnelCarriers();
    buildBriefingBoard();
    buildFenceLine();
  }

  function buildCommandPost() {
    var material = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });

    // Box walls
    var wall1 = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 0.5), material);
    wall1.position.set(-10, 1.5, 0);
    scene.add(wall1);
    objects.push(wall1);

    var wall2 = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 0.5), material);
    wall2.position.set(-10, 1.5, 10);
    scene.add(wall2);
    objects.push(wall2);

    var wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 10), material);
    wall3.position.set(-20, 1.5, 5);
    scene.add(wall3);
    objects.push(wall3);

    var wall4 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 10), material);
    wall4.position.set(0, 1.5, 5);
    scene.add(wall4);
    objects.push(wall4);

    // Angled roof (two boxes at angle)
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var roof1 = new THREE.Mesh(new THREE.BoxGeometry(21, 0.5, 6), roofMat);
    roof1.position.set(-10, 3.5, 2);
    roof1.rotation.z = 0.3;
    scene.add(roof1);
    objects.push(roof1);

    var roof2 = new THREE.Mesh(new THREE.BoxGeometry(21, 0.5, 6), roofMat);
    roof2.position.set(-10, 3.5, 8);
    roof2.rotation.z = -0.3;
    scene.add(roof2);
    objects.push(roof2);
  }

  function buildAmmoSupply() {
    var crateMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
    var baseX = 20;
    var baseZ = 0;

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var crate = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMat);
        crate.position.set(baseX + (i * 5), 2 + (j * 4.5), baseZ);
        scene.add(crate);
        objects.push(crate);
      }
    }
  }

  function buildMortarBattery() {
    var baseX = -30;
    var baseZ = 15;

    for (var i = 0; i < 3; i++) {
      // Base plate
      var basePlate = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x333333 }));
      basePlate.position.set(baseX + (i * 6), 0.25, baseZ);
      scene.add(basePlate);
      objects.push(basePlate);

      // Mortar tube
      var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
      tube.position.set(baseX + (i * 6), 2.5, baseZ);
      tube.rotation.z = 0.5;
      scene.add(tube);
      objects.push(tube);
    }
  }

  function buildFieldHospital() {
    var x = 10;
    var z = 25;

    // White tent box
    var tentMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var tent = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 8), tentMat);
    tent.position.set(x, 2, z);
    scene.add(tent);
    objects.push(tent);

    // Red cross on roof using LineSegments
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array([
      5, 4.2, 0, -5, 4.2, 0,
      0, 4.2, -4, 0, 4.2, 4
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var line = new THREE.LineSegments(geometry,
      new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 }));
    line.position.set(x, 0, z);
    scene.add(line);
    objects.push(line);
  }

  function buildCommsTruck() {
    var x = -15;
    var z = 25;

    // Truck body
    var truck = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 10),
      new THREE.MeshStandardMaterial({ color: 0x556b2f }));
    truck.position.set(x, 1.5, z);
    scene.add(truck);
    objects.push(truck);

    // Satellite dish (sphere on top)
    var dish = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    dish.position.set(x, 4, z);
    scene.add(dish);
    objects.push(dish);

    // Antenna pole
    var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x666666 }));
    antenna.position.set(x + 2, 3.5, z);
    scene.add(antenna);
    objects.push(antenna);
  }

  function buildPersonnelCarriers() {
    var basePosX = 30;
    var basePosZ = 5;
    var mat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a });

    for (var i = 0; i < 4; i++) {
      // Vehicle body
      var body = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 8), mat);
      body.position.set(basePosX, 1.25, basePosZ + (i * 12));
      scene.add(body);
      objects.push(body);

      // Turret (cone on top)
      var turret = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a3a1a }));
      turret.position.set(basePosX, 2.8, basePosZ + (i * 12));
      scene.add(turret);
      objects.push(turret);
    }
  }

  function buildBriefingBoard() {
    var x = 0;
    var z = -15;

    // Board stand (two vertical boxes)
    var standMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
    var stand1 = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), standMat);
    stand1.position.set(x - 2, 2, z);
    scene.add(stand1);
    objects.push(stand1);

    var stand2 = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), standMat);
    stand2.position.set(x + 2, 2, z);
    scene.add(stand2);
    objects.push(stand2);

    // Board face (tall thin box)
    var board = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xd4a574 }));
    board.position.set(x, 2.2, z);
    scene.add(board);
    objects.push(board);

    // Grid lines on board using LineSegments
    var gridGeo = new THREE.BufferGeometry();
    var gridPositions = new Float32Array();
    var idx = 0;

    for (var i = 0; i <= 4; i++) {
      gridPositions[idx++] = -3 + (i * 1.5);
      gridPositions[idx++] = 0.5;
      gridPositions[idx++] = -0.2;
      gridPositions[idx++] = -3 + (i * 1.5);
      gridPositions[idx++] = 3.5;
      gridPositions[idx++] = -0.2;
    }

    for (var j = 0; j <= 3; j++) {
      gridPositions[idx++] = -3;
      gridPositions[idx++] = 0.5 + (j * 1.0);
      gridPositions[idx++] = -0.2;
      gridPositions[idx++] = 3;
      gridPositions[idx++] = 0.5 + (j * 1.0);
      gridPositions[idx++] = -0.2;
    }

    gridGeo.setAttribute('position', new THREE.BufferAttribute(gridPositions, 3));
    var gridLines = new THREE.LineSegments(gridGeo,
      new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 }));
    gridLines.position.set(x, 0, z);
    scene.add(gridLines);
    objects.push(gridLines);
  }

  function buildFenceLine() {
    var mat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });

    for (var i = 0; i < 8; i++) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), mat);
      post.position.set(-50 + (i * 15), 1.5, -30);
      scene.add(post);
      objects.push(post);
    }
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].rotation) {
        if (i % 7 === 0) {
          objects[i].rotation.y += delta * 0.3;
        }
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    particles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
