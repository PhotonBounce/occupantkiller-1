window.JadeTemple = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];
	var fireBowls = [];
	var poolWater = null;
	var vines = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];
		fireBowls = [];
		vines = [];

		buildFoundation();
		buildMainPyramid();
		buildGuardianStatues();
		buildTempleColumns();
		buildGunEmplacements();
		buildSecretChamber();
		buildRitualArea();
		buildVinedWalls();
		buildSacredPool();
		buildLighting();
	}

	function buildFoundation() {
		var foundationGeo = new THREE.BoxGeometry(200, 5, 200);
		var stoneMat = new THREE.MeshLambertMaterial({ color: 0x6b7d7f });
		var foundation = new THREE.Mesh(foundationGeo, stoneMat);
		foundation.position.set(0, 0, 0);
		foundation.receiveShadow = true;
		scene.add(foundation);
		objects.push(foundation);

		var baseGeo = new THREE.BoxGeometry(180, 3, 180);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x5a6b6d });
		var base = new THREE.Mesh(baseGeo, baseMat);
		base.position.set(0, -4, 0);
		base.receiveShadow = true;
		scene.add(base);
		objects.push(base);
	}

	function buildMainPyramid() {
		var layerCount = 6;
		var baseSize = 160;
		var layerHeight = 8;

		for (var i = 0; i < layerCount; i++) {
			var size = baseSize - (i * 20);
			var geoBlock = new THREE.BoxGeometry(size, layerHeight, size);
			var matJade = new THREE.MeshLambertMaterial({ color: 0x2d5a4e });
			var block = new THREE.Mesh(geoBlock, matJade);
			block.position.set(0, i * layerHeight + 2, 0);
			block.castShadow = true;
			block.receiveShadow = true;
			scene.add(block);
			objects.push(block);

			if (i > 0) {
				var edgeGeo = new THREE.BoxGeometry(size + 4, 2, size + 4);
				var edgeMat = new THREE.MeshLambertMaterial({ color: 0x1a3a32 });
				var edge = new THREE.Mesh(edgeGeo, edgeMat);
				edge.position.set(0, i * layerHeight + 6, 0);
				edge.castShadow = true;
				edge.receiveShadow = true;
				scene.add(edge);
				objects.push(edge);
			}
		}

		var peakGeo = new THREE.ConeGeometry(12, 20, 8);
		var peakMat = new THREE.MeshLambertMaterial({ color: 0x4a8f7c });
		var peak = new THREE.Mesh(peakGeo, peakMat);
		peak.position.set(0, 55, 0);
		peak.castShadow = true;
		peak.receiveShadow = true;
		scene.add(peak);
		objects.push(peak);
	}

	function buildGuardianStatues() {
		var positions = [
			[-50, 0, -50],
			[50, 0, -50],
			[-50, 0, 50],
			[50, 0, 50]
		];

		for (var i = 0; i < positions.length; i++) {
			var headGeo = new THREE.SphereGeometry(5, 8, 8);
			var stoneMat = new THREE.MeshLambertMaterial({ color: 0x7a8d8f });
			var head = new THREE.Mesh(headGeo, stoneMat);
			head.position.set(positions[i][0], positions[i][1] + 22, positions[i][2]);
			head.castShadow = true;
			head.receiveShadow = true;
			scene.add(head);
			objects.push(head);

			var bodyGeo = new THREE.CylinderGeometry(4, 5, 18, 8);
			var bodyMat = new THREE.MeshLambertMaterial({ color: 0x6b7d7f });
			var body = new THREE.Mesh(bodyGeo, bodyMat);
			body.position.set(positions[i][0], positions[i][1] + 10, positions[i][2]);
			body.castShadow = true;
			body.receiveShadow = true;
			scene.add(body);
			objects.push(body);

			var armGeo = new THREE.CylinderGeometry(2, 2, 12, 6);
			var armMat = new THREE.MeshLambertMaterial({ color: 0x6b7d7f });
			var armLeft = new THREE.Mesh(armGeo, armMat);
			armLeft.position.set(positions[i][0] - 7, positions[i][1] + 12, positions[i][2]);
			armLeft.castShadow = true;
			armLeft.receiveShadow = true;
			scene.add(armLeft);
			objects.push(armLeft);

			var armRight = new THREE.Mesh(armGeo, armMat);
			armRight.position.set(positions[i][0] + 7, positions[i][1] + 12, positions[i][2]);
			armRight.castShadow = true;
			armRight.receiveShadow = true;
			scene.add(armRight);
			objects.push(armRight);

			var legGeo = new THREE.CylinderGeometry(2.5, 2.5, 10, 6);
			var legMat = new THREE.MeshLambertMaterial({ color: 0x5a6b6d });
			var legLeft = new THREE.Mesh(legGeo, legMat);
			legLeft.position.set(positions[i][0] - 3, positions[i][1] + 1, positions[i][2]);
			legLeft.castShadow = true;
			legLeft.receiveShadow = true;
			scene.add(legLeft);
			objects.push(legLeft);

			var legRight = new THREE.Mesh(legGeo, legMat);
			legRight.position.set(positions[i][0] + 3, positions[i][1] + 1, positions[i][2]);
			legRight.castShadow = true;
			legRight.receiveShadow = true;
			scene.add(legRight);
			objects.push(legRight);
		}
	}

	function buildTempleColumns() {
		var columnPositions = [
			[-40, 0, -35],
			[0, 0, -35],
			[40, 0, -35],
			[-40, 0, 35],
			[0, 0, 35],
			[40, 0, 35],
			[-50, 0, -10],
			[-50, 0, 10],
			[50, 0, -10],
			[50, 0, 10]
		];

		for (var i = 0; i < columnPositions.length; i++) {
			var colGeo = new THREE.CylinderGeometry(4, 4, 40, 12);
			var colMat = new THREE.MeshLambertMaterial({ color: 0x8a9c9e });
			var column = new THREE.Mesh(colGeo, colMat);
			column.position.set(columnPositions[i][0], columnPositions[i][1] + 20, columnPositions[i][2]);
			column.castShadow = true;
			column.receiveShadow = true;
			scene.add(column);
			objects.push(column);

			var capGeo = new THREE.CylinderGeometry(5, 4, 2, 12);
			var capMat = new THREE.MeshLambertMaterial({ color: 0x4a8f7c });
			var cap = new THREE.Mesh(capGeo, capMat);
			cap.position.set(columnPositions[i][0], columnPositions[i][1] + 41, columnPositions[i][2]);
			cap.castShadow = true;
			cap.receiveShadow = true;
			scene.add(cap);
			objects.push(cap);
		}
	}

	function buildGunEmplacements() {
		var emplacementPositions = [
			[-45, 45, -45],
			[45, 45, -45],
			[-45, 45, 45],
			[45, 45, 45]
		];

		for (var i = 0; i < emplacementPositions.length; i++) {
			var platformGeo = new THREE.BoxGeometry(10, 3, 12);
			var metalMat = new THREE.MeshLambertMaterial({ color: 0x3a4a4c });
			var platform = new THREE.Mesh(platformGeo, metalMat);
			platform.position.set(emplacementPositions[i][0], emplacementPositions[i][1], emplacementPositions[i][2]);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);

			var barrelGeo = new THREE.CylinderGeometry(1, 1, 15, 8);
			var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a3a3c });
			var barrel = new THREE.Mesh(barrelGeo, barrelMat);
			barrel.rotation.z = 0.3;
			barrel.position.set(emplacementPositions[i][0], emplacementPositions[i][1] + 4, emplacementPositions[i][2]);
			barrel.castShadow = true;
			barrel.receiveShadow = true;
			scene.add(barrel);
			objects.push(barrel);

			var shieldGeo = new THREE.BoxGeometry(2, 8, 14);
			var shieldMat = new THREE.MeshLambertMaterial({ color: 0x4a5a5c });
			var shield = new THREE.Mesh(shieldGeo, shieldMat);
			shield.position.set(emplacementPositions[i][0] - 6, emplacementPositions[i][1] + 4, emplacementPositions[i][2]);
			shield.castShadow = true;
			shield.receiveShadow = true;
			scene.add(shield);
			objects.push(shield);
		}
	}

	function buildSecretChamber() {
		var chamberGeo = new THREE.BoxGeometry(60, 30, 50);
		var chamberMat = new THREE.MeshLambertMaterial({ color: 0x2a3a3c });
		var chamber = new THREE.Mesh(chamberGeo, chamberMat);
		chamber.position.set(0, -20, 0);
		chamber.castShadow = true;
		chamber.receiveShadow = true;
		scene.add(chamber);
		objects.push(chamber);

		var wallThickness = 2;
		var wallGeo = new THREE.BoxGeometry(60 + wallThickness * 2, 2, 50 + wallThickness * 2);
		var wallMat = new THREE.MeshLambertMaterial({ color: 0x1a2a2c });
		var wallLeft = new THREE.Mesh(wallGeo, wallMat);
		wallLeft.position.set(-35, -18, 0);
		wallLeft.castShadow = true;
		wallLeft.receiveShadow = true;
		scene.add(wallLeft);
		objects.push(wallLeft);

		var artifactGeo = new THREE.SphereGeometry(4, 12, 12);
		var artifactMat = new THREE.MeshLambertMaterial({ color: 0x4a9f8c });
		var artifact = new THREE.Mesh(artifactGeo, artifactMat);
		artifact.position.set(-15, -15, -10);
		artifact.castShadow = true;
		artifact.receiveShadow = true;
		scene.add(artifact);
		objects.push(artifact);
		animatedObjects.push(artifact);

		var weaponGeo = new THREE.BoxGeometry(3, 1, 8);
		var weaponMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3c });
		var weapon = new THREE.Mesh(weaponGeo, weaponMat);
		weapon.position.set(15, -15, 10);
		weapon.castShadow = true;
		weapon.receiveShadow = true;
		scene.add(weapon);
		objects.push(weapon);

		var crateGeo = new THREE.BoxGeometry(8, 8, 8);
		var crateMat = new THREE.MeshLambertMaterial({ color: 0x4a5a5c });
		var crate1 = new THREE.Mesh(crateGeo, crateMat);
		crate1.position.set(-10, -10, 15);
		crate1.castShadow = true;
		crate1.receiveShadow = true;
		scene.add(crate1);
		objects.push(crate1);

		var crate2 = new THREE.Mesh(crateGeo, crateMat);
		crate2.position.set(0, -10, 15);
		crate2.castShadow = true;
		crate2.receiveShadow = true;
		scene.add(crate2);
		objects.push(crate2);

		var crate3 = new THREE.Mesh(crateGeo, crateMat);
		crate3.position.set(10, -10, 15);
		crate3.castShadow = true;
		crate3.receiveShadow = true;
		scene.add(crate3);
		objects.push(crate3);
	}

	function buildRitualArea() {
		var areaGeo = new THREE.CylinderGeometry(30, 30, 1, 16);
		var areaMat = new THREE.MeshLambertMaterial({ color: 0x3a4a4c });
		var area = new THREE.Mesh(areaGeo, areaMat);
		area.position.set(0, 0.5, 0);
		area.receiveShadow = true;
		scene.add(area);
		objects.push(area);

		var bowlPositions = [
			[-15, 3, -15],
			[15, 3, -15],
			[-15, 3, 15],
			[15, 3, 15]
		];

		for (var i = 0; i < bowlPositions.length; i++) {
			var bowlGeo = new THREE.CylinderGeometry(4, 5, 3, 12);
			var bowlMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2c });
			var bowl = new THREE.Mesh(bowlGeo, bowlMat);
			bowl.position.set(bowlPositions[i][0], bowlPositions[i][1], bowlPositions[i][2]);
			bowl.castShadow = true;
			bowl.receiveShadow = true;
			scene.add(bowl);
			objects.push(bowl);
			fireBowls.push(bowl);

			var flameGeo = new THREE.ConeGeometry(2.5, 5, 8);
			var flameMat = new THREE.MeshLambertMaterial({ color: 0xff6f00 });
			var flame = new THREE.Mesh(flameGeo, flameMat);
			flame.position.set(bowlPositions[i][0], bowlPositions[i][1] + 4, bowlPositions[i][2]);
			flame.castShadow = true;
			flame.receiveShadow = true;
			scene.add(flame);
			animatedObjects.push(flame);
		}

		var altarGeo = new THREE.CylinderGeometry(8, 10, 6, 16);
		var altarMat = new THREE.MeshLambertMaterial({ color: 0x2a4a3c });
		var altar = new THREE.Mesh(altarGeo, altarMat);
		altar.position.set(0, 4, 0);
		altar.castShadow = true;
		altar.receiveShadow = true;
		scene.add(altar);
		objects.push(altar);

		var altarTopGeo = new THREE.CylinderGeometry(9, 10, 1, 16);
		var altarTopMat = new THREE.MeshLambertMaterial({ color: 0x3a6a5c });
		var altarTop = new THREE.Mesh(altarTopGeo, altarTopMat);
		altarTop.position.set(0, 7, 0);
		altarTop.castShadow = true;
		altarTop.receiveShadow = true;
		scene.add(altarTop);
		objects.push(altarTop);
	}

	function buildVinedWalls() {
		var wallPositions = [
			[-90, 25, 0, 2, 50, 120],
			[90, 25, 0, 2, 50, 120],
			[0, 25, -90, 120, 50, 2],
			[0, 25, 90, 120, 50, 2]
		];

		for (var i = 0; i < wallPositions.length; i++) {
			var wallGeo = new THREE.BoxGeometry(wallPositions[i][3], wallPositions[i][4], wallPositions[i][5]);
			var wallMat = new THREE.MeshLambertMaterial({ color: 0x5a6b6d });
			var wall = new THREE.Mesh(wallGeo, wallMat);
			wall.position.set(wallPositions[i][0], wallPositions[i][1], wallPositions[i][2]);
			wall.castShadow = true;
			wall.receiveShadow = true;
			scene.add(wall);
			objects.push(wall);

			var vineCount = 8;
			for (var v = 0; v < vineCount; v++) {
				var vineGeo = new THREE.CylinderGeometry(0.5, 0.5, 40, 4);
				var vineMat = new THREE.MeshLambertMaterial({ color: 0x2a4a3c });
				var vine = new THREE.Mesh(vineGeo, vineMat);

				if (i < 2) {
					vine.position.set(wallPositions[i][0], wallPositions[i][1], wallPositions[i][2] + (v - 4) * 12);
				} else {
					vine.position.set(wallPositions[i][0] + (v - 4) * 12, wallPositions[i][1], wallPositions[i][2]);
				}

				vine.castShadow = true;
				vine.receiveShadow = true;
				scene.add(vine);
				objects.push(vine);
				vines.push(vine);
			}
		}
	}

	function buildSacredPool() {
		var poolGeo = new THREE.CylinderGeometry(35, 35, 2, 32);
		var poolMat = new THREE.MeshLambertMaterial({ color: 0x1a4a3c });
		var pool = new THREE.Mesh(poolGeo, poolMat);
		pool.position.set(0, 1, 0);
		pool.receiveShadow = true;
		scene.add(pool);
		objects.push(pool);
		poolWater = pool;
		animatedObjects.push(pool);

		var mineCount = 6;
		for (var m = 0; m < mineCount; m++) {
			var angle = (m / mineCount) * Math.PI * 2;
			var radius = 20;
			var x = Math.cos(angle) * radius;
			var z = Math.sin(angle) * radius;

			var mineGeo = new THREE.SphereGeometry(3, 8, 8);
			var mineMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2c });
			var mine = new THREE.Mesh(mineGeo, mineMat);
			mine.position.set(x, 2, z);
			mine.castShadow = true;
			mine.receiveShadow = true;
			scene.add(mine);
			objects.push(mine);

			var spikeGeo = new THREE.ConeGeometry(0.5, 4, 6);
			var spikeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1c });
			for (var s = 0; s < 8; s++) {
				var spikeAngle = (s / 8) * Math.PI * 2;
				var spike = new THREE.Mesh(spikeGeo, spikeMat);
				spike.position.set(x + Math.cos(spikeAngle) * 2.5, 4, z + Math.sin(spikeAngle) * 2.5);
				spike.castShadow = true;
				spike.receiveShadow = true;
				scene.add(spike);
				objects.push(spike);
			}
		}

		var rimGeo = new THREE.CylinderGeometry(36, 36, 1, 32);
		var rimMat = new THREE.MeshLambertMaterial({ color: 0x6a7d7f });
		var rim = new THREE.Mesh(rimGeo, rimMat);
		rim.position.set(0, 2, 0);
		rim.castShadow = true;
		rim.receiveShadow = true;
		scene.add(rim);
		objects.push(rim);
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x2a6f5c, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
		mainLight.position.set(50, 100, 50);
		mainLight.castShadow = true;
		mainLight.shadow.mapSize.width = 2048;
		mainLight.shadow.mapSize.height = 2048;
		mainLight.shadow.camera.left = -150;
		mainLight.shadow.camera.right = 150;
		mainLight.shadow.camera.top = 150;
		mainLight.shadow.camera.bottom = -150;
		mainLight.shadow.camera.near = 0.1;
		mainLight.shadow.camera.far = 300;
		scene.add(mainLight);
		lights.push(mainLight);

		var jadeLight = new THREE.PointLight(0x3a8f7c, 0.5);
		jadeLight.position.set(0, 35, 0);
		jadeLight.castShadow = true;
		scene.add(jadeLight);
		lights.push(jadeLight);

		var fireLight1 = new THREE.PointLight(0xff6f00, 0.4);
		fireLight1.position.set(-15, 6, -15);
		scene.add(fireLight1);
		lights.push(fireLight1);

		var fireLight2 = new THREE.PointLight(0xff6f00, 0.4);
		fireLight2.position.set(15, 6, -15);
		scene.add(fireLight2);
		lights.push(fireLight2);

		var fireLight3 = new THREE.PointLight(0xff6f00, 0.4);
		fireLight3.position.set(-15, 6, 15);
		scene.add(fireLight3);
		lights.push(fireLight3);

		var fireLight4 = new THREE.PointLight(0xff6f00, 0.4);
		fireLight4.position.set(15, 6, 15);
		scene.add(fireLight4);
		lights.push(fireLight4);

		var poolLight = new THREE.PointLight(0x1a9f8c, 0.3);
		poolLight.position.set(0, 5, 0);
		scene.add(poolLight);
		lights.push(poolLight);
	}

	function update(delta) {
		var time = Date.now() * 0.001;

		for (var i = 0; i < animatedObjects.length; i++) {
			var obj = animatedObjects[i];

			if (obj === poolWater) {
				obj.scale.y = 1 + Math.sin(time * 2) * 0.05;
				obj.position.y = 1 + Math.sin(time * 2.5) * 0.3;
			} else if (fireBowls.indexOf(obj.parent || obj) >= 0 || obj.parent && fireBowls.indexOf(obj.parent) >= 0) {
				obj.scale.y = 1 + Math.sin(time * 4 + i) * 0.3;
				obj.position.y = obj.position.y + Math.sin(time * 5 + i) * 0.1;
			} else {
				obj.rotation.y += delta * 0.3;
			}
		}

		for (var v = 0; v < vines.length; v++) {
			vines[v].rotation.z = Math.sin(time * 0.5 + v) * 0.15;
		}
	}

	function reset() {
		if (scene) {
			for (var i = objects.length - 1; i >= 0; i--) {
				scene.remove(objects[i]);
				objects[i].geometry.dispose();
				objects[i].material.dispose();
			}

			for (var l = lights.length - 1; l >= 0; l--) {
				scene.remove(lights[l]);
			}
		}

		objects = [];
		lights = [];
		animatedObjects = [];
		fireBowls = [];
		vines = [];
		poolWater = null;
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
