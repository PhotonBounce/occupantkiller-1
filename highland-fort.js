window.HighlandFort = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var lights = [];
  var animatedMeshes = [];
  var time = 0;

  function buildStoneWalls() {
    var wallHeight = 8;
    var wallThickness = 0.8;
    var stoneColor = 0x7a6c5d;

    var northWallGeom = new THREE.BoxGeometry(40, wallHeight, wallThickness);
    var northWallMat = new THREE.MeshLambertMaterial({ color: stoneColor });
    var northWall = new THREE.Mesh(northWallGeom, northWallMat);
    northWall.position.set(0, wallHeight / 2, -20);
    scene.add(northWall);
    meshes.push(northWall);

    var southWallGeom = new THREE.BoxGeometry(40, wallHeight, wallThickness);
    var southWallMat = new THREE.MeshLambertMaterial({ color: stoneColor });
    var southWall = new THREE.Mesh(southWallGeom, southWallMat);
    southWall.position.set(0, wallHeight / 2, 20);
    scene.add(southWall);
    meshes.push(southWall);

    var eastWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, 40);
    var eastWallMat = new THREE.MeshLambertMaterial({ color: stoneColor });
    var eastWall = new THREE.Mesh(eastWallGeom, eastWallMat);
    eastWall.position.set(20, wallHeight / 2, 0);
    scene.add(eastWall);
    meshes.push(eastWall);

    var westWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, 40);
    var westWallMat = new THREE.MeshLambertMaterial({ color: stoneColor });
    var westWall = new THREE.Mesh(westWallGeom, westWallMat);
    westWall.position.set(-20, wallHeight / 2, 0);
    scene.add(westWall);
    meshes.push(westWall);

    var cornerThickness = 1.5;
    var cornerHeight = 9;
    var cornerColor = 0x6b5c4d;

    var corners = [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: 20, z: 20 },
      { x: -20, z: 20 }
    ];

    for (var i = 0; i < corners.length; i++) {
      var cornerGeom = new THREE.CylinderGeometry(cornerThickness, cornerThickness, cornerHeight, 8);
      var cornerMat = new THREE.MeshLambertMaterial({ color: cornerColor });
      var cornerMesh = new THREE.Mesh(cornerGeom, cornerMat);
      cornerMesh.position.set(corners[i].x, cornerHeight / 2, corners[i].z);
      scene.add(cornerMesh);
      meshes.push(cornerMesh);
    }
  }

  function buildKeepTower() {
    var baseHeight = 25;
    var baseRadius = 5;
    var baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 16);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x5a4c3d });
    var baseTower = new THREE.Mesh(baseGeom, baseMat);
    baseTower.position.set(0, baseHeight / 2, 0);
    scene.add(baseTower);
    meshes.push(baseTower);

    var roofGeom = new THREE.ConeGeometry(baseRadius + 1, 4, 16);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, baseHeight + 2, 0);
    scene.add(roof);
    meshes.push(roof);

    var sniperNestGeom = new THREE.CylinderGeometry(baseRadius + 1.5, baseRadius + 1.5, 2, 8);
    var sniperNestMat = new THREE.MeshLambertMaterial({ color: 0x6b5c4d });
    var sniperNest = new THREE.Mesh(sniperNestGeom, sniperNestMat);
    sniperNest.position.set(0, baseHeight - 2, 0);
    scene.add(sniperNest);
    meshes.push(sniperNest);
    animatedMeshes.push({ mesh: sniperNest, type: 'searchlight' });

    var windowSize = 1;
    var windowGap = 6;
    for (var h = 5; h < baseHeight; h += windowGap) {
      for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        var windowGeom = new THREE.BoxGeometry(0.5, windowSize, 0.5);
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var window = new THREE.Mesh(windowGeom, windowMat);
        var x = Math.cos(angle) * (baseRadius - 0.2);
        var z = Math.sin(angle) * (baseRadius - 0.2);
        window.position.set(x, h, z);
        scene.add(window);
        meshes.push(window);
      }
    }
  }

  function buildBattlements() {
    var battlementHeight = 2;
    var spacing = 4;
    var wallLength = 40;

    for (var x = -18; x < 20; x += spacing) {
      var battleGeom = new THREE.BoxGeometry(1.5, battlementHeight, 1.5);
      var battleMat = new THREE.MeshLambertMaterial({ color: 0x6b5c4d });
      var northBattle = new THREE.Mesh(battleGeom, battleMat);
      northBattle.position.set(x, 9, -19.5);
      scene.add(northBattle);
      meshes.push(northBattle);

      var southBattle = new THREE.Mesh(battleGeom, battleMat);
      southBattle.position.set(x, 9, 19.5);
      scene.add(southBattle);
      meshes.push(southBattle);
    }

    for (var z = -18; z < 20; z += spacing) {
      var eastBattle = new THREE.Mesh(battleGeom, battleMat);
      eastBattle.position.set(19.5, 9, z);
      scene.add(eastBattle);
      meshes.push(eastBattle);

      var westBattle = new THREE.Mesh(battleGeom, battleMat);
      westBattle.position.set(-19.5, 9, z);
      scene.add(westBattle);
      meshes.push(westBattle);
    }
  }

  function buildDrawbridge() {
    var bridgeWidth = 6;
    var bridgeLength = 10;
    var bridgeThickness = 0.8;

    var bridgeGeom = new THREE.BoxGeometry(bridgeWidth, bridgeThickness, bridgeLength);
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });
    var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(0, 3, 21);
    scene.add(bridge);
    meshes.push(bridge);
    animatedMeshes.push({ mesh: bridge, type: 'drawbridge', offset: bridge.position.clone() });

    var chainThickness = 0.3;
    var leftChainGeom = new THREE.CylinderGeometry(chainThickness, chainThickness, 8, 6);
    var chainMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var leftChain = new THREE.Mesh(leftChainGeom, chainMat);
    leftChain.position.set(-3, 7, 21);
    scene.add(leftChain);
    meshes.push(leftChain);

    var rightChain = new THREE.Mesh(leftChainGeom, chainMat);
    rightChain.position.set(3, 7, 21);
    scene.add(rightChain);
    meshes.push(rightChain);

    var steelReinforcement1 = new THREE.BoxGeometry(bridgeWidth, 0.3, 0.5);
    var steelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var steel1 = new THREE.Mesh(steelReinforcement1, steelMat);
    steel1.position.set(0, 1.5, 21);
    scene.add(steel1);
    meshes.push(steel1);

    var steel2 = new THREE.Mesh(steelReinforcement1, steelMat);
    steel2.position.set(0, 4.5, 21);
    scene.add(steel2);
    meshes.push(steel2);
  }

  function buildGunEmplacements() {
    var gunPositions = [
      { x: 15, z: -15 },
      { x: -15, z: -15 },
      { x: 15, z: 15 },
      { x: -15, z: 15 }
    ];

    for (var i = 0; i < gunPositions.length; i++) {
      var sandbagGeom = new THREE.BoxGeometry(3, 1.5, 3);
      var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
      var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
      sandbag.position.set(gunPositions[i].x, 1, gunPositions[i].z);
      scene.add(sandbag);
      meshes.push(sandbag);

      var barrelGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.rotation.z = Math.PI / 6;
      barrel.position.set(gunPositions[i].x, 3.5, gunPositions[i].z);
      scene.add(barrel);
      meshes.push(barrel);

      var gunBaseGeom = new THREE.CylinderGeometry(0.8, 1.2, 0.8, 8);
      var gunBaseMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      var gunBase = new THREE.Mesh(gunBaseGeom, gunBaseMat);
      gunBase.position.set(gunPositions[i].x, 2.2, gunPositions[i].z);
      scene.add(gunBase);
      meshes.push(gunBase);
    }
  }

  function buildCatapultMortar() {
    var baseGeom = new THREE.BoxGeometry(4, 1, 4);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x6b5c4d });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(10, 1, -12);
    scene.add(base);
    meshes.push(base);

    var armGeom = new THREE.BoxGeometry(0.5, 0.5, 5);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var arm = new THREE.Mesh(armGeom, armMat);
    arm.position.set(10, 3, -12);
    scene.add(arm);
    meshes.push(arm);
    animatedMeshes.push({ mesh: arm, type: 'catapult' });

    var pivotGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 8);
    var pivotMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var pivot = new THREE.Mesh(pivotGeom, pivotMat);
    pivot.position.set(10, 2.5, -12);
    scene.add(pivot);
    meshes.push(pivot);

    var bucketGeom = new THREE.SphereGeometry(0.6, 8, 8);
    var bucketMat = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });
    var bucket = new THREE.Mesh(bucketGeom, bucketMat);
    bucket.position.set(10, 7.5, -12);
    scene.add(bucket);
    meshes.push(bucket);

    var supportGeom = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 6);
    var supportMat = new THREE.MeshLambertMaterial({ color: 0x5a4c3d });
    var leftSupport = new THREE.Mesh(supportGeom, supportMat);
    leftSupport.position.set(8, 1.8, -12);
    scene.add(leftSupport);
    meshes.push(leftSupport);

    var rightSupport = new THREE.Mesh(supportGeom, supportMat);
    rightSupport.position.set(12, 1.8, -12);
    scene.add(rightSupport);
    meshes.push(rightSupport);
  }

  function buildRockFormations() {
    var rockCount = 15;
    var baseX = 25;
    var baseZ = 0;

    for (var i = 0; i < rockCount; i++) {
      var sizeVariation = 0.8 + Math.random() * 1.2;
      var rockGeom = new THREE.BoxGeometry(sizeVariation, sizeVariation * 1.3, sizeVariation);
      var rockColor = 0x6b6b6b - Math.floor(Math.random() * 0x1a1a1a);
      var rockMat = new THREE.MeshLambertMaterial({ color: rockColor });
      var rock = new THREE.Mesh(rockGeom, rockMat);

      var offsetX = (Math.random() - 0.5) * 8;
      var offsetZ = (Math.random() - 0.5) * 8;
      var height = sizeVariation * 0.65;
      rock.position.set(baseX + offsetX, height, baseZ + offsetZ);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      scene.add(rock);
      meshes.push(rock);
    }

    var cliffGeom = new THREE.BoxGeometry(50, 15, 2);
    var cliffMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var cliff = new THREE.Mesh(cliffGeom, cliffMat);
    cliff.position.set(0, 7.5, -30);
    scene.add(cliff);
    meshes.push(cliff);
  }

  function buildFlag() {
    var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(-18, 12, 0);
    scene.add(pole);
    meshes.push(pole);

    var flagGeom = new THREE.BoxGeometry(3, 2, 0.1);
    var flagMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(-16, 16, 0);
    scene.add(flag);
    meshes.push(flag);
    animatedMeshes.push({ mesh: flag, type: 'flag', offset: flag.position.clone() });
  }

  function buildStorageStructures() {
    var storagePositions = [
      { x: -12, z: 10 },
      { x: 12, z: 10 },
      { x: -12, z: -10 },
      { x: 12, z: -10 }
    ];

    for (var i = 0; i < storagePositions.length; i++) {
      var containerGeom = new THREE.BoxGeometry(4, 3, 5);
      var containerMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      var container = new THREE.Mesh(containerGeom, containerMat);
      container.position.set(storagePositions[i].x, 1.5, storagePositions[i].z);
      scene.add(container);
      meshes.push(container);

      var roofGeom = new THREE.ConeGeometry(3, 1.5, 6);
      var roofMat = new THREE.MeshLambertMaterial({ color: 0x6b5c4d });
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.set(storagePositions[i].x, 4.2, storagePositions[i].z);
      scene.add(roof);
      meshes.push(roof);

      var doorGeom = new THREE.BoxGeometry(1.2, 2, 0.3);
      var doorMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
      var door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(storagePositions[i].x, 1.5, storagePositions[i].z + 2.5);
      scene.add(door);
      meshes.push(door);
    }
  }

  function buildPalisade() {
    var fenceHeight = 3;
    var fenceSpacing = 1.5;
    var fenceThickness = 0.3;

    for (var x = -25; x < 25; x += fenceSpacing) {
      var fenceGeom = new THREE.BoxGeometry(fenceThickness, fenceHeight, fenceThickness);
      var fenceMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
      var fence = new THREE.Mesh(fenceGeom, fenceMat);
      fence.position.set(x, fenceHeight / 2, -27);
      scene.add(fence);
      meshes.push(fence);
    }

    for (var z = -27; z < 28; z += fenceSpacing) {
      var fenceGeom = new THREE.BoxGeometry(fenceThickness, fenceHeight, fenceThickness);
      var fenceMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
      var fence = new THREE.Mesh(fenceGeom, fenceMat);
      fence.position.set(-25, fenceHeight / 2, z);
      scene.add(fence);
      meshes.push(fence);

      var fenceRight = new THREE.Mesh(fenceGeom, fenceMat);
      fenceRight.position.set(25, fenceHeight / 2, z);
      scene.add(fenceRight);
      meshes.push(fenceRight);
    }
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 30, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    lights.push(directionalLight);

    var towerLight = new THREE.PointLight(0xffdd00, 0.7, 25);
    towerLight.position.set(0, 24, 0);
    scene.add(towerLight);
    lights.push(towerLight);

    var eastGunLight = new THREE.PointLight(0xff6b6b, 0.5, 20);
    eastGunLight.position.set(15, 4, 0);
    scene.add(eastGunLight);
    lights.push(eastGunLight);

    var westGunLight = new THREE.PointLight(0xff6b6b, 0.5, 20);
    westGunLight.position.set(-15, 4, 0);
    scene.add(westGunLight);
    lights.push(westGunLight);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lights = [];
    animatedMeshes = [];
    time = 0;

    buildStoneWalls();
    buildKeepTower();
    buildBattlements();
    buildDrawbridge();
    buildGunEmplacements();
    buildCatapultMortar();
    buildRockFormations();
    buildFlag();
    buildStorageStructures();
    buildPalisade();
    buildLighting();
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < animatedMeshes.length; i++) {
      var anim = animatedMeshes[i];

      if (anim.type === 'searchlight') {
        anim.mesh.rotation.y += 1.5 * delta;
      }

      if (anim.type === 'flag') {
        anim.mesh.rotation.z = Math.sin(time * 2) * 0.3;
        anim.mesh.position.y = anim.offset.y + Math.sin(time * 1.5) * 0.2;
      }

      if (anim.type === 'drawbridge') {
        var swingAngle = Math.sin(time * 0.8) * 0.6;
        anim.mesh.rotation.x = swingAngle;
      }

      if (anim.type === 'catapult') {
        var armRotation = Math.sin(time * 1.2) * 0.8;
        anim.mesh.rotation.z = armRotation;
      }
    }
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    meshes = [];
    lights = [];
    animatedMeshes = [];
    scene = null;
    camera = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
