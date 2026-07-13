window.NottinghamCastle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var group = null;

  var OFFSET_X = 15680;
  var OFFSET_Z = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    group = new THREE.Group();
    group.position.set(OFFSET_X, 0, OFFSET_Z);
    scene.add(group);
  }

  function makeMesh(geometry, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, mat);
    return mesh;
  }

  function buildRock() {
    var rockColor = 0xC2956C;
    var rockDefs = [
      { w: 40, h: 8,  d: 38, x: 0,    y: 4,   z: 0    },
      { w: 36, h: 6,  d: 32, x: -2,   y: 10,  z: 1    },
      { w: 28, h: 7,  d: 26, x: 3,    y: 14,  z: -2   },
      { w: 22, h: 6,  d: 20, x: -4,   y: 19,  z: 2    },
      { w: 30, h: 8,  d: 28, x: 6,    y: 7,   z: 5    },
      { w: 24, h: 10, d: 22, x: -6,   y: 3,   z: -4   },
      { w: 20, h: 9,  d: 18, x: 8,    y: 11,  z: -6   },
      { w: 26, h: 12, d: 24, x: -3,   y: 1,   z: 3    }
    ];

    for (var i = 0; i < rockDefs.length; i++) {
      var def = rockDefs[i];
      var geo = new THREE.BoxGeometry(def.w, def.h, def.d);
      var mesh = makeMesh(geo, rockColor);
      mesh.position.set(def.x, def.y, def.z);
      group.add(mesh);
      objects.push(mesh);
    }
  }

  function buildGatehouse() {
    var brickColor = 0x8B4513;
    var darkColor = 0x111111;

    var gateBase = makeMesh(new THREE.BoxGeometry(14, 16, 10), brickColor);
    gateBase.position.set(0, 20, 20);
    group.add(gateBase);
    objects.push(gateBase);

    var archFill = makeMesh(new THREE.BoxGeometry(4, 8, 10), darkColor);
    archFill.position.set(0, 16, 20);
    group.add(archFill);
    objects.push(archFill);

    var archTop = makeMesh(new THREE.BoxGeometry(4, 2, 10), brickColor);
    archTop.position.set(0, 23, 20);
    group.add(archTop);
    objects.push(archTop);

    var leftJamb = makeMesh(new THREE.BoxGeometry(2, 8, 2), brickColor);
    leftJamb.position.set(-3, 16, 14);
    group.add(leftJamb);
    objects.push(leftJamb);

    var rightJamb = makeMesh(new THREE.BoxGeometry(2, 8, 2), brickColor);
    rightJamb.position.set(3, 16, 14);
    group.add(rightJamb);
    objects.push(rightJamb);
  }

  function buildCurtainWall() {
    var wallColor = 0x808080;
    var crenColor = 0x808080;

    var northWall = makeMesh(new THREE.BoxGeometry(50, 10, 2), wallColor);
    northWall.position.set(0, 17, -22);
    group.add(northWall);
    objects.push(northWall);

    for (var cn = 0; cn < 6; cn++) {
      var crenN = makeMesh(new THREE.BoxGeometry(3, 3, 2), crenColor);
      crenN.position.set(-12.5 + cn * 5, 24, -22);
      group.add(crenN);
      objects.push(crenN);
    }

    var eastWall = makeMesh(new THREE.BoxGeometry(2, 10, 40), wallColor);
    eastWall.position.set(26, 17, 0);
    group.add(eastWall);
    objects.push(eastWall);

    for (var ce = 0; ce < 6; ce++) {
      var crenE = makeMesh(new THREE.BoxGeometry(2, 3, 3), crenColor);
      crenE.position.set(26, 24, -12.5 + ce * 5);
      group.add(crenE);
      objects.push(crenE);
    }

    var westWall = makeMesh(new THREE.BoxGeometry(2, 10, 40), wallColor);
    westWall.position.set(-26, 17, 0);
    group.add(westWall);
    objects.push(westWall);

    for (var cw = 0; cw < 6; cw++) {
      var crenW = makeMesh(new THREE.BoxGeometry(2, 3, 3), crenColor);
      crenW.position.set(-26, 24, -12.5 + cw * 5);
      group.add(crenW);
      objects.push(crenW);
    }
  }

  function buildMuralTowers() {
    var towerColor = 0x696969;
    var capColor = 0x556B2F;

    var towerPositions = [
      { x: 26,  z: -22 },
      { x: -26, z: -22 },
      { x: 26,  z: 22  }
    ];

    for (var t = 0; t < towerPositions.length; t++) {
      var tp = towerPositions[t];

      var towerGeo = new THREE.CylinderGeometry(3.5, 3.5, 14, 8);
      var tower = makeMesh(towerGeo, towerColor);
      tower.position.set(tp.x, 19, tp.z);
      group.add(tower);
      objects.push(tower);

      var capGeo = new THREE.ConeGeometry(3.5, 5, 8);
      var cap = makeMesh(capGeo, capColor);
      cap.position.set(tp.x, 29, tp.z);
      group.add(cap);
      objects.push(cap);
    }
  }

  function buildPalace() {
    var palaceColor = 0xD2B48C;
    var darkColor = 0x111111;

    var palace = makeMesh(new THREE.BoxGeometry(16, 10, 12), palaceColor);
    palace.position.set(-6, 17, -5);
    group.add(palace);
    objects.push(palace);

    var windowSlots = [
      { x: -8,  y: 19, z: -11 },
      { x: -4,  y: 19, z: -11 },
      { x: 0,   y: 19, z: -11 },
      { x: -8,  y: 19, z:  1  },
      { x: -4,  y: 19, z:  1  },
      { x: 0,   y: 19, z:  1  }
    ];

    for (var w = 0; w < windowSlots.length; w++) {
      var ws = windowSlots[w];
      var winGeo = new THREE.BoxGeometry(2, 3, 0.5);
      var win = makeMesh(winGeo, darkColor);
      win.position.set(ws.x, ws.y, ws.z);
      group.add(win);
      objects.push(win);
    }
  }

  function buildCaves() {
    var caveColor = 0x2F2F2F;

    var caveDefs = [
      { x: -8,  y: 4,  z: 15 },
      { x: 4,   y: 3,  z: 18 },
      { x: -2,  y: 5,  z: 12 }
    ];

    for (var c = 0; c < caveDefs.length; c++) {
      var cd = caveDefs[c];
      var caveGeo = new THREE.BoxGeometry(12, 4, 3);
      var cave = makeMesh(caveGeo, caveColor);
      cave.position.set(cd.x, cd.y, cd.z);
      group.add(cave);
      objects.push(cave);
    }
  }

  function buildMuseumWing() {
    var concreteColor = 0xB0B0B0;

    var wingMain = makeMesh(new THREE.BoxGeometry(20, 8, 8), concreteColor);
    wingMain.position.set(10, 16, 14);
    group.add(wingMain);
    objects.push(wingMain);

    var wingArm = makeMesh(new THREE.BoxGeometry(8, 8, 12), concreteColor);
    wingArm.position.set(19, 16, 19);
    group.add(wingArm);
    objects.push(wingArm);

    var roofMain = makeMesh(new THREE.BoxGeometry(20, 0.5, 8), concreteColor);
    roofMain.position.set(10, 20.25, 14);
    group.add(roofMain);
    objects.push(roofMain);

    var roofArm = makeMesh(new THREE.BoxGeometry(8, 0.5, 12), concreteColor);
    roofArm.position.set(19, 20.25, 19);
    group.add(roofArm);
    objects.push(roofArm);
  }

  function buildRobinHoodStatue() {
    var plinthColor = 0x999999;
    var figureColor = 0x2C1810;

    var plinth = makeMesh(new THREE.BoxGeometry(2, 5, 2), plinthColor);
    plinth.position.set(0, 14.5, 5);
    group.add(plinth);
    objects.push(plinth);

    var legs = makeMesh(new THREE.BoxGeometry(1.2, 2, 1.2), figureColor);
    legs.position.set(0, 18.5, 5);
    group.add(legs);
    objects.push(legs);

    var torso = makeMesh(new THREE.BoxGeometry(1.4, 2, 1.0), figureColor);
    torso.position.set(0, 20.5, 5);
    group.add(torso);
    objects.push(torso);

    var head = makeMesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), figureColor);
    head.position.set(0, 22.2, 5);
    group.add(head);
    objects.push(head);

    var hat = makeMesh(new THREE.BoxGeometry(1.0, 0.5, 1.0), figureColor);
    hat.position.set(0, 22.9, 5);
    group.add(hat);
    objects.push(hat);
  }

  function build() {
    buildRock();
    buildGatehouse();
    buildCurtainWall();
    buildMuralTowers();
    buildPalace();
    buildCaves();
    buildMuseumWing();
    buildRobinHoodStatue();
  }

  function update(delta) {
    if (objects.length > 0) {
      objects[0].rotation.y += delta * 0.002;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      group.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
    if (group && scene) {
      scene.remove(group);
    }
    group = null;
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
