window.PlagueVillage = (function() {
  'use strict';

  // State
  var state = {
    active: false,
    antidotesDelivered: 0,
    infectedNeutralized: 0,
    villageObjects: [],
    keybindBuffer: '',
    keybindTimeout: null,
    hudElement: null,
    time: 0,
    camera: null,
    scene: null
  };

  // Colors - medieval plague palette
  var colors = {
    stoneBrown: 0x6b5344,
    darkStone: 0x4a3f38,
    thatch: 0x8b6f47,
    darkGreen: 0x1a3a1a,
    toxicGreen: 0x4da64d,
    sicklyYellow: 0xb8a641,
    wood: 0x5c4033,
    darkWood: 0x3d2817,
    plague: 0x2d5016,
    fire: 0xff6b1a,
    brightGreen: 0x66ff00,
    darkGray: 0x2a2a2a,
    lightStone: 0x8b7355
  };

  // Create thatched cottage
  function createCottage(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Walls
    var wallGeo = new THREE.BoxGeometry(6, 5, 6);
    var wallMat = new THREE.MeshStandardMaterial({ color: colors.stoneBrown });
    var walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 2.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Roof
    var roofGeo = new THREE.ConeGeometry(5, 4, 4);
    var roofMat = new THREE.MeshStandardMaterial({ color: colors.thatch });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 6;
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Door frame
    var doorFrameGeo = new THREE.BoxGeometry(2, 3, 0.2);
    var doorFrameMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorFrame.position.set(0, 1.5, 3.1);
    doorFrame.castShadow = true;
    group.add(doorFrame);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create village well
  function createWell(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Well shaft
    var shaftGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
    var shaftMat = new THREE.MeshStandardMaterial({ color: colors.darkStone });
    var shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = -4;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Crossbeam
    var beamGeo = new THREE.BoxGeometry(5, 0.4, 0.4);
    var beamMat = new THREE.MeshStandardMaterial({ color: colors.wood });
    var beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 1;
    beam.castShadow = true;
    group.add(beam);

    // Bucket
    var bucketGeo = new THREE.CylinderGeometry(0.8, 0.8, 1, 8);
    var bucketMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var bucket = new THREE.Mesh(bucketGeo, bucketMat);
    bucket.position.set(2.5, 0, 0);
    bucket.castShadow = true;
    group.add(bucket);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create church/chapel
  function createChapel(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Main structure
    var bodyGeo = new THREE.BoxGeometry(4, 8, 5);
    var bodyMat = new THREE.MeshStandardMaterial({ color: colors.stoneBrown });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 4;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Roof
    var roofGeo = new THREE.ConeGeometry(3.5, 5, 4);
    var roofMat = new THREE.MeshStandardMaterial({ color: colors.thatch });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 10;
    roof.castShadow = true;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Steeple top
    var steepleGeo = new THREE.ConeGeometry(1.5, 4, 8);
    var steeplyMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var steeple = new THREE.Mesh(steepleGeo, steeplyMat);
    steeple.position.y = 13;
    steeple.castShadow = true;
    group.add(steeple);

    // Cross - vertical
    var crossVGeo = new THREE.BoxGeometry(0.2, 3, 0.2);
    var crossMat = new THREE.MeshStandardMaterial({ color: colors.lightStone });
    var crossV = new THREE.Mesh(crossVGeo, crossMat);
    crossV.position.y = 13;
    crossV.castShadow = true;
    group.add(crossV);

    // Cross - horizontal
    var crossHGeo = new THREE.BoxGeometry(1.8, 0.2, 0.2);
    var crossH = new THREE.Mesh(crossHGeo, crossMat);
    crossH.position.y = 12.2;
    crossH.castShadow = true;
    group.add(crossH);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create cobblestone plaza
  function createPlaza(x, y, z, size, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Ground plane
    var groundGeo = new THREE.BoxGeometry(size, 0.3, size);
    var groundMat = new THREE.MeshStandardMaterial({ color: colors.darkGray });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    group.add(ground);

    // Grid lines for cobblestones
    var material = new THREE.LineBasicMaterial({ color: colors.lightStone, linewidth: 1 });
    var geometry = new THREE.BufferGeometry();
    var points = [];
    var step = 2;
    for (var i = -size / 2; i <= size / 2; i += step) {
      points.push(new THREE.Vector3(i, 0.2, -size / 2));
      points.push(new THREE.Vector3(i, 0.2, size / 2));
      points.push(new THREE.Vector3(-size / 2, 0.2, i));
      points.push(new THREE.Vector3(size / 2, 0.2, i));
    }
    geometry.setFromPoints(points);
    var lines = new THREE.LineSegments(geometry, material);
    group.add(lines);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create wooden stocks
  function createStocks(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Frame
    var frameGeo = new THREE.BoxGeometry(3, 1.5, 0.4);
    var frameMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    // Holes - represented by circles of lines
    var holeGeo = new THREE.BufferGeometry();
    var holePoints = [];
    var segments = 8;
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < segments; j++) {
        var angle = (j / segments) * Math.PI * 2;
        var x1 = (i - 0.5) * 1.5 + Math.cos(angle) * 0.3;
        var z1 = Math.sin(angle) * 0.3;
        holePoints.push(new THREE.Vector3(x1, 0, z1));
        var nextAngle = ((j + 1) % segments / segments) * Math.PI * 2;
        var x2 = (i - 0.5) * 1.5 + Math.cos(nextAngle) * 0.3;
        var z2 = Math.sin(nextAngle) * 0.3;
        holePoints.push(new THREE.Vector3(x2, 0, z2));
      }
    }
    holeGeo.setFromPoints(holePoints);
    var holeMat = new THREE.LineBasicMaterial({ color: colors.darkGray });
    var holes = new THREE.LineSegments(holeGeo, holeMat);
    group.add(holes);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create plague doctor figure
  function createPlagueDoctor(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData.doctorWalkingPhase = 0;

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.8, 2, 0.6);
    var bodyMat = new THREE.MeshStandardMaterial({ color: colors.darkGray });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.6, 0.7, 0.6);
    var headMat = new THREE.MeshStandardMaterial({ color: colors.darkGray });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.2;
    head.castShadow = true;
    group.add(head);

    // Beak mask
    var beakGeo = new THREE.ConeGeometry(0.3, 1.2, 6);
    var beakMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 2.2, 0.5);
    beak.rotation.z = Math.PI / 2;
    beak.castShadow = true;
    group.add(beak);

    // Hat
    var hatGeo = new THREE.ConeGeometry(0.5, 0.8, 8);
    var hatMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 2.7;
    hat.castShadow = true;
    group.add(hat);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create quarantine barrier rope
  function createQuarantineBarrier(x1, y1, z1, x2, y2, z2, scene) {
    var group = new THREE.Group();

    var geometry = new THREE.BufferGeometry();
    var points = [];
    var segments = 20;
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var px = x1 + (x2 - x1) * t;
      var py = y1 + (y2 - y1) * t + Math.sin(t * Math.PI * 2) * 0.3;
      var pz = z1 + (z2 - z1) * t;
      points.push(new THREE.Vector3(px, py, pz));
    }
    geometry.setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: colors.sicklyYellow, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);
    group.add(line);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create mass grave pit
  function createGravePit(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Pit depression
    var pitGeo = new THREE.BoxGeometry(8, 3, 8);
    var pitMat = new THREE.MeshStandardMaterial({ color: colors.darkStone });
    var pit = new THREE.Mesh(pitGeo, pitMat);
    pit.position.y = -1.5;
    pit.receiveShadow = true;
    group.add(pit);

    // Markers - simple crosses
    for (var i = 0; i < 4; i++) {
      var xOff = (i % 2 - 0.5) * 3;
      var zOff = (Math.floor(i / 2) - 0.5) * 3;

      var vGeo = new THREE.BoxGeometry(0.2, 1.5, 0.2);
      var vMat = new THREE.MeshStandardMaterial({ color: colors.lightStone });
      var v = new THREE.Mesh(vGeo, vMat);
      v.position.set(xOff, 0.5, zOff);
      v.castShadow = true;
      group.add(v);

      var hGeo = new THREE.BoxGeometry(1, 0.2, 0.2);
      var h = new THREE.Mesh(hGeo, vMat);
      h.position.set(xOff, 1.2, zOff);
      h.castShadow = true;
      group.add(h);
    }

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create burning pyre
  function createPyre(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData.firePhase = Math.random() * Math.PI * 2;

    // Wood pile
    for (var i = 0; i < 3; i++) {
      var logGeo = new THREE.BoxGeometry(2, 0.3, 0.3);
      var logMat = new THREE.MeshStandardMaterial({ color: colors.wood });
      var log = new THREE.Mesh(logGeo, logMat);
      log.position.y = i * 0.4;
      log.rotation.y = (i % 2) * Math.PI / 4;
      log.castShadow = true;
      group.add(log);
    }

    // Fire sphere
    var fireSphereGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var fireSphereMat = new THREE.MeshStandardMaterial({
      color: colors.fire,
      emissive: colors.fire,
      emissiveIntensity: 0.8
    });
    var fireSphere = new THREE.Mesh(fireSphereGeo, fireSphereMat);
    fireSphere.position.y = 1.5;
    fireSphere.castShadow = true;
    group.userData.fireSphere = fireSphere;
    group.add(fireSphere);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create rat cluster
  function createRatCluster(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData.ratScatterPhase = 0;

    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var offsetX = Math.cos(angle) * 0.8;
      var offsetZ = Math.sin(angle) * 0.8;

      var ratGeo = new THREE.SphereGeometry(0.2, 6, 6);
      var ratMat = new THREE.MeshStandardMaterial({ color: colors.darkGray });
      var rat = new THREE.Mesh(ratGeo, ratMat);
      rat.position.set(offsetX, 0.2, offsetZ);
      rat.castShadow = true;
      group.add(rat);
    }

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create infected well
  function createInfectedWell(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Poisoned water shaft
    var waterGeo = new THREE.CylinderGeometry(1.8, 1.8, 6, 12);
    var waterMat = new THREE.MeshStandardMaterial({
      color: colors.toxicGreen,
      emissive: colors.toxicGreen,
      emissiveIntensity: 0.5
    });
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = -3;
    water.receiveShadow = true;
    group.userData.waterMesh = water;
    group.add(water);

    // Warning signs
    var signGeo = new THREE.BoxGeometry(1.2, 1, 0.1);
    var signMat = new THREE.MeshStandardMaterial({ color: colors.sicklyYellow });
    var sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(2, 0, 0);
    sign.rotation.y = Math.PI / 4;
    sign.castShadow = true;
    group.add(sign);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create medical tent
  function createMedicalTent(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Tent body
    var tentGeo = new THREE.BoxGeometry(4, 3, 3);
    var tentMat = new THREE.MeshStandardMaterial({ color: colors.lightStone });
    var tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.y = 1.5;
    tent.castShadow = true;
    tent.receiveShadow = true;
    group.add(tent);

    // Red cross - vertical
    var crossVGeo = new THREE.BoxGeometry(0.4, 1.5, 0.1);
    var crossMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var crossV = new THREE.Mesh(crossVGeo, crossMat);
    crossV.position.y = 2;
    crossV.castShadow = true;
    group.add(crossV);

    // Red cross - horizontal
    var crossHGeo = new THREE.BoxGeometry(1.5, 0.4, 0.1);
    var crossH = new THREE.Mesh(crossHGeo, crossMat);
    crossH.position.y = 2;
    crossH.castShadow = true;
    group.add(crossH);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create supply crate
  function createSupplyCrate(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Crate base
    var crateGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var crateMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.y = 0.75;
    crate.castShadow = true;
    group.add(crate);

    // Green cross - vertical
    var crossVGeo = new THREE.BoxGeometry(0.2, 1.2, 0.05);
    var crossMat = new THREE.MeshStandardMaterial({ color: colors.brightGreen });
    var crossV = new THREE.Mesh(crossVGeo, crossMat);
    crossV.position.y = 1.5;
    crossV.castShadow = true;
    group.add(crossV);

    // Green cross - horizontal
    var crossHGeo = new THREE.BoxGeometry(1.2, 0.2, 0.05);
    var crossH = new THREE.Mesh(crossHGeo, crossMat);
    crossH.position.y = 1.5;
    crossH.castShadow = true;
    group.add(crossH);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create crow on post
  function createCrowOnPost(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData.crowHopPhase = Math.random() * Math.PI * 2;

    // Post
    var postGeo = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
    var postMat = new THREE.MeshStandardMaterial({ color: colors.wood });
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 1.5;
    post.castShadow = true;
    group.add(post);

    // Bird body
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
    var bodyMat = new THREE.MeshStandardMaterial({ color: colors.darkGray });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 3.2;
    body.castShadow = true;
    group.userData.crowBody = body;
    group.add(body);

    // Bird head
    var headGeo = new THREE.SphereGeometry(0.15, 6, 6);
    var head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0.15, 3.5, 0);
    head.castShadow = true;
    group.add(head);

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create abandoned market stall
  function createMarketStall(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Frame
    var frameGeo = new THREE.BoxGeometry(3, 3, 1.5);
    var frameMat = new THREE.MeshStandardMaterial({ color: colors.wood });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 1.5;
    frame.castShadow = true;
    group.add(frame);

    // Goods on shelf
    for (var i = 0; i < 6; i++) {
      var goodGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var goodMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? colors.sicklyYellow : colors.toxicGreen
      });
      var good = new THREE.Mesh(goodGeo, goodMat);
      good.position.set((i - 2.5) * 0.5, 2.5, 0);
      good.castShadow = true;
      group.add(good);
    }

    scene.add(group);
    state.villageObjects.push(group);
    return group;
  }

  // Create HUD
  function createHUD() {
    var hud = document.createElement('div');
    hud.id = 'plague-village-hud';
    hud.style.cssText = 'position:fixed;top:20px;left:20px;color:#4da64d;font-family:monospace;font-size:16px;background:rgba(0,0,0,0.7);padding:15px;border:2px solid #4da64d;z-index:1000;';
    hud.innerHTML = 'ANTIDOTES DELIVERED: 0/6<br>INFECTED NEUTRALIZED: 0<br>VILLAGE SAVED: NO<br><br><span style="font-size:12px;color:#b8a641;">Press P+V to toggle</span>';
    document.body.appendChild(hud);
    state.hudElement = hud;
  }

  // Update HUD
  function updateHUD() {
    if (state.hudElement) {
      var saved = state.antidotesDelivered >= 6 && state.infectedNeutralized >= 0 ? 'YES' : 'NO';
      state.hudElement.innerHTML = 'ANTIDOTES DELIVERED: ' + state.antidotesDelivered + '/6<br>' +
        'INFECTED NEUTRALIZED: ' + state.infectedNeutralized + '<br>' +
        'VILLAGE SAVED: ' + saved + '<br><br>' +
        '<span style="font-size:12px;color:#b8a641;">Press P+V to toggle</span>';
    }
  }

  // Keybind handler
  function handleKeyPress(event) {
    if (!state.active) return;

    var key = event.key.toUpperCase();
    if (key === 'P' || key === 'V') {
      state.keybindBuffer += key;

      if (state.keybindTimeout) {
        clearTimeout(state.keybindTimeout);
      }

      if (state.keybindBuffer.length >= 2) {
        if (state.keybindBuffer.slice(-2) === 'PV') {
          toggle();
          state.keybindBuffer = '';
        } else if (state.keybindBuffer.length > 2) {
          state.keybindBuffer = state.keybindBuffer.slice(-2);
        }
      }

      state.keybindTimeout = setTimeout(function() {
        state.keybindBuffer = '';
      }, 400);
    }
  }

  // Toggle visibility
  function toggle() {
    if (state.hudElement) {
      state.hudElement.style.display = state.hudElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  // Init function
  function init(scene, camera) {
    state.scene = scene;
    state.camera = camera;
    state.active = true;

    // Create HUD
    createHUD();

    // Add ambient lighting
    var ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    state.villageObjects.push(ambientLight);

    // Add directional light for shadows
    var dirLight = new THREE.DirectionalLight(0xcccccc, 0.7);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);
    state.villageObjects.push(dirLight);

    // Add fog
    var fog = new THREE.FogExp2(colors.plague, 0.08);
    scene.fog = fog;

    // Create village layout
    createPlaza(0, 0, 0, 30, scene);
    createCottage(-10, 0, -5, scene);
    createCottage(10, 0, -8, scene);
    createCottage(-8, 0, 8, scene);
    createCottage(8, 0, 10, scene);
    createWell(0, 0, -10, scene);
    createChapel(0, 0, 15, scene);
    createStocks(-12, 0, 0, scene);
    createPlagueDoctor(5, 0, 5, scene);
    createQuarantineBarrier(-15, 1.5, 0, 15, 1.5, 0, scene);
    createGravePit(-8, 0, -15, scene);
    createPyre(10, 0, -15, scene);
    createRatCluster(-5, 0, -5, scene);
    createInfectedWell(12, 0, 8, scene);
    createMedicalTent(-15, 0, 10, scene);
    createSupplyCrate(0, 0, 8, scene);
    createCrowOnPost(15, 0, -5, scene);
    createMarketStall(-10, 0, 12, scene);

    // Register keybind
    document.addEventListener('keypress', handleKeyPress);
  }

  // Update function
  function update(delta) {
    if (!state.active) return;

    state.time += delta;

    // Update pyre fire
    for (var i = 0; i < state.villageObjects.length; i++) {
      var obj = state.villageObjects[i];
      if (obj.userData && obj.userData.fireSphere) {
        var firePhase = obj.userData.firePhase + state.time * 3;
        var flicker = 0.7 + Math.sin(firePhase) * 0.3;
        obj.userData.fireSphere.scale.set(flicker, flicker, flicker);
        obj.userData.fireSphere.material.emissiveIntensity = 0.6 + Math.sin(firePhase * 2) * 0.4;
      }

      // Update plague doctor wandering
      if (obj.userData && obj.userData.doctorWalkingPhase !== undefined) {
        var phase = state.time * 0.5;
        obj.position.x = 5 + Math.sin(phase) * 2;
        obj.position.z = 5 + Math.cos(phase) * 2;
      }

      // Update infected well pulsing
      if (obj.userData && obj.userData.waterMesh) {
        var waterPhase = state.time * 2;
        var pulseFactor = 1 + Math.sin(waterPhase) * 0.1;
        obj.userData.waterMesh.scale.y = pulseFactor;
      }

      // Update rat scattering
      if (obj.userData && obj.userData.ratScatterPhase !== undefined) {
        obj.userData.ratScatterPhase += delta;
        if (obj.userData.ratScatterPhase > 5) {
          obj.userData.ratScatterPhase = 0;
        }
        var scatter = Math.sin(obj.userData.ratScatterPhase * 2) * 0.5;
        for (var j = 0; j < obj.children.length; j++) {
          var rat = obj.children[j];
          if (rat.geometry && rat.geometry.type === 'SphereGeometry') {
            rat.position.x += scatter * 0.01;
          }
        }
      }

      // Update crow hopping
      if (obj.userData && obj.userData.crowBody) {
        var hopPhase = state.time * 3 + obj.userData.crowHopPhase;
        var hopHeight = Math.max(0, Math.sin(hopPhase) * 0.3);
        obj.userData.crowBody.position.y = 3.2 + hopHeight;
      }
    }
  }

  // Reset function
  function reset() {
    state.active = false;

    // Remove all village objects
    for (var i = 0; i < state.villageObjects.length; i++) {
      var obj = state.villageObjects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }
    state.villageObjects = [];

    // Remove HUD
    if (state.hudElement && state.hudElement.parentNode) {
      state.hudElement.parentNode.removeChild(state.hudElement);
      state.hudElement = null;
    }

    // Remove keybind listener
    document.removeEventListener('keypress', handleKeyPress);

    // Reset state
    state.antidotesDelivered = 0;
    state.infectedNeutralized = 0;
    state.keybindBuffer = '';
    state.time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
