window.SwampAssault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var guerrillas = [];
  var hudElement = null;
  var time = 0;
  var lastKeyChar = null;
  var lastKeyTime = 0;
  var enabled = true;

  // HUD state
  var guerrillasNeutralized = 0;
  var dockSecured = false;
  var airboatFuel = 62;

  // Animation refs
  var airboat = null;
  var airboatAngle = 0;
  var crocodile = null;
  var fogBox = null;
  var fireflies = [];
  var canopySpheres = [];
  var guerrillaGroups = [];

  var handleKeyPress = function(e) {
    var now = Date.now();
    var key = e.key ? e.key.toUpperCase() : '';
    if (lastKeyChar === 'S' && key === 'W' && (now - lastKeyTime) < 400) {
      enabled = !enabled;
      updateHUD();
    }
    if (key === 'S' || key === 'W') {
      lastKeyChar = key;
      lastKeyTime = now;
    }
  };

  var updateHUD = function() {
    if (!hudElement) return;
    hudElement.innerHTML =
      'GUERRILLAS NEUTRALIZED: ' + guerrillasNeutralized + '/7<br>' +
      'DOCK SECURED: ' + (dockSecured ? 'YES' : 'NO') + '<br>' +
      'AIRBOAT FUEL: ' + airboatFuel + '%<br>' +
      'STATUS: ' + (enabled ? 'ON' : 'OFF');
  };

  var makeObj = function(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  };

  var init = function(sc, cam) {
    scene = sc;
    camera = cam;
    objects = [];
    guerrillas = [];
    fireflies = [];
    canopySpheres = [];
    guerrillaGroups = [];
    airboat = null;
    crocodile = null;
    fogBox = null;
    guerrillasNeutralized = 0;
    dockSecured = false;
    airboatFuel = 62;
    time = 0;
    lastKeyChar = null;
    lastKeyTime = 0;
    enabled = true;

    document.addEventListener('keydown', handleKeyPress);

    // HUD
    var hudDiv = document.createElement('div');
    hudDiv.id = 'swamp-assault-hud';
    hudDiv.style.cssText = 'position:absolute;top:20px;left:20px;color:#7fff7f;font-family:monospace;font-size:14px;text-shadow:0 0 8px #3f9f3f;z-index:100;pointer-events:none;';
    document.body.appendChild(hudDiv);
    hudElement = hudDiv;
    updateHUD();

    // Scene fog and background
    scene.fog = new THREE.FogExp2(0x1a2e0f, 0.035);
    scene.background = new THREE.Color(0x0d1a08);

    // Lighting
    var ambient = new THREE.AmbientLight(0x223311, 0.7);
    scene.add(ambient);
    objects.push(ambient);

    var dirLight = new THREE.DirectionalLight(0x44aa22, 0.6);
    dirLight.position.set(20, 40, 10);
    scene.add(dirLight);
    objects.push(dirLight);

    var moonLight = new THREE.DirectionalLight(0x8899cc, 0.3);
    moonLight.position.set(-30, 50, -20);
    scene.add(moonLight);
    objects.push(moonLight);

    // 1. Swamp water surface — large flat box, dark murky green
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3d1a, transparent: true, opacity: 0.88 });
    var waterGeo = new THREE.BoxGeometry(120, 0.1, 120);
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, -0.05, 0);
    makeObj(water);

    // 2. Mangrove trees — 6 trees, each with trunk + arching root props
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x2e1a0a });
    var rootMat = new THREE.MeshLambertMaterial({ color: 0x3a2010 });
    var treePositions = [
      [-18, 0, -12], [14, 0, -20], [-8, 0, 18],
      [22, 0, 8], [-26, 0, 5], [6, 0, -30]
    ];
    for (var ti = 0; ti < treePositions.length; ti++) {
      var tp = treePositions[ti];
      var trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 8, 7);
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tp[0], 4, tp[2]);
      makeObj(trunk);
      // Root props (arching boxes)
      for (var ri = 0; ri < 4; ri++) {
        var angle = (ri / 4) * Math.PI * 2;
        var rootGeo = new THREE.BoxGeometry(0.2, 2.5, 0.2);
        var root = new THREE.Mesh(rootGeo, rootMat);
        root.position.set(
          tp[0] + Math.cos(angle) * 1.2,
          1.0,
          tp[2] + Math.sin(angle) * 1.2
        );
        root.rotation.z = Math.cos(angle) * 0.4;
        root.rotation.x = Math.sin(angle) * 0.4;
        makeObj(root);
      }
    }

    // 3. Guerrilla figures — 7, camouflaged green-brown
    var guerBody = new THREE.MeshLambertMaterial({ color: 0x3d4a1e });
    var guerHead = new THREE.MeshLambertMaterial({ color: 0x4a3820 });
    var guerPos = [
      [-15, 0, -10], [12, 0, -18], [-6, 0, 16],
      [20, 0, 6], [-24, 0, 3], [4, 0, -28], [18, 0, -6]
    ];
    for (var gi = 0; gi < guerPos.length; gi++) {
      var gp = guerPos[gi];
      var bodyGeo = new THREE.BoxGeometry(0.7, 1.2, 0.5);
      var body = new THREE.Mesh(bodyGeo, guerBody);
      body.position.set(gp[0], 0.7, gp[2]);
      makeObj(body);
      var headGeo = new THREE.SphereGeometry(0.3, 6, 6);
      var head = new THREE.Mesh(headGeo, guerHead);
      head.position.set(gp[0], 1.7, gp[2]);
      makeObj(head);
      guerrillas.push({ body: body, head: head, baseX: gp[0], baseZ: gp[2], phase: gi * 1.1 });
      guerrillaGroups.push({ body: body, head: head });
    }

    // 4. Assault team figures — 4, in wetsuits (dark blue-black)
    var assaultMat = new THREE.MeshLambertMaterial({ color: 0x0a0f1e });
    var assaultHeadMat = new THREE.MeshLambertMaterial({ color: 0x1a1209 });
    var assaultPos = [
      [5, 0, 10], [8, 0, 12], [3, 0, 14], [6, 0, 8]
    ];
    for (var ai = 0; ai < assaultPos.length; ai++) {
      var ap = assaultPos[ai];
      var abGeo = new THREE.BoxGeometry(0.65, 1.2, 0.5);
      var ab = new THREE.Mesh(abGeo, assaultMat);
      ab.position.set(ap[0], 0.7, ap[2]);
      makeObj(ab);
      var ahGeo = new THREE.SphereGeometry(0.28, 6, 6);
      var ah = new THREE.Mesh(ahGeo, assaultHeadMat);
      ah.position.set(ap[0], 1.7, ap[2]);
      makeObj(ah);
    }

    // 5. Airboat — flat box body + cylinder fan + box guard
    var boatMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var fanMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var boatGeo = new THREE.BoxGeometry(4, 0.4, 2.5);
    var boatMesh = new THREE.Mesh(boatGeo, boatMat);
    boatMesh.position.set(-5, 0.2, 5);
    makeObj(boatMesh);
    var fanGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 10);
    var fan = new THREE.Mesh(fanGeo, fanMat);
    fan.rotation.x = Math.PI / 2;
    fan.position.set(-5, 0.9, 6.5);
    makeObj(fan);
    var guardGeo = new THREE.BoxGeometry(2, 1.5, 0.1);
    var guard = new THREE.Mesh(guardGeo, boatMat);
    guard.position.set(-5, 0.75, 6.45);
    makeObj(guard);
    airboat = boatMesh;
    airboatAngle = 0;

    // 6. Wooden dock — 3 sections, flat plank boxes + cylinder posts
    var plankMat = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
    var postMat = new THREE.MeshLambertMaterial({ color: 0x5a3d1e });
    for (var di = 0; di < 3; di++) {
      var dz = -5 + di * 3;
      var plankGeo = new THREE.BoxGeometry(4, 0.2, 2.5);
      var plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(30, 0.1, dz);
      makeObj(plank);
      for (var pi = 0; pi < 2; pi++) {
        var postGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
        var post = new THREE.Mesh(postGeo, postMat);
        post.position.set(30 + (pi === 0 ? -1.7 : 1.7), -0.9, dz);
        makeObj(post);
      }
    }

    // 7. Abandoned hut — box walls + box roof + cylinder stilts
    var hutMat = new THREE.MeshLambertMaterial({ color: 0x7a5c3a });
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
    var stiltMat = new THREE.MeshLambertMaterial({ color: 0x5a3d20 });
    var wallsGeo = new THREE.BoxGeometry(5, 3, 4);
    var walls = new THREE.Mesh(wallsGeo, hutMat);
    walls.position.set(-30, 2.5, -8);
    makeObj(walls);
    var roofGeo = new THREE.BoxGeometry(5.8, 0.5, 4.8);
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(-30, 4.25, -8);
    makeObj(roof);
    var stiltPositions = [[-28, -33], [-28, -3], [-32, -13], [-32, -3]];
    for (var si = 0; si < stiltPositions.length; si++) {
      var sGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 6);
      var stilt = new THREE.Mesh(sGeo, stiltMat);
      stilt.position.set(stiltPositions[si][0], 0.0, stiltPositions[si][1]);
      makeObj(stilt);
    }

    // 8. Tree canopy — sphere clusters, dark green
    var canopyMat = new THREE.MeshLambertMaterial({ color: 0x1a4010, transparent: true, opacity: 0.92 });
    var canopyMat2 = new THREE.MeshLambertMaterial({ color: 0x0d2e08, transparent: true, opacity: 0.85 });
    for (var ci = 0; ci < treePositions.length; ci++) {
      var cp = treePositions[ci];
      for (var cj = 0; cj < 3; cj++) {
        var cx = cp[0] + (Math.random() * 3 - 1.5);
        var cz = cp[2] + (Math.random() * 3 - 1.5);
        var cy = 6.5 + cj * 1.2;
        var cGeo = new THREE.SphereGeometry(2.5 - cj * 0.4, 7, 6);
        var cMat = cj % 2 === 0 ? canopyMat : canopyMat2;
        var cs = new THREE.Mesh(cGeo, cMat);
        cs.position.set(cx, cy, cz);
        cs.userData = { baseY: cy, phase: ci * 0.7 + cj * 0.3 };
        makeObj(cs);
        canopySpheres.push(cs);
      }
    }

    // 9. Crocodile — flat body box + box head + box tail
    var crocMat = new THREE.MeshLambertMaterial({ color: 0x2d4a1a });
    var crocBodyGeo = new THREE.BoxGeometry(3, 0.35, 1);
    var crocBody = new THREE.Mesh(crocBodyGeo, crocMat);
    crocBody.position.set(10, 0.07, -5);
    makeObj(crocBody);
    var crocHeadGeo = new THREE.BoxGeometry(1.2, 0.28, 0.8);
    var crocHead = new THREE.Mesh(crocHeadGeo, crocMat);
    crocHead.position.set(11.8, 0.12, -5);
    makeObj(crocHead);
    var crocTailGeo = new THREE.BoxGeometry(1.5, 0.22, 0.6);
    var crocTail = new THREE.Mesh(crocTailGeo, crocMat);
    crocTail.position.set(8.2, 0.06, -5);
    makeObj(crocTail);
    crocodile = crocBody;

    // 10. Rope bridge — LineSegments cables + box planks
    var bridgeMat = new THREE.LineBasicMaterial({ color: 0x7a5c2a });
    var cablePoints = [];
    for (var bi = 0; bi <= 10; bi++) {
      var bx = -12 + bi * 1.2;
      var by = 1.5 + Math.sin(bi / 10 * Math.PI) * -0.5;
      cablePoints.push(bx, by, -22);
      cablePoints.push(bx, by - 0.05, -22.1);
    }
    var cableGeo = new THREE.BufferGeometry();
    cableGeo.setAttribute('position', new THREE.Float32BufferAttribute(cablePoints, 3));
    var cable = new THREE.LineSegments(cableGeo, bridgeMat);
    scene.add(cable);
    objects.push(cable);

    var plankMat2 = new THREE.MeshLambertMaterial({ color: 0x8b6840 });
    for (var bpi = 0; bpi < 8; bpi++) {
      var bpGeo = new THREE.BoxGeometry(1.1, 0.1, 0.8);
      var bp = new THREE.Mesh(bpGeo, plankMat2);
      bp.position.set(-12 + bpi * 1.5 + 0.75, 1.3, -22);
      makeObj(bp);
    }

    // 11. Hidden weapons cache — box crates in undergrowth
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
    var cratePositions = [
      [-20, 0, 10], [-21, 0, 11.5], [-19.5, 0, 12]
    ];
    for (var kc = 0; kc < cratePositions.length; kc++) {
      var kcp = cratePositions[kc];
      var crateGeo = new THREE.BoxGeometry(0.9, 0.7, 0.9);
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(kcp[0], 0.35, kcp[2]);
      crate.rotation.y = kc * 0.4;
      makeObj(crate);
    }

    // 12. Fog effect — large semi-transparent box, low to ground
    var fogMat = new THREE.MeshLambertMaterial({ color: 0x3a5c2a, transparent: true, opacity: 0.18 });
    var fogGeo = new THREE.BoxGeometry(100, 1.2, 100);
    var fogMesh = new THREE.Mesh(fogGeo, fogMat);
    fogMesh.position.set(0, 0.6, 0);
    makeObj(fogMesh);
    fogBox = fogMesh;

    // 13. Flare trip wire — LineSegments across path + emissive sphere
    var wireMat = new THREE.LineBasicMaterial({ color: 0xff4400 });
    var wirePoints = [
      -3, 0.3, 0,
       3, 0.3, 0
    ];
    var wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wirePoints, 3));
    var wire = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(wire);
    objects.push(wire);

    var flareMat = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1.0 });
    var flareGeo = new THREE.SphereGeometry(0.15, 6, 6);
    var flare = new THREE.Mesh(flareGeo, flareMat);
    flare.position.set(-3, 0.3, 0);
    makeObj(flare);

    // 14. Swamp boat wreck — tilted box, half-submerged
    var wreckMat = new THREE.MeshLambertMaterial({ color: 0x3a2e18 });
    var wreckGeo = new THREE.BoxGeometry(5, 0.7, 2.2);
    var wreck = new THREE.Mesh(wreckGeo, wreckMat);
    wreck.position.set(-8, -0.1, -15);
    wreck.rotation.z = 0.35;
    wreck.rotation.y = 0.6;
    makeObj(wreck);

    // 15. Vine curtain — LineSegments hanging from above
    var vineMat = new THREE.LineBasicMaterial({ color: 0x2a5a10 });
    var vinePoints = [];
    for (var vi = 0; vi < 10; vi++) {
      var vx = 16 + vi * 0.5;
      vinePoints.push(vx, 9, -25);
      vinePoints.push(vx + 0.1, 0, -25);
    }
    var vineGeo = new THREE.BufferGeometry();
    vineGeo.setAttribute('position', new THREE.Float32BufferAttribute(vinePoints, 3));
    var vines = new THREE.LineSegments(vineGeo, vineMat);
    scene.add(vines);
    objects.push(vines);

    // 16. Firefly particles — emissive yellow spheres
    var fireflyMat = new THREE.MeshLambertMaterial({ color: 0xffff44, emissive: 0xffdd00, emissiveIntensity: 1.5 });
    var fireflyPositions = [
      [2, 2, -4], [-5, 1.5, 7], [8, 3, -2],
      [-12, 2, -6], [15, 1.8, 3], [0, 2.5, -18],
      [-7, 1.2, 14], [3, 3.5, -10]
    ];
    for (var fi = 0; fi < fireflyPositions.length; fi++) {
      var fp = fireflyPositions[fi];
      var ffGeo = new THREE.SphereGeometry(0.08, 4, 4);
      var ff = new THREE.Mesh(ffGeo, fireflyMat);
      ff.position.set(fp[0], fp[1], fp[2]);
      ff.userData = { baseX: fp[0], baseY: fp[1], baseZ: fp[2], phase: fi * 0.9 };
      makeObj(ff);
      fireflies.push(ff);
    }

    // 17. Radio antenna mast — cylinder + LineSegments antenna
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var mastGeo = new THREE.CylinderGeometry(0.12, 0.15, 10, 6);
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(28, 5, -18);
    makeObj(mast);

    var antennaMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    var antennaPoints = [
      28, 10, -18,
      26, 7, -18,
      28, 10, -18,
      30, 7, -18,
      28, 10, -18,
      28, 7, -16,
      28, 10, -18,
      28, 7, -20
    ];
    var antennaGeo = new THREE.BufferGeometry();
    antennaGeo.setAttribute('position', new THREE.Float32BufferAttribute(antennaPoints, 3));
    var antenna = new THREE.LineSegments(antennaGeo, antennaMat);
    scene.add(antenna);
    objects.push(antenna);
  };

  var update = function(delta) {
    if (!enabled) return;
    time += delta || 0.016;

    // Airboat circles through swamp
    if (airboat) {
      airboatAngle += 0.18 * (delta || 0.016);
      var abRadius = 14;
      airboat.position.x = Math.cos(airboatAngle) * abRadius;
      airboat.position.z = Math.sin(airboatAngle) * abRadius + 5;
      airboat.rotation.y = -airboatAngle - Math.PI / 2;
      // Drain fuel slowly
      if (airboatFuel > 0 && Math.floor(time * 2) % 60 === 0) {
        airboatFuel = Math.max(0, airboatFuel - 1);
        updateHUD();
      }
    }

    // Guerrillas move between trees
    for (var gi = 0; gi < guerrillas.length; gi++) {
      var g = guerrillas[gi];
      var gPhase = time * 0.4 + g.phase;
      var gx = g.baseX + Math.sin(gPhase) * 2.5;
      var gz = g.baseZ + Math.cos(gPhase * 0.7) * 1.8;
      g.body.position.x = gx;
      g.body.position.z = gz;
      g.head.position.x = gx;
      g.head.position.z = gz;
      g.body.rotation.y = Math.sin(gPhase) * 0.5;
      g.head.rotation.y = Math.sin(gPhase + 0.3) * 0.4;
    }

    // Crocodile lurks and snaps (rotation animation)
    if (crocodile) {
      var crocPhase = time * 0.3;
      crocodile.position.x = 10 + Math.sin(crocPhase) * 5;
      crocodile.position.z = -5 + Math.cos(crocPhase * 0.6) * 3;
      crocodile.rotation.y = crocPhase * 0.5;
    }

    // Fog drifts slowly
    if (fogBox) {
      fogBox.position.x = Math.sin(time * 0.05) * 3;
      fogBox.position.z = Math.cos(time * 0.04) * 2;
    }

    // Fireflies drift
    for (var fi = 0; fi < fireflies.length; fi++) {
      var ff = fireflies[fi];
      var ffp = ff.userData.phase;
      ff.position.x = ff.userData.baseX + Math.sin(time * 0.7 + ffp) * 2;
      ff.position.y = ff.userData.baseY + Math.sin(time * 1.1 + ffp * 2) * 0.8;
      ff.position.z = ff.userData.baseZ + Math.cos(time * 0.6 + ffp) * 1.5;
    }

    // Canopy sways
    for (var ci = 0; ci < canopySpheres.length; ci++) {
      var cs = canopySpheres[ci];
      var swayPhase = cs.userData.phase;
      cs.position.y = cs.userData.baseY + Math.sin(time * 0.5 + swayPhase) * 0.2;
      cs.rotation.y = Math.sin(time * 0.3 + swayPhase) * 0.1;
    }
  };

  var reset = function() {
    document.removeEventListener('keydown', handleKeyPress);

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var m = 0; m < obj.material.length; m++) obj.material[m].dispose();
        } else {
          obj.material.dispose();
        }
      }
    }
    objects = [];
    guerrillas = [];
    fireflies = [];
    canopySpheres = [];
    guerrillaGroups = [];

    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
    }
    hudElement = null;
    airboat = null;
    crocodile = null;
    fogBox = null;

    guerrillasNeutralized = 0;
    dockSecured = false;
    airboatFuel = 62;
    time = 0;
  };

  return { init: init, update: update, reset: reset };
}());
