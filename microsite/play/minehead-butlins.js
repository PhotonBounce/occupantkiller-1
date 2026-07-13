var MineheadButlins = (function () {
  'use strict';

  var OX = 7680;
  var OZ = 0;

  function group() {
    return new THREE.Group();
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

  function sphere(r, ws, hs, color) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function lines(geo, color) {
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function place(mesh, x, y, z) {
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function placeLocal(mesh, x, y, z) {
    mesh.position.set(x, y, z);
    return mesh;
  }

  function hotel(g) {
    var tower = box(15, 20, 12, 0x3399CC);
    placeLocal(tower, 0, 10, 0);
    g.add(tower);
  }

  function chalets(g) {
    var cols = 5;
    var rows = 4;
    var count = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (count >= 20) break;
        var ch = box(4, 3, 3, 0xFFCC00);
        placeLocal(ch, c * 7 - 15, 1.5, r * 6 + 20);
        g.add(ch);
        count++;
      }
    }
  }

  function pool(g) {
    var base = box(20, 4, 15, 0x99CCDD);
    base.material = new THREE.MeshLambertMaterial({ color: 0x99CCDD, transparent: true, opacity: 0.7 });
    placeLocal(base, 25, 2, 0);
    g.add(base);
  }

  function skyline(g) {
    var dome = sphere(10, 16, 8, 0x88AACC);
    placeLocal(dome, 0, 10, -30);
    g.add(dome);
  }

  function bigwheel(g) {
    var disc = cylinder(8, 8, 0.5, 16, 0xCC4422);
    disc.rotation.x = Math.PI / 2;
    placeLocal(disc, -30, 12, 10);
    g.add(disc);
    var spokes = 8;
    for (var i = 0; i < spokes; i++) {
      var angle = (i / spokes) * Math.PI * 2;
      var spoke = box(16, 0.4, 0.4, 0xCC4422);
      spoke.rotation.z = angle;
      spoke.position.set(-30, 12, 10);
      g.add(spoke);
    }
  }

  function butlins(root) {
    var g = group();
    hotel(g);
    chalets(g);
    pool(g);
    skyline(g);
    bigwheel(g);
    g.position.set(OX + 0, 0, OZ + 0);
    root.add(g);
  }

  function seafront(root) {
    var beach = box(60, 0.3, 15, 0x888877);
    place(beach, -60, 0.15, 60);
    root.add(beach);

    var sea = box(60, 0.3, 20, 0x4488BB);
    place(sea, -60, 0.05, 80);
    root.add(sea);

    var bandBase = cylinder(4, 4, 1, 12, 0x1A4A1A);
    place(bandBase, -80, 0.5, 55);
    root.add(bandBase);

    var bandRoof = cone(5, 4, 12, 0x1A4A1A);
    place(bandRoof, -80, 3, 55);
    root.add(bandRoof);
  }

  function exmoor(root) {
    var positions = [
      [80, 5], [95, 10], [110, 5],
      [80, 20], [95, 25], [110, 20]
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var moor = sphere(3, 8, 6, 0x4A2A6A);
      place(moor, p[0], 5, p[1]);
      root.add(moor);
    }
  }

  function railway(root) {
    var loco = box(4, 2, 2.5, 0x003399);
    place(loco, -100, 1, 30);
    root.add(loco);

    var chimney = cylinder(0.3, 0.3, 1.5, 6, 0x111111);
    place(chimney, -101, 2.75, 30);
    root.add(chimney);

    for (var i = 0; i < 3; i++) {
      var carriage = box(6, 2, 2.5, 0x003399);
      place(carriage, -100 + (i + 1) * 8, 1, 30);
      root.add(carriage);
    }
  }

  function church(root) {
    var nave = box(16, 8, 10, 0xBBB8A0);
    place(nave, 60, 4, -20);
    root.add(nave);

    var tower = box(4, 14, 4, 0xBBB8A0);
    place(tower, 50, 7, -20);
    root.add(tower);

    var spire = cone(2.5, 5, 8, 0xBBB8A0);
    place(spire, 50, 16.5, -20);
    root.add(spire);
  }

  function build(scene) {
    var root = group();
    butlins(root);
    seafront(root);
    exmoor(root);
    railway(root);
    church(root);
    scene.add(root);
    return root;
  }

  return { build: build };
})();

if (typeof module !== 'undefined') { module.exports = MineheadButlins; }
