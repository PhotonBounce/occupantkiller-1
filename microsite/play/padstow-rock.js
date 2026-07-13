(function (window) {
  'use strict';

  window.PadstowRock = function (scene) {
    var group = new THREE.Group();
    group.position.set(8000, 0, 0);

    var mat = function (color) {
      return new THREE.MeshLambertMaterial({ color: color });
    };

    var box = function (w, h, d) {
      return new THREE.BoxGeometry(w, h, d);
    };

    var cyl = function (rt, rb, h, segs) {
      return new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    };

    var sph = function (r, ws, hs) {
      return new THREE.SphereGeometry(r, ws || 8, hs || 6);
    };

    var cone = function (r, h, segs) {
      return new THREE.ConeGeometry(r, h, segs || 8);
    };

    var mesh = function (geo, material) {
      return new THREE.Mesh(geo, material);
    };

    var add = function (m) {
      group.add(m);
    };

    var place = function (m, x, y, z) {
      m.position.set(x, y, z);
      add(m);
    };

    // 1) Padstow harbour walls
    var wallMat = mat(0xAA9988);
    var wall1 = mesh(box(4, 2, 30), wallMat);
    place(wall1, -10, 1, 0);

    var wall2 = mesh(box(4, 2, 30), wallMat);
    place(wall2, 10, 1, 0);

    // Fishing boats: hull + cabin
    var hullMat = mat(0x5566AA);
    var cabinMat = mat(0xDDDDCC);
    var boatPositions = [
      [-6, 0, -8], [-6, 0, -2], [-6, 0, 4],
      [6, 0, -8], [6, 0, -2], [6, 0, 4]
    ];

    for (var b = 0; b < boatPositions.length; b++) {
      var bp = boatPositions[b];
      var hull = mesh(box(2.5, 0.8, 5), hullMat);
      hull.position.set(bp[0], bp[1] + 0.4, bp[2]);
      add(hull);
      var cabin = mesh(box(1.5, 1, 2.5), cabinMat);
      cabin.position.set(bp[0], bp[1] + 1.3, bp[2] + 0.5);
      add(cabin);
    }

    // Lobster pots
    var potMat = mat(0x887755);
    for (var p = 0; p < 10; p++) {
      var pot = mesh(cyl(0.8, 0.8, 0.8, 8), potMat);
      pot.position.set(-8 + p * 1.8, 1.4, 10);
      add(pot);
    }

    // 2) Rick Stein seafood restaurant
    var steinMat = mat(0xF5F5F0);
    var restaurant = mesh(box(15, 10, 7), steinMat);
    place(restaurant, 0, 5, 20);

    // 3) Padstow Obby Oss maypole
    var poleMat = mat(0x8B6914);
    var pole = mesh(cyl(0.3, 0.3, 8, 8), poleMat);
    place(pole, 5, 4, 30);

    // 4) Camel Estuary tidal flat
    var estuaryMat = mat(0x336688);
    var estuary = mesh(box(80, 0.3, 20), estuaryMat);
    place(estuary, 0, 0, 50);

    // 5) Rock ferry
    var ferryHullMat = mat(0x445588);
    var ferryHull = mesh(box(8, 1, 3), ferryHullMat);
    place(ferryHull, 0, 0.5, 55);

    var ferryCabinMat = mat(0x8B6914);
    var ferryCabin = mesh(box(4, 1.5, 2), ferryCabinMat);
    place(ferryCabin, 0, 1.75, 55);

    // 6) St Petroc's Church
    var graniteMat = mat(0x888880);
    var church = mesh(box(22, 10, 14), graniteMat);
    place(church, -20, 5, 35);

    var tower = mesh(box(5, 16, 5), graniteMat);
    place(tower, -28, 8, 35);

    // 7) Padstow town - 10 Cornish stone shops
    var shopMat = mat(0x999988);
    for (var s = 0; s < 10; s++) {
      var shop = mesh(box(5, 7, 6), shopMat);
      shop.position.set(-22 + s * 6, 3.5, 10);
      add(shop);
    }

    // 8) Camel Trail cycle path
    var trailMat = mat(0x8B6914);
    var trail = mesh(box(60, 0.3, 2), trailMat);
    place(trail, 0, 0.15, 45);

    // 9) Trevose Head lighthouse
    var lighthouseMat = mat(0xFFFFFF);
    var lighthouseBody = mesh(cyl(3, 3, 18, 12), lighthouseMat);
    place(lighthouseBody, 40, 9, -20);

    var lighthouseCap = mesh(cone(3.5, 4, 12), mat(0xCC2222));
    place(lighthouseCap, 40, 20, -20);

    scene.add(group);
    return group;
  };

}(window));
