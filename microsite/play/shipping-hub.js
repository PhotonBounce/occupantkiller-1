window.ShippingHub = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var conveyorBelts = [];
	var forklifts = [];
	var scanningStations = [];
	var vaultDoor = null;
	var loadingDockDoors = [];
	var sprinklerHead = null;
	var spawnPoints = [];
	var elapsedTime = 0;

	var COLORS = {
		industrialGray: 0x4A4A4A,
		safetyYellow: 0xFFCC00,
		warehouseOrange: 0xFF8C00,
		scannerGreen: 0x00DD00,
		darkSteel: 0x2A2A2A,
		concrete: 0x888888,
		white: 0xFFFFFF
	};

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		meshes = [];
		conveyorBelts = [];
		forklifts = [];
		scanningStations = [];
		spawnPoints = [];
		elapsedTime = 0;

		buildMainSortingWarehouse();
		buildConveyorBeltSystems();
		buildStackedCargoPallets();
		buildClimateVault();
		buildCustomsInspection();
		buildLoadingDockBays();
		buildForklifts();
		buildBarcodeStations();
		buildOverheadConveyorRails();
		buildSortingChutes();
		buildSecurityCheckpoint();
		buildSurveillanceBank();
		buildSprinklerSystem();
		buildSpawnPoints();
	}

	function buildMainSortingWarehouse() {
		var warehouseGeometry = new THREE.BoxGeometry(120, 60, 100);
		var warehouseMaterial = new THREE.MeshStandardMaterial({ color: COLORS.industrialGray });
		var warehouse = new THREE.Mesh(warehouseGeometry, warehouseMaterial);
		warehouse.position.set(0, 30, 0);
		warehouse.castShadow = true;
		warehouse.receiveShadow = true;
		scene.add(warehouse);
		meshes.push(warehouse);

		var northWallGeo = new THREE.BoxGeometry(120, 60, 2);
		var wallMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
		var northWall = new THREE.Mesh(northWallGeo, wallMat);
		northWall.position.set(0, 30, -50);
		northWall.castShadow = true;
		scene.add(northWall);
		meshes.push(northWall);

		var southWallGeo = new THREE.BoxGeometry(120, 60, 2);
		var southWall = new THREE.Mesh(southWallGeo, wallMat);
		southWall.position.set(0, 30, 50);
		southWall.castShadow = true;
		scene.add(southWall);
		meshes.push(southWall);

		var eastWallGeo = new THREE.BoxGeometry(2, 60, 100);
		var eastWall = new THREE.Mesh(eastWallGeo, wallMat);
		eastWall.position.set(60, 30, 0);
		eastWall.castShadow = true;
		scene.add(eastWall);
		meshes.push(eastWall);

		var westWallGeo = new THREE.BoxGeometry(2, 60, 100);
		var westWall = new THREE.Mesh(westWallGeo, wallMat);
		westWall.position.set(-60, 30, 0);
		westWall.castShadow = true;
		scene.add(westWall);
		meshes.push(westWall);

		var floorGeo = new THREE.BoxGeometry(124, 1, 104);
		var floorMat = new THREE.MeshStandardMaterial({ color: COLORS.concrete });
		var floor = new THREE.Mesh(floorGeo, floorMat);
		floor.position.set(0, 0, 0);
		floor.receiveShadow = true;
		scene.add(floor);
		meshes.push(floor);
	}

	function buildConveyorBeltSystems() {
		var conveyorPositions = [
			{ x: -30, z: -20, lengthX: 60 },
			{ x: -30, z: 0, lengthX: 60 },
			{ x: -30, z: 20, lengthX: 60 }
		];

		conveyorPositions.forEach(function(pos) {
			var beltGeo = new THREE.BoxGeometry(pos.lengthX, 1, 8);
			var beltMat = new THREE.MeshStandardMaterial({ color: COLORS.safetyYellow });
			var belt = new THREE.Mesh(beltGeo, beltMat);
			belt.position.set(pos.x, 1, pos.z);
			belt.castShadow = true;
			belt.receiveShadow = true;
			scene.add(belt);
			meshes.push(belt);
			conveyorBelts.push({
				mesh: belt,
				speed: 0.3,
				direction: 1,
				originalMaterial: beltMat
			});

			for (var i = 0; i < 4; i++) {
				var rollerGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
				var rollerMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
				var roller = new THREE.Mesh(rollerGeo, rollerMat);
				roller.rotation.z = Math.PI / 2;
				roller.position.set(pos.x - 15 + i * 10, 2, pos.z);
				roller.castShadow = true;
				scene.add(roller);
				meshes.push(roller);
			}
		});
	}

	function buildStackedCargoPallets() {
		var palletPositions = [
			{ x: 20, z: -30 },
			{ x: 40, z: -30 },
			{ x: 20, z: 30 },
			{ x: 40, z: 30 }
		];

		palletPositions.forEach(function(pos) {
			var palletGeo = new THREE.BoxGeometry(10, 1, 10);
			var palletMat = new THREE.MeshStandardMaterial({ color: COLORS.warehouseOrange });

			for (var i = 0; i < 4; i++) {
				var pallet = new THREE.Mesh(palletGeo, palletMat);
				pallet.position.set(pos.x, 1 + i * 6, pos.z);
				pallet.castShadow = true;
				pallet.receiveShadow = true;
				scene.add(pallet);
				meshes.push(pallet);

				var boxGeo = new THREE.BoxGeometry(8, 5, 8);
				var boxMat = new THREE.MeshStandardMaterial({ color: COLORS.safetyYellow });
				var box = new THREE.Mesh(boxGeo, boxMat);
				box.position.set(pos.x, 3.5 + i * 6, pos.z);
				box.castShadow = true;
				box.receiveShadow = true;
				scene.add(box);
				meshes.push(box);
			}
		});
	}

	function buildClimateVault() {
		var vaultX = -35;
		var vaultZ = -35;

		var vaultFrameGeo = new THREE.BoxGeometry(30, 25, 25);
		var vaultMat = new THREE.MeshStandardMaterial({ color: COLORS.industrialGray });
		var vaultFrame = new THREE.Mesh(vaultFrameGeo, vaultMat);
		vaultFrame.position.set(vaultX, 12.5, vaultZ);
		vaultFrame.castShadow = true;
		scene.add(vaultFrame);
		meshes.push(vaultFrame);

		var doorGeo = new THREE.BoxGeometry(4, 20, 20);
		var doorMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
		vaultDoor = new THREE.Mesh(doorGeo, doorMat);
		vaultDoor.position.set(vaultX - 15, 12, vaultZ);
		vaultDoor.castShadow = true;
		scene.add(vaultDoor);
		meshes.push(vaultDoor);

		var thermostatGeo = new THREE.BoxGeometry(3, 3, 1);
		var thermoMat = new THREE.MeshStandardMaterial({ color: COLORS.scannerGreen });
		var thermostat = new THREE.Mesh(thermostatGeo, thermoMat);
		thermostat.position.set(vaultX + 12, 20, vaultZ - 10);
		thermostat.castShadow = true;
		scene.add(thermostat);
		meshes.push(thermostat);
	}

	function buildCustomsInspection() {
		var tableGeo = new THREE.BoxGeometry(20, 1, 15);
		var tableMat = new THREE.MeshStandardMaterial({ color: COLORS.concrete });
		var table = new THREE.Mesh(tableGeo, tableMat);
		table.position.set(0, 5, 35);
		table.castShadow = true;
		table.receiveShadow = true;
		scene.add(table);
		meshes.push(table);

		var legGeo = new THREE.BoxGeometry(2, 4, 2);
		var legMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
		var positions = [
			{ x: -8, z: -5 },
			{ x: -8, z: 5 },
			{ x: 8, z: -5 },
			{ x: 8, z: 5 }
		];
		positions.forEach(function(pos) {
			var leg = new THREE.Mesh(legGeo, legMat);
			leg.position.set(pos.x, 2, 35 + pos.z);
			leg.castShadow = true;
			scene.add(leg);
			meshes.push(leg);
		});

		var scannerArchGeo = new THREE.BoxGeometry(18, 15, 2);
		var scannerMat = new THREE.MeshStandardMaterial({ color: COLORS.scannerGreen });
		var scannerArch = new THREE.Mesh(scannerArchGeo, scannerMat);
		scannerArch.position.set(0, 12.5, 48);
		scannerArch.castShadow = true;
		scene.add(scannerArch);
		meshes.push(scannerArch);
	}

	function buildLoadingDockBays() {
		for (var i = 0; i < 3; i++) {
			var doorGeo = new THREE.BoxGeometry(12, 15, 2);
			var doorMat = new THREE.MeshStandardMaterial({ color: COLORS.safetyYellow });
			var door = new THREE.Mesh(doorGeo, doorMat);
			door.position.set(-30 + i * 30, 7.5, -58);
			door.castShadow = true;
			scene.add(door);
			meshes.push(door);
			loadingDockDoors.push({
				mesh: door,
				originalX: door.position.x,
				openAmount: 0
			});

			var frameGeo = new THREE.BoxGeometry(13, 16, 1);
			var frameMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
			var frame = new THREE.Mesh(frameGeo, frameMat);
			frame.position.set(-30 + i * 30, 8, -59);
			frame.castShadow = true;
			scene.add(frame);
			meshes.push(frame);

			var dockPlatformGeo = new THREE.BoxGeometry(15, 1, 8);
			var dockMat = new THREE.MeshStandardMaterial({ color: COLORS.concrete });
			var dockPlatform = new THREE.Mesh(dockPlatformGeo, dockMat);
			dockPlatform.position.set(-30 + i * 30, 0.5, -50);
			dockPlatform.receiveShadow = true;
			scene.add(dockPlatform);
			meshes.push(dockPlatform);
		}
	}

	function buildForklifts() {
		var forkPositions = [
			{ x: 0, z: 0 },
			{ x: 20, z: 15 },
			{ x: -20, z: -15 }
		];

		forkPositions.forEach(function(pos) {
			var bodyGeo = new THREE.BoxGeometry(3, 4, 6);
			var bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.safetyYellow });
			var body = new THREE.Mesh(bodyGeo, bodyMat);
			body.position.set(pos.x, 2, pos.z);
			body.castShadow = true;
			scene.add(body);
			meshes.push(body);

			for (var w = 0; w < 4; w++) {
				var wheelGeo = new THREE.CylinderGeometry(1, 1, 0.8, 12);
				var wheelMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
				var wheel = new THREE.Mesh(wheelGeo, wheelMat);
				wheel.rotation.z = Math.PI / 2;
				var wheelX = w < 2 ? -1 : 1;
				var wheelZ = w % 2 === 0 ? -2 : 2;
				wheel.position.set(pos.x + wheelX, 1, pos.z + wheelZ);
				wheel.castShadow = true;
				scene.add(wheel);
				meshes.push(wheel);
			}

			var forkGeo = new THREE.BoxGeometry(0.8, 5, 3);
			var forkMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
			var fork = new THREE.Mesh(forkGeo, forkMat);
			fork.position.set(pos.x, 4.5, pos.z + 3.5);
			fork.castShadow = true;
			scene.add(fork);
			meshes.push(fork);

			forklifts.push({
				body: body,
				position: pos,
				angle: Math.random() * Math.PI * 2,
				speed: 5 + Math.random() * 10
			});
		});
	}

	function buildBarcodeStations() {
		var stationPositions = [
			{ x: -40, z: -10 },
			{ x: -40, z: 10 },
			{ x: 40, z: -10 },
			{ x: 40, z: 10 }
		];

		stationPositions.forEach(function(pos) {
			var koskGeo = new THREE.BoxGeometry(4, 6, 4);
			var koskMat = new THREE.MeshStandardMaterial({ color: COLORS.industrialGray });
			var kiosk = new THREE.Mesh(koskGeo, koskMat);
			kiosk.position.set(pos.x, 3, pos.z);
			kiosk.castShadow = true;
			scene.add(kiosk);
			meshes.push(kiosk);

			var screenGeo = new THREE.BoxGeometry(3, 3, 0.5);
			var screenMat = new THREE.MeshStandardMaterial({ color: COLORS.scannerGreen });
			var screen = new THREE.Mesh(screenGeo, screenMat);
			screen.position.set(pos.x, 5.5, pos.z);
			screen.castShadow = true;
			scene.add(screen);
			meshes.push(screen);

			scanningStations.push({
				screen: screen,
				pulsing: false,
				pulsePhase: 0
			});
		});
	}

	function buildOverheadConveyorRails() {
		var railGeo = new THREE.BoxGeometry(100, 2, 2);
		var railMat = new THREE.MeshStandardMaterial({ color: COLORS.industrialGray });
		var rail1 = new THREE.Mesh(railGeo, railMat);
		rail1.position.set(0, 40, -20);
		rail1.castShadow = true;
		scene.add(rail1);
		meshes.push(rail1);

		var rail2 = new THREE.Mesh(railGeo, railMat);
		rail2.position.set(0, 40, 20);
		rail2.castShadow = true;
		scene.add(rail2);
		meshes.push(rail2);

		for (var i = 0; i < 10; i++) {
			var supportGeo = new THREE.BoxGeometry(2, 15, 2);
			var supportMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
			var support = new THREE.Mesh(supportGeo, supportMat);
			support.position.set(-40 + i * 10, 32.5, 0);
			support.castShadow = true;
			scene.add(support);
			meshes.push(support);

			var linePoints = [
				new THREE.Vector3(-40 + i * 10, 40, -20),
				new THREE.Vector3(-40 + i * 10, 32.5, 0)
			];
			var lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
			var lineMat = new THREE.LineBasicMaterial({ color: COLORS.industrialGray });
			var line = new THREE.LineSegments(lineGeo, lineMat);
			scene.add(line);
			meshes.push(line);
		}
	}

	function buildSortingChutes() {
		var chutePositions = [
			{ x: -30, z: 20, angle: -0.3 },
			{ x: 30, z: 20, angle: 0.3 }
		];

		chutePositions.forEach(function(pos) {
			var chuteGeo = new THREE.BoxGeometry(8, 12, 5);
			var chuteMat = new THREE.MeshStandardMaterial({ color: COLORS.warehouseOrange });
			var chute = new THREE.Mesh(chuteGeo, chuteMat);
			chute.position.set(pos.x, 8, pos.z);
			chute.rotation.z = pos.angle;
			chute.castShadow = true;
			scene.add(chute);
			meshes.push(chute);
		});
	}

	function buildSecurityCheckpoint() {
		var boothGeo = new THREE.BoxGeometry(15, 10, 8);
		var boothMat = new THREE.MeshStandardMaterial({ color: COLORS.industrialGray });
		var booth = new THREE.Mesh(boothGeo, boothMat);
		booth.position.set(0, 5, -40);
		booth.castShadow = true;
		scene.add(booth);
		meshes.push(booth);

		var windowGeo = new THREE.BoxGeometry(6, 4, 0.5);
		var windowMat = new THREE.MeshStandardMaterial({ color: COLORS.white });
		var window1 = new THREE.Mesh(windowGeo, windowMat);
		window1.position.set(-4, 6, -44);
		window1.castShadow = true;
		scene.add(window1);
		meshes.push(window1);

		var window2 = new THREE.Mesh(windowGeo, windowMat);
		window2.position.set(4, 6, -44);
		window2.castShadow = true;
		scene.add(window2);
		meshes.push(window2);
	}

	function buildSurveillanceBank() {
		var consoleGeo = new THREE.BoxGeometry(25, 4, 4);
		var consoleMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
		var console = new THREE.Mesh(consoleGeo, consoleMat);
		console.position.set(40, 7, 40);
		console.castShadow = true;
		scene.add(console);
		meshes.push(console);

		for (var i = 0; i < 6; i++) {
			var monitorGeo = new THREE.BoxGeometry(3.5, 3, 0.5);
			var monitorMat = new THREE.MeshStandardMaterial({ color: COLORS.scannerGreen });
			var monitor = new THREE.Mesh(monitorGeo, monitorMat);
			monitor.position.set(35 + i * 4, 9.5, 40);
			monitor.castShadow = true;
			scene.add(monitor);
			meshes.push(monitor);
		}
	}

	function buildSprinklerSystem() {
		var pipeGeo = new THREE.CylinderGeometry(0.5, 0.5, 80, 8);
		var pipeMat = new THREE.MeshStandardMaterial({ color: COLORS.darkSteel });
		var pipe1 = new THREE.Mesh(pipeGeo, pipeMat);
		pipe1.rotation.z = Math.PI / 2;
		pipe1.position.set(0, 55, -25);
		pipe1.castShadow = true;
		scene.add(pipe1);
		meshes.push(pipe1);

		var pipe2 = new THREE.Mesh(pipeGeo, pipeMat);
		pipe2.rotation.z = Math.PI / 2;
		pipe2.position.set(0, 55, 25);
		pipe2.castShadow = true;
		scene.add(pipe2);
		meshes.push(pipe2);

		var headGeo = new THREE.SphereGeometry(1, 8, 8);
		var headMat = new THREE.MeshStandardMaterial({ color: COLORS.safetyYellow });
		sprinklerHead = new THREE.Mesh(headGeo, headMat);
		sprinklerHead.position.set(0, 55, 0);
		sprinklerHead.castShadow = true;
		scene.add(sprinklerHead);
		meshes.push(sprinklerHead);
	}

	function buildSpawnPoints() {
		spawnPoints = [
			{ x: -50, y: 5, z: -55, name: 'dock_entrance' },
			{ x: -30, y: 5, z: -10, name: 'warehouse_aisle_west' },
			{ x: 30, y: 5, z: -10, name: 'warehouse_aisle_east' },
			{ x: 0, y: 5, z: 35, name: 'customs_zone' },
			{ x: -35, y: 5, z: -35, name: 'vault_entrance' }
		];
	}

	function update(delta) {
		elapsedTime += delta;

		conveyorBelts.forEach(function(belt) {
			belt.mesh.position.x += belt.speed * delta * belt.direction;
			if (belt.mesh.position.x > 50) belt.mesh.position.x = -50;
			if (belt.mesh.position.x < -50) belt.mesh.position.x = 50;
		});

		forklifts.forEach(function(forklift) {
			forklift.angle += (0.5 * delta);
			var radius = 15;
			forklift.body.position.x = forklift.position.x + Math.cos(forklift.angle) * radius;
			forklift.body.position.z = forklift.position.z + Math.sin(forklift.angle) * radius;
		});

		scanningStations.forEach(function(station) {
			var pulseIntensity = Math.sin(elapsedTime * 3) * 0.5 + 0.5;
			station.screen.material.color.setHex(
				Math.floor(COLORS.scannerGreen * (0.5 + pulseIntensity * 0.5))
			);
		});

		if (vaultDoor) {
			var vaultCycle = (elapsedTime % 6) / 6;
			var openAmount = Math.abs(Math.sin(vaultCycle * Math.PI));
			vaultDoor.position.x = -35 - 15 - openAmount * 8;
		}

		loadingDockDoors.forEach(function(door) {
			var cycleFraction = (elapsedTime % 8) / 8;
			if (cycleFraction < 0.4) {
				door.openAmount = (cycleFraction / 0.4) * 5;
			} else if (cycleFraction < 0.6) {
				door.openAmount = 5;
			} else {
				door.openAmount = (1 - (cycleFraction - 0.6) / 0.4) * 5;
			}
			door.mesh.position.z = -58 + door.openAmount;
		});

		if (sprinklerHead) {
			sprinklerHead.rotation.x = Math.sin(elapsedTime * 1.5) * 0.3;
			sprinklerHead.rotation.y = Math.cos(elapsedTime * 1.2) * 0.3;
		}
	}

	function reset() {
		meshes.forEach(function(mesh) {
			scene.remove(mesh);
			if (mesh.geometry) mesh.geometry.dispose();
			if (mesh.material) {
				if (Array.isArray(mesh.material)) {
					mesh.material.forEach(function(mat) { mat.dispose(); });
				} else {
					mesh.material.dispose();
				}
			}
		});
		meshes = [];
		conveyorBelts = [];
		forklifts = [];
		scanningStations = [];
		loadingDockDoors = [];
		vaultDoor = null;
		sprinklerHead = null;
		spawnPoints = [];
		elapsedTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset,
		getSpawnPoints: function() { return spawnPoints; }
	};
}());
