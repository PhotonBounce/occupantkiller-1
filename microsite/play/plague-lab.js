window.PlagueLab = (function() {
  'use strict';

  var environmentObjects = [];
  var lights = [];
  var tanks = [];
  var alertLights = [];
  var pipes = [];
  var scene = null;

  function buildWalls(scene) {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.3, roughness: 0.8 });

    var leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 30), wallMaterial);
    leftWall.position.set(-15, 4, 0);
    scene.add(leftWall);
    environmentObjects.push(leftWall);

    var rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 30), wallMaterial);
    rightWall.position.set(15, 4, 0);
    scene.add(rightWall);
    environmentObjects.push(rightWall);

    var backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 1), wallMaterial);
    backWall.position.set(0, 4, -15);
    scene.add(backWall);
    environmentObjects.push(backWall);

    var frontWall = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 1), wallMaterial);
    frontWall.position.set(0, 4, 15);
    scene.add(frontWall);
    environmentObjects.push(frontWall);

    var floor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 30), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.7 }));
    floor.position.set(0, -0.25, 0);
    scene.add(floor);
    environmentObjects.push(floor);

    var ceiling = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 30), wallMaterial);
    ceiling.position.set(0, 8.25, 0);
    scene.add(ceiling);
    environmentObjects.push(ceiling);
  }

  function buildContainmentTanks(scene) {
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.8, roughness: 0.2, emissive: 0x00aa00 });
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.1 });

    for (var i = 0; i < 4; i++) {
      var tank = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 5, 32), tankMaterial);
      tank.position.set(-8 + i * 5.5, 2.5, -8);
      scene.add(tank);
      tanks.push(tank);
      environmentObjects.push(tank);

      var frame = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5.2, 8), frameMaterial);
      frame.position.set(-8 + i * 5.5, 2.5, -8);
      scene.add(frame);
      environmentObjects.push(frame);
    }

    for (var j = 0; j < 3; j++) {
      var bioreactor = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 2.5), tankMaterial);
      bioreactor.rotation.z = 0.3;
      bioreactor.position.set(-10 + j * 10, 2, 8);
      scene.add(bioreactor);
      tanks.push(bioreactor);
      environmentObjects.push(bioreactor);
    }
  }

  function buildAlertLights(scene) {
    var redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, metalness: 0.7, roughness: 0.3 });
    var yellowMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, metalness: 0.7, roughness: 0.3 });

    for (var i = 0; i < 8; i++) {
      var x = -12 + i * 3.5;
      var alert = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), i % 2 === 0 ? redMaterial : yellowMaterial);
      alert.position.set(x, 7.5, -14);
      scene.add(alert);
      alertLights.push({ mesh: alert, intensity: 0, phase: i * 0.4 });
      environmentObjects.push(alert);
    }
  }

  function buildPipes(scene) {
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 });

    for (var i = 0; i < 12; i++) {
      var pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 15, 16), pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-12 + i * 2, 7.2, -12 + Math.sin(i * 0.5) * 3);
      scene.add(pipe);
      pipes.push(pipe);
      environmentObjects.push(pipe);
    }

    for (var j = 0; j < 8; j++) {
      var verticalPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 6, 16), pipeMaterial);
      verticalPipe.position.set(-10 + j * 3, 4, 10);
      scene.add(verticalPipe);
      pipes.push(verticalPipe);
      environmentObjects.push(verticalPipe);
    }
  }

  function buildHazmatGear(scene) {
    var rubberMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.3, roughness: 0.9 });

    for (var i = 0; i < 5; i++) {
      var suit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.6), rubberMaterial);
      suit.rotation.z = Math.random() * 0.5 - 0.25;
      suit.position.set(-8 + i * 3.5, 0.5, 0 + Math.random() * 4 - 2);
      scene.add(suit);
      environmentObjects.push(suit);

      var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), rubberMaterial);
      helmet.position.set(-8 + i * 3.5, 1.8, 0 + Math.random() * 4 - 2);
      scene.add(helmet);
      environmentObjects.push(helmet);
    }
  }

  function buildContainmentDoors(scene) {
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
    var labelMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });

    for (var i = 0; i < 3; i++) {
      var door = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 0.3), doorMaterial);
      door.position.set(-10 + i * 10, 2.5, 14.8);
      scene.add(door);
      environmentObjects.push(door);

      var label = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 0.4), labelMaterial);
      label.position.set(-10 + i * 10, 3.5, 15.2);
      scene.add(label);
      environmentObjects.push(label);
    }
  }

  function buildSpecimenCones(scene) {
    var cryoMaterial = new THREE.MeshStandardMaterial({ color: 0x0099ff, metalness: 0.6, roughness: 0.3, emissive: 0x004488 });

    for (var i = 0; i < 6; i++) {
      var specimen = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 16), cryoMaterial);
      specimen.position.set(-12 + i * 4.5, 1.5, -12);
      scene.add(specimen);
      environmentObjects.push(specimen);
    }
  }

  function init(sceneRef, camera) {
    scene = sceneRef;
    environmentObjects = [];
    lights = [];
    tanks = [];
    alertLights = [];
    pipes = [];

    buildWalls(scene);
    buildContainmentTanks(scene);
    buildAlertLights(scene);
    buildPipes(scene);
    buildHazmatGear(scene);
    buildContainmentDoors(scene);
    buildSpecimenCones(scene);

    var ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var blueLight = new THREE.PointLight(0x0099ff, 0.8, 25);
    blueLight.position.set(-10, 5, -8);
    scene.add(blueLight);
    lights.push(blueLight);

    var redLight = new THREE.PointLight(0xff0000, 0.6, 20);
    redLight.position.set(10, 6, 0);
    scene.add(redLight);
    lights.push(redLight);

    var greenLight = new THREE.PointLight(0x00ff00, 0.5, 15);
    greenLight.position.set(0, 5, 10);
    scene.add(greenLight);
    lights.push(greenLight);
  }

  function update(delta) {
    for (var i = 0; i < tanks.length; i++) {
      var scale = 1 + Math.sin(Date.now() * 0.002 + i * 0.5) * 0.08;
      tanks[i].scale.set(scale, scale, scale);
    }

    for (var j = 0; j < alertLights.length; j++) {
      var light = alertLights[j];
      light.intensity = (Math.sin(Date.now() * 0.005 + light.phase) + 1) * 0.5;
      light.mesh.material.emissiveIntensity = light.intensity;
    }

    for (var k = 0; k < pipes.length; k++) {
      pipes[k].position.y += Math.sin(Date.now() * 0.001 + k) * 0.0005;
    }
  }

  function reset() {
    for (var i = 0; i < environmentObjects.length; i++) {
      scene.remove(environmentObjects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    environmentObjects = [];
    lights = [];
    tanks = [];
    alertLights = [];
    pipes = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
