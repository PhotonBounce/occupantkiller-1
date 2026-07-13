window.DustBowl = (function () {
  'use strict';

  var scene, camera, renderer, animationId;
  var clock;
  var objects = [];
  var disposables = [];

  // HUD state
  var hudCanvas, hudCtx, hudVisible;
  var scavengersDown, waterSupply, stormEta;
  var keyDTime;

  // Scene object references for animation
  var dustStormWall;
  var scavengerGroup = [];
  var windmillVanePost;
  var campfireEmissives = [];
  var juryRiggedVehicle;
  var dustParticles;
  var dustParticlePositions;
  var dustParticleBasePositions;

  // ─── helpers ───────────────────────────────────────────────────────────────

  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    objects.push(m);
    disposables.push(geo, mat);
    return m;
  }

  function makeLines(geo, mat) {
    var l = new THREE.LineSegments(geo, mat);
    objects.push(l);
    disposables.push(geo, mat);
    return l;
  }

  function boxGeo(w, h, d) {
    return new THREE.BoxGeometry(w, h, d);
  }

  function cylGeo(rt, rb, h, segs) {
    return new THREE.CylinderGeometry(rt, rb, h, segs || 8);
  }

  function mat(opts) {
    return new THREE.MeshLambertMaterial(opts);
  }

  function group() {
    var g = new THREE.Group();
    objects.push(g);
    return g;
  }

  // ─── build scene ───────────────────────────────────────────────────────────

  function buildScene() {

    // 1. Sand ground
    var groundGeo = boxGeo(200, 0.1, 200);
    var groundMat = mat({ color: 0xc2a04b });
    var ground = makeMesh(groundGeo, groundMat);
    ground.position.set(0, -0.05, 0);
    scene.add(ground);

    // 2. Sand dunes (angled flat boxes at varying heights and positions)
    var duneData = [
      { x: -40, z: -30, rx: 0.3, ry: 0.2, w: 30, h: 6, d: 18 },
      { x:  50, z: -50, rx: -0.2, ry: -0.4, w: 25, h: 4, d: 14 },
      { x: -60, z:  20, rx: 0.15, ry: 0.6, w: 35, h: 8, d: 20 },
      { x:  30, z:  40, rx: -0.25, ry: 0.1, w: 28, h: 5, d: 16 },
      { x:  70, z:  10, rx: 0.1, ry: -0.3, w: 20, h: 3, d: 12 }
    ];
    for (var di = 0; di < duneData.length; di++) {
      var dd = duneData[di];
      var dg = boxGeo(dd.w, dd.h, dd.d);
      var dm = mat({ color: 0xc8a84b });
      var dune = makeMesh(dg, dm);
      dune.position.set(dd.x, dd.h / 2 - 1, dd.z);
      dune.rotation.x = dd.rx;
      dune.rotation.y = dd.ry;
      scene.add(dune);
    }

    // 3. Rusted car wreck 1
    var carGrp1 = group();
    var chassis1 = makeMesh(boxGeo(8, 2, 4), mat({ color: 0x5c3317 }));
    chassis1.position.set(0, 1, 0);
    carGrp1.add(chassis1);
    var wheelPositions1 = [[-3, 0, -2], [3, 0, -2], [-3, 0, 2], [3, 0, 2]];
    for (var wi = 0; wi < wheelPositions1.length; wi++) {
      var wp = wheelPositions1[wi];
      var wheel = makeMesh(cylGeo(0.8, 0.8, 0.5, 10), mat({ color: 0x2a2a2a }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp[0], wp[1], wp[2]);
      carGrp1.add(wheel);
    }
    carGrp1.position.set(-20, 0, -10);
    carGrp1.rotation.y = 0.5;
    scene.add(carGrp1);

    // 4. Rusted car wreck 2
    var carGrp2 = group();
    var chassis2 = makeMesh(boxGeo(9, 2.5, 4.5), mat({ color: 0x6b3a1f }));
    chassis2.position.set(0, 1.25, 0);
    carGrp2.add(chassis2);
    var wheelPositions2 = [[-3.5, 0, -2.2], [3.5, 0, -2.2], [-3.5, 0, 2.2], [3.5, 0, 2.2]];
    for (var wi2 = 0; wi2 < wheelPositions2.length; wi2++) {
      var wp2 = wheelPositions2[wi2];
      var wheel2 = makeMesh(cylGeo(0.9, 0.9, 0.6, 10), mat({ color: 0x1a1a1a }));
      wheel2.rotation.z = Math.PI / 2;
      wheel2.position.set(wp2[0], wp2[1], wp2[2]);
      carGrp2.add(wheel2);
    }
    carGrp2.position.set(25, 0, 15);
    carGrp2.rotation.y = -0.3;
    scene.add(carGrp2);

    // 5. Scavenger gang (6 figures in rags)
    var scavColors = [0x4a3728, 0x3d2e1e, 0x5a4030, 0x2e2318, 0x4d3520, 0x3a2a18];
    var scavPositions = [
      [-35, 0, 5], [-37, 0, 2], [-33, 0, 8],
      [-39, 0, 11], [-31, 0, 0], [-36, 0, -3]
    ];
    for (var si = 0; si < 6; si++) {
      var sg = group();
      var sbody = makeMesh(boxGeo(1.2, 2, 0.6), mat({ color: scavColors[si] }));
      sbody.position.set(0, 1, 0);
      sg.add(sbody);
      var shead = makeMesh(new THREE.SphereGeometry(0.5, 8, 8), mat({ color: 0x8b6344 }));
      disposables.push(shead.geometry, shead.material);
      shead.position.set(0, 2.5, 0);
      sg.add(shead);
      sg.position.set(scavPositions[si][0], 0, scavPositions[si][2]);
      scavengerGroup.push(sg);
      scene.add(sg);
    }

    // 6. Wasteland settler defenders (4 figures)
    var defPositions = [[-10, 0, 5], [-12, 0, 8], [-8, 0, 3], [-14, 0, 2]];
    for (var dfi = 0; dfi < 4; dfi++) {
      var dfg = group();
      var dfbody = makeMesh(boxGeo(1.3, 2.2, 0.7), mat({ color: 0x5c7a3e }));
      dfbody.position.set(0, 1.1, 0);
      dfg.add(dfbody);
      var dfhead = makeMesh(new THREE.SphereGeometry(0.52, 8, 8), mat({ color: 0x7a5c3e }));
      disposables.push(dfhead.geometry, dfhead.material);
      dfhead.position.set(0, 2.7, 0);
      dfg.add(dfhead);
      dfg.position.set(defPositions[dfi][0], 0, defPositions[dfi][2]);
      scene.add(dfg);
    }

    // 7. Makeshift wall fortification (stacked box panels)
    var wallData = [
      { x: -16, z: 4, ry: 0, w: 10, h: 3, d: 0.5 },
      { x: -16, z: 4, ry: 0, w: 10, h: 1.5, d: 0.5, yo: 3 },
      { x: -21, z: 7, ry: Math.PI / 2, w: 6, h: 3, d: 0.5 },
      { x: -11, z: 7, ry: Math.PI / 2, w: 6, h: 3, d: 0.5 }
    ];
    for (var wdi = 0; wdi < wallData.length; wdi++) {
      var wd = wallData[wdi];
      var wm = makeMesh(boxGeo(wd.w, wd.h, wd.d), mat({ color: 0x8b7355 }));
      wm.position.set(wd.x, (wd.h / 2) + (wd.yo || 0), wd.z);
      wm.rotation.y = wd.ry;
      scene.add(wm);
    }

    // 8. Dust storm cloud wall (large semi-transparent box, approaching from -Z)
    var dstormGeo = boxGeo(200, 40, 10);
    var dstormMat = new THREE.MeshLambertMaterial({
      color: 0xc8a060,
      transparent: true,
      opacity: 0.75
    });
    dustStormWall = new THREE.Mesh(dstormGeo, dstormMat);
    dustStormWall.position.set(0, 20, -95);
    objects.push(dustStormWall);
    disposables.push(dstormGeo, dstormMat);
    scene.add(dustStormWall);

    // 9. Abandoned gas station
    var gasStation = group();
    var gsBuilding = makeMesh(boxGeo(10, 6, 8), mat({ color: 0x8c7a6a }));
    gsBuilding.position.set(0, 3, 0);
    gasStation.add(gsBuilding);
    var gsRoof = makeMesh(boxGeo(12, 0.3, 10), mat({ color: 0x6a5a4a }));
    gsRoof.position.set(0, 6.15, 0);
    gasStation.add(gsRoof);
    var gsPump = makeMesh(cylGeo(0.4, 0.4, 3, 8), mat({ color: 0x4a4a4a }));
    gsPump.position.set(6, 1.5, 0);
    gasStation.add(gsPump);
    var gsPumpTop = makeMesh(boxGeo(1.2, 1.5, 0.8), mat({ color: 0x3a6a3a }));
    gsPumpTop.position.set(6, 3.75, 0);
    gasStation.add(gsPumpTop);
    gasStation.position.set(35, 0, -15);
    scene.add(gasStation);

    // 10. Windmill
    var windmillGrp = group();
    var wmTower = makeMesh(boxGeo(1.5, 14, 1.5), mat({ color: 0x8b7355 }));
    wmTower.position.set(0, 7, 0);
    windmillGrp.add(wmTower);
    windmillVanePost = makeMesh(cylGeo(0.25, 0.25, 2, 8), mat({ color: 0x5a4a3a }));
    windmillVanePost.rotation.z = Math.PI / 2;
    windmillVanePost.position.set(0, 14, 0);
    windmillGrp.add(windmillVanePost);
    // Windmill blades via LineSegments
    var bladePositions = [];
    for (var bi = 0; bi < 4; bi++) {
      var angle = (bi / 4) * Math.PI * 2;
      bladePositions.push(0, 0, 0);
      bladePositions.push(Math.cos(angle) * 4, Math.sin(angle) * 4, 0);
    }
    var bladeGeo = new THREE.BufferGeometry();
    bladeGeo.setAttribute('position', new THREE.Float32BufferAttribute(bladePositions, 3));
    var bladeMat = new THREE.LineBasicMaterial({ color: 0x5a4a3a });
    var blades = new THREE.LineSegments(bladeGeo, bladeMat);
    blades.position.set(0, 14, 0);
    windmillGrp.add(blades);
    objects.push(blades);
    disposables.push(bladeGeo, bladeMat);
    windmillVanePost.add(blades);
    windmillGrp.position.set(-55, 0, -20);
    scene.add(windmillGrp);

    // 11. Water tower
    var waterTowerGrp = group();
    var wtTank = makeMesh(cylGeo(3.5, 3.5, 5, 10), mat({ color: 0x6b5a3a }));
    wtTank.position.set(0, 13, 0);
    waterTowerGrp.add(wtTank);
    var wtLegAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (var wli = 0; wli < 4; wli++) {
      var wtLeg = makeMesh(cylGeo(0.2, 0.2, 10, 6), mat({ color: 0x5a4a2a }));
      wtLeg.position.set(
        Math.cos(wtLegAngles[wli]) * 2.5,
        5.5,
        Math.sin(wtLegAngles[wli]) * 2.5
      );
      waterTowerGrp.add(wtLeg);
    }
    waterTowerGrp.position.set(0, 0, 30);
    scene.add(waterTowerGrp);

    // 12. Supply cache (5 stacked box crates)
    var crateColors = [0x8b6a3a, 0x7a5c30, 0x9a7a48, 0x6a4e28, 0x8b6a3a];
    var crateData = [
      { x: 0, y: 0.75, z: 0 }, { x: 1.8, y: 0.75, z: 0 },
      { x: 0, y: 0.75, z: 1.8 }, { x: 0.9, y: 2.25, z: 0.9 },
      { x: 0.9, y: 3.75, z: 0.9 }
    ];
    var supplyGrp = group();
    for (var ci = 0; ci < 5; ci++) {
      var crate = makeMesh(boxGeo(1.5, 1.5, 1.5), mat({ color: crateColors[ci] }));
      crate.position.set(crateData[ci].x, crateData[ci].y, crateData[ci].z);
      supplyGrp.add(crate);
    }
    supplyGrp.position.set(-5, 0, 25);
    scene.add(supplyGrp);

    // 13. Campfire (emissive orange/red sphere cluster)
    var campGrp = group();
    var fireColors = [0xff4400, 0xff6600, 0xff2200, 0xff8800, 0xffaa00];
    var fireOffsets = [
      [0, 0.3, 0], [0.3, 0, 0.2], [-0.3, 0, -0.2],
      [0.1, 0.6, 0.1], [-0.1, 0.5, -0.1]
    ];
    for (var fci = 0; fci < 5; fci++) {
      var fireSphereGeo = new THREE.SphereGeometry(0.25 + Math.random() * 0.15, 8, 8);
      var fireSphereMat = new THREE.MeshLambertMaterial({
        color: fireColors[fci],
        emissive: fireColors[fci],
        emissiveIntensity: 1.0
      });
      var fireSphere = new THREE.Mesh(fireSphereGeo, fireSphereMat);
      fireSphere.position.set(
        fireOffsets[fci][0], fireOffsets[fci][1] + 0.5, fireOffsets[fci][2]
      );
      campGrp.add(fireSphere);
      campfireEmissives.push(fireSphereMat);
      objects.push(fireSphere);
      disposables.push(fireSphereGeo, fireSphereMat);
    }
    // Log base
    var log1 = makeMesh(boxGeo(1.5, 0.2, 0.3), mat({ color: 0x4a2e0e }));
    log1.position.set(0, 0.1, 0);
    campGrp.add(log1);
    var log2 = makeMesh(boxGeo(0.3, 0.2, 1.5), mat({ color: 0x3a2008 }));
    log2.position.set(0, 0.1, 0);
    campGrp.add(log2);
    campGrp.position.set(-3, 0, 18);
    scene.add(campGrp);

    // 14. Watchtower
    var watchGrp = group();
    var wtBase = makeMesh(boxGeo(3, 12, 3), mat({ color: 0x7a6040 }));
    wtBase.position.set(0, 6, 0);
    watchGrp.add(wtBase);
    var wtPlatform = makeMesh(boxGeo(5, 0.4, 5), mat({ color: 0x6a5030 }));
    wtPlatform.position.set(0, 12.2, 0);
    watchGrp.add(wtPlatform);
    var wtRailing = makeMesh(boxGeo(4.8, 1.2, 0.2), mat({ color: 0x5a4020 }));
    wtRailing.position.set(0, 12.8, 2.4);
    watchGrp.add(wtRailing);
    watchGrp.position.set(10, 0, -5);
    scene.add(watchGrp);

    // 15. Jury-rigged vehicle (box body + cylinder wheels, patrols)
    var jrvGrp = group();
    var jrvBody = makeMesh(boxGeo(6, 2, 3), mat({ color: 0x4a3a20 }));
    jrvBody.position.set(0, 1.2, 0);
    jrvGrp.add(jrvBody);
    var jrvRoll = makeMesh(boxGeo(4, 1, 3.4), mat({ color: 0x3a2a10 }));
    jrvRoll.position.set(0, 2.6, 0);
    jrvGrp.add(jrvRoll);
    var jrvWheelPos = [[-2.5, 0.5, -1.7], [2.5, 0.5, -1.7], [-2.5, 0.5, 1.7], [2.5, 0.5, 1.7]];
    for (var jrwi = 0; jrwi < 4; jrwi++) {
      var jrw = jrvWheelPos[jrwi];
      var jrvWheel = makeMesh(cylGeo(0.7, 0.7, 0.5, 10), mat({ color: 0x1a1a1a }));
      jrvWheel.rotation.z = Math.PI / 2;
      jrvWheel.position.set(jrw[0], jrw[1], jrw[2]);
      jrvGrp.add(jrvWheel);
    }
    juryRiggedVehicle = jrvGrp;
    juryRiggedVehicle.position.set(20, 0, 0);
    scene.add(juryRiggedVehicle);

    // 16. Skull pile (sphere clusters)
    var skullGrp = group();
    var skullData = [
      [0, 0.3, 0], [0.6, 0.25, 0.3], [-0.5, 0.25, -0.4],
      [0.2, 0.6, 0.1], [-0.3, 0.55, 0.3], [0.4, 0.85, -0.1],
      [0.8, 0.25, -0.2], [-0.8, 0.25, 0.5]
    ];
    for (var ski = 0; ski < skullData.length; ski++) {
      var skullSphGeo = new THREE.SphereGeometry(0.22, 8, 8);
      var skullSph = new THREE.Mesh(skullSphGeo, mat({ color: 0xe8dcc8 }));
      skullSph.position.set(skullData[ski][0], skullData[ski][1], skullData[ski][2]);
      skullGrp.add(skullSph);
      objects.push(skullSph);
      disposables.push(skullSphGeo);
    }
    skullGrp.position.set(18, 0, -8);
    scene.add(skullGrp);

    // 17. Dust particle swirl (LineSegments)
    var particleCount = 120;
    var pPositions = new Float32Array(particleCount * 2 * 3);
    dustParticleBasePositions = new Float32Array(particleCount * 3);
    for (var pi = 0; pi < particleCount; pi++) {
      var pAngle = (pi / particleCount) * Math.PI * 2 * 5;
      var pRadius = 15 + (pi / particleCount) * 25;
      var px = Math.cos(pAngle) * pRadius;
      var pz = Math.sin(pAngle) * pRadius;
      var py = (pi / particleCount) * 12;
      dustParticleBasePositions[pi * 3] = px;
      dustParticleBasePositions[pi * 3 + 1] = py;
      dustParticleBasePositions[pi * 3 + 2] = pz;
      // line segment: point to offset point
      pPositions[pi * 6] = px;
      pPositions[pi * 6 + 1] = py;
      pPositions[pi * 6 + 2] = pz;
      pPositions[pi * 6 + 3] = px + 1.0;
      pPositions[pi * 6 + 4] = py + 0.3;
      pPositions[pi * 6 + 5] = pz + 1.0;
    }
    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
    dustParticlePositions = particleGeo.attributes.position;
    var particleMat = new THREE.LineBasicMaterial({ color: 0xd4a050, opacity: 0.6, transparent: true });
    dustParticles = makeLines(particleGeo, particleMat);
    dustParticles.position.set(0, 1, 0);
    scene.add(dustParticles);

    // Lighting
    var ambient = new THREE.AmbientLight(0xf5d78e, 0.6);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xff9944, 1.0);
    sun.position.set(60, 50, -30);
    scene.add(sun);
    var dustGlow = new THREE.PointLight(0xc8a060, 0.4, 80);
    dustGlow.position.set(0, 10, -80);
    scene.add(dustGlow);
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 280;
    hudCanvas.height = 110;
    hudCanvas.style.position = 'fixed';
    hudCanvas.style.top = '16px';
    hudCanvas.style.right = '16px';
    hudCanvas.style.zIndex = '100';
    hudCanvas.style.pointerEvents = 'none';
    document.body.appendChild(hudCanvas);
    hudCtx = hudCanvas.getContext('2d');
    hudVisible = true;
    scavengersDown = 0;
    waterSupply = 45;
    stormEta = 120;
  }

  function drawHUD(elapsed) {
    if (!hudVisible || !hudCtx) { return; }
    stormEta = Math.max(0, 120 - Math.floor(elapsed));
    var etaMin = Math.floor(stormEta / 60);
    var etaSec = stormEta % 60;
    var etaStr = etaMin + 'MIN ' + (etaSec < 10 ? '0' : '') + etaSec + 'SEC';

    var c = hudCtx;
    c.clearRect(0, 0, 280, 110);
    c.fillStyle = 'rgba(30,20,10,0.78)';
    c.beginPath();
    c.roundRect(0, 0, 280, 110, 8);
    c.fill();
    c.strokeStyle = 'rgba(200,160,60,0.7)';
    c.lineWidth = 1.5;
    c.stroke();

    c.font = 'bold 13px monospace';
    c.fillStyle = '#f0c040';
    c.fillText('SCAVENGERS DOWN: ' + scavengersDown + '/6', 14, 30);
    c.fillStyle = '#60d8ff';
    c.fillText('WATER SUPPLY: ' + waterSupply + 'L', 14, 58);
    c.fillStyle = (stormEta < 30) ? '#ff4444' : '#ff9944';
    c.fillText('STORM ETA: ' + etaStr, 14, 86);
    c.fillStyle = 'rgba(200,160,60,0.45)';
    c.font = '10px monospace';
    c.fillText('[D+B] toggle HUD', 14, 104);
  }

  // ─── input ─────────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    if (key === 'D') {
      keyDTime = Date.now();
    } else if (key === 'B') {
      if (keyDTime && (Date.now() - keyDTime) <= 400) {
        hudVisible = !hudVisible;
        if (hudCanvas) {
          hudCanvas.style.display = hudVisible ? 'block' : 'none';
        }
        keyDTime = 0;
      }
    }
  }

  // ─── animation ─────────────────────────────────────────────────────────────

  function update() {
    if (!scene) { return; }
    var delta = clock.getDelta();
    var elapsed = clock.elapsedTime;

    // Dust storm wall advances from -Z toward +Z
    if (dustStormWall && dustStormWall.position.z < 100) {
      dustStormWall.position.z += delta * 2.5;
    }

    // Scavengers charge toward defenders (from ~x=-35 toward x=-10)
    for (var si = 0; si < scavengerGroup.length; si++) {
      var sg = scavengerGroup[si];
      if (sg.position.x < -12) {
        sg.position.x += delta * 3.5;
        sg.position.z += Math.sin(elapsed * 3 + si) * delta * 0.4;
      }
    }

    // Windmill vanes rotate
    if (windmillVanePost) {
      windmillVanePost.rotation.x += delta * 1.5;
    }

    // Campfire flickers emissive intensity
    for (var fi = 0; fi < campfireEmissives.length; fi++) {
      campfireEmissives[fi].emissiveIntensity =
        0.6 + Math.sin(elapsed * 8 + fi * 1.2) * 0.4 + Math.random() * 0.2;
    }

    // Jury-rigged vehicle patrols perimeter (circular orbit)
    if (juryRiggedVehicle) {
      var jrvAngle = elapsed * 0.5;
      var jrvRadius = 22;
      juryRiggedVehicle.position.x = Math.cos(jrvAngle) * jrvRadius;
      juryRiggedVehicle.position.z = Math.sin(jrvAngle) * jrvRadius;
      juryRiggedVehicle.rotation.y = -jrvAngle - Math.PI / 2;
    }

    // Dust particles swirl
    if (dustParticles && dustParticlePositions && dustParticleBasePositions) {
      var count = dustParticleBasePositions.length / 3;
      for (var dpi = 0; dpi < count; dpi++) {
        var bx = dustParticleBasePositions[dpi * 3];
        var by = dustParticleBasePositions[dpi * 3 + 1];
        var bz = dustParticleBasePositions[dpi * 3 + 2];
        var swirlAngle = elapsed * 0.8 + dpi * 0.05;
        var npx = bx * Math.cos(swirlAngle * 0.1) - bz * Math.sin(swirlAngle * 0.1);
        var npz = bx * Math.sin(swirlAngle * 0.1) + bz * Math.cos(swirlAngle * 0.1);
        var npy = by + Math.sin(elapsed * 1.5 + dpi) * 0.5;
        dustParticlePositions.setXYZ(dpi * 2, npx, npy, npz);
        dustParticlePositions.setXYZ(dpi * 2 + 1, npx + 1.2, npy + 0.4, npz + 1.2);
      }
      dustParticlePositions.needsUpdate = true;
    }

    drawHUD(elapsed);
    renderer.render(scene, camera);
  }

  // ─── public API ────────────────────────────────────────────────────────────

  function init(cfg) {
    cfg = cfg || {};
    scene = cfg.scene || new THREE.Scene();
    scene.background = new THREE.Color(0x8b6a30);
    scene.fog = new THREE.Fog(0xc8a060, 40, 130);

    camera = cfg.camera || new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 300
    );
    camera.position.set(0, 18, 55);
    camera.lookAt(0, 2, 0);

    renderer = cfg.renderer;
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
    }

    clock = new THREE.Clock();
    keyDTime = 0;

    buildScene();
    buildHUD();

    window.addEventListener('keydown', onKeyDown);

    (function loop() {
      animationId = requestAnimationFrame(loop);
      update();
    }());
  }

  function reset() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    window.removeEventListener('keydown', onKeyDown);

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj && obj.parent) { obj.parent.remove(obj); }
    }
    for (var j = 0; j < disposables.length; j++) {
      if (disposables[j] && disposables[j].dispose) {
        disposables[j].dispose();
      }
    }

    objects = [];
    disposables = [];
    scavengerGroup = [];
    campfireEmissives = [];
    dustStormWall = null;
    windmillVanePost = null;
    juryRiggedVehicle = null;
    dustParticles = null;
    dustParticlePositions = null;
    dustParticleBasePositions = null;

    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
      hudCanvas = null;
      hudCtx = null;
    }

    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }

    scene = null;
    camera = null;
    clock = null;
  }

  return { init: init, update: update, reset: reset };

}());
