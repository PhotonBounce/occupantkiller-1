window.DurdleDoor = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var waveObjects = [];
  var waveTime = 0;

  var OX = 3760;
  var OZ = 2200;

  function addbox(color, x, y, z, w, h, d, rx, ry, rz) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildarch() {
    var limestone = 0xF5F5DC;
    // Left pillar
    addbox(limestone, -20, 7, 0, 8, 14, 6, 0, 0, 0);
    // Right pillar
    addbox(limestone, 20, 7, 0, 8, 14, 6, 0, 0, 0);
    // Arch keystone boxes - stacked at angles to form arch
    addbox(limestone, -15, 16, 0, 7, 5, 5, 0, 0, 0.4);
    addbox(limestone, -9, 20, 0, 7, 5, 5, 0, 0, 0.2);
    addbox(limestone, -2, 22, 0, 8, 5, 5, 0, 0, 0);
    addbox(limestone, 6, 21, 0, 7, 5, 5, 0, 0, -0.15);
    addbox(limestone, 13, 18, 0, 7, 5, 5, 0, 0, -0.35);
    // Arch underside fill
    addbox(limestone, -8, 14, 0, 5, 4, 4, 0, 0, 0.3);
    addbox(limestone, 8, 14, 0, 5, 4, 4, 0, 0, -0.3);
    // Water beneath arch - calm blue box
    addbox(0x1E90FF, 0, 0.5, 0, 36, 1, 6, 0, 0, 0);
  }

  function buildcliffs() {
    var cliffcolor = 0xFAFAF0;
    var i, j;
    // West cliff face - 40 wide, 20 tall in blocks
    for (i = 0; i < 40; i++) {
      for (j = 0; j < 20; j++) {
        addbox(cliffcolor, -100 + i * 6 - 80, j * 8 + 4, -30, 6, 8, 20, 0, 0, 0);
      }
    }
    // East cliff face
    for (i = 0; i < 40; i++) {
      for (j = 0; j < 20; j++) {
        addbox(cliffcolor, 60 + i * 6, j * 8 + 4, -30, 6, 8, 20, 0, 0, 0);
      }
    }
  }

  function buildbeach() {
    var pebblegray = 0x888888;
    var i;
    var pebbledata = [
      [-12, 0.3, 20, 1.2, 0.6, 0.9],
      [-8, 0.4, 22, 0.9, 0.5, 1.1],
      [-5, 0.3, 18, 1.4, 0.7, 1.0],
      [-2, 0.4, 25, 1.0, 0.5, 0.8],
      [1, 0.3, 21, 1.3, 0.6, 1.2],
      [4, 0.4, 19, 0.8, 0.5, 0.9],
      [7, 0.3, 23, 1.1, 0.6, 1.0],
      [10, 0.4, 20, 1.5, 0.7, 0.8],
      [-15, 0.3, 28, 1.0, 0.5, 1.1],
      [-10, 0.4, 30, 1.2, 0.6, 0.9],
      [-6, 0.3, 26, 0.9, 0.5, 1.3],
      [0, 0.4, 32, 1.4, 0.7, 0.8],
      [5, 0.3, 27, 1.1, 0.5, 1.0],
      [9, 0.4, 29, 1.3, 0.6, 0.9],
      [13, 0.3, 24, 0.8, 0.5, 1.2],
      [-18, 0.4, 35, 1.0, 0.6, 0.8],
      [-13, 0.3, 33, 1.2, 0.5, 1.1],
      [-7, 0.4, 36, 1.5, 0.7, 0.9],
      [3, 0.3, 38, 1.1, 0.6, 1.0],
      [11, 0.4, 34, 0.9, 0.5, 1.3],
      [-20, 0.3, 15, 1.3, 0.6, 0.8],
      [-16, 0.4, 12, 1.0, 0.5, 1.0],
      [16, 0.3, 18, 1.2, 0.6, 0.9],
      [19, 0.4, 25, 0.8, 0.5, 1.1],
      [-22, 0.3, 22, 1.4, 0.7, 1.0],
      [22, 0.4, 20, 1.1, 0.5, 0.8],
      [-4, 0.3, 40, 1.3, 0.6, 1.2],
      [8, 0.4, 42, 0.9, 0.5, 0.9],
      [-11, 0.3, 44, 1.0, 0.6, 1.1],
      [15, 0.4, 38, 1.2, 0.7, 0.8]
    ];
    for (i = 0; i < pebbledata.length; i++) {
      var pd = pebbledata[i];
      addbox(pebblegray, pd[0], pd[1], pd[2], pd[3], pd[4], pd[5], 0, 0, 0);
    }
  }

  function buildlulworthcove() {
    var cliffcolor = 0xFAFAF0;
    var watercolor = 0x006994;
    var i;
    // Circular cove east of main arch - cliff boxes in arc
    var cx = 180;
    var cz = -50;
    var radius = 60;
    for (i = 0; i < 16; i++) {
      var angle = (i / 16) * Math.PI;
      var bx = cx + Math.cos(angle) * radius;
      var bz = cz + Math.sin(angle) * radius;
      addbox(cliffcolor, bx, 15, bz, 14, 30, 14, 0, angle, 0);
    }
    // Back wall cliffs
    for (i = 0; i < 6; i++) {
      addbox(cliffcolor, cx - 30 + i * 12, 15, cz - 65, 12, 30, 12, 0, 0, 0);
    }
    // Calm water surface
    addbox(watercolor, cx, 0.5, cz, 110, 1, 100, 0, 0, 0);
  }

  function buildstairhole() {
    var limestone = 0xF5F5DC;
    // Stair Hole - smaller arch/cave to west
    var sx = -120;
    var sz = -10;
    // Left pillar
    addbox(limestone, sx - 8, 5, sz, 5, 10, 5, 0, 0, 0);
    // Right pillar
    addbox(limestone, sx + 8, 5, sz, 5, 10, 5, 0, 0, 0);
    // Arch pieces
    addbox(limestone, sx - 4, 11, sz, 4, 4, 4, 0, 0, 0.35);
    addbox(limestone, sx, 13, sz, 5, 4, 4, 0, 0, 0);
    addbox(limestone, sx + 4, 11, sz, 4, 4, 4, 0, 0, -0.35);
    // Cliff face behind
    addbox(limestone, sx, 10, sz - 10, 30, 20, 8, 0, 0, 0);
    // Cave water
    addbox(0x1E90FF, sx, 0.5, sz, 14, 1, 6, 0, 0, 0);
  }

  function buildseastacks() {
    var stackcolor = 0xF0E8D0;
    // Three sea stacks rising from water west of arch
    addbox(stackcolor, -50, 8, -40, 4, 16, 4, 0, 0, 0);
    addbox(stackcolor, -65, 11, -55, 3, 22, 3, 0, 0, 0);
    addbox(stackcolor, -42, 6, -60, 5, 12, 5, 0, 0, 0);
    // Water around stacks
    addbox(0x006994, -55, 0.5, -52, 60, 1, 50, 0, 0, 0);
  }

  function buildbeachhuts() {
    var hutcolors = [0xFF0000, 0xFFFF00, 0x0000FF, 0x00AA00, 0xFF6600, 0xFF00FF];
    var i;
    for (i = 0; i < 6; i++) {
      var hx = -60 + i * 14;
      var hcolor = hutcolors[i % hutcolors.length];
      // Hut body
      addbox(hcolor, hx, 4, -60, 10, 8, 8, 0, 0, 0);
      // Roof
      addbox(0x8B4513, hx, 9, -60, 11, 3, 9, 0, 0, 0);
      // Door
      addbox(0x5C3317, hx, 2.5, -56, 3, 5, 0.5, 0, 0, 0);
    }
  }

  function buildfossilammonites() {
    var fossilcolor = 0x8B4513;
    var cliffz = -30;
    var i;
    var ammonitedata = [
      [-80, 12, 2, 0.5, 2],
      [-60, 18, 2, 0.5, 2],
      [-50, 8, 2, 0.5, 2],
      [70, 14, 2, 0.5, 2],
      [85, 22, 2, 0.5, 2],
      [95, 10, 2, 0.5, 2],
      [-40, 25, 2, 0.5, 2],
      [110, 16, 2, 0.5, 2]
    ];
    for (i = 0; i < ammonitedata.length; i++) {
      var ad = ammonitedata[i];
      // Flat disc shape embedded in cliff (thin box)
      addbox(fossilcolor, ad[0], ad[1], cliffz + 1, ad[2] * 8, ad[3], ad[4], 0, 0, 0);
      // Inner spiral suggestion
      addbox(0x6B3410, ad[0], ad[1], cliffz + 1.5, ad[2] * 5, ad[3] * 0.6, 1, 0, 0, 0);
    }
  }

  function buildwaymarkers() {
    var woodcolor = 0xA0522D;
    var signcolor = 0xF5DEB3;
    var i;
    var markerx = [-90, -30, 0, 50, 100];
    for (i = 0; i < markerx.length; i++) {
      // Post
      addbox(woodcolor, markerx[i], 6, -75, 1, 12, 1, 0, 0, 0);
      // Sign plaque
      addbox(signcolor, markerx[i] + 3, 11, -75, 8, 4, 0.5, 0, 0, 0);
    }
  }

  function buildsea() {
    var i;
    var seacolor = 0x006994;
    // Main sea in front of arch
    for (i = 0; i < 6; i++) {
      var wavemesh = addbox(seacolor, -20 + i * 8, 0.5 + Math.sin(i * 0.8) * 0.3, -10 - i * 5, 18, 1, 8, 0, 0, 0);
      waveObjects.push({ mesh: wavemesh, phase: i * 0.8, baseY: 0.5 + Math.sin(i * 0.8) * 0.3 });
    }
  }

  function buildcliftop() {
    var grasscolor = 0x4A7C59;
    var i;
    // Clifftop grass blocks west
    for (i = 0; i < 20; i++) {
      addbox(grasscolor, -200 + i * 10, 162, -50, 10, 3, 20, 0, 0, 0);
    }
    // Clifftop grass blocks east
    for (i = 0; i < 20; i++) {
      addbox(grasscolor, 60 + i * 10, 162, -50, 10, 3, 20, 0, 0, 0);
    }
  }

  function buildground() {
    // Sandy beach ground
    addbox(0xC2B280, 0, -0.5, 25, 120, 1, 80, 0, 0, 0);
    // Grass clifftop approach
    addbox(0x4A7C59, 0, -0.5, -80, 200, 1, 60, 0, 0, 0);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    waveObjects = [];
    waveTime = 0;

    buildground();
    buildarch();
    buildcliffs();
    buildbeach();
    buildseastacks();
    buildstairhole();
    buildlulworthcove();
    buildbeachhuts();
    buildfossilammonites();
    buildwaymarkers();
    buildcliftop();
    buildsea();
  }

  function update(delta) {
    var i, w;
    waveTime += delta;
    for (i = 0; i < waveObjects.length; i++) {
      w = waveObjects[i];
      w.mesh.position.y = w.baseY + Math.sin(waveTime * 1.2 + w.phase) * 0.4;
    }
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) objects[i].material.dispose();
    }
    objects = [];
    waveObjects = [];
    scene = null;
    camera = null;
  }

  return { init: init, update: update, reset: reset };

}());
