var CorfeCastle = (function () {
  'use strict';

  var OX = 7440;
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

  function cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function hill(scene) {
    var g = group();

    var base = box(120, 6, 80, 0x6B5A3A);
    base.position.set(0, 3, 0);
    g.add(base);

    var mid = box(80, 5, 55, 0x6B5A3A);
    mid.position.set(0, 8.5, 0);
    g.add(mid);

    var top = box(50, 3, 35, 0x6B5A3A);
    top.position.set(0, 12.5, 0);
    g.add(top);

    g.position.set(OX + 0, 0, OZ + 0);
    scene.add(g);
  }

  function keep(scene) {
    var g = group();

    var tower = box(10, 14, 10, 0xCC9966);
    tower.position.set(0, 14 / 2 + 14, 0.15 * 7);
    g.add(tower);

    var wall1 = box(12, 8, 2, 0xCC9966);
    wall1.position.set(-10, 4 + 14, 0);
    wall1.rotation.y = 0.3;
    g.add(wall1);

    var wall2 = box(12, 8, 2, 0xCC9966);
    wall2.position.set(10, 3 + 14, 2);
    wall2.rotation.y = -0.4;
    g.add(wall2);

    var wall3 = box(12, 8, 2, 0xCC9966);
    wall3.position.set(0, 2.5 + 14, -8);
    wall3.rotation.y = 0.2;
    g.add(wall3);

    g.position.set(OX + 0, 0, OZ + 0);
    scene.add(g);
  }

  function curtain(scene) {
    var g = group();

    var positions = [
      [-20, 0, -15, 0.2],
      [20, 0, -15, -0.2],
      [-25, 0, 5, 0.5],
      [25, 0, 5, -0.5],
      [-15, 0, 20, 0.1],
      [15, 0, 20, -0.1]
    ];

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var w = box(10, 6, 1.5, 0xBBAA88);
      w.position.set(p[0], 3 + 14, p[1]);
      w.rotation.y = p[3];
      g.add(w);
    }

    g.position.set(OX + 0, 0, OZ + 0);
    scene.add(g);
  }

  function gatehouse(scene) {
    var g = group();

    var left = box(4, 10, 4, 0xCC9966);
    left.position.set(-4, 5 + 14, -18);
    g.add(left);

    var right = box(4, 10, 4, 0xCC9966);
    right.position.set(4, 5 + 14, -18);
    g.add(right);

    g.position.set(OX + 0, 0, OZ + 0);
    scene.add(g);
  }

  function village(scene) {
    var g = group();

    var spots = [
      [40, 30], [-40, 30], [55, 45], [-55, 45],
      [30, 55], [-30, 55], [45, 65], [-45, 65],
      [0, 60], [60, 25]
    ];

    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      var body = box(5, 6, 6, 0xCCBBAA);
      body.position.set(s[0], 3, s[1]);
      g.add(body);
      var roof = box(5.5, 2, 6.5, 0xBBAA99);
      roof.position.set(s[0], 7, s[1]);
      g.add(roof);
    }

    g.position.set(OX + 0, 0, OZ + 0);
    scene.add(g);
  }

  function modelvillage(scene) {
    var g = group();

    var spots = [
      [70, 35], [72, 37], [74, 35],
      [70, 40], [72, 42], [74, 40]
    ];

    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      var b = box(1, 1.5, 1, 0xCCBBAA);
      b.position.set(s[0], 0.75, s[1]);
      g.add(b);
    }

    g.position.set(OX + 0, 0, OZ + 0);
    scene.add(g);
  }

  function train(scene) {
    var g = group();

    var loco = box(4, 2.5, 2, 0x003399);
    loco.position.set(-50, 1.25, 50);
    g.add(loco);

    var chimney = cylinder(0.4, 0.4, 1.5, 8, 0x111111);
    chimney.position.set(-51.2, 3.25, 50);
    g.add(chimney);

    var car1 = box(6, 2.5, 2, 0x003399);
    car1.position.set(-44, 1.25, 50);
    g.add(car1);

    var car2 = box(6, 2.5, 2, 0x003399);
    car2.position.set(-36, 1.25, 50);
    g.add(car2);

    g.position.set(OX + 0, 0, OZ + 0);
    scene.add(g);
  }

  function church(scene) {
    var g = group();

    var nave = box(15, 7, 10, 0xCCBBAA);
    nave.position.set(35, 3.5, -40);
    g.add(nave);

    var tower = box(4, 12, 4, 0xCCBBAA);
    tower.position.set(35, 6 + 7, -40);
    g.add(tower);

    var spire = cone(2, 6, 8, 0xBBAA99);
    spire.position.set(35, 12 + 7 + 3, -40);
    g.add(spire);

    g.position.set(OX + 0, 0, OZ + 0);
    scene.add(g);
  }

  function build(scene) {
    hill(scene);
    keep(scene);
    curtain(scene);
    gatehouse(scene);
    village(scene);
    modelvillage(scene);
    train(scene);
    church(scene);
  }

  return { build: build };
})();

window.CorfeCastle = CorfeCastle;
