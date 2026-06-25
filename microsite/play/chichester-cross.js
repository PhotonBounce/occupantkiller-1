var ChichesterCross = (function () {
  var X_OFFSET = 7040;
  var Z_OFFSET = 0;

  function group() {
    return new THREE.Group();
  }

  function lambert(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function box(w, h, d) {
    return new THREE.BoxGeometry(w, h, d);
  }

  function cylinder(rt, rb, h, segs) {
    return new THREE.CylinderGeometry(rt, rb, h, segs || 16);
  }

  function cone(r, h, segs) {
    return new THREE.ConeGeometry(r, h, segs || 16);
  }

  function mesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  function place(obj, x, y, z) {
    obj.position.set(X_OFFSET + x, y, Z_OFFSET + z);
    return obj;
  }

  function cathedral() {
    var g = group();
    var stone = lambert(0xCCBBAA);

    var nave = mesh(box(45, 12, 16), stone);
    nave.position.set(0, 6, 0);
    g.add(nave);

    var tower = mesh(box(8, 22, 8), stone);
    tower.position.set(0, 11, 0);
    g.add(tower);

    var spire = mesh(cone(6, 20, 8), stone);
    spire.position.set(0, 22 + 10, 0);
    g.add(spire);

    var wt1 = mesh(box(4, 16, 4), stone);
    wt1.position.set(-24, 8, -6);
    g.add(wt1);

    var wt2 = mesh(box(4, 16, 4), stone);
    wt2.position.set(-24, 8, 6);
    g.add(wt2);

    return g;
  }

  function marketCross() {
    var g = group();
    var stone = lambert(0xCCBBAA);

    var base = mesh(cylinder(4, 4, 1, 8), stone);
    base.position.set(0, 0.5, 0);
    g.add(base);

    var col = mesh(cylinder(1, 1, 5, 8), stone);
    col.position.set(0, 3.5, 0);
    g.add(col);

    var angles = [0, 1, 2, 3, 4, 5, 6, 7];
    for (var i = 0; i < angles.length; i++) {
      var angle = (Math.PI * 2 / 8) * i;
      var bx = mesh(box(0.8, 4, 0.8), stone);
      bx.position.set(Math.cos(angle) * 3.2, 3, Math.sin(angle) * 3.2);
      g.add(bx);
    }

    var canopy = mesh(cone(6, 4, 8), stone);
    canopy.position.set(0, 8, 0);
    g.add(canopy);

    return g;
  }

  function romanWalls() {
    var g = group();
    var stone = lambert(0xAA9977);

    var walls = [
      [0, 0, 0, 0],
      [10, 50, 0, 90],
      [0, 100, 0, 0],
      [-50, 50, 0, 90]
    ];

    for (var i = 0; i < walls.length; i++) {
      var w = mesh(box(20, 4, 2), stone);
      w.position.set(walls[i][0], 2, walls[i][1]);
      w.rotation.y = walls[i][3] * Math.PI / 180;
      g.add(w);
    }

    var gatePositions = [
      [5, 20],
      [95, -5]
    ];

    for (var j = 0; j < gatePositions.length; j++) {
      var gx = gatePositions[j][0];
      var gz = gatePositions[j][1];

      var p1 = mesh(box(1.5, 4, 2), stone);
      p1.position.set(gx - 2, 2, gz);
      g.add(p1);

      var p2 = mesh(box(1.5, 4, 2), stone);
      p2.position.set(gx + 2, 2, gz);
      g.add(p2);

      var lintel = mesh(box(5.5, 0.8, 2), stone);
      lintel.position.set(gx, 4.4, gz);
      g.add(lintel);
    }

    return g;
  }

  function festivalTheatre() {
    var g = group();
    var concrete = lambert(0x778888);

    var drum = mesh(cylinder(18, 18, 6, 6), concrete);
    drum.position.set(0, 3, 0);
    g.add(drum);

    var canopyAngles = [0, 1, 2, 3, 4, 5];
    for (var i = 0; i < canopyAngles.length; i++) {
      var angle = (Math.PI * 2 / 6) * i;
      var panel = mesh(box(8, 0.4, 3), concrete);
      panel.position.set(Math.cos(angle) * 20, 6.2, Math.sin(angle) * 20);
      panel.rotation.y = angle;
      g.add(panel);
    }

    return g;
  }

  function pallantHouse() {
    var g = group();
    var brick = lambert(0x993322);
    var hedge = lambert(0x336622);

    var mansion = mesh(box(14, 8, 12), brick);
    mansion.position.set(0, 4, 0);
    g.add(mansion);

    var hedgePositions = [
      [-8, 0, -10],
      [8, 0, -10],
      [-8, 0, 10],
      [8, 0, 10]
    ];

    for (var i = 0; i < hedgePositions.length; i++) {
      var h = mesh(box(2, 2, 4), hedge);
      h.position.set(hedgePositions[i][0], 1, hedgePositions[i][1]);
      g.add(h);
    }

    return g;
  }

  function canalBasin() {
    var g = group();
    var water = lambert(0x336677);
    var wood = lambert(0x554433);

    var basin = mesh(box(30, 0.3, 12), water);
    basin.position.set(0, 0.15, 0);
    g.add(basin);

    var gate1 = mesh(box(4, 3, 0.5), wood);
    gate1.position.set(-12, 1.5, 0);
    g.add(gate1);

    var gate2 = mesh(box(4, 3, 0.5), wood);
    gate2.position.set(12, 1.5, 0);
    g.add(gate2);

    return g;
  }

  function highStreet() {
    var g = group();
    var cream = lambert(0xF0EDE0);
    var brick = lambert(0x9B3A2A);

    for (var i = 0; i < 12; i++) {
      var mat = (i % 3 === 0) ? brick : cream;
      var b = mesh(box(6, 8, 8), mat);
      var side = (i < 6) ? -5 : 5;
      var pos = (i < 6) ? i : (i - 6);
      b.position.set(pos * 7 - 17.5, 4, side);
      g.add(b);
    }

    return g;
  }

  function build(scene) {
    var root = group();
    root.position.set(X_OFFSET, 0, Z_OFFSET);

    var cat = cathedral();
    cat.position.set(0, 0, 0);
    root.add(cat);

    var mc = marketCross();
    mc.position.set(60, 0, 0);
    root.add(mc);

    var rw = romanWalls();
    rw.position.set(-80, 0, 40);
    root.add(rw);

    var ft = festivalTheatre();
    ft.position.set(0, 0, 80);
    root.add(ft);

    var ph = pallantHouse();
    ph.position.set(80, 0, 40);
    root.add(ph);

    var cb = canalBasin();
    cb.position.set(0, 0, -80);
    root.add(cb);

    var hs = highStreet();
    hs.position.set(30, 0, -30);
    root.add(hs);

    scene.add(root);
    return root;
  }

  return { build: build };
}());
