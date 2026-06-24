window.AtlantisRuins = (function() {
  'use strict';

  var objects = [];
  var scene = null;
  var animatables = [];

  function init(sceneRef, camera) {
    scene = sceneRef;
    objects = [];
    animatables = [];

    var temple1 = createTempleSpire(new THREE.Vector3(-30, 0, -40));
    var temple2 = createTempleSpire(new THREE.Vector3(30, 0, -40));
    var temple3 = createTempleSpire(new THREE.Vector3(0, 0, -60));

    var dome = createMassiveDome(new THREE.Vector3(0, 15, -30));

    var column1 = createOrichalcumColumn(new THREE.Vector3(-20, 0, 0));
    var column2 = createOrichalcumColumn(new THREE.Vector3(20, 0, 0));
    var column3 = createOrichalcumColumn(new THREE.Vector3(-20, 0, -30));
    var column4 = createOrichalcumColumn(new THREE.Vector3(20, 0, -30));

    var panel1 = createWritingPanel(new THREE.Vector3(-35, 8, 20));
    var panel2 = createWritingPanel(new THREE.Vector3(35, 8, 20));

    var road1 = createRoadSlab(new THREE.Vector3(-10, -2, 10));
    var road2 = createRoadSlab(new THREE.Vector3(0, -2, 10));
    var road3 = createRoadSlab(new THREE.Vector3(10, -2, 10));
    var road4 = createRoadSlab(new THREE.Vector3(-10, -2, -10));
    var road5 = createRoadSlab(new THREE.Vector3(0, -2, -10));
    var road6 = createRoadSlab(new THREE.Vector3(10, -2, -10));

    var crystal = createCrystalConductor(new THREE.Vector3(0, 12, 40));
    animatables.push({ type: 'crystal', mesh: crystal });

    var clam1 = createClamShell(new THREE.Vector3(-15, 5, 30));
    var clam2 = createClamShell(new THREE.Vector3(15, 5, 30));

    var robot = createRobotGuardian(new THREE.Vector3(0, 0, 50));
    animatables.push({ type: 'robot', mesh: robot });

    var coral1 = createCoralCluster(new THREE.Vector3(-25, -5, -50));
    animatables.push({ type: 'coral', mesh: coral1 });
    var coral2 = createCoralCluster(new THREE.Vector3(25, -5, -50));
    animatables.push({ type: 'coral', mesh: coral2 });
    var coral3 = createCoralCluster(new THREE.Vector3(0, -8, -70));
    animatables.push({ type: 'coral', mesh: coral3 });

    var airPocket = createAirPocket(new THREE.Vector3(0, 25, -80));
    animatables.push({ type: 'airPocket', mesh: airPocket });

    var wreck1 = createSunkenShip(new THREE.Vector3(-40, -10, 60));
    var wreck2 = createSunkenShip(new THREE.Vector3(40, -10, 60));

    var orb = createPowerOrb(new THREE.Vector3(0, 20, -100));
    animatables.push({ type: 'orb', mesh: orb });

    var barrier = createEnergyBarrier(new THREE.Vector3(0, 15, -120));
    animatables.push({ type: 'barrier', mesh: barrier });

    var trophy = createTrophyRoom(new THREE.Vector3(0, 8, 80));
  }

  function createTempleSpire(position) {
    var group = new THREE.Group();
    group.position.copy(position);

    var cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 10, 50, 16),
      new THREE.MeshStandardMaterial({ color: 0x2244AA, roughness: 0.8 })
    );
    cylinder.position.y = 25;
    group.add(cylinder);

    var cone = new THREE.Mesh(
      new THREE.ConeGeometry(8, 15, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a3380, roughness: 0.7 })
    );
    cone.position.y = 55;
    group.add(cone);

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createMassiveDome(position) {
    var dome = new THREE.Mesh(
      new THREE.SphereGeometry(40, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x334488, roughness: 0.9, metalness: 0.1 })
    );
    dome.position.copy(position);
    scene.add(dome);
    objects.push(dome);
    return dome;
  }

  function createOrichalcumColumn(position) {
    var cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 5, 35, 12),
      new THREE.MeshStandardMaterial({ color: 0xCC8822, roughness: 0.3, metalness: 0.8 })
    );
    cylinder.position.copy(position);
    cylinder.position.y = 17.5;
    scene.add(cylinder);
    objects.push(cylinder);
    return cylinder;
  }

  function createWritingPanel(position) {
    var group = new THREE.Group();
    group.position.copy(position);

    var panel = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x335577, roughness: 0.7 })
    );
    group.add(panel);

    var points = [
      new THREE.Vector3(-4, 2, 0.3),
      new THREE.Vector3(-2, 2, 0.3),
      new THREE.Vector3(-2, 0, 0.3),
      new THREE.Vector3(0, 0, 0.3),
      new THREE.Vector3(0, -2, 0.3),
      new THREE.Vector3(2, -2, 0.3),
      new THREE.Vector3(4, 0, 0.3),
      new THREE.Vector3(4, 2, 0.3)
    ];
    var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0x88AAFF, linewidth: 2 })
    );
    group.add(line);

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createRoadSlab(position) {
    var slab = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.95 })
    );
    slab.position.copy(position);
    scene.add(slab);
    objects.push(slab);
    return slab;
  }

  function createCrystalConductor(position) {
    var crystal = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 4, 20, 8),
      new THREE.MeshStandardMaterial({
        color: 0x0088FF,
        emissive: 0x0088FF,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.9
      })
    );
    crystal.position.copy(position);
    scene.add(crystal);
    objects.push(crystal);
    return crystal;
  }

  function createClamShell(position) {
    var clam = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xCCBBAA, roughness: 0.6 })
    );
    clam.position.copy(position);
    clam.scale.z = 0.5;
    scene.add(clam);
    objects.push(clam);
    return clam;
  }

  function createRobotGuardian(position) {
    var group = new THREE.Group();
    group.position.copy(position);

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(6, 12, 4),
      new THREE.MeshStandardMaterial({ color: 0x446666, roughness: 0.4, metalness: 0.7 })
    );
    body.position.y = 6;
    group.add(body);

    var head = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 3),
      new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.5, metalness: 0.6 })
    );
    head.position.y = 14;
    group.add(head);

    var armLeft = new THREE.Mesh(
      new THREE.BoxGeometry(2, 10, 2),
      new THREE.MeshStandardMaterial({ color: 0x446666, roughness: 0.4, metalness: 0.7 })
    );
    armLeft.position.set(-4, 8, 0);
    group.add(armLeft);

    var armRight = new THREE.Mesh(
      new THREE.BoxGeometry(2, 10, 2),
      new THREE.MeshStandardMaterial({ color: 0x446666, roughness: 0.4, metalness: 0.7 })
    );
    armRight.position.set(4, 8, 0);
    group.add(armRight);

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createCoralCluster(position) {
    var group = new THREE.Group();
    group.position.copy(position);

    var coral1 = new THREE.Mesh(
      new THREE.SphereGeometry(4, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xFF6644, roughness: 0.8 })
    );
    coral1.position.y = 0;
    group.add(coral1);

    var coral2 = new THREE.Mesh(
      new THREE.SphereGeometry(3, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x22AA44, roughness: 0.8 })
    );
    coral2.position.set(-3, 2, 0);
    group.add(coral2);

    var coral3 = new THREE.Mesh(
      new THREE.SphereGeometry(3, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x22AA44, roughness: 0.8 })
    );
    coral3.position.set(3, 2, 0);
    group.add(coral3);

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createAirPocket(position) {
    var bubble = new THREE.Mesh(
      new THREE.BoxGeometry(20, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0x001133,
        emissive: 0x88AAFF,
        emissiveIntensity: 0.3,
        roughness: 0.9,
        transparent: true,
        opacity: 0.3
      })
    );
    bubble.position.copy(position);
    scene.add(bubble);
    objects.push(bubble);
    return bubble;
  }

  function createSunkenShip(position) {
    var group = new THREE.Group();
    group.position.copy(position);

    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(15, 8, 40),
      new THREE.MeshStandardMaterial({ color: 0x334433, roughness: 0.95 })
    );
    hull.position.y = 0;
    group.add(hull);

    var mast = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 25, 8),
      new THREE.MeshStandardMaterial({ color: 0x223322, roughness: 0.9 })
    );
    mast.position.set(0, 12, 0);
    group.add(mast);

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createPowerOrb(position) {
    var orb = new THREE.Mesh(
      new THREE.SphereGeometry(5, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0044FF,
        emissive: 0x0044FF,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.9
      })
    );
    orb.position.copy(position);
    scene.add(orb);
    objects.push(orb);
    return orb;
  }

  function createEnergyBarrier(position) {
    var barrier = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 15, 2, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0088FF,
        emissive: 0x0088FF,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
      })
    );
    barrier.position.copy(position);
    scene.add(barrier);
    objects.push(barrier);
    return barrier;
  }

  function createTrophyRoom(position) {
    var group = new THREE.Group();
    group.position.copy(position);

    var base = new THREE.Mesh(
      new THREE.BoxGeometry(30, 2, 30),
      new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.7 })
    );
    base.position.y = 0;
    group.add(base);

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var x = Math.cos(angle) * 10;
      var z = Math.sin(angle) * 10;

      var statue = new THREE.Mesh(
        new THREE.SphereGeometry(2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.6, metalness: 0.3 })
      );
      statue.position.set(x, 2, z);
      group.add(statue);
    }

    scene.add(group);
    objects.push(group);
    return group;
  }

  function update(delta) {
    for (var i = 0; i < animatables.length; i++) {
      var anim = animatables[i];

      if (anim.type === 'crystal') {
        anim.mesh.rotation.y += delta * 0.5;
        var scale = 1 + Math.sin(Date.now() * 0.003) * 0.2;
        anim.mesh.scale.set(scale, scale, scale);
        var material = anim.mesh.material;
        material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.004) * 0.3;
      }

      if (anim.type === 'orb') {
        anim.mesh.rotation.y += delta * 1.2;
        anim.mesh.rotation.x += delta * 0.4;
        var orbMaterial = anim.mesh.material;
        orbMaterial.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.4;
      }

      if (anim.type === 'barrier') {
        var barrierMaterial = anim.mesh.material;
        barrierMaterial.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.006) * 0.35;
      }

      if (anim.type === 'airPocket') {
        var bubbles = anim.mesh.children || [];
        anim.mesh.position.y += Math.sin(Date.now() * 0.002) * 0.01;
        var airMaterial = anim.mesh.material;
        airMaterial.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.005) * 0.15;
      }

      if (anim.type === 'coral') {
        anim.mesh.rotation.z += Math.sin(Date.now() * 0.002) * 0.02;
      }

      if (anim.type === 'robot') {
        anim.mesh.rotation.y = Math.sin(Date.now() * 0.001) * 0.3;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatables = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
