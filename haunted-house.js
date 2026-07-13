window.HauntedHouse = (function() {
  'use strict';

  var scene, camera;
  var mansion, turret, library, chandelier, candelabras, graveyard;
  var secretPassage, floatingBooks, portraits, ritualMarking;
  var chandTime = 0, candleTime = 0, bookTime = 0, portraitTime = 0, ritualTime = 0;

  var colors = {
    stone: 0x4a4a4a,
    wood: 0x8b6f47,
    brick: 0x8b4513,
    cobweb: 0xcccccc,
    copper: 0xb87333,
    gold: 0xffd700,
    flame: 0xff6b1a,
    dark: 0x1a1a1a
  };

  function createMansionExterior() {
    var group = new THREE.Group();
    var mainBodyGeo = new THREE.BoxGeometry(40, 35, 50);
    var mainBodyMat = new THREE.MeshStandardMaterial({ color: colors.brick });
    var mainBody = new THREE.Mesh(mainBodyGeo, mainBodyMat);
    mainBody.position.set(0, 17, 0);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);

    var roofGeo = new THREE.ConeGeometry(28, 12, 4);
    var roofMat = new THREE.MeshStandardMaterial({ color: colors.dark });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 35, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    var dormer1Geo = new THREE.BoxGeometry(8, 6, 6);
    var dormer1 = new THREE.Mesh(dormer1Geo, mainBodyMat);
    dormer1.position.set(-12, 32, 15);
    dormer1.castShadow = true;
    group.add(dormer1);

    var dormer1RoofGeo = new THREE.ConeGeometry(6, 5, 4);
    var dormer1Roof = new THREE.Mesh(dormer1RoofGeo, roofMat);
    dormer1Roof.position.set(-12, 37, 15);
    dormer1Roof.rotation.y = Math.PI / 4;
    dormer1Roof.scale.set(1, 0.8, 1);
    group.add(dormer1Roof);

    var dormer2Geo = new THREE.BoxGeometry(8, 6, 6);
    var dormer2 = new THREE.Mesh(dormer2Geo, mainBodyMat);
    dormer2.position.set(12, 32, 15);
    dormer2.castShadow = true;
    group.add(dormer2);

    var dormer2RoofGeo = new THREE.ConeGeometry(6, 5, 4);
    var dormer2Roof = new THREE.Mesh(dormer2RoofGeo, roofMat);
    dormer2Roof.position.set(12, 37, 15);
    dormer2Roof.rotation.y = Math.PI / 4;
    dormer2Roof.scale.set(1, 0.8, 1);
    group.add(dormer2Roof);

    return group;
  }

  function createTurret() {
    var group = new THREE.Group();
    var cylinderGeo = new THREE.CylinderGeometry(8, 8, 40, 8);
    var stoneMat = new THREE.MeshStandardMaterial({ color: colors.stone });
    var tower = new THREE.Mesh(cylinderGeo, stoneMat);
    tower.position.set(25, 20, -15);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    var capGeo = new THREE.ConeGeometry(9, 8, 8);
    var capMat = new THREE.MeshStandardMaterial({ color: colors.copper });
    var cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(25, 44, -15);
    cap.castShadow = true;
    group.add(cap);

    var battlementGeo = new THREE.BoxGeometry(16, 3, 1);
    var battlement = new THREE.Mesh(battlementGeo, stoneMat);
    battlement.position.set(25, 42, -8);
    battlement.castShadow = true;
    group.add(battlement);

    return group;
  }

  function createGrandStaircase() {
    var group = new THREE.Group();
    var woodMat = new THREE.MeshStandardMaterial({ color: colors.wood });
    var numSteps = 10;
    var stepWidth = 6;
    var stepHeight = 2;
    var stepDepth = 4;

    for (var i = 0; i < numSteps; i++) {
      var stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      var step = new THREE.Mesh(stepGeo, woodMat);
      step.position.set(-20, 2 + i * stepHeight, -20 + i * stepDepth);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);
    }

    var banisterPoints = [];
    for (var j = 0; j <= numSteps; j++) {
      banisterPoints.push(new THREE.Vector3(-17, 4 + j * stepHeight, -20 + j * stepDepth));
      banisterPoints.push(new THREE.Vector3(-17, 10 + j * stepHeight, -20 + j * stepDepth));
    }

    var banisterGeo = new THREE.BufferGeometry().setFromPoints(banisterPoints);
    var banisterMat = new THREE.LineBasicMaterial({ color: colors.gold, linewidth: 2 });
    var banister = new THREE.LineSegments(banisterGeo, banisterMat);
    group.add(banister);

    return group;
  }

  function createLibrary() {
    var group = new THREE.Group();
    var shelfMat = new THREE.MeshStandardMaterial({ color: colors.wood });
    var bookMat = new THREE.MeshStandardMaterial({ color: 0xaa0000 });

    var wallGeo = new THREE.BoxGeometry(20, 30, 2);
    var wall = new THREE.Mesh(wallGeo, shelfMat);
    wall.position.set(-30, 15, 20);
    wall.castShadow = true;
    group.add(wall);

    var shelfHeight = 24;
    var shelfSpacing = 4;
    var numShelves = 6;

    for (var s = 0; s < numShelves; s++) {
      var shelfGeo = new THREE.BoxGeometry(18, 0.5, 1.5);
      var shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(-30, 5 + s * shelfSpacing, 20);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      group.add(shelf);

      var numBooks = 12;
      for (var b = 0; b < numBooks; b++) {
        var bookGeo = new THREE.BoxGeometry(0.8, 2.5, 1.2);
        var book = new THREE.Mesh(bookGeo, bookMat);
        var xPos = -37 + b * 1.4;
        book.position.set(xPos, 6 + s * shelfSpacing, 20);
        book.castShadow = true;
        book.userData = { baseY: 6 + s * shelfSpacing, floatAmount: Math.random() * 0.3, phase: Math.random() * Math.PI * 2 };
        group.add(book);
        if (!floatingBooks) floatingBooks = [];
        floatingBooks.push(book);
      }
    }

    return group;
  }

  function createCobwebs() {
    var group = new THREE.Group();
    var webMat = new THREE.LineBasicMaterial({ color: colors.cobweb, linewidth: 1 });

    var corners = [
      { pos: new THREE.Vector3(-20, 30, -20), scale: 1 },
      { pos: new THREE.Vector3(20, 30, -20), scale: 1 },
      { pos: new THREE.Vector3(-20, 30, 20), scale: 1 },
      { pos: new THREE.Vector3(20, 30, 20), scale: 1 }
    ];

    for (var c = 0; c < corners.length; c++) {
      var corner = corners[c];
      var points = [];
      var rings = 6;
      var rays = 8;

      for (var r = 0; r < rings; r++) {
        var radius = r * 1.5;
        for (var ray = 0; ray < rays; ray++) {
          var angle = (ray / rays) * Math.PI * 2;
          var x = Math.cos(angle) * radius;
          var y = -r * 0.8;
          var z = Math.sin(angle) * radius;
          points.push(new THREE.Vector3(x, y, z));

          if (r < rings - 1) {
            var nextRadius = (r + 1) * 1.5;
            var nextAngle = (ray / rays) * Math.PI * 2;
            var nextX = Math.cos(nextAngle) * nextRadius;
            var nextY = -(r + 1) * 0.8;
            var nextZ = Math.sin(nextAngle) * nextRadius;
            points.push(new THREE.Vector3(nextX, nextY, nextZ));
          }
        }
      }

      for (var p = 0; p < rays; p++) {
        var angle = (p / rays) * Math.PI * 2;
        for (var d = 0; d < rings; d++) {
          var radius = d * 1.5;
          var x = Math.cos(angle) * radius;
          var y = -d * 0.8;
          var z = Math.sin(angle) * radius;
          points.push(new THREE.Vector3(x, y, z));

          var nextD = d + 1;
          var nextRadius = nextD * 1.5;
          var nextX = Math.cos(angle) * nextRadius;
          var nextY = -nextD * 0.8;
          var nextZ = Math.sin(angle) * nextRadius;
          points.push(new THREE.Vector3(nextX, nextY, nextZ));
        }
      }

      var webGeo = new THREE.BufferGeometry().setFromPoints(points);
      var web = new THREE.LineSegments(webGeo, webMat);
      web.position.copy(corner.pos);
      web.scale.multiplyScalar(corner.scale);
      group.add(web);
    }

    return group;
  }

  function createChandelier() {
    var group = new THREE.Group();
    var chainGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 4);
    var metalMat = new THREE.MeshStandardMaterial({ color: colors.copper, metalness: 0.9 });
    var chain = new THREE.Mesh(chainGeo, metalMat);
    chain.position.set(0, 25, 0);
    chain.castShadow = true;
    group.add(chain);

    var crystalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2 });
    var numCrystals = 12;
    for (var i = 0; i < numCrystals; i++) {
      var angle = (i / numCrystals) * Math.PI * 2;
      var x = Math.cos(angle) * 4;
      var z = Math.sin(angle) * 4;
      var crystalGeo = new THREE.SphereGeometry(0.6, 8, 8);
      var crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(x, 19, z);
      crystal.castShadow = true;
      group.add(crystal);
    }

    var centerGeo = new THREE.SphereGeometry(1.2, 8, 8);
    var center = new THREE.Mesh(centerGeo, crystalMat);
    center.position.set(0, 18, 0);
    center.castShadow = true;
    group.add(center);

    chandelier.userData = { baseY: 21, swayAmount: 1.5 };

    return group;
  }

  function createCandelabras() {
    var group = new THREE.Group();
    var positions = [
      { x: -15, z: -10 },
      { x: 15, z: -10 },
      { x: -15, z: 10 },
      { x: 15, z: 10 }
    ];

    for (var p = 0; p < positions.length; p++) {
      var pos = positions[p];
      var standGeo = new THREE.CylinderGeometry(1, 1.5, 6, 8);
      var metalMat = new THREE.MeshStandardMaterial({ color: colors.copper, metalness: 0.8 });
      var stand = new THREE.Mesh(standGeo, metalMat);
      stand.position.set(pos.x, 3, pos.z);
      stand.castShadow = true;
      group.add(stand);

      var flameGeo = new THREE.SphereGeometry(0.5, 6, 6);
      var flameMat = new THREE.MeshStandardMaterial({ color: colors.flame, emissive: colors.flame });
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(pos.x, 6.5, pos.z);
      flame.castShadow = true;
      flame.userData = { baseColor: colors.flame, flickerPhase: Math.random() * Math.PI * 2 };
      group.add(flame);
      if (!candelabras) candelabras = [];
      candelabras.push(flame);
    }

    return group;
  }

  function createSecretPassage() {
    var group = new THREE.Group();
    var shelfGeo = new THREE.BoxGeometry(4, 8, 2);
    var woodMat = new THREE.MeshStandardMaterial({ color: colors.wood });
    var bookShelf = new THREE.Mesh(shelfGeo, woodMat);
    bookShelf.position.set(-35, 4, -30);
    bookShelf.castShadow = true;
    bookShelf.userData = { baseRotation: 0, targetRotation: 0, rotating: false };
    group.add(bookShelf);

    var corridorGeo = new THREE.BoxGeometry(3, 8, 20);
    var stoneMat = new THREE.MeshStandardMaterial({ color: colors.stone });
    var corridor = new THREE.Mesh(corridorGeo, stoneMat);
    corridor.position.set(-35, 4, -25);
    corridor.castShadow = true;
    corridor.receiveShadow = true;
    group.add(corridor);

    secretPassage = { shelf: bookShelf, corridor: corridor };

    return group;
  }

  function createPortraits() {
    var group = new THREE.Group();
    var frameColor = colors.gold;
    var canvasColor = 0x1a0000;
    var portraitList = [];

    var positions = [
      { x: -18, z: -25, rot: 0 },
      { x: 18, z: -25, rot: 0 },
      { x: -18, z: 25, rot: 0 },
      { x: 18, z: 25, rot: 0 },
      { x: -25, z: 0, rot: Math.PI / 2 },
      { x: 25, z: 0, rot: Math.PI / 2 }
    ];

    for (var p = 0; p < positions.length; p++) {
      var pos = positions[p];
      var frameGeo = new THREE.BoxGeometry(3, 4, 0.2);
      var frameMat = new THREE.MeshStandardMaterial({ color: frameColor });
      var frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(pos.x, 15, pos.z);
      frame.rotation.y = pos.rot;
      frame.castShadow = true;

      var canvasGeo = new THREE.BoxGeometry(2.5, 3.5, 0.1);
      var canvasMat = new THREE.MeshStandardMaterial({ color: canvasColor });
      var canvas = new THREE.Mesh(canvasGeo, canvasMat);
      canvas.position.z += 0.1;
      frame.add(canvas);

      frame.userData = { basePos: pos, shiftAmount: 0.4, phase: Math.random() * Math.PI * 2 };
      group.add(frame);
      portraitList.push(frame);
    }

    portraits = portraitList;

    return group;
  }

  function createGraveyard() {
    var group = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ color: colors.stone });
    var metalMat = new THREE.MeshStandardMaterial({ color: colors.copper, metalness: 0.9 });

    var numTombstones = 15;
    for (var t = 0; t < numTombstones; t++) {
      var x = (Math.random() - 0.5) * 50;
      var z = 40 + Math.random() * 20;
      var angle = Math.random() * Math.PI * 0.3 - Math.PI * 0.15;

      var tombGeo = new THREE.BoxGeometry(1.5, 3, 0.3);
      var tomb = new THREE.Mesh(tombGeo, stoneMat);
      tomb.position.set(x, 1.5, z);
      tomb.rotation.x = angle;
      tomb.castShadow = true;
      tomb.receiveShadow = true;
      group.add(tomb);

      var crossGeo = new THREE.BoxGeometry(0.2, 2.5, 0.1);
      var crossVertical = new THREE.Mesh(crossGeo, metalMat);
      crossVertical.position.set(x, 2.5, z - 0.2);
      crossVertical.castShadow = true;
      group.add(crossVertical);

      var crossHorizGeo = new THREE.BoxGeometry(1.2, 0.2, 0.1);
      var crossHoriz = new THREE.Mesh(crossHorizGeo, metalMat);
      crossHoriz.position.set(x, 3, z - 0.2);
      crossHoriz.castShadow = true;
      group.add(crossHoriz);
    }

    var numFencePosts = 12;
    for (var f = 0; f < numFencePosts; f++) {
      var angle = (f / numFencePosts) * Math.PI * 2;
      var fx = Math.cos(angle) * 35;
      var fz = 45 + Math.sin(angle) * 15;

      var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 4, 6);
      var post = new THREE.Mesh(postGeo, metalMat);
      post.position.set(fx, 2, fz);
      post.castShadow = true;
      group.add(post);

      if (f < numFencePosts - 1) {
        var nextAngle = ((f + 1) / numFencePosts) * Math.PI * 2;
        var nextFx = Math.cos(nextAngle) * 35;
        var nextFz = 45 + Math.sin(nextAngle) * 15;
        var railPoints = [
          new THREE.Vector3(fx, 2.5, fz),
          new THREE.Vector3(nextFx, 2.5, nextFz)
        ];
        var railGeo = new THREE.BufferGeometry().setFromPoints(railPoints);
        var railMat = new THREE.LineBasicMaterial({ color: colors.copper, linewidth: 2 });
        var rail = new THREE.LineSegments(railGeo, railMat);
        group.add(rail);
      }
    }

    return group;
  }

  function createCellar() {
    var group = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ color: colors.dark });

    var floorGeo = new THREE.BoxGeometry(40, 1, 40);
    var floor = new THREE.Mesh(floorGeo, stoneMat);
    floor.position.set(0, -25, 0);
    floor.receiveShadow = true;
    group.add(floor);

    var wallMat = new THREE.MeshStandardMaterial({ color: colors.stone });
    var walls = [
      { geo: new THREE.BoxGeometry(40, 15, 1), pos: new THREE.Vector3(0, -17, -20) },
      { geo: new THREE.BoxGeometry(40, 15, 1), pos: new THREE.Vector3(0, -17, 20) },
      { geo: new THREE.BoxGeometry(1, 15, 40), pos: new THREE.Vector3(-20, -17, 0) },
      { geo: new THREE.BoxGeometry(1, 15, 40), pos: new THREE.Vector3(20, -17, 0) }
    ];

    for (var w = 0; w < walls.length; w++) {
      var wallData = walls[w];
      var wall = new THREE.Mesh(wallData.geo, wallMat);
      wall.position.copy(wallData.pos);
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
    }

    var numCircles = 3;
    for (var c = 0; c < numCircles; c++) {
      var radius = 8 + c * 4;
      var points = [];
      var segments = 32;
      for (var s = 0; s <= segments; s++) {
        var angle = (s / segments) * Math.PI * 2;
        var x = Math.cos(angle) * radius;
        var z = Math.sin(angle) * radius;
        points.push(new THREE.Vector3(x, -24, z));
        if (s < segments) {
          points.push(new THREE.Vector3(Math.cos((s + 1) / segments * Math.PI * 2) * radius, -24, Math.sin((s + 1) / segments * Math.PI * 2) * radius));
        }
      }
      var circleGeo = new THREE.BufferGeometry().setFromPoints(points);
      var circleMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 1 });
      var circle = new THREE.LineSegments(circleGeo, circleMat);
      circle.userData = { baseColor: 0xff0000, glowPhase: Math.random() * Math.PI * 2 };
      group.add(circle);
      if (!ritualMarking) ritualMarking = [];
      ritualMarking.push(circle);
    }

    return group;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    var light = new THREE.DirectionalLight(0xffffff, 0.6);
    light.position.set(20, 30, 20);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.left = -50;
    light.shadow.camera.right = 50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    var fog = new THREE.Fog(0x0a0a0a, 100, 150);
    scene.fog = fog;

    mansion = createMansionExterior();
    scene.add(mansion);

    turret = createTurret();
    scene.add(turret);

    var staircase = createGrandStaircase();
    scene.add(staircase);

    library = createLibrary();
    scene.add(library);

    var cobwebs = createCobwebs();
    scene.add(cobwebs);

    chandelier = createChandelier();
    scene.add(chandelier);

    var candelabraGroup = createCandelabras();
    scene.add(candelabraGroup);

    var secretPassageGroup = createSecretPassage();
    scene.add(secretPassageGroup);

    var portraitGroup = createPortraits();
    scene.add(portraitGroup);

    graveyard = createGraveyard();
    scene.add(graveyard);

    var cellar = createCellar();
    scene.add(cellar);
  }

  function update(delta) {
    if (!scene) return;

    chandTime += delta;
    var swayOffset = Math.sin(chandTime * 0.5) * (chandelier.userData ? chandelier.userData.swayAmount : 0);
    if (chandelier) {
      chandelier.position.x = swayOffset;
    }

    candleTime += delta;
    if (candelabras && candelabras.length > 0) {
      for (var c = 0; c < candelabras.length; c++) {
        var flame = candelabras[c];
        var flicker = Math.sin(candleTime * 8 + flame.userData.flickerPhase) * 0.15;
        var baseColor = new THREE.Color(flame.userData.baseColor);
        baseColor.multiplyScalar(0.85 + flicker);
        flame.material.color.copy(baseColor);
        flame.scale.y = 1 + flicker * 0.5;
      }
    }

    bookTime += delta;
    if (floatingBooks && floatingBooks.length > 0) {
      for (var b = 0; b < floatingBooks.length; b++) {
        var book = floatingBooks[b];
        var floatY = Math.sin(bookTime * 1.5 + book.userData.phase) * book.userData.floatAmount;
        book.position.y = book.userData.baseY + floatY;
      }
    }

    portraitTime += delta;
    if (portraits && portraits.length > 0) {
      for (var p = 0; p < portraits.length; p++) {
        var portrait = portraits[p];
        var shift = Math.sin(portraitTime * 0.8 + portrait.userData.phase) * portrait.userData.shiftAmount;
        var basePos = portrait.userData.basePos;
        portrait.position.x = basePos.x + shift;
      }
    }

    ritualTime += delta;
    if (ritualMarking && ritualMarking.length > 0) {
      for (var r = 0; r < ritualMarking.length; r++) {
        var circle = ritualMarking[r];
        var glowIntensity = 0.4 + Math.sin(ritualTime * 2 + circle.userData.glowPhase) * 0.6;
        var glowColor = new THREE.Color(circle.userData.baseColor);
        glowColor.multiplyScalar(glowIntensity);
        circle.material.color.copy(glowColor);
      }
    }
  }

  function reset() {
    chandTime = 0;
    candleTime = 0;
    bookTime = 0;
    portraitTime = 0;
    ritualTime = 0;

    if (floatingBooks) {
      for (var b = 0; b < floatingBooks.length; b++) {
        floatingBooks[b].position.y = floatingBooks[b].userData.baseY;
      }
    }

    if (portraits) {
      for (var p = 0; p < portraits.length; p++) {
        portraits[p].position.x = portraits[p].userData.basePos.x;
      }
    }

    if (chandelier) {
      chandelier.position.x = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
