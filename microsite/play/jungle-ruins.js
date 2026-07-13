window.JungleRuins = (function() {
  'use strict';

  var scene, camera;
  var pyramid, serpents, vines, camp, equipment, trees;
  var vineAnimationTime = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildPyramid();
    buildSerpentHeads();
    buildVines();
    buildCamp();
    buildEquipment();
    buildTrees();
  };

  var buildPyramid = function() {
    pyramid = new THREE.Group();

    var tierColors = [0x8B6914, 0x9D7B1F, 0xB8860B];
    var tierHeights = [6, 4, 2];
    var tierWidths = [24, 16, 8];
    var yOffset = 0;

    for (var i = 0; i < 3; i++) {
      var geometry = new THREE.BoxGeometry(tierWidths[i], tierHeights[i], tierWidths[i]);
      var material = new THREE.MeshStandardMaterial({ color: tierColors[i], roughness: 0.8, metalness: 0.2 });
      var tier = new THREE.Mesh(geometry, material);
      tier.position.y = yOffset + tierHeights[i] / 2;
      tier.castShadow = true;
      tier.receiveShadow = true;
      pyramid.add(tier);

      yOffset += tierHeights[i];

      var stoneColor = tierColors[i];
      var detailGeo = new THREE.BoxGeometry(tierWidths[i] * 0.9, 0.5, tierWidths[i] * 0.9);
      var detailMat = new THREE.MeshStandardMaterial({ color: stoneColor - 0x1a1a1a, roughness: 0.9 });
      var detail = new THREE.Mesh(detailGeo, detailMat);
      detail.position.y = tier.position.y + tierHeights[i] / 2 + 0.3;
      detail.castShadow = true;
      detail.receiveShadow = true;
      pyramid.add(detail);
    }

    pyramid.position.set(0, 0, -40);
    scene.add(pyramid);
  };

  var buildSerpentHeads = function() {
    serpents = new THREE.Group();

    var headPositions = [
      { x: -12, z: -28 },
      { x: 12, z: -28 },
      { x: -8, z: -48 },
      { x: 8, z: -48 }
    ];

    for (var i = 0; i < headPositions.length; i++) {
      var headGroup = new THREE.Group();

      var headGeo = new THREE.SphereGeometry(1.5, 8, 8);
      var stoneMat = new THREE.MeshStandardMaterial({ color: 0x6B5B3F, roughness: 0.85 });
      var head = new THREE.Mesh(headGeo, stoneMat);
      head.castShadow = true;
      head.receiveShadow = true;
      headGroup.add(head);

      var jawGeo = new THREE.BoxGeometry(2.8, 1, 1.2);
      var jaw = new THREE.Mesh(jawGeo, stoneMat);
      jaw.position.z = -1.2;
      jaw.castShadow = true;
      jaw.receiveShadow = true;
      headGroup.add(jaw);

      for (var f = 0; f < 4; f++) {
        var fangGeo = new THREE.ConeGeometry(0.4, 1.2, 6);
        var fangMat = new THREE.MeshStandardMaterial({ color: 0x4A4A3A });
        var fang = new THREE.Mesh(fangGeo, fangMat);
        fang.position.set(-0.6 + f * 0.5, -1, -1.5);
        fang.castShadow = true;
        fang.receiveShadow = true;
        headGroup.add(fang);
      }

      headGroup.position.set(headPositions[i].x, 2.5, headPositions[i].z);
      serpents.add(headGroup);
    }

    scene.add(serpents);
  };

  var buildVines = function() {
    vines = new THREE.Group();

    var vineCount = 12;
    for (var v = 0; v < vineCount; v++) {
      var points = [];
      var xStart = -20 + (v % 6) * 7;
      var zStart = -20 - Math.floor(v / 6) * 8;

      points.push(new THREE.Vector3(xStart, 12, zStart));

      for (var p = 1; p < 8; p++) {
        var factor = p / 7;
        var sway = Math.sin(v * 0.5) * (1 - factor) * 3;
        points.push(new THREE.Vector3(xStart + sway, 12 - p * 1.5, zStart));
      }

      var vineGeo = new THREE.BufferGeometry().setFromPoints(points);
      var vineMat = new THREE.LineBasicMaterial({ color: 0x2D5A1E, linewidth: 2 });
      var vine = new THREE.Line(vineGeo, vineMat);
      vines.add(vine);
    }

    scene.add(vines);
  };

  var buildCamp = function() {
    camp = new THREE.Group();

    var tentPositions = [
      { x: -15, z: -8 },
      { x: -5, z: -8 },
      { x: 5, z: -8 },
      { x: 15, z: -8 }
    ];

    for (var t = 0; t < tentPositions.length; t++) {
      var tentGroup = new THREE.Group();

      var roofGeo = new THREE.ConeGeometry(3, 2.5, 4);
      var canvasMat = new THREE.MeshStandardMaterial({ color: 0xC9A961, roughness: 0.7 });
      var roof = new THREE.Mesh(roofGeo, canvasMat);
      roof.position.y = 1.25;
      roof.castShadow = true;
      roof.receiveShadow = true;
      tentGroup.add(roof);

      var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8);
      var poleMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.25;
      pole.castShadow = true;
      pole.receiveShadow = true;
      tentGroup.add(pole);

      var cotGeo = new THREE.BoxGeometry(2, 0.3, 1);
      var cotMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
      var cot = new THREE.Mesh(cotGeo, cotMat);
      cot.position.set(0, 0.15, 0.8);
      cot.castShadow = true;
      cot.receiveShadow = true;
      tentGroup.add(cot);

      tentGroup.position.set(tentPositions[t].x, 0, tentPositions[t].z);
      camp.add(tentGroup);
    }

    var cratePositions = [
      { x: -18, z: -5 },
      { x: 18, z: -5 },
      { x: -15, z: 5 },
      { x: 15, z: 5 }
    ];

    for (var c = 0; c < cratePositions.length; c++) {
      var crateGeo = new THREE.BoxGeometry(2.5, 2, 2);
      var crateMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(cratePositions[c].x, 1, cratePositions[c].z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      camp.add(crate);
    }

    scene.add(camp);
  };

  var buildEquipment = function() {
    equipment = new THREE.Group();

    var vehicleGroup = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(6, 2.5, 3);
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, metalness: 0.8, roughness: 0.3 });
    var body = new THREE.Mesh(bodyGeo, metalMat);
    body.position.y = 1.5;
    body.castShadow = true;
    body.receiveShadow = true;
    vehicleGroup.add(body);

    for (var w = 0; w < 4; w++) {
      var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      var xPos = (w < 2 ? -2 : 2);
      var zPos = (w % 2 === 0 ? -1.2 : 1.2);
      wheel.position.set(xPos, 0.8, zPos);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      vehicleGroup.add(wheel);
    }

    vehicleGroup.position.set(10, 0, 15);
    equipment.add(vehicleGroup);

    var surveySticksX = [-20, -10, 0, 10, 20];
    var surveySticksZ = [10, 15, 20, 25];

    for (var sx = 0; sx < surveySticksX.length; sx++) {
      for (var sz = 0; sz < surveySticksZ.length; sz++) {
        var stakeGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 6);
        var stakeMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
        var stake = new THREE.Mesh(stakeGeo, stakeMat);
        stake.position.set(surveySticksX[sx], 1, surveySticksZ[sz]);
        stake.castShadow = true;
        stake.receiveShadow = true;
        equipment.add(stake);
      }
    }

    scene.add(equipment);
  };

  var buildTrees = function() {
    trees = new THREE.Group();

    var treePositions = [
      { x: -25, z: -30 },
      { x: -20, z: -50 },
      { x: 25, z: -35 },
      { x: 22, z: -55 },
      { x: -28, z: 10 },
      { x: 28, z: 15 },
      { x: -30, z: -10 },
      { x: 30, z: 5 }
    ];

    for (var tr = 0; tr < treePositions.length; tr++) {
      var trunkGeo = new THREE.CylinderGeometry(0.8, 1.2, 14, 12);
      var barkMat = new THREE.MeshStandardMaterial({ color: 0x3A2F1F, roughness: 0.95 });
      var trunk = new THREE.Mesh(trunkGeo, barkMat);
      trunk.position.set(treePositions[tr].x, 7, treePositions[tr].z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      trees.add(trunk);

      var foliageGeo = new THREE.SphereGeometry(6, 8, 8);
      var leafMat = new THREE.MeshStandardMaterial({ color: 0x1B4D2E, roughness: 0.8 });
      var foliage = new THREE.Mesh(foliageGeo, leafMat);
      foliage.position.set(treePositions[tr].x, 12, treePositions[tr].z);
      foliage.scale.set(1.2, 1.4, 1.2);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      trees.add(foliage);
    }

    scene.add(trees);
  };

  var update = function(delta) {
    vineAnimationTime += delta;

    if (vines) {
      vines.children.forEach(function(vine, index) {
        var sway = Math.sin(vineAnimationTime + index * 0.3) * 0.15;
        vine.position.x = sway * (index % 3);
      });
    }

    if (pyramid) {
      pyramid.rotation.y += delta * 0.02;
    }
  };

  var reset = function() {
    vineAnimationTime = 0;
    if (pyramid) {
      pyramid.rotation.y = 0;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
