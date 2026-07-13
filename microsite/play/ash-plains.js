window.AshPlains = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var smokeParticles = [];
	var tumblingDebris = [];
	var ashDriftTime = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		smokeParticles = [];
		tumblingDebris = [];
		ashDriftTime = 0;

		buildLighting();
		buildTerrain();
		buildTankHulks();
		buildConcreteStructures();
		buildSkeletalTrees();
		buildVehicleGraveyard();
		buildFactoryComplex();
		buildSurvivorShelters();
		buildFalloutStation();
		buildDebrisScatter();
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x666666, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xcccccc, 0.8);
		directionalLight.position.set(100, 80, 50);
		directionalLight.castShadow = true;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0xff6600, 0.5, 150);
		pointLight1.position.set(-80, 40, -60);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xff3300, 0.4, 120);
		pointLight2.position.set(60, 35, 80);
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function buildTerrain() {
		var terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

		var crackCount = 0;
		for (var i = 0; i < 12; i++) {
			var crackLength = 8 + Math.random() * 16;
			var crackWidth = 0.4 + Math.random() * 0.8;
			var crackDepth = 0.5 + Math.random() * 1.2;

			var crackGeom = new THREE.BoxGeometry(crackLength, crackDepth, crackWidth);
			var crackMesh = new THREE.Mesh(crackGeom, terrainMaterial);

			crackMesh.position.x = -100 + Math.random() * 200;
			crackMesh.position.z = -100 + Math.random() * 200;
			crackMesh.position.y = -0.3;
			crackMesh.rotation.z = Math.random() * Math.PI;

			scene.add(crackMesh);
			objects.push(crackMesh);
			crackCount++;
		}

		var ashDriftCount = 0;
		for (var j = 0; j < 8; j++) {
			var driftGeom = new THREE.BoxGeometry(30 + Math.random() * 40, 2 + Math.random() * 4, 25 + Math.random() * 35);
			var driftMesh = new THREE.Mesh(driftGeom, new THREE.MeshLambertMaterial({ color: 0x5a5a5a }));

			driftMesh.position.x = -120 + Math.random() * 240;
			driftMesh.position.y = 0.5 + Math.random() * 2;
			driftMesh.position.z = -120 + Math.random() * 240;
			driftMesh.rotation.z = Math.random() * 0.3;

			scene.add(driftMesh);
			objects.push(driftMesh);
			ashDriftCount++;
		}
	}

	function buildTankHulks() {
		var tankCount = 0;
		for (var i = 0; i < 4; i++) {
			var hullGeom = new THREE.BoxGeometry(8, 3, 16);
			var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var hullMesh = new THREE.Mesh(hullGeom, hullMaterial);

			hullMesh.position.x = -80 + i * 50;
			hullMesh.position.y = 1.5;
			hullMesh.position.z = -60 + Math.random() * 20;
			hullMesh.rotation.y = Math.random() * Math.PI * 2;

			scene.add(hullMesh);
			objects.push(hullMesh);
			tankCount++;

			var turretGeom = new THREE.CylinderGeometry(1.5, 2, 2, 8);
			var turretMesh = new THREE.Mesh(turretGeom, hullMaterial);
			turretMesh.position.copy(hullMesh.position);
			turretMesh.position.y += 2.5;
			turretMesh.rotation.z = Math.random() * Math.PI;

			scene.add(turretMesh);
			objects.push(turretMesh);

			var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
			var barrelMesh = new THREE.Mesh(barrelGeom, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
			barrelMesh.position.copy(turretMesh.position);
			barrelMesh.rotation.z = Math.random() * 0.5 - 0.25;
			barrelMesh.position.z += 3;

			scene.add(barrelMesh);
			objects.push(barrelMesh);

			tumblingDebris.push({
				mesh: turretMesh,
				angularVelocity: { x: 0.01, y: 0.015, z: 0.008 }
			});
		}
	}

	function buildConcreteStructures() {
		var structureCount = 0;
		for (var i = 0; i < 6; i++) {
			var wallHeight = 12 + Math.random() * 8;
			var wallGeom = new THREE.BoxGeometry(15 + Math.random() * 8, wallHeight, 4);
			var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var wallMesh = new THREE.Mesh(wallGeom, concreteMaterial);

			wallMesh.position.x = -100 + i * 40;
			wallMesh.position.y = wallHeight / 2;
			wallMesh.position.z = 40 + Math.random() * 30;
			wallMesh.rotation.y = Math.random() * 0.3;

			scene.add(wallMesh);
			objects.push(wallMesh);
			structureCount++;

			var collapseCount = Math.floor(Math.random() * 3);
			for (var j = 0; j < collapseCount; j++) {
				var rubbleGeom = new THREE.BoxGeometry(6 + Math.random() * 5, 2 + Math.random() * 3, 3 + Math.random() * 4);
				var rubbleMesh = new THREE.Mesh(rubbleGeom, concreteMaterial);

				rubbleMesh.position.x = wallMesh.position.x + Math.random() * 20 - 10;
				rubbleMesh.position.y = 2 + Math.random() * 4;
				rubbleMesh.position.z = wallMesh.position.z + 8 + Math.random() * 10;
				rubbleMesh.rotation.x = Math.random() * Math.PI * 0.5;
				rubbleMesh.rotation.z = Math.random() * Math.PI * 0.5;

				scene.add(rubbleMesh);
				objects.push(rubbleMesh);
				structureCount++;
			}
		}
	}

	function buildSkeletalTrees() {
		var treeCount = 0;
		for (var i = 0; i < 8; i++) {
			var trunkGeom = new THREE.CylinderGeometry(0.6, 1.2, 18, 6);
			var deadWoodMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
			var trunkMesh = new THREE.Mesh(trunkGeom, deadWoodMaterial);

			trunkMesh.position.x = -90 + Math.random() * 180;
			trunkMesh.position.y = 9;
			trunkMesh.position.z = -80 + Math.random() * 160;
			trunkMesh.rotation.z = Math.random() * 0.15 - 0.075;

			scene.add(trunkMesh);
			objects.push(trunkMesh);
			treeCount++;

			var branchCount = 3 + Math.floor(Math.random() * 4);
			for (var j = 0; j < branchCount; j++) {
				var branchAngle = (j / branchCount) * Math.PI * 2;
				var branchLength = 6 + Math.random() * 4;

				var branchGeom = new THREE.CylinderGeometry(0.2, 0.4, branchLength, 4);
				var branchMesh = new THREE.Mesh(branchGeom, deadWoodMaterial);

				branchMesh.position.copy(trunkMesh.position);
				branchMesh.position.y = 12 + Math.random() * 6;

				branchMesh.rotation.z = Math.PI * 0.35;
				branchMesh.rotation.y = branchAngle;

				scene.add(branchMesh);
				objects.push(branchMesh);
				treeCount++;
			}
		}
	}

	function buildVehicleGraveyard() {
		var vehicleCount = 0;
		for (var i = 0; i < 6; i++) {
			var carBodyGeom = new THREE.BoxGeometry(5 + Math.random() * 3, 2 + Math.random() * 1.5, 10 + Math.random() * 5);
			var rustMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
			var carMesh = new THREE.Mesh(carBodyGeom, rustMaterial);

			carMesh.position.x = -60 + i * 20;
			carMesh.position.y = 1 + Math.random() * 0.5;
			carMesh.position.z = -70 + Math.random() * 30;
			carMesh.rotation.y = Math.random() * Math.PI * 2;
			carMesh.rotation.z = Math.random() * 0.3 - 0.15;

			scene.add(carMesh);
			objects.push(carMesh);
			vehicleCount++;

			var wheelCount = 4;
			for (var w = 0; w < wheelCount; w++) {
				var wheelGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 8);
				var wheelMesh = new THREE.Mesh(wheelGeom, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));

				var wheelOffset = (w % 2 === 0) ? -1.5 : 1.5;
				var wheelZOffset = (w < 2) ? -3 : 3;

				wheelMesh.position.x = carMesh.position.x + wheelOffset;
				wheelMesh.position.y = carMesh.position.y + 1;
				wheelMesh.position.z = carMesh.position.z + wheelZOffset;
				wheelMesh.rotation.z = Math.PI * 0.5;

				scene.add(wheelMesh);
				objects.push(wheelMesh);
				vehicleCount++;
			}
		}
	}

	function buildFactoryComplex() {
		var complexX = 60;
		var complexZ = 50;

		var mainBuildingGeom = new THREE.BoxGeometry(30, 25, 20);
		var factoryMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var mainBuildingMesh = new THREE.Mesh(mainBuildingGeom, factoryMaterial);
		mainBuildingMesh.position.set(complexX, 12.5, complexZ);

		scene.add(mainBuildingMesh);
		objects.push(mainBuildingMesh);

		var windowCount = 0;
		for (var wx = 0; wx < 4; wx++) {
			for (var wy = 0; wy < 3; wy++) {
				var windowGeom = new THREE.BoxGeometry(2, 2, 0.2);
				var windowMesh = new THREE.Mesh(windowGeom, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
				windowMesh.position.set(complexX - 10 + wx * 7, 5 + wy * 6, complexZ + 10.2);

				scene.add(windowMesh);
				objects.push(windowMesh);
				windowCount++;
			}
		}

		for (var i = 0; i < 3; i++) {
			var chimneyGeom = new THREE.CylinderGeometry(2, 2.5, 15, 8);
			var chimneyMesh = new THREE.Mesh(chimneyGeom, new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
			chimneyMesh.position.set(complexX - 10 + i * 10, 22.5, complexZ);

			scene.add(chimneyMesh);
			objects.push(chimneyMesh);

			for (var s = 0; s < 5; s++) {
				var smokeGeom = new THREE.SphereGeometry(1.5 + Math.random() * 1, 6, 6);
				var smokeMesh = new THREE.Mesh(smokeGeom, new THREE.MeshLambertMaterial({ color: 0x5a5a5a }));
				smokeMesh.position.set(chimneyMesh.position.x, chimneyMesh.position.y + 10 + s * 2, chimneyMesh.position.z);

				scene.add(smokeMesh);
				objects.push(smokeMesh);

				smokeParticles.push({
					mesh: smokeMesh,
					baseY: smokeMesh.position.y,
					riseSpeed: 0.3 + Math.random() * 0.3,
					driftX: Math.random() * 0.4 - 0.2,
					driftZ: Math.random() * 0.4 - 0.2,
					baseX: smokeMesh.position.x,
					baseZ: smokeMesh.position.z
				});
			}
		}

		var roofLength = mainBuildingGeom.parameters.x;
		var roofGeom = new THREE.BoxGeometry(roofLength + 2, 1, 25);
		var roofMesh = new THREE.Mesh(roofGeom, new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
		roofMesh.position.set(complexX, 25.5, complexZ);

		scene.add(roofMesh);
		objects.push(roofMesh);
	}

	function buildSurvivorShelters() {
		var shelterCount = 0;
		for (var i = 0; i < 5; i++) {
			var shelterX = -70 + i * 30;
			var shelterZ = -30 + Math.random() * 20;

			var roofGeom = new THREE.ConeGeometry(5, 4, 6);
			var shelterMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
			var roofMesh = new THREE.Mesh(roofGeom, shelterMaterial);
			roofMesh.position.set(shelterX, 3, shelterZ);
			roofMesh.rotation.y = Math.random() * Math.PI * 2;

			scene.add(roofMesh);
			objects.push(roofMesh);
			shelterCount++;

			var wallGeom = new THREE.CylinderGeometry(4.5, 4.5, 2.5, 8);
			var wallMesh = new THREE.Mesh(wallGeom, new THREE.MeshLambertMaterial({ color: 0x4a3a2a }));
			wallMesh.position.set(shelterX, 1.25, shelterZ);

			scene.add(wallMesh);
			objects.push(wallMesh);
			shelterCount++;

			for (var j = 0; j < 3; j++) {
				var doorAngle = (j / 3) * Math.PI * 2;
				var doorX = shelterX + Math.cos(doorAngle) * 4.5;
				var doorZ = shelterZ + Math.sin(doorAngle) * 4.5;

				var doorGeom = new THREE.BoxGeometry(1.5, 1.8, 0.3);
				var doorMesh = new THREE.Mesh(doorGeom, new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
				doorMesh.position.set(doorX, 1, doorZ);
				doorMesh.lookAt(shelterX, 1, shelterZ);

				scene.add(doorMesh);
				objects.push(doorMesh);
				shelterCount++;
			}
		}
	}

	function buildFalloutStation() {
		var stationX = -30;
		var stationZ = 80;

		var warningPoleGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
		var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var poleMesh = new THREE.Mesh(warningPoleGeom, metalMaterial);
		poleMesh.position.set(stationX, 6, stationZ);

		scene.add(poleMesh);
		objects.push(poleMesh);

		var signGeom = new THREE.BoxGeometry(6, 6, 0.3);
		var signMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
		var signMesh = new THREE.Mesh(signGeom, signMaterial);
		signMesh.position.set(stationX, 11, stationZ);

		scene.add(signMesh);
		objects.push(signMesh);

		var warningSymbolGeom = new THREE.SphereGeometry(1, 8, 8);
		var warningMesh = new THREE.Mesh(warningSymbolGeom, new THREE.MeshLambertMaterial({ color: 0xff3300 }));
		warningMesh.position.set(stationX, 11, stationZ);
		warningMesh.scale.set(0.6, 0.6, 0.6);

		scene.add(warningMesh);
		objects.push(warningMesh);

		var barrierCount = 0;
		for (var i = 0; i < 4; i++) {
			var barrierAngle = (i / 4) * Math.PI * 2;
			var barrierX = stationX + Math.cos(barrierAngle) * 10;
			var barrierZ = stationZ + Math.sin(barrierAngle) * 10;

			var barrierGeom = new THREE.BoxGeometry(4, 1.5, 0.4);
			var barrierMesh = new THREE.Mesh(barrierGeom, new THREE.MeshLambertMaterial({ color: 0xffaa00 }));
			barrierMesh.position.set(barrierX, 0.75, barrierZ);
			barrierMesh.lookAt(stationX, 0.75, stationZ);

			scene.add(barrierMesh);
			objects.push(barrierMesh);
			barrierCount++;
		}

		var sensorGeom = new THREE.SphereGeometry(0.4, 6, 6);
		var sensorMesh = new THREE.Mesh(sensorGeom, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
		sensorMesh.position.set(stationX, 10.5, stationZ);

		scene.add(sensorMesh);
		objects.push(sensorMesh);

		tumblingDebris.push({
			mesh: warningMesh,
			angularVelocity: { x: 0.008, y: 0.012, z: 0.005 }
		});
	}

	function buildDebrisScatter() {
		var debrisCount = 0;
		for (var i = 0; i < 15; i++) {
			var debrisGeom;
			var debrisType = Math.floor(Math.random() * 4);

			if (debrisType === 0) {
				debrisGeom = new THREE.BoxGeometry(2 + Math.random() * 3, 1 + Math.random() * 2, 1 + Math.random() * 2);
			} else if (debrisType === 1) {
				debrisGeom = new THREE.SphereGeometry(1 + Math.random() * 1.5, 6, 6);
			} else if (debrisType === 2) {
				debrisGeom = new THREE.CylinderGeometry(0.5 + Math.random() * 1, 0.5 + Math.random() * 1, 2 + Math.random() * 2, 8);
			} else {
				debrisGeom = new THREE.ConeGeometry(1 + Math.random() * 1.5, 2 + Math.random() * 2, 6);
			}

			var debrisMaterial = new THREE.MeshLambertMaterial({
				color: 0x3a3a3a + Math.floor(Math.random() * 0x222222)
			});
			var debrisMesh = new THREE.Mesh(debrisGeom, debrisMaterial);

			debrisMesh.position.x = -100 + Math.random() * 200;
			debrisMesh.position.y = 0.5 + Math.random() * 2;
			debrisMesh.position.z = -100 + Math.random() * 200;
			debrisMesh.rotation.x = Math.random() * Math.PI * 2;
			debrisMesh.rotation.y = Math.random() * Math.PI * 2;
			debrisMesh.rotation.z = Math.random() * Math.PI * 2;

			scene.add(debrisMesh);
			objects.push(debrisMesh);
			debrisCount++;

			if (Math.random() > 0.6) {
				tumblingDebris.push({
					mesh: debrisMesh,
					angularVelocity: {
						x: (Math.random() - 0.5) * 0.05,
						y: (Math.random() - 0.5) * 0.05,
						z: (Math.random() - 0.5) * 0.05
					}
				});
			}
		}

		var metalScrapsCount = 0;
		for (var j = 0; j < 10; j++) {
			var scrapGeom = new THREE.BoxGeometry(3 + Math.random() * 4, 0.3 + Math.random() * 0.5, 2 + Math.random() * 3);
			var scrapMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
			var scrapMesh = new THREE.Mesh(scrapGeom, scrapMaterial);

			scrapMesh.position.x = -80 + Math.random() * 160;
			scrapMesh.position.y = 0.2 + Math.random() * 0.3;
			scrapMesh.position.z = -80 + Math.random() * 160;
			scrapMesh.rotation.y = Math.random() * Math.PI * 2;
			scrapMesh.rotation.z = Math.random() * 0.5 - 0.25;

			scene.add(scrapMesh);
			objects.push(scrapMesh);
			metalScrapsCount++;
		}
	}

	function update(delta) {
		ashDriftTime += delta;

		for (var i = 0; i < smokeParticles.length; i++) {
			var smoke = smokeParticles[i];
			smoke.mesh.position.y += smoke.riseSpeed * delta * 10;
			smoke.mesh.position.x = smoke.baseX + Math.sin(ashDriftTime * 0.5 + i) * smoke.driftX * 5;
			smoke.mesh.position.z = smoke.baseZ + Math.cos(ashDriftTime * 0.5 + i) * smoke.driftZ * 5;

			smoke.mesh.scale.x = 1 + Math.sin(ashDriftTime + i) * 0.1;
			smoke.mesh.scale.y = 1 + Math.sin(ashDriftTime + i) * 0.1;
			smoke.mesh.scale.z = 1 + Math.sin(ashDriftTime + i) * 0.1;

			if (smoke.mesh.position.y > smoke.baseY + 40) {
				smoke.mesh.position.y = smoke.baseY;
			}
		}

		for (var j = 0; j < tumblingDebris.length; j++) {
			var debris = tumblingDebris[j];
			debris.mesh.rotation.x += debris.angularVelocity.x;
			debris.mesh.rotation.y += debris.angularVelocity.y;
			debris.mesh.rotation.z += debris.angularVelocity.z;
		}

		for (var k = 0; k < objects.length; k++) {
			if (objects[k].position.y < 0.1) {
				var driftAmount = Math.sin(ashDriftTime * 0.3 + k) * 0.05;
				objects[k].position.y = driftAmount;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		lights = [];

		smokeParticles = [];
		tumblingDebris = [];

		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
});
