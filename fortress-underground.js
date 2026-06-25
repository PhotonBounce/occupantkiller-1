window.FortressUnderground = (function() {
	'use strict';

	var scene, camera;
	var surfaceGroup, undergroundGroup;
	var trapdoors = [];
	var emergencyLights = [];
	var ventilationFan;
	var waterPuddles = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		surfaceGroup = new THREE.Group();
		undergroundGroup = new THREE.Group();
		scene.add(surfaceGroup);
		scene.add(undergroundGroup);

		buildSurfaceFortress();
		buildUndergroundNetwork();

		return true;
	}

	function buildSurfaceFortress() {
		var groundMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
		var stoneMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var woodMat = new THREE.MeshStandardMaterial({ color: 0x654321 });

		// Ground plane
		var groundGeom = new THREE.BoxGeometry(200, 1, 200);
		var ground = new THREE.Mesh(groundGeom, groundMat);
		ground.position.y = -0.5;
		ground.receiveShadow = true;
		surfaceGroup.add(ground);

		// Outer fortress walls
		var wallThickness = 2;
		var wallHeight = 15;
		var fortressSize = 80;

		// North wall
		var northWallGeom = new THREE.BoxGeometry(fortressSize + 4, wallHeight, wallThickness);
		var northWall = new THREE.Mesh(northWallGeom, stoneMat);
		northWall.position.z = -(fortressSize / 2);
		northWall.position.y = wallHeight / 2;
		northWall.castShadow = true;
		surfaceGroup.add(northWall);

		// South wall
		var southWallGeom = new THREE.BoxGeometry(fortressSize + 4, wallHeight, wallThickness);
		var southWall = new THREE.Mesh(southWallGeom, stoneMat);
		southWall.position.z = fortressSize / 2;
		southWall.position.y = wallHeight / 2;
		southWall.castShadow = true;
		surfaceGroup.add(southWall);

		// East wall
		var eastWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, fortressSize);
		var eastWall = new THREE.Mesh(eastWallGeom, stoneMat);
		eastWall.position.x = fortressSize / 2;
		eastWall.position.y = wallHeight / 2;
		eastWall.castShadow = true;
		surfaceGroup.add(eastWall);

		// West wall
		var westWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, fortressSize);
		var westWall = new THREE.Mesh(westWallGeom, stoneMat);
		westWall.position.x = -(fortressSize / 2);
		westWall.position.y = wallHeight / 2;
		westWall.castShadow = true;
		surfaceGroup.add(westWall);

		// Corner towers
		var towerRadius = 4;
		var towerHeight = 20;
		var towerMat = new THREE.MeshStandardMaterial({ color: 0x505050 });

		var corners = [
			{ x: fortressSize / 2 - 2, z: fortressSize / 2 - 2 },
			{ x: -(fortressSize / 2 - 2), z: fortressSize / 2 - 2 },
			{ x: fortressSize / 2 - 2, z: -(fortressSize / 2 - 2) },
			{ x: -(fortressSize / 2 - 2), z: -(fortressSize / 2 - 2) }
		];

		for (var i = 0; i < corners.length; i++) {
			var towerGeom = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 8);
			var tower = new THREE.Mesh(towerGeom, towerMat);
			tower.position.set(corners[i].x, towerHeight / 2, corners[i].z);
			tower.castShadow = true;
			surfaceGroup.add(tower);
		}

		// Gate opening
		var gateWidth = 15;
		var gateHeight = 12;
		var gateGeom = new THREE.BoxGeometry(gateWidth, gateHeight, wallThickness);
		var gate = new THREE.Mesh(gateGeom, woodMat);
		gate.position.set(0, gateHeight / 2, -(fortressSize / 2));
		gate.castShadow = true;
		surfaceGroup.add(gate);

		// Inner courtyard
		var courtyardSize = 60;
		var courtGeom = new THREE.BoxGeometry(courtyardSize, 0.5, courtyardSize);
		var courtMat = new THREE.MeshStandardMaterial({ color: 0xA0826D });
		var court = new THREE.Mesh(courtGeom, courtMat);
		court.position.y = 0.25;
		court.receiveShadow = true;
		surfaceGroup.add(court);

		// Trapdoors in courtyard floor
		createTrapdoors(courtyardSize);

		// Small buildings inside fortress
		var barracksGeom = new THREE.BoxGeometry(20, 10, 15);
		var barracksMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
		var barracks = new THREE.Mesh(barracksGeom, barracksMat);
		barracks.position.set(-20, 5, 0);
		barracks.castShadow = true;
		surfaceGroup.add(barracks);

		var armoryGeom = new THREE.BoxGeometry(15, 10, 20);
		var armory = new THREE.Mesh(armoryGeom, barracksMat);
		armory.position.set(25, 5, -15);
		armory.castShadow = true;
		surfaceGroup.add(armory);
	}

	function createTrapdoors(courtyardSize) {
		var trapdoorSize = 5;
		var trapMat = new THREE.MeshStandardMaterial({ color: 0x654321 });

		// Create 4 trapdoors in pattern
		var trapdoorPositions = [
			{ x: -15, z: -10 },
			{ x: 15, z: -10 },
			{ x: -15, z: 10 },
			{ x: 15, z: 10 }
		];

		for (var i = 0; i < trapdoorPositions.length; i++) {
			var trapGeom = new THREE.BoxGeometry(trapdoorSize, 0.4, trapdoorSize);
			var trap = new THREE.Mesh(trapGeom, trapMat);
			trap.position.set(trapdoorPositions[i].x, 0.5, trapdoorPositions[i].z);
			trap.castShadow = true;
			surfaceGroup.add(trap);

			trapdoors.push({
				mesh: trap,
				baseY: 0.5,
				angle: 0,
				opening: false,
				targetAngle: 0,
				axis: trapdoorPositions[i].x > 0 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0)
			});
		}
	}

	function buildUndergroundNetwork() {
		var corridorWidth = 8;
		var corridorHeight = 6;
		var wallMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
		var floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
		var platformMat = new THREE.MeshStandardMaterial({ color: 0x404040 });

		// Underground floor across all tunnels
		var underFloorGeom = new THREE.BoxGeometry(300, 0.5, 300);
		var underFloor = new THREE.Mesh(underFloorGeom, floorMat);
		underFloor.position.y = -15;
		underFloor.receiveShadow = true;
		undergroundGroup.add(underFloor);

		// Main north tunnel
		buildTunnel(0, -12, corridorWidth, corridorHeight, 40, 'z', wallMat, platformMat);

		// Main south tunnel
		buildTunnel(0, -12, corridorWidth, corridorHeight, 40, 'z', wallMat, platformMat, true);

		// Main east tunnel
		buildTunnel(-12, 0, corridorHeight, corridorWidth, 40, 'x', wallMat, platformMat);

		// Main west tunnel
		buildTunnel(12, 0, corridorHeight, corridorWidth, 40, 'x', wallMat, platformMat, true);

		// Support pillars
		buildPillars(corridorWidth, corridorHeight);

		// Water seepage
		createWaterPuddles();

		// Emergency lighting
		createEmergencyLights(corridorHeight);

		// Tunnel intersection chamber
		buildIntersectionChamber(corridorWidth, corridorHeight, wallMat);

		// Ammunition depot
		buildAmmunitionDepot(wallMat);

		// Command bunker
		buildCommandBunker(wallMat);

		// Escape tunnel
		buildEscapeTunnel(corridorWidth, corridorHeight, wallMat);

		// Hidden arms cache
		buildArmsCache(wallMat);

		// Ventilation fan
		createVentilationFan();
	}

	function buildTunnel(offsetX, offsetY, width, height, length, direction, wallMat, floorMat, reverse) {
		var sign = reverse ? -1 : 1;

		// Tunnel walls and ceiling
		var wallThickness = 0.5;

		// North/south walls for horizontal tunnel or east/west walls for vertical
		if (direction === 'z') {
			// Left wall
			var leftWallGeom = new THREE.BoxGeometry(wallThickness, height, length);
			var leftWall = new THREE.Mesh(leftWallGeom, wallMat);
			leftWall.position.set(offsetX - width / 2, offsetY - (height / 2 + 1), 0);
			leftWall.castShadow = true;
			undergroundGroup.add(leftWall);

			// Right wall
			var rightWallGeom = new THREE.BoxGeometry(wallThickness, height, length);
			var rightWall = new THREE.Mesh(rightWallGeom, wallMat);
			rightWall.position.set(offsetX + width / 2, offsetY - (height / 2 + 1), 0);
			rightWall.castShadow = true;
			undergroundGroup.add(rightWall);

			// Ceiling
			var ceilGeom = new THREE.BoxGeometry(width, wallThickness, length);
			var ceil = new THREE.Mesh(ceilGeom, wallMat);
			ceil.position.set(offsetX, offsetY - height + 0.25, 0);
			ceil.castShadow = true;
			undergroundGroup.add(ceil);
		} else {
			// Front/back walls for vertical tunnel
			var frontWallGeom = new THREE.BoxGeometry(length, height, wallThickness);
			var frontWall = new THREE.Mesh(frontWallGeom, wallMat);
			frontWall.position.set(0, offsetY - (height / 2 + 1), offsetX - width / 2);
			frontWall.castShadow = true;
			undergroundGroup.add(frontWall);

			// Back wall
			var backWallGeom = new THREE.BoxGeometry(length, height, wallThickness);
			var backWall = new THREE.Mesh(backWallGeom, wallMat);
			backWall.position.set(0, offsetY - (height / 2 + 1), offsetX + width / 2);
			backWall.castShadow = true;
			undergroundGroup.add(backWall);

			// Ceiling
			var ceilGeom2 = new THREE.BoxGeometry(length, wallThickness, width);
			var ceil2 = new THREE.Mesh(ceilGeom2, wallMat);
			ceil2.position.set(0, offsetY - height + 0.25, offsetX);
			ceil2.castShadow = true;
			undergroundGroup.add(ceil2);
		}
	}

	function buildPillars(corridorWidth, corridorHeight) {
		var pillarMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
		var pillarRadius = 0.8;

		// Pillars along main corridors
		var pillarPositions = [
			{ x: -corridorWidth / 2 + 2, z: -20 },
			{ x: corridorWidth / 2 - 2, z: -20 },
			{ x: -corridorWidth / 2 + 2, z: 20 },
			{ x: corridorWidth / 2 - 2, z: 20 },
			{ x: -20, z: -corridorWidth / 2 + 2 },
			{ x: -20, z: corridorWidth / 2 - 2 },
			{ x: 20, z: -corridorWidth / 2 + 2 },
			{ x: 20, z: corridorWidth / 2 - 2 }
		];

		for (var i = 0; i < pillarPositions.length; i++) {
			var pillarGeom = new THREE.CylinderGeometry(pillarRadius, pillarRadius, corridorHeight, 6);
			var pillar = new THREE.Mesh(pillarGeom, pillarMat);
			pillar.position.set(pillarPositions[i].x, -12 - corridorHeight / 2, pillarPositions[i].z);
			pillar.castShadow = true;
			undergroundGroup.add(pillar);
		}
	}

	function createWaterPuddles() {
		var puddleMat = new THREE.MeshStandardMaterial({
			color: 0x1a5f7a,
			transparent: true,
			opacity: 0.6,
			roughness: 0.1
		});

		var puddlePositions = [
			{ x: -6, z: -15 },
			{ x: 6, z: 10 },
			{ x: -20, z: -5 },
			{ x: 20, z: 5 },
			{ x: 0, z: -25 }
		];

		for (var i = 0; i < puddlePositions.length; i++) {
			var puddleGeom = new THREE.BoxGeometry(2.5, 0.1, 2.5);
			var puddle = new THREE.Mesh(puddleGeom, puddleMat);
			puddle.position.set(puddlePositions[i].x, -14.95, puddlePositions[i].z);
			puddle.receiveShadow = true;
			undergroundGroup.add(puddle);

			waterPuddles.push({
				mesh: puddle,
				wave: 0
			});
		}
	}

	function createEmergencyLights(corridorHeight) {
		var lightGeom = new THREE.SphereGeometry(0.4, 8, 8);
		var lightMat = new THREE.MeshStandardMaterial({
			color: 0xFF4444,
			emissive: 0xFF4444,
			emissiveIntensity: 0.8
		});

		var lightPositions = [
			{ x: -6, z: -25 },
			{ x: 6, z: -25 },
			{ x: -6, z: -10 },
			{ x: 6, z: -10 },
			{ x: -6, z: 5 },
			{ x: 6, z: 5 },
			{ x: -6, z: 25 },
			{ x: 6, z: 25 },
			{ x: -25, z: -6 },
			{ x: -25, z: 6 },
			{ x: -10, z: -6 },
			{ x: -10, z: 6 },
			{ x: 5, z: -6 },
			{ x: 5, z: 6 },
			{ x: 25, z: -6 },
			{ x: 25, z: 6 }
		];

		for (var i = 0; i < lightPositions.length; i++) {
			var lightMesh = new THREE.Mesh(lightGeom, lightMat);
			lightMesh.position.set(lightPositions[i].x, -12 - corridorHeight + 1, lightPositions[i].z);
			undergroundGroup.add(lightMesh);

			emergencyLights.push({
				mesh: lightMesh,
				baseIntensity: 0.8,
				flicker: Math.random() * Math.PI * 2
			});
		}
	}

	function buildIntersectionChamber(corridorWidth, corridorHeight, wallMat) {
		var chamberSize = 15;
		var chamberMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

		// Chamber floor
		var floorGeom = new THREE.BoxGeometry(chamberSize, 0.5, chamberSize);
		var floor = new THREE.Mesh(floorGeom, chamberMat);
		floor.position.y = -14.75;
		undergroundGroup.add(floor);

		// Chamber walls
		var wallGeom = new THREE.BoxGeometry(chamberSize, corridorHeight, 0.5);
		var walls = [
			{ x: 0, z: -chamberSize / 2 },
			{ x: 0, z: chamberSize / 2 },
			{ x: -chamberSize / 2, z: 0 },
			{ x: chamberSize / 2, z: 0 }
		];

		for (var i = 0; i < walls.length; i++) {
			var wall = new THREE.Mesh(wallGeom, chamberMat);
			wall.position.set(walls[i].x, -12 - corridorHeight / 2, walls[i].z);
			wall.castShadow = true;
			undergroundGroup.add(wall);
		}

		// Central support pillar
		var pillarGeom = new THREE.CylinderGeometry(1.5, 1.5, corridorHeight - 1, 8);
		var pillar = new THREE.Mesh(pillarGeom, wallMat);
		pillar.position.y = -12 - corridorHeight / 2;
		pillar.castShadow = true;
		undergroundGroup.add(pillar);
	}

	function buildAmmunitionDepot(wallMat) {
		var depotX = -35;
		var depotY = -12;
		var depotZ = -35;
		var depotWidth = 18;
		var depotHeight = 6;
		var depotDepth = 20;

		var createMat = new THREE.MeshStandardMaterial({ color: 0x8B6914 });

		// Depot walls
		var northWallGeom = new THREE.BoxGeometry(depotWidth, depotHeight, 0.5);
		var northWall = new THREE.Mesh(northWallGeom, wallMat);
		northWall.position.set(depotX, depotY - depotHeight / 2, depotZ);
		northWall.castShadow = true;
		undergroundGroup.add(northWall);

		var southWallGeom = new THREE.BoxGeometry(depotWidth, depotHeight, 0.5);
		var southWall = new THREE.Mesh(southWallGeom, wallMat);
		southWall.position.set(depotX, depotY - depotHeight / 2, depotZ + depotDepth);
		southWall.castShadow = true;
		undergroundGroup.add(southWall);

		// Ammunition crates stacked
		var crateSize = 2;
		for (var x = 0; x < 3; x++) {
			for (var z = 0; z < 4; z++) {
				for (var y = 0; y < 2; y++) {
					var crateGeom = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
					var crate = new THREE.Mesh(crateGeom, createMat);
					crate.position.set(
						depotX - 6 + x * 3,
						depotY - depotHeight + 0.5 + y * (crateSize + 0.5),
						depotZ + 2 + z * 4
					);
					crate.castShadow = true;
					undergroundGroup.add(crate);
				}
			}
		}

		// Ordnance racks (tall shelves)
		var rackMat = new THREE.MeshStandardMaterial({ color: 0x505050 });
		for (var r = 0; r < 2; r++) {
			var rackGeom = new THREE.BoxGeometry(1, depotHeight - 1, depotDepth - 2);
			var rack = new THREE.Mesh(rackGeom, rackMat);
			rack.position.set(depotX + 6 + r * 4, depotY - depotHeight / 2, depotZ + depotDepth / 2);
			rack.castShadow = true;
			undergroundGroup.add(rack);
		}
	}

	function buildCommandBunker(wallMat) {
		var bunkerX = 35;
		var bunkerY = -12;
		var bunkerZ = -35;
		var bunkerWidth = 20;
		var bunkerHeight = 6;
		var bunkerDepth = 18;

		// Bunker walls
		var eastWallGeom = new THREE.BoxGeometry(0.5, bunkerHeight, bunkerDepth);
		var eastWall = new THREE.Mesh(eastWallGeom, wallMat);
		eastWall.position.set(bunkerX + bunkerWidth / 2, bunkerY - bunkerHeight / 2, bunkerZ);
		eastWall.castShadow = true;
		undergroundGroup.add(eastWall);

		var westWallGeom = new THREE.BoxGeometry(0.5, bunkerHeight, bunkerDepth);
		var westWall = new THREE.Mesh(westWallGeom, wallMat);
		westWall.position.set(bunkerX - bunkerWidth / 2, bunkerY - bunkerHeight / 2, bunkerZ);
		westWall.castShadow = true;
		undergroundGroup.add(westWall);

		// Command table (large BoxGeometry)
		var tableMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
		var tableGeom = new THREE.BoxGeometry(8, 1, 6);
		var table = new THREE.Mesh(tableGeom, tableMat);
		table.position.set(bunkerX, bunkerY - 2.5, bunkerZ);
		table.castShadow = true;
		undergroundGroup.add(table);

		// Screen stands (small pillars)
		var screenMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
		var screenPositions = [
			{ x: bunkerX - 6, z: bunkerZ - 5 },
			{ x: bunkerX + 6, z: bunkerZ - 5 }
		];

		for (var s = 0; s < screenPositions.length; s++) {
			var screenGeom = new THREE.BoxGeometry(2, 4, 2);
			var screen = new THREE.Mesh(screenGeom, screenMat);
			screen.position.set(screenPositions[s].x, bunkerY - 2, screenPositions[s].z);
			screen.castShadow = true;
			undergroundGroup.add(screen);
		}

		// Map table (smaller table with maps)
		var mapTableGeom = new THREE.BoxGeometry(5, 0.8, 5);
		var mapTable = new THREE.Mesh(mapTableGeom, tableMat);
		mapTable.position.set(bunkerX, bunkerY - 5, bunkerZ + 6);
		mapTable.castShadow = true;
		undergroundGroup.add(mapTable);
	}

	function buildEscapeTunnel(corridorWidth, corridorHeight, wallMat) {
		var tunnelLength = 60;
		var wallThickness = 0.5;

		// Long eastern escape tunnel
		var leftWallGeom = new THREE.BoxGeometry(wallThickness, corridorHeight, tunnelLength);
		var leftWall = new THREE.Mesh(leftWallGeom, wallMat);
		leftWall.position.set(45 - corridorWidth / 2, -12 - corridorHeight / 2, 0);
		leftWall.castShadow = true;
		undergroundGroup.add(leftWall);

		var rightWallGeom = new THREE.BoxGeometry(wallThickness, corridorHeight, tunnelLength);
		var rightWall = new THREE.Mesh(rightWallGeom, wallMat);
		rightWall.position.set(45 + corridorWidth / 2, -12 - corridorHeight / 2, 0);
		rightWall.castShadow = true;
		undergroundGroup.add(rightWall);

		var ceilGeom = new THREE.BoxGeometry(corridorWidth, wallThickness, tunnelLength);
		var ceil = new THREE.Mesh(ceilGeom, wallMat);
		ceil.position.set(45, -12 - corridorHeight + 0.25, 0);
		ceil.castShadow = true;
		undergroundGroup.add(ceil);

		// Exit gate
		var gateGeom = new THREE.BoxGeometry(corridorWidth - 1, corridorHeight - 1, 0.5);
		var gateMat = new THREE.MeshStandardMaterial({ color: 0x404040 });
		var gate = new THREE.Mesh(gateGeom, gateMat);
		gate.position.set(45, -12 - corridorHeight / 2, 30);
		gate.castShadow = true;
		undergroundGroup.add(gate);
	}

	function buildArmsCache(wallMat) {
		var cacheX = -15;
		var cacheY = -12;
		var cacheZ = 35;
		var cacheWidth = 6;
		var cacheHeight = 5;
		var cacheDepth = 4;

		var weaponMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

		// Cache alcove walls
		var backWallGeom = new THREE.BoxGeometry(cacheWidth, cacheHeight, 0.5);
		var backWall = new THREE.Mesh(backWallGeom, wallMat);
		backWall.position.set(cacheX, cacheY - cacheHeight / 2, cacheZ + cacheDepth / 2);
		backWall.castShadow = true;
		undergroundGroup.add(backWall);

		// Weapon stacks (small boxes)
		for (var w = 0; w < 3; w++) {
			var weaponGeom = new THREE.BoxGeometry(1, 2, 1);
			var weapon = new THREE.Mesh(weaponGeom, weaponMat);
			weapon.position.set(cacheX - 2 + w * 2, cacheY - 1, cacheZ);
			weapon.castShadow = true;
			undergroundGroup.add(weapon);
		}

		// Ammo boxes stacked
		var ammoMat = new THREE.MeshStandardMaterial({ color: 0x8B6914 });
		for (var a = 0; a < 2; a++) {
			var ammoGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
			var ammo = new THREE.Mesh(ammoGeom, ammoMat);
			ammo.position.set(cacheX + 2, cacheY - 2.5 + a * 1.8, cacheZ);
			ammo.castShadow = true;
			undergroundGroup.add(ammo);
		}
	}

	function createVentilationFan() {
		var fanMat = new THREE.MeshStandardMaterial({ color: 0x505050 });
		var fanX = 45;
		var fanY = -6;
		var fanZ = 30;

		// Fan housing
		var housingGeom = new THREE.BoxGeometry(3, 3, 1);
		var housing = new THREE.Mesh(housingGeom, fanMat);
		housing.position.set(fanX, fanY, fanZ);
		housing.castShadow = true;
		undergroundGroup.add(housing);

		// Fan blades (cone-shaped rotors)
		var bladeGeom = new THREE.ConeGeometry(1.2, 0.3, 4);
		var bladeMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
		var blade = new THREE.Mesh(bladeGeom, bladeMat);
		blade.position.set(fanX, fanY, fanZ + 0.5);
		blade.castShadow = true;
		undergroundGroup.add(blade);

		ventilationFan = {
			mesh: blade,
			rotation: 0
		};
	}

	function update(delta) {
		time += delta;

		// Animate trapdoors
		for (var t = 0; t < trapdoors.length; t++) {
			var trap = trapdoors[t];

			// Oscillate trapdoors
			trap.targetAngle = Math.sin(time * 0.5 + t) * 0.5;

			if (Math.abs(trap.angle - trap.targetAngle) > 0.01) {
				trap.angle += (trap.targetAngle - trap.angle) * 0.05;
			}

			// Apply rotation to trapdoor
			trap.mesh.quaternion.setFromAxisAngle(trap.axis, trap.angle);
		}

		// Animate water puddles (ripple effect)
		for (var p = 0; p < waterPuddles.length; p++) {
			var puddle = waterPuddles[p];
			puddle.wave = Math.sin(time * 2 + p * 0.5) * 0.05;
			puddle.mesh.position.y = -14.95 + puddle.wave;
			puddle.mesh.scale.y = 1 + Math.sin(time * 3 + p) * 0.1;
		}

		// Flicker emergency lights
		for (var l = 0; l < emergencyLights.length; l++) {
			var light = emergencyLights[l];
			light.flicker += delta * 3;
			var flicker = 0.8 + Math.sin(light.flicker) * 0.2 + Math.random() * 0.1;
			light.mesh.material.emissiveIntensity = Math.max(0.3, flicker);
		}

		// Rotate ventilation fan
		if (ventilationFan) {
			ventilationFan.rotation += delta * 5;
			ventilationFan.mesh.rotation.z = ventilationFan.rotation;
		}

		return true;
	}

	function reset() {
		time = 0;

		// Reset trapdoors
		for (var t = 0; t < trapdoors.length; t++) {
			trapdoors[t].angle = 0;
			trapdoors[t].targetAngle = 0;
			trapdoors[t].mesh.quaternion.set(0, 0, 0, 1);
		}

		// Reset water puddles
		for (var p = 0; p < waterPuddles.length; p++) {
			waterPuddles[p].wave = 0;
			waterPuddles[p].mesh.position.y = -14.95;
			waterPuddles[p].mesh.scale.y = 1;
		}

		// Reset emergency lights
		for (var l = 0; l < emergencyLights.length; l++) {
			emergencyLights[l].flicker = 0;
			emergencyLights[l].mesh.material.emissiveIntensity = 0.8;
		}

		// Reset fan
		if (ventilationFan) {
			ventilationFan.rotation = 0;
			ventilationFan.mesh.rotation.z = 0;
		}

		return true;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
