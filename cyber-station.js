var window = window || {};

window.CyberStation = (function() {
	'use strict';

	var sceneRef = null;
	var objects = [];
	var animationData = {
		droneTime: 0,
		aiCoreTime: 0,
		dataStreamTime: 0
	};

	var COLOR_ELECTRIC_BLUE = 0x0066FF;
	var COLOR_CYAN_NEON = 0x00FFFF;
	var COLOR_CHARCOAL = 0x1A1A1A;
	var COLOR_WHITE_GLOW = 0xFFFFFF;
	var COLOR_DARK_BLUE = 0x001A4D;
	var COLOR_NEON_PURPLE = 0xFF00FF;
	var COLOR_NEON_GREEN = 0x00FF00;

	function addObject(obj) {
		if (sceneRef) {
			sceneRef.add(obj);
			objects.push(obj);
		}
	}

	function createHexagonalWalls() {
		var wallHeight = 12;
		var panelSize = 3;
		var gridRadius = 14;

		for (var x = -gridRadius; x <= gridRadius; x += panelSize) {
			for (var z = -gridRadius; z <= gridRadius; z += panelSize) {
				var distance = Math.sqrt(x * x + z * z);
				if (distance > 25 && distance < 28) {
					var panelGeometry = new THREE.BoxGeometry(panelSize * 0.9, wallHeight, panelSize * 0.9);
					var panelMaterial = new THREE.MeshStandardMaterial({
						color: COLOR_ELECTRIC_BLUE,
						emissive: COLOR_CYAN_NEON,
						emissiveIntensity: 0.3,
						metalness: 0.8,
						roughness: 0.2
					});
					var panel = new THREE.Mesh(panelGeometry, panelMaterial);
					panel.position.set(x, wallHeight * 0.5, z);
					addObject(panel);
				}
			}
		}
	}

	function createFloorPanels() {
		var panelSize = 4;
		var floorRange = 30;

		for (var x = -floorRange; x <= floorRange; x += panelSize) {
			for (var z = -floorRange; z <= floorRange; z += panelSize) {
				if ((Math.abs(x) + Math.abs(z)) % 8 === 0) {
					var floorGeometry = new THREE.BoxGeometry(panelSize * 0.95, 0.5, panelSize * 0.95);
					var floorMaterial = new THREE.MeshStandardMaterial({
						color: COLOR_CHARCOAL,
						emissive: COLOR_ELECTRIC_BLUE,
						emissiveIntensity: 0.15,
						metalness: 0.7,
						roughness: 0.3
					});
					var floor = new THREE.Mesh(floorGeometry, floorMaterial);
					floor.position.set(x, 0.25, z);
					addObject(floor);
				}
			}
		}
	}

	function createHolographicProjectors() {
		var positions = [
			{ x: -15, z: -15 },
			{ x: 15, z: -15 },
			{ x: -15, z: 15 },
			{ x: 15, z: 15 },
			{ x: 0, z: 0 },
			{ x: -10, z: 0 },
			{ x: 10, z: 0 }
		];

		positions.forEach(function(pos) {
			var baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16);
			var baseMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_DARK_BLUE,
				metalness: 0.9,
				roughness: 0.1
			});
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(pos.x, 0.4, pos.z);
			addObject(base);

			var glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
			var glowMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_CYAN_NEON,
				emissive: COLOR_CYAN_NEON,
				emissiveIntensity: 0.8,
				metalness: 0.5,
				roughness: 0.5
			});
			var glow = new THREE.Mesh(glowGeometry, glowMaterial);
			glow.position.set(pos.x, 1.5, pos.z);
			addObject(glow);
		});
	}

	function createDataStreamPillars() {
		var pillarPositions = [
			{ x: -12, z: -12 },
			{ x: 12, z: -12 },
			{ x: -12, z: 12 },
			{ x: 12, z: 12 },
			{ x: 0, z: -10 },
			{ x: 0, z: 10 },
			{ x: -20, z: 0 },
			{ x: 20, z: 0 }
		];

		pillarPositions.forEach(function(pos) {
			var columnGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 12);
			var columnMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_DARK_BLUE,
				emissive: COLOR_ELECTRIC_BLUE,
				emissiveIntensity: 0.4,
				metalness: 0.8,
				roughness: 0.2
			});
			var column = new THREE.Mesh(columnGeometry, columnMaterial);
			column.position.set(pos.x, 4, pos.z);
			addObject(column);

			for (var i = 0; i < 5; i++) {
				var dataPoints = [];
				dataPoints.push(new THREE.Vector3(0, 0, 0));
				dataPoints.push(new THREE.Vector3(0.3, 2, 0.3));
				dataPoints.push(new THREE.Vector3(-0.2, 4, 0.2));
				dataPoints.push(new THREE.Vector3(0.2, 6, -0.3));
				dataPoints.push(new THREE.Vector3(-0.1, 8, 0));

				var dataGeometry = new THREE.BufferGeometry().setFromPoints(dataPoints);
				var dataMaterial = new THREE.LineBasicMaterial({ color: COLOR_CYAN_NEON });
				var dataLine = new THREE.LineSegments(dataGeometry, dataMaterial);
				dataLine.position.set(pos.x, 0, pos.z);
				dataLine.userData = { type: 'dataStream', offset: i * 0.4 };
				addObject(dataLine);
			}
		});
	}

	function createQuantumComputerCores() {
		var cores = [
			{ x: -20, z: -20 },
			{ x: 20, z: -20 },
			{ x: -20, z: 20 }
		];

		cores.forEach(function(pos) {
			var vaultGeometry = new THREE.BoxGeometry(6, 8, 6);
			var vaultMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_CHARCOAL,
				emissive: COLOR_ELECTRIC_BLUE,
				emissiveIntensity: 0.2,
				metalness: 0.7,
				roughness: 0.4
			});
			var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
			vault.position.set(pos.x, 4, pos.z);
			addObject(vault);

			for (var i = 0; i < 6; i++) {
				for (var j = 0; j < 6; j++) {
					var lightGeometry = new THREE.SphereGeometry(0.4, 8, 8);
					var lightMaterial = new THREE.MeshStandardMaterial({
						color: COLOR_ELECTRIC_BLUE,
						emissive: COLOR_ELECTRIC_BLUE,
						emissiveIntensity: 0.7,
						metalness: 0.6,
						roughness: 0.3
					});
					var light = new THREE.Mesh(lightGeometry, lightMaterial);
					light.position.set(
						pos.x - 2.5 + i,
						1.5 + j,
						pos.z - 2.5
					);
					addObject(light);
				}
			}
		});
	}

	function createNeuralNetworkGrid() {
		var gridSize = 8;
		var spacing = 3;
		var nodePositions = [];

		for (var x = 0; x < gridSize; x++) {
			for (var z = 0; z < gridSize; z++) {
				var posX = -12 + x * spacing;
				var posZ = -12 + z * spacing;
				nodePositions.push(new THREE.Vector3(posX, 6, posZ));

				var nodeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
				var nodeMaterial = new THREE.MeshStandardMaterial({
					color: COLOR_NEON_GREEN,
					emissive: COLOR_NEON_GREEN,
					emissiveIntensity: 0.6
				});
				var node = new THREE.Mesh(nodeGeometry, nodeMaterial);
				node.position.copy(nodePositions[nodePositions.length - 1]);
				addObject(node);
			}
		}

		for (var i = 0; i < nodePositions.length; i++) {
			for (var j = i + 1; j < nodePositions.length; j++) {
				var dist = nodePositions[i].distanceTo(nodePositions[j]);
				if (dist < 4.5) {
					var lineGeometry = new THREE.BufferGeometry().setFromPoints([
						nodePositions[i],
						nodePositions[j]
					]);
					var lineMaterial = new THREE.LineBasicMaterial({
						color: COLOR_NEON_GREEN,
						transparent: true,
						opacity: 0.4
					});
					var line = new THREE.LineSegments(lineGeometry, lineMaterial);
					addObject(line);
				}
			}
		}
	}

	function createEMPCannon() {
		var baseGeometry = new THREE.BoxGeometry(3, 2, 3);
		var baseMaterial = new THREE.MeshStandardMaterial({
			color: COLOR_DARK_BLUE,
			metalness: 0.9,
			roughness: 0.1
		});
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(0, 1, -25);
		addObject(base);

		var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
		var barrelMaterial = new THREE.MeshStandardMaterial({
			color: COLOR_CHARCOAL,
			emissive: COLOR_NEON_PURPLE,
			emissiveIntensity: 0.4,
			metalness: 0.8,
			roughness: 0.2
		});
		var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
		barrel.rotation.z = Math.PI * 0.15;
		barrel.position.set(0, 3.5, -25);
		addObject(barrel);

		for (var i = 0; i < 4; i++) {
			var coilGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
			var coilMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_NEON_PURPLE,
				emissive: COLOR_NEON_PURPLE,
				emissiveIntensity: 0.8,
				metalness: 0.5,
				roughness: 0.5
			});
			var coil = new THREE.Mesh(coilGeometry, coilMaterial);
			coil.position.set(0, 0.5 + i * 1, -25);
			addObject(coil);
		}
	}

	function createCyberOperatorStations() {
		var stationCount = 8;
		var radius = 10;

		for (var i = 0; i < stationCount; i++) {
			var angle = (i / stationCount) * Math.PI * 2;
			var x = Math.cos(angle) * radius;
			var z = Math.sin(angle) * radius;

			var deskGeometry = new THREE.BoxGeometry(3, 1, 2.5);
			var deskMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_DARK_BLUE,
				metalness: 0.7,
				roughness: 0.3
			});
			var desk = new THREE.Mesh(deskGeometry, deskMaterial);
			desk.position.set(x, 0.5, z);
			addObject(desk);

			for (var j = 0; j < 2; j++) {
				var screenGeometry = new THREE.BoxGeometry(1.4, 1.8, 0.2);
				var screenMaterial = new THREE.MeshStandardMaterial({
					color: COLOR_ELECTRIC_BLUE,
					emissive: COLOR_CYAN_NEON,
					emissiveIntensity: 0.6,
					metalness: 0.6,
					roughness: 0.2
				});
				var screen = new THREE.Mesh(screenGeometry, screenMaterial);
				screen.position.set(
					x - 1 + j * 2,
					1.5,
					z - 0.5
				);
				addObject(screen);
			}
		}
	}

	function createSecurityDrones() {
		var dronePositions = [
			{ x: -18, y: 5, z: -18 },
			{ x: 18, y: 4, z: -18 },
			{ x: -18, y: 6, z: 18 },
			{ x: 18, y: 5, z: 18 },
			{ x: 0, y: 7, z: 0 },
			{ x: -10, y: 3, z: 8 },
			{ x: 10, y: 6, z: -8 },
			{ x: 5, y: 4, z: 15 }
		];

		dronePositions.forEach(function(pos) {
			var droneGeometry = new THREE.SphereGeometry(0.6, 12, 12);
			var droneMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_ELECTRIC_BLUE,
				emissive: COLOR_CYAN_NEON,
				emissiveIntensity: 0.5,
				metalness: 0.8,
				roughness: 0.2
			});
			var drone = new THREE.Mesh(droneGeometry, droneMaterial);
			drone.position.set(pos.x, pos.y, pos.z);
			drone.userData = { type: 'drone', baseY: pos.y };
			addObject(drone);
		});
	}

	function createPowerConduits() {
		var conduitRuns = [
			{ start: { x: -25, z: 0 }, end: { x: 25, z: 0 } },
			{ start: { x: 0, z: -25 }, end: { x: 0, z: 25 } },
			{ start: { x: -15, z: -15 }, end: { x: 15, z: 15 } },
			{ start: { x: 15, z: -15 }, end: { x: -15, z: 15 } }
		];

		conduitRuns.forEach(function(run) {
			var steps = 12;
			var deltaX = (run.end.x - run.start.x) / steps;
			var deltaZ = (run.end.z - run.start.z) / steps;

			for (var i = 0; i < steps; i++) {
				var conduitGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.5);
				var conduitMaterial = new THREE.MeshStandardMaterial({
					color: COLOR_CHARCOAL,
					emissive: COLOR_NEON_PURPLE,
					emissiveIntensity: 0.3,
					metalness: 0.7,
					roughness: 0.4
				});
				var conduit = new THREE.Mesh(conduitGeometry, conduitMaterial);
				conduit.position.set(
					run.start.x + deltaX * i,
					0.2,
					run.start.z + deltaZ * i
				);
				addObject(conduit);
			}
		});
	}

	function createAICoreChamber() {
		var chamberGeometry = new THREE.BoxGeometry(10, 10, 10);
		var chamberMaterial = new THREE.MeshStandardMaterial({
			color: COLOR_CHARCOAL,
			emissive: COLOR_DARK_BLUE,
			emissiveIntensity: 0.2,
			metalness: 0.8,
			roughness: 0.3
		});
		var chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
		chamber.position.set(0, 5, 0);
		addObject(chamber);

		var coreGeometry = new THREE.SphereGeometry(3, 20, 20);
		var coreMaterial = new THREE.MeshStandardMaterial({
			color: COLOR_ELECTRIC_BLUE,
			emissive: COLOR_ELECTRIC_BLUE,
			emissiveIntensity: 0.8,
			metalness: 0.7,
			roughness: 0.2
		});
		var core = new THREE.Mesh(coreGeometry, coreMaterial);
		core.position.set(0, 5, 0);
		core.userData = { type: 'aiCore' };
		addObject(core);

		for (var i = 0; i < 6; i++) {
			var ringGeometry = new THREE.CylinderGeometry(4.5, 4.5, 0.4, 32);
			var ringMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_CYAN_NEON,
				emissive: COLOR_CYAN_NEON,
				emissiveIntensity: 0.6,
				metalness: 0.6,
				roughness: 0.3
			});
			var ring = new THREE.Mesh(ringGeometry, ringMaterial);
			ring.rotation.x = Math.PI / 3 * i;
			ring.position.set(0, 5, 0);
			addObject(ring);
		}
	}

	function createDecompressionAirlocks() {
		var airlockPositions = [
			{ x: -27, z: 0 },
			{ x: 27, z: 0 },
			{ x: 0, z: -27 },
			{ x: 0, z: 27 }
		];

		airlockPositions.forEach(function(pos) {
			for (var door = 0; door < 2; door++) {
				var doorGeometry = new THREE.BoxGeometry(1.8, 4, 0.2);
				var doorMaterial = new THREE.MeshStandardMaterial({
					color: COLOR_DARK_BLUE,
					emissive: COLOR_ELECTRIC_BLUE,
					emissiveIntensity: 0.4,
					metalness: 0.8,
					roughness: 0.2
				});
				var doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
				doorMesh.position.set(
					pos.x + (door === 0 ? -1 : 1),
					2,
					pos.z
				);
				addObject(doorMesh);
			}

			for (var i = 0; i < 8; i++) {
				var sealPoints = [
					new THREE.Vector3(-1.8, 0.5 + i * 0.4, 0),
					new THREE.Vector3(1.8, 0.5 + i * 0.4, 0)
				];
				var sealGeometry = new THREE.BufferGeometry().setFromPoints(sealPoints);
				var sealMaterial = new THREE.LineBasicMaterial({ color: COLOR_CYAN_NEON });
				var sealLine = new THREE.LineSegments(sealGeometry, sealMaterial);
				sealLine.position.set(pos.x, 0, pos.z);
				addObject(sealLine);
			}
		});
	}

	function createSurveillanceNetwork() {
		var cameraPositions = [
			{ x: -22, z: -22, wall: 'corner' },
			{ x: 22, z: -22, wall: 'corner' },
			{ x: -22, z: 22, wall: 'corner' },
			{ x: 22, z: 22, wall: 'corner' },
			{ x: -26, z: 0, wall: 'side' },
			{ x: 26, z: 0, wall: 'side' },
			{ x: 0, z: -26, wall: 'side' },
			{ x: 0, z: 26, wall: 'side' },
			{ x: -13, z: -26, wall: 'side' },
			{ x: 13, z: 26, wall: 'side' },
			{ x: -26, z: -13, wall: 'side' },
			{ x: 26, z: 13, wall: 'side' }
		];

		cameraPositions.forEach(function(pos) {
			var mountGeometry = new THREE.BoxGeometry(1.5, 0.8, 1);
			var mountMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_CHARCOAL,
				metalness: 0.8,
				roughness: 0.2
			});
			var mount = new THREE.Mesh(mountGeometry, mountMaterial);
			mount.position.set(pos.x, 9, pos.z);
			addObject(mount);

			var podGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
			var podMaterial = new THREE.MeshStandardMaterial({
				color: COLOR_DARK_BLUE,
				emissive: COLOR_NEON_PURPLE,
				emissiveIntensity: 0.5,
				metalness: 0.7,
				roughness: 0.3
			});
			var pod = new THREE.Mesh(podGeometry, podMaterial);
			pod.position.set(pos.x, 8.2, pos.z);
			addObject(pod);
		});
	}

	function init(scene, camera) {
		sceneRef = scene;
		objects = [];
		animationData = {
			droneTime: 0,
			aiCoreTime: 0,
			dataStreamTime: 0
		};

		createFloorPanels();
		createHexagonalWalls();
		createHolographicProjectors();
		createDataStreamPillars();
		createQuantumComputerCores();
		createNeuralNetworkGrid();
		createEMPCannon();
		createCyberOperatorStations();
		createSecurityDrones();
		createPowerConduits();
		createAICoreChamber();
		createDecompressionAirlocks();
		createSurveillanceNetwork();

		return true;
	}

	function update(delta) {
		if (!sceneRef) return;

		animationData.droneTime += delta;
		animationData.aiCoreTime += delta;
		animationData.dataStreamTime += delta;

		objects.forEach(function(obj) {
			if (obj.userData && obj.userData.type === 'drone') {
				var hoverAmount = Math.sin(animationData.droneTime * 2 + obj.position.x) * 0.5;
				obj.position.y = obj.userData.baseY + hoverAmount;
				obj.rotation.y += delta * 0.5;
			}

			if (obj.userData && obj.userData.type === 'aiCore') {
				var pulseScale = 1 + Math.sin(animationData.aiCoreTime * 3) * 0.15;
				obj.scale.set(pulseScale, pulseScale, pulseScale);
			}

			if (obj.userData && obj.userData.type === 'dataStream') {
				var dataOffset = obj.userData.offset || 0;
				obj.position.y = Math.sin(animationData.dataStreamTime * 2 + dataOffset) * 2;
			}
		});
	}

	function reset() {
		objects.forEach(function(obj) {
			if (obj.geometry) {
				obj.geometry.dispose();
			}
			if (obj.material) {
				if (Array.isArray(obj.material)) {
					obj.material.forEach(function(mat) {
						mat.dispose();
					});
				} else {
					obj.material.dispose();
				}
			}
		});

		objects.forEach(function(obj) {
			if (sceneRef) {
				sceneRef.remove(obj);
			}
		});

		objects = [];
		sceneRef = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
