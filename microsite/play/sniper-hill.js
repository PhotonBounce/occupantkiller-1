window.SniperHill = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var updateables = [];
  var time = 0;

  var colorTerrainBrown = 0x8B7355;
  var colorMilitarySand = 0xD4A574;
  var colorDarkMetal = 0x2F2F2F;
  var colorGreen = 0x4A7C2C;
  var colorDarkGreen = 0x2D5A1A;
  var colorGrey = 0x707070;
  var colorRed = 0xCC3333;

  function createMesh(geometry, color, x, y, z) {
    var material = new THREE.MeshStandardMaterial({ color: color, metalness: 0.3, roughness: 0.7 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createTerrainBase() {
    var baseGeo = new THREE.BoxGeometry(80, 2, 80);
    createMesh(baseGeo, colorTerrainBrown, 0, -1, 0);
  }

  function createValleyTentCamp() {
    var tentPoleGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
    var tentMesh1 = createMesh(tentPoleGeo, colorDarkMetal, -25, 3, -30);
    var tentMesh2 = createMesh(tentPoleGeo, colorDarkMetal, -20, 3, -30);
    var tentMesh3 = createMesh(tentPoleGeo, colorDarkMetal, -15, 3, -30);

    updateables.push({
      mesh: tentMesh1,
      oscillate: true,
      axis: 'x',
      amplitude: 0.8,
      frequency: 1.2
    });

    updateables.push({
      mesh: tentMesh2,
      oscillate: true,
      axis: 'x',
      amplitude: 0.6,
      frequency: 1.4
    });

    updateables.push({
      mesh: tentMesh3,
      oscillate: true,
      axis: 'x',
      amplitude: 0.7,
      frequency: 1.1
    });

    var tentCanopyGeo = new THREE.BoxGeometry(12, 5, 8);
    createMesh(tentCanopyGeo, colorMilitarySand, -20, 7, -30);

    var supplyCanopyGeo = new THREE.BoxGeometry(6, 3, 8);
    createMesh(supplyCanopyGeo, colorMilitarySand, -28, 5, -25);
  }

  function createHillLayers() {
    var layer1Geo = new THREE.BoxGeometry(60, 4, 60);
    createMesh(layer1Geo, colorTerrainBrown, 0, 3, 0);

    var layer2Geo = new THREE.BoxGeometry(45, 5, 45);
    createMesh(layer2Geo, colorDarkGreen, 0, 9, 0);

    var layer3Geo = new THREE.BoxGeometry(30, 6, 30);
    createMesh(layer3Geo, colorGreen, 0, 16, 0);

    var peakGeo = new THREE.BoxGeometry(15, 4, 15);
    createMesh(peakGeo, colorMilitarySand, 0, 23, 0);
  }

  function createTrenches() {
    var trenchWallGeo = new THREE.BoxGeometry(40, 3, 1.5);
    createMesh(trenchWallGeo, colorTerrainBrown, 0, 8, 15);
    createMesh(trenchWallGeo, colorTerrainBrown, 0, 8, -15);

    var trenchFloorGeo = new THREE.BoxGeometry(40, 0.5, 28);
    createMesh(trenchFloorGeo, colorDarkGreen, 0, 5.5, 0);
  }

  function createSandbags() {
    var sandbagGeo = new THREE.BoxGeometry(2.5, 1.5, 2);
    createMesh(sandbagGeo, colorMilitarySand, -8, 24.5, -5);
    createMesh(sandbagGeo, colorMilitarySand, -4, 24.5, -6);
    createMesh(sandbagGeo, colorMilitarySand, 0, 24.5, -6.5);
    createMesh(sandbagGeo, colorMilitarySand, 4, 24.5, -6);
    createMesh(sandbagGeo, colorMilitarySand, 8, 24.5, -5);

    createMesh(sandbagGeo, colorMilitarySand, -6, 24.5, 3);
    createMesh(sandbagGeo, colorMilitarySand, 0, 24.5, 4);
    createMesh(sandbagGeo, colorMilitarySand, 6, 24.5, 3);
  }

  function createObservationPost() {
    var postBaseGeo = new THREE.BoxGeometry(8, 2, 8);
    createMesh(postBaseGeo, colorGrey, 12, 24, 8);

    var postFrameGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 6);
    var postFrame = createMesh(postFrameGeo, colorDarkMetal, 12, 31, 8);

    var periscopeGeo = new THREE.BoxGeometry(3, 3, 3);
    var periscopeMesh = createMesh(periscopeGeo, colorGrey, 12, 36, 8);

    updateables.push({
      mesh: periscopeMesh,
      rotate: true,
      axis: 'z',
      speed: 0.5
    });
  }

  function createRangeFinderPillars() {
    var pillarGeo = new THREE.CylinderGeometry(0.6, 0.6, 10, 8);
    var pillar1 = createMesh(pillarGeo, colorDarkMetal, -15, 20, -20);
    var pillar2 = createMesh(pillarGeo, colorDarkMetal, 18, 20, 12);

    updateables.push({
      mesh: pillar1,
      pulse: true,
      material: pillar1.material,
      baseColor: colorDarkMetal
    });

    updateables.push({
      mesh: pillar2,
      pulse: true,
      material: pillar2.material,
      baseColor: colorDarkMetal
    });
  }

  function createSupplyCrates() {
    var crateGeo = new THREE.BoxGeometry(3, 3, 3);
    createMesh(crateGeo, colorGreen, -20, 11, 8);
    createMesh(crateGeo, colorGreen, -14, 11, 8);
    createMesh(crateGeo, colorGreen, -20, 15, 8);

    var stackGeo = new THREE.BoxGeometry(4, 2, 4);
    createMesh(stackGeo, colorMilitarySand, 15, 12, -12);
    createMesh(stackGeo, colorMilitarySand, 15, 15, -12);
  }

  function createSupplyRoute() {
    var pathGeo = new THREE.BoxGeometry(6, 0.3, 50);
    createMesh(pathGeo, colorGrey, 0, 2, 15);
  }

  function createAntiSniperBarrier() {
    var barrierWallGeo = new THREE.BoxGeometry(35, 4, 2);
    createMesh(barrierWallGeo, colorGrey, -5, 20, 25);
    createMesh(barrierWallGeo, colorGrey, 12, 18, 28);
  }

  function createHelicopterWreck() {
    var fuselageGeo = new THREE.CylinderGeometry(2, 1.5, 18, 8);
    var fuselage = createMesh(fuselageGeo, colorRed, 8, 28, -15);
    fuselage.rotation.z = 0.3;

    var rotorGeo = new THREE.CylinderGeometry(12, 12, 0.5, 8);
    createMesh(rotorGeo, colorDarkMetal, 8, 38, -15);

    var tailBoomGeo = new THREE.CylinderGeometry(0.8, 0.8, 15, 6);
    createMesh(tailBoomGeo, colorRed, 15, 25, -20);

    var tailRotorGeo = new THREE.CylinderGeometry(3, 3, 0.3, 6);
    createMesh(tailRotorGeo, colorDarkMetal, 24, 25, -20);
  }

  function createRockFormations() {
    var rockGeo = new THREE.SphereGeometry(3, 8, 8);
    createMesh(rockGeo, colorTerrainBrown, -30, 10, 10);
    createMesh(rockGeo, colorTerrainBrown, 25, 12, -25);

    var smallRockGeo = new THREE.SphereGeometry(1.5, 6, 6);
    createMesh(smallRockGeo, colorTerrainBrown, -25, 8, 18);
    createMesh(smallRockGeo, colorTerrainBrown, 28, 10, 8);
  }

  function createAmmunitionStash() {
    var ammoBoxGeo = new THREE.BoxGeometry(2, 1.5, 2.5);
    createMesh(ammoBoxGeo, colorRed, 0, 24.5, 8);
    createMesh(ammoBoxGeo, colorRed, 2.5, 24.5, 7);
  }

  function createBarbedWire() {
    var wireGeo = new THREE.BoxGeometry(0.2, 0.2, 20);
    createMesh(wireGeo, colorDarkMetal, -18, 12, 0);
    createMesh(wireGeo, colorDarkMetal, 18, 12, 0);
  }

  function createScenicRocks() {
    var scenicRock1 = new THREE.SphereGeometry(2.5, 8, 8);
    createMesh(scenicRock1, colorTerrainBrown, -35, 6, -35);

    var scenicRock2 = new THREE.SphereGeometry(2, 8, 8);
    createMesh(scenicRock2, colorTerrainBrown, 32, 8, 35);
  }

  function createLineofSightMarkers() {
    var markerGeo = new THREE.BoxGeometry(0.3, 15, 0.3);
    createMesh(markerGeo, colorGrey, -25, 12, 0);
    createMesh(markerGeo, colorGrey, 25, 12, 0);
  }

  function createRadarDish() {
    var dishPoleGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
    createMesh(dishPoleGeo, colorDarkMetal, -10, 20, 12);

    var dishGeo = new THREE.SphereGeometry(3, 12, 12);
    var dishMesh = createMesh(dishGeo, colorGrey, -10, 28, 12);

    updateables.push({
      mesh: dishMesh,
      rotate: true,
      axis: 'y',
      speed: 0.3
    });
  }

  function createCommunicationMast() {
    var mastGeo = new THREE.CylinderGeometry(0.25, 0.25, 16, 5);
    createMesh(mastGeo, colorDarkMetal, 22, 24, -8);

    var antennaPart1 = new THREE.CylinderGeometry(0.15, 0.15, 6, 4);
    createMesh(antennaPart1, colorDarkMetal, 22, 34, -8);

    var antennaPart2 = new THREE.CylinderGeometry(0.1, 0.1, 4, 3);
    createMesh(antennaPart2, colorDarkMetal, 22, 38, -8);
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    meshes = [];
    updateables = [];
    time = 0;

    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 150, 200);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    createTerrainBase();
    createValleyTentCamp();
    createHillLayers();
    createTrenches();
    createSandbags();
    createObservationPost();
    createRangeFinderPillars();
    createSupplyCrates();
    createSupplyRoute();
    createAntiSniperBarrier();
    createHelicopterWreck();
    createRockFormations();
    createAmmunitionStash();
    createBarbedWire();
    createScenicRocks();
    createLineofSightMarkers();
    createRadarDish();
    createCommunicationMast();
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < updateables.length; i++) {
      var item = updateables[i];

      if (item.oscillate) {
        var offset = Math.sin(time * item.frequency) * item.amplitude;
        if (item.axis === 'x') {
          item.mesh.position.x += offset * delta;
        } else if (item.axis === 'y') {
          item.mesh.position.y += offset * delta;
        } else if (item.axis === 'z') {
          item.mesh.position.z += offset * delta;
        }
      }

      if (item.rotate) {
        if (item.axis === 'x') {
          item.mesh.rotation.x += item.speed * delta;
        } else if (item.axis === 'y') {
          item.mesh.rotation.y += item.speed * delta;
        } else if (item.axis === 'z') {
          item.mesh.rotation.z += item.speed * delta;
        }
      }

      if (item.pulse) {
        var pulseIntensity = 0.5 + Math.sin(time * 2) * 0.5;
        item.material.color.setHex(item.baseColor);
        item.material.emissive.setHex(item.baseColor);
        item.material.emissiveIntensity = pulseIntensity * 0.4;
      }
    }
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    updateables = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
