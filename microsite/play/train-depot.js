window.TrainDepot = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var spawnPoints = [];
	var craneAngle = 0;
	var steamTime = 0;
	var sparkParticles = [];
	var signalLightTime = 0;
	var gaugeRotation = 0;
	var guardPatrolTime = 0;
	var guardMeshes = [];

	var colors = {
		rustBrown: 0x8B4513,
		grimy: 0x3a3a3a,
		signalYellow: 0xFFD700,
		signalRed: 0xFF0000,
		signalGreen: 0x00BB00,
		steel: 0x708090,
		dark: 0x1a1a1a,
		orange: 0xFF8C00
	};

	function createRailTrack(x, z, length) {
		var group = new THREE.Group();

		var railGeometry = new THREE.BoxGeometry(0.3, 0.15, length);
		var railMaterial = new THREE.MeshStandardMaterial({ color: colors.steel });
		var leftRail = new THREE.Mesh(railGeometry, railMaterial);
		leftRail.position.x = x - 0.75;
		leftRail.position.y = 0.075;
		group.add(leftRail);

		var rightRail = new THREE.Mesh(railGeometry, railMaterial);
		rightRail.position.x = x + 0.75;
		rightRail.position.y = 0.075;
		group.add(rightRail);

		var numTies = Math.floor(length / 1.2);
		for (var i = 0; i < numTies; i++) {
			var tieGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
			var tieMaterial = new THREE.MeshStandardMaterial({ color: colors.dark });
			var tie = new THREE.Mesh(tieGeometry, tieMaterial);
			tie.rotation.z = Math.PI / 2;
			tie.position.x = x;
			tie.position.y = 0.05;
			tie.position.z = -length / 2 + i * 1.2;
			group.add(tie);
		}

		return group;
	}

	function createTrainCar(type, x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var bodyGeometry, bodyColor, carWidth;
		if (type === 'flatcar') {
			bodyGeometry = new THREE.BoxGeometry(2.2, 1.5, 8);
			bodyColor = colors.rustBrown;
			carWidth = 2.2;
		} else if (type === 'boxcar') {
			bodyGeometry = new THREE.BoxGeometry(2.5, 2.5, 9);
			bodyColor = colors.grimy;
			carWidth = 2.5;
		} else if (type === 'tanker') {
			bodyGeometry = new THREE.BoxGeometry(2.3, 2.0, 10);
			bodyColor = colors.orange;
			carWidth = 2.3;
		} else {
			bodyGeometry = new THREE.BoxGeometry(2.4, 2.2, 8.5);
			bodyColor = colors.rustBrown;
			carWidth = 2.4;
		}

		var bodyMaterial = new THREE.MeshStandardMaterial({
			color: bodyColor,
			roughness: 0.7,
			metalness: 0.3
		});
		var carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
		carBody.position.y = bodyGeometry.parameters.height / 2;
		carBody.castShadow = true;
		carBody.receiveShadow = true;
		group.add(carBody);

		for (var w = -1; w <= 1; w += 2) {
			for (var l = -1; l <= 1; l += 2) {
				var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
				var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
				var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
				wheel.rotation.z = Math.PI / 2;
				wheel.position.x = w * (carWidth / 2 + 0.15);
				wheel.position.y = 0.4;
				wheel.position.z = l * 3.5;
				group.add(wheel);
			}
		}

		meshes.push(carBody);
		return group;
	}

	function createLocomotive(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var bodyGeometry = new THREE.BoxGeometry(2.8, 2.5, 6);
		var bodyMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			roughness: 0.5,
			metalness: 0.6
		});
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 1.25;
		group.add(body);

		var cabGeometry = new THREE.BoxGeometry(2.2, 1.8, 2.0);
		var cabMaterial = new THREE.MeshStandardMaterial({ color: colors.grimy });
		var cab = new THREE.Mesh(cabGeometry, cabMaterial);
		cab.position.y = 2.8;
		cab.position.z = -2.0;
		group.add(cab);

		var smokeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.5, 12);
		var smokeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
		var smokestack = new THREE.Mesh(smokeGeometry, smokeMaterial);
		smokestack.position.y = 3.5;
		smokestack.position.z = -1.5;
		group.add(smokestack);

		for (var i = 0; i < 4; i++) {
			var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 16);
			var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
			var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.x = (i < 2 ? -1.4 : 1.4);
			wheel.position.y = 0.5;
			wheel.position.z = -2.5 + (i % 2) * 5;
			group.add(wheel);
		}

		meshes.push(body);
		meshes.push(cab);
		return group;
	}

	function createRepairGantry(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var baseGeometry = new THREE.BoxGeometry(0.4, 0.3, 8);
		var baseMaterial = new THREE.MeshStandardMaterial({ color: colors.steel });
		var baseLeft = new THREE.Mesh(baseGeometry, baseMaterial);
		baseLeft.position.x = -3.0;
		group.add(baseLeft);

		var baseRight = new THREE.Mesh(baseGeometry, baseMaterial);
		baseRight.position.x = 3.0;
		group.add(baseRight);

		var topGeometry = new THREE.BoxGeometry(6.5, 0.3, 0.6);
		var topMaterial = new THREE.MeshStandardMaterial({ color: colors.grimy });
		var topBeam = new THREE.Mesh(topGeometry, topMaterial);
		topBeam.position.y = 5.5;
		group.add(topBeam);

		var verticalGeometry = new THREE.BoxGeometry(0.3, 5.2, 0.3);
		var verticalLeft = new THREE.Mesh(verticalGeometry, baseMaterial);
		verticalLeft.position.x = -3.0;
		verticalLeft.position.y = 2.75;
		group.add(verticalLeft);

		var verticalRight = new THREE.Mesh(verticalGeometry, baseMaterial);
		verticalRight.position.x = 3.0;
		verticalRight.position.y = 2.75;
		group.add(verticalRight);

		var winchGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
		var winchMaterial = new THREE.MeshStandardMaterial({ color: colors.orange });
		var winch = new THREE.Mesh(winchGeometry, winchMaterial);
		winch.rotation.z = Math.PI / 2;
		winch.position.y = 5.5;
		winch.userData.isWinch = true;
		group.add(winch);

		meshes.push(topBeam);
		return group;
	}

	function createFuelTank(x, y, z, radius, height) {
		var geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
		var material = new THREE.MeshStandardMaterial({
			color: colors.rustBrown,
			roughness: 0.6,
			metalness: 0.4
		});
		var tank = new THREE.Mesh(geometry, material);
		tank.position.set(x, y + height / 2, z);
		tank.castShadow = true;
		tank.receiveShadow = true;
		meshes.push(tank);
		return tank;
	}

	function createMaintenancePit(x, y, z, width, depth) {
		var pitGeometry = new THREE.BoxGeometry(width, 2.0, depth);
		var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
		var pit = new THREE.Mesh(pitGeometry, pitMaterial);
		pit.position.set(x, y - 1.0, z);
		meshes.push(pit);
		return pit;
	}

	function createToolShed(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var wallsGeometry = new THREE.BoxGeometry(3.5, 3.0, 4.5);
		var wallsMaterial = new THREE.MeshStandardMaterial({ color: colors.dark });
		var walls = new THREE.Mesh(wallsGeometry, wallsMaterial);
		walls.position.y = 1.5;
		walls.castShadow = true;
		group.add(walls);

		var roofGeometry = new THREE.ConeGeometry(2.5, 1.2, 4);
		var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.y = 3.1;
		group.add(roof);

		var doorGeometry = new THREE.BoxGeometry(1.2, 2.0, 0.2);
		var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
		var door = new THREE.Mesh(doorGeometry, doorMaterial);
		door.position.set(0, 1.0, 2.35);
		group.add(door);

		meshes.push(walls);
		return group;
	}

	function createSignalTower(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var towerGeometry = new THREE.BoxGeometry(0.8, 6.0, 0.8);
		var towerMaterial = new THREE.MeshStandardMaterial({ color: colors.steel });
		var tower = new THREE.Mesh(towerGeometry, towerMaterial);
		tower.position.y = 3.0;
		group.add(tower);

		var signalColors = [colors.signalRed, colors.signalYellow, colors.signalGreen];
		for (var i = 0; i < 3; i++) {
			var signalGeometry = new THREE.SphereGeometry(0.35, 12, 12);
			var signalMaterial = new THREE.MeshStandardMaterial({
				color: signalColors[i],
				emissive: signalColors[i],
				emissiveIntensity: 0.5
			});
			var signal = new THREE.Mesh(signalGeometry, signalMaterial);
			signal.position.y = 1.5 + i * 1.2;
			signal.position.z = 0.6;
			signal.userData.signalIndex = i;
			signal.userData.isSignal = true;
			group.add(signal);
		}

		meshes.push(tower);
		return group;
	}

	function createCargoPlatform(x, y, z, width, length) {
		var platformGeometry = new THREE.BoxGeometry(width, 0.4, length);
		var platformMaterial = new THREE.MeshStandardMaterial({ color: colors.grimy });
		var platform = new THREE.Mesh(platformGeometry, platformMaterial);
		platform.position.set(x, y, z);
		platform.castShadow = true;
		platform.receiveShadow = true;
		meshes.push(platform);

		for (var i = 0; i < 4; i++) {
			var supportGeometry = new THREE.BoxGeometry(0.3, y - 0.2, 0.3);
			var supportMaterial = new THREE.MeshStandardMaterial({ color: colors.steel });
			var support = new THREE.Mesh(supportGeometry, supportMaterial);
			support.position.x = x - width / 3 + i * width / 4;
			support.position.y = (y - 0.2) / 2;
			support.position.z = z - length / 3 + Math.random() * length / 3;
			scene.add(support);
		}

		return platform;
	}

	function createWaterTower(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var legGeometry = new THREE.BoxGeometry(0.2, 4.0, 0.2);
		var legMaterial = new THREE.MeshStandardMaterial({ color: colors.steel });
		for (var i = 0; i < 4; i++) {
			var leg = new THREE.Mesh(legGeometry, legMaterial);
			leg.position.x = (i < 2 ? -0.8 : 0.8);
			leg.position.y = 2.0;
			leg.position.z = (i % 2 === 0 ? -0.8 : 0.8);
			group.add(leg);
		}

		var tankGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1.8, 16);
		var tankMaterial = new THREE.MeshStandardMaterial({ color: colors.rustBrown });
		var tank = new THREE.Mesh(tankGeometry, tankMaterial);
		tank.position.y = 4.2;
		group.add(tank);

		meshes.push(tank);
		return group;
	}

	function createElectricalWires() {
		var wirePoints = [
			new THREE.Vector3(-15, 7, -20),
			new THREE.Vector3(0, 7, -20),
			new THREE.Vector3(15, 7, -20),
			new THREE.Vector3(15, 7, 0),
			new THREE.Vector3(15, 7, 20),
			new THREE.Vector3(0, 7, 20),
			new THREE.Vector3(-15, 7, 20),
			new THREE.Vector3(-15, 7, 0),
			new THREE.Vector3(-15, 7, -20)
		];

		var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
		var wireMaterial = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 });
		var wires = new THREE.LineSegments(wireGeometry, wireMaterial);
		scene.add(wires);
	}

	function createRepairTorch(x, y, z) {
		var torchGroup = new THREE.Group();
		torchGroup.position.set(x, y, z);

		var rodGeometry = new THREE.BoxGeometry(0.1, 2.0, 0.1);
		var rodMaterial = new THREE.MeshStandardMaterial({ color: colors.dark });
		var rod = new THREE.Mesh(rodGeometry, rodMaterial);
		rod.position.y = 1.0;
		torchGroup.add(rod);

		torchGroup.userData.sparkSource = true;
		torchGroup.userData.sparkX = x;
		torchGroup.userData.sparkY = y + 0.5;
		torchGroup.userData.sparkZ = z;

		return torchGroup;
	}

	function createSparkParticle(x, y, z) {
		var particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
		var particleMaterial = new THREE.MeshStandardMaterial({
			color: colors.signalYellow,
			emissive: colors.signalYellow,
			emissiveIntensity: 0.8
		});
		var particle = new THREE.Mesh(particleGeometry, particleMaterial);
		particle.position.set(x, y, z);
		particle.userData.velocity = {
			x: (Math.random() - 0.5) * 3,
			y: Math.random() * 2,
			z: (Math.random() - 0.5) * 3
		};
		particle.userData.lifespan = 0.8;
		particle.userData.age = 0;
		scene.add(particle);
		sparkParticles.push(particle);
		return particle;
	}

	function updateSparkParticles(delta) {
		for (var i = sparkParticles.length - 1; i >= 0; i--) {
			var particle = sparkParticles[i];
			particle.userData.age += delta;

			if (particle.userData.age >= particle.userData.lifespan) {
				scene.remove(particle);
				sparkParticles.splice(i, 1);
			} else {
				particle.position.x += particle.userData.velocity.x * delta;
				particle.position.y += particle.userData.velocity.y * delta;
				particle.position.z += particle.userData.velocity.z * delta;
				particle.userData.velocity.y -= 5 * delta;

				var alpha = 1 - (particle.userData.age / particle.userData.lifespan);
				particle.material.opacity = alpha;
			}
		}
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		meshes = [];
		sparkParticles = [];

		var groundGeometry = new THREE.BoxGeometry(60, 0.5, 50);
		var groundMaterial = new THREE.MeshStandardMaterial({
			color: 0x3a4a3a,
			roughness: 0.8
		});
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.y = -0.25;
		ground.receiveShadow = true;
		scene.add(ground);

		var track1 = createRailTrack(-3, 0, 40);
		scene.add(track1);
		var track2 = createRailTrack(0, 0, 40);
		scene.add(track2);
		var track3 = createRailTrack(3, 0, 40);
		scene.add(track3);

		scene.add(createTrainCar('boxcar', -3, 0.5, -10));
		scene.add(createTrainCar('flatcar', -3, 0.5, 2));
		scene.add(createTrainCar('tanker', -3, 0.5, 14));
		scene.add(createTrainCar('boxcar', 0, 0.5, -8));
		scene.add(createTrainCar('flatcar', 0, 0.5, 4));
		scene.add(createLocomotive(3, 0.5, -12));

		scene.add(createRepairGantry(10, 0, 5));
		scene.add(createRepairGantry(-8, 0, -10));

		scene.add(createFuelTank(15, 0, -15, 1.5, 3.5));
		scene.add(createFuelTank(18, 0, -10, 1.3, 3.0));
		scene.add(createFuelTank(15, 0, 5, 1.4, 3.2));

		scene.add(createMaintenancePit(12, 0, 15, 4.5, 6.0));

		scene.add(createToolShed(-14, 0, 10));
		scene.add(createToolShed(20, 0, -18));

		scene.add(createSignalTower(-12, 0, -15));
		scene.add(createSignalTower(18, 0, 15));

		scene.add(createCargoPlatform(-10, 1.5, 18, 5.5, 8.0));
		scene.add(createCargoPlatform(8, 1.2, -20, 6.0, 7.5));

		scene.add(createWaterTower(22, 0, 10));

		scene.add(createRepairTorch(11, 1.5, 16));
		scene.add(createRepairTorch(13, 1.2, 14));

		createElectricalWires();

		spawnPoints = [
			new THREE.Vector3(-3, 2, -18),
			new THREE.Vector3(0, 2, 10),
			new THREE.Vector3(3, 2, 15),
			new THREE.Vector3(8, 2, 8),
			new THREE.Vector3(-8, 2, 3)
		];

		for (var i = 0; i < 3; i++) {
			var guardGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
			var guardMaterial = new THREE.MeshStandardMaterial({ color: 0x2a5a2a });
			var guard = new THREE.Mesh(guardGeometry, guardMaterial);
			guard.position.set(5 + i * 3, 0.9, -8 + i * 4);
			guard.userData.isGuard = true;
			guard.userData.patrolPath = [
				{ x: 5 + i * 3, z: -8 + i * 4 },
				{ x: 8 + i * 3, z: -5 + i * 4 }
			];
			guard.userData.patrolIndex = 0;
			guard.userData.speed = 1.5;
			scene.add(guard);
			guardMeshes.push(guard);
		}
	}

	function update(delta) {
		steamTime += delta;
		craneAngle += delta * 0.3;
		signalLightTime += delta;
		gaugeRotation += delta * 0.5;
		guardPatrolTime += delta;

		updateSparkParticles(delta);

		if (steamTime > 0.5) {
			var torches = scene.children.filter(function(child) {
				return child.userData && child.userData.sparkSource;
			});
			torches.forEach(function(torch) {
				for (var i = 0; i < 2; i++) {
					createSparkParticle(
						torch.userData.sparkX + (Math.random() - 0.5) * 0.3,
						torch.userData.sparkY + (Math.random() - 0.5) * 0.3,
						torch.userData.sparkZ + (Math.random() - 0.5) * 0.3
					);
				}
			});
			steamTime = 0;
		}

		scene.children.forEach(function(child) {
			if (child instanceof THREE.Group) {
				var winch = child.getObjectByProperty('userData', { isWinch: true });
				if (winch) {
					winch.rotation.x += delta * 1.2;
				}
			}
		});

		var signalLightCycle = Math.floor(signalLightTime / 1.5) % 3;
		scene.children.forEach(function(child) {
			if (child instanceof THREE.Group) {
				child.children.forEach(function(grandchild) {
					if (grandchild.userData && grandchild.userData.isSignal) {
						var index = grandchild.userData.signalIndex;
						if (index === signalLightCycle) {
							grandchild.material.emissiveIntensity = 0.8 + 0.3 * Math.sin(signalLightTime * 3);
						} else {
							grandchild.material.emissiveIntensity = 0.1;
						}
					}
				});
			}
		});

		guardMeshes.forEach(function(guard) {
			var path = guard.userData.patrolPath;
			var currentTarget = path[guard.userData.patrolIndex];
			var dx = currentTarget.x - guard.position.x;
			var dz = currentTarget.z - guard.position.z;
			var distance = Math.sqrt(dx * dx + dz * dz);

			if (distance < 0.5) {
				guard.userData.patrolIndex = (guard.userData.patrolIndex + 1) % path.length;
			} else {
				var moveSpeed = guard.userData.speed * delta;
				guard.position.x += (dx / distance) * moveSpeed;
				guard.position.z += (dz / distance) * moveSpeed;
			}
		});
	}

	function reset() {
		if (scene) {
			for (var i = scene.children.length - 1; i >= 0; i--) {
				var child = scene.children[i];
				if (child !== camera) {
					scene.remove(child);
				}
			}
		}
		meshes = [];
		sparkParticles = [];
		spawnPoints = [];
		guardMeshes = [];
		craneAngle = 0;
		steamTime = 0;
		signalLightTime = 0;
		gaugeRotation = 0;
		guardPatrolTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset,
		getSpawnPoints: function() { return spawnPoints; },
		getMeshes: function() { return meshes; },
		getGuards: function() { return guardMeshes; }
	};
}());
