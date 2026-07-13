window.NuclearWaste = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lights = [];
	var animatedObjects = [];
	var barrelDrips = [];
	var warningLights = [];
	var glowingElements = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];
		barrelDrips = [];
		warningLights = [];
		glowingElements = [];
		time = 0;

		buildWasteBarrels();
		buildContainmentPools();
		buildStorageSilos();
		buildRadiationTowers();
		buildMutantWildlife();
		buildContaminatedCraters();
		buildAbandonedTrucks();
		buildInspectionRobots();
		buildEnvironment();
		buildLighting();
	}

	function buildWasteBarrels() {
		var barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16);
		var barrelMaterial = new THREE.MeshLambertMaterial({
			color: 0x00aa00,
			emissive: 0x00ff00,
			emissiveIntensity: 0.3
		});

		var positions = [
			[-15, 0.6, 10],
			[-12, 0.6, 8],
			[-10, 0.6, 12],
			[-8, 0.6, 9],
			[-6, 0.6, 11],
			[5, 0.6, -5],
			[8, 0.6, -3],
			[10, 0.6, -7],
			[12, 0.6, -4],
			[15, 0.6, -6],
			[0, 0.6, 15],
			[2, 0.6, 17],
			[-2, 0.6, 16],
			[3, 0.6, 13],
			[25, 0.6, 8],
			[27, 0.6, 10],
			[26, 0.6, 5],
			[-25, 0.6, -12],
			[-27, 0.6, -10],
			[-26, 0.6, -15]
		];

		var i;
		for (i = 0; i < positions.length; i = i + 1) {
			var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
			barrel.position.set(positions[i][0], positions[i][1], positions[i][2]);
			barrel.castShadow = true;
			barrel.receiveShadow = true;
			scene.add(barrel);
			objects.push(barrel);
			animatedObjects.push({
				mesh: barrel,
				type: 'barrel',
				drips: []
			});
			glowingElements.push(barrel);
		}
	}

	function buildContainmentPools() {
		var poolGeometry = new THREE.BoxGeometry(8, 0.5, 8);
		var poolMaterial = new THREE.MeshLambertMaterial({
			color: 0x004400,
			emissive: 0x00aa00,
			emissiveIntensity: 0.2
		});

		var poolPositions = [
			[-20, 0.25, -10],
			[20, 0.25, 10],
			[0, 0.25, -20],
			[-10, 0.25, 5]
		];

		var i;
		for (i = 0; i < poolPositions.length; i = i + 1) {
			var pool = new THREE.Mesh(poolGeometry, poolMaterial);
			pool.position.set(poolPositions[i][0], poolPositions[i][1], poolPositions[i][2]);
			pool.receiveShadow = true;
			scene.add(pool);
			objects.push(pool);
			glowingElements.push(pool);
		}
	}

	function buildStorageSilos() {
		var siloGeometry = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
		var siloMaterial = new THREE.MeshLambertMaterial({
			color: 0x664444,
			emissive: 0x221111,
			emissiveIntensity: 0.1
		});

		var siloPositions = [
			[-30, 3, -25],
			[30, 3, -20],
			[32, 3, 10],
			[-32, 3, 15]
		];

		var i;
		for (i = 0; i < siloPositions.length; i = i + 1) {
			var silo = new THREE.Mesh(siloGeometry, siloMaterial);
			silo.position.set(siloPositions[i][0], siloPositions[i][1], siloPositions[i][2]);
			silo.castShadow = true;
			silo.receiveShadow = true;
			scene.add(silo);
			objects.push(silo);
		}
	}

	function buildRadiationTowers() {
		var towerGeometry = new THREE.BoxGeometry(0.4, 8, 0.4);
		var towerMaterial = new THREE.MeshLambertMaterial({
			color: 0x333333,
			emissive: 0x111111
		});

		var warningGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
		var warningMaterial = new THREE.MeshLambertMaterial({
			color: 0xffaa00,
			emissive: 0xffff00,
			emissiveIntensity: 0.4
		});

		var towerPositions = [
			[-35, 4, 0],
			[35, 4, 0],
			[0, 4, -35],
			[0, 4, 35],
			[-20, 4, -20],
			[20, 4, 20],
			[-25, 4, 25],
			[25, 4, -25]
		];

		var i;
		for (i = 0; i < towerPositions.length; i = i + 1) {
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.set(towerPositions[i][0], towerPositions[i][1], towerPositions[i][2]);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			objects.push(tower);

			var warning = new THREE.Mesh(warningGeometry, warningMaterial);
			warning.position.set(towerPositions[i][0], towerPositions[i][1] + 3.5, towerPositions[i][2]);
			warning.castShadow = true;
			warning.receiveShadow = true;
			scene.add(warning);
			objects.push(warning);
			warningLights.push({
				mesh: warning,
				active: true,
				phase: i * 0.3
			});
		}
	}

	function buildMutantWildlife() {
		var bodyGeometry = new THREE.SphereGeometry(0.6, 8, 8);
		var bodyMaterial = new THREE.MeshLambertMaterial({
			color: 0x3d5a3d,
			emissive: 0x00aa00,
			emissiveIntensity: 0.15
		});

		var headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
		var legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);

		var animalPositions = [
			[-22, 0, -28],
			[22, 0, 28],
			[-28, 0, 22],
			[28, 0, -22],
			[0, 0, -28],
			[0, 0, 28],
			[-15, 0, 15],
			[15, 0, -15],
			[20, 0, 0],
			[-20, 0, 0]
		];

		var i;
		for (i = 0; i < animalPositions.length; i = i + 1) {
			var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
			body.position.set(animalPositions[i][0], 0.6, animalPositions[i][2]);
			body.scale.set(1.2, 0.8, 0.6);
			body.castShadow = true;
			body.receiveShadow = true;
			scene.add(body);
			objects.push(body);

			var head = new THREE.Mesh(headGeometry, bodyMaterial);
			head.position.set(animalPositions[i][0], 1.1, animalPositions[i][2] - 0.5);
			head.castShadow = true;
			head.receiveShadow = true;
			scene.add(head);
			objects.push(head);

			var legfl = new THREE.Mesh(legGeometry, bodyMaterial);
			legfl.position.set(animalPositions[i][0] - 0.3, 0.2, animalPositions[i][2] - 0.2);
			legfl.castShadow = true;
			legfl.receiveShadow = true;
			scene.add(legfl);
			objects.push(legfl);

			var legfr = new THREE.Mesh(legGeometry, bodyMaterial);
			legfr.position.set(animalPositions[i][0] + 0.3, 0.2, animalPositions[i][2] - 0.2);
			legfr.castShadow = true;
			legfr.receiveShadow = true;
			scene.add(legfr);
			objects.push(legfr);

			var legbl = new THREE.Mesh(legGeometry, bodyMaterial);
			legbl.position.set(animalPositions[i][0] - 0.3, 0.2, animalPositions[i][2] + 0.2);
			legbl.castShadow = true;
			legbl.receiveShadow = true;
			scene.add(legbl);
			objects.push(legbl);

			var legbr = new THREE.Mesh(legGeometry, bodyMaterial);
			legbr.position.set(animalPositions[i][0] + 0.3, 0.2, animalPositions[i][2] + 0.2);
			legbr.castShadow = true;
			legbr.receiveShadow = true;
			scene.add(legbr);
			objects.push(legbr);
		}
	}

	function buildContaminatedCraters() {
		var craterGeometry = new THREE.ConeGeometry(3, 1.5, 12);
		var craterMaterial = new THREE.MeshLambertMaterial({
			color: 0x1a4d1a,
			emissive: 0x00dd00,
			emissiveIntensity: 0.25
		});

		var craterPositions = [
			[-18, 0.75, 0],
			[18, 0.75, 0],
			[0, 0.75, 18],
			[0, 0.75, -18],
			[15, 0.75, -15],
			[-15, 0.75, 15],
			[25, 0.75, 15],
			[-25, 0.75, -15],
			[10, 0.75, 25],
			[-10, 0.75, -25]
		];

		var i;
		for (i = 0; i < craterPositions.length; i = i + 1) {
			var crater = new THREE.Mesh(craterGeometry, craterMaterial);
			crater.position.set(craterPositions[i][0], craterPositions[i][1], craterPositions[i][2]);
			crater.rotation.x = Math.PI;
			crater.castShadow = true;
			crater.receiveShadow = true;
			scene.add(crater);
			objects.push(crater);
			glowingElements.push(crater);
		}
	}

	function buildAbandonedTrucks() {
		var cabGeometry = new THREE.BoxGeometry(1.2, 1, 2);
		var cabMaterial = new THREE.MeshLambertMaterial({
			color: 0x555555,
			emissive: 0x222222
		});

		var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
		var wheelMaterial = new THREE.MeshLambertMaterial({
			color: 0x222222,
			emissive: 0x111111
		});

		var truckBedGeometry = new THREE.BoxGeometry(1.5, 0.8, 3);
		var truckBedMaterial = new THREE.MeshLambertMaterial({
			color: 0x666666,
			emissive: 0x333333
		});

		var truckPositions = [
			[-35, 0, 20],
			[35, 0, -20],
			[0, 0, 35]
		];

		var i;
		for (i = 0; i < truckPositions.length; i = i + 1) {
			var cab = new THREE.Mesh(cabGeometry, cabMaterial);
			cab.position.set(truckPositions[i][0], 0.5, truckPositions[i][2]);
			cab.castShadow = true;
			cab.receiveShadow = true;
			scene.add(cab);
			objects.push(cab);

			var bed = new THREE.Mesh(truckBedGeometry, truckBedMaterial);
			bed.position.set(truckPositions[i][0], 0.4, truckPositions[i][2] + 2.5);
			bed.castShadow = true;
			bed.receiveShadow = true;
			scene.add(bed);
			objects.push(bed);

			var j;
			for (j = 0; j < 4; j = j + 1) {
				var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
				var offsetx = j < 2 ? -0.4 : 0.4;
				var offsetz = j % 2 === 0 ? -0.8 : 0.8;
				wheel.position.set(truckPositions[i][0] + offsetx, 0.4, truckPositions[i][2] + offsetz);
				wheel.rotation.z = Math.PI / 2;
				wheel.castShadow = true;
				wheel.receiveShadow = true;
				scene.add(wheel);
				objects.push(wheel);
			}
		}
	}

	function buildInspectionRobots() {
		var bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
		var bodyMaterial = new THREE.MeshLambertMaterial({
			color: 0x444444,
			emissive: 0x00aa00,
			emissiveIntensity: 0.1
		});

		var headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
		var armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
		var legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 6);

		var robotPositions = [
			[-28, 0, 28],
			[28, 0, -28],
			[0, 0, 0],
			[-10, 0, -10]
		];

		var i;
		for (i = 0; i < robotPositions.length; i = i + 1) {
			var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
			body.position.set(robotPositions[i][0], 0.6, robotPositions[i][2]);
			body.castShadow = true;
			body.receiveShadow = true;
			scene.add(body);
			objects.push(body);
			animatedObjects.push({
				mesh: body,
				type: 'robot',
				phase: i
			});

			var head = new THREE.Mesh(headGeometry, bodyMaterial);
			head.position.set(robotPositions[i][0], 1.35, robotPositions[i][2]);
			head.castShadow = true;
			head.receiveShadow = true;
			scene.add(head);
			objects.push(head);

			var armL = new THREE.Mesh(armGeometry, bodyMaterial);
			armL.position.set(robotPositions[i][0] - 0.4, 0.9, robotPositions[i][2]);
			armL.rotation.z = Math.PI / 3;
			armL.castShadow = true;
			armL.receiveShadow = true;
			scene.add(armL);
			objects.push(armL);
			animatedObjects.push({
				mesh: armL,
				type: 'arm',
				phase: i
			});

			var armR = new THREE.Mesh(armGeometry, bodyMaterial);
			armR.position.set(robotPositions[i][0] + 0.4, 0.9, robotPositions[i][2]);
			armR.rotation.z = -Math.PI / 3;
			armR.castShadow = true;
			armR.receiveShadow = true;
			scene.add(armR);
			objects.push(armR);
			animatedObjects.push({
				mesh: armR,
				type: 'arm',
				phase: i
			});

			var legL = new THREE.Mesh(legGeometry, bodyMaterial);
			legL.position.set(robotPositions[i][0] - 0.2, 0.3, robotPositions[i][2]);
			legL.castShadow = true;
			legL.receiveShadow = true;
			scene.add(legL);
			objects.push(legL);

			var legR = new THREE.Mesh(legGeometry, bodyMaterial);
			legR.position.set(robotPositions[i][0] + 0.2, 0.3, robotPositions[i][2]);
			legR.castShadow = true;
			legR.receiveShadow = true;
			scene.add(legR);
			objects.push(legR);
		}
	}

	function buildEnvironment() {
		var fenceGeometry = new THREE.BoxGeometry(1, 1.5, 0.1);
		var fenceMaterial = new THREE.MeshLambertMaterial({
			color: 0x444444,
			emissive: 0x222222
		});

		var fencePoints = [];
		var i;
		for (i = -40; i < 40; i = i + 4) {
			fencePoints.push([i, 0.75, -40]);
			fencePoints.push([i, 0.75, 40]);
			fencePoints.push([-40, 0.75, i]);
			fencePoints.push([40, 0.75, i]);
		}

		var j;
		for (j = 0; j < fencePoints.length; j = j + 1) {
			var fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
			fence.position.set(fencePoints[j][0], fencePoints[j][1], fencePoints[j][2]);
			fence.castShadow = true;
			fence.receiveShadow = true;
			scene.add(fence);
			objects.push(fence);
		}

		var debrisGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.8);
		var debrisMaterial = new THREE.MeshLambertMaterial({
			color: 0x555555,
			emissive: 0x111111
		});

		var debrisPositions = [
			[-12, 0.15, -8],
			[12, 0.15, 8],
			[-8, 0.15, 12],
			[8, 0.15, -12],
			[5, 0.15, 5],
			[-5, 0.15, -5],
			[18, 0.15, 18],
			[-18, 0.15, -18],
			[0, 0.15, 10],
			[-10, 0.15, 0],
			[10, 0.15, 0],
			[0, 0.15, -10],
			[22, 0.15, -28],
			[-22, 0.15, 28],
			[28, 0.15, -22],
			[-28, 0.15, 22]
		];

		var k;
		for (k = 0; k < debrisPositions.length; k = k + 1) {
			var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
			debris.position.set(debrisPositions[k][0], debrisPositions[k][1], debrisPositions[k][2]);
			debris.rotation.y = Math.random() * Math.PI * 2;
			debris.castShadow = true;
			debris.receiveShadow = true;
			scene.add(debris);
			objects.push(debris);
		}
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x00aa00, 0.4);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(30, 40, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -50;
		directionalLight.shadow.camera.right = 50;
		directionalLight.shadow.camera.top = 50;
		directionalLight.shadow.camera.bottom = -50;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var poolLightPositions = [
			[-20, 1, -10],
			[20, 1, 10],
			[0, 1, -20],
			[-10, 1, 5]
		];

		var i;
		for (i = 0; i < poolLightPositions.length; i = i + 1) {
			var pointLight = new THREE.PointLight(0x00ff00, 0.5, 15);
			pointLight.position.set(poolLightPositions[i][0], poolLightPositions[i][1], poolLightPositions[i][2]);
			scene.add(pointLight);
			lights.push(pointLight);
		}
	}

	function update(delta) {
		time = time + delta;

		var i;
		for (i = 0; i < glowingElements.length; i = i + 1) {
			var pulseScale = 0.95 + Math.sin(time * 2) * 0.05;
			glowingElements[i].material.emissiveIntensity = 0.2 + Math.sin(time * 1.5) * 0.15;
		}

		var j;
		for (j = 0; j < warningLights.length; j = j + 1) {
			var warningPhase = time * 3 + warningLights[j].phase;
			var blinkIntensity = Math.sin(warningPhase) > 0 ? 0.6 : 0.1;
			warningLights[j].mesh.material.emissiveIntensity = blinkIntensity;
		}

		var k;
		for (k = 0; k < animatedObjects.length; k = k + 1) {
			var obj = animatedObjects[k];
			if (obj.type === 'barrel') {
				obj.mesh.rotation.z = obj.mesh.rotation.z + delta * 0.1;
			} else if (obj.type === 'robot') {
				var bobPhase = time * 1.5 + obj.phase;
				obj.mesh.position.y = 0.6 + Math.sin(bobPhase) * 0.1;
			} else if (obj.type === 'arm') {
				var armPhase = time * 2 + obj.phase;
				obj.mesh.rotation.z = Math.sin(armPhase) * 0.6 + (obj.mesh.rotation.z > 0 ? Math.PI / 3 : -Math.PI / 3);
			}
		}
	}

	function reset() {
		var i;
		for (i = 0; i < objects.length; i = i + 1) {
			scene.remove(objects[i]);
		}
		var j;
		for (j = 0; j < lights.length; j = j + 1) {
			scene.remove(lights[j]);
		}
		objects = [];
		lights = [];
		animatedObjects = [];
		barrelDrips = [];
		warningLights = [];
		glowingElements = [];
		scene = null;
		camera = null;
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
