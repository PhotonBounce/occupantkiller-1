window.PoisonBase = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animationState = {
		fermentationTime: 0,
		alarmTime: 0,
		conveyorTime: 0,
		bubbles: [],
		alarmLights: []
	};

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animationState = {
			fermentationTime: 0,
			alarmTime: 0,
			conveyorTime: 0,
			bubbles: [],
			alarmLights: []
		};

		buildlighting();
		buildfermentationtanks();
		buildcleanroom();
		buildcontainment();
		buildtestcells();
		builduniformracks();
		buildassemblyline();
		buildblastshields();
		buildcanistervault();
		buildinfrastructure();
	}

	function buildlighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 50, 50);
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0x00ff00, 0.5, 100);
		pointLight1.position.set(0, 20, -30);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xff0000, 0.3, 80);
		pointLight2.position.set(-40, 15, 0);
		scene.add(pointLight2);
		animationState.alarmLights.push(pointLight2);
		lights.push(pointLight2);
	}

	function buildfermentationtanks() {
		var positions = [
			[-40, 0, -50],
			[-20, 0, -50],
			[0, 0, -50],
			[20, 0, -50],
			[40, 0, -50],
			[-30, 0, 30],
			[0, 0, 30],
			[30, 0, 30]
		];

		positions.forEach(function(pos) {
			var tankGeometry = new THREE.CylinderGeometry(8, 8, 25, 16);
			var tankMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
			var tank = new THREE.Mesh(tankGeometry, tankMaterial);
			tank.position.set(pos[0], pos[1] + 12.5, pos[2]);
			tank.castShadow = true;
			tank.receiveShadow = true;
			scene.add(tank);
			objects.push(tank);

			var capGeometry = new THREE.SphereGeometry(8.5, 16, 8);
			var capMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
			var cap = new THREE.Mesh(capGeometry, capMaterial);
			cap.position.set(pos[0], pos[1] + 25, pos[2]);
			cap.scale.z = 0.4;
			cap.castShadow = true;
			scene.add(cap);
			objects.push(cap);

			var pipeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 15, 8);
			var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
			pipe.position.set(pos[0] + 10, pos[1] + 20, pos[2]);
			pipe.rotation.z = Math.PI / 6;
			scene.add(pipe);
			objects.push(pipe);

			for (var i = 0; i < 5; i++) {
				var bubbleGeometry = new THREE.SphereGeometry(0.5, 4, 4);
				var bubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff99 });
				var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
				bubble.position.set(pos[0] + (Math.random() - 0.5) * 10, pos[1] + 5, pos[2] + (Math.random() - 0.5) * 10);
				bubble.userData.originalY = bubble.position.y;
				bubble.userData.tankIndex = pos;
				scene.add(bubble);
				objects.push(bubble);
				animationState.bubbles.push(bubble);
			}
		});
	}

	function buildcleanroom() {
		var floorGeometry = new THREE.BoxGeometry(80, 1, 60);
		var floorMaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.y = 0;
		floor.receiveShadow = true;
		scene.add(floor);
		objects.push(floor);

		var ceilingGeometry = new THREE.BoxGeometry(80, 1, 60);
		var ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
		var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
		ceiling.position.y = 35;
		scene.add(ceiling);
		objects.push(ceiling);

		var wallNorth = new THREE.BoxGeometry(80, 35, 1);
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });
		var wallN = new THREE.Mesh(wallNorth, wallMaterial);
		wallN.position.set(0, 17.5, -30);
		wallN.receiveShadow = true;
		scene.add(wallN);
		objects.push(wallN);

		var wallSouth = new THREE.BoxGeometry(80, 35, 1);
		var wallS = new THREE.Mesh(wallSouth, wallMaterial);
		wallS.position.set(0, 17.5, 30);
		wallS.receiveShadow = true;
		scene.add(wallS);
		objects.push(wallS);

		var wallEast = new THREE.BoxGeometry(1, 35, 60);
		var wallE = new THREE.Mesh(wallEast, wallMaterial);
		wallE.position.set(40, 17.5, 0);
		wallE.receiveShadow = true;
		scene.add(wallE);
		objects.push(wallE);

		var wallWest = new THREE.BoxGeometry(1, 35, 60);
		var wallW = new THREE.Mesh(wallWest, wallMaterial);
		wallW.position.set(-40, 17.5, 0);
		wallW.receiveShadow = true;
		scene.add(wallW);
		objects.push(wallW);

		for (var i = 0; i < 4; i++) {
			var doorGeometry = new THREE.BoxGeometry(3, 8, 0.5);
			var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
			var door = new THREE.Mesh(doorGeometry, doorMaterial);
			door.position.set(-30 + i * 20, 4, -29.75);
			door.userData.isAirlock = true;
			scene.add(door);
			objects.push(door);
		}
	}

	function buildcontainment() {
		var tankpositions = [
			[-35, 0, 10],
			[-10, 0, 10],
			[15, 0, 10],
			[35, 0, 10]
		];

		tankpositions.forEach(function(pos) {
			var containmentGeometry = new THREE.CylinderGeometry(5, 5, 18, 12);
			var containmentMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
			var containment = new THREE.Mesh(containmentGeometry, containmentMaterial);
			containment.position.set(pos[0], pos[1] + 9, pos[2]);
			containment.castShadow = true;
			scene.add(containment);
			objects.push(containment);

			var warningGeometry = new THREE.BoxGeometry(6, 6, 0.2);
			var warningMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var warning = new THREE.Mesh(warningGeometry, warningMaterial);
			warning.position.set(pos[0] + 6, pos[1] + 12, pos[2]);
			scene.add(warning);
			objects.push(warning);

			var sealGeometry = new THREE.CylinderGeometry(5.5, 5.5, 1, 12);
			var sealMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
			var seal = new THREE.Mesh(sealGeometry, sealMaterial);
			seal.position.set(pos[0], pos[1] + 18, pos[2]);
			scene.add(seal);
			objects.push(seal);
		});
	}

	function buildtestcells() {
		var cellpositions = [
			[-25, 0, -20],
			[-5, 0, -20],
			[15, 0, -20],
			[35, 0, -20],
			[-25, 0, -5],
			[35, 0, -5]
		];

		cellpositions.forEach(function(pos) {
			var cellGeometry = new THREE.BoxGeometry(8, 8, 8);
			var cellMaterial = new THREE.MeshLambertMaterial({ color: 0xffffcc });
			var cell = new THREE.Mesh(cellGeometry, cellMaterial);
			cell.position.set(pos[0], pos[1] + 4, pos[2]);
			cell.castShadow = true;
			scene.add(cell);
			objects.push(cell);

			var barGeometry = new THREE.BoxGeometry(0.3, 8.5, 8.3);
			var barMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			for (var i = 0; i < 4; i++) {
				var bar = new THREE.Mesh(barGeometry, barMaterial);
				bar.position.set(pos[0] - 4 + i * 2.7, pos[1] + 4, pos[2]);
				scene.add(bar);
				objects.push(bar);
			}

			var glassGeometry = new THREE.BoxGeometry(8.3, 8.3, 0.2);
			var glassMaterial = new THREE.MeshLambertMaterial({ color: 0xaaffff, transparent: true, opacity: 0.5 });
			var glass = new THREE.Mesh(glassGeometry, glassMaterial);
			glass.position.set(pos[0], pos[1] + 4, pos[2] - 4.1);
			scene.add(glass);
			objects.push(glass);
		});
	}

	function builduniformracks() {
		var rackpositions = [
			[-45, 0, 5],
			[45, 0, 5],
			[-45, 0, 20],
			[45, 0, 20]
		];

		rackpositions.forEach(function(pos) {
			var frameGeometry = new THREE.BoxGeometry(1, 12, 6);
			var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var frame = new THREE.Mesh(frameGeometry, frameMaterial);
			frame.position.set(pos[0], pos[1] + 6, pos[2]);
			scene.add(frame);
			objects.push(frame);

			for (var i = 0; i < 5; i++) {
				var uniformGeometry = new THREE.BoxGeometry(4, 2, 4);
				var uniformMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
				var uniform = new THREE.Mesh(uniformGeometry, uniformMaterial);
				uniform.position.set(pos[0], pos[1] + 2 + i * 2.2, pos[2]);
				scene.add(uniform);
				objects.push(uniform);
			}

			var helmetGeometry = new THREE.SphereGeometry(1.5, 8, 8);
			var helmetMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
			var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
			helmet.position.set(pos[0], pos[1] + 12.5, pos[2]);
			scene.add(helmet);
			objects.push(helmet);
		});
	}

	function buildassemblyline() {
		var conveyorGeometry = new THREE.BoxGeometry(60, 0.5, 6);
		var conveyorMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var conveyor = new THREE.Mesh(conveyorGeometry, conveyorMaterial);
		conveyor.position.set(0, 8, -15);
		conveyor.userData.isConveyor = true;
		scene.add(conveyor);
		objects.push(conveyor);

		for (var i = 0; i < 10; i++) {
			var stationGeometry = new THREE.BoxGeometry(4, 3, 4);
			var stationMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
			var station = new THREE.Mesh(stationGeometry, stationMaterial);
			station.position.set(-25 + i * 6, 4.5, -15);
			station.castShadow = true;
			scene.add(station);
			objects.push(station);

			var armGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
			var armMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
			var arm = new THREE.Mesh(armGeometry, armMaterial);
			arm.position.set(-25 + i * 6, 7.5, -15);
			arm.rotation.z = Math.PI / 6;
			scene.add(arm);
			objects.push(arm);
		}

		for (var j = 0; j < 8; j++) {
			var itemGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
			var itemMaterial = new THREE.MeshLambertMaterial({ color: 0x00cc00 });
			var item = new THREE.Mesh(itemGeometry, itemMaterial);
			item.position.set(-25 + j * 7.5, 8.5, -15);
			item.userData.conveyorIndex = j;
			item.userData.conveyorItem = true;
			scene.add(item);
			objects.push(item);
		}
	}

	function buildblastshields() {
		var shieldpositions = [
			[-35, 0, -40],
			[35, 0, -40],
			[-35, 0, 40],
			[35, 0, 40]
		];

		shieldpositions.forEach(function(pos) {
			var shieldGeometry = new THREE.BoxGeometry(10, 15, 1);
			var shieldMaterial = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
			var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
			shield.position.set(pos[0], pos[1] + 7.5, pos[2]);
			shield.castShadow = true;
			scene.add(shield);
			objects.push(shield);

			var reinforcementGeometry = new THREE.BoxGeometry(0.8, 15.5, 0.8);
			var reinforcementMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			for (var i = 0; i < 3; i++) {
				var reinforcement = new THREE.Mesh(reinforcementGeometry, reinforcementMaterial);
				reinforcement.position.set(pos[0] - 3 + i * 3, pos[1] + 7.5, pos[2]);
				scene.add(reinforcement);
				objects.push(reinforcement);
			}
		});
	}

	function buildcanistervault() {
		var vaultGeometry = new THREE.BoxGeometry(25, 20, 15);
		var vaultMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
		vault.position.set(0, 10, -50);
		vault.castShadow = true;
		scene.add(vault);
		objects.push(vault);

		var doorGeometry = new THREE.BoxGeometry(8, 12, 0.8);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var door = new THREE.Mesh(doorGeometry, doorMaterial);
		door.position.set(-9, 10, -42.5);
		door.userData.isVaultDoor = true;
		scene.add(door);
		objects.push(door);

		for (var i = 0; i < 5; i++) {
			for (var j = 0; j < 4; j++) {
				var canisterGeometry = new THREE.CylinderGeometry(1.2, 1.2, 4, 8);
				var canisterMaterial = new THREE.MeshLambertMaterial({ color: 0x00dd00 });
				var canister = new THREE.Mesh(canisterGeometry, canisterMaterial);
				canister.position.set(-8 + i * 4, 4 + j * 4, -50);
				canister.castShadow = true;
				scene.add(canister);
				objects.push(canister);

				var capGeometry = new THREE.SphereGeometry(1.3, 8, 8);
				var capMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
				var cap = new THREE.Mesh(capGeometry, capMaterial);
				cap.position.set(-8 + i * 4, 6, -50);
				cap.scale.z = 0.3;
				scene.add(cap);
				objects.push(cap);
			}
		}

		var lockGeometry = new THREE.BoxGeometry(1, 1, 0.5);
		var lockMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
		var lock = new THREE.Mesh(lockGeometry, lockMaterial);
		lock.position.set(-9, 10, -41.8);
		scene.add(lock);
		objects.push(lock);
	}

	function buildinfrastructure() {
		var pipepositions = [
			[0, 18, -20],
			[0, 18, 0],
			[0, 18, 20],
			[-30, 18, 0],
			[30, 18, 0]
		];

		pipepositions.forEach(function(pos) {
			var pipeGeometry = new THREE.CylinderGeometry(2, 2, 20, 12);
			var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
			var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
			if (pos[0] === 0) {
				pipe.position.set(pos[0], pos[1], pos[2]);
				pipe.rotation.z = Math.PI / 2;
			} else {
				pipe.position.set(pos[0], pos[1], pos[2]);
				pipe.rotation.z = Math.PI / 2;
			}
			scene.add(pipe);
			objects.push(pipe);
		});

		for (var i = 0; i < 8; i++) {
			var ventGeometry = new THREE.BoxGeometry(4, 0.5, 4);
			var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var vent = new THREE.Mesh(ventGeometry, ventMaterial);
			vent.position.set(-30 + i * 15, 34.5, -25 + Math.random() * 50);
			scene.add(vent);
			objects.push(vent);
		}

		for (var j = 0; j < 6; j++) {
			var lightGeometry = new THREE.SphereGeometry(0.4, 8, 8);
			var lightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
			var light = new THREE.Mesh(lightGeometry, lightMaterial);
			light.position.set(-35 + j * 15, 33, 0);
			scene.add(light);
			objects.push(light);
		}

		var controlPanelGeometry = new THREE.BoxGeometry(6, 4, 2);
		var controlMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var controlPanel = new THREE.Mesh(controlPanelGeometry, controlMaterial);
		controlPanel.position.set(35, 3, -20);
		scene.add(controlPanel);
		objects.push(controlPanel);

		for (var k = 0; k < 6; k++) {
			var buttonGeometry = new THREE.SphereGeometry(0.3, 8, 8);
			var buttonMaterial = new THREE.MeshLambertMaterial({ color: k % 2 === 0 ? 0xff0000 : 0x00ff00 });
			var button = new THREE.Mesh(buttonGeometry, buttonMaterial);
			button.position.set(33 + k * 0.8, 3.5, -19);
			scene.add(button);
			objects.push(button);
		}

		var monitorGeometry = new THREE.BoxGeometry(4, 2.5, 0.3);
		var monitorMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
		var monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
		monitor.position.set(35, 5, -20);
		scene.add(monitor);
		objects.push(monitor);

		for (var m = 0; m < 4; m++) {
			var storageGeometry = new THREE.BoxGeometry(8, 6, 10);
			var storageMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
			var storage = new THREE.Mesh(storageGeometry, storageMaterial);
			storage.position.set(-35 + m * 25, 3, 30);
			storage.castShadow = true;
			scene.add(storage);
			objects.push(storage);
		}

		var generatorGeometry = new THREE.CylinderGeometry(3, 3, 8, 16);
		var generatorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var generator = new THREE.Mesh(generatorGeometry, generatorMaterial);
		generator.position.set(-35, 4, 40);
		generator.castShadow = true;
		scene.add(generator);
		objects.push(generator);

		var exhaustGeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 8);
		var exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
		exhaust.position.set(-35, 12, 40);
		scene.add(exhaust);
		objects.push(exhaust);
	}

	function update(delta) {
		animationState.fermentationTime += delta;
		animationState.alarmTime += delta;
		animationState.conveyorTime += delta;

		animationState.bubbles.forEach(function(bubble) {
			bubble.position.y = bubble.userData.originalY + Math.sin(animationState.fermentationTime * 2 + bubble.position.x) * 2;
			bubble.position.x += Math.sin(animationState.fermentationTime * 1.5 + bubble.position.z) * 0.1;
		});

		animationState.alarmLights.forEach(function(light) {
			var intensity = 0.3 + Math.abs(Math.sin(animationState.alarmTime * 5)) * 0.3;
			light.intensity = intensity;
		});

		objects.forEach(function(obj) {
			if (obj.userData.conveyorItem) {
				obj.position.x += delta * 15;
				if (obj.position.x > 30) {
					obj.position.x = -30;
				}
			}
		});

		objects.forEach(function(obj) {
			if (obj.userData.isVaultDoor) {
				obj.rotation.y = Math.sin(animationState.alarmTime * 1.2) * 0.15;
			}
		});
	}

	function reset() {
		objects.forEach(function(obj) {
			scene.remove(obj);
		});
		lights.forEach(function(light) {
			scene.remove(light);
		});
		objects = [];
		lights = [];
		scene = null;
		camera = null;
		animationState = {
			fermentationTime: 0,
			alarmTime: 0,
			conveyorTime: 0,
			bubbles: [],
			alarmLights: []
		};
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
