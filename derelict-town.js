window.DerelictTown = (function() {
  'use strict';

  var scene, camera, renderer, canvas;
  var materials = {}, geometries = {}, meshes = [], lights = [];
  var hud = { canvas: null, ctx: null, visible: false };
  var gameState = { raidersKilled: 0, suppliesSecured: 0, townCleared: false };
  var keyPressTracker = { lastKey: null, lastKeyTime: 0 };
  var animations = { craters: [], windmill: null, fighters: [], mutants: [], signs: [] };

  function init(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    canvas = container.querySelector('canvas') || document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (!container.querySelector('canvas')) container.appendChild(canvas);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb8860b);
    scene.fog = new THREE.Fog(0xb8860b, 300, 800);

    camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1500);
    camera.position.set(0, 80, 120);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    setupLights();
    buildScene();
    setupHUD();
    setupKeyListener();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    return { scene: scene, camera: camera, renderer: renderer };
  }

  function setupLights() {
    var ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambLight);
    lights.push(ambLight);

    var sunLight = new THREE.DirectionalLight(0xfffacd, 0.8);
    sunLight.position.set(200, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -400;
    sunLight.shadow.camera.right = 400;
    sunLight.shadow.camera.top = 400;
    sunLight.shadow.camera.bottom = -400;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    scene.add(sunLight);
    lights.push(sunLight);

    var hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.5);
    scene.add(hemiLight);
    lights.push(hemiLight);
  }

  function buildScene() {
    // 1. Desert street
    var streetGeo = new THREE.BoxGeometry(300, 2, 600);
    var streetMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.9, metalness: 0 });
    var street = new THREE.Mesh(streetGeo, streetMat);
    street.position.y = -1;
    street.receiveShadow = true;
    street.castShadow = true;
    scene.add(street);
    meshes.push(street);

    // 2. Collapsed building #1 (tilted box + rubble)
    var bldg1Geo = new THREE.BoxGeometry(60, 70, 50);
    var bldg1Mat = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.8 });
    var bldg1 = new THREE.Mesh(bldg1Geo, bldg1Mat);
    bldg1.position.set(-120, 30, -150);
    bldg1.rotation.z = 0.3;
    bldg1.castShadow = true;
    bldg1.receiveShadow = true;
    scene.add(bldg1);
    meshes.push(bldg1);

    var rubble1Geo = new THREE.BoxGeometry(40, 15, 35);
    var rubble1Mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.95 });
    var rubble1 = new THREE.Mesh(rubble1Geo, rubble1Mat);
    rubble1.position.set(-110, 10, -130);
    rubble1.rotation.x = 0.2;
    rubble1.castShadow = true;
    rubble1.receiveShadow = true;
    scene.add(rubble1);
    meshes.push(rubble1);

    // 3. Collapsed building #2 (different angle, partial walls)
    var bldg2Geo = new THREE.BoxGeometry(55, 60, 48);
    var bldg2Mat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.85 });
    var bldg2 = new THREE.Mesh(bldg2Geo, bldg2Mat);
    bldg2.position.set(100, 25, -180);
    bldg2.rotation.z = -0.4;
    bldg2.castShadow = true;
    bldg2.receiveShadow = true;
    scene.add(bldg2);
    meshes.push(bldg2);

    // Partial walls using LineSegments (rebar)
    var wallPoints = [
      new THREE.Vector3(70, 50, -160), new THREE.Vector3(130, 50, -160),
      new THREE.Vector3(130, 50, -160), new THREE.Vector3(130, 20, -200)
    ];
    var wallGeo = new THREE.BufferGeometry().setFromPoints(wallPoints);
    var wallMat = new THREE.LineBasicMaterial({ color: 0x8b0000, linewidth: 3 });
    var wallLines = new THREE.LineSegments(wallGeo, wallMat);
    scene.add(wallLines);
    meshes.push(wallLines);

    // 4. Burned out sedan
    var carGeo = new THREE.BoxGeometry(20, 12, 40);
    var carMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.8 });
    var sedan = new THREE.Mesh(carGeo, carMat);
    sedan.position.set(-80, 8, 80);
    sedan.rotation.y = 0.5;
    sedan.castShadow = true;
    sedan.receiveShadow = true;
    scene.add(sedan);
    meshes.push(sedan);

    // Melted wheel remnants
    var wheelGeo = new THREE.CylinderGeometry(8, 8, 2, 16);
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness: 0.9 });
    var wheel1 = new THREE.Mesh(wheelGeo, wheelMat);
    wheel1.position.set(-95, 3, 60);
    wheel1.castShadow = true;
    scene.add(wheel1);
    meshes.push(wheel1);

    var wheel2 = new THREE.Mesh(wheelGeo, wheelMat);
    wheel2.position.set(-95, 3, 100);
    wheel2.castShadow = true;
    scene.add(wheel2);
    meshes.push(wheel2);

    // 5. Burned out truck
    var truckGeo = new THREE.BoxGeometry(35, 25, 60);
    var truckMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.8, metalness: 0.6 });
    var truck = new THREE.Mesh(truckGeo, truckMat);
    truck.position.set(150, 15, 120);
    truck.rotation.y = -0.3;
    truck.castShadow = true;
    truck.receiveShadow = true;
    scene.add(truck);
    meshes.push(truck);

    // 6. Radioactive crater #1
    var crater1Geo = new THREE.BoxGeometry(80, 8, 80);
    var crater1Mat = new THREE.MeshStandardMaterial({
      color: 0x00aa00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
      roughness: 0.6
    });
    var crater1 = new THREE.Mesh(crater1Geo, crater1Mat);
    crater1.position.set(-200, -5, 0);
    crater1.receiveShadow = true;
    scene.add(crater1);
    meshes.push(crater1);
    animations.craters.push({ mesh: crater1, mat: crater1Mat });

    // 7. Radioactive crater #2
    var crater2Geo = new THREE.BoxGeometry(70, 8, 70);
    var crater2Mat = new THREE.MeshStandardMaterial({
      color: 0x00aa00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
      roughness: 0.6
    });
    var crater2 = new THREE.Mesh(crater2Geo, crater2Mat);
    crater2.position.set(250, -5, 220);
    crater2.receiveShadow = true;
    scene.add(crater2);
    meshes.push(crater2);
    animations.craters.push({ mesh: crater2, mat: crater2Mat });

    // 8. Water tower ruin
    var tankGeo = new THREE.CylinderGeometry(25, 25, 30, 24);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0xa9a9a9, roughness: 0.7 });
    var tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(-250, 40, 150);
    tank.castShadow = true;
    tank.receiveShadow = true;
    scene.add(tank);
    meshes.push(tank);

    var legGeo = new THREE.CylinderGeometry(6, 6, 50, 12);
    var legMat = new THREE.MeshStandardMaterial({ color: 0x8b8b8b, roughness: 0.8 });
    var leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-265, 20, 130);
    leg1.rotation.z = 0.15;
    leg1.castShadow = true;
    scene.add(leg1);
    meshes.push(leg1);

    var leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(-235, 20, 170);
    leg2.rotation.z = -0.15;
    leg2.castShadow = true;
    scene.add(leg2);
    meshes.push(leg2);

    // 9. General store ruin
    var storeGeo = new THREE.BoxGeometry(70, 50, 45);
    var storeMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.75 });
    var store = new THREE.Mesh(storeGeo, storeMat);
    store.position.set(50, 20, -250);
    store.castShadow = true;
    store.receiveShadow = true;
    scene.add(store);
    meshes.push(store);

    // 10. Barricade wall (stacked boxes + rebar)
    var barGeo = new THREE.BoxGeometry(100, 20, 12);
    var barMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });
    var barricade = new THREE.Mesh(barGeo, barMat);
    barricade.position.set(0, 15, -300);
    barricade.castShadow = true;
    barricade.receiveShadow = true;
    scene.add(barricade);
    meshes.push(barricade);

    var rebarPoints = [
      new THREE.Vector3(-40, 35, -295), new THREE.Vector3(-35, 5, -310),
      new THREE.Vector3(20, 35, -295), new THREE.Vector3(25, 5, -310),
      new THREE.Vector3(40, 35, -295), new THREE.Vector3(45, 5, -310)
    ];
    var rebarGeo = new THREE.BufferGeometry().setFromPoints(rebarPoints);
    var rebarMat = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    var rebarLines = new THREE.LineSegments(rebarGeo, rebarMat);
    scene.add(rebarLines);
    meshes.push(rebarLines);

    // 11. Resistance fighters (box+sphere, 4 survivors)
    for (var i = 0; i < 4; i++) {
      var posX = -30 + i * 25;
      var posZ = -320;
      var bodyGeo = new THREE.BoxGeometry(8, 16, 6);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2f4f4f });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(posX, 10, posZ);
      body.castShadow = true;
      scene.add(body);
      meshes.push(body);

      var headGeo = new THREE.SphereGeometry(4, 8, 8);
      var headMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.set(posX, 22, posZ);
      head.castShadow = true;
      scene.add(head);
      meshes.push(head);

      animations.fighters.push({ body: body, head: head, posX: posX, posZ: posZ, time: i * 50 });
    }

    // 12. Mutant raider figures (larger box+sphere, 5 mutants)
    for (var j = 0; j < 5; j++) {
      var mPosX = -80 + j * 35;
      var mPosZ = -280;
      var mBodyGeo = new THREE.BoxGeometry(12, 20, 8);
      var mBodyMat = new THREE.MeshStandardMaterial({ color: 0x556b2f });
      var mBody = new THREE.Mesh(mBodyGeo, mBodyMat);
      mBody.position.set(mPosX, 12, mPosZ);
      mBody.castShadow = true;
      scene.add(mBody);
      meshes.push(mBody);

      var mHeadGeo = new THREE.SphereGeometry(5, 8, 8);
      var mHeadMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      var mHead = new THREE.Mesh(mHeadGeo, mHeadMat);
      mHead.position.set(mPosX, 26, mPosZ);
      mHead.castShadow = true;
      scene.add(mHead);
      meshes.push(mHead);

      animations.mutants.push({ body: mBody, head: mHead, posX: mPosX, posZ: mPosZ, time: j * 40 });
    }

    // 13. Radiation warning signs
    for (var k = 0; k < 3; k++) {
      var signX = -150 + k * 150;
      var signGeo = new THREE.BoxGeometry(20, 30, 2);
      var signMat = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.2
      });
      var sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(signX, 20, 200);
      sign.castShadow = true;
      scene.add(sign);
      meshes.push(sign);
      animations.signs.push({ mesh: sign, mat: signMat });
    }

    // 14. Cache of supplies (box crates in store ruin area)
    for (var s = 0; s < 4; s++) {
      var crateGeo = new THREE.BoxGeometry(15, 15, 15);
      var crateMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(30 + s * 20, 10, -250);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      meshes.push(crate);
    }

    // 15. Windmill (cylinder pole + LineSegments blades)
    var poleGeo = new THREE.CylinderGeometry(8, 8, 100, 16);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(300, 50, -150);
    pole.castShadow = true;
    scene.add(pole);
    meshes.push(pole);

    var bladePoints = [];
    for (var b = 0; b < 4; b++) {
      var angle = (b * Math.PI / 2);
      var x1 = Math.cos(angle) * 40;
      var z1 = Math.sin(angle) * 40;
      bladePoints.push(new THREE.Vector3(x1, 0, z1));
      bladePoints.push(new THREE.Vector3(x1 * 1.3, 0, z1 * 1.3));
    }
    var bladeGeo = new THREE.BufferGeometry().setFromPoints(bladePoints);
    var bladeMat = new THREE.LineBasicMaterial({ color: 0xa9a9a9, linewidth: 2 });
    var blades = new THREE.LineSegments(bladeGeo, bladeMat);
    blades.position.set(300, 100, -150);
    scene.add(blades);
    meshes.push(blades);
    animations.windmill = { blades: blades };

    // 16. Church ruin
    var churchGeo = new THREE.BoxGeometry(40, 60, 40);
    var churchMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    var church = new THREE.Mesh(churchGeo, churchMat);
    church.position.set(-150, 25, 80);
    church.castShadow = true;
    church.receiveShadow = true;
    scene.add(church);
    meshes.push(church);

    var bellGeo = new THREE.CylinderGeometry(12, 15, 20, 16);
    var bellMat = new THREE.MeshStandardMaterial({ color: 0xb8860b });
    var bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.set(-150, 70, 80);
    bell.rotation.z = 0.4;
    bell.castShadow = true;
    scene.add(bell);
    meshes.push(bell);

    // 17. Mass grave marker (box cross + sphere skull)
    var crossGeo = new THREE.BoxGeometry(4, 40, 4);
    var crossMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var cross = new THREE.Mesh(crossGeo, crossMat);
    cross.position.set(200, 20, 300);
    cross.castShadow = true;
    scene.add(cross);
    meshes.push(cross);

    var crossbarGeo = new THREE.BoxGeometry(25, 4, 4);
    var crossbar = new THREE.Mesh(crossbarGeo, crossMat);
    crossbar.position.set(200, 30, 300);
    crossbar.castShadow = true;
    scene.add(crossbar);
    meshes.push(crossbar);

    var skullGeo = new THREE.SphereGeometry(6, 8, 8);
    var skullMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
    var skull = new THREE.Mesh(skullGeo, skullMat);
    skull.position.set(200, 45, 300);
    skull.castShadow = true;
    scene.add(skull);
    meshes.push(skull);

    // Dust/smoke wisps (small spheres rising)
    for (var d = 0; d < 6; d++) {
      var dustGeo = new THREE.SphereGeometry(3, 6, 6);
      var dustMat = new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0.4 });
      var dust = new THREE.Mesh(dustGeo, dustMat);
      dust.position.set(-150 + Math.random() * 400, 5 + Math.random() * 50, -150 + Math.random() * 400);
      scene.add(dust);
      meshes.push(dust);
    }
  }

  function setupHUD() {
    hud.canvas = document.createElement('canvas');
    hud.canvas.width = 512;
    hud.canvas.height = 200;
    hud.canvas.style.position = 'absolute';
    hud.canvas.style.top = '10px';
    hud.canvas.style.left = '10px';
    hud.canvas.style.fontFamily = 'monospace';
    hud.canvas.style.pointerEvents = 'none';
    hud.canvas.style.display = 'none';
    hud.ctx = hud.canvas.getContext('2d');
    document.body.appendChild(hud.canvas);
  }

  function drawHUD() {
    hud.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    hud.ctx.fillRect(0, 0, hud.canvas.width, hud.canvas.height);
    hud.ctx.fillStyle = '#00ff00';
    hud.ctx.font = '16px monospace';
    hud.ctx.fillText('RAIDERS KILLED: ' + gameState.raidersKilled + '/5', 20, 30);
    hud.ctx.fillText('SUPPLIES SECURED: ' + gameState.suppliesSecured + '/4 CACHES', 20, 60);
    hud.ctx.fillText('TOWN CLEARED: ' + (gameState.townCleared ? 'YES' : 'NO'), 20, 90);
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(e) {
      if (e.key.toUpperCase() === 'D') {
        var now = Date.now();
        if (keyPressTracker.lastKey === 'D' && now - keyPressTracker.lastKeyTime < 400) {
          if (hud.visible) {
            hud.canvas.style.display = 'none';
            hud.visible = false;
          } else {
            hud.canvas.style.display = 'block';
            hud.visible = true;
          }
          keyPressTracker.lastKey = null;
          keyPressTracker.lastKeyTime = 0;
        } else {
          keyPressTracker.lastKey = 'D';
          keyPressTracker.lastKeyTime = now;
        }
      } else if (e.key.toUpperCase() === 'T' && keyPressTracker.lastKey === 'D') {
        var now = Date.now();
        if (now - keyPressTracker.lastKeyTime < 400) {
          if (hud.visible) {
            hud.canvas.style.display = 'none';
            hud.visible = false;
          } else {
            hud.canvas.style.display = 'block';
            hud.visible = true;
          }
          keyPressTracker.lastKey = null;
          keyPressTracker.lastKeyTime = 0;
        }
      }
    });
  }

  function update() {
    var time = Date.now() * 0.001;

    // Animate radioactive craters (pulse)
    for (var i = 0; i < animations.craters.length; i++) {
      var crater = animations.craters[i];
      var pulse = 0.2 + Math.sin(time * 2) * 0.1;
      crater.mat.emissiveIntensity = pulse;
    }

    // Animate windmill (rotate)
    if (animations.windmill && animations.windmill.blades) {
      animations.windmill.blades.rotation.y += 0.01;
    }

    // Animate fighters (move defensively)
    for (var f = 0; f < animations.fighters.length; f++) {
      var fighter = animations.fighters[f];
      var fOffset = Math.sin(time + fighter.time * 0.01) * 5;
      fighter.body.position.x = fighter.posX + fOffset;
      fighter.head.position.x = fighter.posX + fOffset;
    }

    // Animate mutants (lurch toward fighters)
    for (var m = 0; m < animations.mutants.length; m++) {
      var mutant = animations.mutants[m];
      var mLurch = Math.sin(time * 0.8 + mutant.time * 0.01) * 3;
      mutant.body.position.z = mutant.posZ + mLurch - 10;
      mutant.head.position.z = mutant.posZ + mLurch - 10;
      mutant.body.rotation.y = Math.sin(time * 0.5 + mutant.time * 0.01) * 0.2;
    }

    // Animate warning signs (flicker)
    for (var s = 0; s < animations.signs.length; s++) {
      var sign = animations.signs[s];
      var flicker = Math.sin(time * 3 + s * 0.5) > 0 ? 0.3 : 0.1;
      sign.mat.emissiveIntensity = flicker;
    }

    // Draw HUD if visible
    if (hud.visible) {
      drawHUD();
    }

    if (renderer) {
      renderer.render(scene, camera);
    }
  }

  function reset() {
    // Dispose of geometries
    for (var key in geometries) {
      if (geometries[key]) geometries[key].dispose();
    }

    // Dispose of materials
    for (var key in materials) {
      if (materials[key]) materials[key].dispose();
    }

    // Dispose of meshes
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i] && meshes[i].geometry) meshes[i].geometry.dispose();
      if (meshes[i] && meshes[i].material) {
        if (Array.isArray(meshes[i].material)) {
          for (var j = 0; j < meshes[i].material.length; j++) {
            meshes[i].material[j].dispose();
          }
        } else {
          meshes[i].material.dispose();
        }
      }
    }

    // Clear scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Clear arrays
    meshes = [];
    lights = [];
    animations.craters = [];
    animations.windmill = null;
    animations.fighters = [];
    animations.mutants = [];
    animations.signs = [];

    // Dispose renderer
    if (renderer) {
      renderer.dispose();
      renderer = null;
    }

    // Remove HUD
    if (hud.canvas && hud.canvas.parentNode) {
      hud.canvas.parentNode.removeChild(hud.canvas);
    }

    // Reset game state
    gameState.raidersKilled = 0;
    gameState.suppliesSecured = 0;
    gameState.townCleared = false;
  }

  function onWindowResize() {
    var container = renderer.domElement.parentElement;
    var width = container.clientWidth;
    var height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function onKeyDown(e) {
    // Key handling delegated to setupKeyListener
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
