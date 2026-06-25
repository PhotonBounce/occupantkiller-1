window.DerbyFort = (function() { 'use strict';

  /* Derby — birthplace of the Industrial Revolution, Derwent Valley
     World position: x=3010, z=2200
     Features: Derby Cathedral, Lombe's Silk Mill, Rolls-Royce factory,
               Derwent Valley mills, Pride Park football stadium            */

  var WX = 3010;
  var WZ = 2200;

  var scene = null;
  var objects = [];
  var animations = [];

  /* ── helpers ──────────────────────────────────────────────── */

  function mat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function box(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z);
    scene.add(m);
    objects.push(m);
    return m;
  }

  function cyl(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z);
    scene.add(m);
    objects.push(m);
    return m;
  }

  function sphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z);
    scene.add(m);
    objects.push(m);
    return m;
  }

  function cone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z);
    scene.add(m);
    objects.push(m);
    return m;
  }

  function edges(mesh) {
    var eg = new THREE.EdgesGeometry(mesh.geometry);
    var ls = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.25, transparent: true }));
    ls.position.copy(mesh.position);
    ls.rotation.copy(mesh.rotation);
    ls.scale.copy(mesh.scale);
    scene.add(ls);
    objects.push(ls);
    return ls;
  }

  /* ── Derby Cathedral ──────────────────────────────────────── */
  /* Elegant early-18th-century Perpendicular tower, limestone cream */

  function buildCathedral(ox, oz) {
    /* Main tower  6 × 28 × 6 */
    var tower = box(6, 28, 6, 0xD4D0C0, ox, 14, oz);
    edges(tower);

    /* Parapet — decorative crenellations along tower top */
    for (var ci = 0; ci < 4; ci++) {
      var cx = ox + (ci < 2 ? (ci === 0 ? -2.5 : 2.5) : 0);
      var cz = oz + (ci >= 2 ? (ci === 2 ? -2.5 : 2.5) : 0);
      box(1, 1.5, 1, 0xC8C4B0, cx, 28.75, cz);
    }
    /* Corner pinnacles */
    cone(0.4, 2, 4, 0xC0BCAC, ox - 3, 30, oz - 3);
    cone(0.4, 2, 4, 0xC0BCAC, ox + 3, 30, oz - 3);
    cone(0.4, 2, 4, 0xC0BCAC, ox - 3, 30, oz + 3);
    cone(0.4, 2, 4, 0xC0BCAC, ox + 3, 30, oz + 3);

    /* Tower clock face — thin box */
    box(4, 4, 0.3, 0xF0EEE0, ox, 22, oz - 3.15);
    box(4, 4, 0.3, 0xF0EEE0, ox, 22, oz + 3.15);

    /* Nave (Victorian extension):  22 × 12 × 10 */
    var nave = box(22, 12, 10, 0xCCCABC, ox + 14, 6, oz);
    edges(nave);

    /* Nave clerestory windows row (decorative boxes flush to side) */
    for (var wi = 0; wi < 5; wi++) {
      box(0.2, 3, 1.5, 0x8AA8B8, ox + 4 + wi * 3.5, 8, oz - 5.05);
      box(0.2, 3, 1.5, 0x8AA8B8, ox + 4 + wi * 3.5, 8, oz + 5.05);
    }

    /* Nave roof ridge */
    var ridge = box(22, 1.5, 1, 0xB8B6A8, ox + 14, 12.75, oz);
    ridge.rotation.z = 0;

    /* West end rose window stub */
    sphere(1.5, 8, 8, 0x8AA8B8, ox + 3, 9, oz);
  }

  /* ── Lombe's Silk Mill (world's first factory, 1721) ─────── */
  /* Island in the Derwent — brick mill + water wheel            */

  function buildSilkMill(ox, oz) {
    /* River island base */
    box(28, 1, 14, 0x8A7A5A, ox, 0.5, oz);

    /* Main mill building  20 × 16 × 8 */
    var mill = box(20, 16, 8, 0xD4A97A, ox, 8, oz);
    edges(mill);

    /* Large windows every 3 units on long facades */
    for (var mwi = 0; mwi < 6; mwi++) {
      var mwx = ox - 8.5 + mwi * 3.2;
      box(0.2, 3.5, 2.5, 0x8AA8B8, mwx, 6 + 3, oz - 4.05);
      box(0.2, 3.5, 2.5, 0x8AA8B8, mwx, 6 + 3, oz + 4.05);
      box(0.2, 3.5, 2.5, 0x8AA8B8, mwx, 6 + 8, oz - 4.05);
      box(0.2, 3.5, 2.5, 0x8AA8B8, mwx, 6 + 8, oz + 4.05);
    }

    /* Mill cupola (lantern on roof) */
    cyl(1.2, 1.2, 3, 8, 0xC89060, ox, 17.5, oz);
    cone(1.4, 2, 8, 0xA87050, ox, 19.5, oz);

    /* Water wheel — large box on river edge */
    var wheelHub = cyl(0.6, 0.6, 1.5, 8, 0x5A3A1A, ox - 11.5, 4, oz);
    wheelHub.rotation.z = Math.PI / 2;
    /* Paddles */
    for (var pi = 0; pi < 8; pi++) {
      var pAngle = (pi / 8) * Math.PI * 2;
      var paddleBox = box(0.4, 3, 1.2, 0x6A4A2A,
        ox - 11.5 + Math.cos(pAngle) * 3.5,
        4 + Math.sin(pAngle) * 3.5,
        oz);
      paddleBox.rotation.z = pAngle;
    }
    /* Wheel axle box housing */
    box(3, 5, 2, 0x8A6A4A, ox - 11, 3, oz);
  }

  /* ── Rolls-Royce Aerospace Factory ───────────────────────── */
  /* Massive steel-grey shed, Merlin engine test cells, Spitfire prop */

  function buildRollsRoyce(ox, oz) {
    /* Main factory shed  80 × 10 × 30 */
    var shed = box(80, 10, 30, 0x7A7A7A, ox, 5, oz);
    edges(shed);

    /* Roof monitors (sawtooth skylights) */
    for (var ski = 0; ski < 8; ski++) {
      box(8, 2, 30, 0x6A6A6A, ox - 35 + ski * 10, 11, oz);
      box(0.3, 2, 30, 0x8AA8B8, ox - 35 + ski * 10 + 4, 11, oz);
    }

    /* Office block at east end */
    box(12, 16, 16, 0x888888, ox + 46, 8, oz);

    /* Chimney stacks */
    cyl(0.8, 1.0, 18, 8, 0x666666, ox - 38, 9, oz - 13);
    cyl(0.8, 1.0, 18, 8, 0x666666, ox - 38, 9, oz + 13);

    /* Merlin engine test cell cylinders (3 units) */
    for (var tci = 0; tci < 3; tci++) {
      var tcx = ox + 28 + tci * 8;
      cyl(2.5, 2.5, 8, 12, 0x555555, tcx, 4, oz - 20);
      /* Test cell intake cone */
      cone(3, 3, 12, 0x444444, tcx, 10, oz - 20);
      /* Exhaust pipe */
      cyl(0.6, 0.6, 6, 6, 0x333333, tcx + 3, 6, oz - 20);
    }

    /* Spitfire propeller display — cylinder hub + 3 blade boxes */
    var propHubX = ox - 10;
    var propHubY = 12;
    var propHubZ = oz - 16;
    cyl(0.8, 0.8, 1.2, 8, 0x9A8870, propHubX, propHubY, propHubZ);
    /* 3 blades at 120-degree intervals */
    for (var bli = 0; bli < 3; bli++) {
      var bladeAngle = (bli / 3) * Math.PI * 2;
      var bladeBox = box(0.35, 4.5, 0.9, 0x8A7860,
        propHubX + Math.sin(bladeAngle) * 2.5,
        propHubY + Math.cos(bladeAngle) * 2.5,
        propHubZ);
      bladeBox.rotation.z = bladeAngle;
    }

    /* Car park / perimeter wall suggestion */
    box(80, 1, 1.5, 0x888888, ox, 0.75, oz + 16.5);
    box(80, 1, 1.5, 0x888888, ox, 0.75, oz - 16.5);
  }

  /* ── Derwent Valley Mills (UNESCO heritage) ──────────────── */
  /* 3 mill buildings along the river                           */

  function buildDerwentMills(ox, oz) {
    var millOffsets = [
      [0, 0],
      [26, 4],
      [52, -2]
    ];
    for (var mi = 0; mi < 3; mi++) {
      var mdx = millOffsets[mi][0];
      var mdz = millOffsets[mi][1];
      var mox = ox + mdx;
      var moz = oz + mdz;

      /* Mill building  18 × 12 × 8 */
      var millBody = box(18, 12, 8, 0xD4A97A, mox, 6, moz);
      edges(millBody);

      /* Gable end */
      var gable = box(8, 4, 0.5, 0xC8A070, mox, 14, moz - 4);
      gable.rotation.y = 0;

      /* Roof */
      box(18, 1.5, 8, 0xB09070, mox, 12.75, moz);

      /* Window row */
      for (var wmj = 0; wmj < 4; wmj++) {
        box(0.2, 2.5, 1.8, 0x8AA8B8, mox - 6 + wmj * 4, 7, moz - 4.05);
        box(0.2, 2.5, 1.8, 0x8AA8B8, mox - 6 + wmj * 4, 10.5, moz - 4.05);
      }

      /* Small chimney */
      cyl(0.4, 0.5, 6, 6, 0x888880, mox + 7, 9, moz + 2);

      /* Millrace culvert box */
      box(2, 1.5, 12, 0x706050, mox + 10, 0.75, moz);
    }

    /* River Derwent ribbon — narrow blue box */
    box(120, 0.5, 6, 0x4A7AA0, ox + 26, 0.25, oz + 10);
  }

  /* ── Pride Park Football Stadium ─────────────────────────── */
  /* Derby County FC — modern stadium                           */

  function buildPridePark(ox, oz) {
    /* Pitch base */
    box(100, 0.5, 68, 0x4A7A3A, ox, 0.25, oz);

    /* Four stands */
    /* North stand */
    var nstand = box(100, 10, 14, 0x888888, ox, 5, oz - 41);
    edges(nstand);
    /* South stand */
    var sstand = box(100, 10, 14, 0x888888, ox, 5, oz + 41);
    edges(sstand);
    /* East stand */
    var estand = box(14, 10, 68, 0x888888, ox + 57, 5, oz);
    edges(estand);
    /* West stand (main) — taller */
    var wstand = box(14, 14, 68, 0x777777, ox - 57, 7, oz);
    edges(wstand);

    /* Roof canopies over stands */
    box(100, 1.5, 10, 0x999999, ox, 10.75, oz - 38);
    box(100, 1.5, 10, 0x999999, ox, 10.75, oz + 38);
    box(10, 1.5, 68, 0x999999, ox + 60, 10.75, oz);
    box(10, 1.5, 68, 0x999999, ox - 60, 14.75, oz);

    /* Floodlight pylons (4 corners) */
    var floodPositions = [
      [ox + 52, oz - 36],
      [ox - 52, oz - 36],
      [ox + 52, oz + 36],
      [ox - 52, oz + 36]
    ];
    for (var fli = 0; fli < 4; fli++) {
      cyl(0.3, 0.3, 22, 6, 0xBBBBBB, floodPositions[fli][0], 11, floodPositions[fli][1]);
      box(3, 0.5, 3, 0xDDDDDD, floodPositions[fli][0], 22.5, floodPositions[fli][1]);
    }

    /* Rams badge box sculpture at main entrance */
    box(4, 4, 0.5, 0xFFFFFF, ox - 62, 5, oz);
    box(1.5, 4, 0.5, 0x111188, ox - 62, 5, oz - 1);
    box(1.5, 4, 0.5, 0x111188, ox - 62, 5, oz + 1);

    /* Stadium entrance boxes */
    for (var eni = 0; eni < 5; eni++) {
      box(6, 4, 4, 0x666666, ox - 20 + eni * 10, 2, oz - 46);
    }
  }

  /* ── init / update / reset ────────────────────────────────── */

  function init(sceneRef) {
    scene = sceneRef;
    objects = [];
    animations = [];

    buildCathedral(WX + 0, WZ + 0);
    buildSilkMill(WX - 60, WZ - 30);
    buildRollsRoyce(WX + 120, WZ + 80);
    buildDerwentMills(WX - 40, WZ + 60);
    buildPridePark(WX + 200, WZ - 50);
  }

  function update(delta) {
    /* static environment — no per-frame animation required */
    void delta;
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      if (scene) scene.remove(objects[i]);
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var j = 0; j < objects[i].material.length; j++) {
            objects[i].material[j].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }
    objects = [];
    animations = [];
    scene = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
