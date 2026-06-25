window.LeicesterCathedral = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 15760;
  var OFFSET_Z = 0;

  function makeMesh(geometry, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, mat);
    return mesh;
  }

  function addAt(mesh, x, y, z) {
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildNave() {
    var geo = new THREE.BoxGeometry(30, 18, 16);
    var mesh = makeMesh(geo, 0xD4C5A9);
    addAt(mesh, 0, 9, 0);
  }

  function buildCentralTower() {
    var towerGeo = new THREE.BoxGeometry(8, 32, 8);
    var tower = makeMesh(towerGeo, 0xC4B59A);
    addAt(tower, 0, 16, 0);

    var pinnaclePositions = [
      [-3, -3],
      [3, -3],
      [-3, 3],
      [3, 3]
    ];
    var i;
    for (i = 0; i < pinnaclePositions.length; i++) {
      var px = pinnaclePositions[i][0];
      var pz = pinnaclePositions[i][1];
      var pinGeo = new THREE.BoxGeometry(2, 6, 2);
      var pin = makeMesh(pinGeo, 0xC4B59A);
      addAt(pin, px, 35, pz);
    }

    var flagGeo = new THREE.BoxGeometry(0.5, 8, 0.5);
    var flag = makeMesh(flagGeo, 0x888888);
    addAt(flag, 0, 36, 0);
  }

  function buildWestFacade() {
    var facadeGeo = new THREE.BoxGeometry(28, 20, 4);
    var facade = makeMesh(facadeGeo, 0xD4C5A9);
    addAt(facade, 0, 10, -10);

    var doorPositions = [-9, 0, 9];
    var j;
    for (j = 0; j < doorPositions.length; j++) {
      var dx = doorPositions[j];
      var doorGeo = new THREE.BoxGeometry(4, 8, 0.5);
      var door = makeMesh(doorGeo, 0x1A1A1A);
      addAt(door, dx, 4, -11.8);
    }

    var roseGeo = new THREE.CylinderGeometry(4, 4, 0.5, 16);
    var rose = makeMesh(roseGeo, 0x8B0000);
    rose.rotation.x = Math.PI / 2;
    addAt(rose, 0, 15, -11.8);
  }

  function buildTransepts() {
    var northGeo = new THREE.BoxGeometry(12, 14, 14);
    var north = makeMesh(northGeo, 0xD4C5A9);
    addAt(north, -21, 7, 0);

    var southGeo = new THREE.BoxGeometry(12, 14, 14);
    var south = makeMesh(southGeo, 0xD4C5A9);
    addAt(south, 21, 7, 0);
  }

  function buildChancel() {
    var chancelGeo = new THREE.BoxGeometry(18, 16, 12);
    var chancel = makeMesh(chancelGeo, 0xD4C5A9);
    addAt(chancel, 0, 8, 14);

    var winPositions = [-6, 0, 6];
    var k;
    for (k = 0; k < winPositions.length; k++) {
      var wx = winPositions[k];
      var winGeo = new THREE.BoxGeometry(3, 10, 0.5);
      var win = makeMesh(winGeo, 0x1A3A5C);
      addAt(win, wx, 8, 8.1);
    }
  }

  function buildRichardTomb() {
    var tombGeo = new THREE.BoxGeometry(4, 1.5, 8);
    var tomb = makeMesh(tombGeo, 0x1A1A1A);
    addAt(tomb, 0, 0.75, 2);

    var crownOffsets = [-0.6, 0, 0.6];
    var m;
    for (m = 0; m < crownOffsets.length; m++) {
      var cx = crownOffsets[m];
      var spikeGeo = new THREE.BoxGeometry(0.5, 2, 0.5);
      var spike = makeMesh(spikeGeo, 0xFFD700);
      addAt(spike, cx, 2.5, 2);
    }
  }

  function buildChurchyard() {
    var hedgePositions = [
      [-20, -12],
      [-14, -12],
      [-8, -12],
      [8, -12],
      [14, -12],
      [20, -12]
    ];
    var n;
    for (n = 0; n < hedgePositions.length; n++) {
      var hx = hedgePositions[n][0];
      var hz = hedgePositions[n][1];
      var hedgeGeo = new THREE.BoxGeometry(3, 2, 3);
      var hedge = makeMesh(hedgeGeo, 0x2D5A1B);
      addAt(hedge, hx, 1, hz);
    }

    var treePositions = [
      [-24, -18],
      [24, -18]
    ];
    var t;
    for (t = 0; t < treePositions.length; t++) {
      var tx = treePositions[t][0];
      var tz = treePositions[t][1];
      var trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 8);
      var trunk = makeMesh(trunkGeo, 0x4A3728);
      addAt(trunk, tx, 2, tz);

      var canopyGeo = new THREE.SphereGeometry(3, 8, 8);
      var canopy = makeMesh(canopyGeo, 0x0A3D0A);
      addAt(canopy, tx, 6.5, tz);
    }
  }

  function buildVisitorsCentre() {
    var vcGeo = new THREE.BoxGeometry(20, 8, 10);
    var vc = makeMesh(vcGeo, 0x87CEEB);
    addAt(vc, -30, 4, 0);

    var frameXPositions = [-40, -36, -32, -28, -24, -20];
    var f;
    for (f = 0; f < frameXPositions.length; f++) {
      var fx = frameXPositions[f];
      var frameGeo = new THREE.BoxGeometry(0.3, 8, 0.3);
      var frame = makeMesh(frameGeo, 0x777777);
      addAt(frame, fx, 4, 0);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
  }

  function build() {
    buildNave();
    buildCentralTower();
    buildWestFacade();
    buildTransepts();
    buildChancel();
    buildRichardTomb();
    buildChurchyard();
    buildVisitorsCentre();
  }

  function update(delta) {
    // static environment — no per-frame updates needed
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
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
