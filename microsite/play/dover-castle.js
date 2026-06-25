window.DoverCastle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 16360;
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

  function addObj(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildGreatTower() {
    var keep = makeMesh(new THREE.BoxGeometry(28, 28, 24), 0x9B8B6B);
    keep.position.set(OFFSET_X + 0, 14, OFFSET_Z + 0);
    addObj(keep);

    var buttressPositions = [
      [-17, 0], [17, 0], [0, -15], [0, 15]
    ];
    var i;
    for (i = 0; i < buttressPositions.length; i++) {
      var bt = makeMesh(new THREE.BoxGeometry(6, 32, 6), 0x9B8B6B);
      bt.position.set(OFFSET_X + buttressPositions[i][0], 16, OFFSET_Z + buttressPositions[i][1]);
      addObj(bt);
    }

    var crenelOffsets = [-12, -8, -4, 0, 4, 8, 12, 16];
    for (i = 0; i < 8; i++) {
      var cr = makeMesh(new THREE.BoxGeometry(2, 2, 3), 0x9B8B6B);
      cr.position.set(OFFSET_X + crenelOffsets[i] - 2, 29, OFFSET_Z + 0);
      addObj(cr);
    }
  }

  function buildOuterCurtainWall() {
    var wallColor = 0x8A7A5A;
    var towerColor = 0x7A6A4A;

    var northWall = makeMesh(new THREE.BoxGeometry(60, 14, 2), wallColor);
    northWall.position.set(OFFSET_X + 0, 7, OFFSET_Z - 55);
    addObj(northWall);

    var southWall = makeMesh(new THREE.BoxGeometry(60, 14, 2), wallColor);
    southWall.position.set(OFFSET_X + 0, 7, OFFSET_Z + 55);
    addObj(southWall);

    var eastWall = makeMesh(new THREE.BoxGeometry(2, 14, 60), wallColor);
    eastWall.position.set(OFFSET_X + 55, 7, OFFSET_Z + 0);
    addObj(eastWall);

    var westWall = makeMesh(new THREE.BoxGeometry(2, 14, 60), wallColor);
    westWall.position.set(OFFSET_X - 55, 7, OFFSET_Z + 0);
    addObj(westWall);

    var towerSpacing = [-45, -27, -9, 9, 27, 45];
    var j;

    for (j = 0; j < towerSpacing.length; j++) {
      var nt = makeMesh(new THREE.BoxGeometry(5, 18, 5), towerColor);
      nt.position.set(OFFSET_X + towerSpacing[j], 9, OFFSET_Z - 55);
      addObj(nt);

      var st = makeMesh(new THREE.BoxGeometry(5, 18, 5), towerColor);
      st.position.set(OFFSET_X + towerSpacing[j], 9, OFFSET_Z + 55);
      addObj(st);
    }

    var sideSpacing = [-27, 0, 27];
    for (j = 0; j < sideSpacing.length; j++) {
      var et = makeMesh(new THREE.BoxGeometry(5, 18, 5), towerColor);
      et.position.set(OFFSET_X + 55, 9, OFFSET_Z + sideSpacing[j]);
      addObj(et);

      var wt = makeMesh(new THREE.BoxGeometry(5, 18, 5), towerColor);
      wt.position.set(OFFSET_X - 55, 9, OFFSET_Z + sideSpacing[j]);
      addObj(wt);
    }
  }

  function buildInnerBaileyWall() {
    var wallColor = 0x9B8B6B;
    var towerColor = 0x8A7A5A;

    var innerNorth = makeMesh(new THREE.BoxGeometry(40, 16, 2), wallColor);
    innerNorth.position.set(OFFSET_X + 0, 8, OFFSET_Z - 32);
    addObj(innerNorth);

    var innerSouth = makeMesh(new THREE.BoxGeometry(40, 16, 2), wallColor);
    innerSouth.position.set(OFFSET_X + 0, 8, OFFSET_Z + 32);
    addObj(innerSouth);

    var innerEast = makeMesh(new THREE.BoxGeometry(2, 16, 40), wallColor);
    innerEast.position.set(OFFSET_X + 32, 8, OFFSET_Z + 0);
    addObj(innerEast);

    var innerWest = makeMesh(new THREE.BoxGeometry(2, 16, 40), wallColor);
    innerWest.position.set(OFFSET_X - 32, 8, OFFSET_Z + 0);
    addObj(innerWest);

    var innerTowers = [
      [-32, -32], [0, -32], [32, -32],
      [-32, 0],            [32, 0],
      [-32, 32],  [0, 32], [32, 32]
    ];
    var k;
    for (k = 0; k < innerTowers.length; k++) {
      var it = makeMesh(new THREE.BoxGeometry(4, 20, 4), towerColor);
      it.position.set(OFFSET_X + innerTowers[k][0], 10, OFFSET_Z + innerTowers[k][1]);
      addObj(it);
    }
  }

  function buildConstablesGate() {
    var gatehouse = makeMesh(new THREE.BoxGeometry(20, 22, 10), 0x8A7A5A);
    gatehouse.position.set(OFFSET_X - 55, 11, OFFSET_Z + 0);
    addObj(gatehouse);

    var drumLeft = makeMesh(new THREE.CylinderGeometry(4, 4, 24, 8), 0x8A7A5A);
    drumLeft.position.set(OFFSET_X - 63, 12, OFFSET_Z - 6);
    addObj(drumLeft);

    var drumRight = makeMesh(new THREE.CylinderGeometry(4, 4, 24, 8), 0x8A7A5A);
    drumRight.position.set(OFFSET_X - 63, 12, OFFSET_Z + 6);
    addObj(drumRight);

    var portBarPositions = [-2, 0, 2];
    var p;
    for (p = 0; p < portBarPositions.length; p++) {
      var bar = makeMesh(new THREE.BoxGeometry(0.5, 8, 0.5), 0x222222);
      bar.position.set(OFFSET_X - 55, 6, OFFSET_Z + portBarPositions[p]);
      addObj(bar);
    }
  }

  function buildWhiteCliffs() {
    var cliff1 = makeMesh(new THREE.BoxGeometry(60, 30, 15), 0xFFFFF0);
    cliff1.position.set(OFFSET_X + 80, 15, OFFSET_Z - 30);
    addObj(cliff1);

    var cliff2 = makeMesh(new THREE.BoxGeometry(50, 25, 12), 0xFFFFF0);
    cliff2.position.set(OFFSET_X + 100, 12, OFFSET_Z + 10);
    addObj(cliff2);

    var cliff3 = makeMesh(new THREE.BoxGeometry(40, 20, 10), 0xFFFFF0);
    cliff3.position.set(OFFSET_X + 115, 10, OFFSET_Z - 10);
    addObj(cliff3);

    var sea = makeMesh(new THREE.BoxGeometry(80, 2, 30), 0x1B6CA8);
    sea.position.set(OFFSET_X + 100, 0, OFFSET_Z + 0);
    addObj(sea);
  }

  function buildPharos() {
    var base = makeMesh(new THREE.CylinderGeometry(5, 5, 18, 8), 0xD4A574);
    base.position.set(OFFSET_X + 20, 9, OFFSET_Z - 20);
    addObj(base);

    var upper = makeMesh(new THREE.CylinderGeometry(4, 4, 8, 8), 0xC49464);
    upper.position.set(OFFSET_X + 20, 22, OFFSET_Z - 20);
    addObj(upper);

    var beacon = makeMesh(new THREE.SphereGeometry(2, 8, 8), 0xFF4500);
    beacon.position.set(OFFSET_X + 20, 28, OFFSET_Z - 20);
    addObj(beacon);
  }

  function buildWartimeTunnels() {
    var tunnelMouth = makeMesh(new THREE.BoxGeometry(4, 3, 6), 0x1A1A1A);
    tunnelMouth.position.set(OFFSET_X + 90, 5, OFFSET_Z - 20);
    addObj(tunnelMouth);

    var ventPositions = [-5, 0, 5];
    var v;
    for (v = 0; v < ventPositions.length; v++) {
      var vent = makeMesh(new THREE.BoxGeometry(1, 8, 1), 0x555555);
      vent.position.set(OFFSET_X + 90 + ventPositions[v], 34, OFFSET_Z - 20);
      addObj(vent);
    }

    var sign1 = makeMesh(new THREE.BoxGeometry(2, 1, 0.3), 0x666666);
    sign1.position.set(OFFSET_X + 88, 7, OFFSET_Z - 17);
    addObj(sign1);

    var sign2 = makeMesh(new THREE.BoxGeometry(2, 1, 0.3), 0x666666);
    sign2.position.set(OFFSET_X + 92, 7, OFFSET_Z - 17);
    addObj(sign2);

    var sign3 = makeMesh(new THREE.BoxGeometry(2, 1, 0.3), 0x666666);
    sign3.position.set(OFFSET_X + 90, 7, OFFSET_Z - 23);
    addObj(sign3);
  }

  function buildCrossChannelView() {
    var haze1 = makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xC0C8D0);
    haze1.position.set(OFFSET_X + 30, 4, OFFSET_Z - 120);
    addObj(haze1);

    var haze2 = makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xC0C8D0);
    haze2.position.set(OFFSET_X + 50, 4, OFFSET_Z - 120);
    addObj(haze2);

    var haze3 = makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xC0C8D0);
    haze3.position.set(OFFSET_X + 70, 4, OFFSET_Z - 120);
    addObj(haze3);
  }

  function build() {
    buildGreatTower();
    buildOuterCurtainWall();
    buildInnerBaileyWall();
    buildConstablesGate();
    buildWhiteCliffs();
    buildPharos();
    buildWartimeTunnels();
    buildCrossChannelView();
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
