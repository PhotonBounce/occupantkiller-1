window.StoneQuarry = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];

		setupLighting();
		buildQuarryWalls();
		buildDrillingRigs();
		buildBlastHoles();
		buildRockPiles();
		buildExcavator();
		buildCrusher();
		buildConveyorBelt();
		buildGuardShacks();
	}

	function setupLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 150, 100);
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight = new THREE.PointLight(0xffffff, 0.4, 300);
		pointLight.position.set(-50, 80, 50);
		scene.add(pointLight);
		lights.push(pointLight);
	}

	function buildQuarryWalls() {
		var colors = [0x8b7355, 0xa0826d, 0x996633, 0xb8956a];
		var yPositions = [0, -40, -80, -120];
		var scales = [200, 180, 160, 140];

		for (var i = 0; i < 4; i++) {
			var geometry = new THREE.BoxGeometry(scales[i], 30, scales[i]);
			var material = new THREE.MeshLambertMaterial({ color: colors[i] });
			var wall = new THREE.Mesh(geometry, material);
			wall.position.y = yPositions[i];
			wall.receiveShadow = true;
			wall.castShadow = true;
			scene.add(wall);
			objects.push(wall);
		}
	}

	function buildDrillingRigs() {
		for (var i = 0; i < 3; i++) {
			var baseGeometry = new THREE.BoxGeometry(25, 15, 25);
			var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(-80 + i * 80, -10, -60);
			base.castShadow = true;
			scene.add(base);
			objects.push(base);

			var towerGeometry = new THREE.CylinderGeometry(8, 8, 100, 16);
			var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.set(-80 + i * 80, 40, -60);
			tower.castShadow = true;
			scene.add(tower);
			objects.push(tower);
		}
	}

	function buildBlastHoles() {
		for (var i = 0; i < 5; i++) {
			var xPos = -100 + i * 50;
			var geometry = new THREE.ConeGeometry(12, 25, 12);
			var material = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var cone = new THREE.Mesh(geometry, material);
			cone.position.set(xPos, -130, 80);
			cone.rotation.x = Math.PI;
			cone.receiveShadow = true;
			scene.add(cone);
			objects.push(cone);
		}
	}

	function buildRockPiles() {
		for (var i = 0; i < 4; i++) {
			var xPos = -60 + i * 60;
			var zPos = 100 + (i % 2) * 40;

			for (var j = 0; j < 5; j++) {
				var radius = 8 - j * 1.5;
				var geometry = new THREE.SphereGeometry(radius, 8, 8);
				var material = new THREE.MeshLambertMaterial({ color: 0x696969 });
				var sphere = new THREE.Mesh(geometry, material);
				sphere.position.set(xPos + Math.random() * 10, -80 + j * 18, zPos + Math.random() * 10);
				sphere.castShadow = true;
				sphere.receiveShadow = true;
				scene.add(sphere);
				objects.push(sphere);
			}
		}
	}

	function buildExcavator() {
		var bodyGeometry = new THREE.BoxGeometry(35, 25, 50);
		var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(80, 0, -50);
		body.castShadow = true;
		scene.add(body);
		objects.push(body);

		var armGeometry = new THREE.CylinderGeometry(6, 6, 60, 8);
		var armMaterial = new THREE.MeshLambertMaterial({ color: 0xff9900 });
		var arm = new THREE.Mesh(armGeometry, armMaterial);
		arm.position.set(100, 20, -50);
		arm.rotation.z = 0.5;
		arm.castShadow = true;
		scene.add(arm);
		objects.push(arm);

		var bucketGeometry = new THREE.BoxGeometry(18, 12, 28);
		var bucketMaterial = new THREE.MeshLambertMaterial({ color: 0xccaa00 });
		var bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
		bucket.position.set(135, -15, -50);
		bucket.castShadow = true;
		scene.add(bucket);
		objects.push(bucket);
	}

	function buildCrusher() {
		var baseGeometry = new THREE.BoxGeometry(40, 35, 40);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(20, 0, 120);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var topGeometry = new THREE.BoxGeometry(45, 20, 45);
		var topMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var top = new THREE.Mesh(topGeometry, topMaterial);
		top.position.set(20, 40, 120);
		top.castShadow = true;
		scene.add(top);
		objects.push(top);

		var motorGeometry = new THREE.CylinderGeometry(10, 10, 35, 16);
		var motorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var motor = new THREE.Mesh(motorGeometry, motorMaterial);
		motor.position.set(20, 60, 120);
		motor.castShadow = true;
		scene.add(motor);
		objects.push(motor);
	}

	function buildConveyorBelt() {
		var points = [
			new THREE.Vector3(20, 25, 120),
			new THREE.Vector3(50, 15, 80),
			new THREE.Vector3(80, 5, 40),
			new THREE.Vector3(100, -20, 0)
		];

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 3 });
		var line = new THREE.LineSegments(geometry, material);
		scene.add(line);
		objects.push(line);

		for (var i = 0; i < 4; i++) {
			var supportGeometry = new THREE.CylinderGeometry(3, 3, 30, 8);
			var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var support = new THREE.Mesh(supportGeometry, supportMaterial);
			support.position.set(30 + i * 20, 5, 100 - i * 30);
			support.castShadow = true;
			scene.add(support);
			objects.push(support);
		}
	}

	function buildGuardShacks() {
		var positions = [
			[-150, 20, -150],
			[150, 20, -150],
			[-150, 20, 150],
			[150, 20, 150]
		];

		for (var i = 0; i < 4; i++) {
			var shackGeometry = new THREE.BoxGeometry(20, 25, 20);
			var shackMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
			var shack = new THREE.Mesh(shackGeometry, shackMaterial);
			shack.position.set(positions[i][0], positions[i][1], positions[i][2]);
			shack.castShadow = true;
			scene.add(shack);
			objects.push(shack);

			var roofGeometry = new THREE.ConeGeometry(15, 8, 4);
			var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
			var roof = new THREE.Mesh(roofGeometry, roofMaterial);
			roof.position.set(positions[i][0], 25, positions[i][2]);
			roof.castShadow = true;
			scene.add(roof);
			objects.push(roof);
		}
	}

	function update(delta) {
		if (!scene) return;

		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			if (obj.userData.rotateX !== undefined) {
				obj.rotation.x += obj.userData.rotateX * delta;
			}
			if (obj.userData.rotateY !== undefined) {
				obj.rotation.y += obj.userData.rotateY * delta;
			}
			if (obj.userData.bob !== undefined) {
				obj.position.y += Math.sin(Date.now() * 0.001 + i) * obj.userData.bob * delta;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		objects = [];
		lights = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
