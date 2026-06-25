window.CraterWar = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animations = {
		satellites: [],
		glowBoxes: [],
		radarDishes: [],
		pulseLights: []
	};

	function buildCraterRim() {
		var rimGroup = [];
		var rockPositions = [
			{ x: 0, z: 50, s: 3 },
			{ x: 15, z: 48, s: 2.8 },
			{ x: 28, z: 44, s: 3.2 },
			{ x: 38, z: 38, s: 2.9 },
			{ x: 48, z: 28, s: 3.1 },
			{ x: 50, z: 15, s: 3.0 },
			{ x: 48, z: 0, s: 2.7 },
			{ x: 50, z: -15, s: 3.2 },
			{ x: 48, z: -28, s: 2.8 },
			{ x: 38, z: -38, s: 3.0 },
			{ x: 28, z: -44, s: 3.1 },
			{ x: 15, z: -48, s: 2.9 },
			{ x: 0, z: -50, s: 3.0 },
			{ x: -15, z: -48, s: 3.2 },
			{ x: -28, z: -44, s: 2.8 },
			{ x: -38, z: -38, s: 3.0 },
			{ x: -48, z: -28, s: 3.1 },
			{ x: -50, z: -15, s: 2.9 },
			{ x: -48, z: 0, s: 3.0 },
			{ x: -50, z: 15, s: 3.2 },
			{ x: -48, z: 28, s: 2.8 },
			{ x: -38, z: 38, s: 3.0 },
			{ x: -28, z: 44, s: 3.1 },
			{ x: -15, z: 48, s: 2.9 }
		];

		for (var i = 0; i < rockPositions.length; i++) {
			var pos = rockPositions[i];
			var geometry = new THREE.BoxGeometry(pos.s, pos.s * 1.5, pos.s);
			var material = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var rock = new THREE.Mesh(geometry, material);
			rock.position.set(pos.x, 2, pos.z);
			rock.rotation.x = Math.random() * 0.5;
			rock.rotation.z = Math.random() * 0.5;
			rock.castShadow = true;
			rock.receiveShadow = true;
			scene.add(rock);
			rimGroup.push(rock);
		}

		objects = objects.concat(rimGroup);
	}

	function buildGlowCrater() {
		var glowGroup = [];
		var positions = [
			{ x: -12, z: -12, size: 4 },
			{ x: 12, z: -12, size: 3.5 },
			{ x: -12, z: 12, size: 3.8 },
			{ x: 12, z: 12, size: 4.2 },
			{ x: 0, z: 0, size: 5 },
			{ x: -8, z: 0, size: 3 },
			{ x: 8, z: 0, size: 3.2 },
			{ x: 0, z: -8, size: 3.5 },
			{ x: 0, z: 8, size: 3.3 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var geometry = new THREE.BoxGeometry(pos.size, 2, pos.size);
			var material = new THREE.MeshLambertMaterial({
				color: 0x00ff44,
				emissive: 0x00cc22
			});
			var glowBox = new THREE.Mesh(geometry, material);
			glowBox.position.set(pos.x, 0.5, pos.z);
			glowBox.castShadow = true;
			glowBox.receiveShadow = true;
			scene.add(glowBox);
			glowGroup.push(glowBox);

			var light = new THREE.PointLight(0x00ff44, 0.6, 20);
			light.position.copy(glowBox.position);
			light.position.y += 2;
			scene.add(light);
			lights.push(light);
			animations.pulseLights.push({ light: light, box: glowBox, phase: Math.random() * Math.PI * 2 });
		}

		objects = objects.concat(glowGroup);
	}

	function buildAlienStructure() {
		var alienGroup = [];

		var cylinderGeometry = new THREE.CylinderGeometry(6, 8, 12, 8);
		var alienMaterial = new THREE.MeshLambertMaterial({ color: 0x333333, emissive: 0x1a1a1a });
		var mainStructure = new THREE.Mesh(cylinderGeometry, alienMaterial);
		mainStructure.position.set(0, -20, 0);
		mainStructure.castShadow = true;
		mainStructure.receiveShadow = true;
		scene.add(mainStructure);
		alienGroup.push(mainStructure);

		var topGeometry = new THREE.ConeGeometry(7, 8, 8);
		var topMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var topCone = new THREE.Mesh(topGeometry, topMaterial);
		topCone.position.set(0, -10, 0);
		topCone.castShadow = true;
		topCone.receiveShadow = true;
		scene.add(topCone);
		alienGroup.push(topCone);

		for (var i = 0; i < 6; i++) {
			var angle = (i / 6) * Math.PI * 2;
			var x = Math.cos(angle) * 5;
			var z = Math.sin(angle) * 5;

			var nodeGeometry = new THREE.SphereGeometry(1.5, 6, 6);
			var nodeMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, emissive: 0x0f0f0f });
			var node = new THREE.Mesh(nodeGeometry, nodeMaterial);
			node.position.set(x, -15, z);
			node.castShadow = true;
			scene.add(node);
			alienGroup.push(node);
		}

		objects = objects.concat(alienGroup);
	}

	function buildDigEquipment() {
		var equipGroup = [];

		var boomGeometry = new THREE.CylinderGeometry(0.6, 0.6, 20, 8);
		var steelMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var boom = new THREE.Mesh(boomGeometry, steelMaterial);
		boom.position.set(-25, 8, -20);
		boom.rotation.z = Math.PI / 6;
		boom.castShadow = true;
		scene.add(boom);
		equipGroup.push(boom);

		var bucketGeometry = new THREE.CylinderGeometry(2, 2.5, 3, 8);
		var bucket = new THREE.Mesh(bucketGeometry, steelMaterial);
		bucket.position.set(-22, 3, -20);
		bucket.castShadow = true;
		scene.add(bucket);
		equipGroup.push(bucket);

		var baseGeometry = new THREE.BoxGeometry(6, 2, 8);
		var base = new THREE.Mesh(baseGeometry, steelMaterial);
		base.position.set(-25, 1, -20);
		base.castShadow = true;
		scene.add(base);
		equipGroup.push(base);

		for (var i = 0; i < 2; i++) {
			var wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.6, 16);
			var wheel = new THREE.Mesh(wheelGeometry, steelMaterial);
			wheel.position.set(-25 + (i - 0.5) * 3, 1.5, -24);
			wheel.rotation.z = Math.PI / 2;
			wheel.castShadow = true;
			scene.add(wheel);
			equipGroup.push(wheel);
		}

		objects = objects.concat(equipGroup);
	}

	function buildRadiationStations() {
		var stationGroup = [];
		var stationPositions = [
			{ x: -35, z: -25 },
			{ x: 35, z: -25 },
			{ x: -35, z: 25 },
			{ x: 35, z: 25 },
			{ x: 0, z: -40 }
		];

		for (var i = 0; i < stationPositions.length; i++) {
			var pos = stationPositions[i];

			var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var pole = new THREE.Mesh(poleGeometry, poleMaterial);
			pole.position.set(pos.x, 3, pos.z);
			pole.castShadow = true;
			scene.add(pole);
			stationGroup.push(pole);

			var detectorGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.3);
			var detectorMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
			var detector = new THREE.Mesh(detectorGeometry, detectorMaterial);
			detector.position.set(pos.x, 6.5, pos.z);
			detector.castShadow = true;
			scene.add(detector);
			stationGroup.push(detector);

			var light = new THREE.PointLight(0xffaa00, 0.3, 15);
			light.position.copy(detector.position);
			light.position.y += 1;
			scene.add(light);
			lights.push(light);
		}

		objects = objects.concat(stationGroup);
	}

	function buildCrashedSatellites() {
		var satGroup = [];
		var satPositions = [
			{ x: -30, z: 25, rot: 0.3 },
			{ x: 30, z: -30, rot: 0.5 },
			{ x: 20, z: 35, rot: 0.2 }
		];

		for (var i = 0; i < satPositions.length; i++) {
			var pos = satPositions[i];

			var coreGeometry = new THREE.BoxGeometry(2, 2, 3);
			var coreMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var core = new THREE.Mesh(coreGeometry, coreMaterial);
			core.position.set(pos.x, 4, pos.z);
			core.rotation.x = pos.rot;
			core.castShadow = true;
			core.receiveShadow = true;
			scene.add(core);
			satGroup.push(core);

			for (var j = 0; j < 2; j++) {
				var panelGeometry = new THREE.BoxGeometry(4, 0.2, 2);
				var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x0088ff });
				var panel = new THREE.Mesh(panelGeometry, panelMaterial);
				panel.position.set(pos.x + (j - 0.5) * 3.5, 4, pos.z);
				panel.castShadow = true;
				scene.add(panel);
				satGroup.push(panel);
			}

			animations.satellites.push({
				mesh: core,
				rotSpeed: (Math.random() - 0.5) * 0.02
			});
		}

		objects = objects.concat(satGroup);
	}

	function buildMissileBatteries() {
		var batteryGroup = [];
		var batteryPositions = [
			{ x: -42, z: 15 },
			{ x: 42, z: -15 },
			{ x: 35, z: 35 }
		];

		for (var i = 0; i < batteryPositions.length; i++) {
			var pos = batteryPositions[i];

			var baseGeometry = new THREE.BoxGeometry(4, 1, 4);
			var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(pos.x, 0.5, pos.z);
			base.castShadow = true;
			base.receiveShadow = true;
			scene.add(base);
			batteryGroup.push(base);

			var turretGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 8);
			var turretMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
			var turret = new THREE.Mesh(turretGeometry, turretMaterial);
			turret.position.set(pos.x, 2, pos.z);
			turret.castShadow = true;
			scene.add(turret);
			batteryGroup.push(turret);

			var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
			var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
			var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
			barrel.position.set(pos.x, 3.5, pos.z + 3.5);
			barrel.rotation.x = Math.PI / 6;
			barrel.castShadow = true;
			scene.add(barrel);
			batteryGroup.push(barrel);

			var radarGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 12);
			var radarMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var radar = new THREE.Mesh(radarGeometry, radarMaterial);
			radar.position.set(pos.x, 4.5, pos.z);
			scene.add(radar);
			batteryGroup.push(radar);

			var radarDish = new THREE.Object3D();
			var dishGeometry = new THREE.SphereGeometry(1.5, 8, 8);
			var dishMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var dish = new THREE.Mesh(dishGeometry, dishMaterial);
			radarDish.add(dish);
			radarDish.position.set(pos.x, 4.5, pos.z);
			scene.add(radarDish);
			batteryGroup.push(radarDish);

			animations.radarDishes.push({
				mesh: radarDish,
				speed: (Math.random() + 0.5) * 0.015
			});
		}

		objects = objects.concat(batteryGroup);
	}

	function buildTentAndSupplies() {
		var supplyGroup = [];

		var tentGeometry = new THREE.ConeGeometry(3, 4, 8);
		var tentMaterial = new THREE.MeshLambertMaterial({ color: 0x666633 });
		var tent = new THREE.Mesh(tentGeometry, tentMaterial);
		tent.position.set(-15, 2, 35);
		tent.castShadow = true;
		tent.receiveShadow = true;
		scene.add(tent);
		supplyGroup.push(tent);

		var cratePositions = [
			{ x: -10, z: 35 },
			{ x: -12, z: 32 },
			{ x: -8, z: 32 },
			{ x: -10, z: 29 },
			{ x: 15, z: -35 },
			{ x: 17, z: -32 },
			{ x: 13, z: -32 }
		];

		for (var i = 0; i < cratePositions.length; i++) {
			var pos = cratePositions[i];
			var crateGeometry = new THREE.BoxGeometry(2, 2, 2);
			var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
			var crate = new THREE.Mesh(crateGeometry, crateMaterial);
			crate.position.set(pos.x, 1, pos.z);
			crate.castShadow = true;
			crate.receiveShadow = true;
			scene.add(crate);
			supplyGroup.push(crate);
		}

		objects = objects.concat(supplyGroup);
	}

	function buildFortifications() {
		var fortGroup = [];
		var wallPositions = [
			{ x: 0, z: 30, sx: 20, sz: 1 },
			{ x: 0, z: -30, sx: 20, sz: 1 },
			{ x: 30, z: 0, sx: 1, sz: 20 },
			{ x: -30, z: 0, sx: 1, sz: 20 }
		];

		for (var i = 0; i < wallPositions.length; i++) {
			var pos = wallPositions[i];
			var wallGeometry = new THREE.BoxGeometry(pos.sx, 2, pos.sz);
			var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
			var wall = new THREE.Mesh(wallGeometry, wallMaterial);
			wall.position.set(pos.x, 1, pos.z);
			wall.castShadow = true;
			wall.receiveShadow = true;
			scene.add(wall);
			fortGroup.push(wall);
		}

		for (var i = 0; i < 12; i++) {
			var angle = (i / 12) * Math.PI * 2;
			var x = Math.cos(angle) * 25;
			var z = Math.sin(angle) * 25;

			var pillboxGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
			var pillboxMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
			var pillbox = new THREE.Mesh(pillboxGeometry, pillboxMaterial);
			pillbox.position.set(x, 1, z);
			pillbox.castShadow = true;
			scene.add(pillbox);
			fortGroup.push(pillbox);
		}

		objects = objects.concat(fortGroup);
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x888888);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(40, 60, 40);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var warningLight = new THREE.PointLight(0xff6600, 0.5, 25);
		warningLight.position.set(0, 15, 0);
		scene.add(warningLight);
		lights.push(warningLight);
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animations = {
			satellites: [],
			glowBoxes: [],
			radarDishes: [],
			pulseLights: []
		};

		buildCraterRim();
		buildGlowCrater();
		buildAlienStructure();
		buildDigEquipment();
		buildRadiationStations();
		buildCrashedSatellites();
		buildMissileBatteries();
		buildTentAndSupplies();
		buildFortifications();
		buildLighting();
	}

	function update(delta) {
		var i;

		for (i = 0; i < animations.satellites.length; i++) {
			var sat = animations.satellites[i];
			sat.mesh.rotation.x += sat.rotSpeed;
			sat.mesh.rotation.y += sat.rotSpeed * 1.5;
			sat.mesh.rotation.z += sat.rotSpeed * 0.8;
		}

		for (i = 0; i < animations.pulseLights.length; i++) {
			var pulse = animations.pulseLights[i];
			var intensity = 0.4 + 0.3 * Math.sin(pulse.phase);
			pulse.light.intensity = intensity;
			pulse.phase += 0.02;
			if (pulse.phase > Math.PI * 2) {
				pulse.phase -= Math.PI * 2;
			}
		}

		for (i = 0; i < animations.radarDishes.length; i++) {
			var radar = animations.radarDishes[i];
			radar.mesh.rotation.y += radar.speed;
		}
	}

	function reset() {
		var i;

		for (i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		lights = [];

		animations = {
			satellites: [],
			glowBoxes: [],
			radarDishes: [],
			pulseLights: []
		};

		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
