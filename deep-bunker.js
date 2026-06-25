window.DeepBunker = (function() {
	'use strict';

	var scene, camera;
	var mainMeshes = [];
	var animatedObjects = [];
	var reactorGlow, airFans, growLights, emergencyLights;
	var reactorIntensity = 0;
	var fanRotation = 0;
	var lightFlicker = 0;

	var material = {
		steel: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7, metalness: 0.8 }),
		concrete: new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 }),
		green: new THREE.MeshStandardMaterial({ color: 0x00aa44, roughness: 0.6 }),
		red: new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.8 }),
		yellow: new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5, emissive: 0xffff00 }),
		black: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 }),
		glow: new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.8 })
	};

	var createMainShaft = function() {
		var shaftGeom = new THREE.CylinderGeometry(15, 15, 100, 32);
		var shaft = new THREE.Mesh(shaftGeom, material.steel);
		shaft.position.set(0, 0, 0);
		scene.add(shaft);
		mainMeshes.push(shaft);

		var shaftWalls = new THREE.CylinderGeometry(14.8, 14.8, 100, 32);
		var walls = new THREE.Mesh(shaftWalls, material.concrete);
		walls.position.set(0, 0.1, 0);
		scene.add(walls);
		mainMeshes.push(walls);

		var elevatorGeom = new THREE.BoxGeometry(3, 4, 3);
		var elevator = new THREE.Mesh(elevatorGeom, material.steel);
		elevator.position.set(0, -15, 0);
		scene.add(elevator);
		mainMeshes.push(elevator);
	};

	var createLivingQuarters = function() {
		var baseY = 35;
		var bunksPerRow = 6;
		var rows = 3;
		var spacing = 4;

		for (var r = 0; r < rows; r++) {
			for (var b = 0; b < bunksPerRow; b++) {
				var bunkGeom = new THREE.BoxGeometry(1.2, 1.8, 2.2);
				var bunk = new THREE.Mesh(bunkGeom, material.steel);
				bunk.position.set((b - 2.5) * spacing, baseY - r * 5, (r - 1) * 6);
				scene.add(bunk);
				mainMeshes.push(bunk);
			}
		}

		var commonAreaGeom = new THREE.BoxGeometry(12, 3, 8);
		var commonArea = new THREE.Mesh(commonAreaGeom, material.concrete);
		commonArea.position.set(0, 25, -18);
		scene.add(commonArea);
		mainMeshes.push(commonArea);

		var tableGeom = new THREE.BoxGeometry(2, 0.8, 2);
		for (var i = 0; i < 4; i++) {
			var table = new THREE.Mesh(tableGeom, material.steel);
			table.position.set((i - 1.5) * 2.5, 27, -18);
			scene.add(table);
			mainMeshes.push(table);
		}
	};

	var createHydroponicFarm = function() {
		var farmY = 10;
		var trayCount = 8;

		for (var i = 0; i < trayCount; i++) {
			var trayGeom = new THREE.BoxGeometry(2, 0.6, 16);
			var tray = new THREE.Mesh(trayGeom, material.concrete);
			tray.position.set((i - 3.5) * 3, farmY, 0);
			scene.add(tray);
			mainMeshes.push(tray);

			var plantCols = 12;
			for (var p = 0; p < plantCols; p++) {
				var plantGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
				var plant = new THREE.Mesh(plantGeom, material.green);
				plant.position.set((i - 3.5) * 3, farmY + 1, -8 + p * 2.7);
				scene.add(plant);
				mainMeshes.push(plant);
			}

			var lightGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
			var light = new THREE.Mesh(lightGeom, material.yellow);
			light.position.set((i - 3.5) * 3, farmY + 3, 0);
			scene.add(light);
			growLights.push(light);
			mainMeshes.push(light);
		}
	};

	var createNuclearReactor = function() {
		var reactorY = -15;

		var reactorGeom = new THREE.CylinderGeometry(5, 5, 12, 32);
		var reactor = new THREE.Mesh(reactorGeom, material.glow);
		reactor.position.set(0, reactorY, 0);
		scene.add(reactor);
		reactorGlow = reactor;
		mainMeshes.push(reactor);

		var shieldGeom = new THREE.CylinderGeometry(6, 6, 13, 32);
		var shield = new THREE.Mesh(shieldGeom, material.steel);
		shield.position.set(0, reactorY - 0.5, 0);
		scene.add(shield);
		mainMeshes.push(shield);

		var pipeCount = 8;
		for (var p = 0; p < pipeCount; p++) {
			var angle = (p / pipeCount) * Math.PI * 2;
			var pipeGeom = new THREE.CylinderGeometry(0.5, 0.5, 4, 12);
			var pipe = new THREE.Mesh(pipeGeom, material.steel);
			pipe.position.set(Math.cos(angle) * 7, reactorY + 8, Math.sin(angle) * 7);
			pipe.rotation.z = angle + Math.PI / 2;
			scene.add(pipe);
			mainMeshes.push(pipe);
		}

		var coolantGeom = new THREE.BoxGeometry(18, 1, 18);
		var coolantPool = new THREE.Mesh(coolantGeom, material.steel);
		coolantPool.position.set(0, reactorY - 8, 0);
		scene.add(coolantPool);
		mainMeshes.push(coolantPool);
	};

	var createCommandFloor = function() {
		var cmdY = -35;

		var floorGeom = new THREE.BoxGeometry(20, 0.5, 20);
		var floor = new THREE.Mesh(floorGeom, material.concrete);
		floor.position.set(0, cmdY, 0);
		scene.add(floor);
		mainMeshes.push(floor);

		var mapTableGeom = new THREE.BoxGeometry(6, 1.2, 6);
		var mapTable = new THREE.Mesh(mapTableGeom, material.steel);
		mapTable.position.set(-6, cmdY + 1.5, 0);
		scene.add(mapTable);
		mainMeshes.push(mapTable);

		var screenGeom = new THREE.BoxGeometry(0.5, 3, 4);
		for (var s = 0; s < 4; s++) {
			var screen = new THREE.Mesh(screenGeom, material.black);
			screen.position.set(4 + s * 2, cmdY + 2, 0);
			scene.add(screen);
			mainMeshes.push(screen);

			var displayGeom = new THREE.BoxGeometry(0.3, 2.5, 3.8);
			var display = new THREE.Mesh(displayGeom, material.yellow);
			display.position.set(4 + s * 2, cmdY + 2, 0);
			scene.add(display);
			mainMeshes.push(display);
		}

		var commArrayGeom = new THREE.BoxGeometry(3, 4, 3);
		var commArray = new THREE.Mesh(commArrayGeom, material.steel);
		commArray.position.set(8, cmdY + 3, 8);
		scene.add(commArray);
		mainMeshes.push(commArray);
	};

	var createWaterRecycling = function() {
		var waterY = -5;
		var tankCount = 3;

		for (var t = 0; t < tankCount; t++) {
			var tankGeom = new THREE.CylinderGeometry(2, 2, 6, 16);
			var tank = new THREE.Mesh(tankGeom, material.steel);
			tank.position.set((t - 1) * 7, waterY, -15);
			scene.add(tank);
			mainMeshes.push(tank);

			var waterGeom = new THREE.CylinderGeometry(1.9, 1.9, 5.8, 16);
			var water = new THREE.Mesh(waterGeom, material.steel);
			water.material = new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.3, metalness: 0.2 });
			water.position.set((t - 1) * 7, waterY, -15);
			scene.add(water);
			mainMeshes.push(water);
		}

		for (var p = 0; p < 2; p++) {
			var pipeGeom = new THREE.CylinderGeometry(0.4, 0.4, 7, 12);
			var pipe = new THREE.Mesh(pipeGeom, material.steel);
			pipe.position.set(0, waterY + 3.5, -15);
			pipe.rotation.z = Math.PI / 2;
			scene.add(pipe);
			mainMeshes.push(pipe);
		}
	};

	var createMedicalBay = function() {
		var medY = 5;
		var bedCount = 6;

		for (var b = 0; b < bedCount; b++) {
			var bedGeom = new THREE.BoxGeometry(1, 0.6, 2.2);
			var bed = new THREE.Mesh(bedGeom, material.steel);
			bed.position.set((b - 2.5) * 2.5, medY, 20);
			scene.add(bed);
			mainMeshes.push(bed);

			var headboardGeom = new THREE.BoxGeometry(1.2, 1.5, 0.3);
			var headboard = new THREE.Mesh(headboardGeom, material.steel);
			headboard.position.set((b - 2.5) * 2.5, medY + 1.2, 21.2);
			scene.add(headboard);
			mainMeshes.push(headboard);

			var equipGeom = new THREE.BoxGeometry(0.4, 1.8, 0.4);
			var equip = new THREE.Mesh(equipGeom, material.steel);
			equip.position.set((b - 2.5) * 2.5 + 0.8, medY + 1, 20);
			scene.add(equip);
			mainMeshes.push(equip);
		}

		var cabinetGeom = new THREE.BoxGeometry(3, 2, 1);
		var cabinet = new THREE.Mesh(cabinetGeom, material.steel);
		cabinet.position.set(0, medY + 1.5, 16);
		scene.add(cabinet);
		mainMeshes.push(cabinet);
	};

	var createArmory = function() {
		var armY = -25;

		var rackCount = 4;
		for (var r = 0; r < rackCount; r++) {
			var rackGeom = new THREE.BoxGeometry(2, 3, 1);
			var rack = new THREE.Mesh(rackGeom, material.steel);
			rack.position.set((r - 1.5) * 3, armY, -20);
			scene.add(rack);
			mainMeshes.push(rack);

			var shelfCount = 4;
			for (var s = 0; s < shelfCount; s++) {
				var shelfGeom = new THREE.BoxGeometry(2, 0.2, 0.8);
				var shelf = new THREE.Mesh(shelfGeom, material.steel);
				shelf.position.set((r - 1.5) * 3, armY - 1.2 + s * 0.8, -20);
				scene.add(shelf);
				mainMeshes.push(shelf);
			}
		}

		var ammoBoxGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
		for (var a = 0; a < 16; a++) {
			var ammoBox = new THREE.Mesh(ammoBoxGeom, material.red);
			ammoBox.position.set(-5 + (a % 4) * 1.2, armY + 0.5 + Math.floor(a / 4) * 0.8, -20);
			scene.add(ammoBox);
			mainMeshes.push(ammoBox);
		}
	};

	var createAirFiltration = function() {
		var filterY = 45;
		var fanCount = 4;

		for (var f = 0; f < fanCount; f++) {
			var fanGeom = new THREE.CylinderGeometry(3, 3, 1.5, 32);
			var fan = new THREE.Mesh(fanGeom, material.steel);
			fan.position.set((f - 1.5) * 8, filterY, 0);
			scene.add(fan);
			airFans.push(fan);
			mainMeshes.push(fan);

			var bladeGeom = new THREE.BoxGeometry(4, 0.2, 0.8);
			var blades = new THREE.Mesh(bladeGeom, material.steel);
			blades.position.set((f - 1.5) * 8, filterY + 0.1, 0);
			scene.add(blades);
			airFans.push(blades);
			mainMeshes.push(blades);

			var shaftGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
			var shaft = new THREE.Mesh(shaftGeom, material.steel);
			shaft.position.set((f - 1.5) * 8, filterY, 0);
			scene.add(shaft);
			mainMeshes.push(shaft);
		}
	};

	var createLockdownBarriers = function() {
		var barrierPositions = [40, 20, 0, -20, -40];

		for (var b = 0; b < barrierPositions.length; b++) {
			var doorGeom = new THREE.BoxGeometry(18, 6, 0.8);
			var door = new THREE.Mesh(doorGeom, material.steel);
			door.position.set(0, barrierPositions[b], 0);
			scene.add(door);
			emergencyLights.push(door);
			mainMeshes.push(door);

			var warningGeom = new THREE.SphereGeometry(0.5, 8, 8);
			var warning = new THREE.Mesh(warningGeom, material.red);
			warning.position.set(-8, barrierPositions[b] + 3, 0.5);
			scene.add(warning);
			emergencyLights.push(warning);
			mainMeshes.push(warning);

			var warning2 = new THREE.Mesh(warningGeom, material.red);
			warning2.position.set(8, barrierPositions[b] + 3, 0.5);
			scene.add(warning2);
			emergencyLights.push(warning2);
			mainMeshes.push(warning2);
		}
	};

	var createPeriscopeShaft = function() {
		var shaftGeom = new THREE.CylinderGeometry(1.5, 1.5, 120, 16);
		var shaft = new THREE.Mesh(shaftGeom, material.steel);
		shaft.position.set(25, 0, 25);
		scene.add(shaft);
		mainMeshes.push(shaft);

		var topGeom = new THREE.SphereGeometry(2, 16, 16);
		var top = new THREE.Mesh(topGeom, material.steel);
		top.position.set(25, 60, 25);
		scene.add(top);
		mainMeshes.push(top);

		var lensGeom = new THREE.SphereGeometry(1.2, 12, 12);
		var lens = new THREE.Mesh(lensGeom, new THREE.MeshStandardMaterial({ color: 0xccccff, roughness: 0.1, metalness: 0.3 }));
		lens.position.set(25, 61, 25);
		scene.add(lens);
		mainMeshes.push(lens);
	};

	var init = function(s, c) {
		scene = s;
		camera = c;
		mainMeshes = [];
		animatedObjects = [];
		reactorGlow = null;
		airFans = [];
		growLights = [];
		emergencyLights = [];
		reactorIntensity = 0;
		fanRotation = 0;
		lightFlicker = 0;

		var ambientLight = new THREE.AmbientLight(0x444466, 1.2);
		scene.add(ambientLight);

		var pointLight1 = new THREE.PointLight(0xff6600, 1.5, 50);
		pointLight1.position.set(0, -15, 0);
		scene.add(pointLight1);

		var pointLight2 = new THREE.PointLight(0xffff00, 0.8, 40);
		pointLight2.position.set(0, 10, 0);
		scene.add(pointLight2);

		createMainShaft();
		createLivingQuarters();
		createHydroponicFarm();
		createNuclearReactor();
		createCommandFloor();
		createWaterRecycling();
		createMedicalBay();
		createArmory();
		createAirFiltration();
		createLockdownBarriers();
		createPeriscopeShaft();

		return true;
	};

	var update = function(delta) {
		var deltaMs = delta * 1000;

		if (reactorGlow) {
			reactorIntensity += (Math.sin(deltaMs * 0.001) * 0.02);
			reactorIntensity = Math.max(0.3, Math.min(1.2, reactorIntensity));
			reactorGlow.material.emissiveIntensity = reactorIntensity;
			reactorGlow.material.color.setHSL(0.05, 1, 0.3 + reactorIntensity * 0.3);
		}

		for (var f = 0; f < airFans.length; f++) {
			if (f % 2 === 0) {
				fanRotation += deltaMs * 0.002;
				airFans[f].rotation.y = fanRotation;
			}
		}

		for (var g = 0; g < growLights.length; g++) {
			var pulse = 0.5 + 0.5 * Math.sin(deltaMs * 0.003 + g);
			growLights[g].material.emissiveIntensity = pulse;
		}

		lightFlicker += deltaMs * 0.005;
		for (var e = 0; e < emergencyLights.length; e++) {
			if (emergencyLights[e].geometry instanceof THREE.SphereGeometry) {
				var flicker = Math.sin(lightFlicker * 3) * 0.3 + 0.7;
				emergencyLights[e].material.emissiveIntensity = flicker;
			}
		}

		return true;
	};

	var reset = function() {
		for (var i = 0; i < mainMeshes.length; i++) {
			scene.remove(mainMeshes[i]);
		}
		mainMeshes = [];
		airFans = [];
		growLights = [];
		emergencyLights = [];
		reactorGlow = null;
		reactorIntensity = 0;
		fanRotation = 0;
		lightFlicker = 0;

		return true;
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
