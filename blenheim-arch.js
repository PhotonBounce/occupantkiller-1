window.BlenheimArch = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 16200;
  var OFFSET_Z = 0;

  function makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeMesh(geometry, material) {
    return new THREE.Mesh(geometry, material);
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildTriumphalArch() {
    var mat = makeMaterial(0xE8D5A8);
    var archBody = makeMesh(new THREE.BoxGeometry(20, 22, 6), mat);
    archBody.position.set(OFFSET_X, 11, OFFSET_Z);
    addToScene(archBody);

    var archOpeningMat = makeMaterial(0x222222);
    var archOpening = makeMesh(new THREE.BoxGeometry(10, 14, 6.5), archOpeningMat);
    archOpening.position.set(OFFSET_X, 7, OFFSET_Z);
    addToScene(archOpening);

    var nicheMat = makeMaterial(0xDDCCA0);

    var nicheLeft = makeMesh(new THREE.BoxGeometry(3, 8, 0.5), nicheMat);
    nicheLeft.position.set(OFFSET_X - 7, 8, OFFSET_Z + 3);
    addToScene(nicheLeft);

    var nicheRight = makeMesh(new THREE.BoxGeometry(3, 8, 0.5), nicheMat);
    nicheRight.position.set(OFFSET_X + 7, 8, OFFSET_Z + 3);
    addToScene(nicheRight);

    var battlementMat = makeMaterial(0xE0CCAA);
    var battlementOffsets = [-7, -2.5, 2.5, 7];
    var i;
    for (i = 0; i < battlementOffsets.length; i++) {
      var battlement = makeMesh(new THREE.BoxGeometry(2, 3, 2), battlementMat);
      battlement.position.set(OFFSET_X + battlementOffsets[i], 23.5, OFFSET_Z);
      addToScene(battlement);
    }
  }

  function buildPalaceFacade() {
    var facadeMat = makeMaterial(0xE8D5A8);
    var facade = makeMesh(new THREE.BoxGeometry(50, 24, 20), facadeMat);
    facade.position.set(OFFSET_X, 12, OFFSET_Z - 40);
    addToScene(facade);

    var porticoMat = makeMaterial(0xE8D5A8);
    var portico = makeMesh(new THREE.BoxGeometry(14, 28, 6), porticoMat);
    portico.position.set(OFFSET_X, 14, OFFSET_Z - 27);
    addToScene(portico);

    var windowMat = makeMaterial(0x87CEEB);
    var windowPositionsX = [-20, -14, -8, -2, 2, 8, 14, 20, -17, -5, 5, 17];
    var windowHeights = [12, 12, 12, 12, 12, 12, 12, 12, 18, 18, 18, 18];
    var i;
    for (i = 0; i < 12; i++) {
      var win = makeMesh(new THREE.BoxGeometry(3, 8, 0.5), windowMat);
      win.position.set(OFFSET_X + windowPositionsX[i], windowHeights[i], OFFSET_Z - 30.5);
      addToScene(win);
    }
  }

  function buildColumnOfVictory() {
    var columnMat = makeMaterial(0xE0D0B0);
    var column = makeMesh(new THREE.CylinderGeometry(2, 2, 46, 8), columnMat);
    column.position.set(OFFSET_X + 60, 23, OFFSET_Z - 20);
    addToScene(column);

    var capitalMat = makeMaterial(0xD8C8A0);
    var capital = makeMesh(new THREE.CylinderGeometry(3.5, 2, 3, 8), capitalMat);
    capital.position.set(OFFSET_X + 60, 47.5, OFFSET_Z - 20);
    addToScene(capital);

    var statueMat = makeMaterial(0xC8B890);

    var statueBody = makeMesh(new THREE.BoxGeometry(1.5, 6, 1.5), statueMat);
    statueBody.position.set(OFFSET_X + 60, 52, OFFSET_Z - 20);
    addToScene(statueBody);

    var statueHead = makeMesh(new THREE.BoxGeometry(2, 2, 2), statueMat);
    statueHead.position.set(OFFSET_X + 60, 56, OFFSET_Z - 20);
    addToScene(statueHead);

    var armLeft = makeMesh(new THREE.BoxGeometry(1, 1, 3), statueMat);
    armLeft.position.set(OFFSET_X + 60 - 1.5, 53, OFFSET_Z - 20);
    addToScene(armLeft);

    var armRight = makeMesh(new THREE.BoxGeometry(1, 1, 3), statueMat);
    armRight.position.set(OFFSET_X + 60 + 1.5, 53, OFFSET_Z - 20);
    addToScene(armRight);
  }

  function buildGrandCascade() {
    var cascadeMat = makeMaterial(0xD0C8B8);

    var basin1 = makeMesh(new THREE.BoxGeometry(10, 2, 10), cascadeMat);
    basin1.position.set(OFFSET_X - 60, 1, OFFSET_Z - 10);
    addToScene(basin1);

    var basin2 = makeMesh(new THREE.BoxGeometry(8, 2, 8), cascadeMat);
    basin2.position.set(OFFSET_X - 60, 3, OFFSET_Z - 10);
    addToScene(basin2);

    var basin3 = makeMesh(new THREE.BoxGeometry(6, 2, 6), cascadeMat);
    basin3.position.set(OFFSET_X - 60, 5, OFFSET_Z - 10);
    addToScene(basin3);

    var jetMat = makeMaterial(0x6BB8E0);

    var jet1 = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 8), jetMat);
    jet1.position.set(OFFSET_X - 60, 6, OFFSET_Z - 10);
    addToScene(jet1);

    var jet2 = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 8), jetMat);
    jet2.position.set(OFFSET_X - 62, 4, OFFSET_Z - 10);
    addToScene(jet2);

    var jet3 = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 8), jetMat);
    jet3.position.set(OFFSET_X - 58, 2, OFFSET_Z - 10);
    addToScene(jet3);

    var sprayMat = makeMaterial(0x87CEEB);
    var spray = makeMesh(new THREE.SphereGeometry(2, 8, 8), sprayMat);
    spray.position.set(OFFSET_X - 60, 11, OFFSET_Z - 10);
    addToScene(spray);
  }

  function buildBlenheimLake() {
    var waterMat = makeMaterial(0x2B7DBF);
    var lakeOffsets = [
      [0, 0], [25, 0], [-25, 0],
      [0, 20], [25, 20], [-25, 20],
      [12.5, -20], [-12.5, -20]
    ];
    var i;
    for (i = 0; i < 8; i++) {
      var tile = makeMesh(new THREE.BoxGeometry(25, 0.4, 20), waterMat);
      tile.position.set(OFFSET_X - 20 + lakeOffsets[i][0], 0, OFFSET_Z + 60 + lakeOffsets[i][1]);
      addToScene(tile);
    }

    var bridgeMat = makeMaterial(0xD4C5A9);
    var bridgeDeck = makeMesh(new THREE.BoxGeometry(3, 3, 40), bridgeMat);
    bridgeDeck.position.set(OFFSET_X - 20, 3, OFFSET_Z + 60);
    addToScene(bridgeDeck);

    var pier1 = makeMesh(new THREE.CylinderGeometry(4, 4, 10, 8), bridgeMat);
    pier1.position.set(OFFSET_X - 20, 5, OFFSET_Z + 45);
    addToScene(pier1);

    var pier2 = makeMesh(new THREE.CylinderGeometry(4, 4, 10, 8), bridgeMat);
    pier2.position.set(OFFSET_X - 20, 5, OFFSET_Z + 75);
    addToScene(pier2);
  }

  function buildFormalGardens() {
    var hedgeMat = makeMaterial(0x2D5A1B);
    var hedgePositions = [
      [-15, 0], [-8, 0], [0, 0],
      [8, 0], [15, 0], [22, 0]
    ];
    var i;
    for (i = 0; i < 6; i++) {
      var hedge = makeMesh(new THREE.BoxGeometry(8, 2, 3), hedgeMat);
      hedge.position.set(OFFSET_X + hedgePositions[i][0], 1, OFFSET_Z + 30 + hedgePositions[i][1]);
      addToScene(hedge);
    }

    var topiaryMat = makeMaterial(0x1A4A1A);
    var topiaryPositions = [
      [-20, 35], [20, 35], [-20, 45], [20, 45]
    ];
    for (i = 0; i < 4; i++) {
      var topiary = makeMesh(new THREE.ConeGeometry(2.5, 8, 8), topiaryMat);
      topiary.position.set(OFFSET_X + topiaryPositions[i][0], 4, OFFSET_Z + topiaryPositions[i][1]);
      addToScene(topiary);
    }

    var gravelMat = makeMaterial(0xD0C0A0);
    var path = makeMesh(new THREE.BoxGeometry(4, 0.4, 40), gravelMat);
    path.position.set(OFFSET_X, 0.2, OFFSET_Z + 40);
    addToScene(path);
  }

  function buildKitchenGarden() {
    var brickMat = makeMaterial(0xD4A574);
    var wallConfigs = [
      [0, 4, 20, 2, 8, 40],
      [0, 4, -20, 2, 8, 40],
      [-20, 4, 0, 40, 8, 2],
      [20, 4, 0, 40, 8, 2]
    ];
    var i;
    for (i = 0; i < 4; i++) {
      var wall = makeMesh(new THREE.BoxGeometry(wallConfigs[i][3], wallConfigs[i][4], wallConfigs[i][5]), brickMat);
      wall.position.set(OFFSET_X + 120 + wallConfigs[i][0], wallConfigs[i][1], OFFSET_Z + wallConfigs[i][2]);
      addToScene(wall);
    }

    var glassMat = makeMaterial(0x87CEEB);
    var greenhouse = makeMesh(new THREE.BoxGeometry(16, 8, 8), glassMat);
    greenhouse.position.set(OFFSET_X + 120, 4, OFFSET_Z);
    addToScene(greenhouse);

    var frameMat = makeMaterial(0x666666);
    var framePositions = [
      [-7, 4, 0, 0.5, 8, 0.5],
      [-3.5, 4, 0, 0.5, 8, 0.5],
      [0, 4, 0, 0.5, 8, 0.5],
      [3.5, 4, 0, 0.5, 8, 0.5],
      [7, 4, 0, 0.5, 8, 0.5]
    ];
    for (i = 0; i < framePositions.length; i++) {
      var frame = makeMesh(new THREE.BoxGeometry(framePositions[i][3], framePositions[i][4], framePositions[i][5]), frameMat);
      frame.position.set(OFFSET_X + 120 + framePositions[i][0], framePositions[i][1], OFFSET_Z + framePositions[i][2] + 4.1);
      addToScene(frame);
    }
  }

  function buildChurchillBirthplace() {
    var creamMat = makeMaterial(0xF0E8D0);
    var room = makeMesh(new THREE.BoxGeometry(12, 5, 8), creamMat);
    room.position.set(OFFSET_X + 10, 2.5, OFFSET_Z - 50);
    addToScene(room);

    var fireplacesMat = makeMaterial(0x444444);
    var fireplace = makeMesh(new THREE.BoxGeometry(4, 4, 1), fireplacesMat);
    fireplace.position.set(OFFSET_X + 10, 2, OFFSET_Z - 54);
    addToScene(fireplace);

    var frameMat = makeMaterial(0x8B0000);
    var portraitPositions = [
      [-4, 4, -53.8],
      [-1, 4, -53.8],
      [3, 4, -53.8],
      [6, 4, -53.8]
    ];
    var i;
    for (i = 0; i < 4; i++) {
      var portrait = makeMesh(new THREE.BoxGeometry(2, 3, 0.2), frameMat);
      portrait.position.set(OFFSET_X + portraitPositions[i][0], portraitPositions[i][1], OFFSET_Z + portraitPositions[i][2]);
      addToScene(portrait);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
  }

  function build() {
    buildTriumphalArch();
    buildPalaceFacade();
    buildColumnOfVictory();
    buildGrandCascade();
    buildBlenheimLake();
    buildFormalGardens();
    buildKitchenGarden();
    buildChurchillBirthplace();
  }

  function update(delta) {
    // Static environment — no animation needed
    void delta;
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (scene) {
        scene.remove(objects[i]);
      }
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
    scene = null;
    camera = null;
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
