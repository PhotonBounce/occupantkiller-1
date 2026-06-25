(function (window) {
  'use strict';

  window.FarehamTitchfield = function (scene) {
    var X = 7120;
    var Z = 0;

    function lambert(color) {
      return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d) {
      return new THREE.BoxGeometry(w, h, d);
    }

    function cylinder(rt, rb, h, segs) {
      return new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    }

    function sphere(r, ws, hs) {
      return new THREE.SphereGeometry(r, ws || 8, hs || 8);
    }

    function cone(r, h, segs) {
      return new THREE.ConeGeometry(r, h, segs || 8);
    }

    function mesh(geo, mat) {
      return new THREE.Mesh(geo, mat);
    }

    function place(m, x, y, z) {
      m.position.set(X + x, y, Z + z);
      scene.add(m);
    }

    function battlement(ox, oy, oz) {
      var mat = lambert(0xBBAA88);
      var positions = [-6, -3, 0, 3, 6];
      for (var i = 0; i < positions.length; i++) {
        var b = mesh(box(2, 1.5, 1), mat);
        place(b, ox + positions[i], oy, oz);
      }
    }

    function abbey() {
      var mat = lambert(0xBBAA88);

      // Left flanking tower
      var lt = mesh(box(5, 12, 5), mat);
      place(lt, -8, 6, -200);

      // Right flanking tower
      var rt2 = mesh(box(5, 12, 5), mat);
      place(rt2, 8, 6, -200);

      // Central arch body (left side of arch)
      var archl = mesh(box(2, 8, 4), mat);
      place(archl, -4, 4, -200);

      // Central arch body (right side)
      var archr = mesh(box(2, 8, 4), mat);
      place(archr, 4, 4, -200);

      // Central arch lintel
      var archTop = mesh(box(6, 2, 4), mat);
      place(archTop, 0, 9, -200);

      // Battlements on left tower
      battlement(-8, 13, -200);
      // Battlements on right tower
      battlement(8, 13, -200);

      // Abbey nave walls — three partial walls
      var w1 = mesh(box(20, 8, 1.5), mat);
      place(w1, -10, 4, -215);

      var w2 = mesh(box(20, 8, 1.5), mat);
      place(w2, -10, 4, -230);

      var w3 = mesh(box(1.5, 8, 20), mat);
      place(w3, -20, 4, -215);
    }

    function highstreet() {
      var matLight = lambert(0xF0EDE0);
      var matBrick = lambert(0x8B3A2A);
      var count = 12;
      for (var i = 0; i < count; i++) {
        var m = i % 3 === 0 ? lambert(0x8B3A2A) : lambert(0xF0EDE0);
        var shop = mesh(box(5, 8, 7), m);
        place(shop, i * 6 - 33, 4, -100);
      }
    }

    function creek() {
      var mat = lambert(0x336677);
      var c = mesh(box(60, 0.3, 8), mat);
      place(c, 0, 0, -50);
    }

    function beach() {
      var shingleMat = lambert(0x888877);
      var seaMat = lambert(0x4488BB);

      var shingle = mesh(box(60, 0.3, 12), shingleMat);
      place(shingle, 0, 0, 30);

      var sea = mesh(box(60, 0.3, 20), seaMat);
      place(sea, 0, -0.1, 50);
    }

    function airfield() {
      var mat = lambert(0x778888);

      // Control tower
      var tower = mesh(box(8, 12, 8), mat);
      place(tower, 60, 6, -180);

      // Hangar
      var hangar = mesh(box(40, 8, 15), mat);
      place(hangar, 90, 4, -180);
    }

    function pumping() {
      var brickMat = lambert(0x885533);

      // Engine house
      var house = mesh(box(15, 8, 12), brickMat);
      place(house, -60, 4, -150);

      // Chimney
      var chimneyMat = lambert(0x885533);
      var chim = mesh(cylinder(2, 2, 18, 8), chimneyMat);
      place(chim, -55, 9, -150);
    }

    function farm() {
      var timberMat = lambert(0x8B6914);
      var brickMat = lambert(0xCC9966);
      var offsets = [
        [0, 0],
        [22, 0],
        [0, 12],
        [22, 12]
      ];
      for (var i = 0; i < offsets.length; i++) {
        var mat = i % 2 === 0 ? timberMat : brickMat;
        var barn = mesh(box(20, 7, 10), mat);
        place(barn, -80 + offsets[i][0], 3.5, -270 + offsets[i][1]);
      }
    }

    abbey();
    highstreet();
    creek();
    beach();
    airfield();
    pumping();
    farm();
  };

}(window));
