window.DroneBay = (function() {
	'use strict';

	var scene;
	var camera;
	var patrolDrones = [];
	var assemblyConveyors = [];
	var launchTubes = [];
	var empArcs = [];
	var airlockDoors = [];
	var time = 0;

	var init = function(sceneArg, cameraArg) {
		scene = sceneArg;
		camera = cameraArg;

		// Assembly line area with conveyor belts and drone assembly stations
		createAssemblyLines();

		// Charging rack walls with energy cells
		createChargingRacks();

		// Launch tube array
		createLaunchTubes();

		// Active patrol drones flying overhead
		createPatrolDrones();

		// Control console center
		createControlConsole();

		// Storage shelving area
		createStorageArea();

		// Testing range with target dummies
		createTestingRange();

		// Crash recovery bay
		createCrashBay();

		// EMP shield generators at corners
		createEMPShields();

		// Airlock doors at facility exits
		createAirlockDoors();

		// Ground and floor
		createFloor();

		// Walls and structure
		createWalls();

		// Lighting
		createLighting();
	};

	var createAssemblyLines = function() {
		var lineY = 0.5;
		var lineCount = 3;
		var lineSpacing = 8;
		var startX = -20;
		var lineLength = 40;

		for (var i = 0; i < lineCount; i++) {
			var zPos = startX + (i * lineSpacing);

			// Conveyor belt
			var beltGeom = new THREE.BoxGeometry(lineLength, 0.3, 2);
			var beltMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
			var belt = new THREE.Mesh(beltGeom, beltMat);
			belt.position.set(0, lineY, zPos);
			scene.add(belt);

			// Conveyor supports
			var supportGeom = new THREE.BoxGeometry(0.5, lineY, 2.5);
			var supportMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
			for (var j = -1; j <= 1; j++) {
				var support = new THREE.Mesh(supportGeom, supportMat);
				support.position.set(startX + (j * 15), lineY * 0.5, zPos);
				scene.add(support);
			}

			// Drone bodies at assembly stages
			var droneSpacing = 4;
			for (var k = 0; k < 3; k++) {
				var droneX = startX + 10 + (k * droneSpacing);
				createPartialDrone(droneX, lineY + 1, zPos, k);
			}

			assemblyConveyors.push({
				belt: belt,
				offset: 0,
				speed: 0.3
			});
		}
	};

	var createPartialDrone = function(x, y, z, stage) {
		// Drone body (BoxGeometry)
		var bodyGeom = new THREE.BoxGeometry(1.5, 1, 2);
		var bodyMat = new THREE.MeshStandardMaterial({
			color: 0xff6600 + (stage * 0x110000),
			metalness: 0.8
		});
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.set(x, y, z);
		scene.add(body);

		// Rotor arms (stage dependent)
		if (stage >= 1) {
			for (var i = -1; i <= 1; i += 2) {
				var armGeom = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
				var armMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
				var arm = new THREE.Mesh(armGeom, armMat);
				arm.position.set(x + (i * 0.8), y + 0.5, z);
				arm.rotation.z = Math.PI * 0.5;
				scene.add(arm);
			}
		}

		// Camera nose (stage dependent)
		if (stage >= 2) {
			var cameraGeom = new THREE.ConeGeometry(0.3, 0.6, 8);
			var cameraMat = new THREE.MeshStandardMaterial({ color: 0x0088ff });
			var camera = new THREE.Mesh(cameraGeom, cameraMat);
			camera.position.set(x, y + 0.3, z + 1.2);
			camera.rotation.x = Math.PI * 0.5;
			scene.add(camera);
		}
	};

	var createChargingRacks = function() {
		var rackX = 25;
		var rackHeight = 10;
		var rackWidth = 12;
		var cellRadius = 0.4;

		// Rack structure
		var rackGeom = new THREE.BoxGeometry(rackWidth, rackHeight, 3);
		var rackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 });
		var rack = new THREE.Mesh(rackGeom, rackMat);
		rack.position.set(rackX, rackHeight * 0.5, 0);
		scene.add(rack);

		// Energy cells (SphereGeometry)
		var cellsPerRow = 4;
		var cellsPerColumn = 5;
		var cellSpacingX = rackWidth / (cellsPerRow + 1);
		var cellSpacingY = rackHeight / (cellsPerColumn + 1);

		for (var y = 0; y < cellsPerColumn; y++) {
			for (var x = 0; x < cellsPerRow; x++) {
				var cellGeom = new THREE.SphereGeometry(cellRadius, 8, 8);
				var cellMat = new THREE.MeshStandardMaterial({
					color: 0x00ff00,
					emissive: 0x00aa00
				});
				var cell = new THREE.Mesh(cellGeom, cellMat);
				cell.position.set(
					rackX - rackWidth * 0.5 + cellSpacingX * (x + 1),
					cellSpacingY * (y + 1),
					0
				);
				scene.add(cell);
			}
		}

		// Second rack on other side
		var rack2 = rack.clone();
		rack2.position.x = -rackX;
		scene.add(rack2);

		for (var y = 0; y < cellsPerColumn; y++) {
			for (var x = 0; x < cellsPerRow; x++) {
				var cellGeom = new THREE.SphereGeometry(cellRadius, 8, 8);
				var cellMat = new THREE.MeshStandardMaterial({
					color: 0xff0066,
					emissive: 0xaa0033
				});
				var cell = new THREE.Mesh(cellGeom, cellMat);
				cell.position.set(
					-rackX + rackWidth * 0.5 - cellSpacingX * (x + 1),
					cellSpacingY * (y + 1),
					0
				);
				scene.add(cell);
			}
		}
	};

	var createLaunchTubes = function() {
		var tubeRadius = 1.2;
		var tubeHeight = 20;
		var tubesPerSide = 4;
		var spacing = 3;
		var centerZ = -15;

		for (var i = 0; i < tubesPerSide; i++) {
			var xPos = -spacing * 1.5 + (i * spacing);

			// Tube
			var tubeGeom = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 8);
			var tubeMat = new THREE.MeshStandardMaterial({
				color: 0x333333,
				metalness: 0.9,
				roughness: 0.1
			});
			var tube = new THREE.Mesh(tubeGeom, tubeMat);
			tube.position.set(xPos, tubeHeight * 0.5, centerZ);
			scene.add(tube);

			// Launch glow base (emissive cylinder)
			var glowGeom = new THREE.CylinderGeometry(tubeRadius, tubeRadius, 2, 8);
			var glowMat = new THREE.MeshStandardMaterial({
				color: 0x0088ff,
				emissive: 0x0066ff
			});
			var glow = new THREE.Mesh(glowGeom, glowMat);
			glow.position.set(xPos, 1, centerZ);
			scene.add(glow);

			launchTubes.push(glow);
		}
	};

	var createPatrolDrones = function() {
		var droneCount = 6;
		var radius = 15;
		var height = 12;

		for (var i = 0; i < droneCount; i++) {
			var angle = (i / droneCount) * Math.PI * 2;

			// Create drone group
			var droneGroup = new THREE.Group();

			// Body
			var bodyGeom = new THREE.BoxGeometry(2, 1.5, 3);
			var bodyMat = new THREE.MeshStandardMaterial({
				color: 0xff3300,
				metalness: 0.8
			});
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			droneGroup.add(body);

			// Rotor arms
			for (var j = -1; j <= 1; j += 2) {
				var armGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
				var armMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
				var arm = new THREE.Mesh(armGeom, armMat);
				arm.position.set(j * 1.2, 0.5, 0);
				arm.rotation.z = Math.PI * 0.5;
				droneGroup.add(arm);

				// Spinning rotors
				var rotorGeom = new THREE.SphereGeometry(0.25, 8, 8);
				var rotorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
				var rotor = new THREE.Mesh(rotorGeom, rotorMat);
				rotor.position.set(j * 1.5, 0.5, 0);
				droneGroup.add(rotor);
			}

			// Camera
			var cameraGeom = new THREE.ConeGeometry(0.4, 0.8, 8);
			var cameraMat = new THREE.MeshStandardMaterial({ color: 0x0099ff });
			var camera = new THREE.Mesh(cameraGeom, cameraMat);
			camera.position.set(0, -0.3, 1.8);
			camera.rotation.x = Math.PI * 0.5;
			droneGroup.add(camera);

			droneGroup.position.set(
				Math.cos(angle) * radius,
				height,
				Math.sin(angle) * radius
			);

			scene.add(droneGroup);

			patrolDrones.push({
				group: droneGroup,
				angle: angle,
				radius: radius,
				height: height,
				speed: 0.3 + (i * 0.05)
			});
		}
	};

	var createControlConsole = function() {
		// Central island
		var islandGeom = new THREE.BoxGeometry(8, 2, 6);
		var islandMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
		var island = new THREE.Mesh(islandGeom, islandMat);
		island.position.set(0, 1, 10);
		scene.add(island);

		// Console screens
		var screenGeom = new THREE.BoxGeometry(3, 2, 0.2);
		var screenMat = new THREE.MeshStandardMaterial({
			color: 0x001111,
			emissive: 0x00aa00
		});

		for (var i = 0; i < 3; i++) {
			var screen = new THREE.Mesh(screenGeom, screenMat);
			screen.position.set(
				-3 + (i * 3),
				3.5,
				10
			);
			scene.add(screen);
		}

		// Control panels on sides
		var panelGeom = new THREE.BoxGeometry(2, 2, 0.3);
		var panelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });

		var leftPanel = new THREE.Mesh(panelGeom, panelMat);
		leftPanel.position.set(-4.5, 2.5, 10);
		leftPanel.rotation.y = Math.PI * 0.25;
		scene.add(leftPanel);

		var rightPanel = new THREE.Mesh(panelGeom, panelMat);
		rightPanel.position.set(4.5, 2.5, 10);
		rightPanel.rotation.y = -Math.PI * 0.25;
		scene.add(rightPanel);

		// Joystick control
		var stickBaseGeom = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8);
		var stickBaseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
		var stickBase = new THREE.Mesh(stickBaseGeom, stickBaseMat);
		stickBase.position.set(0, 2.5, 8);
		scene.add(stickBase);

		var stickGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
		var stickMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
		var stick = new THREE.Mesh(stickGeom, stickMat);
		stick.position.set(0, 3.2, 8);
		scene.add(stick);
	};

	var createStorageArea = function() {
		var shelfX = -20;
		var shelfY = 8;
		var shelfZ = 15;
		var shelfWidth = 15;
		var shelfHeight = 3;

		// Shelving structure
		var backGeom = new THREE.BoxGeometry(shelfWidth, shelfHeight, 1);
		var backMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
		var back = new THREE.Mesh(backGeom, backMat);
		back.position.set(shelfX, shelfY, shelfZ);
		scene.add(back);

		// Component boxes on shelves
		var boxSize = 1;
		var boxSpacingX = 2;
		var boxSpacingY = 1.5;

		for (var y = 0; y < 2; y++) {
			for (var x = 0; x < 5; x++) {
				var boxGeom = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
				var boxMat = new THREE.MeshStandardMaterial({
					color: 0xff6600 + (Math.random() * 0x330000 | 0)
				});
				var box = new THREE.Mesh(boxGeom, boxMat);
				box.position.set(
					shelfX - shelfWidth * 0.25 + (x * boxSpacingX),
					1 + y * boxSpacingY,
					shelfZ
				);
				scene.add(box);
			}
		}

		// Drone frames
		for (var i = 0; i < 3; i++) {
			createPartialDrone(
				shelfX + 5,
				2.5 + (i * 2),
				shelfZ,
				0
			);
		}
	};

	var createTestingRange = function() {
		var rangeX = 20;
		var rangeZ = 15;
		var rangeLength = 20;
		var rangeWidth = 15;

		// Open floor area with grid markings
		var floorGeom = new THREE.BoxGeometry(rangeLength, 0.1, rangeWidth);
		var floorMat = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.3
		});
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.set(rangeX, 0.05, rangeZ);
		scene.add(floor);

		// Target dummies on poles
		var targetCount = 6;
		var targetSpacing = 4;

		for (var i = 0; i < targetCount; i++) {
			var targetZ = rangeZ - 6 + (i * targetSpacing);

			// Pole
			var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
			var poleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
			var pole = new THREE.Mesh(poleGeom, poleMat);
			pole.position.set(rangeX, 1.5, targetZ);
			scene.add(pole);

			// Target dummy (BoxGeometry torso + head)
			var torsoGeom = new THREE.BoxGeometry(1, 1.5, 0.5);
			var torsoMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
			var torso = new THREE.Mesh(torsoGeom, torsoMat);
			torso.position.set(rangeX, 2.5, targetZ);
			scene.add(torso);

			var headGeom = new THREE.BoxGeometry(0.5, 0.6, 0.5);
			var headMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
			var head = new THREE.Mesh(headGeom, headMat);
			head.position.set(rangeX, 3.5, targetZ);
			scene.add(head);
		}
	};

	var createCrashBay = function() {
		var bayX = -30;
		var bayZ = -15;

		// Bay floor area
		var bayFloorGeom = new THREE.BoxGeometry(12, 0.2, 10);
		var bayFloorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
		var bayFloor = new THREE.Mesh(bayFloorGeom, bayFloorMat);
		bayFloor.position.set(bayX, 0.1, bayZ);
		scene.add(bayFloor);

		// Damaged drone parts scattered
		for (var i = 0; i < 5; i++) {
			var partGeom = new THREE.BoxGeometry(1.5, 0.8, 1);
			var partMat = new THREE.MeshStandardMaterial({
				color: 0x663300,
				metalness: 0.4
			});
			var part = new THREE.Mesh(partGeom, partMat);
			part.position.set(
				bayX - 4 + (Math.random() * 6),
				0.5,
				bayZ - 3 + (Math.random() * 4)
			);
			part.rotation.set(
				Math.random() * Math.PI * 0.5,
				Math.random() * Math.PI,
				Math.random() * Math.PI * 0.3
			);
			scene.add(part);
		}

		// Repair equipment (tall cylindrical equipment)
		var equipGeom = new THREE.CylinderGeometry(0.5, 0.6, 3, 8);
		var equipMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
		var equip = new THREE.Mesh(equipGeom, equipMat);
		equip.position.set(bayX + 3, 1.5, bayZ);
		scene.add(equip);
	};

	var createEMPShields = function() {
		var corners = [
			{ x: 35, z: 35 },
			{ x: -35, z: 35 },
			{ x: 35, z: -35 },
			{ x: -35, z: -35 }
		];

		for (var c = 0; c < corners.length; c++) {
			var corner = corners[c];

			// Cylindrical pylon
			var pylonGeom = new THREE.CylinderGeometry(1, 1.5, 10, 8);
			var pylonMat = new THREE.MeshStandardMaterial({
				color: 0x0066ff,
				emissive: 0x003399,
				metalness: 0.8
			});
			var pylon = new THREE.Mesh(pylonGeom, pylonMat);
			pylon.position.set(corner.x, 5, corner.z);
			scene.add(pylon);

			// EMP arc effect (LineSegments)
			var arcPoints = [];
			var arcSegments = 12;
			var arcHeight = 8;

			for (var i = 0; i <= arcSegments; i++) {
				var t = i / arcSegments;
				var x = corner.x + Math.sin(t * Math.PI) * 6;
				var y = 3 + (t * arcHeight);
				var z = corner.z;
				arcPoints.push(new THREE.Vector3(x, y, z));
			}

			var arcGeom = new THREE.BufferGeometry().setFromPoints(arcPoints);
			var arcMat = new THREE.LineBasicMaterial({
				color: 0x00ffff,
				linewidth: 2
			});
			var arcLine = new THREE.LineSegments(arcGeom, arcMat);
			scene.add(arcLine);

			empArcs.push({
				line: arcLine,
				pulsePhase: (c * Math.PI * 0.5)
			});
		}
	};

	var createAirlockDoors = function() {
		var doorPositions = [
			{ x: 30, z: 25, dir: 0 },
			{ x: -30, z: 25, dir: 1 }
		];

		for (var i = 0; i < doorPositions.length; i++) {
			var pos = doorPositions[i];
			var isRight = pos.dir === 1;

			// Door frame
			var frameGeom = new THREE.BoxGeometry(3, 4, 0.3);
			var frameMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
			var frame = new THREE.Mesh(frameGeom, frameMat);
			frame.position.set(pos.x, 2, pos.z);
			scene.add(frame);

			// Sliding door panel
			var panelGeom = new THREE.BoxGeometry(3, 4, 0.2);
			var panelMat = new THREE.MeshStandardMaterial({
				color: 0x444444,
				metalness: 0.7
			});
			var panel = new THREE.Mesh(panelGeom, panelMat);
			panel.position.set(pos.x, 2, pos.z);
			scene.add(panel);

			airlockDoors.push({
				panel: panel,
				baseZ: pos.z,
				isOpen: false,
				openSpeed: 1.5,
				maxOpen: 2
			});
		}
	};

	var createFloor = function() {
		var floorGeom = new THREE.BoxGeometry(80, 0.5, 80);
		var floorMat = new THREE.MeshStandardMaterial({
			color: 0x2a2a2a,
			metalness: 0.2,
			roughness: 0.8
		});
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.set(0, -0.25, 0);
		scene.add(floor);
	};

	var createWalls = function() {
		var wallHeight = 15;
		var wallThickness = 1;
		var extent = 40;

		// Back wall
		var backGeom = new THREE.BoxGeometry(100, wallHeight, wallThickness);
		var wallMat = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.3
		});
		var backWall = new THREE.Mesh(backGeom, wallMat);
		backWall.position.set(0, wallHeight * 0.5, -extent);
		scene.add(backWall);

		// Front wall
		var frontWall = new THREE.Mesh(backGeom, wallMat);
		frontWall.position.set(0, wallHeight * 0.5, extent);
		scene.add(frontWall);

		// Side walls
		var sideGeom = new THREE.BoxGeometry(wallThickness, wallHeight, 100);

		var leftWall = new THREE.Mesh(sideGeom, wallMat);
		leftWall.position.set(-extent, wallHeight * 0.5, 0);
		scene.add(leftWall);

		var rightWall = new THREE.Mesh(sideGeom, wallMat);
		rightWall.position.set(extent, wallHeight * 0.5, 0);
		scene.add(rightWall);
	};

	var createLighting = function() {
		// Ambient light
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		// Directional light (sun-like)
		var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
		dirLight.position.set(20, 25, 20);
		dirLight.castShadow = true;
		scene.add(dirLight);

		// Point lights near control console
		var consoleLight = new THREE.PointLight(0x00ff00, 1, 20);
		consoleLight.position.set(0, 4, 10);
		scene.add(consoleLight);

		// Blue glow from launch tubes
		var launchLight = new THREE.PointLight(0x0088ff, 0.8, 25);
		launchLight.position.set(0, 3, -15);
		scene.add(launchLight);
	};

	var update = function(delta) {
		time += delta;

		// Update patrol drones
		for (var i = 0; i < patrolDrones.length; i++) {
			var drone = patrolDrones[i];
			drone.angle += drone.speed * delta * 0.5;
			drone.group.position.x = Math.cos(drone.angle) * drone.radius;
			drone.group.position.z = Math.sin(drone.angle) * drone.radius;
			drone.group.rotation.z += delta * 2;
		}

		// Update assembly conveyor movement
		for (var i = 0; i < assemblyConveyors.length; i++) {
			var conveyor = assemblyConveyors[i];
			conveyor.offset += conveyor.speed * delta;
			if (conveyor.offset > 1) {
				conveyor.offset -= 1;
			}
		}

		// Update launch tube glow
		for (var i = 0; i < launchTubes.length; i++) {
			var tube = launchTubes[i];
			var glow = 0.5 + Math.sin(time * 3 + i) * 0.3;
			tube.material.emissiveIntensity = glow;
		}

		// Update EMP arc pulses
		for (var i = 0; i < empArcs.length; i++) {
			var emp = empArcs[i];
			var pulse = Math.sin(time * 2 + emp.pulsePhase) * 0.5 + 0.5;
			emp.line.material.opacity = pulse;
		}

		// Update airlock doors (animated open/close)
		for (var i = 0; i < airlockDoors.length; i++) {
			var door = airlockDoors[i];
			var targetOpen = (time * 0.5) % 2 < 1;

			if (targetOpen && !door.isOpen) {
				door.isOpen = true;
			} else if (!targetOpen && door.isOpen) {
				door.isOpen = false;
			}

			var currentZ = door.panel.position.z;
			var targetZ = door.baseZ + (door.isOpen ? door.maxOpen : 0);
			var diff = targetZ - currentZ;

			if (Math.abs(diff) > 0.01) {
				door.panel.position.z += diff * Math.min(door.openSpeed * delta, 1);
			}
		}
	};

	var reset = function() {
		time = 0;
		for (var i = 0; i < patrolDrones.length; i++) {
			patrolDrones[i].angle = (i / patrolDrones.length) * Math.PI * 2;
		}
		for (var i = 0; i < airlockDoors.length; i++) {
			airlockDoors[i].isOpen = false;
			airlockDoors[i].panel.position.z = airlockDoors[i].baseZ;
		}
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
