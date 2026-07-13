var WinchesterCathedral2 = (function () {
  var X_OFFSET = 7200;
  var Z_OFFSET = 0;

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

  function sphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function place(mesh, x, y, z) {
    mesh.position.set(X_OFFSET + x, y, Z_OFFSET + z);
    return mesh;
  }

  function cathedral(scene) {
    var g = group();
    var stone = 0xCCBBAA;
    var dark = 0x998877;

    // Main nave
    var nave = box(60, 14, 18, stone);
    nave.position.set(0, 7, 0);
    g.add(nave);

    // Crossing tower (flat top, no spire)
    var tower = box(10, 16, 10, stone);
    tower.position.set(0, 8, 0);
    g.add(tower);

    // North transept
    var nt = box(12, 12, 12, stone);
    nt.position.set(0, 6, -15);
    g.add(nt);

    // South transept
    var st = box(12, 12, 12, stone);
    st.position.set(0, 6, 15);
    g.add(st);

    // East transept
    var et = box(12, 12, 12, stone);
    et.position.set(20, 6, 0);
    g.add(et);

    // West transept
    var wt = box(12, 12, 12, stone);
    wt.position.set(-20, 6, 0);
    g.add(wt);

    // West front twin towers
    var wt1 = box(6, 16, 6, stone);
    wt1.position.set(-27, 8, -8);
    g.add(wt1);

    var wt2 = box(6, 16, 6, stone);
    wt2.position.set(-27, 8, 8);
    g.add(wt2);

    // Interior arch details (dark arches along nave)
    var i;
    for (i = 0; i < 6; i++) {
      var arch = box(1, 10, 18, dark);
      arch.position.set(-22 + i * 9, 5, 0);
      g.add(arch);
    }

    g.position.set(X_OFFSET + 0, 0, Z_OFFSET + 0);
    scene.add(g);
  }

  function greathall(scene) {
    var g = group();
    var color = 0xCC9966;

    // Main hall body
    var hall = box(30, 10, 16, color);
    hall.position.set(0, 5, 0);
    g.add(hall);

    // Lancet window details — thin vertical boxes on north wall
    var i;
    for (i = 0; i < 5; i++) {
      var win = box(0.8, 6, 0.3, 0xDDBB99);
      win.position.set(-10 + i * 5, 7, -8.05);
      g.add(win);
    }

    // Lancet window details — south wall
    for (i = 0; i < 5; i++) {
      var winS = box(0.8, 6, 0.3, 0xDDBB99);
      winS.position.set(-10 + i * 5, 7, 8.05);
      g.add(winS);
    }

    // Round window on west gable
    var rwin = box(3, 3, 0.3, 0xDDBB99);
    rwin.position.set(-15.05, 8, 0);
    g.add(rwin);

    g.position.set(X_OFFSET + 80, 0, Z_OFFSET + 60);
    scene.add(g);
  }

  function college(scene) {
    var g = group();
    var color = 0xBBAA88;

    // Quadrangle — 4 walls forming a square
    var wallN = box(20, 8, 1.5, color);
    wallN.position.set(0, 4, -10);
    g.add(wallN);

    var wallS = box(20, 8, 1.5, color);
    wallS.position.set(0, 4, 10);
    g.add(wallS);

    var wallE = box(1.5, 8, 20, color);
    wallE.position.set(10, 4, 0);
    g.add(wallE);

    var wallW = box(1.5, 8, 20, color);
    wallW.position.set(-10, 4, 0);
    g.add(wallW);

    // Chapel
    var chapel = box(15, 10, 8, color);
    chapel.position.set(0, 5, -18);
    g.add(chapel);

    // Chapel spire
    var spire = cone(3, 8, 4, color);
    spire.position.set(0, 14, -18);
    g.add(spire);

    g.position.set(X_OFFSET + 0, 0, Z_OFFSET + 100);
    scene.add(g);
  }

  function alfred(scene) {
    var g = group();
    var bronze = 0x8B7355;

    // Pedestal
    var pedestal = box(3, 3, 3, 0x999999);
    pedestal.position.set(0, 1.5, 0);
    g.add(pedestal);

    // Body
    var body = cylinder(0.6, 0.7, 8, 8, bronze);
    body.position.set(0, 7, 0);
    g.add(body);

    // Head
    var head = sphere(0.7, bronze);
    head.position.set(0, 11.5, 0);
    g.add(head);

    // Outstretched arm
    var arm = box(3, 0.4, 0.4, bronze);
    arm.position.set(1.5, 10, 0);
    g.add(arm);

    // Scepter/sword (vertical box)
    var sword = box(0.15, 5, 0.15, bronze);
    sword.position.set(0, 8.5, 0.5);
    g.add(sword);

    g.position.set(X_OFFSET + 60, 0, Z_OFFSET + 10);
    scene.add(g);
  }

  function river(scene) {
    var water = box(60, 0.3, 8, 0x4477AA);
    place(water, -30, 0.15, 150);
    scene.add(water);
  }

  function highstreet(scene) {
    var colors = [0x9B3A2A, 0xF0EDE0];
    var i;
    for (i = 0; i < 10; i++) {
      var c = colors[i % 2];
      var b = box(6, 8, 8, c);
      place(b, -40 + i * 9, 4, -60);
      scene.add(b);
    }
  }

  function westgate(scene) {
    var g = group();
    var color = 0xBBAA88;

    // Main gate body
    var body = box(8, 10, 8, color);
    body.position.set(0, 5, 0);
    g.add(body);

    // Gate arch passage (darker box)
    var arch = box(4, 7, 8.2, 0x887766);
    arch.position.set(0, 3.5, 0);
    g.add(arch);

    // Battlements
    var i;
    for (i = 0; i < 4; i++) {
      var merlon = box(1.2, 1.5, 1.2, color);
      merlon.position.set(-3 + i * 2, 11, -3);
      g.add(merlon);
      var merlon2 = box(1.2, 1.5, 1.2, color);
      merlon2.position.set(-3 + i * 2, 11, 3);
      g.add(merlon2);
    }

    g.position.set(X_OFFSET - 60, 0, Z_OFFSET - 30);
    scene.add(g);
  }

  function citymill(scene) {
    var g = group();
    var color = 0x8B6914;

    // Mill building
    var mill = box(12, 8, 10, color);
    mill.position.set(0, 4, 0);
    g.add(mill);

    // Roof
    var roof = box(13, 2, 11, 0x6B4F10);
    roof.position.set(0, 9, 0);
    g.add(roof);

    // Millwheel — CylinderGeometry, radius 3, width 1, lying on side
    var wheel = cylinder(3, 3, 1, 12, 0x5C4010);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(7, 3, 0);
    g.add(wheel);

    // Wheel spokes (LineSegments)
    var spokeGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 4);
    var spokeMat = new THREE.MeshLambertMaterial({ color: 0x3C2A08 });
    var spoke1 = new THREE.Mesh(spokeGeo, spokeMat);
    spoke1.rotation.z = Math.PI / 2;
    spoke1.position.set(7, 3, 0);
    g.add(spoke1);

    var spoke2 = new THREE.Mesh(spokeGeo, spokeMat);
    spoke2.rotation.z = Math.PI / 2;
    spoke2.rotation.x = Math.PI / 2;
    spoke2.position.set(7, 3, 0);
    g.add(spoke2);

    g.position.set(X_OFFSET - 80, 0, Z_OFFSET + 50);
    scene.add(g);
  }

  function build(scene) {
    cathedral(scene);
    greathall(scene);
    college(scene);
    alfred(scene);
    river(scene);
    highstreet(scene);
    westgate(scene);
    citymill(scene);
  }

  window.WinchesterCathedral2 = { build: build };
  return window.WinchesterCathedral2;
})();
