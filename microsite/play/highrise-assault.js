window.HighriseAssault = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var buildings = [];
	var elevators = [];
	var sprinklers = [];
	var hvacUnits = [];
	var waterdroplets = [];
	var ropes = [];
	var floorCount = 12;
	var floorHeight = 4.5;
	var buildingWidth = 30;
	var buildingDepth = 25;

	function createFloorSlab(x, y, z, width, depth, materials) {
		var floorGroup = new THREE.Group();

		var floorGeom = new THREE.BoxGeometry(width, 0.4, depth);
		var floorMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.3, roughness: 0.7 });
		var floorMesh = new THREE.Mesh(floorGeom, floorMat);
		floorMesh.castShadow = true;
		floorMesh.receiveShadow = true;
		floorMesh.position.set(x, y, z);
		floorGroup.add(floorMesh);

		return floorGroup;
	}

	function createGlassCurtainWall(x, y, z, width, height, depth) {
		var wallGroup = new THREE.Group();

		var panelWidth = 3;
		var panelHeight = 3;
		var panelsX = Math.ceil(width / panelWidth);
		var panelsY = Math.ceil(height / panelHeight);

		for (var py = 0; py < panelsY; py++) {
			for (var px = 0; px < panelsX; px++) {
				var panelGeom = new THREE.BoxGeometry(panelWidth - 0.1, panelHeight - 0.1, 0.1);
				var panelMat = new THREE.MeshStandardMaterial({
					color: 0x88ccff,
					metalness: 0.8,
					roughness: 0.1,
					transparent: true,
					opacity: 0.7
				});
				var panelMesh = new THREE.Mesh(panelGeom, panelMat);
				panelMesh.castShadow = true;
				panelMesh.receiveShadow = true;
				panelMesh.position.set(
					x - width / 2 + px * panelWidth + panelWidth / 2,
					y + height / 2 - py * panelHeight - panelHeight / 2,
					z + depth / 2
				);
				wallGroup.add(panelMesh);
			}
		}

		return wallGroup;
	}

	function createInteriorWalls(x, y, z, floorWidth, floorDepth) {
		var wallGroup = new THREE.Group();
		var wallThickness = 0.3;
		var wallHeight = 3.2;

		var verticalWall1Geom = new THREE.BoxGeometry(floorWidth * 0.6, wallHeight, wallThickness);
		var verticalWall2Geom = new THREE.BoxGeometry(floorWidth * 0.5, wallHeight, wallThickness);
		var horizontalWall1Geom = new THREE.BoxGeometry(wallThickness, wallHeight, floorDepth * 0.7);
		var wallMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.2, roughness: 0.8 });

		var wall1 = new THREE.Mesh(verticalWall1Geom, wallMat);
		wall1.castShadow = true;
		wall1.receiveShadow = true;
		wall1.position.set(x - 5, y + wallHeight / 2, z - 3);
		wallGroup.add(wall1);

		var wall2 = new THREE.Mesh(verticalWall2Geom, wallMat);
		wall2.castShadow = true;
		wall2.receiveShadow = true;
		wall2.position.set(x + 6, y + wallHeight / 2, z + 2);
		wallGroup.add(wall2);

		var wall3 = new THREE.Mesh(horizontalWall1Geom, wallMat);
		wall3.castShadow = true;
		wall3.receiveShadow = true;
		wall3.position.set(x + 8, y + wallHeight / 2, z - 1);
		wallGroup.add(wall3);

		return wallGroup;
	}

	function createCubicles(x, y, z) {
		var cubicleGroup = new THREE.Group();
		var panelMat = new THREE.MeshStandardMaterial({ color: 0x996633, metalness: 0.3, roughness: 0.7 });
		var deskMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, metalness: 0.4, roughness: 0.6 });

		for (var row = 0; row < 3; row++) {
			for (var col = 0; col < 2; col++) {
				var cubicleX = x - 8 + col * 8;
				var cubicleZ = z - 6 + row * 5;

				var panelGeom = new THREE.BoxGeometry(4, 1.5, 0.1);
				var panel = new THREE.Mesh(panelGeom, panelMat);
				panel.castShadow = true;
				panel.position.set(cubicleX, y + 0.75, cubicleZ);
				cubicleGroup.add(panel);

				var deskGeom = new THREE.BoxGeometry(3.5, 0.8, 2);
				var desk = new THREE.Mesh(deskGeom, deskMat);
				desk.castShadow = true;
				desk.receiveShadow = true;
				desk.position.set(cubicleX, y + 0.4, cubicleZ);
				cubicleGroup.add(desk);

				var monitorGeom = new THREE.BoxGeometry(1.2, 0.8, 0.2);
				var monitorMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6 });
				var monitor = new THREE.Mesh(monitorGeom, monitorMat);
				monitor.castShadow = true;
				monitor.position.set(cubicleX, y + 1.2, cubicleZ - 0.5);
				cubicleGroup.add(monitor);
			}
		}

		return cubicleGroup;
	}

	function createElevatorShaft(x, y, z, height) {
		var shaftGroup = new THREE.Group();
		var shaftSize = 3;
		var cableThickness = 0.05;

		var shaftBackGeom = new THREE.BoxGeometry(shaftSize, height, 0.3);
		var shaftMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.6 });
		var shaftBack = new THREE.Mesh(shaftBackGeom, shaftMat);
		shaftBack.castShadow = true;
		shaftBack.receiveShadow = true;
		shaftBack.position.set(x, y + height / 2, z);
		shaftGroup.add(shaftBack);

		var shaftLeftGeom = new THREE.BoxGeometry(0.3, height, shaftSize);
		var shaftLeft = new THREE.Mesh(shaftLeftGeom, shaftMat);
		shaftLeft.castShadow = true;
		shaftLeft.receiveShadow = true;
		shaftLeft.position.set(x - shaftSize / 2, y + height / 2, z);
		shaftGroup.add(shaftLeft);

		var shaftRightGeom = new THREE.BoxGeometry(0.3, height, shaftSize);
		var shaftRight = new THREE.Mesh(shaftRightGeom, shaftMat);
		shaftRight.castShadow = true;
		shaftRight.receiveShadow = true;
		shaftRight.position.set(x + shaftSize / 2, y + height / 2, z);
		shaftGroup.add(shaftRight);

		var cableMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: cableThickness * 100 });
		for (var i = 0; i < 4; i++) {
			var cablePoints = [
				new THREE.Vector3(x - shaftSize / 2 + 0.5 + i * 0.6, y + height, z),
				new THREE.Vector3(x - shaftSize / 2 + 0.5 + i * 0.6, y, z)
			];
			var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
			var cable = new THREE.LineSegments(cableGeom, cableMat);
			shaftGroup.add(cable);
		}

		var elevatorCageGeom = new THREE.BoxGeometry(shaftSize - 0.6, 2.2, shaftSize - 0.6);
		var elevatorCageMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7, roughness: 0.3 });
		var elevatorCage = new THREE.Mesh(elevatorCageGeom, elevatorCageMat);
		elevatorCage.castShadow = true;
		elevatorCage.receiveShadow = true;
		elevatorCage.position.set(x, y + 1.1, z);
		shaftGroup.add(elevatorCage);

		elevators.push({
			mesh: elevatorCage,
			startY: y + 1.1,
			endY: y + height - 2,
			currentY: y + 1.1,
			direction: 1,
			speed: 8
		});

		return shaftGroup;
	}

	function createStairwell(x, y, z, height) {
		var stairGroup = new THREE.Group();
		var stepCount = 20;
		var stepWidth = 1.2;
		var stepDepth = 0.8;
		var stepHeight = height / stepCount;

		var stepMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.3, roughness: 0.7 });

		for (var i = 0; i < stepCount; i++) {
			var stepGeom = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
			var step = new THREE.Mesh(stepGeom, stepMat);
			step.castShadow = true;
			step.receiveShadow = true;
			step.position.set(
				x + (i % 2) * 1.5 - 0.75,
				y + stepHeight * (i + 0.5),
				z + Math.floor(i / 2) * stepDepth - height / 2
			);
			stairGroup.add(step);
		}

		return stairGroup;
	}

	function createServerRoom(x, y, z) {
		var serverGroup = new THREE.Group();
		var rackMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
		var rackLightMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.6 });

		for (var row = 0; row < 3; row++) {
			for (var col = 0; col < 2; col++) {
				var rackX = x - 4 + col * 8;
				var rackZ = z - 3 + row * 6;

				var rackGeom = new THREE.BoxGeometry(2, 2.5, 0.8);
				var rack = new THREE.Mesh(rackGeom, rackMat);
				rack.castShadow = true;
				rack.position.set(rackX, y + 1.25, rackZ);
				serverGroup.add(rack);

				for (var light = 0; light < 6; light++) {
					var lightGeom = new THREE.BoxGeometry(0.3, 0.2, 0.1);
					var lightMesh = new THREE.Mesh(lightGeom, rackLightMat);
					lightMesh.position.set(rackX + 0.7, y + 0.6 + light * 0.35, rackZ + 0.5);
					serverGroup.add(lightMesh);
				}
			}
		}

		return serverGroup;
	}

	function createExecutiveFloor(x, y, z) {
		var execGroup = new THREE.Group();

		var deskGeom = new THREE.BoxGeometry(4, 0.9, 2.5);
		var mahoganyMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.4, roughness: 0.6 });
		var desk = new THREE.Mesh(deskGeom, mahoganyMat);
		desk.castShadow = true;
		desk.receiveShadow = true;
		desk.position.set(x - 5, y + 0.45, z);
		execGroup.add(desk);

		var tableGeom = new THREE.BoxGeometry(5, 0.8, 2.5);
		var table = new THREE.Mesh(tableGeom, mahoganyMat);
		table.castShadow = true;
		table.receiveShadow = true;
		table.position.set(x + 6, y + 0.4, z);
		execGroup.add(table);

		var chairGeom = new THREE.BoxGeometry(0.8, 1.2, 0.8);
		var chairMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.5, roughness: 0.5 });
		for (var i = 0; i < 8; i++) {
			var chair = new THREE.Mesh(chairGeom, chairMat);
			chair.castShadow = true;
			chair.position.set(x + 2 + i * 1.2, y + 0.6, z - 1.5);
			execGroup.add(chair);
		}

		return execGroup;
	}

	function createRooftopHelipad(x, y, z) {
		var helipadGroup = new THREE.Group();

		var helipadGeom = new THREE.BoxGeometry(20, 0.3, 20);
		var helipadMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.7 });
		var helipadMesh = new THREE.Mesh(helipadGeom, helipadMat);
		helipadMesh.castShadow = true;
		helipadMesh.receiveShadow = true;
		helipadMesh.position.set(x, y, z);
		helipadGroup.add(helipadMesh);

		var hMarkingMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.3 });
		var hVertGeom = new THREE.BoxGeometry(0.5, 0.05, 6);
		var hVert = new THREE.Mesh(hVertGeom, hMarkingMat);
		hVert.position.set(x, y + 0.15, z);
		helipadGroup.add(hVert);

		var hHorizGeom = new THREE.BoxGeometry(6, 0.05, 0.5);
		var hHoriz = new THREE.Mesh(hHorizGeom, hMarkingMat);
		hHoriz.position.set(x, y + 0.15, z);
		helipadGroup.add(hHoriz);

		return helipadGroup;
	}

	function createHVACUnits(x, y, z) {
		var hvacGroup = new THREE.Group();
		var hvacMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6, roughness: 0.4 });

		for (var i = 0; i < 4; i++) {
			var unitX = x - 6 + i * 4;
			var unitGeom = new THREE.BoxGeometry(3, 1.5, 3);
			var unit = new THREE.Mesh(unitGeom, hvacMat);
			unit.castShadow = true;
			unit.receiveShadow = true;
			unit.position.set(unitX, y + 0.75, z);
			hvacGroup.add(unit);

			var fanGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 32);
			var fanMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });
			var fan = new THREE.Mesh(fanGeom, fanMat);
			fan.castShadow = true;
			fan.position.set(unitX, y + 1.5, z);
			hvacGroup.add(fan);

			hvacUnits.push({
				mesh: fan,
				speed: Math.random() * 2 + 3
			});
		}

		return hvacGroup;
	}

	function createFireHoseReels(floorX, floorY, floorZ, floorWidth) {
		var hoseGroup = new THREE.Group();
		var reelMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.7, roughness: 0.3 });
		var hoseMat = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.5, roughness: 0.6 });

		for (var i = 0; i < 3; i++) {
			var reelX = floorX - floorWidth / 2 + 2 + i * 10;

			var frameGeom = new THREE.BoxGeometry(0.3, 1.2, 0.3);
			var frame = new THREE.Mesh(frameGeom, reelMat);
			frame.position.set(reelX, floorY + 0.6, floorZ);
			hoseGroup.add(frame);

			var reelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
			var reel = new THREE.Mesh(reelGeom, hoseMat);
			reel.castShadow = true;
			reel.position.set(reelX, floorY + 0.8, floorZ);
			hoseGroup.add(reel);
		}

		return hoseGroup;
	}

	function createSprinklerHeads(floorX, floorY, floorZ, floorWidth, floorDepth) {
		var sprinklerGroup = new THREE.Group();
		var sprinklerMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });

		for (var row = 0; row < 3; row++) {
			for (var col = 0; col < 4; col++) {
				var sprinklerX = floorX - floorWidth / 2 + 3 + col * 8;
				var sprinklerZ = floorZ - floorDepth / 2 + 2 + row * 7;

				var sprinklerGeom = new THREE.SphereGeometry(0.25, 16, 16);
				var sprinkler = new THREE.Mesh(sprinklerGeom, sprinklerMat);
				sprinkler.castShadow = true;
				sprinkler.position.set(sprinklerX, floorY + 3.2, sprinklerZ);
				sprinklerGroup.add(sprinkler);

				sprinklers.push({
					mesh: sprinkler,
					baseX: sprinklerX,
					baseZ: sprinklerZ,
					baseY: floorY + 3.2,
					phase: Math.random() * Math.PI * 2,
					active: true
				});

				for (var drop = 0; drop < 4; drop++) {
					var dropGeom = new THREE.SphereGeometry(0.08, 8, 8);
					var dropMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
					var waterDrop = new THREE.Mesh(dropGeom, dropMat);
					waterDrop.position.set(sprinklerX, floorY + 3.1, sprinklerZ);
					sprinklerGroup.add(waterDrop);

					waterdroplets.push({
						mesh: waterDrop,
						sprinklerIndex: sprinklers.length - 1,
						offsetX: (Math.random() - 0.5) * 0.5,
						offsetZ: (Math.random() - 0.5) * 0.5,
						offsetY: Math.random() * 0.8,
						phase: Math.random() * Math.PI * 2,
						speed: Math.random() * 1.5 + 0.5
					});
				}
			}
		}

		return sprinklerGroup;
	}

	function createSupportColumns(floorX, floorY, floorZ, floorWidth, floorDepth, height) {
		var columnGroup = new THREE.Group();
		var columnMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.4, roughness: 0.6 });

		var columnRadius = 0.4;
		var positions = [
			{ x: -floorWidth / 2 + 3, z: -floorDepth / 2 + 3 },
			{ x: floorWidth / 2 - 3, z: -floorDepth / 2 + 3 },
			{ x: -floorWidth / 2 + 3, z: floorDepth / 2 - 3 },
			{ x: floorWidth / 2 - 3, z: floorDepth / 2 - 3 }
		];

		for (var i = 0; i < positions.length; i++) {
			var columnGeom = new THREE.CylinderGeometry(columnRadius, columnRadius, height, 32);
			var column = new THREE.Mesh(columnGeom, columnMat);
			column.castShadow = true;
			column.receiveShadow = true;
			column.position.set(floorX + positions[i].x, floorY + height / 2, floorZ + positions[i].z);
			columnGroup.add(column);
		}

		return columnGroup;
	}

	function createRappellingRopes(buildingX, buildingZ, floorHeight, floorCount) {
		var ropesGroup = new THREE.Group();
		var ropeMat = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 2 });

		var totalHeight = floorHeight * floorCount;
		for (var i = 0; i < 6; i++) {
			var ropeX = buildingX - buildingWidth / 2 + 2 + i * 3;
			var ropePoints = [
				new THREE.Vector3(ropeX, totalHeight + 2, buildingZ - buildingDepth / 2),
				new THREE.Vector3(ropeX + 0.3, 0, buildingZ - buildingDepth / 2)
			];
			var ropeGeom = new THREE.BufferGeometry().setFromPoints(ropePoints);
			var rope = new THREE.LineSegments(ropeGeom, ropeMat);
			ropesGroup.add(rope);

			ropes.push({
				mesh: rope,
				phase: Math.random() * Math.PI * 2
			});
		}

		return ropesGroup;
	}

	function createBrokenGlass(x, y, z) {
		var glassGroup = new THREE.Group();
		var glassMat = new THREE.MeshStandardMaterial({
			color: 0xdddddd,
			transparent: true,
			opacity: 0.5,
			metalness: 0.9,
			roughness: 0.1
		});

		for (var i = 0; i < 8; i++) {
			var shardWidth = Math.random() * 0.8 + 0.2;
			var shardHeight = Math.random() * 1.2 + 0.3;
			var shardGeom = new THREE.BoxGeometry(shardWidth, shardHeight, 0.05);
			var shard = new THREE.Mesh(shardGeom, glassMat);
			shard.castShadow = true;
			shard.position.set(
				x + (Math.random() - 0.5) * 3,
				y + Math.random() * 2,
				z + (Math.random() - 0.5) * 1
			);
			shard.rotation.z = Math.random() * Math.PI;
			glassGroup.add(shard);
		}

		return glassGroup;
	}

	function createEmergencyExitSign(x, y, z) {
		var signGroup = new THREE.Group();
		var signBackGeom = new THREE.BoxGeometry(1.5, 0.6, 0.1);
		var signBackMat = new THREE.MeshStandardMaterial({ color: 0x330000, metalness: 0.3 });
		var signBack = new THREE.Mesh(signBackGeom, signBackMat);
		signBack.castShadow = true;
		signBack.position.set(x, y, z);
		signGroup.add(signBack);

		var signLetterGeom = new THREE.BoxGeometry(0.8, 0.4, 0.05);
		var signLetterMat = new THREE.MeshStandardMaterial({
			color: 0x00ff00,
			emissive: 0x00ff00,
			emissiveIntensity: 0.8
		});
		var signLetter = new THREE.Mesh(signLetterGeom, signLetterMat);
		signLetter.position.set(x, y, z + 0.08);
		signGroup.add(signLetter);

		return signGroup;
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		var buildingGroup = new THREE.Group();
		var centerX = 0;
		var centerZ = -40;

		for (var floor = 0; floor < floorCount; floor++) {
			var floorY = floor * floorHeight;

			var floorSlab = createFloorSlab(centerX, floorY, centerZ, buildingWidth, buildingDepth);
			buildingGroup.add(floorSlab);

			var curtainWall = createGlassCurtainWall(centerX, floorY + floorHeight / 2, centerZ, buildingWidth, floorHeight, buildingDepth);
			buildingGroup.add(curtainWall);

			if (floor % 3 === 0) {
				var interiorWalls = createInteriorWalls(centerX, floorY, centerZ, buildingWidth, buildingDepth);
				buildingGroup.add(interiorWalls);
			}

			if (floor > 0 && floor < floorCount - 2) {
				var cubicles = createCubicles(centerX, floorY, centerZ);
				buildingGroup.add(cubicles);
			}

			var hoseReels = createFireHoseReels(centerX, floorY, centerZ, buildingWidth);
			buildingGroup.add(hoseReels);

			var sprinklersFloor = createSprinklerHeads(centerX, floorY, centerZ, buildingWidth, buildingDepth);
			buildingGroup.add(sprinklersFloor);

			var columns = createSupportColumns(centerX, floorY, centerZ, buildingWidth, buildingDepth, floorHeight);
			buildingGroup.add(columns);
		}

		var elevatorShaft = createElevatorShaft(centerX + 10, 0, centerZ - 8, floorCount * floorHeight);
		buildingGroup.add(elevatorShaft);

		var stairwell = createStairwell(centerX - 10, 0, centerZ + 5, floorCount * floorHeight);
		buildingGroup.add(stairwell);

		var serverFloor = 8;
		var serverRoom = createServerRoom(centerX, serverFloor * floorHeight, centerZ, buildingWidth);
		buildingGroup.add(serverRoom);

		var execFloor = floorCount - 2;
		var executiveFloor = createExecutiveFloor(centerX, execFloor * floorHeight, centerZ);
		buildingGroup.add(executiveFloor);

		var roofY = floorCount * floorHeight;
		var helipad = createRooftopHelipad(centerX, roofY, centerZ);
		buildingGroup.add(helipad);

		var hvacUnits = createHVACUnits(centerX, roofY + 0.3, centerZ - 8);
		buildingGroup.add(hvacUnits);

		var brokenGlass1 = createBrokenGlass(centerX + 5, 25, centerZ + 2);
		buildingGroup.add(brokenGlass1);

		var brokenGlass2 = createBrokenGlass(centerX - 8, 40, centerZ - 5);
		buildingGroup.add(brokenGlass2);

		var exitSign1 = createEmergencyExitSign(centerX - 12, 20, centerZ + 10);
		buildingGroup.add(exitSign1);

		var exitSign2 = createEmergencyExitSign(centerX + 12, 45, centerZ - 10);
		buildingGroup.add(exitSign2);

		var ropes = createRappellingRopes(centerX, centerZ, floorHeight, floorCount);
		buildingGroup.add(ropes);

		scene.add(buildingGroup);
		buildings.push(buildingGroup);
	}

	function update(delta) {
		for (var e = 0; e < elevators.length; e++) {
			var elevator = elevators[e];
			elevator.currentY += elevator.direction * elevator.speed * delta;

			if (elevator.currentY >= elevator.endY) {
				elevator.currentY = elevator.endY;
				elevator.direction = -1;
			} else if (elevator.currentY <= elevator.startY) {
				elevator.currentY = elevator.startY;
				elevator.direction = 1;
			}

			elevator.mesh.position.y = elevator.currentY;
		}

		var time = performance.now() * 0.001;

		for (var s = 0; s < sprinklers.length; s++) {
			var sprinkler = sprinklers[s];
			if (sprinkler.active) {
				sprinkler.mesh.position.x = sprinkler.baseX + Math.sin(time * 1.5 + sprinkler.phase) * 0.1;
				sprinkler.mesh.position.z = sprinkler.baseZ + Math.cos(time * 1.2 + sprinkler.phase) * 0.1;
			}
		}

		for (var w = 0; w < waterdroplets.length; w++) {
			var droplet = waterdroplets[w];
			var sprinklIdx = droplet.sprinklerIndex;
			if (sprinklIdx < sprinklers.length && sprinklers[sprinklIdx].active) {
				var sprnkl = sprinklers[sprinklIdx];
				var oscillation = Math.sin(time * droplet.speed + droplet.phase) * 0.3;
				droplet.mesh.position.x = sprnkl.baseX + droplet.offsetX + oscillation;
				droplet.mesh.position.y = sprnkl.baseY - droplet.offsetY - Math.abs(Math.sin(time * droplet.speed * 1.5 + droplet.phase)) * 0.4;
				droplet.mesh.position.z = sprnkl.baseZ + droplet.offsetZ;
			}
		}

		for (var h = 0; h < hvacUnits.length; h++) {
			var hvac = hvacUnits[h];
			hvac.mesh.rotation.z += hvac.speed * delta;
		}

		for (var r = 0; r < ropes.length; r++) {
			var rope = ropes[r];
			rope.mesh.material.opacity = 0.5 + Math.sin(time + rope.phase) * 0.3;
		}
	}

	function reset() {
		for (var e = 0; e < elevators.length; e++) {
			var elevator = elevators[e];
			elevator.direction = 1;
			elevator.currentY = elevator.startY;
			elevator.mesh.position.y = elevator.startY;
		}

		for (var s = 0; s < sprinklers.length; s++) {
			sprinklers[s].mesh.position.x = sprinklers[s].baseX;
			sprinklers[s].mesh.position.z = sprinklers[s].baseZ;
			sprinklers[s].active = true;
		}

		for (var w = 0; w < waterdroplets.length; w++) {
			waterdroplets[w].mesh.position.y = sprinklers[waterdroplets[w].sprinklerIndex].baseY;
		}

		for (var h = 0; h < hvacUnits.length; h++) {
			hvacUnits[h].mesh.rotation.z = 0;
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
