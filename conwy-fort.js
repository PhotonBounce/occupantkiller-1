window.ConwyFort = (function() {
  'use strict';

  var WX = 3370;
  var WZ = 2200;

  function makeMat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeCone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeSphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function buildcastlemain(group) {
    var body = makeBox(30, 12, 18, 0x9A8A78, WX, 6, WZ);
    group.add(body);

    var towerPositions = [
      [WX - 15, WZ - 9],
      [WX + 15, WZ - 9],
      [WX - 15, WZ + 9],
      [WX + 15, WZ + 9],
      [WX,      WZ - 9],
      [WX,      WZ + 9],
      [WX - 15, WZ    ],
      [WX + 15, WZ    ]
    ];

    var i;
    for (i = 0; i < towerPositions.length; i++) {
      var tx = towerPositions[i][0];
      var tz = towerPositions[i][1];
      var cyl = makeCylinder(4, 4, 16, 12, 0x9A8A78, tx, 8, tz);
      group.add(cyl);
      var cone = makeCone(4.5, 4, 12, 0x6A5A4A, tx, 18, tz);
      group.add(cone);
    }

    var innerWardFloor = makeBox(20, 0.5, 12, 0x7A6A58, WX, 0.25, WZ);
    group.add(innerWardFloor);

    var outerWardN = makeBox(36, 6, 3, 0x9A8A78, WX, 3, WZ - 12);
    group.add(outerWardN);
    var outerWardS = makeBox(36, 6, 3, 0x9A8A78, WX, 3, WZ + 12);
    group.add(outerWardS);
    var outerWardE = makeBox(3, 6, 24, 0x9A8A78, WX + 17, 3, WZ);
    group.add(outerWardE);
    var outerWardW = makeBox(3, 6, 24, 0x9A8A78, WX - 17, 3, WZ);
    group.add(outerWardW);
  }

  function buildtownwalls(group) {
    var wallColor = 0x9A8A78;
    var wallThick = 2;
    var wallH = 6;

    var wallN = makeBox(120, wallH, wallThick, wallColor, WX - 60, wallH / 2, WZ - 60);
    group.add(wallN);
    var wallS = makeBox(120, wallH, wallThick, wallColor, WX + 60, wallH / 2, WZ + 60);
    group.add(wallS);
    var wallW = makeBox(wallThick, wallH, 120, wallColor, WX - 120, wallH / 2, WZ);
    group.add(wallW);
    var wallE = makeBox(wallThick, wallH, 120, wallColor, WX + 120, wallH / 2, WZ);
    group.add(wallE);

    var towerSpacing = 20;
    var j;

    for (j = 0; j < 7; j++) {
      var tnx = WX - 100 + j * towerSpacing;
      var tcylN = makeCylinder(2.5, 2.5, 8, 10, wallColor, tnx, 4, WZ - 60);
      group.add(tcylN);
      var tconeN = makeCone(3, 3, 10, 0x6A5A4A, tnx, 9.5, WZ - 60);
      group.add(tconeN);
    }

    for (j = 0; j < 7; j++) {
      var tsx = WX + 20 + j * towerSpacing;
      var tcylS = makeCylinder(2.5, 2.5, 8, 10, wallColor, tsx, 4, WZ + 60);
      group.add(tcylS);
      var tconeS = makeCone(3, 3, 10, 0x6A5A4A, tsx, 9.5, WZ + 60);
      group.add(tconeS);
    }

    for (j = 0; j < 7; j++) {
      var twz = WZ - 60 + j * towerSpacing;
      var tcylW = makeCylinder(2.5, 2.5, 8, 10, wallColor, WX - 120, 4, twz);
      group.add(tcylW);
      var tconeW = makeCone(3, 3, 10, 0x6A5A4A, WX - 120, 9.5, twz);
      group.add(tconeW);
    }

    var gateN = makeBox(6, 8, 3, wallColor, WX - 10, 4, WZ - 60);
    group.add(gateN);
    var gateS = makeBox(6, 8, 3, wallColor, WX + 80, 4, WZ + 60);
    group.add(gateS);
    var gateW = makeBox(3, 8, 6, wallColor, WX - 120, 4, WZ + 20);
    group.add(gateW);

    var gateTopN = makeBox(6, 2, 3, wallColor, WX - 10, 9, WZ - 60);
    group.add(gateTopN);
    var gateTopS = makeBox(6, 2, 3, wallColor, WX + 80, 9, WZ + 60);
    group.add(gateTopS);
    var gateTopW = makeBox(3, 2, 6, wallColor, WX - 120, 9, WZ + 20);
    group.add(gateTopW);
  }

  function buildtelfordbridge(group) {
    var pylonColor = 0x2A2A2A;
    var deckColor = 0x4A4A4A;

    var pylonH = 18;
    var pylon1 = makeBox(2, pylonH, 2, pylonColor, WX + 50, pylonH / 2, WZ + 30);
    group.add(pylon1);
    var pylon2 = makeBox(2, pylonH, 2, pylonColor, WX + 80, pylonH / 2, WZ + 30);
    group.add(pylon2);

    var top1 = makeBox(4, 2, 2, pylonColor, WX + 50, pylonH + 1, WZ + 30);
    group.add(top1);
    var top2 = makeBox(4, 2, 2, pylonColor, WX + 80, pylonH + 1, WZ + 30);
    group.add(top2);

    var deck = makeBox(32, 1, 4, deckColor, WX + 65, 3, WZ + 30);
    group.add(deck);

    var cableGeo = new THREE.BufferGeometry();
    var cableVerts = new Float32Array([
      WX + 50, pylonH, WZ + 30,
      WX + 58, 3.5, WZ + 30,
      WX + 50, pylonH, WZ + 30,
      WX + 63, 3.5, WZ + 30,
      WX + 50, pylonH, WZ + 30,
      WX + 68, 3.5, WZ + 30,
      WX + 80, pylonH, WZ + 30,
      WX + 72, 3.5, WZ + 30,
      WX + 80, pylonH, WZ + 30,
      WX + 67, 3.5, WZ + 30,
      WX + 80, pylonH, WZ + 30,
      WX + 62, 3.5, WZ + 30
    ]);
    cableGeo.setAttribute('position', new THREE.BufferAttribute(cableVerts, 3));
    var cableMat = new THREE.LineBasicMaterial({ color: 0x1A1A1A });
    var cables = new THREE.LineSegments(cableGeo, cableMat);
    group.add(cables);

    var railPylon1 = makeBox(2, 12, 2, pylonColor, WX + 52, 6, WZ + 36);
    group.add(railPylon1);
    var railPylon2 = makeBox(2, 12, 2, pylonColor, WX + 78, 6, WZ + 36);
    group.add(railPylon2);
    var railDeck = makeBox(28, 1, 4, 0x3A3A3A, WX + 65, 2, WZ + 36);
    group.add(railDeck);
  }

  function buildestuary(group) {
    var waterColor = 0x1A6B8A;
    var water1 = makeBox(200, 0.5, 40, waterColor, WX + 65, 0, WZ + 60);
    group.add(water1);
    var water2 = makeBox(200, 0.5, 20, waterColor, WX + 65, 0, WZ + 85);
    group.add(water2);
    var water3 = makeBox(60, 0.5, 30, waterColor, WX + 65, 0, WZ + 30);
    group.add(water3);
  }

  function buildsmallestHouse(group) {
    var house = makeBox(2, 4, 2, 0xFF3333, WX + 35, 2, WZ + 5);
    group.add(house);
    var roof = makeCone(1.8, 1.5, 4, 0x8B0000, WX + 35, 4.75, WZ + 5);
    group.add(roof);
  }

  function buildmusselBeds(group) {
    var musselColor = 0x3A3A4A;
    var positions = [
      [WX + 60, WZ + 65],
      [WX + 68, WZ + 68],
      [WX + 55, WZ + 72],
      [WX + 73, WZ + 62],
      [WX + 62, WZ + 78],
      [WX + 78, WZ + 70],
      [WX + 50, WZ + 66],
      [WX + 66, WZ + 58],
      [WX + 80, WZ + 75]
    ];
    var k;
    for (k = 0; k < positions.length; k++) {
      var sx = positions[k][0];
      var sz = positions[k][1];
      var s = makeSphere(1.5 + Math.random(), 8, 6, musselColor, sx, 0.5, sz);
      group.add(s);
    }
  }

  function init(scene) {
    var group = new THREE.Group();

    buildcastlemain(group);
    buildtownwalls(group);
    buildtelfordbridge(group);
    buildestuary(group);
    buildsmallestHouse(group);
    buildmusselBeds(group);

    scene.add(group);
    return group;
  }

  return {
    init: init
  };

}());
