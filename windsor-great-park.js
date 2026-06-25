window.WindsorGreatPark = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];

  var OFFSET_X = 16240;
  var OFFSET_Z = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeMesh(geometry, color) {
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geometry, mat);
    return mesh;
  }

  function buildLongWalk() {
    var i;
    var treeSpacing = 4;
    var rowOffset = 6;

    for (i = 0; i < 20; i++) {
      var zPos = i * treeSpacing;

      // Left row trunk
      var trunkGeoL = new THREE.CylinderGeometry(1.5, 1.5, 14, 8);
      var trunkL = makeMesh(trunkGeoL, 0x4A2C0A);
      trunkL.position.set(OFFSET_X - rowOffset, 7, OFFSET_Z + zPos);
      scene.add(trunkL);
      objects.push(trunkL);

      // Left row canopy
      var canopyGeoL = new THREE.SphereGeometry(7, 8, 8);
      var canopyL = makeMesh(canopyGeoL, 0x2D7A2D);
      canopyL.position.set(OFFSET_X - rowOffset, 18, OFFSET_Z + zPos);
      scene.add(canopyL);
      objects.push(canopyL);

      // Right row trunk
      var trunkGeoR = new THREE.CylinderGeometry(1.5, 1.5, 14, 8);
      var trunkR = makeMesh(trunkGeoR, 0x4A2C0A);
      trunkR.position.set(OFFSET_X + rowOffset, 7, OFFSET_Z + zPos);
      scene.add(trunkR);
      objects.push(trunkR);

      // Right row canopy
      var canopyGeoR = new THREE.SphereGeometry(7, 8, 8);
      var canopyR = makeMesh(canopyGeoR, 0x2D7A2D);
      canopyR.position.set(OFFSET_X + rowOffset, 18, OFFSET_Z + zPos);
      scene.add(canopyR);
      objects.push(canopyR);
    }
  }

  function buildCopperHorse() {
    var baseX = OFFSET_X;
    var baseZ = OFFSET_Z + 90;

    // Hilltop mound
    var moundGeo = new THREE.BoxGeometry(12, 8, 12);
    var mound = makeMesh(moundGeo, 0x2D5A1B);
    mound.position.set(baseX, 4, baseZ);
    scene.add(mound);
    objects.push(mound);

    // Granite plinth
    var plinthGeo = new THREE.BoxGeometry(6, 10, 6);
    var plinth = makeMesh(plinthGeo, 0x888888);
    plinth.position.set(baseX, 13, baseZ);
    scene.add(plinth);
    objects.push(plinth);

    var statueBase = 18;

    // Horse body
    var horseBodyGeo = new THREE.BoxGeometry(4, 3, 6);
    var horseBody = makeMesh(horseBodyGeo, 0xB8860B);
    horseBody.position.set(baseX, statueBase + 1.5, baseZ);
    scene.add(horseBody);
    objects.push(horseBody);

    // Horse legs
    var legOffsets = [
      [-1.2, -1.8],
      [1.2, -1.8],
      [-1.2, 1.8],
      [1.2, 1.8]
    ];
    var j;
    for (j = 0; j < legOffsets.length; j++) {
      var legGeo = new THREE.BoxGeometry(1, 6, 1);
      var leg = makeMesh(legGeo, 0xB8860B);
      leg.position.set(baseX + legOffsets[j][0], statueBase - 2, baseZ + legOffsets[j][1]);
      scene.add(leg);
      objects.push(leg);
    }

    // Rider torso
    var riderTorsoGeo = new THREE.BoxGeometry(2, 3, 2);
    var riderTorso = makeMesh(riderTorsoGeo, 0xB8860B);
    riderTorso.position.set(baseX, statueBase + 4.5, baseZ - 1);
    scene.add(riderTorso);
    objects.push(riderTorso);

    // Rider head
    var riderHeadGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var riderHead = makeMesh(riderHeadGeo, 0xB8860B);
    riderHead.position.set(baseX, statueBase + 6.75, baseZ - 1);
    scene.add(riderHead);
    objects.push(riderHead);
  }

  function buildVirginiaWater() {
    var lakeX = OFFSET_X + 60;
    var lakeZ = OFFSET_Z + 30;

    var tileOffsets = [
      [0, 0],
      [30, 5],
      [60, -5],
      [15, 25],
      [45, 20],
      [30, -25]
    ];
    var k;
    for (k = 0; k < tileOffsets.length; k++) {
      var waterGeo = new THREE.BoxGeometry(30, 0.4, 25);
      var water = makeMesh(waterGeo, 0x2B7DBF);
      water.position.set(lakeX + tileOffsets[k][0], 0.2, lakeZ + tileOffsets[k][1]);
      scene.add(water);
      objects.push(water);
    }

    // Rowing boats
    var boatPositions = [
      [lakeX + 10, lakeZ + 5],
      [lakeX + 45, lakeZ + 15],
      [lakeX + 30, lakeZ - 10],
      [lakeX + 60, lakeZ + 8]
    ];
    var b;
    for (b = 0; b < boatPositions.length; b++) {
      var boatGeo = new THREE.BoxGeometry(3, 1, 8);
      var boat = makeMesh(boatGeo, 0x6B3A1F);
      boat.position.set(boatPositions[b][0], 1, boatPositions[b][1]);
      scene.add(boat);
      objects.push(boat);
    }
  }

  function buildTotemPole() {
    var poleX = OFFSET_X - 50;
    var poleZ = OFFSET_Z + 40;

    // Main pole
    var poleGeo = new THREE.CylinderGeometry(1.2, 1.2, 30, 8);
    var pole = makeMesh(poleGeo, 0x6B3A1F);
    pole.position.set(poleX, 15, poleZ);
    scene.add(pole);
    objects.push(pole);

    // Carved face blocks stacked on pole
    var carveColors = [0xFF4500, 0x228B22, 0x1B4E9A, 0xFF4500, 0x228B22];
    var m;
    for (m = 0; m < 5; m++) {
      var carveGeo = new THREE.BoxGeometry(3, 3, 3);
      var carve = makeMesh(carveGeo, carveColors[m]);
      carve.position.set(poleX, 3 + m * 5, poleZ);
      scene.add(carve);
      objects.push(carve);
    }
  }

  function buildRomanRuins() {
    var ruinsX = OFFSET_X - 40;
    var ruinsZ = OFFSET_Z + 80;

    // Column plinths
    var plinthPositions = [
      [0, 0], [10, 0], [20, 0], [30, 0],
      [0, 15], [10, 15], [20, 15], [30, 15]
    ];
    var p;
    for (p = 0; p < plinthPositions.length; p++) {
      var cPlinthGeo = new THREE.BoxGeometry(3, 3, 6);
      var cPlinth = makeMesh(cPlinthGeo, 0xD4C5A9);
      cPlinth.position.set(ruinsX + plinthPositions[p][0], 1.5, ruinsZ + plinthPositions[p][1]);
      scene.add(cPlinth);
      objects.push(cPlinth);
    }

    // Broken columns (some tilted)
    var colPositions = [
      { x: 0, z: 0, rotZ: 0 },
      { x: 10, z: 0, rotZ: 0.15 },
      { x: 20, z: 0, rotZ: -0.1 },
      { x: 0, z: 15, rotZ: 0.2 },
      { x: 10, z: 15, rotZ: 0 }
    ];
    var c;
    for (c = 0; c < colPositions.length; c++) {
      var colGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
      var col = makeMesh(colGeo, 0xD0BEA0);
      col.position.set(ruinsX + colPositions[c].x, 7, ruinsZ + colPositions[c].z);
      col.rotation.z = colPositions[c].rotZ;
      scene.add(col);
      objects.push(col);
    }

    // Archway spans
    var archGeo1 = new THREE.BoxGeometry(12, 3, 2);
    var arch1 = makeMesh(archGeo1, 0xD4C5A9);
    arch1.position.set(ruinsX + 5, 12, ruinsZ);
    scene.add(arch1);
    objects.push(arch1);

    var archGeo2 = new THREE.BoxGeometry(12, 3, 2);
    var arch2 = makeMesh(archGeo2, 0xD4C5A9);
    arch2.position.set(ruinsX + 5, 12, ruinsZ + 15);
    scene.add(arch2);
    objects.push(arch2);
  }

  function buildSavillGarden() {
    var gardenX = OFFSET_X + 30;
    var gardenZ = OFFSET_Z - 40;

    // Hedgerows
    var hedgeOffsets = [
      [0, 0], [8, 0], [0, 14], [8, 14], [0, 28], [8, 28]
    ];
    var h;
    for (h = 0; h < hedgeOffsets.length; h++) {
      var hedgeGeo = new THREE.BoxGeometry(4, 2, 12);
      var hedge = makeMesh(hedgeGeo, 0x2D6B2D);
      hedge.position.set(gardenX + hedgeOffsets[h][0], 1, gardenZ + hedgeOffsets[h][1]);
      scene.add(hedge);
      objects.push(hedge);
    }

    // Ornamental shrubs
    var shrubColors = [0xFF69B4, 0xFFD700, 0xFF6600, 0x9400D3];
    var shrubPositions = [
      [4, 7], [12, 7], [4, 21], [12, 21]
    ];
    var s;
    for (s = 0; s < shrubColors.length; s++) {
      var shrubGeo = new THREE.SphereGeometry(3, 8, 8);
      var shrub = makeMesh(shrubGeo, shrubColors[s]);
      shrub.position.set(gardenX + shrubPositions[s][0], 3, gardenZ + shrubPositions[s][1]);
      scene.add(shrub);
      objects.push(shrub);
    }

    // Glasshouse
    var glassGeo = new THREE.BoxGeometry(14, 10, 8);
    var glass = makeMesh(glassGeo, 0x87CEEB);
    glass.position.set(gardenX + 20, 5, gardenZ + 14);
    scene.add(glass);
    objects.push(glass);
  }

  function buildRoyalLodge() {
    var lodgeX = OFFSET_X - 80;
    var lodgeZ = OFFSET_Z - 20;

    // Main lodge building
    var lodgeGeo = new THREE.BoxGeometry(22, 12, 14);
    var lodge = makeMesh(lodgeGeo, 0xFFF8DC);
    lodge.position.set(lodgeX, 6, lodgeZ);
    scene.add(lodge);
    objects.push(lodge);

    // Wisteria trellis climbing frames
    var trellisOffsets = [-6, 0, 6];
    var t;
    for (t = 0; t < trellisOffsets.length; t++) {
      var trellisGeo = new THREE.BoxGeometry(0.5, 8, 8);
      var trellis = makeMesh(trellisGeo, 0xFF69B4);
      trellis.position.set(lodgeX + trellisOffsets[t], 8, lodgeZ - 7.25);
      scene.add(trellis);
      objects.push(trellis);
    }

    // Garden wall
    var wallGeo = new THREE.BoxGeometry(2, 6, 30);
    var wall = makeMesh(wallGeo, 0xD4C5A9);
    wall.position.set(lodgeX - 12, 3, lodgeZ);
    scene.add(wall);
    objects.push(wall);
  }

  function buildDeer() {
    var deerBaseX = OFFSET_X + 10;
    var deerBaseZ = OFFSET_Z + 10;

    var deerPositions = [
      [0, 0], [15, 5], [8, 20], [25, 12],
      [5, 35], [20, 40], [35, 8], [12, 50],
      [30, 55], [45, 30]
    ];

    var d;
    for (d = 0; d < deerPositions.length; d++) {
      var dx = deerBaseX + deerPositions[d][0];
      var dz = deerBaseZ + deerPositions[d][1];

      // Deer body
      var bodyGeo = new THREE.BoxGeometry(3, 2, 5);
      var body = makeMesh(bodyGeo, 0xC4823C);
      body.position.set(dx, 3, dz);
      scene.add(body);
      objects.push(body);

      // Deer head
      var dHeadGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
      var dHead = makeMesh(dHeadGeo, 0xC4823C);
      dHead.position.set(dx, 4.5, dz - 3);
      scene.add(dHead);
      objects.push(dHead);

      // Deer legs
      var legDeerOffsets = [
        [-0.9, 1.5],
        [0.9, 1.5],
        [-0.9, -1.5],
        [0.9, -1.5]
      ];
      var dl;
      for (dl = 0; dl < legDeerOffsets.length; dl++) {
        var dLegGeo = new THREE.BoxGeometry(0.7, 4, 0.7);
        var dLeg = makeMesh(dLegGeo, 0xC4823C);
        dLeg.position.set(dx + legDeerOffsets[dl][0], 0.5, dz + legDeerOffsets[dl][1]);
        scene.add(dLeg);
        objects.push(dLeg);
      }

      // Antlers (only for first 4 adults)
      if (d < 4) {
        var antlerGeo1 = new THREE.ConeGeometry(0.3, 4, 6);
        var antler1 = makeMesh(antlerGeo1, 0x8B6914);
        antler1.position.set(dx - 0.5, 7, dz - 3);
        antler1.rotation.z = 0.4;
        scene.add(antler1);
        objects.push(antler1);

        var antlerGeo2 = new THREE.ConeGeometry(0.3, 4, 6);
        var antler2 = makeMesh(antlerGeo2, 0x8B6914);
        antler2.position.set(dx + 0.5, 7, dz - 3);
        antler2.rotation.z = -0.4;
        scene.add(antler2);
        objects.push(antler2);
      }
    }
  }

  function build() {
    buildLongWalk();
    buildCopperHorse();
    buildVirginiaWater();
    buildTotemPole();
    buildRomanRuins();
    buildSavillGarden();
    buildRoyalLodge();
    buildDeer();
  }

  function update(delta) {
    // Static environment — no animation required
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
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
