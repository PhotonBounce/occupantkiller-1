window.GiantsCauseway = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var waveSprites = [];
  var time = 0;

  var OFFSET_X = 16960;
  var OFFSET_Z = 0;

  var HEIGHT_CYCLE = [8,10,6,12,9,7,11,8,5,10, 9,7,12,6,8,11,5,9,7,10];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function makeBasaltColumns() {
    var cols = 8;
    var rows = 10;
    var spacing = 3.2;
    var i, j, idx, h, col, top;
    var colMat = new THREE.MeshLambertMaterial({ color: 0x4A5A6A });
    var topMat = new THREE.MeshLambertMaterial({ color: 0x5A6A7A });

    idx = 0;
    for (i = 0; i < cols; i++) {
      for (j = 0; j < rows; j++) {
        h = HEIGHT_CYCLE[idx % HEIGHT_CYCLE.length];
        idx++;

        var colGeo = new THREE.CylinderGeometry(1.5, 1.5, h, 6);
        col = new THREE.Mesh(colGeo, colMat);
        col.position.set(
          OFFSET_X + (i - cols / 2) * spacing,
          h / 2,
          OFFSET_Z + (j - rows / 2) * spacing
        );
        scene.add(col);
        objects.push(col);

        var topGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 6);
        top = new THREE.Mesh(topGeo, topMat);
        top.position.set(
          OFFSET_X + (i - cols / 2) * spacing,
          h + 0.15,
          OFFSET_Z + (j - rows / 2) * spacing
        );
        scene.add(top);
        objects.push(top);
      }
    }
  }

  function makeCliffFace() {
    var cliffMat = new THREE.MeshLambertMaterial({ color: 0x3A4A5A });
    var striateMat = new THREE.MeshLambertMaterial({ color: 0x2A3A4A });

    var cliffSizes = [
      [40, 40, 12],
      [35, 35, 10],
      [30, 30, 8]
    ];
    var k;
    for (k = 0; k < cliffSizes.length; k++) {
      var s = cliffSizes[k];
      var geo = new THREE.BoxGeometry(s[0], s[1], s[2]);
      var mesh = new THREE.Mesh(geo, cliffMat);
      mesh.position.set(
        OFFSET_X,
        s[1] / 2,
        OFFSET_Z - 25 - k * 8
      );
      scene.add(mesh);
      objects.push(mesh);
    }

    var m;
    for (m = 0; m < 20; m++) {
      var strGeo = new THREE.BoxGeometry(0.5, 40, 0.5);
      var strMesh = new THREE.Mesh(strGeo, striateMat);
      strMesh.position.set(
        OFFSET_X - 19 + m * 2,
        20,
        OFFSET_Z - 25
      );
      scene.add(strMesh);
      objects.push(strMesh);
    }
  }

  function makeOcean() {
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A3A6A });
    var sprayMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    var t;
    for (t = 0; t < 5; t++) {
      var waterGeo = new THREE.BoxGeometry(30, 0.5, 20);
      var waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.set(
        OFFSET_X - 10 + t * 5,
        -0.25,
        OFFSET_Z + 20 + t * 18
      );
      scene.add(waterMesh);
      objects.push(waterMesh);
    }

    var w;
    for (w = 0; w < 4; w++) {
      var sprayGeo = new THREE.SphereGeometry(2, 8, 6);
      var sprayMesh = new THREE.Mesh(sprayGeo, sprayMat);
      sprayMesh.position.set(
        OFFSET_X - 6 + w * 4,
        2,
        OFFSET_Z + 18 + w * 3
      );
      scene.add(sprayMesh);
      objects.push(sprayMesh);
      waveSprites.push(sprayMesh);
    }
  }

  function makeCoastalPath() {
    var pathMat = new THREE.MeshLambertMaterial({ color: 0xC0B090 });
    var stepMat = new THREE.MeshLambertMaterial({ color: 0x4A2C0A });

    var angles = [0, 0.3, -0.2, 0.4, -0.1];
    var p;
    for (p = 0; p < 5; p++) {
      var pathGeo = new THREE.BoxGeometry(3, 0.3, 15);
      var pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.position.set(
        OFFSET_X + 18 + p * 3,
        0.15 + p * 0.1,
        OFFSET_Z - 5 + p * 8
      );
      pathMesh.rotation.y = angles[p];
      scene.add(pathMesh);
      objects.push(pathMesh);
    }

    var st;
    for (st = 0; st < 4; st++) {
      var stepGeo = new THREE.BoxGeometry(4, 0.5, 2);
      var stepMesh = new THREE.Mesh(stepGeo, stepMat);
      stepMesh.position.set(
        OFFSET_X + 22,
        0.25 - st * 0.5,
        OFFSET_Z + 30 + st * 2.5
      );
      scene.add(stepMesh);
      objects.push(stepMesh);
    }
  }

  function makeFinnMacCool() {
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x5A4530 });
    var plinthMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var hatMat = new THREE.MeshLambertMaterial({ color: 0x5A4530 });

    var plinthGeo = new THREE.BoxGeometry(4, 3, 4);
    var plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.set(OFFSET_X + 30, 1.5, OFFSET_Z - 5);
    scene.add(plinthMesh);
    objects.push(plinthMesh);

    var bodyGeo = new THREE.BoxGeometry(4, 8, 3);
    var bodyMesh = new THREE.Mesh(bodyGeo, stoneMat);
    bodyMesh.position.set(OFFSET_X + 30, 3 + 4, OFFSET_Z - 5);
    scene.add(bodyMesh);
    objects.push(bodyMesh);

    var armGeoL = new THREE.BoxGeometry(2, 1, 6);
    var armMeshL = new THREE.Mesh(armGeoL, stoneMat);
    armMeshL.position.set(OFFSET_X + 30 - 3, 3 + 7, OFFSET_Z - 5);
    scene.add(armMeshL);
    objects.push(armMeshL);

    var armGeoR = new THREE.BoxGeometry(2, 1, 6);
    var armMeshR = new THREE.Mesh(armGeoR, stoneMat);
    armMeshR.position.set(OFFSET_X + 30 + 3, 3 + 7, OFFSET_Z - 5);
    scene.add(armMeshR);
    objects.push(armMeshR);

    var legGeoL = new THREE.BoxGeometry(1.5, 8, 2);
    var legMeshL = new THREE.Mesh(legGeoL, stoneMat);
    legMeshL.position.set(OFFSET_X + 30 - 1, 3 + 0, OFFSET_Z - 5);
    scene.add(legMeshL);
    objects.push(legMeshL);

    var legGeoR = new THREE.BoxGeometry(1.5, 8, 2);
    var legMeshR = new THREE.Mesh(legGeoR, stoneMat);
    legMeshR.position.set(OFFSET_X + 30 + 1, 3 + 0, OFFSET_Z - 5);
    scene.add(legMeshR);
    objects.push(legMeshR);

    var headGeo = new THREE.BoxGeometry(3, 4, 3);
    var headMesh = new THREE.Mesh(headGeo, stoneMat);
    headMesh.position.set(OFFSET_X + 30, 3 + 10, OFFSET_Z - 5);
    scene.add(headMesh);
    objects.push(headMesh);

    var hatGeo = new THREE.ConeGeometry(2, 3, 8);
    var hatMesh = new THREE.Mesh(hatGeo, hatMat);
    hatMesh.position.set(OFFSET_X + 30, 3 + 13.5, OFFSET_Z - 5);
    scene.add(hatMesh);
    objects.push(hatMesh);
  }

  function makeVisitorsCentre() {
    var concreteMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var sodMat = new THREE.MeshLambertMaterial({ color: 0x3A7A3A });
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB });

    var buildGeo = new THREE.BoxGeometry(20, 6, 10);
    var buildMesh = new THREE.Mesh(buildGeo, concreteMat);
    buildMesh.position.set(OFFSET_X + 45, 3, OFFSET_Z - 10);
    scene.add(buildMesh);
    objects.push(buildMesh);

    var sodGeo = new THREE.BoxGeometry(21, 2, 11);
    var sodMesh = new THREE.Mesh(sodGeo, sodMat);
    sodMesh.position.set(OFFSET_X + 45, 7, OFFSET_Z - 10);
    scene.add(sodMesh);
    objects.push(sodMesh);

    var glassGeo = new THREE.BoxGeometry(20, 4, 0.5);
    var glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(OFFSET_X + 45, 2, OFFSET_Z - 5.25);
    scene.add(glassMesh);
    objects.push(glassMesh);
  }

  function makeWishingChair() {
    var chairMat = new THREE.MeshLambertMaterial({ color: 0x4A5A6A });
    var moundMat = new THREE.MeshLambertMaterial({ color: 0x3A4A5A });

    var moundGeo = new THREE.BoxGeometry(6, 1, 6);
    var moundMesh = new THREE.Mesh(moundGeo, moundMat);
    moundMesh.position.set(OFFSET_X - 18, 0.5, OFFSET_Z - 10);
    scene.add(moundMesh);
    objects.push(moundMesh);

    var seatGeo = new THREE.BoxGeometry(4, 2, 3);
    var seatMesh = new THREE.Mesh(seatGeo, chairMat);
    seatMesh.position.set(OFFSET_X - 18, 2, OFFSET_Z - 10);
    scene.add(seatMesh);
    objects.push(seatMesh);

    var backGeo = new THREE.BoxGeometry(4, 6, 1);
    var backMesh = new THREE.Mesh(backGeo, chairMat);
    backMesh.position.set(OFFSET_X - 18, 5, OFFSET_Z - 11.5);
    scene.add(backMesh);
    objects.push(backMesh);

    var armLGeo = new THREE.BoxGeometry(1, 3, 3);
    var armLMesh = new THREE.Mesh(armLGeo, chairMat);
    armLMesh.position.set(OFFSET_X - 20, 3.5, OFFSET_Z - 10);
    scene.add(armLMesh);
    objects.push(armLMesh);

    var armRGeo = new THREE.BoxGeometry(1, 3, 3);
    var armRMesh = new THREE.Mesh(armRGeo, chairMat);
    armRMesh.position.set(OFFSET_X - 16, 3.5, OFFSET_Z - 10);
    scene.add(armRMesh);
    objects.push(armRMesh);
  }

  function build() {
    makeBasaltColumns();
    makeCliffFace();
    makeOcean();
    makeCoastalPath();
    makeFinnMacCool();
    makeVisitorsCentre();
    makeWishingChair();
  }

  function update(delta) {
    time += delta;
    var i;
    for (i = 0; i < waveSprites.length; i++) {
      waveSprites[i].position.y = 2 + Math.sin(time * 2 + i * 1.5) * 0.5;
      waveSprites[i].scale.setScalar(0.9 + Math.sin(time * 3 + i) * 0.1);
    }
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
    waveSprites = [];
    time = 0;
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
