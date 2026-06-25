(function (window) {
  'use strict';

  function build(scene) {
    var X = 7320;
    var Z = 0;

    // 1. Danebury hillfort
    function ramparts() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x6B5A3A });
      var i, seg, angle, rx, rz, bx, bz;
      var segments = 24;

      // inner ring r=30
      for (i = 0; i < segments; i++) {
        angle = (i / segments) * Math.PI * 2;
        if (i >= segments - 2) continue; // south gap for gateway
        rx = Math.cos(angle) * 30;
        rz = Math.sin(angle) * 30;
        var ig = new THREE.BoxGeometry(2, 3, 30 / segments * 2 * Math.PI + 0.5);
        var im = new THREE.Mesh(ig, mat);
        im.position.set(X + rx, 1.5, Z + rz);
        im.rotation.y = -angle;
        scene.add(im);
      }

      // outer ring r=45
      for (i = 0; i < segments; i++) {
        angle = (i / segments) * Math.PI * 2;
        if (i >= segments - 2) continue; // south gap
        rx = Math.cos(angle) * 45;
        rz = Math.sin(angle) * 45;
        var og = new THREE.BoxGeometry(2, 3, 45 / segments * 2 * Math.PI + 0.5);
        var om = new THREE.Mesh(og, mat);
        om.position.set(X + rx, 1.5, Z + rz);
        om.rotation.y = -angle;
        scene.add(om);
      }

      // gateway flanking mounds (south side)
      var fmat = new THREE.MeshLambertMaterial({ color: 0x6B5A3A });
      var f1g = new THREE.BoxGeometry(4, 3, 4);
      var f1m = new THREE.Mesh(f1g, fmat);
      f1m.position.set(X - 6, 1.5, Z + 40);
      scene.add(f1m);
      var f2g = new THREE.BoxGeometry(4, 3, 4);
      var f2m = new THREE.Mesh(f2g, fmat);
      f2m.position.set(X + 6, 1.5, Z + 40);
      scene.add(f2m);
    }
    ramparts();

    function hilltop() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x6B5A3A });
      var heights = [4, 3, 2, 5];
      var sizes = [14, 11, 8, 5];
      var yoff = 0;
      var i;
      for (i = 0; i < 4; i++) {
        var g = new THREE.BoxGeometry(sizes[i], heights[i], sizes[i]);
        var m = new THREE.Mesh(g, mat);
        yoff += heights[i] / 2;
        m.position.set(X, yoff, Z);
        yoff += heights[i] / 2;
        scene.add(m);
      }
    }
    hilltop();

    // 2. Roundhouses
    function roundhouses() {
      var wmat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      var rmat = new THREE.MeshLambertMaterial({ color: 0x9B7745 });
      var positions = [
        [X + 60, Z + 20],
        [X + 75, Z + 20],
        [X + 60, Z + 40],
        [X + 75, Z + 40]
      ];
      var i;
      for (i = 0; i < positions.length; i++) {
        var px = positions[i][0];
        var pz = positions[i][1];
        var wg = new THREE.CylinderGeometry(4, 4, 3, 12);
        var wm = new THREE.Mesh(wg, wmat);
        wm.position.set(px, 1.5, pz);
        scene.add(wm);
        var rg = new THREE.ConeGeometry(6, 4, 12);
        var rm = new THREE.Mesh(rg, rmat);
        rm.position.set(px, 5, pz);
        scene.add(rm);
      }
    }
    roundhouses();

    // 3. Weyhill Fair grounds
    function fairgrounds() {
      var smat = new THREE.MeshLambertMaterial({ color: 0xCC8822 });
      var wmat = new THREE.MeshLambertMaterial({ color: 0xCC4422 });
      var i;
      for (i = 0; i < 8; i++) {
        var row = Math.floor(i / 4);
        var col = i % 4;
        var sg = new THREE.BoxGeometry(3, 2.5, 2);
        var sm = new THREE.Mesh(sg, smat);
        sm.position.set(X + 100 + col * 6, 1.25, Z + 60 + row * 8);
        scene.add(sm);
      }
      // traditional painted wagon
      var wg = new THREE.BoxGeometry(5, 2.5, 2);
      var wm = new THREE.Mesh(wg, wmat);
      wm.position.set(X + 120, 1.25, Z + 80);
      scene.add(wm);
    }
    fairgrounds();

    // 4. Andover High Street Georgian buildings
    function highstreet() {
      var c1 = new THREE.MeshLambertMaterial({ color: 0xF0EDE0 });
      var c2 = new THREE.MeshLambertMaterial({ color: 0x9B3A2A });
      var i;
      for (i = 0; i < 10; i++) {
        var mat = (i % 2 === 0) ? c1 : c2;
        var g = new THREE.BoxGeometry(5, 8, 7);
        var m = new THREE.Mesh(g, mat);
        m.position.set(X - 80 + i * 14, 4, Z - 30);
        scene.add(m);
      }
    }
    highstreet();

    // 5. River Test
    function river() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x44AAAA });
      var g = new THREE.BoxGeometry(60, 0.3, 5);
      var m = new THREE.Mesh(g, mat);
      m.position.set(X - 50, 0.15, Z - 60);
      scene.add(m);
    }
    river();

    // 6. St Mary's Church
    function church() {
      var mat = new THREE.MeshLambertMaterial({ color: 0xBBB8A0 });
      var bg = new THREE.BoxGeometry(20, 9, 14);
      var bm = new THREE.Mesh(bg, mat);
      bm.position.set(X - 30, 4.5, Z - 50);
      scene.add(bm);
      var tg = new THREE.BoxGeometry(5, 16, 5);
      var tm = new THREE.Mesh(tg, mat);
      tm.position.set(X - 30, 8, Z - 55);
      scene.add(tm);
      var sg = new THREE.ConeGeometry(3, 6, 8);
      var sm = new THREE.Mesh(sg, mat);
      sm.position.set(X - 30, 19, Z - 55);
      scene.add(sm);
    }
    church();

    // 7. AMMO depot WW2 bunkers
    function depot() {
      var mat = new THREE.MeshLambertMaterial({ color: 0x4A6A2A });
      var i;
      for (i = 0; i < 6; i++) {
        var g = new THREE.BoxGeometry(15, 4, 10);
        var m = new THREE.Mesh(g, mat);
        m.position.set(X + 150 + (i % 3) * 20, -2 + 2, Z + (Math.floor(i / 3)) * 18 - 10);
        scene.add(m);
      }
    }
    depot();

    // 8. Hawk Conservancy
    function hawks() {
      var pmat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
      var bmat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
      var i;
      for (i = 0; i < 5; i++) {
        var pg = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
        var pm = new THREE.Mesh(pg, pmat);
        pm.position.set(X + 180 + i * 5, 1, Z + 30);
        scene.add(pm);
        var bg = new THREE.SphereGeometry(0.3, 8, 8);
        var bm = new THREE.Mesh(bg, bmat);
        bm.position.set(X + 180 + i * 5, 2.3, Z + 30);
        scene.add(bm);
      }
    }
    hawks();
  }

  window.AndoverIronAge = { build: build };

})(window);
