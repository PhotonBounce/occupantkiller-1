window.AuchterarderFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var golfBalls = [];
  var helipads = [];

  function createhotel(scene) {
    var geometry = new THREE.BoxGeometry(40, 14, 24);
    var material = new THREE.MeshLambertMaterial({ color: 0xCCBB99 });
    var hotel = new THREE.Mesh(geometry, material);
    hotel.position.set(0, 7, 0);
    scene.add(hotel);
    objects.push(hotel);
  }

  function createwings(scene) {
    for (var i = 0; i < 2; i++) {
      var geometry = new THREE.BoxGeometry(20, 10, 16);
      var material = new THREE.MeshLambertMaterial({ color: 0xCCBB99 });
      var wing = new THREE.Mesh(geometry, material);
      var xPos = (i === 0) ? -25 : 25;
      wing.position.set(xPos, 5, 0);
      scene.add(wing);
      objects.push(wing);
    }
  }

  function createbunkers(scene) {
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var radius = 35;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var geometry = new THREE.SphereGeometry(4, 8, 8);
      var material = new THREE.MeshLambertMaterial({ color: 0xCCBB88 });
      var bunker = new THREE.Mesh(geometry, material);
      bunker.position.set(x, 2, z);
      scene.add(bunker);
      objects.push(bunker);

      var ringGeometry = new THREE.CylinderGeometry(5, 4.5, 0.8, 12);
      var ringMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
      var sandbagRing = new THREE.Mesh(ringGeometry, ringMaterial);
      sandbagRing.position.set(x, 0.4, z);
      scene.add(sandbagRing);
      objects.push(sandbagRing);
    }
  }

  function createfence(scene) {
    var fencePoints = [
      new THREE.Vector3(-50, 0.5, -40),
      new THREE.Vector3(50, 0.5, -40),
      new THREE.Vector3(50, 0.5, 40),
      new THREE.Vector3(-50, 0.5, 40),
      new THREE.Vector3(-50, 0.5, -40)
    ];

    var fenceGeometry = new THREE.BufferGeometry().setFromPoints(fencePoints);
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    var fenceLine = new THREE.LineSegments(fenceGeometry, lineMaterial);
    scene.add(fenceLine);
    objects.push(fenceLine);

    for (var i = 0; i < fencePoints.length - 1; i++) {
      var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
      var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      var midpoint = new THREE.Vector3();
      midpoint.addVectors(fencePoints[i], fencePoints[i + 1]);
      midpoint.multiplyScalar(0.5);
      pole.position.copy(midpoint);
      pole.position.y = 1;
      scene.add(pole);
      objects.push(pole);
    }
  }

  function createtower(scene) {
    var geometry = new THREE.BoxGeometry(8, 14, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(35, 7, -35);
    scene.add(tower);
    objects.push(tower);
  }

  function createhelipad(scene) {
    var geometry = new THREE.BoxGeometry(14, 0.3, 14);
    var material = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var pad = new THREE.Mesh(geometry, material);
    pad.position.set(-40, 0.15, -40);
    scene.add(pad);
    objects.push(pad);
    helipads.push(pad);

    var hGeometry = new THREE.BoxGeometry(2, 0.2, 1);
    var hMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var hMark = new THREE.Mesh(hGeometry, hMaterial);
    hMark.position.set(-40, 0.3, -40);
    scene.add(hMark);
    objects.push(hMark);
  }

  function creategolfballs(scene) {
    var positions = [
      { x: 20, z: 20 },
      { x: -20, z: 20 },
      { x: 20, z: -20 },
      { x: -20, z: -20 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.SphereGeometry(0.4, 8, 8);
      var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var ball = new THREE.Mesh(geometry, material);
      ball.position.set(positions[i].x, 0.5, positions[i].z);
      ball.velocity = new THREE.Vector3(0, 0, 0);
      ball.bouncePhase = i * 0.5;
      scene.add(ball);
      objects.push(ball);
      golfBalls.push(ball);
    }
  }

  function createnets(scene) {
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var radius = 45;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
      var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(x, 4, z);
      scene.add(pole);
      objects.push(pole);

      var netPoints = [
        new THREE.Vector3(x, 8, z),
        new THREE.Vector3(x + 2, 6, z),
        new THREE.Vector3(x - 2, 6, z),
        new THREE.Vector3(x, 8, z)
      ];

      var netGeometry = new THREE.BufferGeometry().setFromPoints(netPoints);
      var netMaterial = new THREE.LineBasicMaterial({ color: 0x999999 });
      var netLine = new THREE.LineSegments(netGeometry, netMaterial);
      scene.add(netLine);
      objects.push(netLine);
    }
  }

  function createcars(scene) {
    var positions = [
      { x: -30, z: -50 },
      { x: -20, z: -50 },
      { x: -10, z: -50 },
      { x: 10, z: -50 },
      { x: 20, z: -50 },
      { x: 30, z: -50 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var carBody = new THREE.BoxGeometry(2, 1.2, 4);
      var carMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var car = new THREE.Mesh(carBody, carMaterial);
      car.position.set(positions[i].x, 0.6, positions[i].z);
      scene.add(car);
      objects.push(car);

      var cabinGeometry = new THREE.BoxGeometry(1.6, 1, 2);
      var cabin = new THREE.Mesh(cabinGeometry, carMaterial);
      cabin.position.set(positions[i].x, 1.2, positions[i].z - 0.5);
      scene.add(cabin);
      objects.push(cabin);
    }
  }

  function createlights(scene) {
    var entranceLight = new THREE.PointLight(0xFFCC66, 1.5);
    entranceLight.position.set(0, 10, 15);
    entranceLight.name = 'entranceLight';
    scene.add(entranceLight);
    lights.push(entranceLight);

    var perimeter = [
      { x: 40, z: 40 },
      { x: -40, z: 40 },
      { x: 40, z: -40 },
      { x: -40, z: -40 }
    ];

    for (var i = 0; i < perimeter.length; i++) {
      var securityLight = new THREE.PointLight(0xFFFFFF, 1.0);
      securityLight.position.set(perimeter[i].x, 8, perimeter[i].z);
      securityLight.name = 'securityLight' + i;
      scene.add(securityLight);
      lights.push(securityLight);
    }
  }

  function build(scene) {
    createhotel(scene);
    createwings(scene);
    createbunkers(scene);
    createfence(scene);
    createtower(scene);
    createhelipad(scene);
    creategolfballs(scene);
    createnets(scene);
    createcars(scene);
    createlights(scene);
  }

  function update(delta) {
    for (var i = 0; i < golfBalls.length; i++) {
      var ball = golfBalls[i];
      ball.bouncePhase += delta * 2;
      var bounceHeight = Math.abs(Math.sin(ball.bouncePhase)) * 0.3;
      var baseY = 0.5;
      ball.position.y = baseY + bounceHeight;
    }

    for (var j = 0; j < helipads.length; j++) {
      helipads[j].rotation.y += delta * 0.3;
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

    golfBalls = [];
    helipads = [];
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };

}());
