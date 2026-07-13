window.StormBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var towers = [];
  var lights = [];
  var time = 0;

  function buildWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.8 });
    var positions = [
      { x: 0, y: 5, z: -20, w: 50, h: 15, d: 2 },
      { x: 0, y: 5, z: 20, w: 50, h: 15, d: 2 },
      { x: -25, y: 5, z: 0, w: 2, h: 15, d: 40 },
      { x: 25, y: 5, z: 0, w: 2, h: 15, d: 40 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      var mesh = new THREE.Mesh(geometry, wallMaterial);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function buildTowers() {
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7 });
    var antennaGrey = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });

    var positions = [
      { x: -15, z: -15 },
      { x: 15, z: -15 },
      { x: -15, z: 15 },
      { x: 15, z: 15 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var baseGeometry = new THREE.CylinderGeometry(1.5, 2, 12, 8);
      var baseMesh = new THREE.Mesh(baseGeometry, towerMaterial);
      baseMesh.position.set(pos.x, 6, pos.z);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      scene.add(baseMesh);
      objects.push(baseMesh);

      var antennaGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
      var antennaMesh = new THREE.Mesh(antennaGeometry, antennaGrey);
      antennaMesh.position.set(pos.x, 14, pos.z);
      antennaMesh.castShadow = true;
      antennaMesh.userData = { baseX: pos.x, baseZ: pos.z };
      scene.add(antennaMesh);
      objects.push(antennaMesh);
      towers.push(antennaMesh);
    }
  }

  function buildHelipad() {
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    var wreckageMaterial = new THREE.MeshStandardMaterial({ color: 0x663333, roughness: 0.9 });

    var platformGeometry = new THREE.CylinderGeometry(8, 8, 0.5, 12);
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.25;
    platform.receiveShadow = true;
    scene.add(platform);
    objects.push(platform);

    var cockpitGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
    var cockpit = new THREE.Mesh(cockpitGeometry, wreckageMaterial);
    cockpit.position.set(1, 1.2, 2);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    scene.add(cockpit);
    objects.push(cockpit);

    var rotorGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 4);
    var rotor = new THREE.Mesh(rotorGeometry, wreckageMaterial);
    rotor.position.set(1.5, 3.5, 2);
    rotor.rotation.z = Math.PI / 4;
    rotor.castShadow = true;
    scene.add(rotor);
    objects.push(rotor);
  }

  function buildSandbags() {
    var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });

    var positions = [
      { x: -20, z: -15 },
      { x: -20, z: 15 },
      { x: 20, z: -15 },
      { x: 20, z: 15 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      for (var j = 0; j < 3; j++) {
        var geometry = new THREE.BoxGeometry(2, 1, 2);
        var mesh = new THREE.Mesh(geometry, sandbagMaterial);
        mesh.position.set(pos.x + j * 2.2, 0.5 + j * 1.1, pos.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
      }
    }
  }

  function buildLightningRods() {
    var rodMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
    var positions = [
      { x: -18, z: -18 },
      { x: 18, z: -18 },
      { x: 0, z: 18 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var rodGeometry = new THREE.CylinderGeometry(0.25, 0.25, 10, 6);
      var rod = new THREE.Mesh(rodGeometry, rodMaterial);
      rod.position.set(pos.x, 5, pos.z);
      rod.castShadow = true;
      scene.add(rod);
      objects.push(rod);

      var sphereGeometry = new THREE.SphereGeometry(0.6, 6, 6);
      var sphere = new THREE.Mesh(sphereGeometry, rodMaterial);
      sphere.position.set(pos.x, 10.5, pos.z);
      sphere.castShadow = true;
      scene.add(sphere);
      objects.push(sphere);
    }
  }

  function buildWeatherStation() {
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
    var basePosX = 22;
    var basePosZ = 10;

    var baseGeometry = new THREE.BoxGeometry(3, 0.5, 3);
    var base = new THREE.Mesh(baseGeometry, metalMaterial);
    base.position.set(basePosX, 0.25, basePosZ);
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);

    var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    var pole = new THREE.Mesh(poleGeometry, metalMaterial);
    pole.position.set(basePosX, 3, basePosZ);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    objects.push(pole);

    var domeGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var dome = new THREE.Mesh(domeGeometry, metalMaterial);
    dome.position.set(basePosX, 6.5, basePosZ);
    dome.castShadow = true;
    dome.receiveShadow = true;
    scene.add(dome);
    objects.push(dome);
  }

  function buildLights() {
    var stormLight = new THREE.PointLight(0x6699ff, 0.8, 60);
    stormLight.position.set(0, 20, 0);
    stormLight.castShadow = true;
    scene.add(stormLight);
    lights.push({ light: stormLight, baseIntensity: 0.8, frequency: 2.5 });

    var warningLight1 = new THREE.PointLight(0xff4444, 0.4, 40);
    warningLight1.position.set(-20, 8, -18);
    warningLight1.castShadow = true;
    scene.add(warningLight1);
    lights.push({ light: warningLight1, baseIntensity: 0.4, frequency: 3.2 });

    var warningLight2 = new THREE.PointLight(0xff4444, 0.4, 40);
    warningLight2.position.set(20, 8, 18);
    warningLight2.castShadow = true;
    scene.add(warningLight2);
    lights.push({ light: warningLight2, baseIntensity: 0.4, frequency: 3.8 });

    var ambientLight = new THREE.AmbientLight(0x333366, 0.6);
    scene.add(ambientLight);
    lights.push({ light: ambientLight, baseIntensity: 0.6, frequency: 0 });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    towers = [];
    lights = [];
    time = 0;

    buildWalls();
    buildTowers();
    buildHelipad();
    buildSandbags();
    buildLightningRods();
    buildWeatherStation();
    buildLights();
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < towers.length; i++) {
      var tower = towers[i];
      var sway = Math.sin(time * 1.2) * 0.08;
      var sway2 = Math.cos(time * 0.8) * 0.06;
      tower.rotation.z = sway;
      tower.rotation.x = sway2;
    }

    for (var j = 0; j < lights.length; j++) {
      var lightData = lights[j];
      if (lightData.frequency > 0) {
        var flicker = Math.abs(Math.sin(time * lightData.frequency * 3)) * 0.6 + 0.4;
        lightData.light.intensity = lightData.baseIntensity * flicker;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j].light);
    }
    objects = [];
    towers = [];
    lights = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
