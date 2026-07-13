window.LavaBridge = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var lavaBlocks = [];
	var geysers = [];
	var bubbles = [];
	var heatShimmer = [];
	var gasClouds = [];
	var time = 0;

	function createLavaLake() {
		var lavaGroup = new THREE.Group();
		var blockSize = 20;
		var gridSize = 8;
		var lavaColor = new THREE.Color(0xff6600);
		var darkLavaColor = new THREE.Color(0xcc3300);

		for (var x = 0; x < gridSize; x++) {
			for (var z = 0; z < gridSize; z++) {
				var geometry = new THREE.BoxGeometry(blockSize, 8, blockSize);
				var material = new THREE.MeshStandardMaterial({
					color: Math.random() > 0.5 ? lavaColor : darkLavaColor,
					emissive: lavaColor,
					emissiveIntensity: 0.4,
					roughness: 0.6,
					metalness: 0.1
				});
				var block = new THREE.Mesh(geometry, material);
				block.position.set(x * blockSize - 70, -5, z * blockSize - 70);
				block.receiveShadow = true;
				block.castShadow = true;
				block.userData.baseY = block.position.y;
				block.userData.offset = Math.random() * Math.PI * 2;
				lavaGroup.add(block);
				lavaBlocks.push(block);
			}
		}
		return lavaGroup;
	}

	function createBridges() {
		var bridgeGroup = new THREE.Group();
		var stoneColor = 0x8b7355;

		// Bridge 1 - Main path
		var bridge1 = createBridge(0, 5, -40, 0, stoneColor);
		bridgeGroup.add(bridge1);

		// Bridge 2 - Left path, elevated
		var bridge2 = createBridge(-35, 8, 0, Math.PI / 6, stoneColor);
		bridgeGroup.add(bridge2);

		// Bridge 3 - Right path, lower
		var bridge3 = createBridge(35, 2, 0, -Math.PI / 6, stoneColor);
		bridgeGroup.add(bridge3);

		return bridgeGroup;
	}

	function createBridge(startX, height, startZ, rotation, color) {
		var bridgeGroup = new THREE.Group();
		var segmentLength = 15;
		var numSegments = 10;
		var width = 8;
		var thickness = 2;

		for (var i = 0; i < numSegments; i++) {
			// Skip some segments to create damage/gaps
			var hasDamage = (i === 4 || i === 7);
			if (hasDamage && Math.random() > 0.6) {
				continue;
			}

			var geometry = new THREE.BoxGeometry(width, thickness, segmentLength);
			var material = new THREE.MeshStandardMaterial({
				color: color,
				roughness: 0.8,
				metalness: 0.05
			});
			var segment = new THREE.Mesh(geometry, material);
			segment.position.set(
				startX + Math.cos(rotation) * (i * segmentLength),
				height + Math.sin(rotation) * (i * segmentLength) * 0.3,
				startZ + Math.sin(rotation) * (i * segmentLength)
			);
			segment.castShadow = true;
			segment.receiveShadow = true;

			// Add crumbling edges
			if (hasDamage) {
				var crumbleGeometry = new THREE.BoxGeometry(width - 2, thickness + 1, segmentLength);
				var crumbleMaterial = new THREE.MeshStandardMaterial({
					color: 0x4a4a4a,
					roughness: 0.9
				});
				var crumble = new THREE.Mesh(crumbleGeometry, crumbleMaterial);
				crumble.position.copy(segment.position);
				crumble.position.y -= 1;
				crumble.castShadow = true;
				bridgeGroup.add(crumble);
			}

			bridgeGroup.add(segment);
		}

		return bridgeGroup;
	}

	function createVolcanicIslands() {
		var islandGroup = new THREE.Group();

		// Island 1 - North
		var island1 = createIsland(-50, 0, -50, 0x3d2817);
		islandGroup.add(island1);

		// Island 2 - South
		var island2 = createIsland(50, 0, 50, 0x3d2817);
		islandGroup.add(island2);

		// Island 3 - West
		var island3 = createIsland(-70, 0, 20, 0x3d2817);
		islandGroup.add(island3);

		return islandGroup;
	}

	function createIsland(x, y, z, color) {
		var islandGroup = new THREE.Group();

		// Main landmass
		var baseGeometry = new THREE.BoxGeometry(30, 15, 30);
		var baseMaterial = new THREE.MeshStandardMaterial({
			color: color,
			roughness: 0.9,
			metalness: 0
		});
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(x, y, z);
		base.castShadow = true;
		base.receiveShadow = true;
		islandGroup.add(base);

		// Fortification walls
		var wallHeight = 12;
		var wallThickness = 2;
		var wall1Geometry = new THREE.BoxGeometry(25, wallHeight, wallThickness);
		var wallMaterial = new THREE.MeshStandardMaterial({
			color: 0x2a1810,
			roughness: 0.8
		});
		var wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
		wall1.position.set(x, y + 8, z - 14);
		wall1.castShadow = true;
		islandGroup.add(wall1);

		// Guard tower
		var towerGeometry = new THREE.CylinderGeometry(4, 4, 18, 8);
		var towerMaterial = new THREE.MeshStandardMaterial({
			color: 0x3d2817,
			roughness: 0.85
		});
		var tower = new THREE.Mesh(towerGeometry, towerMaterial);
		tower.position.set(x - 10, y + 9, z + 10);
		tower.castShadow = true;
		islandGroup.add(tower);

		// Watchtower cone roof
		var roofGeometry = new THREE.ConeGeometry(5, 8, 8);
		var roofMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a0f0a
		});
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(x - 10, y + 18, z + 10);
		roof.castShadow = true;
		islandGroup.add(roof);

		return islandGroup;
	}

	function createLavaGeysers() {
		var geyserGroup = new THREE.Group();

		var geyserPositions = [
			{ x: -40, z: -30 },
			{ x: 20, z: 20 },
			{ x: -60, z: 50 },
			{ x: 50, z: -40 }
		];

		for (var i = 0; i < geyserPositions.length; i++) {
			var pos = geyserPositions[i];
			var geyser = createGeyser(pos.x, pos.z);
			geyser.userData.index = i;
			geyser.userData.phaseOffset = i * Math.PI / 2;
			geyserGroup.add(geyser);
			geysers.push(geyser);
		}

		return geyserGroup;
	}

	function createGeyser(x, z) {
		var geyserGroup = new THREE.Group();

		// Vent pipe
		var ventGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 16);
		var ventMaterial = new THREE.MeshStandardMaterial({
			color: 0x4a4a4a,
			roughness: 0.7
		});
		var vent = new THREE.Mesh(ventGeometry, ventMaterial);
		vent.position.y = 0;
		vent.castShadow = true;
		geyserGroup.add(vent);

		// Lava fountain - spawned dynamically
		var fountainGeometry = new THREE.SphereGeometry(0.8, 6, 6);
		var fountainMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6600,
			emissive: 0xff6600,
			emissiveIntensity: 0.8,
			roughness: 0.4
		});

		for (var i = 0; i < 6; i++) {
			var sphere = new THREE.Mesh(fountainGeometry, fountainMaterial);
			sphere.position.y = 0;
			sphere.userData.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 0.4,
				Math.random() * 0.8 + 0.5,
				(Math.random() - 0.5) * 0.4
			);
			sphere.userData.life = 0;
			sphere.userData.maxLife = 2;
			geyserGroup.add(sphere);
		}

		geyserGroup.position.set(x, -2, z);
		return geyserGroup;
	}

	function createObsidianColumns() {
		var columnGroup = new THREE.Group();
		var columnPositions = [
			{ x: -30, z: 30 },
			{ x: 40, z: -20 },
			{ x: -80, z: 0 },
			{ x: 60, z: 60 }
		];

		for (var i = 0; i < columnPositions.length; i++) {
			var pos = columnPositions[i];
			var height = 25 + Math.random() * 15;
			var geometry = new THREE.CylinderGeometry(2.5, 3, height, 12);
			var material = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				roughness: 0.5,
				metalness: 0.3
			});
			var column = new THREE.Mesh(geometry, material);
			column.position.set(pos.x, height / 2 - 5, pos.z);
			column.castShadow = true;
			column.receiveShadow = true;
			columnGroup.add(column);
		}

		return columnGroup;
	}

	function createLavaWaterfall() {
		var waterfallGroup = new THREE.Group();

		// Source cliff
		var cliffGeometry = new THREE.BoxGeometry(12, 20, 8);
		var cliffMaterial = new THREE.MeshStandardMaterial({
			color: 0x3d2817,
			roughness: 0.9
		});
		var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
		cliff.position.set(-50, 25, -70);
		cliff.castShadow = true;
		waterfallGroup.add(cliff);

		// Waterfall column (animated lava falling)
		var waterfallGeometry = new THREE.CylinderGeometry(3, 2.5, 35, 12);
		var waterfallMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6600,
			emissive: 0xff4400,
			emissiveIntensity: 0.6,
			roughness: 0.5,
			transparent: true,
			opacity: 0.8
		});
		var waterfall = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
		waterfall.position.set(-50, 5, -70);
		waterfall.castShadow = true;
		waterfallGroup.add(waterfall);
		waterfallGroup.userData.waterfall = waterfall;

		return waterfallGroup;
	}

	function createHeatShimmer() {
		var shimmerGroup = new THREE.Group();

		for (var i = 0; i < 5; i++) {
			var geometry = new THREE.BoxGeometry(160, 0.5, 160);
			var material = new THREE.MeshStandardMaterial({
				color: 0xffccaa,
				transparent: true,
				opacity: 0.1,
				emissive: 0xff6600,
				emissiveIntensity: 0.2
			});
			var shimmer = new THREE.Mesh(geometry, material);
			shimmer.position.y = 5 + i * 4;
			shimmer.userData.baseY = shimmer.position.y;
			shimmer.userData.phaseOffset = i * Math.PI / 5;
			shimmerGroup.add(shimmer);
			heatShimmer.push(shimmer);
		}

		return shimmerGroup;
	}

	function createGasClouds() {
		var cloudGroup = new THREE.Group();
		var cloudPositions = [
			{ x: -70, z: -50 },
			{ x: 30, z: 40 },
			{ x: -40, z: 10 }
		];

		for (var i = 0; i < cloudPositions.length; i++) {
			var pos = cloudPositions[i];
			var cloud = createGasCloud(pos.x, pos.z);
			cloudGroup.add(cloud);
			gasClouds.push(cloud);
		}

		return cloudGroup;
	}

	function createGasCloud(x, z) {
		var cloudGroup = new THREE.Group();

		for (var i = 0; i < 8; i++) {
			var geometry = new THREE.SphereGeometry(2 + Math.random() * 1.5, 8, 8);
			var material = new THREE.MeshStandardMaterial({
				color: 0xdddd00,
				transparent: true,
				opacity: 0.3,
				emissive: 0xaaaa00,
				emissiveIntensity: 0.4
			});
			var sphere = new THREE.Mesh(geometry, material);
			sphere.position.set(
				(Math.random() - 0.5) * 8,
				8 + Math.random() * 5,
				(Math.random() - 0.5) * 8
			);
			sphere.userData.baseX = sphere.position.x;
			sphere.userData.baseZ = sphere.position.z;
			sphere.userData.driftSpeed = 0.3 + Math.random() * 0.2;
			sphere.userData.phaseOffset = Math.random() * Math.PI * 2;
			cloudGroup.add(sphere);
		}

		cloudGroup.position.set(x, 2, z);
		cloudGroup.userData.baseX = x;
		cloudGroup.userData.baseZ = z;
		cloudGroup.userData.driftPhase = Math.random() * Math.PI * 2;

		return cloudGroup;
	}

	function createBubbles() {
		for (var i = 0; i < 20; i++) {
			var geometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 6, 6);
			var material = new THREE.MeshStandardMaterial({
				color: 0xff8833,
				transparent: true,
				opacity: 0.6,
				emissive: 0xff6600,
				emissiveIntensity: 0.3
			});
			var bubble = new THREE.Mesh(geometry, material);
			bubble.position.set(
				Math.random() * 160 - 80,
				-2 + Math.random() * 2,
				Math.random() * 160 - 80
			);
			bubble.userData.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 0.1,
				0.2 + Math.random() * 0.1,
				(Math.random() - 0.5) * 0.1
			);
			bubble.userData.life = 0;
			bubble.userData.maxLife = 3 + Math.random() * 2;
			scene.add(bubble);
			bubbles.push(bubble);
		}
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		time = 0;

		// Add lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
		directionalLight.position.set(100, 80, 100);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -150;
		directionalLight.shadow.camera.right = 150;
		directionalLight.shadow.camera.top = 150;
		directionalLight.shadow.camera.bottom = -150;
		scene.add(directionalLight);

		// Add fog for atmosphere
		scene.fog = new THREE.FogExp2(0xff6600, 0.002);

		// Build level
		var lavaLake = createLavaLake();
		scene.add(lavaLake);

		var bridges = createBridges();
		scene.add(bridges);

		var islands = createVolcanicIslands();
		scene.add(islands);

		var geysers = createLavaGeysers();
		scene.add(geysers);

		var obsidian = createObsidianColumns();
		scene.add(obsidian);

		var waterfall = createLavaWaterfall();
		scene.add(waterfall);

		var shimmer = createHeatShimmer();
		scene.add(shimmer);

		var clouds = createGasClouds();
		scene.add(clouds);

		createBubbles();
	}

	function update(delta) {
		time += delta;

		// Animate lava blocks with wave pattern
		for (var i = 0; i < lavaBlocks.length; i++) {
			var block = lavaBlocks[i];
			var wave = Math.sin(time * 1.5 + block.userData.offset) * 0.3;
			block.position.y = block.userData.baseY + wave;
		}

		// Update geysers
		for (var j = 0; j < geysers.length; j++) {
			var geyser = geysers[j];
			var geyserPhase = Math.sin(time * 2 + geyser.userData.phaseOffset);

			for (var k = 0; k < geyser.children.length; k++) {
				var particle = geyser.children[k];
				if (particle.userData.velocity) {
					particle.userData.life += delta;
					var lifeRatio = particle.userData.life / particle.userData.maxLife;

					if (lifeRatio < 1) {
						particle.position.x += particle.userData.velocity.x * delta;
						particle.position.y += particle.userData.velocity.y * delta;
						particle.position.z += particle.userData.velocity.z * delta;
						particle.userData.velocity.y -= 0.5 * delta; // gravity

						var alpha = 1 - lifeRatio;
						particle.material.opacity = Math.max(0, alpha * 0.7);
					} else {
						particle.userData.life = 0;
						particle.position.y = 0;
					}
				}
			}
		}

		// Update bubbles
		for (var b = 0; b < bubbles.length; b++) {
			var bubble = bubbles[b];
			bubble.userData.life += delta;
			var bubbleLife = bubble.userData.life / bubble.userData.maxLife;

			if (bubbleLife < 1) {
				bubble.position.add(bubble.userData.velocity);
				var bubbleAlpha = Math.max(0, 1 - bubbleLife);
				bubble.material.opacity = bubbleAlpha * 0.6;
				bubble.scale.setScalar(Math.max(0.1, 1 - bubbleLife * 0.5));
			} else {
				bubble.userData.life = 0;
				bubble.position.set(
					Math.random() * 160 - 80,
					-2,
					Math.random() * 160 - 80
				);
				bubble.scale.setScalar(1);
			}
		}

		// Update heat shimmer
		for (var h = 0; h < heatShimmer.length; h++) {
			var shimmer = heatShimmer[h];
			var shimmerWave = Math.sin(time * 0.8 + shimmer.userData.phaseOffset) * 2;
			shimmer.position.y = shimmer.userData.baseY + shimmerWave;
			shimmer.rotation.z += 0.02;
		}

		// Update gas clouds
		for (var c = 0; c < gasClouds.length; c++) {
			var cloud = gasClouds[c];
			cloud.userData.driftPhase += delta * 0.5;
			var driftX = Math.cos(cloud.userData.driftPhase) * 15;
			var driftZ = Math.sin(cloud.userData.driftPhase) * 15;

			for (var s = 0; s < cloud.children.length; s++) {
				var sphere = cloud.children[s];
				sphere.position.x = sphere.userData.baseX + driftX + Math.sin(time * sphere.userData.driftSpeed) * 3;
				sphere.position.z = sphere.userData.baseZ + driftZ + Math.cos(time * sphere.userData.driftSpeed) * 3;
			}
		}

		// Animate waterfall
		var waterfallData = scene.children.find(function(child) {
			return child.userData.waterfall;
		});
		if (waterfallData) {
			var wf = waterfallData.userData.waterfall;
			wf.rotation.z = Math.sin(time * 1.2) * 0.1;
		}
	}

	function reset() {
		time = 0;
		lavaBlocks = [];
		geysers = [];
		bubbles = [];
		heatShimmer = [];
		gasClouds = [];

		for (var i = scene.children.length - 1; i >= 0; i--) {
			var child = scene.children[i];
			if (child instanceof THREE.Light || child.userData.isLevel) {
				continue;
			}
			scene.remove(child);
		}

		if (camera) {
			camera.position.set(0, 10, 30);
			camera.lookAt(0, 5, 0);
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
