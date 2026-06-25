(function (window) {
  'use strict';

  window.HelstonLizard = function (scene, offsetX, offsetZ) {
    var ox = (offsetX !== undefined ? offsetX : 8200);
    var oz = (offsetZ !== undefined ? offsetZ : 0);

    // ------------------------------------------------------------------ helpers

    function mat(color) {
      return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d) {
      return new THREE.BoxGeometry(w, h, d);
    }

    function cyl(rTop, rBot, h, segs) {
      return new THREE.CylinderGeometry(rTop, rBot, h, segs || 16);
    }

    function cone(r, h, segs) {
      return new THREE.ConeGeometry(r, h, segs || 16);
    }

    function sphere(r, ws, hs) {
      return new THREE.SphereGeometry(r, ws || 8, hs || 8);
    }

    function mesh(geo, mtl) {
      return new THREE.Mesh(geo, mtl);
    }

    function add(m, x, y, z) {
      m.position.set(ox + x, y, oz + z);
      scene.add(m);
      return m;
    }

    function edges(geo, color) {
      var g = new THREE.EdgesGeometry(geo);
      var m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: color }));
      return m;
    }

    // ================================================================== 1. Lizard Lighthouse
    // Main tower
    var lighthouseMat = mat(0xFFFFFF);
    var towerGeo = cyl(3, 3, 18);
    var tower = mesh(towerGeo, lighthouseMat);
    add(tower, -200, 9, -600);

    var capGeo = cone(4, 5);
    var cap = mesh(capGeo, mat(0xCC3333));
    add(cap, -200, 20.5, -600);

    // Twin second tower
    var tower2Geo = cyl(2.5, 2.5, 14);
    var tower2 = mesh(tower2Geo, lighthouseMat);
    add(tower2, -210, 7, -595);

    var cap2Geo = cone(3.5, 4);
    var cap2 = mesh(cap2Geo, mat(0xCC3333));
    add(cap2, -210, 16, -595);

    // Fog signal building
    var fogGeo = box(12, 5, 8);
    var fogBld = mesh(fogGeo, mat(0xEEEEEE));
    add(fogBld, -205, 2.5, -610);

    // ================================================================== 2. Lizard headland cliffs — serpentinite
    var cliffMat = mat(0x446655);

    var cliff1 = mesh(box(30, 0.3, 12), cliffMat);
    add(cliff1, -200, 0.15, -580);

    var cliff2 = mesh(box(30, 0.3, 12), cliffMat);
    add(cliff2, -230, 0.15, -600);

    var cliff3 = mesh(box(30, 0.3, 12), cliffMat);
    add(cliff3, -170, 0.15, -615);

    // ================================================================== 3. Helston town — Flora Day
    var georgianMat = mat(0xF0EDE0);

    var townPositions = [
      [0, 0], [8, 0], [16, 0], [24, 0], [32, 0],
      [0, 12], [8, 12], [16, 12], [24, 12], [32, 12]
    ];

    for (var t = 0; t < townPositions.length; t++) {
      var tp = townPositions[t];
      var bldg = mesh(box(5, 7, 8), georgianMat);
      add(bldg, tp[0], 3.5, tp[1]);
    }

    // Guildhall
    var guildhallMat = mat(0xD4C9A8);
    var guildhall = mesh(box(14, 7, 10), guildhallMat);
    add(guildhall, 16, 5, 30);

    // Guildhall columns (decorative cylinders)
    var colMat = mat(0xE8E0CC);
    for (var c = 0; c < 4; c++) {
      var col = mesh(cyl(0.4, 0.4, 7, 8), colMat);
      add(col, 7 + c * 2.5, 3.5, 25.5);
    }

    // ================================================================== 4. RNAS Culdrose air base
    // Control tower
    var towerCtrlMat = mat(0x99AAAA);
    var ctrlTower = mesh(box(6, 14, 6), towerCtrlMat);
    add(ctrlTower, 200, 7, -200);

    // Tower cab (glass box on top)
    var cabMat = mat(0xAADDFF);
    var cab = mesh(box(7, 3, 7), cabMat);
    add(cab, 200, 15.5, -200);

    // Hangars
    var hangarMat = mat(0x778888);
    var hangar1 = mesh(box(50, 8, 25), hangarMat);
    add(hangar1, 160, 4, -220);

    var hangar2 = mesh(box(50, 8, 25), hangarMat);
    add(hangar2, 220, 4, -220);

    // Runway
    var runwayMat = mat(0x333333);
    var runway = mesh(box(4, 0.3, 80), runwayMat);
    add(runway, 190, 0.15, -150);

    // 2 helicopters on pad
    // Helicopter 1
    var heliBodyMat = mat(0x888899);
    var heli1Body = mesh(box(4, 1.5, 2), heliBodyMat);
    add(heli1Body, 175, 1.25, -185);

    var rotor1Geo = box(8, 0.15, 0.4);
    var rotor1 = mesh(rotor1Geo, mat(0x444444));
    add(rotor1, 175, 2.2, -185);

    var rotor1b = mesh(box(0.4, 0.15, 8), mat(0x444444));
    add(rotor1b, 175, 2.2, -185);

    // Helicopter 2
    var heli2Body = mesh(box(4, 1.5, 2), heliBodyMat);
    add(heli2Body, 185, 1.25, -185);

    var rotor2 = mesh(box(8, 0.15, 0.4), mat(0x444444));
    add(rotor2, 185, 2.2, -185);

    var rotor2b = mesh(box(0.4, 0.15, 8), mat(0x444444));
    add(rotor2b, 185, 2.2, -185);

    // ================================================================== 5. Flambards theme park
    // Roller coaster — 3 box sections at heights 0, 6, 2
    var coasterMat = mat(0xDD4422);
    var coaster1 = mesh(box(3, 3, 4), coasterMat);
    add(coaster1, 100, 1.5, 100);

    var coaster2 = mesh(box(3, 3, 4), coasterMat);
    add(coaster2, 107, 7.5, 100);

    var coaster3 = mesh(box(3, 3, 4), coasterMat);
    add(coaster3, 114, 3.5, 100);

    // Track rails (LineSegments)
    var trackGeo = new THREE.EdgesGeometry(box(20, 0.2, 0.5));
    var track = new THREE.LineSegments(trackGeo, new THREE.LineBasicMaterial({ color: 0x888888 }));
    track.position.set(ox + 107, 6, oz + 100);
    scene.add(track);

    // Vintage aircraft — box fuselage + wing box
    var aircraftMat = mat(0xCCBB88);
    var fuselage = mesh(box(5, 1.5, 1.5), aircraftMat);
    add(fuselage, 120, 1.75, 120);

    var wing = mesh(box(1.5, 0.3, 7), aircraftMat);
    add(wing, 120, 2.2, 120);

    var tailFin = mesh(box(1.2, 1.2, 0.3), aircraftMat);
    add(tailFin, 122, 2.4, 120);

    // ================================================================== 6. Porthleven harbour
    // 2 harbour arms
    var harbourMat = mat(0x888877);
    var arm1 = mesh(box(3, 2, 25), harbourMat);
    add(arm1, -100, 1, 200);

    var arm2 = mesh(box(3, 2, 25), harbourMat);
    add(arm2, -80, 1, 210);

    // 6 boats
    var boatMat = mat(0x4466AA);
    var boatPositions = [
      [-98, 208], [-93, 205], [-88, 210],
      [-98, 215], [-93, 218], [-88, 213]
    ];

    for (var b = 0; b < boatPositions.length; b++) {
      var bp = boatPositions[b];
      // Hull
      var hull = mesh(box(2.5, 1, 5), boatMat);
      add(hull, bp[0], 0.5, bp[1]);

      // Cabin
      var cabin = mesh(box(1.5, 1, 2), mat(0xEEDDCC));
      add(cabin, bp[0], 1.5, bp[1] - 0.5);

      // Mast
      var mast = mesh(cyl(0.08, 0.08, 4, 6), mat(0x885533));
      add(mast, bp[0], 3, bp[1]);
    }
  };

}(window));
