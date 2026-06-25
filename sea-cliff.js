window.SeaCliff = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var lighthouses = [];
	var waveParticles = [];
	var ships = [];
	var cliffElements = {};
	var time = 0;

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		time = 0;

		createCliffTerrain();
		createOcean();
		createLighthouses();
		createBunkers();
		createRopeLadders();
		createSeaCave();
		createWaveSpray();
		createCoastalPath();
		createNavalVessel();
		createRockArch();
		createSeabirdNests();
	}

	function createCliffTerrain() {
		var cliffGeometry = new THREE.BoxGeometry(300, 400, 150);
		var cliffMaterial = new THREE.MeshPhongMaterial({
			color: 0x6B5344,
			shininess: 20
		});
		var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
		cliff.position.set(0, 150, -100);
		cliff.castShadow = true;
		cliff.receiveShadow = true;
		scene.add(cliff);
		cliffElements.mainCliff = cliff;

		var topCliffGeometry = new THREE.BoxGeometry(350, 80, 200);
		var topCliff = new THREE.Mesh(topCliffGeometry, cliffMaterial);
		topCliff.position.set(0, 320, -50);
		topCliff.castShadow = true;
		topCliff.receiveShadow = true;
		scene.add(topCliff);
		cliffElements.topCliff = topCliff;
	}

	function createOcean() {
		var oceanGeometry = new THREE.BoxGeometry(500, 150, 300);
		var oceanMaterial = new THREE.MeshPhongMaterial({
			color: 0x1a4d6d,
			shininess: 60,
			emissive: 0x0d2636
		});
		var ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
		ocean.position.set(0, -100, 0);
		ocean.receiveShadow = true;
		scene.add(ocean);
		cliffElements.ocean = ocean;

		var waveGeometry = new THREE.BoxGeometry(520, 40, 320);
		var waveMaterial = new THREE.MeshPhongMaterial({
			color: 0x4a90c4,
			shininess: 80,
			opacity: 0.8,
			transparent: true
		});
		var waves = new THREE.Mesh(waveGeometry, waveMaterial);
		waves.position.set(0, -50, 0);
		waves.receiveShadow = true;
		scene.add(waves);
		cliffElements.waves = waves;
	}

	function createLighthouses() {
		var lighthouse1Geometry = new THREE.CylinderGeometry(25, 30, 180, 32);
		var lighthouseMaterial = new THREE.MeshPhongMaterial({
			color: 0xffffff,
			shininess: 40
		});
		var lighthouse1 = new THREE.Mesh(lighthouse1Geometry, lighthouseMaterial);
		lighthouse1.position.set(-120, 180, -80);
		lighthouse1.castShadow = true;
		lighthouse1.receiveShadow = true;
		scene.add(lighthouse1);

		var beaconGeometry = new THREE.SphereGeometry(20, 32, 32);
		var beaconMaterial = new THREE.MeshPhongMaterial({
			color: 0xffff00,
			emissive: 0xffff00,
			shininess: 100
		});
		var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
		beacon.position.set(-120, 270, -80);
		beacon.castShadow = true;
		scene.add(beacon);

		lighthouses.push({
			tower: lighthouse1,
			beacon: beacon,
			angle: 0
		});

		var lighthouse2Geometry = new THREE.CylinderGeometry(20, 25, 150, 32);
		var lighthouse2 = new THREE.Mesh(lighthouse2Geometry, lighthouseMaterial);
		lighthouse2.position.set(140, 160, -100);
		lighthouse2.castShadow = true;
		lighthouse2.receiveShadow = true;
		scene.add(lighthouse2);

		var beacon2 = new THREE.Mesh(beaconGeometry, beaconMaterial);
		beacon2.position.set(140, 245, -100);
		beacon2.castShadow = true;
		scene.add(beacon2);

		lighthouses.push({
			tower: lighthouse2,
			beacon: beacon2,
			angle: Math.PI
		});
	}

	function createBunkers() {
		var bunkerCount = 3;
		for (var i = 0; i < bunkerCount; i++) {
			var bunkerGeometry = new THREE.BoxGeometry(50, 40, 60);
			var bunkerMaterial = new THREE.MeshPhongMaterial({
				color: 0x4a5568,
				shininess: 15
			});
			var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
			bunker.position.set(-100 + i * 100, 300, -40 + i * 20);
			bunker.castShadow = true;
			bunker.receiveShadow = true;
			scene.add(bunker);

			var slitGeometry = new THREE.BoxGeometry(15, 8, 5);
			var slitMaterial = new THREE.MeshPhongMaterial({
				color: 0x000000,
				shininess: 0
			});
			var slit = new THREE.Mesh(slitGeometry, slitMaterial);
			slit.position.set(-100 + i * 100, 310, -20 + i * 20);
			slit.castShadow = true;
			scene.add(slit);
		}
	}

	function createRopeLadders() {
		var ladderCount = 2;
		for (var i = 0; i < ladderCount; i++) {
			var ladderX = -80 + i * 160;
			var ladderZ = -60;
			var ropePoints = [
				new THREE.Vector3(ladderX - 10, 250, ladderZ),
				new THREE.Vector3(ladderX - 10, 0, ladderZ),
				new THREE.Vector3(ladderX + 10, 0, ladderZ),
				new THREE.Vector3(ladderX + 10, 250, ladderZ)
			];

			var ropeGeometry = new THREE.BufferGeometry().setFromPoints([
				ropePoints[0], ropePoints[1],
				ropePoints[2], ropePoints[3]
			]);
			var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 3 });
			var ropes = new THREE.LineSegments(ropeGeometry, ropeMaterial);
			scene.add(ropes);

			var rungCount = 12;
			for (var j = 0; j < rungCount; j++) {
				var rungY = 250 - (j / rungCount) * 250;
				var rungGeometry = new THREE.BoxGeometry(25, 3, 5);
				var rungMaterial = new THREE.MeshPhongMaterial({
					color: 0xD2B48C,
					shininess: 10
				});
				var rung = new THREE.Mesh(rungGeometry, rungMaterial);
				rung.position.set(ladderX, rungY, ladderZ);
				rung.castShadow = true;
				rung.receiveShadow = true;
				scene.add(rung);
			}
		}
	}

	function createSeaCave() {
		var caveGeometry = new THREE.BoxGeometry(120, 100, 80);
		var caveMaterial = new THREE.MeshPhongMaterial({
			color: 0x3d3d3d,
			shininess: 10
		});
		var cave = new THREE.Mesh(caveGeometry, caveMaterial);
		cave.position.set(0, -20, 50);
		cave.castShadow = true;
		cave.receiveShadow = true;
		scene.add(cave);

		var caveEntranceGeometry = new THREE.BoxGeometry(80, 60, 10);
		var entranceMaterial = new THREE.MeshPhongMaterial({
			color: 0x1a1a1a,
			shininess: 5
		});
		var entrance = new THREE.Mesh(caveEntranceGeometry, entranceMaterial);
		entrance.position.set(0, -10, 90);
		entrance.castShadow = true;
		scene.add(entrance);
	}

	function createWaveSpray() {
		var sprayCount = 30;
		for (var i = 0; i < sprayCount; i++) {
			var dropGeometry = new THREE.SphereGeometry(2, 8, 8);
			var dropMaterial = new THREE.MeshPhongMaterial({
				color: 0x87CEEB,
				shininess: 60,
				transparent: true,
				opacity: 0.7
			});
			var drop = new THREE.Mesh(dropGeometry, dropMaterial);
			drop.position.set(
				Math.random() * 300 - 150,
				Math.random() * 100,
				Math.random() * 100 - 150
			);
			scene.add(drop);

			waveParticles.push({
				mesh: drop,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.8,
				vz: (Math.random() - 0.5) * 0.5,
				lifespan: Math.random() * 3 + 2,
				age: 0
			});
		}
	}

	function createCoastalPath() {
		var pathSegments = 5;
		for (var i = 0; i < pathSegments; i++) {
			var pathGeometry = new THREE.BoxGeometry(40, 5, 80);
			var pathMaterial = new THREE.MeshPhongMaterial({
				color: 0x8B7355,
				shininess: 15
			});
			var path = new THREE.Mesh(pathGeometry, pathMaterial);
			path.position.set(-150 + i * 75, 310, -30 - i * 30);
			path.castShadow = true;
			path.receiveShadow = true;
			scene.add(path);
		}
	}

	function createNavalVessel() {
		var hullGeometry = new THREE.BoxGeometry(120, 80, 300);
		var hullMaterial = new THREE.MeshPhongMaterial({
			color: 0x2C3E50,
			shininess: 25
		});
		var hull = new THREE.Mesh(hullGeometry, hullMaterial);
		hull.position.set(300, -60, 100);
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);

		var turretCount = 2;
		for (var i = 0; i < turretCount; i++) {
			var turretGeometry = new THREE.CylinderGeometry(20, 25, 60, 32);
			var turretMaterial = new THREE.MeshPhongMaterial({
				color: 0x34495E,
				shininess: 20
			});
			var turret = new THREE.Mesh(turretGeometry, turretMaterial);
			turret.position.set(300 - 40 + i * 80, 20, 50 + i * 60);
			turret.castShadow = true;
			turret.receiveShadow = true;
			scene.add(turret);

			var gunGeometry = new THREE.CylinderGeometry(5, 6, 50, 16);
			var gunMaterial = new THREE.MeshPhongMaterial({
				color: 0x1C2833,
				shininess: 30
			});
			var gun = new THREE.Mesh(gunGeometry, gunMaterial);
			gun.position.set(300 - 40 + i * 80, 50, 50 + i * 60);
			gun.castShadow = true;
			scene.add(gun);
		}

		ships.push({
			hull: hull,
			x: 300,
			z: 100,
			angle: 0
		});
	}

	function createRockArch() {
		var archLeftGeometry = new THREE.BoxGeometry(30, 150, 120);
		var archMaterial = new THREE.MeshPhongMaterial({
			color: 0x6B5344,
			shininess: 15
		});
		var archLeft = new THREE.Mesh(archLeftGeometry, archMaterial);
		archLeft.position.set(-80, 120, 150);
		archLeft.castShadow = true;
		archLeft.receiveShadow = true;
		scene.add(archLeft);

		var archRightGeometry = new THREE.BoxGeometry(30, 150, 120);
		var archRight = new THREE.Mesh(archRightGeometry, archMaterial);
		archRight.position.set(80, 120, 150);
		archRight.castShadow = true;
		archRight.receiveShadow = true;
		scene.add(archRight);

		var archTopGeometry = new THREE.BoxGeometry(200, 40, 120);
		var archTop = new THREE.Mesh(archTopGeometry, archMaterial);
		archTop.position.set(0, 220, 150);
		archTop.castShadow = true;
		archTop.receiveShadow = true;
		scene.add(archTop);
	}

	function createSeabirdNests() {
		var nestPositions = [
			{ x: -150, y: 200, z: -30 },
			{ x: 100, y: 180, z: -60 },
			{ x: 0, y: 250, z: 20 }
		];

		nestPositions.forEach(function(pos) {
			var eggGeometry = new THREE.SphereGeometry(3, 16, 16);
			var eggMaterial = new THREE.MeshPhongMaterial({
				color: 0xF0E68C,
				shininess: 30
			});

			for (var i = 0; i < 3; i++) {
				var egg = new THREE.Mesh(eggGeometry, eggMaterial);
				egg.position.set(
					pos.x + (Math.random() - 0.5) * 20,
					pos.y,
					pos.z + (Math.random() - 0.5) * 15
				);
				egg.castShadow = true;
				scene.add(egg);
			}

			var birdGeometry = new THREE.BoxGeometry(4, 3, 8);
			var birdMaterial = new THREE.MeshPhongMaterial({
				color: 0x8B4513,
				shininess: 20
			});
			var bird = new THREE.Mesh(birdGeometry, birdMaterial);
			bird.position.set(pos.x, pos.y + 5, pos.z);
			bird.castShadow = true;
			scene.add(bird);
		});
	}

	function update(delta) {
		time += delta;

		lighthouses.forEach(function(lh) {
			lh.angle += delta * 0.5;
			lh.beacon.position.x = lh.tower.position.x + Math.cos(lh.angle) * 40;
			lh.beacon.position.z = lh.tower.position.z + Math.sin(lh.angle) * 40;
		});

		if (cliffElements.ocean) {
			cliffElements.ocean.position.y = -100 + Math.sin(time * 0.3) * 8;
		}

		if (cliffElements.waves) {
			cliffElements.waves.position.y = -50 + Math.sin(time * 0.4) * 6 + Math.cos(time * 0.25) * 4;
			cliffElements.waves.rotation.z = Math.sin(time * 0.2) * 0.05;
		}

		waveParticles.forEach(function(particle, index) {
			particle.age += delta;
			particle.mesh.position.x += particle.vx;
			particle.mesh.position.y += particle.vy - delta * 0.5;
			particle.mesh.position.z += particle.vz;

			var alpha = 1 - (particle.age / particle.lifespan);
			particle.mesh.material.opacity = alpha * 0.7;

			if (particle.age > particle.lifespan) {
				scene.remove(particle.mesh);
				waveParticles.splice(index, 1);
			}
		});

		if (waveParticles.length < 30 && Math.random() < 0.3) {
			var dropGeometry = new THREE.SphereGeometry(2, 8, 8);
			var dropMaterial = new THREE.MeshPhongMaterial({
				color: 0x87CEEB,
				shininess: 60,
				transparent: true,
				opacity: 0.7
			});
			var drop = new THREE.Mesh(dropGeometry, dropMaterial);
			drop.position.set(
				Math.random() * 300 - 150,
				Math.random() * 80 + 20,
				Math.random() * 100 - 150
			);
			scene.add(drop);

			waveParticles.push({
				mesh: drop,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.8,
				vz: (Math.random() - 0.5) * 0.5,
				lifespan: Math.random() * 3 + 2,
				age: 0
			});
		}

		ships.forEach(function(ship) {
			ship.angle += delta * 0.1;
			ship.x = 300 + Math.sin(ship.angle) * 100;
			ship.z = 100 + Math.cos(ship.angle) * 80;
			ship.hull.position.x = ship.x;
			ship.hull.position.z = ship.z;
			ship.hull.position.y = -60 + Math.sin(time * 0.4) * 5;
		});
	}

	function reset() {
		time = 0;
		lighthouses.forEach(function(lh) {
			lh.angle = 0;
		});
		waveParticles.forEach(function(particle) {
			scene.remove(particle.mesh);
		});
		waveParticles = [];
		ships.forEach(function(ship) {
			ship.angle = 0;
		});
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
