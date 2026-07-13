window.CaveAmbush = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var caveWalls = [];
	var riverBlocks = [];
	var stalactites = [];
	var stalagmites = [];
	var sniperPerches = [];
	var tripwires = [];
	var tripwireIndicators = [];
	var supplyCrates = [];
	var mushrooms = [];
	var crystalFormations = [];
	var ropeCrossing = null;
	var ropeHandholds = [];
	var bats = [];
	var rockSlide = [];
	var totalTime = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		buildCaveWalls();
		buildUndergroundRiver();
		buildStalactites();
		buildStalagmites();
		buildSniperPerches();
		buildTripwires();
		buildSupplyCrates();
		buildMushrooms();
		buildCrystalFormations();
		buildRopeCrossing();
		buildBatSwarm();
		buildRockSlide();
	}

	function buildCaveWalls() {
		var colors = [0x6B5344, 0x8B7355, 0x5C4033, 0x7B6D5D, 0x4A4A42];
		var positions = [
			{x: -20, y: 0, z: 0, w: 15, h: 12, d: 60},
			{x: 20, y: 0, z: 0, w: 15, h: 12, d: 60},
			{x: 0, y: -8, z: 0, w: 50, h: 8, d: 60},
			{x: -5, y: 8, z: 10, w: 8, h: 8, d: 20},
			{x: 5, y: 8, z: 10, w: 8, h: 8, d: 20},
			{x: -15, y: 5, z: 30, w: 10, h: 10, d: 15},
			{x: 15, y: 5, z: 30, w: 10, h: 10, d: 15},
			{x: -8, y: 6, z: 50, w: 12, h: 10, d: 15},
			{x: 8, y: 6, z: 50, w: 12, h: 10, d: 15}
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var color = colors[i % colors.length];
			var geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
			var material = new THREE.MeshStandardMaterial({color: color});
			var wall = new THREE.Mesh(geometry, material);
			wall.position.set(pos.x, pos.y, pos.z);
			scene.add(wall);
			caveWalls.push(wall);
		}
	}

	function buildUndergroundRiver() {
		var riverLength = 60;
		var blockSize = 3;
		var blocksPerSegment = Math.floor(riverLength / blockSize);

		for (var i = 0; i < blocksPerSegment; i++) {
			var z = i * blockSize - riverLength / 2;
			var geometry = new THREE.BoxGeometry(8, 1.5, blockSize);
			var material = new THREE.MeshStandardMaterial({
				color: 0x1a1a4d,
				metalness: 0.4,
				roughness: 0.3
			});
			var riverBlock = new THREE.Mesh(geometry, material);
			riverBlock.position.set(0, -6, z);
			riverBlock.userData.baseY = -6;
			riverBlock.userData.time = i * 0.5;
			scene.add(riverBlock);
			riverBlocks.push(riverBlock);
		}
	}

	function buildStalactites() {
		var stalactitePositions = [
			{x: -12, z: 15},
			{x: -6, z: 20},
			{x: 0, z: 25},
			{x: 6, z: 18},
			{x: 12, z: 22},
			{x: -15, z: 35},
			{x: -8, z: 40},
			{x: 8, z: 38},
			{x: 14, z: 42},
			{x: 0, z: 55}
		];

		for (var i = 0; i < stalactitePositions.length; i++) {
			var pos = stalactitePositions[i];
			var height = 2 + Math.random() * 3;
			var radius = 0.4 + Math.random() * 0.3;
			var geometry = new THREE.ConeGeometry(radius, height, 8);
			var material = new THREE.MeshStandardMaterial({
				color: 0x7B6D5D,
				roughness: 0.8
			});
			var stalactite = new THREE.Mesh(geometry, material);
			stalactite.position.set(pos.x, 8 - height / 2, pos.z);
			scene.add(stalactite);
			stalactites.push(stalactite);
		}
	}

	function buildStalagmites() {
		var stalagmitePositions = [
			{x: -14, z: 12},
			{x: -4, z: 16},
			{x: 4, z: 14},
			{x: 10, z: 19},
			{x: -10, z: 32},
			{x: 6, z: 36},
			{x: 12, z: 40},
			{x: -2, z: 48},
			{x: 8, z: 52}
		];

		for (var i = 0; i < stalagmitePositions.length; i++) {
			var pos = stalagmitePositions[i];
			var height = 1.5 + Math.random() * 2.5;
			var radius = 0.3 + Math.random() * 0.25;
			var geometry = new THREE.ConeGeometry(radius, height, 8);
			var material = new THREE.MeshStandardMaterial({
				color: 0x6B5344,
				roughness: 0.8
			});
			var stalagmite = new THREE.Mesh(geometry, material);
			stalagmite.position.set(pos.x, -6.5 + height / 2, pos.z);
			stalagmite.rotation.z = Math.PI;
			scene.add(stalagmite);
			stalagmites.push(stalagmite);
		}
	}

	function buildSniperPerches() {
		var perches = [
			{x: -18, z: 25, width: 8, depth: 6},
			{x: 18, z: 35, width: 8, depth: 6},
			{x: -12, z: 48, width: 6, depth: 5}
		];

		for (var i = 0; i < perches.length; i++) {
			var perch = perches[i];
			var platformGeometry = new THREE.BoxGeometry(perch.width, 1, perch.depth);
			var platformMaterial = new THREE.MeshStandardMaterial({color: 0x3D3D3D});
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set(perch.x, 3, perch.z);
			scene.add(platform);
			sniperPerches.push(platform);

			// Sandbag protection
			var sandbagGeometry = new THREE.BoxGeometry(perch.width - 1, 0.8, 0.8);
			var sandbagMaterial = new THREE.MeshStandardMaterial({color: 0xBEAA76});
			var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
			sandbag.position.set(perch.x, 3.8, perch.z + perch.depth / 2 - 0.5);
			scene.add(sandbag);
			sniperPerches.push(sandbag);
		}
	}

	function buildTripwires() {
		var wirePositions = [
			{x: -8, z: 20, length: 12},
			{x: 5, z: 28, length: 14},
			{x: -12, z: 38, length: 10},
			{x: 10, z: 45, length: 12}
		];

		for (var i = 0; i < wirePositions.length; i++) {
			var wire = wirePositions[i];
			var points = [
				new THREE.Vector3(wire.x - wire.length / 2, -4, wire.z),
				new THREE.Vector3(wire.x + wire.length / 2, -4, wire.z)
			];
			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var material = new THREE.LineBasicMaterial({color: 0xFF6B6B, linewidth: 2});
			var tripwire = new THREE.LineSegments(geometry, material);
			scene.add(tripwire);
			tripwires.push(tripwire);

			// Indicator lights
			var indicatorGeometry = new THREE.SphereGeometry(0.3, 8, 8);
			var indicatorMaterial = new THREE.MeshStandardMaterial({
				color: 0xFF0000,
				emissive: 0xFF0000,
				emissiveIntensity: 0.5
			});
			var indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
			indicator.position.set(wire.x, -4, wire.z);
			indicator.userData.baseIntensity = 0.5;
			scene.add(indicator);
			tripwireIndicators.push(indicator);
		}
	}

	function buildSupplyCrates() {
		var cratePositions = [
			{x: -16, y: -5.5, z: 15},
			{x: 14, y: -5.5, z: 22},
			{x: -14, y: -5.5, z: 42},
			{x: 12, y: -5.5, z: 50}
		];

		for (var i = 0; i < cratePositions.length; i++) {
			var pos = cratePositions[i];
			var geometry = new THREE.BoxGeometry(2.5, 2, 2.5);
			var material = new THREE.MeshStandardMaterial({color: 0x8B4513});
			var crate = new THREE.Mesh(geometry, material);
			crate.position.set(pos.x, pos.y, pos.z);
			scene.add(crate);
			supplyCrates.push(crate);
		}
	}

	function buildMushrooms() {
		var mushroomPositions = [
			{x: -10, z: 18},
			{x: 8, z: 24},
			{x: -6, z: 32},
			{x: 10, z: 40},
			{x: -2, z: 55}
		];

		for (var i = 0; i < mushroomPositions.length; i++) {
			var pos = mushroomPositions[i];

			// Stem
			var stemGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8);
			var stemMaterial = new THREE.MeshStandardMaterial({color: 0xD4A574});
			var stem = new THREE.Mesh(stemGeometry, stemMaterial);
			stem.position.set(pos.x, -5.5, pos.z);
			scene.add(stem);
			mushrooms.push(stem);

			// Cap
			var capGeometry = new THREE.SphereGeometry(0.6, 8, 8);
			var capMaterial = new THREE.MeshStandardMaterial({
				color: 0xA0522D,
				emissive: 0x664C2F,
				emissiveIntensity: 0.3
			});
			var cap = new THREE.Mesh(capGeometry, capMaterial);
			cap.position.set(pos.x, -4.5, pos.z);
			cap.userData.baseEmissiveIntensity = 0.3;
			scene.add(cap);
			mushrooms.push(cap);
		}
	}

	function buildCrystalFormations() {
		var crystalPositions = [
			{x: -18, y: -4, z: 28},
			{x: 16, y: -3.5, z: 33},
			{x: -14, y: -4.2, z: 44}
		];

		for (var i = 0; i < crystalPositions.length; i++) {
			var pos = crystalPositions[i];

			for (var j = 0; j < 4; j++) {
				var offsetX = (Math.random() - 0.5) * 2;
				var offsetZ = (Math.random() - 0.5) * 2;
				var height = 1.5 + Math.random() * 1.5;
				var radius = 0.2 + Math.random() * 0.15;

				var geometry = new THREE.ConeGeometry(radius, height, 6);
				var material = new THREE.MeshStandardMaterial({
					color: 0xE0E0FF,
					emissive: 0xB0B0FF,
					emissiveIntensity: 0.2,
					metalness: 0.3,
					roughness: 0.2
				});
				var crystal = new THREE.Mesh(geometry, material);
				crystal.position.set(pos.x + offsetX, pos.y + height / 2, pos.z + offsetZ);
				crystal.rotation.z = (Math.random() - 0.5) * Math.PI;
				crystal.userData.baseEmissiveIntensity = 0.2;
				scene.add(crystal);
				crystalFormations.push(crystal);
			}
		}
	}

	function buildRopeCrossing() {
		var ropeStartZ = 5;
		var ropeEndZ = 15;
		var ropePoints = [
			new THREE.Vector3(-6, 2, ropeStartZ),
			new THREE.Vector3(0, 0.5, (ropeStartZ + ropeEndZ) / 2),
			new THREE.Vector3(6, 2, ropeEndZ)
		];

		var geometry = new THREE.BufferGeometry().setFromPoints(ropePoints);
		var material = new THREE.LineBasicMaterial({color: 0x8B4513, linewidth: 2});
		ropeCrossing = new THREE.LineSegments(geometry, material);
		scene.add(ropeCrossing);

		// Rope handholds
		var handholdPositions = [
			{x: -4, y: 2.5, z: 7},
			{x: -1, y: 1.5, z: 10},
			{x: 3, y: 2.3, z: 13}
		];

		for (var i = 0; i < handholdPositions.length; i++) {
			var pos = handholdPositions[i];
			var geometry = new THREE.BoxGeometry(0.8, 0.4, 0.4);
			var material = new THREE.MeshStandardMaterial({color: 0x8B4513});
			var handhold = new THREE.Mesh(geometry, material);
			handhold.position.set(pos.x, pos.y, pos.z);
			scene.add(handhold);
			ropeHandholds.push(handhold);
		}
	}

	function buildBatSwarm() {
		var batCount = 12;
		var ceilingLevel = 7;
		var centerX = 0;
		var centerZ = 30;
		var radius = 8;

		for (var i = 0; i < batCount; i++) {
			var geometry = new THREE.SphereGeometry(0.15, 6, 6);
			var material = new THREE.MeshStandardMaterial({
				color: 0x2C2C2C,
				roughness: 0.9
			});
			var bat = new THREE.Mesh(geometry, material);
			var angle = (i / batCount) * Math.PI * 2;
			bat.position.set(
				centerX + Math.cos(angle) * radius,
				ceilingLevel + (Math.random() - 0.5) * 1.5,
				centerZ + Math.sin(angle) * radius
			);
			bat.userData.angle = angle;
			bat.userData.radius = radius;
			bat.userData.centerX = centerX;
			bat.userData.centerZ = centerZ;
			bat.userData.ceilingLevel = ceilingLevel;
			scene.add(bat);
			bats.push(bat);
		}
	}

	function buildRockSlide() {
		var slidePositions = [
			{x: -8, y: -5.5, z: 55},
			{x: -4, y: -3.5, z: 57},
			{x: 0, y: -5, z: 54},
			{x: 4, y: -2.5, z: 56},
			{x: 8, y: -4.5, z: 55}
		];

		for (var i = 0; i < slidePositions.length; i++) {
			var pos = slidePositions[i];
			var size = 1.5 + Math.random() * 1;
			var geometry = new THREE.BoxGeometry(size, size, size);
			var material = new THREE.MeshStandardMaterial({
				color: 0x5C4033
			});
			var boulder = new THREE.Mesh(geometry, material);
			boulder.position.set(pos.x, pos.y, pos.z);
			boulder.rotation.x = Math.random() * 0.5;
			boulder.rotation.y = Math.random() * 0.5;
			scene.add(boulder);
			rockSlide.push(boulder);
		}
	}

	function update(delta) {
		totalTime += delta;

		// Animate river flow
		for (var i = 0; i < riverBlocks.length; i++) {
			var block = riverBlocks[i];
			var waviness = Math.sin(totalTime + block.userData.time) * 0.15;
			block.position.y = block.userData.baseY + waviness;
		}

		// Animate bat swarm circling
		for (var i = 0; i < bats.length; i++) {
			var bat = bats[i];
			var newAngle = bat.userData.angle + delta * 0.5;
			bat.position.x = bat.userData.centerX + Math.cos(newAngle) * bat.userData.radius;
			bat.position.z = bat.userData.centerZ + Math.sin(newAngle) * bat.userData.radius;
			bat.position.y = bat.userData.ceilingLevel + Math.sin(totalTime + newAngle) * 0.5;
		}

		// Pulse tripwire indicators
		for (var i = 0; i < tripwireIndicators.length; i++) {
			var indicator = tripwireIndicators[i];
			var pulseIntensity = 0.3 + Math.sin(totalTime * 3) * 0.4;
			indicator.material.emissiveIntensity = pulseIntensity;
		}

		// Glow mushroom caps
		for (var i = 0; i < mushrooms.length; i++) {
			var mushroom = mushrooms[i];
			if (mushroom.userData.baseEmissiveIntensity !== undefined) {
				var glowIntensity = mushroom.userData.baseEmissiveIntensity + Math.sin(totalTime * 1.5) * 0.15;
				mushroom.material.emissiveIntensity = glowIntensity;
			}
		}

		// Glow crystal formations
		for (var i = 0; i < crystalFormations.length; i++) {
			var crystal = crystalFormations[i];
			if (crystal.userData.baseEmissiveIntensity !== undefined) {
				var glowIntensity = crystal.userData.baseEmissiveIntensity + Math.sin(totalTime * 2 + i) * 0.15;
				crystal.material.emissiveIntensity = glowIntensity;
			}
		}
	}

	function reset() {
		totalTime = 0;

		for (var i = 0; i < caveWalls.length; i++) {
			scene.remove(caveWalls[i]);
		}
		for (var i = 0; i < riverBlocks.length; i++) {
			scene.remove(riverBlocks[i]);
		}
		for (var i = 0; i < stalactites.length; i++) {
			scene.remove(stalactites[i]);
		}
		for (var i = 0; i < stalagmites.length; i++) {
			scene.remove(stalagmites[i]);
		}
		for (var i = 0; i < sniperPerches.length; i++) {
			scene.remove(sniperPerches[i]);
		}
		for (var i = 0; i < tripwires.length; i++) {
			scene.remove(tripwires[i]);
		}
		for (var i = 0; i < tripwireIndicators.length; i++) {
			scene.remove(tripwireIndicators[i]);
		}
		for (var i = 0; i < supplyCrates.length; i++) {
			scene.remove(supplyCrates[i]);
		}
		for (var i = 0; i < mushrooms.length; i++) {
			scene.remove(mushrooms[i]);
		}
		for (var i = 0; i < crystalFormations.length; i++) {
			scene.remove(crystalFormations[i]);
		}
		for (var i = 0; i < ropeHandholds.length; i++) {
			scene.remove(ropeHandholds[i]);
		}
		if (ropeCrossing) {
			scene.remove(ropeCrossing);
		}
		for (var i = 0; i < bats.length; i++) {
			scene.remove(bats[i]);
		}
		for (var i = 0; i < rockSlide.length; i++) {
			scene.remove(rockSlide[i]);
		}

		caveWalls = [];
		riverBlocks = [];
		stalactites = [];
		stalagmites = [];
		sniperPerches = [];
		tripwires = [];
		tripwireIndicators = [];
		supplyCrates = [];
		mushrooms = [];
		crystalFormations = [];
		ropeCrossing = null;
		ropeHandholds = [];
		bats = [];
		rockSlide = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
