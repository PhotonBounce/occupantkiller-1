window.ConcertHall = (function() {
  'use strict';

  var scene, camera, renderer;
  var objects = [];
  var lights = [];
  var textureCanvas;
  var hostageCount = 0;
  var terroristCount = 0;
  var hallSecured = false;
  var hudVisible = true;
  var lastKeyPress = null;
  var keySequence = [];

  var colors = {
    darkGray: 0x1a1a1a,
    stageGray: 0x333333,
    red: 0xff0000,
    white: 0xffffff,
    cyan: 0x00ffff,
    magenta: 0xff00ff,
    yellow: 0xffff00,
    green: 0x00ff00,
    blue: 0x0000ff
  };

  function createObject(geometry, material, position, scale, userData) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(position.x, position.y, position.z);
    if (scale) mesh.scale.set(scale.x, scale.y, scale.z);
    if (userData) Object.assign(mesh.userData, userData);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createLight(type, color, intensity, position) {
    var light;
    if (type === 'directional') {
      light = new THREE.DirectionalLight(color, intensity);
    } else if (type === 'point') {
      light = new THREE.PointLight(color, intensity);
    } else if (type === 'ambient') {
      light = new THREE.AmbientLight(color, intensity);
    }
    if (position) light.position.set(position.x, position.y, position.z);
    scene.add(light);
    lights.push(light);
    return light;
  }

  function init(container) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 100, 200);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 40);
    camera.lookAt(0, 10, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    createLights();
    buildConcertHall();
    setupHUD();
    setupKeyListeners();

    window.addEventListener('resize', onWindowResize);
  }

  function createLights() {
    createLight('ambient', colors.white, 0.3);
    createLight('directional', colors.white, 0.7, { x: 30, y: 50, z: 20 });
  }

  function buildConcertHall() {
    // 1. Concert hall floor
    var floorGeom = new THREE.BoxGeometry(80, 1, 60);
    var floorMat = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.8 });
    createObject(floorGeom, floorMat, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, { name: 'floor' });

    // 2. Stage (elevated box platform)
    var stageGeom = new THREE.BoxGeometry(30, 1, 15);
    var stageMat = new THREE.MeshStandardMaterial({ color: colors.stageGray, roughness: 0.6 });
    createObject(stageGeom, stageMat, { x: 0, y: 2.5, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'stage' });

    // 3. Speaker stacks (2 tall box PA stacks on stage sides)
    var speakerGeom = new THREE.BoxGeometry(3, 8, 3);
    var speakerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    createObject(speakerGeom, speakerMat, { x: -12, y: 6, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'speaker1' });
    createObject(speakerGeom, speakerMat, { x: 12, y: 6, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'speaker2' });

    // 4. Stage lighting rig (box truss + 6 emissive colored sphere lights)
    var trussGeom = new THREE.BoxGeometry(28, 1, 2);
    var trussMat = new THREE.MeshStandardMaterial({ color: 0x333333, metallic: 0.8 });
    createObject(trussGeom, trussMat, { x: 0, y: 10, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'truss' });

    var lightColors = [colors.red, colors.cyan, colors.magenta, colors.yellow, colors.green, colors.blue];
    for (var i = 0; i < 6; i++) {
      var lightGeom = new THREE.SphereGeometry(0.5, 16, 16);
      var lightMat = new THREE.MeshStandardMaterial({ color: lightColors[i], emissive: lightColors[i], emissiveIntensity: 1.0 });
      var xPos = -12 + i * 5;
      createObject(lightGeom, lightMat, { x: xPos, y: 10.5, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'stagelight' + i, colorIndex: i });
    }

    // 5. Grand piano on stage (box body + cylinder legs)
    var pianoBodyGeom = new THREE.BoxGeometry(2, 1, 4);
    var pianoMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metallic: 0.9 });
    createObject(pianoBodyGeom, pianoMat, { x: 5, y: 3.5, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'piano' });

    var pianoLegGeom = new THREE.CylinderGeometry(0.15, 0.15, 2, 16);
    var legMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    createObject(pianoLegGeom, legMat, { x: 4, y: 2.5, z: -14 }, { x: 1, y: 1, z: 1 }, { name: 'pianoleg1' });
    createObject(pianoLegGeom, legMat, { x: 6, y: 2.5, z: -14 }, { x: 1, y: 1, z: 1 }, { name: 'pianoleg2' });
    createObject(pianoLegGeom, legMat, { x: 4, y: 2.5, z: -16 }, { x: 1, y: 1, z: 1 }, { name: 'pianoleg3' });
    createObject(pianoLegGeom, legMat, { x: 6, y: 2.5, z: -16 }, { x: 1, y: 1, z: 1 }, { name: 'pianoleg4' });

    // 6. Performer mic stand (cylinder + sphere mic head)
    var standGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 16);
    var standMat = new THREE.MeshStandardMaterial({ color: 0x444444, metallic: 0.7 });
    createObject(standGeom, standMat, { x: -5, y: 3.5, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'micstand' });

    var micGeom = new THREE.SphereGeometry(0.3, 16, 16);
    var micMat = new THREE.MeshStandardMaterial({ color: 0x666666, metallic: 0.8 });
    createObject(micGeom, micMat, { x: -5, y: 5.5, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'michead' });

    // 7. Audience seats (rows of small box seats, 40+ in grid)
    var seatGeom = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    var seatMat = new THREE.MeshStandardMaterial({ color: 0x4a2020, roughness: 0.7 });
    var seatIndex = 0;
    for (var row = 0; row < 7; row++) {
      for (var col = 0; col < 6; col++) {
        var seatX = -14 + col * 5;
        var seatZ = 8 + row * 3;
        createObject(seatGeom, seatMat, { x: seatX, y: 1.2, z: seatZ }, { x: 1, y: 1, z: 1 }, { name: 'seat' + seatIndex });
        seatIndex++;
      }
    }

    // 8. Balcony tier (elevated box platform at rear)
    var balconyGeom = new THREE.BoxGeometry(70, 0.8, 20);
    var balconyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    createObject(balconyGeom, balconyMat, { x: 0, y: 8, z: 35 }, { x: 1, y: 1, z: 1 }, { name: 'balcony' });

    // 9. Emergency exit signs (flat box, emissive red)
    var signGeom = new THREE.BoxGeometry(3, 1.5, 0.2);
    var signMat = new THREE.MeshStandardMaterial({ color: colors.red, emissive: colors.red, emissiveIntensity: 0.8 });
    createObject(signGeom, signMat, { x: -35, y: 3, z: 0 }, { x: 1, y: 1, z: 1 }, { name: 'exitsign1' });
    createObject(signGeom, signMat, { x: 35, y: 3, z: 0 }, { x: 1, y: 1, z: 1 }, { name: 'exitsign2' });

    // 10. Terrorist figures (5 box+sphere armed, in balcony + aisles)
    for (var t = 0; t < 5; t++) {
      var terrX = -25 + t * 13;
      var terrZ = 30 + (t % 2) * 8;
      createTerrorist(terrX, terrZ);
    }
    terroristCount = 5;

    // 11. Hostage audience (10 box+sphere cowering in seats)
    var hostagePositions = [
      { x: -14, z: 14 }, { x: -9, z: 14 }, { x: -4, z: 20 }, { x: 1, z: 20 },
      { x: 6, z: 26 }, { x: 11, z: 26 }, { x: -19, z: 32 }, { x: -9, z: 32 },
      { x: 1, z: 32 }, { x: 11, z: 32 }
    ];
    for (var h = 0; h < hostagePositions.length; h++) {
      createHostage(hostagePositions[h].x, hostagePositions[h].z);
    }
    hostageCount = 10;

    // 12. SWAT breach team (4 box+sphere tactical, at rear doors)
    createSWAT(-15, 35);
    createSWAT(-5, 35);
    createSWAT(5, 35);
    createSWAT(15, 35);

    // 13. Spotlight beams (cylinder shapes, emissive white)
    var beamGeom = new THREE.CylinderGeometry(1, 1, 20, 16);
    var beamMat = new THREE.MeshStandardMaterial({ color: colors.white, emissive: colors.white, emissiveIntensity: 0.5, transparent: true, opacity: 0.3 });
    createObject(beamGeom, beamMat, { x: -20, y: 20, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'beam1' });
    createObject(beamGeom, beamMat, { x: 20, y: 20, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'beam2' });

    // 14. Mixing desk (box console at center floor)
    var deskGeom = new THREE.BoxGeometry(4, 1, 2);
    var deskMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metallic: 0.6 });
    createObject(deskGeom, deskMat, { x: 0, y: 1.5, z: 5 }, { x: 1, y: 1, z: 1 }, { name: 'mixingdesk' });

    // 15. Backstage door (box door, cracked open)
    var doorGeom = new THREE.BoxGeometry(2, 3, 0.2);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    createObject(doorGeom, doorMat, { x: -38, y: 4, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'backstogedoor' });

    // 16. Smoke machine (cylinder + emissive white sphere)
    var smokeBodyGeom = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
    var smokeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    createObject(smokeBodyGeom, smokeMat, { x: 25, y: 1.5, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'smokemachine' });

    var smokeCloudGeom = new THREE.SphereGeometry(2, 16, 16);
    var cloudMat = new THREE.MeshStandardMaterial({ color: colors.white, emissive: colors.white, emissiveIntensity: 0.3, transparent: true, opacity: 0.2 });
    createObject(smokeCloudGeom, cloudMat, { x: 25, y: 4, z: -15 }, { x: 1, y: 1, z: 1 }, { name: 'smokecloud' });

    // 17. Fallen chandelier (box+LineSegments debris on floor)
    var chandelierGeom = new THREE.BoxGeometry(3, 0.5, 3);
    var chandelierMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, metallic: 0.7 });
    createObject(chandelierGeom, chandelierMat, { x: -20, y: 1.5, z: 15 }, { x: 1, y: 1, z: 1 }, { name: 'chandelier' });

    var debrisPoints = [
      new THREE.Vector3(-18, 2, 13),
      new THREE.Vector3(-22, 2, 17),
      new THREE.Vector3(-19, 1.5, 18),
      new THREE.Vector3(-21, 2, 14)
    ];
    var debrisGeom = new THREE.BufferGeometry().setFromPoints(debrisPoints);
    var debrisMat = new THREE.LineBasicMaterial({ color: 0x8b7355 });
    var debrisLines = new THREE.LineSegments(debrisGeom, debrisMat);
    scene.add(debrisLines);
    objects.push(debrisLines);
  }

  function createTerrorist(x, z) {
    var bodyGeom = new THREE.BoxGeometry(0.6, 1.5, 0.4);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var body = createObject(bodyGeom, bodyMat, { x: x, y: 2.5, z: z }, { x: 1, y: 1, z: 1 }, { name: 'terrorist_body' });

    var headGeom = new THREE.SphereGeometry(0.35, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
    createObject(headGeom, headMat, { x: x, y: 4.2, z: z }, { x: 1, y: 1, z: 1 }, { name: 'terrorist_head' });

    var gunGeom = new THREE.BoxGeometry(0.2, 0.1, 1.2);
    var gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metallic: 0.9 });
    createObject(gunGeom, gunMat, { x: x + 0.5, y: 3, z: z }, { x: 1, y: 1, z: 1 }, { name: 'terrorist_gun' });
  }

  function createHostage(x, z) {
    var bodyGeom = new THREE.BoxGeometry(0.5, 1.2, 0.35);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a6fa5 });
    createObject(bodyGeom, bodyMat, { x: x, y: 2, z: z }, { x: 1, y: 1, z: 1 }, { name: 'hostage_body' });

    var headGeom = new THREE.SphereGeometry(0.3, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xa0826d });
    createObject(headGeom, headMat, { x: x, y: 3.5, z: z }, { x: 1, y: 1, z: 1 }, { name: 'hostage_head' });
  }

  function createSWAT(x, z) {
    var bodyGeom = new THREE.BoxGeometry(0.6, 1.6, 0.4);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    createObject(bodyGeom, bodyMat, { x: x, y: 2.5, z: z }, { x: 1, y: 1, z: 1 }, { name: 'swat_body' });

    var headGeom = new THREE.SphereGeometry(0.35, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    createObject(headGeom, headMat, { x: x, y: 4.3, z: z }, { x: 1, y: 1, z: 1 }, { name: 'swat_head' });

    var rifleGeom = new THREE.BoxGeometry(0.15, 0.1, 1.5);
    var rifleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metallic: 0.95 });
    createObject(rifleGeom, rifleMat, { x: x + 0.6, y: 3.2, z: z }, { x: 1, y: 1, z: 1 }, { name: 'swat_rifle' });
  }

  function setupHUD() {
    textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 256;
    updateHUDText();

    var hudGeom = new THREE.PlaneGeometry(20, 10);
    var hudTexture = new THREE.CanvasTexture(textureCanvas);
    var hudMat = new THREE.MeshBasicMaterial({ map: hudTexture });
    var hudMesh = new THREE.Mesh(hudGeom, hudMat);
    hudMesh.position.set(0, 20, -40);
    scene.add(hudMesh);
    objects.push(hudMesh);
  }

  function updateHUDText() {
    var ctx = textureCanvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

    ctx.fillStyle = '#00ff00';
    ctx.font = '32px Arial';
    ctx.fillText('HOSTAGES SAFE: ' + hostageCount + '/10', 20, 60);
    ctx.fillText('TERRORISTS DOWN: ' + (5 - terroristCount) + '/5', 20, 120);
    ctx.fillStyle = hallSecured ? '#00ff00' : '#ff0000';
    ctx.fillText('HALL SECURED: ' + (hallSecured ? 'YES' : 'NO'), 20, 180);
  }

  function setupKeyListeners() {
    document.addEventListener('keydown', function(e) {
      keySequence.push(e.key.toUpperCase());
      if (keySequence.length > 2) keySequence.shift();

      if (keySequence.length === 2 && keySequence[0] === 'C' && keySequence[1] === 'H') {
        hudVisible = !hudVisible;
        var hudMeshes = objects.filter(function(obj) { return obj.geometry && obj.geometry.type === 'PlaneGeometry'; });
        hudMeshes.forEach(function(mesh) { mesh.visible = hudVisible; });
        keySequence = [];
      }
    });
  }

  function update() {
    var time = Date.now() * 0.001;

    // Sweep stage lights
    objects.forEach(function(obj) {
      if (obj.userData.name && obj.userData.name.indexOf('stagelight') === 0) {
        var hue = (time * 0.5 + obj.userData.colorIndex * 0.3) % 1;
        obj.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.3;
      }
    });

    // Rotate spotlights
    objects.forEach(function(obj) {
      if (obj.userData.name === 'beam1') {
        obj.rotation.y = Math.sin(time * 0.3) * 0.3;
      } else if (obj.userData.name === 'beam2') {
        obj.rotation.y = Math.cos(time * 0.3) * 0.3;
      }
    });

    // Pulse smoke machine
    objects.forEach(function(obj) {
      if (obj.userData.name === 'smokecloud') {
        var scale = 2 + Math.sin(time * 1.5) * 0.5;
        obj.scale.set(scale, scale, scale);
      }
    });

    // Flash emergency signs
    objects.forEach(function(obj) {
      if (obj.userData.name && obj.userData.name.indexOf('exitsign') === 0) {
        obj.material.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.3;
      }
    });

    // Patrol terrorists
    var terroriestBodies = objects.filter(function(obj) { return obj.userData.name === 'terrorist_body'; });
    terroriestBodies.forEach(function(obj, idx) {
      obj.position.x += Math.sin(time * 0.5 + idx) * 0.02;
      obj.position.z += Math.cos(time * 0.5 + idx) * 0.01;
    });

    // Advance SWAT team
    var swatBodies = objects.filter(function(obj) { return obj.userData.name === 'swat_body'; });
    swatBodies.forEach(function(obj) {
      obj.position.z -= 0.02;
      if (obj.position.z < 0) obj.position.z = 35;
    });

    // Cower hostages
    var hostagebodies = objects.filter(function(obj) { return obj.userData.name === 'hostage_body'; });
    hostagebodies.forEach(function(obj) {
      obj.rotation.x = Math.sin(time * 2) * 0.1;
      obj.rotation.z = Math.cos(time * 2) * 0.05;
    });

    renderer.render(scene, camera);
  }

  function reset() {
    objects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    lights.forEach(function(light) { scene.remove(light); });

    if (textureCanvas) textureCanvas = null;
    objects = [];
    lights = [];
    keySequence = [];

    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    scene = null;
    camera = null;
    renderer = null;
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
