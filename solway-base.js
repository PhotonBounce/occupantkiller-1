window.SolwayBase = (function() {
  'use strict';

  var OX = 2410;
  var OZ = 2200;

  var scene = null;
  var camera = null;
  var objects = [];
  var tidePulse = 0;
  var tideChannels = [];

  // Materials — MeshLambertMaterial ONLY
  var matStone = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
  var matMoat = new THREE.MeshLambertMaterial({ color: 0x1A6B8A });
  var matMud = new THREE.MeshLambertMaterial({ color: 0xA08060 });
  var matSandstone = new THREE.MeshLambertMaterial({ color: 0xB05050 });
  var matCross = new THREE.MeshLambertMaterial({ color: 0x8A7A6A });
  var matLighthouse = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
  var matBeacon = new THREE.MeshLambertMaterial({ color: 0xFF3300 });
  var matIsland = new THREE.MeshLambertMaterial({ color: 0x6A8A50 });
  var matWater = new THREE.MeshLambertMaterial({ color: 0x1A6B8A });
  var matGate = new THREE.MeshLambertMaterial({ color: 0x6A5A48 });
  var matPortcullis = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
  var matTracery = new THREE.MeshLambertMaterial({ color: 0xC08080 });
  var matAbbyTower = new THREE.MeshLambertMaterial({ color: 0xA04040 });

  function addbox(w, h, d, mat, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcylinder(rt, rb, h, segs, mat, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addsphere(r, ws, hs, mat, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcone(r, h, segs, mat, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildcastle() {
    // Caerlaverock Castle — unique triangular layout
    // Triangle corners: N apex, SW, SE — roughly 30 units wide
    // Corner tower 1: North apex
    var t1 = addbox(10, 20, 10, matStone, 0, 10, -20);
    // Corner tower 2: SW
    var t2 = addbox(10, 20, 10, matStone, -18, 10, 10);
    // Corner tower 3: SE
    var t3 = addbox(10, 20, 10, matStone, 18, 10, 10);

    // Battlements atop each tower
    addbox(12, 3, 12, matStone, 0, 21, -20);
    addbox(12, 3, 12, matStone, -18, 21, 10);
    addbox(12, 3, 12, matStone, 18, 21, 10);

    // Curtain walls connecting towers (triangular)
    // North to SW wall
    addbox(22, 12, 2, matStone, -10, 6, -5);
    // North to SE wall
    addbox(22, 12, 2, matStone, 10, 6, -5);
    // South base wall
    addbox(40, 12, 2, matStone, 0, 6, 10);

    // Gatehouse — twin towers flanking entrance at south
    addbox(6, 18, 6, matGate, -12, 9, 14);
    addbox(6, 18, 6, matGate, 12, 9, 14);
    // Portcullis slab
    addbox(8, 10, 1, matPortcullis, 0, 5, 14);
    // Gatehouse arch top
    addbox(8, 4, 3, matGate, 0, 14, 14);

    // Moat — water boxes surrounding the triangular castle
    // South moat
    addbox(50, 2, 8, matMoat, 0, 0, 22);
    // West moat
    addbox(8, 2, 40, matMoat, -25, 0, -5);
    // East moat
    addbox(8, 2, 40, matMoat, 25, 0, -5);
    // North moat
    addbox(30, 2, 8, matMoat, 0, 0, -28);
    // Corner moat fillets
    addbox(10, 2, 10, matMoat, -22, 0, -24);
    addbox(10, 2, 10, matMoat, 22, 0, -24);

    // Courtyard ground
    addbox(30, 1, 30, matStone, 0, 0, -2);
  }

  function buildtidalflats() {
    // Vast mud flat sections around the firth
    // Large mud flats — multiple box sections
    addbox(120, 1, 80, matMud, 80, -1, 0);
    addbox(100, 1, 60, matMud, -80, -1, 30);
    addbox(150, 1, 50, matMud, 30, -1, 120);
    addbox(80, 1, 90, matMud, -60, -1, -80);
    addbox(90, 1, 40, matMud, 110, -1, -60);

    // Tide channels — water boxes cutting through the mud
    var ch1 = addbox(100, 2, 8, matWater, 80, 0, 20);
    var ch2 = addbox(8, 2, 80, matWater, 50, 0, 80);
    var ch3 = addbox(120, 2, 6, matWater, -60, 0, -40);
    var ch4 = addbox(6, 2, 100, matWater, -30, 0, 100);
    var ch5 = addbox(80, 2, 5, matWater, 100, 0, -80);
    tideChannels.push(ch1, ch2, ch3, ch4, ch5);

    // Wide firth water surface
    addbox(300, 2, 200, matWater, 0, -3, -200);
  }

  function buildsweetheartabbey() {
    // Sweetheart Abbey — ruined red sandstone, founded by Devorgilla
    // Main nave body: 25×12×10
    addbox(25, 12, 10, matSandstone, -70, 6, -40);

    // Intact tower at west end
    addbox(8, 28, 8, matAbbyTower, -82, 14, -40);
    // Tower battlements
    addbox(10, 3, 10, matAbbyTower, -82, 29, -40);

    // Ruined east gable wall (partial, broken top)
    addbox(6, 18, 1, matSandstone, -58, 9, -40);
    addbox(4, 8, 1, matSandstone, -55, 14, -40);

    // North aisle wall
    addbox(25, 8, 1, matSandstone, -70, 4, -35);
    // South aisle wall (ruined — lower)
    addbox(25, 5, 1, matSandstone, -70, 2, -45);

    // Window tracery inserts — decorative boxes in walls
    addbox(3, 5, 0.5, matTracery, -65, 8, -35);
    addbox(3, 5, 0.5, matTracery, -72, 8, -35);
    addbox(3, 5, 0.5, matTracery, -79, 8, -35);
    // Rose window tracery in west tower
    addbox(5, 5, 0.5, matTracery, -82, 20, -36);

    // Fallen masonry blocks (ruins detail)
    addbox(3, 2, 3, matSandstone, -62, 1, -43);
    addbox(4, 1.5, 2, matSandstone, -76, 1, -37);
    addbox(2, 2, 4, matSandstone, -68, 1, -47);

    // Surrounding abbey wall (partial)
    addbox(40, 3, 1, matSandstone, -70, 1, -52);
    addbox(1, 3, 20, matSandstone, -52, 1, -45);
  }

  function buildruthwellcross() {
    // Ruthwell Cross — 18-foot Anglian cross, box 2×12×1
    // Base plinth
    addbox(3, 2, 3, matCross, -120, 1, 60);
    // Shaft: 2×12×1
    addbox(2, 12, 1, matCross, -120, 8, 60);
    // Crossarm
    addbox(6, 2, 1, matCross, -120, 14, 60);
    // Top finial
    addbox(1.5, 2, 1, matCross, -120, 17, 60);

    // Church enclosure — simple box building housing the cross
    addbox(12, 5, 8, matStone, -124, 2, 60);
    // Church roof (pitched — two boxes)
    addbox(14, 3, 9, matStone, -124, 6, 60);
    // Church door gap indication (thin box)
    addbox(2, 3, 0.4, matPortcullis, -124, 1, 56);
  }

  function buildhestanlighthouse() {
    // Hestan Island — in the Solway Firth
    // Island base
    addbox(30, 3, 30, matIsland, 160, -0.5, -120);
    addsphere(18, 8, 6, matIsland, 160, 0, -120);

    // Lighthouse tower — white cylinder
    addcylinder(2.5, 3, 22, 12, matLighthouse, 160, 11, -120);
    // Lighthouse lamp room
    addcylinder(3.5, 3.5, 3, 12, matLighthouse, 160, 23, -120);
    // Lantern housing top
    addcone(3, 4, 10, matLighthouse, 160, 26, -120);
    // Beacon light sphere
    addsphere(2, 8, 8, matBeacon, 160, 23, -120);

    // Keeper's cottage
    addbox(8, 4, 6, matLighthouse, 148, 2, -120);
    addbox(9, 2, 7, matStone, 148, 5, -120);

    // Jetty/landing stage
    addbox(16, 1, 3, matStone, 170, 0, -110);
  }

  function buildscenery() {
    // Ground plane for the world area — wide mud/grass base
    addbox(350, 2, 350, matMud, 0, -2, 0);

    // Border country undulation — low hills as flat boxes
    addbox(60, 4, 40, matIsland, -140, 0, -100);
    addbox(80, 3, 50, matIsland, 120, 1, -150);
    addbox(50, 5, 60, matIsland, -100, 1, 80);

    // Scattered stones — standing stones of the border
    addbox(1.5, 5, 1.5, matCross, 40, 2, -60);
    addbox(1.5, 7, 1.5, matCross, 44, 3, -57);
    addbox(1, 4, 1, matCross, 48, 2, -63);

    // Road/track across flats (box strip)
    addbox(200, 0.5, 4, matStone, -20, 0, -10);

    // Ambient line details — border markers as LineSegments
    var borderGeo = new THREE.BufferGeometry();
    var borderVerts = new Float32Array([
      OX + -100, 1, OZ + -150,
      OX + 100, 1, OZ + -150,
      OX + 100, 1, OZ + -150,
      OX + 100, 1, OZ + 150,
      OX + 100, 1, OZ + 150,
      OX + -100, 1, OZ + 150,
      OX + -100, 1, OZ + 150,
      OX + -100, 1, OZ + -150
    ]);
    borderGeo.setAttribute('position', new THREE.BufferAttribute(borderVerts, 3));
    var borderMat = new THREE.LineBasicMaterial({ color: 0x6A5A48 });
    var border = new THREE.LineSegments(borderGeo, borderMat);
    scene.add(border);
    objects.push(border);
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    objects = [];
    tideChannels = [];
    tidePulse = 0;

    buildscenery();
    buildtidalflats();
    buildcastle();
    buildsweetheartabbey();
    buildruthwellcross();
    buildhestanlighthouse();

    var ambient = new THREE.AmbientLight(0xCCDDFF, 0.7);
    scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFEECC, 0.9);
    sun.position.set(OX + 200, 150, OZ - 100);
    scene.add(sun);
  }

  function update(delta) {
    if (!scene) return;
    tidePulse += delta * 0.4;
    // Gently pulse tide channel opacity via position shimmer
    for (var i = 0; i < tideChannels.length; i++) {
      var ch = tideChannels[i];
      ch.position.y = Math.sin(tidePulse + i * 0.7) * 0.3;
    }
  }

  function reset() {
    if (scene) {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
        if (objects[i].geometry) objects[i].geometry.dispose();
      }
    }
    objects = [];
    tideChannels = [];
    tidePulse = 0;
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
