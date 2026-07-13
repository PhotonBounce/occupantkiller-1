window.FrozenKeep = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var icyWalls = [];
  var cryogenicEmplacements = [];
  var floatingParticles = [];

  function init(initialScene, initialCamera) {
    scene = initialScene;
    camera = initialCamera;
    meshes = [];
    icyWalls = [];
    cryogenicEmplacements = [];
    floatingParticles = [];

    buildKeepStructure();
    buildBattlements();
    buildSiegeEngines();
    buildArmoredKnights();
    buildIceShaft();
    buildCryogenicWeapons();
    buildFrozenEnvironment();

    return true;
  }

  function buildKeepStructure() {
    var keepMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6fa5, metalness: 0.3, roughness: 0.7 });
    var keepGeo = new THREE.BoxGeometry(40, 60, 40);
    var keepMesh = new THREE.Mesh(keepGeo, keepMaterial);
    keepMesh.position.set(0, 20, 0);
    keepMesh.castShadow = true;
    keepMesh.receiveShadow = true;
    scene.add(keepMesh);
    meshes.push(keepMesh);

    var cornerTower1 = buildTowerCylinder(-18, 35, -18);
    var cornerTower2 = buildTowerCylinder(18, 35, -18);
    var cornerTower3 = buildTowerCylinder(-18, 35, 18);
    var cornerTower4 = buildTowerCylinder(18, 35, 18);
  }

  function buildTowerCylinder(x, y, z) {
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x3d5a87, metalness: 0.2, roughness: 0.8 });
    var towerGeo = new THREE.CylinderGeometry(8, 10, 70, 16);
    var tower = new THREE.Mesh(towerGeo, stoneMaterial);
    tower.position.set(x, y, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    meshes.push(tower);
    return tower;
  }

  function buildBattlements() {
    var battlementMaterial = new THREE.MeshStandardMaterial({ color: 0x2c4563, metalness: 0.4, roughness: 0.6 });
    var roofGeo = new THREE.BoxGeometry(45, 3, 45);
    var roof = new THREE.Mesh(roofGeo, battlementMaterial);
    roof.position.set(0, 52, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
    meshes.push(roof);

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var x = Math.cos(angle) * 22;
      var z = Math.sin(angle) * 22;
      var crenelGeo = new THREE.BoxGeometry(3, 8, 3);
      var crenelMat = new THREE.MeshStandardMaterial({ color: 0x1f2d40, metalness: 0.5, roughness: 0.5 });
      var crenel = new THREE.Mesh(crenelGeo, crenelMat);
      crenel.position.set(x, 58, z);
      crenel.castShadow = true;
      scene.add(crenel);
      meshes.push(crenel);
    }
  }

  function buildSiegeEngines() {
    var catapult1 = buildCatapult(-15, 53, -20);
    var catapult2 = buildCatapult(15, 53, 20);
  }

  function buildCatapult(x, y, z) {
    var iceGlass = new THREE.MeshStandardMaterial({ color: 0x6eb5ff, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.7 });

    var baseGeo = new THREE.BoxGeometry(6, 2, 6);
    var base = new THREE.Mesh(baseGeo, iceGlass);
    base.position.set(x, y, z);
    scene.add(base);
    meshes.push(base);

    var armGeo = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    var arm = new THREE.Mesh(armGeo, iceGlass);
    arm.position.set(x, y + 6, z);
    arm.rotation.z = Math.PI / 6;
    scene.add(arm);
    meshes.push(arm);

    var bucketGeo = new THREE.SphereGeometry(2, 8, 8);
    var bucket = new THREE.Mesh(bucketGeo, iceGlass);
    bucket.position.set(x + 5, y + 10, z);
    scene.add(bucket);
    meshes.push(bucket);
  }

  function buildArmoredKnights() {
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 25;
      var z = Math.sin(angle) * 25;
      buildKnight(x, 25, z);
    }
  }

  function buildKnight(x, y, z) {
    var iceMaterial = new THREE.MeshStandardMaterial({ color: 0x7ed3ff, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.85 });

    var bodyGeo = new THREE.BoxGeometry(3, 8, 2.5);
    var body = new THREE.Mesh(bodyGeo, iceMaterial);
    body.position.set(x, y + 4, z);
    scene.add(body);
    meshes.push(body);

    var headGeo = new THREE.SphereGeometry(1.5, 12, 12);
    var head = new THREE.Mesh(headGeo, iceMaterial);
    head.position.set(x, y + 10, z);
    scene.add(head);
    meshes.push(head);

    var helmetGeo = new THREE.ConeGeometry(1.8, 2, 12);
    var helmet = new THREE.Mesh(helmetGeo, iceMaterial);
    helmet.position.set(x, y + 11.5, z);
    scene.add(helmet);
    meshes.push(helmet);

    var armLeftGeo = new THREE.CylinderGeometry(0.6, 0.6, 6, 8);
    var armLeft = new THREE.Mesh(armLeftGeo, iceMaterial);
    armLeft.position.set(x - 2, y + 5, z);
    scene.add(armLeft);
    meshes.push(armLeft);

    var armRightGeo = new THREE.CylinderGeometry(0.6, 0.6, 6, 8);
    var armRight = new THREE.Mesh(armRightGeo, iceMaterial);
    armRight.position.set(x + 2, y + 5, z);
    scene.add(armRight);
    meshes.push(armRight);
  }

  function buildIceShaft() {
    var shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x5a9fd4, metalness: 0.7, roughness: 0.4 });
    var shaftGeo = new THREE.CylinderGeometry(12, 15, 80, 16);
    var shaft = new THREE.Mesh(shaftGeo, shaftMaterial);
    shaft.position.set(0, -10, 0);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    scene.add(shaft);
    meshes.push(shaft);

    var throneRoomGeo = new THREE.BoxGeometry(35, 25, 35);
    var throneRoomMat = new THREE.MeshStandardMaterial({ color: 0x1a2332, metalness: 0.5, roughness: 0.6 });
    var throneRoom = new THREE.Mesh(throneRoomGeo, throneRoomMat);
    throneRoom.position.set(0, -50, 0);
    throneRoom.castShadow = true;
    throneRoom.receiveShadow = true;
    scene.add(throneRoom);
    meshes.push(throneRoom);

    var throneGeo = new THREE.BoxGeometry(8, 12, 8);
    var throneMat = new THREE.MeshStandardMaterial({ color: 0x2c4563, metalness: 0.9, roughness: 0.3 });
    var throne = new THREE.Mesh(throneGeo, throneMat);
    throne.position.set(0, -44, 0);
    scene.add(throne);
    meshes.push(throne);
  }

  function buildCryogenicWeapons() {
    var emplacementMat = new THREE.MeshStandardMaterial({ color: 0x1f1f2e, metalness: 0.85, roughness: 0.2 });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var x = Math.cos(angle) * 28;
      var z = Math.sin(angle) * 28;

      var baseGeo = new THREE.BoxGeometry(5, 1, 5);
      var base = new THREE.Mesh(baseGeo, emplacementMat);
      base.position.set(x, 50, z);
      scene.add(base);
      meshes.push(base);

      var gunGeo = new THREE.CylinderGeometry(1.2, 1.2, 8, 12);
      var gun = new THREE.Mesh(gunGeo, emplacementMat);
      gun.position.set(x, 54, z);
      gun.rotation.x = Math.PI / 8;
      scene.add(gun);
      meshes.push(gun);

      var sensorGeo = new THREE.SphereGeometry(0.8, 8, 8);
      var sensorMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, metalness: 1, roughness: 0 });
      var sensor = new THREE.Mesh(sensorGeo, sensorMat);
      sensor.position.set(x, 56, z);
      scene.add(sensor);
      meshes.push(sensor);

      cryogenicEmplacements.push({ base: base, gun: gun, sensor: sensor });
    }
  }

  function buildFrozenEnvironment() {
    var iceFieldMaterial = new THREE.MeshStandardMaterial({ color: 0x8fd3ff, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.6 });

    for (var i = 0; i < 20; i++) {
      var icebergGeo = new THREE.SphereGeometry(Math.random() * 3 + 2, 8, 8);
      var iceberg = new THREE.Mesh(icebergGeo, iceFieldMaterial);
      iceberg.position.set(Math.random() * 80 - 40, Math.random() * 5 + 65, Math.random() * 80 - 40);
      scene.add(iceberg);
      meshes.push(iceberg);

      floatingParticles.push({
        mesh: iceberg,
        vx: Math.random() * 0.02 - 0.01,
        vy: Math.random() * 0.01,
        vz: Math.random() * 0.02 - 0.01
      });
    }
  }

  function update(delta) {
    for (var i = 0; i < floatingParticles.length; i++) {
      var particle = floatingParticles[i];
      particle.mesh.position.x += particle.vx * delta * 60;
      particle.mesh.position.y += particle.vy * delta * 60;
      particle.mesh.position.z += particle.vz * delta * 60;

      if (particle.mesh.position.y > 75) {
        particle.vy = -particle.vy * 0.8;
      }
      if (particle.mesh.position.y < 50) {
        particle.vy = -particle.vy * 0.8;
      }
    }

    for (var j = 0; j < cryogenicEmplacements.length; j++) {
      var emplacement = cryogenicEmplacements[j];
      emplacement.gun.rotation.y += 0.005;
      emplacement.sensor.rotation.z += 0.08;
      var pulse = Math.sin(Date.now() * 0.003 + j) * 0.3 + 0.7;
      emplacement.sensor.scale.set(pulse, pulse, pulse);
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    icyWalls = [];
    cryogenicEmplacements = [];
    floatingParticles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
