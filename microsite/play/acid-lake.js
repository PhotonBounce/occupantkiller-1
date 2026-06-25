window.AcidLake = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];
	var geyserCones = [];
	var lakeSurfaceBoxes = [];
	var corrosionParticles = [];
	var time = 0;

	function buildLakeSurface() {
		var acidColor = 0xccff00;
		var darkAcidColor = 0x99cc00;

		for (var x = -60; x < 60; x += 20) {
			for (var z = -80; z < 80; z += 20) {
				var geometry = new THREE.BoxGeometry(18, 2, 18);
				var material = new THREE.MeshLambertMaterial({ color: acidColor });
				var box = new THREE.Mesh(geometry, material);
				box.position.set(x + 10, -1, z + 10);
				box.castShadow = true;
				box.receiveShadow = true;
				box.originalY = -1;
				scene.add(box);
				objects.push(box);
				lakeSurfaceBoxes.push(box);
			}
		}
	}

	function buildGeyserVents() {
		var ventColor = 0xffff00;

		var ventPositions = [
			[-30, 0, -40],
			[25, 0, -50],
			[-45, 0, 20],
			[40, 0, 30],
			[-15, 0, 50],
			[50, 0, -20]
		];

		for (var i = 0; i < ventPositions.length; i++) {
			var pos = ventPositions[i];

			var baseGeometry = new THREE.CylinderGeometry(6, 8, 1, 8);
			var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x666600 });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(pos[0], 0, pos[2]);
			base.castShadow = true;
			base.receiveShadow = true;
			scene.add(base);
			objects.push(base);

			var coneGeometry = new THREE.ConeGeometry(5, 15, 8);
			var coneMaterial = new THREE.MeshLambertMaterial({ color: ventColor });
			var cone = new THREE.Mesh(coneGeometry, coneMaterial);
			cone.position.set(pos[0], 2, pos[2]);
			cone.castShadow = true;
			cone.receiveShadow = true;
			cone.originalY = 2;
			cone.maxHeight = 35;
			cone.velocity = 0.3 + Math.random() * 0.2;
			scene.add(cone);
			objects.push(cone);
			geyserCones.push(cone);
			animatedObjects.push(cone);
		}
	}

	function buildMiningFacility() {
		var structureColor = 0x888800;

		var baseGeometry = new THREE.BoxGeometry(25, 3, 40);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555500 });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(-70, 1, -50);
		base.castShadow = true;
		base.receiveShadow = true;
		scene.add(base);
		objects.push(base);

		for (var i = 0; i < 4; i++) {
			var pipeGeometry = new THREE.CylinderGeometry(2, 2, 20, 6);
			var pipeMaterial = new THREE.MeshLambertMaterial({ color: structureColor });
			var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
			pipe.position.set(-75 + i * 8, 12, -50);
			pipe.castShadow = true;
			pipe.receiveShadow = true;
			scene.add(pipe);
			objects.push(pipe);
		}

		var tankGeometry = new THREE.SphereGeometry(8, 8, 8);
		var tankMaterial = new THREE.MeshLambertMaterial({ color: 0xcccc00 });
		var tank = new THREE.Mesh(tankGeometry, tankMaterial);
		tank.position.set(-60, 15, -40);
		tank.castShadow = true;
		tank.receiveShadow = true;
		scene.add(tank);
		objects.push(tank);
		animatedObjects.push(tank);
		tank.rotationSpeed = 0.005;
	}

	function buildShoreTurrets() {
		var turretColor = 0x999900;

		var positions = [
			[-85, 2, -60],
			[-75, 2, 60],
			[75, 2, -70],
			[85, 2, 40]
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];

			var baseGeometry = new THREE.CylinderGeometry(5, 6, 3, 8);
			var baseMaterial = new THREE.MeshLambertMaterial({ color: turretColor });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(pos[0], pos[1], pos[2]);
			base.castShadow = true;
			base.receiveShadow = true;
			scene.add(base);
			objects.push(base);

			var barrelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 6);
			var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x444400 });
			var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
			barrel.position.set(pos[0], pos[1] + 4, pos[2]);
			barrel.rotation.z = Math.PI / 6;
			barrel.castShadow = true;
			barrel.receiveShadow = true;
			scene.add(barrel);
			objects.push(barrel);
		}
	}

	function buildSteppingStones() {
		var stoneColor = 0xaaaaaa;
		var stoneMaterial = new THREE.MeshLambertMaterial({ color: stoneColor });

		var stonePositions = [
			[-40, -0.5, -20],
			[-15, -0.5, -15],
			[10, -0.5, -25],
			[35, -0.5, -10],
			[-30, -0.5, 10],
			[5, -0.5, 15],
			[40, -0.5, 5],
			[-25, -0.5, 40],
			[20, -0.5, 35]
		];

		for (var i = 0; i < stonePositions.length; i++) {
			var pos = stonePositions[i];
			var geometry = new THREE.SphereGeometry(6, 6, 6);
			var stone = new THREE.Mesh(geometry, stoneMaterial);
			stone.position.set(pos[0], pos[1], pos[2]);
			stone.scale.set(1, 0.4, 1);
			stone.castShadow = true;
			stone.receiveShadow = true;
			scene.add(stone);
			objects.push(stone);
		}
	}

	function buildBridgePylons() {
		var pylonColor = 0x996600;
		var pylonMaterial = new THREE.MeshLambertMaterial({ color: pylonColor });

		var pylonPositions = [
			[-50, 8, 70],
			[-25, 8, 75],
			[0, 8, 70],
			[25, 8, 75],
			[50, 8, 70]
		];

		for (var i = 0; i < pylonPositions.length; i++) {
			var pos = pylonPositions[i];
			var geometry = new THREE.CylinderGeometry(4, 5, 16, 8);
			var pylon = new THREE.Mesh(geometry, pylonMaterial);
			pylon.position.set(pos[0], pos[1], pos[2]);
			pylon.castShadow = true;
			pylon.receiveShadow = true;
			scene.add(pylon);
			objects.push(pylon);

			var corrodeGeometry = new THREE.BoxGeometry(8, 3, 8);
			var corrodeMaterial = new THREE.MeshLambertMaterial({ color: 0x664400 });
			var corrode = new THREE.Mesh(corrodeGeometry, corrodeMaterial);
			corrode.position.set(pos[0], pos[1] - 6, pos[2]);
			corrode.castShadow = true;
			corrode.receiveShadow = true;
			scene.add(corrode);
			objects.push(corrode);
		}
	}

	function buildHazmatBoats() {
		var boatColor = 0xffff66;

		var boatPositions = [
			[-45, 0.5, -60],
			[55, 0.5, 40],
			[20, 0.5, -35],
			[-70, 0.5, 20]
		];

		for (var i = 0; i < boatPositions.length; i++) {
			var pos = boatPositions[i];

			var hullGeometry = new THREE.BoxGeometry(8, 4, 18);
			var hullMaterial = new THREE.MeshLambertMaterial({ color: boatColor });
			var hull = new THREE.Mesh(hullGeometry, hullMaterial);
			hull.position.set(pos[0], pos[1], pos[2]);
			hull.castShadow = true;
			hull.receiveShadow = true;
			hull.originalY = pos[1];
			hull.bobSpeed = 1.2 + i * 0.3;
			scene.add(hull);
			objects.push(hull);
			animatedObjects.push(hull);

			var canopyGeometry = new THREE.SphereGeometry(4, 4, 4);
			var canopyMaterial = new THREE.MeshLambertMaterial({ color: 0xff9900 });
			var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
			canopy.position.set(pos[0], pos[1] + 3, pos[2] - 2);
			canopy.scale.set(1, 0.6, 0.8);
			canopy.castShadow = true;
			canopy.receiveShadow = true;
			scene.add(canopy);
			objects.push(canopy);
		}
	}

	function buildEnemyBase() {
		var baseColor = 0xaaaa00;
		var wallColor = 0x888800;

		var floorGeometry = new THREE.BoxGeometry(50, 2, 40);
		var floorMaterial = new THREE.MeshLambertMaterial({ color: baseColor });
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.set(70, 0, 60);
		floor.castShadow = true;
		floor.receiveShadow = true;
		scene.add(floor);
		objects.push(floor);

		for (var i = 0; i < 3; i++) {
			var wallGeometry = new THREE.BoxGeometry(40, 15, 3);
			var wallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
			var wall = new THREE.Mesh(wallGeometry, wallMaterial);
			wall.position.set(70 + i * 15, 8, 55 + i * 8);
			wall.castShadow = true;
			wall.receiveShadow = true;
			scene.add(wall);
			objects.push(wall);
		}

		var radarGeometry = new THREE.ConeGeometry(6, 20, 8);
		var radarMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
		var radar = new THREE.Mesh(radarGeometry, radarMaterial);
		radar.position.set(85, 15, 75);
		radar.castShadow = true;
		radar.receiveShadow = true;
		radar.rotationSpeed = 0.008;
		scene.add(radar);
		objects.push(radar);
		animatedObjects.push(radar);

		var bunkerGeometry = new THREE.SphereGeometry(12, 6, 6);
		var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x666600 });
		var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
		bunker.position.set(50, 5, 60);
		bunker.scale.set(1, 0.5, 1.2);
		bunker.castShadow = true;
		bunker.receiveShadow = true;
		scene.add(bunker);
		objects.push(bunker);
	}

	function buildDissolvedMetal() {
		var metalColors = [0xccaa00, 0xbbaa00, 0xaaaa00, 0x999900];

		var metalPositions = [
			[-80, 1, -30],
			[-70, 1, 10],
			[70, 1, 55],
			[-60, 1, 50],
			[80, 1, -50],
			[-75, 1, 35],
			[65, 1, -40]
		];

		for (var i = 0; i < metalPositions.length; i++) {
			var pos = metalPositions[i];

			var geometry = new THREE.BoxGeometry(12, 6, 12);
			var material = new THREE.MeshLambertMaterial({ color: metalColors[i % metalColors.length] });
			var metal = new THREE.Mesh(geometry, material);
			metal.position.set(pos[0], pos[1], pos[2]);
			metal.rotation.set(Math.random(), Math.random(), Math.random());
			metal.castShadow = true;
			metal.receiveShadow = true;
			scene.add(metal);
			objects.push(metal);

			var corrodeGeometry = new THREE.SphereGeometry(8, 4, 4);
			var corrodeMaterial = new THREE.MeshLambertMaterial({ color: 0x555500 });
			var corrode = new THREE.Mesh(corrodeGeometry, corrodeMaterial);
			corrode.position.set(pos[0] + 4, pos[1] - 2, pos[2] + 4);
			corrode.castShadow = true;
			corrode.receiveShadow = true;
			scene.add(corrode);
			objects.push(corrode);
		}
	}

	function buildCorrosionDrips() {
		for (var i = 0; i < 15; i++) {
			var randomX = -80 + Math.random() * 160;
			var randomZ = -80 + Math.random() * 160;

			var dripGeometry = new THREE.SphereGeometry(1, 4, 4);
			var dripMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var drip = new THREE.Mesh(dripGeometry, dripMaterial);
			drip.position.set(randomX, 15 + Math.random() * 20, randomZ);
			drip.castShadow = true;
			drip.receiveShadow = true;
			drip.originalY = drip.position.y;
			drip.targetY = -2;
			drip.dropSpeed = 0.15 + Math.random() * 0.1;
			drip.resetHeight = 15 + Math.random() * 20;
			scene.add(drip);
			objects.push(drip);
			corrosionParticles.push(drip);
			animatedObjects.push(drip);
		}
	}

	function buildLights() {
		var ambientLight = new THREE.AmbientLight(0xcccc00, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffff99, 0.8);
		directionalLight.position.set(50, 80, 50);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 200;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0xffff00, 0.5, 100);
		pointLight1.position.set(-70, 20, -50);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xffff00, 0.5, 100);
		pointLight2.position.set(70, 20, 70);
		scene.add(pointLight2);
		lights.push(pointLight2);

		var pointLight3 = new THREE.PointLight(0xccff00, 0.4, 80);
		pointLight3.position.set(0, 15, 0);
		scene.add(pointLight3);
		lights.push(pointLight3);
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		time = 0;
		objects = [];
		lights = [];
		animatedObjects = [];
		geyserCones = [];
		lakeSurfaceBoxes = [];
		corrosionParticles = [];

		buildLakeSurface();
		buildGeyserVents();
		buildMiningFacility();
		buildShoreTurrets();
		buildSteppingStones();
		buildBridgePylons();
		buildHazmatBoats();
		buildEnemyBase();
		buildDissolvedMetal();
		buildCorrosionDrips();
		buildLights();
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < geyserCones.length; i++) {
			var cone = geyserCones[i];
			var phase = Math.sin(time * cone.velocity) * 0.5 + 0.5;
			var newHeight = cone.originalY + phase * (cone.maxHeight - cone.originalY);
			cone.position.y = newHeight;
			cone.scale.y = 0.5 + phase * 1.5;
		}

		for (var i = 0; i < lakeSurfaceBoxes.length; i++) {
			var box = lakeSurfaceBoxes[i];
			var waveNoise = Math.sin(time * 0.8 + box.position.x * 0.03) * 0.3;
			waveNoise += Math.cos(time * 0.6 + box.position.z * 0.02) * 0.2;
			box.position.y = box.originalY + waveNoise;
		}

		for (var i = 0; i < corrosionParticles.length; i++) {
			var drip = corrosionParticles[i];
			drip.position.y -= drip.dropSpeed;
			if (drip.position.y < drip.targetY) {
				drip.position.y = drip.resetHeight;
			}
		}

		for (var i = 0; i < animatedObjects.length; i++) {
			var obj = animatedObjects[i];
			if (obj.rotationSpeed) {
				obj.rotation.y += obj.rotationSpeed;
			}
			if (obj.bobSpeed && obj.originalY !== undefined) {
				var bob = Math.sin(time * obj.bobSpeed) * 0.8;
				obj.position.y = obj.originalY + bob;
			}
		}
	}

	function reset() {
		if (scene) {
			for (var i = objects.length - 1; i >= 0; i--) {
				scene.remove(objects[i]);
			}
			for (var i = lights.length - 1; i >= 0; i--) {
				scene.remove(lights[i]);
			}
		}
		scene = null;
		camera = null;
		objects = [];
		lights = [];
		animatedObjects = [];
		geyserCones = [];
		lakeSurfaceBoxes = [];
		corrosionParticles = [];
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
