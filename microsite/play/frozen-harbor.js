window.FrozenHarbor = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var state = {
    subsInPort: 3,
    subsDestroyed: 0,
    harborLocked: false,
    hudVisible: true,
    lastKeyF: 0,
    time: 0
  };

  var materials = {};

  function initMaterials() {
    materials.ice = new THREE.MeshStandardMaterial({ color: 0xeef5ff, metalness: 0.6, roughness: 0.3 });
    materials.iceDark = new THREE.MeshStandardMaterial({ color: 0xb0d4ff, metalness: 0.5, roughness: 0.4 });
    materials.steel = new THREE.MeshStandardMaterial({ color: 0x404040, metalness: 0.9, roughness: 0.1 });
    materials.concrete = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.1, roughness: 0.8 });
    materials.white = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.5 });
    materials.emissive = new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0044ff, metalness: 0.7, roughness: 0.2 });
    materials.yellow = new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xffaa00, metalness: 0.8, roughness: 0.2 });
  }

  function createIceSheet() {
    var geom = new THREE.BoxGeometry(200, 3, 150);
    var mesh = new THREE.Mesh(geom, materials.ice);
    mesh.position.set(0, -2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createIcebreakerShip() {
    var group = new THREE.Group();

    var hull = new THREE.Mesh(new THREE.BoxGeometry(25, 12, 60), materials.steel);
    hull.position.set(0, 3, -50);
    hull.castShadow = true;
    group.add(hull);

    var bow = new THREE.Mesh(new THREE.ConeGeometry(8, 20, 8), materials.steel);
    bow.position.set(0, 8, -60);
    bow.rotation.z = Math.PI / 2;
    bow.castShadow = true;
    group.add(bow);

    var superstructure = new THREE.Mesh(new THREE.BoxGeometry(15, 15, 25), materials.concrete);
    superstructure.position.set(0, 12, -35);
    superstructure.castShadow = true;
    group.add(superstructure);

    group.position.set(0, 0, 0);
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createSubmarine() {
    var group = new THREE.Group();

    var hull = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 40, 16), materials.steel);
    hull.rotation.z = Math.PI / 2;
    hull.position.set(0, 0, 20);
    hull.castShadow = true;
    group.add(hull);

    var tower = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 8), materials.steel);
    tower.position.set(0, 5, 20);
    tower.castShadow = true;
    group.add(tower);

    var periscope = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 8), materials.emissive);
    periscope.position.set(2, 11, 20);
    periscope.castShadow = true;
    group.add(periscope);

    var hatch1 = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4), materials.white);
    hatch1.position.set(-3, 6, 15);
    hatch1.castShadow = true;
    group.add(hatch1);

    var hatch2 = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4), materials.white);
    hatch2.position.set(3, 6, 25);
    hatch2.castShadow = true;
    group.add(hatch2);

    group.position.set(-30, 2, 0);
    group._originalHatch1 = hatch1;
    group._originalHatch2 = hatch2;
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createIceChannel() {
    var geom = new THREE.BoxGeometry(40, -8, 25);
    var mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x1a1a2e }));
    mesh.position.set(0, -6, -30);
    mesh.castShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createCrane() {
    var group = new THREE.Group();

    var tower = new THREE.Mesh(new THREE.BoxGeometry(4, 50, 4), materials.steel);
    tower.position.set(0, 25, 40);
    tower.castShadow = true;
    group.add(tower);

    var arm = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 3), materials.steel);
    arm.position.set(15, 48, 40);
    arm.castShadow = true;
    group.add(arm);

    var hook = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), materials.yellow);
    hook.position.set(30, 45, 40);
    hook.castShadow = true;
    group.add(hook);

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createFuelDepot() {
    var group = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var tank = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 15, 16), materials.yellow);
      tank.position.set(-20 + i * 15, 8, 50);
      tank.castShadow = true;
      group.add(tank);
    }

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createWarehouse() {
    var geom = new THREE.BoxGeometry(50, 20, 35);
    var mesh = new THREE.Mesh(geom, materials.concrete);
    mesh.position.set(60, 10, 30);
    mesh.castShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createArtillery() {
    var group = new THREE.Group();

    var platform = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 12), materials.concrete);
    platform.position.set(50, 2, -40);
    platform.castShadow = true;
    group.add(platform);

    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 18, 12), materials.steel);
    barrel.rotation.z = Math.PI / 6;
    barrel.position.set(50, 12, -40);
    barrel.castShadow = true;
    group.add(barrel);

    group.position.set(0, 0, 0);
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createRadarDome() {
    var group = new THREE.Group();

    var mast = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 20, 8), materials.steel);
    mast.position.set(-50, 10, 50);
    mast.castShadow = true;
    group.add(mast);

    var dome = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), materials.emissive);
    dome.position.set(-50, 20, 50);
    dome.castShadow = true;
    group.add(dome);

    group._dome = dome;
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createIcePressureRidge() {
    var group = new THREE.Group();

    for (var i = 0; i < 8; i++) {
      var shard = new THREE.Mesh(new THREE.BoxGeometry(8, 12 + i * 2, 6), materials.iceDark);
      shard.position.set(-80 + i * 20, 8 + i * 3, 0);
      shard.rotation.z = (Math.PI / 4) * (i % 2 ? 1 : -1);
      shard.castShadow = true;
      group.add(shard);
    }

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createAAGun() {
    var group = new THREE.Group();

    var mount = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8), materials.concrete);
    mount.position.set(-40, 3, 60);
    mount.castShadow = true;
    group.add(mount);

    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 15, 12), materials.steel);
    barrel.rotation.z = Math.PI / 8;
    barrel.position.set(-40, 12, 60);
    barrel.castShadow = true;
    group.add(barrel);

    group._barrel = barrel;
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createPersonnelShelter() {
    var group = new THREE.Group();

    var base = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 12), materials.concrete);
    base.position.set(30, 4, -50);
    base.castShadow = true;
    group.add(base);

    var roof = new THREE.Mesh(new THREE.BoxGeometry(17, 6, 14), materials.steel);
    roof.position.set(30, 10, -50);
    roof.rotation.z = Math.PI / 12;
    roof.castShadow = true;
    group.add(roof);

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createTorpedoStorage() {
    var group = new THREE.Group();

    var bunker = new THREE.Mesh(new THREE.BoxGeometry(25, 6, 15), materials.concrete);
    bunker.position.set(-60, 3, 30);
    bunker.castShadow = true;
    group.add(bunker);

    for (var i = 0; i < 4; i++) {
      var torpedo = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 12, 12), materials.steel);
      torpedo.rotation.z = Math.PI / 2;
      torpedo.position.set(-65 + i * 12, 5, 30);
      torpedo.castShadow = true;
      group.add(torpedo);
    }

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createMooringBollard() {
    var geom = new THREE.SphereGeometry(3, 16, 12);
    var mesh = new THREE.Mesh(geom, materials.steel);
    mesh.position.set(20, 1.5, -20);
    mesh.castShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createHelipad() {
    var group = new THREE.Group();

    var pad = new THREE.Mesh(new THREE.BoxGeometry(25, 1, 25), materials.white);
    pad.position.set(-30, 0.5, -70);
    pad.castShadow = true;
    group.add(pad);

    var points = [];
    points.push(new THREE.Vector3(-12, 0.6, 0));
    points.push(new THREE.Vector3(12, 0.6, 0));
    var lineH1 = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 }));
    lineH1.position.set(-30, 0, -70);
    group.add(lineH1);

    var points2 = [];
    points2.push(new THREE.Vector3(0, 0.6, -12));
    points2.push(new THREE.Vector3(0, 0.6, 12));
    var lineH2 = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points2), new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 }));
    lineH2.position.set(-30, 0, -70);
    group.add(lineH2);

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createArcticTroops() {
    var group = new THREE.Group();

    for (var i = 0; i < 5; i++) {
      var soldier = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 1), new THREE.MeshStandardMaterial({ color: 0xfafafa }));
      soldier.position.set(40 + i * 5, 2, 10);
      soldier.castShadow = true;
      group.add(soldier);
    }

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createSubmarineCrew() {
    var group = new THREE.Group();

    for (var i = 0; i < 3; i++) {
      var crew = new THREE.Mesh(new THREE.BoxGeometry(1, 3.5, 1), new THREE.MeshStandardMaterial({ color: 0x333333 }));
      crew.position.set(-30 + i * 3, 3, 15);
      crew.castShadow = true;
      group.add(crew);
    }

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createDockSecurity() {
    var group = new THREE.Group();

    for (var i = 0; i < 2; i++) {
      var guard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
      guard.position.set(50 + i * 4, 1.9, 45);
      guard.castShadow = true;
      group.add(guard);
    }

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createSnowParticles() {
    var particles = [];
    for (var i = 0; i < 30; i++) {
      var snowflake = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 4, 4),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x666666 })
      );
      snowflake.position.set(
        Math.random() * 200 - 100,
        Math.random() * 80 + 20,
        Math.random() * 150 - 75
      );
      snowflake.castShadow = true;
      scene.add(snowflake);
      objects.push(snowflake);
      particles.push({ mesh: snowflake, vx: (Math.random() - 0.5) * 0.5, vy: -0.3, vz: (Math.random() - 0.5) * 0.5 });
    }
    return particles;
  }

  function updateAnimations(delta) {
    state.time += delta;

    objects.forEach(function(obj) {
      if (obj._dome) {
        obj._dome.rotation.y += delta * 0.5;
      }
      if (obj._barrel) {
        obj._barrel.rotation.z = Math.sin(state.time * 1.2) * 0.5;
      }
      if (obj._originalHatch1 && obj._originalHatch2) {
        obj._originalHatch1.scale.y = 0.8 + Math.sin(state.time * 2) * 0.2;
        obj._originalHatch2.scale.y = 0.8 + Math.cos(state.time * 2) * 0.2;
      }
    });
  }

  function updateSnowParticles(particles, delta) {
    particles.forEach(function(p) {
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;

      if (p.mesh.position.y < -10) {
        p.mesh.position.y = 80;
      }
      if (p.mesh.position.x < -120) p.mesh.position.x = 120;
      if (p.mesh.position.x > 120) p.mesh.position.x = -120;
      if (p.mesh.position.z < -90) p.mesh.position.z = 90;
      if (p.mesh.position.z > 90) p.mesh.position.z = -90;
    });
  }

  function createHUD() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('SUBS IN PORT: ' + state.subsInPort, 20, 60);
    ctx.fillText('SUBS DESTROYED: ' + state.subsDestroyed, 20, 120);
    ctx.fillText('HARBOR LOCKED: ' + (state.harborLocked ? 'YES' : 'NO'), 20, 180);

    var texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];

    initMaterials();

    scene.background = new THREE.Color(0xccddff);
    scene.fog = new THREE.Fog(0xaaccee, 150, 300);

    var light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(50, 60, 50);
    light.castShadow = true;
    light.shadow.camera.left = -150;
    light.shadow.camera.right = 150;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x8899ff, 0.4);
    scene.add(ambientLight);

    createIceSheet();
    createIcebreakerShip();
    createSubmarine();
    createIceChannel();
    createCrane();
    createFuelDepot();
    createWarehouse();
    createArtillery();
    createRadarDome();
    createIcePressureRidge();
    createAAGun();
    createPersonnelShelter();
    createTorpedoStorage();
    createMooringBollard();
    createHelipad();
    createArcticTroops();
    createSubmarineCrew();
    createDockSecurity();

    window.FrozenHarbor._snowParticles = createSnowParticles();
    window.FrozenHarbor._hudTexture = createHUD();

    document.addEventListener('keydown', function(e) {
      if (e.key === 'f' || e.key === 'F') {
        var now = Date.now();
        if (now - state.lastKeyF < 400) {
          state.hudVisible = !state.hudVisible;
          console.log('[FrozenHarbor] HUD ' + (state.hudVisible ? 'enabled' : 'disabled'));
          state.lastKeyF = 0;
        } else {
          state.lastKeyF = now;
        }
      }
      if ((e.key === 'h' || e.key === 'H') && Date.now() - state.lastKeyF < 400) {
        state.hudVisible = !state.hudVisible;
        console.log('[FrozenHarbor] HUD toggled');
      }
    });
  }

  function update(delta) {
    if (window.FrozenHarbor._snowParticles) {
      updateSnowParticles(window.FrozenHarbor._snowParticles, delta);
    }
    updateAnimations(delta);
  }

  function reset() {
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    objects = [];
    state.subsInPort = 3;
    state.subsDestroyed = 0;
    state.harborLocked = false;
    state.hudVisible = true;
    state.time = 0;
    state.lastKeyF = 0;
    window.FrozenHarbor._snowParticles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
