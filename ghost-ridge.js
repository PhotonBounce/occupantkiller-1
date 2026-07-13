window.GhostRidge = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var lights = [];
	var ghostOrbs = [];
	var fogPillars = [];
	var monument = null;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		meshes = [];
		lights = [];
		ghostOrbs = [];
		fogPillars = [];

		buildMainLighting();
		buildTerrainObjects();
		buildAbandonedWeapons();
		buildCommandTent();
		buildArtilleryPieces();
		buildMassGraveMarkers();
		buildCrashedPlane();
		buildMonumentStructure();
		buildGhostOrbs();
		buildFogPillars();
		buildRidgeRocks();
	}

	function buildMainLighting() {
		var ambLight = new THREE.AmbientLight(0x4a5568, 0.4);
		scene.add(ambLight);
		lights.push(ambLight);

		var dirLight = new THREE.DirectionalLight(0xa0a8c0, 0.5);
		dirLight.position.set(100, 80, 100);
		dirLight.castShadow = true;
		scene.add(dirLight);
		lights.push(dirLight);

		var pointLight1 = new THREE.PointLight(0x6b7f9f, 0.3, 150);
		pointLight1.position.set(-50, 30, -80);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0x5a6b8f, 0.3, 150);
		pointLight2.position.set(80, 25, 60);
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function buildTerrainObjects() {
		var groundMat = new THREE.MeshLambertMaterial({ color: 0x5a6b7f });

		var groundBox = new THREE.Mesh(new THREE.BoxGeometry(300, 2, 300), groundMat);
		groundBox.position.set(0, -1, 0);
		groundBox.castShadow = true;
		groundBox.receiveShadow = true;
		scene.add(groundBox);
		meshes.push(groundBox);

		for (var i = 0; i < 12; i++) {
			var rockGeom = new THREE.SphereGeometry(Math.random() * 3 + 1.5, 6, 6);
			var rockMat = new THREE.MeshLambertMaterial({ color: 0x6a7a8f + Math.random() * 0x1a2a3f });
			var rock = new THREE.Mesh(rockGeom, rockMat);
			rock.position.set(
				Math.random() * 200 - 100,
				0.5,
				Math.random() * 200 - 100
			);
			rock.castShadow = true;
			rock.receiveShadow = true;
			scene.add(rock);
			meshes.push(rock);
		}
	}

	function buildAbandonedWeapons() {
		var weaponCircleRadius = 40;
		var weaponCount = 16;
		var gunMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var ammountMat = new THREE.MeshLambertMaterial({ color: 0x5f5f5f });

		for (var i = 0; i < weaponCount; i++) {
			var angle = (i / weaponCount) * Math.PI * 2;
			var x = Math.cos(angle) * weaponCircleRadius;
			var z = Math.sin(angle) * weaponCircleRadius;

			var barrelGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
			var barrel = new THREE.Mesh(barrelGeom, gunMat);
			barrel.position.set(x, 1.5, z);
			barrel.rotation.z = Math.PI / 2.5;
			barrel.castShadow = true;
			scene.add(barrel);
			meshes.push(barrel);

			var stockGeom = new THREE.BoxGeometry(0.4, 0.3, 1.2);
			var stock = new THREE.Mesh(stockGeom, gunMat);
			stock.position.set(x - 1.2, 1.3, z);
			stock.castShadow = true;
			scene.add(stock);
			meshes.push(stock);

			var magGeom = new THREE.BoxGeometry(0.2, 0.8, 0.3);
			var mag = new THREE.Mesh(magGeom, ammountMat);
			mag.position.set(x + 0.1, 1.2, z + 0.2);
			mag.castShadow = true;
			scene.add(mag);
			meshes.push(mag);
		}
	}

	function buildCommandTent() {
		var tentMat = new THREE.MeshLambertMaterial({ color: 0x7a7a8a });
		var tentPoleRadius = 0.25;
		var tentPoleHeight = 4;

		var pole1 = new THREE.Mesh(new THREE.CylinderGeometry(tentPoleRadius, tentPoleRadius, tentPoleHeight, 8), tentMat);
		pole1.position.set(-25, tentPoleHeight / 2, -25);
		pole1.castShadow = true;
		scene.add(pole1);
		meshes.push(pole1);

		var pole2 = new THREE.Mesh(new THREE.CylinderGeometry(tentPoleRadius, tentPoleRadius, tentPoleHeight, 8), tentMat);
		pole2.position.set(25, tentPoleHeight / 2, -25);
		pole2.castShadow = true;
		scene.add(pole2);
		meshes.push(pole2);

		var pole3 = new THREE.Mesh(new THREE.CylinderGeometry(tentPoleRadius, tentPoleRadius, tentPoleHeight, 8), tentMat);
		pole3.position.set(-25, tentPoleHeight / 2, 25);
		pole3.castShadow = true;
		scene.add(pole3);
		meshes.push(pole3);

		var pole4 = new THREE.Mesh(new THREE.CylinderGeometry(tentPoleRadius, tentPoleRadius, tentPoleHeight, 8), tentMat);
		pole4.position.set(25, tentPoleHeight / 2, 25);
		pole4.castShadow = true;
		scene.add(pole4);
		meshes.push(pole4);

		var mapTableMat = new THREE.MeshLambertMaterial({ color: 0x6a6a7a });
		var tableTop = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 6), mapTableMat);
		tableTop.position.set(0, 1.2, 0);
		tableTop.castShadow = true;
		scene.add(tableTop);
		meshes.push(tableTop);

		var tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), mapTableMat);
		tableLeg.position.set(-3.5, 0.6, -2.5);
		tableLeg.castShadow = true;
		scene.add(tableLeg);
		meshes.push(tableLeg);

		var tableLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), mapTableMat);
		tableLeg2.position.set(3.5, 0.6, -2.5);
		tableLeg2.castShadow = true;
		scene.add(tableLeg2);
		meshes.push(tableLeg2);

		var tableLeg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), mapTableMat);
		tableLeg3.position.set(-3.5, 0.6, 2.5);
		tableLeg3.castShadow = true;
		scene.add(tableLeg3);
		meshes.push(tableLeg3);

		var tableLeg4 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), mapTableMat);
		tableLeg4.position.set(3.5, 0.6, 2.5);
		tableLeg4.castShadow = true;
		scene.add(tableLeg4);
		meshes.push(tableLeg4);

		var scatteredMapMat = new THREE.MeshLambertMaterial({ color: 0x8a9aaa });
		for (var i = 0; i < 5; i++) {
			var mapPiece = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 1.2), scatteredMapMat);
			mapPiece.position.set(
				Math.random() * 6 - 3,
				1.25,
				Math.random() * 4 - 2
			);
			mapPiece.rotation.z = Math.random() * Math.PI;
			mapPiece.castShadow = true;
			scene.add(mapPiece);
			meshes.push(mapPiece);
		}
	}

	function buildArtilleryPieces() {
		var artilleryMat = new THREE.MeshLambertMaterial({ color: 0x4a4a5a });
		var barrelMat = new THREE.MeshLambertMaterial({ color: 0x3a3a4a });

		var positions = [
			[-70, 0, -60],
			[70, 0, -50],
			[50, 0, 80]
		];

		for (var p = 0; p < positions.length; p++) {
			var pos = positions[p];

			var baseGeom = new THREE.CylinderGeometry(2.5, 3, 1.5, 12);
			var base = new THREE.Mesh(baseGeom, artilleryMat);
			base.position.set(pos[0], 0.75, pos[2]);
			base.castShadow = true;
			scene.add(base);
			meshes.push(base);

			var breechGeom = new THREE.SphereGeometry(1.2, 8, 8);
			var breech = new THREE.Mesh(breechGeom, barrelMat);
			breech.position.set(pos[0], 2.2, pos[2]);
			breech.castShadow = true;
			scene.add(breech);
			meshes.push(breech);

			var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 5, 8);
			var barrel = new THREE.Mesh(barrelGeom, barrelMat);
			barrel.position.set(pos[0], 2.5, pos[2] + 2);
			barrel.rotation.x = Math.PI / 5;
			barrel.castShadow = true;
			scene.add(barrel);
			meshes.push(barrel);

			var wheelMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
			var wheelGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.4, 12);
			var wheel1 = new THREE.Mesh(wheelGeom, wheelMat);
			wheel1.position.set(pos[0] - 2.5, 1.5, pos[2]);
			wheel1.rotation.z = Math.PI / 2;
			wheel1.castShadow = true;
			scene.add(wheel1);
			meshes.push(wheel1);

			var wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
			wheel2.position.set(pos[0] + 2.5, 1.5, pos[2]);
			wheel2.rotation.z = Math.PI / 2;
			wheel2.castShadow = true;
			scene.add(wheel2);
			meshes.push(wheel2);
		}
	}

	function buildMassGraveMarkers() {
		var markerMat = new THREE.MeshLambertMaterial({ color: 0x9a9aaa });
		var markerLineColor = 0x7a8a9a;

		var markerArea = [
			[-60, 30],
			[60, -40],
			[-30, -70]
		];

		for (var area = 0; area < markerArea.length; area++) {
			var centerX = markerArea[area][0];
			var centerZ = markerArea[area][1];

			for (var m = 0; m < 8; m++) {
				var offsetX = Math.random() * 20 - 10;
				var offsetZ = Math.random() * 20 - 10;

				var crossBar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 0.15), markerMat);
				crossBar.position.set(centerX + offsetX, 1.5, centerZ + offsetZ);
				crossBar.rotation.z = Math.PI / 6;
				crossBar.castShadow = true;
				scene.add(crossBar);
				meshes.push(crossBar);

				var vertBar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), markerMat);
				vertBar.position.set(centerX + offsetX, 1.5, centerZ + offsetZ);
				vertBar.castShadow = true;
				scene.add(vertBar);
				meshes.push(vertBar);
			}
		}
	}

	function buildCrashedPlane() {
		var fuselageMat = new THREE.MeshLambertMaterial({ color: 0x6a7a8a });
		var winMat = new THREE.MeshLambertMaterial({ color: 0x7a8a9a });

		var fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, 15, 10), fuselageMat);
		fuselage.position.set(-80, 3, -50);
		fuselage.rotation.z = Math.PI / 8;
		fuselage.rotation.y = Math.PI / 4;
		fuselage.castShadow = true;
		scene.add(fuselage);
		meshes.push(fuselage);

		var wingLeft = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 3), winMat);
		wingLeft.position.set(-80, 4, -40);
		wingLeft.rotation.z = Math.PI / 10;
		wingLeft.castShadow = true;
		scene.add(wingLeft);
		meshes.push(wingLeft);

		var wingRight = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 2.5), winMat);
		wingRight.position.set(-75, 2.5, -60);
		wingRight.rotation.z = -Math.PI / 12;
		wingRight.castShadow = true;
		scene.add(wingRight);
		meshes.push(wingRight);

		var tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 8), fuselageMat);
		tailFin.position.set(-72, 4, -58);
		tailFin.rotation.x = Math.PI / 3;
		tailFin.castShadow = true;
		scene.add(tailFin);
		meshes.push(tailFin);

		var cockpitGeom = new THREE.SphereGeometry(1.2, 8, 8);
		var cockpitMat = new THREE.MeshLambertMaterial({ color: 0x5a6a7a });
		var cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
		cockpit.position.set(-90, 4.5, -45);
		cockpit.castShadow = true;
		scene.add(cockpit);
		meshes.push(cockpit);
	}

	function buildMonumentStructure() {
		var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8a9aaa });
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x9aaa9a });

		var baseBlock1 = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 8), baseMat);
		baseBlock1.position.set(0, 0.5, 0);
		baseBlock1.castShadow = true;
		scene.add(baseBlock1);
		meshes.push(baseBlock1);
		monument = baseBlock1;

		var baseBlock2 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 6), baseMat);
		baseBlock2.position.set(0, 1.9, 0);
		baseBlock2.castShadow = true;
		scene.add(baseBlock2);
		meshes.push(baseBlock2);

		var obelisk = new THREE.Mesh(new THREE.ConeGeometry(1.5, 12, 12), stoneMat);
		obelisk.position.set(0, 7, 0);
		obelisk.castShadow = true;
		scene.add(obelisk);
		meshes.push(obelisk);

		var capStone = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), stoneMat);
		capStone.position.set(0, 13, 0);
		capStone.castShadow = true;
		scene.add(capStone);
		meshes.push(capStone);

		var plaqueMat = new THREE.MeshLambertMaterial({ color: 0xaabaaa });
		var plaque = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.3), plaqueMat);
		plaque.position.set(0, 3, -3.2);
		plaque.castShadow = true;
		scene.add(plaque);
		meshes.push(plaque);
	}

	function buildGhostOrbs() {
		var orbPaths = [
			{ center: [-50, 0], radius: 35 },
			{ center: [60, 0], radius: 30 },
			{ center: [0, 60], radius: 40 }
		];

		for (var path = 0; path < orbPaths.length; path++) {
			var orbCount = 4;
			for (var o = 0; o < orbCount; o++) {
				var orbMat = new THREE.MeshLambertMaterial({
					color: [0xc0c0e0, 0xb0d0e8, 0xd0d0c0, 0xc8b8e0][o % 4],
					emissive: [0x5050a0, 0x4080b8, 0x5050a0, 0x5040a0][o % 4]
				});
				var orbGeom = new THREE.SphereGeometry(0.6, 8, 8);
				var orb = new THREE.Mesh(orbGeom, orbMat);
				orb.position.set(orbPaths[path].center[0], 5 + o, orbPaths[path].center[1]);
				orb.castShadow = true;
				scene.add(orb);
				meshes.push(orb);
				ghostOrbs.push({
					mesh: orb,
					pathCenter: orbPaths[path].center,
					pathRadius: orbPaths[path].radius,
					angle: o * Math.PI / 2,
					height: 5 + o,
					speed: 0.3 + Math.random() * 0.2
				});
			}
		}
	}

	function buildFogPillars() {
		var fogMat = new THREE.MeshLambertMaterial({
			color: 0xd0d8e0,
			transparent: true,
			opacity: 0.5
		});

		var pillarPositions = [
			[-40, -30],
			[40, -40],
			[-50, 50],
			[50, 40],
			[0, -70],
			[-80, 0],
			[80, 20]
		];

		for (var i = 0; i < pillarPositions.length; i++) {
			var x = pillarPositions[i][0];
			var z = pillarPositions[i][1];

			var pillarGeom = new THREE.CylinderGeometry(3.5, 4, 8, 12);
			var pillar = new THREE.Mesh(pillarGeom, fogMat);
			pillar.position.set(x, 4, z);
			pillar.castShadow = false;
			scene.add(pillar);
			meshes.push(pillar);
			fogPillars.push({
				mesh: pillar,
				baseY: 4,
				swayAmount: 0.5,
				swaySpeed: 0.5 + Math.random() * 0.3
			});
		}
	}

	function buildRidgeRocks() {
		var rockMat = new THREE.MeshLambertMaterial({ color: 0x7a8a9a });
		var smallRockMat = new THREE.MeshLambertMaterial({ color: 0x6a7a8a });

		var largeRockCount = 15;
		for (var i = 0; i < largeRockCount; i++) {
			var rockSize = Math.random() * 4 + 2;
			var rockGeom = new THREE.SphereGeometry(rockSize, 6, 6);
			var rock = new THREE.Mesh(rockGeom, rockMat);
			rock.position.set(
				Math.random() * 280 - 140,
				rockSize * 0.8,
				Math.random() * 280 - 140
			);
			rock.castShadow = true;
			rock.receiveShadow = true;
			scene.add(rock);
			meshes.push(rock);
		}

		var screeCount = 40;
		for (var s = 0; s < screeCount; s++) {
			var screeSize = Math.random() * 0.8 + 0.3;
			var screeGeom = new THREE.BoxGeometry(screeSize * 0.8, screeSize, screeSize * 1.2);
			var scree = new THREE.Mesh(screeGeom, smallRockMat);
			scree.position.set(
				Math.random() * 280 - 140,
				screeSize * 0.5,
				Math.random() * 280 - 140
			);
			scree.rotation.set(
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI
			);
			scree.castShadow = true;
			scree.receiveShadow = true;
			scene.add(scree);
			meshes.push(scree);
		}
	}

	function update(delta) {
		var t = performance.now() * 0.001;

		for (var i = 0; i < ghostOrbs.length; i++) {
			var orb = ghostOrbs[i];
			orb.angle += orb.speed * delta;
			var x = orb.pathCenter[0] + Math.cos(orb.angle) * orb.pathRadius;
			var z = orb.pathCenter[1] + Math.sin(orb.angle) * orb.pathRadius;
			var y = orb.height + Math.sin(t * 2 + i) * 1.5;
			orb.mesh.position.set(x, y, z);

			var scale = 0.8 + Math.sin(t * 3 + i * 0.5) * 0.3;
			orb.mesh.scale.set(scale, scale, scale);
		}

		for (var f = 0; f < fogPillars.length; f++) {
			var pillar = fogPillars[f];
			var sway = Math.sin(t * pillar.swaySpeed) * pillar.swayAmount;
			pillar.mesh.position.y = pillar.baseY + sway;
			pillar.mesh.rotation.z = sway * 0.15;
		}

		if (monument) {
			var monumentScale = 1 + Math.sin(t * 1.2) * 0.08;
			monument.scale.set(monumentScale, monumentScale, monumentScale);
		}

		for (var m = 0; m < meshes.length; m++) {
			if (meshes[m].userData && meshes[m].userData.rotates) {
				meshes[m].rotation.y += delta * meshes[m].userData.rotSpeed;
			}
		}
	}

	function reset() {
		if (scene) {
			for (var i = meshes.length - 1; i >= 0; i--) {
				scene.remove(meshes[i]);
				meshes[i] = null;
			}
			for (var l = lights.length - 1; l >= 0; l--) {
				scene.remove(lights[l]);
				lights[l] = null;
			}
		}
		meshes = [];
		lights = [];
		ghostOrbs = [];
		fogPillars = [];
		monument = null;
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
