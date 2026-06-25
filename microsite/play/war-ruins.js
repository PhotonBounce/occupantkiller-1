window.WarRuins = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var torches = [];
	var patrols = [];
	var animatedObjects = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		torches = [];
		patrols = [];
		animatedObjects = [];

		buildMainAmpitheatre();
		buildFallenColumns();
		buildAqueductRuins();
		buildTorches();
		buildStatueRuins();
		buildEnemyCamp();
		buildBombCraters();
		buildTunnelEntrances();
		buildScatteredDebris();

		setupLighting();
	}

	function buildMainAmpitheatre() {
		var amphiMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
		var amphiDarkMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

		var outerWallGeom = new THREE.CylinderGeometry(25, 25, 3, 32);
		var outerWall = new THREE.Mesh(outerWallGeom, amphiMaterial);
		outerWall.position.set(0, 1.5, 0);
		scene.add(outerWall);
		objects.push(outerWall);

		var innerWallGeom = new THREE.CylinderGeometry(15, 15, 3, 32);
		var innerWall = new THREE.Mesh(innerWallGeom, amphiDarkMaterial);
		innerWall.position.set(0, 1.5, 0);
		scene.add(innerWall);
		objects.push(innerWall);

		var arcadesX = [-20, 20, -15, 15];
		var arcadesZ = [-18, -18, 18, 18];

		for (var i = 0; i < 4; i++) {
			var arcadeGeom = new THREE.BoxGeometry(4, 5, 3);
			var arcade = new THREE.Mesh(arcadeGeom, amphiMaterial);
			arcade.position.set(arcadesX[i], 2.5, arcadesZ[i]);
			scene.add(arcade);
			objects.push(arcade);

			var arcadeRoofGeom = new THREE.BoxGeometry(5, 0.5, 3.5);
			var arcadeRoof = new THREE.Mesh(arcadeRoofGeom, amphiDarkMaterial);
			arcadeRoof.position.set(arcadesX[i], 5.2, arcadesZ[i]);
			scene.add(arcadeRoof);
			objects.push(arcadeRoof);
		}

		var seatsPositions = [
			[-8, 1, -8], [-4, 1.5, -10], [0, 1, -12], [4, 1.5, -10], [8, 1, -8],
			[-10, 2, 0], [10, 2, 0],
			[-8, 1.5, 8], [-4, 1, 10], [0, 1.5, 12], [4, 1, 10], [8, 1.5, 8]
		];

		for (var i = 0; i < seatsPositions.length; i++) {
			var seatGeom = new THREE.BoxGeometry(1.5, 0.3, 0.8);
			var seat = new THREE.Mesh(seatGeom, amphiDarkMaterial);
			seat.position.set(seatsPositions[i][0], seatsPositions[i][1], seatsPositions[i][2]);
			scene.add(seat);
			objects.push(seat);
		}
	}

	function buildFallenColumns() {
		var columnMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });
		var crackMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

		var columnPositions = [
			{x: -30, y: 0, z: -20, angle: Math.PI * 0.3},
			{x: -25, y: 0, z: 15, angle: Math.PI * 0.5},
			{x: 15, y: 0, z: -25, angle: Math.PI * 0.25},
			{x: 28, y: 0, z: 10, angle: -Math.PI * 0.4},
			{x: -20, y: 0, z: -35, angle: Math.PI * 0.15},
			{x: 35, y: 0, z: -15, angle: Math.PI * 0.6}
		];

		for (var i = 0; i < columnPositions.length; i++) {
			var pos = columnPositions[i];
			var columnGeom = new THREE.CylinderGeometry(1.2, 1.2, 18, 16);
			var column = new THREE.Mesh(columnGeom, columnMaterial);
			column.rotation.z = pos.angle;
			column.position.set(pos.x, pos.y + 2, pos.z);
			scene.add(column);
			objects.push(column);
			animatedObjects.push({mesh: column, type: 'crumble', frequency: 0.5 + i * 0.1});

			var topGeom = new THREE.CylinderGeometry(1.5, 1.2, 0.8, 16);
			var top = new THREE.Mesh(topGeom, crackMaterial);
			top.rotation.z = pos.angle;
			top.position.set(pos.x, pos.y + 10.5, pos.z);
			scene.add(top);
			objects.push(top);
		}

		var standinColumns = [
			{x: -35, z: 0},
			{x: 40, z: 5},
			{x: 0, z: -40},
			{x: -5, z: 38}
		];

		for (var i = 0; i < standinColumns.length; i++) {
			var pos = standinColumns[i];
			var standGeom = new THREE.CylinderGeometry(1, 1, 20, 16);
			var stand = new THREE.Mesh(standGeom, columnMaterial);
			stand.position.set(pos.x, 10, pos.z);
			scene.add(stand);
			objects.push(stand);
			animatedObjects.push({mesh: stand, type: 'crumble', frequency: 0.3 + i * 0.15});

			var capGeom = new THREE.CylinderGeometry(1.3, 1, 0.8, 16);
			var cap = new THREE.Mesh(capGeom, crackMaterial);
			cap.position.set(pos.x, 20.5, pos.z);
			scene.add(cap);
			objects.push(cap);
		}
	}

	function buildAqueductRuins() {
		var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
		var darkStoneMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });

		var aqueductPath = [
			{x: -45, z: 0},
			{x: -30, z: 0},
			{x: -15, z: 5},
			{x: 0, z: 10},
			{x: 20, z: 8},
			{x: 35, z: 5}
		];

		for (var i = 0; i < aqueductPath.length; i++) {
			var pos = aqueductPath[i];
			var supportGeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 12);
			var support = new THREE.Mesh(supportGeom, darkStoneMaterial);
			support.position.set(pos.x, 7.5, pos.z);
			scene.add(support);
			objects.push(support);

			var archGeom = new THREE.BoxGeometry(5, 3, 1.5);
			var arch = new THREE.Mesh(archGeom, stoneMaterial);
			arch.position.set(pos.x, 16, pos.z);
			scene.add(arch);
			objects.push(arch);
		}

		var partialChannelGeom = new THREE.BoxGeometry(4, 1, 80);
		var partialChannel = new THREE.Mesh(partialChannelGeom, darkStoneMaterial);
		partialChannel.position.set(-5, 16.8, -5);
		partialChannel.rotation.z = 0.15;
		scene.add(partialChannel);
		objects.push(partialChannel);

		var brokenSegmentGeom = new THREE.BoxGeometry(4.5, 1.2, 12);
		var brokenSegment = new THREE.Mesh(brokenSegmentGeom, stoneMaterial);
		brokenSegment.position.set(32, 17, 20);
		brokenSegment.rotation.z = 0.8;
		scene.add(brokenSegment);
		objects.push(brokenSegment);
	}

	function buildTorches() {
		var torchPositions = [
			{x: -35, z: 8, height: 18},
			{x: 35, z: 8, height: 18},
			{x: -8, z: -40, height: 20},
			{x: 8, z: 38, height: 19},
			{x: -45, z: -20, height: 17},
			{x: 42, z: -15, height: 18}
		];

		for (var i = 0; i < torchPositions.length; i++) {
			var pos = torchPositions[i];
			var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, pos.height, 8);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x664422 });
			var pole = new THREE.Mesh(poleGeom, poleMaterial);
			pole.position.set(pos.x, pos.height / 2, pos.z);
			scene.add(pole);
			objects.push(pole);

			var flameGeom = new THREE.ConeGeometry(1.2, 3, 8);
			var flameMaterial = new THREE.MeshLambertMaterial({ color: 0xff8800 });
			var flame = new THREE.Mesh(flameGeom, flameMaterial);
			flame.position.set(pos.x, pos.height + 1.5, pos.z);
			scene.add(flame);
			torches.push({mesh: flame, baseScale: 1.2, wobblePhase: i * 0.5});
			objects.push(flame);
			animatedObjects.push({mesh: flame, type: 'flicker', frequency: 2 + i * 0.3});

			var glowLight = new THREE.PointLight(0xff6600, 1.5, 25);
			glowLight.position.set(pos.x, pos.height + 1, pos.z);
			scene.add(glowLight);
			lights.push(glowLight);
		}
	}

	function buildStatueRuins() {
		var marbleMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

		var statuePositions = [
			{x: -28, z: 22},
			{x: 28, z: 25},
			{x: -18, z: -30},
			{x: 22, z: -28}
		];

		for (var i = 0; i < statuePositions.length; i++) {
			var pos = statuePositions[i];
			var baseGeom = new THREE.BoxGeometry(2, 0.5, 2);
			var base = new THREE.Mesh(baseGeom, baseMaterial);
			base.position.set(pos.x, 0.25, pos.z);
			scene.add(base);
			objects.push(base);

			var bodyGeom = new THREE.BoxGeometry(1.5, 4, 1);
			var body = new THREE.Mesh(bodyGeom, marbleMaterial);
			body.position.set(pos.x, 2.5, pos.z);
			body.rotation.z = (Math.random() - 0.5) * 0.3;
			scene.add(body);
			objects.push(body);

			var headGeom = new THREE.SphereGeometry(0.6, 8, 8);
			var head = new THREE.Mesh(headGeom, marbleMaterial);
			head.position.set(pos.x + (Math.random() - 0.5) * 1.5, 5, pos.z + (Math.random() - 0.5) * 1.5);
			scene.add(head);
			objects.push(head);

			var armGeom = new THREE.CylinderGeometry(0.3, 0.2, 2, 6);
			var armL = new THREE.Mesh(armGeom, marbleMaterial);
			armL.position.set(pos.x - 1.5, 3.5, pos.z);
			armL.rotation.z = 0.5;
			scene.add(armL);
			objects.push(armL);

			var armR = new THREE.Mesh(armGeom, marbleMaterial);
			armR.position.set(pos.x + 1.5, 3.5, pos.z);
			armR.rotation.z = -0.5;
			scene.add(armR);
			objects.push(armR);
		}
	}

	function buildEnemyCamp() {
		var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xaa8844 });
		var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x664422 });
		var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xff4400 });

		var tentPositions = [
			{x: -18, z: 0},
			{x: -8, z: 5},
			{x: 2, z: -3}
		];

		for (var i = 0; i < tentPositions.length; i++) {
			var pos = tentPositions[i];
			var tentGeom = new THREE.ConeGeometry(3, 4, 12);
			var tent = new THREE.Mesh(tentGeom, tentMaterial);
			tent.position.set(pos.x, 2, pos.z);
			scene.add(tent);
			objects.push(tent);

			var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 4, 6);
			var pole = new THREE.Mesh(poleGeom, crateMaterial);
			pole.position.set(pos.x, 2, pos.z);
			scene.add(pole);
			objects.push(pole);
		}

		var cratePositions = [
			{x: -12, z: 8},
			{x: -5, z: -8},
			{x: 8, z: 3},
			{x: 0, z: 10},
			{x: -15, z: -5}
		];

		for (var i = 0; i < cratePositions.length; i++) {
			var pos = cratePositions[i];
			var crateGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
			var crate = new THREE.Mesh(crateGeom, crateMaterial);
			crate.position.set(pos.x, 0.75, pos.z);
			scene.add(crate);
			objects.push(crate);
		}

		var campFireGeom = new THREE.ConeGeometry(1, 1.5, 8);
		var campFire = new THREE.Mesh(campFireGeom, fireMaterial);
		campFire.position.set(-8, 0.75, 12);
		scene.add(campFire);
		objects.push(campFire);
		torches.push({mesh: campFire, baseScale: 1, wobblePhase: 3.5});
		animatedObjects.push({mesh: campFire, type: 'flicker', frequency: 1.8});

		var fireLight = new THREE.PointLight(0xff5500, 2, 30);
		fireLight.position.set(-8, 2, 12);
		scene.add(fireLight);
		lights.push(fireLight);
	}

	function buildBombCraters() {
		var craterMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var craterPositions = [
			{x: 25, z: 20, size: 8},
			{x: -30, z: -25, size: 6},
			{x: 10, z: -35, size: 5},
			{x: -40, z: 15, size: 7}
		];

		for (var i = 0; i < craterPositions.length; i++) {
			var pos = craterPositions[i];
			var rimGeom = new THREE.CylinderGeometry(pos.size, pos.size - 1, 1.5, 16);
			var rim = new THREE.Mesh(rimGeom, craterMaterial);
			rim.position.set(pos.x, 0.75, pos.z);
			scene.add(rim);
			objects.push(rim);

			var depthGeom = new THREE.CylinderGeometry(pos.size - 1, pos.size - 1.5, 3, 16);
			var depth = new THREE.Mesh(depthGeom, craterMaterial);
			depth.position.set(pos.x, -1.5, pos.z);
			scene.add(depth);
			objects.push(depth);

			var debrisCount = Math.floor(pos.size / 2);
			for (var j = 0; j < debrisCount; j++) {
				var angle = (j / debrisCount) * Math.PI * 2;
				var distance = pos.size * 0.7;
				var debrisX = pos.x + Math.cos(angle) * distance;
				var debrisZ = pos.z + Math.sin(angle) * distance;
				var rockGeom = new THREE.BoxGeometry(0.8, 0.6, 0.7);
				var rock = new THREE.Mesh(rockGeom, craterMaterial);
				rock.position.set(debrisX, 0.5, debrisZ);
				rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
				scene.add(rock);
				objects.push(rock);
			}
		}
	}

	function buildTunnelEntrances() {
		var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var darkMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

		var tunnelPositions = [
			{x: -42, z: -35},
			{x: 45, z: -32}
		];

		for (var i = 0; i < tunnelPositions.length; i++) {
			var pos = tunnelPositions[i];
			var archGeom = new THREE.CylinderGeometry(2, 2, 0.5, 16);
			var arch = new THREE.Mesh(archGeom, stoneMaterial);
			arch.position.set(pos.x, 2.5, pos.z);
			scene.add(arch);
			objects.push(arch);

			var leftPillarGeom = new THREE.BoxGeometry(0.5, 5, 0.5);
			var leftPillar = new THREE.Mesh(leftPillarGeom, stoneMaterial);
			leftPillar.position.set(pos.x - 1.8, 2.5, pos.z);
			scene.add(leftPillar);
			objects.push(leftPillar);

			var rightPillarGeom = new THREE.BoxGeometry(0.5, 5, 0.5);
			var rightPillar = new THREE.Mesh(rightPillarGeom, stoneMaterial);
			rightPillar.position.set(pos.x + 1.8, 2.5, pos.z);
			scene.add(rightPillar);
			objects.push(rightPillar);

			var tunnelDepthGeom = new THREE.BoxGeometry(4, 4, 8);
			var tunnelDepth = new THREE.Mesh(tunnelDepthGeom, darkMaterial);
			tunnelDepth.position.set(pos.x, 2, pos.z - 4);
			scene.add(tunnelDepth);
			objects.push(tunnelDepth);
		}
	}

	function buildScatteredDebris() {
		var debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var brickMaterial = new THREE.MeshLambertMaterial({ color: 0x996633 });

		for (var i = 0; i < 12; i++) {
			var randX = (Math.random() - 0.5) * 80;
			var randZ = (Math.random() - 0.5) * 80;
			var debrisGeom = new THREE.BoxGeometry(
				0.5 + Math.random() * 1.5,
				0.3 + Math.random() * 0.6,
				0.5 + Math.random() * 1.5
			);
			var debris = new THREE.Mesh(debrisGeom, debrisMaterial);
			debris.position.set(randX, 0.3, randZ);
			debris.rotation.set(
				Math.random() * Math.PI * 2,
				Math.random() * Math.PI * 2,
				Math.random() * Math.PI * 2
			);
			scene.add(debris);
			objects.push(debris);
		}

		for (var i = 0; i < 8; i++) {
			var randX = (Math.random() - 0.5) * 70;
			var randZ = (Math.random() - 0.5) * 70;
			var brickGeom = new THREE.BoxGeometry(1, 0.2, 0.4);
			var brick = new THREE.Mesh(brickGeom, brickMaterial);
			brick.position.set(randX, 0.2, randZ);
			brick.rotation.z = Math.random() * Math.PI * 2;
			scene.add(brick);
			objects.push(brick);
		}
	}

	function setupLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight.position.set(30, 40, 20);
		directionalLight.castShadow = true;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var patrolLight = new THREE.SpotLight(0xffff00, 1, 60, Math.PI / 4, 0.8, 1);
		patrolLight.position.set(-50, 15, -40);
		patrolLight.target.position.set(0, 0, 0);
		scene.add(patrolLight);
		scene.add(patrolLight.target);
		lights.push(patrolLight);
		patrols.push({light: patrolLight, baseX: -50, baseZ: -40, radius: 25});

		var patrolLight2 = new THREE.SpotLight(0xffff00, 1, 60, Math.PI / 4, 0.8, 1);
		patrolLight2.position.set(50, 15, 35);
		patrolLight2.target.position.set(0, 0, 0);
		scene.add(patrolLight2);
		scene.add(patrolLight2.target);
		lights.push(patrolLight2);
		patrols.push({light: patrolLight2, baseX: 50, baseZ: 35, radius: 25});
	}

	function update(delta) {
		for (var i = 0; i < animatedObjects.length; i++) {
			var animated = animatedObjects[i];
			if (animated.type === 'flicker') {
				var flicker = Math.sin(Date.now() * 0.005 + i * animated.frequency) * 0.15 + 0.85;
				animated.mesh.scale.y = flicker;
				animated.mesh.scale.x = flicker * 0.8;
				animated.mesh.scale.z = flicker * 0.8;
			} else if (animated.type === 'crumble') {
				var crumble = Math.sin(Date.now() * 0.001 + i * animated.frequency) * 0.02;
				animated.mesh.position.x += crumble;
				animated.mesh.position.z += crumble * 0.5;
			}
		}

		for (var i = 0; i < torches.length; i++) {
			var torch = torches[i];
			var wobble = Math.sin(Date.now() * 0.003 + torch.wobblePhase) * 0.1;
			torch.mesh.position.x += wobble * 0.05;
			torch.mesh.position.z += wobble * 0.03;
		}

		for (var i = 0; i < patrols.length; i++) {
			var patrol = patrols[i];
			var angle = (Date.now() * 0.0005 + i * Math.PI) % (Math.PI * 2);
			patrol.light.position.x = patrol.baseX + Math.cos(angle) * patrol.radius;
			patrol.light.position.z = patrol.baseZ + Math.sin(angle) * patrol.radius;
			patrol.light.target.position.set(
				patrol.baseX + Math.cos(angle + Math.PI * 0.5) * 15,
				0,
				patrol.baseZ + Math.sin(angle + Math.PI * 0.5) * 15
			);
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
		torches = [];
		patrols = [];
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
