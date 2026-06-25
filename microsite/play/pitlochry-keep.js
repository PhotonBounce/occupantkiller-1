window.PitlochryKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var fishJumpers = [];

  var module = {};

  function initialize(scene) {
    // Highland Perthshire ambient lighting - warm afternoon
    var ambientLight = new THREE.AmbientLight(0xFFCC88, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Blair Atholl inspired keep tower - main structure
    var keepGeometry = new THREE.BoxGeometry(10, 16, 10);
    var keepMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCBB });
    var keepMesh = new THREE.Mesh(keepGeometry, keepMaterial);
    keepMesh.position.set(0, 8, 0);
    keepMesh.castShadow = true;
    keepMesh.receiveShadow = true;
    scene.add(keepMesh);
    objects.push(keepMesh);

    // Corner turrets - 4 cylinders
    var turretPositions = [
      [-5, 9, -5],
      [5, 9, -5],
      [-5, 9, 5],
      [5, 9, 5]
    ];

    for (var i = 0; i < turretPositions.length; i++) {
      var turretGeometry = new THREE.CylinderGeometry(2, 2, 18, 8);
      var turretMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCBB });
      var turretMesh = new THREE.Mesh(turretGeometry, turretMaterial);
      turretMesh.position.set(turretPositions[i][0], turretPositions[i][1], turretPositions[i][2]);
      turretMesh.castShadow = true;
      turretMesh.receiveShadow = true;
      scene.add(turretMesh);
      objects.push(turretMesh);
    }

    // River Tummel dam - concrete structure
    var damGeometry = new THREE.BoxGeometry(30, 10, 5);
    var damMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var damMesh = new THREE.Mesh(damGeometry, damMaterial);
    damMesh.position.set(20, 5, 0);
    damMesh.castShadow = true;
    damMesh.receiveShadow = true;
    scene.add(damMesh);
    objects.push(damMesh);

    // Fish ladder steps - series of 12 small boxes descending alongside dam
    for (var j = 0; j < 12; j++) {
      var stepGeometry = new THREE.BoxGeometry(3, 0.5, 2);
      var stepMaterial = new THREE.MeshLambertMaterial({ color: 0x666677 });
      var stepMesh = new THREE.Mesh(stepGeometry, stepMaterial);
      var stepHeight = 9 - (j * 0.8);
      var stepZ = -8 + (j * 0.6);
      stepMesh.position.set(10, stepHeight, stepZ);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      scene.add(stepMesh);
      objects.push(stepMesh);
    }

    // Power station - industrial structure
    var powerGeometry = new THREE.BoxGeometry(16, 8, 10);
    var powerMaterial = new THREE.MeshLambertMaterial({ color: 0x667788 });
    var powerMesh = new THREE.Mesh(powerGeometry, powerMaterial);
    powerMesh.position.set(-15, 4, -10);
    powerMesh.castShadow = true;
    powerMesh.receiveShadow = true;
    scene.add(powerMesh);
    objects.push(powerMesh);

    // Festival Theatre on hillside - curved arrangement
    var theatreGeometry = new THREE.BoxGeometry(20, 8, 12);
    var theatreMaterial = new THREE.MeshLambertMaterial({ color: 0x888899 });
    var theatreMesh = new THREE.Mesh(theatreGeometry, theatreMaterial);
    theatreMesh.position.set(-10, 4, 15);
    theatreMesh.castShadow = true;
    theatreMesh.receiveShadow = true;
    scene.add(theatreMesh);
    objects.push(theatreMesh);

    // Visitor centre checkpoint - militarized beige structure
    var centreGeometry = new THREE.BoxGeometry(8, 5, 6);
    var centreMaterial = new THREE.MeshLambertMaterial({ color: 0xBBBB99 });
    var centreMesh = new THREE.Mesh(centreGeometry, centreMaterial);
    centreMesh.position.set(15, 2.5, 8);
    centreMesh.castShadow = true;
    centreMesh.receiveShadow = true;
    scene.add(centreMesh);
    objects.push(centreMesh);

    // Tourist bus barriers - concrete blockers
    var barrierPositions = [
      [12, 0.5, 10],
      [18, 0.5, 10]
    ];

    for (var k = 0; k < barrierPositions.length; k++) {
      var barrierGeometry = new THREE.BoxGeometry(2, 1, 8);
      var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });
      var barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrierMesh.position.set(barrierPositions[k][0], barrierPositions[k][1], barrierPositions[k][2]);
      barrierMesh.castShadow = true;
      barrierMesh.receiveShadow = true;
      scene.add(barrierMesh);
      objects.push(barrierMesh);
    }

    // Castle floodlights - 4 white lights at corners
    var lightPositions = [
      [-8, 20, -8],
      [8, 20, -8],
      [-8, 20, 8],
      [8, 20, 8]
    ];

    for (var m = 0; m < lightPositions.length; m++) {
      var floodlight = new THREE.PointLight(0xFFFFFF, 1.0);
      floodlight.position.set(lightPositions[m][0], lightPositions[m][1], lightPositions[m][2]);
      floodlight.castShadow = true;
      scene.add(floodlight);
      lights.push(floodlight);
    }

    // Initialize fish jumpers for animation
    initializeFishJumpers(scene);
  }

  function initializeFishJumpers(scene) {
    for (var n = 0; n < 3; n++) {
      var fishGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var fishMaterial = new THREE.MeshLambertMaterial({ color: 0x4488FF });
      var fishMesh = new THREE.Mesh(fishGeometry, fishMaterial);
      fishMesh.position.set(10, 2, -8 + (n * 2));
      scene.add(fishMesh);
      objects.push(fishMesh);
      fishJumpers.push({
        mesh: fishMesh,
        baseY: 2,
        time: n * 1.5,
        lane: n
      });
    }
  }

  function update(delta) {
    for (var p = 0; p < fishJumpers.length; p++) {
      var jumper = fishJumpers[p];
      jumper.time += delta;
      var jumpCycle = 3.0;
      var t = (jumper.time % jumpCycle) / jumpCycle;
      var jumpHeight = Math.sin(t * Math.PI) * 2;
      jumper.mesh.position.y = jumper.baseY + jumpHeight;
      var laneZ = -8 + (jumper.lane * 0.6);
      jumper.mesh.position.z = laneZ + Math.sin(t * Math.PI * 2) * 0.2;
    }
  }

  function reset(scene) {
    for (var q = 0; q < objects.length; q++) {
      scene.remove(objects[q]);
    }
    objects = [];

    for (var r = 0; r < lights.length; r++) {
      scene.remove(lights[r]);
    }
    lights = [];

    fishJumpers = [];
  }

  module.initialize = initialize;
  module.update = update;
  module.reset = reset;

  return module;
}());
