(function (window) {
  'use strict';

  window.FalmouthPendennis = function (scene) {
    var X = 8160;
    var Z = 0;

    function place(mesh, x, y, z) {
      mesh.position.set(X + x, y, Z + z);
      scene.add(mesh);
      return mesh;
    }

    function box(w, h, d, color) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      return new THREE.Mesh(geo, mat);
    }

    function cylinder(rt, rb, h, segs, color) {
      var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      return new THREE.Mesh(geo, mat);
    }

    function sphere(r, color) {
      var geo = new THREE.SphereGeometry(r, 16, 16);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      return new THREE.Mesh(geo, mat);
    }

    function cone(r, h, segs, color) {
      var geo = new THREE.ConeGeometry(r, h, segs);
      var mat = new THREE.MeshLambertMaterial({ color: color });
      return new THREE.Mesh(geo, mat);
    }

    function mast(x, z) {
      var pole = cylinder(0.15, 0.15, 12, 6, 0xCCCCCC);
      place(pole, x, 6, z);
      var boom = cylinder(0.08, 0.08, 6, 6, 0xCCCCCC);
      boom.rotation.z = Math.PI / 2;
      place(boom, x, 9, z + 1);
    }

    function bollard(x, z) {
      var body = cylinder(0.4, 0.4, 1.5, 8, 0x333333);
      place(body, x, 0.75, z);
      var top = sphere(0.45, 0.333333);
      place(top, x, 1.7, z);
    }

    // 1) Pendennis Castle
    function pendennis() {
      var cx = -80;
      var cz = -120;

      // outer curtain wall
      var curtain = cylinder(20, 20, 4, 24, 0xCC9966);
      place(curtain, cx, 2, cz);

      // main round tower
      var tower = cylinder(12, 12, 8, 24, 0xCC9966);
      place(tower, cx, 7, cz);

      // gatehouse
      var gate = box(6, 10, 6, 0xCC9966);
      place(gate, cx + 18, 5, cz);

      // battlements — small blocks around curtain top
      var i;
      for (i = 0; i < 12; i++) {
        var angle = (i / 12) * Math.PI * 2;
        var bx = cx + Math.cos(angle) * 20;
        var bz = cz + Math.sin(angle) * 20;
        var merlon = box(1.5, 2, 1.5, 0xCC9966);
        place(merlon, bx, 5, bz);
      }
    }

    // 2) National Maritime Museum Cornwall
    function maritime() {
      var mx = -20;
      var mz = 30;

      // main glass building
      var main = box(25, 10, 20, 0x889999);
      place(main, mx, 5, mz);

      // viewing tower
      var vtower = cylinder(4, 4, 15, 12, 0x889999);
      place(vtower, mx + 15, 7.5, mz - 5);

      // observation pod
      var pod = sphere(5, 0x889999);
      place(pod, mx + 15, 17, mz - 5);

      // entrance canopy
      var canopy = box(10, 1.5, 6, 0x667788);
      place(canopy, mx - 14, 9.5, mz);
    }

    // 3) Falmouth Harbour
    function harbour() {
      var hx = 0;
      var hz = 60;

      // 3 long docks
      var i;
      for (i = 0; i < 3; i++) {
        var dock = box(50, 0.5, 3, 0x556677);
        place(dock, hx, 0.25, hz + i * 10);
      }

      // 8 large ship hulls
      for (i = 0; i < 8; i++) {
        var hull = box(30, 5, 8, 0x445566);
        place(hull, hx - 20 + i * 10, 2.5, hz + 5 + (i % 3) * 12);
      }

      // 10 yacht masts
      for (i = 0; i < 10; i++) {
        mast(hx - 25 + i * 8, hz + 2 + (i % 4) * 7);
      }
    }

    // 4) Custom House Quay
    function customhouse() {
      var qx = -60;
      var qz = 20;
      var i;

      // 8 Georgian buildings — alternating facade colours
      for (i = 0; i < 8; i++) {
        var col = (i % 2 === 0) ? 0xF0EDE0 : 0x885533;
        var bld = box(8, 8, 7, col);
        place(bld, qx + i * 10, 4, qz);
        // simple roof
        var roof = cone(6, 4, 4, 0x885533);
        place(roof, qx + i * 10, 10, qz);
      }

      // 5 iron bollards along quay edge
      for (i = 0; i < 5; i++) {
        bollard(qx + i * 15, qz + 8);
      }
    }

    // 5) Falmouth town shops
    function town() {
      var tx = -100;
      var tz = -40;
      var i;
      for (i = 0; i < 10; i++) {
        var shop = box(5, 8, 7, 0xF0EDE0);
        place(shop, tx + i * 8, 4, tz);
        var sroof = cone(4, 3, 4, 0x885533);
        place(sroof, tx + i * 8, 9.5, tz);
      }
    }

    // 6) Fal Estuary
    function estuary() {
      var water = box(80, 0.3, 25, 0x336688);
      place(water, 30, 0, 90);
    }

    // 7) King Harry Ferry
    function ferry() {
      var fx = 50;
      var fz = 100;

      // hull
      var hull = box(20, 3, 5, 0x885533);
      place(hull, fx, 1.5, fz);

      // flat deck
      var deck = box(20, 0.5, 5, 0xCCAA77);
      place(deck, fx, 3.25, fz);

      // wheelhouse
      var whouse = box(5, 4, 4, 0x885533);
      place(whouse, fx + 6, 5.25, fz);

      // two smokestacks
      var stack1 = cylinder(0.5, 0.5, 4, 8, 0x444444);
      place(stack1, fx + 4, 7.25, fz - 1);
      var stack2 = cylinder(0.5, 0.5, 4, 8, 0x444444);
      place(stack2, fx + 4, 7.25, fz + 1);

      // vehicle ramp (bow)
      var ramp = box(4, 0.4, 5, 0x775522);
      place(ramp, fx - 12, 0.2, fz);
    }

    // execute all builders
    pendennis();
    maritime();
    harbour();
    customhouse();
    town();
    estuary();
    ferry();
  };

}(window));
