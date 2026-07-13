window.ForgottenLab = (function() {
  'use strict';

  var scene;
  var camera;
  var centrifuges = [];
  var oscilloscopes = [];
  var specimenJars = [];
  var magneticField;
  var acceleratorRing;
  var countdownDisplay;
  var time = 0;
  var rotationSpeed = 2.0;

  function buildWalls() {
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });

    var floorGeom = new THREE.BoxGeometry(100, 0.5, 100);
    var floor = new THREE.Mesh(floorGeom, floorMaterial);
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    var northWall = new THREE.Mesh(new THREE.BoxGeometry(100, 30, 0.5), wallMaterial);
    northWall.position.set(0, 15, -50);
    northWall.receiveShadow = true;
    scene.add(northWall);

    var southWall = new THREE.Mesh(new THREE.BoxGeometry(100, 30, 0.5), wallMaterial);
    southWall.position.set(0, 15, 50);
    scene.add(southWall);

    var eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 30, 100), wallMaterial);
    eastWall.position.set(50, 15, 0);
    scene.add(eastWall);

    var westWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 30, 100), wallMaterial);
    westWall.position.set(-50, 15, 0);
    scene.add(westWall);
  }

  function buildCentrifuges() {
    var positions = [
      [-20, 1.5, -20],
      [20, 1.5, -15],
      [0, 1.5, 10]
    ];

    positions.forEach(function(pos) {
      var baseGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
      var baseMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.position.set(pos[0], pos[1], pos[2]);
      scene.add(base);

      var spinnerGeom = new THREE.CylinderGeometry(1, 0.8, 2, 16);
      var spinnerMat = new THREE.MeshPhongMaterial({ color: 0xaa6600 });
      var spinner = new THREE.Mesh(spinnerGeom, spinnerMat);
      spinner.position.set(pos[0], pos[1] + 1.5, pos[2]);
      spinner.castShadow = true;
      scene.add(spinner);

      centrifuges.push({
        mesh: spinner,
        speed: rotationSpeed + Math.random() * 0.5
      });
    });
  }

  function buildOscilloscopes() {
    var benchMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var screenMat = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x008800
    });

    var positions = [
      [-25, 1.2, 25],
      [15, 1.2, 30],
      [35, 1.2, -30]
    ];

    positions.forEach(function(pos) {
      var benchGeom = new THREE.BoxGeometry(4, 0.3, 3);
      var bench = new THREE.Mesh(benchGeom, benchMat);
      bench.position.set(pos[0], pos[1], pos[2]);
      scene.add(bench);

      var screenGeom = new THREE.BoxGeometry(2, 1.5, 0.1);
      var screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.set(pos[0], pos[1] + 1.2, pos[2]);
      screen.castShadow = true;
      scene.add(screen);

      oscilloscopes.push({
        mesh: screen,
        pulsePhase: Math.random() * Math.PI * 2
      });
    });
  }

  function buildSpecimenJars() {
    var positions = [
      [-30, 3, 0],
      [-25, 3, 5],
      [-35, 3, 3],
      [30, 3, -10],
      [35, 3, -5],
      [32, 3, 5]
    ];

    positions.forEach(function(pos) {
      var jarGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
      var jarMat = new THREE.MeshPhongMaterial({
        color: 0x4a4a7a,
        emissive: 0x222255,
        transparent: true,
        opacity: 0.6
      });
      var jar = new THREE.Mesh(jarGeom, jarMat);
      jar.position.set(pos[0], pos[1], pos[2]);
      jar.castShadow = true;
      scene.add(jar);
      specimenJars.push(jar);
    });
  }

  function buildAccelerator() {
    var ringRadius = 8;
    var ringSegments = 32;
    var points = [];

    for (var i = 0; i <= ringSegments; i++) {
      var angle = (i / ringSegments) * Math.PI * 2;
      var x = Math.cos(angle) * ringRadius;
      var z = Math.sin(angle) * ringRadius;
      points.push(new THREE.Vector3(x, 8, z));
    }

    var ringGeom = new THREE.BufferGeometry().setFromPoints(points);
    var ringMat = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 3 });
    acceleratorRing = new THREE.LineSegments(ringGeom, ringMat);
    scene.add(acceleratorRing);
  }

  function buildMagneticField() {
    var fieldGeom = new THREE.SphereGeometry(6, 16, 16);
    var fieldMat = new THREE.MeshPhongMaterial({
      color: 0x0066ff,
      emissive: 0x003366,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });
    magneticField = new THREE.Mesh(fieldGeom, fieldMat);
    magneticField.position.set(0, 8, 0);
    scene.add(magneticField);
  }

  function buildAgentFiles() {
    var fileMat = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var positions = [
      [-40, 2, 20],
      [40, 2, 15],
      [-10, 2, -40],
      [25, 2, -35]
    ];

    positions.forEach(function(pos) {
      var stackGeom = new THREE.BoxGeometry(1.5, 0.05, 1.2);
      for (var i = 0; i < 3; i++) {
        var file = new THREE.Mesh(stackGeom, fileMat);
        file.position.set(pos[0], pos[1] + i * 0.06, pos[2]);
        scene.add(file);
      }
    });
  }

  function buildCountdown() {
    var coneGeom = new THREE.ConeGeometry(0.8, 1.5, 8);
    var coneMat = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x660000 });
    countdownDisplay = new THREE.Mesh(coneGeom, coneMat);
    countdownDisplay.position.set(0, 5, -45);
    countdownDisplay.castShadow = true;
    scene.add(countdownDisplay);
  }

  function buildLights() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    scene.add(directionalLight);

    var spotLight = new THREE.SpotLight(0x00ff00, 0.6);
    spotLight.position.set(-30, 15, 20);
    spotLight.target.position.set(-30, 0, 20);
    scene.add(spotLight);
    scene.add(spotLight.target);
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    time = 0;

    buildWalls();
    buildCentrifuges();
    buildOscilloscopes();
    buildSpecimenJars();
    buildAccelerator();
    buildMagneticField();
    buildAgentFiles();
    buildCountdown();
    buildLights();
  }

  function update(delta) {
    time += delta;

    centrifuges.forEach(function(centrifuge) {
      centrifuge.mesh.rotation.y += centrifuge.speed * delta;
    });

    oscilloscopes.forEach(function(osc) {
      var pulse = Math.sin(time * 3 + osc.pulsePhase) * 0.3;
      osc.mesh.material.emissive.setHex(0x008800 + Math.floor(pulse * 30) * 0x010000);
    });

    specimenJars.forEach(function(jar, index) {
      jar.position.y = 3 + Math.sin(time + index) * 0.1;
    });

    magneticField.rotation.x += 0.1 * delta;
    magneticField.rotation.z += 0.15 * delta;
    magneticField.scale.z = 1 + Math.sin(time * 0.5) * 0.2;

    if (acceleratorRing) {
      acceleratorRing.rotation.z += 0.3 * delta;
    }

    countdownDisplay.rotation.x += 0.5 * delta;
    countdownDisplay.material.emissive.setHex(0x660000 + Math.floor(Math.abs(Math.sin(time * 2)) * 120) * 0x010000);
  }

  function reset() {
    time = 0;
    centrifuges.forEach(function(centrifuge) {
      centrifuge.mesh.rotation.y = 0;
    });
    if (magneticField) {
      magneticField.rotation.x = 0;
      magneticField.rotation.z = 0;
      magneticField.scale.z = 1;
    }
    if (acceleratorRing) {
      acceleratorRing.rotation.z = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
