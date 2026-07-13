window.Connemara = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 17480;
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

  function addMesh(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function placeMesh(mesh, x, y, z) {
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    return mesh;
  }

  function buildTwelveBens() {
    var peakData = [
      { w: 30, h: 30, d: 20, x: -120, z: -60 },
      { w: 35, h: 38, d: 18, x: -80,  z: -80 },
      { w: 28, h: 32, d: 22, x: -40,  z: -70 },
      { w: 40, h: 35, d: 16, x:   0,  z: -90 },
      { w: 25, h: 28, d: 20, x:  40,  z: -65 },
      { w: 32, h: 40, d: 24, x:  80,  z: -85 }
    ];
    var i;
    for (i = 0; i < peakData.length; i++) {
      var pd = peakData[i];
      var geo = new THREE.BoxGeometry(pd.w, pd.h, pd.d);
      var mesh = makeMesh(geo, 0x5A6070);
      placeMesh(mesh, pd.x, pd.h / 2, pd.z);
      addMesh(mesh);
    }
    var snowPeaks = [
      { r: 7, x: -80, h: 38, z: -80 },
      { r: 5, x:   0, h: 35, z: -90 },
      { r: 5, x:  80, h: 40, z: -85 }
    ];
    var j;
    for (j = 0; j < snowPeaks.length; j++) {
      var sp = snowPeaks[j];
      var sgeo = new THREE.SphereGeometry(sp.r, 8, 8);
      var smesh = makeMesh(sgeo, 0xF5F5F5);
      placeMesh(smesh, sp.x, sp.h + sp.r * 0.5, sp.z);
      addMesh(smesh);
    }
  }

  function buildDiamondHill() {
    var base = makeMesh(new THREE.BoxGeometry(40, 16, 30), 0x6A7080);
    placeMesh(base, 150, 8, -30);
    addMesh(base);

    var mid = makeMesh(new THREE.BoxGeometry(32, 12, 25), 0x6A7080);
    placeMesh(mid, 150, 16 + 6, -30);
    addMesh(mid);

    var top = makeMesh(new THREE.BoxGeometry(22, 14, 18), 0x6A7080);
    placeMesh(top, 150, 16 + 12 + 7, -30);
    addMesh(top);

    var cairn = makeMesh(new THREE.BoxGeometry(3, 3, 3), 0xD4C5A9);
    placeMesh(cairn, 150, 16 + 12 + 14 + 1.5, -30);
    addMesh(cairn);

    var path = makeMesh(new THREE.BoxGeometry(2, 0.3, 40), 0xC0A870);
    placeMesh(path, 155, 16, -10);
    addMesh(path);
  }

  function buildBog() {
    var bogPatches = [
      { x:  20, z: 40 },
      { x:  45, z: 55 },
      { x:  70, z: 35 },
      { x:  -5, z: 60 },
      { x:  30, z: 75 },
      { x:  55, z: 80 },
      { x:  80, z: 60 },
      { x: -20, z: 80 },
      { x:  10, z: 95 },
      { x:  60, z: 100 }
    ];
    var i;
    for (i = 0; i < bogPatches.length; i++) {
      var bp = bogPatches[i];
      var mesh = makeMesh(new THREE.BoxGeometry(18, 0.5, 14), 0x5A3A1A);
      placeMesh(mesh, bp.x, 0.25, bp.z);
      addMesh(mesh);
    }

    var bogPools = [
      { x:  25, z: 50 },
      { x:  60, z: 45 },
      { x:  35, z: 85 },
      { x:  75, z: 70 },
      { x: -10, z: 90 }
    ];
    var j;
    for (j = 0; j < bogPools.length; j++) {
      var pool = bogPools[j];
      var pmesh = makeMesh(new THREE.BoxGeometry(6, 0.5, 6), 0x1A4A6A);
      placeMesh(pmesh, pool.x, 0.3, pool.z);
      addMesh(pmesh);
    }

    var grassPos = [
      { x:  22, z: 42 },
      { x:  48, z: 58 },
      { x:  72, z: 38 },
      { x:  -3, z: 62 },
      { x:  32, z: 78 },
      { x:  58, z: 82 },
      { x:  82, z: 62 },
      { x: -18, z: 83 }
    ];
    var k;
    for (k = 0; k < grassPos.length; k++) {
      var gp = grassPos[k];
      var stem = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x4A2C0A);
      placeMesh(stem, gp.x, 2, gp.z);
      addMesh(stem);

      var head = makeMesh(new THREE.SphereGeometry(0.8, 6, 6), 0xFFFFFF);
      placeMesh(head, gp.x, 4.8, gp.z);
      addMesh(head);
    }
  }

  function buildPony(ox, oz) {
    var body = makeMesh(new THREE.BoxGeometry(3.5, 2.5, 6), 0xC8A87A);
    placeMesh(body, ox, 4.25, oz);
    addMesh(body);

    var legOffsets = [
      { x: -1.2, z: -2 },
      { x:  1.2, z: -2 },
      { x: -1.2, z:  2 },
      { x:  1.2, z:  2 }
    ];
    var i;
    for (i = 0; i < legOffsets.length; i++) {
      var lo = legOffsets[i];
      var leg = makeMesh(new THREE.BoxGeometry(0.8, 5, 0.8), 0xC0A070);
      placeMesh(leg, ox + lo.x, 1.5, oz + lo.z);
      addMesh(leg);
    }

    var neck = makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0xC8A87A);
    placeMesh(neck, ox, 6.5, oz - 2.5);
    addMesh(neck);

    var head = makeMesh(new THREE.BoxGeometry(2, 2, 3), 0xC8A87A);
    placeMesh(head, ox, 8.5, oz - 3.5);
    addMesh(head);

    var mane = makeMesh(new THREE.SphereGeometry(1.5, 6, 6), 0xE0C090);
    placeMesh(mane, ox, 7, oz - 2.5);
    addMesh(mane);
  }

  function buildPonies() {
    var ponyPositions = [
      { x:  90, z: 20 },
      { x: 100, z: 35 },
      { x: 115, z: 22 },
      { x:  95, z: 50 },
      { x: 110, z: 45 }
    ];
    var i;
    for (i = 0; i < ponyPositions.length; i++) {
      var pp = ponyPositions[i];
      buildPony(pp.x, pp.z);
    }
  }

  function buildCottage(ox, oz) {
    var walls = makeMesh(new THREE.BoxGeometry(10, 5, 6), 0xF5F5F0);
    placeMesh(walls, ox, 2.5, oz);
    addMesh(walls);

    var roof = makeMesh(new THREE.BoxGeometry(12, 2, 8), 0xD4A430);
    placeMesh(roof, ox, 6, oz);
    addMesh(roof);
  }

  function buildVillage() {
    var cottagePos = [
      { x: -50, z: 20 },
      { x: -35, z: 25 },
      { x: -60, z: 35 },
      { x: -45, z: 40 },
      { x: -30, z: 10 }
    ];
    var i;
    for (i = 0; i < cottagePos.length; i++) {
      var cp = cottagePos[i];
      buildCottage(cp.x, cp.z);
    }

    var wall = makeMesh(new THREE.BoxGeometry(1, 3, 15), 0x888878);
    placeMesh(wall, -53, 1.5, 28);
    addMesh(wall);

    var wall2 = makeMesh(new THREE.BoxGeometry(1, 3, 15), 0x888878);
    placeMesh(wall2, -38, 1.5, 30);
    addMesh(wall2);
  }

  function buildAtlanticCoast() {
    var headlands = [
      { w: 15, h: 12, d: 10, x: -150, z: -20 },
      { w: 15, h: 12, d: 10, x: -120, z: -30 },
      { w: 15, h: 12, d: 10, x: -180, z: -10 },
      { w: 15, h: 12, d: 10, x: -140, z: -40 }
    ];
    var i;
    for (i = 0; i < headlands.length; i++) {
      var hl = headlands[i];
      var hmesh = makeMesh(new THREE.BoxGeometry(hl.w, hl.h, hl.d), 0x5A6070);
      placeMesh(hmesh, hl.x, hl.h / 2, hl.z);
      addMesh(hmesh);
    }

    var seaPatches = [
      { x: -155, z:  5 },
      { x: -130, z: -5 },
      { x: -170, z:  0 },
      { x: -145, z: 10 },
      { x: -160, z: 15 }
    ];
    var j;
    for (j = 0; j < seaPatches.length; j++) {
      var sp = seaPatches[j];
      var smesh = makeMesh(new THREE.BoxGeometry(20, 0.5, 15), 0x1A3A6A);
      placeMesh(smesh, sp.x, 0.25, sp.z);
      addMesh(smesh);
    }

    var cove = makeMesh(new THREE.BoxGeometry(20, 0.5, 8), 0xE8D8C0);
    placeMesh(cove, -135, 0.3, -5);
    addMesh(cove);
  }

  function buildLeenane() {
    var buildingData = [
      { w: 8, h: 8, d: 6, color: 0xF5F5F0, x: -200, z: 30 },
      { w: 8, h: 8, d: 6, color: 0xF5F5F0, x: -215, z: 30 },
      { w: 8, h: 8, d: 6, color: 0xCC5500, x: -200, z: 45 },
      { w: 8, h: 8, d: 6, color: 0xCC5500, x: -215, z: 45 },
      { w: 8, h: 8, d: 6, color: 0x6688BB, x: -230, z: 30 },
      { w: 8, h: 8, d: 6, color: 0x6688BB, x: -230, z: 45 }
    ];
    var i;
    for (i = 0; i < buildingData.length; i++) {
      var bd = buildingData[i];
      var bmesh = makeMesh(new THREE.BoxGeometry(bd.w, bd.h, bd.d), bd.color);
      placeMesh(bmesh, bd.x, bd.h / 2, bd.z);
      addMesh(bmesh);
    }

    var fjord = makeMesh(new THREE.BoxGeometry(80, 0.5, 20), 0x1B4E7A);
    placeMesh(fjord, -220, 0.25, 10);
    addMesh(fjord);

    var buoyX = [-210, -220, -230, -240];
    var j;
    for (j = 0; j < buoyX.length; j++) {
      var pole = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), 0x4A2C0A);
      placeMesh(pole, buoyX[j], 4, 12);
      addMesh(pole);
    }
  }

  function buildCroaghPatrick() {
    var mountain = makeMesh(new THREE.BoxGeometry(50, 50, 25), 0x8B7355);
    placeMesh(mountain, 0, 25, -80);
    addMesh(mountain);

    var chapel = makeMesh(new THREE.BoxGeometry(4, 4, 6), 0xF5F5F0);
    placeMesh(chapel, 0, 52, -80);
    addMesh(chapel);

    var pilgrimPath = makeMesh(new THREE.BoxGeometry(2, 0.3, 30), 0xD4C5A9);
    placeMesh(pilgrimPath, 2, 25, -65);
    addMesh(pilgrimPath);
  }

  function build() {
    buildTwelveBens();
    buildDiamondHill();
    buildBog();
    buildPonies();
    buildVillage();
    buildAtlanticCoast();
    buildLeenane();
    buildCroaghPatrick();
  }

  function update(delta) {
    void delta;
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
