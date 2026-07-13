window.UrbanDecay = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];

	function buildskyscrapers() {
		var skyscraperPositions = [
			{ x: -80, z: -100, width: 25, height: 150, depth: 20 },
			{ x: 60, z: -120, width: 30, height: 180, depth: 25 },
			{ x: -40, z: 80, width: 20, height: 140, depth: 18 },
			{ x: 100, z: 60, width: 28, height: 160, depth: 22 }
		];

		skyscraperPositions.forEach(function(pos) {
			var geometry = new THREE.BoxGeometry(pos.width, pos.height, pos.depth);
			var material = new THREE.MeshLambertMaterial({ color: 0x404040 });
			var building = new THREE.Mesh(geometry, material);
			building.position.set(pos.x, pos.height / 2, pos.z);
			building.castShadow = true;
			building.receiveShadow = true;
			scene.add(building);
			objects.push(building);

			addcrumbledeffects(building, pos);
		});
	}

	function addcrumbledeffects(building, pos) {
		for (var i = 0; i < 8; i++) {
			var rubbleGeometry = new THREE.BoxGeometry(
				Math.random() * 6 + 3,
				Math.random() * 5 + 2,
				Math.random() * 6 + 3
			);
			var rubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x303030 });
			var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
			rubble.position.set(
				pos.x + Math.random() * 15 - 7.5,
				pos.height / 2 + Math.random() * 30,
				pos.z + Math.random() * 15 - 7.5
			);
			rubble.rotation.set(
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI
			);
			rubble.castShadow = true;
			scene.add(rubble);
			objects.push(rubble);
		}
	}

	function buildoverpasses() {
		var overpassLength = 120;
		var overpassHeight = 40;
		var overpassWidth = 35;

		var geometry = new THREE.BoxGeometry(overpassLength, 8, overpassWidth);
		var material = new THREE.MeshLambertMaterial({ color: 0x505050 });
		var overpass = new THREE.Mesh(geometry, material);
		overpass.position.set(0, overpassHeight, -80);
		overpass.castShadow = true;
		overpass.receiveShadow = true;
		scene.add(overpass);
		objects.push(overpass);

		addsupportpillars(0, overpassHeight, -80, overpassLength);

		var crackGeometry = new THREE.BoxGeometry(60, 4, 5);
		var crackMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var crack = new THREE.Mesh(crackGeometry, crackMaterial);
		crack.position.set(-20, overpassHeight - 4, -80);
		crack.rotation.z = 0.3;
		crack.castShadow = true;
		scene.add(crack);
		objects.push(crack);
	}

	function addsupportpillars(centerX, roadHeight, centerZ, length) {
		var pillarHeight = roadHeight - 5;
		var pillarPositions = [
			{ x: centerX - length / 3, z: centerZ },
			{ x: centerX, z: centerZ },
			{ x: centerX + length / 3, z: centerZ }
		];

		pillarPositions.forEach(function(pos) {
			var pillarGeometry = new THREE.CylinderGeometry(5, 6, pillarHeight, 8);
			var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
			var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
			pillar.position.set(pos.x, pillarHeight / 2, pos.z);
			pillar.castShadow = true;
			scene.add(pillar);
			objects.push(pillar);
		});
	}

	function buildfloodedstreets() {
		var waterGeometry = new THREE.BoxGeometry(200, 3, 200);
		var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a4a });
		var water = new THREE.Mesh(waterGeometry, waterMaterial);
		water.position.set(0, 1.5, 0);
		water.receiveShadow = true;
		water.opacity = 0.7;
		scene.add(water);
		objects.push(water);
		animatedObjects.push({ object: water, type: 'water' });

		for (var i = 0; i < 15; i++) {
			var puddleGeometry = new THREE.BoxGeometry(
				Math.random() * 20 + 10,
				0.5,
				Math.random() * 20 + 10
			);
			var puddleMaterial = new THREE.MeshLambertMaterial({ color: 0x0f2a3a });
			var puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
			puddle.position.set(
				Math.random() * 150 - 75,
				1.8,
				Math.random() * 150 - 75
			);
			scene.add(puddle);
			objects.push(puddle);
		}
	}

	function buildvehicles() {
		var vehiclePositions = [
			{ x: -50, z: 40 },
			{ x: 30, z: -60 },
			{ x: -70, z: 10 },
			{ x: 50, z: 50 }
		];

		vehiclePositions.forEach(function(pos) {
			var bodyGeometry = new THREE.BoxGeometry(8, 5, 15);
			var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
			var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
			body.position.set(pos.x, 2.5, pos.z);
			body.castShadow = true;
			scene.add(body);
			objects.push(body);

			var wheelPositions = [
				{ x: -3, z: -5 },
				{ x: 3, z: -5 },
				{ x: -3, z: 5 },
				{ x: 3, z: 5 }
			];

			wheelPositions.forEach(function(wheel) {
				var wheelGeometry = new THREE.CylinderGeometry(2, 2, 1.5, 12);
				var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
				var wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
				wheelMesh.rotation.z = Math.PI / 2;
				wheelMesh.position.set(pos.x + wheel.x, 2, pos.z + wheel.z);
				wheelMesh.castShadow = true;
				scene.add(wheelMesh);
				objects.push(wheelMesh);
			});

			var roofGeometry = new THREE.BoxGeometry(7, 3, 10);
			var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x6b0000 });
			var roof = new THREE.Mesh(roofGeometry, roofMaterial);
			roof.position.set(pos.x, 6, pos.z);
			roof.castShadow = true;
			scene.add(roof);
			objects.push(roof);
		});
	}

	function buildgrafficounters() {
		var wallPositions = [
			{ x: -120, z: 0, rotation: 0 },
			{ x: 120, z: 0, rotation: 0 },
			{ x: 0, z: -120, rotation: Math.PI / 2 },
			{ x: 0, z: 120, rotation: Math.PI / 2 }
		];

		wallPositions.forEach(function(pos) {
			var wallGeometry = new THREE.BoxGeometry(80, 30, 1);
			var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var wall = new THREE.Mesh(wallGeometry, wallMaterial);
			wall.position.set(pos.x, 15, pos.z);
			wall.rotation.y = pos.rotation;
			wall.receiveShadow = true;
			scene.add(wall);
			objects.push(wall);

			for (var i = 0; i < 5; i++) {
				var graffiti = new THREE.LineSegments(
					new THREE.BufferGeometry().setFromPoints([
						new THREE.Vector3(-30 + Math.random() * 60, Math.random() * 20 + 5, 0.5),
						new THREE.Vector3(-30 + Math.random() * 60, Math.random() * 20 + 5, 0.5)
					]),
					new THREE.LineBasicMaterial({ color: 0xff6600 })
				);
				graffiti.position.copy(wall.position);
				graffiti.rotation.y = wall.rotation.y;
				scene.add(graffiti);
				objects.push(graffiti);
			}
		});
	}

	function buildhydrants() {
		var hydrantPositions = [
			{ x: -60, z: 30 },
			{ x: 40, z: -50 },
			{ x: -30, z: -80 },
			{ x: 70, z: 20 },
			{ x: -90, z: 60 },
			{ x: 100, z: -40 }
		];

		hydrantPositions.forEach(function(pos) {
			var pipeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
			var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
			var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
			pipe.position.set(pos.x, 4, pos.z);
			pipe.castShadow = true;
			scene.add(pipe);
			objects.push(pipe);

			var headGeometry = new THREE.SphereGeometry(1, 8, 8);
			var headMaterial = new THREE.MeshLambertMaterial({ color: 0xff3333 });
			var head = new THREE.Mesh(headGeometry, headMaterial);
			head.position.set(pos.x, 8.5, pos.z);
			head.castShadow = true;
			scene.add(head);
			objects.push(head);
		});
	}

	function buildtrashpiles() {
		for (var i = 0; i < 12; i++) {
			var pileGeometry = new THREE.BoxGeometry(
				Math.random() * 15 + 8,
				Math.random() * 8 + 4,
				Math.random() * 15 + 8
			);
			var pileMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
			var pile = new THREE.Mesh(pileGeometry, pileMaterial);
			pile.position.set(
				Math.random() * 140 - 70,
				pile.geometry.parameters.height / 2 + 2,
				Math.random() * 140 - 70
			);
			pile.rotation.set(
				Math.random() * 0.5,
				Math.random() * Math.PI,
				Math.random() * 0.5
			);
			pile.castShadow = true;
			scene.add(pile);
			objects.push(pile);
		}
	}

	function buildsquatters() {
		for (var i = 0; i < 8; i++) {
			var shackGeometry = new THREE.BoxGeometry(12, 10, 15);
			var shackMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
			var shack = new THREE.Mesh(shackGeometry, shackMaterial);
			shack.position.set(
				Math.random() * 120 - 60,
				5,
				Math.random() * 120 - 60
			);
			shack.castShadow = true;
			scene.add(shack);
			objects.push(shack);

			var roofGeometry = new THREE.ConeGeometry(8, 5, 4);
			var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a2a });
			var roof = new THREE.Mesh(roofGeometry, roofMaterial);
			roof.position.set(shack.position.x, 12, shack.position.z);
			roof.rotation.y = Math.random() * Math.PI;
			roof.castShadow = true;
			scene.add(roof);
			objects.push(roof);
		}
	}

	function addlighting() {
		var ambientLight = new THREE.AmbientLight(0x555555, 0.8);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffaa66, 0.9);
		directionalLight.position.set(100, 80, 100);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -150;
		directionalLight.shadow.camera.right = 150;
		directionalLight.shadow.camera.top = 150;
		directionalLight.shadow.camera.bottom = -150;
		directionalLight.shadow.camera.far = 300;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0xff4400, 0.6, 200);
		pointLight1.position.set(-80, 50, -60);
		pointLight1.castShadow = true;
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xff4400, 0.6, 200);
		pointLight2.position.set(80, 50, 80);
		pointLight2.castShadow = true;
		scene.add(pointLight2);
		lights.push(pointLight2);

		var pointLight3 = new THREE.PointLight(0x6699ff, 0.5, 150);
		pointLight3.position.set(0, 30, 0);
		scene.add(pointLight3);
		lights.push(pointLight3);
	}

	function buildcrane() {
		var baseGeometry = new THREE.CylinderGeometry(6, 8, 4, 12);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(110, 2, -100);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var poleGeometry = new THREE.CylinderGeometry(2, 2.5, 80, 8);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var pole = new THREE.Mesh(poleGeometry, poleMaterial);
		pole.position.set(110, 42, -100);
		pole.castShadow = true;
		scene.add(pole);
		objects.push(pole);

		var armGeometry = new THREE.CylinderGeometry(1.5, 1.5, 60, 8);
		var armMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var arm = new THREE.Mesh(armGeometry, armMaterial);
		arm.rotation.z = Math.PI / 2;
		arm.position.set(140, 80, -100);
		arm.castShadow = true;
		scene.add(arm);
		objects.push(arm);
		animatedObjects.push({ object: arm, type: 'crane' });

		var hookGeometry = new THREE.SphereGeometry(3, 8, 8);
		var hookMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var hook = new THREE.Mesh(hookGeometry, hookMaterial);
		hook.position.set(170, 40, -100);
		hook.castShadow = true;
		scene.add(hook);
		objects.push(hook);
		animatedObjects.push({ object: hook, type: 'hook' });
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];

		buildskyscrapers();
		buildoverpasses();
		buildfloodedstreets();
		buildvehicles();
		buildgrafficounters();
		buildhydrants();
		buildtrashpiles();
		buildsquatters();
		buildcrane();
		addlighting();
	}

	function update(delta) {
		animatedObjects.forEach(function(item) {
			if (item.type === 'water') {
				item.object.position.y = 1.5 + Math.sin(Date.now() * 0.0005) * 0.3;
			} else if (item.type === 'crane') {
				item.object.rotation.z += delta * 0.1;
			} else if (item.type === 'hook') {
				item.object.position.y = 40 + Math.sin(Date.now() * 0.0008) * 15;
			}
		});
	}

	function reset() {
		objects.forEach(function(obj) {
			scene.remove(obj);
		});
		lights.forEach(function(light) {
			scene.remove(light);
		});
		objects = [];
		lights = [];
		animatedObjects = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
