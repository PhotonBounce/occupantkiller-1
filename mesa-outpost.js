window.MesaOutpost = (function() {
  'use strict';

  var scene = null;
  var meshes = [];
  var particles = [];
  var time = 0;

  function buildMesa() {
    var geometry = new THREE.BoxGeometry(200, 40, 150);
    var material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var mesa = new THREE.Mesh(geometry, material);
    mesa.position.set(0, -20, 0);
    mesa.castShadow = true;
    mesa.receiveShadow = true;
    scene.add(mesa);
    meshes.push(mesa);
  }

  function buildCliffFace() {
    var geometry = new THREE.BoxGeometry(200, 60, 8);
    var material = new THREE.MeshStandardMaterial({ color: 0x654321 });
    var cliff = new THREE.Mesh(geometry, material);
    cliff.position.set(0, 0, 75);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    scene.add(cliff);
    meshes.push(cliff);
  }

  function buildRopeLadder() {
    var ropeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 70, 8);
    var ropeMaterial = new THREE.MeshStandardMaterial({ color: 0xD2691E });
    var rung = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position',
        new THREE.BufferAttribute(new Float32Array([
          -40, 0, 0, 40, 0, 0,
          -40, -8, 0, 40, -8, 0,
          -40, -16, 0, 40, -16, 0,
          -40, -24, 0, 40, -24, 0,
          -40, -32, 0, 40, -32, 0,
          -40, -40, 0, 40, -40, 0,
          -40, -48, 0, 40, -48, 0,
          -40, -56, 0, 40, -56, 0
        ]), 3)),
      new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 })
    );
    rung.position.set(-80, 40, 75);
    scene.add(rung);
    meshes.push(rung);
  }

  function buildCommunicationArray() {
    var tower = new THREE.CylinderGeometry(2, 2, 50, 12);
    var material = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    var mesh = new THREE.Mesh(tower, material);
    mesh.position.set(60, 50, -30);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    var dish = new THREE.SphereGeometry(8, 16, 16);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 });
    var dishMesh = new THREE.Mesh(dish, dishMaterial);
    dishMesh.position.set(60, 70, -30);
    dishMesh.scale.set(1, 0.3, 1);
    dishMesh.castShadow = true;
    scene.add(dishMesh);
    meshes.push(dishMesh);
  }

  function buildArtilleryEmplacement() {
    var base = new THREE.CylinderGeometry(12, 14, 3, 16);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
    var baseMesh = new THREE.Mesh(base, baseMaterial);
    baseMesh.position.set(-50, 25, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    meshes.push(baseMesh);

    var barrel = new THREE.CylinderGeometry(1.5, 1.5, 20, 12);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x1C1C1C });
    var barrelMesh = new THREE.Mesh(barrel, barrelMaterial);
    barrelMesh.position.set(-50, 28, 0);
    barrelMesh.rotation.z = Math.PI / 8;
    barrelMesh.castShadow = true;
    scene.add(barrelMesh);
    meshes.push(barrelMesh);
  }

  function buildSandbagPerimeter() {
    var sandbag = new THREE.BoxGeometry(6, 2, 3);
    var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0xC4A747 });

    var positions = [
      [80, 20, -40],
      [80, 20, -20],
      [80, 20, 0],
      [80, 20, 20],
      [80, 20, 40],
      [0, 20, 60],
      [-80, 20, 40],
      [-80, 20, 20],
      [-80, 20, 0],
      [-80, 20, -20],
      [-80, 20, -40]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var mesh = new THREE.Mesh(sandbag, sandbagMaterial);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    }
  }

  function buildWeatherStation() {
    var pole = new THREE.CylinderGeometry(0.8, 0.8, 18, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA });
    var poleMesh = new THREE.Mesh(pole, poleMaterial);
    poleMesh.position.set(40, 45, 45);
    poleMesh.castShadow = true;
    scene.add(poleMesh);
    meshes.push(poleMesh);

    var instrument = new THREE.SphereGeometry(2.5, 8, 8);
    var instMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6347 });
    var instMesh = new THREE.Mesh(instrument, instMaterial);
    instMesh.position.set(40, 62, 45);
    instMesh.castShadow = true;
    scene.add(instMesh);
    meshes.push(instMesh);
  }

  function buildHelicopterPad() {
    var pad = new THREE.CylinderGeometry(35, 35, 1, 32);
    var padMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, emissive: 0x00AA00 });
    var padMesh = new THREE.Mesh(pad, padMaterial);
    padMesh.position.set(-40, 25, -50);
    padMesh.receiveShadow = true;
    scene.add(padMesh);
    meshes.push(padMesh);

    var marker = new THREE.CylinderGeometry(4, 4, 0.5, 4);
    var markerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
    var markerMesh = new THREE.Mesh(marker, markerMaterial);
    markerMesh.position.set(-40, 26, -50);
    scene.add(markerMesh);
    meshes.push(markerMesh);
  }

  function buildSupplyCache() {
    var crate = new THREE.BoxGeometry(5, 5, 5);
    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });

    var positions = [
      [0, 26, 60],
      [6, 26, 60],
      [12, 26, 60],
      [3, 31, 60],
      [9, 31, 60]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var mesh = new THREE.Mesh(crate, crateMaterial);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    }
  }

  function buildVentilation() {
    var vent = new THREE.ConeGeometry(3, 4, 8);
    var ventMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var ventMesh = new THREE.Mesh(vent, ventMaterial);
    ventMesh.position.set(15, 26, 55);
    ventMesh.castShadow = true;
    scene.add(ventMesh);
    meshes.push(ventMesh);

    var vent2 = new THREE.Mesh(vent, ventMaterial);
    vent2.position.set(-15, 26, 55);
    vent2.castShadow = true;
    scene.add(vent2);
    meshes.push(vent2);
  }

  function buildWatchTower() {
    var tower = new THREE.CylinderGeometry(8, 8, 20, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
    var towerMesh = new THREE.Mesh(tower, towerMaterial);
    towerMesh.position.set(70, 35, 50);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    scene.add(towerMesh);
    meshes.push(towerMesh);

    var roof = new THREE.ConeGeometry(10, 6, 16);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    var roofMesh = new THREE.Mesh(roof, roofMaterial);
    roofMesh.position.set(70, 50, 50);
    roofMesh.castShadow = true;
    scene.add(roofMesh);
    meshes.push(roofMesh);
  }

  function buildCanyon() {
    var canyon = new THREE.BoxGeometry(300, 150, 200);
    var canyonMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B4423,
      side: THREE.BackSide
    });
    var canyonMesh = new THREE.Mesh(canyon, canyonMaterial);
    canyonMesh.position.set(0, -120, 0);
    scene.add(canyonMesh);
    meshes.push(canyonMesh);
  }

  function spawnDust() {
    if (Math.random() < 0.3) {
      var particle = {
        x: Math.random() * 200 - 100,
        y: Math.random() * 30 + 20,
        z: Math.random() * 150 - 75,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.2 - 0.05,
        vz: (Math.random() - 0.5) * 0.5,
        life: 1.0
      };
      particles.push(particle);
    }
  }

  function updateParticles(delta) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.life -= delta * 0.5;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function init(sceneParam, camera) {
    scene = sceneParam;

    buildMesa();
    buildCliffFace();
    buildRopeLadder();
    buildCommunicationArray();
    buildArtilleryEmplacement();
    buildSandbagPerimeter();
    buildWeatherStation();
    buildHelicopterPad();
    buildSupplyCache();
    buildVentilation();
    buildWatchTower();
    buildCanyon();

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(100, 100, 100);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    return true;
  }

  function update(delta) {
    time += delta;
    spawnDust();
    updateParticles(delta);

    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].rotation && Math.random() < 0.01) {
        meshes[i].rotation.y += Math.sin(time * 0.1) * 0.02;
      }
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    particles = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
