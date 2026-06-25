window.BrightonPier = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 16320;
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

  function buildPierDeck() {
    var i;
    var plank;
    var geo;
    for (i = 0; i < 12; i++) {
      geo = new THREE.BoxGeometry(6, 0.5, 12);
      plank = makeMesh(geo, 0x8B6914);
      plank.position.set(OFFSET_X, 0.25, OFFSET_Z + (i * 12) - 66);
      addToScene(plank);
    }
    var leftRail = makeMesh(new THREE.BoxGeometry(0.3, 1.5, 80), 0x6B5012);
    leftRail.position.set(OFFSET_X - 3, 1.25, OFFSET_Z - 6);
    addToScene(leftRail);

    var rightRail = makeMesh(new THREE.BoxGeometry(0.3, 1.5, 80), 0x6B5012);
    rightRail.position.set(OFFSET_X + 3, 1.25, OFFSET_Z - 6);
    addToScene(rightRail);
  }

  function buildSupportLegs() {
    var row, col;
    var leg;
    for (row = 0; row < 2; row++) {
      for (col = 0; col < 10; col++) {
        leg = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 10, 8), 0x333333);
        leg.position.set(
          OFFSET_X + (row === 0 ? -2 : 2),
          -5,
          OFFSET_Z - 60 + col * 8
        );
        addToScene(leg);
      }
    }
  }

  function buildPavilion() {
    var building = makeMesh(new THREE.BoxGeometry(18, 10, 12), 0xF5EFE0);
    building.position.set(OFFSET_X, 5.5, OFFSET_Z + 44);
    addToScene(building);

    var domeCyl = makeMesh(new THREE.CylinderGeometry(9, 9, 4, 16), 0xE0D8C8);
    domeCyl.position.set(OFFSET_X, 12, OFFSET_Z + 44);
    addToScene(domeCyl);

    var domeSphere = makeMesh(new THREE.SphereGeometry(8, 16, 12), 0xD8D0C0);
    domeSphere.position.set(OFFSET_X, 15, OFFSET_Z + 44);
    addToScene(domeSphere);

    var corners = [
      [-8, -5],
      [8, -5],
      [-8, 5],
      [8, 5]
    ];
    var c;
    for (c = 0; c < corners.length; c++) {
      var tower = makeMesh(new THREE.CylinderGeometry(2, 2, 12, 8), 0xC8C0B0);
      tower.position.set(OFFSET_X + corners[c][0], 6.5, OFFSET_Z + 44 + corners[c][1]);
      addToScene(tower);

      var cap = makeMesh(new THREE.ConeGeometry(2, 4, 8), 0xC8C0B0);
      cap.position.set(OFFSET_X + corners[c][0], 14, OFFSET_Z + 44 + corners[c][1]);
      addToScene(cap);
    }
  }

  function buildHelterSkelter() {
    var helterCone = makeMesh(new THREE.ConeGeometry(5, 20, 16), 0xFF3333);
    helterCone.position.set(OFFSET_X - 8, 11.5, OFFSET_Z + 10);
    addToScene(helterCone);

    var helterBase = makeMesh(new THREE.CylinderGeometry(5, 5, 3, 16), 0xFFFFFF);
    helterBase.position.set(OFFSET_X - 8, 2, OFFSET_Z + 10);
    addToScene(helterBase);
  }

  function buildGhostTrain() {
    var ghostMain = makeMesh(new THREE.BoxGeometry(10, 8, 8), 0x222244);
    ghostMain.position.set(OFFSET_X + 8, 4.5, OFFSET_Z + 10);
    addToScene(ghostMain);

    var entrance = makeMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x111122);
    entrance.position.set(OFFSET_X + 8, 3, OFFSET_Z + 6.25);
    addToScene(entrance);

    var batAngles = [-0.4, 0, 0.4];
    var b;
    for (b = 0; b < 3; b++) {
      var bat = makeMesh(new THREE.BoxGeometry(0.5, 0.5, 4), 0x111111);
      bat.position.set(OFFSET_X + 6 + b * 2, 9.5, OFFSET_Z + 6);
      bat.rotation.y = batAngles[b];
      addToScene(bat);
    }
  }

  function buildCarousel() {
    var carouselBase = makeMesh(new THREE.CylinderGeometry(6, 6, 3, 12), 0xFFD700);
    carouselBase.position.set(OFFSET_X, 1.75, OFFSET_Z + 28);
    addToScene(carouselBase);

    var p;
    for (p = 0; p < 8; p++) {
      var angle = (p / 8) * Math.PI * 2;
      var pole = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), 0xFFD700);
      pole.position.set(
        OFFSET_X + Math.cos(angle) * 5.5,
        7,
        OFFSET_Z + 28 + Math.sin(angle) * 5.5
      );
      addToScene(pole);
    }
  }

  function buildFunfairRides() {
    buildHelterSkelter();
    buildGhostTrain();
    buildCarousel();
  }

  function buildRollerCoaster() {
    var i;
    for (i = 0; i < 6; i++) {
      var support = makeMesh(new THREE.BoxGeometry(1, 15, 1), 0x888888);
      support.position.set(OFFSET_X - 5 + i * 3, 8, OFFSET_Z + 55 + i * 4);
      addToScene(support);
    }

    var trackHeights = [5, 9, 13, 10, 7, 11];
    var trackTilts = [0.2, -0.3, 0.1, -0.2, 0.3, -0.1];
    for (i = 0; i < 6; i++) {
      var track = makeMesh(new THREE.BoxGeometry(2, 0.5, 10), 0x999999);
      track.position.set(OFFSET_X - 5 + i * 3, trackHeights[i], OFFSET_Z + 58 + i * 4);
      track.rotation.x = trackTilts[i];
      addToScene(track);
    }

    var carriage1 = makeMesh(new THREE.BoxGeometry(3, 2, 6), 0xFF6600);
    carriage1.position.set(OFFSET_X - 5, 6.5, OFFSET_Z + 56);
    addToScene(carriage1);

    var carriage2 = makeMesh(new THREE.BoxGeometry(3, 2, 6), 0xFF6600);
    carriage2.position.set(OFFSET_X, 10.5, OFFSET_Z + 62);
    addToScene(carriage2);
  }

  function buildBrightonBeach() {
    var i;
    for (i = 0; i < 8; i++) {
      var beachTile = makeMesh(new THREE.BoxGeometry(25, 0.8, 12), 0x8B8680);
      beachTile.position.set(OFFSET_X - 40 + i * 10, -0.4, OFFSET_Z - 80);
      addToScene(beachTile);
    }

    for (i = 0; i < 4; i++) {
      var seaTile = makeMesh(new THREE.BoxGeometry(30, 0.5, 15), 0x006994);
      seaTile.position.set(OFFSET_X - 45 + i * 30, -0.25, OFFSET_Z - 95);
      addToScene(seaTile);
    }
  }

  function buildSeafrontHotels() {
    var i, j;
    for (i = 0; i < 3; i++) {
      var hotel = makeMesh(new THREE.BoxGeometry(12, 8, 18), 0xF5F5F0);
      hotel.position.set(OFFSET_X - 20 + i * 15, 4, OFFSET_Z - 100);
      addToScene(hotel);

      for (j = 0; j < 8; j++) {
        var row = Math.floor(j / 4);
        var col = j % 4;
        var win = makeMesh(new THREE.BoxGeometry(1.5, 2.5, 0.3), 0x87CEEB);
        win.position.set(
          OFFSET_X - 20 + i * 15 - 4.5 + col * 3,
          3 + row * 3.5,
          OFFSET_Z - 91.2
        );
        addToScene(win);
      }

      var balcony = makeMesh(new THREE.BoxGeometry(12, 0.3, 2), 0x333333);
      balcony.position.set(OFFSET_X - 20 + i * 15, 5.5, OFFSET_Z - 90.5);
      addToScene(balcony);
    }
  }

  function buildI360Tower() {
    var column = makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 60, 8), 0xC0C0C0);
    column.position.set(OFFSET_X - 30, 30, OFFSET_Z - 85);
    addToScene(column);

    var pod = makeMesh(new THREE.CylinderGeometry(8, 8, 5, 12), 0x87CEEB);
    pod.position.set(OFFSET_X - 30, 58, OFFSET_Z - 85);
    addToScene(pod);

    var base = makeMesh(new THREE.CylinderGeometry(4, 4, 3, 8), 0xAAAAAA);
    base.position.set(OFFSET_X - 30, 1.5, OFFSET_Z - 85);
    addToScene(base);
  }

  function build() {
    buildPierDeck();
    buildSupportLegs();
    buildPavilion();
    buildFunfairRides();
    buildRollerCoaster();
    buildBrightonBeach();
    buildSeafrontHotels();
    buildI360Tower();
  }

  function update(delta) {
    // Static environment — no per-frame animation required
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
