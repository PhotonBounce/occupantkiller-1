window.BirminghamBullring = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var rootGroup = null;
  var allMeshes = [];

  var OFFSET_X = 15840;
  var OFFSET_Z = 0;

  function makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeMesh(geometry, material) {
    var mesh = new THREE.Mesh(geometry, material);
    allMeshes.push(mesh);
    return mesh;
  }

  function buildSelfridges() {
    var group = new THREE.Group();

    var baseGeo = new THREE.CylinderGeometry(22, 22, 28, 16);
    var baseMat = makeMaterial(0xC0C0C0);
    var base = makeMesh(baseGeo, baseMat);
    base.position.set(0, 14, 0);
    group.add(base);

    var discMat = makeMaterial(0xE8E8E8);
    var discCount = 80;
    for (var i = 0; i < discCount; i++) {
      var t = i / discCount;
      var phi = Math.acos(1 - 2 * t);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      var r = 22;
      var x = r * Math.sin(phi) * Math.cos(theta);
      var y = r * Math.cos(phi);
      var z = r * Math.sin(phi) * Math.sin(theta);
      var normalLen = Math.sqrt(x * x + y * y + z * z);
      var nx = x / normalLen;
      var ny = y / normalLen;
      var nz = z / normalLen;
      var yWorld = ny * 14 + 14;
      if (yWorld < 0 || yWorld > 28) continue;
      var discGeo = new THREE.SphereGeometry(1.2, 6, 6);
      var disc = makeMesh(discGeo, discMat);
      disc.position.set(nx * 22.5, ny * 14 + 14, nz * 22.5);
      group.add(disc);
    }

    group.position.set(-40, 0, -20);
    return group;
  }

  function buildBullringMainBlock() {
    var group = new THREE.Group();

    var blockGeo = new THREE.BoxGeometry(60, 30, 40);
    var blockMat = makeMaterial(0x708090);
    var block = makeMesh(blockGeo, blockMat);
    block.position.set(0, 15, 0);
    group.add(block);

    var windowMat = makeMaterial(0x87CEEB);
    for (var i = 0; i < 20; i++) {
      var winGeo = new THREE.BoxGeometry(1, 26, 0.5);
      var win = makeMesh(winGeo, windowMat);
      var xPos = -28 + i * 2.9;
      win.position.set(xPos, 15, 20.3);
      group.add(win);
    }

    group.position.set(20, 0, 10);
    return group;
  }

  function buildRotunda() {
    var group = new THREE.Group();

    var towerGeo = new THREE.CylinderGeometry(10, 10, 80, 16);
    var towerMat = makeMaterial(0xD2D2D2);
    var tower = makeMesh(towerGeo, towerMat);
    tower.position.set(0, 40, 0);
    group.add(tower);

    var ringMat = makeMaterial(0xAAAAAA);
    for (var i = 0; i < 20; i++) {
      var ringGeo = new THREE.CylinderGeometry(10.5, 10.5, 0.5, 16);
      var ring = makeMesh(ringGeo, ringMat);
      ring.position.set(0, 2 + i * 4, 0);
      group.add(ring);
    }

    group.position.set(60, 0, -30);
    return group;
  }

  function buildBull() {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(5, 4, 8);
    var bodyMat = makeMaterial(0xB8860B);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.set(0, 3, 0);
    group.add(body);

    var legMat = makeMaterial(0xB8860B);
    var legPositions = [
      [-1.5, 0, -2.5],
      [1.5, 0, -2.5],
      [-1.5, 0, 2.5],
      [1.5, 0, 2.5]
    ];
    for (var i = 0; i < legPositions.length; i++) {
      var legGeo = new THREE.BoxGeometry(1, 5, 1);
      var leg = makeMesh(legGeo, legMat);
      leg.position.set(legPositions[i][0], 0.5, legPositions[i][2]);
      group.add(leg);
    }

    var headGeo = new THREE.BoxGeometry(3, 3, 3);
    var headMat = makeMaterial(0xB8860B);
    var head = makeMesh(headGeo, headMat);
    head.position.set(0, 5, -5);
    group.add(head);

    var hornMat = makeMaterial(0xB8860B);
    var hornGeo1 = new THREE.BoxGeometry(0.5, 2, 2);
    var horn1 = makeMesh(hornGeo1, hornMat);
    horn1.position.set(-1.5, 6.5, -5.5);
    horn1.rotation.z = 0.4;
    group.add(horn1);

    var hornGeo2 = new THREE.BoxGeometry(0.5, 2, 2);
    var horn2 = makeMesh(hornGeo2, hornMat);
    horn2.position.set(1.5, 6.5, -5.5);
    horn2.rotation.z = -0.4;
    group.add(horn2);

    var tailMat = makeMaterial(0xB8860B);
    var tailGeo1 = new THREE.BoxGeometry(0.5, 0.5, 3);
    var tail1 = makeMesh(tailGeo1, tailMat);
    tail1.position.set(0, 4.5, 4.5);
    tail1.rotation.x = -0.5;
    group.add(tail1);

    var tailGeo2 = new THREE.BoxGeometry(0.5, 0.5, 3);
    var tail2 = makeMesh(tailGeo2, tailMat);
    tail2.position.set(0, 5.5, 6.5);
    tail2.rotation.x = 0.3;
    group.add(tail2);

    group.position.set(-10, 0, 30);
    return group;
  }

  function buildStMartins() {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(20, 18, 14);
    var bodyMat = makeMaterial(0xB8A898);
    var body = makeMesh(bodyGeo, bodyMat);
    body.position.set(0, 9, 0);
    group.add(body);

    var spireGeo = new THREE.ConeGeometry(5, 20, 8);
    var spireMat = makeMaterial(0x696969);
    var spire = makeMesh(spireGeo, spireMat);
    spire.position.set(0, 28, 0);
    group.add(spire);

    var buttressMat = makeMaterial(0xB8A898);
    var buttressPositions = [
      [-12, 0],
      [12, 0],
      [0, -9],
      [0, 9]
    ];
    for (var i = 0; i < buttressPositions.length; i++) {
      var bGeo = new THREE.BoxGeometry(2, 12, 3);
      var butt = makeMesh(bGeo, buttressMat);
      butt.position.set(buttressPositions[i][0], 6, buttressPositions[i][1]);
      group.add(butt);
    }

    group.position.set(-30, 0, 40);
    return group;
  }

  function buildCanalBridge() {
    var group = new THREE.Group();

    var archMat = makeMaterial(0x888888);

    var arch1Geo = new THREE.BoxGeometry(4, 10, 4);
    var arch1 = makeMesh(arch1Geo, archMat);
    arch1.position.set(-13, 5, 0);
    group.add(arch1);

    var arch2Geo = new THREE.BoxGeometry(4, 10, 4);
    var arch2 = makeMesh(arch2Geo, archMat);
    arch2.position.set(13, 5, 0);
    group.add(arch2);

    var deckGeo = new THREE.BoxGeometry(30, 2, 8);
    var deckMat = makeMaterial(0x999999);
    var deck = makeMesh(deckGeo, deckMat);
    deck.position.set(0, 10, 0);
    group.add(deck);

    group.position.set(10, 0, 60);
    return group;
  }

  function buildMarketStalls() {
    var group = new THREE.Group();

    var stallColors = [0xFF6600, 0x0066FF, 0xFFCC00];
    var postMat = makeMaterial(0x555555);

    for (var i = 0; i < 8; i++) {
      var stallGroup = new THREE.Group();
      var color = stallColors[i % stallColors.length];
      var canopyGeo = new THREE.BoxGeometry(5, 0.3, 4);
      var canopyMat = makeMaterial(color);
      var canopy = makeMesh(canopyGeo, canopyMat);
      canopy.position.set(0, 3, 0);
      stallGroup.add(canopy);

      var postPositions = [
        [-2, 0, -1.5],
        [2, 0, -1.5],
        [-2, 0, 1.5],
        [2, 0, 1.5]
      ];
      for (var j = 0; j < postPositions.length; j++) {
        var postGeo = new THREE.BoxGeometry(0.2, 3, 0.2);
        var post = makeMesh(postGeo, postMat);
        post.position.set(postPositions[j][0], 1.5, postPositions[j][2]);
        stallGroup.add(post);
      }

      stallGroup.position.set(-35 + i * 9, 0, 55);
      group.add(stallGroup);
    }

    return group;
  }

  function buildPedestrianPlaza() {
    var group = new THREE.Group();

    var tileMat = makeMaterial(0xD4D4D4);
    var tilePositions = [
      [-25, 0, -10],
      [5, 0, -10],
      [35, 0, -10]
    ];
    for (var i = 0; i < tilePositions.length; i++) {
      var tileGeo = new THREE.BoxGeometry(20, 0.5, 20);
      var tile = makeMesh(tileGeo, tileMat);
      tile.position.set(tilePositions[i][0], tilePositions[i][1], tilePositions[i][2]);
      group.add(tile);
    }

    var poleColors = [0x444444];
    var lampPositions = [
      [-30, 0, -15],
      [0, 0, -15],
      [30, 0, -15],
      [-30, 0, -5],
      [0, 0, -5],
      [30, 0, -5]
    ];
    for (var k = 0; k < lampPositions.length; k++) {
      var poleMat = makeMaterial(0x444444);
      var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 6);
      var pole = makeMesh(poleGeo, poleMat);
      pole.position.set(lampPositions[k][0], 6, lampPositions[k][2]);
      group.add(pole);

      var globeGeo = new THREE.SphereGeometry(1.2, 6, 6);
      var globeMat = makeMaterial(0xFFFF99);
      var globe = makeMesh(globeGeo, globeMat);
      globe.position.set(lampPositions[k][0], 12.5, lampPositions[k][2]);
      group.add(globe);
    }

    group.position.set(0, 0, -50);
    return group;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function build() {
    rootGroup = new THREE.Group();
    rootGroup.position.set(OFFSET_X, 0, OFFSET_Z);

    var selfridges = buildSelfridges();
    rootGroup.add(selfridges);

    var mainBlock = buildBullringMainBlock();
    rootGroup.add(mainBlock);

    var rotunda = buildRotunda();
    rootGroup.add(rotunda);

    var bull = buildBull();
    rootGroup.add(bull);

    var church = buildStMartins();
    rootGroup.add(church);

    var bridge = buildCanalBridge();
    rootGroup.add(bridge);

    var stalls = buildMarketStalls();
    rootGroup.add(stalls);

    var plaza = buildPedestrianPlaza();
    rootGroup.add(plaza);

    scene.add(rootGroup);
  }

  function update(delta) {
    // Static environment — no per-frame animation required
  }

  function reset() {
    if (rootGroup && scene) {
      scene.remove(rootGroup);
    }
    rootGroup = null;
    allMeshes = [];
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
