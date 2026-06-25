window.LootVault = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var vaultGroup = null;
	var laserWires = [];
	var securityCameras = [];
	var vaultDoor = null;
	var laserSweepAngle = 0;

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		vaultGroup = new THREE.Group();
		scene.add(vaultGroup);

		// Build vault complex
		buildMainVaultRoom();
		buildVaultDoor();
		buildWeaponRacks();
		buildGoldBars();
		buildCrateMountains();
		buildIntelligenceFileCases();
		buildStolenElectronics();
		buildTrophyWall();
		buildLaserTripwireGrid();
		buildMotionSensorPods();
		buildSecurityCameraArray();
		buildGuardBooth();
		buildLoadingDock();
		buildInventoryShelving();
		buildEvidenceBags();
		buildJewelryDisplayCases();
	}

	function buildMainVaultRoom() {
		var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
		var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.1 });
		var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });

		// Floor
		var floorGeometry = new THREE.BoxGeometry(60, 0.5, 60);
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.y = -0.25;
		vaultGroup.add(floor);

		// Walls - thick steel walls
		var wallThickness = 2;
		var wallHeight = 15;

		// Front wall
		var frontWallGeometry = new THREE.BoxGeometry(60, wallHeight, wallThickness);
		var frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
		frontWall.position.z = 30;
		vaultGroup.add(frontWall);

		// Back wall
		var backWallGeometry = new THREE.BoxGeometry(60, wallHeight, wallThickness);
		var backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
		backWall.position.z = -30;
		vaultGroup.add(backWall);

		// Left wall
		var leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 60);
		var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
		leftWall.position.x = -30;
		vaultGroup.add(leftWall);

		// Right wall
		var rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 60);
		var rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
		rightWall.position.x = 30;
		vaultGroup.add(rightWall);

		// Ceiling
		var ceilingGeometry = new THREE.BoxGeometry(60, 0.5, 60);
		var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
		ceiling.position.y = 15.25;
		vaultGroup.add(ceiling);
	}

	function buildVaultDoor() {
		var doorGroup = new THREE.Group();
		doorGroup.position.z = 28;
		doorGroup.position.x = -8;
		vaultGroup.add(doorGroup);

		vaultDoor = doorGroup;

		// Door slab - heavy steel
		var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.95, roughness: 0.05 });
		var doorGeometry = new THREE.BoxGeometry(8, 12, 0.8);
		var door = new THREE.Mesh(doorGeometry, doorMaterial);
		doorGroup.add(door);

		// Combination lock dial
		var dialMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8, roughness: 0.3 });
		var dialGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
		var dial = new THREE.Mesh(dialGeometry, dialMaterial);
		dial.position.y = 0;
		dial.position.z = -0.5;
		dial.rotation.z = Math.PI / 2;
		doorGroup.add(dial);

		// Lock mechanism bolts - small boxes
		var boltMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.4 });
		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var boltGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
			var bolt = new THREE.Mesh(boltGeometry, boltMaterial);
			bolt.position.x = Math.cos(angle) * 2;
			bolt.position.y = Math.sin(angle) * 2;
			bolt.position.z = -0.4;
			doorGroup.add(bolt);
		}

		// Handle
		var handleGeometry = new THREE.BoxGeometry(0.4, 2, 0.3);
		var handle = new THREE.Mesh(handleGeometry, boltMaterial);
		handle.position.y = -4;
		handle.position.z = -0.5;
		doorGroup.add(handle);
	}

	function buildWeaponRacks() {
		var rackMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 });
		var weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 });

		// Rack frame
		var rackGeometry = new THREE.BoxGeometry(0.4, 10, 0.4);
		var rack1 = new THREE.Mesh(rackGeometry, rackMaterial);
		rack1.position.set(-20, 5, -15);
		vaultGroup.add(rack1);

		var rack2 = new THREE.Mesh(rackGeometry, rackMaterial);
		rack2.position.set(-20, 5, 0);
		vaultGroup.add(rack2);

		var rack3 = new THREE.Mesh(rackGeometry, rackMaterial);
		rack3.position.set(-20, 5, 15);
		vaultGroup.add(rack3);

		// Horizontal bars holding weapons
		for (var r = 0; r < 3; r++) {
			var rackX = -20;
			var rackZ = -15 + (r * 15);
			for (var w = 0; w < 4; w++) {
				var barGeometry = new THREE.BoxGeometry(3, 0.25, 0.2);
				var bar = new THREE.Mesh(barGeometry, rackMaterial);
				bar.position.set(rackX, 2 + (w * 2.5), rackZ);
				vaultGroup.add(bar);

				// Rifle silhouettes
				var rifleGeometry = new THREE.BoxGeometry(2.5, 0.15, 0.1);
				var rifle = new THREE.Mesh(rifleGeometry, weaponMaterial);
				rifle.position.set(rackX + 1, 2 + (w * 2.5), rackZ);
				vaultGroup.add(rifle);
			}
		}
	}

	function buildGoldBars() {
		var goldMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 });

		// Stacked gold bars - pyramid formation
		for (var layer = 0; layer < 4; layer++) {
			for (var x = 0; x < (4 - layer); x++) {
				var barGeometry = new THREE.BoxGeometry(1.5, 0.5, 0.8);
				var bar = new THREE.Mesh(barGeometry, goldMaterial);
				bar.position.set(15 + (x * 1.6), 1 + (layer * 0.6), 10 + (layer * 0.3));
				vaultGroup.add(bar);
			}
		}
	}

	function buildCrateMountains() {
		var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.3, roughness: 0.8 });
		var steelBandMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.4 });

		// Mountains of crates at different positions
		var cratePositions = [
			{ x: 5, z: -20, baseCount: 3 },
			{ x: -5, z: 20, baseCount: 4 },
			{ x: 10, z: 5, baseCount: 2 },
			{ x: -15, z: -10, baseCount: 3 }
		];

		cratePositions.forEach(function(pos) {
			for (var layer = 0; layer < pos.baseCount; layer++) {
				for (var i = 0; i < (pos.baseCount - layer); i++) {
					var crateGeometry = new THREE.BoxGeometry(2.2, 2.2, 2.2);
					var crate = new THREE.Mesh(crateGeometry, crateMaterial);
					crate.position.set(
						pos.x + (i * 2.3),
						1.1 + (layer * 2.3),
						pos.z + (layer * 0.5)
					);
					vaultGroup.add(crate);

					// Steel bands
					var bandGeometry = new THREE.BoxGeometry(2.2, 0.15, 2.2);
					var band = new THREE.Mesh(bandGeometry, steelBandMaterial);
					band.position.copy(crate.position);
					band.position.y += 0.8;
					vaultGroup.add(band);
				}
			}
		});
	}

	function buildIntelligenceFileCases() {
		var fileMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.6 });
		var labelMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.2, roughness: 0.8 });

		// File case cabinets
		for (var cab = 0; cab < 3; cab++) {
			for (var drawer = 0; drawer < 5; drawer++) {
				var caseGeometry = new THREE.BoxGeometry(1.8, 0.8, 1.2);
				var fileCase = new THREE.Mesh(caseGeometry, fileMaterial);
				fileCase.position.set(
					25 - (cab * 5),
					2 + (drawer * 0.9),
					-18
				);
				vaultGroup.add(fileCase);

				// Yellow label
				var labelGeometry = new THREE.BoxGeometry(1.6, 0.1, 0.2);
				var label = new THREE.Mesh(labelGeometry, labelMaterial);
				label.position.copy(fileCase.position);
				label.position.z -= 0.7;
				vaultGroup.add(label);
			}
		}
	}

	function buildStolenElectronics() {
		var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x001a4d, metalness: 0.4, roughness: 0.7 });
		var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.5 });

		// Laptop/device stack
		for (var d = 0; d < 6; d++) {
			// Screen
			var screenGeometry = new THREE.BoxGeometry(1.4, 0.05, 1);
			var screen = new THREE.Mesh(screenGeometry, screenMaterial);
			screen.position.set(-22, 1 + (d * 0.3), 5);
			vaultGroup.add(screen);

			// Frame
			var frameGeometry = new THREE.BoxGeometry(1.5, 0.15, 1.1);
			var frame = new THREE.Mesh(frameGeometry, frameMaterial);
			frame.position.copy(screen.position);
			frame.position.y -= 0.1;
			vaultGroup.add(frame);
		}

		// Server/machinery box
		var serverGeometry = new THREE.BoxGeometry(3, 2, 1.5);
		var server = new THREE.Mesh(serverGeometry, frameMaterial);
		server.position.set(-20, 5, 8);
		vaultGroup.add(server);
	}

	function buildTrophyWall() {
		var trophyMaterial = new THREE.MeshStandardMaterial({ color: 0xaa8844, metalness: 0.8, roughness: 0.3 });
		var plateMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.7, roughness: 0.4 });

		// Wall-mounted trophy items
		for (var row = 0; row < 3; row++) {
			for (var col = 0; col < 5; col++) {
				var trophyGeometry = new THREE.BoxGeometry(1.2, 1, 0.6);
				var trophy = new THREE.Mesh(trophyGeometry, trophyMaterial);
				trophy.position.set(
					-25 + (col * 2.5),
					8 + (row * 2),
					25
				);
				vaultGroup.add(trophy);

				// Nameplate
				var plateGeometry = new THREE.BoxGeometry(1, 0.2, 0.05);
				var plate = new THREE.Mesh(plateGeometry, plateMaterial);
				plate.position.copy(trophy.position);
				plate.position.y -= 0.8;
				plate.position.z += 0.3;
				vaultGroup.add(plate);
			}
		}
	}

	function buildLaserTripwireGrid() {
		var laserMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });

		// Grid of laser tripwires
		for (var i = 0; i < 8; i++) {
			for (var j = 0; j < 6; j++) {
				var points = [
					new THREE.Vector3(-25 + (i * 7), 3, -20 + (j * 7)),
					new THREE.Vector3(-25 + (i * 7), 3, -20 + (j * 7) + 5)
				];
				var geometry = new THREE.BufferGeometry().setFromPoints(points);
				var line = new THREE.LineSegments(geometry, laserMaterial);
				vaultGroup.add(line);
				laserWires.push({
					mesh: line,
					points: points,
					baseX: -25 + (i * 7),
					baseZ: -20 + (j * 7)
				});
			}
		}
	}

	function buildMotionSensorPods() {
		var podMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.6, roughness: 0.4, emissive: 0x00aa00 });
		var mountMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });

		// Motion sensors scattered around
		var sensorPositions = [
			{ x: 0, z: -20 },
			{ x: 15, z: 10 },
			{ x: -18, z: 18 },
			{ x: 20, z: -10 },
			{ x: -10, z: 0 }
		];

		sensorPositions.forEach(function(pos) {
			// Sensor pod
			var sensorGeometry = new THREE.SphereGeometry(0.4, 16, 16);
			var sensor = new THREE.Mesh(sensorGeometry, podMaterial);
			sensor.position.set(pos.x, 8, pos.z);
			vaultGroup.add(sensor);

			// Mount bracket
			var mountGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
			var mount = new THREE.Mesh(mountGeometry, mountMaterial);
			mount.position.set(pos.x, 6, pos.z);
			vaultGroup.add(mount);
		});
	}

	function buildSecurityCameraArray() {
		var cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
		var lensMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95, roughness: 0.05 });

		// Ceiling-mounted cameras
		var cameraPositions = [
			{ x: -15, z: -15 },
			{ x: 15, z: -15 },
			{ x: -15, z: 15 },
			{ x: 15, z: 15 },
			{ x: 0, z: 0 }
		];

		cameraPositions.forEach(function(pos) {
			var cameraGroup = new THREE.Group();
			cameraGroup.position.set(pos.x, 14, pos.z);

			// Camera body
			var bodyGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.8);
			var body = new THREE.Mesh(bodyGeometry, cameraMaterial);
			cameraGroup.add(body);

			// Lens
			var lensGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
			var lens = new THREE.Mesh(lensGeometry, lensMaterial);
			lens.position.z = -0.45;
			lens.rotation.z = Math.PI / 2;
			cameraGroup.add(lens);

			// Mount bracket
			var bracketGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
			var bracket = new THREE.Mesh(bracketGeometry, cameraMaterial);
			bracket.position.y = -0.7;
			cameraGroup.add(bracket);

			vaultGroup.add(cameraGroup);
			securityCameras.push(cameraGroup);
		});
	}

	function buildGuardBooth() {
		var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 });
		var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x4466aa, metalness: 0.3, roughness: 0.8 });

		var boothGroup = new THREE.Group();
		boothGroup.position.set(-27, 0, -27);
		vaultGroup.add(boothGroup);

		// Booth walls
		var wallGeometry = new THREE.BoxGeometry(3, 4, 3);
		var wall = new THREE.Mesh(wallGeometry, boothMaterial);
		boothGroup.add(wall);

		// Window
		var windowGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
		var window = new THREE.Mesh(windowGeometry, windowMaterial);
		window.position.z = -1.55;
		boothGroup.add(window);

		// Control desk
		var deskGeometry = new THREE.BoxGeometry(2, 1, 1);
		var desk = new THREE.Mesh(deskGeometry, boothMaterial);
		desk.position.y = -1.5;
		boothGroup.add(desk);
	}

	function buildLoadingDock() {
		var rampMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.7 });
		var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.5 });

		var dockGroup = new THREE.Group();
		dockGroup.position.set(27, 0, 0);
		vaultGroup.add(dockGroup);

		// Ramp
		var rampGeometry = new THREE.BoxGeometry(3, 0.3, 8);
		var ramp = new THREE.Mesh(rampGeometry, rampMaterial);
		ramp.position.y = 0.5;
		ramp.rotation.z = 0.1;
		dockGroup.add(ramp);

		// Loading platform
		var platformGeometry = new THREE.BoxGeometry(4, 1, 4);
		var platform = new THREE.Mesh(platformGeometry, frameMaterial);
		platform.position.y = 1;
		dockGroup.add(platform);

		// Frame beams
		var beamGeometry = new THREE.BoxGeometry(0.4, 3, 0.4);
		var beam1 = new THREE.Mesh(beamGeometry, frameMaterial);
		beam1.position.set(-1.5, 1.5, -1.5);
		dockGroup.add(beam1);

		var beam2 = new THREE.Mesh(beamGeometry, frameMaterial);
		beam2.position.set(1.5, 1.5, 1.5);
		dockGroup.add(beam2);
	}

	function buildInventoryShelving() {
		var shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.4, roughness: 0.6 });

		// Industrial shelving units
		for (var s = 0; s < 2; s++) {
			var shelfGroup = new THREE.Group();
			shelfGroup.position.set(8 - (s * 18), 0, 20);
			vaultGroup.add(shelfGroup);

			// Vertical supports
			var supportGeometry = new THREE.BoxGeometry(0.3, 8, 0.3);
			var support1 = new THREE.Mesh(supportGeometry, shelfMaterial);
			support1.position.x = -2;
			shelfGroup.add(support1);

			var support2 = new THREE.Mesh(supportGeometry, shelfMaterial);
			support2.position.x = 2;
			shelfGroup.add(support2);

			// Shelves
			for (var sh = 0; sh < 5; sh++) {
				var shelfGeometry = new THREE.BoxGeometry(4, 0.2, 2);
				var shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
				shelf.position.y = 1 + (sh * 1.5);
				shelfGroup.add(shelf);
			}
		}
	}

	function buildEvidenceBags() {
		var bagMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.9 });

		// Evidence bags - lumpy spheres
		for (var bag = 0; bag < 12; bag++) {
			var bagGeometry = new THREE.SphereGeometry(0.5, 8, 8);
			var bagMesh = new THREE.Mesh(bagGeometry, bagMaterial);
			bagMesh.position.set(
				-10 + (bag % 4) * 1.5,
				1 + Math.floor(bag / 4) * 1.2,
				-25 + (Math.random() * 2)
			);
			vaultGroup.add(bagMesh);
		}
	}

	function buildJewelryDisplayCases() {
		var caseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.3 });
		var glassMaterial = new THREE.MeshStandardMaterial({ color: 0xccccff, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.6 });

		// Display cases with glass tops
		for (var c = 0; c < 4; c++) {
			var caseGroup = new THREE.Group();
			caseGroup.position.set(5 + (c * 4), 0, -22);
			vaultGroup.add(caseGroup);

			// Case body
			var bodyGeometry = new THREE.BoxGeometry(2.5, 1.5, 2);
			var body = new THREE.Mesh(bodyGeometry, caseMaterial);
			caseGroup.add(body);

			// Glass top
			var glassGeometry = new THREE.BoxGeometry(2.5, 0.1, 2);
			var glass = new THREE.Mesh(glassGeometry, glassMaterial);
			glass.position.y = 0.8;
			caseGroup.add(glass);

			// Interior items (small cubes)
			for (var i = 0; i < 3; i++) {
				var itemGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
				var itemMaterial = new THREE.MeshStandardMaterial({ color: 0xffdd00, metalness: 0.95, roughness: 0.1 });
				var item = new THREE.Mesh(itemGeometry, itemMaterial);
				item.position.set(-0.6 + (i * 0.5), 0.2, 0);
				caseGroup.add(item);
			}
		}
	}

	function update(delta) {
		if (!vaultGroup) return;

		// Animate laser tripwire sweep
		laserSweepAngle += delta * 0.5;
		laserWires.forEach(function(wire) {
			var sweep = Math.sin(laserSweepAngle) * 2;
			wire.mesh.geometry.attributes.position.array[3] = wire.baseZ + sweep;
			wire.mesh.geometry.attributes.position.needsUpdate = true;
		});

		// Animate security camera pan
		securityCameras.forEach(function(camera, index) {
			camera.rotation.y = Math.sin(laserSweepAngle + index) * 0.4;
			camera.rotation.z = Math.cos(laserSweepAngle * 0.5 + index) * 0.3;
		});

		// Vault door slow rotation teaser
		if (vaultDoor) {
			vaultDoor.rotation.y = Math.sin(laserSweepAngle * 0.3) * 0.15;
		}
	}

	function reset() {
		laserSweepAngle = 0;
		laserWires.forEach(function(wire) {
			wire.mesh.geometry.attributes.position.needsUpdate = false;
		});
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
