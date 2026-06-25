window.FloodedMall = (function() {
	'use strict';

	var scene;
	var camera;
	var water = [];
	var floatingDebris = [];
	var lights = [];
	var timeElapsed = 0;
	var rippleTime = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		water = [];
		floatingDebris = [];
		lights = [];
		timeElapsed = 0;
		rippleTime = 0;

		buildMallAtrium();
		buildFloodedGround();
		buildWalkways();
		buildStoreFronts();
		buildOverturned();
		buildFoodCourt();
		buildSkylightDome();
		buildEscalators();
		buildDebris();
		buildBarricades();
		buildGenerator();
		setupLighting();
	}

	function buildMallAtrium() {
		var atrium = new THREE.BoxGeometry(60, 40, 50);
		var material = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.1,
			roughness: 0.9
		});
		var mesh = new THREE.Mesh(atrium, material);
		mesh.position.y = 20;
		mesh.scale.set(1, 1, 1);
		scene.add(mesh);

		var glass1 = new THREE.BoxGeometry(15, 0.2, 15);
		var glassMat = new THREE.MeshStandardMaterial({
			color: 0xccccff,
			metalness: 0.8,
			roughness: 0.2,
			transparent: true,
			opacity: 0.4
		});
		var glassPanel1 = new THREE.Mesh(glass1, glassMat);
		glassPanel1.position.set(-10, 38, 0);
		scene.add(glassPanel1);

		var glassPanel2 = new THREE.Mesh(glass1, glassMat);
		glassPanel2.position.set(10, 38, 0);
		scene.add(glassPanel2);

		var frameGeometry = new THREE.BoxGeometry(1, 0.5, 15);
		var frameMat = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.6
		});
		var frame1 = new THREE.Mesh(frameGeometry, frameMat);
		frame1.position.set(-17, 35, 0);
		scene.add(frame1);

		var frame2 = new THREE.Mesh(frameGeometry, frameMat);
		frame2.position.set(17, 35, 0);
		scene.add(frame2);
	}

	function buildFloodedGround() {
		var waterMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a4d66,
			metalness: 0.3,
			roughness: 0.5,
			transparent: true,
			opacity: 0.7
		});

		var waterGeometry = new THREE.BoxGeometry(58, 2, 48);
		var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
		waterMesh.position.set(0, 1, 0);
		scene.add(waterMesh);
		water.push({
			mesh: waterMesh,
			baseY: 1,
			amplitude: 0.15
		});

		for (var i = -2; i <= 2; i++) {
			for (var j = -2; j <= 2; j++) {
				var subWater = new THREE.BoxGeometry(12, 1.8, 12);
				var subMesh = new THREE.Mesh(subWater, waterMaterial);
				subMesh.position.set(i * 12, 0.9, j * 12);
				scene.add(subMesh);
				water.push({
					mesh: subMesh,
					baseY: 0.9,
					amplitude: 0.12,
					offset: (i + j) * 0.3
				});
			}
		}
	}

	function buildWalkways() {
		var walkwayMat = new THREE.MeshStandardMaterial({
			color: 0x888888,
			metalness: 0.4,
			roughness: 0.6
		});

		var walkway1 = new THREE.BoxGeometry(50, 1, 10);
		var walk1 = new THREE.Mesh(walkway1, walkwayMat);
		walk1.position.set(0, 15, 15);
		scene.add(walk1);

		var walkway2 = new THREE.BoxGeometry(50, 1, 10);
		var walk2 = new THREE.Mesh(walkway2, walkwayMat);
		walk2.position.set(0, 15, -15);
		scene.add(walk2);

		var rail1 = new THREE.BoxGeometry(48, 1.2, 0.3);
		var railMat = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.5
		});
		var railMesh1 = new THREE.Mesh(rail1, railMat);
		railMesh1.position.set(0, 15.8, 19.7);
		scene.add(railMesh1);

		var railMesh2 = new THREE.Mesh(rail1, railMat);
		railMesh2.position.set(0, 15.8, -19.7);
		scene.add(railMesh2);
	}

	function buildStoreFronts() {
		var storePositions = [
			{ x: -20, z: -10 },
			{ x: -20, z: 0 },
			{ x: -20, z: 10 },
			{ x: 20, z: -10 },
			{ x: 20, z: 0 },
			{ x: 20, z: 10 }
		];

		var storeMat = new THREE.MeshStandardMaterial({
			color: 0x443333,
			metalness: 0.2,
			roughness: 0.8
		});

		for (var i = 0; i < storePositions.length; i++) {
			var pos = storePositions[i];

			var storeGeometry = new THREE.BoxGeometry(8, 12, 4);
			var storeMesh = new THREE.Mesh(storeGeometry, storeMat);
			storeMesh.position.set(pos.x, 7, pos.z);
			scene.add(storeMesh);

			var windowLines = [];
			for (var wx = -3; wx <= 3; wx += 2) {
				for (var wy = -5; wy <= 5; wy += 3) {
					windowLines.push(new THREE.Vector3(wx, wy, 0));
					windowLines.push(new THREE.Vector3(wx, wy + 1.5, 0));
				}
			}
			var linesGeom = new THREE.BufferGeometry();
			linesGeom.setFromPoints(windowLines);
			var linesMat = new THREE.LineBasicMaterial({ color: 0x333333 });
			var linesObj = new THREE.LineSegments(linesGeom, linesMat);
			linesObj.position.set(pos.x, 7, pos.z + 2.2);
			scene.add(linesObj);
		}
	}

	function buildOverturned() {
		var rackMat = new THREE.MeshStandardMaterial({
			color: 0x997744,
			metalness: 0.1,
			roughness: 0.9
		});

		var racks = [
			{ x: -10, z: 5, rotZ: 0.7 },
			{ x: 5, z: -8, rotZ: -0.6 },
			{ x: -5, z: -5, rotZ: 0.5 },
			{ x: 8, z: 8, rotZ: -0.8 }
		];

		for (var i = 0; i < racks.length; i++) {
			var rack = racks[i];
			var rackGeometry = new THREE.BoxGeometry(3, 6, 1);
			var rackMesh = new THREE.Mesh(rackGeometry, rackMat);
			rackMesh.position.set(rack.x, 3, rack.z);
			rackMesh.rotation.z = rack.rotZ;
			scene.add(rackMesh);

			var shelfGeometry = new THREE.BoxGeometry(3.2, 0.5, 1.2);
			var shelfMat = new THREE.MeshStandardMaterial({
				color: 0x664444,
				metalness: 0.2
			});
			for (var s = 0; s < 4; s++) {
				var shelf = new THREE.Mesh(shelfGeometry, shelfMat);
				shelf.position.set(rack.x, 1 + s * 1.3, rack.z);
				shelf.rotation.z = rack.rotZ;
				scene.add(shelf);
			}
		}
	}

	function buildFoodCourt() {
		var courtMat = new THREE.MeshStandardMaterial({
			color: 0x665544,
			metalness: 0.15,
			roughness: 0.85
		});

		var tablePlate = new THREE.BoxGeometry(4, 0.3, 3);
		var tables = [
			{ x: -8, z: 12 },
			{ x: -2, z: 12 },
			{ x: 4, z: 12 },
			{ x: 10, z: 12 }
		];

		for (var i = 0; i < tables.length; i++) {
			var table = new THREE.Mesh(tablePlate, courtMat);
			table.position.set(tables[i].x, 2.5, tables[i].z);
			table.rotation.z = 0.3;
			scene.add(table);

			var legGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
			var leg1 = new THREE.Mesh(legGeometry, courtMat);
			leg1.position.set(tables[i].x - 1.5, 1.5, tables[i].z - 1);
			scene.add(leg1);

			var leg2 = new THREE.Mesh(legGeometry, courtMat);
			leg2.position.set(tables[i].x + 1.5, 1.5, tables[i].z + 1);
			scene.add(leg2);
		}

		var chairGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
		var chairMat = new THREE.MeshStandardMaterial({
			color: 0x553344,
			metalness: 0.1
		});

		for (var j = 0; j < 10; j++) {
			var chair = new THREE.Mesh(chairGeometry, chairMat);
			chair.position.set(-15 + Math.random() * 30, 1.5, 15 + Math.random() * 8);
			chair.rotation.z = Math.random() * Math.PI * 2;
			scene.add(chair);
		}
	}

	function buildSkylightDome() {
		var domeGeometry = new THREE.SphereGeometry(25, 8, 8);
		var domeMat = new THREE.MeshStandardMaterial({
			color: 0xaabbdd,
			metalness: 0.7,
			roughness: 0.3,
			transparent: true,
			opacity: 0.3
		});
		var dome = new THREE.Mesh(domeGeometry, domeMat);
		dome.position.y = 42;
		dome.scale.set(1, 0.6, 1);
		scene.add(dome);

		var crackLines = [];
		for (var c = 0; c < 8; c++) {
			var angle = (c / 8) * Math.PI * 2;
			crackLines.push(new THREE.Vector3(
				Math.cos(angle) * 20,
				0,
				Math.sin(angle) * 20
			));
			crackLines.push(new THREE.Vector3(
				Math.cos(angle) * 5,
				0,
				Math.sin(angle) * 5
			));
		}
		var crackGeom = new THREE.BufferGeometry();
		crackGeom.setFromPoints(crackLines);
		var crackMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
		var cracks = new THREE.LineSegments(crackGeom, crackMat);
		cracks.position.y = 42;
		scene.add(cracks);
	}

	function buildEscalators() {
		var escalatorMat = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.4,
			roughness: 0.7
		});

		var escStep = new THREE.BoxGeometry(8, 0.5, 1.5);
		for (var step = 0; step < 12; step++) {
			var stepMesh = new THREE.Mesh(escStep, escalatorMat);
			stepMesh.position.set(-15, 2 + step * 1.2, -15);
			stepMesh.rotation.z = 0.35;
			scene.add(stepMesh);
		}

		var escHandrail = new THREE.BoxGeometry(0.4, 0.4, 15);
		var rail1 = new THREE.Mesh(escHandrail, escalatorMat);
		rail1.position.set(-19, 8, -15);
		scene.add(rail1);

		var rail2 = new THREE.Mesh(escHandrail, escalatorMat);
		rail2.position.set(-11, 8, -15);
		scene.add(rail2);
	}

	function buildDebris() {
		var debrisMat = new THREE.MeshStandardMaterial({
			color: 0x774422,
			metalness: 0.2,
			roughness: 0.8
		});

		for (var d = 0; d < 8; d++) {
			var debrisGeometry = new THREE.BoxGeometry(
				0.5 + Math.random() * 2,
				0.3 + Math.random() * 1.5,
				0.5 + Math.random() * 2
			);
			var debrisMesh = new THREE.Mesh(debrisGeometry, debrisMat);
			debrisMesh.position.set(
				-25 + Math.random() * 50,
				3 + Math.random() * 2,
				-20 + Math.random() * 40
			);
			debrisMesh.rotation.set(
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI
			);
			scene.add(debrisMesh);
			floatingDebris.push({
				mesh: debrisMesh,
				baseX: debrisMesh.position.x,
				baseY: debrisMesh.position.y,
				baseZ: debrisMesh.position.z,
				driftSpeed: 0.5 + Math.random() * 1,
				bobHeight: 0.3 + Math.random() * 0.5
			});
		}
	}

	function buildBarricades() {
		var barricadeMat = new THREE.MeshStandardMaterial({
			color: 0x556655,
			metalness: 0.15,
			roughness: 0.9
		});

		var shelfGeometry = new THREE.BoxGeometry(2, 3, 0.8);
		var barricadePositions = [
			{ x: -25, z: 15 },
			{ x: -20, z: 18 },
			{ x: 25, z: 15 },
			{ x: 20, z: 18 }
		];

		for (var b = 0; b < barricadePositions.length; b++) {
			var pos = barricadePositions[b];
			for (var layer = 0; layer < 3; layer++) {
				var shelf = new THREE.Mesh(shelfGeometry, barricadeMat);
				shelf.position.set(pos.x + layer * 2.5, 14 + layer * 3, pos.z);
				scene.add(shelf);

				var debris = new THREE.BoxGeometry(0.6, 0.6, 0.4);
				var debrisMat2 = new THREE.MeshStandardMaterial({
					color: 0x445544
				});
				var deb = new THREE.Mesh(debris, debrisMat2);
				deb.position.set(pos.x + layer * 2.5 + 1, 16 + layer * 3, pos.z + 1.5);
				scene.add(deb);
			}
		}
	}

	function buildGenerator() {
		var genMat = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.5,
			roughness: 0.7
		});

		var genGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2.5, 8);
		var generator = new THREE.Mesh(genGeometry, genMat);
		generator.position.set(25, 1.5, -20);
		scene.add(generator);

		var genBase = new THREE.BoxGeometry(3.5, 0.5, 3.5);
		var base = new THREE.Mesh(genBase, genMat);
		base.position.set(25, 0.3, -20);
		scene.add(base);

		var lightBulbs = [];
		for (var l = 0; l < 3; l++) {
			var bulbGeometry = new THREE.SphereGeometry(0.3, 6, 6);
			var bulbMat = new THREE.MeshStandardMaterial({
				color: 0xffff00,
				emissive: 0xffff00,
				emissiveIntensity: 0.8,
				metalness: 0.1
			});
			var bulb = new THREE.Mesh(bulbGeometry, bulbMat);
			bulb.position.set(25 - 1 + l * 1, 4.5, -20);
			scene.add(bulb);
			lightBulbs.push({
				mesh: bulb,
				material: bulbMat,
				flickerRate: 0.05 + Math.random() * 0.1
			});
		}
		lights.push(lightBulbs);
	}

	function setupLighting() {
		var ambientLight = new THREE.AmbientLight(0x888888, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(30, 35, 20);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 100;
		directionalLight.shadow.camera.left = -60;
		directionalLight.shadow.camera.right = 60;
		directionalLight.shadow.camera.top = 50;
		directionalLight.shadow.camera.bottom = -50;
		scene.add(directionalLight);

		var pointLight = new THREE.PointLight(0x6699ff, 0.5, 40);
		pointLight.position.set(0, 25, 0);
		scene.add(pointLight);
	}

	function update(delta) {
		timeElapsed += delta;
		rippleTime += delta;

		for (var i = 0; i < water.length; i++) {
			var w = water[i];
			var offset = w.offset || 0;
			w.mesh.position.y = w.baseY + Math.sin(rippleTime * 2 + offset) * w.amplitude;
		}

		for (var d = 0; d < floatingDebris.length; d++) {
			var debris = floatingDebris[d];
			var drift = Math.sin(timeElapsed * debris.driftSpeed) * 0.5;
			var bob = Math.cos(timeElapsed * 1.5 + d) * debris.bobHeight;
			debris.mesh.position.x = debris.baseX + drift;
			debris.mesh.position.y = debris.baseY + bob;
			debris.mesh.rotation.x += 0.01;
			debris.mesh.rotation.y += 0.015;
		}

		for (var lg = 0; lg < lights.length; lg++) {
			var bulbGroup = lights[lg];
			for (var lb = 0; lb < bulbGroup.length; lb++) {
				var bulb = bulbGroup[lb];
				var flicker = Math.random() < bulb.flickerRate ? 0.3 : 1;
				bulb.material.emissiveIntensity = 0.6 * flicker + 0.2;
			}
		}
	}

	function reset() {
		scene = null;
		camera = null;
		water = [];
		floatingDebris = [];
		lights = [];
		timeElapsed = 0;
		rippleTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
