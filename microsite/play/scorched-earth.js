window.ScorchedEarth = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    objects = [];
    animatedObjects = [];

    var ambientLight = new THREE.AmbientLight(0xFF6600, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFAAAA, 0.8);
    directionalLight.position.set(100, 80, 50);
    scene.add(directionalLight);

    buildScorchedBuildings();
    buildBurningVehicles();
    buildAshEmberFields();
    buildCharredForest();
    buildMagmaCracks();
    buildFireTornado();
    buildHeatShimmer();
    buildSurvivorBunker();
    buildOilDrumBonfires();
    buildMilitaryEquipment();
    buildDeadCitySkyline();
    buildFlamingBarricade();
    buildRadiationCloud();
    buildEnemyCamp();
  }

  function buildScorchedBuildings() {
    for (var i = 0; i < 5; i++) {
      var width = 15 + Math.random() * 10;
      var height = 20 + Math.random() * 15;
      var depth = 12 + Math.random() * 8;
      var geom = new THREE.BoxGeometry(width, height, depth);
      var mat = new THREE.MeshStandardMaterial({ color: 0x332211 });
      var mesh = new THREE.Mesh(geom, mat);
      var x = (Math.random() - 0.5) * 200;
      var z = (Math.random() - 0.5) * 200;
      mesh.position.set(x, height / 2, z);
      scene.add(mesh);
      objects.push(mesh);

      var crackCount = Math.floor(3 + Math.random() * 2);
      for (var j = 0; j < crackCount; j++) {
        var crackGeom = new THREE.BoxGeometry(2, 8 + Math.random() * 5, 0.3);
        var crackMat = new THREE.MeshStandardMaterial({ color: 0x110000, emissive: 0x110000 });
        var crackMesh = new THREE.Mesh(crackGeom, crackMat);
        crackMesh.position.set(
          x + (Math.random() - 0.5) * width,
          5 + Math.random() * (height - 10),
          z + (Math.random() - 0.5) * 2
        );
        scene.add(crackMesh);
        objects.push(crackMesh);
      }
    }
  }

  function buildBurningVehicles() {
    for (var i = 0; i < 4; i++) {
      var bodyGeom = new THREE.BoxGeometry(8, 4, 16);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x442211 });
      var bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      var x = (Math.random() - 0.5) * 180;
      var z = (Math.random() - 0.5) * 180;
      bodyMesh.position.set(x, 2, z);
      bodyMesh.rotation.y = Math.random() * Math.PI * 2;
      scene.add(bodyMesh);
      objects.push(bodyMesh);

      var fireGeom = new THREE.SphereGeometry(5, 8, 8);
      var fireMat = new THREE.MeshStandardMaterial({
        color: 0xFF4400,
        emissive: 0xFF4400,
        emissiveIntensity: 0.8
      });
      var fireMesh = new THREE.Mesh(fireGeom, fireMat);
      fireMesh.position.set(x, 8, z);
      scene.add(fireMesh);
      objects.push(fireMesh);
      animatedObjects.push({
        mesh: fireMesh,
        type: 'vehicle_fire',
        baseIntensity: 0.8,
        intensity: 0.8
      });
    }
  }

  function buildAshEmberFields() {
    for (var i = 0; i < 80; i++) {
      var geom = new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 4, 4);
      var mat = new THREE.MeshStandardMaterial({
        color: 0xFF3300,
        emissive: 0xFF3300,
        emissiveIntensity: 0.6
      });
      var mesh = new THREE.Mesh(geom, mat);
      var x = (Math.random() - 0.5) * 250;
      var y = Math.random() * 40;
      var z = (Math.random() - 0.5) * 250;
      mesh.position.set(x, y, z);
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'ember',
        baseY: y,
        driftX: (Math.random() - 0.5) * 0.03,
        driftZ: (Math.random() - 0.5) * 0.03
      });
    }
  }

  function buildCharredForest() {
    for (var i = 0; i < 20; i++) {
      var trunkGeom = new THREE.CylinderGeometry(1.5, 2, 20, 8);
      var trunkMat = new THREE.MeshStandardMaterial({ color: 0x221100 });
      var trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
      var x = (Math.random() - 0.5) * 220;
      var z = (Math.random() - 0.5) * 220;
      trunkMesh.position.set(x, 10, z);
      trunkMesh.rotation.z = (Math.random() - 0.5) * 0.4;
      scene.add(trunkMesh);
      objects.push(trunkMesh);
    }
  }

  function buildMagmaCracks() {
    var groundLevel = -0.5;
    for (var i = 0; i < 15; i++) {
      var crackGeom = new THREE.BoxGeometry(2 + Math.random() * 2, 0.2, 30 + Math.random() * 20);
      var crackMat = new THREE.MeshStandardMaterial({
        color: 0xFF2200,
        emissive: 0xFF2200,
        emissiveIntensity: 0.7
      });
      var crackMesh = new THREE.Mesh(crackGeom, crackMat);
      var x = (Math.random() - 0.5) * 240;
      var z = (Math.random() - 0.5) * 240;
      crackMesh.position.set(x, groundLevel, z);
      crackMesh.rotation.y = Math.random() * Math.PI * 2;
      scene.add(crackMesh);
      objects.push(crackMesh);
      animatedObjects.push({
        mesh: crackMesh,
        type: 'magma_crack',
        baseIntensity: 0.7,
        intensity: 0.7
      });
    }
  }

  function buildFireTornado() {
    var tornadoGeom = new THREE.CylinderGeometry(8, 12, 40, 16);
    var tornadoMat = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF4400,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.7
    });
    var tornadoMesh = new THREE.Mesh(tornadoGeom, tornadoMat);
    tornadoMesh.position.set(-80, 20, -80);
    scene.add(tornadoMesh);
    objects.push(tornadoMesh);
    animatedObjects.push({
      mesh: tornadoMesh,
      type: 'tornado',
      baseHeight: 20,
      baseRotation: 0
    });
  }

  function buildHeatShimmer() {
    var shimmerGeom = new THREE.BoxGeometry(100, 15, 100);
    var shimmerMat = new THREE.MeshStandardMaterial({
      color: 0xFF8800,
      emissive: 0xFF8800,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.15
    });
    var shimmerMesh = new THREE.Mesh(shimmerGeom, shimmerMat);
    shimmerMesh.position.set(0, 5, 0);
    scene.add(shimmerMesh);
    objects.push(shimmerMesh);
    animatedObjects.push({
      mesh: shimmerMesh,
      type: 'shimmer',
      baseOpacity: 0.15
    });
  }

  function buildSurvivorBunker() {
    var entranceGeom = new THREE.BoxGeometry(12, 8, 4);
    var entranceMat = new THREE.MeshStandardMaterial({ color: 0x554433 });
    var entranceMesh = new THREE.Mesh(entranceGeom, entranceMat);
    entranceMesh.position.set(0, 4, 100);
    scene.add(entranceMesh);
    objects.push(entranceMesh);

    var doorGeom = new THREE.BoxGeometry(4, 5, 0.5);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
    var doorMesh = new THREE.Mesh(doorGeom, doorMat);
    doorMesh.position.set(0, 4, 102.3);
    scene.add(doorMesh);
    objects.push(doorMesh);
  }

  function buildOilDrumBonfires() {
    for (var i = 0; i < 3; i++) {
      var drumGeom = new THREE.CylinderGeometry(2, 2, 3, 12);
      var drumMat = new THREE.MeshStandardMaterial({ color: 0x553322 });
      var drumMesh = new THREE.Mesh(drumGeom, drumMat);
      var x = -60 + i * 40;
      var z = 60;
      drumMesh.position.set(x, 1.5, z);
      scene.add(drumMesh);
      objects.push(drumMesh);

      var flameGeom = new THREE.SphereGeometry(4, 10, 10);
      var flameMat = new THREE.MeshStandardMaterial({
        color: 0xFF3300,
        emissive: 0xFF3300,
        emissiveIntensity: 0.8
      });
      var flameMesh = new THREE.Mesh(flameGeom, flameMat);
      flameMesh.position.set(x, 6, z);
      scene.add(flameMesh);
      objects.push(flameMesh);
      animatedObjects.push({
        mesh: flameMesh,
        type: 'drum_flame',
        baseIntensity: 0.8,
        intensity: 0.8
      });
    }
  }

  function buildMilitaryEquipment() {
    var positions = [
      { x: -100, z: -100 },
      { x: 80, z: -120 },
      { x: 100, z: 80 }
    ];
    positions.forEach(function(pos) {
      for (var i = 0; i < 4; i++) {
        var equipGeom = new THREE.BoxGeometry(
          3 + Math.random() * 3,
          2 + Math.random() * 3,
          3 + Math.random() * 3
        );
        var equipMat = new THREE.MeshStandardMaterial({ color: 0x443322 });
        var equipMesh = new THREE.Mesh(equipGeom, equipMat);
        equipMesh.position.set(
          pos.x + (Math.random() - 0.5) * 8,
          1 + i * 2.5,
          pos.z + (Math.random() - 0.5) * 8
        );
        scene.add(equipMesh);
        objects.push(equipMesh);
      }
    });
  }

  function buildDeadCitySkyline() {
    var skylineX = -120;
    for (var i = 0; i < 8; i++) {
      var buildingGeom = new THREE.BoxGeometry(
        10 + Math.random() * 8,
        30 + Math.random() * 20,
        8
      );
      var buildingMat = new THREE.MeshStandardMaterial({ color: 0x221100 });
      var buildingMesh = new THREE.Mesh(buildingGeom, buildingMat);
      buildingMesh.position.set(skylineX + i * 15, (30 + Math.random() * 20) / 2, -120);
      scene.add(buildingMesh);
      objects.push(buildingMesh);
    }
  }

  function buildFlamingBarricade() {
    for (var i = 0; i < 6; i++) {
      var plankGeom = new THREE.BoxGeometry(4, 3, 1);
      var plankMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
      var plankMesh = new THREE.Mesh(plankGeom, plankMat);
      plankMesh.position.set(-40 + i * 15, 1.5, -60);
      scene.add(plankMesh);
      objects.push(plankMesh);

      var fireGeom = new THREE.SphereGeometry(3, 8, 8);
      var fireMat = new THREE.MeshStandardMaterial({
        color: 0xFF4400,
        emissive: 0xFF4400,
        emissiveIntensity: 0.7
      });
      var fireMesh = new THREE.Mesh(fireGeom, fireMat);
      fireMesh.position.set(-40 + i * 15, 4, -60);
      scene.add(fireMesh);
      objects.push(fireMesh);
      animatedObjects.push({
        mesh: fireMesh,
        type: 'barricade_fire',
        baseIntensity: 0.7,
        intensity: 0.7
      });
    }
  }

  function buildRadiationCloud() {
    var cloudGeom = new THREE.SphereGeometry(30, 16, 16);
    var cloudMat = new THREE.MeshStandardMaterial({
      color: 0x553311,
      emissive: 0x553311,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.4
    });
    var cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    cloudMesh.position.set(60, 50, 60);
    scene.add(cloudMesh);
    objects.push(cloudMesh);
    animatedObjects.push({
      mesh: cloudMesh,
      type: 'radiation_cloud',
      baseX: 60,
      driftSpeed: 0.015
    });
  }

  function buildEnemyCamp() {
    for (var i = 0; i < 3; i++) {
      var tentGeom = new THREE.BoxGeometry(8, 6, 8);
      var tentMat = new THREE.MeshStandardMaterial({ color: 0x554422 });
      var tentMesh = new THREE.Mesh(tentGeom, tentMat);
      tentMesh.position.set(80 + i * 20, 3, -80);
      scene.add(tentMesh);
      objects.push(tentMesh);
    }

    var firepitGeom = new THREE.CylinderGeometry(5, 6, 1, 16);
    var firepitMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
    var firepitMesh = new THREE.Mesh(firepitGeom, firepitMat);
    firepitMesh.position.set(95, 0.5, -75);
    scene.add(firepitMesh);
    objects.push(firepitMesh);

    var flameGeom = new THREE.SphereGeometry(6, 12, 12);
    var flameMat = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF4400,
      emissiveIntensity: 0.85
    });
    var flameMesh = new THREE.Mesh(flameGeom, flameMat);
    flameMesh.position.set(95, 7, -75);
    scene.add(flameMesh);
    objects.push(flameMesh);
    animatedObjects.push({
      mesh: flameMesh,
      type: 'camp_fire',
      baseIntensity: 0.85,
      intensity: 0.85
    });
  }

  function update(delta) {
    animatedObjects.forEach(function(obj) {
      if (obj.type === 'tornado') {
        obj.mesh.rotation.y += 0.05;
        obj.baseHeight += Math.sin(Date.now() * 0.001) * 0.1;
        obj.mesh.position.y = obj.baseHeight + Math.sin(Date.now() * 0.0008) * 3;
      } else if (obj.type === 'ember') {
        obj.mesh.position.y += 0.08;
        obj.mesh.position.x += obj.driftX;
        obj.mesh.position.z += obj.driftZ;
        if (obj.mesh.position.y > obj.baseY + 40) {
          obj.mesh.position.y = obj.baseY;
        }
      } else if (obj.type === 'magma_crack') {
        var pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        obj.mesh.material.emissiveIntensity = pulse;
      } else if (obj.type === 'vehicle_fire' || obj.type === 'drum_flame' ||
                 obj.type === 'barricade_fire' || obj.type === 'camp_fire') {
        var flicker = obj.baseIntensity + Math.sin(Date.now() * 0.005 + Math.random()) * 0.2;
        obj.mesh.material.emissiveIntensity = Math.max(0.3, flicker);
      } else if (obj.type === 'shimmer') {
        var shimmerOp = obj.baseOpacity + Math.sin(Date.now() * 0.002) * 0.08;
        obj.mesh.material.opacity = shimmerOp;
      } else if (obj.type === 'radiation_cloud') {
        obj.mesh.position.x = obj.baseX + Math.sin(Date.now() * obj.driftSpeed) * 15;
      }
    });
  }

  function reset() {
    objects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        obj.material.dispose();
      }
    });
    objects = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
