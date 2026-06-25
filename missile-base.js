window.MissileBase = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var launcherAngle = 0;
	var blastDoorOffset = 0;
	var warningLightIndex = 0;
	var warningLights = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		warningLights = [];
		launcherAngle = 0;
		blastDoorOffset = 0;
		warningLightIndex = 0;

		buildLaunchSilos();
		buildBlastDoors();
		buildControlRoom();
		buildFuelLines();
		buildTransporters();
		buildVents();
		buildTunnelEntrances();
		buildCamouflageBuildings();
		buildEnvironmentDetails();
		setupLighting();
	}

	function buildLaunchSilos() {
		var siloPositions = [
			{ x: -40, z: -50 },
			{ x: -40, z: 0 },
			{ x: -40, z: 50 },
			{ x: 0, z: -50 },
			{ x: 0, z: 50 },
			{ x: 40, z: -50 },
			{ x: 40, z: 0 },
			{ x: 40, z: 50 }
		];

		for (var i = 0; i < siloPositions.length; i++) {
			var pos = siloPositions[i];
			buildSilo(pos.x, pos.z);
		}
	}

	function buildSilo(x, z) {
		var material = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var cylinderGeom = new THREE.CylinderGeometry(8, 8, 40, 16);
		var silo = new THREE.Mesh(cylinderGeom, material);
		silo.position.set(x, 0, z);
		silo.castShadow = true;
		silo.receiveShadow = true;
		scene.add(silo);
		objects.push(silo);

		var rimGeom = new THREE.CylinderGeometry(8.5, 8.5, 1, 16);
		var rimMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var rim = new THREE.Mesh(rimGeom, rimMaterial);
		rim.position.set(x, 20, z);
		rim.castShadow = true;
		scene.add(rim);
		objects.push(rim);

		var missileBodyGeom = new THREE.CylinderGeometry(2, 2, 25, 8);
		var missileMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
		var missileBody = new THREE.Mesh(missileBodyGeom, missileMaterial);
		missileBody.position.set(x, -5, z);
		missileBody.castShadow = true;
		scene.add(missileBody);
		objects.push(missileBody);

		var missileNoseGeom = new THREE.ConeGeometry(2, 8, 8);
		var missileNose = new THREE.Mesh(missileNoseGeom, missileMaterial);
		missileNose.position.set(x, 8, z);
		missileNose.castShadow = true;
		scene.add(missileNose);
		objects.push(missileNose);

		var finCount = 4;
		for (var f = 0; f < finCount; f++) {
			var finAngle = (f / finCount) * Math.PI * 2;
			var finGeom = new THREE.BoxGeometry(0.5, 6, 3);
			var finMaterial = new THREE.MeshLambertMaterial({ color: 0x990000 });
			var fin = new THREE.Mesh(finGeom, finMaterial);
			fin.position.set(x + Math.cos(finAngle) * 2.5, -10, z + Math.sin(finAngle) * 2.5);
			fin.rotation.y = finAngle;
			fin.castShadow = true;
			scene.add(fin);
			objects.push(fin);
		}

		var platformGeom = new THREE.BoxGeometry(18, 0.5, 18);
		var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var platform = new THREE.Mesh(platformGeom, platformMaterial);
		platform.position.set(x, -21, z);
		platform.castShadow = true;
		platform.receiveShadow = true;
		scene.add(platform);
		objects.push(platform);
	}

	function buildBlastDoors() {
		var doorPositions = [
			{ x: -20, z: -30, rotation: 0 },
			{ x: 20, z: -30, rotation: 0 },
			{ x: -20, z: 30, rotation: 0 },
			{ x: 20, z: 30, rotation: 0 }
		];

		for (var i = 0; i < doorPositions.length; i++) {
			var pos = doorPositions[i];
			buildBlastDoor(pos.x, pos.z, pos.rotation);
		}
	}

	function buildBlastDoor(x, z, rot) {
		var doorFrameGeom = new THREE.BoxGeometry(12, 18, 0.5);
		var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var frame = new THREE.Mesh(doorFrameGeom, frameMaterial);
		frame.position.set(x, 0, z);
		frame.castShadow = true;
		scene.add(frame);
		objects.push(frame);

		var panelGeom = new THREE.BoxGeometry(11, 17, 0.3);
		var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
		var panel = new THREE.Mesh(panelGeom, panelMaterial);
		panel.position.set(x, 0, z - 0.5);
		panel.castShadow = true;
		panel.userData.blastDoor = true;
		panel.userData.closedX = x;
		panel.userData.openX = x + 12;
		scene.add(panel);
		objects.push(panel);

		var rivetSpacing = 2;
		for (var rx = -5; rx <= 5; rx += rivetSpacing) {
			for (var ry = -8; ry <= 8; ry += rivetSpacing) {
				var rivetGeom = new THREE.SphereGeometry(0.3, 6, 6);
				var rivetMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
				var rivet = new THREE.Mesh(rivetGeom, rivetMaterial);
				rivet.position.set(x + rx, ry, z - 0.6);
				scene.add(rivet);
				objects.push(rivet);
			}
		}
	}

	function buildControlRoom() {
		var roomGeom = new THREE.BoxGeometry(20, 12, 16);
		var roomMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var room = new THREE.Mesh(roomGeom, roomMaterial);
		room.position.set(0, 0, -60);
		room.castShadow = true;
		room.receiveShadow = true;
		scene.add(room);
		objects.push(room);

		var screenCount = 4;
		for (var s = 0; s < screenCount; s++) {
			var screenX = -8 + s * 6;
			var screenGeom = new THREE.BoxGeometry(4, 5, 0.2);
			var screenMaterial = new THREE.MeshLambertMaterial({ color: 0x001a00 });
			var screen = new THREE.Mesh(screenGeom, screenMaterial);
			screen.position.set(screenX, 2, -68);
			screen.castShadow = true;
			screen.userData.screen = true;
			scene.add(screen);
			objects.push(screen);

			var glowGeom = new THREE.BoxGeometry(3.8, 4.8, 0.1);
			var glowMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x00aa00 });
			var glow = new THREE.Mesh(glowGeom, glowMaterial);
			glow.position.set(screenX, 2, -67.9);
			scene.add(glow);
			objects.push(glow);
		}

		var consoleGeom = new THREE.BoxGeometry(18, 2, 4);
		var consoleMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var console = new THREE.Mesh(consoleGeom, consoleMaterial);
		console.position.set(0, -4, -62);
		console.castShadow = true;
		console.receiveShadow = true;
		scene.add(console);
		objects.push(console);

		var buttonCount = 12;
		for (var b = 0; b < buttonCount; b++) {
			var buttonX = -8 + (b % 4) * 5;
			var buttonZ = -60 + Math.floor(b / 4) * 2;
			var buttonGeom = new THREE.SphereGeometry(0.4, 8, 8);
			var buttonMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xaa0000 });
			var button = new THREE.Mesh(buttonGeom, buttonMaterial);
			button.position.set(buttonX, -3, buttonZ);
			scene.add(button);
			objects.push(button);
		}

		var doorGeom = new THREE.BoxGeometry(3, 6, 0.2);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var door = new THREE.Mesh(doorGeom, doorMaterial);
		door.position.set(-9, 0, -52);
		door.castShadow = true;
		scene.add(door);
		objects.push(door);
	}

	function buildFuelLines() {
		var linePositions = [
			{ x1: -60, z1: -40, x2: 60, z2: -40 },
			{ x1: -60, z1: 0, x2: 60, z2: 0 },
			{ x1: -60, z1: 40, x2: 60, z2: 40 },
			{ x1: -40, z1: -60, x2: -40, z2: 60 },
			{ x1: 0, z1: -60, x2: 0, z2: 60 },
			{ x1: 40, z1: -60, x2: 40, z2: 60 }
		];

		for (var i = 0; i < linePositions.length; i++) {
			var line = linePositions[i];
			buildFuelLine(line.x1, line.z1, line.x2, line.z2);
		}
	}

	function buildFuelLine(x1, z1, x2, z2) {
		var segmentCount = 8;
		var dx = (x2 - x1) / segmentCount;
		var dz = (z2 - z1) / segmentCount;

		for (var s = 0; s < segmentCount; s++) {
			var sx = x1 + dx * s;
			var sz = z1 + dz * s;

			var pipeGeom = new THREE.CylinderGeometry(0.4, 0.4, Math.sqrt(dx * dx + dz * dz), 8);
			var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
			var pipe = new THREE.Mesh(pipeGeom, pipeMaterial);
			pipe.position.set(sx + dx * 0.5, -22, sz + dz * 0.5);
			pipe.rotation.z = Math.atan2(dz, dx);
			pipe.castShadow = true;
			scene.add(pipe);
			objects.push(pipe);

			var valveGeom = new THREE.SphereGeometry(0.6, 8, 8);
			var valveMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
			var valve = new THREE.Mesh(valveGeom, valveMaterial);
			valve.position.set(sx + dx * 0.5, -22, sz + dz * 0.5);
			scene.add(valve);
			objects.push(valve);
		}
	}

	function buildTransporters() {
		var transporterPositions = [
			{ x: -50, z: 20 },
			{ x: 50, z: -20 }
		];

		for (var i = 0; i < transporterPositions.length; i++) {
			var pos = transporterPositions[i];
			buildTransporter(pos.x, pos.z);
		}
	}

	function buildTransporter(x, z) {
		var chassisGeom = new THREE.BoxGeometry(6, 3, 12);
		var chassisMaterial = new THREE.MeshLambertMaterial({ color: 0x4d4d4d });
		var chassis = new THREE.Mesh(chassisGeom, chassisMaterial);
		chassis.position.set(x, -19, z);
		chassis.castShadow = true;
		chassis.receiveShadow = true;
		scene.add(chassis);
		objects.push(chassis);

		var cabGeom = new THREE.BoxGeometry(5, 3, 4);
		var cabMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var cab = new THREE.Mesh(cabGeom, cabMaterial);
		cab.position.set(x, -16, z + 4);
		cab.castShadow = true;
		scene.add(cab);
		objects.push(cab);

		var wheelCount = 4;
		for (var w = 0; w < wheelCount; w++) {
			var wheelZ = z - 4 + w * 4;
			for (var side = -1; side <= 1; side += 2) {
				var wheelGeom = new THREE.CylinderGeometry(1.2, 1.2, 1, 12);
				var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
				var wheel = new THREE.Mesh(wheelGeom, wheelMaterial);
				wheel.position.set(x + side * 3.5, -20, wheelZ);
				wheel.rotation.z = Math.PI / 2;
				wheel.castShadow = true;
				scene.add(wheel);
				objects.push(wheel);
			}
		}

		var launcherGeom = new THREE.CylinderGeometry(1, 1, 8, 8);
		var launcherMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
		var launcher = new THREE.Mesh(launcherGeom, launcherMaterial);
		launcher.position.set(x, -15, z - 6);
		launcher.rotation.x = 0.3;
		launcher.castShadow = true;
		launcher.userData.launcher = true;
		scene.add(launcher);
		objects.push(launcher);
	}

	function buildVents() {
		var ventPositions = [
			{ x: -30, z: 65 },
			{ x: 30, z: 65 },
			{ x: -50, z: -65 },
			{ x: 50, z: -65 }
		];

		for (var i = 0; i < ventPositions.length; i++) {
			var pos = ventPositions[i];
			buildVent(pos.x, pos.z);
		}
	}

	function buildVent(x, z) {
		var shaftGeom = new THREE.CylinderGeometry(2, 2, 30, 8);
		var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var shaft = new THREE.Mesh(shaftGeom, shaftMaterial);
		shaft.position.set(x, 5, z);
		shaft.castShadow = true;
		scene.add(shaft);
		objects.push(shaft);

		var grateGeom = new THREE.BoxGeometry(4, 0.5, 4);
		var grateMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var grate = new THREE.Mesh(grateGeom, grateMaterial);
		grate.position.set(x, 20.5, z);
		grate.castShadow = true;
		scene.add(grate);
		objects.push(grate);

		var louverCount = 8;
		for (var l = 0; l < louverCount; l++) {
			var louverGeom = new THREE.BoxGeometry(4, 0.3, 0.5);
			var louverMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var louver = new THREE.Mesh(louverGeom, louverMaterial);
			louver.position.set(x, 16 + l * 0.6, z + 1.8);
			scene.add(louver);
			objects.push(louver);
		}
	}

	function buildTunnelEntrances() {
		var entrancePositions = [
			{ x: -70, z: 0 },
			{ x: 70, z: 0 }
		];

		for (var i = 0; i < entrancePositions.length; i++) {
			var pos = entrancePositions[i];
			buildTunnelEntrance(pos.x, pos.z);
		}
	}

	function buildTunnelEntrance(x, z) {
		var archGeom = new THREE.CylinderGeometry(6, 6, 12, 12);
		var archMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var arch = new THREE.Mesh(archGeom, archMaterial);
		arch.position.set(x, -2, z);
		arch.rotation.z = Math.PI / 2;
		arch.castShadow = true;
		scene.add(arch);
		objects.push(arch);

		var wallCount = 4;
		for (var w = 0; w < wallCount; w++) {
			var wallZ = z - 5 + w * 3;
			var wallGeom = new THREE.BoxGeometry(12, 10, 0.5);
			var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var wall = new THREE.Mesh(wallGeom, wallMaterial);
			wall.position.set(x, -5, wallZ);
			wall.castShadow = true;
			scene.add(wall);
			objects.push(wall);
		}

		var doorGeom = new THREE.BoxGeometry(5, 6, 0.3);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var door = new THREE.Mesh(doorGeom, doorMaterial);
		door.position.set(x, -2, z + 6);
		door.castShadow = true;
		scene.add(door);
		objects.push(door);
	}

	function buildCamouflageBuildings() {
		var buildingPositions = [
			{ x: -80, z: -80 },
			{ x: 80, z: -80 },
			{ x: -80, z: 80 },
			{ x: 80, z: 80 }
		];

		for (var i = 0; i < buildingPositions.length; i++) {
			var pos = buildingPositions[i];
			buildFarmBuilding(pos.x, pos.z);
		}
	}

	function buildFarmBuilding(x, z) {
		var wallGeom = new THREE.BoxGeometry(15, 8, 20);
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var wall = new THREE.Mesh(wallGeom, wallMaterial);
		wall.position.set(x, -16, z);
		wall.castShadow = true;
		wall.receiveShadow = true;
		scene.add(wall);
		objects.push(wall);

		var roofGeom = new THREE.ConeGeometry(12, 5, 4);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var roof = new THREE.Mesh(roofGeom, roofMaterial);
		roof.position.set(x, -8, z);
		roof.castShadow = true;
		scene.add(roof);
		objects.push(roof);

		var doorGeom = new THREE.BoxGeometry(4, 7, 0.3);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var door = new THREE.Mesh(doorGeom, doorMaterial);
		door.position.set(x, -16, z + 10);
		door.castShadow = true;
		scene.add(door);
		objects.push(door);

		var windowCount = 4;
		for (var w = 0; w < windowCount; w++) {
			var windowGeom = new THREE.BoxGeometry(2, 2, 0.2);
			var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x4d94ff });
			var window = new THREE.Mesh(windowGeom, windowMaterial);
			window.position.set(x - 5 + w * 3, -14, z + 10.1);
			scene.add(window);
			objects.push(window);
		}

		var silo1Geom = new THREE.CylinderGeometry(2, 2, 12, 8);
		var siloMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var silo1 = new THREE.Mesh(silo1Geom, siloMaterial);
		silo1.position.set(x - 8, -12, z);
		silo1.castShadow = true;
		scene.add(silo1);
		objects.push(silo1);

		var silo2Geom = new THREE.CylinderGeometry(2, 2, 12, 8);
		var silo2 = new THREE.Mesh(silo2Geom, siloMaterial);
		silo2.position.set(x + 8, -12, z);
		silo2.castShadow = true;
		scene.add(silo2);
		objects.push(silo2);
	}

	function buildEnvironmentDetails() {
		var radiatorCount = 6;
		for (var r = 0; r < radiatorCount; r++) {
			var radiatorX = -50 + r * 20;
			buildRadiator(radiatorX, -70);
		}

		var storageContainerPositions = [
			{ x: -70, z: -50 },
			{ x: -70, z: 50 },
			{ x: 70, z: -50 },
			{ x: 70, z: 50 }
		];

		for (var s = 0; s < storageContainerPositions.length; s++) {
			var pos = storageContainerPositions[s];
			buildStorageContainer(pos.x, pos.z);
		}

		var supportBeamCount = 12;
		for (var b = 0; b < supportBeamCount; b++) {
			var beamX = -60 + (b % 4) * 40;
			var beamZ = -50 + Math.floor(b / 4) * 50;
			buildSupportBeam(beamX, beamZ);
		}

		buildControlTower();
		buildPerimeterFence();
	}

	function buildRadiator(x, z) {
		var coreGeom = new THREE.BoxGeometry(3, 8, 1);
		var coreMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
		var core = new THREE.Mesh(coreGeom, coreMaterial);
		core.position.set(x, -12, z);
		core.castShadow = true;
		scene.add(core);
		objects.push(core);

		var finCount = 6;
		for (var f = 0; f < finCount; f++) {
			var finGeom = new THREE.BoxGeometry(3, 0.3, 3);
			var finMaterial = new THREE.MeshLambertMaterial({ color: 0xcc5500 });
			var fin = new THREE.Mesh(finGeom, finMaterial);
			fin.position.set(x, -10 + f * 1.5, z - 2);
			scene.add(fin);
			objects.push(fin);
		}
	}

	function buildStorageContainer(x, z) {
		var containerGeom = new THREE.BoxGeometry(6, 5, 8);
		var containerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var container = new THREE.Mesh(containerGeom, containerMaterial);
		container.position.set(x, -20.5, z);
		container.castShadow = true;
		container.receiveShadow = true;
		scene.add(container);
		objects.push(container);

		var lidGeom = new THREE.BoxGeometry(6.5, 0.5, 8.5);
		var lidMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var lid = new THREE.Mesh(lidGeom, lidMaterial);
		lid.position.set(x, -18, z);
		lid.castShadow = true;
		scene.add(lid);
		objects.push(lid);
	}

	function buildSupportBeam(x, z) {
		var beamGeom = new THREE.BoxGeometry(1, 15, 1);
		var beamMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var beam = new THREE.Mesh(beamGeom, beamMaterial);
		beam.position.set(x, -7.5, z);
		beam.castShadow = true;
		scene.add(beam);
		objects.push(beam);

		var bracketGeom = new THREE.BoxGeometry(3, 0.5, 3);
		var bracketMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var bracket = new THREE.Mesh(bracketGeom, bracketMaterial);
		bracket.position.set(x, 0, z);
		bracket.castShadow = true;
		scene.add(bracket);
		objects.push(bracket);
	}

	function buildControlTower() {
		var baseGeom = new THREE.BoxGeometry(8, 4, 8);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var base = new THREE.Mesh(baseGeom, baseMaterial);
		base.position.set(0, -20, -85);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var towerGeom = new THREE.CylinderGeometry(3, 3, 20, 8);
		var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var tower = new THREE.Mesh(towerGeom, towerMaterial);
		tower.position.set(0, -10, -85);
		tower.castShadow = true;
		scene.add(tower);
		objects.push(tower);

		var cabGeom = new THREE.BoxGeometry(5, 4, 5);
		var cabMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var cab = new THREE.Mesh(cabGeom, cabMaterial);
		cab.position.set(0, 0, -85);
		cab.castShadow = true;
		scene.add(cab);
		objects.push(cab);

		var antennaGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 4);
		var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
		var antenna = new THREE.Mesh(antennaGeom, antennaMaterial);
		antenna.position.set(0, 8, -85);
		antenna.castShadow = true;
		scene.add(antenna);
		objects.push(antenna);
	}

	function buildPerimeterFence() {
		var fenceLength = 180;
		var postCount = 12;
		var postSpacing = fenceLength / postCount;

		for (var p = 0; p < postCount; p++) {
			var postX = -90 + p * postSpacing;
			var postGeom = new THREE.BoxGeometry(0.5, 5, 0.5);
			var postMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var post = new THREE.Mesh(postGeom, postMaterial);
			post.position.set(postX, -20, -90);
			post.castShadow = true;
			scene.add(post);
			objects.push(post);

			var wireGeom = new THREE.BoxGeometry(postSpacing, 0.1, 0.1);
			var wireMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var wire = new THREE.Mesh(wireGeom, wireMaterial);
			wire.position.set(postX + postSpacing * 0.5, -19, -90);
			scene.add(wire);
			objects.push(wire);
		}
	}

	function setupLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 50, 50);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var warningLight1 = new THREE.PointLight(0xff0000, 1, 30);
		warningLight1.position.set(-20, 5, -30);
		warningLight1.castShadow = true;
		scene.add(warningLight1);
		warningLights.push(warningLight1);
		lights.push(warningLight1);

		var warningLight2 = new THREE.PointLight(0xff0000, 1, 30);
		warningLight2.position.set(20, 5, 30);
		warningLight2.castShadow = true;
		scene.add(warningLight2);
		warningLights.push(warningLight2);
		lights.push(warningLight2);

		var warningLight3 = new THREE.PointLight(0xff0000, 1, 30);
		warningLight3.position.set(0, 5, -30);
		warningLight3.castShadow = true;
		scene.add(warningLight3);
		warningLights.push(warningLight3);
		lights.push(warningLight3);

		var redGlowLight = new THREE.PointLight(0xff4444, 0.5, 40);
		redGlowLight.position.set(0, 0, -60);
		scene.add(redGlowLight);
		lights.push(redGlowLight);

		var emergencyLight = new THREE.PointLight(0xffff00, 0.3, 25);
		emergencyLight.position.set(-50, -15, 30);
		scene.add(emergencyLight);
		lights.push(emergencyLight);
	}

	function update(delta) {
		launcherAngle += delta * 0.3;
		if (launcherAngle > Math.PI * 0.6) {
			launcherAngle = Math.PI * 0.6;
		}

		blastDoorOffset += delta * 3;
		if (blastDoorOffset > 12) {
			blastDoorOffset = 0;
		}

		warningLightIndex += delta * 3;

		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];

			if (obj.userData.launcher) {
				obj.rotation.x = launcherAngle - 0.3;
			}

			if (obj.userData.blastDoor) {
				obj.position.x = obj.userData.closedX + Math.sin(blastDoorOffset * 0.5) * 6;
			}
		}

		for (var w = 0; w < warningLights.length; w++) {
			var warningLightPhase = (warningLightIndex + w * 1.5) % (Math.PI * 2);
			warningLights[w].intensity = 0.5 + Math.sin(warningLightPhase) * 0.5;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var l = 0; l < lights.length; l++) {
			scene.remove(lights[l]);
		}
		lights = [];

		warningLights = [];
		scene = null;
		camera = null;
		launcherAngle = 0;
		blastDoorOffset = 0;
		warningLightIndex = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
