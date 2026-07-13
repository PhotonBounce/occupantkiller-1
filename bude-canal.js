window.BudeCanal = (function () {
  var OX = 7880;
  var OZ = 0;

  function group() {
    return new THREE.Group();
  }

  function lambert(hex) {
    return new THREE.MeshLambertMaterial({ color: hex });
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

  function canal(g) {
    var channel = mesh(box(60, 0.3, 6), lambert(0x336677));
    channel.position.set(0, 0, 0);
    g.add(channel);

    var ramp = mesh(box(3, 0.3, 20), lambert(0x554433));
    ramp.position.set(31.5, 4, 0);
    ramp.rotation.x = Math.atan2(8, 20);
    g.add(ramp);

    var boatPositions = [-20, 0, 20];
    for (var i = 0; i < 3; i++) {
      var boat = mesh(box(3, 1, 2), lambert(0x8B6914));
      boat.position.set(boatPositions[i], 0.65, 0);
      g.add(boat);
    }
  }

  function castle(g) {
    var body = mesh(box(15, 12, 9), lambert(0xF5F0E0));
    body.position.set(0, 6, 0);
    g.add(body);

    var t1 = mesh(cylinder(3, 3, 11), lambert(0xDDCCBB));
    t1.position.set(-9, 5.5, -6);
    g.add(t1);

    var t2 = mesh(cylinder(3, 3, 11), lambert(0xDDCCBB));
    t2.position.set(9, 5.5, -6);
    g.add(t2);
  }

  function beach(g) {
    var sand = mesh(box(80, 0.3, 25), lambert(0xF4E0A0));
    sand.position.set(0, 0, 0);
    g.add(sand);

    var sea = mesh(box(80, 0.3, 30), lambert(0x4488BB));
    sea.position.set(0, -0.01, 27.5);
    g.add(sea);
  }

  function breakwater(g) {
    var bw = mesh(box(3, 2, 60), lambert(0x888877));
    bw.position.set(0, 1, 0);
    g.add(bw);
  }

  function huts(g) {
    var colors = [
      0xFF4444, 0xFF8800, 0xFFFF00, 0x44FF44,
      0x44FFFF, 0x4444FF, 0xFF44FF, 0xFF8844,
      0x88FF44, 0x44FF88, 0x8844FF, 0xFF4488
    ];
    for (var i = 0; i < 12; i++) {
      var hut = mesh(box(2.5, 2, 3), lambert(colors[i]));
      hut.position.set(-27.5 + i * 5, 1, 0);
      g.add(hut);
    }
  }

  function tower(g) {
    var base = mesh(cylinder(3, 3, 10, 8), lambert(0x885533));
    base.position.set(0, 5, 0);
    g.add(base);

    var cap = mesh(cone(3.5, 3, 8), lambert(0x664422));
    cap.position.set(0, 11.5, 0);
    g.add(cap);
  }

  function lifehouse(g) {
    var h = mesh(box(10, 8, 5), lambert(0x8B6914));
    h.position.set(0, 4, 0);
    g.add(h);
  }

  function town(g) {
    for (var i = 0; i < 8; i++) {
      var shop = mesh(box(5, 7, 8), lambert(0xF0EDE0));
      shop.position.set(-35 + i * 10, 3.5, 0);
      g.add(shop);
    }
  }

  function build(scene) {
    var root = group();
    root.position.set(OX, 0, OZ);

    var canalGroup = group();
    canalGroup.position.set(-30, 0, -50);
    canal(canalGroup);
    root.add(canalGroup);

    var castleGroup = group();
    castleGroup.position.set(60, 0, -30);
    castle(castleGroup);
    root.add(castleGroup);

    var beachGroup = group();
    beachGroup.position.set(0, -0.15, 40);
    beach(beachGroup);
    root.add(beachGroup);

    var bwGroup = group();
    bwGroup.position.set(-50, 0, 20);
    breakwater(bwGroup);
    root.add(bwGroup);

    var hutsGroup = group();
    hutsGroup.position.set(0, 0.15, 30);
    huts(hutsGroup);
    root.add(hutsGroup);

    var towerGroup = group();
    towerGroup.position.set(80, 10, -10);
    tower(towerGroup);
    root.add(towerGroup);

    var lifehouseGroup = group();
    lifehouseGroup.position.set(40, 0, 10);
    lifehouse(lifehouseGroup);
    root.add(lifehouseGroup);

    var townGroup = group();
    townGroup.position.set(0, 0, -20);
    town(townGroup);
    root.add(townGroup);

    scene.add(root);
    return root;
  }

  return { build: build };
})();
