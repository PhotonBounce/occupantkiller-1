window.GlencoeKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var alarmLight = null;

  var module = {
    objects: objects,
    lights: lights,

    init: function(scene) {
      var self = this;

      // Signal Hill keep - dark highland stone box
      var keepGeometry = new THREE.BoxGeometry(10, 16, 10);
      var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x665544 });
      var keep = new THREE.Mesh(keepGeometry, keepMaterial);
      keep.position.set(0, 8, 0);
      scene.add(keep);
      objects.push(keep);

      // Clan MacIain memorial wall - partial ruin
      var wallGeometry = new THREE.BoxGeometry(1, 8, 14);
      var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x667755 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(-20, 4, 5);
      scene.add(wall);
      objects.push(wall);

      // Three Sisters cliff faces - tall dark boxes at different angles
      var cliffGeometry1 = new THREE.BoxGeometry(2, 30, 14);
      var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });

      var cliff1 = new THREE.Mesh(cliffGeometry1, cliffMaterial);
      cliff1.position.set(-35, 15, 20);
      cliff1.rotation.z = 0.1;
      scene.add(cliff1);
      objects.push(cliff1);

      var cliff2 = new THREE.Mesh(cliffGeometry1, cliffMaterial);
      cliff2.position.set(-25, 15, 35);
      cliff2.rotation.z = -0.15;
      scene.add(cliff2);
      objects.push(cliff2);

      var cliff3 = new THREE.Mesh(cliffGeometry1, cliffMaterial);
      cliff3.position.set(-15, 15, 25);
      cliff3.rotation.z = 0.12;
      scene.add(cliff3);
      objects.push(cliff3);

      // Mountain river ford crossing - flat stone box
      var riverGeometry = new THREE.BoxGeometry(20, 0.5, 6);
      var riverMaterial = new THREE.MeshLambertMaterial({ color: 0x777766 });
      var river = new THREE.Mesh(riverGeometry, riverMaterial);
      river.position.set(15, 0.25, -5);
      scene.add(river);
      objects.push(river);

      // Military checkpoint hut - olive green
      var hutGeometry = new THREE.BoxGeometry(8, 4, 6);
      var hutMaterial = new THREE.MeshLambertMaterial({ color: 0x5a6040 });
      var hut = new THREE.Mesh(hutGeometry, hutMaterial);
      hut.position.set(30, 2, -20);
      scene.add(hut);
      objects.push(hut);

      // Red alarm light at checkpoint
      var alarmGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var alarmMesh = new THREE.Mesh(alarmGeometry, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
      alarmMesh.position.set(30, 6, -20);
      scene.add(alarmMesh);
      objects.push(alarmMesh);

      alarmLight = new THREE.PointLight(0xff0000, 1, 50);
      alarmLight.position.set(30, 6, -20);
      scene.add(alarmLight);
      lights.push(alarmLight);

      // Burned MacDonald cottage ruins - three charred boxes
      var ruinsGeometry = new THREE.BoxGeometry(6, 2, 5);
      var ruinsMaterial = new THREE.MeshLambertMaterial({ color: 0x333322 });

      var ruins1 = new THREE.Mesh(ruinsGeometry, ruinsMaterial);
      ruins1.position.set(-40, 1, -15);
      scene.add(ruins1);
      objects.push(ruins1);

      var ruins2 = new THREE.Mesh(ruinsGeometry, ruinsMaterial);
      ruins2.position.set(-30, 1, -20);
      scene.add(ruins2);
      objects.push(ruins2);

      var ruins3 = new THREE.Mesh(ruinsGeometry, ruinsMaterial);
      ruins3.position.set(-35, 1, -8);
      scene.add(ruins3);
      objects.push(ruins3);

      // Chevaux-de-frise obstacle field - grid of angled spike boxes
      var spikeGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
      var spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

      var spacing = 3;
      for (var x = -15; x <= 15; x += spacing) {
        for (var z = -30; z <= -10; z += spacing) {
          var spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
          spike.position.set(x, 1.5, z);
          spike.rotation.x = 0.3;
          spike.rotation.z = 0.2;
          scene.add(spike);
          objects.push(spike);
        }
      }

      // Helicopter landing zone - flat concrete with H marker
      var hzoneGeometry = new THREE.BoxGeometry(14, 0.3, 14);
      var hzoneMaterial = new THREE.MeshLambertMaterial({ color: 0x778877 });
      var hzone = new THREE.Mesh(hzoneGeometry, hzoneMaterial);
      hzone.position.set(50, 0.15, 0);
      scene.add(hzone);
      objects.push(hzone);

      // H marker - white boxes
      var markerGeometry = new THREE.BoxGeometry(1, 0.4, 3);
      var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

      var markerH1 = new THREE.Mesh(markerGeometry, markerMaterial);
      markerH1.position.set(50, 0.5, -2);
      scene.add(markerH1);
      objects.push(markerH1);

      var markerH2 = new THREE.Mesh(markerGeometry, markerMaterial);
      markerH2.position.set(50, 0.5, 2);
      scene.add(markerH2);
      objects.push(markerH2);

      // Hidden sniper nest in rocky outcrop - sandbag box
      var sandGeometry = new THREE.BoxGeometry(2, 1.5, 2);
      var sandMaterial = new THREE.MeshLambertMaterial({ color: 0xC2A06E });
      var sandbag = new THREE.Mesh(sandGeometry, sandMaterial);
      sandbag.position.set(-50, 8, 30);
      scene.add(sandbag);
      objects.push(sandbag);

      // Rock behind sniper nest
      var rockGeometry = new THREE.SphereGeometry(4, 8, 8);
      var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(-55, 6, 35);
      scene.add(rock);
      objects.push(rock);

      // Grim grey ambient light
      var ambientLight = new THREE.AmbientLight(0x8899AA, 0.6);
      scene.add(ambientLight);
      lights.push(ambientLight);
    },

    update: function(delta) {
      if (alarmLight) {
        var pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.75;
        alarmLight.intensity = pulse;
      }
    },

    reset: function(scene) {
      for (var i = 0; i < objects.length; i++) {
        scene.remove(objects[i]);
      }
      for (var i = 0; i < lights.length; i++) {
        scene.remove(lights[i]);
      }
      objects = [];
      lights = [];
      alarmLight = null;
      module.objects = objects;
      module.lights = lights;
    }
  };

  return module;
}());
