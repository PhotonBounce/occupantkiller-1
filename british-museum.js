window.BritishMuseum = (function() {
  'use strict';

  var OX = 4840;
  var OZ = 2200;
  var objects = [];
  var scene = null;

  function makebox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makecylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makesphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildfacade() {
    // Main museum body
    makebox(55, 14, 10, 0xF0EEE4, 0, 7, 0);
    // 44 Ionic columns across facade
    var colcount = 44;
    var colspacing = 55 / (colcount - 1);
    var i;
    for (i = 0; i < colcount; i++) {
      var cx = -27.5 + i * colspacing;
      makecylinder(0.3, 0.35, 10, 8, 0xF0EEE4, cx, 5, -5.5);
    }
    // Triangular pediment above central section
    makebox(20, 3, 1, 0xF0EEE4, 0, 16, -5.5);
    makebox(18, 2, 1, 0xF0EEE4, 0, 18, -5.5);
    makebox(10, 1.5, 1, 0xF0EEE4, 0, 19.5, -5.5);
  }

  function buildgreatcourt() {
    // Great Court floor
    makebox(40, 0.5, 40, 0xE8E0D0, 0, 0.25, 20);
    // Glass roof suggestion - light blue ceiling panels
    makebox(40, 0.5, 40, 0x87CEEB, 0, 12, 20);
    // Reading Room drum
    makecylinder(8, 8, 6, 16, 0xD2C8B0, 0, 3, 20);
    // Reading Room dome
    makesphere(8, 16, 8, 0x87CEEB, 0, 9, 20);
    // Court walls
    makebox(0.5, 12, 40, 0xF0EEE4, -20, 6, 20);
    makebox(0.5, 12, 40, 0xF0EEE4, 20, 6, 20);
    makebox(40, 12, 0.5, 0xF0EEE4, 0, 6, 0);
    makebox(40, 12, 0.5, 0xF0EEE4, 0, 6, 40);
  }

  function buildegyptian() {
    // Rosetta Stone display
    makebox(1.2, 2.2, 0.3, 0x222222, -18, 1.1, 18);
    // Sphinx shapes
    makebox(4, 2, 2, 0xC8A870, -12, 1, 16);
    makebox(1, 2, 1, 0xC8A870, -12, 3, 15.5);
    makebox(3, 1.5, 1.8, 0xC8A870, 12, 0.75, 16);
    makebox(1, 1.8, 0.9, 0xC8A870, 12, 2.65, 15.5);
  }

  function buildelginmarbles() {
    // Long gallery
    makebox(40, 8, 5, 0xE8E0D0, 30, 4, 10);
    // Frieze panels along walls
    var j;
    for (j = 0; j < 8; j++) {
      makebox(4, 1.5, 0.2, 0xD2B48C, 10 + j * 5, 6, 7.6);
      makebox(4, 1.5, 0.2, 0xD2B48C, 10 + j * 5, 6, 12.4);
    }
    // Column supports inside gallery
    for (j = 0; j < 5; j++) {
      makecylinder(0.25, 0.25, 8, 8, 0xD8D0C0, 12 + j * 8, 4, 10);
    }
  }

  function buildrussellsquare() {
    // Park
    makebox(25, 0.3, 25, 0x228B22, -40, 0.15, -30);
    // Fountain base
    makebox(4, 0.8, 4, 0x888888, -40, 0.4, -30);
    // Fountain pillar
    makecylinder(0.3, 0.5, 3, 8, 0x888888, -40, 1.5, -30);
    // Fountain bowl
    makecylinder(1.5, 1.5, 0.4, 12, 0x888888, -40, 3, -30);
    // Trees
    var t;
    var treepos = [
      [-44, -26], [-44, -34], [-36, -26], [-36, -34],
      [-40, -22], [-40, -38]
    ];
    for (t = 0; t < treepos.length; t++) {
      makecylinder(0.2, 0.2, 3, 6, 0x5C4033, treepos[t][0], 1.5, treepos[t][1]);
      makesphere(1.5, 8, 6, 0x2D6A2D, treepos[t][0], 4.5, treepos[t][1]);
    }
  }

  function buildsenatehouse() {
    // Base (widest)
    makebox(14, 6, 14, 0xF0EEE4, -55, 3, -20);
    // Middle section
    makebox(12, 8, 12, 0xF0EEE4, -55, 10, -20);
    // Upper section
    makebox(10, 10, 10, 0xF0EEE4, -55, 19, -20);
    // Tower top
    makebox(8, 6, 8, 0xF0EEE4, -55, 27, -20);
    // Spire cap
    makebox(5, 4, 5, 0xE8E0D0, -55, 32, -20);
    // Entrance columns
    makecylinder(0.3, 0.3, 6, 8, 0xF0EEE4, -52, 3, -17);
    makecylinder(0.3, 0.3, 6, 8, 0xF0EEE4, -50, 3, -17);
    makecylinder(0.3, 0.3, 6, 8, 0xF0EEE4, -48, 3, -17);
  }

  function buildcoventgarden() {
    // Market hall
    makebox(20, 6, 14, 0xD2C8A0, 60, 3, -30);
    // Roof ridge
    makebox(20, 1, 0.5, 0xB8A880, 60, 6.5, -30);
    // Market stalls inside
    var s;
    for (s = 0; s < 4; s++) {
      makebox(3, 1.5, 2, 0xCC8844, 52 + s * 5, 0.75, -31);
      makebox(3, 1.5, 2, 0xCC8844, 52 + s * 5, 0.75, -29);
    }
    // Street performer figures
    makebox(0.6, 1.8, 0.4, 0x444488, 58, 0.9, -25);
    makebox(0.8, 0.8, 0.8, 0x444488, 58, 2.3, -25);
    makebox(0.6, 1.8, 0.4, 0x884444, 62, 0.9, -25);
    makebox(0.8, 0.8, 0.8, 0x884444, 62, 2.3, -25);
    // Arcade columns
    var ac;
    for (ac = 0; ac < 5; ac++) {
      makecylinder(0.3, 0.3, 6, 8, 0xD8D0B8, 51 + ac * 5, 3, -23);
      makecylinder(0.3, 0.3, 6, 8, 0xD8D0B8, 51 + ac * 5, 3, -37);
    }
  }

  function buildbloomsbury() {
    // Georgian terraces - north side
    var b;
    for (b = 0; b < 6; b++) {
      makebox(8, 10, 5, 0xD2B48C, -25 + b * 10, 5, -50);
      // Windows suggestion as darker boxes
      makebox(1.2, 1.5, 0.2, 0x334455, -27 + b * 10, 7, -52.6);
      makebox(1.2, 1.5, 0.2, 0x334455, -24 + b * 10, 7, -52.6);
      makebox(1.2, 1.5, 0.2, 0x334455, -27 + b * 10, 4, -52.6);
      makebox(1.2, 1.5, 0.2, 0x334455, -24 + b * 10, 4, -52.6);
    }
    // Iron railings along street
    var r;
    for (r = 0; r < 12; r++) {
      makebox(0.1, 1.5, 0.1, 0x222222, -29 + r * 5, 0.75, -47);
    }
    makebox(60, 0.1, 0.1, 0x222222, 0, 1.5, -47);
    // East side terraces
    for (b = 0; b < 4; b++) {
      makebox(5, 10, 8, 0xD2B48C, 35, 5, -20 + b * 10);
    }
  }

  function buildbritishlibrary() {
    // Main red brick complex
    makebox(35, 10, 25, 0x8B3A3A, -80, 5, -10);
    // Inner courtyard
    makebox(15, 0.3, 12, 0xC8B898, -80, 0.15, -10);
    // King's Library glass tower
    makebox(8, 18, 6, 0x88AABB, -76, 9, -5);
    // Golden books inside tower (visible suggestion)
    makebox(6, 16, 4, 0xFFD700, -76, 9, -5);
    // Entrance portico
    makebox(12, 6, 3, 0x8B3A3A, -80, 3, -22.5);
    // Entrance columns
    makecylinder(0.35, 0.35, 6, 8, 0xAA5555, -77, 3, -22);
    makecylinder(0.35, 0.35, 6, 8, 0xAA5555, -80, 3, -22);
    makecylinder(0.35, 0.35, 6, 8, 0xAA5555, -83, 3, -22);
    // Piazza in front
    makebox(20, 0.2, 10, 0xBBAAA0, -80, 0.1, -27);
  }

  function buildholbornviaduct() {
    // Bridge deck
    makebox(30, 1.5, 6, 0xAAAAAA, 50, 5, 40);
    // Red iron girders below
    makebox(30, 0.5, 0.4, 0x8B0000, 50, 4, 37.1);
    makebox(30, 0.5, 0.4, 0x8B0000, 50, 4, 42.9);
    makebox(0.4, 4, 6, 0x8B0000, 36, 3, 40);
    makebox(0.4, 4, 6, 0x8B0000, 50, 3, 40);
    makebox(0.4, 4, 6, 0x8B0000, 64, 3, 40);
    // Cross bracing
    makebox(30, 0.3, 0.2, 0x8B0000, 50, 3.5, 38);
    makebox(30, 0.3, 0.2, 0x8B0000, 50, 3.5, 42);
    // Lamp standards
    var lp;
    var lamppos = [38, 44, 50, 56, 62];
    for (lp = 0; lp < lamppos.length; lp++) {
      makecylinder(0.1, 0.1, 3.5, 6, 0xFFD700, lamppos[lp], 7.75, 37.5);
      makesphere(0.3, 6, 4, 0xFFFF88, lamppos[lp], 9.75, 37.5);
      makecylinder(0.1, 0.1, 3.5, 6, 0xFFD700, lamppos[lp], 7.75, 42.5);
      makesphere(0.3, 6, 4, 0xFFFF88, lamppos[lp], 9.75, 42.5);
    }
    // Ornate pedestals at ends
    makebox(2, 4, 2, 0xC8C0B0, 36, 2, 40);
    makebox(2, 4, 2, 0xC8C0B0, 64, 2, 40);
  }

  function buildground() {
    // Street pavement around museum
    makebox(120, 0.2, 120, 0xBBB0A0, 0, 0, 0);
    // Road markings - main road in front
    makebox(60, 0.3, 4, 0x555555, 0, 0.1, -30);
    // Side road
    makebox(4, 0.3, 80, 0x555555, -35, 0.1, 10);
  }

  function buildstreetdetail() {
    // Lamp posts along museum frontage
    var lm;
    for (lm = 0; lm < 6; lm++) {
      makecylinder(0.08, 0.12, 5, 6, 0x333333, -25 + lm * 10, 2.5, -18);
      makesphere(0.25, 6, 4, 0xFFFF99, -25 + lm * 10, 5.3, -18);
    }
    // Museum entrance steps
    makebox(20, 0.4, 2, 0xE0D8C8, 0, 0.2, -5.2);
    makebox(18, 0.4, 2, 0xE0D8C8, 0, 0.6, -3.2);
    makebox(16, 0.4, 2, 0xE0D8C8, 0, 1.0, -1.2);
    // Museum gate pillars
    makebox(1, 4, 1, 0xD8D0C0, -12, 2, -8);
    makebox(1, 4, 1, 0xD8D0C0, 12, 2, -8);
    // Iron fence
    var f;
    for (f = 0; f < 10; f++) {
      makebox(0.1, 2.5, 0.1, 0x111111, -11 + f * 2.2, 1.25, -8);
    }
    for (f = 0; f < 10; f++) {
      makebox(0.1, 2.5, 0.1, 0x111111, 1 + f * 1.2, 1.25, -8);
    }
  }

  function init(sceneref) {
    scene = sceneref;
    buildground();
    buildfacade();
    buildgreatcourt();
    buildegyptian();
    buildelginmarbles();
    buildrussellsquare();
    buildsenatehouse();
    buildcoventgarden();
    buildbloomsbury();
    buildbritishlibrary();
    buildholbornviaduct();
    buildstreetdetail();
  }

  function update(delta) {
    // static environment — nothing to update
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) { objects[i].geometry.dispose(); }
      if (objects[i].material) { objects[i].material.dispose(); }
    }
    objects = [];
    scene = null;
  }

  return { init: init, update: update, reset: reset };
}());
