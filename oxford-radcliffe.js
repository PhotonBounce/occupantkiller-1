window.OxfordRadcliffe = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 16160;
  var OFFSET_Z = 0;

  function makePos(x, y, z) {
    return { x: OFFSET_X + x, y: y, z: OFFSET_Z + z };
  }

  function addMesh(geometry, color, px, py, pz) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(px, py, pz);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildRadcliffeCamera() {
    var p;

    // Base drum
    p = makePos(0, 6, 0);
    addMesh(
      new THREE.CylinderGeometry(14, 14, 12, 16),
      0xE8D5A8,
      p.x, p.y, p.z
    );

    // Upper drum
    p = makePos(0, 17, 0);
    addMesh(
      new THREE.CylinderGeometry(12, 12, 10, 16),
      0xE0CC9E,
      p.x, p.y, p.z
    );

    // Dome base ring
    p = makePos(0, 23.5, 0);
    addMesh(
      new THREE.CylinderGeometry(10, 10, 3, 16),
      0xD8C496,
      p.x, p.y, p.z
    );

    // Dome sphere top half
    p = makePos(0, 25, 0);
    addMesh(
      new THREE.SphereGeometry(10, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      0xD0BC8E,
      p.x, p.y, p.z
    );

    // Lantern at apex
    p = makePos(0, 38, 0);
    addMesh(
      new THREE.CylinderGeometry(2, 2, 6, 16),
      0xC8B486,
      p.x, p.y, p.z
    );
  }

  function buildBodleianLibrary() {
    var p;
    var i;

    // Main wing
    p = makePos(-36, 8, 10);
    addMesh(
      new THREE.BoxGeometry(40, 16, 15),
      0xE0D0B0,
      p.x, p.y, p.z
    );

    // Gothic windows (8 inset)
    var windowPositions = [
      -16, -11, -6, -1, 4, 9, 14, 19
    ];
    for (i = 0; i < windowPositions.length; i++) {
      p = makePos(-16 + windowPositions[i], 9, 3.5);
      addMesh(
        new THREE.BoxGeometry(3, 12, 0.5),
        0x87CEEB,
        p.x, p.y, p.z
      );
    }

    // 4 decorative pinnacles
    var pinnacleX = [-53, -45, -27, -19];
    for (i = 0; i < pinnacleX.length; i++) {
      p = makePos(pinnacleX[i], 20, 10);
      addMesh(
        new THREE.BoxGeometry(2, 8, 2),
        0xD8C8A0,
        p.x, p.y, p.z
      );
    }
  }

  function buildSchoolsQuadrangle() {
    var p;
    var i;

    // Tower of the 5 Orders
    p = makePos(30, 18, 0);
    addMesh(
      new THREE.BoxGeometry(12, 36, 12),
      0xE8D5A8,
      p.x, p.y, p.z
    );

    // 5 rows of pilasters (Doric/Ionic/Corinthian/Composite/Tuscan)
    var pilasterY = [4, 10, 16, 22, 28];
    for (i = 0; i < pilasterY.length; i++) {
      p = makePos(30, pilasterY[i], -6.25);
      addMesh(
        new THREE.BoxGeometry(1, 6, 0.5),
        0xDDC898,
        p.x, p.y, p.z
      );
      p = makePos(30, pilasterY[i], 6.25);
      addMesh(
        new THREE.BoxGeometry(1, 6, 0.5),
        0xDDC898,
        p.x, p.y, p.z
      );
    }
  }

  function buildAllSouls() {
    var p;
    var i;

    // Main building
    p = makePos(-10, 9, -28);
    addMesh(
      new THREE.BoxGeometry(30, 18, 14),
      0xDDCCA0,
      p.x, p.y, p.z
    );

    // Twin Gothic towers
    var towerX = [-22, 2];
    for (i = 0; i < towerX.length; i++) {
      p = makePos(towerX[i], 14, -28);
      addMesh(
        new THREE.BoxGeometry(6, 28, 6),
        0xDDCCA0,
        p.x, p.y, p.z
      );
      // Cone caps
      p = makePos(towerX[i], 31, -28);
      addMesh(
        new THREE.ConeGeometry(3.5, 6, 8),
        0xCCBB90,
        p.x, p.y, p.z
      );
    }
  }

  function buildStMaryVirgin() {
    var p;
    var i;

    // Ornate base
    p = makePos(0, 10, 30);
    addMesh(
      new THREE.BoxGeometry(20, 20, 15),
      0xCCBBAA,
      p.x, p.y, p.z
    );

    // Gothic spire
    p = makePos(0, 39, 30);
    addMesh(
      new THREE.BoxGeometry(10, 38, 10),
      0xCCBBAA,
      p.x, p.y, p.z
    );

    // Porch buttresses with cone caps
    var buttressX = [-12, 12];
    for (i = 0; i < buttressX.length; i++) {
      p = makePos(buttressX[i], 8, 37);
      addMesh(
        new THREE.BoxGeometry(3, 16, 3),
        0xCCBBAA,
        p.x, p.y, p.z
      );
      p = makePos(buttressX[i], 17, 37);
      addMesh(
        new THREE.ConeGeometry(2, 5, 8),
        0xCCBBAA,
        p.x, p.y, p.z
      );
    }
  }

  function buildOxfordSkyline() {
    var i;
    var p;
    var skylineData = [
      { x: -60, z: -50, tw: 5, th: 28, cr: 2.5, ch: 6 },
      { x: -40, z: -50, tw: 6, th: 22, cr: 3,   ch: 5 },
      { x: -20, z: -50, tw: 5, th: 35, cr: 2,   ch: 7 },
      { x:  10, z: -50, tw: 7, th: 30, cr: 3.5, ch: 6 },
      { x:  35, z: -50, tw: 4, th: 20, cr: 2,   ch: 5 },
      { x:  55, z: -50, tw: 6, th: 25, cr: 3,   ch: 6 }
    ];

    for (i = 0; i < skylineData.length; i++) {
      var d = skylineData[i];
      p = makePos(d.x, d.th / 2, d.z);
      addMesh(
        new THREE.BoxGeometry(d.tw, d.th, d.tw),
        0xB8A888,
        p.x, p.y, p.z
      );
      p = makePos(d.x, d.th + d.ch / 2, d.z);
      addMesh(
        new THREE.ConeGeometry(d.cr, d.ch, 8),
        0xB8A888,
        p.x, p.y, p.z
      );
    }
  }

  function buildRadcliffeSquarePaving() {
    var i;
    var p;
    var tileOffsets = [
      { x: -11, z: -11 },
      { x:  11, z: -11 },
      { x: -11, z:  11 },
      { x:  11, z:  11 }
    ];

    for (i = 0; i < tileOffsets.length; i++) {
      p = makePos(tileOffsets[i].x, 0.25, tileOffsets[i].z);
      addMesh(
        new THREE.BoxGeometry(20, 0.5, 20),
        0xC8C0B0,
        p.x, p.y, p.z
      );
    }
  }

  function buildBicycles() {
    var i;
    var p;
    var rackPositions = [
      { x: -20, z: 18 },
      { x:  20, z: 18 },
      { x: -20, z: -18 },
      { x:  20, z: -18 }
    ];

    for (i = 0; i < rackPositions.length; i++) {
      var rp = rackPositions[i];

      // Bike rack
      p = makePos(rp.x, 0.65, rp.z);
      addMesh(
        new THREE.BoxGeometry(3, 1, 0.3),
        0x888888,
        p.x, p.y, p.z
      );

      // Two bicycles per rack — front wheel
      p = makePos(rp.x - 0.8, 1.5, rp.z);
      addMesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12),
        0x222222,
        p.x, p.y, p.z
      );
      // front frame
      p = makePos(rp.x - 0.8, 1.5, rp.z);
      addMesh(
        new THREE.BoxGeometry(3, 1, 0.15),
        0x444444,
        p.x, p.y, p.z
      );
      // front rear wheel
      p = makePos(rp.x + 0.8, 1.5, rp.z);
      addMesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12),
        0x222222,
        p.x, p.y, p.z
      );

      // Second bicycle
      p = makePos(rp.x - 0.8, 1.5, rp.z + 0.6);
      addMesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12),
        0x222222,
        p.x, p.y, p.z
      );
      p = makePos(rp.x - 0.8, 1.5, rp.z + 0.6);
      addMesh(
        new THREE.BoxGeometry(3, 1, 0.15),
        0x444444,
        p.x, p.y, p.z
      );
      p = makePos(rp.x + 0.8, 1.5, rp.z + 0.6);
      addMesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12),
        0x222222,
        p.x, p.y, p.z
      );
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
  }

  function build() {
    buildRadcliffeSquarePaving();
    buildRadcliffeCamera();
    buildBodleianLibrary();
    buildSchoolsQuadrangle();
    buildAllSouls();
    buildStMaryVirgin();
    buildOxfordSkyline();
    buildBicycles();
  }

  function update(delta) {
    // Static environment — no per-frame animation needed
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
