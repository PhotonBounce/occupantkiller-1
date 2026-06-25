window.WarDepot = (function() {
	'use strict';

	var scene, camera;
	var objects = [];
	var animatedObjects = [];
	var lights = [];

	var craneArm, forklifts, helicopters, heliRotors;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		objects = [];
		animatedObjects = [];
		lights = [];

		craneArm = null;
		forklifts = [];
		helicopters = [];
		heliRotors = [];

		buildTerrain();
		buildAmmoCrates();
		buildFuelTankers();
		buildWeaponsStorage();
		buildLoadingCrane();
		buildForklifts();
		buildCargoContainers();
		buildHelicopters();
		buildGuardTowers();
		buildCommandPost();
		buildLighting();
	}

	function buildTerrain() {
		var groundMat = new THREE.MeshLambertMaterial({ color: 0x4a4a2a });
		var groundGeo = new THREE.BoxGeometry(400, 2, 400);
		var ground = new THREE.Mesh(groundGeo, groundMat);
		ground.position.y = -1;
		ground.receiveShadow = true;
		scene.add(ground);
		objects.push(ground);

		var concreteBlocks = [];
		for (var i = 0; i < 12; i++) {
			var blockGeo = new THREE.BoxGeometry(80, 1, 80);
			var blockMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var block = new THREE.Mesh(blockGeo, blockMat);
			var angle = (i / 12) * Math.PI * 2;
			block.position.x = Math.cos(angle) * 120;
			block.position.z = Math.sin(angle) * 120;
			block.position.y = -0.5;
			block.receiveShadow = true;
			scene.add(block);
			objects.push(block);
		}
	}

	function buildAmmoCrates() {
		var stackColors = [0xff6b6b, 0xf39c12, 0x27ae60, 0x3498db];
		var stackCount = 0;

		for (var sx = -120; sx <= 120; sx += 50) {
			for (var sz = -100; sz <= 100; sz += 50) {
				var crateColor = stackColors[stackCount % stackColors.length];
				stackCount++;

				for (var layer = 0; layer < 4; layer++) {
					var crateWidth = 30 + (layer * 2);
					var crateGeo = new THREE.BoxGeometry(crateWidth, 25, crateWidth);
					var crateMat = new THREE.MeshLambertMaterial({ color: crateColor });
					var crate = new THREE.Mesh(crateGeo, crateMat);
					crate.position.set(sx, 15 + (layer * 28), sz);
					crate.castShadow = true;
					crate.receiveShadow = true;
					scene.add(crate);
					objects.push(crate);
				}
			}
		}
	}

	function buildFuelTankers() {
		var tankerPositions = [
			[-180, 0, -140],
			[-160, 0, -140],
			[180, 0, -140],
			[160, 0, -140],
			[-180, 0, 140],
			[-160, 0, 140]
		];

		for (var i = 0; i < tankerPositions.length; i++) {
			var pos = tankerPositions[i];
			buildTanker(pos[0], pos[1], pos[2]);
		}
	}

	function buildTanker(x, y, z) {
		var chassisGeo = new THREE.BoxGeometry(60, 20, 20);
		var chassisMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var chassis = new THREE.Mesh(chassisGeo, chassisMat);
		chassis.position.set(x, y + 10, z);
		chassis.castShadow = true;
		scene.add(chassis);
		objects.push(chassis);

		var tankGeo = new THREE.CylinderGeometry(18, 18, 50, 16);
		var tankMat = new THREE.MeshLambertMaterial({ color: 0xcc3300 });
		var tank = new THREE.Mesh(tankGeo, tankMat);
		tank.rotation.z = Math.PI / 2;
		tank.position.set(x, y + 18, z);
		tank.castShadow = true;
		scene.add(tank);
		objects.push(tank);

		for (var wheel = 0; wheel < 3; wheel++) {
			var wheelGeo = new THREE.CylinderGeometry(8, 8, 6, 12);
			var wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
			var wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
			wheelMesh.rotation.z = Math.PI / 2;
			wheelMesh.position.set(x - 15 + (wheel * 15), y + 8, z - 12);
			wheelMesh.castShadow = true;
			scene.add(wheelMesh);
			objects.push(wheelMesh);
		}

		for (var wheel2 = 0; wheel2 < 3; wheel2++) {
			var wheelGeo2 = new THREE.CylinderGeometry(8, 8, 6, 12);
			var wheelMat2 = new THREE.MeshLambertMaterial({ color: 0x111111 });
			var wheelMesh2 = new THREE.Mesh(wheelGeo2, wheelMat2);
			wheelMesh2.rotation.z = Math.PI / 2;
			wheelMesh2.position.set(x - 15 + (wheel2 * 15), y + 8, z + 12);
			wheelMesh2.castShadow = true;
			scene.add(wheelMesh2);
			objects.push(wheelMesh2);
		}

		var cabGeo = new THREE.BoxGeometry(20, 15, 16);
		var cabMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var cab = new THREE.Mesh(cabGeo, cabMat);
		cab.position.set(x - 30, y + 12, z);
		cab.castShadow = true;
		scene.add(cab);
		objects.push(cab);
	}

	function buildWeaponsStorage() {
		var warehousePositions = [
			[0, 0, -170],
			[100, 0, -170],
			[-100, 0, -170]
		];

		for (var i = 0; i < warehousePositions.length; i++) {
			var pos = warehousePositions[i];
			buildWarehouse(pos[0], pos[1], pos[2]);
		}
	}

	function buildWarehouse(x, y, z) {
		var wallGeo = new THREE.BoxGeometry(80, 50, 60);
		var wallMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var wall = new THREE.Mesh(wallGeo, wallMat);
		wall.position.set(x, y + 25, z);
		wall.castShadow = true;
		wall.receiveShadow = true;
		scene.add(wall);
		objects.push(wall);

		var roofGeo = new THREE.BoxGeometry(85, 8, 65);
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var roof = new THREE.Mesh(roofGeo, roofMat);
		roof.position.set(x, y + 54, z);
		roof.castShadow = true;
		scene.add(roof);
		objects.push(roof);

		for (var door = 0; door < 2; door++) {
			var doorGeo = new THREE.BoxGeometry(16, 35, 4);
			var doorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var doorMesh = new THREE.Mesh(doorGeo, doorMat);
			doorMesh.position.set(x - 25 + (door * 50), y + 18, z - 30);
			doorMesh.castShadow = true;
			scene.add(doorMesh);
			objects.push(doorMesh);
		}
	}

	function buildLoadingCrane() {
		var baseGeo = new THREE.BoxGeometry(40, 10, 40);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var base = new THREE.Mesh(baseGeo, baseMat);
		base.position.set(0, 5, 80);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var poleGeo = new THREE.CylinderGeometry(6, 6, 120, 12);
		var poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var pole = new THREE.Mesh(poleGeo, poleMat);
		pole.position.set(0, 60, 80);
		pole.castShadow = true;
		scene.add(pole);
		objects.push(pole);

		var armGeo = new THREE.BoxGeometry(120, 8, 8);
		var armMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
		craneArm = new THREE.Mesh(armGeo, armMat);
		craneArm.position.set(0, 115, 80);
		craneArm.castShadow = true;
		scene.add(craneArm);
		objects.push(craneArm);
		animatedObjects.push(craneArm);

		var cableGeo = new THREE.CylinderGeometry(1, 1, 60, 4);
		var cableMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var cable = new THREE.Mesh(cableGeo, cableMat);
		cable.position.set(30, 85, 80);
		cable.castShadow = true;
		scene.add(cable);
		objects.push(cable);

		var hookGeo = new THREE.SphereGeometry(4, 8, 8);
		var hookMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var hook = new THREE.Mesh(hookGeo, hookMat);
		hook.position.set(30, 55, 80);
		hook.castShadow = true;
		scene.add(hook);
		objects.push(hook);
	}

	function buildForklifts() {
		var forkPositions = [
			[60, 0, 20],
			[70, 0, -30],
			[-60, 0, 25]
		];

		for (var i = 0; i < forkPositions.length; i++) {
			var pos = forkPositions[i];
			buildForklift(pos[0], pos[1], pos[2]);
		}
	}

	function buildForklift(x, y, z) {
		var bodyGeo = new THREE.BoxGeometry(25, 20, 35);
		var bodyMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
		var body = new THREE.Mesh(bodyGeo, bodyMat);
		body.position.set(x, y + 10, z);
		body.castShadow = true;
		scene.add(body);
		objects.push(body);

		var forklifts_obj = {
			body: body,
			prongs: []
		};

		for (var prong = 0; prong < 2; prong++) {
			var prongGeo = new THREE.BoxGeometry(3, 40, 12);
			var prongMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
			var prongMesh = new THREE.Mesh(prongGeo, prongMat);
			prongMesh.position.set(x - 8 + (prong * 16), y + 20, z);
			prongMesh.castShadow = true;
			scene.add(prongMesh);
			objects.push(prongMesh);
			forklifts_obj.prongs.push(prongMesh);
		}

		for (var twheel = 0; twheel < 4; twheel++) {
			var wheelGeo = new THREE.CylinderGeometry(6, 6, 8, 10);
			var wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
			var wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
			wheelMesh.rotation.z = Math.PI / 2;
			var wx = x - 8 + (Math.floor(twheel / 2) * 16);
			var wz = z - 10 + ((twheel % 2) * 20);
			wheelMesh.position.set(wx, y + 6, wz);
			wheelMesh.castShadow = true;
			scene.add(wheelMesh);
			objects.push(wheelMesh);
		}

		forklifts.push(forklifts_obj);
		animatedObjects.push(forklifts_obj);
	}

	function buildCargoContainers() {
		var containerPositions = [
			[150, 0, -80],
			[150, 30, -80],
			[150, 60, -80],
			[-150, 0, 100],
			[-150, 30, 100],
			[-120, 0, -120],
			[-120, 30, -120]
		];

		for (var i = 0; i < containerPositions.length; i++) {
			var pos = containerPositions[i];
			buildContainer(pos[0], pos[1], pos[2]);
		}
	}

	function buildContainer(x, y, z) {
		var containerGeo = new THREE.BoxGeometry(40, 40, 25);
		var colors = [0x1e90ff, 0x228b22, 0xdc143c, 0xff8c00];
		var containerMat = new THREE.MeshLambertMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
		var container = new THREE.Mesh(containerGeo, containerMat);
		container.position.set(x, y + 20, z);
		container.castShadow = true;
		container.receiveShadow = true;
		scene.add(container);
		objects.push(container);

		var doorGeo = new THREE.BoxGeometry(18, 30, 2);
		var doorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var door = new THREE.Mesh(doorGeo, doorMat);
		door.position.set(x - 12, y + 20, z - 13);
		door.castShadow = true;
		scene.add(door);
		objects.push(door);
	}

	function buildHelicopters() {
		var heliPositions = [
			[120, 80, 150],
			[-120, 80, 150],
			[0, 80, -160]
		];

		for (var i = 0; i < heliPositions.length; i++) {
			var pos = heliPositions[i];
			buildHelicopter(pos[0], pos[1], pos[2]);
		}
	}

	function buildHelicopter(x, y, z) {
		var fuselageGeo = new THREE.BoxGeometry(15, 12, 45);
		var fuselageMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
		fuselage.position.set(x, y, z);
		fuselage.castShadow = true;
		scene.add(fuselage);
		objects.push(fuselage);

		var cabinGeo = new THREE.BoxGeometry(14, 10, 14);
		var cabinMat = new THREE.MeshLambertMaterial({ color: 0x1a3a0a });
		var cabin = new THREE.Mesh(cabinGeo, cabinMat);
		cabin.position.set(x, y + 8, z + 10);
		cabin.castShadow = true;
		scene.add(cabin);
		objects.push(cabin);

		var rotorGeo = new THREE.BoxGeometry(70, 1, 8);
		var rotorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var rotor = new THREE.Mesh(rotorGeo, rotorMat);
		rotor.position.set(x, y + 16, z);
		rotor.castShadow = true;
		scene.add(rotor);
		objects.push(rotor);
		heliRotors.push(rotor);
		animatedObjects.push(rotor);

		var tailBoomGeo = new THREE.BoxGeometry(4, 4, 30);
		var tailBoomMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var tailBoom = new THREE.Mesh(tailBoomGeo, tailBoomMat);
		tailBoom.position.set(x, y - 2, z - 20);
		tailBoom.castShadow = true;
		scene.add(tailBoom);
		objects.push(tailBoom);

		var tailRotorGeo = new THREE.BoxGeometry(35, 1, 4);
		var tailRotorMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var tailRotor = new THREE.Mesh(tailRotorGeo, tailRotorMat);
		tailRotor.position.set(x, y + 4, z - 35);
		tailRotor.castShadow = true;
		scene.add(tailRotor);
		objects.push(tailRotor);
		heliRotors.push(tailRotor);
		animatedObjects.push(tailRotor);

		var landingSkidGeo = new THREE.BoxGeometry(3, 15, 50);
		var landingSkidMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var landingSkid = new THREE.Mesh(landingSkidGeo, landingSkidMat);
		landingSkid.position.set(x, y - 10, z);
		landingSkid.castShadow = true;
		scene.add(landingSkid);
		objects.push(landingSkid);

		helicopters.push(fuselage);
		animatedObjects.push(fuselage);
	}

	function buildGuardTowers() {
		var towerPositions = [
			[190, 0, 190],
			[-190, 0, 190],
			[190, 0, -190],
			[-190, 0, -190]
		];

		for (var i = 0; i < towerPositions.length; i++) {
			var pos = towerPositions[i];
			buildGuardTower(pos[0], pos[1], pos[2]);
		}
	}

	function buildGuardTower(x, y, z) {
		var baseGeo = new THREE.BoxGeometry(25, 8, 25);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var base = new THREE.Mesh(baseGeo, baseMat);
		base.position.set(x, y + 4, z);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var poleGeo = new THREE.CylinderGeometry(4, 4, 80, 8);
		var poleMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var pole = new THREE.Mesh(poleGeo, poleMat);
		pole.position.set(x, y + 40, z);
		pole.castShadow = true;
		scene.add(pole);
		objects.push(pole);

		var platformGeo = new THREE.BoxGeometry(30, 6, 30);
		var platformMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
		var platform = new THREE.Mesh(platformGeo, platformMat);
		platform.position.set(x, y + 83, z);
		platform.castShadow = true;
		scene.add(platform);
		objects.push(platform);

		var cabinGeo = new THREE.BoxGeometry(24, 20, 24);
		var cabinMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var cabin = new THREE.Mesh(cabinGeo, cabinMat);
		cabin.position.set(x, y + 93, z);
		cabin.castShadow = true;
		scene.add(cabin);
		objects.push(cabin);

		var radarGeo = new THREE.CylinderGeometry(8, 8, 3, 16);
		var radarMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
		var radar = new THREE.Mesh(radarGeo, radarMat);
		radar.position.set(x, y + 113, z);
		radar.castShadow = true;
		scene.add(radar);
		objects.push(radar);
	}

	function buildCommandPost() {
		var trailerGeo = new THREE.BoxGeometry(60, 30, 25);
		var trailerMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var trailer = new THREE.Mesh(trailerGeo, trailerMat);
		trailer.position.set(0, 15, -100);
		trailer.castShadow = true;
		scene.add(trailer);
		objects.push(trailer);

		var roofGeo = new THREE.BoxGeometry(62, 8, 27);
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var roof = new THREE.Mesh(roofGeo, roofMat);
		roof.position.set(0, 38, -100);
		roof.castShadow = true;
		scene.add(roof);
		objects.push(roof);

		for (var antenna = 0; antenna < 3; antenna++) {
			var antennaGeo = new THREE.CylinderGeometry(2, 2, 25, 6);
			var antennaMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var antennaMesh = new THREE.Mesh(antennaGeo, antennaMat);
			antennaMesh.position.set(-15 + (antenna * 15), 51, -100);
			antennaMesh.castShadow = true;
			scene.add(antennaMesh);
			objects.push(antennaMesh);
		}

		for (var door = 0; door < 2; door++) {
			var doorGeo = new THREE.BoxGeometry(12, 20, 2);
			var doorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
			var doorMesh = new THREE.Mesh(doorGeo, doorMat);
			doorMesh.position.set(-15 + (door * 30), 10, -13);
			doorMesh.castShadow = true;
			scene.add(doorMesh);
			objects.push(doorMesh);
		}

		var generatorGeo = new THREE.BoxGeometry(20, 15, 15);
		var generatorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var generator = new THREE.Mesh(generatorGeo, generatorMat);
		generator.position.set(40, 7.5, -100);
		generator.castShadow = true;
		scene.add(generator);
		objects.push(generator);

		for (var window = 0; window < 4; window++) {
			var windowGeo = new THREE.BoxGeometry(8, 8, 1);
			var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
			var windowMesh = new THREE.Mesh(windowGeo, windowMat);
			windowMesh.position.set(-20 + (window * 15), 20, -13);
			windowMesh.castShadow = true;
			scene.add(windowMesh);
			objects.push(windowMesh);
		}
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(150, 200, 150);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -300;
		directionalLight.shadow.camera.right = 300;
		directionalLight.shadow.camera.top = 300;
		directionalLight.shadow.camera.bottom = -300;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLights = [
			[-150, 40, -150],
			[150, 40, -150],
			[150, 40, 150],
			[-150, 40, 150],
			[0, 40, 0]
		];

		for (var i = 0; i < pointLights.length; i++) {
			var pos = pointLights[i];
			var pointLight = new THREE.PointLight(0xffff99, 0.6, 200);
			pointLight.position.set(pos[0], pos[1], pos[2]);
			pointLight.castShadow = true;
			scene.add(pointLight);
			lights.push(pointLight);
		}

		var spotLights = [
			[100, 100, -150],
			[-100, 100, -150]
		];

		for (var j = 0; j < spotLights.length; j++) {
			var spos = spotLights[j];
			var spotLight = new THREE.SpotLight(0xffffcc, 0.8, 300, Math.PI / 4, 0.5, 1);
			spotLight.position.set(spos[0], spos[1], spos[2]);
			spotLight.target.position.set(spos[0], 0, spos[2]);
			spotLight.castShadow = true;
			scene.add(spotLight);
			scene.add(spotLight.target);
			lights.push(spotLight);
		}
	}

	function update(delta) {
		if (!craneArm) return;

		var craneTime = Date.now() * 0.0005;
		craneArm.rotation.y = Math.sin(craneTime) * 0.5;

		for (var i = 0; i < forklifts.length; i++) {
			var forklift = forklifts[i];
			var forkTime = Date.now() * 0.001 + (i * 2);
			var bobHeight = Math.sin(forkTime) * 3;
			forklift.body.position.y = bobHeight + 10;

			for (var p = 0; p < forklift.prongs.length; p++) {
				forklift.prongs[p].position.y = bobHeight + 20;
			}
		}

		for (var r = 0; r < heliRotors.length; r++) {
			heliRotors[r].rotation.z += delta * 15;
		}

		for (var h = 0; h < helicopters.length; h++) {
			var heli = helicopters[h];
			var heliTime = Date.now() * 0.0003 + (h * 4);
			var heliWave = Math.sin(heliTime) * 5;
			heli.position.y = 80 + heliWave;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}

		for (var l = 0; l < lights.length; l++) {
			scene.remove(lights[l]);
		}

		objects = [];
		animatedObjects = [];
		lights = [];
		forklifts = [];
		helicopters = [];
		heliRotors = [];
		craneArm = null;
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
