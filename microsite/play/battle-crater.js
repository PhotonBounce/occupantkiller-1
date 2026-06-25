window.BattleCrater = (function() {
	'use strict';

	var sceneRef = null;
	var cameraRef = null;
	var objects = [];
	var lights = [];
	var animatedElements = [];

	function build() {
		buildMainCrater();
		buildTankWrecks();
		buildConcreteRuins();
		buildBarbedWire();
		buildShellCraters();
		buildDebris();
		buildMortarPositions();
		buildEnvironmentLighting();
	}

	function buildMainCrater() {
		var craterGroup = new THREE.Group();

		var craterGeom = new THREE.CylinderGeometry(120, 100, 40, 32, 16);
		var craterMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var crater = new THREE.Mesh(craterGeom, craterMat);
		crater.position.set(0, -20, 0);
		crater.receiveShadow = true;
		crater.castShadow = true;
		craterGroup.add(crater);

		var rimGeom = new THREE.CylinderGeometry(125, 120, 8, 32, 4);
		var rimMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var rim = new THREE.Mesh(rimGeom, rimMat);
		rim.position.set(0, 0, 0);
		rim.receiveShadow = true;
		rim.castShadow = true;
		craterGroup.add(rim);

		var deepCrater = new THREE.CylinderGeometry(90, 70, 50, 24, 12);
		var deepMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var deep = new THREE.Mesh(deepCrater, deepMat);
		deep.position.set(0, -35, 0);
		deep.receiveShadow = true;
		deep.castShadow = true;
		craterGroup.add(deep);

		sceneRef.add(craterGroup);
		objects.push(craterGroup);
	}

	function buildTankWrecks() {
		var positions = [
			{ x: -60, z: -50 },
			{ x: 70, z: 40 },
			{ x: -40, z: 60 },
			{ x: 50, z: -70 }
		];

		for (var i = 0; i < positions.length; i++) {
			var tankGroup = new THREE.Group();
			tankGroup.position.copy(positions[i]);

			var hullGeom = new THREE.BoxGeometry(18, 8, 35);
			var hullMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var hull = new THREE.Mesh(hullGeom, hullMat);
			hull.position.y = 2;
			hull.rotation.z = Math.random() * 0.4 - 0.2;
			hull.castShadow = true;
			hull.receiveShadow = true;
			tankGroup.add(hull);

			var turretGeom = new THREE.CylinderGeometry(6, 6, 12, 16, 4);
			var turretMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
			var turret = new THREE.Mesh(turretGeom, turretMat);
			turret.position.y = 8;
			turret.rotation.z = Math.random() * 3.14;
			turret.castShadow = true;
			turret.receiveShadow = true;
			tankGroup.add(turret);

			var barrelGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8, 2);
			var barrelMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
			var barrel = new THREE.Mesh(barrelGeom, barrelMat);
			barrel.position.set(0, 8, 10);
			barrel.rotation.x = Math.random() * 0.6 - 0.3;
			barrel.castShadow = true;
			barrel.receiveShadow = true;
			tankGroup.add(barrel);

			sceneRef.add(tankGroup);
			objects.push(tankGroup);
		}
	}

	function buildConcreteRuins() {
		var ruinPositions = [
			{ x: 0, y: 0, z: -80 },
			{ x: -85, y: 0, z: 0 },
			{ x: 85, y: 0, z: 0 },
			{ x: 0, y: 0, z: 80 },
			{ x: -60, y: 0, z: -40 },
			{ x: 60, y: 0, z: 40 }
		];

		for (var i = 0; i < ruinPositions.length; i++) {
			var ruinGroup = new THREE.Group();
			ruinGroup.position.copy(ruinPositions[i]);

			var wallGeom = new THREE.BoxGeometry(25, 30, 8);
			var wallMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
			var wall = new THREE.Mesh(wallGeom, wallMat);
			wall.position.y = 12;
			wall.castShadow = true;
			wall.receiveShadow = true;
			ruinGroup.add(wall);

			var holeGeom = new THREE.BoxGeometry(6, 6, 2);
			var holeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var hole1 = new THREE.Mesh(holeGeom, holeMat);
			hole1.position.set(-8, 18, 5);
			hole1.castShadow = true;
			ruinGroup.add(hole1);

			var hole2 = new THREE.Mesh(holeGeom, holeMat);
			hole2.position.set(8, 10, 5);
			hole2.castShadow = true;
			ruinGroup.add(hole2);

			var hole3 = new THREE.Mesh(holeGeom, holeMat);
			hole3.position.set(0, 25, 5);
			hole3.castShadow = true;
			ruinGroup.add(hole3);

			sceneRef.add(ruinGroup);
			objects.push(ruinGroup);
		}
	}

	function buildBarbedWire() {
		var wirePositions = [
			{ x: -50, z: -50 },
			{ x: -50, z: 50 },
			{ x: 50, z: -50 },
			{ x: 50, z: 50 },
			{ x: 0, z: -70 },
			{ x: 0, z: 70 },
			{ x: -70, z: 0 },
			{ x: 70, z: 0 }
		];

		for (var i = 0; i < wirePositions.length; i++) {
			var wireGroup = new THREE.Group();
			wireGroup.position.copy(wirePositions[i]);

			for (var j = 0; j < 3; j++) {
				var postGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 6, 3);
				var postMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
				var post = new THREE.Mesh(postGeom, postMat);
				post.position.set(j * 4 - 4, 6, 0);
				post.castShadow = true;
				post.receiveShadow = true;
				wireGroup.add(post);

				var wireGeom = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 4, 2);
				var wireMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
				var wire1 = new THREE.Mesh(wireGeom, wireMat);
				wire1.position.set((j - 1) * 4, 7, 0);
				wire1.rotation.z = 0.3;
				wireGroup.add(wire1);

				var wire2 = new THREE.Mesh(wireGeom, wireMat);
				wire2.position.set((j - 1) * 4, 5, 0);
				wire2.rotation.z = -0.3;
				wireGroup.add(wire2);
			}

			sceneRef.add(wireGroup);
			objects.push(wireGroup);
		}
	}

	function buildShellCraters() {
		var craterPositions = [
			{ x: -45, z: 0 },
			{ x: 45, z: 0 },
			{ x: 0, z: -45 },
			{ x: 0, z: 45 },
			{ x: -30, z: -30 },
			{ x: 30, z: -30 },
			{ x: -30, z: 30 },
			{ x: 30, z: 30 },
			{ x: -60, z: 20 },
			{ x: 60, z: -20 },
			{ x: 20, z: -60 },
			{ x: -20, z: 60 }
		];

		for (var i = 0; i < craterPositions.length; i++) {
			var smallCrater = new THREE.CylinderGeometry(12, 8, 8, 16, 8);
			var craterMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var mesh = new THREE.Mesh(smallCrater, craterMat);
			mesh.position.set(craterPositions[i].x, -2, craterPositions[i].z);
			mesh.receiveShadow = true;
			mesh.castShadow = true;
			sceneRef.add(mesh);
			objects.push(mesh);
		}
	}

	function buildDebris() {
		var debrisCount = 18;

		for (var i = 0; i < debrisCount; i++) {
			var debrisGroup = new THREE.Group();
			var randomX = (Math.random() - 0.5) * 180;
			var randomZ = (Math.random() - 0.5) * 180;
			debrisGroup.position.set(randomX, 0, randomZ);

			var isBox = Math.random() > 0.5;
			var debris;

			if (isBox) {
				var boxGeom = new THREE.BoxGeometry(
					Math.random() * 6 + 2,
					Math.random() * 4 + 1,
					Math.random() * 6 + 2
				);
				var boxMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
				debris = new THREE.Mesh(boxGeom, boxMat);
			} else {
				var sphereGeom = new THREE.SphereGeometry(Math.random() * 3 + 1, 8, 8);
				var sphereMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
				debris = new THREE.Mesh(sphereGeom, sphereMat);
			}

			debris.rotation.set(
				Math.random() * 3.14,
				Math.random() * 3.14,
				Math.random() * 3.14
			);
			debris.castShadow = true;
			debris.receiveShadow = true;
			debrisGroup.add(debris);
			sceneRef.add(debrisGroup);
			objects.push(debrisGroup);
		}
	}

	function buildMortarPositions() {
		var mortarPositions = [
			{ x: -35, z: -35 },
			{ x: 35, z: 35 },
			{ x: -35, z: 35 },
			{ x: 35, z: -35 }
		];

		for (var i = 0; i < mortarPositions.length; i++) {
			var mortarGroup = new THREE.Group();
			mortarGroup.position.copy(mortarPositions[i]);

			var baseGeom = new THREE.CylinderGeometry(8, 10, 2, 16, 2);
			var baseMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.y = 1;
			base.castShadow = true;
			base.receiveShadow = true;
			mortarGroup.add(base);

			var tubeGeom = new THREE.CylinderGeometry(2, 2.5, 20, 8, 4);
			var tubeMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var tube = new THREE.Mesh(tubeGeom, tubeMat);
			tube.position.y = 12;
			tube.rotation.x = -0.4;
			tube.castShadow = true;
			tube.receiveShadow = true;
			mortarGroup.add(tube);

			var tripodGeom = new THREE.ConeGeometry(3, 8, 3, 3);
			var tripodMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
			var tripod = new THREE.Mesh(tripodGeom, tripodMat);
			tripod.position.y = 3;
			tripod.castShadow = true;
			tripod.receiveShadow = true;
			mortarGroup.add(tripod);

			sceneRef.add(mortarGroup);
			objects.push(mortarGroup);

			animatedElements.push({
				mesh: tube,
				type: 'rotate',
				axis: 'x',
				speed: 0.3
			});
		}
	}

	function buildEnvironmentLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		sceneRef.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 80, 100);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -200;
		directionalLight.shadow.camera.right = 200;
		directionalLight.shadow.camera.top = 200;
		directionalLight.shadow.camera.bottom = -200;
		directionalLight.shadow.camera.far = 500;
		sceneRef.add(directionalLight);
		lights.push(directionalLight);

		var spotLight1 = new THREE.SpotLight(0xff6600, 0.6);
		spotLight1.position.set(-80, 50, -80);
		spotLight1.castShadow = true;
		spotLight1.angle = 0.6;
		spotLight1.penumbra = 0.5;
		sceneRef.add(spotLight1);
		lights.push(spotLight1);

		var spotLight2 = new THREE.SpotLight(0xff6600, 0.6);
		spotLight2.position.set(80, 50, 80);
		spotLight2.castShadow = true;
		spotLight2.angle = 0.6;
		spotLight2.penumbra = 0.5;
		sceneRef.add(spotLight2);
		lights.push(spotLight2);

		animatedElements.push({
			light: spotLight1,
			type: 'pulse',
			intensity: 0.6,
			speed: 2
		});

		animatedElements.push({
			light: spotLight2,
			type: 'pulse',
			intensity: 0.6,
			speed: 2.5
		});
	}

	function init(sceneRefParam, cameraRefParam) {
		sceneRef = sceneRefParam;
		cameraRef = cameraRefParam;
		objects = [];
		lights = [];
		animatedElements = [];
		build();
	}

	function update(delta) {
		for (var i = 0; i < animatedElements.length; i++) {
			var elem = animatedElements[i];

			if (elem.type === 'rotate' && elem.mesh) {
				if (elem.axis === 'x') {
					elem.mesh.rotation.x += elem.speed * delta;
				} else if (elem.axis === 'y') {
					elem.mesh.rotation.y += elem.speed * delta;
				} else if (elem.axis === 'z') {
					elem.mesh.rotation.z += elem.speed * delta;
				}
			}

			if (elem.type === 'pulse' && elem.light) {
				var pulse = Math.sin(performance.now() * elem.speed * 0.001) * 0.3;
				elem.light.intensity = elem.intensity + pulse;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			sceneRef.remove(objects[i]);
		}

		for (var j = 0; j < lights.length; j++) {
			sceneRef.remove(lights[j]);
		}

		objects = [];
		lights = [];
		animatedElements = [];
		sceneRef = null;
		cameraRef = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
