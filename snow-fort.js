window.SnowFort = (function() {
	'use strict';

	var scene = null;
	var camera = null;

	var snowflakes = [];
	var snowmobiles = [];
	var avalancheBombs = [];
	var trees = [];
	var lights = [];

	var sceneObjects = [];

	function buildfortWalls() {
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f8ff });
		var wallGeometry = new THREE.BoxGeometry(2, 3, 0.5);

		var positions = [
			{ x: 0, y: 1.5, z: -30 },
			{ x: 10, y: 1.5, z: -30 },
			{ x: -10, y: 1.5, z: -30 },
			{ x: 20, y: 1.5, z: -30 },
			{ x: -20, y: 1.5, z: -30 },
			{ x: 25, y: 1.5, z: -20 },
			{ x: -25, y: 1.5, z: -20 },
			{ x: 30, y: 1.5, z: 0 },
			{ x: -30, y: 1.5, z: 0 },
			{ x: 25, y: 1.5, z: 20 },
			{ x: -25, y: 1.5, z: 20 }
		];

		var i = 0;
		while (i < positions.length) {
			var pos = positions[i];
			var wall = new THREE.Mesh(wallGeometry, wallMaterial);
			wall.position.set(pos.x, pos.y, pos.z);
			if (i > 4) {
				wall.rotation.y = Math.PI / 2;
			}
			scene.add(wall);
			sceneObjects.push(wall);
			i++;
		}
	}

	function buildIgloo() {
		var domeGeometry = new THREE.SphereGeometry(5, 16, 8);
		var domeMaterial = new THREE.MeshLambertMaterial({ color: 0xe6f2ff });
		var dome = new THREE.Mesh(domeGeometry, domeMaterial);
		dome.position.set(0, 3, 0);
		dome.scale.y = 0.6;
		scene.add(dome);
		sceneObjects.push(dome);

		var doorGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0xb0d4ff });
		var door = new THREE.Mesh(doorGeometry, doorMaterial);
		door.position.set(0, 1.5, 5.2);
		scene.add(door);
		sceneObjects.push(door);

		var windowGeometry = new THREE.SphereGeometry(0.6, 8, 8);
		var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
		var windowl = new THREE.Mesh(windowGeometry, windowMaterial);
		windowl.position.set(-2, 3, 5);
		scene.add(windowl);
		sceneObjects.push(windowl);

		var windowr = new THREE.Mesh(windowGeometry, windowMaterial);
		windowr.position.set(2, 3, 5);
		scene.add(windowr);
		sceneObjects.push(windowr);
	}

	function buildSnowmobileGarage() {
		var roofGeometry = new THREE.BoxGeometry(8, 3, 6);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xfffacd });
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(-18, 2, 0);
		scene.add(roof);
		sceneObjects.push(roof);

		var wallGeometry = new THREE.BoxGeometry(8, 4, 0.5);
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf5fffa });
		var wallleft = new THREE.Mesh(wallGeometry, wallMaterial);
		wallleft.position.set(-18, 2, -3);
		scene.add(wallleft);
		sceneObjects.push(wallleft);

		var wallright = new THREE.Mesh(wallGeometry, wallMaterial);
		wallright.position.set(-18, 2, 3);
		scene.add(wallright);
		sceneObjects.push(wallright);

		buildSnowmobiles();
	}

	function buildSnowmobiles() {
		var bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 3);
		var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });

		var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
		var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		var snowmobilePositions = [
			{ x: -20, y: 1, z: 0 },
			{ x: -16, y: 1, z: 0 }
		];

		var i = 0;
		while (i < snowmobilePositions.length) {
			var pos = snowmobilePositions[i];
			var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
			body.position.set(pos.x, pos.y, pos.z);

			var wheelfl = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheelfl.position.set(pos.x - 0.5, pos.y - 0.5, pos.z - 1);
			wheelfl.rotation.z = Math.PI / 2;

			var wheelfr = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheelfr.position.set(pos.x + 0.5, pos.y - 0.5, pos.z - 1);
			wheelfr.rotation.z = Math.PI / 2;

			var wheelbl = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheelbl.position.set(pos.x - 0.5, pos.y - 0.5, pos.z + 1);
			wheelbl.rotation.z = Math.PI / 2;

			var wheelbr = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheelbr.position.set(pos.x + 0.5, pos.y - 0.5, pos.z + 1);
			wheelbr.rotation.z = Math.PI / 2;

			scene.add(body);
			scene.add(wheelfl);
			scene.add(wheelfr);
			scene.add(wheelbl);
			scene.add(wheelbr);

			sceneObjects.push(body);
			sceneObjects.push(wheelfl);
			sceneObjects.push(wheelfr);
			sceneObjects.push(wheelbl);
			sceneObjects.push(wheelbr);

			snowmobiles.push({
				body: body,
				initialY: pos.y
			});

			i++;
		}
	}

	function buildSkiSlope() {
		var slopeGeometry = new THREE.BoxGeometry(20, 0.5, 40);
		var slopeMaterial = new THREE.MeshLambertMaterial({ color: 0xf0ffff });
		var slope = new THREE.Mesh(slopeGeometry, slopeMaterial);
		slope.position.set(20, 0.25, 25);
		slope.rotation.z = -0.3;
		scene.add(slope);
		sceneObjects.push(slope);

		var markerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
		var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });

		var j = 0;
		while (j < 5) {
			var marker = new THREE.Mesh(markerGeometry, markerMaterial);
			marker.position.set(20, 2, 0 + j * 10);
			scene.add(marker);
			sceneObjects.push(marker);
			j++;
		}
	}

	function buildFrozenPond() {
		var pondGeometry = new THREE.BoxGeometry(15, 0.2, 15);
		var pondMaterial = new THREE.MeshLambertMaterial({ color: 0xcce5ff });
		var pond = new THREE.Mesh(pondGeometry, pondMaterial);
		pond.position.set(-15, 0.1, 10);
		scene.add(pond);
		sceneObjects.push(pond);

		var crackGeometry = new THREE.BoxGeometry(0.1, 0.25, 12);
		var crackMaterial = new THREE.MeshLambertMaterial({ color: 0x4a6fa5 });

		var crackCount = 4;
		var k = 0;
		while (k < crackCount) {
			var crack = new THREE.Mesh(crackGeometry, crackMaterial);
			crack.position.set(-20 + k * 4, 0.15, 10);
			crack.rotation.z = Math.random() * 0.3;
			scene.add(crack);
			sceneObjects.push(crack);
			k++;
		}
	}

	function buildPineForest() {
		var treePositions = [
			{ x: -40, z: -20 },
			{ x: -40, z: -5 },
			{ x: -40, z: 10 },
			{ x: -40, z: 25 },
			{ x: 40, z: -20 },
			{ x: 40, z: -5 },
			{ x: 40, z: 10 },
			{ x: 40, z: 25 },
			{ x: -25, z: -35 },
			{ x: -10, z: -35 },
			{ x: 5, z: -35 },
			{ x: 20, z: -35 }
		];

		var i = 0;
		while (i < treePositions.length) {
			var pos = treePositions[i];
			buildTree(pos.x, pos.z);
			i++;
		}
	}

	function buildTree(x, z) {
		var trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 6);
		var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
		var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
		trunk.position.set(x, 2, z);
		scene.add(trunk);
		sceneObjects.push(trunk);

		var foliageGeometry = new THREE.ConeGeometry(2.5, 5, 8);
		var foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
		foliage.position.set(x, 5, z);
		scene.add(foliage);
		sceneObjects.push(foliage);

		var foliageUpper = new THREE.Mesh(foliageGeometry, foliageMaterial);
		foliageUpper.position.set(x, 7.5, z);
		foliageUpper.scale.y = 0.7;
		scene.add(foliageUpper);
		sceneObjects.push(foliageUpper);

		trees.push({
			trunk: trunk,
			foliage: foliage
		});
	}

	function buildTents() {
		var tentPositions = [
			{ x: 5, z: -20 },
			{ x: 12, z: -20 },
			{ x: 5, z: -12 },
			{ x: 12, z: -12 }
		];

		var i = 0;
		while (i < tentPositions.length) {
			var pos = tentPositions[i];
			buildTent(pos.x, pos.z);
			i++;
		}
	}

	function buildTent(x, z) {
		var tentGeometry = new THREE.ConeGeometry(2, 2.5, 6);
		var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
		var tent = new THREE.Mesh(tentGeometry, tentMaterial);
		tent.position.set(x, 1.25, z);
		scene.add(tent);
		sceneObjects.push(tent);

		var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 4);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var pole = new THREE.Mesh(poleGeometry, poleMaterial);
		pole.position.set(x, 1.25, z);
		scene.add(pole);
		sceneObjects.push(pole);
	}

	function buildAvalancheBombs() {
		var bombPositions = [
			{ x: -8, z: -32 },
			{ x: 0, z: -32 },
			{ x: 8, z: -32 }
		];

		var i = 0;
		while (i < bombPositions.length) {
			var pos = bombPositions[i];
			buildBombDispenser(pos.x, pos.z);
			i++;
		}
	}

	function buildBombDispenser(x, z) {
		var baseGeometry = new THREE.BoxGeometry(2, 0.5, 2);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(x, 15, z);
		scene.add(base);
		sceneObjects.push(base);

		var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var pole = new THREE.Mesh(poleGeometry, poleMaterial);
		pole.position.set(x, 16.5, z);
		scene.add(pole);
		sceneObjects.push(pole);

		var armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
		var armMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var arm = new THREE.Mesh(armGeometry, armMaterial);
		arm.position.set(x, 19.5, z);
		arm.rotation.z = Math.PI / 2;
		scene.add(arm);
		sceneObjects.push(arm);

		var bombGeometry = new THREE.SphereGeometry(0.6, 6, 6);
		var bombMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
		var bomb = new THREE.Mesh(bombGeometry, bombMaterial);
		bomb.position.set(x + 1.5, 19.5, z);
		scene.add(bomb);
		sceneObjects.push(bomb);

		avalancheBombs.push({
			bomb: bomb,
			arm: arm,
			initialArmZ: arm.rotation.z,
			initialBombX: x + 1.5
		});
	}

	function buildSnowflakeParticles() {
		var snowflakeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
		var snowflakeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

		var count = 60;
		var i = 0;
		while (i < count) {
			var snowflake = new THREE.Mesh(snowflakeGeometry, snowflakeMaterial);
			snowflake.position.set(
				(Math.random() - 0.5) * 80,
				Math.random() * 50,
				(Math.random() - 0.5) * 80
			);

			scene.add(snowflake);
			sceneObjects.push(snowflake);

			snowflakes.push({
				mesh: snowflake,
				initialY: snowflake.position.y,
				speed: 0.1 + Math.random() * 0.2,
				drift: (Math.random() - 0.5) * 0.1
			});

			i++;
		}
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(30, 30, 20);
		directionalLight.target.position.set(0, 0, 0);
		scene.add(directionalLight);
		scene.add(directionalLight.target);
		lights.push(directionalLight);

		var spotLight = new THREE.DirectionalLight(0xe6f2ff, 0.4);
		spotLight.position.set(-30, 25, -30);
		scene.add(spotLight);
		lights.push(spotLight);
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		snowflakes = [];
		snowmobiles = [];
		avalancheBombs = [];
		trees = [];
		lights = [];
		sceneObjects = [];

		buildfortWalls();
		buildIgloo();
		buildSnowmobileGarage();
		buildSkiSlope();
		buildFrozenPond();
		buildPineForest();
		buildTents();
		buildAvalancheBombs();
		buildSnowflakeParticles();
		buildLighting();
	}

	function update(delta) {
		var i = 0;
		while (i < snowflakes.length) {
			var snowflake = snowflakes[i];
			snowflake.mesh.position.y -= snowflake.speed * delta;
			snowflake.mesh.position.x += snowflake.drift * delta;

			if (snowflake.mesh.position.y < 0) {
				snowflake.mesh.position.y = snowflake.initialY;
			}

			i++;
		}

		var j = 0;
		while (j < snowmobiles.length) {
			var snowmobile = snowmobiles[j];
			var bobAmount = Math.sin(Date.now() * 0.003 + j) * 0.15;
			snowmobile.body.position.y = snowmobile.initialY + bobAmount;
			j++;
		}

		var k = 0;
		while (k < avalancheBombs.length) {
			var bombData = avalancheBombs[k];
			var swingAmount = Math.sin(Date.now() * 0.002) * 0.3;
			bombData.arm.rotation.z = bombData.initialArmZ + swingAmount;
			bombData.bomb.position.x = bombData.initialBombX + Math.cos(swingAmount) * 0.2;
			k++;
		}
	}

	function reset() {
		var i = 0;
		while (i < sceneObjects.length) {
			scene.remove(sceneObjects[i]);
			i++;
		}

		var j = 0;
		while (j < lights.length) {
			scene.remove(lights[j]);
			j++;
		}

		snowflakes = [];
		snowmobiles = [];
		avalancheBombs = [];
		trees = [];
		lights = [];
		sceneObjects = [];

		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
