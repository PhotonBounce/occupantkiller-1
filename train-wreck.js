window.TrainWreck = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var particles = [];

  function buildLocomotive() {
    var group = new THREE.Group();

    var cabGeometry = new THREE.BoxGeometry(2, 2.5, 4);
    var cabMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6 });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.y = 1.5;
    cab.position.z = 0;
    group.add(cab);

    var boilerGeometry = new THREE.CylinderGeometry(1.2, 1.2, 6, 16);
    var boilerMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 });
    var boiler = new THREE.Mesh(boilerGeometry, boilerMaterial);
    boiler.rotation.z = Math.PI / 2;
    boiler.position.x = 0;
    boiler.position.y = 1;
    group.add(boiler);

    var cowcatcherGeometry = new THREE.ConeGeometry(0.8, 2, 8);
    var cowcatcherMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    var cowcatcher = new THREE.Mesh(cowcatcherGeometry, cowcatcherMaterial);
    cowcatcher.rotation.z = Math.PI / 2;
    cowcatcher.position.z = 4;
    cowcatcher.position.y = 0.5;
    group.add(cowcatcher);

    return group;
  }

  function buildBoxcar() {
    var geometry = new THREE.BoxGeometry(2.5, 2.5, 8);
    var material = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 });
    return new THREE.Mesh(geometry, material);
  }

  function buildTankercar() {
    var group = new THREE.Group();

    var cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 9, 16);
    var cylinderMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 0.4,
      metalness: 0.5
    });
    var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.rotation.z = Math.PI / 2;
    group.add(cylinder);

    return group;
  }

  function buildBridge() {
    var group = new THREE.Group();

    var box1Geometry = new THREE.BoxGeometry(1.5, 1.5, 8);
    var boxMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.3 });
    var box1 = new THREE.Mesh(box1Geometry, boxMaterial);
    box1.position.set(-3, 2, 0);
    box1.rotation.z = 0.3;
    group.add(box1);

    var box2 = new THREE.Mesh(box1Geometry, boxMaterial);
    box2.position.set(3, 2.5, 0);
    box2.rotation.z = -0.4;
    group.add(box2);

    var points = [
      new THREE.Vector3(-4, 3, -2),
      new THREE.Vector3(4, 3, -2),
      new THREE.Vector3(-4, 1, 2),
      new THREE.Vector3(4, 1, 2)
    ];

    var cable1Points = [points[0], points[2]];
    var cable1Geometry = new THREE.BufferGeometry().setFromPoints(cable1Points);
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    var cable1 = new THREE.LineSegments(cable1Geometry, lineMaterial);
    group.add(cable1);

    var cable2Points = [points[1], points[3]];
    var cable2Geometry = new THREE.BufferGeometry().setFromPoints(cable2Points);
    var cable2 = new THREE.LineSegments(cable2Geometry, lineMaterial);
    group.add(cable2);

    return group;
  }

  function buildRailTracks() {
    var group = new THREE.Group();

    var trackMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });

    var leftRailPoints = [
      new THREE.Vector3(-2, 0.1, -30),
      new THREE.Vector3(-2, 0.1, 30)
    ];
    var leftRailGeometry = new THREE.BufferGeometry().setFromPoints(leftRailPoints);
    var leftRail = new THREE.LineSegments(leftRailGeometry, trackMaterial);
    group.add(leftRail);

    var rightRailPoints = [
      new THREE.Vector3(2, 0.1, -30),
      new THREE.Vector3(2, 0.1, 30)
    ];
    var rightRailGeometry = new THREE.BufferGeometry().setFromPoints(rightRailPoints);
    var rightRail = new THREE.LineSegments(rightRailGeometry, trackMaterial);
    group.add(rightRail);

    var tierPoints = [];
    for (var i = -30; i <= 30; i += 3) {
      tierPoints.push(new THREE.Vector3(-2, 0.1, i));
      tierPoints.push(new THREE.Vector3(2, 0.1, i));
    }
    var tieGeometry = new THREE.BufferGeometry().setFromPoints(tierPoints);
    var ties = new THREE.LineSegments(tieGeometry, trackMaterial);
    group.add(ties);

    return group;
  }

  function buildStation() {
    var group = new THREE.Group();

    var wallGeometry = new THREE.BoxGeometry(6, 3, 4);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xa0826d });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(-15, 1.5, 0);
    group.add(wall);

    var roofGeometry = new THREE.ConeGeometry(4, 1.5, 6);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-15, 4.5, 0);
    group.add(roof);

    return group;
  }

  function buildCargoBoxes() {
    var group = new THREE.Group();

    var positions = [
      { x: 5, y: 0.5, z: -8 },
      { x: 8, y: 0.5, z: -5 },
      { x: -5, y: 0.5, z: 10 },
      { x: 6, y: 1.5, z: 2 }
    ];

    var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    var boxMaterial = new THREE.MeshStandardMaterial({ color: 0x666600 });

    for (var i = 0; i < positions.length; i++) {
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.copy(positions[i]);
      group.add(box);
    }

    return group;
  }

  function buildWreckageAndFire() {
    var group = new THREE.Group();

    var fireGeometry = new THREE.BoxGeometry(2, 3, 2);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 0.8
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(3, 1.5, 5);
    group.add(fire);

    return group;
  }

  function createParticleSystem() {
    var geometry = new THREE.BufferGeometry();
    var positions = [];

    for (var i = 0; i < 100; i++) {
      positions.push(
        (Math.random() - 0.5) * 20,
        Math.random() * 5,
        (Math.random() - 0.5) * 20
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

    var material = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.2,
      sizeAttenuation: true
    });

    var points = new THREE.Points(geometry, material);
    return points;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    particles = [];

    var locomotive = buildLocomotive();
    locomotive.position.set(0, 0, 0);
    scene.add(locomotive);
    objects.push(locomotive);

    var car1 = buildBoxcar();
    car1.position.set(0, 1, -10);
    car1.rotation.z = 0.5;
    scene.add(car1);
    objects.push(car1);

    var car2 = buildBoxcar();
    car2.position.set(-2, 1.5, -18);
    car2.rotation.z = -0.3;
    scene.add(car2);
    objects.push(car2);

    var tanker = buildTankercar();
    tanker.position.set(3, 1.2, -28);
    tanker.rotation.x = 0.2;
    scene.add(tanker);
    objects.push(tanker);

    var tracks = buildRailTracks();
    scene.add(tracks);
    objects.push(tracks);

    var bridge = buildBridge();
    bridge.position.set(-5, 0, 15);
    scene.add(bridge);
    objects.push(bridge);

    var station = buildStation();
    scene.add(station);
    objects.push(station);

    var cargo = buildCargoBoxes();
    scene.add(cargo);
    objects.push(cargo);

    var wreckage = buildWreckageAndFire();
    scene.add(wreckage);
    objects.push(wreckage);

    var particleSystem = createParticleSystem();
    particleSystem.position.set(3, 2, 5);
    scene.add(particleSystem);
    particles.push(particleSystem);
  }

  function update(delta) {
    for (var i = 0; i < particles.length; i++) {
      particles[i].rotation.x += delta * 0.5;
      particles[i].rotation.y += delta * 0.3;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < particles.length; j++) {
      scene.remove(particles[j]);
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
