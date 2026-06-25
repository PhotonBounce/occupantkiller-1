window.WarMuseum = (function() {
  'use strict';

  var objects = [];
  var fires = [];
  var sparks = [];
  var particleSystems = [];

  function buildWalls(scene) {
    var floorGeo = new THREE.BoxGeometry(60, 0.5, 50);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0;
    scene.add(floor);
    objects.push(floor);

    var leftWallGeo = new THREE.BoxGeometry(1, 12, 50);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-30, 6, 0);
    scene.add(leftWall);
    objects.push(leftWall);

    var rightWall = new THREE.Mesh(leftWallGeo, wallMat);
    rightWall.position.set(30, 6, 0);
    scene.add(rightWall);
    objects.push(rightWall);

    var backWallGeo = new THREE.BoxGeometry(60, 12, 1);
    var backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 6, -25);
    scene.add(backWall);
    objects.push(backWall);

    var ceilingGeo = new THREE.BoxGeometry(60, 0.5, 50);
    var ceilingMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 12;
    scene.add(ceiling);
    objects.push(ceiling);

    var holeGeo = new THREE.BoxGeometry(8, 0.5, 10);
    var holeMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.set(5, 11.75, 10);
    scene.add(hole);
    objects.push(hole);
  }

  function buildColumns(scene) {
    for (var i = 0; i < 4; i++) {
      var colGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 16);
      var colMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
      var col = new THREE.Mesh(colGeo, colMat);
      col.position.set(-15 + i * 10, 6, -15 + i * 8);
      scene.add(col);
      objects.push(col);
    }
  }

  function buildTankExhibit(scene) {
    var turretGeo = new THREE.CylinderGeometry(2, 2.5, 3, 24);
    var metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var turret = new THREE.Mesh(turretGeo, metalMat);
    turret.position.set(-10, 3, 15);
    scene.add(turret);
    objects.push(turret);

    var hullGeo = new THREE.BoxGeometry(6, 2, 8);
    var hull = new THREE.Mesh(hullGeo, metalMat);
    hull.position.set(-10, 1.5, 15);
    scene.add(hull);
    objects.push(hull);

    var gunGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 12);
    var gun = new THREE.Mesh(gunGeo, metalMat);
    gun.rotation.z = Math.PI / 6;
    gun.position.set(-7, 4.5, 15);
    scene.add(gun);
    objects.push(gun);
  }

  function buildWeaponCases(scene) {
    for (var i = 0; i < 6; i++) {
      var caseGeo = new THREE.BoxGeometry(2, 2.5, 1.5);
      var caseMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      var caseBox = new THREE.Mesh(caseGeo, caseMat);
      caseBox.position.set(10 + i * 3, 1.5, -10);
      scene.add(caseBox);
      objects.push(caseBox);

      var rifleGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.8, 8);
      var rifleMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var rifle = new THREE.Mesh(rifleGeo, rifleMat);
      rifle.rotation.z = Math.PI / 4;
      rifle.position.set(10 + i * 3, 2.5, -10);
      scene.add(rifle);
      objects.push(rifle);
    }
  }

  function buildCrashedJet(scene) {
    var fuselageGeo = new THREE.CylinderGeometry(1.2, 0.8, 15, 12);
    var jetMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    var fuselage = new THREE.Mesh(fuselageGeo, jetMat);
    fuselage.rotation.z = 0.4;
    fuselage.position.set(15, 8, 8);
    scene.add(fuselage);
    objects.push(fuselage);

    var wingGeo = new THREE.BoxGeometry(12, 0.3, 2);
    var wing = new THREE.Mesh(wingGeo, jetMat);
    wing.position.set(15, 7, 10);
    scene.add(wing);
    objects.push(wing);

    var coneGeo = new THREE.ConeGeometry(0.8, 2, 16);
    var cone = new THREE.Mesh(coneGeo, jetMat);
    cone.position.set(10, 15, 5);
    scene.add(cone);
    objects.push(cone);
  }

  function buildSniperNests(scene) {
    for (var i = 0; i < 2; i++) {
      var platformGeo = new THREE.BoxGeometry(4, 0.4, 4);
      var platformMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(-28 + i * 56, 10, -20);
      scene.add(platform);
      objects.push(platform);

      var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
      var post = new THREE.Mesh(postGeo, new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
      post.position.set(-28 + i * 56, 8.5, -20);
      scene.add(post);
      objects.push(post);
    }
  }

  function buildExhibitStands(scene) {
    for (var i = 0; i < 5; i++) {
      var standGeo = new THREE.BoxGeometry(3, 0.3, 3);
      var standMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      var stand = new THREE.Mesh(standGeo, standMat);
      stand.rotation.z = Math.random() * 0.3;
      stand.position.set(-15 + i * 8, 0.15, 5);
      scene.add(stand);
      objects.push(stand);
    }
  }

  function buildElectricalFixtures(scene) {
    for (var i = 0; i < 4; i++) {
      var fixtureGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var fixtureMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
      var fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(-20 + i * 15, 11.5, 0);
      scene.add(fixture);
      objects.push(fixture);
      sparks.push({ obj: fixture, time: 0 });
    }
  }

  function buildBloodStains(scene) {
    for (var i = 0; i < 8; i++) {
      var stainGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var stainMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
      var stain = new THREE.Mesh(stainGeo, stainMat);
      stain.position.set(-25 + Math.random() * 50, 0.05, -20 + Math.random() * 40);
      scene.add(stain);
      objects.push(stain);
    }
  }

  function createFireParticles(pos) {
    var fireGeo = new THREE.SphereGeometry(0.2, 4, 4);
    var fireMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
    var particle = new THREE.Mesh(fireGeo, fireMat);
    particle.position.copy(pos);
    return {
      mesh: particle,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 3 + 2,
      vz: (Math.random() - 0.5) * 2,
      life: 1
    };
  }

  function createSparkParticles(pos) {
    var sparkGeo = new THREE.SphereGeometry(0.1, 4, 4);
    var sparkMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var particle = new THREE.Mesh(sparkGeo, sparkMat);
    particle.position.copy(pos);
    return {
      mesh: particle,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      vz: (Math.random() - 0.5) * 4,
      life: 0.5
    };
  }

  function init(scene, camera) {
    objects = [];
    fires = [];
    sparks = [];
    particleSystems = [];

    buildWalls(scene);
    buildColumns(scene);
    buildTankExhibit(scene);
    buildWeaponCases(scene);
    buildCrashedJet(scene);
    buildSniperNests(scene);
    buildExhibitStands(scene);
    buildElectricalFixtures(scene);
    buildBloodStains(scene);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 15, 20);
    scene.add(directionalLight);

    var spotLight = new THREE.SpotLight(0xff6600, 1, 60, Math.PI / 4, 0.8, 1);
    spotLight.position.set(-20, 10, 15);
    scene.add(spotLight);
  }

  function update(delta, scene) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < sparks.length; i++) {
      sparks[i].time += delta;
      if (sparks[i].time > 0.2) {
        sparks[i].time = 0;
        for (var j = 0; j < 3; j++) {
          var spark = createSparkParticles(sparks[i].obj.position);
          scene.add(spark.mesh);
          particleSystems.push(spark);
        }
      }
    }

    for (var i = particleSystems.length - 1; i >= 0; i--) {
      var ps = particleSystems[i];
      ps.life -= delta * 2;

      ps.mesh.position.x += ps.vx * delta;
      ps.mesh.position.y += ps.vy * delta;
      ps.mesh.position.z += ps.vz * delta;

      var opacity = Math.max(0, ps.life);
      ps.mesh.material.opacity = opacity;

      if (ps.life <= 0) {
        scene.remove(ps.mesh);
        particleSystems.splice(i, 1);
      }
    }

    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData && objects[i].userData.isJet) {
        objects[i].rotation.z += 0.01;
      }
    }
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }

    for (var i = particleSystems.length - 1; i >= 0; i--) {
      scene.remove(particleSystems[i].mesh);
    }

    objects = [];
    fires = [];
    sparks = [];
    particleSystems = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
