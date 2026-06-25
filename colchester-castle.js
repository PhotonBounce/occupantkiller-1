window.ColchesterCastle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 16120;
  var OFFSET_Z = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function makeMesh(geometry, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, mat);
    return mesh;
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildKeep() {
    // Main Norman keep: 44w x 34d x 24h
    var keepGeo = new THREE.BoxGeometry(44, 24, 34);
    var keep = makeMesh(keepGeo, 0x8B7355);
    keep.position.set(OFFSET_X + 0, 12, OFFSET_Z + 0);
    addToScene(keep);

    // 4 corner turrets: 6x6x28, slightly protruding at each corner
    var turretPositions = [
      [-25, 0, -19],
      [25, 0, -19],
      [-25, 0, 19],
      [25, 0, 19]
    ];
    for (var i = 0; i < turretPositions.length; i++) {
      var tp = turretPositions[i];
      var turretGeo = new THREE.BoxGeometry(6, 28, 6);
      var turret = makeMesh(turretGeo, 0x7A6545);
      turret.position.set(OFFSET_X + tp[0], 14, OFFSET_Z + tp[2]);
      addToScene(turret);
    }
  }

  function buildRomanTempleBase() {
    // Roman Temple of Claudius podium: 50x50x6
    var podiumGeo = new THREE.BoxGeometry(50, 6, 50);
    var podium = makeMesh(podiumGeo, 0xD4C5A9);
    podium.position.set(OFFSET_X + 0, -3, OFFSET_Z + 0);
    addToScene(podium);

    // 8 column stumps around perimeter, r=2 h=6
    var columnAnchors = [
      [-20, -27], [0, -27], [20, -27],
      [-20, 27], [0, 27], [20, 27],
      [-27, 0], [27, 0]
    ];
    for (var j = 0; j < columnAnchors.length; j++) {
      var ca = columnAnchors[j];
      var colGeo = new THREE.CylinderGeometry(2, 2, 6, 8);
      var col = makeMesh(colGeo, 0xE0D5BA);
      col.position.set(OFFSET_X + ca[0], 0, OFFSET_Z + ca[1]);
      addToScene(col);
    }
  }

  function buildBaileyWall() {
    // 4 wall sections forming a rectangle around the keep
    // North wall
    var wallNGeo = new THREE.BoxGeometry(120, 10, 2);
    var wallN = makeMesh(wallNGeo, 0x8B7355);
    wallN.position.set(OFFSET_X + 0, 5, OFFSET_Z - 70);
    addToScene(wallN);

    // South wall
    var wallSGeo = new THREE.BoxGeometry(120, 10, 2);
    var wallS = makeMesh(wallSGeo, 0x8B7355);
    wallS.position.set(OFFSET_X + 0, 5, OFFSET_Z + 70);
    addToScene(wallS);

    // West wall
    var wallWGeo = new THREE.BoxGeometry(2, 10, 140);
    var wallW = makeMesh(wallWGeo, 0x8B7355);
    wallW.position.set(OFFSET_X - 60, 5, OFFSET_Z + 0);
    addToScene(wallW);

    // East wall
    var wallEGeo = new THREE.BoxGeometry(2, 10, 140);
    var wallE = makeMesh(wallEGeo, 0x8B7355);
    wallE.position.set(OFFSET_X + 60, 5, OFFSET_Z + 0);
    addToScene(wallE);

    // 3 mural towers along walls: r=4 h=14
    var muralPositions = [
      [-60, -35],
      [60, 35],
      [0, -70]
    ];
    for (var k = 0; k < muralPositions.length; k++) {
      var mp = muralPositions[k];
      var mtGeo = new THREE.CylinderGeometry(4, 4, 14, 10);
      var mt = makeMesh(mtGeo, 0x7A6545);
      mt.position.set(OFFSET_X + mp[0], 7, OFFSET_Z + mp[1]);
      addToScene(mt);
    }
  }

  function buildGatehouse() {
    // Main gatehouse: 14w x 8d x 18h
    var ghGeo = new THREE.BoxGeometry(14, 18, 8);
    var gh = makeMesh(ghGeo, 0x8B7355);
    gh.position.set(OFFSET_X + 0, 9, OFFSET_Z + 70);
    addToScene(gh);

    // Portcullis implied by dark vertical strips: 1x12x0.5
    var portPositions = [-3, 0, 3];
    for (var p = 0; p < portPositions.length; p++) {
      var portGeo = new THREE.BoxGeometry(1, 12, 0.5);
      var port = makeMesh(portGeo, 0x333333);
      port.position.set(OFFSET_X + portPositions[p], 6, OFFSET_Z + 70.3);
      addToScene(port);
    }

    // Drawbridge: 12w x 1h x 8d
    var dbGeo = new THREE.BoxGeometry(12, 1, 8);
    var db = makeMesh(dbGeo, 0x6B4423);
    db.position.set(OFFSET_X + 0, 0, OFFSET_Z + 78);
    addToScene(db);
  }

  function buildRomanCircus() {
    // Low walls forming oval-ish perimeter: long sides 2x4x60, short sides 60x4x2
    var circusOffsetX = 80;

    // Long north side
    var cw1Geo = new THREE.BoxGeometry(2, 4, 60);
    var cw1 = makeMesh(cw1Geo, 0xD4A574);
    cw1.position.set(OFFSET_X + circusOffsetX - 20, 2, OFFSET_Z - 30);
    addToScene(cw1);

    // Long south side
    var cw2Geo = new THREE.BoxGeometry(2, 4, 60);
    var cw2 = makeMesh(cw2Geo, 0xD4A574);
    cw2.position.set(OFFSET_X + circusOffsetX + 20, 2, OFFSET_Z - 30);
    addToScene(cw2);

    // Short east end
    var cw3Geo = new THREE.BoxGeometry(40, 4, 2);
    var cw3 = makeMesh(cw3Geo, 0xD4A574);
    cw3.position.set(OFFSET_X + circusOffsetX, 2, OFFSET_Z - 60);
    addToScene(cw3);

    // Short west end
    var cw4Geo = new THREE.BoxGeometry(40, 4, 2);
    var cw4 = makeMesh(cw4Geo, 0xD4A574);
    cw4.position.set(OFFSET_X + circusOffsetX, 2, OFFSET_Z);
    addToScene(cw4);

    // 4 track surface strips: 10w x 0.5h x 60d
    var trackOffsets = [-15, -5, 5, 15];
    for (var t = 0; t < trackOffsets.length; t++) {
      var trackGeo = new THREE.BoxGeometry(10, 0.5, 60);
      var track = makeMesh(trackGeo, 0xD2B48C);
      track.position.set(OFFSET_X + circusOffsetX + trackOffsets[t] - 2, 0.25, OFFSET_Z - 30);
      addToScene(track);
    }
  }

  function buildBalkerne() {
    var bgOffset = -90;

    // 2 gate towers: 8w x 8d x 12h
    var bt1Geo = new THREE.BoxGeometry(8, 12, 8);
    var bt1 = makeMesh(bt1Geo, 0xD4A574);
    bt1.position.set(OFFSET_X + bgOffset - 10, 6, OFFSET_Z + 0);
    addToScene(bt1);

    var bt2Geo = new THREE.BoxGeometry(8, 12, 8);
    var bt2 = makeMesh(bt2Geo, 0xD4A574);
    bt2.position.set(OFFSET_X + bgOffset + 10, 6, OFFSET_Z + 0);
    addToScene(bt2);

    // Archway span: 12w x 3h x 12d
    var archGeo = new THREE.BoxGeometry(12, 3, 12);
    var arch = makeMesh(archGeo, 0xD4A574);
    arch.position.set(OFFSET_X + bgOffset, 13.5, OFFSET_Z + 0);
    addToScene(arch);

    // Gate opening dark inset: 6w x 8h x 0.5d
    var gateOpenGeo = new THREE.BoxGeometry(6, 8, 0.5);
    var gateOpen = makeMesh(gateOpenGeo, 0x222222);
    gateOpen.position.set(OFFSET_X + bgOffset, 4, OFFSET_Z + 6);
    addToScene(gateOpen);

    // Roman road west: 8w x 0.3h x 30d
    var roadWGeo = new THREE.BoxGeometry(8, 0.3, 30);
    var roadW = makeMesh(roadWGeo, 0x888888);
    roadW.position.set(OFFSET_X + bgOffset, 0.15, OFFSET_Z - 21);
    addToScene(roadW);

    // Roman road east: 8w x 0.3h x 30d
    var roadEGeo = new THREE.BoxGeometry(8, 0.3, 30);
    var roadE = makeMesh(roadEGeo, 0x888888);
    roadE.position.set(OFFSET_X + bgOffset, 0.15, OFFSET_Z + 21);
    addToScene(roadE);
  }

  function buildCastlePark() {
    // 6 ornamental trees: trunk CylinderGeometry + canopy SphereGeometry
    var treePositions = [
      [-50, -60],
      [-30, -60],
      [30, -60],
      [50, -60],
      [-50, 60],
      [50, 60]
    ];
    for (var ti = 0; ti < treePositions.length; ti++) {
      var tp = treePositions[ti];
      var trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 5, 7);
      var trunk = makeMesh(trunkGeo, 0x6B4423);
      trunk.position.set(OFFSET_X + tp[0], 2.5, OFFSET_Z + tp[1]);
      addToScene(trunk);

      var canopyGeo = new THREE.SphereGeometry(4, 8, 8);
      var canopy = makeMesh(canopyGeo, 0x2D6A2D);
      canopy.position.set(OFFSET_X + tp[0], 8, OFFSET_Z + tp[1]);
      addToScene(canopy);
    }

    // 3 park benches: 3w x 1h x 1d
    var benchPositions = [
      [-40, -55],
      [0, -80],
      [40, -55]
    ];
    for (var bi = 0; bi < benchPositions.length; bi++) {
      var bp = benchPositions[bi];
      var benchGeo = new THREE.BoxGeometry(3, 1, 1);
      var bench = makeMesh(benchGeo, 0x8B6914);
      bench.position.set(OFFSET_X + bp[0], 0.5, OFFSET_Z + bp[1]);
      addToScene(bench);
    }

    // Fountain basin: CylinderGeometry r=4 h=1
    var basinGeo = new THREE.CylinderGeometry(4, 4, 1, 12);
    var basin = makeMesh(basinGeo, 0x888888);
    basin.position.set(OFFSET_X - 45, 0.5, OFFSET_Z + 50);
    addToScene(basin);

    // Water jet: CylinderGeometry r=0.5 h=6
    var jetGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
    var jet = makeMesh(jetGeo, 0xCCCCCC);
    jet.position.set(OFFSET_X - 45, 3.5, OFFSET_Z + 50);
    addToScene(jet);
  }

  function buildMuseumEntrance() {
    var musOffset = 35;

    // Victorian museum built into keep: 14w x 8d x 10h
    var musGeo = new THREE.BoxGeometry(14, 10, 8);
    var mus = makeMesh(musGeo, 0xD0C0A0);
    mus.position.set(OFFSET_X + 0, 5, OFFSET_Z + musOffset);
    addToScene(mus);

    // Arched glass atrium: 16w x 8d x 8h
    var atriumGeo = new THREE.BoxGeometry(16, 8, 8);
    var atrium = makeMesh(atriumGeo, 0x87CEEB);
    atrium.position.set(OFFSET_X + 0, 4, OFFSET_Z + musOffset + 8);
    addToScene(atrium);

    // 3 steps leading up: 16w x 0.5h x 3d each
    var stepOffsets = [18, 21, 24];
    var stepHeights = [0.25, 0.75, 1.25];
    for (var si = 0; si < stepOffsets.length; si++) {
      var stepGeo = new THREE.BoxGeometry(16, 0.5, 3);
      var step = makeMesh(stepGeo, 0xC0B090);
      step.position.set(OFFSET_X + 0, stepHeights[si], OFFSET_Z + musOffset + stepOffsets[si]);
      addToScene(step);
    }
  }

  function build() {
    buildKeep();
    buildRomanTempleBase();
    buildBaileyWall();
    buildGatehouse();
    buildRomanCircus();
    buildBalkerne();
    buildCastlePark();
    buildMuseumEntrance();
  }

  function update(delta) {
    // No animated elements
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
