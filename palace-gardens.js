var window = window || {};

window.PalaceGardens = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var lights = [];
  var animatedObjects = [];
  var gameState = {
    fountainWaterLevel: 0.5,
    topiarySway: 0,
    duskProgress: 0,
    flowerNodeAngle: 0
  };
  var elapsedTime = 0;
  var fountain = null;
  var topiairies = [];
  var lampPosts = [];
  var greenhouse = null;
  var flowers = [];

  function createTopiaryShrubs() {
    var topiary1 = new THREE.Group();
    var boxGeom = new THREE.BoxGeometry(2, 3.5, 2);
    var hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x228B22,
      roughness: 0.8,
      metalness: 0.0
    });
    var topiary1Mesh = new THREE.Mesh(boxGeom, hedgeMat);
    topiary1Mesh.castShadow = true;
    topiary1Mesh.receiveShadow = true;
    topiary1Mesh.position.y = 1.75;
    topiary1.add(topiary1Mesh);
    topiary1.position.set(-8, 0, -15);
    topiary1.topiarySway = 0;
    scene.add(topiary1);
    sceneObjects.push(topiary1);
    topiairies.push(topiary1);

    var topiary2 = new THREE.Group();
    var topiary2Mesh = new THREE.Mesh(boxGeom, hedgeMat.clone());
    topiary2Mesh.castShadow = true;
    topiary2Mesh.receiveShadow = true;
    topiary2Mesh.position.y = 1.75;
    topiary2.add(topiary2Mesh);
    topiary2.position.set(-8, 0, -5);
    topiary2.topiarySway = 0;
    scene.add(topiary2);
    sceneObjects.push(topiary2);
    topiairies.push(topiary2);

    var topiary3 = new THREE.Group();
    var topiary3Mesh = new THREE.Mesh(boxGeom, hedgeMat.clone());
    topiary3Mesh.castShadow = true;
    topiary3Mesh.receiveShadow = true;
    topiary3Mesh.position.y = 1.75;
    topiary3.add(topiary3Mesh);
    topiary3.position.set(-8, 0, 5);
    topiary3.topiarySway = 0;
    scene.add(topiary3);
    sceneObjects.push(topiary3);
    topiairies.push(topiary3);

    var topiary4 = new THREE.Group();
    var topiary4Mesh = new THREE.Mesh(boxGeom, hedgeMat.clone());
    topiary4Mesh.castShadow = true;
    topiary4Mesh.receiveShadow = true;
    topiary4Mesh.position.y = 1.75;
    topiary4.add(topiary4Mesh);
    topiary4.position.set(-8, 0, 15);
    topiary4.topiarySway = 0;
    scene.add(topiary4);
    sceneObjects.push(topiary4);
    topiairies.push(topiary4);

    var topiary5 = new THREE.Group();
    var topiary5Mesh = new THREE.Mesh(boxGeom, hedgeMat.clone());
    topiary5Mesh.castShadow = true;
    topiary5Mesh.receiveShadow = true;
    topiary5Mesh.position.y = 1.75;
    topiary5.add(topiary5Mesh);
    topiary5.position.set(8, 0, -15);
    topiary5.topiarySway = 0;
    scene.add(topiary5);
    sceneObjects.push(topiary5);
    topiairies.push(topiary5);

    var topiary6 = new THREE.Group();
    var topiary6Mesh = new THREE.Mesh(boxGeom, hedgeMat.clone());
    topiary6Mesh.castShadow = true;
    topiary6Mesh.receiveShadow = true;
    topiary6Mesh.position.y = 1.75;
    topiary6.add(topiary6Mesh);
    topiary6.position.set(8, 0, 5);
    topiary6.topiarySway = 0;
    scene.add(topiary6);
    sceneObjects.push(topiary6);
    topiairies.push(topiary6);
  }

  function createMarbleFountain() {
    fountain = new THREE.Group();

    var baseGeom = new THREE.CylinderGeometry(4, 5, 0.8, 32);
    var marbleMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.3,
      metalness: 0.1
    });
    var baseMesh = new THREE.Mesh(baseGeom, marbleMat);
    baseMesh.position.y = 0.4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    fountain.add(baseMesh);

    var poolGeom = new THREE.CylinderGeometry(4.5, 4.5, 0.2, 32);
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0x4488ff,
      emissiveIntensity: 0.3
    });
    var waterMesh = new THREE.Mesh(poolGeom, waterMat);
    waterMesh.position.y = 0.1;
    waterMesh.receiveShadow = true;
    fountain.add(waterMesh);
    fountain.waterMesh = waterMesh;

    var bowlGeom = new THREE.CylinderGeometry(2, 2.5, 1.5, 32);
    var bowlMesh = new THREE.Mesh(bowlGeom, marbleMat.clone());
    bowlMesh.position.y = 2.5;
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    fountain.add(bowlMesh);

    var topBowlGeom = new THREE.CylinderGeometry(1, 1.5, 1, 32);
    var topBowlMesh = new THREE.Mesh(topBowlGeom, marbleMat.clone());
    topBowlMesh.position.y = 4.5;
    topBowlMesh.castShadow = true;
    topBowlMesh.receiveShadow = true;
    fountain.add(topBowlMesh);

    fountain.position.set(0, 0, 0);
    fountain.fountainData = { shimmer: 0, maxShimmer: 0.15 };
    scene.add(fountain);
    sceneObjects.push(fountain);
  }

  function createGreenhouse() {
    greenhouse = new THREE.Group();

    var frameGeom = new THREE.BoxGeometry(8, 6, 5);
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7
    });
    var frameMesh = new THREE.Mesh(frameGeom, frameMat);
    frameMesh.position.set(15, 3, -10);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    greenhouse.add(frameMesh);

    var glassGeom = new THREE.BoxGeometry(8.2, 6.2, 0.1);
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0x87CEEB,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.7
    });
    var frontGlass = new THREE.Mesh(glassGeom, glassMat.clone());
    frontGlass.position.set(15, 3, -7.5);
    frontGlass.receiveShadow = true;
    greenhouse.add(frontGlass);
    greenhouse.frontGlass = frontGlass;

    var sideGlassGeom = new THREE.BoxGeometry(0.1, 6.2, 5.2);
    var sideGlass1 = new THREE.Mesh(sideGlassGeom, glassMat.clone());
    sideGlass1.position.set(11, 3, -10);
    sideGlass1.receiveShadow = true;
    greenhouse.add(sideGlass1);

    var sideGlass2 = new THREE.Mesh(sideGlassGeom, glassMat.clone());
    sideGlass2.position.set(19, 3, -10);
    sideGlass2.receiveShadow = true;
    greenhouse.add(sideGlass2);

    var roofGeom = new THREE.BoxGeometry(8.2, 0.1, 5.2);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(15, 6.1, -10);
    roof.castShadow = true;
    roof.receiveShadow = true;
    greenhouse.add(roof);

    greenhouse.position.set(0, 0, 0);
    greenhouse.greenhouseData = { glassOpacity: 0.7 };
    scene.add(greenhouse);
    sceneObjects.push(greenhouse);
  }

  function createGardenWall() {
    var wallGeom = new THREE.BoxGeometry(30, 4, 0.5);
    var stoneMat = new THREE.MeshStandardMaterial({
      color: 0xA9A9A9,
      roughness: 0.9
    });
    var wallMesh = new THREE.Mesh(wallGeom, stoneMat);
    wallMesh.position.set(0, 2, -25);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
    sceneObjects.push(wallMesh);

    var crenellationGeom = new THREE.BoxGeometry(1, 1.2, 0.5);
    for (var i = -12; i < 13; i += 2.5) {
      var crenellation = new THREE.Mesh(crenellationGeom, stoneMat.clone());
      crenellation.position.set(i, 4.6, -25);
      crenellation.castShadow = true;
      crenellation.receiveShadow = true;
      scene.add(crenellation);
      sceneObjects.push(crenellation);
    }
  }

  function createFlowerBeds() {
    var colors = [0xFF69B4, 0xFFB6C1, 0xFF1493, 0xFF69B4, 0xFFC0CB];
    var positions = [
      [-5, 0, 5],
      [0, 0, 8],
      [5, 0, 5],
      [-3, 0, -8],
      [3, 0, -8]
    ];

    positions.forEach(function(pos, idx) {
      var flowerGroup = new THREE.Group();
      var flowerColor = colors[idx % colors.length];
      var flowerMat = new THREE.MeshStandardMaterial({
        color: flowerColor,
        roughness: 0.6,
        emissive: flowerColor,
        emissiveIntensity: 0.2
      });

      for (var i = 0; i < 3; i++) {
        var flowerGeom = new THREE.SphereGeometry(0.4, 16, 16);
        var flower = new THREE.Mesh(flowerGeom, flowerMat.clone());
        var offsetX = (Math.random() - 0.5) * 1.5;
        var offsetZ = (Math.random() - 0.5) * 1.5;
        flower.position.set(offsetX, 0.5, offsetZ);
        flower.castShadow = true;
        flower.receiveShadow = true;
        flowerGroup.add(flower);
        flowers.push(flower);
      }

      flowerGroup.position.set(pos[0], pos[1], pos[2]);
      flowerGroup.flowerData = { nodeAngle: 0 };
      scene.add(flowerGroup);
      sceneObjects.push(flowerGroup);
      animatedObjects.push(flowerGroup);
    });
  }

  function createGardenPath() {
    var pathGeom = new THREE.BoxGeometry(2, 0.1, 40);
    var pathMat = new THREE.MeshStandardMaterial({
      color: 0xF5F5DC,
      roughness: 0.85
    });
    var pathMesh = new THREE.Mesh(pathGeom, pathMat);
    pathMesh.position.set(0, 0.05, 0);
    pathMesh.receiveShadow = true;
    scene.add(pathMesh);
    sceneObjects.push(pathMesh);

    var tileGeom = new THREE.BoxGeometry(1, 0.08, 1);
    for (var i = -20; i < 20; i += 1) {
      var tile = new THREE.Mesh(tileGeom, pathMat.clone());
      tile.position.set(1.2, 0.04, i);
      tile.receiveShadow = true;
      scene.add(tile);
      sceneObjects.push(tile);
    }
  }

  function createOrnateGate() {
    var gateFrameGeom = new THREE.BoxGeometry(6, 4, 0.3);
    var goldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.3,
      metalness: 0.8
    });
    var gateFrame = new THREE.Mesh(gateFrameGeom, goldMat);
    gateFrame.position.set(-20, 2, 0);
    gateFrame.castShadow = true;
    gateFrame.receiveShadow = true;
    scene.add(gateFrame);
    sceneObjects.push(gateFrame);

    var gateBarGeom = new THREE.BoxGeometry(0.2, 4, 0.3);
    for (var i = -2.5; i < 3; i += 1) {
      var bar = new THREE.Mesh(gateBarGeom, goldMat.clone());
      bar.position.set(-20 + i, 2, 0);
      bar.castShadow = true;
      bar.receiveShadow = true;
      scene.add(bar);
      sceneObjects.push(bar);
    }
  }

  function createBallroomWindows() {
    var windowGeom = new THREE.BoxGeometry(3, 2.5, 0.2);
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0xB0E0E6,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2
    });
    var curtainMat = new THREE.MeshStandardMaterial({
      color: 0x8B0000,
      roughness: 0.7
    });

    var positions = [
      [-18, 3, 18],
      [-10, 3, 18],
      [-2, 3, 18],
      [6, 3, 18]
    ];

    positions.forEach(function(pos) {
      var window = new THREE.Mesh(windowGeom, glassMat.clone());
      window.position.set(pos[0], pos[1], pos[2]);
      window.receiveShadow = true;
      scene.add(window);
      sceneObjects.push(window);

      var curtainGeom = new THREE.BoxGeometry(3.1, 2.6, 0.1);
      var curtain = new THREE.Mesh(curtainGeom, curtainMat.clone());
      curtain.position.set(pos[0], pos[1], pos[2] + 0.15);
      curtain.castShadow = true;
      curtain.receiveShadow = true;
      scene.add(curtain);
      sceneObjects.push(curtain);
    });
  }

  function createServantTunnelHatch() {
    var hatchGeom = new THREE.BoxGeometry(2, 0.3, 2);
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.7
    });
    var hatch = new THREE.Mesh(hatchGeom, metalMat);
    hatch.position.set(12, 0.15, -18);
    hatch.receiveShadow = true;
    hatch.castShadow = true;
    scene.add(hatch);
    sceneObjects.push(hatch);

    var handleGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 16);
    var handle = new THREE.Mesh(handleGeom, metalMat.clone());
    handle.rotation.z = Math.PI / 2;
    handle.position.set(12, 0.5, -18);
    handle.castShadow = true;
    handle.receiveShadow = true;
    scene.add(handle);
    sceneObjects.push(handle);
  }

  function createRoseTrellis() {
    var trellisGeom = new THREE.BoxGeometry(0.1, 4, 0.1);
    var woodMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8
    });
    var verticalTrellis = new THREE.Mesh(trellisGeom, woodMat);
    verticalTrellis.position.set(-18, 2, 5);
    verticalTrellis.castShadow = true;
    verticalTrellis.receiveShadow = true;
    scene.add(verticalTrellis);
    sceneObjects.push(verticalTrellis);

    var horizontalGeom = new THREE.BoxGeometry(2.5, 0.1, 0.1);
    for (var i = 0; i < 6; i++) {
      var horizontal = new THREE.Mesh(horizontalGeom, woodMat.clone());
      horizontal.position.set(-18, 0.5 + i * 0.6, 5);
      horizontal.castShadow = true;
      horizontal.receiveShadow = true;
      scene.add(horizontal);
      sceneObjects.push(horizontal);
    }

    var lines = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-18, 0, 5),
        new THREE.Vector3(-18, 4, 5)
      ]),
      new THREE.LineBasicMaterial({ color: 0xFF69B4, linewidth: 2 })
    );
    scene.add(lines);
    sceneObjects.push(lines);
  }

  function createStoneStatue() {
    var baseGeom = new THREE.CylinderGeometry(0.6, 0.8, 0.4, 16);
    var stoneMat = new THREE.MeshStandardMaterial({
      color: 0xA9A9A9,
      roughness: 0.9
    });
    var base = new THREE.Mesh(baseGeom, stoneMat);
    base.position.set(15, 0.2, 5);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    sceneObjects.push(base);

    var bodyGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
    var body = new THREE.Mesh(bodyGeom, stoneMat.clone());
    body.position.set(15, 1.2, 5);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push(body);

    var headGeom = new THREE.SphereGeometry(0.35, 16, 16);
    var head = new THREE.Mesh(headGeom, stoneMat.clone());
    head.position.set(15, 2.2, 5);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    sceneObjects.push(head);
  }

  function createGardenBench() {
    var seatGeom = new THREE.BoxGeometry(3, 0.3, 0.8);
    var woodMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8
    });
    var seat = new THREE.Mesh(seatGeom, woodMat);
    seat.position.set(10, 0.5, -5);
    seat.castShadow = true;
    seat.receiveShadow = true;
    scene.add(seat);
    sceneObjects.push(seat);

    var legGeom = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    var legPositions = [
      [-1.2, 0.25, -0.3],
      [1.2, 0.25, -0.3],
      [-1.2, 0.25, 0.3],
      [1.2, 0.25, 0.3]
    ];

    legPositions.forEach(function(pos) {
      var leg = new THREE.Mesh(legGeom, woodMat.clone());
      leg.position.set(10 + pos[0], pos[1], -5 + pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
      sceneObjects.push(leg);
    });

    var backGeom = new THREE.BoxGeometry(3, 1.2, 0.2);
    var back = new THREE.Mesh(backGeom, woodMat.clone());
    back.position.set(10, 1.2, -5.5);
    back.castShadow = true;
    back.receiveShadow = true;
    scene.add(back);
    sceneObjects.push(back);
  }

  function createOrnamentalLampPosts() {
    var positions = [
      [-15, 0, 10],
      [-10, 0, -15],
      [5, 0, 12],
      [15, 0, -12]
    ];

    positions.forEach(function(pos) {
      var lampGroup = new THREE.Group();

      var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 16);
      var metalMat = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        roughness: 0.3,
        metalness: 0.8
      });
      var pole = new THREE.Mesh(poleGeom, metalMat);
      pole.position.y = 1.75;
      pole.castShadow = true;
      pole.receiveShadow = true;
      lampGroup.add(pole);

      var bulbGeom = new THREE.SphereGeometry(0.25, 16, 16);
      var bulbMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFCC,
        roughness: 0.4,
        emissive: 0xFFFFCC,
        emissiveIntensity: 0.6
      });
      var bulb = new THREE.Mesh(bulbGeom, bulbMat);
      bulb.position.y = 3.6;
      bulb.castShadow = true;
      bulb.receiveShadow = true;
      lampGroup.add(bulb);

      var lanternGeom = new THREE.BoxGeometry(0.6, 0.8, 0.6);
      var lantern = new THREE.Mesh(lanternGeom, metalMat.clone());
      lantern.position.y = 3.5;
      lantern.castShadow = true;
      lantern.receiveShadow = true;
      lampGroup.add(lantern);

      lampGroup.position.set(pos[0], pos[1], pos[2]);
      lampGroup.lampData = { flicker: 0, intensity: 0.8 };
      scene.add(lampGroup);
      sceneObjects.push(lampGroup);
      lampPosts.push(lampGroup);
      animatedObjects.push(lampGroup);
    });
  }

  function updateFountain(delta) {
    if (!fountain || !fountain.waterMesh) return;

    fountain.fountainData.shimmer += delta * 3;
    var shimmerAmount = Math.sin(fountain.fountainData.shimmer) * fountain.fountainData.maxShimmer;
    fountain.waterMesh.material.emissiveIntensity = 0.3 + shimmerAmount;
    fountain.waterMesh.position.y = 0.1 + shimmerAmount * 0.1;
  }

  function updateTopiary(delta) {
    topiairies.forEach(function(topiary, idx) {
      topiary.topiarySway = Math.sin(elapsedTime * 0.5 + idx * 0.5) * 0.03;
      topiary.rotation.z = topiary.topiarySway;
    });
  }

  function updateLampPosts(delta) {
    lampPosts.forEach(function(lamp) {
      lamp.lampData.flicker = Math.sin(elapsedTime * 2.5) * 0.2;
      var bulbs = lamp.children.filter(function(child) {
        return child.material && child.material.emissive;
      });
      bulbs.forEach(function(bulb) {
        bulb.material.emissiveIntensity = Math.max(0.2, 0.6 + lamp.lampData.flicker);
      });
    });
  }

  function updateGreenhouse(delta) {
    if (!greenhouse || !greenhouse.frontGlass) return;

    greenhouse.greenhouseData.glassOpacity = 0.7 + Math.sin(elapsedTime * 1.5) * 0.2;
    greenhouse.frontGlass.material.opacity = greenhouse.greenhouseData.glassOpacity;
  }

  function updateFlowers(delta) {
    flowers.forEach(function(flower, idx) {
      var nodeAngle = Math.sin(elapsedTime * 1.2 + idx * 0.5) * 0.15;
      flower.rotation.x = nodeAngle;
      flower.rotation.z = Math.cos(elapsedTime * 1.0 + idx * 0.3) * 0.1;
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0xB0E0E6, 0.05);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);
    lights.push(directionalLight);

    var groundGeom = new THREE.BoxGeometry(50, 0.2, 50);
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x228B22,
      roughness: 0.9
    });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);

    createTopiaryShrubs();
    createMarbleFountain();
    createGreenhouse();
    createGardenWall();
    createFlowerBeds();
    createGardenPath();
    createOrnateGate();
    createBallroomWindows();
    createServantTunnelHatch();
    createRoseTrellis();
    createStoneStatue();
    createGardenBench();
    createOrnamentalLampPosts();
  }

  function update(delta) {
    elapsedTime += delta;

    updateFountain(delta);
    updateTopiary(delta);
    updateLampPosts(delta);
    updateGreenhouse(delta);
    updateFlowers(delta);
  }

  function reset() {
    sceneObjects.forEach(function(obj) {
      if (obj.children && obj.children.length > 0) {
        obj.children.forEach(function(child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(function(mat) { mat.dispose(); });
            } else {
              child.material.dispose();
            }
          }
        });
      }
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    lights.forEach(function(light) {
      scene.remove(light);
    });

    sceneObjects = [];
    lights = [];
    animatedObjects = [];
    topiairies = [];
    lampPosts = [];
    flowers = [];
    fountain = null;
    greenhouse = null;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
